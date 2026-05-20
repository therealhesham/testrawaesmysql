// components/InfoCard.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import VisaSelector from './VisaSelector';
import CityAutocomplete from './CityAutocomplete';
import SaudiCityAutocomplete from './SaudiCityAutocomplete';

interface InfoCardProps {
  id?: string;
  title: string;
  data: { label: string; value: string | JSX.Element | ((editMode: boolean) => JSX.Element); fieldType?: 'visa' | 'file' | 'city' | 'saudiCity' | 'phone'; rawValue?: string }[];
  gridCols?: number;
  actions?: { label: string; type: 'primary' | 'secondary'; onClick: () => void; disabled?: boolean }[];
  editable?: boolean;
  onSave?: (updatedData: Record<string, string>) => void;
  clientID?: number;
  disabled?: boolean;
  bottomMessage?: JSX.Element | string;
  /** When provided, "إضافة رقم تأشيرة أخرى" in VisaSelector opens this (e.g. full VisaModal) instead of simple modal. */
  onAddVisaClick?: () => void;
  /** When this changes, VisaSelector refetches visa list (e.g. after adding via full modal). */
  visaRefetchTrigger?: number;
  externalFormData?: Record<string, string>;
  onCancel?: () => void;
}

function localTodayYmd(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

/** تاريخ YYYY-MM-DD بعد اليوم (محلي)؟ */
function isMusanedContractDateAfterToday(ymd: string): boolean {
  const s = ymd.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const inputDate = new Date(y, mo, d);
  if (inputDate.getFullYear() !== y || inputDate.getMonth() !== mo || inputDate.getDate() !== d) return false;
  const t = new Date();
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return inputDate.getTime() > today.getTime();
}

function clampMusanedContractDateToToday(ymd: string): string {
  if (!ymd || ymd === 'N/A') return ymd;
  return isMusanedContractDateAfterToday(ymd) ? localTodayYmd() : ymd;
}

export default function InfoCard({ id, title, data, gridCols = 1, actions = [], editable = false, onSave, clientID, disabled = false, bottomMessage, onAddVisaClick, visaRefetchTrigger, externalFormData, onCancel }: InfoCardProps) {
  const [editMode, setEditMode] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>(
    data.reduce((acc, item) => {
      if (item.label.includes('تاريخ ووقت')) {
        const dateTimeString = item.rawValue || '';
        acc[`${item.label}_date`] = dateTimeString.split(' ')[0] || '';
        acc[`${item.label}_time`] = dateTimeString.split(' ')[1] || '';
      } else if (typeof item.value === 'string') {
        acc[item.label] = item.value;
      } else if (typeof item.value === 'number') {
        // تحويل الأرقام إلى نص (مثل رقم الطلب)
        acc[item.label] = String(item.value);
      } else if (typeof item.rawValue === 'string') {
        acc[item.label] = item.rawValue;
      }
      return acc;
    }, {} as Record<string, string>)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // عند فتح التعديل: لا يبقى في النموذج تاريخ عقد مستقبلي (بيانات قديمة أو متصفح يتجاهل max)
  useEffect(() => {
    if (!editMode) return;
    setFormData((prev) => {
      const v = prev['تاريخ العقد'];
      if (typeof v !== 'string' || !v.trim() || v === 'N/A') return prev;
      const clamped = clampMusanedContractDateToToday(v);
      if (clamped === v) return prev;
      return { ...prev, 'تاريخ العقد': clamped };
    });
  }, [editMode]);

  useEffect(() => {
    if (externalFormData) {
      setFormData((prev) => ({ ...prev, ...externalFormData }));
    }
  }, [externalFormData]);

  const validateInput = (key: string, value: string): string | null => {
  // Check if "تاريخ العقد" is required
  // if (key === 'تاريخ العقد' && value == 'N/A') {
  //   return 'تاريخ العقد مطلوب';
  // }

  // National ID validation: 10 digits
  if ((key === 'هوية العميل' || key.includes('هوية العميل')) && value && value !== 'N/A') {
    const nationalId = value.trim();
    if (!/^\d+$/.test(nationalId)) {
      return 'هوية العميل يجب أن تحتوي على أرقام فقط';
    }
  }
  // Visa number validation: 10 digits, must start with 190
  if ((key === 'رقم التأشيرة' || key.includes('التأشيرة')) && value && value !== 'N/A') {
    const visa = value.trim();

    if (!/^\d+$/.test(visa)) {
      return 'رقم التأشيرة يجب أن يحتوي على أرقام فقط';
    }

    // Allow progressive typing of 190 (1 -> 19 -> 190)
    if (visa.length < 3) {
      if (!'190'.startsWith(visa)) {
        return 'رقم التأشيرة يجب أن يبدأ بـ 190';
      }
      return null;
    }

    if (!visa.startsWith('190')) {
      return 'رقم التأشيرة يجب أن يبدأ بـ 190';
    }

    if (visa.length !== 10) {
      return 'رقم التأشيرة يجب أن يكون 10 أرقام';
    }
  }

  // Contract number validation: 10 digits, must start with 20
    if ((key === 'رقم عقد إدارة المكاتب' || key.includes('عقد إدارة المكاتب')) && value && value !== 'N/A') {
    const contract = value.trim();

    if (!/^\d+$/.test(contract)) {
      return 'رقم العقد يجب أن يحتوي على أرقام فقط';
    }

    // تم تعطيل التحقق من أن الرقم يبدأ بـ 20 وأن طوله 10 أرقام بناءً على طلب المستخدم
    /*
    // Allow progressive typing of 20 (2 -> 20)
    if (contract.length < 2) {
      if (!'20'.startsWith(contract)) {
        return 'رقم العقد يجب أن يبدأ بـ 20';
      }
      return null;
    }

    if (!contract.startsWith('20')) {
      return 'رقم العقد يجب أن يبدأ بـ 20';
    }

    if (contract.length !== 10) {
      return 'رقم العقد يجب أن يكون 10 أرقام';
    }
    */
  }

  // Musaned Authentication Contract Number validation: 10 digits, must start with 20
  if ((key === 'رقم عقد مساند التوثيق' || key.includes('عقد مساند التوثيق')) && value && value !== 'N/A') {
    const contract = value.trim();

    if (!/^\d+$/.test(contract)) {
      return 'رقم العقد يجب أن يحتوي على أرقام فقط';
    }

    // Allow progressive typing of 20 (2 -> 20)
    if (contract.length < 2) {
      if (!'20'.startsWith(contract)) {
        return 'رقم العقد يجب أن يبدأ بـ 20';
      }
      return null;
    }

    if (!contract.startsWith('20')) {
      return 'رقم العقد يجب أن يبدأ بـ 20';
    }

    if (contract.length !== 10) {
      return 'رقم العقد يجب أن يكون 10 أرقام';
    }
  }

  // Phone number validation: must start with 05, total 9 or 10 digits
  if ((key === 'رقم الهاتف' || key.includes('رقم الهاتف') || key.includes('الهاتف')) && value && value !== 'N/A') {
    const phone = value.trim();
    if (!/^\d+$/.test(phone)) {
      return 'رقم الهاتف يجب أن يحتوي على أرقام فقط';
    }
    
    // Allow progressive typing of 05 (0 -> 05)
    if (phone.length < 2) {
      if (!'05'.startsWith(phone)) {
        return 'رقم الهاتف يجب أن يبدأ بـ 05';
      }
      return null;
    }
    
    if (!phone.startsWith('05')) {
      return 'رقم الهاتف يجب أن يبدأ بـ 05';
    }
    
    if (phone.length !== 10) {
      return 'رقم الهاتف يجب أن يكون إجمالي الأرقام 10 أرقام';
    }
  }

  // Email validation
  if ((key.includes('البريد الإلكتروني') || key.includes('ايميل')) && value && value !== 'N/A') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'صيغة البريد الإلكتروني غير صحيحة';
    }
  }

  // Check if the key is related to a date field
  if (key.includes('تاريخ') && value) {
    if (key === 'تاريخ العقد' && value !== 'N/A') {
      const s = value.trim();
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
      if (!m) {
        return 'صيغة تاريخ العقد غير صالحة';
      }
      const y = Number(m[1]);
      const mo = Number(m[2]) - 1;
      const d = Number(m[3]);
      const inputDate = new Date(y, mo, d);
      if (inputDate.getFullYear() !== y || inputDate.getMonth() !== mo || inputDate.getDate() !== d) {
        return 'تاريخ العقد غير صالح';
      }
      const t = new Date();
      const today = new Date(t.getFullYear(), t.getMonth(), t.getDate());
      if (inputDate.getTime() > today.getTime()) {
        return 'تاريخ العقد يجب أن يكون اليوم أو تاريخاً سابقاً';
      }
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    const inputDate = new Date(value);

    // Ensure the date is not in the past
    // if (inputDate < today) {
    //   return 'لا يمكن اختيار تاريخ في الماضي';
    // }

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
    if (key === 'تاريخ العقد') {
      const next = value ? clampMusanedContractDateToToday(value) : value;
      setFormData((prev) => ({ ...prev, [key]: next }));
      const error = validateInput(key, next);
      setErrors((prev) => ({ ...prev, [key]: error || '' }));
      return;
    }

    // Special handling for phone number: only allow digits and enforce 05 prefix
    if ((key === 'رقم الهاتف' || key.includes('رقم الهاتف') || key.includes('الهاتف'))) {
      const digitsOnly = value.replace(/\D/g, '');
      // Allow only if it starts with 05 or is empty/just "0"
      if (digitsOnly === '' || digitsOnly === '0' || (digitsOnly.startsWith('05') && digitsOnly.length <= 10)) {
        setFormData((prev) => ({ ...prev, [key]: digitsOnly }));
        const error = validateInput(key, digitsOnly);
        setErrors((prev) => ({ ...prev, [key]: error || '' }));
      }
      return;
    }
    
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
      // استبعاد رقم الطلب من البيانات المرسلة لأنه حقل للقراءة فقط
      delete updatedData['رقم الطلب'];
      // استبعاد اسم المكتب الخارجي ودولة المكتب الخارجي من البيانات المرسلة لأنهما حقول للقراءة فقط
      delete updatedData['اسم المكتب الخارجي'];
      delete updatedData['دولة المكتب الخارجي'];
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
    if (onCancel) onCancel();
    setFormData(
      data.reduce((acc, item) => {
        if (item.label.includes('تاريخ ووقت')) {
          const dateTimeString = item.rawValue || '';
          acc[`${item.label}_date`] = dateTimeString.split(' ')[0] || '';
          acc[`${item.label}_time`] = dateTimeString.split(' ')[1] || '';
        } else if (typeof item.value === 'string') {
          acc[item.label] = item.value;
        } else if (typeof item.value === 'number') {
          // تحويل الأرقام إلى نص (مثل رقم الطلب)
          acc[item.label] = String(item.value);
        } else if (typeof item.rawValue === 'string') {
          acc[item.label] = item.rawValue;
        }
        return acc;
      }, {} as Record<string, string>)
    );
  };

  return (
    <section id={id} className="bg-gray-100  rounded-md p-6 mb-6">
      <h3 className="text-2xl font-normal text-center mb-6">{title}</h3>
      {bottomMessage && (
        <div className="flex justify-center items-center mb-4">
          {typeof bottomMessage === 'string' ? (
            <span className="text-red-600 text-sm">{bottomMessage}</span>
          ) : (
            bottomMessage
          )}
        </div>
      )}
      {errors.global && <div className="text-red-600 text-sm mb-4 text-right">{errors.global}</div>}
      <div className={`grid grid-cols-${gridCols} gap-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
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
                  max={item.label === 'تاريخ العقد' ? localTodayYmd() : undefined}
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
                  <div className="relative flex-1">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        placeholder="13:45"
                        value={formData[`${item.label}_time`] || ''}
                        onFocus={() => setActiveTimeField(item.label)}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^0-9:]/g, ''); // Allow only numbers and colon
                          // Automatically add colon if user types two numbers
                          if (val.length === 2 && !val.includes(':') && !e.target.value.endsWith('\u0008')) {
                            val = val + ':';
                          }
                          if (val.length <= 5) {
                            handleInputChange(`${item.label}_time`, val);
                          }
                        }}
                        onBlur={(e) => {
                          // Delay closing to let onClick register
                          setTimeout(() => {
                            setActiveTimeField(null);
                          }, 200);

                          const val = e.target.value;
                          const parts = val.split(':');
                          if (parts.length === 2) {
                            let hours = parts[0].padStart(2, '0');
                            let minutes = parts[1].padEnd(2, '0').substring(0, 2);
                            // Clamp values
                            let hNum = parseInt(hours, 10);
                            let mNum = parseInt(minutes, 10);
                            if (isNaN(hNum) || hNum < 0 || hNum > 23) hours = '00';
                            if (isNaN(mNum) || mNum < 0 || mNum > 59) minutes = '00';
                            handleInputChange(`${item.label}_time`, `${hours}:${minutes}`);
                          }
                        }}
                        className="border border-gray-300 rounded-md p-2 pl-10 text-base text-center w-full focus:outline-none focus:ring-2 focus:ring-teal-800"
                        maxLength={5}
                      />
                      <Clock className="absolute left-3 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>

                    {activeTimeField === item.label && (
                      <div 
                        className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-xl z-50 flex p-2 h-48 justify-around gap-2"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {/* Minutes Column */}
                        <div className="flex-1 flex flex-col items-center">
                          <span className="text-xs text-gray-500 font-bold mb-1">الدقيقة</span>
                          <div className="w-full overflow-y-auto h-full flex flex-col gap-1 pr-1 border border-gray-100 rounded p-1" style={{ direction: 'ltr' }}>
                            {Array.from({ length: 60 }).map((_, m) => {
                              const mStr = String(m).padStart(2, '0');
                              const currentVal = formData[`${item.label}_time`] || '';
                              const selectedMin = currentVal.split(':')[1] || '';
                              const isSelected = selectedMin === mStr;
                              return (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => {
                                    const currentHour = currentVal.split(':')[0] || '12';
                                    handleInputChange(`${item.label}_time`, `${currentHour}:${mStr}`);
                                  }}
                                  className={`py-1 text-xs rounded transition-colors ${
                                    isSelected 
                                      ? 'bg-teal-800 text-white font-bold' 
                                      : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {mStr}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Separator */}
                        <div className="border-r border-gray-200 my-2"></div>

                        {/* Hours Column */}
                        <div className="flex-1 flex flex-col items-center">
                          <span className="text-xs text-gray-500 font-bold mb-1">الساعة</span>
                          <div className="w-full overflow-y-auto h-full flex flex-col gap-1 pr-1 border border-gray-100 rounded p-1" style={{ direction: 'ltr' }}>
                            {Array.from({ length: 24 }).map((_, h) => {
                              const hStr = String(h).padStart(2, '0');
                              const currentVal = formData[`${item.label}_time`] || '';
                              const selectedHour = currentVal.split(':')[0] || '';
                              const isSelected = selectedHour === hStr;
                              return (
                                <button
                                  key={h}
                                  type="button"
                                  onClick={() => {
                                    const currentMin = currentVal.split(':')[1] || '00';
                                    handleInputChange(`${item.label}_time`, `${hStr}:${currentMin}`);
                                  }}
                                  className={`py-1 text-xs rounded transition-colors ${
                                    isSelected 
                                      ? 'bg-teal-800 text-white font-bold' 
                                      : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {hStr}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
                  onOpenFullVisaModal={onAddVisaClick}
                  refetchTrigger={visaRefetchTrigger}
                />
              </div>
            ) : editable && editMode && item.fieldType === 'file' ? (
              <div className="border border-gray-300 rounded-md p-2 text-base text-right">
                {typeof item.value === 'function' ? item.value(true) : item.value}
              </div>
            ) : editable && editMode && item.fieldType === 'city' ? (
              <div className="flex flex-col">
                <CityAutocomplete
                  value={formData[item.label] || ''}
                  onChange={(value) => handleInputChange(item.label, value)}
                  placeholder="ابحث عن مدينة"
                  className="border border-gray-300 rounded-md text-base text-right"
                  error={errors[item.label]}
                />
              </div>
            ) : editable && editMode && item.fieldType === 'saudiCity' ? (
              <div className="flex flex-col">
                <SaudiCityAutocomplete
                  value={formData[item.label] || ''}
                  onChange={(value) => handleInputChange(item.label, value)}
                  placeholder="ابحث عن مدينة سعودية"
                  className="border border-gray-300 rounded-md text-base text-right"
                  error={errors[item.label]}
                />
              </div>
            ) : editable && editMode && item.fieldType === 'phone' ? (
              <div className="flex flex-col">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={formData[item.label] || ''}
                    onChange={(e) => handleInputChange(item.label, e.target.value)}
                    placeholder="05XXXXXXXX"
                    inputMode="numeric"
                    maxLength={10}
                    className={`w-full border ${errors[item.label] ? 'border-red-500' : 'border-gray-300'} rounded-r-md p-2 text-base text-right focus:outline-none`}
                  />
                  {/* <span className="bg-gray-50 border border-r-0 border-gray-300 rounded-l-md py-2 px-3 text-sm text-gray-600 select-none">
                    966+
                  </span> */}
                </div>
                {errors[item.label] && <span className="text-red-600 text-sm text-right">{errors[item.label]}</span>}
              </div>
            ) : editable && editMode && (item.label === 'رقم الطلب' || item.label === 'اسم المكتب الخارجي' || item.label === 'دولة المكتب الخارجي') ? (
              <div className="flex flex-col">
                <input
                  type="text"
                  value={formData[item.label] || (typeof item.value === 'string' ? item.value : String(item.value || ''))}
                  readOnly
                  disabled
                  className="border border-gray-300 rounded-md p-2 text-base text-right bg-gray-100 cursor-not-allowed"
                />
              </div>
            ) : editable && editMode ? (
              <div className="flex flex-col">
                <input
                  type={item.label.includes('البريد الإلكتروني') || item.label.includes('ايميل') ? 'email' : 'text'}
                  value={formData[item.label] || ''}
                  onChange={(e) => handleInputChange(item.label, e.target.value)}
                  className="border border-gray-300 rounded-md p-2 text-base text-right"
                />
                {errors[item.label] && <span className="text-red-600 text-sm text-right">{errors[item.label]}</span>}
              </div>
            ) : (
              <div className="border border-gray-300 rounded-md p-2 text-base text-right min-h-[42px]">
                {typeof item.value === 'string' 
                  ? (item.value || '\u00A0')
                  : typeof item.value === 'function' 
                    ? item.value(false) 
                    : item.value}
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
        {actions.filter(action => !action.disabled).map((action, index) => (
          <button
            key={index}
            className={`px-4 py-2 rounded-md self-start text-sm  ${ // ineed to be in the end
              action.type === 'primary'
                ? 'bg-teal-800 text-white  hover:bg-teal-900'
                : 'bg-teal-800 text-white  hover:bg-teal-900'
            } ${editable && editMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={action.onClick}
            disabled={editable && editMode}
          >
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}