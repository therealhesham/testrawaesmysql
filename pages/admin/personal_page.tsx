'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Styles from 'styles/Home.module.css';
import { GetServerSidePropsContext } from 'next';
import { jwtDecode } from 'jwt-decode';
import AddProfessionModal from '../../components/AddProfessionModal';
import prisma from 'lib/prisma';
import Layout from 'example/containers/Layout';
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
import { GripVertical, Plus, Edit, Trash2, Save, X, CheckCircle, XCircle } from 'lucide-react';
import { FaStethoscope } from 'react-icons/fa';
interface UserData {
  id: string;
  jobTitle: string;
  name: string;
  phone: string;
  email: string;
  pictureurl: string;
}

interface TimelineStage {
  label: string;
  field: string;
  order: number;
  icon?: string;
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
  isEditing: boolean;
}

function SortableStageItem({ stage, index, onEdit, onDelete, isEditing }: SortableStageItemProps) {
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
        </div>
        <div className="flex gap-2">
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

export default function Profile({ id, permissions }: { id: number, permissions: ProfilePermissions }) {
  const router = useRouter();
  const [formData, setFormData] = useState<UserData>({
    id: '',
    jobTitle: '',
    name: '',
    phone: '',
    email: '',
    pictureurl: '',
  });

  const [professions, setProfessions] = useState<any[]>([]);
  const [fileName, setFileName] = useState('ارفاق ملف');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfession, setEditingProfession] = useState<{ id: number; name: string } | null>(null);
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
    return 'complaints'; // Default to complaints (الدعم الفني) for all users
  };
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  
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
  // SLA offices state
  const [offices, setOffices] = useState<any[]>([]);
  const [slaRules, setSlaRules] = useState<any[]>([]);
  const [isSlaModalOpen, setIsSlaModalOpen] = useState(false);
  const [slaForm, setSlaForm] = useState<{ officeName: string; stage: string; days: string }>({ officeName: '', stage: '', days: '' });
  
  // Custom Timeline states
  const [customTimelines, setCustomTimelines] = useState<CustomTimeline[]>([]);
  const [countryTimelines, setCountryTimelines] = useState<CountryTimeline[]>([]);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [editingTimeline, setEditingTimeline] = useState<CustomTimeline | null>(null);
  const [timelineStages, setTimelineStages] = useState<TimelineStage[]>([]);
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);
  const [stageForm, setStageForm] = useState({ label: '', field: '', icon: 'CheckCircle' });
  const [saving, setSaving] = useState(false);
  const [loadingTimelines, setLoadingTimelines] = useState(false);
  const [viewMode, setViewMode] = useState<'mapping' | 'list'>('mapping');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'deleteStage' | 'deleteTimeline' | 'resetStages';
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
      const res = await fetch('/api/offices');
      const data = await res.json();
      setOffices(data.items || []);
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
    }
    if (activeTab === 'timeline') {
      fetchCustomTimelines();
      fetchUniqueCountries();
    }
    if (activeTab === 'complaints') {
      fetchComplaints();
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

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.name,
          phonenumber: formData.phone,
          email: formData.email,
          pictureurl: formData.pictureurl,
        }),
      });

      if (res.ok) {
        setSuccess('تم حفظ التغييرات بنجاح');
        setOriginalFormData(formData);
        setIsEditingProfile(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
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
    setStageForm({ label: '', field: '', icon: 'CheckCircle' });
    setError(null);
    setSuccess(null);
  };

  const handleAddStage = () => {
    setEditingStageIndex(null);
    setStageForm({ label: '', field: '', icon: 'CheckCircle' });
    setShowStageModal(true);
  };

  const handleEditStage = (index: number) => {
    const stage = timelineStages[index];
    setEditingStageIndex(index);
    setStageForm({ label: stage.label, field: stage.field, icon: stage.icon || 'CheckCircle' });
    setShowStageModal(true);
  };

  const handleSaveStage = () => {
    if (!stageForm.label.trim() || !stageForm.field.trim()) {
      setError('يرجى إدخال جميع الحقول المطلوبة');
      return;
    }

    if (editingStageIndex !== null) {
      const updatedStages = [...timelineStages];
      updatedStages[editingStageIndex] = {
        ...updatedStages[editingStageIndex],
        label: stageForm.label,
        field: stageForm.field,
        icon: stageForm.icon || 'CheckCircle',
      };
      setTimelineStages(updatedStages);
    } else {
      const newStage: TimelineStage = {
        label: stageForm.label,
        field: stageForm.field,
        order: timelineStages.length,
        icon: stageForm.icon || 'CheckCircle',
      };
      setTimelineStages([...timelineStages, newStage]);
    }

    setShowStageModal(false);
    setStageForm({ label: '', field: '', icon: 'CheckCircle' });
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

  return (
    <Layout>
    <div className={`${Styles['tajawal-regular']} min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/30 to-gray-50 p-8`} dir="rtl">
      <main className="max-w-6xl mx-auto">

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

        {/* بطاقة معلومات الحساب */}
        <div className="bg-white rounded-2xl p-10 shadow-lg mb-10 border border-teal-100 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-center mb-10">
            <div className="relative">
              <h2 className="text-center text-3xl font-bold text-teal-800">
                معلومات الحساب
              </h2>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-teal-600 rounded-full"></div>
            </div>
          </div>

          {/* الصف الأول */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                ID
              </label>
              <input
                type="text"
                value={formData.id}
                readOnly
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600 cursor-not-allowed transition-all"
              />
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                المسمى الوظيفي
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                readOnly
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600 cursor-not-allowed transition-all"
              />
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                الاسم
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditingProfile}
                className={`w-full px-4 py-3 border border-gray-200 rounded-lg text-sm transition-all ${
                  isEditingProfile 
                    ? 'bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-teal-300' 
                    : 'bg-gray-50 text-gray-600 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          {/* الصف الثاني */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                رقم الهاتف
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditingProfile}
                className={`w-full px-4 py-3 border border-gray-200 rounded-lg text-sm transition-all ${
                  isEditingProfile 
                    ? 'bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-teal-300' 
                    : 'bg-gray-50 text-gray-600 cursor-not-allowed'
                }`}
              />
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                البريد الإلكتروني
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditingProfile}
                placeholder="example@email.com"
                className={`w-full px-4 py-3 border border-gray-200 rounded-lg text-sm transition-all ${
                  isEditingProfile 
                    ? 'bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-teal-300' 
                    : 'bg-gray-50 text-gray-600 cursor-not-allowed'
                }`}
              />
            </div>

            {/* رفع الصورة */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                صورة الملف الشخصي
              </label>
              <div className="flex items-center gap-4">
                {/* عرض الصورة إذا وُجدت */}
                {formData.pictureurl && (
                  <div className="flex-shrink-0">
                    <img
                      src={formData.pictureurl}
                      alt="الصورة الشخصية"
                      className="w-16 h-16 object-cover rounded-full border-2 border-teal-200 shadow-sm"
                    />
                  </div>
                )}

                <div className="flex-1">
                  {isEditingProfile ? (
                    <>
                      <label
                        htmlFor="file-upload"
                        className="block w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center text-sm text-gray-700 cursor-pointer hover:bg-teal-50 hover:border-teal-400 transition-all"
                      >
                        {uploading ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                            جاري الرفع...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <Plus size={16} />
                            {fileName === 'ارفاق ملف' ? 'اختيار صورة' : fileName}
                          </span>
                        )}
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={uploadImageToBackend}
                        className="hidden"
                        disabled={uploading}
                      />
                    </>
                  ) : (
                    <div className="w-full px-4 py-3 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 text-center text-sm text-gray-400">
                      <span className="flex items-center justify-center gap-2">
                        <Plus size={16} />
                        اختيار صورة
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* أزرار التعديل والحفظ */}
          <div className="flex justify-center gap-4">
            {!isEditingProfile ? (
              <button
                onClick={handleStartEdit}
                className="group relative bg-teal-700 text-white px-16 py-4 rounded-xl text-base font-semibold hover:bg-teal-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-3"
              >
                <Edit size={20} />
                تعديل البيانات
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="group relative bg-gray-600 text-white px-12 py-4 rounded-xl text-base font-semibold hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-3"
                >
                  <X size={20} />
                  إلغاء
                </button>
                <button
                  onClick={handleSave}
                  className="group relative bg-teal-700 text-white px-12 py-4 rounded-xl text-base font-semibold hover:bg-teal-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-3"
                >
                  <Save size={20} />
                  حفظ التغييرات
                </button>
              </>
            )}
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 shadow-md border border-teal-100">
          <button 
            onClick={() => setActiveTab('complaints')}
            className={`flex-1 py-3 px-6 font-semibold text-sm rounded-lg transition-all duration-200 ${
              activeTab === 'complaints' 
                ? 'bg-teal-700 text-white shadow-md' 
                : 'text-gray-600 hover:text-teal-700 hover:bg-teal-50'
            }`}
          >
            الدعم فني
          </button>
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
          {permissions.canManageTimeline && (
          <button 
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-3 px-6 font-semibold text-sm rounded-lg transition-all duration-200 ${
              activeTab === 'timeline' 
                ? 'bg-teal-700 text-white shadow-md' 
                : 'text-gray-600 hover:text-teal-700 hover:bg-teal-50'
            }`}
          >
            تخصيص الجدول الزمني
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
                    <th className="px-6 py-5 text-right text-sm font-semibold">إجراءات</th>
                    <th className="px-6 py-5 text-right text-sm font-semibold">المهنة</th>
                    <th className="px-6 py-5 text-right text-sm font-semibold">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {professions.map((prof, index) => (
                    <tr key={prof.id} className={`hover:bg-teal-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingProfession({ id: prof.id, name: prof.name });
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
                      <td className="px-6 py-4 text-sm text-gray-800 font-medium">{prof.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">#{prof.id}</td>
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
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-teal-800 mb-2">إدارة المكاتب الخارجية</h3>
              <p className="text-sm text-gray-600">تخصيص مهلة المراحل لكل مكتب خارجي</p>
            </div>
            <div className="flex justify-end mb-6">
              <button
                onClick={() => {
                  setSlaForm({ officeName: '', stage: '', days: '' });
                  setIsSlaModalOpen(true);
                }}
                className="bg-teal-700 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-teal-800 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <Plus size={18} />
                تخصيص جديد
              </button>
            </div>

            <div className="border border-teal-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-teal-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-right font-semibold">المكتب</th>
                    <th className="px-6 py-4 text-right font-semibold">المرحلة</th>
                    <th className="px-6 py-4 text-right font-semibold">المدة (يوم)</th>
                    <th className="px-6 py-4 text-right font-semibold">#</th>
                  </tr>
                </thead>
                <tbody>
                  {slaRules.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                            <XCircle className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 font-medium">لا توجد إعدادات</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    slaRules.map((r: any, index: number) => (
                      <tr key={r.id} className={`hover:bg-teal-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-6 py-4 font-medium text-gray-800">{r.officeName}</td>
                        <td className="px-6 py-4 text-gray-700">{stages.find(s => s.value === r.stage)?.label || r.stage}</td>
                        <td className="px-6 py-4 text-gray-700">{r.days}</td>
                        <td className="px-6 py-4">
                          <button
                            className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium flex items-center gap-1"
                            onClick={async () => {
                              try {
                                const qs = new URLSearchParams({ id: r.id }).toString();
                                const res = await fetch(`/api/offices-sla?${qs}`, { method: 'DELETE' });
                                if (res.ok) {
                                  fetchSlaRules();
                                  setSuccess('تم الحذف');
                                  setTimeout(() => setSuccess(null), 2000);
                                }
                              } catch {}
                            }}
                          >
                            <Trash2 size={14} />
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {isSlaModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setIsSlaModalOpen(false)}>
                <div className="bg-white rounded-2xl shadow-2xl w-11/12 md:w-2/3 max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-teal-700 p-6">
                    <h4 className="text-2xl font-bold text-white text-right">تخصيص مهلة مرحلة</h4>
                  </div>
                  <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-right">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                        المكتب
                      </label>
                      <select
                        className="w-full border border-gray-200 rounded-lg py-3 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                        value={slaForm.officeName}
                        onChange={(e) => setSlaForm((p) => ({ ...p, officeName: e.target.value }))}
                      >
                        <option value="">اختر المكتب</option>
                        {offices.map((o) => (
                          <option key={o.id} value={o.office}>{o.office}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                        المرحلة
                      </label>
                      <select
                        className="w-full border border-gray-200 rounded-lg  py-3 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                        value={slaForm.stage}
                        onChange={(e) => setSlaForm((p) => ({ ...p, stage: e.target.value }))}
                      >
                        <option value="">اختر المرحلة</option>
                        {stages.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                        المدة بالأيام
                      </label>
                      <input
                        type="number"
                        min={1}
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                        value={slaForm.days}
                        onChange={(e) => setSlaForm((p) => ({ ...p, days: e.target.value }))}
                      />
                    </div>
                  </div>
                  </div>
                  <div className="flex justify-end gap-3 px-6 pb-6 pt-4 bg-teal-50 border-t border-teal-200">
                    <button className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium" onClick={() => setIsSlaModalOpen(false)}>إلغاء</button>
                    <button
                      className="px-6 py-2.5 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-all shadow-md hover:shadow-lg font-semibold flex items-center gap-2"
                      onClick={async () => {
                        if (!slaForm.officeName || !slaForm.stage || !slaForm.days) return;
                        try {
                          const res = await fetch('/api/offices-sla', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ officeName: slaForm.officeName, stage: slaForm.stage, days: Number(slaForm.days) }),
                          });
                          if (res.ok) {
                            setIsSlaModalOpen(false);
                            fetchSlaRules();
                            setSuccess('تم الحفظ بنجاح');
                            setTimeout(() => setSuccess(null), 2000);
                          }
                        } catch (e) {}
                      }}
                    >
                      <Save size={18} />
                      حفظ
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
        </>
        )}
        
        {permissions.canManageTimeline && (
          <>
        {activeTab === 'timeline' && (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-teal-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-3xl font-bold text-teal-800 mb-2">إدارة التايم لاين المخصص</h3>
                <p className="text-sm text-gray-600">تخصيص الجدول الزمني لكل دولة</p>
              </div>
              <div className="flex gap-3">
                <div className="flex bg-teal-50 rounded-xl p-1.5 shadow-inner border border-teal-200">
                  <button
                    onClick={() => setViewMode('mapping')}
                    className={`px-5 py-2.5 rounded-lg transition-all duration-200 text-sm font-semibold ${
                      viewMode === 'mapping'
                        ? 'bg-teal-700 text-white shadow-md'
                        : 'text-gray-700 hover:bg-teal-100'
                    }`}
                  >
                    عرض جميع الدول
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-5 py-2.5 rounded-lg transition-all duration-200 text-sm font-semibold ${
                      viewMode === 'list'
                        ? 'bg-teal-700 text-white shadow-md'
                        : 'text-gray-700 hover:bg-teal-100'
                    }`}
                  >
                    التايم لاين المخصصة فقط
                  </button>
                </div>
              </div>
            </div>

            {loadingTimelines ? (
              <div className="flex flex-col justify-center items-center py-16">
                <div className="animate-spin rounded-full h-14 w-14 border-4 border-teal-200 border-t-teal-800 mb-4"></div>
                <p className="text-gray-600 text-sm">جاري التحميل...</p>
              </div>
            ) : viewMode === 'mapping' ? (
              countryTimelines.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-lg font-semibold">لا توجد دول متاحة</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {countryTimelines.map((countryTimeline, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group hover:border-teal-300 hover:-translate-y-1"
                      onClick={() => handleCountryClick(countryTimeline)}
                    >
                      <div className="p-6">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {countryTimeline.country}
                          </h3>
                          <div className="mb-3">
                            {countryTimeline.hasCustomTimeline ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800">
                                مخصص
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                                افتراضي
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mb-4 pb-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">عدد المراحل:</span>
                            <span className="text-lg font-semibold text-gray-900">
                              {countryTimeline.stagesCount}
                            </span>
                          </div>
                        </div>
                        <div className="mb-4">
                          {countryTimeline.hasCustomTimeline && countryTimeline.timeline ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleActive(countryTimeline.timeline!);
                              }}
                              className={`w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                countryTimeline.timeline.isActive
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {countryTimeline.timeline.isActive ? '✓ نشط' : '✗ غير نشط'}
                            </button>
                          ) : (
                            <div className="w-full px-3 py-2 rounded-md text-sm text-gray-400 bg-gray-50 text-center">
                              افتراضي
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 pt-4 border-t border-gray-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCountryClick(countryTimeline);
                            }}
                            className="flex-1 bg-teal-800 text-white px-4 py-2 rounded-md hover:bg-teal-900 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <Edit size={16} />
                            تعديل
                          </button>
                          {countryTimeline.hasCustomTimeline && countryTimeline.timeline && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTimeline(countryTimeline.timeline!.id);
                              }}
                              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center"
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : customTimelines.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-lg">لا توجد تايم لاين مخصصة</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customTimelines.map((timeline) => (
                  <div
                    key={timeline.id}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{timeline.country}</h3>
                        {timeline.name && (
                          <p className="text-sm text-gray-600 mt-1">{timeline.name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(timeline)}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            timeline.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {timeline.isActive ? 'نشط' : 'غير نشط'}
                        </button>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        عدد المراحل: <span className="font-semibold">{timeline.stages.length}</span>
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {timeline.stages
                          .sort((a, b) => a.order - b.order)
                          .map((stage, index) => (
                            <div key={index} className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                              {index + 1}. {stage.label}
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleOpenTimelineModal(timeline)}
                        className="flex-1 bg-teal-800 text-white px-4 py-2 rounded-md hover:bg-teal-900 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit size={16} />
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteTimeline(timeline.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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

        {/* Modal for adding/editing custom timeline */}
        {isTimelineModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-11/12 md:w-3/4 lg:w-2/3 max-h-[90vh] overflow-hidden flex flex-col">
              <div className="bg-teal-700 p-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">
                    {editingTimeline ? 'تعديل التايم لاين' : 'إضافة تايم لاين جديد'}
                  </h2>
                  <button
                    onClick={handleCloseTimelineModal}
                    className="text-white hover:bg-teal-800 rounded-lg p-2 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto flex-1">

              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    دولة {editingTimeline?.country}
                  </label>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      المراحل <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      {!editingTimeline?.id && (
                        <button
                          onClick={() => {
                            setConfirmAction({
                              type: 'resetStages',
                              message: 'هل تريد إعادة تعيين المراحل إلى الافتراضية؟ سيتم حذف جميع التعديلات.',
                              onConfirm: () => {
                                setTimelineStages([...DEFAULT_STAGES]);
                                setError(null);
                                setShowConfirmModal(false);
                                setConfirmAction(null);
                              },
                            });
                            setShowConfirmModal(true);
                          }}
                          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2"
                          title="إعادة تعيين المراحل إلى الافتراضية"
                        >
                          <X size={16} />
                          إعادة تعيين
                        </button>
                      )}
                      <button
                        onClick={handleAddStage}
                        className="bg-teal-800 text-white px-4 py-2 rounded-md hover:bg-teal-900 transition-colors flex items-center gap-2"
                      >
                        <Plus size={16} />
                        إضافة مرحلة
                      </button>
                    </div>
                  </div>

                  {timelineStages.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <p className="text-gray-500">لا توجد مراحل. اضغط على "إضافة مرحلة" لبدء الإضافة</p>
                    </div>
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={timelineStages.map((_, i) => `stage-${i}`)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                          {timelineStages.map((stage, index) => (
                            <SortableStageItem
                              key={index}
                              stage={stage}
                              index={index}
                              onEdit={handleEditStage}
                              onDelete={handleDeleteStage}
                              isEditing={editingStageIndex === index}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>

              </div>
              <div className="p-6 bg-teal-50 border-t border-teal-200 flex justify-end gap-3">
                <button
                  onClick={handleCloseTimelineModal}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveTimeline}
                  disabled={saving || !editingTimeline?.country?.trim() || timelineStages.length === 0}
                  className="px-6 py-2.5 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      حفظ
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Add/Edit Stage */}
        {showStageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-11/12 md:w-1/2 max-w-md overflow-hidden">
              <div className="bg-teal-700 p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">
                    {editingStageIndex !== null ? 'تعديل المرحلة' : 'إضافة مرحلة جديدة'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowStageModal(false);
                      setStageForm({ label: '', field: '', icon: 'CheckCircle' });
                      setEditingStageIndex(null);
                    }}
                    className="text-white hover:bg-teal-800 rounded-lg p-2 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                    اسم المرحلة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={stageForm.label}
                    onChange={(e) => setStageForm({ ...stageForm, label: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                    placeholder="مثال: الفحص الطبي"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                    Field Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={stageForm.field}
                    onChange={(e) => setStageForm({ ...stageForm, field: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono transition-all"
                    placeholder="مثال: medicalCheck"
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    يستخدم لتحديد المرحلة في الكود
                  </p>
                </div>
              </div>

              <div className="p-6 bg-teal-50 border-t border-teal-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowStageModal(false);
                    setStageForm({ label: '', field: '', icon: 'CheckCircle' });
                    setEditingStageIndex(null);
                  }}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveStage}
                  className="px-6 py-2.5 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-semibold"
                >
                  <Save size={18} />
                  حفظ
                </button>
              </div>
            </div>
          </div>
        )}

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
                    confirmAction.type === 'deleteTimeline' || confirmAction.type === 'deleteStage'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-teal-800 text-white hover:bg-teal-900'
                  }`}
                >
                  {confirmAction.type === 'deleteTimeline' || confirmAction.type === 'deleteStage' ? (
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
      </main>
    </div>
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
      canManageOffices: !!rolePermissions?.["إدارة المكاتب الخارجية"]?.["تعديل"],
      canManageComplaints: !!rolePermissions?.["إدارة الدعم فني"]?.["حل"],
    };

    return { props: { id: Number(token.id), permissions } };
  } catch (err) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
}