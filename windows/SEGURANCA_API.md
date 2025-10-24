# 🔒 Segurança da API - Guia Completo

## ⚠️ IMPORTANTE: A API AGORA EXIGE AUTENTICAÇÃO!

Todas as requisições precisam incluir uma **API Key** válida no header.

## 🔑 Como Funciona

### 1. API Keys Geradas Automaticamente

Quando você inicia a API, **2 chaves** são geradas automaticamente:

```
🔑 API Keys geradas:
   ADMIN KEY: admin_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   READ-ONLY KEY: readonly_XXXXXXXXXXXXXXXXXXXXXXX

⚠️  GUARDE ESSAS CHAVES EM LOCAL SEGURO!
```

**ATENÇÃO:** Essas chaves aparecem **APENAS UMA VEZ** no log ao iniciar a API!

### 2. Tipos de Permissões

| Permissão | O que permite |
|-----------|---------------|
| **read** | Consultar CNPJs, buscar empresas, sócios |
| **write** | (Reservado para futuras funcionalidades de escrita) |
| **admin** | Iniciar/parar ETL, gerar/revogar chaves, alterar configurações |

### 3. Rate Limit (Limite de Requisições)

Cada chave tem um limite de requisições por hora:
- **Admin Key**: 1.000 requisições/hora
- **Read-Only Key**: 100 requisições/hora
- **Chaves customizadas**: Você define

---

## 🚀 Como Usar a API

### ✅ Requisição COM Autenticação (CORRETO)

```bash
curl -H "X-API-Key: readonly_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
  http://localhost:5000/cnpj/00000000000191
```

```python
import requests

headers = {
    "X-API-Key": "readonly_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}

response = requests.get(
    "http://localhost:5000/cnpj/00000000000191",
    headers=headers
)

print(response.json())
```

```javascript
fetch('http://localhost:5000/cnpj/00000000000191', {
  headers: {
    'X-API-Key': 'readonly_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

### ❌ Requisição SEM Autenticação (ERRO)

```bash
curl http://localhost:5000/cnpj/00000000000191
# Retorna: 401 - API Key não fornecida
```

---

## 🛡️ Proteções Implementadas

### 1. ✅ Autenticação Obrigatória
- Toda requisição precisa de API Key válida
- Chaves inválidas são rejeitadas

### 2. ✅ Controle de Permissões
- Endpoints de leitura: precisam de permissão `read`
- Endpoints admin (ETL): precisam de permissão `admin`

### 3. ✅ Rate Limiting
- Limite de requisições por hora
- Previne abuso e DDoS
- Cada chave tem seu próprio limite

### 4. ✅ Logs de Segurança
- Tentativas de acesso negadas são registradas
- Rate limits excedidos são monitorados

---

## 📋 Gerenciamento de API Keys

### Listar Todas as Chaves
```bash
curl -H "X-API-Key: admin_XXXXX" \
  http://localhost:5000/security/keys
```

**Resposta:**
```json
{
  "total": 2,
  "keys": [
    {
      "key": "admin_XXXXX",
      "name": "Admin Key",
      "permissions": ["read", "write", "admin"],
      "rate_limit": 1000,
      "created_at": "2025-10-24T00:00:00"
    },
    {
      "key": "readonly_XXXXX",
      "name": "Read-Only Key",
      "permissions": ["read"],
      "rate_limit": 100,
      "created_at": "2025-10-24T00:00:00"
    }
  ]
}
```

### Gerar Nova Chave
```bash
curl -X POST \
  -H "X-API-Key: admin_XXXXX" \
  "http://localhost:5000/security/keys/generate?name=Cliente%20VIP&permissions=read&rate_limit=500"
