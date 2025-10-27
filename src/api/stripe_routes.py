"""
Rotas da API para integração com Stripe
"""
from fastapi import APIRouter, HTTPException, Depends, Request, Header
from typing import Optional
from pydantic import BaseModel
import logging
import os

from src.api.auth import get_current_user
from src.api.stripe_service import stripe_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stripe", tags=["Stripe Payment"])

class CheckoutRequest(BaseModel):
    plan_id: int
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None

class PortalRequest(BaseModel):
    return_url: Optional[str] = None

@router.post("/create-checkout-session")
async def create_checkout_session(
    data: CheckoutRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Cria uma sessão de checkout do Stripe para assinar um plano
    """
    try:
        # URLs padrão se não fornecidas
        base_url = os.getenv('REPLIT_DOMAINS', 'http://localhost:5000').split(',')[0]
        if not base_url.startswith('http'):
            base_url = f'https://{base_url}'
        
        success_url = data.success_url or f'{base_url}/subscription?success=true'
        cancel_url = data.cancel_url or f'{base_url}/pricing?canceled=true'
        
        # Criar sessão de checkout
        session = await stripe_service.create_checkout_session(
            user_id=current_user['id'],
            plan_id=data.plan_id,
            success_url=success_url,
            cancel_url=cancel_url
        )
        
        if not session:
            raise HTTPException(
                status_code=500,
                detail="Erro ao criar sessão de checkout"
            )
        
        return session
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar checkout session: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno ao processar pagamento: {str(e)}"
        )

@router.post("/cancel-subscription")
async def cancel_subscription(current_user: dict = Depends(get_current_user)):
    """
    Cancela a assinatura do usuário (no final do período)
    """
    try:
        success = await stripe_service.cancel_subscription(current_user['id'])
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Nenhuma assinatura ativa encontrada"
            )
        
        return {
            "message": "Assinatura cancelada com sucesso. Seu acesso continuará até o final do período pago.",
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao cancelar assinatura: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao cancelar assinatura: {str(e)}"
        )

@router.post("/customer-portal")
async def create_customer_portal(
    data: PortalRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Cria uma sessão do Customer Portal do Stripe
    (onde o usuário pode gerenciar seu método de pagamento, ver faturas, etc)
    """
    try:
        base_url = os.getenv('REPLIT_DOMAINS', 'http://localhost:5000').split(',')[0]
        if not base_url.startswith('http'):
            base_url = f'https://{base_url}'
        
        return_url = data.return_url or f'{base_url}/subscription'
        
        portal_url = await stripe_service.get_customer_portal_url(
            user_id=current_user['id'],
            return_url=return_url
        )
        
        if not portal_url:
            raise HTTPException(
                status_code=404,
                detail="Você ainda não tem uma conta Stripe. Assine um plano primeiro."
            )
        
        return {"url": portal_url}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar portal session: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao acessar portal: {str(e)}"
        )

@router.get("/subscription")
async def get_subscription(current_user: dict = Depends(get_current_user)):
    """
    Retorna detalhes da assinatura atual do usuário
    """
    try:
        subscription = await stripe_service.get_subscription_details(current_user['id'])
        
        if not subscription:
            return {
                "has_subscription": False,
                "message": "Você ainda não tem uma assinatura ativa"
            }
        
        return {
            "has_subscription": True,
            **subscription
        }
        
    except Exception as e:
        logger.error(f"Erro ao buscar assinatura: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar assinatura: {str(e)}"
        )

@router.get("/invoices")
async def get_invoices(
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """
    Lista faturas do usuário
    """
    try:
        invoices = await stripe_service.list_invoices(current_user['id'], limit)
        return {"invoices": invoices}
        
    except Exception as e:
        logger.error(f"Erro ao listar faturas: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar faturas: {str(e)}"
        )
