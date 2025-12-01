# أمثلة الاستخدام - Complaints System Examples

## 🎯 أمثلة عملية لاستخدام نظام الشكاوى

### 1️⃣ مثال: إرسال شكوى من المستخدم

```typescript
// في أي component
const handleSubmitComplaint = async () => {
  try {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'مشكلة في تسجيل الدخول',
        description: 'لا أستطيع تسجيل الدخول إلى النظام منذ الصباح',
        screenshot: 'https://example.com/screenshot.png' // اختياري
      })
    });

    const data = await res.json();
    
    if (data.success) {
      alert('تم إرسال الشكوى بنجاح!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 2️⃣ مثال: جلب شكاوى المستخدم

```typescript
// جلب شكاوى المستخدم الحالي فقط
const fetchMyComplaints = async () => {
  try {
    const res = await fetch('/api/complaints?myComplaints=true');
    const data = await res.json();
    
    if (data.success) {
      console.log('شكاواي:', data.complaints);
      console.log('الإحصائيات:', data.stats);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 3️⃣ مثال: تحديث حالة الشكوى (IT)

```typescript
// تحديث حالة شكوى إلى "تم الحل"
const resolveComplaint = async (complaintId: number) => {
  try {
    const res = await fetch('/api/complaints', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: complaintId,
        status: 'resolved',
        resolutionNotes: 'تم حل المشكلة عن طريق إعادة تعيين كلمة المرور',
        assignedToId: 5 // ID مستخدم IT
      })
    });

    const data = await res.json();
    
    if (data.success) {
      alert('تم تحديث الشكوى بنجاح!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 4️⃣ مثال: جلب إحصائيات الشكاوى

```typescript
// جلب الإحصائيات
const fetchComplaintsStats = async () => {
  try {
    const res = await fetch('/api/complaints/stats');
    const data = await res.json();
    
    if (data.success) {
      console.log('إجمالي الشكاوى:', data.stats.total);
      console.log('قيد الانتظار:', data.stats.byStatus.pending);
      console.log('قيد المعالجة:', data.stats.byStatus.in_progress);
      console.log('تم الحل:', data.stats.byStatus.resolved);
      
      // إحصائيات IT (إذا كان لديه صلاحية)
      if (data.stats.it) {
        console.log('غير مُسندة:', data.stats.it.unassigned);
        console.log('مُسندة لي:', data.stats.it.myAssigned);
        console.log('عاجلة:', data.stats.it.urgent);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 5️⃣ مثال: استخدام ComplaintsBadge Component

```tsx
import ComplaintsBadge from 'components/ComplaintsBadge';

// في Navigation Bar للمستخدم العادي
function UserNavBar() {
  return (
    <nav>
      <ComplaintsBadge />
    </nav>
  );
}

// في Navigation Bar لمستخدم IT
function ITNavBar() {
  return (
    <nav>
      <ComplaintsBadge showForIT={true} />
    </nav>
  );
}
```

### 6️⃣ مثال: فلترة الشكاوى

```typescript
// فلترة الشكاوى حسب الحالة
const fetchPendingComplaints = async () => {
  const res = await fetch('/api/complaints?status=pending');
  const data = await res.json();
  return data.complaints;
};

// جلب الشكاوى المُسندة لي
const fetchMyAssignedComplaints = async () => {
  const res = await fetch('/api/complaints?assignedToMe=true');
  const data = await res.json();
  return data.complaints;
};
```

### 7️⃣ مثال: رفع صورة

```typescript
const uploadScreenshot = async (file: File) => {
  // تحويل الصورة إلى base64
  const reader = new FileReader();
  
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      
      try {
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            file: base64, 
            filename: file.name 
          })
        });
        
        const data = await res.json();
        
        if (data.url) {
          resolve(data.url);
        } else {
          reject(new Error('فشل في رفع الصورة'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.readAsDataURL(file);
  });
};

// استخدام
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  try {
    const imageUrl = await uploadScreenshot(file);
    console.log('تم رفع الصورة:', imageUrl);
  } catch (error) {
    console.error('خطأ في رفع الصورة:', error);
  }
};
```

### 8️⃣ مثال: حذف شكوى

```typescript
const deleteComplaint = async (complaintId: number) => {
  if (!confirm('هل أنت متأكد من حذف هذه الشكوى؟')) {
    return;
  }
  
  try {
    const res = await fetch(`/api/complaints?id=${complaintId}`, {
      method: 'DELETE'
    });
    
    const data = await res.json();
    
    if (data.success) {
      alert('تم حذف الشكوى بنجاح');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 9️⃣ مثال: عرض تفاصيل شكوى

```typescript
const fetchComplaintDetails = async (complaintId: number) => {
  try {
    const res = await fetch(`/api/complaints/${complaintId}`);
    const data = await res.json();
    
    if (data.success) {
      const complaint = data.complaint;
      
      console.log('العنوان:', complaint.title);
      console.log('الوصف:', complaint.description);
      console.log('الحالة:', complaint.status);
      console.log('المُرسل:', complaint.createdBy.username);
      
      if (complaint.assignedTo) {
        console.log('مُسند إلى:', complaint.assignedTo.username);
      }
      
      if (complaint.resolutionNotes) {
        console.log('ملاحظات الحل:', complaint.resolutionNotes);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 🔟 مثال: Component كامل للشكاوى

```tsx
import { useState, useEffect } from 'react';

interface Complaint {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: Date;
}

function MyComplaintsWidget() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/complaints?myComplaints=true');
      const data = await res.json();
      
      if (data.success) {
        setComplaints(data.complaints);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="complaints-widget">
      <h3>شكاواي ({complaints.length})</h3>
      
      {complaints.length === 0 ? (
        <p>لا توجد شكاوى</p>
      ) : (
        <ul>
          {complaints.map(complaint => (
            <li key={complaint.id}>
              <h4>{complaint.title}</h4>
              <p>{complaint.description}</p>
              <span className={`status ${complaint.status}`}>
                {complaint.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MyComplaintsWidget;
```

## 🎨 أمثلة التصميم

### مثال: Badge مخصص للحالة

```tsx
const StatusBadge = ({ status }: { status: string }) => {
  const config: any = {
    pending: { 
      label: 'قيد الانتظار', 
      color: 'bg-yellow-100 text-yellow-800',
      icon: '⏳'
    },
    in_progress: { 
      label: 'قيد المعالجة', 
      color: 'bg-blue-100 text-blue-800',
      icon: '🔄'
    },
    resolved: { 
      label: 'تم الحل', 
      color: 'bg-green-100 text-green-800',
      icon: '✅'
    },
    closed: { 
      label: 'مغلقة', 
      color: 'bg-gray-100 text-gray-800',
      icon: '🔒'
    }
  };

  const { label, color, icon } = config[status] || config.pending;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
      {icon} {label}
    </span>
  );
};
```

### مثال: بطاقة شكوى

```tsx
const ComplaintCard = ({ complaint }: { complaint: Complaint }) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {complaint.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {complaint.description}
          </p>
        </div>
        <StatusBadge status={complaint.status} />
      </div>
      
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>📅 {new Date(complaint.createdAt).toLocaleDateString('ar-SA')}</span>
        <span>👤 {complaint.createdBy.username}</span>
      </div>
      
      {complaint.resolutionNotes && (
        <div className="mt-4 bg-green-50 rounded-lg p-3">
          <p className="text-sm text-green-800">
            ✅ {complaint.resolutionNotes}
          </p>
        </div>
      )}
    </div>
  );
};
```

## 🔔 أمثلة الإشعارات

### مثال: إنشاء إشعار مخصص

```typescript
// في API أو Server-side
const createComplaintNotification = async (complaint: any) => {
  // إشعار لمستخدمي IT
  await prisma.notifications.create({
    data: {
      title: 'شكوى جديدة',
      message: `شكوى جديدة من ${complaint.createdBy.username}: ${complaint.title}`,
      type: 'complaint',
      userId: null, // إشعار عام
      isRead: false
    }
  });
};

// إشعار للمستخدم عند التحديث
const notifyComplaintUpdate = async (complaint: any, status: string) => {
  const messages: any = {
    'in_progress': 'جاري العمل على شكواك',
    'resolved': 'تم حل شكواك بنجاح',
    'closed': 'تم إغلاق شكواك'
  };

  await prisma.notifications.create({
    data: {
      title: 'تحديث على شكواك',
      message: messages[status] || `تم تحديث حالة شكواك`,
      type: 'complaint_update',
      userId: complaint.createdById.toString(),
      isRead: false
    }
  });
};
```

## 📊 أمثلة الإحصائيات

### مثال: Dashboard Widget

```tsx
function ComplaintsStatsWidget() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/complaints/stats')
      .then(res => res.json())
      .then(data => setStats(data.stats));
  }, []);

  if (!stats) return <div>جاري التحميل...</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="stat-card">
        <h4>الإجمالي</h4>
        <p className="text-3xl font-bold">{stats.total}</p>
      </div>
      
      <div className="stat-card yellow">
        <h4>قيد الانتظار</h4>
        <p className="text-3xl font-bold">{stats.byStatus.pending || 0}</p>
      </div>
      
      <div className="stat-card blue">
        <h4>قيد المعالجة</h4>
        <p className="text-3xl font-bold">{stats.byStatus.in_progress || 0}</p>
      </div>
      
      <div className="stat-card green">
        <h4>تم الحل</h4>
        <p className="text-3xl font-bold">{stats.byStatus.resolved || 0}</p>
      </div>
    </div>
  );
}
```

## 🔐 أمثلة التحقق من الصلاحيات

### مثال: التحقق من صلاحية IT

```typescript
// في Server-side
const checkITPermission = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  });

  const rolePermissions = user?.role?.permissions as any;
  const canManageComplaints = !!rolePermissions?.["إدارة الشكاوى"]?.["حل"];

  return canManageComplaints;
};

// استخدام
if (await checkITPermission(userId)) {
  // يمكنه حل الشكاوى
} else {
  // لا يمكنه حل الشكاوى
}
```

### مثال: حماية Component

```tsx
function ITOnlyComponent() {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // التحقق من الصلاحية
    fetch('/api/complaints/stats')
      .then(res => res.json())
      .then(data => {
        setHasPermission(!!data.stats.it);
      });
  }, []);

  if (!hasPermission) {
    return <div>ليس لديك صلاحية للوصول</div>;
  }

  return <div>محتوى IT فقط</div>;
}
```

## 🎯 أمثلة متقدمة

### مثال: Auto-refresh للشكاوى

```tsx
function ComplaintsList() {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    // جلب الشكاوى فوراً
    fetchComplaints();

    // تحديث كل 30 ثانية
    const interval = setInterval(fetchComplaints, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchComplaints = async () => {
    const res = await fetch('/api/complaints');
    const data = await res.json();
    setComplaints(data.complaints);
  };

  return (
    <div>
      {complaints.map(complaint => (
        <ComplaintCard key={complaint.id} complaint={complaint} />
      ))}
    </div>
  );
}
```

### مثال: Real-time notifications

```tsx
// استخدام WebSocket أو Polling
function useComplaintsNotifications() {
  const [newComplaints, setNewComplaints] = useState(0);

  useEffect(() => {
    const checkNewComplaints = async () => {
      const res = await fetch('/api/complaints/stats');
      const data = await res.json();
      
      // عدد الشكاوى الجديدة (pending)
      setNewComplaints(data.stats.byStatus.pending || 0);
    };

    // تحقق كل 10 ثواني
    const interval = setInterval(checkNewComplaints, 10000);
    checkNewComplaints(); // تحقق فوري

    return () => clearInterval(interval);
  }, []);

  return newComplaints;
}

// استخدام
function NavBar() {
  const newComplaints = useComplaintsNotifications();

  return (
    <nav>
      {newComplaints > 0 && (
        <span className="badge">{newComplaints}</span>
      )}
    </nav>
  );
}
```

---

## 📝 ملاحظات

- جميع الأمثلة تستخدم TypeScript
- يمكن تعديل الأمثلة حسب احتياجاتك
- تأكد من معالجة الأخطاء في كل مثال
- استخدم Loading states للتجربة الأفضل

---

**💡 نصيحة:** استخدم هذه الأمثلة كنقطة انطلاق وقم بتخصيصها حسب احتياجات مشروعك!

