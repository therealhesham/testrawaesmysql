import { CashIcon, CreditCardIcon, CurrencyDollarIcon } from '@heroicons/react/outline';
import axios from 'axios';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Client {
  id: string;
  fullname: string;
  phonenumber: string;
  city?: string;
}

interface Homemaid {
  id: string;
  Name: string;
  office?: { Country: string };
  religion?: string;
}

interface ApiOrderData {
  orderId: number;
  clientInfo: { name: string; phone: string; email: string };
  homemaidInfo: {
    religion: string; name: string; passportNumber: string; nationality: string; externalOffice: string 
};
  documentUpload: { files: string | null };
  ticketUpload: { files: string | null };
  nationality: string;
  // أضف باقي الحقول لو عايز (مثل payment info إذا أضفتها في API)
}

interface FormData {
  City:string;
  clientID: string;
  HomemaidId: string;
  ClientName: string;
  PhoneNumber: string;
  Nationalitycopy: string;
  Religion: string;
  PaymentMethod: string;
  Total: number;
  Paid: number;
  Remaining: number;
  orderDocument: string;
  contract: string;
}

interface AddAvailableFormProps {
  clients: Client[];
  homemaids: Homemaid[];
  orderId?: string;
  preSelectedClient?: Client | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function AddAvailableForm({ clients, homemaids, orderId, preSelectedClient, onCancel, onSuccess }: AddAvailableFormProps) {
  const [formData, setFormData] = useState<FormData>({
    clientID: '',
    HomemaidId: '',
    ClientName: '',
    City: '',
    PhoneNumber: '',
    Nationalitycopy: '',
    Religion: '',
    PaymentMethod: 'كاش',
    Total: 0,
    Paid: 0,
    Remaining: 0,
    orderDocument: '',
    contract: '',
  });
  const [fileUploaded, setFileUploaded] = useState({
    orderDocument: false,
    contract: false,
  });
  const [errors, setErrors] = useState<any>({});
  const [modalMessage, setModalMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto search states for clients
  const [clientSuggestions, setClientSuggestions] = useState<any[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [isSearchingClients, setIsSearchingClients] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  // Auto search states for homemaids
  const [homemaidSuggestions, setHomemaidSuggestions] = useState<any[]>([]);
  const [showHomemaidSuggestions, setShowHomemaidSuggestions] = useState(false);
  const [isSearchingHomemaids, setIsSearchingHomemaids] = useState(false);
  const [homemaidSearchTerm, setHomemaidSearchTerm] = useState('');

  const fileInputRefs = {
    orderDocument: useRef<HTMLInputElement>(null),
    contract: useRef<HTMLInputElement>(null),
  };

  const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];

  // Auto search functions for clients
  const searchClients = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setClientSuggestions([]);
      setShowClientSuggestions(false);
      return;
    }
    
    setIsSearchingClients(true);
    try {
      const response = await fetch(`/api/clients/suggestions?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setClientSuggestions(data.suggestions || []);
        setShowClientSuggestions(true);
      } else {
        console.error('Error searching clients');
        setClientSuggestions([]);
        setShowClientSuggestions(false);
      }
    } catch (error) {
      console.error('Error searching clients:', error);
      setClientSuggestions([]);
      setShowClientSuggestions(false);
    } finally {
      setIsSearchingClients(false);
    }
  };

  // Auto search functions for homemaids
  const searchHomemaids = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setHomemaidSuggestions([]);
      setShowHomemaidSuggestions(false);
      return;
    }
    
    setIsSearchingHomemaids(true);
    try {
      const response = await fetch(`/api/homemaids/suggestions?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setHomemaidSuggestions(data.suggestions || []);
        setShowHomemaidSuggestions(true);
      } else {
        console.error('Error searching homemaids');
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

  // Handle client search input change
  const handleClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setClientSearchTerm(value);
    
    if (value.trim()) {
      searchClients(value);
    } else {
      setClientSuggestions([]);
      setShowClientSuggestions(false);
    }
  };

  // Handle homemaid search input change
  const handleHomemaidSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHomemaidSearchTerm(value);
    
    if (value.trim()) {
      searchHomemaids(value);
    } else {
      setHomemaidSuggestions([]);
      setShowHomemaidSuggestions(false);
    }
  };

  // Handle client suggestion click
  const handleClientSuggestionClick = (client: any) => {
    console.log('Selected client:', client); // Debug log
    setFormData((prev) => ({
      ...prev,
      City: client.city,
      clientID: client.id,
      ClientName: client.fullname,
      PhoneNumber: client.phonenumber,
    }));
    setClientSearchTerm(client.fullname);
    setShowClientSuggestions(false);
  };

  // Handle homemaid suggestion click
  const handleHomemaidSuggestionClick = (homemaid: any) => {
    setFormData((prev) => ({
      ...prev,
      HomemaidId: homemaid.id,
      Nationalitycopy: homemaid.Country,
      Religion: homemaid.religion,
    }));
    setHomemaidSearchTerm(homemaid.Name);
    setShowHomemaidSuggestions(false);
  };

  // Handle input blur for suggestions
  const handleClientInputBlur = () => {
    setTimeout(() => {
      setShowClientSuggestions(false);
    }, 200);
  };

  const handleHomemaidInputBlur = () => {
    setTimeout(() => {
      setShowHomemaidSuggestions(false);
    }, 200);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.client-search-container')) {
        setShowClientSuggestions(false);
      }
      if (!target.closest('.homemaid-search-container')) {
        setShowHomemaidSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        try {
          const response = await axios.get(`/api/track_order/${orderId}`);
          const order: ApiOrderData = response.data;
          console.log(order)
          // Match client ID by name
          const matchedClient = clients.find(client => client.fullname === order.clientInfo.name);
          // Match homemaid ID by name
          const matchedHomemaid = homemaids.find(homemaid => homemaid.Name === order.homemaidInfo.name);
          
          const mappedFormData: FormData = {
            clientID: matchedClient?.id || '',
            HomemaidId: matchedHomemaid?.id || order.homemaidInfo.name, // Fallback to name if no ID match
            ClientName: order.clientInfo.name,
            PhoneNumber: order.clientInfo.phone,
            Nationalitycopy: order.homemaidInfo.nationality || order.nationality,
            Religion: order.homemaidInfo.religion, // Not in API, default
            PaymentMethod: 'كاش', // Default; add to API if needed
            Total: 0, // Default; add to API if needed
            Paid: 0,
            // religion:order.homemaidInfo.religion,
            Remaining: 0,
            orderDocument: order.documentUpload.files || '',
            contract: order.ticketUpload.files || '',
            City: matchedClient?.city || ''
          };
          
          setFormData(mappedFormData);
          setFileUploaded({
            orderDocument: !!order.documentUpload.files,
            contract: !!order.ticketUpload.files,
          });
          
          // Set search terms for auto search
          setClientSearchTerm(order.clientInfo.name);
          setHomemaidSearchTerm(order.homemaidInfo.name);
        } catch (error) {
          console.error('Error fetching order:', error);
          setModalMessage('حدث خطأ أثناء جلب بيانات الطلب');
          setShowErrorModal(true);
        }
      };
      fetchOrder();
    }
  }, [orderId, clients, homemaids]);

  // Handle pre-selected client
  useEffect(() => {
    if (preSelectedClient) {
      setFormData((prev) => ({
        ...prev,
        clientID: preSelectedClient.id,
        ClientName: preSelectedClient.fullname,
        PhoneNumber: preSelectedClient.phonenumber,
        City: preSelectedClient.city || '',
      }));
      setClientSearchTerm(preSelectedClient.fullname);
    }
  }, [preSelectedClient]);

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
      setErrors((prev: any) => ({ ...prev, [fileId]: '' }));
      setFileUploaded((prev: any) => ({ ...prev, [fileId]: true }));

      const ref = fileInputRefs[fileId as keyof typeof fileInputRefs];
      if (ref && ref.current) {
        ref.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setErrors((prev: any) => ({ ...prev, [fileId]: error.message || 'حدث خطأ أثناء رفع الملف' }));
      setFileUploaded((prev: any) => ({ ...prev, [fileId]: false }));
    }
  };

  const handleButtonClick = (fileId: string) => {
    const ref = fileInputRefs[fileId as keyof typeof fileInputRefs];
    if (ref && ref.current) {
      ref.current.click();
    } else {
      console.error(`Reference for ${fileId} is not defined or has no current value`);
      setErrors((prev: any) => ({ ...prev, [fileId]: 'خطأ في تحديد حقل الملف' }));
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleClientSelect = (selectedOption: any) => {
    if (selectedOption) {
      const selectedClient = clients.find(client => client.id === selectedOption.value);
      setFormData((prev) => ({
        ...prev,
        clientID: selectedOption.value,
        ClientName: selectedClient?.fullname || '',
        PhoneNumber: selectedClient?.phonenumber || '',
      }));
      setClientSearchTerm(selectedClient?.fullname || '');
    } else {
      setFormData((prev) => ({
        ...prev,
        clientID: '',
        ClientName: '',
        PhoneNumber: '',
      }));
      setClientSearchTerm('');
    }
  };

  const handleHomemaidSelect = (selectedOption: any) => {
    if (selectedOption) {
      const selectedHomemaid = homemaids.find(homemaid => homemaid.id === selectedOption.value);
      setFormData((prev) => ({
        ...prev,
        HomemaidId: selectedOption.value,
        Nationalitycopy: selectedHomemaid?.office?.Country || '',
        Religion: selectedHomemaid?.religion || '',
      }));
      setHomemaidSearchTerm(selectedHomemaid?.Name || '');
    } else {
      setFormData((prev) => ({
        ...prev,
        HomemaidId: '',
        Religion:'',
        Nationalitycopy: '',
      }));
      setHomemaidSearchTerm('');
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    const requiredFields = [
      { id: 'clientID', label: 'اسم العميل' },
      { id: 'Total', label: 'المبلغ كامل' },
    ];

    requiredFields.forEach((field) => {
      if (!formData[field.id as keyof FormData]) {
        newErrors[field.id] = `${field.label} مطلوب`;
      }
    });

    if (formData.Total && (isNaN(Number(formData.Total)) || Number(formData.Total) <= 0)) {
      newErrors.Total = 'المبلغ كامل يجب أن يكون رقمًا إيجابيًا';
    }

    if (formData.Paid && (isNaN(Number(formData.Paid)) || Number(formData.Paid) < 0)) {
      newErrors.Paid = 'المبلغ المدفوع يجب أن يكون رقمًا غير سالب';
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
    
    setIsSubmitting(true);
    try {
      const submitData: any = { ...formData };
      if (orderId) {
        submitData.orderId = orderId; // Add for edit
      }
      const url = orderId ? `/api/track_order/${orderId}` : '/api/submitneworderprisma';
      const method = orderId ? 'PATCH' : 'POST';
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setModalMessage('');
  };


  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-normal text-right">
          {orderId ? 'تعديل طلب حسب العاملات المتاحات' : 'طلب جديد حسب العاملات المتاحات'}
        </h1>
        <button className="p-2 text-gray-600 hover:text-gray-800" onClick={onCancel}>
          <X className="w-6 h-6" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-300 p-10 rounded">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          <div className="flex flex-col gap-2">
            <label className="text-base">اسم العميل</label>
            <div className="relative client-search-container">
              <input
                type="text"
                value={clientSearchTerm}
                onChange={handleClientSearchChange}
                onBlur={handleClientInputBlur}
                onFocus={() => clientSearchTerm.length >= 1 && setShowClientSuggestions(true)}
                placeholder="ابحث عن العميل بالاسم أو رقم الهاتف"
                disabled={isSubmitting}
                className={`w-full p-3 border border-gray-300 rounded-md text-right ${
                  isSubmitting ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-50'
                }`}
              />
              {isSearchingClients && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                </div>
              )}
              
              {/* Client Search Results Dropdown */}
              {showClientSuggestions && clientSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {clientSuggestions.map((client, index) => (
                    <div
                      key={index}
                      onClick={() => handleClientSuggestionClick(client)}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                    >
                      <div className="font-medium text-md">{client.fullname}</div>
                      <div className="text-sm text-gray-500">{client.phonenumber} - {client.city}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
              name="City"
              placeholder="مدينة العميل"
              value={formData.City || ''}
              readOnly
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">اسم العاملة</label>
            <div className="relative homemaid-search-container">
              <input
                type="text"
                value={homemaidSearchTerm}
                onChange={handleHomemaidSearchChange}
                onBlur={handleHomemaidInputBlur}
                onFocus={() => homemaidSearchTerm.length >= 1 && setShowHomemaidSuggestions(true)}
                placeholder="ابحث عن العاملة بالاسم"
                disabled={isSubmitting}
                className={`w-full p-3 border border-gray-300 rounded-md text-right ${
                  isSubmitting ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-50'
                }`}
              />
              {isSearchingHomemaids && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                </div>
              )}
              
              {/* Homemaid Search Results Dropdown */}
              {showHomemaidSuggestions && homemaidSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
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
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">رقم العاملة</label>
            <input
              type="text"
              value={formData.HomemaidId || ''}
              readOnly
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">جنسية العاملة</label>
            <input
              type="text"
              name="Nationalitycopy"
              value={formData.Nationalitycopy}
              readOnly
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">ديانة العاملة</label>
            <input
              type="text"
              name="Religion"
              value={formData.Religion}
              readOnly
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
            />
          </div>
        </div>
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
                <div className={`payment-button flex items-center justify-center gap-[10px] p-[14px] border-2 rounded-[8px] bg-[#f7f8fa] cursor-pointer w-[245px] text-[#1a4d4f] text-[20px] transition-border-color duration-200 ${formData.PaymentMethod === value ? 'border-[#1a4d4f]' : 'border-[#e0e0e0]'}`}>
                  <span className="text-xl">{option}</span>
{imgSrc}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Payment Amount Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="flex flex-col gap-2">
            <label className="text-base">المبلغ كامل</label>
            <input
              type="number"
              name="Total"
              value={formData.Total}
              onChange={handleFormChange}
              placeholder="أدخل المبلغ الكامل"
              className="w-full p-3 border border-gray-300 rounded-md text-right"
            />
            {errors.Total && <p className="text-red-500 text-xs mt-1">{errors.Total}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">المبلغ المدفوع</label>
            <input
              type="number"
              name="Paid"
              value={formData.Paid}
              onChange={handleFormChange}
              placeholder="أدخل المبلغ المدفوع"
              className="w-full p-3 border border-gray-300 rounded-md text-right"
            />
            {errors.Paid && <p className="text-red-500 text-xs mt-1">{errors.Paid}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">المبلغ المتبقي</label>
            <input
              type="number"
              name="Remaining"
              value={formData.Remaining}
              readOnly
              className="w-full p-3 border border-gray-300 rounded-md text-right bg-gray-50"
            />
          </div>
        </div>

    
    
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {[
            { id: 'orderDocument', label: 'ملف سند الأمر' },
            { id: 'contract', label: 'ملف العقد' },
          ].map((file) => (
            <div key={file.id} className="flex flex-col gap-2">
              <label htmlFor={file.id} className="text-base">{file.label}</label>
              <div className="file-upload-display border border-gray-300 rounded p-2 flex justify-between items-center">
                <span className="text-gray-500 text-sm pr-2">
                  {fileUploaded[file.id as keyof typeof fileUploaded] ? (
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
                  disabled={isSubmitting}
                  className={`px-3 py-1 rounded text-sm transition duration-200 ${
                    isSubmitting 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-teal-900 text-white hover:bg-teal-800'
                  }`}
                  onClick={() => handleButtonClick(file.id)}
                >
                  اختيار ملف
                </button>
              </div>
              {errors[file.id as keyof typeof errors] && <p className="text-red-500 text-xs mt-1">{errors[file.id as keyof typeof errors]}</p>}
            </div>
          ))}
        </div>
        <div className="flex gap-6 flex-col sm:flex-row">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`px-4 py-2 rounded w-full sm:w-40 transition duration-200 flex items-center justify-center gap-2 ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-teal-900 text-white hover:bg-teal-800'
            }`}
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={isSubmitting}
            className={`px-4 py-2 rounded w-full sm:w-40 transition duration-200 ${
              isSubmitting 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-100 text-gray-800 border-2 border-teal-800 hover:bg-gray-200'
            }`}
          >
            إلغاء
          </button>
        </div>
      </form>
      {(showSuccessModal || showErrorModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center relative">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
              onClick={closeModal}
            >
              <X className="w-5 h-5" />
            </button>
            <p className={showSuccessModal ? "text-teal-900" : "text-red-600"}>{modalMessage}</p>
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