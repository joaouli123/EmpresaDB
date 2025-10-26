
"""
Rate Limiting para proteger endpoints contra abuso
"""
from fastapi import HTTPException, Request
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio

class RateLimiter:
    def __init__(self):
        # {user_id: [(timestamp, count)]}
        self.requests = defaultdict(list)
        self.cleanup_task = None
    
    async def check_rate_limit(self, user_id: int, max_requests: int = 100, window_seconds: int = 60):
        """
        Verifica se usuário excedeu limite de requisições
        """
        now = datetime.now()
        window_start = now - timedelta(seconds=window_seconds)
        
        # Limpar requisições antigas
        self.requests[user_id] = [
            (ts, count) for ts, count in self.requests[user_id]
            if ts > window_start
        ]
        
        # Contar requisições na janela
        total = sum(count for _, count in self.requests[user_id])
        
        if total >= max_requests:
            raise HTTPException(
                status_code=429,
                detail=f"Limite de {max_requests} requisições por {window_seconds}s excedido. Tente novamente mais tarde."
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

rate_limiter = RateLimiter()
