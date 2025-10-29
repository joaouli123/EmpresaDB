# 📚 API de Consulta CNPJ - Documentação Completa para Terceiros

## 🎯 Visão Geral

Esta API fornece acesso completo aos dados públicos de CNPJ da Receita Federal do Brasil, permitindo consultas avançadas sobre empresas, estabelecimentos e sócios com mais de **60 milhões de registros**.

**Base URL**: `https://sua-api.com.br/api/v1`

## 🔑 Autenticação

Todas as requisições exigem autenticação via **API Key** no header `X-API-Key`.

### Como Obter sua API Key

1. Acesse o painel de clientes: `https://sua-api.com.br`
2. Crie sua conta ou faça login
3. Vá até a seção **"Chaves de API"** no dashboard
4. Clique em **"Nova Chave"**
5. Copie e guarde sua chave com segurança

⚠️ **IMPORTANTE**: 
- Sua API Key é **permanente** até você revogá-la
- Nunca compartilhe publicamente sua chave
- Este sistema usa **apenas API Key** - não há tokens JWT ou sessões para gerenciar

### Exemplo de Autenticação

```bash
curl -X GET "https://sua-api.com.br/api/v1/cnpj/00000000000191" \
  -H "X-API-Key: sua_chave_api_aqui"
```

---

## 📡 Endpoints Disponíveis

### 1. **Consultar CNPJ Específico**

Retorna informações completas de uma empresa pelo CNPJ.

**Endpoint**: `GET /cnpj/{cnpj}`

**Parâmetros**:
- `cnpj` (path, obrigatório): CNPJ com 14 dígitos (aceita formatação ou apenas números)

**Exemplo de Requisição**:

```bash
# Com formatação
GET /cnpj/00.000.000/0001-91

# Apenas números
GET /cnpj/00000000000191
```

**Resposta de Sucesso (200)**:

```json
{
  "cnpj_completo": "00000000000191",
  "cnpj_basico": "00000000",
  "cnpj_ordem": "0001",
  "cnpj_dv": "91",
  "identificador_matriz_filial": "1",
  "razao_social": "BANCO DO BRASIL S.A.",
  "nome_fantasia": "BANCO DO BRASIL",
  "situacao_cadastral": "02",
  "data_situacao_cadastral": "2005-11-03",
  "motivo_situacao_cadastral_desc": null,
  "data_inicio_atividade": "1966-03-01",
  "cnae_fiscal_principal": "6421200",
  "cnae_principal_desc": "Bancos comerciais",
  "cnaes_secundarios": [
    {
      "codigo": "6422200",
      "descricao": "Bancos múltiplos, com atividade de crédito, investimento e divisas"
    },
    {
      "codigo": "6430000",
      "descricao": "Atividades de participação em outras sociedades, exceto holdings"
    }
  ],
  "tipo_logradouro": "AVENIDA",
  "logradouro": "PAULISTA",
  "numero": "1374",
  "complemento": "ANDAR 14",
  "bairro": "BELA VISTA",
  "cep": "01310100",
  "uf": "SP",
  "municipio_desc": "SAO PAULO",
  "ddd_1": "11",
  "telefone_1": "40042000",
  "correio_eletronico": "contato@bb.com.br",
  "capital_social": 98000000000.00,
  "porte_empresa": "5",
  "opcao_simples": "N",
  "opcao_mei": "N"
}
```

**Códigos de Erro**:
- `400`: CNPJ inválido (deve ter 14 dígitos)
- `401`: API Key ausente ou inválida
- `404`: CNPJ não encontrado
- `500`: Erro interno do servidor

---

### 2. **🔥 NOVO! Busca Avançada de Empresas (Consultas em Lote)**

Busca empresas com filtros avançados e paginação.

**⚡ AGORA DISPONÍVEL VIA API KEY!**

**Endpoint**: `POST /batch/search`

**Autenticação**: Requer API Key no header `X-API-Key`  
**Cobrança**: Cada empresa retornada = 1 crédito consumido

> **💡 Como funciona:**
> - Compre pacotes de créditos na página de preços
> - Use este endpoint para fazer buscas avançadas com múltiplos filtros
> - Cada resultado retornado consome 1 crédito do seu saldo
> - Créditos comprados não expiram!

> **📦 Pacotes Disponíveis:**
> - Starter: 1.000 créditos (R$ 0,0499/crédito)
> - Basic: 5.000 créditos (R$ 0,0399/crédito) - **Economize 20%**
> - Professional: 10.000 créditos (R$ 0,0349/crédito) - **Economize 30%**
> - Enterprise: 50.000 créditos (R$ 0,0299/crédito) - **Economize 40%**

#### 📋 Parâmetros de Filtro

##### **Dados da Empresa**

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `cnpj` | string | CNPJ completo ou parcial | `cnpj=33000167` |
| `razao_social` | string | Razão social (busca parcial, case-insensitive) | `razao_social=PETROBRAS` |
| `nome_fantasia` | string | Nome fantasia (busca parcial) | `nome_fantasia=Extra` |
| `natureza_juridica` | string | Código da natureza jurídica | `natureza_juridica=2062` |
| `porte` | string | Porte: 1-Micro, 2-Pequena, 3-Média, 4-Grande, 5-Demais | `porte=4` |
| `capital_social_min` | float | Capital social mínimo | `capital_social_min=1000000` |
| `capital_social_max` | float | Capital social máximo | `capital_social_max=5000000` |

