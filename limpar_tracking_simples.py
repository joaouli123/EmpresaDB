#!/usr/bin/env python3
"""
Script para limpar o tracking do arquivo Simples Nacional
permitindo sua reimportação
"""
import os
import psycopg2
import sys
from pathlib import Path

# Tenta carregar o .env
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def limpar_tracking_simples():
    """Limpa o rastreamento do arquivo Simples Nacional"""
    
    # Tenta pegar do ambiente ou usa o padrão
    database_url = os.getenv('DATABASE_URL')
    
    # Se não encontrou, usa a conexão direta da VPS
    if not database_url:
        database_url = "postgresql://cnpj_user:Proelast1608%40@72.61.217.143:5432/cnpj_db"
        print("ℹ️  Usando conexão VPS padrão")
    
    if not database_url:
        print("❌ ERROR: DATABASE_URL não encontrada!")
        sys.exit(1)
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        print("\n" + "="*80)
        print("🧹 LIMPANDO RASTREAMENTO DO SIMPLES NACIONAL")
        print("="*80 + "\n")
        
        # Verifica se existem registros
        cursor.execute("""
            SELECT COUNT(*) 
            FROM etl_tracking_files 
            WHERE file_name LIKE '%SIMPLES%'
        """)
        count_before = cursor.fetchone()[0]
        print(f"📊 Registros encontrados no tracking: {count_before}")
        
        if count_before > 0:
            # Busca detalhes dos registros
            cursor.execute("""
                SELECT id, file_name, status, started_at, completed_at
                FROM etl_tracking_files 
                WHERE file_name LIKE '%SIMPLES%'
                ORDER BY started_at DESC
            """)
            
            print("\n📋 Arquivos encontrados:")
            for row in cursor.fetchall():
                print(f"  ID: {row[0]}")
                print(f"  Arquivo: {row[1]}")
                print(f"  Status: {row[2]}")
                print(f"  Iniciado: {row[3]}")
                print(f"  Concluído: {row[4]}")
                print()
            
            # Remove os registros de chunks relacionados primeiro
            cursor.execute("""
                DELETE FROM etl_tracking_chunks
                WHERE file_tracking_id IN (
                    SELECT id FROM etl_tracking_files 
                    WHERE file_name LIKE '%SIMPLES%'
                )
            """)
            chunks_deleted = cursor.rowcount
            print(f"🗑️  Removidos {chunks_deleted} chunks relacionados")
            
            # Remove os registros de arquivos
            cursor.execute("""
                DELETE FROM etl_tracking_files 
                WHERE file_name LIKE '%SIMPLES%'
            """)
            files_deleted = cursor.rowcount
            print(f"🗑️  Removidos {files_deleted} registros de arquivo")
            
            # Commit das mudanças
            conn.commit()
            
            print("\n✅ Rastreamento limpo com sucesso!")
            print("🔄 Agora você pode executar: python importar_simples.py")
            
        else:
            print("ℹ️  Nenhum registro encontrado no tracking")
            print("⚠️  O arquivo pode estar sendo pulado por outro motivo")
        
        cursor.close()
        conn.close()
        
        print("\n" + "="*80)
        print("✅ PROCESSO CONCLUÍDO")
        print("="*80 + "\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = limpar_tracking_simples()
    sys.exit(0 if success else 1)
