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
from src.api.auth import get_current_admin_user
from src.api.websocket_manager import ws_manager
from src.api.etl_controller import etl_controller
from src.api.rate_limiter import rate_limiter
import logging
import asyncio
from functools import lru_cache
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

router = APIRouter()

# Cache em memória para resultados (expira em 1 hora)
_cache = {}
_cache_timeout = {}

def get_from_cache(key: str):
    """Retorna do cache se ainda válido"""
    if key in _cache:
        if datetime.now() < _cache_timeout.get(key, datetime.min):
            return _cache[key]
        else:
            # Expirou, remove
            _cache.pop(key, None)
            _cache_timeout.pop(key, None)
    return None

def set_cache(key: str, value, minutes: int = 60):
    """Salva no cache com tempo de expiração"""
    _cache[key] = value
    _cache_timeout[key] = datetime.now() + timedelta(minutes=minutes)

async def verify_api_key(x_api_key: str = Header(None)):
    """
    Verifica se a API Key é válida
    
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
async def get_stats():
    try:
        return StatsResponse(
            total_empresas=db_manager.get_table_count('empresas') or 0,
            total_estabelecimentos=db_manager.get_table_count('estabelecimentos') or 0,
            total_socios=db_manager.get_table_count('socios') or 0,
            total_cnaes=db_manager.get_table_count('cnaes') or 0,
            total_municipios=db_manager.get_table_count('municipios') or 0
        )
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cnpj/{cnpj}", response_model=EstabelecimentoCompleto)
async def get_by_cnpj(cnpj: str, user: dict = Depends(verify_api_key)):
    # Rate limiting: 100 req/min por usuário
    await rate_limiter.check_rate_limit(user['id'], max_requests=100, window_seconds=60)
    
    cnpj_clean = cnpj.replace('.', '').replace('/', '').replace('-', '').strip()
    
    # Validação contra SQL injection
    if not cnpj_clean.isdigit():
        raise HTTPException(
            status_code=400,
            detail="CNPJ deve conter apenas números"
        )
    
    if len(cnpj_clean) != 14:
        raise HTTPException(
            status_code=400,
            detail="CNPJ deve ter 14 dígitos"
        )
    
    # Verifica cache primeiro
    cache_key = f"cnpj:{cnpj_clean}"
    cached = get_from_cache(cache_key)
    if cached:
        logger.info(f"Cache hit para CNPJ {cnpj_clean}")
        return cached
    
    try:
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
                    porte_empresa, capital_social, opcao_simples, opcao_mei
                FROM vw_estabelecimentos_completos
                WHERE cnpj_completo = %s
            """
            
            cursor.execute(query, (cnpj_clean,))
            result = cursor.fetchone()
            cursor.close()
            
            if not result:
                raise HTTPException(status_code=404, detail="CNPJ não encontrado")
            
            columns = [
                'cnpj_completo', 'identificador_matriz_filial', 'razao_social',
                'nome_fantasia', 'situacao_cadastral', 'data_situacao_cadastral',
                'motivo_situacao_cadastral_desc', 'data_inicio_atividade',
                'cnae_fiscal_principal', 'cnae_principal_desc',
                'tipo_logradouro', 'logradouro', 'numero', 'complemento', 'bairro',
                'cep', 'uf', 'municipio_desc', 'ddd_1', 'telefone_1',
                'correio_eletronico', 'natureza_juridica', 'natureza_juridica_desc',
                'porte_empresa', 'capital_social', 'opcao_simples', 'opcao_mei'
            ]
            
            data = dict(zip(columns, result))
            data['cnpj_basico'] = cnpj_clean[:8]
            data['cnpj_ordem'] = cnpj_clean[8:12]
            data['cnpj_dv'] = cnpj_clean[12:14]
            
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
        logger.error(f"Erro ao buscar CNPJ {cnpj_clean}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search", response_model=PaginatedResponse)
