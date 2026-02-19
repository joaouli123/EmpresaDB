"""
Rotas para consultas em lote (Batch Queries)
Sistema de créditos e pacotes para buscas avançadas
"""

from fastapi import APIRouter, HTTPException, Query, Header, Depends
from typing import Optional, List, Dict, Any
from src.database.connection import db_manager
from src.api.models import PaginatedResponse, EstabelecimentoCompleto
from src.api.auth import get_current_user
from src.api.security_logger import log_query
from pydantic import BaseModel
import logging
from datetime import datetime
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/batch", tags=["Batch Queries"])

# ============================================
# MODELS
# ============================================

class BatchPackage(BaseModel):
    id: int
    name: str
    display_name: str
    description: Optional[str]
    credits: int
    price_brl: float
    price_per_unit: float
    sort_order: int
    is_active: bool

class BatchCredits(BaseModel):
    total_credits: int
    used_credits: int
    available_credits: int
    monthly_included_credits: int
    purchased_credits: int
    plan_monthly_batch_queries: int
    batch_queries_this_month: int
    
class BatchUsageRecord(BaseModel):
    id: int
    credits_used: int
    filters_used: Optional[Dict[str, Any]]
    results_returned: int
    endpoint: str
    created_at: datetime

class PurchaseResponse(BaseModel):
    success: bool
    message: str
    session_url: Optional[str] = None
    credits_added: Optional[int] = None

# ============================================
# HELPER FUNCTIONS
# ============================================

async def verify_api_key_for_batch(x_api_key: str = Header(None)):
    """
    Verifica API Key e retorna informações do usuário
    Usado especificamente para endpoints de consultas em lote
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
    
    return user

async def get_user_batch_credits(user_id: int) -> Dict[str, Any]:
    """Busca créditos de consultas em lote do usuário"""
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM clientes.vw_user_batch_credits
                WHERE user_id = %s
            """, (user_id,))
            
            result = cursor.fetchone()
            cursor.close()
            
            if not result:
                return {
                    'total_credits': 0,
                    'used_credits': 0,
                    'available_credits': 0,
                    'monthly_included_credits': 0,
                    'purchased_credits': 0,
                    'plan_monthly_batch_queries': 0,
                    'batch_queries_this_month': 0
                }
            
            # View retorna: user_id(0), username(1), email(2), plan_monthly_batch_queries(3),
            # total_credits(4), used_credits(5), available_credits(6), monthly_included_credits(7),
            # purchased_credits(8), batch_queries_this_month(9), subscription_status(10), subscription_end_date(11)
            return {
                'total_credits': result[4] or 0,
                'used_credits': result[5] or 0,
                'available_credits': result[6] or 0,
                'monthly_included_credits': result[7] or 0,
                'purchased_credits': result[8] or 0,
                'plan_monthly_batch_queries': result[3] or 0,
                'batch_queries_this_month': result[9] or 0
            }
    except Exception as e:
        logger.error(f"Erro ao buscar créditos: {e}")
        return {
            'total_credits': 0,
            'used_credits': 0,
            'available_credits': 0,
            'monthly_included_credits': 0,
            'purchased_credits': 0,
            'plan_monthly_batch_queries': 0,
            'batch_queries_this_month': 0
        }

# ============================================
# ENDPOINTS - CONSULTAS EM LOTE
# ============================================

