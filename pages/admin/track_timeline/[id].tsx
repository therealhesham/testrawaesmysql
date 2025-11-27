/*
صفحة تتبع الطلب مع جدول زمني مخصص
*/

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import InfoCard from 'components/InfoCard';
import Head from 'next/head';
import ErrorModal from 'components/ErrorModal';
import { CheckCircleIcon } from '@heroicons/react/solid';
import Layout from 'example/containers/Layout';
import Style from 'styles/Home.module.css';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';
import { CheckCircle } from 'lucide-react';

interface OrderData {
  orderId: string;
  clientInfo: { id?: string; name: string; phone: string; email: string };
  homemaidInfo: { id: string; name: string; passportNumber: string; nationality: string; externalOffice: string };
  applicationInfo: { applicationDate: string; applicationTime: string };
  nationality?: string;
  externalOfficeApproval?: { approved: boolean };
  medicalCheck?: { passed: boolean };
  foreignLaborApproval?: { approved: boolean };
  agencyPayment?: { paid: boolean };
  saudiEmbassyApproval?: { approved: boolean };
  visaIssuance?: { issued: boolean };
  travelPermit?: { issued: boolean };
  receipt?: { received: boolean };
  customTimelineStages?: { [key: string]: { completed: boolean; date: string | null } };
}

interface CustomTimeline {
  id: number;
  country: string;
  name: string | null;
  stages: Array<{ label: string; field: string; order: number }>;
  isActive: boolean;
}

