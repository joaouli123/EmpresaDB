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
            
            await self.update_stats({
                "tables": table_stats,
                "total_records": total_records,
                "progress": 100,
                "status": "completed",
                "current_step": "Concluído",
                "end_time": datetime.now().isoformat()
            })
            
            await self.log_message("info", f"✅ ETL concluído com sucesso! Total: {total_records:,} registros")
            
            self.is_running = False
            return True
            
        except Exception as e:
            self.stats["errors"].append(str(e))
            await self.update_stats({
                "status": "error",
                "current_step": f"Erro: {str(e)}",
                "end_time": datetime.now().isoformat()
            })
            await self.log_message("error", f"❌ Erro no ETL: {str(e)}")
            self.is_running = False
            return False
            
    async def stop_etl(self):
        """Para o processo ETL"""
        if self.is_running:
            await self.log_message("warning", "🛑 Solicitação de parada recebida")
            self.is_running = False
            await self.update_stats({"status": "stopped"})
            return True
        return False

etl_controller = ETLController()
