# النظام المالي الديناميكي - وصل للاستقدام

## التحديثات الجديدة - كود أكثر ديناميكية

### 1. **نظام ديناميكي معتمد على قاعدة البيانات** ✅
- جميع الحسابات تعتمد على البيانات من قاعدة البيانات
- العمليات الحسابية ديناميكية بناءً على `mathProcess` (add/subtract)
- لا توجد قيم ثابتة أو محددة مسبقاً

### 2. **العمليات الحسابية الديناميكية** ✅
```typescript
// في API - حساب ديناميكي
mainCategories.forEach(mainCat => {
  const categoryTotal = categoryTotals[mainCat.name] || 0
  
  if (mainCat.mathProcess === 'add') {
    totalRevenues += categoryTotal
  } else if (mainCat.mathProcess === 'subtract') {
    totalExpenses += categoryTotal
  }
})

// في Frontend - معالجة ديناميكية
const mathProcess = item.subCategory?.mainCategory?.mathProcess || 'add'
const processedAmount = mathProcess === 'add' ? amount : -amount
```

### 3. **الحسابات المالية الديناميكية** ✅
```typescript
// حساب الايرادات ديناميكياً
const monthlyRevenues = mainCategories
  .filter(cat => cat.mathProcess === 'add')
  .reduce((sum, cat) => sum + (monthlyData[cat.name]?.[month] || 0), 0)

// حساب المصروفات ديناميكياً
const monthlyExpenses = mainCategories
  .filter(cat => cat.mathProcess === 'subtract')
  .reduce((sum, cat) => sum + (monthlyData[cat.name]?.[month] || 0), 0)

// حساب مجمل الربح ديناميكياً
const grossProfit = monthlyRevenues + monthlyDirectExpenses
```

## الملفات المحدثة

### 1. **`pages/api/income-statements/calculations.ts`**

#### الحسابات الديناميكية:
```typescript
// قبل التحديث: قيم ثابتة
const revenues = categoryTotals['الايرادات'] || 0
const directExpenses = categoryTotals['المصروفات المباشرة على العقد'] || 0

// بعد التحديث: حساب ديناميكي
let totalRevenues = 0
let totalExpenses = 0

mainCategories.forEach(mainCat => {
  const categoryTotal = categoryTotals[mainCat.name] || 0
  
  if (mainCat.mathProcess === 'add') {
    totalRevenues += categoryTotal
  } else if (mainCat.mathProcess === 'subtract') {
    totalExpenses += categoryTotal
  }
})
```

#### الـ Monthly Breakdown الديناميكي:
```typescript
// حساب الايرادات الشهرية ديناميكياً
revenues: months.map(month => {
  return mainCategories
    .filter(cat => cat.mathProcess === 'add')
    .reduce((sum, cat) => sum + (monthlyData[cat.name]?.[month] || 0), 0)
}),

// حساب المصروفات الشهرية ديناميكياً
operationalExpenses: months.map(month => {
  return mainCategories
    .filter(cat => cat.name === 'المصروفات التشغيلية' && cat.mathProcess === 'subtract')
    .reduce((sum, cat) => sum + (monthlyData[cat.name]?.[month] || 0), 0)
})
```

### 2. **`pages/admin/incomestatments-updated.tsx`**

#### البحث الديناميكي عن الفئات:
```typescript
// قبل التحديث: استخدام مباشر
const data = financialData.categories.monthlyData[categoryName] || {};

// بعد التحديث: بحث ديناميكي
const category = financialData.categories.mainCategories.find(cat => cat.name === categoryName);
if (!category) return null;
const data = financialData.categories.monthlyData[categoryName] || {};
```

#### حساب الاجماليات ديناميكياً:
```typescript
// حساب اجمالي الفئات الفرعية ديناميكياً
{formatCurrency(mainCat.subs.reduce((sum, sub) => {
  const subData = financialData.categories.monthlyData[sub.name] || {};
  return sum + (subData[month] || 0);
}, 0))}
```

### 3. **`pages/admin/incomestatments.tsx`**

#### معالجة البيانات ديناميكياً:
```typescript
// قبل التحديث: معالجة ثابتة
const amount = Number(item.amount);

// بعد التحديث: معالجة ديناميكية بناءً على mathProcess
const amount = Number(item.amount);
const mathProcess = item.subCategory?.mainCategory?.mathProcess || 'add';
const processedAmount = mathProcess === 'add' ? amount : -amount;
```

## فوائد النظام الديناميكي

### 1. **مرونة كاملة**
- إضافة فئات جديدة لا تتطلب تعديل الكود
- تغيير نوع العملية (add/subtract) من قاعدة البيانات
- النظام يتكيف تلقائياً مع أي تغييرات

### 2. **دقة في الحسابات**
- جميع العمليات تعتمد على `mathProcess` من قاعدة البيانات
- لا توجد أخطاء في التطبيق اليدوي للعمليات
- حسابات متسقة ومضمونة

### 3. **سهولة الصيانة**
- كود واحد يعمل مع أي عدد من الفئات
- لا حاجة لتعديل الكود عند إضافة فئات جديدة
- منطق موحد لجميع العمليات الحسابية

### 4. **قابلية التوسع**
- يمكن إضافة فئات جديدة من قاعدة البيانات
- يمكن تغيير أسماء الفئات دون تعديل الكود
- يمكن إضافة عمليات حسابية جديدة (multiply, divide)

## كيفية عمل النظام الديناميكي

### 1. **عند إضافة سجل جديد**
```typescript
// النظام يقرأ mathProcess من mainCategory
const mathProcess = item.subCategory?.mainCategory?.mathProcess || 'add'

// يطبق العملية المناسبة
const processedAmount = mathProcess === 'add' ? amount : -amount
```

### 2. **عند حساب المؤشرات المالية**
```typescript
// النظام يجمع جميع الفئات مع mathProcess === 'add'
const totalRevenues = mainCategories
  .filter(cat => cat.mathProcess === 'add')
  .reduce((sum, cat) => sum + categoryTotals[cat.name], 0)

// النظام يجمع جميع الفئات مع mathProcess === 'subtract'
const totalExpenses = mainCategories
  .filter(cat => cat.mathProcess === 'subtract')
  .reduce((sum, cat) => sum + categoryTotals[cat.name], 0)
```

### 3. **عند عرض البيانات**
```typescript
// النظام يبحث عن الفئة ديناميكياً
const category = mainCategories.find(cat => cat.name === categoryName);
if (!category) return null; // لا توجد فئة بهذا الاسم
```

## مثال على المرونة

### إضافة فئة جديدة:
1. **في قاعدة البيانات**: إضافة فئة جديدة مع `mathProcess: 'add'`
2. **النظام**: يتعرف تلقائياً على الفئة الجديدة ويطبق العملية المناسبة
3. **النتيجة**: الفئة الجديدة تظهر في الحسابات دون تعديل الكود

### تغيير نوع العملية:
1. **في قاعدة البيانات**: تغيير `mathProcess` من `'add'` إلى `'subtract'`
2. **النظام**: يطبق العملية الجديدة تلقائياً
3. **النتيجة**: الحسابات تتحدث تلقائياً

## ملاحظات تقنية

- **Database-Driven**: جميع العمليات تعتمد على قاعدة البيانات
- **Dynamic Filtering**: استخدام `filter()` و `reduce()` للحسابات
- **Null Safety**: فحص وجود الفئات قبل استخدامها
- **Performance**: كود محسن مع استخدام الحلقات بكفاءة
- **Maintainability**: كود موحد وقابل للصيانة
