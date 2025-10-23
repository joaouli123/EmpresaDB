from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date

class CNAEModel(BaseModel):
    codigo: str
    descricao: str

class MunicipioModel(BaseModel):
    codigo: str
    descricao: str

class EmpresaBasica(BaseModel):
    cnpj_basico: str
    razao_social: Optional[str] = None
    natureza_juridica: Optional[str] = None
    capital_social: Optional[float] = None
    porte_empresa: Optional[str] = None

class EstabelecimentoCompleto(BaseModel):
    cnpj_completo: str
    cnpj_basico: str
    cnpj_ordem: str
    cnpj_dv: str
    identificador_matriz_filial: Optional[str] = None
    razao_social: Optional[str] = None
    nome_fantasia: Optional[str] = None
    situacao_cadastral: Optional[str] = None
    data_situacao_cadastral: Optional[date] = None
    data_inicio_atividade: Optional[date] = None
    cnae_fiscal_principal: Optional[str] = None
    cnae_principal_desc: Optional[str] = None
    tipo_logradouro: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cep: Optional[str] = None
    uf: Optional[str] = None
    municipio_desc: Optional[str] = None
    ddd_1: Optional[str] = None
    telefone_1: Optional[str] = None
    correio_eletronico: Optional[str] = None
    capital_social: Optional[float] = None
    porte_empresa: Optional[str] = None
    opcao_simples: Optional[str] = None
    opcao_mei: Optional[str] = None

    class Config:
        from_attributes = True

class SocioModel(BaseModel):
    cnpj_basico: str
    identificador_socio: Optional[str] = None
    nome_socio: Optional[str] = None
    cnpj_cpf_socio: Optional[str] = None
    qualificacao_socio: Optional[str] = None
    data_entrada_sociedade: Optional[date] = None

    class Config:
        from_attributes = True

class PaginatedResponse(BaseModel):
    total: int
    page: int
    per_page: int
    total_pages: int
    items: List[EstabelecimentoCompleto]

class HealthCheck(BaseModel):
    status: str
    database: str
    message: str

class StatsResponse(BaseModel):
    total_empresas: int
    total_estabelecimentos: int
    total_socios: int
    total_cnaes: int
    total_municipios: int
