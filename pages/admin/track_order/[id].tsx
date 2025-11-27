
/*
الحالات المختلفة التي يتم التعامل معها
medicalCheck
travelPermit
foreignLaborApproval
saudiEmbassyApproval
*/

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import InfoCard from 'components/InfoCard';
import Head from 'next/head';
import OrderStepper from 'components/OrderStepper';
import ErrorModal from 'components/ErrorModal';
import { CheckCircleIcon } from '@heroicons/react/solid';
import { Calendar } from 'lucide-react';
import Layout from 'example/containers/Layout';
import Style from 'styles/Home.module.css';
import { jwtDecode } from 'jwt-decode';
import Select from 'react-select'; // Added for autocomplete
import prisma from 'pages/api/globalprisma';

interface OrderData {
  orderId: string;
  clientInfo: { id?: string; name: string; phone: string; email: string };
  homemaidInfo: { id: string; name: string; passportNumber: string; nationality: string; externalOffice: string };
  applicationInfo: { applicationDate: string; applicationTime: string };
  officeLinkInfo: { nationalId: string; visaNumber: string; internalMusanedContract: string; musanedDate: string };
  externalOfficeInfo: { officeName: string; country: string; externalMusanedContract: string };
  externalOfficeApproval: { approved: boolean };
  medicalCheck: { passed: boolean };
  medicalFile?: string | null;
  foreignLaborApproval: { approved: boolean };
  agencyPayment: { paid: boolean };
  saudiEmbassyApproval: { approved: boolean };
  visaIssuance: { issued: boolean };
  travelPermit: { issued: boolean };
  destinations: { departureCity: string; arrivalCity: string; departureDateTime: string; arrivalDateTime: string };
  ticketUpload: { files: string };
  receipt: { received: boolean; method?: string };
  documentUpload: { files: string | string[] | null };
  bookingStatus: string;
  nationality?: string;
  deliveryDetails?: {
    deliveryDate?: string;
    deliveryTime?: string;
    deliveryFile?: string | null;
    deliveryNotes?: string;
    cost?: string | number;
  };
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
  const [documentUploadFields, setDocumentUploadFields] = useState<number[]>([0]); // Track upload field indices
  const [deliveryDetails, setDeliveryDetails] = useState({
    deliveryDate: '',
    deliveryTime: '',
    deliveryFile: null as string | null,
    deliveryNotes: '',
    cost: '',
  });
  const [deliveryDetailsErrors, setDeliveryDetailsErrors] = useState<Record<string, string>>({});

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

  const [showErrorModal, setShowErrorModal] = useState({
    isOpen: false,
    title: 'حدث خطأ',
    message: '',
  });

