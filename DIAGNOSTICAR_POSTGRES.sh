#!/bin/bash
# ============================================
# DIAGNÓSTICO POSTGRESQL
# Descobre o problema e sugere solução
# ============================================

echo "🔍 DIAGNÓSTICO POSTGRESQL DOCKER"
echo "=================================="
echo ""

# 1. Container está rodando?
echo "1️⃣ Verificando se container está rodando..."
docker ps | grep cnpj_postgres
if [ $? -ne 0 ]; then
    echo "❌ ERRO: Container cnpj_postgres não está rodando!"
    echo "💡 Solução: docker start cnpj_postgres"
    exit 1
fi
echo "✅ Container rodando"
echo ""

# 2. PostgreSQL está aceitando conexões?
echo "2️⃣ Testando conexão PostgreSQL..."
docker exec -i cnpj_postgres psql -U cnpj_user -d cnpj_db -c "SELECT version();" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ ERRO: PostgreSQL não está respondendo!"
    echo "💡 Solução: docker restart cnpj_postgres"
    exit 1
fi
echo "✅ PostgreSQL respondendo"
echo ""

# 3. Verificar permissões do usuário
echo "3️⃣ Verificando permissões do usuário cnpj_user..."
docker exec -i cnpj_postgres psql -U cnpj_user -d cnpj_db -c "
SELECT 
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin
FROM pg_roles 
WHERE rolname = 'cnpj_user';
"
echo ""

# 4. Verificar localização do postgresql.conf
echo "4️⃣ Localizando arquivos de configuração..."
docker exec -i cnpj_postgres psql -U cnpj_user -d cnpj_db -c "SHOW config_file;"
echo ""

# 5. Verificar se pode escrever no arquivo
echo "5️⃣ Testando permissão de escrita..."
docker exec -it cnpj_postgres bash -c "ls -lh /var/lib/postgresql/data/postgresql.conf"
echo ""

# 6. Verificar configurações atuais
echo "6️⃣ Configurações atuais relevantes:"
docker exec -i cnpj_postgres psql -U cnpj_user -d cnpj_db -c "
SELECT 
    name, 
    setting,
    unit,
    source
FROM pg_settings 
WHERE name IN (
    'shared_buffers', 
    'effective_cache_size', 
    'work_mem',
    'max_worker_processes'
)
ORDER BY name;
"
echo ""

# 7. Verificar se usuário pode fazer ALTER SYSTEM
echo "7️⃣ Testando ALTER SYSTEM..."
docker exec -i cnpj_postgres psql -U cnpj_user -d cnpj_db -c "ALTER SYSTEM SET application_name = 'teste';" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ ERRO: Usuário cnpj_user NÃO tem permissão para ALTER SYSTEM!"
    echo ""
    echo "💡 SOLUÇÃO: Conceder permissão de superusuário:"
    echo "   docker exec -i cnpj_postgres psql -U postgres -c \"ALTER USER cnpj_user WITH SUPERUSER;\""
    echo ""
    echo "   OU usar o usuário postgres:"
    echo "   docker exec -i cnpj_postgres psql -U postgres -d cnpj_db -c \"ALTER SYSTEM SET ...\""
else
    echo "✅ ALTER SYSTEM funcionou!"
    # Reverter teste
    docker exec -i cnpj_postgres psql -U cnpj_user -d cnpj_db -c "ALTER SYSTEM RESET application_name;" > /dev/null 2>&1
fi
echo ""

echo "=================================="
echo "✅ DIAGNÓSTICO COMPLETO!"
echo ""
echo "📋 RECOMENDAÇÕES:"
echo ""
echo "Método 1 (Mais Seguro) - Conceder permissão ao usuário:"
echo "  docker exec -i cnpj_postgres psql -U postgres -c \"ALTER USER cnpj_user WITH SUPERUSER;\""
echo ""
echo "Método 2 (Alternativo) - Usar usuário postgres:"
echo "  Substitua '-U cnpj_user' por '-U postgres' nos comandos ALTER SYSTEM"
echo ""
echo "Método 3 (Manual) - Editar arquivo diretamente:"
echo "  Use o script: CONFIGURAR_POSTGRESQL_SIMPLES.sh"
