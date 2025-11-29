# دليل جلب المراحل بشكل ديناميكي

هذا الدليل يشرح كيفية جلب المراحل (Stages) بشكل ديناميكي من قاعدة البيانات باستخدام Prisma Schema، دون الاعتماد على هيكل المشروع الحالي.

## نظرة عامة على هيكل البيانات

### 1. نموذج CustomTimeline في Prisma Schema

```prisma
model CustomTimeline {
  id                Int       @id @default(autoincrement())
  country           String    @db.VarChar(255) // الدولة
  name              String?   @db.VarChar(255) // اسم الـ timeline (اختياري)
  stages            Json      // Array of stages: [{label: string, field: string, order: number, icon?: string}]
  isActive          Boolean   @default(true)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([country])
  @@unique([country])
}
```

### 2. هيكل المراحل (Stages Structure)

حقل `stages` هو JSON يحتوي على مصفوفة من المراحل، كل مرحلة تحتوي على:

```typescript
interface TimelineStage {
  label: string;      // اسم المرحلة (عرض للمستخدم)
  field: string;      // اسم الحقل في قاعدة البيانات
  order: number;      // ترتيب المرحلة
  icon?: string;      // اسم الأيقونة (اختياري)
}
```

### 3. نموذج arrivallist لحفظ حالة المراحل

```prisma
model arrivallist {
  // ... حقول أخرى
  customTimelineStages Json?  // حالات المراحل المخصصة: {fieldName: {completed: boolean, date: DateTime}}
}
```

## طريقة جلب المراحل

### الخطوة 1: جلب المراحل المخصصة حسب الدولة

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getCustomTimelineByCountry(country: string) {
  try {
    const timeline = await prisma.customTimeline.findUnique({
      where: { country: country },
    });

    // التحقق من وجود timeline ونشاطه
    if (!timeline || !timeline.isActive) {
      return null;
    }

    return timeline;
  } catch (error) {
    console.error('Error fetching custom timeline:', error);
    throw error;
  }
}
```

### الخطوة 2: تحديد المراحل (مخصصة أو افتراضية)

```typescript
interface TimelineStage {
  label: string;
  field: string;
  order: number;
  icon?: string;
}

// المراحل الافتراضية (Fallback)
const DEFAULT_STAGES: TimelineStage[] = [
  { label: 'الربط مع إدارة المكاتب', field: 'officeLinkInfo', order: 0, icon: 'Link' },
  { label: 'المكتب الخارجي', field: 'externalOfficeInfo', order: 1, icon: 'Briefcase' },
  { label: 'موافقة المكتب الخارجي', field: 'externalOfficeApproval', order: 2, icon: 'CheckCircle' },
  // ... المزيد من المراحل
];

