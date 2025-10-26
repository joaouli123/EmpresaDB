
#!/usr/bin/env python3
"""
Teste específico para filtro de data_inicio_atividade
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def conectar():
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL não encontrada!")
        return None
    return psycopg2.connect(database_url)

def main():
    conn = conectar()
    if not conn:
        return
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Desabilitar parallel workers
        cursor.execute("SET max_parallel_workers_per_gather = 0")
        
        print("\n" + "="*80)
        print("🔍 TESTE: Filtro de Data Início Atividade")
        print("="*80)
        
        # Teste 1: Buscar com datas específicas (CORRETO)
        from datetime import date
        data_min = date(2025, 9, 1)  # Converter string para date
        data_max = date(2025, 9, 2)
        
        print(f"\n📊 Teste 1: Filtrando data_inicio_atividade ENTRE {data_min} e {data_max}")
        
        query = """
            SELECT 
                cnpj_completo,
                razao_social,
                data_inicio_atividade,
                TO_CHAR(data_inicio_atividade, 'DD/MM/YYYY') as data_formatada
            FROM vw_estabelecimentos_completos
            WHERE data_inicio_atividade >= %s
              AND data_inicio_atividade <= %s
            ORDER BY data_inicio_atividade, cnpj_completo
            LIMIT 10
        """
        
        cursor.execute(query, (data_min, data_max))
        results = cursor.fetchall()
        
        print(f"\n✅ Total encontrado: {cursor.rowcount}")
        print("\n📋 Primeiros 10 resultados:")
        for row in results:
            print(f"   {row['cnpj_completo']}: {row['data_formatada']} - {row['razao_social'][:50]}")
        
        # Teste 2: Contar total
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM vw_estabelecimentos_completos
            WHERE data_inicio_atividade >= %s
              AND data_inicio_atividade <= %s
        """, (data_min, data_max))
        
        total = cursor.fetchone()['total']
        print(f"\n📊 Total de empresas no período: {total:,}".replace(',', '.'))
        
        # Teste 3: Buscar o CNPJ específico do print (62.496.834/0001-97)
        cnpj_problema = '62496834000197'
        
        print(f"\n🔍 Teste 2: Verificando CNPJ específico: {cnpj_problema}")
        
        cursor.execute("""
            SELECT 
                cnpj_completo,
                razao_social,
                data_inicio_atividade,
                TO_CHAR(data_inicio_atividade, 'DD/MM/YYYY') as data_formatada
            FROM vw_estabelecimentos_completos
            WHERE cnpj_completo = %s
        """, (cnpj_problema,))
        
        cnpj_data = cursor.fetchone()
        if cnpj_data:
            print(f"   CNPJ: {cnpj_data['cnpj_completo']}")
            print(f"   Razão Social: {cnpj_data['razao_social']}")
            print(f"   Data Início (ISO): {cnpj_data['data_inicio_atividade']}")
            print(f"   Data Início (BR): {cnpj_data['data_formatada']}")
            
            # Verificar se está no intervalo
            data_cnpj = cnpj_data['data_inicio_atividade']
            if data_cnpj >= data_min and data_cnpj <= data_max:
                print(f"   ✅ ESTÁ no intervalo {data_min} a {data_max}")
            else:
                print(f"   ❌ NÃO ESTÁ no intervalo {data_min} a {data_max}")
                print(f"   ⚠️  Este CNPJ NÃO DEVERIA aparecer na busca!")
        else:
            print(f"   ❌ CNPJ não encontrado!")
        
        # Teste 4: Verificar se há datas em formato diferente
        print(f"\n🔍 Teste 3: Verificando tipo de dados da coluna")
        cursor.execute("""
            SELECT 
                data_type,
                column_name
            FROM information_schema.columns
            WHERE table_name = 'estabelecimentos'
              AND column_name = 'data_inicio_atividade'
        """)
        
        col_info = cursor.fetchone()
        print(f"   Coluna: {col_info['column_name']}")
        print(f"   Tipo: {col_info['data_type']}")
        
        print("\n" + "="*80)
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
