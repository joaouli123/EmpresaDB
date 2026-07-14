# Tuning do Postgres no Railway — e o fix do `/dev/shm`

> Produção roda no **Railway** (Postgres 18), banco `railway`, serviço **Postgres**.
> A VPS antiga (`72.61.217.143`) foi **perdida** — ignore valores de "VPS 16GB" espalhados no repo.
> Fonte da verdade do tuning: [`scripts/db_tune.py`](scripts/db_tune.py). Aplique com ele.

---

## O incidente (2026-07)

A API `www.dbempresas.com.br` retornava **500** em buscas pesadas:

```
[prospeccao/buscar] dbempresas 500:
  {"detail":"could not resize shared memory segment \"/PostgreSQL.3473012370\"
   to 50438144 bytes: No space left on device"}
```

### Causa raiz — NÃO é falta de RAM

`50438144 bytes` = **48 MB**. Não é a RAM do servidor: é o **`/dev/shm`**, uma
partição *tmpfs* (~64 MB por padrão no container) que o Postgres usa **só em query
paralela** para a *DSM* (Dynamic Shared Memory — bitmap/hash/sort compartilhados).

O endpoint `POST /batch/search` monta filtros amplos (`razao_social ILIKE '%x%'`,
`cnae = ...`) sobre a matview **`vw_estabelecimentos_completos` (35 GB, ~72 M linhas)**.
Com paralelismo ligado, o plano aloca uma estrutura de dezenas de MB na DSM →
não cabe no `/dev/shm` → **crash**.

> ⚠️ **Aumentar a RAM do serviço NÃO corrige isso de forma confiável.** O `/dev/shm`
> continua pequeno. E no Railway a RAM é cobrada por uso — subir o teto só aumenta o risco de conta.

---

## O fix (já aplicado)

**Mover a DSM do `/dev/shm` (RAM) para o disco:**

```sql
ALTER SYSTEM SET dynamic_shared_memory_type = 'mmap';  -- << o fix. DSM em $PGDATA/pg_dynshmem (disco)
SELECT pg_reload_conf();
-- Railway → serviço Postgres → Deployments → Restart   (mmap só vale após restart)
```

Com `mmap`, a DSM vira arquivos em disco. O teto do `/dev/shm` **deixa de existir** →
o erro "No space left on device" fica **estruturalmente impossível**. Disco é barato e
**não conta como RAM**.

### Perfil completo aplicado (custo-consciente)

| Parâmetro | Valor | Por quê | Restart? |
|---|---|---|---|
| `dynamic_shared_memory_type` | **mmap** | 🔑 tira a DSM do `/dev/shm` | **sim** |
| `shared_buffers` | **512MB** | RAM **fixa** → enxuto (2GB ≈ 4× a conta) | **sim** |
| `effective_cache_size` | 3GB | só hint ao planner (RAM zero) | não |
| `work_mem` | **16MB** | por-nó × workers → baixo e previsível | não |
| `hash_mem_multiplier` | 2.0 | limita hash | não |
| `maintenance_work_mem` | 512MB | só no ETL/index build (transitório) | não |
| `max_parallel_workers_per_gather` | **2** | não multiplicar CPU/RAM por query | não |
| `max_parallel_workers` | 4 | teto global | não |
| `jit` | off | JIT atrapalha query OLTP curta | não |

---

## Custo — por que você NÃO vai à falência

O Railway cobra **RAM realmente usada por minuto**, não o teto configurado.

- **`shared_buffers` (512MB)** = a única RAM ~fixa. Baseline do banco ≈ 0,7 GB.
- **Por query pesada:** `work_mem (16MB) × ~poucos nós × (1 líder + 2 workers)` ≈ ~150 MB
  **transitórios**, liberados ao terminar. Uma consulta **não** usa "4 GB".
- **200 usuários/semana ≠ 200 simultâneos.** Espalhado em 7 dias, o pico real de
  concorrência é ~2–8. Ex.: 8 queries pesadas ao mesmo tempo ≈ 0,7 GB + 8×150 MB ≈ **~1,9 GB de pico**.

➡️ Um teto de **1–2 GB no Postgres é suficiente**. Com `mmap`, você **não precisa** de 4 GB —
pode baixar o teto e economizar. A API (`EmpresaDB`) tem RAM própria e **não** influencia este erro.

---

## Guard-rails (para não repetir)

1. **Nunca** rode paralelismo pesado com `dynamic_shared_memory_type = posix` no Railway.
   Sempre `mmap` (já fixado em `db_tune.py`).
2. **Não suba** `work_mem` / `max_parallel_workers_per_gather` "no olho" — cada aumento
   multiplica RAM e custo por query. Meça antes (`pg_stat_statements`).
3. Filtros de busca dependem de **índice**. `ILIKE '%x%'` (curinga à esquerda) faz
   *seq scan* de 72 M linhas — prefira `pg_trgm` / índice apropriado se virar gargalo.
4. Ao aplicar `db_tune.py`: rode → depois **Restart** do Postgres no painel (mmap +
   shared_buffers só valem após restart). Confirme com:
   ```sql
   SHOW dynamic_shared_memory_type;  -- deve ser: mmap
   ```

## Como aplicar / conferir

```bash
# do PC, apontando pro Postgres público do Railway:
railway run --service Postgres python scripts/db_tune.py
# depois: Railway → Postgres → Deployments → Restart
```
