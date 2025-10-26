-- ============================================
-- VIEW MATERIALIZADA PARA PERFORMANCE EXTREMA
-- Execute este script no PostgreSQL da VPS
-- ============================================

-- A view atual (vw_estabelecimentos_completos) é lenta porque recalcula os JOINs toda vez
-- View materializada = pré-calculada e armazenada fisicamente = 100x+ mais rápida

-- 1. Dropar a view normal se existir
DROP VIEW IF EXISTS vw_estabelecimentos_completos CASCADE;

-- 2. Criar MATERIALIZED VIEW (dados pré-calculados)
DROP MATERIALIZED VIEW IF EXISTS vw_estabelecimentos_completos CASCADE;

CREATE MATERIALIZED VIEW vw_estabelecimentos_completos AS
SELECT 
    -- Dados do estabelecimento
    e.cnpj_completo,
    e.cnpj_basico,
    e.cnpj_ordem,
    e.cnpj_dv,
    e.identificador_matriz_filial,
    e.nome_fantasia,
    e.situacao_cadastral,
    e.data_situacao_cadastral,
    e.data_inicio_atividade,
    e.cnae_fiscal_principal,
    e.cnae_fiscal_secundaria,
    e.tipo_logradouro,
    e.logradouro,
    e.numero,
    e.complemento,
    e.bairro,
    e.cep,
    e.uf,
    e.municipio,
    e.ddd_1,
    e.telefone_1,
    e.ddd_2,
    e.telefone_2,
    e.ddd_fax,
    e.fax,
    e.correio_eletronico,
    e.situacao_especial,
    e.data_situacao_especial,
    
    -- Dados da empresa (JOIN com empresas)
    emp.razao_social,
    emp.natureza_juridica,
    emp.qualificacao_responsavel,
    emp.capital_social,
    emp.porte_empresa,
    emp.ente_federativo_responsavel,
    
    -- Descrições (JOINs com tabelas auxiliares)
    m.descricao as municipio_desc,
    msc.descricao as motivo_situacao_cadastral_desc,
    nj.descricao as natureza_juridica_desc,
    cnae.descricao as cnae_principal_desc,
    
    -- Simples Nacional e MEI
    CASE 
        WHEN sn.opcao_pelo_simples = 'S' THEN 'S'
        ELSE 'N'
    END as opcao_simples,
    CASE 
        WHEN sn.opcao_pelo_mei = 'S' THEN 'S'
        ELSE 'N'
    END as opcao_mei
    
FROM estabelecimentos e
LEFT JOIN empresas emp ON e.cnpj_basico = emp.cnpj_basico
LEFT JOIN municipios m ON e.municipio = m.codigo
LEFT JOIN motivos_situacao_cadastral msc ON e.motivo_situacao_cadastral = msc.codigo
LEFT JOIN naturezas_juridicas nj ON emp.natureza_juridica = nj.codigo
LEFT JOIN cnaes cnae ON e.cnae_fiscal_principal = cnae.codigo
LEFT JOIN simples_nacional sn ON e.cnpj_basico = sn.cnpj_basico;

-- 3. Criar índices na MATERIALIZED VIEW
-- Esses índices aceleram as consultas na view materializada

CREATE UNIQUE INDEX idx_mv_estabelecimentos_cnpj_completo 
ON vw_estabelecimentos_completos(cnpj_completo);

CREATE INDEX idx_mv_estabelecimentos_razao_social_trgm 
ON vw_estabelecimentos_completos USING gin(razao_social gin_trgm_ops);

CREATE INDEX idx_mv_estabelecimentos_nome_fantasia_trgm 
ON vw_estabelecimentos_completos USING gin(nome_fantasia gin_trgm_ops);

CREATE INDEX idx_mv_estabelecimentos_uf 
ON vw_estabelecimentos_completos(uf);

CREATE INDEX idx_mv_estabelecimentos_uf_situacao 
ON vw_estabelecimentos_completos(uf, situacao_cadastral);

CREATE INDEX idx_mv_estabelecimentos_cnae 
ON vw_estabelecimentos_completos(cnae_fiscal_principal);

CREATE INDEX idx_mv_estabelecimentos_situacao 
ON vw_estabelecimentos_completos(situacao_cadastral);

CREATE INDEX idx_mv_estabelecimentos_porte 
ON vw_estabelecimentos_completos(porte_empresa);

CREATE INDEX idx_mv_estabelecimentos_simples_mei 
ON vw_estabelecimentos_completos(opcao_simples, opcao_mei);

-- Índice parcial para empresas ativas (maioria das consultas)
CREATE INDEX idx_mv_estabelecimentos_ativos 
ON vw_estabelecimentos_completos(uf, municipio, cnae_fiscal_principal) 
WHERE situacao_cadastral = '02';

-- 4. Atualizar estatísticas
ANALYZE vw_estabelecimentos_completos;

-- ============================================
-- COMO ATUALIZAR A VIEW MATERIALIZADA
-- ============================================

-- Opção 1: Atualização COMPLETA (recomendado executar 1x por dia, de madrugada)
-- REFRESH MATERIALIZED VIEW vw_estabelecimentos_completos;

-- Opção 2: Atualização CONCORRENTE (não bloqueia leituras, mas é mais lento)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY vw_estabelecimentos_completos;

-- ============================================
-- CRIAR JOB AUTOMÁTICO PARA ATUALIZAÇÃO
-- ============================================

-- O PostgreSQL não tem cron nativo, mas você pode usar pg_cron extension
-- OU criar um cron job no Linux para executar:
-- 0 3 * * * psql -U cnpj_user -d cnpj_db -c "REFRESH MATERIALIZED VIEW CONCURRENTLY vw_estabelecimentos_completos;"

-- ============================================
-- BENEFÍCIOS
-- ============================================
-- ✅ Consultas 100x+ mais rápidas (dados pré-calculados)
-- ✅ Sem JOINs em tempo real (já está tudo junto)
-- ✅ Índices otimizados na view materializada
-- ✅ Menos carga no banco de dados
-- ✅ Consultas complexas executam em milissegundos ao invés de segundos

COMMIT;
