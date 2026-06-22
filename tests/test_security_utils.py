from src.utils.security_utils import hash_api_key, mask_cpf_socio


def test_hash_api_key_deterministico():
    h1 = hash_api_key("sk_abc123")
    h2 = hash_api_key("sk_abc123")
    assert h1 == h2
    assert len(h1) == 64  # SHA-256 hex
    assert h1 != "sk_abc123"  # nunca é o texto puro


def test_hash_api_key_chaves_diferentes():
    assert hash_api_key("sk_a") != hash_api_key("sk_b")


def test_hash_api_key_vazio_nao_quebra():
    assert len(hash_api_key("")) == 64
    assert len(hash_api_key(None)) == 64


def test_mask_cpf_pessoa_fisica():
    # identificador '2' = pessoa física -> mascarado
    masked = mask_cpf_socio("12345678901", "2")
    assert masked.startswith("***")
    assert "456789" in masked  # mantém dígitos centrais


def test_mask_cpf_nao_revela_extremidades():
    masked = mask_cpf_socio("12345678901", "2")
    assert not masked.startswith("123")
    assert not masked.endswith("901")


def test_mask_cnpj_pessoa_juridica_visivel():
    # CNPJ de PJ (14 dígitos, identificador '1') permanece visível
    doc = "12345678000190"
    assert mask_cpf_socio(doc, "1") == doc


def test_mask_vazio():
    assert mask_cpf_socio(None, "2") is None
    assert mask_cpf_socio("", "2") == ""
