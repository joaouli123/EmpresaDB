import os
import zipfile
import csv
import logging
from pathlib import Path
from typing import Optional, List
from tqdm import tqdm
import pandas as pd
from io import StringIO
from src.database.connection import db_manager
from src.config import settings

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CNPJImporter:
    def __init__(self):
        self.download_dir = Path(settings.DOWNLOAD_DIR)
        self.data_dir = Path(settings.DATA_DIR)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.chunk_size = settings.CHUNK_SIZE
        
        self.import_order = [
            ('tabela_auxiliar_cnaes', 'cnaes'),
            ('tabela_auxiliar_municipios', 'municipios'),
            ('tabela_auxiliar_motivos', 'motivos_situacao_cadastral'),
            ('tabela_auxiliar_naturezas', 'naturezas_juridicas'),
            ('tabela_auxiliar_paises', 'paises'),
            ('tabela_auxiliar_qualificacoes', 'qualificacoes_socios'),
            ('empresas', 'empresas'),
            ('estabelecimentos', 'estabelecimentos'),
            ('socios', 'socios'),
            ('simples_nacional', 'simples_nacional')
        ]
    
    def extract_zip(self, zip_path: Path) -> Optional[Path]:
        try:
            logger.info(f"Extraindo: {zip_path.name}")
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                file_list = zip_ref.namelist()
                
                for file_name in file_list:
                    if file_name.endswith('.csv') or file_name.endswith('.CSV'):
                        extract_path = self.data_dir / file_name
                        
                        if not extract_path.exists():
                            zip_ref.extract(file_name, self.data_dir)
                            logger.info(f"  Extraído: {file_name}")
                        else:
                            logger.info(f"  Já existe: {file_name}")
                        
                        return extract_path
            
            return None
            
        except Exception as e:
            logger.error(f"Erro ao extrair {zip_path}: {e}")
            return None
    
    def import_auxiliary_table(self, csv_path: Path, table_name: str, columns: List[str]):
        logger.info(f"Importando tabela auxiliar: {table_name} de {csv_path.name}")
        
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute(f"DELETE FROM {table_name}")
                
                with open(csv_path, 'r', encoding='latin1') as f:
                    copy_sql = f"COPY {table_name} ({','.join(columns)}) FROM STDIN WITH CSV DELIMITER ';'"
                    cursor.copy_expert(copy_sql, f)
                
                conn.commit()
                
                count = db_manager.get_table_count(table_name)
                logger.info(f"  ✓ Importados {count} registros em {table_name}")
                cursor.close()
                
        except Exception as e:
            logger.error(f"Erro ao importar {table_name}: {e}")
    
    def import_empresas(self, csv_path: Path):
        logger.info(f"Importando empresas de: {csv_path.name}")
        table_name = 'empresas'
        
        columns = [
            'cnpj_basico', 'razao_social', 'natureza_juridica',
            'qualificacao_responsavel', 'capital_social', 'porte_empresa',
            'ente_federativo_responsavel'
        ]
        
        try:
            total_imported = 0
            
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                with open(csv_path, 'r', encoding='latin1') as f:
                    for chunk in tqdm(
                        pd.read_csv(
                            f,
                            sep=';',
                            header=None,
                            names=columns,
                            chunksize=self.chunk_size,
                            dtype=str,
                            na_values=[''],
                            keep_default_na=False
                        ),
                        desc=f"Processando {csv_path.name}"
                    ):
                        chunk = chunk.fillna('')
                        
                        capital_social_series = pd.to_numeric(
                            chunk['capital_social'].str.replace(',', '.'),
                            errors='coerce'
                        )
                        chunk['capital_social'] = capital_social_series.fillna(0)
                        
                        output = StringIO()
                        chunk.to_csv(output, sep=';', header=False, index=False)
                        output.seek(0)
                        
                        copy_sql = f"COPY {table_name} ({','.join(columns)}) FROM STDIN WITH CSV DELIMITER ';'"
                        cursor.copy_expert(copy_sql, output)
                        
                        total_imported += len(chunk)
                
                conn.commit()
                cursor.close()
            
            logger.info(f"  ✓ Total importado: {total_imported} empresas")
            
        except Exception as e:
            logger.error(f"Erro ao importar empresas: {e}")
    
    def import_estabelecimentos(self, csv_path: Path):
        logger.info(f"Importando estabelecimentos de: {csv_path.name}")
        table_name = 'estabelecimentos'
        
        columns = [
            'cnpj_basico', 'cnpj_ordem', 'cnpj_dv', 'identificador_matriz_filial',
            'nome_fantasia', 'situacao_cadastral', 'data_situacao_cadastral',
            'motivo_situacao_cadastral', 'nome_cidade_exterior', 'pais',
            'data_inicio_atividade', 'cnae_fiscal_principal', 'cnae_fiscal_secundaria',
            'tipo_logradouro', 'logradouro', 'numero', 'complemento', 'bairro',
            'cep', 'uf', 'municipio', 'ddd_1', 'telefone_1', 'ddd_2', 'telefone_2',
            'ddd_fax', 'fax', 'correio_eletronico', 'situacao_especial',
            'data_situacao_especial'
        ]
        
        try:
            total_imported = 0
            
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                with open(csv_path, 'r', encoding='latin1') as f:
                    for chunk in tqdm(
                        pd.read_csv(
                            f,
                            sep=';',
                            header=None,
                            names=columns,
                            chunksize=self.chunk_size,
                            dtype=str,
                            na_values=[''],
                            keep_default_na=False
                        ),
                        desc=f"Processando {csv_path.name}"
                    ):
                        chunk = chunk.fillna('')
                        
                        for date_col in ['data_situacao_cadastral', 'data_inicio_atividade', 'data_situacao_especial']:
                            chunk[date_col] = pd.to_datetime(
                                chunk[date_col],
                                format='%Y%m%d',
                                errors='coerce'
                            )
                            chunk[date_col] = chunk[date_col].dt.strftime('%Y-%m-%d')
                            chunk[date_col] = chunk[date_col].replace('NaT', '')
                        
                        output = StringIO()
                        chunk.to_csv(output, sep=';', header=False, index=False)
                        output.seek(0)
                        
                        copy_sql = f"COPY {table_name} ({','.join(columns)}) FROM STDIN WITH CSV DELIMITER ';'"
                        cursor.copy_expert(copy_sql, output)
                        
                        total_imported += len(chunk)
                
                conn.commit()
                cursor.close()
            
            logger.info(f"  ✓ Total importado: {total_imported} estabelecimentos")
            
        except Exception as e:
            logger.error(f"Erro ao importar estabelecimentos: {e}")
    
    def import_socios(self, csv_path: Path):
        logger.info(f"Importando sócios de: {csv_path.name}")
        table_name = 'socios'
        
        columns = [
            'cnpj_basico', 'identificador_socio', 'nome_socio', 'cnpj_cpf_socio',
            'qualificacao_socio', 'data_entrada_sociedade', 'pais',
            'representante_legal', 'nome_representante', 'qualificacao_representante',
            'faixa_etaria'
        ]
        
        try:
            total_imported = 0
            
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                with open(csv_path, 'r', encoding='latin1') as f:
                    for chunk in tqdm(
                        pd.read_csv(
                            f,
                            sep=';',
                            header=None,
                            names=columns,
                            chunksize=self.chunk_size,
                            dtype=str,
                            na_values=[''],
                            keep_default_na=False
                        ),
                        desc=f"Processando {csv_path.name}"
                    ):
                        chunk = chunk.fillna('')
                        
                        chunk['data_entrada_sociedade'] = pd.to_datetime(
                            chunk['data_entrada_sociedade'],
                            format='%Y%m%d',
                            errors='coerce'
                        )
                        chunk['data_entrada_sociedade'] = chunk['data_entrada_sociedade'].dt.strftime('%Y-%m-%d')
                        chunk['data_entrada_sociedade'] = chunk['data_entrada_sociedade'].replace('NaT', '')
                        
                        output = StringIO()
                        chunk.to_csv(output, sep=';', header=False, index=False)
                        output.seek(0)
                        
                        copy_sql = f"COPY {table_name} ({','.join(columns)}) FROM STDIN WITH CSV DELIMITER ';'"
                        cursor.copy_expert(copy_sql, output)
                        
                        total_imported += len(chunk)
                
                conn.commit()
                cursor.close()
            
            logger.info(f"  ✓ Total importado: {total_imported} sócios")
            
        except Exception as e:
            logger.error(f"Erro ao importar sócios: {e}")
    
    def import_simples(self, csv_path: Path):
        logger.info(f"Importando Simples Nacional de: {csv_path.name}")
        table_name = 'simples_nacional'
        
        columns = [
            'cnpj_basico', 'opcao_simples', 'data_opcao_simples',
            'data_exclusao_simples', 'opcao_mei', 'data_opcao_mei',
            'data_exclusao_mei'
        ]
        
        try:
            total_imported = 0
            
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                with open(csv_path, 'r', encoding='latin1') as f:
                    for chunk in tqdm(
                        pd.read_csv(
                            f,
                            sep=';',
                            header=None,
                            names=columns,
                            chunksize=self.chunk_size,
                            dtype=str,
                            na_values=[''],
                            keep_default_na=False
                        ),
                        desc=f"Processando {csv_path.name}"
                    ):
                        chunk = chunk.fillna('')
                        
                        for date_col in ['data_opcao_simples', 'data_exclusao_simples', 'data_opcao_mei', 'data_exclusao_mei']:
                            chunk[date_col] = pd.to_datetime(
                                chunk[date_col],
                                format='%Y%m%d',
                                errors='coerce'
                            )
                            chunk[date_col] = chunk[date_col].dt.strftime('%Y-%m-%d')
                            chunk[date_col] = chunk[date_col].replace('NaT', '')
                        
                        output = StringIO()
                        chunk.to_csv(output, sep=';', header=False, index=False)
                        output.seek(0)
                        
                        copy_sql = f"COPY {table_name} ({','.join(columns)}) FROM STDIN WITH CSV DELIMITER ';'"
                        cursor.copy_expert(copy_sql, output)
                        
                        total_imported += len(chunk)
                
                conn.commit()
                cursor.close()
            
            logger.info(f"  ✓ Total importado: {total_imported} registros Simples")
            
        except Exception as e:
            logger.error(f"Erro ao importar Simples Nacional: {e}")
    
    def process_all(self, downloaded_files: dict):
        logger.info("\n" + "="*70)
        logger.info("INICIANDO PROCESSO DE IMPORTAÇÃO")
        logger.info("="*70 + "\n")
        
        for file_type, table_name in self.import_order:
            if file_type not in downloaded_files or not downloaded_files[file_type]:
                logger.warning(f"⚠ Nenhum arquivo encontrado para: {file_type}")
                continue
            
            logger.info(f"\n📁 Processando tipo: {file_type}")
            logger.info(f"   Tabela destino: {table_name}")
            
            for zip_file in downloaded_files[file_type]:
                zip_path = Path(zip_file)
                
                if not zip_path.exists():
                    logger.warning(f"  Arquivo não encontrado: {zip_file}")
                    continue
                
                csv_path = self.extract_zip(zip_path)
                
                if not csv_path or not csv_path.exists():
                    logger.warning(f"  Falha ao extrair: {zip_file}")
                    continue
                
                if file_type.startswith('tabela_auxiliar'):
                    if 'cnaes' in file_type:
                        self.import_auxiliary_table(csv_path, table_name, ['codigo', 'descricao'])
                    elif 'municipios' in file_type:
                        self.import_auxiliary_table(csv_path, table_name, ['codigo', 'descricao'])
                    elif 'motivos' in file_type:
                        self.import_auxiliary_table(csv_path, table_name, ['codigo', 'descricao'])
                    elif 'naturezas' in file_type:
                        self.import_auxiliary_table(csv_path, table_name, ['codigo', 'descricao'])
                    elif 'paises' in file_type:
                        self.import_auxiliary_table(csv_path, table_name, ['codigo', 'descricao'])
                    elif 'qualificacoes' in file_type:
                        self.import_auxiliary_table(csv_path, table_name, ['codigo', 'descricao'])
                
                elif file_type == 'empresas':
                    self.import_empresas(csv_path)
                
                elif file_type == 'estabelecimentos':
                    self.import_estabelecimentos(csv_path)
                
                elif file_type == 'socios':
                    self.import_socios(csv_path)
                
                elif file_type == 'simples_nacional':
                    self.import_simples(csv_path)
        
        logger.info("\n" + "="*70)
        logger.info("IMPORTAÇÃO CONCLUÍDA!")
        logger.info("="*70)
        
        self.print_summary()
    
    def print_summary(self):
        logger.info("\n📊 RESUMO DA IMPORTAÇÃO:")
        logger.info("-" * 70)
        
        tables = [
            'cnaes', 'municipios', 'motivos_situacao_cadastral',
            'naturezas_juridicas', 'paises', 'qualificacoes_socios',
            'empresas', 'estabelecimentos', 'socios', 'simples_nacional'
        ]
        
        for table in tables:
            count = db_manager.get_table_count(table)
            if count is not None:
                logger.info(f"  {table:35} {count:>15,} registros")
        
        logger.info("-" * 70)

def main():
    from src.etl.downloader import RFBDownloader
    
    downloader = RFBDownloader()
    downloaded_files = downloader.download_latest_files()
    
    importer = CNPJImporter()
    importer.process_all(downloaded_files)

if __name__ == "__main__":
    main()