  const [currentStep, setCurrentStep] = useState(0);

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
      // Update deliveryDetails state if available
      if (data.deliveryDetails) {
        setDeliveryDetails({
          deliveryDate: data.deliveryDetails.deliveryDate || '',
          deliveryTime: data.deliveryDetails.deliveryTime || '',
          deliveryFile: data.deliveryDetails.deliveryFile || null,
          deliveryNotes: data.deliveryDetails.deliveryNotes || '',
          cost: data.deliveryDetails.cost?.toString() || '',
        });
        // مسح الأخطاء عند تحديث البيانات
        setDeliveryDetailsErrors({});
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

  const fetchHomemaids = async () => {
    try {
      const res = await fetch('/api/autocomplete/homemaids');
      if (!res.ok) throw new Error('فشل في جلب بيانات العاملات');
      const data = await res.json();
      setHomemaids(data.data); // Store homemaids for autocomplete
    } catch (error: any) {
      console.error('Error fetching homemaids:', error);
      setShowErrorModal({
        isOpen: true,
        title: 'خطأ في جلب بيانات العاملات',
        message: 'حدث خطأ أثناء جلب بيانات العاملات',
      });
    }
  };

  // خريطة لتحويل أسماء الحقول الإنجليزية إلى أسماء عربية
  const fieldNames: { [key: string]: string } = {
    'officeLinkInfo': 'الربط مع إدارة المكاتب',
    'externalOfficeInfo': 'المكتب الخارجي',
    'externalOfficeApproval': 'موافقة المكتب الخارجي',
    'medicalCheck': 'الفحص الطبي',
    'foreignLaborApproval': 'موافقة وزارة العمل الأجنبية',
    'agencyPayment': 'دفع الوكالة',
    'saudiEmbassyApproval': 'موافقة السفارة السعودية',
    'visaIssuance': 'إصدار التأشيرة',
    'travelPermit': 'تصريح السفر',
    'destinations': 'الوجهات',
    'receipt': 'الاستلام',
    'ticketUpload': 'رفع المستندات'
  };

  const handleStatusUpdate = async (field: string, value: boolean) => {
    const fieldName = fieldNames[field] || field;
    setShowConfirmModal({
      isOpen: true,
      title: 'تحديث الحالة',
      message: `هل أنت متأكد من تحديث حالة ${fieldName}؟`,
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
          setShowAlertModal({
            isOpen: true,
            message: 'تم تحديث الحالة بنجاح',
          });
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
          setShowAlertModal({
            isOpen: true,
            message: 'تم حفظ التعديلات بنجاح',
          });
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
          setShowErrorModal({
            isOpen: true,
            title: 'خطأ في إلغاء العقد',
            message: error.message || 'حدث خطأ أثناء إلغاء العقد',
          });
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
      setShowChangeHomemaidModal(false);
      setShowErrorModal({
        isOpen: true,
        title: 'خطأ في تغيير العاملة',
        message: error.message || 'حدث خطأ أثناء تغيير العاملة',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveDeliveryDetails = async () => {
    // التحقق من أن تاريخ الاستلام مطلوب
    const errors: Record<string, string> = {};
    if (!deliveryDetails.deliveryDate || deliveryDetails.deliveryDate.trim() === '') {
      errors.deliveryDate = 'تاريخ الاستلام مطلوب';
    }

    if (Object.keys(errors).length > 0) {
      setDeliveryDetailsErrors(errors);
      return;
    }

    // مسح الأخطاء إذا كانت البيانات صحيحة
    setDeliveryDetailsErrors({});
    setUpdating(true);
    try {
      const res = await fetch(`/api/track_order/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'deliveryDetails',
          updatedData: deliveryDetails,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'فشل في حفظ بيانات الاستلام');
      }

      await fetchOrderData();
      setShowAlertModal({
        isOpen: true,
        message: 'تم حفظ بيانات الاستلام بنجاح',
      });
    } catch (error: any) {
      console.error('Error saving delivery details:', error);
      setShowErrorModal({
        isOpen: true,
        title: 'خطأ في حفظ بيانات الاستلام',
        message: error.message || 'حدث خطأ أثناء حفظ بيانات الاستلام',
      });
    } finally {
      setUpdating(false);
    }
  };

  // Format homemaids for react-select
  const homemaidOptions = homemaids.map((homemaid) => ({
    value: homemaid.id,
    label: homemaid.Name,
  }));

  // Handle step click to scroll to corresponding section
  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    
    // Map step indices to section IDs - يجب أن يتطابق مع ترتيب steps في OrderStepper
    const stepToSectionMap: { [key: number]: string } = {
      0: 'office-link-info',          // الربط مع إدارة المكاتب
      1: 'external-office-info',       // المكتب الخارجي
      2: 'external-office-approval',   // موافقة المكتب الخارجي
      3: 'medical-check',              // الفحص الطبي
      4: 'foreign-labor-approval',     // موافقة وزارة العمل الأجنبية
      5: 'agency-payment',             // دفع الوكالة
      6: 'saudi-embassy-approval',      // موافقة السفارة
      7: 'visa-issuance',               // إصدار التأشيرة
      8: 'travel-permit',               // تصريح السفر
      9: 'destinations',                // الوجهات
      10: 'receipt'                     // الاستلام
    };

    const sectionId = stepToSectionMap[stepIndex];
    if (sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
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

  // --- Loading Modal Component ---
  const LoadingModal = () => {
    if (!updating) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div
          className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/3 p-8 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-900 mb-6"></div>
            <p className="text-gray-800 text-lg font-medium">جاري التحميل...</p>
            <p className="text-gray-600 text-sm mt-2">يرجى الانتظار</p>
          </div>
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
        <main className={`max-w-7xl mx-auto px-5 py-8 ${orderData.deliveryDetails?.deliveryFile ? 'pb-20' : ''}`}>
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

          <OrderStepper status={orderData.bookingStatus} onStepClick={handleStepClick} />

          <InfoCard
            title="معلومات العميل"
            data={[
              { label: 'اسم العميل', value: orderData.clientInfo.name },
              { label: 'رقم الهاتف', value: orderData.clientInfo.phone },
              { label: 'البريد الإلكتروني', value: orderData.clientInfo.email },
              { label: 'رقم الطلب', value: orderData.orderId },
            ]}
            gridCols={3}
            editable={true}
            clientID={orderData.clientInfo?.id ? Number(orderData.clientInfo.id) : undefined}
            onSave={(updatedData) => handleSaveEdits('clientInfo', updatedData)}
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
            id="office-link-info"
            title="1- الربط مع إدارة المكاتب"
            data={[
              { label: 'هوية العميل', value: orderData.officeLinkInfo.nationalId },
              { label: 'رقم التأشيرة', value: orderData.officeLinkInfo.visaNumber, fieldType: 'visa' },
              { label: 'رقم عقد إدارة المكاتب', value: orderData.officeLinkInfo.internalMusanedContract },
              { label: 'تاريخ العقد', value: orderData.officeLinkInfo.musanedDate},
            ]}
            gridCols={3}
            editable={true}
            clientID={orderData.clientInfo?.id ? Number(orderData.clientInfo.id) : undefined}
            onSave={(updatedData) => handleSaveEdits('officeLinkInfo', updatedData)}
          />

          <InfoCard
            id="external-office-info"
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
            id="external-office-approval"
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
            id="medical-check"
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
              {
                label: 'ملف الفحص الطبي',
                value: (
                  <div className="file-upload-display border border-none rounded-md p-1 flex justify-between items-center">
                    <span className="text-gray-500 text-md pr-2 flex items-center gap-2">
                      {orderData.medicalFile ? (
                        <>
                          <a
                            href={orderData.medicalFile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-800 hover:underline"
                          >
                            {orderData.medicalFile.split('/').pop()}
                          </a>
                          <button
                            aria-label="حذف ملف الفحص الطبي"
                            className="text-red-600 hover:text-red-700 text-lg font-bold"
                            onClick={async () => {
                              setUpdating(true);
                              try {
                                await fetch(`/api/track_order/${id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ section: 'medical', updatedData: { medicalCheckFile: null } }),
                                });
                                await fetchOrderData();
                              } catch (error) {
                                console.error('Error deleting medical file:', error);
                              } finally {
                                setUpdating(false);
                              }
                            }}
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        'إرفاق ملف الفحص الطبي'
                      )}
                    </span>
                    <input
                      type="file"
                      id="file-upload-medical"
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

                            await fetch(`/api/track_order/${id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                section: 'medical',
                                updatedData: { medicalCheckFile: filePath },
                              }),
                            });

                            await fetchOrderData();
                            setShowAlertModal({ isOpen: true, message: 'تم رفع ملف الفحص الطبي بنجاح' });
                          } catch (error: any) {
                            console.error('Error uploading medical file:', error);
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
                      htmlFor="file-upload-medical"
                      className={`bg-teal-800 text-white px-3 py-1 rounded-md text-md cursor-pointer hover:bg-teal-900 ${updating ? 'opacity-50' : ''}`}
                    >
                      اختيار ملف
                    </label>
                  </div>
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
            id="foreign-labor-approval"
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
            id="agency-payment"
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
            id="saudi-embassy-approval"
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
            id="visa-issuance"
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
            id="travel-permit"
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
            id="destinations"
            title="10- الوجهات"
            data={[
              { label: 'مدينة المغادرة', value: orderData.destinations.departureCity, fieldType: 'city' },
              { label: 'مدينة الوصول', value: orderData.destinations.arrivalCity, fieldType: 'saudiCity' },
              {
                label: 'تاريخ ووقت المغادرة',
                value: (
                  <div className="flex items-center justify-end gap-2">
                    <span>{orderData.destinations.departureDateTime}</span>
                    {/* <Calendar className="w-5 h-5 text-teal-800" aria-label="calendar icon" /> */}
                  </div>
                ),
              },
              {
                label: 'تاريخ ووقت الوصول',
                value: (
                  <div className="flex items-center justify-end gap-2">
                    <span>{orderData.destinations.arrivalDateTime}</span>
                    {/* <Calendar className="w-5 h-5 text-teal-800" aria-label="calendar icon" /> */}
                  </div>
                ),
              },
              {
                label: 'ملف التذكرة',
                fieldType: 'file',
                value: (editMode: boolean) => (
                  <div className="file-upload-display border border-none rounded-md p-1 flex justify-between items-center">
                    {!editMode ? (
                      // عرض رابط الملف فقط عندما لا يكون في وضع التعديل
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
                          'لا يوجد ملف مرفق'
                        )}
                      </span>
                    ) : (
                      // عرض زر الرفع فقط عندما يكون في وضع التعديل
                      <>
                        <span className="text-gray-500 text-md pr-2">
                          إرفاق ملف التذكرة
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
                          htmlFor="file-upload-destinations"
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

          <InfoCard
            id="receipt"
            title="11- الاستلام"
            data={[
              {
                label: 'طريقة الاستلام',
                value: orderData.receipt.received ? (
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-6 h-6 text-teal-800" aria-label="تم الاستلام" />
                      <span className="text-gray-700">
                        {orderData.receipt.method === 'direct' ? 'مباشر' :
                         orderData.receipt.method === 'indirect' ? 'غير مباشر' :
                         orderData.receipt.method === 'intermediary' ? 'عن طريق وسيط' :
                         'غير محدد'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 flex flex-row justify-center gap-6" >
                    <div className="flex items-center  gap-2 text-right">
                      <input
                        type="radio"
                        id="receipt-direct"
                        name="receipt-method"
                        value="direct"
                        className="ml-2"
                        checked={orderData.receipt.method === 'direct'}
                        onChange={async (e) => {
                          if (e.target.checked) {
                            // تأكيد الاستلام تلقائياً عند اختيار الطريقة
                            setUpdating(true);
                            try {
                              const res = await fetch(`/api/track_order/${id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  field: 'receipt', 
                                  value: true,
                                  section: 'receipt',
                                  updatedData: { method: 'direct' }
                                }),
                              });
                              if (res.ok) {
                                await fetchOrderData();
                              }
                            } catch (error) {
                              console.error('Error updating receipt:', error);
                            } finally {
                              setUpdating(false);
                            }
                          }
                        }}
                      />
                      <label htmlFor="receipt-direct" className="text-gray-700">مباشر</label>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <input
                        type="radio"
                        id="receipt-indirect"
                        name="receipt-method"
                        value="indirect"
                        className="ml-2"
                        checked={orderData.receipt.method === 'indirect'}
                        onChange={async (e) => {
                          if (e.target.checked) {
                            // تأكيد الاستلام تلقائياً عند اختيار الطريقة
                            setUpdating(true);
                            try {
                              const res = await fetch(`/api/track_order/${id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  field: 'receipt', 
                                  value: true,
                                  section: 'receipt',
                                  updatedData: { method: 'indirect' }
                                }),
                              });
                              if (res.ok) {
                                await fetchOrderData();
                              }
                            } catch (error) {
                              console.error('Error updating receipt:', error);
                            } finally {
                              setUpdating(false);
                            }
                          }
                        }}
                      />
                      <label htmlFor="receipt-indirect" className="text-gray-700">غير مباشر</label>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <input
                        type="radio"
                        id="receipt-intermediary"
                        name="receipt-method"
                        value="intermediary"
                        className="ml-2"
                        checked={orderData.receipt.method === 'intermediary'}
                        onChange={async (e) => {
                          if (e.target.checked) {
                            // تأكيد الاستلام تلقائياً عند اختيار الطريقة
                            setUpdating(true);
                            try {
                              const res = await fetch(`/api/track_order/${id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ 
                                  field: 'receipt', 
                                  value: true,
                                  section: 'receipt',
                                  updatedData: { method: 'intermediary' }
                                }),
                              });
                              if (res.ok) {
                                await fetchOrderData();
                              }
                            } catch (error) {
                              console.error('Error updating receipt:', error);
                            } finally {
                              setUpdating(false);
                            }
                          }
                        }}
                      />
                      <label htmlFor="receipt-intermediary" className="text-gray-700">عن طريق وسيط</label>
                    </div>
                  </div>
                ),
              },
              // حقول deliveryDetails - تظهر عند اختيار أي طريقة استلام
              ...(orderData.receipt.received && orderData.receipt.method ? [
                {
                  label: 'تاريخ الاستلام',
                  value: (
                    <div className="flex flex-col">
                      <input
                        type="date"
                        value={deliveryDetails.deliveryDate}
                        onChange={(e) => {
                          setDeliveryDetails({ ...deliveryDetails, deliveryDate: e.target.value });
                          // مسح الخطأ عند تغيير القيمة
                          if (deliveryDetailsErrors.deliveryDate) {
                            setDeliveryDetailsErrors({ ...deliveryDetailsErrors, deliveryDate: '' });
                          }
                        }}
                        className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 text-right ${
                          deliveryDetailsErrors.deliveryDate 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-teal-800'
                        }`}
                        required
                      />
                      {deliveryDetailsErrors.deliveryDate && (
                        <span className="text-red-600 text-sm text-right mt-1">
                          {deliveryDetailsErrors.deliveryDate}
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  label: 'وقت الاستلام',
                  value: (
                    <input
                      type="time"
                      value={deliveryDetails.deliveryTime}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, deliveryTime: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-800 text-right"
                    />
                  ),
                },
                {
                  label: 'التكلفة',
                  value: (
                    <input
                      type="number"
                      step="0.01"
                      value={deliveryDetails.cost}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, cost: e.target.value })}
                      placeholder="0.00"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-800 text-right"
                    />
                  ),
                },
                {
                  label: 'ملاحظات الاستلام',
                  value: (
                    <textarea
                      value={deliveryDetails.deliveryNotes}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, deliveryNotes: e.target.value })}
                      rows={3}
                      placeholder="أدخل ملاحظات الاستلام..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-800 text-right"
                    />
                  ),
                },
                {
                  label: 'ملف الاستلام',
                  value: (
                    <div className="file-upload-display border border-none rounded-md p-1 flex justify-between items-center">
                      <span className="text-gray-500 text-md pr-2 flex items-center gap-2">
                        {deliveryDetails.deliveryFile ? (
                          <>
                            <a
                              href={deliveryDetails.deliveryFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal-800 hover:underline"
                            >
                              {deliveryDetails.deliveryFile.split('/').pop()}
                            </a>
                            <button
                              aria-label="حذف ملف الاستلام"
                              className="text-red-600 hover:text-red-700 text-lg font-bold"
                              onClick={async () => {
                                setUpdating(true);
                                try {
                                  setDeliveryDetails({ ...deliveryDetails, deliveryFile: null });
                                  await fetch(`/api/track_order/${id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      section: 'deliveryDetails',
                                      updatedData: { ...deliveryDetails, deliveryFile: null },
                                    }),
                                  });
                                  await fetchOrderData();
                                } catch (error) {
                                  console.error('Error deleting delivery file:', error);
                                } finally {
                                  setUpdating(false);
                                }
                              }}
                            >
                              ×
                            </button>
                          </>
                        ) : (
                          'إرفاق ملف الاستلام'
                        )}
                      </span>
                      <input
                        type="file"
                        id="file-upload-delivery"
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

                              setDeliveryDetails({ ...deliveryDetails, deliveryFile: filePath });
                              await fetch(`/api/track_order/${id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  section: 'deliveryDetails',
                                  updatedData: { ...deliveryDetails, deliveryFile: filePath },
                                }),
                              });

                              await fetchOrderData();
                              setShowAlertModal({ isOpen: true, message: 'تم رفع ملف الاستلام بنجاح' });
                            } catch (error: any) {
                              console.error('Error uploading delivery file:', error);
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
                        htmlFor="file-upload-delivery"
                        className={`bg-teal-800 text-white px-3 py-1 rounded-md text-md cursor-pointer hover:bg-teal-900 ${updating ? 'opacity-50' : ''}`}
                      >
                        اختيار ملف
                      </label>
                    </div>
                  ),
                },
              ] : []),
            ]}
            actions={[
              ...(orderData.receipt.received && orderData.receipt.method ? [
                {
                  label: 'حفظ بيانات الاستلام',
                  type: 'primary' as const,
                  onClick: handleSaveDeliveryDetails,
                  disabled: updating,
                },
              ] : []),
              {
                label: 'تراجع',
                type: 'secondary' as const,
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
                  <div className="space-y-3">
                    {/* عرض الملفات الموجودة */}
                    {(() => {
                      const existingFiles = Array.isArray(orderData.documentUpload.files) 
                        ? orderData.documentUpload.files 
                        : orderData.documentUpload.files 
                          ? [orderData.documentUpload.files] 
                          : [];
                      
                      return existingFiles.length > 0 ? (
                        <div className="space-y-2">
                          {existingFiles.map((file, index) => (
                            <div key={index} className="file-upload-display border border-gray-300 rounded-md p-2 flex justify-between items-center bg-gray-50">
                              <span className="text-gray-700 text-sm pr-2 flex items-center gap-2">
                                <a
                                  href={file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-teal-800 hover:underline"
                                >
                                  {file.split('/').pop() || `ملف ${index + 1}`}
                                </a>
                                <button
                                  aria-label="حذف الملف"
                                  className="text-red-600 hover:text-red-700 text-lg font-bold"
                                  onClick={async () => {
                                    setUpdating(true);
                                    try {
                                      const updatedFiles = existingFiles.filter((_, i) => i !== index);
                                      await fetch(`/api/track_order/${id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          section: 'documentUpload',
                                          updatedData: { files: updatedFiles.length > 0 ? updatedFiles : null },
                                        }),
                                      });
                                      await fetchOrderData();
                                      setShowAlertModal({
                                        isOpen: true,
                                        message: 'تم حذف الملف بنجاح',
                                      });
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
                                  
                                  // Get existing files
                                  const existingFiles = Array.isArray(orderData.documentUpload.files) 
                                    ? orderData.documentUpload.files 
                                    : orderData.documentUpload.files 
                                      ? [orderData.documentUpload.files] 
                                      : [];
                                  
                                  // Add new file
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
                                  
                                  // Reset this input
                                  e.target.value = '';
                                  
                                  // Show success message
                                  setShowAlertModal({
                                    isOpen: true,
                                    message: 'تم رفع الملف بنجاح',
                                  });
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
        </main>

        {/* Feedback when order reaches receipt stage - يظهر فقط عند وجود ملف استلام */}
        {orderData.deliveryDetails?.deliveryFile && (
          <div className="fixed bottom-0 left-0 right-0 bg-teal-800 text-white py-4 px-6 shadow-lg z-40" dir="rtl">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
              <CheckCircleIcon className="w-6 h-6 text-white" />
              <span className="text-lg font-medium">تم انهاء الطلب</span>
            </div>
          </div>
        )}

        {/* Modals */}
        <ConfirmModal />
        <AlertModal />
        <LoadingModal />
        <ErrorModal 
          isOpen={showErrorModal.isOpen}
          title={showErrorModal.title}
          message={showErrorModal.message}
          onClose={() => setShowErrorModal({ ...showErrorModal, isOpen: false })}
        />

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