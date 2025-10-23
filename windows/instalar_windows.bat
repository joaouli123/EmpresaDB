@echo off
echo ========================================
echo INSTALADOR - Sistema CNPJ Windows
echo ========================================
echo.

echo [1/4] Verificando Python...
python --version
if errorlevel 1 (
    echo.
    echo ERRO: Python nao encontrado!
    echo Baixe em: https://www.python.org/downloads/
    echo Marque a opcao "Add Python to PATH" na instalacao
    pause
    exit /b 1
)

echo.
echo [2/4] Atualizando pip...
python -m pip install --upgrade pip

echo.
echo [3/4] Instalando dependencias (pode demorar 2-5 minutos)...
python -m pip install --only-binary :all: psycopg2-binary || python -m pip install psycopg2-binary
python -m pip install fastapi uvicorn[standard] sqlalchemy pandas requests python-dotenv tqdm pydantic beautifulsoup4 lxml

echo.
echo [4/4] Criando pastas necessarias...
if not exist "downloads" mkdir downloads
if not exist "data" mkdir data
if not exist "logs" mkdir logs

echo.
echo ========================================
echo INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo Proximos passos:
echo 1. Copie .env.exemplo para .env
echo 2. Edite .env e configure DATABASE_URL
echo 3. Execute: rodar_etl.bat
echo.
pause
