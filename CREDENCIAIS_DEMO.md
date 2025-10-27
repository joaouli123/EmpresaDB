# 🔐 Credenciais de Demonstração

## Sistema CNPJ - Login

### Usuários Disponíveis

#### 1. Usuário Demo
- **Usuário:** `usuario_demo`
- **E-mail:** `usuario.demo@sistema.com`
- **Senha:** `demo123`
- **Tipo:** Usuário comum

#### 2. Demo
- **Usuário:** `demo`
- **E-mail:** `demo@example.com`
- **Senha:** `demo123`
- **Tipo:** Usuário comum

#### 3. Administrador
- **Usuário:** `admin_jl`
- **E-mail:** `jl.uli1996@gmail.com`
- **Senha:** `admin123`
- **Tipo:** Administrador

---

## ✅ Login Corrigido

O problema do login foi **resolvido**:

### O que estava errado:
1. ❌ Senha incorreta armazenada no banco de dados
2. ❌ Frontend não conseguia comunicar com o backend (URL incorreta)

### O que foi corrigido:
1. ✅ Senhas resetadas para valores conhecidos (demo123 / admin123)
2. ✅ Frontend configurado para acessar backend via URL pública do Replit
3. ✅ CORS configurado corretamente no backend

### Como testar:
1. Acesse a tela de login
2. Use qualquer das credenciais acima
3. O login deve funcionar normalmente agora!

---

## 🔧 Configuração Técnica

### Backend
- **URL:** https://d1d3f1ed-5171-4d6c-8a47-087146997886-00-1pj48o1dwa4rv.picard.replit.dev:8000
- **Porta:** 8000
- **Status:** ✅ Rodando

### Frontend
- **URL:** https://d1d3f1ed-5171-4d6c-8a47-087146997886-00-1pj48o1dwa4rv.picard.replit.dev:5000
- **Porta:** 5000
- **Status:** ✅ Rodando

### Banco de Dados
- **Tipo:** PostgreSQL (Externo - VPS)
- **Schema:** `clientes`
- **Tabela de usuários:** `clientes.users`
- **Status:** ✅ Conectado

---

## 📝 Notas Importantes

- As senhas são hasheadas usando Argon2 (seguro)
- Tokens JWT expiram em 24 horas
- CORS está configurado para aceitar todas as origens em desenvolvimento
- Para produção, configure `ALLOWED_ORIGINS` no arquivo `.env`
