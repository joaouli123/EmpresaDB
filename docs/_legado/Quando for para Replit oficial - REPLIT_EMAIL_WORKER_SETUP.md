# Configuração do Worker de Emails no Replit

## ⚠️ IMPORTANTE: Diferenças entre VPS e Replit

### Como funciona em um VPS Tradicional
- ✅ Cron jobs nativos do Linux
- ✅ Systemd timers
- ✅ Processos em background com `nohup` ou `screen`

### Como NÃO funciona no Replit
- ❌ **Cron jobs tradicionais não funcionam** (crontab não é suportado)
- ❌ **Systemd não está disponível**
- ❌ **Scripts de setup_cron.sh e setup_systemd_timer.sh NÃO funcionam**
- ❌ **Workflows do Replit são para apps web, não para tarefas agendadas**

## ✅ Solução para Replit: Scheduled Deployments

O Replit oferece **Scheduled Deployments** (Deployments Agendados) especificamente para tarefas periódicas como nosso worker de emails.

### O que são Scheduled Deployments?

São deployments que executam um script em horários específicos, similares a cron jobs, mas gerenciados pela infraestrutura do Replit.

**Características:**
- ⏰ Agendamento em linguagem natural: "Every hour", "Every day at 2 AM"
- 🔄 Execução automática e confiável
- 📊 Logs integrados no painel do Replit
- ⏱️ Runtime máximo: 11 horas por execução
- 💰 Custo: $0.000028/segundo + $0.10/mês por deployment agendado

## 🚀 Como Configurar o Worker de Emails no Replit

### Passo 1: Preparar o Script

O script `run_email_worker.py` já está pronto e configurado! Ele:
- Processa follow-ups de assinaturas vencidas
- Envia notificações de uso (50% e 80%)
- Registra logs no banco de dados
- Funciona de forma standalone

### Passo 2: Criar um Scheduled Deployment

**No painel do Replit:**

1. Clique em **"Deploy"** no menu superior
2. Selecione **"Scheduled Deployment"**
3. Configure:
   - **Name**: `Email Worker`
   - **Schedule**: `Every hour` (ou `Every 1 hour`)
   - **Build command**: (deixe vazio, não precisa)
   - **Run command**: `python3 run_email_worker.py`
   - **Environment variables**: Configure os secrets necessários (veja seção abaixo)

4. Clique em **"Deploy"**

### Passo 3: Configurar Secrets no Deployment

O Scheduled Deployment precisa ter acesso às seguintes variáveis de ambiente:

**Secrets de Email (obrigatórios):**
```
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_USER=contato@dbempresas.com.br
EMAIL_PASSWORD=[sua senha SMTP]
EMAIL_FROM=contato@dbempresas.com.br
EMAIL_USE_SSL=true
```

**Secrets de Banco de Dados (obrigatórios):**
```
DATABASE_URL=postgresql://usuario:senha@72.61.217.143:5432/cnpj_db
```

**Como adicionar no Deployment:**
- Durante a criação do deployment, há uma seção "Secrets"
- Adicione cada variável individualmente
- Ou use o painel "Deployment Settings" após criar

### Passo 4: Ajustar a Frequência (Opcional)

Você pode configurar diferentes frequências:

**Exemplos de agendamento:**
- `Every hour` - A cada 1 hora (recomendado)
- `Every 30 minutes` - A cada 30 minutos
- `Every 3 hours` - A cada 3 horas
- `Every day at 2 AM` - Todo dia às 2h da manhã
- `Every Monday at 10 AM` - Toda segunda-feira às 10h

**Recomendação**: Para o worker de emails, `Every hour` é ideal pois:
- Follow-ups têm intervalo de 3 dias (não precisa ser mais frequente)
- Notificações de uso são checadas diariamente
- Não gera custos excessivos

## 📊 Monitoramento

### Ver Logs do Deployment

1. Acesse o painel **"Deployments"** no Replit
2. Clique no deployment `Email Worker`
3. Vá para a aba **"Logs"**
4. Veja a execução em tempo real ou histórico

### Logs no Banco de Dados

O sistema registra tudo no banco de dados PostgreSQL:

**Emails enviados:**
```sql
SELECT * FROM clientes.email_logs
ORDER BY sent_at DESC
LIMIT 50;
```

**Follow-ups ativos:**
```sql
SELECT 
    u.username,
    u.email,
    ft.attempt_number,
    ft.next_attempt_at,
    ft.status
FROM clientes.subscription_followup_tracking ft
INNER JOIN clientes.users u ON ft.user_id = u.id
WHERE ft.status IN ('pending', 'sent')
ORDER BY ft.next_attempt_at;
```

**Notificações de uso:**
```sql
SELECT 
    u.username,
    uns.notification_50_sent,
    uns.notification_80_sent,
    uns.sent_50_at,
    uns.sent_80_at
FROM clientes.usage_notifications_sent uns
INNER JOIN clientes.users u ON uns.user_id = u.id
WHERE uns.month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM');
```

### Interface de Admin

Acesse: **`/admin/email-logs`** no frontend para visualizar:
- Histórico completo de emails enviados
- Status de follow-ups
- Alertas de uso enviados

## 💰 Custos Estimados

**Scheduled Deployment para Email Worker:**
- **Custo fixo**: $0.10/mês (taxa do scheduler)
- **Custo de execução**: Depende do tempo de processamento

