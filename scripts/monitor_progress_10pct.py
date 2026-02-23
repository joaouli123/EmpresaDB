from __future__ import annotations

import os
import time
from datetime import datetime

import psycopg2
from dotenv import load_dotenv


def now_str() -> str:
    return datetime.now().strftime("%H:%M:%S")


def main() -> None:
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL não encontrado")

    print(f"[{now_str()}] Monitor iniciado (avisos a cada 10%)")
    last_bucket = -1

    while True:
        try:
            conn = psycopg2.connect(database_url, connect_timeout=10)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT phase, blocks_done, blocks_total
                    FROM pg_stat_progress_create_index
                    LIMIT 1
                    """
                )
                row = cur.fetchone()

                if not row:
                    print(f"[{now_str()}] ✅ Sem CREATE INDEX em progresso. Concluído.")
                    conn.close()
                    break

                phase, blocks_done, blocks_total = row
                pct = 0.0
                if blocks_total and blocks_total > 0:
                    pct = (blocks_done / blocks_total) * 100

                bucket = int(pct // 10) * 10
                if bucket > last_bucket:
                    print(
                        f"[{now_str()}] Progresso: {bucket}% | fase={phase} | {blocks_done}/{blocks_total}"
                    )
                    last_bucket = bucket

            conn.close()
        except Exception as exc:
            print(f"[{now_str()}] ⚠️ Erro ao monitorar: {exc}")

        time.sleep(20)


if __name__ == "__main__":
    main()
