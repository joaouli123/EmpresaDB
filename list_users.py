#!/usr/bin/env python3
"""
Lista usuários do banco e mostra o problema
"""
import psycopg2

DATABASE_URL = "postgresql://cnpj_user:Proelast1608%40@72.61.217.143:5432/cnpj_db"

print("="*60)
print("🔍 LISTANDO USUÁRIOS DO BANCO")
print("="*60)

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Listar todos os usuários
    cursor.execute("""
        SELECT id, username, email, role, is_active, created_at, 
               LEFT(password, 20) as password_preview
        FROM clientes.users
        ORDER BY created_at DESC
    """)
    
    users = cursor.fetchall()
    
    print(f"\n📊 Total de usuários: {len(users)}\n")
    print("ID | Username | Email | Role | Ativo | Criado | Hash")
    print("-" * 90)
    
    for user in users:
        user_id, username, email, role, is_active, created_at, hash_preview = user
        status = "✅" if is_active else "❌"
        print(f"{user_id:3} | {username:15} | {email:30} | {role:8} | {status} | {created_at} | {hash_preview}...")
    
    # Verificar usuário específico
    print("\n" + "="*60)
    print("🔍 Verificando usuário 'admin_jl'")
    print("="*60)
    
    cursor.execute("""
        SELECT id, username, email, role, is_active, password
        FROM clientes.users
        WHERE username = %s
    """, ("admin_jl",))
    
    admin_user = cursor.fetchone()
    
    if admin_user:
        print("\n✅ Usuário 'admin_jl' EXISTE!")
        print(f"   ID: {admin_user[0]}")
        print(f"   Email: {admin_user[2]}")
        print(f"   Role: {admin_user[3]}")
        print(f"   Ativo: {admin_user[4]}")
        print(f"   Hash: {admin_user[5][:50]}...")
        
        # Verificar tipo de hash
        hash_password = admin_user[5]
        if hash_password.startswith("$argon2"):
            print("\n✅ Hash usando ARGON2 (correto)")
        elif hash_password.startswith("$2b$") or hash_password.startswith("$2a$"):
            print("\n⚠️ Hash usando BCRYPT (precisa atualizar código)")
        else:
            print(f"\n❌ Hash em formato desconhecido: {hash_password[:20]}...")
    else:
        print("\n❌ Usuário 'admin_jl' NÃO EXISTE!")
        print("\n💡 Usuários disponíveis:")
        for user in users:
            print(f"   - {user[1]} ({user[2]})")
    
    cursor.close()
    conn.close()
    
    print("\n" + "="*60)
    print("💡 DIAGNÓSTICO DO ERRO 500:")
    print("="*60)
    print("""
Possíveis causas:
1. ❌ Senha incorreta (erro comum)
2. ❌ Hash de senha incompatível (argon2 vs bcrypt)
3. ❌ Falta biblioteca 'passlib' ou 'argon2-cffi' no Railway
4. ❌ SECRET_KEY diferente entre ambientes
5. ❌ Conexão com banco diferente

Para resolver:
- Vá no Railway → Deployments → Ver LOGS em tempo real
- Tente fazer login
- Veja a mensagem de erro exata nos logs
    """)
    
except Exception as e:
    print(f"❌ ERRO: {e}")
    import traceback
    traceback.print_exc()
