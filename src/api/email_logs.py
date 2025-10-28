from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime
from src.database.connection import db_manager
from src.api.auth import get_current_admin_user
from psycopg2 import extras
import logging
import math

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin - Email Logs"])

@router.get("/email-logs")
async def get_email_logs(
    current_admin: dict = Depends(get_current_admin_user),
    page: int = Query(1, ge=1, description="Página atual"),
    per_page: Optional[int] = Query(None, ge=1, le=100, description="Registros por página"),
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Registros por página (alternativa)"),
    email_type: Optional[str] = Query(None, description="Tipo de email (account_created, activation, etc)"),
    status: Optional[str] = Query(None, description="Status do email (sent, failed, bounced)"),
    user_id: Optional[int] = Query(None, description="ID do usuário"),
    username: Optional[str] = Query(None, description="Username do usuário (busca parcial)"),
    date_from: Optional[str] = Query(None, description="Data inicial (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Data final (YYYY-MM-DD)")
):
    """
    Busca todos os logs de email com paginação e filtros (apenas admins).
    
    Retorna logs de emails enviados pelo sistema com informações do usuário.
    """
    try:
        actual_per_page = per_page if per_page is not None else (page_size if page_size is not None else 50)
        offset = (page - 1) * actual_per_page
        
        # Construir query com filtros dinâmicos
        where_conditions = []
        params = []
        param_count = 1
        
        if email_type:
            where_conditions.append(f"el.email_type = %s")
            params.append(email_type)
            param_count += 1
        
        if status:
            where_conditions.append(f"el.status = %s")
            params.append(status)
            param_count += 1
        
        if user_id:
            where_conditions.append(f"el.user_id = %s")
            params.append(user_id)
            param_count += 1
        
        if username:
            where_conditions.append(f"u.username ILIKE %s")
            params.append(f"%{username}%")
            param_count += 1
        
        if date_from:
            where_conditions.append(f"el.sent_at >= %s::timestamp")
            params.append(date_from)
            param_count += 1
        
        if date_to:
            where_conditions.append(f"el.sent_at <= %s::timestamp")
            params.append(date_to)
            param_count += 1
        
        where_clause = " AND " + " AND ".join(where_conditions) if where_conditions else ""
        
        # Query para contar total de registros
        count_query = f"""
            SELECT COUNT(*) as total
            FROM clientes.email_logs el
            INNER JOIN clientes.users u ON el.user_id = u.id
            WHERE 1=1 {where_clause}
        """
        
        # Query para buscar dados com join de usuário
        data_query = f"""
            SELECT 
                el.id,
                el.user_id,
                u.username,
                u.email as user_email,
                el.email_type,
                el.recipient_email,
                el.subject,
                el.sent_at,
                el.status,
                el.error_message,
                el.metadata
            FROM clientes.email_logs el
            INNER JOIN clientes.users u ON el.user_id = u.id
            WHERE 1=1 {where_clause}
            ORDER BY el.sent_at DESC
            LIMIT %s OFFSET %s
        """
        
        params_with_pagination = params + [actual_per_page, offset]
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=extras.RealDictCursor)
            
            # Contar total
            cursor.execute(count_query, params)
            total_result = cursor.fetchone()
            total = total_result['total'] if total_result else 0
            
            # Buscar dados
            cursor.execute(data_query, params_with_pagination)
            logs = cursor.fetchall()
            cursor.close()
            
            # Formatar datas para ISO
            items = []
            for log in logs:
                log_dict = dict(log)
                if log_dict.get('sent_at'):
                    log_dict['sent_at'] = log_dict['sent_at'].isoformat()
                items.append(log_dict)
            
            # Calcular total de páginas
            total_pages = math.ceil(total / actual_per_page) if total > 0 else 0
            
            return {
                "items": items,
                "total": total,
                "page": page,
                "per_page": actual_per_page,
                "total_pages": total_pages
            }
    
    except Exception as e:
        logger.error(f"Erro ao buscar email logs: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar logs de email: {str(e)}")


