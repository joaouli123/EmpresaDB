import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

from src.database.init_db import init_database
from src.etl.downloader import RFBDownloader
from src.etl.importer import CNPJImporter
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    logger.info("="*70)
    logger.info("SISTEMA DE ETL - DADOS PÚBLICOS CNPJ")
    logger.info("="*70 + "\n")
    
    logger.info("Passo 1: Inicializando banco de dados...")
    if not init_database():
        logger.error("Falha ao inicializar banco de dados!")
        return False
    
    logger.info("\nPasso 2: Baixando arquivos da Receita Federal...")
    downloader = RFBDownloader()
    downloaded_files = downloader.download_latest_files()
    
    if not any(downloaded_files.values()):
        logger.error("Nenhum arquivo foi baixado!")
        return False
    
    logger.info("\nPasso 3: Importando dados para o PostgreSQL...")
    importer = CNPJImporter()
    importer.process_all(downloaded_files)
    
    logger.info("\n" + "="*70)
    logger.info("PROCESSO COMPLETO!")
    logger.info("="*70)
    logger.info("\nA API pode ser iniciada com: python main.py")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
