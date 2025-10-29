"""
Script para aplicar o schema de consultas em lote no banco de dados
"""

import os
import sys
from pathlib import Path

# Adicionar o diretório raiz ao path
sys.path.append(str(Path(__file__).parent.parent))

from src.database.connection import db_manager
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def apply_batch_schema():
    """Aplica o schema de consultas em lote"""
    logger.info("🚀 Aplicando schema de consultas em lote...")
    
    if not db_manager.test_connection():
        logger.error("❌ Falha ao conectar ao banco de dados!")
        return False
    
    schema_file = Path(__file__).parent.parent / "src" / "database" / "batch_queries_schema.sql"
    if not schema_file.exists():
        logger.error(f"❌ Arquivo de schema não encontrado: {schema_file}")
        return False
    
    logger.info(f"📄 Lendo schema de: {schema_file}")
    
    try:
        with open(schema_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Executar o SQL
            cursor.execute(sql_content)
            
            cursor.close()
        
        logger.info("✅ Schema de consultas em lote aplicado com sucesso!")
        
        # Verificar tabelas criadas
        logger.info("\n📊 Verificando tabelas criadas...")
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            tables_to_check = [
                'batch_query_packages',
                'batch_query_credits',
                'batch_package_purchases',
                'batch_query_usage'
            ]
            
            for table in tables_to_check:
                cursor.execute(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'clientes' 
                        AND table_name = '{table}'
                    );
                """)
                result = cursor.fetchone()
                exists = result[0] if result else False
                status = "✅" if exists else "❌"
                logger.info(f"{status} Tabela 'clientes.{table}': {'criada' if exists else 'NÃO encontrada'}")
            
            # Verificar pacotes inseridos
            cursor.execute("SELECT COUNT(*) FROM clientes.batch_query_packages")
            result = cursor.fetchone()
            package_count = result[0] if result else 0
            logger.info(f"\n📦 Pacotes cadastrados: {package_count}")
            
            if package_count > 0:
                cursor.execute("""
                    SELECT display_name, credits, price_brl, price_per_unit
                    FROM clientes.batch_query_packages
                    ORDER BY sort_order
                """)
                packages = cursor.fetchall()
                logger.info("\n💰 Pacotes disponíveis:")
                for pkg in packages:
                    logger.info(f"  • {pkg[0]}: {pkg[1]:,} créditos por R$ {float(pkg[2]):,.2f} (R$ {float(pkg[3]):.4f}/unidade)")
            
            cursor.close()
        
        logger.info("\n✅ Schema aplicado com sucesso!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao aplicar schema: {e}")
        import traceback
        traceback.print_exc()
        return False

def update_plans_with_batch_queries():
    """Atualiza planos existentes com consultas em lote inclusas"""
    logger.info("\n🔄 Atualizando planos com consultas em lote...")
    
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Definir consultas em lote por plano
            batch_queries_by_plan = {
                'free': 50,           # 50 consultas em lote
                'starter': 500,       # 500 consultas em lote
                'professional': 2000, # 2.000 consultas em lote
                'enterprise': 10000   # 10.000 consultas em lote
            }
            
            for plan_name, batch_queries in batch_queries_by_plan.items():
                cursor.execute("""
                    UPDATE clientes.plans
                    SET monthly_batch_queries = %s
                    WHERE name = %s
                """, (batch_queries, plan_name))
                
                logger.info(f"  ✅ Plano '{plan_name}': {batch_queries:,} consultas em lote mensais")
            
            cursor.close()
        
        logger.info("✅ Planos atualizados com sucesso!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao atualizar planos: {e}")
        return False

if __name__ == "__main__":
    success = apply_batch_schema()
    
    if success:
        update_plans_with_batch_queries()
        logger.info("\n🎉 Instalação concluída! Sistema de consultas em lote pronto para uso!")
        sys.exit(0)
    else:
        logger.error("\n❌ Falha na instalação do sistema de consultas em lote")
        sys.exit(1)
