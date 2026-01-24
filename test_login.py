#!/usr/bin/env python3
"""
Testa login diretamente no banco para ver o erro
"""
import psycopg2
from passlib.context import CryptContext

DATABASE_URL = "postgresql://cnpj_user:Proelast1608%40@72.61.217.143:5432/cnpj_db"

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def test_login(username, password="teste123"):
    print(f"\n{'='*60}")
    print(f"🔐 Testando login: {username}")
    print(f"{'='*60}")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # 1. Buscar usuário
        print(f"\n1️⃣ Buscando usuário '{username}'...")
        cursor.execute("""
            SELECT id, username, email, password, role, is_active
            FROM clientes.users
            WHERE username = %s
        """, (username,))
        
        user = cursor.fetchone()
        
        if not user:
            print(f"❌ Usuário '{username}' não encontrado!")
            
            # Listar usuários disponíveis
            print("\n📋 Usuários disponíveis:")
            cursor.execute("""
                SELECT username, email, role, is_active, created_at
                FROM clientes.users
                ORDER BY created_at DESC
            """)
            users = cursor.fetchall()
            
            for u in users:
                status = "✅" if u[3] else "❌"
                print(f"  {status} {u[0]} ({u[1]}) - {u[2]}")
            
            cursor.close()
            conn.close()
            return False
        
        user_id, db_username, email, hashed_password, role, is_active = user
        
        print(f"✅ Usuário encontrado!")
        print(f"   ID: {user_id}")
        print(f"   Username: {db_username}")
        print(f"   Email: {email}")
        print(f"   Role: {role}")
        print(f"   Ativo: {is_active}")
        print(f"   Hash: {hashed_password[:50]}...")
        
        # 2. Verificar se está ativo
        if not is_active:
            print(f"\n❌ Usuário '{username}' está INATIVO!")
            cursor.close()
            conn.close()
            return False
        
        # 3. Testar senha
        print(f"\n2️⃣ Testando senha...")
        try:
            is_valid = pwd_context.verify(password, hashed_password)
            
            if is_valid:
                print(f"✅ Senha CORRETA!")
                
                # 4. Simular criação de token
                print(f"\n3️⃣ Simulando criação de token...")
                print(f"✅ Token seria criado para: {db_username}")
                
                print(f"\n{'='*60}")
                print(f"✅ LOGIN SIMULADO COM SUCESSO!")
                print(f"{'='*60}")
                
            else:
                print(f"❌ Senha INCORRETA!")
                print(f"\n💡 Para resetar a senha, execute:")
                print(f"   python reset_admin_password.py")
                
        except Exception as e:
            print(f"❌ Erro ao verificar senha: {e}")
            print(f"\n⚠️ O hash pode estar corrompido ou usar algoritmo diferente")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
        return False


print("="*60)
print("🧪 TESTE DE LOGIN DIRETO NO BANCO")
print("="*60)

# Testar com o usuário que você tentou
test_login("admin_jl", "sua_senha_aqui")

print("\n" + "="*60)
print("💡 PRÓXIMOS PASSOS:")
print("="*60)
print("1. Verifique se o usuário 'admin_jl' existe na lista acima")
print("2. Se existir, tente resetar a senha")
print("3. Se não existir, use outro usuário da lista")
print("4. Ou crie um novo usuário admin")