@router.post("/search")
async def batch_search_companies(
    razao_social: str = Query(None, description="Razão social da empresa"),
    nome_fantasia: str = Query(None, description="Nome fantasia da empresa"),
    cnae: str = Query(None, description="CNAE principal"),
    cnae_secundario: str = Query(None, description="CNAE secundário"),
    uf: str = Query(None, description="UF"),
    municipio: str = Query(None, description="Código IBGE do município"),
    situacao_cadastral: str = Query(None, description="Situação cadastral"),
    data_inicio_atividade_min: str = Query(None, description="Data início atividade mínima (YYYY-MM-DD)"),
    data_inicio_atividade_max: str = Query(None, description="Data início atividade máxima (YYYY-MM-DD)"),
    porte: str = Query(None, description="Porte: 1-Micro, 2-Pequena, 3-Média, 4-Grande, 5-Demais"),
    identificador_matriz_filial: str = Query(None, description="1-Matriz, 2-Filial"),
    simples: str = Query(None, description="S-Optante, N-Não optante pelo Simples Nacional"),
    mei: str = Query(None, description="S-Optante, N-Não optante pelo MEI"),
    cep: str = Query(None, description="CEP completo ou parcial"),
    bairro: str = Query(None, description="Nome do bairro"),
    logradouro: str = Query(None, description="Nome da rua/avenida"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    user: dict = Depends(verify_api_key_for_batch)
):
    """
    🔍 Busca avançada de empresas com múltiplos filtros
    
    **NOVO!** Agora disponível via API Key!
    
    ⚠️ **Cobrança por Uso**:
    - Cada empresa retornada = 1 crédito consumido
    - Consulte seu saldo em /batch/credits
    - Compre pacotes em /batch/packages
    
    **Filtros Disponíveis**:
    - Razão social e nome fantasia
    - CNAE principal e secundário  
    - Localização (UF, município, CEP, bairro, logradouro)
    - Situação cadastral
    - Data de início de atividade
    - Porte da empresa
    - Tipo (matriz/filial)
    - Regime tributário (Simples Nacional, MEI)
    """
    try:
        # Verificar créditos disponíveis
        credits_info = await get_user_batch_credits(user['id'])
        available_credits = credits_info['available_credits']
        
        if available_credits <= 0:
            raise HTTPException(
                status_code=402,
                detail={
                    "error": "insufficient_batch_credits",
                    "message": "Você não tem créditos de consultas em lote suficientes.",
                    "action_url": "/batch/packages",
                    "help": "Adquira pacotes de consultas em lote para usar este endpoint",
                    "available_credits": available_credits,
                    "suggestions": [
                        "Compre um pacote de consultas em lote",
                        "Faça upgrade do seu plano para incluir consultas em lote mensais",
                        "Verifique seu saldo em /batch/credits"
                    ]
                }
            )
        
        # Construir query dinâmica
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Desabilitar parallel workers
            cursor.execute("SET max_parallel_workers_per_gather = 0")
            
            conditions = []
            params = []
            
            if razao_social:
                conditions.append("razao_social ILIKE %s")
                params.append(f"%{razao_social}%")
            
            if nome_fantasia:
                conditions.append("nome_fantasia ILIKE %s")
                params.append(f"%{nome_fantasia}%")
            
            if cnae:
                conditions.append("cnae_fiscal_principal = %s")
                params.append(cnae)
            
            if cnae_secundario:
                conditions.append("cnae_fiscal_secundaria LIKE %s")
                params.append(f"%{cnae_secundario}%")
            
            if uf:
                conditions.append("uf = %s")
                params.append(uf.upper())
            
            if municipio:
                conditions.append("municipio = %s")
                params.append(municipio)
            
            if situacao_cadastral:
                conditions.append("situacao_cadastral = %s")
                params.append(situacao_cadastral)
            
            if data_inicio_atividade_min:
                try:
                    datetime.strptime(data_inicio_atividade_min, '%Y-%m-%d')
                    conditions.append("data_inicio_atividade >= %s")
                    params.append(data_inicio_atividade_min)
                except ValueError:
                    raise HTTPException(
                        status_code=400,
                        detail="data_inicio_atividade_min deve estar no formato YYYY-MM-DD"
                    )
            
            if data_inicio_atividade_max:
                try:
                    datetime.strptime(data_inicio_atividade_max, '%Y-%m-%d')
                    conditions.append("data_inicio_atividade <= %s")
                    params.append(data_inicio_atividade_max)
                except ValueError:
                    raise HTTPException(
                        status_code=400,
                        detail="data_inicio_atividade_max deve estar no formato YYYY-MM-DD"
                    )
            
            if porte:
                conditions.append("porte_empresa = %s")
                params.append(porte)
            
            if identificador_matriz_filial:
                conditions.append("identificador_matriz_filial = %s")
                params.append(identificador_matriz_filial)
            
            if simples:
                conditions.append("opcao_simples = %s")
                params.append(simples.upper())
            
            if mei:
                conditions.append("opcao_mei = %s")
                params.append(mei.upper())
            
            if cep:
                conditions.append("cep LIKE %s")
                params.append(f"{cep}%")
            
            if bairro:
                conditions.append("bairro ILIKE %s")
                params.append(f"%{bairro}%")
            
            if logradouro:
                conditions.append("logradouro ILIKE %s")
                params.append(f"%{logradouro}%")
            
            where_clause = " AND ".join(conditions) if conditions else "1=1"
            
            # COUNT exato para empresas
            count_query = f"""
                SELECT COUNT(*)
                FROM vw_estabelecimentos_completos
                WHERE {where_clause}
            """
            cursor.execute(count_query, params)
            total_result = cursor.fetchone()
            total = total_result[0] if total_result else 0
            
            # Verificar se há resultados para retornar
            if total == 0:
                cursor.close()
                return PaginatedResponse(
                    total=0,
                    page=offset // limit + 1,
                    per_page=limit,
                    total_pages=0,
                    items=[]
                )
            
            # Calcular quantos créditos serão necessários para esta página
            results_in_page = min(limit, total - offset)
            
            if results_in_page > available_credits:
                cursor.close()
                raise HTTPException(
                    status_code=402,
                    detail={
                        "error": "insufficient_batch_credits",
                        "message": f"Você precisa de {results_in_page} créditos, mas tem apenas {available_credits} disponíveis.",
                        "action_url": "/batch/packages",
                        "help": "Adquira mais créditos para continuar",
                        "credits_needed": results_in_page,
                        "credits_available": available_credits,
                        "suggestions": [
                            f"Compre um pacote de consultas em lote (+{results_in_page} créditos)",
                            "Reduza o número de resultados por página (use o parâmetro 'limit')",
                            "Faça upgrade do seu plano"
                        ]
                    }
                )
            
            # Buscar dados
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
                ORDER BY razao_social
                LIMIT %s OFFSET %s
            """
            
            cursor.execute(data_query, params + [limit, offset])
            results = cursor.fetchall()
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
                
                if data.get('data_situacao_cadastral'):
                    data['data_situacao_cadastral'] = str(data['data_situacao_cadastral'])
                if data.get('data_inicio_atividade'):
                    data['data_inicio_atividade'] = str(data['data_inicio_atividade'])
                
                # Não buscar CNAEs secundários em batch para performance
                data['cnae_secundarios_completos'] = []
                
                items.append(EstabelecimentoCompleto(**data))
            
            # COBRAR CRÉDITOS - Apenas pelos resultados retornados
            credits_to_consume = len(items)
            
            # Registrar filtros usados para auditoria
            filters_used = {
                'razao_social': razao_social,
                'nome_fantasia': nome_fantasia,
                'cnae': cnae,
                'cnae_secundario': cnae_secundario,
                'uf': uf,
                'municipio': municipio,
                'situacao_cadastral': situacao_cadastral,
                'data_inicio_atividade_min': data_inicio_atividade_min,
                'data_inicio_atividade_max': data_inicio_atividade_max,
                'porte': porte,
                'identificador_matriz_filial': identificador_matriz_filial,
                'simples': simples,
                'mei': mei,
                'cep': cep,
                'bairro': bairro,
                'logradouro': logradouro,
                'limit': limit,
                'offset': offset
            }
            
            # Consumir créditos
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                try:
                    cursor.execute("""
                        SELECT clientes.consume_batch_credits(%s, %s, %s, %s, %s, %s)
                    """, (
                        user['id'],
                        credits_to_consume,
                        None,  # api_key_id - TODO: pegar do header
                        json.dumps(filters_used),
                        len(items),
                        '/batch/search'
                    ))
                    cursor.close()
                except Exception as e:
                    cursor.close()
                    logger.error(f"Erro ao consumir créditos: {e}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"Erro ao processar cobrança de créditos: {str(e)}"
                    )
            
            # Log de auditoria
            await log_query(
                user_id=user['id'],
                action='batch_search',
                resource='/batch/search',
                details={
                    'filters': filters_used,
                    'results_returned': len(items),
                    'credits_consumed': credits_to_consume,
                    'total_found': total
                }
            )
            
            total_pages = (total + limit - 1) // limit
            
            logger.info(f"✅ Busca em lote: user_id={user['id']}, resultados={len(items)}, créditos consumidos={credits_to_consume}")
            
            return PaginatedResponse(
                total=total,
                page=offset // limit + 1,
                per_page=limit,
                total_pages=total_pages,
                items=items
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro na busca em lote: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ENDPOINTS - GERENCIAMENTO DE CRÉDITOS
# ============================================

@router.get("/credits", response_model=BatchCredits)
async def get_batch_credits(current_user: dict = Depends(get_current_user)):
    """
    💳 Consultar saldo de créditos de consultas em lote
    
    Retorna informações sobre:
    - Créditos totais disponíveis
    - Créditos já utilizados
    - Créditos incluídos no plano mensal
    - Créditos comprados separadamente
    - Uso no mês atual
    """
    try:
        credits_info = await get_user_batch_credits(current_user['id'])
        return BatchCredits(**credits_info)
    except Exception as e:
        logger.error(f"Erro ao buscar créditos: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/usage", response_model=List[BatchUsageRecord])
async def get_batch_usage(
    limit: int = Query(100, ge=1, le=1000),
    current_user: dict = Depends(get_current_user)
):
    """
    📊 Histórico de uso de consultas em lote
    
    Retorna as últimas utilizações de créditos com:
    - Créditos consumidos
    - Filtros utilizados
    - Quantidade de resultados
    - Data e hora
    """
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, credits_used, filters_used, results_returned, endpoint, created_at
                FROM clientes.batch_query_usage
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s
            """, (current_user['id'], limit))
            
            results = cursor.fetchall()
            cursor.close()
            
            usage_records = []
            for row in results:
                usage_records.append(BatchUsageRecord(
                    id=row[0],
                    credits_used=row[1],
                    filters_used=row[2],
                    results_returned=row[3],
                    endpoint=row[4],
                    created_at=row[5]
                ))
            
            return usage_records
    
    except Exception as e:
        logger.error(f"Erro ao buscar histórico de uso: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ENDPOINTS - PACOTES
# ============================================

@router.get("/packages", response_model=List[BatchPackage])
async def list_batch_packages():
    """
    📦 Listar pacotes disponíveis de consultas em lote
    
    Retorna todos os pacotes disponíveis para compra com:
    - Quantidade de créditos
    - Preço total
    - Preço por unidade
    - Descrição
    """
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, name, display_name, description, credits, price_brl, price_per_unit, sort_order, is_active
                FROM clientes.batch_query_packages
                WHERE is_active = TRUE
                ORDER BY sort_order, credits ASC
            """)
            
            results = cursor.fetchall()
            cursor.close()
            
            packages = []
            for row in results:
                packages.append(BatchPackage(
                    id=row[0],
                    name=row[1],
                    display_name=row[2],
                    description=row[3],
                    credits=row[4],
                    price_brl=float(row[5]),
                    price_per_unit=float(row[6]),
                    sort_order=row[7],
                    is_active=row[8]
                ))
            
            return packages
    
    except Exception as e:
        logger.error(f"Erro ao listar pacotes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/packages/{package_id}/purchase", response_model=PurchaseResponse)
async def purchase_batch_package(
    package_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    🛒 Comprar pacote de consultas em lote
    
    Inicia o processo de compra via Stripe para um pacote específico.
    Retorna a URL do checkout para pagamento.
    
    **Como funciona:**
    1. Você escolhe um pacote
    2. É redirecionado para o checkout seguro do Stripe
    3. Após o pagamento, os créditos são adicionados automaticamente
    4. Você pode usar imediatamente no endpoint /batch/search
    """
    try:
        from src.api.batch_stripe_service import batch_stripe_service
        
        # Verificar se o pacote existe
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, name, display_name, credits, price_brl
                FROM clientes.batch_query_packages
                WHERE id = %s AND is_active = TRUE
            """, (package_id,))
            
            package = cursor.fetchone()
            cursor.close()
            
            if not package:
                raise HTTPException(
                    status_code=404,
                    detail="Pacote não encontrado ou não disponível"
                )
        
        # Criar sessão de checkout do Stripe
        import os
        
        # Determinar URL de origem para redirecionamentos
        origin = os.getenv('BASE_URL', '')
        if not origin:
            # Tentar REPLIT_DEV_DOMAIN para compatibilidade
            origin = os.getenv('REPLIT_DEV_DOMAIN', '')
            if origin and not origin.startswith('http'):
                origin = f'https://{origin}'
            else:
                # Usar domínio de produção como padrão
                environment = os.getenv('ENVIRONMENT', 'production').lower()
                if environment == 'development':
                    origin = 'http://localhost:5000'
                else:
                    origin = 'https://www.dbempresas.com.br'
        
        checkout_session = await batch_stripe_service.create_package_checkout_session(
            user_id=current_user['id'],
            package_id=package_id,
            success_url=f"{origin}/subscription?batch_purchase=success",
            cancel_url=f"{origin}/home#batch-packages"
        )
        
        if not checkout_session:
            raise HTTPException(
                status_code=500,
                detail="Erro ao criar sessão de pagamento. Tente novamente."
            )
        
        logger.info(f"✅ Checkout criado para user_id={current_user['id']}, package_id={package_id}")
        
        return PurchaseResponse(
            success=True,
            message="Redirecionando para checkout...",
            session_url=checkout_session['url'],
            credits_added=None
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao comprar pacote: {e}")
        raise HTTPException(status_code=500, detail=str(e))
