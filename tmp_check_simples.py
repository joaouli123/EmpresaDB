import psycopg2
import pandas as pd
from pathlib import Path

conn = psycopg2.connect('postgresql://cnpj_user:Proelast1608%40@72.61.217.143:5432/cnpj_db')
cur = conn.cursor()

cur.execute(
    "SELECT column_name, data_type, is_nullable "
    "FROM information_schema.columns "
    "WHERE table_schema=%s AND table_name=%s "
    "ORDER BY ordinal_position",
    ("public", "simples_nacional"),
)
print(cur.fetchall())

cur.execute(
    "SELECT conname, contype "
    "FROM pg_constraint "
    "WHERE conrelid='public.simples_nacional'::regclass"
)
print(cur.fetchall())

cur.execute("SELECT COUNT(*) FROM public.simples_nacional")
print("simples_nacional count:", cur.fetchone()[0])

cur.execute("SELECT COUNT(*) FROM public.empresas")
print("empresas count:", cur.fetchone()[0])

cur.execute(
    "SELECT e.cnpj_basico FROM public.empresas e ORDER BY e.cnpj_basico LIMIT 5"
)
print("empresas sample:", cur.fetchall())

simples_path = Path("downloads/F.K03200$W.SIMPLES.CSV.D60110")
if simples_path.exists():
    chunk = next(
        pd.read_csv(
            simples_path,
            sep=';',
            header=None,
            names=[
                'cnpj_basico', 'opcao_simples', 'data_opcao_simples',
                'data_exclusao_simples', 'opcao_mei', 'data_opcao_mei',
                'data_exclusao_mei'
            ],
            chunksize=5,
            dtype=str,
            na_values=[''],
            keep_default_na=False
        )
    )
    print("simples sample shape:", chunk.shape)
    print("simples sample row0:", chunk.iloc[0].to_dict())

    cur = conn.cursor()
    cur.execute(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_schema=%s AND table_name=%s ORDER BY ordinal_position",
        ("public", "etl_tracking_files"),
    )
    tracking_cols = [row[0] for row in cur.fetchall()]
    print("etl_tracking_files columns:", tracking_cols)

    cur.execute(
        "SELECT id, file_name, status, total_csv_lines, total_imported_records, error_message, discrepancy_details, finished_at "
        "FROM etl_tracking_files "
        "WHERE file_name ILIKE %s "
        "ORDER BY created_at DESC LIMIT 3",
        ('%SIMPLES%',),
    )
    simples_tracking = cur.fetchall()
    print("etl_tracking_files simples:", simples_tracking)
    if simples_tracking:
        simples_id = simples_tracking[0][0]
        cur.execute(
            "SELECT status, records_processed, error_message, id "
            "FROM etl_tracking_chunks "
            "WHERE file_tracking_id=%s "
            "ORDER BY id DESC LIMIT 5",
            (simples_id,),
        )
        print("etl_tracking_chunks simples:", cur.fetchall())
    cur.close()

    cur = conn.cursor()
    cur.execute(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_schema=%s AND table_name=%s ORDER BY ordinal_position",
        ("public", "etl_logs"),
    )
    etl_log_cols = [row[0] for row in cur.fetchall()]
    print("etl_logs columns:", etl_log_cols)

    cur.execute(
        "SELECT log_level, message, details, id "
        "FROM etl_logs "
        "WHERE message ILIKE %s "
        "ORDER BY id DESC LIMIT 5",
        ('%Simples%',),
    )
    print("etl_logs simples:", cur.fetchall())
    cur.close()

cur.close()
conn.close()
