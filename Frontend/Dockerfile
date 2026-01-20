# -----------------------------------------------------
# 1️⃣ Etapa de construcción (Build Angular)
# -----------------------------------------------------
FROM node:18 AS build

# Carpeta donde irá el código
WORKDIR /app

# Copiar dependencias
COPY package*.json /app/

# Instalar dependencias
RUN npm install

# Copiar el resto del proyecto
COPY . .

# Construir Angular en modo producción
RUN npm run build --prod


# -----------------------------------------------------
# 2️⃣ Etapa final (Nginx para servir el front)
# -----------------------------------------------------
FROM nginx:alpine

# Copiar la build generada al servidor nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
