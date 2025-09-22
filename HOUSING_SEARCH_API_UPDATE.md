# تحديث API البحث - ملف منفصل لصفحة التسكين

## التعديلات المطبقة

### 1. **إنشاء API منفصل لصفحة التسكين**:

#### **API الجديد**: `/api/housing/search-workers`
- ملف منفصل خاص بصفحة التسكين
- لا يؤثر على APIs أخرى في النظام
- مخصص للبحث في جدول العاملات

#### **المسار الجديد**:
```
pages/api/housing/search-workers.ts
```

### 2. **ميزات API الجديد**:

#### **البحث المتقدم**:
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
- عرض العاملات المتاحة فقط
- ترتيب حسب تاريخ الإنشاء
- حد أقصى 10 نتائج

### 3. **تحديث نظام البحث في الواجهة**:

#### **API المستخدم**:
```typescript
// البحث المحدث - API منفصل
const searchWorkers = async (searchTerm: string) => {
  const response = await fetch(`/api/housing/search-workers?search=${encodeURIComponent(searchTerm)}&limit=10`);
  const data = await response.json();
  setWorkerSuggestions(data.homemaids || []);
};
```

#### **المزايا**:
- API منفصل ومستقل
- لا يؤثر على APIs أخرى
- مخصص لصفحة التسكين

### 4. **هيكل البيانات**:

#### **الاستجابة**:
```typescript
{
  success: true,
  homemaids: [
    {
      id: number,
      name: string,
      nationality: string,
      passportNumber: string,
      phone: string,
      age: number,
      experience: string,
      religion: string,
      office: string,
      country: string,
      picture: string,
      bookingStatus: string,
      createdAt: Date
    }
  ],
  total: number
}
```

#### **المعلومات المعروضة**:
- **رقم العاملة**: ID
- **الاسم**: Name
- **الجنسية**: Nationalitycopy
- **رقم الجواز**: Passportnumber
- **العمر**: age
- **الخبرة**: ExperienceYears
- **الدين**: Religion
- **المكتب**: office
- **البلد**: country

### 5. **تحسينات الأداء**:

#### **البحث السريع**:
- استخدام Prisma OR للبحث المتعدد
- فهرسة محسنة للبحث
- حد أقصى للنتائج

#### **الاستجابة**:
- بحث فوري أثناء الكتابة
- مؤشر تحميل واضح
- إغلاق تلقائي للنتائج

### 6. **إدارة الأخطاء**:

#### **التحقق من البيانات**:
```typescript
if (!search || typeof search !== 'string') {
  return res.status(400).json({ message: 'Search term is required' });
}
```

#### **معالجة الأخطاء**:
```typescript
catch (error) {
  console.error("Error searching homemaids:", error);
  res.status(500).json({ 
    success: false,
    message: "Internal Server Error" 
  });
}
```

### 7. **التحسينات المستقبلية**:

#### **إمكانيات التوسع**:
- إضافة فلترة متقدمة
- تحسين سرعة البحث
- إضافة keyboard navigation
- تحسين UX

#### **التحسينات المقترحة**:
- إضافة debouncing للبحث
- تحسين فهرسة البيانات
- إضافة caching للنتائج
- تحسين معالجة الأخطاء

## المزايا الجديدة

### ✅ **API منفصل ومستقل**:
- لا يؤثر على APIs أخرى
- مخصص لصفحة التسكين
- سهولة الصيانة والتطوير

### ✅ **بحث محسن**:
- معايير بحث متعددة
- فلترة ذكية للنتائج
- أداء محسن

### ✅ **إدارة أخطاء محسنة**:
- تحقق من البيانات
- معالجة شاملة للأخطاء
- رسائل خطأ واضحة

### ✅ **هيكل بيانات منظم**:
- استجابة موحدة
- معلومات شاملة
- تنسيق واضح

## كيفية الاستخدام

### **للمطور**:
1. استخدام API الجديد `/api/housing/search-workers`
2. تطبيق نفس آلية إدارة الحالة
3. استخدام نفس التصميمات

### **للمستخدم**:
1. فتح مودال تسكين العاملة
2. كتابة رقم العاملة أو الاسم أو رقم الجواز
3. اختيار العاملة من النتائج
4. مراجعة المعلومات المعروضة
5. إكمال باقي البيانات

## التحسينات المستقبلية

1. **إضافة فلترة متقدمة** (الجنسية، العمر، الخبرة)
2. **تحسين سرعة البحث** مع debouncing
3. **إضافة keyboard navigation** للقوائم
4. **تحسين UX** مع loading states
5. **إضافة validation** للبيانات المطلوبة
6. **إضافة caching** للنتائج المتكررة
7. **تحسين فهرسة البيانات** للبحث السريع
