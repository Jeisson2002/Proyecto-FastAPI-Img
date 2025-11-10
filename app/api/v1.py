# app/api/v1.py
from fastapi import APIRouter
from app import main  # importa los endpoints de imagen si los deseas usar aquí también

router = APIRouter()

@router.get("/status")
def status():
    return {"status": "ok", "message": "API funcionando correctamente"}

# Aquí podrías incluir tus rutas CRUD y de imágenes si prefieres agruparlas
