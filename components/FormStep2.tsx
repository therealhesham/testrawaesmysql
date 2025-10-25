import { CheckIcon } from '@heroicons/react/outline';
import { Calendar } from 'lucide-react';
import { useState, useRef } from 'react';
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

  const [errors, setErrors] = useState({
    ArrivalCity: '',
    finaldestination: '',
    internalReason: '',
    deparatureDate: '',
    finalDestinationDate: '',
    internalTicketFile: ''
  });

  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [alertMessage, setAlertMessage] = useState('');
  
  const [internalTicketFile, setInternalTicketFile] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileUploaded, setFileUploaded] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const ticketFileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = () => {
    const newErrors = {
      ArrivalCity: '',
      finaldestination: '',
      internalReason: '',
      deparatureDate: '',
      finalDestinationDate: '',
      internalTicketFile: ''
    };
    let isValid = true;

    // Required field validations
    if (!formData.ArrivalCity.trim()) {
      newErrors.ArrivalCity = 'مدينة المغادرة مطلوبة';
      isValid = false;
    }
    if (!formData.finaldestination.trim()) {
      newErrors.finaldestination = 'مدينة الوصول مطلوبة';
      isValid = false;
    }
    if (!formData.internalReason.trim()) {
      newErrors.internalReason = 'سبب المغادرة مطلوب';
      isValid = false;
    }
    if (!formData.deparatureDate) {
      newErrors.deparatureDate = 'تاريخ المغادرة مطلوب';
      isValid = false;
    }
    if (!formData.finalDestinationDate) {
      newErrors.finalDestinationDate = 'تاريخ الوصول مطلوب';
      isValid = false;
    }
    if (!internalTicketFile) {
      newErrors.internalTicketFile = 'ملف التذكرة مطلوب';
      isValid = false;
    }

    // Date validation
    if (formData.deparatureDate && formData.finalDestinationDate) {
      const depDate = new Date(formData.deparatureDate);
      const arrDate = new Date(formData.finalDestinationDate);
      if (depDate > arrDate) {
        newErrors.finalDestinationDate = 'تاريخ الوصول يجب أن يكون بعد تاريخ المغادرة';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleTicketFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setUploadError('لم يتم اختيار ملف');
      setFileUploaded(false);
      setFileName('');
      setErrors({ ...errors, internalTicketFile: 'لم يتم اختيار ملف' });
      return;
    }

    const file = files[0];
    const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    
    if (!allowedFileTypes.includes(file.type)) {
      setUploadError('نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)');
      setFileUploaded(false);
      setFileName('');
      setErrors({ ...errors, internalTicketFile: 'نوع الملف غير مدعوم' });
      return;
    }

    try {
      setUploadError('');
      setFileName(file.name);
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
        setErrors({ ...errors, internalTicketFile: '' });
      } else {
        throw new Error('فشل في رفع الملف');
      }
    } catch (error: any) {
      setUploadError(error.message || 'حدث خطأ أثناء رفع الملف');
      setFileUploaded(false);
      setFileName('');
      setErrors({ ...errors, internalTicketFile: error.message || 'حدث خطأ أثناء رفع الملف' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setAlertType('error');
      setAlertMessage('يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
      setShowAlert(true);
      return;
    }

    try {
      const postData = await fetch('/api/updatehomemaidarrivalprisma', {
        method: 'POST',
        body: JSON.stringify({
          Orderid: data?.Order?.id,
          id: data?.id,
          ArrivalCity: formData.ArrivalCity,
          internalReason: formData.internalReason,
          notes: formData.notes,
          deparatureTime: formData.deparatureTime,
          internaldeparatureCity: formData.ArrivalCity,
          internaldeparatureDate: formData.deparatureDate,
          internalArrivalCity: formData.finaldestination,
          internalArrivalCityDate: formData.finalDestinationDate,
          internalTicketFile: internalTicketFile,
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
              className={`bg-gray-50 border ${errors.internalReason ? 'border-red-500' : 'border-gray-300'} rounded p-3 text-gray-800 text-md`} 
              value={formData.internalReason} 
              onChange={(e) => setFormData({ ...formData, internalReason: e.target.value })} 
              placeholder="سبب المغادرة" 
            />
            {errors.internalReason && (
              <span className="text-red-500 text-xs text-right">{errors.internalReason}</span>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="departure-from" className="text-xs text-gray-500 text-right font-inter">من</label>
            <input 
              type="text" 
              id="departure-from" 
              className={`bg-gray-50 border ${errors.ArrivalCity ? 'border-red-500' : 'border-gray-300'} rounded p-3 text-gray-800 text-md`} 
              value={formData.ArrivalCity} 
              onChange={(e) => setFormData({ ...formData, ArrivalCity: e.target.value })} 
              placeholder="وجهة المغادرة" 
            />
            {errors.ArrivalCity && (
              <span className="text-red-500 text-xs text-right">{errors.ArrivalCity}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="arrival-destination" className="text-xs text-gray-500 text-right font-inter">الى</label>
            <input 
              type="text" 
              id="arrival-destination" 
              className={`bg-gray-50 border ${errors.finaldestination ? 'border-red-500' : 'border-gray-300'} rounded p-3 text-gray-800 text-md`} 
              placeholder="وجهة الوصول" 
              value={formData.finaldestination} 
              onChange={(e) => setFormData({ ...formData, finaldestination: e.target.value })} 
            />
            {errors.finaldestination && (
              <span className="text-red-500 text-xs text-right">{errors.finaldestination}</span>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="departure-date" className="text-xs text-gray-500 text-right font-inter">تاريخ المغادرة</label>
            <div className="relative">
              <input 
                type="date" 
                id="departure-date" 
                className={`bg-gray-50 border ${errors.deparatureDate ? 'border-red-500' : 'border-gray-300'} rounded p-3 text-gray-800 text-md w-full`} 
                placeholder="ادخل تاريخ ووقت المغادرة"  
                value={formData.deparatureDate} 
                onChange={(e) => setFormData({ ...formData, deparatureDate: e.target.value })} 
              />
            </div>
            {errors.deparatureDate && (
              <span className="text-red-500 text-xs text-right">{errors.deparatureDate}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="arrival-date" className="text-xs text-gray-500 text-right font-inter">تاريخ الوصول</label>
            <div className="relative">
              <input 
                type="date" 
                id="arrival-date" 
                className={`bg-gray-50 border ${errors.finalDestinationDate ? 'border-red-500' : 'border-gray-300'} rounded p-3 text-gray-800 text-md w-full`} 
                placeholder="ادخل تاريخ ووقت الوصول"  
                value={formData.finalDestinationDate} 
                onChange={(e) => setFormData({ ...formData, finalDestinationDate: e.target.value })} 
              />
            </div>
            {errors.finalDestinationDate && (
              <span className="text-red-500 text-xs text-right">{errors.finalDestinationDate}</span>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="ticket-upload" className="text-xs text-gray-500 text-right font-inter">ارفاق التذكرة</label>
            <div className={`flex items-center justify-between bg-gray-50 border ${errors.internalTicketFile ? 'border-red-500' : 'border-gray-300'} rounded p-1 pl-3`}>
              <span className="text-md text-gray-500 font-tajawal">
                {fileUploaded && fileName ? fileName : 'ارفاق ملف التذكرة'}
              </span>
              <label htmlFor="ticket-upload-btn" className="bg-teal-800 text-white text-xs font-tajawal px-4 py-2 rounded cursor-pointer">
                {fileUploaded ? 'تغيير الملف' : 'اختيار ملف'}
              </label>
              <input 
                type="file" 
                id="ticket-upload-btn" 
                className="hidden" 
                ref={ticketFileInputRef}
                onChange={handleTicketFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>
            {errors.internalTicketFile && (
              <span className="text-red-500 text-xs text-right">{errors.internalTicketFile}</span>
            )}
            {uploadError && (
              <span className="text-red-500 text-xs text-right">{uploadError}</span>
            )}
            {fileUploaded && internalTicketFile && (
              <div className="mt-2">
                <a 
                  href={internalTicketFile} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 text-xs hover:underline"
                >
                  عرض الملف المرفوع
                </a>
              </div>
            )}
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