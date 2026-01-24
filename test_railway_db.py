#!/usr/bin/env python3
"""
Teste de conexão e criação de tabelas usando as variáveis do Railway
"""
import psycopg2
from passlib.context import CryptContext

# Variáveis do Railway
DATABASE_URL = "postgresql://cnpj_user:Proelast1608%40@72.61.217.143:5432/cnpj_db"

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def test_and_fix():
    print("="*60)
    print("🔍 TESTANDO BANCO DE DADOS DO RAILWAY")
    print("="*60)
    
    try:
        print("\n1️⃣ Conectando ao banco...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        print("✅ Conectado com sucesso!")
        
        # 2. Verificar schema
        print("\n2️⃣ Verificando schema 'clientes'...")
        cursor.execute("""
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name = 'clientes'
        """)
        schema_exists = cursor.fetchone()
        
        if not schema_exists:
            print("❌ Schema 'clientes' NÃO EXISTE")
            print("📦 Criando schema 'clientes'...")
            cursor.execute("CREATE SCHEMA IF NOT EXISTS clientes")
            conn.commit()
            print("✅ Schema 'clientes' criado!")
        else:
            print("✅ Schema 'clientes' existe")
        
        # 3. Verificar tabela users
        print("\n3️⃣ Verificando tabela 'clientes.users'...")
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'clientes' AND table_name = 'users'
        """)
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("❌ Tabela 'clientes.users' NÃO EXISTE")
            print("📋 Criando tabela 'clientes.users'...")
            
            cursor.execute("""
                CREATE TABLE clientes.users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    phone VARCHAR(11) UNIQUE NOT NULL,
                    cpf VARCHAR(11) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    is_active BOOLEAN DEFAULT TRUE
                );
                
                CREATE INDEX idx_users_username ON clientes.users(username);
                CREATE INDEX idx_users_email ON clientes.users(email);
            """)
            conn.commit()
            print("✅ Tabela 'clientes.users' criada!")
        else:
            print("✅ Tabela 'clientes.users' existe")
        
        # 4. Verificar usuários
        print("\n4️⃣ Verificando usuários cadastrados...")
        cursor.execute("SELECT COUNT(*) FROM clientes.users")
        user_count = cursor.fetchone()[0]
        print(f"📊 Total de usuários: {user_count}")
        
        if user_count == 0:
            print("\n⚠️ Nenhum usuário cadastrado!")
            print("👤 Criando usuário admin...")
            
            # Hash da senha Admin@2025
            hashed_password = pwd_context.hash("Admin@2025")
            
            cursor.execute("""
                INSERT INTO clientes.users 
                (username, email, phone, cpf, password, role, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, username, email, role
            """, (
                "admin",
                "admin@dbempresas.com.br",
                "11999999999",
                "00000000000",
                hashed_password,
                "admin",
                True
            ))
            
            admin_user = cursor.fetchone()
            conn.commit()
            
            print(f"✅ Usuário admin criado!")
            print(f"   ID: {admin_user[0]}")
            print(f"   Username: {admin_user[1]}")
            print(f"   Email: {admin_user[2]}")
            print(f"   Role: {admin_user[3]}")
        else:
            print("\n📋 Usuários existentes:")
            cursor.execute("""
                SELECT id, username, email, role, is_active, created_at
                FROM clientes.users
                ORDER BY created_at
            """)
            users = cursor.fetchall()
            
            for user in users:
                status = "✅" if user[4] else "❌"
                print(f"  {status} [{user[0]}] {user[1]} ({user[2]}) - {user[3]} - {user[5]}")
        
        # 5. Criar outras tabelas importantes
        print("\n5️⃣ Verificando outras tabelas...")
        
        # API Keys
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'clientes' AND table_name = 'api_keys'
        """)
        if not cursor.fetchone():
            print("📋 Criando tabela 'clientes.api_keys'...")
            cursor.execute("""
                CREATE TABLE clientes.api_keys (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES clientes.users(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    key VARCHAR(255) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_used TIMESTAMP,
                    total_requests INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE
                );
                CREATE INDEX idx_api_keys_key ON clientes.api_keys(key);
                CREATE INDEX idx_api_keys_user_id ON clientes.api_keys(user_id);
            """)
            conn.commit()
            print("✅ Tabela 'clientes.api_keys' criada!")
        else:
            print("✅ Tabela 'clientes.api_keys' existe")
        
        # User usage
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'clientes' AND table_name = 'user_usage'
        """)
        if not cursor.fetchone():
            print("📋 Criando tabela 'clientes.user_usage'...")
            cursor.execute("""
                CREATE TABLE clientes.user_usage (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES clientes.users(id) ON DELETE CASCADE,
                    date DATE DEFAULT CURRENT_DATE,
                    requests INTEGER DEFAULT 0,
                    UNIQUE(user_id, date)
                );
                CREATE INDEX idx_user_usage_user_date ON clientes.user_usage(user_id, date);
            """)
            conn.commit()
            print("✅ Tabela 'clientes.user_usage' criada!")
        else:
            print("✅ Tabela 'clientes.user_usage' existe")
        
        # 6. Verificar tabelas de empresas (só para confirmar que existem)
        print("\n6️⃣ Verificando tabelas de empresas...")
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name IN ('empresas', 'estabelecimentos', 'socios')
            ORDER BY table_name
        """)
        empresa_tables = cursor.fetchall()
        
        for table in empresa_tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
            count = cursor.fetchone()[0]
            print(f"  ✅ {table[0]}: {count:,} registros")
        
        cursor.close()
        conn.close()
        
        print("\n" + "="*60)
        print("✅ BANCO DE DADOS CONFIGURADO COM SUCESSO!")
        print("="*60)
        print("\n🎉 CREDENCIAIS DE LOGIN:")
        print("   Username: admin")
        print("   Password: Admin@2025")
        print("\n🚀 O erro 500 deve estar resolvido agora!")
        
        return True
        
    except psycopg2.OperationalError as e:
        print(f"\n❌ ERRO DE CONEXÃO: {e}")
        return False
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    test_and_fix()
