-- =====================================================================
-- ESTÁGIO 1 — Tabelas núcleo + extensões (rodar ANTES da importação)
-- Apenas PKs/FKs (necessárias para o UPSERT do ETL).
-- Índices secundários ficam para o estágio 02 (pós-importação) para
-- não tornar a carga de 138M de linhas lenta.
-- Corrige: DB-01 (view), DB-02 (colunas inexistentes), DB-03 (pg_trgm).
-- Idempotente.
-- =====================================================================

-- Extensões necessárias para busca por nome rápida (ILIKE) e acentos
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ---------- Tabelas auxiliares (importadas primeiro) ----------
CREATE TABLE IF NOT EXISTS cnaes (
    codigo VARCHAR(7) PRIMARY KEY,
    descricao TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS municipios (
    codigo VARCHAR(4) PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS motivos_situacao_cadastral (
    codigo VARCHAR(2) PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS naturezas_juridicas (
    codigo VARCHAR(4) PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS paises (
    codigo VARCHAR(3) PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS qualificacoes_socios (
    codigo VARCHAR(2) PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL
);

-- ---------- Empresas (nível CNPJ Básico - 8 dígitos) ----------
CREATE TABLE IF NOT EXISTS empresas (
    cnpj_basico VARCHAR(8) PRIMARY KEY,
    razao_social VARCHAR(500),
    natureza_juridica VARCHAR(4),
    qualificacao_responsavel VARCHAR(2),
    capital_social NUMERIC(18,2),
    porte_empresa VARCHAR(2),
    ente_federativo_responsavel VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Estabelecimentos (matriz e filiais) ----------
CREATE TABLE IF NOT EXISTS estabelecimentos (
    cnpj_basico VARCHAR(8) NOT NULL,
    cnpj_ordem VARCHAR(4) NOT NULL,
    cnpj_dv VARCHAR(2) NOT NULL,
    cnpj_completo VARCHAR(14) GENERATED ALWAYS AS (cnpj_basico || cnpj_ordem || cnpj_dv) STORED,
    identificador_matriz_filial VARCHAR(1),
    nome_fantasia VARCHAR(500),
    situacao_cadastral VARCHAR(2),
    data_situacao_cadastral DATE,
    motivo_situacao_cadastral VARCHAR(2),
    nome_cidade_exterior VARCHAR(255),
    pais VARCHAR(3),
    data_inicio_atividade DATE,
    cnae_fiscal_principal VARCHAR(7),
    cnae_fiscal_secundaria TEXT,
    tipo_logradouro VARCHAR(50),
    logradouro VARCHAR(500),
    numero VARCHAR(50),
    complemento VARCHAR(255),
    bairro VARCHAR(255),
    cep VARCHAR(8),
    uf VARCHAR(2),
    municipio VARCHAR(4),
    ddd_1 VARCHAR(4),
    telefone_1 VARCHAR(20),
    ddd_2 VARCHAR(4),
    telefone_2 VARCHAR(20),
    ddd_fax VARCHAR(4),
    fax VARCHAR(20),
    correio_eletronico VARCHAR(255),
    situacao_especial VARCHAR(255),
    data_situacao_especial DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (cnpj_basico, cnpj_ordem, cnpj_dv),
    FOREIGN KEY (cnpj_basico) REFERENCES empresas(cnpj_basico)
);

-- ---------- Sócios ----------
CREATE TABLE IF NOT EXISTS socios (
    id SERIAL PRIMARY KEY,
    cnpj_basico VARCHAR(8) NOT NULL,
    identificador_socio VARCHAR(1),
    nome_socio VARCHAR(500),
    cnpj_cpf_socio VARCHAR(14),
    qualificacao_socio VARCHAR(2),
    data_entrada_sociedade DATE,
    pais VARCHAR(3),
    representante_legal VARCHAR(11),
    nome_representante VARCHAR(500),
    qualificacao_representante VARCHAR(2),
    faixa_etaria VARCHAR(1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (cnpj_basico, identificador_socio, cnpj_cpf_socio),
    FOREIGN KEY (cnpj_basico) REFERENCES empresas(cnpj_basico)
);

-- ---------- Simples Nacional ----------
CREATE TABLE IF NOT EXISTS simples_nacional (
    cnpj_basico VARCHAR(8) PRIMARY KEY,
    opcao_simples VARCHAR(1),
    data_opcao_simples DATE,
    data_exclusao_simples DATE,
    opcao_mei VARCHAR(1),
    data_opcao_mei DATE,
    data_exclusao_mei DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cnpj_basico) REFERENCES empresas(cnpj_basico)
);
