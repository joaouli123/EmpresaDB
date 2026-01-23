import logging
from typing import Optional, Dict, Any
from datetime import datetime
from src.config import settings

try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    logging.warning("Biblioteca 'resend' não instalada. Instale com: pip install resend")

logger = logging.getLogger(__name__)


class EmailService:
    """Serviço para envio de emails via Resend API"""
    
    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        self.from_email = settings.EMAIL_FROM
        
        if not self.api_key:
            logger.warning("RESEND_API_KEY não configurada. Envio de emails desabilitado.")
        elif RESEND_AVAILABLE:
            resend.api_key = self.api_key
            logger.info("✅ Resend API inicializada com sucesso")
        else:
            logger.error("❌ Biblioteca 'resend' não disponível")
    
    def send_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str,
        plain_content: Optional[str] = None
    ) -> bool:
        """
        Envia um email via Resend API
        
        Args:
            to_email: Email do destinatário
            subject: Assunto do email
            html_content: Conteúdo HTML do email
            plain_content: Conteúdo em texto puro (opcional, ignorado pela Resend)
        
        Returns:
            True se enviado com sucesso, False caso contrário
        """
        if not self.api_key:
            logger.error("RESEND_API_KEY não configurada")
            return False
        
        if not RESEND_AVAILABLE:
            logger.error("Biblioteca 'resend' não disponível")
            return False
        
        try:
            params = {
                "from": f"DB Empresas <{self.from_email}>",
                "to": [to_email],
                "subject": subject,
                "html": html_content
            }
            
            response = resend.Emails.send(params)
            
            logger.info(f"✅ Email enviado via Resend para {to_email}: {subject} (ID: {response.get('id')})")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao enviar email via Resend para {to_email}: {e}")
            return False
    
    def send_account_creation_email(self, to_email: str, username: str) -> bool:
        """Envia email de boas-vindas após criação da conta"""
        from src.services.email_templates import get_account_creation_template
        
        subject = "Bem-vindo ao DB Empresas"
        html_content = get_account_creation_template(username)
        
        return self.send_email(to_email, subject, html_content)
    
    def send_account_activation_email(
        self, 
        to_email: str, 
        username: str, 
        activation_link: str
    ) -> bool:
        """Envia email de ativação de conta"""
        from src.services.email_templates import get_account_activation_template
        
        subject = "Ative sua conta no DB Empresas"
        html_content = get_account_activation_template(username, activation_link)
        
        return self.send_email(to_email, subject, html_content)
    
    def send_password_reset_email(
        self, 
        to_email: str, 
        reset_link: str
    ) -> bool:
        """Envia email de redefinição de senha"""
        from src.services.email_templates import get_password_reset_template
        
        subject = "Redefinir senha - DB Empresas"
        html_content = get_password_reset_template(reset_link)
        
        return self.send_email(to_email, subject, html_content)
    
    def send_subscription_created_email(
        self, 
        to_email: str, 
        username: str, 
        plan_name: str,
        plan_price: float,
        next_billing_date: str,
        monthly_queries: int = None
    ) -> bool:
        """Envia email quando assinatura é contratada"""
        from src.services.email_templates import get_subscription_created_template
        
        subject = "Assinatura Confirmada - DB Empresas"
        html_content = get_subscription_created_template(
            username, plan_name, plan_price, next_billing_date, monthly_queries
        )
        
        return self.send_email(to_email, subject, html_content)
    
    def send_subscription_renewed_email(
        self, 
        to_email: str, 
        username: str, 
        plan_name: str,
        amount_paid: float,
        next_billing_date: str,
        monthly_queries: int = None
    ) -> bool:
        """Envia email quando assinatura é renovada"""
        from src.services.email_templates import get_subscription_renewed_template
        
        subject = "Assinatura Renovada - DB Empresas"
        html_content = get_subscription_renewed_template(
            username, plan_name, amount_paid, next_billing_date, monthly_queries
        )
        
        return self.send_email(to_email, subject, html_content)
    
    def send_subscription_expired_email(
        self, 
        to_email: str, 
        username: str, 
        plan_name: str,
        expired_date: str,
        attempt: int = 1
    ) -> bool:
        """Envia email de follow-up para assinatura vencida"""
        from src.services.email_templates import get_subscription_expired_template
        
        # Removido (Lembrete X/5) do assunto
        subject = "Sua assinatura venceu - DB Empresas"
        html_content = get_subscription_expired_template(
            username, plan_name, expired_date, attempt
        )
        
        return self.send_email(to_email, subject, html_content)
    
    def send_subscription_cancelled_email(
        self, 
        to_email: str, 
        username: str, 
        plan_name: str,
        end_date: str,
        monthly_queries: int = None
    ) -> bool:
        """Envia email quando assinatura é cancelada"""
        from src.services.email_templates import get_subscription_cancelled_template
        
        subject = "Assinatura Cancelada - DB Empresas"
        html_content = get_subscription_cancelled_template(
            username, plan_name, end_date, monthly_queries
        )
        
        return self.send_email(to_email, subject, html_content)
    
    def send_usage_warning_email(
        self, 
        to_email: str, 
        username: str, 
        plan_name: str,
        queries_used: int,
        queries_limit: int,
        percentage_used: int
    ) -> bool:
        """Envia email de alerta de uso de consultas (50% ou 80%)"""
        from src.services.email_templates import get_usage_warning_template
        
        subject = f"Alerta de Uso: {percentage_used}% da Cota Utilizada - DB Empresas"
        html_content = get_usage_warning_template(
            username, plan_name, queries_used, queries_limit, percentage_used
        )
        
        return self.send_email(to_email, subject, html_content)
    
    def send_limit_reached_email(
        self,
        to_email: str,
        username: str,
        plan_name: str,
        limit: int
    ) -> bool:
        """Envia email quando limite mensal de consultas é atingido (100%)"""
        from src.services.email_templates import get_limit_reached_template
        
        subject = "⚠️ Limite de Consultas Atingido - DB Empresas"
        html_content = get_limit_reached_template(username, plan_name, limit)
        
        return self.send_email(to_email, subject, html_content)
    
    def send_batch_credits_purchased_email(
        self,
        to_email: str,
        username: str,
        package_name: str,
        credits_amount: int,
        price_paid: float,
        total_credits_now: int
    ) -> bool:
        """Envia email quando créditos de lote são comprados"""
        from src.services.email_templates import get_batch_credits_purchased_template
        
        subject = "✅ Créditos de Lote Adquiridos - DB Empresas"
        html_content = get_batch_credits_purchased_template(
            username, package_name, credits_amount, price_paid, total_credits_now
        )
        
        return self.send_email(to_email, subject, html_content)
    
    def send_refund_processed_email(
        self,
        to_email: str,
        username: str,
        refund_amount: float,
        refund_reason: str,
        original_transaction: str,
        processing_days: int = 7
    ) -> bool:
        """Envia email quando reembolso é processado"""
        from src.services.email_templates import get_refund_processed_template
        
        subject = "Reembolso Processado - DB Empresas"
        html_content = get_refund_processed_template(
            username, refund_amount, refund_reason, original_transaction, processing_days
        )
        
        return self.send_email(to_email, subject, html_content)
    
    def send_payment_failed_email(
        self,
        to_email: str,
        username: str,
        amount: float,
        plan_name: str,
        retry_date: str,
        card_last4: str = None
    ) -> bool:
        """Envia email quando pagamento falha"""
        from src.services.email_templates import get_payment_failed_template
        
        subject = "❌ Falha no Pagamento - DB Empresas"
        html_content = get_payment_failed_template(
            username, amount, plan_name, retry_date, card_last4
        )
        
        return self.send_email(to_email, subject, html_content)
    
    def send_card_expiring_email(
        self,
        to_email: str,
        username: str,
        card_brand: str,
        card_last4: str,
        exp_month: int,
        exp_year: int
    ) -> bool:
        """Envia email quando cartão está próximo de expirar"""
        from src.services.email_templates import get_card_expiring_template
        
        subject = "⚠️ Cartão Expirando em Breve - DB Empresas"
        html_content = get_card_expiring_template(
            username, card_brand, card_last4, exp_month, exp_year
        )
        
        return self.send_email(to_email, subject, html_content)


email_service = EmailService()
