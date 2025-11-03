-- ========================================
-- Script para configurar usuário como ADMIN
-- ========================================
-- Execute este script no banco de dados para dar permissões de admin a um usuário

-- 1. VER TODOS OS USUÁRIOS E SEUS ROLES
SELECT id, username, email, role, is_active, created_at
FROM clientes.users
ORDER BY created_at DESC;

-- 2. DEFINIR UM USUÁRIO COMO ADMIN (substitua o email)
-- EXEMPLO:
UPDATE clientes.users
SET role = 'admin'
WHERE email = 'seu-email@exemplo.com';

-- 3. VERIFICAR USUÁRIOS ADMIN
SELECT id, username, email, role, is_active
FROM clientes.users
WHERE role = 'admin';

-- 4. VER API KEYS DE UM USUÁRIO ESPECÍFICO
SELECT 
    ak.id,
    ak.key,
    ak.name,
    ak.is_active,
    ak.created_at,
    u.email,
    u.role
FROM clientes.api_keys ak
JOIN clientes.users u ON ak.user_id = u.id
WHERE u.email = 'seu-email@exemplo.com'
ORDER BY ak.created_at DESC;

-- 5. VERIFICAR SE UMA API KEY ESPECÍFICA É DE ADMIN
SELECT 
    u.id,
    u.username,
    u.email,
    u.role,
    ak.key,
    ak.name,
    ak.is_active
FROM clientes.api_keys ak
JOIN clientes.users u ON ak.user_id = u.id
WHERE ak.key = 'sk_sua_api_key_aqui';
