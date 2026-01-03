import CollapsibleSection from 'components/CollapsibleSection';
import { useEffect, useState, useRef } from 'react';
import Layout from 'example/containers/Layout';
import { useRouter } from 'next/router';
import React from 'react';
import { EditIcon, TrashIcon } from 'icons';

interface ClientInfo {
  id: string;
  fullname: string;
  phonenumber: string;
  nationalId: string;
  city: string;
}

interface VisaData {
  id: number;
  visaNumber: string;
  gender: string;
  profession: string;
  visaFile: string;
  nationality: string;
  createdAt: string;
}

interface OrderData {
  id: number;
  ClientName: string;
  PhoneNumber: string;
  bookingstatus: string;
  createdAt: string;
}

interface ClientAccountEntry {
  id: number;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  entryType: string | null;
}

interface ClientAccountStatement {
  id: number;
  clientId: number;
  contractNumber: string | null;
  officeName: string | null;
  totalRevenue: number;
  totalExpenses: number;
  netAmount: number;
  commissionPercentage: number | null;
  masandTransferAmount: number | null;
  contractStatus: string | null;
  notes: string | null;
  attachment: string | null;
  createdAt: string;
  updatedAt: string;
  entries: ClientAccountEntry[];
}

interface Notification {
  message: string;
  type: 'success' | 'error';
}

