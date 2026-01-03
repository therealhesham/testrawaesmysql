-- =====================================================
-- Rollback Migration: Remove visa relation from neworder
-- =====================================================
-- استخدم هذا الملف فقط إذا أردت التراجع عن التعديلات

-- الخطوة 1: حذف المفتاح الأجنبي
ALTER TABLE `neworder` 
DROP FOREIGN KEY `neworder_visaId_fkey`;

-- الخطوة 2: حذف الفهرس
ALTER TABLE `neworder` 
DROP INDEX `neworder_visaId_idx`;

-- الخطوة 3: حذف العمود
ALTER TABLE `neworder` 
DROP COLUMN `visaId`;

-- =====================================================
-- تحذير: هذا سيحذف جميع الربطات بين الطلبات والتأشيرات
-- =====================================================

