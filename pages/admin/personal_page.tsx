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

export default function Profile({ id, isAdmin }: { id: number, isAdmin: boolean  }) {
  const router = useRouter();
  const [formData, setFormData] = useState<UserData>({
    id: '',
    jobTitle: '',
    name: '',
    phone: '',
    pictureurl: '',
  });

  const [professions, setProfessions] = useState<any[]>([]);
  const [fileName, setFileName] = useState('ارفاق ملف');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfession, setEditingProfession] = useState<{ id: number; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState('professions');
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

  useEffect(() => {
    if (activeTab === 'offices') {
      fetchOffices();
      fetchSlaRules();
    }
    if (activeTab === 'timeline') {
      fetchCustomTimelines();
      fetchUniqueCountries();
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
        setFormData({
          id: data.id?.toString() || '',
          jobTitle: data.role?.name || '',
          name: data.username || '',
          phone: data.phonenumber || '',
          pictureurl: data.pictureurl || '',
        });
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
          // idnumber: formData.id,
          phonenumber: formData.phone,
          pictureurl: formData.pictureurl,
        }),
      });

      if (res.ok) {
        setSuccess('تم حفظ التغييرات بنجاح');
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
    <div className={`${Styles['tajawal-regular']} min-h-screen p-8`} dir="rtl">
      <main className="max-w-5xl mx-auto">

        {/* رسائل النجاح أو الخطأ */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
            {success}
          </div>
        )}

        {/* بطاقة معلومات الحساب */}
        <div className="bg-white rounded-lg p-10 shadow-sm mb-8">
          <h2 className="text-center text-2xl font-semibold text-teal-700 mb-10">
            معلومات الحساب
          </h2>

          {/* الصف الأول */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <label className="block text-sm text-gray-700 mb-2">ID</label>
              <input
                type="text"
                value={formData.id}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">المسمى الوظيفي</label>
              <input
                type="text"
                value={formData.jobTitle}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">الاسم</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* الصف الثاني */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <label className="block text-sm text-gray-700 mb-2">رقم الهاتف</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {/* رفع الصورة */}
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-2">صورة الملف الشخصي</label>
                
                {/* عرض الصورة إذا وُجدت */}
                {formData.pictureurl && (
                  <div className="mb-3">
                    <img
                      src={formData.pictureurl}
                      alt="الصورة الشخصية"
                      className="w-24 h-24 object-cover rounded-full border"
                    />
                  </div>
                )}

                <label
                  htmlFor="file-upload"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-center text-sm text-gray-700 cursor-pointer hover:bg-gray-100 transition"
                >
                  {uploading ? 'جاري الرفع...' : fileName}
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={uploadImageToBackend}
                  className="hidden"
                  disabled={uploading}
                />
              </div>

              <label
                htmlFor="file-upload"
                className="bg-teal-800 text-white px-8 py-2 rounded-md text-sm cursor-pointer hover:bg-teal-900 transition whitespace-nowrap"
              >
                اختيار ملف
              </label>
            </div>
          </div>

          {/* زر الحفظ */}
          <button
            onClick={handleSave}
            className="block mx-auto bg-teal-800 text-white px-12 py-3 rounded-md text-base font-medium hover:bg-teal-900 transition"
          >
            حفظ التغييرات
          </button>
        </div>
{isAdmin && (
  <>
        {/* Tabs */}
        <div className="flex gap-6 mb-5 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('professions')}
            className={`pb-3 px-6 font-medium text-sm transition ${
              activeTab === 'professions' 
                ? 'text-teal-700 border-b-2 border-teal-700' 
                : 'text-gray-600 hover:text-teal-700'
            }`}
          >
            إدارة المهن
          </button>
          {/* <button 
            onClick={() => setActiveTab('statements')}
            className={`pb-3 px-6 font-medium text-sm transition ${
              activeTab === 'statements' 
                ? 'text-teal-700 border-b-2 border-teal-700' 
                : 'text-gray-600 hover:text-teal-700'
            }`}
          >
            إدارة البيان
          </button> */}
          <button 
            onClick={() => setActiveTab('offices')}
            className={`pb-3 px-6 font-medium text-sm transition ${
              activeTab === 'offices' 
                ? 'text-teal-700 border-b-2 border-teal-700' 
                : 'text-gray-600 hover:text-teal-700'
            }`}
          >
            إدارة المكاتب الخارجية
          </button>
          <button 
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 px-6 font-medium text-sm transition ${
              activeTab === 'timeline' 
                ? 'text-teal-700 border-b-2 border-teal-700' 
                : 'text-gray-600 hover:text-teal-700'
            }`}
          >
            تخصيص الجدول الزمني
          </button>
        </div>
        </>
)}
        {isAdmin && (
          <>  
        {activeTab === 'professions' && (
          <>
            <button 
              onClick={() => {
                setEditingProfession(null);
                setIsModalOpen(true);
              }}
              className="mb-5 bg-teal-800 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-teal-900 transition"
            >
              + إضافة مهنة
            </button>

            {/* جدول المهن */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-teal-800 text-white">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-medium">إجراءات</th>
                    <th className="px-6 py-4 text-right text-sm font-medium">المهنة</th>
                    <th className="px-6 py-4 text-right text-sm font-medium">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {professions.map((prof) => (
                    <tr key={prof.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm">
                        <button 
                          onClick={() => {
                            setEditingProfession({ id: prof.id, name: prof.name });
                            setIsModalOpen(true);
                          }}
                          className="text-gray-600 hover:text-teal-700 mx-1"
                        >
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
                          className="text-red-600 hover:text-red-700 mx-1 text-lg"
                        >
                          ×
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">{prof.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">#{prof.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        </>
        )}

        {isAdmin && (
          <>
         
         
        {/* {activeTab === 'statements' && (
          <div className="bg-white rounded-lg p-8 shadow-sm">
          </div>
        )} */}
 </>
        )}

        {isAdmin && (
          <>

          {activeTab === 'offices' && (
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">إدارة المكاتب الخارجية</h3>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-600">تخصيص مهلة المراحل لكل مكتب خارجي</div>
              <button
                onClick={() => {
                  setSlaForm({ officeName: '', stage: '', days: '' });
                  setIsSlaModalOpen(true);
                }}
                className="bg-teal-800 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-900"
              >
                تخصيص
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-teal-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-right">المكتب</th>
                    <th className="px-4 py-3 text-right">المرحلة</th>
                    <th className="px-4 py-3 text-right">المدة (يوم)</th>
                    <th className="px-4 py-3 text-right">#</th>
                  </tr>
                </thead>
                <tbody>
                  {slaRules.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-500">لا توجد إعدادات</td>
                    </tr>
                  ) : (
                    slaRules.map((r: any) => (
                      <tr key={r.id} className="odd:bg-gray-50">
                        <td className="px-4 py-3">{r.officeName}</td>
                        <td className="px-4 py-3">{stages.find(s => s.value === r.stage)?.label || r.stage}</td>
                        <td className="px-4 py-3">{r.days}</td>
                        <td className="px-4 py-3">
                          <button
                            className="text-red-600 hover:text-red-700"
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
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setIsSlaModalOpen(false)}>
                <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/2 p-6" onClick={(e) => e.stopPropagation()}>
                  <h4 className="text-lg font-semibold mb-4 text-right">تخصيص مهلة مرحلة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">المكتب</label>
                      <select
                        className="w-full border border-gray-300 rounded-md  py-2 bg-gray-50"
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
                      <label className="block text-sm text-gray-700 mb-1">المرحلة</label>
                      <select
                        className="w-full border border-gray-300 rounded-md  py-2 bg-gray-50"
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
                      <label className="block text-sm text-gray-700 mb-1">المدة بالأيام</label>
                      <input
                        type="number"
                        min={1}
                        className="w-full border border-gray-300 rounded-md  py-2 bg-gray-50"
                        value={slaForm.days}
                        onChange={(e) => setSlaForm((p) => ({ ...p, days: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button className="px-4 py-2 border border-gray-300 rounded-md" onClick={() => setIsSlaModalOpen(false)}>إلغاء</button>
                    <button
                      className="px-4 py-2 bg-teal-800 text-white rounded-md hover:bg-teal-900"
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
                      حفظ
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">إدارة التايم لاين المخصص</h3>
              <div className="flex gap-3">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('mapping')}
                    className={`px-4 py-2 rounded-md transition-colors text-sm ${
                      viewMode === 'mapping'
                        ? 'bg-teal-800 text-white'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    عرض جميع الدول
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-md transition-colors text-sm ${
                      viewMode === 'list'
                        ? 'bg-teal-800 text-white'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    التايم لاين المخصصة فقط
                  </button>
                </div>
              </div>
            </div>

            {loadingTimelines ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-900"></div>
              </div>
            ) : viewMode === 'mapping' ? (
              countryTimelines.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-lg">لا توجد دول متاحة</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {countryTimelines.map((countryTimeline, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-2/3 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingTimeline ? 'تعديل التايم لاين' : 'إضافة تايم لاين جديد'}
                  </h2>
                  <button
                    onClick={handleCloseTimelineModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

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

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={handleCloseTimelineModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveTimeline}
                  disabled={saving || !editingTimeline?.country?.trim() || timelineStages.length === 0}
                  className="px-6 py-2 bg-teal-800 text-white rounded-md hover:bg-teal-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-1/2 max-w-md">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingStageIndex !== null ? 'تعديل المرحلة' : 'إضافة مرحلة جديدة'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowStageModal(false);
                      setStageForm({ label: '', field: '', icon: 'CheckCircle' });
                      setEditingStageIndex(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المرحلة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={stageForm.label}
                    onChange={(e) => setStageForm({ ...stageForm, label: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="مثال: الفحص الطبي"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={stageForm.field}
                    onChange={(e) => setStageForm({ ...stageForm, field: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    placeholder="مثال: medicalCheck"
                  />
                  <p className="text-xs text-gray-500 mt-1">يستخدم لتحديد المرحلة في الكود</p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowStageModal(false);
                    setStageForm({ label: '', field: '', icon: 'CheckCircle' });
                    setEditingStageIndex(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveStage}
                  className="px-6 py-2 bg-teal-800 text-white rounded-md hover:bg-teal-900 transition-colors flex items-center gap-2"
                >
                  <Save size={18} />
                  حفظ
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
      let isAdmin = false;
const token = jwtDecode(cookies.authToken) as any;
      const detecIsAdmin = await prisma.user.findUnique({where:{id:Number(token.id)},include:{role:true}})
if(detecIsAdmin?.role?.name == "owner" || detecIsAdmin?.role?.name == "manager" || detecIsAdmin?.role?.name == "Owner" || detecIsAdmin?.role?.name == "Manager" ){
  isAdmin = true;
}
  if (!cookies.authToken) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }

  try {
    return { props: { id: Number(token.id), isAdmin } };
  } catch (err) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
}