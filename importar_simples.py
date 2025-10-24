#!/usr/bin/env python3
"""
Script para importar APENAS a tabela Simples Nacional
"""
import sys
import os
from pathlib import Path
import logging

# Tenta carregar o .env
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Se DATABASE_URL não existe, configura a conexão VPS
if not os.getenv('DATABASE_URL'):
    os.environ['DATABASE_URL'] = "postgresql://cnpj_user:Proelast1608%40@72.61.217.143:5432/cnpj_db"

sys.path.append(str(Path(__file__).parent))

from src.etl.importer import CNPJImporter
from src.etl.downloader import RFBDownloader
from src.config import settings

logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    logger.info("="*80)
    logger.info("🔄 IMPORTAÇÃO EXCLUSIVA: SIMPLES NACIONAL")
    logger.info("="*80 + "\n")
    
    # Inicializa o importador
    importer = CNPJImporter()
    download_dir = Path(settings.DOWNLOAD_DIR)
    data_dir = Path(settings.DATA_DIR)
    
    # Procura pelo arquivo Simples.zip
    simples_zip = download_dir / "Simples.zip"
    
    if not simples_zip.exists():
        logger.error(f"❌ Arquivo não encontrado: {simples_zip}")
        logger.info("\n📥 Tentando baixar o arquivo Simples.zip...")
        
        # Tenta baixar apenas o arquivo Simples
        downloader = RFBDownloader()
        downloaded = downloader.download_latest_files()
        
        if 'simples_nacional' not in downloaded or not downloaded['simples_nacional']:
            logger.error("❌ Falha ao baixar arquivo Simples.zip!")
            logger.info("\n💡 DICA: Verifique se o arquivo existe manualmente em:")
            logger.info(f"   {download_dir}")
            return False
        
        logger.info(f"✅ Arquivo baixado: Simples.zip")
    else:
        logger.info(f"✅ Arquivo encontrado: {simples_zip}")
    
    # Valida o arquivo
    logger.info("\n🔍 Validando arquivo ZIP...")
    is_valid, message = importer.validate_zip_file(simples_zip)
    
    if not is_valid:
        logger.error(f"❌ Arquivo inválido: {message}")
        return False
    
    logger.info(f"✅ Arquivo válido: {message}")
    
    # Extrai o arquivo
    logger.info("\n📦 Extraindo arquivo...")
    csv_path = importer.extract_zip(simples_zip)
    
    if not csv_path:
        logger.error("❌ Falha ao extrair arquivo!")
        return False
    
    logger.info(f"✅ Arquivo extraído: {csv_path.name}")
    
    # Importa para o banco
    logger.info("\n📊 Importando para o banco de dados...")
    logger.info("=" * 80)
    
    try:
        importer.import_simples(csv_path)
        
        logger.info("\n" + "="*80)
        logger.info("✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!")
        logger.info("="*80)
        
        # Verifica quantos registros foram importados
        from src.database.connection import db_manager
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM simples_nacional")
            count = cursor.fetchone()[0]
            cursor.close()
        
        logger.info(f"\n📊 Total de registros em simples_nacional: {count:,}".replace(',', '.'))
        
        return True
        
    except Exception as e:
        logger.error(f"\n❌ ERRO durante importação: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
