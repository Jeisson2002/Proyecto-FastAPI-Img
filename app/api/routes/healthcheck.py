# app/api/routes/healthcheck.py
from fastapi import APIRouter
from app.utils.utils import get_timestamp

router = APIRouter()

@router.get("/health", tags=["Healthcheck"])
def healthcheck():
    """Verifica que el servidor esté funcionando correctamente."""
    return {
        "status": 200,
        "title": "Healthcheck OK",
        "message": f"Servidor operativo - {get_timestamp()}",
    }