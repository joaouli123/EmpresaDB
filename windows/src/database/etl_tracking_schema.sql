-- Schema de controle e rastreamento do processo ETL
-- Garante idempotência, integridade e recuperação

-- Tabela de execuções do ETL
CREATE TABLE IF NOT EXISTS execution_runs (
    id SERIAL PRIMARY KEY,
    execution_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'running',
    host_info TEXT,
    config_chunk_size INTEGER,
    config_max_workers INTEGER,
    total_files INTEGER DEFAULT 0,
    files_completed INTEGER DEFAULT 0,
    total_records_expected BIGINT DEFAULT 0,
    total_records_imported BIGINT DEFAULT 0,
    has_errors BOOLEAN DEFAULT false,
    error_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de rastreamento de arquivos
CREATE TABLE IF NOT EXISTS etl_tracking_files (
    id SERIAL PRIMARY KEY,
    execution_id UUID REFERENCES execution_runs(execution_id),
    file_name VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_hash VARCHAR(64),
    file_size_bytes BIGINT,
    table_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    total_csv_lines BIGINT,
    total_imported_records BIGINT DEFAULT 0,
    chunks_total INTEGER DEFAULT 0,
    chunks_completed INTEGER DEFAULT 0,
    has_discrepancy BOOLEAN DEFAULT false,
    discrepancy_details TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(file_name, file_hash)
);

-- Tabela de rastreamento de chunks
CREATE TABLE IF NOT EXISTS etl_tracking_chunks (
    id SERIAL PRIMARY KEY,
    file_tracking_id INTEGER REFERENCES etl_tracking_files(id),
    chunk_number INTEGER NOT NULL,
    chunk_offset BIGINT NOT NULL,
    chunk_size INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(file_tracking_id, chunk_number)
);

-- Tabela de logs estruturados
CREATE TABLE IF NOT EXISTS etl_logs (
    id SERIAL PRIMARY KEY,
    execution_id UUID REFERENCES execution_runs(execution_id),
    file_tracking_id INTEGER REFERENCES etl_tracking_files(id),
    log_level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_execution_runs_status ON execution_runs(status);
CREATE INDEX IF NOT EXISTS idx_execution_runs_started ON execution_runs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_tracking_files_execution ON etl_tracking_files(execution_id);
CREATE INDEX IF NOT EXISTS idx_tracking_files_status ON etl_tracking_files(status);
CREATE INDEX IF NOT EXISTS idx_tracking_files_hash ON etl_tracking_files(file_hash);
CREATE INDEX IF NOT EXISTS idx_tracking_files_name ON etl_tracking_files(file_name);

CREATE INDEX IF NOT EXISTS idx_tracking_chunks_file ON etl_tracking_chunks(file_tracking_id);
CREATE INDEX IF NOT EXISTS idx_tracking_chunks_status ON etl_tracking_chunks(status);

CREATE INDEX IF NOT EXISTS idx_etl_logs_execution ON etl_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_etl_logs_timestamp ON etl_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_etl_logs_level ON etl_logs(log_level);

-- Comentários
COMMENT ON TABLE execution_runs IS 'Rastreamento de cada execução completa do ETL';
COMMENT ON TABLE etl_tracking_files IS 'Rastreamento individual de cada arquivo processado';
COMMENT ON TABLE etl_tracking_chunks IS 'Rastreamento de chunks dentro de arquivos grandes';
COMMENT ON TABLE etl_logs IS 'Logs estruturados do processo ETL';

-- View para monitoramento em tempo real
CREATE OR REPLACE VIEW vw_etl_status AS
SELECT 
    er.execution_id,
    er.started_at,
    er.finished_at,
    er.status as execution_status,
    er.total_files,
    er.files_completed,
    er.total_records_expected,
    er.total_records_imported,
    er.has_errors,
    COUNT(etf.id) as files_in_execution,
    SUM(CASE WHEN etf.status = 'completed' THEN 1 ELSE 0 END) as files_completed_count,
    SUM(CASE WHEN etf.status = 'failed' THEN 1 ELSE 0 END) as files_failed_count,
    SUM(CASE WHEN etf.has_discrepancy THEN 1 ELSE 0 END) as files_with_discrepancies,
    SUM(etf.total_csv_lines) as total_csv_lines,
    SUM(etf.total_imported_records) as total_db_records
FROM execution_runs er
LEFT JOIN etl_tracking_files etf ON er.execution_id = etf.execution_id
GROUP BY er.execution_id, er.started_at, er.finished_at, er.status, 
         er.total_files, er.files_completed, er.total_records_expected,
         er.total_records_imported, er.has_errors
ORDER BY er.started_at DESC;
