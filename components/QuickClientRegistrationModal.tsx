import React, { useState, useEffect, useRef, useContext } from 'react';
import { ToastContext } from './GlobalToast';

const QuickClientRegistrationModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { showToast } = useContext(ToastContext);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [phoneNumber, setPhoneNumber] = useState('05');
  const [notes, setNotes] = useState('');
  const [clientName, setClientName] = useState('');
  const [source, setSource] = useState('');

  // Refs for auto-focus
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Quick text options for inquiry
  const quickNotes = [
    'غلطان بالرقم',
    'العميل يسأل عن عاملات بالشهر',
    'استفسار عن الأسعار',
    'العميل يستفسر عن التفاويض',
    'طلب خادمة جديدة',
    'العميل يستفسر عن عاملة من الجنسية',
    'شكوى / مشكلة'
  ];

  const nationalities = [
    'الفلبينية',
    'الكينية',
    'الأوغندية',
    'السريلانكية',
    'البنجلاديشية',
    'الإثيوبية'
  ];

  // Listen for ALT+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Alt + Z is pressed (using e.code to ignore keyboard layout/language like Arabic)
      if (e.altKey && e.code === 'KeyZ') {
        e.preventDefault();
        setIsOpen((prev) => {
          if (!prev) {
            // When opening, reset the phone number to 05
            setPhoneNumber('05');
            setNotes('');
            setClientName('');
            setSource('');
          }
          return !prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for custom event to open the modal
  useEffect(() => {
    const handleOpenModal = () => {
      setIsOpen(true);
      setPhoneNumber('05');
      setNotes('');
      setClientName('');
      setSource('');
    };
    window.addEventListener('openQuickClientModal', handleOpenModal);
    return () => window.removeEventListener('openQuickClientModal', handleOpenModal);
  }, []);

  // Auto focus phone input when modal opens
  useEffect(() => {
    if (isOpen && phoneInputRef.current) {
      // Focus and place cursor at the end
      phoneInputRef.current.focus();
      const length = phoneInputRef.current.value.length;
      phoneInputRef.current.setSelectionRange(length, length);
    }
  }, [isOpen]);

  const closeModal = () => {
    setIsOpen(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Prevent removing '05'
    if (!val.startsWith('05')) {
      val = '05';
    }
    
    // Only allow digits
    val = val.replace(/[^\d]/g, '');

    // Max 10 digits
    if (val.length <= 10) {
      setPhoneNumber(val);
      
      // Auto focus next field if 10 digits reached
      if (val.length === 10 && notesRef.current) {
        notesRef.current.focus();
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/quickclients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, notes, clientName, source }),
      });

      if (!res.ok) throw new Error('Failed to save');

      showToast('تم حفظ بيانات الاتصال بنجاح!', 'success');
      
      // Reset form on success
      setPhoneNumber('05');
      setNotes('');
      setClientName('');
      setSource('');
      closeModal();
    } catch (error) {
      console.error(error);
      showToast('حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget;
      if (form.checkValidity()) {
        handleSave(e as unknown as React.FormEvent);
      } else {
        form.reportValidity();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" dir="rtl">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
        
        {/* Header */}
        <div className="bg-[#1A4D4F] p-4 flex justify-between items-center text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            تسجيل اتصال سريع
          </h2>
          <button 
            onClick={closeModal} 
            className="text-white hover:text-red-300 transition-colors font-bold text-2xl leading-none"
            title="إغلاق"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} onKeyDown={handleFormKeyDown} className="p-6 space-y-5">
          
          {/* Phone Number (First) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">رقم الجوال <span className="text-red-500">*</span></label>
            <input 
              ref={phoneInputRef}
              type="tel" 
              required
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="05XXXXXXXX"
              dir="ltr"
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A4D4F] text-left font-bold text-lg tracking-wider"
            />
          </div>

          {/* Inquiry / Notes (Second) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">الاستفسار / الملاحظات <span className="text-red-500">*</span></label>
            <textarea 
              ref={notesRef}
              required
              value={notes}
              onChange={(e) => {
                const val = e.target.value;
                const isBaseNationalityText = notes.trim() === 'العميل يستفسر عن عاملة من الجنسية';
                
                // If the user types a single digit in an empty box
                const num = parseInt(val, 10);
                if (val.length === 1 && !isNaN(num) && num >= 1 && num <= quickNotes.length) {
                  setNotes(quickNotes[num - 1]);
                  return;
                }

                // If the box has the nationality prefix and they type a digit at the end
                if (isBaseNationalityText) {
                  const lastChar = val.slice(-1);
                  const natNum = parseInt(lastChar, 10);
                  if (!isNaN(natNum) && natNum >= 1 && natNum <= nationalities.length) {
                    setNotes('العميل يستفسر عن عاملة من الجنسية ' + nationalities[natNum - 1]);
                    return;
                  }
                }

                setNotes(val);
              }}
              placeholder="عن ماذا يسأل العميل؟... (اكتب رقم الفقاعة لاختيارها سريعاً)"
              rows={2}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A4D4F] resize-none"
            ></textarea>
            
            {/* Quick Note Bubbles */}
            <div className="flex flex-wrap gap-2 mt-2">
              {notes.trim() === 'العميل يستفسر عن عاملة من الجنسية' ? (
                // Show Nationality Bubbles
                nationalities.map((nat, index) => (
                  <button
                    key={'nat-' + index}
                    type="button"
                    onClick={() => setNotes('العميل يستفسر عن عاملة من الجنسية ' + nat)}
                    className="bg-blue-50 hover:bg-[#1A4D4F] hover:text-white text-blue-800 text-xs font-bold py-1.5 px-3 rounded-full transition-colors border border-blue-200"
                  >
                    {index + 1}- {nat}
                  </button>
                ))
              ) : (
                // Show Default Quick Notes
                quickNotes.map((note, index) => (
                  <button
                    key={'note-' + index}
                    type="button"
                    onClick={() => setNotes(prev => prev ? prev + ' - ' + note : note)}
                    className="bg-gray-100 hover:bg-[#1A4D4F] hover:text-white text-gray-700 text-xs font-bold py-1.5 px-3 rounded-full transition-colors border border-gray-200"
                  >
                    {index + 1}- {note}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Client Name (Optional) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">اسم العميل (اختياري)</label>
            <input 
              type="text" 
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="أدخل اسم العميل إن توفر..."
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A4D4F]"
            />
          </div>

          {/* Source (Optional) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">مصدر العميل (اختياري)</label>
            <select 
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A4D4F] bg-white bg-[position:left_0.75rem_center] pr-3 pl-8"
            >
              <option value="">اختر المصدر إن عُرف...</option>
              <option value="snapchat">سناب شات</option>
              <option value="tiktok">تيك توك</option>
              <option value="twitter">تويتر (X)</option>
              <option value="instagram">انستجرام</option>
              <option value="whatsapp">واتساب</option>
              <option value="recommendation">توصية من عميل آخر</option>
              <option value="other">أخرى</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button 
              type="button" 
              onClick={closeModal}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md font-bold hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-6 py-2 bg-[#1A4D4F] text-white rounded-md font-bold hover:bg-[#164044] transition-colors shadow-md flex items-center justify-center min-w-[140px] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'حفظ البيانات'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickClientRegistrationModal;