##### **Localização**

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `uf` | string | Sigla do estado (2 letras) | `uf=SP` |
| `municipio` | string | Código IBGE do município | `municipio=3550308` |
| `cep` | string | CEP completo ou parcial | `cep=01310` |
| `bairro` | string | Nome do bairro (busca parcial) | `bairro=Centro` |
| `logradouro` | string | Nome da rua/avenida (busca parcial) | `logradouro=Paulista` |
| `tipo_logradouro` | string | Tipo (RUA, AVENIDA, etc.) | `tipo_logradouro=AVENIDA` |
| `numero` | string | Número do estabelecimento | `numero=1000` |
| `complemento` | string | Complemento (busca parcial) | `complemento=SALA` |

##### **Situação Cadastral**

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `situacao_cadastral` | string | 01-Nula, 02-Ativa, 03-Suspensa, 04-Inapta, 08-Baixada | `situacao_cadastral=02` |
| `motivo_situacao_cadastral` | string | Motivo da situação (busca parcial) | `motivo_situacao_cadastral=ENCERRAMENTO` |
| `data_situacao_cadastral_de` | date | Data situação DE (YYYY-MM-DD) | `data_situacao_cadastral_de=2020-01-01` |
| `data_situacao_cadastral_ate` | date | Data situação ATÉ (YYYY-MM-DD) | `data_situacao_cadastral_ate=2024-12-31` |

##### **Atividade Econômica**

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `cnae` | string | CNAE principal (7 dígitos) | `cnae=4712100` |
| `cnae_secundario` | string | CNAE secundário (busca parcial) | `cnae_secundario=4711` |

##### **Datas**

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `data_inicio_atividade_min` | date | Data início atividade mínima (YYYY-MM-DD) | `data_inicio_atividade_min=2023-01-01` |
| `data_inicio_atividade_max` | date | Data início atividade máxima (YYYY-MM-DD) | `data_inicio_atividade_max=2023-12-31` |

##### **Tipo de Estabelecimento**

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `identificador_matriz_filial` | string | 1-Matriz, 2-Filial | `identificador_matriz_filial=1` |

##### **Regime Tributário**

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `simples` | string | S-Optante, N-Não optante pelo Simples Nacional | `simples=S` |
| `mei` | string | S-Optante, N-Não optante pelo MEI | `mei=S` |

##### **Outros**

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `ente_federativo` | string | Ente federativo responsável (busca parcial) | `ente_federativo=UNIÃO` |
| `email` | string | E-mail da empresa (busca parcial) | `email=@petrobras.com.br` |

##### **Paginação**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `page` | integer | 1 | Número da página (mín: 1) |
| `per_page` | integer | 20 | Itens por página (mín: 1, máx: 100) |

#### Resposta de Sucesso (200)

```json
{
  "total": 1234,
  "page": 1,
  "per_page": 20,
  "total_pages": 62,
  "items": [
    {
      "cnpj_completo": "33000167000101",
      "cnpj_basico": "33000167",
      "cnpj_ordem": "0001",
      "cnpj_dv": "01",
      "identificador_matriz_filial": "1",
      "razao_social": "PETROLEO BRASILEIRO S.A. PETROBRAS",
      "nome_fantasia": "PETROBRAS",
      "situacao_cadastral": "02",
      "data_situacao_cadastral": "2005-11-03",
      "data_inicio_atividade": "1954-10-03",
      "cnae_fiscal_principal": "0600001",
      "cnae_principal_desc": "Extração de petróleo e gás natural",
      "cnaes_secundarios": [
        {
          "codigo": "1921700",
          "descricao": "Fabricação de produtos do refino de petróleo"
        },
        {
          "codigo": "4681801",
          "descricao": "Comércio atacadista de álcool carburante, biodiesel, gasolina e outros combustíveis derivados de petróleo"
        }
      ],
      "tipo_logradouro": "AVENIDA",
      "logradouro": "REPUBLICA DO CHILE",
      "numero": "65",
      "complemento": null,
      "bairro": "CENTRO",
      "cep": "20031912",
      "uf": "RJ",
      "municipio_desc": "RIO DE JANEIRO",
      "ddd_1": "21",
      "telefone_1": "21212727",
      "correio_eletronico": "contato@petrobras.com.br",
      "capital_social": 246619165719.33,
      "porte_empresa": "5",
      "opcao_simples": "N",
      "opcao_mei": "N"
    }
  ]
}
```

**Exemplo de Requisição**:

```bash
# Buscar empresas ativas em SP que sejam MEI
curl -X POST "https://sua-api.com.br/api/v1/batch/search?uf=SP&mei=S&situacao_cadastral=02&limit=100" \
  -H "X-API-Key: sua_chave_api_aqui"

# Buscar empresas por CNAE em determinada cidade
curl -X POST "https://sua-api.com.br/api/v1/batch/search?cnae=4712100&municipio=3550308&limit=50" \
  -H "X-API-Key: sua_chave_api_aqui"

# Buscar empresas grandes (porte 4) abertas em 2024
curl -X POST "https://sua-api.com.br/api/v1/batch/search?porte=4&data_inicio_atividade_min=2024-01-01&limit=200" \
  -H "X-API-Key: sua_chave_api_aqui"
```

**Resposta de Sucesso (200)**:

```json
{
  "total": 1234,
  "page": 1,
  "per_page": 100,
  "total_pages": 13,
  "items": [
    {
      "cnpj_completo": "12345678000195",
      "identificador_matriz_filial": "1",
      "razao_social": "EXEMPLO COMERCIO LTDA",
      "nome_fantasia": "EXEMPLO",
      "situacao_cadastral": "02",
      "data_situacao_cadastral": "2024-01-15",
      "data_inicio_atividade": "2024-01-10",
      "cnae_fiscal_principal": "4712100",
      "cnae_principal_desc": "Comércio varejista de mercadorias em geral",
      "uf": "SP",
      "municipio_desc": "SAO PAULO",
      "porte_empresa": "1",
      "opcao_mei": "S"
    }
  ]
}
```

