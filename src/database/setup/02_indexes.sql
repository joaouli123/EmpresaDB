-- =====================================================================
-- ESTÁGIO 2 — Índices (rodar DEPOIS da importação)
-- Criados com CREATE INDEX CONCURRENTLY para não travar o banco.
-- TODAS as colunas validadas contra 01_core_tables.sql.
-- Corrige DB-02 (índices em colunas inexistentes) e DB-03 (trigram p/ ILIKE).
-- O orquestrador roda cada comando em autocommit (CONCURRENTLY exige).
-- =====================================================================

-- ---------- Empresas ----------
-- Busca por razão social com ILIKE '%texto%' -> trigram GIN
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_empresas_razao_trgm
    ON empresas USING gin (razao_social gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_empresas_natureza
    ON empresas (natureza_juridica);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_empresas_porte
    ON empresas (porte_empresa);

-- ---------- Estabelecimentos (tabela mais consultada) ----------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estab_cnpj_completo
    ON estabelecimentos (cnpj_completo);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estab_nome_fantasia_trgm
    ON estabelecimentos USING gin (nome_fantasia gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estab_bairro_trgm
    ON estabelecimentos USING gin (bairro gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estab_logradouro_trgm
    ON estabelecimentos USING gin (logradouro gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estab_situacao
    ON estabelecimentos (situacao_cadastral);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estab_uf
    ON estabelecimentos (uf);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estab_municipio
    ON estabelecimentos (municipio);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estab_cnae_principal
    ON estabelecimentos (cnae_fiscal_principal);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estab_matriz_filial
    ON estabelecimentos (identificador_matriz_filial);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estab_cep
    ON estabelecimentos (cep);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estab_data_inicio
    ON estabelecimentos (data_inicio_atividade);
-- Filtro combinado comum: UF + situação (ex.: ativas de um estado)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estab_uf_situacao
    ON estabelecimentos (uf, situacao_cadastral);

-- ---------- Sócios ----------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_socios_cnpj_basico
    ON socios (cnpj_basico);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_socios_nome_trgm
    ON socios USING gin (nome_socio gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_socios_cpf_cnpj
    ON socios (cnpj_cpf_socio);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_socios_qualificacao
    ON socios (qualificacao_socio);

-- ---------- Simples Nacional ----------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_simples_opcao
    ON simples_nacional (opcao_simples);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_simples_mei
    ON simples_nacional (opcao_mei);
