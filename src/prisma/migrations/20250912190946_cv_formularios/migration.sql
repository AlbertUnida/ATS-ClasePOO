/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,email]` on the table `Candidatos` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vacanteId,candidatoId]` on the table `Postulaciones` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Candidatos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Postulaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Vacantes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Candidatos` DROP FOREIGN KEY `Candidatos_tenantId_fkey`;

-- DropForeignKey
ALTER TABLE `Entrevistas` DROP FOREIGN KEY `Entrevistas_postulacionId_fkey`;

-- DropForeignKey
ALTER TABLE `EventoPostulaciones` DROP FOREIGN KEY `EventoPostulaciones_postulacionId_fkey`;

-- DropForeignKey
ALTER TABLE `Feedback` DROP FOREIGN KEY `Feedback_postulacionId_fkey`;

-- DropForeignKey
ALTER TABLE `Vacantes` DROP FOREIGN KEY `Vacantes_tenantId_fkey`;

-- DropIndex
DROP INDEX `Candidatos_tenantId_email_idx` ON `Candidatos`;

-- DropIndex
DROP INDEX `Entrevistas_postulacionId_fkey` ON `Entrevistas`;

-- DropIndex
DROP INDEX `EventoPostulaciones_postulacionId_fkey` ON `EventoPostulaciones`;

-- DropIndex
DROP INDEX `Feedback_postulacionId_fkey` ON `Feedback`;

-- DropIndex
DROP INDEX `Vacantes_tenantId_cargoId_idx` ON `Vacantes`;

-- AlterTable
ALTER TABLE `Candidatos` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `Postulaciones` ADD COLUMN `matchDetailsJson` VARCHAR(191) NULL,
    ADD COLUMN `matchScore` DOUBLE NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `Vacantes` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `PerfilCandidato` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `candidatoId` VARCHAR(191) NOT NULL,
    `resumen` VARCHAR(191) NULL,
    `linkedin` VARCHAR(191) NULL,
    `portfolio` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PerfilCandidato_candidatoId_key`(`candidatoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EducacionCandidato` (
    `id` VARCHAR(191) NOT NULL,
    `perfilId` VARCHAR(191) NOT NULL,
    `institucion` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `inicio` DATETIME(3) NULL,
    `fin` DATETIME(3) NULL,
    `enCurso` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExperienciaCandidato` (
    `id` VARCHAR(191) NOT NULL,
    `perfilId` VARCHAR(191) NOT NULL,
    `empresa` VARCHAR(191) NOT NULL,
    `cargo` VARCHAR(191) NOT NULL,
    `inicio` DATETIME(3) NULL,
    `fin` DATETIME(3) NULL,
    `descripcion` VARCHAR(191) NULL,
    `tecnologiasJson` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HabilidadCandidato` (
    `id` VARCHAR(191) NOT NULL,
    `perfilId` VARCHAR(191) NOT NULL,
    `skill` VARCHAR(191) NOT NULL,
    `nivel` ENUM('basico', 'intermedio', 'avanzado', 'experto') NOT NULL,
    `anios` INTEGER NULL,

    INDEX `HabilidadCandidato_perfilId_skill_idx`(`perfilId`, `skill`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IdiomaCandidato` (
    `id` VARCHAR(191) NOT NULL,
    `perfilId` VARCHAR(191) NOT NULL,
    `idioma` VARCHAR(191) NOT NULL,
    `nivel` ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'NATIVE') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Formularios` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `alcance` VARCHAR(191) NOT NULL,
    `vacanteId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Formularios_tenantId_alcance_vacanteId_idx`(`tenantId`, `alcance`, `vacanteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Preguntas` (
    `id` VARCHAR(191) NOT NULL,
    `formularioId` VARCHAR(191) NOT NULL,
    `seccion` VARCHAR(191) NULL,
    `orden` INTEGER NOT NULL,
    `texto` VARCHAR(191) NOT NULL,
    `tipo` ENUM('SINGLE_CHOICE', 'MULTI_CHOICE', 'YES_NO', 'NUMBER', 'TEXT_SHORT', 'TEXT_LONG', 'DATE', 'FILE') NOT NULL,
    `requerida` BOOLEAN NOT NULL DEFAULT false,
    `visibilidadIfJson` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OpcionesPregunta` (
    `id` VARCHAR(191) NOT NULL,
    `preguntaId` VARCHAR(191) NOT NULL,
    `etiqueta` VARCHAR(191) NOT NULL,
    `valor` VARCHAR(191) NOT NULL,
    `orden` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RespuestasFormularioCandidato` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `postulacionId` VARCHAR(191) NOT NULL,
    `formularioId` VARCHAR(191) NOT NULL,
    `versionFormulario` INTEGER NOT NULL,
    `formularioSnapshotJson` VARCHAR(191) NULL,

    UNIQUE INDEX `RespuestasFormularioCandidato_postulacionId_formularioId_ver_key`(`postulacionId`, `formularioId`, `versionFormulario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Respuestas` (
    `id` VARCHAR(191) NOT NULL,
    `rfcId` VARCHAR(191) NOT NULL,
    `preguntaId` VARCHAR(191) NOT NULL,
    `valorTexto` VARCHAR(191) NULL,
    `valorNumero` DOUBLE NULL,
    `valorFecha` DATETIME(3) NULL,
    `valoresJson` VARCHAR(191) NULL,
    `opcionValor` VARCHAR(191) NULL,

    INDEX `Respuestas_rfcId_preguntaId_idx`(`rfcId`, `preguntaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AsistentesEntrevista` (
    `entrevistaId` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`entrevistaId`, `usuarioId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Candidatos_tenantId_idx` ON `Candidatos`(`tenantId`);

-- CreateIndex
CREATE UNIQUE INDEX `Candidatos_tenantId_email_key` ON `Candidatos`(`tenantId`, `email`);

-- CreateIndex
CREATE INDEX `Postulaciones_tenantId_estadoActual_idx` ON `Postulaciones`(`tenantId`, `estadoActual`);

-- CreateIndex
CREATE UNIQUE INDEX `Postulaciones_vacanteId_candidatoId_key` ON `Postulaciones`(`vacanteId`, `candidatoId`);

-- CreateIndex
CREATE INDEX `Vacantes_tenantId_cargoId_estado_idx` ON `Vacantes`(`tenantId`, `cargoId`, `estado`);

-- AddForeignKey
ALTER TABLE `EventoPostulaciones` ADD CONSTRAINT `EventoPostulaciones_postulacionId_fkey` FOREIGN KEY (`postulacionId`) REFERENCES `Postulaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventoPostulaciones` ADD CONSTRAINT `EventoPostulaciones_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `Usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Entrevistas` ADD CONSTRAINT `Entrevistas_postulacionId_fkey` FOREIGN KEY (`postulacionId`) REFERENCES `Postulaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Feedback` ADD CONSTRAINT `Feedback_postulacionId_fkey` FOREIGN KEY (`postulacionId`) REFERENCES `Postulaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Candidatos` ADD CONSTRAINT `Candidatos_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vacantes` ADD CONSTRAINT `Vacantes_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PerfilCandidato` ADD CONSTRAINT `PerfilCandidato_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PerfilCandidato` ADD CONSTRAINT `PerfilCandidato_candidatoId_fkey` FOREIGN KEY (`candidatoId`) REFERENCES `Candidatos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EducacionCandidato` ADD CONSTRAINT `EducacionCandidato_perfilId_fkey` FOREIGN KEY (`perfilId`) REFERENCES `PerfilCandidato`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExperienciaCandidato` ADD CONSTRAINT `ExperienciaCandidato_perfilId_fkey` FOREIGN KEY (`perfilId`) REFERENCES `PerfilCandidato`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HabilidadCandidato` ADD CONSTRAINT `HabilidadCandidato_perfilId_fkey` FOREIGN KEY (`perfilId`) REFERENCES `PerfilCandidato`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IdiomaCandidato` ADD CONSTRAINT `IdiomaCandidato_perfilId_fkey` FOREIGN KEY (`perfilId`) REFERENCES `PerfilCandidato`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Formularios` ADD CONSTRAINT `Formularios_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Formularios` ADD CONSTRAINT `Formularios_vacanteId_fkey` FOREIGN KEY (`vacanteId`) REFERENCES `Vacantes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Preguntas` ADD CONSTRAINT `Preguntas_formularioId_fkey` FOREIGN KEY (`formularioId`) REFERENCES `Formularios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OpcionesPregunta` ADD CONSTRAINT `OpcionesPregunta_preguntaId_fkey` FOREIGN KEY (`preguntaId`) REFERENCES `Preguntas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RespuestasFormularioCandidato` ADD CONSTRAINT `RespuestasFormularioCandidato_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RespuestasFormularioCandidato` ADD CONSTRAINT `RespuestasFormularioCandidato_postulacionId_fkey` FOREIGN KEY (`postulacionId`) REFERENCES `Postulaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Respuestas` ADD CONSTRAINT `Respuestas_rfcId_fkey` FOREIGN KEY (`rfcId`) REFERENCES `RespuestasFormularioCandidato`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AsistentesEntrevista` ADD CONSTRAINT `AsistentesEntrevista_entrevistaId_fkey` FOREIGN KEY (`entrevistaId`) REFERENCES `Entrevistas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AsistentesEntrevista` ADD CONSTRAINT `AsistentesEntrevista_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
