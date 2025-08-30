// pages/orders/[id].tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import InfoCard from 'components/InfoCard';
import Head from 'next/head';
import OrderStepper from 'components/OrderStepper';
import { CheckCircleIcon } from '@heroicons/react/solid';
import { Calendar } from 'lucide-react';
import Layout from 'example/containers/Layout';
import Style from 'styles/Home.module.css';

export default function TrackOrder() {
  const router = useRouter();
  const { id } = router.query;
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  const handleStatusUpdate = async (field: string, value: boolean) => {
    if (!confirm(`هل أنت متأكد من تحديث حالة ${field}؟`)) return;

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
      console.log('تم تحديث الحالة بنجاح');
    } catch (error: any) {
      console.error('Error updating status:', error);
      setError('حدث خطأ أثناء تحديث الحالة');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveEdits = async (section: string, updatedData: Record<string, string>) => {
    if (!confirm('هل أنت متأكد من حفظ التعديلات؟')) return;

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
      console.log('تم حفظ التعديلات بنجاح');
    } catch (error: any) {
      console.error('Error saving edits:', error);
      setError('حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelContract = async () => {
    if (!confirm('هل أنت متأكد من إلغاء العقد؟ هذا الإجراء لا يمكن التراجع عنه.')) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/track_order/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'bookingStatus', value: 'cancelled' }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'فشل في إلغاء العقد');
      }
      console.log('تم إلغاء العقد بنجاح');
      router.push('/admin/neworders');
    } catch (error: any) {
      console.error('Error cancelling contract:', error);
      setError('حدث خطأ أثناء إلغاء العقد');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangeHomemaid = async () => {
    if (!confirm('هل أنت متأكد من تغيير العاملة؟')) return;
    router.push(`/orders/${id}/change-homemaid`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100 font-tajawal" dir="rtl">
          جاري التحميل...
        </div>
      </Layout>
    );
  }

  if (error || !orderData) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100 font-tajawal" dir="rtl">
          {error || 'الطلب غير موجود'}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen ${Style['tajawal-regular']}`} dir="rtl">
        <Head>
          <title>تتبع الطلب</title>
        </Head>
        <main className="max-w-7xl mx-auto px-5 py-8">
          {error && <div className="text-red-600 text-sm mb-4 text-right">{error}</div>}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-normal text-gray-900">طلب #{orderData.orderId}</h1>
            <div className="flex gap-4">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
                onClick={handleCancelContract}
                disabled={updating}
              >
                إلغاء العقد
              </button>
              <button
                className="border border-teal-800 text-teal-800 px-4 py-2 rounded-md text-sm hover:bg-teal-800 hover:text-white disabled:opacity-50"
                onClick={handleChangeHomemaid}
                disabled={updating}
              >
                تغيير العاملة
              </button>
            </div>
          </div>
          <OrderStepper status={orderData.bookingStatus} />
          <InfoCard
            title="معلومات العميل"
            data={[
              { label: 'اسم العميل', value: orderData.clientInfo.name },
              { label: 'رقم العميل', value: orderData.clientInfo.phone },
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
              { label: 'الجنسية', value: orderData.homemaidInfo.nationality },
              { label: 'المكتب الخارجي', value: orderData.homemaidInfo.externalOffice },
            ]}
            gridCols={3}
          />
          <InfoCard
            title="التقديم"
            data={[
              { label: 'تاريخ استلام الطلب', value: orderData.applicationInfo.applicationDate },
              { label: 'وقت استلام الطلب', value: orderData.applicationInfo.applicationTime },
            ]}
            gridCols={2}
          />
          <InfoCard
            title="1- الربط مع إدارة المكاتب"
            data={[
              { label: 'هوية العميل', value: orderData.officeLinkInfo.nationalId },
              { label: 'رقم التأشيرة', value: orderData.officeLinkInfo.visaNumber },
              { label: 'رقم عقد إدارة المكاتب', value: orderData.officeLinkInfo.internalMusanedContract },
              { label: 'تاريخ مساند', value: orderData.officeLinkInfo.musanedDate },
            ]}
            gridCols={3}
            editable={true}
            onSave={(updatedData) => handleSaveEdits('officeLinkInfo', updatedData)}
          />
          <InfoCard
            title="2- المكتب الخارجي"
            data={[
              { label: 'اسم المكتب الخارجي', value: orderData.externalOfficeInfo.officeName },
              { label: 'دولة المكتب الخارجي', value: orderData.externalOfficeInfo.country },
              { label: 'رقم عقد مساند التوثيق', value: orderData.externalOfficeInfo.externalMusanedContract },
            ]}
            gridCols={3}
            editable={true}
            onSave={(updatedData) => handleSaveEdits('externalOfficeInfo', updatedData)}
          />
          <InfoCard
            title="3- موافقة المكتب الخارجي"
            data={[
              {
                label: 'هل تمت موافقة المكتب الخارجي؟',
                value: orderData.externalOfficeApproval.approved ? (
                  <CheckCircleIcon className="w-8 h-8 mx-auto text-teal-800" aria-label="تم الموافقة" />
                ) : (
                  <button
                    className="bg-teal-800 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-900 disabled:opacity-50"
                    onClick={() => handleStatusUpdate('externalOfficeApproval', true)}
                    disabled={updating}
                  >
                    تأكيد الموافقة
                  </button>
                ),
              },
            ]}
            actions={[
              {
                label: 'تراجع',
                type: 'secondary',
                onClick: () => handleStatusUpdate('externalOfficeApproval', false),
                disabled: updating || !orderData.externalOfficeApproval.approved,
              },
            ]}
          />
          <InfoCard
            title="4- الفحص الطبي"
            data={[
              {
                label: 'هل تجاوزت العاملة الفحص الطبي؟',
                value: orderData.medicalCheck.passed ? (
                  <CheckCircleIcon className="w-8 h-8 mx-auto text-teal-800" aria-label="تم الاجتياز" />
                ) : (
                  <button
                    className="bg-teal-800 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-900 disabled:opacity-50"
                    onClick={() => handleStatusUpdate('medicalCheck', true)}
                    disabled={updating}
                  >
                    تأكيد الاجتياز
                  </button>
                ),
              },
            ]}
            actions={[
              {
                label: 'تراجع',
                type: 'secondary',
                onClick: () => handleStatusUpdate('medicalCheck', false),
                disabled: updating || !orderData.medicalCheck.passed,
              },
            ]}
          />
          <InfoCard
            title="5- موافقة وزارة العمل الأجنبية"
            data={[
              {
                label: 'هل تمت موافقة وزارة العمل الأجنبية؟',
                value: orderData.foreignLaborApproval.approved ? (
                  <CheckCircleIcon className="w-8 h-8 text-teal-800 mx-auto" aria-label="تم الموافقة" />
                ) : (
                  <button
                    className="bg-teal-800 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-900 disabled:opacity-50"
                    onClick={() => handleStatusUpdate('foreignLaborApproval', true)}
                    disabled={updating}
                  >
                    تأكيد الموافقة
                  </button>
                ),
              },
            ]}
            actions={[
              {
                label: 'تراجع',
                type: 'secondary',
                onClick: () => handleStatusUpdate('foreignLaborApproval', false),
                disabled: updating || !orderData.foreignLaborApproval.approved,
              },
            ]}
          />
          <InfoCard
            title="6- دفع الوكالة"
            data={[
              {
                label: 'هل تم دفع الوكالة؟',
                value: orderData.agencyPayment.paid ? (
                  <CheckCircleIcon className="w-8 h-8 text-teal-800 mx-auto" aria-label="تم الدفع" />
                ) : (
                  <button
                    className="bg-teal-800 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-900 disabled:opacity-50"
                    onClick={() => handleStatusUpdate('agencyPayment', true)}
                    disabled={updating}
                  >
                    تأكيد الدفع
                  </button>
                ),
              },
            ]}
            actions={[
              {
                label: 'تراجع',
                type: 'secondary',
                onClick: () => handleStatusUpdate('agencyPayment', false),
                disabled: updating || !orderData.agencyPayment.paid,
              },
            ]}
          />
          <InfoCard
            title="7- موافقة السفارة السعودية"
            data={[
              {
                label: 'هل تمت موافقة السفارة السعودية؟',
                value: orderData.saudiEmbassyApproval.approved ? (
                  <CheckCircleIcon className="w-8 h-8 mx-auto text-teal-800" aria-label="تم الموافقة" />
                ) : (
                  <button
                    className="bg-teal-800 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-900 disabled:opacity-50"
                    onClick={() => handleStatusUpdate('saudiEmbassyApproval', true)}
                    disabled={updating}
                  >
                    تأكيد الموافقة
                  </button>
                ),
              },
            ]}
            actions={[
              {
                label: 'تراجع',
                type: 'secondary',
                onClick: () => handleStatusUpdate('saudiEmbassyApproval', false),
                disabled: updating || !orderData.saudiEmbassyApproval.approved,
              },
            ]}
          />
          <InfoCard
            title="8- إصدار التأشيرة"
            data={[
              {
                label: 'هل تم إصدار التأشيرة؟',
                value: orderData.visaIssuance.issued ? (
                  <CheckCircleIcon className="w-8 h-8 text-teal-800 mx-auto" aria-label="تم الإصدار" />
                ) : (
                  <button
                    className="bg-teal-800 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-900 disabled:opacity-50"
                    onClick={() => handleStatusUpdate('visaIssuance', true)}
                    disabled={updating}
                  >
                    تأكيد الإصدار
                  </button>
                ),
              },
            ]}
            actions={[
              {
                label: 'تراجع',
                type: 'secondary',
                onClick: () => handleStatusUpdate('visaIssuance', false),
                disabled: updating || !orderData.visaIssuance.issued,
              },
            ]}
          />
          <InfoCard
            title="9- تصريح السفر"
            data={[
              {
                label: 'هل تم إصدار تصريح السفر؟',
                value: orderData.travelPermit.issued ? (
                  <CheckCircleIcon className="w-8 h-8 text-teal-800 mx-auto" aria-label="تم الإصدار" />
                ) : (
                  <button
                    className="bg-teal-800 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-900 disabled:opacity-50"
                    onClick={() => handleStatusUpdate('travelPermit', true)}
                    disabled={updating}
                  >
                    تأكيد الإصدار
                  </button>
                ),
              },
            ]}
            actions={[
              {
                label: 'تراجع',
                type: 'secondary',
                onClick: () => handleStatusUpdate('travelPermit', false),
                disabled: updating || !orderData.travelPermit.issued,
              },
            ]}
          />
          <InfoCard
            title="10- الوجهات"
            data={[
              { label: 'مدينة المغادرة', value: orderData.destinations.departureCity },
              { label: 'مدينة الوصول', value: orderData.destinations.arrivalCity },
              { 
                label: 'تاريخ ووقت المغادرة',
                value: (
                  <div className="flex items-center justify-end gap-2">
                    <span>{orderData.destinations.departureDateTime}</span>
                    <Calendar className="w-5 h-5 text-teal-800" aria-label="calendar icon" />
                  </div>
                ),
              },
              {
                label: 'تاريخ ووقت الوصول',
                value: (
                  <div className="flex items-center justify-end gap-2">
                    <span>{orderData.destinations.arrivalDateTime}</span>
                    <Calendar className="w-5 h-5 text-teal-800" aria-label="calendar icon" />
                  </div>
                ),
              },
              {
                label: 'ملف التذكرة',
                value: (
                  <div className="file-upload-display border border-none rounded-md p-1 flex justify-between items-center">
                    <span className="text-gray-500 text-sm pr-2">
                      {orderData.ticketUpload.files ? '' : 'إرفاق ملف التذكرة'} 
                      {orderData.ticketUpload.files && (
                        <a
                          href={orderData.ticketUpload.files}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-800 hover:underline"
                        >
                          فتح الملف
                        </a>
                      )}
                    </span>
              <input
  type="file"
  id="file-upload-destinations"
  className="hidden"
  accept="application/pdf"
  onChange={async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUpdating(true);
      try {
        // جلب presigned URL
        const res = await fetch(`/api/upload-presigned-url/${id}`);
        if (!res.ok) throw new Error('فشل في الحصول على رابط الرفع');
        const { url, filePath } = await res.json();

        // رفع الملف مباشرة إلى DigitalOcean Spaces
        const uploadRes = await fetch(url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': 'application/pdf',
              'x-amz-acl': 'public-read',
          },
        });

        if (!uploadRes.ok) throw new Error('فشل في رفع الملف');

        // تحديث الطلب في قاعدة البيانات (حفظ المسار)
        await fetch(`/api/track_order/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: 'destinations',
            updatedData: { ticketFile: filePath },
          }),
        });

        console.log('تم رفع الملف وحفظه بنجاح');
        await fetchOrderData();
      } catch (error: any) {
        console.error('Error uploading file:', error);
        setError('حدث خطأ أثناء رفع الملف');
      } finally {
        setUpdating(false);
      }
    }
  }}
