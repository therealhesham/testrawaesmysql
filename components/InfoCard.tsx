// components/InfoCard.tsx
import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

interface InfoCardProps {
  title: string;
  data: { label: string; value: string | JSX.Element }[];
  gridCols?: number;
  actions?: { label: string; type: 'primary' | 'secondary'; onClick: () => void; disabled?: boolean }[];
  editable?: boolean;
  onSave?: (updatedData: Record<string, string>) => void;
}

export default function InfoCard({ title, data, gridCols = 1, actions = [], editable = false, onSave }: InfoCardProps) {
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
    if (key.includes('تاريخ') && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return 'الرجاء إدخال التاريخ بصيغة YYYY-MM-DD';
    }
    // if (key.includes('وقت') && value && !/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    //   return 'الرجاء إدخال الوقت بصيغة HH:mm:ss';
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
    <section className="bg-gray-100 border border-gray-200 rounded-md p-6 mb-6">
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
                  title="الرجاء إدخال التاريخ بصيغة YYYY-MM-DD"
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
                    title="الرجاء إدخال التاريخ بصيغة YYYY-MM-DD"
                  />
                  <input
                    type="time"
                    value={formData[`${item.label}_time`] || ''}
                    onChange={(e) => handleInputChange(`${item.label}_time`, e.target.value)}
                    className="border border-gray-300 rounded-md p-2 text-base text-right flex-1"
                    pattern="\d{2}:\d{2}:\d{2}"
                    title="الرجاء إدخال الوقت بصيغة HH:mm:ss"
                  />
                </div>
                {(errors[`${item.label}_date`] || errors[`${item.label}_time`]) && (
                  <span className="text-red-600 text-sm text-right">
                    {errors[`${item.label}_date`] || errors[`${item.label}_time`]}
                  </span>
                )}
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