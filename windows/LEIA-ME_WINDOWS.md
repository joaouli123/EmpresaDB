# 🪟 Sistema CNPJ - Versão para Windows

Versão otimizada para rodar no Windows com **24GB RAM** e **2TB SSD**.

## 📋 Pré-requisitos

### 1. Python
- Baixe em: https://www.python.org/downloads/
- Versão recomendada: Python 3.10 ou superior
- ⚠️ **IMPORTANTE**: Marque a opção **"Add Python to PATH"** durante a instalação!

### 2. PostgreSQL (opcional)
Se quiser rodar o banco localmente:
- Baixe em: https://www.postgresql.org/download/windows/
- Ou use o banco remoto: `72.61.217.143:5432`

## 🚀 Instalação Rápida

### Passo 1: Instalar Dependências
Clique duas vezes em:
```
instalar.bat
```

Isso vai:
- ✅ Verificar se Python está instalado
- ✅ Instalar todas as bibliotecas necessárias
- ✅ Criar pastas necessárias (downloads, data, logs)

### Passo 2: Configurar Banco de Dados
1. Copie o arquivo `.env.exemplo` e renomeie para `.env`
2. Edite o arquivo `.env` e configure:
```
DATABASE_URL=postgresql://usuario:senha@72.61.217.143:5432/cnpj_db
```

**Exemplo:**
```
DATABASE_URL=postgresql://postgres:minhasenha123@72.61.217.143:5432/cnpj_db
```

## 🎯 Como Usar

### Importar Dados da Receita Federal
Clique duas vezes em:
```
rodar_etl.bat
```

Isso vai:
1. Baixar todos os arquivos da Receita Federal
2. Extrair e importar para o PostgreSQL
3. Otimizado para sua máquina (chunks de 100k, 8 threads)

### Iniciar a API REST
Clique duas vezes em:
```
rodar_api.bat
```

Acesse:
- Dashboard: http://localhost:5000
- API Docs: http://localhost:5000/docs

## ⚙️ Configurações Otimizadas

O sistema foi configurado para aproveitar seus recursos:

| Configuração | Padrão (Replit) | Windows (sua máquina) |
|--------------|-----------------|------------------------|
| RAM disponível | 4-8 GB | **24 GB** 🚀 |
| Chunk size | 50.000 | **100.000** |
| Workers paralelos | 4 | **8** |
| Velocidade | Média | **Muito mais rápido!** |

## 📁 Estrutura

```
windows/
├── downloads/         # Arquivos ZIP baixados da RFB
├── data/             # CSVs extraídos (temporários)
├── logs/             # Logs de execução
├── src/              # Código-fonte
├── .env              # Configurações (VOCÊ CRIA ESTE!)
├── .env.exemplo      # Exemplo de configuração
├── instalar.bat      # Instalador automático
├── rodar_etl.bat     # Executa importação
└── rodar_api.bat     # Inicia API REST
```

## 🐛 Solução de Problemas

### Erro: "pip não é reconhecido"
➡️ Python não foi instalado com PATH. Reinstale marcando "Add Python to PATH"

### Erro: "ModuleNotFoundError"
➡️ Execute novamente `instalar.bat`

### Erro de conexão com banco
➡️ Verifique se o arquivo `.env` está configurado corretamente
➡️ Teste a conexão: `ping 72.61.217.143`

### Processo muito lento
➡️ Você pode aumentar ainda mais o chunk_size editando `src/config.py`:
```python
CHUNK_SIZE = 200000  # Para máquinas muito potentes
```

## 📊 Volumes de Dados

- **Download**: ~5 GB compactado
- **Processamento**: ~20 GB descompactado (temporário)
- **Banco final**: ~30 GB
- **Tempo estimado** (sua máquina): 2-4 horas (vs 8-12h em máquinas normais)

## 💡 Dicas

1. **Feche programas pesados** durante a importação
2. **Mantenha o computador conectado** (não entre em suspensão)
3. **Os CSVs são deletados** após importação (economiza espaço)
4. **Acompanhe o progresso** pelos logs na tela

## 🆘 Suporte

Se tiver problemas:
1. Verifique os logs em `logs/etl_full.log`
2. Consulte a documentação completa no Replit
3. Entre em contato com o desenvolvedor

---

**Versão**: 1.0.0 Windows  
**Otimizada para**: 24GB RAM, 2TB SSD  
**Data**: Outubro 2025
