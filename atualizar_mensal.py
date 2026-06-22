#!/usr/bin/env python3
"""
Atualização MENSAL automática dos dados CNPJ (Receita Federal — SERPRO+).

A Receita publica uma pasta nova AAAA-MM/ todo mês (snapshot completo).
Este script:
  1. Detecta a pasta mais recente no repositório SERPRO+
  2. Se houver mês novo (ou --force): baixa os 37 .zip, extrai
  3. Dropa índices secundários + materialized view (recarga fica rápida)
  4. Recarrega tudo via COPY (run_import_fast.py — truncate + reload)
  5. Reconstrói índices + materialized view
  6. Verifica (verify_import.py)
  7. Marca o mês importado em public.etl_import_state

Idempotente: se o banco já está no mês mais recente, não faz nada.

Uso:
  DATABASE_URL=postgresql://... python atualizar_mensal.py
  DATABASE_URL=... python atualizar_mensal.py --force   # reimporta mesmo sem mês novo
"""
import os
import sys
import zipfile
import logging
import argparse
import subprocess
from pathlib import Path

import psycopg2

sys.path.append(str(Path(__file__).parent))
from src.etl.downloader_serpro import SerproDownloader

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("atualizar")

BASE = Path(__file__).parent
DOWNLOADS = BASE / "downloads"
PY = sys.executable

DROP_INDEXES_SQL = """
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT indexname FROM pg_indexes
    WHERE schemaname='public'
      AND tablename IN ('empresas','estabelecimentos','socios','simples_nacional')
      AND indexname LIKE 'idx_%'
  LOOP
    EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.indexname);
  END LOOP;
END $$;
DROP MATERIALIZED VIEW IF EXISTS vw_estabelecimentos_completos CASCADE;
"""


def get_conn():
    url = os.getenv("DATABASE_URL")
    if not url:
        log.error("DATABASE_URL não definida."); sys.exit(2)
    return psycopg2.connect(url, connect_timeout=30)


def last_imported_month(conn) -> str:
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS public.etl_import_state (
            id int PRIMARY KEY DEFAULT 1,
            month text,
            imported_at timestamptz DEFAULT now(),
            CHECK (id = 1)
        )
    """)
    conn.commit()
    cur.execute("SELECT month FROM public.etl_import_state WHERE id = 1")
    r = cur.fetchone()
    return r[0] if r else None


def mark_month(conn, month: str):
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO public.etl_import_state (id, month, imported_at)
        VALUES (1, %s, now())
        ON CONFLICT (id) DO UPDATE SET month = EXCLUDED.month, imported_at = now()
    """, (month,))
    conn.commit()


def extract_all(zip_paths):
    for zp in zip_paths:
        zp = Path(zp)
        if zipfile.is_zipfile(zp):
            with zipfile.ZipFile(zp) as z:
                z.extractall(DOWNLOADS)
            log.info("  extraído: %s", zp.name)


def run(cmd):
    log.info("→ %s", " ".join(cmd))
    subprocess.run(cmd, check=True, cwd=str(BASE), env={**os.environ})


# Todos os arquivos da Receita (zips + CSVs extraídos) — removidos após importar
RFB_PATTERNS = [
    "*.zip", "*.EMPRECSV", "*.ESTABELE", "*.SOCIOCSV", "*.CNAECSV",
    "*.MOTICSV", "*.MUNICCSV", "*.NATJUCSV", "*.PAISCSV", "*.QUALSCSV", "*SIMPLES.CSV*",
]


def cleanup(patterns):
    """Apaga arquivos da pasta downloads que já foram importados (libera disco)."""
    removed, freed = 0, 0
    for pat in patterns:
        for f in DOWNLOADS.glob(pat):
            try:
                freed += f.stat().st_size
                f.unlink()
                removed += 1
            except Exception as e:
                log.warning("  não removeu %s: %s", f.name, e)
    log.info("  🧹 removidos %d arquivos (%.1f GB liberados)", removed, freed / 1e9)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--force", action="store_true", help="reimporta mesmo sem mês novo")
    p.add_argument("--skip-download", action="store_true", help="usa os arquivos já baixados")
    p.add_argument("--keep-files", action="store_true", help="NÃO apagar os CSVs/zips após importar")
    args = p.parse_args()

    conn = get_conn()
    last = last_imported_month(conn)

    d = SerproDownloader(download_dir=str(DOWNLOADS))
    latest = d.get_latest_folder()
    log.info("Mês no banco: %s | Mês mais recente na Receita: %s", last, latest)

    if latest == last and not args.force:
        log.info("✅ Banco já está atualizado (%s). Nada a fazer.", latest)
        return

    if not args.skip_download:
        log.info("⬇️  Baixando pasta %s...", latest)
        res = d.download_latest()
        log.info("Extraindo %d arquivos...", len(res["files"]))
        extract_all(res["files"])
        if not args.keep_files:
            cleanup(["*.zip"])  # zips não são mais necessários após extrair

    log.info("🧹 Dropando índices + materialized view para recarga rápida...")
    cur = conn.cursor(); cur.execute(DROP_INDEXES_SQL); conn.commit()

    run([PY, "run_import_fast.py"])               # truncate + reload (todos os tipos)
    run([PY, "setup_database.py", "--stage", "indexes"])
    run([PY, "setup_database.py", "--stage", "matview"])
    run([PY, "verify_import.py"])

    if not args.keep_files:
        log.info("Liberando disco (CSVs já importados)...")
        cleanup(RFB_PATTERNS)

    # CACHE-02: invalida o Redis para não servir dado stale após a recarga
    try:
        from src.api.cache_redis import cache as redis_cache
        total = 0
        for pat in ("cnpj_api:*", "cnpj:*", "socios:*", "cnaes:*", "municipios:*", "search:*"):
            total += redis_cache.delete_pattern(pat)
        log.info("Cache Redis invalidado (%s chaves)", total)
    except Exception as e:
        log.warning("Não invalidou o cache Redis: %s", str(e)[:80])

    mark_month(conn, latest)
    conn.close()
    log.info("✅ Atualização do mês %s concluída, verificada, cache invalidado e disco limpo.", latest)


if __name__ == "__main__":
    main()
