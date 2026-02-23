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
            SELECT pid, datname, phase, blocks_done, blocks_total, tuples_done, tuples_total
            FROM pg_stat_progress_create_index
            """
        )
        progress_rows = cur.fetchall()
        print(f"progress_rows={len(progress_rows)}")
        for row in progress_rows:
            print(row)

        cur.execute(
            """
            SELECT state, wait_event_type, wait_event
            FROM pg_stat_activity
            WHERE query ILIKE '%idx_emp_razao_social_trgm%'
              AND state != 'idle'
            """
        )
        active_rows = cur.fetchall()
        print(f"activity_rows={len(active_rows)}")
        for row in active_rows:
            print(row)

    conn.close()


if __name__ == "__main__":
    main()
