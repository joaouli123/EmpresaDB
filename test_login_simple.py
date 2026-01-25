import requests
import json

# Testar login
url = "http://localhost:8000/auth/login"
data = {
    "username": "admin_jl",
    "password": "teste123"  # Tente com a senha que você cadastrou
}

print("🔐 Testando login...")
print(f"URL: {url}")
print(f"Dados: {data}")

try:
    response = requests.post(url, json=data)
    print(f"\n✅ Status: {response.status_code}")
    print(f"📄 Response:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
except Exception as e:
    print(f"\n❌ Erro: {e}")
    if hasattr(response, 'text'):
        print(f"Response text: {response.text}")
