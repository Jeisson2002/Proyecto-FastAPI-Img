from sqlalchemy.orm import Session
from typing import List, Dict
from app.models import ExcelData   # ← IMPORT CORRECTO

def insert_rows(db: Session, rows: List[Dict]):
    """Inserta filas en la tabla ExcelData. Ajusta el mapeo según tu modelo."""
    for r in rows:
        item = ExcelData(
    columna_1=r.get("columna1"),
    columna_2=r.get("columna2"),
    columna_3=r.get("columna3")
        )
        db.add(item)

    db.commit()
