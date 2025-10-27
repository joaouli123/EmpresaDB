# 💳 Integração Stripe - Sistema de Pagamentos e Assinaturas

## Visão Geral

Este sistema implementa integração completa com Stripe para gerenciar pagamentos recorrentes, assinaturas e controle de acesso à API baseado em planos.

## 🎯 Funcionalidades Implementadas

### 1. **Planos de Assinatura**
- ✅ Free (200 consultas/mês) - Sem pagamento
- ✅ Start (10.000 consultas/mês) - R$ 79,90/mês
- ✅ Growth (100.000 consultas/mês) - R$ 249,90/mês
- ✅ Pro (500.000 consultas/mês) - R$ 799,90/mês
- ❌ Enterprise (customizado) - Contato comercial (não integrado com Stripe)

### 2. **Fluxo de Pagamento**

#### Assinar Plano
1. Usuário seleciona plano na página `/pricing`
2. Sistema cria sessão de checkout no Stripe
3. Usuário é redirecionado para Stripe Checkout
4. Após pagamento, Stripe envia webhook
5. Sistema ativa assinatura automaticamente

#### Webhook do Stripe
- **checkout.session.completed**: Cria assinatura no banco
- **customer.subscription.updated**: Atualiza status da assinatura
- **customer.subscription.deleted**: Cancela assinatura
- **invoice.paid**: Registra transação paga
- **invoice.payment_failed**: Marca assinatura como "past_due"

### 3. **Bloqueio Automático de Acesso**

O sistema implementa bloqueio automático em **3 camadas**:

#### Camada 1: Verificação na API (verify_api_key)
```python
# src/api/routes.py - linha 75-145
async def verify_api_key(x_api_key: str = Header(None)):
    # 1. Verifica se API Key é válida
    # 2. Busca assinatura ativa do usuário
    # 3. Se não tem assinatura E não está no plano free → BLOQUEIA (HTTP 403)
    # 4. Atualiza plano e limites do usuário
    # 5. Aplica rate limiting baseado no plano
```

**Critérios de Bloqueio:**
- ❌ Assinatura expirada (current_period_end < NOW)
- ❌ Status != 'active' ou 'trialing'
- ❌ Sem assinatura no Stripe E sem plano free ativo
- ✅ Plano free sempre permitido (200 consultas/mês)

#### Camada 2: Webhook Automático
Quando assinatura é cancelada/expira, webhook do Stripe:
1. Atualiza status para "canceled" no banco
2. Remove da tabela `stripe_subscriptions`
3. Na próxima requisição, `verify_api_key` detecta ausência e bloqueia

#### Camada 3: Logs de Auditoria
Todas as mudanças de assinatura são registradas:
- `clientes.stripe_webhook_events` - Log de todos os eventos Stripe
- `clientes.stripe_invoices` - Histórico de faturas
- `clientes.query_log` - Auditoria de cada consulta

### 4. **Gerenciamento de Assinatura**

#### Cancelar Assinatura
```javascript
// Frontend: /subscription
await api.post('/stripe/cancel-subscription');
// Cancela no final do período (cancel_at_period_end = true)
// Acesso continua até data de vencimento
```

#### Portal do Cliente Stripe
```javascript
await api.post('/stripe/customer-portal');
// Redireciona para portal do Stripe onde usuário pode:
// - Atualizar método de pagamento
// - Ver faturas
// - Cancelar assinatura
// - Baixar recibos
```

## 🔧 Configuração

### 1. Variáveis de Ambiente Necessárias

```bash
# .env ou Secrets do Replit
STRIPE_SECRET_KEY=sk_test_xxx        # Secret Key do Stripe
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx   # Publishable Key do Stripe
STRIPE_WEBHOOK_SECRET=whsec_xxx      # Webhook Signing Secret
```

### 2. Configurar Webhook no Stripe

1. Acesse https://dashboard.stripe.com/webhooks
2. Clique em "Add endpoint"
3. URL: `https://seu-dominio.replit.app/stripe/webhook`
4. Selecione eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copie o "Signing secret" (whsec_xxx)

### 3. Criar Produtos e Preços no Stripe (Opcional)

Se quiser usar preços pré-configurados:

1. Acesse https://dashboard.stripe.com/products
2. Crie um produto para cada plano
3. Configure preço recorrente mensal
4. Copie o Price ID (price_xxx)
5. Atualize no banco:

```sql
UPDATE clientes.plans 
SET stripe_price_id = 'price_xxx', stripe_product_id = 'prod_xxx'
WHERE name = 'start';
```

**Nota:** Se não configurar `stripe_price_id`, o sistema cria preços dinamicamente no checkout.

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

```sql
-- Planos disponíveis
clientes.plans
  - id, name, display_name, monthly_queries, price_brl
  - stripe_price_id, stripe_product_id

-- Customers do Stripe (1 por usuário)
clientes.stripe_customers
  - user_id, stripe_customer_id, email

-- Assinaturas ativas
clientes.stripe_subscriptions
  - user_id, stripe_subscription_id, plan_id
  - status, current_period_start, current_period_end
  - cancel_at_period_end

-- Faturas/Transações
clientes.stripe_invoices
  - user_id, stripe_invoice_id, amount_total
  - status, invoice_pdf, hosted_invoice_url

-- Log de webhooks
clientes.stripe_webhook_events
  - stripe_event_id, event_type, event_data
  - processed, error_message
```

