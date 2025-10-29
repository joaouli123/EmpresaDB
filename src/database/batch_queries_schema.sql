-- =========================================
-- SCHEMA BATCH QUERIES - CONSULTAS EM LOTE
-- =========================================
-- Sistema de consultas em lote com pacotes de créditos
-- Permite buscar múltiplas empresas de uma vez com filtros avançados
-- Data: 2025-10-28

-- 1. TABELA DE PACOTES DE CONSULTAS EM LOTE
-- Define os pacotes disponíveis para compra
CREATE TABLE IF NOT EXISTS clientes.batch_query_packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL CHECK (credits > 0),
    price_brl DECIMAL(10, 2) NOT NULL CHECK (price_brl >= 0),
    price_per_unit DECIMAL(10, 4) GENERATED ALWAYS AS (price_brl / credits) STORED,
    stripe_price_id VARCHAR(255) UNIQUE,
    stripe_product_id VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE clientes.batch_query_packages IS 'Pacotes de créditos para consultas em lote';
COMMENT ON COLUMN clientes.batch_query_packages.credits IS 'Número de consultas em lote incluídas no pacote';
COMMENT ON COLUMN clientes.batch_query_packages.price_per_unit IS 'Preço por consulta (calculado automaticamente)';

-- 2. TABELA DE CRÉDITOS DE CONSULTAS EM LOTE
-- Controla o saldo de créditos de cada usuário
CREATE TABLE IF NOT EXISTS clientes.batch_query_credits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES clientes.users(id) ON DELETE CASCADE,
    total_credits INTEGER DEFAULT 0 CHECK (total_credits >= 0),
    used_credits INTEGER DEFAULT 0 CHECK (used_credits >= 0),
    available_credits INTEGER GENERATED ALWAYS AS (total_credits - used_credits) STORED,
    monthly_included_credits INTEGER DEFAULT 0,
    purchased_credits INTEGER DEFAULT 0,
    last_purchase_at TIMESTAMP,
    last_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE clientes.batch_query_credits IS 'Controle de créditos de consultas em lote por usuário';
COMMENT ON COLUMN clientes.batch_query_credits.total_credits IS 'Total de créditos disponíveis (inclusas + compradas)';
COMMENT ON COLUMN clientes.batch_query_credits.used_credits IS 'Créditos já utilizados no período';
COMMENT ON COLUMN clientes.batch_query_credits.available_credits IS 'Créditos disponíveis (calculado automaticamente)';
COMMENT ON COLUMN clientes.batch_query_credits.monthly_included_credits IS 'Créditos incluídos no plano mensal';
COMMENT ON COLUMN clientes.batch_query_credits.purchased_credits IS 'Créditos comprados separadamente (não expiram)';

-- 3. TABELA DE COMPRAS DE PACOTES
-- Histórico de compras de pacotes de consultas em lote
CREATE TABLE IF NOT EXISTS clientes.batch_package_purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES clientes.users(id) ON DELETE CASCADE,
    package_id INTEGER REFERENCES clientes.batch_query_packages(id),
    stripe_payment_intent_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    credits_purchased INTEGER NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

COMMENT ON TABLE clientes.batch_package_purchases IS 'Histórico de compras de pacotes de consultas em lote';

-- 4. TABELA DE USO DE CONSULTAS EM LOTE
-- Registra cada uso de créditos de consultas em lote
CREATE TABLE IF NOT EXISTS clientes.batch_query_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES clientes.users(id) ON DELETE CASCADE,
    api_key_id INTEGER REFERENCES clientes.api_keys(id) ON DELETE SET NULL,
    credits_used INTEGER NOT NULL CHECK (credits_used > 0),
    filters_used JSONB, -- Filtros aplicados na busca
    results_returned INTEGER DEFAULT 0,
    endpoint VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE clientes.batch_query_usage IS 'Histórico de uso de consultas em lote';
COMMENT ON COLUMN clientes.batch_query_usage.credits_used IS 'Número de créditos consumidos (geralmente = results_returned)';
COMMENT ON COLUMN clientes.batch_query_usage.filters_used IS 'JSON com os filtros aplicados na consulta';

