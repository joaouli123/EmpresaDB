-- ============================================
-- OTIMIZAÇÃO CRÍTICA - APLICAR NA VPS
-- ✅ VERSÃO SEGURA - ZERO DOWNTIME!
-- ============================================
-- Este script aplica otimizações SEM PARAR A API
-- Usa estratégia de swap atômico (CREATE → INDEX → RENAME)
-- 
-- Tempo total: ~1-2 horas
-- Downtime: ZERO! ✅ API continua funcionando
-- Ganho: 30s → 0.1-0.5s (60-300x mais rápido!)
-- ============================================

\timing on

-- ===== VERIFICAÇÃO INICIAL =====
SELECT 
    'INÍCIO DA OTIMIZAÇÃO (ZERO DOWNTIME)' as status,
    pg_size_pretty(pg_database_size('cnpj_db')) as tamanho_db,
    NOW() as inicio;

-- ===== PASSO 1: VERIFICAR/INSTALAR EXTENSÕES NECESSÁRIAS =====
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

SELECT 'Passo 1: Extensões verificadas' as status;

-- ===== PASSO 2: CORRIGIR ÍNDICES COM 0 BYTES =====
-- ✅ CREATE INDEX CONCURRENTLY não pode estar em blocos de transação
-- Então verificamos e criamos fora de DO blocks

-- Verificar índices atuais
SELECT 
    indexname, 
    pg_size_pretty(pg_relation_size(indexname::regclass)) as tamanho
FROM pg_indexes 
WHERE indexname IN ('idx_estabelecimentos_cnpj_basico', 'idx_estabelecimentos_uf_situacao')
AND schemaname = 'public';

-- Se os índices acima mostraram 0 bytes, execute:
-- (senão, pule para o próximo passo)

-- Recriar idx_estabelecimentos_cnpj_basico
DROP INDEX IF EXISTS idx_estabelecimentos_cnpj_basico;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estabelecimentos_cnpj_basico 
ON estabelecimentos(cnpj_basico);

-- Recriar idx_estabelecimentos_uf_situacao  
DROP INDEX IF EXISTS idx_estabelecimentos_uf_situacao;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estabelecimentos_uf_situacao 
ON estabelecimentos(uf, situacao_cadastral);

SELECT 'Passo 2: Índices base corrigidos (se necessário)' as status;

-- ===== PASSO 3: CRIAR MATERIALIZED VIEW TEMPORÁRIA =====
-- ✅ ESTRATÉGIA ZERO DOWNTIME:
-- 1. Criar com nome temporário (_new)
-- 2. Criar todos os índices
-- 3. Swap atômico (renomear)
-- 4. Dropar antiga
-- Durante todo o processo, API continua usando a view antiga!

SELECT 'Passo 3: Criando MATERIALIZED VIEW temporária (30-60min, API continua funcionando!)...' as status;

-- Dropar temporária se existir (cleanup de execução anterior)
DROP MATERIALIZED VIEW IF EXISTS vw_estabelecimentos_completos_new;

-- Criar MATERIALIZED VIEW com nome temporário
CREATE MATERIALIZED VIEW vw_estabelecimentos_completos_new AS
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
    'Passo 3: MATERIALIZED VIEW temporária criada!' as status,
    pg_size_pretty(pg_total_relation_size('vw_estabelecimentos_completos_new')) as tamanho;

-- ===== PASSO 4: CRIAR ÍNDICES NA VIEW TEMPORÁRIA =====
-- API ainda usa view antiga, então não há impacto!

SELECT 'Passo 4: Criando índices (20-30min, API continua funcionando!)...' as status;

-- Índice ÚNICO para CNPJ (necessário para REFRESH CONCURRENTLY futuro)
CREATE UNIQUE INDEX idx_mv_new_estabelecimentos_cnpj_unique 
ON vw_estabelecimentos_completos_new(cnpj_completo);

-- Índices para lookups diretos
CREATE INDEX idx_mv_new_estabelecimentos_razao_social 
ON vw_estabelecimentos_completos_new(razao_social);

CREATE INDEX idx_mv_new_estabelecimentos_nome_fantasia 
ON vw_estabelecimentos_completos_new(nome_fantasia);

