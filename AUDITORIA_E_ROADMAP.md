# 🔍 Auditoria Técnica & Roadmap de Revenda/Escala — EmpresaDB (CNPJ SaaS)

> Auditoria multi-agente adversarial (73 agentes) sobre o código real.
> Stack: FastAPI + PostgreSQL (~138M registros) + Stripe + Redis + ETL.
> Objetivo: deixar o produto **pronto para revenda** e **escalável para milhares de consultas/dia**.
> Data: 2026-06-21.

## 🧭 Veredito de prontidão: **42/100**

O produto é **funcional e bem mais completo que a média** (billing, API keys, metering, ETL, cache, e-mail), mas **NÃO está pronto para revender com SLA nem para escalar como está**. Há **vazamento de receita**, **risco de LGPD** e **gargalos de escala** que precisam ser resolvidos antes de vender. A boa notícia: quase tudo é corrigível e várias correções são de baixo esforço/alto impacto.

> ⚠️ Importante: o banco antigo (VPS `72.61.217.143`) foi **perdido**, então **todas as otimizações que existiam só em produção sumiram**. Estamos reconstruindo do zero no Postgres novo do Railway — esta é a oportunidade de já nascer otimizado.

---

## 🔴 P0 — Bloqueadores de revenda (resolver ANTES de vender)

| # | Problema | Impacto | Esforço |
|---|---|---|---|
| **SEC-01** | Segredos LIVE em texto puro no `.env` (Stripe `sk_live`, senha do banco, Resend, reCAPTCHA, JWT) | Vazam em qualquer zip/backup/print → fraude financeira | **Rotacionar TUDO** (S) |
| **BILL-02** | `POST /subscriptions/subscribe/{id}` concede plano **Enterprise (1M consultas) de graça**, sem pagar Stripe | Qualquer usuário logado vira Enterprise grátis | S |
| **BILL-01 / SEC-02** | `/socios/search`, `/cnaes`, `/municipios` **públicos, sem login e sem metering** — e expõem **CPF de sócios** | Perda total de receita + **violação de LGPD** | S |
| **SEC-03** | `ENVIRONMENT` default = `development` → webhook Stripe aceita evento **sem validar assinatura** e CORS `*` liberado | Cobranças forjadas; config insegura "silenciosa" | S |
| **SEC-04** | API keys salvas e comparadas em **texto puro** no banco | Vazamento do banco = todas as chaves comprometidas | M |
| **SEC-05** | CORS `allow_origins=['*']` + `allow_credentials=True` | Config insegura/quebrada | S |
| **CQ-01** | Senha de produção hardcoded em ~8 scripts versionados (`test_*`, `fix_*`, `tmp_*`) + 2ª credencial Neon | Credenciais no histórico do git | S |

## 🟠 P1 — Escala & performance (o banco no centro)

| # | Problema | Impacto | Esforço |
|---|---|---|---|
| **ASYNC-01** | Handlers `async def` chamam `psycopg2` **bloqueante** → travam o event loop | **Mata o throughput** sob carga (1 query lenta congela todas) | M |
| **DB-01** | View `vw_estabelecimentos_completos` é **VIEW comum** (6 JOINs em 47M a cada consulta), não materializada, e não é recriada no deploy | Latência alta na rota quente; some a cada `init_db` | M |
| **DB-03** | Buscas `ILIKE '%texto%'` **sem índice trigram** (pg_trgm) | Full scan de milhões de linhas por busca por nome | M |
| **DB-02 / CQ-06** | 3 arquivos de índice conflitantes, com índices em **colunas que não existem** (scripts abortam) | Índices nunca aplicados; banco lento | M |
| **ASYNC-02 / DB-04** | Uvicorn com **1 worker só**; pool de 20 conexões + `SELECT 1` (pre-ping) a cada query | Usa 1 núcleo só; round-trip extra por request | S |
| **CACHE-01** | Mesmo com cache HIT, cada consulta faz **3–5 queries** (auth+metering) no Postgres | Cache não alivia o banco como deveria | M |
| **BILL-03** | Checagem de quota é "read-then-write" com **condição de corrida** | Cliente estoura o limite do plano | S |
| **DB-05** | Sem réplica de leitura, sem PgBouncer; ETL roda no mesmo banco/processo da API | Ponto único de falha; ETL degrada consultas | L |
| **CQ-02** | ETL pesado roda **dentro do processo da API** | Importação trava a API por horas | M |

