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