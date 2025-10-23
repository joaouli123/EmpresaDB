# 🔍 FILTROS COMPLETOS DA API - Todos os Filtros Disponíveis

## 📡 Endpoint de Busca Avançada

```
GET /api/v1/search
```

## ✅ TODOS OS FILTROS DISPONÍVEIS

### 🏢 Dados da Empresa

| Filtro | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| `razao_social` | Texto | Razão social da empresa (busca parcial) | `razao_social=PETROBRAS` |
| `nome_fantasia` | Texto | Nome fantasia (busca parcial) | `nome_fantasia=Extra` |
| `natureza_juridica` | Código | Código da natureza jurídica | `natureza_juridica=2062` |
| `porte` | Código | Porte da empresa<br>1=Micro<br>2=Pequena<br>3=Média<br>4=Grande<br>5=Demais | `porte=4` |
| `capital_social_min` | Número | Capital social mínimo | `capital_social_min=100000` |
| `capital_social_max` | Número | Capital social máximo | `capital_social_max=1000000` |

### 📍 Localização

| Filtro | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| `uf` | Texto | Sigla do estado | `uf=SP` |
| `municipio` | Código | Código do município (IBGE) | `municipio=3550308` |
| `cep` | Texto | CEP (completo ou parcial) | `cep=01310` |
| `bairro` | Texto | Nome do bairro (busca parcial) | `bairro=Centro` |
| `logradouro` | Texto | Nome da rua/avenida (busca parcial) | `logradouro=Paulista` |
| `tipo_logradouro` | Texto | Tipo do logradouro (busca parcial) | `tipo_logradouro=AVENIDA` |
| `numero` | Texto | Número do estabelecimento | `numero=1000` |
| `complemento` | Texto | Complemento do endereço (busca parcial) | `complemento=SALA` |

### 📊 Situação Cadastral

| Filtro | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| `situacao_cadastral` | Código | Situação cadastral<br>01=Nula<br>02=Ativa<br>03=Suspensa<br>04=Inapta<br>08=Baixada | `situacao_cadastral=02` |
| `motivo_situacao_cadastral` | Texto | Motivo da situação cadastral (busca parcial) | `motivo_situacao_cadastral=ENCERRAMENTO` |
| `data_situacao_cadastral_de` | Data | Data da situação cadastral DE | `data_situacao_cadastral_de=2020-01-01` |
| `data_situacao_cadastral_ate` | Data | Data da situação cadastral ATÉ | `data_situacao_cadastral_ate=2024-12-31` |

### 📅 Datas

| Filtro | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| `data_inicio_atividade_de` | Data | Data de início de atividade DE (formato: YYYY-MM-DD) | `data_inicio_atividade_de=2020-01-01` |
| `data_inicio_atividade_ate` | Data | Data de início de atividade ATÉ (formato: YYYY-MM-DD) | `data_inicio_atividade_ate=2024-12-31` |

### 🏭 Atividade Econômica

| Filtro | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| `cnae` | Código | CNAE principal (atividade econômica) | `cnae=4712100` |

### 🏪 Tipo de Estabelecimento

| Filtro | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| `identificador_matriz_filial` | Código | 1=Matriz<br>2=Filial | `identificador_matriz_filial=1` |

### 💼 Regime Tributário

| Filtro | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| `simples` | S/N | Optante pelo Simples Nacional | `simples=S` |
| `mei` | S/N | Optante pelo MEI | `mei=S` |

### 📄 Paginação

| Filtro | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| `page` | Número | Número da página (padrão: 1) | `page=1` |
| `per_page` | Número | Itens por página (padrão: 20, máx: 100) | `per_page=50` |

## 🎯 Exemplos Práticos Completos

### Exemplo 1: Empresas de Grande Porte em SP com Capital > 1 milhão
```bash
GET /api/v1/search?uf=SP&porte=4&capital_social_min=1000000&situacao_cadastral=02
```

### Exemplo 2: Matrizes Ativas Abertas em 2023
```bash
GET /api/v1/search?identificador_matriz_filial=1&situacao_cadastral=02&data_inicio_atividade_de=2023-01-01&data_inicio_atividade_ate=2023-12-31
```

### Exemplo 3: MEIs no Centro de São Paulo
```bash
GET /api/v1/search?mei=S&uf=SP&municipio=3550308&bairro=Centro
```

### Exemplo 4: Comércio Varejista na Av. Paulista
```bash
GET /api/v1/search?cnae=4712100&logradouro=Paulista&tipo_logradouro=AVENIDA&uf=SP
```

