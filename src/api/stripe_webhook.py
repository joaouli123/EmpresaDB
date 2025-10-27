"""
Webhook do Stripe para processar eventos de pagamento automaticamente
"""
from fastapi import APIRouter, HTTPException, Request, Header
import stripe
import logging
import os
from datetime import datetime
from typing import Optional
from src.database.connection import db_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stripe", tags=["Stripe Webhook"])

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

async def handle_checkout_session_completed(event_data: dict):
    """
    Processa evento de checkout concluído
    Cria a assinatura no banco quando o pagamento é confirmado
    """
    try:
        session = event_data['object']
        customer_id = session.get('customer')
        subscription_id = session.get('subscription')
        
        # Buscar metadata
        user_id = int(session['metadata'].get('user_id'))
        plan_id = int(session['metadata'].get('plan_id'))
        
        # Buscar informações da assinatura no Stripe
        subscription = stripe.Subscription.retrieve(subscription_id)
        
        # Salvar assinatura no banco
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Verificar se já existe
            cursor.execute("""
                SELECT id FROM clientes.stripe_subscriptions
                WHERE stripe_subscription_id = %s
            """, (subscription_id,))
            existing = cursor.fetchone()
            
            if not existing:
                # Cancelar qualquer assinatura ativa anterior deste usuário
                cursor.execute("""
                    UPDATE clientes.stripe_subscriptions
                    SET status = 'canceled',
                        canceled_at = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s 
                        AND status IN ('active', 'trialing')
                        AND stripe_subscription_id != %s
                """, (user_id, subscription_id))
                
                # Criar nova assinatura
                cursor.execute("""
                    INSERT INTO clientes.stripe_subscriptions (
                        user_id, stripe_subscription_id, stripe_customer_id,
                        plan_id, status, current_period_start, current_period_end,
                        cancel_at_period_end
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_id,
                    subscription_id,
                    customer_id,
                    plan_id,
                    subscription['status'],
                    datetime.fromtimestamp(subscription['current_period_start']),
                    datetime.fromtimestamp(subscription['current_period_end']),
                    subscription.get('cancel_at_period_end', False)
                ))
                
                logger.info(f"✅ Assinatura criada: {subscription_id} para user_id: {user_id}")
            else:
                logger.info(f"Assinatura {subscription_id} já existe no banco")
            
            cursor.close()
            
    except Exception as e:
        logger.error(f"Erro ao processar checkout.session.completed: {e}")
        raise

async def handle_subscription_updated(event_data: dict):
    """
    Processa evento de assinatura atualizada
    """
    try:
        subscription = event_data['object']
        subscription_id = subscription['id']
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE clientes.stripe_subscriptions
                SET status = %s,
                    current_period_start = %s,
                    current_period_end = %s,
                    cancel_at_period_end = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE stripe_subscription_id = %s
            """, (
                subscription['status'],
                datetime.fromtimestamp(subscription['current_period_start']),
                datetime.fromtimestamp(subscription['current_period_end']),
                subscription.get('cancel_at_period_end', False),
                subscription_id
            ))
            cursor.close()
            
        logger.info(f"✅ Assinatura atualizada: {subscription_id}, status: {subscription['status']}")
        
    except Exception as e:
        logger.error(f"Erro ao processar customer.subscription.updated: {e}")
        raise

async def handle_subscription_deleted(event_data: dict):
    """
    Processa evento de assinatura deletada/cancelada
    """
    try:
        subscription = event_data['object']
        subscription_id = subscription['id']
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Atualizar status no banco
            cursor.execute("""
                UPDATE clientes.stripe_subscriptions
                SET status = 'canceled',
                    canceled_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE stripe_subscription_id = %s
            """, (subscription_id,))
            
            cursor.close()
            
        logger.info(f"✅ Assinatura cancelada: {subscription_id}")
        
    except Exception as e:
        logger.error(f"Erro ao processar customer.subscription.deleted: {e}")
        raise

