# 🏢 API CNPJ Brasil - Consulta Completa de Dados Empresariais

Sistema completo de consulta de dados públicos da Receita Federal do Brasil (RFB) com mais de **55 milhões de estabelecimentos** e **26,5 milhões de sócios** cadastrados.

## 📊 Base de Dados Atualizada

- ✅ **55+ milhões** de estabelecimentos
- ✅ **52+ milhões** de empresas  
- ✅ **26,5 milhões** de sócios
- ✅ **1.300+** CNAEs (atividades econômicas)
- ✅ **5.500+** municípios

## 🚀 Características

- 🔍 **Busca instantânea** por CNPJ completo
- 🎯 **Filtros avançados** (razão social, UF, município, CNAE, porte, etc.)
- 👥 **Consulta de sócios** com cache inteligente
- ⚡ **Performance otimizada** com índices PostgreSQL
- 🔐 **Autenticação** via API Keys
- 📈 **Monitoramento** de uso em tempo real
- 💳 **Sistema de assinaturas** com planos mensais

## 🎯 Uso

### Consultar Sócios de uma Empresa

```bash
curl -H "X-API-Key: sua-chave-aqui" \
  http://localhost:5000/api/v1/cnpj/00000000000191/socios
```

**Resposta**:
```json
[
  {
    "cnpj_basico": "00000000",
    "identificador_socio": "2",
    "nome_socio": "JOÃO DA SILVA",
    "cnpj_cpf_socio": "***123456**",
    "qualificacao_socio": "49",
    "data_entrada_sociedade": "2020-01-15"
  }
]
```

**Notas importantes**:
- ✅ Base de dados com 26,5 milhões de sócios
- ✅ Cache inteligente de 30 minutos
- ✅ Limite de 1.000 sócios por consulta (otimização)
- ✅ Índices otimizados para busca rápida

### Executar ETL Completo

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

## 📡 Endpoints Principais

### Autenticação
- `POST /auth/register` - Criar conta
- `POST /auth/login` - Login
- `GET /auth/me` - Perfil atual

### CNPJ
- `GET /api/v1/cnpj/{cnpj}` - Buscar por CNPJ
- `GET /api/v1/search` - Busca avançada
- `GET /api/v1/cnpj/{cnpj}/socios` - Sócios da empresa
- `GET /api/v1/stats` - Estatísticas do banco

### Gerenciamento
- `GET /profile` - Perfil do usuário
- `POST /api-keys` - Gerar API Key
- `GET /api-keys` - Listar chaves
- `DELETE /api-keys/{id}` - Revogar chave

## 💾 Tecnologias

- **Backend**: Python 3.11+ (FastAPI, Uvicorn)
- **Banco de Dados**: PostgreSQL 16+ (externo na VPS)
- **Frontend**: React + Vite
- **ETL**: Pandas, psycopg2
- **Cache**: In-memory (dict + TTL)

## 🔧 Configuração

1. Clone o repositório
2. Configure as variáveis de ambiente (`.env`)
3. Instale dependências: `pip install -r requirements.txt`
4. Execute o ETL: `python run_etl.py`
5. Inicie a API: `python main.py`

## 📈 Performance

- **Consulta por CNPJ**: ~50ms (com cache)
- **Busca avançada**: ~200-500ms
- **Sócios**: ~100-300ms (primeira consulta), ~10ms (cache)
- **Throughput**: ~1.000 req/s

## 🔐 Segurança

- Autenticação obrigatória via API Key
- Limites de taxa por plano
- Schema separado para dados de clientes
- Logs de auditoria completos

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação completa em `/docs` ou abra uma issue.

---

**Dados públicos fornecidos pela Receita Federal do Brasil**