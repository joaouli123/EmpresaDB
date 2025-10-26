#!/usr/bin/env python3
"""
Script para criar usuários e API Keys no banco DA VPS

⚠️⚠️⚠️ ATENÇÃO: Este script cria dados no banco configurado em DATABASE_URL ⚠️⚠️⚠️
CERTIFIQUE-SE que DATABASE_URL aponta para a VPS (72.61.217.143)!

Uso:
    python3 criar_usuario_api_key.py
"""

from src.database.connection import db_manager
from passlib.context import CryptContext
import secrets

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def criar_usuario_e_api_key():
    """Cria usuário e API Key no banco da VPS"""
    
    print("\n" + "="*60)
    print("🔧 CRIADOR DE USUÁRIO E API KEY")
    print("="*60)
    
    # Verificar banco
    from src.config import settings
    db_url = settings.DATABASE_URL
    if "72.61.217.143" not in db_url:
        print(f"\n⚠️  AVISO: DATABASE_URL não parece ser da VPS!")
        print(f"DATABASE_URL: {db_url[:60]}...")
        resposta = input("\nDeseja continuar mesmo assim? (s/N): ")
        if resposta.lower() != 's':
            print("❌ Cancelado.")
            return
    else:
        print(f"✅ Conectando ao banco da VPS: {db_url[:50]}...")
    
    # Solicitar dados
    print("\n📝 DADOS DO NOVO USUÁRIO:")
    username = input("Username: ").strip()
    if not username:
        print("❌ Username não pode ser vazio!")
        return
    
    email = input("Email: ").strip()
    if not email:
        print("❌ Email não pode ser vazio!")
        return
    
    password = input("Senha: ").strip()
    if not password or len(password) < 8:
        print("❌ Senha deve ter pelo menos 8 caracteres!")
        return
    
    role = input("Role (admin/user) [user]: ").strip() or "user"
    if role not in ['admin', 'user']:
        print("❌ Role deve ser 'admin' ou 'user'!")
        return
    
    api_key_name = input("Nome da API Key [API Key Principal]: ").strip() or "API Key Principal"
    
    # Criar no banco
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Verificar se usuário já existe
            cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (username, email))
            if cursor.fetchone():
                print(f"\n❌ Usuário '{username}' ou email '{email}' já existe!")
                cursor.close()
                return
            
            # Criar usuário
            password_hash = pwd_context.hash(password)
            cursor.execute("""
                INSERT INTO users (username, email, password, role, is_active)
                VALUES (%s, %s, %s, %s, true)
                RETURNING id, username;
            """, (username, email, password_hash, role))
            
            user = cursor.fetchone()
            user_id = user[0]
            
            print(f"\n✅ Usuário criado com sucesso!")
            print(f"   ID: {user_id}")
            print(f"   Username: {username}")
            print(f"   Email: {email}")
            print(f"   Role: {role}")
            
            # Criar API Key
            api_key = "sk_" + secrets.token_urlsafe(32)
            
            cursor.execute("""
                INSERT INTO api_keys (user_id, name, key, is_active, total_requests)
                VALUES (%s, %s, %s, true, 0)
                RETURNING id, key;
            """, (user_id, api_key_name, api_key))
            
            key_data = cursor.fetchone()
            conn.commit()
            cursor.close()
            
            print(f"\n✅ API Key criada com sucesso!")
            print(f"   ID: {key_data[0]}")
            print(f"   Nome: {api_key_name}")
            
            print("\n" + "="*60)
            print("📋 API KEY PARA USO:")
            print("="*60)
            print(f"\n{key_data[1]}\n")
            print("="*60)
            print("\n💡 Use esta key no header HTTP:")
            print(f"   X-API-Key: {key_data[1]}")
            print("="*60)
            
    except Exception as e:
        print(f"\n❌ Erro ao criar usuário/API Key: {e}")

if __name__ == "__main__":
    criar_usuario_e_api_key()
