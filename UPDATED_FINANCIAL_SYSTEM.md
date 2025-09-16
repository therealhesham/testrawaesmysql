# نظام القائمة المالية المحدث - وصل للاستقدام

## التحديثات الجديدة

### 1. **كود أقل ديناميكية وأكثر تحديداً** ✅
- تم تحديد الفئات المالية بشكل صريح بدلاً من الاعتماد على الحلقات الديناميكية
- الحسابات تعتمد على أسماء الفئات المحددة مسبقاً:
  - `الايرادات` (mathProcess: "add")
  - `المصروفات المباشرة على العقد` (mathProcess: "subtract")
  - `المصروفات التشغيلية` (mathProcess: "subtract")
  - `المصروفات الاخرى التشغيلية` (mathProcess: "subtract")

### 2. **استخدام mathProcess من mainCategory** ✅
```typescript
// في API
const mathProcess = item.subCategory?.mainCategory?.mathProcess || 'add'
const processedAmount = mathProcess === 'add' ? amount : -amount

// الحسابات تعتمد على mathProcess
const grossProfit = revenues + directExpenses // directExpenses سالبة من mathProcess
const totalOperationalExpenses = operationalExpenses + otherOperationalExpenses // كلاهما سالب
const netProfitBeforeZakat = grossProfit + totalOperationalExpenses
```

### 3. **عرض أشهر السنة الحالية (يناير - ديسمبر)** ✅
- **API**: يعرض 12 شهر من السنة الحالية بدلاً من آخر 5 أشهر
- **Frontend**: الجدول يعرض 12 عمود للشهور
- **colSpan**: تم تحديثه من 8 إلى 14 ليتناسب مع 12 شهر + عمودين إضافيين

## الملفات المحدثة

### 1. **`pages/api/income-statements/calculations.ts`**
```typescript
// قبل التحديث: آخر 5 أشهر
const months = Array.from({ length: 5 }, (_, i) => {
  const d = new Date(currentYear, currentMonth - i, 1);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}).reverse();

// بعد التحديث: السنة الحالية كاملة
const currentYear = new Date().getFullYear()
const months = Array.from({ length: 12 }, (_, i) => {
  return `${currentYear}-${(i + 1).toString().padStart(2, '0')}`;
});
```

### 2. **`pages/admin/incomestatments.tsx`**
- تحديث `calculateMonthlyData()` لتعرض 12 شهر
- تحديث `colSpan` من 8 إلى 14
- تحديث صف "عدد العقود" ليعرض 12 شهر

### 3. **`pages/admin/incomestatments-updated.tsx`**
- استخدام الـ API الجديد مع 12 شهر
- تحديث جميع `colSpan` لتتناسب مع 12 شهر
- عرض البيانات الحقيقية من الـ API

## الحسابات المالية المحدثة

### منطق الحساب الجديد:
```typescript
// 1. معالجة البيانات حسب mathProcess
const processedAmount = mathProcess === 'add' ? amount : -amount

// 2. حساب المؤشرات المالية
const revenues = categoryTotals['الايرادات'] || 0                    // موجب
const directExpenses = categoryTotals['المصروفات المباشرة على العقد'] || 0  // سالب
const operationalExpenses = categoryTotals['المصروفات التشغيلية'] || 0      // سالب
const otherOperationalExpenses = categoryTotals['المصروفات الاخرى التشغيلية'] || 0 // سالب

// 3. الحسابات النهائية
const grossProfit = revenues + directExpenses
const totalOperationalExpenses = operationalExpenses + otherOperationalExpenses
const netProfitBeforeZakat = grossProfit + totalOperationalExpenses
const zakatAmount = Math.max(0, netProfitBeforeZakat * (zakatRate / 100))
const netProfitAfterZakat = netProfitBeforeZakat - zakatAmount
```

## فوائد التحديثات

### 1. **أداء أفضل**
- كود أقل ديناميكية = معالجة أسرع
- تحديد صريح للفئات = استعلامات أكثر كفاءة

### 2. **دقة أكبر**
- الاعتماد على `mathProcess` من قاعدة البيانات
- حسابات مالية صحيحة ومتسقة

### 3. **عرض شامل**
- عرض السنة الكاملة (12 شهر)
- رؤية أفضل للاتجاهات المالية السنوية

### 4. **سهولة الصيانة**
- كود أكثر وضوحاً ومحدداً
- أقل تعقيداً في الفهم والتطوير

## كيفية الاستخدام

### 1. **إضافة سجل جديد**
- النظام يعتمد على `mathProcess` من `mainCategory`
- الحسابات تتم تلقائياً حسب نوع العملية

### 2. **عرض البيانات**
- الجدول يعرض 12 شهر من السنة الحالية
- البيانات الحقيقية من قاعدة البيانات
- حسابات صحيحة للزكاة

### 3. **تعديل نسبة الزكاة**
- يمكن تعديل النسبة في الوقت الفعلي
- إعادة حساب تلقائية لجميع المؤشرات

## ملاحظات تقنية

- **colSpan**: تم تحديثه من 8 إلى 14 (12 شهر + عمودين)
- **API Response**: يحتوي على 12 شهر بدلاً من 5
- **Database**: يعتمد على `mathProcess` في `mainCategory`
- **Performance**: كود أقل ديناميكية = أداء أفضل
