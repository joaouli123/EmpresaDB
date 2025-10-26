# 👥 Dados Disponíveis dos Sócios

## 📋 Informações Retornadas pela API

A API retorna **TODOS** os dados disponibilizados pela Receita Federal sobre os sócios de uma empresa:

### ✅ Campos Disponíveis

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `cnpj_basico` | string | 8 primeiros dígitos do CNPJ da empresa | `56054674` |
| `identificador_socio` | string | Código do tipo de sócio | `2` |
| `identificador_socio_desc` | string | **Descrição do tipo** | `Pessoa Física` |
| `nome_socio` | string | Nome completo do sócio | `JOAO LUCAS BARBOSA ULI` |
| `cnpj_cpf_socio` | string | CPF/CNPJ **MASCARADO** | `***904349**` |
| `qualificacao_socio` | string | Código da qualificação | `49` |
| `qualificacao_socio_desc` | string | **Descrição da qualificação** | `Sócio-Administrador` |
| `data_entrada_sociedade` | date | Data de entrada na sociedade | `2024-07-23` |
| `pais` | string | Código do país (se estrangeiro) | `105` |
| `representante_legal` | string | CPF do representante legal (se houver) | `***123456**` |
| `nome_representante` | string | Nome do representante legal | `FULANO DE TAL` |
| `qualificacao_representante` | string | Código da qualificação do representante | `05` |
| `qualificacao_representante_desc` | string | **Descrição da qualificação** | `Administrador` |
| `faixa_etaria` | string | Código da faixa etária | `3` |
| `faixa_etaria_desc` | string | **Descrição da faixa etária** | `21-30 anos` |

---

## ❌ Dados NÃO Disponíveis

A Receita Federal **NÃO fornece** os seguintes dados sobre os sócios:

### 🚫 Informações Pessoais
- ❌ **Email do sócio**
- ❌ **Telefone do sócio**
- ❌ **Endereço residencial do sócio**
- ❌ **CPF completo** (apenas parcialmente mascarado)

> 💡 **Por quê?** 
> Por questões de **privacidade** e conformidade com a **LGPD** (Lei Geral de Proteção de Dados), a Receita Federal não disponibiliza dados de contato pessoal dos sócios nos dados públicos.

---

## 🔐 CPF Mascarado

O CPF dos sócios vem **mascarado** no formato `***XXXXXX**`:

```json
{
  "cnpj_cpf_socio": "***904349**"
}
```

### Por que está mascarado?
- ✅ **Proteção de dados pessoais** (LGPD)
- ✅ **Segurança e privacidade** dos sócios
- ✅ **Padrão da Receita Federal** para dados públicos

> ⚠️ **Importante:** Este é o formato oficial fornecido pela Receita Federal. Não é possível obter o CPF completo através desta API.

---

## 📊 Tipos de Sócios

### `identificador_socio` / `identificador_socio_desc`

| Código | Descrição |
|--------|-----------|
| `1` | Pessoa Jurídica |
| `2` | Pessoa Física |
| `3` | Estrangeiro |

---

## 🎯 Qualificações dos Sócios

As qualificações mais comuns (código / descrição):

| Código | Descrição |
|--------|-----------|
| `05` | Administrador |
| `08` | Conselheiro de Administração |
| `10` | Diretor |
| `16` | Presidente |
| `17` | Procurador |
| `20` | Sociedade Consorciada |
| `22` | Sócio |
| `23` | Sócio Capitalista |
| `49` | Sócio-Administrador |
| `52` | Sócio Comanditado |
| `53` | Sócio Comanditário |
| `54` | Sócio de Indústria |
| `55` | Sócio Gerente |
| `56` | Sócio Incapaz ou Relativamente Incapaz |
| `59` | Sócio Pessoa Física Residente no Brasil |
| `63` | Sócio Pessoa Jurídica Domiciliado no Brasil |
| `65` | Titular Pessoa Física Residente no Brasil |
| `70` | Administrador Judicial |
| `71` | Liquidante |
| `72` | Interventor |

> 📘 A lista completa de qualificações pode ser consultada na tabela `qualificacoes_socios` do banco de dados.

---

## 👶 Faixas Etárias

### `faixa_etaria` / `faixa_etaria_desc`

| Código | Descrição |
|--------|-----------|
| `1` | 0-12 anos |
| `2` | 13-20 anos |
| `3` | 21-30 anos |
| `4` | 31-40 anos |
| `5` | 41-50 anos |
| `6` | 51-60 anos |
| `7` | 61-70 anos |
| `8` | 71-80 anos |
| `9` | Mais de 80 anos |
| `0` | Não informado |

---

## 📞 Dados de Contato da Empresa

Se você precisa de informações de contato, use o endpoint `/cnpj/{cnpj}` que retorna:

✅ **Dados disponíveis da EMPRESA:**
- Email da empresa (`correio_eletronico`)
- Telefone da empresa (`ddd_1` + `telefone_1`)
- Endereço completo do estabelecimento

```bash
GET /cnpj/56054674000123
```

Retorna:
```json
{
  "correio_eletronico": "LEONARDO@SAFECONSULTING.NET",
  "ddd_1": "47",
  "telefone_1": "88728618"
}
```

---

## 🔍 Exemplo Completo de Resposta

```json
{
  "cnpj_basico": "56054674",
  "identificador_socio": "2",
  "identificador_socio_desc": "Pessoa Física",
  "nome_socio": "JOAO LUCAS BARBOSA ULI",
  "cnpj_cpf_socio": "***904349**",
  "qualificacao_socio": "49",
  "qualificacao_socio_desc": "Sócio-Administrador",
  "data_entrada_sociedade": "2024-07-23",
  "pais": null,
  "representante_legal": null,
  "nome_representante": null,
  "qualificacao_representante": null,
  "qualificacao_representante_desc": null,
  "faixa_etaria": "3",
  "faixa_etaria_desc": "21-30 anos"
}
```

---

## ✅ Resumo

**O que você TEM:**
- ✅ Nome completo do sócio
- ✅ Tipo (PF, PJ, Estrangeiro)
- ✅ Qualificação (cargo/função)
- ✅ CPF mascarado
- ✅ Faixa etária
- ✅ Data de entrada
- ✅ Representante legal (quando aplicável)

**O que você NÃO TEM:**
- ❌ Email pessoal do sócio
- ❌ Telefone pessoal do sócio
- ❌ CPF completo
- ❌ Endereço residencial do sócio

> 💡 **Estes dados estão de acordo com a LGPD e são os mesmos disponibilizados pela Receita Federal em seus dados públicos.**
