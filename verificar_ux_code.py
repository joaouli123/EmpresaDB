
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Conectar ao banco
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cursor = conn.cursor()

print("=" * 80)
print("VERIFICAÇÃO COMPLETA: UX CODE TECNOLOGIA LTDA")
print("=" * 80)

# Buscar empresa pelo CNPJ básico
cnpj_basico = "56054674"

# 1. DADOS DA EMPRESA (tabela empresas)
print("\n📋 DADOS DA EMPRESA (tabela empresas):")
cursor.execute("""
    SELECT 
        cnpj_basico, razao_social, natureza_juridica, 
        qualificacao_responsavel, capital_social, porte_empresa,
        ente_federativo_responsavel
    FROM empresas
    WHERE cnpj_basico = %s
""", (cnpj_basico,))
empresa = cursor.fetchone()
if empresa:
    print(f"  CNPJ Básico: {empresa[0]}")
    print(f"  Razão Social: {empresa[1]}")
    print(f"  Natureza Jurídica: {empresa[2]}")
    print(f"  Qualificação Responsável: {empresa[3]}")
    print(f"  Capital Social: R$ {empresa[4]}")
    print(f"  Porte Empresa: {empresa[5]}")
    print(f"  Ente Federativo: {empresa[6]}")
else:
    print("  ❌ Empresa não encontrada!")

# 2. DADOS DO ESTABELECIMENTO
print("\n🏢 DADOS DO ESTABELECIMENTO (tabela estabelecimentos):")
cursor.execute("""
    SELECT 
        cnpj_basico, cnpj_ordem, cnpj_dv, identificador_matriz_filial,
        nome_fantasia, situacao_cadastral, data_situacao_cadastral,
        motivo_situacao_cadastral, nome_cidade_exterior, pais,
        data_inicio_atividade, cnae_fiscal_principal, cnae_fiscal_secundaria,
        tipo_logradouro, logradouro, numero, complemento, bairro,
        cep, uf, municipio, ddd_1, telefone_1, ddd_2, telefone_2,
        ddd_fax, fax, correio_eletronico, situacao_especial,
        data_situacao_especial
    FROM estabelecimentos
    WHERE cnpj_basico = %s
""", (cnpj_basico,))
estabelecimentos = cursor.fetchall()
print(f"  Total de estabelecimentos: {len(estabelecimentos)}")
for est in estabelecimentos:
    print(f"\n  Estabelecimento: {est[0]}/{est[1]}-{est[2]}")
    print(f"    Tipo: {'Matriz' if est[3] == '1' else 'Filial'}")
    print(f"    Nome Fantasia: {est[4]}")
    print(f"    Situação: {est[5]}")
    print(f"    Data Situação: {est[6]}")
    print(f"    Motivo Situação: {est[7]}")
    print(f"    Data Início: {est[10]}")
    print(f"    CNAE Principal: {est[11]}")
    print(f"    CNAEs Secundários: {est[12]}")
    print(f"    Endereço: {est[13]} {est[14]}, {est[15]}")
    print(f"    Complemento: {est[16]}")
    print(f"    Bairro: {est[17]}")
    print(f"    CEP: {est[18]}")
    print(f"    UF: {est[19]}")
    print(f"    Município: {est[20]}")
    print(f"    Telefone: ({est[21]}) {est[22]}")
    print(f"    Email: {est[26]}")

# 3. SÓCIOS
print("\n👥 SÓCIOS (tabela socios):")
cursor.execute("""
    SELECT 
        identificador_socio, nome_socio, cnpj_cpf_socio,
        qualificacao_socio, data_entrada_sociedade, pais,
        representante_legal, nome_representante, 
        qualificacao_representante, faixa_etaria
    FROM socios
    WHERE cnpj_basico = %s
""", (cnpj_basico,))
socios = cursor.fetchall()
print(f"  Total de sócios: {len(socios)}")
for socio in socios:
    print(f"\n  Sócio:")
    print(f"    Tipo: {socio[0]} (1=PJ, 2=PF, 3=Estrangeiro)")
    print(f"    Nome: {socio[1]}")
    print(f"    CPF/CNPJ: {socio[2]}")
    print(f"    Qualificação: {socio[3]}")
    print(f"    Data Entrada: {socio[4]}")
    print(f"    País: {socio[5]}")
    print(f"    Representante Legal: {socio[6]}")
    print(f"    Nome Representante: {socio[7]}")
    print(f"    Qualificação Rep.: {socio[8]}")
    print(f"    Faixa Etária: {socio[9]}")

