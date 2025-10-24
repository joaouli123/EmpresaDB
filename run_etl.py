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
    import argparse
    
    parser = argparse.ArgumentParser(description='ETL - Dados CNPJ')
    parser.add_argument('--skip-empresas', action='store_true', 
                        help='Pula importação de empresas (use se já foram importadas)')
    parser.add_argument('--skip-socios', action='store_true',
                        help='Pula importação de sócios (use se já foram importados)')
    parser.add_argument('--skip-tabelas-aux', action='store_true',
                        help='Pula tabelas auxiliares (CNAEs, municípios, etc.)')
    parser.add_argument('--skip-init', action='store_true',
                        help='Pula inicialização do banco (use se já foi inicializado)')
    args = parser.parse_args()
    
    logger.info("="*70)
    logger.info("SISTEMA DE ETL - DADOS PÚBLICOS CNPJ")
    logger.info("="*70 + "\n")
    
    if args.skip_init:
        logger.info("Passo 1: ⏭️  PULANDO inicialização do banco (já configurado)")
    else:
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
    
    # Define quais tipos pular
    skip_types = []
    if args.skip_empresas:
        skip_types.append('empresas')
        logger.info("⏭️  Modo: PULANDO empresas (já importadas)")
    if args.skip_socios:
        skip_types.append('socios')
        logger.info("⏭️  Modo: PULANDO sócios (já importados)")
    if args.skip_tabelas_aux:
        skip_types.extend([
            'tabela_auxiliar_cnaes',
            'tabela_auxiliar_municipios',
            'tabela_auxiliar_motivos',
            'tabela_auxiliar_naturezas',
            'tabela_auxiliar_paises',
            'tabela_auxiliar_qualificacoes'
        ])
        logger.info("⏭️  Modo: PULANDO tabelas auxiliares (já importadas)")
    
    importer.process_all(downloaded_files, skip_types=skip_types)
    
    logger.info("\n" + "="*70)
    logger.info("PROCESSO COMPLETO!")
    logger.info("="*70)
    logger.info("\nA API pode ser iniciada com: python main.py")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
