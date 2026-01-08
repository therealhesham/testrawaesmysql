import { CashIcon, CreditCardIcon, CurrencyDollarIcon } from '@heroicons/react/outline';
import axios from 'axios';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Select from 'react-select';

interface Client {
  id: string;
  fullname: string;
  phonenumber: string;
  city?: string;
}

interface ApiOrderData {
  orderId: number;
  clientInfo: { name: string; phone: string; email: string };
  homemaidInfo: { name: string; passportNumber: string; nationality: string; externalOffice: string };
  documentUpload: { files: string | null };
  ticketUpload: { files: string | null };
  nationality: string;
  // أضف age, ExperienceYears, notes إذا موجودة في API
}

interface FormData {
  clientID: string;
  ClientName: string;
  PhoneNumber: string;
  Nationalitycopy: string;
  Religion: string;
  PaymentMethod: string;
  Total: number;
  Paid: number;
  Remaining: number;
  age: string;
  ExperienceYears: string;
  Experience?: string;
  notes: string;
  orderDocument: string;
  contract: string;
  selectedHomemaidId?: number;
  city?: string;
}

interface HomemaidSuggestion {
  id: number;
  name: string;
  nationality: string;
  religion: string;
  experience: string;
  age: number;
  passportNumber: string;
  office: string;
  country: string;
  picture: any;
  relevanceScore?: number;
}

interface AddSpecsFormProps {
  clients: Client[];
  orderId?: string;
  preSelectedClient?: Client | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function AddSpecsForm({ clients, orderId, preSelectedClient, onCancel, onSuccess }: AddSpecsFormProps) {
  const [formData, setFormData] = useState<FormData>({
    clientID: '',
    ClientName: '',
    PhoneNumber: '',
    Nationalitycopy: '',
    Religion: '',
    PaymentMethod: 'كاش',
    Total: 0,
    Paid: 0,
    Remaining: 0,
    age: '',
    ExperienceYears: '',
    Experience: '',
    notes: '',
    orderDocument: '',
    contract: '',
    selectedHomemaidId: undefined,
  });
  const [fileUploaded, setFileUploaded] = useState({
    orderDocument: false,
    contract: false,
  });
  // أضف هذا state بعد باقي الـ states الموجودة
// أضف هذا السطر مع باقي الـ useState
const [fileNames, setFileNames] = useState({
  orderDocument: '',
  contract: '',
});
  const [fileUploading, setFileUploading] = useState({
    orderDocument: false,
    contract: false,
  });
  const [errors, setErrors] = useState<any>({});
  const [modalMessage, setModalMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showUploadSuccessModal, setShowUploadSuccessModal] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState('');
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestions, setSuggestions] = useState<HomemaidSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [nationalities, setNationalities] = useState<{ value: string; label: string; Country: string }[]>([]);

  const fileInputRefs = {
    orderDocument: useRef<HTMLInputElement>(null),
    contract: useRef<HTMLInputElement>(null),
  };

