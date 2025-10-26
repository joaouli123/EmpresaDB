
"""
Logger de segurança para auditoria
"""
import logging
from datetime import datetime
from src.database.connection import db_manager

security_logger = logging.getLogger("security")

async def log_security_event(event_type: str, user_id: int = None, details: dict = None, severity: str = "INFO"):
    """
    Registra eventos de segurança no banco
    """
    try:
        # Log simplificado - apenas registro em arquivo por enquanto
        security_logger.info(f"{severity} - {event_type} - User: {user_id} - {details}")
    except Exception as e:
        security_logger.error(f"Erro ao registrar evento: {e}")

async def log_failed_login(username: str, ip: str):
    """Log de tentativas de login falhadas"""
    await log_security_event(
        "FAILED_LOGIN",
        details={"username": username, "ip": ip},
        severity="WARNING"
    )

async def log_api_key_created(user_id: int, key_name: str):
    """Log de criação de API key"""
    await log_security_event(
        "API_KEY_CREATED",
        user_id=user_id,
        details={"key_name": key_name},
        severity="INFO"
    )

async def log_suspicious_activity(user_id: int, activity: str, details: dict):
    """Log de atividade suspeita"""
    await log_security_event(
        "SUSPICIOUS_ACTIVITY",
        user_id=user_id,
        details={**details, "activity": activity},
        severity="CRITICAL"
    )

async def log_query(user_id: int, action: str, resource: str, details: dict = None):
    """Log de consultas à API"""
    await log_security_event(
        action.upper(),
        user_id=user_id,
        details={**details, "resource": resource} if details else {"resource": resource},
        severity="INFO"
    )
