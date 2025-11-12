![Talent Flow ATS](docs/assets/banner-login.png)

# Talent Flow ATS – Backend + Frontend

ATS multi-tenant desarrollado para la UNIDA, con stack **NestJS + Prisma + MySQL** y **React + Vite**. Este README describe instalación, arquitectura y scripts de operación. Toda la documentación académica (relevamiento, UML, planificación) vive bajo `docs/`.

---

## Contenidos
1. [Arquitectura general](#arquitectura-general)
2. [Dependencias y requisitos](#dependencias-y-requisitos)
3. [Instalación rápida](#instalación-rápida)
4. [Ejecución (local y Docker)](#ejecución)
5. [Migraciones y seeds](#migraciones-y-seeds)
6. [Estructura de carpetas](#estructura)
7. [Variables de entorno](#variables-de-entorno)
8. [Credenciales demo](#credenciales-demo)
9. [Tests y calidad](#tests)
10. [Documentación académica](#documentación)

---

## Arquitectura general

- **Backend (api-ats)**: NestJS + Prisma. Expone módulos `auth`, `roles-permisos`, `tenants`, `vacantes`, `candidatos`, `postulaciones`, `entrevistas`, `feedback`, `automations`, `scoring`, `reports`.  
- **Base de datos**: MySQL 8.0 (Docker `ats-mysql`). Prisma gestiona la schema (`src/prisma/schema.prisma`).  
- **Frontend**: React + Vite (`frontend/`). Panel privado + portal público (`/postulantes`).  
- **Infra**: `docker-compose.yml` orquesta `mysql`, `api-ats`, `ats-frontend`.  
- **Storage**: `uploads/` para imágenes de vacantes y CVs.

### Diagrama resumido
```
[ React/Vite ] <--HTTP--> [ NestJS ] <--Prisma--> [ MySQL ]
        |
   Portal candidatos & panel interno
```

---

## Dependencias y requisitos

- Node.js 20.x
- npm 10.x
- Docker Desktop (opcional pero recomendado)
- MySQL client (para debugging)
- PowerShell / bash

---

## Instalación rápida

```bash
git clone https://github.com/AlbertUnida/ATS-ClasePOO.git
cd ATS-ClasePOO
npm install            # instala dependencias del backend (Nest)
cd frontend && npm install
```

---

## Ejecución

### Opción A – Docker (recomendado)
En la raíz del proyecto:
```bash
docker compose up --build
```
Servicios resultantes:
- API NestJS → `http://localhost:4050`
- Frontend → `http://localhost:5174` (o 5175 según disponibilidad)
- MySQL → `localhost:3307`

### Opción B – Local (sin Docker)
1. Levantar MySQL local en `localhost:3306` (crea base `ats_saas`).  
2. Backend:
   ```bash
   npm install
   npx prisma migrate dev --schema=src/prisma/schema.prisma
   npm run start:dev
   ```
3. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev -- --port=5174
   ```

---

## Migraciones y seeds

**Prisma** se usa como ORM:
```bash
npx prisma migrate dev --name init_schema --schema=src/prisma/schema.prisma
```

Para reiniciar base en desarrollo:
```bash
npx prisma migrate reset --schema=src/prisma/schema.prisma
```

Seed sugerido (pendiente de automatizar): crear superadmin via API `POST /auth/bootstrap-superadmin`.

---

## Estructura

```
├── docker-compose.yml
├── src/                  # Backend Nest
│   ├── auth/             # login, bootstrap
│   ├── candidatos/
│   ├── vacantes/
│   ├── ...               # cada módulo con dto, service, controller
│   └── prisma/
├── frontend/
│   ├── src/
│   │   ├── pages/        # Login, Dashboard, Vacantes, Candidatos, Entrevistas, Reportes
│   │   ├── api/          # Wrapper fetch al backend
│   │   └── context/
│   └── vite.config.ts
├── docs/
│   ├── portal-candidatos.md
│   └── pf_final/         # (pendiente) documentación académica por unidad
└── uploads/              # imágenes y CVs
```

---

## Variables de entorno

Ejemplos (crear `.env`, `.env.api`, `.env.db`):

```
# .env (Nest local)
PORT=4050
DATABASE_URL=mysql://ats_user:devuser01@localhost:3307/ats_saas
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=ats_saas
MYSQL_USER=ats_user
MYSQL_PASSWORD=devuser01
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# .env.api (para docker/api-ats)
PORT=4050
NODE_ENV=development
DATABASE_URL=mysql://ats_user:devuser01@mysql:3306/ats_saas
FRONTEND_URL=http://localhost:5174,http://localhost:5175
ROOT_TENANT_SLUG=root
# ... resto de secretos

# .env.db (docker mysql)
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=ats_saas
MYSQL_USER=ats_user
MYSQL_PASSWORD=devuser01
```

**Importante**: No subir secretos reales a Git; usar `.env.example`.

---

## Credenciales demo

| Usuario | Rol | Tenant | Email | Contraseña |
| --- | --- | --- | --- | --- |
| Superadmin | Global | root | `super@tuempresa.com` | `Super123!` |
| Admin demo | Admin | `vmgroup` | `admin@vmgroup.com` | `Admin123!` |
| Reclutador demo | Reclutador | `vmgroup` | `reclutador@vmgroup.com` | `Recluta123!` |

Portal postulantes (registro propio) → `http://localhost:5174/postulantes`.

---

## Tests

Pendiente reforzar suites. Actualmente existe `src/scoring/scoring.service.spec.ts`. Ejecutar:
```bash
npm run test
# o modo watch
npm run test:watch
```
Recomendación: agregar pruebas e2e para auth, vacantes, postulaciones y automatizar en CI.

---

## Documentación académica <a name="documentación"></a>

En construcción. Estructura sugerida:
```
docs/pf_final/
├── unidad_I_relevamiento.md
├── unidad_II_modelonegocio.md
├── unidad_III_casos_uso.md
├── unidad_IV_V_modelos.md
├── unidad_VI_prototipos.md
├── anexos/
│   ├── uml/
│   ├── der/
│   └── entrevistas/
└── referencias_APA.bib
```

Mientras se completan los artefactos, todo el código y assets están disponibles en este repositorio. Para dudas o fallos abrir un issue o contactar al equipo de la UNIDA.

---

## Roadmap inmediato
1. Completar documentación PF (relevamiento, Canvas, UML, DER, viabilidad, APA).
2. Automatizar seeds, agregar pruebas unitarias/e2e y pipeline CI.
3. Integrar autenticación OIDC y endurecer controles (hash de secretos, rotation).
4. Publicar demo SaaS desplegada (Docker Compose → Azure/AWS).

---

**Licencia:** MIT. Uso académico autorizado por el Grupo. Para despliegue comercial coordinar con el equipo.
