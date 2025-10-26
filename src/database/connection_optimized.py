import psycopg2
from psycopg2 import pool, sql, extras
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
import logging
from typing import Optional, Dict, List
from src.config import settings
from fastapi.security import OAuth2PasswordBearer
import secrets
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.connection_string = settings.database_url
        self.engine = None
        self.SessionLocal = None
        self.oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
        
        # ===== CONNECTION POOLING =====
        # Pool de conexões reutilizáveis (muito mais rápido que abrir/fechar conexões)
        # minconn: Conexões mínimas sempre abertas
        # maxconn: Máximo de conexões simultâneas
        try:
            self.connection_pool = psycopg2.pool.ThreadedConnectionPool(
                minconn=5,      # 5 conexões sempre prontas
                maxconn=50,     # Até 50 conexões simultâneas
                dsn=self.connection_string
            )
            logger.info("✅ Connection pool criado com sucesso (5-50 conexões)")
        except Exception as e:
            logger.error(f"❌ Erro ao criar connection pool: {e}")
            self.connection_pool = None
    
    def get_engine(self):
        if not self.engine:
            # SQLAlchemy com pool otimizado
            self.engine = create_engine(
                self.connection_string,
                pool_size=20,           # Pool maior para alta concorrência
                max_overflow=30,        # Permite até 50 conexões total (20+30)
                pool_pre_ping=True,     # Verifica se conexão está viva
                pool_recycle=3600,      # Recicla conexões a cada 1 hora
                echo=False,             # Desabilitar logging SQL (performance)
                connect_args={
                    'connect_timeout': 10,
                    'options': '-c statement_timeout=30000'  # 30 segundos timeout
                }
            )
            logger.info("✅ SQLAlchemy engine criado com pool otimizado")
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
        """
        Context manager com connection pooling
        Reutiliza conexões ao invés de criar novas (10-100x mais rápido)
        """
        conn = None
        start_time = time.time()
        
        try:
            # Obter conexão do pool (muito mais rápido que psycopg2.connect())
            if self.connection_pool:
                conn = self.connection_pool.getconn()
                logger.debug(f"🔌 Conexão obtida do pool em {(time.time() - start_time)*1000:.2f}ms")
            else:
                # Fallback: conexão direta (mais lento)
                conn = psycopg2.connect(self.connection_string)
                logger.warning("⚠️ Usando conexão direta (pool não disponível)")
            
            yield conn
            conn.commit()
            
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"❌ Erro na conexão com banco de dados: {e}")
            raise
            
        finally:
            if conn:
                if self.connection_pool:
                    # Devolver conexão ao pool (não fecha, reutiliza!)
                    self.connection_pool.putconn(conn)
                    logger.debug(f"✅ Conexão devolvida ao pool após {(time.time() - start_time)*1000:.2f}ms")
                else:
                    # Sem pool: fechar conexão
                    conn.close()
    
    def get_connection_fast(self):
        """
        Versão simplificada para queries rápidas (sem commit automático)
        """
        if self.connection_pool:
            return self.connection_pool.getconn()
        return psycopg2.connect(self.connection_string)
    
    def return_connection(self, conn):
        """
        Devolve conexão ao pool
        """
        if self.connection_pool and conn:
            self.connection_pool.putconn(conn)
        elif conn:
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
    
    def get_table_count_fast(self, table_name: str) -> Optional[int]:
        """
        COUNT RÁPIDO usando estatísticas do PostgreSQL
        Precisão: ~95-99%, mas executa em milissegundos ao invés de segundos/minutos
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                # Usar estatísticas do PostgreSQL (muito mais rápido)
                cursor.execute("""
                    SELECT reltuples::bigint
                    FROM pg_class
                    WHERE relname = %s
                """, (table_name,))
                result = cursor.fetchone()
                count = result[0] if result else None
                cursor.close()
                return count
        except Exception as e:
            logger.error(f"Erro ao contar registros (fast) em {table_name}: {e}")
            # Fallback para COUNT normal
            return self.get_table_count(table_name)
    
    def get_table_count(self, table_name: str) -> Optional[int]:
        """
        COUNT EXATO (lento em tabelas grandes)
        Use apenas quando precisão de 100% for necessária
        """
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
    
    def execute_query_with_cache(self, cache_key: str, query: str, params: tuple = None, ttl_seconds: int = 3600):
        """
        Executa query com cache em banco
        Para queries lentas e frequentes
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor(cursor_factory=extras.RealDictCursor)
                
                # Verificar cache
                cursor.execute("""
                    SELECT cache_value
                    FROM query_cache
                    WHERE cache_key = %s AND expires_at > CURRENT_TIMESTAMP
                """, (cache_key,))
                
                cached = cursor.fetchone()
                if cached:
                    logger.info(f"💾 Cache hit: {cache_key}")
                    return cached['cache_value']
                
                # Executar query
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                
                results = cursor.fetchall()
                
                # Salvar no cache
                cursor.execute("""
                    INSERT INTO query_cache (cache_key, cache_value, expires_at)
                    VALUES (%s, %s::jsonb, CURRENT_TIMESTAMP + %s * INTERVAL '1 second')
                    ON CONFLICT (cache_key) 
                    DO UPDATE SET 
                        cache_value = EXCLUDED.cache_value,
                        expires_at = EXCLUDED.expires_at
                """, (cache_key, results, ttl_seconds))
                
                logger.info(f"💾 Cache saved: {cache_key}")
                cursor.close()
                return results
                
        except Exception as e:
            logger.error(f"Erro ao executar query com cache: {e}")
            return None
    
    def cleanup_expired_cache(self):
        """
        Limpa cache expirado do banco
        Executar periodicamente (cron job)
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    DELETE FROM query_cache 
                    WHERE expires_at < CURRENT_TIMESTAMP
                """)
                deleted = cursor.rowcount
                cursor.close()
                logger.info(f"🧹 Limpeza de cache: {deleted} registros removidos")
                return deleted
        except Exception as e:
            logger.error(f"Erro ao limpar cache: {e}")
            return 0
    
    def close_all_connections(self):
        """
        Fecha todas as conexões do pool
        Usar apenas ao desligar a aplicação
        """
        if self.connection_pool:
            self.connection_pool.closeall()
            logger.info("🔴 Todas as conexões do pool foram fechadas")

# Instância global (singleton)
db_manager = DatabaseManager()
