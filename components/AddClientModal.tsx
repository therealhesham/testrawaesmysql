import { useEffect, useMemo, useState, useRef } from 'react';
import { X, ChevronDown, CheckCircle } from 'lucide-react';
import Select from 'react-select';

const clientCityOptions: Array<{ value: string; label: string }> = [
  { value: 'Baha', label: 'الباحة' },
  { value: 'Jawf', label: 'الجوف' },
  { value: 'Qassim', label: 'القصيم' },
  { value: 'Hail', label: 'حائل' },
  { value: 'Jazan', label: 'جازان' },
  { value: 'Najran', label: 'نجران' },
  { value: 'Madinah', label: 'المدينة المنورة' },
  { value: 'Riyadh', label: 'الرياض' },
  { value: 'Al-Kharj', label: 'الخرج' },
  { value: 'Ad Diriyah', label: 'الدرعية' },
  { value: "Al Majma'ah", label: 'المجمعة' },
  { value: 'Al Zulfi', label: 'الزلفي' },
  { value: 'Ad Dawadimi', label: 'الدوادمي' },
  { value: 'Wadi Ad Dawasir', label: 'وادي الدواسر' },
  { value: 'Afif', label: 'عفيف' },
  { value: "Al Quway'iyah", label: 'القويعية' },
  { value: 'Shaqra', label: 'شقراء' },
  { value: 'Hotat Bani Tamim', label: 'حوطة بني تميم' },
  { value: 'Makkah', label: 'مكة المكرمة' },
  { value: 'Jeddah', label: 'جدة' },
  { value: 'Taif', label: 'الطائف' },
  { value: 'Rabigh', label: 'رابغ' },
  { value: 'Al Qunfudhah', label: 'القنفذة' },
  { value: 'Al Lith', label: 'الليث' },
  { value: 'Khulais', label: 'خليص' },
  { value: 'Ranyah', label: 'رنية' },
  { value: 'Turabah', label: 'تربة' },
  { value: 'Yanbu', label: 'ينبع' },
  { value: 'Al Ula', label: 'العلا' },
  { value: 'Badr', label: 'بدر' },
  { value: 'Al Hinakiyah', label: 'الحناكية' },
  { value: 'Mahd Al Dhahab', label: 'مهد الذهب' },
  { value: 'Dammam', label: 'الدمام' },
  { value: 'Al Khobar', label: 'الخبر' },
  { value: 'Dhahran', label: 'الظهران' },
  { value: 'Al Ahsa', label: 'الأحساء' },
  { value: 'Al Hufuf', label: 'الهفوف' },
  { value: 'Al Mubarraz', label: 'المبرز' },
  { value: 'Jubail', label: 'الجبيل' },
  { value: 'Hafr Al Batin', label: 'حفر الباطن' },
  { value: 'Al Khafji', label: 'الخفجي' },
  { value: 'Ras Tanura', label: 'رأس تنورة' },
  { value: 'Qatif', label: 'القطيف' },
  { value: 'Abqaiq', label: 'بقيق' },
  { value: 'Nairiyah', label: 'النعيرية' },
  { value: 'Qaryat Al Ulya', label: 'قرية العليا' },
  { value: 'Buraydah', label: 'بريدة' },
  { value: 'Unaizah', label: 'عنيزة' },
  { value: 'Ar Rass', label: 'الرس' },
  { value: 'Al Bukayriyah', label: 'البكيرية' },
  { value: 'Al Badaye', label: 'البدائع' },
  { value: 'Al Mithnab', label: 'المذنب' },
  { value: 'Riyad Al Khabra', label: 'رياض الخبراء' },
  { value: 'Abha', label: 'أبها' },
  { value: 'Khamis Mushait', label: 'خميس مشيط' },
  { value: 'Bisha', label: 'بيشة' },
  { value: 'Mahayil', label: 'محايل عسير' },
  { value: 'Al Namas', label: 'النماص' },
  { value: 'Tanomah', label: 'تنومة' },
  { value: 'Ahad Rafidah', label: 'أحد رفيدة' },
  { value: 'Sarat Abidah', label: 'سراة عبيدة' },
  { value: 'Balqarn', label: 'بلقرن' },
  { value: 'Tabuk', label: 'تبوك' },
  { value: 'Duba', label: 'ضباء' },
  { value: 'Al Wajh', label: 'الوجه' },
  { value: 'Umluj', label: 'أملج' },
  { value: 'Tayma', label: 'تيماء' },
  { value: 'Haqi', label: 'حقل' },
];

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddClientModal = ({ isOpen, onClose, onSuccess }: AddClientModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullname: '',
    phonenumber: '',
    nationalId: '',
    city: '',
    clientSource: '',
    hasVisa: 'yes',
    visaNumber: '',
    nationality: '',
    gender: '',
    profession: '',
    visaFile: '',
  });
  const [errors, setErrors] = useState<any>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nationalities, setNationalities] = useState<any[]>([]);
  const [professions, setProfessions] = useState<{ id: number; name: string; gender: string | null }[]>([]);
  const [fileUploaded, setFileUploaded] = useState({
    visaFile: false,
  });
  const [visaFileName, setVisaFileName] = useState(''); // Store file name
  const [showCustomSourceModal, setShowCustomSourceModal] = useState(false);
  const [customSource, setCustomSource] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateClientId, setDuplicateClientId] = useState<number | null>(null);
  const [duplicateMessage, setDuplicateMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];

  const fetchNationalities = async () => {
    const response = await fetch('/api/nationalities');
    const data = await response.json();
    setNationalities(data.nationalities);
  };

  const fetchProfessions = async () => {
    try {
      const response = await fetch('/api/professions');
      const data = await response.json();
      // API returns array directly
      if (Array.isArray(data)) {
        setProfessions(data);
      }
    } catch (error) {
      console.error('Error fetching professions:', error);
    }
  };

  // Filter professions based on selected gender using useMemo
  const filteredProfessions = useMemo(() => {
    // If no gender is selected, show all professions
    if (!formData.gender || !professions.length) {
      console.log('No gender selected or no professions, showing all:', professions.length);
      return professions;
    }
    // Filter: show professions that match the selected gender OR have no gender specified (available for all)
    const filtered = professions.filter(
      (prof) => prof.gender === null || prof.gender === '' || prof.gender === formData.gender
    );
    console.log('Filtered professions for gender', formData.gender, ':', filtered.length, 'out of', professions.length);
    return filtered;
  }, [formData.gender, professions]);

  // Reset profession selection if current selection is not in filtered list
  useEffect(() => {
    if (formData.profession && formData.gender && filteredProfessions.length > 0) {
      const isProfessionAvailable = filteredProfessions.some(p => p.name === formData.profession);
      if (!isProfessionAvailable) {
        setFormData((prev) => ({ ...prev, profession: '' }));
      }
    }
  }, [formData.gender, filteredProfessions]);

  useEffect(() => {
    fetchNationalities();
    fetchProfessions();
  }, []);

  const validateStep1 = () => {
    const newErrors: any = {};
    const nameRegex = /^[a-zA-Z\s\u0600-\u06FF]+$/; // Arabic letters and english letters only
    const phoneRegex = /^5\d{8}$/; // 9 digits, starts with 5 (without country code)
    const nationalIdRegex = /^\d{10}$/; // 10 digits

    if (!formData.fullname) {
      newErrors.fullname = 'الاسم مطلوب';
    } else if (!nameRegex.test(formData.fullname)) {
      newErrors.fullname = 'الاسم يجب أن يحتوي على حروف عربية فقط';
    } else if (formData.fullname.length < 3) {
      newErrors.fullname = 'الاسم يجب أن يكون 3 أحرف على الأقل';
    }

    if (!formData.phonenumber) {
      newErrors.phonenumber = 'رقم الهاتف مطلوب';
    } else if (!phoneRegex.test(formData.phonenumber)) {
      newErrors.phonenumber = 'رقم الهاتف يجب أن يكون 9 أرقام ويبدأ بـ 5';
    }

    if (!formData.nationalId) {
      newErrors.nationalId = 'رقم الهوية مطلوب';
    } else if (!nationalIdRegex.test(formData.nationalId)) {
      newErrors.nationalId = 'رقم الهوية يجب أن يكون 10 أرقام';
    }

    if (!formData.city) {
      newErrors.city = 'المدينة مطلوبة';
    }

    if (!formData.clientSource) {
      newErrors.clientSource = 'مصدر العميل مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: any = {};
    // يجب أن يبدأ بـ 190 ثم 7 أرقام (الإجمالي 10 أرقام)
    const visaNumberRegex = /^190\d{7}$/;

    if (!formData.visaNumber) {
      newErrors.visaNumber = 'رقم التأشيرة مطلوب';
    } else if (!visaNumberRegex.test(formData.visaNumber)) {
      newErrors.visaNumber = 'رقم التأشيرة يجب أن يبدأ بـ 190 ثم 7 أرقام (الإجمالي 10 أرقام)';
    } 



    if (!formData.nationality) {
      newErrors.nationality = 'الجنسية مطلوبة';
    }

    if (!formData.gender) {
      newErrors.gender = 'الجنس مطلوب';
    }

    if (!formData.profession) {
      newErrors.profession = 'المهنة مطلوبة';
    }

    // if (!formData.visaFile) {
    //   newErrors.visaFile = 'ملف التأشيرة مطلوب';
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // دالة للتحقق من وجود رقم التليفون أو رقم التأشيرة
  const checkDuplicate = async (field: 'phonenumber' | 'visaNumber', value: string) => {
    if (!value) return;
    
    try {
      const response = await fetch(`/api/clients/check-duplicate?field=${field}&value=${value}`);
      const data = await response.json();
      
      if (data.exists && data.clientId) {
        // مسح القيمة من الـ input عند ظهور المودال
        if (field === 'phonenumber') {
          setFormData((prev) => ({ ...prev, phonenumber: '' }));
        } else if (field === 'visaNumber') {
          setFormData((prev) => ({ ...prev, visaNumber: '' }));
        }
        
        setDuplicateClientId(data.clientId);
        setDuplicateMessage(
          field === 'phonenumber' 
            ? 'العميل مُسجل بالفعل بهذا الرقم' 
            : 'العميل مُسجل بالفعل برقم التأشيرة هذا'
        );
        setShowDuplicateModal(true);
      }
    } catch (error) {
      console.error('Error checking duplicate:', error);
    }
  };

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;

    // رقم التأشيرة: أرقام فقط + يجب أن يبدأ بـ 190 + طول أقصى 10 أرقام
    if (name === 'visaNumber') {
      const digitsOnly = String(value).replace(/\D/g, '').slice(0, 10);
      const isValidPartial =
        digitsOnly === '' ||
        '190'.startsWith(digitsOnly) ||
        /^190\d{0,7}$/.test(digitsOnly);

      if (!isValidPartial) return;

      setFormData((prev) => ({ ...prev, visaNumber: digitsOnly }));
      setErrors((prev: any) => ({ ...prev, visaNumber: '' }));
      
      // التحقق من وجود رقم التأشيرة عند اكتمال الرقم
      if (digitsOnly.length === 10) {
        checkDuplicate('visaNumber', digitsOnly);
      }
      return;
    }
    
    // إذا اختار المستخدم "أخرى" في المصدر، افتح المودال
    if (name === 'clientSource' && value === 'other') {
      setShowCustomSourceModal(true);
      return;
    }
    
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'gender') {
        console.log('Gender changed to:', value);
      }
      return updated;
    });
    // Clear error for the field when user starts typing
    setErrors((prev: any) => ({ ...prev, [name]: '' }));
    
    // التحقق من وجود رقم التليفون عند اكتمال الرقم
    if (name === 'phonenumber' && value.length === 9) {
      checkDuplicate('phonenumber', value);
    }
  };

  const selectedCityOption = useMemo(() => {
    if (!formData.city) return null;
    const found = clientCityOptions.find((c) => c.value === formData.city);
    return found || { value: formData.city, label: formData.city };
  }, [formData.city]);

  const getCitySelectStyles = (hasError: boolean) => ({
    control: (provided: any, state: any) => ({
      ...provided,
      width: '100%',
      backgroundColor: '#f9fafb',
      border: hasError ? '1px solid #ef4444' : '1px solid #d1d5db',
      borderRadius: '0.375rem',
      minHeight: '40px',
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
      color: '#6b7280',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      textAlign: 'right' as const,
      direction: 'rtl' as const,
      color: '#111827',
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
      color: state.isSelected ? 'white' : '#111827',
      '&:hover': {
        backgroundColor: state.isSelected ? '#115e59' : '#f0fdfa',
      },
    }),
  });

  const handleCustomSourceSubmit = () => {
    if (customSource.trim()) {
      setFormData((prev) => ({ ...prev, clientSource: customSource.trim() }));
      setErrors((prev: any) => ({ ...prev, clientSource: '' }));
      setShowCustomSourceModal(false);
      setCustomSource('');
    }
  };

  const handleCustomSourceCancel = () => {
    setShowCustomSourceModal(false);
    setCustomSource('');
  };

  const handleNavigateToClient = () => {
    if (duplicateClientId) {
      window.location.href = `/admin/clientdetails?id=${duplicateClientId}`;
    }
  };

  const handleCloseDuplicateModal = () => {
    setShowDuplicateModal(false);
    setDuplicateClientId(null);
    setDuplicateMessage('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setErrors((prev: any) => ({ ...prev, visaFile: 'لم يتم اختيار ملف' }));
      setFileUploaded((prev: any) => ({ ...prev, visaFile: false }));
      setVisaFileName('');
      return;
    }

    const file = files[0];
    if (!allowedFileTypes.includes(file.type)) {
      setErrors((prev: any) => ({ ...prev, visaFile: 'نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)' }));
      setFileUploaded((prev: any) => ({ ...prev, visaFile: false }));
      setVisaFileName('');
      return;
    }

    try {
      const res = await fetch(`/api/upload-presigned-url/visaFile`);
      if (!res.ok) {
        throw new Error('فشل في الحصول على رابط الرفع');
      }
      const { url, filePath } = await res.json();

      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'x-amz-acl': 'public-read',
        },
      });

      if (!uploadRes.ok) {
        throw new Error('فشل في رفع الملف');
      }

      setFormData((prev: any) => ({ ...prev, visaFile: filePath }));
      setErrors((prev: any) => ({ ...prev, visaFile: '' }));
      setFileUploaded((prev: any) => ({ ...prev, visaFile: true }));
      setVisaFileName(file.name); // Store the file name

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setErrors((prev: any) => ({ ...prev, visaFile: error.message || 'حدث خطأ أثناء رفع الملف' }));
      setFileUploaded((prev: any) => ({ ...prev, visaFile: false }));
      setVisaFileName('');
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error('File input reference is not defined');
      setErrors((prev: any) => ({ ...prev, visaFile: 'خطأ في تحديد حقل الملف' }));
    }
  };

  const handleSubmit = async () => {
    if (formData.hasVisa === 'yes' && !validateStep2()) {
      return;
    }
    if (!validateStep1()) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const requestBody: any = {
        fullname: formData.fullname,
        phonenumber: formData.phonenumber,
        nationalId: formData.nationalId,
        city: formData.city,
        clientSource: formData.clientSource,
      };

      // إضافة بيانات التأشيرة فقط إذا كان لدى العميل تأشيرة
      if (formData.hasVisa === 'yes') {
        requestBody.visaFile = formData.visaFile;
        requestBody.visaNumber = formData.visaNumber;
        requestBody.nationality = formData.nationality;
        requestBody.gender = formData.gender;
        requestBody.profession = formData.profession;
      }

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        throw new Error('فشل في إضافة العميل');
      }
      onClose();
      setFormData({
        fullname: '',
        phonenumber: '',
        nationalId: '',
        city: '',
        clientSource: '',
        hasVisa: 'yes',
        visaNumber: '',
        nationality: '',
        gender: '',
        profession: '',
        visaFile: '',
      });
      setFileUploaded({ visaFile: false });
      setErrors({});
      setVisaFileName('');
      setStep(1);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Duplicate Client Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[70]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-text-dark mb-4">تنبيه</h3>
            <p className="text-text-dark mb-6">{duplicateMessage}. هل تريد الانتقال إلى صفحة العميل؟</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseDuplicateModal}
                className="bg-gray-300 text-text-dark px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleNavigateToClient}
                className="bg-teal-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90"
              >
                نعم، الانتقال للعميل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Source Modal */}
      {showCustomSourceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-text-dark mb-4">أدخل مصدر العميل</h3>
            <input
              type="text"
              value={customSource}
              onChange={(e) => setCustomSource(e.target.value)}
              placeholder="اكتب مصدر العميل"
              className="w-full bg-background-light border border-border-color rounded-md py-2 px-4 text-sm text-text-dark mb-4"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCustomSourceSubmit();
                }
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCustomSourceCancel}
                className="bg-gray-300 text-text-dark px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleCustomSourceSubmit}
                className="bg-primary-dark text-text-light px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90"
                disabled={!customSource.trim()}
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Modal */}
      <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-gray-100 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative">
        <X
          className="absolute top-4 left-4 text-2xl cursor-pointer text-primary-dark"
          onClick={onClose}
        />
        {error && (
          <div className="mb-4 text-red-600 text-sm">{error}</div>
        )}
        {step === 1 ? (
          <section className="space-y-6">
            <h2 className="text-2xl font-medium text-text-dark">إضافة عميل</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary-dark text-text-light rounded-full flex items-center justify-center">1</div>
                <span className="text-sm text-text-dark">بيانات أساسية</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <div className="w-6 h-6 bg-border-color text-text-dark rounded-full flex items-center justify-center">2</div>
                <span className="text-sm text-text-dark">بيانات التأشيرة</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="fullname" className="block text-sm font-medium text-text-dark">الاسم</label>
                <input
                  type="text"
                  id="fullname"
                  name="fullname"
                  placeholder="ادخل اسم العميل"
                  value={formData.fullname}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[0-9]/g, ""); // يمنع الأرقام
                    handleInputChange({
                      target: { name: "fullname", value },
                    });
                  }}
                  className={`w-full bg-background-light border ${errors.fullname ? 'border-red-500' : 'border-border-color'} rounded-md py-2 px-4 text-sm text-text-dark`}
                />
                {errors.fullname && <p className="text-red-500 text-xs mt-1">{errors.fullname}</p>}
              </div>
