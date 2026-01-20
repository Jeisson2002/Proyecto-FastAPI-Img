from fastapi import APIRouter
from fastapi.routing import APIRoute
from app.main import app

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/endpoints")
def list_endpoints():
    endpoints = []
    for route in app.routes:
        if isinstance(route, APIRoute):
            endpoints.append({
                "path": route.path,
                "methods": list(route.methods),
                "name": route.name
            })
    return endpoints
