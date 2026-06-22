# Configuração Automática do Cron - Email Worker

## 🎯 Objetivo

Configurar o worker de emails para executar **automaticamente a cada 1 hora**, processando:
- Follow-ups de assinaturas vencidas (5 tentativas a cada 3 dias)
- Notificações de uso (50% e 80% da cota mensal)

## 🚀 Opção 1: Cron Tradicional (Recomendado para maioria dos casos)

### Instalação Automática

Execute o script de setup:

```bash
chmod +x setup_cron.sh
./setup_cron.sh
```

O script irá:
- ✅ Verificar se o Python3 está instalado
- ✅ Configurar permissões de execução
- ✅ Criar entrada no crontab (executar a cada 1 hora)
- ✅ Configurar logs automáticos
- ✅ Remover duplicatas se já existir configuração anterior

### Verificar se está funcionando

```bash
# Ver configuração do cron
crontab -l

# Testar manualmente
python3 run_email_worker.py

# Monitorar logs em tempo real
tail -f logs/email_worker.log

# Ver erros
tail -f logs/email_worker_error.log
```

### Modificar Frequência (Opcional)

Se quiser alterar a frequência de execução:

```bash
# Editar crontab
crontab -e

# Exemplos de frequências:
# A cada 30 minutos:
*/30 * * * * cd /path/to/project && /usr/bin/python3 run_email_worker.py >> logs/email_worker.log 2>> logs/email_worker_error.log

# A cada 3 horas:
0 */3 * * * cd /path/to/project && /usr/bin/python3 run_email_worker.py >> logs/email_worker.log 2>> logs/email_worker_error.log

# A cada 6 horas:
0 */6 * * * cd /path/to/project && /usr/bin/python3 run_email_worker.py >> logs/email_worker.log 2>> logs/email_worker_error.log

# Duas vezes ao dia (6h e 18h):
0 6,18 * * * cd /path/to/project && /usr/bin/python3 run_email_worker.py >> logs/email_worker.log 2>> logs/email_worker_error.log
```

## 🔧 Opção 2: Systemd Timer (Mais robusto, recomendado para produção)

### Instalação Automática

Execute o script de setup (requer sudo):

```bash
chmod +x setup_systemd_timer.sh
sudo ./setup_systemd_timer.sh
```

O script irá:
- ✅ Criar service file (`/etc/systemd/system/email-worker.service`)
- ✅ Criar timer file (`/etc/systemd/system/email-worker.timer`)
- ✅ Configurar restart automático em caso de falha
- ✅ Habilitar execução no boot
- ✅ Iniciar o timer imediatamente

### Vantagens do Systemd Timer

- 🔄 **Reinício automático**: Se o worker falhar, reinicia após 5 minutos
- 📊 **Logs centralizados**: Integrado com journalctl
- ⏰ **Execução no boot**: Garante que o worker inicie após reiniciar o servidor
- 🎯 **Mais preciso**: Melhor controle de timing que cron

### Verificar Status

```bash
# Status do timer
systemctl status email-worker.timer

# Status do worker
systemctl status email-worker.service

# Ver quando será a próxima execução
systemctl list-timers email-worker.timer

# Ver logs em tempo real
journalctl -u email-worker.service -f

# Ver logs das últimas 24h
journalctl -u email-worker.service --since "24 hours ago"
```

### Controlar o Worker

```bash
# Parar o timer
sudo systemctl stop email-worker.timer

# Iniciar o timer
sudo systemctl start email-worker.timer

# Executar agora (manualmente)
sudo systemctl start email-worker.service

# Reiniciar o timer
sudo systemctl restart email-worker.timer

# Desabilitar execução no boot
sudo systemctl disable email-worker.timer
```

### Modificar Frequência

Para alterar a frequência de execução:

```bash
# Editar o timer
sudo nano /etc/systemd/system/email-worker.timer

# Modificar a linha:
OnUnitActiveSec=1h  # Para 1 hora
# Ou:
OnUnitActiveSec=30min  # Para 30 minutos
OnUnitActiveSec=3h     # Para 3 horas
OnUnitActiveSec=6h     # Para 6 horas

# Recarregar configuração
sudo systemctl daemon-reload

# Reiniciar timer
sudo systemctl restart email-worker.timer
```

## 📊 Monitoramento e Logs

### Visualizar Logs do Admin

Acesse o painel administrativo:
- **URL**: http://seu-dominio.com/admin/email-logs
- **Menu**: Admin → Logs de Email

Três abas disponíveis:
1. **Email Logs**: Histórico completo de todos os emails enviados
2. **Follow-up Tracking**: Status dos follow-ups de assinaturas vencidas
3. **Usage Notifications**: Alertas de uso enviados

### Logs em Arquivo

```bash
# Logs de sucesso
tail -f logs/email_worker.log

# Logs de erro
tail -f logs/email_worker_error.log

# Ver últimas 100 linhas
tail -n 100 logs/email_worker.log

# Buscar por palavra-chave
grep "ERROR" logs/email_worker_error.log
grep "enviado" logs/email_worker.log
```

### Queries SQL para Monitoramento

