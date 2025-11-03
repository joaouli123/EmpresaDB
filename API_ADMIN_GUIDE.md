# 🔑 Guia de Uso da API com Permissões Admin

## Problema Resolvido

O endpoint `/search` da API agora verifica corretamente se a API Key pertence a um usuário com role `admin`.

### O que foi corrigido:
- ✅ A função `verify_api_key` agora retorna o `role` do usuário junto com a API Key
- ✅ Usuários admin podem usar o endpoint `/search` sem restrições
- ✅ Usuários não-admin recebem erro 403 (Forbidden) com mensagem clara

---

## Como Garantir que sua API Key Funcione no `/search`

### Passo 1: Verificar se o usuário é admin

Execute no banco de dados VPS:

```sql
SELECT id, email, role FROM clientes.users WHERE email = 'seu-email@exemplo.com';
```

**Se o `role` não for `'admin'`**, execute:

```sql
UPDATE clientes.users SET role = 'admin' WHERE email = 'seu-email@exemplo.com';
```

### Passo 2: Verificar suas API Keys

```sql
SELECT 
    ak.key,
    ak.name,
    u.email,
    u.role
FROM clientes.api_keys ak
JOIN clientes.users u ON ak.user_id = u.id
WHERE u.email = 'seu-email@exemplo.com'
AND ak.is_active = TRUE;
```

### Passo 3: Testar a API

```bash
curl -X GET "https://sua-url.replit.dev/search?razao_social=EMPRESA" \
  -H "X-API-Key: sk_sua_api_key_aqui"
```

**Resposta esperada se for admin**: Status 200 com dados das empresas

**Resposta se NÃO for admin**: Status 403 com:
```json
{
  "detail": {
    "error": "admin_only",
    "message": "Este endpoint é exclusivo para administradores.",
    "current_user": "seu-email@exemplo.com",
    "required_role": "admin"
  }
}
```

---

## Endpoints Disponíveis

### 🔓 Endpoints Públicos (todos os usuários com API Key):
- `GET /cnpj/{cnpj}` - Consulta CNPJ individual
- `GET /socios/{cnpj}` - Lista sócios de uma empresa
- `POST /batch/search` - Consulta em lote (consome créditos)

### 🔒 Endpoints Admin (apenas role='admin'):
- `GET /search` - Pesquisa empresas por múltiplos critérios (sem limite)
- `GET /socios/search` - Pesquisa sócios avançada

---

## Exemplo de Uso Correto (LeadFlow CRM)

```javascript
// Configuração correta
const API_KEY = 'sk_sua_api_key_admin_aqui';
const BASE_URL = 'https://sua-url.replit.dev';

// ✅ CORRETO - Endpoint /search (apenas admin)
async function searchCompanies(filters) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`${BASE_URL}/search?${params}`, {
    headers: {
      'X-API-Key': API_KEY
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Erro na API:', error.detail);
    throw new Error(error.detail.message);
  }
  
  return await response.json();
}

// ✅ ALTERNATIVA - Endpoint /cnpj/{cnpj} (todos os usuários)
async function getCompanyByCNPJ(cnpj) {
  const response = await fetch(`${BASE_URL}/cnpj/${cnpj}`, {
    headers: {
      'X-API-Key': API_KEY
    }
  });
  
  return await response.json();
}
```

---

## Troubleshooting

### ❌ Erro 403: "admin_only"
**Causa**: A API Key pertence a um usuário que não tem `role='admin'`  
**Solução**: Execute o SQL do Passo 1 para tornar o usuário admin

### ❌ Erro 401: "API Key inválida"
**Causa**: API Key não existe ou está inativa  
**Solução**: Gere uma nova API Key no dashboard ou reative a existente

### ❌ Erro: "current_user": null
**Causa**: Sistema não encontrou o usuário da API Key  
**Solução**: Reinicie o backend após atualizar o role no banco de dados

---

## Scripts SQL Úteis

Todos os scripts SQL estão no arquivo: `scripts/set_admin_user.sql`

Execute-os diretamente no banco PostgreSQL da VPS para gerenciar permissões.