**Estimativa de execução:**
- Worker leva ~10-30 segundos por execução (dependendo do volume)
- Executando a cada 1 hora = 24 execuções/dia = 720 execuções/mês
- Tempo médio: 20 segundos/execução
- **Total**: 720 × 20 = 14.400 segundos/mês
- **Custo de compute**: 14.400 × $0.000028 = **$0.40/mês**

**Custo total estimado: ~$0.50/mês** (muito acessível!)

**Nota**: Membros do Replit Core recebem $25/mês em créditos, então o worker seria essencialmente gratuito.

## 🔄 Alternativa: Reserved VM (Não Recomendado para Worker)

**Outra opção seria usar Reserved VM**, mas **NÃO é recomendado** para este caso porque:
- ❌ Muito mais caro (~$20-40/mês para VM mínima)
- ❌ Complexidade desnecessária
- ❌ Worker não precisa rodar 24/7, apenas periodicamente
- ❌ Scheduled Deployment é a solução ideal para este caso

**Use Reserved VM APENAS se:**
- Precisar de um processo 24/7 (bots Discord, WebSocket servers)
- Tiver tarefas que levam mais de 11 horas
- Precisar de garantia de uptime 99.9%

Para nosso worker de emails, **Scheduled Deployment é a escolha certa**.

## 🧪 Testar Manualmente

Antes de criar o deployment, teste o worker manualmente:

```bash
# No shell do Replit
python3 run_email_worker.py
```

Você deve ver logs como:
```
=== Iniciando Email Followup Worker ===
Iniciando processamento de follow-ups de assinaturas vencidas...
Encontrados 0 follow-ups pendentes
Nenhum follow-up pendente encontrado
Iniciando processamento de notificações de uso...
Encontrados 0 usuários para notificar
Nenhum usuário precisa de notificação de uso
=== Worker concluído ===
Follow-ups enviados: 0
Notificações de uso enviadas: 0
```

## ✅ Checklist de Configuração

Antes de ativar o Scheduled Deployment:

- [ ] Secrets de email configurados (EMAIL_HOST, EMAIL_PORT, etc)
- [ ] DATABASE_URL configurado apontando para VPS (72.61.217.143)
- [ ] Tabelas do banco criadas (`email_logs`, `subscription_followup_tracking`, `usage_notifications_sent`)
- [ ] Worker testado manualmente sem erros
- [ ] Scheduled Deployment criado e configurado
- [ ] Secrets adicionados ao deployment
- [ ] Primeira execução agendada testada
- [ ] Logs verificados no painel do Replit
- [ ] Interface admin acessível para monitoramento

## 🐛 Troubleshooting

### Worker não está executando

1. **Verificar deployment:**
   - Vá para "Deployments" no Replit
   - Verifique se o deployment está "Active"
   - Confira o próximo horário de execução

2. **Verificar logs:**
   - Abra a aba "Logs" do deployment
   - Procure por erros de execução

3. **Testar manualmente:**
   ```bash
   python3 run_email_worker.py
   ```

### Emails não estão sendo enviados

1. **Verificar secrets no deployment:**
   - Edite o deployment
   - Vá para "Secrets"
   - Confirme que EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM estão corretos

2. **Ver logs de erro no banco:**
   ```sql
   SELECT * FROM clientes.email_logs 
   WHERE status = 'failed' 
   ORDER BY sent_at DESC;
   ```

3. **Testar conexão SMTP:**
   ```python
   from src.services.email_service import email_service
   result = email_service.send_account_creation_email("seu-email@teste.com", "Teste")
   print(f"Email enviado: {result}")
   ```

### Deployment falha ao iniciar

1. **Verificar DATABASE_URL:**
   - Deve apontar para o VPS: `postgresql://...@72.61.217.143:5432/cnpj_db`
   - Teste a conexão manualmente

2. **Verificar dependências:**
   - Certifique-se que `requirements.txt` está atualizado
   - Todas as bibliotecas necessárias estão instaladas

3. **Verificar permissões:**
   - O banco de dados no VPS deve aceitar conexões do IP do Replit
   - Configure o firewall se necessário

## 📈 Otimizações Futuras

### 1. Ajustar Frequência Dinamicamente
- **Alta demanda**: `Every 30 minutes`
- **Normal**: `Every hour` (padrão atual)
- **Baixa demanda**: `Every 3 hours`

### 2. Múltiplos Deployments
Você pode criar deployments separados para diferentes tarefas:

**Deployment 1: Follow-ups**
- Schedule: `Every 3 hours`
- Run: `python3 run_email_worker.py --only-followups`

**Deployment 2: Notificações de Uso**
- Schedule: `Every day at 9 AM`
- Run: `python3 run_email_worker.py --only-usage`

Isso requer modificar `run_email_worker.py` para aceitar flags.

### 3. Adicionar Alertas
Configure notificações quando:
- Worker falhar consecutivamente
- Taxa de emails falhados > 10%
- Fila de follow-ups crescer muito

## 🎉 Resumo

**Para fazer o worker funcionar no Replit:**

1. ❌ **NÃO use** `setup_cron.sh` ou `setup_systemd_timer.sh`
2. ✅ **USE** Scheduled Deployments do Replit
3. ⏰ Configure para executar `Every hour`
4. 🔐 Adicione todos os secrets necessários
5. 📊 Monitore via painel de Deployments e banco de dados

**Custo total: ~$0.50/mês** (ou grátis com créditos do Replit Core)

**Vantagens:**
- ✅ Execução automática e confiável
- ✅ Logs integrados
- ✅ Gerenciamento simples
- ✅ Baixo custo
- ✅ Não precisa configurar infraestrutura
