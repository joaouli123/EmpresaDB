# Sistema de Consulta CNPJ - Receita Federal

## 📋 Visão Geral do Projeto

Sistema completo de ETL (Extração, Transformação e Carga) e API REST para consulta de dados públicos de CNPJ da Receita Federal brasileira.

## 🎯 Objetivo

Criar um "super sistema de consulta e filtro avançado" de empresas brasileiras, armazenando e organizando todos os dados da Receita Federal (empresas, estabelecimentos, CNPJs, sócios) em um banco PostgreSQL no VPS do usuário, com API REST completa para integração.

## 🏗️ Arquitetura

### Banco de Dados
- **Tipo**: PostgreSQL 16 (no VPS do usuário)
- **Host**: 72.61.217.143:5432
- **Banco**: cnpj_db
- **Credenciais**: Armazenadas como Secrets do Replit

### Estrutura do Projeto

```
.
├── src/
│   ├── api/              # API REST com FastAPI
│   │   ├── main.py       # Aplicação principal
│   │   ├── routes.py     # Endpoints
│   │   └── models.py     # Modelos Pydantic
│   ├── database/         # Camada de banco de dados
│   │   ├── connection.py # Gerenciador de conexão
│   │   ├── schema.sql    # Schema completo (tabelas, índices, views)
│   │   └── init_db.py    # Inicializador
│   ├── etl/              # Pipeline ETL
│   │   ├── downloader.py # Download dos arquivos RFB
│   │   └── importer.py   # Importação para PostgreSQL
│   └── config.py         # Configurações
├── main.py               # Entrada da API
├── run_etl.py           # Executa processo ETL completo
└── GUIA_DE_USO.md       # Documentação detalhada
```

## 🗄️ Schema do Banco de Dados

### Tabelas Auxiliares
- `cnaes` - Classificação Nacional de Atividades Econômicas
- `municipios` - Municípios brasileiros
- `motivos_situacao_cadastral` - Motivos de situação cadastral
- `naturezas_juridicas` - Naturezas jurídicas
- `paises` - Países
- `qualificacoes_socios` - Qualificações de sócios

### Tabelas Principais
- `empresas` - Dados das empresas (nível CNPJ básico - 8 dígitos)
- `estabelecimentos` - Estabelecimentos com CNPJ completo (14 dígitos)
- `socios` - Sócios e representantes legais
- `simples_nacional` - Opções de Simples Nacional e MEI

### Features Importantes
- **CNPJ Completo Automático**: Campo `cnpj_completo` gerado automaticamente juntando as 3 partes
- **Índices Otimizados**: Índices em todas as colunas de busca (CNPJ, razão social, UF, município, CNAE)
- **Full-Text Search**: Busca em português para razão social e nome fantasia
- **View Completa**: `vw_estabelecimentos_completos` com todos os dados relacionados

## 🔄 Processo ETL

### 1. Download
- Acessa https://arquivos.receitafederal.gov.br/dados/cnpj/
- Lista todos os arquivos ZIP disponíveis
- Classifica por tipo (empresas, estabelecimentos, sócios, etc.)
- Baixa a versão mais recente (outubro/2025)

### 2. Extração
- Descompacta arquivos ZIP
- Extrai CSVs (encoding: latin1, delimiter: ;)

### 3. Importação
- **Ordem respeitada**: Tabelas auxiliares → Empresas → Estabelecimentos → Sócios → Simples
- **Processamento em chunks**: 50.000 registros por vez para otimizar memória
- **COPY otimizado**: Usa PostgreSQL COPY para importação rápida
- **Transformações**:
  - Conversão de datas (AAAAMMDD → YYYY-MM-DD)
  - Conversão de capital social (vírgula → ponto decimal)
  - Construção do CNPJ completo (14 dígitos)

## 📡 API REST

### Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/` | Health check |
| GET | `/api/v1/stats` | Estatísticas do banco |
| GET | `/api/v1/cnpj/{cnpj}` | Consulta por CNPJ |
| GET | `/api/v1/search` | Busca avançada com filtros |
| GET | `/api/v1/cnpj/{cnpj}/socios` | Sócios da empresa |
| GET | `/api/v1/cnaes` | Listar CNAEs |
| GET | `/api/v1/municipios/{uf}` | Municípios por UF |

### Filtros da Busca Avançada
- Razão social (parcial)
- Nome fantasia (parcial)
- UF
- Município
- CNAE
- Situação cadastral
- Porte da empresa
- Optante Simples Nacional
- Optante MEI
- Paginação (page, per_page)

### Documentação Automática
- Swagger UI: `/docs`
- ReDoc: `/redoc`

## 🔐 Segurança

- **Secrets do Replit**: Credenciais armazenadas de forma segura
- **Sem hardcoded credentials**: Removidas do código
- **CORS aberto**: Permite requisições de qualquer origem (dados públicos)

## 📊 Volumes Esperados

- ~60 milhões de empresas
- ~50 milhões de estabelecimentos
- ~5GB de dados compactados
- ~20GB descompactados

## 🚀 Como Usar

### 1. Importar Dados (Primeira vez)
```bash
python run_etl.py
```

### 2. Iniciar API
```bash
python main.py
```
API disponível em: http://0.0.0.0:5000

## 🔧 Configuração Atual

### Workflow
- **Nome**: API
- **Comando**: `python main.py`
- **Porta**: 5000
- **Output**: Webview

### Dependências Python
- FastAPI + Uvicorn (API REST)
- psycopg2-binary (PostgreSQL)
- SQLAlchemy (ORM)
- pandas (processamento CSV)
- requests + BeautifulSoup4 (download)
- tqdm (barras de progresso)
- pydantic (validação)

## 📝 Estado Atual

- ✅ Schema do banco criado
- ✅ Sistema ETL implementado
- ✅ API REST funcionando
- ✅ Secrets configurados
- ✅ Workflow ativo
- ⏳ Dados não importados (aguardando execução do ETL)

## 🎯 Próximas Melhorias Sugeridas

1. **Cache**: Implementar Redis para consultas frequentes
2. **Async**: Migrar queries para async para melhor performance
3. **Rate Limiting**: Controle de requisições por IP/usuário
4. **Autenticação**: API keys para controle de acesso
5. **Estatísticas**: Endpoints de agregações (empresas por estado, CNAEs mais comuns)
6. **Atualização Incremental**: Sistema automático de atualização mensal

## 📞 Integrações Futuras

A API está pronta para integração com:
- Sistemas de consulta empresarial
- Dashboards de business intelligence
- Ferramentas de compliance
- Apps de análise de mercado

## 🐛 Debugging

### Verificar Conexão
```bash
curl http://localhost:5000/api/v1/
```

### Ver Estatísticas
```bash
curl http://localhost:5000/api/v1/stats
```

### Logs
- Workflow logs: Disponíveis no painel do Replit
- ETL logs: Output detalhado durante execução

## 💡 Observações Importantes

1. **CNPJ Estrutura**: 8 (básico) + 4 (ordem) + 2 (DV) = 14 dígitos
2. **Chave de Ligação**: `cnpj_basico` (8 primeiros dígitos) liga todas as tabelas
3. **Dados Públicos**: Informações disponibilizadas pela Receita Federal
4. **Atualização Mensal**: RFB atualiza dados todo mês
5. **Performance**: Índices otimizados para consultas rápidas

## 📚 Documentação

- `README.md` - Documentação técnica
- `GUIA_DE_USO.md` - Guia passo a passo para o usuário
- `/docs` - Documentação interativa da API (Swagger)

---

**Última atualização**: 23 de outubro de 2025
**Versão da API**: 1.0.0
**Status**: Pronto para importação de dados