```

**Resposta:**
```json
{
  "status": "created",
  "api_key": "cliente_vip_XXXXXXXXXXXXXXXXXXXXXXXXX",
  "name": "Cliente VIP",
  "permissions": ["read"],
  "rate_limit": 500,
  "warning": "GUARDE ESTA CHAVE EM LOCAL SEGURO!"
}
```

### Revogar Chave
```bash
curl -X DELETE \
  -H "X-API-Key": admin_XXXXX" \
  http://localhost:5000/security/keys/cliente_vip_XXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 🎯 Exemplos Práticos

### Exemplo 1: Consultar CNPJ
```python
import requests

API_KEY = "readonly_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
BASE_URL = "http://localhost:5000"

headers = {"X-API-Key": API_KEY}

# Buscar empresa por CNPJ
cnpj = "00000000000191"
response = requests.get(f"{BASE_URL}/cnpj/{cnpj}", headers=headers)

if response.status_code == 200:
    empresa = response.json()
    print(f"Razão Social: {empresa['razao_social']}")
    print(f"Nome Fantasia: {empresa['nome_fantasia']}")
elif response.status_code == 401:
    print("❌ API Key não fornecida ou inválida")
elif response.status_code == 429:
    print("⚠️ Rate limit excedido. Tente novamente mais tarde")
```

### Exemplo 2: Buscar Empresas com Filtros
```python
# Buscar empresas ativas em SP
params = {
    "uf": "SP",
    "situacao_cadastral": "02",  # Ativa
    "page": 1,
    "per_page": 20
}

response = requests.get(
    f"{BASE_URL}/search",
    headers=headers,
    params=params
)

empresas = response.json()
print(f"Total encontrado: {empresas['total']}")
for empresa in empresas['items']:
    print(f"- {empresa['razao_social']}")
```

### Exemplo 3: Iniciar ETL (Admin apenas)
```python
ADMIN_KEY = "admin_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
admin_headers = {"X-API-Key": ADMIN_KEY}

response = requests.post(
    f"{BASE_URL}/etl/start",
    headers=admin_headers
)

print(response.json())
# {"status": "started", "message": "Processo ETL iniciado"}
```

---

## 🔐 Boas Práticas

### ✅ FAÇA:
- ✅ Guarde as API Keys em variáveis de ambiente
- ✅ Use HTTPS em produção
- ✅ Crie chaves diferentes para cada cliente/aplicação
- ✅ Revogue chaves comprometidas imediatamente
- ✅ Configure rate limits adequados
- ✅ Monitore logs de segurança

### ❌ NÃO FAÇA:
- ❌ Compartilhe API Keys publicamente
- ❌ Comite API Keys no Git/GitHub
- ❌ Use a mesma chave para tudo
- ❌ Deixe chaves expostas no código frontend
- ❌ Ignore alertas de rate limit

---

## 📊 Códigos de Resposta HTTP

| Código | Significado | Solução |
|--------|-------------|---------|
| **200** | ✅ Sucesso | - |
| **401** | ❌ Não autenticado | Inclua header `X-API-Key` |
| **403** | ❌ Sem permissão | Use chave com permissão adequada |
| **404** | ❌ Não encontrado | Verifique CNPJ ou endpoint |
| **429** | ⚠️ Rate limit | Aguarde ou use chave com limite maior |
| **500** | ❌ Erro do servidor | Entre em contato com suporte |

---

## 🆘 Problemas Comuns

### "API Key não fornecida"
**Solução:** Adicione o header `X-API-Key` em todas as requisições

### "API Key inválida"
**Solução:** Verifique se copiou a chave corretamente. Chaves são case-sensitive!

### "Sem permissão: admin"
**Solução:** Use a chave de Admin para operações administrativas

### "Rate limit excedido"
**Solução:** 
- Aguarde 1 hora para resetar o contador
- Ou gere uma nova chave com limite maior

---

## 📞 Suporte

Se tiver problemas com autenticação:
1. Verifique os logs da API
2. Confirme que a chave está correta
3. Teste com a chave Read-Only primeiro
4. Verifique se não excedeu o rate limit

---

**🔒 Segurança é prioridade! Mantenha suas chaves seguras!**
