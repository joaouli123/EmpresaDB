======================================================================
DIAGNÓSTICO DE CONFIGURAÇÃO
======================================================================

1. Procurando arquivo .env em: C:\Users\joao lucas\Downloads\windows\windows\.env
   Arquivo existe? True

2. DATABASE_URL lida do .env:
   postgresql://postgres:Proelast1608%40@72.61.217.143:5432/cnpj_db

3. Parse da URL:
   Usuário: postgres
   Senha: ***************
   Host: 72.61.217.143
   Porta: 5432
   Banco: cnpj_db

✅ Configuração OK!
   Todas as informações foram extraídas corretamente.

   Agora tente conectar com:
   python -c "import psycopg2; psycopg2.connect(host='72.61.217.143', port=5432, database='cnpj_db', user='postgres', password='Proelast1608%40'); print('✅ Conexão OK!')"

======================================================================

Pressione ENTER para sair...

import os
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import urlparse, unquote

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
        self.DB_USER = unquote(parsed.username) if parsed.username else "postgres"
        self.DB_PASSWORD = unquote(parsed.password) if parsed.password else ""

settings = Settings()
