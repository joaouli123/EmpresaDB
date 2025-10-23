@echo off
echo ========================================
echo INSTALADOR - Sistema CNPJ Windows
echo ========================================
echo.

echo [1/3] Verificando Python...
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
echo [2/3] Instalando dependencias...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo.
echo [3/3] Criando pastas necessarias...
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
