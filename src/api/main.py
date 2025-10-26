from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from src.api.routes import router as api_router
from src.api.auth import router as auth_router
from src.api.user_routes import router as user_router
from src.api.subscription_routes import router as subscription_router
from src.config import settings
import logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# ⚠️ VALIDAÇÃO DE CONFIGURAÇÃO CRÍTICA NO STARTUP
# Garante que SECRET_KEY, DATABASE_URL estão configurados
try:
    settings.validate_config()
except ValueError as e:
    logging.error(f"❌ ERRO DE CONFIGURAÇÃO: {e}")
    logging.error("Configure as variáveis obrigatórias no arquivo .env")
    raise

app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="""
    API completa para consulta de dados públicos de CNPJ da Receita Federal.

    ## 🔑 Autenticação

    **Todas as requisições requerem API Key no header `X-API-Key`**

    Para obter sua API Key:
    1. Registre-se em /auth/register
    2. Acesse o dashboard web
    3. Gere sua chave em "Chaves de API"

    ## Funcionalidades

    * **Consulta por CNPJ** - Busca detalhada por CNPJ completo (14 dígitos)
    * **Busca Avançada** - Filtros por razão social, nome fantasia, UF, município, CNAE, etc.
    * **Sócios** - Lista de sócios de uma empresa
    * **CNAEs** - Listagem de atividades econômicas
    * **Municípios** - Municípios por UF
    * **Estatísticas** - Totais de registros no banco

    ## Como usar

    Todos os endpoints retornam JSON. Inclua o header `X-API-Key` em todas as requisições.

    ### Exemplos:

    * `GET /cnpj/00000000000191` - Consulta CNPJ específico
    * `GET /search?uf=SP&situacao_cadastral=02` - Empresas ativas em SP
    * `GET /search?razao_social=PETROBRAS` - Busca por nome
    * `GET /cnpj/00000000000191/socios` - Sócios da empresa

    """
)

# ⚠️ SEGURANÇA: Configure ALLOWED_ORIGINS no .env para produção!
# Exemplo: ALLOWED_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com
cors_origins = settings.get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=cors_origins != ["*"],  # Só permite credentials se não for wildcard
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

static_path = Path(__file__).parent.parent.parent / "static"
if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

@app.get("/")
async def root():
    return {
        "message": "API de Consulta CNPJ",
        "version": settings.API_VERSION,
        "docs": "/docs"
    }

app.include_router(api_router)
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(subscription_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.api.main:app",
        host=settings.API_HOST,
        port=8000,
        reload=True
    )