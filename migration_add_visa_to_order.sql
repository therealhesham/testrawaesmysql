-- =====================================================
-- Migration: Add visa relation to neworder table
-- =====================================================
-- هذا الملف يحتوي على الأوامر SQL لإضافة علاقة التأشيرة بجدول الطلبات

-- الخطوة 1: إضافة عمود visaId إلى جدول neworder
ALTER TABLE `neworder` 
ADD COLUMN `visaId` INT NULL AFTER `clientAccountStatement`;

-- الخطوة 2: إضافة مفتاح أجنبي (Foreign Key) لربط الطلب بالتأشيرة
ALTER TABLE `neworder` 
ADD CONSTRAINT `neworder_visaId_fkey` 
FOREIGN KEY (`visaId`) 
REFERENCES `visa`(`id`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- الخطوة 3: إضافة فهرس (Index) على عمود visaId لتحسين الأداء
ALTER TABLE `neworder` 
ADD INDEX `neworder_visaId_idx` (`visaId`);

-- =====================================================
-- ملاحظات مهمة:
-- =====================================================
-- 1. تأكد من عمل backup للقاعدة قبل تنفيذ الأوامر
-- 2. هذه الأوامر آمنة ولن تحذف أي بيانات موجودة
-- 3. العمود visaId يقبل NULL لذا الطلبات القديمة لن تتأثر
-- 4. يمكنك تنفيذ الأوامر واحدة تلو الأخرى أو كلها مرة واحدة
-- =====================================================

-- للتحقق من نجاح التعديلات، استخدم:
-- DESCRIBE neworder;
-- SHOW CREATE TABLE neworder;

