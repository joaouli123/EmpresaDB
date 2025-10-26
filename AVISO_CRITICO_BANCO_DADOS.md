# ⚠️⚠️⚠️ AVISO CRÍTICO - BANCO DE DADOS ⚠️⚠️⚠️

## 🔴 NUNCA USAR BANCO DO REPLIT! 🔴

Este projeto **NÃO USA** o banco de dados do Replit em hipótese alguma!

---

## ✅ CONFIGURAÇÃO CORRETA

### **ÚNICO BANCO USADO:**
- **Host:** 72.61.217.143 (VPS)
- **Porta:** 5432
- **Database:** cnpj_db
- **Usuário:** cnpj_user
- **Senha:** Proelast1608@

### **O que está no banco da VPS:**
1. ✅ **Dados de CNPJ** (empresas, estabelecimentos, sócios, CNAEs, etc.)
2. ✅ **Usuários** (tabela `users`)
3. ✅ **API Keys** (tabela `api_keys`)
4. ✅ **Logs de uso** (tabelas `user_usage`, `security_audit_log`)
5. ✅ **TUDO MESMO!**

---

## ❌ O QUE NUNCA FAZER

### **NUNCA:**
- ❌ Usar o banco PostgreSQL do Replit
- ❌ Criar usuários pelo frontend (pode criar no lugar errado!)
- ❌ Criar API Keys pela interface web
- ❌ Assumir que dados estão localmente no Replit
- ❌ Alterar DATABASE_URL para apontar para localhost
- ❌ Usar variáveis separadas (DB_HOST, DB_PORT, etc.) - SEMPRE usar DATABASE_URL

---

## ✅ COMO CRIAR USUÁRIOS E API KEYS CORRETAMENTE

### **Opção 1: Via Script Python (RECOMENDADO)**

Execute no terminal do Replit:

```bash
cd /home/runner/workspace && python3 << 'PYEOF'
from src.database.connection import db_manager
from passlib.context import CryptContext
import secrets

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

with db_manager.get_connection() as conn:
    cursor = conn.cursor()
    
    # 1. Criar usuário
    username = "novo_usuario"
    email = "usuario@email.com"
    password_hash = pwd_context.hash("SenhaSegura123!")
    
    cursor.execute("""
        INSERT INTO users (username, email, password, role, is_active)
        VALUES (%s, %s, %s, 'user', true)
        RETURNING id, username;
    """, (username, email, password_hash))
    
    user = cursor.fetchone()
    user_id = user[0]
    print(f"✅ Usuário criado: {user[1]} (ID: {user_id})")
    
    # 2. Criar API Key
    api_key = "sk_" + secrets.token_urlsafe(32)
    
    cursor.execute("""
        INSERT INTO api_keys (user_id, name, key, is_active, total_requests)
        VALUES (%s, %s, %s, true, 0)
        RETURNING id, key;
    """, (user_id, 'Minha API Key', api_key))
    
    key_data = cursor.fetchone()
    conn.commit()
    cursor.close()
    
    print(f"\n✅ API KEY: {key_data[1]}")
PYEOF
```

### **Opção 2: Direto no PostgreSQL da VPS**

SSH na VPS e execute:

```bash
# 1. Conectar no PostgreSQL
docker exec -it cnpj_postgres psql -U cnpj_user -d cnpj_db

# 2. Criar usuário (gere o hash da senha antes usando bcrypt/argon2)
INSERT INTO users (username, email, password, role, is_active)
VALUES ('novo_user', 'email@exemplo.com', 'HASH_DA_SENHA', 'user', true);

# 3. Criar API Key
INSERT INTO api_keys (user_id, name, key, is_active, total_requests)
VALUES (1, 'Minha Key', 'sk_GERAR_TOKEN_ALEATORIO_AQUI', true, 0);
```

---

## 🔍 COMO VERIFICAR SE ESTÁ CORRETO

Execute no Replit:

```bash
cd /home/runner/workspace && python3 << 'PYEOF'
from src.config import settings
print(f"✅ DATABASE_URL: {settings.DATABASE_URL[:50]}...")
print(f"✅ Deve conter: 72.61.217.143")

from src.database.connection import db_manager
with db_manager.get_connection() as conn:
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users;")
    count = cursor.fetchone()[0]
    cursor.close()
    print(f"✅ Usuários no banco: {count}")
PYEOF
```

**Saída esperada:**
```
✅ DATABASE_URL: postgresql://cnpj_user:Proelast1608%40@72.61.217.1...
✅ Deve conter: 72.61.217.143
✅ Usuários no banco: 1 (ou mais)
```

---

## 📋 RESUMO

| Item | Correto ✅ | Errado ❌ |
|------|-----------|----------|
| Banco usado | VPS (72.61.217.143) | Replit local |
| Criar usuários | Script Python/SQL direto | Frontend web |
| Criar API Keys | Script Python/SQL direto | Interface web |
| DATABASE_URL | Da VPS via .env | localhost ou separado |
| Dados armazenados | Tudo na VPS | Dividido local/VPS |

---

## 🆘 SE ALGO DEU ERRADO

Se você acidentalmente criou dados no lugar errado:

1. **Verificar onde está:**
   ```bash
   python3 -c "from src.config import settings; print(settings.DATABASE_URL)"
   ```

2. **Se estiver apontando para local:** Corrigir `.env` para:
   ```
   DATABASE_URL=postgresql://cnpj_user:Proelast1608@72.61.217.143:5432/cnpj_db
   ```

3. **Recriar usuários/keys no banco correto** usando scripts acima

---

**LEMBRE-SE: TUDO NA VPS, NADA NO REPLIT! 🎯**
