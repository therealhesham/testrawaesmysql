import CollapsibleSection from 'components/CollapsibleSection';
import VisaModal, { VisaData } from 'components/VisaModal';
import { useEffect, useState } from 'react';
import Layout from 'example/containers/Layout';
import { useRouter } from 'next/router';
import React from 'react';
import { EditIcon, TrashIcon } from 'icons';
import { ArrowRight } from 'lucide-react';
import { formatSaudiCity, saudiCitiesMap } from 'lib/cityHelper';

const ALL_SAUDI_CITIES = Array.from(new Set(Object.values(saudiCitiesMap)));

interface ClientInfo {
  id: string;
  fullname: string;
  phonenumber: string;
  nationalId: string;
  city: string;
}

interface OrderData {
  id: number;
  ClientName?: string | null;
  PhoneNumber?: string | null;
  clientphonenumber?: string | null;
  bookingstatus: string;
  createdAt: string;
  HomemaidId?: number | null;
  Name?: string | null;
  Passportnumber?: string | null;
  Nationalitycopy?: string | null;
  Total?: number | null;
  AmountWithoutTax?: number | null;
  paid?: number | null;
  contract?: string | null;
  HomeMaid?: {
    id: number;
    Name?: string | null;
    Passportnumber?: string | null;
    Nationality?: string | null;
    Nationalitycopy?: string | null;
    officeName?: string | null;
  } | null;
  arrivals?: Array<{
    id: number;
    InternalmusanedContract?: string | null;
    externalmusanedContract?: string | null;
    Cost?: number | string | null;
    office?: string | null;
  }> | null;
}

