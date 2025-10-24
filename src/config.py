import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from urllib.parse import urlparse, unquote
from fastapi.security import OAuth2PasswordBearer


class Settings(BaseSettings):
    # Database
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
    NUM_WORKERS: int = 4

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


settings = Settings()


class DatabaseManager:
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self.oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")