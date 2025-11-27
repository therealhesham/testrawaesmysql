-- إضافة حقل customTimelineStages من نوع JSON في جدول arrivallist
ALTER TABLE `arrivallist` 
ADD COLUMN `customTimelineStages` JSON NULL 
COMMENT 'حالات المراحل المخصصة: {fieldName: {completed: boolean, date: DateTime}}';

