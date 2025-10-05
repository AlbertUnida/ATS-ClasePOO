-- AlterTable
ALTER TABLE `Vacantes` MODIFY `flujoAprobacionJson` LONGTEXT NULL;

-- AddForeignKey
ALTER TABLE `Postulaciones` ADD CONSTRAINT `Postulaciones_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