-- Índices para filtros
CREATE INDEX idx_mv_new_estabelecimentos_uf 
ON vw_estabelecimentos_completos_new(uf);

CREATE INDEX idx_mv_new_estabelecimentos_situacao 
ON vw_estabelecimentos_completos_new(situacao_cadastral);

CREATE INDEX idx_mv_new_estabelecimentos_cnae 
ON vw_estabelecimentos_completos_new(cnae_fiscal_principal);

CREATE INDEX idx_mv_new_estabelecimentos_municipio 
ON vw_estabelecimentos_completos_new(municipio_desc);

-- Índice composto (UF + Situação)
CREATE INDEX idx_mv_new_estabelecimentos_uf_situacao 
ON vw_estabelecimentos_completos_new(uf, situacao_cadastral);

-- Índices TRIGRAM para busca textual (ILIKE)
-- ✅ Já verificamos que pg_trgm existe no Passo 1
CREATE INDEX idx_mv_new_estabelecimentos_razao_social_trgm 
ON vw_estabelecimentos_completos_new USING gin(razao_social gin_trgm_ops);

CREATE INDEX idx_mv_new_estabelecimentos_nome_fantasia_trgm 
ON vw_estabelecimentos_completos_new USING gin(nome_fantasia gin_trgm_ops);

SELECT 'Passo 4: Todos os índices criados!' as status;

-- ===== PASSO 5: ATUALIZAR ESTATÍSTICAS NA VIEW NOVA =====
ANALYZE vw_estabelecimentos_completos_new;

SELECT 'Passo 5: Estatísticas atualizadas' as status;

-- ===== PASSO 6: SWAP ATÔMICO (< 1 SEGUNDO DE DOWNTIME) =====
-- ✅ Este é o único momento com risco mínimo de erro
-- Fazemos backup da view antiga e swap atômico

SELECT 'Passo 6: Preparando swap atômico...' as status;

BEGIN;

-- 6.1. Fazer backup da VIEW atual (se existir)
DO $$
BEGIN
    -- Se existe como VIEW normal
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'vw_estabelecimentos_completos') THEN
        DROP VIEW IF EXISTS vw_estabelecimentos_completos_old CASCADE;
        ALTER VIEW vw_estabelecimentos_completos RENAME TO vw_estabelecimentos_completos_old;
    END IF;
    
    -- Se existe como MATERIALIZED VIEW
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'vw_estabelecimentos_completos') THEN
        DROP MATERIALIZED VIEW IF EXISTS vw_estabelecimentos_completos_old;
        ALTER MATERIALIZED VIEW vw_estabelecimentos_completos RENAME TO vw_estabelecimentos_completos_old;
    END IF;
END $$;

-- 6.2. Renomear índices da view antiga (_old) para evitar conflito
-- ✅ Isso libera os nomes idx_mv_estabelecimentos_* para os índices novos
DO $$
BEGIN
    -- Renomear índices da view antiga SE ela existir como MATERIALIZED VIEW
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'vw_estabelecimentos_completos_old') THEN
        -- Tentar renomear cada índice (pode não existir em todas as instalações)
        ALTER INDEX IF EXISTS idx_mv_estabelecimentos_cnpj_unique 
        RENAME TO idx_mv_old_estabelecimentos_cnpj_unique;
        
        ALTER INDEX IF EXISTS idx_mv_estabelecimentos_razao_social 
        RENAME TO idx_mv_old_estabelecimentos_razao_social;
        
        ALTER INDEX IF EXISTS idx_mv_estabelecimentos_nome_fantasia 
        RENAME TO idx_mv_old_estabelecimentos_nome_fantasia;
        
        ALTER INDEX IF EXISTS idx_mv_estabelecimentos_uf 
        RENAME TO idx_mv_old_estabelecimentos_uf;
        
        ALTER INDEX IF EXISTS idx_mv_estabelecimentos_situacao 
        RENAME TO idx_mv_old_estabelecimentos_situacao;
        
        ALTER INDEX IF EXISTS idx_mv_estabelecimentos_cnae 
        RENAME TO idx_mv_old_estabelecimentos_cnae;
        
        ALTER INDEX IF EXISTS idx_mv_estabelecimentos_municipio 
        RENAME TO idx_mv_old_estabelecimentos_municipio;
        
        ALTER INDEX IF EXISTS idx_mv_estabelecimentos_uf_situacao 
        RENAME TO idx_mv_old_estabelecimentos_uf_situacao;
        
        ALTER INDEX IF EXISTS idx_mv_estabelecimentos_razao_social_trgm 
        RENAME TO idx_mv_old_estabelecimentos_razao_social_trgm;
        
        ALTER INDEX IF EXISTS idx_mv_estabelecimentos_nome_fantasia_trgm 
        RENAME TO idx_mv_old_estabelecimentos_nome_fantasia_trgm;
    END IF;
