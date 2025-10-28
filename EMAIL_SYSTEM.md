# Sistema de Emails - DB Empresas

## Visão Geral

Sistema completo de notificações por email integrado com SMTP (Hostinger) que gerencia:

- Emails transacionais (criação de conta, assinaturas)
- Follow-ups automáticos para assinaturas vencidas (até 5 tentativas)
- Alertas de uso de consultas (50% e 80% da cota)

## Configuração

### Secrets Necessários

As seguintes variáveis de ambiente devem estar configuradas nos Replit Secrets:

```
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_USER=contato@dbempresas.com.br
EMAIL_PASSWORD=[senha configurada]
EMAIL_FROM=contato@dbempresas.com.br
```

### Design dos Emails

- **Estilo**: Limpo e profissional
- **Cores**: Tons de azul (#1e3a8a, #3b82f6, #dbeafe)
- **Sem emojis**: Design corporativo
- **Responsivo**: Funciona em todos os clientes de email

## Tipos de Email

### 1. Emails Transacionais

#### Criação de Conta
- **Enviado quando**: Usuário se registra
- **Template**: `get_account_creation_template()`
- **Integrado em**: `POST /auth/register`

#### Assinatura Confirmada
- **Enviado quando**: Pagamento confirmado (Stripe webhook)
- **Template**: `get_subscription_created_template()`
- **Integrado em**: Webhook `checkout.session.completed`
- **Dados**: Plano, preço, próxima cobrança

#### Assinatura Renovada
- **Enviado quando**: Fatura paga (renovação automática)
- **Template**: `get_subscription_renewed_template()`
- **Integrado em**: Webhook `invoice.paid`
- **Dados**: Plano, valor pago, próxima renovação

### 2. Follow-ups de Assinatura Vencida

Sistema automático de 5 tentativas para recuperar assinaturas vencidas:

- **Tentativa 1**: "Sua assinatura venceu recentemente..."
- **Tentativa 2**: "Segundo lembrete sobre o vencimento..."
- **Tentativa 3**: "Não perca o acesso aos dados importantes..."
- **Tentativa 4**: "Penúltimo lembrete..."
- **Tentativa 5**: "Último aviso..."

**Configuração**:
- Intervalo entre tentativas: 3 dias
- Total de tentativas: 5
- Após 5 tentativas: Sistema para de enviar

**Início do processo**:
- Quando webhook `invoice.payment_failed` é recebido
- Sistema cria registro em `subscription_followup_tracking`

### 3. Alertas de Uso

#### Alerta 50%
- **Enviado quando**: Usuário atinge 50% da cota mensal
- **Template**: `get_usage_warning_template()` (percentage=50)
- **Cor**: Laranja (#f59e0b)
- **Enviado uma vez por mês**

#### Alerta 80%
- **Enviado quando**: Usuário atinge 80% da cota mensal
- **Template**: `get_usage_warning_template()` (percentage=80)
- **Cor**: Vermelho (#dc2626)
- **Enviado uma vez por mês**

## Banco de Dados

### Tabelas

#### `clientes.email_logs`
Registra todos os emails enviados:
```sql
- id: SERIAL PRIMARY KEY
- user_id: INTEGER (FK users)
- email_type: VARCHAR(50)
- recipient_email: VARCHAR(255)
- subject: VARCHAR(500)
- sent_at: TIMESTAMP
- status: VARCHAR(20) -- 'sent', 'failed'
- error_message: TEXT
- metadata: JSONB
```

#### `clientes.subscription_followup_tracking`
Controla follow-ups de assinaturas vencidas:
```sql
- id: SERIAL PRIMARY KEY
- user_id: INTEGER (FK users)
- subscription_id: INTEGER (FK stripe_subscriptions)
- attempt_number: INTEGER (1-5)
- last_attempt_at: TIMESTAMP
- next_attempt_at: TIMESTAMP
- status: VARCHAR(20) -- 'pending', 'sent', 'completed', 'abandoned'
- total_attempts: INTEGER
```

#### `clientes.usage_notifications_sent`
Controla quais notificações de uso já foram enviadas:
```sql
- id: SERIAL PRIMARY KEY
- user_id: INTEGER (FK users)
- month_year: VARCHAR(7) -- 'YYYY-MM'
- notification_50_sent: BOOLEAN
- notification_80_sent: BOOLEAN
- sent_50_at: TIMESTAMP
- sent_80_at: TIMESTAMP
```

## Worker Automático

### Arquivo: `src/workers/email_followup_worker.py`

Worker que processa:
1. Follow-ups de assinaturas vencidas
2. Notificações de uso (50% e 80%)

### Execução

#### Manual
```bash
python run_email_worker.py
```

#### Automatizado (Cron)
Execute a cada 1 hora:
```cron
0 * * * * cd /path/to/project && python run_email_worker.py >> /var/log/email_worker.log 2>&1
```

ou a cada 3 horas:
```cron
0 */3 * * * cd /path/to/project && python run_email_worker.py >> /var/log/email_worker.log 2>&1
```

### Lógica do Worker

1. **Busca follow-ups pendentes**
   - Assinaturas com status `past_due`, `canceled`, `unpaid`
   - Que ainda não completaram 5 tentativas
   - Que chegaram na data de próxima tentativa

2. **Envia email de follow-up**
   - Verifica se assinatura ainda está vencida
   - Envia email com número da tentativa
   - Registra em `email_logs`
   - Atualiza `subscription_followup_tracking`
   - Agenda próxima tentativa (+3 dias)

3. **Busca alertas de uso pendentes**
   - Usuários com assinatura ativa
   - Que atingiram 50% ou 80% da cota
   - Que ainda não receberam notificação este mês

4. **Envia alertas de uso**
   - Prioriza 80% sobre 50%
   - Envia email de alerta
   - Registra em `email_logs`
   - Marca em `usage_notifications_sent`

## Arquitetura de Serviços

### `src/services/email_service.py`
- Gerencia conexão SMTP
- Métodos para enviar cada tipo de email
- Tratamento de erros

### `src/services/email_templates.py`
- Templates HTML de todos os emails
- Design consistente com base template
- Parametrizados para dados dinâmicos

### `src/services/email_tracking.py`
- Registra logs de emails enviados
- Gerencia tracking de follow-ups
- Busca pendências para o worker

## Fluxo de Integração

### 1. Registro de Usuário
```
POST /auth/register
    ↓
criar usuário
    ↓
email_service.send_account_creation_email()
    ↓
email_tracking_service.log_email_sent()
```

### 2. Assinatura Criada
```
Stripe: checkout.session.completed
    ↓
handle_checkout_session_completed()
    ↓
salvar assinatura
    ↓
email_service.send_subscription_created_email()
    ↓
email_tracking_service.log_email_sent()
    ↓
email_tracking_service.mark_followup_abandoned() // cancelar follow-ups anteriores
```

### 3. Assinatura Renovada
```
Stripe: invoice.paid
    ↓
handle_invoice_paid()
    ↓
verificar se é renovação (count > 1)
    ↓
email_service.send_subscription_renewed_email()
    ↓
email_tracking_service.log_email_sent()
    ↓
email_tracking_service.mark_followup_abandoned()
```

### 4. Assinatura Vencida
```
Stripe: invoice.payment_failed
    ↓
handle_invoice_payment_failed()
    ↓
atualizar status para 'past_due'
    ↓
email_tracking_service.get_or_create_followup_tracking()
    ↓
[Worker processa a cada 3 dias até 5 tentativas]
```

### 5. Alertas de Uso
```
[Worker verifica periodicamente]
    ↓
buscar usuários com 50% ou 80% de uso
    ↓
filtrar quem já recebeu este mês
    ↓
email_service.send_usage_warning_email()
    ↓
marcar em usage_notifications_sent
```

## Monitoramento

### Verificar Logs de Email
```sql
-- Emails enviados hoje
SELECT * FROM clientes.email_logs
WHERE sent_at >= CURRENT_DATE
ORDER BY sent_at DESC;

-- Taxa de sucesso por tipo
SELECT 
    email_type,
    COUNT(*) as total,
    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as enviados,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as falhados
FROM clientes.email_logs
GROUP BY email_type;
```

### Verificar Follow-ups Ativos
```sql
-- Follow-ups em andamento
SELECT 
    u.username,
    u.email,
    ft.attempt_number,
    ft.total_attempts,
    ft.next_attempt_at,
    ft.status
FROM clientes.subscription_followup_tracking ft
INNER JOIN clientes.users u ON ft.user_id = u.id
WHERE ft.status IN ('pending', 'sent')
ORDER BY ft.next_attempt_at;
```

### Verificar Notificações de Uso
```sql
-- Notificações enviadas este mês
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

## Troubleshooting

### Emails não estão sendo enviados

1. **Verificar secrets**:
   - Confirmar que EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM estão configurados
   
2. **Verificar logs da aplicação**:
   ```python
   logger.error(f"Erro ao enviar email para {email}: {e}")
   ```

3. **Testar manualmente**:
   ```python
   from src.services.email_service import email_service
   email_service.send_account_creation_email("teste@example.com", "Teste")
   ```

### Follow-ups não estão sendo processados

1. **Verificar se worker está rodando**:
   - Worker deve ser executado periodicamente (cron)
   
2. **Verificar tracking**:
   ```sql
   SELECT * FROM clientes.subscription_followup_tracking
   WHERE status = 'pending' AND next_attempt_at <= CURRENT_TIMESTAMP;
   ```

3. **Executar worker manualmente**:
   ```bash
   python run_email_worker.py
   ```

### Alertas de uso não estão sendo enviados

1. **Verificar se usuário atingiu threshold**:
   ```sql
   SELECT 
       mu.user_id,
       mu.queries_used,
       p.monthly_queries,
       (mu.queries_used::DECIMAL / p.monthly_queries * 100) as percentage
   FROM clientes.monthly_usage mu
   INNER JOIN clientes.stripe_subscriptions ss ON mu.user_id = ss.user_id
   INNER JOIN clientes.plans p ON ss.plan_id = p.id
   WHERE mu.month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM');
   ```

2. **Verificar se já foi enviado**:
   ```sql
   SELECT * FROM clientes.usage_notifications_sent
   WHERE month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM');
   ```

## Segurança

- **Nunca logar senhas**: Email tracking não registra conteúdo sensível
- **Secrets protegidos**: Credenciais SMTP em Replit Secrets
- **Rate limiting**: Worker processa em lotes com delays
- **Validação**: Emails só enviados para usuários válidos no banco

## Manutenção

### Limpeza de Logs Antigos
```sql
-- Deletar logs de email com mais de 90 dias
DELETE FROM clientes.email_logs
WHERE sent_at < CURRENT_DATE - INTERVAL '90 days';

-- Deletar tracking de follow-ups completados há mais de 30 dias
DELETE FROM clientes.subscription_followup_tracking
WHERE status = 'completed' 
  AND updated_at < CURRENT_DATE - INTERVAL '30 days';
```

### Reset de Notificações de Uso (início do mês)
As notificações são resetadas automaticamente porque o sistema verifica `month_year`. Quando o mês muda, novas entradas são criadas automaticamente.
