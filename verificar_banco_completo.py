#!/usr/bin/env python3
"""
Script para verificação completa do banco de dados de CNPJ
Verifica se todas as tabelas existem e estão povoadas corretamente
"""
import os
import psycopg2
from psycopg2 import sql
from psycopg2.extras import RealDictCursor
import sys

def conectar_banco():
    """Conecta ao banco de dados usando DATABASE_URL"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ ERROR: DATABASE_URL não encontrada!")
        sys.exit(1)
    
    try:
        conn = psycopg2.connect(database_url)
        return conn
    except Exception as e:
        print(f"❌ ERRO ao conectar ao banco: {e}")
        sys.exit(1)

def verificar_tabelas_existentes(conn):
    """Verifica quais tabelas existem no banco"""
    print("\n" + "="*80)
    print("📋 VERIFICANDO TABELAS EXISTENTES")
    print("="*80)
    
    tabelas_esperadas = [
        'cnaes',
        'municipios', 
        'motivos_situacao_cadastral',
        'naturezas_juridicas',
        'paises',
        'qualificacoes_socios',
        'empresas',
        'estabelecimentos',
        'socios',
        'simples_nacional'
    ]
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        tabelas_existentes = [row['table_name'] for row in cur.fetchall()]
    
    print(f"\n✓ Total de tabelas encontradas: {len(tabelas_existentes)}")
    print(f"✓ Total de tabelas esperadas: {len(tabelas_esperadas)}")
    
    tabelas_ok = []
    tabelas_faltando = []
    
    for tabela in tabelas_esperadas:
        if tabela in tabelas_existentes:
            print(f"  ✓ {tabela:40s} - OK")
            tabelas_ok.append(tabela)
        else:
            print(f"  ✗ {tabela:40s} - FALTANDO!")
            tabelas_faltando.append(tabela)
    
    if tabelas_faltando:
        print(f"\n❌ ATENÇÃO: {len(tabelas_faltando)} tabelas faltando: {', '.join(tabelas_faltando)}")
        return False
    else:
        print(f"\n✅ SUCESSO: Todas as {len(tabelas_esperadas)} tabelas estão criadas!")
        return True

def contar_registros(conn):
    """Conta registros em cada tabela"""
    print("\n" + "="*80)
    print("📊 CONTAGEM DE REGISTROS POR TABELA")
    print("="*80)
    
    tabelas = [
        ('cnaes', 'Tabelas Auxiliares', 1000),
        ('municipios', None, 5000),
        ('motivos_situacao_cadastral', None, 10),
        ('naturezas_juridicas', None, 100),
        ('paises', None, 200),
        ('qualificacoes_socios', None, 100),
        ('empresas', 'Tabelas Principais', 1000000),
        ('estabelecimentos', None, 1000000),
        ('socios', None, 100000),
        ('simples_nacional', None, 100000),
    ]
    
    resultados = {}
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        categoria_atual = None
        for item in tabelas:
            tabela = item[0]
            categoria = item[1]
            minimo_esperado = item[2]
            
            if categoria:
                categoria_atual = categoria
                print(f"\n{categoria_atual}:")
                print("-" * 80)
            
            try:
                cur.execute(sql.SQL("SELECT COUNT(*) as count FROM {}").format(
                    sql.Identifier(tabela)
                ))
                count = cur.fetchone()['count']
                resultados[tabela] = count
                
                # Formata número com separador de milhares
                count_fmt = f"{count:,}".replace(',', '.')
                
                # Verifica se está vazio ou com poucos registros
                if count == 0:
                    status = "❌ VAZIO"
                elif count < minimo_esperado:
                    status = "⚠️  POUCOS DADOS"
                else:
                    status = "✅ OK"
                
                print(f"  {tabela:35s} {count_fmt:>20s} registros  {status}")
                
            except Exception as e:
                print(f"  {tabela:35s} {'ERROR':>20s}  ❌ Erro: {e}")
                resultados[tabela] = 0
    
    return resultados

def verificar_indices(conn):
    """Verifica se os índices importantes foram criados"""
    print("\n" + "="*80)
    print("🔍 VERIFICANDO ÍNDICES")
    print("="*80)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT 
                schemaname,
                tablename,
                indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname
        """)
        indices = cur.fetchall()
    
    indices_por_tabela = {}
    for idx in indices:
        tabela = idx['tablename']
        if tabela not in indices_por_tabela:
            indices_por_tabela[tabela] = []
        indices_por_tabela[tabela].append(idx['indexname'])
    
    for tabela, lista_indices in sorted(indices_por_tabela.items()):
        print(f"\n{tabela}:")
        for idx in lista_indices:
            print(f"  ✓ {idx}")
    
    total_indices = sum(len(lista) for lista in indices_por_tabela.values())
    print(f"\n✅ Total de índices criados: {total_indices}")