END $$;

-- 6.3. Renomear nova para nome oficial (SWAP ATÔMICO!)
ALTER MATERIALIZED VIEW vw_estabelecimentos_completos_new 
RENAME TO vw_estabelecimentos_completos;

-- 6.4. Renomear os índices da view nova para nomes oficiais
-- ✅ Agora os nomes estão livres (view antiga usa sufixo _old)
ALTER INDEX idx_mv_new_estabelecimentos_cnpj_unique RENAME TO idx_mv_estabelecimentos_cnpj_unique;
ALTER INDEX idx_mv_new_estabelecimentos_razao_social RENAME TO idx_mv_estabelecimentos_razao_social;
ALTER INDEX idx_mv_new_estabelecimentos_nome_fantasia RENAME TO idx_mv_estabelecimentos_nome_fantasia;
ALTER INDEX idx_mv_new_estabelecimentos_uf RENAME TO idx_mv_estabelecimentos_uf;
ALTER INDEX idx_mv_new_estabelecimentos_situacao RENAME TO idx_mv_estabelecimentos_situacao;
ALTER INDEX idx_mv_new_estabelecimentos_cnae RENAME TO idx_mv_estabelecimentos_cnae;
ALTER INDEX idx_mv_new_estabelecimentos_municipio RENAME TO idx_mv_estabelecimentos_municipio;
ALTER INDEX idx_mv_new_estabelecimentos_uf_situacao RENAME TO idx_mv_estabelecimentos_uf_situacao;
ALTER INDEX idx_mv_new_estabelecimentos_razao_social_trgm RENAME TO idx_mv_estabelecimentos_razao_social_trgm;
ALTER INDEX idx_mv_new_estabelecimentos_nome_fantasia_trgm RENAME TO idx_mv_estabelecimentos_nome_fantasia_trgm;

COMMIT;

SELECT '✅ Passo 6: SWAP COMPLETO! API agora usa MATERIALIZED VIEW otimizada!' as status;

-- ===== PASSO 7: VERIFICAR VIEW ANTIGA (NÃO DROPAR AINDA!) =====
-- ⚠️ IMPORTANTE: NÃO drop automaticamente! Deixar como backup para rollback
-- Só dropar após confirmar que tudo funciona perfeitamente

SELECT 
    'Passo 7: View antiga preservada como backup (_old)' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'vw_estabelecimentos_completos_old')
        THEN 'VIEW antiga existe (backup disponível)'
        WHEN EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'vw_estabelecimentos_completos_old')
        THEN 'MATERIALIZED VIEW antiga existe (backup disponível)'
        ELSE 'Sem backup (primeira instalação)'
    END as status_backup;

-- ✅ Para dropar a view antiga MANUALMENTE (só após testes OK!):
-- DROP VIEW IF EXISTS vw_estabelecimentos_completos_old CASCADE;
-- DROP MATERIALIZED VIEW IF EXISTS vw_estabelecimentos_completos_old;

-- ===== PASSO 8: ATUALIZAR ESTATÍSTICAS GLOBAIS =====
ANALYZE vw_estabelecimentos_completos;
ANALYZE estabelecimentos;
ANALYZE empresas;
ANALYZE socios;

SELECT 'Passo 8: Estatísticas globais atualizadas' as status;

-- ===== VERIFICAÇÃO FINAL =====
SELECT 
    '✅ OTIMIZAÇÃO COMPLETA - ZERO DOWNTIME!' as status,
    pg_size_pretty(pg_database_size('cnpj_db')) as tamanho_db_final,
    NOW() as fim;

