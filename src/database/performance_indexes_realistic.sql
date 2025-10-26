-- ============================================
-- ÍNDICES OTIMIZADOS REALISTAS
-- Para 50M+ empresas, 200GB disco disponível
-- VERSÃO SEGURA: Não bloqueia, espaço controlado
-- ============================================

-- ===== IMPORTANTE =====
-- 1. CREATE INDEX CONCURRENTLY: não bloqueia escritas
-- 2. Apenas índices essenciais (economia de espaço)
-- 3. Testar espaço disponível ANTES de criar

-- ===== VERIFICAR ESPAÇO DISPONÍVEL =====
SELECT 
    pg_size_pretty(pg_database_size('cnpj_db')) as tamanho_atual,
    pg_size_pretty(pg_total_relation_size('estabelecimentos')) as tamanho_estabelecimentos,
    pg_size_pretty(pg_total_relation_size('empresas')) as tamanho_empresas,
    pg_size_pretty(pg_total_relation_size('socios')) as tamanho_socios;

-- ===== 1. EXTENSÃO TRIGRAM =====
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- ===== 2. ÍNDICES ESSENCIAIS (NÃO TRIGRAM) =====
-- Estes são rápidos de criar e pequenos

-- CNPJ completo (busca exata - muito comum)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estabelecimentos_cnpj_completo 
ON estabelecimentos(cnpj_completo);

-- UF (filtro muito comum)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estabelecimentos_uf 
ON estabelecimentos(uf);

-- Situação cadastral (filtro comum)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estabelecimentos_situacao 
ON estabelecimentos(situacao_cadastral);

-- CNAE principal (filtro comum)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estabelecimentos_cnae 
ON estabelecimentos(cnae_fiscal_principal);

-- ===== 3. ÍNDICE COMPOSTO PARA FILTROS COMBINADOS =====
-- UF + Situação (combinação muito comum)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estabelecimentos_uf_situacao 
ON estabelecimentos(uf, situacao_cadastral);

-- ===== 4. ÍNDICE CRÍTICO PARA ORDER BY =====
-- **ESSENCIAL**: Sem isso, PostgreSQL ordena milhões de registros a cada query!
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estabelecimentos_razao_social_btree
ON estabelecimentos(razao_social);

-- ===== 5. ÍNDICES TRIGRAM (APENAS OS 2 MAIS IMPORTANTES) =====
-- ⚠️ ATENÇÃO: Índices trigram são GRANDES (2-5x tamanho da coluna)
-- Só criar se houver espaço suficiente!

-- Razão social (busca mais comum)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estabelecimentos_razao_social_trgm 
ON estabelecimentos USING gin(razao_social gin_trgm_ops);

-- Nome fantasia (segunda busca mais comum)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estabelecimentos_nome_fantasia_trgm 
ON estabelecimentos USING gin(nome_fantasia gin_trgm_ops);

-- ===== 6. ÍNDICE PARCIAL (EMPRESAS ATIVAS) =====
-- Índice menor, apenas para registros ativos (maioria das consultas)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estabelecimentos_ativos_uf
ON estabelecimentos(uf, municipio, cnae_fiscal_principal)
WHERE situacao_cadastral = '02';

-- ===== 7. ÍNDICES PARA JOINS =====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estabelecimentos_cnpj_basico 
ON estabelecimentos(cnpj_basico);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estabelecimentos_municipio 
ON estabelecimentos(municipio);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_empresas_cnpj_basico 
ON empresas(cnpj_basico);

-- ===== 8. ÍNDICES PARA SÓCIOS =====
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_socios_cnpj_basico 
ON socios(cnpj_basico);

-- CPF/CNPJ do sócio (busca exata)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_socios_cpf_cnpj 
ON socios(cnpj_cpf_socio);

-- ===== 9. ATUALIZAR ESTATÍSTICAS =====
ANALYZE estabelecimentos;
ANALYZE empresas;
ANALYZE socios;

-- ===== 10. VERIFICAR TAMANHO DOS ÍNDICES =====
SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as tamanho
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('estabelecimentos', 'empresas', 'socios')
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- ===== RESUMO =====
-- ✅ CREATE INDEX CONCURRENTLY: não bloqueia escritas
-- ✅ Apenas 2 índices trigram (ao invés de 7)
-- ✅ Índice B-tree para ORDER BY razao_social (CRÍTICO!)
-- ✅ Índices parciais para economizar espaço
-- ✅ Total estimado: 20-40GB de índices (cabe em 200GB)

-- ===== TEMPO ESTIMADO =====
-- - Índices B-tree: 5-15 min cada
-- - Índices trigram: 30-90 min cada
-- - Total: 2-4 horas (mas API continua funcionando!)

COMMIT;
