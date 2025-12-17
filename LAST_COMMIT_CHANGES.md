# تغييرات آخر Commit

- **Commit**: `a590f5da670220e28b063b75a834f800d0a60379`
- **التاريخ**: `Wed Dec 17 14:19:19 2025 +0200`

## رسالة الـ commit

```text
Enhance AddClientModal and related components: Integrated a city selection dropdown using 'react-select' for improved user experience. Updated validation for phone numbers and visa numbers to enforce specific formats. Added functionality for custom client sources and improved error handling in form submissions. Enhanced styling for better accessibility and user feedback.
```

## إحصائيات

- **18 files changed**
- **1326 insertions(+), 403 deletions(-)**

## الملفات المتغيرة

| الحالة | الملف | + | - |
|---|---|---:|---:|
| M | `components/AddClientModal.tsx` | 267 | 192 |
| M | `components/AddTaskModal.tsx` | 1 | 1 |
| M | `components/FormExternalStep2.tsx` | 92 | 14 |
| M | `components/FormStep2.tsx` | 104 | 27 |
| M | `components/InfoCard.tsx` | 25 | 0 |
| M | `components/VisaSelector.tsx` | 37 | 10 |
| M | `pages/admin/bookedlist.tsx` | 17 | 1 |
| M | `pages/admin/clients.tsx` | 85 | 6 |
| M | `pages/admin/home.tsx` | 2 | 2 |
| M | `pages/admin/homemaidinfo.tsx` | 45 | 2 |
| M | `pages/admin/housedarrivals.tsx` | 42 | 6 |
| M | `pages/admin/newhomemaids.tsx` | 112 | 58 |
| M | `pages/admin/neworders.tsx` | 7 | 7 |
| M | `pages/admin/track_order/[id].tsx` | 330 | 52 |
| A | `pages/api/clients/[id].ts` | 75 | 0 |
| M | `pages/api/submitneworderprisma.ts` | 2 | 0 |
| M | `pages/api/tasks/add-with-random-search.ts` | 33 | 21 |
| M | `pages/api/track_order/[id].ts` | 50 | 4 |

## الـ Diff الكامل (patch)

