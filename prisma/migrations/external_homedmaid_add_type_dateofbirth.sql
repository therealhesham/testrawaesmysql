-- أضف الحقول type و dateofbirth و phone لجدول externalHomedmaid
-- نفّذ هذه الأوامر يدوياً في MySQL
-- إذا تم تنفيذ type و dateofbirth مسبقاً، نفّذ أمر phone فقط

ALTER TABLE externalHomedmaid ADD COLUMN type VARCHAR(50) NULL COMMENT 'recruitment | rental';
ALTER TABLE externalHomedmaid ADD COLUMN dateofbirth DATETIME NULL;
ALTER TABLE externalHomedmaid ADD COLUMN phone VARCHAR(20) NULL;