**Códigos de Erro**:
- `400`: Parâmetros inválidos
- `401`: API Key ausente ou inválida
- `402`: Créditos insuficientes (detalhes no response)
- `500`: Erro interno do servidor

**Resposta de Erro 402 (Créditos Insuficientes)**:

```json
{
  "detail": {
    "error": "insufficient_batch_credits",
    "message": "Você não tem créditos de consultas em lote suficientes.",
    "action_url": "/batch/packages",
    "help": "Adquira pacotes de consultas em lote para usar este endpoint",
    "available_credits": 0,
    "suggestions": [
      "Compre um pacote de consultas em lote",
      "Faça upgrade do seu plano para incluir consultas em lote mensais",
      "Verifique seu saldo em /batch/credits"
    ]
  }
}
```

---

### 2b. **Gerenciar Créditos de Consultas em Lote**

#### Consultar Saldo de Créditos

**Endpoint**: `GET /batch/credits`

**Autenticação**: Requer token JWT (login no painel)

**Resposta**:

```json
{
  "total_credits": 5000,
  "used_credits": 1234,
  "available_credits": 3766,
  "monthly_included_credits": 0,
  "purchased_credits": 5000,
  "plan_monthly_batch_queries": 0,
  "batch_queries_this_month": 1234
}
```

#### Listar Pacotes Disponíveis

**Endpoint**: `GET /batch/packages`

**Autenticação**: Não requer

**Resposta**:

```json
[
  {
    "id": 1,
    "name": "starter",
    "display_name": "Pacote Starter",
    "description": "1.000 consultas em lote - Ideal para começar",
    "credits": 1000,
    "price_brl": 49.90,
    "price_per_unit": 0.0499,
    "sort_order": 1,
    "is_active": true
  },
  {
    "id": 2,
    "name": "basic",
    "display_name": "Pacote Basic",
    "description": "5.000 consultas em lote - Melhor custo-benefício",
    "credits": 5000,
    "price_brl": 199.90,
    "price_per_unit": 0.0399,
    "sort_order": 2,
    "is_active": true
  }
]
```

#### Comprar Pacote

**Endpoint**: `POST /batch/packages/{package_id}/purchase`

**Autenticação**: Requer token JWT (login no painel)

**Resposta**:

```json
{
  "success": true,
  "message": "Redirecionando para checkout...",
  "session_url": "https://checkout.stripe.com/...",
  "credits_added": null
}
```

#### Histórico de Uso

**Endpoint**: `GET /batch/usage?limit=100`

**Autenticação**: Requer token JWT (login no painel)

**Resposta**:

```json
[
  {
    "id": 123,
    "credits_used": 45,
    "filters_used": {
      "uf": "SP",
      "mei": "S",
      "limit": 100
    },
    "results_returned": 45,
    "endpoint": "/batch/search",
    "created_at": "2025-10-28T15:30:00"
  }
]
```

---

### 3. **Buscar Sócios de uma Empresa**

Retorna todos os sócios de um CNPJ específico.

**Endpoint**: `GET /cnpj/{cnpj}/socios`

**Parâmetros**:
- `cnpj` (path, obrigatório): CNPJ com 14 dígitos

**Resposta de Sucesso (200)**:

```json
[
  {
    "cnpj_basico": "33000167",
    "identificador_socio": "2",
    "nome_socio": "JOÃO DA SILVA",
    "cnpj_cpf_socio": "***123456**",
    "qualificacao_socio": "05",
    "data_entrada_sociedade": "2020-01-15"
  }
]
```

---

### 4. **Buscar Sócios por Filtros Avançados**

Busca sócios com filtros avançados. Ideal para encontrar empresas através de características dos sócios.

**Endpoint**: `GET /socios/search`

#### 📋 Parâmetros de Filtro

