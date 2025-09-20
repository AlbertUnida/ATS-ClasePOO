FROM node:20-alpine

WORKDIR /app

# Copiar solo package.json y package-lock.json primero para aprovechar la caché de Docker
COPY package*.json ./

# Instalar todas las dependencias (incluidas las de desarrollo)
RUN npm install

# Copiar el resto del código
COPY . .

# Instalar Prisma y generar Prisma Client
RUN npm install -D prisma @prisma/client
RUN npx prisma generate --schema=src/prisma/schema.prisma

EXPOSE 4050

# Comando para iniciar la aplicación
CMD ["npm", "run", "start:dev"]