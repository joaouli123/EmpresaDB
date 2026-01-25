import psycopg2

# Conectar ao banco
conn = psycopg2.connect('postgresql://cnpj_user:Proelast1608%40@72.61.217.143:5432/cnpj_db')
cursor = conn.cursor()

print("🔍 Verificando constraints existentes...")
cursor.execute("""
    SELECT constraint_name, constraint_type 
    FROM information_schema.table_constraints 
    WHERE table_name = 'socios' AND table_schema = 'public'
""")
constraints = cursor.fetchall()
for constraint in constraints:
    print(f"  - {constraint[0]}: {constraint[1]}")

print("\n🔨 Removendo constraint antiga...")
cursor.execute('ALTER TABLE socios DROP CONSTRAINT IF EXISTS socios_cnpj_basico_identificador_socio_cnpj_cpf_socio_key CASCADE')

print("✨ Criando nova constraint UNIQUE...")
cursor.execute('ALTER TABLE socios ADD CONSTRAINT socios_unique_key UNIQUE (cnpj_basico, identificador_socio, cnpj_cpf_socio)')

conn.commit()

print("\n✅ Constraint criada com sucesso!")
cursor.execute("""
    SELECT constraint_name, constraint_type 
    FROM information_schema.table_constraints 
    WHERE table_name = 'socios' AND constraint_type = 'UNIQUE'
""")
unique_constraints = cursor.fetchall()
for constraint in unique_constraints:
    print(f"  ✓ {constraint[0]}: {constraint[1]}")

cursor.close()
conn.close()

print("\n🎉 Banco corrigido! O ETL de sócios agora funcionará.")
