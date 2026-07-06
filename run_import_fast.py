#!/usr/bin/env python3
"""
Carregador RÁPIDO dos dados CNPJ via COPY bruto + transformação em SQL.
10-50x mais rápido que o ETL em pandas: sem processamento linha-a-linha em Python.

Fluxo por arquivo:
  CSV (latin1, ';') --COPY--> tabela TEMP (tudo texto) --INSERT/SELECT--> tabela final
  com conversão de datas (AAAAMMDD) e decimais (vírgula) feita em SQL (set-based).

Pré-requisitos:
  - Tabelas criadas: python setup_database.py --stage all
  - Auxiliares já importadas (cnaes, municipios, ...)
  - CSVs extraídos em ./downloads
  - DATABASE_URL no ambiente.

Uso:
  DATABASE_URL=postgresql://... python run_import_fast.py
  DATABASE_URL=... python run_import_fast.py --only simples_nacional   # validar um tipo
  DATABASE_URL=... python run_import_fast.py --suffix _new             # carga em STAGING

Modo STAGING (--suffix _new):
  Cria empresas_new, estabelecimentos_new, socios_new e simples_nacional_new
  do zero (DROP IF EXISTS + DDL canônico de 01_core_tables.sql com nomes
  sufixados) e carrega NELAS. NÃO toca nas tabelas de produção em nada:
  sem TRUNCATE, sem DROP/ADD de FK na produção. O swap atômico é feito
  depois pelo atualizar_mensal.py.
"""
import os
import re
import sys
import time
import argparse
import logging
from pathlib import Path

import psycopg2

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger("import_fast")

DOWNLOADS = Path(__file__).parent / "downloads"
CORE_DDL = Path(__file__).parent / "src" / "database" / "setup" / "01_core_tables.sql"


class _NullStripReader:
    """Remove bytes NUL (0x00) do stream durante o COPY.
    Alguns CSVs da Receita contêm lixo 0x00 que o Postgres rejeita
    (campos de texto não podem conter NUL). Demais bytes seguem em LATIN1."""

    def __init__(self, fh):
        self.fh = fh

    def read(self, size=-1):
        data = self.fh.read(size)
        if data and b"\x00" in data:
            data = data.replace(b"\x00", b"")
        return data

    def readline(self, size=-1):
        line = self.fh.readline(size)
        if line and b"\x00" in line:
            line = line.replace(b"\x00", b"")
        return line

# (tipo, glob, tabela_temp, ddl_temp, tabela_final, lista_colunas_final, select_transform, conflito)
SPECS = {
    "empresas": {
        "glob": "*.EMPRECSV",
        "stg": "emp_stg",
        "stg_cols": 7,
        "target": "empresas",
        "cols": "cnpj_basico, razao_social, natureza_juridica, qualificacao_responsavel, capital_social, porte_empresa, ente_federativo_responsavel",
        "select": "c1, NULLIF(c2,''), NULLIF(c3,''), NULLIF(c4,''), rfb_num(c5), NULLIF(c6,''), NULLIF(c7,'')",
        "conflict": "(cnpj_basico)",
    },
    "estabelecimentos": {
        "glob": "*.ESTABELE",
        "stg": "estab_stg",
        "stg_cols": 30,
        "target": "estabelecimentos",
        "cols": ("cnpj_basico, cnpj_ordem, cnpj_dv, identificador_matriz_filial, nome_fantasia, "
                 "situacao_cadastral, data_situacao_cadastral, motivo_situacao_cadastral, nome_cidade_exterior, "
                 "pais, data_inicio_atividade, cnae_fiscal_principal, cnae_fiscal_secundaria, tipo_logradouro, "
                 "logradouro, numero, complemento, bairro, cep, uf, municipio, ddd_1, telefone_1, ddd_2, "
                 "telefone_2, ddd_fax, fax, correio_eletronico, situacao_especial, data_situacao_especial"),
        "select": ("c1, c2, c3, NULLIF(c4,''), NULLIF(c5,''), NULLIF(c6,''), rfb_date(c7), NULLIF(c8,''), "
                   "NULLIF(c9,''), NULLIF(c10,''), rfb_date(c11), NULLIF(c12,''), NULLIF(c13,''), NULLIF(c14,''), "
                   "NULLIF(c15,''), NULLIF(c16,''), NULLIF(c17,''), NULLIF(c18,''), NULLIF(c19,''), NULLIF(c20,''), "
                   "NULLIF(c21,''), NULLIF(c22,''), NULLIF(c23,''), NULLIF(c24,''), NULLIF(c25,''), NULLIF(c26,''), "
                   "NULLIF(c27,''), NULLIF(c28,''), NULLIF(c29,''), rfb_date(c30)"),
        "conflict": "(cnpj_basico, cnpj_ordem, cnpj_dv)",
    },
    "socios": {
        "glob": "*.SOCIOCSV",
        "stg": "soc_stg",
        "stg_cols": 11,
        "target": "socios",
        "cols": ("cnpj_basico, identificador_socio, nome_socio, cnpj_cpf_socio, qualificacao_socio, "
                 "data_entrada_sociedade, pais, representante_legal, nome_representante, qualificacao_representante, faixa_etaria"),
        "select": ("c1, NULLIF(c2,''), NULLIF(c3,''), NULLIF(c4,''), NULLIF(c5,''), rfb_date(c6), NULLIF(c7,''), "
                   "NULLIF(c8,''), NULLIF(c9,''), NULLIF(c10,''), NULLIF(c11,'')"),
        "conflict": "(cnpj_basico, identificador_socio, cnpj_cpf_socio)",
    },
    "simples_nacional": {
        "glob": "*SIMPLES.CSV*",
        "stg": "simp_stg",
        "stg_cols": 7,
        "target": "simples_nacional",
        "cols": "cnpj_basico, opcao_simples, data_opcao_simples, data_exclusao_simples, opcao_mei, data_opcao_mei, data_exclusao_mei",
        "select": "c1, NULLIF(c2,''), rfb_date(c3), rfb_date(c4), NULLIF(c5,''), rfb_date(c6), rfb_date(c7)",
        "conflict": "(cnpj_basico)",
    },
}

