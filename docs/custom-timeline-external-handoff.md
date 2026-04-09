# ملخص تخصيص التايم لاين — تسليم لوكيل واجهة المكاتب الخارجية

## متى يُعتبر هناك Custom Timeline؟

### في قاعدة البيانات

- جدول **`CustomTimeline`** مع حقل **`country`** (نص، حتى 255 حرفاً).
- قيد **`@@unique([country])`**: **سجل واحد فقط** لكل قيمة `country` (دولة / جنسية).
- «يوجد custom timeline» = **وجود صف** في الجدول بقيمة `country` تطابق جنسية/دولة الطلب.

### في لوحة الإدارة (`manage-timeline` / `personal_page`)

- يُجلب الكل عبر **`GET /api/custom-timeline`**.
- لكل جنسية من قائمة الجنسيات:
  - **`hasCustomTimeline`** = هل يوجد عنصر حيث **`timeline.country ===` نفس نص الجنسية** (مطابقة حرفية كما تُخزَّن).

### عند استخدام التايم لاين مع طلب (صفحة عميل، تتبع، مكتب خارجي، إلخ)

- **`GET /api/custom-timeline/by-country/[country]`** مع قيمة جنسية الطلب (مُشفَّرة في الـ URL عند الحاجة).
- يُرجع التايم لاين **فقط** إذا:
  - وُجد سجل لذلك **`country`**, **و**
  - **`isActive === true`**.
- إذا **لا يوجد سجل** أو **`isActive` = false** → الاستجابة **404** (`No active timeline found for this country`)، ويُستخدم في الواجهات عادة **المراحل الافتراضية** (`DEFAULT_STAGES` في الكود).

**خلاصة:** وجود صف في **`CustomTimeline`** بنفس نص **`country`** + **`isActive`** عند الاستدعاء عبر `by-country`.

---

## ما تم تنفيذه (لوحة الإدارة)

- تخصيص **كل مرحلة** داخل حقل JSON **`stages`** في **`CustomTimeline`** (بدون عمود جديد في MySQL؛ الهيكل كما هو).
- المرجع للأنواع والدوال المساعدة: **`lib/timelineStage.ts`**.
- واجهات الحفظ: **`pages/admin/manage-timeline.tsx`** و **`pages/admin/personal_page.tsx`** (مودال المرحلة + قائمة المراحل).

---

## شكل كل عنصر داخل `stages` (JSON)

| الحقل | المعنى |
|--------|--------|
| `label`, `field`, `order`, `icon` | كما كان سابقاً |
| `visibleOnExternalOffice` | إظهار المرحلة في واجهة المكتب الخارجي. **إذا غاب الحقل يُعتبر ظاهراً** (`!== false`). |
| `interactionType` | `"none"` \| `"file"` \| `"question"` |
| عند `question` | `questionText`, `answerType` (`"radio"` \| `"options"`), `answerOptions` (`string[]`) |
| عند `file` | لا حقول إضافية؛ يُعرّف أن المرحلة مرتبطة برفع ملف في الواجهة المناسبة |

---

## ما يجب أن تفعله واجهة المكاتب الخارجية

1. جلب التايم لاين حسب جنسية الطلب (نفس منطق المشروع: `by-country` أو ما يعادله).
2. تصفية المراحل للعرض الخارجي:
   - من **`lib/timelineStage.ts`**: `isStageVisibleOnExternalOffice`
   - مثال: `stages.filter(isStageVisibleOnExternalOffice)`
3. حسب **`interactionType`**:
   - **`file`**: واجهة رفع ملف مرتبطة بـ `field` (التخزين في API/الطلب — منفصل عن إعداد المراحل).
   - **`question`**: عرض `questionText` و`answerOptions`؛ `radio` → مجموعة راديو، `options` → قائمة اختيار.
   - **`none`**: سلوك مرحلة عادية بدون سؤال/رفع من هذا التعريف.

---

## قاعدة البيانات (MySQL)

- **لا** حاجة لتعديل هيكل الجدول للحقول أعلاه: عمود **`stages`** من نوع **JSON** ويستوعب المفاتيح الجديدة داخل الـ JSON عند الحفظ من الإدارة.

---

## تخزين إجابة السؤال / ملف المرحلة (مطبّق في لوحة التتبع)

- في **`PATCH /api/track_order/[id]`** للحقول المخصصة (غير `validFields`): يمكن إرسال **`customStageMeta`**:
  - `{ "answer": "نص الخيار المختار" }` مع `{ "field": "...", "value": true }` لمراحل `interactionType: "question"`.
  - `{ "fileUrl": "https://..." }` مع `value: true` لمراحل `interactionType: "file"`.
- يُحفظ في **`arrivallist.customTimelineStages[field]`** ككائن يتضمن على الأقل `completed`, `date`, واختيارياً `answer` و/أو `fileUrl`. عند **`value: false`** يُمسح المحتوى إلى `{ completed: false, date: null }` فقط.
- صفحة **`pages/admin/track_timeline/[id].tsx`** تعرض السؤال/الخيارات أو رفع PDF وتستخدم هذا العقد.
- للتوافق مع الواجهات الأخرى (مثل موقع المكتب): استخدم من **`lib/timelineStage.ts`** الدوال **`effectiveStageInteraction`** (نوع المرحلة الفعلي من الـ JSON)، **`stageInteractionSummaryAr`** (وصف عربي)، **`isStageCompleteForOrder(stage, meta)`** (اكتمال حقيقي: سؤال يحتاج `answer`، ملف يحتاج `fileUrl`).

## ما لم يُبنَ بعد (مسؤولية واجهة المكاتب)

- واجهة المستخدم على **موقع المكاتب الخارجي** بنفس العقد أعلاه (استيراد `isStageVisibleOnExternalOffice` + فلترة المراحل).

---

## ملفات مرجعية سريعة

| ملف | الغرض |
|-----|--------|
| `lib/timelineStage.ts` | أنواع `TimelineStage` والدوال `isStageVisibleOnExternalOffice`, إلخ |
| `pages/api/custom-timeline/index.ts` | قائمة كل الـ timelines |
| `pages/api/custom-timeline/by-country/[country].ts` | جلب نشط حسب الدولة |
| `prisma/schema.prisma` | نموذج `CustomTimeline` |