interface TransferData {
  id: number;
  HomeMaidId: number;
  NewClientId: number;
  OldClientId: number;
  Cost: string | number | null;
  Paid: string | number | null;
  remainingCost?: string | number | null;
  dailyCost?: string | number | null;
  transferStage: string | null;
  ExperimentDuration?: string | null;
  ExperimentStart?: string | null;
  ExperimentEnd?: string | null;
  ContractDate?: string | null;
  TransferingDate?: string | null;
  TransferOperationNumber?: string | null;
  createdAt: string;
  HomeMaid?: {
    id: number;
    Name?: string;
    Passportnumber?: string;
    Nationality?: string;
    job?: string;
  } | null;
  NewClient?: {
    id: number;
    fullname?: string;
    phonenumber?: string;
    nationalId?: string;
  } | null;
  OldClient?: {
    id: number;
    fullname?: string;
    phonenumber?: string;
    nationalId?: string;
  } | null;
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
  const [transfers, setTransfers] = useState<TransferData[]>([]);
  const [financialStatements, setFinancialStatements] = useState<ClientAccountStatement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFinancial, setIsLoadingFinancial] = useState(false);
  const [editingVisaId, setEditingVisaId] = useState<number | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    visaId: number | null;
  }>({ isOpen: false, visaId: null });
  const [canDeleteFinancial, setCanDeleteFinancial] = useState(false);
  const [deleteStatementModal, setDeleteStatementModal] = useState<{
    isOpen: boolean;
    statement: ClientAccountStatement | null;
  }>({ isOpen: false, statement: null });
  const [isDeletingStatement, setIsDeletingStatement] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalClientInfo, setOriginalClientInfo] = useState<ClientInfo>({
    id: '',
    fullname: '',
    phonenumber: '',
    nationalId: '',
    city: '',
  });
  const [nationalities, setNationalities] = useState<Array<{ value: string; label: string }>>([]);
  const [professions, setProfessions] = useState<Array<{ id: number; name: string; gender?: string | null }>>([]);

  const router = useRouter();

  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/auth/me', { headers });
        if (res.ok) {
          const data = await res.json();
          const userPerms = data.user?.permissions || {};
          setCanDeleteFinancial(userPerms?.['إدارة المحاسبة']?.['حذف'] === true);
        }
      } catch (err) {
        console.error('Error fetching permissions in clientdetails:', err);
      }
    };
    fetchUserPermissions();
  }, []);

  const fetchClientInfo = async () => {
    if (!router.query.id) return;
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clientinfo?id=${router.query.id}`);
      const data = await response.json();
      setClientInfo(data);
      setOriginalClientInfo(data);
      setOrders(data.orders || []);
      setTransfers(data.transfers || []);
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
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`/api/client-accounts?client=${router.query.id}&limit=100`, { headers });
      if (response.ok) {
        const data = await response.json();
        if (data.statements) {
          setFinancialStatements(data.statements);
        }
      }
    } catch (error) {
      console.error('Error fetching financial statements:', error);
    } finally {
      setIsLoadingFinancial(false);
    }
  };

  const handleDeleteStatement = (statement: ClientAccountStatement) => {
    setDeleteStatementModal({ isOpen: true, statement });
  };

  const confirmDeleteStatement = async () => {
    if (!deleteStatementModal.statement) return;
    try {
      setIsDeletingStatement(true);
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/client-accounts/${deleteStatementModal.statement.id}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        setNotification({ message: 'تم حذف كشف الحساب المالي بنجاح وإزالته من سجل العميل', type: 'success' });
        setDeleteStatementModal({ isOpen: false, statement: null });
        fetchFinancialStatements();
      } else {
        const data = await response.json();
        setNotification({ message: data.error || data.message || 'فشل في حذف كشف الحساب المالي', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting financial statement:', error);
      setNotification({ message: 'حدث خطأ أثناء حذف كشف الحساب المالي', type: 'error' });
    } finally {
      setIsDeletingStatement(false);
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

  const fetchProfessions = async () => {
    try {
      const response = await fetch('/api/professions');
      const data = await response.json();
      if (Array.isArray(data)) {
        setProfessions(data);
      }
    } catch (error) {
      console.error('Error fetching professions:', error);
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
    fetchProfessions();
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


  const getTransferStageBadge = (stage: string | null) => {
    const stageName = stage || 'انشاء الطلب';
    let bg = '#eff6ff';
    let text = '#1d4ed8';
    let border = '#bfdbfe';

    if (stageName.includes('نقل') || stageName.includes('تم')) {
      bg = '#ecfdf5';
      text = '#047857';
      border = '#a7f3d0';
    } else if (stageName.includes('تجربة')) {
      bg = '#fffbeb';
      text = '#b45309';
      border = '#fde68a';
    } else if (stageName.includes('عقد')) {
      bg = '#eef2ff';
      text = '#4338ca';
      border = '#c7d2fe';
    }

    return (
      <span
        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
        style={{ backgroundColor: bg, color: text, border: `1px solid ${border}` }}
      >
        {stageName}
      </span>
    );
  };

  // دالة ترجمة حالة الطلب من الإنجليزية إلى العربية
  const translateBookingStatus = (status: string) => {
    const statusTranslations: { [key: string]: string } = {
      'pending': 'قيد الانتظار',
      'office_link_approved': 'موافقة الربط مع إدارة المكاتب',
      'pending_office_link': 'في انتظار الربط مع إدارة المكاتب',
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
          professions={professions}
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
          <div className="flex items-center gap-3 mb-8 w-fit text-right">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              title="العودة للصفحة السابقة"
            >
              <ArrowRight className="w-6 h-6 text-teal-800" />
            </button>
          </div>

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
                  <label className="text-sm text-gray-600 mb-1">رقم العميل &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp; اسم العميل </label>
                   <div className="flex items-center gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      className="w-20 p-2 border border-gray-300 rounded-md text-center font-mono bg-gray-100 cursor-not-allowed font-bold text-teal-800"
                      value={clientInfo.id}
                      readOnly
                    />
                    <input
                      type="text"
                      className={`flex-1 p-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-teal-500 ${
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
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    dir="ltr"
                    className={`p-2 border border-gray-300 rounded-md text-center font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 ${
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
                    type="text"
                    dir="ltr"
                    className={`p-2 border border-gray-300 rounded-md text-center font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      !isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    value={clientInfo.nationalId || ''}
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
                    value={formatSaudiCity(clientInfo.city) || clientInfo.city || ''}
                    onChange={(e) =>
                      setClientInfo({ ...clientInfo, city: e.target.value })
                    }
                    disabled={!isEditMode}
                    required
                  >
                    <option value="">اختر المدينة</option>
                    {clientInfo.city && !ALL_SAUDI_CITIES.includes(formatSaudiCity(clientInfo.city)) && (
                      <option value={clientInfo.city}>
                        {formatSaudiCity(clientInfo.city) || clientInfo.city}
                      </option>
                    )}
                    {ALL_SAUDI_CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
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
                    `/admin/order-form?type=add-available&clientId=${router.query.id}&clientName=${encodeURIComponent(
                      clientInfo.fullname || ''
                    )}&clientPhone=${encodeURIComponent(clientInfo.phonenumber || '')}&clientCity=${encodeURIComponent(
                      clientInfo.city || ''
                    )}`
                  )
                }
              >
                إضافة طلب
              </button>

              {/* طلبات الاستقدام */}
              {orders.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h4 className="font-bold text-teal-800 text-base">طلبات الاستقدام ({orders.length})</h4>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-right border-collapse table-fixed">
                      <thead>
                        <tr className="bg-teal-800 text-white text-center">
                          <th className="p-3 border text-center font-semibold w-[11%]">رقم الطلب</th>
                          <th className="p-3 border text-center font-semibold w-[24%]">العاملة</th>
                          <th className="p-3 border text-center font-semibold w-[14%]">المكتب الخارجي</th>
                          <th className="p-3 border text-center font-semibold w-[14%]">رقم عقد مساند</th>
                          <th className="p-3 border text-center font-semibold w-[11%]">حالة الحجز</th>
                          <th className="p-3 border text-center font-semibold w-[13%]">تكلفة الاستقدام</th>
                          <th className="p-3 border text-center font-semibold w-[13%]">تاريخ الإنشاء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => {
                          const maidId = order.HomeMaid?.id || order.HomemaidId;
                          const maidName = order.HomeMaid?.Name || order.Name || 'عاملة غير محددة';
                          const passport = order.HomeMaid?.Passportnumber || order.Passportnumber;
                          const nationality = order.HomeMaid?.Nationality || order.HomeMaid?.Nationalitycopy || order.Nationalitycopy;
                          const externalOffice = order.HomeMaid?.officeName || order.arrivals?.[0]?.office;
                          const musanedContract = order.arrivals?.[0]?.InternalmusanedContract || order.arrivals?.[0]?.externalmusanedContract || order.contract;
                          const costAmount = order.Total || order.AmountWithoutTax || order.arrivals?.[0]?.Cost;

                          return (
                            <tr key={order.id} className="hover:bg-gray-50 text-center">
                              <td
                                className="p-3 border text-center font-bold text-teal-800 cursor-pointer hover:underline hover:text-teal-900 transition-colors"
                                onClick={() => router.push(`/admin/track_order/${order.id}`)}
                                title="عرض تفاصيل الطلب"
                              >
                                #{order.id}
                              </td>
                              <td className="p-3 border text-center">
                                <div
                                  className="font-semibold text-teal-800 hover:text-teal-900 cursor-pointer hover:underline inline-block transition-colors"
                                  onClick={() => {
                                    if (maidId) router.push(`/admin/homemaidinfo?id=${maidId}`);
                                  }}
                                  title="عرض بروفايل العاملة"
                                >
                                  {maidName}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1.5 flex-wrap" dir="rtl">
                                  {passport && (
                                    <span className="inline-flex items-center gap-1">
                                      <span>جواز:</span>
                                      <span dir="ltr" className="font-mono font-medium text-gray-700">
                                        {passport}
                                      </span>
                                    </span>
                                  )}
                                  {passport && nationality && (
                                    <span className="text-gray-300">|</span>
                                  )}
                                  {nationality && (
                                    <span>{nationality}</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 border text-center text-sm text-gray-800">
                                {externalOffice || '-'}
                              </td>
                              <td className="p-3 border text-center text-sm font-mono text-gray-800" dir="ltr">
                                {musanedContract || '-'}
                              </td>
                              <td className="p-3 border text-center">{translateBookingStatus(order.bookingstatus)}</td>
                              <td className="p-3 border text-center text-gray-800">
                                {costAmount ? (
                                  <>
                                    <span className="font-mono">
                                      {Number(costAmount).toLocaleString('en-US')}
                                    </span>
                                    <span className="text-gray-600 text-xs mr-1"> ريال</span>
                                  </>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="p-3 border text-center text-sm text-gray-700 font-mono" dir="ltr">
                                {(() => {
                                  if (!order.createdAt) return '-';
                                  const dateObj = new Date(order.createdAt);
                                  const y = dateObj.getFullYear();
                                  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                                  const d = String(dateObj.getDate()).padStart(2, '0');
                                  return `${y}/${m}/${d}`;
                                })()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* معاملات نقل الكفالة */}
              {transfers.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h4 className="font-bold text-teal-800 text-base mt-2">معاملات نقل الكفالة ({transfers.length})</h4>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-right border-collapse table-fixed">
                      <thead>
                        <tr className="bg-teal-800 text-white text-center">
                          <th className="p-3 border text-center font-semibold w-[11%]">رقم المعاملة</th>
                          <th className="p-3 border text-center font-semibold w-[24%]">العاملة</th>
                          <th className="p-3 border text-center font-semibold w-[14%]">صفة العميل</th>
                          <th className="p-3 border text-center font-semibold w-[14%]">الطرف الآخر</th>
                          <th className="p-3 border text-center font-semibold w-[11%]">المرحلة</th>
                          <th className="p-3 border text-center font-semibold w-[13%]">تكلفة نقل الكفالة</th>
                          <th className="p-3 border text-center font-semibold w-[13%]">تاريخ نقل الكفالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transfers.map((transfer) => {
                          const isNewSponsor = Number(transfer.NewClientId) === Number(clientInfo.id);
                          return (
                            <tr key={transfer.id} className="hover:bg-gray-50 text-center">
                              <td
                                className="p-3 border text-center font-bold text-teal-800 cursor-pointer hover:underline hover:text-teal-900 transition-colors"
                                onClick={() => router.push(`/admin/AddTransactionForm?id=${transfer.id}&mode=view`)}
                                title="عرض تفاصيل المعاملة"
                              >
                                #{transfer.id}
                              </td>
                              <td className="p-3 border text-center">
                                <div
                                  className="font-semibold text-teal-800 hover:text-teal-900 cursor-pointer hover:underline inline-block transition-colors"
                                  onClick={() => {
                                    const maidId = transfer.HomeMaid?.id || transfer.HomeMaidId;
                                    if (maidId) router.push(`/admin/homemaidinfo?id=${maidId}`);
                                  }}
                                  title="عرض بروفايل العاملة"
                                >
                                  {transfer.HomeMaid?.Name || 'عاملة غير محددة'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1.5 flex-wrap" dir="rtl">
                                  {transfer.HomeMaid?.Passportnumber && (
                                    <span className="inline-flex items-center gap-1">
                                      <span>جواز:</span>
                                      <span dir="ltr" className="font-mono font-medium text-gray-700">
                                        {transfer.HomeMaid.Passportnumber}
                                      </span>
                                    </span>
                                  )}
                                  {transfer.HomeMaid?.Passportnumber && transfer.HomeMaid?.Nationality && (
                                    <span className="text-gray-300">|</span>
                                  )}
                                  {transfer.HomeMaid?.Nationality && (
                                    <span>{transfer.HomeMaid.Nationality}</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 border text-center">
                                {isNewSponsor ? (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    كفيل جديد (مستلم)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                                    كفيل سابق (متنازل)
                                  </span>
                                )}
                              </td>
                              <td className="p-3 border text-center text-sm">
                                {(() => {
                                  const counterParty = isNewSponsor ? transfer.OldClient : transfer.NewClient;
                                  const counterPartyId = isNewSponsor ? (transfer.OldClient?.id || transfer.OldClientId) : (transfer.NewClient?.id || transfer.NewClientId);
                                  const name = counterParty?.fullname || '-';

                                  if (!counterPartyId) return <span className="text-gray-800">{name}</span>;

                                  return (
                                    <span
                                      className="font-medium text-teal-800 hover:text-teal-900 cursor-pointer hover:underline transition-colors inline-block"
                                      onClick={() => router.push(`/admin/clientdetails?id=${counterPartyId}`)}
                                      title="عرض ملف العميل"
                                    >
                                      {name}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="p-3 border text-center">
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                                  {transfer.transferStage || 'قيد المعالجة'}
                                </span>
                              </td>
                              <td className="p-3 border text-center text-gray-800">
                                <span className="font-mono">
                                  {Number(transfer.Cost || 0).toLocaleString('en-US')}
                                </span>
                                <span className="text-gray-600 text-xs mr-1"> ريال</span>
                              </td>
                              <td className="p-3 border text-center text-sm text-gray-700 font-mono" dir="ltr">
                                {(() => {
                                  const dateVal = transfer.TransferingDate || transfer.ContractDate || transfer.createdAt;
                                  if (!dateVal) return '-';
                                  const dateObj = new Date(dateVal);
                                  const y = dateObj.getFullYear();
                                  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                                  const d = String(dateObj.getDate()).padStart(2, '0');
                                  return `${y}/${m}/${d}`;
                                })()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* لا توجد طلبات أو معاملات */}
              {orders.length === 0 && transfers.length === 0 && (
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
                          <td className="p-3 border text-center font-mono">
                            {Number(statement.totalRevenue).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} <span className="text-xs">ريال</span>
                          </td>
                          <td className="p-3 border text-center font-mono">
                            {Number(statement.totalExpenses).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} <span className="text-xs">ريال</span>
                          </td>
                          <td className={`p-3 border text-center font-semibold font-mono ${
                            Number(statement.netAmount) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {Number(statement.netAmount).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} <span className="text-xs">ريال</span>
                          </td>
                          <td className="p-3 border text-center font-mono">
                            {statement.commissionPercentage 
                              ? `${Number(statement.commissionPercentage)}%` 
                              : '-'}
                          </td>
                          <td className="p-3 border text-center">
                            {statement.contractStatus || '-'}
                          </td>
                          <td className="p-3 border text-center text-sm font-mono" dir="ltr">
                            {(() => {
                              const d = new Date(statement.createdAt);
                              const y = d.getFullYear();
                              const m = String(d.getMonth() + 1).padStart(2, '0');
                              const day = String(d.getDate()).padStart(2, '0');
                              return `${y}/${m}/${day}`;
                            })()}
                          </td>
                          <td className="p-3 border">
                            <div className="flex gap-2 justify-center items-center">
                              <button
                                onClick={() => router.push(`/admin/client-accounts/${statement.id}`)}
                                className="text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 font-medium transition-colors px-3 py-1 rounded-lg text-sm border border-teal-200"
                                title="عرض التفاصيل"
                              >
                                عرض التفاصيل
                              </button>
                              {canDeleteFinancial && (
                                <button
                                  onClick={() => handleDeleteStatement(statement)}
                                  className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 font-medium transition-colors px-2.5 py-1 rounded-lg text-sm border border-red-200 flex items-center gap-1 cursor-pointer"
                                  title="حذف كشف الحساب بالكامل"
                                >
                                  <TrashIcon className="w-4 h-4 text-red-600" />
                                  <span>حذف</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {financialStatements.length > 1 && (
                        <tr className="bg-teal-50 font-bold text-center">
                          <td colSpan={2} className="p-3 border text-center">
                            الإجمالي
                          </td>
                          <td className="p-3 border text-center font-mono">
                            {financialStatements.reduce((sum, s) => sum + Number(s.totalRevenue), 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} <span className="text-xs">ريال</span>
                          </td>
                          <td className="p-3 border text-center font-mono">
                            {financialStatements.reduce((sum, s) => sum + Number(s.totalExpenses), 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} <span className="text-xs">ريال</span>
                          </td>
                          <td className={`p-3 border text-center font-mono ${
                            financialStatements.reduce((sum, s) => sum + Number(s.netAmount), 0) >= 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {financialStatements.reduce((sum, s) => sum + Number(s.netAmount), 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} <span className="text-xs">ريال</span>
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

          {/* Statement Delete Confirmation Modal */}
          {deleteStatementModal.isOpen && deleteStatementModal.statement && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] animate-fade-in p-4" dir="rtl">
              <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-[480px] max-w-[95%] relative border border-gray-200">
                <button
                  type="button"
                  onClick={() => setDeleteStatementModal({ isOpen: false, statement: null })}
                  className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  title="إغلاق"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="flex items-center gap-3 text-red-600 mb-4 pb-3 border-b border-gray-100">
                  <div className="p-2.5 bg-red-100 rounded-full">
                    <TrashIcon className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">تأكيد حذف كشف الحساب المالي</h3>
                    <p className="text-xs text-gray-500">سيتم مسح كشف الحساب بالكامل وإزالته من ملف العميل وتوثيق العملية</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl space-y-2 mb-6 text-sm border border-gray-100">
                  <div className="flex justify-between py-1.5 border-b border-gray-200">
                    <span className="text-gray-500">رقم العقد:</span>
                    <span className="font-semibold text-gray-800">{deleteStatementModal.statement.contractNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-200">
                    <span className="text-gray-500">اسم المكتب:</span>
                    <span className="font-semibold text-gray-800">{deleteStatementModal.statement.officeName || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-200">
                    <span className="text-gray-500">الإيرادات:</span>
                    <span className="font-semibold text-gray-800 font-mono">{Number(deleteStatementModal.statement.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ريال</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-200">
                    <span className="text-gray-500">المصروفات:</span>
                    <span className="font-semibold text-gray-800 font-mono">{Number(deleteStatementModal.statement.totalExpenses).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ريال</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500">الصافي:</span>
                    <span className="font-semibold text-gray-800 font-mono">{Number(deleteStatementModal.statement.netAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ريال</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteStatementModal({ isOpen: false, statement: null })}
                    disabled={isDeletingStatement}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-md font-medium transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteStatement}
                    disabled={isDeletingStatement}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-md font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
                    style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                  >
                    {isDeletingStatement ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>جاري الحذف...</span>
                      </>
                    ) : (
                      <>
                        <TrashIcon className="w-5 h-5 text-white" />
                        <span>تأكيد الحذف</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
