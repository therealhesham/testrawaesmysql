import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import {
  Check,
  FileText,
  Home as HomeIcon,
  Eye,
  Trash2,
  Calendar,
  User,
  Users,
  CreditCard,
  Clock,
  Send,
  UploadCloud,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Search,
  Edit,
  X
} from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Layout from 'example/containers/Layout';
import { HOUSING_TRANSFER_WIZARD_STORAGE_KEY } from 'components/TransferTrialWizardModal';
import { formatSaudiCity } from 'lib/cityHelper';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';

interface Client {
  id: number;
  fullname: string;
  phonenumber: string;
  nationalId: string;
  city: string;
  alternativePhone?: string;
  dateofbirth?: string;
}

interface HomeMaid {
  id: number;
  Name: string;
  Nationalitycopy: string;
  Passportnumber: string;
  bookingstatus?: string;
}

interface AddTransactionFormProps {
  transactionId?: number | string | null;
  onBack?: () => void;
  initialMode?: 'view' | 'edit';
  permissions?: {
    canView?: boolean;
    canCreate?: boolean;
    canEdit?: boolean;
  };
}

const DateInputField: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  infoTooltip?: string;
}> = ({ label, value, onChange, name, required, disabled = false, infoTooltip }) => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const formattedVal = value ? value.split('T')[0] : '';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label className="text-sm font-medium text-gray-700 text-right">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {infoTooltip && (
            <div className="relative group flex items-center cursor-help">
              <AlertCircle className="w-4 h-4 text-amber-600 hover:text-amber-700 transition-colors shrink-0" />
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-30 w-72 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl leading-relaxed text-right border border-gray-700">
                <div className="font-bold text-amber-400 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  ملاحظة هامة:
                </div>
                {infoTooltip}
                <div className="absolute top-full right-2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="relative flex items-center">
        <input
          type="text"
          name={name}
          value={formattedVal}
          disabled={disabled}
          placeholder="YYYY-MM-DD"
          dir="ltr"
          onChange={(e) => {
            let v = e.target.value
              .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
              .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48));
            onChange(v);
          }}
          className={`w-full border rounded-xl p-3 pr-10 text-sm text-right outline-none transition-all force-en-num ${
            disabled
              ? 'bg-gray-100/90 border-gray-200 text-gray-700 cursor-not-allowed font-medium'
              : 'bg-gray-50 focus:bg-white border-gray-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 text-gray-800'
          }`}
        />
        {!disabled && (
          <button
            type="button"
            onClick={() => {
              if (dateInputRef.current) {
                if (typeof dateInputRef.current.showPicker === 'function') {
                  dateInputRef.current.showPicker();
                } else {
                  dateInputRef.current.focus();
                }
              }
            }}
            className="absolute left-3 p-1.5 text-gray-400 hover:text-teal-700 transition-colors cursor-pointer"
            title="اختر من التقويم"
          >
            <Calendar className="w-4 h-4" />
          </button>
        )}
        <input
          ref={dateInputRef}
          type="date"
          tabIndex={-1}
          disabled={disabled}
          value={formattedVal}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
      </div>
    </div>
  );
};

