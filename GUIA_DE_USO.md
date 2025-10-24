# 📘 Guia de Uso - Sistema CNPJ

## 🎯 Visão Geral

Você agora tem um sistema completo para trabalhar com dados públicos de CNPJ da Receita Federal:

1. **ETL (Extração, Transformação e Carga)**: Baixa e importa os dados para seu PostgreSQL
2. **API REST**: Interface para consultar os dados importados

## 🚀 Passo a Passo

### 1️⃣ Importar os Dados (Executar ETL)

**IMPORTANTE**: Este processo vai:
- Baixar ~5GB de arquivos da Receita Federal
- Processar ~60 milhões de registros
- Pode levar várias horas

Para iniciar a importação, execute:

```bash
python run_etl.py
```

O sistema vai:
1. ✅ Criar todas as tabelas no PostgreSQL
2. ✅ Baixar os arquivos mais recentes (outubro/2025)
3. ✅ Importar em ordem:
   - Tabelas auxiliares (CNAEs, Municípios, etc.)
   - Empresas
   - Estabelecimentos
   - Sócios
   - Simples Nacional

**Progresso**: Você verá barras de progresso e logs detalhados durante o processo.

### 2️⃣ Usar a API

A API já está rodando! Acesse:

**Documentação Interativa**: Clique no botão "Webview" ou acesse `/docs`

### 📡 Exemplos de Uso da API

#### Consultar um CNPJ específico

```bash
GET /api/v1/cnpj/00000000000191
```

Retorna todos os dados da empresa, incluindo:
- Razão social e nome fantasia
- Endereço completo
- CNAE principal e descrição
- Situação cadastral
- Capital social, porte
- Se é Simples Nacional ou MEI

#### Buscar empresas por filtros

```bash
# Empresas ativas em São Paulo
GET /api/v1/search?uf=SP&situacao_cadastral=02

# Buscar por razão social
GET /api/v1/search?razao_social=PETROBRAS

# Buscar por CNAE (atividade econômica)
GET /api/v1/search?cnae=4712100

# Filtros combinados
GET /api/v1/search?uf=RJ&porte=4&simples=N&page=1&per_page=20
```

**Resposta:**
```json
{
  "total": 1234,
  "page": 1,
  "per_page": 20,
  "total_pages": 62,
  "items": [
    {
      "cnpj_completo": "33000167000101",
      "razao_social": "PETROLEO BRASILEIRO S.A. PETROBRAS",
      "nome_fantasia": "PETROBRAS",
      "uf": "RJ",
      "municipio_desc": "RIO DE JANEIRO",
      "situacao_cadastral": "02",
      "porte_empresa": "5",
      "capital_social": 246619165719.33,
      "opcao_simples": "N",
      "opcao_mei": "N"
      // ... outros campos
    }
    // ... mais 19 itens
  ]
}
```

**⭐ TODOS OS FILTROS DISPONÍVEIS (26 filtros no total!)**:

**Dados da Empresa:**
- `razao_social`: Nome da empresa (busca parcial)
- `nome_fantasia`: Nome fantasia (busca parcial)
- `natureza_juridica`: Código da natureza jurídica
- `porte`: 1=Micro, 2=Pequena, 3=Média, 4=Grande, 5=Demais
- `capital_social_min`: Capital social mínimo
- `capital_social_max`: Capital social máximo
- `identificador_matriz_filial`: 1=Matriz, 2=Filial

**Localização:**
- `uf`: Estado (SP, RJ, MG, etc.)
- `municipio`: Código do município
- `cep`: CEP (completo ou parcial)
- `bairro`: Bairro (busca parcial)
- `logradouro`: Rua/Avenida (busca parcial)
- `tipo_logradouro`: Tipo (RUA, AVENIDA, etc.)
- `numero`: Número do estabelecimento
- `complemento`: Complemento (busca parcial)

**Situação e Atividade:**
- `situacao_cadastral`: 01=Nula, 02=Ativa, 03=Suspensa, 04=Inapta, 08=Baixada
- `motivo_situacao_cadastral`: Motivo (busca parcial)
- `data_situacao_cadastral_de`: Data situação DE (YYYY-MM-DD)
- `data_situacao_cadastral_ate`: Data situação ATÉ (YYYY-MM-DD)
- `cnae`: CNAE principal (atividade econômica)

**Datas:**
- `data_inicio_atividade_de`: Data abertura DE (YYYY-MM-DD)
- `data_inicio_atividade_ate`: Data abertura ATÉ (YYYY-MM-DD)

**Regime Tributário:**
- `simples`: S ou N (Simples Nacional)
- `mei`: S ou N (MEI)

**Paginação:**
- `page`: Página (padrão: 1)
- `per_page`: Itens por página (padrão: 20, max: 100)

📄 **Ver documentação completa**: `FILTROS_COMPLETOS.md`

#### Listar sócios de uma empresa

```bash
GET /api/v1/cnpj/00000000000191/socios
```

