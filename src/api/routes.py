from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
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
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

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
async def get_by_cnpj(cnpj: str):
    cnpj_clean = cnpj.replace('.', '').replace('/', '').replace('-', '').strip()
    
    if len(cnpj_clean) != 14:
        raise HTTPException(
            status_code=400,
            detail="CNPJ deve ter 14 dígitos"
        )
    
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
            
            return EstabelecimentoCompleto(**data)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar CNPJ {cnpj_clean}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search", response_model=PaginatedResponse)
async def search_empresas(
    razao_social: Optional[str] = Query(None, description="Razão social (busca parcial)"),
    nome_fantasia: Optional[str] = Query(None, description="Nome fantasia (busca parcial)"),
    uf: Optional[str] = Query(None, description="UF (sigla do estado)"),
    municipio: Optional[str] = Query(None, description="Código do município"),
    cnae: Optional[str] = Query(None, description="CNAE principal"),
    situacao_cadastral: Optional[str] = Query(None, description="Situação cadastral (01-08)"),
    porte: Optional[str] = Query(None, description="Porte da empresa (1-5)"),
    simples: Optional[str] = Query(None, description="Optante Simples (S/N)"),
    mei: Optional[str] = Query(None, description="Optante MEI (S/N)"),
    page: int = Query(1, ge=1, description="Número da página"),
    per_page: int = Query(20, ge=1, le=100, description="Itens por página")
):
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            conditions = []
            params = []
            
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

@router.get("/cnpj/{cnpj}/socios", response_model=List[SocioModel])
async def get_socios(cnpj: str):
    cnpj_clean = cnpj.replace('.', '').replace('/', '').replace('-', '').strip()
    cnpj_basico = cnpj_clean[:8]
    
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            query = """
                SELECT 
                    cnpj_basico, identificador_socio, nome_socio,
                    cnpj_cpf_socio, qualificacao_socio, data_entrada_sociedade
                FROM socios
                WHERE cnpj_basico = %s
                ORDER BY nome_socio
            """
            
            cursor.execute(query, (cnpj_basico,))
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
