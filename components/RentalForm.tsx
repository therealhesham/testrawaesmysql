import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CashIcon } from '@heroicons/react/outline';
import { Calendar, CreditCard, Wallet, CheckCircle, X } from 'lucide-react';
import Style from 'styles/Home.module.css';

interface FormData {
  customerName: string;
  phoneNumber: string;
  nationalId: string;
  customerCity: string;
  workerId: string;
  contractDuration: string;
  contractStartDate: string;
  contractEndDate: string;
  contractFile: string | null; // Changed to string to store filePath
  paymentMethod: string;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
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
    contractStartDate: '',
    contractEndDate: '',
    contractFile: null,
    paymentMethod: 'two-installments',
    totalAmount: '',
    paidAmount: '',
    remainingAmount: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [homemaidSearchTerm, setHomemaidSearchTerm] = useState('');
  const [homemaidSuggestions, setHomemaidSuggestions] = useState<any[]>([]);
  const [showHomemaidSuggestions, setShowHomemaidSuggestions] = useState(false);
  const [isSearchingHomemaids, setIsSearchingHomemaids] = useState(false);
  const [file, setFile] = useState<File | null>(null); // Store the selected file
  const [isUploadingFile, setIsUploadingFile] = useState(false); // Track file upload status
  const [isProcessingFile, setIsProcessingFile] = useState(false); // Track file processing status
  
  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Helper: Upload contract to DigitalOcean Spaces using presigned URL
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

  // Fetch client data if clientId exists
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

