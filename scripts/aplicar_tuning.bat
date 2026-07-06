@echo off
REM ============================================================
REM  Aplica o tuning de memoria do Postgres do Railway (1x so).
REM  Usa o MESMO arquivo scripts\.env.etl.bat do ETL local.
REM  Depois de rodar: reinicie o servico Postgres no Railway
REM  (Deploy > ... > Restart) para o shared_buffers valer.
REM ============================================================
setlocal
cd /d "%~dp0.."

if not exist scripts\.env.etl.bat (
  echo [ERRO] Crie scripts\.env.etl.bat com: set DATABASE_URL=^<DATABASE_PUBLIC_URL^>
  pause
  exit /b 1
)
call scripts\.env.etl.bat

python scripts\db_tune.py
echo.
echo Pronto. Agora reinicie o Postgres no Railway para aplicar o shared_buffers.
pause
endlocal
