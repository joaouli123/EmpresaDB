from __future__ import annotations

import os

import psycopg2
from dotenv import load_dotenv


def main() -> None:
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL não encontrado")

    conn = psycopg2.connect(database_url, connect_timeout=10)
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT pid, state, wait_event_type, wait_event
            FROM pg_stat_activity
            WHERE query ILIKE '%CREATE MATERIALIZED VIEW vw_estabelecimentos_completos_mv_new%'
              AND state <> 'idle'
            """
        )
        rows = cur.fetchall()
        print(f"active_mv_build={len(rows)}")
        for row in rows:
            print(row)

    conn.close()


if __name__ == "__main__":
    main()
