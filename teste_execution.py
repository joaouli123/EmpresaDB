"""
Script de teste: Verifica se o start_execution() funciona
"""
import logging
from src.etl.etl_tracker import ETLTracker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_execution():
    logger.info("="*70)
    logger.info("TESTE: Criando execution_run")
    logger.info("="*70)
    
    try:
        tracker = ETLTracker()
        
        logger.info("\n1. Chamando start_execution()...")
        execution_id = tracker.start_execution()
        
        if execution_id:
            logger.info(f"✅ SUCESSO! execution_id = {execution_id}")
            
            logger.info("\n2. Finalizando execução...")
            tracker.finish_execution('completed')
            logger.info("✅ Finalizado!")
            
            logger.info("\n" + "="*70)
            logger.info("TESTE COMPLETO - TUDO OK!")
            logger.info("="*70)
            return True
        else:
            logger.error("❌ FALHOU - execution_id é None")
            return False
            
    except Exception as e:
        logger.error(f"❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    import sys
    success = test_execution()
    sys.exit(0 if success else 1)
