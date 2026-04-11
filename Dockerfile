# 1. Usamos una versión ligera de Node.js 20 (la misma que tienes en tu PC)
FROM node:20-alpine

# 2. Le decimos a Docker: "Todo lo que hagamos ahora, hazlo en esta carpeta"
WORKDIR /app

# 3. Copiamos los archivos de dependencias primero (esto optimiza la velocidad)
COPY package*.json ./
COPY prisma ./prisma/

# 4. Instalamos las librerías
RUN npm install

# 5. Copiamos el resto de tu código (la carpeta src)
COPY . .

# 6. ¡SÚPER IMPORTANTE! Generamos el cliente de Prisma para que funcione dentro de Docker
RUN npx prisma generate

# 7. Le avisamos a Docker que nuestra app usa el puerto 3000
EXPOSE 3000

# 8. El comando para arrancar en el VPS (usando tu script 'start' que es 'node src/server.js')
CMD ["npm", "start"]