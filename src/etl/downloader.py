import os
import requests
from pathlib import Path
import logging
from tqdm import tqdm
from typing import List, Optional
from bs4 import BeautifulSoup
import re
from src.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RFBDownloader:
    def __init__(self):
        self.base_url = settings.RFB_BASE_URL
        self.download_dir = Path(settings.DOWNLOAD_DIR)
        self.download_dir.mkdir(parents=True, exist_ok=True)
    
    def list_available_files(self) -> List[dict]:
        logger.info(f"Listando arquivos disponíveis em: {self.base_url}")
        try:
            response = requests.get(self.base_url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            files = []
            
            for link in soup.find_all('a'):
                href = link.get('href')
                if href and isinstance(href, str) and href.endswith('.zip'):
                    file_info = {
                        'name': href,
                        'url': self.base_url + href,
                        'type': self._classify_file(href)
                    }
                    files.append(file_info)
            
            files.sort(key=lambda x: x['name'], reverse=True)
            
            logger.info(f"Encontrados {len(files)} arquivos ZIP")
            return files
            
        except Exception as e:
            logger.error(f"Erro ao listar arquivos: {e}")
            return []
    
    def _classify_file(self, filename: str) -> str:
        filename_lower = filename.lower()
        
        if 'cnaes' in filename_lower or 'cnae' in filename_lower:
            return 'tabela_auxiliar_cnaes'
        elif 'munic' in filename_lower:
            return 'tabela_auxiliar_municipios'
        elif 'motiv' in filename_lower:
            return 'tabela_auxiliar_motivos'
        elif 'natur' in filename_lower:
            return 'tabela_auxiliar_naturezas'
        elif 'pais' in filename_lower or 'paises' in filename_lower:
            return 'tabela_auxiliar_paises'
        elif 'quals' in filename_lower or 'qualific' in filename_lower:
            return 'tabela_auxiliar_qualificacoes'
        elif 'simples' in filename_lower or 'simei' in filename_lower:
            return 'simples_nacional'
        elif 'empresa' in filename_lower and 'estabelec' not in filename_lower:
            return 'empresas'
        elif 'estabelec' in filename_lower:
            return 'estabelecimentos'
        elif 'socio' in filename_lower:
            return 'socios'
        else:
            return 'outros'
    
    def download_file(self, url: str, filename: str) -> Optional[Path]:
        filepath = self.download_dir / filename
        
        if filepath.exists():
            logger.info(f"Arquivo já existe: {filename}")
            return filepath
        
        try:
            logger.info(f"Baixando: {filename}")
            response = requests.get(url, stream=True, timeout=300)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            
            with open(filepath, 'wb') as f, tqdm(
                total=total_size,
                unit='iB',
                unit_scale=True,
                desc=filename
            ) as pbar:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        pbar.update(len(chunk))
            
            logger.info(f"Download concluído: {filename}")
            return filepath
            
        except Exception as e:
            logger.error(f"Erro ao baixar {filename}: {e}")
            if filepath.exists():
                filepath.unlink()
            return None
    
    def download_latest_files(self, file_types: Optional[List[str]] = None) -> dict:
        all_files = self.list_available_files()
        
        if not all_files:
            logger.error("Nenhum arquivo encontrado!")
            return {}
        
        if file_types is None:
            file_types = [
                'tabela_auxiliar_cnaes',
                'tabela_auxiliar_municipios',
                'tabela_auxiliar_motivos',
                'tabela_auxiliar_naturezas',
                'tabela_auxiliar_paises',
                'tabela_auxiliar_qualificacoes',
                'empresas',
                'estabelecimentos',
                'socios',
                'simples_nacional'
            ]
        
        downloaded_files = {ft: [] for ft in file_types}
        
        for file_type in file_types:
            matching_files = [f for f in all_files if f['type'] == file_type]
            
            logger.info(f"\nTipo: {file_type} - Encontrados {len(matching_files)} arquivos")
            
            for file_info in matching_files:
                filepath = self.download_file(file_info['url'], file_info['name'])
                if filepath:
                    downloaded_files[file_type].append(str(filepath))
        
        total_downloaded = sum(len(files) for files in downloaded_files.values())
        logger.info(f"\n✓ Total de arquivos baixados: {total_downloaded}")
        
        return downloaded_files

def main():
    downloader = RFBDownloader()
    
    logger.info("Iniciando download dos arquivos da Receita Federal...")
    logger.info("Priorizando dados mais recentes disponíveis\n")
    
    files = downloader.download_latest_files()
    
    logger.info("\nResumo dos downloads:")
    for file_type, file_list in files.items():
        logger.info(f"  {file_type}: {len(file_list)} arquivos")
    
    return files

if __name__ == "__main__":
    main()
