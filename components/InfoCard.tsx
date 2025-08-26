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

export default function InfoCard({ title, data, gridCols = 1, actions = [], editable = false, onSave }) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>(
    data.reduce((acc, item) => {
      if (typeof item.value === 'string') {
        acc[item.label] = item.value;
      } else if (item.label.includes('تاريخ ووقت')) {
        // Extract the string from the <span> inside the JSX element
        const dateTimeString = item.value.props?.children[0]?.props?.children || '';
        acc[`${item.label}_date`] = dateTimeString.split(' ')[0] || '';
        acc[`${item.label}_time`] = dateTimeString.split(' ')[1] || '';
      }
      return acc;
    }, {} as Record<string, string>)
  );

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (onSave) {
      const updatedData = { ...formData };
      if (formData['تاريخ ووقت المغادرة_date'] || formData['تاريخ ووقت المغادرة_time']) {
        updatedData['تاريخ ووقت المغادرة'] = `${formData['تاريخ ووقت المغادرة_date'] || ''} ${formData['تاريخ ووقت المغادرة_time'] || ''}`.trim();
      }
      if (formData['تاريخ ووقت الوصول_date'] || formData['تاريخ ووقت الوصول_time']) {
        updatedData['تاريخ ووقت الوصول'] = `${formData['تاريخ ووقت الوصول_date'] || ''} ${formData['تاريخ ووقت الوصول_time'] || ''}`.trim();
      }
      onSave(updatedData);
    }
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData(
      data.reduce((acc, item) => {
        if (typeof item.value === 'string') {
          acc[item.label] = item.value;
        } else if (item.label.includes('تاريخ ووقت')) {
          // Extract the string from the <span> inside the JSX element
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
      <div className={`grid grid-cols-${gridCols} gap-4`}>
        {data.map((item, index) => (
          <div key={index} className="flex flex-col gap-2">
            <label className="text-base text-right">{item.label}</label>
            {editable && editMode && typeof item.value === 'string' ? (
              <input
                type="text"
                value={formData[item.label] || ''}
                onChange={(e) => handleInputChange(item.label, e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-base text-right"
              />
            ) : editable && editMode && item.label.includes('تاريخ ووقت') ? (
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
              className="bg-teal-800 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-900"
              onClick={handleSave}
            >
              حفظ
            </button>
            <button
              className="border border-teal-800 text-teal-800 px-4 py-2 rounded-md text-sm hover:bg-teal-800 hover:text-white"
              onClick={handleCancel}
            >
              إلغاء
            </button>
          </>
        )}
        {actions.map((action, index) => (
          <button
            key={index}
            className={`px-4 py-2 rounded-md text-sm ${
              action.type === 'primary'
                ? 'bg-teal-800 text-white hover:bg-teal-900'
                : 'border border-teal-800 text-teal-800 hover:bg-teal-800 hover:text-white'
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