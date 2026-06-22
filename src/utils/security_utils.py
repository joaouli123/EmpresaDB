"""
Utilitários de segurança puros (sem dependência de banco/IO) — testáveis.
"""
import hashlib
from typing import Optional


def hash_api_key(raw_key: str) -> str:
    """SEC-04: hash SHA-256 determinístico para armazenar/buscar API keys."""
    return hashlib.sha256((raw_key or '').encode('utf-8')).hexdigest()


def mask_cpf_socio(documento: Optional[str], identificador: Optional[str]) -> Optional[str]:
    """
    LGPD (SEC-02): mascara CPF de pessoa física, mantendo CNPJ de PJ visível.
    identificador '2' = pessoa física. Mantém só os 6 dígitos centrais.
    """
    if not documento:
        return documento
    doc = documento.strip()
    if identificador == '2' or len(doc) == 11:
        if len(doc) >= 11:
            return '***' + doc[3:9] + '**'
        return '***'
    return doc
