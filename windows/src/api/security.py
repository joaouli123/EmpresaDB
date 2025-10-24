import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict
from fastapi import HTTPException, Security, Depends
from fastapi.security import APIKeyHeader
import logging

logger = logging.getLogger(__name__)

API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

class APIKeyManager:
    def __init__(self):
        self.api_keys: Dict[str, dict] = {}
        self.rate_limits: Dict[str, list] = {}
        self._load_default_keys()
    
    def _load_default_keys(self):
        admin_key = "admin_" + secrets.token_urlsafe(32)
        readonly_key = "readonly_" + secrets.token_urlsafe(32)
        
        self.api_keys[admin_key] = {
            "name": "Admin Key",
            "permissions": ["read", "write", "admin"],
            "rate_limit": 1000,
            "created_at": datetime.now().isoformat()
        }
        
        self.api_keys[readonly_key] = {
            "name": "Read-Only Key",
            "permissions": ["read"],
            "rate_limit": 100,
            "created_at": datetime.now().isoformat()
        }
        
        logger.info(f"🔑 API Keys geradas:")
        logger.info(f"   ADMIN KEY: {admin_key}")
        logger.info(f"   READ-ONLY KEY: {readonly_key}")
        logger.info(f"")
        logger.info(f"⚠️  GUARDE ESSAS CHAVES EM LOCAL SEGURO!")
        logger.info(f"")
    
    def generate_key(self, name: str, permissions: list, rate_limit: int = 100) -> str:
        api_key = f"{name.lower().replace(' ', '_')}_" + secrets.token_urlsafe(32)
        
        self.api_keys[api_key] = {
            "name": name,
            "permissions": permissions,
            "rate_limit": rate_limit,
            "created_at": datetime.now().isoformat()
        }
        
        logger.info(f"🔑 Nova API Key criada: {name} - {api_key}")
        return api_key
    
    def validate_key(self, api_key: str) -> Optional[dict]:
        if not api_key:
            return None
        
        return self.api_keys.get(api_key)
    
    def check_rate_limit(self, api_key: str) -> bool:
        if api_key not in self.rate_limits:
            self.rate_limits[api_key] = []
        
        now = datetime.now()
        one_hour_ago = now - timedelta(hours=1)
        
        self.rate_limits[api_key] = [
            timestamp for timestamp in self.rate_limits[api_key]
            if timestamp > one_hour_ago
        ]
        
        key_info = self.api_keys.get(api_key)
        if not key_info:
            return False
        
        rate_limit = key_info.get("rate_limit", 100)
        
        if len(self.rate_limits[api_key]) >= rate_limit:
            return False
        
        self.rate_limits[api_key].append(now)
        return True
    
    def revoke_key(self, api_key: str) -> bool:
        if api_key in self.api_keys:
            del self.api_keys[api_key]
            logger.info(f"🚫 API Key revogada: {api_key}")
            return True
        return False
    
    def list_keys(self) -> list:
        return [
            {
                "key": key,
                "name": info["name"],
                "permissions": info["permissions"],
                "rate_limit": info["rate_limit"],
                "created_at": info["created_at"]
            }
            for key, info in self.api_keys.items()
        ]

api_key_manager = APIKeyManager()

async def verify_api_key(
    api_key: str = Security(API_KEY_HEADER),
    required_permission: str = "read"
):
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="API Key não fornecida. Use o header 'X-API-Key'"
        )
    
    key_info = api_key_manager.validate_key(api_key)
    
    if not key_info:
        logger.warning(f"❌ Tentativa de acesso com API Key inválida: {api_key[:20]}...")
        raise HTTPException(
            status_code=403,
            detail="API Key inválida"
        )
    
    if required_permission not in key_info["permissions"]:
        logger.warning(f"❌ Acesso negado: Key '{key_info['name']}' sem permissão '{required_permission}'")
        raise HTTPException(
            status_code=403,
            detail=f"Sem permissão: {required_permission}"
        )
    
    if not api_key_manager.check_rate_limit(api_key):
        logger.warning(f"⚠️ Rate limit excedido: {key_info['name']}")
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit excedido. Limite: {key_info['rate_limit']} req/hora"
        )
    
    return key_info

async def verify_admin_key(api_key: str = Security(API_KEY_HEADER)):
    return await verify_api_key(api_key, required_permission="admin")

async def verify_read_key(api_key: str = Security(API_KEY_HEADER)):
    return await verify_api_key(api_key, required_permission="read")
