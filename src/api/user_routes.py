from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import List
from datetime import datetime
from src.database.connection import db_manager
from src.api.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user", tags=["User"])

class ProfileUpdate(BaseModel):
    email: EmailStr

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
        success = await db_manager.update_user_profile(current_user['id'], profile_data.email)
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
    try:
        usage_data = await db_manager.get_user_usage(current_user['id'], days=7)
        
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
            'requests_today': total_today,
            'avg_response_time': '45ms',
            'last_update': 'Hoje'
        }
    except Exception as e:
        logger.error(f"Error getting usage: {e}")
        return {
            'daily_usage': [],
            'requests_today': 0,
            'avg_response_time': '45ms',
            'last_update': 'Hoje'
        }
