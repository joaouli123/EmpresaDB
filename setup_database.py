#!/usr/bin/env python3
"""
Orquestrador de setup do banco CNPJ — reprodutível e idempotente.

Resolve os achados DB-01/DB-02/DB-03 (índices corretos, pg_trgm, materialized
view versionada) e o risco de "banco não recriável a partir do deploy".

Ordem recomendada para uma carga nova (rápida):
    1) python setup_database.py --stage core      # tabelas + extensões (antes do ETL)
    2) python setup_database.py --stage app       # schema clientes (users/stripe)
    3) python run_etl.py --skip-init              # importa os dados
    4) python setup_database.py --stage indexes   # índices (CONCURRENTLY) pós-carga
    5) python setup_database.py --stage matview    # materialized view + refresh

Conexão: usa --url ou a variável de ambiente DATABASE_URL.
"""
import os
import sys
import argparse
import logging
from pathlib import Path

import psycopg2

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger("setup_db")

BASE = Path(__file__).parent
SETUP_DIR = BASE / "src" / "database" / "setup"
DB_DIR = BASE / "src" / "database"


def get_url(arg_url: str | None) -> str:
    url = arg_url or os.getenv("DATABASE_URL")
    if not url:
        log.error("DATABASE_URL não definida (use --url ou a variável de ambiente).")
        sys.exit(2)
    return url


def run_block(url: str, sql: str, label: str):
    """Executa um bloco SQL inteiro numa transação."""
    conn = psycopg2.connect(url, connect_timeout=30)
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
        log.info("✅ %s", label)
    except Exception as e:
        conn.rollback()
        log.error("❌ %s: %s", label, e)
        raise
    finally:
        conn.close()


def run_statements_autocommit(url: str, sql: str, label: str):
    """Executa statement-a-statement em autocommit (necessário p/ CONCURRENTLY)."""
    # remove comentários de linha e divide em statements
    lines = [ln for ln in sql.splitlines() if not ln.strip().startswith("--")]
    statements = [s.strip() for s in "\n".join(lines).split(";") if s.strip()]
    conn = psycopg2.connect(url, connect_timeout=30)
    conn.autocommit = True
    ok = 0
    try:
        with conn.cursor() as cur:
            for st in statements:
                try:
                    cur.execute(st)
                    ok += 1
                except Exception as e:
                    log.warning("  ⚠️ statement falhou (segue): %s | %s", str(e).strip(), st[:80])
        log.info("✅ %s (%d/%d statements)", label, ok, len(statements))
    finally:
        conn.close()


def stage_core(url: str):
    run_block(url, (SETUP_DIR / "01_core_tables.sql").read_text(encoding="utf-8"),
              "Estágio CORE: extensões + tabelas")


def stage_app(url: str):
    # schema de clientes (auth, billing, stripe)
    run_block(url, "CREATE SCHEMA IF NOT EXISTS clientes;", "Schema 'clientes'")
    # Ordem importa: subscriptions cria a tabela plans; update_plans corrige os nomes
    # (free/start/growth/pro/enterprise) que casam com o rate_limiter (PLAN-03);
    # batch e email dependem de plans/stripe_subscriptions/monthly_usage (DB-Q02/Q03)
    for fname in ("users_schema.sql", "subscriptions_schema.sql", "update_plans.sql",
                  "stripe_schema.sql", "batch_queries_schema.sql", "email_tracking_schema.sql"):
        f = DB_DIR / fname
        if not f.exists():
            log.warning("  ⚠️ %s não encontrado, pulando", fname)
            continue
        try:
            run_block(url, f.read_text(encoding="utf-8"), f"App schema: {fname}")
        except Exception:
            log.warning("  ⚠️ %s falhou — pode depender de ordem; revisar depois", fname)


def stage_indexes(url: str):
    run_statements_autocommit(url, (SETUP_DIR / "02_indexes.sql").read_text(encoding="utf-8"),
                              "Estágio INDEXES (CONCURRENTLY)")


def stage_matview(url: str):
    run_block(url, (SETUP_DIR / "03_materialized_view.sql").read_text(encoding="utf-8"),
              "Estágio MATVIEW: materialized view + índices")


def verify(url: str):
    conn = psycopg2.connect(url, connect_timeout=30)
    with conn.cursor() as cur:
        cur.execute("""
            SELECT relname,
                   CASE relkind WHEN 'r' THEN 'tabela' WHEN 'm' THEN 'matview'
                                WHEN 'v' THEN 'view' ELSE relkind END,
                   reltuples::bigint
            FROM pg_class
            WHERE relnamespace = 'public'::regnamespace AND relkind IN ('r','m','v')
            ORDER BY relname
        """)
        print("\n=== Objetos em public ===")
        for name, kind, rows in cur.fetchall():
            print(f"  {kind:8} {name:35} ~{rows:,} linhas")
        cur.execute("SELECT extname FROM pg_extension ORDER BY extname")
        print("Extensões:", ", ".join(r[0] for r in cur.fetchall()))
        cur.execute("SELECT schema_name FROM information_schema.schemata WHERE schema_name='clientes'")
        print("Schema 'clientes':", "presente" if cur.fetchone() else "AUSENTE")
    conn.close()


def main():
    p = argparse.ArgumentParser(description="Setup do banco CNPJ")
    p.add_argument("--stage", choices=["core", "app", "indexes", "matview", "all", "verify"],
                   default="all", help="Estágio a executar (all = core+app)")
    p.add_argument("--url", help="DATABASE_URL (sobrepõe a variável de ambiente)")
    args = p.parse_args()
    url = get_url(args.url)

    if args.stage in ("core", "all"):
        stage_core(url)
    if args.stage in ("app", "all"):
        stage_app(url)
    if args.stage == "indexes":
        stage_indexes(url)
    if args.stage == "matview":
        stage_matview(url)
    if args.stage in ("all", "verify"):
        verify(url)


if __name__ == "__main__":
    main()
