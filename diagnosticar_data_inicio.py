
#!/usr/bin/env python3
"""
Diagnóstico detalhado do campo data_inicio_atividade
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
        print("🔍 DIAGNÓSTICO: data_inicio_atividade")
        print("="*80)
        
        # 1. Total com data_inicio_atividade preenchida
        print("\n📊 Análise do campo data_inicio_atividade:")
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(data_inicio_atividade) as preenchidos,
                COUNT(*) - COUNT(data_inicio_atividade) as nulos
            FROM estabelecimentos
        """)
        result = cursor.fetchone()
        print(f"   Total de estabelecimentos: {result['total']:,}".replace(',', '.'))
        print(f"   Com data preenchida: {result['preenchidos']:,}".replace(',', '.'))
        print(f"   Com data NULL: {result['nulos']:,}".replace(',', '.'))
        
        # 2. Distribuição de datas (top 10)
        print("\n📊 Top 10 datas mais frequentes:")
        cursor.execute("""
            SELECT 
                data_inicio_atividade,
                COUNT(*) as total
            FROM estabelecimentos
            WHERE data_inicio_atividade IS NOT NULL
            GROUP BY data_inicio_atividade
            ORDER BY total DESC
            LIMIT 10
        """)
        for row in cursor.fetchall():
            print(f"   {row['data_inicio_atividade']}: {row['total']:,} registros".replace(',', '.'))
        
        # 3. Verificar formato da data
        print("\n📊 Exemplos de registros com data 2025-09-01:")
        cursor.execute("""
            SELECT 
                cnpj_completo,
                data_inicio_atividade,
                cnpj_basico
            FROM estabelecimentos
            WHERE data_inicio_atividade = '2025-09-01'
            LIMIT 5
        """)
        for row in cursor.fetchall():
            print(f"   CNPJ: {row['cnpj_completo']}, Data: {row['data_inicio_atividade']}, Básico: {row['cnpj_basico']}")
        
        # 4. Verificar se há datas em formato diferente
        print("\n📊 Verificando formatos alternativos de 01/09/2025:")
        
        # Formato DD/MM/YYYY
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM estabelecimentos
            WHERE data_inicio_atividade::text = '01/09/2025'
        """)
        alt1 = cursor.fetchone()['total']
        print(f"   Formato '01/09/2025': {alt1:,} registros".replace(',', '.'))
        
        # Formato YYYY-MM-DD (padrão)
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM estabelecimentos
            WHERE data_inicio_atividade = '2025-09-01'
        """)
        alt2 = cursor.fetchone()['total']
        print(f"   Formato '2025-09-01': {alt2:,} registros".replace(',', '.'))
        
        # 5. Verificar na VIEW materializada
        print("\n📊 Verificando na VIEW materializada:")
        try:
            cursor.execute("""
                SELECT COUNT(*) as total
                FROM vw_estabelecimentos_completos
                WHERE data_inicio_atividade = '2025-09-01'
            """)
            view_count = cursor.fetchone()['total']
            print(f"   Total na VIEW: {view_count:,} registros".replace(',', '.'))
        except Exception as e:
            print(f"   ❌ Erro ao consultar VIEW: {e}")
        
        # 6. Comparar empresas vs estabelecimentos
        print("\n📊 Comparando EMPRESAS vs ESTABELECIMENTOS:")
        cursor.execute("""
            SELECT COUNT(DISTINCT e.cnpj_basico) as empresas_unicas
            FROM estabelecimentos e
            WHERE e.data_inicio_atividade = '2025-09-01'
        """)
        empresas_unicas = cursor.fetchone()['empresas_unicas']
        print(f"   Empresas únicas com data 2025-09-01: {empresas_unicas:,}".replace(',', '.'))
        
        # 7. Verificar se importação de estabelecimentos está completa
        print("\n📊 Verificando completude da importação:")
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT cnpj_basico) as empresas_com_estab,
                (SELECT COUNT(*) FROM empresas) as total_empresas
            FROM estabelecimentos
        """)
        result = cursor.fetchone()
        print(f"   Empresas com estabelecimento: {result['empresas_com_estab']:,}".replace(',', '.'))
        print(f"   Total de empresas: {result['total_empresas']:,}".replace(',', '.'))
        percentual = (result['empresas_com_estab'] / result['total_empresas'] * 100) if result['total_empresas'] > 0 else 0
        print(f"   Cobertura: {percentual:.2f}%")
        
        # 8. Buscar CNPJs específicos do sistema externo
        print("\n📊 RECOMENDAÇÃO:")
        print("   Para encontrar o problema exato, faça o seguinte:")
        print("   1. Pegue 5 CNPJs do seu sistema externo que têm data 2025-09-01")
        print("   2. Execute esta query na VPS para cada um:")
        print("      SELECT * FROM estabelecimentos WHERE cnpj_completo = 'CNPJ_AQUI';")
        print("   3. Verifique se o campo data_inicio_atividade está preenchido")
        
        print("\n" + "="*80)
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