async function getStagesForOrder(nationality: string): Promise<TimelineStage[]> {
  // 1. محاولة جلب المراحل المخصصة
  const customTimeline = await getCustomTimelineByCountry(nationality);
  
  // 2. إذا وُجد timeline مخصص ونشط، استخدمه
  if (customTimeline && customTimeline.isActive) {
    // تحويل JSON إلى مصفوفة وترتيبها حسب order
    const stages = customTimeline.stages as TimelineStage[];
    return stages.sort((a, b) => a.order - b.order);
  }
  
  // 3. إذا لم يوجد، استخدم المراحل الافتراضية
  return DEFAULT_STAGES;
}
```

### الخطوة 3: جلب جميع المراحل المخصصة

```typescript
async function getAllCustomTimelines() {
  try {
    const timelines = await prisma.customTimeline.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return timelines;
  } catch (error) {
    console.error('Error fetching all timelines:', error);
    throw error;
  }
}
```

## استخدام المراحل في API Endpoints

### مثال: API Endpoint لجلب المراحل حسب الدولة

```typescript
// pages/api/custom-timeline/by-country/[country].ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { country } = req.query;

  if (req.method === 'GET') {
    try {
      const timeline = await prisma.customTimeline.findUnique({
        where: { country: country as string },
      });

      if (!timeline || !timeline.isActive) {
        return res.status(404).json({ 
          error: 'No active timeline found for this country' 
        });
      }

      return res.status(200).json(timeline);
    } catch (error) {
      console.error('Error fetching custom timeline by country:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

### مثال: API Endpoint لجلب جميع المراحل

```typescript
// pages/api/custom-timeline/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const timelines = await prisma.customTimeline.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json({ items: timelines });
    } catch (error) {
      console.error('Error fetching custom timelines:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

## استخدام المراحل في Frontend

### مثال: React Component لجلب وعرض المراحل

```typescript
import { useEffect, useState } from 'react';

interface TimelineStage {
  label: string;
  field: string;
  order: number;
  icon?: string;
}

interface CustomTimeline {
  id: number;
  country: string;
  name: string | null;
  stages: TimelineStage[];
  isActive: boolean;
}

export default function OrderTimeline({ orderId, nationality }: { 
  orderId: string; 
  nationality: string 
}) {
  const [stages, setStages] = useState<TimelineStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStages();
  }, [nationality]);

  const fetchStages = async () => {
    setLoading(true);
    try {
      // 1. محاولة جلب المراحل المخصصة
      let customTimeline: CustomTimeline | null = null;
      
      if (nationality) {
        const res = await fetch(
          `/api/custom-timeline/by-country/${encodeURIComponent(nationality)}`
        );
        
        if (res.ok) {
          customTimeline = await res.json();
        }
      }

      // 2. تحديد المراحل (مخصصة أو افتراضية)
      if (customTimeline && customTimeline.isActive) {
        const sortedStages = [...customTimeline.stages].sort(
          (a, b) => a.order - b.order
        );
        setStages(sortedStages);
      } else {
        // استخدام المراحل الافتراضية
        setStages(DEFAULT_STAGES);
      }
    } catch (error) {
      console.error('Error fetching stages:', error);
      // Fallback to default stages
      setStages(DEFAULT_STAGES);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div>
      {stages.map((stage) => (
        <div key={stage.field}>
          <h3>{stage.label}</h3>
          <p>Field: {stage.field}</p>
          <p>Order: {stage.order}</p>
        </div>
      ))}
    </div>
  );
}
```

## حفظ حالة المراحل

### حفظ حالة مرحلة في arrivallist

```typescript
async function updateStageStatus(
  orderId: number,
  fieldName: string,
  completed: boolean
) {
  try {
    // جلب السجل الحالي
    const arrival = await prisma.arrivallist.findFirst({
      where: { OrderId: orderId },
    });

    if (!arrival) {
      throw new Error('Arrival record not found');
    }

    // تحديث customTimelineStages
    const currentStages = (arrival.customTimelineStages as any) || {};
    currentStages[fieldName] = {
      completed: completed,
      date: completed ? new Date() : null,
    };

    // حفظ التحديثات
    await prisma.arrivallist.update({
      where: { id: arrival.id },
      data: {
        customTimelineStages: currentStages,
      },
    });
  } catch (error) {
    console.error('Error updating stage status:', error);
    throw error;
  }
}
```

### قراءة حالة المرحلة

```typescript
async function getStageStatus(orderId: number, fieldName: string): Promise<{
  completed: boolean;
  date: Date | null;
}> {
  try {
    const arrival = await prisma.arrivallist.findFirst({
      where: { OrderId: orderId },
    });

    if (!arrival || !arrival.customTimelineStages) {
      return { completed: false, date: null };
    }

    const stages = arrival.customTimelineStages as any;
    const stageStatus = stages[fieldName];

    if (!stageStatus) {
      return { completed: false, date: null };
    }

    return {
      completed: stageStatus.completed || false,
      date: stageStatus.date ? new Date(stageStatus.date) : null,
    };
  } catch (error) {
    console.error('Error getting stage status:', error);
    throw error;
  }
}
```

## إنشاء وتحديث المراحل المخصصة

### إنشاء timeline مخصص جديد

```typescript
async function createCustomTimeline(
  country: string,
  name: string | null,
  stages: TimelineStage[],
  isActive: boolean = true
) {
  try {
    const timeline = await prisma.customTimeline.create({
      data: {
        country,
        name: name || null,
        stages: stages,
        isActive,
      },
    });

    return timeline;
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('Timeline for this country already exists');
    }
    throw error;
  }
}
```

### تحديث timeline موجود

```typescript
async function updateCustomTimeline(
  id: number,
  updates: {
    country?: string;
    name?: string | null;
    stages?: TimelineStage[];
    isActive?: boolean;
  }
) {
  try {
    const timeline = await prisma.customTimeline.update({
      where: { id },
      data: updates,
    });

    return timeline;
  } catch (error: any) {
    if (error.code === 'P2025') {
      throw new Error('Timeline not found');
    }
    throw error;
  }
}
```

## أمثلة على استخدامات متقدمة

### 1. جلب المراحل مع معلومات الطلب

```typescript
async function getOrderWithStages(orderId: number) {
  try {
    // جلب بيانات الطلب
    const order = await prisma.neworder.findUnique({
      where: { id: orderId },
      include: {
        arrivals: true,
        HomeMaid: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // جلب الجنسية من الطلب أو العاملة
    const nationality = 
      order.HomeMaid?.Nationality || 
      order.arrivals?.[0]?.nationality || 
      null;

    // جلب المراحل
    const stages = await getStagesForOrder(nationality);

    // جلب حالة المراحل
    const arrival = order.arrivals?.[0];
    const stageStatuses = arrival?.customTimelineStages as any || {};

    return {
      order,
      stages,
      stageStatuses,
    };
  } catch (error) {
    console.error('Error getting order with stages:', error);
    throw error;
  }
}
```

### 2. التحقق من اكتمال المراحل

```typescript
function checkStageCompletion(
  stage: TimelineStage,
  orderData: any,
  customTimelineStages?: any
): 'completed' | 'active' | 'pending' {
  // أولاً: التحقق من customTimelineStages
  if (customTimelineStages?.[stage.field]?.completed) {
    return 'completed';
  }

  // ثانياً: التحقق من الحقول الافتراضية في orderData
  const fieldMap: { [key: string]: boolean } = {
    officeLinkInfo: !!orderData.officeLinkInfo,
    externalOfficeInfo: !!orderData.externalOfficeInfo,
    externalOfficeApproval: orderData.externalOfficeApproval?.approved || false,
    medicalCheck: orderData.medicalCheck?.passed || false,
    foreignLaborApproval: orderData.foreignLaborApproval?.approved || false,
    agencyPayment: orderData.agencyPayment?.paid || false,
    saudiEmbassyApproval: orderData.saudiEmbassyApproval?.approved || false,
    visaIssuance: orderData.visaIssuance?.issued || false,
    travelPermit: orderData.travelPermit?.issued || false,
    destinations: !!orderData.destinations,
    receipt: orderData.receipt?.received || false,
    documentUpload: !!orderData.documentUpload?.files,
  };

  return fieldMap[stage.field] ? 'completed' : 'pending';
}
```

### 3. تحديد المرحلة النشطة الحالية

```typescript
function getActiveStageIndex(
  stages: TimelineStage[],
  orderData: any,
  customTimelineStages?: any
): number {
  for (let i = 0; i < stages.length; i++) {
    const status = checkStageCompletion(
      stages[i],
      orderData,
      customTimelineStages
    );
    
    if (status === 'pending') {
      return i;
    }
  }
  
  // كل المراحل مكتملة
  return stages.length - 1;
}
```

## ملاحظات مهمة

1. **ترتيب المراحل**: دائماً قم بترتيب المراحل حسب حقل `order` قبل عرضها
2. **Fallback Mechanism**: دائماً وفر مراحل افتراضية في حالة عدم وجود timeline مخصص
3. **Validation**: تحقق من أن `isActive` هو `true` قبل استخدام timeline
4. **Error Handling**: تعامل مع الأخطاء بشكل مناسب (مثل عدم وجود timeline)
5. **Type Safety**: استخدم TypeScript interfaces لضمان نوع البيانات الصحيح
6. **Performance**: استخدم `findUnique` بدلاً من `findFirst` عند البحث عن timeline حسب الدولة (أسرع)

## هيكل البيانات الكامل

```typescript
// هيكل CustomTimeline في قاعدة البيانات
interface CustomTimeline {
  id: number;
  country: string;              // الدولة (unique)
  name: string | null;         // اسم اختياري
  stages: TimelineStage[];     // مصفوفة المراحل (JSON)
  isActive: boolean;            // حالة النشاط
  createdAt: Date;
  updatedAt: Date;
}

// هيكل المرحلة الواحدة
interface TimelineStage {
  label: string;               // اسم المرحلة للعرض
  field: string;                // اسم الحقل في قاعدة البيانات
  order: number;                // ترتيب المرحلة
  icon?: string;                // اسم الأيقونة (اختياري)
}

// هيكل حالة المرحلة في arrivallist
interface StageStatus {
  completed: boolean;
  date: Date | null;
}

// هيكل customTimelineStages في arrivallist
interface CustomTimelineStages {
  [fieldName: string]: StageStatus;
}
```

## الخلاصة

هذا الدليل يوضح كيفية:
- جلب المراحل المخصصة من قاعدة البيانات حسب الدولة
- استخدام المراحل الافتراضية كـ fallback
- حفظ وقراءة حالة المراحل
- إنشاء وتحديث المراحل المخصصة
- استخدام المراحل في API endpoints و Frontend components

يمكن استخدام هذا الدليل في أي مشروع يعتمد على نفس Prisma Schema دون الحاجة للاعتماد على هيكل المشروع الحالي.

