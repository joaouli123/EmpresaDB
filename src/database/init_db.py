import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent))

from src.database.connection import db_manager
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def init_database():
    logger.info("Iniciando configuração do banco de dados...")
    
    if not db_manager.test_connection():
        logger.error("Falha ao conectar ao banco de dados!")
        return False
    
    schema_file = Path(__file__).parent / "schema.sql"
    if not schema_file.exists():
        logger.error(f"Arquivo de schema não encontrado: {schema_file}")
        return False
    
    logger.info("Criando tabelas e índices...")
    if not db_manager.execute_schema(str(schema_file)):
        logger.error("Falha ao executar schema!")
        return False
    
    logger.info("Verificando tabelas criadas...")
    tables = [
        'cnaes', 'municipios', 'motivos_situacao_cadastral',
        'naturezas_juridicas', 'paises', 'qualificacoes_socios',
        'empresas', 'estabelecimentos', 'socios', 'simples_nacional'
    ]
    
    for table in tables:
        exists = db_manager.table_exists(table)
        status = "✓" if exists else "✗"
        logger.info(f"{status} Tabela '{table}': {'criada' if exists else 'NÃO encontrada'}")
    
    logger.info("Banco de dados configurado com sucesso!")
    return True

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
