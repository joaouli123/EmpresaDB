from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect, Header, Depends
from typing import Optional, List, Dict, Any
from sqlalchemy import text, or_, and_
from src.database.connection import db_manager
from src.api.models import (
    EstabelecimentoCompleto,
    PaginatedResponse,
    HealthCheck,
    StatsResponse,
    SocioModel,
    CNAEModel,
    MunicipioModel
)
from src.api.auth import get_current_admin_user, get_current_user
from src.api.websocket_manager import ws_manager
from src.api.etl_controller import etl_controller
from src.api.rate_limiter import rate_limiter
import logging
import asyncio
from functools import lru_cache
from datetime import datetime, timedelta, timezone
from src.utils.cnpj_utils import clean_cnpj
from src.utils.security_utils import mask_cpf_socio as _mask_cpf_socio
from src.api.security_logger import log_query
from src.api.cache_redis import cache as shared_cache

# ℹ️ A conexão ao banco vem exclusivamente de DATABASE_URL (variável de ambiente).

logger = logging.getLogger(__name__)

router = APIRouter()

# Cache em memória para resultados (expira em 1 hora)
_cache = {}
_cache_timeout = {}

def get_from_cache(key: str):
    """Retorna do cache se ainda válido"""
    try:
        cached = shared_cache.get(key)
        if cached is not None:
            return cached
    except Exception:
        pass

    if key in _cache:
        if datetime.now() < _cache_timeout.get(key, datetime.min):
            return _cache[key]
        else:
            _cache.pop(key, None)
            _cache_timeout.pop(key, None)
    return None

def set_cache(key: str, value, minutes: int = 60):
    """Salva no cache com tempo de expiração"""
    ttl_seconds = max(1, int(minutes * 60))
    try:
        saved = shared_cache.set(key, value, ttl_seconds=ttl_seconds)
        if saved:
            return
    except Exception:
        pass

    _cache[key] = value
    _cache_timeout[key] = datetime.now() + timedelta(minutes=minutes)

