#!/bin/bash
# ============================================
# CONFIGURAR POSTGRESQL DOCKER - VPS
# Otimizações para 16GB RAM, 4 CPUs, NVMe SSD
# ============================================

echo "🔧 CONFIGURANDO POSTGRESQL PARA MÁXIMA PERFORMANCE"
echo "===================================================="
echo ""

# MÉTODO 1: Tentar ALTER SYSTEM primeiro
echo "📋 Método 1: Aplicando configurações via ALTER SYSTEM..."
echo ""

docker exec -i cnpj_postgres psql -U postgres -d cnpj_db << 'EOF'
-- Configurações de Memória (16GB RAM)
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET effective_cache_size = '12GB';
ALTER SYSTEM SET work_mem = '40MB';
ALTER SYSTEM SET maintenance_work_mem = '1600MB';

-- Configurações de CPU (4 vCPUs)
ALTER SYSTEM SET max_worker_processes = 4;
ALTER SYSTEM SET max_parallel_workers = 4;
ALTER SYSTEM SET max_parallel_workers_per_gather = 2;

-- Configurações de SSD NVMe
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
    echo ""
    echo "✅ ALTER SYSTEM funcionou!"
    echo ""
    echo "🔄 Reiniciando PostgreSQL para aplicar..."
    docker restart cnpj_postgres
    
    echo "⏳ Aguardando PostgreSQL iniciar (30 segundos)..."
    sleep 30
    
    echo ""
    echo "📊 VERIFICANDO CONFIGURAÇÕES APLICADAS:"
    docker exec -i cnpj_postgres psql -U postgres -d cnpj_db << 'EOF2'
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
    'max_parallel_workers_per_gather',
    'random_page_cost',
    'effective_io_concurrency',
    'wal_buffers',
    'max_wal_size'
)
ORDER BY name;
EOF2
    
    echo ""
    echo "===================================================="
    echo "🎉 POSTGRESQL OTIMIZADO COM SUCESSO!"
    echo "===================================================="
    echo ""
    echo "📊 GANHOS ESPERADOS:"
    echo "   • Queries complexas: 20-30% mais rápido"
    echo "   • Melhor uso de memória (menos I/O)"
    echo "   • Manutenção automática otimizada"
    echo ""
    echo "✅ PRÓXIMO PASSO:"
    echo "   Aguardar MATERIALIZED VIEW terminar na VPS"
    echo "   (você vai ver 'OTIMIZAÇÃO CONCLUÍDA!' no terminal)"
    exit 0
fi

echo ""
echo "❌ ALTER SYSTEM falhou. Tente com usuário postgres."
exit 1
