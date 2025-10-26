def clean_cnpj(cnpj: str) -> str:
    """
    Remove formatação de um CNPJ (pontos, barras e hífens)
    
    Args:
        cnpj: CNPJ formatado ou não (ex: "12.345.678/0001-90" ou "12345678000190")
        
    Returns:
        CNPJ apenas com números (ex: "12345678000190")
    """
    if not cnpj:
        return ""
    
    return cnpj.replace('.', '').replace('/', '').replace('-', '').strip()
