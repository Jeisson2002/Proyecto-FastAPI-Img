from fastapi import HTTPException
from typing import List


def validate_size_bytes(file_bytes: bytes, max_mb: int = 10):
    """Valida que el tamaño de un archivo no supere el límite permitido en MB."""
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > max_mb:
        raise HTTPException(
            status_code=400,
            detail=f"Archivo excede el límite de {max_mb} MB"
        )


def validate_schema(headers: List[str], required: List[str]):
    """
    Valida que las columnas requeridas estén presentes en los headers.

    Los nombres deben venir normalizados:
    - minúsculas
    - espacios reemplazados por "_"
    """
    missing = [r for r in required if r not in headers]

    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Faltan columnas requeridas: {missing}"
        )

    return True
