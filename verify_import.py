#!/usr/bin/env python3
"""
Pente-fino do banco CNPJ: confere se os dados entraram CORRETOS e COMPLETOS.

Verificações:
  1. Contagem de linhas por tabela + faixa esperada (sanidade)
  2. (--lines) Contagem de linhas dos CSVs de origem vs banco (completude real)
  3. Integridade de FK: estabelecimentos/socios/simples sem empresa-mãe (órfãos)
  4. Sanidade de datas e nulos
  5. Consulta CNPJ ponta-a-ponta (empresa + estabelecimento + simples + sócios)
  6. Checagem da materialized view (se existir)

Uso:
  DATABASE_URL=... python verify_import.py            # rápido
  DATABASE_URL=... python verify_import.py --lines    # + conta linhas dos 30GB de CSV
"""
import os
import sys
import argparse
import logging
from pathlib import Path

import psycopg2

logging.basicConfig(level=logging.INFO, format='%(message)s')
log = logging.getLogger("verify")

DOWNLOADS = Path(__file__).parent / "downloads"

# faixas esperadas (sanidade — base CNPJ da Receita)
EXPECTED = {
    "empresas":          (45_000_000, 70_000_000),
    "estabelecimentos":  (50_000_000, 75_000_000),
    "socios":            (20_000_000, 35_000_000),
    "simples_nacional":  (35_000_000, 60_000_000),
    "cnaes":             (1_300, 1_400),
    "municipios":        (5_500, 5_600),
}
GLOBS = {
    "empresas": "*.EMPRECSV",
    "estabelecimentos": "*.ESTABELE",
    "socios": "*.SOCIOCSV",
    "simples_nacional": "*SIMPLES.CSV*",
}

ok = True


def fail(msg):
    global ok
    ok = False
    log.error("  ❌ %s", msg)


def count_csv_lines(glob):
    total = 0
    for f in DOWNLOADS.glob(glob):
        with open(f, "rb") as fh:
            total += sum(buf.count(b"\n") for buf in iter(lambda: fh.read(8 * 1024 * 1024), b""))
    return total


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--lines", action="store_true", help="contar linhas dos CSVs (lê ~30GB, lento)")
    args = p.parse_args()
    url = os.getenv("DATABASE_URL")
    if not url:
        log.error("DATABASE_URL não definida."); sys.exit(2)

    conn = psycopg2.connect(url, connect_timeout=30)
    cur = conn.cursor()

    log.info("\n" + "=" * 64)
    log.info("PENTE-FINO DO BANCO CNPJ")
    log.info("=" * 64)

    # 1) contagens + sanidade
    log.info("\n[1] Contagem de linhas por tabela")
    counts = {}
    for t, (lo, hi) in EXPECTED.items():
        cur.execute(f"SELECT count(*) FROM {t}")
        n = cur.fetchone()[0]
        counts[t] = n
        status = "✅" if lo <= n <= hi else "⚠️"
        if not (lo <= n <= hi):
            fail(f"{t}: {n:,} fora da faixa esperada ({lo:,}–{hi:,})")
        log.info("  %s %-20s %15s", status, t, f"{n:,}")

    # 2) completude vs CSV
    if args.lines:
        log.info("\n[2] Linhas no CSV de origem vs banco (completude)")
        for t, glob in GLOBS.items():
            csv_lines = count_csv_lines(glob)
            db = counts[t]
            diff = csv_lines - db
            pct = (db / csv_lines * 100) if csv_lines else 0
            status = "✅" if abs(diff) <= max(50, csv_lines * 0.001) else "⚠️"
            if status == "⚠️":
                fail(f"{t}: CSV={csv_lines:,} vs banco={db:,} (faltam {diff:,})")
            log.info("  %s %-20s CSV=%15s  banco=%15s  (%.3f%%)", status, t, f"{csv_lines:,}", f"{db:,}", pct)
    else:
        log.info("\n[2] (use --lines para comparar com os CSVs de origem)")

    # 3) integridade de FK (órfãos)
    log.info("\n[3] Integridade referencial (órfãos sem empresa-mãe)")
    for t in ("estabelecimentos", "socios", "simples_nacional"):
        cur.execute(f"""
            SELECT count(*) FROM {t} x
            WHERE NOT EXISTS (SELECT 1 FROM empresas e WHERE e.cnpj_basico = x.cnpj_basico)
        """)
        orf = cur.fetchone()[0]
        if orf > 0:
            fail(f"{t}: {orf:,} linhas órfãs (cnpj_basico sem empresa)")
        log.info("  %s %-20s órfãos: %s", "✅" if orf == 0 else "❌", t, f"{orf:,}")

    # 4) sanidade de datas/nulos
    log.info("\n[4] Sanidade de datas")
    cur.execute("SELECT min(data_inicio_atividade), max(data_inicio_atividade) FROM estabelecimentos WHERE data_inicio_atividade IS NOT NULL")
    dmin, dmax = cur.fetchone()
    log.info("  data_inicio_atividade: %s → %s", dmin, dmax)
    if dmax and dmax.year > 2027:
        fail(f"data futura suspeita: {dmax}")

    # 5) consulta CNPJ ponta-a-ponta
    log.info("\n[5] Consulta CNPJ ponta-a-ponta")
    cur.execute("""
        SELECT e.cnpj_completo, emp.razao_social, e.uf, e.situacao_cadastral
        FROM estabelecimentos e JOIN empresas emp ON emp.cnpj_basico = e.cnpj_basico
        WHERE e.identificador_matriz_filial = '1' LIMIT 1
    """)
    row = cur.fetchone()
    if not row:
        fail("nenhum estabelecimento matriz encontrado")
    else:
        cnpj = row[0]
        log.info("  CNPJ exemplo: %s | %s | %s", cnpj, row[1], row[2])
        cur.execute("SELECT count(*) FROM socios WHERE cnpj_basico = %s", (cnpj[:8],))
        log.info("  sócios desse CNPJ: %s", cur.fetchone()[0])
        cur.execute("SELECT opcao_simples FROM simples_nacional WHERE cnpj_basico = %s", (cnpj[:8],))
        sn = cur.fetchone()
        log.info("  no Simples? %s", sn[0] if sn else "não consta")

    # 6) materialized view
    log.info("\n[6] Materialized view da rota quente")
    cur.execute("SELECT relkind FROM pg_class WHERE relname = 'vw_estabelecimentos_completos'")
    mv = cur.fetchone()
    if not mv:
        log.info("  ⏳ ainda não criada (rodar: setup_database.py --stage matview)")
    elif mv[0] == 'm':
        cur.execute("SELECT count(*) FROM vw_estabelecimentos_completos")
        log.info("  ✅ materializada com %s linhas", f"{cur.fetchone()[0]:,}")
    else:
        fail("vw_estabelecimentos_completos existe mas NÃO é materializada (relkind=%s)" % mv[0])

    cur.close(); conn.close()
    log.info("\n" + "=" * 64)
    log.info("RESULTADO: %s", "✅ TUDO OK" if ok else "⚠️ HÁ PROBLEMAS (ver acima)")
    log.info("=" * 64)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
