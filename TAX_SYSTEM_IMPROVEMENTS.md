# تحسينات النظام الضريبي - Tax System Improvements

## المشاكل الحالية والحلول المقترحة

### 1. تصنيف المبيعات - Sales Classification
**المشكلة**: لا يتم تصنيف المبيعات بشكل تلقائي حسب الفئات المطلوبة
**الحل المقترح**:
- إضافة حقل `salesType` في `TaxSalesRecord`:
  - `standard` - مبيعات خاضعة للنسبة الأساسية 15%
  - `citizen_services` - خدمات المواطنين (صحة، تعليم، مسكن أول)
  - `zero_rated_domestic` - مبيعات داخلية بنسبة صفر
  - `exports` - صادرات
  - `cancelled` - مبيعات ملغاة

### 2. تمييز العملاء - Customer Classification
**المشكلة**: لا يوجد تمييز بين العملاء المحليين والدوليين
**الحل المقترح**:
- إضافة حقل `customerType` في نموذج `Client`:
  - `local` - عميل محلي
  - `international` - عميل دولي
  - `gcc` - عميل خليجي

### 3. تصنيف المشتريات - Purchase Classification
**المشكلة**: التصنيف يعتمد على النص فقط
**الحل المقترح**:
- إضافة حقل `purchaseType` في `TaxPurchaseRecord`:
  - `standard` - مشتريات خاضعة للنسبة الأساسية
  - `customs_paid` - توريدات مسددة للجمارك
  - `reverse_charge` - احتساب عكسي
  - `zero_rated` - نسبة صفر
  - `exempt` - معفاة

### 4. الفترات الضريبية - Tax Periods
**المشكلة**: لا يوجد ربط واضح بين السجلات والفترات الضريبية
**الحل المقترح**:
- تفعيل استخدام `taxDeclarationId` في السجلات
- إنشاء إقرار ضريبي شهري تلقائياً

### 5. التصحيحات والترحيل - Corrections and Carryforward
**المشكلة**: لا يوجد دعم لتصحيحات الفترة السابقة أو ترحيل الضريبة
**الحل المقترح**:
- إضافة جدول `TaxCorrection` للتصحيحات
- إضافة حقل `carryForwardAmount` في `TaxDeclaration`

## التعديلات المطلوبة على Schema

```prisma
// تحديث نموذج Client
model Client {
  // ... existing fields ...
  customerType     String?   @default("local") @db.VarChar(50) // local, international, gcc
  taxNumber        String?   @db.VarChar(100) // الرقم الضريبي
  isVATRegistered  Boolean   @default(true) // هل مسجل في ضريبة القيمة المضافة
}

// تحديث نموذج TaxSalesRecord
model TaxSalesRecord {
  // ... existing fields ...
  salesType        String?   @db.VarChar(50) // standard, citizen_services, zero_rated_domestic, exports, cancelled
  isExport         Boolean   @default(false) // للتمييز بين الصادرات والمبيعات المحلية
  exportCountry    String?   @db.VarChar(100) // بلد التصدير
  serviceType      String?   @db.VarChar(100) // healthcare, education, first_home
}

// تحديث نموذج TaxPurchaseRecord  
model TaxPurchaseRecord {
  // ... existing fields ...
  purchaseType     String?   @db.VarChar(50) // standard, customs_paid, reverse_charge, zero_rated, exempt
  supplierTaxNumber String?  @db.VarChar(100) // الرقم الضريبي للمورد
  isImport         Boolean   @default(false) // هل عملية استيراد
  importCountry    String?   @db.VarChar(100) // بلد الاستيراد
}

// تحديث نموذج TaxDeclaration
model TaxDeclaration {
  // ... existing fields ...
  carryForwardAmount  Decimal  @default(0) // المبلغ المرحل من الفترة السابقة
  previousPeriodCorrection Decimal @default(0) // تصحيحات الفترة السابقة
  finalTaxDue         Decimal  @default(0) // صافي الضريبة المستحقة النهائية
  submissionDate      DateTime? // تاريخ تقديم الإقرار
  referenceNumber     String?   @db.VarChar(100) // رقم مرجعي من الهيئة
}
```

## التحسينات في واجهة المستخدم

### 1. إضافة المبيعات/المشتريات
- إضافة قائمة منسدلة لتحديد نوع المبيعة/المشترى
- إضافة خيار لتحديد إذا كانت صادرات/واردات
- إضافة حقل الرقم الضريبي

### 2. التقارير
- إضافة تقرير مفصل حسب أنواع المبيعات
- تقرير الصادرات منفصل
- تقرير المشتريات حسب النوع

### 3. التحقق من الصحة
- التحقق من أن نسبة الضريبة تتوافق مع نوع المعاملة
- التحقق من اكتمال البيانات المطلوبة للإقرار

## متطلبات الامتثال للهيئة العامة للزكاة والضريبة والجمارك

1. **الفترة الضريبية**: يجب أن تكون شهرية
2. **موعد التقديم**: خلال 28 يوم من نهاية الشهر
3. **البيانات المطلوبة**:
   - إجمالي المبيعات حسب كل فئة
   - إجمالي المشتريات حسب كل فئة
   - صافي الضريبة المستحقة
   - التصحيحات والترحيلات

## الخطوات التالية

1. تحديث قاعدة البيانات بالحقول الجديدة
2. تحديث واجهات المستخدم لدعم التصنيفات الجديدة
3. تحديث API endpoints لدعم التصنيفات
4. إضافة تقارير مفصلة حسب المتطلبات
5. إضافة آلية للتحقق من صحة البيانات