ORDER = ["empresas", "estabelecimentos", "socios", "simples_nacional"]

HELPERS_SQL = """
CREATE OR REPLACE FUNCTION rfb_date(s text) RETURNS date AS $$
  SELECT CASE WHEN s ~ '^[0-9]{8}$' AND s <> '00000000' THEN to_date(s,'YYYYMMDD') ELSE NULL END
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION rfb_num(s text) RETURNS numeric AS $$
  SELECT NULLIF(replace(s, ',', '.'), '')::numeric
$$ LANGUAGE sql IMMUTABLE;
"""

FK_TABLES = ["estabelecimentos", "socios", "simples_nacional"]


def drop_fks_sql(suffix: str = "") -> str:
    """DROP das FKs antes da carga (acelera COPY/INSERT).
    Com suffix, os nomes são os auto-gerados nas tabelas _new
    ({tabela}{suffix}_cnpj_basico_fkey) — produção intocada."""
    return "\n".join(
        f"ALTER TABLE {t}{suffix} DROP CONSTRAINT IF EXISTS {t}{suffix}_cnpj_basico_fkey;"
        for t in FK_TABLES
    )


def readd_fks_sql(suffix: str = "") -> str:
    """Readiciona FKs como NOT VALID. Com suffix, nomes sufixados
    ({tabela}{suffix}_cnpj_basico_fkey) apontando para empresas{suffix};
    o swap do atualizar_mensal.py renomeia para o nome canônico."""
    return "\n".join(
        f"ALTER TABLE {t}{suffix} ADD CONSTRAINT {t}{suffix}_cnpj_basico_fkey\n"
        f"  FOREIGN KEY (cnpj_basico) REFERENCES empresas{suffix}(cnpj_basico) NOT VALID;"
        for t in FK_TABLES
    )


def validate_suffix(suffix: str) -> str:
    """Sufixo é interpolado em SQL — restringe a identificador seguro (_new, _stg...)."""
    if not re.fullmatch(r"_[a-z][a-z0-9_]*", suffix):
        log.error("--suffix inválido: %r (use algo como '_new')", suffix)
        sys.exit(2)
    return suffix


def apply_suffix_to_ddl(sql: str, suffix: str) -> str:
    """Renomeia as 4 tabelas núcleo no DDL canônico (01_core_tables.sql).
    \\b usa '_' como caractere de palavra, então nomes compostos como
    'qualificacoes_socios' e 'vw_estabelecimentos_completos' NÃO são tocados;
    as auxiliares (cnaes, municipios, ...) permanecem com o nome original."""
    return re.sub(r"\b(empresas|estabelecimentos|socios|simples_nacional)\b",
                  lambda m: m.group(1) + suffix, sql)


def create_staging_tables(conn, suffix: str, types):
    """Cria as tabelas de staging do zero a partir do DDL CANÔNICO
    (01_core_tables.sql) com os nomes sufixados.

    Por que o DDL canônico e não CREATE TABLE (LIKE ...)?
      - Fidelidade garantida de colunas/tipos/coluna gerada (cnpj_completo)
        com a única fonte de verdade do schema;
      - LIKE ... INCLUDING DEFAULTS copiaria o DEFAULT nextval() apontando
        para a MESMA sequence de produção (socios_id_seq) — o DROP da tabela
        antiga no swap derrubaria o DEFAULT da tabela nova. Com o DDL
        canônico, o SERIAL cria uma sequence própria (socios{suffix}_id_seq),
        renomeada no swap.

    O DDL usa IF NOT EXISTS, então os CREATEs das auxiliares e extensões
    são no-ops inofensivos. PK/UNIQUE/FK sem nome recebem nomes auto-gerados
    já sufixados ({tabela}{suffix}_pkey etc.), sem colisão com a produção."""
    ddl = apply_suffix_to_ddl(CORE_DDL.read_text(encoding="utf-8"), suffix)
    cur = conn.cursor()
    # remove sobras de uma execução anterior que falhou no meio
    cur.execute(f"DROP MATERIALIZED VIEW IF EXISTS vw_estabelecimentos_completos{suffix} CASCADE")
    for t in types:
        cur.execute(f"DROP TABLE IF EXISTS {SPECS[t]['target']}{suffix} CASCADE")
    cur.execute(ddl)
    conn.commit()
    cur.close()
    log.info("Tabelas de staging criadas do zero (sufixo %s): %s",
             suffix, ", ".join(SPECS[t]["target"] + suffix for t in types))


