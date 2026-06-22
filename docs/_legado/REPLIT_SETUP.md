# 🚀 Guia de Configuração para Replit

## ⚠️ IMPORTANTE: Configuração Específica do Replit

Este projeto está **otimizado para rodar no Replit**. Siga estas instruções para garantir que tudo funcione perfeitamente.

---

## 📋 Checklist de Configuração

### 1️⃣ **Configuração do Backend (.env na raiz)**

O arquivo `.env` na raiz do projeto **DEVE** conter:

```bash
# ===== SEGURANÇA - OBRIGATÓRIO =====
SECRET_KEY=sua_chave_secreta_aqui_minimo_32_caracteres

# ===== BANCO DE DADOS EXTERNO VPS =====
DATABASE_URL=postgresql://usuario:senha@host:porta/database

# ===== OUTRAS CONFIGURAÇÕES =====
API_HOST=0.0.0.0
API_PORT=8000
ALLOWED_ORIGINS=*
```

**✅ Como gerar SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

### 2️⃣ **Configuração do Frontend (frontend/.env)**

**⚠️ CRÍTICO NO REPLIT:**

O arquivo `frontend/.env` **DEVE** estar assim:

```bash
# ⚠️ REPLIT: DEIXE VAZIO! O proxy do Vite conecta automaticamente
VITE_API_URL=
```

**❌ NUNCA faça isso:**
```bash
# ERRADO - NÃO USE NO REPLIT:
VITE_API_URL=http://localhost:8000
VITE_API_URL=https://seu-dominio.replit.dev:8000
```

**✅ Por quê deixar vazio?**
- O Vite tem um **proxy configurado** em `vite.config.js`
- Esse proxy automaticamente encaminha requisições `/auth`, `/api`, `/cnpj` etc. para a porta 8000
- No Replit, você **não pode** acessar a porta 8000 diretamente via URL externa
- Apenas a porta 5000 (frontend) é acessível externamente

---

### 3️⃣ **Workflows (já configurados)**

O projeto tem 2 workflows:
- **Backend API**: Roda na porta 8000 (apenas interno)
- **Frontend**: Roda na porta 5000 (acessível externamente)

**Não precisa modificar nada!** Os workflows já estão configurados corretamente.

---

## 🔧 Solução de Problemas Comuns

### Problema: "Login failed" ou "Network Error"

**Causa:** Frontend tentando acessar porta 8000 diretamente

**Solução:**
1. Verifique `frontend/.env` e confirme que `VITE_API_URL=` está **vazio**
2. Reinicie o workflow do Frontend
3. Limpe o cache do navegador (Ctrl + Shift + R)

### Problema: Backend não inicia

**Causa:** `DATABASE_URL` ou `SECRET_KEY` não configurados

**Solução:**
1. Verifique o arquivo `.env` na raiz
2. Confirme que `DATABASE_URL` aponta para seu banco PostgreSQL
3. Confirme que `SECRET_KEY` tem no mínimo 32 caracteres
4. Reinicie o workflow do Backend

### Problema: "CORS error"

**Causa:** CORS mal configurado

**Solução:**
1. No arquivo `.env` da raiz, configure: `ALLOWED_ORIGINS=*`
2. Para produção, liste domínios específicos separados por vírgula

---

## 🎯 Como Usar em Outra Conta Replit

**Passo a passo para importar este projeto:**

1. **Fork ou Clone o repositório** na nova conta Replit

2. **Configure o arquivo `.env` da raiz:**
   ```bash
   cp .env.example .env
   # Edite .env e adicione suas credenciais
   ```

3. **Configure o arquivo `frontend/.env`:**
   ```bash
   cd frontend
   cp .env.example .env
   # Confirme que VITE_API_URL está vazio
   ```

4. **Os workflows iniciarão automaticamente**
   - Backend API (porta 8000)
   - Frontend (porta 5000)

5. **Acesse a aplicação:**
   - Clique no botão "Webview" ou acesse a URL do Replit
   - Você verá o frontend na porta 5000
   - O frontend se conectará automaticamente ao backend

---

## 📚 Estrutura de Arquivos Importantes

```
.
├── .env                          # Config do backend (DATABASE_URL, SECRET_KEY)
├── .env.example                  # Exemplo de configuração do backend
├── frontend/
│   ├── .env                      # Config do frontend (DEVE estar vazio no Replit)
│   ├── .env.example              # Exemplo com instruções
│   └── vite.config.js            # Proxy automático (NÃO MODIFICAR)
├── src/
│   ├── api/                      # Backend FastAPI
│   └── database/                 # Conexão com PostgreSQL
└── REPLIT_SETUP.md               # Este arquivo
```

---

## ✅ Validação Final

Antes de usar o sistema, confirme:

- [ ] Arquivo `.env` na raiz está configurado com DATABASE_URL e SECRET_KEY
- [ ] Arquivo `frontend/.env` tem `VITE_API_URL=` (vazio)
- [ ] Backend API está rodando (porta 8000)
- [ ] Frontend está rodando (porta 5000)
- [ ] Login funcionando no navegador

---

## 🆘 Suporte

Se ainda tiver problemas:
1. Verifique os logs dos workflows (Backend API e Frontend)
2. Confirme que o banco de dados PostgreSQL está acessível
3. Revise este guia do início

**🎉 Tudo pronto! Seu sistema está configurado corretamente para o Replit!**
