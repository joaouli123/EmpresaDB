-- =====================================================================
-- ESTÁGIO 3 — Materialized View da rota quente (rodar DEPOIS da importação)
-- Corrige DB-01: a rota /cnpj e /search passam a ler de um objeto
-- MATERIALIZADO e indexado, não de 6 JOINs recalculados em 47M de linhas.
-- O índice UNIQUE em cnpj_completo é OBRIGATÓRIO para REFRESH CONCURRENTLY.
-- =====================================================================

DROP MATERIALIZED VIEW IF EXISTS vw_estabelecimentos_completos CASCADE;
DROP VIEW IF EXISTS vw_estabelecimentos_completos CASCADE;

CREATE MATERIALIZED VIEW vw_estabelecimentos_completos AS
SELECT
    e.cnpj_completo,
    e.identificador_matriz_filial,
    emp.razao_social,
    e.nome_fantasia,
    e.situacao_cadastral,
    e.data_situacao_cadastral,
    msc.descricao AS motivo_situacao_cadastral_desc,
    e.data_inicio_atividade,
    e.cnae_fiscal_principal,
    e.cnae_fiscal_secundaria,
    cnae.descricao AS cnae_principal_desc,
    e.tipo_logradouro,
    e.logradouro,
    e.numero,
    e.complemento,
    e.bairro,
    e.cep,
    e.uf,
    mun.descricao AS municipio_desc,
    e.ddd_1,
    e.telefone_1,
    e.correio_eletronico,
    emp.natureza_juridica,
    nj.descricao AS natureza_juridica_desc,
    emp.porte_empresa,
    emp.capital_social,
    emp.ente_federativo_responsavel,
    sn.opcao_simples,
    sn.opcao_mei
FROM estabelecimentos e
INNER JOIN empresas emp ON e.cnpj_basico = emp.cnpj_basico
LEFT JOIN motivos_situacao_cadastral msc ON e.motivo_situacao_cadastral = msc.codigo
LEFT JOIN cnaes cnae ON e.cnae_fiscal_principal = cnae.codigo
LEFT JOIN municipios mun ON e.municipio = mun.codigo
LEFT JOIN naturezas_juridicas nj ON emp.natureza_juridica = nj.codigo
LEFT JOIN simples_nacional sn ON e.cnpj_basico = sn.cnpj_basico
WITH DATA;

-- UNIQUE: necessário para REFRESH MATERIALIZED VIEW CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_estab_cnpj_completo
    ON vw_estabelecimentos_completos (cnpj_completo);

-- Busca por nome (ILIKE) -> trigram
CREATE INDEX IF NOT EXISTS idx_mv_estab_razao_trgm
    ON vw_estabelecimentos_completos USING gin (razao_social gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_mv_estab_fantasia_trgm
    ON vw_estabelecimentos_completos USING gin (nome_fantasia gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_mv_estab_municipio_desc_trgm
    ON vw_estabelecimentos_completos USING gin (municipio_desc gin_trgm_ops);

-- Filtros comuns
CREATE INDEX IF NOT EXISTS idx_mv_estab_uf
    ON vw_estabelecimentos_completos (uf);
CREATE INDEX IF NOT EXISTS idx_mv_estab_situacao
    ON vw_estabelecimentos_completos (situacao_cadastral);
CREATE INDEX IF NOT EXISTS idx_mv_estab_cnae
    ON vw_estabelecimentos_completos (cnae_fiscal_principal);

ANALYZE vw_estabelecimentos_completos;
