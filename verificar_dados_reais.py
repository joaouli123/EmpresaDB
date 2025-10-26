
#!/usr/bin/env python3
"""
Script para verificar DADOS REAIS no banco de dados
Conta TODAS as tabelas sem filtros
✅ OTIMIZADO: Sem parallel workers (evita erro de memória)
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
        
        # ✅ DESABILITAR PARALLEL WORKERS (evita erro de memória no Replit)
        cursor.execute("SET max_parallel_workers_per_gather = 0")
        cursor.execute("SET parallel_setup_cost = 1000000")
        cursor.execute("SET parallel_tuple_cost = 1000000")
        
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
        
        # 4. Estabelecimentos COM empresa cadastrada (SEM JOIN, usa EXISTS)
        print(f"\n📊 Calculando estabelecimentos com empresa (pode levar ~30s)...")
        cursor.execute("""
            SELECT COUNT(*) as total 
            FROM estabelecimentos e
            WHERE EXISTS (
                SELECT 1 FROM empresas emp 
                WHERE emp.cnpj_basico = e.cnpj_basico
            )
        """)
        total_com_empresa = cursor.fetchone()['total']
        print(f"   Total: {total_com_empresa:,} registros".replace(',', '.'))
        
        # 5. Estabelecimentos SEM empresa cadastrada
        print(f"\n📊 Calculando estabelecimentos ÓRFÃOS (pode levar ~30s)...")
        cursor.execute("""
            SELECT COUNT(*) as total 
            FROM estabelecimentos e
            WHERE NOT EXISTS (
                SELECT 1 FROM empresas emp 
                WHERE emp.cnpj_basico = e.cnpj_basico
            )
        """)
        total_sem_empresa = cursor.fetchone()['total']
        print(f"   Total: {total_sem_empresa:,} registros (ÓRFÃOS!)".replace(',', '.'))
        
        # 6. Estabelecimentos com data 2025-09-01 COM empresa
        print(f"\n📊 Calculando data 2025-09-01 + empresa (pode levar ~20s)...")
        cursor.execute("""
            SELECT COUNT(*) as total 
            FROM estabelecimentos e
            WHERE e.data_inicio_atividade = '2025-09-01'
            AND EXISTS (
                SELECT 1 FROM empresas emp 
                WHERE emp.cnpj_basico = e.cnpj_basico
            )
        """)
        total_data_com_empresa = cursor.fetchone()['total']
        print(f"   Total: {total_data_com_empresa:,} registros".replace(',', '.'))
        
        # 7. Total na VIEW materializada (se existir)
        try:
            cursor.execute("SELECT COUNT(*) as total FROM vw_estabelecimentos_completos")
            total_view = cursor.fetchone()['total']
            print(f"\n📌 VIEW MATERIALIZADA (vw_estabelecimentos_completos):")
            print(f"   Total: {total_view:,} registros".replace(',', '.'))
        except Exception as e:
            print(f"\n⚠️  VIEW materializada não existe ou erro: {e}")
            total_view = 0
        
        # 8. Análise
        print("\n" + "="*80)
        print("🔍 ANÁLISE:")
        print("="*80)
        
        if total_empresas > 60_000_000:
            print(f"\n✅ Você TEM {total_empresas:,} empresas importadas!".replace(',', '.'))
        else:
            print(f"\n⚠️  Você tem apenas {total_empresas:,} empresas (esperado: 64M+)".replace(',', '.'))
        
        if total_estabelecimentos > 40_000_000:
            print(f"✅ Você TEM {total_estabelecimentos:,} estabelecimentos importados!".replace(',', '.'))
        else:
            print(f"⚠️  Você tem apenas {total_estabelecimentos:,} estabelecimentos".replace(',', '.'))
        
        if total_sem_empresa > 0:
            percentual = (total_sem_empresa / total_estabelecimentos * 100) if total_estabelecimentos > 0 else 0
            print(f"\n⚠️  PROBLEMA: {total_sem_empresa:,} estabelecimentos ÓRFÃOS ({percentual:.1f}%)".replace(',', '.'))
            print(f"   Esses estabelecimentos NÃO aparecem na API porque não têm empresa!")
        else:
            print(f"\n✅ PERFEITO! Todos os estabelecimentos têm empresa cadastrada!")
        
        # 9. Comparação com seus 363.834
        print(f"\n" + "="*80)
        print("🔍 COMPARAÇÃO COM SEU SISTEMA:")
        print("="*80)
        
        seu_total = 363_834
        print(f"\n   Seu sistema: {seu_total:,} empresas com data 2025-09-01".replace(',', '.'))
        print(f"   VPS agora:   {total_data:,} estabelecimentos com data 2025-09-01".replace(',', '.'))
        
        diferenca = abs(total_data - seu_total)
        percentual_diff = (diferenca / seu_total * 100) if seu_total > 0 else 0
        
        if total_data < seu_total:
            print(f"\n   ⚠️  DIFERENÇA: {diferenca:,} registros a MENOS ({percentual_diff:.1f}%)".replace(',', '.'))
            print(f"   Possíveis causas:")
            print(f"   • Importação incompleta de estabelecimentos")
            print(f"   • Estabelecimentos órfãos (sem empresa)")
            print(f"   • Filtros diferentes entre sistemas")
        else:
            print(f"\n   ℹ️  DIFERENÇA: {diferenca:,} registros ({percentual_diff:.1f}%)".replace(',', '.'))
        
        print(f"\n📊 RESUMO FINAL:")
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
