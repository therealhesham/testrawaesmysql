import { CashIcon, CreditCardIcon, CurrencyDollarIcon } from '@heroicons/react/outline';
import axios from 'axios';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import GenderQuotaConfirmModal from 'components/GenderQuotaConfirmModal';

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
  Total: number | string;
  Paid: number | string;
  Remaining: number | string;
  AmountWithoutTax?: number | string;
  TaxAmount?: number | string;
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
  const [showGenderQuotaModal, setShowGenderQuotaModal] = useState(false);
  const [genderQuotaMessage, setGenderQuotaMessage] = useState('');
  const [genderQuotaResolving, setGenderQuotaResolving] = useState(false);
  const genderQuotaPendingRef = useRef<{
    method: string;
    url: string;
    submitData: Record<string, unknown>;
  } | null>(null);
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
const [isExtractingAmount, setIsExtractingAmount] = useState(false);
const [justExtracted, setJustExtracted] = useState(false);
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

  // Unfit Homemaid Modal state
  const [showUnfitModal, setShowUnfitModal] = useState(false);
  const [unfitHomemaid, setUnfitHomemaid] = useState<any>(null);

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

  // Confirm homemaid selection logic
  const confirmHomemaidSelection = (homemaid: any) => {
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

    setShowUnfitModal(false);
    setUnfitHomemaid(null);
  };

  // Handle homemaid suggestion click
  const handleHomemaidSuggestionClick = (homemaid: any) => {
    if (homemaid.bookingstatus === 'غير لائقة طبيا' || homemaid.bookingstatus === 'غير لائقة طبياً') {
      setUnfitHomemaid(homemaid);
      setShowUnfitModal(true);
      return;
    }
    confirmHomemaidSelection(homemaid);
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
    setUploadedFileNames((prev) => ({ ...prev, [fileId]: file.name }));

    const ref = fileInputRefs[fileId as keyof typeof fileInputRefs];
    if (ref && ref.current) {
      ref.current.value = '';
    }

    if (fileId === 'contract') {
      setIsExtractingAmount(true);
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('image', file, file.name);

        const response = await fetch('https://aidoc.rawaes.com/api/extractcontract', {
          method: 'POST',
          body: formDataUpload,
        });

        if (!response.ok) {
           throw new Error('فشل الاستخراج من الذكاء الاصطناعي');
        }

        const aiRes = await response.json();
         console.log("AI Extraction Result:", aiRes);
         
         if (aiRes) {
           if (aiRes.amount_without_tax !== undefined && aiRes.tax_amount !== undefined) {
             const withoutTax = Number(aiRes.amount_without_tax);
             const tax = Number(aiRes.tax_amount);
             
             if (!isNaN(withoutTax) && !isNaN(tax)) {
               const extractedAmount = withoutTax + tax;
               if (extractedAmount > 0) {
                 setFormData(prev => {
                    const newData = { ...prev, Total: extractedAmount, AmountWithoutTax: withoutTax, TaxAmount: tax };
                    if (prev.PaymentMethod === 'cash') {
                      newData.Paid = extractedAmount;
                      newData.Remaining = 0;
                    } else {
                      newData.Remaining = extractedAmount - (Number(prev.Paid) || 0);
                    }
                    return newData;
                 });
                 setJustExtracted(true);
                 setTimeout(() => setJustExtracted(false), 5000);
               }
             }
           } else if (aiRes.amount !== undefined) {
             const extractedAmount = Number(aiRes.amount);
             if (!isNaN(extractedAmount) && extractedAmount > 0) {
               setFormData(prev => {
                  const newData = { ...prev, Total: extractedAmount };
                  if (prev.PaymentMethod === 'cash') {
                    newData.Paid = extractedAmount;
                    newData.Remaining = 0;
                  } else {
                    newData.Remaining = extractedAmount - (Number(prev.Paid) || 0);
                  }
                  return newData;
               });
               setJustExtracted(true);
               setTimeout(() => setJustExtracted(false), 5000);
             }
           }
         }
      } catch (err) {
         console.error('Error extracting amount from contract:', err);
         setErrors(prev => ({ ...prev, contract: 'تعذر استخراج المبالغ بالذكاء الاصطناعي، يرجى إدخالها يدوياً' }));
      } finally {
         setIsExtractingAmount(false);
      }
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
        Nationality: formData.Nationalitycopy, // Map Nationalitycopy to Nationality for API
      };
      if (orderId) {
        submitData.orderId = orderId; // Add for edit
      }
      const url = orderId ? `/api/track_order/${orderId}` : '/api/submitneworderprisma';
      const method = orderId ? 'PATCH' : 'POST';

      const postOrder = async (withQuotaConfirm: boolean) =>
        axios({
          method,
          url,
          data: withQuotaConfirm ? { ...submitData, confirmGenderQuotaWarning: true } : submitData,
        });

      let response = await postOrder(false);
      if (response.data?.requiresGenderQuotaConfirmation === true) {
        genderQuotaPendingRef.current = {
          method,
          url,
          submitData: { ...submitData },
        };
        setGenderQuotaMessage(String(response.data.message ?? ''));
        setShowGenderQuotaModal(true);
        return;
      }

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

  const closeGenderQuotaModal = () => {
    setShowGenderQuotaModal(false);
    setGenderQuotaMessage('');
    genderQuotaPendingRef.current = null;
  };

  const handleGenderQuotaConfirm = async () => {
    const pending = genderQuotaPendingRef.current;
    if (!pending) return;
    setGenderQuotaResolving(true);
    try {
      const response = await axios({
        method: pending.method,
        url: pending.url,
        data: { ...pending.submitData, confirmGenderQuotaWarning: true },
      });
      if (response.data?.requiresGenderQuotaConfirmation === true) {
        setModalMessage('تعذر إتمام الطلب بعد التأكيد. حاول مرة أخرى.');
        setShowErrorModal(true);
        closeGenderQuotaModal();
        return;
      }
      closeGenderQuotaModal();
      setModalMessage(orderId ? 'تم تحديث الطلب بنجاح' : 'تم إضافة الطلب بنجاح');
      setShowSuccessModal(true);
      setFileUploaded({ orderDocument: false, contract: false });
      setErrors({});
      onSuccess();
      setFileUploaded({ orderDocument: false, contract: false });
      setUploadedFileNames({ orderDocument: '', contract: '' });
    } catch (error: any) {
      setModalMessage(
        error.response?.data?.message || `حدث خطأ أثناء ${orderId ? 'تحديث' : 'إضافة'} الطلب`
      );
      setShowErrorModal(true);
      closeGenderQuotaModal();
    } finally {
      setGenderQuotaResolving(false);
    }
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
                onFocus={() => !formData.clientID && clientSearchTerm.length >= 1 && setShowClientSuggestions(true)}
                placeholder="ابحث عن العميل بالاسم أو رقم الهاتف"
                readOnly={!!formData.clientID}
                disabled={isSubmitting}
                className={`w-full p-3 border ${
                  errors.clientID ? 'border-red-500' : 'border-gray-300'
                } rounded-md text-right ${
                  formData.clientID 
                    ? 'bg-gray-50 text-gray-500 cursor-not-allowed' 
                    : 'focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                } ${
                  isSubmitting ? 'bg-gray-200 cursor-not-allowed' : formData.clientID ? '' : 'bg-gray-50'
                }`}
              />
              {isSearchingClients && !formData.clientID && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                </div>
              )}
              
              {/* Client Search Results Dropdown */}
              {!formData.clientID && showClientSuggestions && clientSuggestions.length > 0 && (
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
      {/* Upload Contract Section Above Invoice */}
      <div className={`mb-6 border rounded-xl p-4 shadow-sm transition-all duration-500 ${
        justExtracted 
          ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 ring-offset-1 shadow-md scale-[1.005]' 
          : formData.contract 
            ? 'bg-gradient-to-l from-emerald-50/90 via-teal-50/70 to-white border-teal-300' 
            : 'bg-gradient-to-l from-teal-50/80 to-white border-teal-200'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <input
            type="file"
            id="contract"
            ref={fileInputRefs['contract']}
            className="hidden"
            accept="application/pdf,image/jpeg,image/png"
            onChange={(e) => handleFileChange(e, 'contract')}
          />

          {formData.contract ? (
            /* Uploaded State: Professional File & AI Extraction Card */
            <>
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                {/* Large PDF/Doc Icon */}
                <div className={`w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex flex-col items-center justify-center flex-shrink-0 shadow-sm text-red-600 transition-transform duration-300 ${justExtracted ? 'scale-110 ring-2 ring-emerald-400' : ''}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-[9px] font-bold uppercase tracking-wider -mt-0.5">PDF</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-gray-900 truncate" title={uploadedFileNames['contract'] || 'ملف الفاتورة'}>
                      {uploadedFileNames['contract'] || 'ملف الفاتورة.pdf'}
                    </h3>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors duration-300 ${
                      justExtracted 
                        ? 'bg-emerald-200 text-emerald-900 border-emerald-400 shadow-sm' 
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                      </span>
                      {justExtracted ? '✨ تم استخراج مبالغ الفاتورة بنجاح' : 'تم استخراج الفاتورة وحفظ الملف'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                    تم استخراج مبالغ الفاتورة وتعبئة الحقول المالية وحفظ ملف الفاتورة في النظام.
                  </p>
                </div>
              </div>

              {/* Action Buttons on Left Side */}
              <div className="flex items-center gap-2.5 flex-shrink-0 w-full md:w-auto justify-end">
                <a
                  href={formData.contract}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-teal-700 text-teal-900 rounded-lg text-xs font-bold hover:bg-teal-50 transition shadow-sm"
                >
                  <svg className="w-4 h-4 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  عرض ملف الفاتورة
                </a>
                <button
                  type="button"
                  disabled={isSubmitting || isUploading['contract'] || isExtractingAmount}
                  onClick={() => handleButtonClick('contract')}
                  className="flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 hover:text-gray-900 transition"
                >
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  تغيير الملف
                </button>
              </div>
            </>
          ) : (
            /* Initial State */
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-teal-950">استخراج ذكي لبيانات الفاتورة</h2>
                  <p className="text-gray-500 text-xs mt-0.5">
                    قم برفع ملف الفاتورة (PDF أو صورة) وسيقوم الذكاء الاصطناعي باستخراج المبالغ وتعبئة الفاتورة تلقائياً.
                  </p>
                </div>
              </div>
              
              <div className="w-full md:w-auto flex-shrink-0">
                <button
                  type="button"
                  disabled={isSubmitting}
                  className={`w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition duration-200 ${
                    isUploading['contract'] || isExtractingAmount
                      ? 'bg-gray-300 text-gray-500 cursor-wait'
                      : 'bg-teal-800 text-white hover:bg-teal-900 shadow-sm'
                  }`}
                  onClick={() => handleButtonClick('contract')}
                >
                  {isUploading['contract'] || isExtractingAmount ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span>جاري استخراج بيانات الفاتورة...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <span>رفع ملف الفاتورة</span>
                    </>
                  )}
                </button>
                {errors['contract'] && <p className="text-red-500 text-xs mt-1 text-center font-medium">{errors['contract']}</p>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Invoice Layout */}
      <div className="mb-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
          <h2 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            تفاصيل الفاتورة والدفع
          </h2>
        </div>

        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-5">
            
            {/* Right Side: Payment Methods (Stacked) */}
            <div className="lg:w-1/3 flex flex-col gap-2.5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">اختر طريقة الدفع</h3>
              {[
                { option: 'دفعة واحدة', value: 'cash', imgSrc: <CashIcon className="w-5 h-5" /> },
                { option: 'دفعتين', value: 'two-installments', imgSrc: <CreditCardIcon className="w-5 h-5" /> },
                { option: 'ثلاث دفعات', value: 'three-installments', imgSrc: <CurrencyDollarIcon className="w-5 h-5" /> },
                { option: 'مخصص', value: 'custom', imgSrc: <CurrencyDollarIcon className="w-5 h-5" /> },
              ].map(({ option, value, imgSrc }, index) => (
                <label key={index} className="payment-option block cursor-pointer">
                  <input
                    type="radio"
                    name="PaymentMethod"
                    value={value}
                    checked={formData.PaymentMethod === value}
                    onChange={handleFormChange}
                    className="hidden"
                  />
                  <div className={`payment-button flex items-center justify-between p-2.5 border rounded-lg transition-colors ${
                    formData.PaymentMethod === value 
                      ? 'border-teal-700 bg-teal-800 text-white shadow-sm' 
                      : 'border-gray-300 bg-white text-gray-700 hover:border-teal-400 hover:bg-teal-50/50'
                  }`}>
                    <span className="text-sm font-medium">{option}</span>
                    <div className={`p-1 rounded ${formData.PaymentMethod === value ? 'text-white' : 'text-gray-500'}`}>
                      {imgSrc}
                    </div>
                  </div>
                </label>
              ))}
              
              {/* Conditional Promissory Note Upload */}
              {formData.PaymentMethod !== 'cash' && (
                <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <label htmlFor="orderDocument" className="text-xs font-semibold text-orange-800 flex items-center gap-1 mb-2">
                    <span className="text-red-500">*</span>
                    رفع ملف سند الأمر
                  </label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      id="orderDocument"
                      ref={fileInputRefs['orderDocument']}
                      className="hidden"
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={(e) => handleFileChange(e, 'orderDocument')}
                    />
                    <button
                      type="button"
                      disabled={isSubmitting}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition duration-200 ${
                        isUploading['orderDocument']
                          ? 'bg-gray-300 text-gray-500 cursor-wait'
                          : 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm'
                      }`}
                      onClick={() => handleButtonClick('orderDocument')}
                    >
                      {isUploading['orderDocument'] ? (
                        <>
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                          <span>جاري الرفع...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                          <span>اختر ملف سند الأمر</span>
                        </>
                      )}
                    </button>
                    {fileUploaded['orderDocument'] && (
                       <p className="text-orange-700 text-xs text-center font-medium">✓ تم رفع السند بنجاح</p>
                    )}
                    {errors['orderDocument'] && <p className="text-red-500 text-xs text-center font-medium">{errors['orderDocument']}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Left Side: Invoice Amounts */}
            <div className="lg:w-2/3 bg-gray-50/80 rounded-lg p-4 border border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 pb-2 border-b border-gray-200">ملخص المبالغ</h3>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 sm:w-2/5">المبلغ (بدون ضريبة)</label>
                  <div className="sm:w-3/5">
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        name="AmountWithoutTax"
                        value={formData.AmountWithoutTax || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const withoutTax = Number(val) || 0;
                          const tax = Number(formData.TaxAmount) || 0;
                          const total = withoutTax + tax;
                          setFormData(prev => ({ 
                            ...prev, 
                            AmountWithoutTax: val, 
                            Total: total > 0 ? total : ''
                          }));
                        }}
                        placeholder="0.00"
                        className="w-full p-2.5 pl-12 border border-gray-300 bg-white rounded-md text-left text-sm text-gray-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                        style={{direction: 'ltr'}}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">SAR</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 sm:w-2/5">قيمة الضريبة المضافة (VAT)</label>
                  <div className="sm:w-3/5">
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        name="TaxAmount"
                        value={formData.TaxAmount || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const withoutTax = Number(formData.AmountWithoutTax) || 0;
                          const tax = Number(val) || 0;
                          const total = withoutTax + tax;
                          setFormData(prev => ({ 
                            ...prev, 
                            TaxAmount: val, 
                            Total: total > 0 ? total : ''
                          }));
                        }}
                        placeholder="0.00"
                        className="w-full p-2.5 pl-12 border border-gray-300 bg-white rounded-md text-left text-sm text-gray-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                        style={{direction: 'ltr'}}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">SAR</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-gray-200">
                  <label className="text-xs sm:text-sm font-bold text-teal-900 sm:w-2/5">المبلغ كامل (شامل الضريبة)</label>
                  <div className="sm:w-3/5">
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        name="Total"
                        value={formData.Total}
                        onChange={handleFormChange}
                        placeholder="0.00"
                        className={`w-full p-2.5 pl-12 border ${
                          errors.Total ? 'border-red-400 bg-red-50' : 'border-teal-400 bg-teal-50/50'
                        } rounded-md text-left text-sm font-bold text-teal-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors`}
                        style={{direction: 'ltr'}}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-800 text-xs font-bold">SAR</span>
                    </div>
                    {errors.Total && <p className="text-red-500 text-xs mt-1 font-medium">{errors.Total}</p>}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 sm:w-2/5">المبلغ المدفوع</label>
                  <div className="sm:w-3/5">
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        name="Paid"
                        value={formData.Paid}
                        onChange={handleFormChange}
                        placeholder="0.00"
                        className={`w-full p-2.5 pl-12 border ${
                          errors.Paid ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                        } rounded-md text-left text-sm text-gray-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors`}
                        style={{direction: 'ltr'}}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">SAR</span>
                    </div>
                    {errors.Paid && <p className="text-red-500 text-xs mt-1 font-medium">{errors.Paid}</p>}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-500 sm:w-2/5">المبلغ المتبقي</label>
                  <div className="sm:w-3/5">
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        name="Remaining"
                        value={formData.Remaining}
                        readOnly
                        className="w-full p-2.5 pl-12 border border-gray-300 bg-gray-100 rounded-md text-left text-sm text-gray-600 cursor-not-allowed"
                        style={{direction: 'ltr'}}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">SAR</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
          </div>
        </div>
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
      <GenderQuotaConfirmModal
        open={showGenderQuotaModal}
        message={genderQuotaMessage}
        isSubmitting={genderQuotaResolving}
        onConfirm={handleGenderQuotaConfirm}
        onCancel={closeGenderQuotaModal}
      />

      {/* Unfit Homemaid Confirmation Modal */}
      {showUnfitModal && unfitHomemaid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-center relative" style={{ direction: 'rtl' }}>
            <button
              className="absolute top-3 left-3 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => { setShowUnfitModal(false); setUnfitHomemaid(null); }}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
                <svg className="w-10 h-10" style={{ color: '#F59E0B' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-gray-800 text-lg font-semibold">هذه العاملة فشلت في الفحص الطبي. هل تود المتابعة واختيارها؟</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                className="flex-1 bg-teal-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors"
                onClick={() => confirmHomemaidSelection(unfitHomemaid)}
              >
                حسناً
              </button>
              <button
                className="flex-1 border-2 border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                onClick={() => { setShowUnfitModal(false); setUnfitHomemaid(null); }}
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