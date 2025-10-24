# ❓ Perguntas Frequentes (FAQ) - API CNPJ

## 🔑 Autenticação e Acesso

### Como obtenho minha API Key?

1. Acesse `https://sua-api.com.br`
2. Faça login ou cadastre-se
3. Vá até **"Chaves de API"**
4. Clique em **"Nova Chave"**
5. Copie e guarde sua chave com segurança

### A API Key expira?

Não! Sua API Key é **permanente** até você revogá-la manualmente no painel de clientes.

### Posso ter múltiplas API Keys?

Sim! Você pode gerar múltiplas chaves para diferentes aplicações ou ambientes (produção, desenvolvimento, etc.).

### Como revogar uma API Key?

No painel de clientes, vá até **"Chaves de API"** e clique em **"Revogar"** na chave que deseja desativar.

### Esqueci minha API Key, como recupero?

Você não pode recuperar uma chave antiga por segurança, mas pode:
1. Gerar uma nova chave no painel
2. Atualizar suas aplicações com a nova chave
3. Revogar a chave antiga (se necessário)

---

## 💰 Planos e Limites

### Quantas consultas posso fazer por mês?

Depende do seu plano:
- **Básico**: 300 consultas/mês
- **Profissional**: 500 consultas/mês  
- **Empresarial**: 1.000 consultas/mês

### O que acontece se eu exceder o limite?

Você receberá um erro HTTP 429 (Too Many Requests) e precisará:
- Aguardar a renovação mensal, ou
- Fazer upgrade de plano, ou
- Comprar pacotes adicionais

### Como compro consultas adicionais?

No painel de clientes, vá até **"Pacotes Adicionais"**:
- **+200 consultas**: R$ 49,90
- **+400 consultas**: R$ 69,90

### Quando meu limite de consultas renova?

No mesmo dia do mês em que você contratou. Ex: Se contratou dia 15, renova todo dia 15.

### O que conta como "1 consulta"?

Cada requisição aos seguintes endpoints conta:
- `GET /cnpj/{cnpj}` = 1 consulta
- `GET /search` = 1 consulta (independente da quantidade de resultados)
- `GET /cnpj/{cnpj}/socios` = 1 consulta

Endpoints que NÃO consomem limite:
- `GET /` (health check)
- `GET /stats`
- `GET /cnaes`
- `GET /municipios/{uf}`

---

## 🔍 Consultas e Filtros

### Como faço busca parcial de CNPJ?

Use o endpoint `/search` com o parâmetro `cnpj`:

```
GET /search?cnpj=12345678
```

Isso retorna todos os CNPJs que começam com "12345678".

### Como busco por nome da empresa?

Use `razao_social` ou `nome_fantasia` (busca parcial, case-insensitive):

```
GET /search?razao_social=PETROBRAS
GET /search?nome_fantasia=Extra
```

### Posso combinar múltiplos filtros?

**Sim!** Combine quantos filtros quiser:

```
GET /search?uf=SP&porte=4&capital_social_min=1000000&situacao_cadastral=02&simples=N
```

### Como busco empresas em uma cidade específica?

Use o filtro `municipio` com o código IBGE:

```
GET /search?municipio=3550308
```

Para descobrir o código, use:
```
GET /municipios/SP
```

### Como filtro por faixa de capital social?

Use `capital_social_min` e `capital_social_max`:

```
# Entre 100k e 1M
GET /search?capital_social_min=100000&capital_social_max=1000000

# Acima de 5M
GET /search?capital_social_min=5000000

# Até 50k
GET /search?capital_social_max=50000
```

### Como busco empresas abertas em um período?

Use `data_inicio_atividade_de` e `data_inicio_atividade_ate`:

```
# Empresas abertas em 2023
GET /search?data_inicio_atividade_de=2023-01-01&data_inicio_atividade_ate=2023-12-31

# Abertas depois de jan/2024
GET /search?data_inicio_atividade_de=2024-01-01
```

### Como encontro apenas matrizes (sem filiais)?

Use `identificador_matriz_filial=1`:

```
GET /search?identificador_matriz_filial=1
```

### Como busco MEIs?

Use `mei=S`:

```
GET /search?mei=S&uf=SP&situacao_cadastral=02
```

### Como busco por CNAE (atividade econômica)?

```
GET /search?cnae=4712100
```

Para descobrir CNAEs, use:
```
GET /cnaes?search=comercio
```

### Posso buscar sócios de uma empresa?

Sim! Use:

```
GET /cnpj/{cnpj}/socios
```

### Como busco empresas de um sócio específico?

Use o endpoint `/socios/search`:

