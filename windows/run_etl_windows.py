import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from src.database.init_db import init_database
from src.etl.downloader import RFBDownloader
from src.etl.importer import CNPJImporter
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/etl_full.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def main():
    logger.info("="*70)
    logger.info("SISTEMA DE ETL - DADOS PUBLICOS CNPJ")
    logger.info("Configuracao: WINDOWS - 24GB RAM, 2TB SSD")
    logger.info("="*70 + "\n")
    
    logger.info("Passo 1: Inicializando banco de dados...")
    if not init_database():
        logger.error("Falha ao inicializar banco de dados!")
        logger.error("Verifique se o arquivo .env esta configurado corretamente")
        input("\nPressione ENTER para sair...")
        return False
    
    logger.info("\nPasso 2: Baixando arquivos da Receita Federal...")
    downloader = RFBDownloader()
    downloaded_files = downloader.download_latest_files()
    
    if not any(downloaded_files.values()):
        logger.error("Nenhum arquivo foi baixado!")
        input("\nPressione ENTER para sair...")
        return False
    
    logger.info("\nPasso 3: Importando dados para o PostgreSQL...")
    logger.info("Configuracao otimizada:")
    logger.info("  - Chunk size: 100.000 registros")
    logger.info("  - Workers: 8 threads paralelas")
    logger.info("  - Aproveitando seus 24GB de RAM!\n")
    
    importer = CNPJImporter()
    importer.process_all(downloaded_files)
    
    logger.info("\n" + "="*70)
    logger.info("PROCESSO COMPLETO!")
    logger.info("="*70)
    logger.info("\nA API pode ser iniciada com: rodar_api.bat")
    
    input("\nPressione ENTER para sair...")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
