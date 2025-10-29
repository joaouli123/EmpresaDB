-- Script para adicionar colunas faltantes na tabela clientes.users
-- Execute este script no banco de dados da VPS

-- Adicionar coluna phone (telefone)
ALTER TABLE clientes.users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(11) UNIQUE;

-- Adicionar coluna cpf
ALTER TABLE clientes.users 
ADD COLUMN IF NOT EXISTS cpf VARCHAR(11) UNIQUE;

-- Adicionar colunas de reset de senha
ALTER TABLE clientes.users 
ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);

ALTER TABLE clientes.users 
ADD COLUMN IF NOT EXISTS reset_password_token_expires TIMESTAMP;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON clientes.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_cpf ON clientes.users(cpf);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON clientes.users(reset_password_token);
