======================================================================
DIAGNÓSTICO DE CONFIGURAÇÃO
======================================================================

1. Procurando arquivo .env em: C:\Users\joao lucas\Downloads\windows\windows\.env
   Arquivo existe? True

2. DATABASE_URL lida do .env:
   postgresql://postgres:Proelast1608%40@72.61.217.143:5432/cnpj_db

3. Parse da URL:
   Usuário: postgres
   Senha: ***************
   Host: 72.61.217.143
   Porta: 5432
   Banco: cnpj_db

✅ Configuração OK!
   Todas as informações foram extraídas corretamente.

   Agora tente conectar com:
   python -c "import psycopg2; psycopg2.connect(host='72.61.217.143', port=5432, database='cnpj_db', user='postgres', password='Proelast1608%40'); print('✅ Conexão OK!')"

======================================================================

Pressione ENTER para sair...


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
python -m pip install -r requirements.txt

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
