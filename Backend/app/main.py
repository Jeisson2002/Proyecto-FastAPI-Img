from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Request
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os
import shutil
from datetime import datetime
import uvicorn
from random import randint
from pydantic import BaseModel

app = FastAPI(title="API de Gestión de Imágenes y Excel, Listo para Producción 🚀")

# ==============================
# TEMPLATES
# ==============================
# Como templates está en la RAÍZ del proyecto:
# /
# ├── app/
# ├── templates/
templates = Jinja2Templates(directory="templates")


# ==============================
# CORS
# ==============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# BASE DIR → /app (en Docker) o Backend/ (local)
# ==============================
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
FILES_ROOT = os.path.join(BASE_DIR, "files")
EXCEL_FOLDER = os.path.join(FILES_ROOT, "excel")
STATIC_DIR = os.path.join(BASE_DIR, "static")

# ==============================
# CREAR CARPETAS
# ==============================
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(EXCEL_FOLDER, exist_ok=True)

# ==============================
# STATIC FILES
# ==============================
app.mount("/uploads", StaticFiles(directory=UPLOAD_FOLDER), name="uploads")
app.mount("/files", StaticFiles(directory=FILES_ROOT), name="files")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# ==============================
# HELPERS
# ==============================
def timestamped_filename(original_name: str) -> str:
    safe_name = os.path.basename(original_name)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{timestamp}_{safe_name}"


def allowed_excel(filename: str) -> bool:
    return filename.lower().endswith((".xlsx", ".xls"))


def allowed_image(filename: str) -> bool:
    return filename.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tiff"))


# ==============================
# PÁGINA PRINCIPAL (INDEX)
# ==============================
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


# ==============================
# SUBIR EXCEL (BACK + ANGULAR)
# ==============================
@app.post("/upload-excel")
async def upload_excel(file: UploadFile = File(...)):
    safe_name = os.path.basename(file.filename or "")
    if not allowed_excel(safe_name):
        raise HTTPException(400, "El archivo debe ser .xlsx o .xls")

    filename = timestamped_filename(safe_name)
    path = os.path.join(EXCEL_FOLDER, filename)

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "status": 200,
        "message": "Archivo Excel guardado exitosamente",
        "filename": filename,
        "path": f"/files/excel/{filename}"
    }


@app.post("/uploadfile/")
async def upload_file(
    file: UploadFile = File(...),
    sheet: str = Form(...)
):
    safe_name = os.path.basename(file.filename or "")
    if not allowed_excel(safe_name):
        raise HTTPException(400, "El archivo debe ser .xlsx o .xls")

    filename = timestamped_filename(safe_name)
    path = os.path.join(EXCEL_FOLDER, filename)

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "status": 200,
        "message": "Archivo recibido correctamente",
        "filename": filename,
        "sheet": sheet,
        "path": f"/files/excel/{filename}"
    }


# ==============================
# SUBIR IMAGEN
# ==============================
@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    safe_name = os.path.basename(file.filename or "")
    is_image = (file.content_type and file.content_type.startswith("image/")) or allowed_image(safe_name)

    if not is_image:
        raise HTTPException(400, "Solo imágenes (JPG, PNG, etc).")

    filename = timestamped_filename(safe_name)
    path = os.path.join(UPLOAD_FOLDER, filename)

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "status": 201,
        "message": "Imagen subida exitosamente",
        "data": {
            "filename": filename,
            "url": f"/uploads/{filename}"
        }
    }


# ==============================
# OBTENER IMAGEN
# ==============================
@app.get("/images/{filename}")
async def get_image(filename: str):
    safe_name = os.path.basename(filename)
    path = os.path.join(UPLOAD_FOLDER, safe_name)

    if not os.path.exists(path):
        raise HTTPException(404, "Imagen no encontrada")

    return FileResponse(path)


# ==============================
# ELIMINAR IMAGEN
# ==============================
@app.delete("/images/{filename}")
async def delete_image(filename: str):
    safe_name = os.path.basename(filename)
    path = os.path.join(UPLOAD_FOLDER, safe_name)

    if not os.path.exists(path):
        raise HTTPException(404, "Imagen no encontrada")

    os.remove(path)
    return {"message": f"Imagen '{safe_name}' eliminada correctamente"}


# ==============================
# ELIMINAR EXCEL
# ==============================
@app.delete("/excel/{filename}")
async def delete_excel(filename: str):
    safe_name = os.path.basename(filename)
    path = os.path.join(EXCEL_FOLDER, safe_name)

    if not os.path.exists(path):
        raise HTTPException(404, "Archivo Excel no encontrado")

    os.remove(path)

    return {"status": 200, "message": f"Excel '{safe_name}' eliminado correctamente"}


# ==============================
# GALERÍA (HTML)
# ==============================
@app.get("/images/", response_class=HTMLResponse)
async def list_images():
    files = os.listdir(UPLOAD_FOLDER)
    image_files = [f for f in files if f.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp"))]

    html_images = ""
    for img in image_files:
        html_images += f"""
        <div class="image-card">
            <img src="/uploads/{img}">
            <div class="image-info">{img}</div>
        </div>
        """

    with open("templates/galeria.html", "r", encoding="utf-8") as f:
        template = f.read()

    return template.replace("{{IMAGES}}", html_images)


# ==============================
# MÉTRICAS RANDOM
# ==============================
@app.get("/stats")
def get_stats():
    return {
        "imagenes_subidas": randint(20, 150),
        "usuarios_activos": randint(1, 10),
        "peticiones_hoy": randint(50, 300),
        "uso_storage_mb": randint(100, 900)
    }

# ==============================
# NEXO CHAT (API PARA IA)
# ==============================

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def nexo_chat(req: ChatRequest):
    user_message = req.message.strip()

    if not user_message:
        raise HTTPException(status_code=400, detail="Mensaje vacío")

    # 👉 RESPUESTA TEMPORAL (backend real, IA luego)
    return {
        "reply": f"🤖 NEXO dice: recibí tu mensaje → '{user_message}'"
    }

# ==============================
# EJECUCIÓN DIRECTA
# ==============================
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)