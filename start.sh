#!/bin/sh
# Dispatcher de start: a API web e o worker de ETL compartilham a MESMA imagem.
# A variavel RUN_MODE define o papel do container. Default = api (comportamento atual).
case "${RUN_MODE:-api}" in
  etl)
    echo "[start] RUN_MODE=etl -> python atualizar_mensal.py"
    exec python atualizar_mensal.py
    ;;
  verify)
    echo "[start] RUN_MODE=verify -> python verify_import.py"
    exec python verify_import.py
    ;;
  *)
    echo "[start] RUN_MODE=api -> gunicorn"
    exec gunicorn src.api.main:app -k uvicorn.workers.UvicornWorker -w "${WEB_CONCURRENCY:-3}" -b "0.0.0.0:${PORT:-8000}" --timeout 120 --graceful-timeout 30
    ;;
esac
