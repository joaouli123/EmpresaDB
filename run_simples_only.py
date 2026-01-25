from pathlib import Path
import logging
from src.etl.importer import CNPJImporter

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

if __name__ == "__main__":
    importer = CNPJImporter()
    csv_path = Path("downloads/F.K03200$W.SIMPLES.CSV.D60110")
    if not csv_path.exists():
        raise FileNotFoundError(csv_path)
    importer.import_simples(csv_path)
