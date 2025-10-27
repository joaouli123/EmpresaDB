-- =========================================
-- SCHEMA STRIPE - INTEGRAÇÃO DE PAGAMENTOS
-- =========================================
-- Adiciona suporte completo para Stripe no sistema
-- Data: 2025-10-27

-- Adicionar campos Stripe na tabela de planos
ALTER TABLE clientes.plans 
ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_product_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_interval VARCHAR(20) DEFAULT 'month' CHECK (billing_interval IN ('month', 'year'));

-- Tabela de Clientes Stripe (Customer ID do Stripe)
CREATE TABLE IF NOT EXISTS clientes.stripe_customers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES clientes.users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Assinaturas Stripe (vincula assinatura Stripe com usuário)
CREATE TABLE IF NOT EXISTS clientes.stripe_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES clientes.users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    plan_id INTEGER REFERENCES clientes.plans(id),
    status VARCHAR(50) NOT NULL, -- active, canceled, incomplete, incomplete_expired, past_due, trialing, unpaid
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Transações/Faturas (histórico de pagamentos)
CREATE TABLE IF NOT EXISTS clientes.stripe_invoices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES clientes.users(id) ON DELETE CASCADE,
    stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_subscription_id VARCHAR(255),
    amount_total DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'brl',
    status VARCHAR(50) NOT NULL, -- draft, open, paid, uncollectible, void
    invoice_pdf VARCHAR(500),
    hosted_invoice_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

-- Tabela de Eventos Webhook (log de eventos do Stripe para debugging)
CREATE TABLE IF NOT EXISTS clientes.stripe_webhook_events (
    id SERIAL PRIMARY KEY,
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON clientes.stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_id ON clientes.stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_id ON clientes.stripe_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_stripe_id ON clientes.stripe_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON clientes.stripe_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_user_id ON clientes.stripe_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_stripe_id ON clientes.stripe_invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type ON clientes.stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed ON clientes.stripe_webhook_events(processed);

-- Constraint UNIQUE: Garante que cada usuário tenha no máximo uma assinatura ativa
-- Permite múltiplas assinaturas canceladas, mas apenas uma ativa/trialing por vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_active
ON clientes.stripe_subscriptions(user_id)
WHERE status IN ('active', 'trialing');

COMMENT ON INDEX clientes.idx_stripe_subscriptions_user_active IS 
'Garante que cada usuário tenha no máximo uma assinatura ativa (active ou trialing). Previne cobranças duplicadas.';

-- View consolidada de assinaturas ativas com informações do Stripe
CREATE OR REPLACE VIEW clientes.active_subscriptions AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    p.id as plan_id,
    p.name as plan_name,
    p.display_name as plan_display_name,
    p.monthly_queries,
    p.price_brl,
    ss.stripe_subscription_id,
    ss.status as subscription_status,
    ss.current_period_start,
    ss.current_period_end,
    ss.cancel_at_period_end,
    CASE 
        WHEN ss.status = 'active' AND ss.current_period_end > NOW() THEN TRUE
        ELSE FALSE
    END as has_active_subscription,
    COALESCE(mu.queries_used, 0) as queries_used_this_month,
    (p.monthly_queries - COALESCE(mu.queries_used, 0)) as queries_remaining
FROM clientes.users u
LEFT JOIN clientes.stripe_subscriptions ss ON u.id = ss.user_id 
    AND ss.status IN ('active', 'trialing')
LEFT JOIN clientes.plans p ON ss.plan_id = p.id
LEFT JOIN clientes.monthly_usage mu ON u.id = mu.user_id 
    AND mu.month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM');

COMMENT ON VIEW clientes.active_subscriptions IS 'View consolidada mostrando todas as assinaturas ativas com informações do Stripe e uso atual';

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION clientes.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stripe_customers_updated_at BEFORE UPDATE ON clientes.stripe_customers
    FOR EACH ROW EXECUTE FUNCTION clientes.update_updated_at_column();

CREATE TRIGGER update_stripe_subscriptions_updated_at BEFORE UPDATE ON clientes.stripe_subscriptions
    FOR EACH ROW EXECUTE FUNCTION clientes.update_updated_at_column();
