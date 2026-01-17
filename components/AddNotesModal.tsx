import React, { useState, useRef, useEffect } from 'react';
import { X, Calendar, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface AddNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  clientName: string;
  onSuccess: () => void;
}

// Custom Date Picker Component
const CustomDatePicker: React.FC<{
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = "اختر التاريخ" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const days = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    onChange(newDate.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return cellDate.toDateString() === today.toDateString();
  };

  const isSelected = (day: number | null) => {
    if (!day || !selectedDate) return false;
    const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return cellDate.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-lg py-3 pl-12 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 hover:border-gray-300 shadow-sm text-right"
      >
        {value ? new Date(value).toLocaleDateString() : placeholder}
      </button>
      
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Calendar className="w-5 h-5 text-teal-600" />
      </div>
      
 
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold">
                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 bg-gray-50">
            {days.map(day => (
              <div key={day} className="p-2 text-center text-xs font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 p-2">
            {getDaysInMonth(currentMonth).map((day, index) => (
              <button
                key={index}
                onClick={() => day && handleDateSelect(day)}
                disabled={!day}
                className={`
                  p-2 text-sm rounded-lg transition-all duration-200
                  ${!day ? 'invisible' : ''}
                  ${isToday(day) ? 'bg-teal-100 text-teal-700 font-semibold' : ''}
                  ${isSelected(day) ? 'bg-teal-500 text-white font-semibold' : ''}
                  ${!isSelected(day) && !isToday(day) ? 'hover:bg-gray-100 text-gray-700' : ''}
                  ${day && !isSelected(day) && !isToday(day) ? 'hover:scale-105' : ''}
                `}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-3 border-t border-gray-200">
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>اليوم: {new Date().toLocaleDateString()}</span>
              <button
                onClick={() => {
                  const today = new Date();
                  setSelectedDate(today);
                  onChange(today.toISOString().split('T')[0]);
                  setIsOpen(false);
                }}
                className="px-3 py-1 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
              >
                اليوم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AddNotesModal: React.FC<AddNotesModalProps> = ({
  isOpen,
  onClose,
  clientId,
  clientName,
  onSuccess
}) => {
  const [notes, setNotes] = useState('');
  const [notesDate, setNotesDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('يرجى إدخال الملاحظة');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/update-client-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          notes: notes.trim(),
          notesDate: new Date(notesDate).toISOString()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNotes('');
        setNotesDate(new Date().toISOString().split('T')[0]);
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'حدث خطأ أثناء حفظ الملاحظة');
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      setError('حدث خطأ أثناء حفظ الملاحظة');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <FileText className="w-6 h-6 text-teal-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              إضافة ملاحظة للعميل
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-100">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-teal-700">العميل:</span> 
            <span className="mr-2 font-medium text-gray-800">{clientName}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-dark mb-2">
              تاريخ الملاحظة
            </label>
            <CustomDatePicker
              value={notesDate}
              onChange={setNotesDate}
              placeholder="اختر تاريخ الملاحظة"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-text-dark mb-2">
              الملاحظة
            </label>
            <div className="relative group">
              <div className="absolute top-3 left-3 pointer-events-none">
                <FileText className="w-5 h-5 text-teal-600 group-focus-within:text-teal-800 transition-colors" />
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أدخل الملاحظة هنا..."
                className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-lg py-3 pl-12 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 hover:border-gray-300 shadow-sm resize-none"
                rows={4}
                required
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                </div>
                <div className="mr-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري الحفظ...
                </span>
              ) : (
                'حفظ الملاحظة'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNotesModal;