| Parâmetro | Tipo | Descrição | Valores/Exemplo |
|-----------|------|-----------|-----------------|
| `nome_socio` | string | Nome do sócio (busca parcial, case-insensitive) | `nome_socio=JOÃO SILVA` |
| `cpf_cnpj` | string | CPF ou CNPJ do sócio (completo ou parcial) | `cpf_cnpj=12345678900` |
| `identificador_socio` | string | Tipo de sócio | `1`-Pessoa Jurídica<br>`2`-Pessoa Física<br>`3`-Estrangeiro |
| `qualificacao_socio` | string | Código da qualificação do sócio | `05`-Administrador<br>`10`-Diretor<br>`16`-Presidente<br>`49`-Sócio-Administrador<br>(ver [códigos completos](#códigos-de-qualificação-de-sócio)) |
| `faixa_etaria` | string | Faixa etária do sócio | `1`-0 a 12 anos<br>`2`-13 a 20 anos<br>`3`-21 a 30 anos<br>`4`-31 a 40 anos<br>`5`-41 a 50 anos<br>`6`-51 a 60 anos<br>`7`-61 a 70 anos<br>`8`-71 a 80 anos<br>`9`-Acima de 80 anos |
| `limit` | integer | Limite de resultados (padrão: 100, máx: 1000) | `limit=500` |

**Exemplo de Requisição**:

```bash
# Buscar pessoas físicas que são administradores
GET /socios/search?identificador_socio=2&qualificacao_socio=05&limit=100

# Buscar sócios com CPF específico
GET /socios/search?cpf_cnpj=12345678900

# Buscar sócios por nome
GET /socios/search?nome_socio=SILVA&limit=50

# Buscar sócios de faixa etária específica
GET /socios/search?faixa_etaria=4&identificador_socio=2

# Buscar empresas sócias (PJ)
GET /socios/search?identificador_socio=1&limit=200
```

**Resposta de Sucesso (200)**:

```json
[
  {
    "cnpj_basico": "12345678",
    "identificador_socio": "2",
    "nome_socio": "JOÃO DA SILVA",
    "cnpj_cpf_socio": "***123456**",
    "qualificacao_socio": "05",
    "data_entrada_sociedade": "2020-01-15"
  },
  {
    "cnpj_basico": "87654321",
    "identificador_socio": "2",
    "nome_socio": "JOÃO SILVA SANTOS",
    "cnpj_cpf_socio": "***654321**",
    "qualificacao_socio": "49",
    "data_entrada_sociedade": "2019-03-20"
  }
]
```

**Observação**: O retorno inclui o `cnpj_basico` (8 primeiros dígitos), que identifica a empresa. Use o endpoint `/cnpj/{cnpj}` para obter dados completos da empresa.

---

### 5. **Listar CNAEs**

Busca códigos CNAE (atividades econômicas).

**Endpoint**: `GET /cnaes`

**Parâmetros**:
- `search` (opcional): Buscar na descrição
- `limit` (opcional, padrão: 100, máx: 1000): Limite de resultados

**Exemplo**:
```
GET /cnaes?search=comercio&limit=50
```

**Resposta**:
```json
[
  {
    "codigo": "4712100",
    "descricao": "Comércio varejista de mercadorias em geral, com predominância de produtos alimentícios - minimercados, mercearias e armazéns"
  }
]
```

---

### 6. **Listar Municípios por UF**

Lista todos os municípios de um estado.

**Endpoint**: `GET /municipios/{uf}`

**Parâmetros**:
- `uf` (path, obrigatório): Sigla do estado (2 letras)

**Exemplo**:
```
GET /municipios/SP
```

**Resposta**:
```json
[
  {
    "codigo": "3550308",
    "descricao": "SAO PAULO"
  },
  {
    "codigo": "3509502",
    "descricao": "CAMPINAS"
  }
]
```

---

### 7. **Estatísticas do Banco de Dados**

Retorna estatísticas gerais.

**Endpoint**: `GET /stats`

**Resposta**:
```json
{
  "total_empresas": 52678123,
  "total_estabelecimentos": 60345892,
  "total_socios": 31234567,
  "total_cnaes": 1358,
  "total_municipios": 5570
}
```

---

### 8. **Health Check**

Verifica se a API está funcionando.

**Endpoint**: `GET /`

**Resposta**:
```json
{
  "status": "online",
  "database": "connected",
  "message": "API de Consulta CNPJ está funcionando!"
}
```

---

## 💻 Exemplos de Integração

### Python

```python
import requests

API_BASE_URL = "https://sua-api.com.br/api/v1"
API_KEY = "sua_chave_api_aqui"

headers = {
    "X-API-Key": API_KEY
}

# 1. Consultar CNPJ específico
def consultar_cnpj(cnpj):
    response = requests.get(
        f"{API_BASE_URL}/cnpj/{cnpj}",
        headers=headers
    )

    if response.status_code == 200:
        return response.json()
    elif response.status_code == 404:
        print("CNPJ não encontrado")
    else:
        print(f"Erro: {response.status_code}")

    return None

# Exemplo de uso
empresa = consultar_cnpj("00000000000191")
if empresa:
    print(f"Razão Social: {empresa['razao_social']}")
    print(f"Capital Social: R$ {empresa['capital_social']:,.2f}")


# 2. Buscar empresas com filtros
def buscar_empresas(filtros):
    response = requests.get(
        f"{API_BASE_URL}/search",
        headers=headers,
        params=filtros
    )

    if response.status_code == 200:
        return response.json()

    return None

# Exemplo: Buscar empresas de grande porte em SP, ativas
filtros = {
    "uf": "SP",
    "porte": "4",
    "situacao_cadastral": "02",
    "page": 1,
    "per_page": 50
}

resultado = buscar_empresas(filtros)
if resultado:
    print(f"Total de empresas encontradas: {resultado['total']}")
    print(f"Página {resultado['page']} de {resultado['total_pages']}")

    for empresa in resultado['items']:
        print(f"{empresa['cnpj_completo']} - {empresa['razao_social']}")


# 3. Buscar CNAEs secundários
def buscar_cnaes_secundarios(cnpj):
    response = requests.get(
        f"{API_BASE_URL}/cnpj/{cnpj}/cnaes-secundarios",
        headers=headers
    )

    if response.status_code == 200:
        return response.json()

    return []

cnaes_sec = buscar_cnaes_secundarios("00000000000191")
print(f"CNAEs Secundários: {len(cnaes_sec)}")
for cnae in cnaes_sec:
    print(f"  {cnae['codigo']}: {cnae['descricao']}")


# 4. Buscar sócios
def buscar_socios(cnpj):
    response = requests.get(
        f"{API_BASE_URL}/cnpj/{cnpj}/socios",
        headers=headers
    )

    if response.status_code == 200:
        return response.json()

    return []

socios = buscar_socios("00000000000191")
for socio in socios:
    print(f"Nome: {socio['nome_socio']}")
    print(f"Qualificação: {socio['qualificacao_socio']}")


# 5. Exemplo completo: Exportar empresas para CSV
import csv

def exportar_empresas_para_csv(filtros, arquivo_saida):
    todas_empresas = []
    page = 1

    while True:
        filtros['page'] = page
        filtros['per_page'] = 100  # Máximo por requisição

        resultado = buscar_empresas(filtros)
        if not resultado or not resultado['items']:
            break

        todas_empresas.extend(resultado['items'])

        print(f"Baixando página {page} de {resultado['total_pages']}...")

        if page >= resultado['total_pages']:
            break

        page += 1

    # Salvar em CSV
    if todas_empresas:
        with open(arquivo_saida, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = todas_empresas[0].keys()
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

            writer.writeheader()
            for empresa in todas_empresas:
                writer.writerow(empresa)

        print(f"Exportadas {len(todas_empresas)} empresas para {arquivo_saida}")

# Usar a função
filtros_exportacao = {
    "uf": "RJ",
    "mei": "S",
    "situacao_cadastral": "02"
}

exportar_empresas_para_csv(filtros_exportacao, "meis_rio.csv")
```

---

### JavaScript / Node.js

```javascript
const axios = require('axios');

const API_BASE_URL = 'https://sua-api.com.br/api/v1';
const API_KEY = 'sua_chave_api_aqui';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-API-Key': API_KEY
  }
});

// 1. Consultar CNPJ específico
async function consultarCNPJ(cnpj) {
  try {
    const response = await api.get(`/cnpj/${cnpj}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('CNPJ não encontrado');
    } else {
      console.error('Erro:', error.message);
    }
    return null;
  }
}

