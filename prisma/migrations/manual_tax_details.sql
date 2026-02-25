-- ============================================================
-- إضافة جداول تفاصيل المبيعات والمشتريات + الأعمدة الجديدة
-- نفّذ هذا الملف مباشرة على قاعدة MySQL
-- ============================================================

-- 1) جدول تفاصيل المبيعات (خيارات ديناميكية)
CREATE TABLE IF NOT EXISTS `TaxSalesDetail` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `displayOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `TaxSalesDetail_displayOrder_idx` (`displayOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) جدول تفاصيل المشتريات (خيارات ديناميكية)
CREATE TABLE IF NOT EXISTS `TaxPurchaseDetail` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `displayOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `TaxPurchaseDetail_displayOrder_idx` (`displayOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) إضافة عمود الربط في جدول مبيعات الضريبة
ALTER TABLE `TaxSalesRecord`
  ADD COLUMN `salesDetailId` INT NULL AFTER `taxDeclarationId`,
  ADD INDEX `TaxSalesRecord_salesDetailId_idx` (`salesDetailId`),
  ADD CONSTRAINT `TaxSalesRecord_salesDetailId_fkey`
    FOREIGN KEY (`salesDetailId`) REFERENCES `TaxSalesDetail`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 4) إضافة عمود الربط في جدول مشتريات الضريبة
ALTER TABLE `TaxPurchaseRecord`
  ADD COLUMN `purchaseDetailId` INT NULL AFTER `taxDeclarationId`,
  ADD INDEX `TaxPurchaseRecord_purchaseDetailId_idx` (`purchaseDetailId`),
  ADD CONSTRAINT `TaxPurchaseRecord_purchaseDetailId_fkey`
    FOREIGN KEY (`purchaseDetailId`) REFERENCES `TaxPurchaseDetail`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 5) جدول الموردين (إضافة اسم مورد من الترس)
CREATE TABLE IF NOT EXISTS `TaxSupplier` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `displayOrder` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `TaxSupplier_displayOrder_idx` (`displayOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6) إضافة عمود المورد في جدول مشتريات الضريبة
ALTER TABLE `TaxPurchaseRecord`
  ADD COLUMN `supplierId` INT NULL AFTER `purchaseDetailId`,
  ADD INDEX `TaxPurchaseRecord_supplierId_idx` (`supplierId`),
  ADD CONSTRAINT `TaxPurchaseRecord_supplierId_fkey`
    FOREIGN KEY (`supplierId`) REFERENCES `TaxSupplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
