import { CheckIcon } from '@heroicons/react/outline';
import { de } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import { useState } from 'react';

export default function FormStepExternal2({ onPrevious, onClose, data }) {
const [formData, setFormData] = useState({
  ArrivalCity: '',
  externalReason: '',
  arrivalOutSaudiCity: '',
  arrivalOutSaudiDate: '',
  DeparatureFromSaudiCity: '',
  deparatureOutSaudiDate: '',
  notes: ''
});
  const handleSubmit = async (e) => {
    e.preventDefault();
    const postData = await fetch('/api/updatehomemaidarrivalexternalprisma', {
      method: 'POST',
      body: JSON.stringify({
        Orderid: data?.Order?.id, // Use correct field from data
        id: data?.id, // Assuming data has an id field
        externalReason: formData.externalReason,
        notes: formData.notes,
        DeparatureFromSaudiDate: formData.deparatureOutSaudiDate,
        DeparatureFromSaudiCity: formData.DeparatureFromSaudiCity,
        arrivalOutSaudiCity: formData.arrivalOutSaudiCity,
        arrivalOutSaudiDate: formData.arrivalOutSaudiDate,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (postData.status === 200) alert('تم الحفظ بنجاح');
    onClose(); // Close modal after successful submission
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
              value={formData.externalReason} 
              onChange={(e) => setFormData({ ...formData, externalReason: e.target.value })} 
              placeholder="سبب المغادرة" 
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="departure-from" className="text-xs text-gray-500 text-right font-inter">من</label>
            <input 
              type="text" 
              id="departure-from" 
              className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md" 
              value={formData.DeparatureFromSaudiCity} 
              onChange={(e) => setFormData({ ...formData, DeparatureFromSaudiCity: e.target.value })} 
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
              value={formData.arrivalOutSaudiCity} 
              onChange={(e) => setFormData({ ...formData, arrivalOutSaudiCity: e.target.value })} 
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
                value={formData.deparatureOutSaudiDate} 
                onChange={(e) => setFormData({ ...formData, deparatureOutSaudiDate: e.target.value })} 
              />
              <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
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
                value={formData.arrivalOutSaudiDate} 
                onChange={(e) => setFormData({ ...formData, arrivalOutSaudiDate: e.target.value })} 
              />
              <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
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
    </section>
  );
}