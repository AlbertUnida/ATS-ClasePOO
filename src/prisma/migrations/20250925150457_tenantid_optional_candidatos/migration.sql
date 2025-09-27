-- DropForeignKey
ALTER TABLE `Candidatos` DROP FOREIGN KEY `Candidatos_tenantId_fkey`;

-- AlterTable
ALTER TABLE `Candidatos` MODIFY `tenantId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Candidatos` ADD CONSTRAINT `Candidatos_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