  // Auto search functions for homemaids - supports both name and ID search
  const searchHomemaids = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setHomemaidSuggestions([]);
      setShowHomemaidSuggestions(false);
      return;
    }
    
    setIsSearchingHomemaids(true);
    try {
      // Check if search term is a number (ID search)
      const isId = searchTerm.match(/^\d+$/);
      
      let response;
      if (isId) {
        // Search by ID using the existing API
        response = await fetch(`/api/getallhomemaids?id=${searchTerm}`);
      } else {
        // Search by name using the suggestions API
        response = await fetch(`/api/homemaids/suggestions?q=${encodeURIComponent(searchTerm)}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        let suggestions = [];
        
        if (isId) {
          // Transform data from getallhomemaids API
          if (data.data && data.data.length > 0) {
            suggestions = data.data.map((homemaid: any) => ({
              id: homemaid.id,
              Name: homemaid.Name,
              Country: homemaid.office?.Country || '',
              religion: homemaid.Religion || '',
            }));
          }
        } else {
          // Use suggestions from homemaids/suggestions API
          suggestions = data.suggestions || [];
        }
        
        setHomemaidSuggestions(suggestions);
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

  // Handle homemaid suggestion click
  const handleHomemaidSuggestionClick = (homemaid: any) => {
    setFormData((prev) => ({
      ...prev,
      workerId: homemaid.id.toString(),
    }));
    setHomemaidSearchTerm(homemaid.Name);
    setShowHomemaidSuggestions(false);
  };

  // Handle input blur for suggestions
  const handleHomemaidInputBlur = () => {
    setTimeout(() => {
      setShowHomemaidSuggestions(false);
    }, 200);
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

  // Modal functions
  const closeModal = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setModalMessage('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [id.replace('-', '')]: value };
      if (id === 'totalAmount' || id === 'paidAmount') {
        const total = parseFloat(newData.totalAmount) || 0;
        const paid = parseFloat(newData.paidAmount) || 0;
        newData.remainingAmount = (total - paid).toFixed(2);
      }
      if (id === 'contractEndDate' && newData.contractStartDate && value < newData.contractStartDate) {
        setModalMessage('تاريخ نهاية العقد يجب أن يكون بعد تاريخ البداية');
        setShowErrorModal(true);
        return prev;
      }
      return newData;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setModalMessage('الرجاء اختيار ملف PDF فقط');
      setShowErrorModal(true);
      return;
    }

    setIsProcessingFile(true);
    setFile(selectedFile);
    try {
      const uploadedPath = await uploadContractFile(selectedFile);
      setFormData((prev) => ({ ...prev, contractFile: uploadedPath }));
      setModalMessage('تم رفع الملف بنجاح');
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Error uploading contract file:', err);
      setModalMessage(err?.message || 'حدث خطأ أثناء رفع الملف');
      setShowErrorModal(true);
    } finally {
      setIsProcessingFile(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workerId) {
      setModalMessage('يرجى اختيار عاملة');
      setShowErrorModal(true);
      return;
    }
    setIsLoading(true);

    try {
      let finalClientId = clientId;
      let contractFileUrl: string | null = formData.contractFile;

      // Create new client if newClient is true
      if (newClient === 'true') {
        const clientData = {
          fullname: formData.customerName,
          phonenumber: formData.phoneNumber,
          nationalId: formData.nationalId,
          city: formData.customerCity,
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

      // Fallback: if user selected a file but it wasn't uploaded yet, upload now once
      if (!contractFileUrl && file) {
        const idHint = (typeof finalClientId === 'string' && finalClientId) || undefined;
        try {
          contractFileUrl = await uploadContractFile(file, idHint);
        } catch (error) {
          throw new Error('خطأ في رفع الملف');
        }
      }

      // Submit form data with the file URL
      const response = await fetch('/api/rentalform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          clientId: finalClientId,
          contractFile: contractFileUrl,
        }),
      });

      if (response.ok) {
        // Clear form data after successful submission
        setFormData({
          customerName: '',
          phoneNumber: '',
          nationalId: '',
          customerCity: '',
          workerId: '',
          contractDuration: '',
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
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
              className="bg-gray-50 border border-gray-200 rounded-md p-3 text-base text-right"
              disabled={!!clientId}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="phoneNumber" className="text-base text-right">رقم الجوال</label>
            <input
              type="text"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="bg-gray-50 border border-gray-200 rounded-md p-3 text-base text-right"
              disabled={!!clientId}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="customerCity" className="text-base text-right">مدينة العميل</label>
            <input
              type="text"
              id="customerCity"
              value={formData.customerCity}
              onChange={handleInputChange}
              className="bg-gray-50 border border-gray-200 rounded-md p-3 text-base text-right"
              disabled={!!clientId}
              required
            />
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
              className="bg-gray-50 border border-gray-200 rounded-md p-3 text-base text-right"
              required
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
            <input
              type="hidden"
              id="workerId"
              value={formData.workerId}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="contractDuration" className="text-base text-right">مدة العقد</label>
            <input
              type="text"
              id="contractDuration"
              value={formData.contractDuration}
              onChange={handleInputChange}
              placeholder="ادخل مدة العقد"
              className="bg-gray-50 border border-gray-200 rounded-md p-3 text-base text-right"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="contractStartDate" className="text-base text-right">تاريخ بداية العقد</label>
            <div className="relative">
              <input
                type="date"
                id="contractStartDate"
                value={formData.contractStartDate}
                onChange={handleInputChange}
                className="bg-gray-50 border border-gray-200 rounded-md p-3 text-base text-right w-full"
                required
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="contractEndDate" className="text-base text-right">تاريخ نهاية العقد</label>
            <div className="relative">
              <input
                type="date"
                id="contractEndDate"
                value={formData.contractEndDate}
                onChange={handleInputChange}
                className="bg-gray-50 border border-gray-200 rounded-md p-3 text-base text-right w-full"
                required
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="contractFile" className="text-base text-right">ملف العقد</label>
            <div className="flex items-center gap-1">
              <input
                type="file"
                id="contractFile"
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
                disabled={isUploadingFile || isProcessingFile}
              />
                 {formData.contractFile ? (
            <a
              href={formData.contractFile}
              target="_blank"
              rel="noopener noreferrer"
              className="mr-2 text-sm text-teal-800 hover:underline"
            >
              تصفح الملف
            </a>
          ) : (
            file && (
              <span className="mr-2 text-sm">
                {isProcessingFile ? 'جاري معالجة الملف...' : file.name}
              </span>
            )
          )}
              <label
                htmlFor="contractFile"
                className={`bg-teal-800 text-white px-3 py-1 rounded-md text-sm cursor-pointer flex items-center gap-2 ${
                  (isUploadingFile || isProcessingFile) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {(isUploadingFile || isProcessingFile) && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {isProcessingFile ? 'جاري المعالجة...' : isUploadingFile ? 'جاري الرفع...' : 'اختيار ملف'}
              </label>
       
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <label className="text-base text-right">طريقة الدفع المختارة</label>
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-14">
              <div className="flex items-center justify-center w-60 h-12 border-2 border-teal-800 rounded-lg bg-gray-50 cursor-pointer">
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
                  className={`flex items-center justify-center gap-2 text-lg cursor-pointer ${
                    formData.paymentMethod === 'cash' ? 'text-teal-800 font-bold' : 'text-gray-600'
                  }`}
                  onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: 'cash' }))}
                >
                  <CashIcon className="w-6 h-6" />
                  <span>كاش</span>
                </label>
              </div>
              <div className="flex items-center justify-center w-60 h-12 border-2 border-teal-800 rounded-lg bg-gray-50 cursor-pointer">
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
                  className={`flex items-center justify-center gap-2 text-lg cursor-pointer ${
                    formData.paymentMethod === 'two-installments' ? 'text-teal-800 font-bold' : 'text-gray-600'
                  }`}
                  onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: 'two-installments' }))}
                >
                  <CreditCard className="w-6 h-6" />
                  <span>دفعتين</span>
                </label>
              </div>
              <div className="flex items-center justify-center w-60 h-12 border-2 border-teal-800 rounded-lg bg-gray-50 cursor-pointer">
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
                  className={`flex items-center justify-center gap-2 text-lg cursor-pointer ${
                    formData.paymentMethod === 'three-installments' ? 'text-teal-800 font-bold' : 'text-gray-600'
                  }`}
                  onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: 'three-installments' }))}
                >
                  <Wallet className="w-6 h-6" />
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
              className="bg-gray-50 border border-gray-200 rounded-md p-3 text-base text-right"
              min="0"
              step="0.01"
              placeholder="أدخل المبلغ الكلي (اختياري)"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="paidAmount" className="text-base text-right">المبلغ المدفوع</label>
            <input
              type="number"
              id="paidAmount"
              value={formData.paidAmount}
              onChange={handleInputChange}
              className="bg-gray-50 border border-gray-200 rounded-md p-3 text-base text-right"
              min="0"
              step="0.01"
              placeholder="أدخل المبلغ المدفوع (اختياري)"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="remainingAmount" className="text-base text-right">المبلغ المتبقي</label>
            <input
              type="number"
              id="remainingAmount"
              value={formData.remainingAmount}
              readOnly
              className="bg-gray-100 border border-gray-200 rounded-md p-3 text-base text-right"
              placeholder="سيتم حسابه تلقائيًا (اختياري)"
            />
          </div>
        </div>
        <div className="flex justify-center gap-6 pt-10">
          <button
            type="submit"
            disabled={isLoading}
            className={`bg-teal-800 text-white px-4 py-2 rounded-md text-sm ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/requests')}
            className="border border-teal-800 text-teal-800 px-4 py-2 rounded-md text-sm"
          >
            إلغاء
          </button>
        </div>
      </form>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center relative">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
              onClick={closeModal}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <p className="text-green-600 text-lg font-medium">{modalMessage}</p>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded mt-4 hover:bg-green-600 transition duration-200"
              onClick={closeModal}
            >
              موافق
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center relative">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
              onClick={closeModal}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center mb-4">
              <X className="w-12 h-12 text-red-500" />
            </div>
            <p className="text-red-600 text-lg font-medium">{modalMessage}</p>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded mt-4 hover:bg-red-600 transition duration-200"
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