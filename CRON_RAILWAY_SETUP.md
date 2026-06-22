# 🔄 Atualização mensal automática no Railway (Opção B — server-side)

Objetivo: o banco se atualiza **sozinho todo mês** com os dados novos da Receita,
**sem depender do seu PC**, e **apagando os arquivos** após importar (libera disco).

O script `atualizar_mensal.py` já faz tudo: detecta mês novo no repositório SERPRO+ →
baixa → extrai → dropa índices → recarrega via COPY → reconstrói índices + materialized
view → verifica → **apaga os CSVs/zips** → marca o mês importado. É idempotente
(se já está no mês mais recente, não faz nada) e **termina** ao concluir (requisito do cron).

## Por que server-side (e não no seu PC)
- Download da Receita → Railway é **servidor-a-servidor (rápido)**.
- Carga vai pela **rede interna** do Railway (`postgres.railway.internal`) — rápida e **sem custo de egress**.
- Não precisa o PC ligado.

## Passo a passo (feito durante o deploy)

### 1. Pré-requisito: código no GitHub
As mudanças desta sessão precisam estar no repo `joaouli123/EmpresaDB` (deploy).

### 2. Criar o serviço de cron no projeto EmpresaDB
No dashboard do Railway → projeto **EmpresaDB** → **+ New** → **GitHub Repo** →
selecionar `joaouli123/EmpresaDB`. Nomear o serviço, ex.: **`cnpj-etl-mensal`**.

### 3. Configurar o serviço (Settings)
- **Custom Start Command:** `python atualizar_mensal.py`
- **Cron Schedule:** `0 6 * * 1`  ← toda segunda-feira 06:00 UTC (03:00 BRT)
  - Semanal (não mensal) **de propósito**: o script é idempotente e só faz a carga
    pesada quando há mês novo. Assim ele **pega o mês novo dentro de até 7 dias** da
    publicação, sem você precisar adivinhar o dia exato que a Receita publica.
- **Variables** (referências internas, sem egress):
  - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
  - `RFB_SHARE_TOKEN` = `YggdBLfdninEJX9` (só precisa trocar se a Receita mudar o link)

### 4. Recursos
- Disco efêmero: o pico é ~36GB (zips são apagados após extrair). O limite do Railway
  é 100GB efêmeros por serviço — folga suficiente. Após importar, os CSVs são apagados.
- O container sobe, roda a atualização (~30-60 min server-side quando há mês novo; segundos
  quando não há), e **termina**.

## Verificacao automatica (2x por mes)

Alem da atualizacao, rode uma checagem de integridade dos dados **duas vezes por mes**
(confere contagens por tabela, integridade de FK, datas, consulta CNPJ ponta-a-ponta e a
materialized view). Crie um SEGUNDO servico de cron no mesmo projeto:

- **Nome:** `cnpj-verificacao`
- **Custom Start Command:** `python verify_import.py`
- **Cron Schedule:** `0 7 8,22 * *`  ← dia 8 e dia 22 de cada mes, 07:00 UTC (04:00 BRT)
- **Variables:** `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
- O `verify_import.py` sai com codigo != 0 se algo estiver errado (contagem fora da faixa,
  orfaos de FK, etc.), e o Railway marca o run como falho — facil de monitorar nos logs/alertas.

## Como testar manualmente (uma vez)
No serviço de cron, use **"Deploy"** / run manual, ou rode localmente:
```
DATABASE_URL=<público> python atualizar_mensal.py --force
```

## Monitorar
- Logs do serviço `cnpj-etl-mensal` no Railway mostram cada etapa + a verificação final.
- A tabela `public.etl_import_state` guarda o último mês importado (`SELECT * FROM public.etl_import_state`).
