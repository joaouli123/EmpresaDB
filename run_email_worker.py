#!/usr/bin/env python3
"""
Script para executar o worker de emails
Execute este script periodicamente (a cada 1 hora) via cron ou agendador

Exemplo de uso:
    python run_email_worker.py

Configuração de cron (executar a cada 1 hora):
    0 * * * * cd /path/to/project && python run_email_worker.py >> /var/log/email_worker.log 2>&1
"""
import asyncio
import sys
import logging
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from src.workers.email_followup_worker import main

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Worker interrompido pelo usuário")
        sys.exit(0)
    except Exception as e:
        logging.error(f"Erro fatal no worker: {e}")
        sys.exit(1)
