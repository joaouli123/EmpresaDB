import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from src.api.main import app
import uvicorn

if __name__ == "__main__":
    print("="*70)
    print("API REST - Sistema CNPJ")
    print("="*70)
    print("\nServidor iniciado em:")
    print("  -> http://localhost:5000")
    print("  -> http://127.0.0.1:5000")
    print("\nDocumentacao:")
    print("  -> http://localhost:5000/docs")
    print("\nPressione CTRL+C para parar\n")
    print("="*70 + "\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5000,
        log_level="info"
    )
