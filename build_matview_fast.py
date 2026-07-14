#!/usr/bin/env python3
"""Cria a materialized view vw_estabelecimentos_completos (rota quente) de forma
robusta: keepalive + retry contra quedas do proxy, work_mem alto e paralelismo no
JOIN (24 vCPU). Depois constroi os indices da MV em paralelo (UNIQUE + GIN trigram).
Idempotente: DROP no inicio permite re-rodar."""
import os
import sys
import time
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

import psycopg2

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
log = logging.getLogger("mv")

URL = os.getenv("DATABASE_URL")
KAL = dict(keepalives=1, keepalives_idle=30, keepalives_interval=10, keepalives_count=5)
WMEM = os.getenv("WORK_MEM", "2GB")

MV_SQL = """
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname='vw_estabelecimentos_completos' AND relkind='m') THEN
    DROP MATERIALIZED VIEW vw_estabelecimentos_completos CASCADE;
  ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relname='vw_estabelecimentos_completos' AND relkind='v') THEN
    DROP VIEW vw_estabelecimentos_completos CASCADE;
  END IF;
END $$;
CREATE MATERIALIZED VIEW vw_estabelecimentos_completos AS
SELECT
    e.cnpj_completo, e.identificador_matriz_filial, emp.razao_social, e.nome_fantasia,
    e.situacao_cadastral, e.data_situacao_cadastral,
    msc.descricao AS motivo_situacao_cadastral_desc, e.data_inicio_atividade,
    e.cnae_fiscal_principal, e.cnae_fiscal_secundaria, cnae.descricao AS cnae_principal_desc,
    e.tipo_logradouro, e.logradouro, e.numero, e.complemento, e.bairro, e.cep, e.uf,
    mun.descricao AS municipio_desc, e.ddd_1, e.telefone_1, e.correio_eletronico,
    emp.natureza_juridica, nj.descricao AS natureza_juridica_desc, emp.porte_empresa,
    emp.capital_social, emp.ente_federativo_responsavel, sn.opcao_simples, sn.opcao_mei
FROM estabelecimentos e
INNER JOIN empresas emp ON e.cnpj_basico = emp.cnpj_basico
LEFT JOIN motivos_situacao_cadastral msc ON e.motivo_situacao_cadastral = msc.codigo
LEFT JOIN cnaes cnae ON e.cnae_fiscal_principal = cnae.codigo
LEFT JOIN municipios mun ON e.municipio = mun.codigo
LEFT JOIN naturezas_juridicas nj ON emp.natureza_juridica = nj.codigo
LEFT JOIN simples_nacional sn ON e.cnpj_basico = sn.cnpj_basico
WITH DATA;
"""

MV_INDEXES = [
    ("idx_mv_estab_cnpj_completo", "CREATE UNIQUE INDEX idx_mv_estab_cnpj_completo ON vw_estabelecimentos_completos (cnpj_completo)"),
    ("idx_mv_estab_razao_trgm", "CREATE INDEX idx_mv_estab_razao_trgm ON vw_estabelecimentos_completos USING gin (razao_social gin_trgm_ops)"),
    ("idx_mv_estab_fantasia_trgm", "CREATE INDEX idx_mv_estab_fantasia_trgm ON vw_estabelecimentos_completos USING gin (nome_fantasia gin_trgm_ops)"),
    ("idx_mv_estab_municipio_desc_trgm", "CREATE INDEX idx_mv_estab_municipio_desc_trgm ON vw_estabelecimentos_completos USING gin (municipio_desc gin_trgm_ops)"),
    ("idx_mv_estab_uf", "CREATE INDEX idx_mv_estab_uf ON vw_estabelecimentos_completos (uf)"),
    ("idx_mv_estab_situacao", "CREATE INDEX idx_mv_estab_situacao ON vw_estabelecimentos_completos (situacao_cadastral)"),
    ("idx_mv_estab_cnae", "CREATE INDEX idx_mv_estab_cnae ON vw_estabelecimentos_completos (cnae_fiscal_principal)"),
    # Composto p/ filtro regional (uf+situacao) com paginacao por cnpj: torna o
    # COUNT index-only e a busca ordenada instantaneos (evita o 502 por timeout).
    ("idx_mv_estab_uf_sit_cnpj", "CREATE INDEX idx_mv_estab_uf_sit_cnpj ON vw_estabelecimentos_completos (uf, situacao_cadastral, cnpj_completo)"),
]


