import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
from datetime import datetime
from src.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Serviço para envio de emails via SMTP"""
    
    def __init__(self):
        self.host = settings.EMAIL_HOST
        self.port = settings.EMAIL_PORT
        self.user = settings.EMAIL_USER
        self.password = settings.EMAIL_PASSWORD
        self.from_email = settings.EMAIL_FROM
        self.use_ssl = settings.EMAIL_USE_SSL
        
        if not all([self.host, self.user, self.password, self.from_email]):
            logger.warning("Configurações de email incompletas. Envio de emails desabilitado.")
    
    def _get_smtp_connection(self):
        """Cria conexão SMTP"""
        try:
            if self.use_ssl:
                server = smtplib.SMTP_SSL(self.host, self.port, timeout=10)
            else:
                server = smtplib.SMTP(self.host, self.port, timeout=10)
                server.starttls()
            
            server.login(self.user, self.password)
            return server
        except Exception as e:
            logger.error(f"Erro ao conectar ao servidor SMTP: {e}")
            raise
    
    def send_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str,
        plain_content: Optional[str] = None
    ) -> bool:
        """
        Envia um email
        
        Args:
            to_email: Email do destinatário
            subject: Assunto do email
            html_content: Conteúdo HTML do email
            plain_content: Conteúdo em texto puro (opcional)
        
        Returns:
            True se enviado com sucesso, False caso contrário
        """
        if not all([self.host, self.user, self.password, self.from_email]):
            logger.error("Configurações de email incompletas")
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            # Usar nome personalizado ao invés de só o email
            msg['From'] = f"DB Empresas <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            msg['Date'] = datetime.now().strftime('%a, %d %b %Y %H:%M:%S %z')
            
            if plain_content:
                part1 = MIMEText(plain_content, 'plain', 'utf-8')
                msg.attach(part1)
            
            part2 = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(part2)
            
            with self._get_smtp_connection() as server:
                server.send_message(msg)
            
            logger.info(f"Email enviado com sucesso para {to_email}: {subject}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao enviar email para {to_email}: {e}")
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


email_service = EmailService()
