# Sistema de Consulta CNPJ - Receita Federal

## 📋 Visão Geral do Projeto

Sistema completo de ETL (Extração, Transformação e Carga) e API REST para consulta de dados públicos de CNPJ da Receita Federal brasileira.

## 🎯 Objetivo

Criar um "super sistema de consulta e filtro avançado" de empresas brasileiras, armazenando e organizando todos os dados da Receita Federal (empresas, estabelecimentos, CNPJs, sócios) em um banco PostgreSQL no VPS do usuário, com API REST completa para integração.

## 🏗️ Arquitetura

### Banco de Dados
- **IMPORTANTE**: Este projeto USA O BANCO DE DADOS DO VPS, NÃO o banco do Replit!
- **Tipo**: PostgreSQL 16 (no VPS do usuário)
- **Host**: 72.61.217.143:5432
- **Banco**: cnpj_db
- **Usuário**: novo_usuario
- **Credenciais**: Configuradas no arquivo .env (as variáveis DATABASE_URL, PGHOST, etc do Replit são IGNORADAS)

### Estrutura do Projeto

```
.
├── src/
│   ├── api/              # API REST com FastAPI
│   │   ├── main.py       # Aplicação principal
│   │   ├── routes.py     # Endpoints + WebSocket
│   │   ├── models.py     # Modelos Pydantic
│   │   ├── etl_controller.py      # Controlador do ETL
│   │   └── websocket_manager.py   # Gerenciador WebSocket
│   ├── database/         # Camada de banco de dados
│   │   ├── connection.py          # Gerenciador de conexão
│   │   ├── schema.sql             # Schema principal
│   │   ├── etl_tracking_schema.sql # Schema de tracking
│   │   └── init_db.py             # Inicializador
│   ├── etl/              # Pipeline ETL
│   │   ├── downloader.py # Download dos arquivos RFB
│   │   ├── importer.py   # Importação para PostgreSQL
│   │   └── etl_tracker.py # Sistema de tracking e validação
│   └── config.py         # Configurações
├── static/
│   └── dashboard.html    # Dashboard visual em tempo real
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

### Tabelas de Controle ETL (Tracking)
- `execution_runs` - Rastreamento de cada execução do ETL
- `etl_tracking_files` - Rastreamento de cada arquivo processado
- `etl_tracking_chunks` - Rastreamento de chunks (processamento incremental)
- `etl_logs` - Logs estruturados do processo ETL

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
| GET | `/` | Dashboard visual |
| GET | `/dashboard` | Dashboard alternativo |
| GET | `/health` | Health check |
| GET | `/stats` | Estatísticas do banco |
| GET | `/cnpj/{cnpj}` | Consulta por CNPJ |
| GET | `/search` | Busca avançada com filtros |
| GET | `/cnpj/{cnpj}/socios` | Sócios da empresa |
| GET | `/cnaes` | Listar CNAEs |
| GET | `/municipios/{uf}` | Municípios por UF |
| WebSocket | `/ws` | Conexão tempo real |
| POST | `/etl/start` | Iniciar processo ETL |
| POST | `/etl/stop` | Parar processo ETL |
| GET | `/etl/status` | Status atual do ETL |
| POST | `/etl/config` | Atualizar configurações |
| GET | `/etl/database-stats` | Estatísticas do banco |

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

### 1. Acessar Dashboard
Abra seu navegador em: `http://localhost:5000` ou `http://seu-dominio:5000`

O dashboard permite:
- ✅ Iniciar/Parar ETL com um clique
- ✅ Configurar chunk_size e max_workers dinamicamente
- ✅ Ver progresso em tempo real
- ✅ Monitorar logs ao vivo
- ✅ Ver estatísticas de cada tabela
- ✅ Validação automática (CSV vs DB)

### 2. Importar Dados via Terminal (Alternativo)
```bash
python run_etl.py
```

### 3. API REST
API disponível em: http://0.0.0.0:5000

## 🎯 Funcionalidades Avançadas

### Sistema de Tracking Inteligente

O sistema garante:

1. **Idempotência**: 
   - Calcula hash SHA-256 de cada arquivo
   - Se arquivo já foi 100% processado (mesmo hash), pula automaticamente
   - Economiza tempo e recursos

2. **Recuperação Automática**:
   - Se o processamento parar no meio, continua de onde parou
   - Rastreamento por chunks (pedaços de 50k registros)
   - Não perde progresso

3. **Validação de Integridade**:
   - Conta linhas no CSV
   - Conta registros no banco de dados
   - Alerta se houver divergências
   - Registra tudo em tabelas de auditoria

4. **Logs Estruturados**:
   - Cada ação é registrada no banco
   - Timestamps completos
   - Correlação por execution_id
   - Consulta fácil via SQL

### Configurações Dinâmicas

Você pode ajustar em tempo real:

- **chunk_size**: Tamanho dos lotes (padrão: 50.000)
  - Máquina fraca: 10.000 - 25.000
  - Máquina média: 50.000 - 100.000  
  - Máquina potente: 100.000 - 500.000

- **max_workers**: Número de workers paralelos (padrão: 4)
  - CPU 2 cores: 2 workers
  - CPU 4 cores: 4 workers
  - CPU 8+ cores: 8-16 workers

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

- ✅ Schema do banco criado e otimizado
- ✅ Sistema ETL implementado com tracking robusto
- ✅ API REST funcionando
- ✅ Secrets configurados
- ✅ Workflow ativo
- ✅ Dashboard visual em tempo real
- ✅ Sistema de monitoramento via WebSocket
- ✅ Validação automática de integridade (CSV vs DB)
- ✅ Sistema de idempotência (não reprocessa arquivos completos)
- ✅ Validação e retry automático para arquivos ZIP corrompidos
- ✅ Tratamento inteligente de foreign keys faltantes
- ✅ Documentação completa para usuários não-técnicos
- ⏳ Dados não importados (aguardando execução do ETL)

## 🔧 Correções Recentes (Out/2025)

### Problema Identificado
1. **Foreign Keys Rígidas**: Banco rejeitava códigos descontinuados pela Receita (ex: código 36 de qualificação)
2. **Arquivos ZIP Corrompidos**: Downloads incompletos interrompiam todo o processo

### Soluções Implementadas
1. **Schema Flexível**: Removidas foreign keys rígidas, permitindo códigos inválidos (convertidos para NULL)
2. **Validação Inteligente**: Sistema valida foreign keys no código antes da inserção
3. **Retry Automático**: 3 tentativas automáticas de download para arquivos corrompidos
4. **Documentação Clara**: 
   - `LEIA_PRIMEIRO.txt` - Resumo executivo
   - `INSTRUCOES_MIGRACAO.md` - Guia passo a passo
   - `MIGRAR_BANCO.sql` - Script de migração one-time
5. **Mensagens Amigáveis**: Instruções claras sobre o que fazer em caso de erro

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
