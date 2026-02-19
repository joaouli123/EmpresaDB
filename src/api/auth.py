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
    phone: str
    cpf: str
    password: str

class UserLogin(BaseModel):
    username: str  # Pode ser username ou email
    password: str

class TokenData(BaseModel):
    username: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

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

async def get_current_admin_user(token: str = Depends(db_manager.oauth2_scheme)) -> dict:
    """
    Verifica se o usuário atual é um administrador.
    Requer token JWT válido com role 'admin'.
    """
    user = await get_current_user(token)

    if user.get('role') != 'admin':
        raise HTTPException(
            status_code=403,
            detail={
                "error": "admin_only",
                "message": "Este endpoint é exclusivo para administradores.",
                "endpoint": "/search",
                "current_user": user.get('email'),
                "required_role": "admin",
                "help": "O endpoint /search agora é restrito apenas ao administrador do sistema. Use o endpoint /cnpj/{cnpj} para consultas individuais.",
                "suggestions": [
                    "Use GET /cnpj/{cnpj} para consultar empresas específicas",
                    "Entre em contato com o suporte se precisar de acesso especial"
                ]
            }
        )

    return user

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
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
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
        h1 {{ 
            color: #e53e3e; 
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }}
        .icon {{
            width: 48px;
            height: 48px;
        }}
        p {{ color: #4a5568; line-height: 1.6; }}
        .btn {{
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 30px;
            border-radius: 5px;
            text-decoration: none;
            margin-top: 20px;
        }}
        .btn:hover {{ background: #2563eb; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>
            <svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#e53e3e" stroke-width="2"/>
                <path d="M15 9L9 15M9 9L15 15" stroke="#e53e3e" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Link Inválido ou Expirado
        </h1>
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
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
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
        h1 {{ 
            color: #38a169; 
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }}
        .icon {{
            width: 48px;
            height: 48px;
        }}
        p {{ color: #4a5568; line-height: 1.6; }}
        .spinner {{
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3b82f6;
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
        .confetti {{
            position: fixed;
            width: 10px;
            height: 10px;
            background-color: #f0f;
            position: absolute;
            animation: confetti-fall linear forwards;
        }}
        @keyframes confetti-fall {{
            to {{
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>
            <svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#38a169" stroke-width="2"/>
                <path d="M8 12L11 15L16 9" stroke="#38a169" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Conta Ativada com Sucesso!
        </h1>
        <p>Sua conta foi ativada. Você será redirecionado para o login em 3 segundos...</p>
        <div class="spinner"></div>
        <p><a href="/login?activated=true">Clique aqui se não for redirecionado</a></p>
    </div>
    <script>
        function createConfetti() {{
            const colors = ['#3b82f6', '#38a169', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
            const confettiCount = 50;

            for (let i = 0; i < confettiCount; i++) {{
                setTimeout(() => {{
                    const confetti = document.createElement('div');
                    confetti.className = 'confetti';
                    confetti.style.left = Math.random() * 100 + 'vw';
                    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                    confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
                    confetti.style.opacity = Math.random();
                    confetti.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
                    document.body.appendChild(confetti);

                    setTimeout(() => {{
                        confetti.remove();
                    }}, 5000);
                }}, i * 30);
            }}
        }}

        createConfetti();
    </script>
</body>
</html>
    """)

def validate_cpf(cpf: str) -> bool:
    """Valida CPF usando algoritmo oficial"""
    numbers = ''.join(filter(str.isdigit, cpf))
    if len(numbers) != 11:
        return False
    
    # Verifica se todos os dígitos são iguais
    if len(set(numbers)) == 1:
        return False
    
    # Validação do primeiro dígito verificador
    sum_val = sum(int(numbers[i]) * (10 - i) for i in range(9))
    digit1 = 11 - (sum_val % 11)
    if digit1 >= 10:
        digit1 = 0
    if digit1 != int(numbers[9]):
        return False
    
    # Validação do segundo dígito verificador
    sum_val = sum(int(numbers[i]) * (11 - i) for i in range(10))
    digit2 = 11 - (sum_val % 11)
    if digit2 >= 10:
        digit2 = 0
    if digit2 != int(numbers[10]):
        return False
    
    return True

@router.post("/register", response_model=dict)
async def register(user: UserCreate):
    # Validar CPF
    if not validate_cpf(user.cpf):
        raise HTTPException(status_code=400, detail="CPF inválido")
    
    # Validar telefone (apenas números, 10 ou 11 dígitos)
    phone_numbers = ''.join(filter(str.isdigit, user.phone))
    if len(phone_numbers) not in [10, 11]:
        raise HTTPException(status_code=400, detail="Telefone inválido")
    
    # Verificar username duplicado
    existing_user = await db_manager.get_user_by_username(user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username já cadastrado")

    # Verificar email duplicado
    existing_email = await db_manager.get_user_by_email(user.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Verificar telefone duplicado
    with db_manager.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM clientes.users WHERE phone = %s", (phone_numbers,))
        if cursor.fetchone():
            cursor.close()
            raise HTTPException(status_code=400, detail="Telefone já cadastrado em outra conta")
        
        # Verificar CPF duplicado
        cpf_numbers = ''.join(filter(str.isdigit, user.cpf))
        cursor.execute("SELECT id FROM clientes.users WHERE cpf = %s", (cpf_numbers,))
        if cursor.fetchone():
            cursor.close()
            raise HTTPException(status_code=400, detail="CPF já cadastrado em outra conta")
        cursor.close()

    # Gerar token de ativação
    activation_token = db_manager.generate_activation_token()

    # Criar usuário INATIVO (is_active=False)
    hashed_password = get_password_hash(user.password)
    phone_numbers = ''.join(filter(str.isdigit, user.phone))
    cpf_numbers = ''.join(filter(str.isdigit, user.cpf))
    
    new_user = await db_manager.create_user(
        username=user.username,
        email=user.email,
        phone=phone_numbers,
        cpf=cpf_numbers,
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
    base_url = os.getenv('BASE_URL', '')
    if not base_url:
        # Tentar REPLIT_DOMAINS para compatibilidade
        replit_domain = os.getenv('REPLIT_DOMAINS', '')
        if replit_domain:
            base_url = f"https://{replit_domain}"
        else:
            # Usar domínio de produção como padrão
            environment = os.getenv('ENVIRONMENT', 'production').lower()
            if environment == 'development':
                base_url = "http://localhost:8000"
            else:
                base_url = "https://www.dbempresas.com.br"

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
    """
    Retorna dados completos do usuário autenticado
    """
    # Remover senha e garantir todos os campos necessários
    user_data = {k: v for k, v in current_user.items() if k != 'password'}
    
    # Garantir que campos essenciais existem
    if 'role' not in user_data:
        user_data['role'] = 'user'
    if 'is_active' not in user_data:
        user_data['is_active'] = True
    
    # Log para debug
    logger.info(f"✅ /auth/me retornando dados do usuário: {user_data.get('username')} (role: {user_data.get('role')})")
    
    return user_data

@router.post("/forgot-password")
async def request_password_reset(data: PasswordResetRequest):
    """
    Solicita redefinição de senha enviando um email com token
    """
    # Criar token de reset
    token = await db_manager.create_password_reset_token(data.email)
    
    if not token:
        # Não revelar se o email existe ou não (segurança)
        return {
            "message": "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha."
        }
    
    # Gerar link de reset
    base_url = os.getenv('BASE_URL', '')
    if not base_url:
        # Tentar REPLIT_DOMAINS para compatibilidade
        replit_domain = os.getenv('REPLIT_DOMAINS', '')
        if replit_domain:
            base_url = f"https://{replit_domain}"
        else:
            # Usar domínio de produção como padrão
            environment = os.getenv('ENVIRONMENT', 'production').lower()
            if environment == 'development':
                base_url = "http://localhost:5000"  # Frontend para desenvolvimento
            else:
                base_url = "https://www.dbempresas.com.br"
    
    reset_link = f"{base_url}/reset-password?token={token}"
    
    # Enviar email de reset
    try:
        from src.services.email_service import email_service
        from src.services.email_tracking import email_tracking_service
        
        # Obter usuário para o tracking
        user = await db_manager.get_user_by_email(data.email)
        
        email_sent = email_service.send_password_reset_email(
            to_email=data.email,
            reset_link=reset_link
        )
        
        if user:
            email_tracking_service.log_email_sent(
                user_id=user["id"],
                email_type='password_reset',
                recipient_email=data.email,
                subject="Redefinir senha - DB Empresas",
                status='sent' if email_sent else 'failed'
            )
    except Exception as e:
        logger.error(f"Erro ao enviar email de reset: {e}")
        # Não falhar a requisição, apenas logar o erro
    
    return {
        "message": "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha."
    }

@router.post("/reset-password")
async def reset_password(data: PasswordReset):
    """
    Redefine a senha usando o token recebido por email
    """
    # Verificar se a senha é válida
    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="A senha deve ter no mínimo 6 caracteres"
        )
    
    # Hash da nova senha
    new_password_hash = get_password_hash(data.new_password)
    
    # Redefinir senha
    success = await db_manager.reset_password_with_token(data.token, new_password_hash)
    
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Token inválido ou expirado. Solicite um novo reset de senha."
        )
    
    return {
        "message": "Senha redefinida com sucesso! Você já pode fazer login com a nova senha."
    }