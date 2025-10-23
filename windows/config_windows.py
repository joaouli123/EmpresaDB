import os
from pathlib import Path

class Settings:
    # Configurações otimizadas para máquina potente (24GB RAM, 2TB SSD)
    CHUNK_SIZE = 100000  # 100k registros por vez (vs 50k padrão)
    MAX_WORKERS = 8      # 8 threads paralelas
    
    # Diretórios
    BASE_DIR = Path(__file__).parent
    DOWNLOAD_DIR = BASE_DIR / "downloads"
    DATA_DIR = BASE_DIR / "data"
    LOGS_DIR = BASE_DIR / "logs"
    
    # Receita Federal
    RFB_BASE_URL = "https://arquivos.receitafederal.gov.br/dados/cnpj/dados_abertos_cnpj/"
    
    # PostgreSQL - CONFIGURAR AQUI!
    # Opção 1: Usar variável de ambiente (recomendado)
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        # Opção 2: Colocar direto aqui (menos seguro)
        "postgresql://usuario:senha@72.61.217.143:5432/cnpj_db"
    )
    
    # API
    API_HOST = "0.0.0.0"
    API_PORT = 5000

settings = Settings()
