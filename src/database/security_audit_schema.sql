
-- Tabela de auditoria de segurança
CREATE TABLE IF NOT EXISTS clientes.security_audit_log (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id INTEGER REFERENCES clientes.users(id) ON DELETE SET NULL,
    details TEXT,
    severity VARCHAR(20) DEFAULT 'INFO',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_audit_event_type ON clientes.security_audit_log(event_type);
CREATE INDEX idx_security_audit_user_id ON clientes.security_audit_log(user_id);
CREATE INDEX idx_security_audit_created_at ON clientes.security_audit_log(created_at);
CREATE INDEX idx_security_audit_severity ON clientes.security_audit_log(severity);

-- Tabela de IPs bloqueados
CREATE TABLE IF NOT EXISTS clientes.blocked_ips (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) UNIQUE NOT NULL,
    reason TEXT,
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blocked_until TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_blocked_ips_ip ON clientes.blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_active ON clientes.blocked_ips(is_active);