// Exemplo de uso
(async () => {
  const empresa = await consultarCNPJ('00000000000191');
  if (empresa) {
    console.log(`Razão Social: ${empresa.razao_social}`);
    console.log(`Capital Social: R$ ${empresa.capital_social.toLocaleString('pt-BR')}`);
  }
})();


// 2. Buscar empresas com filtros
async function buscarEmpresas(filtros) {
  try {
    const response = await api.get('/search', { params: filtros });
    return response.data;
  } catch (error) {
    console.error('Erro:', error.message);
    return null;
  }
}

// Exemplo: Empresas abertas em 2023
(async () => {
  const filtros = {
    data_inicio_atividade_de: '2023-01-01',
    data_inicio_atividade_ate: '2023-12-31',
    situacao_cadastral: '02',
    uf: 'SP',
    page: 1,
    per_page: 20
  };

  const resultado = await buscarEmpresas(filtros);
  if (resultado) {
    console.log(`Total encontrado: ${resultado.total}`);

    resultado.items.forEach(empresa => {
      console.log(`${empresa.cnpj_completo} - ${empresa.razao_social}`);
    });
  }
})();


// 3. Buscar todas as páginas
async function buscarTodasPaginas(filtros) {
  const todasEmpresas = [];
  let page = 1;

  while (true) {
    const resultado = await buscarEmpresas({ ...filtros, page, per_page: 100 });

    if (!resultado || resultado.items.length === 0) break;

    todasEmpresas.push(...resultado.items);
    console.log(`Baixando página ${page} de ${resultado.total_pages}...`);

    if (page >= resultado.total_pages) break;
    page++;
  }

  return todasEmpresas;
}

// Usar a função
(async () => {
  const empresas = await buscarTodasPaginas({
    uf: 'SP',
    cnae: '4712100',
    situacao_cadastral: '02'
  });

  console.log(`Total de empresas baixadas: ${empresas.length}`);
})();


// 4. Buscar sócios
async function buscarSocios(cnpj) {
  try {
    const response = await api.get(`/cnpj/${cnpj}/socios`);
    return response.data;
  } catch (error) {
    console.error('Erro:', error.message);
    return [];
  }
}

// 5. Buscar CNAEs secundários
async function buscarCnaesSecundarios(cnpj) {
  try {
    const response = await api.get(`/cnpj/${cnpj}/cnaes-secundarios`);
    return response.data;
  } catch (error) {
    console.error('Erro:', error.message);
    return [];
  }
}

// Exemplo de uso
(async () => {
  const cnaesSecundarios = await buscarCnaesSecundarios('00000000000191');
  console.log(`CNAEs Secundários encontrados: ${cnaesSecundarios.length}`);
  cnaesSecundarios.forEach(cnae => {
    console.log(`  ${cnae.codigo}: ${cnae.descricao}`);
  });
})();
```

---

### PHP

```php
<?php

class CNPJApi {
    private $baseUrl = 'https://sua-api.com.br/api/v1';
    private $apiKey;

    public function __construct($apiKey) {
        $this->apiKey = $apiKey;
    }

    private function request($endpoint, $params = []) {
        $url = $this->baseUrl . $endpoint;

        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'X-API-Key: ' . $this->apiKey
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200) {
            return json_decode($response, true);
        }

        return null;
    }

    public function consultarCNPJ($cnpj) {
        return $this->request("/cnpj/{$cnpj}");
    }

    public function buscarEmpresas($filtros) {
        return $this->request('/search', $filtros);
    }

    public function buscarSocios($cnpj) {
        return $this->request("/cnpj/{$cnpj}/socios");
    }

    public function buscarCnaesSecundarios($cnpj) {
        return $this->request("/cnpj/{$cnpj}/cnaes-secundarios");
    }

    public function listarCNAEs($search = null, $limit = 100) {
        $params = ['limit' => $limit];
        if ($search) {
            $params['search'] = $search;
        }
        return $this->request('/cnaes', $params);
    }
}

// Uso
$api = new CNPJApi('sua_chave_api_aqui');

// Consultar CNPJ
$empresa = $api->consultarCNPJ('00000000000191');
if ($empresa) {
    echo "Razão Social: " . $empresa['razao_social'] . "\n";
    echo "Capital Social: R$ " . number_format($empresa['capital_social'], 2, ',', '.') . "\n";
}