```diff
commit a590f5da670220e28b063b75a834f800d0a60379
Author: your.email@example.com <your.email@example.com>
Date:   Wed Dec 17 14:19:19 2025 +0200

    Enhance AddClientModal and related components: Integrated a city selection dropdown using 'react-select' for improved user experience. Updated validation for phone numbers and visa numbers to enforce specific formats. Added functionality for custom client sources and improved error handling in form submissions. Enhanced styling for better accessibility and user feedback.

diff --git a/components/AddClientModal.tsx b/components/AddClientModal.tsx
index 10e85b1..900d23f 100644
--- a/components/AddClientModal.tsx
+++ b/components/AddClientModal.tsx
@@ -1,5 +1,77 @@
-import { useEffect, useState, useRef } from 'react';
+import { useEffect, useMemo, useState, useRef } from 'react';
 import { X, ChevronDown, CheckCircle } from 'lucide-react';
+import Select from 'react-select';
+
+const clientCityOptions: Array<{ value: string; label: string }> = [
+  { value: 'Baha', label: 'الباحة' },
+  { value: 'Jawf', label: 'الجوف' },
+  { value: 'Qassim', label: 'القصيم' },
+  { value: 'Hail', label: 'حائل' },
+  { value: 'Jazan', label: 'جازان' },
+  { value: 'Najran', label: 'نجران' },
+  { value: 'Madinah', label: 'المدينة المنورة' },
+  { value: 'Riyadh', label: 'الرياض' },
+  { value: 'Al-Kharj', label: 'الخرج' },
+  { value: 'Ad Diriyah', label: 'الدرعية' },
+  { value: "Al Majma'ah", label: 'المجمعة' },
+  { value: 'Al Zulfi', label: 'الزلفي' },
+  { value: 'Ad Dawadimi', label: 'الدوادمي' },
+  { value: 'Wadi Ad Dawasir', label: 'وادي الدواسر' },
+  { value: 'Afif', label: 'عفيف' },
+  { value: "Al Quway'iyah", label: 'القويعية' },
+  { value: 'Shaqra', label: 'شقراء' },
+  { value: 'Hotat Bani Tamim', label: 'حوطة بني تميم' },
+  { value: 'Makkah', label: 'مكة المكرمة' },
+  { value: 'Jeddah', label: 'جدة' },
+  { value: 'Taif', label: 'الطائف' },
+  { value: 'Rabigh', label: 'رابغ' },
+  { value: 'Al Qunfudhah', label: 'القنفذة' },
+  { value: 'Al Lith', label: 'الليث' },
+  { value: 'Khulais', label: 'خليص' },
+  { value: 'Ranyah', label: 'رنية' },
+  { value: 'Turabah', label: 'تربة' },
+  { value: 'Yanbu', label: 'ينبع' },
+  { value: 'Al Ula', label: 'العلا' },
+  { value: 'Badr', label: 'بدر' },
+  { value: 'Al Hinakiyah', label: 'الحناكية' },
+  { value: 'Mahd Al Dhahab', label: 'مهد الذهب' },
+  { value: 'Dammam', label: 'الدمام' },
+  { value: 'Al Khobar', label: 'الخبر' },
+  { value: 'Dhahran', label: 'الظهران' },
+  { value: 'Al Ahsa', label: 'الأحساء' },
+  { value: 'Al Hufuf', label: 'الهفوف' },
+  { value: 'Al Mubarraz', label: 'المبرز' },
+  { value: 'Jubail', label: 'الجبيل' },
+  { value: 'Hafr Al Batin', label: 'حفر الباطن' },
+  { value: 'Al Khafji', label: 'الخفجي' },
+  { value: 'Ras Tanura', label: 'رأس تنورة' },
+  { value: 'Qatif', label: 'القطيف' },
+  { value: 'Abqaiq', label: 'بقيق' },
+  { value: 'Nairiyah', label: 'النعيرية' },
+  { value: 'Qaryat Al Ulya', label: 'قرية العليا' },
+  { value: 'Buraydah', label: 'بريدة' },
+  { value: 'Unaizah', label: 'عنيزة' },
+  { value: 'Ar Rass', label: 'الرس' },
+  { value: 'Al Bukayriyah', label: 'البكيرية' },
+  { value: 'Al Badaye', label: 'البدائع' },
+  { value: 'Al Mithnab', label: 'المذنب' },
+  { value: 'Riyad Al Khabra', label: 'رياض الخبراء' },
+  { value: 'Abha', label: 'أبها' },
+  { value: 'Khamis Mushait', label: 'خميس مشيط' },
+  { value: 'Bisha', label: 'بيشة' },
+  { value: 'Mahayil', label: 'محايل عسير' },
+  { value: 'Al Namas', label: 'النماص' },
+  { value: 'Tanomah', label: 'تنومة' },
+  { value: 'Ahad Rafidah', label: 'أحد رفيدة' },
+  { value: 'Sarat Abidah', label: 'سراة عبيدة' },
+  { value: 'Balqarn', label: 'بلقرن' },
+  { value: 'Tabuk', label: 'تبوك' },
+  { value: 'Duba', label: 'ضباء' },
+  { value: 'Al Wajh', label: 'الوجه' },
+  { value: 'Umluj', label: 'أملج' },
+  { value: 'Tayma', label: 'تيماء' },
+  { value: 'Haqi', label: 'حقل' },
+];
 
 interface AddClientModalProps {
   isOpen: boolean;
@@ -30,6 +102,8 @@ const AddClientModal = ({ isOpen, onClose, onSuccess }: AddClientModalProps) =>
     visaFile: false,
   });
   const [visaFileName, setVisaFileName] = useState(''); // Store file name
+  const [showCustomSourceModal, setShowCustomSourceModal] = useState(false);
+  const [customSource, setCustomSource] = useState('');
 
   const fileInputRef = useRef<HTMLInputElement>(null);
   const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];
@@ -47,7 +121,8 @@ const AddClientModal = ({ isOpen, onClose, onSuccess }: AddClientModalProps) =>
   const validateStep1 = () => {
     const newErrors: any = {};
     const nameRegex = /^[a-zA-Z\s\u0600-\u06FF]+$/; // Arabic letters and english letters only
-    const phoneRegex = /^\d{9}$/; // 10 digits for Saudi phone numbers
+    const phoneRegex = /^5\d{8}$/; // 9 digits, starts with 5 (without country code)
+    const nationalIdRegex = /^\d{10}$/; // 10 digits
 
     if (!formData.fullname) {
       newErrors.fullname = 'الاسم مطلوب';
@@ -60,11 +135,13 @@ const AddClientModal = ({ isOpen, onClose, onSuccess }: AddClientModalProps) =>
     if (!formData.phonenumber) {
       newErrors.phonenumber = 'رقم الهاتف مطلوب';
     } else if (!phoneRegex.test(formData.phonenumber)) {
-      newErrors.phonenumber = 'رقم الهاتف يجب أن يكون 9 أرقام';
+      newErrors.phonenumber = 'رقم الهاتف يجب أن يكون 9 أرقام ويبدأ بـ 5';
     }
 
     if (!formData.nationalId) {
       newErrors.nationalId = 'رقم الهوية مطلوب';
+    } else if (!nationalIdRegex.test(formData.nationalId)) {
+      newErrors.nationalId = 'رقم الهوية يجب أن يكون 10 أرقام';
     }
 
     if (!formData.city) {
@@ -81,12 +158,13 @@ const AddClientModal = ({ isOpen, onClose, onSuccess }: AddClientModalProps) =>
 
   const validateStep2 = () => {
     const newErrors: any = {};
-    const visaNumberRegex = /^\d{1,10}$/; // at least 1 digit and at most 10 digits
+    // يجب أن يبدأ بـ 190 ثم 10 أرقام (الإجمالي 13 رقم)
+    const visaNumberRegex = /^190\d{10}$/;
 
     if (!formData.visaNumber) {
       newErrors.visaNumber = 'رقم التأشيرة مطلوب';
     } else if (!visaNumberRegex.test(formData.visaNumber)) {
-      newErrors.visaNumber = 'رقم التأشيرة يجب أن يكون على الأكثر 1 أرقام';
+      newErrors.visaNumber = 'رقم التأشيرة يجب أن يبدأ بـ 190 ثم 10 أرقام';
     } 
 
 
@@ -112,14 +190,117 @@ const AddClientModal = ({ isOpen, onClose, onSuccess }: AddClientModalProps) =>
   };
 
   const handleInputChange = (
-    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
+    e:
+      | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
+      | { target: { name: string; value: string } }
   ) => {
     const { name, value } = e.target;
+
+    // رقم التأشيرة: أرقام فقط + يجب أن يبدأ بـ 190 + طول أقصى 13 رقم
+    if (name === 'visaNumber') {
+      const digitsOnly = String(value).replace(/\D/g, '').slice(0, 13);
+      const isValidPartial =
+        digitsOnly === '' ||
+        '190'.startsWith(digitsOnly) ||
+        /^190\d{0,10}$/.test(digitsOnly);
+
+      if (!isValidPartial) return;
+
+      setFormData((prev) => ({ ...prev, visaNumber: digitsOnly }));
+      setErrors((prev: any) => ({ ...prev, visaNumber: '' }));
+      return;
+    }
+    
+    // إذا اختار المستخدم "أخرى" في المصدر، افتح المودال
+    if (name === 'clientSource' && value === 'other') {
+      setShowCustomSourceModal(true);
+      return;
+    }
+    
     setFormData((prev) => ({ ...prev, [name]: value }));
     // Clear error for the field when user starts typing
     setErrors((prev: any) => ({ ...prev, [name]: '' }));
   };
 
+  const selectedCityOption = useMemo(() => {
+    if (!formData.city) return null;
+    const found = clientCityOptions.find((c) => c.value === formData.city);
+    return found || { value: formData.city, label: formData.city };
+  }, [formData.city]);
+
+  const getCitySelectStyles = (hasError: boolean) => ({
+    control: (provided: any, state: any) => ({
+      ...provided,
+      width: '100%',
+      backgroundColor: '#f9fafb',
+      border: hasError ? '1px solid #ef4444' : '1px solid #d1d5db',
+      borderRadius: '0.375rem',
+      minHeight: '40px',
+      boxShadow: state.isFocused ? (hasError ? '0 0 0 1px #ef4444' : '0 0 0 1px #115e59') : 'none',
+      '&:hover': {
+        border: hasError ? '1px solid #ef4444' : '1px solid #9ca3af',
+      },
+      direction: 'rtl' as const,
+    }),
+    valueContainer: (provided: any) => ({
+      ...provided,
+      padding: '0 12px',
+    }),
+    input: (provided: any) => ({
+      ...provided,
+      margin: 0,
+      padding: 0,
+      textAlign: 'right' as const,
+      direction: 'rtl' as const,
+    }),
+    placeholder: (provided: any) => ({
+      ...provided,
+      textAlign: 'right' as const,
+      direction: 'rtl' as const,
+      color: '#6b7280',
+    }),
+    singleValue: (provided: any) => ({
+      ...provided,
+      textAlign: 'right' as const,
+      direction: 'rtl' as const,
+      color: '#111827',
+    }),
+    menuPortal: (provided: any) => ({
+      ...provided,
+      zIndex: 9999,
+    }),
+    menu: (provided: any) => ({
+      ...provided,
+      textAlign: 'right' as const,
+      direction: 'rtl' as const,
+      zIndex: 9999,
+    }),
+    option: (provided: any, state: any) => ({
+      ...provided,
+      textAlign: 'right' as const,
+      direction: 'rtl' as const,
+      backgroundColor: state.isSelected ? '#115e59' : state.isFocused ? '#f0fdfa' : 'white',
+      color: state.isSelected ? 'white' : '#111827',
+      '&:hover': {
+        backgroundColor: state.isSelected ? '#115e59' : '#f0fdfa',
+      },
+    }),
+  });
+
+  const handleCustomSourceSubmit = () => {
+    if (customSource.trim()) {
+      setFormData((prev) => ({ ...prev, clientSource: customSource.trim() }));
+      setErrors((prev: any) => ({ ...prev, clientSource: '' }));
+      setShowCustomSourceModal(false);
+      setCustomSource('');
+    }
+  };
+
+  const handleCustomSourceCancel = () => {
+    setShowCustomSourceModal(false);
+    setCustomSource('');
+  };
+
   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const files = e.target.files;
     if (!files || files.length === 0) {
@@ -241,8 +422,49 @@ const AddClientModal = ({ isOpen, onClose, onSuccess }: AddClientModalProps) =>
   if (!isOpen) return null;
 
   return (
-    <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50">
-      <div className="bg-gray-100 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative">
+    <>
+      {/* Custom Source Modal */}
+      {showCustomSourceModal && (
+        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60]">
+          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
+            <h3 className="text-lg font-medium text-text-dark mb-4">أدخل مصدر العميل</h3>
+            <input
+              type="text"
+              value={customSource}
+              onChange={(e) => setCustomSource(e.target.value)}
+              placeholder="اكتب مصدر العميل"
+              className="w-full bg-background-light border border-border-color rounded-md py-2 px-4 text-sm text-text-dark mb-4"
+              onKeyPress={(e) => {
+                if (e.key === 'Enter') {
+                  handleCustomSourceSubmit();
+                }
+              }}
+              autoFocus
+            />
+            <div className="flex justify-end gap-2">
+              <button
+                type="button"
+                onClick={handleCustomSourceCancel}
+                className="bg-gray-300 text-text-dark px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
+              >
+                إلغاء
+              </button>
+              <button
+                type="button"
+                onClick={handleCustomSourceSubmit}
+                className="bg-primary-dark text-text-light px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90"
+                disabled={!customSource.trim()}
+              >
+                حفظ
+              </button>
+            </div>
+          </div>
+        </div>
+      )}
+
+      {/* Main Modal */}
+      <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50">
+        <div className="bg-gray-100 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative">
         <X
           className="absolute top-4 left-4 text-2xl cursor-pointer text-primary-dark"
           onClick={onClose}
@@ -297,6 +519,8 @@ const AddClientModal = ({ isOpen, onClose, onSuccess }: AddClientModalProps) =>
       name="phonenumber"
       placeholder="5XXXXXXXX"
       value={formData.phonenumber}
+      inputMode="numeric"
+      maxLength={9}
       onChange={(e) => {
         const value = e.target.value.replace(/\D/g, ""); // يمنع غير الأرقام
         if (value.startsWith("5") || value === "") {
@@ -328,7 +552,14 @@ const AddClientModal = ({ isOpen, onClose, onSuccess }: AddClientModalProps) =>
                   name="nationalId"
                   placeholder="ادخل هوية العميل"
                   value={formData.nationalId}
-                  onChange={handleInputChange}
+                  inputMode="numeric"
+                  maxLength={10}
+                  onChange={(e) => {
+                    const value = e.target.value.replace(/\D/g, ""); // يمنع غير الأرقام
+                    handleInputChange({
+                      target: { name: "nationalId", value },
+                    });
+                  }}
                   className={`w-full bg-background-light border ${errors.nationalId ? 'border-red-500' : 'border-border-color'} rounded-md py-2 px-4 text-sm text-text-dark`}
                 />
                 {errors.nationalId && <p className="text-red-500 text-xs mt-1">{errors.nationalId}</p>}
@@ -336,187 +567,23 @@ const AddClientModal = ({ isOpen, onClose, onSuccess }: AddClientModalProps) =>
               <div className="space-y-2">
                 <label htmlFor="city" className="block text-sm font-medium text-text-dark">المدينة</label>
                 <div className="relative">
-                  <select
-                    id="city"
-                    name="city"
-                    value={formData.city}
-                    onChange={handleInputChange}
-                    className={`w-full bg-background-light border ${errors.city ? 'border-red-500' : 'border-border-color'} rounded-md py-2  text-sm text-text-dark appearance-none`}
-                  >
-                    <option value="">اختر المدينة</option>
-{/* const arabicRegionMap: { [key: string]: string } = {
-     'Riyadh': 'الرياض',
-    'Al-Kharj': 'الخرج',
-    'Ad Diriyah': 'الدرعية',
-    'Al Majma\'ah': 'المجمعة',
-    'Al Zulfi': 'الزلفي',
-    'Ad Dawadimi': 'الدوادمي',
-    'Wadi Ad Dawasir': 'وادي الدواسر',
-    'Afif': 'عفيف',
-    'Al Quway\'iyah': 'القويعية',
-    'Shaqra': 'شقراء',
-    'Hotat Bani Tamim': 'حوطة بني تميم',
-
-    'Makkah': 'مكة المكرمة',
-    'Jeddah': 'جدة',
-    'Taif': 'الطائف',
-    'Rabigh': 'رابغ',
-    'Al Qunfudhah': 'القنفذة',
-    'Al Lith': 'الليث',
-    'Khulais': 'خليص',
-    'Ranyah': 'رنية',
-    'Turabah': 'تربة',
-
-    'Madinah': 'المدينة المنورة',
-    'Yanbu': 'ينبع',
-    'Al Ula': 'العلا',
-    'Badr': 'بدر',
-    'Al Hinakiyah': 'الحناكية',
-    'Mahd Al Dhahab': 'مهد الذهب',
-
-    'Dammam': 'الدمام',
-    'Al Khobar': 'الخبر',
-    'Dhahran': 'الظهران',
-    'Al Ahsa': 'الأحساء',
-    'Al Hufuf': 'الهفوف',
-    'Al Mubarraz': 'المبرز',
-    'Jubail': 'الجبيل',
-    'Hafr Al Batin': 'حفر الباطن',
-    'Al Khafji': 'الخفجي',
-    'Ras Tanura': 'رأس تنورة',
-    'Qatif': 'القطيف',
-    'Abqaiq': 'بقيق',
-    'Nairiyah': 'النعيرية',
-    'Qaryat Al Ulya': 'قرية العليا',
-
-    'Buraydah': 'بريدة',
-    'Unaizah': 'عنيزة',
-    'Ar Rass': 'الرس',
-    'Al Bukayriyah': 'البكيرية',
-    'Al Badaye': 'البدائع',
-    'Al Mithnab': 'المذنب',
-    'Riyad Al Khabra': 'رياض الخبراء',
-
-    'Abha': 'أبها',
-    'Khamis Mushait': 'خميس مشيط',
-    'Bisha': 'بيشة',
-    'Mahayil': 'محايل عسير',
-    'Al Namas': 'النماص',
-    'Tanomah': 'تنومة',
-    'Ahad Rafidah': 'أحد رفيدة',
-    'Sarat Abidah': 'سراة عبيدة',
-    'Balqarn': 'بلقرن',
-
-    'Tabuk': 'تبوك',
-    'Duba': 'ضباء',
-    'Al Wajh': 'الوجه',
-    'Umluj': 'أملج',
-    'Tayma': 'تيماء',
-    'Haqi': 'حقل',
-
-    'Hail': 'حائل',
-    'Baqa': 'بقعاء',
-    'Al Ghazalah': 'الغزالة',
-
-    'Arar': 'عرعر',
-    'Rafha': 'رفحاء',
-    'Turaif': 'طريف',
-
-    'Jazan': 'جازان',
-    'Sabya': 'صبيا',
-    'Abu Arish': 'أبو عريش',
-    'Samtah': 'صامطة',
-    'Baish': 'بيش',
-    'Ad Darb': 'الدرب',
-    'Al Aridah': 'العارضة',
-    'Fifa': 'فيفاء',
-
-    'Najran': 'نجران',
-    'Sharurah': 'شرورة',
-    'Hubuna': 'حبونا',
-
-    'Al Baha': 'الباحة',
-    'Baljurashi': 'بلجرشي',
-    'Al Mandq': 'المندق',
-    'Al Makhwah': 'المخواة',
-    'Qilwah': 'قلوة',
-
-    'Sakaka': 'سكاكا',
-    'Dumat Al Jandal': 'دومة الجندل',
-    'Al Qurayyat': 'القريات',
-    'Tabarjal': 'طبرجل'
-  }; */}
-
-
-<option value = "Baha">الباحة</option>
-<option value = "Jawf">الجوف</option>
-<option value = "Qassim">القصيم</option>
-<option value = "Hail">حائل</option>
-<option value = "Jazan">جازان</option>
-<option value = "Najran">نجران</option>
-<option value = "Madinah">المدينة المنورة</option>
-<option value = "Riyadh">الرياض</option>
-<option value = "Al-Kharj">الخرج</option>
-<option value = "Ad Diriyah">الدرعية</option>
-<option value = "Al Majma'ah">المجمعة</option>
-<option value = "Al Zulfi">الزلفي</option>
-<option value = "Ad Dawadimi">الدوادمي</option>
-<option value = "Wadi Ad Dawasir">وادي الدواسر</option>
-<option value = "Afif">عفيف</option>
-<option value = "Al Quway'iyah">القويعية</option>
-<option value = "Shaqra">شقراء</option>
-<option value = "Hotat Bani Tamim">حوطة بني تميم</option>
-<option value = "Makkah">مكة المكرمة</option>
-<option value = "Jeddah">جدة</option>
-<option value = "Taif">الطائف</option>
-<option value = "Rabigh">رابغ</option>
-<option value = "Al Qunfudhah">القنفذة</option>
-<option value = "Al Lith">الليث</option>
-<option value = "Khulais">خليص</option>
-<option value = "Ranyah">رنية</option>
-<option value = "Turabah">تربة</option>
-<option value = "Yanbu">ينبع</option>
-<option value = "Al Ula">العلا</option>
-<option value = "Badr">بدر</option>
-<option value = "Al Hinakiyah">الحناكية</option>
-<option value = "Mahd Al Dhahab">مهد الذهب</option>
-<option value = "Dammam">الدمام</option>
-<option value = "Al Khobar">الخبر</option>
-<option value = "Dhahran">الظهران</option>
-<option value = "Al Ahsa">الأحساء</option>
-<option value = "Al Hufuf">الهفوف</option>
-<option value = "Al Mubarraz">المبرز</option>
-<option value = "Jubail">الجبيل</option>
-<option value = "Hafr Al Batin">حفر الباطن</option>
-<option value = "Al Khafji">الخفجي</option>
-<option value = "Ras Tanura">رأس تنورة</option>
-<option value = "Qatif">القطيف</option>
-<option value = "Abqaiq">بقيق</option>
-<option value = "Nairiyah">النعيرية</option>
-<option value = "Qaryat Al Ulya">قرية العليا</option>
-<option value = "Buraydah">بريدة</option>
-<option value = "Unaizah">عنيزة</option>
-<option value = "Ar Rass">الرس</option>
-<option value = "Al Bukayriyah">البكيرية</option>
-<option value = "Al Badaye">البدائع</option>
-<option value = "Al Mithnab">المذنب</option>
-<option value = "Riyad Al Khabra">رياض الخبراء</option>
-<option value = "Abha">أبها</option>
-<option value = "Khamis Mushait">خميس مشيط</option>
-<option value = "Bisha">بيشة</option>
-<option value = "Mahayil">محايل عسير</option>
-<option value = "Al Namas">النماص</option>
-<option value = "Tanomah">تنومة</option>
-<option value = "Ahad Rafidah">أحد رفيدة</option>
-<option value = "Sarat Abidah">سراة عبيدة</option>
-<option value = "Balqarn">بلقرن</option>
-<option value = "Tabuk">تبوك</option>
-<option value = "Duba">ضباء</option>
-<option value = "Al Wajh">الوجه</option>
-<option value = "Umluj">أملج</option>
-<option value = "Tayma">تيماء</option>
-<option value = "Haqi">حقل</option>
-                  </select>
+                  <Select
+                    inputId="city"
+                    value={selectedCityOption}
+                    onChange={(selected: any) =>
+                      handleInputChange({
+                        target: { name: 'city', value: selected ? selected.value : '' },
+                      })
+                    }
+                    options={clientCityOptions}
+                    placeholder="اختر المدينة"
+                    isClearable
+                    isSearchable
+                    styles={getCitySelectStyles(!!errors.city)}
+                    menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
+                    noOptionsMessage={() => 'لا توجد نتائج'}
+                    loadingMessage={() => 'جاري البحث...'}
+                  />
                 </div>
                 {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
               </div>
@@ -526,13 +593,17 @@ const AddClientModal = ({ isOpen, onClose, onSuccess }: AddClientModalProps) =>
                   <select
                     id="clientSource"
                     name="clientSource"
-                    value={formData.clientSource}
+                    value={formData.clientSource === 'تسويق' || formData.clientSource === 'إعلان' || formData.clientSource === '' ? formData.clientSource : 'custom'}
                     onChange={handleInputChange}
                     className={`w-full bg-background-light border ${errors.clientSource ? 'border-red-500' : 'border-border-color'} rounded-md py-2 text-sm text-text-dark appearance-none`}
                   >
                     <option value="">اختر مصدر العميل</option>
                     <option value="تسويق">تسويق</option>
                     <option value="إعلان">إعلان</option>
+                    <option value="other">أخرى</option>
+                    {formData.clientSource && formData.clientSource !== 'تسويق' && formData.clientSource !== 'إعلان' && (
+                      <option value="custom">{formData.clientSource}</option>
+                    )}
                   </select>
                 </div>
                 {errors.clientSource && <p className="text-red-500 text-xs mt-1">{errors.clientSource}</p>}
@@ -603,6 +674,9 @@ const AddClientModal = ({ isOpen, onClose, onSuccess }: AddClientModalProps) =>
                   id="visaNumber"
                   name="visaNumber"
                   placeholder="ادخل رقم التأشيرة"
+                  inputMode="numeric"
+                  maxLength={13}
+                  pattern="190\d{10}"
                   value={formData.visaNumber}
                   onChange={handleInputChange}
                   className={`w-full bg-background-light border ${errors.visaNumber ? 'border-red-500' : 'border-border-color'} rounded-md py-2 px-4 text-sm text-text-dark`}
@@ -733,8 +807,9 @@ const AddClientModal = ({ isOpen, onClose, onSuccess }: AddClientModalProps) =>
             </div>
           </section>
         )}
+        </div>
       </div>
-    </div>
+    </>
   );
 };
 
diff --git a/components/AddTaskModal.tsx b/components/AddTaskModal.tsx
index 8e08769..7cee9a5 100644
--- a/components/AddTaskModal.tsx
+++ b/components/AddTaskModal.tsx
@@ -183,7 +183,7 @@ const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onSubmit }
                 name="title"
                 value={formData.title}
                 onChange={handleInputChange}
-                placeholder="ادخل عنوان القالب"
+                placeholder="ادخل عنوان المهمة"
                 className="w-full border-none outline-none bg-transparent text-right text-gray-600 text-sm"
                 dir="rtl"
                 required
diff --git a/components/FormExternalStep2.tsx b/components/FormExternalStep2.tsx
index 94edde7..d387c23 100644
--- a/components/FormExternalStep2.tsx
+++ b/components/FormExternalStep2.tsx
@@ -1,7 +1,6 @@
 import { CheckIcon } from '@heroicons/react/outline';
-import { de } from 'date-fns/locale';
-import { Calendar } from 'lucide-react';
-import { useState } from 'react';
+import { useMemo, useState } from 'react';
+import Select from 'react-select';
 import AlertModal from './AlertModal';
 import CityAutocomplete from './CityAutocomplete';
 
@@ -120,6 +119,75 @@ export default function FormStepExternal2({ onPrevious, onClose, data }: FormSte
     return arabicRegionMap[region] || region;
   };
 
+  const saudiCityOptions = useMemo(
+    () =>
+      Object.keys(arabicRegionMap).map((region) => ({
+        value: region,
+        label: convertToArabicRegion(region),
+      })),
+    // arabicRegionMap ثابتة داخل هذا الكومبوننت
+    // eslint-disable-next-line react-hooks/exhaustive-deps
+    []
+  );
+
+  const getCitySelectStyles = (hasError: boolean) => ({
+    control: (provided: any, state: any) => ({
+      ...provided,
+      backgroundColor: '#f9fafb', // bg-gray-50
+      border: hasError ? '1px solid #ef4444' : '1px solid #d1d5db', // red-500 / gray-300
+      borderRadius: '0.25rem',
+      minHeight: '40px',
+      boxShadow: state.isFocused ? (hasError ? '0 0 0 1px #ef4444' : '0 0 0 1px #115e59') : 'none',
+      '&:hover': {
+        border: hasError ? '1px solid #ef4444' : '1px solid #9ca3af',
+      },
+      direction: 'rtl' as const,
+    }),
+    valueContainer: (provided: any) => ({
+      ...provided,
+      padding: '0 12px',
+    }),
+    input: (provided: any) => ({
+      ...provided,
+      margin: 0,
+      padding: 0,
+      textAlign: 'right' as const,
+      direction: 'rtl' as const,
+    }),
+    placeholder: (provided: any) => ({
+      ...provided,
+      textAlign: 'right' as const,
+      direction: 'rtl' as const,
+      color: '#6b7280', // text-gray-500
+    }),
+    singleValue: (provided: any) => ({
+      ...provided,
+      textAlign: 'right' as const,
+      direction: 'rtl' as const,
+      color: '#1f2937',
+    }),
+    menuPortal: (provided: any) => ({
+      ...provided,
+      zIndex: 9999,
+    }),
+    menu: (provided: any) => ({
+      ...provided,
+      textAlign: 'right' as const,
+      direction: 'rtl' as const,
+      zIndex: 9999,
+    }),
+    option: (provided: any, state: any) => ({
+      ...provided,
+      textAlign: 'right' as const,
+      direction: 'rtl' as const,
+      backgroundColor: state.isSelected ? '#115e59' : state.isFocused ? '#f0fdfa' : 'white',
+      color: state.isSelected ? 'white' : '#1f2937',
+      '&:hover': {
+        backgroundColor: state.isSelected ? '#115e59' : '#f0fdfa',
+      },
+    }),
+  });
+
   const [formData, setFormData] = useState({
     externaldeparatureCity: '',
     externalReason: '',
@@ -414,16 +482,23 @@ export default function FormStepExternal2({ onPrevious, onClose, data }: FormSte
           </div>
           <div className="flex-1 flex flex-col gap-2">
             <label htmlFor="departure-from" className="text-xs text-gray-500 text-right font-inter">من</label>
-            <select 
-              value={formData.externaldeparatureCity || ''}
-              onChange={(e) => setFormData({ ...formData, externaldeparatureCity: e.target.value })}
-              className={`bg-gray-50 border ${errors.externaldeparatureCity ? 'border-red-500' : 'border-gray-300'} rounded text-gray-800 text-md`}
-            >
-              <option >اختر المدينة</option>
-              {Object.keys(arabicRegionMap).map((region) => (
-                <option value={region} key={region}>{convertToArabicRegion(region)}</option>
-              ))}
-            </select>
+            <Select
+              inputId="departure-from"
+              value={saudiCityOptions.find((opt) => opt.value === (formData.externaldeparatureCity || '')) || null}
+              onChange={(selected: any) => {
+                const value = selected ? selected.value : '';
+                setFormData({ ...formData, externaldeparatureCity: value });
+                setErrors((prev) => ({ ...prev, externaldeparatureCity: '' }));
+              }}
+              options={saudiCityOptions}
+              placeholder="اختر المدينة"
+              isClearable
+              isSearchable
+              styles={getCitySelectStyles(!!errors.externaldeparatureCity)}
+              menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
+              noOptionsMessage={() => 'لا توجد نتائج'}
+              loadingMessage={() => 'جاري البحث...'}
+            />
             {errors.externaldeparatureCity && <span className="text-red-500 text-xs text-right">{errors.externaldeparatureCity}</span>}
           </div>
         </div>
@@ -432,7 +507,10 @@ export default function FormStepExternal2({ onPrevious, onClose, data }: FormSte
             <label htmlFor="arrival-destination" className="text-xs text-gray-500 text-right font-inter">الى</label>
             <CityAutocomplete
               value={formData.externalArrivalCity}
-              onChange={(value) => setFormData({ ...formData, externalArrivalCity: value })}
+              onChange={(value) => {
+                setFormData({ ...formData, externalArrivalCity: value });
+                setErrors((prev) => ({ ...prev, externalArrivalCity: '' }));
+              }}
               placeholder="ابحث عن مدينة"
               className={`bg-gray-50 border ${errors.externalArrivalCity ? 'border-red-500' : 'border-gray-300'} rounded text-gray-800 text-md`}
               error={errors.externalArrivalCity}
diff --git a/components/FormStep2.tsx b/components/FormStep2.tsx
index 92d8b46..da47c18 100644
--- a/components/FormStep2.tsx
+++ b/components/FormStep2.tsx
@@ -1,6 +1,7 @@
 import { CheckIcon } from '@heroicons/react/outline';
 import { Calendar } from 'lucide-react';
-import { useState, useRef, useEffect } from 'react';
+import { useState, useRef, useEffect, useMemo } from 'react';
+import Select from 'react-select';
 import AlertModal from './AlertModal';
 
 interface FormStep2Props {
@@ -296,6 +297,75 @@ const arabicRegionMap: { [key: string]: string } = {
   const convertToArabicRegion = (region: string) => {
     return arabicRegionMap[region] || region;
   };
+
+  const cityOptions = useMemo(
+    () =>
+      Object.keys(arabicRegionMap).map((region) => ({
+        value: region,
+        label: convertToArabicRegion(region),
+      })),
+    // arabicRegionMap ثابتة داخل هذا الكومبوننت، نثبّت الـ options لتقليل إعادة الحساب
+    // eslint-disable-next-line react-hooks/exhaustive-deps
+    []
+  );
+
+  const getCitySelectStyles = (hasError: boolean) => ({
+    control: (provided: any, state: any) => ({
+      ...provided,
+      backgroundColor: '#f9fafb', // bg-gray-50
+      border: hasError ? '1px solid #ef4444' : '1px solid #d1d5db', // red-500 / gray-300
+      borderRadius: '0.25rem',
+      minHeight: '44px',
+      boxShadow: state.isFocused ? (hasError ? '0 0 0 1px #ef4444' : '0 0 0 1px #115e59') : 'none',
+      '&:hover': {
+        border: hasError ? '1px solid #ef4444' : '1px solid #9ca3af',
+      },
+      direction: 'rtl' as const,
+    }),
+    valueContainer: (provided: any) => ({
+      ...provided,
+      padding: '0 12px',
+    }),
+    input: (provided: any) => ({
+      ...provided,
+      margin: 0,
+      padding: 0,
+      textAlign: 'right' as const,
+      direction: 'rtl' as const,
+    }),
+    placeholder: (provided: any) => ({
+      ...provided,
+      textAlign: 'right' as const,
+      direction: 'rtl' as const,
+      color: '#6b7280', // text-gray-500
+    }),
+    singleValue: (provided: any) => ({
+      ...provided,
+      textAlign: 'right' as const,
+      direction: 'rtl' as const,
+      color: '#1f2937',
+    }),
+    menuPortal: (provided: any) => ({
+      ...provided,
+      zIndex: 9999,
+    }),
+    menu: (provided: any) => ({
+      ...provided,
+      textAlign: 'right' as const,
+      direction: 'rtl' as const,
+      zIndex: 9999,
+    }),
+    option: (provided: any, state: any) => ({
+      ...provided,
+      textAlign: 'right' as const,
+      direction: 'rtl' as const,
+      backgroundColor: state.isSelected ? '#115e59' : state.isFocused ? '#f0fdfa' : 'white',
+      color: state.isSelected ? 'white' : '#1f2937',
+      '&:hover': {
+        backgroundColor: state.isSelected ? '#115e59' : '#f0fdfa',
+      },
+    }),
+  });
   const handleTicketFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const files = e.target.files;
     if (!files || files.length === 0) {
@@ -442,20 +512,24 @@ const arabicRegionMap: { [key: string]: string } = {
           </div>
           <div className="flex-1 flex flex-col gap-2">
             <label htmlFor="departure-from" className="text-xs text-gray-500 text-right font-inter">من</label>
-          <select 
-            value={formData.ArrivalCity || ''}
-            onChange={(e) => {
-              const newFormData = { ...formData, ArrivalCity: e.target.value };
-              setFormData(newFormData);
-              validateFields(newFormData, 'ArrivalCity');
-            }}
-            className={`bg-gray-50 border ${errors.ArrivalCity ? 'border-red-500' : 'border-gray-300'} rounded  text-gray-800 text-md`}
-          >
-            <option value="">اختر المدينة</option>
-            {Object.keys(arabicRegionMap).map((region) => (
-              <option value={region} key={region}>{convertToArabicRegion(region)}</option>
-            ))}
-          </select>
+            <Select
+              inputId="departure-from"
+              value={cityOptions.find((opt) => opt.value === (formData.ArrivalCity || '')) || null}
+              onChange={(selected: any) => {
+                const value = selected ? selected.value : '';
+                const newFormData = { ...formData, ArrivalCity: value };
+                setFormData(newFormData);
+                validateFields(newFormData, 'ArrivalCity');
+              }}
+              options={cityOptions}
+              placeholder="اختر المدينة"
+              isClearable
+              isSearchable
+              styles={getCitySelectStyles(!!errors.ArrivalCity)}
+              menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
+              noOptionsMessage={() => 'لا توجد نتائج'}
+              loadingMessage={() => 'جاري البحث...'}
+            />
           
             
             {errors.ArrivalCity && (
@@ -466,21 +540,24 @@ const arabicRegionMap: { [key: string]: string } = {
         <div className="flex flex-col md:flex-row gap-8">
           <div className="flex-1 flex flex-col gap-2">
             <label htmlFor="arrival-destination" className="text-xs text-gray-500 text-right font-inter">الى</label>
-            <select 
-              value={formData.finaldestination || ''}
-              onChange={(e) => {
-                const newFormData = { ...formData, finaldestination: e.target.value };
+            <Select
+              inputId="arrival-destination"
+              value={cityOptions.find((opt) => opt.value === (formData.finaldestination || '')) || null}
+              onChange={(selected: any) => {
+                const value = selected ? selected.value : '';
+                const newFormData = { ...formData, finaldestination: value };
                 setFormData(newFormData);
                 validateFields(newFormData, 'finaldestination');
               }}
-              className={`bg-gray-50 border ${errors.finaldestination ? 'border-red-500' : 'border-gray-300'} rounded text-gray-800 text-md`}
-            >
-            <option value="">اختر المدينة</option>
-              {Object.keys(arabicRegionMap).map((region) => (
-          
-          <option value={region} key={region}>{convertToArabicRegion(region)}</option>
-              ))}
-            </select>
+              options={cityOptions}
+              placeholder="اختر المدينة"
+              isClearable
+              isSearchable
+              styles={getCitySelectStyles(!!errors.finaldestination)}
+              menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
+              noOptionsMessage={() => 'لا توجد نتائج'}
+              loadingMessage={() => 'جاري البحث...'}
+            />
             {errors.finaldestination && (
               <span className="text-red-500 text-xs text-right">{errors.finaldestination}</span>
             )}
diff --git a/components/InfoCard.tsx b/components/InfoCard.tsx
index 436d566..3e587e5 100644
--- a/components/InfoCard.tsx
+++ b/components/InfoCard.tsx
@@ -39,6 +39,31 @@ export default function InfoCard({ id, title, data, gridCols = 1, actions = [],
   //   return 'تاريخ العقد مطلوب';
   // }
 
+  // Visa number validation: 10 digits, must start with 190
+  if ((key === 'رقم التأشيرة' || key.includes('التأشيرة')) && value && value !== 'N/A') {
+    const visa = value.trim();
+
+    if (!/^\d+$/.test(visa)) {
+      return 'رقم التأشيرة يجب أن يحتوي على أرقام فقط';
+    }
+
+    // Allow progressive typing of 190 (1 -> 19 -> 190)
+    if (visa.length < 3) {
+      if (!'190'.startsWith(visa)) {
+        return 'رقم التأشيرة يجب أن يبدأ بـ 190';
+      }
+      return null;
+    }
+
+    if (!visa.startsWith('190')) {
+      return 'رقم التأشيرة يجب أن يبدأ بـ 190';
+    }
+
+    if (visa.length !== 10) {
+      return 'رقم التأشيرة يجب أن يكون 10 أرقام';
+    }
+  }
+
   // Email validation
   if ((key.includes('البريد الإلكتروني') || key.includes('ايميل')) && value && value !== 'N/A') {
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
diff --git a/components/VisaSelector.tsx b/components/VisaSelector.tsx
index 0eb3c35..3cb0840 100644
--- a/components/VisaSelector.tsx
+++ b/components/VisaSelector.tsx
@@ -27,7 +27,7 @@ const VisaSelector: React.FC<VisaSelectorProps> = ({
   error
 }) => {
   const [isOpen, setIsOpen] = useState(false);
-  const [searchTerm, setSearchTerm] = useState('');
+  const [searchTerm, setSearchTerm] = useState(value && value !== 'N/A' ? value : '');
   const [visas, setVisas] = useState<Visa[]>([]);
   const [filteredVisas, setFilteredVisas] = useState<Visa[]>([]);
   const [loading, setLoading] = useState(false);
@@ -38,6 +38,27 @@ const VisaSelector: React.FC<VisaSelectorProps> = ({
   const dropdownRef = useRef<HTMLDivElement>(null);
   const inputRef = useRef<HTMLInputElement>(null);
 
+  const sanitizeVisaCandidate = (raw: string, previous: string) => {
+    let digits = raw.replace(/\D/g, '');
+    if (digits === '') return '';
+
+    // Enforce max length (10 digits)
+    if (digits.length > 10) digits = digits.slice(0, 10);
+
+    // Allow progressive typing of 190 (1 -> 19 -> 190)
+    if (digits.length <= 3) {
+      return '190'.startsWith(digits) ? digits : previous;
+    }
+
+    // Once user typed >= 4 digits, enforce prefix 190
+    return digits.startsWith('190') ? digits : previous;
+  };
+
+  // Keep input in sync with external value (e.g., when opening edit mode)
+  useEffect(() => {
+    setSearchTerm(value && value !== 'N/A' ? value : '');
+  }, [value]);
+
   // Fetch visas when component mounts or clientID changes
   useEffect(() => {
     if (clientID) {
@@ -97,16 +118,17 @@ const VisaSelector: React.FC<VisaSelectorProps> = ({
   };
 
   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
-    const newValue = e.target.value;
-    setSearchTerm(newValue);
-    onChange(newValue);
+    const next = sanitizeVisaCandidate(e.target.value, searchTerm);
+    setSearchTerm(next);
+    onChange(next);
     setIsOpen(true);
   };
 
   const handleVisaSelect = (visa: Visa) => {
     setSelectedVisa(visa);
-    setSearchTerm(visa.visaNumber);
-    onChange(visa.visaNumber);
+    const normalized = sanitizeVisaCandidate(visa.visaNumber, '');
+    setSearchTerm(normalized);
+    onChange(normalized);
     setIsOpen(false);
   };
 
@@ -122,8 +144,7 @@ const addNewVisa = async () => {
   console.log("response", response);
 };
   const handleOtherSubmit = async () => {
-    
-    if (otherVisaNumber.trim()) {
+    if (otherVisaNumber.trim() && /^190\d{7}$/.test(otherVisaNumber)) {
       setSearchTerm(otherVisaNumber);
       onChange(otherVisaNumber);
       setShowOtherModal(false);
@@ -158,6 +179,9 @@ const addNewVisa = async () => {
           error ? 'border-red-500' : 'border-gray-300'
         } ${className}`}
         dir="rtl"
