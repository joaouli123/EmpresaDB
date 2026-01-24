#!/usr/bin/env python3
"""
Verifica qual banco de dados está sendo usado e testa ambos
"""
import psycopg2

# Variáveis do Railway
BANCO_VPS = "postgresql://cnpj_user:Proelast1608%40@72.61.217.143:5432/cnpj_db"
BANCO_NEON = "postgresql://novo_usuario:Proelast1608%40@ep-super-river-afeij8dz.c-2.us-west-2.aws.neon.tech:5432/neondb"

def testar_banco(nome, url):
    print(f"\n{'='*60}")
    print(f"🔍 Testando {nome}")
    print(f"{'='*60}")
    
    try:
        conn = psycopg2.connect(url)
        cursor = conn.cursor()
        print("✅ Conexão OK!")
        
        # Verificar schema clientes
        cursor.execute("""
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name = 'clientes'
        """)
        schema_exists = cursor.fetchone()
        print(f"{'✅' if schema_exists else '❌'} Schema 'clientes': {'existe' if schema_exists else 'NÃO existe'}")
        
        # Verificar tabela users
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'clientes' AND table_name = 'users'
        """)
        users_exists = cursor.fetchone()
        print(f"{'✅' if users_exists else '❌'} Tabela 'clientes.users': {'existe' if users_exists else 'NÃO existe'}")
        
        if users_exists:
            cursor.execute("SELECT COUNT(*) FROM clientes.users")
            user_count = cursor.fetchone()[0]
            print(f"👥 Usuários cadastrados: {user_count}")
        
        # Verificar tabelas de empresas
        print("\n📊 Tabelas de empresas:")
        for table in ['empresas', 'estabelecimentos', 'socios']:
            cursor.execute(f"""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = '{table}'
            """)
            if cursor.fetchone():
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"  ✅ {table}: {count:,} registros")
            else:
                print(f"  ❌ {table}: NÃO existe")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ ERRO: {e}")
        return False

print("="*60)
print("🔍 VERIFICANDO QUAL BANCO O RAILWAY ESTÁ USANDO")
print("="*60)

print("\nSuas variáveis do Railway têm DOIS bancos configurados:")
print("1. DATABASE_URL → Banco VPS (72.61.217.143) - COM 50M empresas")
print("2. PGHOST/PGDATABASE → Banco Neon (nuvem) - pode estar vazio")

vps_ok = testar_banco("BANCO VPS (72.61.217.143)", BANCO_VPS)
neon_ok = testar_banco("BANCO NEON (Neon Tech)", BANCO_NEON)

print("\n" + "="*60)
print("📋 RESUMO")
print("="*60)

if vps_ok and neon_ok:
    print("✅ Ambos os bancos estão acessíveis")
    print("\n⚠️ PROBLEMA: Você tem 2 bancos configurados!")
    print("   A aplicação pode estar usando o banco ERRADO")
    print("\n💡 SOLUÇÃO: Remova as variáveis do Neon do Railway:")
    print("   - PGHOST")
    print("   - PGDATABASE")
    print("   - PGPORT")
    print("\n   Mantenha apenas DATABASE_URL (banco VPS com as empresas)")
elif vps_ok:
    print("✅ Banco VPS está OK (com as empresas)")
    print("❌ Banco Neon não está acessível")
    print("\n💡 A aplicação deve usar DATABASE_URL")
elif neon_ok:
    print("❌ Banco VPS não está acessível")
    print("✅ Banco Neon está OK")
    print("\n⚠️ PROBLEMA: As empresas estão no VPS, não no Neon!")
else:
    print("❌ Nenhum banco está acessível")
    print("   Verifique credenciais e firewall")
