#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKER_SCRIPT="$PROJECT_DIR/run_email_worker.py"
LOG_DIR="$PROJECT_DIR/logs"
WORKER_LOG="$LOG_DIR/email_worker.log"
ERROR_LOG="$LOG_DIR/email_worker_error.log"
CRON_MARKER="# DB Empresas Email Worker"

echo "=========================================="
echo "Configurador de Cron - DB Empresas"
echo "Email Worker - Sistema Automático"
echo "=========================================="
echo ""

mkdir -p "$LOG_DIR"

if [ ! -f "$WORKER_SCRIPT" ]; then
    echo "❌ ERRO: Script do worker não encontrado: $WORKER_SCRIPT"
    exit 1
fi

chmod +x "$WORKER_SCRIPT"
echo "✅ Permissões de execução configuradas no worker"

if ! command -v python3 &> /dev/null; then
    echo "❌ ERRO: Python3 não está instalado"
    exit 1
fi

echo "✅ Python3 encontrado: $(python3 --version)"

current_cron=$(crontab -l 2>/dev/null || true)

if echo "$current_cron" | grep -q "$CRON_MARKER"; then
    echo "⚠️  Entrada de cron já existe. Removendo entrada antiga..."
    echo "$current_cron" | grep -v "$CRON_MARKER" | grep -v "run_email_worker.py" | crontab - 2>/dev/null || true
fi

cron_entry="0 * * * * cd $PROJECT_DIR && /usr/bin/python3 $WORKER_SCRIPT >> $WORKER_LOG 2>> $ERROR_LOG $CRON_MARKER"

(crontab -l 2>/dev/null || true; echo "$cron_entry") | crontab -

echo "✅ Cron configurado com sucesso!"
echo ""
echo "Configuração aplicada:"
echo "  📅 Frequência: A cada 1 hora (minuto 0)"
echo "  📂 Diretório: $PROJECT_DIR"
echo "  🐍 Python: /usr/bin/python3"
echo "  📝 Log de saída: $WORKER_LOG"
echo "  ❌ Log de erros: $ERROR_LOG"
echo ""

if command -v systemctl &> /dev/null; then
    if systemctl is-active --quiet cron || systemctl is-active --quiet crond; then
        echo "✅ Serviço cron está ativo"
    else
        echo "⚠️  Serviço cron não está ativo. Tentando iniciar..."
        sudo systemctl start cron 2>/dev/null || sudo systemctl start crond 2>/dev/null || echo "⚠️  Não foi possível iniciar o cron automaticamente. Inicie manualmente."
    fi
fi

echo ""
echo "=========================================="
echo "✨ Configuração Concluída!"
echo "=========================================="
echo ""
echo "📋 Próximos passos:"
echo "  1. Verificar cron: crontab -l"
echo "  2. Testar manualmente: python3 $WORKER_SCRIPT"
echo "  3. Monitorar logs: tail -f $WORKER_LOG"
echo "  4. Ver erros: tail -f $ERROR_LOG"
echo ""
echo "🔄 O worker será executado automaticamente a cada 1 hora"
echo "📧 Processará follow-ups e notificações de uso"
echo ""
