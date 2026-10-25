import React, { useRef } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

export const toEnglishDigits = (str: string): string => {
  if (!str) return '';
  return String(str)
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48));
};

export interface DateInputFieldProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  infoTooltip?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  accentColor?: 'teal' | 'red' | 'yellow' | 'blue';
}

export const DateInputField: React.FC<DateInputFieldProps> = ({
  label,
  value,
  onChange,
  name,
  required,
  disabled = false,
  infoTooltip,
  placeholder = 'YYYY-MM-DD',
  className = '',
  inputClassName = '',
  accentColor = 'teal',
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const formattedVal = value ? value.split('T')[0] : '';

  const focusBorderColor =
    accentColor === 'red'
      ? 'focus:border-red-500 focus:ring-red-500/10'
      : accentColor === 'yellow'
      ? 'focus:border-yellow-500 focus:ring-yellow-500/10'
      : accentColor === 'blue'
      ? 'focus:border-blue-500 focus:ring-blue-500/10'
      : 'focus:border-teal-700 focus:ring-teal-700/10';

  const hoverColor =
    accentColor === 'red'
      ? 'hover:text-red-600'
      : accentColor === 'yellow'
      ? 'hover:text-yellow-600'
      : accentColor === 'blue'
      ? 'hover:text-blue-600'
      : 'hover:text-teal-700';

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <label className="text-xs sm:text-sm font-bold text-gray-700 text-right">
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
      )}
      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="numeric"
          name={name}
          value={formattedVal}
          disabled={disabled}
          placeholder={placeholder}
          dir="ltr"
          onChange={(e) => {
            const v = toEnglishDigits(e.target.value);
            onChange(v);
          }}
          className={`w-full border rounded-lg p-2.5 pl-9 text-xs sm:text-sm font-mono text-center outline-none transition-all ${
            disabled
              ? 'bg-gray-100/90 border-gray-200 text-gray-500 cursor-not-allowed'
              : `bg-white border-gray-300 ${focusBorderColor} focus:ring-2 text-gray-800`
          } ${inputClassName}`}
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
            className={`absolute left-2.5 p-1 text-gray-400 ${hoverColor} transition-colors cursor-pointer`}
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
          onChange={(e) => onChange(toEnglishDigits(e.target.value))}
          className="sr-only"
        />
      </div>
    </div>
  );
};

export interface TimeInputFieldProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  accentColor?: 'teal' | 'red' | 'yellow' | 'blue';
}

export const TimeInputField: React.FC<TimeInputFieldProps> = ({
  label,
  value,
  onChange,
  name,
  required,
  disabled = false,
  placeholder = 'HH:MM',
  className = '',
  inputClassName = '',
  accentColor = 'teal',
}) => {
  const timeInputRef = useRef<HTMLInputElement>(null);

  const focusBorderColor =
    accentColor === 'red'
      ? 'focus:border-red-500 focus:ring-red-500/10'
      : accentColor === 'yellow'
      ? 'focus:border-yellow-500 focus:ring-yellow-500/10'
      : accentColor === 'blue'
      ? 'focus:border-blue-500 focus:ring-blue-500/10'
      : 'focus:border-teal-700 focus:ring-teal-700/10';

  const hoverColor =
    accentColor === 'red'
      ? 'hover:text-red-600'
      : accentColor === 'yellow'
      ? 'hover:text-yellow-600'
      : accentColor === 'blue'
      ? 'hover:text-blue-600'
      : 'hover:text-teal-700';

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-xs sm:text-sm font-bold text-gray-700 text-right">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="numeric"
          name={name}
          value={value || ''}
          disabled={disabled}
          placeholder={placeholder}
          dir="ltr"
          onChange={(e) => {
            const v = toEnglishDigits(e.target.value);
            onChange(v);
          }}
          className={`w-full border rounded-lg p-2.5 pl-9 text-xs sm:text-sm font-mono text-center outline-none transition-all ${
            disabled
              ? 'bg-gray-100/90 border-gray-200 text-gray-500 cursor-not-allowed'
              : `bg-white border-gray-300 ${focusBorderColor} focus:ring-2 text-gray-800`
          } ${inputClassName}`}
        />
        {!disabled && (
          <button
            type="button"
            onClick={() => {
              if (timeInputRef.current) {
                if (typeof timeInputRef.current.showPicker === 'function') {
                  timeInputRef.current.showPicker();
                } else {
                  timeInputRef.current.focus();
                }
              }
            }}
            className={`absolute left-2.5 p-1 text-gray-400 ${hoverColor} transition-colors cursor-pointer`}
            title="اختر الوقت"
          >
            <Clock className="w-4 h-4" />
          </button>
        )}
        <input
          ref={timeInputRef}
          type="time"
          tabIndex={-1}
          disabled={disabled}
          value={value || ''}
          onChange={(e) => onChange(toEnglishDigits(e.target.value))}
          className="sr-only"
        />
      </div>
    </div>
  );
};
