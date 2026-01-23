#!/usr/bin/env python3
"""
Script para criar APENAS as tabelas de usuários e autenticação
NÃO TOCA nas tabelas de empresas (50 milhões de registros)!
"""
import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

import psycopg2
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def init_users_tables():
    """Cria apenas as tabelas de usuários, API keys e subscriptions"""
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        logger.error("❌ DATABASE_URL não configurada!")
        return False
    
    logger.info("✅ Conectando ao banco...")
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # 1. Verificar se schema clientes existe
        logger.info("🔍 Verificando schema 'clientes'...")
        cursor.execute("""
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name = 'clientes'
        """)
        
        if not cursor.fetchone():
            logger.info("📦 Criando schema 'clientes'...")
            cursor.execute("CREATE SCHEMA clientes")
            conn.commit()
            logger.info("✅ Schema 'clientes' criado!")
        else:
            logger.info("✅ Schema 'clientes' já existe")
        
        # 2. Criar tabelas (users_schema.sql)
        logger.info("📋 Criando tabelas de usuários...")
        
        users_schema_path = Path(__file__).parent / "src" / "database" / "users_schema.sql"
        
        if users_schema_path.exists():
            with open(users_schema_path, 'r', encoding='utf-8') as f:
                users_sql = f.read()
            
            cursor.execute(users_sql)
            conn.commit()
            logger.info("✅ Tabela 'clientes.users' criada/verificada")
        else:
            logger.warning(f"⚠️ Arquivo não encontrado: {users_schema_path}")
            logger.info("📋 Criando tabelas manualmente...")
            
            # SQL inline
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS clientes.users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    phone VARCHAR(11) UNIQUE NOT NULL,
                    cpf VARCHAR(11) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    is_active BOOLEAN DEFAULT TRUE
                );
                
                CREATE TABLE IF NOT EXISTS clientes.api_keys (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES clientes.users(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    key VARCHAR(255) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_used TIMESTAMP,
                    total_requests INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE
                );
                
                CREATE INDEX IF NOT EXISTS idx_users_username ON clientes.users(username);
                CREATE INDEX IF NOT EXISTS idx_users_email ON clientes.users(email);
                CREATE INDEX IF NOT EXISTS idx_api_keys_key ON clientes.api_keys(key);
            """)
            conn.commit()
            logger.info("✅ Tabelas criadas com sucesso!")
        
        # 3. Criar tabelas de subscription (se existir o arquivo)
        subscriptions_schema_path = Path(__file__).parent / "src" / "database" / "subscriptions_schema.sql"
        
        if subscriptions_schema_path.exists():
            logger.info("📋 Criando tabelas de subscriptions...")
            with open(subscriptions_schema_path, 'r', encoding='utf-8') as f:
                subscriptions_sql = f.read()
            
            cursor.execute(subscriptions_sql)
            conn.commit()
            logger.info("✅ Tabelas de subscriptions criadas!")
        
        # 4. Verificar tabelas criadas
        logger.info("\n🔍 Verificando tabelas criadas:")
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'clientes'
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        for table in tables:
            logger.info(f"  ✅ clientes.{table[0]}")
        
        cursor.close()
        conn.close()
        
        logger.info("\n" + "="*60)
        logger.info("✅ TABELAS DE USUÁRIOS CRIADAS COM SUCESSO!")
        logger.info("="*60)
        logger.info("\n📝 PRÓXIMO PASSO: Criar usuário admin")
        logger.info("   Execute: python reset_admin_password.py")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    logger.info("="*60)
    logger.info("🚀 INICIALIZANDO TABELAS DE USUÁRIOS")
    logger.info("⚠️  NÃO VAI TOCAR NAS TABELAS DE EMPRESAS!")
    logger.info("="*60)
    
    success = init_users_tables()
    sys.exit(0 if success else 1)
