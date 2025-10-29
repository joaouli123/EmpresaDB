"""
Serviço Stripe para compra de pacotes de consultas em lote
"""

import stripe
import logging
from typing import Optional, Dict, Any
from src.database.connection import db_manager
from src.config import settings
from datetime import datetime

logger = logging.getLogger(__name__)

stripe.api_key = settings.STRIPE_SECRET_KEY

class BatchStripeService:
    """Serviço para gerenciar compras de pacotes de consultas em lote via Stripe"""
    
    async def create_package_checkout_session(
        self,
        user_id: int,
        package_id: int,
        success_url: str,
        cancel_url: str
    ) -> Optional[Dict[str, Any]]:
        """
        Cria uma sessão de checkout do Stripe para compra de pacote de consultas em lote
        
        Args:
            user_id: ID do usuário
            package_id: ID do pacote escolhido
            success_url: URL de retorno em caso de sucesso
            cancel_url: URL de retorno em caso de cancelamento
            
        Returns:
            Dict com session_id e url do checkout, ou None em caso de erro
        """
        try:
            # Buscar informações do pacote
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, name, display_name, credits, price_brl, stripe_price_id, stripe_product_id
                    FROM clientes.batch_query_packages
                    WHERE id = %s AND is_active = TRUE
                """, (package_id,))
                package = cursor.fetchone()
                
                if not package:
                    logger.error(f"Pacote {package_id} não encontrado ou não está ativo")
                    cursor.close()
                    return None
                
                pkg_id, pkg_name, pkg_display_name, credits, price_brl, stripe_price_id, stripe_product_id = package
                
                # Buscar informações do usuário
                cursor.execute("""
                    SELECT username, email FROM clientes.users WHERE id = %s
                """, (user_id,))
                user = cursor.fetchone()
                cursor.close()
                
                if not user:
                    logger.error(f"Usuário {user_id} não encontrado")
                    return None
                
                username, email = user
            
            # Buscar ou criar customer no Stripe
            from src.api.stripe_service import stripe_service
            customer_id = await stripe_service.get_or_create_customer(user_id, email, username)
            
            if not customer_id:
                logger.error(f"Falha ao obter customer_id para user_id {user_id}")
                return None
            
            # Se o pacote ainda não tem stripe_price_id, criar produto e preço no Stripe
            if not stripe_price_id or not stripe_product_id:
                logger.info(f"Criando produto e preço no Stripe para pacote {package_id}")
                
                # Criar produto
                product = stripe.Product.create(
                    name=pkg_display_name,
                    description=f"Pacote com {credits:,} créditos para consultas em lote",
                    metadata={
                        'package_id': str(package_id),
                        'credits': str(credits)
                    }
                )
                stripe_product_id = product.id
                
                # Criar preço (one-time payment, não recorrente)
                price = stripe.Price.create(
                    product=stripe_product_id,
                    unit_amount=int(price_brl * 100),  # Converter para centavos
                    currency='brl',
                    metadata={
                        'package_id': str(package_id),
                        'credits': str(credits)
                    }
                )
                stripe_price_id = price.id
                
                # Atualizar pacote no banco com os IDs do Stripe
                with db_manager.get_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        UPDATE clientes.batch_query_packages
                        SET stripe_price_id = %s, stripe_product_id = %s
                        WHERE id = %s
                    """, (stripe_price_id, stripe_product_id, package_id))
                    cursor.close()
                
                logger.info(f"Produto e preço criados: product_id={stripe_product_id}, price_id={stripe_price_id}")
            
            # Criar sessão de checkout
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': stripe_price_id,
                    'quantity': 1,
                }],
                mode='payment',  # Pagamento único, não assinatura
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    'user_id': str(user_id),
                    'package_id': str(package_id),
                    'credits': str(credits),
                    'type': 'batch_package_purchase'
                }
            )
            
            logger.info(f"Sessão de checkout criada: {session.id} para user_id={user_id}, package_id={package_id}")
            
            return {
                'session_id': session.id,
                'url': session.url
            }
            
        except Exception as e:
            logger.error(f"Erro ao criar checkout session para pacote: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def process_package_purchase(
        self,
        session_data: Dict[str, Any]
    ) -> bool:
        """
        Processa compra de pacote após pagamento confirmado
        
        Args:
            session_data: Dados da sessão de checkout do Stripe
            
        Returns:
            True se processado com sucesso, False caso contrário
        """
        try:
            metadata = session_data.get('metadata', {})
            
            # Validar metadata obrigatória
            if not metadata or not metadata.get('user_id') or not metadata.get('package_id') or not metadata.get('credits'):
                logger.error(f"Metadata incompleta no session_data: {metadata}")
                return False
            
            try:
                user_id = int(metadata.get('user_id'))
                package_id = int(metadata.get('package_id'))
                credits = int(metadata.get('credits'))
            except (ValueError, TypeError) as e:
                logger.error(f"Erro ao converter metadata para inteiros: {e}")
                return False
            
            payment_intent = session_data.get('payment_intent')
            amount_total = session_data.get('amount_total', 0) / 100  # Converter de centavos para reais
            
            logger.info(f"Processando compra de pacote: user_id={user_id}, package_id={package_id}, credits={credits}")
            
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Registrar compra
                cursor.execute("""
                    INSERT INTO clientes.batch_package_purchases 
                    (user_id, package_id, stripe_payment_intent_id, credits_purchased, amount_paid, status, completed_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    user_id,
                    package_id,
                    payment_intent,
                    credits,
                    amount_total,
                    'completed',
                    datetime.now()
                ))
                
                purchase_id = cursor.fetchone()
                if purchase_id:
                    purchase_id = purchase_id[0]
                
                # Adicionar créditos ao usuário
                cursor.execute("""
                    SELECT clientes.add_batch_credits(%s, %s, %s)
                """, (user_id, credits, 'purchase'))
                
                cursor.close()
            
            logger.info(f"✅ Compra processada com sucesso: purchase_id={purchase_id}, {credits} créditos adicionados para user_id={user_id}")
            
            # Enviar email de confirmação de compra
            try:
                from src.services.email_service import email_service
                from src.services.email_tracking import email_tracking_service
                
                # Buscar informações do usuário e pacote para o email
                with db_manager.get_connection() as conn:
                    cursor = conn.cursor()
                    
                    # Buscar usuário
                    cursor.execute("""
                        SELECT username, email FROM clientes.users WHERE id = %s
                    """, (user_id,))
                    user = cursor.fetchone()
                    
                    # Buscar pacote
                    cursor.execute("""
                        SELECT display_name FROM clientes.batch_query_packages WHERE id = %s
                    """, (package_id,))
                    package = cursor.fetchone()
                    
                    # Buscar total de créditos após compra
                    cursor.execute("""
                        SELECT total_credits FROM clientes.batch_credits WHERE user_id = %s
                    """, (user_id,))
                    credits_row = cursor.fetchone()
                    
                    cursor.close()
                
                if user and package and credits_row:
                    username, email = user
                    package_name = package[0]
                    total_credits_now = credits_row[0]
                    
                    # Enviar email
                    email_sent = email_service.send_batch_credits_purchased_email(
                        to_email=email,
                        username=username,
                        package_name=package_name,
                        credits_amount=credits,
                        price_paid=amount_total,
                        total_credits_now=total_credits_now
                    )
                    
                    # Registrar envio no tracking
                    email_tracking_service.log_email_sent(
                        user_id=user_id,
                        email_type='batch_credits_purchased',
                        recipient_email=email,
                        subject="Créditos de Lote Adquiridos - DB Empresas",
                        status='sent' if email_sent else 'failed'
                    )
                    
                    logger.info(f"Email de confirmação de compra enviado para {email}")
                else:
                    logger.warning(f"Não foi possível enviar email: dados incompletos")
                    
            except Exception as email_error:
                logger.error(f"Erro ao enviar email de confirmação: {email_error}")
                # Não falha a transação se o email falhar
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao processar compra de pacote: {e}")
            import traceback
            traceback.print_exc()
            return False

batch_stripe_service = BatchStripeService()