// Buscar empresas
$resultado = $api->buscarEmpresas([
    'uf' => 'SP',
    'porte' => '4',
    'situacao_cadastral' => '02',
    'page' => 1,
    'per_page' => 20
]);

if ($resultado) {
    echo "Total: " . $resultado['total'] . " empresas\n";

    foreach ($resultado['items'] as $empresa) {
        echo $empresa['cnpj_completo'] . " - " . $empresa['razao_social'] . "\n";
    }
}

// Buscar sócios
$socios = $api->buscarSocios('00000000000191');
foreach ($socios as $socio) {
    echo "Nome: " . $socio['nome_socio'] . "\n";
}

// Buscar CNAEs secundários
$cnaes_secundarios = $api->buscarCnaesSecundarios('00000000000191');
echo "CNAEs Secundários: " . count($cnaes_secundarios) . "\n";
foreach ($cnaes_secundarios as $cnae) {
    echo "  " . $cnae['codigo'] . ": " . $cnae['descricao'] . "\n";
}
?>
```

---

### cURL (Command Line)

```bash
# 1. Consultar CNPJ específico
curl -X GET "https://sua-api.com.br/api/v1/cnpj/00000000000191" \
  -H "X-API-Key: sua_chave_api_aqui"

# 2. Buscar empresas ativas em SP
curl -X GET "https://sua-api.com.br/api/v1/search?uf=SP&situacao_cadastral=02&page=1&per_page=20" \
  -H "X-API-Key: sua_chave_api_aqui"

# 3. Buscar empresas com múltiplos filtros
curl -X GET "https://sua-api.com.br/api/v1/search?uf=RJ&porte=4&capital_social_min=1000000&simples=N&identificador_matriz_filial=1" \
  -H "X-API-Key: sua_chave_api_aqui"

# 4. Buscar sócios
curl -X GET "https://sua-api.com.br/api/v1/cnpj/00000000000191/socios" \
  -H "X-API-Key: sua_chave_api_aqui"

# 5. Buscar CNAEs secundários
curl -X GET "https://sua-api.com.br/api/v1/cnpj/00000000000191/cnaes-secundarios" \
  -H "X-API-Key: sua_chave_api_aqui"

# 6. Listar CNAEs
curl -X GET "https://sua-api.com.br/api/v1/cnaes?search=comercio&limit=50" \
  -H "X-API-Key: sua_chave_api_aqui"

# 7. Listar municípios de SP
curl -X GET "https://sua-api.com.br/api/v1/municipios/SP" \
  -H "X-API-Key: sua_chave_api_aqui"

# 8. Estatísticas
curl -X GET "https://sua-api.com.br/api/v1/stats" \
  -H "X-API-Key: sua_chave_api_aqui"
```

---

## 🎯 Casos de Uso Práticos

### Caso 1: Encontrar Concorrentes em uma Região

```python
# Buscar empresas do mesmo CNAE em uma região específica
filtros = {
    "cnae": "4712100",  # Supermercados
    "uf": "SP",
    "municipio": "3550308",  # São Paulo
    "situacao_cadastral": "02",  # Ativas
    "page": 1,
    "per_page": 100
}

resultado = buscar_empresas(filtros)
```

### Caso 1B: Encontrar Empresas de um Sócio Específico

**Cenário**: Você quer encontrar todas as empresas de um sócio específico.

```python
# 1. Buscar sócios com CPF/Nome
socios = requests.get(
    f"{API_BASE_URL}/socios/search",
    headers=headers,
    params={"cpf_cnpj": "12345678900"}  # ou nome_socio="JOÃO SILVA"
).json()

# 2. Para cada CNPJ básico retornado, buscar dados completos da empresa
for socio in socios:
    cnpj_basico = socio['cnpj_basico']

    # Buscar a matriz (ordem 0001)
    cnpj_completo = cnpj_basico + "00010001"  # CNPJ básico + ordem + DV aproximado

    # Ou buscar todos os estabelecimentos desse CNPJ básico
    empresas = requests.get(
        f"{API_BASE_URL}/search",
        headers=headers,
        params={"cnpj": cnpj_basico}
    ).json()

    print(f"Empresas do sócio {socio['nome_socio']}:")
    for emp in empresas['items']:
        print(f"  - {emp['cnpj_completo']}: {emp['razao_social']}")
```

### Caso 1C: Buscar Empresas com Sócios de Perfil Específico

**Cenário**: Encontrar empresas que tenham pessoas físicas jovens (21-30 anos) como administradores.

```python
# 1. Buscar sócios com o perfil desejado
socios_jovens_admin = requests.get(
    f"{API_BASE_URL}/socios/search",
    headers=headers,
    params={
        "identificador_socio": "2",      # Pessoa Física
        "qualificacao_socio": "05",      # Administrador
        "faixa_etaria": "3",             # 21 a 30 anos
        "limit": 1000
    }
).json()

# 2. Obter CNPJs únicos
cnpjs_basicos = list(set([s['cnpj_basico'] for s in socios_jovens_admin]))

# 3. Buscar dados completos das empresas
empresas_detalhadas = []
for cnpj_basico in cnpjs_basicos[:50]:  # Limitar para exemplo
    empresas = requests.get(
        f"{API_BASE_URL}/search",
        headers=headers,
        params={"cnpj": cnpj_basico, "situacao_cadastral": "02"}
    ).json()

    if empresas['items']:
        empresas_detalhadas.extend(empresas['items'])

