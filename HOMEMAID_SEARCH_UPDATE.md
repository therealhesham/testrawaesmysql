# تحديث نظام البحث - البحث في جدول العاملات

## التعديلات المطبقة

### 1. **إنشاء API جديد للبحث في جدول العاملات**:

#### **API الجديد**: `/api/homemaids/search`
```typescript
// البحث في جدول homemaid
const homemaids = await prisma.homemaid.findMany({
  where: {
    OR: [
      { id: parseInt(search) || undefined },
      { Name: { contains: search } },
      { Passportnumber: { contains: search } },
      { phone: { contains: search } }
    ],
    bookingstatus: { not: "booked" } // فقط العاملات المتاحة
  }
});
```

#### **معايير البحث**:
- **رقم العاملة** (ID)
- **اسم العاملة** (Name)
- **رقم الجواز** (Passportnumber)
- **رقم الهاتف** (phone)

#### **فلترة النتائج**:
- عرض العاملات المتاحة فقط (غير محجوزة)
- ترتيب حسب تاريخ الإنشاء
- حد أقصى 10 نتائج

### 2. **تحديث نظام البحث في الواجهة**:

#### **API المستخدم**:
```typescript
// البحث المحدث - جدول العاملات
const searchWorkers = async (searchTerm: string) => {
  const response = await fetch(`/api/homemaids/search?search=${encodeURIComponent(searchTerm)}&limit=10`);
  const data = await response.json();
  setWorkerSuggestions(data.homemaids || []);
};
```

#### **تحسينات البحث**:
- بحث فوري أثناء الكتابة
- مؤشر تحميل واضح
- إغلاق تلقائي للنتائج

### 3. **تحسينات عرض النتائج**:

#### **في قائمة البحث**:
```typescript
// عرض معلومات العاملة في النتائج
<div className="font-medium text-sm">عاملة #{worker.id}</div>
<div className="text-xs text-gray-600">الاسم: {worker.name}</div>
<div className="text-xs text-gray-600">الجنسية: {worker.nationality}</div>
<div className="text-xs text-gray-500">رقم الجواز: {worker.passportNumber}</div>
<div className="text-xs text-gray-500">العمر: {worker.age} سنة</div>
```

#### **في العاملة المختارة**:
```typescript
// عرض العاملة المختارة
<div className="text-sm text-green-700">#{selectedWorker.id} - {selectedWorker.name}</div>
<div className="text-xs text-green-600">الجنسية: {selectedWorker.nationality}</div>
<div className="text-xs text-green-600">رقم الجواز: {selectedWorker.passportNumber}</div>
<div className="text-xs text-green-600">العمر: {selectedWorker.age} سنة</div>
```

### 4. **تحسينات البيانات المعروضة**:

#### **معلومات العاملة**:
- **رقم العاملة**: ID
- **الاسم**: Name
- **الجنسية**: Nationalitycopy
- **رقم الجواز**: Passportnumber
- **العمر**: age
- **الخبرة**: ExperienceYears
- **الدين**: Religion
- **المكتب**: office
- **البلد**: country

#### **حقول النموذج**:
- **اسم العاملة**: يتم ملؤها تلقائياً
- **الجنسية**: يتم ملؤها تلقائياً
- **رقم الجواز**: متاح في البيانات
- **العمر**: متاح في البيانات

### 5. **تحسينات واجهة المستخدم**:

#### **حقل البحث**:
- placeholder واضح: "ابحث برقم العاملة أو الاسم أو رقم الجواز"
- تصميم محسن مع خلفية رمادية
- مؤشر تحميل في المكان المناسب

#### **نتائج البحث**:
- عرض مفصل للمعلومات
- تنسيق واضح ومنظم
- hover effects للتفاعل

#### **العاملة المختارة**:
- مربع أخضر مع حدود
- معلومات شاملة
- زر إزالة واضح

### 6. **إدارة الحالة المحسنة**:

#### **States المحدثة**:
```typescript
const [selectedWorker, setSelectedWorker] = useState<any>(null);
const [workerSearchTerm, setWorkerSearchTerm] = useState('');
const [workerSuggestions, setWorkerSuggestions] = useState<any[]>([]);
const [isSearching, setIsSearching] = useState(false);
```

#### **دوال البحث**:
```typescript
// معالجة البحث
const handleWorkerSearch = (value: string) => {
  setWorkerSearchTerm(value);
  if (value.trim()) {
    searchWorkers(value);
  } else {
    setWorkerSuggestions([]);
    setSelectedWorker(null);
  }
};

// اختيار العاملة
const handleWorkerSelection = (worker: any) => {
  setSelectedWorker(worker);
  setWorkerSearchTerm(worker.name || '');
  setWorkerSuggestions([]);
};
```

### 7. **تحسينات الأداء**:

#### **البحث السريع**:
- استخدام Prisma OR للبحث المتعدد
- فهرسة محسنة للبحث
- حد أقصى للنتائج

#### **الاستجابة**:
- بحث فوري أثناء الكتابة
- مؤشر تحميل واضح
- إغلاق تلقائي للنتائج

### 8. **التحقق من البيانات**:

#### **البيانات المطلوبة**:
- رقم العاملة أو الاسم
- الجنسية
- رقم الجواز
- العمر

#### **التحقق من التوفر**:
- عرض العاملات المتاحة فقط
- فلترة حسب حالة الحجز
- ترتيب حسب الأهمية

## الميزات الجديدة

### ✅ **بحث محسن في جدول العاملات**:
- بحث متعدد المعايير
- نتائج دقيقة ومفصلة
- فلترة ذكية للنتائج

### ✅ **عرض معلومات شامل**:
- معلومات كاملة عن العاملة
- تنسيق واضح ومنظم
- تفاعل سلس وسهل

### ✅ **إدارة حالة محسنة**:
- حفظ الاختيار
- إمكانية التعديل
- إغلاق تلقائي

### ✅ **تحسينات الأداء**:
- بحث سريع
- استجابة فورية
- تحميل محسن

## كيفية الاستخدام

### **للمستخدم**:
1. فتح مودال تسكين العاملة
2. كتابة رقم العاملة أو الاسم أو رقم الجواز
3. اختيار العاملة من النتائج
4. مراجعة المعلومات المعروضة
5. إكمال باقي البيانات

### **للمطور**:
- استخدام API الجديد `/api/homemaids/search`
- تطبيق نفس آلية إدارة الحالة
- استخدام نفس التصميمات

## التحسينات المستقبلية

1. **إضافة فلترة متقدمة** (الجنسية، العمر، الخبرة)
2. **تحسين سرعة البحث** مع debouncing
3. **إضافة keyboard navigation** للقوائم
4. **تحسين UX** مع loading states
5. **إضافة validation** للبيانات المطلوبة
