"""
Rotas para gerenciamento de assinaturas e planos
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import psycopg2
from datetime import datetime, timedelta
from src.database.connection import db_manager
from src.api.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

class Plan(BaseModel):
    id: int
    name: str
    display_name: str
    monthly_queries: int
    price_brl: float
    features: List[str]

class SubscriptionInfo(BaseModel):
    plan_name: str
    monthly_limit: int
    extra_credits: int
    total_limit: int
    queries_used: int
    queries_remaining: int
    renewal_date: str
    status: str
    cancel_at_period_end: bool # Added this field based on the changes

class UsageStats(BaseModel):
    queries_used_today: int
    queries_used_this_month: int
    total_limit: int
    queries_remaining: int
    percentage_used: float

# Helper function to get database connection
def get_connection():
    return db_manager.get_connection()

@router.get("/plans", response_model=List[Plan])
async def get_available_plans():
    """Lista todos os planos disponíveis"""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, name, display_name, monthly_queries, price_brl, features
                FROM clientes.plans
                WHERE is_active = TRUE
                ORDER BY monthly_queries ASC
            """)

            plans = []
            for row in cursor.fetchall():
                plans.append({
                    "id": row[0],
                    "name": row[1],
                    "display_name": row[2],
                    "monthly_queries": row[3],
                    "price_brl": float(row[4]),
                    "features": row[5]
                })

            cursor.close()
            return plans
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar planos: {str(e)}")

