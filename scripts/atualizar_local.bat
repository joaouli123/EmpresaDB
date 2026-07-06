@echo off
REM ============================================================
REM  Atualizacao mensal da base CNPJ RODANDO NO SEU PC
REM  (em vez do worker do Railway — economiza o custo de compute)
REM
REM  O PC baixa os zips da Casa dos Dados, extrai e faz o COPY
REM  direto no Postgres do Railway (upload via internet). O
REM  Postgres ainda faz o trabalho de indexacao (inevitavel).
REM
REM  REQUISITOS (uma vez so):
REM   1. Python 3.12 instalado (ja tem)
REM   2. pip install psycopg2-binary requests
REM   3. Criar o arquivo scripts\.env.etl.bat com UMA linha:
REM        set DATABASE_URL=<DATABASE_PUBLIC_URL do servico Postgres>
REM      (pegue no Railway > Postgres > Variables > DATABASE_PUBLIC_URL)
REM      Esse arquivo esta no .gitignore — NUNCA sera commitado.
REM
REM  IMPORTANTE: se rodar pelo PC, deixe o cron do servico
REM  cnpj-etl-mensal DESLIGADO no Railway (senao rodam os dois).
REM ============================================================
setlocal
cd /d "%~dp0.."

if not exist scripts\.env.etl.bat (
  echo [ERRO] Crie o arquivo scripts\.env.etl.bat com: set DATABASE_URL=...
  exit /b 1
)
call scripts\.env.etl.bat

echo [%date% %time%] Iniciando atualizacao da base CNPJ...
python atualizar_mensal.py >> scripts\atualizacao_local.log 2>&1
if errorlevel 1 (
  echo [%date% %time%] FALHOU — veja scripts\atualizacao_local.log
  exit /b 1
)
echo [%date% %time%] Concluido com sucesso. Log: scripts\atualizacao_local.log
endlocal
