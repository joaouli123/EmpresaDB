-- Script de Migração para Corrigir Problemas de Foreign Keys
-- Execute este script no seu banco PostgreSQL ANTES de rodar o ETL novamente

-- 1. Remover foreign keys problemáticas da tabela EMPRESAS
ALTER TABLE IF EXISTS empresas 
  DROP CONSTRAINT IF EXISTS empresas_qualificacao_responsavel_fkey,
  DROP CONSTRAINT IF EXISTS empresas_natureza_juridica_fkey;

-- 2. Remover foreign keys problemáticas da tabela ESTABELECIMENTOS  
ALTER TABLE IF EXISTS estabelecimentos
  DROP CONSTRAINT IF EXISTS estabelecimentos_motivo_situacao_cadastral_fkey,
  DROP CONSTRAINT IF EXISTS estabelecimentos_pais_fkey,
  DROP CONSTRAINT IF EXISTS estabelecimentos_cnae_fiscal_principal_fkey,
  DROP CONSTRAINT IF EXISTS estabelecimentos_municipio_fkey;

-- 3. Remover foreign keys problemáticas da tabela SOCIOS
ALTER TABLE IF EXISTS socios
  DROP CONSTRAINT IF EXISTS socios_qualificacao_socio_fkey,
  DROP CONSTRAINT IF EXISTS socios_pais_fkey,
  DROP CONSTRAINT IF EXISTS socios_qualificacao_representante_fkey;

-- 4. Limpar dados inválidos de empresas (se já tiver tentado importar)
UPDATE empresas 
SET qualificacao_responsavel = NULL 
WHERE qualificacao_responsavel NOT IN (SELECT codigo FROM qualificacoes_socios);

UPDATE empresas 
SET natureza_juridica = NULL 
WHERE natureza_juridica NOT IN (SELECT codigo FROM naturezas_juridicas);

-- Mensagem de conclusão
SELECT 'Migração concluída! Agora você pode rodar o ETL novamente.' as status;
