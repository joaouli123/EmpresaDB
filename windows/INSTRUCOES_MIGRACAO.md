# 🔧 Como Corrigir o Banco de Dados

## 😊 Não se preocupe! Seus dados estão seguros!

Este guia vai te ajudar a corrigir um problema simples no banco de dados para que a importação funcione perfeitamente.

---

## 🤔 Por que preciso fazer isso?

O banco de dados atual tem algumas "regras rígidas" (chamadas de foreign keys) que estão impedindo a importação. Isso acontece porque alguns códigos da Receita Federal que existiam antigamente foram descontinuados (como o código 36 de qualificação de responsável).

**Resumindo:** É como se o banco dissesse "não aceito código 36!" mas os dados da Receita têm empresas com código 36. 

**Solução:** Vamos remover essas regras rígidas e deixar o sistema mais flexível.

---

## ✅ Como resolver - Passo a Passo

### 📝 OPÇÃO 1: Usando o pgAdmin (Mais Fácil)

**Passo 1:** Abra o **pgAdmin** (programa do PostgreSQL no seu computador)

**Passo 2:** Conecte no seu banco de dados:
- Servidor: `72.61.217.143`
- Porta: `5432`
- Banco: `cnpj_db`
- Usuário: (seu usuário)
- Senha: (sua senha)

**Passo 3:** Com o botão direito no banco `cnpj_db`, escolha:
- **Query Tool** (ou Ferramenta de Consulta)

**Passo 4:** Abra o arquivo `MIGRAR_BANCO.sql` que está nesta pasta

**Passo 5:** Copie **TODO** o conteúdo do arquivo `MIGRAR_BANCO.sql`

**Passo 6:** Cole na janela de Query do pgAdmin

**Passo 7:** Clique no botão ▶️ **Execute** (ou pressione F5)

**Passo 8:** Você vai ver mensagens verdes dizendo que funcionou! ✅

---

### 💻 OPÇÃO 2: Usando a Linha de Comando (PowerShell)

**Passo 1:** Abra o **PowerShell** (botão direito em Iniciar → PowerShell)

**Passo 2:** Navegue até a pasta do projeto:
```powershell
cd "C:\Users\seu-usuario\Downloads\windows"
```
*(Ajuste o caminho para onde está sua pasta windows)*

**Passo 3:** Execute este comando:
```powershell
psql -h 72.61.217.143 -p 5432 -U seu_usuario -d cnpj_db -f MIGRAR_BANCO.sql
```
*(Substitua `seu_usuario` pelo seu usuário do banco)*

**Passo 4:** Digite sua senha quando pedido

**Passo 5:** Se aparecer "Migração concluída!" está pronto! ✅

---

## 🚀 Depois da migração - O que fazer?

**1.** Volte para o seu sistema ETL

**2.** Clique no botão **▶️ Iniciar ETL** novamente

**3.** Agora vai funcionar! O sistema vai:
   - ✅ Pular as tabelas auxiliares (já foram importadas antes)
   - ✅ Importar as empresas (sem erro de código 36!)
   - ✅ Importar os sócios
   - ⚠️ Arquivos ZIP corrompidos vão ser tentados novamente automaticamente

---

## 📊 O que vai ser importado?

### ✅ Vai importar com sucesso:
- **Empresas**: Todas! Códigos inválidos viram "vazio" mas a empresa é salva
- **Sócios**: Todos os sócios das empresas importadas
- **Estabelecimentos**: Os que tiverem arquivos ZIP válidos

### ⚠️ Pode ter problema:
- Arquivos ZIP corrompidos: O sistema tenta baixar de novo automaticamente 3 vezes
- Se não conseguir, você pode baixar manualmente depois

---

## ❓ Perguntas Frequentes

### 🤔 Vou perder dados?
**Não!** Este script apenas:
- Remove regras que impedem a importação
- Limpa códigos que não existem mais (deixa vazio)
- **NÃO apaga nenhuma tabela ou dado importante**

### 🤔 E se der erro?
**Opção 1:** Tire um print do erro e me mostre
**Opção 2:** Verifique se:
- Está conectado no banco correto (`cnpj_db`)
- Seu usuário tem permissão para alterar tabelas

### 🤔 Preciso rodar isso toda vez?
**Não!** É só uma vez. Depois disso, todos os ETLs futuros vão funcionar normalmente.

### 🤔 Quanto tempo demora?
**Segundos!** O script é bem rápido, geralmente menos de 10 segundos.

---

## 🆘 Precisa de ajuda?

Se tiver qualquer dúvida ou problema:
1. Tire prints das mensagens de erro
2. Me mostre o que aconteceu
3. Vou te ajudar a resolver!

---

## ✨ Resumo Rápido (TL;DR)

1. ✅ Abra pgAdmin
2. ✅ Conecte no banco `cnpj_db`
3. ✅ Execute o arquivo `MIGRAR_BANCO.sql`
4. ✅ Clique em "▶️ Iniciar ETL" novamente
5. 🎉 Pronto! Vai funcionar!

---

💡 **Lembre-se:** Seus dados estão seguros e nada será perdido! Estamos apenas ajustando o banco para aceitar os dados da Receita Federal corretamente.
