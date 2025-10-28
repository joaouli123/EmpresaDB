#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKER_SCRIPT="$PROJECT_DIR/run_email_worker.py"
SERVICE_FILE="/etc/systemd/system/email-worker.service"
TIMER_FILE="/etc/systemd/system/email-worker.timer"

echo "=========================================="
echo "Configurador de Systemd Timer"
echo "DB Empresas - Email Worker"
echo "=========================================="
echo ""

if [ "$EUID" -ne 0 ]; then 
    echo "❌ Este script precisa ser executado como root (sudo)"
    exit 1
fi

if [ ! -f "$WORKER_SCRIPT" ]; then
    echo "❌ ERRO: Script do worker não encontrado: $WORKER_SCRIPT"
    exit 1
fi

CURRENT_USER=$(logname || echo $SUDO_USER)
if [ -z "$CURRENT_USER" ]; then
    echo "❌ ERRO: Não foi possível determinar o usuário"
    exit 1
fi

echo "✅ Usuário detectado: $CURRENT_USER"
echo "✅ Diretório do projeto: $PROJECT_DIR"

cat > "$SERVICE_FILE" << EOF
[Unit]
Description=DB Empresas Email Worker
After=network.target postgresql.service

[Service]
Type=oneshot
User=$CURRENT_USER
WorkingDirectory=$PROJECT_DIR
Environment="PATH=/usr/bin:/usr/local/bin"
ExecStart=/usr/bin/python3 $WORKER_SCRIPT
StandardOutput=append:$PROJECT_DIR/logs/email_worker.log
StandardError=append:$PROJECT_DIR/logs/email_worker_error.log

Restart=on-failure
RestartSec=5m

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Service file criado: $SERVICE_FILE"

cat > "$TIMER_FILE" << EOF
[Unit]
Description=Timer para Email Worker (executa a cada 1 hora)
Requires=email-worker.service

[Timer]
OnBootSec=5min
OnUnitActiveSec=1h
AccuracySec=1min

[Install]
WantedBy=timers.target
EOF

echo "✅ Timer file criado: $TIMER_FILE"

mkdir -p "$PROJECT_DIR/logs"
chown -R $CURRENT_USER:$CURRENT_USER "$PROJECT_DIR/logs"

systemctl daemon-reload
echo "✅ Systemd recarregado"

systemctl enable email-worker.timer
echo "✅ Timer habilitado para iniciar no boot"

systemctl start email-worker.timer
echo "✅ Timer iniciado"

echo ""
echo "=========================================="
echo "✨ Configuração Concluída!"
echo "=========================================="
echo ""
echo "📋 Comandos úteis:"
echo "  Status do timer:  systemctl status email-worker.timer"
echo "  Status do worker: systemctl status email-worker.service"
echo "  Logs do systemd:  journalctl -u email-worker.service -f"
echo "  Próxima execução: systemctl list-timers email-worker.timer"
echo "  Parar timer:      systemctl stop email-worker.timer"
echo "  Iniciar timer:    systemctl start email-worker.timer"
echo "  Executar agora:   systemctl start email-worker.service"
echo ""
echo "🔄 O worker será executado:"
echo "  - 5 minutos após o boot"
echo "  - A cada 1 hora continuamente"
echo ""
