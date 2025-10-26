
"""
Rate Limiting Escalonado para proteger endpoints contra abuso
Suporta alto volume de requisições simultâneas
"""
from fastapi import HTTPException, Request
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio
import logging

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
    
    async def check_rate_limit(self, user_id: int, user_plan: str = 'free', max_requests: int = None, window_seconds: int = None):
        """
        Verifica se usuário excedeu limite de requisições
        Suporta limites por plano e limites customizados
        
        Args:
            user_id: ID do usuário
            user_plan: Plano do usuário (free, start, growth, pro, enterprise, admin)
            max_requests: Limite customizado (sobrescreve plano)
            window_seconds: Janela de tempo customizada (sobrescreve plano)
        """
        now = datetime.now()
        
        # Usar limites do plano ou customizados
        if max_requests is None or window_seconds is None:
            plan_limits = self.RATE_LIMITS.get(user_plan, self.RATE_LIMITS['free'])
            max_requests = max_requests or plan_limits['requests']
            window_seconds = window_seconds or plan_limits['window']
        
        window_start = now - timedelta(seconds=window_seconds)
        
        # Limpar requisições antigas
        self.requests[user_id] = [
            (ts, count) for ts, count in self.requests[user_id]
            if ts > window_start
        ]
        
        # Contar requisições na janela
        total = sum(count for _, count in self.requests[user_id])
        
        # ⚡ VERIFICAÇÃO DE BURST (último minuto)
        burst_window = now - timedelta(seconds=60)
        burst_requests = sum(
            count for ts, count in self.requests[user_id]
            if ts > burst_window
        )
        
        burst_limit = self.BURST_LIMITS.get(user_plan, 30)
        
        if burst_requests >= burst_limit:
            logger.warning(f"🔥 BURST limit exceeded - User {user_id} ({user_plan}): {burst_requests}/{burst_limit} req/min")
            raise HTTPException(
                status_code=429,
                detail=f"Limite de burst excedido: {burst_limit} requisições por minuto. Aguarde alguns segundos."
            )
        
        if total >= max_requests:
            logger.warning(f"⚠️ Rate limit exceeded - User {user_id} ({user_plan}): {total}/{max_requests} req/{window_seconds}s")
            raise HTTPException(
                status_code=429,
                detail=f"Limite de {max_requests} requisições por {window_seconds//3600}h excedido. Considere fazer upgrade do plano."
            )
        
        # Adicionar requisição atual
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
