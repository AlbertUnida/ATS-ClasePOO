UNIVERSIDAD DE LA INTEGRACIÓN DE LAS AMERICAS

PROYECTO ORIENTADO A OBJETOS

"Sistema de Reclutamiento (ATS) para la gestión integral de Talento Humano periodo 2025/26"

TUTOR:
Ing. Erwin Roger Gualambo Poclin

INTEGRANTES:
Alumnos del 7mo Semestre periodo 2025-02 – Ing. Informatica e Ing. En Sistemas

Asunción – Paraguay
Año 2025

# UNIDAD 1 – Relevamiento de datos inicial.
## Comprensión del dominio (Descripción de la empresa/organización o área de la cual se va a realizar el sistema)
El proyecto se centra en la creación de un sistema de reclutamiento (ATS) para la automatización de procesos de gestión de talentos humanos dentro de empresas medianas y grandes. La organización ficticia sobre la cual se realiza el diseño de una compañía multinacional de servicios, con un área de Recursos Humanos consolidada.
## Organigrama de la empresa/organización
Una vez realicemos las siguientes unidades, se presentará un organigrama simplificado que refleje la estructura organizacional.
(Figura 1: Organigrama)
## Descripción del área a automatizar (Disponibilidad de hardware y software)
El área de recursos humanos cuenta con personal administrativo, reclutadores, analistas y un jefe de área. Actualmente los procesos se realizan mediante hojas de cálculo y correo electrónico, con limitaciones en trazabilidad. El departamento dispone de computadoras con conexión a internet y un servidor local con posibilidad de migrar a la nube.
## Funciones del Departamento de Recursos Humanos.
Publicación de vacantes.
Recepción de postulaciones.
Selección de candidatos.
Gestión de entrevistas.
Reportes por indicadores.

## Lista de requerimientos del cliente (Especificación de requerimientos del software)
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
## Entrevista a los futuros usuarios del sistema ( simular una entrevista, especificar las técnicas de recolección de datos)
Se realizarán entrevistas con los reclutadores y jefes de RRHH utilizando técnicas de recolección de datos como cuestionarios estructurados y observación de procesos actuales.
## Objetivos (General y específicos)
### 7.1.1 GENERAL
Diseñar e implementar un Sistema de Reclutamiento (ATS) para la gestión integral del talento humano, que sea viable, escalable y comercializable para empresas medianas y grandes, contribuyendo a la optimización de sus procesos de selección de personal.
### ESPECIFICOS:
Analizar el estado actual de los procesos de reclutamiento en empresas medianas y grandes.
Identificar los requerimientos funcionales y no funcionales necesarios para el desarrollo del sistema ATS.
Evaluar la viabilidad técnica, económica y operativa del proyecto.
Proponer un modelo de negocio sostenible y escalable en el tiempo.
Desarrollar un prototipo del sistema que valide su funcionalidad y pertinencia.
## Presentación de la propuesta (Alcance y limitaciones del proyecto)
El proyecto propone desarrollar un ATS modular con acceso web y móvil. Alcance: gestión de vacantes, postulaciones, entrevistas y reportes. Limitaciones: no incluye gestión de nómina ni evaluación de desempeño.

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

# UNIDAD IV
## Modelo de Objetos
Diagrama de clases de objetos de datos.





