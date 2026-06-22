#!/usr/bin/env python3
"""
Importa os dados CNPJ a partir dos arquivos JÁ BAIXADOS em ./downloads,
SEM depender do site da Receita Federal (mais robusto para re-importação).

Pré-requisitos:
    - Tabelas já criadas: python setup_database.py --stage all
    - DATABASE_URL apontando para o banco destino.

Uso:
    DATABASE_URL=postgresql://... python run_import_local.py
    # ou um subconjunto:
    DATABASE_URL=... python run_import_local.py --only empresas,estabelecimentos
"""
import sys
import argparse
import logging
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

from src.etl.downloader import RFBDownloader
from src.etl.importer import CNPJImporter
from src.config import settings

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger("import_local")

ALL_TYPES = [
    'tabela_auxiliar_cnaes', 'tabela_auxiliar_municipios',
    'tabela_auxiliar_motivos', 'tabela_auxiliar_naturezas',
    'tabela_auxiliar_paises', 'tabela_auxiliar_qualificacoes',
    'empresas', 'estabelecimentos', 'socios', 'simples_nacional',
]


def build_local_file_map(download_dir: Path) -> dict:
    """Varre ./downloads e classifica cada .zip pelo tipo (igual ao downloader)."""
    classifier = RFBDownloader()
    files = {t: [] for t in ALL_TYPES}
    for zip_path in sorted(download_dir.glob("*.zip")):
        ftype = classifier._classify_file(zip_path.name)
        if ftype in files:
            files[ftype].append(str(zip_path))
    return files


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--only", help="lista de tipos separada por vírgula (ex.: empresas,socios)")
    args = p.parse_args()

    download_dir = Path(settings.DOWNLOAD_DIR)
    file_map = build_local_file_map(download_dir)

    if args.only:
        keep = set(s.strip() for s in args.only.split(","))
        file_map = {k: (v if k in keep else []) for k, v in file_map.items()}

    log.info("Banco destino: %s", settings.database_url.split("@")[-1])
    total = sum(len(v) for v in file_map.values())
    log.info("Arquivos locais encontrados: %d", total)
    for t, v in file_map.items():
        if v:
            log.info("  %-32s %d arquivo(s)", t, len(v))

    if total == 0:
        log.error("Nenhum .zip em %s — nada a importar.", download_dir)
        sys.exit(1)

    importer = CNPJImporter()
    importer.process_all(file_map)
    log.info("IMPORTAÇÃO LOCAL CONCLUÍDA.")


if __name__ == "__main__":
    main()