### Exemplo 5: Empresas Baixadas em 2024 com Capital Social entre 50k e 500k
```bash
GET /api/v1/search?situacao_cadastral=08&data_situacao_cadastral_de=2024-01-01&capital_social_min=50000&capital_social_max=500000
```

### Exemplo 6: Filiais de Empresas do Simples Nacional no RJ
```bash
GET /api/v1/search?identificador_matriz_filial=2&simples=S&uf=RJ&situacao_cadastral=02
```

### Exemplo 7: Buscar por CEP Específico
```bash
GET /api/v1/search?cep=01310100
```

### Exemplo 8: Empresas Pequenas Abertas Recentemente
```bash
GET /api/v1/search?porte=2&data_inicio_atividade_de=2024-01-01&situacao_cadastral=02
```

### Exemplo 9: Filtro Combinado Complexo
```bash
GET /api/v1/search?uf=SP&situacao_cadastral=02&cnae=4712100&capital_social_min=100000&data_inicio_atividade_de=2020-01-01&simples=S&identificador_matriz_filial=1&page=1&per_page=50
```

## 📝 Formato das Datas

Todas as datas devem estar no formato **YYYY-MM-DD** (Ano-Mês-Dia):
- ✅ Correto: `2024-01-15`
- ✅ Correto: `2020-12-31`
- ❌ Errado: `15/01/2024`
- ❌ Errado: `2024/01/15`

## 🔢 Códigos Importantes

### Situação Cadastral
- `01` - Nula
- `02` - Ativa ⭐ (mais usado)
- `03` - Suspensa
- `04` - Inapta
- `08` - Baixada

### Porte da Empresa
- `1` - Micro Empresa
- `2` - Empresa de Pequeno Porte
- `3` - Empresa de Médio Porte
- `4` - Grande Empresa
- `5` - Demais (sem classificação)

### Identificador Matriz/Filial
- `1` - Matriz
- `2` - Filial

### Simples Nacional / MEI
- `S` - Sim (Optante)
- `N` - Não (Não optante)

## 💡 Dicas de Uso

### Busca por Capital Social
Para encontrar empresas com capital social específico:
```bash
# Empresas com capital exatamente entre 100k e 500k
GET /api/v1/search?capital_social_min=100000&capital_social_max=500000

# Empresas com capital acima de 1 milhão
GET /api/v1/search?capital_social_min=1000000

# Empresas com capital até 50k
GET /api/v1/search?capital_social_max=50000
```

### Busca por Período de Abertura
```bash
# Empresas abertas em 2023
GET /api/v1/search?data_inicio_atividade_de=2023-01-01&data_inicio_atividade_ate=2023-12-31

# Empresas abertas nos últimos 6 meses
GET /api/v1/search?data_inicio_atividade_de=2024-04-01
```

### Busca por Endereço Completo
```bash
# Busca específica de endereço
GET /api/v1/search?tipo_logradouro=RUA&logradouro=Augusta&numero=1000&bairro=Consolação&uf=SP
```

### Combinando Múltiplos Filtros
Você pode combinar QUANTOS FILTROS QUISER! Exemplo:
```bash
GET /api/v1/search?uf=SP&municipio=3550308&situacao_cadastral=02&porte=4&cnae=6201501&capital_social_min=500000&data_inicio_atividade_de=2020-01-01&simples=N&identificador_matriz_filial=1&page=1&per_page=100
```

## ✅ Resumo Total

**Total de Filtros Disponíveis: 26 FILTROS!**

1. ✅ Razão Social
2. ✅ Nome Fantasia
3. ✅ UF
4. ✅ Município
5. ✅ CNAE
6. ✅ Situação Cadastral
7. ✅ Porte
8. ✅ Simples Nacional
9. ✅ MEI
10. ✅ Identificador Matriz/Filial
11. ✅ Natureza Jurídica
12. ✅ Capital Social Mínimo
13. ✅ Capital Social Máximo
14. ✅ Data Início Atividade DE
15. ✅ Data Início Atividade ATÉ
16. ✅ Data Situação Cadastral DE
17. ✅ Data Situação Cadastral ATÉ
18. ✅ Motivo Situação Cadastral
19. ✅ CEP
20. ✅ Bairro
21. ✅ Logradouro
22. ✅ Tipo Logradouro
23. ✅ Número
24. ✅ Complemento
25. ✅ Page (paginação)
26. ✅ Per Page (itens por página)

## 🚀 Está Pronto!

Agora você tem acesso a **TODOS OS FILTROS POSSÍVEIS** das tabelas da Receita Federal!

Teste agora na documentação interativa: **/docs**
