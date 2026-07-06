#!/bin/sh
# Dispatcher de start: a API web e o worker de ETL compartilham a MESMA imagem.
# A variavel RUN_MODE define o papel do container. Default = api (comportamento atual).
case "${RUN_MODE:-api}" in
  etl)
    echo "[start] RUN_MODE=etl -> python atualizar_mensal.py"
    # CUSTO: NAO usar exec e SEMPRE sair com 0. Se o ETL falhar e o processo
    # sair com erro, o restart policy do Railway reroda o import inteiro em
    # loop (download+carga+indices de novo) — foi isso que gerou a conta de
    # ~US$80 em jun/2026 (4 rodadas). Falha agora = log alto + exit 0; a
    # proxima tentativa e so no proximo cron.
    python atualizar_mensal.py
    rc=$?
    if [ "$rc" -ne 0 ]; then
      echo "[start] !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
      echo "[start] !!! ETL FALHOU (exit $rc) — NAO sera rerodado automaticamente."
      echo "[start] !!! Verifique os logs acima e rode manualmente se necessario."
      echo "[start] !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    fi
    exit 0
    ;;
  verify)
    echo "[start] RUN_MODE=verify -> python verify_import.py"
    exec python verify_import.py
    ;;
  *)
    echo "[start] RUN_MODE=api -> gunicorn"
    exec gunicorn src.api.main:app -k uvicorn.workers.UvicornWorker -w "${WEB_CONCURRENCY:-4}" -b "0.0.0.0:${PORT:-8000}" --timeout 120 --graceful-timeout 30 --keep-alive 15
    ;;
esac
