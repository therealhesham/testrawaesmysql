-- إضافة clientId لربط externalHomedmaid بالعميل (عميل التسكين الخارجي)
-- نفّذ هذه الأوامر يدوياً في MySQL

ALTER TABLE externalHomedmaid ADD COLUMN clientId INT NULL;
ALTER TABLE externalHomedmaid ADD CONSTRAINT FK_externalHomedmaid_Client FOREIGN KEY (clientId) REFERENCES Client(id);
