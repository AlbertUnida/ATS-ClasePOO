# Frontend ATS (Vite + React)

Este es el punto de partida para construir la interfaz del proyecto ATS.
Incluye routing con eact-router-dom, un cliente ligero para consumir el backend
y pantallas de ejemplo para autenticación, gestión de tenants, usuarios y vacantes.

## Requisitos previos

- Node.js 18 o superior
- npm 9 o superior

## Instalación

`
cd frontend
npm install
`

## Scripts disponibles

- 
pm run dev → servidor de desarrollo en http://localhost:5174
- 
pm run build → genera la versión lista para producción en rontend/dist
- 
pm run preview → sirve el build generado para verificarlo localmente en http://localhost:4174

## Variables de entorno

Puedes definir VITE_API_BASE_URL (ver .env.example) para apuntar a otra URL del backend.
Si no se configura, se usa http://localhost:4050.

## Estructura destacada

- src/api/backend.ts: cliente fetch con helpers para login, tenants, usuarios, cargos y vacantes.
- src/context/AuthContext.tsx: gestión de sesión y guardia de rutas.
- src/pages/: vistas base para el flujo completo (inicio, login, dashboard, tenants, usuarios, vacantes internas y públicas).
- src/App.tsx: Router principal con navegación según rol.

## Contenedor Docker opcional

Se añadió un Dockerfile específico y el docker-compose.yml principal ahora
incluye el servicio rontend. Para levantarlo:

`
docker compose up --build frontend
`

Quedará disponible en http://localhost:5174 servido por Nginx.

¡Listo! Continúa personalizando las pantallas según las necesidades del ATS.
