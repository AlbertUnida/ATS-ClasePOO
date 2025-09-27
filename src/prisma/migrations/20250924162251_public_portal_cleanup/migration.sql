/*
  Warnings:

  - You are about to drop the `AsistentesEntrevista` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EducacionCandidato` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExperienciaCandidato` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Formularios` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HabilidadCandidato` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IdiomaCandidato` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OpcionesPregunta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PerfilCandidato` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Preguntas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Respuestas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RespuestasFormularioCandidato` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[publicSlug]` on the table `Vacantes` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `AsistentesEntrevista` DROP FOREIGN KEY `AsistentesEntrevista_entrevistaId_fkey`;

-- DropForeignKey
ALTER TABLE `AsistentesEntrevista` DROP FOREIGN KEY `AsistentesEntrevista_usuarioId_fkey`;

-- DropForeignKey
ALTER TABLE `EducacionCandidato` DROP FOREIGN KEY `EducacionCandidato_perfilId_fkey`;

-- DropForeignKey
ALTER TABLE `ExperienciaCandidato` DROP FOREIGN KEY `ExperienciaCandidato_perfilId_fkey`;

-- DropForeignKey
ALTER TABLE `Formularios` DROP FOREIGN KEY `Formularios_tenantId_fkey`;

-- DropForeignKey
ALTER TABLE `Formularios` DROP FOREIGN KEY `Formularios_vacanteId_fkey`;

-- DropForeignKey
ALTER TABLE `HabilidadCandidato` DROP FOREIGN KEY `HabilidadCandidato_perfilId_fkey`;

-- DropForeignKey
ALTER TABLE `IdiomaCandidato` DROP FOREIGN KEY `IdiomaCandidato_perfilId_fkey`;

-- DropForeignKey
ALTER TABLE `OpcionesPregunta` DROP FOREIGN KEY `OpcionesPregunta_preguntaId_fkey`;

-- DropForeignKey
ALTER TABLE `PerfilCandidato` DROP FOREIGN KEY `PerfilCandidato_candidatoId_fkey`;

-- DropForeignKey
ALTER TABLE `PerfilCandidato` DROP FOREIGN KEY `PerfilCandidato_tenantId_fkey`;

-- DropForeignKey
ALTER TABLE `Preguntas` DROP FOREIGN KEY `Preguntas_formularioId_fkey`;

-- DropForeignKey
ALTER TABLE `Respuestas` DROP FOREIGN KEY `Respuestas_rfcId_fkey`;

-- DropForeignKey
ALTER TABLE `RespuestasFormularioCandidato` DROP FOREIGN KEY `RespuestasFormularioCandidato_postulacionId_fkey`;

-- DropForeignKey
ALTER TABLE `RespuestasFormularioCandidato` DROP FOREIGN KEY `RespuestasFormularioCandidato_tenantId_fkey`;

-- AlterTable
ALTER TABLE `Candidatos` ADD COLUMN `cuentaId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Vacantes` ADD COLUMN `descripcion` VARCHAR(191) NULL,
    ADD COLUMN `expiresAt` DATETIME(3) NULL,
    ADD COLUMN `publicSlug` VARCHAR(191) NULL,
    ADD COLUMN `publishedAt` DATETIME(3) NULL,
    ADD COLUMN `resumen` VARCHAR(191) NULL,
    ADD COLUMN `visibilidad` VARCHAR(191) NOT NULL DEFAULT 'PUBLICA';

-- DropTable
DROP TABLE `AsistentesEntrevista`;

-- DropTable
DROP TABLE `EducacionCandidato`;

-- DropTable
DROP TABLE `ExperienciaCandidato`;

-- DropTable
DROP TABLE `Formularios`;

-- DropTable
DROP TABLE `HabilidadCandidato`;

-- DropTable
DROP TABLE `IdiomaCandidato`;

-- DropTable
DROP TABLE `OpcionesPregunta`;

-- DropTable
DROP TABLE `PerfilCandidato`;

-- DropTable
DROP TABLE `Preguntas`;

-- DropTable
DROP TABLE `Respuestas`;

-- DropTable
DROP TABLE `RespuestasFormularioCandidato`;

-- CreateTable
CREATE TABLE `CandidatoCuentas` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CandidatoCuentas_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Candidatos_cuentaId_idx` ON `Candidatos`(`cuentaId`);

-- CreateIndex
CREATE INDEX `Usuarios_email_idx` ON `Usuarios`(`email`);

-- CreateIndex
CREATE UNIQUE INDEX `Vacantes_publicSlug_key` ON `Vacantes`(`publicSlug`);

-- CreateIndex
CREATE INDEX `Vacantes_tenantId_estado_visibilidad_createdAt_idx` ON `Vacantes`(`tenantId`, `estado`, `visibilidad`, `createdAt`);

-- AddForeignKey
ALTER TABLE `Candidatos` ADD CONSTRAINT `Candidatos_cuentaId_fkey` FOREIGN KEY (`cuentaId`) REFERENCES `CandidatoCuentas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
