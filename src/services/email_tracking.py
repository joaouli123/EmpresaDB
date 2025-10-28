"""
Serviço para rastrear envios de email e gerenciar follow-ups
"""
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import json
from src.config import settings

logger = logging.getLogger(__name__)


class EmailTrackingService:
    """Serviço para rastrear emails e gerenciar follow-ups"""
    
    def __init__(self):
        from src.database.connection import db_manager
        self.db_manager = db_manager
    
    def log_email_sent(
        self,
        user_id: int,
        email_type: str,
        recipient_email: str,
        subject: str,
        status: str = 'sent',
        error_message: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Registra um email enviado no log
        
        Args:
            user_id: ID do usuário
            email_type: Tipo de email ('account_created', 'activation', etc)
            recipient_email: Email do destinatário
            subject: Assunto do email
            status: Status do envio ('sent', 'failed', 'bounced')
            error_message: Mensagem de erro se houver
            metadata: Dados adicionais em JSON
        """
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO clientes.email_logs 
                    (user_id, email_type, recipient_email, subject, status, error_message, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_id,
                    email_type,
                    recipient_email,
                    subject,
                    status,
                    error_message,
                    json.dumps(metadata) if metadata else None
                ))
                cursor.close()
            
            logger.info(f"Email log registrado: {email_type} para user_id={user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao registrar log de email: {e}")
            return False
    
    def get_or_create_followup_tracking(
        self,
        user_id: int,
        subscription_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Busca ou cria registro de follow-up para uma assinatura
        
        Returns:
            Dict com dados do tracking ou None
        """
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Buscar tracking existente
                cursor.execute("""
                    SELECT id, user_id, subscription_id, attempt_number, 
                           total_attempts, last_attempt_at, next_attempt_at, status
                    FROM clientes.subscription_followup_tracking
                    WHERE user_id = %s AND subscription_id = %s
                """, (user_id, subscription_id))
                
                result = cursor.fetchone()
                
                if result:
                    cursor.close()
                    return {
                        'id': result[0],
                        'user_id': result[1],
                        'subscription_id': result[2],
                        'attempt_number': result[3],
                        'total_attempts': result[4],
                        'last_attempt_at': result[5],
                        'next_attempt_at': result[6],
                        'status': result[7]
                    }
                
                # Criar novo registro
                cursor.execute("""
                    INSERT INTO clientes.subscription_followup_tracking
                    (user_id, subscription_id, attempt_number, total_attempts, status)
                    VALUES (%s, %s, 1, 0, 'pending')
                    RETURNING id, user_id, subscription_id, attempt_number, 
                              total_attempts, last_attempt_at, next_attempt_at, status
                """, (user_id, subscription_id))
                
                result = cursor.fetchone()
                cursor.close()
                
                return {
                    'id': result[0],
                    'user_id': result[1],
                    'subscription_id': result[2],
                    'attempt_number': result[3],
                    'total_attempts': result[4],
                    'last_attempt_at': result[5],
                    'next_attempt_at': result[6],
                    'status': result[7]
                }
                
        except Exception as e:
            logger.error(f"Erro ao buscar/criar tracking de follow-up: {e}")
            return None
    
    def update_followup_attempt(
        self,
        tracking_id: int,
        success: bool
    ) -> bool:
        """
        Atualiza tentativa de follow-up após envio
        
        Args:
            tracking_id: ID do registro de tracking
            success: Se o email foi enviado com sucesso
        """
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                # Buscar dados atuais
                cursor.execute("""
                    SELECT attempt_number, total_attempts
                    FROM clientes.subscription_followup_tracking
                    WHERE id = %s
                """, (tracking_id,))
                
                result = cursor.fetchone()
                if not result:
                    cursor.close()
                    return False
                
                current_attempt, total_attempts = result
                new_total = total_attempts + 1
                
                # Calcular próxima tentativa (a cada 3 dias)
                next_attempt = None
                new_status = 'sent'
                
                if current_attempt < 5:
                    next_attempt = datetime.now() + timedelta(days=3)
                    new_attempt_number = current_attempt + 1
                else:
                    # Última tentativa - marcar como completo
                    new_status = 'completed'
                    new_attempt_number = current_attempt
                
                # Atualizar registro
                cursor.execute("""
                    UPDATE clientes.subscription_followup_tracking
                    SET attempt_number = %s,
                        total_attempts = %s,
                        last_attempt_at = CURRENT_TIMESTAMP,
                        next_attempt_at = %s,
                        status = %s
                    WHERE id = %s
                """, (new_attempt_number, new_total, next_attempt, new_status, tracking_id))
                
                cursor.close()
                
            logger.info(f"Follow-up tracking atualizado: id={tracking_id}, tentativa={new_total}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao atualizar tentativa de follow-up: {e}")
            return False
    
    def get_pending_followups(self) -> List[Dict[str, Any]]:
        """
        Busca follow-ups pendentes que precisam ser enviados
        
        Returns:
            Lista de dicts com dados dos follow-ups pendentes
        """
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT 
                        ft.id,
                        ft.user_id,
                        ft.subscription_id,
                        ft.attempt_number,
                        ft.total_attempts,
                        u.username,
                        u.email,
                        ss.plan_id,
                        ss.current_period_end,
                        p.display_name as plan_name
                    FROM clientes.subscription_followup_tracking ft
                    INNER JOIN clientes.users u ON ft.user_id = u.id
                    INNER JOIN clientes.stripe_subscriptions ss ON ft.subscription_id = ss.id
                    LEFT JOIN clientes.plans p ON ss.plan_id = p.id
                    WHERE ft.status IN ('pending', 'sent')
                        AND ft.attempt_number <= 5
                        AND (
                            ft.next_attempt_at IS NULL 
                            OR ft.next_attempt_at <= CURRENT_TIMESTAMP
                        )
                        AND ss.status IN ('past_due', 'canceled', 'unpaid')
                    ORDER BY ft.last_attempt_at ASC NULLS FIRST
                    LIMIT 100
                """)
                
                results = cursor.fetchall()
                cursor.close()
                
                followups = []
                for row in results:
                    followups.append({
                        'tracking_id': row[0],
                        'user_id': row[1],
                        'subscription_id': row[2],
                        'attempt_number': row[3],
                        'total_attempts': row[4],
                        'username': row[5],
                        'email': row[6],
                        'plan_id': row[7],
                        'expired_date': row[8],
                        'plan_name': row[9] or 'Plano'
                    })
                
                return followups
                
        except Exception as e:
            logger.error(f"Erro ao buscar follow-ups pendentes: {e}")
            return []
    
    def mark_followup_abandoned(self, user_id: int, subscription_id: int) -> bool:
        """
        Marca um follow-up como abandonado (após assinatura ser renovada)
        """
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE clientes.subscription_followup_tracking
                    SET status = 'abandoned'
                    WHERE user_id = %s AND subscription_id = %s
                """, (user_id, subscription_id))
                cursor.close()
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao marcar follow-up como abandonado: {e}")
            return False


email_tracking_service = EmailTrackingService()
