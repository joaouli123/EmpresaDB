-- Schema completo para dados públicos de CNPJ da Receita Federal
-- Criado para PostgreSQL 16

-- Tabelas Auxiliares (devem ser importadas primeiro)

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

-- Tabela de Empresas (nível de CNPJ Básico - 8 dígitos)
CREATE TABLE IF NOT EXISTS empresas (
    cnpj_basico VARCHAR(8) PRIMARY KEY,
    razao_social VARCHAR(500),
    natureza_juridica VARCHAR(4),
    qualificacao_responsavel VARCHAR(2),
    capital_social NUMERIC(18,2),
    porte_empresa VARCHAR(2),
    ente_federativo_responsavel VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (natureza_juridica) REFERENCES naturezas_juridicas(codigo),
    FOREIGN KEY (qualificacao_responsavel) REFERENCES qualificacoes_socios(codigo)
);

-- Tabela de Estabelecimentos (todos os estabelecimentos de cada empresa)
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
    FOREIGN KEY (cnpj_basico) REFERENCES empresas(cnpj_basico),
    FOREIGN KEY (motivo_situacao_cadastral) REFERENCES motivos_situacao_cadastral(codigo),
    FOREIGN KEY (pais) REFERENCES paises(codigo),
    FOREIGN KEY (cnae_fiscal_principal) REFERENCES cnaes(codigo),
    FOREIGN KEY (municipio) REFERENCES municipios(codigo)
);

-- Tabela de Sócios
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
    FOREIGN KEY (cnpj_basico) REFERENCES empresas(cnpj_basico),
    FOREIGN KEY (qualificacao_socio) REFERENCES qualificacoes_socios(codigo),
    FOREIGN KEY (pais) REFERENCES paises(codigo),
    FOREIGN KEY (qualificacao_representante) REFERENCES qualificacoes_socios(codigo)
);

-- Tabela Simples Nacional
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

-- Índices para otimização de consultas

-- Índices em Empresas
CREATE INDEX IF NOT EXISTS idx_empresas_razao_social ON empresas USING gin(to_tsvector('portuguese', razao_social));
CREATE INDEX IF NOT EXISTS idx_empresas_natureza ON empresas(natureza_juridica);
CREATE INDEX IF NOT EXISTS idx_empresas_porte ON empresas(porte_empresa);

-- Índices em Estabelecimentos (os mais importantes para consultas)
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_cnpj_completo ON estabelecimentos(cnpj_completo);
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_nome_fantasia ON estabelecimentos USING gin(to_tsvector('portuguese', nome_fantasia));
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_situacao ON estabelecimentos(situacao_cadastral);
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_uf ON estabelecimentos(uf);
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_municipio ON estabelecimentos(municipio);
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_cnae_principal ON estabelecimentos(cnae_fiscal_principal);
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_matriz_filial ON estabelecimentos(identificador_matriz_filial);
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_cep ON estabelecimentos(cep);
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_data_inicio ON estabelecimentos(data_inicio_atividade);

-- Índices em Sócios
CREATE INDEX IF NOT EXISTS idx_socios_cnpj_basico ON socios(cnpj_basico);
CREATE INDEX IF NOT EXISTS idx_socios_nome ON socios USING gin(to_tsvector('portuguese', nome_socio));
CREATE INDEX IF NOT EXISTS idx_socios_cpf_cnpj ON socios(cnpj_cpf_socio);
CREATE INDEX IF NOT EXISTS idx_socios_qualificacao ON socios(qualificacao_socio);

-- Índices em Simples Nacional
CREATE INDEX IF NOT EXISTS idx_simples_opcao ON simples_nacional(opcao_simples);
CREATE INDEX IF NOT EXISTS idx_simples_mei ON simples_nacional(opcao_mei);

-- Views úteis para consultas

-- View de estabelecimentos com dados da empresa
CREATE OR REPLACE VIEW vw_estabelecimentos_completos AS
SELECT 
    e.cnpj_completo,
    e.identificador_matriz_filial,
    emp.razao_social,
    e.nome_fantasia,
    e.situacao_cadastral,
    e.data_situacao_cadastral,
    msc.descricao as motivo_situacao_cadastral_desc,
    e.data_inicio_atividade,
    e.cnae_fiscal_principal,
    cnae.descricao as cnae_principal_desc,
    e.tipo_logradouro,
    e.logradouro,
    e.numero,
    e.complemento,
    e.bairro,
    e.cep,
    e.uf,
    mun.descricao as municipio_desc,
    e.ddd_1,
    e.telefone_1,
    e.correio_eletronico,
    emp.natureza_juridica,
    nj.descricao as natureza_juridica_desc,
    emp.porte_empresa,
    emp.capital_social,
    sn.opcao_simples,
    sn.opcao_mei
FROM estabelecimentos e
INNER JOIN empresas emp ON e.cnpj_basico = emp.cnpj_basico
LEFT JOIN motivos_situacao_cadastral msc ON e.motivo_situacao_cadastral = msc.codigo
LEFT JOIN cnaes cnae ON e.cnae_fiscal_principal = cnae.codigo
LEFT JOIN municipios mun ON e.municipio = mun.codigo
LEFT JOIN naturezas_juridicas nj ON emp.natureza_juridica = nj.codigo
LEFT JOIN simples_nacional sn ON e.cnpj_basico = sn.cnpj_basico;

-- Comentários nas tabelas
COMMENT ON TABLE empresas IS 'Dados cadastrais das empresas (nível CNPJ Básico - 8 dígitos)';
COMMENT ON TABLE estabelecimentos IS 'Dados dos estabelecimentos (matriz e filiais) com CNPJ completo de 14 dígitos';
COMMENT ON TABLE socios IS 'Informações sobre sócios e representantes legais';
COMMENT ON TABLE simples_nacional IS 'Opções de Simples Nacional e MEI';
COMMENT ON TABLE cnaes IS 'Classificação Nacional de Atividades Econômicas';
COMMENT ON TABLE municipios IS 'Códigos e nomes dos municípios brasileiros';
COMMENT ON TABLE motivos_situacao_cadastral IS 'Motivos da situação cadastral do estabelecimento';
COMMENT ON TABLE naturezas_juridicas IS 'Naturezas jurídicas das empresas';
COMMENT ON TABLE paises IS 'Códigos e nomes dos países';
COMMENT ON TABLE qualificacoes_socios IS 'Qualificações dos sócios e responsáveis';
