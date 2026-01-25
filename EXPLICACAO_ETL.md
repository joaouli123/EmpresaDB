# 🔧 Como funciona o ETL de Atualização de Dados

## 📋 O que o ETL faz?

O ETL (Extract, Transform, Load) baixa e atualiza os dados das empresas da Receita Federal automaticamente.

---

## 🔄 Fluxo do Processo:

### 1️⃣ **Download** 📥
- Acessa: `https://arquivos.receitafederal.gov.br/dados/cnpj/dados_abertos_cnpj/`
- Detecta a pasta mais recente (ex: `2026-01/`)
- Lista todos os arquivos ZIP disponíveis
- Baixa os arquivos novos

### 2️⃣ **Extração** 📦
- Descompacta os arquivos ZIP
- Extrai os CSVs com os dados

### 3️⃣ **Importação** 📊
- Lê os CSVs em chunks (blocos)
- Insere/atualiza dados no PostgreSQL
- Processa:
  - **Empresas** (64M+ registros)
  - **Estabelecimentos** (47M+ registros)  
  - **Sócios** (26M+ registros)
  - **Tabelas auxiliares** (CNAEs, municípios, etc)

### 4️⃣ **Validação** ✅
- Compara registros CSV vs banco de dados
- Verifica integridade dos dados
- Gera estatísticas finais

---

## 🐛 Problemas Identificados e Corrigidos:

### ❌ Problema 1: Endpoint `/etl/check-updates` não existia
- Frontend chamava mas backend não tinha o endpoint
- **Solução:** ✅ Criado endpoint que lista arquivos disponíveis na Receita Federal

### ❌ Problema 2: WebSocket com caminho errado
- Frontend: `/ws/etl` 
- Backend esperava: `/api/v1/ws/etl`
- **Solução:** ✅ Ajustado caminho do WebSocket no frontend

### ❌ Problema 3: Logs não apareciam
- WebSocket não reconectava após desconexão
- **Solução:** ✅ Adicionado reconexão automática a cada 5s

---

## 🚀 Como Usar (após o deploy):

1. **Fazer Login** como admin (admin_jl)

2. **Verificar Atualizações:**
   - Clique em **"Verificar Atualizações"**
   - Sistema mostra quantos arquivos novos existem na Receita Federal

3. **Iniciar ETL:**
   - Clique em **"Iniciar ETL"**
   - Acompanhe o progresso em tempo real:
     - Status: Rodando/Parado
     - Progresso: 0-100%
     - Tempo decorrido
     - Registros processados

4. **Parar ETL** (se necessário):
   - Clique em **"Parar ETL"**
   - Processo para gracefully

---

## ⚙️ Configurações Técnicas:

### Variáveis importantes:
```python
CHUNK_SIZE = 50000  # Processa 50k linhas por vez
MAX_WORKERS = 4     # 4 threads paralelas
DOWNLOAD_DIR = ./downloads
```

### Requisitos:
- ✅ PostgreSQL com 100GB+ espaço livre
- ✅ Conexão estável com internet
- ✅ 4GB+ RAM
- ✅ Permissão de escrita em `./downloads`

---

## 📊 Estatísticas do Banco Atual:

```
✅ Empresas: 64,888,615 registros
✅ Estabelecimentos: 47,882,051 registros  
✅ Sócios: 26,510,557 registros
✅ CNAEs: 1,359 categorias
```

---

## 🔍 Monitoramento:

### Logs em Tempo Real:
- Verde: ✅ Sucesso
- Amarelo: ⚠️ Aviso
- Vermelho: ❌ Erro
- Azul: ℹ️ Info

### WebSocket:
```javascript
// Conecta automaticamente ao carregar o painel admin
wss://seu-dominio.com/api/v1/ws/etl

// Mensagens recebidas:
{
  "type": "stats_update",
  "stats": {
    "status": "running",
    "progress": 45,
    "processed_records": 1234567
  }
}
```

---

## 🛠️ Troubleshooting:

### Erro: "WebSocket não conecta"
- Verifique se está usando `wss://` em produção (HTTPS)
- Verifique se a rota `/api/v1/ws/etl` está correta

### Erro: "Nenhum arquivo encontrado"
- A Receita Federal pode estar com o site fora do ar
- Verifique se a URL está correta

### ETL trava no meio:
- Pode ser falta de memória
- Reduza `CHUNK_SIZE` para 10000
- Reduza `MAX_WORKERS` para 2

### Banco fica lento:
- Normal durante importação (milhões de INSERTs)
- ETL usa transações em lote para otimizar
- Após concluir, cria índices automáticos

---

## 🎯 Próximos Passos:

Após o deploy das correções:

1. ✅ Login deve funcionar (já corrigido com argon2-cffi)
2. ✅ WebSocket vai conectar corretamente
3. ✅ "Verificar Atualizações" vai funcionar
4. ✅ "Iniciar ETL" vai processar os dados
5. ✅ Logs vão aparecer em tempo real

**Aguarde o deploy do Railway (~2-3 min) e teste!** 🚀
