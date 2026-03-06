from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from src.api.routes import router as api_router
from src.api.auth import router as auth_router
from src.api.user_routes import router as user_router
from src.api.subscription_routes import router as subscription_router
from src.api.stripe_routes import router as stripe_router
from src.api.stripe_webhook import router as stripe_webhook_router
from src.api.email_logs import router as email_logs_router
from src.api.batch_routes import router as batch_router
from src.config import settings
import logging
import os
from pathlib import Path
from sqlalchemy import text

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Silencia logs HTTP de requisições bem-sucedidas (200 OK)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

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

    """,
    docs_url="/api-docs",  # Swagger UI em /api-docs
    redoc_url="/api-redoc"  # ReDoc em /api-redoc
)

# ⚠️ SEGURANÇA: Configure ALLOWED_ORIGINS no .env para produção!
# Exemplo: ALLOWED_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com
cors_origins = settings.get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

static_path = Path(__file__).parent.parent.parent / "static"
if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

# Servir frontend buildado em produção
frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

@app.get("/api")
async def api_root():
    return {
        "message": "API de Consulta CNPJ",
        "version": settings.API_VERSION,
        "docs": "/api-docs"
    }


@app.get("/api/runtime-config")
async def runtime_config():
    return {
        "recaptchaSiteKey": settings.RECAPTCHA_SITE_KEY or ""
    }

@app.get("/health")
async def health_check():
    """Health check para monitoramento do deployment"""
    from src.database.connection import db_manager

    try:
        # Verifica conexão com banco
        engine = db_manager.get_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
            "version": settings.API_VERSION
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

app.include_router(api_router, prefix="/api/v1")
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(subscription_router, prefix="/api/v1")
app.include_router(stripe_router)
app.include_router(stripe_webhook_router)
app.include_router(email_logs_router)
app.include_router(batch_router, prefix="/api/v1")

# ⚠️ IMPORTANTE: Catch-all route DEVE vir DEPOIS de todos os routers
# para não interceptar as rotas de API
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """Serve o frontend React para todas as rotas não-API (SPA routing)"""
    if frontend_dist.exists():
        index_file = frontend_dist / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return {"error": "Frontend not built"}
    
    return {
        "message": "API de Consulta CNPJ",
        "version": settings.API_VERSION,
        "docs": "/api-docs",
        "warning": "Frontend not built. Run 'cd frontend && npm run build'"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))  # Usa porta 5000 em produção
    uvicorn.run(
        "src.api.main:app",
        host=settings.API_HOST,
        port=port,
        reload=True
    )