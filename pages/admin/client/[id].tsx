/*
صفحة اختبار لعرض التايم لاين الديناميكي للعميل
*/

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from 'example/containers/Layout';
import Style from 'styles/Home.module.css';
import { CheckCircle, Link, Briefcase, DollarSign, Flag, Plane, MapPin, Package, FileText, CheckCircle2 } from 'lucide-react';
import { FaStethoscope } from 'react-icons/fa';

interface TimelineStage {
  label: string;
  field: string;
  order: number;
  icon?: string;
}

interface OrderData {
  orderId: string;
  clientInfo: { id?: string; name: string; phone: string; email: string };
  homemaidInfo: { id: string; name: string; passportNumber: string; nationality: string; externalOffice: string };
  applicationInfo: { applicationDate: string; applicationTime: string };
  officeLinkInfo?: { nationalId: string; visaNumber: string; internalMusanedContract: string; musanedDate: string };
  externalOfficeInfo?: { officeName: string; country: string; externalMusanedContract: string };
  nationality?: string;
  externalOfficeApproval?: { approved: boolean };
  medicalCheck?: { passed: boolean };
  medicalFile?: string | null;
  foreignLaborApproval?: { approved: boolean };
  agencyPayment?: { paid: boolean };
  saudiEmbassyApproval?: { approved: boolean };
  visaIssuance?: { issued: boolean };
  travelPermit?: { issued: boolean };
  destinations?: { departureCity: string; arrivalCity: string; departureDateTime: string; arrivalDateTime: string };
  ticketUpload?: { files: string };
  receipt?: { received: boolean; method?: string };
  documentUpload?: { files: string | string[] | null };
  deliveryDetails?: {
    deliveryDate?: string;
    deliveryTime?: string;
    deliveryFile?: string | null;
    deliveryNotes?: string;
    cost?: string | number;
  };
  customTimelineStages?: { [key: string]: { completed: boolean; date: string | null } };
}

interface CustomTimeline {
  id: number;
  country: string;
  name: string | null;
  stages: TimelineStage[];
  isActive: boolean;
}

// المراحل الافتراضية
const DEFAULT_STAGES: TimelineStage[] = [
  { label: 'الربط مع إدارة المكاتب', field: 'officeLinkInfo', order: 0, icon: 'Link' },
  { label: 'المكتب الخارجي', field: 'externalOfficeInfo', order: 1, icon: 'Briefcase' },
  { label: 'موافقة المكتب الخارجي', field: 'externalOfficeApproval', order: 2, icon: 'CheckCircle' },
  { label: 'الفحص الطبي', field: 'medicalCheck', order: 3, icon: 'Stethoscope' },
  { label: 'موافقة وزارة العمل الأجنبية', field: 'foreignLaborApproval', order: 4, icon: 'Flag' },
  { label: 'دفع الوكالة', field: 'agencyPayment', order: 5, icon: 'DollarSign' },
  { label: 'موافقة السفارة السعودية', field: 'saudiEmbassyApproval', order: 6, icon: 'Flag' },
  { label: 'إصدار التأشيرة', field: 'visaIssuance', order: 7, icon: 'Plane' },
  { label: 'تصريح السفر', field: 'travelPermit', order: 8, icon: 'Plane' },
  { label: 'الوجهات', field: 'destinations', order: 9, icon: 'MapPin' },
  { label: 'الاستلام', field: 'receipt', order: 10, icon: 'Package' },
  { label: 'رفع المستندات', field: 'documentUpload', order: 11, icon: 'FileText' },
];

// دالة للحصول على أيقونة من الاسم
const getIconComponent = (iconName?: string) => {
  if (!iconName) return <CheckCircle className="w-5 h-5" />;
  
  const iconMap: { [key: string]: JSX.Element } = {
    'Link': <Link className="w-5 h-5" />,
    'Briefcase': <Briefcase className="w-5 h-5" />,
    'CheckCircle': <CheckCircle className="w-5 h-5" />,
    'Stethoscope': <FaStethoscope className="w-5 h-5" />,
    'DollarSign': <DollarSign className="w-5 h-5" />,
    'Flag': <Flag className="w-5 h-5" />,
    'Plane': <Plane className="w-5 h-5" />,
    'MapPin': <MapPin className="w-5 h-5" />,
    'Package': <Package className="w-5 h-5" />,
    'FileText': <FileText className="w-5 h-5" />,
  };
  
  return iconMap[iconName] || <CheckCircle className="w-5 h-5" />;
};

