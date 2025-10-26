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

class UsageStats(BaseModel):
    queries_used_today: int
    queries_used_this_month: int
    total_limit: int
    queries_remaining: int
    percentage_used: float

@router.get("/plans", response_model=List[Plan])
async def get_available_plans():
    """Lista todos os planos disponíveis"""
    try:
        with db_manager.get_connection() as conn:
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
    """Retorna informações da assinatura do usuário atual"""
    try:
        # Se for usuário demo, retorna dados demo
        if current_user.get('username') == 'demo':
            renewal_date = (datetime.now() + timedelta(days=15)).isoformat()
            return {
                "plan_name": "Plano Profissional",
                "monthly_limit": 10000,
                "extra_credits": 2500,
                "total_limit": 12500,
                "queries_used": 7350,
                "queries_remaining": 5150,
                "renewal_date": renewal_date,
                "status": "active"
            }
        
        print(f"[DEBUG] Buscando assinatura para user_id: {current_user['id']}")
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    plan_name,
                    monthly_limit,
                    extra_credits,
                    total_limit,
                    queries_used,
                    queries_remaining,
                    renewal_date,
                    subscription_status
                FROM clientes.user_limits
                WHERE user_id = %s
            """, (current_user['id'],))
            
            result = cursor.fetchone()
            cursor.close()
            
            print(f"[DEBUG] Resultado da query: {result}")
            
            if not result or result[0] is None:
                print("[DEBUG] Nenhuma assinatura encontrada")
                return None
            
            subscription_data = {
                "plan_name": result[0],
                "monthly_limit": result[1],
                "extra_credits": result[2],
                "total_limit": result[3],
                "queries_used": result[4] or 0,
                "queries_remaining": result[5] or result[3],
                "renewal_date": result[6].isoformat() if result[6] else None,
                "status": result[7]
            }
            print(f"[DEBUG] Retornando dados: {subscription_data}")
            return subscription_data
    except Exception as e:
        print(f"[ERROR] Erro ao buscar assinatura: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar assinatura: {str(e)}")

@router.get("/usage", response_model=UsageStats)
async def get_usage_stats(current_user: dict = Depends(get_current_user)):
    """Retorna estatísticas de uso do usuário"""
    try:
        with db_manager.get_connection() as conn:
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
            
            # Limite total
            cursor.execute("""
                SELECT total_limit, queries_remaining
                FROM clientes.user_limits
                WHERE user_id = %s
            """, (current_user['id'],))
            limit_result = cursor.fetchone()
            
            if not limit_result:
                total_limit = 0
                remaining = 0
            else:
                total_limit = limit_result[0] or 0
                remaining = limit_result[1] or 0
            
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
    try:
        with db_manager.get_connection() as conn:
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
            renewal_date = datetime.now() + timedelta(days=30)
            
            # Verificar se já tem assinatura ativa
            cursor.execute("""
                SELECT id FROM clientes.subscriptions
                WHERE user_id = %s AND status = 'active'
            """, (current_user['id'],))
            
            existing = cursor.fetchone()
            
            if existing:
                # Atualizar assinatura existente
                cursor.execute("""
                    UPDATE clientes.subscriptions
                    SET plan_id = %s, monthly_limit = %s, renewal_date = %s, updated_at = NOW()
                    WHERE id = %s
                """, (plan_id, monthly_limit, renewal_date, existing[0]))
            else:
                # Criar nova assinatura
                cursor.execute("""
                    INSERT INTO clientes.subscriptions (user_id, plan_id, monthly_limit, renewal_date, status)
                    VALUES (%s, %s, %s, %s, 'active')
                """, (current_user['id'], plan_id, monthly_limit, renewal_date))
            
            conn.commit()
            cursor.close()
            
            return {"message": "Assinatura criada/atualizada com sucesso", "plan_id": plan_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar assinatura: {str(e)}")

@router.post("/cancel")
async def cancel_subscription(current_user: dict = Depends(get_current_user)):
    """Cancela a assinatura do usuário"""
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE clientes.subscriptions
                SET status = 'cancelled', cancelled_at = NOW()
                WHERE user_id = %s AND status = 'active'
            """, (current_user['id'],))
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Nenhuma assinatura ativa encontrada")
            
            conn.commit()
            cursor.close()
            
            return {"message": "Assinatura cancelada com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao cancelar assinatura: {str(e)}")

@router.get("/transactions")
async def get_transactions(current_user: dict = Depends(get_current_user)):
    """Retorna histórico de transações"""
    # Se for usuário demo, retorna dados demo mais completos
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
    
    # Para outros usuários, retorna dados reais do banco (a implementar)
    return []

@router.get("/payment-methods")
async def get_payment_methods(current_user: dict = Depends(get_current_user)):
    """Retorna métodos de pagamento cadastrados"""
    # Se for usuário demo, retorna cartões demo
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
    
    # Para outros usuários, retorna dados reais do banco (a implementar)
    return []

@router.delete("/payment-methods/{card_id}")
async def delete_payment_method(card_id: int, current_user: dict = Depends(get_current_user)):
    """Remove um método de pagamento (DEMO)"""
    return {"message": "Cartão removido com sucesso (DEMO)"}

