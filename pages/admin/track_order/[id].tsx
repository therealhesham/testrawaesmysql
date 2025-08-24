import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import InfoCard from 'components/InfoCard';
import Head from 'next/head';
import OrderStepper from 'components/OrderStepper';
import { CheckCircleIcon } from '@heroicons/react/outline';
import { Calendar } from 'lucide-react';
import Layout from 'example/containers/Layout';
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';

export default function TrackOrder() {
  const router = useRouter();
  const { id } = router.query;
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/track_order/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error('فشل في جلب بيانات الطلب');
          return res.json();
        })
        .then((data) => {
          setOrderData(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching order:', error);
          setError(error.message);
          setLoading(false);
          toast.error(error.message);
        });
    }
  }, [id]);

  const handleStatusUpdate = async (field: string, value: boolean) => {
    if (!confirm(`هل أنت متأكد من تحديث حالة ${field}؟`)) return;

    try {
      const res = await fetch(`/api/track_order/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value }),
      });

      if (!res.ok) throw new Error('فشل في تحديث الحالة');
      const updatedData = await res.json();
      toast.success(updatedData.message);
      // Refresh order data after update
      const refreshedData = await fetch(`/api/track_order/${id}`).then((res) => res.json());
      setOrderData(refreshedData);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const handleCancelContract = async () => {
    if (!confirm('هل أنت متأكد من إلغاء العقد؟ هذا الإجراء لا يمكن التراجع عنه.')) return;

    try {
      const res = await fetch(`/api/track_order/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'bookingStatus', value: 'cancelled' }),
      });

      if (!res.ok) throw new Error('فشل في إلغاء العقد');
      toast.success('تم إلغاء العقد بنجاح');
      router.push('/orders'); // Redirect to orders list
    } catch (error) {
      console.error('Error cancelling contract:', error);
      toast.error('حدث خطأ أثناء إلغاء العقد');
    }
  };

  const handleChangeHomemaid = async () => {
    if (!confirm('هل أنت متأكد من تغيير العاملة؟')) return;
    router.push(`/orders/${id}/change-homemaid`); // Redirect to change homemaid page
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
      <div className="min-h-screen font-tajawal" dir="rtl">
        <Head>
          <title>تتبع الطلب</title>
          <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet" />
        </Head>
        <main className="max-w-7xl mx-auto px-5 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-normal text-gray-900">طلب #{orderData.orderId}</h1>
            <div className="flex gap-4">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
                onClick={handleCancelContract}
              >
                إلغاء العقد
              </button>
              <button
                className="border border-teal-800 text-teal-800 px-4 py-2 rounded-md text-sm hover:bg-teal-800 hover:text-white"
                onClick={handleChangeHomemaid}
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
          />
          <InfoCard
            title="2- المكتب الخارجي"
            data={[
              { label: 'اسم المكتب الخارجي', value: orderData.externalOfficeInfo.officeName },
              { label: 'دولة المكتب الخارجي', value: orderData.externalOfficeInfo.country },
              { label: 'رقم عقد مساند التوثيق', value: orderData.externalOfficeInfo.externalMusanedContract },
            ]}
            gridCols={3}
            actions={[
              { label: 'حفظ', type: 'primary', onClick: () => alert('حفظ البيانات') },
              { label: 'تعديل', type: 'secondary', onClick: () => alert('تعديل البيانات') },
            ]}
          />
          <InfoCard
            title="3- موافقة المكتب الخارجي"
            data={[
              {
                label: 'هل تمت موافقة المكتب الخارجي؟',
                value: (
                  <div className="flex justify-center items-center gap-5">
                    {orderData.externalOfficeApproval.approved ? (
                      <CheckCircleIcon className="w-8 h-8 text-teal-800" aria-label="تم الموافقة" />
                    ) : (
                      <button
                        className="bg-teal-800 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-900"
                        onClick={() => handleStatusUpdate('externalOfficeApproval', true)}
                      >
                        تأكيد الموافقة
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
          />
          <InfoCard
            title="4- الفحص الطبي"
            data={[
              {
                label: 'هل تجاوزت العاملة الفحص الطبي؟',
                value: orderData.medicalCheck.passed ? (
                  <CheckCircleIcon className="w-8 h-8 text-teal-800" aria-label="تم الاجتياز" />
                ) : (
                  <button
                    className="bg-teal-800 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-900"
                    onClick={() => handleStatusUpdate('medicalCheck', true)}
                  >
                    تأكيد الاجتياز
                  </button>
                ),
              },
            ]}
            actions={[{ label: 'تراجع', type: 'primary', onClick: () => handleStatusUpdate('medicalCheck', false) }]}
          />
          <InfoCard
            title="5- موافقة وزارة العمل الأجنبية"
            data={[
              {
                label: 'هل تمت موافقة وزارة العمل الأجنبية؟',
                value: (
                  <div className="flex gap-5">
                    <button
                      className={`px-4 py-2 rounded-md text-sm ${
                        orderData.foreignLaborApproval.approved
                          ? 'bg-teal-800 text-white'
                          : 'border border-teal-800 text-teal-800 hover:bg-teal-800 hover:text-white'
                      }`}
                      onClick={() => handleStatusUpdate('foreignLaborApproval', true)}
                    >
                      نعم
                    </button>
                    <button
                      className={`px-4 py-2 rounded-md text-sm ${
                        !orderData.foreignLaborApproval.approved
                          ? 'bg-teal-800 text-white'
                          : 'border border-teal-800 text-teal-800 hover:bg-teal-800 hover:text-white'
                      }`}
                      onClick={() => handleStatusUpdate('foreignLaborApproval', false)}
                    >
                      لا
                    </button>
                  </div>
                ),
              },
            ]}
          />
          <InfoCard
            title="6- دفع الوكالة"
            data={[
              {
                label: 'هل تم دفع الوكالة؟',
                value: (
                  <div className="flex gap-5">
                    <button
                      className={`px-4 py-2 rounded-md text-sm ${
                        orderData.agencyPayment.paid
                          ? 'bg-teal-800 text-white'
                          : 'border border-teal-800 text-teal-800 hover:bg-teal-800 hover:text-white'
                      }`}
                      onClick={() => handleStatusUpdate('agencyPayment', true)}
                    >
                      نعم
                    </button>
                    <button
                      className={`px-4 py-2 rounded-md text-sm ${
                        !orderData.agencyPayment.paid
                          ? 'bg-teal-800 text-white'
                          : 'border border-teal-800 text-teal-800 hover:bg-teal-800 hover:text-white'
                      }`}
                      onClick={() => handleStatusUpdate('agencyPayment', false)}
                    >
                      لا
                    </button>
                  </div>
                ),
              },
            ]}
          />
          <InfoCard
            title="7- موافقة السفارة السعودية"
            data={[
              {
                label: 'هل تمت موافقة السفارة السعودية؟',
                value: (
                  <div className="flex gap-5">
                    <button
                      className={`px-4 py-2 rounded-md text-sm ${
                        orderData.saudiEmbassyApproval.approved
                          ? 'bg-teal-800 text-white'
                          : 'border border-teal-800 text-teal-800 hover:bg-teal-800 hover:text-white'
                      }`}
                      onClick={() => handleStatusUpdate('saudiEmbassyApproval', true)}
                    >
                      نعم
                    </button>
                    <button
                      className={`px-4 py-2 rounded-md text-sm ${
                        !orderData.saudiEmbassyApproval.approved
                          ? 'bg-teal-800 text-white'
                          : 'border border-teal-800 text-teal-800 hover:bg-teal-800 hover:text-white'
                      }`}
                      onClick={() => handleStatusUpdate('saudiEmbassyApproval', false)}
                    >
                      لا
                    </button>
                  </div>
                ),
              },
            ]}
          />
          <InfoCard
            title="8- إصدار التأشيرة"
            data={[
              {
                label: 'هل تم إصدار التأشيرة؟',
                value: (
                  <div className="flex gap-5">
                    <button
                      className={`px-4 py-2 rounded-md text-sm ${
                        orderData.visaIssuance.issued
                          ? 'bg-teal-800 text-white'
                          : 'border border-teal-800 text-teal-800 hover:bg-teal-800 hover:text-white'
                      }`}
                      onClick={() => handleStatusUpdate('visaIssuance', true)}
                    >
                      نعم
                    </button>
                    <button
                      className={`px-4 py-2 rounded-md text-sm ${
                        !orderData.visaIssuance.issued
                          ? 'bg-teal-800 text-white'
                          : 'border border-teal-800 text-teal-800 hover:bg-teal-800 hover:text-white'
                      }`}
                      onClick={() => handleStatusUpdate('visaIssuance', false)}
                    >
                      لا
                    </button>
                  </div>
                ),
              },
            ]}
          />
          <InfoCard
            title="9- تصريح السفر"
            data={[
              {
                label: 'هل تم إصدار تصريح السفر؟',
                value: (
                  <div className="flex gap-5">
                    <button
                      className={`px-4 py-2 rounded-md text-sm ${
                        orderData.travelPermit.issued
                          ? 'bg-teal-800 text-white'
                          : 'border border-teal-800 text-teal-800 hover:bg-teal-800 hover:text-white'
                      }`}
                      onClick={() => handleStatusUpdate('travelPermit', true)}
                    >
                      نعم
                    </button>
                    <button
                      className={`px-4 py-2 rounded-md text-sm ${
                        !orderData.travelPermit.issued
                          ? 'bg-teal-800 text-white'
                          : 'border border-teal-800 text-teal-800 hover:bg-teal-800 hover:text-white'
                      }`}
                      onClick={() => handleStatusUpdate('travelPermit', false)}
                    >
                      لا
                    </button>
                  </div>
                ),
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
            ]}
            gridCols={2}
            actions={[
              { label: 'حفظ', type: 'primary', onClick: () => alert('حفظ الوجهات') },
              { label: 'تعديل', type: 'secondary', onClick: () => alert('تعديل الوجهات') },
            ]}
          />
          <InfoCard
            title="11- الاستلام"
            data={[
              {
                label: 'هل تم الاستلام؟',
                value: (
                  <div className="flex gap-5">
                    <button
                      className={`px-4 py-2 rounded-md text-sm ${
                        orderData.receipt.received
                          ? 'bg-teal-800 text-white'
                          : 'border border-teal-800 text-teal-800 hover:bg-teal-800 hover:text-white'
                      }`}
                      onClick={() => handleStatusUpdate('receipt', true)}
                    >
                      نعم
                    </button>
                    <button
                      className={`px-4 py-2 rounded-md text-sm ${
                        !orderData.receipt.received
                          ? 'bg-teal-800 text-white'
                          : 'border border-teal-800 text-teal-800 hover:bg-teal-800 hover:text-white'
                      }`}
                      onClick={() => handleStatusUpdate('receipt', false)}
                    >
                      لا
                    </button>
                  </div>
                ),
              },
            ]}
          />
          <InfoCard
            title="12- رفع المستندات"
            data={[
              {
                label: 'ملفات أخرى',
                value: (
                  <div className="file-upload-display border border-gray-300 rounded-md p-1 flex justify-between items-center">
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
                          const formData = new FormData();
                          formData.append('file', file);
                          try {
                            const res = await fetch(`/api/upload/${id}`, {
                              method: 'POST',
                              body: formData,
                            });
                            if (!res.ok) throw new Error('فشل في رفع الملف');
                            toast.success('تم رفع الملف بنجاح');
                          } catch (error) {
                            console.error('Error uploading file:', error);
                            toast.error('حدث خطأ أثناء رفع الملف');
                          }
                        }
                      }}
                    />
                    <label
                      htmlFor="file-upload"
                      className="bg-teal-800 text-white px-3 py-1 rounded-md text-xs cursor-pointer hover:bg-teal-900"
                    >
                      اختيار ملف
                    </label>
                  </div>
                ),
              },
            ]}
            actions={[
              { label: 'تأكيد', type: 'primary', onClick: () => alert('تأكيد رفع المستندات') },
              { label: 'إلغاء التعديل', type: 'secondary', onClick: () => alert('إلغاء تعديل المستندات') },
            ]}
          />
        </main>
      </div>
    </Layout>
  );
}