def make_stg_ddl(name, ncols):
    cols = ", ".join(f"c{i} text" for i in range(1, ncols + 1))
    return f"CREATE TEMP TABLE IF NOT EXISTS {name} ({cols})"


def load_type(conn, type_name, files, suffix=""):
    spec = SPECS[type_name]
    target = spec["target"] + suffix
    cur = conn.cursor()
    cur.execute(make_stg_ddl(spec["stg"], spec["stg_cols"]))
    conn.commit()

    total = 0
    for fpath in files:
        t0 = time.time()
        cur.execute(f"TRUNCATE {spec['stg']}")
        copy_sql = (f"COPY {spec['stg']} FROM STDIN WITH "
                    f"(FORMAT csv, DELIMITER ';', QUOTE '\"', ENCODING 'LATIN1')")
        with open(fpath, "rb") as fh:
            cur.copy_expert(copy_sql, _NullStripReader(fh))
        cur.execute(f"SELECT count(*) FROM {spec['stg']}")
        staged = cur.fetchone()[0]
        cur.execute(
            f"INSERT INTO {target} ({spec['cols']}) "
            f"SELECT {spec['select']} FROM {spec['stg']} "
            f"ON CONFLICT {spec['conflict']} DO NOTHING"
        )
        inserted = cur.rowcount
        conn.commit()
        total += inserted
        dt = time.time() - t0
        rate = int(staged / dt) if dt else 0
        log.info("  [%s] %s: %s linhas, %s inseridas em %.1fs (%s linhas/s)",
                 type_name, Path(fpath).name, f"{staged:,}", f"{inserted:,}", dt, f"{rate:,}")
    cur.close()
    return total


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--only", help="tipos separados por vírgula (ex.: empresas,socios)")
    p.add_argument("--keep", action="store_true", help="NÃO truncar as tabelas antes (append)")
    p.add_argument("--suffix", default="",
                   help="carga em staging: cria e carrega tabelas {nome}{suffix} "
                        "(ex.: _new) SEM tocar na produção")
    args = p.parse_args()

    url = os.getenv("DATABASE_URL")
    if not url:
        log.error("DATABASE_URL não definida."); sys.exit(2)

    suffix = validate_suffix(args.suffix) if args.suffix else ""
    types = ORDER if not args.only else [t.strip() for t in args.only.split(",")]

    conn = psycopg2.connect(url, connect_timeout=30)
    cur = conn.cursor()
    # Otimizações de carga em massa
    cur.execute("SET synchronous_commit = off")
    cur.execute("SET work_mem = '256MB'")
    cur.execute("SET maintenance_work_mem = '512MB'")
    conn.commit()

    cur.execute(HELPERS_SQL); conn.commit()
    log.info("Funções auxiliares rfb_date/rfb_num criadas.")

    if suffix:
        # STAGING: tabelas novas do zero; produção 100% intocada
        create_staging_tables(conn, suffix, types)

    cur.execute(drop_fks_sql(suffix)); conn.commit()
    log.info("FKs removidas para acelerar a carga%s.",
             f" (staging {suffix})" if suffix else "")

    if not args.keep:
        # com suffix as tabelas acabaram de ser criadas — TRUNCATE é no-op
        # inofensivo (mantido para reexecuções com --only/--keep)
        for t in types:
            cur.execute(f"TRUNCATE {SPECS[t]['target']}{suffix} CASCADE")
        conn.commit()
        log.info("Tabelas-alvo truncadas: %s",
                 ", ".join(SPECS[t]["target"] + suffix for t in types))

    grand = time.time()
    for t in types:
        files = sorted(str(f) for f in DOWNLOADS.glob(SPECS[t]["glob"]))
        if not files:
            log.warning("Nenhum arquivo p/ %s (%s)", t, SPECS[t]["glob"]); continue
        log.info("=== %s: %d arquivo(s) ===", t.upper(), len(files))
        n = load_type(conn, t, files, suffix)
        log.info("=== %s concluído: %s linhas ===", t, f"{n:,}")

    # Re-adiciona FKs como NOT VALID (documenta relação sem revalidar tudo)
    try:
        cur.execute(readd_fks_sql(suffix)); conn.commit()
        log.info("FKs readicionadas (NOT VALID)%s.",
                 f" com nomes sufixados {suffix}" if suffix else "")
    except Exception as e:
        conn.rollback()
        log.warning("Não foi possível readicionar FKs agora: %s", e)

    for t in types:
        cur.execute(f"ANALYZE {SPECS[t]['target']}{suffix}")
    conn.commit()
    cur.close(); conn.close()
    log.info("CARGA RÁPIDA COMPLETA em %.1f min.", (time.time() - grand) / 60)


if __name__ == "__main__":
    main()
