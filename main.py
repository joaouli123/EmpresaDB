
import sys
from pathlib import Path

# Adiciona o diretório raiz ao Python path
root_dir = Path(__file__).parent
sys.path.insert(0, str(root_dir))

if __name__ == "__main__":
    import uvicorn
    from src.config import settings
    
    uvicorn.run(
        "src.api.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
        log_level="info"
    )