@router.get("/my-subscription", response_model=Optional[SubscriptionInfo])
async def get_my_subscription(current_user: dict = Depends(get_current_user)):
    """Retorna a assinatura ativa do usuário"""
    try:
        # 🔓 ADMIN tem plano Enterprise ilimitado (mock para frontend)
        if current_user.get('role') == 'admin':
            return {
                "status": "active",
                "renewal_date": None,
                "cancel_at_period_end": False,
                "plan_name": "Enterprise",
                "monthly_limit": 999999999,
                "queries_used": 0,
                "queries_remaining": 999999999,
                "total_limit": 999999999,
                "extra_credits": 0,
                "plan_id": None
            }

        with get_connection() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT 
                    s.status,
                    s.renewal_date,
                    s.cancel_at_period_end,
                    p.name as plan_name,
                    p.monthly_queries,
                    p.id as plan_id,
                    mu.queries_used,
                    s.extra_credits
                FROM clientes.subscriptions s
                JOIN clientes.subscription_plans p ON s.plan_id = p.id
                LEFT JOIN clientes.monthly_usage mu ON mu.user_id = s.user_id 
                    AND mu.month_year = %s
                WHERE s.user_id = %s AND s.status IN ('active', 'canceled')
                ORDER BY s.created_at DESC
                LIMIT 1
            """, (datetime.now().strftime('%Y-%m'), current_user['id']))

            subscription = cursor.fetchone()

            if not subscription:
                raise HTTPException(status_code=404, detail="No active subscription found")

            queries_used = subscription[6] or 0
            monthly_limit = subscription[4]
            extra_credits = subscription[7] or 0
            total_limit = monthly_limit + extra_credits

            return {
                "status": subscription[0],
                "renewal_date": subscription[1].isoformat() if subscription[1] else None,
                "cancel_at_period_end": subscription[2],
                "plan_name": subscription[3],
                "monthly_limit": monthly_limit,
                "queries_used": queries_used,
                "queries_remaining": max(0, total_limit - queries_used),
                "total_limit": total_limit,
                "extra_credits": extra_credits,
                "plan_id": subscription[5]
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar assinatura: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/usage", response_model=UsageStats)
async def get_usage_stats(current_user: dict = Depends(get_current_user)):
    """Retorna estatísticas de uso do usuário"""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()

            # Uso mensal
            cursor.execute("""
                SELECT queries_used FROM clientes.monthly_usage
                WHERE user_id = %s AND month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
            """, (current_user['id'],))
            monthly_result = cursor.fetchone()
            queries_this_month = monthly_result[0] if monthly_result else 0

            # Uso hoje
            cursor.execute("""
                SELECT COUNT(*) FROM clientes.query_log
                WHERE user_id = %s AND DATE(created_at) = CURRENT_DATE
            """, (current_user['id'],))
            today_result = cursor.fetchone()
            queries_today = today_result[0] if today_result else 0

            # Limite total - buscar da assinatura Stripe ativa ou usar Free (200)
            # For admin, use a very high limit
            if current_user.get('role') == 'admin':
                total_limit = 999999999
                remaining = 999999999
            else:
                cursor.execute("""
                    SELECT p.monthly_queries, ss.extra_credits
                    FROM clientes.stripe_subscriptions ss
                    JOIN clientes.plans p ON ss.plan_id = p.id
                    WHERE ss.user_id = %s 
                    AND ss.status IN ('active', 'trialing')
                    ORDER BY ss.created_at DESC
                    LIMIT 1
                """, (current_user['id'],))
                subscription_result = cursor.fetchone()

                if subscription_result:
                    # Usuário com assinatura paga
                    monthly_limit = subscription_result[0]
                    extra_credits = subscription_result[1] or 0
                    total_limit = monthly_limit + extra_credits
                    remaining = max(0, total_limit - queries_this_month)
                else:
                    # Usuário Free - 200 consultas/mês
                    total_limit = 200
                    remaining = max(0, 200 - queries_this_month)

            cursor.close()

            percentage_used = (queries_this_month / total_limit * 100) if total_limit > 0 else 0

            return {
                "queries_used_today": queries_today,
                "queries_used_this_month": queries_this_month,
                "total_limit": total_limit,
                "queries_remaining": remaining,
                "percentage_used": round(percentage_used, 2)
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar estatísticas: {str(e)}")

@router.post("/subscribe/{plan_id}")
async def subscribe_to_plan(plan_id: int, current_user: dict = Depends(get_current_user)):
    """Cria ou atualiza assinatura para um plano"""
    # Admins cannot subscribe to plans through this endpoint
    if current_user.get('role') == 'admin':
        raise HTTPException(status_code=403, detail="Admins cannot subscribe to plans.")
        
    try:
        with get_connection() as conn:
            cursor = conn.cursor()

            # Verificar se plano existe
            cursor.execute("""
                SELECT monthly_queries FROM clientes.plans
                WHERE id = %s AND is_active = TRUE
            """, (plan_id,))
            plan = cursor.fetchone()

            if not plan:
                raise HTTPException(status_code=404, detail="Plano não encontrado")

            monthly_limit = plan[0]
            # Calculate renewal_date based on current date + 30 days for a new subscription
            # For updates, Stripe handles renewal logic, so this might be more relevant for new subs.
            renewal_date = datetime.now() + timedelta(days=30) 

            # Check if the user already has an active subscription in the 'subscriptions' table
            # Note: The original code used 'subscriptions' table, but the changes imply 'stripe_subscriptions'
            # Assuming the intention is to manage subscriptions via Stripe, we should check that table.
            # If 'stripe_subscriptions' is the primary source of truth for active subs, this check might need adjustment.
            cursor.execute("""
                SELECT id FROM clientes.stripe_subscriptions
                WHERE user_id = %s AND status IN ('active', 'trialing')
            """, (current_user['id'],))

            existing_stripe_sub = cursor.fetchone()

            if existing_stripe_sub:
                # If an active Stripe subscription exists, we might need to update it or create a new one
                # depending on the desired Stripe integration logic (e.g., via Stripe API call).
                # For simplicity here, let's assume we create a new entry for tracking purposes if needed,
                # but actual Stripe plan changes should be handled by the Stripe API.
                # For this exercise, we'll focus on the database entry part.
                
                # This part might need refinement based on how Stripe webhooks and API calls are handled.
                # If a new subscription entry is always created for a new plan selection, even if Stripe handles the update:
                 cursor.execute("""
                    INSERT INTO clientes.stripe_subscriptions (user_id, plan_id, status, created_at, updated_at, renewal_date, extra_credits)
                    VALUES (%s, %s, 'active', NOW(), NOW(), %s, 0) 
                    RETURNING id
                """, (current_user['id'], plan_id, renewal_date))
                 new_sub_id = cursor.fetchone()[0]
                 # Optionally, mark old subscription as 'canceled' or 'past_due' if that's the desired flow
                 # This logic is highly dependent on Stripe's subscription management.
                 
            else:
                # Create a new subscription entry if no active one exists
                cursor.execute("""
                    INSERT INTO clientes.stripe_subscriptions (user_id, plan_id, status, created_at, updated_at, renewal_date, extra_credits)
                    VALUES (%s, %s, 'active', NOW(), NOW(), %s, 0) 
                    RETURNING id
                """, (current_user['id'], plan_id, renewal_date))
                new_sub_id = cursor.fetchone()[0]

            conn.commit()
            cursor.close()

            # Note: Actual Stripe payment processing and subscription creation/update should happen via Stripe API calls.
            # This DB insertion is a simplified representation.

            return {"message": "Assinatura criada/atualizada com sucesso", "plan_id": plan_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar assinatura: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cancel")
async def cancel_subscription(current_user: dict = Depends(get_current_user)):
    """Cancela a assinatura do usuário"""
    # Admins cannot cancel subscriptions as they don't have one in the traditional sense
    if current_user.get('role') == 'admin':
        raise HTTPException(status_code=403, detail="Admins cannot cancel subscriptions.")

    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            # Update status in stripe_subscriptions to reflect cancellation intent
            # Actual cancellation with Stripe needs API call and webhook handling
            cursor.execute("""
                UPDATE clientes.stripe_subscriptions
                SET status = 'canceled', cancel_at_period_end = TRUE, updated_at = NOW()
                WHERE user_id = %s AND status IN ('active', 'trialing')
            """, (current_user['id'],))

            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Nenhuma assinatura ativa encontrada")

            conn.commit()
            cursor.close()

            return {"message": "Assinatura cancelada com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao cancelar assinatura: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transactions")
async def get_transactions(current_user: dict = Depends(get_current_user)):
    """Retorna histórico de transações"""
    # If it's a demo user, return demo data
    if current_user.get('username') == 'demo':
        demo_transactions = [
            {
                "id": 1,
                "date": (datetime.now() - timedelta(days=2)).isoformat(),
                "description": "Compra de Créditos Extras - 2.500 consultas",
                "status": "paid",
                "amount": 49.90
            },
            {
                "id": 2,
                "date": (datetime.now() - timedelta(days=15)).isoformat(),
                "description": "Renovação Mensal - Plano Profissional",
                "status": "paid",
                "amount": 149.90
            },
            {
                "id": 3,
                "date": (datetime.now() - timedelta(days=45)).isoformat(),
                "description": "Renovação Mensal - Plano Profissional",
                "status": "paid",
                "amount": 149.90
            },
            {
                "id": 4,
                "date": (datetime.now() - timedelta(days=75)).isoformat(),
                "description": "Renovação Mensal - Plano Profissional",
                "status": "paid",
                "amount": 149.90
            },
            {
                "id": 5,
                "date": (datetime.now() - timedelta(days=105)).isoformat(),
                "description": "Upgrade: Plano Básico → Profissional",
                "status": "paid",
                "amount": 149.90
            },
            {
                "id": 6,
                "date": (datetime.now() - timedelta(days=135)).isoformat(),
                "description": "Primeira Assinatura - Plano Básico",
                "status": "paid",
                "amount": 79.90
            }
        ]
        return demo_transactions
    
    # For admin user, return empty or specific mock data if needed
    if current_user.get('role') == 'admin':
        return [] # No transactions for admin in this context

    # For other users, fetch real data from DB (placeholder for actual implementation)
    # This part would query a 'transactions' or 'payments' table, possibly linked to Stripe
    # try:
    #     with get_connection() as conn:
    #         cursor = conn.cursor()
    #         cursor.execute("""
    #             SELECT id, transaction_date, description, status, amount
    #             FROM clientes.transactions
    #             WHERE user_id = %s
    #             ORDER BY transaction_date DESC
    #         """, (current_user['id'],))
    #         transactions = cursor.fetchall()
    #         # Format the fetched data as needed
    #         return [...] 
    # except Exception as e:
    #     logger.error(f"Erro ao buscar transações: {str(e)}")
    #     raise HTTPException(status_code=500, detail="Erro ao buscar histórico de transações.")

    return [] # Default to empty list if not demo and no real data implemented yet

