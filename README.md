# Sistema de Consulta CNPJ - Receita Federal

Sistema completo de ETL e API REST para consulta de dados públicos de CNPJ da Receita Federal brasileira.

## 🚀 Funcionalidades

### Sistema ETL
- Download automático dos arquivos mais recentes da Receita Federal
- Extração inteligente de arquivos ZIP
- Processamento em chunks para otimizar memória (50.000 registros por vez)
- Construção automática do CNPJ completo (14 dígitos) a partir das 3 partes
- Importação otimizada para PostgreSQL usando COPY
- Índices otimizados para consultas rápidas

### API REST
- **Consulta por CNPJ**: Busca detalhada por CNPJ completo
- **Busca Avançada**: Filtros por razão social, nome fantasia, UF, município, CNAE, situação cadastral, porte, Simples/MEI
- **Sócios**: Lista de sócios de uma empresa
- **CNAEs**: Listagem de atividades econômicas
- **Municípios**: Municípios por UF
- **Estatísticas**: Totais de registros no banco
- Paginação automática
- Documentação interativa (Swagger/OpenAPI)

## 📋 Requisitos

- Python 3.11+
- PostgreSQL 16+ (já configurado no VPS)
- Conexão com internet para download dos dados

## 🔧 Configuração

### 1. Instalar Dependências

```bash
pip install -r requirements.txt
```

### 2. Configurar Variáveis de Ambiente

Configure as variáveis de ambiente com suas credenciais do PostgreSQL.

As credenciais devem ser fornecidas como secrets do Replit para máxima segurança.

## 🎯 Uso

### Executar ETL Completo

Este comando vai:
1. Criar todas as tabelas no PostgreSQL
2. Baixar os arquivos mais recentes da Receita Federal
3. Importar todos os dados

```bash
python run_etl.py
```

⚠️ **ATENÇÃO**: O processo completo pode levar várias horas e baixar ~5GB de dados!

### Iniciar a API

```bash
python main.py
```

A API estará disponível em: `http://0.0.0.0:5000`

Documentação interativa: `http://0.0.0.0:5000/docs`

## 📡 Endpoints da API

### Consulta por CNPJ

```bash
GET /api/v1/cnpj/{cnpj}
```

Exemplo:
```bash
curl http://localhost:5000/api/v1/cnpj/00000000000191
```

### Busca Avançada

```bash
GET /api/v1/search?razao_social=PETROBRAS&uf=RJ&page=1&per_page=20
```

Parâmetros disponíveis:
- `razao_social`: Razão social (busca parcial)
- `nome_fantasia`: Nome fantasia (busca parcial)
- `uf`: Sigla do estado (SP, RJ, MG, etc.)
- `municipio`: Código do município
- `cnae`: CNAE principal
- `situacao_cadastral`: 01-Nula, 02-Ativa, 03-Suspensa, 04-Inapta, 08-Baixada
- `porte`: 1-Micro, 2-Pequeno, 3-Médio, 4-Grande, 5-Demais
- `simples`: S ou N (Optante Simples Nacional)
- `mei`: S ou N (Optante MEI)
- `page`: Número da página (padrão: 1)
- `per_page`: Itens por página (padrão: 20, máx: 100)

### Sócios de uma Empresa

```bash
GET /api/v1/cnpj/{cnpj}/socios
```

### Listar CNAEs

```bash
GET /api/v1/cnaes?search=comercio&limit=100
```

### Municípios por UF

```bash
GET /api/v1/municipios/SP
```

### Estatísticas

```bash
GET /api/v1/stats
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Auxiliares
- `cnaes` - Atividades econômicas
- `municipios` - Municípios
- `motivos_situacao_cadastral` - Motivos de situação cadastral
- `naturezas_juridicas` - Naturezas jurídicas
- `paises` - Países
- `qualificacoes_socios` - Qualificações de sócios

### Tabelas Principais
- `empresas` - Dados das empresas (nível CNPJ básico - 8 dígitos)
- `estabelecimentos` - Estabelecimentos (matriz e filiais - CNPJ completo 14 dígitos)
- `socios` - Sócios e representantes
- `simples_nacional` - Opções Simples Nacional e MEI

### Views
- `vw_estabelecimentos_completos` - View com todos os dados relacionados

## 📊 Volumes Esperados

- ~60 milhões de empresas
- ~50 milhões de estabelecimentos
- Dados auxiliares: ~10.000 registros totais
- Tamanho total: ~20GB descompactado

## 🔍 Estrutura do Projeto

```
.
├── src/
│   ├── api/
│   │   ├── main.py          # Aplicação FastAPI
│   │   ├── routes.py        # Endpoints da API
│   │   └── models.py        # Modelos Pydantic
│   ├── database/
│   │   ├── connection.py    # Gerenciador de conexão
│   │   ├── schema.sql       # Schema completo do banco
│   │   └── init_db.py       # Inicializador do banco
│   ├── etl/
│   │   ├── downloader.py    # Download dos arquivos RFB
│   │   └── importer.py      # Importação para PostgreSQL
│   └── config.py            # Configurações
├── downloads/               # Arquivos ZIP baixados
├── data/                    # CSVs extraídos
├── logs/                    # Logs do processo
├── main.py                  # Inicia a API
├── run_etl.py              # Executa ETL completo
└── requirements.txt        # Dependências Python
```

## 🔐 Segurança

- A API aceita requisições de qualquer origem (CORS aberto)
- Não há autenticação (dados públicos)
- Para produção, considere adicionar rate limiting e autenticação por API key

## 📝 Observações

- Os dados são atualizados mensalmente pela Receita Federal
- O CNPJ é dividido em: CNPJ Básico (8) + Ordem (4) + DV (2) = 14 dígitos
- A chave de ligação entre tabelas é o `cnpj_basico` (8 primeiros dígitos)
- CNPJs são armazenados sem pontuação (apenas números)

## 🆘 Suporte

Para problemas ou dúvidas sobre a estrutura dos dados da Receita Federal:
- https://www.gov.br/receitafederal/dados/cnpj-metadados.pdf
- https://dados.gov.br/dados/conjuntos-dados/cadastro-nacional-da-pessoa-juridica---cnpj
