# =========================
# Dockerfile Backend FastAPI
# =========================

FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copiar dependencias
COPY Backend/requirements.txt ./

RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copiar SOLO el backend
COPY Backend/ .

# Crear carpeta para uploads
RUN mkdir -p /app/uploads

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]