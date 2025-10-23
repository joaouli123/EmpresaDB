import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class Settings:
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 5000
    API_TITLE: str = "API de Consulta CNPJ"
    API_VERSION: str = "1.0.0"
    
    DOWNLOAD_DIR: str = "downloads"
    DATA_DIR: str = "data"
    LOG_DIR: str = "logs"
    
    RFB_BASE_URL: str = "https://arquivos.receitafederal.gov.br/dados/cnpj/"
    
    CHUNK_SIZE: int = 100000
    MAX_WORKERS: int = 8
    
    @property
    def database_url(self) -> str:
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            raise ValueError(
                "DATABASE_URL não configurada!\n"
                "Crie um arquivo .env com:\n"
                "DATABASE_URL=postgresql://usuario:senha@host:5432/banco"
            )
        return db_url
    
    DB_HOST: str = os.getenv("DB_HOST", "72.61.217.143")
    DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
    DB_NAME: str = os.getenv("DB_NAME", "cnpj_db")
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")

settings = Settings()
