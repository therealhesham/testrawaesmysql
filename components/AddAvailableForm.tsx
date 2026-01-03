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

interface Visa {
  id: number;
  visaNumber: string;
  nationality: string;
  gender?: string;
  profession?: string;
  visaFile?: string;
  createdAt?: string;
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
  typeOfContract: string;
  City: string;
  clientID: string;  // Changed from number to string
  HomemaidId: string; // Ensure this is also string
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
  visaId: string; // Added visa ID
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
  typeOfContract: "recruitment",
  PhoneNumber: '',
  Nationalitycopy: '',
  Religion: '',
  PaymentMethod: 'cash',
  Total: 0,
  Paid: 0,
  Remaining: 0,
  orderDocument: '',
  contract: '',
  visaId: '',
});
  const [fileUploaded, setFileUploaded] = useState({
    orderDocument: false,
    contract: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [modalMessage, setModalMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
// أضف هذا state بعد الـ states الموجودة
const [uploadedFileNames, setUploadedFileNames] = useState<Record<string, string>>({
  orderDocument: '',
  contract: '',
});
const [isUploading, setIsUploading] = useState<Record<string, boolean>>({
  orderDocument: false,
  contract: false,
});
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

  // Available visas states
  const [availableVisas, setAvailableVisas] = useState<Visa[]>([]);
  const [isLoadingVisas, setIsLoadingVisas] = useState(false);
  const [selectedVisa, setSelectedVisa] = useState<Visa | null>(null);

  const fileInputRefs = {
    orderDocument: useRef<HTMLInputElement>(null),
    contract: useRef<HTMLInputElement>(null),
  };

  const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];

 const validateClientSelection = (): string | null => {
  const clientID = String(formData.clientID || '').trim(); // Convert to string first
  if (!clientID) {
    return 'اسم العميل مطلوب';
  }
  if (!formData.ClientName?.trim()) {
    return 'اسم العميل مطلوب';
  }
  if (!formData.PhoneNumber?.trim()) {
    return 'رقم الهاتف مطلوب';
  }
  // if (!/^\+?\d{10,15}$/.test(formData.PhoneNumber.replace(/\s/g, ''))) {
  //   return 'رقم الهاتف غير صحيح';
  // }
  return null;
};

  const validateHomemaidSelection = (): string | null => {
    if (!formData.HomemaidId?.trim()) {
      return 'اسم العاملة مطلوب';
    }
    if (!formData.Nationalitycopy?.trim()) {
      return 'جنسية العاملة مطلوبة';
    }
    if (!formData.Religion?.trim()) {
      return 'ديانة العاملة مطلوبة';
    }
    return null;
  };

  const validatePayment = (): string | null => {
    if (isNaN(Number(formData.Total)) || Number(formData.Total) <= 0) {
      return 'المبلغ الكامل يجب أن يكون رقمًا إيجابيًا';
    }
    
    if (isNaN(Number(formData.Paid)) || Number(formData.Paid) < 0) {
      return 'المبلغ المدفوع يجب أن يكون رقمًا غير سالب';
    }
    
    if (Number(formData.Paid) > Number(formData.Total)) {
      return 'المبلغ المدفوع لا يمكن أن يكون أكبر من المبلغ الكامل';
    }
    
    return null;
  };

  const validateFiles = (): string | null => {
    // ملف سند الأمر غير مطلوب للدفع كاش
    if (formData.PaymentMethod !== 'cash') {
      if (!fileUploaded.orderDocument && !formData.orderDocument) {
        return 'ملف سند الأمر مطلوب';
      }
    }
    if (!fileUploaded.contract && !formData.contract) {
      return 'ملف العقد مطلوب';
    }
    return null;
  };

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

 const handleClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setClientSearchTerm(value);
  
  if (value.trim()) {
    searchClients(value);
  } else {
    setClientSuggestions([]);
    setShowClientSuggestions(false);
    // Clear client data when search term is cleared
    setFormData((prev) => ({
      ...prev,
      clientID: '',
      ClientName: '',
      PhoneNumber: '',
      City: '',
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.clientID;
      delete newErrors.ClientName;
      delete newErrors.PhoneNumber;
      delete newErrors.City;
      return newErrors;
    });
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
    // Clear homemaid data when search term is cleared
    setFormData((prev) => ({
      ...prev,
      HomemaidId: '',
      Nationalitycopy: '',
      Religion: '',
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.HomemaidId;
      delete newErrors.Nationalitycopy;
      delete newErrors.Religion;
      return newErrors;
    });
  }
};
  // Handle client suggestion click
  const handleClientSuggestionClick = (client: any) => {
    console.log('Selected client:', client); // Debug log
    setFormData((prev) => ({
      ...prev,
      City: client.city || '',
      clientID: client.id,
      ClientName: client.fullname,
      PhoneNumber: client.phonenumber,
      visaId: '', // Reset visa selection
    }));
    setClientSearchTerm(client.fullname);
    setShowClientSuggestions(false);
    setSelectedVisa(null);
    setAvailableVisas([]);
    
    // إذا كانت هناك جنسية محددة بالفعل، جلب التأشيرات المتاحة
    if (formData.Nationalitycopy) {
      fetchAvailableVisas(client.id, formData.Nationalitycopy);
    }
    
    // Clear client-related errors
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.clientID;
      delete newErrors.ClientName;
      delete newErrors.PhoneNumber;
      delete newErrors.City;
      return newErrors;
    });
  };

  // Fetch available visas for client and nationality
  const fetchAvailableVisas = async (clientId: string, nationality: string) => {
    if (!clientId || !nationality) {
      setAvailableVisas([]);
      return;
    }

    setIsLoadingVisas(true);
    try {
      const response = await fetch(
        `/api/clients/available-visas?clientId=${clientId}&nationality=${encodeURIComponent(nationality)}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableVisas(data.visas || []);
        
        // إذا لم تكن هناك تأشيرات متاحة، اعرض رسالة خطأ
        if (!data.visas || data.visas.length === 0) {
          setErrors((prev) => ({
            ...prev,
            visaId: `لا توجد تأشيرات متاحة بجنسية ${nationality} لهذا العميل`
          }));
        } else {
          // امسح خطأ التأشيرة إذا كانت هناك تأشيرات متاحة
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.visaId;
            return newErrors;
          });
        }
      } else {
        console.error('Error fetching available visas');
        setAvailableVisas([]);
        setErrors((prev) => ({
          ...prev,
          visaId: 'حدث خطأ أثناء جلب التأشيرات المتاحة'
        }));
      }
    } catch (error) {
      console.error('Error fetching available visas:', error);
      setAvailableVisas([]);
      setErrors((prev) => ({
        ...prev,
        visaId: 'حدث خطأ أثناء جلب التأشيرات المتاحة'
      }));
    } finally {
      setIsLoadingVisas(false);
    }
  };

  // Handle homemaid suggestion click
  const handleHomemaidSuggestionClick = (homemaid: any) => {
    const nationality = homemaid.office?.Country || homemaid.Country || '';
    setFormData((prev) => ({
      ...prev,
      HomemaidId: homemaid.id,
      Nationalitycopy: nationality,
      Religion: homemaid.religion || '',
      visaId: '', // Reset visa selection
    }));
    setHomemaidSearchTerm(homemaid.Name);
    setShowHomemaidSuggestions(false);
    setSelectedVisa(null);
    
    // جلب التأشيرات المتاحة بناءً على جنسية العاملة
    if (formData.clientID && nationality) {
      fetchAvailableVisas(formData.clientID, nationality);
    }
    
    // Clear homemaid-related errors
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.HomemaidId;
      delete newErrors.Nationalitycopy;
      delete newErrors.Religion;
      return newErrors;
    });
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
            typeOfContract: "recruitment",
            clientID: matchedClient?.id || '',
            HomemaidId: matchedHomemaid?.id || order.homemaidInfo.name, // Fallback to name if no ID match
            ClientName: order.clientInfo.name,
            PhoneNumber: order.clientInfo.phone,
            Nationalitycopy: order.homemaidInfo.nationality || order.nationality,
            Religion: order.homemaidInfo.religion, // Not in API, default
            PaymentMethod: 'cash', // Default; add to API if needed
            Total: 0, // Default; add to API if needed
            Paid: 0,
            // religion:order.homemaidInfo.religion,
            Remaining: 0,
            orderDocument: order.documentUpload.files || '',
            contract: order.ticketUpload.files || '',
            City: matchedClient?.city || '',
            visaId: '' // Added visa ID
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
    setErrors((prev) => ({ ...prev, [fileId]: 'لم يتم اختيار ملف' }));
    setFileUploaded((prev) => ({ ...prev, [fileId]: false }));
    setUploadedFileNames((prev) => ({ ...prev, [fileId]: '' }));
    return;
  }

  const file = files[0];
  
  // **التغيير الجديد: حفظ اسم الملف**
  setUploadedFileNames((prev) => ({ ...prev, [fileId]: file.name }));
  
  // File size validation (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    setErrors((prev) => ({ ...prev, [fileId]: 'حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)' }));
    setFileUploaded((prev) => ({ ...prev, [fileId]: false }));
    setUploadedFileNames((prev) => ({ ...prev, [fileId]: '' }));
    return;
  }

  if (!allowedFileTypes.includes(file.type)) {
    setErrors((prev) => ({ ...prev, [fileId]: 'نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)' }));
    setFileUploaded((prev) => ({ ...prev, [fileId]: false }));
    setUploadedFileNames((prev) => ({ ...prev, [fileId]: '' }));
    return;
  }

  setIsUploading((prev) => ({ ...prev, [fileId]: true }));
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

    setFormData((prev) => ({ ...prev, [fileId]: filePath }));
    setErrors((prev) => ({ ...prev, [fileId]: '' }));
    setFileUploaded((prev) => ({ ...prev, [fileId]: true }));

    const ref = fileInputRefs[fileId as keyof typeof fileInputRefs];
    if (ref && ref.current) {
      ref.current.value = '';
    }
  } catch (error: any) {
    console.error('Error uploading file:', error);
    setErrors((prev) => ({ ...prev, [fileId]: error.message || 'حدث خطأ أثناء رفع الملف' }));
    setFileUploaded((prev) => ({ ...prev, [fileId]: false }));
    setUploadedFileNames((prev) => ({ ...prev, [fileId]: '' }));
  } finally {
    setIsUploading((prev) => ({ ...prev, [fileId]: false }));
  }
};
  const handleButtonClick = (fileId: string) => {
    const ref = fileInputRefs[fileId as keyof typeof fileInputRefs];
    if (ref && ref.current) {
      ref.current.click();
    } else {
      console.error(`Reference for ${fileId} is not defined or has no current value`);
      setErrors((prev) => ({ ...prev, [fileId]: 'خطأ في تحديد حقل الملف' }));
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
      // إذا تم تغيير طريقة الدفع إلى كاش، امسح ملف سند الأمر
      if (name === 'PaymentMethod' && value === 'cash') {
        updatedFormData.orderDocument = '';
        setFileUploaded((prev) => ({ ...prev, orderDocument: false }));
        setUploadedFileNames((prev) => ({ ...prev, orderDocument: '' }));
      }
      return updatedFormData;
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // إذا تم تغيير طريقة الدفع إلى كاش، امسح أخطاء ملف سند الأمر
    if (name === 'PaymentMethod' && value === 'cash') {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.orderDocument;
        return newErrors;
      });
    }
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
  const newErrors: Record<string, string> = {};
  
  // Client validation
  const clientError = validateClientSelection();
  if (clientError) {
    newErrors.clientID = clientError;
  }

  // Homemaid validation - also fix this one
  const homemaidID = String(formData.HomemaidId || '').trim();
  if (!homemaidID) {
    newErrors.HomemaidId = 'اسم العاملة مطلوب';
  } else {
    if (!formData.Nationalitycopy?.trim()) {
      newErrors.Nationalitycopy = 'جنسية العاملة مطلوبة';
    }
    if (!formData.Religion?.trim()) {
      newErrors.Religion = 'ديانة العاملة مطلوبة';
    }
  }

  // Visa validation
  if (!formData.visaId?.trim()) {
    newErrors.visaId = 'يجب اختيار تأشيرة للطلب';
  }

  // Payment validation
  const total = Number(formData.Total);
  const paid = Number(formData.Paid);
  
  if (isNaN(total) || total <= 0) {
    newErrors.Total = 'المبلغ الكامل يجب أن يكون رقمًا إيجابيًا';
  }
  
  if (isNaN(paid) || paid < 0) {
    newErrors.Paid = 'المبلغ المدفوع يجب أن يكون رقمًا غير سالب';
  }
  
  if (!isNaN(total) && !isNaN(paid) && paid > total) {
    newErrors.Paid = 'المبلغ المدفوع لا يمكن أن يكون أكبر من المبلغ الكامل';
  }

  // File validation
  // ملف سند الأمر غير مطلوب للدفع كاش
  if (formData.PaymentMethod !== 'cash') {
    if (!fileUploaded.orderDocument && !formData.orderDocument?.trim()) {
      newErrors.orderDocument = 'ملف سند الأمر مطلوب';
    }
  }
  if (!fileUploaded.contract && !formData.contract?.trim()) {
    newErrors.contract = 'ملف العقد مطلوب';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Run validation
    if (!validateForm()) {
      setModalMessage('يرجى تصحيح الأخطاء في النموذج قبل الإرسال');
      setShowErrorModal(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const submitData: any = { 
        ...formData,
        Nationality: formData.Nationalitycopy // Map Nationalitycopy to Nationality for API
      };
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
      setFileUploaded({ orderDocument: false, contract: false });
setUploadedFileNames({ orderDocument: '', contract: '' }); 
    } catch (error: any) {
      setModalMessage(error.response?.data?.message || `حدث خطأ أثناء ${orderId ? 'تحديث' : 'إضافة'} الطلب`);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

//   const saudiCitiesMap: { [key: string]: string } = {
 
// };

const arabicRegionMap: { [key: string]: string } = {
     // --- المنطقة الوسطى (الرياض) ---
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

    // --- المنطقة الغربية (مكة المكرمة) ---
    'Makkah': 'مكة المكرمة',
    'Jeddah': 'جدة',
    'Taif': 'الطائف',
    'Rabigh': 'رابغ',
    'Al Qunfudhah': 'القنفذة',
    'Al Lith': 'الليث',
    'Khulais': 'خليص',
    'Ranyah': 'رنية',
    'Turabah': 'تربة',

    // --- المدينة المنورة ---
    'Madinah': 'المدينة المنورة',
    'Yanbu': 'ينبع',
    'Al Ula': 'العلا',
    'Badr': 'بدر',
    'Al Hinakiyah': 'الحناكية',
    'Mahd Al Dhahab': 'مهد الذهب',

    // --- المنطقة الشرقية ---
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

    // --- القصيم ---
    'Buraydah': 'بريدة',
    'Unaizah': 'عنيزة',
    'Ar Rass': 'الرس',
    'Al Bukayriyah': 'البكيرية',
    'Al Badaye': 'البدائع',
    'Al Mithnab': 'المذنب',
    'Riyad Al Khabra': 'رياض الخبراء',

    // --- عسير ---
    'Abha': 'أبها',
    'Khamis Mushait': 'خميس مشيط',
    'Bisha': 'بيشة',
    'Mahayil': 'محايل عسير',
    'Al Namas': 'النماص',
    'Tanomah': 'تنومة',
    'Ahad Rafidah': 'أحد رفيدة',
    'Sarat Abidah': 'سراة عبيدة',
    'Balqarn': 'بلقرن',

    // --- تبوك ---
    'Tabuk': 'تبوك',
    'Duba': 'ضباء',
    'Al Wajh': 'الوجه',
    'Umluj': 'أملج',
    'Tayma': 'تيماء',
    'Haqi': 'حقل',

    // --- حائل ---
    'Hail': 'حائل',
    'Baqa': 'بقعاء',
    'Al Ghazalah': 'الغزالة',

    // --- الحدود الشمالية ---
    'Arar': 'عرعر',
    'Rafha': 'رفحاء',
    'Turaif': 'طريف',

    // --- جازان ---
    'Jazan': 'جازان',
    'Sabya': 'صبيا',
    'Abu Arish': 'أبو عريش',
    'Samtah': 'صامطة',
    'Baish': 'بيش',
    'Ad Darb': 'الدرب',
    'Al Aridah': 'العارضة',
    'Fifa': 'فيفاء',

    // --- نجران ---
    'Najran': 'نجران',
    'Sharurah': 'شرورة',
    'Hubuna': 'حبونا',

    // --- الباحة ---
    'Al Baha': 'الباحة',
    'Baljurashi': 'بلجرشي',
    'Al Mandq': 'المندق',
    'Al Makhwah': 'المخواة',
    'Qilwah': 'قلوة',

    // --- الجوف ---
    'Sakaka': 'سكاكا',
    'Dumat Al Jandal': 'دومة الجندل',
    'Al Qurayyat': 'القريات',
    'Tabarjal': 'طبرجل'
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
                className={`w-full p-3 border ${
                  errors.clientID ? 'border-red-500' : 'border-gray-300'
                } rounded-md text-right focus:border-teal-500 focus:ring-1 focus:ring-teal-500 ${
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
              className={`bg-gray-50 border ${
                errors.PhoneNumber ? 'border-red-500' : 'border-gray-300'
              } rounded p-3 text-base text-gray-500 text-right`}
            />
            {errors.PhoneNumber && <p className="text-red-500 text-xs mt-1">{errors.PhoneNumber}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">مدينة العميل</label>
            <input
              type="text"
              name="City"
              placeholder="مدينة العميل"
              value={arabicRegionMap[formData.City as keyof typeof arabicRegionMap] || formData.City || ''}
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
                className={`w-full p-3 border ${
                  errors.HomemaidId ? 'border-red-500' : 'border-gray-300'
                } rounded-md text-right focus:border-teal-500 focus:ring-1 focus:ring-teal-500 ${
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
            {errors.HomemaidId && <p className="text-red-500 text-xs mt-1">{errors.HomemaidId}</p>}
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
              className={`bg-gray-50 border ${
                errors.Nationalitycopy ? 'border-red-500' : 'border-gray-300'
              } rounded p-3 text-base text-gray-500 text-right`}
            />
            {errors.Nationalitycopy && <p className="text-red-500 text-xs mt-1">{errors.Nationalitycopy}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">ديانة العاملة</label>
            <input
              type="text"
              name="Religion"
              value={formData.Religion}
              readOnly
              className={`bg-gray-50 border ${
                errors.Religion ? 'border-red-500' : 'border-gray-300'
              } rounded p-3 text-base text-gray-500 text-right`}
            />
            {errors.Religion && <p className="text-red-500 text-xs mt-1">{errors.Religion}</p>}
          </div>
        </div>

        {/* Visa Selection Section */}
        {formData.clientID && formData.Nationalitycopy && (
          <div className="mb-10 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 text-blue-900">اختيار التأشيرة</h2>
            
            {isLoadingVisas ? (
              <div className="flex items-center justify-center gap-2 p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                <span className="text-gray-600">جاري تحميل التأشيرات المتاحة...</span>
              </div>
            ) : availableVisas.length === 0 ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded text-center">
                <p className="text-red-600 font-medium">
                  لا توجد تأشيرات متاحة بجنسية {formData.Nationalitycopy} لهذا العميل
                </p>
                <p className="text-sm text-red-500 mt-2">
                  يرجى التأكد من إضافة تأشيرة للعميل بنفس جنسية العاملة المختارة
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableVisas.map((visa) => (
                  <div
                    key={visa.id}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, visaId: visa.id.toString() }));
                      setSelectedVisa(visa);
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.visaId;
                        return newErrors;
                      });
                    }}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.visaId === visa.id.toString()
                        ? 'border-teal-600 bg-teal-50 shadow-md'
                        : 'border-gray-300 bg-white hover:border-teal-400 hover:shadow'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-800">
                          رقم التأشيرة: {visa.visaNumber || 'غير محدد'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          الجنسية: <span className="font-medium">{visa.nationality}</span>
                        </p>
                        {visa.profession && (
                          <p className="text-sm text-gray-600">
                            المهنة: <span className="font-medium">{visa.profession}</span>
                          </p>
                        )}
                        {visa.gender && (
                          <p className="text-sm text-gray-600">
                            الجنس: <span className="font-medium">{visa.gender}</span>
                          </p>
                        )}
                      </div>
                      {formData.visaId === visa.id.toString() && (
                        <div className="flex-shrink-0 mr-2">
                          <svg className="w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {visa.visaFile && (
                      <a
                        href={visa.visaFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-teal-600 hover:underline inline-block mt-2"
                      >
                        عرض ملف التأشيرة
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {errors.visaId && (
              <p className="text-red-500 text-sm mt-3 text-center font-medium">{errors.visaId}</p>
            )}
          </div>
        )}
        
        {!formData.clientID && (
          <div className="mb-10 p-4 bg-yellow-50 border border-yellow-200 rounded text-center">
            <p className="text-yellow-700">يرجى اختيار العميل والعاملة أولاً لعرض التأشيرات المتاحة</p>
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
              min="0"
              step="0.01"
              className={`w-full p-3 border ${
                errors.Total ? 'border-red-500' : 'border-gray-300'
              } rounded-md text-right focus:border-teal-500 focus:ring-1 focus:ring-teal-500`}
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
              min="0"
              step="0.01"
              className={`w-full p-3 border ${
                errors.Paid ? 'border-red-500' : 'border-gray-300'
              } rounded-md text-right focus:border-teal-500 focus:ring-1 focus:ring-teal-500`}
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
    { id: 'orderDocument', label: 'ملف سند الأمر', show: formData.PaymentMethod !== 'cash' },
    { id: 'contract', label: 'ملف العقد', show: true },
  ].filter((file) => file.show).map((file) => (
    <div key={file.id} className="flex flex-col gap-2">
      <label htmlFor={file.id} className="text-base">{file.label}</label>
      <div className={`file-upload-display border ${
        errors[file.id] ? 'border-red-500' : 'border-gray-300'
      } rounded p-2 flex justify-between items-center`}>
        <span className="text-gray-500 text-sm pr-2 flex items-center gap-2">
          {isUploading[file.id as keyof typeof isUploading] ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
              <span>جاري الرفع...</span>
            </>
          ) : fileUploaded[file.id as keyof typeof fileUploaded] ? (
            // **التغيير الجديد: عرض اسم الملف بدلاً من "ملف مرفق"**
            <div className="flex flex-col">
              <span className="font-medium text-teal-800 text-sm mb-1">
                {uploadedFileNames[file.id as keyof typeof uploadedFileNames] || 'ملف مرفق'}
              </span>
              <a
                href={formData[file.id as keyof FormData] as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 hover:underline text-xs"
              >
                فتح الملف
              </a>
            </div>
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