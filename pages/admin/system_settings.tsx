'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Styles from 'styles/Home.module.css';
import { GetServerSidePropsContext } from 'next';
import { jwtDecode } from 'jwt-decode';
import AddProfessionModal from '../../components/AddProfessionModal';
import prisma from 'lib/prisma';
import { getBookingQuotaWindow } from 'lib/bookingGenderQuota';
import Layout from 'example/containers/Layout';
import OfficeTimelineConfig from '../../components/admin/OfficeTimelineConfig';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Edit, Trash2, Save, X, CheckCircle, XCircle, Eye, EyeOff, Upload, MessageSquare, Pencil, Settings, ChevronRight } from 'lucide-react';
import type { TimelineStage, StageFormState } from 'lib/timelineStage';
import {
  emptyStageForm,
  stageToForm,
  validateStageForm,
  buildTimelineStageFromForm,
  isStageVisibleOnExternalOffice,
  isStageEditableForOffices,
} from 'lib/timelineStage';
import { FaStethoscope } from 'react-icons/fa';
interface UserData {
  id: string;
  jobTitle: string;
  name: string;
  phone: string;
  email: string;
  pictureurl: string;
}

interface CustomTimeline {
  id: number;
  country: string;
  name: string | null;
  stages: TimelineStage[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CountryTimeline {
  country: string;
  hasCustomTimeline: boolean;
  timeline?: CustomTimeline;
  stagesCount: number;
}

// دالة للحصول على أيقونة من الاسم
const getIconComponent = (iconName?: string) => {
  if (!iconName) return <CheckCircle className="w-5 h-5" />;
  
  const iconMap: { [key: string]: JSX.Element } = {
    'Link': <CheckCircle className="w-5 h-5" />,
    'Briefcase': <CheckCircle className="w-5 h-5" />,
    'CheckCircle': <CheckCircle className="w-5 h-5" />,
    'Stethoscope': <FaStethoscope className="w-5 h-5" />,
    'DollarSign': <CheckCircle className="w-5 h-5" />,
    'Flag': <CheckCircle className="w-5 h-5" />,
    'Plane': <CheckCircle className="w-5 h-5" />,
    'MapPin': <CheckCircle className="w-5 h-5" />,
    'Package': <CheckCircle className="w-5 h-5" />,
    'FileText': <CheckCircle className="w-5 h-5" />,
  };
  
  return iconMap[iconName] || <CheckCircle className="w-5 h-5" />;
};

// المراحل الافتراضية
const DEFAULT_STAGES: TimelineStage[] = [
  { label: 'الربط مع إدارة المكاتب', field: 'officeLinkInfo', order: 0, icon: 'Link' },
  { label: 'المكتب الخارجي', field: 'externalOfficeInfo', order: 1, icon: 'Briefcase' },
  { label: 'موافقة المكتب الخارجي', field: 'externalOfficeApproval', order: 2, icon: 'CheckCircle' },
  { label: 'الفحص الطبي', field: 'medicalCheck', order: 3, icon: 'Stethoscope' },
  { label: 'موافقة وزارة العمل الأجنبية', field: 'foreignLaborApproval', order: 4, icon: 'Flag' },
  { label: 'دفع الوكالة', field: 'agencyPayment', order: 5, icon: 'DollarSign' },
  { label: 'موافقة السفارة السعودية', field: 'saudiEmbassyApproval', order: 6, icon: 'Flag' },
  { label: 'إصدار التأشيرة', field: 'visaIssuance', order: 7, icon: 'Plane' },
  { label: 'تصريح السفر', field: 'travelPermit', order: 8, icon: 'Plane' },
  { label: 'الوجهات', field: 'destinations', order: 9, icon: 'MapPin' },
  { label: 'الاستلام', field: 'receipt', order: 10, icon: 'Package' },
  { label: 'رفع المستندات', field: 'documentUpload', order: 11, icon: 'FileText' },
];

interface SortableStageItemProps {
  stage: TimelineStage;
  index: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onToggleExternalVisibility: (index: number) => void;
  isEditing: boolean;
}

function SortableStageItem({
  stage,
  index,
  onEdit,
  onDelete,
  onToggleExternalVisibility,
  isEditing,
}: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `stage-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-all ${
        isDragging ? 'ring-2 ring-teal-500' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-teal-600 transition-colors"
        >
          <GripVertical size={20} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
            <div className="flex items-center gap-2">
              {getIconComponent(stage.icon)}
              <h3 className="text-lg font-semibold text-gray-900">{stage.label}</h3>
            </div>
          </div>
          <p className="text-sm text-gray-600">Field: <span className="font-mono text-teal-700">{stage.field}</span></p>
          <div className="flex flex-wrap gap-2 mt-2">
            {stage.interactionType === 'file' && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                <Upload className="w-3 h-3" /> رفع ملف
              </span>
            )}
            {stage.interactionType === 'question' && (
              <span className="text-xs px-2 py-0.5 rounded bg-violet-50 text-violet-800 border border-violet-200 inline-flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> سؤال ({stage.answerType === 'options' ? 'قائمة' : 'راديو'})
              </span>
            )}
            {isStageEditableForOffices(stage) && (
              <span className="text-xs px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 inline-flex items-center gap-1">
                <Pencil className="w-3 h-3" /> تعديل من المكتب
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => onToggleExternalVisibility(index)}
            className={`p-2 rounded-lg transition-colors ${
              isStageVisibleOnExternalOffice(stage)
                ? 'text-teal-700 hover:bg-teal-50'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title={
              isStageVisibleOnExternalOffice(stage)
                ? 'ظاهر في واجهة المكتب الخارجي — اضغط للإخفاء'
                : 'مخفي عن المكتب الخارجي — اضغط للإظهار'
            }
          >
            {isStageVisibleOnExternalOffice(stage) ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
          <button
            onClick={() => onEdit(index)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="تعديل"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => onDelete(index)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="حذف"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProfilePermissions {
  canManageTimeline: boolean;
  canManageProfessions: boolean;
  canManageOffices: boolean;
  canEditOffices?: boolean;
  canDeleteOffices?: boolean;
  canManageComplaints: boolean;
}

interface Complaint {
  id: number;
  title: string;
  description: string;
  screenshot: string | null;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
  createdBy: {
    id: number;
    username: string;
    pictureurl: string | null;
    role: {
      name: string;
    } | null;
  };
  assignedTo: {
    id: number;
    username: string;
    pictureurl: string | null;
    role: {
      name: string;
    } | null;
  } | null;
}

export default function SystemSettings({ id, permissions }: { id: number, permissions: ProfilePermissions }) {
  const router = useRouter();
  const [formData, setFormData] = useState<UserData>({
    id: '',
    jobTitle: '',
    name: '',
    phone: '',
    email: '',
    pictureurl: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [hasPassword, setHasPassword] = useState<boolean>(true); // assume true until fetched

  const [professions, setProfessions] = useState<Array<{ id: number; name: string; gender: string | null }>>([]);
  const [fileName, setFileName] = useState('ارفاق ملف');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfession, setEditingProfession] = useState<{ id: number; name: string; gender?: string | null } | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<UserData>({
    id: '',
    jobTitle: '',
    name: '',
    phone: '',
    email: '',
    pictureurl: '',
  });
  
  // Set default active tab based on permissions
  const getDefaultTab = () => {
    return permissions.canManageProfessions ? 'professions' : permissions.canManageOffices ? 'offices' : 'timeline'; // Default to first available
  };
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  const hasAnyPermission = permissions.canManageProfessions || permissions.canManageOffices || permissions.canManageTimeline;

  const [selectedExternalOffice, setSelectedExternalOffice] = useState<any>(null);
  const [officeActiveTab, setOfficeActiveTab] = useState<'timeline' | 'financial'>('timeline');
  const [financialForm, setFinancialForm] = useState({ commission: '' });
  
  // Complaints state
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    title: '',
    description: '',
    screenshot: ''
  });
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [complaintStats, setComplaintStats] = useState<any>({});
  /** حد أقصى لنسبة طلبات الذكور/الإناث خلال نافذة الحجز (من 8 إلى 7 الشهر التالي) */
  const [quotaMale, setQuotaMale] = useState('');
  const [quotaFemale, setQuotaFemale] = useState('');
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [quotaSaving, setQuotaSaving] = useState(false);
  // SLA offices state
  const [offices, setOffices] = useState<any[]>([]);
  const [slaRules, setSlaRules] = useState<any[]>([]);
  const [isSlaModalOpen, setIsSlaModalOpen] = useState(false);
  const [slaForm, setSlaForm] = useState<{ officeName: string; stage: string; days: string }>({ officeName: '', stage: '', days: '' });
  
  // Office management states
  const [isOfficeModalOpen, setIsOfficeModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<{ id?: number, name: string, country: string, phoneNumber: string } | null>(null);
  const [isSubmittingOffice, setIsSubmittingOffice] = useState(false);  
  // Custom Timeline states
  const [customTimelines, setCustomTimelines] = useState<CustomTimeline[]>([]);
  const [countryTimelines, setCountryTimelines] = useState<CountryTimeline[]>([]);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [editingTimeline, setEditingTimeline] = useState<CustomTimeline | null>(null);
  const [timelineStages, setTimelineStages] = useState<TimelineStage[]>([]);
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);
  const [stageForm, setStageForm] = useState<StageFormState>(emptyStageForm());
  const [saving, setSaving] = useState(false);
  const [loadingTimelines, setLoadingTimelines] = useState(false);
  const [viewMode, setViewMode] = useState<'mapping' | 'list'>('mapping');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'deleteStage' | 'deleteTimeline' | 'resetStages' | 'deleteOffice';
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [uniqueCountries, setUniqueCountries] = useState<Array<{ value: string; label: string }>>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const stages = [
    { value: 'medicalCheck', label: 'كشف طبي' },
    { value: 'foreignLaborApproval', label: 'موافقة وزارة العمل الأجنبية' },
    { value: 'saudiEmbassyApproval', label: 'موافقة السفارة السعودية' },
    { value: 'visaIssuance', label: 'إصدار التأشيرة' },
    { value: 'travelPermit', label: 'تصريح السفر' },
  ];

  const fetchOffices = async () => {
    try {
      const res = await fetch('/api/office_list');
      const data = await res.json();
      setOffices(data.finder || []);
    } catch (e) {
      console.error('فشل جلب المكاتب');
    }
  };
  const fetchSlaRules = async () => {
    try {
      const res = await fetch('/api/offices-sla');
      const data = await res.json();
      setSlaRules(data.items || []);
    } catch (e) {
      console.error('فشل جلب SLA');
    }
  };

  const fetchCustomTimelines = async () => {
    setLoadingTimelines(true);
    try {
      const res = await fetch('/api/custom-timeline');
      const data = await res.json();
      setCustomTimelines(data.items || []);
    } catch (e) {
      console.error('فشل جلب custom timelines');
      setError('فشل في جلب البيانات');
    } finally {
      setLoadingTimelines(false);
    }
  };
  
  const fetchUniqueCountries = async () => {
    try {
      const res = await fetch('/api/nationalities');
      const data = await res.json();
      if (data.success && data.nationalities) {
        const countries = data.nationalities.map((nat: any) => ({
          value: nat.Country || nat.value,
          label: nat.Country || nat.label,
        }));
        setUniqueCountries(countries);
      }
    } catch (e) {
      console.error('فشل جلب الدول');
    }
  };

  const buildCountryTimelinesMapping = () => {
    const mapping: CountryTimeline[] = uniqueCountries.map((country) => {
      const customTimeline = customTimelines.find((t) => t.country === country.value);
      return {
        country: country.value,
        hasCustomTimeline: !!customTimeline,
        timeline: customTimeline,
        stagesCount: customTimeline ? customTimeline.stages.length : DEFAULT_STAGES.length,
      };
    });
    setCountryTimelines(mapping);
  };

  // Office Management functions
  const handleOpenAddOfficeModal = (country: string = '') => {
    setEditingOffice({ name: '', country, phoneNumber: '' });
    setIsOfficeModalOpen(true);
  };

  const handleOpenEditOfficeModal = (office: any) => {
    setEditingOffice({ id: office.id, name: office.office, country: office.Country, phoneNumber: office.phoneNumber || '' });
    setIsOfficeModalOpen(true);
  };

  const handleDeleteOffice = (id: number, officeName: string) => {
    setConfirmAction({
      type: 'deleteOffice',
      message: `هل أنت متأكد من حذف مكتب "${officeName}"؟`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/offices/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setSuccess('تم حذف المكتب بنجاح');
            fetchOffices();
          } else {
            setError('فشل في حذف المكتب');
          }
        } catch (e) {
          setError('حدث خطأ');
        } finally {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }
      }
    });
    setShowConfirmModal(true);
  };

  const handleSaveOffice = async () => {
    if (!editingOffice || !editingOffice.name || !editingOffice.country) {
      setError('يرجى تعبئة الحقول المطلوبة');
      return;
    }
    setIsSubmittingOffice(true);
    try {
      const method = editingOffice.id ? 'PUT' : 'POST';
      const url = editingOffice.id ? `/api/offices/${editingOffice.id}` : '/api/offices';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingOffice),
      });
      if (res.ok) {
        setSuccess(editingOffice.id ? 'تم تعديل المكتب بنجاح' : 'تم إضافة المكتب بنجاح');
        setIsOfficeModalOpen(false);
        fetchOffices();
      } else {
        setError('فشل في حفظ المكتب');
      }
    } catch (e) {
      setError('حدث خطأ');
    } finally {
      setIsSubmittingOffice(false);
    }
  };

  // Complaints functions
  const fetchComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const res = await fetch('/api/complaints?myComplaints=true');
      const data = await res.json();
      if (data.success) {
        setComplaints(data.complaints || []);
        setComplaintStats(data.stats || {});
      }
    } catch (e) {
      console.error('فشل جلب الدعم فني');
      setError('فشل في جلب الدعم فني');
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleOpenComplaintModal = () => {
    setComplaintForm({ title: '', description: '', screenshot: '' });
    setIsComplaintModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseComplaintModal = () => {
    setIsComplaintModalOpen(false);
    setComplaintForm({ title: '', description: '', screenshot: '' });
    setError(null);
    setSuccess(null);
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingScreenshot(true);
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('الملف ليس صورة صالحة');
      setUploadingScreenshot(false);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('حجم الصورة أكبر من 10 ميغابايت');
      setUploadingScreenshot(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];

      try {
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64, filename: file.name }),
        });

        const json = await res.json();

        if (res.ok && json.url) {
          setComplaintForm((prev) => ({ ...prev, screenshot: json.url }));
          setSuccess('تم رفع الصورة بنجاح!');
          setTimeout(() => setSuccess(null), 2000);
        } else {
          setError(json.error || 'فشل في رفع الصورة');
        }
      } catch (err) {
        setError('خطأ في الاتصال بالخادم');
      } finally {
        setUploadingScreenshot(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleSubmitComplaint = async () => {
    if (!complaintForm.title.trim() || !complaintForm.description.trim()) {
      setError('العنوان والوصف مطلوبان');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complaintForm),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشل في إرسال الشكوى');
      }

      setSuccess('تم إرسال الشكوى بنجاح! سيتم الرد عليك قريباً');
      await fetchComplaints();
      setTimeout(() => {
        handleCloseComplaintModal();
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'حدث خطأ أثناء إرسال الشكوى');
    } finally {
      setSaving(false);
    }
  };
  

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: 'قيد المعالجة', color: 'bg-blue-100 text-blue-800' },
      resolved: { label: 'تم الحل', color: 'bg-green-100 text-green-800' },
      closed: { label: 'مغلقة', color: 'bg-gray-100 text-gray-800' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  useEffect(() => {
    if (activeTab === 'offices') {
      fetchOffices();
      fetchSlaRules();
      fetchUniqueCountries();
    }
    if (activeTab === 'timeline') {
      fetchCustomTimelines();
      fetchUniqueCountries();
    }
    if (activeTab === 'complaints') {
      fetchComplaints();
    }
    if (activeTab === 'bookingQuotas') {
      void fetchBookingGenderQuotas();
    }
  }, [activeTab]);

  useEffect(() => {
    if (uniqueCountries.length > 0 && customTimelines.length >= 0 && activeTab === 'timeline') {
      buildCountryTimelinesMapping();
    }
  }, [uniqueCountries, customTimelines, activeTab]);

  // جلب المهن
  const fetchProfessions = async () => {
    try {
      const res = await fetch('/api/professions');
      const data = await res.json();
      setProfessions(data);
    } catch (err) {
      console.error('فشل جلب المهن');
    }
  };

  useEffect(() => {
    fetchProfessions();
  }, []);

  const fetchBookingGenderQuotas = async () => {
    setQuotaLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/booking-gender-quotas');
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setQuotaMale(
        data.malePercentage != null && !Number.isNaN(data.malePercentage) ? String(data.malePercentage) : ''
      );
      setQuotaFemale(
        data.femalePercentage != null && !Number.isNaN(data.femalePercentage) ? String(data.femalePercentage) : ''
      );
    } catch {
      setError('تعذر تحميل إعدادات نسب الحجز');
      setTimeout(() => setError(null), 4000);
    } finally {
      setQuotaLoading(false);
    }
  };

  const saveBookingGenderQuotas = async () => {
    setQuotaSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const maleVal = quotaMale.trim() === '' ? null : Number(quotaMale);
      const femaleVal = quotaFemale.trim() === '' ? null : Number(quotaFemale);
      if (maleVal != null && (maleVal < 0 || maleVal > 100)) {
        setError('نسبة الذكور بين 0 و 100 أو اترك الحقل فارغاً لتعطيل الحد');
        return;
      }
      if (femaleVal != null && (femaleVal < 0 || femaleVal > 100)) {
        setError('نسبة الإناث بين 0 و 100 أو اترك الحقل فارغاً لتعطيل الحد');
        return;
      }
      const res = await fetch('/api/admin/booking-gender-quotas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          malePercentage: maleVal,
          femalePercentage: femaleVal,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || 'save failed');
      }
      setSuccess('تم حفظ حدود نسب الحجز');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.message || 'فشل الحفظ');
      setTimeout(() => setError(null), 4000);
    } finally {
      setQuotaSaving(false);
    }
  };

  // جلب بيانات المستخدم
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${id}`);
        const data = await res.json();
        const userData = {
          id: data.id?.toString() || '',
          jobTitle: data.role?.name || '',
          name: data.username || '',
          phone: data.phonenumber || '',
          email: data.email || '',
          pictureurl: data.pictureurl || '',
        };
        setFormData(userData);
        setOriginalFormData(userData);
        setHasPassword(data.hasPassword === true);
      } catch (err) {
        console.error('فشل جلب بيانات المستخدم');
      }
    };
    fetchUser();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // رفع الصورة
  const uploadImageToBackend = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);
    setError(null);
    setSuccess(null);

    // التحقق من الصيغة والحجم
    if (!file.type.startsWith('image/')) {
      setError('الملف ليس صورة صالحة');
      setUploading(false);
      return;
    }
    if (file.size > 32 * 1024 * 1024) {
      setError('حجم الصورة أكبر من 32 ميغابايت');
      setUploading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];

      try {
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64, filename: file.name }),
        });

        const json = await res.json();

        if (res.ok && json.url) {
          setFormData((prev) => ({ ...prev, pictureurl: json.url }));
          setSuccess('تم رفع الصورة بنجاح!');
          setFileName('ارفاق ملف');
        } else {
          setError(json.error || 'فشل في رفع الصورة');
        }
      } catch (err) {
        setError('خطأ في الاتصال بالخادم');
      } finally {
        setUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  // تفعيل وضع التعديل
  const handleStartEdit = () => {
    setIsEditingProfile(true);
    setError(null);
    setSuccess(null);
  };

  // إلغاء التعديل
  const handleCancelEdit = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    setFormData(originalFormData);
    setIsEditingProfile(false);
    setFileName('ارفاق ملف');
    setError(null);
    setSuccess(null);
  };

// حفظ التعديلات
  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    // التحقق: إذا لديه كلمة مرور ويغيرها، يجب إدخال الحالية. إذا لا يملك كلمة مرور (تعيين أول مرة) لا حاجة للحالية.
    if (passwordData.newPassword) {
      if (hasPassword && !passwordData.currentPassword) {
        setError('يرجى إدخال كلمة المرور الحالية لتأكيد التغيير');
        return;
      }
      if (passwordData.newPassword.length < 4) {
        setError('كلمة المرور الجديدة يجب أن تكون 4 أحرف او أرقام على الأقل');
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmNewPassword) {
        setError('تأكيد كلمة المرور الجديدة غير مطابق');
        return;
      }
    }

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.name,
          phonenumber: formData.phone,
          email: formData.email,
          pictureurl: formData.pictureurl,
          ...(passwordData.newPassword ? {
              currentPassword: hasPassword ? passwordData.currentPassword : undefined,
              newPassword: passwordData.newPassword
          } : {})
        }),
      });

      const data = await res.json(); // قراءة الرد دائماً لمعرفة الخطأ

      if (res.ok) {
        setSuccess('تم حفظ التغييرات بنجاح');
        setOriginalFormData(formData);
        if (passwordData.newPassword) setHasPassword(true);
        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        setIsEditingProfile(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'فشل في الحفظ');
      }
    } catch (err) {
        setError('خطأ في الاتصال');
    }
  };

  // Timeline functions
  const handleOpenTimelineModal = (timeline?: CustomTimeline, countryName?: string) => {
    if (timeline) {
      setEditingTimeline(timeline);
      setTimelineStages([...timeline.stages]);
    } else {
      setEditingTimeline({
        id: 0,
        country: countryName || '',
        name: null,
        stages: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setTimelineStages([...DEFAULT_STAGES]);
    }
    setIsTimelineModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleCountryClick = (countryTimeline: CountryTimeline) => {
    if (countryTimeline.hasCustomTimeline && countryTimeline.timeline) {
      handleOpenTimelineModal(countryTimeline.timeline);
    } else {
      handleOpenTimelineModal(undefined, countryTimeline.country);
    }
  };

  const handleCloseTimelineModal = () => {
    setIsTimelineModalOpen(false);
    setEditingTimeline(null);
    setTimelineStages([]);
    setEditingStageIndex(null);
    setShowStageModal(false);
    setStageForm(emptyStageForm());
    setError(null);
    setSuccess(null);
  };

  const handleAddStage = () => {
    setEditingStageIndex(null);
    setStageForm(emptyStageForm());
    setShowStageModal(true);
  };

  const handleEditStage = (index: number) => {
    const stage = timelineStages[index];
    setEditingStageIndex(index);
    setStageForm(stageToForm(stage));
    setShowStageModal(true);
  };

  const handleToggleStageExternalVisibility = (index: number) => {
    setTimelineStages((prev) =>
      prev.map((s, i) =>
        i === index
          ? { ...s, visibleOnExternalOffice: !isStageVisibleOnExternalOffice(s) }
          : s
      )
    );
  };

  const handleSaveStage = () => {
    if (!stageForm.label.trim() || !stageForm.field.trim()) {
      setError('يرجى إدخال جميع الحقول المطلوبة');
      return;
    }

    const v = validateStageForm(stageForm);
    if (v) {
      setError(v);
      return;
    }

    if (editingStageIndex !== null) {
      const updatedStages = [...timelineStages];
      const order = updatedStages[editingStageIndex].order;
      updatedStages[editingStageIndex] = buildTimelineStageFromForm(stageForm, order);
      setTimelineStages(updatedStages);
    } else {
      const newStage = buildTimelineStageFromForm(stageForm, timelineStages.length);
      setTimelineStages([...timelineStages, newStage]);
    }

    setShowStageModal(false);
    setStageForm(emptyStageForm());
    setEditingStageIndex(null);
    setError(null);
  };

  const handleDeleteStage = (index: number) => {
    setConfirmAction({
      type: 'deleteStage',
      message: 'هل أنت متأكد من حذف هذه المرحلة؟',
      onConfirm: () => {
        const updatedStages = timelineStages
          .filter((_, i) => i !== index)
          .map((stage, i) => ({ ...stage, order: i }));
        setTimelineStages(updatedStages);
        setShowConfirmModal(false);
        setConfirmAction(null);
      },
    });
    setShowConfirmModal(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeIndex = parseInt(active.id.toString().split('-')[1]);
      const overIndex = parseInt(over.id.toString().split('-')[1]);

      const newStages = arrayMove(timelineStages, activeIndex, overIndex);
      const reorderedStages = newStages.map((stage, index) => ({
        ...stage,
        order: index,
      }));
      setTimelineStages(reorderedStages);
    }
  };

  const handleSaveTimeline = async () => {
    if (!editingTimeline?.country?.trim()) {
      setError('يرجى إدخال الدولة');
      return;
    }

    if (timelineStages.length === 0) {
      setError('يرجى إضافة مرحلة واحدة على الأقل');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const timelineData = {
        country: editingTimeline.country.trim(),
        name: editingTimeline.name?.trim() || null,
        stages: timelineStages,
        isActive: editingTimeline.isActive !== undefined ? editingTimeline.isActive : true,
      };

      let res;
      if (editingTimeline.id && editingTimeline.id > 0) {
        res = await fetch(`/api/custom-timeline/${editingTimeline.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(timelineData),
        });
      } else {
        res = await fetch('/api/custom-timeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(timelineData),
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'فشل في حفظ البيانات');
      }

      setSuccess(editingTimeline.id && editingTimeline.id > 0 ? 'تم تحديث التايم لاين بنجاح' : 'تم إضافة التايم لاين بنجاح');
      await fetchCustomTimelines();
      setTimeout(() => {
        handleCloseTimelineModal();
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTimeline = async (id: number) => {
    setConfirmAction({
      type: 'deleteTimeline',
      message: 'هل أنت متأكد من حذف هذا التايم لاين؟',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/custom-timeline/${id}`, {
            method: 'DELETE',
          });

          if (!res.ok) throw new Error('فشل في حذف التايم لاين');
          
          setSuccess('تم حذف التايم لاين بنجاح');
          await fetchCustomTimelines();
          setShowConfirmModal(false);
          setConfirmAction(null);
        } catch (error: any) {
          setError(error.message || 'حدث خطأ أثناء حذف التايم لاين');
          setShowConfirmModal(false);
          setConfirmAction(null);
        }
      },
    });
    setShowConfirmModal(true);
  };

  const handleToggleActive = async (timeline: CustomTimeline) => {
    try {
      const res = await fetch(`/api/custom-timeline/${timeline.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...timeline, isActive: !timeline.isActive }),
      });

      if (!res.ok) throw new Error('فشل في تحديث الحالة');
      
      await fetchCustomTimelines();
    } catch (error: any) {
      setError(error.message || 'حدث خطأ أثناء تحديث الحالة');
    }
  };

  const groupedOffices = useMemo(() => {
    const groups = offices.reduce((acc: any, office: any) => {
      const country = office.Country || 'غير محدد';
      if (!acc[country]) {
        acc[country] = [];
      }
      acc[country].push(office);
      return acc;
    }, {});

    // Ensure all existing nationalities have an entry
    uniqueCountries.forEach(c => {
      if (!groups[c.value]) {
        groups[c.value] = [];
      }
    });

    return groups;
  }, [offices, uniqueCountries]);

  return (
    <Layout>
    <div className={`${Styles['tajawal-regular']} min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/30 to-gray-50 p-8`} dir="rtl">
      <main className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-all duration-200"
              title="رجوع"
            >
              <ChevronRight size={28} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg shadow-teal-200">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                إعدادات النظام
              </h1>
              <p className="text-gray-500 mt-2 text-sm">إدارة الإعدادات العامة والمهن والمكاتب والجدول الزمني</p>
            </div>
          </div>
        </div>

        {/* رسائل النجاح أو الخطأ */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-r-4 border-red-500 text-red-800 rounded-lg shadow-sm flex items-center gap-3 animate-in slide-in-from-top">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-r-4 border-green-500 text-green-800 rounded-lg shadow-sm flex items-center gap-3 animate-in slide-in-from-top">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}

        {!hasAnyPermission ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-lg text-center shadow-sm">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-800 mb-2">عفواً، لا تملك الصلاحية</h2>
              <p className="text-red-600 font-semibold">
                ليس لديك أي صلاحيات للوصول إلى إعدادات النظام. يرجى مراجعة مدير النظام إذا كنت تعتقد أن هذا خطأ.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 shadow-md border border-teal-100">
          {permissions.canManageProfessions && (
          <button 
            onClick={() => setActiveTab('professions')}
            className={`flex-1 py-3 px-6 font-semibold text-sm rounded-lg transition-all duration-200 ${
              activeTab === 'professions' 
                ? 'bg-teal-700 text-white shadow-md' 
                : 'text-gray-600 hover:text-teal-700 hover:bg-teal-50'
            }`}
          >
            إدارة المهن
          </button>
          )}
          {permissions.canManageProfessions && (
          <button 
            onClick={() => setActiveTab('bookingQuotas')}
            className={`flex-1 py-3 px-6 font-semibold text-sm rounded-lg transition-all duration-200 ${
              activeTab === 'bookingQuotas' 
                ? 'bg-teal-700 text-white shadow-md' 
                : 'text-gray-600 hover:text-teal-700 hover:bg-teal-50'
            }`}
          >
            حدود نسب الحجز
          </button>
          )}
          {permissions.canManageOffices && (
          <button 
            onClick={() => setActiveTab('offices')}
            className={`flex-1 py-3 px-6 font-semibold text-sm rounded-lg transition-all duration-200 ${
              activeTab === 'offices' 
                ? 'bg-teal-700 text-white shadow-md' 
                : 'text-gray-600 hover:text-teal-700 hover:bg-teal-50'
            }`}
          >
            إدارة المكاتب الخارجية
          </button>
          )}

        </div>
        {/* Complaints Tab */}
        {activeTab === 'complaints' && (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-teal-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-3xl font-bold text-teal-800 mb-2">دعم فني</h3>
                <p className="text-sm text-gray-600">يمكنك إرسال شكوى للدعم الفني وتتبع حالتها</p>
              </div>
              <button
                onClick={handleOpenComplaintModal}
                className="group bg-teal-700 text-white px-6 py-3 rounded-xl hover:bg-teal-800 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm font-semibold transform hover:-translate-y-0.5"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                إرسال شكوى جديدة
              </button>
            </div>

            {/* Statistics */}
            {complaintStats.total > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{complaintStats.total || 0}</div>
                  <div className="text-sm font-medium text-gray-600">إجمالي الدعم فني</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border border-yellow-200 hover:shadow-md transition-shadow">
                  <div className="text-3xl font-bold text-yellow-800 mb-1">{complaintStats.byStatus?.pending || 0}</div>
                  <div className="text-sm font-medium text-yellow-700">قيد الانتظار</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 hover:shadow-md transition-shadow">
                  <div className="text-3xl font-bold text-blue-800 mb-1">{complaintStats.byStatus?.in_progress || 0}</div>
                  <div className="text-sm font-medium text-blue-700">قيد المعالجة</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200 hover:shadow-md transition-shadow">
                  <div className="text-3xl font-bold text-green-800 mb-1">{complaintStats.byStatus?.resolved || 0}</div>
                  <div className="text-sm font-medium text-green-700">تم الحل</div>
                </div>
              </div>
            )}

            {loadingComplaints ? (
              <div className="flex flex-col justify-center items-center py-16">
                <div className="animate-spin rounded-full h-14 w-14 border-4 border-teal-200 border-t-teal-800 mb-4"></div>
                <p className="text-gray-600 text-sm">جاري التحميل...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg font-semibold mb-2">لا توجد دعم فني حتى الآن</p>
                <p className="text-gray-400 text-sm">يمكنك إرسال شكوى جديدة من الزر أعلاه</p>
              </div>
            ) : (
              <div className="space-y-5">
                {complaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-teal-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{complaint.title}</h4>
                          {getStatusBadge(complaint.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{complaint.description}</p>
                        {complaint.screenshot && (
                          <div className="mb-3">
                            <a
                              href={complaint.screenshot}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-teal-700 hover:text-teal-800 underline"
                            >
                              عرض الصورة المرفقة
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>تاريخ الإرسال: {new Date(complaint.createdAt).toLocaleDateString('ar-SA')}</span>
                          {complaint.resolvedAt && (
                            <span>تاريخ الحل: {new Date(complaint.resolvedAt).toLocaleDateString('ar-SA')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {complaint.assignedTo && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2">
                          {complaint.assignedTo.pictureurl ? (
                            <img
                              src={complaint.assignedTo.pictureurl}
                              alt={complaint.assignedTo.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-teal-800 flex items-center justify-center text-white text-sm">
                              {complaint.assignedTo.username.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">مُسند إلى: {complaint.assignedTo.username}</p>
                            <p className="text-xs text-gray-600">{complaint.assignedTo.role?.name}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {complaint.resolutionNotes && (
                      <div className="bg-green-50 rounded-lg p-4 border-r-4 border-green-500">
                        <p className="text-sm font-medium text-green-900 mb-1">ملاحظات الحل:</p>
                        <p className="text-sm text-green-800">{complaint.resolutionNotes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {permissions.canManageProfessions && (
          <>  
        {activeTab === 'bookingQuotas' && (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-teal-100 max-w-2xl">
            <h3 className="text-2xl font-bold text-teal-800 mb-2">حدود نسب الجنس للحجوزات</h3>
            <p className="text-sm text-gray-600 mb-2">
              يُحتسب عدد الطلبات (غير ملغاة ولا مرفوضة) المرتبطة بعاملة لها مهنة بنفس نوع عقد العاملة، خلال الفترة من يوم 8 من الشهر الميلادي إلى يوم 6 من الشهر التالي.
            </p>
            {(() => {
              const w = getBookingQuotaWindow();
              return (
                <p className="text-xs text-teal-900 bg-teal-50 rounded-lg p-3 mb-6">
                  الفترة الحالية للاحتساب: {w.start.toLocaleDateString('ar-EG')} — {w.end.toLocaleDateString('ar-EG')}
                </p>
              );
            })()}
            <p className="text-sm text-gray-700 mb-4">
              أدخل الحد الأقصى المسموح لنسبة طلبات الذكور (0–100). اترك الحقل فارغاً لتعطيل الفحص لطلبات الذكور.
            </p>
            {quotaLoading ? (
              <p className="text-gray-500">جاري التحميل...</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأقصى لنسبة طلبات الذكور (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={quotaMale}
                    onChange={(e) => setQuotaMale(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-right"
                    placeholder="مثال: 40"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void saveBookingGenderQuotas()}
                  disabled={quotaSaving}
                  className="bg-teal-700 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-teal-800 disabled:opacity-50"
                >
                  {quotaSaving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            )}
          </div>
        )}
        {activeTab === 'professions' && (
          <>
            <button 
              onClick={() => {
                setEditingProfession(null);
                setIsModalOpen(true);
              }}
              className="mb-6 bg-teal-700 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-teal-800 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <Plus size={18} />
              إضافة مهنة
            </button>

            {/* جدول المهن */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-teal-100">
              <table className="w-full">
                <thead className="bg-teal-700 text-white">
                  <tr>
                    <th className="px-6 py-5 text-right text-sm font-semibold">#</th>
                    <th className="px-6 py-5 text-right text-sm font-semibold">الجنس</th>
                    <th className="px-6 py-5 text-right text-sm font-semibold">المهنة</th>
                    <th className="px-6 py-5 text-right text-sm font-semibold">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {professions.map((prof, index) => (
                    <tr key={prof.id} className={`hover:bg-teal-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">#{prof.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                        {prof.gender === 'male' ? 'ذكر' : prof.gender === 'female' ? 'أنثى' : 'الكل'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-medium">{prof.name}</td>
                     
                           <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingProfession({ id: prof.id, name: prof.name, gender: prof.gender });
                              setIsModalOpen(true);
                            }}
                            className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium flex items-center gap-1"
                          >
                            <Edit size={14} />
                            تعديل
                          </button>
                          <button 
                            onClick={async () => {
                              if (confirm('هل أنت متأكد من حذف هذه المهنة؟')) {
                                try {
                                  const res = await fetch('/api/professions', {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: prof.id }),
                                  });
                                  if (res.ok) {
                                    fetchProfessions();
                                    setSuccess('تم حذف المهنة بنجاح');
                                    setTimeout(() => setSuccess(null), 3000);
                                  } else {
                                    setError('فشل في حذف المهنة');
                                    setTimeout(() => setError(null), 3000);
                                  }
                                } catch (err) {
                                  setError('حدث خطأ أثناء الحذف');
                                  setTimeout(() => setError(null), 3000);
                                }
                            }
                          }}
                          className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          حذف
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        </>
        )}

        {permissions.canManageOffices && (
          <>

          {activeTab === 'offices' && (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-teal-100">
            {!selectedExternalOffice ? (
              <>
                <div className="mb-8">
                  <h3 className="text-3xl font-bold text-teal-800 mb-2">إدارة المكاتب الخارجية</h3>
                  <p className="text-sm text-gray-600">اختر المكتب للبدء في تخصيص إعداداته</p>
                </div>
                {Object.keys(groupedOffices).length === 0 ? (
                   <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <p className="text-gray-500 font-medium">لا توجد مكاتب خارجية</p>
                   </div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(groupedOffices).map(([country, countryOffices]: [string, any]) => (
                      <div key={country} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <h4 className="text-xl font-bold text-teal-900 mb-4 border-b border-gray-200 pb-2">{country}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {countryOffices.map((office: any) => (
                            <div key={office.id} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition-shadow relative group">
                              <div className="mb-4">
                                <h5 className="font-bold text-gray-800 text-lg">{office.office}</h5>
                              </div>
                              <div className="flex gap-2 w-full mt-2">
                                <button
                                  onClick={() => {
                                    setSelectedExternalOffice(office);
                                    setOfficeActiveTab('timeline');
                                    setFinancialForm({ commission: office.commission?.toString() || '' });
                                  }}
                                  className={`flex justify-center items-center gap-2 bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white py-2 rounded-lg font-medium transition-colors ${
                                    (permissions.canEditOffices || permissions.canDeleteOffices) ? 'w-[70%]' : 'w-full'
                                  }`}
                                >
                                  <Settings size={18} />
                                  إعدادات
                                </button>
                                {(permissions.canEditOffices || permissions.canDeleteOffices) && (
                                  <>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleOpenEditOfficeModal(office); }}
                                      disabled={!permissions.canEditOffices}
                                      className={`w-[15%] flex justify-center items-center py-2 rounded-lg transition-colors ${
                                        permissions.canEditOffices ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      }`}
                                      title="تعديل المكتب"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteOffice(office.id, office.office); }}
                                      disabled={!permissions.canDeleteOffices}
                                      className={`w-[15%] flex justify-center items-center py-2 rounded-lg transition-colors ${
                                        permissions.canDeleteOffices ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      }`}
                                      title="حذف المكتب"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                          <div 
                            onClick={() => handleOpenAddOfficeModal(country !== 'غير محدد' ? country : '')} 
                            className="bg-teal-50/30 rounded-lg p-5 shadow-sm border-2 border-dashed border-teal-300 flex flex-col justify-center items-center hover:shadow-md hover:bg-teal-50 transition-all cursor-pointer min-h-[140px] group"
                          >
                            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                              <Plus className="text-teal-700 w-6 h-6" />
                            </div>
                            <span className="font-semibold text-teal-800 text-sm">إضافة مكتب جديد</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => setSelectedExternalOffice(null)}
                        className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="رجوع للقائمة"
                      >
                        <ChevronRight size={24} />
                      </button>
                      <h3 className="text-2xl font-bold text-teal-800">إعدادات المكتب: {selectedExternalOffice.office}</h3>
                    </div>
                  </div>
                  <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setOfficeActiveTab('timeline')}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${officeActiveTab === 'timeline' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      الخط الزمني والمهل
                    </button>
                    <button
                      onClick={() => setOfficeActiveTab('financial')}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${officeActiveTab === 'financial' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      الإعدادات المالية
                    </button>
                  </div>
                </div>

                {officeActiveTab === 'timeline' && (
                  <OfficeTimelineConfig office={selectedExternalOffice} />
                )}

                {officeActiveTab === 'financial' && (
                  <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 max-w-2xl mx-auto shadow-inner">
                    <h4 className="text-xl font-bold text-teal-900 mb-6 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                      الإعدادات المالية للمكتب
                    </h4>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          عمولة المكتب (دولار $)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            placeholder="مثال: 900"
                            className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-left"
                            value={financialForm.commission}
                            onChange={(e) => setFinancialForm({ ...financialForm, commission: e.target.value })}
                            dir="ltr"
                          />
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 font-bold">
                            $
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-right">أدخل عمولة المكتب كرقم ثابت بالدولار ليتم احتسابها لاحقاً.</p>
                      </div>
                      <div className="pt-6 flex justify-end border-t border-gray-200">
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/offices/financial_settings', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ officeId: selectedExternalOffice.id, commission: financialForm.commission })
                              });
                              if (res.ok) {
                                setSuccess('تم حفظ الإعدادات المالية بنجاح');
                                setTimeout(() => setSuccess(null), 3000);
                                setSelectedExternalOffice({ ...selectedExternalOffice, commission: financialForm.commission });
                              } else {
                                setError('فشل حفظ الإعدادات المالية');
                                setTimeout(() => setError(null), 3000);
                              }
                            } catch (error) {
                              setError('حدث خطأ أثناء الحفظ');
                              setTimeout(() => setError(null), 3000);
                            }
                          }}
                          className="bg-teal-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-teal-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                          <Save size={18} />
                          حفظ التعديلات
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        </>
        )}
        

        {/* Modal for adding/editing professions */}
        <AddProfessionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProfession(null);
          }}
          editingProfession={editingProfession}
          onSuccess={() => {
            fetchProfessions();
            setSuccess(editingProfession ? 'تم تعديل المهنة بنجاح' : 'تم إضافة المهنة بنجاح');
            setTimeout(() => setSuccess(null), 3000);
            setEditingProfession(null);
          }}
        />



        {/* Complaint Modal */}
        {isComplaintModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-11/12 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-hidden flex flex-col">
              <div className="bg-teal-700 p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">إرسال شكوى جديدة</h2>
                  <button
                    onClick={handleCloseComplaintModal}
                    className="text-white hover:bg-teal-800 rounded-lg p-2 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto flex-1">

              <div className="p-6">
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                    عنوان الشكوى <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={complaintForm.title}
                    onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                    placeholder="مثال: مشكلة في تسجيل الدخول"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                    وصف المشكلة <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={complaintForm.description}
                    onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[120px] transition-all resize-none"
                    placeholder="اشرح المشكلة بالتفصيل..."
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                    صورة توضيحية (اختياري)
                  </label>
                  {complaintForm.screenshot && (
                    <div className="mb-3 relative">
                      <img
                        src={complaintForm.screenshot}
                        alt="Screenshot"
                        className="w-full max-h-64 object-contain rounded-xl border-2 border-gray-200"
                      />
                      <button
                        onClick={() => setComplaintForm({ ...complaintForm, screenshot: '' })}
                        className="absolute top-2 left-2 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 transition-colors font-medium shadow-md flex items-center gap-1"
                      >
                        <X size={14} />
                        إزالة
                      </button>
                    </div>
                  )}
                  <label
                    htmlFor="screenshot-upload"
                    className="block w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-xl text-center text-sm text-gray-700 cursor-pointer hover:bg-teal-50 hover:border-teal-400 transition-all"
                  >
                    {uploadingScreenshot ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-600 border-t-transparent"></div>
                        جاري الرفع...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Plus size={16} />
                        اضغط لرفع صورة
                      </span>
                    )}
                  </label>
                  <input
                    id="screenshot-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotUpload}
                    className="hidden"
                    disabled={uploadingScreenshot}
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    يمكنك رفع صورة توضيحية للمشكلة (حد أقصى 10 ميجابايت)
                  </p>
                </div>
              </div>
              </div>
              <div className="p-6 bg-teal-50 border-t border-teal-200 flex justify-end gap-3">
                <button
                  onClick={handleCloseComplaintModal}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSubmitComplaint}
                  disabled={saving || !complaintForm.title.trim() || !complaintForm.description.trim()}
                  className="px-6 py-2.5 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      إرسال الشكوى
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {showConfirmModal && confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-1/2 max-w-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">تأكيد الإجراء</h3>
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setConfirmAction(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <p className="text-lg text-gray-900 font-medium">{confirmAction.message}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmAction.onConfirm}
                  className={`px-6 py-2 rounded-md transition-colors flex items-center gap-2 ${
                    confirmAction.type === 'deleteTimeline' || confirmAction.type === 'deleteStage' || confirmAction.type === 'deleteOffice'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-teal-800 text-white hover:bg-teal-900'
                  }`}
                >
                  {confirmAction.type === 'deleteTimeline' || confirmAction.type === 'deleteStage' || confirmAction.type === 'deleteOffice' ? (
                    <>
                      <Trash2 size={18} />
                      حذف
                    </>
                  ) : (
                    <>
                      <X size={18} />
                      إعادة تعيين
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </main>
    </div>
      {isOfficeModalOpen && editingOffice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingOffice.id ? 'تعديل مكتب' : 'إضافة مكتب جديد'}</h3>
              <button onClick={() => setIsOfficeModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المكتب *</label>
                <input
                  type="text"
                  value={editingOffice.name}
                  onChange={(e) => setEditingOffice({ ...editingOffice, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                  placeholder="أدخل اسم المكتب"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الدولة *</label>
                <select
                  value={editingOffice.country}
                  onChange={(e) => setEditingOffice({ ...editingOffice, country: e.target.value })}
                  disabled={!editingOffice.id && !!editingOffice.country}
                  className={`w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500 ${!editingOffice.id && !!editingOffice.country ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  style={{ backgroundPosition: 'right 0.75rem center', paddingRight: '2.5rem', paddingLeft: '0.75rem' }}
                >
                  <option value="">اختر الدولة</option>
                  {uniqueCountries.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={editingOffice.phoneNumber}
                  onChange={(e) => setEditingOffice({ ...editingOffice, phoneNumber: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                  placeholder="أدخل رقم الهاتف"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsOfficeModalOpen(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isSubmittingOffice}
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveOffice}
                disabled={isSubmittingOffice || !editingOffice.name || !editingOffice.country}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmittingOffice ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    جاري الحفظ...
                  </>
                ) : (
                  'حفظ'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// getServerSideProps (يبقى كما هو)
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { req } = context;
  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};

  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
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
      include: { role: true }
    });

    // Check specific permissions from the role's permissions JSON
    const rolePermissions = findUser?.role?.permissions as any;
    
    const permissions: ProfilePermissions = {
      canManageTimeline: !!rolePermissions?.["إدارة التايم لاين"]?.["تعديل"],
      canManageProfessions: !!rolePermissions?.["إدارة المهن"]?.["تعديل"],
      canManageOffices: !!rolePermissions?.["إدارة المكاتب الخارجية"]?.["عرض"],
      canEditOffices: !!rolePermissions?.["إدارة المكاتب الخارجية"]?.["تعديل"],
      canDeleteOffices: !!rolePermissions?.["إدارة المكاتب الخارجية"]?.["حذف"],
      canManageComplaints: !!rolePermissions?.["إدارة الدعم فني"]?.["حل"],
    };

    return { props: { id: Number(token.id), permissions } };
  } catch (err) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
}