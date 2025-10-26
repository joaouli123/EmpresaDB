-- =========================================
-- ATUALIZAÇÃO DOS PLANOS - SISTEMA CNPJ API
-- =========================================
-- Remove recursos: Webhooks e Enriquecimento de Email
-- Mantém: Redis Cache (Growth+) e Rate Limit (todos)
-- Data: 2025-01-26

-- Limpar planos existentes
TRUNCATE TABLE clientes.plans RESTART IDENTITY CASCADE;

-- Inserir planos atualizados
INSERT INTO clientes.plans (name, display_name, monthly_queries, price_brl, features) VALUES
(
    'free',
    'Free',
    200,
    0.00,
    '[
        "200 consultas/mês",
        "Consulta básica por CNPJ",
        "Dados essenciais da Receita",
        "Documentação completa",
        "Rate limit: 10 req/min"
    ]'::jsonb
),
(
    'start',
    'Start',
    10000,
    79.90,
    '[
        "10.000 consultas/mês",
        "Filtros básicos (UF, CNAE, situação)",
        "Exportação CSV (até 1.000 registros)",
        "Dashboard com estatísticas",
        "Logs de uso (7 dias)",
        "Suporte email (48h)",
        "Rate limit: 60 req/min",
        "SLA 95% uptime"
    ]'::jsonb
),
(
    'growth',
    'Growth',
    100000,
    249.90,
    '[
        "100.000 consultas/mês",
        "🔥 Todos os 33 filtros avançados",
        "Busca por texto (razão social/fantasia)",
        "Exportação ilimitada (CSV/Excel)",
        "Dashboard avançado + gráficos",
        "Logs completos (30 dias)",
        "⚡ Cache Redis (respostas 10x mais rápidas)",
        "Suporte prioritário (24h)",
        "Rate limit: 300 req/min",
        "SLA 98% uptime"
    ]'::jsonb
),
(
    'pro',
    'Pro',
    500000,
    799.90,
    '[
        "500.000 consultas/mês",
        "Tudo do Growth +",
        "💎 Dados enriquecidos:",
        "  • QSA completo",
        "  • CNAEs secundários detalhados",
        "Consultas em lote (batch)",
        "Logs ilimitados (histórico completo)",
        "Relatórios personalizados",
        "IP dedicado (opcional)",
        "⚡ Cache Redis otimizado",
        "Suporte premium (4h)",
        "Rate limit: 1000 req/min",
        "SLA 99.9% uptime"
    ]'::jsonb
),
(
    'enterprise',
    'Enterprise',
    1000000,
    0.00,
    '[
        "Volume customizado (1M+)",
        "Tudo do Pro +",
        "🏢 Recursos corporativos:",
        "  • Integração dedicada",
        "  • Onboarding personalizado",
        "  • Account manager dedicado",
        "  • White-label (sua marca)",
        "  • Deploy on-premise (opcional)",
        "⚡ Cache Redis dedicado",
        "SLA customizado (99.99%)",
        "Suporte 24/7 (telefone + Slack)",
        "Consultoria técnica incluída",
        "Rate limit customizado",
        "Contrato anual",
        "Nota fiscal e contrato"
    ]'::jsonb
);

-- Verificar inserção
SELECT 
    id,
    name,
    display_name,
    monthly_queries,
    price_brl,
    jsonb_array_length(features) as total_features,
    is_active
FROM clientes.plans
ORDER BY monthly_queries ASC;

-- Comentário: Script atualizado para remover Webhooks e Enriquecimento de Email
-- mantendo apenas Redis Cache e Rate Limit como recursos disponíveis
