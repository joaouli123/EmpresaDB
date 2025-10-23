import psycopg2
from psycopg2 import sql, extras
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
import logging
from typing import Optional
from src.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.connection_string = settings.database_url
        self.engine = None
        self.SessionLocal = None
    
    def get_engine(self):
        if not self.engine:
            self.engine = create_engine(
                self.connection_string,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True
            )
        return self.engine
    
    def get_session_maker(self):
        if not self.SessionLocal:
            self.SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.get_engine()
            )
        return self.SessionLocal
    
    @contextmanager
    def get_connection(self):
        conn = None
        try:
            conn = psycopg2.connect(
                host=settings.DB_HOST,
                port=settings.DB_PORT,
                database=settings.DB_NAME,
                user=settings.DB_USER,
                password=settings.DB_PASSWORD
            )
            yield conn
            conn.commit()
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Erro na conexão com banco de dados: {e}")
            raise
        finally:
            if conn:
                conn.close()
    
    def execute_schema(self, schema_file: str):
        logger.info(f"Executando schema do arquivo: {schema_file}")
        try:
            with open(schema_file, 'r', encoding='utf-8') as f:
                schema_sql = f.read()
            
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(schema_sql)
                conn.commit()
                cursor.close()
                logger.info("Schema executado com sucesso!")
                return True
        except Exception as e:
            logger.error(f"Erro ao executar schema: {e}")
            return False
    
    def test_connection(self) -> bool:
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT version();")
                version = cursor.fetchone()
                if version:
                    logger.info(f"Conexão bem-sucedida! PostgreSQL: {version[0]}")
                cursor.close()
                return True
        except Exception as e:
            logger.error(f"Erro ao testar conexão: {e}")
            return False
    
    def table_exists(self, table_name: str) -> bool:
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = %s
                    );
                """, (table_name,))
                result = cursor.fetchone()
                exists = result[0] if result else False
                cursor.close()
                return exists
        except Exception as e:
            logger.error(f"Erro ao verificar tabela {table_name}: {e}")
            return False
    
    def get_table_count(self, table_name: str) -> Optional[int]:
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(sql.SQL("SELECT COUNT(*) FROM {}").format(
                    sql.Identifier(table_name)
                ))
                result = cursor.fetchone()
                count = result[0] if result else None
                cursor.close()
                return count
        except Exception as e:
            logger.error(f"Erro ao contar registros em {table_name}: {e}")
            return None

db_manager = DatabaseManager()