print(f"Encontradas {len(empresas_detalhadas)} empresas com administradores jovens")
```

### Caso 2: Análise de Mercado - Empresas Abertas Recentemente

```python
# Empresas abertas nos últimos 3 meses
from datetime import datetime, timedelta

data_limite = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')

filtros = {
    "data_inicio_atividade_de": data_limite,
    "uf": "RJ",
    "situacao_cadastral": "02",
    "page": 1,
    "per_page": 100
}
```

### Caso 3: Due Diligence - Verificar Empresa e Sócios

```python
cnpj = "12345678000190"

# 1. Buscar dados da empresa
empresa = consultar_cnpj(cnpj)

# 2. Buscar sócios
socios = buscar_socios(cnpj)

# 3. Análise
if empresa:
    print(f"Situação: {empresa['situacao_cadastral']}")
    print(f"Capital Social: R$ {empresa['capital_social']:,.2f}")
    print(f"Porte: {empresa['porte_empresa']}")
    print(f"\nTotal de sócios: {len(socios)}")
```

### Caso 4: Exportar MEIs de uma Cidade

```python
import pandas as pd

# Buscar todos os MEIs ativos de Campinas
def exportar_meis_campinas():
    empresas = []
    page = 1

    while True:
        filtros = {
            "mei": "S",
            "municipio": "3509502",  # Campinas
            "situacao_cadastral": "02",
            "page": page,
            "per_page": 100
        }

        resultado = buscar_empresas(filtros)
        if not resultado or not resultado['items']:
            break

        empresas.extend(resultado['items'])

        if page >= resultado['total_pages']:
            break

        page += 1

    # Converter para DataFrame
    df = pd.DataFrame(empresas)
    df.to_excel('meis_campinas.xlsx', index=False)
    print(f"Exportados {len(empresas)} MEIs")

exportar_meis_campinas()
```

### Caso 5: Monitorar Empresas de um CNAE Específico

```python
# Buscar empresas de tecnologia (CNAE 6201-5/00)
def monitorar_empresas_tech():
    filtros = {
        "cnae": "6201500",
        "uf": "SP",
        "situacao_cadastral": "02",
        "porte": "4",  # Grandes empresas
        "page": 1,
        "per_page": 100
    }

    resultado = buscar_empresas(filtros)

    print(f"Empresas de Tecnologia encontradas: {resultado['total']}")

    for empresa in resultado['items']:
        print(f"\nCNPJ: {empresa['cnpj_completo']}")
        print(f"Razão Social: {empresa['razao_social']}")
        print(f"Município: {empresa['municipio_desc']}")
        print(f"Capital Social: R$ {empresa['capital_social']:,.2f}")
```

---

## 📊 Códigos de Referência

### Situação Cadastral

| Código | Descrição |
|--------|-----------|
| 01 | Nula |
| 02 | Ativa ⭐ (mais usado) |
| 03 | Suspensa |
| 04 | Inapta |
| 08 | Baixada |

### Porte da Empresa

| Código | Descrição |
|--------|-----------|
| 1 | Micro Empresa |
| 2 | Empresa de Pequeno Porte |
| 3 | Empresa de Médio Porte |
| 4 | Grande Empresa |
| 5 | Demais (sem classificação) |

### Identificador Matriz/Filial

| Código | Descrição |
|--------|-----------|
| 1 | Matriz |
| 2 | Filial |

### Tipo de Sócio

| Código | Descrição |
|--------|-----------|
| 1 | Pessoa Jurídica |
| 2 | Pessoa Física |
| 3 | Estrangeiro |

### Qualificação de Sócio

| Código | Descrição |
|--------|-----------|
| 05 | Administrador |
| 08 | Conselheiro de Administração |
| 10 | Diretor |
| 11 | Conselheiro Fiscal |
| 16 | Presidente |
| 17 | Procurador |
| 19 | Interventor |
| 20 | Inventariante |
| 21 | Liquidante |
| 22 | Sócio |
| 23 | Sócio Comanditado |
| 24 | Sócio Comanditário |
| 25 | Sócio de Indústria |
| 28 | Sócio Incapaz ou Relativamente Incapaz |
| 29 | Sócio Menor (Assistido/Representado) |
| 30 | Sócio Ostensivo |
| 31 | Sócio Participante |
| 37 | Sócio-Gerente |
| 47 | Sócio Pessoa Jurídica Domiciliado no Exterior |
| 48 | Sócio Pessoa Física Residente no Exterior |
| 49 | Sócio-Administrador |
| 52 | Sócio com Capital |
| 53 | Sócio sem Capital |
| 54 | Fundador |
| 55 | Sócio Comanditado Residente no Exterior |
| 56 | Sócio Comanditário Pessoa Física Residente no Exterior |
| 57 | Sócio Comanditário Pessoa Jurídica Domiciliado no Exterior |
| 58 | Sócio Comanditário Incapaz |
| 59 | Produtor Rural |

### Faixa Etária

| Código | Descrição |
|--------|-----------|
| 1 | 0 a 12 anos |
| 2 | 13 a 20 anos |
| 3 | 21 a 30 anos |
| 4 | 31 a 40 anos |
| 5 | 41 a 50 anos |
| 6 | 51 a 60 anos |
| 7 | 61 a 70 anos |
| 8 | 71 a 80 anos |
| 9 | Acima de 80 anos |

---

## ⚠️ Códigos de Erro HTTP

| Código | Descrição | Solução |
|--------|-----------|---------|
| 200 | Sucesso | - |
| 400 | Requisição inválida | Verifique os parâmetros enviados |
| 401 | Não autorizado | Verifique sua API Key no header X-API-Key |
| 404 | Não encontrado | O CNPJ/recurso solicitado não existe |
| 429 | Muitas requisições | Você excedeu o limite de requisições, aguarde |
| 500 | Erro interno do servidor | Tente novamente mais tarde ou contate o suporte |

---

## 🚀 Boas Práticas

### 1. **Paginação Eficiente**

Sempre use paginação para grandes volumes:

```python
# ✅ BOM: Paginar resultados
for page in range(1, total_pages + 1):
    resultado = buscar_empresas({...filtros, "page": page, "per_page": 100})
    processar(resultado['items'])

