"""
Script para verificar progresso da importação de estabelecimentos
"""
import logging
from src.database.connection import db_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def verificar_progresso():
    """Verifica quantos estabelecimentos já foram importados"""
    logger.info("="*80)
    logger.info("VERIFICANDO PROGRESSO DA IMPORTAÇÃO")
    logger.info("="*80)
    
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Total de estabelecimentos
            cursor.execute("SELECT COUNT(*) FROM estabelecimentos")
            total_estab = cursor.fetchone()[0]
            logger.info(f"\n📊 ESTABELECIMENTOS: {total_estab:,} registros")
            
            # Rastreamento de arquivos
            cursor.execute("""
                SELECT 
                    file_name, 
                    status, 
                    total_csv_lines, 
                    total_imported_records,
                    CASE 
                        WHEN total_csv_lines > 0 THEN 
                            ROUND((total_imported_records::numeric / total_csv_lines) * 100, 2)
                        ELSE 0 
                    END as percentual
                FROM etl_tracking_files
                WHERE file_type = 'estabelecimentos'
                ORDER BY created_at
            """)
            
            arquivos = cursor.fetchall()
            
            if arquivos:
                logger.info(f"\n📁 ARQUIVOS PROCESSADOS:")
                logger.info(f"{'Arquivo':<40} | Status      | CSV Lines  | Importados | %")
                logger.info("-" * 100)
                
                for nome, status, csv_lines, imported, perc in arquivos:
                    logger.info(f"{nome:<40} | {status:<11} | {csv_lines:>10,} | {imported:>10,} | {perc:>6.2f}%")
            else:
                logger.info(f"\n⏳ Nenhum arquivo de estabelecimento rastreado ainda...")
                logger.info(f"   O ETL pode estar processando o primeiro chunk.")
            
            # Execuções
            cursor.execute("""
                SELECT execution_id, started_at, status
                FROM execution_runs
                ORDER BY started_at DESC
                LIMIT 1
            """)
            
            exec_info = cursor.fetchone()
            if exec_info:
                exec_id, started, status = exec_info
                logger.info(f"\n🔄 EXECUÇÃO ATUAL:")
                logger.info(f"   ID: {exec_id}")
                logger.info(f"   Iniciada: {started}")
                logger.info(f"   Status: {status}")
            
            cursor.close()
            logger.info("="*80)
            
    except Exception as e:
        logger.error(f"\n❌ ERRO: {e}")

if __name__ == "__main__":
    verificar_progresso()
