UNIVERSIDAD DE LA INTEGRACIÓN DE LAS AMERICAS

PROYECTO ORIENTADO A OBJETOS

"Sistema de Reclutamiento (ATS) para la gestión integral de Talento Humano periodo 2025/26"

TUTOR:
Ing. Erwin Roger Gualambo Poclin

INTEGRANTES:
Alumnos del 7mo Semestre periodo 2025-02 – Ing. Informatica e Ing. En Sistemas

Asunción – Paraguay
Año 2025

# UNIDAD II Proceso de Análisis y Diseño con UML
## Modelo de negocios
## Diagrama de requerimientos. Basado en el relevamiento: Representa la arquitectura del Sistema.
### Requerimientos funcionales:
Debe permitir gestionar roles de usuario. (Administrador, reclutador, gerente de área, candidato) con niveles de acceso.
Debe permitir publicar ofertas laborales o puestos vacantes.
Debe contar con un portal para postulantes, donde puedan registrarse, cargar su CV, actualizar y postular a vacantes disponibles.
Debe disponer de un módulo de gestión de candidatos, que permita al reclutador visualizar, filtrar y organizar aplicaciones recibidas.
Debe permitir automatizar las etapas del proceso de selección (Screening inicial, envío de correos automáticos, recordatorios de entrevistas.)
Debe ofrecer un módulo de entrevistas, con la posibilidad de agendarlas, integrarse a calendarios corporativos y realizar entrevistas virtuales.
Debe incluir un flujo de evaluación de candidatos, donde los entrevistadores puedan cargar puntajes, comentario y recomendaciones.
Debe generar reportes y estadísticas sobre el proceso de reclutamiento (tiempo promedio de contratación, fuentes de candidatos más efectivas, tasa de éxito de contrataciones).
Debe integrarse con el módulo de gestión de empleados del área de RRHH para dar de alta automáticamente a los candidatos seleccionados.
### Requerimientos No Funcionales:
Debe ser escalable, soportando el crecimiento en el número de vacantes y postulantes
Debe contar con seguridad en el manejo de datos personales, cumpliendo normativas de protección de datos.
Debe garantizar un tiempo de respuesta menor a 3 segundos en consultas estándar.
Debe tener alta disponibilidad, con un tiempo de actividad mínimo del 90% mensual.
Debe contar con soporte técnico y actualizaciones recurrentes.
Debe ofrecer una interfaz intuitiva y de fácil uso, con diseño adaptable (responsive).

Diagramas del Negocio
## Diagrama de caso de uso del negocio global


## Caso 1: Empresa/Cliente













## Caso 2: Proveedor/Desarrolladores del sistema


## Diagrama de Secuencia del Negocio Global



Diagrama de secuencia de Administradores


Diagrama de secuencia de RRHH






Especificación de Casos de Usos del Sistema VS Interfaz GUI (Interfaz gráfica del usuario)

# HERRAMIENTAS
## Entorno de desarrollo
WSL2 – Ubuntu
Visual Studio Code
## Base de datos
Motor: MySQL 8 (InnoDB, UTF-8 utf8mb4)
No hay instalación nativa en el host. Se usa un contenedor Docker con la imagen oficial mysql:8.
Uso: persistencia multi-empresa (tablas con tenantId).
Puertos: mapeado típico 3307->3306.
## Backend (API)
IDE: Visual Studio Code (VS Code).
Requisitos: Node.js, Docker.
Framework: NestJS (Node.js + TypeScript).
ORM: Prisma (modelado en schema.prisma, migraciones y prisma generate).
IDE: Visual Studio Code (VS Code).
Requisitos: Node.js 20 LTS, Docker (si usás contenedores).
## IDE de BD
DBeaver: cliente universal para MySQL.
Conexión: Host = localhost, Puerto = 3307 (según mapeo local), Usuario/Pass de MySQL.
## Contenedores (Docker)
Servicios típicos:
ats-mysql: mysql:8 con volumen de datos y puerto expuesto.
ats-api: imagen del Nest (compilado a dist).
## Herramientas de colaboración:

Git y GitHub