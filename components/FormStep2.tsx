import { CheckIcon } from '@heroicons/react/outline';
import { Calendar } from 'lucide-react';
import { useState } from 'react';
import AlertModal from './AlertModal';

interface FormStep2Props {
  onPrevious: () => void;
  onClose: () => void;
  data: any;
  onSuccess?: () => void;
}

export default function FormStep2({ onPrevious, onClose, data, onSuccess }: FormStep2Props) {
  const [formData, setFormData] = useState({
    ArrivalCity: '',
    finaldestination: '',
    internalReason: '',
    deparatureTime: '',
    finalDestinationDate: '',
    finalDestinationTime: '',
    deparatureDate: '',
    notes: ''
  });

  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [alertMessage, setAlertMessage] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const postData = await fetch('/api/updatehomemaidarrivalprisma', {
        method: 'POST',
        body: JSON.stringify({
          Orderid: data?.Order?.id, // Use correct field from data
          id: data?.id, // Assuming data has an id field
          ArrivalCity: formData.ArrivalCity,
          finaldestination: formData.finaldestination,
          internalReason: formData.internalReason,
          notes: formData.notes,
          deparatureTime: formData.deparatureTime,
          finalDestinationDate: formData.finalDestinationDate,
          finalDestinationTime: formData.finalDestinationTime,
          deparatureDate: formData.deparatureDate,
          // الحقول الجديدة للمغادرة الداخلية
          internaldeparatureCity: formData.ArrivalCity, // مدينة المغادرة = من
          internaldeparatureDate: formData.deparatureDate, // تاريخ المغادرة = تاريخ المغادرة
          internalArrivalCity: formData.finaldestination, // مدينة الوصول = الى
          internalArrivalCityDate: formData.finalDestinationDate, // تاريخ الوصول = تاريخ الوصول
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (postData.status === 200) {
        setAlertType('success');
        setAlertMessage('تم الحفظ بنجاح');
        setShowAlert(true);
        // استخدام onSuccess بدلاً من إعادة تحميل الصفحة
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
          onClose();
        }, 2000);
      } else {
        setAlertType('error');
        setAlertMessage('حدث خطأ أثناء الحفظ');
        setShowAlert(true);
      }
    } catch (error) {
      setAlertType('error');
      setAlertMessage('حدث خطأ أثناء الحفظ');
      setShowAlert(true);
    }
  };

  return (
    <section id="form-step2">
      <h2 className="text-2xl font-normal text-black text-right mb-12">تسجيل مغادرة</h2>
      <div className="flex items-start justify-center mb-12 px-[20%]">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="w-6 h-6 rounded-full flex items-center justify-center border border-teal-800 bg-teal-800">
            <CheckIcon className="w-4 h-4 text-white" />
          </div>
          <span className="text-md text-black whitespace-nowrap">بيانات الطلب</span>
        </div>
        <div className="flex-1 h-px bg-gray-500 mt-3 mx-[-20px]"></div>
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="w-6 h-6 rounded-full flex items-center justify-center border border-teal-800 bg-teal-800 text-white text-md">2</div>
          <span className="text-md text-black whitespace-nowrap">بيانات المغادرة</span>
        </div>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="departure-reason" className="text-xs text-gray-500 text-right font-inter">سبب المغادرة</label>
            <input 
              type="text" 
              id="departure-reason" 
              className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md" 
              value={formData.internalReason} 
              onChange={(e) => setFormData({ ...formData, internalReason: e.target.value })} 
              placeholder="سبب المغادرة" 
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="departure-from" className="text-xs text-gray-500 text-right font-inter">من</label>
            <input 
              type="text" 
              id="departure-from" 
              className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md" 
              value={formData.ArrivalCity} 
              onChange={(e) => setFormData({ ...formData, ArrivalCity: e.target.value })} 
              placeholder="وجهة المغادرة" 
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="arrival-destination" className="text-xs text-gray-500 text-right font-inter">الى</label>
            <input 
              type="text" 
              id="arrival-destination" 
              className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md" 
              placeholder="وجهة الوصول" 
              value={formData.finaldestination} 
              onChange={(e) => setFormData({ ...formData, finaldestination: e.target.value })} 
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="departure-date" className="text-xs text-gray-500 text-right font-inter">تاريخ المغادرة</label>
            <div className="relative">
              <input 
                type="date" 
                id="departure-date" 
                className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md w-full" 
                placeholder="ادخل تاريخ ووقت المغادرة"  
                value={formData.deparatureDate} 
                onChange={(e) => setFormData({ ...formData, deparatureDate: e.target.value })} 
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="arrival-date" className="text-xs text-gray-500 text-right font-inter">تاريخ الوصول</label>
            <div className="relative">
              <input 
                type="date" 
                id="arrival-date" 
                className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md w-full" 
                placeholder="ادخل تاريخ ووقت الوصول"  
                value={formData.finalDestinationDate} 
                onChange={(e) => setFormData({ ...formData, finalDestinationDate: e.target.value })} 
              />
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="ticket-upload" className="text-xs text-gray-500 text-right font-inter">ارفاق التذكرة</label>
            <div className="flex items-center justify-between bg-gray-50 border border-gray-300 rounded p-1 pl-3">
              <span className="text-md text-gray-500 font-tajawal">ارفاق ملف التذكرة</span>
              <label htmlFor="ticket-upload-btn" className="bg-teal-800 text-white text-xs font-tajawal px-4 py-2 rounded cursor-pointer">اختيار ملف</label>
              <input type="file" id="ticket-upload-btn" className="hidden" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="additional-notes" className="text-xs text-gray-500 text-right font-inter">ملاحظات اضافية</label>
          <textarea 
            id="additional-notes" 
            className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md min-h-[60px] resize-y" 
            placeholder="ملاحظات اضافية" 
            value={formData.notes} 
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          ></textarea>
        </div>
        <div className="flex justify-center mt-6 gap-10">
          <button
            type="button"
            onClick={onPrevious}
            className="w-28 py-2 bg-white text-gray-800 text-base border border-teal-800 rounded font-inter"
          >
            السابق
          </button>
          <button
            type="submit"
            className="w-28 py-2 bg-teal-800 text-white text-base rounded font-inter"
          >
            حفظ
          </button>
        </div>
      </form>
      
      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        type={alertType}
        title={alertType === 'success' ? 'نجح الحفظ' : 'خطأ في الحفظ'}
        message={alertMessage}
        autoClose={true}
        autoCloseDelay={3000}
      />
    </section>
  );
}