@router.get("/followup-tracking")
async def get_followup_tracking(
    current_admin: dict = Depends(get_current_admin_user),
    page: int = Query(1, ge=1, description="Página atual"),
    per_page: Optional[int] = Query(None, ge=1, le=100, description="Registros por página"),
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Registros por página (alternativa)"),
    user_id: Optional[int] = Query(None, description="ID do usuário"),
    username: Optional[str] = Query(None, description="Username do usuário (busca parcial)"),
    status: Optional[str] = Query(None, description="Status do follow-up (pending, sent, completed, abandoned)"),
    date_from: Optional[str] = Query(None, description="Data inicial (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Data final (YYYY-MM-DD)")
):
    """
    Busca tracking de follow-ups de assinaturas com paginação e filtros (apenas admins).
    
    Retorna informações sobre tentativas de follow-up para assinaturas vencidas.
    """
    try:
        actual_per_page = per_page if per_page is not None else (page_size if page_size is not None else 50)
        offset = (page - 1) * actual_per_page
        
        # Construir query com filtros dinâmicos
        where_conditions = []
        params = []
        param_count = 1
        
        if user_id:
            where_conditions.append(f"ft.user_id = %s")
            params.append(user_id)
            param_count += 1
        
        if username:
            where_conditions.append(f"u.username ILIKE %s")
            params.append(f"%{username}%")
            param_count += 1
        
        if status:
            where_conditions.append(f"ft.status = %s")
            params.append(status)
            param_count += 1
        
        if date_from:
            where_conditions.append(f"ft.last_attempt_at >= %s::timestamp")
            params.append(date_from)
            param_count += 1
        
        if date_to:
            where_conditions.append(f"ft.last_attempt_at <= %s::timestamp")
            params.append(date_to)
            param_count += 1
        
        where_clause = " AND " + " AND ".join(where_conditions) if where_conditions else ""
        
        # Query para contar total de registros
        count_query = f"""
            SELECT COUNT(*) as total
            FROM clientes.subscription_followup_tracking ft
            INNER JOIN clientes.users u ON ft.user_id = u.id
            WHERE 1=1 {where_clause}
        """
        
        # Query para buscar dados com join de usuário
        data_query = f"""
            SELECT 
                ft.id,
                ft.user_id,
                u.username,
                u.email as user_email,
                ft.subscription_id,
                ft.attempt_number,
                ft.last_attempt_at,
                ft.next_attempt_at,
                ft.status,
                ft.total_attempts,
                ft.created_at,
                ft.updated_at
            FROM clientes.subscription_followup_tracking ft
            INNER JOIN clientes.users u ON ft.user_id = u.id
            WHERE 1=1 {where_clause}
            ORDER BY ft.last_attempt_at DESC
            LIMIT %s OFFSET %s
        """
        
        params_with_pagination = params + [actual_per_page, offset]
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=extras.RealDictCursor)
            
            # Contar total
            cursor.execute(count_query, params)
            total_result = cursor.fetchone()
            total = total_result['total'] if total_result else 0
            
            # Buscar dados
            cursor.execute(data_query, params_with_pagination)
            tracking = cursor.fetchall()
            cursor.close()
            
            # Formatar datas para ISO
            items = []
            for track in tracking:
                track_dict = dict(track)
                if track_dict.get('last_attempt_at'):
                    track_dict['last_attempt_at'] = track_dict['last_attempt_at'].isoformat()
                if track_dict.get('next_attempt_at'):
                    track_dict['next_attempt_at'] = track_dict['next_attempt_at'].isoformat()
                if track_dict.get('created_at'):
                    track_dict['created_at'] = track_dict['created_at'].isoformat()
                if track_dict.get('updated_at'):
                    track_dict['updated_at'] = track_dict['updated_at'].isoformat()
                items.append(track_dict)
            
            # Calcular total de páginas
            total_pages = math.ceil(total / actual_per_page) if total > 0 else 0
            
            return {
                "items": items,
                "total": total,
                "page": page,
                "per_page": actual_per_page,
                "total_pages": total_pages
            }
    
    except Exception as e:
        logger.error(f"Erro ao buscar followup tracking: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar tracking de follow-ups: {str(e)}")