-- 5. ADICIONAR CAMPOS NA TABELA DE PLANOS
-- Adiciona suporte a consultas em lote inclusas nos planos mensais
ALTER TABLE clientes.plans 
ADD COLUMN IF NOT EXISTS monthly_batch_queries INTEGER DEFAULT 0 CHECK (monthly_batch_queries >= 0);

COMMENT ON COLUMN clientes.plans.monthly_batch_queries IS 'Número de consultas em lote incluídas no plano mensal';

-- 6. MODIFICAR monthly_usage para tracking separado
ALTER TABLE clientes.monthly_usage
ADD COLUMN IF NOT EXISTS batch_queries_used INTEGER DEFAULT 0 CHECK (batch_queries_used >= 0);

COMMENT ON COLUMN clientes.monthly_usage.batch_queries_used IS 'Consultas em lote usadas no mês atual';

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_batch_credits_user_id ON clientes.batch_query_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_purchases_user_id ON clientes.batch_package_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_purchases_status ON clientes.batch_package_purchases(status);
CREATE INDEX IF NOT EXISTS idx_batch_usage_user_id ON clientes.batch_query_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_usage_created_at ON clientes.batch_query_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_batch_packages_active ON clientes.batch_query_packages(is_active);

-- TRIGGERS
CREATE OR REPLACE FUNCTION clientes.update_batch_credits_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_batch_credits_timestamp 
BEFORE UPDATE ON clientes.batch_query_credits
FOR EACH ROW EXECUTE FUNCTION clientes.update_batch_credits_timestamp();

CREATE TRIGGER trigger_update_batch_packages_timestamp 
BEFORE UPDATE ON clientes.batch_query_packages
FOR EACH ROW EXECUTE FUNCTION clientes.update_batch_credits_timestamp();

-- INSERIR PACOTES PADRÃO
INSERT INTO clientes.batch_query_packages (name, display_name, description, credits, price_brl, sort_order) VALUES
('starter', 'Pacote Starter', '1.000 consultas em lote - Ideal para começar', 1000, 49.90, 1),
('basic', 'Pacote Basic', '5.000 consultas em lote - Melhor custo-benefício', 5000, 199.90, 2),
('professional', 'Pacote Professional', '10.000 consultas em lote - Para alto volume', 10000, 349.90, 3),
('enterprise', 'Pacote Enterprise', '50.000 consultas em lote - Máxima economia', 50000, 1499.90, 4)
ON CONFLICT DO NOTHING;

-- VIEW CONSOLIDADA DE CRÉDITOS E PLANOS
CREATE OR REPLACE VIEW clientes.vw_user_batch_credits AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    COALESCE(p.monthly_batch_queries, 0) as plan_monthly_batch_queries,
    COALESCE(bc.total_credits, 0) as total_credits,
    COALESCE(bc.used_credits, 0) as used_credits,
    COALESCE(bc.available_credits, 0) as available_credits,
    COALESCE(bc.monthly_included_credits, 0) as monthly_included_credits,
    COALESCE(bc.purchased_credits, 0) as purchased_credits,
    COALESCE(mu.batch_queries_used, 0) as batch_queries_this_month,
    ss.status as subscription_status,
    ss.current_period_end as subscription_end_date
FROM clientes.users u
LEFT JOIN clientes.stripe_subscriptions ss ON u.id = ss.user_id 
    AND ss.status IN ('active', 'trialing')
LEFT JOIN clientes.plans p ON ss.plan_id = p.id
LEFT JOIN clientes.batch_query_credits bc ON u.id = bc.user_id
LEFT JOIN clientes.monthly_usage mu ON u.id = mu.user_id 
    AND mu.month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM');

COMMENT ON VIEW clientes.vw_user_batch_credits IS 'View consolidada mostrando créditos de consultas em lote por usuário com info do plano';

-- FUNCTION PARA CONSUMIR CRÉDITOS
CREATE OR REPLACE FUNCTION clientes.consume_batch_credits(
    p_user_id INTEGER,
    p_credits_to_consume INTEGER,
    p_api_key_id INTEGER DEFAULT NULL,
    p_filters_used JSONB DEFAULT NULL,
    p_results_returned INTEGER DEFAULT 0,
    p_endpoint VARCHAR(255) DEFAULT '/search'
) RETURNS BOOLEAN AS $$
DECLARE
    v_available_credits INTEGER;