  const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];

  // Experience options from homemaidinfo
  const experienceOptions = [
    "Novice | مدربة بدون خبرة",
    "Intermediate | مدربة بخبرة متوسطة",
    "Well-experienced | خبرة جيدة",
    "Expert | خبرة ممتازة"
  ];

  // Religion options from newhomemaids
  const religionOptions = [
    "Islam - الإسلام",
    "Non-Muslim - غير مسلم"
  ];

  // Handle experience change - converts to ExperienceYears automatically
  const handleExperienceChange = (selectedExperience: string) => {
    let autoYears = "";

    switch (selectedExperience) {
      case "Novice | مدربة بدون خبرة":
        autoYears = "مدربة-Training";
        break;
      case "Intermediate | مدربة بخبرة متوسطة":
        autoYears = "1-2 Years - سنوات";
        break;
      case "Well-experienced | خبرة جيدة":
        autoYears = "3-4 Years - سنوات";
        break;
      case "Expert | خبرة ممتازة":
        autoYears = "5 and More - وأكثر";
        break;
      default:
        autoYears = "";
    }

    setFormData((prev) => ({
      ...prev,
      Experience: selectedExperience,
      ExperienceYears: autoYears,
    }));
    
    setErrors((prev: any) => {
      const newErrors = { ...prev };
      delete newErrors.ExperienceYears;
      return newErrors;
    });
  };

  // Validation functions
  const validatePhoneNumber = (phone: string): string => {
    // const phoneRegex = /^(\+?966|0)?5[0-9]{8}$/;
    if (!phone) return 'رقم الهاتف مطلوب';
    // if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      // return 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 05)';
    // }
    return '';
  };

  const validateAge = (age: string): string => {
    if (!age || age.trim() === '') {
      return 'العمر مطلوب';
    }
    return '';
  };

  const validateExperience = (experience: string): string => {
    if (!experience || experience.trim() === '') {
      return 'سنوات الخبرة مطلوبة';
    }
    return '';
  };

  const validateAmount = (amount: number): string => {
    if (amount < 0) {
      return 'المبلغ لا يمكن أن يكون سالبًا';
    }
    if (amount > 100000) {
      return 'المبلغ الإجمالي لا يتجاوز 100,000 ريال';
    }
    return '';
  };

  const validateNationality = (nationality: string): string => {
    if (!nationality || nationality.trim().length < 2) {
      return 'الجنسية مطلوبة (2 أحرف على الأقل)';
    }
    return '';
  };

  const validateReligion = (religion: string): string => {
    if (!religion || religion.trim() === '') {
      return 'الديانة مطلوبة';
    }
    // التحقق من أن القيمة المختارة موجودة في الخيارات
    if (!religionOptions.includes(religion)) {
      return 'يرجى اختيار ديانة صحيحة';
    }
    return '';
  };

  const validateFileUploaded = (fileId: string): string => {
    if (!fileUploaded[fileId as keyof typeof fileUploaded]) {
      return `${fileId === 'orderDocument' ? 'ملف سند الأمر' : 'ملف العقد'} مطلوب`;
    }
    return '';
  };

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        try {
          const response = await axios.get(`/api/track_order/${orderId}`);
          const order: ApiOrderData = response.data;
          
          // Match client ID by name
          const matchedClient = clients.find(client => client.fullname === order.clientInfo.name);
          
          const mappedFormData: FormData = {
            clientID: matchedClient?.id || '',
            ClientName: order.clientInfo.name,
            PhoneNumber: order.clientInfo.phone,
            Nationalitycopy: order.homemaidInfo.nationality || order.nationality,
            Religion: 'N/A', // Default
            PaymentMethod: 'كاش', // Default
            Total: 0, // Default
            Paid: 0,
            Remaining: 0,
            age: '', // Add to API if needed
            ExperienceYears: '',
            Experience: '',
            notes: '', // Add to API if needed
            orderDocument: order.documentUpload.files || '',
            contract: order.ticketUpload.files || '',
          };
          
          setFormData(mappedFormData);
          setFileUploaded({
            orderDocument: !!order.documentUpload.files,
            contract: !!order.ticketUpload.files,
          });
        } catch (error) {
          console.error('Error fetching order:', error);
          setModalMessage('حدث خطأ أثناء جلب بيانات الطلب');
          setShowErrorModal(true);
        }
      };
      fetchOrder();
    }
  }, [orderId, clients]);

  // Fetch nationalities from offices
  useEffect(() => {
    const fetchNationalities = async () => {
      try {
        const response = await fetch('/api/nationalities');
        const data = await response.json();
        if (data.success && data.nationalities) {
          const nationalityOptions = data.nationalities.map((nat: any) => ({
            value: nat.Country || nat.value,
            label: nat.Country || nat.label,
            Country: nat.Country || nat.value,
          }));
          setNationalities(nationalityOptions);
        }
      } catch (error) {
        console.error('Error fetching nationalities:', error);
      }
    };
    fetchNationalities();
  }, []);

  // Handle pre-selected client
  useEffect(() => {
    if (preSelectedClient) {
      setFormData((prev) => ({
        ...prev,
        clientID: preSelectedClient.id,
        ClientName: preSelectedClient.fullname,
        city:preSelectedClient?.city || '',
        PhoneNumber: preSelectedClient.phonenumber,
      }));
    }
  }, [preSelectedClient]);

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileId: string) => {
  const files = e.target.files;
  if (!files || files.length === 0) {
    setErrors((prev: any) => ({ ...prev, [fileId]: 'لم يتم اختيار ملف' }));
    setFileUploaded((prev: any) => ({ ...prev, [fileId]: false }));
    setFileNames((prev: any) => ({ ...prev, [fileId]: '' })); // إضافة هذا السطر
    return;
  }

  const file = files[0];
  
  // حفظ اسم الملف فوراً
  setFileNames((prev: any) => ({ ...prev, [fileId]: file.name }));
  
  // File size validation (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    setErrors((prev: any) => ({ ...prev, [fileId]: 'حجم الملف يجب أن يكون أقل من 10 ميجابايت' }));
    setFileUploaded((prev: any) => ({ ...prev, [fileId]: false }));
    setFileNames((prev: any) => ({ ...prev, [fileId]: '' })); // إضافة هذا السطر
    return;
  }

  if (!allowedFileTypes.includes(file.type)) {
    setErrors((prev: any) => ({ ...prev, [fileId]: 'نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)' }));
    setFileUploaded((prev: any) => ({ ...prev, [fileId]: false }));
    setFileNames((prev: any) => ({ ...prev, [fileId]: '' })); // إضافة هذا السطر
    return;
  }

  // باقي الكود كما هو...
  setFileUploading((prev: any) => ({ ...prev, [fileId]: true }));
  setErrors((prev: any) => ({ ...prev, [fileId]: '' }));

  try {
    const res = await fetch(`/api/upload-presigned-url/${fileId}`);
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

    setFormData((prev: any) => ({ ...prev, [fileId]: filePath }));
    setFileUploaded((prev: any) => ({ ...prev, [fileId]: true }));
    
    // Show success message
    const fileLabels = {
      orderDocument: 'ملف سند الأمر',
      contract: 'ملف العقد'
    };
    setUploadSuccessMessage(`${fileLabels[fileId as keyof typeof fileLabels]} تم رفعه بنجاح`);
    setShowUploadSuccessModal(true);

    const ref = fileInputRefs[fileId as keyof typeof fileInputRefs];
    if (ref && ref.current) {
      ref.current.value = '';
    }
  } catch (error: any) {
    console.error('Error uploading file:', error);
    setErrors((prev: any) => ({ ...prev, [fileId]: error.message || 'حدث خطأ أثناء رفع الملف' }));
    setFileUploaded((prev: any) => ({ ...prev, [fileId]: false }));
    setFileNames((prev: any) => ({ ...prev, [fileId]: '' })); // إضافة هذا السطر
  } finally {
    setFileUploading((prev: any) => ({ ...prev, [fileId]: false }));
  }
};
  const handleButtonClick = (fileId: string) => {
    // Same as in AddAvailableForm
    const ref = fileInputRefs[fileId as keyof typeof fileInputRefs];
    if (ref && ref.current) {
      ref.current.click();
    } else {
      console.error(`Reference for ${fileId} is not defined or has no current value`);
      setErrors((prev: any) => ({ ...prev, [fileId]: 'خطأ في تحديد حقل الملف' }));
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Same as in AddAvailableForm
    const { name, value } = e.target;
    setFormData((prev) => {
      const updatedFormData = { ...prev, [name]: value };
      if (name === 'Total' || name === 'Paid') {
        const total = parseFloat(updatedFormData.Total as any) || 0;
        const paid = parseFloat(updatedFormData.Paid as any) || 0;
        updatedFormData.Remaining = total - paid;
      }
      return updatedFormData;
    });
  };

const handleInputChangeWithValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  
  setFormData((prev) => {
    let updatedFormData = { ...prev, [name]: value };
    
    // Handle numeric fields properly
    if (name === 'Total' || name === 'Paid') {
      const numValue = parseFloat(value) || 0;
      updatedFormData = { ...updatedFormData, [name]: numValue };
      
      // Update remaining if needed
      if (name === 'Total' || name === 'Paid') {
        const total = name === 'Total' ? numValue : (parseFloat(prev.Total as any) || 0);
        const paid = name === 'Paid' ? numValue : (parseFloat(prev.Paid as any) || 0);
        updatedFormData.Remaining = total - paid;
      }
    }
    
    return updatedFormData;
  });
  
  // Clear specific field error on change
  setErrors((prev: any) => {
    const newErrors = { ...prev };
    delete newErrors[name];
    return newErrors;
  });
};
// Function to fetch homemaid suggestions - النسخة الأصلية المُصححة
const fetchSuggestions = async () => {
  // استخدام ExperienceYears كـ string (مثل "1-2 Years - سنوات")
  const experience = formData.ExperienceYears || '';
  // استخدام الرينج الكامل للعمر (min و max)
  const ageRange = formData.age || '';
  let minAge = 0;
  let maxAge = 0;
  if (ageRange) {
    const [min, max] = ageRange.split('-').map(Number);
    if (!isNaN(min) && !isNaN(max)) {
      minAge = min;
      maxAge = max;
    }
  }
  
  // التحقق من صحة البيانات
  if (!experience || !formData.Nationalitycopy?.trim() || !formData.Religion?.trim() || !ageRange) {
    setModalMessage('يرجى ملء سنوات الخبرة والجنسية والديانة والعمر أولاً');
    setShowErrorModal(true);
    return;
  }

  // التحقق من صحة الرينج
  if (minAge === 0 || maxAge === 0 || isNaN(minAge) || isNaN(maxAge)) {
    setModalMessage('يرجى اختيار رينج عمر صحيح');
    setShowErrorModal(true);
    return;
  }

  setIsLoadingSuggestions(true);
  try {
    // بناء URL مع معاملات البحث - إرسال الرينج الكامل
    const params = new URLSearchParams({
      experience: experience,
      nationality: formData.Nationalitycopy.trim(),
      religion: formData.Religion.trim(),
      minAge: minAge.toString(),
      maxAge: maxAge.toString(),
      ageRange: ageRange, // إرسال الرينج أيضاً للتوافق
    });

    console.log('🔍 إرسال طلب البحث مع المعاملات:', {
      experience: experience,
      nationality: formData.Nationalitycopy.trim(),
      religion: formData.Religion.trim(),
      minAge: minAge,
      maxAge: maxAge,
      ageRange: ageRange,
    });

    const response = await fetch(`/api/suggest-homemaids?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('📥 النتائج المستلمة:', data);
    
    if (data.success) {
      if (data.suggestions && data.suggestions.length > 0) {
        console.log(`✅ تم إيجاد ${data.suggestions.length} عاملة`);
        setSuggestions(data.suggestions);
        setShowSuggestionModal(true);
      } else {
        console.log('❌ لم يتم العثور على عاملات');
        setModalMessage(data.message || 'لم يتم العثور على عاملات تطابق المواصفات المطلوبة');
        setShowErrorModal(true);
      }
    } else {
      console.log('❌ خطأ:', data.message);
      setModalMessage(data.message || 'حدث خطأ أثناء البحث عن العاملات');
      setShowErrorModal(true);
    }
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    setModalMessage('حدث خطأ أثناء البحث عن العاملات. يرجى المحاولة مرة أخرى');
    setShowErrorModal(true);
  } finally {
    setIsLoadingSuggestions(false);
  }
};
  // Function to handle suggestion acceptance
  const handleAcceptSuggestion = (suggestion: HomemaidSuggestion) => {
    // تحويل العمر من رقم إلى رينج
    let ageRange = '';
    if (suggestion.age >= 21 && suggestion.age <= 30) {
      ageRange = '21-30';
    } else if (suggestion.age >= 31 && suggestion.age <= 40) {
      ageRange = '31-40';
    } else if (suggestion.age >= 41 && suggestion.age <= 50) {
      ageRange = '41-50';
    }
    
    // تحويل experience إلى Experience المناسب
    let experienceOption = '';
    const expYears = suggestion.experience || '';
    if (expYears.includes('مدربة-Training') || expYears.includes('Training')) {
      experienceOption = 'Novice | مدربة بدون خبرة';
    } else if (expYears.includes('1-2') || expYears.includes('1-2 Years')) {
      experienceOption = 'Intermediate | مدربة بخبرة متوسطة';
    } else if (expYears.includes('3-4') || expYears.includes('3-4 Years')) {
      experienceOption = 'Well-experienced | خبرة جيدة';
    } else if (expYears.includes('5') || expYears.includes('More') || expYears.includes('وأكثر')) {
      experienceOption = 'Expert | خبرة ممتازة';
    }
    
    setFormData((prev) => ({
      ...prev,
      selectedHomemaidId: suggestion.id,
      // Update form fields with selected homemaid data - بيانات العاملة فقط
      Nationalitycopy: suggestion.nationality,
      Religion: suggestion.religion,
      ExperienceYears: expYears,
      Experience: experienceOption,
      age: ageRange,
      // باقي البيانات تبقى كما هي ليتمكن المستخدم من إدخالها
    }));
    
    // مسح أي أخطاء متعلقة بالحقول التي تم ملؤها
    setErrors((prev: any) => {
      const newErrors = { ...prev };
      delete newErrors.Nationalitycopy;
      delete newErrors.Religion;
      delete newErrors.ExperienceYears;
      delete newErrors.age;
      delete newErrors.selectedHomemaidId;
      return newErrors;
    });
    
    setShowSuggestionModal(false);
    setModalMessage(`تم اختيار العاملة: ${suggestion.name}\nيرجى إكمال باقي البيانات المالية والملفات المطلوبة`);
    setShowSuccessModal(true);
  };

  // Function to handle suggestion rejection
  const handleRejectSuggestion = () => {
    setShowSuggestionModal(false);
    setSuggestions([]);
  };

  const handleClientSelect = (selectedOption: any) => {
    // Same as in AddAvailableForm
    if (selectedOption) {
      const selectedClient = clients.find(client => client.id === selectedOption.value);
      setFormData((prev) => ({
        ...prev,
        clientID: selectedOption.value,
        ClientName: selectedClient?.fullname || '',
        PhoneNumber: selectedClient?.phonenumber || '',
        city: selectedClient?.city || '',
      }));
      // Clear client-related errors
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors.clientID;
        delete newErrors.PhoneNumber;
        return newErrors;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        clientID: '',
        ClientName: '',
        PhoneNumber: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    // Client validation
    if (!formData.clientID) {
      newErrors.clientID = 'اسم العميل مطلوب';
    }

    // Phone validation (even though readonly, validate it)
    const phoneError = validatePhoneNumber(formData.PhoneNumber);
    if (phoneError) {
      newErrors.PhoneNumber = phoneError;
    }

    // Age validation
    const ageError = validateAge(formData.age);
    if (ageError) {
      newErrors.age = ageError;
    }

    // Experience validation
    const expError = validateExperience(formData.ExperienceYears);
    if (expError) {
      newErrors.ExperienceYears = expError;
    }

    // Nationality validation
    const natError = validateNationality(formData.Nationalitycopy);
    if (natError) {
      newErrors.Nationalitycopy = natError;
    }

    // Religion validation
    const relError = validateReligion(formData.Religion);
    if (relError) {
      newErrors.Religion = relError;
    }

    // Payment amounts validation
    const totalError = validateAmount(formData.Total);
    if (totalError) {
      newErrors.Total = totalError;
    }

    const paidError = validateAmount(formData.Paid);
    if (paidError) {
      newErrors.Paid = paidError;
    }

    // File uploads validation
    // ملف سند الأمر غير مطلوب إذا كان الدفع كاش
    const isCashPayment = formData.PaymentMethod === 'cash' || formData.PaymentMethod === 'كاش';
    if (!isCashPayment && !fileUploaded.orderDocument) {
      newErrors.orderDocument = 'ملف سند الأمر مطلوب';
    }
    if (!fileUploaded.contract) {
      newErrors.contract = 'ملف العقد مطلوب';
    }

    // Homemaid validation - يجب اختيار عاملة
    if (!formData.selectedHomemaidId) {
      newErrors.selectedHomemaidId = 'يجب اختيار عاملة';
      // If no homemaid selected, specs are required
      if (!formData.Nationalitycopy) newErrors.Nationalitycopy = 'الجنسية مطلوبة';
      if (!formData.Religion) newErrors.Religion = 'الديانة مطلوبة';
      if (!formData.ExperienceYears || formData.ExperienceYears.trim() === '') newErrors.ExperienceYears = 'سنوات الخبرة مطلوبة';
      if (!formData.age || formData.age.trim() === '') newErrors.age = 'العمر مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setModalMessage('يرجى تصحيح الأخطاء في النموذج قبل الإرسال');
      setShowErrorModal(true);
      return;
    }
    try {
      let submitData = { ...formData } as any;
      
      // Map selectedHomemaidId to HomemaidId for backend compatibility
      if (formData.selectedHomemaidId) {
        submitData.HomemaidId = formData.selectedHomemaidId;
      }
      
      if (orderId) {
        // For updates, send data in the format expected by track_order endpoint
        submitData = {
          section: 'homemaidInfo',
          updatedData: {
            id: formData.selectedHomemaidId,
            name: formData.ClientName,
            nationality: formData.Nationalitycopy,
            religion: formData.Religion,
            experience: formData.ExperienceYears,
            age: formData.age,
            notes: formData.notes,
            typeOfContract: "recruitment",
            paymentMethod: formData.PaymentMethod,
            total: formData.Total,
            paid: formData.Paid,
            remaining: formData.Remaining,
            orderDocument: formData.orderDocument,
            contract: formData.contract,
          }
        };
      }
      const url = orderId ? `/api/track_order/${orderId}` : '/api/submitneworderbyspecs';
      const method = orderId ? 'PATCH' : 'POST';
      
      console.log('Submitting specs order data:', { url, method, submitData });
      
      const response = await axios({
        method,
        url,
        data: submitData,
      });
      setModalMessage(orderId ? 'تم تحديث الطلب بنجاح' : 'تم إضافة الطلب بنجاح');
      setShowSuccessModal(true);
      setFileUploaded({ orderDocument: false, contract: false });
      setErrors({});
      onSuccess();
    } catch (error: any) {
      setModalMessage(error.response?.data?.message || `حدث خطأ أثناء ${orderId ? 'تحديث' : 'إضافة'} الطلب`);
      setShowErrorModal(true);
    }
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setShowUploadSuccessModal(false);
    setShowSuggestionModal(false);
    setModalMessage('');
    setUploadSuccessMessage('');
  };

  const clientOptions = clients.map(client => ({
    value: client.id,
    label: client.fullname,
  }));

  const selectedClientOption = clientOptions.find(option => option.label === formData.ClientName);

  // Helper function to get input className with error styling
  const getInputClassName = (fieldName: string) => {
    return `bg-gray-50 border ${errors[fieldName] ? 'border-red-500' : 'border-gray-300'} rounded p-3 text-base text-gray-500 text-right focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors duration-200`;
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
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-normal text-right">
          {orderId ? 'تعديل طلب حسب المواصفات' : 'طلب جديد حسب المواصفات'}
        </h1>
        <button className="p-2 text-gray-600 hover:text-gray-800" onClick={onCancel}>
          <X className="w-6 h-6" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-300 p-10 rounded">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          <div className="flex flex-col gap-2">
            <label className="text-base">اسم العميل</label>
            <Select
              options={clientOptions}
              onChange={handleClientSelect}
              value={selectedClientOption || null}
              placeholder="اختر عميل"
              className={`text-right ${errors.clientID ? 'border-red-500' : ''}`}
              styles={{
                control: (base, state) => ({
                  ...base,
                  backgroundColor: '#F9FAFB',
                  borderColor: state.isFocused 
                    ? '#14b8a6' 
                    : errors.clientID 
                    ? '#ef4444' 
                    : '#D1D5DB',
                  padding: '0.5rem',
                  textAlign: 'right',
                  boxShadow: state.isFocused ? '0 0 0 1px #14b8a6' : 'none',
                }),
                menu: (base) => ({ ...base, textAlign: 'right' }),
                singleValue: (base) => ({ ...base, textAlign: 'right' }),
                placeholder: (base) => ({ ...base, textAlign: 'right' }),
              }}
            />
            {errors.clientID && <p className="text-red-500 text-md mt-1">{errors.clientID}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">رقم العميل</label>
            <input
              type="text"
              name="PhoneNumber"
              value={formData.PhoneNumber}
              readOnly
              className={getInputClassName('PhoneNumber')}
            />
            {errors.PhoneNumber && <p className="text-red-500 text-md mt-1">{errors.PhoneNumber}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">مدينة العميل</label>


                  <input
              type="text"
              name="city"
              placeholder="مدينة العميل"
              value={arabicRegionMap[formData?.city as keyof typeof arabicRegionMap] || formData?.city || ''}
              readOnly
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
            />
            {/* <input
              type="text"
              placeholder="مدينة العميل"
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
            /> */}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">العمر</label>
            <Select
              options={[
                { value: '21-30', label: '21-30' },
                { value: '31-40', label: '31-40' },
                { value: '41-50', label: '41-50' },
              ]}
              onChange={(selectedOption) => {
                setFormData((prev) => ({
                  ...prev,
                  age: selectedOption?.value || '',
                }));
                setErrors((prev: any) => {
                  const newErrors = { ...prev };
                  delete newErrors.age;
                  return newErrors;
                });
              }}
              value={formData.age ? { value: formData.age, label: formData.age } : null}
              placeholder="اختر العمر"
              isDisabled={!!formData.selectedHomemaidId}
              className={`text-right ${errors.age ? 'border-red-500' : ''}`}
              styles={{
                control: (base, state) => ({
                  ...base,
                  backgroundColor: formData.selectedHomemaidId ? '#E5E7EB' : '#F9FAFB',
                  borderColor: state.isFocused 
                    ? '#14b8a6' 
                    : errors.age 
                    ? '#ef4444' 
                    : '#D1D5DB',
                  padding: '0.5rem',
                  textAlign: 'right',
                  boxShadow: state.isFocused ? '0 0 0 1px #14b8a6' : 'none',
                }),
                menu: (base) => ({ ...base, textAlign: 'right' }),
                singleValue: (base) => ({ ...base, textAlign: 'right' }),
                placeholder: (base) => ({ ...base, textAlign: 'right' }),
              }}
            />
            {errors.age && <p className="text-red-500 text-md mt-1">{errors.age}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">سنوات الخبرة</label>
            <Select
              options={experienceOptions.map(exp => ({ value: exp, label: exp }))}
              onChange={(selectedOption) => {
                if (selectedOption) {
                  handleExperienceChange(selectedOption.value);
                }
              }}
              value={formData.Experience ? { value: formData.Experience, label: formData.Experience } : null}
              placeholder="اختر سنوات الخبرة"
              isDisabled={!!formData.selectedHomemaidId}
              className={`text-right ${errors.ExperienceYears ? 'border-red-500' : ''}`}
              styles={{
                control: (base, state) => ({
                  ...base,
                  backgroundColor: formData.selectedHomemaidId ? '#E5E7EB' : '#F9FAFB',
                  borderColor: state.isFocused 
                    ? '#14b8a6' 
                    : errors.ExperienceYears 
                    ? '#ef4444' 
                    : '#D1D5DB',
                  padding: '0.5rem',
                  textAlign: 'right',
                  boxShadow: state.isFocused ? '0 0 0 1px #14b8a6' : 'none',
                }),
                menu: (base) => ({ ...base, textAlign: 'right' }),
                singleValue: (base) => ({ ...base, textAlign: 'right' }),
                placeholder: (base) => ({ ...base, textAlign: 'right' }),
              }}
            />
            {formData.ExperienceYears && (
              <p className="text-sm text-gray-600 mt-1 text-right">
                {formData.ExperienceYears}
              </p>
            )}
            {errors.ExperienceYears && <p className="text-red-500 text-md mt-1">{errors.ExperienceYears}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">جنسية العاملة المطلوبة</label>
            <Select
              options={nationalities}
              onChange={(selectedOption) => {
                setFormData((prev) => ({
                  ...prev,
                  Nationalitycopy: selectedOption?.value || '',
                }));
                setErrors((prev: any) => {
                  const newErrors = { ...prev };
                  delete newErrors.Nationalitycopy;
                  return newErrors;
                });
              }}
              value={formData.Nationalitycopy ? nationalities.find(nat => nat.value === formData.Nationalitycopy) || null : null}
              placeholder="اختر جنسية العاملة المطلوبة"
              isDisabled={!!formData.selectedHomemaidId}
              className={`text-right ${errors.Nationalitycopy ? 'border-red-500' : ''}`}
              styles={{
                control: (base, state) => ({
                  ...base,
                  backgroundColor: formData.selectedHomemaidId ? '#E5E7EB' : '#F9FAFB',
                  borderColor: state.isFocused 
                    ? '#14b8a6' 
                    : errors.Nationalitycopy 
                    ? '#ef4444' 
                    : '#D1D5DB',
                  padding: '0.5rem',
                  textAlign: 'right',
                  boxShadow: state.isFocused ? '0 0 0 1px #14b8a6' : 'none',
                }),
                menu: (base) => ({ ...base, textAlign: 'right' }),
                singleValue: (base) => ({ ...base, textAlign: 'right' }),
                placeholder: (base) => ({ ...base, textAlign: 'right' }),
              }}
            />
            {errors.Nationalitycopy && <p className="text-red-500 text-md mt-1">{errors.Nationalitycopy}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">الديانة</label>
            <Select
              options={religionOptions.map(rel => ({ value: rel, label: rel }))}
              onChange={(selectedOption) => {
                setFormData((prev) => ({
                  ...prev,
                  Religion: selectedOption?.value || '',
                }));
                setErrors((prev: any) => {
                  const newErrors = { ...prev };
                  delete newErrors.Religion;
                  return newErrors;
                });
              }}
              value={formData.Religion ? religionOptions.find(rel => rel === formData.Religion) ? { value: formData.Religion, label: formData.Religion } : null : null}
              placeholder="اختر الديانة"
              isDisabled={!!formData.selectedHomemaidId}
              className={`text-right ${errors.Religion ? 'border-red-500' : ''}`}
              styles={{
                control: (base, state) => ({
                  ...base,
                  backgroundColor: formData.selectedHomemaidId ? '#E5E7EB' : '#F9FAFB',
                  borderColor: state.isFocused 
                    ? '#14b8a6' 
                    : errors.Religion 
                    ? '#ef4444' 
                    : '#D1D5DB',
                  padding: '0.5rem',
                  textAlign: 'right',
                  boxShadow: state.isFocused ? '0 0 0 1px #14b8a6' : 'none',
                }),
                menu: (base) => ({ ...base, textAlign: 'right' }),
                singleValue: (base) => ({ ...base, textAlign: 'right' }),
                placeholder: (base) => ({ ...base, textAlign: 'right' }),
              }}
            />
            {errors.Religion && <p className="text-red-500 text-md mt-1">{errors.Religion}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">ملاحظات إضافية</label>
            <input
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              placeholder="ادخل أي ملاحظات أو بيانات أخرى ..."
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
            />
          </div>
<div className="flex flex-col gap-2">
  <label className="text-base"> &nbsp;  </label>

  <button
    type="button"
    onClick={fetchSuggestions}
    disabled={isLoadingSuggestions}
    className={`bg-teal-800 text-white px-4 py-2 rounded w-full sm:w-auto hover:bg-teal-700 transition duration-200 ${
      isLoadingSuggestions 
        ? 'opacity-50 cursor-not-allowed' 
        : 'hover:bg-teal-700'
    }`}
  >
    {isLoadingSuggestions ? 'جاري البحث...' : 'اقترح عاملة مناسبة'}
  </button>
  {errors.selectedHomemaidId && <p className="text-red-500 text-md mt-1">{errors.selectedHomemaidId}</p>}
</div>
        </div>
        
        {/* رسالة تحذيرية عند عدم اختيار عاملة */}
        {!formData.selectedHomemaidId && errors.selectedHomemaidId && (
          <div className="mb-6 bg-red-50 border-2 border-red-500 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-600 text-base font-semibold">{errors.selectedHomemaidId}</p>
            </div>
          </div>
        )}
        
        {/* عرض بيانات العاملة المختارة */}
        {formData.selectedHomemaidId && (
          <div className="mb-10 bg-gradient-to-r from-teal-50 to-green-50 border-2 border-teal-600 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-semibold text-teal-900">تم اختيار العاملة المناسبة</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    selectedHomemaidId: undefined,
                    Nationalitycopy: '',
                    Religion: '',
                    ExperienceYears: '',
                    Experience: '',
                    age: '',
                  }));
                  setModalMessage('تم إلغاء اختيار العاملة. يمكنك الآن إدخال المواصفات يدوياً');
                  setShowSuccessModal(true);
                }}
                className="text-red-600 hover:text-red-800 text-sm underline flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                إلغاء الاختيار
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">الجنسية</p>
                <p className="text-lg font-semibold text-teal-900">{formData.Nationalitycopy}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">الديانة</p>
                <p className="text-lg font-semibold text-teal-900">{formData.Religion}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">الخبرة</p>
                <p className="text-lg font-semibold text-teal-900">{formData.ExperienceYears}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">العمر</p>
                <p className="text-lg font-semibold text-teal-900">{formData.age} سنة</p>
              </div>
            </div>
            <div className="mt-4 bg-teal-100 border border-teal-300 rounded-lg p-3">
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5 text-teal-700" />
                <p className="text-sm text-teal-800 text-center">
                  يرجى إكمال البيانات المالية وطريقة الدفع ورفع الملفات المطلوبة أدناه
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-10">
          <h2 className="text-base font-normal mb-2">طريقة الدفع المختارة</h2>
          <div className="flex gap-[56px] justify-center flex-wrap">
            {[
              { option: 'كاش', value: 'cash', imgSrc: <CashIcon className="w-6 h-6" /> },
              { option: 'دفعتين', value: 'two-installments', imgSrc: <CreditCardIcon className="w-6 h-6" /> },
              { option: 'ثلاثة دفعات', value: 'three-installments', imgSrc: <CurrencyDollarIcon className="w-6 h-6" /> },
              { option: 'مخصص', value: 'custom', imgSrc: <CurrencyDollarIcon className="w-6 h-6" /> },

            ].map(({ option, value, imgSrc }, index) => (
              <label key={index} className="payment-option">
                <input
                  type="radio"
                  name="PaymentMethod"
                  value={value}
                  checked={formData.PaymentMethod === value}
                  onChange={handleFormChange}
                  className="hidden"
                />
                <div className={`payment-button flex items-center justify-center gap-[10px] p-[14px] border-2 rounded-[8px] bg-[#f7f8fa] cursor-pointer w-[245px] text-[#1a4d4f] text-[20px] transition-border-color duration-200 ${formData.PaymentMethod === value ? 'border-[#1a4d4f] bg-teal-800 text-white' : 'border-[#e0e0e0]'}`}>
                  <span className="text-xl">{option}</span>
{imgSrc}
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          <div className="flex flex-col gap-2">
            <label className="text-base">المبلغ كامل</label>
            <input
              type="number"
              name="Total"
              value={formData.Total || ''}
              onChange={handleInputChangeWithValidation}
              min="0"
              step="0.01"
              className={getInputClassName('Total')}
              placeholder="0.00"
            />
            {errors.Total && <p className="text-red-500 text-md mt-1">{errors.Total}</p>}
          </div>
          <div className="flex flex-col gap-2 "> 
            <label className="text-base">المبلغ المدفوع</label>
            <input
              type="number"
              name="Paid"
              value={formData.Paid || ''}
              onChange={handleInputChangeWithValidation}
              min="0"
              max={formData.Total}
              step="0.01"
              className={getInputClassName('Paid')}
              placeholder="0.00"
            />
            {errors.Paid && <p className="text-red-500 text-md mt-1">{errors.Paid}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">المبلغ المتبقي</label>
            <input
              type="text"
              value={`${formData.Remaining.toFixed(2)} SR`}
              readOnly
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
            />
          </div>
        </div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
  {[
    { id: 'orderDocument', label: 'ملف سند الأمر', required: formData.PaymentMethod !== 'cash' && formData.PaymentMethod !== 'كاش' },
    { id: 'contract', label: 'ملف العقد', required: true },
  ].filter(file => {
    // إخفاء ملف سند الأمر إذا كان الدفع كاش
    if (file.id === 'orderDocument' && (formData.PaymentMethod === 'cash' || formData.PaymentMethod === 'كاش')) {
      return false;
    }
    return true;
  }).map((file) => {
    const isUploaded = (fileUploaded as any)[file.id];
    const fileName = (fileNames as any)[file.id];
    const fileUrl = formData[file.id as keyof FormData] as string;

    const isCashPayment = formData.PaymentMethod === 'cash' || formData.PaymentMethod === 'كاش';
    const isOrderDocument = file.id === 'orderDocument';
    
    return (
      <div key={file.id} className="flex flex-col gap-2">
        <label htmlFor={file.id} className="text-base">
          {file.label}
          {file.required && <span className="text-red-500"> *</span>}
        </label>
        <div className={`file-upload-display border ${errors[file.id] ? 'border-red-500' : 'border-gray-300'} rounded p-3 flex flex-col gap-2 transition-colors duration-200`}>
          
          {/* عرض اسم الملف */}
          <div className="flex justify-between items-center">
            {isUploaded && fileName ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-md">
                    <p className="font-medium text-gray-800 truncate max-w-[200px]" title={fileName}>
                      {fileName}
                    </p>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:underline text-md"
                    >
                      فتح الملف
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // وظيفة إزالة الملف
                    setFileUploaded((prev: any) => ({ ...prev, [file.id]: false }));
                    setFileNames((prev: any) => ({ ...prev, [file.id]: '' }));
                    setFormData((prev: any) => ({ ...prev, [file.id]: '' }));
                    setErrors((prev: any) => ({ ...prev, [file.id]: '' }));
                    
                    // مسح من input
                    const ref = fileInputRefs[file.id as keyof typeof fileInputRefs];
                    if (ref && ref.current) {
                      ref.current.value = '';
                    }
                  }}
                  className="text-red-500 hover:text-red-700 text-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <span className="text-gray-500 text-md">
                {errors[file.id] ? errors[file.id] : (isOrderDocument && isCashPayment ? 'غير مطلوب للدفع كاش' : 'لم يتم اختيار ملف')}
              </span>
            )}
          </div>

          {/* زر اختيار الملف */}
          <input
            type="file"
            id={file.id}
            ref={fileInputRefs[file.id as keyof typeof fileInputRefs]}
            className="hidden"
            accept="application/pdf,image/jpeg,image/png"
            onChange={(e) => handleFileChange(e, file.id)}
          />
          <button
            type="button"
            className={`w-full px-3 py-2 rounded text-md transition duration-200 flex items-center justify-center gap-2 ${
              (fileUploading as any)[file.id]
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-teal-900 text-white hover:bg-teal-800'
            }`}
            onClick={() => handleButtonClick(file.id)}
            disabled={(fileUploading as any)[file.id]}
          >
            {(fileUploading as any)[file.id] ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                جاري الرفع...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {isUploaded ? 'تغيير الملف' : 'اختيار ملف'}
              </>
            )}
          </button>
        </div>
        {(!isUploaded && !errors[file.id] && !(isOrderDocument && isCashPayment)) && (
          <p className="text-md text-gray-500 text-right mt-1">
            يُفضل PDF أو صورة (أقل من 10 ميجابايت)
          </p>
        )}
      </div>
    );
  })}
</div>
        <div className="flex gap-6 flex-col sm:flex-row">
          <button 
            type="submit" 
            className="bg-teal-900 text-white px-4 py-2 rounded w-full sm:w-40 hover:bg-teal-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            // disabled={Object.keys(errors).length > 0}
          >
            حفظ
          </button>
          <button type="button" onClick={onCancel} className="bg-gray-100 text-gray-800 border-2 border-teal-800 px-4 py-2 rounded w-full sm:w-40 hover:bg-gray-200 transition duration-200">إلغاء</button>
        </div>
      </form>
      {/* Suggestion Modal */}
      {showSuggestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-right">اقتراحات العاملات المناسبة</h3>
              <button
                className="text-gray-600 hover:text-gray-800"
                onClick={closeModal}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 items-stretch">
              {suggestions.map((suggestion, index) => (
                <div key={suggestion.id} className={`flex flex-col border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  index === 0 ? 'border-green-500 bg-green-50' : 
                  index === 1 ? 'border-blue-500 bg-blue-50' : 
                  'border-gray-200'
                }`}>
                  <div className="text-center mb-3">
                    {index === 0 && (
                      <div className="bg-green-600 text-white text-md px-2 py-1 rounded-full inline-block mb-2">
                        الأكثر مناسبة
                      </div>
                    )}
                    {index === 1 && (
                      <div className="bg-blue-600 text-white text-md px-2 py-1 rounded-full inline-block mb-2">
                        مناسبة جداً
                      </div>
                    )}
                    {suggestion.picture && (
                      <img 
                        src={suggestion.picture} 
                        alt={suggestion.name}
                        className="w-16 h-16 rounded-full mx-auto mb-2 object-cover"
                      />
                    )}
                    <h4 className="font-semibold text-lg">{suggestion.name}</h4>
                    <p className="text-gray-600">رقم الجواز: {suggestion.passportNumber}</p>
                    {suggestion.relevanceScore !== undefined && (
                      <p className="text-md text-gray-500 mt-1">
                        نقاط التطابق: {suggestion.relevanceScore}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 text-md">
                    <div className="flex justify-between">
                      <span className="font-medium">الجنسية:</span>
                      <span>{suggestion.nationality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">الديانة:</span>
                      <span>{suggestion.religion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">الخبرة:</span>
                      <span>{suggestion.experience} سنوات</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">العمر:</span>
                      <span>{suggestion.age} سنة</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">المكتب:</span>
                      <span>{suggestion.office}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto pt-4">
                    <button
                      onClick={() => handleAcceptSuggestion(suggestion)}
                      className={`flex-1 px-3 py-2 rounded transition-colors ${
                        index === 0 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : index === 1
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-teal-600 text-white hover:bg-teal-700'
                      }`}
                    >
                      {index === 0 ? 'موافق' : index === 1 ? 'موافق' : 'موافق'}
                    </button>
                    <button
                      onClick={handleRejectSuggestion}
                      className="flex-1 bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 transition-colors"
                    >
                      رفض
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleRejectSuggestion}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {(showSuccessModal || showErrorModal || showUploadSuccessModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center relative">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
              onClick={closeModal}
            >
              <X className="w-5 h-5" />
            </button>
            <p className={
              showSuccessModal 
                ? "text-teal-900" 
                : showUploadSuccessModal 
                ? "text-green-600" 
                : "text-red-600"
            }>
              {showUploadSuccessModal ? uploadSuccessMessage : modalMessage}
            </p>
            <button
              className="bg-teal-900 text-white px-4 py-2 rounded mt-4 hover:bg-teal-800 transition duration-200"
              onClick={closeModal}
            >
              موافق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}