```
GET /socios/search?nome_socio=JOÃO SILVA
GET /socios/search?cpf_cnpj=12345678900
```

---

## 📊 Paginação e Performance

### Qual o máximo de resultados por página?

**100 itens por página** (`per_page=100`).

### Como navego entre as páginas?

Use os parâmetros `page` e `per_page`:

```
GET /search?uf=SP&page=1&per_page=100  # Primeira página
GET /search?uf=SP&page=2&per_page=100  # Segunda página
```

A resposta inclui:
```json
{
  "total": 5000,
  "page": 1,
  "per_page": 100,
  "total_pages": 50,
  "items": [...]
}
```

### Como baixo todos os resultados de uma busca?

Itere por todas as páginas:

```python
page = 1
while page <= total_pages:
    resultado = buscar_empresas({"uf": "SP", "page": page, "per_page": 100})
    processar(resultado['items'])
    page += 1
```

### Por que minha busca está lenta?

Fatores que afetam performance:
- **Muitos filtros**: Mais filtros = mais processamento
- **Sem filtros**: Buscar SEM filtros retorna milhões de resultados
- **Paginação alta**: Páginas 100+ são mais lentas

**Dica**: Use filtros específicos (UF, CNAE, etc.) para melhorar velocidade.

### Posso fazer cache dos resultados?

**Sim!** Recomendamos cache local para:
- CNPJs que você consulta frequentemente
- Listas de CNAEs e municípios
- Estatísticas gerais

**Não** faça cache de:
- Dados de situação cadastral (pode mudar)
- Sócios (pode haver alterações)

---

## 🚨 Erros Comuns

### Erro 401: "API Key não fornecida"

**Causa**: Header `X-API-Key` não foi enviado.

**Solução**:
```bash
curl -H "X-API-Key: sua_chave_aqui" https://sua-api.com.br/api/v1/cnpj/...
```

### Erro 401: "API Key inválida"

**Causa**: A chave está incorreta ou foi revogada.

**Solução**:
1. Verifique se copiou a chave completa
2. Verifique se não há espaços extras
3. Gere uma nova chave se necessário

### Erro 404: "CNPJ não encontrado"

**Causa**: O CNPJ não existe na base de dados.

**Solução**:
- Verifique se o CNPJ está correto
- Confirme que tem 14 dígitos
- Lembre-se: alguns CNPJs muito antigos ou específicos podem não estar disponíveis

### Erro 400: "CNPJ deve ter 14 dígitos"

**Causa**: CNPJ incompleto ou com formatação errada.

**Solução**: Envie apenas os 14 dígitos numéricos:
```
✅ Correto: 00000000000191
❌ Errado: 0000000000019 (13 dígitos)
```

### Erro 429: "Limite de consultas excedido"

**Causa**: Você atingiu o limite mensal do seu plano.

**Solução**:
- Aguarde a renovação mensal, ou
- Faça upgrade de plano, ou
- Compre pacotes adicionais

### Erro 500: "Erro interno do servidor"

**Causa**: Problema temporário no servidor.

**Solução**:
- Tente novamente em alguns segundos
- Se persistir, contate o suporte

---

## 📅 Formato de Dados

### Qual o formato das datas?

**Sempre `YYYY-MM-DD`** (ISO 8601):

```
✅ Correto: 2024-01-15
✅ Correto: 2023-12-31
❌ Errado: 15/01/2024
❌ Errado: 2024/01/15
```

### Como interpreto a situação cadastral?

| Código | Descrição | Significado |
|--------|-----------|-------------|
| 01 | Nula | Empresa nunca ativada |
| 02 | Ativa | ⭐ Empresa em operação |
| 03 | Suspensa | Temporariamente suspensa |
| 04 | Inapta | Pendências com RF |
| 08 | Baixada | Empresa encerrada |

### Como interpreto o porte da empresa?

| Código | Descrição |
|--------|-----------|
| 1 | Micro Empresa |
| 2 | Empresa de Pequeno Porte |
| 3 | Empresa de Médio Porte |
| 4 | Grande Empresa |
| 5 | Demais (sem classificação) |

### O que significa "opcao_simples" e "opcao_mei"?

- `S` = Optante (está no Simples Nacional / é MEI)
- `N` = Não optante

### Como funciona o CNPJ (14 dígitos)?

O CNPJ tem 3 partes:
- **8 primeiros dígitos** (CNPJ Básico): Identifica a empresa
- **4 seguintes** (Ordem): Identifica o estabelecimento (0001 = matriz)
- **2 últimos** (DV): Dígitos verificadores

