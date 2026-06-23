import os, psycopg2, sys

dsn = os.environ.get('DATABASE_URL')
if not dsn:
    print('startup_migration: DATABASE_URL nao definida, pulando...')
    sys.exit(0)

try:
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()
    with open('scripts/fix_trigram_indexes.sql', 'r') as f:
        cur.execute(f.read())
    for notice in conn.notices:
        print(f'startup_migration: {notice.strip()}')
    cur.close()
    conn.close()
    print('startup_migration: OK')
except Exception as e:
    print(f'startup_migration: ERRO (nao-critico): {e}')
