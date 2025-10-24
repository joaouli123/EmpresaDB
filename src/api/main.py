from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from src.api.routes import router
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

app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="""
    API completa para consulta de dados públicos de CNPJ da Receita Federal.

    ## Funcionalidades

    * **Consulta por CNPJ** - Busca detalhada por CNPJ completo (14 dígitos)
    * **Busca Avançada** - Filtros por razão social, nome fantasia, UF, município, CNAE, etc.
    * **Sócios** - Lista de sócios de uma empresa
    * **CNAEs** - Listagem de atividades econômicas
    * **Municípios** - Municípios por UF
    * **Estatísticas** - Totais de registros no banco

    ## Como usar

    Todos os endpoints retornam JSON. Use os parâmetros de query para filtrar resultados.

    ### Exemplos:

    * `GET /cnpj/00000000000191` - Consulta CNPJ específico
    * `GET /search?uf=SP&situacao_cadastral=02` - Empresas ativas em SP
    * `GET /search?razao_social=PETROBRAS` - Busca por nome
    * `GET /cnpj/00000000000191/socios` - Sócios da empresa

    """
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
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

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(subscription_router)
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.api.main:app",
        host=settings.API_HOST,
        port=8000,
        reload=True
    )