async def verify_api_key(x_api_key: str = Header(None)):
    """
    Verifica se a API Key é válida, verifica assinatura ativa e aplica rate limiting

    Nota: A API externa da Receita Federal pode demorar 30+ segundos para responder.
    Isso é normal e está fora do nosso controle.
    """
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="API Key não fornecida. Use o header 'X-API-Key'"
        )

    user = await db_manager.verify_api_key(x_api_key)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="API Key inválida ou expirada"
        )

    # VERIFICAÇÃO DE ASSINATURA ATIVA (apenas Stripe Subscriptions)
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()

            try:
                # Buscar assinatura válida e ativa do usuário
                # Filtra apenas status válidos (active, trialing, canceled) E que ainda estejam no período pago
                cursor.execute("""
                    SELECT 
                        ss.status,
                        ss.current_period_end,
                        ss.cancel_at_period_end,
                        p.name as plan_name,
                        p.monthly_queries,
                        p.id as plan_id
                    FROM clientes.stripe_subscriptions ss
                    JOIN clientes.plans p ON ss.plan_id = p.id
                    WHERE ss.user_id = %s 
                        AND ss.current_period_end > NOW()
                        AND ss.status IN ('active', 'trialing', 'canceled')
                    ORDER BY ss.created_at DESC
                    LIMIT 1
                """, (user['id'],))
                subscription = cursor.fetchone()

                # Se não tem assinatura Stripe, verificar se deve usar Free Plan
                if not subscription:
                    # Verificar se tem assinatura mas com status problemático (past_due, unpaid, etc)
                    cursor.execute("""
                        SELECT ss.status, ss.current_period_end
                        FROM clientes.stripe_subscriptions ss
                        WHERE ss.user_id = %s
                        ORDER BY ss.created_at DESC
                        LIMIT 1
                    """, (user['id'],))
                    any_subscription = cursor.fetchone()

                    if any_subscription:
                        status = any_subscription[0]
                        period_end = any_subscription[1]

                        # Status com pagamento pendente
                        if status == 'past_due':
                            raise HTTPException(
                                status_code=402,
                                detail={
                                    "error": "payment_past_due",
                                    "message": "Sua assinatura está com pagamento pendente. Por favor, atualize suas informações de pagamento.",
                                    "action_url": "/subscription",
                                    "help": "Acesse a página de assinatura para atualizar seu método de pagamento",
                                    "suggestions": [
                                        "Atualize suas informações de pagamento",
                                        "Verifique se seu cartão não está expirado",
                                        "Entre em contato com seu banco se o problema persistir"
                                    ]
                                }
                            )

                        # Status não pago
                        if status == 'unpaid':
                            raise HTTPException(
                                status_code=402,
                                detail={
                                    "error": "payment_failed",
                                    "message": "Sua assinatura não foi paga. Por favor, atualize suas informações de pagamento para continuar usando a API.",
                                    "action_url": "/subscription",
                                    "help": "Verifique seu método de pagamento e tente novamente",
                                    "suggestions": [
                                        "Atualize seu método de pagamento",
                                        "Verifique se há saldo suficiente",
                                        "Tente usar outro cartão de crédito"
                                    ]
                                }
                            )

                        # Verificar se período expirou (comparação timezone-aware)
                        if period_end:
                            # Garantir que period_end seja timezone-aware
                            if period_end.tzinfo is None:
                                period_end = period_end.replace(tzinfo=timezone.utc)

                            now_utc = datetime.now(timezone.utc)
                            if period_end < now_utc:
                                raise HTTPException(
                                    status_code=403,
                                    detail={
                                        "error": "subscription_expired",
                                        "message": f"Sua assinatura expirou em {period_end.strftime('%d/%m/%Y')}. Por favor, renove sua assinatura para continuar usando a API.",
                                        "expired_date": period_end.strftime('%d/%m/%Y'),
                                        "action_url": "/home#pricing",
                                        "help": "Renove sua assinatura ou escolha um novo plano",
                                        "suggestions": [
                                            "Renove sua assinatura para continuar usando",
                                            "Escolha um novo plano que atenda suas necessidades",
                                            "Entre em contato com o suporte para opções de renovação"
                                        ]
                                    }
                                )

                    # Nenhuma assinatura encontrada ou status inválido
                    # Assumir plano Free (200 consultas/mês)
                    user['plan'] = 'free'
                    user['monthly_queries'] = 200
                    user['queries_remaining'] = 200 # Inicialmente

                    logger.info(f"Usuário {user['id']} usando plano Free (sem assinatura Stripe ativa)")

                else: # Tem assinatura Stripe válida
                    user['plan'] = subscription[3]  # plan_name
                    user['monthly_queries'] = subscription[4]  # monthly_queries
                    plan_id = subscription[5]

                    # Avisar se está cancelada mas ainda ativa
                    if subscription[0] == 'canceled':
                        logger.info(f"Usuário {user['id']} tem assinatura cancelada mas ainda válida até {subscription[1]}")
                    elif subscription[2]:  # cancel_at_period_end
                        logger.info(f"Usuário {user['id']} tem assinatura marcada para cancelar no final do período")

                # VERIFICAÇÃO DE LIMITE MENSAL DE CONSULTAS
                # 🔓 ADMIN TEM CONSULTAS ILIMITADAS - pular verificação de limite
                if user.get('role') != 'admin':
                    month_year = datetime.now().strftime('%Y-%m')
                    cursor.execute("""
                        SELECT queries_used 
                        FROM clientes.monthly_usage
                        WHERE user_id = %s AND month_year = %s
                    """, (user['id'], month_year))
                    usage = cursor.fetchone()

                    queries_used = usage[0] if usage else 0
                    monthly_limit = user.get('monthly_queries', 200) # Default para 200 se não encontrado

                    # Verificar se excedeu o limite
                    if queries_used >= monthly_limit:
                        # Calcular data de renovação
                        period_end = subscription[1] if subscription else None # Pega do subscription se existir
                        renewal_date = "N/A"
                        if period_end:
                            if period_end.tzinfo is None:
                                period_end = period_end.replace(tzinfo=timezone.utc)
                            renewal_date = period_end.strftime('%d/%m/%Y')
                        elif user.get('plan') == 'free':
                            # Para plano Free, renova no início do próximo mês
                            now = datetime.now(timezone.utc)
                            next_month = now.replace(day=1, month=now.month % 12 + 1, year=now.year if now.month < 12 else now.year + 1)
                            renewal_date = next_month.strftime('%d/%m/%Y')

                        raise HTTPException(
                            status_code=429,
                            detail={
                                "error": "monthly_limit_exceeded",
                                "message": f"Você atingiu o limite mensal de {monthly_limit:,} consultas do plano {user.get('plan', 'free')}.",
                                "queries_used": queries_used,
                                "monthly_limit": monthly_limit,
                                "current_plan": user.get('plan', 'free'),
                                "renewal_date": renewal_date,
                                "action_url": "/home#pricing",
                                "help": f"Seu plano será renovado em {renewal_date}. Para continuar usando a API agora, faça upgrade para um plano superior com mais consultas mensais.",
                                "suggestions": [
                                    "Aguarde a renovação do plano",
                                    "Faça upgrade para um plano com mais consultas",
                                    "Entre em contato com o suporte para opções personalizadas"
                                ]
                            }
                        )

                    # Incrementar contador de uso mensal
                    cursor.execute("""
                        INSERT INTO clientes.monthly_usage (user_id, month_year, queries_used, last_query_at)
                        VALUES (%s, %s, 1, NOW())
                        ON CONFLICT (user_id, month_year) 
                        DO UPDATE SET 
                            queries_used = clientes.monthly_usage.queries_used + 1,
                            last_query_at = NOW()
                    """, (user['id'], month_year))

                    # Armazenar informações de uso para logging
                    user['queries_used'] = queries_used + 1  # Incluir esta consulta
                    user['queries_remaining'] = monthly_limit - (queries_used + 1)
                else:
                    # Admin tem acesso ilimitado - configurar valores especiais
                    logger.info(f"✅ Admin user {user['id']} - unlimited queries (no monthly limit)")
                    user['queries_used'] = 0
                    user['queries_remaining'] = 999999999  # Ilimitado

            finally:
                # Garantir que cursor sempre seja fechado
                cursor.close()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao verificar assinatura: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao verificar assinatura. Por favor, tente novamente."
        )

    # Aplicar rate limiting baseado no plano e role do usuário
    # 🔓 Admin tem acesso ilimitado (sem rate limiting)
    user_plan = user.get('plan', 'free')
    user_role = user.get('role', 'user')
    await rate_limiter.check_rate_limit(user['id'], user_plan, user_role)

    # O método verify_api_key já incrementa automaticamente os contadores
    return user

