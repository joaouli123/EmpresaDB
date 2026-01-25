import psycopg2

conn = psycopg2.connect('postgresql://cnpj_user:Proelast1608%40@72.61.217.143:5432/cnpj_db')
cursor = conn.cursor()

print("✅ Constraints UNIQUE na tabela socios:")
cursor.execute("""
    SELECT constraint_name, constraint_type 
    FROM information_schema.table_constraints 
    WHERE table_name = 'socios' AND constraint_type = 'UNIQUE'
""")

constraints = cursor.fetchall()
if constraints:
    for row in constraints:
        print(f"  ✓ {row[0]}: {row[1]}")
else:
    print("  ❌ Nenhuma constraint UNIQUE encontrada!")

conn.close()
