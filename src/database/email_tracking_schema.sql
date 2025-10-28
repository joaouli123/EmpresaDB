-- Schema para controle de envio de emails e follow-ups

-- Tabela para rastrear emails enviados
CREATE TABLE IF NOT EXISTS clientes.email_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    email_type VARCHAR(50) NOT NULL, -- 'account_created', 'activation', 'subscription_created', 'subscription_renewed', 'subscription_expired', 'subscription_cancelled', 'usage_50', 'usage_80'
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'failed', 'bounced'
    error_message TEXT,
    metadata JSONB, -- Dados adicionais (plan_name, etc)
    FOREIGN KEY (user_id) REFERENCES clientes.users(id) ON DELETE CASCADE
);

-- Tabela para controle de notificações de uso enviadas
CREATE TABLE IF NOT EXISTS clientes.usage_notifications_sent (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    month_year VARCHAR(7) NOT NULL,
    notification_50_sent BOOLEAN DEFAULT FALSE,
    notification_80_sent BOOLEAN DEFAULT FALSE,
    sent_50_at TIMESTAMP,
    sent_80_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES clientes.users(id) ON DELETE CASCADE,
    UNIQUE(user_id, month_year)
);

-- Tabela para controle de follow-ups de assinaturas vencidas
CREATE TABLE IF NOT EXISTS clientes.subscription_followup_tracking (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subscription_id INTEGER NOT NULL,
    attempt_number INTEGER NOT NULL DEFAULT 1, -- 1 a 5
    last_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_attempt_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'completed', 'abandoned'
    total_attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES clientes.users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES clientes.stripe_subscriptions(id) ON DELETE CASCADE,
    UNIQUE(user_id, subscription_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON clientes.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON clientes.email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON clientes.email_logs(sent_at);

CREATE INDEX IF NOT EXISTS idx_followup_user_id ON clientes.subscription_followup_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_followup_subscription_id ON clientes.subscription_followup_tracking(subscription_id);
CREATE INDEX IF NOT EXISTS idx_followup_status ON clientes.subscription_followup_tracking(status);
CREATE INDEX IF NOT EXISTS idx_followup_next_attempt ON clientes.subscription_followup_tracking(next_attempt_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_followup_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_followup_timestamp
    BEFORE UPDATE ON clientes.subscription_followup_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_followup_updated_at();

COMMENT ON TABLE clientes.email_logs IS 'Log de todos os emails enviados pelo sistema';
COMMENT ON TABLE clientes.subscription_followup_tracking IS 'Controle de follow-ups automáticos para assinaturas vencidas';
