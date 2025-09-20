-- AlterTable
ALTER TABLE `Usuarios` ADD COLUMN `candidatoId` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `Permisos` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,

    UNIQUE INDEX `Permisos_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermisos` (
    `roleId` VARCHAR(191) NOT NULL,
    `permisoId` VARCHAR(191) NOT NULL,
    `allowed` BOOLEAN NOT NULL DEFAULT true,

    INDEX `RolePermisos_permisoId_idx`(`permisoId`),
    PRIMARY KEY (`roleId`, `permisoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UsuarioPermisos` (
    `userId` VARCHAR(191) NOT NULL,
    `permisoId` VARCHAR(191) NOT NULL,
    `allowed` BOOLEAN NOT NULL DEFAULT true,

    INDEX `UsuarioPermisos_permisoId_idx`(`permisoId`),
    PRIMARY KEY (`userId`, `permisoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Usuarios_tenantId_idx` ON `Usuarios`(`tenantId`);

-- CreateIndex
CREATE UNIQUE INDEX `Usuarios_tenantId_candidatoId_key` ON `Usuarios`(`tenantId`, `candidatoId`);

-- AddForeignKey
ALTER TABLE `Usuarios` ADD CONSTRAINT `Usuarios_candidatoId_fkey` FOREIGN KEY (`candidatoId`) REFERENCES `Candidatos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermisos` ADD CONSTRAINT `RolePermisos_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermisos` ADD CONSTRAINT `RolePermisos_permisoId_fkey` FOREIGN KEY (`permisoId`) REFERENCES `Permisos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UsuarioPermisos` ADD CONSTRAINT `UsuarioPermisos_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UsuarioPermisos` ADD CONSTRAINT `UsuarioPermisos_permisoId_fkey` FOREIGN KEY (`permisoId`) REFERENCES `Permisos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