@router.get("/usage-notifications")
async def get_usage_notifications(
    current_admin: dict = Depends(get_current_admin_user),
    page: int = Query(1, ge=1, description="Página atual"),
    per_page: Optional[int] = Query(None, ge=1, le=100, description="Registros por página"),
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Registros por página (alternativa)"),
    user_id: Optional[int] = Query(None, description="ID do usuário"),
    username: Optional[str] = Query(None, description="Username do usuário (busca parcial)"),
    month_year: Optional[str] = Query(None, description="Mês/Ano (YYYY-MM)")
):
    """
    Busca notificações de uso enviadas com paginação e filtros (apenas admins).
    
    Retorna informações sobre notificações de uso (50% e 80%) enviadas aos usuários.
    """
    try:
        actual_per_page = per_page if per_page is not None else (page_size if page_size is not None else 50)
        offset = (page - 1) * actual_per_page
        
        # Construir query com filtros dinâmicos
        where_conditions = []
        params = []
        param_count = 1
        
        if user_id:
            where_conditions.append(f"un.user_id = %s")
            params.append(user_id)
            param_count += 1
        
        if username:
            where_conditions.append(f"u.username ILIKE %s")
            params.append(f"%{username}%")
            param_count += 1
        
        if month_year:
            where_conditions.append(f"un.month_year = %s")
            params.append(month_year)
            param_count += 1
        
        where_clause = " AND " + " AND ".join(where_conditions) if where_conditions else ""
        
        # Query para contar total de registros
        count_query = f"""
            SELECT COUNT(*) as total
            FROM clientes.usage_notifications_sent un
            INNER JOIN clientes.users u ON un.user_id = u.id
            WHERE 1=1 {where_clause}
        """
        
        # Query para buscar dados com join de usuário
        data_query = f"""
            SELECT 
                un.id,
                un.user_id,
                u.username,
                u.email as user_email,
                un.month_year,
                un.notification_50_sent,
                un.notification_80_sent,
                un.sent_50_at,
                un.sent_80_at,
                un.created_at,
                un.updated_at
            FROM clientes.usage_notifications_sent un
            INNER JOIN clientes.users u ON un.user_id = u.id
            WHERE 1=1 {where_clause}
            ORDER BY un.created_at DESC
            LIMIT %s OFFSET %s
        """
        
        params_with_pagination = params + [actual_per_page, offset]
        
        with db_manager.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=extras.RealDictCursor)
            
            # Contar total
            cursor.execute(count_query, params)
            total_result = cursor.fetchone()
            total = total_result['total'] if total_result else 0
            
            # Buscar dados
            cursor.execute(data_query, params_with_pagination)
            notifications = cursor.fetchall()
            cursor.close()
            
            # Formatar datas para ISO
            items = []
            for notif in notifications:
                notif_dict = dict(notif)
                if notif_dict.get('sent_50_at'):
                    notif_dict['sent_50_at'] = notif_dict['sent_50_at'].isoformat()
                if notif_dict.get('sent_80_at'):
                    notif_dict['sent_80_at'] = notif_dict['sent_80_at'].isoformat()
                if notif_dict.get('created_at'):
                    notif_dict['created_at'] = notif_dict['created_at'].isoformat()
                if notif_dict.get('updated_at'):
                    notif_dict['updated_at'] = notif_dict['updated_at'].isoformat()
                items.append(notif_dict)
            
            # Calcular total de páginas
            total_pages = math.ceil(total / actual_per_page) if total > 0 else 0
            
            return {
                "items": items,
                "total": total,
                "page": page,
                "per_page": actual_per_page,
                "total_pages": total_pages
            }
    
    except Exception as e:
        logger.error(f"Erro ao buscar usage notifications: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar notificações de uso: {str(e)}")
