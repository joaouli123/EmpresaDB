import os
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import urlparse

env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

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
    
    def __init__(self):
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            raise ValueError(
                "DATABASE_URL não configurada!\n"
                "Crie um arquivo .env com:\n"
                "DATABASE_URL=postgresql://usuario:senha@host:5432/banco"
            )
        
        parsed = urlparse(db_url)
        
        self.database_url = db_url
        self.DB_HOST = parsed.hostname or "72.61.217.143"
        self.DB_PORT = parsed.port or 5432
        self.DB_NAME = parsed.path.lstrip('/') or "cnpj_db"
        self.DB_USER = parsed.username or "postgres"
        self.DB_PASSWORD = parsed.password or ""

settings = Settings()
