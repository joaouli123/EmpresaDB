-- Script para corrigir constraint da tabela socios
-- Problema: ON CONFLICT requer uma constraint UNIQUE, mas parece que ela foi removida ou não existe

-- 1. Verificar constraints existentes
SELECT 
    constraint_name, 
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'socios' 
  AND table_schema = 'public';

-- 2. Verificar índices existentes  
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'socios' 
  AND schemaname = 'public';

-- 3. Remover constraint UNIQUE antiga se existir
ALTER TABLE socios DROP CONSTRAINT IF EXISTS socios_cnpj_basico_identificador_socio_cnpj_cpf_socio_key CASCADE;

-- 4. Criar nova constraint UNIQUE (necessária para ON CONFLICT funcionar)
-- Esta constraint garante que não teremos sócios duplicados
ALTER TABLE socios 
ADD CONSTRAINT socios_unique_key 
UNIQUE (cnpj_basico, identificador_socio, cnpj_cpf_socio);

-- 5. Verificar se foi criada corretamente
SELECT 
    constraint_name, 
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'socios' 
  AND constraint_type = 'UNIQUE';

-- 6. Testar se ON CONFLICT funciona agora
-- (Este teste não insere nada, apenas valida a sintaxe)
EXPLAIN 
INSERT INTO socios (
    cnpj_basico, 
    identificador_socio, 
    nome_socio, 
    cnpj_cpf_socio
) VALUES (
    '00000000',
    '1',
    'TESTE',
    '00000000000'
)
ON CONFLICT (cnpj_basico, identificador_socio, cnpj_cpf_socio) 
DO NOTHING;

\echo 'Constraint criada com sucesso! O ETL de sócios agora funcionará.'
