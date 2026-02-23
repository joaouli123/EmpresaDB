"""
Sistema de Cache Redis Otimizado
Para uso em produção com alta performance
"""

import redis
import json
import logging
import hashlib
from typing import Any, Optional
from datetime import timedelta
from functools import wraps
import pickle
import zlib

logger = logging.getLogger(__name__)

class RedisCache:
    """
    Cache Redis com compressão e serialização otimizada
    """
    
    def __init__(self, host='localhost', port=6379, db=0, password=None):
        """
        Inicializa conexão com Redis
        
        Para VPS, instale Redis:
        sudo apt update
        sudo apt install redis-server
        sudo systemctl enable redis-server
        sudo systemctl start redis-server
        """
        try:
            self.redis_client = redis.Redis(
                host=host,
                port=port,
                db=db,
                password=password,
                decode_responses=False,  # Para usar bytes (compressão)
                socket_keepalive=True,
                socket_connect_timeout=5,
                max_connections=50,
                health_check_interval=30
            )
            # Testar conexão
            self.redis_client.ping()
            self.enabled = True
            logger.info(f"✅ Redis conectado em {host}:{port}")
        except Exception as e:
            logger.warning(f"⚠️ Redis não disponível: {e}. Cache em memória será usado.")
            self.redis_client = None
            self.enabled = False
            # Fallback: cache em memória (dict simples)
            self._memory_cache = {}
    
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """
        Gera chave única baseada nos parâmetros
        """
        key_data = f"{prefix}:{str(args)}:{str(sorted(kwargs.items()))}"
        return f"cnpj_api:{hashlib.md5(key_data.encode()).hexdigest()}"

    def generate_key(self, prefix: str, *args, **kwargs) -> str:
        return self._generate_key(prefix, *args, **kwargs)
    
    def _compress(self, data: Any) -> bytes:
        """
        Comprime dados usando zlib (reduz uso de memória em 70-90%)
        """
        try:
            # Serializar com pickle (suporta qualquer tipo Python)
            pickled = pickle.dumps(data)
            # Comprimir com zlib
            compressed = zlib.compress(pickled, level=6)
            return compressed
        except Exception as e:
            logger.error(f"Erro ao comprimir dados: {e}")
            return None
    
    def _decompress(self, data: bytes) -> Any:
        """
        Descomprime dados
        """
        try:
            # Descomprimir
            decompressed = zlib.decompress(data)
            # Desserializar
            unpickled = pickle.loads(decompressed)
            return unpickled
        except Exception as e:
            logger.error(f"Erro ao descomprimir dados: {e}")
            return None
    
    def get(self, key: str) -> Optional[Any]:
        """
        Busca valor do cache
        """
        if not self.enabled:
            # Fallback: memória
            return self._memory_cache.get(key)
        
        try:
            data = self.redis_client.get(key)
            if data is None:
                return None
            
            # Descomprimir e retornar
            return self._decompress(data)
        except Exception as e:
            logger.error(f"Erro ao buscar do Redis: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> bool:
        """
        Salva valor no cache com TTL (time to live)
        """
        if not self.enabled:
            # Fallback: memória (sem TTL automático)
            self._memory_cache[key] = value
            return True
        
        try:
            # Comprimir dados
            compressed = self._compress(value)
            if compressed is None:
                return False
            
            # Salvar no Redis com TTL
            self.redis_client.setex(
                name=key,
                time=ttl_seconds,
                value=compressed
            )
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar no Redis: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """
        Remove valor do cache
        """
        if not self.enabled:
            self._memory_cache.pop(key, None)
            return True
        
        try:
            self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Erro ao deletar do Redis: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """
        Remove todas as chaves que correspondem ao padrão
        """
        if not self.enabled:
            count = 0
            for key in list(self._memory_cache.keys()):
                if pattern.replace('*', '') in key:
                    self._memory_cache.pop(key, None)
                    count += 1
            return count
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Erro ao deletar padrão do Redis: {e}")
            return 0
    
    def clear_all(self) -> bool:
        """
        Limpa TODO o cache (use com cuidado!)
        """
        if not self.enabled:
            self._memory_cache.clear()
            return True
        
        try:
            # Limpar apenas chaves da nossa aplicação
            return self.delete_pattern('cnpj_api:*') > 0
        except Exception as e:
            logger.error(f"Erro ao limpar cache: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """
        Verifica se chave existe
        """
        if not self.enabled:
            return key in self._memory_cache
        
        try:
            return bool(self.redis_client.exists(key))
        except Exception as e:
            logger.error(f"Erro ao verificar existência: {e}")
            return False
    
    def get_stats(self) -> dict:
        """
        Retorna estatísticas do cache
        """
        if not self.enabled:
            return {
                'enabled': False,
                'type': 'memory',
                'keys': len(self._memory_cache)
            }
        
        try:
            info = self.redis_client.info('stats')
            memory = self.redis_client.info('memory')
            
            return {
                'enabled': True,
                'type': 'redis',
                'total_keys': self.redis_client.dbsize(),
                'used_memory': memory.get('used_memory_human', 'N/A'),
                'hits': info.get('keyspace_hits', 0),
                'misses': info.get('keyspace_misses', 0),
                'hit_rate': self._calculate_hit_rate(
                    info.get('keyspace_hits', 0),
                    info.get('keyspace_misses', 0)
                )
            }
        except Exception as e:
            logger.error(f"Erro ao obter stats: {e}")
            return {'enabled': False, 'error': str(e)}
    
    def _calculate_hit_rate(self, hits: int, misses: int) -> str:
        """
        Calcula taxa de acerto do cache
        """
        total = hits + misses
        if total == 0:
            return "0%"
        return f"{(hits / total * 100):.2f}%"


def cache_decorator(ttl_seconds: int = 3600, key_prefix: str = ""):
    """
    Decorator para cachear retorno de funções
    
    Uso:
    @cache_decorator(ttl_seconds=1800, key_prefix="cnpj")
    async def get_cnpj_data(cnpj: str):
        # ... query no banco ...
        return data
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Gerar chave única
            cache_key = cache.generate_key(
                key_prefix or func.__name__,
                *args,
                **kwargs
            )
            
            # Tentar buscar do cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                logger.info(f"💾 Cache HIT: {func.__name__}")
                return cached_value
            
            # Executar função
            logger.info(f"🔍 Cache MISS: {func.__name__}")
            result = await func(*args, **kwargs)
            
            # Salvar no cache
            if result is not None:
                cache.set(cache_key, result, ttl_seconds)
            
            return result
        
        return wrapper
    return decorator


# Instância global do cache
# Redis configurado na VPS com senha!
import os
from src.config import settings

cache = RedisCache(
    host=os.getenv('REDIS_HOST', '72.61.217.143'),  # IP da VPS
    port=int(os.getenv('REDIS_PORT', '6379')),
    db=0,
    password=os.getenv('REDIS_PASSWORD', None)  # Senha do Redis
)

# Exemplo de uso:
"""
from src.api.cache_redis import cache

# Salvar no cache
cache.set('cnpj:00000000000191', {'razao_social': 'EMPRESA TESTE'}, ttl_seconds=3600)

# Buscar do cache
data = cache.get('cnpj:00000000000191')

# Deletar
cache.delete('cnpj:00000000000191')

# Limpar por padrão
cache.delete_pattern('cnpj:*')

# Ver estatísticas
stats = cache.get_stats()
print(stats)
"""