<div className="space-y-2">
  <label
    htmlFor="phonenumber"
    className="block text-sm font-medium text-text-dark"
  >
    الرقم
  </label>

  <div className="flex items-center">
    <input
      type="text"
      id="phonenumber"
      name="phonenumber"
      placeholder="5XXXXXXXX"
      value={formData.phonenumber}
      inputMode="numeric"
      maxLength={9}
      onChange={(e) => {
        const value = e.target.value.replace(/\D/g, ""); // يمنع غير الأرقام
        if (value.startsWith("5") || value === "") {
          handleInputChange({
            target: { name: "phonenumber", value },
          });
        }
      }}
      className={`w-full bg-background-light border ${
        errors.phonenumber ? "border-red-500" : "border-border-color"
      } rounded-r-md py-2 px-4 text-sm text-text-dark focus:outline-none`}
    />
    <span className="bg-gray-50 border border-r-0 border-border-color rounded-l-md py-2 px-3 text-sm text-gray-600 select-none">
      966+
    </span>

  </div>

  {errors.phonenumber && (
    <p className="text-red-500 text-xs mt-1">{errors.phonenumber}</p>
  )}
</div>

              <div className="space-y-2">
                <label htmlFor="nationalId" className="block text-sm font-medium text-text-dark">الهوية</label>
                <input
                  type="text"
                  id="nationalId"
                  name="nationalId"
                  placeholder="ادخل هوية العميل"
                  value={formData.nationalId}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ""); // يمنع غير الأرقام
                    handleInputChange({
                      target: { name: "nationalId", value },
                    });
                  }}
                  className={`w-full bg-background-light border ${errors.nationalId ? 'border-red-500' : 'border-border-color'} rounded-md py-2 px-4 text-sm text-text-dark`}
                />
                {errors.nationalId && <p className="text-red-500 text-xs mt-1">{errors.nationalId}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="city" className="block text-sm font-medium text-text-dark">المدينة</label>
                <div className="relative">
                  <Select
                    inputId="city"
                    value={selectedCityOption}
                    onChange={(selected: any) =>
                      handleInputChange({
                        target: { name: 'city', value: selected ? selected.value : '' },
                      })
                    }
                    options={clientCityOptions}
                    placeholder="اختر المدينة"
                    isClearable
                    isSearchable
                    styles={getCitySelectStyles(!!errors.city)}
                    menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                    noOptionsMessage={() => 'لا توجد نتائج'}
                    loadingMessage={() => 'جاري البحث...'}
                  />
                </div>
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="clientSource" className="block text-sm font-medium text-text-dark">مصدر العميل</label>
                <div className="relative">
                  <select
                    id="clientSource"
                    name="clientSource"
                    value={formData.clientSource === 'تسويق' || formData.clientSource === 'إعلان' || formData.clientSource === '' ? formData.clientSource : 'custom'}
                    onChange={handleInputChange}
                    className={`w-full bg-background-light border ${errors.clientSource ? 'border-red-500' : 'border-border-color'} rounded-md py-2 text-sm text-text-dark appearance-none`}
                  >
                    <option value="">اختر مصدر العميل</option>
                    <option value="تسويق">تسويق</option>
                    <option value="إعلان">إعلان</option>
                    <option value="other">أخرى</option>
                    {formData.clientSource && formData.clientSource !== 'تسويق' && formData.clientSource !== 'إعلان' && (
                      <option value="custom">{formData.clientSource}</option>
                    )}
                  </select>
                </div>
                {errors.clientSource && <p className="text-red-500 text-xs mt-1">{errors.clientSource}</p>}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-dark">هل لدى العميل تأشيرة؟</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="hasVisa"
                      value="yes"
                      checked={formData.hasVisa === 'yes'}
                      onChange={handleInputChange}
                      className="text-primary-dark"
                    />
                    نعم
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="hasVisa"
                      value="no"
                      checked={formData.hasVisa === 'no'}
                      onChange={handleInputChange}
                      className="text-primary-dark"
                    />
                    لا
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="bg-teal-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-800"
                onClick={() => {
                  if (validateStep1()) {
                    formData.hasVisa === 'yes' ? setStep(2) : handleSubmit();
                  }
                }}
                disabled={loading}
              >
                {formData.hasVisa === 'yes' ? 'التالي' : 'حفظ'}
              </button>
            </div>
          </section>
        ) : (
          <section className="space-y-6">
            <h2 className="text-2xl font-medium text-text-dark">إضافة تأشيرة</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary-dark text-text-light rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-sm text-text-dark">بيانات أساسية</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary-dark text-text-light rounded-full flex items-center justify-center">2</div>
                <span className="text-sm text-text-dark">بيانات التأشيرة</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="visaNumber" className="block text-sm font-medium text-text-dark">رقم التأشيرة</label>
                <input
                  type="text"
                  id="visaNumber"
                  name="visaNumber"
                  placeholder="190XXXXXXX"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="190\d{7}"
                  value={formData.visaNumber}
                  onChange={handleInputChange}
                  className={`w-full bg-background-light border ${errors.visaNumber ? 'border-red-500' : 'border-border-color'} rounded-md py-2 px-4 text-sm text-text-dark`}
                />
                <p className="text-gray-500 text-xs mt-1">ملاحظة: رقم التأشيرة يبدأ بـ 190 ثم 7 أرقام (الإجمالي 10 أرقام)</p>
                {errors.visaNumber && <p className="text-red-500 text-xs mt-1">{errors.visaNumber}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="nationality" className="block text-sm font-medium text-text-dark">الجنسية</label>
                <div className="relative">
                  <select
                    id="nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    className={`w-full bg-background-light border ${errors.nationality ? 'border-red-500' : 'border-border-color'} rounded-md py-2  text-sm text-text-dark appearance-none`}
                  >
                    <option value="">اختر الجنسية</option>
                    {nationalities.map((nationality) => (
                      <option key={nationality.id} value={nationality.value}>{nationality.value as string}</option>
                    ))}
                  </select>
                </div>
                {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality}</p>}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-dark">الجنس</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={handleInputChange}
                      className="text-primary-dark"
                    />
                    ذكر
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={handleInputChange}
                      className="text-primary-dark"
                    />
                    أنثى
                  </label>
                </div>
                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="profession" className="block text-sm font-medium text-text-dark">المهنة</label>
                <div className="relative">
                  <select
                    id="profession"
                    name="profession"
                    value={formData.profession}
                    onChange={handleInputChange}
                    className={`w-full bg-background-light border ${errors.profession ? 'border-red-500' : 'border-border-color'} rounded-md py-2  text-sm text-text-dark appearance-none`}
                  >
                    <option value="">اختر المهنة</option>
                    {filteredProfessions.map((profession) => (
                      <option key={profession.id} value={profession.name}>
                        {profession.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.profession && <p className="text-red-500 text-xs mt-1">{errors.profession}</p>}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="visaFile" className="block text-sm font-medium text-text-dark">ملف التأشيرة</label>
                <div className="file-upload-display border border-gray-300 rounded p-2 flex justify-between items-center">
                  <span className="text-gray-500 text-sm pr-2 truncate">
                    {fileUploaded.visaFile ? (
                      <a
                        href={formData.visaFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-800 hover:underline"
                      >
                        {visaFileName}
                      </a>
                    ) : (
                      'إرفاق ملف التأشيرة'
                    )}
                  </span>
                  <input
                    type="file"
                    id="visaFile"
                    ref={fileInputRef}
                    className="hidden"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    disabled={loading}
                    className={`px-3 py-1 rounded text-sm transition duration-200 ${
                      loading 
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-teal-900 text-white hover:bg-teal-800'
                    }`}
                    onClick={handleButtonClick}
                  >
                    اختيار ملف
                  </button>
                </div>
                {errors.visaFile && <p className="text-red-500 text-xs mt-1">{errors.visaFile}</p>}
              </div>
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                className="bg-teal-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                السابق
              </button>
              <button
                type="button"
                className="bg-teal-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 min-w-[155px]"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'جاري الحفظ...' : 'حفظ & إضافة طلب'}
              </button>
            </div>
          </section>
        )}
        </div>
      </div>
    </>
  );
};

export default AddClientModal;