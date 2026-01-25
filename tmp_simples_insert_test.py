import psycopg2
import pandas as pd
from io import StringIO
from pathlib import Path

csv_path = Path("downloads/F.K03200$W.SIMPLES.CSV.D60110")

conn = psycopg2.connect('postgresql://cnpj_user:Proelast1608%40@72.61.217.143:5432/cnpj_db')
cur = conn.cursor()

cur.execute("CREATE TEMP TABLE temp_simples_nacional (LIKE simples_nacional INCLUDING ALL)")

chunk = next(
    pd.read_csv(
        csv_path,
        sep=';',
        header=None,
        names=[
            'cnpj_basico', 'opcao_simples', 'data_opcao_simples',
            'data_exclusao_simples', 'opcao_mei', 'data_opcao_mei',
            'data_exclusao_mei'
        ],
        chunksize=1000,
        dtype=str,
        na_values=[''],
        keep_default_na=False
    )
)

for date_col in ['data_opcao_simples', 'data_exclusao_simples', 'data_opcao_mei', 'data_exclusao_mei']:
    chunk[date_col] = pd.to_datetime(chunk[date_col], format='%Y%m%d', errors='coerce')
    chunk[date_col] = chunk[date_col].dt.strftime('%Y-%m-%d')
    chunk[date_col] = chunk[date_col].replace('NaT', '')

output = StringIO()
chunk.to_csv(output, sep=';', header=False, index=False)
output.seek(0)

cur.copy_expert(
    "COPY temp_simples_nacional (cnpj_basico, opcao_simples, data_opcao_simples, data_exclusao_simples, opcao_mei, data_opcao_mei, data_exclusao_mei) FROM STDIN WITH CSV DELIMITER ';'",
    output,
)

cur.execute(
    "INSERT INTO simples_nacional SELECT * FROM temp_simples_nacional "
    "ON CONFLICT (cnpj_basico) DO UPDATE SET "
    "opcao_simples = EXCLUDED.opcao_simples, "
    "data_opcao_simples = EXCLUDED.data_opcao_simples, "
    "data_exclusao_simples = EXCLUDED.data_exclusao_simples, "
    "opcao_mei = EXCLUDED.opcao_mei, "
    "data_opcao_mei = EXCLUDED.data_opcao_mei, "
    "data_exclusao_mei = EXCLUDED.data_exclusao_mei"
)

print("rowcount:", cur.rowcount)
conn.commit()
cur.close()
conn.close()
