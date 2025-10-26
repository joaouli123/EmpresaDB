
#!/usr/bin/env python3
"""
Script para verificar DADOS REAIS no banco de dados
Conta TODAS as tabelas sem filtros
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
        
        print("\n" + "="*80)
        print("📊 DADOS REAIS NO BANCO DE DADOS DA VPS")
        print("="*80)
        
        # 1. Total de EMPRESAS (tabela principal)
        cursor.execute("SELECT COUNT(*) as total FROM empresas")
        total_empresas = cursor.fetchone()['total']
        print(f"\n📌 EMPRESAS (tabela principal):")
        print(f"   Total: {total_empresas:,} registros".replace(',', '.'))
        
        # 2. Total de ESTABELECIMENTOS (tabela principal)
        cursor.execute("SELECT COUNT(*) as total FROM estabelecimentos")
        total_estabelecimentos = cursor.fetchone()['total']
        print(f"\n📌 ESTABELECIMENTOS (tabela principal):")
        print(f"   Total: {total_estabelecimentos:,} registros".replace(',', '.'))
        
        # 3. Estabelecimentos com data 2025-09-01 (SEM FILTRO DE EMPRESA)
        cursor.execute("""
            SELECT COUNT(*) as total 
            FROM estabelecimentos 
            WHERE data_inicio_atividade = '2025-09-01'
        """)
        total_data = cursor.fetchone()['total']
        print(f"\n📌 ESTABELECIMENTOS com data 2025-09-01:")
        print(f"   Total: {total_data:,} registros".replace(',', '.'))
        
        # 4. Estabelecimentos COM empresa cadastrada
        cursor.execute("""
            SELECT COUNT(*) as total 
            FROM estabelecimentos e
            INNER JOIN empresas emp ON e.cnpj_basico = emp.cnpj_basico
        """)
        total_com_empresa = cursor.fetchone()['total']
        print(f"\n📌 ESTABELECIMENTOS com empresa cadastrada:")
        print(f"   Total: {total_com_empresa:,} registros".replace(',', '.'))
        
        # 5. Estabelecimentos SEM empresa cadastrada
        cursor.execute("""
            SELECT COUNT(*) as total 
            FROM estabelecimentos e
            LEFT JOIN empresas emp ON e.cnpj_basico = emp.cnpj_basico
            WHERE emp.cnpj_basico IS NULL
        """)
        total_sem_empresa = cursor.fetchone()['total']
        print(f"\n📌 ESTABELECIMENTOS SEM empresa cadastrada:")
        print(f"   Total: {total_sem_empresa:,} registros (ÓRFÃOS!)".replace(',', '.'))
        
        # 6. Estabelecimentos com data 2025-09-01 COM empresa
        cursor.execute("""
            SELECT COUNT(*) as total 
            FROM estabelecimentos e
            INNER JOIN empresas emp ON e.cnpj_basico = emp.cnpj_basico
            WHERE e.data_inicio_atividade = '2025-09-01'
        """)
        total_data_com_empresa = cursor.fetchone()['total']
        print(f"\n📌 ESTABELECIMENTOS com data 2025-09-01 E empresa cadastrada:")
        print(f"   Total: {total_data_com_empresa:,} registros".replace(',', '.'))
        
        # 7. Total na VIEW materializada
        cursor.execute("SELECT COUNT(*) as total FROM vw_estabelecimentos_completos")
        total_view = cursor.fetchone()['total']
        print(f"\n📌 VIEW MATERIALIZADA (vw_estabelecimentos_completos):")
        print(f"   Total: {total_view:,} registros".replace(',', '.'))
        
        # 8. Análise
        print("\n" + "="*80)
        print("🔍 ANÁLISE:")
        print("="*80)
        
        if total_empresas > 60_000_000:
            print(f"\n✅ Você TEM {total_empresas:,} empresas importadas!".replace(',', '.'))
        else:
            print(f"\n⚠️  Você tem apenas {total_empresas:,} empresas (esperado: 64M+)".replace(',', '.'))
        
        if total_estabelecimentos > 60_000_000:
            print(f"✅ Você TEM {total_estabelecimentos:,} estabelecimentos importados!".replace(',', '.'))
        else:
            print(f"⚠️  Você tem apenas {total_estabelecimentos:,} estabelecimentos".replace(',', '.'))
        
        if total_sem_empresa > 0:
            percentual = (total_sem_empresa / total_estabelecimentos * 100) if total_estabelecimentos > 0 else 0
            print(f"\n⚠️  PROBLEMA: {total_sem_empresa:,} estabelecimentos ÓRFÃOS ({percentual:.1f}%)".replace(',', '.'))
            print(f"   Esses estabelecimentos NÃO aparecem na API porque não têm empresa!")
        
        print(f"\n📊 RESUMO:")
        print(f"   • Total de empresas: {total_empresas:,}".replace(',', '.'))
        print(f"   • Total de estabelecimentos: {total_estabelecimentos:,}".replace(',', '.'))
        print(f"   • Estabelecimentos com data 2025-09-01: {total_data:,}".replace(',', '.'))
        print(f"   • Disponíveis na API (com empresa): {total_com_empresa:,}".replace(',', '.'))
        print(f"   • Órfãos (sem empresa): {total_sem_empresa:,}".replace(',', '.'))
        
        cursor.close()
        conn.close()
        
        print("\n" + "="*80 + "\n")
        
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
