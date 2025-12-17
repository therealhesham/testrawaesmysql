import { CheckIcon } from '@heroicons/react/outline';
import { Calendar } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import Select from 'react-select';
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
  const [isUploading, setIsUploading] = useState(false);
  const ticketFileInputRef = useRef<HTMLInputElement>(null);

  const validateFields = (currentFormData: typeof formData, fieldName?: string) => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      // City validation - المدينتين لا يمكن أن تكونا نفس المدينة
      if (fieldName === 'ArrivalCity' || fieldName === 'finaldestination' || !fieldName) {
        if (currentFormData.ArrivalCity && currentFormData.finaldestination && 
            currentFormData.ArrivalCity === currentFormData.finaldestination) {
          newErrors.finaldestination = 'مدينة الوصول يجب أن تكون مختلفة عن مدينة المغادرة';
        } else if (currentFormData.ArrivalCity !== currentFormData.finaldestination) {
          // Clear error if cities are different
          if (newErrors.finaldestination === 'مدينة الوصول يجب أن تكون مختلفة عن مدينة المغادرة') {
            newErrors.finaldestination = '';
          }
        }
      }

      // Date validation - التواريخ لا يمكن أن تكون من الماضي
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if ((fieldName === 'deparatureDate' || !fieldName) && currentFormData.deparatureDate) {
        const depDate = new Date(currentFormData.deparatureDate);
        depDate.setHours(0, 0, 0, 0);
        if (depDate < today) {
          newErrors.deparatureDate = 'تاريخ المغادرة لا يمكن أن يكون من الماضي';
        } else if (newErrors.deparatureDate === 'تاريخ المغادرة لا يمكن أن يكون من الماضي') {
          newErrors.deparatureDate = '';
        }
      }

      if ((fieldName === 'finalDestinationDate' || !fieldName) && currentFormData.finalDestinationDate) {
        const arrDate = new Date(currentFormData.finalDestinationDate);
        arrDate.setHours(0, 0, 0, 0);
        if (arrDate < today) {
          newErrors.finalDestinationDate = 'تاريخ الوصول لا يمكن أن يكون من الماضي';
        } else if (newErrors.finalDestinationDate === 'تاريخ الوصول لا يمكن أن يكون من الماضي') {
          // Check if there's another validation error first
          const depDate = currentFormData.deparatureDate ? new Date(currentFormData.deparatureDate) : null;
          if (depDate && arrDate >= depDate) {
            newErrors.finalDestinationDate = '';
          } else if (!depDate) {
            newErrors.finalDestinationDate = '';
          }
        }
      }

      // Date validation - تاريخ الوصول يجب أن يكون بعد تاريخ المغادرة
      if ((fieldName === 'deparatureDate' || fieldName === 'finalDestinationDate' || !fieldName) 
          && currentFormData.deparatureDate && currentFormData.finalDestinationDate) {
        const depDate = new Date(currentFormData.deparatureDate);
        const arrDate = new Date(currentFormData.finalDestinationDate);
        if (depDate > arrDate) {
          newErrors.finalDestinationDate = 'تاريخ الوصول يجب أن يكون بعد تاريخ المغادرة';
        } else if (newErrors.finalDestinationDate === 'تاريخ الوصول يجب أن يكون بعد تاريخ المغادرة') {
          // Check if date is not in the past
          const todayOnly = new Date();
          todayOnly.setHours(0, 0, 0, 0);
          arrDate.setHours(0, 0, 0, 0);
          if (arrDate >= todayOnly && arrDate >= depDate) {
            newErrors.finalDestinationDate = '';
          }
        }
      }

      return newErrors;
    });
  };

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
    // if (!internalTicketFile) {
    //   newErrors.internalTicketFile = 'ملف التذكرة مطلوب';
    //   isValid = false;
    // }

    // City validation - المدينتين لا يمكن أن تكونا نفس المدينة
    if (formData.ArrivalCity && formData.finaldestination && formData.ArrivalCity === formData.finaldestination) {
      newErrors.finaldestination = 'مدينة الوصول يجب أن تكون مختلفة عن مدينة المغادرة';
      isValid = false;
    }

    // Date validation - التواريخ لا يمكن أن تكون من الماضي
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    
    if (formData.deparatureDate) {
      const depDate = new Date(formData.deparatureDate);
      depDate.setHours(0, 0, 0, 0);
      if (depDate < today) {
        newErrors.deparatureDate = 'تاريخ المغادرة لا يمكن أن يكون من الماضي';
        isValid = false;
      }
    }

    if (formData.finalDestinationDate) {
      const arrDate = new Date(formData.finalDestinationDate);
      arrDate.setHours(0, 0, 0, 0);
      if (arrDate < today) {
        newErrors.finalDestinationDate = 'تاريخ الوصول لا يمكن أن يكون من الماضي';
        isValid = false;
      }
    }

    // Date validation - تاريخ الوصول يجب أن يكون بعد تاريخ المغادرة
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
const arabicRegionMap: { [key: string]: string } = {
     'Riyadh': 'الرياض',
    'Al-Kharj': 'الخرج',
    'Ad Diriyah': 'الدرعية',
    'Al Majma\'ah': 'المجمعة',
    'Al Zulfi': 'الزلفي',
    'Ad Dawadimi': 'الدوادمي',
    'Wadi Ad Dawasir': 'وادي الدواسر',
    'Afif': 'عفيف',
    'Al Quway\'iyah': 'القويعية',
    'Shaqra': 'شقراء',
    'Hotat Bani Tamim': 'حوطة بني تميم',

    'Makkah': 'مكة المكرمة',
    'Jeddah': 'جدة',
    'Taif': 'الطائف',
    'Rabigh': 'رابغ',
    'Al Qunfudhah': 'القنفذة',
    'Al Lith': 'الليث',
    'Khulais': 'خليص',
    'Ranyah': 'رنية',
    'Turabah': 'تربة',

    'Madinah': 'المدينة المنورة',
    'Yanbu': 'ينبع',
    'Al Ula': 'العلا',
    'Badr': 'بدر',
    'Al Hinakiyah': 'الحناكية',
    'Mahd Al Dhahab': 'مهد الذهب',

    'Dammam': 'الدمام',
    'Al Khobar': 'الخبر',
    'Dhahran': 'الظهران',
    'Al Ahsa': 'الأحساء',
    'Al Hufuf': 'الهفوف',
    'Al Mubarraz': 'المبرز',
    'Jubail': 'الجبيل',
    'Hafr Al Batin': 'حفر الباطن',
    'Al Khafji': 'الخفجي',
    'Ras Tanura': 'رأس تنورة',
    'Qatif': 'القطيف',
    'Abqaiq': 'بقيق',
    'Nairiyah': 'النعيرية',
    'Qaryat Al Ulya': 'قرية العليا',

    'Buraydah': 'بريدة',
    'Unaizah': 'عنيزة',
    'Ar Rass': 'الرس',
    'Al Bukayriyah': 'البكيرية',
    'Al Badaye': 'البدائع',
    'Al Mithnab': 'المذنب',
    'Riyad Al Khabra': 'رياض الخبراء',

    'Abha': 'أبها',
    'Khamis Mushait': 'خميس مشيط',
    'Bisha': 'بيشة',
    'Mahayil': 'محايل عسير',
    'Al Namas': 'النماص',
    'Tanomah': 'تنومة',
    'Ahad Rafidah': 'أحد رفيدة',
    'Sarat Abidah': 'سراة عبيدة',
    'Balqarn': 'بلقرن',

    'Tabuk': 'تبوك',
    'Duba': 'ضباء',
    'Al Wajh': 'الوجه',
    'Umluj': 'أملج',
    'Tayma': 'تيماء',
    'Haqi': 'حقل',

    'Hail': 'حائل',
    'Baqa': 'بقعاء',
    'Al Ghazalah': 'الغزالة',

    'Arar': 'عرعر',
    'Rafha': 'رفحاء',
    'Turaif': 'طريف',

    'Jazan': 'جازان',
    'Sabya': 'صبيا',
    'Abu Arish': 'أبو عريش',
    'Samtah': 'صامطة',
    'Baish': 'بيش',
    'Ad Darb': 'الدرب',
    'Al Aridah': 'العارضة',
    'Fifa': 'فيفاء',

    'Najran': 'نجران',
    'Sharurah': 'شرورة',
    'Hubuna': 'حبونا',

    'Al Baha': 'الباحة',
    'Baljurashi': 'بلجرشي',
    'Al Mandq': 'المندق',
    'Al Makhwah': 'المخواة',
    'Qilwah': 'قلوة',

    'Sakaka': 'سكاكا',
    'Dumat Al Jandal': 'دومة الجندل',
    'Al Qurayyat': 'القريات',
    'Tabarjal': 'طبرجل'
  };


  const convertToArabicRegion = (region: string) => {
    return arabicRegionMap[region] || region;
  };

  const cityOptions = useMemo(
    () =>
      Object.keys(arabicRegionMap).map((region) => ({
        value: region,
        label: convertToArabicRegion(region),
      })),
    // arabicRegionMap ثابتة داخل هذا الكومبوننت، نثبّت الـ options لتقليل إعادة الحساب
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const getCitySelectStyles = (hasError: boolean) => ({
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: '#f9fafb', // bg-gray-50
      border: hasError ? '1px solid #ef4444' : '1px solid #d1d5db', // red-500 / gray-300
      borderRadius: '0.25rem',
      minHeight: '44px',
      boxShadow: state.isFocused ? (hasError ? '0 0 0 1px #ef4444' : '0 0 0 1px #115e59') : 'none',
      '&:hover': {
        border: hasError ? '1px solid #ef4444' : '1px solid #9ca3af',
      },
      direction: 'rtl' as const,
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      padding: '0 12px',
    }),
    input: (provided: any) => ({
      ...provided,
      margin: 0,
      padding: 0,
      textAlign: 'right' as const,
      direction: 'rtl' as const,
    }),
    placeholder: (provided: any) => ({
      ...provided,
      textAlign: 'right' as const,
      direction: 'rtl' as const,
      color: '#6b7280', // text-gray-500
    }),
    singleValue: (provided: any) => ({
      ...provided,
      textAlign: 'right' as const,
      direction: 'rtl' as const,
      color: '#1f2937',
    }),
    menuPortal: (provided: any) => ({
      ...provided,
      zIndex: 9999,
    }),
    menu: (provided: any) => ({
      ...provided,
      textAlign: 'right' as const,
      direction: 'rtl' as const,
      zIndex: 9999,
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      textAlign: 'right' as const,
      direction: 'rtl' as const,
      backgroundColor: state.isSelected ? '#115e59' : state.isFocused ? '#f0fdfa' : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      '&:hover': {
        backgroundColor: state.isSelected ? '#115e59' : '#f0fdfa',
      },
    }),
  });
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
      setFileName(file.name); // عرض اسم الملف فوراً
      setIsUploading(true); // بدء حالة التحميل
      
      const res = await fetch(`/api/upload-presigned-url/internalTicketFile`);
      if (!res.ok) {
        throw new Error('فشل في الحصول على رابط الرفع');
      }
      const { url, filePath } = await res.json();

      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'x-amz-acl': 'public-read',
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
    } finally {
      setIsUploading(false); // إنهاء حالة التحميل
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
            <Select
              inputId="departure-from"
              value={cityOptions.find((opt) => opt.value === (formData.ArrivalCity || '')) || null}
              onChange={(selected: any) => {
                const value = selected ? selected.value : '';
                const newFormData = { ...formData, ArrivalCity: value };
                setFormData(newFormData);
                validateFields(newFormData, 'ArrivalCity');
              }}
              options={cityOptions}
              placeholder="اختر المدينة"
              isClearable
              isSearchable
              styles={getCitySelectStyles(!!errors.ArrivalCity)}
              menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
              noOptionsMessage={() => 'لا توجد نتائج'}
              loadingMessage={() => 'جاري البحث...'}
            />
          
            
            {errors.ArrivalCity && (
              <span className="text-red-500 text-xs text-right">{errors.ArrivalCity}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="arrival-destination" className="text-xs text-gray-500 text-right font-inter">الى</label>
            <Select
              inputId="arrival-destination"
              value={cityOptions.find((opt) => opt.value === (formData.finaldestination || '')) || null}
              onChange={(selected: any) => {
                const value = selected ? selected.value : '';
                const newFormData = { ...formData, finaldestination: value };
                setFormData(newFormData);
                validateFields(newFormData, 'finaldestination');
              }}
              options={cityOptions}
              placeholder="اختر المدينة"
              isClearable
              isSearchable
              styles={getCitySelectStyles(!!errors.finaldestination)}
              menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
              noOptionsMessage={() => 'لا توجد نتائج'}
              loadingMessage={() => 'جاري البحث...'}
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
                onChange={(e) => {
                  const newFormData = { ...formData, deparatureDate: e.target.value };
                  setFormData(newFormData);
                  validateFields(newFormData, 'deparatureDate');
                }}
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
                onChange={(e) => {
                  const newFormData = { ...formData, finalDestinationDate: e.target.value };
                  setFormData(newFormData);
                  validateFields(newFormData, 'finalDestinationDate');
                }}
              />
            </div>
            {errors.finalDestinationDate && (
              <span className="text-red-500 text-xs text-right">{errors.finalDestinationDate}</span>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="ticket-upload" className="text-xs text-gray-500 text-right font-inter">ارفاق التذكرة</label>
            <div className={`flex items-center justify-between bg-gray-50 border ${errors.internalTicketFile ? 'border-red-500' : 'border-gray-300'} rounded p-1 pl-3 overflow-hidden w-full max-w-full`}>
              <span className="text-md text-gray-500 font-tajawal flex items-center gap-2 flex-1 min-w-0 overflow-hidden max-w-full">
                {isUploading && (
                  <svg className="animate-spin h-5 w-5 text-teal-800 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span className="truncate block overflow-hidden text-ellipsis whitespace-nowrap max-w-full">{fileName ? fileName : 'ارفاق ملف التذكرة'}</span>
              </span>
              <label 
                htmlFor="ticket-upload-btn" 
                className={`bg-teal-800 text-white text-xs font-tajawal px-4 py-2 rounded ${isUploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'} flex-shrink-0 ml-2`}
              >
                {isUploading ? 'جاري الرفع...' : (fileUploaded ? 'تغيير الملف' : 'اختيار ملف')}
              </label>
              <input 
                type="file" 
                id="ticket-upload-btn" 
                className="hidden" 
                ref={ticketFileInputRef}
                onChange={handleTicketFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={isUploading}
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