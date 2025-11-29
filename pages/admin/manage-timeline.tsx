import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from 'example/containers/Layout';
import Style from 'styles/Home.module.css';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';
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
import { GripVertical, Plus, Edit, Trash2, Save, X, CheckCircle, XCircle, Link, Briefcase, CheckCircle2, DollarSign, Flag, Plane, MapPin, Package, FileText } from 'lucide-react';
import { FaStethoscope, FaPassport } from 'react-icons/fa';

interface TimelineStage {
  label: string;
  field: string;
  order: number;
  icon?: string; // اسم الأيقونة (string) لتخزينها في JSON
}

// دالة للحصول على أيقونة من الاسم
const getIconComponent = (iconName?: string) => {
  if (!iconName) return <CheckCircle className="w-5 h-5" />;
  
  const iconMap: { [key: string]: JSX.Element } = {
    'Link': <Link className="w-5 h-5" />,
    'Briefcase': <Briefcase className="w-5 h-5" />,
    'CheckCircle': <CheckCircle className="w-5 h-5" />,
    'Stethoscope': <FaStethoscope className="w-5 h-5" />,
    'DollarSign': <DollarSign className="w-5 h-5" />,
    'Flag': <Flag className="w-5 h-5" />,
    'Plane': <Plane className="w-5 h-5" />,
    'MapPin': <MapPin className="w-5 h-5" />,
    'Package': <Package className="w-5 h-5" />,
    'FileText': <FileText className="w-5 h-5" />,
  };
  
  return iconMap[iconName] || <CheckCircle className="w-5 h-5" />;
};

// المراحل الافتراضية من صفحة track_order مع الأيقونات
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

