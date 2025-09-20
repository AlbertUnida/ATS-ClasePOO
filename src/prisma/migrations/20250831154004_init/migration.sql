-- CreateTable
CREATE TABLE `Tenants` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Tenants_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Usuarios` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Usuarios_tenantId_email_key`(`tenantId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Roles` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Roles_tenantId_name_key`(`tenantId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UsuarioRoles` (
    `userId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`userId`, `roleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cargos` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `competenciasJson` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Cargos_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vacantes` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `cargoId` VARCHAR(191) NOT NULL,
    `ubicacion` VARCHAR(191) NULL,
    `tipoContrato` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'abierta',
    `flujoAprobacionJson` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Vacantes_tenantId_cargoId_idx`(`tenantId`, `cargoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Candidatos` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NULL,
    `cvUrl` VARCHAR(191) NULL,
    `perfilJson` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Candidatos_tenantId_email_idx`(`tenantId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Postulaciones` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `vacanteId` VARCHAR(191) NOT NULL,
    `candidatoId` VARCHAR(191) NOT NULL,
    `estadoActual` VARCHAR(191) NOT NULL DEFAULT 'CREADA',
    `fuente` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Postulaciones_tenantId_vacanteId_candidatoId_idx`(`tenantId`, `vacanteId`, `candidatoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventoPostulaciones` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `postulacionId` VARCHAR(191) NOT NULL,
    `estadoFrom` VARCHAR(191) NULL,
    `estadoTo` VARCHAR(191) NOT NULL,
    `actorUserId` VARCHAR(191) NULL,
    `motivo` VARCHAR(191) NULL,
    `ts` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EventoPostulaciones_tenantId_postulacionId_idx`(`tenantId`, `postulacionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Entrevistas` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `postulacionId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `inicioTs` DATETIME(3) NOT NULL,
    `finTs` DATETIME(3) NOT NULL,
    `canal` VARCHAR(191) NULL,
    `resultado` VARCHAR(191) NULL,
    `notas` VARCHAR(191) NULL,

    INDEX `Entrevistas_tenantId_postulacionId_idx`(`tenantId`, `postulacionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Feedback` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `postulacionId` VARCHAR(191) NOT NULL,
    `evaluadorUserId` VARCHAR(191) NULL,
    `puntaje` INTEGER NOT NULL,
    `competenciasJson` VARCHAR(191) NULL,
    `comentario` VARCHAR(191) NULL,
    `recomendacion` BOOLEAN NULL,
    `ts` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Feedback_tenantId_postulacionId_idx`(`tenantId`, `postulacionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Usuarios` ADD CONSTRAINT `Usuarios_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Roles` ADD CONSTRAINT `Roles_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UsuarioRoles` ADD CONSTRAINT `UsuarioRoles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UsuarioRoles` ADD CONSTRAINT `UsuarioRoles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cargos` ADD CONSTRAINT `Cargos_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vacantes` ADD CONSTRAINT `Vacantes_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vacantes` ADD CONSTRAINT `Vacantes_cargoId_fkey` FOREIGN KEY (`cargoId`) REFERENCES `Cargos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Candidatos` ADD CONSTRAINT `Candidatos_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Postulaciones` ADD CONSTRAINT `Postulaciones_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Postulaciones` ADD CONSTRAINT `Postulaciones_vacanteId_fkey` FOREIGN KEY (`vacanteId`) REFERENCES `Vacantes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Postulaciones` ADD CONSTRAINT `Postulaciones_candidatoId_fkey` FOREIGN KEY (`candidatoId`) REFERENCES `Candidatos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventoPostulaciones` ADD CONSTRAINT `EventoPostulaciones_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventoPostulaciones` ADD CONSTRAINT `EventoPostulaciones_postulacionId_fkey` FOREIGN KEY (`postulacionId`) REFERENCES `Postulaciones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Entrevistas` ADD CONSTRAINT `Entrevistas_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Entrevistas` ADD CONSTRAINT `Entrevistas_postulacionId_fkey` FOREIGN KEY (`postulacionId`) REFERENCES `Postulaciones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Feedback` ADD CONSTRAINT `Feedback_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Feedback` ADD CONSTRAINT `Feedback_postulacionId_fkey` FOREIGN KEY (`postulacionId`) REFERENCES `Postulaciones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
