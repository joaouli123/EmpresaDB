"""
Script de diagnóstico - Testa se o .env está sendo lido corretamente
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import urlparse, unquote

print("="*70)
print("DIAGNÓSTICO DE CONFIGURAÇÃO")
print("="*70)

# Localizar arquivo .env
env_path = Path(__file__).parent / '.env'
print(f"\n1. Procurando arquivo .env em: {env_path}")
print(f"   Arquivo existe? {env_path.exists()}")

if not env_path.exists():
    print("\n❌ ERRO: Arquivo .env não encontrado!")
    print("   Crie um arquivo .env na pasta windows/")
    input("\nPressione ENTER para sair...")
    exit(1)

# Carregar .env
load_dotenv(dotenv_path=env_path)

# Ler DATABASE_URL
db_url = os.getenv("DATABASE_URL")
print(f"\n2. DATABASE_URL lida do .env:")
print(f"   {db_url if db_url else '❌ NÃO ENCONTRADA'}")

if not db_url:
    print("\n❌ ERRO: DATABASE_URL não está no arquivo .env!")
    input("\nPressione ENTER para sair...")
    exit(1)

# Fazer parse da URL
parsed = urlparse(db_url)

# Decodificar usuário e senha
username = unquote(parsed.username) if parsed.username else None
password = unquote(parsed.password) if parsed.password else None

print(f"\n3. Parse da URL (ANTES de decodificar):")
print(f"   Usuário codificado: {parsed.username}")
print(f"   Senha codificada: {parsed.password[:5]}...{parsed.password[-2:] if parsed.password and len(parsed.password) > 7 else ''}")

print(f"\n4. Parse da URL (DEPOIS de decodificar):")
print(f"   Usuário: {username}")
print(f"   Senha: {'*' * len(password) if password else '❌ VAZIA'}")
print(f"   Host: {parsed.hostname}")
print(f"   Porta: {parsed.port}")
print(f"   Banco: {parsed.path.lstrip('/')}")

if not password:
    print("\n❌ ERRO: Senha não foi extraída da URL!")
    print("   Verifique se a URL está no formato correto:")
    print("   DATABASE_URL=postgresql://usuario:senha@host:5432/banco")
else:
    print("\n✅ Configuração OK!")
    print("   Todas as informações foram extraídas e decodificadas.")
    print("\n5. Testando conexão com o banco...")
    try:
        import psycopg2
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port,
            database=parsed.path.lstrip('/'),
            user=username,
            password=password
        )
        conn.close()
        print("   ✅ CONEXÃO COM BANCO OK!")
        print("\n🎉 Tudo pronto! Execute: rodar_etl.bat")
    except Exception as e:
        print(f"   ❌ ERRO DE CONEXÃO: {e}")
        print("\n   Verifique:")
        print("   - Servidor está online?")
        print("   - Firewall liberado?")
        print("   - Senha correta?")

print("\n" + "="*70)
input("\nPressione ENTER para sair...")
