
from passlib.context import CryptContext
import psycopg2
import os

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Nova senha
new_password = "Palio123@"
hashed_password = pwd_context.hash(new_password)

# Conectar ao banco
DATABASE_URL = os.getenv('DATABASE_URL')
conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

# Atualizar senha do admin
cursor.execute(
    "UPDATE clientes.users SET password = %s WHERE email = 'jl.uli1996@gmail.com'",
    (hashed_password,)
)
conn.commit()

# Verificar
cursor.execute("SELECT username, email, role, is_active FROM clientes.users WHERE email = 'jl.uli1996@gmail.com'")
user = cursor.fetchone()

if user:
    print(f"✅ Senha atualizada com sucesso!")
    print(f"Username: {user[0]}")
    print(f"Email: {user[1]}")
    print(f"Role: {user[2]}")
    print(f"Ativo: {user[3]}")
    print(f"\n🔐 Nova senha: {new_password}")
else:
    print("❌ Usuário não encontrado")

cursor.close()
conn.close()
