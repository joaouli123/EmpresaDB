#!/usr/bin/env python3
"""
Script de Teste - Conexão Redis
Testa se o Redis está funcionando corretamente
"""

import os
import sys

# Configurar variáveis de ambiente (temporário para teste)
os.environ['REDIS_HOST'] = '72.61.217.143'
os.environ['REDIS_PORT'] = '6379'
os.environ['REDIS_PASSWORD'] = 'Proelast1608@'

print("🔍 TESTANDO CONEXÃO REDIS")
print("=" * 50)
print(f"Host: {os.getenv('REDIS_HOST')}")
print(f"Port: {os.getenv('REDIS_PORT')}")
print(f"Password: {'***' + os.getenv('REDIS_PASSWORD')[-4:]}")
print("=" * 50)
print()

try:
    from src.api.cache_redis import cache
    
    # 1. Verificar se conectou
    print("1️⃣ Verificando conexão...")
    if cache.enabled:
        print("   ✅ Redis conectado!")
    else:
        print("   ⚠️ Redis não disponível (usando cache em memória)")
        print()
        print("💡 DICA: Verifique se o Redis está:")
        print("   1. Rodando na VPS: sudo systemctl status redis-server")
        print("   2. Aceitando conexões remotas (bind 0.0.0.0)")
        print("   3. Firewall liberado (porta 6379)")
        sys.exit(1)
    
    print()
    
    # 2. Testar operações básicas
    print("2️⃣ Testando operações...")
    
    # SET
    print("   📝 Salvando dados no cache...")
    sucesso = cache.set('teste_cnpj', {
        'cnpj': '00000000000191',
        'razao_social': 'BANCO DO BRASIL S.A.',
        'uf': 'DF'
    }, ttl_seconds=60)
    
    if sucesso:
        print("   ✅ Dados salvos!")
    else:
        print("   ❌ Erro ao salvar!")
        sys.exit(1)
    
    # GET
    print("   📖 Recuperando dados...")
    dados = cache.get('teste_cnpj')
    
    if dados:
        print(f"   ✅ Dados recuperados: {dados['razao_social']}")
    else:
        print("   ❌ Erro ao recuperar!")
        sys.exit(1)
    
    # EXISTS
    print("   🔍 Verificando se chave existe...")
    existe = cache.exists('teste_cnpj')
    print(f"   {'✅' if existe else '❌'} Chave existe: {existe}")
    
    print()
    
    # 3. Testar compressão
    print("3️⃣ Testando compressão...")
    dados_grandes = {
        'cnpj': '00000000000191',
        'dados': ['item' + str(i) for i in range(1000)]
    }
    
    cache.set('teste_compressao', dados_grandes, ttl_seconds=60)
    dados_recuperados = cache.get('teste_compressao')
    
    if len(dados_recuperados['dados']) == 1000:
        print("   ✅ Compressão funcionando!")
    else:
        print("   ❌ Erro na compressão!")
    
    print()
    
    # 4. Estatísticas
    print("4️⃣ Estatísticas do Redis:")
    stats = cache.get_stats()
    
    for key, value in stats.items():
        print(f"   {key}: {value}")
    
    print()
    
    # 5. Limpeza
    print("5️⃣ Limpando dados de teste...")
    cache.delete('teste_cnpj')
    cache.delete('teste_compressao')
    print("   ✅ Limpeza concluída!")
    
    print()
    print("=" * 50)
    print("🎉 REDIS 100% FUNCIONAL!")
    print("=" * 50)
    print()
    print("📊 PRÓXIMOS PASSOS:")
    print("   1. Adicione as variáveis ao arquivo .env:")
    print("      REDIS_HOST=72.61.217.143")
    print("      REDIS_PORT=6379")
    print("      REDIS_PASSWORD=Proelast1608@")
    print()
    print("   2. Reinicie o backend")
    print()
    print("   3. Monitore os logs para ver:")
    print("      ✅ Redis conectado em 72.61.217.143:6379")
    print("      💾 Cache HIT: ...")
    print("      🔍 Cache MISS: ...")
    
except ImportError as e:
    print(f"❌ Erro ao importar módulo: {e}")
    print()
    print("💡 Certifique-se de que:")
    print("   1. O módulo redis está instalado: pip install redis")
    print("   2. Você está no diretório correto")
    sys.exit(1)
    
except Exception as e:
    print(f"❌ Erro inesperado: {e}")
    print()
    print("💡 Verifique:")
    print("   1. Redis está rodando na VPS")
    print("   2. Credenciais estão corretas")
    print("   3. Firewall permite conexão na porta 6379")
    sys.exit(1)
