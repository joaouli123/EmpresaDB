from src.api.cache_redis import RedisCache


def _disabled_cache():
    # porta inválida força modo memória (Redis indisponível)
    return RedisCache(host='127.0.0.1', port=1)


def test_cache_memory_fallback_set_get():
    c = _disabled_cache()
    assert c.enabled is False
    c.set('k1', {'a': 1, 'uf': 'SP'}, ttl_seconds=60)
    assert c.get('k1') == {'a': 1, 'uf': 'SP'}


def test_generate_key_deterministico():
    c = _disabled_cache()
    k1 = c.generate_key('cnpj', '123')
    k2 = c.generate_key('cnpj', '123')
    assert k1 == k2
    assert k1.startswith('cnpj_api:')


def test_generate_key_diferente_por_args():
    c = _disabled_cache()
    assert c.generate_key('cnpj', '123') != c.generate_key('cnpj', '456')


def test_incr_rate_desabilitado_retorna_menos_um():
    c = _disabled_cache()
    # fail-open: sem Redis o rate limiter cai para memória
    assert c.incr_rate('rl:x', 60) == -1
