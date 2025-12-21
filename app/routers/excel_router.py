import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, WebSocket
from sqlalchemy.orm import Session

# Servicios y utilidades
from app.services.excel_loader import insert_rows
from app.database import get_db
from app.services.logger_service import info
from app.services.excel_reader import read_excel, read_sheet
from app.services.excel_validator import validate_size_bytes, validate_schema

router = APIRouter(prefix="/excel", tags=["Excel"])

# ================================
# 📁 Directorios REALMENTE usados
# ================================
BASE_DIR = "files"            # <- carpeta mapeada desde tu máquina
EXCEL_DIR = os.path.join(BASE_DIR, "excel")  # <- archivos del usuario

# Crear carpetas persistentes
os.makedirs(EXCEL_DIR, exist_ok=True)

MAX_SIZE_MB = 10


# ============================================
# 1️⃣ Subir Excel
# ============================================
@router.post("/upload")
async def upload_excel(file: UploadFile = File(...)):

    # validar extensión
    if not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Solo archivos .xlsx permitidos")

    # validar tamaño
    content = await file.read()
    validate_size_bytes(content, max_mb=MAX_SIZE_MB)

    # guardar archivo físico
    filename = file.filename
    path = os.path.join(EXCEL_DIR, filename)

    with open(path, "wb") as f:
        f.write(content)

    # 🔥 Imprimir dónde quedó guardado
    print("📁 Guardado correctamente en:", os.path.abspath(path))

    # leer workbook
    wb, sheets = read_excel(path)
    info(f"Archivo {filename} subido. Hojas detectadas: {sheets}")

    return {"message": "Archivo cargado correctamente", "sheets": sheets, "path": path}


# ============================================
# 2️⃣ Listar hojas del Excel
# ============================================
@router.get("/sheets")
async def get_sheets(path: str):
    wb, sheets = read_excel(path)
    return {"sheets": sheets}


# ============================================
# 3️⃣ Cargar una hoja a Base de Datos
# ============================================
@router.post("/load-sheet")
async def load_sheet(path: str, sheet: str, db: Session = Depends(get_db)):

    wb, sheets = read_excel(path)
    if sheet not in sheets:
        raise HTTPException(status_code=400, detail="Hoja no encontrada")

    headers, data = read_sheet(wb, sheet)

    # columnas requeridas — AJÚSTALAS según tu tabla
    required = ["columna1", "columna2", "columna3"]
    validate_schema(headers, required)

    # insertar datos en bd
    insert_rows(db, data)

    info(f"Hoja '{sheet}' cargada en BD con {len(data)} filas.")

    return {"message": "Datos cargados en BD", "rows": len(data)}


# ============================================
# 4️⃣ WebSocket de progreso
# ============================================
@router.websocket("/progress")
async def websocket_progress(ws: WebSocket):
    await ws.accept()

    # simulación de progreso — reemplazar por progreso real
    for i in range(1, 101):
        await ws.send_json({"progress": i})

    await ws.close()