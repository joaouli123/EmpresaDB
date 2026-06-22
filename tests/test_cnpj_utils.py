from src.utils.cnpj_utils import clean_cnpj


def test_clean_cnpj_formatado():
    assert clean_cnpj("12.345.678/0001-90") == "12345678000190"


def test_clean_cnpj_ja_limpo():
    assert clean_cnpj("12345678000190") == "12345678000190"


def test_clean_cnpj_com_espacos():
    assert clean_cnpj("  12.345.678/0001-90  ") == "12345678000190"


def test_clean_cnpj_vazio():
    assert clean_cnpj("") == ""
    assert clean_cnpj(None) == ""