export default function AddTransactionForm({
  onBack,
  transactionId: propTransactionId,
  initialMode,
  permissions = { canView: true, canCreate: true, canEdit: true },
}: AddTransactionFormProps) {
  const router = useRouter();
  const transactionId = propTransactionId || router.query.id;
  const isEditMode = Boolean(transactionId);
  const [isViewMode, setIsViewMode] = useState<boolean>(() => {
    // فتح أي معاملة سابقة (يوجد id): الافتراضي دائماً هو وضع العرض فقط ما لم يُطلب التعديل صراحة
    if (initialMode === 'edit' || router.query.mode === 'edit') return false;
    if (initialMode === 'view' || router.query.mode === 'view' || router.query.view === 'true') return true;
    return Boolean(propTransactionId || router.query.id);
  });

  useEffect(() => {
    if (router.isReady) {
      if (initialMode === 'edit' || router.query.mode === 'edit') {
        setIsViewMode(false);
      } else if (initialMode === 'view' || router.query.mode === 'view' || router.query.view === 'true' || router.query.id) {
        setIsViewMode(true);
      }
    }
  }, [router.isReady, router.query.id, router.query.mode, router.query.view, initialMode]);

  // التحقق من الصلاحيات: إذا كان في وضع العرض يحتاج صلاحية عرض، وإذا كان تعديل يحتاج تعديل، وإذا كان إنشاء جديد يحتاج إنشاء
  const isUnauthorized = isViewMode
    ? permissions && permissions.canView === false
    : isEditMode
    ? permissions && permissions.canEdit === false
    : permissions && permissions.canCreate === false;

  if (isUnauthorized) {
    return (
      <Layout>
        <Head>
          <title>غير مصرح بالوصول | معاملات نقل الكفالة</title>
        </Head>
        <div className="min-h-[75vh] flex items-center justify-center p-4 font-sans" dir="rtl">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-100 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600 shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">
                غير مصرح لك بالوصول
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                عذراً، حسابك لا يمتلك صلاحية{' '}
                <span className="font-bold text-red-600">
                  {isViewMode ? '«عرض معاملات نقل الكفالة»' : isEditMode ? '«تعديل معاملات نقل الكفالة»' : '«إنشاء معاملات نقل الكفالة»'}
                </span>{' '}
                اللازمة لإتمام هذا الإجراء. يرجى مراجعة إدارة النظام لتفعيل الصلاحية المطلوبة.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onBack || (() => router.push('/admin/home'))}
                className="w-full py-3 px-6 bg-teal-900 hover:bg-teal-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>العودة</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  /** true لما الصفحة تُفتح من المعالج (wizard) وتكون العاملة محددة مسبقاً */
  const [lockedFromWizard, setLockedFromWizard] = useState(false);
  const [formData, setFormData] = useState({
    HomeMaidId: '',
    HomeMaidName: '',
    Nationality: '',
    PassportNumber: '',
    ResidencyNumber: '',
    EntryDate: '',
    OldClientName: '',
    TransferOperationNumber: '',
    ExperimentDuration: '',
    OldClientPhone: '',
    OldClientId: '',
    OldClientCity: '',
    NewClientName: '',
    NewClientPhone: '',
    NewClientAltPhone: '',
    NewClientId: '',
    NewClientNationalId: '',
    NewClientCity: '',
    NewClientDateOfBirth: '',
    salaryCertificateFile: '',
    nationalAddressFile: '',
    paymentReceiptFile: '',
    promissoryNoteFile: '',
    dailyCost: '',
    ContractDate: '',
    Cost: '',
    Paid: '',
    Remaining: '',
    ExperimentStart: '',
    ExperimentEnd: '',
    Notes: '',
    NationalID: '',
    TransferingDate: '',
    file: '',
    stage: '',
  });

  const [uploadingSalaryCert, setUploadingSalaryCert] = useState(false);
  const [uploadingNationalAddr, setUploadingNationalAddr] = useState(false);
  const [uploadingPaymentReceipt, setUploadingPaymentReceipt] = useState(false);
  const [uploadingPromissoryNote, setUploadingPromissoryNote] = useState(false);
  const [uploadingGeneralFile, setUploadingGeneralFile] = useState(false);
  const [linkedHousedWorkerId, setLinkedHousedWorkerId] = useState<number | null>(null);
  const [existingTransferId, setExistingTransferId] = useState<number | null>(null);
  const [isFromHousingTrial, setIsFromHousingTrial] = useState(false);
  const [trialPaidAmount, setTrialPaidAmount] = useState<number>(0);
  const [trialPaymentReceipt, setTrialPaymentReceipt] = useState<string>('');
  const [currentPaidAmount, setCurrentPaidAmount] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'delete' }>>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'delete' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  const [oldClientSuggestions, setOldClientSuggestions] = useState<Client[]>([]);
  const [newClientSuggestions, setNewClientSuggestions] = useState<Client[]>([]);
  const [homemaidOptions, setHomemaidOptions] = useState<HomeMaid[]>([]);
  const [showOldClientDropdown, setShowOldClientDropdown] = useState(false);
  const [showNewClientDropdown, setShowNewClientDropdown] = useState(false);
  const [isSearchingOldClients, setIsSearchingOldClients] = useState(false);
  const [oldClientSearchTerm, setOldClientSearchTerm] = useState('');
  const [isSearchingNewClients, setIsSearchingNewClients] = useState(false);
  const [newClientSearchTerm, setNewClientSearchTerm] = useState('');
  const [homemaidSuggestions, setHomemaidSuggestions] = useState<HomeMaid[]>([]);
  const [showHomemaidDropdown, setShowHomemaidDropdown] = useState(false);
  const [isSearchingHomemaids, setIsSearchingHomemaids] = useState(false);
  const [homemaidSearchTerm, setHomemaidSearchTerm] = useState('');

  useEffect(() => {
    fetchHomemaids();
    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId]);

  useEffect(() => {
    if (!router.isReady || transactionId) return;
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(HOUSING_TRANSFER_WIZARD_STORAGE_KEY) || sessionStorage.getItem('housingTransferWizardDraft');
      if (!raw) return;
      sessionStorage.removeItem(HOUSING_TRANSFER_WIZARD_STORAGE_KEY);
      sessionStorage.removeItem('housingTransferWizardDraft');
      const d = JSON.parse(raw);
      
      if (d.transactionId) {
        setExistingTransferId(Number(d.transactionId));
      }

      const totalCost = d.cost || d.estimatedCost || d.totalCost || '';
      const parsedPaid = d.paidAmount != null ? parseFloat(d.paidAmount) : (d.Paid != null ? parseFloat(d.Paid) : 0);
      const safeTrialPaid = isNaN(parsedPaid) ? 0 : parsedPaid;
      const totalCostNum = parseFloat(totalCost) || 0;
      const initialRemaining = Math.max(0, totalCostNum - safeTrialPaid);

      const isFromTrial = Boolean(d.sourceAction === 'complete_housing_transfer' || d.trialResult || d.housedWorkerId || d.experimentStart || d.paidAmount != null);
      if (isFromTrial) {
        setIsFromHousingTrial(true);
        setTrialPaidAmount(safeTrialPaid);
        setTrialPaymentReceipt(d.paymentReceiptFile || '');
        setCurrentPaidAmount(initialRemaining > 0 ? String(initialRemaining) : '0');
      }

      const totalPaidFinal = isFromTrial ? (safeTrialPaid + (initialRemaining > 0 ? initialRemaining : 0)).toString() : (d.Paid != null ? String(d.Paid) : String(safeTrialPaid));
      const finalRemainingStr = isFromTrial ? '0' : (d.remainingAmount != null ? String(d.remainingAmount) : String(initialRemaining));

      if (d.housedWorkerId) {
        setLinkedHousedWorkerId(Number(d.housedWorkerId));
      }

      const initialNationalId = d.newClientNationalId || d.newSponsorNationalId || d.newSponsorId || d.nationalId || (d.newClientId && String(d.newClientId).length === 10 ? String(d.newClientId) : '');

      setFormData((prev) => ({
        ...prev,
        HomeMaidId: d.homeMaidId != null ? String(d.homeMaidId) : prev.HomeMaidId,
        HomeMaidName: d.maidName || d.HomeMaidName || prev.HomeMaidName,
        Nationality: d.nationality || d.Nationality || prev.Nationality,
        PassportNumber: d.passportNumber || d.PassportNumber || prev.PassportNumber,
        ResidencyNumber: d.residencyNumber || d.workerResidencyNumber || '',
        EntryDate: d.entryDate || d.EntryDate || prev.EntryDate,
        OldClientId: d.oldClientId != null ? String(d.oldClientId) : prev.OldClientId,
        OldClientName: d.oldClientName || prev.OldClientName,
        OldClientPhone: d.oldClientPhone || prev.OldClientPhone,
        OldClientCity: formatSaudiCity(d.oldClientCity) || prev.OldClientCity,
        NewClientName: d.newClientName || d.trialClientName || prev.NewClientName,
        NewClientId: d.newClientId != null ? String(d.newClientId) : prev.NewClientId,
        NewClientNationalId: initialNationalId || prev.NewClientNationalId,
        NewClientPhone: d.newClientPhone || prev.NewClientPhone,
        NewClientAltPhone: d.newClientAltPhone || prev.NewClientAltPhone,
        NewClientCity: formatSaudiCity(d.newClientCity) || prev.NewClientCity,
        NewClientDateOfBirth: d.newClientDateOfBirth || prev.NewClientDateOfBirth,
        salaryCertificateFile: d.salaryCertificateFile || prev.salaryCertificateFile,
        nationalAddressFile: d.nationalAddressFile || prev.nationalAddressFile,
        paymentReceiptFile: '', // سيتم إرفاق إيصال الدفعة المتبقية إذا لزم الأمر
        promissoryNoteFile: d.promissoryNoteFile || prev.promissoryNoteFile,
        dailyCost: d.dailyCost || prev.dailyCost,
        ContractDate: d.contractDate || d.ContractDate || d.experimentStart || new Date().toISOString().split('T')[0],
        Cost: totalCost || prev.Cost,
        Paid: totalPaidFinal,
        Remaining: finalRemainingStr,
        ExperimentDuration: String(d.experimentDuration || d.experimentDurationSummary || prev.ExperimentDuration || '').replace(/أيام\s*(\d+)/g, '$1 أيام'),
        ExperimentStart: d.experimentStart || prev.ExperimentStart,
        ExperimentEnd: d.experimentEnd || prev.ExperimentEnd,
        Notes: d.notes || d.trialNotes || prev.Notes,
        TransferingDate: d.transferingDate || d.experimentEnd || prev.TransferingDate,
        TransferOperationNumber: d.transferOperationNumber || prev.TransferOperationNumber,
        NationalID: d.residencyNumber || d.workerResidencyNumber || '',
        file: d.file || prev.file,
        stage: 'فترة التجربة',
      }));

      // البحث عن العميل تلقائياً لجلب أي بيانات مسجلة في ملفه
      const searchKey = d.newClientPhone || d.newClientName || initialNationalId;
      if (searchKey) {
        fetch(`/api/clients/suggestions?q=${encodeURIComponent(searchKey)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.suggestions?.length > 0) {
              const matched = data.suggestions.find(
                (c: any) =>
                  (initialNationalId && c.nationalId === initialNationalId) ||
                  (d.newClientPhone && c.phonenumber === d.newClientPhone) ||
                  (d.newClientName && c.fullname === d.newClientName)
              ) || data.suggestions[0];

              if (matched) {
                setFormData((prev) => ({
                  ...prev,
                  NewClientId: matched.id ? String(matched.id) : prev.NewClientId,
                  NewClientNationalId: prev.NewClientNationalId || matched.nationalId || '',
                  NewClientAltPhone: prev.NewClientAltPhone || matched.alternativePhone || '',
                  NewClientDateOfBirth: prev.NewClientDateOfBirth || (matched.dateofbirth ? new Date(matched.dateofbirth).toISOString().split('T')[0] : ''),
                }));
              }
            }
          })
          .catch((err) => console.warn('Could not auto-fetch client profile:', err));
      }

      if (d.oldClientName) setOldClientSearchTerm(d.oldClientName);
      if (d.newClientName || d.trialClientName) setNewClientSearchTerm(d.newClientName || d.trialClientName);
      if (d.maidName) setHomemaidSearchTerm(d.maidName);
      if (d.homeMaidId) {
        setLockedFromWizard(true);
        fetchHomemaidExtraDetails(d.homeMaidId);
      }
    } catch (e) {
      console.error('Error loading transfer draft:', e);
    }
  }, [router.isReady, transactionId]);

  const fetchHomemaidExtraDetails = async (maidId: number | string, forceOverride = false) => {
    if (!maidId) return;
    try {
      const res = await axios.get(`/api/homemaidprisma/${maidId}`);
      if (res.data) {
        const data = res.data;
        const workerResNum = data.workerResidencyNumber || '';
        setFormData((prev) => ({
          ...prev,
          EntryDate: forceOverride ? (data.entryDate || prev.EntryDate) : (prev.EntryDate || data.entryDate || ''),
          ResidencyNumber: forceOverride ? workerResNum : (prev.ResidencyNumber || workerResNum),
          NationalID: forceOverride ? workerResNum : (prev.NationalID || workerResNum),
          ...(data.client ? {
            OldClientName: (forceOverride || !prev.OldClientName) ? (data.client.fullname || prev.OldClientName) : prev.OldClientName,
            OldClientPhone: (forceOverride || !prev.OldClientPhone) ? (data.client.phonenumber || prev.OldClientPhone) : prev.OldClientPhone,
            OldClientId: (forceOverride || !prev.OldClientId) ? (data.client.nationalId || data.client.id?.toString() || prev.OldClientId) : prev.OldClientId,
            OldClientCity: (forceOverride || !prev.OldClientCity) ? (formatSaudiCity(data.client.city) || prev.OldClientCity) : prev.OldClientCity,
          } : {}),
        }));
        if (data.client?.fullname && (forceOverride || !oldClientSearchTerm)) {
          setOldClientSearchTerm(data.client.fullname);
        }
      }
    } catch (e) {
      console.error('Failed to fetch homemaid extra details:', e);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.old-client-search-container')) {
        setShowOldClientDropdown(false);
      }
      if (!target.closest('.new-client-search-container')) {
        setShowNewClientDropdown(false);
      }
      if (!target.closest('.homemaid-search-container')) {
        setShowHomemaidDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchHomemaids = async () => {
    try {
      const response = await axios.get(`/api/getallhomemaids`);
      const homemaids = response.data;
      setHomemaidOptions(homemaids.data || []);
    } catch (error) {
      setError('فشل تحميل قائمة العاملات');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  const fieldLabels: Record<string, string> = {
    paymentReceiptFile: 'إيصال سداد الدفعة',
    promissoryNoteFile: 'سند لأمر بالمتبقي',
    file: 'ملف العقد',
    salaryCertificateFile: 'شهادة تعريف بالراتب',
    nationalAddressFile: 'إثبات العنوان الوطني',
  };

  const uploadAttachment = async (
    file: File,
    fieldName: 'file' | 'salaryCertificateFile' | 'nationalAddressFile' | 'paymentReceiptFile' | 'promissoryNoteFile',
    setUploading: (b: boolean) => void
  ) => {
    const fieldTitle = fieldLabels[fieldName] || 'الملف';
    const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedFileTypes.includes(file.type)) {
      const msg = 'نوع الملف غير مدعوم (PDF، JPEG، PNG، WEBP فقط)';
      setError(msg);
      showToast(msg, 'error');
      return;
    }
    setUploading(true);
    try {
      const hint = `${fieldName}-${formData.HomeMaidId || Date.now()}`;
      let filePath = '';
      try {
        const presignRes = await fetch(`/api/upload-presigned-url/${encodeURIComponent(hint)}?contentType=${encodeURIComponent(file.type)}`);
        if (presignRes.ok) {
          const { url, filePath: p } = await presignRes.json();
          const uploadRes = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type, 'x-amz-acl': 'public-read' },
          });
          if (uploadRes.ok) filePath = p;
        }
      } catch (e) {
        // try fallback
      }
      if (!filePath) {
        const fallbackRes = await fetch(`/api/upload-image-presigned-url/${encodeURIComponent(hint)}`);
        if (!fallbackRes.ok) throw new Error(`فشل في الحصول على رابط رفع ${fieldTitle}`);
        const { url, filePath: p } = await fallbackRes.json();
        const uploadRes = await fetch(url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type, 'x-amz-acl': 'public-read' },
        });
        if (uploadRes.ok) filePath = p;
      }
      if (filePath) {
        setFormData((prev) => ({ ...prev, [fieldName]: filePath }));
        setError(null);
        showToast(`تم إرفاق ${fieldTitle} بنجاح!`, 'success');
      } else {
        throw new Error(`فشل في رفع ${fieldTitle}`);
      }
    } catch (err: any) {
      const errMsg = err.message || `حدث خطأ أثناء رفع ${fieldTitle}`;
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setError('لم يتم اختيار ملف');
      return;
    }
    const file = files[0];
    setSelectedFileName(file.name);

    const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedFileTypes.includes(file.type)) {
      const msg = 'نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)';
      setError(msg);
      showToast(msg, 'error');
      setSelectedFileName('');
      return;
    }

    try {
      const res = await fetch(`/api/upload-image-presigned-url/transfer-${formData.HomeMaidId || Date.now()}`);
      if (!res.ok) throw new Error('فشل في الحصول على رابط الرفع');
      const { url, filePath } = await res.json();

      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type, 'x-amz-acl': 'public-read' },
      });

      if (uploadRes.ok) {
        setFormData((prev) => ({ ...prev, file: filePath }));
        setError(null);
        showToast('تم إرفاق ملف العقد بنجاح!', 'success');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        throw new Error('فشل في رفع ملف العقد');
      }
    } catch (error: any) {
      const errMsg = error.message || 'حدث خطأ أثناء رفع ملف العقد';
      setError(errMsg);
      showToast(errMsg, 'error');
      setSelectedFileName('');
    }
  };

  const handleDeleteFile = async (
    fieldName: 'file' | 'salaryCertificateFile' | 'nationalAddressFile' | 'paymentReceiptFile' | 'promissoryNoteFile',
    labelName: string
  ) => {
    const currentUrl = formData[fieldName];
    setFormData((prev) => ({ ...prev, [fieldName]: '' }));
    if (fieldName === 'file') {
      setSelectedFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    showToast(`تم حذف ${labelName} بنجاح`, 'delete');

    if (currentUrl) {
      try {
        await fetch('/api/delete-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: currentUrl }),
        });
      } catch (delErr) {
        console.warn('Failed to delete file from DigitalOcean Spaces:', delErr);
      }
    }
  };

  const selectHomemaid = (homemaidId: string) => {
    const selectedHomemaid = homemaidOptions?.find((homemaid) => homemaid.id.toString() === homemaidId);
    if (selectedHomemaid) {
      setFormData((prev) => ({
        ...prev,
        HomeMaidId: selectedHomemaid.id.toString() || '',
        HomeMaidName: selectedHomemaid.Name || '',
        Nationality: selectedHomemaid.Nationalitycopy || '',
        PassportNumber: selectedHomemaid.Passportnumber || '',
      }));
      setHomemaidSearchTerm(selectedHomemaid.Name || '');
      fetchHomemaidExtraDetails(selectedHomemaid.id, true);
    } else {
      setFormData((prev) => ({
        ...prev,
        HomeMaidId: '',
        HomeMaidName: '',
        Nationality: '',
        PassportNumber: '',
      }));
      setHomemaidSearchTerm('');
    }
  };

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/transferSponsorShips?id=${transactionId}`);
      const data = response.data;
      setFormData({
        HomeMaidId: data.HomeMaidId?.toString() || '',
        HomeMaidName: data.HomeMaid?.Name || '',
        Nationality: data.HomeMaid?.Nationalitycopy || '',
        PassportNumber: data.HomeMaid?.Passportnumber || '',
        ResidencyNumber: data.NationalID || '',
        EntryDate: data.EntryDate ? new Date(data.EntryDate).toISOString().split('T')[0] : '',
        OldClientName: data.OldClient?.fullname || '',
        OldClientPhone: data.OldClient?.phonenumber || '',
        OldClientId: data.OldClientId?.toString() || '',
        OldClientCity: formatSaudiCity(data.OldClient?.city || data.OldClientCity || ''),
        NewClientName: data.NewClient?.fullname || '',
        NewClientPhone: data.NewClient?.phonenumber || '',
        NewClientId: data.NewClientId?.toString() || '',
        NewClientNationalId: data.NewClient?.nationalId || '',
        NewClientCity: formatSaudiCity(data.NewClient?.city || data.NewClientCity || ''),
        NewClientAltPhone: data.NewClient?.alternativePhone || '',
        NewClientDateOfBirth: data.NewClient?.dateofbirth ? new Date(data.NewClient.dateofbirth).toISOString().split('T')[0] : '',
        salaryCertificateFile: data.salaryCertificateFile || '',
        nationalAddressFile: data.nationalAddressFile || '',
        paymentReceiptFile: data.paymentReceiptFile || '',
        promissoryNoteFile: data.promissoryNoteFile || '',
        dailyCost: data.dailyCost?.toString() || '',
        ContractDate: data.ContractDate ? new Date(data.ContractDate).toISOString().split('T')[0] : '',
        Cost: data.Cost?.toString() || '',
        stage: data.transferStage || '',
        Paid: data.Paid?.toString() || '',
        Remaining: ((data.Cost || 0) - (data.Paid || 0)).toString() || '',
        ExperimentDuration: data.ExperimentDuration || '',
        ExperimentStart: data.ExperimentStart ? new Date(data.ExperimentStart).toISOString().split('T')[0] : '',
        ExperimentEnd: data.ExperimentEnd ? new Date(data.ExperimentEnd).toISOString().split('T')[0] : '',
        Notes: data.Notes || '',
        NationalID: data.NationalID || '',
        TransferOperationNumber: data.TransferOperationNumber || '',
        TransferingDate: data.TransferingDate ? new Date(data.TransferingDate).toISOString().split('T')[0] : '',
        file: data.file || '',
      });
      setOldClientSearchTerm(data.OldClient?.fullname || '');
      setNewClientSearchTerm(data.NewClient?.fullname || '');
      setHomemaidSearchTerm(data.HomeMaid?.Name || '');
      setLoading(false);
    } catch (err) {
      showToast('فشل تحميل بيانات المعاملة', 'error');
      setLoading(false);
    }
  };

  const searchOldClients = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setOldClientSuggestions([]);
      setShowOldClientDropdown(false);
      return;
    }
    setIsSearchingOldClients(true);
    try {
      const response = await fetch(`/api/clients/suggestions?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setOldClientSuggestions(data.suggestions || []);
        setShowOldClientDropdown(true);
      } else {
        setOldClientSuggestions([]);
        setShowOldClientDropdown(false);
      }
    } catch (error) {
      setOldClientSuggestions([]);
      setShowOldClientDropdown(false);
    } finally {
      setIsSearchingOldClients(false);
    }
  };

  const searchNewClients = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setNewClientSuggestions([]);
      setShowNewClientDropdown(false);
      return;
    }
    setIsSearchingNewClients(true);
    try {
      const response = await fetch(`/api/clients/suggestions?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setNewClientSuggestions(data.suggestions || []);
        setShowNewClientDropdown(true);
      } else {
        setNewClientSuggestions([]);
        setShowNewClientDropdown(false);
      }
    } catch (error) {
      setNewClientSuggestions([]);
      setShowNewClientDropdown(false);
    } finally {
      setIsSearchingNewClients(false);
    }
  };

  const searchHomemaids = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setHomemaidSuggestions([]);
      setShowHomemaidDropdown(false);
      return;
    }
    setIsSearchingHomemaids(true);
    try {
      const response = await fetch(`/api/externals/suggestions?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setHomemaidSuggestions(data.suggestions || []);
        setShowHomemaidDropdown(true);
      } else {
        setHomemaidSuggestions([]);
        setShowHomemaidDropdown(false);
      }
    } catch (error) {
      setHomemaidSuggestions([]);
      setShowHomemaidDropdown(false);
    } finally {
      setIsSearchingHomemaids(false);
    }
  };

  const handleOldClientSuggestionClick = (client: Client) => {
    setFormData((prev) => ({
      ...prev,
      OldClientName: client.fullname,
      OldClientPhone: client.phonenumber,
      OldClientId: client.id.toString(),
      OldClientCity: formatSaudiCity(client.city),
    }));
    setOldClientSearchTerm(client.fullname);
    setShowOldClientDropdown(false);
  };

  const handleNewClientSuggestionClick = (client: Client) => {
    setFormData((prev) => ({
      ...prev,
      NewClientName: client.fullname,
      NewClientPhone: client.phonenumber,
      NewClientId: client.id.toString(),
      NewClientNationalId: client.nationalId || '',
      NewClientCity: formatSaudiCity(client.city),
      NewClientAltPhone: client.alternativePhone || '',
      NewClientDateOfBirth: client.dateofbirth ? new Date(client.dateofbirth).toISOString().split('T')[0] : '',
    }));
    setNewClientSearchTerm(client.fullname);
    setShowNewClientDropdown(false);
  };

  const handleHomemaidSuggestionClick = (homemaid: HomeMaid) => {
    if (homemaid.bookingstatus === 'غير لائقة طبيا' || homemaid.bookingstatus === 'غير لائقة طبياً') {
      const confirmMsg = "هذه العاملة فشلت في الفحص الطبي. هل تود المتابعة واختيارها؟";
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }
    setFormData((prev) => ({
      ...prev,
      HomeMaidId: homemaid.id.toString(),
      HomeMaidName: homemaid.Name,
      Nationality: homemaid.Nationalitycopy,
      PassportNumber: homemaid.Passportnumber,
    }));
    setHomemaidSearchTerm(homemaid.Name);
    setShowHomemaidDropdown(false);
    fetchHomemaidExtraDetails(homemaid.id, true);
  };

  const handleOldClientInputBlur = () => {
    setTimeout(() => {
      setShowOldClientDropdown(false);
    }, 200);
  };

  const handleNewClientInputBlur = () => {
    setTimeout(() => {
      setShowNewClientDropdown(false);
    }, 200);
  };

  const handleHomemaidInputBlur = () => {
    setTimeout(() => {
      setShowHomemaidDropdown(false);
    }, 200);
  };

  const handleOldClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOldClientSearchTerm(value);
    setFormData((prev) => ({ ...prev, OldClientName: value }));
    if (value.trim()) {
      searchOldClients(value);
    } else {
      setOldClientSuggestions([]);
      setShowOldClientDropdown(false);
    }
  };

  const handleNewClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewClientSearchTerm(value);
    setFormData((prev) => ({ ...prev, NewClientName: value }));
    if (value.trim()) {
      searchNewClients(value);
    } else {
      setNewClientSuggestions([]);
      setShowNewClientDropdown(false);
    }
  };

  const handleHomemaidSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHomemaidSearchTerm(value);
    setFormData((prev) => ({ ...prev, HomeMaidName: value }));
    if (value.trim()) {
      searchHomemaids(value);
    } else {
      setHomemaidSuggestions([]);
      setShowHomemaidDropdown(false);
    }
  };

  const createNewClient = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/clientssearch', {
        fullname: formData.NewClientName,
        phonenumber: formData.NewClientPhone,
        nationalId: formData.NewClientNationalId,
        city: formData.NewClientCity,
        alternativePhone: formData.NewClientAltPhone,
        dateofbirth: formData.NewClientDateOfBirth,
      });
      const newClient = response.data;
      setFormData((prev) => ({
        ...prev,
        NewClientId: newClient.id.toString(),
        NewClientNationalId: newClient.nationalId || prev.NewClientNationalId,
        NewClientName: newClient.fullname,
        NewClientPhone: newClient.phonenumber,
        NewClientCity: formatSaudiCity(newClient.city),
        NewClientAltPhone: newClient.alternativePhone || prev.NewClientAltPhone,
        NewClientDateOfBirth: newClient.dateofbirth ? new Date(newClient.dateofbirth).toISOString().split('T')[0] : prev.NewClientDateOfBirth,
      }));
      setNewClientSearchTerm(newClient.fullname);
      setNewClientSuggestions([]);
      setShowNewClientDropdown(false);
      showToast('تمت إضافة العميل الجديد بنجاح', 'success');
      setLoading(false);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || err?.message || 'فشل إنشاء عميل جديد';
      showToast(errMsg, 'error');
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    let { value } = e.target;

    // تحويل جميع الأرقام العربية الهندية (٠-٩) إلى أرقام إنجليزية (0-9) فوراً
    value = value
      .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
      .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48));

    // تنظيف الأرقام للهواتف والهويات لتقتصر على الأرقام بطول 10 خانات
    if (['NewClientPhone', 'NewClientAltPhone', 'OldClientPhone', 'NewClientNationalId', 'OldClientId', 'NationalID'].includes(name)) {
      value = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
        ...(name === 'NationalID' ? { ResidencyNumber: value } : {}),
      };
      if (name === 'Cost' || name === 'Paid') {
        const costVal = parseFloat(name === 'Cost' ? value : (prev.Cost || '0')) || 0;
        if (isFromHousingTrial) {
          const paidNowVal = parseFloat(currentPaidAmount) || 0;
          const totalPaid = trialPaidAmount + paidNowVal;
          updated.Paid = totalPaid.toString();
          updated.Remaining = Math.max(0, costVal - totalPaid).toString();
        } else {
          const paidVal = parseFloat(name === 'Paid' ? value : (prev.Paid || '0')) || 0;
          updated.Remaining = Math.max(0, costVal - paidVal).toString();
        }
      }
      return updated;
    });
  };

  const handleCurrentPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value
      .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
      .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
      .replace(/[^\d.]/g, '');
    setCurrentPaidAmount(val);
    const paidNow = parseFloat(val) || 0;
    const totalCost = parseFloat(formData.Cost) || 0;
    const totalPaid = trialPaidAmount + paidNow;
    const rem = Math.max(0, totalCost - totalPaid);
    setFormData((prev) => ({
      ...prev,
      Paid: totalPaid.toString(),
      Remaining: rem.toString(),
    }));
  };

  const determineStage = (data: any) => {
    const stages = [
      'انشاء الطلب',
      'انشاء العقد',
      'فترة التجربة',
      'نقل الخدمات',
    ];
    if (data.NationalID && data.TransferOperationNumber && data.TransferingDate) {
      return stages[3];
    } else if (data.ExperimentDuration && data.ExperimentStart && data.ExperimentEnd) {
      return stages[2];
    } else if (data.ContractDate && data.Cost && data.Paid) {
      return stages[1];
    } else if (data.HomeMaidId && data.OldClientId && data.NewClientId) {
      return stages[0];
    }
    return stages[0];
  };

  const steps = [
    { label: 'انشاء الطلب', icon: FileText },
    { label: 'انشاء العقد', icon: CreditCard },
    { label: 'فترة التجربة', icon: Clock },
    { label: 'نقل الخدمات', icon: Send },
  ];

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const currentStage = determineStage(formData);
      
      const calculatedPaid = isFromHousingTrial
        ? trialPaidAmount + (parseFloat(currentPaidAmount) || 0)
        : (formData.Paid ? parseFloat(formData.Paid) : undefined);

      const calculatedReceipt = isFromHousingTrial
        ? (formData.paymentReceiptFile || trialPaymentReceipt || undefined)
        : (formData.paymentReceiptFile || undefined);

      const totalCostNum = formData.Cost ? parseFloat(formData.Cost) : 0;
      const totalPaidNum = calculatedPaid !== undefined ? calculatedPaid : (formData.Paid ? parseFloat(formData.Paid) : 0);
      const calculatedRemaining = Math.max(0, totalCostNum - totalPaidNum);

      const data = {
        HomeMaidId: formData.HomeMaidId ? parseInt(formData.HomeMaidId) : undefined,
        OldClientId: formData.OldClientId ? parseInt(formData.OldClientId) : undefined,
        NewClientId: formData.NewClientId ? parseInt(formData.NewClientId) : undefined,
        Cost: formData.Cost ? parseFloat(formData.Cost) : undefined,
        Paid: calculatedPaid,
        remainingCost: calculatedRemaining,
        ExperimentStart: formData.ExperimentStart || undefined,
        EntryDate: formData.EntryDate ? new Date(formData.EntryDate) : undefined,
        TransferOperationNumber: formData.TransferOperationNumber || undefined,
        ExperimentDuration: formData.ExperimentDuration || undefined,
        KingdomEntryDate: formData.EntryDate || undefined,
        ExperimentEnd: formData.ExperimentEnd || undefined,
        Notes: formData.Notes || undefined,
        NationalID: formData.NationalID || undefined,
        TransferingDate: formData.TransferingDate || undefined,
        file: formData.file || undefined,
        salaryCertificateFile: formData.salaryCertificateFile || undefined,
        nationalAddressFile: formData.nationalAddressFile || undefined,
        paymentReceiptFile: calculatedReceipt,
        promissoryNoteFile: formData.promissoryNoteFile || undefined,
        dailyCost: formData.dailyCost ? parseFloat(formData.dailyCost) : undefined,
        NewClientAltPhone: formData.NewClientAltPhone || undefined,
        NewClientDateOfBirth: formData.NewClientDateOfBirth || undefined,
        transferStage: currentStage,
        ContractDate: formData.ContractDate || undefined,
      };
      if (!data.HomeMaidId || !data.OldClientId || !data.NewClientId) {
        throw new Error('يرجى ملء جميع الحقول المطلوبة لإنشاء الطلب');
      }
      if (!data.NationalID || !data.NationalID.trim()) {
        throw new Error('يرجى إدخال رقم إقامة العاملة');
      }
      if (data.NationalID.trim().length !== 10) {
        throw new Error('يجب أن يتكون رقم الإقامة من 10 أرقام');
      }
      const targetId = transactionId || existingTransferId;
      if (targetId) {
        await axios.put(`/api/transferSponsorShips?id=${targetId}`, data);
      } else {
        await axios.post('/api/transferSponsorShips', data);
      }

      // إذا كانت المعاملة قادمة من سكن العاملات أو مرتبطة بعاملة سكن
      if (linkedHousedWorkerId || data.HomeMaidId) {
        try {
          await axios.put('/api/housingdeparature', {
            action: 'complete_transfer_sponsorship',
            homeMaid: linkedHousedWorkerId || data.HomeMaidId,
            completionDate: data.TransferingDate || data.ContractDate || new Date().toISOString(),
            notes: data.Notes || `تم إتمام نقل الكفالة برقم عملية ${data.TransferOperationNumber || ''}`,
          });
        } catch (housingErr) {
          console.warn('Could not update housing worker status automatically:', housingErr);
        }
      }

      showToast('تم حفظ معاملة نقل الكفالة بنجاح!', 'success');
      setTimeout(() => {
        if (onBack) onBack();
        else if (isFromHousingTrial) router.push('/admin/housing-departures');
        else router.push('/admin/transfersponsorship');
      }, 1200);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || err?.message || 'حدث خطأ أثناء حفظ المعاملة';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Floating Toast Notification Center - Top Right beside sidebar */}
      <div
        className="fixed top-6 z-[99999] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
        style={{ right: '88px', direction: 'rtl' }}
      >
        {toasts.map((toast) => {
          let bg = '#059669'; // Green success
          let iconBg = '#047857';
          let borderCol = '#10b981';

          if (toast.type === 'delete') {
            bg = '#e11d48'; // Rose/Red delete
            iconBg = '#be123c';
            borderCol = '#fb7185';
          } else if (toast.type === 'error') {
            bg = '#dc2626'; // Red error
            iconBg = '#b91c1c';
            borderCol = '#f87171';
          } else if (toast.type === 'info') {
            bg = '#0D5C63'; // Deep teal info
            iconBg = '#093f44';
            borderCol = '#2dd4bf';
          }

          return (
            <div
              key={toast.id}
              className="pointer-events-auto p-4 rounded-xl border flex items-center justify-between gap-3 transform transition-all duration-300"
              style={{
                backgroundColor: bg,
                color: '#ffffff',
                borderColor: borderCol,
                boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.35)',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                  style={{ backgroundColor: iconBg, borderColor: borderCol }}
                >
                  {toast.type === 'success' && <Check className="w-4 h-4 text-white" />}
                  {toast.type === 'delete' && <Trash2 className="w-4 h-4 text-white" />}
                  {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-white" />}
                  {toast.type === 'info' && <FileText className="w-4 h-4 text-white" />}
                </div>
                <span className="text-sm font-bold leading-snug text-white" style={{ color: '#ffffff' }}>
                  {toast.message}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-white hover:opacity-80 p-1 rounded-lg transition-opacity cursor-pointer shrink-0"
                style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: '#ffffff' }}
                title="إغلاق"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          );
        })}
      </div>

      <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen font-['Tajawal'] text-gray-800 add-transaction-page ${isViewMode ? 'view-only' : ''}`} dir="rtl">
        
        {/* Style block to guarantee all dates and numbers render strictly in English digits 0-9 and consistent format */}
        <style jsx global>{`
          .add-transaction-page input,
          .add-transaction-page select,
          .add-transaction-page textarea,
          .add-transaction-page .en-num-text,
          .add-transaction-page .force-en-num {
            font-variant-numeric: lining-nums tabular-nums !important;
            font-feature-settings: "lnum" 1, "tnum" 1, "locl" 0 !important;
          }

          .add-transaction-page input[type="date"],
          .add-transaction-page input[type="number"],
          .add-transaction-page input[type="tel"],
          .add-transaction-page input.force-en-num,
          .add-transaction-page .force-en-num,
          .add-transaction-page .en-num-text {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, Roboto, sans-serif !important;
            font-feature-settings: "lnum" 1, "tnum" 1, "locl" 0 !important;
            font-variant-numeric: lining-nums tabular-nums !important;
            -webkit-locale: "en-US" !important;
          }

          /* Date inputs formatting in English digits and proper alignment */
          .add-transaction-page input[type="date"] {
            direction: ltr !important;
            text-align: right !important;
          }

          .add-transaction-page input[type="date"]::-webkit-datetime-edit,
          .add-transaction-page input[type="date"]::-webkit-datetime-edit-fields-wrapper,
          .add-transaction-page input[type="date"]::-webkit-datetime-edit-text,
          .add-transaction-page input[type="date"]::-webkit-datetime-edit-minute,
          .add-transaction-page input[type="date"]::-webkit-datetime-edit-hour,
          .add-transaction-page input[type="date"]::-webkit-datetime-edit-ampm,
          .add-transaction-page input[type="date"]::-webkit-datetime-edit-day-field,
          .add-transaction-page input[type="date"]::-webkit-datetime-edit-month-field,
          .add-transaction-page input[type="date"]::-webkit-datetime-edit-year-field {
            -webkit-locale: "en-US" !important;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, Roboto, sans-serif !important;
            font-feature-settings: "lnum" 1, "locl" 0 !important;
            font-variant-numeric: lining-nums tabular-nums !important;
            direction: ltr !important;
          }

          .add-transaction-page input[type="date"]::-webkit-calendar-picker-indicator {
            cursor: pointer;
            opacity: 0.65;
            transition: opacity 0.2s;
          }
          .add-transaction-page input[type="date"]::-webkit-calendar-picker-indicator:hover {
            opacity: 1;
          }

          /* Uniform input heights */
          .add-transaction-page input:not([type="file"]):not([type="checkbox"]):not([type="radio"]),
          .add-transaction-page select {
            min-height: 46px !important;
          }

          /* View-Only Strict Styles */
          .add-transaction-page.view-only input,
          .add-transaction-page.view-only select,
          .add-transaction-page.view-only textarea {
            pointer-events: none !important;
            background-color: #f8fafc !important;
            color: #1e293b !important;
            border-color: #e2e8f0 !important;
            cursor: default !important;
            user-select: text !important;
          }
          .add-transaction-page.view-only input[type="date"]::-webkit-calendar-picker-indicator {
            display: none !important;
            pointer-events: none !important;
          }
          .add-transaction-page.view-only label[for="file-upload"],
          .add-transaction-page.view-only label[for*="file"],
          .add-transaction-page.view-only label[for*="Upload"],
          .add-transaction-page.view-only button:not(.allow-in-view) {
            display: none !important;
          }
        `}</style>

        {/* Top Header Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack || (() => router.back())}
              className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all cursor-pointer shrink-0 shadow-sm group allow-in-view"
              title="رجوع"
            >
              <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
            </button>
            <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-900 shadow-inner shrink-0">
              <ShieldCheck className="w-6 h-6 text-teal-800" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 m-0">
                {transactionId ? `معاملة نقل كفالة #${transactionId}` : 'إضافة معاملة نقل كفالة جديدة'}
              </h1>
              <p className="text-xs text-gray-500 mt-1">توثيق عقد نقل الخدمات، إدارة بيانات الكفلاء، ومتابعة فترة التجربة</p>
            </div>
          </div>
        </div>

        {/* Form Container Cards */}
        <fieldset disabled={isViewMode} className="space-y-8 border-0 p-0 m-0 disabled:opacity-100">
          
          {/* 1. بطاقة معلومات العاملة */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 m-0">معلومات العاملة</h2>
                <p className="text-xs text-gray-500 mt-0.5">البيانات الأساسية للعاملة ورقم الإقامة وتاريخ الوصول</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* اختر العاملة */}
              <div className="flex flex-col gap-1.5 relative homemaid-search-container">
                <label className="text-sm font-medium text-gray-700 text-right">
                  اسم العاملة <span className="text-red-500">*</span>
                </label>
                {lockedFromWizard && formData.HomeMaidId ? (
                  <div className="bg-teal-50/70 border border-teal-300 rounded-xl p-3 flex items-center justify-between gap-2">
                    <span className="text-sm text-teal-950 font-bold text-right truncate">
                      {homemaidSearchTerm || formData.HomeMaidName}
                    </span>
                    {!isFromHousingTrial && (
                      <button
                        type="button"
                        onClick={() => {
                          setLockedFromWizard(false);
                          setHomemaidSearchTerm('');
                          setFormData((prev) => ({
                            ...prev,
                            HomeMaidId: '',
                            HomeMaidName: '',
                            Nationality: '',
                            PassportNumber: '',
                          }));
                        }}
                        className="text-xs text-teal-800 bg-white border border-teal-300 rounded-lg px-2.5 py-1 hover:bg-teal-100 transition-colors font-medium whitespace-nowrap cursor-pointer shadow-2xs"
                      >
                        تغيير
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <input
                        type="text"
                        value={homemaidSearchTerm}
                        onChange={handleHomemaidSearchChange}
                        onBlur={handleHomemaidInputBlur}
                        onFocus={() => homemaidSearchTerm.length >= 1 && setShowHomemaidDropdown(true)}
                        placeholder="ابحث عن العاملة بالاسم..."
                        className="w-full bg-gray-50 focus:bg-white border border-gray-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 rounded-xl p-3 text-sm text-gray-800 text-right outline-none transition-all"
                      />
                      {isSearchingHomemaids && (
                        <div className="absolute left-3 top-3.5">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-700"></div>
                        </div>
                      )}
                    </div>
                    {showHomemaidDropdown && homemaidSuggestions.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                        {homemaidSuggestions.map((homemaid, index) => (
                          <div
                            key={index}
                            onClick={() => handleHomemaidSuggestionClick(homemaid)}
                            className="p-3 hover:bg-teal-50/50 cursor-pointer text-right transition-colors"
                          >
                            <div className="font-bold text-sm text-gray-900">{homemaid.Name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {homemaid.Nationalitycopy} — <span className="en-num-text">{homemaid.Passportnumber}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* الجنسية */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 text-right">الجنسية</label>
                <input
                  type="text"
                  name="Nationality"
                  value={formData.Nationality}
                  placeholder="الجنسية"
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl p-3 text-sm text-gray-600 text-right outline-none cursor-not-allowed"
                  disabled
                />
              </div>

              {/* رقم جواز السفر */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 text-right">رقم جواز السفر</label>
                <input
                  type="text"
                  name="PassportNumber"
                  value={formData.PassportNumber}
                  placeholder="رقم جواز السفر"
                  dir="ltr"
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl p-3 text-sm text-gray-600 text-right outline-none cursor-not-allowed force-en-num"
                  disabled
                />
              </div>

              {/* رقم الإقامة */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 text-right">
                  رقم الإقامة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="NationalID"
                  required
                  maxLength={10}
                  value={formData.NationalID || formData.ResidencyNumber || ''}
                  onChange={(e) => {
                    const val = e.target.value
                      .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
                      .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
                      .replace(/\D/g, '')
                      .slice(0, 10);
                    setFormData((prev) => ({ ...prev, NationalID: val, ResidencyNumber: val }));
                  }}
                  placeholder="ادخل رقم الإقامة (10 أرقام)"
                  dir="ltr"
                  className="w-full bg-white focus:bg-white border-2 border-teal-700/30 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 rounded-xl p-3 text-sm text-gray-900 font-bold text-right outline-none transition-all force-en-num shadow-xs"
                />
              </div>

              {/* تاريخ دخول المملكة */}
              <DateInputField
                label="تاريخ دخول المملكة"
                value={formData?.EntryDate || ''}
                onChange={(val) => setFormData((prev) => ({ ...prev, EntryDate: val }))}
                name="EntryDate"
              />
            </div>
          </section>

          {/* 2. بطاقة معلومات الكفيل الحالي (المتنازل) */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 m-0">معلومات الكفيل الحالي (المتنازل)</h2>
                <p className="text-xs text-gray-500 mt-0.5">بيانات العميل المستقدم أو الكفيل السابق للعاملة</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* اسم العميل الحالي */}
              <div className="flex flex-col gap-1.5 relative old-client-search-container md:col-span-2 lg:col-span-1">
                <label className="text-sm font-medium text-gray-700 text-right">اسم الكفيل الحالي</label>
                <div className="relative">
                  <input
                    type="text"
                    value={oldClientSearchTerm}
                    onChange={handleOldClientSearchChange}
                    onBlur={handleOldClientInputBlur}
                    onFocus={() => oldClientSearchTerm.length >= 1 && setShowOldClientDropdown(true)}
                    placeholder="ابحث بالاسم أو الهاتف..."
                    className="w-full bg-gray-50 focus:bg-white border border-gray-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 rounded-xl p-3 text-sm text-gray-800 text-right outline-none transition-all"
                  />
                  {isSearchingOldClients && (
                    <div className="absolute left-3 top-3.5">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-700"></div>
                    </div>
                  )}
                </div>
                {showOldClientDropdown && oldClientSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                    {oldClientSuggestions.map((client, index) => (
                      <div
                        key={index}
                        onClick={() => handleOldClientSuggestionClick(client)}
                        className="p-3 hover:bg-teal-50/50 cursor-pointer text-right transition-colors"
                      >
                        <div className="font-bold text-sm text-gray-900">{client.fullname}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          <span className="en-num-text">{client.phonenumber}</span> — {formatSaudiCity(client.city)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* رقم الهاتف */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 text-right">رقم الهاتف</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  name="OldClientPhone"
                  value={formData.OldClientPhone}
                  onChange={handleInputChange}
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                  className="w-full bg-gray-50 focus:bg-white border border-gray-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 rounded-xl p-3 text-sm text-gray-800 text-right outline-none transition-all force-en-num"
                />
              </div>

              {/* رقم الهوية */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 text-right">رقم الهوية</label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="OldClientId"
                  value={formData.OldClientId}
                  onChange={handleInputChange}
                  placeholder="رقم هوية الكفيل"
                  dir="ltr"
                  className="w-full bg-gray-50 focus:bg-white border border-gray-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 rounded-xl p-3 text-sm text-gray-800 text-right outline-none transition-all force-en-num"
                />
              </div>

              {/* المدينة */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 text-right">المدينة</label>
                <input
                  type="text"
                  name="OldClientCity"
                  value={formData.OldClientCity}
                  onChange={handleInputChange}
                  placeholder="المدينة"
                  className="w-full bg-gray-50 focus:bg-white border border-gray-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 rounded-xl p-3 text-sm text-gray-800 text-right outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* 3. بطاقة معلومات الكفيل الجديد والمستندات */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 m-0">معلومات الكفيل الجديد والمرفقات</h2>
                  <p className="text-xs text-gray-500 mt-0.5">بيانات الطرف المستلم والمستندات الثبوتية والتعريف بالراتب</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* اسم الكفيل الجديد */}
              <div className="flex flex-col gap-1.5 relative new-client-search-container">
                <label className="text-sm font-medium text-gray-700 text-right">
                  اسم الكفيل الجديد <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newClientSearchTerm}
                    onChange={handleNewClientSearchChange}
                    onBlur={handleNewClientInputBlur}
                    onFocus={() => newClientSearchTerm.length >= 1 && setShowNewClientDropdown(true)}
                    placeholder="ابحث بالاسم أو رقم الجوال..."
                    className="w-full bg-gray-50 focus:bg-white border border-gray-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 rounded-xl p-3 text-sm text-gray-800 text-right outline-none transition-all"
                  />
                  {isSearchingNewClients && (
                    <div className="absolute left-3 top-3.5">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-700"></div>
                    </div>
                  )}
                </div>
                {showNewClientDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                    {newClientSuggestions.length > 0 ? (
                      newClientSuggestions.map((client, index) => (
                        <div
                          key={index}
                          onClick={() => handleNewClientSuggestionClick(client)}
                          className="p-3 hover:bg-teal-50/50 cursor-pointer text-right transition-colors"
                        >
                          <div className="font-bold text-sm text-gray-900">{client.fullname}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            <span className="en-num-text">{client.phonenumber}</span> — {formatSaudiCity(client.city)}
                          </div>
                        </div>
                      ))
                    ) : newClientSearchTerm ? (
                      <div
                        className="p-3.5 text-xs text-teal-800 font-bold bg-teal-50 hover:bg-teal-100 cursor-pointer text-right transition-colors"
                        onClick={createNewClient}
                      >
                        + إضافة عميل جديد: {newClientSearchTerm}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* رقم الجوال الأساسي */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 text-right">
                  رقم الجوال الأساسي <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  name="NewClientPhone"
                  value={formData.NewClientPhone}
                  onChange={handleInputChange}
                  placeholder="05xxxxxxxx"
                  className="w-full bg-gray-50 focus:bg-white border border-gray-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 rounded-xl p-3 text-sm text-gray-800 text-right outline-none transition-all force-en-num"
                  dir="ltr"
                />
              </div>

              {/* رقم جوال بديل */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 text-right">رقم جوال بديل / إضافي</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  name="NewClientAltPhone"
                  value={formData.NewClientAltPhone}
                  onChange={handleInputChange}
                  placeholder="05xxxxxxxx (اختياري)"
                  className="w-full bg-gray-50 focus:bg-white border border-gray-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 rounded-xl p-3 text-sm text-gray-800 text-right outline-none transition-all force-en-num"
                  dir="ltr"
                />
              </div>

              {/* رقم الهوية الوطنية */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 text-right">رقم الهوية الوطنية / الإقامة للكفيل</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  name="NewClientNationalId"
                  value={formData.NewClientNationalId}
                  onChange={handleInputChange}
                  placeholder="1xxxxxxxxx (10 أرقام)"
                  className="w-full bg-gray-50 focus:bg-white border border-gray-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 rounded-xl p-3 text-sm text-gray-800 text-right outline-none transition-all force-en-num"
                  dir="ltr"
                />
              </div>

              {/* المدينة */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 text-right">مدينة الإقامة / السكن</label>
                <input
                  type="text"
                  name="NewClientCity"
                  value={formData.NewClientCity}
                  onChange={handleInputChange}
                  placeholder="مثال: الرياض، جازان، جدة..."
                  className="w-full bg-gray-50 focus:bg-white border border-gray-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 rounded-xl p-3 text-sm text-gray-800 text-right outline-none transition-all"
                />
              </div>

              {/* تاريخ ميلاد الكفيل */}
              <DateInputField
                label="تاريخ ميلاد الكفيل"
                value={formData.NewClientDateOfBirth || ''}
                onChange={(val) => setFormData((prev) => ({ ...prev, NewClientDateOfBirth: val }))}
                name="NewClientDateOfBirth"
              />
            </div>

            {/* مرفقات ومستندات الكفيل الجديد */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 text-right mb-4">مستندات الكفيل الجديد المرفوعة:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. تعريف بالراتب */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-teal-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-800" />
                      تعريف الراتب / الشهادة البنكية
                    </span>
                    {formData.salaryCertificateFile ? (
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">تم الإرفاق</span>
                    ) : (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">غير مرفق</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xs text-gray-500 truncate">
                        {formData.salaryCertificateFile ? formData.salaryCertificateFile.split('/').pop() : 'PDF أو صورة'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {formData.salaryCertificateFile && (
                        <a
                          href={formData.salaryCertificateFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white border border-teal-300 hover:bg-teal-50 text-teal-900 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm allow-in-view shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          معاينة
                        </a>
                      )}
                      {!isViewMode && (
                        <>
                          <label className="bg-teal-900 hover:bg-teal-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer transition-colors shadow-sm whitespace-nowrap">
                            {uploadingSalaryCert ? 'جاري الرفع...' : formData.salaryCertificateFile ? 'تغيير الملف' : 'رفع الملف'}
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.webp"
                              className="hidden"
                              disabled={uploadingSalaryCert}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) uploadAttachment(f, 'salaryCertificateFile', setUploadingSalaryCert);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          {formData.salaryCertificateFile && (
                            <button
                              type="button"
                              onClick={() => handleDeleteFile('salaryCertificateFile', 'شهادة تعريف بالراتب')}
                              className="text-xs text-red-600 hover:text-red-800 p-1 cursor-pointer shrink-0"
                              title="حذف الملف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. العنوان الوطني */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-teal-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <HomeIcon className="w-4 h-4 text-teal-800" />
                      إثبات العنوان الوطني للكفيل
                    </span>
                    {formData.nationalAddressFile ? (
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">تم الإرفاق</span>
                    ) : (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">غير مرفق</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xs text-gray-500 truncate">
                        {formData.nationalAddressFile ? formData.nationalAddressFile.split('/').pop() : 'PDF أو صورة'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {formData.nationalAddressFile && (
                        <a
                          href={formData.nationalAddressFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white border border-teal-300 hover:bg-teal-50 text-teal-900 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm allow-in-view shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          معاينة
                        </a>
                      )}
                      {!isViewMode && (
                        <>
                          <label className="bg-teal-900 hover:bg-teal-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer transition-colors shadow-sm whitespace-nowrap">
                            {uploadingNationalAddr ? 'جاري الرفع...' : formData.nationalAddressFile ? 'تغيير الملف' : 'رفع الملف'}
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.webp"
                              className="hidden"
                              disabled={uploadingNationalAddr}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) uploadAttachment(f, 'nationalAddressFile', setUploadingNationalAddr);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          {formData.nationalAddressFile && (
                            <button
                              type="button"
                              onClick={() => handleDeleteFile('nationalAddressFile', 'إثبات العنوان الوطني')}
                              className="text-xs text-red-600 hover:text-red-800 p-1 cursor-pointer shrink-0"
                              title="حذف الملف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* 4. بطاقة بيانات فترة التجربة */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 m-0">بيانات فترة التجربة</h2>
                  <p className="text-xs text-gray-500 mt-0.5">مدة التجربة، التكلفة اليومية، وتواريخ البداية والنهاية</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* مدة التجربة */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 text-right">مدة التجربة (بالأيام)</label>
                <input
                  type="text"
                  name="ExperimentDuration"
                  value={formData.ExperimentDuration}
                  onChange={handleInputChange}
                  disabled={isFromHousingTrial}
                  placeholder="مثال: 2 أيام"
                  dir="rtl"
                  className={`w-full border rounded-xl p-3 text-sm text-right outline-none transition-all force-en-num ${
                    isFromHousingTrial
                      ? 'bg-gray-100/90 border-gray-200 text-gray-700 cursor-not-allowed font-medium'
                      : 'bg-gray-50 focus:bg-white border-gray-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 text-gray-800'
                  }`}
                />
              </div>

              {/* التكلفة اليومية */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 text-right">التكلفة اليومية (ر.س/يوم)</label>
                <div className="w-full bg-gray-100/90 border border-gray-200 rounded-xl p-3 text-sm text-right flex items-center justify-between min-h-[46px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-teal-900 text-sm en-num-text">
                      {formData.dailyCost || '0'}
                    </span>
                    <span className="font-bold text-teal-900 text-xs">ر.س</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-normal">يومياً</span>
                </div>
              </div>

              {/* إجمالي تكلفة التجربة */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 text-right">إجمالي تكلفة التجربة (ر.س)</label>
                <div className="w-full bg-gray-100/90 border border-gray-200 rounded-xl p-3 text-sm text-right flex items-center justify-between min-h-[46px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-teal-900 text-sm en-num-text">
                      {((parseFloat(String(formData.ExperimentDuration || '').replace(/[^\d.]/g, '')) || 0) * (parseFloat(formData.dailyCost) || 0)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                    <span className="font-bold text-teal-900 text-xs">ر.س</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-normal">
                    {formData.ExperimentDuration && formData.dailyCost ? 'محسوب' : '0.00'}
                  </span>
                </div>
              </div>

              {/* بداية التجربة */}
              <DateInputField
                label="تاريخ بداية التجربة"
                value={formData.ExperimentStart || ''}
                onChange={(val) => setFormData((prev) => ({ ...prev, ExperimentStart: val }))}
                name="ExperimentStart"
                disabled={isFromHousingTrial}
              />

              {/* نهاية التجربة */}
              <DateInputField
                label="تاريخ نهاية التجربة"
                value={formData.ExperimentEnd || ''}
                onChange={(val) => setFormData((prev) => ({ ...prev, ExperimentEnd: val }))}
                name="ExperimentEnd"
                disabled={isFromHousingTrial}
              />

              {/* ملاحظات التجربة */}
              <div className="flex flex-col gap-1.5 col-span-full">
                <label className="text-sm font-medium text-gray-700 text-right">ملاحظات إضافية على التجربة</label>
                <input
                  type="text"
                  name="Notes"
                  value={formData.Notes}
                  onChange={handleInputChange}
                  disabled={isFromHousingTrial}
                  placeholder={isFromHousingTrial ? 'ملاحظات التجربة المعتمدة' : 'أدخل أي ملاحظات خاصة بالتجربة والاتفاق...'}
                  className={`w-full border rounded-xl p-3 text-sm text-right outline-none transition-all ${
                    isFromHousingTrial
                      ? 'bg-gray-100/90 border-gray-200 text-gray-700 cursor-not-allowed font-medium'
                      : 'bg-gray-50 focus:bg-white border-gray-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 text-gray-800'
                  }`}
                />
              </div>
            </div>
          </section>

          {/* 5. بطاقة تفاصيل المعاملة، المالية ونقل الخدمات النهائي */}
          <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                  5
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 m-0">تفاصيل المعاملة، المالية ونقل الخدمات النهائي</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isFromHousingTrial ? 'تسوية مستحقات نقل الكفالة والدفعات المتبقية وتوثيق إجراءات النقل الرسمية' : 'تحديد التكاليف والمدفوعات، إيصال السداد، وتوثيق إجراءات نقل الكفالة الرسمية'}
                  </p>
                </div>
              </div>
            </div>

            {/* الجزء المالي وتسوية مستحقات نقل الكفالة */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-teal-800" />
                البيانات المالية ومستحقات نقل الكفالة:
              </h3>

              <div className="space-y-5">
                {isFromHousingTrial ? (
                  <>
                    {/* ── 1. بطاقة ملخص الحساب السابق (بيانات معتمدة من مرحلة التجربة) ── */}
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200/80">
                        <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-teal-600 inline-block"></span>
                          ملخص الحساب المعتمد من فترة التجربة:
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* إجمالي تكلفة نقل الكفالة */}
                        <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col justify-between">
                          <span className="text-xs text-gray-500 font-medium">إجمالي تكلفة نقل الكفالة</span>
                          <span className="text-base font-bold text-gray-900 en-num-text mt-1">
                            {parseFloat(formData.Cost || '0').toLocaleString('en-US')} ر.س
                          </span>
                        </div>

                        {/* المسدد في التجربة */}
                        <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 font-medium">المسدد عند التجربة</span>
                            {trialPaymentReceipt && (
                              <a
                                href={trialPaymentReceipt}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-teal-800 hover:text-teal-950 font-bold underline flex items-center gap-0.5"
                                title="معاينة إيصال دفعة التجربة"
                              >
                                <Eye className="w-3 h-3" />
                                الإيصال
                              </a>
                            )}
                          </div>
                          <span className="text-base font-bold text-emerald-800 en-num-text mt-1">
                            {trialPaidAmount.toLocaleString('en-US')} ر.س
                          </span>
                        </div>

                        {/* الرصيد المستحق قبل التسوية الحالية */}
                        <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col justify-between">
                          <span className="text-xs text-gray-500 font-medium">المستحق قبل التسوية الحالية</span>
                          <span className="text-base font-bold text-teal-900 en-num-text mt-1">
                            {Math.max(0, (parseFloat(formData.Cost) || 0) - trialPaidAmount).toLocaleString('en-US')} ر.س
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ── 2. قسم الإجراء المطلوب الآن: تسجيل الدفعة الحالية واحتساب المتبقي النهائي ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                      {/* حقل الإدخال الرئيسي: المبلغ المدفوع الآن */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-teal-950 text-right flex items-center justify-between">
                          <span>المبلغ المسدد الآن لإتمام نقل الكفالة (ر.س) <span className="text-red-500 font-bold">*</span></span>
                          <span className="text-xs font-normal text-teal-700">سجل المبلغ المستلم حالياً</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={currentPaidAmount}
                            onChange={handleCurrentPaidChange}
                            placeholder="0.00"
                            dir="ltr"
                            className="w-full bg-white focus:bg-teal-50/20 border-2 border-teal-700/40 focus:border-teal-700 focus:ring-4 focus:ring-teal-700/15 rounded-xl p-3 text-base text-gray-900 font-black text-right outline-none transition-all force-en-num shadow-sm"
                          />
                        </div>
                      </div>

                      {/* المتبقي النهائي المحسوب تلقائياً */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 text-right">
                          المتبقي النهائي بذمة الكفيل (ر.س)
                        </label>
                        <div className={`w-full border rounded-xl p-3 text-sm text-right flex items-center justify-between min-h-[50px] transition-all ${
                          Math.max(0, (parseFloat(formData.Cost) || 0) - (trialPaidAmount + (parseFloat(currentPaidAmount) || 0))) === 0
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-amber-50/80 border-amber-300 text-amber-950 font-bold'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-black en-num-text">
                              {Math.max(0, (parseFloat(formData.Cost) || 0) - (trialPaidAmount + (parseFloat(currentPaidAmount) || 0))).toLocaleString('en-US')}
                            </span>
                            <span className="text-xs font-bold">ر.س</span>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 ${
                            Math.max(0, (parseFloat(formData.Cost) || 0) - (trialPaidAmount + (parseFloat(currentPaidAmount) || 0))) === 0
                              ? 'bg-emerald-200/80 text-emerald-900'
                              : 'bg-amber-200/80 text-amber-900'
                          }`}>
                            {Math.max(0, (parseFloat(formData.Cost) || 0) - (trialPaidAmount + (parseFloat(currentPaidAmount) || 0))) === 0 ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                مسدد بالكامل (خالص)
                              </>
                            ) : (
                              'متبقي (يلزم سند لأمر)'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* المعاملة العادية (غير قادمة من تجربة) */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700 text-right">
                        إجمالي تكلفة نقل الكفالة (ر.س) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        name="Cost"
                        value={formData.Cost}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        dir="ltr"
                        className="w-full bg-gray-50 focus:bg-white border border-gray-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 rounded-xl p-3 text-sm text-gray-900 font-bold text-right outline-none transition-all force-en-num"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700 text-right">
                        المبلغ المدفوع (ر.س) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        name="Paid"
                        value={formData.Paid}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        dir="ltr"
                        className="w-full bg-gray-50 focus:bg-white border border-gray-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 rounded-xl p-3 text-sm text-gray-900 font-bold text-right outline-none transition-all force-en-num"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700 text-right">المتبقي (ر.س)</label>
                      <div className={`w-full border rounded-xl p-3 text-sm text-right flex items-center justify-between ${
                        Math.max(0, (parseFloat(formData.Cost) || 0) - (parseFloat(formData.Paid) || 0)) === 0
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-gray-50 border-gray-200 text-gray-800'
                      }`}>
                        <span className="font-bold en-num-text">
                          {Math.max(0, (parseFloat(formData.Cost) || 0) - (parseFloat(formData.Paid) || 0))} ر.س
                        </span>
                        <span className="text-xs opacity-75">
                          {Math.max(0, (parseFloat(formData.Cost) || 0) - (parseFloat(formData.Paid) || 0)) === 0 ? 'مسدد بالكامل' : 'مستحق'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

                {/* ── قسم المرفقات ── */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 m-0">
                      <UploadCloud className="w-4 h-4 text-teal-800" />
                      المرفقات
                    </h4>
                    <span className="text-xs text-gray-500">
                      تظهر المرفقات المطلوبة تلقائياً بناءً على الحالة والمبالغ المسددة
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    
                    {/* 1. إيصال دفعة التجربة السابقة (يظهر في العمود الأيمن كمرجع تم إرفاقه مسبقاً) */}
                    {isFromHousingTrial && trialPaidAmount > 0 && trialPaymentReceipt && (
                      <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-2.5 flex items-center justify-between gap-2.5 hover:border-teal-300 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <Check className="w-4 h-4 text-teal-700 shrink-0" />
                          <span className="text-xs sm:text-sm font-bold text-teal-900 truncate">
                            إيصال سداد دفعة التجربة (<span className="en-num-text">{trialPaidAmount}</span> ر.س)
                          </span>
                        </div>
                        <a
                          href={trialPaymentReceipt}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white border border-teal-300 hover:bg-teal-50 text-teal-900 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shrink-0 whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          معاينة الإيصال
                        </a>
                      </div>
                    )}

                    {/* 2. المرفقات المطلوبة حالياً لنقل الكفالة */}
                    {isFromHousingTrial && trialPaidAmount > 0 && trialPaymentReceipt ? (
                      <div className="flex flex-col gap-4">
                        {/* إيصال سداد الدفعة أثناء إتمام نقل الكفالة */}
                        {(isFromHousingTrial ? (parseFloat(currentPaidAmount) || 0) : (parseFloat(formData.Paid) || 0)) > 0 && (
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex items-center justify-between gap-2.5 hover:border-teal-300 transition-colors">
                            <div className="flex items-center gap-2 min-w-0">
                              <CreditCard className="w-4 h-4 text-teal-800 shrink-0" />
                              <div className="flex items-center gap-1.5 min-w-0 truncate">
                                <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                  إيصال سداد دفعة نقل الكفالة (<span className="en-num-text">{(isFromHousingTrial ? (parseFloat(currentPaidAmount) || 0) : (parseFloat(formData.Paid) || 0))}</span> ر.س) <span className="text-red-500 font-bold">*</span>
                                </span>
                                {formData.paymentReceiptFile && (
                                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold shrink-0">تم الإرفاق</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {formData.paymentReceiptFile && (
                                <a
                                  href={formData.paymentReceiptFile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-white border border-teal-300 hover:bg-teal-50 text-teal-900 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm allow-in-view"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  معاينة
                                </a>
                              )}
                              {!isViewMode && (
                                formData.paymentReceiptFile ? (
                                  <>
                                    <label className="bg-teal-900 hover:bg-teal-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm whitespace-nowrap">
                                      {uploadingPaymentReceipt ? 'جاري الرفع...' : 'تغيير'}
                                      <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        className="hidden"
                                        disabled={uploadingPaymentReceipt}
                                        onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          if (f) uploadAttachment(f, 'paymentReceiptFile', setUploadingPaymentReceipt);
                                          e.target.value = '';
                                        }}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteFile('paymentReceiptFile', 'إيصال سداد الدفعة')}
                                      className="text-xs text-red-600 hover:text-red-800 p-1 cursor-pointer"
                                      title="حذف الملف"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <label className="bg-teal-900 hover:bg-teal-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm whitespace-nowrap">
                                    {uploadingPaymentReceipt ? 'جاري الرفع...' : 'رفع إيصال الدفعة'}
                                    <input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                                      className="hidden"
                                      disabled={uploadingPaymentReceipt}
                                      onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) uploadAttachment(f, 'paymentReceiptFile', setUploadingPaymentReceipt);
                                        e.target.value = '';
                                      }}
                                    />
                                  </label>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* سند لأمر بالمبلغ المتبقي (يظهر دائماً تحت إيصال الدفعة في العمود المطلوب) */}
                        {Math.max(0, (parseFloat(formData.Cost) || 0) - ((isFromHousingTrial ? trialPaidAmount : 0) + (isFromHousingTrial ? (parseFloat(currentPaidAmount) || 0) : (parseFloat(formData.Paid) || 0)))) > 0 && (
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex items-center justify-between gap-2.5 hover:border-teal-300 transition-colors">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-teal-800 shrink-0" />
                              <div className="flex items-center gap-1.5 min-w-0 truncate">
                                <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                  سند لأمر بالمتبقي (<span className="en-num-text">{Math.max(0, (parseFloat(formData.Cost) || 0) - ((isFromHousingTrial ? trialPaidAmount : 0) + (isFromHousingTrial ? (parseFloat(currentPaidAmount) || 0) : (parseFloat(formData.Paid) || 0))))}</span> ر.س) <span className="text-red-500 font-bold">*</span>
                                </span>
                                {formData.promissoryNoteFile && (
                                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold shrink-0">تم الإرفاق</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {formData.promissoryNoteFile && (
                                <a
                                  href={formData.promissoryNoteFile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-white border border-teal-300 hover:bg-teal-50 text-teal-900 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm allow-in-view"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  معاينة
                                </a>
                              )}
                              {!isViewMode && (
                                formData.promissoryNoteFile ? (
                                  <>
                                    <label className="bg-teal-900 hover:bg-teal-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm whitespace-nowrap">
                                      {uploadingPromissoryNote ? 'جاري الرفع...' : 'تغيير'}
                                      <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        className="hidden"
                                        disabled={uploadingPromissoryNote}
                                        onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          if (f) uploadAttachment(f, 'promissoryNoteFile', setUploadingPromissoryNote);
                                          e.target.value = '';
                                        }}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteFile('promissoryNoteFile', 'سند لأمر بالمتبقي')}
                                      className="text-xs text-red-600 hover:text-red-800 p-1 cursor-pointer"
                                      title="حذف الملف"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <label className="bg-teal-900 hover:bg-teal-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm whitespace-nowrap">
                                    {uploadingPromissoryNote ? 'جاري الرفع...' : 'رفع سند لأمر'}
                                    <input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                                      className="hidden"
                                      disabled={uploadingPromissoryNote}
                                      onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) uploadAttachment(f, 'promissoryNoteFile', setUploadingPromissoryNote);
                                        e.target.value = '';
                                      }}
                                    />
                                  </label>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* حالة المعاملة العادية */}
                        {(isFromHousingTrial ? (parseFloat(currentPaidAmount) || 0) : (parseFloat(formData.Paid) || 0)) > 0 && (
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex items-center justify-between gap-2.5 hover:border-teal-300 transition-colors">
                            <div className="flex items-center gap-2 min-w-0">
                              <CreditCard className="w-4 h-4 text-teal-800 shrink-0" />
                              <div className="flex items-center gap-1.5 min-w-0 truncate">
                                <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                  إيصال سداد دفعة نقل الكفالة (<span className="en-num-text">{(isFromHousingTrial ? (parseFloat(currentPaidAmount) || 0) : (parseFloat(formData.Paid) || 0))}</span> ر.س) <span className="text-red-500 font-bold">*</span>
                                </span>
                                {formData.paymentReceiptFile && (
                                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold shrink-0">تم الإرفاق</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {formData.paymentReceiptFile && (
                                <a
                                  href={formData.paymentReceiptFile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-white border border-teal-300 hover:bg-teal-50 text-teal-900 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm allow-in-view"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  معاينة
                                </a>
                              )}
                              {!isViewMode && (
                                formData.paymentReceiptFile ? (
                                  <>
                                    <label className="bg-teal-900 hover:bg-teal-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm whitespace-nowrap">
                                      {uploadingPaymentReceipt ? 'جاري الرفع...' : 'تغيير'}
                                      <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        className="hidden"
                                        disabled={uploadingPaymentReceipt}
                                        onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          if (f) uploadAttachment(f, 'paymentReceiptFile', setUploadingPaymentReceipt);
                                          e.target.value = '';
                                        }}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteFile('paymentReceiptFile', 'إيصال سداد الدفعة')}
                                      className="text-xs text-red-600 hover:text-red-800 p-1 cursor-pointer"
                                      title="حذف الملف"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <label className="bg-teal-900 hover:bg-teal-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm whitespace-nowrap">
                                    {uploadingPaymentReceipt ? 'جاري الرفع...' : 'رفع إيصال الدفعة'}
                                    <input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                                      className="hidden"
                                      disabled={uploadingPaymentReceipt}
                                      onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) uploadAttachment(f, 'paymentReceiptFile', setUploadingPaymentReceipt);
                                        e.target.value = '';
                                      }}
                                    />
                                  </label>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {Math.max(0, (parseFloat(formData.Cost) || 0) - ((isFromHousingTrial ? trialPaidAmount : 0) + (isFromHousingTrial ? (parseFloat(currentPaidAmount) || 0) : (parseFloat(formData.Paid) || 0)))) > 0 && (
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex items-center justify-between gap-2.5 hover:border-teal-300 transition-colors">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-teal-800 shrink-0" />
                              <div className="flex items-center gap-1.5 min-w-0 truncate">
                                <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                  سند لأمر بالمتبقي (<span className="en-num-text">{Math.max(0, (parseFloat(formData.Cost) || 0) - ((isFromHousingTrial ? trialPaidAmount : 0) + (isFromHousingTrial ? (parseFloat(currentPaidAmount) || 0) : (parseFloat(formData.Paid) || 0))))}</span> ر.س) <span className="text-red-500 font-bold">*</span>
                                </span>
                                {formData.promissoryNoteFile && (
                                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold shrink-0">تم الإرفاق</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {formData.promissoryNoteFile && (
                                <a
                                  href={formData.promissoryNoteFile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-white border border-teal-300 hover:bg-teal-50 text-teal-900 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm allow-in-view"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  معاينة
                                </a>
                              )}
                              {!isViewMode && (
                                formData.promissoryNoteFile ? (
                                  <>
                                    <label className="bg-teal-900 hover:bg-teal-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm whitespace-nowrap">
                                      {uploadingPromissoryNote ? 'جاري الرفع...' : 'تغيير'}
                                      <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        className="hidden"
                                        disabled={uploadingPromissoryNote}
                                        onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          if (f) uploadAttachment(f, 'promissoryNoteFile', setUploadingPromissoryNote);
                                          e.target.value = '';
                                        }}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteFile('promissoryNoteFile', 'سند لأمر بالمتبقي')}
                                      className="text-xs text-red-600 hover:text-red-800 p-1 cursor-pointer"
                                      title="حذف الملف"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <label className="bg-teal-900 hover:bg-teal-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm whitespace-nowrap">
                                    {uploadingPromissoryNote ? 'جاري الرفع...' : 'رفع سند لأمر'}
                                    <input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                                      className="hidden"
                                      disabled={uploadingPromissoryNote}
                                      onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) uploadAttachment(f, 'promissoryNoteFile', setUploadingPromissoryNote);
                                        e.target.value = '';
                                      }}
                                    />
                                  </label>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* رسالة في حال اكتمال كامل السداد وعدم الحاجة لأي مرفقات مالية */}
                    {(isFromHousingTrial ? (parseFloat(currentPaidAmount) || 0) : (parseFloat(formData.Paid) || 0)) === 0 &&
                     Math.max(0, (parseFloat(formData.Cost) || 0) - ((isFromHousingTrial ? trialPaidAmount : 0) + (isFromHousingTrial ? (parseFloat(currentPaidAmount) || 0) : (parseFloat(formData.Paid) || 0)))) === 0 && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-900 font-bold flex items-center gap-2 md:col-span-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>تم تسوية وسداد كافة المستحقات بالكامل (0.00 ر.س متبقي) — لا يلزم إرفاق أي إيصالات إضافية أو سندات لأمر.</span>
                      </div>
                    )}

                  </div>
                </div>
              </div>

            {/* بيانات العقد */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-800" />
                بيانات العقد:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* رقم العقد */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 text-right">
                    رقم العقد <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    name="TransferOperationNumber"
                    value={formData.TransferOperationNumber}
                    onChange={handleInputChange}
                    placeholder="ادخل رقم العقد"
                    dir="ltr"
                    className="w-full bg-gray-50 focus:bg-white border border-gray-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 rounded-xl p-3 text-sm text-gray-800 text-right outline-none transition-all force-en-num"
                  />
                </div>

                {/* تاريخ العقد */}
                <DateInputField
                  label="تاريخ العقد"
                  required={true}
                  infoTooltip="التاريخ المدون داخل العقد يختلف عن تاريخ إنشاء العقد، والمطلوب هنا هو التاريخ المكتوب بداخل العقد."
                  value={formData.TransferingDate || formData.ContractDate || ''}
                  onChange={(val) => setFormData((prev) => ({ ...prev, TransferingDate: val, ContractDate: val }))}
                  name="TransferingDate"
                />

                {/* ملف العقد */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 text-right">
                    ملف العقد <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex items-center justify-between gap-2 min-h-[46px]">
                    <div className="flex items-center gap-2 min-w-0 truncate">
                      <FileText className="w-4 h-4 text-teal-800 shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-gray-900 truncate" title={formData.file ? (selectedFileName || formData.file.split('/').pop()) : ''}>
                        {formData.file ? (selectedFileName || formData.file.split('/').pop()) : 'ملف العقد (PDF أو صورة)'}
                      </span>
                      {formData.file && (
                        <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold shrink-0">تم الإرفاق</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {formData.file && (
                        <a
                          href={formData.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white border border-teal-300 hover:bg-teal-50 text-teal-900 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm allow-in-view shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          معاينة
                        </a>
                      )}
                      {!isViewMode && (
                        <>
                          <label
                            htmlFor="file-upload"
                            className="bg-teal-900 hover:bg-teal-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm whitespace-nowrap"
                          >
                            {formData.file ? 'تغيير' : 'اختيار ملف'}
                          </label>
                          {formData.file && (
                            <button
                              type="button"
                              onClick={() => handleDeleteFile('file', 'ملف العقد')}
                              className="text-xs text-red-600 hover:text-red-800 p-1 cursor-pointer shrink-0"
                              title="حذف الملف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                      <input
                        id="file-upload"
                        type="file"
                        name="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        ref={fileInputRef}
                        disabled={isViewMode}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </fieldset>

        {/* Bottom Actions Footer Bar */}
        <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              {isViewMode
                ? 'عرض تفاصيل المعاملة وبيانات العقد'
                : 'سيتم حفظ التغييرات وتحديث حالة العاملة تلقائياً في السكن والمغادرات'}
            </span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onBack || (() => router.back())}
              className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-all shadow-sm cursor-pointer w-full sm:w-auto allow-in-view"
            >
              العودة
            </button>
            {!isViewMode && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 bg-teal-900 hover:bg-teal-800 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto allow-in-view"
              >
                <Check className="w-4 h-4" />
                {loading ? 'جاري الحفظ...' : 'حفظ واعتماد المعاملة'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context: any) {
  const { req } = context;
  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};

  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie: string) => {
      const [key, value] = cookie.trim().split('=');
      cookies[key] = decodeURIComponent(value);
    });
  }

  if (!cookies.authToken) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }

  try {
    const token = jwtDecode(cookies.authToken) as any;
    const findUser = await prisma.user.findUnique({
      where: { id: Number(token.id) },
      include: { role: true },
    });

    if (!findUser) {
      return { redirect: { destination: '/admin/login', permanent: false } };
    }

    let rolePermissions = findUser?.role?.permissions as any;
    if (typeof rolePermissions === 'string') {
      try {
        rolePermissions = JSON.parse(rolePermissions);
      } catch {
        rolePermissions = {};
      }
    }

    const canView = rolePermissions?.['معاملات نقل الكفالة']?.['عرض'] === true;
    const canCreate = rolePermissions?.['معاملات نقل الكفالة']?.['إنشاء'] === true || rolePermissions?.['معاملات نقل الكفالة']?.['انشاء'] === true;
    const canEdit = rolePermissions?.['معاملات نقل الكفالة']?.['تعديل'] === true;

    const permissions = {
      canView,
      canCreate,
      canEdit,
    };

    return { props: { permissions } };
  } catch (err) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
}