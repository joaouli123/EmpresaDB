"""
Script de diagnóstico - Testa se o .env está sendo lido corretamente
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from urllib.parse import urlparse

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

print(f"\n3. Parse da URL:")
print(f"   Usuário: {parsed.username}")
print(f"   Senha: {'*' * len(parsed.password) if parsed.password else '❌ VAZIA'}")
print(f"   Host: {parsed.hostname}")
print(f"   Porta: {parsed.port}")
print(f"   Banco: {parsed.path.lstrip('/')}")

if not parsed.password:
    print("\n❌ ERRO: Senha não foi extraída da URL!")
    print("   Verifique se a URL está no formato correto:")
    print("   DATABASE_URL=postgresql://usuario:senha@host:5432/banco")
    print("\n   Se sua senha tem caracteres especiais (@, #, etc),")
    print("   você precisa codificá-los em URL:")
    print("   @ = %40")
    print("   # = %23")
else:
    print("\n✅ Configuração OK!")
    print("   Todas as informações foram extraídas corretamente.")
    print("\n   Agora tente conectar com:")
    print("   python -c \"import psycopg2; psycopg2.connect(host='{0}', port={1}, database='{2}', user='{3}', password='{4}'); print('✅ Conexão OK!')\"".format(
        parsed.hostname, parsed.port, parsed.path.lstrip('/'), parsed.username, parsed.password
    ))

print("\n" + "="*70)
input("\nPressione ENTER para sair...")
