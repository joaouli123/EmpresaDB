# 🔧 Solução para Erro 500 no Login

## 🎯 Causa mais provável

O erro 500 no `/auth/login` acontece porque **a tabela `clientes.users` não existe** no banco de dados do Railway.

**⚠️ IMPORTANTE:** Seu banco JÁ TEM as 50 milhões de empresas! Vamos criar APENAS as tabelas de usuários.

---

## ✅ SOLUÇÃO RÁPIDA

### 1️⃣ Criar tabelas de usuários (SEM TOCAR nas empresas!)

No Railway, vá em **Deployments** → **Seu deployment ativo** → Abra o **Terminal** e execute:

```bash
python init_users_only.py
```

Isso vai criar **APENAS**:
- ✅ Schema `clientes` (separado dos dados de empresas)
- ✅ Tabela `clientes.users` (para login)
- ✅ Tabela `clientes.api_keys` (para API keys)
- ✅ Tabela `clientes.subscriptions` (para assinaturas)

**NÃO VAI TOCAR** nas tabelas de empresas (estabelecimentos, socios, etc.)

---

### 2️⃣ Criar usuário admin

Depois de inicializar o banco, crie um usuário admin:

```bash
python reset_admin_password.py
```

Isso vai criar:
- 👤 Usuário: `admin`
- 🔑 Senha: `Admin@2025`

---

### 3️⃣ Adicionar variável Resend

Não esqueça de adicionar no Railway **Variables**:

```
RESEND_API_KEY=re_D32wEzij_M28UunKZQh6aCF4Si15NAeb4
```

---

## 🔍 Verificar se está tudo OK

Para confirmar que o banco está configurado:

```bash
python check_database.py
```

Deve mostrar:
```
✅ Schema 'clientes' existe
✅ Tabela 'clientes.users' existe
✅ Encontrados X usuários na tabela
```

---

## 📋 Checklist completo

- [ ] Executar `python src/database/init_db.py` no Railway
- [ ] Executar `python reset_admin_password.py` no Railway
- [ ] Adicionar `RESEND_API_KEY` nas variáveis do Railway
- [ ] Testar login com admin / Admin@2025
- [ ] Verificar que não há mais erro 500

---

## 🚨 Ainda com erro?

Se ainda aparecer erro 500, veja os logs no Railway:

1. **Deployments** → deployment ativo → **View Logs**
2. Procure por mensagens de erro como:
   - `relation "clientes.users" does not exist`
   - `password authentication failed`
   - `database "xxx" does not exist`

Me envie os logs e eu ajudo! 🔍