@router.get("/payment-methods")
async def get_payment_methods(current_user: dict = Depends(get_current_user)):
    """Retorna métodos de pagamento cadastrados"""
    # If it's a demo user, return demo cards
    if current_user.get('username') == 'demo':
        demo_cards = [
            {
                "id": 1,
                "brand": "visa",
                "last4": "4242",
                "exp_month": 8,
                "exp_year": 2027,
                "is_default": True
            },
            {
                "id": 2,
                "brand": "mastercard",
                "last4": "5555",
                "exp_month": 3,
                "exp_year": 2028,
                "is_default": False
            }
        ]
        return demo_cards
        
    # Admins do not have payment methods in this context
    if current_user.get('role') == 'admin':
        return []

    # For other users, fetch real data from DB (placeholder for actual implementation)
    # This would typically involve querying a user's payment method tokens stored securely,
    # often linked to a payment gateway like Stripe.
    # try:
    #     # Example: Querying a hypothetical 'user_payment_methods' table
    #     with get_connection() as conn:
    #         cursor = conn.cursor()
    #         cursor.execute("""
    #             SELECT id, brand, last4, exp_month, exp_year, is_default
    #             FROM clientes.user_payment_methods
    #             WHERE user_id = %s AND is_active = TRUE
    #             ORDER BY is_default DESC, created_at DESC
    #         """, (current_user['id'],))
    #         methods = cursor.fetchall()
    #         # Format the fetched data
    #         return [...]
    # except Exception as e:
    #     logger.error(f"Erro ao buscar métodos de pagamento: {str(e)}")
    #     raise HTTPException(status_code=500, detail="Erro ao buscar métodos de pagamento.")

    return [] # Default to empty list if not demo and no real data implemented yet

@router.delete("/payment-methods/{card_id}")
async def delete_payment_method(card_id: int, current_user: dict = Depends(get_current_user)):
    """Remove um método de pagamento (DEMO)"""
    # Admins cannot delete payment methods
    if current_user.get('role') == 'admin':
        raise HTTPException(status_code=403, detail="Admins cannot delete payment methods.")
        
    # This is a placeholder for actual deletion logic, likely involving Stripe API calls.
    return {"message": "Cartão removido com sucesso (DEMO)"}