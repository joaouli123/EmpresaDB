from __future__ import annotations

import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv


def run() -> None:
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL não encontrado no ambiente/.env")

    conn = psycopg2.connect(database_url, connect_timeout=15)
    conn.autocommit = True

    statements = [
        "CREATE EXTENSION IF NOT EXISTS pg_trgm",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estab_cnpj_completo ON estabelecimentos(cnpj_completo)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estab_cnpj_basico ON estabelecimentos(cnpj_basico)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estab_uf_situacao ON estabelecimentos(uf, situacao_cadastral)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estab_uf_municipio ON estabelecimentos(uf, municipio)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estab_uf_cnae ON estabelecimentos(uf, cnae_fiscal_principal)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estab_data_inicio ON estabelecimentos(data_inicio_atividade)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emp_cnpj_basico ON empresas(cnpj_basico)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emp_razao_social_btree ON empresas(razao_social)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emp_razao_social_trgm ON empresas USING gin(razao_social gin_trgm_ops)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_estab_nome_fantasia_trgm ON estabelecimentos USING gin(nome_fantasia gin_trgm_ops)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_socios_cnpj_basico ON socios(cnpj_basico)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_socios_nome_trgm ON socios USING gin(nome_socio gin_trgm_ops)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_socios_cpf_cnpj ON socios(cnpj_cpf_socio)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_key_active ON clientes.api_keys(key, is_active)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_created ON clientes.stripe_subscriptions(user_id, created_at DESC)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_period_status ON clientes.stripe_subscriptions(user_id, current_period_end, status)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monthly_usage_user_month ON clientes.monthly_usage(user_id, month_year)",
        "ANALYZE empresas",
        "ANALYZE estabelecimentos",
        "ANALYZE socios",
        "ANALYZE clientes.api_keys",
        "ANALYZE clientes.stripe_subscriptions",
        "ANALYZE clientes.monthly_usage",
    ]

    with conn.cursor() as cur:
        for stmt in statements:
            print(f"\n>> {stmt}")
            cur.execute(stmt)
            print("OK")

        cur.execute(
            """
            SELECT c.relname, c.relkind
            FROM pg_class c
            WHERE c.relname = 'vw_estabelecimentos_completos'
            """
        )
        vw_info = cur.fetchone()
        if vw_info:
            relname, relkind = vw_info
            kind_name = {
                "v": "VIEW",
                "m": "MATERIALIZED VIEW",
            }.get(relkind, relkind)
            print(f"\nVIEW_INFO: {relname} -> {kind_name}")

    conn.close()
    print("\n✅ Otimização concluída")


if __name__ == "__main__":
    run()