# 4. DESCRIÇÕES DAS TABELAS AUXILIARES
print("\n📚 DESCRIÇÕES (tabelas auxiliares):")

# Natureza Jurídica
if empresa:
    cursor.execute("SELECT descricao FROM naturezas_juridicas WHERE codigo = %s", (empresa[2],))
    nat_jur = cursor.fetchone()
    if nat_jur:
        print(f"  Natureza Jurídica: {nat_jur[0]}")

    # Qualificação Responsável
    cursor.execute("SELECT descricao FROM qualificacoes_socios WHERE codigo = %s", (empresa[3],))
    qual_resp = cursor.fetchone()
    if qual_resp:
        print(f"  Qualificação Responsável: {qual_resp[0]}")

# CNAE Principal
if estabelecimentos:
    cnae_principal = estabelecimentos[0][11]
    cursor.execute("SELECT descricao FROM cnaes WHERE codigo = %s", (cnae_principal,))
    cnae_desc = cursor.fetchone()
    if cnae_desc:
        print(f"  CNAE Principal: {cnae_desc[0]}")

    # Município
    municipio_cod = estabelecimentos[0][20]
    cursor.execute("SELECT descricao FROM municipios WHERE codigo = %s", (municipio_cod,))
    mun_desc = cursor.fetchone()
    if mun_desc:
        print(f"  Município: {mun_desc[0]}")

    # Motivo Situação Cadastral
    motivo = estabelecimentos[0][7]
    if motivo:
        cursor.execute("SELECT descricao FROM motivos_situacao_cadastral WHERE codigo = %s", (motivo,))
        motivo_desc = cursor.fetchone()
        if motivo_desc:
            print(f"  Motivo Situação: {motivo_desc[0]}")

# 5. VERIFICAR O QUE A VIEW RETORNA
print("\n🔍 DADOS DA VIEW (vw_estabelecimentos_completos):")
cursor.execute("""
    SELECT *
    FROM vw_estabelecimentos_completos
    WHERE cnpj_completo = '56054674000123'
""")
view_data = cursor.fetchone()
if view_data:
    # Pegar nomes das colunas
    colnames = [desc[0] for desc in cursor.description]
    print(f"  Colunas disponíveis na view: {len(colnames)}")
    for i, col in enumerate(colnames):
        if view_data[i] is not None:
            print(f"    {col}: {view_data[i]}")
else:
    print("  ❌ Não encontrado na view!")

print("\n" + "=" * 80)
print("ANÁLISE COMPARATIVA COM SEU SISTEMA:")
print("=" * 80)
print("\n✅ DADOS QUE APARECEM NO SEU SISTEMA:")
print("  - CNPJ Básico: 56.054.674")
print("  - Razão Social: UX CODE TECNOLOGIA LTDA")
print("  - Capital Social: R$ 2.000,00")
print("  - Simples: Não")
print("  - MEI: Não")
print("  - CNPJ Completo: 56.054.674/0001-23")
print("  - Situação: Ativa")
print("  - Data Início: 22/07/2024")
print("  - CNAE Principal: 6201502")
print("  - Endereço: RUA URUGUAI, 299, ANDAR 2 SALA 01 BOX 01")
print("  - Bairro: CENTRO")
print("  - CEP: 88302201")
print("  - Telefone: (47) 88728618")
print("  - Email: LEONARDO@SAFECONSULTING.NET")

print("\n❓ DADOS QUE APARECEM COMO N/A:")
print("  - Natureza Jurídica")
print("  - Porte")
print("  - Qualificação do Responsável")

print("\n❌ ABA DE SÓCIOS:")
print("  - Mostra 'Nenhum sócio encontrado'")

cursor.close()
conn.close()
