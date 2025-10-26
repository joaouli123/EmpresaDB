#!/bin/bash
# ============================================
# MÉTODO MAIS SIMPLES (SEMPRE FUNCIONA!)
# Copia postgresql.conf, edita, e reinicia
# ============================================

echo "🔧 CONFIGURANDO POSTGRESQL (Método Simples)"
echo ""

# 1. Fazer backup do arquivo original
echo "📦 1/5: Fazendo backup..."
docker exec -it cnpj_postgres bash -c "cp /var/lib/postgresql/data/postgresql.conf /var/lib/postgresql/data/postgresql.conf.backup2"

# 2. Criar arquivo de configuração temporário
echo "📝 2/5: Criando configurações..."
cat > /tmp/pg_custom.conf << 'EOF'
# ============================================
# OTIMIZAÇÕES VPS (16GB RAM, 4 CPUs, NVMe SSD)
# ============================================

# MEMÓRIA
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 40MB
maintenance_work_mem = 1600MB

# CPU
max_worker_processes = 4
max_parallel_workers = 4
max_parallel_workers_per_gather = 2

# SSD NVMe
random_page_cost = 1.1
effective_io_concurrency = 200

# WAL
wal_buffers = 16MB
max_wal_size = 2GB
min_wal_size = 1GB
checkpoint_completion_target = 0.9

# AUTOVACUUM
autovacuum_max_workers = 2
autovacuum_naptime = 1min

# LOGGING
log_min_duration_statement = 1000
log_checkpoints = on
EOF

# 3. Copiar para dentro do container
echo "📤 3/5: Copiando para container..."
docker cp /tmp/pg_custom.conf cnpj_postgres:/tmp/pg_custom.conf

# 4. Adicionar ao postgresql.conf
echo "✏️ 4/5: Aplicando configurações..."
docker exec -it cnpj_postgres bash -c "cat /tmp/pg_custom.conf >> /var/lib/postgresql/data/postgresql.conf"

# 5. Reiniciar PostgreSQL
echo "🔄 5/5: Reiniciando PostgreSQL..."
docker restart cnpj_postgres

echo "⏳ Aguardando iniciar (30 segundos)..."
sleep 30

# Verificar
echo ""
echo "✅ VERIFICANDO CONFIGURAÇÕES:"
docker exec -i cnpj_postgres psql -U cnpj_user -d cnpj_db -c "
SELECT 
    name, 
    setting,
    unit,
    CASE 
        WHEN unit = '8kB' THEN pg_size_pretty((setting::bigint * 8192)::bigint)
        WHEN unit = 'kB' THEN pg_size_pretty((setting::bigint * 1024)::bigint)
        WHEN unit = 'MB' THEN pg_size_pretty((setting::bigint * 1024 * 1024)::bigint)
        ELSE setting || COALESCE(' ' || unit, '')
    END as valor_legivel
FROM pg_settings 
WHERE name IN (
    'shared_buffers', 
    'effective_cache_size', 
    'work_mem', 
    'maintenance_work_mem',
    'max_worker_processes',
    'max_parallel_workers',
    'random_page_cost'
)
ORDER BY name;
"

echo ""
echo "🎉 CONCLUÍDO!"
echo ""
echo "💡 DICA: Para verificar se está funcionando, execute:"
echo "   docker exec -i cnpj_postgres psql -U cnpj_user -d cnpj_db -c 'SHOW shared_buffers;'"
