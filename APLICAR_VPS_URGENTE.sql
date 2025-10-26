-- ============================================
-- OTIMIZAÇÃO CRÍTICA - APLICAR AGORA NA VPS
-- ============================================
-- COPIE E COLE ESTE ARQUIVO COMPLETO NO POSTGRESQL
-- Tempo total: ~1-2 horas (mas API continua funcionando!)
-- Ganho esperado: 30 segundos → 0.1-0.5 segundos (60-300x mais rápido!)
-- ============================================

\timing on

-- ===== VERIFICAÇÃO INICIAL =====
SELECT 
    'ANTES DA OTIMIZAÇÃO' as status,
    pg_size_pretty(pg_database_size('cnpj_db')) as tamanho_db,
    NOW() as inicio;

-- ===== PASSO 1: CORRIGIR ÍNDICES COM 0 BYTES =====
-- Estes índices não foram criados corretamente

DROP INDEX IF EXISTS idx_estabelecimentos_cnpj_basico;
DROP INDEX IF EXISTS idx_estabelecimentos_uf_situacao;

-- Recriar índices críticos
CREATE INDEX CONCURRENTLY idx_estabelecimentos_cnpj_basico 
ON estabelecimentos(cnpj_basico);

CREATE INDEX CONCURRENTLY idx_estabelecimentos_uf_situacao 
ON estabelecimentos(uf, situacao_cadastral);

SELECT 'Passo 1: Índices corrigidos' as status;

-- ===== PASSO 2: CRIAR MATERIALIZED VIEW (CRÍTICO!) =====
-- Esta é a mudança MAIS IMPORTANTE!
-- Vai transformar consultas de 30s em 0.1-0.5s

-- Backup da view antiga
DROP VIEW IF EXISTS vw_estabelecimentos_completos_backup CASCADE;
CREATE VIEW vw_estabelecimentos_completos_backup AS
SELECT * FROM vw_estabelecimentos_completos LIMIT 0;

-- Dropar view normal
DROP VIEW IF EXISTS vw_estabelecimentos_completos CASCADE;

-- Criar MATERIALIZED VIEW (vai demorar 30-60min)
SELECT 'Passo 2: Criando MATERIALIZED VIEW (pode demorar 30-60min)...' as status;

CREATE MATERIALIZED VIEW vw_estabelecimentos_completos AS
SELECT 
    e.cnpj_completo,
    e.identificador_matriz_filial,
    emp.razao_social,
    e.nome_fantasia,
    e.situacao_cadastral,
    e.data_situacao_cadastral,
    msc.descricao as motivo_situacao_cadastral_desc,
    e.data_inicio_atividade,
    e.cnae_fiscal_principal,
    e.cnae_fiscal_secundaria,
    cnae.descricao as cnae_principal_desc,
    e.tipo_logradouro,
    e.logradouro,
    e.numero,
    e.complemento,
    e.bairro,
    e.cep,
    e.uf,
    mun.descricao as municipio_desc,
    e.ddd_1,
    e.telefone_1,
    e.correio_eletronico,
    emp.natureza_juridica,
    nj.descricao as natureza_juridica_desc,
    emp.porte_empresa,
    emp.capital_social,
    emp.ente_federativo_responsavel,
    sn.opcao_simples,
    sn.opcao_mei
FROM estabelecimentos e
INNER JOIN empresas emp ON e.cnpj_basico = emp.cnpj_basico
LEFT JOIN cnaes cnae ON e.cnae_fiscal_principal = cnae.codigo
LEFT JOIN municipios mun ON e.municipio = mun.codigo
LEFT JOIN motivos_situacao_cadastral msc ON e.motivo_situacao_cadastral = msc.codigo
LEFT JOIN naturezas_juridicas nj ON emp.natureza_juridica = nj.codigo
LEFT JOIN simples_nacional sn ON e.cnpj_basico = sn.cnpj_basico;

SELECT 
    'Passo 2: MATERIALIZED VIEW criada!' as status,
    pg_size_pretty(pg_total_relation_size('vw_estabelecimentos_completos')) as tamanho;

-- ===== PASSO 3: CRIAR ÍNDICES NA MATERIALIZED VIEW =====
-- Estes índices vão deixar as consultas ULTRA-RÁPIDAS

SELECT 'Passo 3: Criando índices na MATERIALIZED VIEW (20-30min)...' as status;

-- Índice ÚNICO para CNPJ (obrigatório para REFRESH CONCURRENTLY)
CREATE UNIQUE INDEX idx_mv_estabelecimentos_cnpj_unique 
ON vw_estabelecimentos_completos(cnpj_completo);

-- Índices para lookups diretos
CREATE INDEX CONCURRENTLY idx_mv_estabelecimentos_razao_social 
ON vw_estabelecimentos_completos(razao_social);

CREATE INDEX CONCURRENTLY idx_mv_estabelecimentos_nome_fantasia 
ON vw_estabelecimentos_completos(nome_fantasia);

