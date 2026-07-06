#!/usr/bin/env python3
"""Aplica tuning de memoria/planner no Postgres do Railway.

Roda do SEU PC apontando pro banco de producao via DATABASE_URL
(a mesma DATABASE_PUBLIC_URL usada no ETL local).

  set DATABASE_URL=postgresql://...  &&  python scripts\\db_tune.py

shared_buffers so vale apos REINICIAR o servico Postgres no Railway;
os demais aplicam na hora (pg_reload_conf).
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
    # memoria — CUSTO-CONSCIENTE: Railway cobra RAM por USO.
    # 2GB de cache = maior parte do ganho (indices quentes cabem) sem inflar a conta.
    ("shared_buffers", "2GB"),              # requer restart
    ("effective_cache_size", "12GB"),       # so um HINT ao planner (nao usa RAM)
    ("work_mem", "32MB"),                   # sorts/bitmap heap scans
    ("maintenance_work_mem", "1GB"),        # index builds do ETL bem mais rapidos
    ("autovacuum_work_mem", "256MB"),       # limita cada worker de autovacuum
    # planner para SSD/NVMe
    ("random_page_cost", "1.1"),
    ("effective_io_concurrency", "200"),
    # paralelismo
    ("max_parallel_workers_per_gather", "4"),
    ("max_parallel_workers", "8"),
    ("max_parallel_maintenance_workers", "4"),
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
