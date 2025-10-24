
#!/usr/bin/env python3
"""
Script para verificar se existem sócios cadastrados no banco
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from src.database.connection import db_manager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def verificar_socios():
    """Verifica dados de sócios no banco"""
    
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Total de sócios
            cursor.execute("SELECT COUNT(*) FROM socios")
            total = cursor.fetchone()[0]
            logger.info(f"📊 Total de sócios no banco: {total:,}")
            
            if total == 0:
                logger.warning("⚠️ NENHUM SÓCIO ENCONTRADO NO BANCO!")
                logger.warning("Execute o ETL para importar os dados de sócios")
                return
            
            # Exemplos de CNPJs com sócios
            cursor.execute("""
                SELECT cnpj_basico, COUNT(*) as total
                FROM socios
                GROUP BY cnpj_basico
                ORDER BY total DESC
                LIMIT 5
            """)
            
            logger.info("\n📋 CNPJs com mais sócios:")
            for row in cursor.fetchall():
                logger.info(f"  CNPJ básico {row[0]}: {row[1]} sócios")
            
            # Exemplo de sócios
            cursor.execute("""
                SELECT cnpj_basico, nome_socio, qualificacao_socio
                FROM socios
                LIMIT 5
            """)
            
            logger.info("\n👥 Exemplos de sócios:")
            for row in cursor.fetchall():
                logger.info(f"  CNPJ {row[0]}: {row[1]} ({row[2]})")
            
            cursor.close()
            
    except Exception as e:
        logger.error(f"❌ Erro ao verificar sócios: {e}")

if __name__ == "__main__":
    verificar_socios()