#### Buscar CNAEs

```bash
# Buscar atividades econômicas
GET /api/v1/cnaes?search=comercio&limit=50
```

#### Listar municípios de um estado

```bash
GET /api/v1/municipios/SP
```

#### Ver estatísticas do banco

```bash
GET /api/v1/stats
```

Retorna:
- Total de empresas
- Total de estabelecimentos
- Total de sócios
- Total de CNAEs
- Total de municípios

## 🔍 Exemplos Práticos

### Exemplo 1: Encontrar todas as padarias em São Paulo (capital)

```bash
GET /api/v1/search?cnae=4721102&uf=SP&municipio=7107
```

### Exemplo 2: Listar empresas de grande porte no Rio de Janeiro

```bash
GET /api/v1/search?uf=RJ&porte=4&situacao_cadastral=02
```

### Exemplo 3: Buscar empresas optantes do Simples Nacional

```bash
GET /api/v1/search?simples=S&uf=MG&page=1
```

### Exemplo 4: Empresas com capital social entre 100k e 1 milhão

```bash
GET /api/v1/search?capital_social_min=100000&capital_social_max=1000000&situacao_cadastral=02
```

### Exemplo 5: Empresas abertas em 2023

```bash
GET /api/v1/search?data_inicio_atividade_de=2023-01-01&data_inicio_atividade_ate=2023-12-31
```

### Exemplo 6: Matrizes de grande porte em São Paulo

```bash
GET /api/v1/search?identificador_matriz_filial=1&porte=4&uf=SP&situacao_cadastral=02
```

### Exemplo 7: Buscar por endereço específico

```bash
GET /api/v1/search?tipo_logradouro=AVENIDA&logradouro=Paulista&uf=SP
```

### Exemplo 8: MEIs no bairro Centro

```bash
GET /api/v1/search?mei=S&bairro=Centro&situacao_cadastral=02
```

## 📊 Estrutura dos Dados

### CNPJ - Como funciona

O CNPJ tem 14 dígitos divididos em 3 partes:
- **8 primeiros** (CNPJ Básico): Identifica a empresa
- **4 seguintes** (Ordem): Identifica o estabelecimento (0001 = matriz)
- **2 últimos** (DV): Dígitos verificadores

**Exemplo**: `12.345.678/0001-90`
- `12345678` = CNPJ Básico (empresa)
- `0001` = Matriz
- `90` = DV

### Tabelas Principais

1. **empresas**: Dados da empresa (razão social, capital social, natureza jurídica)
2. **estabelecimentos**: Dados de cada unidade (endereço, CNAEs, telefones)
3. **socios**: Sócios e representantes
4. **simples_nacional**: Opções de Simples e MEI

## ⚠️ Observações Importantes

### Dados Vazios Inicialmente

A API estará vazia até você executar `python run_etl.py` para importar os dados.

Você pode verificar o status:
```bash
GET /api/v1/stats
```

### Performance

- As consultas são otimizadas com índices
- Use paginação (`page` e `per_page`) para grandes resultados
- Filtros combinados retornam resultados mais precisos

### Atualizações Mensais

A Receita Federal atualiza os dados todo mês. Para atualizar:

1. Execute novamente: `python run_etl.py`
2. O sistema vai baixar a versão mais recente
3. Os dados antigos serão substituídos

## 🛠️ Solução de Problemas

### Erro de conexão com banco

Verifique se:
- O PostgreSQL no VPS está rodando
- As credenciais nos Secrets do Replit estão corretas
- O firewall permite conexão na porta 5432

### Download muito lento

Os arquivos da Receita são grandes (~5GB). Isso é normal.

### Falta de memória durante importação

O sistema processa em chunks de 50.000 registros para evitar problemas de memória.

## 📞 Integrando com Seu Sistema

### Exemplo de integração em JavaScript

```javascript
// Buscar empresa por CNPJ
const cnpj = "00000000000191";
const response = await fetch(`https://seu-replit.repl.co/api/v1/cnpj/${cnpj}`);
const empresa = await response.json();

console.log(empresa.razao_social);
console.log(empresa.endereco_completo);
```

### Exemplo em Python

```python
import requests

# Buscar empresas
response = requests.get(
    "https://seu-replit.repl.co/api/v1/search",
    params={
        "uf": "SP",
        "situacao_cadastral": "02",
        "page": 1,
        "per_page": 50
    }
)

empresas = response.json()
print(f"Total: {empresas['total']}")
for item in empresas['items']:
    print(f"{item['cnpj_completo']} - {item['razao_social']}")
```

## ✅ Próximos Passos Sugeridos

1. Execute o ETL para importar os dados
2. Teste a API com alguns CNPJs conhecidos
3. Integre com seu sistema de consulta
4. Configure cache (Redis) para melhorar performance (futuro)
5. Adicione autenticação por API key (se necessário)

## 🎉 Pronto!

Você agora tem um sistema completo de consulta de CNPJs. Bom uso! 🚀