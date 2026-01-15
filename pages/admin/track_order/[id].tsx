
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
import { Calendar, AlarmClock, ArrowRight } from 'lucide-react';
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
  orderFiles?: { orderDocument?: string | null; contract?: string | null };
  officeLinkInfo: { nationalId: string; visaNumber: string; internalMusanedContract: string; musanedDate: string };
  officeLinkApproval: { approved: boolean };
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
  const [isDeliveryDetailsEditMode, setIsDeliveryDetailsEditMode] = useState(false);

  // --- Modal States ---
  const [showConfirmModal, setShowConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

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

  // دالة للتحقق من اكتمال مرحلة معينة
  const isStepCompleted = (stepName: string): boolean => {
    if (!orderData) return false;
    
    switch (stepName) {
      case 'officeLinkInfo':
        // الربط مع إدارة المكاتب - مكتمل إذا كان هناك رقم تأشيرة أو رقم عقد
        return !!(orderData.officeLinkInfo.visaNumber || orderData.officeLinkInfo.internalMusanedContract);
      case 'officeLinkApproval':
        return orderData.officeLinkApproval.approved;
      case 'externalOfficeInfo':
        // المكتب الخارجي - مكتمل إذا كان هناك اسم مكتب
        return !!orderData.externalOfficeInfo.officeName;
      case 'externalOfficeApproval':
        return orderData.externalOfficeApproval.approved;
      case 'medicalCheck':
        return orderData.medicalCheck.passed;
      case 'foreignLaborApproval':
        return orderData.foreignLaborApproval.approved;
      case 'agencyPayment':
        return orderData.agencyPayment.paid;
      case 'saudiEmbassyApproval':
        return orderData.saudiEmbassyApproval.approved;
      case 'visaIssuance':
        return orderData.visaIssuance.issued;
      case 'travelPermit':
        return orderData.travelPermit.issued;
      case 'destinations':
        // الوجهات - مكتمل إذا كان هناك تاريخ مغادرة أو وصول
        return (orderData.destinations.departureDateTime !== 'N/A' && orderData.destinations.departureDateTime !== '') || 
               (orderData.destinations.arrivalDateTime !== 'N/A' && orderData.destinations.arrivalDateTime !== '');
      case 'receipt':
        return orderData.receipt.received;
      default:
        return false;
    }
  };

  // ترتيب المراحل
  const stepsOrder = [
    'officeLinkInfo',
    'officeLinkApproval',
    'externalOfficeInfo', 
    'externalOfficeApproval',
    'medicalCheck',
    'foreignLaborApproval',
    'agencyPayment',
    'saudiEmbassyApproval',
    'visaIssuance',
    'travelPermit',
    'destinations',
    'receipt'
  ];

  // دالة للتحقق من أن موعد الوصول قد مر
  const isArrivalDatePassed = (): boolean => {
    if (!orderData?.destinations?.arrivalDateTime) return false;
    
    const arrivalDateTime = new Date(orderData.destinations.arrivalDateTime);
    const now = new Date();
    
    return now >= arrivalDateTime;
  };

  // دالة للتحقق من أن المرحلة السابقة مكتملة
  const canCompleteStep = (stepName: string): boolean => {
    const stepIndex = stepsOrder.indexOf(stepName);
    if (stepIndex === 0) return true; // المرحلة الأولى يمكن إكمالها دائماً
    if (stepIndex === -1) return false;
    
    // التحقق من أن كل المراحل السابقة مكتملة
    for (let i = 0; i < stepIndex; i++) {
      if (!isStepCompleted(stepsOrder[i])) {
        return false;
      }
    }
    
    // التحقق الإضافي لمرحلة الاستلام: يجب أن يكون موعد الوصول قد مر
    if (stepName === 'receipt') {
      if (!isArrivalDatePassed()) {
        return false;
      }
    }
    
    return true;
  };

  // دالة للحصول على اسم المرحلة السابقة غير المكتملة
  const getPreviousIncompleteStep = (stepName: string): string | null => {
    const stepIndex = stepsOrder.indexOf(stepName);
    if (stepIndex <= 0) return null;
    
    for (let i = 0; i < stepIndex; i++) {
      if (!isStepCompleted(stepsOrder[i])) {
        return fieldNames[stepsOrder[i]] || stepsOrder[i];
      }
    }
    
    // التحقق الإضافي لمرحلة الاستلام: إذا لم يحن موعد الوصول بعد
    if (stepName === 'receipt' && !isArrivalDatePassed()) {
      if (!orderData?.destinations?.arrivalDateTime) {
        return 'تحديد موعد الوصول أولاً';
      }
      const arrivalDate = new Date(orderData.destinations.arrivalDateTime);
      return `موعد الوصول (${arrivalDate.toLocaleDateString('ar-SA')} ${arrivalDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })})`;
    }
    
    return null;
  };

  // دالة للحصول على آخر مرحلة موافق عليها
  const getLastApprovedStage = (): string | null => {
    if (!orderData) return null;
    
    // المراحل التي يمكن التراجع عنها مرتبة حسب الترتيب
    const reversibleStages = [
      'officeLinkApproval',
      'externalOfficeApproval',
      'medicalCheck',
      'foreignLaborApproval',
      'agencyPayment',
      'saudiEmbassyApproval',
      'visaIssuance',
      'travelPermit',
      'destinations',
      'receipt'
    ];
    
    // البحث من النهاية إلى البداية للعثور على آخر مرحلة موافق عليها
    for (let i = reversibleStages.length - 1; i >= 0; i--) {
      const stage = reversibleStages[i];
      if (isStepCompleted(stage)) {
        return stage;
      }
    }
    
    return null;
  };

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
      
      // التحقق من وجود custom timeline وإعادة التوجيه
      if (data.nationality) {
        try {
          const timelineRes = await fetch(`/api/custom-timeline/by-country/${encodeURIComponent(data.nationality)}`);
          if (timelineRes.ok) {
            // يوجد custom timeline، إعادة التوجيه
            setTimeout(() => {
              router.replace(`/admin/track_timeline/${id}`);
            }, 100);
            return; // إيقاف التنفيذ هنا لتجنب عرض الصفحة العادية
          }
        } catch (error) {
          // لا يوجد custom timeline، استمر في الصفحة العادية
          console.log('No custom timeline found, using default');
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
    'officeLinkApproval': 'موافقة الربط مع إدارة المكاتب',
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

  // Helper to replace 'N/A' with empty string for display
  const valOrEmpty = (val: any) => {
    return val === 'N/A' ? '' : val;
  };

  const handleStatusUpdate = async (field: string, value: boolean) => {
    const fieldName = fieldNames[field] || field;
    
    // التحقق من رقم عقد إدارة المكاتب عند تأكيد الموافقة فقط (value === true)
    if(field === 'officeLinkApproval' && value === true){
      if(!orderData?.officeLinkInfo?.internalMusanedContract || orderData?.officeLinkInfo?.internalMusanedContract.trim() === '' || orderData?.officeLinkInfo?.internalMusanedContract === 'N/A'){
          setShowErrorModal({
            isOpen: true,
            title: 'خطأ في تحديث الحالة',
            message: 'رقم عقد إدارة المكاتب مطلوب',
          });
          return;
      }
      // التحقق من رقم التأشيرة وتاريخ العقد
      if(!orderData?.officeLinkInfo?.visaNumber || orderData?.officeLinkInfo?.visaNumber.trim() === '' || orderData?.officeLinkInfo?.visaNumber === 'N/A'){
          setShowErrorModal({
            isOpen: true,
            title: 'خطأ في تحديث الحالة',
            message: 'رقم التأشيرة مطلوب',
          });
          return;
      }
      if(!orderData?.officeLinkInfo?.musanedDate || orderData?.officeLinkInfo?.musanedDate.trim() === '' || orderData?.officeLinkInfo?.musanedDate === 'N/A'){
          setShowErrorModal({
            isOpen: true,
            title: 'خطأ في تحديث الحالة',
            message: 'تاريخ العقد مطلوب',
          });
          return;
      }
    }

    // التحقق من رقم عقد مساند التوثيق عند تأكيد الموافقة فقط (value === true)
    if(field === 'externalOfficeApproval' && value === true){
      if(!orderData?.externalOfficeInfo?.externalMusanedContract || orderData?.externalOfficeInfo?.externalMusanedContract.trim() === '' || orderData?.externalOfficeInfo?.externalMusanedContract === 'N/A'){
          setShowErrorModal({
            isOpen: true,
            title: 'خطأ في تحديث الحالة',
            message: 'رقم عقد مساند التوثيق مطلوب',
          }); 
          return;
       }
     }
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
          // await fetchOrderData();
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
          await fetchOrderData(); // تحديث البيانات بعد التحديث
        }
      },
    });
    };
  const checknationalid = async (nationalId: string)=>{
    const res = await fetch(`/api/checkNationaliiduniquness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nationalId }),
    });
    const data = await res.json();
   
   
    return data.exists;
  }




  const handleSaveEdits = async (section: string, updatedData: Record<string, string>) => {
    // التحقق من رقم الهاتف في قسم معلومات العميل
    if (section === 'clientInfo' && updatedData['رقم الهاتف']) {
      const phone = updatedData['رقم الهاتف'].trim();
      
      // التحقق فقط إذا كان الرقم غير فارغ وليس 'N/A'
      if (phone && phone !== 'N/A' && phone !== '') {
        // التحقق من أن الرقم يحتوي على أرقام فقط
        if (!/^\d+$/.test(phone)) {
          setShowErrorModal({
            isOpen: true,
            title: 'خطأ في التحقق',
            message: 'رقم الهاتف يجب أن يحتوي على أرقام فقط',
          });
          return;
        }
        
        // التحقق من أن الرقم يبدأ بـ 05
        if (!phone.startsWith('05')) {
          setShowErrorModal({
            isOpen: true,
            title: 'خطأ في التحقق',
            message: 'رقم الهاتف يجب أن يبدأ بـ 05',
          });
          return;
        }
        
        // التحقق من أن الرقم 9 أو 10 أرقام
        if (phone.length !== 10) {
          setShowErrorModal({
            isOpen: true,
            title: 'خطأ في التحقق',
            message: 'رقم الهاتف يجب أن يكون إجمالي الأرقام 10 أرقام',
          });
          return;
        }
      }
    }

    // التحقق من هوية العميل في قسم الربط مع إدارة المكاتب
    if (section === 'officeLinkInfo' && updatedData['هوية العميل']) {
      const nationalId = updatedData['هوية العميل'].trim();
        // التحقق من أن الهوية تحتوي على أرقام فقط
        if (!/^\d+$/.test(nationalId)) {
          setShowErrorModal({
            isOpen: true,
            title: 'خطأ في التحقق',
            message: 'هوية العميل يجب أن تحتوي على أرقام فقط',
          });
          return;
        }

      const originalNationalId = orderData?.officeLinkInfo?.nationalId?.trim() || '';
      
      // التحقق فقط إذا كان الرقم غير فارغ وليس 'N/A' ومختلف عن القيمة الأصلية
      if (nationalId && nationalId !== 'N/A' && nationalId !== '' && nationalId !== originalNationalId) {
        const exists = await checknationalid(nationalId);
        if(exists){
// alert('هوية العميل متسجلة مسبقا');
          setShowErrorModal({
            isOpen: true,
            title: 'خطأ في التحقق',
            message: 'هوية العميل متسجلة مسبقا',
          });
          await fetchOrderData();
          return;
        }
      }
    }

    // التحقق من رقم عقد إدارة المكاتب في قسم الربط مع إدارة المكاتب
    if (section === 'officeLinkInfo' && updatedData['رقم عقد إدارة المكاتب']) {
      const contract = updatedData['رقم عقد إدارة المكاتب'].trim();
      
      // التحقق فقط إذا كان الرقم غير فارغ وليس 'N/A'
      if (contract && contract !== 'N/A' && contract !== '') {
        // التحقق من أن الرقم يحتوي على أرقام فقط
        if (!/^\d+$/.test(contract)) {
          setShowErrorModal({
            isOpen: true,
            title: 'خطأ في التحقق',
            message: 'رقم العقد يجب أن يحتوي على أرقام فقط',
          });
          return;
        }
        
        // التحقق من أن الرقم يبدأ بـ 20
        if (!contract.startsWith('20')) {
          setShowErrorModal({
            isOpen: true,
            title: 'خطأ في التحقق',
            message: 'رقم العقد يجب أن يبدأ بـ 20',
          });
          return;
        }
        
        // التحقق من أن الرقم 10 أرقام
        if (contract.length !== 10) {
          setShowErrorModal({
            isOpen: true,
            title: 'خطأ في التحقق',
            message: 'رقم العقد يجب أن يكون 10 أرقام',
          });
          return;
        }
      }
    }

    // التحقق من تاريخ ووقت الوصول والمغادرة في قسم الوجهات
    if (section === 'destinations') {
      const departureDateTime = updatedData['تاريخ ووقت المغادرة'];
      const arrivalDateTime = updatedData['تاريخ ووقت الوصول'];
      
      // التحقق من أن كلا التاريخين موجودان
      if (departureDateTime && arrivalDateTime) {
        const departureDate = new Date(departureDateTime);
        const arrivalDate = new Date(arrivalDateTime);
        
        // التحقق من أن التواريخ صحيحة
        if (!isNaN(departureDate.getTime()) && !isNaN(arrivalDate.getTime())) {
          // التحقق من أن تاريخ الوصول لا يسبق تاريخ المغادرة
          if (arrivalDate < departureDate) {
            setShowErrorModal({
              isOpen: true,
              title: 'خطأ في التحقق',
              message: 'تاريخ ووقت الوصول لا يمكن أن يسبق تاريخ ووقت المغادرة',
            });
            return;
          }
        }
      }
    }

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
          await fetchOrderData();
          setUpdating(false);
        }
      },
    });
  };

  const handleCancelContract = async () => {
    setCancellationReason('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancellationReason.trim()) {
      setShowErrorModal({
        isOpen: true,
        title: 'خطأ',
        message: 'يرجى إدخال سبب الإلغاء',
      });
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/track_order/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          field: 'bookingStatus', 
          value: 'cancelled',
          cancellationReason: cancellationReason 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'فشل في إلغاء العقد');
      }
      setShowCancelModal(false);
      setCancellationReason('');
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
      setIsDeliveryDetailsEditMode(false); // إغلاق وضع التعديل بعد الحفظ
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

  const handleDeleteDeliveryFile = async () => {
    if (!orderData?.deliveryDetails?.deliveryFile && !deliveryDetails.deliveryFile) return;

    setShowConfirmModal({
      isOpen: true,
      title: 'حذف ملف الاستلام',
      message: 'هل أنت متأكد من حذف ملف الاستلام؟',
      onConfirm: async () => {
        setUpdating(true);
        try {
          // Update local state immediately for better UX
          setDeliveryDetails((prev) => ({ ...prev, deliveryFile: null }));

          const res = await fetch(`/api/track_order/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              section: 'deliveryDetails',
              updatedData: { deliveryFile: null },
            }),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error((errorData as any)?.error || 'فشل في حذف ملف الاستلام');
          }

          await fetchOrderData();
          setShowAlertModal({ isOpen: true, message: 'تم حذف ملف الاستلام بنجاح' });
        } catch (error: any) {
          console.error('Error deleting delivery file:', error);
          setShowErrorModal({
            isOpen: true,
            title: 'خطأ في حذف الملف',
            message: error.message || 'حدث خطأ أثناء حذف ملف الاستلام',
          });
        } finally {
          setUpdating(false);
        }
      },
    });
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 flex items-center justify-center"
                title="العودة للصفحة السابقة"
                aria-label="العودة للصفحة السابقة"
              >
                <ArrowRight className="w-6 h-6 text-teal-800" />
              </button>
              <h1 className="text-3xl font-normal text-gray-900">طلب #{orderData.orderId}</h1>
            </div>
            <div className="flex gap-4">
              {orderData.bookingStatus !== 'cancelled' && (
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-md hover:bg-red-700 disabled:opacity-50"
                  onClick={handleCancelContract}
                  disabled={updating}
                >
                  إلغاء العقد
                </button>
              )}
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
              { label: 'اسم العميل', value: valOrEmpty(orderData.clientInfo.name) },
              { label: 'رقم الهاتف', value: valOrEmpty(orderData.clientInfo.phone), fieldType: 'phone' },
              { label: 'البريد الإلكتروني', value: valOrEmpty(orderData.clientInfo.email) },
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
              { label: 'اسم العاملة', value: valOrEmpty(orderData.homemaidInfo.name) },
              { label: 'رقم جواز السفر', value: valOrEmpty(orderData.homemaidInfo.passportNumber) },
              { label: 'الجنسية', value: valOrEmpty(orderData.nationality) || 'غير محدد' },
              { label: 'المكتب الخارجي', value: valOrEmpty(orderData.homemaidInfo.externalOffice) },
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
              { label: 'هوية العميل', value: valOrEmpty(orderData.officeLinkInfo.nationalId) },
              { label: 'رقم التأشيرة', value: valOrEmpty(orderData.officeLinkInfo.visaNumber), fieldType: 'visa' },
              { label: 'رقم عقد إدارة المكاتب', value: valOrEmpty(orderData.officeLinkInfo.internalMusanedContract) },
              { label: 'تاريخ العقد', value: valOrEmpty(orderData.officeLinkInfo.musanedDate)},
            ]}
            gridCols={3}
            editable={true}
            clientID={orderData.clientInfo?.id ? Number(orderData.clientInfo.id) : undefined}
            onSave={(updatedData) => handleSaveEdits('officeLinkInfo', updatedData)}
            actions={[
              ...(orderData.officeLinkApproval.approved ? [
                {
                  label: 'تراجع عن الموافقة',
                  type: 'secondary' as const,
                  onClick: () => handleStatusUpdate('officeLinkApproval', false),
                  disabled: updating || (getLastApprovedStage() !== 'officeLinkApproval' && getLastApprovedStage() !== null),
                },
              ] : [
                {
                  label: 'تأكيد الموافقة',
                  type: 'primary' as const,
                  onClick: () => handleStatusUpdate('officeLinkApproval', true),
                  disabled: updating || !canCompleteStep('officeLinkApproval') || 
                    !orderData?.officeLinkInfo?.visaNumber || 
                    orderData?.officeLinkInfo?.visaNumber.trim() === '' || 
                    orderData?.officeLinkInfo?.visaNumber === 'N/A' ||
                    !orderData?.officeLinkInfo?.musanedDate || 
                    orderData?.officeLinkInfo?.musanedDate.trim() === '' || 
                    orderData?.officeLinkInfo?.musanedDate === 'N/A',
                },
              ]),
            ]}
          />

          <InfoCard
            id="external-office-info"
            title="2- المكتب الخارجي"
            data={[
              { label: 'اسم المكتب الخارجي', value: valOrEmpty(orderData.externalOfficeInfo.officeName) },
              { label: 'دولة المكتب الخارجي', value: valOrEmpty(orderData.externalOfficeInfo.country) },
              { label: 'رقم عقد مساند التوثيق', value: valOrEmpty(orderData.externalOfficeInfo.externalMusanedContract) },
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
                  <div className="flex flex-col items-center gap-2">
                    <button
                      className={`bg-teal-800 text-white px-4 py-2 rounded-md text-md hover:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed`}
                      onClick={() => handleStatusUpdate('externalOfficeApproval', true)}
                      disabled={updating || !canCompleteStep('externalOfficeApproval')}
                      title={!canCompleteStep('externalOfficeApproval') ? `يجب إكمال: ${getPreviousIncompleteStep('externalOfficeApproval')}` : ''}
                    >
                      تأكيد الموافقة
                    </button>
                    {!canCompleteStep('externalOfficeApproval') && (
                      <span className="text-red-600 text-sm">يجب إكمال: {getPreviousIncompleteStep('externalOfficeApproval')}</span>
                    )}
                  </div>
                ),
              },
            ]}
            actions={[
              {
                label: 'تراجع',
                type: 'secondary',
                onClick: () => handleStatusUpdate('externalOfficeApproval', false),
                disabled: updating || !orderData.externalOfficeApproval.approved || getLastApprovedStage() !== 'externalOfficeApproval',
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
                  <div className="flex flex-col items-center gap-2">
                    <button
                      className={`bg-teal-800 text-white px-4 py-2 rounded-md text-md hover:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed`}
                      onClick={() => handleStatusUpdate('medicalCheck', true)}
                      disabled={updating || !canCompleteStep('medicalCheck')}
                      title={!canCompleteStep('medicalCheck') ? `يجب إكمال: ${getPreviousIncompleteStep('medicalCheck')}` : ''}
                    >
                      تأكيد الاجتياز
                    </button>
                    {!canCompleteStep('medicalCheck') && (
                      <span className="text-red-600 text-sm">يجب إكمال: {getPreviousIncompleteStep('medicalCheck')}</span>
                    )}
                  </div>
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
                disabled: updating || !orderData.medicalCheck.passed || getLastApprovedStage() !== 'medicalCheck',
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
                  <div className="flex flex-col items-center gap-2">
                    <button
                      className={`bg-teal-800 text-white px-4 py-2 rounded-md text-md hover:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed`}
                      onClick={() => handleStatusUpdate('foreignLaborApproval', true)}
                      disabled={updating || !canCompleteStep('foreignLaborApproval')}
                      title={!canCompleteStep('foreignLaborApproval') ? `يجب إكمال: ${getPreviousIncompleteStep('foreignLaborApproval')}` : ''}
                    >
                      تأكيد الموافقة
                    </button>
                    {!canCompleteStep('foreignLaborApproval') && (
                      <span className="text-red-600 text-sm">يجب إكمال: {getPreviousIncompleteStep('foreignLaborApproval')}</span>
                    )}
                  </div>
                ),
              },
            ]}
            actions={[
              {
                label: 'تراجع',
                type: 'secondary',
                onClick: () => handleStatusUpdate('foreignLaborApproval', false),
                disabled: updating || !orderData.foreignLaborApproval.approved || getLastApprovedStage() !== 'foreignLaborApproval',
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
                  <div className="flex flex-col items-center gap-2">
                    <button
                      className={`bg-teal-800 text-white px-4 py-2 rounded-md text-md hover:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed`}
                      onClick={() => handleStatusUpdate('agencyPayment', true)}
                      disabled={updating || !canCompleteStep('agencyPayment')}
                      title={!canCompleteStep('agencyPayment') ? `يجب إكمال: ${getPreviousIncompleteStep('agencyPayment')}` : ''}
                    >
                      تأكيد الدفع
                    </button>
                    {!canCompleteStep('agencyPayment') && (
                      <span className="text-red-600 text-sm">يجب إكمال: {getPreviousIncompleteStep('agencyPayment')}</span>
                    )}
                  </div>
                ),
              },
            ]}
            actions={[
              {
                label: 'تراجع',
                type: 'secondary',
                onClick: () => handleStatusUpdate('agencyPayment', false),
                disabled: updating || !orderData.agencyPayment.paid || getLastApprovedStage() !== 'agencyPayment',
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
                  <div className="flex flex-col items-center gap-2">
                    <button
                      className={`bg-teal-800 text-white px-4 py-2 rounded-md text-md hover:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed`}
                      onClick={() => handleStatusUpdate('saudiEmbassyApproval', true)}
                      disabled={updating || !canCompleteStep('saudiEmbassyApproval')}
                      title={!canCompleteStep('saudiEmbassyApproval') ? `يجب إكمال: ${getPreviousIncompleteStep('saudiEmbassyApproval')}` : ''}
                    >
                      تأكيد الموافقة
                    </button>
                    {!canCompleteStep('saudiEmbassyApproval') && (
                      <span className="text-red-600 text-sm">يجب إكمال: {getPreviousIncompleteStep('saudiEmbassyApproval')}</span>
                    )}
                  </div>
                ),
              },
            ]}
            actions={[
              {
                label: 'تراجع',
                type: 'secondary',
                onClick: () => handleStatusUpdate('saudiEmbassyApproval', false),
                disabled: updating || !orderData.saudiEmbassyApproval.approved || getLastApprovedStage() !== 'saudiEmbassyApproval',
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
                  <div className="flex flex-col items-center gap-2">
                    <button
                      className={`bg-teal-800 text-white px-4 py-2 rounded-md text-md hover:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed`}
                      onClick={() => handleStatusUpdate('visaIssuance', true)}
                      disabled={updating || !canCompleteStep('visaIssuance')}
                      title={!canCompleteStep('visaIssuance') ? `يجب إكمال: ${getPreviousIncompleteStep('visaIssuance')}` : ''}
                    >
                      تأكيد الإصدار
                    </button>
                    {!canCompleteStep('visaIssuance') && (
                      <span className="text-red-600 text-sm">يجب إكمال: {getPreviousIncompleteStep('visaIssuance')}</span>
                    )}
                  </div>
                ),
              },
            ]}
            actions={[
              {
                label: 'تراجع',
                type: 'secondary',
                onClick: () => handleStatusUpdate('visaIssuance', false),
                disabled: updating || !orderData.visaIssuance.issued || getLastApprovedStage() !== 'visaIssuance',
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
                  <div className="flex flex-col items-center gap-2">
                    <button
                      className={`bg-teal-800 text-white px-4 py-2 rounded-md text-md hover:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed`}
                      onClick={() => handleStatusUpdate('travelPermit', true)}
                      disabled={updating || !canCompleteStep('travelPermit')}
                      title={!canCompleteStep('travelPermit') ? `يجب إكمال: ${getPreviousIncompleteStep('travelPermit')}` : ''}
                    >
                      تأكيد الإصدار
                    </button>
                    {!canCompleteStep('travelPermit') && (
                      <span className="text-red-600 text-sm">يجب إكمال: {getPreviousIncompleteStep('travelPermit')}</span>
                    )}
                  </div>
                ),
              },
            ]}
            actions={[
              {
                label: 'تراجع',
                type: 'secondary',
                onClick: () => handleStatusUpdate('travelPermit', false),
                disabled: updating || !orderData.travelPermit.issued || getLastApprovedStage() !== 'travelPermit',
              },
            ]}
          />

          <InfoCard
            id="destinations"
            title="10- الوجهات"
            data={[
              { label: 'مدينة المغادرة', value: valOrEmpty(orderData.destinations.departureCity), fieldType: 'city' },
              { label: 'مدينة الوصول', value: valOrEmpty(orderData.destinations.arrivalCity), fieldType: 'saudiCity' },
              {
                label: 'تاريخ ووقت المغادرة',
                value: (
                  <div className="flex items-center justify-end gap-2">
                    <span>{valOrEmpty(orderData.destinations.departureDateTime)}</span>
                    {/* <Calendar className="w-5 h-5 text-teal-800" aria-label="calendar icon" /> */}
                  </div>
                ),
                rawValue: valOrEmpty(orderData.destinations.departureDateTime),
              },
              {
                label: 'تاريخ ووقت الوصول',
                value: (
                  <div className="flex items-center justify-end gap-2">
                    <span>{valOrEmpty(orderData.destinations.arrivalDateTime)}</span>
                    {/* <Calendar className="w-5 h-5 text-teal-800" aria-label="calendar icon" /> */}
                  </div>
                ),
                rawValue: valOrEmpty(orderData.destinations.arrivalDateTime),
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
            editable={canCompleteStep('destinations')}
            onSave={(updatedData) => handleSaveEdits('destinations', updatedData)}
            disabled={!canCompleteStep('destinations')}
            bottomMessage={!canCompleteStep('destinations') ? (
              <span className="text-red-600 text-sm">يجب إكمال: {getPreviousIncompleteStep('destinations')}</span>
            ) : undefined}
            actions={[
              {
                label: 'تراجع',
                type: 'secondary',
                onClick: () => handleStatusUpdate('destinations', false),
                disabled: updating || !isStepCompleted('destinations') || getLastApprovedStage() !== 'destinations',
              },
            ]}
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
                  <div className="flex flex-col items-center gap-3">
                    {!canCompleteStep('receipt') && (
                      <span className="text-red-600 text-sm flex items-center gap-1">
                        {!isArrivalDatePassed() && orderData.destinations?.arrivalDateTime
                          ? (() => {
                              const arrivalDate = new Date(orderData.destinations.arrivalDateTime);
                              const isValidDate = !isNaN(arrivalDate.getTime());
                              if (isValidDate) {
                                return (
                                  <>
                                    <AlarmClock className="inline-block w-4 h-4" />
                                    لا يمكن الاستلام قبل موعد الوصول ({arrivalDate.toLocaleDateString('ar-SA')} {arrivalDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })})
                                  </>
                                );
                              }
                              return (
                                <>
                                  <AlarmClock className="inline-block w-4 h-4" />
                                  لا يمكن الاستلام قبل موعد الوصول
                                </>
                              );
                            })()
                          : !orderData.destinations?.arrivalDateTime
                            ? '⚠️ يجب تحديد موعد الوصول أولاً'
                            : `يجب إكمال: ${getPreviousIncompleteStep('receipt')}`
                        }
                      </span>
                    )}
                    <div className={`space-y-2 flex flex-row justify-center gap-6 ${!canCompleteStep('receipt') ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="flex items-center  gap-2 text-right">
                        <input
                          type="radio"
                          id="receipt-direct"
                          name="receipt-method"
                          value="direct"
                          className="ml-2"
                          checked={orderData.receipt.method === 'direct'}
                          disabled={!canCompleteStep('receipt')}
                          onChange={async (e) => {
                            if (e.target.checked && canCompleteStep('receipt')) {
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
                          disabled={!canCompleteStep('receipt')}
                          onChange={async (e) => {
                            if (e.target.checked && canCompleteStep('receipt')) {
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
                          disabled={!canCompleteStep('receipt')}
                          onChange={async (e) => {
                            if (e.target.checked && canCompleteStep('receipt')) {
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
                  </div>
                ),
              },
              // حقول deliveryDetails - تظهر عند اختيار أي طريقة استلام
              ...(orderData.receipt.received && orderData.receipt.method ? [
                {
                  label: 'تاريخ ووقت الاستلام',
                  value: isDeliveryDetailsEditMode ? (
                    // Editable mode - حقل إدخال
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
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
                          className={`flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 text-right ${
                            deliveryDetailsErrors.deliveryDate 
                              ? 'border-red-500 focus:ring-red-500' 
                              : 'border-gray-300 focus:ring-teal-800'
                          }`}
                          required
                        />
                        <input
                          type="time"
                          value={deliveryDetails.deliveryTime}
                          onChange={(e) => setDeliveryDetails({ ...deliveryDetails, deliveryTime: e.target.value })}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-800 text-right"
                        />
                      </div>
                      {deliveryDetailsErrors.deliveryDate && (
                        <span className="text-red-600 text-sm text-right mt-1">
                          {deliveryDetailsErrors.deliveryDate}
                        </span>
                      )}
                    </div>
                  ) : (
                    // Non-editable mode - عرض البيانات المحفوظة
                    <div className="flex items-center justify-start gap-2 text-right text-gray-700 border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                      <span>
                        {orderData.deliveryDetails?.deliveryDate && orderData.deliveryDetails?.deliveryTime
                          ? `${orderData.deliveryDetails.deliveryDate} - ${orderData.deliveryDetails.deliveryTime}`
                          : orderData.deliveryDetails?.deliveryDate || orderData.deliveryDetails?.deliveryTime || 'غير محدد'}
                      </span>
                    </div>
                  ),
                },
                {
                  label: 'التكلفة',
                  value: isDeliveryDetailsEditMode ? (
                    // Editable mode
                    <input
                      type="number"
                      step="0.01"
                      value={deliveryDetails.cost}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, cost: e.target.value })}
                      placeholder=""
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-800 text-right"
                    />
                  ) : (
                    // Non-editable mode
                    <div className="text-right text-gray-700 border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                      {orderData.deliveryDetails?.cost || 'غير محدد'}
                    </div>
                  ),
                },
                {
                  label: 'ملاحظات الاستلام',
                  value: isDeliveryDetailsEditMode ? (
                    // Editable mode
                    <textarea
                      value={deliveryDetails.deliveryNotes}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, deliveryNotes: e.target.value })}
                      rows={3}
                      placeholder="أدخل ملاحظات الاستلام..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-800 text-right"
                    />
                  ) : (
                    // Non-editable mode
                    <div className="text-right text-gray-700 border border-gray-300 rounded-md px-3 py-2 bg-gray-50 whitespace-pre-wrap min-h-[80px]">
                      {orderData.deliveryDetails?.deliveryNotes || 'لا توجد ملاحظات'}
                    </div>
                  ),
                },
                {
                  label: 'ملف الاستلام',
                  value: (
                    <div className="file-upload-display border border-none rounded-md p-1 flex justify-between items-center">
                      <span className="text-gray-500 text-md pr-2 flex items-center gap-2">
                        {(() => {
                          const deliveryFileToShow =
                            orderData.deliveryDetails?.deliveryFile ?? deliveryDetails.deliveryFile;

                          if (deliveryFileToShow) {
                            return (
                              <>
                                <a
                                  href={deliveryFileToShow}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-teal-800 hover:underline"
                                >
                                  {deliveryFileToShow.split('/').pop()}
                                </a>
                                <button
                                  aria-label="حذف ملف الاستلام"
                                  className="text-red-600 hover:text-red-700 text-lg font-bold disabled:opacity-50"
                                  onClick={handleDeleteDeliveryFile}
                                  disabled={updating}
                                >
                                  ×
                                </button>
                              </>
                            );
                          }

                          return isDeliveryDetailsEditMode ? 'إرفاق ملف الاستلام' : 'لا يوجد ملف';
                        })()}
                      </span>
                      {isDeliveryDetailsEditMode &&
                        !(orderData.deliveryDetails?.deliveryFile ?? deliveryDetails.deliveryFile) && (
                        // Editable mode - زر رفع الملف يظهر فقط في وضع التعديل
                        <>
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
                        </>
                      )}
                    </div>
                  ),
                },
              ] : []),
            ]}
            actions={[
              // في وضع Non-editable - زر التعديل
              ...(orderData.receipt.received && orderData.receipt.method && !isDeliveryDetailsEditMode ? [
                {
                  label: 'تعديل',
                  type: 'primary' as const,
                  onClick: () => {
                    // تحديث deliveryDetails من orderData عند فتح وضع التعديل
                    if (orderData.deliveryDetails) {
                      setDeliveryDetails({
                        deliveryDate: orderData.deliveryDetails.deliveryDate || '',
                        deliveryTime: orderData.deliveryDetails.deliveryTime || '',
                        deliveryFile: orderData.deliveryDetails.deliveryFile || null,
                        deliveryNotes: orderData.deliveryDetails.deliveryNotes || '',
                        cost: orderData.deliveryDetails.cost?.toString() || '',
                      });
                    }
                    setIsDeliveryDetailsEditMode(true);
                  },
                  disabled: updating,
                },
              ] : []),
              // في وضع Editable - زر الحفظ
              ...(orderData.receipt.received && orderData.receipt.method && isDeliveryDetailsEditMode ? [
                {
                  label: 'حفظ بيانات الاستلام',
                  type: 'primary' as const,
                  onClick: handleSaveDeliveryDetails,
                  disabled: updating,
                },
                {
                  label: 'إلغاء',
                  type: 'secondary' as const,
                  onClick: () => {
                    setIsDeliveryDetailsEditMode(false);
                    // إعادة تعيين البيانات من orderData
                    if (orderData.deliveryDetails) {
                      setDeliveryDetails({
                        deliveryDate: orderData.deliveryDetails.deliveryDate || '',
                        deliveryTime: orderData.deliveryDetails.deliveryTime || '',
                        deliveryFile: orderData.deliveryDetails.deliveryFile || null,
                        deliveryNotes: orderData.deliveryDetails.deliveryNotes || '',
                        cost: orderData.deliveryDetails.cost?.toString() || '',
                      });
                    }
                    setDeliveryDetailsErrors({});
                  },
                  disabled: updating,
                },
              ] : []),
              {
                label: 'تراجع',
                type: 'secondary' as const,
                onClick: () => handleStatusUpdate('receipt', false),
                disabled: updating || !orderData.receipt.received || getLastApprovedStage() !== 'receipt',
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

          <InfoCard
            title="مرفقات الطلب"
            data={[
              {
                label: 'ملف سند الأمر',
                value: (
                  <div className="file-upload-display border border-none rounded-md p-1 flex justify-between items-center">
                    <span className="text-gray-700 text-sm pr-2 flex items-center gap-2">
                      {orderData.orderFiles?.orderDocument ? (
                        <>
                          <a
                            href={orderData.orderFiles.orderDocument}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-800 hover:underline"
                          >
                            {orderData.orderFiles.orderDocument.split('/').pop() || 'فتح الملف'}
                          </a>
                          <button
                            aria-label="حذف ملف سند الأمر"
                            className="text-red-600 hover:text-red-700 text-lg font-bold"
                            disabled={updating}
                            onClick={() => {
                              setShowConfirmModal({
                                isOpen: true,
                                title: 'حذف ملف سند الأمر',
                                message: 'هل أنت متأكد من حذف ملف سند الأمر؟',
                                onConfirm: async () => {
                                  setUpdating(true);
                                  try {
                                    const res = await fetch(`/api/track_order/${id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        section: 'orderFiles',
                                        updatedData: { orderDocument: null },
                                      }),
                                    });
                                    if (!res.ok) {
                                      const errorData = await res.json();
                                      throw new Error((errorData as any)?.error || 'فشل في حذف الملف');
                                    }
                                    await fetchOrderData();
                                    setShowAlertModal({ isOpen: true, message: 'تم حذف الملف بنجاح' });
                                  } catch (error: any) {
                                    console.error('Error deleting orderDocument:', error);
                                    setShowErrorModal({
                                      isOpen: true,
                                      title: 'خطأ في حذف الملف',
                                      message: error.message || 'حدث خطأ أثناء حذف الملف',
                                    });
                                  } finally {
                                    setUpdating(false);
                                  }
                                },
                              });
                            }}
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-500">لا يوجد</span>
                      )}
                    </span>

                    <input
                      type="file"
                      id="file-upload-orderDocument"
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
                              'Content-Type': file.type || 'application/pdf',
                              'x-amz-acl': 'public-read',
                            },
                          });
                          if (!uploadRes.ok) throw new Error('فشل في رفع الملف');

                          const saveRes = await fetch(`/api/track_order/${id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              section: 'orderFiles',
                              updatedData: { orderDocument: filePath },
                            }),
                          });
                          if (!saveRes.ok) {
                            const errorData = await saveRes.json();
                            throw new Error((errorData as any)?.error || 'فشل في حفظ رابط الملف');
                          }

                          await fetchOrderData();
                          e.target.value = '';
                          setShowAlertModal({ isOpen: true, message: 'تم رفع ملف سند الأمر بنجاح' });
                        } catch (error: any) {
                          console.error('Error uploading orderDocument:', error);
                          setShowErrorModal({
                            isOpen: true,
                            title: 'خطأ في رفع الملف',
                            message: error.message || 'حدث خطأ أثناء رفع الملف',
                          });
                        } finally {
                          setUpdating(false);
                        }
                      }}
                    />
                    <label
                      htmlFor="file-upload-orderDocument"
                      className={`bg-teal-800 text-white px-3 py-1 rounded-md text-md cursor-pointer hover:bg-teal-900 ${updating ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      اختيار ملف
                    </label>
                  </div>
                ),
              },
              {
                label: 'ملف العقد',
                value: (
                  <div className="file-upload-display border border-none rounded-md p-1 flex justify-between items-center">
                    <span className="text-gray-700 text-sm pr-2 flex items-center gap-2">
                      {orderData.orderFiles?.contract ? (
                        <>
                          <a
                            href={orderData.orderFiles.contract}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-800 hover:underline"
                          >
                            {orderData.orderFiles.contract.split('/').pop() || 'فتح الملف'}
                          </a>
                          <button
                            aria-label="حذف ملف العقد"
                            className="text-red-600 hover:text-red-700 text-lg font-bold"
                            disabled={updating}
                            onClick={() => {
                              setShowConfirmModal({
                                isOpen: true,
                                title: 'حذف ملف العقد',
                                message: 'هل أنت متأكد من حذف ملف العقد؟',
                                onConfirm: async () => {
                                  setUpdating(true);
                                  try {
                                    const res = await fetch(`/api/track_order/${id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        section: 'orderFiles',
                                        updatedData: { contract: null },
                                      }),
                                    });
                                    if (!res.ok) {
                                      const errorData = await res.json();
                                      throw new Error((errorData as any)?.error || 'فشل في حذف الملف');
                                    }
                                    await fetchOrderData();
                                    setShowAlertModal({ isOpen: true, message: 'تم حذف الملف بنجاح' });
                                  } catch (error: any) {
                                    console.error('Error deleting contract:', error);
                                    setShowErrorModal({
                                      isOpen: true,
                                      title: 'خطأ في حذف الملف',
                                      message: error.message || 'حدث خطأ أثناء حذف الملف',
                                    });
                                  } finally {
                                    setUpdating(false);
                                  }
                                },
                              });
                            }}
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-500">لا يوجد</span>
                      )}
                    </span>

                    <input
                      type="file"
                      id="file-upload-contract"
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
                              'Content-Type': file.type || 'application/pdf',
                              'x-amz-acl': 'public-read',
                            },
                          });
                          if (!uploadRes.ok) throw new Error('فشل في رفع الملف');

                          const saveRes = await fetch(`/api/track_order/${id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              section: 'orderFiles',
                              updatedData: { contract: filePath },
                            }),
                          });
                          if (!saveRes.ok) {
                            const errorData = await saveRes.json();
                            throw new Error((errorData as any)?.error || 'فشل في حفظ رابط الملف');
                          }

                          await fetchOrderData();
                          e.target.value = '';
                          setShowAlertModal({ isOpen: true, message: 'تم رفع ملف العقد بنجاح' });
                        } catch (error: any) {
                          console.error('Error uploading contract:', error);
                          setShowErrorModal({
                            isOpen: true,
                            title: 'خطأ في رفع الملف',
                            message: error.message || 'حدث خطأ أثناء رفع الملف',
                          });
                        } finally {
                          setUpdating(false);
                        }
                      }}
                    />
                    <label
                      htmlFor="file-upload-contract"
                      className={`bg-teal-800 text-white px-3 py-1 rounded-md text-md cursor-pointer hover:bg-teal-900 ${updating ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      اختيار ملف
                    </label>
                  </div>
                ),
              },
            ]}
            actions={[]}
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
        
        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div
              className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/2 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-right">إلغاء العقد</h3>
              <p className="text-gray-700 mb-4 text-right">هل أنت متأكد من إلغاء العقد؟ هذا الإجراء لا يمكن التراجع عنه.</p>
              <div className="mb-4">
                <label className="block text-right text-gray-700 mb-2 font-medium">
                  سبب الإلغاء <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="يرجى كتابة سبب الإلغاء..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-right"
                  rows={4}
                  dir="rtl"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellationReason('');
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-teal-800 text-white rounded-md hover:bg-teal-900"
                  onClick={handleConfirmCancel}
                  disabled={updating}
                >
                  {updating ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
                </button>
              </div>
            </div>
          </div>
        )}

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