def testar_consultas(conn, contagens):
    """Testa consultas básicas para verificar integridade dos dados"""
    print("\n" + "="*80)
    print("🧪 TESTANDO CONSULTAS DE INTEGRIDADE")
    print("="*80)
    
    testes = []
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Teste 1: Empresas com estabelecimentos
        print("\n1. Verificando relacionamento Empresas ↔ Estabelecimentos...")
        if contagens.get('empresas', 0) > 0 and contagens.get('estabelecimentos', 0) > 0:
            cur.execute("""
                SELECT COUNT(DISTINCT e.cnpj_basico) as empresas_com_estab
                FROM empresas e
                INNER JOIN estabelecimentos est ON e.cnpj_basico = est.cnpj_basico
                LIMIT 1
            """)
            result = cur.fetchone()
            print(f"   ✓ Empresas com estabelecimentos: {result['empresas_com_estab']:,}".replace(',', '.'))
            testes.append(('empresas_estabelecimentos', True))
        else:
            print(f"   ⚠️  Pulado - Empresas ou Estabelecimentos vazios")
            testes.append(('empresas_estabelecimentos', False))
        
        # Teste 2: Sócios vinculados a empresas
        print("\n2. Verificando relacionamento Empresas ↔ Sócios...")
        if contagens.get('socios', 0) > 0:
            cur.execute("""
                SELECT COUNT(*) as socios_com_empresa
                FROM socios s
                INNER JOIN empresas e ON s.cnpj_basico = e.cnpj_basico
                LIMIT 1
            """)
            result = cur.fetchone()
            print(f"   ✓ Sócios vinculados a empresas: {result['socios_com_empresa']:,}".replace(',', '.'))
            testes.append(('socios_empresas', True))
        else:
            print(f"   ⚠️  Pulado - Tabela de sócios vazia")
            testes.append(('socios_empresas', False))
        
        # Teste 3: CNAEs utilizados
        print("\n3. Verificando uso de CNAEs...")
        if contagens.get('cnaes', 0) > 0 and contagens.get('estabelecimentos', 0) > 0:
            cur.execute("""
                SELECT COUNT(DISTINCT cnae_fiscal_principal) as cnaes_usados
                FROM estabelecimentos
                WHERE cnae_fiscal_principal IS NOT NULL
            """)
            result = cur.fetchone()
            print(f"   ✓ CNAEs diferentes em uso: {result['cnaes_usados']:,}".replace(',', '.'))
            testes.append(('cnaes_uso', True))
        else:
            print(f"   ⚠️  Pulado - CNAEs ou Estabelecimentos vazios")
            testes.append(('cnaes_uso', False))
        
        # Teste 4: Municípios utilizados
        print("\n4. Verificando uso de Municípios...")
        if contagens.get('municipios', 0) > 0 and contagens.get('estabelecimentos', 0) > 0:
            cur.execute("""
                SELECT COUNT(DISTINCT municipio) as municipios_usados
                FROM estabelecimentos
                WHERE municipio IS NOT NULL
            """)
            result = cur.fetchone()
            print(f"   ✓ Municípios diferentes em uso: {result['municipios_usados']:,}".replace(',', '.'))
            testes.append(('municipios_uso', True))
        else:
            print(f"   ⚠️  Pulado - Municípios ou Estabelecimentos vazios")
            testes.append(('municipios_uso', False))
        
        # Teste 5: View de estabelecimentos completos
        print("\n5. Verificando View vw_estabelecimentos_completos...")
        try:
            cur.execute("""
                SELECT COUNT(*) as total
                FROM vw_estabelecimentos_completos
                LIMIT 1
            """)
            result = cur.fetchone()
            print(f"   ✓ Registros na view: {result['total']:,}".replace(',', '.'))
            testes.append(('view_completa', True))
        except Exception as e:
            print(f"   ❌ Erro ao consultar view: {e}")
            testes.append(('view_completa', False))
        
        # Teste 6: Exemplo de consulta completa
        print("\n6. Testando consulta completa (exemplo)...")
        if contagens.get('estabelecimentos', 0) > 0:
            cur.execute("""
                SELECT 
                    e.cnpj_completo,
                    e.nome_fantasia,
                    emp.razao_social,
                    e.situacao_cadastral,
                    e.uf,
                    cnae.descricao as cnae_desc
                FROM estabelecimentos e
                INNER JOIN empresas emp ON e.cnpj_basico = emp.cnpj_basico
                LEFT JOIN cnaes cnae ON e.cnae_fiscal_principal = cnae.codigo
                WHERE e.identificador_matriz_filial = '1'
                LIMIT 3
            """)
            results = cur.fetchall()
            if results:
                print(f"   ✓ Consulta executada com sucesso! Exemplo:")
                for i, row in enumerate(results, 1):
                    print(f"\n   Exemplo {i}:")
                    print(f"     CNPJ: {row['cnpj_completo']}")
                    print(f"     Razão Social: {row['razao_social'][:50]}...")
                    print(f"     Nome Fantasia: {row['nome_fantasia'][:50] if row['nome_fantasia'] else 'N/A'}...")
                    print(f"     Situação: {row['situacao_cadastral']}")
                    print(f"     UF: {row['uf']}")
                    print(f"     CNAE: {row['cnae_desc'][:60] if row['cnae_desc'] else 'N/A'}...")
                testes.append(('consulta_exemplo', True))
            else:
                print(f"   ⚠️  Nenhum resultado encontrado")
                testes.append(('consulta_exemplo', False))
        else:
            print(f"   ⚠️  Pulado - Estabelecimentos vazios")
            testes.append(('consulta_exemplo', False))
    
    return testes

