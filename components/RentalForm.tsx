import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { CashIcon } from '@heroicons/react/outline';
import { Calendar, CreditCard, Wallet, CheckCircle, X, AlertCircle, AlertTriangle } from 'lucide-react';
import Style from 'styles/Home.module.css';

interface FormData {
  customerName: string;
  phoneNumber: string;
  nationalId: string;
  customerCity: string;
  workerId: string;
  contractDuration: string;
  contractDurationMonths: number;
  contractDurationDays: number;
  contractStartDate: string;
  contractEndDate: string;
  contractFile: string | null;
  paymentMethod: string;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
}

interface ValidationErrors {
  customerName?: string | null;
  phoneNumber?: string | null;
  nationalId?: string | null;
  customerCity?: string | null;
  workerId?: string | null;
  contractDuration?: string | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  contractFile?: string | null;
  totalAmount?: string | null;
  paidAmount?: string | null;
  form?: string | null;
}

interface Homemaid {
  id: number;
  Name: string;
}

export default function RentalForm() {
  const router = useRouter();
  const { clientId, newClient } = router.query;
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    phoneNumber: '',
    nationalId: '',
    customerCity: '',
    workerId: '',
    contractDuration: '',
    contractDurationMonths: 0,
    contractDurationDays: 0,
    contractStartDate: '',
    contractEndDate: '',
    contractFile: null,
    paymentMethod: 'two-installments',
    totalAmount: '',
    paidAmount: '',
    remainingAmount: '',
  });
  
  // Validation states
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const arabicRegionMap: { [key: string]: string } = {
    'Ar Riyāḍ': 'الرياض',
    'Makkah al Mukarramah': 'مكة المكرمة',
    'Al Madīnah al Munawwarah': 'المدينة المنورة',
    'Ash Sharqīyah': 'المنطقة الشرقية',
    'Asīr': 'عسير',
    'Tabūk': 'تبوك',
    'Al Ḩudūd ash Shamālīyah': 'الحدود الشمالية',
    'Jazan': 'جازان',
    'Najrān': 'نجران',
    'Al Bāḩah': 'الباحة',
    'Al Jawf': 'الجوف',
    'Al Qaşīm': 'القصيم',
    'Ḩa\'il': 'حائل',
  };
  
  const [isLoading, setIsLoading] = useState(false);
  const [homemaidSearchTerm, setHomemaidSearchTerm] = useState('');
  const [homemaidSuggestions, setHomemaidSuggestions] = useState<any[]>([]);
  const [showHomemaidSuggestions, setShowHomemaidSuggestions] = useState(false);
  const [isSearchingHomemaids, setIsSearchingHomemaids] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Confirmation modal state (replaces window.confirm)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [pendingHomemaid, setPendingHomemaid] = useState<any>(null);

  // Validation functions
  const validatePhoneNumber = (phone: string): string | null => {
    const phoneRegex = /^5[0-9]{8}$/; // Saudi mobile number pattern
    // if (!phone.trim()) return 'رقم الجوال مطلوب';
    // if (!phoneRegex.test(phone)) return 'رقم الجوال غير صحيح (يجب أن يبدأ بـ 5 ويكون 9 أرقام)';
    return null;
  };

  const validateNationalId = (nationalId: string): string | null => {
    // if (!nationalId.trim()) return 'الرقم الوطني مطلوب';
    // if (!/^\d{10}$/.test(nationalId)) return 'الرقم الوطني يجب أن يكون 10 أرقام';
    return null;
  };

  const validateCustomerName = (name: string): string | null => {
    if (!name.trim()) return 'اسم العميل مطلوب';
    if (name.trim().length < 2) return 'اسم العميل قصير جداً';
    if (!/^[^\d]+$/.test(name.trim())) return 'اسم العميل يجب أن يحتوي على أحرف فقط';
    return null;
  };

  // Calculate contract duration in months and days
  const calculateContractDuration = (startDate: string, endDate: string): { months: number; days: number; displayText: string } => {
    if (!startDate || !endDate) {
      return { months: 0, days: 0, displayText: '' };
    }

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    if (end <= start) {
      return { months: 0, days: 0, displayText: '' };
    }

    // Calculate months and remaining days
    let months = 0;
    let days = 0;
    let currentDate = new Date(start);

    // Calculate months by incrementing month by month
    while (currentDate < end) {
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      if (nextMonth <= end) {
        months++;
        currentDate = new Date(nextMonth);
      } else {
        break;
      }
    }

    // Calculate remaining days
    if (currentDate < end) {
      const daysDiff = end.getTime() - currentDate.getTime();
      days = Math.ceil(daysDiff / (1000 * 60 * 60 * 24));
    }

    // Format display text
    let displayText = '';
    if (months > 0 && days > 0) {
      displayText = `${months} ${months === 1 ? 'شهر' : 'أشهر'} و ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
    } else if (months > 0) {
      displayText = `${months} ${months === 1 ? 'شهر' : 'أشهر'}`;
    } else if (days > 0) {
      displayText = `${days} ${days === 1 ? 'يوم' : 'أيام'}`;
    } else {
      displayText = '';
    }

    return { months, days, displayText };
  };

  const validateContractDuration = (duration: string): string | null => {
    // Duration is now auto-calculated, so validation is optional
    return null;
  };

  const validateDates = (startDate: string, endDate: string): { startError: string | null; endError: string | null } => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let startError = null;
    let endError = null;
    
    if (!startDate) {
      startError = 'تاريخ بداية العقد مطلوب';
    }
    
    if (!endDate) {
      endError = 'تاريخ نهاية العقد مطلوب';
    } else if (startDate && end <= start) {
      endError = 'تاريخ نهاية العقد يجب أن يكون بعد تاريخ البداية';
    }
    
    return { startError, endError };
  };

  const validateWorkerId = (workerId: string): string | null => {
    if (!workerId.trim()) return 'عاملة مطلوبة';
    return null;
  };

  const validateContractFile = (contractFile: string | null): string | null => {
    if (!contractFile) return 'ملف العقد مطلوب';
    return null;
  };

  const validateAmounts = (total: string, paid: string): { totalError: string | null; paidError: string | null } => {
    let totalError = null;
    let paidError = null;
    
    const totalNum = parseFloat(total);
    const paidNum = parseFloat(paid);
    
    if (total && (isNaN(totalNum) || totalNum <= 0)) {
      totalError = 'المبلغ الكلي يجب أن يكون رقم موجب';
    }
    
    if (paid && (isNaN(paidNum) || paidNum < 0)) {
      paidError = 'المبلغ المدفوع يجب أن يكون رقم موجب أو صفر';
    }
    
    if (total && paid && paidNum > totalNum) {
      paidError = 'المبلغ المدفوع لا يمكن أن يكون أكبر من المبلغ الكلي';
    }
    
    return { totalError, paidError };
  };

  // Validate single field
  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case 'customerName':
        return validateCustomerName(value);
      case 'phoneNumber':
        return validatePhoneNumber(value);
      case 'nationalId':
        return validateNationalId(value);
      case 'contractDuration':
        return validateContractDuration(value);
      case 'workerId':
        return validateWorkerId(value);
      default:
        return null;
    }
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Required fields validation
    newErrors.customerName = validateCustomerName(formData.customerName);
    newErrors.phoneNumber = validatePhoneNumber(formData.phoneNumber);
    newErrors.nationalId = validateNationalId(formData.nationalId);
    newErrors.workerId = validateWorkerId(formData.workerId);
    // contractDuration is now auto-calculated, no need to validate
    newErrors.contractFile = validateContractFile(formData.contractFile);
    
    // Date validation
    const { startError, endError } = validateDates(formData.contractStartDate, formData.contractEndDate);
    if (startError) newErrors.contractStartDate = startError;
    if (endError) newErrors.contractEndDate = endError;
    
    // Validate that contract duration is calculated (dates are valid)
    if (formData.contractStartDate && formData.contractEndDate) {
      const start = new Date(formData.contractStartDate);
      const end = new Date(formData.contractEndDate);
      if (end <= start) {
        newErrors.contractEndDate = 'تاريخ نهاية العقد يجب أن يكون بعد تاريخ البداية';
      }
    }
    
    // Amount validation
    const { totalError, paidError } = validateAmounts(formData.totalAmount, formData.paidAmount);
    if (totalError) newErrors.totalAmount = totalError;
    if (paidError) newErrors.paidAmount = paidError;
    
    setErrors(newErrors);
    
    // Check if there are any errors
    return Object.values(newErrors).every(error => !error);
  };

  // Helper: Upload contract file
  const uploadContractFile = async (selectedFile: File, idHint?: string): Promise<string> => {
    setIsUploadingFile(true);
    try {
      const hint = idHint || (typeof clientId === 'string' && clientId) || Date.now().toString();
      const response = await fetch(`/api/upload-presigned-url/${hint}`, { method: 'GET' });
      if (!response.ok) {
        throw new Error('Failed to get presigned URL');
      }
      const { url, filePath } = await response.json();

      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': 'application/pdf',
          'x-amz-acl': 'public-read',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      return filePath as string;
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Fetch client data
  useEffect(() => {
    if (clientId) {
      const fetchClient = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/clients?clientId=${clientId}`);
          const data = await response.json();
          if (response.ok && data.data && data.data.length > 0) {
            const client = data.data[0];
            setFormData((prev) => ({
              ...prev,
              customerName: client.fullname,
              phoneNumber: client.phonenumber,
              nationalId: client.nationalId,
              customerCity: client.city,
            }));
          } else {
            setModalMessage('لم يتم العثور على العميل');
            setShowErrorModal(true);
          }
        } catch (err) {
          console.error('Error fetching client:', err);
          setModalMessage('خطأ في جلب بيانات العميل');
          setShowErrorModal(true);
        } finally {
          setIsLoading(false);
        }
      };
      fetchClient();
    }
  }, [clientId]);

  // Search homemaids
  const searchHomemaids = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setHomemaidSuggestions([]);
      setShowHomemaidSuggestions(false);
      return;
    }
    
    setIsSearchingHomemaids(true);
    try {
      const isId = searchTerm.match(/^\d+$/);
      
      let response;
      if (isId) {
        response = await fetch(`/api/getallhomemaids?id=${searchTerm}`);
      } else {
        response = await fetch(`/api/homemaids/suggestions?q=${encodeURIComponent(searchTerm)}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        let suggestions = [];
        
        if (isId) {
          if (data.data && data.data.length > 0) {
            suggestions = data.data.map((homemaid: any) => ({
              id: homemaid.id,
              Name: homemaid.Name,
              Country: homemaid.office?.Country || '',
              religion: homemaid.Religion || '',
              bookingstatus: homemaid.bookingstatus || '',
            }));
          }
        } else {
          suggestions = data.suggestions || [];
        }
        
        setHomemaidSuggestions(suggestions);
        setShowHomemaidSuggestions(true);
      } else {
        setHomemaidSuggestions([]);
        setShowHomemaidSuggestions(false);
      }
    } catch (error) {
      console.error('Error searching homemaids:', error);
      setHomemaidSuggestions([]);
      setShowHomemaidSuggestions(false);
    } finally {
      setIsSearchingHomemaids(false);
    }
  };

  const handleHomemaidSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHomemaidSearchTerm(value);
    
    if (value.trim()) {
      searchHomemaids(value);
    } else {
      setHomemaidSuggestions([]);
      setShowHomemaidSuggestions(false);
      setFormData(prev => ({ ...prev, workerId: '' }));
      setErrors(prev => ({ ...prev, workerId: validateWorkerId('') }));
    }
  };

  const selectHomemaid = useCallback((homemaid: any) => {
    setFormData((prev) => ({
      ...prev,
      workerId: homemaid.id.toString(),
    }));
    setHomemaidSearchTerm(homemaid.Name);
    setShowHomemaidSuggestions(false);
    setErrors(prev => ({ ...prev, workerId: null }));
    setTouched(prev => ({ ...prev, workerId: true }));
  }, []);

  const handleHomemaidSuggestionClick = (homemaid: any) => {
    if (homemaid.bookingstatus === 'غير لائقة طبيا' || homemaid.bookingstatus === 'غير لائقة طبياً') {
      setPendingHomemaid(homemaid);
      setConfirmModalMessage('هذه العاملة فشلت في الفحص الطبي. هل تود المتابعة واختيارها؟');
      setShowConfirmModal(true);
      return;
    }
    selectHomemaid(homemaid);
  };

  const handleConfirmModalAccept = () => {
    if (pendingHomemaid) {
      selectHomemaid(pendingHomemaid);
    }
    setShowConfirmModal(false);
    setPendingHomemaid(null);
    setConfirmModalMessage('');
  };

  const handleConfirmModalCancel = () => {
    setShowConfirmModal(false);
    setPendingHomemaid(null);
    setConfirmModalMessage('');
  };

  const handleHomemaidInputBlur = () => {
    setTimeout(() => {
      setShowHomemaidSuggestions(false);
    }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.homemaid-search-container')) {
        setShowHomemaidSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const closeModal = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setModalMessage('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    const fieldName = id.replace('-', '');
    
    setFormData((prev) => {
      const newData = { ...prev, [fieldName]: value };
      
      // Auto-calculate remaining amount
      if (fieldName === 'totalAmount' || fieldName === 'paidAmount') {
        const total = parseFloat(newData.totalAmount) || 0;
        const paid = parseFloat(newData.paidAmount) || 0;
        newData.remainingAmount = (total - paid).toFixed(2);
      }
      
      // Auto-calculate contract duration when dates change
      if (fieldName === 'contractStartDate' || fieldName === 'contractEndDate') {
        const startDate = fieldName === 'contractStartDate' ? value : newData.contractStartDate;
        const endDate = fieldName === 'contractEndDate' ? value : newData.contractEndDate;
        
        if (startDate && endDate) {
          const duration = calculateContractDuration(startDate, endDate);
          newData.contractDurationMonths = duration.months;
          newData.contractDurationDays = duration.days;
          newData.contractDuration = duration.displayText;
        } else {
          newData.contractDurationMonths = 0;
          newData.contractDurationDays = 0;
          newData.contractDuration = '';
        }
      }
      
      return newData;
    });
    
    // Clear error on change (validation will happen on blur for dates)
    if (fieldName === 'contractStartDate' || fieldName === 'contractEndDate') {
      setErrors(prev => ({ 
        ...prev, 
        contractStartDate: fieldName === 'contractStartDate' ? undefined : prev.contractStartDate,
        contractEndDate: fieldName === 'contractEndDate' ? undefined : prev.contractEndDate
      }));
    } else {
      setErrors(prev => ({ ...prev, [fieldName]: undefined }));
    }
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (!selectedFile) return;

    // Validate file type
    if (selectedFile.type !== 'application/pdf') {
      setModalMessage('الرجاء اختيار ملف PDF فقط');
      setShowErrorModal(true);
      e.target.value = ''; // Reset file input
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setModalMessage('حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)');
      setShowErrorModal(true);
      e.target.value = '';
      return;
    }

    setIsProcessingFile(true);
    setFile(selectedFile);
    try {
      const uploadedPath = await uploadContractFile(selectedFile);
      setFormData((prev) => ({ ...prev, contractFile: uploadedPath }));
      setErrors(prev => ({ ...prev, contractFile: null }));
      setTouched(prev => ({ ...prev, contractFile: true }));
      setModalMessage('تم رفع الملف بنجاح');
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Error uploading contract file:', err);
      setModalMessage(err?.message || 'حدث خطأ أثناء رفع الملف');
      setShowErrorModal(true);
      setFile(null);
    } finally {
      setIsProcessingFile(false);
      // Reset file input
      const fileInput = e.target as HTMLInputElement;
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Recalculate contract duration before submission
    let finalFormData = { ...formData };
    if (formData.contractStartDate && formData.contractEndDate) {
      const duration = calculateContractDuration(formData.contractStartDate, formData.contractEndDate);
      finalFormData.contractDurationMonths = duration.months;
      finalFormData.contractDurationDays = duration.days;
      finalFormData.contractDuration = duration.displayText;
    }
    
    if (!validateForm()) {
      setModalMessage('يرجى تصحيح الأخطاء الموجودة في النموذج');
      setShowErrorModal(true);
     
      return;
    }

    setIsLoading(true);

    try {
      let finalClientId = clientId;
      let contractFileUrl: string | null = finalFormData.contractFile;

      if (newClient === 'true') {
        const clientData = {
          fullname: finalFormData.customerName,
          phonenumber: finalFormData.phoneNumber,
          nationalId: finalFormData.nationalId,
          city: finalFormData.customerCity,
        };
        const clientResponse = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientData),
        });
        if (!clientResponse.ok) {
          const errorData = await clientResponse.json();
          throw new Error(errorData.message || 'خطأ في إنشاء العميل');
        }
        const clientResult = await clientResponse.json();
        finalClientId = clientResult.client.id;
      }

      if (!contractFileUrl && file) {
        const idHint = (typeof finalClientId === 'string' && finalClientId) || undefined;
        try {
          contractFileUrl = await uploadContractFile(file, idHint);
        } catch (error) {
          throw new Error('خطأ في رفع الملف');
        }
      }

      const response = await fetch('/api/rentalform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...finalFormData,
          clientId: finalClientId,
          contractFile: contractFileUrl,
        }),
      });

      if (response.ok) {
        // Reset form
        setFormData({
          customerName: '',
          phoneNumber: '',
          nationalId: '',
          customerCity: '',
          workerId: '',
          contractDuration: '',
          contractDurationMonths: 0,
          contractDurationDays: 0,
          contractStartDate: '',
          contractEndDate: '',
          contractFile: null,
          paymentMethod: 'two-installments',
          totalAmount: '',
          paidAmount: '',
          remainingAmount: '',
        });
        setHomemaidSearchTerm('');
        setFile(null);
        setErrors({});
        setTouched({});
        
        setModalMessage('تم إنشاء طلب التأجير بنجاح!');
        setShowSuccessModal(true);
        setTimeout(() => {
          router.push('/admin/neworders');
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطأ في إنشاء الطلب');
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setModalMessage(error.message || 'خطأ في الخادم الداخلي');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.homemaid-search-container')) {
        setShowHomemaidSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="">
      <h2 className="text-2xl font-semibold text-right mb-6">
        {newClient ? 'طلب تأجير جديد' : 'طلب تأجير'}
      </h2>

      {isLoading && <div className="text-center text-gray-500">جاري التحميل...</div>}

      <form className={`${Style['tajawal-regular']} flex flex-col gap-12`} onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-8">
          <div className="flex flex-col gap-2">
            <label htmlFor="customerName" className="text-base text-right">اسم العميل</label>
            <input
              type="text"
              id="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              onBlur={(e) => {
                const error = validateCustomerName(e.target.value);
                setErrors(prev => ({ ...prev, customerName: error }));
                setTouched(prev => ({ ...prev, customerName: true }));
              }}
              className={`bg-gray-50 border ${errors.customerName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-teal-500'} rounded-md p-3 text-base text-right transition-colors`}
              disabled={!!clientId}
              required
            />
            {touched.customerName && errors.customerName && (
              <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.customerName}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="phoneNumber" className="text-base text-right">رقم الجوال</label>
            <input
              type="tel"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              onBlur={(e) => {
                const error = validatePhoneNumber(e.target.value);
                setErrors(prev => ({ ...prev, phoneNumber: error }));
                setTouched(prev => ({ ...prev, phoneNumber: true }));
              }}
              className={`bg-gray-50 border ${errors.phoneNumber ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-teal-500'} rounded-md p-3 text-base text-right transition-colors`}
              disabled={!!clientId}
              placeholder="500000000"
              required
            />
            {touched.phoneNumber && errors.phoneNumber && (
              <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.phoneNumber}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="nationalId" className="text-base text-right">الرقم الوطني</label>
            <input
              type="text"
              id="nationalId"
              value={formData.nationalId}
              onChange={handleInputChange}
              onBlur={(e) => {
                const error = validateNationalId(e.target.value);
                setErrors(prev => ({ ...prev, nationalId: error }));
                setTouched(prev => ({ ...prev, nationalId: true }));
              }}
              className={`bg-gray-50 border ${errors.nationalId ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-teal-500'} rounded-md p-3 text-base text-right transition-colors`}
              disabled={!!clientId}
              placeholder="1234567890"
              maxLength={10}
              required
            />
            {touched.nationalId && errors.nationalId && (
              <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.nationalId}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 relative homemaid-search-container">
            <label htmlFor="workerSearch" className="text-base text-right">اسم أو رقم العاملة</label>
            <input
              type="text"
              id="workerSearch"
              value={homemaidSearchTerm}
              onChange={handleHomemaidSearchChange}
              onBlur={handleHomemaidInputBlur}
              onFocus={() => homemaidSearchTerm.length >= 1 && setShowHomemaidSuggestions(true)}
              placeholder="ابحث بالاسم أو الرقم"
              className={`bg-gray-50 border ${errors.workerId ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-teal-500'} rounded-md p-3 text-base text-right pr-10 transition-colors`}
              required
            />
            {isSearchingHomemaids && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
              </div>
            )}
            
            {showHomemaidSuggestions && homemaidSuggestions.length > 0 && (
              <div className="absolute z-50 w-full top-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {homemaidSuggestions.map((homemaid, index) => (
                  <div
                    key={index}
                    onClick={() => handleHomemaidSuggestionClick(homemaid)}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                  >
                    <div className="font-medium text-md">{homemaid.Name}</div>
                    <div className="text-sm text-gray-500">{homemaid.Country} - {homemaid.religion}</div>
                  </div>
                ))}
              </div>
            )}
            
            {touched.workerId && errors.workerId && (
              <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.workerId}</span>
              </div>
            )}
            
            <input type="hidden" id="workerId" value={formData.workerId} />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="contractDuration" className="text-base text-right">مدة العقد</label>
            <input
              type="text"
              id="contractDuration"
              value={formData.contractDuration || 'سيتم الحساب تلقائياً'}
              readOnly
              className="bg-gray-100 border border-gray-200 rounded-md p-3 text-base text-right bg-opacity-50 cursor-not-allowed"
              placeholder="سيتم الحساب تلقائياً"
            />
            {formData.contractDuration && (
              <div className="text-sm text-gray-600 mt-1">
                {formData.contractDurationMonths > 0 && (
                  <span>{formData.contractDurationMonths} {formData.contractDurationMonths === 1 ? 'شهر' : 'أشهر'}</span>
                )}
                {formData.contractDurationMonths > 0 && formData.contractDurationDays > 0 && <span> و </span>}
                {formData.contractDurationDays > 0 && (
                  <span>{formData.contractDurationDays} {formData.contractDurationDays === 1 ? 'يوم' : 'أيام'}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="contractStartDate" className="text-base text-right">تاريخ بداية العقد</label>
            <div className="relative">
              <input
                type="date"
                id="contractStartDate"
                value={formData.contractStartDate}
                onChange={handleInputChange}
                onBlur={(e) => {
                  const { startError, endError } = validateDates(e.target.value, formData.contractEndDate);
                  setErrors(prev => ({ 
                    ...prev, 
                    contractStartDate: startError || undefined,
                    contractEndDate: endError || prev.contractEndDate
                  }));
                  setTouched(prev => ({ ...prev, contractStartDate: true }));
                }}
                className={`bg-gray-50 border ${errors.contractStartDate ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-teal-500'} rounded-md p-3 text-base text-right w-full transition-colors`}
                required
              />
            </div>
            {touched.contractStartDate && errors.contractStartDate && (
              <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.contractStartDate}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="contractEndDate" className="text-base text-right">تاريخ نهاية العقد</label>
            <div className="relative">
              <input
                type="date"
                id="contractEndDate"
                value={formData.contractEndDate}
                onChange={handleInputChange}
                onBlur={(e) => {
                  const { startError, endError } = validateDates(formData.contractStartDate, e.target.value);
                  setErrors(prev => ({ 
                    ...prev, 
                    contractEndDate: endError || undefined,
                    contractStartDate: startError || prev.contractStartDate
                  }));
                  setTouched(prev => ({ ...prev, contractEndDate: true }));
                }}
                className={`bg-gray-50 border ${errors.contractEndDate ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-teal-500'} rounded-md p-3 text-base text-right w-full transition-colors`}
                required
              />
            </div>
            {touched.contractEndDate && errors.contractEndDate && (
              <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.contractEndDate}</span>
              </div>
            )}
          </div>

<div className="flex flex-col gap-2">
  <label htmlFor="contractFile" className="text-base text-right">ملف العقد</label>
  <div className={`relative ${errors.contractFile ? 'border-red-300' : 'border-gray-200'} border-2 rounded-md p-3 bg-gray-50 focus-within:border-teal-500 transition-colors`}>
    <input
      type="file"
      id="contractFile"
      onChange={handleFileChange}
      accept="application/pdf"
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      disabled={isUploadingFile || isProcessingFile}
    />
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        {formData.contractFile ? (
          <span className="text-sm text-gray-700 truncate block">📄 {formData.contractFile.split('/').pop()}</span>
        ) : file ? (
          <span className={`text-sm ${errors.contractFile ? 'text-red-600' : 'text-gray-700'} truncate block`}>
            📄 {file.name}
          </span>
        ) : (
          <span className="text-sm text-gray-500">لم يتم اختيار ملف</span>
        )}
        {isProcessingFile && (
          <span className="text-xs text-teal-600 block mt-1">جاري معالجة الملف...</span>
        )}
        {isUploadingFile && (
          <span className="text-xs text-teal-600 block mt-1">جاري رفع الملف...</span>
        )}
      </div>
      <button
        type="button"
        disabled={isUploadingFile || isProcessingFile}
        className={`ml-2 px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 transition-colors ${
          isUploadingFile || isProcessingFile
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-teal-600 text-white hover:bg-teal-700'
        }`}
      >
        {(isUploadingFile || isProcessingFile) && (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
        )}
        اختر ملف
      </button>
    </div>
  </div>
  {touched.contractFile && errors.contractFile && (
    <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
      <AlertCircle className="w-4 h-4" />
      <span>{errors.contractFile}</span>
    </div>
  )}
  {formData.contractFile && (
    <a
      href={formData.contractFile}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-teal-600 hover:underline mt-1 block"
    >
      عرض الملف
    </a>
  )}
</div>
        </div>

        <div className="flex flex-col gap-4">
          <label className="text-base text-right">طريقة الدفع المختارة</label>
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-14">
              <div 
                onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: 'cash' }))}
                className={`flex ${formData.paymentMethod === 'cash' ? 'border-teal-800 bg-teal-800 text-white' : 'border-gray-300 bg-gray-50 text-gray-600'} items-center justify-center w-60 h-12 border-2 rounded-lg bg-gray-50 cursor-pointer`}
              >
                <input
                  type="radio"
                  id="paymentMethodCash"
                  name="paymentMethod"
                  value="cash"
                  checked={formData.paymentMethod === 'cash'}
                  onChange={handleInputChange}
                  className="hidden"
                />
                <label
                  htmlFor="paymentMethodCash"
                  className={`flex items-center justify-center gap-2 text-lg cursor-pointer w-full h-full p-3 ${
                    formData.paymentMethod === 'cash' ? 'text-white font-bold' : 'text-gray-600'
                  }`}
                >
                  <CashIcon className={`w-6 h-6 ${formData.paymentMethod === 'cash' ? 'text-white' : 'text-gray-600'}`} />
                  <span>كاش</span>
                </label>
              </div>

              <div 
                onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: 'two-installments' }))}
                className={`flex items-center justify-center w-60 h-12 border-2 border-teal-800 rounded-lg bg-gray-50 cursor-pointer ${formData.paymentMethod === 'two-installments' ? 'border-teal-800 bg-teal-800 text-white' : 'border-gray-300 bg-gray-50 text-gray-600'}`}
              >
                <input
                  type="radio"
                  id="paymentMethodTwo"
                  name="paymentMethod"
                  value="two-installments"
                  checked={formData.paymentMethod === 'two-installments'}
                  onChange={handleInputChange}
                  className="hidden"
                />
                <label
                  htmlFor="paymentMethodTwo"
                  className={`flex items-center justify-center gap-2 text-lg cursor-pointer w-full h-full p-3 ${
                    formData.paymentMethod === 'two-installments' ? 'text-white font-bold' : 'text-gray-600'
                  }`}
                >
                  <CreditCard className={`w-6 h-6 ${formData.paymentMethod === 'two-installments' ? 'text-white' : 'text-gray-600'}`} />
                  <span>دفعتين</span>
                </label>
              </div>

              <div
                onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: 'three-installments' }))}
                className={`flex items-center justify-center w-60 h-12 border-2 border-teal-800 rounded-lg bg-gray-50 cursor-pointer ${formData.paymentMethod === 'three-installments' ? 'border-teal-800 bg-teal-800 text-white' : 'border-gray-300 bg-gray-50 text-gray-600'}`}
              >
                <input
                  type="radio"
                  id="paymentMethodThree"
                  name="paymentMethod"
                  value="three-installments"
                  checked={formData.paymentMethod === 'three-installments'}
                  onChange={handleInputChange}
                  className="hidden"
                />
                <label
                  htmlFor="paymentMethodThree"
                  className={`flex items-center justify-center gap-2 text-lg cursor-pointer w-full h-full p-3 ${
                    formData.paymentMethod === 'three-installments' ? 'text-white font-bold' : 'text-gray-600'
                  }`}
                >
                  <Wallet className={`w-6 h-6 ${formData.paymentMethod === 'three-installments' ? 'text-white' : 'text-gray-600'}`} />
                  <span>ثلاثة دفعات</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="flex flex-col gap-2">
            <label htmlFor="totalAmount" className="text-base text-right">المبلغ كامل</label>
            <input
              type="number"
              id="totalAmount"
              value={formData.totalAmount}
              onChange={handleInputChange}
              onBlur={(e) => {
                const { totalError } = validateAmounts(e.target.value, formData.paidAmount);
                setErrors(prev => ({ ...prev, totalAmount: totalError }));
                setTouched(prev => ({ ...prev, totalAmount: true }));
              }}
              className={`bg-gray-50 border ${errors.totalAmount ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-teal-500'} rounded-md p-3 text-base text-right transition-colors`}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
            {touched.totalAmount && errors.totalAmount && (
              <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.totalAmount}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="paidAmount" className="text-base text-right">المبلغ المدفوع</label>
            <input
              type="number"
              id="paidAmount"
              value={formData.paidAmount}
              onChange={handleInputChange}
              onBlur={(e) => {
                const { paidError } = validateAmounts(formData.totalAmount, e.target.value);
                setErrors(prev => ({ ...prev, paidAmount: paidError }));
                setTouched(prev => ({ ...prev, paidAmount: true }));
              }}
              className={`bg-gray-50 border ${errors.paidAmount ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-teal-500'} rounded-md p-3 text-base text-right transition-colors`}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
            {touched.paidAmount && errors.paidAmount && (
              <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.paidAmount}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="remainingAmount" className="text-base text-right">المبلغ المتبقي</label>
            <input
              type="number"
              id="remainingAmount"
              value={formData.remainingAmount}
              readOnly
              className="bg-gray-100 border border-gray-200 rounded-md p-3 text-base text-right bg-opacity-50"
              placeholder="سيتم حسابه تلقائيًا"
            />
          </div>
        </div>

        <div className="flex justify-center gap-6 pt-10">
          <button
            type="submit"
            // disabled={isLoading || Object.keys(errors).some(key => errors[key as keyof ValidationErrors])}
            className={`bg-teal-800 text-white px-6 py-3 rounded-md text-sm font-medium flex items-center gap-2 `}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                جاري الحفظ...
              </>
            ) : (
              'حفظ الطلب'
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/requests')}
            className="border-2 border-teal-800 text-teal-800 px-6 py-3 rounded-md text-sm font-medium hover:bg-teal-50 transition-colors"
            disabled={isLoading}
          >
            إلغاء
          </button>
        </div>
      </form>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-center relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={closeModal}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <p className="text-green-700 text-lg font-semibold">{modalMessage}</p>
            </div>
            <button
              className="w-full bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
              onClick={closeModal}
            >
              موافق
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-center relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={closeModal}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-10 h-10 text-red-500" />
              </div>
              <p className="text-red-700 text-lg font-semibold">{modalMessage}</p>
            </div>
            <button
              className="w-full bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
              onClick={closeModal}
            >
              موافق
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal (Medical Exam Warning) */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-center relative" style={{ direction: 'rtl' }}>
            <button
              className="absolute top-3 left-3 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={handleConfirmModalCancel}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-amber-500" />
              </div>
              <p className="text-gray-800 text-lg font-semibold">{confirmModalMessage}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                className="flex-1 bg-teal-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors"
                onClick={handleConfirmModalAccept}
              >
                حسناً
              </button>
              <button
                className="flex-1 border-2 border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                onClick={handleConfirmModalCancel}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}