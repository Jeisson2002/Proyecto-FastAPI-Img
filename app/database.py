# database.py
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError
import os

# =============================
# 🔌 Conexión a PostgreSQL
# =============================

# CAMBIA ESTO CON TUS DATOS REALES:
DATABASE_URL = "postgresql://postgres:1234@localhost:5432/mi_fastapi"

# Crear el motor de conexión
engine = create_engine(DATABASE_URL)

# Crear sesión de base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()

# Dependencia para usar en rutas
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =============================
# 🧪 Probar conexión directa
# =============================
def test_connection():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✔️ Conexión a PostgreSQL exitosa")
        return True
    except OperationalError as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        return False
