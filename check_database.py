#!/usr/bin/env python3
"""
Script para verificar se o banco de dados está configurado corretamente
"""
import os
import sys
import psycopg2
from urllib.parse import urlparse

def check_database():
    """Verifica se o schema e tabelas existem"""
    
    # Usar DATABASE_URL do ambiente (Railway)
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL não configurada!")
        print("\nConfigure no Railway:")
        print("DATABASE_URL=postgresql://usuario:senha@host:porta/database")
        return False
    
    print("✅ DATABASE_URL encontrada")
    print(f"📍 Conectando ao banco...")
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # 1. Verificar se schema 'clientes' existe
        print("\n🔍 Verificando schema 'clientes'...")
        cursor.execute("""
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name = 'clientes'
        """)
        schema_exists = cursor.fetchone()
        
        if schema_exists:
            print("✅ Schema 'clientes' existe")
        else:
            print("❌ Schema 'clientes' NÃO EXISTE!")
            print("\n💡 SOLUÇÃO: Execute o script de inicialização:")
            print("   python src/database/init_db.py")
            cursor.close()
            conn.close()
            return False
        
        # 2. Verificar se tabela 'clientes.users' existe
        print("\n🔍 Verificando tabela 'clientes.users'...")
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'clientes' 
            AND table_name = 'users'
        """)
        table_exists = cursor.fetchone()
        
        if table_exists:
            print("✅ Tabela 'clientes.users' existe")
        else:
            print("❌ Tabela 'clientes.users' NÃO EXISTE!")
            print("\n💡 SOLUÇÃO: Execute o script de inicialização:")
            print("   python src/database/init_db.py")
            cursor.close()
            conn.close()
            return False
        
        # 3. Contar usuários
        print("\n🔍 Contando usuários...")
        cursor.execute("SELECT COUNT(*) FROM clientes.users")
        user_count = cursor.fetchone()[0]
        print(f"✅ Encontrados {user_count} usuários na tabela")
        
        if user_count == 0:
            print("\n⚠️ ATENÇÃO: Nenhum usuário cadastrado!")
            print("💡 Você precisa criar um usuário admin:")
            print("   python reset_admin_password.py")
        else:
            # Listar usuários (sem senha)
            print("\n📋 Usuários cadastrados:")
            cursor.execute("""
                SELECT username, email, role, is_active, created_at 
                FROM clientes.users 
                ORDER BY created_at DESC
            """)
            users = cursor.fetchall()
            for user in users:
                username, email, role, is_active, created_at = user
                status = "✅" if is_active else "❌"
                print(f"  {status} {username} ({email}) - {role} - {created_at}")
        
        # 4. Verificar outras tabelas importantes
        print("\n🔍 Verificando outras tabelas...")
        tables_to_check = ['api_keys', 'subscriptions', 'subscription_plans', 'user_api_usage']
        
        for table in tables_to_check:
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'clientes' 
                AND table_name = %s
            """, (table,))
            exists = cursor.fetchone()
            
            if exists:
                cursor.execute(f"SELECT COUNT(*) FROM clientes.{table}")
                count = cursor.fetchone()[0]
                print(f"  ✅ clientes.{table} ({count} registros)")
            else:
                print(f"  ⚠️ clientes.{table} NÃO EXISTE")
        
        cursor.close()
        conn.close()
        
        print("\n" + "="*60)
        print("✅ VERIFICAÇÃO CONCLUÍDA!")
        print("="*60)
        return True
        
    except psycopg2.OperationalError as e:
        print(f"\n❌ ERRO DE CONEXÃO: {e}")
        print("\n💡 POSSÍVEIS CAUSAS:")
        print("  1. DATABASE_URL incorreta")
        print("  2. Banco de dados inacessível")
        print("  3. Credenciais inválidas")
        print("  4. Firewall bloqueando conexão")
        return False
        
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        return False


if __name__ == "__main__":
    print("="*60)
    print("🔍 VERIFICAÇÃO DO BANCO DE DADOS")
    print("="*60)
    
    success = check_database()
    sys.exit(0 if success else 1)
