#!/bin/sh
# Script que intenta conectar a la DB antes de levantar uvicorn (reintentos)
set -e

# esperar a que DATABASE_URL sea válida
python - <<'PY'
import os, asyncio
from urllib.parse import urlparse
import asyncpg

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("No se encontró DATABASE_URL")
    raise SystemExit(1)

# obtener host y port
u = urlparse(DATABASE_URL)
host = u.hostname or "db"
port = u.port or 5432
user = u.username
password = u.password
database = u.path.lstrip('/') if u.path else ""

async def wait_for_db():
    for i in range(30):
        try:
            conn = await asyncpg.connect(user=user, password=password, database=database, host=host, port=port)
            await conn.close()
            print("DB disponible")
            return
        except Exception as e:
            print(f"DB no lista, intento {i+1}/30: {e}")
            await asyncio.sleep(1)
    raise SystemExit("No se pudo conectar a la DB después de reintentos")

asyncio.get_event_loop().run_until_complete(wait_for_db())
PY

# lanzar uvicorn
uvicorn app.main:app --host ${APP_HOST:-0.0.0.0} --port ${APP_PORT:-8000} --workers 1