async def search_empresas(
    user: dict = Depends(verify_api_key),
    cnpj: Optional[str] = Query(None, description="CNPJ completo ou parcial (apenas números)"),
    razao_social: Optional[str] = Query(None, description="Razão social (busca parcial)"),
    nome_fantasia: Optional[str] = Query(None, description="Nome fantasia (busca parcial)"),
    uf: Optional[str] = Query(None, description="UF (sigla do estado)"),
    municipio: Optional[str] = Query(None, description="Código do município"),
    cnae: Optional[str] = Query(None, description="CNAE principal"),
    cnae_secundario: Optional[str] = Query(None, description="CNAE secundário (busca parcial)"),
    situacao_cadastral: Optional[str] = Query(None, description="Situação cadastral (01-Nula, 02-Ativa, 03-Suspensa, 04-Inapta, 08-Baixada)"),
    porte: Optional[str] = Query(None, description="Porte da empresa (1-Micro, 2-Pequena, 3-Média, 4-Grande, 5-Demais)"),
    simples: Optional[str] = Query(None, description="Optante Simples Nacional (S/N)"),
    mei: Optional[str] = Query(None, description="Optante MEI (S/N)"),
    identificador_matriz_filial: Optional[str] = Query(None, description="1-Matriz, 2-Filial"),
    natureza_juridica: Optional[str] = Query(None, description="Código da natureza jurídica"),
    capital_social_min: Optional[float] = Query(None, description="Capital social mínimo"),
    capital_social_max: Optional[float] = Query(None, description="Capital social máximo"),
    ente_federativo: Optional[str] = Query(None, description="Ente federativo responsável (busca parcial)"),
    data_inicio_atividade_de: Optional[str] = Query(None, description="Data de início de atividade DE (formato: YYYY-MM-DD)"),
    data_inicio_atividade_ate: Optional[str] = Query(None, description="Data de início de atividade ATÉ (formato: YYYY-MM-DD)"),
    data_situacao_cadastral_de: Optional[str] = Query(None, description="Data da situação cadastral DE (formato: YYYY-MM-DD)"),
    data_situacao_cadastral_ate: Optional[str] = Query(None, description="Data da situação cadastral ATÉ (formato: YYYY-MM-DD)"),
    motivo_situacao_cadastral: Optional[str] = Query(None, description="Código do motivo da situação cadastral"),
    cep: Optional[str] = Query(None, description="CEP (completo ou parcial)"),
    bairro: Optional[str] = Query(None, description="Bairro (busca parcial)"),
    logradouro: Optional[str] = Query(None, description="Logradouro/Rua (busca parcial)"),
    tipo_logradouro: Optional[str] = Query(None, description="Tipo de logradouro (ex: RUA, AVENIDA)"),
    numero: Optional[str] = Query(None, description="Número do estabelecimento"),
    complemento: Optional[str] = Query(None, description="Complemento (busca parcial)"),
    email: Optional[str] = Query(None, description="E-mail (busca parcial)"),
    page: int = Query(1, ge=1, description="Número da página"),
    per_page: int = Query(20, ge=1, le=100, description="Itens por página")
):
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            conditions = []
            params = []
            
            if cnpj:
                cnpj_clean = cnpj.replace('.', '').replace('/', '').replace('-', '').strip()
                conditions.append("cnpj_completo LIKE %s")
                params.append(f"{cnpj_clean}%")
            
            if razao_social:
                conditions.append("razao_social ILIKE %s")
                params.append(f"%{razao_social}%")
            
            if nome_fantasia:
                conditions.append("nome_fantasia ILIKE %s")
                params.append(f"%{nome_fantasia}%")
            
            if uf:
                conditions.append("uf = %s")
                params.append(uf.upper())
            
            if municipio:
                conditions.append("municipio = %s")
                params.append(municipio)
            
            if cnae:
                conditions.append("cnae_fiscal_principal = %s")
                params.append(cnae)
            
            if cnae_secundario:
                conditions.append("cnae_fiscal_secundaria LIKE %s")
                params.append(f"%{cnae_secundario}%")
            
            if situacao_cadastral:
                conditions.append("situacao_cadastral = %s")
                params.append(situacao_cadastral)
            
            if porte:
                conditions.append("porte_empresa = %s")
                params.append(porte)
            
            if simples:
                conditions.append("opcao_simples = %s")
                params.append(simples.upper())
            
            if mei:
                conditions.append("opcao_mei = %s")
                params.append(mei.upper())
            
            if identificador_matriz_filial:
                conditions.append("identificador_matriz_filial = %s")
                params.append(identificador_matriz_filial)
            
            if natureza_juridica:
                conditions.append("natureza_juridica = %s")
                params.append(natureza_juridica)
            
            if capital_social_min is not None:
                conditions.append("capital_social >= %s")
                params.append(capital_social_min)
            
            if capital_social_max is not None:
                conditions.append("capital_social <= %s")
                params.append(capital_social_max)
            
            if ente_federativo:
                conditions.append("ente_federativo_responsavel ILIKE %s")
                params.append(f"%{ente_federativo}%")
            
            if data_inicio_atividade_de:
                conditions.append("data_inicio_atividade >= %s")
                params.append(data_inicio_atividade_de)
            
            if data_inicio_atividade_ate:
                conditions.append("data_inicio_atividade <= %s")
                params.append(data_inicio_atividade_ate)
            
            if data_situacao_cadastral_de:
                conditions.append("data_situacao_cadastral >= %s")
                params.append(data_situacao_cadastral_de)
            
            if data_situacao_cadastral_ate:
                conditions.append("data_situacao_cadastral <= %s")
                params.append(data_situacao_cadastral_ate)
            
            if motivo_situacao_cadastral:
                conditions.append("motivo_situacao_cadastral_desc ILIKE %s")
                params.append(f"%{motivo_situacao_cadastral}%")
            
            if cep:
                conditions.append("cep LIKE %s")
                params.append(f"{cep}%")
            
            if bairro:
                conditions.append("bairro ILIKE %s")
                params.append(f"%{bairro}%")
            
            if logradouro:
                conditions.append("logradouro ILIKE %s")
                params.append(f"%{logradouro}%")
            
            if tipo_logradouro:
                conditions.append("tipo_logradouro ILIKE %s")
                params.append(f"%{tipo_logradouro}%")
            
            if numero:
                conditions.append("numero = %s")
                params.append(numero)
            
            if complemento:
                conditions.append("complemento ILIKE %s")
                params.append(f"%{complemento}%")
            
            if email:
                conditions.append("correio_eletronico ILIKE %s")
                params.append(f"%{email}%")
            
            where_clause = " AND ".join(conditions) if conditions else "1=1"
            
            count_query = f"""
                SELECT COUNT(*)
                FROM vw_estabelecimentos_completos
                WHERE {where_clause}
            """
            cursor.execute(count_query, params)
            total_result = cursor.fetchone()
            total = total_result[0] if total_result else 0
            
            offset = (page - 1) * per_page
            
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
            
            cursor.execute(data_query, params + [per_page, offset])
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
                
                # Buscar CNAEs secundários (sem JOIN para manter performance)
                # Para busca em lote, não buscar CNAEs secundários (usar endpoint específico)
                data['cnae_secundarios_completos'] = []
                
                items.append(EstabelecimentoCompleto(**data))
            
            total_pages = (total + per_page - 1) // per_page
            
            return PaginatedResponse(
                total=total,
                page=page,
                per_page=per_page,
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

@router.get("/cnpj/{cnpj}/socios", response_model=List[SocioModel])
async def get_socios(cnpj: str, user: dict = Depends(verify_api_key)):
    """
    Busca sócios de uma empresa pelo CNPJ
    
    IMPORTANTE: Esta consulta pode retornar muitos resultados para empresas grandes.
    Banco de dados contém 26,5 milhões de sócios.
    """
    cnpj_clean = cnpj.replace('.', '').replace('/', '').replace('-', '').strip()
    cnpj_basico = cnpj_clean[:8]
    
    logger.info(f"🔍 Buscando sócios para CNPJ {cnpj_clean} (básico: {cnpj_basico})")
    
    # Verifica cache primeiro
    cache_key = f"socios:{cnpj_basico}"
    cached = get_from_cache(cache_key)
    if cached:
        logger.info(f"✓ Cache hit para sócios do CNPJ {cnpj_basico}")
        return cached
    
    try:
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
            
            socios = [SocioModel(**dict(zip(columns, row))) for row in results]
            
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
    nome_socio: Optional[str] = Query(None, description="Nome do sócio (busca parcial)"),
    cpf_cnpj: Optional[str] = Query(None, description="CPF ou CNPJ do sócio (completo ou parcial)"),
    identificador_socio: Optional[str] = Query(None, description="Tipo de sócio (1-Pessoa Jurídica, 2-Pessoa Física, 3-Estrangeiro)"),
    qualificacao_socio: Optional[str] = Query(None, description="Código da qualificação do sócio"),
    faixa_etaria: Optional[str] = Query(None, description="Faixa etária do sócio"),
    limit: int = Query(100, ge=1, le=1000, description="Limite de resultados")
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
            
            socios = [SocioModel(**dict(zip(columns, row))) for row in results]
            return socios
            
    except Exception as e:
        logger.error(f"Erro ao buscar sócios: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cnaes", response_model=List[CNAEModel])
async def list_cnaes(
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
async def list_municipios(uf: str):
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
        asyncio.create_task(etl_controller.run_etl())
        logger.info(f"ETL iniciado pelo admin: {current_user.get('username')}")
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
        raise HTTPException(status_code=500, detail=str(e))
