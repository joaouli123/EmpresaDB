#!/bin/bash
echo "=== MONITOR ETL - CNPJ ==="
echo ""
echo "📥 Arquivos baixados:"
ls -lh downloads/ 2>/dev/null | grep -E "\.zip$" | wc -l || echo "0"
echo ""
echo "📊 Tamanho total baixado:"
du -sh downloads/ 2>/dev/null || echo "0 bytes"
echo ""
echo "🗄️  Registros no banco:"
python3 -c "
from src.database.connection import db_manager
tables = ['cnaes', 'municipios', 'empresas', 'estabelecimentos', 'socios', 'simples_nacional']
for t in tables:
    count = db_manager.get_table_count(t) or 0
    print(f'{t}: {count:,}')
" 2>/dev/null || echo "Erro ao conectar no banco"
echo ""
echo "🔄 Processo Python rodando:"
ps aux | grep -E "run_etl|CNPJImporter" | grep -v grep | wc -l
