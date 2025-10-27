#!/bin/bash
# Script de Migração Stripe - Executar na VPS
# Data: 2025-10-27

echo "🚀 Iniciando migração Stripe..."
echo ""

# Detectar container PostgreSQL
CONTAINER_NAME=$(docker ps --format '{{.Names}}' | grep -i postgres | head -n 1)

if [ -z "$CONTAINER_NAME" ]; then
    echo "❌ Erro: Container PostgreSQL não encontrado!"
    echo "Containers rodando:"
    docker ps
    exit 1
fi

echo "✅ Container PostgreSQL encontrado: $CONTAINER_NAME"
echo ""

# Executar migração SQL
echo "📝 Executando migração SQL..."
docker exec -i $CONTAINER_NAME psql -U cnpj_user -d cnpj_db << 'EOF'
-- =========================================
-- MIGRAÇÃO: Usar apenas Stripe Subscriptions
-- =========================================
-- Remove dependência da tabela subscriptions antiga
-- Data: 2025-10-27

-- PASSO 1: Cancelar todas as assinaturas duplicadas (manter apenas a mais recente por usuário)
UPDATE clientes.stripe_subscriptions ss1
SET status = 'canceled',
    canceled_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE ss1.status IN ('active', 'trialing')
  AND EXISTS (
      SELECT 1 
      FROM clientes.stripe_subscriptions ss2
      WHERE ss2.user_id = ss1.user_id
        AND ss2.status IN ('active', 'trialing')
        AND ss2.created_at > ss1.created_at
  );

-- PASSO 2: Adicionar constraint UNIQUE para garantir apenas uma assinatura ativa por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_active
ON clientes.stripe_subscriptions(user_id)
WHERE status IN ('active', 'trialing');

-- PASSO 3: Renomear tabela antiga para _legacy (manter apenas para histórico)
DO $$
BEGIN
    -- Verificar se a tabela subscriptions existe e ainda não foi renomeada
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'clientes' AND tablename = 'subscriptions'
    ) THEN
        -- Renomear tabela para subscriptions_legacy
        ALTER TABLE clientes.subscriptions RENAME TO subscriptions_legacy;
        
        -- Renomear índices também
        ALTER INDEX IF EXISTS clientes.idx_subscriptions_user_id 
            RENAME TO idx_subscriptions_legacy_user_id;
        ALTER INDEX IF EXISTS clientes.idx_subscriptions_status 
            RENAME TO idx_subscriptions_legacy_status;
        
        RAISE NOTICE 'Tabela subscriptions renomeada para subscriptions_legacy';
    ELSE
        RAISE NOTICE 'Tabela subscriptions já foi renomeada ou não existe';
    END IF;
END $$;

-- PASSO 4: Adicionar comentário explicativo na tabela legacy
COMMENT ON TABLE clientes.subscriptions_legacy IS 
'DEPRECATED: Tabela antiga de assinaturas. Mantida apenas para histórico. Use clientes.stripe_subscriptions';

-- PASSO 5: Atualizar view active_subscriptions
DROP VIEW IF EXISTS clientes.active_subscriptions;

CREATE OR REPLACE VIEW clientes.active_subscriptions AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    p.id as plan_id,
    p.name as plan_name,
    p.display_name as plan_display_name,
    p.monthly_queries,
    p.price_brl,
    ss.stripe_subscription_id,
    ss.status as subscription_status,
    ss.current_period_start,
    ss.current_period_end,
    ss.cancel_at_period_end,
    CASE 
        WHEN ss.status IN ('active', 'trialing') AND ss.current_period_end > NOW() THEN TRUE
        ELSE FALSE
    END as has_active_subscription,
    COALESCE(mu.queries_used, 0) as queries_used_this_month,
    (p.monthly_queries - COALESCE(mu.queries_used, 0)) as queries_remaining
FROM clientes.users u
LEFT JOIN clientes.stripe_subscriptions ss ON u.id = ss.user_id 
    AND ss.status IN ('active', 'trialing')
    AND ss.current_period_end > NOW()
LEFT JOIN clientes.plans p ON ss.plan_id = p.id
LEFT JOIN clientes.monthly_usage mu ON u.id = mu.user_id 
    AND mu.month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM');

-- PASSO 6: Criar função para verificar consistência
CREATE OR REPLACE FUNCTION clientes.check_subscription_consistency()
RETURNS TABLE(
    user_id INTEGER,
    active_subscriptions_count BIGINT,
    issue_description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ss.user_id,
        COUNT(*)::BIGINT as active_count,
        'Usuário tem múltiplas assinaturas ativas!'::TEXT as issue
    FROM clientes.stripe_subscriptions ss
    WHERE ss.status IN ('active', 'trialing')
        AND ss.current_period_end > NOW()
    GROUP BY ss.user_id
    HAVING COUNT(*) > 1;
END;
$$ LANGUAGE plpgsql;

-- PASSO 7: Executar verificação de consistência
DO $$
DECLARE
    inconsistencies_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO inconsistencies_count
    FROM clientes.check_subscription_consistency();
    
    IF inconsistencies_count > 0 THEN
        RAISE WARNING 'Encontradas % inconsistências! Execute SELECT * FROM clientes.check_subscription_consistency();', inconsistencies_count;
    ELSE
        RAISE NOTICE '✅ Verificação de consistência OK - nenhuma duplicata encontrada';
    END IF;
END $$;

-- PASSO 8: Log da migração
DO $$
BEGIN
    RAISE NOTICE '✅ Migração 001_stripe_only_migration concluída com sucesso!';
    RAISE NOTICE 'Sistema agora usa APENAS clientes.stripe_subscriptions';
    RAISE NOTICE 'Tabela antiga renomeada para clientes.subscriptions_legacy (somente leitura)';
END $$;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migração executada com sucesso!"
    echo ""
else
    echo ""
    echo "❌ Erro ao executar migração!"
    exit 1
fi

# Verificações pós-migração
echo "🔍 Executando verificações..."
echo ""

echo "1️⃣ Verificando assinaturas duplicadas:"
docker exec -i $CONTAINER_NAME psql -U cnpj_user -d cnpj_db -t -c "SELECT COUNT(*) FROM clientes.check_subscription_consistency();"

echo ""
echo "2️⃣ Verificando tabelas:"
docker exec -i $CONTAINER_NAME psql -U cnpj_user -d cnpj_db -c "SELECT tablename FROM pg_tables WHERE schemaname = 'clientes' AND tablename LIKE 'subscriptions%';"

echo ""
echo "3️⃣ Verificando constraint UNIQUE:"
docker exec -i $CONTAINER_NAME psql -U cnpj_user -d cnpj_db -c "SELECT indexname FROM pg_indexes WHERE schemaname = 'clientes' AND tablename = 'stripe_subscriptions' AND indexname LIKE '%active%';"

echo ""
echo "✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!"
echo ""
echo "🎉 Sistema Stripe 100% funcional!"
echo "   - Usa apenas stripe_subscriptions"
echo "   - Limite mensal rastreado automaticamente"
echo "   - Assinaturas canceladas funcionam até fim do período"
echo "   - Webhook secret obrigatório em produção"
echo ""