### Views Úteis

```sql
-- Ver todas assinaturas ativas com informações completas
SELECT * FROM clientes.active_subscriptions;

-- Ver webhooks não processados
SELECT * FROM clientes.stripe_webhook_events 
WHERE processed = FALSE 
ORDER BY created_at DESC;
```

## 🧪 Testando o Sistema

### Teste 1: Assinar Plano

1. Acesse `/pricing`
2. Faça login
3. Clique em "Assinar Agora" em qualquer plano
4. Use cartão de teste do Stripe:
   - Número: `4242 4242 4242 4242`
   - Data: Qualquer data futura
   - CVC: Qualquer 3 dígitos
5. Complete o pagamento
6. Verifique se foi redirecionado para `/subscription?success=true`
7. Verifique assinatura ativa no banco

### Teste 2: Usar API com Assinatura Ativa

```bash
# Gerar API Key no dashboard
# Usar em requisição
curl -H "X-API-Key: sua_key_aqui" \
  https://seu-dominio.replit.app/cnpj/00000000000191
```

### Teste 3: Cancelar e Testar Bloqueio

1. Acesse `/subscription`
2. Clique em "Cancelar Assinatura"
3. Confirme o cancelamento
4. Assinatura fica ativa até `current_period_end`
5. Após essa data, requisições à API retornarão:

```json
{
  "detail": {
    "error": "subscription_required",
    "message": "Sua assinatura expirou ou não foi renovada...",
    "action_url": "/pricing"
  }
}
```

### Teste 4: Webhook (Teste Local)

```bash
# Instalar Stripe CLI
stripe listen --forward-to localhost:8000/stripe/webhook

# Simular evento
stripe trigger checkout.session.completed
```

## 🔒 Segurança

### 1. Validação de Webhook
- ✅ Assinatura do webhook verificada com `STRIPE_WEBHOOK_SECRET`
- ✅ Eventos duplicados ignorados (ON CONFLICT)
- ✅ Erros registrados no banco para auditoria

### 2. Controle de Acesso
- ✅ Endpoints de Stripe requerem autenticação (JWT token)
- ✅ Webhook é público mas validado por assinatura
- ✅ API Key bloqueada automaticamente sem assinatura
- ✅ Rate limiting por plano

### 3. Logs e Auditoria
- ✅ Todos os eventos Stripe registrados
- ✅ Todas as consultas API registradas
- ✅ Mudanças de status trackadas com timestamps

## 📈 Monitoramento

### Queries Úteis

```sql
-- Assinaturas ativas por plano
SELECT p.display_name, COUNT(*) as total
FROM clientes.stripe_subscriptions ss
JOIN clientes.plans p ON ss.plan_id = p.id
WHERE ss.status = 'active'
GROUP BY p.display_name;

-- Revenue mensal estimado
SELECT SUM(p.price_brl) as mrr
FROM clientes.stripe_subscriptions ss
JOIN clientes.plans p ON ss.plan_id = p.id
WHERE ss.status = 'active';

-- Assinaturas que cancelam hoje
SELECT * FROM clientes.stripe_subscriptions
WHERE cancel_at_period_end = TRUE
  AND current_period_end::date = CURRENT_DATE;

-- Pagamentos falhados
SELECT * FROM clientes.stripe_invoices
WHERE status = 'open' OR status = 'uncollectible';
```

## ⚠️ Problemas Comuns

### Webhook não funciona
- Verifique se `STRIPE_WEBHOOK_SECRET` está configurado
- Teste com Stripe CLI localmente primeiro
- Verifique logs: `SELECT * FROM clientes.stripe_webhook_events WHERE processed = FALSE`

### Assinatura criada mas acesso bloqueado
- Verifique se webhook foi processado: `SELECT * FROM clientes.stripe_subscriptions`
- Verifique se `current_period_end` é futuro
- Limpe cache se necessário

### Checkout não redireciona
- Verifique se `success_url` e `cancel_url` estão corretos
- Teste em modo de desenvolvimento do Stripe
- Verifique console do navegador para erros

## 🚀 Próximos Passos

- [ ] Adicionar métricas de conversão (funil de vendas)
- [ ] Implementar cupons de desconto
- [ ] Adicionar upgrade/downgrade de planos
- [ ] Sistema de créditos extras (add-ons)
- [ ] Notificações por email (falha de pagamento, assinatura expirada)
- [ ] Dashboard de analytics de revenue

## 📝 Notas Importantes

1. **Plano Free**: Sempre disponível, não requer pagamento
2. **Enterprise**: Não integrado com Stripe, requer contato comercial
3. **Teste vs Produção**: Use chaves de teste durante desenvolvimento
4. **Segurança**: NUNCA commite chaves secretas no código
5. **Webhooks**: Essenciais para funcionamento automático
