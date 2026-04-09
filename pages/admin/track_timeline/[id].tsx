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
import { CheckCircle, Link, Briefcase, DollarSign, Flag, Plane, MapPin, Package, FileText } from 'lucide-react';
import { FaStethoscope } from 'react-icons/fa';
import type { TimelineStage } from 'lib/timelineStage';
import {
  effectiveStageInteraction,
  formatCustomStageDateAr,
  isStageCompleteForOrder,
} from 'lib/timelineStage';

interface CustomTimelineStageEntry {
  completed: boolean;
  date: string | null;
  answer?: string | null;
  fileUrl?: string | null;
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
  customTimelineStages?: { [key: string]: CustomTimelineStageEntry };
}

interface CustomTimeline {
  id: number;
  country: string;
  name: string | null;
  stages: TimelineStage[];
  isActive: boolean;
}

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

export default function TrackTimeline() {
  const router = useRouter();
  const { id } = router.query;
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [customTimeline, setCustomTimeline] = useState<CustomTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentUploadFields, setDocumentUploadFields] = useState<number[]>([0]);
  /** مسودة اختيار المستخدم لمراحل السؤال قبل التأكيد */
  const [questionSelections, setQuestionSelections] = useState<Record<string, string>>({});

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

  const handleCustomStagePatch = async (
    field: string,
    value: boolean,
    meta?: { answer?: string; fileUrl?: string | null }
  ) => {
    setUpdating(true);
    try {
      const body: Record<string, unknown> = { field, value };
      if (meta && (meta.answer !== undefined || meta.fileUrl !== undefined)) {
        body.customStageMeta = {
          ...(meta.answer !== undefined ? { answer: meta.answer } : {}),
          ...(meta.fileUrl !== undefined ? { fileUrl: meta.fileUrl } : {}),
        };
      }
      const res = await fetch(`/api/track_order/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'فشل في تحديث الحالة');
      }
      await fetchOrderData();
    } catch (error: any) {
      console.error('Error updating custom stage:', error);
      setShowErrorModal({
        isOpen: true,
        title: 'خطأ في تحديث الحالة',
        message: error.message || 'حدث خطأ أثناء تحديث الحالة',
      });
    } finally {
      setUpdating(false);
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

  const handleSaveEdits = async (section: string, updatedData: Record<string, string>) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/track_order/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, updatedData }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'فشل في حفظ التعديلات');
      }
      await fetchOrderData();
    } catch (error: any) {
      console.error('Error saving edits:', error);
      setShowErrorModal({
        isOpen: true,
        title: 'خطأ في حفظ التعديلات',
        message: error.message || 'حدث خطأ أثناء حفظ التعديلات',
      });
    } finally {
      setUpdating(false);
    }
  };

  // دالة للحصول على قيمة الحقل من orderData (مع مراعاة interactionType من CustomTimeline.stages)
  const getFieldValue = (field: string, stage?: TimelineStage): boolean => {
    if (!orderData) return false;

    const meta = orderData.customTimelineStages?.[field];
    if (meta != null && typeof meta === 'object' && 'completed' in meta) {
      if (stage) {
        return isStageCompleteForOrder(stage, meta);
      }
      return !!(meta as CustomTimelineStageEntry).completed;
    }

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

  // دالة للتحقق من أن موعد الوصول قد مر
  const isArrivalDatePassed = (): boolean => {
    if (!orderData?.destinations?.arrivalDateTime) return false;
    
    const arrivalDateTime = new Date(orderData.destinations.arrivalDateTime);
    const now = new Date();
    
    return now >= arrivalDateTime;
  };

  // دالة للتحقق مما إذا كان يمكن إكمال مرحلة معينة (المرحلة السابقة يجب أن تكون مكتملة)
  const canCompleteStage = (stageIndex: number, stages: TimelineStage[]): boolean => {
    // المرحلة الأولى يمكن إكمالها دائماً
    if (stageIndex === 0) return true;
    
    // التحقق من أن جميع المراحل السابقة مكتملة
    for (let i = 0; i < stageIndex; i++) {
      if (!getFieldValue(stages[i].field, stages[i])) {
        return false;
      }
    }

    // التحقق الإضافي لمرحلة الاستلام: يجب أن يكون موعد الوصول قد مر
    if (stages[stageIndex].field === 'receipt') {
      if (!isArrivalDatePassed()) {
        return false;
      }
    }
    
    return true;
  };

  // دالة للحصول على سبب عدم إمكانية إكمال المرحلة
  const getBlockingReason = (stageIndex: number, stages: TimelineStage[]): string | null => {
    if (stageIndex === 0) return null;
    
    // التحقق من المراحل السابقة
    for (let i = 0; i < stageIndex; i++) {
      if (!getFieldValue(stages[i].field, stages[i])) {
        return `يجب إكمال: ${stages[i].label}`;
      }
    }
    
    // التحقق من موعد الوصول لمرحلة الاستلام
    if (stages[stageIndex].field === 'receipt' && !isArrivalDatePassed()) {
      if (!orderData?.destinations?.arrivalDateTime) {
        return '⚠️ يجب تحديد موعد الوصول أولاً';
      }
      const arrivalDate = new Date(orderData.destinations.arrivalDateTime);
      return `⏰ لا يمكن الاستلام قبل موعد الوصول (${arrivalDate.toLocaleDateString('ar-SA')} ${arrivalDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })})`;
    }
    
    return null;
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
            <div className="flex items-center justify-between w-full">
              {sortedStages.map((stage, index) => {
                const isCompleted = getFieldValue(stage.field, stage);
                const isActive =
                  index === sortedStages.findIndex((s) => !getFieldValue(s.field, s));

                return (
                  <div key={index} className="flex items-center flex-1">
                    <div className="flex flex-col items-center text-center flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          isCompleted
                            ? 'bg-teal-800 border-teal-800 text-white'
                            : isActive
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'border-teal-800 text-teal-800 bg-white'
                        } text-sm hover:scale-110 transition-transform shadow-md`}
                      >
                        {getIconComponent(stage.icon)}
                      </div>
                      <p className="text-xs mt-2 text-gray-900 hover:text-teal-800 transition-colors max-w-[80px] leading-tight">
                        {stage.label}
                      </p>
                      {effectiveStageInteraction(stage) === 'question' && (
                        <span className="text-[10px] text-violet-700 mt-0.5 block leading-tight" title="سؤال">
                          سؤال
                        </span>
                      )}
                      {effectiveStageInteraction(stage) === 'file' && (
                        <span className="text-[10px] text-amber-700 mt-0.5 block leading-tight" title="رفع ملف">
                          ملف
                        </span>
                      )}
                    </div>
                    {index < sortedStages.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-1 rounded-full ${
                          isCompleted ? 'bg-teal-800' : 'bg-gray-300'
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
            const fieldValue = getFieldValue(stage.field, stage);
            
            const canComplete = canCompleteStage(index, sortedStages);
            
            // إذا كانت المرحلة هي destinations، نعرض جميع الحقول
            if (stage.field === 'destinations') {
              // إذا كانت المرحلة مقفلة (المرحلة السابقة لم تكتمل)
              if (!canComplete) {
                return (
                  <InfoCard
                    key={index}
                    id={`stage-${index}`}
                    title={`${index + 1}- ${stage.label}`}
                    data={[
                      {
                        label: '',
                        value: (
                          <div className="text-center py-4">
                            <span className="text-gray-500 text-md">
                              🔒 يجب إكمال المرحلة السابقة أولاً
                            </span>
                          </div>
                        ),
                      },
                    ]}
                  />
                );
              }
              
              return (
                <InfoCard
                  key={index}
                  id={`stage-${index}`}
                  title={`${index + 1}- ${stage.label}`}
                  data={[
                    { 
                      label: 'مدينة المغادرة', 
                      value: orderData.destinations?.departureCity || 'غير محدد', 
                      fieldType: 'city' 
                    },
                    { 
                      label: 'مدينة الوصول', 
                      value: orderData.destinations?.arrivalCity || 'غير محدد', 
                      fieldType: 'saudiCity' 
                    },
                    {
                      label: 'تاريخ ووقت المغادرة',
                      value: (
                        <div className="flex items-center justify-end gap-2">
                          <span>{orderData.destinations?.departureDateTime || 'غير محدد'}</span>
                        </div>
                      ),
                    },
                    {
                      label: 'تاريخ ووقت الوصول',
                      value: (
                        <div className="flex items-center justify-end gap-2">
                          <span>{orderData.destinations?.arrivalDateTime || 'غير محدد'}</span>
                        </div>
                      ),
                    },
                    {
                      label: 'ملف التذكرة',
                      fieldType: 'file',
                      value: (editMode: boolean) => (
                        <div className="file-upload-display border border-none rounded-md p-1 flex justify-between items-center">
                          {!editMode ? (
                            <span className="text-gray-500 text-md pr-2">
                              {orderData.ticketUpload?.files ? (
                                <a
                                  href={orderData.ticketUpload.files}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-teal-800 hover:underline"
                                >
                                  تصفح الملف
                                </a>
                              ) : (
                                'لا يوجد ملف مرفق'
                              )}
                            </span>
                          ) : (
                            <>
                              <span className="text-gray-500 text-md pr-2">
                                إرفاق ملف التذكرة
                              </span>
                              <input
                                type="file"
                                id={`file-upload-destinations-${index}`}
                                className="hidden"
                                accept="application/pdf"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setUpdating(true);
                                    try {
                                      const res = await fetch(`/api/upload-presigned-url/${id}`);
                                      if (!res.ok) throw new Error('فشل في الحصول على رابط الرفع');
                                      const { url, filePath } = await res.json();

                                      const uploadRes = await fetch(url, {
                                        method: 'PUT',
                                        body: file,
                                        headers: {
                                          'Content-Type': 'application/pdf',
                                          'x-amz-acl': 'public-read',
                                        },
                                      });

                                      if (!uploadRes.ok) throw new Error('فشل في رفع الملف');

                                      await fetch(`/api/track_order/${id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          section: 'destinations',
                                          updatedData: { ticketFile: filePath },
                                        }),
                                      });

                                      await fetchOrderData();
                                    } catch (error: any) {
                                      console.error('Error uploading file:', error);
                                      setShowErrorModal({
                                        isOpen: true,
                                        title: 'خطأ في رفع الملف',
                                        message: error.message || 'حدث خطأ أثناء رفع الملف',
                                      });
                                    } finally {
                                      setUpdating(false);
                                    }
                                  }
                                }}
                              />
                              <label
                                htmlFor={`file-upload-destinations-${index}`}
                                className={`bg-teal-800 text-white px-3 py-1 rounded-md text-md cursor-pointer hover:bg-teal-900 ${updating ? 'opacity-50' : ''}`}
                              >
                                اختيار ملف
                              </label>
                            </>
                          )}
                        </div>
                      ),
                    },
                  ]}
                  gridCols={2}
                  editable={true}
                  onSave={(updatedData) => handleSaveEdits('destinations', updatedData)}
                />
              );
            }

            // إذا كانت المرحلة هي documentUpload، نعرض قسم رفع المستندات
            if (stage.field === 'documentUpload') {
              // إذا كانت المرحلة مقفلة (المرحلة السابقة لم تكتمل)
              if (!canComplete) {
                return (
                  <InfoCard
                    key={index}
                    id={`stage-${index}`}
                    title={`${index + 1}- ${stage.label}`}
                    data={[
                      {
                        label: '',
                        value: (
                          <div className="text-center py-4">
                            <span className="text-gray-500 text-md">
                              🔒 يجب إكمال المرحلة السابقة أولاً
                            </span>
                          </div>
                        ),
                      },
                    ]}
                  />
                );
              }
              
              return (
                <InfoCard
                  key={index}
                  id={`stage-${index}`}
                  title={`${index + 1}- ${stage.label}`}
                  data={[
                    {
                      label: 'ملفات أخرى',
                      value: (
                        <div className="space-y-3">
                          {/* عرض الملفات الموجودة */}
                          {(() => {
                            const existingFiles = orderData.documentUpload
                              ? Array.isArray(orderData.documentUpload.files)
                                ? orderData.documentUpload.files
                                : orderData.documentUpload.files
                                  ? [orderData.documentUpload.files]
                                  : []
                              : [];
                            
                            return existingFiles.length > 0 ? (
                              <div className="space-y-2">
                                {existingFiles.map((file, fileIndex) => (
                                  <div key={fileIndex} className="file-upload-display border border-gray-300 rounded-md p-2 flex justify-between items-center bg-gray-50">
                                    <span className="text-gray-700 text-sm pr-2 flex items-center gap-2">
                                      <a
                                        href={file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-teal-800 hover:underline"
                                      >
                                        {file.split('/').pop() || `ملف ${fileIndex + 1}`}
                                      </a>
                                      <button
                                        aria-label="حذف الملف"
                                        className="text-red-600 hover:text-red-700 text-lg font-bold"
                                        onClick={async () => {
                                          setUpdating(true);
                                          try {
                                            const updatedFiles = existingFiles.filter((_, i) => i !== fileIndex);
                                            await fetch(`/api/track_order/${id}`, {
                                              method: 'PATCH',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                section: 'documentUpload',
                                                updatedData: { files: updatedFiles.length > 0 ? updatedFiles : null },
                                              }),
                                            });
                                            await fetchOrderData();
                                          } catch (error: any) {
                                            console.error('Error deleting file:', error);
                                            setShowErrorModal({
                                              isOpen: true,
                                              title: 'خطأ في حذف الملف',
                                              message: error.message || 'حدث خطأ أثناء حذف الملف',
                                            });
                                          } finally {
                                            setUpdating(false);
                                          }
                                        }}
                                      >
                                        ×
                                      </button>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : null;
                          })()}
                          
                          {/* حقول الرفع */}
                          {documentUploadFields.map((fieldIndex, idx) => (
                            <div key={fieldIndex} className="file-upload-display border border-gray-300 rounded-md p-2 flex justify-between items-center">
                              <span className="text-gray-500 text-md pr-2">
                                إرفاق ملف {idx + 1}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="bg-teal-600 text-white px-3 py-1 rounded-md text-md cursor-pointer hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1"
                                  onClick={() => {
                                    const newIndex = Math.max(...documentUploadFields, -1) + 1;
                                    setDocumentUploadFields([...documentUploadFields, newIndex]);
                                  }}
                                  disabled={updating}
                                  title="إضافة مستند آخر"
                                >
                                  +
                                </button>
                                <input
                                  type="file"
                                  id={`file-upload-${fieldIndex}`}
                                  className="hidden"
                                  accept="application/pdf,image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setUpdating(true);
                                      try {
                                        const res = await fetch(`/api/upload-presigned-url/${id}`);
                                        if (!res.ok) throw new Error('فشل في الحصول على رابط الرفع');
                                        const { url, filePath } = await res.json();

                                        const uploadRes = await fetch(url, {
                                          method: 'PUT',
                                          body: file,
                                          headers: {
                                            'Content-Type': file.type || 'application/octet-stream',
                                            'x-amz-acl': 'public-read',
                                          },
                                        });

                                        if (!uploadRes.ok) throw new Error('فشل في رفع الملف');
                                        
                                        const existingFiles = orderData.documentUpload
                                          ? Array.isArray(orderData.documentUpload.files)
                                            ? orderData.documentUpload.files
                                            : orderData.documentUpload.files
                                              ? [orderData.documentUpload.files]
                                              : []
                                          : [];
                                        
                                        const updatedFiles = [...existingFiles, filePath];
                                        
                                        await fetch(`/api/track_order/${id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            section: 'documentUpload',
                                            updatedData: { files: updatedFiles },
                                          }),
                                        });

                                        await fetchOrderData();
                                        e.target.value = '';
                                      } catch (error: any) {
                                        console.error('Error uploading file:', error);
                                        setShowErrorModal({
                                          isOpen: true,
                                          title: 'خطأ في رفع الملف',
                                          message: error.message || 'حدث خطأ أثناء رفع الملف',
                                        });
                                      } finally {
                                        setUpdating(false);
                                      }
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`file-upload-${fieldIndex}`}
                                  className="bg-teal-800 text-white px-3 py-1 rounded-md text-md cursor-pointer hover:bg-teal-900 disabled:opacity-50"
                                >
                                  اختيار ملف
                                </label>
                                {documentUploadFields.length > 1 && (
                                  <button
                                    type="button"
                                    className="bg-red-600 text-white px-3 py-1 rounded-md text-md cursor-pointer hover:bg-red-700 disabled:opacity-50"
                                    onClick={() => {
                                      setDocumentUploadFields(documentUploadFields.filter((_, i) => i !== idx));
                                    }}
                                    disabled={updating}
                                    title="إزالة هذا الحقل"
                                  >
                                    حذف
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ),
                    },
                  ]}
                  actions={[
                    { label: 'تأكيد', type: 'primary', onClick: () => console.log('تأكيد رفع المستندات') },
                    { label: 'إلغاء التعديل', type: 'secondary', onClick: () => console.log('إلغاء تعديل المستندات') },
                  ]}
                />
              );
            }

            // مرحلة سؤال — نفس شروط CustomTimeline.stages (interactionType + نص + خيارين+)
            if (effectiveStageInteraction(stage) === 'question') {
              if (!canComplete) {
                return (
                  <InfoCard
                    key={index}
                    id={`stage-${index}`}
                    title={`${index + 1}- ${stage.label}`}
                    data={[
                      {
                        label: '',
                        value: (
                          <div className="text-center py-4">
                            <span className="text-gray-500 text-md">
                              🔒 يجب إكمال المرحلة السابقة أولاً
                            </span>
                          </div>
                        ),
                      },
                    ]}
                  />
                );
              }

              const qMeta = orderData.customTimelineStages?.[stage.field];
              const qCompleted = isStageCompleteForOrder(stage, qMeta);
              const qOptions = stage.answerOptions!;
              const qSelected =
                questionSelections[stage.field] ??
                (qMeta?.answer && qOptions.includes(qMeta.answer) ? qMeta.answer : qOptions[0]);
              const qDateStr = formatCustomStageDateAr(qMeta);

              return (
                <InfoCard
                  key={index}
                  id={`stage-${index}`}
                  title={`${index + 1}- ${stage.label}`}
                  data={[
                    {
                      label: 'السؤال الموجّه للمكتب',
                      value: (
                        <p className="text-gray-800 text-md leading-relaxed text-right">
                          {stage.questionText}
                        </p>
                      ),
                    },
                    {
                      label: 'خيارات الإجابة المعرفة للمكتب',
                      value: (
                        <p className="text-sm text-gray-700 text-right leading-relaxed">{qOptions.join(' · ')}</p>
                      ),
                    },
                    qCompleted
                      ? {
                          label: 'إجابة المكتب (المسجّلة)',
                          value: (
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                <CheckCircleIcon className="w-7 h-7 text-teal-800 shrink-0" aria-hidden />
                                <span className="text-teal-900 font-semibold text-md">{qMeta?.answer || '—'}</span>
                              </div>
                              {qDateStr && (
                                <span className="text-xs text-gray-500">تاريخ التسجيل: {qDateStr}</span>
                              )}
                            </div>
                          ),
                        }
                      : {
                          label: stage.answerType === 'options' ? 'اختر من القائمة' : 'اختر إجابة واحدة',
                          value: (
                            <div className="space-y-4 w-full text-right">
                              {stage.answerType === 'options' ? (
                                <select
                                  className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2 mr-auto block"
                                  value={qSelected}
                                  onChange={(e) =>
                                    setQuestionSelections((s) => ({ ...s, [stage.field]: e.target.value }))
                                  }
                                  disabled={updating}
                                >
                                  {qOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="space-y-2">
                                  {qOptions.map((opt) => (
                                    <label
                                      key={opt}
                                      className="flex items-center justify-end gap-2 cursor-pointer p-2 rounded-md hover:bg-gray-50 flex-row-reverse"
                                    >
                                      <span>{opt}</span>
                                      <input
                                        type="radio"
                                        name={`custom-q-${stage.field}-${index}`}
                                        checked={qSelected === opt}
                                        onChange={() =>
                                          setQuestionSelections((s) => ({ ...s, [stage.field]: opt }))
                                        }
                                        disabled={updating}
                                        className="text-teal-700"
                                      />
                                    </label>
                                  ))}
                                </div>
                              )}
                              <button
                                type="button"
                                className="bg-teal-800 text-white px-4 py-2 rounded-md text-md hover:bg-teal-900 disabled:opacity-50"
                                disabled={updating || !qSelected || !qOptions.includes(qSelected)}
                                onClick={() => handleCustomStagePatch(stage.field, true, { answer: qSelected })}
                              >
                                تأكيد الإجابة
                              </button>
                            </div>
                          ),
                        },
                  ]}
                  actions={
                    qCompleted
                      ? [
                          {
                            label: 'تراجع',
                            type: 'secondary' as const,
                            onClick: () => handleStatusUpdate(stage.field, false),
                            disabled: updating,
                          },
                        ]
                      : []
                  }
                />
              );
            }

            // مرحلة رفع ملف — كما عُرّفت في CustomTimeline.stages
            if (effectiveStageInteraction(stage) === 'file') {
              if (!canComplete) {
                return (
                  <InfoCard
                    key={index}
                    id={`stage-${index}`}
                    title={`${index + 1}- ${stage.label}`}
                    data={[
                      {
                        label: '',
                        value: (
                          <div className="text-center py-4">
                            <span className="text-gray-500 text-md">
                              🔒 يجب إكمال المرحلة السابقة أولاً
                            </span>
                          </div>
                        ),
                      },
                    ]}
                  />
                );
              }

              const fMeta = orderData.customTimelineStages?.[stage.field];
              const fCompleted = isStageCompleteForOrder(stage, fMeta);
              const fDateStr = formatCustomStageDateAr(fMeta);

              return (
                <InfoCard
                  key={index}
                  id={`stage-${index}`}
                  title={`${index + 1}- ${stage.label}`}
                  data={[
                    {
                      label: 'مستند المكتب',
                      value: fCompleted ? (
                        <div className="flex flex-col items-end gap-2">
                          {fMeta?.fileUrl ? (
                            <>
                              <a
                                href={fMeta.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-800 hover:underline text-md font-medium"
                              >
                                فتح ملف المكتب المرفوع
                              </a>
                              {fDateStr && (
                                <span className="text-xs text-gray-500">تاريخ الرفع: {fDateStr}</span>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center justify-end gap-2 text-amber-800">
                              <span className="text-sm">مكتملة دون رابط ملف — أعد الرفع أو تراجع</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-3">
                          <span className="text-gray-600 text-sm">ارفع ملف PDF ثم يُحفظ تلقائياً</span>
                          <input
                            type="file"
                            id={`custom-timeline-file-${index}`}
                            className="hidden"
                            accept="application/pdf"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUpdating(true);
                              try {
                                const res = await fetch(`/api/upload-presigned-url/${id}`);
                                if (!res.ok) throw new Error('فشل في الحصول على رابط الرفع');
                                const { url, filePath } = await res.json();

                                const uploadRes = await fetch(url, {
                                  method: 'PUT',
                                  body: file,
                                  headers: {
                                    'Content-Type': 'application/pdf',
                                    'x-amz-acl': 'public-read',
                                  },
                                });

                                if (!uploadRes.ok) throw new Error('فشل في رفع الملف');

                                await handleCustomStagePatch(stage.field, true, { fileUrl: filePath });
                              } catch (err: any) {
                                console.error('Custom timeline file upload:', err);
                                setShowErrorModal({
                                  isOpen: true,
                                  title: 'خطأ في رفع الملف',
                                  message: err.message || 'حدث خطأ أثناء رفع الملف',
                                });
                              } finally {
                                setUpdating(false);
                                e.target.value = '';
                              }
                            }}
                          />
                          <label
                            htmlFor={`custom-timeline-file-${index}`}
                            className={`bg-teal-800 text-white px-4 py-2 rounded-md text-md cursor-pointer hover:bg-teal-900 inline-block ${
                              updating ? 'opacity-50 pointer-events-none' : ''
                            }`}
                          >
                            اختيار ملف PDF
                          </label>
                        </div>
                      ),
                    },
                  ]}
                  actions={
                    fCompleted
                      ? [
                          {
                            label: 'تراجع',
                            type: 'secondary' as const,
                            onClick: () => handleStatusUpdate(stage.field, false),
                            disabled: updating,
                          },
                        ]
                      : []
                  }
                />
              );
            }

            // مراحل عادية (interactionType none أو حقول النظام القياسية)
            const blockingReason = getBlockingReason(index, sortedStages);
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
                    ) : !canComplete ? (
                      <div className="text-center">
                        <span className="text-red-600 text-sm block mb-2">
                          {blockingReason || 'يجب إكمال المرحلة السابقة أولاً'}
                        </span>
                        <button
                          className="bg-gray-400 text-white px-4 py-2 rounded-md text-md cursor-not-allowed"
                          disabled
                        >
                          تأكيد الإكمال
                        </button>
                      </div>
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

