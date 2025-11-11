-- AlterTable
ALTER TABLE `Vacantes` ADD COLUMN `imagenUrl` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `ScoringConfig` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `formacionPeso` DOUBLE NOT NULL DEFAULT 0.20,
    `experienciaPeso` DOUBLE NOT NULL DEFAULT 0.30,
    `habilidadesPeso` DOUBLE NOT NULL DEFAULT 0.25,
    `competenciasPeso` DOUBLE NOT NULL DEFAULT 0.15,
    `palabrasClavePeso` DOUBLE NOT NULL DEFAULT 0.10,
    `modoIA` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ScoringConfig_tenantId_key`(`tenantId`),
    INDEX `ScoringConfig_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CandidatoScore` (
    `id` VARCHAR(191) NOT NULL,
    `candidatoId` VARCHAR(191) NOT NULL,
    `puntajeTotal` DOUBLE NOT NULL,
    `detalleJson` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CandidatoScore_candidatoId_key`(`candidatoId`),
    INDEX `CandidatoScore_puntajeTotal_idx`(`puntajeTotal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailTemplates` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `channel` VARCHAR(191) NOT NULL DEFAULT 'email',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmailTemplates_tenantId_active_idx`(`tenantId`, `active`),
    UNIQUE INDEX `EmailTemplates_tenantId_code_key`(`tenantId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AutomationRules` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `trigger` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `conditionsJson` JSON NULL,
    `actionConfigJson` JSON NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AutomationRules_tenantId_trigger_idx`(`tenantId`, `trigger`),
    INDEX `AutomationRules_tenantId_active_idx`(`tenantId`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ScoringConfig` ADD CONSTRAINT `ScoringConfig_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CandidatoScore` ADD CONSTRAINT `CandidatoScore_candidatoId_fkey` FOREIGN KEY (`candidatoId`) REFERENCES `Candidatos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmailTemplates` ADD CONSTRAINT `EmailTemplates_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AutomationRules` ADD CONSTRAINT `AutomationRules_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
