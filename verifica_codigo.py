"""
Script para verificar se o código do Windows tem a correção
"""
import sys

# Simula leitura do arquivo que o usuário enviou
codigo_completo = """
(Cole aqui todo o conteúdo do seu arquivo importer.py do Windows)
"""

# Procurar por start_execution
if "tracker.start_execution()" in codigo_completo:
    print("✅ ENCONTRADO: tracker.start_execution() no código!")
    print("   O código está atualizado.")
else:
    print("❌ NÃO ENCONTRADO: tracker.start_execution()")
    print("   O código AINDA NÃO foi atualizado com a correção!")
    print("\n📝 INSTRUÇÕES:")
    print("   1. Baixe o arquivo src/etl/importer.py desta Repl")
    print("   2. Substitua no Windows")
    print("   3. Execute novamente")

# Verificar finish_execution
if "tracker.finish_execution(" in codigo_completo:
    print("✅ ENCONTRADO: tracker.finish_execution()")
else:
    print("❌ NÃO ENCONTRADO: tracker.finish_execution()")
