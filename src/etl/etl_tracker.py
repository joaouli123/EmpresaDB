import hashlib
import socket
import json
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime
import logging
from src.database.connection import db_manager
from src.config import settings

logger = logging.getLogger(__name__)

class ETLTracker:
    """
    Sistema de rastreamento robusto para ETL
    Garante:
    - Idempotência (não reprocessar arquivos já completos)
    - Integridade (validar CSV vs DB)
    - Recuperação (continuar de onde parou)
    - Auditoria completa
    """
    
    def __init__(self, execution_id: Optional[str] = None):
        self.execution_id = execution_id
        self.current_file_id = None
        
    def calculate_file_hash(self, file_path: Path) -> str:
        """Calcula SHA-256 do arquivo para detectar mudanças"""
        sha256 = hashlib.sha256()
        try:
            with open(file_path, 'rb') as f:
                for chunk in iter(lambda: f.read(65536), b''):
                    sha256.update(chunk)
            return sha256.hexdigest()
        except Exception as e:
            logger.error(f"Erro ao calcular hash de {file_path}: {e}")
            return None
            
    def count_csv_lines(self, file_path: Path, skip_header: bool = True) -> int:
        """Conta total de linhas no CSV (excluindo cabeçalho por padrão)"""
        try:
            with open(file_path, 'r', encoding='latin1') as f:
                total = sum(1 for _ in f)
                # Remove cabeçalho se existir
                return total - 1 if skip_header and total > 0 else total
        except Exception as e:
            logger.error(f"Erro ao contar linhas de {file_path}: {e}")
            return 0
            
    def start_execution(self) -> str:
        """Inicia uma nova execução do ETL"""
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                host_info = f"{socket.gethostname()}"
                
                cursor.execute("""
                    INSERT INTO execution_runs (
                        host_info, config_chunk_size, config_max_workers, status
                    ) VALUES (%s, %s, %s, 'running')
                    RETURNING execution_id
                """, (host_info, settings.CHUNK_SIZE, settings.MAX_WORKERS))
                
                self.execution_id = cursor.fetchone()[0]
                conn.commit()
                cursor.close()
                
                logger.info(f"✓ Execução iniciada: {self.execution_id}")
                return self.execution_id
                
        except Exception as e:
            logger.error(f"Erro ao iniciar execução: {e}")
            raise
            
    def finish_execution(self, status: str = 'completed', error_details: str = None):
        """Finaliza a execução atual"""
        if not self.execution_id:
            return
            
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Atualiza totais finais
                cursor.execute("""
                    UPDATE execution_runs SET
                        finished_at = CURRENT_TIMESTAMP,
                        status = %s,
                        error_details = %s,
                        files_completed = (
                            SELECT COUNT(*) FROM etl_tracking_files 
                            WHERE execution_id = %s AND status = 'completed'
                        ),
                        total_files = (
                            SELECT COUNT(*) FROM etl_tracking_files 
                            WHERE execution_id = %s
                        ),
                        total_records_imported = (
                            SELECT COALESCE(SUM(total_imported_records), 0) 
                            FROM etl_tracking_files 
                            WHERE execution_id = %s
                        ),
                        has_errors = (
                            SELECT EXISTS(
                                SELECT 1 FROM etl_tracking_files 
                                WHERE execution_id = %s AND status = 'failed'
                            )
                        )
                    WHERE execution_id = %s
                """, (status, error_details, self.execution_id, self.execution_id, 
                      self.execution_id, self.execution_id, self.execution_id))
                
                conn.commit()
                cursor.close()
                logger.info(f"✓ Execução finalizada: {status}")
                
        except Exception as e:
            logger.error(f"Erro ao finalizar execução: {e}")
            
    def check_file_status(self, file_path: Path, file_hash: str) -> Optional[str]:
        """
        Verifica se arquivo já foi processado
        Retorna: 'completed', 'partial', None (não processado)
        """
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT id, status, total_csv_lines, total_imported_records
                    FROM etl_tracking_files
                    WHERE file_name = %s AND file_hash = %s
                    ORDER BY created_at DESC
                    LIMIT 1
                """, (file_path.name, file_hash))
                
                result = cursor.fetchone()
                cursor.close()
                
                if not result:
                    return None
                    
                file_id, status, csv_lines, db_records = result
                
                # Se completado e validado, pula
                if status == 'completed' and csv_lines == db_records:
                    logger.info(f"⏭️  Arquivo {file_path.name} já processado 100% ({db_records} registros)")
                    return 'completed'
                    
                # Se parcial, pode retomar
                if status in ['partial', 'running']:
                    logger.info(f"⏸️  Arquivo {file_path.name} parcialmente processado, retomando...")
                    self.current_file_id = file_id
                    return 'partial'
                    
                return None
                
        except Exception as e:
            logger.error(f"Erro ao verificar status do arquivo: {e}")
            return None
            
    def start_file_processing(self, file_path: Path, file_type: str, table_name: str) -> int:
        """Registra início do processamento de um arquivo"""
        file_hash = self.calculate_file_hash(file_path)
        file_size = file_path.stat().st_size if file_path.exists() else 0
        
        # Verifica se já foi processado
        status = self.check_file_status(file_path, file_hash)
        if status == 'completed':
            return None  # Pula arquivo
            
        if status == 'partial' and self.current_file_id:
            return self.current_file_id  # Retoma processamento
            
        # Novo arquivo
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                total_lines = self.count_csv_lines(file_path)
                
                cursor.execute("""
                    INSERT INTO etl_tracking_files (
                        execution_id, file_name, file_type, file_hash, 
                        file_size_bytes, table_name, status, started_at, total_csv_lines
                    ) VALUES (%s, %s, %s, %s, %s, %s, 'running', CURRENT_TIMESTAMP, %s)
                    RETURNING id
                """, (self.execution_id, file_path.name, file_type, file_hash, 
                      file_size, table_name, total_lines))
                
                file_id = cursor.fetchone()[0]
                conn.commit()
                cursor.close()
                
                self.current_file_id = file_id
                logger.info(f"📁 Iniciando processamento: {file_path.name} ({total_lines:,} linhas)")
                return file_id
                
        except Exception as e:
            logger.error(f"Erro ao iniciar processamento de arquivo: {e}")
            return None
            
    def start_chunk(self, file_id: int, chunk_number: int, chunk_offset: int, chunk_size: int) -> int:
        """Registra início de processamento de um chunk"""
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT INTO etl_tracking_chunks (
                        file_tracking_id, chunk_number, chunk_offset, chunk_size, 
                        status, started_at
                    ) VALUES (%s, %s, %s, %s, 'running', CURRENT_TIMESTAMP)
                    ON CONFLICT (file_tracking_id, chunk_number) 
                    DO UPDATE SET status = 'running', started_at = CURRENT_TIMESTAMP
                    RETURNING id
                """, (file_id, chunk_number, chunk_offset, chunk_size))
                
                chunk_id = cursor.fetchone()[0]
                conn.commit()
                cursor.close()
                
                return chunk_id
                
        except Exception as e:
            logger.error(f"Erro ao iniciar chunk: {e}")
            return None
            
    def finish_chunk(self, chunk_id: int, records_processed: int, status: str = 'completed', error: str = None):
        """Finaliza processamento de um chunk"""
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    UPDATE etl_tracking_chunks SET
                        status = %s,
                        finished_at = CURRENT_TIMESTAMP,
                        records_processed = %s,
                        error_message = %s
                    WHERE id = %s
                """, (status, records_processed, error, chunk_id))
                
                conn.commit()
                cursor.close()
                
        except Exception as e:
            logger.error(f"Erro ao finalizar chunk: {e}")
            
    def finish_file_processing(self, file_id: int, status: str = 'completed'):
        """Finaliza processamento de arquivo e valida integridade"""
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Obtém dados do arquivo
                cursor.execute("""
                    SELECT table_name, total_csv_lines
                    FROM etl_tracking_files
                    WHERE id = %s
                """, (file_id,))
                
                result = cursor.fetchone()
                if not result:
                    return
                    
                table_name, csv_lines = result
                
                # Conta registros no banco
                db_count = db_manager.get_table_count(table_name) or 0
                
                # Calcula chunks completados
                cursor.execute("""
                    SELECT 
                        COUNT(*) as chunks_total,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as chunks_completed,
                        COALESCE(SUM(records_processed), 0) as total_imported
                    FROM etl_tracking_chunks
                    WHERE file_tracking_id = %s
                """, (file_id,))
                
                chunks_info = cursor.fetchone()
                chunks_total, chunks_completed, total_imported = chunks_info if chunks_info else (0, 0, 0)
                
                # Verifica discrepâncias
                has_discrepancy = (csv_lines != total_imported)
                discrepancy_details = None
                
                if has_discrepancy:
                    discrepancy_details = json.dumps({
                        "csv_lines": csv_lines,
                        "imported": total_imported,
                        "difference": csv_lines - total_imported
                    })
                    logger.warning(f"⚠️  DISCREPÂNCIA: CSV={csv_lines:,} vs Importado={total_imported:,}")
                else:
                    logger.info(f"✓ VALIDAÇÃO OK: {total_imported:,} registros")
                
                # Atualiza status final
                cursor.execute("""
                    UPDATE etl_tracking_files SET
                        status = %s,
                        finished_at = CURRENT_TIMESTAMP,
                        total_imported_records = %s,
                        chunks_total = %s,
                        chunks_completed = %s,
                        has_discrepancy = %s,
                        discrepancy_details = %s
                    WHERE id = %s
                """, (status, total_imported, chunks_total, chunks_completed, 
                      has_discrepancy, discrepancy_details, file_id))
                
                conn.commit()
                cursor.close()
                
        except Exception as e:
            logger.error(f"Erro ao finalizar arquivo: {e}")
            
    def log(self, level: str, message: str, details: Dict[str, Any] = None):
        """Registra log estruturado"""
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT INTO etl_logs (
                        execution_id, file_tracking_id, log_level, message, details
                    ) VALUES (%s, %s, %s, %s, %s)
                """, (self.execution_id, self.current_file_id, level.upper(), 
                      message, json.dumps(details) if details else None))
                
                conn.commit()
                cursor.close()
                
        except Exception as e:
            logger.error(f"Erro ao registrar log: {e}")
