-- ============================================
-- CONFIGURAÇÕES POSTGRESQL OTIMIZADAS
-- Para VPS: 16GB RAM, 4 vCPUs, 200GB NVMe SSD
-- Execute como superusuário (postgres)
-- ============================================

-- ATENÇÃO: Estas configurações vão no arquivo postgresql.conf
-- Ou execute via ALTER SYSTEM e depois: SELECT pg_reload_conf();

-- ===== MEMÓRIA (16GB RAM DISPONÍVEL) =====

-- shared_buffers: 25% da RAM para cache de dados
-- 16GB * 0.25 = 4GB
ALTER SYSTEM SET shared_buffers = '4GB';

-- effective_cache_size: 75% da RAM (quanto o PostgreSQL assume que o SO tem em cache)
-- 16GB * 0.75 = 12GB
ALTER SYSTEM SET effective_cache_size = '12GB';

-- work_mem: Memória para operações de ordenação/hash por conexão
-- Com 4 vCPUs, assumindo ~100 conexões simultâneas máximas
-- 16GB / 100 / 4 = 40MB por operação
ALTER SYSTEM SET work_mem = '40MB';

-- maintenance_work_mem: Memória para VACUUM, CREATE INDEX, etc.
-- 10% da RAM = 1.6GB
ALTER SYSTEM SET maintenance_work_mem = '1600MB';

-- ===== CPU (4 vCPUs) =====

-- max_worker_processes: Número de processos background
ALTER SYSTEM SET max_worker_processes = 4;

-- max_parallel_workers_per_gather: Workers paralelos por query
ALTER SYSTEM SET max_parallel_workers_per_gather = 2;

-- max_parallel_workers: Total de workers paralelos
ALTER SYSTEM SET max_parallel_workers = 4;

-- max_parallel_maintenance_workers: Workers para operações de manutenção
ALTER SYSTEM SET max_parallel_maintenance_workers = 2;

-- ===== CONEXÕES =====

-- max_connections: Conexões simultâneas
-- Para API, 100 é suficiente com connection pooling
ALTER SYSTEM SET max_connections = 100;

-- ===== WRITE AHEAD LOG (WAL) - DISCO NVMe SSD =====

-- wal_buffers: Buffer do WAL (automaticamente 3% de shared_buffers)
ALTER SYSTEM SET wal_buffers = '16MB';

-- checkpoint_completion_target: Espalhar checkpoints ao longo do tempo
ALTER SYSTEM SET checkpoint_completion_target = 0.9;

-- max_wal_size: Tamanho máximo do WAL antes de forçar checkpoint
ALTER SYSTEM SET max_wal_size = '2GB';

-- min_wal_size: Tamanho mínimo do WAL
ALTER SYSTEM SET min_wal_size = '1GB';

-- ===== QUERY PLANNER =====

-- random_page_cost: Com SSD, acesso aleatório é quase tão rápido quanto sequencial
-- Default é 4.0, com SSD use 1.1
ALTER SYSTEM SET random_page_cost = 1.1;

-- effective_io_concurrency: Operações I/O simultâneas (SSD)
ALTER SYSTEM SET effective_io_concurrency = 200;

-- ===== AUTOVACUUM (MANUTENÇÃO AUTOMÁTICA) =====

-- autovacuum: Ativar limpeza automática
ALTER SYSTEM SET autovacuum = on;

-- autovacuum_max_workers: Workers para autovacuum
ALTER SYSTEM SET autovacuum_max_workers = 2;

-- autovacuum_naptime: Tempo entre execuções (1 minuto)
ALTER SYSTEM SET autovacuum_naptime = '1min';

-- autovacuum_vacuum_threshold: Threshold para VACUUM
ALTER SYSTEM SET autovacuum_vacuum_threshold = 50;

-- autovacuum_analyze_threshold: Threshold para ANALYZE
ALTER SYSTEM SET autovacuum_analyze_threshold = 50;

-- autovacuum_vacuum_scale_factor: Escala para VACUUM (10% da tabela)
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.1;

-- autovacuum_analyze_scale_factor: Escala para ANALYZE (5% da tabela)
ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.05;

-- ===== LOGGING (PERFORMANCE MONITORING) =====

-- log_min_duration_statement: Logar queries lentas (> 1 segundo)
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- log_line_prefix: Formato do log
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';

-- log_checkpoints: Logar checkpoints
ALTER SYSTEM SET log_checkpoints = on;

-- log_connections: Logar conexões
ALTER SYSTEM SET log_connections = on;

-- log_disconnections: Logar desconexões
ALTER SYSTEM SET log_disconnections = on;

-- log_lock_waits: Logar esperas por locks
ALTER SYSTEM SET log_lock_waits = on;

-- ===== STATISTICS =====

-- track_activity_query_size: Tamanho da query no pg_stat_activity
ALTER SYSTEM SET track_activity_query_size = 4096;

-- track_io_timing: Rastrear tempo de I/O
ALTER SYSTEM SET track_io_timing = on;

-- ===== APLICAR CONFIGURAÇÕES =====
-- Recarregar configuração sem reiniciar PostgreSQL
SELECT pg_reload_conf();

-- ===== VERIFICAR CONFIGURAÇÕES =====
SELECT name, setting, unit, source 
FROM pg_settings 
WHERE name IN (
    'shared_buffers',
    'effective_cache_size',
    'work_mem',
    'maintenance_work_mem',
    'max_connections',
    'max_worker_processes',
    'max_parallel_workers',
    'random_page_cost',
    'effective_io_concurrency'
)
ORDER BY name;

-- ===== APÓS APLICAR =====
-- Algumas configurações requerem RESTART do PostgreSQL:
-- sudo systemctl restart postgresql
-- 
-- Verifique se aplicou corretamente:
-- SHOW shared_buffers;
-- SHOW effective_cache_size;
-- SHOW work_mem;

-- ============================================
-- CONFIGURAÇÕES ADICIONAIS NO postgresql.conf
-- ============================================
-- Se ALTER SYSTEM não funcionar, edite diretamente:
-- sudo nano /etc/postgresql/16/main/postgresql.conf
-- 
-- Adicione/modifique estas linhas:
-- shared_buffers = 4GB
-- effective_cache_size = 12GB
-- work_mem = 40MB
-- maintenance_work_mem = 1600MB
-- max_connections = 100
-- max_worker_processes = 4
-- max_parallel_workers = 4
-- max_parallel_workers_per_gather = 2
-- random_page_cost = 1.1
-- effective_io_concurrency = 200
-- wal_buffers = 16MB
-- max_wal_size = 2GB
-- min_wal_size = 1GB
-- checkpoint_completion_target = 0.9
--
-- Depois: sudo systemctl restart postgresql

COMMIT;
