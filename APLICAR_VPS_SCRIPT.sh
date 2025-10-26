
#!/bin/bash
# Script para aplicar otimizações SQL na VPS
# Uso: bash APLICAR_VPS_SCRIPT.sh

echo "🚀 Iniciando aplicação das otimizações SQL..."
echo ""

# Verificar se o arquivo SQL existe
if [ ! -f "APLICAR_VPS_LIMPO.sql" ]; then
    echo "❌ Erro: Arquivo APLICAR_VPS_LIMPO.sql não encontrado!"
    echo "Certifique-se de que o arquivo está no mesmo diretório."
    exit 1
fi

# Executar SQL dentro do container Docker
echo "📝 Aplicando SQL no PostgreSQL..."
docker exec -i cnpj_postgres psql -U cnpj_user -d cnpj_db < APLICAR_VPS_LIMPO.sql

# Verificar se deu certo
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Otimizações aplicadas com sucesso!"
    echo ""
    echo "📊 Verificando MATERIALIZED VIEW..."
    docker exec -it cnpj_postgres psql -U cnpj_user -d cnpj_db -c "SELECT pg_size_pretty(pg_total_relation_size('vw_estabelecimentos_completos')) as tamanho;"
else
    echo ""
    echo "❌ Erro ao aplicar otimizações. Verifique os logs acima."
    exit 1
fi
