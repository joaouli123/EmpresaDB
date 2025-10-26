import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from urllib.parse import urlparse, unquote
from fastapi.security import OAuth2PasswordBearer


class Settings(BaseSettings):
    # ⚠️⚠️⚠️ ATENÇÃO: BANCO DE DADOS EXTERNO VPS - NÃO USAR REPLIT DATABASE! ⚠️⚠️⚠️
    # DATABASE_URL deve estar sempre configurado no .env apontando para: 72.61.217.143
    # Banco externo VPS: postgresql://cnpj_user:Proelast1608@72.61.217.143:5432/cnpj_db
    # NUNCA USAR O BANCO POSTGRESQL DO REPLIT!
    DATABASE_URL: Optional[str] = None
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "cnpj_db"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""

    # Security - SECRET_KEY OBRIGATÓRIA via .env
    SECRET_KEY: str  # Sem default - DEVE vir do .env!
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 horas
    
    @property
    def validate_secret_key(self) -> str:
        """Valida que SECRET_KEY não está vazia ou insegura"""
        if not self.SECRET_KEY or self.SECRET_KEY == "your-secret-key-here-change-in-production":
            raise ValueError("SECRET_KEY não configurada ou insegura! Configure no .env")
        if len(self.SECRET_KEY) < 32:
            raise ValueError("SECRET_KEY muito curta! Use no mínimo 32 caracteres")
        return self.SECRET_KEY

    # ETL
    DOWNLOAD_DIR: str = "./downloads"
    BATCH_SIZE: int = 10000
    CHUNK_SIZE: int = 50000  # Tamanho do chunk para processamento
    NUM_WORKERS: int = 4
    MAX_WORKERS: int = 4

    # API
    API_TITLE: str = "API de Consulta CNPJ"
    API_VERSION: str = "1.0.0"

    # CNPJ API
    CNPJ_API_URL: Optional[str] = None
    CNPJ_API_TOKEN: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        extra='ignore'  # Ignorar campos extras ao invés de proibir
    )
    
    @property
    def database_url(self) -> str:
        """
        ⚠️ IMPORTANTE: Retorna DATABASE_URL do .env (BANCO EXTERNO VPS)
        NÃO USAR BANCO LOCAL REPLIT! Sempre configurar DATABASE_URL no .env
        """
        if self.DATABASE_URL:
            return self.DATABASE_URL
        # Fallback apenas para compatibilidade (NÃO DEVE SER USADO!)
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"


settings = Settings()


class DatabaseManager:
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self.oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")