interface CustomTimeline {
  id: number;
  country: string;
  name: string | null;
  stages: TimelineStage[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
          {stage.icon && (
            <p className="text-xs text-gray-500 mt-1">Icon: {stage.icon}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Order: {stage.order}</p>
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

export default function ManageTimeline() {
  const router = useRouter();
  const [timelines, setTimelines] = useState<CustomTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTimeline, setEditingTimeline] = useState<CustomTimeline | null>(null);
  const [stages, setStages] = useState<TimelineStage[]>([]);
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);
  const [stageForm, setStageForm] = useState({ label: '', field: '', icon: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countries, setCountries] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTimelines();
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    setLoadingCountries(true);
    try {
      const res = await fetch('/api/nationalities');
      if (!res.ok) throw new Error('فشل في جلب الجنسيات');
      const data = await res.json();
      if (data.success && data.nationalities) {
        const countriesList = data.nationalities.map((item: any) => ({
          value: item.Country || item.value,
          label: item.Country || item.label,
        }));
        setCountries(countriesList);
      }
    } catch (error: any) {
      console.error('Error fetching countries:', error);
      setError('فشل في جلب قائمة الجنسيات');
    } finally {
      setLoadingCountries(false);
    }
  };

  const fetchTimelines = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/custom-timeline');
      if (!res.ok) throw new Error('فشل في جلب البيانات');
      const data = await res.json();
      setTimelines(data.items || []);
    } catch (error: any) {
      setError(error.message || 'حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (timeline?: CustomTimeline) => {
    if (timeline) {
      setEditingTimeline(timeline);
      setStages([...timeline.stages]);
    } else {
      // عند إضافة تايم لاين جديد، نستخدم المراحل الافتراضية
      setEditingTimeline({
        id: 0,
        country: '',
        name: null,
        stages: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      // استخدام المراحل الافتراضية
      setStages([...DEFAULT_STAGES]);
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTimeline(null);
    setStages([]);
    setEditingStageIndex(null);
    setShowStageModal(false);
    setStageForm({ label: '', field: '' });
    setError(null);
    setSuccess(null);
  };

  const handleAddStage = () => {
    setEditingStageIndex(null);
    setStageForm({ label: '', field: '', icon: 'CheckCircle' });
    setShowStageModal(true);
  };

  const handleEditStage = (index: number) => {
    const stage = stages[index];
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
      // تعديل مرحلة موجودة
      const updatedStages = [...stages];
      updatedStages[editingStageIndex] = {
        ...updatedStages[editingStageIndex],
        label: stageForm.label,
        field: stageForm.field,
        icon: stageForm.icon || 'CheckCircle',
      };
      setStages(updatedStages);
    } else {
      // إضافة مرحلة جديدة
      const newStage: TimelineStage = {
        label: stageForm.label,
        field: stageForm.field,
        order: stages.length,
        icon: stageForm.icon || 'CheckCircle',
      };
      setStages([...stages, newStage]);
    }

    setShowStageModal(false);
    setStageForm({ label: '', field: '', icon: 'CheckCircle' });
    setEditingStageIndex(null);
    setError(null);
  };

  const handleDeleteStage = (index: number) => {
    if (confirm('هل أنت متأكد من حذف هذه المرحلة؟')) {
      const updatedStages = stages
        .filter((_, i) => i !== index)
        .map((stage, i) => ({ ...stage, order: i }));
      setStages(updatedStages);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeIndex = parseInt(active.id.toString().split('-')[1]);
      const overIndex = parseInt(over.id.toString().split('-')[1]);

      const newStages = arrayMove(stages, activeIndex, overIndex);
      const reorderedStages = newStages.map((stage, index) => ({
        ...stage,
        order: index,
      }));
      setStages(reorderedStages);
    }
  };

  const handleSaveTimeline = async () => {
    if (!editingTimeline?.country?.trim()) {
      setError('يرجى إدخال الدولة');
      return;
    }

    if (stages.length === 0) {
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
        stages: stages,
        isActive: editingTimeline.isActive !== undefined ? editingTimeline.isActive : true,
      };

      let res;
      if (editingTimeline.id && editingTimeline.id > 0) {
        // تحديث
        res = await fetch(`/api/custom-timeline/${editingTimeline.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(timelineData),
        });
      } else {
        // إضافة
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
      await fetchTimelines();
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTimeline = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا التايم لاين؟')) return;

    try {
      const res = await fetch(`/api/custom-timeline/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('فشل في حذف التايم لاين');
      
      setSuccess('تم حذف التايم لاين بنجاح');
      await fetchTimelines();
    } catch (error: any) {
      setError(error.message || 'حدث خطأ أثناء حذف التايم لاين');
    }
  };

  const handleToggleActive = async (timeline: CustomTimeline) => {
    try {
      const res = await fetch(`/api/custom-timeline/${timeline.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...timeline, isActive: !timeline.isActive }),
      });

      if (!res.ok) throw new Error('فشل في تحديث الحالة');
      
      await fetchTimelines();
    } catch (error: any) {
      setError(error.message || 'حدث خطأ أثناء تحديث الحالة');
    }
  };

  return (
    <Layout>
      <div className={`min-h-screen ${Style['tajawal-regular']}`} dir="rtl">
        <Head>
          <title>إدارة التايم لاين</title>
        </Head>

        <main className="max-w-7xl mx-auto px-5 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">إدارة التايم لاين المخصص</h1>
            <button
              onClick={() => handleOpenModal()}
              className="bg-teal-800 text-white px-6 py-3 rounded-lg hover:bg-teal-900 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              إضافة تايم لاين جديد
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <XCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-900"></div>
            </div>
          ) : timelines.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">لا توجد تايم لاين مخصصة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {timelines.map((timeline) => (
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
                      onClick={() => handleOpenModal(timeline)}
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

          {/* Modal for Add/Edit Timeline */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-2/3 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingTimeline ? 'تعديل التايم لاين' : 'إضافة تايم لاين جديد'}
                    </h2>
                    <button
                      onClick={handleCloseModal}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الدولة <span className="text-red-500">*</span>
                    </label>
                    {loadingCountries ? (
                      <div className="w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-50 text-gray-500">
                        جاري تحميل الجنسيات...
                      </div>
                    ) : (
                      <select
                        value={editingTimeline?.country || ''}
                        onChange={(e) =>
                          setEditingTimeline({
                            ...(editingTimeline || ({} as CustomTimeline)),
                            country: e.target.value,
                          } as CustomTimeline)
                        }
                        className="w-full border border-gray-300 rounded-md  py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                        // disabled={!!editingTimeline?.id}
                      >
                        <option value="">-- اختر الدولة --</option>
                        {countries.map((country) => (
                          <option key={country.value} value={country.value}>
                            {country.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {editingTimeline?.id && (
                      <p className="text-xs text-gray-500 mt-1">لا يمكن تغيير الدولة بعد الإنشاء</p>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">اسم التايم لاين (اختياري)</label>
                    <input
                      type="text"
                      value={editingTimeline?.name || ''}
                      onChange={(e) =>
                        setEditingTimeline({
                          ...(editingTimeline || ({} as CustomTimeline)),
                          name: e.target.value || null,
                        } as CustomTimeline)
                      }
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="مثال: تايم لاين مصر 2024"
                    />
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        المراحل <span className="text-red-500">*</span>
                        {!editingTimeline?.id && stages.length > 0 && (
                          <span className="text-xs text-gray-500 font-normal mr-2">
                            (تم تحميل المراحل الافتراضية)
                          </span>
                        )}
                      </label>
                      <div className="flex gap-2">
                        {!editingTimeline?.id && (
                          <button
                            onClick={() => {
                              if (confirm('هل تريد إعادة تعيين المراحل إلى الافتراضية؟ سيتم حذف جميع التعديلات.')) {
                                setStages([...DEFAULT_STAGES]);
                                setError(null);
                              }
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

                    {stages.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <p className="text-gray-500">لا توجد مراحل. اضغط على "إضافة مرحلة" لبدء الإضافة</p>
                      </div>
                    ) : (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={stages.map((_, i) => `stage-${i}`)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-3">
                            {stages.map((stage, index) => (
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
                    onClick={handleCloseModal}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveTimeline}
                    disabled={saving || !editingTimeline?.country?.trim() || stages.length === 0}
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

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الأيقونة
                    </label>
                    <select
                      value={stageForm.icon}
                      onChange={(e) => setStageForm({ ...stageForm, icon: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="CheckCircle">CheckCircle (افتراضي)</option>
                      <option value="Link">Link</option>
                      <option value="Briefcase">Briefcase</option>
                      <option value="Stethoscope">Stethoscope</option>
                      <option value="DollarSign">DollarSign</option>
                      <option value="Flag">Flag</option>
                      <option value="Plane">Plane</option>
                      <option value="MapPin">MapPin</option>
                      <option value="Package">Package</option>
                      <option value="FileText">FileText</option>
                    </select>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-500">معاينة:</span>
                      {getIconComponent(stageForm.icon || 'CheckCircle')}
                    </div>
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
        </main>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req }: { req: any }) {
  try {
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(';').forEach((cookie: string) => {
        const [key, value] = cookie.trim().split('=');
        cookies[key] = decodeURIComponent(value);
      });
    }

    if (!cookies.authToken) {
      return {
        redirect: { destination: '/admin/login', permanent: false },
      };
    }

    const token = jwtDecode(cookies.authToken) as any;

    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });

    if (!findUser || !(findUser.role?.permissions as any)?.['إدارة الطلبات']?.['إضافة']) {
      return {
        redirect: { destination: '/admin/home', permanent: false },
      };
    }

    return { props: {} };
  } catch (err) {
    console.error('Authorization error:', err);
    return {
      redirect: { destination: '/admin/home', permanent: false },
    };
  }
}

