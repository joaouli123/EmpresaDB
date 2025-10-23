# 🚀 Como Executar o Script SQL no VPS da Hostinger (Docker)

## 📋 Passo a Passo Simples

### **OPÇÃO 1: Executar Direto via SSH (Mais Rápido)**

#### **Passo 1:** Copie o arquivo SQL para o VPS

No seu **PowerShell do Windows**:

```powershell
# Navegue até a pasta do projeto
cd "C:\caminho\para\sua\pasta\windows"

# Copie o arquivo para o VPS
scp MIGRAR_BANCO.sql root@72.61.217.143:/root/
```

*(Digite a senha do VPS quando pedir)*

---

#### **Passo 2:** Conecte no VPS via SSH

```powershell
ssh root@72.61.217.143
```

*(Digite a senha)*

---

#### **Passo 3:** Execute o script no PostgreSQL do Docker

Agora que você está **dentro do VPS**, execute:

```bash
# Opção A: Se seu container se chama "postgres" ou "postgresql"
docker exec -i postgres psql -U novo_usuario -d cnpj_db < /root/MIGRAR_BANCO.sql

# Opção B: Se não souber o nome do container, primeiro descubra:
docker ps

# Vai mostrar algo assim:
# CONTAINER ID   IMAGE         NAMES
# abc123def456   postgres:16   meu_postgres

# Então use o nome correto:
docker exec -i meu_postgres psql -U novo_usuario -d cnpj_db < /root/MIGRAR_BANCO.sql
```

---

#### **Passo 4:** Verifique se funcionou

```bash
# Deve mostrar: "Migração concluída com sucesso!"
# Se mostrou, está PRONTO! ✅
```

---

### **OPÇÃO 2: Copiar e Colar o Conteúdo (Alternativa)**

Se preferir copiar/colar:

#### **Passo 1:** Conecte no VPS

```powershell
ssh root@72.61.217.143
```

---

#### **Passo 2:** Entre no PostgreSQL interativo

```bash
# Descubra o nome do container
docker ps

# Entre no PostgreSQL
docker exec -it nome_do_container psql -U novo_usuario -d cnpj_db
```

---

#### **Passo 3:** Cole o conteúdo do arquivo `MIGRAR_BANCO.sql`

1. Abra o arquivo `MIGRAR_BANCO.sql` no seu Windows
2. Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no terminal SSH (botão direito ou Ctrl+Shift+V)
4. Pressione Enter

---

#### **Passo 4:** Saia do PostgreSQL

```sql
\q
```

---

## 🔍 Como Descobrir o Nome do Container PostgreSQL?

No VPS, execute:

```bash
docker ps
```

Vai mostrar algo assim:

```
CONTAINER ID   IMAGE           NAMES
abc123def456   postgres:16     postgres_container
def789ghi012   nginx:latest    nginx_web
```

O que você precisa é o valor da coluna **NAMES** da linha que tem **postgres** na coluna **IMAGE**.

No exemplo acima seria: `postgres_container`

---

## 🆘 Problemas Comuns

### ❌ "Permission denied" ao copiar arquivo

**Solução:** Use `sudo` antes do comando:

```bash
sudo docker exec -i postgres psql -U novo_usuario -d cnpj_db < /root/MIGRAR_BANCO.sql
```

---

### ❌ "No such container"

**Solução:** Verifique o nome correto do container:

```bash
docker ps | grep postgres
```

---

### ❌ "FATAL: password authentication failed"

**Solução:** Verifique se o usuário está correto. Pode ser `postgres` ao invés de `novo_usuario`:

```bash
docker exec -i postgres psql -U postgres -d cnpj_db < /root/MIGRAR_BANCO.sql
```

---

## ✅ Resumo Ultra Rápido (TL;DR)

```bash
# 1. No Windows - Copie o arquivo
scp MIGRAR_BANCO.sql root@72.61.217.143:/root/

# 2. No Windows - Entre no VPS
ssh root@72.61.217.143

# 3. No VPS - Execute o script
docker exec -i $(docker ps | grep postgres | awk '{print $1}') psql -U novo_usuario -d cnpj_db < /root/MIGRAR_BANCO.sql

# 4. Pronto! ✅
```

---

## 🎯 Depois de Executar

1. Volte para o seu sistema ETL no Windows
2. Clique em **▶️ Iniciar ETL**
3. Agora vai funcionar! 🎉

---

💡 **Dica:** Se tiver dúvida sobre qual comando usar, me manda um print do `docker ps` que te ajudo!
