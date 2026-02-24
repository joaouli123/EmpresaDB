# 🔍 FILTROS COMPLETOS DA API - Todos os Filtros Disponíveis

## 📡 Endpoint de Busca Avançada

```
GET /api/v1/search
```

### 📦 Formato de Resposta

A API retorna um objeto JSON paginado com a seguinte estrutura:

```json
{
  "total": 1234,           // Total de registros encontrados
  "page": 1,               // Página atual
  "per_page": 20,          // Itens por página
  "total_pages": 62,       // Total de páginas (calculado: ceil(total / per_page))
  "items": [...]           // Array com os estabelecimentos encontrados
}
```

**Estrutura de cada item no array `items`:**

```json
{
  "cnpj_completo": "00000000000191",
  "cnpj_basico": "00000000",
  "cnpj_ordem": "0001",
  "cnpj_dv": "91",
  "identificador_matriz_filial": "1",      // 1=Matriz, 2=Filial
  "razao_social": "BANCO DO BRASIL S.A.",
  "nome_fantasia": "BANCO DO BRASIL",
  "situacao_cadastral": "02",              // 02=Ativa
  "data_situacao_cadastral": "2005-11-03",
  "data_inicio_atividade": "1808-10-12",
  "cnae_fiscal_principal": "6421200",
  "cnae_principal_desc": "Bancos comerciais",
  "tipo_logradouro": "AVENIDA",
  "logradouro": "PAULISTA",
  "numero": "1374",
  "complemento": "SALA 101",
  "bairro": "BELA VISTA",
  "cep": "01310100",
  "uf": "SP",
  "municipio_desc": "SAO PAULO",
  "ddd_1": "11",
  "telefone_1": "40042000",
  "correio_eletronico": "contato@bb.com.br",
  "porte_empresa": "5",                    // 1-5 (Micro a Grande)
  "capital_social": 98000000000.00,
  "opcao_simples": "N",                    // S ou N
  "opcao_mei": "N"                         // S ou N
}
```

## ✅ FILTROS REAIS DISPONÍVEIS HOJE

> Esta seção foi validada com o código do endpoint `GET /api/v1/search`.
> O endpoint é **exclusivo para usuário admin** (API key de admin).

### 🎯 Filtros de busca

| Filtro | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| `razao_social` | Texto | Busca parcial por razão social (`ILIKE`) | `razao_social=advogado` |
| `nome_fantasia` | Texto | Busca parcial por nome fantasia (`ILIKE`) | `nome_fantasia=athena` |
| `cnae` | Código | CNAE principal exato | `cnae=6911701` |
| `municipio` | Texto/Código | Nome do município (`ILIKE`) **ou** código interno da tabela `municipios` | `municipio=Curitiba` ou `municipio=7535` |
| `uf` | Texto | UF exata (normalizada para maiúsculo) | `uf=PR` |
| `situacao` | Código | Situação cadastral exata | `situacao=02` |
| `data_inicio_atividade_min` | Data | Data mínima (`>=`) no formato `YYYY-MM-DD` | `data_inicio_atividade_min=2020-01-01` |
| `data_inicio_atividade_max` | Data | Data máxima (`<=`) no formato `YYYY-MM-DD` | `data_inicio_atividade_max=2024-12-31` |

### 📄 Paginação (compatível em 2 formatos)

| Filtro | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| `limit` | Número | Itens por página (1 a 1000) | `limit=30` |
| `offset` | Número | Deslocamento da paginação | `offset=0` |
| `page` | Número | Página (compatibilidade legada) | `page=1` |
| `per_page` | Número | Itens por página (compatibilidade legada) | `per_page=30` |

> Regra de precedência: se `page/per_page` forem enviados, eles têm prioridade sobre `limit/offset`.

## ⚠️ Parâmetros que NÃO existem neste endpoint

Os parâmetros abaixo aparecem em versões antigas de documentação, mas **não são processados** por `GET /api/v1/search`:

- `porte`
- `natureza_juridica`
- `capital_social_min`, `capital_social_max`
- `simples`, `mei`
- `identificador_matriz_filial`
- `cep`, `bairro`, `logradouro`, `numero`, `complemento`, `tipo_logradouro`
- `motivo_situacao_cadastral`
- `data_situacao_cadastral_de`, `data_situacao_cadastral_ate`

## 🎯 Exemplos válidos

### 1) Busca de advogados no PR (Curitiba por nome)
```bash
GET /api/v1/search?razao_social=advogado&uf=PR&municipio=Curitiba&page=1&per_page=30
```

### 2) Busca por município via código interno
```bash
GET /api/v1/search?uf=PR&municipio=7535&limit=20&offset=0
```

### 3) Busca por CNAE + situação cadastral
```bash
GET /api/v1/search?cnae=6911701&situacao=02&limit=50
```

### 4) Busca por período de abertura
```bash
GET /api/v1/search?data_inicio_atividade_min=2022-01-01&data_inicio_atividade_max=2024-12-31&limit=30
```

## 📝 Regras importantes

- Datas devem estar em `YYYY-MM-DD`.
- `situacao` usa os códigos da Receita (ex.: `02` ativa).
- `municipio` numérico usa **código interno da tabela `municipios`** (não IBGE).
- Endpoint `/search` é admin-only; para usuários comuns, usar `/cnpj/{cnpj}`.

## ✅ Resumo atualizado

**Filtros de busca efetivamente suportados hoje:** 8  
**Parâmetros de paginação suportados:** 4

Teste na documentação interativa em **/api-docs**.
