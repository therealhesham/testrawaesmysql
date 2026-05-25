import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Edit, X, Eye, EyeOff, GripVertical, Copy, MessageSquare, Upload } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  TimelineStage,
  DEFAULT_STAGES,
  emptyStageForm,
  stageToForm,
  validateStageForm,
  buildTimelineStageFromForm,
  StageFormState,
  isStageVisibleOnExternalOffice,
  isStageEditableForOffices,
} from '../../lib/timelineStage';

const getIconComponent = (iconName?: string) => {
  return <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs">I</div>;
};

interface SortableStageItemProps {
  stage: TimelineStage;
  index: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onToggleExternalVisibility: (index: number) => void;
  isEditing: boolean;
  days: number | '';
  onDaysChange: (days: number | '') => void;
}

function SortableStageItem({
  stage,
  index,
  onEdit,
  onDelete,
  onToggleExternalVisibility,
  isEditing,
  days,
  onDaysChange,
}: SortableStageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `stage-${index}` });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={`bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-all ${isDragging ? 'ring-2 ring-teal-500' : ''}`}>
      <div className="flex items-center gap-4">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-teal-600 transition-colors">
          <GripVertical size={20} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
            <h3 className="text-lg font-semibold text-gray-900">{stage.label}</h3>
          </div>
          <p className="text-sm text-gray-600">Field: <span className="font-mono text-teal-700">{stage.field}</span></p>
        </div>
        
        <div className="flex flex-col mx-4 w-24">
          <label className="text-xs text-gray-500 mb-1">المهلة (يوم)</label>
          <input 
            type="number" 
            min="1" 
            value={days === '' ? '' : days} 
            onChange={(e) => onDaysChange(e.target.value ? Number(e.target.value) : '')} 
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 text-center"
            placeholder="مثال: 5"
          />
        </div>

        <div className="flex gap-2 items-center">
          <button type="button" onClick={() => onToggleExternalVisibility(index)} className="p-2 text-teal-700 hover:bg-teal-50 rounded-lg">
            {isStageVisibleOnExternalOffice(stage) ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
          <button onClick={() => onEdit(index)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"><Edit size={18} /></button>
          <button onClick={() => onDelete(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-md"><Trash2 size={18} /></button>
        </div>
      </div>
    </div>
  );
}

export default function OfficeTimelineConfig({ office }: { office: any }) {
  const [timelineStages, setTimelineStages] = useState<TimelineStage[]>([]);
  const [timelineId, setTimelineId] = useState<number | null>(null);
  const [slaDays, setSlaDays] = useState<Record<string, number>>({});
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [showStageModal, setShowStageModal] = useState(false);
  const [stageForm, setStageForm] = useState<StageFormState>(emptyStageForm());
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);

  const [showCloneModal, setShowCloneModal] = useState(false);
  const [otherOffices, setOtherOffices] = useState<any[]>([]);
  const [selectedCloneOffices, setSelectedCloneOffices] = useState<number[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (office) fetchConfig();
  }, [office]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      // Fetch CustomTimeline
      const timelineRes = await fetch(`/api/custom-timeline/by-office/${encodeURIComponent(office.office)}`);
      if (timelineRes.ok) {
        const tData = await timelineRes.json();
        setTimelineStages(tData.stages || []);
        setTimelineId(tData.id);
      } else {
        setTimelineStages([...DEFAULT_STAGES]);
        setTimelineId(null);
      }

      // Fetch SLA Rules
      const slaRes = await fetch('/api/offices-sla');
      if (slaRes.ok) {
        const sData = await slaRes.json();
        const rules = sData.items || [];
        const myRules = rules.filter((r: any) => r.officeName === office.office);
        const newSlaDays: Record<string, number> = {};
        myRules.forEach((r: any) => { newSlaDays[r.stage] = r.days; });
        setSlaDays(newSlaDays);
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Save Timeline
      const method = timelineId ? 'PUT' : 'POST';
      const endpoint = timelineId ? `/api/custom-timeline/${timelineId}` : '/api/custom-timeline';
      
      await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officeId: office.id,
          stages: timelineStages,
          isActive: true
        })
      });

      // 2. Save SLA Rules (bulk update not available, so we loop for now)
      // Delete old SLA rules for this office first
      const slaRes = await fetch('/api/offices-sla');
      const sData = await slaRes.json();
      const myRules = (sData.items || []).filter((r: any) => r.officeName === office.office);
      for (const r of myRules) {
        await fetch(`/api/offices-sla?id=${r.id}`, { method: 'DELETE' });
      }

      // Create new ones
      for (const stage of timelineStages) {
        const d = slaDays[stage.field];
        if (d && d > 0) {
          await fetch('/api/offices-sla', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ officeName: office.office, stage: stage.field, days: d })
          });
        }
      }

      setSuccess('تم الحفظ بنجاح');
      setTimeout(() => setSuccess(null), 3000);
      fetchConfig();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setTimelineStages((items) => {
        const oldIndex = parseInt(active.id.split('-')[1]);
        const newIndex = parseInt(over.id.split('-')[1]);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((st, idx) => ({ ...st, order: idx + 1 }));
      });
    }
  };

  const handleAddStage = () => {
    setStageForm(emptyStageForm());
    setEditingStageIndex(null);
    setShowStageModal(true);
  };

  const handleSaveStageForm = () => {
    const err = validateStageForm(stageForm);
    if (err) return alert(err);
    if (!stageForm.field.trim()) return alert('Field مطلوب');

    const newStage = buildTimelineStageFromForm(stageForm, editingStageIndex !== null ? timelineStages[editingStageIndex].order : timelineStages.length + 1);
    const updated = [...timelineStages];
    if (editingStageIndex !== null) {
      updated[editingStageIndex] = newStage;
    } else {
      updated.push(newStage);
    }
    setTimelineStages(updated);
    setShowStageModal(false);
  };

  const handleDeleteStage = (index: number) => {
    if (!confirm('تأكيد الحذف؟')) return;
    const updated = timelineStages.filter((_, i) => i !== index).map((st, i) => ({ ...st, order: i + 1 }));
    setTimelineStages(updated);
  };

  const fetchOtherOffices = async () => {
    try {
      const res = await fetch('/api/offices');
      const data = await res.json();
      if (data.items) {
        const others = data.items.filter((o: any) => o.Country === office.Country && o.id !== office.id);
        setOtherOffices(others);
        setShowCloneModal(true);
      }
    } catch (e) {}
  };

  const handleClone = async () => {
    setSaving(true);
    try {
      for (const offId of selectedCloneOffices) {
        const targetOffice = otherOffices.find(o => o.id === offId);
        if (!targetOffice) continue;
        
        // Find existing timeline for target
        const tRes = await fetch(`/api/custom-timeline/by-office/${encodeURIComponent(targetOffice.office)}`);
        let tId = null;
        if (tRes.ok) {
           const td = await tRes.json();
           tId = td.id;
        }

        // Save timeline
        const method = tId ? 'PUT' : 'POST';
        const endpoint = tId ? `/api/custom-timeline/${tId}` : '/api/custom-timeline';
        await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ officeId: targetOffice.id, stages: timelineStages, isActive: true })
        });

        // Delete old SLA rules
        const slaRes = await fetch('/api/offices-sla');
        const sData = await slaRes.json();
        const targetRules = (sData.items || []).filter((r: any) => r.officeName === targetOffice.office);
        for (const r of targetRules) {
          await fetch(`/api/offices-sla?id=${r.id}`, { method: 'DELETE' });
        }

        // Apply new SLA rules
        for (const stage of timelineStages) {
          const d = slaDays[stage.field];
          if (d && d > 0) {
            await fetch('/api/offices-sla', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ officeName: targetOffice.office, stage: stage.field, days: d })
            });
          }
        }
      }
      setShowCloneModal(false);
      setSuccess('تم الاستنساخ بنجاح');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {}
    setSaving(false);
  };

  if (loading) return <p className="p-8 text-center text-gray-500">جاري التحميل...</p>;

  return (
    <div className="bg-white rounded-xl border border-teal-100 p-6 shadow-sm mt-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-xl font-bold text-teal-800">الخط الزمني المخصص والمهل</h4>
          <p className="text-sm text-gray-500">تخصيص مراحل العمل وتحديد المهلة الزمنية للمكتب.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchOtherOffices} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-all flex items-center gap-2">
            <Copy size={16} /> استنساخ
          </button>
          <button onClick={handleAddStage} className="bg-teal-50 text-teal-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-100 transition-all flex items-center gap-2">
            <Plus size={16} /> إضافة مرحلة
          </button>
          <button onClick={handleSave} disabled={saving} className="bg-teal-700 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-teal-800 transition-all shadow-md flex items-center gap-2">
            <Save size={16} /> {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>
      
      {success && <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 text-sm">{success}</div>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={timelineStages.map((_, i) => `stage-${i}`)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {timelineStages.map((stage, index) => (
              <SortableStageItem
                key={index}
                stage={stage}
                index={index}
                days={slaDays[stage.field] || ''}
                onDaysChange={(val) => setSlaDays(p => ({ ...p, [stage.field]: val as number }))}
                onEdit={() => { setStageForm(stageToForm(stage)); setEditingStageIndex(index); setShowStageModal(true); }}
                onDelete={() => handleDeleteStage(index)}
                onToggleExternalVisibility={() => {
                  const s = [...timelineStages];
                  s[index].visibleOnExternalOffice = !isStageVisibleOnExternalOffice(s[index]);
                  setTimelineStages(s);
                }}
                isEditing={false}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Modal for Add/Edit Stage */}
      {showStageModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-1/2 max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingStageIndex !== null ? 'تعديل المرحلة' : 'إضافة مرحلة جديدة'}
                </h3>
                <button
                  onClick={() => {
                    setShowStageModal(false);
                    setStageForm(emptyStageForm());
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
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-left"
                  placeholder="مثال: medicalCheck"
                  dir="ltr"
                />
                <p className="text-xs text-gray-500 mt-1">يستخدم لتحديد المرحلة في الكود</p>
              </div>

              <div className="mb-4 flex items-center justify-between gap-4 p-3 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  {stageForm.visibleOnExternalOffice ? (
                    <Eye className="w-5 h-5 text-teal-700" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-800">إظهار للمكتب الخارجي</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={stageForm.visibleOnExternalOffice}
                  onClick={() =>
                    setStageForm((f) => ({
                      ...f,
                      visibleOnExternalOffice: !f.visibleOnExternalOffice,
                    }))
                  }
                  className={`flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors ${
                    stageForm.visibleOnExternalOffice ? 'bg-teal-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`h-6 w-6 rounded-full bg-white shadow transition-[margin] ${
                      stageForm.visibleOnExternalOffice ? 'ms-auto' : 'me-auto'
                    }`}
                  />
                </button>
              </div>

              <div className="mb-4 flex items-center justify-between gap-4 p-3 rounded-lg border border-gray-200 bg-sky-50/40">
                <div className="flex flex-col gap-0.5 text-right">
                  <span className="text-sm font-medium text-gray-800">إمكانية التعديل من المكتب</span>
                  <span className="text-xs text-gray-500">
                    يُحفظ في JSON كـ <code className="font-mono bg-white/80 px-1 rounded">EditableForOffices</code> لمشروع المكاتب الخارجية
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={stageForm.EditableForOffices}
                  onClick={() =>
                    setStageForm((f) => ({
                      ...f,
                      EditableForOffices: !f.EditableForOffices,
                    }))
                  }
                  className={`flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors ${
                    stageForm.EditableForOffices ? 'bg-sky-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`h-6 w-6 rounded-full bg-white shadow transition-[margin] ${
                      stageForm.EditableForOffices ? 'ms-auto' : 'me-auto'
                    }`}
                  />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع التفاعل في المرحلة</label>
                <select
                  value={stageForm.interactionType}
                  onChange={(e) =>
                    setStageForm({
                      ...stageForm,
                      interactionType: e.target.value as StageFormState['interactionType'],
                    })
                  }
                  className="w-full border border-gray-300 rounded-md py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ backgroundPosition: 'left 0.75rem center', paddingLeft: '2.5rem', paddingRight: '0.75rem' }}
                >
                  <option value="none">عادي (بدون رفع ملف أو سؤال)</option>
                  <option value="file">رفع ملف</option>
                  <option value="question">سؤال بخيارات إجابة</option>
                </select>
              </div>

              {stageForm.interactionType === 'question' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نص السؤال <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={stageForm.questionText}
                      onChange={(e) => setStageForm({ ...stageForm, questionText: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="السؤال كما يظهر للمستخدم"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الإجابة</label>
                    <select
                      value={stageForm.answerType}
                      onChange={(e) =>
                        setStageForm({
                          ...stageForm,
                          answerType: e.target.value as StageFormState['answerType'],
                        })
                      }
                      className="w-full border border-gray-300 rounded-md py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      style={{ backgroundPosition: 'left 0.75rem center', paddingLeft: '2.5rem', paddingRight: '0.75rem' }}
                    >
                      <option value="radio">راديو — خيار واحد</option>
                      <option value="options">قائمة خيارات (سلكت)</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الخيارات <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={stageForm.answerOptionsText}
                      onChange={(e) => setStageForm({ ...stageForm, answerOptionsText: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[100px] font-mono text-sm"
                      placeholder={'خيار في كل سطر\nمثال:\nنعم\nلا'}
                    />
                    <p className="text-xs text-gray-500 mt-1">سطر لكل خيار، خياران على الأقل</p>
                  </div>
                </>
              )}

              {stageForm.interactionType === 'file' && (
                <p className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  تفعيل رفع ملف لهذه المرحلة في الواجهات التي تدعم الملفات (مثل المكتب الخارجي).
                </p>
              )}

            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowStageModal(false);
                    setStageForm(emptyStageForm());
                    setEditingStageIndex(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
              <button
                onClick={handleSaveStageForm}
                className="px-6 py-2 bg-teal-800 text-white rounded-md hover:bg-teal-900 transition-colors flex items-center gap-2"
              >
                <Save size={18} />
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloneModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-teal-700 p-4 flex justify-between">
              <h3 className="text-white font-bold">استنساخ إلى مكاتب أخرى في {office.Country}</h3>
              <button onClick={() => setShowCloneModal(false)} className="text-white"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {otherOffices.length === 0 ? <p className="text-gray-500">لا يوجد مكاتب أخرى في هذه الدولة</p> : 
                otherOffices.map(o => (
                  <label key={o.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded border">
                    <input type="checkbox" checked={selectedCloneOffices.includes(o.id)} onChange={(e) => {
                      if (e.target.checked) setSelectedCloneOffices([...selectedCloneOffices, o.id]);
                      else setSelectedCloneOffices(selectedCloneOffices.filter(id => id !== o.id));
                    }} />
                    <span>{o.office}</span>
                  </label>
                ))
              }
              {otherOffices.length > 0 && (
                <button onClick={handleClone} disabled={saving || selectedCloneOffices.length === 0} className="w-full bg-teal-700 text-white py-2 rounded-lg mt-4 disabled:opacity-50">
                  {saving ? 'جاري النسخ...' : 'تطبيق'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
