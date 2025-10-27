# Frontend - Sistema CNPJ API

## ⚠️ Configuração CRÍTICA para Replit

**Este frontend foi projetado para rodar no Replit com um proxy automático.**

### Configuração Obrigatória

O arquivo `.env` **DEVE** estar assim:

```bash
VITE_API_URL=
```

**❌ NUNCA faça isso no Replit:**
```bash
VITE_API_URL=http://localhost:8000
VITE_API_URL=https://seu-dominio.replit.dev:8000
```

### Por quê?

No Replit, **apenas a porta 5000 é acessível externamente**. A porta 8000 (backend) só é acessível internamente.

O arquivo `vite.config.js` já tem um **proxy configurado** que automaticamente encaminha:
- `/auth/*` → Backend (porta 8000)
- `/api/*` → Backend (porta 8000)
- `/cnpj/*` → Backend (porta 8000)
- `/search` → Backend (porta 8000)
- `/stats` → Backend (porta 8000)
- etc.

### Instalação

```bash
npm install
```

### Desenvolvimento (Replit)

O workflow já está configurado. Se precisar rodar manualmente:

```bash
npm run dev
```

O servidor inicia na porta 5000 e o proxy encaminha automaticamente as requisições ao backend.

### Build para Produção

```bash
npm run build
```

### Estrutura

```
frontend/
├── .env              # Config (DEVE estar vazio no Replit)
├── .env.example      # Exemplo com instruções
├── vite.config.js    # Proxy automático (NÃO MODIFICAR)
├── src/
│   ├── contexts/     # Auth e outros contextos
│   ├── pages/        # Páginas da aplicação
│   ├── services/     # API client (axios)
│   └── components/   # Componentes reutilizáveis
└── package.json
```

### Solução de Problemas

**Login retorna "Network Error":**
1. Verifique se `.env` tem `VITE_API_URL=` (vazio)
2. Reinicie o frontend
3. Limpe o cache do navegador

**Backend não responde:**
1. Verifique se o workflow "Backend API" está rodando
2. Verifique os logs do backend
3. Confirme que o banco de dados está acessível

---

Para mais detalhes, veja `REPLIT_SETUP.md` na raiz do projeto.
