from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from src.database.connection import db_manager
from src.config import settings
import logging
import os

logger = logging.getLogger(__name__)

# ℹ️ Este router gerencia autenticação e registro de usuários
# IMPORTANTE: Este módulo é usado APENAS para login no dashboard web
# A API em si usa apenas API Key (X-API-Key header)
# Empresas terceiras devem:
# 1. Criar conta via /auth/register
# 2. Fazer login no dashboard web
# 3. Gerar API Key na página de chaves
# 4. Usar apenas a API Key para todas as requisições da API

router = APIRouter(prefix="/auth", tags=["Authentication - Dashboard Web Only"])

ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str  # Pode ser username ou email
    password: str

class TokenData(BaseModel):
    username: Optional[str] = None

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(db_manager.oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Error decoding token: {e}")
        raise credentials_exception

    # token_data.username já foi validado como não-None acima
    if token_data.username is None:
        raise credentials_exception
    
    user = await db_manager.get_user_by_username(token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )
    return current_user

@router.get("/activate/{token}", response_class=HTMLResponse)
async def activate_account(token: str):
    """
    Endpoint de ativação de conta por token
    Retorna HTML com mensagem de sucesso/erro e redireciona para login
    """
    user = await db_manager.activate_user_by_token(token)
    
    if not user:
        # Token inválido ou expirado
        return HTMLResponse(content=f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Erro na Ativação - DB Empresas</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }}
        .container {{
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            max-width: 500px;
            text-align: center;
        }}
        h1 {{ color: #e53e3e; }}
        p {{ color: #4a5568; line-height: 1.6; }}
        .btn {{
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            border-radius: 5px;
            text-decoration: none;
            margin-top: 20px;
        }}
        .btn:hover {{ background: #5a67d8; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>❌ Link Inválido ou Expirado</h1>
        <p>O link de ativação é inválido ou expirou (24 horas).</p>
        <p>Por favor, entre em contato com o suporte ou solicite um novo link de ativação.</p>
        <a href="/login" class="btn">Voltar para Login</a>
    </div>
</body>
</html>
        """, status_code=400)
    
    # Sucesso! Enviar email de boas-vindas
    try:
        from src.services.email_service import email_service
        from src.services.email_tracking import email_tracking_service
        
        email_sent = email_service.send_account_creation_email(
            to_email=user['email'],
            username=user['username']
        )
        
        email_tracking_service.log_email_sent(
            user_id=user["id"],
            email_type='account_created',
            recipient_email=user['email'],
            subject="Bem-vindo ao DB Empresas",
            status='sent' if email_sent else 'failed'
        )
    except Exception as e:
        logger.error(f"Erro ao enviar email de boas-vindas: {e}")
    
    # Retornar HTML de sucesso com redirecionamento
    return HTMLResponse(content=f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conta Ativada - DB Empresas</title>
    <meta http-equiv="refresh" content="3;url=/login?activated=true">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }}
        .container {{
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            max-width: 500px;
            text-align: center;
        }}
        h1 {{ color: #38a169; }}
        p {{ color: #4a5568; line-height: 1.6; }}
        .spinner {{
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }}
        @keyframes spin {{
            0% {{ transform: rotate(0deg); }}
            100% {{ transform: rotate(360deg); }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>✅ Conta Ativada com Sucesso!</h1>
        <p>Sua conta foi ativada. Você será redirecionado para o login em 3 segundos...</p>
        <div class="spinner"></div>
        <p><a href="/login?activated=true">Clique aqui se não for redirecionado</a></p>
    </div>
</body>
</html>
    """)

@router.post("/register", response_model=dict)
async def register(user: UserCreate):
    existing_user = await db_manager.get_user_by_username(user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    existing_email = await db_manager.get_user_by_email(user.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Gerar token de ativação
    activation_token = db_manager.generate_activation_token()
    
    # Criar usuário INATIVO (is_active=False)
    hashed_password = get_password_hash(user.password)
    new_user = await db_manager.create_user(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        activation_token=activation_token,
        is_active=False
    )
    
    if not new_user or "id" not in new_user:
        raise HTTPException(
            status_code=500,
            detail="Erro ao criar usuário. Tente novamente."
        )
    
    # Construir link de ativação (aponta para o backend endpoint)
    # O endpoint retorna HTML que redireciona para o frontend
    repl_url = os.getenv('REPL_SLUG', '')
    repl_owner = os.getenv('REPL_OWNER', '')
    if repl_url and repl_owner:
        base_url = f"https://{repl_url}.{repl_owner}.repl.co"
    else:
        # Fallback para desenvolvimento local
        base_url = "http://localhost:8000"
    
    activation_link = f"{base_url}/auth/activate/{activation_token}"
    
    # Enviar email de ATIVAÇÃO (não boas-vindas!)
    try:
        from src.services.email_service import email_service
        from src.services.email_tracking import email_tracking_service
        
        email_sent = email_service.send_account_activation_email(
            to_email=user.email,
            username=user.username,
            activation_link=activation_link
        )
        
        # Registrar envio no tracking
        email_tracking_service.log_email_sent(
            user_id=new_user["id"],
            email_type='account_activation',
            recipient_email=user.email,
            subject="Ative sua conta no DB Empresas",
            status='sent' if email_sent else 'failed'
        )
    except Exception as e:
        logger.error(f"Erro ao enviar email de ativação: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao enviar email de ativação. Tente novamente."
        )
    
    # NÃO retornar access_token - usuário precisa ativar primeiro!
    # NÃO enviar email de boas-vindas - será enviado após ativação
    return {
        "message": "Conta criada! Verifique seu email para ativar.",
        "email": user.email
    }

@router.post("/login", response_model=dict)
async def login(form_data: UserLogin):
    # Tenta buscar por username primeiro
    user = await db_manager.get_user_by_username(form_data.username)
    
    # Se não encontrou, tenta buscar por email
    if not user:
        user = await db_manager.get_user_by_email(form_data.username)
    
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=400,
            detail="Usuário/email ou senha incorretos",
        )
    
    # Verificar se usuário está ativo
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=403,
            detail="Conta não ativada. Verifique seu email.",
        )

    await db_manager.update_last_login(user["username"])

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    user_data = {k: v for k, v in user.items() if k != 'password'}
    return {"access_token": access_token, "token_type": "bearer", "user": user_data}

@router.get("/me", response_model=dict)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    user_data = {k: v for k, v in current_user.items() if k != 'password'}
    return user_data
