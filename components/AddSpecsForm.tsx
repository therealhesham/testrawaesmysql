import { CashIcon, CreditCardIcon, CurrencyDollarIcon } from '@heroicons/react/outline';
import axios from 'axios';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Select from 'react-select';

interface Client {
  id: string;
  fullname: string;
  phonenumber: string;
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
  age: number;
  ExperienceYears: number;
  notes: string;
  orderDocument: string;
  contract: string;
  selectedHomemaidId?: number;
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
  onCancel: () => void;
  onSuccess: () => void;
}

export default function AddSpecsForm({ clients, orderId, onCancel, onSuccess }: AddSpecsFormProps) {
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
    age: 0,
    ExperienceYears: 0,
    notes: '',
    orderDocument: '',
    contract: '',
    selectedHomemaidId: undefined,
  });
  const [fileUploaded, setFileUploaded] = useState({
    orderDocument: false,
    contract: false,
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

  const fileInputRefs = {
    orderDocument: useRef<HTMLInputElement>(null),
    contract: useRef<HTMLInputElement>(null),
  };

  const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];

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
            age: 0, // Add to API if needed
            ExperienceYears: 0,
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setErrors((prev: any) => ({ ...prev, [fileId]: 'لم يتم اختيار ملف' }));
      setFileUploaded((prev: any) => ({ ...prev, [fileId]: false }));
      return;
    }

    const file = files[0];
    if (!allowedFileTypes.includes(file.type)) {
      setErrors((prev: any) => ({ ...prev, [fileId]: 'نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)' }));
      setFileUploaded((prev: any) => ({ ...prev, [fileId]: false }));
      return;
    }

    // Start upload indicator
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
    } finally {
      // Stop upload indicator
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

  // Function to fetch homemaid suggestions
  const fetchSuggestions = async () => {
    if (!formData.ExperienceYears || !formData.Nationalitycopy || !formData.Religion) {
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(
        `/api/suggest-homemaids?experience=${encodeURIComponent(formData.ExperienceYears)}&nationality=${encodeURIComponent(formData.Nationalitycopy)}&religion=${encodeURIComponent(formData.Religion)}&age=${formData.age}`
      );
      const data = await response.json();
      
      if (data.success) {
        if (data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
          setShowSuggestionModal(true);
        } else {
          setModalMessage(data.message || 'لم يتم العثور على عاملات تطابق المواصفات المطلوبة');
          setShowErrorModal(true);
        }
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setModalMessage('حدث خطأ أثناء البحث عن العاملات');
      setShowErrorModal(true);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Function to handle suggestion acceptance
  const handleAcceptSuggestion = (suggestion: HomemaidSuggestion) => {
    setFormData((prev) => ({
      ...prev,
      selectedHomemaidId: suggestion.id,
      // Update form fields with selected homemaid data
      Nationalitycopy: suggestion.nationality,
      Religion: suggestion.religion,
      ExperienceYears: parseInt(suggestion.experience) || 0,
      age: suggestion.age,
    }));
    setShowSuggestionModal(false);
    setModalMessage(`تم اختيار العاملة: ${suggestion.name}`);
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
      }));
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
    const requiredFields = [
      { id: 'clientID', label: 'اسم العميل' },
    ];

    requiredFields.forEach((field) => {
      if (!formData[field.id as keyof FormData]) {
        newErrors[field.id] = `${field.label} مطلوب`;
      }
    });

    // Allow zero amounts - only validate if they are numbers
    if (formData.Total && isNaN(Number(formData.Total))) {
      newErrors.Total = 'المبلغ كامل يجب أن يكون رقمًا صحيحًا';
    }

    if (formData.Paid && isNaN(Number(formData.Paid))) {
      newErrors.Paid = 'المبلغ المدفوع يجب أن يكون رقمًا صحيحًا';
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
              className="text-right"
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: '#F9FAFB',
                  borderColor: '#D1D5DB',
                  padding: '0.5rem',
                  textAlign: 'right',
                }),
                menu: (base) => ({ ...base, textAlign: 'right' }),
                singleValue: (base) => ({ ...base, textAlign: 'right' }),
                placeholder: (base) => ({ ...base, textAlign: 'right' }),
              }}
            />
            {errors.clientID && <p className="text-red-500 text-xs mt-1">{errors.clientID}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">رقم العميل</label>
            <input
              type="text"
              name="PhoneNumber"
              value={formData.PhoneNumber}
              readOnly
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">مدينة العميل</label>
            <input
              type="text"
              placeholder="مدينة العميل"
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">العمر</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleFormChange}
              placeholder="اختر العمر"
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">سنوات الخبرة</label>
            <input
              type="number"
              name="ExperienceYears"
              value={formData.ExperienceYears}
              onChange={handleFormChange}
              placeholder="اختر سنوات الخبرة"
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">جنسية العاملة المطلوبة</label>
            <input
              type="text"
              name="Nationalitycopy"
              value={formData.Nationalitycopy}
              onChange={handleFormChange}
              placeholder="اختر جنسية العاملة المطلوبة"
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">الديانة</label>
            <input
              type="text"
              name="Religion"
              value={formData.Religion}
              onChange={handleFormChange}
              placeholder="اختر الديانة"
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
            />
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
              disabled={isLoadingSuggestions || !formData.ExperienceYears || !formData.Nationalitycopy || !formData.Religion}
              className={`bg-teal-800 text-white px-4 py-2 rounded w-full sm:w-auto hover:bg-teal-700 transition duration-200 ${
                isLoadingSuggestions || !formData.ExperienceYears || !formData.Nationalitycopy || !formData.Religion
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {isLoadingSuggestions ? 'جاري البحث...' : 'اقترح عاملة مناسبة'}
            </button>
            {formData.selectedHomemaidId && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center justify-between">
                <p className="text-sm">
                  ✓ تم اختيار عاملة مناسبة - سيتم إرسال الطلب مع العاملة المحددة
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      selectedHomemaidId: undefined,
                      // Reset homemaid-specific fields to original values
                      Nationalitycopy: '',
                      Religion: '',
                      ExperienceYears: 0,
                      age: 0,
                    }));
                  }}
                  className="text-red-600 hover:text-red-800 ml-2"
                  title="إزالة الاختيار"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="mb-10">
          <h2 className="text-base font-normal mb-2">طريقة الدفع المختارة</h2>
          <div className="flex gap-[56px] justify-center flex-wrap">
            {[
              { option: 'كاش', value: 'cash', imgSrc: '/page/be6f92ac-eb1d-4570-ac77-f05056f74d10/images/2204_32259.svg' },
              { option: 'دفعتين', value: 'two-installments', imgSrc: '/page/be6f92ac-eb1d-4570-ac77-f05056f74d10/images/2204_32253.svg' },
              { option: 'ثلاثة دفعات', value: 'three-installments', imgSrc: '/page/be6f92ac-eb1d-4570-ac77-f05056f74d10/images/2204_32246.svg' },
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
                <div className={`payment-button flex items-center justify-center gap-[10px] p-[14px] border-2 rounded-[8px] bg-[#f7f8fa] cursor-pointer w-[245px] text-[#1a4d4f] text-[20px] transition-border-color duration-200 ${formData.PaymentMethod === value ? 'border-[#1a4d4f]' : 'border-[#e0e0e0]'}`}>
                  <span>{option}</span>
                  <img src={imgSrc} alt="" />
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
              value={formData.Total}
              onChange={handleFormChange}
              className={`bg-gray-50 border ${errors.Total ? 'border-red-500' : 'border-gray-300'} rounded p-3 text-base text-gray-500 text-right`}
            />
            {errors.Total && <p className="text-red-500 text-xs mt-1">{errors.Total}</p>}
          </div>
          <div className="flex flex-col gap-2 "> 
            <label className="text-base">المبلغ المدفوع</label>
            <input
              type="number"
              name="Paid"
              value={formData.Paid}
              onChange={handleFormChange}
              className={`bg-gray-50 border ${errors.Paid ? 'border-red-500' : 'border-gray-300'} rounded p-3 text-base text-gray-500 text-right`}
            />
            {errors.Paid && <p className="text-red-500 text-xs mt-1">{errors.Paid}</p>}
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
            { id: 'orderDocument', label: 'ملف سند الأمر' },
            { id: 'contract', label: 'ملف العقد' },
          ].map((file) => (
            <div key={file.id} className="flex flex-col gap-2">
              <label htmlFor={file.id} className="text-base">{file.label}</label>
              <div className="file-upload-display border border-gray-300 rounded p-2 flex justify-between items-center">
                <span className="text-gray-500 text-sm pr-2">
                  {(fileUploaded as any)[file.id] ? (
                    <a
                      href={formData[file.id as keyof FormData] as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-800 hover:underline"
                    >
                      فتح الملف
                    </a>
                  ) : (
                    'إرفاق ملف'
                  )}
                </span>
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
                  className={`px-3 py-1 rounded text-sm transition duration-200 ${
                    (fileUploading as any)[file.id]
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-teal-900 text-white hover:bg-teal-800'
                  }`}
                  onClick={() => handleButtonClick(file.id)}
                  disabled={(fileUploading as any)[file.id]}
                >
                  {(fileUploading as any)[file.id] ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      جاري الرفع...
                    </span>
                  ) : (
                    'اختيار ملف'
                  )}
                </button>
              </div>
              {(errors as any)[file.id] && <p className="text-red-500 text-xs mt-1">{(errors as any)[file.id]}</p>}
            </div>
          ))}
        </div>
        <div className="flex gap-6 flex-col sm:flex-row">
          <button type="submit" className="bg-teal-900 text-white px-4 py-2 rounded w-full sm:w-40 hover:bg-teal-800 transition duration-200">حفظ</button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {suggestions.map((suggestion, index) => (
                <div key={suggestion.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  index === 0 ? 'border-green-500 bg-green-50' : 
                  index === 1 ? 'border-blue-500 bg-blue-50' : 
                  'border-gray-200'
                }`}>
                  <div className="text-center mb-3">
                    {index === 0 && (
                      <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-full inline-block mb-2">
                        الأكثر مناسبة
                      </div>
                    )}
                    {index === 1 && (
                      <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full inline-block mb-2">
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
                      <p className="text-xs text-gray-500 mt-1">
                        نقاط التطابق: {suggestion.relevanceScore}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
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
                  <div className="flex gap-2 mt-4">
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
                      {index === 0 ? 'الأفضل' : index === 1 ? 'ممتاز' : 'موافق'}
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