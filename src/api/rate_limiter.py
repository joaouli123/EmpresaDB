
"""
Rate Limiting Escalonado para proteger endpoints contra abuso
Suporta alto volume de requisições simultâneas
"""
from fastapi import HTTPException, Request
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio
import logging
from src.api.cache_redis import cache as shared_cache

logger = logging.getLogger(__name__)

class RateLimiter:
    # 🎯 LIMITES POR PLANO DE ASSINATURA
    RATE_LIMITS = {
        'free': {'requests': 600, 'window': 3600},      # 600 req/hora (10 req/min)
        'start': {'requests': 3600, 'window': 3600},    # 3.600 req/hora (60 req/min)
        'growth': {'requests': 18000, 'window': 3600},  # 18.000 req/hora (300 req/min)
        'pro': {'requests': 60000, 'window': 3600},     # 60.000 req/hora (1000 req/min)
        'enterprise': {'requests': 100000, 'window': 3600}, # 100.000 req/hora (customizado)
        'admin': {'requests': 200000, 'window': 3600}   # 200.000 req/hora (admin)
    }
    
    # 🔥 LIMITES DE BURST (requisições em rajada - 1 minuto)
    BURST_LIMITS = {
        'free': 10,           # Máx 10 req/min
        'start': 60,          # Máx 60 req/min
        'growth': 300,        # Máx 300 req/min
        'pro': 1000,          # Máx 1.000 req/min
        'enterprise': 5000,   # Máx 5.000 req/min (customizado)
        'admin': 10000        # Máx 10.000 req/min
    }
    
    def __init__(self):
        # {user_id: [(timestamp, count)]}
        self.requests = defaultdict(list)
        self.cleanup_task = None
    
    async def check_rate_limit(self, user_id: int, user_plan: str = 'free', user_role: str = 'user', max_requests: int | None = None, window_seconds: int | None = None):
        """
        Verifica se usuário excedeu limite de requisições
        Suporta limites por plano e limites customizados
        
        Args:
            user_id: ID do usuário
            user_plan: Plano do usuário (free, start, growth, pro, enterprise, admin)
            user_role: Role do usuário (user, admin) - admin tem acesso ilimitado
            max_requests: Limite customizado (sobrescreve plano)
            window_seconds: Janela de tempo customizada (sobrescreve plano)
        """
        # Resolve limites por plano (admin = teto alto, NÃO mais ilimitado)
        plan_key = 'admin' if user_role == 'admin' else user_plan
        if max_requests is None or window_seconds is None:
            plan_limits = self.RATE_LIMITS.get(plan_key, self.RATE_LIMITS['free'])
            max_requests = max_requests or plan_limits['requests']
            window_seconds = window_seconds or plan_limits['window']
        burst_limit = self.BURST_LIMITS.get(plan_key, 30)

        # Caminho preferencial: Redis (contadores atômicos, GLOBAIS entre workers)
        hourly = shared_cache.incr_rate(f"rl:h:{user_id}:{window_seconds}", window_seconds)
        burst = shared_cache.incr_rate(f"rl:b:{user_id}", 60)

        if hourly == -1 or burst == -1:
            # Redis indisponível -> fallback em memória do processo
            return self._check_rate_limit_memory(user_id, max_requests, window_seconds, burst_limit)

        if burst > burst_limit:
            logger.warning(f"🔥 BURST limit - User {user_id} ({plan_key}): {burst}/{burst_limit} req/min")
            raise HTTPException(
                status_code=429,
                detail=f"Limite de burst excedido: {burst_limit} requisições por minuto. Aguarde alguns segundos."
            )
        if hourly > max_requests:
            logger.warning(f"⚠️ Rate limit - User {user_id} ({plan_key}): {hourly}/{max_requests} req/{window_seconds}s")
            raise HTTPException(
                status_code=429,
                detail=f"Limite de {max_requests} requisições por {window_seconds//3600}h excedido. Considere fazer upgrade do plano."
            )

    def _check_rate_limit_memory(self, user_id: int, max_requests: int, window_seconds: int, burst_limit: int):
        """Fallback em memória (válido apenas dentro de um worker; usado se o Redis cair)."""
        now = datetime.now()
        window_start = now - timedelta(seconds=window_seconds)
        self.requests[user_id] = [
            (ts, count) for ts, count in self.requests[user_id] if ts > window_start
        ]
        total = sum(count for _, count in self.requests[user_id])
        burst_window = now - timedelta(seconds=60)
        burst_requests = sum(
            count for ts, count in self.requests[user_id] if ts > burst_window
        )
        if burst_requests >= burst_limit:
            raise HTTPException(
                status_code=429,
                detail=f"Limite de burst excedido: {burst_limit} requisições por minuto. Aguarde alguns segundos."
            )
        if total >= max_requests:
            raise HTTPException(
                status_code=429,
                detail=f"Limite de {max_requests} requisições por {window_seconds//3600}h excedido. Considere fazer upgrade do plano."
            )
        self.requests[user_id].append((now, 1))
    
    async def cleanup_old_entries(self):
        """Limpa entradas antigas periodicamente"""
        while True:
            await asyncio.sleep(300)  # 5 minutos
            now = datetime.now()
            cutoff = now - timedelta(minutes=10)
            
            for user_id in list(self.requests.keys()):
                self.requests[user_id] = [
                    (ts, count) for ts, count in self.requests[user_id]
                    if ts > cutoff
                ]
                if not self.requests[user_id]:
                    del self.requests[user_id]
    
    def get_rate_limit_status(self, user_id: int, user_plan: str = 'free') -> dict:
        """
        Retorna status atual de rate limit do usuário
        """
        now = datetime.now()
        plan_limits = self.RATE_LIMITS.get(user_plan, self.RATE_LIMITS['free'])
        
        # Requisições na última hora
        window_start = now - timedelta(seconds=plan_limits['window'])
        hourly_requests = sum(
            count for ts, count in self.requests[user_id]
            if ts > window_start
        )
        
        # Requisições no último minuto (burst)
        burst_window = now - timedelta(seconds=60)
        burst_requests = sum(
            count for ts, count in self.requests[user_id]
            if ts > burst_window
        )
        
        return {
            'plan': user_plan,
            'hourly_limit': plan_limits['requests'],
            'hourly_used': hourly_requests,
            'hourly_remaining': max(0, plan_limits['requests'] - hourly_requests),
            'burst_limit': self.BURST_LIMITS.get(user_plan, 30),
            'burst_used': burst_requests,
            'burst_remaining': max(0, self.BURST_LIMITS.get(user_plan, 30) - burst_requests),
            'reset_in_seconds': 3600 - (now.timestamp() % 3600)
        }

rate_limiter = RateLimiter()
