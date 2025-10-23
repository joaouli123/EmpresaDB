# 🔧 Instruções de Migração do Banco de Dados

## Por que preciso fazer isso?

Seu banco de dados atual tem restrições (foreign keys) que estão impedindo a importação porque alguns códigos da Receita Federal não existem mais (como o código 36 de qualificação).

## Como resolver

### Opção 1: Via Interface do PostgreSQL

1. Abra o **pgAdmin** ou qualquer cliente PostgreSQL
2. Conecte no banco `cnpj_db` no servidor `72.61.217.143`
3. Abra uma nova janela de Query
4. Copie e cole todo o conteúdo do arquivo `MIGRAR_BANCO.sql`
5. Execute (F5 ou botão de executar)

### Opção 2: Via Linha de Comando (Windows PowerShell)

```powershell
# Navegue até a pasta do projeto
cd C:\caminho\para\windows

# Execute o script
psql -h 72.61.217.143 -p 5432 -U usuario -d cnpj_db -f MIGRAR_BANCO.sql
```

## Depois da migração

1. Clique em **▶️ Iniciar ETL** novamente
2. O sistema vai:
   - ✅ Pular tabelas auxiliares (já importadas)
   - ✅ Importar empresas (agora sem erro!)
   - ✅ Importar sócios
   - ⚠️ Arquivos de estabelecimentos corrompidos continuarão sendo pulados

## Dados que serão importados

- **Empresas**: Todas, com códigos inválidos convertidos para vazio
- **Sócios**: Todos os sócios das empresas importadas
- **Estabelecimentos**: Apenas os que tiverem arquivos ZIP válidos

## Seus dados estão seguros?

✅ **SIM!** Este script apenas:
- Remove restrições que impedem a importação
- Limpa códigos inválidos (converte para NULL)
- **NÃO apaga nenhuma tabela ou dado importante**
