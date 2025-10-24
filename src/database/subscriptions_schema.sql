-- Schema para Sistema de Assinaturas e Controle de Limites
-- Armazenado no schema 'clientes' (isolado dos dados públicos)

CREATE SCHEMA IF NOT EXISTS clientes;

-- Tabela de Planos Disponíveis
CREATE TABLE IF NOT EXISTS clientes.plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    monthly_queries INTEGER NOT NULL,
    price_brl DECIMAL(10, 2) NOT NULL,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Assinaturas dos Usuários
CREATE TABLE IF NOT EXISTS clientes.subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES clientes.users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES clientes.plans(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
    monthly_limit INTEGER NOT NULL,
    extra_credits INTEGER DEFAULT 0,
    renewal_date DATE NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Uso Mensal (controle de limite)
CREATE TABLE IF NOT EXISTS clientes.monthly_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES clientes.users(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL,
    queries_used INTEGER DEFAULT 0,
    last_query_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, month_year)
);

-- Tabela de Histórico de Consultas (auditoria detalhada)
CREATE TABLE IF NOT EXISTS clientes.query_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES clientes.users(id) ON DELETE CASCADE,
    api_key_id INTEGER REFERENCES clientes.api_keys(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    query_params JSONB,
    response_status INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pacotes Adicionais
CREATE TABLE IF NOT EXISTS clientes.addon_purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES clientes.users(id) ON DELETE CASCADE,
    queries_added INTEGER NOT NULL,
    price_paid_brl DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON clientes.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON clientes.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_monthly_usage_user_month ON clientes.monthly_usage(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_query_log_user_date ON clientes.query_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_addon_purchases_user ON clientes.addon_purchases(user_id);

-- Inserir planos padrão
INSERT INTO clientes.plans (name, display_name, monthly_queries, price_brl, features) VALUES
('basico', 'Básico', 300, 59.90, '["300 consultas mensais", "Acesso API completo", "Dados atualizados", "Suporte por email", "Dashboard básico"]'::jsonb),
('profissional', 'Profissional', 500, 89.90, '["500 consultas mensais", "Acesso API completo", "Dados atualizados diariamente", "Suporte prioritário", "Dashboard avançado", "Exportação em Excel/CSV", "Filtros personalizados"]'::jsonb),
('empresarial', 'Empresarial', 1000, 149.00, '["1.000 consultas mensais", "Acesso API ilimitado", "Dados em tempo real", "Suporte 24/7", "Dashboard personalizado", "Exportação ilimitada", "Webhooks e integrações", "Relatórios customizados"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Função para resetar contadores mensais
CREATE OR REPLACE FUNCTION clientes.reset_monthly_usage()
RETURNS void AS $$
BEGIN
    -- Arquiva uso do mês anterior e cria novos registros
    INSERT INTO clientes.monthly_usage (user_id, month_year, queries_used)
    SELECT user_id, TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 0
    FROM clientes.subscriptions
    WHERE status = 'active'
    ON CONFLICT (user_id, month_year) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- View para facilitar consultas de limites
CREATE OR REPLACE VIEW clientes.user_limits AS
SELECT 
    u.id as user_id,
    u.username,
    s.plan_id,
    p.display_name as plan_name,
    s.monthly_limit,
    s.extra_credits,
    COALESCE(m.queries_used, 0) as queries_used,
    (s.monthly_limit + s.extra_credits) as total_limit,
    (s.monthly_limit + s.extra_credits - COALESCE(m.queries_used, 0)) as queries_remaining,
    s.status as subscription_status,
    s.renewal_date
FROM clientes.users u
LEFT JOIN clientes.subscriptions s ON u.id = s.user_id AND s.status = 'active'
LEFT JOIN clientes.plans p ON s.plan_id = p.id
LEFT JOIN clientes.monthly_usage m ON u.id = m.user_id AND m.month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM');

COMMENT ON VIEW clientes.user_limits IS 'View consolidada mostrando limites e uso atual de cada usuário';
