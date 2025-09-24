import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import InfoCard from 'components/InfoCard';
import Head from 'next/head';
import OrderStepper from 'components/OrderStepper';
import { CheckCircleIcon } from '@heroicons/react/solid';
import { Calendar } from 'lucide-react';
import Layout from 'example/containers/Layout';
import Style from 'styles/Home.module.css';
import { jwtDecode } from 'jwt-decode';
import Select from 'react-select'; // Added for autocomplete
import prisma from 'pages/api/globalprisma';

interface OrderData {
  orderId: string;
  clientInfo: { name: string; phone: string; email: string };
  homemaidInfo: { id: string; name: string; passportNumber: string; nationality: string; externalOffice: string };
  applicationInfo: { applicationDate: string; applicationTime: string };
  officeLinkInfo: { nationalId: string; visaNumber: string; internalMusanedContract: string; musanedDate: string };
  externalOfficeInfo: { officeName: string; country: string; externalMusanedContract: string };
  externalOfficeApproval: { approved: boolean };
  medicalCheck: { passed: boolean };
  foreignLaborApproval: { approved: boolean };
  agencyPayment: { paid: boolean };
  saudiEmbassyApproval: { approved: boolean };
  visaIssuance: { issued: boolean };
  travelPermit: { issued: boolean };
  destinations: { departureCity: string; arrivalCity: string; departureDateTime: string; arrivalDateTime: string };
  ticketUpload: { files: string };
  receipt: { received: boolean };
  documentUpload: { files: string };
  bookingStatus: string;
  nationality?: string;
}

interface Homemaid {
  id: string;
  Name: string;
  Passportnumber: string;
  office: { Country: string; office: string };
}