/>

                    <label
                      htmlFor="file-upload-destinations"
                      className="bg-teal-800 text-white px-3 py-1 rounded-md text-xs cursor-pointer hover:bg-teal-900 disabled:opacity-50"
                      disabled={updating}
                    >
                      اختيار ملف
                    </label>
                  </div>
                ),
              },
            ]}
            gridCols={2}
            editable={true}
            onSave={(updatedData) => handleSaveEdits('destinations', updatedData)}
          />
          <InfoCard
            title="11- الاستلام"
            data={[
              {
                label: 'هل تم الاستلام؟',
                value: orderData.receipt.received ? (
                  <CheckCircleIcon className="w-8 h-8 text-teal-800 mx-auto" aria-label="تم الاستلام" />
                ) : (
                  <button
                    className="bg-teal-800 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-900 disabled:opacity-50"
                    onClick={() => handleStatusUpdate('receipt', true)}
                    disabled={updating}
                  >
                    تأكيد الاستلام
                  </button>
                ),
              },
            ]}
            actions={[
              {
                label: 'تراجع',
                type: 'secondary',
                onClick: () => handleStatusUpdate('receipt', false),
                disabled: updating || !orderData.receipt.received,
              },
            ]}
          />
          <InfoCard
            title="12- رفع المستندات"
            data={[
              {
                label: 'ملفات أخرى',
                value: (
                  <div className="file-upload-display border border-none rounded-md p-1 flex justify-between items-center">
                    <span className="text-gray-500 text-sm pr-2">
                      {orderData.documentUpload.files ? 'ملفات مرفقة' : 'إرفاق ملف التذكرة'}
                    </span>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
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
                              },
                            });

                            if (!uploadRes.ok) throw new Error('فشل في رفع الملف');
                            console.log('تم رفع الملف بنجاح');
                            await fetchOrderData();
                          } catch (error: any) {
                            console.error('Error uploading file:', error);
                            setError('حدث خطأ أثناء رفع الملف');
                          } finally {
                            setUpdating(false);
                          }
                        }
                      }}
                    />
                    <label
                      htmlFor="file-upload"
                      className="bg-teal-800 text-white px-3 py-1 rounded-md text-xs cursor-pointer hover:bg-teal-900 disabled:opacity-50"
                    >
                      اختيار ملف
                    </label>
                  </div>
                ),
              },
            ]}
            actions={[
              { label: 'تأكيد', type: 'primary', onClick: () => console.log('تأكيد رفع المستندات') },
              { label: 'إلغاء التعديل', type: 'secondary', onClick: () => console.log('إلغاء تعديل المستندات') },
            ]}
          />
        </main>
      </div>
    </Layout>
  );
}