+        inputMode="numeric"
+        pattern="190\\d{7}"
+        maxLength={10}
       />
       
       {error && (
@@ -220,11 +244,14 @@ const addNewVisa = async () => {
                 <input
                   type="text"
                   value={otherVisaNumber}
-                  onChange={(e) => setOtherVisaNumber(e.target.value)}
+                  onChange={(e) => setOtherVisaNumber((prev) => sanitizeVisaCandidate(e.target.value, prev))}
                   placeholder="أدخل رقم التأشيرة"
                   className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-800"
                   dir="rtl"
                   autoFocus
+                  inputMode="numeric"
+                  pattern="190\\d{7}"
+                  maxLength={10}
                 />
               </div>
               <div className="flex gap-3 justify-end">
@@ -236,7 +263,7 @@ const addNewVisa = async () => {
                 </button>
                 <button
                   onClick={handleOtherSubmit}
-                  disabled={!otherVisaNumber.trim()}
+                  disabled={!/^190\d{7}$/.test(otherVisaNumber)}
                   className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   إضافة
diff --git a/pages/admin/bookedlist.tsx b/pages/admin/bookedlist.tsx
index 4f6d788..b1f5d24 100644
--- a/pages/admin/bookedlist.tsx
+++ b/pages/admin/bookedlist.tsx
@@ -740,7 +740,23 @@ exportdata = await fetchExportData()
                     </td>
                   </tr>
                 ) : (
-                  data.map((item) => (
+                  data
+                    .filter((item) => {
+                      // التحقق من وجود بيانات في الصف
+                      return (
+                        item?.HomeMaid?.id ||
+                        item?.HomeMaid?.Name ||
+                        item?.HomeMaid?.phone ||
+                        item?.HomeMaid?.office?.Country ||
+                        item?.HomeMaid?.maritalstatus ||
+                        item?.client?.fullname ||
+                        item?.HomeMaid?.Passportnumber ||
+                        item?.HomeMaid?.PassportStart ||
+                        item?.HomeMaid?.PassportEnd ||
+                        item?.HomeMaid?.office?.office
+                      );
+                    })
+                    .map((item) => (
                     <tr key={item.id} className="border-b hover:bg-gray-50">
                       <td
                         onClick={() => router.push("/admin/homemaidinfo?id=" + item.HomeMaid?.id)}
diff --git a/pages/admin/clients.tsx b/pages/admin/clients.tsx
index 7dd9b0f..1ac57b0 100644
--- a/pages/admin/clients.tsx
+++ b/pages/admin/clients.tsx
@@ -3,7 +3,7 @@ import AddClientModal from 'components/AddClientModal';
 import AddNotesModal from 'components/AddNotesModal';
 import Style from "styles/Home.module.css";
 import React, { useState, useEffect, useRef } from 'react';
-import { Plus, Search, ChevronDown, Calendar, Filter, FileText, Eye, ChevronRight, ChevronUp, Edit2 } from 'lucide-react';
+import { Plus, Search, ChevronDown, Calendar, Filter, FileText, Eye, ChevronRight, ChevronUp, Edit2, Trash2 } from 'lucide-react';
 import { FileExcelOutlined } from '@ant-design/icons';
 import { DocumentTextIcon, DownloadIcon } from '@heroicons/react/outline';
 import Layout from 'example/containers/Layout';
@@ -37,6 +37,7 @@ interface Client {
 
 interface Props {
   hasPermission: boolean;
+  hasDeletePermission: boolean;
 }
 
 interface Notification {
@@ -44,7 +45,7 @@ interface Notification {
   type: 'success' | 'error';
 }
 
-const Customers = ({ hasPermission }: Props) => {
+const Customers = ({ hasPermission, hasDeletePermission }: Props) => {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
   const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
@@ -56,6 +57,8 @@ const Customers = ({ hasPermission }: Props) => {
   const [totalClients, setTotalClients] = useState(0);
   const [currentPage, setCurrentPage] = useState(1);
   const [userName, setUserName] = useState('');
+  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
+  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
   useEffect(() => {
     const authToken = localStorage.getItem('token');
     const decoder = authToken ? jwtDecode(authToken) : null;
@@ -82,7 +85,8 @@ const Customers = ({ hasPermission }: Props) => {
     remainingAmount: true,
     notes: true,
     view: true,
-    edit: true
+    edit: true,
+    delete: hasDeletePermission
   });
 
 
@@ -205,7 +209,8 @@ const arabicRegionMap: { [key: string]: string } = {
     { key: 'remainingAmount', label: 'المبلغ المتبقي' },
     { key: 'notes', label: 'ملاحظات' },
     { key: 'view', label: 'عرض' },
-    { key: 'edit', label: 'تعديل' }
+    { key: 'edit', label: 'تعديل' },
+    ...(hasDeletePermission ? [{ key: 'delete', label: 'حذف' }] : [])
   ];
 
   const fetchCities = async () => {
@@ -304,6 +309,35 @@ const arabicRegionMap: { [key: string]: string } = {
     fetchClients(currentPage);
   };
 
+  const handleDeleteClient = async () => {
+    if (!clientToDelete) return;
+    
+    try {
+      const response = await fetch(`/api/clients/${clientToDelete}`, {
+        method: 'DELETE',
+      });
+      
+      if (response.ok) {
+        setNotification({ message: 'تم حذف العميل بنجاح', type: 'success' });
+        fetchClients(currentPage);
+        setIsDeleteModalOpen(false);
+        setClientToDelete(null);
+        setTimeout(() => setNotification(null), 3000);
+      } else {
+        throw new Error('فشل في حذف العميل');
+      }
+    } catch (error) {
+      console.error('Error deleting client:', error);
+      setNotification({ message: 'فشل في حذف العميل', type: 'error' });
+      setTimeout(() => setNotification(null), 3000);
+    }
+  };
+
+  const openDeleteModal = (clientId: number) => {
+    setClientToDelete(clientId);
+    setIsDeleteModalOpen(true);
+  };
+
   const translateBookingStatus = (status: string) => {
     const statusTranslations: { [key: string]: string } = {
       'pending': 'قيد الانتظار',
@@ -706,6 +740,7 @@ const arabicRegionMap: { [key: string]: string } = {
                         {visibleColumns.notes && <th className="text-nowrap text-center p-4 w-[10%]">ملاحظات</th>}
                         {visibleColumns.view && <th className="text-nowrap text-center p-4 w-[8%] min-w-[80px]">عرض</th>}
                         {visibleColumns.edit && <th className="text-nowrap text-center p-4 w-[8%] min-w-[80px]">تعديل</th>}
+                        {visibleColumns.delete && hasDeletePermission && <th className="text-nowrap text-center p-4 w-[8%] min-w-[80px]">حذف</th>}
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-border-color">
@@ -790,6 +825,16 @@ const arabicRegionMap: { [key: string]: string } = {
                                   </button>
                                 </td>
                               )}
+                              {visibleColumns.delete && hasDeletePermission && (
+                                <td className="text-nowrap text-center p-4">
+                                  <button 
+                                    className="bg-transparent border border-red-500 text-red-500 rounded p-1 hover:bg-red-50"
+                                    onClick={() => openDeleteModal(client.id)}
+                                  >
+                                    <Trash2 className="w-4 h-4" />
+                                  </button>
+                                </td>
+                              )}
                             </tr>
                             {expandedClientId === client.id && (
                               <tr>
@@ -933,6 +978,31 @@ const arabicRegionMap: { [key: string]: string } = {
             setNotification={setNotification}
           />
         )}
+        {isDeleteModalOpen && (
+          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
+            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
+              <h2 className="text-xl font-semibold text-text-dark mb-4">تأكيد الحذف</h2>
+              <p className="text-text-muted mb-6">هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.</p>
+              <div className="flex justify-end gap-2">
+                <button
+                  onClick={() => {
+                    setIsDeleteModalOpen(false);
+                    setClientToDelete(null);
+                  }}
+                  className="bg-gray-200 text-text-dark px-4 py-2 rounded-md text-md font-medium hover:bg-gray-300"
+                >
+                  إلغاء
+                </button>
+                <button
+                  onClick={handleDeleteClient}
+                  className="bg-red-500 text-white px-4 py-2 rounded-md text-md font-medium hover:bg-red-600"
+                >
+                  حذف
+                </button>
+              </div>
+            </div>
+          </div>
+        )}
       </div>
     </Layout>
   );
@@ -1121,13 +1191,22 @@ export async function getServerSideProps({ req }: any) {
     const hasPermission = findUser && findUser.role?.permissions && 
       (findUser.role.permissions as any)["إدارة العملاء"]?.["عرض"];
 
+    const hasDeletePermission = findUser && findUser.role?.permissions && 
+      (findUser.role.permissions as any)["إدارة العملاء"]?.["حذف"];
+
     return {
-      props: { hasPermission: !!hasPermission },
+      props: { 
+        hasPermission: !!hasPermission,
+        hasDeletePermission: !!hasDeletePermission
+      },
     };
   } catch (err) {
     console.error("Authorization error:", err);
     return {
-      props: { hasPermission: false },
+      props: { 
+        hasPermission: false,
+        hasDeletePermission: false
+      },
     };
   }
 }
diff --git a/pages/admin/home.tsx b/pages/admin/home.tsx
index 6438bae..569798f 100644
--- a/pages/admin/home.tsx
+++ b/pages/admin/home.tsx
@@ -495,8 +495,8 @@ export default function Home({
           setUser(data.user);
           setIsAuthenticated(true);
           
-          // Set userforbutton based on role from token
-          setUserforbutton(data.user.role === 1);
+          // Show "Add Task" button for all authenticated users
+          setUserforbutton(true);
         } else {
           router.push('/admin/login');
         }
diff --git a/pages/admin/homemaidinfo.tsx b/pages/admin/homemaidinfo.tsx
index e8af004..6c5f676 100644
--- a/pages/admin/homemaidinfo.tsx
+++ b/pages/admin/homemaidinfo.tsx
@@ -135,8 +135,28 @@ function HomeMaidInfo() {
 
   // --- دوال المعالجة (Handlers) ---
 
+  const normalizeToWesternDigits = (value: string) => {
+    if (!value) return "";
+    // Arabic-Indic digits (٠-٩) + Eastern Arabic/Persian digits (۰-۹)
+    const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
+    const easternArabic = "۰۱۲۳۴۵۶۷۸۹";
+    return value
+      .replace(/[٠-٩]/g, (d) => String(arabicIndic.indexOf(d)))
+      .replace(/[۰-۹]/g, (d) => String(easternArabic.indexOf(d)));
+  };
+
   const handleChange = (e: any) => {
-    setFormData({ ...formData, [e.target.name]: e.target.value });
+    const { name, value } = e.target;
+
+    // Salary: numbers only (prevent any text)
+    if (name === "salary") {
+      const normalized = normalizeToWesternDigits(String(value));
+      const digitsOnly = normalized.replace(/[^\d]/g, "");
+      setFormData((prev) => ({ ...prev, salary: digitsOnly }));
+      return;
+    }
+
+    setFormData({ ...formData, [name]: value });
   };
 
   const handleChangeDate = (e: any) => {
@@ -193,8 +213,22 @@ function HomeMaidInfo() {
         return;
       }
       
+      // Ensure salary is numeric-only before saving (extra guard)
+      const sanitizedSalary = normalizeToWesternDigits(String(formData.salary || "")).replace(/[^\d]/g, "");
+      if (formData.salary && !/^\d+$/.test(sanitizedSalary)) {
+        setAlertModal({
+          isOpen: true,
+          type: "warning",
+          title: "تحذير",
+          message: "الراتب يجب أن يكون أرقام فقط",
+        });
+        setSaving(false);
+        return;
+      }
+
       const dataToSend = {
         ...formData,
+        salary: sanitizedSalary,
         childrenCount: formData.childrenCount ? Number(formData.childrenCount) : null,
         height: formData.height ? Number(formData.height) : null,
         weight: formData.weight ? Number(formData.weight) : null,
@@ -632,7 +666,16 @@ function HomeMaidInfo() {
                 ) : field.label === "اسم المكتب" ? (
                     <input type="text" value={field.value || ""} readOnly className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none bg-gray-100" />
                 ) : (
-                  <input type="text" name={field.name} value={field.value || ""} onChange={handleChange} readOnly={!isEditing} className={`w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 ${isEditing ? "bg-white" : "bg-gray-100"}`} />
+                  <input
+                    type="text"
+                    name={field.name}
+                    value={field.value || ""}
+                    onChange={handleChange}
+                    readOnly={!isEditing}
+                    inputMode={field.name === "salary" ? "numeric" : undefined}
+                    pattern={field.name === "salary" ? "[0-9]*" : undefined}
+                    className={`w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 ${isEditing ? "bg-white" : "bg-gray-100"}`}
+                  />
                 )}
               </div>
             ))}
diff --git a/pages/admin/housedarrivals.tsx b/pages/admin/housedarrivals.tsx
index 0e93f1a..3ebbd72 100644
--- a/pages/admin/housedarrivals.tsx
+++ b/pages/admin/housedarrivals.tsx
@@ -49,6 +49,7 @@ interface EditWorkerForm {
   Date: string;
   deliveryDate: string;
   isHasEntitlements: boolean;
+  entitlementsCost?: string;
 }
 interface DepartureForm {
   deparatureHousingDate: string;
@@ -267,7 +268,8 @@ useEffect(()=>{
     employee: user,
     details: '',
     isExternal:workerType,
-    isHasEntitlements: true, // إضافة حقل المستحقات
+    isHasEntitlements: false, // إضافة حقل المستحقات
+    entitlementsCost: '', // قيمة المستحقات
   });
   const [editWorkerForm, setEditWorkerForm] = useState<EditWorkerForm>({
     location_id: 0,
@@ -276,7 +278,8 @@ useEffect(()=>{
     employee: '',
     Date: '',
     deliveryDate: '',
-    isHasEntitlements: true,
+    isHasEntitlements: false,
+    entitlementsCost: '', // قيمة المستحقات
   });
   const [departureForm, setDepartureForm] = useState<DepartureForm>({
     deparatureHousingDate: '',
@@ -708,7 +711,7 @@ const fetchDepartedHousedforExporting = async () => {
         employee: worker.employee || user,
         Date: worker.houseentrydate ? worker.houseentrydate.split('T')[0] : '',
         deliveryDate: worker.deparatureHousingDate ? worker.deparatureHousingDate.split('T')[0] : '',
-        isHasEntitlements: worker.isHasEntitlements !== undefined ? worker.isHasEntitlements : true,
+        isHasEntitlements: worker.isHasEntitlements !== undefined ? worker.isHasEntitlements : false,
       };
       console.log('Setting edit form data:', formData);
       setEditWorkerForm(formData);
@@ -789,13 +792,16 @@ const handleSessionSubmit = async (e: React.FormEvent) => {
         deparatureDate: '',
         houseentrydate: '',
         deliveryDate: '',
+        notes: '',
         StartingDate: '',
         location: '',
         DeparatureTime: '',
         reason: '',
         employee: user,
         details: '',
-        isHasEntitlements: true,
+        isExternal: workerType,
+        isHasEntitlements: false,
+        entitlementsCost: '',
       });
       // Clear selected worker and search term
       setSelectedWorker(null);
@@ -2253,13 +2259,28 @@ const handleEntitlementsSubmit = async (e: React.FormEvent) => {
                             name="isHasEntitlements"
                             value="false"
                             checked={formData.isHasEntitlements === false}
-                            onChange={() => setFormData({ ...formData, isHasEntitlements: false })}
+                            onChange={() => setFormData({ ...formData, isHasEntitlements: false, entitlementsCost: '' })}
                             className="w-4 h-4 text-teal-600"
                           />
                           <span className="text-md text-gray-700">لا</span>
                         </label>
                       </div>
                     </div>
+                    {/* حقل قيمة المستحقات - يظهر فقط عند اختيار نعم */}
+                    {formData.isHasEntitlements === true && (
+                      <div className="mb-6">
+                        <label className="block text-md text-gray-700 mb-2">قيمة المستحقات</label>
+                        <input
+                          type="number"
+                          placeholder="أدخل قيمة المستحقات"
+                          value={formData.entitlementsCost}
+                          onChange={(e) => setFormData({ ...formData, entitlementsCost: e.target.value })}
+                          className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-right text-md"
+                          min="0"
+                          step="0.01"
+                        />
+                      </div>
+                    )}
                     {/* Action Buttons */}
                     <div className="flex justify-center gap-4">
                       <button
@@ -2426,13 +2447,28 @@ const handleEntitlementsSubmit = async (e: React.FormEvent) => {
                             name="editIsHasEntitlements"
                             value="false"
                             checked={editWorkerForm.isHasEntitlements === false}
-                            onChange={() => setEditWorkerForm({ ...editWorkerForm, isHasEntitlements: false })}
+                            onChange={() => setEditWorkerForm({ ...editWorkerForm, isHasEntitlements: false, entitlementsCost: '' })}
                             className="w-4 h-4 text-teal-600"
                           />
                           <span className="text-md text-textDark">لا</span>
                         </label>
                       </div>
                     </div>
+                    {/* حقل قيمة المستحقات - يظهر فقط عند اختيار نعم */}
+                    {editWorkerForm.isHasEntitlements === true && (
+                      <div className="mb-4 col-span-2">
+                        <label className="block text-md mb-2 text-textDark">قيمة المستحقات</label>
+                        <input
+                          type="number"
+                          placeholder="أدخل قيمة المستحقات"
+                          value={editWorkerForm.entitlementsCost}
+                          onChange={(e) => setEditWorkerForm({ ...editWorkerForm, entitlementsCost: e.target.value })}
+                          className="w-full p-2 bg-gray-200 rounded-md text-right text-md text-textDark"
+                          min="0"
+                          step="0.01"
+                        />
+                      </div>
+                    )}
                     <div className="flex justify-end gap-4">
                       <button
                         type="button"
diff --git a/pages/admin/newhomemaids.tsx b/pages/admin/newhomemaids.tsx
index 267f46e..9bae94f 100644
--- a/pages/admin/newhomemaids.tsx
+++ b/pages/admin/newhomemaids.tsx
@@ -1,4 +1,5 @@
 import React, { useState, useRef, useEffect } from 'react';
+import type { GetServerSideProps } from 'next';
 import Head from 'next/head';
 import { useRouter } from 'next/router';
 import { FaUser, FaGraduationCap, FaBriefcase, FaTools, FaDollarSign, FaFileAlt, FaMagic } from 'react-icons/fa';
@@ -19,8 +20,8 @@ const AddWorkerForm: React.FC<Props> = ({ error }) => {
   const router = useRouter();
   const [offices, setOffices] = useState<Array<{ office: string }>>([]);
   const [fileNames, setFileNames] = useState<{ [key: string]: string }>({
-  travelTicket: '',
-  passportcopy: '',
+  Picture: '',
+  FullPicture: '',
 });
 
   const [formData, setFormData] = useState({
@@ -60,13 +61,13 @@ const AddWorkerForm: React.FC<Props> = ({ error }) => {
       childcare: '',
       elderlycare: '',
     },
-    travelTicket: '',
-    passportcopy: '',
+    Picture: '',
+    FullPicture: '',
   });
   const [errors, setErrors] = useState<{ [key: string]: string }>({});
   const [fileUploaded, setFileUploaded] = useState<{ [key: string]: boolean }>({
-    travelTicket: false,
-    passportcopy: false,
+    Picture: false,
+    FullPicture: false,
   });
   const [showModal, setShowModal] = useState(!!error);
   const [showSuccessModal, setShowSuccessModal] = useState(false);
@@ -76,8 +77,8 @@ const AddWorkerForm: React.FC<Props> = ({ error }) => {
   const [nationalities, setNationalities] = useState<Array<{ id: number; Country: string }>>([]);
 
   const fileInputRefs = {
-    travelTicket: useRef<HTMLInputElement>(null),
-    passportcopy: useRef<HTMLInputElement>(null),
+    Picture: useRef<HTMLInputElement>(null),
+    FullPicture: useRef<HTMLInputElement>(null),
   };
 
   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
@@ -104,30 +105,42 @@ const AddWorkerForm: React.FC<Props> = ({ error }) => {
     setErrors((prev) => ({ ...prev, [`skill-${skill}`]: '' }));
   };
 
-  const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];
+  const allowedHomemaidImageTypes = ['image/jpeg'];
 
- const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileId: string) => {
+const handleHomemaidImageChange = async (
+  e: React.ChangeEvent<HTMLInputElement>,
+  fieldId: 'Picture' | 'FullPicture',
+  type: 'profile' | 'full'
+) => {
   const files = e.target.files;
   if (!files || files.length === 0) {
-    setErrors((prev) => ({ ...prev, [fileId]: 'لم يتم اختيار ملف' }));
-    setFileUploaded((prev) => ({ ...prev, [fileId]: false }));
-    setFileNames((prev) => ({ ...prev, [fileId]: '' }));
+    setErrors((prev) => ({ ...prev, [fieldId]: 'لم يتم اختيار صورة' }));
+    setFileUploaded((prev) => ({ ...prev, [fieldId]: false }));
+    setFileNames((prev) => ({ ...prev, [fieldId]: '' }));
+    setFormData((prev) => ({ ...prev, [fieldId]: '' }));
     return;
   }
 
   const file = files[0];
-  if (!allowedFileTypes.includes(file.type)) {
-    setErrors((prev) => ({ ...prev, [fileId]: 'نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)' }));
-    setFileUploaded((prev) => ({ ...prev, [fileId]: false }));
-    setFileNames((prev) => ({ ...prev, [fileId]: '' }));
+  if (!allowedHomemaidImageTypes.includes(file.type)) {
+    setErrors((prev) => ({ ...prev, [fieldId]: 'نوع الصورة غير مدعوم (JPEG فقط)' }));
+    setFileUploaded((prev) => ({ ...prev, [fieldId]: false }));
+    setFileNames((prev) => ({ ...prev, [fieldId]: '' }));
+    setFormData((prev) => ({ ...prev, [fieldId]: '' }));
     return;
   }
 
+  // عرض معاينة فورية للصورة قبل الرفع
+  const previewUrl = URL.createObjectURL(file);
+  setFormData((prev) => ({ ...prev, [fieldId]: previewUrl }));
+  setFileNames((prev) => ({ ...prev, [fieldId]: file.name }));
+
   try {
-    const res = await fetch(`/api/upload-presigned-url/${fileId}`);
+    const res = await fetch(`/api/upload-homemaid-image?type=${type}`);
     if (!res.ok) {
-      throw new Error('فشل في الحصول على رابط الرفع');
+      throw new Error('فشل في الحصول على رابط رفع الصورة');
     }
+
     const { url, filePath } = await res.json();
 
     const uploadRes = await fetch(url, {
@@ -138,27 +151,28 @@ const AddWorkerForm: React.FC<Props> = ({ error }) => {
         'x-amz-acl': 'public-read',
       },
     });
-    
-
 
     if (!uploadRes.ok) {
-      throw new Error('فشل في رفع الملف');
+      throw new Error('فشل في رفع الصورة');
     }
 
-    setFormData((prev) => ({ ...prev, [fileId]: filePath }));
-    setErrors((prev) => ({ ...prev, [fileId]: '' }));
-    setFileUploaded((prev) => ({ ...prev, [fileId]: true }));
-    setFileNames((prev) => ({ ...prev, [fileId]: file.name })); // تخزين اسم الملف
+    // تحديث الرابط بعد الرفع الناجح
+    URL.revokeObjectURL(previewUrl); // تنظيف الرابط المؤقت
+    setFormData((prev) => ({ ...prev, [fieldId]: filePath }));
+    setErrors((prev) => ({ ...prev, [fieldId]: '' }));
+    setFileUploaded((prev) => ({ ...prev, [fieldId]: true }));
 
-    const ref = fileInputRefs[fileId as keyof typeof fileInputRefs];
-    if (ref && ref.current) {
+    const ref = fileInputRefs[fieldId];
+    if (ref?.current) {
       ref.current.value = '';
     }
   } catch (error: any) {
-    console.error('Error uploading file:', error);
-    setErrors((prev) => ({ ...prev, [fileId]: error.message || 'حدث خطأ أثناء رفع الملف' }));
-    setFileUploaded((prev) => ({ ...prev, [fileId]: false }));
-    setFileNames((prev) => ({ ...prev, [fileId]: '' }));
+    console.error('Error uploading homemaid image:', error);
+    URL.revokeObjectURL(previewUrl); // تنظيف الرابط المؤقت في حالة الخطأ
+    setErrors((prev) => ({ ...prev, [fieldId]: error.message || 'حدث خطأ أثناء رفع الصورة' }));
+    setFileUploaded((prev) => ({ ...prev, [fieldId]: false }));
+    setFileNames((prev) => ({ ...prev, [fieldId]: '' }));
+    setFormData((prev) => ({ ...prev, [fieldId]: '' }));
   }
 };
   const handleButtonClick = (fileId: string) => {
@@ -223,7 +237,7 @@ const AddWorkerForm: React.FC<Props> = ({ error }) => {
     const newErrors: { [key: string]: string } = {};
     const today = new Date();
 
-    const requiredFields = [
+    const requiredFields: Array<{ id: keyof typeof formData; label: string }> = [
       { id: 'name', label: 'الاسم' },
       { id: 'religion', label: 'الديانة' },
       { id: 'nationality', label: 'الجنسية' },
@@ -360,7 +374,7 @@ const AddWorkerForm: React.FC<Props> = ({ error }) => {
       };
       const response = await fetch('/api/newhomemaids', {
         method: 'POST',
-        body: JSON.stringify(formData),
+        body: JSON.stringify(payload),
         headers: { 'Content-Type': 'application/json' },
       });
 
@@ -407,15 +421,19 @@ const AddWorkerForm: React.FC<Props> = ({ error }) => {
           childcare: '',
           elderlycare: '',
         },
-        travelTicket: '',
-        passportcopy: '',
+        Picture: '',
+        FullPicture: '',
       });
       setFileUploaded({
-        travelTicket: false,
-        passportcopy: false,
+        Picture: false,
+        FullPicture: false,
+      });
+      if (fileInputRefs.Picture.current) fileInputRefs.Picture.current.value = '';
+      if (fileInputRefs.FullPicture.current) fileInputRefs.FullPicture.current.value = '';
+      setFileNames({
+        Picture: '',
+        FullPicture: '',
       });
-      if (fileInputRefs.travelTicket.current) fileInputRefs.travelTicket.current.value = '';
-      if (fileInputRefs.passportcopy.current) fileInputRefs.passportcopy.current.value = '';
       setErrors({});
       setModalMessage('تم إضافة العاملة بنجاح!');
       setShowSuccessModal(true);
@@ -681,19 +699,19 @@ const AddWorkerForm: React.FC<Props> = ({ error }) => {
         childcare: '',
         elderlycare: '',
       },
-      travelTicket: '',
-      passportcopy: '',
+      Picture: '',
+      FullPicture: '',
     });
     setFileUploaded({
-      travelTicket: false,
-      passportcopy: false,
+      Picture: false,
+      FullPicture: false,
     });
     setFileNames({
-      travelTicket: '',
-      passportcopy: '',
+      Picture: '',
+      FullPicture: '',
     });
-    if (fileInputRefs.travelTicket.current) fileInputRefs.travelTicket.current.value = '';
-    if (fileInputRefs.passportcopy.current) fileInputRefs.passportcopy.current.value = '';
+    if (fileInputRefs.Picture.current) fileInputRefs.Picture.current.value = '';
+    if (fileInputRefs.FullPicture.current) fileInputRefs.FullPicture.current.value = '';
     setErrors({});
   }}
 >
@@ -1019,8 +1037,8 @@ const AddWorkerForm: React.FC<Props> = ({ error }) => {
   <legend className="text-2xl font-normal text-center text-black mb-6">الملفات</legend>
   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
     {[
-      { id: 'travelTicket', label: 'تذكرة السفر' },
-      { id: 'passportcopy', label: 'جواز السفر' },
+      { id: 'Picture', label: 'صورة الوجه' },
+      { id: 'FullPicture', label: 'صورة الطول' },
     ].map((file) => (
       <div key={file.id} className="flex flex-col">
         <label htmlFor={file.id} className="text-gray-500 text-sm mb-1">{file.label}</label>
@@ -1037,8 +1055,11 @@ const AddWorkerForm: React.FC<Props> = ({ error }) => {
             id={file.id}
             ref={fileInputRefs[file.id as keyof typeof fileInputRefs]}
             className="hidden"
-            accept="application/pdf,image/jpeg,image/png"
-            onChange={(e) => handleFileChange(e, file.id)}
+            accept="image/jpeg"
+            onChange={(e) => {
+              if (file.id === 'Picture') return handleHomemaidImageChange(e, 'Picture', 'profile');
+              return handleHomemaidImageChange(e, 'FullPicture', 'full');
+            }}
           />
           <button
             type="button"
@@ -1049,6 +1070,34 @@ const AddWorkerForm: React.FC<Props> = ({ error }) => {
           </button>
         </div>
         {errors[file.id] && <p className="text-red-500 text-xs mt-1">{errors[file.id]}</p>}
+        {file.id === 'Picture' && formData.Picture && (
+          <div className="mt-3 flex justify-end">
+            <div className="relative">
+              <img
+                src={formData.Picture}
+                alt="صورة الوجه"
+                className="w-40 h-40 object-cover rounded-lg border-2 border-teal-800 shadow-md"
+              />
+              <div className="absolute top-2 right-2 bg-teal-800 text-white text-xs px-2 py-1 rounded">
+                معاينة
+              </div>
+            </div>
+          </div>
+        )}
+        {file.id === 'FullPicture' && formData.FullPicture && (
+          <div className="mt-3 flex justify-end">
+            <div className="relative">
+              <img
+                src={formData.FullPicture}
+                alt="صورة الطول"
+                className="w-40 h-40 object-cover rounded-lg border-2 border-teal-800 shadow-md"
+              />
+              <div className="absolute top-2 right-2 bg-teal-800 text-white text-xs px-2 py-1 rounded">
+                معاينة
+              </div>
+            </div>
+          </div>
+        )}
       </div>
     ))}
   </div>
@@ -1063,12 +1112,12 @@ const AddWorkerForm: React.FC<Props> = ({ error }) => {
   );
 };
 
-export async function getServerSideProps({ req }) {
+export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
   try {
     const cookieHeader = req.headers.cookie;
     let cookies: { [key: string]: string } = {};
     if (cookieHeader) {
-      cookieHeader.split(';').forEach((cookie) => {
+      cookieHeader.split(';').forEach((cookie: string) => {
         const [key, value] = cookie.trim().split('=');
         cookies[key] = decodeURIComponent(value);
       });
@@ -1080,14 +1129,19 @@ export async function getServerSideProps({ req }) {
       };
     }
 
-    const token = jwtDecode(cookies.authToken);
+    const token = jwtDecode<{ id: number | string }>(cookies.authToken);
+    const userId = typeof token.id === 'string' ? parseInt(token.id, 10) : token.id;
+    if (!userId || Number.isNaN(userId as number)) {
+      return { props: { error: 'رمز مصادقة غير صالح.' } };
+    }
 
     const findUser = await prisma.user.findUnique({
-      where: { id: token.id },
+      where: { id: userId as number },
       include: { role: true },
     });
 
-    if (!findUser || !findUser.role?.permissions?.['إدارة العاملات']?.['إضافة']) {
+    const canAdd = (findUser as any)?.role?.permissions?.['إدارة العاملات']?.['إضافة'];
+    if (!findUser || !canAdd) {
       return {
         props: { error: 'غير مصرح لك بإضافة العاملات.' },
       };
@@ -1100,6 +1154,6 @@ export async function getServerSideProps({ req }) {
       props: { error: 'حدث خطأ أثناء التحقق من الصلاحيات.' },
     };
   }
-}
+};
 
 export default AddWorkerForm;
\ No newline at end of file
diff --git a/pages/admin/neworders.tsx b/pages/admin/neworders.tsx
index f3beeb7..30a4d94 100644
--- a/pages/admin/neworders.tsx
+++ b/pages/admin/neworders.tsx
@@ -4,6 +4,7 @@ import Style from "styles/Home.module.css";
 import Layout from 'example/containers/Layout';
 import { ArrowDown, Plus, Search, X, ChevronUp, ChevronDown, User } from 'lucide-react';
 import Head from 'next/head';
+import type { GetServerSideProps } from 'next';
 import { useEffect, useState } from 'react';
 import Select from 'react-select';
 import { MoreHorizontal } from 'lucide-react';
@@ -41,8 +42,8 @@ export default function Dashboard({ hasPermission, initialData }: DashboardProps
   useEffect(() => {
     const token = localStorage.getItem('token');
     if (!token) return;
-    const decoded = jwtDecode(token);
-    setUserName(decoded.username);
+    const decoded = jwtDecode<{ username?: string }>(token);
+    setUserName(decoded.username || '');
   }, []);
   const [activePopup, setActivePopup] = useState<string | null>(null);
   const [allOrders] = useState(initialData?.newOrders || []);
@@ -1379,7 +1380,7 @@ const serializeDates = (obj: any): any => {
   return obj;
 };
 
-export async function getStaticProps() {
+export const getServerSideProps: GetServerSideProps<DashboardProps> = async () => {
   try {
     // Fetch all the data needed for the page
     const [newOrders, clients, homemaids, offices, exportData] = await Promise.all([
@@ -1483,13 +1484,12 @@ export async function getStaticProps() {
 
     return {
       props: {
-        hasPermission: true, // Static pages can't check auth, handle in component
+        hasPermission: true, // Auth is handled client-side (token in localStorage)
         initialData: serializedData
       },
-      revalidate: 15, // Revalidate every 30 seconds
     };
   } catch (err) {
-    console.error("Static generation error:", err);
+    console.error("SSR data fetch error:", err);
     return {
       props: {
         hasPermission: false,
@@ -1503,4 +1503,4 @@ export async function getStaticProps() {
       },
     };
   }
-}
\ No newline at end of file
+};
\ No newline at end of file
diff --git a/pages/admin/track_order/[id].tsx b/pages/admin/track_order/[id].tsx
index 82f17e9..a7c3e2a 100644
--- a/pages/admin/track_order/[id].tsx
+++ b/pages/admin/track_order/[id].tsx
@@ -26,6 +26,7 @@ interface OrderData {
   clientInfo: { id?: string; name: string; phone: string; email: string };
   homemaidInfo: { id: string; name: string; passportNumber: string; nationality: string; externalOffice: string };
   applicationInfo: { applicationDate: string; applicationTime: string };
+  orderFiles?: { orderDocument?: string | null; contract?: string | null };
   officeLinkInfo: { nationalId: string; visaNumber: string; internalMusanedContract: string; musanedDate: string };
   externalOfficeInfo: { officeName: string; country: string; externalMusanedContract: string };
   externalOfficeApproval: { approved: boolean };
@@ -548,6 +549,49 @@ export default function TrackOrder() {
     }
   };
 
+  const handleDeleteDeliveryFile = async () => {
+    if (!orderData?.deliveryDetails?.deliveryFile && !deliveryDetails.deliveryFile) return;
+
+    setShowConfirmModal({
+      isOpen: true,
+      title: 'حذف ملف الاستلام',
+      message: 'هل أنت متأكد من حذف ملف الاستلام؟',
+      onConfirm: async () => {
+        setUpdating(true);
+        try {
+          // Update local state immediately for better UX
+          setDeliveryDetails((prev) => ({ ...prev, deliveryFile: null }));
+
+          const res = await fetch(`/api/track_order/${id}`, {
+            method: 'PATCH',
+            headers: { 'Content-Type': 'application/json' },
+            body: JSON.stringify({
+              section: 'deliveryDetails',
+              updatedData: { deliveryFile: null },
+            }),
+          });
+
+          if (!res.ok) {
+            const errorData = await res.json().catch(() => ({}));
+            throw new Error((errorData as any)?.error || 'فشل في حذف ملف الاستلام');
+          }
+
+          await fetchOrderData();
+          setShowAlertModal({ isOpen: true, message: 'تم حذف ملف الاستلام بنجاح' });
+        } catch (error: any) {
+          console.error('Error deleting delivery file:', error);
+          setShowErrorModal({
+            isOpen: true,
+            title: 'خطأ في حذف الملف',
+            message: error.message || 'حدث خطأ أثناء حذف ملف الاستلام',
+          });
+        } finally {
+          setUpdating(false);
+        }
+      },
+    });
+  };
+
   // Format homemaids for react-select
   const homemaidOptions = homemaids.map((homemaid) => ({
     value: homemaid.id,
@@ -1486,59 +1530,38 @@ export default function TrackOrder() {
                   value: (
                     <div className="file-upload-display border border-none rounded-md p-1 flex justify-between items-center">
                       <span className="text-gray-500 text-md pr-2 flex items-center gap-2">
-                        {orderData.deliveryDetails?.deliveryFile ? (
-                          // Non-editable mode - عرض الملف المحفوظ فقط
-                          <a
-                            href={orderData.deliveryDetails.deliveryFile}
-                            target="_blank"
-                            rel="noopener noreferrer"
-                            className="text-teal-800 hover:underline"
-                          >
-                            {orderData.deliveryDetails.deliveryFile.split('/').pop()}
-                          </a>
-                        ) : isDeliveryDetailsEditMode && deliveryDetails.deliveryFile ? (
-                          // Editable mode - ملف تم رفعه مؤقتاً (قبل الحفظ)
-                          <>
-                            <a
-                              href={deliveryDetails.deliveryFile}
-                              target="_blank"
-                              rel="noopener noreferrer"
-                              className="text-teal-800 hover:underline"
-                            >
-                              {deliveryDetails.deliveryFile.split('/').pop()}
-                            </a>
-                            <button
-                              aria-label="حذف ملف الاستلام"
-                              className="text-red-600 hover:text-red-700 text-lg font-bold"
-                              onClick={async () => {
-                                setUpdating(true);
-                                try {
-                                  setDeliveryDetails({ ...deliveryDetails, deliveryFile: null });
-                                  await fetch(`/api/track_order/${id}`, {
-                                    method: 'PATCH',
-                                    headers: { 'Content-Type': 'application/json' },
-                                    body: JSON.stringify({
-                                      section: 'deliveryDetails',
-                                      updatedData: { ...deliveryDetails, deliveryFile: null },
-                                    }),
-                                  });
-                                  await fetchOrderData();
-                                } catch (error) {
-                                  console.error('Error deleting delivery file:', error);
-                                } finally {
-                                  setUpdating(false);
-                                }
-                              }}
-                            >
-                              ×
-                            </button>
-                          </>
-                        ) : (
-                          // Editable mode - لا يوجد ملف
-                          isDeliveryDetailsEditMode ? 'إرفاق ملف الاستلام' : 'لا يوجد ملف'
-                        )}
+                        {(() => {
+                          const deliveryFileToShow =
+                            orderData.deliveryDetails?.deliveryFile ?? deliveryDetails.deliveryFile;
+
+                          if (deliveryFileToShow) {
+                            return (
+                              <>
+                                <a
+                                  href={deliveryFileToShow}
+                                  target="_blank"
+                                  rel="noopener noreferrer"
+                                  className="text-teal-800 hover:underline"
+                                >
+                                  {deliveryFileToShow.split('/').pop()}
+                                </a>
+                                <button
+                                  aria-label="حذف ملف الاستلام"
+                                  className="text-red-600 hover:text-red-700 text-lg font-bold disabled:opacity-50"
+                                  onClick={handleDeleteDeliveryFile}
+                                  disabled={updating}
+                                >
+                                  ×
+                                </button>
+                              </>
+                            );
+                          }
+
+                          return isDeliveryDetailsEditMode ? 'إرفاق ملف الاستلام' : 'لا يوجد ملف';
+                        })()}
                       </span>
-                      {isDeliveryDetailsEditMode && !orderData.deliveryDetails?.deliveryFile && (
+                      {isDeliveryDetailsEditMode &&
+                        !(orderData.deliveryDetails?.deliveryFile ?? deliveryDetails.deliveryFile) && (
                         // Editable mode - زر رفع الملف يظهر فقط في وضع التعديل
                         <>
                           <input
@@ -1849,6 +1872,261 @@ export default function TrackOrder() {
               { label: 'إلغاء التعديل', type: 'secondary', onClick: () => console.log('إلغاء تعديل المستندات') },
             ]}
           />
+
+          <InfoCard
+            title="مرفقات الطلب"
+            data={[
+              {
+                label: 'ملف سند الأمر',
+                value: (
+                  <div className="file-upload-display border border-none rounded-md p-1 flex justify-between items-center">
+                    <span className="text-gray-700 text-sm pr-2 flex items-center gap-2">
+                      {orderData.orderFiles?.orderDocument ? (
+                        <>
+                          <a
+                            href={orderData.orderFiles.orderDocument}
+                            target="_blank"
+                            rel="noopener noreferrer"
+                            className="text-teal-800 hover:underline"
+                          >
+                            {orderData.orderFiles.orderDocument.split('/').pop() || 'فتح الملف'}
+                          </a>
+                          <button
+                            aria-label="حذف ملف سند الأمر"
+                            className="text-red-600 hover:text-red-700 text-lg font-bold"
+                            disabled={updating}
+                            onClick={() => {
+                              setShowConfirmModal({
+                                isOpen: true,
+                                title: 'حذف ملف سند الأمر',
+                                message: 'هل أنت متأكد من حذف ملف سند الأمر؟',
+                                onConfirm: async () => {
+                                  setUpdating(true);
+                                  try {
+                                    const res = await fetch(`/api/track_order/${id}`, {
+                                      method: 'PATCH',
+                                      headers: { 'Content-Type': 'application/json' },
+                                      body: JSON.stringify({
+                                        section: 'orderFiles',
+                                        updatedData: { orderDocument: null },
+                                      }),
+                                    });
+                                    if (!res.ok) {
+                                      const errorData = await res.json();
+                                      throw new Error((errorData as any)?.error || 'فشل في حذف الملف');
+                                    }
+                                    await fetchOrderData();
+                                    setShowAlertModal({ isOpen: true, message: 'تم حذف الملف بنجاح' });
+                                  } catch (error: any) {
+                                    console.error('Error deleting orderDocument:', error);
+                                    setShowErrorModal({
+                                      isOpen: true,
+                                      title: 'خطأ في حذف الملف',
+                                      message: error.message || 'حدث خطأ أثناء حذف الملف',
+                                    });
+                                  } finally {
+                                    setUpdating(false);
+                                  }
+                                },
+                              });
+                            }}
+                          >
+                            ×
+                          </button>
+                        </>
+                      ) : (
+                        <span className="text-gray-500">لا يوجد</span>
+                      )}
+                    </span>
+
+                    <input
+                      type="file"
+                      id="file-upload-orderDocument"
+                      className="hidden"
+                      accept="application/pdf"
+                      onChange={async (e) => {
+                        const file = e.target.files?.[0];
+                        if (!file) return;
+                        setUpdating(true);
+                        try {
+                          const res = await fetch(`/api/upload-presigned-url/${id}`);
+                          if (!res.ok) throw new Error('فشل في الحصول على رابط الرفع');
+                          const { url, filePath } = await res.json();
+
+                          const uploadRes = await fetch(url, {
+                            method: 'PUT',
+                            body: file,
+                            headers: {
+                              'Content-Type': file.type || 'application/pdf',
+                              'x-amz-acl': 'public-read',
+                            },
+                          });
+                          if (!uploadRes.ok) throw new Error('فشل في رفع الملف');
+
+                          const saveRes = await fetch(`/api/track_order/${id}`, {
+                            method: 'PATCH',
+                            headers: { 'Content-Type': 'application/json' },
+                            body: JSON.stringify({
+                              section: 'orderFiles',
+                              updatedData: { orderDocument: filePath },
+                            }),
+                          });
+                          if (!saveRes.ok) {
+                            const errorData = await saveRes.json();
+                            throw new Error((errorData as any)?.error || 'فشل في حفظ رابط الملف');
+                          }
+
+                          await fetchOrderData();
+                          e.target.value = '';
+                          setShowAlertModal({ isOpen: true, message: 'تم رفع ملف سند الأمر بنجاح' });
+                        } catch (error: any) {
+                          console.error('Error uploading orderDocument:', error);
+                          setShowErrorModal({
+                            isOpen: true,
+                            title: 'خطأ في رفع الملف',
+                            message: error.message || 'حدث خطأ أثناء رفع الملف',
+                          });
+                        } finally {
+                          setUpdating(false);
+                        }
+                      }}
+                    />
+                    <label
+                      htmlFor="file-upload-orderDocument"
+                      className={`bg-teal-800 text-white px-3 py-1 rounded-md text-md cursor-pointer hover:bg-teal-900 ${updating ? 'opacity-50 pointer-events-none' : ''}`}
+                    >
+                      اختيار ملف
+                    </label>
+                  </div>
+                ),
+              },
+              {
+                label: 'ملف العقد',
+                value: (
+                  <div className="file-upload-display border border-none rounded-md p-1 flex justify-between items-center">
+                    <span className="text-gray-700 text-sm pr-2 flex items-center gap-2">
+                      {orderData.orderFiles?.contract ? (
+                        <>
+                          <a
+                            href={orderData.orderFiles.contract}
+                            target="_blank"
+                            rel="noopener noreferrer"
+                            className="text-teal-800 hover:underline"
+                          >
+                            {orderData.orderFiles.contract.split('/').pop() || 'فتح الملف'}
+                          </a>
+                          <button
+                            aria-label="حذف ملف العقد"
+                            className="text-red-600 hover:text-red-700 text-lg font-bold"
+                            disabled={updating}
+                            onClick={() => {
+                              setShowConfirmModal({
+                                isOpen: true,
+                                title: 'حذف ملف العقد',
+                                message: 'هل أنت متأكد من حذف ملف العقد؟',
+                                onConfirm: async () => {
+                                  setUpdating(true);
+                                  try {
+                                    const res = await fetch(`/api/track_order/${id}`, {
+                                      method: 'PATCH',
+                                      headers: { 'Content-Type': 'application/json' },
+                                      body: JSON.stringify({
+                                        section: 'orderFiles',
+                                        updatedData: { contract: null },
+                                      }),
+                                    });
+                                    if (!res.ok) {
+                                      const errorData = await res.json();
+                                      throw new Error((errorData as any)?.error || 'فشل في حذف الملف');
+                                    }
+                                    await fetchOrderData();
+                                    setShowAlertModal({ isOpen: true, message: 'تم حذف الملف بنجاح' });
+                                  } catch (error: any) {
+                                    console.error('Error deleting contract:', error);
+                                    setShowErrorModal({
+                                      isOpen: true,
+                                      title: 'خطأ في حذف الملف',
+                                      message: error.message || 'حدث خطأ أثناء حذف الملف',
+                                    });
+                                  } finally {
+                                    setUpdating(false);
+                                  }
+                                },
+                              });
+                            }}
+                          >
+                            ×
+                          </button>
+                        </>
+                      ) : (
+                        <span className="text-gray-500">لا يوجد</span>
+                      )}
+                    </span>
+
+                    <input
+                      type="file"
+                      id="file-upload-contract"
+                      className="hidden"
+                      accept="application/pdf"
+                      onChange={async (e) => {
+                        const file = e.target.files?.[0];
+                        if (!file) return;
+                        setUpdating(true);
+                        try {
+                          const res = await fetch(`/api/upload-presigned-url/${id}`);
+                          if (!res.ok) throw new Error('فشل في الحصول على رابط الرفع');
+                          const { url, filePath } = await res.json();
+
+                          const uploadRes = await fetch(url, {
+                            method: 'PUT',
+                            body: file,
+                            headers: {
+                              'Content-Type': file.type || 'application/pdf',
+                              'x-amz-acl': 'public-read',
+                            },
+                          });
+                          if (!uploadRes.ok) throw new Error('فشل في رفع الملف');
+
+                          const saveRes = await fetch(`/api/track_order/${id}`, {
+                            method: 'PATCH',
+                            headers: { 'Content-Type': 'application/json' },
+                            body: JSON.stringify({
+                              section: 'orderFiles',
+                              updatedData: { contract: filePath },
+                            }),
+                          });
+                          if (!saveRes.ok) {
+                            const errorData = await saveRes.json();
+                            throw new Error((errorData as any)?.error || 'فشل في حفظ رابط الملف');
+                          }
+
+                          await fetchOrderData();
+                          e.target.value = '';
+                          setShowAlertModal({ isOpen: true, message: 'تم رفع ملف العقد بنجاح' });
+                        } catch (error: any) {
+                          console.error('Error uploading contract:', error);
+                          setShowErrorModal({
+                            isOpen: true,
+                            title: 'خطأ في رفع الملف',
+                            message: error.message || 'حدث خطأ أثناء رفع الملف',
+                          });
+                        } finally {
+                          setUpdating(false);
+                        }
+                      }}
+                    />
+                    <label
+                      htmlFor="file-upload-contract"
+                      className={`bg-teal-800 text-white px-3 py-1 rounded-md text-md cursor-pointer hover:bg-teal-900 ${updating ? 'opacity-50 pointer-events-none' : ''}`}
+                    >
+                      اختيار ملف
+                    </label>
+                  </div>
+                ),
+              },
+            ]}
+            actions={[]}
+          />
         </main>
 
         {/* Feedback when order reaches receipt stage - يظهر فقط عند وجود ملف استلام */}
diff --git a/pages/api/clients/[id].ts b/pages/api/clients/[id].ts
new file mode 100644
index 0000000..31715a5
--- /dev/null
+++ b/pages/api/clients/[id].ts
@@ -0,0 +1,75 @@
+import { PrismaClient } from "@prisma/client";
+import { jwtDecode } from "jwt-decode";
+import eventBus from "lib/eventBus";
+import type { NextApiRequest, NextApiResponse } from "next";
+
+const prisma = new PrismaClient();
+
+export default async function handler(req: NextApiRequest, res: NextApiResponse) {
+  const { id } = req.query;
+
+  if (!id || isNaN(Number(id))) {
+    return res.status(400).json({ message: "معرف العميل غير صالح" });
+  }
+
+  const clientId = parseInt(id as string);
+
+  if (req.method === "DELETE") {
+    try {
+      // التحقق من صلاحية الحذف
+      const cookieHeader = req.headers.cookie;
+      let cookies: { [key: string]: string } = {};
+      if (cookieHeader) {
+        cookieHeader.split(";").forEach((cookie) => {
+          const [key, value] = cookie.trim().split("=");
+          cookies[key] = decodeURIComponent(value);
+        });
+      }
+
+      if (!cookies.authToken) {
+        return res.status(401).json({ message: "غير مصرح" });
+      }
+
+      const token = jwtDecode(cookies.authToken) as any;
+
+      const findUser = await prisma.user.findUnique({
+        where: { id: token.id },
+        include: { role: true },
+      });
+
+      const hasDeletePermission = findUser && findUser.role?.permissions && 
+        (findUser.role.permissions as any)["إدارة العملاء"]?.["حذف"];
+
+      if (!hasDeletePermission) {
+        return res.status(403).json({ message: "ليس لديك صلاحية لحذف العملاء" });
+      }
+
+      // التحقق من وجود العميل وحذفه
+      const client = await prisma.client.delete({
+        where: { id: clientId }
+      });
+
+      // تسجيل الحدث
+      eventBus.emit('ACTION', {
+        type: `حذف العميل #${clientId} - ${client.fullname}`,
+        userId: Number(token.id),
+      });
+
+      res.status(200).json({ 
+        message: "تم حذف العميل بنجاح",
+        deletedClient: {
+          id: client.id,
+          fullname: client.fullname
+        }
+      });
+    } catch (error) {
+      console.error("Error deleting client:", error);
+      res.status(500).json({ message: "خطأ في الخادم الداخلي" });
+    } finally {
+      await prisma.$disconnect();
+    }
+  } else {
+    res.setHeader("Allow", ["DELETE"]);
+    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
+  }
+}
diff --git a/pages/api/submitneworderprisma.ts b/pages/api/submitneworderprisma.ts
index 1028695..c25b5bf 100644
--- a/pages/api/submitneworderprisma.ts
+++ b/pages/api/submitneworderprisma.ts
@@ -62,6 +62,8 @@ export default async function handler(req: NextApiRequest, res: NextApiResponse)
         clientphonenumber,
         Religion,
         PhoneNumber,
+        orderDocument: orderDocument || null,
+        contract: contract || null,
         ages: age + "",
         paid: Paid == null ? undefined : Number(Paid),
         client: {
diff --git a/pages/api/tasks/add-with-random-search.ts b/pages/api/tasks/add-with-random-search.ts
index 4d45c28..107c229 100644
--- a/pages/api/tasks/add-with-random-search.ts
+++ b/pages/api/tasks/add-with-random-search.ts
@@ -6,14 +6,21 @@ export default async function handler(req: NextApiRequest, res: NextApiResponse)
     return res.status(405).json({ error: 'Method not allowed' });
   }
 
-  const token = req.cookies.authToken
-  console.log("token",token);
-  const decoded = jwt.verify(token, "rawaesecret") as any
-  const findUserByID = await prisma.user.findUnique({where:{id:decoded.id}})
-  if(Number(findUserByID?.roleId) !== 1) return res.status(401).json({ error: 'لا تملك صلاحية كافية لاضافة مهمة' });
   try {
+    const token = req.cookies.authToken;
+    if (!token) return res.status(401).json({ error: "Unauthorized" });
+
+    let decoded: any;
+    try {
+      decoded = jwt.verify(token, "rawaesecret") as any;
+    } catch (e) {
+      return res.status(401).json({ error: "Invalid token" });
+    }
+
+    const currentUser = await prisma.user.findUnique({ where: { id: decoded?.id } });
+    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });
+
     const { 
-      userId, 
       title, 
       description, 
       taskDeadline, 
@@ -32,34 +39,39 @@ export default async function handler(req: NextApiRequest, res: NextApiResponse)
     } = req.body;
 
     // Validate required fields
-    if (!userId || !title || !description || !taskDeadline) {
+    if (!title || !description || !taskDeadline) {
       return res.status(400).json({ 
-        error: 'userId, title, description, and taskDeadline are required' 
+        error: 'title, description, and taskDeadline are required' 
       });
     }
 
+    const assignedByUserId = Number(currentUser.id);
+
     // Use the specific assignee if provided, otherwise fall back to current user
-    let selectedUserId = parseInt(userId); // Default to current user
+    let selectedUserId = assignedByUserId; // Default to current user
     
     if (assignee && assignee !== '') {
       // If a specific assignee is provided, use that user
       // The assignee field should contain the user ID or username
-      if (assignee.startsWith('user')) {
+      if (typeof assignee === "string" && assignee.startsWith('user')) {
         // Handle cases where assignee is like "user1", "user2", etc.
         const assigneeId = assignee.replace('user', '');
-        selectedUserId = parseInt(assigneeId);
+        const parsed = Number(assigneeId);
+        if (!Number.isNaN(parsed)) selectedUserId = parsed;
       } else {
         // Try to find user by username or ID
-        const user = await prisma.user.findFirst({
-          where: {
-            OR: [
-              { id: parseInt(assignee) },
-              { username: assignee }
-            ]
+        const assigneeAsNumber = typeof assignee === "string" ? Number(assignee) : Number.NaN;
+        const orConditions = [
+          ...(Number.isNaN(assigneeAsNumber) ? [] : [{ id: assigneeAsNumber }]),
+          ...(typeof assignee === "string" ? [{ username: assignee }] : []),
+        ];
+        if (orConditions.length > 0) {
+          const user = await prisma.user.findFirst({
+            where: { OR: orConditions }
+          });
+          if (user) {
+            selectedUserId = user.id;
           }
-        });
-        if (user) {
-          selectedUserId = user.id;
         }
       }
     }
@@ -67,7 +79,7 @@ export default async function handler(req: NextApiRequest, res: NextApiResponse)
     // Prepare task data
     const taskData: any = {
       userId: selectedUserId,
-      assignedBy: parseInt(userId),
+      assignedBy: assignedByUserId,
       description,
       Title: title,
       taskDeadline: new Date(taskDeadline).toISOString(),
diff --git a/pages/api/track_order/[id].ts b/pages/api/track_order/[id].ts
index 6982e38..1afa0c4 100644
--- a/pages/api/track_order/[id].ts
+++ b/pages/api/track_order/[id].ts
@@ -98,6 +98,10 @@ console.log(id)
             ? new Date(order.createdAt.getTime() + (3 * 60 * 60 * 1000)).toISOString().split('T')[1]?.split('.')[0] || 'N/A'
             : 'N/A',
         },
+        orderFiles: {
+          orderDocument: order.orderDocument || null,
+          contract: order.contract || null,
+        },
         officeLinkInfo: {
           nationalId: order.client?.nationalId|| 'N/A',
           visaNumber: order.arrivals[0]?.visaNumber || 'N/A',
@@ -293,7 +297,7 @@ const cookieHeader = req.headers.cookie;
             updateData.bookingstatus = value ? 'embassy_approved' : 'pending_embassy';
             break;
           case 'visaIssuance':
-            arrivalUpdate.visaNumber = value ? `VISA-${id}-${Date.now()}` : null;
+            // arrivalUpdate.visaNumber = value ? `VISA-${id}-${Date.now()}` : null;
             arrivalUpdate.visaIssuanceDate = value ? new Date() : null;
             updateData.bookingstatus = value ? 'visa_issued' : 'pending_visa';
             break;
@@ -366,6 +370,31 @@ const cookieHeader = req.headers.cookie;
 
 
         switch (section) {
+          case 'orderFiles': {
+            // Update attachments stored directly on neworder
+            if (Object.prototype.hasOwnProperty.call(updatedData, 'orderDocument')) {
+              const raw = updatedData.orderDocument;
+              const normalized =
+                raw === null || raw === undefined
+                  ? null
+                  : typeof raw === 'string'
+                    ? (raw.trim() ? raw.trim() : null)
+                    : String(raw);
+              updateData.orderDocument = normalized;
+            }
+
+            if (Object.prototype.hasOwnProperty.call(updatedData, 'contract')) {
+              const raw = updatedData.contract;
+              const normalized =
+                raw === null || raw === undefined
+                  ? null
+                  : typeof raw === 'string'
+                    ? (raw.trim() ? raw.trim() : null)
+                    : String(raw);
+              updateData.contract = normalized;
+            }
+            break;
+          }
           case 'medical':
             if (updatedData.medicalCheckFile) {
               arrivalUpdate.medicalCheckFile = updatedData.medicalCheckFile;
@@ -400,7 +429,24 @@ HomemaidId: updatedData['id'] ? Number(updatedData['id']) : order.HomemaidId,
               updateData.nationalId = updatedData['هوية العميل'];
             }
             if (updatedData['رقم التأشيرة']) {
-              arrivalUpdate.visaNumber = updatedData['رقم التأشيرة'];
+              const visaRaw = updatedData['رقم التأشيرة'];
+              const visa = typeof visaRaw === 'string' ? visaRaw.trim() : String(visaRaw ?? '').trim();
+
+              // Normalize display placeholder
+              if (!visa || visa === 'N/A') {
+                arrivalUpdate.visaNumber = null;
+              } else {
+                if (!/^\d+$/.test(visa)) {
+                  return res.status(400).json({ error: 'رقم التأشيرة يجب أن يحتوي على أرقام فقط' });
+                }
+                if (!visa.startsWith('190')) {
+                  return res.status(400).json({ error: 'رقم التأشيرة يجب أن يبدأ بـ 190' });
+                }
+                if (visa.length !== 10) {
+                  return res.status(400).json({ error: 'رقم التأشيرة يجب أن يكون 10 أرقام' });
+                }
+                arrivalUpdate.visaNumber = visa;
+              }
             }
             if (updatedData['رقم عقد إدارة المكاتب']) {
               arrivalUpdate.InternalmusanedContract = updatedData['رقم عقد إدارة المكاتب'];
@@ -505,7 +551,7 @@ HomemaidId: updatedData['id'] ? Number(updatedData['id']) : order.HomemaidId,
             break;
           case 'clientInfo':
             // Handle client info updates (email, name, phone)
-            if (!order.clientId) {
+            if (!order.clientID) {
               return res.status(400).json({ error: 'No client associated with this order' });
             }
             
@@ -522,7 +568,7 @@ HomemaidId: updatedData['id'] ? Number(updatedData['id']) : order.HomemaidId,
             
             if (Object.keys(clientUpdateData).length > 0) {
               await prisma.client.update({
-                where: { id: order.clientId },
+                where: { id: order.clientID },
                 data: clientUpdateData,
               });
             }

```
