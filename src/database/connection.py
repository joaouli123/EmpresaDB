import psycopg2
from psycopg2 import sql, extras
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
import logging
from typing import Optional, Dict, List
from src.config import settings
from fastapi.security import OAuth2PasswordBearer
import secrets

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.connection_string = settings.database_url
        self.engine = None
        self.SessionLocal = None
        self.oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
    
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
    
    async def create_user(self, username: str, email: str, hashed_password: str, role: str = 'user') -> Dict:
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor(cursor_factory=extras.RealDictCursor)
                cursor.execute("""
                    INSERT INTO users (username, email, password, role)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, username, email, role, created_at
                """, (username, email, hashed_password, role))
                user = cursor.fetchone()
                cursor.close()
                return dict(user) if user else None
        except Exception as e:
            logger.error(f"Erro ao criar usuário: {e}")
            raise
    
    async def get_user_by_username(self, username: str) -> Optional[Dict]:
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor(cursor_factory=extras.RealDictCursor)
                cursor.execute("""
                    SELECT id, username, email, password, role, created_at, last_login, is_active
                    FROM users
                    WHERE username = %s AND is_active = TRUE
                """, (username,))
                user = cursor.fetchone()
                cursor.close()
                return dict(user) if user else None
        except Exception as e:
            logger.error(f"Erro ao buscar usuário: {e}")
            return None
    
    async def get_user_by_email(self, email: str) -> Optional[Dict]:
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor(cursor_factory=extras.RealDictCursor)
                cursor.execute("""
                    SELECT id, username, email, password, role, created_at, last_login, is_active
                    FROM users
                    WHERE email = %s AND is_active = TRUE
                """, (email,))
                user = cursor.fetchone()
                cursor.close()
                return dict(user) if user else None
        except Exception as e:
            logger.error(f"Erro ao buscar usuário por email: {e}")
            return None
    
    async def update_last_login(self, username: str):
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE users
                    SET last_login = CURRENT_TIMESTAMP
                    WHERE username = %s
                """, (username,))
                cursor.close()
        except Exception as e:
            logger.error(f"Erro ao atualizar último login: {e}")
    
    async def get_user_profile(self, user_id: int) -> Optional[Dict]:
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor(cursor_factory=extras.RealDictCursor)
                cursor.execute("""
                    SELECT 
                        u.id, u.username, u.email, u.role, u.created_at, u.last_login,
                        COUNT(DISTINCT ak.id) as active_api_keys,
                        COALESCE(SUM(uu.requests), 0) as total_requests
                    FROM users u
                    LEFT JOIN api_keys ak ON u.id = ak.user_id AND ak.is_active = TRUE
                    LEFT JOIN user_usage uu ON u.id = uu.user_id
                    WHERE u.id = %s
                    GROUP BY u.id
                """, (user_id,))
                profile = cursor.fetchone()
                cursor.close()
                return dict(profile) if profile else None
        except Exception as e:
            logger.error(f"Erro ao buscar perfil: {e}")
            return None
    
    async def update_user_profile(self, user_id: int, email: str) -> bool:
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE users
                    SET email = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (email, user_id))
                cursor.close()
                return True
        except Exception as e:
            logger.error(f"Erro ao atualizar perfil: {e}")
            return False
    
    async def create_api_key(self, user_id: int, name: str) -> Optional[Dict]:
        try:
            key = f"sk_{secrets.token_urlsafe(32)}"
            with self.get_connection() as conn:
                cursor = conn.cursor(cursor_factory=extras.RealDictCursor)
                cursor.execute("""
                    INSERT INTO api_keys (user_id, name, key)
                    VALUES (%s, %s, %s)
                    RETURNING id, user_id, name, key, created_at, total_requests
                """, (user_id, name, key))
                api_key = cursor.fetchone()
                cursor.close()
                return dict(api_key) if api_key else None
        except Exception as e:
            logger.error(f"Erro ao criar API key: {e}")
            raise
    
    async def get_api_keys(self, user_id: int) -> List[Dict]:
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor(cursor_factory=extras.RealDictCursor)
                cursor.execute("""
                    SELECT id, user_id, name, key, created_at, last_used, total_requests, is_active
                    FROM api_keys
                    WHERE user_id = %s AND is_active = TRUE
                    ORDER BY created_at DESC
                """, (user_id,))
                keys = cursor.fetchall()
                cursor.close()
                return [dict(key) for key in keys] if keys else []
        except Exception as e:
            logger.error(f"Erro ao buscar API keys: {e}")
            return []
    
    async def delete_api_key(self, user_id: int, key_id: int) -> bool:
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE api_keys
                    SET is_active = FALSE
                    WHERE id = %s AND user_id = %s
                """, (key_id, user_id))
                cursor.close()
                return True
        except Exception as e:
            logger.error(f"Erro ao deletar API key: {e}")
            return False
    
    async def verify_api_key(self, key: str) -> Optional[Dict]:
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor(cursor_factory=extras.RealDictCursor)
                cursor.execute("""
                    UPDATE api_keys
                    SET last_used = CURRENT_TIMESTAMP, total_requests = total_requests + 1
                    WHERE key = %s AND is_active = TRUE
                    RETURNING user_id
                """, (key,))
                result = cursor.fetchone()
                cursor.close()
                return dict(result) if result else None
        except Exception as e:
            logger.error(f"Erro ao verificar API key: {e}")
            return None
    
    async def get_user_usage(self, user_id: int, days: int = 7) -> List[Dict]:
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor(cursor_factory=extras.RealDictCursor)
                cursor.execute("""
                    SELECT date, requests
                    FROM user_usage
                    WHERE user_id = %s AND date >= CURRENT_DATE - INTERVAL '%s days'
                    ORDER BY date DESC
                """, (user_id, days))
                usage = cursor.fetchall()
                cursor.close()
                return [dict(u) for u in usage] if usage else []
        except Exception as e:
            logger.error(f"Erro ao buscar uso: {e}")
            return []
    
    async def track_usage(self, user_id: int):
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO user_usage (user_id, date, requests)
                    VALUES (%s, CURRENT_DATE, 1)
                    ON CONFLICT (user_id, date)
                    DO UPDATE SET requests = user_usage.requests + 1
                """, (user_id,))
                cursor.close()
        except Exception as e:
            logger.error(f"Erro ao rastrear uso: {e}")

db_manager = DatabaseManager()
