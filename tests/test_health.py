# tests/test_health.py
from fastapi.testclient import TestClient
from app.api.main import app

client = TestClient(app)

def test_healthcheck():
    """Verifica que el endpoint /health responde correctamente."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == 200
    assert "Servidor operativo" in data["message"]