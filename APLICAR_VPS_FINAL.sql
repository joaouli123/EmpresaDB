\timing on

SELECT 'INÍCIO DA OTIMIZAÇÃO' as status, NOW() as inicio;

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
SELECT 'Passo 1: Extensões OK' as status;

DROP INDEX IF EXISTS idx_estabelecimentos_cnpj_basico;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estabelecimentos_cnpj_basico ON estabelecimentos(cnpj_basico);
DROP INDEX IF EXISTS idx_estabelecimentos_uf_situacao;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estabelecimentos_uf_situacao ON estabelecimentos(uf, situacao_cadastral);
SELECT 'Passo 2: Índices base OK' as status;

SELECT 'Passo 3: Criando MATERIALIZED VIEW (30-60min)...' as status;
DROP MATERIALIZED VIEW IF EXISTS vw_estabelecimentos_completos_new;
CREATE MATERIALIZED VIEW vw_estabelecimentos_completos_new AS
SELECT e.cnpj_completo, e.identificador_matriz_filial, emp.razao_social, e.nome_fantasia, e.situacao_cadastral, e.data_situacao_cadastral, msc.descricao as motivo_situacao_cadastral_desc, e.data_inicio_atividade, e.cnae_fiscal_principal, e.cnae_fiscal_secundaria, cnae.descricao as cnae_principal_desc, e.tipo_logradouro, e.logradouro, e.numero, e.complemento, e.bairro, e.cep, e.uf, mun.descricao as municipio_desc, e.ddd_1, e.telefone_1, e.correio_eletronico, emp.natureza_juridica, nj.descricao as natureza_juridica_desc, emp.porte_empresa, emp.capital_social, emp.ente_federativo_responsavel, sn.opcao_simples, sn.opcao_mei
FROM estabelecimentos e
INNER JOIN empresas emp ON e.cnpj_basico = emp.cnpj_basico
LEFT JOIN cnaes cnae ON e.cnae_fiscal_principal = cnae.codigo
LEFT JOIN municipios mun ON e.municipio = mun.codigo
LEFT JOIN motivos_situacao_cadastral msc ON e.motivo_situacao_cadastral = msc.codigo
LEFT JOIN naturezas_juridicas nj ON emp.natureza_juridica = nj.codigo
LEFT JOIN simples_nacional sn ON e.cnpj_basico = sn.cnpj_basico;
SELECT 'Passo 3: VIEW criada!' as status;

SELECT 'Passo 4: Criando índices (20-30min)...' as status;
CREATE UNIQUE INDEX idx_mv_new_estabelecimentos_cnpj_unique ON vw_estabelecimentos_completos_new(cnpj_completo);
CREATE INDEX idx_mv_new_estabelecimentos_razao_social ON vw_estabelecimentos_completos_new(razao_social);
CREATE INDEX idx_mv_new_estabelecimentos_nome_fantasia ON vw_estabelecimentos_completos_new(nome_fantasia);
CREATE INDEX idx_mv_new_estabelecimentos_uf ON vw_estabelecimentos_completos_new(uf);
CREATE INDEX idx_mv_new_estabelecimentos_situacao ON vw_estabelecimentos_completos_new(situacao_cadastral);
CREATE INDEX idx_mv_new_estabelecimentos_cnae ON vw_estabelecimentos_completos_new(cnae_fiscal_principal);
CREATE INDEX idx_mv_new_estabelecimentos_municipio ON vw_estabelecimentos_completos_new(municipio_desc);
CREATE INDEX idx_mv_new_estabelecimentos_uf_situacao ON vw_estabelecimentos_completos_new(uf, situacao_cadastral);
CREATE INDEX idx_mv_new_estabelecimentos_razao_social_trgm ON vw_estabelecimentos_completos_new USING gin(razao_social gin_trgm_ops);
CREATE INDEX idx_mv_new_estabelecimentos_nome_fantasia_trgm ON vw_estabelecimentos_completos_new USING gin(nome_fantasia gin_trgm_ops);
SELECT 'Passo 4: Índices criados!' as status;

ANALYZE vw_estabelecimentos_completos_new;
SELECT 'Passo 5: Estatísticas OK' as status;

SELECT 'Passo 6: Swap atômico...' as status;
BEGIN;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'vw_estabelecimentos_completos') THEN DROP VIEW IF EXISTS vw_estabelecimentos_completos_old CASCADE; ALTER VIEW vw_estabelecimentos_completos RENAME TO vw_estabelecimentos_completos_old; END IF; IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'vw_estabelecimentos_completos') THEN DROP MATERIALIZED VIEW IF EXISTS vw_estabelecimentos_completos_old; ALTER MATERIALIZED VIEW vw_estabelecimentos_completos RENAME TO vw_estabelecimentos_completos_old; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'vw_estabelecimentos_completos_old') THEN ALTER INDEX IF EXISTS idx_mv_estabelecimentos_cnpj_unique RENAME TO idx_mv_old_estabelecimentos_cnpj_unique; ALTER INDEX IF EXISTS idx_mv_estabelecimentos_razao_social RENAME TO idx_mv_old_estabelecimentos_razao_social; ALTER INDEX IF EXISTS idx_mv_estabelecimentos_nome_fantasia RENAME TO idx_mv_old_estabelecimentos_nome_fantasia; ALTER INDEX IF EXISTS idx_mv_estabelecimentos_uf RENAME TO idx_mv_old_estabelecimentos_uf; ALTER INDEX IF EXISTS idx_mv_estabelecimentos_situacao RENAME TO idx_mv_old_estabelecimentos_situacao; ALTER INDEX IF EXISTS idx_mv_estabelecimentos_cnae RENAME TO idx_mv_old_estabelecimentos_cnae; ALTER INDEX IF EXISTS idx_mv_estabelecimentos_municipio RENAME TO idx_mv_old_estabelecimentos_municipio; ALTER INDEX IF EXISTS idx_mv_estabelecimentos_uf_situacao RENAME TO idx_mv_old_estabelecimentos_uf_situacao; ALTER INDEX IF EXISTS idx_mv_estabelecimentos_razao_social_trgm RENAME TO idx_mv_old_estabelecimentos_razao_social_trgm; ALTER INDEX IF EXISTS idx_mv_estabelecimentos_nome_fantasia_trgm RENAME TO idx_mv_old_estabelecimentos_nome_fantasia_trgm; END IF; END $$;
ALTER MATERIALIZED VIEW vw_estabelecimentos_completos_new RENAME TO vw_estabelecimentos_completos;
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
SELECT 'Passo 6: Swap completo!' as status;

SELECT 'OTIMIZAÇÃO CONCLUÍDA!' as status, pg_size_pretty(pg_total_relation_size('vw_estabelecimentos_completos')) as tamanho;