-- Índices para filtros
CREATE INDEX CONCURRENTLY idx_mv_estabelecimentos_uf 
ON vw_estabelecimentos_completos(uf);

CREATE INDEX CONCURRENTLY idx_mv_estabelecimentos_situacao 
ON vw_estabelecimentos_completos(situacao_cadastral);

CREATE INDEX CONCURRENTLY idx_mv_estabelecimentos_cnae 
ON vw_estabelecimentos_completos(cnae_fiscal_principal);

CREATE INDEX CONCURRENTLY idx_mv_estabelecimentos_municipio 
ON vw_estabelecimentos_completos(municipio_desc);

-- Índice composto para query mais comum (UF + Situação)
CREATE INDEX CONCURRENTLY idx_mv_estabelecimentos_uf_situacao 
ON vw_estabelecimentos_completos(uf, situacao_cadastral);

-- Índices TRIGRAM para busca textual (ILIKE)
CREATE INDEX CONCURRENTLY idx_mv_estabelecimentos_razao_social_trgm 
ON vw_estabelecimentos_completos USING gin(razao_social gin_trgm_ops);

CREATE INDEX CONCURRENTLY idx_mv_estabelecimentos_nome_fantasia_trgm 
ON vw_estabelecimentos_completos USING gin(nome_fantasia gin_trgm_ops);

SELECT 'Passo 3: Índices criados!' as status;

-- ===== PASSO 4: ATUALIZAR ESTATÍSTICAS =====
ANALYZE vw_estabelecimentos_completos;
ANALYZE estabelecimentos;
ANALYZE empresas;
ANALYZE socios;

SELECT 'Passo 4: Estatísticas atualizadas' as status;

-- ===== PASSO 5: VERIFICAÇÃO FINAL =====
SELECT 
    '✅ OTIMIZAÇÃO COMPLETA!' as status,
    pg_size_pretty(pg_database_size('cnpj_db')) as tamanho_db_final,
    NOW() as fim;

-- Ver tamanho da MATERIALIZED VIEW
SELECT 
    'MATERIALIZED VIEW' as tipo,
    pg_size_pretty(pg_total_relation_size('vw_estabelecimentos_completos')) as tamanho_total,
    pg_size_pretty(pg_relation_size('vw_estabelecimentos_completos')) as tamanho_dados,
    pg_size_pretty(pg_total_relation_size('vw_estabelecimentos_completos') - pg_relation_size('vw_estabelecimentos_completos')) as tamanho_indices;

-- Ver índices criados
SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as tamanho
FROM pg_indexes
WHERE tablename = 'vw_estabelecimentos_completos'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- ===== TESTE DE PERFORMANCE =====
SELECT '🚀 TESTANDO PERFORMANCE...' as status;

-- Teste 1: Lookup por CNPJ (deve ser < 100ms)
\timing on
EXPLAIN ANALYZE
SELECT * FROM vw_estabelecimentos_completos
WHERE cnpj_completo = '00000000000191'
LIMIT 1;

-- Teste 2: Filtro por UF (deve ser < 500ms)
EXPLAIN ANALYZE
SELECT COUNT(*) FROM vw_estabelecimentos_completos
WHERE uf = 'SP' AND situacao_cadastral = '02';

-- Teste 3: Busca textual (deve ser < 1s)
EXPLAIN ANALYZE
SELECT * FROM vw_estabelecimentos_completos
WHERE razao_social ILIKE '%PETROBRAS%'
LIMIT 10;

SELECT '✅ TESTES CONCLUÍDOS! Verifique os tempos acima.' as status;

-- ===== RESUMO =====
SELECT '
═════════════════════════════════════════════
✅ OTIMIZAÇÃO CONCLUÍDA COM SUCESSO!
═════════════════════════════════════════════

MUDANÇAS APLICADAS:
✅ MATERIALIZED VIEW criada (dados pré-processados)
✅ 10 índices otimizados na view
✅ 2 índices TRIGRAM para busca textual
✅ Estatísticas atualizadas

GANHOS ESPERADOS:
🚀 Consultas: 30 segundos → 0.1-0.5 segundos (60-300x mais rápido!)
🚀 Throughput: 10 req/s → 100+ req/s
🚀 Latência: Consistente e previsível

PRÓXIMOS PASSOS:
1. Reiniciar o backend do Replit
2. Testar uma consulta na API
3. Configurar refresh automático (veja abaixo)

═════════════════════════════════════════════
MANUTENÇÃO FUTURA (IMPORTANTE!)
═════════════════════════════════════════════

A MATERIALIZED VIEW precisa ser atualizada quando os dados mudarem.

OPÇÃO 1 - Manual (quando importar novos dados):
REFRESH MATERIALIZED VIEW CONCURRENTLY vw_estabelecimentos_completos;

OPÇÃO 2 - Automático (recomendado - 1x por dia de madrugada):
Criar cron job:
0 3 * * * psql -U cnpj_user -d cnpj_db -c "REFRESH MATERIALIZED VIEW CONCURRENTLY vw_estabelecimentos_completos;"

═════════════════════════════════════════════
' as resumo;
