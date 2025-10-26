#!/usr/bin/env python3
"""
Script para testar a API diretamente e verificar se o filtro de datas está funcionando.
Este script testa a API do Replit SEM passar pelo seu sistema Express intermediário.
"""

import requests
import json
from datetime import datetime

# URL da API do Replit (substitua pela sua)
API_URL = "https://458a29a2-33bc-4703-8186-ff6ee7c25cf9-00-twvo7peuo4pj.kirk.replit.dev"

# Sua API Key (substitua pela sua)
API_KEY = "sua_api_key_aqui"

def test_date_filter():
    """Testa o filtro de datas diretamente na API"""
    
    print("=" * 80)
    print("TESTE DO FILTRO DE DATAS - API DIRETA")
    print("=" * 80)
    
    # Teste 1: Filtro de data (01/09/2025 a 02/09/2025)
    print("\n📅 Teste 1: Filtro de datas (01/09/2025 a 02/09/2025)")
    print("-" * 80)
    
    params = {
        'data_inicio_atividade_min': '2025-09-01',
        'data_inicio_atividade_max': '2025-09-02',
        'page': 1,
        'per_page': 100
    }
    
    headers = {
        'X-API-Key': API_KEY
    }
    
    try:
        print(f"🌐 URL: {API_URL}/search")
        print(f"📝 Params: {json.dumps(params, indent=2)}")
        
        response = requests.get(
            f"{API_URL}/search",
            params=params,
            headers=headers,
            timeout=30
        )
        
        print(f"\n✅ Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"\n📊 Resultados:")
            print(f"   Total: {data.get('total', 0):,} empresas")
            print(f"   Página: {data.get('page', 0)}/{data.get('total_pages', 0)}")
            print(f"   Resultados nesta página: {len(data.get('items', []))}")
            
            # Verificar as primeiras 5 empresas
            print(f"\n📋 Primeiras 5 empresas:")
            print("-" * 80)
            
            items = data.get('items', [])
            for i, item in enumerate(items[:5], 1):
                cnpj = item.get('cnpj_completo', 'N/A')
                razao = item.get('razao_social', 'N/A')
                data_inicio = item.get('data_inicio_atividade', 'N/A')
                
                print(f"\n{i}. {razao}")
                print(f"   CNPJ: {cnpj}")
                print(f"   Data Início Atividade: {data_inicio}")
                
                # VERIFICAÇÃO CRÍTICA: A data está no range?
                if data_inicio and data_inicio != 'N/A':
                    data_obj = datetime.strptime(data_inicio, '%Y-%m-%d').date()
                    data_min = datetime.strptime('2025-09-01', '%Y-%m-%d').date()
                    data_max = datetime.strptime('2025-09-02', '%Y-%m-%d').date()
                    
                    if data_min <= data_obj <= data_max:
                        print(f"   ✅ Data DENTRO do filtro (01/09 a 02/09)")
                    else:
                        print(f"   ❌ Data FORA do filtro! ERRO!")
            
            # Verificar TODAS as datas
            print(f"\n🔍 Verificando TODAS as {len(items)} empresas retornadas...")
            erros = []
            
            for item in items:
                data_inicio = item.get('data_inicio_atividade')
                cnpj = item.get('cnpj_completo')
                
                if data_inicio:
                    data_obj = datetime.strptime(data_inicio, '%Y-%m-%d').date()
                    data_min = datetime.strptime('2025-09-01', '%Y-%m-%d').date()
                    data_max = datetime.strptime('2025-09-02', '%Y-%m-%d').date()
                    
                    if not (data_min <= data_obj <= data_max):
                        erros.append({
                            'cnpj': cnpj,
                            'data': data_inicio,
                            'razao_social': item.get('razao_social')
                        })
            
            if erros:
                print(f"\n❌ ENCONTRADOS {len(erros)} ERROS:")
                for erro in erros:
                    print(f"   - CNPJ: {erro['cnpj']}, Data: {erro['data']}")
                    print(f"     {erro['razao_social']}")
            else:
                print(f"\n✅ TODAS as {len(items)} empresas estão DENTRO do filtro!")
                print(f"   Filtro funcionando PERFEITAMENTE!")
        else:
            print(f"\n❌ Erro: {response.status_code}")
            print(f"Resposta: {response.text}")
            
    except Exception as e:
        print(f"\n❌ Erro ao fazer request: {e}")
    
    # Teste 2: Buscar CNPJ específico
    print("\n" + "=" * 80)
    print("📋 Teste 2: Buscar CNPJ específico (62496834000197)")
    print("-" * 80)
    
    try:
        response = requests.get(
            f"{API_URL}/cnpj/62496834000197",
            headers=headers,
            timeout=30
        )
        
        print(f"✅ Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n📋 Dados:")
            print(f"   CNPJ: {data.get('cnpj_completo')}")
            print(f"   Razão Social: {data.get('razao_social')}")
            print(f"   Data Início Atividade: {data.get('data_inicio_atividade')}")
            print(f"   Situação: {data.get('situacao_cadastral')}")
        else:
            print(f"❌ Erro: {response.status_code}")
            print(f"Resposta: {response.text}")
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    print("\n" + "=" * 80)
    print("FIM DOS TESTES")
    print("=" * 80)

def test_search_performance():
    """Testa a performance de diferentes tipos de busca"""
    
    print("\n" + "=" * 80)
    print("TESTE DE PERFORMANCE - DIFERENTES TIPOS DE BUSCA")
    print("=" * 80)
    
    headers = {'X-API-Key': API_KEY}
    
    tests = [
        {
            'name': 'Busca por Razão Social (ILIKE)',
            'params': {'razao_social': 'empreendimentos', 'per_page': 25}
        },
        {
            'name': 'Busca por UF',
            'params': {'uf': 'SP', 'per_page': 25}
        },
        {
            'name': 'Busca por CNAE',
            'params': {'cnae': '4712100', 'per_page': 25}
        },
        {
            'name': 'Busca por Data',
            'params': {
                'data_inicio_atividade_min': '2025-09-01',
                'data_inicio_atividade_max': '2025-09-02',
                'per_page': 25
            }
        },
        {
            'name': 'Busca Combinada (UF + CNAE)',
            'params': {'uf': 'SP', 'cnae': '4712100', 'per_page': 25}
        }
    ]
    
    for test in tests:
        print(f"\n🔍 {test['name']}")
        print("-" * 80)
        
        try:
            start_time = datetime.now()
            
            response = requests.get(
                f"{API_URL}/search",
                params=test['params'],
                headers=headers,
                timeout=60
            )
            
            elapsed = (datetime.now() - start_time).total_seconds()
            
            if response.status_code == 200:
                data = response.json()
                total = data.get('total', 0)
                items = len(data.get('items', []))
                
                print(f"✅ Tempo: {elapsed:.2f}s")
                print(f"   Total: {total:,} registros")
                print(f"   Retornados: {items} registros")
                
                # Avaliar performance
                if elapsed < 0.5:
                    print(f"   🚀 EXCELENTE (< 0.5s)")
                elif elapsed < 1.0:
                    print(f"   ✅ BOM (< 1s)")
                elif elapsed < 3.0:
                    print(f"   ⚠️ ACEITÁVEL (< 3s)")
                else:
                    print(f"   ❌ LENTO (> 3s)")
            else:
                print(f"❌ Erro: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Erro: {e}")

if __name__ == '__main__':
    print("\n🔧 CONFIGURAÇÃO:")
    print(f"   API URL: {API_URL}")
    print(f"   API KEY: {'*' * 20}{API_KEY[-8:] if len(API_KEY) > 8 else 'CONFIGURE!'}")
    print("\n⚠️  IMPORTANTE: Configure sua API_KEY no topo do arquivo!\n")
    
    if API_KEY == "sua_api_key_aqui":
        print("❌ ERRO: Configure a API_KEY antes de executar!")
        print("   Edite este arquivo e substitua 'sua_api_key_aqui' pela sua chave.\n")
        exit(1)
    
    test_date_filter()
    test_search_performance()
    
    print("\n✅ Todos os testes concluídos!")
    print("\nSe os testes mostrarem que a API está correta,")
    print("o problema está no seu sistema Express intermediário.")
    print("Limpe o cache e reinicie o servidor Express.\n")