BEGIN
    -- Verificar créditos disponíveis
    SELECT COALESCE(available_credits, 0) INTO v_available_credits
    FROM clientes.batch_query_credits
    WHERE user_id = p_user_id;
    
    IF v_available_credits < p_credits_to_consume THEN
        RAISE EXCEPTION 'Créditos insuficientes. Disponível: %, Necessário: %', v_available_credits, p_credits_to_consume;
    END IF;
    
    -- Consumir créditos
    UPDATE clientes.batch_query_credits
    SET used_credits = used_credits + p_credits_to_consume,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id;
    
    -- Registrar uso
    INSERT INTO clientes.batch_query_usage (
        user_id, api_key_id, credits_used, filters_used, results_returned, endpoint
    ) VALUES (
        p_user_id, p_api_key_id, p_credits_to_consume, p_filters_used, p_results_returned, p_endpoint
    );
    
    -- Atualizar monthly_usage
    INSERT INTO clientes.monthly_usage (user_id, month_year, batch_queries_used)
    VALUES (p_user_id, TO_CHAR(CURRENT_DATE, 'YYYY-MM'), p_credits_to_consume)
    ON CONFLICT (user_id, month_year) 
    DO UPDATE SET batch_queries_used = clientes.monthly_usage.batch_queries_used + p_credits_to_consume;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION clientes.consume_batch_credits IS 'Consome créditos de consultas em lote e registra uso';

-- FUNCTION PARA ADICIONAR CRÉDITOS
CREATE OR REPLACE FUNCTION clientes.add_batch_credits(
    p_user_id INTEGER,
    p_credits INTEGER,
    p_source VARCHAR(50) DEFAULT 'purchase' -- 'purchase' ou 'plan_renewal'
) RETURNS BOOLEAN AS $$
BEGIN
    -- Criar registro se não existir
    INSERT INTO clientes.batch_query_credits (user_id, total_credits, purchased_credits)
    VALUES (p_user_id, p_credits, CASE WHEN p_source = 'purchase' THEN p_credits ELSE 0 END)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        total_credits = clientes.batch_query_credits.total_credits + p_credits,
        purchased_credits = CASE 
            WHEN p_source = 'purchase' THEN clientes.batch_query_credits.purchased_credits + p_credits
            ELSE clientes.batch_query_credits.purchased_credits
        END,
        monthly_included_credits = CASE 
            WHEN p_source = 'plan_renewal' THEN p_credits
            ELSE clientes.batch_query_credits.monthly_included_credits
        END,
        last_purchase_at = CASE WHEN p_source = 'purchase' THEN CURRENT_TIMESTAMP ELSE clientes.batch_query_credits.last_purchase_at END,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION clientes.add_batch_credits IS 'Adiciona créditos de consultas em lote (compra ou renovação de plano)';

-- FUNCTION PARA RESETAR CRÉDITOS MENSAIS
CREATE OR REPLACE FUNCTION clientes.reset_monthly_batch_credits() RETURNS INTEGER AS $$
DECLARE
    v_reset_count INTEGER := 0;
BEGIN
    -- Resetar créditos mensais para usuários com plano ativo
    UPDATE clientes.batch_query_credits bc
    SET used_credits = 0,
        total_credits = COALESCE(
            (SELECT p.monthly_batch_queries FROM clientes.plans p
             INNER JOIN clientes.stripe_subscriptions ss ON p.id = ss.plan_id
             WHERE ss.user_id = bc.user_id AND ss.status IN ('active', 'trialing')
             LIMIT 1
            ), 0
        ) + bc.purchased_credits,
        monthly_included_credits = COALESCE(
            (SELECT p.monthly_batch_queries FROM clientes.plans p
             INNER JOIN clientes.stripe_subscriptions ss ON p.id = ss.plan_id
             WHERE ss.user_id = bc.user_id AND ss.status IN ('active', 'trialing')
             LIMIT 1
            ), 0
        ),
        last_reset_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS v_reset_count = ROW_COUNT;
    RETURN v_reset_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION clientes.reset_monthly_batch_credits IS 'Reseta créditos mensais no início de cada mês';
