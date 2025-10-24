
-- ============================================
-- ÍNDICES PARA OTIMIZAÇÃO DE PERFORMANCE
-- Execute este script no banco PostgreSQL
-- ============================================

-- Índices na tabela estabelecimentos (mais consultada)
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_cnpj_completo 
ON estabelecimentos(cnpj_completo);

CREATE INDEX IF NOT EXISTS idx_estabelecimentos_razao_social 
ON estabelecimentos(razao_social);

CREATE INDEX IF NOT EXISTS idx_estabelecimentos_uf 
ON estabelecimentos(uf);

CREATE INDEX IF NOT EXISTS idx_estabelecimentos_municipio 
ON estabelecimentos(municipio);

CREATE INDEX IF NOT EXISTS idx_estabelecimentos_situacao 
ON estabelecimentos(situacao_cadastral);

CREATE INDEX IF NOT EXISTS idx_estabelecimentos_cnae 
ON estabelecimentos(cnae_fiscal_principal);

-- Índice composto para buscas por região
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_uf_municipio 
ON estabelecimentos(uf, municipio);

-- Índice para busca por nome fantasia
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_nome_fantasia 
ON estabelecimentos(nome_fantasia);

-- Índices na tabela empresas
CREATE INDEX IF NOT EXISTS idx_empresas_cnpj_basico 
ON empresas(cnpj_basico);

CREATE INDEX IF NOT EXISTS idx_empresas_razao_social 
ON empresas(razao_social);

-- Índices na tabela socios
CREATE INDEX IF NOT EXISTS idx_socios_cnpj_basico 
ON socios(cnpj_basico);

CREATE INDEX IF NOT EXISTS idx_socios_nome_socio 
ON socios(nome_socio);

-- Analisar tabelas após criar índices
ANALYZE estabelecimentos;
ANALYZE empresas;
ANALYZE socios;
