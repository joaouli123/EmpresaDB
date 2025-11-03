import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from typing import Optional
from urllib.parse import urlparse, unquote
from fastapi.security import OAuth2PasswordBearer

# ✅ Pydantic BaseSettings lê automaticamente:
# 1º Variáveis de ambiente (Replit Secrets)
# 2º Arquivo .env (se existir)
# 3º Valores default definidos na classe


class Settings(BaseSettings):
    # ⚠️ ATENÇÃO: BANCO DE DADOS EXTERNO VPS - NÃO USAR REPLIT DATABASE!
    # Pydantic lê automaticamente de:
    # 1º Replit Secrets (variáveis de ambiente)
    # 2º Arquivo .env (se existir)
    # 3º Valores default
    DATABASE_URL: Optional[str] = None
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "cnpj_db"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""

    # Security - SECRET_KEY lida dos Replit Secrets ou .env
    SECRET_KEY: str = 'dev-secret-key-min-32-chars-long-please-change-in-production'
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 horas
    
    # API Server Settings
    API_HOST: str = "0.0.0.0"  # Bind to all interfaces
    API_PORT: int = 8000
    
    # CORS Settings - Configure trusted origins in .env
    ALLOWED_ORIGINS: str = "*"  # Default: all (MUST be configured in production!)
    
    @model_validator(mode='before')
    def parse_empty_strings(cls, data):
        """Converte strings vazias em valores padrão para campos numéricos e booleanos"""
        if isinstance(data, dict):
            if data.get('EMAIL_PORT') == '':
                data['EMAIL_PORT'] = 465
            if data.get('EMAIL_USE_SSL') == '':
                data['EMAIL_USE_SSL'] = True
        return data
    
    @model_validator(mode='after')
    def strip_email_fields(self):
        """Remove espaços em branco dos campos de email"""
        if self.EMAIL_HOST:
            self.EMAIL_HOST = self.EMAIL_HOST.strip()
        if self.EMAIL_USER:
            self.EMAIL_USER = self.EMAIL_USER.strip()
        if self.EMAIL_PASSWORD:
            self.EMAIL_PASSWORD = self.EMAIL_PASSWORD.strip()
        if self.EMAIL_FROM:
            self.EMAIL_FROM = self.EMAIL_FROM.strip()
        return self
    
    def validate_config(self) -> None:
        """Valida configurações críticas para produção"""
        if not self.SECRET_KEY or self.SECRET_KEY == "your-secret-key-here-change-in-production":
            raise ValueError("SECRET_KEY não configurada ou insegura! Configure no .env")
        if len(self.SECRET_KEY) < 32:
            raise ValueError("SECRET_KEY muito curta! Use no mínimo 32 caracteres")
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL não configurada! Configure no .env")
            
    def get_cors_origins(self) -> list:
        """Retorna lista de origens permitidas para CORS"""
        if self.ALLOWED_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

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

    # Email Configuration
    EMAIL_HOST: str = "smtp.hostinger.com"
    EMAIL_PORT: int = 465
    EMAIL_USER: str = ""
    EMAIL_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    EMAIL_USE_SSL: bool = True
    
    # Stripe Configuration
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    model_config = SettingsConfigDict(
        env_file='.env',  # Secundário - usa se .env existir
        env_file_encoding='utf-8',
        extra='ignore',
        env_prefix='',
        case_sensitive=True,
        env_nested_delimiter='__',
        validate_default=True,
        # ✅ PRIORIDADE: 1º Replit Secrets (env vars), 2º .env, 3º defaults
    )
    
    @property
    def database_url(self) -> str:
        """
        ⚠️ IMPORTANTE: Retorna DATABASE_URL do .env (BANCO EXTERNO VPS)
        NÃO USAR BANCO LOCAL REPLIT! Sempre configurar DATABASE_URL no .env
        """
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL não configurada! Configure no .env")
        return self.DATABASE_URL


# ⚠️ Settings é carregado automaticamente do .env pelo Pydantic
# Falha se SECRET_KEY ou DATABASE_URL não estiverem configurados
settings = Settings()


class DatabaseManager:
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self.oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")