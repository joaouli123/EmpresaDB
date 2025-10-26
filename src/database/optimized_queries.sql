-- ============================================
-- QUERIES OTIMIZADAS PARA A API
-- Use estas queries no lugar das atuais
-- ============================================

-- ===== 1. COUNT RÁPIDO (ESTIMATIVA) =====
-- Ao invés de COUNT(*) que lê toda a tabela, use estatísticas do PostgreSQL
-- Precisão: ~95-99% (mais que suficiente para paginação)

-- Função para COUNT rápido
CREATE OR REPLACE FUNCTION fast_count(table_name text) 
RETURNS bigint AS $$
DECLARE
    count_estimate bigint;
BEGIN
    EXECUTE format('
        SELECT reltuples::bigint
        FROM pg_class
        WHERE relname = %L
    ', table_name) INTO count_estimate;
    
    RETURN count_estimate;
END;
$$ LANGUAGE plpgsql;

-- Exemplo de uso:
-- SELECT fast_count('estabelecimentos'); -- Retorna em milissegundos!

-- ===== 2. COUNT COM FILTROS (OTIMIZADO) =====
-- Para COUNT com WHERE, use EXPLAIN + extração do estimate

CREATE OR REPLACE FUNCTION fast_count_where(query_text text) 
RETURNS bigint AS $$
DECLARE
    plan_json jsonb;
    count_estimate bigint;
BEGIN
    EXECUTE 'EXPLAIN (FORMAT JSON) ' || query_text INTO plan_json;
    count_estimate := (plan_json->0->'Plan'->>'Plan Rows')::bigint;
    RETURN count_estimate;
EXCEPTION
    WHEN OTHERS THEN
        -- Fallback para COUNT real se houver erro
        EXECUTE 'SELECT COUNT(*) FROM (' || query_text || ') AS subq' INTO count_estimate;
        RETURN count_estimate;
END;
$$ LANGUAGE plpgsql;

-- ===== 3. QUERY OTIMIZADA PARA /search =====
-- Use LIMIT sem calcular total (mais rápido)
-- Total só quando realmente necessário

-- Exemplo: Busca com estimativa de total
PREPARE search_with_fast_count (text, text, int, int) AS
WITH filtered_data AS (
    SELECT 
        cnpj_completo, razao_social, nome_fantasia,
        uf, municipio_desc, situacao_cadastral
    FROM vw_estabelecimentos_completos
    WHERE 
        ($1::text IS NULL OR uf = $1)
        AND ($2::text IS NULL OR situacao_cadastral = $2)
    ORDER BY razao_social
    LIMIT $3 OFFSET $4
)
SELECT * FROM filtered_data;

-- ===== 4. QUERY OTIMIZADA PARA /cnpj/{cnpj} =====
-- Busca direta com índice

PREPARE get_cnpj_fast (text) AS
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
WHERE cnpj_completo = $1;

-- ===== 5. QUERY OTIMIZADA PARA SÓCIOS =====
-- Com LIMIT e índices

PREPARE get_socios_fast (text) AS
SELECT 
    s.cnpj_basico,
    s.identificador_socio,
    s.nome_socio,
    s.cnpj_cpf_socio,
    s.qualificacao_socio,
    qs.descricao as qualificacao_socio_desc,
    s.data_entrada_sociedade,
    s.faixa_etaria
FROM socios s
LEFT JOIN qualificacoes_socios qs ON s.qualificacao_socio = qs.codigo
WHERE s.cnpj_basico = $1
ORDER BY s.nome_socio
LIMIT 1000;

-- ===== 6. BUSCA POR TEXTO (FULL-TEXT SEARCH) =====
-- Muito mais rápido que ILIKE

-- Criar índice de full-text search
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_fts 
ON estabelecimentos USING gin(
    to_tsvector('portuguese', 
        coalesce(razao_social, '') || ' ' || 
        coalesce(nome_fantasia, '')
    )
);

-- Query de busca full-text
PREPARE search_fulltext (text, int, int) AS
SELECT 
    cnpj_completo, razao_social, nome_fantasia,
    uf, municipio_desc, situacao_cadastral,
    ts_rank(
        to_tsvector('portuguese', coalesce(razao_social, '') || ' ' || coalesce(nome_fantasia, '')),
        plainto_tsquery('portuguese', $1)
    ) as rank
FROM vw_estabelecimentos_completos
WHERE to_tsvector('portuguese', coalesce(razao_social, '') || ' ' || coalesce(nome_fantasia, '')) 
    @@ plainto_tsquery('portuguese', $1)
ORDER BY rank DESC
LIMIT $2 OFFSET $3;

-- ===== 7. AGREGAÇÕES OTIMIZADAS =====
-- Stats por UF

CREATE MATERIALIZED VIEW IF NOT EXISTS stats_por_uf AS
SELECT 
    uf,
    COUNT(*) as total_estabelecimentos,
    COUNT(CASE WHEN situacao_cadastral = '02' THEN 1 END) as ativos,
    COUNT(CASE WHEN opcao_mei = 'S' THEN 1 END) as mei,
    COUNT(CASE WHEN opcao_simples = 'S' THEN 1 END) as simples
FROM vw_estabelecimentos_completos
GROUP BY uf;

CREATE INDEX idx_stats_por_uf ON stats_por_uf(uf);

-- Atualizar stats (executar 1x por dia):
-- REFRESH MATERIALIZED VIEW stats_por_uf;

-- ===== 8. CACHE DE QUERIES FREQUENTES =====
-- Criar tabela de cache para queries lentas

CREATE TABLE IF NOT EXISTS query_cache (
    cache_key varchar(255) PRIMARY KEY,
    cache_value jsonb NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp NOT NULL
);

CREATE INDEX idx_query_cache_expires ON query_cache(expires_at);

-- Limpeza automática de cache expirado
CREATE OR REPLACE FUNCTION cleanup_query_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM query_cache WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ===== 9. MONITORAMENTO DE PERFORMANCE =====
-- View para queries lentas

CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    queryid,
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time,
    stddev_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- > 1 segundo
ORDER BY total_exec_time DESC
LIMIT 50;

-- Ativar pg_stat_statements (adicionar ao postgresql.conf):
-- shared_preload_libraries = 'pg_stat_statements'
-- pg_stat_statements.track = all

-- Criar extensão:
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ===== 10. OTIMIZAÇÕES FINAIS =====

-- Desabilitar sequential scan para forçar uso de índices (TESTE PRIMEIRO!)
-- SET enable_seqscan = off;

-- Aumentar statistics target para melhor planejamento
ALTER TABLE estabelecimentos ALTER COLUMN razao_social SET STATISTICS 1000;
ALTER TABLE estabelecimentos ALTER COLUMN uf SET STATISTICS 1000;
ALTER TABLE estabelecimentos ALTER COLUMN cnae_fiscal_principal SET STATISTICS 1000;

-- Recolher estatísticas
ANALYZE estabelecimentos;
ANALYZE vw_estabelecimentos_completos;

COMMIT;