const VisaModal = React.memo(
  ({
    isHidden,
    setIsHidden,
    visaInfo,
    setVisaInfo,
    fetchVisas,
    setNotification,
    clientId,
    isEditMode = false,
    visaId,
    nationalities,
  }: {
    isHidden: boolean;
    setIsHidden: (isHidden: boolean) => void;
    visaInfo: VisaData;
    setVisaInfo: (visaInfo: VisaData) => void;
    fetchVisas: () => void;
    setNotification: (notification: Notification | null) => void;
    clientId: string;
    isEditMode?: boolean;
    visaId?: number;
    nationalities: Array<{ value: string; label: string }>;
  }) => {
    const visaNumberRef = useRef<HTMLInputElement>(null);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [uploading, setUploading] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState<string>('');

    useEffect(() => {
      if (!isHidden && visaNumberRef.current) {
        visaNumberRef.current.focus();
      }
      // Reset uploaded file name when modal opens/closes
      if (isHidden) {
        setUploadedFileName('');
      }
    }, [isHidden]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setVisaInfo({ ...visaInfo, [e.target.name]: e.target.value });
      setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    };

    const validateForm = () => {
      const newErrors: { [key: string]: string } = {};

      if (!visaInfo.visaNumber) {
        newErrors.visaNumber = 'رقم التأشيرة مطلوب';
      } else if (!/^\d+$/.test(visaInfo.visaNumber)) {
        newErrors.visaNumber = 'رقم التأشيرة يجب أن يحتوي على أرقام فقط';
      }

      if (!visaInfo.gender) {
        newErrors.gender = 'الجنس مطلوب';
      }

      if (!visaInfo.nationality) {
        newErrors.nationality = 'الجنسية مطلوبة';
      }

      if (visaInfo.profession && !/^[\u0600-\u06FFa-zA-Z\s]+$/.test(visaInfo.profession)) {
        newErrors.profession = 'المهنة يجب أن تحتوي على أحرف فقط';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

      
    const saveVisaData = async () => {
      if (!validateForm()) {
        setNotification({ message: 'يرجى تصحيح الأخطاء في النموذج', type: 'error' });
        return;
      }

      try {
        const response = await fetch(`/api/visadata${isEditMode ? `` : ''}`, {
          method: isEditMode ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...visaInfo,
            clientID: clientId,
          }),
        });

        if (response.ok) {
          setNotification({
            message: isEditMode ? 'تم تحديث التأشيرة بنجاح' : 'تم إضافة التأشيرة بنجاح',
            type: 'success',
          });
          setIsHidden(true);
          fetchVisas();
          setVisaInfo({
            id: 0,
            visaNumber: '',
            gender: '',
            profession: '',
            visaFile: '',
            nationality: '',
            createdAt: '',
          });
          setErrors({});
        } else {
          throw new Error(isEditMode ? 'فشل في تحديث التأشيرة' : 'فشل في إضافة التأشيرة');
        }
      } catch (error) {
        console.error(error);
        setNotification({
          message: isEditMode ? 'فشل في تحديث التأشيرة' : 'فشل في إضافة التأشيرة',
          type: 'error',
        });
      }
    };

    return (
      <div
        className={`fixed inset-0 bg-gray-800 bg-opacity-50 z-50 flex items-center justify-center transition-opacity duration-300 ${
          isHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
          <h2 className="text-xl font-semibold text-teal-800 mb-4 text-center">
            {isEditMode ? 'تعديل تأشيرة' : 'إضافة تأشيرة'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                رقم التأشيرة <span className="text-red-500">*</span>
              </label>
              <input
                ref={visaNumberRef}
                type="text"
                name="visaNumber"
                value={visaInfo.visaNumber}
                placeholder="أدخل رقم التأشيرة"
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.visaNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.visaNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.visaNumber}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                الجنس <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={visaInfo.gender}
                onChange={handleInputChange}
                className={`w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.gender ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">اختر الجنس</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">المهنة</label>
              <input
                type="text"
                name="profession"
                value={visaInfo.profession}
                placeholder="أدخل المهنة"
                onChange={handleInputChange}
                className={`w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.profession ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.profession && (
                <p className="text-red-500 text-sm mt-1">{errors.profession}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                الجنسية <span className="text-red-500">*</span>
              </label>
              <select
                name="nationality"
                value={visaInfo.nationality}
                onChange={handleInputChange}
                className={`w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.nationality ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">اختر الجنسية</option>
                {nationalities.map((nat) => (
                  <option key={nat.value} value={nat.value}>
                    {nat.label}
                  </option>
                ))}
              </select>
              {errors.nationality && (
                <p className="text-red-500 text-sm mt-1">{errors.nationality}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">الملف</label>
              <input
                type="file"
                accept="application/pdf,image/*"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  setUploading(true);
                  setUploadedFileName('');
                  try {
                    // Use visaFile identifier (matching AddClientModal pattern)
                    const res = await fetch(`/api/upload-presigned-url/visaFile`);
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
                    
                    setVisaInfo({ ...visaInfo, visaFile: filePath });
                    setUploadedFileName(file.name);
                    setNotification({ message: 'تم رفع الملف بنجاح', type: 'success' });
                    
                    // Reset input
                    e.target.value = '';
                  } catch (error: any) {
                    console.error('Error uploading file:', error);
                    setUploadedFileName('');
                    setNotification({ 
                      message: error.message || 'فشل في رفع الملف', 
                      type: 'error' 
                    });
                  } finally {
                    setUploading(false);
                  }
                }}
                className="w-full border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {uploading && (
                <p className="text-sm text-teal-600 mt-1 flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  جاري رفع الملف...
                </p>
              )}
              {!uploading && uploadedFileName && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800 flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    تم رفع الملف بنجاح: <span className="font-semibold">{uploadedFileName}</span>
                  </p>
                  {visaInfo.visaFile && (
                    <a
                      href={visaInfo.visaFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-teal-600 hover:underline mt-1 block"
                    >
                      عرض الملف
                    </a>
                  )}
                </div>
              )}
              {!uploading && visaInfo.visaFile && !uploadedFileName && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800 flex items-center gap-2">
                    <span className="text-blue-600">ℹ</span>
                    يوجد ملف مرفوع مسبقاً
                  </p>
                  <a
                    href={visaInfo.visaFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-teal-600 hover:underline mt-1 block"
                  >
                    عرض الملف
                  </a>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsHidden(true)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
              >
                إغلاق
              </button>
              <button
                onClick={saveVisaData}
                className="px-4 py-2 bg-teal-800 text-white rounded-md hover:bg-teal-900 transition"
              >
                {isEditMode ? 'حفظ التعديلات' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default function Home() {
  const [isHidden, setIsHidden] = useState(true);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    id: '',
    fullname: '',
    phonenumber: '',
    nationalId: '',
    city: '',
  });
  const [visaInfo, setVisaInfo] = useState<VisaData>({
    id: 0,
    visaNumber: '',
    gender: '',
    profession: '',
    visaFile: '',
    nationality: '',
    createdAt: '',
  });
  const [visas, setVisas] = useState<VisaData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [financialStatements, setFinancialStatements] = useState<ClientAccountStatement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFinancial, setIsLoadingFinancial] = useState(false);
  const [editingVisaId, setEditingVisaId] = useState<number | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    visaId: number | null;
  }>({ isOpen: false, visaId: null });
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalClientInfo, setOriginalClientInfo] = useState<ClientInfo>({
    id: '',
    fullname: '',
    phonenumber: '',
    nationalId: '',
    city: '',
  });
  const [nationalities, setNationalities] = useState<Array<{ value: string; label: string }>>([]);

  const router = useRouter();

  const fetchClientInfo = async () => {
    if (!router.query.id) return;
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clientinfo?id=${router.query.id}`);
      const data = await response.json();
      setClientInfo(data);
      setOriginalClientInfo(data);
      setOrders(data.orders);
      setIsEditMode(false);
    } catch (error) {
      console.error(error);
      setNotification({ message: 'فشل في جلب بيانات العميل', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVisas = async () => {
    if (!router.query.id) return;
    try {
      const response = await fetch(`/api/visadata?clientID=${router.query.id}`);
      const data = await response.json();
      setVisas(data.data);
    } catch (error) {
      console.error(error);
      setNotification({ message: 'فشل في جلب بيانات التأشيرات', type: 'error' });
    }
  };

  const fetchFinancialStatements = async () => {
    if (!router.query.id) return;
    try {
      setIsLoadingFinancial(true);
      const response = await fetch(`/api/client-accounts?client=${router.query.id}&limit=100`);
      const data = await response.json();
      if (data.statements) {
        setFinancialStatements(data.statements);
      }
    } catch (error) {
      console.error(error);
      setNotification({ message: 'فشل في جلب البيانات المالية', type: 'error' });
    } finally {
      setIsLoadingFinancial(false);
    }
  };

  const fetchNationalities = async () => {
    try {
      const response = await fetch('/api/nationalities');
      const data = await response.json();
      if (data.success && data.nationalities) {
        const nationalityOptions = data.nationalities.map((nat: any) => ({
          value: nat.Country || nat.value,
          label: nat.Country || nat.label,
        }));
        setNationalities(nationalityOptions);
      }
    } catch (error) {
      console.error('Error fetching nationalities:', error);
    }
  };

  const handleEditVisa = (visa: VisaData) => {
    setVisaInfo(visa);
    setEditingVisaId(visa.id);
    setIsHidden(false);
  };

  const handleDeleteVisa = (visaId: number) => {
    setDeleteConfirmModal({ isOpen: true, visaId });
  };

  const confirmDeleteVisa = async () => {
    if (!deleteConfirmModal.visaId) return;
    
    try {
      const response = await fetch(`/api/visadata?id=${deleteConfirmModal.visaId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setNotification({ message: 'تم حذف التأشيرة بنجاح', type: 'success' });
        fetchVisas();
        setDeleteConfirmModal({ isOpen: false, visaId: null });
      } else {
        throw new Error('فشل في حذف التأشيرة');
      }
    } catch (error) {
      console.error(error);
      setNotification({ message: 'فشل في حذف التأشيرة', type: 'error' });
      setDeleteConfirmModal({ isOpen: false, visaId: null });
    }
  };

  useEffect(() => {
    fetchClientInfo();
    fetchVisas();
    fetchFinancialStatements();
    fetchNationalities();
  }, [router.query.id]);

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setClientInfo(originalClientInfo);
    setIsEditMode(false);
  };

  const updateClientInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/clientinfo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientInfo),
      });
      if (response.ok) {
        setNotification({ message: 'تم تحديث بيانات العميل بنجاح', type: 'success' });
        setOriginalClientInfo(clientInfo);
        setIsEditMode(false);
        fetchClientInfo();
      } else {
        throw new Error('فشل في تحديث البيانات');
      }
    } catch (error) {
      console.error(error);
      setNotification({ message: 'فشل في تحديث بيانات العميل', type: 'error' });
    }
  };

  function NotificationModal({
    message,
    type,
    onClose,
  }: {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
  }) {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-50 flex items-center justify-center transition-opacity duration-300">
        <div
          className={`rounded-lg p-6 w-full max-w-sm shadow-xl ${
            type === 'success' ? 'bg-white' : 'bg-red-100'
          }`}
        >
          <p
            className={`text-center font-semibold ${
              type === 'success' ? 'text-teal-800' : 'text-red-800'
            }`}
          >
            {message}
          </p>
          <button
            onClick={onClose}
            className={`mt-4 w-full py-2 rounded-md text-white ${
              type === 'success' ? 'bg-teal-800 hover:bg-teal-900' : 'bg-red-800 hover:bg-red-900'
            } transition`}
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
  }) {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-50 flex items-center justify-center transition-opacity duration-300">
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
          <h2 className="text-xl font-semibold text-red-800 mb-4 text-center">
            تأكيد الحذف
          </h2>
          <p className="text-center text-gray-700 mb-6">
            هل أنت متأكد من حذف هذه التأشيرة؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
            >
              إلغاء
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              حذف
            </button>
          </div>
        </div>
      </div>
    );
  }


    // دالة ترجمة حالة الطلب من الإنجليزية إلى العربية
  const translateBookingStatus = (status: string) => {
    const statusTranslations: { [key: string]: string } = {
      'pending': 'قيد الانتظار',
      'external_office_approved': 'موافقة المكتب الخارجي',
      'pending_external_office': 'في انتظار المكتب الخارجي',
      'medical_check_passed': 'تم اجتياز الفحص الطبي',
      'pending_medical_check': 'في انتظار الفحص الطبي',
      'foreign_labor_approved': 'موافقة وزارة العمل الأجنبية',
      'pending_foreign_labor': 'في انتظار وزارة العمل الأجنبية',
      'agency_paid': 'تم دفع الوكالة',
      'pending_agency_payment': 'في انتظار دفع الوكالة',
      'embassy_approved': 'موافقة السفارة السعودية',
      'pending_embassy': 'في انتظار السفارة السعودية',
      'visa_issued': 'تم إصدار التأشيرة',
      'pending_visa': 'في انتظار إصدار التأشيرة',
      'travel_permit_issued': 'تم إصدار تصريح السفر',
      'pending_travel_permit': 'في انتظار تصريح السفر',
      'received': 'تم الاستلام',
      'pending_receipt': 'في انتظار الاستلام',
      'cancelled': 'ملغي',
      'rejected': 'مرفوض',
      'delivered': 'تم التسليم',
      'new_order': 'طلب جديد',
      'new_orders': 'طلبات جديدة'
    };
    
    return statusTranslations[status] || status;
  };




