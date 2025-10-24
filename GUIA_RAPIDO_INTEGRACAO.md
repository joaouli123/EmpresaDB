# 🚀 Guia Rápido de Integração - API CNPJ

## ⚡ Comece em 5 Minutos

### 1️⃣ Obtenha sua API Key

Acesse: `https://sua-api.com.br` → Login → Chaves de API → Nova Chave

### 2️⃣ Teste sua primeira consulta

```bash
curl -X GET "https://sua-api.com.br/api/v1/cnpj/00000000000191" \
  -H "X-API-Key: SUA_CHAVE_AQUI"
```

### 3️⃣ Integre no seu código

**Python**:
```python
import requests

headers = {"X-API-Key": "SUA_CHAVE_AQUI"}
response = requests.get(
    "https://sua-api.com.br/api/v1/cnpj/00000000000191",
    headers=headers
)
empresa = response.json()
print(empresa['razao_social'])
```

**JavaScript**:
```javascript
fetch('https://sua-api.com.br/api/v1/cnpj/00000000000191', {
  headers: { 'X-API-Key': 'SUA_CHAVE_AQUI' }
})
.then(res => res.json())
.then(empresa => console.log(empresa.razao_social));
```

**PHP**:
```php
$ch = curl_init('https://sua-api.com.br/api/v1/cnpj/00000000000191');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['X-API-Key: SUA_CHAVE_AQUI']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$empresa = json_decode(curl_exec($ch), true);
echo $empresa['razao_social'];
```

---

## 📍 Endpoints Principais

### Consultar CNPJ
```
GET /cnpj/{cnpj}
```

### Buscar Empresas
```
GET /search?uf=SP&situacao_cadastral=02&page=1&per_page=20
```

### Buscar Sócios
```
GET /cnpj/{cnpj}/socios
```

---

## 🎯 Exemplos Práticos Rápidos

### Empresas Ativas em São Paulo
```
GET /search?uf=SP&situacao_cadastral=02
```

### MEIs no Rio de Janeiro
```
GET /search?mei=S&uf=RJ&situacao_cadastral=02
```

### Grandes Empresas com Capital > 1 milhão
```
GET /search?porte=4&capital_social_min=1000000&situacao_cadastral=02
```

### Empresas Abertas em 2024
```
GET /search?data_inicio_atividade_de=2024-01-01&data_inicio_atividade_ate=2024-12-31
```

### Supermercados em Campinas
```
GET /search?cnae=4711302&municipio=3509502&situacao_cadastral=02
```

### Buscar por Nome
```
GET /search?razao_social=PETROBRAS
```

### Buscar por Endereço
```
GET /search?logradouro=Paulista&uf=SP
```

### Buscar Sócios por Nome
```
GET /socios/search?nome_socio=JOÃO SILVA&limit=100
```

### Buscar Pessoas Físicas Administradoras
```
GET /socios/search?identificador_socio=2&qualificacao_socio=05
```

### Buscar Sócios por Faixa Etária
```
GET /socios/search?faixa_etaria=4&identificador_socio=2
```

### Encontrar Empresas de um Sócio
```
# 1. Buscar sócios por CPF
GET /socios/search?cpf_cnpj=12345678900

# 2. Usar o cnpj_basico retornado para buscar empresas
GET /search?cnpj={cnpj_basico}
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
| **Paginação** | page, per_page |

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

---

## 💡 Dicas Rápidas

1. **Use paginação**: `per_page=100` (máximo) para otimizar
2. **Combine filtros**: Quanto mais específico, melhor
3. **Cache local**: Armazene resultados que não mudam
4. **Formato de data**: Sempre `YYYY-MM-DD`

---

## 📚 Documentação Completa

- **Documentação Detalhada**: `DOCUMENTACAO_API_TERCEIROS.md`
- **Swagger UI**: `https://sua-api.com.br/docs`
- **Todos os Filtros**: `FILTROS_COMPLETOS.md`

---

## 🎓 Exemplos Completos de Código

Ver arquivo: `EXEMPLOS_CODIGO.md` (múltiplas linguagens)

---

## 📞 Precisa de Ajuda?

- 📧 suporte@sua-api.com.br
- 💬 Chat no painel de clientes
- 📖 https://sua-api.com.br/docs
