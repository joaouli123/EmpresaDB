

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
import hashlib
import secrets
from datetime import datetime, timedelta
import jwt
from src.database.connection import db_manager
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

SECRET_KEY = secrets.token_urlsafe(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: str

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/register")
async def register(user: UserRegister):
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("SELECT id FROM users WHERE email = %s", (user.email,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="E-mail já cadastrado")
            
            hashed_password = hash_password(user.password)
            
            cursor.execute("""
                INSERT INTO users (name, email, password, created_at)
                VALUES (%s, %s, %s, %s)
                RETURNING id, name, email, created_at
            """, (user.name, user.email, hashed_password, datetime.now()))
            
            user_data = cursor.fetchone()
            conn.commit()
            cursor.close()
            
            token = create_access_token({"user_id": user_data[0], "email": user_data[2]})
            
            return {
                "token": token,
                "user": {
                    "id": user_data[0],
                    "name": user_data[1],
                    "email": user_data[2],
                    "created_at": user_data[3].isoformat()
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao registrar usuário: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login(credentials: UserLogin):
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            hashed_password = hash_password(credentials.password)
            
            cursor.execute("""
                SELECT id, name, email, created_at
                FROM users
                WHERE email = %s AND password = %s
            """, (credentials.email, hashed_password))
            
            user_data = cursor.fetchone()
            cursor.close()
            
            if not user_data:
                raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")
            
            token = create_access_token({"user_id": user_data[0], "email": user_data[2]})
            
            return {
                "token": token,
                "user": {
                    "id": user_data[0],
                    "name": user_data[1],
                    "email": user_data[2],
                    "created_at": user_data[3].isoformat()
                }
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao fazer login: {e}")
        raise HTTPException(status_code=500, detail=str(e))