## 🟡 P2 — Qualidade & manutenção (valor pro comprador)

- **CQ-03**: `DatabaseManager` triplicado (`connection.py` vivo, `connection_optimized.py` morto, stub em `config.py`) → unificar.
- **CQ-04**: 4 alvos de deploy conflitantes (Dockerfile/Procfile/nixpacks/.replit) com portas divergentes → uma fonte única.
- **CQ-05**: Dois sistemas de tracking de ETL com schemas incompatíveis + código morto.
- **CQ-07**: **Zero testes automatizados reais** → adicionar pytest + CI.
- **CQ-08**: Observabilidade fraca (health check raso, sem /metrics, sem lifespan/shutdown) → Sentry + Prometheus + lifespan.
- **CQ-09**: Higiene do repo (~23 scripts soltos, 26 `.md`, `__pycache__` versionado) → limpar.
- **BILL-06/07/09/10**: webhook não-idempotente em pacotes; dois sistemas de metering divergentes; isolamento multi-tenant frágil; inadimplência só por webhook.
- **CACHE-02/04/05/06**: rate limiter em memória (quebra com múltiplos workers); endpoints repetitivos sem cache; sem invalidação pós-ETL; Redis sem pool.
- **SEC-08..12**: blocklist SQL fraca; JWT sem refresh/revogação; enumeração de usuários; vazamento de `str(e)`; log de segurança não persiste (LGPD).
- **BILL-08**: planos/limites hardcoded → tornar data-driven (essencial para **white-label/revenda**).

---

## 🗄️ Plano de escala do banco (milhares de consultas/dia)

**Estratégia central:** o banco NÃO deve receber a maior parte das consultas — o **Redis** absorve o tráfego repetido, e o Postgres serve só o que é novo, já indexado e materializado.

1. **Estrutura nasce otimizada** (este reconstrução): tabelas + `pg_trgm`/`unaccent` + índices corretos (validados coluna-a-coluna) + **materialized view** com índice UNIQUE (`cnpj_completo`) e índices trigram → rota quente em milissegundos.
2. **Ordem de carga correta:** importar SEM índices secundários, criar os índices **depois** (`CREATE INDEX CONCURRENTLY`) → importação muito mais rápida.
3. **Refresh agendado** da materialized view pós-ETL (`REFRESH ... CONCURRENTLY`) — não recriar a view a cada deploy.
4. **App assíncrono de verdade:** tirar o `psycopg2` bloqueante do event loop (threadpool agora, `asyncpg` depois) + **Gunicorn com múltiplos workers**.
5. **Pool consciente:** 1 pool por worker, dimensionado < `max_connections`; remover o `SELECT 1` por request; **PgBouncer** quando o tráfego crescer.
6. **Cache na frente de tudo:** consulta quente, tabelas de domínio (cnaes/municipios) e auth/plano do usuário cacheados no Redis; rate limit e metering no Redis (atômicos, compartilhados entre workers).
7. **Quando escalar mais:** réplica de leitura para os SELECTs (99% do tráfego é leitura), deixando o primário para ETL/escrita.
8. **Backups automáticos LIGADOS** desde o dia 0 (você já perdeu o banco uma vez — inegociável).

---

## ✅ Ordem de execução (em andamento)

- [ ] **Fase 0 — Fundação do banco (EM ANDAMENTO):** schema corrigido + extensões + estrutura otimizada aplicada no Postgres novo.
- [ ] **Fase 1 — Importação:** ETL reaproveitando os 32 GB já baixados → índices pós-import → materialized view.
- [ ] **Fase 2 — Repontar o app:** `DATABASE_URL` do app → Postgres interno do Railway + criar admin.
- [ ] **Fase 3 — P0 de segurança/receita:** rotacionar segredos, auth nos endpoints abertos, fim do bypass de plano, CORS, hash de API key.
- [ ] **Fase 4 — Escala:** Redis provisionado + cache na rota quente, async/threadpool, Gunicorn workers, pool/timeout.
- [ ] **Fase 5 — Qualidade:** dedupe de código, testes (pytest+CI), observabilidade, limpeza do repo.