**Exemplo**: `12.345.678/0001-90`
- `12345678` = Empresa
- `0001` = Matriz
- `90` = DV

---

## 🔄 Atualizações

### Com que frequência os dados são atualizados?

**Mensalmente**, conforme a Receita Federal atualiza a base pública de CNPJ.

### Como sei quando os dados foram atualizados?

Acesse o endpoint `/stats` que mostra a data da última atualização.

### Os dados são em tempo real?

Não. Os dados vêm da base pública da Receita Federal, que é atualizada mensalmente. 

Para consultas em tempo real, você precisaria da API oficial da Receita Federal (Gov.br Conecta).

---

## 🔒 Segurança

### É seguro armazenar minha API Key no código?

**Não!** Nunca coloque API Keys diretamente no código. Use:

- **Variáveis de ambiente**:
  ```python
  import os
  API_KEY = os.getenv('CNPJ_API_KEY')
  ```

- **Arquivos de configuração** (fora do Git):
  ```
  # .env (adicionar no .gitignore)
  CNPJ_API_KEY=sua_chave_aqui
  ```

### A API usa HTTPS?

**Sim!** Todas as requisições são feitas via HTTPS (criptografadas).

### Vocês armazenam minhas consultas?

Armazenamos apenas:
- **Logs de acesso** (para segurança e debugging)
- **Contadores de uso** (para billing)

Não compartilhamos seus dados de consulta com terceiros.

---

## 🛠️ Integração

### Preciso de alguma biblioteca específica?

Não! A API é REST padrão e funciona com qualquer cliente HTTP:
- Python: `requests`
- JavaScript: `fetch`, `axios`
- PHP: `curl`
- Java: `HttpURLConnection`
- C#: `HttpClient`

### A API tem SDK oficial?

Ainda não, mas fornecemos exemplos de código completos em:
- Python
- JavaScript/Node.js
- PHP
- Java
- C#
- Ruby
- Go

Ver arquivo: `EXEMPLOS_CODIGO.md`

### Posso usar em aplicações front-end (JavaScript no navegador)?

**Não recomendado!** Isso exporia sua API Key publicamente.

**Solução**: Crie um backend intermediário que:
1. Recebe requisições do front-end
2. Usa a API Key (segura no servidor)
3. Retorna os dados ao front-end

### Como implemento retry/fallback?

```python
import time

def consultar_com_retry(cnpj, max_tentativas=3):
    for tentativa in range(max_tentativas):
        try:
            return consultar_cnpj(cnpj)
        except Exception as e:
            if tentativa < max_tentativas - 1:
                time.sleep(2 ** tentativa)  # Backoff exponencial
            else:
                raise e
```

---

## 📞 Suporte

### Como entro em contato com o suporte?

- 📧 **E-mail**: suporte@sua-api.com.br
- 💬 **Chat**: Disponível no painel de clientes
- 📖 **Documentação**: https://sua-api.com.br/docs

### Qual o horário de atendimento?

Segunda a Sexta: 9h às 18h (horário de Brasília)

Sábados, domingos e feriados: Atendimento apenas por e-mail (resposta em até 24h úteis)

### Oferecem suporte técnico para integração?

Sim! Nossos planos incluem:
- **Básico**: Suporte por e-mail
- **Profissional**: Suporte prioritário + chat
- **Empresarial**: Suporte dedicado + consultoria de integração

---

## 📈 Casos de Uso

### Para que serve essa API?

Principais usos:
- ✅ **Due diligence**: Verificar dados de empresas e sócios
- ✅ **Compliance**: Validar CNPJs de clientes/fornecedores
- ✅ **Prospecção**: Encontrar leads por região/atividade
- ✅ **Análise de mercado**: Estudar concorrentes
- ✅ **Integração de sistemas**: Autocompletar cadastros
- ✅ **Business intelligence**: Relatórios e dashboards

### Posso usar para validar CNPJ em formulários?

Sim! Mas para apenas validar se existe, use o endpoint:
```
GET /cnpj/{cnpj}
```

Se retornar 200, o CNPJ existe. Se retornar 404, não existe.

### Posso revender os dados?

**Não.** Os dados são públicos da Receita Federal, mas a revenda de acesso à API não é permitida pelos termos de uso.

Você pode:
- ✅ Usar internamente na sua empresa
- ✅ Integrar em produtos/serviços para seus clientes
- ❌ Revender acesso direto à API

---

## ✅ Ainda tem dúvidas?

Entre em contato:
- 📧 suporte@sua-api.com.br
- 💬 Chat no painel de clientes
- 📖 Documentação completa: `DOCUMENTACAO_API_TERCEIROS.md`