def gerar_relatorio_final(tabelas_ok, contagens, testes):
    """Gera relatório final da verificação"""
    print("\n" + "="*80)
    print("📝 RELATÓRIO FINAL DA VERIFICAÇÃO")
    print("="*80)
    
    # Status das tabelas
    print("\n✅ TABELAS:")
    if tabelas_ok:
        print("   Todas as 10 tabelas principais estão criadas corretamente!")
    else:
        print("   ❌ Algumas tabelas estão faltando!")
    
    # Status dos dados
    print("\n✅ DADOS:")
    tabelas_vazias = [nome for nome, count in contagens.items() if count == 0]
    tabelas_populadas = [nome for nome, count in contagens.items() if count > 0]
    
    if tabelas_vazias:
        print(f"   ⚠️  {len(tabelas_vazias)} tabelas VAZIAS: {', '.join(tabelas_vazias)}")
    if tabelas_populadas:
        print(f"   ✓ {len(tabelas_populadas)} tabelas POPULADAS: {', '.join(tabelas_populadas)}")
    
    # Total de registros
    total_registros = sum(contagens.values())
    print(f"\n   Total geral de registros: {total_registros:,}".replace(',', '.'))
    
    # Status dos testes
    print("\n✅ TESTES DE INTEGRIDADE:")
    testes_ok = sum(1 for _, status in testes if status)
    testes_total = len(testes)
    print(f"   {testes_ok}/{testes_total} testes passaram com sucesso")
    
    # Veredicto final
    print("\n" + "="*80)
    print("🎯 VEREDICTO FINAL")
    print("="*80)
    
    if tabelas_ok and len(tabelas_vazias) == 0 and testes_ok == testes_total:
        print("\n✅ EXCELENTE! Banco de dados está PERFEITO!")
        print("   ✓ Todas as tabelas criadas")
        print("   ✓ Todos os dados povoados")
        print("   ✓ Todos os relacionamentos funcionando")
        print("   ✓ Consultas funcionando corretamente")
        print("\n🚀 Você pode fazer consultas de:")
        print("   • Empresas (razão social, CNPJ básico)")
        print("   • Estabelecimentos (matriz, filiais, CNPJ completo)")
        print("   • Sócios (nomes, CPF/CNPJ)")
        print("   • CNAEs (atividades econômicas)")
        print("   • E todas as combinações entre elas!")
        return True
    elif tabelas_ok and len(tabelas_populadas) > 0:
        print("\n⚠️  PARCIALMENTE OK - Banco funcionando mas com ressalvas:")
        if tabelas_vazias:
            print(f"   ⚠️  Tabelas vazias: {', '.join(tabelas_vazias)}")
        if testes_ok < testes_total:
            print(f"   ⚠️  Alguns testes falharam ({testes_total - testes_ok} de {testes_total})")
        print("\n🔧 Você pode fazer consultas, mas:")
        if 'empresas' in tabelas_vazias or 'estabelecimentos' in tabelas_vazias:
            print("   ⚠️  Dados principais (empresas/estabelecimentos) podem estar incompletos")
        if 'socios' in tabelas_vazias:
            print("   ⚠️  Consultas de sócios não funcionarão")
        if any(t in tabelas_vazias for t in ['cnaes', 'municipios', 'naturezas_juridicas']):
            print("   ⚠️  Dados auxiliares (descrições) podem estar faltando")
        return False
    else:
        print("\n❌ PROBLEMA CRÍTICO!")
        print("   ❌ Banco de dados não está pronto para uso")
        if not tabelas_ok:
            print("   ❌ Tabelas essenciais faltando")
        if len(tabelas_populadas) == 0:
            print("   ❌ Nenhum dado importado")
        print("\n⚠️  É necessário executar o processo de importação (ETL)")
        return False

def main():
    """Função principal"""
    print("\n" + "="*80)
    print("🔍 VERIFICAÇÃO COMPLETA DO BANCO DE DADOS CNPJ")
    print("="*80)
    
    # Conecta ao banco
    print("\n📡 Conectando ao banco de dados...")
    conn = conectar_banco()
    print("✅ Conexão estabelecida com sucesso!")
    
    try:
        # Verifica tabelas
        tabelas_ok = verificar_tabelas_existentes(conn)
        
        # Conta registros
        contagens = contar_registros(conn)
        
        # Verifica índices
        verificar_indices(conn)
        
        # Testa consultas
        testes = testar_consultas(conn, contagens)
        
        # Gera relatório final
        sucesso = gerar_relatorio_final(tabelas_ok, contagens, testes)
        
        print("\n" + "="*80)
        print("✅ Verificação concluída!")
        print("="*80 + "\n")
        
        return 0 if sucesso else 1
        
    except Exception as e:
        print(f"\n❌ ERRO durante verificação: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        conn.close()
        print("🔌 Conexão com banco encerrada.\n")

if __name__ == "__main__":
    sys.exit(main())