```sql
-- Emails enviados nas últimas 24h
SELECT 
    email_type,
    COUNT(*) as total,
    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as enviados,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as falhados
FROM clientes.email_logs
WHERE sent_at >= NOW() - INTERVAL '24 hours'
GROUP BY email_type;

-- Follow-ups ativos
SELECT 
    u.username,
    ft.attempt_number,
    ft.next_attempt_at,
    ft.status
FROM clientes.subscription_followup_tracking ft
INNER JOIN clientes.users u ON ft.user_id = u.id
WHERE ft.status IN ('pending', 'sent')
ORDER BY ft.next_attempt_at;

-- Taxa de sucesso geral
SELECT 
    COUNT(*) as total_emails,
    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as enviados,
    ROUND(SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) * 100, 2) as taxa_sucesso
FROM clientes.email_logs;
```

## 🐛 Troubleshooting

### Worker não está executando

1. **Verificar se cron está ativo**:
```bash
# Para sistemas com systemd
sudo systemctl status cron
# ou
sudo systemctl status crond

# Iniciar se estiver parado
sudo systemctl start cron
```

2. **Verificar permissões**:
```bash
ls -la run_email_worker.py
# Deve ter permissão de execução (rwxr-xr-x)

# Se não tiver:
chmod +x run_email_worker.py
```

3. **Testar manualmente**:
```bash
python3 run_email_worker.py
# Deve executar sem erros
```

4. **Verificar logs de erro**:
```bash
tail -f logs/email_worker_error.log
```

### Emails não estão sendo enviados

1. **Verificar secrets**:
```bash
# Verificar se as variáveis de ambiente estão configuradas
env | grep EMAIL_
```

Deve mostrar:
- EMAIL_HOST
- EMAIL_PORT
- EMAIL_USER
- EMAIL_PASSWORD
- EMAIL_FROM

2. **Testar conexão SMTP**:
```python
from src.services.email_service import email_service
email_service.send_account_creation_email("seu-email@example.com", "Teste")
```

3. **Ver logs de email no banco**:
```sql
SELECT * FROM clientes.email_logs 
WHERE status = 'failed' 
ORDER BY sent_at DESC 
LIMIT 10;
```

### Cron executando mas worker falhando

1. **Verificar caminho do Python**:
```bash
which python3
# Usar o caminho completo no crontab
```

2. **Verificar variáveis de ambiente**:
   - Cron não herda as mesmas variáveis que seu shell
   - Adicione ao crontab:
```bash
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
EMAIL_HOST=smtp.hostinger.com
# ... outras variáveis
```

3. **Usar systemd timer** (mais robusto que cron):
```bash
sudo ./setup_systemd_timer.sh
```

## ✅ Checklist de Produção

Antes de colocar em produção, verifique:

- [ ] Secrets configurados (EMAIL_HOST, EMAIL_PORT, etc)
- [ ] Worker testado manualmente sem erros
- [ ] Cron ou Systemd Timer configurado e ativo
- [ ] Logs sendo gerados corretamente
- [ ] Página de admin acessível (/admin/email-logs)
- [ ] Banco de dados com tabelas de tracking criadas
- [ ] Webhooks do Stripe configurados e testados
- [ ] Monitoramento configurado (alertas, dashboards)

## 🔐 Segurança

### Proteger Logs

```bash
# Apenas o usuário pode ler os logs
chmod 600 logs/email_worker.log
chmod 600 logs/email_worker_error.log

# Ou criar um grupo específico
sudo chgrp email-workers logs/
sudo chmod 640 logs/email_worker.log
```

### Rotação de Logs

Criar arquivo `/etc/logrotate.d/email-worker`:

```bash
/path/to/project/logs/email_worker.log
/path/to/project/logs/email_worker_error.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 seu-usuario seu-grupo
    sharedscripts
    postrotate
        systemctl reload email-worker.timer > /dev/null 2>&1 || true
    endscript
}
```

## 📈 Otimizações

### Ajustar Frequência Dinamicamente

Para ambientes com muito tráfego:
- **Alta demanda**: Executar a cada 30 minutos
- **Demanda normal**: Executar a cada 1 hora (padrão)
- **Baixa demanda**: Executar a cada 3-6 horas

### Monitoramento com Alertas

Configure alertas para:
- Taxa de falha de emails > 10%
- Worker não executado nas últimas 2 horas
- Erros de conexão SMTP
- Fila de follow-ups crescendo muito

### Performance

Se o worker ficar lento:
1. Adicionar índices no banco:
```sql
CREATE INDEX IF NOT EXISTS idx_followup_next_attempt 
ON clientes.subscription_followup_tracking(next_attempt_at) 
WHERE status IN ('pending', 'sent');

CREATE INDEX IF NOT EXISTS idx_usage_month_year 
ON clientes.usage_notifications_sent(month_year);
```

2. Processar em batches menores (ajustar no worker)

## 🎉 Conclusão

Com esta configuração:
- ✅ Worker executa automaticamente a cada 1 hora
- ✅ Logs centralizados e fáceis de monitorar
- ✅ Reinício automático em caso de falha
- ✅ Interface admin para visualizar histórico
- ✅ Sistema robusto e à prova de falhas

**Recomendação**: Use **Systemd Timer** para ambientes de produção e **Cron** para ambientes de desenvolvimento/teste.