# ❌ RUIM: Tentar baixar tudo de uma vez
resultado = buscar_empresas({...filtros, "per_page": 100000})  # Não funciona!
```

### 2. **Cache Local**

Armazene resultados que não mudam frequentemente:

```python
import pickle
from pathlib import Path

def buscar_com_cache(cnpj, cache_dir='cache'):
    cache_path = Path(cache_dir) / f"{cnpj}.pkl"

    # Verificar cache
    if cache_path.exists():
        with open(cache_path, 'rb') as f:
            return pickle.load(f)

    # Buscar da API
    empresa = consultar_cnpj(cnpj)

    # Salvar em cache
    cache_path.parent.mkdir(exist_ok=True)
    with open(cache_path, 'wb') as f:
        pickle.dump(empresa, f)

    return empresa
```

### 3. **Tratamento de Erros**

Sempre trate erros adequadamente:

```python
import time

def buscar_com_retry(cnpj, max_tentativas=3):
    for tentativa in range(max_tentativas):
        try:
            return consultar_cnpj(cnpj)
        except Exception as e:
            if tentativa < max_tentativas - 1:
                print(f"Erro na tentativa {tentativa + 1}, tentando novamente...")
                time.sleep(2 ** tentativa)  # Backoff exponencial
            else:
                print(f"Falhou após {max_tentativas} tentativas")
                raise e
```

### 4. **Validação de CNPJ**

Valide CNPJs antes de enviar:

```python
def validar_cnpj(cnpj):
    # Remove formatação
    cnpj = ''.join(filter(str.isdigit, cnpj))

    # Verifica se tem 14 dígitos
    if len(cnpj) != 14:
        return False

    # Validação de dígitos verificadores (algoritmo oficial)
    # ... código de validação ...

    return True

# Uso
cnpj = "00.000.000/0001-91"
if validar_cnpj(cnpj):
    empresa = consultar_cnpj(cnpj)
```

### 5. **Processamento Assíncrono**

Para grandes volumes, use processamento assíncrono:

```python
import asyncio
import aiohttp

async def buscar_cnpjs_async(cnpjs):
    async with aiohttp.ClientSession() as session:
        tasks = []

        for cnpj in cnpjs:
            task = buscar_cnpj_async(session, cnpj)
            tasks.append(task)

        resultados = await asyncio.gather(*tasks)
        return resultados

async def buscar_cnpj_async(session, cnpj):
    url = f"{API_BASE_URL}/cnpj/{cnpj}"
    headers = {"X-API-Key": API_KEY}

    async with session.get(url, headers=headers) as response:
        return await response.json()

# Uso
cnpjs = ["00000000000191", "33000167000101", ...]
resultados = asyncio.run(buscar_cnpjs_async(cnpjs))
```

---

## 📈 Limites e Rate Limiting

| Plano | Consultas/Mês | Requisições/Segundo | Timeout |
|-------|---------------|---------------------|---------|
| Básico | 300 | 5 | 30s |
| Profissional | 500 | 10 | 30s |
| Empresarial | 1.000 | 20 | 30s |

**Resposta ao exceder limite**:
```json
{
  "detail": "Limite de consultas mensais excedido. Faça upgrade do plano ou adquira pacotes adicionais."
}
```

---

## 🔒 Segurança

### 1. **Proteja sua API Key**

```python
# ✅ BOM: Usar variáveis de ambiente
import os
API_KEY = os.getenv('CNPJ_API_KEY')

# ❌ RUIM: Hardcoded no código
API_KEY = "chave_secreta_123"  # Nunca faça isso!
```

### 2. **Use HTTPS**

Sempre use HTTPS para todas as requisições (nossa API só aceita HTTPS).

### 3. **Monitore o Uso**

Acompanhe seu consumo no painel de clientes para evitar surpresas.

---

## 📞 Suporte

**Dúvidas ou problemas?**

- 📧 E-mail: suporte@sua-api.com.br
- 💬 Chat: Acesse o painel de clientes
- 📖 Documentação: https://sua-api.com.br/docs

---

## 🆕 Atualizações

A API é atualizada mensalmente com os dados mais recentes da Receita Federal.

**Última atualização**: Outubro/2025

---

## ✅ Checklist de Integração

Antes de colocar em produção, verifique:

- [ ] API Key configurada e funcionando
- [ ] Tratamento de erros implementado
- [ ] Paginação implementada para grandes volumes
- [ ] Cache local configurado (se aplicável)
- [ ] Logs de requisições habilitados
- [ ] Testes realizados em todos os endpoints necessários
- [ ] Validação de CNPJs implementada
- [ ] Monitoramento de uso configurado

---

## 📚 Recursos Adicionais

- **Swagger UI**: `https://sua-api.com.br/docs` (documentação interativa)
- **ReDoc**: `https://sua-api.com.br/redoc` (documentação alternativa)
- **Postman Collection**: Disponível no painel de clientes

---

**Pronto para começar?** 🚀

Obtenha sua API Key agora e comece a consultar milhões de CNPJs!