def connect():
    return psycopg2.connect(URL, connect_timeout=30, **KAL)


def kill_mv_orphans():
    """Termina builds de MV orfaos (evita escritas paralelas que enchem o disco)."""
    try:
        conn = connect(); conn.autocommit = True; cur = conn.cursor()
        cur.execute("""SELECT pg_terminate_backend(pid) FROM pg_stat_activity
                       WHERE state <> 'idle' AND pid <> pg_backend_pid()
                       AND (query ILIKE '%MATERIALIZED VIEW%' OR query ILIKE '%vw_estabelecimentos%')""")
        n = len(cur.fetchall()); conn.close()
        if n:
            log.info("terminei %d backend(s) de MV orfaos", n)
            time.sleep(3)
    except Exception as e:
        log.warning("cleanup orfaos falhou: %s", str(e)[:80])


def create_mv():
    for attempt in range(1, 5):
        try:
            kill_mv_orphans()
            conn = connect(); conn.autocommit = True; cur = conn.cursor()
            cur.execute(f"SET work_mem = '{WMEM}'")
            cur.execute("SET maintenance_work_mem = '2GB'")
            cur.execute("SET max_parallel_workers_per_gather = 0")  # /dev/shm pequeno no Railway
            cur.execute("SET synchronous_commit = off")
            cur.execute("SET statement_timeout = 0")
            t = time.time()
            log.info("Criando materialized view (tentativa %d)...", attempt)
            cur.execute(MV_SQL)
            conn.close()
            log.info("MV criada em %.1f min.", (time.time() - t) / 60)
            return
        except Exception as e:
            log.warning("MV tentativa %d caiu: %s; retry...", attempt, str(e).strip()[:90])
            time.sleep(10 * attempt)
    raise RuntimeError("Falha ao criar a materialized view")


def kill_index_orphans(name):
    """Termina orfaos que estejam construindo ESTE indice (seguro p/ paralelo)."""
    try:
        conn = connect(); conn.autocommit = True; cur = conn.cursor()
        cur.execute("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state<>'idle' AND pid<>pg_backend_pid() AND query ILIKE %s", (f"%{name}%",))
        cur.fetchall(); conn.close(); time.sleep(2)
    except Exception:
        pass


def build_index(item):
    name, ddl = item
    for attempt in range(1, 6):
        try:
            kill_index_orphans(name)
            conn = connect(); conn.autocommit = True; cur = conn.cursor()
            cur.execute("SELECT indisvalid FROM pg_index ix JOIN pg_class c ON c.oid=ix.indexrelid WHERE c.relname=%s", (name,))
            row = cur.fetchone()
            if row and row[0]:
                conn.close(); return name, 0.0
            if row and not row[0]:
                cur.execute(f"DROP INDEX IF EXISTS {name}")
            cur.execute("SET maintenance_work_mem = '2GB'")
            cur.execute("SET synchronous_commit = off")
            cur.execute("SET statement_timeout = 0")
            t = time.time()
            cur.execute(ddl)
            conn.close()
            return name, time.time() - t
        except Exception as e:
            log.warning("  %s tentativa %d caiu: %s; retry...", name, attempt, str(e).strip()[:80])
            time.sleep(8 * attempt)
    raise RuntimeError(f"{name} falhou")


def main():
    if not URL:
        log.error("DATABASE_URL nao definida"); sys.exit(2)
    if not os.getenv("SKIP_MV"):
        create_mv()
    workers = int(os.getenv("IDX_WORKERS", "4"))
    log.info("Construindo %d indices da MV (%d workers)...", len(MV_INDEXES), workers)
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(build_index, it): it[0] for it in MV_INDEXES}
        done = 0
        for f in as_completed(futs):
            n, dt = f.result()
            done += 1
            log.info("  [%d/%d] %s OK (%.0fs)", done, len(MV_INDEXES), n, dt)
    # refresh de estatisticas
    conn = connect(); conn.autocommit = True; cur = conn.cursor()
    cur.execute("ANALYZE vw_estabelecimentos_completos")
    cur.execute("SELECT relkind, reltuples::bigint FROM pg_class WHERE relname='vw_estabelecimentos_completos'")
    k, n = cur.fetchone()
    conn.close()
    log.info("MATVIEW PRONTA em %.1f min. relkind=%s linhas=%d", (time.time() - t0) / 60, k, n)


if __name__ == "__main__":
    main()