export default function ClientTimelineTest() {
  const router = useRouter();
  const { id } = router.query;
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [customTimeline, setCustomTimeline] = useState<CustomTimeline | null>(null);
  const [stages, setStages] = useState<TimelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchOrderTimeline();
    }
  }, [id]);

  const fetchOrderTimeline = async () => {
    setLoading(true);
    try {
      // 1. جلب بيانات الطلب
      const orderRes = await fetch(`/api/track_order/${id}`);
      if (!orderRes.ok) throw new Error('فشل في جلب بيانات الطلب');
      const order = await orderRes.json();
      setOrderData(order);

      // 2. جلب التايم لاين المخصص بناءً على جنسية الطلب
      let timeline = null;
      if (order.nationality) {
        try {
          const timelineRes = await fetch(
            `/api/custom-timeline/by-country/${encodeURIComponent(order.nationality)}`
          );
          if (timelineRes.ok) {
            timeline = await timelineRes.json();
            setCustomTimeline(timeline);
          }
        } catch (err) {
          console.error('Error fetching custom timeline:', err);
        }
      }

      // 3. تحديد المراحل (مخصصة أو افتراضية)
      if (timeline && timeline.isActive) {
        const sortedStages = [...timeline.stages].sort((a, b) => a.order - b.order);
        setStages(sortedStages);
      } else {
        // استخدام المراحل الافتراضية
        setStages(DEFAULT_STAGES);
      }

      setError(null);
    } catch (error: any) {
      console.error('Error fetching timeline:', error);
      setError(error.message || 'حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  // دالة لمعرفة حالة كل مرحلة
  const getStageStatus = (stage: TimelineStage): 'completed' | 'active' | 'pending' => {
    if (!orderData) return 'pending';
    
    // أولاً: التحقق من customTimelineStages
    if (orderData.customTimelineStages?.[stage.field]?.completed) {
      return 'completed';
    }
    
    // ثانياً: Mapping للحقول الافتراضية
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
  };

  // دالة لتحديد المرحلة النشطة (الحالية)
  const getActiveStageIndex = (): number => {
    for (let i = 0; i < stages.length; i++) {
      const status = getStageStatus(stages[i]);
      if (status === 'pending') {
        return i;
      }
    }
    return stages.length - 1; // كل المراحل مكتملة
  };

  if (loading) {
    return (
      <Layout>
        <div className={`min-h-screen ${Style['tajawal-regular']} flex justify-center items-center`} dir="rtl">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-900"></div>
            <span className="text-teal-900 text-lg">جاري التحميل...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !orderData) {
    return (
      <Layout>
        <div className={`min-h-screen ${Style['tajawal-regular']} flex justify-center items-center`} dir="rtl">
          <div className="text-center p-8">
            <p className="text-red-600 text-xl mb-4">{error || 'الطلب غير موجود'}</p>
            <button
              onClick={() => router.push('/admin/home')}
              className="bg-teal-800 text-white px-6 py-2 rounded-md hover:bg-teal-900 transition-colors"
            >
              العودة للصفحة الرئيسية
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const activeIndex = getActiveStageIndex();

  return (
    <Layout>
      <div className={`min-h-screen ${Style['tajawal-regular']}`} dir="rtl">
        <Head>
          <title>تتبع الطلب - {orderData.orderId}</title>
        </Head>
        <main className="max-w-7xl mx-auto px-5 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">طلب #{orderData.orderId}</h1>
                <p className="text-sm text-gray-600 mt-2">
                  {customTimeline && customTimeline.isActive
                    ? `جدول زمني مخصص: ${customTimeline.name || customTimeline.country}`
                    : 'جدول زمني افتراضي'}
                </p>
              </div>
              <button
                onClick={() => router.push('/admin/home')}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                العودة
              </button>
            </div>
          </div>

          {/* Timeline Display */}
          <section className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">تتبع الطلب</h2>
            <div className="flex flex-wrap justify-center gap-4 overflow-x-auto pb-4">
              {stages.map((stage, index) => {
                const status = getStageStatus(stage);
                const isCompleted = status === 'completed';
                const isActive = index === activeIndex && !isCompleted;
                
                return (
                  <div key={stage.field} className="flex items-start flex-shrink-0">
                    <div className="flex flex-col items-center w-28 text-center">
                      {/* Icon Circle */}
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCompleted
                            ? 'bg-teal-800 border-teal-800 text-white shadow-lg'
                            : isActive
                            ? 'bg-teal-600 border-teal-600 text-white shadow-md animate-pulse'
                            : 'bg-white border-gray-300 text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-7 h-7" />
                        ) : (
                          <div className="text-gray-600">
                            {getIconComponent(stage.icon)}
                          </div>
                        )}
                      </div>
                      
                      {/* Stage Label */}
                      <p className={`text-xs mt-3 font-medium max-w-[100px] ${
                        isCompleted
                          ? 'text-teal-800'
                          : isActive
                          ? 'text-teal-600 font-bold'
                          : 'text-gray-500'
                      }`}>
                        {stage.label}
                      </p>
                      
                      {/* Stage Number */}
                      <p className="text-xs text-gray-400 mt-1">#{index + 1}</p>
                    </div>
                    
                    {/* Connector Line */}
                    {index < stages.length - 1 && (
                      <div
                        className={`flex-1 h-1 my-7 mx-2 transition-colors ${
                          isCompleted ? 'bg-teal-800' : 'bg-gray-300'
                        }`}
                        style={{ minWidth: '40px' }}
                      ></div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Client Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">معلومات العميل</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600 font-medium">الاسم:</span>
                  <span className="text-gray-900">{orderData.clientInfo.name}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600 font-medium">الهاتف:</span>
                  <span className="text-gray-900">{orderData.clientInfo.phone}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600 font-medium">البريد الإلكتروني:</span>
                  <span className="text-gray-900">{orderData.clientInfo.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">رقم الطلب:</span>
                  <span className="text-gray-900 font-bold">{orderData.orderId}</span>
                </div>
              </div>
            </div>

            {/* Homemaid Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">معلومات العاملة</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600 font-medium">الاسم:</span>
                  <span className="text-gray-900">{orderData.homemaidInfo.name}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600 font-medium">رقم جواز السفر:</span>
                  <span className="text-gray-900">{orderData.homemaidInfo.passportNumber}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600 font-medium">الجنسية:</span>
                  <span className="text-gray-900">{orderData.nationality || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">المكتب الخارجي:</span>
                  <span className="text-gray-900">{orderData.homemaidInfo.externalOffice}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stages Details */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">تفاصيل المراحل</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stages.map((stage, index) => {
                const status = getStageStatus(stage);
                const isCompleted = status === 'completed';
                
                return (
                  <div
                    key={stage.field}
                    className={`border-2 rounded-lg p-4 transition-all ${
                      isCompleted
                        ? 'border-teal-800 bg-teal-50'
                        : index === activeIndex
                        ? 'border-teal-600 bg-teal-100'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {getIconComponent(stage.icon)}
                      <h4 className="font-bold text-gray-900">{stage.label}</h4>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-gray-600">الحالة:</span>
                      <span
                        className={`text-sm font-bold px-3 py-1 rounded-full ${
                          isCompleted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {isCompleted ? 'مكتملة' : 'قيد الانتظار'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Field: {stage.field}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Debug Info (for testing) */}
          <div className="mt-6 bg-gray-100 rounded-lg p-4">
            <h4 className="font-bold text-gray-900 mb-2">معلومات التصحيح:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>الطلب ID: {id}</p>
              <p>الجنسية: {orderData.nationality || 'غير محدد'}</p>
              <p>عدد المراحل: {stages.length}</p>
              <p>المرحلة النشطة: {activeIndex + 1}</p>
              <p>نوع التايم لاين: {customTimeline && customTimeline.isActive ? 'مخصص' : 'افتراضي'}</p>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}

