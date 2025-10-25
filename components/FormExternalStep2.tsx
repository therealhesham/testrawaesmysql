import { CheckIcon } from '@heroicons/react/outline';
import { de } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import { useState } from 'react';
import AlertModal from './AlertModal';

interface FormStepExternal2Props {
  onPrevious: () => void;
  onClose: () => void;
  data: any;
}

export default function FormStepExternal2({ onPrevious, onClose, data }: FormStepExternal2Props) {
  const [formData, setFormData] = useState({
    externaldeparatureCity: '',
    externalReason: '',
    externalArrivalCity: '',
    externalArrivalCityDate: '',
    externalArrivalCityTime: '',
    externaldeparatureDate: '',
    externaldeparatureTime: '',
    notes: ''
  });

  const [errors, setErrors] = useState({
    externaldeparatureCity: '',
    externalReason: '',
    externalArrivalCity: '',
    externalArrivalCityDate: '',
    externalArrivalCityTime: '',
    externaldeparatureDate: '',
    externaldeparatureTime: '',
    internalTicketFile: ''
  });

  const [uploadError, setUploadError] = useState('');
  const [fileUploaded, setFileUploaded] = useState(false);
  const [internalTicketFile, setInternalTicketFile] = useState<string>('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [alertMessage, setAlertMessage] = useState('');

  // Regular expressions for validation
  const cityRegex = /^[a-zA-Z\s\u0600-\u06FF]+$/; // Allows letters and Arabic characters, no numbers or special chars
  const reasonRegex = /^[a-zA-Z0-9\s\u0600-\u06FF.,-]+$/; // Allows letters, numbers, Arabic, and some punctuation
  const maxFileSize = 5 * 1024 * 1024; // 5MB max file size

  // File upload handler with enhanced validation
  const handleTicketFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setUploadError('لم يتم اختيار ملف');
      setErrors(prev => ({ ...prev, internalTicketFile: 'يجب رفع ملف التذكرة' }));
      setFileUploaded(false);
      return;
    }

    const file = files[0];
    const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    // Validate file type
    if (!allowedFileTypes.includes(file.type)) {
      setUploadError('نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)');
      setErrors(prev => ({ ...prev, internalTicketFile: 'نوع الملف غير مدعوم' }));
      setFileUploaded(false);
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setUploadError('حجم الملف كبير جدًا (الحد الأقصى 5 ميجابايت)');
      setErrors(prev => ({ ...prev, internalTicketFile: 'حجم الملف كبير جدًا' }));
      setFileUploaded(false);
      return;
    }

    try {
      setUploadError('');
      setErrors(prev => ({ ...prev, internalTicketFile: '' }));
      const res = await fetch(`/api/upload-presigned-url/internalTicketFile`);
      if (!res.ok) {
        throw new Error('فشل في الحصول على رابط الرفع');
      }
      const { url, filePath } = await res.json();

      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (uploadRes.ok) {
        setInternalTicketFile(filePath);
        setFileUploaded(true);
        setUploadError('');
      } else {
        throw new Error('فشل في رفع الملف');
      }
    } catch (error: any) {
      setUploadError(error.message || 'حدث خطأ أثناء رفع الملف');
      setErrors(prev => ({ ...prev, internalTicketFile: 'حدث خطأ أثناء رفع الملف' }));
      setFileUploaded(false);
    }
  };

  // Enhanced form validation
  const validateForm = () => {
    const newErrors = {
      externaldeparatureCity: '',
      externalReason: '',
      externalArrivalCity: '',
      externalArrivalCityDate: '',
      externalArrivalCityTime: '',
      externaldeparatureDate: '',
      externaldeparatureTime: '',
      internalTicketFile: ''
    };
    let isValid = true;

    // Current date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    // Validate departure city
    if (!formData.externaldeparatureCity.trim()) {
      newErrors.externaldeparatureCity = 'وجهة المغادرة مطلوبة';
      isValid = false;
    } else if (!cityRegex.test(formData.externaldeparatureCity.trim())) {
      newErrors.externaldeparatureCity = 'وجهة المغادرة يجب أن تحتوي على حروف فقط';
      isValid = false;
    }

    // Validate reason
    if (!formData.externalReason.trim()) {
      newErrors.externalReason = 'سبب المغادرة مطلوب';
      isValid = false;
    } else if (!reasonRegex.test(formData.externalReason.trim())) {
      newErrors.externalReason = 'سبب المغادرة يحتوي على أحرف غير صالحة';
      isValid = false;
    } else if (formData.externalReason.trim().length < 5) {
      newErrors.externalReason = 'سبب المغادرة يجب أن يكون 5 أحرف على الأقل';
      isValid = false;
    }

    // Validate arrival city
    if (!formData.externalArrivalCity.trim()) {
      newErrors.externalArrivalCity = 'وجهة الوصول مطلوبة';
      isValid = false;
    } else if (!cityRegex.test(formData.externalArrivalCity.trim())) {
      newErrors.externalArrivalCity = 'وجهة الوصول يجب أن تحتوي على حروف فقط';
      isValid = false;
    }

    // Validate departure date
    if (!formData.externaldeparatureDate) {
      newErrors.externaldeparatureDate = 'تاريخ المغادرة مطلوب';
      isValid = false;
    } else {
      const departureDate = new Date(formData.externaldeparatureDate);
      if (isNaN(departureDate.getTime())) {
        newErrors.externaldeparatureDate = 'تاريخ المغادرة غير صالح';
        isValid = false;
      } else if (departureDate < today) {
        newErrors.externaldeparatureDate = 'تاريخ المغادرة لا يمكن أن يكون في الماضي';
        isValid = false;
      }
    }

    // Validate departure time
    if (!formData.externaldeparatureTime) {
      newErrors.externaldeparatureTime = 'وقت المغادرة مطلوب';
      isValid = false;
    }

    // Validate arrival date
    if (!formData.externalArrivalCityDate) {
      newErrors.externalArrivalCityDate = 'تاريخ الوصول مطلوب';
      isValid = false;
    } else {
      const arrivalDate = new Date(formData.externalArrivalCityDate);
      const departureDate = new Date(formData.externaldeparatureDate);
      if (isNaN(arrivalDate.getTime())) {
        newErrors.externalArrivalCityDate = 'تاريخ الوصول غير صالح';
        isValid = false;
      } else if (arrivalDate < departureDate) {
        newErrors.externalArrivalCityDate = 'تاريخ الوصول لا يمكن أن يكون قبل تاريخ المغادرة';
        isValid = false;
      }
    }

    // Validate arrival time
    if (!formData.externalArrivalCityTime) {
      newErrors.externalArrivalCityTime = 'وقت الوصول مطلوب';
      isValid = false;
    } else if (
      formData.externaldeparatureDate === formData.externalArrivalCityDate &&
      formData.externaldeparatureTime >= formData.externalArrivalCityTime
    ) {
      newErrors.externalArrivalCityTime = 'وقت الوصول يجب أن يكون بعد وقت المغادرة في نفس اليوم';
      isValid = false;
    }

    // Validate file upload
    if (!internalTicketFile) {
      newErrors.internalTicketFile = 'يجب رفع ملف التذكرة';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setAlertType('error');
      setAlertMessage('يرجى تصحيح الأخطاء في النموذج');
      setShowAlert(true);
      return;
    }

    try {
      const postData = await fetch('/api/updatehomemaidarrivalexternalprisma', {
        method: 'POST',
        body: JSON.stringify({
          Orderid: data?.Order?.id,
          id: data?.id,
          externalReason: formData.externalReason.trim(),
          externalTicketFile: internalTicketFile,
          notes: formData.notes.trim(),
          externaldeparatureDate: formData.externaldeparatureDate,
          externaldeparatureCity: formData.externaldeparatureCity.trim(),
          externaldeparatureTime: formData.externaldeparatureTime,
          externalArrivalCity: formData.externalArrivalCity.trim(),
          externalArrivalCityDate: formData.externalArrivalCityDate,
          externalArrivalCityTime: formData.externalArrivalCityTime,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (postData.status === 200) {
        setAlertType('success');
        setAlertMessage('تم الحفظ بنجاح');
        setShowAlert(true);
        setTimeout(() => {
          window.location.reload();
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
              className={`bg-gray-50 border ${errors.externalReason ? 'border-red-500' : 'border-gray-300'} rounded text-gray-800 text-md`} 
              value={formData.externalReason} 
              onChange={(e) => setFormData({ ...formData, externalReason: e.target.value })} 
              placeholder="سبب المغادرة" 
            />
            {errors.externalReason && <span className="text-red-500 text-xs text-right">{errors.externalReason}</span>}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="departure-from" className="text-xs text-gray-500 text-right font-inter">من</label>
            <input 
              type="text" 
              id="departure-from" 
              className={`bg-gray-50 border ${errors.externaldeparatureCity ? 'border-red-500' : 'border-gray-300'} rounded text-gray-800 text-md`} 
              value={formData.externaldeparatureCity} 
              onChange={(e) => setFormData({ ...formData, externaldeparatureCity: e.target.value })} 
              placeholder="وجهة المغادرة" 
            />
            {errors.externaldeparatureCity && <span className="text-red-500 text-xs text-right">{errors.externaldeparatureCity}</span>}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="arrival-destination" className="text-xs text-gray-500 text-right font-inter">الى</label>
            <input 
              type="text" 
              id="arrival-destination" 
              className={`bg-gray-50 border ${errors.externalArrivalCity ? 'border-red-500' : 'border-gray-300'} rounded text-gray-800 text-md`} 
              placeholder="وجهة الوصول" 
              value={formData.externalArrivalCity} 
              onChange={(e) => setFormData({ ...formData, externalArrivalCity: e.target.value })} 
            />
            {errors.externalArrivalCity && <span className="text-red-500 text-xs text-right">{errors.externalArrivalCity}</span>}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="departure-date" className="text-xs text-gray-500 text-right font-inter">تاريخ المغادرة</label>
            <div className="relative">
              <input 
                type="date" 
                id="departure-date" 
                className={`bg-gray-50 border ${errors.externaldeparatureDate ? 'border-red-500' : 'border-gray-300'} rounded text-gray-800 text-md w-full`} 
                placeholder="ادخل تاريخ ووقت المغادرة"  
                value={formData.externaldeparatureDate} 
                onChange={(e) => setFormData({ ...formData, externaldeparatureDate: e.target.value })}
              />
            </div>
            {errors.externaldeparatureDate && <span className="text-red-500 text-xs text-right">{errors.externaldeparatureDate}</span>}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="departure-time" className="text-xs text-gray-500 text-right font-inter">وقت المغادرة</label>
            <input 
              type="time" 
              id="departure-time" 
              className={`bg-gray-50 border ${errors.externaldeparatureTime ? 'border-red-500' : 'border-gray-300'} rounded text-gray-800 text-md`} 
              value={formData.externaldeparatureTime} 
              onChange={(e) => setFormData({ ...formData, externaldeparatureTime: e.target.value })} 
            />
            {errors.externaldeparatureTime && <span className="text-red-500 text-xs text-right">{errors.externaldeparatureTime}</span>}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="arrival-time" className="text-xs text-gray-500 text-right font-inter">وقت الوصول</label>
            <input 
              type="time" 
              id="arrival-time" 
              className={`bg-gray-50 border ${errors.externalArrivalCityTime ? 'border-red-500' : 'border-gray-300'} rounded text-gray-800 text-md`} 
              value={formData.externalArrivalCityTime} 
              onChange={(e) => setFormData({ ...formData, externalArrivalCityTime: e.target.value })} 
            />
            {errors.externalArrivalCityTime && <span className="text-red-500 text-xs text-right">{errors.externalArrivalCityTime}</span>}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="arrival-date" className="text-xs text-gray-500 text-right font-inter">تاريخ الوصول</label>
            <div className="relative">
              <input 
                type="date" 
                id="arrival-date" 
                className={`bg-gray-50 border ${errors.externalArrivalCityDate ? 'border-red-500' : 'border-gray-300'} rounded text-gray-800 text-md w-full`} 
                placeholder="ادخل تاريخ ووقت الوصول"  
                value={formData.externalArrivalCityDate} 
                onChange={(e) => setFormData({ ...formData, externalArrivalCityDate: e.target.value })}
              />
            </div>
            {errors.externalArrivalCityDate && <span className="text-red-500 text-xs text-right">{errors.externalArrivalCityDate}</span>}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="ticket-upload" className="text-xs text-gray-500 text-right font-inter">ارفاق التذكرة</label>
            <div className="flex items-center justify-between bg-gray-50 border rounded p-1 pl-3">
              <span className="text-md text-gray-500 font-tajawal">{fileUploaded ? 'تم رفع الملف بنجاح' : 'ارفاق ملف التذكرة'}</span>
              <label htmlFor="ticket-upload-btn" className="bg-teal-800 text-white text-xs font-tajawal px-4 py-2 rounded cursor-pointer">اختيار ملف</label>
              <input
                placeholder={fileUploaded ? 'تم رفع الملف بنجاح' : 'ارفاق ملف التذكرة'}
                type="file"
                id="ticket-upload-btn"
                className="hidden"
                onChange={handleTicketFileChange}
              />
            </div>
            {(errors.internalTicketFile || uploadError) && (
              <span className="text-red-500 text-xs text-right">{errors.internalTicketFile || uploadError}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="additional-notes" className="text-xs text-gray-500 text-right font-inter">ملاحظات اضافية</label>
          <textarea 
            id="additional-notes" 
            className="bg-gray-50 border border-gray-300 rounded text-gray-800 text-md min-h-[60px] resize-y" 
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