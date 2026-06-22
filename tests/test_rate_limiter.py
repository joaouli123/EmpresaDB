import pytest
from fastapi import HTTPException
from src.api.rate_limiter import RateLimiter


def test_memory_limit_horario_excedido():
    rl = RateLimiter()
    rl._check_rate_limit_memory(1, max_requests=2, window_seconds=3600, burst_limit=100)
    rl._check_rate_limit_memory(1, max_requests=2, window_seconds=3600, burst_limit=100)
    with pytest.raises(HTTPException) as exc:
        rl._check_rate_limit_memory(1, max_requests=2, window_seconds=3600, burst_limit=100)
    assert exc.value.status_code == 429


def test_memory_burst_excedido():
    rl = RateLimiter()
    rl._check_rate_limit_memory(2, max_requests=10000, window_seconds=3600, burst_limit=2)
    rl._check_rate_limit_memory(2, max_requests=10000, window_seconds=3600, burst_limit=2)
    with pytest.raises(HTTPException) as exc:
        rl._check_rate_limit_memory(2, max_requests=10000, window_seconds=3600, burst_limit=2)
    assert exc.value.status_code == 429


def test_memory_dentro_do_limite_nao_bloqueia():
    rl = RateLimiter()
    for _ in range(5):
        rl._check_rate_limit_memory(3, max_requests=100, window_seconds=3600, burst_limit=100)


def test_planos_tem_limites_coerentes():
    # planos maiores devem permitir >= que planos menores
    rl = RateLimiter()
    assert rl.RATE_LIMITS['pro']['requests'] >= rl.RATE_LIMITS['free']['requests']
    assert rl.BURST_LIMITS['pro'] >= rl.BURST_LIMITS['free']
