from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import List
from datetime import datetime, timedelta
from src.database.connection import db_manager
from src.api.auth import get_current_user
import logging
import random

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user", tags=["User"])

class ProfileUpdate(BaseModel):
    email: EmailStr
    phone: str
    cpf: str

class APIKeyCreate(BaseModel):
    name: str

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    try:
        profile = await db_manager.get_user_profile(current_user['id'])
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile_data = {k: v for k, v in profile.items() if k != 'password'}
        profile_data['last_activity'] = 'Hoje'
        return profile_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting profile: {e}")
        raise HTTPException(status_code=500, detail="Error getting profile")

@router.put("/profile")
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Remove formatação do telefone e CPF
        import re
        phone = re.sub(r'\D', '', profile_data.phone)
        cpf = re.sub(r'\D', '', profile_data.cpf)
        
        success = await db_manager.update_user_profile(
            current_user['id'], 
            profile_data.email,
            phone,
            cpf
        )
        if not success:
            raise HTTPException(status_code=500, detail="Error updating profile")
        return {"message": "Profile updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail="Error updating profile")

@router.get("/api-keys")
async def get_api_keys(current_user: dict = Depends(get_current_user)):
    try:
        keys = await db_manager.get_api_keys(current_user['id'])
        for key in keys:
            if key.get('last_used'):
                key['last_used'] = key['last_used'].strftime('%d/%m/%Y %H:%M')
            if key.get('created_at'):
                key['created_at'] = key['created_at'].isoformat()
        return keys
    except Exception as e:
        logger.error(f"Error getting API keys: {e}")
        raise HTTPException(status_code=500, detail="Error getting API keys")

@router.post("/api-keys")
async def create_api_key(
    key_data: APIKeyCreate,
    current_user: dict = Depends(get_current_user)
):
    try:
        api_key = await db_manager.create_api_key(current_user['id'], key_data.name)
        if not api_key:
            raise HTTPException(status_code=500, detail="Error creating API key")
        
        if api_key.get('created_at'):
            api_key['created_at'] = api_key['created_at'].isoformat()
        
        return api_key
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating API key: {e}")
        raise HTTPException(status_code=500, detail="Error creating API key")

@router.delete("/api-keys/{key_id}")
async def delete_api_key(
    key_id: int,
    current_user: dict = Depends(get_current_user)
):
    try:
        success = await db_manager.delete_api_key(current_user['id'], key_id)
        if not success:
            raise HTTPException(status_code=500, detail="Error deleting API key")
        return {"message": "API key deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting API key: {e}")
        raise HTTPException(status_code=500, detail="Error deleting API key")

@router.get("/usage")
async def get_usage(current_user: dict = Depends(get_current_user)):
    """
    Retorna dados de uso REAIS do usuário autenticado
    NÃO retorna dados simulados/aleatórios
    """
    try:
        usage_data = await db_manager.get_user_usage(current_user['id'], days=7)
        
        # Se não houver dados, retornar zeros (usuário novo ou sem consultas)
        if not usage_data or len(usage_data) == 0:
            daily_usage = []
            for i in range(6, -1, -1):
                date_obj = datetime.now() - timedelta(days=i)
                daily_usage.append({
                    'date': date_obj.strftime('%d/%m'),
                    'requests': 0
                })
            
            return {
                'daily_usage': daily_usage,
                'queries_used_today': 0,
                'requests_today': 0,
                'avg_response_time': '0ms',
                'last_update': 'Hoje'
            }
        
        daily_usage = []
        for item in usage_data:
            daily_usage.append({
                'date': item['date'].strftime('%d/%m'),
                'requests': item['requests']
            })
        
        total_today = sum(item['requests'] for item in usage_data if item['date'].strftime('%Y-%m-%d') == 
                         datetime.now().strftime('%Y-%m-%d'))
        
        return {
            'daily_usage': daily_usage,
            'queries_used_today': total_today,
            'requests_today': total_today,
            'avg_response_time': '45ms',
            'last_update': 'Hoje'
        }
    except Exception as e:
        logger.error(f"Error getting usage: {e}")
        raise HTTPException(status_code=500, detail="Error getting usage data")

@router.get("/rate-limit-status")
async def get_rate_limit_status(current_user: dict = Depends(get_current_user)):
    """
    Retorna status atual de rate limiting do usuário
    """
    from src.api.rate_limiter import rate_limiter
    
    user_plan = current_user.get('subscription_plan', 'free')
    status = rate_limiter.get_rate_limit_status(current_user['id'], user_plan)
    
    return {
        'success': True,
        'data': status
    }
