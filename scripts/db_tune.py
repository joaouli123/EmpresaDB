#!/usr/bin/env python3
"""Aplica tuning de memoria/planner no Postgres do Railway.

Roda do SEU PC apontando pro banco de producao via DATABASE_URL
(a mesma DATABASE_PUBLIC_URL usada no ETL local).

  set DATABASE_URL=postgresql://...  &&  python scripts\\db_tune.py

RESTART obrigatorio: dynamic_shared_memory_type e shared_buffers so valem
apos REINICIAR o servico Postgres no Railway (painel -> Postgres -> Deployments
-> Restart, ~30-60s). Os demais aplicam na hora (pg_reload_conf).

============================================================================
!! LEIA ISTO ANTES DE MEXER NOS VALORES  (incidente 2026-07) !!
----------------------------------------------------------------------------
Erro: "could not resize shared memory segment ... No space left on device"
  -> NAO e falta de RAM. E o /dev/shm (tmpfs ~64MB do container) estourando
     quando a query PARALELA aloca a area dinamica (DSM) da matview de 72M linhas.
  -> Aumentar a RAM do servico NAO resolve isso de forma confiavel.

Fix definitivo (ja aplicado): dynamic_shared_memory_type = mmap
  -> move a DSM da RAM (/dev/shm) para DISCO ($PGDATA/pg_dynshmem).
     O teto do /dev/shm deixa de existir. Disco e barato; nao conta como RAM.

Custo (Railway cobra RAM USADA por minuto, nao o teto configurado):
  - shared_buffers e RAM FIXA -> manter enxuto (512MB). 2GB = ~4x a conta.
  - work_mem e por-no-de-query x workers -> manter baixo (16MB) e previsivel.
  - parallel alto multiplica CPU/RAM por query -> manter em 2.
Perfil abaixo = custo baixo + previsivel para ~200 usuarios/semana.
Ver POSTGRES_RAILWAY_TUNING.md para o racional completo.
============================================================================
"""
import os
import sys
import psycopg2

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

DBURL = os.environ.get("DATABASE_URL") or os.environ.get("DBURL")
if not DBURL:
    print("ERRO: defina DATABASE_URL (DATABASE_PUBLIC_URL do Postgres no Railway)")
    sys.exit(2)

conn = psycopg2.connect(DBURL.strip(), connect_timeout=30)
conn.autocommit = True
cur = conn.cursor()

SETTINGS = [
    # >>> FIX DO /dev/shm — NAO REMOVER <<< (requer restart)
    # mmap = DSM em disco, nao no /dev/shm. Elimina o "No space left on device".
    ("dynamic_shared_memory_type", "mmap"),
    # memoria — CUSTO-CONSCIENTE: Railway cobra RAM USADA por minuto.
    ("shared_buffers", "512MB"),            # requer restart. RAM FIXA -> enxuto de proposito.
    ("effective_cache_size", "3GB"),        # so um HINT ao planner (nao usa RAM)
    ("work_mem", "16MB"),                   # por-no x workers -> baixo e previsivel
    ("hash_mem_multiplier", "2.0"),
    ("maintenance_work_mem", "512MB"),      # so no ETL/index build (transitorio)
    ("autovacuum_work_mem", "256MB"),       # limita cada worker de autovacuum
    # planner para SSD/NVMe
    ("random_page_cost", "1.1"),
    ("effective_io_concurrency", "200"),
    # paralelismo — baixo p/ nao multiplicar CPU/RAM (=custo) por query.
    # Com mmap, 2 e seguro; NAO subir sem necessidade real.
    ("max_parallel_workers_per_gather", "2"),
    ("max_parallel_workers", "4"),
    ("max_worker_processes", "4"),
    ("max_parallel_maintenance_workers", "2"),
    # latencia OLTP: JIT atrapalha queries curtas
    ("jit", "off"),
    # ETL gera muito WAL — checkpoints mais suaves
    ("max_wal_size", "8GB"),
    ("checkpoint_completion_target", "0.9"),
    ("wal_compression", "lz4"),
    # observabilidade
    ("track_io_timing", "on"),
    ("pg_stat_statements.track", "top"),
]

for name, val in SETTINGS:
    try:
        cur.execute(f"ALTER SYSTEM SET {name} = %s", (val,))
        print(f"  OK  {name} = {val}")
    except Exception as e:
        print(f"  ERRO {name}: {str(e)[:120]}")

try:
    cur.execute("CREATE EXTENSION IF NOT EXISTS pg_stat_statements")
    print("  OK  extensao pg_stat_statements criada")
except Exception as e:
    print(f"  ERRO extensao: {str(e)[:120]}")

cur.execute("SELECT pg_reload_conf()")
print("\nConfig recarregada. shared_buffers so aplica apos RESTART do servico Postgres no Railway.")
