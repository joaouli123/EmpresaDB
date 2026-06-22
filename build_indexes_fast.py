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

# GINs trigram pesados primeiro (rodam em paralelo nos 4 workers), depois os b-tree
INDEXES = [
    ("idx_empresas_razao_trgm", "CREATE INDEX IF NOT EXISTS idx_empresas_razao_trgm ON empresas USING gin (razao_social gin_trgm_ops)"),
    ("idx_estab_nome_fantasia_trgm", "CREATE INDEX IF NOT EXISTS idx_estab_nome_fantasia_trgm ON estabelecimentos USING gin (nome_fantasia gin_trgm_ops)"),
    ("idx_estab_bairro_trgm", "CREATE INDEX IF NOT EXISTS idx_estab_bairro_trgm ON estabelecimentos USING gin (bairro gin_trgm_ops)"),
    ("idx_estab_logradouro_trgm", "CREATE INDEX IF NOT EXISTS idx_estab_logradouro_trgm ON estabelecimentos USING gin (logradouro gin_trgm_ops)"),
    ("idx_socios_nome_trgm", "CREATE INDEX IF NOT EXISTS idx_socios_nome_trgm ON socios USING gin (nome_socio gin_trgm_ops)"),
    ("idx_empresas_natureza", "CREATE INDEX IF NOT EXISTS idx_empresas_natureza ON empresas (natureza_juridica)"),
    ("idx_empresas_porte", "CREATE INDEX IF NOT EXISTS idx_empresas_porte ON empresas (porte_empresa)"),
    ("idx_estab_cnpj_completo", "CREATE INDEX IF NOT EXISTS idx_estab_cnpj_completo ON estabelecimentos (cnpj_completo)"),
    ("idx_estab_situacao", "CREATE INDEX IF NOT EXISTS idx_estab_situacao ON estabelecimentos (situacao_cadastral)"),
    ("idx_estab_uf", "CREATE INDEX IF NOT EXISTS idx_estab_uf ON estabelecimentos (uf)"),
    ("idx_estab_municipio", "CREATE INDEX IF NOT EXISTS idx_estab_municipio ON estabelecimentos (municipio)"),
    ("idx_estab_cnae_principal", "CREATE INDEX IF NOT EXISTS idx_estab_cnae_principal ON estabelecimentos (cnae_fiscal_principal)"),
    ("idx_estab_matriz_filial", "CREATE INDEX IF NOT EXISTS idx_estab_matriz_filial ON estabelecimentos (identificador_matriz_filial)"),
    ("idx_estab_cep", "CREATE INDEX IF NOT EXISTS idx_estab_cep ON estabelecimentos (cep)"),
    ("idx_estab_data_inicio", "CREATE INDEX IF NOT EXISTS idx_estab_data_inicio ON estabelecimentos (data_inicio_atividade)"),
    ("idx_estab_uf_situacao", "CREATE INDEX IF NOT EXISTS idx_estab_uf_situacao ON estabelecimentos (uf, situacao_cadastral)"),
    ("idx_socios_cnpj_basico", "CREATE INDEX IF NOT EXISTS idx_socios_cnpj_basico ON socios (cnpj_basico)"),
    ("idx_socios_cpf_cnpj", "CREATE INDEX IF NOT EXISTS idx_socios_cpf_cnpj ON socios (cnpj_cpf_socio)"),
    ("idx_socios_qualificacao", "CREATE INDEX IF NOT EXISTS idx_socios_qualificacao ON socios (qualificacao_socio)"),
    ("idx_simples_opcao", "CREATE INDEX IF NOT EXISTS idx_simples_opcao ON simples_nacional (opcao_simples)"),
    ("idx_simples_mei", "CREATE INDEX IF NOT EXISTS idx_simples_mei ON simples_nacional (opcao_mei)"),
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
    log.info("Indices CNPJ validos: %d de 21", cur.fetchone()[0])
    conn.close()


if __name__ == "__main__":
    main()
