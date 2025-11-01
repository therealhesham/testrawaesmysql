// components/InfoCard.tsx
import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import VisaSelector from './VisaSelector';

interface InfoCardProps {
  id?: string;
  title: string;
  data: { label: string; value: string | JSX.Element; fieldType?: 'visa' }[];
  gridCols?: number;
  actions?: { label: string; type: 'primary' | 'secondary'; onClick: () => void; disabled?: boolean }[];
  editable?: boolean;
  onSave?: (updatedData: Record<string, string>) => void;
  clientID?: number;
}

export default function InfoCard({ id, title, data, gridCols = 1, actions = [], editable = false, onSave, clientID }: InfoCardProps) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>(
    data.reduce((acc, item) => {
      if (typeof item.value === 'string') {
        acc[item.label] = item.value;
      } else if (item.label.includes('تاريخ ووقت')) {
        const dateTimeString = item.value.props?.children[0]?.props?.children || '';
        acc[`${item.label}_date`] = dateTimeString.split(' ')[0] || '';
        acc[`${item.label}_time`] = dateTimeString.split(' ')[1] || '';
      }
      return acc;
    }, {} as Record<string, string>)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validateInput = (key: string, value: string): string | null => {
  // Check if "تاريخ مساند" is required
  if (key === 'تاريخ مساند' && value == 'N/A') {
    return 'تاريخ مساند مطلوب';
  }

  // Check if the key is related to a date field
  if (key.includes('تاريخ') && value) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    const inputDate = new Date(value);

    // Ensure the date is not in the past
    if (inputDate < today) {
      return 'لا يمكن اختيار تاريخ في الماضي';
    }

    // Optional: Ensure the date format is valid (YYYY-MM-DD)
    // if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    //   return 'صيغة التاريخ غير صالحة (يجب أن تكون YYYY-MM-DD)';
    // }
  }

  // For time fields (optional validation for time format)
  // if (key.includes('_time') && value && !/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
  //   return 'صيغة الوقت غير صالحة (يجب أن تكون HH:MM أو HH:MM:SS)';
  // }

  return null;
};
  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    const error = validateInput(key, value);
    setErrors((prev) => ({ ...prev, [key]: error || '' }));
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateInput(key, value);
      if (error) newErrors[key] = error;
    });

    if (Object.values(newErrors).some((error) => error)) {
      setErrors(newErrors);
      return;
    }

    if (onSave) {
      setIsSaving(true);
      const updatedData = { ...formData };
      if (formData['تاريخ ووقت المغادرة_date'] || formData['تاريخ ووقت المغادرة_time']) {
        updatedData['تاريخ ووقت المغادرة'] = `${formData['تاريخ ووقت المغادرة_date'] || ''} ${formData['تاريخ ووقت المغادرة_time'] || ''}`.trim();
      }
      if (formData['تاريخ ووقت الوصول_date'] || formData['تاريخ ووقت الوصول_time']) {
        updatedData['تاريخ ووقت الوصول'] = `${formData['تاريخ ووقت الوصول_date'] || ''} ${formData['تاريخ ووقت الوصول_time'] || ''}`.trim();
      }
      try {
        await onSave(updatedData);
      } catch (error) {
        setErrors({ global: 'فشل في حفظ التعديلات. حاول مرة أخرى.' });
      } finally {
        setIsSaving(false);
      }
    }
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditMode(false);
    setErrors({});
    setFormData(
      data.reduce((acc, item) => {
        if (typeof item.value === 'string') {
          acc[item.label] = item.value;
        } else if (item.label.includes('تاريخ ووقت')) {
          const dateTimeString = item.value.props?.children[0]?.props?.children || '';
          acc[`${item.label}_date`] = dateTimeString.split(' ')[0] || '';
          acc[`${item.label}_time`] = dateTimeString.split(' ')[1] || '';
        }
        return acc;
      }, {} as Record<string, string>)
    );
  };

  return (
    <section id={id} className="bg-gray-100  rounded-md p-6 mb-6">
      <h3 className="text-2xl font-normal text-center mb-6">{title}</h3>
      {errors.global && <div className="text-red-600 text-sm mb-4 text-right">{errors.global}</div>}
      <div className={`grid grid-cols-${gridCols} gap-4`}>
        {data.map((item, index) => (
          <div key={index} className="flex flex-col gap-2">
            <label className="text-base text-right">{item.label}</label>
            {editable && editMode && (item.label.includes('تاريخ') && !item.label.includes('تاريخ ووقت')) ? (
              <div className="flex flex-col">
                <input
                  type="date"
                  value={formData[item.label] || ''}
                  onChange={(e) => handleInputChange(item.label, e.target.value)}
                  className="border border-gray-300 rounded-md p-2 text-base text-right"
                  pattern="\d{4}-\d{2}-\d{2}"
                />
                {errors[item.label] && <span className="text-red-600 text-sm text-right">{errors[item.label]}</span>}
              </div>
            ) : editable && editMode && item.label.includes('تاريخ ووقت') ? (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={formData[`${item.label}_date`] || ''}
                    onChange={(e) => handleInputChange(`${item.label}_date`, e.target.value)}
                    className="border border-gray-300 rounded-md p-2 text-base text-right flex-1"
                    pattern="\d{4}-\d{2}-\d{2}"
                  />
                  <input
                    type="time"
                    value={formData[`${item.label}_time`] || ''}
                    onChange={(e) => handleInputChange(`${item.label}_time`, e.target.value)}
                    className="border border-gray-300 rounded-md p-2 text-base text-right flex-1"
                    pattern="\d{2}:\d{2}:\d{2}"
                  />
                </div>
                {(errors[`${item.label}_date`] || errors[`${item.label}_time`]) && (
                  <span className="text-red-600 text-sm text-right">
                    {errors[`${item.label}_date`] || errors[`${item.label}_time`]}
                  </span>
                )}
              </div>
            ) : editable && editMode && item.fieldType === 'visa' ? (
              <div className="flex flex-col">
                <VisaSelector
                  value={formData[item.label] || ''}
                  onChange={(value) => handleInputChange(item.label, value)}
                  clientID={clientID || 0}
                  placeholder="ابحث عن رقم التأشيرة"
                  className="border border-gray-300 rounded-md p-2 text-base text-right"
                  error={errors[item.label]}
                />
              </div>
            ) : editable && editMode ? (
              <div className="flex flex-col">
                <input
                  type="text"
                  value={formData[item.label] || ''}
                  onChange={(e) => handleInputChange(item.label, e.target.value)}
                  className="border border-gray-300 rounded-md p-2 text-base text-right"
                />
                {errors[item.label] && <span className="text-red-600 text-sm text-right">{errors[item.label]}</span>}
              </div>
            ) : (
              <div className="border border-gray-300 rounded-md p-2 text-base text-right">
                {typeof item.value === 'string' ? item.value : item.value}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-6 justify-start">
        {editable && !editMode && (
          <button
            className="bg-teal-800 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-900"
            onClick={() => setEditMode(true)}
          >
            تعديل
          </button>
        )}
        {editable && editMode && (
          <>
            <button
              className="bg-teal-800 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-900 disabled:opacity-50"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button
              className="border border-teal-800 text-teal-800 px-4 py-2 rounded-md text-sm hover:bg-teal-800 hover:text-white"
              onClick={handleCancel}
              disabled={isSaving}
            >
              إلغاء
            </button>
          </>
        )}
        {actions.map((action, index) => (
          <button
            key={index}
            className={`px-4 py-2 rounded-md self-start text-sm  ${ // ineed to be in the end
              action.type === 'primary'
                ? 'bg-teal-800 text-white  hover:bg-teal-900'
                : 'bg-teal-800 text-white  hover:bg-teal-900'
            } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}