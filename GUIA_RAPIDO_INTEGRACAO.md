# 🚀 Guia Rápido de Integração - API CNPJ

## ⚡ Comece em 5 Minutos

### 1️⃣ Obtenha sua API Key

Acesse: `https://www.dbempresas.com.br` → Login → Chaves de API → Nova Chave

> Header obrigatório em todas as requisições: `X-API-Key: SUA_CHAVE_AQUI`

### 2️⃣ Teste sua primeira consulta

```bash
curl -X GET "https://www.dbempresas.com.br/api/v1/cnpj/00000000000191" \
  -H "X-API-Key: SUA_CHAVE_AQUI"
```

### 3️⃣ Teste consulta em lote (parceiros)

```bash
curl -X POST "https://www.dbempresas.com.br/api/v1/batch/search?uf=SP&situacao_cadastral=02&limit=100&offset=0" \
  -H "X-API-Key: SUA_CHAVE_AQUI"
```

### 4️⃣ Integre no seu código

**Python**:
```python
import requests

headers = {"X-API-Key": "SUA_CHAVE_AQUI"}
response = requests.get(
    "https://www.dbempresas.com.br/api/v1/cnpj/00000000000191",
    headers=headers
)
empresa = response.json()
print(empresa['razao_social'])
```

**JavaScript**:
```javascript
fetch('https://www.dbempresas.com.br/api/v1/cnpj/00000000000191', {
  headers: { 'X-API-Key': 'SUA_CHAVE_AQUI' }
})
.then(res => res.json())
.then(empresa => console.log(empresa.razao_social));
```

**PHP**:
```php
$ch = curl_init('https://www.dbempresas.com.br/api/v1/cnpj/00000000000191');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['X-API-Key: SUA_CHAVE_AQUI']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$empresa = json_decode(curl_exec($ch), true);
echo $empresa['razao_social'];
```

---

## 📍 Endpoints Principais

### Consultar CNPJ
```
GET /api/v1/cnpj/{cnpj}
```

### Buscar Empresas em Lote (parceiros)
```
POST /api/v1/batch/search?uf=SP&situacao_cadastral=02&limit=100&offset=0
```

### Buscar Sócios
```
GET /api/v1/cnpj/{cnpj}/socios
```

### Saldo de créditos em lote
```
GET /api/v1/batch/credits
```

### Pacotes de créditos
```
GET /api/v1/batch/packages
POST /api/v1/batch/packages/{package_id}/purchase
```

---

## 🔒 Observação importante

- `GET /api/v1/search` é endpoint administrativo e não deve ser usado por parceiros.
- Para terceiros, use `POST /api/v1/batch/search`.

---

## 🎯 Exemplos Práticos Rápidos

### Empresas Ativas em São Paulo
```
POST /api/v1/batch/search?uf=SP&situacao_cadastral=02&limit=100&offset=0
```

### MEIs no Rio de Janeiro
```
POST /api/v1/batch/search?mei=S&uf=RJ&situacao_cadastral=02&limit=100&offset=0
```

### Grandes Empresas com Capital > 1 milhão
```
POST /api/v1/batch/search?porte=4&capital_social_min=1000000&situacao_cadastral=02&limit=100&offset=0
```

### Empresas Abertas em 2024
```
POST /api/v1/batch/search?data_inicio_atividade_min=2024-01-01&data_inicio_atividade_max=2024-12-31&limit=100&offset=0
```

### Supermercados em Campinas
```
POST /api/v1/batch/search?cnae=4711302&municipio=3509502&situacao_cadastral=02&limit=100&offset=0
```

### Buscar por Nome
```
POST /api/v1/batch/search?razao_social=PETROBRAS&limit=100&offset=0
```

### Buscar por Endereço
```
POST /api/v1/batch/search?logradouro=Paulista&uf=SP&limit=100&offset=0
```

---

## ✅ Todos os Filtros Disponíveis

### Busca de Empresas (28 filtros!)

| Categoria | Filtros |
|-----------|---------|
| **Empresa** | cnpj, razao_social, nome_fantasia, natureza_juridica, porte, capital_social_min, capital_social_max |
| **Localização** | uf, municipio, cep, bairro, logradouro, tipo_logradouro, numero, complemento |
| **Situação** | situacao_cadastral, motivo_situacao_cadastral, data_situacao_cadastral_de, data_situacao_cadastral_ate |
| **Atividade** | cnae, cnae_secundario, data_inicio_atividade_de, data_inicio_atividade_ate |
| **Tipo** | identificador_matriz_filial (1=Matriz, 2=Filial) |
| **Tributário** | simples (S/N), mei (S/N) |
| **Outros** | ente_federativo, email |
| **Paginação** | limit, offset |

> Para integração atual de parceiros, use `limit` e `offset` no endpoint `POST /api/v1/batch/search`.

### Busca de Sócios (5 filtros!)

| Categoria | Filtros |
|-----------|---------|
| **Identificação** | nome_socio, cpf_cnpj |
| **Tipo** | identificador_socio (1-PJ, 2-PF, 3-Estrangeiro) |
| **Qualificação** | qualificacao_socio (05-Administrador, 10-Diretor, 16-Presidente, 49-Sócio-Administrador, etc.) |
| **Perfil** | faixa_etaria (1 a 9, faixas de idade) |
| **Limite** | limit (máx: 1000) |

---

## 📊 Códigos Importantes

**Situação Cadastral**:
- `02` = Ativa ⭐
- `01` = Nula
- `03` = Suspensa
- `04` = Inapta
- `08` = Baixada

**Porte**:
- `1` = Micro
- `2` = Pequena
- `3` = Média
- `4` = Grande
- `5` = Demais

**Matriz/Filial**:
- `1` = Matriz
- `2` = Filial

---

## ⚠️ Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| 401 | API Key não enviada | Adicionar header `X-API-Key` |
| 404 | CNPJ não existe | Verificar número do CNPJ |
| 400 | CNPJ inválido | CNPJ deve ter 14 dígitos |
| 402 | Créditos insuficientes em lote | Comprar pacote em `/api/v1/batch/packages` |

---

## 💡 Dicas Rápidas

1. **Use paginação de lote**: `limit=100` e incremente `offset`
2. **Combine filtros**: Quanto mais específico, melhor
3. **Cache local**: Armazene resultados que não mudam
4. **Formato de data**: Sempre `YYYY-MM-DD`

---

## 📚 Documentação Completa

- **Documentação Detalhada**: `DOCUMENTACAO_API_TERCEIROS.md`
- **Swagger UI**: `https://www.dbempresas.com.br/docs`
- **Todos os Filtros**: `FILTROS_COMPLETOS.md`

---

## 🎓 Exemplos Completos de Código

Ver arquivo: `EXEMPLOS_CODIGO.md` (múltiplas linguagens)

---

## 📞 Precisa de Ajuda?

- 📧 contato@dbempresas.com.br
- 💬 Chat no painel de clientes
- 📖 https://www.dbempresas.com.br/docs
