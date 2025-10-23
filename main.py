import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

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
