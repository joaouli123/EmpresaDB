import os
from pydantic_settings import BaseSettings
from typing import Optional
from urllib.parse import urlparse, unquote

class Settings(BaseSettings):
    DATABASE_URL: Optional[str] = None
    DB_HOST: Optional[str] = None
    DB_PORT: Optional[int] = 5432
    DB_NAME: Optional[str] = None
    DB_USER: Optional[str] = None
    DB_PASSWORD: Optional[str] = None
    
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 5000
    API_TITLE: str = "API de Consulta CNPJ"
    API_VERSION: str = "1.0.0"
    
    DOWNLOAD_DIR: str = "downloads"
    DATA_DIR: str = "data"
    LOG_DIR: str = "logs"
    
    RFB_BASE_URL: str = "https://arquivos.receitafederal.gov.br/dados/cnpj/"
    
    CHUNK_SIZE: int = 50000
    MAX_WORKERS: int = 4
    
    # Configurações de autenticação
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.DATABASE_URL:
            parsed = urlparse(self.DATABASE_URL)
            self.DB_HOST = parsed.hostname
            self.DB_PORT = parsed.port or 5432
            self.DB_NAME = parsed.path.lstrip('/')
            self.DB_USER = unquote(parsed.username) if parsed.username else None
            self.DB_PASSWORD = unquote(parsed.password) if parsed.password else None
    
    @property
    def database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
