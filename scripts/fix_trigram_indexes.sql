-- Verifica e cria índices trigram para buscas ILIKE rápidas
-- CASO 1: view regular -> converte para materialized (índices funcionam)
-- CASO 2: já é materialized -> só garante os índices

BEGIN;

-- 1. Garantir extensão pg_trgm
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Verificar se é view regular ou materialized
DO $$
DECLARE
    view_type char;
BEGIN
    SELECT relkind INTO view_type FROM pg_class WHERE relname = 'vw_estabelecimentos_completos';
    
    IF view_type IS NULL THEN
        RAISE NOTICE 'vw_estabelecimentos_completos nao existe';
        RETURN;
    END IF;
    
    IF view_type = 'v' THEN
        RAISE NOTICE 'vw_estabelecimentos_completos eh VIEW REGULAR (v) - indices nao podem ser criados. Converta para MATERIALIZED VIEW usando src/database/materialized_view.sql';
        RETURN;
    END IF;
    
    IF view_type = 'm' THEN
        RAISE NOTICE 'vw_estabelecimentos_completos eh MATERIALIZED VIEW (m) - criando indices trigram...';
    END IF;
END$$;

-- 3. Criar índices trigram (se materialized view existe)
-- Usa IF NOT EXISTS via bloco anônimo para não quebrar se já existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_estab_razao_social_trgm') THEN
        CREATE INDEX idx_estab_razao_social_trgm ON vw_estabelecimentos_completos USING gin (razao_social gin_trgm_ops);
        RAISE NOTICE 'Criado idx_estab_razao_social_trgm';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_estab_nome_fantasia_trgm') THEN
        CREATE INDEX idx_estab_nome_fantasia_trgm ON vw_estabelecimentos_completos USING gin (nome_fantasia gin_trgm_ops);
        RAISE NOTICE 'Criado idx_estab_nome_fantasia_trgm';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_estab_municipio_trgm') THEN
        CREATE INDEX idx_estab_municipio_trgm ON vw_estabelecimentos_completos USING gin (municipio_desc gin_trgm_ops);
        RAISE NOTICE 'Criado idx_estab_municipio_trgm';
    END IF;
END$$;

COMMIT;
