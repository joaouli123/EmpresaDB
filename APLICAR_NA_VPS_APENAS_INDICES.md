# 🚀 OTIMIZAÇÃO ÚNICA E CRÍTICA - ÍNDICES NA VPS

## ⚠️ IMPORTANTE
- **NÃO mexer no código Python** - já está otimizado!
- **Aplicar APENAS na VPS** - índices do PostgreSQL
- **100% seguro** - não bloqueia o sistema

---

## 📊 PROBLEMA ATUAL

Seu PostgreSQL na VPS **não tem índices adequados** para 50M+ empresas.

**Resultado:**
- Buscas ILIKE (`WHERE razao_social ILIKE '%empresa%'`) = **10-60 segundos** 😰
- Filtros (UF + Situação) = **5-30 segundos** 😰
- ORDER BY razão social = **ordena milhões de registros toda vez** 😰

---

## ✅ SOLUÇÃO

Criar **apenas 10 índices essenciais** na VPS:

### Ganhos Esperados:
| Consulta | Antes | Depois | Ganho |
|----------|-------|--------|-------|
| Busca exata (CNPJ) | 2-5s | 10-50ms | **100x** |
| Filtro UF + Situação | 10-30s | 100-500ms | **50x** |
| Busca ILIKE (razão social) | 20-60s | 1-3s | **20-60x** |

---

## 📝 PASSO A PASSO

### 1. Conectar na VPS via SSH

```bash
ssh root@72.61.217.143
# Digite a senha
```

### 2. Conectar no PostgreSQL

```bash
psql -U cnpj_user -d cnpj_db -h localhost

# OU se estiver no Docker:
docker exec -it <nome_container_postgres> psql -U cnpj_user -d cnpj_db
```

### 3. Copiar e Colar o Script SQL

Copie **TODO O CONTEÚDO** de `src/database/performance_indexes_realistic.sql` e cole no terminal psql.

**⏱️ Tempo estimado:** 2-4 horas  
**⚠️ Sistema continua funcionando durante a criação!** (CREATE INDEX CONCURRENTLY)

### 4. Aguardar Conclusão

Você verá mensagens como:
```
CREATE INDEX
CREATE INDEX
CREATE INDEX
...
ANALYZE
```

### 5. Verificar que Funcionou

```sql
-- Ver índices criados
\di

-- Ver tamanho dos índices
SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as tamanho
FROM pg_indexes
WHERE tablename = 'estabelecimentos'
ORDER BY pg_relation_size(indexname::regclass) DESC;
```

### 6. Testar Performance

Após criar os índices, teste uma busca:

```sql
EXPLAIN ANALYZE
SELECT * FROM estabelecimentos
WHERE uf = 'SP' AND situacao_cadastral = '02'
LIMIT 20;
```

Procure por:
- ✅ "Index Scan" ou "Bitmap Index Scan" = BOM! (usa índice)
- ❌ "Seq Scan" = RUIM (não usa índice)

---

## 🎯 O QUE ESSES ÍNDICES FAZEM

1. **idx_estabelecimentos_cnpj_completo** - Busca por CNPJ (mais comum)
2. **idx_estabelecimentos_uf** - Filtro por estado  
3. **idx_estabelecimentos_situacao** - Filtro por situação
4. **idx_estabelecimentos_uf_situacao** - Combinação UF + Situação (muito comum)
5. **idx_estabelecimentos_razao_social_btree** - **CRÍTICO!** ORDER BY razão social
6. **idx_estabelecimentos_razao_social_trgm** - Busca ILIKE em razão social
7. **idx_estabelecimentos_nome_fantasia_trgm** - Busca ILIKE em nome fantasia
8. **idx_estabelecimentos_cnpj_basico** - JOINs com empresas
9. **idx_socios_cnpj_basico** - Busca de sócios
10. **idx_socios_cpf_cnpj** - Busca por CPF/CNPJ do sócio

---

## ⚠️ CUIDADOS

1. **Espaço em disco**: Índices ocupam ~20-40GB
2. **Tempo**: Criação demora 2-4 horas (mas não trava sistema!)
3. **Horário**: Preferível fazer de madrugada (menos usuários)

---

## ❓ DÚVIDAS COMUNS

**P: O sistema vai ficar fora do ar?**  
R: NÃO! CREATE INDEX CONCURRENTLY não bloqueia.

**P: E se der erro?**  
R: Apenas esse índice não é criado. Sistema continua funcionando.

**P: Posso cancelar no meio?**  
R: Sim (Ctrl+C), mas perde o progresso do índice atual.

**P: Preciso fazer backup?**  
R: Recomendado, mas índices não alteram dados (só aceleram).

---

## ✅ CHECKLIST

- [ ] Conectei na VPS
- [ ] Conectei no PostgreSQL
- [ ] Colei o script `performance_indexes_realistic.sql`
- [ ] Aguardei conclusão (2-4h)
- [ ] Verifiquei com `\di`
- [ ] Testei performance

---

## 🎉 RESULTADO ESPERADO

Após aplicar:
- ✅ Buscas 20-100x mais rápidas
- ✅ Filtros combinados muito mais rápidos
- ✅ ORDER BY não ordena milhões de registros
- ✅ Sistema continua funcionando normalmente

**Total: ~20-40GB de índices, 2-4h de criação, 20-100x mais rápido!**

---

## 🚫 NÃO FAZER

- ❌ NÃO mexer no código Python (já está otimizado!)
- ❌ NÃO instalar Redis (não vai ajudar muito)
- ❌ NÃO aplicar `connection_optimized.py` (arriscado)
- ❌ NÃO criar view materializada (ocuparia muito espaço)

**Apenas: criar índices na VPS. Simples e efetivo! 🚀**
