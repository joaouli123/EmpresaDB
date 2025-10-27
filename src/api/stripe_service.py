"""
Serviço de integração com Stripe para gerenciar pagamentos e assinaturas
"""
import os
import stripe
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from src.database.connection import db_manager

logger = logging.getLogger(__name__)

# Configurar Stripe com a chave secreta
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

class StripeService:
    """Serviço para gerenciar operações com Stripe"""
    
    def __init__(self):
        if not stripe.api_key:
            logger.warning("STRIPE_SECRET_KEY não configurada. Funcionalidades de pagamento desabilitadas.")
    
    async def get_or_create_customer(self, user_id: int, email: str, username: str) -> Optional[str]:
        """
        Busca ou cria um customer no Stripe para o usuário
        
        Args:
            user_id: ID do usuário no sistema
            email: Email do usuário
            username: Nome do usuário
            
        Returns:
            stripe_customer_id ou None em caso de erro
        """
        try:
            # Verificar se já existe customer cadastrado
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT stripe_customer_id FROM clientes.stripe_customers
                    WHERE user_id = %s
                """, (user_id,))
                result = cursor.fetchone()
                cursor.close()
                
                if result and result[0]:
                    return result[0]
            
            # Criar novo customer no Stripe
            customer = stripe.Customer.create(
                email=email,
                name=username,
                metadata={
                    'user_id': str(user_id)
                }
            )
            
            # Salvar customer_id no banco
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO clientes.stripe_customers (user_id, stripe_customer_id, email)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (user_id) DO UPDATE SET
                        stripe_customer_id = EXCLUDED.stripe_customer_id,
                        email = EXCLUDED.email,
                        updated_at = CURRENT_TIMESTAMP
                """, (user_id, customer.id, email))
                cursor.close()
            
            logger.info(f"Customer Stripe criado: {customer.id} para user_id: {user_id}")
            return customer.id
            
        except Exception as e:
            logger.error(f"Erro ao criar customer Stripe: {e}")
            return None
    
    async def create_checkout_session(
        self, 
        user_id: int, 
        plan_id: int, 
        success_url: str, 
        cancel_url: str
    ) -> Optional[Dict[str, Any]]:
        """
        Cria uma sessão de checkout do Stripe
        
        Args:
            user_id: ID do usuário
            plan_id: ID do plano escolhido
            success_url: URL de retorno em caso de sucesso
            cancel_url: URL de retorno em caso de cancelamento
            
        Returns:
            Dict com session_id e url do checkout, ou None em caso de erro
        """
        try:
            # Buscar informações do plano
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT name, display_name, monthly_queries, price_brl, stripe_price_id
                    FROM clientes.plans
                    WHERE id = %s AND is_active = TRUE
                """, (plan_id,))
                plan = cursor.fetchone()
                cursor.close()
                
                if not plan:
                    logger.error(f"Plano {plan_id} não encontrado")
                    return None
                
                plan_name, display_name, monthly_queries, price_brl, stripe_price_id = plan
            
            # Buscar dados do usuário
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, username, email FROM clientes.users
                    WHERE id = %s
                """, (user_id,))
                user_data = cursor.fetchone()
                cursor.close()
                
                if not user_data:
                    logger.error(f"Usuário {user_id} não encontrado")
                    return None
                
                user = {
                    'id': user_data[0],
                    'username': user_data[1],
                    'email': user_data[2]
                }
            
            # Criar ou buscar customer
            customer_id = await self.get_or_create_customer(
                user_id, 
                user.get('email', ''), 
                user.get('username', '')
            )
            
            if not customer_id:
                return None
            
            # Configurar itens da sessão
            # Se o plano tem stripe_price_id, usar ele, senão criar preço on-the-fly
            line_items = []
            
            if stripe_price_id:
                # Usar preço já configurado no Stripe
                line_items.append({
                    'price': stripe_price_id,
                    'quantity': 1
                })
            else:
                # Criar preço on-the-fly (para planos sem stripe_price_id configurado)
                line_items.append({
                    'price_data': {
                        'currency': 'brl',
                        'product_data': {
                            'name': display_name,
                            'description': f'{monthly_queries:,} consultas/mês'.replace(',', '.')
                        },
                        'unit_amount': int(price_brl * 100),  # Converter para centavos
                        'recurring': {
                            'interval': 'month'
                        }
                    },
                    'quantity': 1
                })
            
            # Criar sessão de checkout
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=line_items,
                mode='subscription',
                success_url=success_url + '?session_id={CHECKOUT_SESSION_ID}',
                cancel_url=cancel_url,
                metadata={
                    'user_id': str(user_id),
                    'plan_id': str(plan_id),
                    'plan_name': plan_name
                },
                subscription_data={
                    'metadata': {
                        'user_id': str(user_id),
                        'plan_id': str(plan_id),
                        'plan_name': plan_name
                    }
                }
            )
            
            logger.info(f"Checkout session criada: {session.id} para user_id: {user_id}")
            
            return {
                'session_id': session.id,
                'url': session.url
            }
            
        except Exception as e:
            logger.error(f"Erro ao criar checkout session: {e}")
            return None
    
    async def cancel_subscription(self, user_id: int) -> bool:
        """
        Cancela a assinatura do usuário no Stripe
        
        Args:
            user_id: ID do usuário
            
        Returns:
            True se cancelada com sucesso, False caso contrário
        """
        try:
            # Buscar assinatura ativa do usuário
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT stripe_subscription_id FROM clientes.stripe_subscriptions
                    WHERE user_id = %s AND status IN ('active', 'trialing')
                    ORDER BY created_at DESC
                    LIMIT 1
                """, (user_id,))
                result = cursor.fetchone()
                cursor.close()
                
                if not result:
                    logger.warning(f"Nenhuma assinatura ativa encontrada para user_id: {user_id}")
                    return False
                
                subscription_id = result[0]
            
            # Cancelar no Stripe (no final do período)
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
            
            # Atualizar no banco
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE clientes.stripe_subscriptions
                    SET cancel_at_period_end = TRUE,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE stripe_subscription_id = %s
                """, (subscription_id,))
                cursor.close()
            
            logger.info(f"Assinatura {subscription_id} cancelada no final do período para user_id: {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao cancelar assinatura: {e}")
            return False
    
    async def get_customer_portal_url(self, user_id: int, return_url: str) -> Optional[str]:
        """
        Cria uma sessão do Customer Portal do Stripe
        
        Args:
            user_id: ID do usuário
            return_url: URL de retorno
            
        Returns:
            URL do portal ou None em caso de erro
        """
        try:
            # Buscar customer_id do usuário
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT stripe_customer_id FROM clientes.stripe_customers
                    WHERE user_id = %s
                """, (user_id,))
                result = cursor.fetchone()
                cursor.close()
                
                if not result:
                    logger.warning(f"Customer não encontrado para user_id: {user_id}")
                    return None
                
                customer_id = result[0]
            
            # Criar sessão do portal
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url
            )
            
            return session.url
            
        except Exception as e:
            logger.error(f"Erro ao criar portal session: {e}")
            return None
    
    async def get_subscription_details(self, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Busca detalhes da assinatura do usuário
        
        Args:
            user_id: ID do usuário
            
        Returns:
            Dict com informações da assinatura ou None
        """
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT 
                        ss.stripe_subscription_id,
                        ss.status,
                        ss.current_period_start,
                        ss.current_period_end,
                        ss.cancel_at_period_end,
                        p.name as plan_name,
                        p.display_name,
                        p.monthly_queries,
                        p.price_brl
                    FROM clientes.stripe_subscriptions ss
                    JOIN clientes.plans p ON ss.plan_id = p.id
                    WHERE ss.user_id = %s
                    ORDER BY ss.created_at DESC
                    LIMIT 1
                """, (user_id,))
                result = cursor.fetchone()
                cursor.close()
                
                if not result:
                    return None
                
                return {
                    'subscription_id': result[0],
                    'status': result[1],
                    'current_period_start': result[2].isoformat() if result[2] else None,
                    'current_period_end': result[3].isoformat() if result[3] else None,
                    'cancel_at_period_end': result[4],
                    'plan_name': result[5],
                    'plan_display_name': result[6],
                    'monthly_queries': result[7],
                    'price_brl': float(result[8])
                }
                
        except Exception as e:
            logger.error(f"Erro ao buscar detalhes da assinatura: {e}")
            return None
    
    async def list_invoices(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Lista faturas do usuário
        
        Args:
            user_id: ID do usuário
            limit: Número máximo de faturas
            
        Returns:
            Lista de faturas
        """
        try:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT 
                        stripe_invoice_id,
                        amount_total,
                        currency,
                        status,
                        invoice_pdf,
                        hosted_invoice_url,
                        created_at,
                        paid_at
                    FROM clientes.stripe_invoices
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (user_id, limit))
                results = cursor.fetchall()
                cursor.close()
                
                invoices = []
                for row in results:
                    invoices.append({
                        'id': row[0],
                        'amount': float(row[1]),
                        'currency': row[2],
                        'status': row[3],
                        'pdf_url': row[4],
                        'invoice_url': row[5],
                        'created_at': row[6].isoformat() if row[6] else None,
                        'paid_at': row[7].isoformat() if row[7] else None
                    })
                
                return invoices
                
        except Exception as e:
            logger.error(f"Erro ao listar faturas: {e}")
            return []

# Instância global do serviço
stripe_service = StripeService()