async def handle_invoice_paid(event_data: dict):
    """
    Processa evento de fatura paga
    Registra a transação no histórico
    """
    try:
        invoice = event_data['object']
        
        # Buscar user_id pela customer_id
        customer_id = invoice.get('customer')
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT user_id FROM clientes.stripe_customers
                WHERE stripe_customer_id = %s
            """, (customer_id,))
            result = cursor.fetchone()
            
            if result:
                user_id = result[0]
                
                # Salvar fatura no banco
                cursor.execute("""
                    INSERT INTO clientes.stripe_invoices (
                        user_id, stripe_invoice_id, stripe_subscription_id,
                        amount_total, amount_paid, currency, status,
                        invoice_pdf, hosted_invoice_url, paid_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (stripe_invoice_id) DO UPDATE SET
                        status = EXCLUDED.status,
                        amount_paid = EXCLUDED.amount_paid,
                        paid_at = EXCLUDED.paid_at
                """, (
                    user_id,
                    invoice['id'],
                    invoice.get('subscription'),
                    invoice.get('amount_due', 0) / 100,  # Converter de centavos
                    invoice.get('amount_paid', 0) / 100,
                    invoice.get('currency', 'brl'),
                    invoice['status'],
                    invoice.get('invoice_pdf'),
                    invoice.get('hosted_invoice_url'),
                    datetime.fromtimestamp(invoice['status_transitions']['paid_at']) if invoice.get('status_transitions', {}).get('paid_at') else None
                ))
                
                logger.info(f"✅ Fatura paga registrada: {invoice['id']} para user_id: {user_id}")
            
            cursor.close()
            
    except Exception as e:
        logger.error(f"Erro ao processar invoice.paid: {e}")
        raise

async def handle_invoice_payment_failed(event_data: dict):
    """
    Processa evento de falha no pagamento
    """
    try:
        invoice = event_data['object']
        subscription_id = invoice.get('subscription')
        
        if subscription_id:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE clientes.stripe_subscriptions
                    SET status = 'past_due',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE stripe_subscription_id = %s
                """, (subscription_id,))
                cursor.close()
                
        logger.warning(f"⚠️ Falha no pagamento da fatura: {invoice['id']}")
        
    except Exception as e:
        logger.error(f"Erro ao processar invoice.payment_failed: {e}")
        raise

# Mapeamento de eventos para handlers
EVENT_HANDLERS = {
    'checkout.session.completed': handle_checkout_session_completed,
    'customer.subscription.updated': handle_subscription_updated,
    'customer.subscription.deleted': handle_subscription_deleted,
    'invoice.paid': handle_invoice_paid,
    'invoice.payment_failed': handle_invoice_payment_failed,
}

@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None, alias='stripe-signature')):
    """
    Endpoint para receber webhooks do Stripe
    IMPORTANTE: Este endpoint NÃO requer autenticação, apenas validação de assinatura do Stripe
    """
    try:
        # Ler o corpo da requisição
        payload = await request.body()
        
        # Verificar se o webhook secret está configurado
        if not webhook_secret:
            # Em produção, o webhook secret é OBRIGATÓRIO
            environment = os.getenv('ENVIRONMENT', 'development')
            if environment == 'production':
                logger.error("STRIPE_WEBHOOK_SECRET não configurado em produção!")
                raise HTTPException(
                    status_code=500, 
                    detail="Webhook secret not configured in production"
                )
            else:
                logger.warning("⚠️ STRIPE_WEBHOOK_SECRET não configurado! Processando sem validação (DEV ONLY)")
                event = stripe.Event.construct_from(
                    await request.json(),
                    stripe.api_key
                )
        else:
            # Validar assinatura do webhook
            try:
                event = stripe.Webhook.construct_event(
                    payload, stripe_signature, webhook_secret
                )
            except Exception as e:
                if "Signature" in str(e):
                    logger.error(f"❌ Assinatura inválida do webhook: {e}")
                    raise HTTPException(status_code=400, detail="Invalid signature")
                raise
        
        # Registrar evento no banco para auditoria
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO clientes.stripe_webhook_events (
                    stripe_event_id, event_type, event_data
                ) VALUES (%s, %s, %s)
                ON CONFLICT (stripe_event_id) DO NOTHING
            """, (event['id'], event['type'], str(event['data'])))
            cursor.close()
        
        # Processar evento
        handler = EVENT_HANDLERS.get(event['type'])
        if handler:
            try:
                await handler(event['data'])
                
                # Marcar como processado
                with db_manager.get_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        UPDATE clientes.stripe_webhook_events
                        SET processed = TRUE, processed_at = CURRENT_TIMESTAMP
                        WHERE stripe_event_id = %s
                    """, (event['id'],))
                    cursor.close()
                    
                logger.info(f"✅ Evento processado: {event['type']} - {event['id']}")
            except Exception as e:
                # Registrar erro
                with db_manager.get_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        UPDATE clientes.stripe_webhook_events
                        SET error_message = %s
                        WHERE stripe_event_id = %s
                    """, (str(e), event['id']))
                    cursor.close()
                raise
        else:
            logger.info(f"ℹ️ Evento não tratado: {event['type']}")
        
        return {"status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao processar webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))
