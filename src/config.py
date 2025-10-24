import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from urllib.parse import urlparse, unquote
from fastapi.security import OAuth2PasswordBearer


class Settings(BaseSettings):
    # Database - suporta tanto DATABASE_URL quanto variáveis separadas
    DATABASE_URL: Optional[str] = None
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "cnpj_db"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""

    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 horas

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
        """Retorna DATABASE_URL se existir, senão constrói a partir das variáveis separadas"""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"


settings = Settings()


class DatabaseManager:
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self.oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")