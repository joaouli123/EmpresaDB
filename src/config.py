import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DB_HOST: str
    DB_PORT: int = 5432
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str
    
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
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
