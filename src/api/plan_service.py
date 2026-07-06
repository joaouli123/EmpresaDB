"""
PlanService — fonte ÚNICA de verdade para limites e recursos de cada plano.

Tudo que um plano pode ou não fazer vive na tabela clientes.plans (editável
pelo admin em /admin/plans). Nada de limites hardcoded espalhados pelo código.

Cache em memória por processo com TTL curto: alteração no admin propaga em
até PLAN_CACHE_TTL segundos para todos os workers, sem custo por request.
"""
import time
import logging
from threading import Lock

logger = logging.getLogger(__name__)

PLAN_CACHE_TTL = 60  # segundos

# Defaults usados se uma coluna vier NULL (plano criado antes da migration)
DEFAULTS = {
    "monthly_queries": 200,
    "rate_per_hour": 600,
    "burst_per_min": 10,
    "max_page_size": 100,
    "can_search": True,
    "can_socios": True,
    "can_batch": True,
    "can_export": True,
}

_COLUMNS = (
    "id, name, display_name, monthly_queries, price_brl, features, is_active, "
    "rate_per_hour, burst_per_min, max_page_size, "
    "can_search, can_socios, can_batch, can_export, is_public, description"
)


def _row_to_plan(row) -> dict:
    plan = {
        "id": row[0],
        "name": row[1],
        "display_name": row[2],
        "monthly_queries": row[3] if row[3] is not None else DEFAULTS["monthly_queries"],
        "price_brl": float(row[4]) if row[4] is not None else 0.0,
        "features": row[5] or [],
        "is_active": bool(row[6]),
        "rate_per_hour": row[7] if row[7] is not None else DEFAULTS["rate_per_hour"],
        "burst_per_min": row[8] if row[8] is not None else DEFAULTS["burst_per_min"],
        "max_page_size": row[9] if row[9] is not None else DEFAULTS["max_page_size"],
        "can_search": DEFAULTS["can_search"] if row[10] is None else bool(row[10]),
        "can_socios": DEFAULTS["can_socios"] if row[11] is None else bool(row[11]),
        "can_batch": DEFAULTS["can_batch"] if row[12] is None else bool(row[12]),
        "can_export": DEFAULTS["can_export"] if row[13] is None else bool(row[13]),
        "is_public": True if row[14] is None else bool(row[14]),
        "description": row[15] or "",
    }
    return plan


class PlanService:
    def __init__(self):
        self._plans: dict[str, dict] = {}
        self._loaded_at: float = 0.0
        self._lock = Lock()

    def _load(self):
        from src.database.connection import db_manager
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"SELECT {_COLUMNS} FROM clientes.plans")
            rows = cursor.fetchall()
            cursor.close()
        plans = {}
        for row in rows:
            p = _row_to_plan(row)
            plans[p["name"].lower()] = p
        self._plans = plans
        self._loaded_at = time.time()
        logger.debug("PlanService: %d planos carregados", len(plans))

    def _ensure_fresh(self):
        if time.time() - self._loaded_at > PLAN_CACHE_TTL or not self._plans:
            with self._lock:
                if time.time() - self._loaded_at > PLAN_CACHE_TTL or not self._plans:
                    try:
                        self._load()
                    except Exception as e:
                        # Mantém o cache antigo se o banco falhar momentaneamente
                        logger.error("PlanService: falha ao recarregar planos: %s", e)
                        if not self._plans:
                            raise

    def invalidate(self):
        """Chamar após o admin editar um plano — força reload no próximo acesso."""
        self._loaded_at = 0.0

    def get(self, plan_name: str) -> dict:
        """Config completa de um plano pelo nome (case-insensitive). Fallback: free."""
        self._ensure_fresh()
        key = (plan_name or "free").lower()
        plan = self._plans.get(key)
        if plan is None:
            plan = self._plans.get("free")
        if plan is None:
            # Banco sem plano free (não deveria acontecer): defaults seguros
            plan = {"name": "free", "display_name": "Free", "price_brl": 0.0,
                    "features": [], "is_active": True, "is_public": True,
                    "description": "", "id": None, **DEFAULTS}
        return plan

    def all_plans(self) -> list[dict]:
        self._ensure_fresh()
        return sorted(self._plans.values(), key=lambda p: (p["price_brl"], p["monthly_queries"]))


plan_service = PlanService()


def require_feature(user: dict, feature: str, feature_label: str):
    """
    Gate de recurso por plano. Admin sempre passa.
    Levanta 403 com mensagem de upgrade se o plano do usuário não inclui o recurso.
    """
    from fastapi import HTTPException
    if user.get("role") == "admin":
        return
    plan = plan_service.get(user.get("plan", "free"))
    if not plan.get(feature, True):
        raise HTTPException(
            status_code=403,
            detail={
                "error": "feature_not_in_plan",
                "message": f"O recurso '{feature_label}' não está incluído no plano "
                           f"{plan['display_name']}. Faça upgrade para desbloquear.",
                "current_plan": plan["name"],
                "action_url": "/home#pricing",
            },
        )
