# 🚀 Sistema CNPJ - Versão OTIMIZADA para Windows

## ⚡ Configuração da Sua Máquina
- **RAM**: 24 GB 🔥
- **SSD**: 2 TB 💾
- **Velocidade**: 2-3x MAIS RÁPIDO que a versão padrão!

---

## 📦 O que tem nesta pasta?

Esta é uma **versão completa e otimizada** do sistema para rodar no seu Windows. Tudo já está configurado para aproveitar ao máximo seus 24GB de RAM!

```
windows/
│
├── 📁 src/              → Código-fonte completo
├── 📁 downloads/        → ZIPs baixados (criado automaticamente)
├── 📁 data/            → CSVs temporários (criado automaticamente)
├── 📁 logs/            → Logs de execução (criado automaticamente)
│
├── 🔧 instalar.bat     → [1] CLIQUE AQUI PRIMEIRO!
├── 🚀 rodar_etl.bat    → [2] Importar dados
├── 🌐 rodar_api.bat    → [3] Iniciar API REST
│
├── 📄 .env.exemplo      → Modelo de configuração
└── 📖 LEIA-ME_WINDOWS.md → Guia completo
```

---

## 🎯 Instalação Super Rápida (3 Passos)

### **Passo 1: Instalar** 🔧
Clique duas vezes em:
```
instalar.bat
```
✅ Verifica Python  
✅ Instala todas as bibliotecas  
✅ Cria pastas necessárias  

---

### **Passo 2: Configurar Banco** ⚙️

1. **Copie** `.env.exemplo` → `.env`
2. **Edite** o arquivo `.env` e coloque:

```env
DATABASE_URL=postgresql://usuario:senha@72.61.217.143:5432/cnpj_db
```

**Exemplo real:**
```env
DATABASE_URL=postgresql://postgres:minhasenha123@72.61.217.143:5432/cnpj_db
```

---

### **Passo 3: Importar Dados** 🚀
Clique duas vezes em:
```
rodar_etl.bat
```

O sistema vai:
1. ⬇️ Baixar ~5GB de arquivos da Receita Federal
2. 📦 Extrair e processar os dados
3. 💾 Importar para o PostgreSQL
4. ✅ Validar integridade

**Tempo estimado**: 2-4 horas (vs 8-12h em máquinas normais!)

---

## 🌐 Usando a API

Depois da importação, inicie a API:
```
rodar_api.bat
```

Acesse:
- 🏠 Dashboard: http://localhost:5000
- 📚 Documentação: http://localhost:5000/docs
- 🔍 Buscar empresa: http://localhost:5000/cnpj/00000000000191

---

## ⚙️ Otimizações para Sua Máquina

| Item | Padrão | Sua Máquina |
|------|--------|-------------|
| RAM | 4-8 GB | **24 GB** 🚀 |
| Chunk Size | 50.000 | **100.000** ⚡ |
| Workers | 4 threads | **8 threads** 💪 |
| Velocidade | 1x | **2-3x mais rápido!** |

---

## 📊 Volumes de Dados

- **Download**: ~5 GB (compactado)
- **Processamento**: ~20 GB (temporário)
- **Banco final**: ~30 GB
- **Total de empresas**: ~60 milhões
- **Total de CNPJs**: ~50 milhões

---

## ❗ Problemas Comuns

### "pip não é reconhecido"
**Solução**: Reinstale o Python marcando **"Add Python to PATH"**

### "ModuleNotFoundError: psycopg2"
**Solução**: Execute `instalar.bat` novamente

### "DATABASE_URL não configurada"
**Solução**: Crie o arquivo `.env` conforme o Passo 2

### Conexão com banco falha
**Solução**: 
1. Verifique se o `.env` está correto
2. Teste a conexão: `ping 72.61.217.143`
3. Confirme usuário e senha do PostgreSQL

---

## 💡 Dicas para Melhor Performance

1. ✅ **Feche programas pesados** (Chrome, jogos, etc)
2. ✅ **Não deixe o PC entrar em suspensão**
3. ✅ **Use SSD** (não HDD) - você já tem! 🎉
4. ✅ **Conexão estável** durante o download
5. ✅ **Acompanhe os logs** para ver o progresso

---

## 🎯 Fluxo do Sistema

```
┌─────────────────┐
│  1. DOWNLOAD    │  Baixa TODOS os ZIPs
│  (~5 GB)        │  da Receita Federal
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. EXTRAÇÃO    │  Descompacta 1 por vez
│  + IMPORTAÇÃO   │  Importa direto no banco
│  (arquivo/vez)  │  Apaga CSV (economiza espaço)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. VALIDAÇÃO   │  Verifica integridade
│  + ÍNDICES      │  Otimiza buscas
└─────────────────┘
```

---

## 🆘 Precisa de Ajuda?

1. Leia `LEIA-ME_WINDOWS.md` (documentação completa)
2. Verifique os logs em `logs/etl_full.log`
3. Consulte a API docs: http://localhost:5000/docs

---

## 🎉 Pronto para começar?

```
1. instalar.bat    ← Clique primeiro
2. Configure .env  ← Edite com suas credenciais
3. rodar_etl.bat   ← Importe os dados
4. rodar_api.bat   ← Use a API!
```

**Boa sorte! 🚀**

---

*Versão otimizada para 24GB RAM | Outubro 2025*
