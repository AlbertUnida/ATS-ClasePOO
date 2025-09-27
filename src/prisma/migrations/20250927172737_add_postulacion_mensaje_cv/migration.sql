/* Warnings:
   - You are about to drop the column estadoActual on the Postulaciones table. All the data in the column will be lost.
*/

/* DropForeignKey */
ALTER TABLE `Postulaciones` DROP FOREIGN KEY `Postulaciones_tenantId_fkey`;

/* DropIndex */
DROP INDEX `Postulaciones_tenantId_estadoActual_idx` ON `Postulaciones`;

/* AlterTable */
ALTER TABLE `Postulaciones`
  DROP COLUMN `estadoActual`,
  ADD COLUMN `cvExtraUrl` VARCHAR(191) NULL,
  ADD COLUMN `estado` VARCHAR(191) NOT NULL DEFAULT 'postulado',
  ADD COLUMN `mensaje` VARCHAR(191) NULL;

/* CreateIndex */
CREATE INDEX `Postulaciones_tenantId_estado_idx` ON `Postulaciones` (`tenantId`, `estado`);

/* AddForeignKey */
/*
ALTER TABLE `Postulaciones`
  ADD CONSTRAINT `Postulaciones_candidatoId_fkey`
  FOREIGN KEY (`candidatoId`) REFERENCES `Candidatos`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
*/