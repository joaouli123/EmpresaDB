import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
import logging
from pathlib import Path
from src.etl.downloader import RFBDownloader
from src.etl.importer import CNPJImporter
from src.api.websocket_manager import ws_manager
from src.config import settings
from src.database.connection import db_manager

logger = logging.getLogger(__name__)

class ETLController:
    def __init__(self):
        self.is_running = False
        self.current_task = None
        self.stats = {
            "status": "idle",
            "current_step": "",
            "progress": 0,
            "total_files": 0,
            "processed_files": 0,
            "total_records": 0,
            "imported_records": 0,
            "errors": [],
            "start_time": None,
            "end_time": None,
            "tables": {}
        }
        self.config = {
            "chunk_size": settings.CHUNK_SIZE,
            "max_workers": settings.MAX_WORKERS,
            "download_enabled": True,
            "import_enabled": True
        }
        
    async def update_stats(self, updates: Dict[str, Any]):
        """Atualiza estatísticas e envia via WebSocket"""
        self.stats.update(updates)
        await ws_manager.broadcast_progress("stats_update", self.stats)
        
    async def log_message(self, level: str, message: str, details: Dict[str, Any] = None):
        """Envia log via WebSocket"""
        await ws_manager.broadcast_log(level, message, details)
        logger.log(getattr(logging, level.upper()), message)
        
    async def update_config(self, new_config: Dict[str, Any]):
        """Atualiza configurações do ETL"""
        self.config.update(new_config)
        
    async def get_detailed_status(self) -> Dict[str, Any]:
        """Retorna status detalhado do ETL em andamento"""
        if not self.is_running:
            return {
                "is_running": False,
                "message": "Nenhum ETL em execução"
            }
        
        # Busca informações da execução atual no banco
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            # Busca última execução ativa
            cursor.execute("""
                SELECT execution_id, start_time, status
                FROM etl_control.executions
                WHERE status = 'running'
                ORDER BY start_time DESC
                LIMIT 1
            """)
            execution = cursor.fetchone()
            
            if not execution:
                cursor.close()
                return {
                    "is_running": self.is_running,
                    "message": "ETL rodando mas sem registro no banco"
                }
            
            execution_id = execution[0]
            
            # Busca arquivos processados
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_files,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_files,
                    SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_files,
                    SUM(COALESCE(records_imported, 0)) as total_records_imported
                FROM etl_control.file_processing
                WHERE execution_id = %s
            """, (execution_id,))
            file_stats = cursor.fetchone()
            
            # Busca arquivo atualmente sendo processado
            cursor.execute("""
                SELECT file_path, status, records_imported, start_time
                FROM etl_control.file_processing
                WHERE execution_id = %s AND status = 'processing'
                ORDER BY start_time DESC
                LIMIT 1
            """, (execution_id,))
            current_file = cursor.fetchone()
            cursor.close()
            
            return {
                "is_running": True,
                "execution_id": execution_id,
                "start_time": execution[1].isoformat(),
                "total_files": file_stats[0] or 0,
                "completed_files": file_stats[1] or 0,
                "processing_files": file_stats[2] or 0,
                "total_records_imported": file_stats[3] or 0,
                "current_file": {
                    "path": current_file[0],
                    "status": current_file[1],
                    "records_imported": current_file[2] or 0,
                    "start_time": current_file[3].isoformat()
                } if current_file else None,
                **self.stats
            }

        
        # Atualiza settings globais
        if "chunk_size" in new_config:
            settings.CHUNK_SIZE = new_config["chunk_size"]
        if "max_workers" in new_config:
            settings.MAX_WORKERS = new_config["max_workers"]
            
        await self.log_message("info", "Configurações atualizadas", self.config)
        return self.config
        
    async def get_database_stats(self):
        """Obtém estatísticas do banco de dados"""
        tables = [
            'cnaes', 'municipios', 'motivos_situacao_cadastral',
            'naturezas_juridicas', 'paises', 'qualificacoes_socios',
            'empresas', 'estabelecimentos', 'socios', 'simples_nacional'
        ]
        
        table_stats = {}
        for table in tables:
            count = db_manager.get_table_count(table)
            table_stats[table] = count or 0
            
        return table_stats
        
    async def validate_import(self, csv_path: Path, table_name: str, imported_count: int):
        """Valida se a importação foi completa comparando CSV vs DB"""
        try:
            import pandas as pd
            
            # Conta linhas no CSV
            csv_lines = 0
            with open(csv_path, 'r', encoding='latin1') as f:
                for _ in f:
                    csv_lines += 1
            
            db_count = db_manager.get_table_count(table_name) or 0
            
            validation = {
                "table": table_name,
                "csv_lines": csv_lines,
                "db_records": db_count,
                "imported_count": imported_count,
                "match": csv_lines == db_count,
                "difference": abs(csv_lines - db_count)
            }
            
            if not validation["match"]:
                await self.log_message(
                    "warning",
                    f"⚠️ Divergência detectada em {table_name}",
                    validation
                )
            else:
                await self.log_message(
                    "info",
                    f"✓ Validação OK para {table_name}",
                    validation
                )
                
            return validation
            
        except Exception as e:
            await self.log_message("error", f"Erro na validação: {str(e)}")
            return None
            
    async def run_etl(self):
        """Executa o processo completo de ETL com monitoramento em tempo real"""
        if self.is_running:
            await self.log_message("warning", "ETL já está em execução!")
            return False
            
        self.is_running = True
        self.stats = {
            "status": "running",
            "current_step": "Iniciando",
            "progress": 0,
            "total_files": 0,
            "processed_files": 0,
            "total_records": 0,
            "imported_records": 0,
            "errors": [],
            "start_time": datetime.now().isoformat(),
            "end_time": None,
            "tables": {},
            "validations": []
        }
        
        try:
            # Anexa loggers ao WebSocket para capturar logs em tempo real
            ws_manager.attach_logger('src.etl.importer')
            ws_manager.attach_logger('src.etl.downloader')
            ws_manager.attach_logger('src.etl.etl_tracker')
            
            await self.update_stats({"status": "running"})
            await self.log_message("info", "🚀 Iniciando processo ETL")
            
            # Passo 1: Download
            if self.config["download_enabled"]:
                await self.update_stats({
                    "current_step": "Download de arquivos",
                    "progress": 10
                })
                await self.log_message("info", "📥 Baixando arquivos da Receita Federal...")
                
                # Executa download em thread separada para não bloquear event loop
                downloader = RFBDownloader()
                downloaded_files = await asyncio.to_thread(downloader.download_latest_files)
                
                total_files = sum(len(files) for files in downloaded_files.values())
                await self.update_stats({
                    "total_files": total_files,
                    "progress": 30
                })
                await self.log_message("info", f"✓ {total_files} arquivos baixados")
            else:
                await self.log_message("info", "⏭️ Download desabilitado, pulando...")
                downloaded_files = {}
                
            # Passo 2: Importação
            if self.config["import_enabled"]:
                await self.update_stats({
                    "current_step": "Importação de dados",
                    "progress": 40
                })
                await self.log_message("info", "📊 Importando dados para o banco...")
                
                # Importação em thread separada para não bloquear WebSocket
                importer = CNPJImporter()
                await asyncio.to_thread(importer.process_all, downloaded_files)
                
                await self.update_stats({"progress": 80})
                
            # Passo 3: Validação e estatísticas finais
            await self.update_stats({
                "current_step": "Validação e estatísticas",
                "progress": 90
            })
            await self.log_message("info", "📈 Coletando estatísticas finais...")
            
            table_stats = await self.get_database_stats()
            total_records = sum(table_stats.values())
            
            # Busca estatísticas de novos/atualizados do tracker
            import_stats = await self.get_import_statistics()
            
            await self.update_stats({
                "tables": table_stats,
                "total_records": total_records,
                "new_records": import_stats.get("new_records", 0),
                "updated_records": import_stats.get("updated_records", 0),
                "unchanged_records": import_stats.get("unchanged_records", 0),
                "progress": 100,
                "status": "completed",
                "current_step": "Concluído",
                "end_time": datetime.now().isoformat()
            })
            
            await self.log_message("info", f"✅ ETL concluído com sucesso! Total: {total_records:,} registros")
            await self.log_message("info", f"📊 Novos: {import_stats.get('new_records', 0):,} | Atualizados: {import_stats.get('updated_records', 0):,} | Sem mudança: {import_stats.get('unchanged_records', 0):,}")
            
            self.is_running = False
            return True
            
        except Exception as e:
            error_msg = f"Erro no ETL: {str(e)}"
            logger.error(error_msg, exc_info=True)
            await self.log_message("error", error_msg)
            await self.update_stats({
                "status": "error",
                "current_step": "Erro",
                "end_time": datetime.now().isoformat()
            })
            self.stats["errors"].append(error_msg)
            self.is_running = False
            return False
            
        finally:
            # Remove handlers de logging do WebSocket
            ws_manager.detach_logger('src.etl.importer')
            ws_manager.detach_logger('src.etl.downloader')
            ws_manager.detach_logger('src.etl.etl_tracker')
    
    async def get_import_statistics(self) -> Dict[str, int]:
        """Busca estatísticas de importação (novos vs atualizados)"""
        try:
            with db_manager.get_connection() as conn:
                with conn.cursor() as cursor:
                    # Verifica se a tabela existe (evita erro quando ainda não foi criada)
                    cursor.execute("SELECT to_regclass('etl_control.import_stats')")
                    table_exists = cursor.fetchone()[0]
                    if not table_exists:
                        logger.warning("Tabela etl_control.import_stats não existe. Estatísticas zeradas.")
                        return {"new_records": 0, "updated_records": 0, "unchanged_records": 0}

                    # Busca estatísticas da última execução
                    cursor.execute("""
                        SELECT 
                            COALESCE(SUM(CASE WHEN action_type = 'insert' THEN 1 ELSE 0 END), 0) as new_records,
                            COALESCE(SUM(CASE WHEN action_type = 'update' THEN 1 ELSE 0 END), 0) as updated_records,
                            COALESCE(SUM(CASE WHEN action_type = 'skip' THEN 1 ELSE 0 END), 0) as unchanged_records
                        FROM etl_control.import_stats
                        WHERE execution_id = (
                            SELECT execution_id 
                            FROM etl_control.executions 
                            ORDER BY start_time DESC 
                            LIMIT 1
                        )
                    """)
                    result = cursor.fetchone()
                    
                    if result:
                        return {
                            "new_records": result[0],
                            "updated_records": result[1],
                            "unchanged_records": result[2]
                        }
                    return {"new_records": 0, "updated_records": 0, "unchanged_records": 0}
        except Exception as e:
            logger.error(f"Erro ao buscar estatísticas de importação: {e}")
            return {"new_records": 0, "updated_records": 0, "unchanged_records": 0}
            
    async def stop_etl(self):
        """Para o processo ETL"""
        if self.is_running:
            await self.log_message("warning", "🛑 Solicitação de parada recebida")
            self.is_running = False
            await self.update_stats({"status": "stopped"})
            return True
        return False

etl_controller = ETLController()
