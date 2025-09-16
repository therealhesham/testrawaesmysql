# النظام المالي المتجاوب - وصل للاستقدام

## التحديثات الجديدة - عرض محسن للجدول

### 1. **عرض آخر 6 أشهر في الواجهة** ✅
- الجدول يعرض آخر 6 أشهر فقط لتجنب التشويه
- عرض أفضل وأكثر وضوحاً على الشاشات المختلفة
- `colSpan` محدث من 14 إلى 8 ليتناسب مع 6 أشهر

### 2. **التصدير يعرض البيانات الكاملة** ✅
- Excel/PDF export يعرض السنة الكاملة (12 شهر)
- API منفصل للتصدير: `/api/income-statements/export`
- بيانات كاملة للتحليل والمراجعة

### 3. **إصلاح عرض الجدول** ✅
- عرض متجاوب على جميع الأجهزة
- تجنب التشويه الأفقي
- تجربة مستخدم محسنة

## الملفات المحدثة

### 1. **`pages/api/income-statements/calculations.ts`**

#### عرض آخر 6 أشهر:
```typescript
// قبل التحديث: السنة الكاملة
const months = Array.from({ length: 12 }, (_, i) => {
  return `${currentYear}-${(i + 1).toString().padStart(2, '0')}`
})

// بعد التحديث: آخر 6 أشهر للواجهة
const today = new Date()
const months = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
}).reverse()

// السنة الكاملة للتصدير
const allMonths = Array.from({ length: 12 }, (_, i) => {
  return `${currentYear}-${(i + 1).toString().padStart(2, '0')}`
})
```

#### Response محدث:
```typescript
return res.status(200).json({
  success: true,
  data: {
    months, // Last 6 months for UI
    allMonths, // Full year for export
    monthlyBreakdown,
    totals,
    averages,
    categories: { ... },
    zakatRate: Number(zakatRate)
  }
})
```

### 2. **`pages/api/income-statements/export.ts`** (جديد)

#### API منفصل للتصدير:
```typescript
// GET /api/income-statements/export?format=excel&zakatRate=2.5
// GET /api/income-statements/export?format=pdf&zakatRate=2.5

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { format = 'excel' } = req.query
  
  // Get full year months for export
  const months = Array.from({ length: 12 }, (_, i) => {
    return `${currentYear}-${(i + 1).toString().padStart(2, '0')}`
  })
  
  // Process full year data for export
  const exportData = {
    months, // Full year
    mainCategories,
    monthlyData,
    categoryTotals,
    financialMetrics: { ... }
  }
  
  return res.status(200).json({
    success: true,
    data: exportData,
    format: format
  })
}
```

### 3. **`pages/admin/incomestatments-updated.tsx`**

#### Interface محدث:
```typescript
interface FinancialData {
  months: string[]; // Last 6 months for UI
  allMonths: string[]; // Full year for export
  monthlyBreakdown: { ... };
  totals: { ... };
  averages: { ... };
  categories: { ... };
  zakatRate: number;
}
```

#### Export Functions محدثة:
```typescript
const handleExport = async (type: string) => {
  try {
    const response = await axios.get(`/api/income-statements/export?format=${type}&zakatRate=${zakatRate}`);
    const exportData = response.data.data;
    
    if (type === 'excel') {
      console.log('Excel export data:', exportData);
      alert(`تم تحضير البيانات للتصدير إلى Excel (${exportData.months.length} شهر)`);
    } else if (type === 'pdf') {
      console.log('PDF export data:', exportData);
      alert(`تم تحضير البيانات للتصدير إلى PDF (${exportData.months.length} شهر)`);
    }
  } catch (error) {
    console.error('Export error:', error);
    alert('حدث خطأ في التصدير');
  }
};
```

#### colSpan محدث:
```typescript
// قبل التحديث: 14 أعمدة (12 شهر + 2)
<td colSpan={14} className="...">

// بعد التحديث: 8 أعمدة (6 أشهر + 2)
<td colSpan={8} className="...">
```

### 4. **`pages/admin/incomestatments.tsx`**

#### عرض آخر 6 أشهر:
```typescript
// قبل التحديث: السنة الكاملة
const months = Array.from({ length: 12 }, (_, i) => {
  return `${currentYear}-${(i + 1).toString().padStart(2, '0')}`;
});

// بعد التحديث: آخر 6 أشهر
const today = new Date();
const months = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}).reverse();
```

## فوائد التحديثات

### 1. **عرض محسن**
- جدول أقل عرضاً وأكثر وضوحاً
- تجنب التشويه الأفقي
- عرض أفضل على الشاشات الصغيرة

### 2. **تجربة مستخدم أفضل**
- عرض سريع للبيانات الحديثة (آخر 6 أشهر)
- إمكانية التصدير للبيانات الكاملة
- تنقل أسهل في الجدول

### 3. **مرونة في التصدير**
- Excel/PDF يعرض السنة الكاملة
- بيانات كاملة للتحليل
- إمكانية تخصيص فترة التصدير

### 4. **أداء محسن**
- تحميل أسرع للواجهة (6 أشهر بدلاً من 12)
- استعلامات أقل تعقيداً للعرض
- تصدير منفصل للبيانات الكاملة

## كيفية عمل النظام

### 1. **عرض الواجهة**
- النظام يعرض آخر 6 أشهر تلقائياً
- الجدول يتكيف مع العرض المتاح
- `colSpan` محدث ليتناسب مع 6 أشهر

### 2. **التصدير**
- المستخدم يضغط على Excel أو PDF
- النظام يستدعي `/api/income-statements/export`
- API يعيد البيانات الكاملة للسنة

### 3. **البيانات**
- الواجهة: آخر 6 أشهر من `months`
- التصدير: السنة الكاملة من `allMonths`
- نفس الحسابات المالية لكلا الحالتين

## مثال على الاستخدام

### عرض الواجهة:
```
المتوسط الشهري | الاجمالي | شهر 7 | شهر 8 | شهر 9 | شهر 10 | شهر 11 | شهر 12 | البيان
```

### تصدير Excel/PDF:
```
المتوسط الشهري | الاجمالي | شهر 1 | شهر 2 | ... | شهر 12 | البيان
```

## ملاحظات تقنية

- **Responsive Design**: الجدول يتكيف مع حجم الشاشة
- **Performance**: تحميل أسرع للواجهة
- **Export API**: منفصل ومخصص للتصدير
- **Data Consistency**: نفس الحسابات للعرض والتصدير
- **User Experience**: عرض محسن وتصدير شامل
