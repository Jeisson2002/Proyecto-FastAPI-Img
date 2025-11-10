from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import shutil
from datetime import datetime
from app.api.routes import healthcheck

# ====================================
# CONFIGURACIÓN PRINCIPAL DE LA APP
# ====================================
app = FastAPI(title="Mi FastAPI Proyecto Mejorado")

# ====================================
# CONFIGURACIÓN DE CORS
# ====================================
app.add_middleware(
    CORSMiddleware,
    # ⚠️ En producción usa tus dominios reales
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(healthcheck.router)

# ====================================
# CONFIGURACIÓN DE CARPETA UPLOADS
# ====================================
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Servir archivos estáticos desde /uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_FOLDER), name="uploads")


# ====================================
# FUNCIÓN DE RESPUESTA ESTANDARIZADA
# ====================================
def build_response(status: int, type_: str, title: str, message: str, data=None, error=None):
    return {
        "status": status,
        "type": type_,
        "title": title,
        "message": message,
        "data": data,
        "error": error,
    }


# ====================================
# HEALTHCHECK PARA DOCKER
# ====================================
@app.get("/health")
def health():
    """Endpoint simple para verificar el estado del contenedor."""
    return build_response(
        status=200,
        type_="success",
        title="Healthcheck OK",
        message="El servidor está funcionando correctamente 🚀"
    )


# ====================================
# RUTA PRINCIPAL
# ====================================
@app.get("/")
def root():
    return build_response(
        status=200,
        type_="success",
        title="Inicio del Proyecto",
        message="🚀 Bienvenido a Mi FastAPI Proyecto Mejorado y Actualizados"
    )


# ====================================
# SUBIR UNA IMAGEN
# ====================================
@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    # Validar tipo de archivo
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos de imagen (JPG, PNG, etc).")

    # Validar tamaño máximo (por ejemplo 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen no debe superar los 5MB.")
    await file.seek(0)

    # Crear nombre único (fecha + nombre original)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)

    # Guardar archivo
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return build_response(
        status=201,
        type_="success",
        title="Subida Exitosa",
        message="Imagen subida exitosamente",
        data={
            "nombre": filename,
            "url": f"/uploads/{filename}"
        }
    )


# ====================================
# MOSTRAR IMAGEN POR NOMBRE
# ====================================
@app.get("/images/{filename}")
async def get_image(filename: str):
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Imagen no encontrada.")
    return FileResponse(file_path)


# ====================================
# LISTAR IMÁGENES EN GALERÍA HTML
# ====================================
@app.get("/images/", response_class=HTMLResponse)
async def list_images():
    files = os.listdir(UPLOAD_FOLDER)
    image_files = [f for f in files if f.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp"))]

    if not image_files:
        return """
        <html>
            <head><title>Galería de Imágenes</title></head>
            <body style='font-family: Arial; text-align: center; background-color: #f7f7f7;'>
                <h2>🖼️ No hay imágenes subidas aún</h2>
            </body>
        </html>
        """

    html_content = """
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
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #fff;
                    text-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
                }
                .gallery {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                    gap: 25px;
                    width: 90%;
                    max-width: 1400px;
                    margin: 50px auto;
                }
                .gallery img {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                    border-radius: 16px;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
                    transition: transform 0.35s ease, box-shadow 0.35s ease;
                }
                .gallery img:hover {
                    transform: scale(1.05);
                    box-shadow: 0 12px 25px rgba(0, 0, 0, 0.5);
                    cursor: pointer;
                }
                @media (max-width: 768px) {
                    h1 { font-size: 2rem; }
                    .gallery { gap: 15px; }
                }
            </style>
        </head>
        <body>
            <h1>🖼️ Galería o Espacios de Imágenes</h1>
            <div class='gallery'>
    """

    for filename in image_files:
        html_content += f"<a href='/uploads/{filename}' target='_blank'><img src='/uploads/{filename}' alt='{filename}'></a>"

    html_content += """
            </div>
        </body>
    </html>
    """

    return HTMLResponse(content=html_content)