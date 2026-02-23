from __future__ import annotations

import os

import psycopg2
from dotenv import load_dotenv


MV_BUILD_NAME = "vw_estabelecimentos_completos_mv_new"
MV_FINAL_NAME = "vw_estabelecimentos_completos"
LEGACY_VIEW_NAME = "vw_estabelecimentos_completos_legacy_view"


CREATE_MV_SQL = f"""
CREATE MATERIALIZED VIEW {MV_BUILD_NAME} AS
SELECT
    e.cnpj_completo,
    e.identificador_matriz_filial,
    emp.razao_social,
    e.nome_fantasia,
    e.situacao_cadastral,
    e.data_situacao_cadastral,
    msc.descricao AS motivo_situacao_cadastral_desc,
    e.data_inicio_atividade,
    e.cnae_fiscal_principal,
    e.cnae_fiscal_secundaria,
    cnae.descricao AS cnae_principal_desc,
    e.tipo_logradouro,
    e.logradouro,
    e.numero,
    e.complemento,
    e.bairro,
    e.cep,
    e.uf,
    mun.descricao AS municipio_desc,
    e.ddd_1,
    e.telefone_1,
    e.correio_eletronico,
    emp.natureza_juridica,
    nj.descricao AS natureza_juridica_desc,
    emp.porte_empresa,
    emp.capital_social,
    sn.opcao_simples,
    sn.opcao_mei
FROM estabelecimentos e
INNER JOIN empresas emp ON e.cnpj_basico = emp.cnpj_basico
LEFT JOIN motivos_situacao_cadastral msc ON e.motivo_situacao_cadastral = msc.codigo
LEFT JOIN cnaes cnae ON e.cnae_fiscal_principal = cnae.codigo
LEFT JOIN municipios mun ON e.municipio = mun.codigo
LEFT JOIN naturezas_juridicas nj ON emp.natureza_juridica = nj.codigo
LEFT JOIN simples_nacional sn ON e.cnpj_basico = sn.cnpj_basico
"""


def run() -> None:
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL não encontrado no ambiente/.env")

    conn = psycopg2.connect(database_url, connect_timeout=15)
    conn.autocommit = True

    with conn.cursor() as cur:
        cur.execute("SET max_parallel_workers_per_gather = 0")
        cur.execute("SET work_mem = '16MB'")

        cur.execute("SELECT relkind FROM pg_class WHERE relname = %s", (MV_FINAL_NAME,))
        rel = cur.fetchone()
        relkind = rel[0] if rel else None
        print(f"Objeto atual {MV_FINAL_NAME}: {relkind}")

        if relkind == "m":
            print("Já é materialized view. Executando apenas REFRESH + ANALYZE.")
            cur.execute(f"REFRESH MATERIALIZED VIEW {MV_FINAL_NAME}")
            cur.execute(f"ANALYZE {MV_FINAL_NAME}")
            print("✅ Refresh concluído")
            conn.close()
            return

        print("Criando materialized view de build...")
        cur.execute(f"DROP MATERIALIZED VIEW IF EXISTS {MV_BUILD_NAME}")
        cur.execute(CREATE_MV_SQL)
        print("✅ Materialized view de build criada")

        index_statements = [
            f"CREATE UNIQUE INDEX idx_{MV_BUILD_NAME}_cnpj ON {MV_BUILD_NAME}(cnpj_completo)",
            f"CREATE INDEX idx_{MV_BUILD_NAME}_uf_situacao ON {MV_BUILD_NAME}(uf, situacao_cadastral)",
            f"CREATE INDEX idx_{MV_BUILD_NAME}_uf_municipio ON {MV_BUILD_NAME}(uf, municipio_desc)",
            f"CREATE INDEX idx_{MV_BUILD_NAME}_cnae ON {MV_BUILD_NAME}(cnae_fiscal_principal)",
            f"CREATE INDEX idx_{MV_BUILD_NAME}_porte ON {MV_BUILD_NAME}(porte_empresa)",
            f"CREATE INDEX idx_{MV_BUILD_NAME}_razao_trgm ON {MV_BUILD_NAME} USING gin(razao_social gin_trgm_ops)",
            f"CREATE INDEX idx_{MV_BUILD_NAME}_fantasia_trgm ON {MV_BUILD_NAME} USING gin(nome_fantasia gin_trgm_ops)",
        ]

        for stmt in index_statements:
            print(f"{stmt}")
            cur.execute(stmt)
        cur.execute(f"ANALYZE {MV_BUILD_NAME}")
        print("✅ Índices criados e ANALYZE executado")

        print("Iniciando swap de nomes...")
        cur.execute(
            "SELECT relkind FROM pg_class WHERE relname = %s",
            (LEGACY_VIEW_NAME,),
        )
        legacy_exists = cur.fetchone()
        if legacy_exists:
            cur.execute(f"DROP VIEW IF EXISTS {LEGACY_VIEW_NAME}")
            cur.execute(f"DROP MATERIALIZED VIEW IF EXISTS {LEGACY_VIEW_NAME}")

        cur.execute(f"ALTER VIEW {MV_FINAL_NAME} RENAME TO {LEGACY_VIEW_NAME}")
        cur.execute(f"ALTER MATERIALIZED VIEW {MV_BUILD_NAME} RENAME TO {MV_FINAL_NAME}")
        print("✅ Swap concluído")

        cur.execute(
            "SELECT relkind FROM pg_class WHERE relname = %s",
            (MV_FINAL_NAME,),
        )
        final_kind = cur.fetchone()
        print(f"Tipo final: {final_kind[0] if final_kind else 'N/A'}")

    conn.close()
    print("\n✅ Migração para materialized view concluída")


if __name__ == "__main__":
    run()
