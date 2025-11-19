from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import shutil
from datetime import datetime

app = FastAPI(title="Proyecto de Imágenes")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------
# Rutas absolutas para asegurar guardado correcto
# ------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Carpeta donde está main.py

EXCEL_FOLDER = os.path.join(BASE_DIR, "files", "excel")
os.makedirs(EXCEL_FOLDER, exist_ok=True)

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Servir imágenes y Excel como archivos estáticos
app.mount("/uploads", StaticFiles(directory=UPLOAD_FOLDER), name="uploads")
app.mount("/files", StaticFiles(directory=os.path.join(BASE_DIR, "files")), name="files")

# ------------------------------------------------------
# ENDPOINT PRINCIPAL
# ------------------------------------------------------
@app.get("/")
def root():
    return {"message": "API de imágenes funcionando 🚀"}

# ------------------------------------------------------
# SUBIR EXCEL
# ------------------------------------------------------
@app.post("/upload-excel")
async def upload_excel(file: UploadFile = File(...)):
    # Validación simple
    if not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="El archivo debe ser .xlsx o .xls")

    # Crear nombre único con timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"

    file_path = os.path.join(EXCEL_FOLDER, filename)

    # Guardar archivo físicamente
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "status": 200,
        "message": "Archivo Excel guardado exitosamente",
        "filename": filename,
        "path": f"/files/excel/{filename}"
    }

# ------------------------------------------------------
# SUBIR IMAGEN
# ------------------------------------------------------
@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Solo imágenes (JPG, PNG, etc).")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"

    file_path = os.path.join(UPLOAD_FOLDER, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "status": 201,
        "message": "Imagen subida exitosamente",
        "data": {
            "filename": filename,
            "url": f"/uploads/{filename}"
        }
    }

# ------------------------------------------------------
# VER IMAGEN
# ------------------------------------------------------
@app.get("/images/{filename}")
async def get_image(filename: str):
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    return FileResponse(file_path)

# ------------------------------------------------------
# ELIMINAR IMAGEN
# ------------------------------------------------------
@app.delete("/images/{filename}")
async def delete_image(filename: str):
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    os.remove(file_path)
    return {"message": f"Imagen '{filename}' eliminada correctamente"}

# ------------------------------------------------------
# GALERÍA HTML
# ------------------------------------------------------
@app.get("/images/", response_class=HTMLResponse)
async def list_images():
    files = os.listdir(UPLOAD_FOLDER)
    image_files = [f for f in files if f.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp"))]

    html = """
    <html>
    <head>
        <title>Galería de Imágenes</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #5b00b7, #8c00ff);
                font-family: 'Poppins', sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
                color: #fff;
            }
            h1 {
                margin-top: 30px;
                font-size: 2.5rem;
                text-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
            }
            .gallery {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                gap: 25px;
                width: 90%;
                max-width: 1400px;
                margin: 40px auto;
            }
            .card {
                background: rgba(255,255,255,0.1);
                border-radius: 16px;
                padding: 15px;
                text-align: center;
                box-shadow: 0 8px 20px rgba(0,0,0,0.35);
                backdrop-filter: blur(10px);
                transition: 0.3s;
            }
            .card:hover {
                transform: translateY(-5px);
            }
            .card img {
                width: 100%;
                height: 200px;
                object-fit: cover;
                border-radius: 12px;
                box-shadow: 0 6px 15px rgba(0,0,0,0.3);
            }
            .btn {
                margin-top: 10px;
                padding: 10px 15px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: bold;
            }
            .view-btn {
                background: #00d4ff;
                color: black;
            }
            .delete-btn {
                background: #ff3b3b;
                color: white;
            }
            .delete-btn:hover {
                background: #cc0000;
            }
            .view-btn:hover {
                background: #00aacc;
            }
        </style>
        <script>
            async function deleteImage(filename) {
                if (!confirm("¿Seguro que deseas eliminar esta imagen?")) return;
                const response = await fetch(`/images/${filename}`, { method: "DELETE" });
                if (response.ok) {
                    alert("Imagen eliminada correctamente");
                    location.reload();
                } else {
                    alert("Error al eliminar la imagen");
                }
            }
        </script>
    </head>
    <body>
        <h1>Galería de Imágenes</h1>
        <div class="gallery">
    """

    for filename in image_files:
        html += f"""
            <div class='card'>
                <img src='/uploads/{filename}' alt='{filename}' />
                <button class='btn view-btn' onclick="window.open('/uploads/{filename}', '_blank')">Ver</button>
                <button class='btn delete-btn' onclick="deleteImage('{filename}')">Eliminar</button>
            </div>
        """

    html += """
        </div>
    </body>
    </html>
    """

    return HTMLResponse(html)