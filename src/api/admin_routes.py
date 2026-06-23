"""
Rotas de administração / gestão do SaaS.
Todos os endpoints exigem role 'admin' (get_current_admin_user).
Consultas defensivas: tabela/coluna ausente degrada para zero em vez de quebrar a página.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import secrets
import logging

from src.database.connection import db_manager
from src.api.auth import get_current_admin_user, get_password_hash

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


# ----------------- helpers defensivos -----------------
def _scalar(conn, sql, params=None, default=0):
    try:
        cur = conn.cursor()
        cur.execute(sql, params or ())
        row = cur.fetchone()
        cur.close()
        return row[0] if row and row[0] is not None else default
    except Exception as e:
        logger.warning(f"[admin] query escalar falhou: {e}")
        try:
            conn.rollback()
        except Exception:
            pass
        return default


def _rows(conn, sql, params=None):
    try:
        cur = conn.cursor()
        cur.execute(sql, params or ())
        rows = cur.fetchall()
        cur.close()
        return rows
    except Exception as e:
        logger.warning(f"[admin] query de linhas falhou: {e}")
        try:
            conn.rollback()
        except Exception:
            pass
        return []


# ----------------- VISÃO GERAL -----------------
@router.get("/overview")
async def admin_overview(current_admin: dict = Depends(get_current_admin_user)):
    """KPIs consolidados para o dashboard de gestão."""
    with db_manager.get_connection() as conn:
        # Usuários
        total_users = _scalar(conn, "SELECT COUNT(*) FROM clientes.users")
        active_users = _scalar(conn, "SELECT COUNT(*) FROM clientes.users WHERE is_active = TRUE")
        admins = _scalar(conn, "SELECT COUNT(*) FROM clientes.users WHERE role = 'admin'")
        new_month = _scalar(conn, "SELECT COUNT(*) FROM clientes.users WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)")
        active_30d = _scalar(conn, "SELECT COUNT(*) FROM clientes.users WHERE last_login >= NOW() - INTERVAL '30 days'")

        # Requisições
        requests_today = _scalar(conn, "SELECT COALESCE(SUM(requests),0) FROM clientes.user_usage WHERE date = CURRENT_DATE")
        requests_month = _scalar(conn, "SELECT COALESCE(SUM(queries_used),0) FROM clientes.monthly_usage WHERE month_year = TO_CHAR(CURRENT_DATE,'YYYY-MM')")
        daily = _rows(conn, """
            SELECT date, SUM(requests) AS reqs
            FROM clientes.user_usage
            WHERE date >= CURRENT_DATE - INTERVAL '13 days'
            GROUP BY date ORDER BY date
        """)
        daily_usage = [{"date": d.strftime('%d/%m'), "requests": int(r or 0)} for (d, r) in daily]

        # Assinaturas / planos
        plan_rows = _rows(conn, """
            SELECT p.display_name, COUNT(*)
            FROM clientes.stripe_subscriptions ss
            JOIN clientes.plans p ON p.id = ss.plan_id
            WHERE ss.status IN ('active','trialing') AND ss.current_period_end > NOW()
            GROUP BY p.display_name ORDER BY COUNT(*) DESC
        """)
        plan_distribution = [{"plan": name, "count": int(c)} for (name, c) in plan_rows]
        paid_active = sum(p["count"] for p in plan_distribution)
        free_users = max(0, total_users - paid_active)
        plan_distribution.append({"plan": "Free", "count": free_users})

        mrr = _scalar(conn, """
            SELECT COALESCE(SUM(p.price_brl),0)
            FROM clientes.stripe_subscriptions ss
            JOIN clientes.plans p ON p.id = ss.plan_id
            WHERE ss.status IN ('active','trialing') AND ss.current_period_end > NOW()
        """, default=0)

        # Financeiro
        revenue_month = _scalar(conn, """
            SELECT COALESCE(SUM(amount_paid),0) FROM clientes.stripe_invoices
            WHERE status = 'paid' AND date_trunc('month', COALESCE(paid_at, created_at)) = date_trunc('month', CURRENT_DATE)
        """, default=0)
        revenue_total = _scalar(conn, "SELECT COALESCE(SUM(amount_paid),0) FROM clientes.stripe_invoices WHERE status = 'paid'", default=0)
        batch_revenue_month = _scalar(conn, """
            SELECT COALESCE(SUM(amount_paid),0) FROM clientes.batch_package_purchases
            WHERE status = 'completed' AND date_trunc('month', COALESCE(completed_at, created_at)) = date_trunc('month', CURRENT_DATE)
        """, default=0)

        # Banco CNPJ (estimativas rápidas via reltuples)
        def _est(table):
            return _scalar(conn, "SELECT reltuples::bigint FROM pg_class WHERE relname = %s", (table,))
        db = {
            "empresas": int(_est('empresas') or 0),
            "estabelecimentos": int(_est('estabelecimentos') or 0),
            "socios": int(_est('socios') or 0),
            "size": _scalar(conn, "SELECT pg_size_pretty(pg_database_size(current_database()))", default="N/D"),
            "competencia": _scalar(conn, "SELECT month FROM public.etl_import_state ORDER BY imported_at DESC LIMIT 1", default=None),
        }

    return {
        "users": {
            "total": int(total_users), "active": int(active_users), "admins": int(admins),
            "new_this_month": int(new_month), "active_30d": int(active_30d), "free": int(free_users),
        },
        "usage": {
            "requests_today": int(requests_today),
            "requests_this_month": int(requests_month),
            "daily": daily_usage,
        },
        "subscriptions": {
            "paid_active": int(paid_active),
            "distribution": plan_distribution,
            "mrr": float(mrr),
        },
        "finance": {
            "revenue_this_month": float(revenue_month) + float(batch_revenue_month),
            "revenue_total": float(revenue_total),
        },
        "database": db,
    }


# ----------------- USUÁRIOS -----------------
@router.get("/users")
async def admin_list_users(
    current_admin: dict = Depends(get_current_admin_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    where = ["1=1"]
    params = []
    if search:
        where.append("(u.username ILIKE %s OR u.email ILIKE %s)")
        params.extend([f"%{search}%", f"%{search}%"])
    if role in ("user", "admin"):
        where.append("u.role = %s")
        params.append(role)
    if is_active is not None:
        where.append("u.is_active = %s")
        params.append(is_active)
    where_sql = " AND ".join(where)

    with db_manager.get_connection() as conn:
        total = _scalar(conn, f"SELECT COUNT(*) FROM clientes.users u WHERE {where_sql}", params)
        offset = (page - 1) * per_page
        rows = _rows(conn, f"""
            SELECT u.id, u.username, u.email, u.role, u.is_active, u.created_at, u.last_login,
                   COALESCE(p.display_name, 'Free') AS plan,
                   COALESCE(p.monthly_queries, 200) AS monthly_limit,
                   COALESCE(mu.queries_used, 0) AS queries_used
            FROM clientes.users u
            LEFT JOIN clientes.stripe_subscriptions ss
                ON ss.user_id = u.id AND ss.status IN ('active','trialing') AND ss.current_period_end > NOW()
            LEFT JOIN clientes.plans p ON p.id = ss.plan_id
            LEFT JOIN clientes.monthly_usage mu
                ON mu.user_id = u.id AND mu.month_year = TO_CHAR(CURRENT_DATE,'YYYY-MM')
            WHERE {where_sql}
            ORDER BY u.created_at DESC
            LIMIT %s OFFSET %s
        """, params + [per_page, offset])

    users = [{
        "id": r[0], "username": r[1], "email": r[2], "role": r[3], "is_active": r[4],
        "created_at": r[5].isoformat() if r[5] else None,
        "last_login": r[6].isoformat() if r[6] else None,
        "plan": r[7], "monthly_limit": int(r[8]), "queries_used": int(r[9]),
    } for r in rows]

    return {"users": users, "total": int(total), "page": page, "per_page": per_page,
            "total_pages": (int(total) + per_page - 1) // per_page}


@router.get("/users/{user_id}")
async def admin_user_detail(user_id: int, current_admin: dict = Depends(get_current_admin_user)):
    with db_manager.get_connection() as conn:
        rows = _rows(conn, """
            SELECT id, username, email, phone, cpf, role, is_active, created_at, last_login
            FROM clientes.users WHERE id = %s
        """, (user_id,))
        if not rows:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        r = rows[0]
        user = {
            "id": r[0], "username": r[1], "email": r[2], "phone": r[3], "cpf": r[4],
            "role": r[5], "is_active": r[6],
            "created_at": r[7].isoformat() if r[7] else None,
            "last_login": r[8].isoformat() if r[8] else None,
        }
        sub = _rows(conn, """
            SELECT p.display_name, p.monthly_queries, ss.status, ss.current_period_end, ss.cancel_at_period_end
            FROM clientes.stripe_subscriptions ss JOIN clientes.plans p ON p.id = ss.plan_id
            WHERE ss.user_id = %s ORDER BY ss.created_at DESC LIMIT 1
        """, (user_id,))
        user["subscription"] = ({
            "plan": sub[0][0], "monthly_queries": int(sub[0][1]), "status": sub[0][2],
            "current_period_end": sub[0][3].isoformat() if sub[0][3] else None,
            "cancel_at_period_end": sub[0][4],
        } if sub else {"plan": "Free", "monthly_queries": 200, "status": "free"})
        user["queries_used"] = int(_scalar(conn, """
            SELECT queries_used FROM clientes.monthly_usage
            WHERE user_id = %s AND month_year = TO_CHAR(CURRENT_DATE,'YYYY-MM')
        """, (user_id,)))
        user["api_keys"] = int(_scalar(conn, "SELECT COUNT(*) FROM clientes.api_keys WHERE user_id = %s AND is_active = TRUE", (user_id,)))
        user["batch_credits"] = int(_scalar(conn, "SELECT COALESCE(available_credits,0) FROM clientes.batch_query_credits WHERE user_id = %s", (user_id,)))
        inv = _rows(conn, """
            SELECT amount_paid, status, COALESCE(paid_at, created_at)
            FROM clientes.stripe_invoices WHERE user_id = %s ORDER BY created_at DESC LIMIT 10
        """, (user_id,))
        user["invoices"] = [{"amount": float(i[0] or 0), "status": i[1],
                             "date": i[2].isoformat() if i[2] else None} for i in inv]
    return user


class UserPatch(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None


@router.patch("/users/{user_id}")
async def admin_patch_user(user_id: int, data: UserPatch, current_admin: dict = Depends(get_current_admin_user)):
    if data.role is not None and data.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role inválida")
    if user_id == current_admin.get('id') and (data.role == 'user' or data.is_active is False):
        raise HTTPException(status_code=400, detail="Você não pode rebaixar ou desativar a própria conta")

    sets, params = [], []
    if data.role is not None:
        sets.append("role = %s"); params.append(data.role)
    if data.is_active is not None:
        sets.append("is_active = %s"); params.append(data.is_active)
    if not sets:
        raise HTTPException(status_code=400, detail="Nada para atualizar")
    params.append(user_id)

    try:
        with db_manager.get_connection() as conn:
            cur = conn.cursor()
            cur.execute(f"UPDATE clientes.users SET {', '.join(sets)} WHERE id = %s", params)
            cur.close()
    except Exception as e:
        logger.error(f"[admin] erro ao atualizar usuário {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro ao atualizar usuário")
    return {"message": "Usuário atualizado"}


@router.post("/users/{user_id}/reset-password")
async def admin_reset_user_password(user_id: int, current_admin: dict = Depends(get_current_admin_user)):
    """Gera uma senha temporária para o usuário e a retorna UMA vez ao admin."""
    temp = secrets.token_urlsafe(9)
    ok = await db_manager.update_user_password(user_id, get_password_hash(temp))
    if not ok:
        raise HTTPException(status_code=500, detail="Erro ao redefinir a senha")
    return {"message": "Senha redefinida", "temporary_password": temp}


# ----------------- FINANCEIRO -----------------
@router.get("/finance")
async def admin_finance(current_admin: dict = Depends(get_current_admin_user)):
    with db_manager.get_connection() as conn:
        series = _rows(conn, """
            SELECT to_char(date_trunc('month', COALESCE(paid_at, created_at)), 'YYYY-MM') AS m,
                   COALESCE(SUM(amount_paid),0)
            FROM clientes.stripe_invoices
            WHERE status = 'paid' AND COALESCE(paid_at, created_at) >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
            GROUP BY 1 ORDER BY 1
        """)
        revenue_series = [{"month": m, "revenue": float(v or 0)} for (m, v) in series]

        tx = _rows(conn, """
            SELECT si.created_at, u.username, 'Assinatura' AS tipo, si.amount_paid, si.status
            FROM clientes.stripe_invoices si LEFT JOIN clientes.users u ON u.id = si.user_id
            ORDER BY si.created_at DESC LIMIT 25
        """)
        transactions = [{
            "date": t[0].isoformat() if t[0] else None, "user": t[1] or '—',
            "type": t[2], "amount": float(t[3] or 0), "status": t[4],
        } for t in tx]

        total_paid = _scalar(conn, "SELECT COALESCE(SUM(amount_paid),0) FROM clientes.stripe_invoices WHERE status='paid'", default=0)
        open_invoices = _scalar(conn, "SELECT COUNT(*) FROM clientes.stripe_invoices WHERE status IN ('open','draft')")
        paid_count = _scalar(conn, "SELECT COUNT(*) FROM clientes.stripe_invoices WHERE status='paid'")
        avg_ticket = (float(total_paid) / paid_count) if paid_count else 0.0

    return {
        "revenue_series": revenue_series,
        "transactions": transactions,
        "totals": {"revenue_total": float(total_paid), "avg_ticket": round(avg_ticket, 2),
                   "open_invoices": int(open_invoices), "paid_count": int(paid_count)},
    }


# ----------------- BANCO / SAÚDE -----------------
@router.get("/db-health")
async def admin_db_health(current_admin: dict = Depends(get_current_admin_user)):
    with db_manager.get_connection() as conn:
        size = _scalar(conn, "SELECT pg_size_pretty(pg_database_size(current_database()))", default="N/D")
        active_conn = _scalar(conn, "SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database()")
        max_conn = _scalar(conn, "SELECT setting::int FROM pg_settings WHERE name = 'max_connections'", default=0)
        tables = _rows(conn, """
            SELECT relname, reltuples::bigint, pg_size_pretty(pg_total_relation_size(c.oid))
            FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relkind = 'r'
              AND relname IN ('empresas','estabelecimentos','socios','simples_nacional')
            ORDER BY reltuples DESC
        """)
        table_stats = [{"table": t[0], "rows": int(t[1] or 0), "size": t[2]} for t in tables]
        competencia = _scalar(conn, "SELECT month FROM public.etl_import_state ORDER BY imported_at DESC LIMIT 1", default=None)
    return {
        "size": size, "active_connections": int(active_conn), "max_connections": int(max_conn),
        "tables": table_stats, "competencia": competencia,
        "status": "operacional" if active_conn else "indisponível",
    }


# ----------------- ETL / ATUALIZAÇÕES -----------------
@router.get("/etl")
async def admin_etl_status(current_admin: dict = Depends(get_current_admin_user)):
    """Status do ETL/atualização. Defensivo: tabelas de controle podem não existir ainda."""
    with db_manager.get_connection() as conn:
        has_state = _scalar(conn, "SELECT to_regclass('public.etl_import_state')", default=None)
        competencia = None
        last_import = None
        if has_state:
            row = _rows(conn, "SELECT month, imported_at FROM public.etl_import_state ORDER BY imported_at DESC LIMIT 1")
            if row:
                competencia = row[0][0]
                last_import = row[0][1].isoformat() if row[0][1] else None

        history = []
        has_runs = _scalar(conn, "SELECT to_regclass('public.execution_runs')", default=None)
        if has_runs:
            hrows = _rows(conn, """
                SELECT started_at, finished_at, status
                FROM public.execution_runs ORDER BY started_at DESC LIMIT 10
            """)
            history = [{
                "started_at": h[0].isoformat() if h[0] else None,
                "finished_at": h[1].isoformat() if h[1] else None,
                "status": h[2],
            } for h in hrows]

    return {
        "competencia": competencia,
        "last_import": last_import,
        "cron_configured": bool(has_state),
        "history": history,
    }
