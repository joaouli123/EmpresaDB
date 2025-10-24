"""
Script para limpar rastreamento de estabelecimentos e permitir reprocessamento
Execute esse script no seu Windows para resetar os arquivos de estabelecimentos
"""
import sys
from pathlib import Path

# Adiciona o diretório src ao path
sys.path.insert(0, str(Path(__file__).parent))

from src.database.connection import db_manager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def limpar_rastreamento_estabelecimentos():
    """Remove rastreamento de estabelecimentos para permitir reprocessamento"""
    
    logger.info("="*80)
    logger.info("LIMPANDO RASTREAMENTO DE ESTABELECIMENTOS")
    logger.info("="*80)
    
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # 1. Verificar quantos estabelecimentos existem no banco
            cursor.execute("SELECT COUNT(*) FROM estabelecimentos")
            total_estabelecimentos = cursor.fetchone()[0]
            logger.info(f"📊 Total de estabelecimentos no banco: {total_estabelecimentos:,}")
            
            # 2. Verificar arquivos de estabelecimentos no rastreamento
            cursor.execute("""
                SELECT file_name, status, total_csv_lines, total_imported_records
                FROM etl_tracking_files
                WHERE file_type = 'estabelecimentos'
                ORDER BY file_name
            """)
            
            arquivos = cursor.fetchall()
            
            if arquivos:
                logger.info(f"\n📁 Encontrados {len(arquivos)} arquivos de estabelecimentos rastreados:")
                for arquivo in arquivos:
                    nome, status, csv_lines, db_records = arquivo
                    logger.info(f"  - {nome}: {status} (CSV={csv_lines:,}, DB={db_records:,})")
            else:
                logger.info("✓ Nenhum arquivo de estabelecimentos rastreado")
            
            # 3. Confirmar limpeza
            if total_estabelecimentos == 0 and arquivos:
                logger.info("\n⚠️  SITUAÇÃO DETECTADA:")
                logger.info("   - Banco tem 0 estabelecimentos")
                logger.info(f"   - Mas há {len(arquivos)} arquivos marcados como processados")
                logger.info("   - Isso indica que houve erro durante importação")
                logger.info("\n🔧 LIMPANDO rastreamento para permitir reprocessamento...")
                
                # Deletar chunks primeiro (FK constraint)
                cursor.execute("""
                    DELETE FROM etl_tracking_chunks
                    WHERE file_tracking_id IN (
                        SELECT id FROM etl_tracking_files 
                        WHERE file_type = 'estabelecimentos'
                    )
                """)
                chunks_deletados = cursor.rowcount
                logger.info(f"   ✓ Removidos {chunks_deletados} chunks")
                
                # Deletar arquivos
                cursor.execute("""
                    DELETE FROM etl_tracking_files
                    WHERE file_type = 'estabelecimentos'
                """)
                arquivos_deletados = cursor.rowcount
                logger.info(f"   ✓ Removidos {arquivos_deletados} arquivos do rastreamento")
                
                conn.commit()
                
                logger.info("\n✅ LIMPEZA COMPLETA!")
                logger.info("   Agora você pode executar o ETL novamente")
                logger.info("   Os arquivos de estabelecimentos serão processados do zero")
                
            elif total_estabelecimentos > 0:
                logger.info("\n✓ Banco já tem estabelecimentos importados")
                logger.info("   Não é necessário limpar rastreamento")
                
            else:
                logger.info("\n✓ Nada a fazer - sistema pronto para processar")
            
            cursor.close()
            
    except Exception as e:
        logger.error(f"❌ Erro ao limpar rastreamento: {e}")
        return False
    
    logger.info("="*80)
    return True

if __name__ == "__main__":
    limpar_rastreamento_estabelecimentos()