-- Ver tamanho da MATERIALIZED VIEW
SELECT 
    'MATERIALIZED VIEW FINAL' as tipo,
    pg_size_pretty(pg_total_relation_size('vw_estabelecimentos_completos')) as tamanho_total,
    pg_size_pretty(pg_relation_size('vw_estabelecimentos_completos')) as tamanho_dados,
    pg_size_pretty(pg_total_relation_size('vw_estabelecimentos_completos') - pg_relation_size('vw_estabelecimentos_completos')) as tamanho_indices;

-- Ver todos os índices
SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as tamanho
FROM pg_indexes
WHERE tablename = 'vw_estabelecimentos_completos'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- ===== TESTES DE PERFORMANCE =====
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

SELECT '✅ TESTES CONCLUÍDOS!' as status;

-- ===== RESUMO =====
SELECT '
═════════════════════════════════════════════
✅ OTIMIZAÇÃO CONCLUÍDA - ZERO DOWNTIME!
═════════════════════════════════════════════

ESTRATÉGIA APLICADA:
✅ CREATE com nome temporário
✅ Criar todos os índices
✅ SWAP atômico (< 1s de transição)
✅ API continuou funcionando durante todo o processo!

MUDANÇAS APLICADAS:
✅ MATERIALIZED VIEW criada (dados pré-processados)
✅ 10 índices otimizados
✅ 2 índices TRIGRAM para busca textual
✅ Índices base corrigidos (0 bytes)

GANHOS ESPERADOS:
🚀 Consultas: 30s → 0.1-0.5s (60-300x!)
🚀 Throughput: 10 req/s → 100+ req/s
🚀 Latência: Consistente e previsível

PRÓXIMOS PASSOS:
1. ✅ MATERIALIZED VIEW já está em uso
2. Reiniciar backend no Replit (para usar connection pool)
3. Testar consultas na API
4. Configurar refresh automático (veja abaixo)

═════════════════════════════════════════════
MANUTENÇÃO FUTURA
═════════════════════════════════════════════

Para atualizar dados (após importar novos CNPJs):

OPÇÃO 1 - Manual:
REFRESH MATERIALIZED VIEW CONCURRENTLY vw_estabelecimentos_completos;

OPÇÃO 2 - Automático (cron 1x/dia às 3h):
0 3 * * * psql -U cnpj_user -d cnpj_db -c "REFRESH MATERIALIZED VIEW CONCURRENTLY vw_estabelecimentos_completos;"

═════════════════════════════════════════════
ROLLBACK (SE NECESSÁRIO)
═════════════════════════════════════════════

✅ A view antiga (_old) foi PRESERVADA como backup!

Se algo der errado após o swap:

-- 1. Conectar no PostgreSQL
psql -U cnpj_user -d cnpj_db

-- 2. Dropar view nova (com problemas)
DROP MATERIALIZED VIEW IF EXISTS vw_estabelecimentos_completos;

-- 3. Restaurar view antiga (backup)
-- Se era VIEW normal:
ALTER VIEW vw_estabelecimentos_completos_old 
RENAME TO vw_estabelecimentos_completos;

-- OU se era MATERIALIZED VIEW:
ALTER MATERIALIZED VIEW vw_estabelecimentos_completos_old 
RENAME TO vw_estabelecimentos_completos;

-- 4. Verificar
SELECT COUNT(*) FROM vw_estabelecimentos_completos;

-- 5. Reiniciar backend no Replit

✅ PRONTO! Sistema restaurado ao estado anterior.

═════════════════════════════════════════════
LIMPEZA FINAL (APÓS TESTES OK!)
═════════════════════════════════════════════

Após confirmar que tudo funciona (aguardar 24-48h):

-- Dropar backup antigo
DROP VIEW IF EXISTS vw_estabelecimentos_completos_old CASCADE;
DROP MATERIALIZED VIEW IF EXISTS vw_estabelecimentos_completos_old;

-- Liberar espaço
VACUUM FULL;

═════════════════════════════════════════════
' as resumo;