const arabicRegionMap: { [key: string]: string } = {
    'Ar Riyāḍ': 'الرياض',
    'Makkah al Mukarramah': 'مكة المكرمة',
    'Al Madīnah al Munawwarah': 'المدينة المنورة',
    'Ash Sharqīyah': 'المنطقة الشرقية',
    'Asīr': 'عسير',
    'Tabūk': 'تبوك',
    'Al Ḩudūd ash Shamālīyah': 'الحدود الشمالية',
    'Jazan': 'جازان',
    'Najrān': 'نجران',
    'Al Bāḩah': 'الباحة',
    'Al Jawf': 'الجوف',
    'Al Qaşīm': 'القصيم',
    'Ḩa\'il': 'حائل',
  };

  const translateCity = (city: string) => {
    return arabicRegionMap[city as keyof typeof arabicRegionMap];
  }


  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        {isLoading && (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-teal-800"></div>
          </div>
        )}
        <VisaModal
          isHidden={isHidden}
          setIsHidden={setIsHidden}
          visaInfo={visaInfo}
          setVisaInfo={setVisaInfo}
          fetchVisas={fetchVisas}
          setNotification={setNotification}
          clientId={router.query.id as string}
          isEditMode={editingVisaId !== null}
          visaId={editingVisaId || undefined}
          nationalities={nationalities}
        />
        {notification && (
          <NotificationModal
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
        <DeleteConfirmModal
          isOpen={deleteConfirmModal.isOpen}
          onClose={() => setDeleteConfirmModal({ isOpen: false, visaId: null })}
          onConfirm={confirmDeleteVisa}
        />

        <div className="max-w-7xl mx-auto">
          <p className="text-right text-xl text-gray-600 mb-8">
            رقم العميل: <span className="text-teal-800 font-bold">{clientInfo.id}</span>
          </p>

          <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-semibold text-teal-800 text-center flex-1">
                المعلومات الشخصية
              </h2>
              {!isEditMode && (
                <button
                  onClick={handleEditClick}
                  className="text-teal-600 hover:text-teal-800 transition-colors p-2"
                  title="تعديل"
                >
                  <EditIcon className="w-6 h-6" />
                </button>
              )}
            </div>
            <form onSubmit={updateClientInfo}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">اسم العميل</label>
                  <input
                    type="text"
                    className={`p-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      !isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    value={clientInfo.fullname}
                    onChange={(e) =>
                      setClientInfo({ ...clientInfo, fullname: e.target.value })
                    }
                    readOnly={!isEditMode}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    className={`p-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      !isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    value={clientInfo.phonenumber}
                    onChange={(e) =>
                      setClientInfo({ ...clientInfo, phonenumber: e.target.value })
                    }
                    readOnly={!isEditMode}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">رقم الهوية</label>
                  <input
                    type="number"
                    className={`p-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      !isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    value={clientInfo.nationalId}
                    onChange={(e) =>
                      setClientInfo({ ...clientInfo, nationalId: e.target.value })
                    }
                    readOnly={!isEditMode}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">المدينة</label>
                  <select
                    className={`p-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      !isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    value={clientInfo.city}
                    onChange={(e) =>
                      setClientInfo({ ...clientInfo, city: e.target.value })
                    }
                    disabled={!isEditMode}
                    required
                  >
             
          <option value="">اختر المدينة</option>
<option value = "Baha">الباحة</option>
<option value = "Jawf">الجوف</option>
<option value = "Qassim">القصيم</option>
<option value = "Hail">حائل</option>
<option value = "Jazan">جازان</option>
<option value = "Najran">نجران</option>
<option value = "Madinah">المدينة المنورة</option>
<option value = "Riyadh">الرياض</option>
<option value = "Al-Kharj">الخرج</option>
<option value = "Ad Diriyah">الدرعية</option>
<option value = "Al Majma'ah">المجمعة</option>
<option value = "Al Zulfi">الزلفي</option>
<option value = "Ad Dawadimi">الدوادمي</option>
<option value = "Wadi Ad Dawasir">وادي الدواسر</option>
<option value = "Afif">عفيف</option>
<option value = "Al Quway'iyah">القويعية</option>
<option value = "Shaqra">شقراء</option>
<option value = "Hotat Bani Tamim">حوطة بني تميم</option>
<option value = "Makkah">مكة المكرمة</option>
<option value = "Jeddah">جدة</option>
<option value = "Taif">الطائف</option>
<option value = "Rabigh">رابغ</option>
<option value = "Al Qunfudhah">القنفذة</option>
<option value = "Al Lith">الليث</option>
<option value = "Khulais">خليص</option>
<option value = "Ranyah">رنية</option>
<option value = "Turabah">تربة</option>
<option value = "Yanbu">ينبع</option>
<option value = "Al Ula">العلا</option>
<option value = "Badr">بدر</option>
<option value = "Al Hinakiyah">الحناكية</option>
<option value = "Mahd Al Dhahab">مهد الذهب</option>
<option value = "Dammam">الدمام</option>
<option value = "Al Khobar">الخبر</option>
<option value = "Dhahran">الظهران</option>
<option value = "Al Ahsa">الأحساء</option>
<option value = "Al Hufuf">الهفوف</option>
<option value = "Al Mubarraz">المبرز</option>
<option value = "Jubail">الجبيل</option>
<option value = "Hafr Al Batin">حفر الباطن</option>
<option value = "Al Khafji">الخفجي</option>
<option value = "Ras Tanura">رأس تنورة</option>
<option value = "Qatif">القطيف</option>
<option value = "Abqaiq">بقيق</option>
<option value = "Nairiyah">النعيرية</option>
<option value = "Qaryat Al Ulya">قرية العليا</option>
<option value = "Buraydah">بريدة</option>
<option value = "Unaizah">عنيزة</option>
<option value = "Ar Rass">الرس</option>
<option value = "Al Bukayriyah">البكيرية</option>
<option value = "Al Badaye">البدائع</option>
<option value = "Al Mithnab">المذنب</option>
<option value = "Riyad Al Khabra">رياض الخبراء</option>
<option value = "Abha">أبها</option>
<option value = "Khamis Mushait">خميس مشيط</option>
<option value = "Bisha">بيشة</option>
<option value = "Mahayil">محايل عسير</option>
<option value = "Al Namas">النماص</option>
<option value = "Tanomah">تنومة</option>
<option value = "Ahad Rafidah">أحد رفيدة</option>
<option value = "Sarat Abidah">سراة عبيدة</option>

                  </select>
                </div>
              </div>
              {isEditMode && (
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-gray-500 text-white py-2 px-8 rounded-md hover:bg-gray-600 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-teal-800 text-white py-2 px-8 rounded-md hover:bg-teal-900 transition"
                  >
                    حفظ التعديلات
                  </button>
                </div>
              )}
            </form>
          </div>

          <CollapsibleSection title="بيانات التأشيرة">
            <div className="flex flex-col gap-4">
              <button
                className="mx-auto bg-teal-800 text-white py-2 px-8 rounded-md hover:bg-teal-900 transition"
                onClick={() => {
                  setVisaInfo({
                    id: 0,
                    visaNumber: '',
                    gender: '',
                    profession: '',
                    visaFile: '',
                    nationality: '',
                    createdAt: '',
                  });
                  setEditingVisaId(null);
                  setIsHidden(false);
                }}
              >
                إضافة تأشيرة
              </button>
              {visas.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-teal-800 text-white text-center">
                        <th className="p-3 border text-center">رقم التأشيرة</th>
                        <th className="p-3 border text-center">الجنس</th>
                        <th className="p-3 border text-center">المهنة</th>
                        <th className="p-3 border text-center">الجنسية</th>
                        <th className="p-3 border text-center">تاريخ الإنشاء</th>
                        <th className="p-3 border text-center">الملف</th>
                        <th className="p-3 border text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visas.map((visa) => (
                        <tr key={visa.id} className="hover:bg-gray-50 text-center">
                          <td className="p-3 border text-center">{visa.visaNumber}</td>
                          <td className="p-3 border text-center">{visa.gender}</td>
                          <td className="p-3 border text-center">{visa.profession}</td>
                          <td className="p-3 border text-center">{visa.nationality}</td>
                          <td className="p-3 border text-center">
                            {new Date(visa.createdAt).toLocaleDateString('ar-EG', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="p-3 border">
                            {visa.visaFile ? (
                              <a
                                href={visa.visaFile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-600 hover:underline"
                              >
                                عرض الملف
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="p-3 border">
                            <div className="flex gap-3 justify-center items-center">
                              <button
                                onClick={() => handleEditVisa(visa)}
                                className="text-teal-600 hover:text-teal-800 transition-colors"
                                title="تعديل"
                              >
                                <EditIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteVisa(visa.id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="حذف"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-600">لا توجد تأشيرات بعد</p>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="الطلبات">
            <div className="flex flex-col gap-4">
              <button
                className="mx-auto bg-teal-800 text-white py-2 px-8 rounded-md hover:bg-teal-900 transition"
                onClick={() =>
                  router.push(
                    `/admin/order-form?type=add-available&clientId=${router.query.id}&clientName=${clientInfo.fullname}&clientPhone=${clientInfo.phonenumber}&clientCity=${clientInfo.city}`
                  )
                }
              >
                إضافة طلب
              </button>
              {orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-teal-800 text-white text-center">
                        <th className="p-3 border text-center">رقم الطلب</th>
                        <th className="p-3 border text-center">اسم العميل</th>
                        <th className="p-3 border text-center">رقم الهاتف</th>
                        <th className="p-3 border text-center">حالة الحجز</th>
                        <th className="p-3 border text-center">تاريخ الإنشاء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 text-center">
                          <td className="p-3 border text-center cursor-pointer" onClick={()=>router.push(`/admin/track_order/${order.id}`)}>{order.id}</td>
                          <td className="p-3 border text-center">{order.ClientName}</td>
                          <td className="p-3 border text-center">{order.PhoneNumber}</td>
                          <td className="p-3 border text-center">{translateBookingStatus(order.bookingstatus)}</td>
                          <td className="p-3 border text-center">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-600">لا توجد طلبات بعد</p>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="البيانات المالية">
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 justify-center">
                <button
                  className="bg-teal-800 text-white py-2 px-8 rounded-md hover:bg-teal-900 transition"
                  onClick={() => router.push(`/admin/client-accounts?clientId=${router.query.id}`)}
                >
                  إضافة بيانات مالية
                </button>
                <button
                  className="bg-gray-600 text-white py-2 px-8 rounded-md hover:bg-gray-700 transition"
                  onClick={fetchFinancialStatements}
                  disabled={isLoadingFinancial}
                >
                  {isLoadingFinancial ? 'جاري التحديث...' : 'تحديث البيانات'}
                </button>
              </div>
              {isLoadingFinancial ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-teal-800"></div>
                </div>
              ) : financialStatements.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-teal-800 text-white text-center">
                        <th className="p-3 border text-center">رقم العقد</th>
                        <th className="p-3 border text-center">اسم المكتب</th>
                        <th className="p-3 border text-center">الإيرادات</th>
                        <th className="p-3 border text-center">المصروفات</th>
                        <th className="p-3 border text-center">الصافي</th>
                        <th className="p-3 border text-center">نسبة العمولة</th>
                        <th className="p-3 border text-center">حالة العقد</th>
                        <th className="p-3 border text-center">تاريخ الإنشاء</th>
                        <th className="p-3 border text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialStatements.map((statement) => (
                        <tr key={statement.id} className="hover:bg-gray-50 text-center">
                          <td className="p-3 border text-center">
                            {statement.contractNumber || '-'}
                          </td>
                          <td className="p-3 border text-center">
                            {statement.officeName || '-'}
                          </td>
                          <td className="p-3 border text-center">
                            {Number(statement.totalRevenue).toLocaleString('ar-SA', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} ريال
                          </td>
                          <td className="p-3 border text-center">
                            {Number(statement.totalExpenses).toLocaleString('ar-SA', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} ريال
                          </td>
                          <td className={`p-3 border text-center font-semibold ${
                            Number(statement.netAmount) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {Number(statement.netAmount).toLocaleString('ar-SA', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} ريال
                          </td>
                          <td className="p-3 border text-center">
                            {statement.commissionPercentage 
                              ? `${Number(statement.commissionPercentage)}%` 
                              : '-'}
                          </td>
                          <td className="p-3 border text-center">
                            {statement.contractStatus || '-'}
                          </td>
                          <td className="p-3 border text-center">
                            {new Date(statement.createdAt).toLocaleDateString('ar-EG', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="p-3 border">
                            <div className="flex gap-3 justify-center items-center">
                              <button
                                onClick={() => router.push(`/admin/client-accounts/${statement.id}`)}
                                className="text-teal-600 hover:text-teal-800 transition-colors px-2 py-1 rounded"
                                title="عرض التفاصيل"
                              >
                                عرض التفاصيل
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {financialStatements.length > 1 && (
                        <tr className="bg-teal-50 font-bold text-center">
                          <td colSpan={2} className="p-3 border text-center">
                            الإجمالي
                          </td>
                          <td className="p-3 border text-center">
                            {financialStatements.reduce((sum, s) => sum + Number(s.totalRevenue), 0).toLocaleString('ar-SA', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} ريال
                          </td>
                          <td className="p-3 border text-center">
                            {financialStatements.reduce((sum, s) => sum + Number(s.totalExpenses), 0).toLocaleString('ar-SA', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} ريال
                          </td>
                          <td className={`p-3 border text-center ${
                            financialStatements.reduce((sum, s) => sum + Number(s.netAmount), 0) >= 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {financialStatements.reduce((sum, s) => sum + Number(s.netAmount), 0).toLocaleString('ar-SA', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} ريال
                          </td>
                          <td colSpan={4} className="p-3 border"></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-600">لا توجد بيانات مالية بعد</p>
              )}
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </Layout>
  );
}
