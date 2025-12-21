# أمثلة على استعلامات السجلات

## استعلامات SQL لجدول logs

### 1. الحصول على جميع سجلات عاملة معينة

```sql
SELECT 
  l.id,
  l.Status,
  l.Details,
  l.reason,
  l.userId,
  l.createdAt,
  u.username,
  h.Name as homemaid_name
FROM logs l
LEFT JOIN User u ON l.userId = u.username
LEFT JOIN homemaid h ON l.homemaidId = h.id
WHERE l.homemaidId = 123
ORDER BY l.createdAt DESC;
```

### 2. الحصول على سجلات عاملة في فترة زمنية محددة

```sql
SELECT 
  l.*,
  u.username
FROM logs l
LEFT JOIN User u ON l.userId = u.username
WHERE l.homemaidId = 123
  AND l.createdAt BETWEEN '2025-01-01' AND '2025-12-31'
ORDER BY l.createdAt DESC;
```

### 3. الحصول على سجلات التعديلات في الطلبات فقط

```sql
SELECT 
  l.*,
  u.username
FROM logs l
LEFT JOIN User u ON l.userId = u.username
WHERE l.homemaidId = 123
  AND l.Status LIKE '%طلب%'
ORDER BY l.createdAt DESC;
```

### 4. الحصول على سجلات تغيير العاملة في الطلبات

```sql
SELECT 
  l.*,
  u.username
FROM logs l
LEFT JOIN User u ON l.userId = u.username
WHERE l.homemaidId = 123
  AND (l.Status = 'إزالة من الطلب' OR l.Status = 'إضافة إلى الطلب')
ORDER BY l.createdAt DESC;
```

### 5. إحصائيات التعديلات لكل عاملة

```sql
SELECT 
  h.id,
  h.Name,
  COUNT(l.id) as total_logs,
  COUNT(CASE WHEN l.Status LIKE '%تعديل%' THEN 1 END) as edits_count,
  MAX(l.createdAt) as last_activity
FROM homemaid h
LEFT JOIN logs l ON h.id = l.homemaidId
GROUP BY h.id, h.Name
ORDER BY total_logs DESC;
```

### 6. الحصول على آخر 10 تعديلات لجميع العاملات

```sql
SELECT 
  l.id,
  l.Status,
  l.Details,
  l.createdAt,
  h.Name as homemaid_name,
  u.username
FROM logs l
LEFT JOIN homemaid h ON l.homemaidId = h.id
LEFT JOIN User u ON l.userId = u.username
WHERE l.Status LIKE '%طلب%'
ORDER BY l.createdAt DESC
LIMIT 10;
```

## استعلامات Prisma

### 1. الحصول على جميع سجلات عاملة معينة

```typescript
const logs = await prisma.logs.findMany({
  where: {
    homemaidId: 123,
  },
  include: {
    user: {
      select: {
        username: true,
        email: true,
      },
    },
    homemaid: {
      select: {
        Name: true,
        Passportnumber: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
});
```

### 2. الحصول على سجلات عاملة في فترة زمنية محددة

```typescript
const logs = await prisma.logs.findMany({
  where: {
    homemaidId: 123,
    createdAt: {
      gte: new Date('2025-01-01'),
      lte: new Date('2025-12-31'),
    },
  },
  include: {
    user: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
});
```

### 3. الحصول على سجلات التعديلات في الطلبات فقط

```typescript
const logs = await prisma.logs.findMany({
  where: {
    homemaidId: 123,
    Status: {
      contains: 'طلب',
    },
  },
  include: {
    user: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
});
```

### 4. الحصول على سجلات تغيير العاملة في الطلبات

```typescript
const logs = await prisma.logs.findMany({
  where: {
    homemaidId: 123,
    OR: [
      { Status: 'إزالة من الطلب' },
      { Status: 'إضافة إلى الطلب' },
    ],
  },
  include: {
    user: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
});
```

### 5. إحصائيات التعديلات لكل عاملة

```typescript
const stats = await prisma.homemaid.findMany({
  select: {
    id: true,
    Name: true,
    logs: {
      select: {
        id: true,
        Status: true,
        createdAt: true,
      },
    },
  },
});

// معالجة البيانات
const statsProcessed = stats.map(homemaid => ({
  id: homemaid.id,
  name: homemaid.Name,
  totalLogs: homemaid.logs.length,
  editsCount: homemaid.logs.filter(log => log.Status?.includes('تعديل')).length,
  lastActivity: homemaid.logs.length > 0 
    ? homemaid.logs.reduce((latest, log) => 
        log.createdAt > latest ? log.createdAt : latest, 
        homemaid.logs[0].createdAt
      )
    : null,
}));
```

### 6. الحصول على آخر 10 تعديلات لجميع العاملات

```typescript
const recentLogs = await prisma.logs.findMany({
  where: {
    Status: {
      contains: 'طلب',
    },
  },
  include: {
    homemaid: {
      select: {
        Name: true,
        Passportnumber: true,
      },
    },
    user: {
      select: {
        username: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 10,
});
```

## مثال على صفحة عرض السجلات (React Component)

```typescript
import { useState, useEffect } from 'react';

interface Log {
  id: number;
  Status: string;
  Details?: string;
  reason?: string;
  createdAt: Date;
  user?: {
    username: string;
  };
}

export default function HomemaidLogs({ homemaidId }: { homemaidId: number }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [homemaidId]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/homemaid/${homemaidId}/logs`);
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div className="logs-container">
      <h2>سجل أنشطة العاملة</h2>
      <table>
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>الحالة</th>
            <th>التفاصيل</th>
            <th>السبب</th>
            <th>المستخدم</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{new Date(log.createdAt).toLocaleString('ar-SA')}</td>
              <td>{log.Status}</td>
              <td>{log.Details}</td>
              <td>{log.reason}</td>
              <td>{log.user?.username}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## مثال على API endpoint لجلب السجلات

```typescript
// pages/api/homemaid/[id]/logs.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const logs = await prisma.logs.findMany({
        where: {
          homemaidId: Number(id),
        },
        include: {
          user: {
            select: {
              username: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json(logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

## ملاحظات

1. **الفهرسة**: تأكد من وجود فهرس على `homemaidId` في جدول `logs` لتحسين الأداء
2. **التصفية**: يمكنك إضافة المزيد من الفلاتر حسب الحاجة (مثل: نوع التعديل، المستخدم، إلخ)
3. **الترقيم**: للصفحات الكبيرة، استخدم pagination لتحسين الأداء
4. **التصدير**: يمكنك إضافة وظيفة تصدير السجلات إلى Excel أو PDF

