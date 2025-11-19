import os
import subprocess
from fastapi import APIRouter, HTTPException

# Servicios
from app.services.logger_service import last_lines
from app.services.container_service import restart_container

router = APIRouter(prefix="/system", tags=["Sistema"])


# ============================================
# 1️⃣ Obtener Logs del sistema
# ============================================
@router.get("/logs")
def get_logs():
    logs = last_lines(50)
    return {"logs": logs}


# ============================================
# 2️⃣ Reiniciar Contenedor Docker
# ============================================
@router.post("/restart")
def restart(container_name: str):
    """
    Reinicia un contenedor Docker desde FastAPI.
    Requiere permisos para ejecutar comandos Docker.
    """
    try:
        restart_container(container_name)
        return {"message": f"Reinicio del contenedor '{container_name}' enviado correctamente"}
    except HTTPException as e:
        # Reenviamos la excepción limpia
        raise e
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Error inesperado: {str(ex)}")