export default function TrackTimeline() {
  const router = useRouter();
  const { id } = router.query;
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [customTimeline, setCustomTimeline] = useState<CustomTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showErrorModal, setShowErrorModal] = useState({
    isOpen: false,
    title: 'حدث خطأ',
    message: '',
  });

  useEffect(() => {
    if (id) {
      fetchOrderData();
    }
  }, [id]);

  const fetchOrderData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/track_order/${id}`);
      if (!res.ok) throw new Error('فشل في جلب بيانات الطلب');
      const data = await res.json();
      setOrderData(data);

      // جلب custom timeline للدولة
      if (data.nationality) {
        try {
          const timelineRes = await fetch(`/api/custom-timeline/by-country/${encodeURIComponent(data.nationality)}`);
          if (timelineRes.ok) {
            const timelineData = await timelineRes.json();
            setCustomTimeline(timelineData);
          }
        } catch (err) {
          console.error('Error fetching custom timeline:', err);
        }
      }

      setError(null);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      setShowErrorModal({
        isOpen: true,
        title: 'خطأ في جلب البيانات',
        message: error.message || 'حدث خطأ غير متوقع',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (field: string, value: boolean) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/track_order/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'فشل في تحديث الحالة');
      }
      await fetchOrderData();
    } catch (error: any) {
      console.error('Error updating status:', error);
      setShowErrorModal({
        isOpen: true,
        title: 'خطأ في تحديث الحالة',
        message: error.message || 'حدث خطأ أثناء تحديث الحالة',
      });
    } finally {
      setUpdating(false);
    }
  };

  // دالة للحصول على قيمة الحقل من orderData
  const getFieldValue = (field: string): boolean => {
    if (!orderData) return false;
    
    // أولاً: التحقق من customTimelineStages للحقول المخصصة
    if (orderData.customTimelineStages && orderData.customTimelineStages[field]) {
      return orderData.customTimelineStages[field].completed || false;
    }
    
    // ثانياً: Mapping للحقول الشائعة
    const fieldMap: { [key: string]: any } = {
      externalOfficeApproval: orderData.externalOfficeApproval?.approved,
      medicalCheck: orderData.medicalCheck?.passed,
      foreignLaborApproval: orderData.foreignLaborApproval?.approved,
      agencyPayment: orderData.agencyPayment?.paid,
      saudiEmbassyApproval: orderData.saudiEmbassyApproval?.approved,
      visaIssuance: orderData.visaIssuance?.issued,
      travelPermit: orderData.travelPermit?.issued,
      receipt: orderData.receipt?.received,
    };

    return fieldMap[field] || false;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen font-tajawal flex justify-center items-center" dir="rtl">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-900"></div>
            <span className="mr-2 text-teal-900">جاري التحميل...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !orderData) {
    return (
      <Layout>
        <div className="min-h-screen font-tajawal" dir="rtl">
          {error || 'الطلب غير موجود'}
        </div>
      </Layout>
    );
  }

  if (!customTimeline) {
    return (
      <Layout>
        <div className="min-h-screen font-tajawal" dir="rtl">
          <div className="text-center p-8">
            <p className="text-red-600">لا يوجد جدول زمني مخصص لهذه الدولة</p>
            <button
              onClick={() => router.push(`/admin/track_order/${id}`)}
              className="mt-4 bg-teal-800 text-white px-4 py-2 rounded-md"
            >
              العودة إلى الجدول الزمني العادي
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ترتيب المراحل حسب order
  const sortedStages = [...customTimeline.stages].sort((a, b) => a.order - b.order);

  return (
    <Layout>
      <div className={`min-h-screen ${Style['tajawal-regular']}`} dir="rtl">
        <Head>
          <title>تتبع الطلب - {customTimeline.name || customTimeline.country}</title>
        </Head>
        <main className="max-w-7xl mx-auto px-5 py-8">
          {error && <div className="text-red-600 text-md mb-4 text-right">{error}</div>}

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-normal text-gray-900">طلب #{orderData.orderId}</h1>
              <p className="text-sm text-gray-600 mt-1">
                جدول زمني مخصص: {customTimeline.name || customTimeline.country}
              </p>
            </div>
            <button
              onClick={() => router.push(`/admin/track_order/${id}`)}
              className="border border-teal-800 text-teal-800 px-4 py-2 rounded-md text-md hover:bg-teal-800 hover:text-white"
            >
              عرض الجدول الزمني العادي
            </button>
          </div>

          {/* Custom Timeline Stepper */}
          <section className="p-5 mb-6">
            <h2 className="text-3xl font-normal text-center mb-10">تتبع الطلب</h2>
            <div className="flex no-wrap justify-center gap-5 overflow-x-auto">
              {sortedStages.map((stage, index) => {
                const isCompleted = getFieldValue(stage.field);
                const isActive = index === sortedStages.findIndex((s) => !getFieldValue(s.field));

                return (
                  <div key={index} className="flex items-start flex-shrink-0">
                    <div className="flex flex-col items-center w-24 text-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center border ${
                          isCompleted
                            ? 'bg-teal-800 border-teal-800 text-white'
                            : isActive
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'border-teal-800 text-teal-800'
                        } text-sm hover:scale-110 transition-transform`}
                      >
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <p className="text-xs mt-2 text-gray-900 hover:text-teal-800 transition-colors">
                        {stage.label}
                      </p>
                    </div>
                    {index < sortedStages.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 my-3.5 mx-2.5 ${
                          isCompleted ? 'bg-teal-800' : 'bg-gray-500'
                        }`}
                      ></div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <InfoCard
            title="معلومات العميل"
            data={[
              { label: 'اسم العميل', value: orderData.clientInfo.name },
              { label: 'رقم الهاتف', value: orderData.clientInfo.phone },
              { label: 'البريد الإلكتروني', value: orderData.clientInfo.email },
              { label: 'رقم الطلب', value: orderData.orderId },
            ]}
            gridCols={3}
          />

          <InfoCard
            title="معلومات العاملة"
            data={[
              { label: 'اسم العاملة', value: orderData.homemaidInfo.name },
              { label: 'رقم جواز السفر', value: orderData.homemaidInfo.passportNumber },
              { label: 'الجنسية', value: orderData.nationality || 'غير محدد' },
              { label: 'المكتب الخارجي', value: orderData.homemaidInfo.externalOffice },
            ]}
            gridCols={3}
          />

          {/* عرض المراحل المخصصة */}
          {sortedStages.map((stage, index) => {
            const fieldValue = getFieldValue(stage.field);
            return (
              <InfoCard
                key={index}
                id={`stage-${index}`}
                title={`${index + 1}- ${stage.label}`}
                data={[
                  {
                    label: `هل تم إكمال ${stage.label}؟`,
                    value: fieldValue ? (
                      <CheckCircleIcon className="w-8 h-8 mx-auto text-teal-800" aria-label="تم الإكمال" />
                    ) : (
                      <button
                        className="bg-teal-800 text-white px-4 py-2 rounded-md text-md hover:bg-teal-900 disabled:opacity-50"
                        onClick={() => handleStatusUpdate(stage.field, true)}
                        disabled={updating}
                      >
                        تأكيد الإكمال
                      </button>
                    ),
                  },
                ]}
                actions={[
                  {
                    label: 'تراجع',
                    type: 'secondary',
                    onClick: () => handleStatusUpdate(stage.field, false),
                    disabled: updating || !fieldValue,
                  },
                ]}
              />
            );
          })}
        </main>

        <ErrorModal
          isOpen={showErrorModal.isOpen}
          title={showErrorModal.title}
          message={showErrorModal.message}
          onClose={() => setShowErrorModal({ ...showErrorModal, isOpen: false })}
        />
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req }: { req: any }) {
  try {
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(';').forEach((cookie: string) => {
        const [key, value] = cookie.trim().split('=');
        cookies[key] = decodeURIComponent(value);
      });
    }

    if (!cookies.authToken) {
      return {
        redirect: { destination: '/admin/login', permanent: false },
      };
    }

    const token = jwtDecode(cookies.authToken) as any;

    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });
    if (
      !findUser ||
      !(findUser.role?.permissions as any)?.['إدارة الطلبات']?.['إضافة']
    ) {
      return {
        redirect: { destination: '/admin/home', permanent: false },
      };
    }

    return { props: {} };
  } catch (err) {
    console.error('Authorization error:', err);
    return {
      redirect: { destination: '/admin/home', permanent: false },
    };
  }
}

