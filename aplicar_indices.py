
#!/usr/bin/env python3
"""
Script para criar índices de performance no banco de dados
Execute: python aplicar_indices.py
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from src.database.connection import db_manager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def aplicar_indices():
    """Cria índices para melhorar performance das consultas"""
    
    logger.info("🔧 Aplicando índices de performance...")
    
    sql_file = Path(__file__).parent / "src" / "database" / "performance_indexes.sql"
    
    if not sql_file.exists():
        logger.error(f"❌ Arquivo não encontrado: {sql_file}")
        return False
    
    try:
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql = f.read()
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(sql)
            conn.commit()
            cursor.close()
        
        logger.info("✅ Índices criados com sucesso!")
        logger.info("⚡ As consultas devem ficar MUITO mais rápidas agora")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar índices: {e}")
        return False

if __name__ == "__main__":
    aplicar_indices()
