# Portal de postulantes

Este flujo permite a cualquier candidato registrarse, mantener su CV y seguir el avance de sus postulaciones sin intervenir el panel administrativo.

## URL disponibles

- Frontend público: `http://localhost:5174/postulantes`
- Vista de previsualización para staff (superadmin, admin, reclutador): menú **Postulantes** dentro del panel (`/postulantes/preview`).

## Endpoints involucrados

```
POST   /auth/candidatos/register
POST   /auth/candidatos/login
GET    /auth/candidatos/me
PUT    /auth/candidatos/me
GET    /auth/candidatos/postulaciones
POST   /auth/candidatos/postular
POST   /auth/candidatos/cv   (multipart/form-data, campo file)
POST   /auth/candidatos/logout
```

Los tokens para candidatos se entregan en la respuesta y también se guardan en una cookie `access_token`. El frontend público envía el token mediante encabezado `Authorization`.

## Requisitos

- Vacantes públicas disponibles (`/vacantes/publicas` o `/vacantes/publicasTodas`).
- Tenants creados; si un candidato se registra sin tenant, se asignará automáticamente al tenant de la primera vacante a la que se postule.
- Directorio `uploads/candidatos` con permisos de escritura para almacenar CVs.

