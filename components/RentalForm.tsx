import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { CashIcon } from '@heroicons/react/outline';
import { ArrowDown, Calendar, CreditCard, Wallet, CheckCircle, X } from 'lucide-react';
import Style from 'styles/Home.module.css';
import debounce from 'lodash.debounce';
import axios from 'axios';

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [homemaids, setHomemaids] = useState<Homemaid[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [file, setFile] = useState<File | null>(null); // Store the selected file

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
            setError('لم يتم العثور على العميل');
          }
        } catch (err) {
          console.error('Error fetching client:', err);
          setError('خطأ في جلب بيانات العميل');
        } finally {
          setIsLoading(false);
        }
      };
      fetchClient();
    }
  }, [clientId]);

  // Debounced function to fetch homemaids
  const fetchHomemaids = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setHomemaids([]);
        setShowSuggestions(false);
        return;
      }
      try {
        const isId = query.match(/^\d+$/);
        const response = await fetch(
          `/api/getallhomemaids?${isId ? `id=${query}` : `Name=${encodeURIComponent(query)}`}`
        );
        const data = await response.json();
        if (response.ok && data.data) {
          setHomemaids(data.data);
          setShowSuggestions(true);
        } else {
          setHomemaids([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error('Error fetching homemaids:', err);
        setError('خطأ في جلب بيانات العاملات');
      }
    }, 300),
    []
  );

  useEffect(() => {
    fetchHomemaids(searchQuery);
  }, [searchQuery, fetchHomemaids]);

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
        setError('تاريخ نهاية العقد يجب أن يكون بعد تاريخ البداية');
        return prev;
      }
      return newData;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const handleHomemaidSelect = (homemaid: Homemaid) => {
    setFormData((prev) => ({ ...prev, workerId: homemaid.id.toString() }));
    setSearchQuery(homemaid.Name);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workerId) {
      setError('يرجى اختيار عاملة');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let finalClientId = clientId;
      let contractFileUrl: string | null = null;

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

      // Upload file to DigitalOcean Spaces if a file is selected
      if (file) {
        const response = await fetch(`/api/upload-presigned-url/${finalClientId || Date.now()}`, {
          method: 'GET',
        });
        if (!response.ok) {
          throw new Error('Failed to get presigned URL');
        }
        const { url, filePath } = await response.json();
        contractFileUrl = filePath;

        // Upload the file to the presigned URL
        await axios.put(url, file, {
          headers: {
            'Content-Type': 'application/pdf',
          },
        });
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
        setSuccess('تم إنشاء طلب التأجير بنجاح!');
        setTimeout(() => router.push('/admin/neworders'), 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطأ في إنشاء الطلب');
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setError(error.message || 'خطأ في الخادم الداخلي');
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
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-center mb-4">
          <X className="w-5 h-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-green-500 text-center mb-4">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

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
          <div className="flex flex-col gap-2 relative">
            <label htmlFor="workerSearch" className="text-base text-right">اسم أو رقم العاملة</label>
            <input
              type="text"
              id="workerSearch"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو الرقم"
              className="bg-gray-50 border border-gray-200 rounded-md p-3 text-base text-right"
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              required
            />
            {showSuggestions && homemaids.length > 0 && (
              <ul className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md mt-1 max-h-40 overflow-y-auto z-10 shadow-md">
                {homemaids.map((homemaid) => (
                  <li
                    key={homemaid.id}
                    className="px-4 py-2 hover:bg-teal-50 cursor-pointer text-right text-base"
                    onMouseDown={() => handleHomemaidSelect(homemaid)}
                  >
                    {homemaid.Name} (ID: {homemaid.id})
                  </li>
                ))}
              </ul>
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
            <div className="flex items-center justify-end">
              <input
                type="file"
                id="contractFile"
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
              />
              <label
                htmlFor="contractFile"
                className="bg-teal-800 text-white px-3 py-1 rounded-md text-sm cursor-pointer"
              >
                اختيار ملف
              </label>
              {file && <span className="mr-2 text-sm">{file.name}</span>}
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
              placeholder="أدخل المبلغ الكلي"
              required
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
              placeholder="أدخل المبلغ المدفوع"
              required
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
              placeholder="سيتم حسابه تلقائيًا"
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
    </div>
  );
}