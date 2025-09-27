-- AlterTable
ALTER TABLE `Candidatos` ADD COLUMN `createdByAccountId` VARCHAR(191) NULL,
    ADD COLUMN `createdByUserId` VARCHAR(191) NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `updatedByAccountId` VARCHAR(191) NULL,
    ADD COLUMN `updatedByUserId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Postulaciones` ADD COLUMN `createdByAccountId` VARCHAR(191) NULL,
    ADD COLUMN `createdByUserId` VARCHAR(191) NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `updatedByAccountId` VARCHAR(191) NULL,
    ADD COLUMN `updatedByUserId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Vacantes` ADD COLUMN `createdByAccountId` VARCHAR(191) NULL,
    ADD COLUMN `createdByUserId` VARCHAR(191) NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `updatedByAccountId` VARCHAR(191) NULL,
    ADD COLUMN `updatedByUserId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `ts` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tenantId` VARCHAR(191) NULL,
    `actorUserId` VARCHAR(191) NULL,
    `actorAccountId` VARCHAR(191) NULL,
    `actorEmail` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `note` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `path` VARCHAR(191) NULL,

    INDEX `AuditLog_tenantId_entity_entityId_ts_idx`(`tenantId`, `entity`, `entityId`, `ts`),
    INDEX `AuditLog_actorUserId_ts_idx`(`actorUserId`, `ts`),
    INDEX `AuditLog_actorAccountId_ts_idx`(`actorAccountId`, `ts`),
    INDEX `AuditLog_action_ts_idx`(`action`, `ts`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Candidatos_deletedAt_idx` ON `Candidatos`(`deletedAt`);

-- CreateIndex
CREATE INDEX `Postulaciones_deletedAt_idx` ON `Postulaciones`(`deletedAt`);

-- CreateIndex
CREATE INDEX `Vacantes_deletedAt_idx` ON `Vacantes`(`deletedAt`);

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
