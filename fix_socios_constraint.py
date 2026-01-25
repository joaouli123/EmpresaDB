import psycopg2
import time

print("🔍 Conectando ao banco de dados...")
try:
    conn = psycopg2.connect(
        host='72.61.217.143',
        port=5432,
        database='cnpj_db',
        user='cnpj_user',
        password='Proelast1608@'
    )
    cursor = conn.cursor()
    print("✅ Conectado com sucesso!")
    
    print("\n� Verificando quantidade de duplicatas...")
    cursor.execute("""
        SELECT COUNT(*) - COUNT(DISTINCT (cnpj_basico, identificador_socio, cnpj_cpf_socio))
        FROM socios
    """)
    duplicates = cursor.fetchone()[0]
    print(f"   ⚠️  Encontradas {duplicates:,} linhas duplicadas")
    
    if duplicates > 0:
        print("\n🗑️  Removendo duplicatas (mantendo registro mais recente por id)...")
        print("   ⏳ Isso pode demorar alguns minutos...")
        
        start_time = time.time()
        cursor.execute("""
            DELETE FROM socios
            WHERE id IN (
                SELECT id
                FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (
                               PARTITION BY cnpj_basico, identificador_socio, cnpj_cpf_socio
                               ORDER BY id DESC
                           ) as rn
                    FROM socios
                ) t
                WHERE rn > 1
            )
        """)
        deleted = cursor.rowcount
        conn.commit()
        elapsed = time.time() - start_time
        
        print(f"   ✅ Removidos {deleted:,} registros duplicados em {elapsed:.1f} segundos")
    else:
        print("   ✅ Nenhuma duplicata encontrada!")
    
    print("\n🔨 Criando constraint UNIQUE...")
    print("   ⏳ Criando índice UNIQUE em 26M+ registros...")
    
    start_time = time.time()
    cursor.execute("""
        ALTER TABLE socios 
        ADD CONSTRAINT socios_unique_key 
        UNIQUE (cnpj_basico, identificador_socio, cnpj_cpf_socio)
    """)
    conn.commit()
    elapsed = time.time() - start_time
    
    print(f"   ✅ Constraint criada em {elapsed:.1f} segundos!")
    
    print("\n✅ Verificando constraint final...")
    cursor.execute("""
        SELECT constraint_name, constraint_type 
        FROM information_schema.table_constraints 
        WHERE table_name = 'socios' AND constraint_type = 'UNIQUE'
    """)
    unique_constraints = cursor.fetchall()
    for name, ctype in unique_constraints:
        print(f"  ✓ {name} ({ctype})")
    
    print("\n🎉 Banco corrigido! O ETL de sócios agora funcionará.")
    print("\n💡 Agora você pode rodar o ETL novamente para importar os 20M de sócios!")
    
    cursor.close()
    conn.close()
    
except psycopg2.Error as e:
    print(f"\n❌ Erro no banco de dados: {e}")
except Exception as e:
    print(f"\n❌ Erro: {e}")
