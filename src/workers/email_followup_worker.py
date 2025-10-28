"""
Worker para processar follow-ups de assinaturas vencidas e notificações de uso
Deve ser executado periodicamente (a cada 1 hora ou via cron job)
"""
import logging
import asyncio
from datetime import datetime
from typing import List, Dict, Any
from src.services.email_service import email_service
from src.services.email_tracking import email_tracking_service
from src.database.connection import db_manager

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class EmailFollowupWorker:
    """Worker para processar follow-ups automáticos"""
    
    def __init__(self):
        self.email_service = email_service
        self.tracking_service = email_tracking_service
        self.db_manager = db_manager
    
    async def process_subscription_followups(self) -> int:
        """
        Processa follow-ups de assinaturas vencidas
        
        Returns:
            Número de follow-ups processados
        """
        logger.info("Iniciando processamento de follow-ups de assinaturas vencidas...")
        
        pending_followups = self.tracking_service.get_pending_followups()
        
        if not pending_followups:
            logger.info("Nenhum follow-up pendente encontrado")
            return 0
        
        logger.info(f"Encontrados {len(pending_followups)} follow-ups pendentes")
        
        processed = 0
        for followup in pending_followups:
            try:
                tracking_id = followup['tracking_id']
                user_id = followup['user_id']
                username = followup['username']
                email = followup['email']
                plan_name = followup['plan_name']
                expired_date = followup['expired_date']
                attempt_number = followup['attempt_number']
                
                # Verificar se assinatura ainda está vencida
                if not self._is_subscription_still_expired(followup['subscription_id']):
                    logger.info(f"Assinatura {followup['subscription_id']} foi renovada. Marcando follow-up como abandonado.")
                    self.tracking_service.mark_followup_abandoned(user_id, followup['subscription_id'])
                    continue
                
                # Formatar data de expiração
                if isinstance(expired_date, datetime):
                    expired_date_str = expired_date.strftime('%d/%m/%Y')
                else:
                    expired_date_str = str(expired_date)
                
                # Enviar email de follow-up
                logger.info(f"Enviando follow-up {attempt_number}/5 para {email}")
                
                success = self.email_service.send_subscription_expired_email(
                    to_email=email,
                    username=username,
                    plan_name=plan_name,
                    expired_date=expired_date_str,
                    attempt=attempt_number
                )
                
                if success:
                    # Registrar envio no log
                    self.tracking_service.log_email_sent(
                        user_id=user_id,
                        email_type='subscription_expired',
                        recipient_email=email,
                        subject=f"Sua assinatura venceu - DB Empresas (Lembrete {attempt_number}/5)",
                        status='sent',
                        metadata={
                            'plan_name': plan_name,
                            'attempt': attempt_number,
                            'expired_date': expired_date_str
                        }
                    )
                    
                    # Atualizar tracking de follow-up
                    self.tracking_service.update_followup_attempt(tracking_id, True)
                    processed += 1
                    logger.info(f"Follow-up enviado com sucesso para {email}")
                else:
                    logger.error(f"Falha ao enviar follow-up para {email}")
                    self.tracking_service.log_email_sent(
                        user_id=user_id,
                        email_type='subscription_expired',
                        recipient_email=email,
                        subject=f"Sua assinatura venceu - DB Empresas (Lembrete {attempt_number}/5)",
                        status='failed',
                        error_message='Falha ao enviar email'
                    )
                
                # Pequeno delay entre envios
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Erro ao processar follow-up: {e}")
                continue
        
        logger.info(f"Processamento concluído: {processed} follow-ups enviados")
        return processed
    
    def _is_subscription_still_expired(self, subscription_id: int) -> bool:
        """Verifica se assinatura ainda está vencida"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT status, current_period_end
                    FROM clientes.stripe_subscriptions
                    WHERE id = %s
                """, (subscription_id,))
                
                result = cursor.fetchone()
                cursor.close()
                
                if not result:
                    return False
                
                status, period_end = result
                
                # Assinatura está vencida se:
                # - Status é 'past_due', 'canceled', 'unpaid'
                # - Ou período acabou e não está ativa
                if status in ('past_due', 'canceled', 'unpaid'):
                    return True
                
                if period_end and period_end < datetime.now():
                    return status not in ('active', 'trialing')
                
                return False
                
        except Exception as e:
            logger.error(f"Erro ao verificar status da assinatura: {e}")
            return False
    
    async def process_usage_notifications(self) -> int:
        """
        Processa notificações de uso de consultas (50% e 80%)
        
        Returns:
            Número de notificações enviadas
        """
        logger.info("Iniciando processamento de notificações de uso...")
        
        users_to_notify = self._get_users_needing_usage_notification()
        
        if not users_to_notify:
            logger.info("Nenhum usuário precisa de notificação de uso")
            return 0
        
        logger.info(f"Encontrados {len(users_to_notify)} usuários para notificar")
        
        processed = 0
        for user in users_to_notify:
            try:
                user_id = user['user_id']
                username = user['username']
                email = user['email']
                plan_name = user['plan_name']
                queries_used = user['queries_used']
                queries_limit = user['queries_limit']
                percentage_used = user['percentage_used']
                month_year = user['month_year']
                notify_50 = user['notify_50']
                notify_80 = user['notify_80']
                
                # Determinar qual notificação enviar (80% tem prioridade)
                if notify_80:
                    notification_type = 80
                elif notify_50:
                    notification_type = 50
                else:
                    continue
                
                # Enviar email de alerta
                logger.info(f"Enviando alerta de {notification_type}% para {email}")
                
                success = self.email_service.send_usage_warning_email(
                    to_email=email,
                    username=username,
                    plan_name=plan_name,
                    queries_used=queries_used,
                    queries_limit=queries_limit,
                    percentage_used=notification_type
                )
                
                if success:
                    # Registrar envio no log
                    self.tracking_service.log_email_sent(
                        user_id=user_id,
                        email_type=f'usage_{notification_type}',
                        recipient_email=email,
                        subject=f"Alerta de Uso: {notification_type}% da Cota Utilizada - DB Empresas",
                        status='sent',
                        metadata={
                            'plan_name': plan_name,
                            'queries_used': queries_used,
                            'queries_limit': queries_limit,
                            'percentage_used': notification_type
                        }
                    )
                    
                    # Marcar notificação como enviada
                    self._mark_usage_notification_sent(user_id, month_year, notification_type)
                    processed += 1
                    logger.info(f"Alerta de {notification_type}% enviado com sucesso para {email}")
                else:
                    logger.error(f"Falha ao enviar alerta para {email}")
                
                # Pequeno delay entre envios
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Erro ao processar notificação de uso: {e}")
                continue
        
        logger.info(f"Processamento concluído: {processed} notificações enviadas")
        return processed
    
    def _get_users_needing_usage_notification(self) -> List[Dict[str, Any]]:
        """Busca usuários que precisam receber notificação de uso"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    WITH user_usage AS (
                        SELECT 
                            u.id as user_id,
                            u.username,
                            u.email,
                            mu.month_year,
                            mu.queries_used,
                            p.monthly_queries as queries_limit,
                            p.display_name as plan_name,
                            ROUND((mu.queries_used::DECIMAL / NULLIF(p.monthly_queries, 0)) * 100, 2) as percentage_used
                        FROM clientes.users u
                        INNER JOIN clientes.stripe_subscriptions ss ON u.id = ss.user_id
                        INNER JOIN clientes.plans p ON ss.plan_id = p.id
                        INNER JOIN clientes.monthly_usage mu ON u.id = mu.user_id
                        WHERE ss.status IN ('active', 'trialing')
                            AND mu.month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
                            AND p.monthly_queries > 0
                    )
                    SELECT 
                        uu.user_id,
                        uu.username,
                        uu.email,
                        uu.plan_name,
                        uu.queries_used,
                        uu.queries_limit,
                        uu.percentage_used,
                        uu.month_year,
                        CASE 
                            WHEN uu.percentage_used >= 50 
                                AND (uns.notification_50_sent IS NULL OR uns.notification_50_sent = FALSE)
                            THEN TRUE 
                            ELSE FALSE 
                        END as notify_50,
                        CASE 
                            WHEN uu.percentage_used >= 80 
                                AND (uns.notification_80_sent IS NULL OR uns.notification_80_sent = FALSE)
                            THEN TRUE 
                            ELSE FALSE 
                        END as notify_80
                    FROM user_usage uu
                    LEFT JOIN clientes.usage_notifications_sent uns 
                        ON uu.user_id = uns.user_id 
                        AND uu.month_year = uns.month_year
                    WHERE uu.percentage_used >= 50
                        AND (
                            (uu.percentage_used >= 80 AND (uns.notification_80_sent IS NULL OR uns.notification_80_sent = FALSE))
                            OR (uu.percentage_used >= 50 AND uu.percentage_used < 80 AND (uns.notification_50_sent IS NULL OR uns.notification_50_sent = FALSE))
                        )
                    ORDER BY uu.percentage_used DESC
                """)
                
                results = cursor.fetchall()
                cursor.close()
                
                users = []
                for row in results:
                    users.append({
                        'user_id': row[0],
                        'username': row[1],
                        'email': row[2],
                        'plan_name': row[3],
                        'queries_used': row[4],
                        'queries_limit': row[5],
                        'percentage_used': float(row[6]),
                        'month_year': row[7],
                        'notify_50': row[8],
                        'notify_80': row[9]
                    })
                
                return users
                
        except Exception as e:
            logger.error(f"Erro ao buscar usuários para notificação de uso: {e}")
            return []
    
    def _mark_usage_notification_sent(self, user_id: int, month_year: str, notification_type: int) -> bool:
        """Marca notificação de uso como enviada"""
        try:
            with self.db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                if notification_type == 50:
                    cursor.execute("""
                        INSERT INTO clientes.usage_notifications_sent 
                        (user_id, month_year, notification_50_sent, sent_50_at)
                        VALUES (%s, %s, TRUE, CURRENT_TIMESTAMP)
                        ON CONFLICT (user_id, month_year) 
                        DO UPDATE SET 
                            notification_50_sent = TRUE,
                            sent_50_at = CURRENT_TIMESTAMP
                    """, (user_id, month_year))
                elif notification_type == 80:
                    cursor.execute("""
                        INSERT INTO clientes.usage_notifications_sent 
                        (user_id, month_year, notification_80_sent, sent_80_at)
                        VALUES (%s, %s, TRUE, CURRENT_TIMESTAMP)
                        ON CONFLICT (user_id, month_year) 
                        DO UPDATE SET 
                            notification_80_sent = TRUE,
                            sent_80_at = CURRENT_TIMESTAMP
                    """, (user_id, month_year))
                
                cursor.close()
                return True
                
        except Exception as e:
            logger.error(f"Erro ao marcar notificação como enviada: {e}")
            return False
    
    async def run(self):
        """Executa o worker completo"""
        logger.info("=== Iniciando Email Followup Worker ===")
        
        try:
            # Processar follow-ups de assinaturas
            followups_sent = await self.process_subscription_followups()
            
            # Processar notificações de uso
            usage_notifications_sent = await self.process_usage_notifications()
            
            logger.info(f"=== Worker concluído ===")
            logger.info(f"Follow-ups enviados: {followups_sent}")
            logger.info(f"Notificações de uso enviadas: {usage_notifications_sent}")
            
        except Exception as e:
            logger.error(f"Erro ao executar worker: {e}")


async def main():
    """Função principal para executar o worker"""
    worker = EmailFollowupWorker()
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