@router.get("/", response_model=HealthCheck)
async def root():
    try:
        if db_manager.test_connection():
            return HealthCheck(
                status="online",
                database="connected",
                message="API de Consulta CNPJ está funcionando!"
            )
    except Exception as e:
        logger.error(f"Erro no health check: {e}")

    return HealthCheck(
        status="online",
        database="error",
        message="API online mas sem conexão com banco de dados"
    )

@router.get("/stats", response_model=StatsResponse)
async def get_stats(current_user: dict = Depends(get_current_user)):
    """
    Retorna estatísticas do banco de dados (DADOS GLOBAIS DO SISTEMA)
    Requer autenticação
    Cache: 10 minutos (contagens são estimativas rápidas)
    """
    cache_key = "stats_cached"

    # Verifica cache primeiro (10 minutos)
    cached_stats = get_from_cache(cache_key)
    if cached_stats:
        return cached_stats

    try:
        stats = StatsResponse(
            total_empresas=db_manager.get_table_count('empresas') or 0,
            total_estabelecimentos=db_manager.get_table_count('estabelecimentos') or 0,
            total_socios=db_manager.get_table_count('socios') or 0,
            total_cnaes=db_manager.get_table_count('cnaes') or 0,
            total_municipios=db_manager.get_table_count('municipios') or 0
        )

        # Cacheia por 10 minutos
        set_cache(cache_key, stats, minutes=10)

        return stats
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cnpj/{cnpj}")
async def get_cnpj_data(
    cnpj: str,
    user: dict = Depends(verify_api_key)
):
    """
    Consulta dados de CNPJ
    Requer autenticação via API Key no header 'X-API-Key'
    Rate limit aplicado conforme plano de assinatura
    """
    cleaned_cnpj = clean_cnpj(cnpj)

    try:
        # Log de auditoria
        await log_query(
            user_id=user['id'],
            action='cnpj_query',
            resource=f'cnpj/{cnpj}',
            details={'plan': user.get('plan', 'free')}
        )

        if not cleaned_cnpj.isdigit():
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "invalid_cnpj_format",
                    "message": "CNPJ inválido. O CNPJ deve conter apenas números.",
                    "received": cnpj,
                    "help": "Forneça um CNPJ válido com 14 dígitos numéricos. Exemplo: 00000000000191 ou 00.000.000/0001-91",
                    "suggestions": [
                        "Remova caracteres especiais (pontos, traços, barras)",
                        "Use apenas números de 0 a 9",
                        "Verifique se o CNPJ foi copiado corretamente"
                    ]
                }
            )

        if len(cleaned_cnpj) != 14:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "invalid_cnpj_length",
                    "message": f"CNPJ inválido. O CNPJ deve ter exatamente 14 dígitos, mas recebeu {len(cleaned_cnpj)}.",
                    "received": cnpj,
                    "received_length": len(cleaned_cnpj),
                    "expected_length": 14,
                    "help": "Forneça um CNPJ válido com 14 dígitos. Exemplo: 00000000000191",
                    "suggestions": [
                        "Verifique se todos os 14 dígitos foram fornecidos",
                        "Não inclua caracteres especiais, apenas números",
                        "Confirme o CNPJ em documentos oficiais"
                    ]
                }
            )

        # Verifica cache primeiro
        cache_key = f"cnpj:{cleaned_cnpj}"
        cached = get_from_cache(cache_key)
        if cached:
            logger.info(f"Cache hit para CNPJ {cleaned_cnpj}")
            return cached

        with db_manager.get_connection() as conn:
            cursor = conn.cursor()

            query = """
                SELECT 
                    cnpj_completo, identificador_matriz_filial, razao_social,
                    nome_fantasia, situacao_cadastral, data_situacao_cadastral,
                    motivo_situacao_cadastral_desc, data_inicio_atividade,
                    cnae_fiscal_principal, cnae_principal_desc,
                    tipo_logradouro, logradouro, numero, complemento, bairro,
                    cep, uf, municipio_desc, ddd_1, telefone_1,
                    correio_eletronico, natureza_juridica, natureza_juridica_desc,
                    porte_empresa, capital_social, opcao_simples, opcao_mei, cnae_fiscal_secundaria
                FROM vw_estabelecimentos_completos
                WHERE cnpj_completo = %s
            """

            cursor.execute(query, (cleaned_cnpj,))
            result = cursor.fetchone()
            cursor.close()

            if not result:
                raise HTTPException(
                    status_code=404,
                    detail={
                        "error": "cnpj_not_found",
                        "message": f"CNPJ {cnpj} não foi encontrado em nossa base de dados.",
                        "cnpj": cnpj,
                        "help": "Verifique se o CNPJ está correto. Nossa base é atualizada periodicamente com dados oficiais da Receita Federal.",
                        "suggestions": [
                            "Confirme se o CNPJ está digitado corretamente",
                            "Verifique se o estabelecimento está ativo na Receita Federal",
                            "Entre em contato com o suporte se acredita que este CNPJ deveria estar disponível"
                        ]
                    }
                )

            columns = [
                'cnpj_completo', 'identificador_matriz_filial', 'razao_social',
                'nome_fantasia', 'situacao_cadastral', 'data_situacao_cadastral',
                'motivo_situacao_cadastral_desc', 'data_inicio_atividade',
                'cnae_fiscal_principal', 'cnae_principal_desc',
                'tipo_logradouro', 'logradouro', 'numero', 'complemento', 'bairro',
                'cep', 'uf', 'municipio_desc', 'ddd_1', 'telefone_1',
                'correio_eletronico', 'natureza_juridica', 'natureza_juridica_desc',
                'porte_empresa', 'capital_social', 'opcao_simples', 'opcao_mei', 'cnae_fiscal_secundaria'
            ]

            data = dict(zip(columns, result))
            data['cnpj_basico'] = cleaned_cnpj[:8]
            data['cnpj_ordem'] = cleaned_cnpj[8:12]
            data['cnpj_dv'] = cleaned_cnpj[12:14]

            # Converter datas para string (formato ISO)
            if data.get('data_situacao_cadastral'):
                data['data_situacao_cadastral'] = str(data['data_situacao_cadastral'])
            if data.get('data_inicio_atividade'):
                data['data_inicio_atividade'] = str(data['data_inicio_atividade'])

            # Buscar CNAEs secundários com descrições
            cnae_secundarios = []
            if data.get('cnae_fiscal_secundaria'):
                codigos = data['cnae_fiscal_secundaria'].split(',')
                codigos = [c.strip() for c in codigos if c.strip()]

                if codigos:
                    placeholders = ','.join(['%s'] * len(codigos))
                    query_cnaes = f"""
                        SELECT codigo, descricao
                        FROM cnaes
                        WHERE codigo IN ({placeholders})
                        ORDER BY codigo
                    """
                    cursor = conn.cursor()
                    cursor.execute(query_cnaes, codigos)
                    cnaes_results = cursor.fetchall()
                    cursor.close()

                    cnae_secundarios = [
                        {'codigo': row[0], 'descricao': row[1]}
                        for row in cnaes_results
                    ]

            data['cnae_secundarios_completos'] = cnae_secundarios

            resultado = EstabelecimentoCompleto(**data)

            # Salva no cache (1 hora)
            set_cache(cache_key, resultado, minutes=60)

            return resultado

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar CNPJ {cleaned_cnpj}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
async def search_companies(
    razao_social: str = Query(None, description="Razão social da empresa"),
    nome_fantasia: str = Query(None, description="Nome fantasia da empresa"),
    cnae: str = Query(None, description="CNAE principal"),
    municipio: str = Query(None, description="Município"),
    uf: str = Query(None, description="UF"),
    situacao: str = Query(None, description="Situação cadastral"),
    data_inicio_atividade_min: str = Query(None, description="Data início atividade mínima (YYYY-MM-DD)"),
    data_inicio_atividade_max: str = Query(None, description="Data início atividade máxima (YYYY-MM-DD)"),
    page: int = Query(None, ge=1, description="Página (compatível com integrações legadas)"),
    per_page: int = Query(None, ge=1, le=1000, description="Itens por página (compatível com integrações legadas)"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(verify_api_key)
):
    """
    Pesquisa empresas por múltiplos critérios
    Acesso controlado por rate limiting baseado no plano do usuário
    """
    try:
        # Log de auditoria
        await log_query(
            user_id=current_user['id'],
            action='search',
            resource='/search',
            details={
                'email': current_user.get('email'),
                'filters': {
                    'razao_social': razao_social,
                    'cnae': cnae,
                    'municipio': municipio,
                    'data_inicio_atividade_min': data_inicio_atividade_min,
                    'data_inicio_atividade_max': data_inicio_atividade_max
                }
            }
        )
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()

            # IMPORTANTE: Desabilitar parallel workers para evitar erro de memória no Replit
            cursor.execute("SET max_parallel_workers_per_gather = 0")

            conditions = []
            params = []

            # Compatibilidade de paginação:
            # - preferir page/per_page quando informados
            # - fallback para limit/offset (padrão atual)
            effective_limit = per_page if per_page is not None else limit
            effective_offset = offset
            if page is not None:
                effective_offset = (page - 1) * effective_limit

            if razao_social:
                conditions.append("razao_social ILIKE %s")
                params.append(f"%{razao_social}%")

            if nome_fantasia:
                conditions.append("nome_fantasia ILIKE %s")
                params.append(f"%{nome_fantasia}%")

            if cnae:
                conditions.append("cnae_fiscal_principal = %s")
                params.append(cnae)

            if municipio:
                municipio_clean = municipio.strip()
                if municipio_clean.isdigit():
                    conditions.append("municipio_desc = (SELECT descricao FROM municipios WHERE codigo = %s LIMIT 1)")
                    params.append(municipio_clean)
                else:
                    conditions.append("municipio_desc ILIKE %s")
                    params.append(f"%{municipio_clean}%")

            if uf:
                conditions.append("uf = %s")
                params.append(uf.upper())

            if situacao:
                conditions.append("situacao_cadastral = %s")
                params.append(situacao)

            if data_inicio_atividade_min:
                # Validar formato YYYY-MM-DD
                try:
                    from datetime import datetime
                    datetime.strptime(data_inicio_atividade_min, '%Y-%m-%d')
                    logger.info(f"🔍 Filtro data_inicio_atividade_min: {data_inicio_atividade_min}")
                    conditions.append("data_inicio_atividade >= %s")
                    params.append(data_inicio_atividade_min)
                except ValueError:
                    logger.error(f"❌ Data mínima inválida: {data_inicio_atividade_min} (esperado YYYY-MM-DD)")
                    raise HTTPException(
                        status_code=400,
                        detail=f"data_inicio_atividade_min deve estar no formato YYYY-MM-DD (ex: 2025-09-01)"
                    )

            if data_inicio_atividade_max:
                # Validar formato YYYY-MM-DD
                try:
                    from datetime import datetime
                    datetime.strptime(data_inicio_atividade_max, '%Y-%m-%d')
                    logger.info(f"🔍 Filtro data_inicio_atividade_max: {data_inicio_atividade_max}")
                    conditions.append("data_inicio_atividade <= %s")
                    params.append(data_inicio_atividade_max)
                except ValueError:
                    logger.error(f"❌ Data máxima inválida: {data_inicio_atividade_max} (esperado YYYY-MM-DD)")
                    raise HTTPException(
                        status_code=400,
                        detail=f"data_inicio_atividade_max deve estar no formato YYYY-MM-DD (ex: 2025-09-02)"
                    )

            where_clause = " AND ".join(conditions) if conditions else "1=1"

            # OTIMIZAÇÃO: Para buscas com ILIKE, fazer COUNT rápido usando EXPLAIN
            # Se a busca tem ILIKE (razao_social ou nome_fantasia), usar estimativa
            use_fast_count = razao_social or nome_fantasia

            if use_fast_count and effective_offset == 0:
                # Para primeira página, usar EXPLAIN para estimativa rápida
                explain_query = f"""
                    EXPLAIN (FORMAT JSON)
                    SELECT 1
                    FROM vw_estabelecimentos_completos
                    WHERE {where_clause}
                """
                cursor.execute(explain_query, params)
                explain_result = cursor.fetchone()

                if explain_result and explain_result[0]:
                    import json
                    # explain_result[0] pode ser string JSON ou lista/dict já parseado
                    if isinstance(explain_result[0], str):
                        plan = json.loads(explain_result[0])
                    else:
                        plan = explain_result[0]

                    estimated_rows = plan[0]['Plan'].get('Plan Rows', 0)
                    total = int(estimated_rows)
                    logger.info(f"⚡ Usando estimativa rápida: ~{total} registros")
                else:
                    total = 0
            elif not use_fast_count:
                # Para buscas exatas (sem ILIKE), fazer COUNT normal
                count_query = f"""
                    SELECT COUNT(*)
                    FROM vw_estabelecimentos_completos
                    WHERE {where_clause}
                """
                cursor.execute(count_query, params)
                total_result = cursor.fetchone()
                total = total_result[0] if total_result else 0
                logger.info(f"📊 COUNT exato: {total} registros")
            else:
                # Para páginas subsequentes com ILIKE, usar cache ou estimativa
                total = 1000000  # Estimativa alta para permitir paginação

            # Evitar ORDER BY pesado em buscas amplas (ex: UF+município sem texto),
            # que pode estourar statement timeout ao ordenar centenas de milhares de linhas.
            order_clause = "ORDER BY razao_social" if (razao_social or nome_fantasia) else "ORDER BY cnpj_completo"

            data_query = f"""
                SELECT 
                    cnpj_completo, identificador_matriz_filial, razao_social,
                    nome_fantasia, situacao_cadastral, data_situacao_cadastral,
                    data_inicio_atividade, cnae_fiscal_principal, cnae_principal_desc,
                    tipo_logradouro, logradouro, numero, complemento, bairro,
                    cep, uf, municipio_desc, ddd_1, telefone_1,
                    correio_eletronico, porte_empresa, capital_social,
                    opcao_simples, opcao_mei
                FROM vw_estabelecimentos_completos
                WHERE {where_clause}
                {order_clause}
                LIMIT %s OFFSET %s
            """

            # Log da query completa para debug
            logger.info(f"📊 Query WHERE: {where_clause}")
            logger.info(f"📊 Params: {params}")
            logger.info(f"📊 Limit: {effective_limit}, Offset: {effective_offset}")

            cursor.execute(data_query, params + [effective_limit, effective_offset])
            results = cursor.fetchall()

            # Log dos primeiros 3 resultados para debug
            if results and len(results) > 0:
                logger.info(f"📊 Total resultados retornados: {len(results)}")
                for i, row in enumerate(results[:3]):
                    logger.info(f"📊 Resultado {i+1}: CNPJ={row[0]}, Data Início={row[6]}")

            cursor.close()

            columns = [
                'cnpj_completo', 'identificador_matriz_filial', 'razao_social',
                'nome_fantasia', 'situacao_cadastral', 'data_situacao_cadastral',
                'data_inicio_atividade', 'cnae_fiscal_principal', 'cnae_principal_desc',
                'tipo_logradouro', 'logradouro', 'numero', 'complemento', 'bairro',
                'cep', 'uf', 'municipio_desc', 'ddd_1', 'telefone_1',
                'correio_eletronico', 'porte_empresa', 'capital_social',
                'opcao_simples', 'opcao_mei'
            ]

            items = []
            for row in results:
                data = dict(zip(columns, row))
                cnpj = data['cnpj_completo']
                data['cnpj_basico'] = cnpj[:8] if cnpj else ''
                data['cnpj_ordem'] = cnpj[8:12] if cnpj and len(cnpj) >= 12 else ''
                data['cnpj_dv'] = cnpj[12:14] if cnpj and len(cnpj) >= 14 else ''

                # Converter datas para string (formato ISO)
                if data.get('data_situacao_cadastral'):
                    data['data_situacao_cadastral'] = str(data['data_situacao_cadastral'])
                if data.get('data_inicio_atividade'):
                    data['data_inicio_atividade'] = str(data['data_inicio_atividade'])

                # Buscar CNAEs secundários (sem JOIN para manter performance)
                # Para busca em lote, não buscar CNAEs secundários (usar endpoint específico)
                data['cnae_secundarios_completos'] = []

                items.append(EstabelecimentoCompleto(**data))

            total_pages = (total + effective_limit - 1) // effective_limit

            return PaginatedResponse(
                total=total,
                page=effective_offset // effective_limit + 1,
                per_page=effective_limit,
                total_pages=total_pages,
                items=items
            )

    except Exception as e:
        logger.error(f"Erro na busca: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cnpj/{cnpj}/cnaes-secundarios", response_model=List[CNAEModel])
async def get_cnaes_secundarios(cnpj: str, user: dict = Depends(verify_api_key)):
    """
    Busca todos os CNAEs secundários de uma empresa com suas descrições
    """
    cnpj_clean = cnpj.replace('.', '').replace('/', '').replace('-', '').strip()

    if len(cnpj_clean) != 14:
        raise HTTPException(
            status_code=400,
            detail="CNPJ deve ter 14 dígitos"
        )

    # Verifica cache primeiro
    cache_key = f"cnaes_sec:{cnpj_clean}"
    cached = get_from_cache(cache_key)
    if cached:
        logger.info(f"Cache hit para CNAEs secundários do CNPJ {cnpj_clean}")
        return cached

    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()

            # Buscar CNAEs secundários do estabelecimento
            query = """
                SELECT cnae_fiscal_secundaria
                FROM estabelecimentos
                WHERE cnpj_completo = %s
            """

            cursor.execute(query, (cnpj_clean,))
            result = cursor.fetchone()

            if not result or not result[0]:
                cursor.close()
                return []

            # Processar códigos de CNAE
            codigos = result[0].split(',')
            codigos = [c.strip() for c in codigos if c.strip()]

            if not codigos:
                cursor.close()
                return []

            # Buscar descrições
            placeholders = ','.join(['%s'] * len(codigos))
            query_cnaes = f"""
                SELECT codigo, descricao
                FROM cnaes
                WHERE codigo IN ({placeholders})
                ORDER BY codigo
            """

            cursor.execute(query_cnaes, codigos)
            cnaes_results = cursor.fetchall()
            cursor.close()

            cnaes = [CNAEModel(codigo=row[0], descricao=row[1]) for row in cnaes_results]

            # Salva no cache (1 hora)
            set_cache(cache_key, cnaes, minutes=60)

            return cnaes

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar CNAEs secundários do CNPJ {cnpj_clean}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cnpj/{cnpj}/socios")
async def get_socios(cnpj: str, user: dict = Depends(verify_api_key)):
    """
    Consulta sócios de um CNPJ
    Requer autenticação via API Key no header 'X-API-Key'
    Rate limit aplicado conforme plano de assinatura
    """
    cleaned_cnpj = clean_cnpj(cnpj)
    cnpj_basico = cleaned_cnpj[:8]

    try:
        # Log de auditoria
        await log_query(
            user_id=user['id'],
            action='socios_query',
            resource=f'cnpj/{cnpj}/socios',
            details={'plan': user.get('plan', 'free')}
        )

        logger.info(f"🔍 Buscando sócios para CNPJ {cleaned_cnpj} (básico: {cnpj_basico})")

        # Verifica cache primeiro
        cache_key = f"socios:{cnpj_basico}"
        cached = get_from_cache(cache_key)
        if cached:
            logger.info(f"✓ Cache hit para sócios do CNPJ {cnpj_basico}")
            return cached

        with db_manager.get_connection() as conn:
            cursor = conn.cursor()

            # Query completa com JOIN para trazer descrições
            query = """
                SELECT 
                    s.cnpj_basico,
                    s.identificador_socio,
                    CASE 
                        WHEN s.identificador_socio = '1' THEN 'Pessoa Jurídica'
                        WHEN s.identificador_socio = '2' THEN 'Pessoa Física'
                        WHEN s.identificador_socio = '3' THEN 'Estrangeiro'
                        ELSE s.identificador_socio
                    END as identificador_socio_desc,
                    s.nome_socio,
                    s.cnpj_cpf_socio,
                    s.qualificacao_socio,
                    qs.descricao as qualificacao_socio_desc,
                    s.data_entrada_sociedade,
                    s.pais,
                    s.representante_legal,
                    s.nome_representante,
                    s.qualificacao_representante,
                    qr.descricao as qualificacao_representante_desc,
                    s.faixa_etaria,
                    CASE 
                        WHEN s.faixa_etaria = '1' THEN '0-12 anos'
                        WHEN s.faixa_etaria = '2' THEN '13-20 anos'
                        WHEN s.faixa_etaria = '3' THEN '21-30 anos'
                        WHEN s.faixa_etaria = '4' THEN '31-40 anos'
                        WHEN s.faixa_etaria = '5' THEN '41-50 anos'
                        WHEN s.faixa_etaria = '6' THEN '51-60 anos'
                        WHEN s.faixa_etaria = '7' THEN '61-70 anos'
                        WHEN s.faixa_etaria = '8' THEN '71-80 anos'
                        WHEN s.faixa_etaria = '9' THEN 'Mais de 80 anos'
                        ELSE 'Não informado'
                    END as faixa_etaria_desc
                FROM socios s
                LEFT JOIN qualificacoes_socios qs ON s.qualificacao_socio = qs.codigo
                LEFT JOIN qualificacoes_socios qr ON s.qualificacao_representante = qr.codigo
                WHERE s.cnpj_basico = %s
                ORDER BY s.nome_socio
                LIMIT 1000
            """

            cursor.execute(query, (cnpj_basico,))
            results = cursor.fetchall()

            logger.info(f"📊 Encontrados {len(results)} sócios para CNPJ básico {cnpj_basico}")

            cursor.close()

            columns = [
                'cnpj_basico', 'identificador_socio', 'identificador_socio_desc',
                'nome_socio', 'cnpj_cpf_socio', 'qualificacao_socio', 'qualificacao_socio_desc',
                'data_entrada_sociedade', 'pais', 'representante_legal',
                'nome_representante', 'qualificacao_representante', 'qualificacao_representante_desc',
                'faixa_etaria', 'faixa_etaria_desc'
            ]

            socios = []
            for row in results:
                data = dict(zip(columns, row))
                # LGPD: mascara CPF de pessoa física também nesta rota (LGPD-01)
                data['cnpj_cpf_socio'] = _mask_cpf_socio(
                    data.get('cnpj_cpf_socio'), data.get('identificador_socio')
                )
                socios.append(SocioModel(**data))

            if len(socios) == 0:
                logger.info(f"ℹ️ Nenhum sócio encontrado para CNPJ básico {cnpj_basico}")
            else:
                # Salva no cache (30 minutos)
                set_cache(cache_key, socios, minutes=30)

            return socios

    except Exception as e:
        logger.error(f"❌ Erro ao buscar sócios do CNPJ {cnpj_basico}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/socios/search", response_model=List[SocioModel])
async def search_socios(
    user: dict = Depends(verify_api_key),
    nome_socio: Optional[str] = Query(None, description="Nome do sócio (busca parcial)"),
    cpf_cnpj: Optional[str] = Query(None, description="CPF ou CNPJ do sócio (completo ou parcial)"),
    identificador_socio: Optional[str] = Query(None, description="Tipo de sócio (1-Pessoa Jurídica, 2-Pessoa Física, 3-Estrangeiro)"),
    qualificacao_socio: Optional[str] = Query(None, description="Código da qualificação do sócio"),
    faixa_etaria: Optional[str] = Query(None, description="Faixa etária do sócio"),
    limit: int = Query(100, ge=1, le=1000)
):
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()

            conditions = []
            params = []

            if nome_socio:
                conditions.append("nome_socio ILIKE %s")
                params.append(f"%{nome_socio}%")

            if cpf_cnpj:
                cpf_cnpj_clean = cpf_cnpj.replace('.', '').replace('/', '').replace('-', '').strip()
                conditions.append("cnpj_cpf_socio LIKE %s")
                params.append(f"{cpf_cnpj_clean}%")

            if identificador_socio:
                conditions.append("identificador_socio = %s")
                params.append(identificador_socio)

            if qualificacao_socio:
                conditions.append("qualificacao_socio = %s")
                params.append(qualificacao_socio)

            if faixa_etaria:
                conditions.append("faixa_etaria = %s")
                params.append(faixa_etaria)

            where_clause = " AND ".join(conditions) if conditions else "1=1"

            query = f"""
                SELECT 
                    cnpj_basico, identificador_socio, nome_socio,
                    cnpj_cpf_socio, qualificacao_socio, data_entrada_sociedade
                FROM socios
                WHERE {where_clause}
                ORDER BY nome_socio
                LIMIT %s
            """

            cursor.execute(query, params + [limit])
            results = cursor.fetchall()
            cursor.close()

            columns = [
                'cnpj_basico', 'identificador_socio', 'nome_socio',
                'cnpj_cpf_socio', 'qualificacao_socio', 'data_entrada_sociedade'
            ]

            socios = []
            for row in results:
                data = dict(zip(columns, row))
                data['cnpj_cpf_socio'] = _mask_cpf_socio(
                    data.get('cnpj_cpf_socio'), data.get('identificador_socio')
                )
                socios.append(SocioModel(**data))
            return socios

    except Exception as e:
        logger.error(f"Erro ao buscar sócios: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cnaes", response_model=List[CNAEModel])
async def list_cnaes(
    user: dict = Depends(verify_api_key),
    search: Optional[str] = Query(None, description="Buscar na descrição"),
    limit: int = Query(100, ge=1, le=1000)
):
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()

            if search:
                query = """
                    SELECT codigo, descricao
                    FROM cnaes
                    WHERE descricao ILIKE %s
                    ORDER BY codigo
                    LIMIT %s
                """
                cursor.execute(query, (f"%{search}%", limit))
            else:
                query = """
                    SELECT codigo, descricao
                    FROM cnaes
                    ORDER BY codigo
                    LIMIT %s
                """
                cursor.execute(query, (limit,))

            results = cursor.fetchall()
            cursor.close()

            return [CNAEModel(codigo=row[0], descricao=row[1]) for row in results]

    except Exception as e:
        logger.error(f"Erro ao listar CNAEs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/municipios/{uf}", response_model=List[MunicipioModel])
async def list_municipios(uf: str, user: dict = Depends(verify_api_key)):
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()

            query = """
                SELECT DISTINCT m.codigo, m.descricao
                FROM municipios m
                INNER JOIN estabelecimentos e ON e.municipio = m.codigo
                WHERE e.uf = %s
                ORDER BY m.descricao
            """

            cursor.execute(query, (uf.upper(),))
            results = cursor.fetchall()
            cursor.close()

            return [MunicipioModel(codigo=row[0], descricao=row[1]) for row in results]

    except Exception as e:
        logger.error(f"Erro ao listar municípios: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()

            if data == "ping":
                await ws_manager.send_message({"type": "pong"}, websocket)
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

@router.post("/etl/start")
async def start_etl(current_user: dict = Depends(get_current_admin_user)):
    """
    Inicia o processo de ETL (apenas administradores)
    Requer autenticação JWT com role de admin
    """
    try:
        # Criar task com callback para capturar exceções
        task = asyncio.create_task(etl_controller.run_etl())
        
        def task_done_callback(t):
            try:
                exc = t.exception()
                if exc:
                    logger.error(f"❌ ETL task falhou com exceção: {exc}", exc_info=exc)
            except asyncio.CancelledError:
                logger.warning("⚠️ ETL task foi cancelada")
                
        task.add_done_callback(task_done_callback)
        
        logger.info(f"🚀 ETL iniciado pelo admin: {current_user.get('username')}")
        return {
            "status": "started",
            "message": "Processo ETL iniciado. Acompanhe o progresso via WebSocket."
        }
    except Exception as e:
        logger.error(f"Erro ao iniciar ETL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/etl/stop")
async def stop_etl(current_user: dict = Depends(get_current_admin_user)):
    """
    Para o processo de ETL (apenas administradores)
    Requer autenticação JWT com role de admin
    """
    try:
        stopped = await etl_controller.stop_etl()
        logger.info(f"ETL parado pelo admin: {current_user.get('username')}")
        return {
            "status": "stopped" if stopped else "not_running",
            "message": "Processo ETL parado" if stopped else "ETL não estava rodando"
        }
    except Exception as e:
        logger.error(f"Erro ao parar ETL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/etl/status")
async def get_etl_status(current_user: dict = Depends(get_current_admin_user)):
    """
    Obtém status do ETL (apenas administradores)
    Requer autenticação JWT com role de admin
    """
    return {
        "is_running": etl_controller.is_running,
        "stats": etl_controller.stats,
        "config": etl_controller.config
    }

@router.get("/etl/detailed-status")
async def get_etl_detailed_status(current_user: dict = Depends(get_current_admin_user)):
    """
    Obtém status detalhado do ETL em andamento com informações do banco
    Requer autenticação JWT com role de admin
    """
    return await etl_controller.get_detailed_status()

@router.post("/etl/config")
async def update_etl_config(config: Dict[str, Any], current_user: dict = Depends(get_current_admin_user)):
    """
    Atualiza configurações do ETL (apenas administradores)
    Requer autenticação JWT com role de admin
    """
    try:
        updated_config = await etl_controller.update_config(config)
        logger.info(f"Configuração ETL atualizada pelo admin: {current_user.get('username')}")
        return {
            "status": "updated",
            "config": updated_config
        }
    except Exception as e:
        logger.error(f"Erro ao atualizar configuração: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/etl/database-stats")
async def get_database_stats(current_user: dict = Depends(get_current_admin_user)):
    """
    Obtém estatísticas do banco de dados (apenas administradores)
    Requer autenticação JWT com role de admin
    """
    try:
        stats = await etl_controller.get_database_stats()
        return stats
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas do banco: {e}")

@router.get("/etl/check-updates")
async def check_updates(current_user: dict = Depends(get_current_admin_user)):
    """
    Verifica se há novas atualizações disponíveis na Receita Federal
    Requer autenticação JWT com role de admin
    """
    try:
        from src.etl.downloader import RFBDownloader
        downloader = RFBDownloader()
        
        # Lista arquivos disponíveis
        available_files = downloader.list_available_files()
        
        if not available_files:
            return {
                "status": "no_updates",
                "message": "Não foi possível verificar atualizações.",
                "files": []
            }
        
        # Detecta pasta mais recente
        latest_folder = downloader.get_latest_folder()
        
        return {
            "status": "success",
            "message": f"Encontrados {len(available_files)} arquivos disponíveis em {latest_folder}/",
            "latest_folder": latest_folder,
            "total_files": len(available_files),
            "files": available_files[:10]  # Primeiros 10 para evitar overhead
        }
    except Exception as e:
        logger.error(f"Erro ao verificar atualizações: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/etl/import-statistics")
async def get_import_statistics(current_user: dict = Depends(get_current_admin_user)):
    """
    Retorna estatísticas do último processamento ETL (novos/atualizados/inalterados)
    Requer autenticação JWT com role de admin
    """
    try:
        stats = await etl_controller.get_import_statistics()
        return {
            "status": "success",
            "statistics": stats
        }
    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas de importação: {e}")
        raise HTTPException(status_code=500, detail=str(e))