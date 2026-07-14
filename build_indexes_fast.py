#!/usr/bin/env python3
"""Constroi os indices secundarios em PARALELO (varias conexoes), sem CONCURRENTLY
e com maintenance_work_mem alto. Usado na carga inicial (sem trafego), e bem mais
rapido que setup_database.py --stage indexes. Idempotente (IF NOT EXISTS)."""
import os
import sys
import time
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

import psycopg2

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
log = logging.getLogger("idx")

URL = os.getenv("DATABASE_URL")
WORKERS = int(os.getenv("IDX_WORKERS", "4"))
MWM = os.getenv("MAINT_MEM", "512MB")

# ============================================================================
# APENAS os indices das TABELAS-BASE realmente usados por endpoints (2026-07).
# A BUSCA roda toda na matview vw_estabelecimentos_completos (indices dela sao
# criados em build_matview_fast.py). Estes 3 servem lookups de DETALHE nas bases:
#   - idx_estab_cnpj_completo : /cnaes-secundarios (WHERE cnpj_completo=...)
#   - idx_socios_nome_trgm    : /socios/search (nome_socio ILIKE)
#   - idx_socios_cpf_cnpj     : /socios/search (cnpj_cpf_socio LIKE 'x%')
# Os ~18 indices antigos foram DROPADOS (liberou ~14GB) por estarem com idx_scan=0
# — a busca nao usa as tabelas-base. NAO re-adicionar sem confirmar uso real
# (idx GIN em 72M linhas = GBs de storage + horas de rebuild no ETL).
# ============================================================================
INDEXES = [
    ("idx_socios_nome_trgm", "CREATE INDEX IF NOT EXISTS idx_socios_nome_trgm ON socios USING gin (nome_socio gin_trgm_ops)"),
    ("idx_estab_cnpj_completo", "CREATE INDEX IF NOT EXISTS idx_estab_cnpj_completo ON estabelecimentos (cnpj_completo)"),
    ("idx_socios_cpf_cnpj", "CREATE INDEX IF NOT EXISTS idx_socios_cpf_cnpj ON socios (cnpj_cpf_socio)"),
]


KAL = dict(keepalives=1, keepalives_idle=30, keepalives_interval=10, keepalives_count=5)


def connect():
    return psycopg2.connect(URL, connect_timeout=30, **KAL)


def cleanup_server():
    """Termina builds de indice orfaos no servidor e dropa indices invalidos."""
    conn = connect(); conn.autocommit = True; cur = conn.cursor()
    cur.execute("""SELECT pg_terminate_backend(pid) FROM pg_stat_activity
                   WHERE state <> 'idle' AND pid <> pg_backend_pid() AND query ILIKE '%INDEX%'""")
    time.sleep(2)
    cur.execute("""SELECT c.relname FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
                   WHERE NOT i.indisvalid AND c.relnamespace = 'public'::regnamespace""")
    for (b,) in cur.fetchall():
        log.info("dropando indice invalido: %s", b)
        cur.execute(f"DROP INDEX IF EXISTS {b}")
    conn.close()


def build(item):
    name, ddl = item
    last = None
    for attempt in range(1, 6):
        try:
            conn = connect(); conn.autocommit = True; cur = conn.cursor()
            cur.execute("SELECT indisvalid FROM pg_index ix JOIN pg_class c ON c.oid=ix.indexrelid WHERE c.relname=%s", (name,))
            row = cur.fetchone()
            if row and row[0]:
                conn.close(); return name, 0.0  # ja valido, pula
            if row and not row[0]:
                cur.execute(f"DROP INDEX IF EXISTS {name}")  # invalido de tentativa anterior
            cur.execute(f"SET maintenance_work_mem = '{MWM}'")
            cur.execute("SET max_parallel_maintenance_workers = 2")
            cur.execute("SET synchronous_commit = off")
            cur.execute("SET statement_timeout = 0")
            t = time.time()
            cur.execute(ddl)
            conn.close()
            return name, time.time() - t
        except Exception as e:
            last = str(e).strip()[:90]
            log.warning("  %s tentativa %d caiu (%s), retry...", name, attempt, last)
            time.sleep(8 * attempt)
    raise RuntimeError(f"{name} falhou apos retries: {last}")


def main():
    if not URL:
        log.error("DATABASE_URL nao definida"); sys.exit(2)
    log.info("Limpando orfaos e indices invalidos no servidor...")
    cleanup_server()
    log.info("Construindo %d indices com %d workers (mem=%s)...", len(INDEXES), WORKERS, MWM)
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(build, it): it[0] for it in INDEXES}
        done = 0
        for f in as_completed(futs):
            name = futs[f]
            try:
                n, dt = f.result()
                done += 1
                log.info("  [%d/%d] %s OK (%.0fs)", done, len(INDEXES), n, dt)
            except Exception as e:
                log.error("  FALHA %s: %s", name, str(e)[:140])
    log.info("INDICES CONCLUIDOS em %.1f min.", (time.time() - t0) / 60)
    conn = connect(); cur = conn.cursor()
    cur.execute("""SELECT count(*) FROM pg_index ix JOIN pg_class i ON i.oid=ix.indexrelid
                   JOIN pg_class t ON t.oid=ix.indrelid WHERE ix.indisvalid AND i.relname LIKE 'idx_%'
                   AND t.relname IN ('empresas','estabelecimentos','socios','simples_nacional')""")
    log.info("Indices base validos: %d (esperado >= %d)", cur.fetchone()[0], len(INDEXES))
    conn.close()


if __name__ == "__main__":
    main()
