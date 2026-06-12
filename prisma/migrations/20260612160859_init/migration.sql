-- CreateTable
CREATE TABLE `Role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `permissions` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Role_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `email` VARCHAR(200) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `realName` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NULL,
    `avatar` VARCHAR(500) NULL,
    `roleId` INTEGER NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `lastLogin` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_roleId_idx`(`roleId`),
    INDEX `User_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Location` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `description` TEXT NULL,
    `address` VARCHAR(500) NULL,
    `contactName` VARCHAR(100) NULL,
    `contactPhone` VARCHAR(20) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Location_code_key`(`code`),
    INDEX `Location_type_idx`(`type`),
    INDEX `Location_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Goods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `locationId` INTEGER NULL,
    `minTemp` DOUBLE NOT NULL DEFAULT -25,
    `maxTemp` DOUBLE NOT NULL DEFAULT 4,
    `minHumidity` DOUBLE NULL,
    `maxHumidity` DOUBLE NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Goods_code_key`(`code`),
    INDEX `Goods_locationId_idx`(`locationId`),
    INDEX `Goods_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sensor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `sensorType` VARCHAR(30) NOT NULL DEFAULT 'temperature',
    `locationId` INTEGER NOT NULL,
    `goodsId` INTEGER NULL,
    `model` VARCHAR(100) NULL,
    `manufacturer` VARCHAR(200) NULL,
    `installDate` DATETIME(3) NULL,
    `minTemp` DOUBLE NOT NULL DEFAULT -30,
    `maxTemp` DOUBLE NOT NULL DEFAULT 10,
    `warningMin` DOUBLE NOT NULL DEFAULT -25,
    `warningMax` DOUBLE NOT NULL DEFAULT 4,
    `currentTemp` DOUBLE NULL,
    `lastUpdate` DATETIME(3) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'online',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Sensor_code_key`(`code`),
    INDEX `Sensor_locationId_idx`(`locationId`),
    INDEX `Sensor_goodsId_idx`(`goodsId`),
    INDEX `Sensor_status_idx`(`status`),
    INDEX `Sensor_lastUpdate_idx`(`lastUpdate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TemperatureRecord` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `sensorId` INTEGER NOT NULL,
    `temperature` DECIMAL(5, 2) NOT NULL,
    `humidity` DECIMAL(5, 2) NULL,
    `recordTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isAbnormal` BOOLEAN NOT NULL DEFAULT false,
    `abnormalType` VARCHAR(30) NULL,
    `locationId` INTEGER NULL,

    INDEX `TemperatureRecord_sensorId_idx`(`sensorId`),
    INDEX `TemperatureRecord_recordTime_idx`(`recordTime`),
    INDEX `TemperatureRecord_isAbnormal_idx`(`isAbnormal`),
    INDEX `TemperatureRecord_locationId_recordTime_idx`(`locationId`, `recordTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Alert` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sensorId` INTEGER NOT NULL,
    `alertType` VARCHAR(50) NOT NULL,
    `level` VARCHAR(20) NOT NULL DEFAULT 'warning',
    `title` VARCHAR(300) NOT NULL,
    `content` TEXT NULL,
    `temperature` DECIMAL(5, 2) NOT NULL,
    `thresholdMin` DECIMAL(5, 2) NULL,
    `thresholdMax` DECIMAL(5, 2) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `notifSys` BOOLEAN NOT NULL DEFAULT true,
    `notifEmail` BOOLEAN NOT NULL DEFAULT false,
    `notifSms` BOOLEAN NOT NULL DEFAULT false,
    `createdById` INTEGER NOT NULL,
    `handledAt` DATETIME(3) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Alert_sensorId_idx`(`sensorId`),
    INDEX `Alert_level_idx`(`level`),
    INDEX `Alert_status_idx`(`status`),
    INDEX `Alert_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkOrder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `title` VARCHAR(300) NOT NULL,
    `description` TEXT NULL,
    `alertId` INTEGER NULL,
    `status` ENUM('PENDING', 'ASSIGNED', 'PROCESSING', 'COMPLETED', 'CLOSED') NOT NULL DEFAULT 'PENDING',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `assigneeId` INTEGER NULL,
    `creatorId` INTEGER NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `assignedAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WorkOrder_code_key`(`code`),
    INDEX `WorkOrder_alertId_idx`(`alertId`),
    INDEX `WorkOrder_assigneeId_idx`(`assigneeId`),
    INDEX `WorkOrder_status_idx`(`status`),
    INDEX `WorkOrder_priority_idx`(`priority`),
    INDEX `WorkOrder_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkOrderRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `workOrderId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WorkOrderRecord_workOrderId_idx`(`workOrderId`),
    INDEX `WorkOrderRecord_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkOrderAttachment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `workOrderId` INTEGER NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `filePath` VARCHAR(500) NOT NULL,
    `fileType` VARCHAR(100) NULL,
    `fileSize` INTEGER NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WorkOrderAttachment_workOrderId_idx`(`workOrderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AlertSubscription` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `sensorId` INTEGER NOT NULL,
    `notifySys` BOOLEAN NOT NULL DEFAULT true,
    `notifyEmail` BOOLEAN NOT NULL DEFAULT false,
    `notifySms` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AlertSubscription_userId_idx`(`userId`),
    INDEX `AlertSubscription_sensorId_idx`(`sensorId`),
    UNIQUE INDEX `AlertSubscription_userId_sensorId_key`(`userId`, `sensorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComplianceReport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reportMonth` VARCHAR(7) NOT NULL,
    `locationId` INTEGER NULL,
    `locationName` VARCHAR(200) NULL,
    `goodsType` VARCHAR(50) NULL,
    `sensorId` INTEGER NULL,
    `sensorName` VARCHAR(200) NULL,
    `totalDuration` INTEGER NOT NULL DEFAULT 0,
    `compliantDuration` INTEGER NOT NULL DEFAULT 0,
    `complianceRate` DOUBLE NOT NULL DEFAULT 0,
    `alertCount` INTEGER NOT NULL DEFAULT 0,
    `abnormalMinutes` INTEGER NOT NULL DEFAULT 0,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ComplianceReport_reportMonth_idx`(`reportMonth`),
    INDEX `ComplianceReport_locationId_idx`(`locationId`),
    INDEX `ComplianceReport_sensorId_idx`(`sensorId`),
    UNIQUE INDEX `ComplianceReport_reportMonth_locationId_goodsType_sensorId_key`(`reportMonth`, `locationId`, `goodsType`, `sensorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemLog` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `username` VARCHAR(100) NULL,
    `action` VARCHAR(100) NOT NULL,
    `module` VARCHAR(50) NULL,
    `details` JSON NULL,
    `ipAddress` VARCHAR(45) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SystemLog_userId_idx`(`userId`),
    INDEX `SystemLog_action_idx`(`action`),
    INDEX `SystemLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Goods` ADD CONSTRAINT `Goods_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sensor` ADD CONSTRAINT `Sensor_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sensor` ADD CONSTRAINT `Sensor_goodsId_fkey` FOREIGN KEY (`goodsId`) REFERENCES `Goods`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TemperatureRecord` ADD CONSTRAINT `TemperatureRecord_sensorId_fkey` FOREIGN KEY (`sensorId`) REFERENCES `Sensor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_sensorId_fkey` FOREIGN KEY (`sensorId`) REFERENCES `Sensor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkOrder` ADD CONSTRAINT `WorkOrder_alertId_fkey` FOREIGN KEY (`alertId`) REFERENCES `Alert`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkOrder` ADD CONSTRAINT `WorkOrder_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkOrder` ADD CONSTRAINT `WorkOrder_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkOrderRecord` ADD CONSTRAINT `WorkOrderRecord_workOrderId_fkey` FOREIGN KEY (`workOrderId`) REFERENCES `WorkOrder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkOrderRecord` ADD CONSTRAINT `WorkOrderRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkOrderAttachment` ADD CONSTRAINT `WorkOrderAttachment_workOrderId_fkey` FOREIGN KEY (`workOrderId`) REFERENCES `WorkOrder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
