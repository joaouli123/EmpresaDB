import os
import zipfile
import csv
import logging
from pathlib import Path
from typing import Optional, List, Callable
from tqdm import tqdm
import pandas as pd
from io import StringIO
from src.database.connection import db_manager
from src.config import settings
from src.etl.etl_tracker import ETLTracker
import asyncio

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

        # Sistema de rastreamento ETL
        self.tracker = ETLTracker()

        # Cache de códigos válidos para validação
        self.valid_codes_cache = {}

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

    def load_valid_codes(self, table_name: str):
        """Carrega códigos válidos de uma tabela auxiliar para cache"""
        if table_name in self.valid_codes_cache:
            return self.valid_codes_cache[table_name]

        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(f"SELECT codigo FROM {table_name}")
                codes = {row[0] for row in cursor.fetchall()}
                cursor.close()
                self.valid_codes_cache[table_name] = codes
                return codes
        except Exception as e:
            logger.warning(f"Erro ao carregar códigos de {table_name}: {e}")
            return set()

    def validate_foreign_key(self, value: str, table_name: str) -> str:
        """Valida se o código existe na tabela de referência, retorna vazio se inválido"""
        if not value or value == '':
            return ''

        valid_codes = self.load_valid_codes(table_name)
        if value not in valid_codes:
            return ''
        return value

    def validate_zip_file(self, zip_path: Path) -> tuple[bool, str]:
        """Valida se o arquivo ZIP está íntegro e contém dados válidos"""
        try:
            # Verifica se o arquivo existe
            if not zip_path.exists():
                return False, "Arquivo não encontrado"

            # Verifica tamanho do arquivo
            file_size = zip_path.stat().st_size
            logger.debug(f"  → Tamanho do arquivo: {file_size:,} bytes")
            
            if file_size == 0:
                return False, "Arquivo vazio (0 bytes)"

            # Verifica se é um arquivo ZIP válido
            if not zipfile.is_zipfile(zip_path):
                return False, "Arquivo corrompido (não é um ZIP válido)"

            # Tenta abrir e verificar conteúdo
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # Primeiro verifica informações básicas do ZIP
                zip_info = zip_ref.infolist()
                logger.info(f"  → ZIP contém {len(zip_info)} entradas")
                
                # Se não tem nenhuma entrada, está realmente vazio
                if len(zip_info) == 0:
                    return False, "ZIP vazio (0 entradas)"
                
                # Testa integridade (pode ser None para ZIPs válidos)
                try:
                    bad_file = zip_ref.testzip()
                    if bad_file is not None:
                        logger.warning(f"  ⚠️  testzip() retornou: {bad_file}")
                except Exception as e:
                    logger.warning(f"  ⚠️  Erro ao testar ZIP (ignorando): {e}")
                
                # Verifica se tem arquivos com conteúdo real
                file_list = zip_ref.namelist()
                
                # Log detalhado de CADA entrada
                logger.info(f"  → Conteúdo do ZIP:")
                valid_files = []
                for i, info in enumerate(zip_info):
                    is_dir = info.filename.endswith('/')
                    logger.info(f"     [{i}] Nome: '{info.filename}' | Tamanho: {info.file_size:,} bytes | É pasta: {is_dir}")
                    
                    # Considera arquivo válido se não é pasta E tem tamanho > 0
                    if not is_dir and info.file_size > 0:
                        valid_files.append(info.filename)
                
                if len(valid_files) == 0:
                    logger.error(f"  → PROBLEMA: ZIP contém {len(file_list)} entradas, mas nenhum arquivo válido")
                    return False, "ZIP vazio (sem arquivos CSV)"

                # Mostra quais arquivos válidos foram encontrados
                logger.info(f"  ✓ Arquivos válidos encontrados: {len(valid_files)}")
                logger.info(f"  → Primeiro arquivo a ser extraído: '{valid_files[0]}'")

                return True, "OK"

        except zipfile.BadZipFile as e:
            return False, f"Arquivo corrompido (BadZipFile): {str(e)}"
        except Exception as e:
            logger.error(f"  → Exceção durante validação: {type(e).__name__}: {str(e)}")
            return False, f"Erro ao validar: {str(e)}"

    def extract_zip(self, zip_path: Path, max_retries: int = 3) -> Optional[Path]:
        """Extrai arquivo ZIP com retry automático em caso de falha"""

        # Validar arquivo primeiro
        is_valid, message = self.validate_zip_file(zip_path)

        if not is_valid:
            logger.error(f"❌ {zip_path.name}: {message}")
            
            # Tentar redownload automático
            logger.warning(f"\n🔄 Tentando corrigir automaticamente...")
            logger.warning(f"   (Não precisa fazer nada, aguarde...)\n")

            for attempt in range(1, max_retries + 1):
                logger.warning(f"🔄 Tentativa {attempt}/{max_retries}: Baixando {zip_path.name} novamente...")

                # Remover arquivo corrompido
                try:
                    zip_path.unlink()
                    logger.info(f"   → Arquivo corrompido removido")
                except:
                    pass

                # Tentar baixar novamente
                from src.etl.downloader import RFBDownloader
                downloader = RFBDownloader()

                # Buscar URL do arquivo
                logger.info(f"   → Procurando arquivo no servidor da Receita Federal...")
                files = downloader.list_available_files()
                file_info = next((f for f in files if f['name'] == zip_path.name), None)

                if file_info:
                    logger.info(f"   → Iniciando download...")
                    new_path = downloader.download_file(file_info['url'], zip_path.name)
                    if new_path:
                        # Validar novamente
                        logger.info(f"   → Validando arquivo baixado...")
                        is_valid, message = self.validate_zip_file(new_path)
                        if is_valid:
                            logger.info(f"✅ Sucesso! Arquivo baixado e validado na tentativa {attempt}")
                            break
                        else:
                            logger.error(f"❌ Tentativa {attempt} falhou: {message}")
                            if attempt < max_retries:
                                logger.warning(f"   → Aguardando 5 segundos antes da próxima tentativa...")
                                import time
                                time.sleep(5)
                else:
                    logger.error(f"❌ Arquivo {zip_path.name} não encontrado no servidor da Receita Federal")
                    logger.error(f"   → Você precisará baixar manualmente")
                    break

            # Se após todas as tentativas ainda está inválido
            if not is_valid:
                logger.error(f"\n")
                logger.error(f"{'='*80}")
                logger.error(f"❌ ATENÇÃO: ARQUIVO CORROMPIDO OU COM PROBLEMA")
                logger.error(f"{'='*80}")
                logger.error(f"")
                logger.error(f"📁 Arquivo: {zip_path.name}")
                logger.error(f"❌ Problema: {message}")
                logger.error(f"")
                logger.error(f"🔄 O sistema tentou baixar automaticamente {max_retries} vezes, mas não conseguiu.")
                logger.error(f"")
                logger.error(f"{'─'*80}")
                logger.error(f"✋ O QUE FAZER AGORA?")
                logger.error(f"{'─'*80}")
                logger.error(f"")
                logger.error(f"OPÇÃO 1 - AGUARDAR (Recomendado)")
                logger.error(f"  → O sistema vai pular este arquivo e continuar com os outros")
                logger.error(f"  → Você pode baixar este arquivo depois e processar separadamente")
                logger.error(f"")
                logger.error(f"OPÇÃO 2 - BAIXAR MANUALMENTE AGORA")
                logger.error(f"  1️⃣  Abra no navegador:")
                logger.error(f"     https://arquivos.receitafederal.gov.br/dados/cnpj/dados_abertos_cnpj/")
                logger.error(f"")
                logger.error(f"  2️⃣  Procure pela pasta mais recente (ex: 2025-10/)")
                logger.error(f"")
                logger.error(f"  3️⃣  Baixe o arquivo: {zip_path.name}")
                logger.error(f"")
                logger.error(f"  4️⃣  Coloque o arquivo baixado na pasta:")
                logger.error(f"     {self.download_dir.absolute()}")
                logger.error(f"")
                logger.error(f"  5️⃣  Clique em '▶️ Iniciar ETL' novamente")
                logger.error(f"     (O sistema vai reconhecer o arquivo novo automaticamente)")
                logger.error(f"")
                logger.error(f"{'='*80}")
                logger.error(f"💡 DICA: Se escolher aguardar, o processo vai continuar com os outros")
                logger.error(f"   arquivos. Você não vai perder nada do que já foi importado!")
                logger.error(f"{'='*80}\n")
                return None

        # Se chegou aqui, arquivo é válido - prosseguir com extração
        try:
            logger.info(f"Extraindo: {zip_path.name}")

            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                file_list = zip_ref.namelist()

                # Pegar o primeiro arquivo que não seja diretório
                for file_name in file_list:
                    # Ignorar pastas
                    if file_name.endswith('/'):
                        continue

                    extract_path = self.data_dir / file_name

                    if not extract_path.exists():
                        zip_ref.extract(file_name, self.data_dir)
                        logger.info(f"  ✓ Extraído: {file_name}")
                    else:
                        logger.info(f"  ✓ Já existe: {file_name}")

                    return extract_path

            logger.warning(f"  ⚠️ Nenhum arquivo encontrado em {zip_path.name}")
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

        # Iniciar rastreamento
        file_hash = self.tracker.calculate_file_hash(csv_path)
        if file_hash:
            status = self.tracker.check_file_status(csv_path, file_hash)
            if status == 'completed':
                logger.info(f"  ⏭️  Arquivo já processado anteriormente, pulando...")
                return  # Já processado

        file_id = self.tracker.start_file_processing(csv_path, 'empresas', table_name)
        if file_id is None:
            logger.info(f"  ⏭️  Arquivo já em processamento ou concluído, pulando...")
            return  # Já processado

        columns = [
            'cnpj_basico', 'razao_social', 'natureza_juridica',
            'qualificacao_responsavel', 'capital_social', 'porte_empresa',
            'ente_federativo_responsavel'
        ]

        try:
            total_imported = 0
            total_skipped = 0

            with db_manager.get_connection() as conn:
                cursor = conn.cursor()

                # Criar tabela temporária para importação
                cursor.execute(f"""
                    CREATE TEMP TABLE temp_{table_name} (LIKE {table_name} INCLUDING ALL)
                """)

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

                        # Validar qualificacao_responsavel
                        chunk['qualificacao_responsavel'] = chunk['qualificacao_responsavel'].apply(
                            lambda x: self.validate_foreign_key(x, 'qualificacoes_socios')
                        )

                        # Validar natureza_juridica
                        chunk['natureza_juridica'] = chunk['natureza_juridica'].apply(
                            lambda x: self.validate_foreign_key(x, 'naturezas_juridicas')
                        )

                        capital_social_series = pd.to_numeric(
                            chunk['capital_social'].str.replace(',', '.'),
                            errors='coerce'
                        )
                        chunk['capital_social'] = capital_social_series.fillna(0)

                        output = StringIO()
                        chunk.to_csv(output, sep=';', header=False, index=False)
                        output.seek(0)

                        # Importar para tabela temporária
                        copy_sql = f"COPY temp_{table_name} ({','.join(columns)}) FROM STDIN WITH CSV DELIMITER ';'"
                        cursor.copy_expert(copy_sql, output)

                # Inserir apenas os que não existem (ON CONFLICT DO NOTHING)
                cursor.execute(f"""
                    INSERT INTO {table_name} 
                    SELECT * FROM temp_{table_name}
                    ON CONFLICT (cnpj_basico) DO NOTHING
                """)
                
                total_imported = cursor.rowcount
                
                # Contar quantos foram pulados
                cursor.execute(f"SELECT COUNT(*) FROM temp_{table_name}")
                total_in_file = cursor.fetchone()[0]
                total_skipped = total_in_file - total_imported

                conn.commit()
                cursor.close()

            logger.info(f"  ✓ Importados: {total_imported} empresas")
            if total_skipped > 0:
                logger.info(f"  ⏭️  Ignorados (já existentes): {total_skipped} registros")

            # Finalizar rastreamento
            if file_id:
                self.tracker.finish_file_processing(file_id, 'completed', table_name)

        except Exception as e:
            logger.error(f"Erro ao importar empresas: {e}")
            if file_id:
                self.tracker.finish_file_processing(file_id, 'failed', table_name)

    def import_estabelecimentos(self, csv_path: Path):
        logger.info(f"Importando estabelecimentos de: {csv_path.name}")
        table_name = 'estabelecimentos'

        # Iniciar rastreamento
        file_hash = self.tracker.calculate_file_hash(csv_path)
        if file_hash:
            status = self.tracker.check_file_status(csv_path, file_hash)
            if status == 'completed':
                logger.info(f"  ⏭️  Arquivo já processado anteriormente, pulando...")
                return  # Já processado

        file_id = self.tracker.start_file_processing(csv_path, 'estabelecimentos', table_name)
        if file_id is None:
            logger.info(f"  ⏭️  Arquivo já em processamento ou concluído, pulando...")
            return  # Já processado

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
        # Nota: cnpj_completo é GENERATED ALWAYS, não pode ser inserido manualmente

        try:
            total_imported = 0
            total_skipped = 0

            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Criar tabela temporária
                cursor.execute(f"""
                    CREATE TEMP TABLE temp_{table_name} (LIKE {table_name} INCLUDING ALL)
                """)

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

                        # Validar foreign keys
                        chunk['motivo_situacao_cadastral'] = chunk['motivo_situacao_cadastral'].apply(
                            lambda x: self.validate_foreign_key(x, 'motivos_situacao_cadastral')
                        )
                        chunk['pais'] = chunk['pais'].apply(
                            lambda x: self.validate_foreign_key(x, 'paises')
                        )
                        chunk['cnae_fiscal_principal'] = chunk['cnae_fiscal_principal'].apply(
                            lambda x: self.validate_foreign_key(x, 'cnaes')
                        )
                        chunk['municipio'] = chunk['municipio'].apply(
                            lambda x: self.validate_foreign_key(x, 'municipios')
                        )

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

                        copy_sql = f"COPY temp_{table_name} ({','.join(columns)}) FROM STDIN WITH CSV DELIMITER ';'"
                        cursor.copy_expert(copy_sql, output)

                # Inserir apenas os que não existem
                cursor.execute(f"""
                    INSERT INTO {table_name} 
                    SELECT * FROM temp_{table_name}
                    ON CONFLICT (cnpj_basico, cnpj_ordem, cnpj_dv) DO NOTHING
                """)
                
                total_imported = cursor.rowcount
                
                cursor.execute(f"SELECT COUNT(*) FROM temp_{table_name}")
                total_in_file = cursor.fetchone()[0]
                total_skipped = total_in_file - total_imported

                conn.commit()
                cursor.close()

            logger.info(f"  ✓ Importados: {total_imported} estabelecimentos")
            if total_skipped > 0:
                logger.info(f"  ⏭️  Ignorados (já existentes): {total_skipped} registros")

            # Finalizar rastreamento
            if file_id:
                self.tracker.finish_file_processing(file_id, 'completed', table_name)

        except Exception as e:
            logger.error(f"Erro ao importar estabelecimentos: {e}")
            if file_id:
                self.tracker.finish_file_processing(file_id, 'failed', table_name)

    def import_socios(self, csv_path: Path):
        logger.info(f"Importando sócios de: {csv_path.name}")
        table_name = 'socios'

        # Iniciar rastreamento
        file_hash = self.tracker.calculate_file_hash(csv_path)
        if file_hash:
            status = self.tracker.check_file_status(csv_path, file_hash)
            if status == 'completed':
                logger.info(f"  ⏭️  Arquivo já processado anteriormente, pulando...")
                return  # Já processado

        file_id = self.tracker.start_file_processing(csv_path, 'socios', table_name)
        if file_id is None:
            logger.info(f"  ⏭️  Arquivo já em processamento ou concluído, pulando...")
            return  # Já processado

        columns = [
            'cnpj_basico', 'identificador_socio', 'nome_socio', 'cnpj_cpf_socio',
            'qualificacao_socio', 'data_entrada_sociedade', 'pais',
            'representante_legal', 'nome_representante', 'qualificacao_representante',
            'faixa_etaria'
        ]

        try:
            total_imported = 0
            total_skipped = 0

            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute(f"""
                    CREATE TEMP TABLE temp_{table_name} (LIKE {table_name} INCLUDING ALL)
                """)

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

                        # Validar foreign keys
                        chunk['qualificacao_socio'] = chunk['qualificacao_socio'].apply(
                            lambda x: self.validate_foreign_key(x, 'qualificacoes_socios')
                        )
                        chunk['qualificacao_representante'] = chunk['qualificacao_representante'].apply(
                            lambda x: self.validate_foreign_key(x, 'qualificacoes_socios')
                        )
                        chunk['pais'] = chunk['pais'].apply(
                            lambda x: self.validate_foreign_key(x, 'paises')
                        )

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

                        copy_sql = f"COPY temp_{table_name} ({','.join(columns)}) FROM STDIN WITH CSV DELIMITER ';'"
                        cursor.copy_expert(copy_sql, output)

                # Inserir apenas os que não existem
                cursor.execute(f"""
                    INSERT INTO {table_name} 
                    SELECT * FROM temp_{table_name}
                    ON CONFLICT (cnpj_basico, identificador_socio, cnpj_cpf_socio) DO NOTHING
                """)
                
                total_imported = cursor.rowcount
                
                cursor.execute(f"SELECT COUNT(*) FROM temp_{table_name}")
                total_in_file = cursor.fetchone()[0]
                total_skipped = total_in_file - total_imported

                conn.commit()
                cursor.close()

            logger.info(f"  ✓ Importados: {total_imported} sócios")
            if total_skipped > 0:
                logger.info(f"  ⏭️  Ignorados (já existentes): {total_skipped} registros")

            # Finalizar rastreamento
            if file_id:
                self.tracker.finish_file_processing(file_id, 'completed', table_name)

        except Exception as e:
            logger.error(f"Erro ao importar sócios: {e}")
            if file_id:
                self.tracker.finish_file_processing(file_id, 'failed', table_name)

    def import_simples(self, csv_path: Path):
        logger.info(f"Importando Simples Nacional de: {csv_path.name}")
        table_name = 'simples_nacional'

        # Iniciar rastreamento
        file_hash = self.tracker.calculate_file_hash(csv_path)
        if file_hash:
            status = self.tracker.check_file_status(csv_path, file_hash)
            if status == 'completed':
                logger.info(f"  ⏭️  Arquivo já processado anteriormente, pulando...")
                return  # Já processado

        file_id = self.tracker.start_file_processing(csv_path, 'simples_nacional', table_name)
        if file_id is None:
            logger.info(f"  ⏭️  Arquivo já em processamento ou concluído, pulando...")
            return  # Já processado

        columns = [
            'cnpj_basico', 'opcao_simples', 'data_opcao_simples',
            'data_exclusao_simples', 'opcao_mei', 'data_opcao_mei',
            'data_exclusao_mei'
        ]

        try:
            total_imported = 0
            total_skipped = 0

            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute(f"""
                    CREATE TEMP TABLE temp_{table_name} (LIKE {table_name} INCLUDING ALL)
                """)

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

                        copy_sql = f"COPY temp_{table_name} ({','.join(columns)}) FROM STDIN WITH CSV DELIMITER ';'"
                        cursor.copy_expert(copy_sql, output)

                # Inserir apenas os que não existem
                cursor.execute(f"""
                    INSERT INTO {table_name} 
                    SELECT * FROM temp_{table_name}
                    ON CONFLICT (cnpj_basico) DO NOTHING
                """)
                
                total_imported = cursor.rowcount
                
                cursor.execute(f"SELECT COUNT(*) FROM temp_{table_name}")
                total_in_file = cursor.fetchone()[0]
                total_skipped = total_in_file - total_imported

                conn.commit()
                cursor.close()

            logger.info(f"  ✓ Importados: {total_imported} registros Simples")
            if total_skipped > 0:
                logger.info(f"  ⏭️  Ignorados (já existentes): {total_skipped} registros")

            # Finalizar rastreamento
            if file_id:
                self.tracker.finish_file_processing(file_id, 'completed', table_name)

        except Exception as e:
            logger.error(f"Erro ao importar Simples Nacional: {e}")
            if file_id:
                self.tracker.finish_file_processing(file_id, 'failed', table_name)

    def process_all(self, downloaded_files: dict, skip_types: list = None):
        """
        Processa arquivos de importação
        
        Args:
            downloaded_files: Dicionário com arquivos baixados
            skip_types: Lista de tipos para PULAR (ex: ['empresas'])
        """
        skip_types = skip_types or []
        
        logger.info("\n" + "="*70)
        logger.info("INICIANDO PROCESSO DE IMPORTAÇÃO")
        logger.info("="*70 + "\n")
        
        if skip_types:
            logger.info(f"⏭️  PULANDO tipos: {', '.join(skip_types)}")
            logger.info("")

        for file_type, table_name in self.import_order:
            # Pula tipos especificados
            if file_type in skip_types:
                count = db_manager.get_table_count(table_name)
                logger.info(f"\n⏭️  PULANDO: {file_type} ({count:,} registros já existentes)")
                continue
            
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