Modelado de la información
DER – Diseño Físico (DDL)
CREATE TABLE tenants (
id        CHAR(36) PRIMARY KEY,
name      VARCHAR(120) NOT NULL,
slug      VARCHAR(80)  NOT NULL UNIQUE,
status    VARCHAR(24)  NOT NULL DEFAULT 'active',
createdAt DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE usuarios (
id          CHAR(36) PRIMARY KEY,
tenantId    CHAR(36) NOT NULL,
name        VARCHAR(120) NOT NULL,
email       VARCHAR(160) NOT NULL,
password    VARCHAR(255) NOT NULL,
active      TINYINT(1)   NOT NULL DEFAULT 1,
candidatoId CHAR(36) NULL,
createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
updatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
UNIQUE KEY ux_usuario_email_tenant (tenantId, email),
KEY ix_usuario_tenant (tenantId),
CONSTRAINT fk_usuario_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id)
ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE roles (
id       CHAR(36) PRIMARY KEY,
tenantId CHAR(36) NOT NULL,
name     VARCHAR(80) NOT NULL,
UNIQUE KEY ux_role_name_tenant (tenantId, name),
CONSTRAINT fk_role_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id)
ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE permisos (
id          CHAR(36) PRIMARY KEY,
codigo      VARCHAR(80) NOT NULL UNIQUE,
descripcion VARCHAR(200) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE usuario_roles (
usuarioId CHAR(36) NOT NULL,
rolId     CHAR(36) NOT NULL,
allowed   TINYINT(1) NOT NULL DEFAULT 1,
PRIMARY KEY (usuarioId, rolId),
CONSTRAINT fk_ur_usuario FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE,
CONSTRAINT fk_ur_rol     FOREIGN KEY (rolId)     REFERENCES roles(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE rol_permisos (
rolId     CHAR(36) NOT NULL,
permisoId CHAR(36) NOT NULL,
allowed   TINYINT(1) NOT NULL DEFAULT 1,
PRIMARY KEY (rolId, permisoId),
CONSTRAINT fk_rp_rol     FOREIGN KEY (rolId)     REFERENCES roles(id)     ON DELETE CASCADE,
CONSTRAINT fk_rp_permiso FOREIGN KEY (permisoId) REFERENCES permisos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE candidatos (
id         CHAR(36) PRIMARY KEY,
tenantId   CHAR(36) NOT NULL,
nombre     VARCHAR(160) NOT NULL,
email      VARCHAR(160) NOT NULL,
telefono   VARCHAR(40),
cvUrl      VARCHAR(512),
perfilJson JSON,
cuentaId   CHAR(36),
createdAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
updatedAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
deletedAt  DATETIME NULL,
KEY ix_candidato_tenant (tenantId),
CONSTRAINT fk_candidato_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE vacantes (
id         CHAR(36) PRIMARY KEY,
tenantId   CHAR(36) NOT NULL,
cargoId    CHAR(36) NOT NULL,
ubicacion  VARCHAR(160),
tipoContrato VARCHAR(80),
estado     VARCHAR(32) NOT NULL,
flujoAprobacionJson JSON,
descripcion TEXT NOT NULL,
resumen     TEXT,
visibilidad VARCHAR(24) NOT NULL DEFAULT 'public',
publicSlug  VARCHAR(120),
expiresAt   DATETIME,
publishedAt DATETIME,
createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
updatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
deletedAt   DATETIME NULL,
KEY ix_vacante_tenant (tenantId),
KEY ix_vacante_estado (tenantId, estado),
CONSTRAINT fk_vacante_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE postulaciones (
id           CHAR(36) PRIMARY KEY,
tenantId     CHAR(36) NOT NULL,
vacanteId    CHAR(36) NOT NULL,
candidatoId  CHAR(36) NOT NULL,
fuente       VARCHAR(80),
estado       VARCHAR(32) NOT NULL,
matchScore   DECIMAL(5,2),
matchDetailsJson JSON,
extraUrl     VARCHAR(512),
mensaje      TEXT,
createdAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
updatedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
deletedAt    DATETIME NULL,
KEY ix_postu_tenant (tenantId),
KEY ix_postu_estado (tenantId, estado),
CONSTRAINT fk_postu_tenant   FOREIGN KEY (tenantId)   REFERENCES tenants(id)    ON DELETE CASCADE,
CONSTRAINT fk_postu_vacante  FOREIGN KEY (vacanteId)  REFERENCES vacantes(id)   ON DELETE CASCADE,
CONSTRAINT fk_postu_candidato FOREIGN KEY (candidatoId) REFERENCES candidatos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

# UNIDAD V
## Balanceos
### Clases de objetos de datos vs DER

### Ventajas OO
Navegación natural (colecciones y referencias), encapsulación y validaciones por dominio.

### Ventajas DER
Integridad referencial, consultas agregadas eficientes y normalización.
### Riesgos / Decisiones
Cargas perezosas vs. ansiosas (eager/lazy) en ORM.
“Estallido” de joins en listados con filtros; mitígalo con DTOs y selects parciales.
Campos JSON dan flexibilidad, pero evalúa índices funcionales si crecen.

# UNIDAD VI
## Prototipo de interfaz gráfica.

(INSERTAR IMÁGENES DEL FRONTEND DE CADA GRUPO)