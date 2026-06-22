-- Criar schema se não existir
CREATE SCHEMA IF NOT EXISTS clientes;

CREATE TABLE IF NOT EXISTS clientes.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(11) UNIQUE NOT NULL,
    cpf VARCHAR(11) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    activation_token VARCHAR(255),
    activation_token_expires TIMESTAMP,
    reset_password_token VARCHAR(255),
    reset_password_token_expires TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes.api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES clientes.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    total_requests INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS clientes.user_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES clientes.users(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    requests INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_users_username ON clientes.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON clientes.users(email);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON clientes.api_keys(key);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON clientes.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_date ON clientes.user_usage(user_id, date);

-- Auto-heal: garante as colunas de ativação/reset mesmo em tabela já existente (DB-Q01)
ALTER TABLE clientes.users ADD COLUMN IF NOT EXISTS activation_token VARCHAR(255);
ALTER TABLE clientes.users ADD COLUMN IF NOT EXISTS activation_token_expires TIMESTAMP;
ALTER TABLE clientes.users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);
ALTER TABLE clientes.users ADD COLUMN IF NOT EXISTS reset_password_token_expires TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_users_activation_token ON clientes.users(activation_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON clientes.users(reset_password_token);