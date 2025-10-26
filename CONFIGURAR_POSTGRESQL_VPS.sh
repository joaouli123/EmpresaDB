#!/bin/bash
# ============================================
# SCRIPT PARA OTIMIZAR POSTGRESQL NA VPS
# Versão: Docker-friendly
# ============================================

echo "🚀 INICIANDO OTIMIZAÇÃO POSTGRESQL..."
echo ""

# ============================================
# MÉTODO 1: ALTER SYSTEM (Mais Seguro)
# ============================================
echo "📋 Método 1: Tentando ALTER SYSTEM..."

docker exec -i cnpj_postgres psql -U cnpj_user -d cnpj_db << 'EOF'
-- Configurações de Memória
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET effective_cache_size = '12GB';
ALTER SYSTEM SET work_mem = '40MB';
ALTER SYSTEM SET maintenance_work_mem = '1600MB';

-- Configurações de CPU
ALTER SYSTEM SET max_worker_processes = 4;
ALTER SYSTEM SET max_parallel_workers = 4;
ALTER SYSTEM SET max_parallel_workers_per_gather = 2;

-- Configurações de SSD
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Configurações de WAL
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET max_wal_size = '2GB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;

-- Configurações de Autovacuum
ALTER SYSTEM SET autovacuum_max_workers = 2;
ALTER SYSTEM SET autovacuum_naptime = '1min';

-- Configurações de Log
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = on;

SELECT '✅ Configurações aplicadas!' as status;
EOF

if [ $? -eq 0 ]; then
    echo "✅ ALTER SYSTEM funcionou!"
    echo ""
    echo "⚠️ REINICIANDO PostgreSQL para aplicar..."
    docker restart cnpj_postgres
    
    echo "⏳ Aguardando PostgreSQL iniciar (30 segundos)..."
    sleep 30
    
    echo ""
    echo "📊 Verificando configurações aplicadas:"
    docker exec -i cnpj_postgres psql -U cnpj_user -d cnpj_db << 'EOF2'
SELECT 
    name, 
    setting, 
    unit,
    CASE 
        WHEN unit = '8kB' THEN pg_size_pretty((setting::bigint * 8)::bigint || ' kB')
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
    'random_page_cost',
    'effective_io_concurrency'
)
ORDER BY name;
EOF2
    
    echo ""
    echo "🎉 OTIMIZAÇÃO CONCLUÍDA!"
    exit 0
fi

# ============================================
# MÉTODO 2: Editar postgresql.auto.conf
# ============================================
echo ""
echo "⚠️ Método 1 falhou. Tentando Método 2..."
echo "📝 Editando postgresql.auto.conf diretamente..."

docker exec -it cnpj_postgres bash -c "cat >> /var/lib/postgresql/data/postgresql.auto.conf << 'CONF'
# Otimizações VPS (16GB RAM, 4 CPUs, NVMe SSD)
shared_buffers = '4GB'
effective_cache_size = '12GB'
work_mem = '40MB'
maintenance_work_mem = '1600MB'
max_worker_processes = 4
max_parallel_workers = 4
max_parallel_workers_per_gather = 2
random_page_cost = 1.1
effective_io_concurrency = 200
wal_buffers = '16MB'
max_wal_size = '2GB'
min_wal_size = '1GB'
checkpoint_completion_target = 0.9
autovacuum_max_workers = 2
autovacuum_naptime = '1min'
log_min_duration_statement = 1000
log_checkpoints = on
CONF
"

if [ $? -eq 0 ]; then
    echo "✅ Arquivo postgresql.auto.conf editado!"
    echo "⚠️ Reiniciando PostgreSQL..."
    docker restart cnpj_postgres
    sleep 30
    echo "🎉 CONCLUÍDO!"
    exit 0
fi

# ============================================
# MÉTODO 3: Editar postgresql.conf (Fallback)
# ============================================
echo ""
echo "⚠️ Método 2 falhou. Tentando Método 3 (postgresql.conf)..."

# Fazer backup
docker exec -it cnpj_postgres cp /var/lib/postgresql/data/postgresql.conf /var/lib/postgresql/data/postgresql.conf.backup

# Aplicar via sed
docker exec -it cnpj_postgres bash << 'BASH'
cd /var/lib/postgresql/data

# Aplicar configurações
sed -i "s/^#*shared_buffers = .*/shared_buffers = 4GB/" postgresql.conf
sed -i "s/^#*effective_cache_size = .*/effective_cache_size = 12GB/" postgresql.conf
sed -i "s/^#*work_mem = .*/work_mem = 40MB/" postgresql.conf
sed -i "s/^#*maintenance_work_mem = .*/maintenance_work_mem = 1600MB/" postgresql.conf
sed -i "s/^#*max_worker_processes = .*/max_worker_processes = 4/" postgresql.conf
sed -i "s/^#*max_parallel_workers = .*/max_parallel_workers = 4/" postgresql.conf
sed -i "s/^#*max_parallel_workers_per_gather = .*/max_parallel_workers_per_gather = 2/" postgresql.conf
sed -i "s/^#*random_page_cost = .*/random_page_cost = 1.1/" postgresql.conf
sed -i "s/^#*effective_io_concurrency = .*/effective_io_concurrency = 200/" postgresql.conf
sed -i "s/^#*wal_buffers = .*/wal_buffers = 16MB/" postgresql.conf
sed -i "s/^#*max_wal_size = .*/max_wal_size = 2GB/" postgresql.conf
sed -i "s/^#*min_wal_size = .*/min_wal_size = 1GB/" postgresql.conf
sed -i "s/^#*checkpoint_completion_target = .*/checkpoint_completion_target = 0.9/" postgresql.conf
sed -i "s/^#*autovacuum_max_workers = .*/autovacuum_max_workers = 2/" postgresql.conf
sed -i "s/^#*autovacuum_naptime = .*/autovacuum_naptime = 1min/" postgresql.conf
sed -i "s/^#*log_min_duration_statement = .*/log_min_duration_statement = 1000/" postgresql.conf
sed -i "s/^#*log_checkpoints = .*/log_checkpoints = on/" postgresql.conf

echo "✅ postgresql.conf editado!"
BASH

if [ $? -eq 0 ]; then
    echo "✅ Configurações aplicadas ao postgresql.conf!"
    echo "⚠️ Reiniciando PostgreSQL..."
    docker restart cnpj_postgres
    sleep 30
    echo "🎉 CONCLUÍDO!"
    exit 0
fi

echo ""
echo "❌ ERRO: Nenhum método funcionou!"
echo "💡 Veja o erro acima e me avise para diagnosticar."
exit 1