export default function TrackOrder() {
  const router = useRouter();
  const { id } = router.query;
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChangeHomemaidModal, setShowChangeHomemaidModal] = useState(false);
  const [newHomemaidData, setNewHomemaidData] = useState({
    id: '',
    name: '',
    passportNumber: '',
    nationality: '',
    externalOffice: '',
  });
  const [homemaids, setHomemaids] = useState<Homemaid[]>([]); // State for homemaid options
  const [selectedHomemaid, setSelectedHomemaid] = useState<{ value: string; label: string } | null>(null);

  // --- Modal States ---
  const [showConfirmModal, setShowConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [showAlertModal, setShowAlertModal] = useState({
    isOpen: false,
    message: '',
  });

  useEffect(() => {
    if (id) {
      fetchOrderData();
    }
    fetchHomemaids(); // Fetch homemaids for autocomplete
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

  const fetchHomemaids = async () => {
    try {
      const res = await fetch('/api/autocomplete/homemaids');
      if (!res.ok) throw new Error('فشل في جلب بيانات العاملات');
      const data = await res.json();
      setHomemaids(data.data); // Store homemaids for autocomplete
    } catch (error: any) {
      console.error('Error fetching homemaids:', error);
      setError('حدث خطأ أثناء جلب بيانات العاملات');
    }
  };

  const handleStatusUpdate = async (field: string, value: boolean) => {
    setShowConfirmModal({
      isOpen: true,
      title: 'تحديث الحالة',
      message: `هل أنت متأكد من تحديث حالة ${field}؟`,
      onConfirm: async () => {
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
          setError(error);
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  const handleSaveEdits = async (section: string, updatedData: Record<string, string>) => {
    setShowConfirmModal({
      isOpen: true,
      title: 'حفظ التعديلات',
      message: 'هل أنت متأكد من حفظ التعديلات؟',
      onConfirm: async () => {
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
          setError('حدث خطأ أثناء حفظ التعديلات');
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  const handleCancelContract = async () => {
    setShowConfirmModal({
      isOpen: true,
      title: 'إلغاء العقد',
      message: 'هل أنت متأكد من إلغاء العقد؟ هذا الإجراء لا يمكن التراجع عنه.',
      onConfirm: async () => {
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
          router.push('/admin/neworders');
        } catch (error: any) {
          console.error('Error cancelling contract:', error);
          setError('حدث خطأ أثناء إلغاء العقد');
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  const handleChangeHomemaid = () => {
    setShowConfirmModal({
      isOpen: true,
      title: 'تغيير العاملة',
      message: 'هل أنت متأكد من تغيير العاملة؟',
      onConfirm: () => {
        if (orderData?.homemaidInfo) {
          setNewHomemaidData({
            id: orderData.homemaidInfo.id || '',
            name: orderData.homemaidInfo.name || '',
            passportNumber: orderData.homemaidInfo.passportNumber || '',
            nationality: orderData.homemaidInfo.nationality || '',
            externalOffice: orderData.homemaidInfo.externalOffice || '',
          });
          const currentHomemaid = homemaids.find((h) => h.Name === orderData.homemaidInfo.name);
          setSelectedHomemaid(currentHomemaid ? { value: currentHomemaid.id, label: currentHomemaid.Name } : null);
        }
        setShowChangeHomemaidModal(true);
      },
    });
  };

  const handleHomemaidSelect = (selectedOption: { value: string; label: string } | null) => {
    setSelectedHomemaid(selectedOption);
    if (selectedOption) {
      const selectedHomemaid = homemaids.find((h) => h.id === selectedOption.value);
      if (selectedHomemaid) {
        setNewHomemaidData({
          id: selectedHomemaid.id,
          name: selectedHomemaid.Name || '',
          passportNumber: selectedHomemaid.Passportnumber || '',
          nationality: selectedHomemaid.office.Country || '',
          externalOffice: selectedHomemaid.office?.office || '',
        });
      }
    } else {
      setNewHomemaidData({
        name: '',
        id: '',
        passportNumber: '',
        nationality: '',
        externalOffice: '',
      });
    }
  };

  const handleSaveHomemaidChange = async () => {
    if (!newHomemaidData.name.trim()) {
      setShowAlertModal({
        isOpen: true,
        message: 'يرجى إدخال اسم العاملة',
      });
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/track_order/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'homemaidInfo',
          updatedData: newHomemaidData,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'فشل في تغيير العاملة');
      }

      await fetchOrderData();
      setShowChangeHomemaidModal(false);
      setShowAlertModal({
        isOpen: true,
        message: 'تم تغيير العاملة بنجاح',
      });
    } catch (error: any) {
      console.error('Error changing homemaid:', error);
      setError('حدث خطأ أثناء تغيير العاملة');
    } finally {
      setUpdating(false);
    }
  };

  // Format homemaids for react-select
  const homemaidOptions = homemaids.map((homemaid) => ({
    value: homemaid.id,
    label: homemaid.Name,
  }));

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen font-tajawal" dir="rtl">
          جاري التحميل...
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

  // --- Confirm Modal Component ---
  const ConfirmModal = () => {
    if (!showConfirmModal.isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div
          className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/3 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-bold text-gray-900 mb-2 text-right">{showConfirmModal.title}</h3>
          <p className="text-gray-700 mb-6 text-right">{showConfirmModal.message}</p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              onClick={() => setShowConfirmModal({ ...showConfirmModal, isOpen: false })}
            >
              إلغاء
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-teal-800 text-white rounded-md hover:bg-teal-900"
              onClick={() => {
                showConfirmModal.onConfirm();
                setShowConfirmModal({ ...showConfirmModal, isOpen: false });
              }}
            >
              تأكيد
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Alert Modal Component ---
  const AlertModal = () => {
    if (!showAlertModal.isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div
          className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/3 p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <p className="text-gray-800 mb-6 text-right">{showAlertModal.message}</p>
          <button
            type="button"
            className="px-6 py-2 bg-teal-800 text-white rounded-md hover:bg-teal-900"
            onClick={() => setShowAlertModal({ ...showAlertModal, isOpen: false })}
          >
            موافق
          </button>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className={`min-h-screen ${Style['tajawal-regular']}`} dir="rtl">
        <Head>
          <title>تتبع الطلب</title>
        </Head>
        <main className="max-w-7xl mx-auto px-5 py-8">
          {error && <div className="text-red-600 text-md mb-4 text-right">{error}</div>}

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-normal text-gray-900">طلب #{orderData.orderId}</h1>
            <div className="flex gap-4">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-md text-md hover:bg-red-700 disabled:opacity-50"
                onClick={handleCancelContract}
                disabled={updating}
              >
                إلغاء العقد
              </button>
              <button
                className="border border-teal-800 text-teal-800 px-4 py-2 rounded-md text-md hover:bg-teal-800 hover:text-white disabled:opacity-50"
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
              { label: 'الجنسية', value: orderData.nationality || 'غير محدد' },
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
                    className="bg-teal-800 text-white px-4 py-2 rounded-md text-md hover:bg-teal-900 disabled:opacity-50"
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
                    className="bg-teal-800 text-white px-4 py-2 rounded-md text-md hover:bg-teal-900 disabled:opacity-50"
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
                    className="bg-teal-800 text-white px-4 py-2 rounded-md text-md hover:bg-teal-900 disabled:opacity-50"
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
                    className="bg-teal-800 text-white px-4 py-2 rounded-md text-md hover:bg-teal-900 disabled:opacity-50"
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
                    className="bg-teal-800 text-white px-4 py-2 rounded-md text-md hover:bg-teal-900 disabled:opacity-50"
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
                    className="bg-teal-800 text-white px-4 py-2 rounded-md text-md hover:bg-teal-900 disabled:opacity-50"
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
                    className="bg-teal-800 text-white px-4 py-2 rounded-md text-md hover:bg-teal-900 disabled:opacity-50"
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
                    <span className="text-gray-500 text-md pr-2">
                      {orderData.ticketUpload.files ? (
                        <a
                          href={orderData.ticketUpload.files}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-teal-800 hover:underline"
                        >
                          تصفح الملف
                        </a>
                      ) : (
                        'إرفاق ملف التذكرة'
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
                            
                            // Show success message
                            setShowAlertModal({
                              isOpen: true,
                              message: 'تم رفع الملف بنجاح',
                            });
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
                      className={`bg-teal-800 text-white px-3 py-1 rounded-md text-xs cursor-pointer hover:bg-teal-900 ${updating ? 'opacity-50' : ''}`}
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
                    className="bg-teal-800 text-white px-4 py-2 rounded-md text-md hover:bg-teal-900 disabled:opacity-50"
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
                    <span className="text-gray-500 text-md pr-2">
                      {orderData.documentUpload.files ? (
                        <a
                          href={orderData.documentUpload.files}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-800 hover:underline"
                        >
                          تصفح الملف
                        </a>
                      ) : (
                        'إرفاق ملفات أخرى'
                      )}
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
                            
                            await fetch(`/api/track_order/${id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                section: 'documentUpload',
                                updatedData: { files: filePath },
                              }),
                            });

                            await fetchOrderData();
                            
                            // Show success message
                            setShowAlertModal({
                              isOpen: true,
                              message: 'تم رفع الملف بنجاح',
                            });
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

        {/* Modals */}
        <ConfirmModal />
        <AlertModal />

        {/* Modal: Change Homemaid */}
        {showChangeHomemaidModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setShowChangeHomemaidModal(false)}
          >
            <div
              className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/3 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 text-right">تغيير العاملة</h2>
                <p className="text-gray-700 text-right mb-6">
                  يرجى اختيار العاملة الجديدة.
                </p>

                <div className="space-y-4 text-right">
                  <div>
                    <label className="block text-md font-medium text-gray-700 mb-1">اسم العاملة</label>
                    <Select
                      options={homemaidOptions}
                      value={selectedHomemaid}
                      onChange={handleHomemaidSelect}
                      placeholder="اختر العاملة"
                      isClearable
                      className="text-right"
                      styles={{
                        control: (base) => ({
                          ...base,
                          border: '1px solid #D1D5DB',
                          borderRadius: '0.375rem',
                          padding: '0.5rem',
                          textAlign: 'right',
                        }),
                        menu: (base) => ({
                          ...base,
                          textAlign: 'right',
                        }),
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-md font-medium text-gray-700 mb-1">رقم جواز السفر</label>
                    <input
                      type="text"
                      value={newHomemaidData.passportNumber}
                      onChange={(e) =>
                        setNewHomemaidData({ ...newHomemaidData, passportNumber: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-800"
                    />
                  </div>
                  <div>
                    <label className="block text-md font-medium text-gray-700 mb-1">الجنسية</label>
                    <input
                      type="text"
                      value={newHomemaidData.nationality}
                      onChange={(e) =>
                        setNewHomemaidData({ ...newHomemaidData, nationality: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-800"
                    />
                  </div>
                  <div>
                    <label className="block text-md font-medium text-gray-700 mb-1">المكتب الخارجي</label>
                    <input
                      type="text"
                      value={newHomemaidData.externalOffice}
                      onChange={(e) =>
                        setNewHomemaidData({ ...newHomemaidData, externalOffice: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 pt-0">
                <button
                  type="button"
                  className="px-4 py-2 border border-teal-800 text-teal-800 rounded-md hover:bg-teal-50 disabled:opacity-50"
                  onClick={() => setShowChangeHomemaidModal(false)}
                  disabled={updating}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-teal-800 text-white rounded-md hover:bg-teal-900 disabled:opacity-50"
                  onClick={handleSaveHomemaidChange}
                  disabled={updating}
                >
                  {updating ? 'جاري الحفظ...' : 'حفظ التغيير'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export async function getServerSideProps ({ req }: { req: any }) {
  try {
    // 🔹 Extract cookies
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie: string) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    // 🔹 Check for authToken
    if (!cookies.authToken) {
      return {
        redirect: { destination: "/admin/login", permanent: false },
      };
    }

    const token = jwtDecode(cookies.authToken) as any;

    // 🔹 Fetch user & role with Prisma
    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });
    if (
      !findUser ||
      !(findUser.role?.permissions as any)?.["إدارة الطلبات"]?.["إضافة"]
    ) {
      return {
        redirect: { destination: "/admin/home", permanent: false }, // or show 403
      };
    }

    return { props: {} };
  } catch (err) {
    console.error("Authorization error:", err);
    return {
      redirect: { destination: "/admin/home", permanent: false },
    };
  }
};