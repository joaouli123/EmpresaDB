#!/usr/bin/env python3
"""
Downloader do novo repositório de dados abertos CNPJ da Receita Federal (SERPRO+).

A Receita migrou (fim de jan/2026) para um compartilhamento Nextcloud:
  https://arquivos.receitafederal.gov.br/index.php/s/<TOKEN>
A URL antiga (/dados/cnpj/dados_abertos_cnpj/) está MORTA (404).

Acesso programático via WebDAV do share público:
  base:  https://arquivos.receitafederal.gov.br/public.php/webdav/
  login: usuário = TOKEN do share, senha = vazia
  estrutura: pastas mensais AAAA-MM/ contendo os 37 .zip

O TOKEN é configurável por env RFB_SHARE_TOKEN (caso a Receita rotacione o link).
"""
import os
import re
import time
import logging
from pathlib import Path
from urllib.parse import unquote, quote

import requests
from requests.auth import HTTPBasicAuth

logger = logging.getLogger(__name__)

WEBDAV_BASE = "https://arquivos.receitafederal.gov.br/public.php/webdav"
DEFAULT_TOKEN = "YggdBLfdninEJX9"


class SerproDownloader:
    def __init__(self, token: str = None, download_dir: str = "downloads"):
        self.token = token or os.getenv("RFB_SHARE_TOKEN", DEFAULT_TOKEN)
        self.auth = HTTPBasicAuth(self.token, "")
        self.download_dir = Path(download_dir)
        self.download_dir.mkdir(parents=True, exist_ok=True)

    def _propfind(self, url: str):
        r = requests.request("PROPFIND", url, auth=self.auth,
                             headers={"Depth": "1"}, timeout=60)
        r.raise_for_status()
        return [unquote(h) for h in re.findall(r"<d:href>(.*?)</d:href>", r.text)]

    def get_latest_folder(self) -> str:
        """Retorna a pasta mensal mais recente, ex.: '2026-06'."""
        hrefs = self._propfind(WEBDAV_BASE + "/")
        months = sorted({m for h in hrefs for m in re.findall(r"/(\d{4}-\d{2})/", h)})
        if not months:
            raise RuntimeError("Nenhuma pasta mensal encontrada no repositório SERPRO+")
        logger.info("📅 Pasta mais recente: %s", months[-1])
        return months[-1]

    def list_zip_files(self, folder: str):
        hrefs = self._propfind(f"{WEBDAV_BASE}/{folder}/")
        return sorted({h.split("/")[-1] for h in hrefs if h.endswith(".zip")})

    def download_file(self, folder: str, filename: str, max_retries: int = 5) -> Path:
        dest = self.download_dir / filename
        if dest.exists() and dest.stat().st_size > 0:
            logger.info("  já existe (pulando): %s", filename)
            return dest
        url = f"{WEBDAV_BASE}/{folder}/{quote(filename)}"
        tmp = dest.with_suffix(dest.suffix + ".part")
        last_err = None
        for attempt in range(1, max_retries + 1):
            try:
                # Retoma de onde parou (HTTP Range) se já houver um .part parcial
                pos = tmp.stat().st_size if tmp.exists() else 0
                headers = {"Range": f"bytes={pos}-"} if pos else {}
                logger.info("  baixando: %s (tentativa %d/%d, offset %.1f MB)",
                            filename, attempt, max_retries, pos / 1e6)
                with requests.get(url, auth=self.auth, stream=True, timeout=1800, headers=headers) as r:
                    mode = "ab" if pos else "wb"
                    # Se o servidor ignorou o Range (200 em vez de 206), recomeça do zero
                    if pos and r.status_code == 200:
                        mode = "wb"
                    r.raise_for_status()
                    with open(tmp, mode) as f:
                        for chunk in r.iter_content(1024 * 1024):
                            if chunk:
                                f.write(chunk)
                tmp.rename(dest)
                logger.info("  ✓ %s (%.1f MB)", filename, dest.stat().st_size / 1e6)
                return dest
            except Exception as e:
                last_err = e
                logger.warning("  ⚠ falha parcial em %s (tentativa %d/%d): %s",
                               filename, attempt, max_retries, str(e)[:100])
                time.sleep(min(8 * attempt, 40))
        raise RuntimeError(f"Falha ao baixar {filename} após {max_retries} tentativas: {last_err}")

    def download_latest(self, only: list = None) -> dict:
        """Baixa todos os .zip da pasta mais recente. only = lista de prefixos (ex.: ['Empresas']).

        Se QUALQUER arquivo falhar após todas as retentativas, levanta exceção — assim a
        atualização aborta ANTES de truncar o banco, evitando carga incompleta.
        """
        folder = self.get_latest_folder()
        files = self.list_zip_files(folder)
        if only:
            files = [f for f in files if any(f.startswith(p) for p in only)]
        logger.info("Pasta %s: %d arquivo(s) a baixar", folder, len(files))
        out = {"folder": folder, "files": []}
        for fn in files:
            p = self.download_file(folder, fn)  # lança se esgotar as retentativas
            out["files"].append(str(p))
        logger.info("✓ Todos os %d arquivos baixados com sucesso", len(files))
        return out


def main():
    import argparse
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    p = argparse.ArgumentParser(description="Download CNPJ (SERPRO+)")
    p.add_argument("--list", action="store_true", help="apenas listar a pasta mais recente")
    p.add_argument("--only", help="prefixos separados por vírgula (ex.: Empresas,Socios)")
    args = p.parse_args()

    d = SerproDownloader()
    if args.list:
        folder = d.get_latest_folder()
        files = d.list_zip_files(folder)
        print(f"Pasta {folder}: {len(files)} arquivos")
        for f in files:
            print("  ", f)
        return
    only = [s.strip() for s in args.only.split(",")] if args.only else None
    res = d.download_latest(only=only)
    print(f"Baixados {len(res['files'])} arquivos da pasta {res['folder']}")


if __name__ == "__main__":
    main()
