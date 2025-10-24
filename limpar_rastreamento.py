"""
Script para limpar rastreamento ETL e permitir reprocessamento completo
"""
import logging
from src.database.connection import db_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def limpar_rastreamento():
    """Limpa todas as tabelas de rastreamento ETL"""
    logger.info("="*80)
    logger.info("LIMPANDO RASTREAMENTO ETL")
    logger.info("="*80)
    
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Mostrar informações atuais
            cursor.execute("SELECT COUNT(*) FROM etl_tracking_files")
            total_files = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM execution_runs")
            total_runs = cursor.fetchone()[0]
            
            logger.info(f"\n📊 ESTADO ATUAL:")
            logger.info(f"   • Execuções registradas: {total_runs}")
            logger.info(f"   • Arquivos rastreados: {total_files}")
            
            # Limpar rastreamento de chunks (se existir)
            try:
                cursor.execute("DELETE FROM etl_tracking_chunks")
                chunks_deleted = cursor.rowcount
                logger.info(f"\n🗑️  Chunks removidos: {chunks_deleted}")
            except Exception as e:
                logger.info(f"   (Tabela etl_tracking_chunks não existe ou vazia)")
            
            # Limpar rastreamento de arquivos
            cursor.execute("DELETE FROM etl_tracking_files")
            files_deleted = cursor.rowcount
            logger.info(f"🗑️  Arquivos removidos: {files_deleted}")
            
            # Limpar execuções
            cursor.execute("DELETE FROM execution_runs")
            runs_deleted = cursor.rowcount
            logger.info(f"🗑️  Execuções removidas: {runs_deleted}")
            
            conn.commit()
            
            # Verificar contadores de dados reais
            logger.info(f"\n📈 DADOS NO BANCO (não serão apagados):")
            
            try:
                cursor.execute("SELECT COUNT(*) FROM empresas")
                total_empresas = cursor.fetchone()[0]
                logger.info(f"   • Empresas: {total_empresas:,}")
            except Exception as e:
                logger.info(f"   • Empresas: (erro ao contar: {e})")
            
            try:
                cursor.execute("SELECT COUNT(*) FROM estabelecimentos")
                total_estab = cursor.fetchone()[0]
                logger.info(f"   • Estabelecimentos: {total_estab:,}")
            except Exception as e:
                logger.info(f"   • Estabelecimentos: (erro ao contar: {e})")
            
            try:
                cursor.execute("SELECT COUNT(*) FROM socios")
                total_socios = cursor.fetchone()[0]
                logger.info(f"   • Sócios: {total_socios:,}")
            except Exception as e:
                logger.info(f"   • Sócios: (erro ao contar: {e})")
            
            cursor.close()
            
            logger.info(f"\n✅ RASTREAMENTO LIMPO COM SUCESSO!")
            logger.info(f"   Agora você pode rodar o ETL novamente:")
            logger.info(f"   python run_etl.py")
            logger.info("="*80)
            
    except Exception as e:
        logger.error(f"\n❌ ERRO: {e}")
        logger.error(f"   Verifique se está conectado ao banco correto!")

if __name__ == "__main__":
    limpar_rastreamento()
