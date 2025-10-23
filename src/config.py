import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DB_HOST: str = os.getenv("PGHOST", "localhost")
    DB_PORT: int = int(os.getenv("PGPORT", "5432"))
    DB_NAME: str = os.getenv("PGDATABASE", "cnpj_db")
    DB_USER: str = os.getenv("PGUSER", "postgres")
    DB_PASSWORD: str = os.getenv("PGPASSWORD", "")
    
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
    
    @property
    def database_url(self) -> str:
        db_url = os.getenv("DATABASE_URL")
        if db_url:
            return db_url
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
