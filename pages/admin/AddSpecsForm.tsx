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
  });
  const [fileUploaded, setFileUploaded] = useState({
    orderDocument: false,
    contract: false,
  });
  const [errors, setErrors] = useState({});
  const [modalMessage, setModalMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

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
    // Same as in AddAvailableForm
    const files = e.target.files;
    if (!files || files.length === 0) {
      setErrors((prev) => ({ ...prev, [fileId]: 'لم يتم اختيار ملف' }));
      setFileUploaded((prev) => ({ ...prev, [fileId]: false }));
      return;
    }

    const file = files[0];
    if (!allowedFileTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, [fileId]: 'نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)' }));
      setFileUploaded((prev) => ({ ...prev, [fileId]: false }));
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

      setFormData((prev) => ({ ...prev, [fileId]: filePath }));
      setErrors((prev) => ({ ...prev, [fileId]: '' }));
      setFileUploaded((prev) => ({ ...prev, [fileId]: true }));

      const ref = fileInputRefs[fileId as keyof typeof fileInputRefs];
      if (ref && ref.current) {
        ref.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setErrors((prev) => ({ ...prev, [fileId]: error.message || 'حدث خطأ أثناء رفع الملف' }));
      setFileUploaded((prev) => ({ ...prev, [fileId]: false }));
    }
  };

  const handleButtonClick = (fileId: string) => {
    // Same as in AddAvailableForm
    const ref = fileInputRefs[fileId as keyof typeof fileInputRefs];
    if (ref && ref.current) {
      ref.current.click();
    } else {
      console.error(`Reference for ${fileId} is not defined or has no current value`);
      setErrors((prev) => ({ ...prev, [fileId]: 'خطأ في تحديد حقل الملف' }));
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
    // Same as in AddAvailableForm
    const newErrors: any = {};
    const requiredFields = [
      { id: 'clientID', label: 'اسم العميل' },
      { id: 'Total', label: 'المبلغ كامل' },
      { id: 'Paid', label: 'المبلغ المدفوع' },
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
    try {
      const submitData = { ...formData };
      if (orderId) {
        submitData.orderId = orderId;
      }
      const url = orderId ? `/api/track_order/${orderId}` : '/api/submitneworderbyspecs';
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
    }
  };

  const closeModal = () => {
    // Same as in AddAvailableForm
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setModalMessage('');
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
        </div>
        <div className="mb-10">
          <h2 className="text-base font-normal mb-2">طريقة الدفع المختارة</h2>
          <div className="flex flex-wrap gap-6 justify-center">
            {[
              { option: 'كاش', icon: <CashIcon className={`w-6 h-6 ${formData.PaymentMethod === 'كاش' ? 'text-teal-800' : 'text-gray-400'}`} /> },
              { option: 'دفعتين', icon: <CreditCardIcon className={`w-6 h-6 ${formData.PaymentMethod === 'دفعتين' ? 'text-teal-800' : 'text-gray-400'}`} /> },
              { option: 'ثلاثة دفعات', icon: <CurrencyDollarIcon className={`w-6 h-6 ${formData.PaymentMethod === 'ثلاثة دفعات' ? 'text-teal-800' : 'text-gray-400'}`} /> },
            ].map(({ option, icon }, index) => (
              <label
                key={index}
                className={`flex items-center gap-3 p-3 border-2 rounded cursor-pointer w-60 ${
                  formData.PaymentMethod === option ? 'border-teal-900 bg-teal-100' : 'border-gray-300 bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="PaymentMethod"
                  value={option}
                  checked={formData.PaymentMethod === option}
                  onChange={handleFormChange}
                  className="hidden"
                />
                <span className={`text-xl ${formData.PaymentMethod === option ? 'text-teal-900' : 'text-teal-800'}`}>
                  {option}
                </span>
                {icon}
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
          <div className="flex flex-col gap-2">
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
                  {fileUploaded[file.id] ? (
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
                  className="bg-teal-900 text-white px-3 py-1 rounded text-sm hover:bg-teal-800 transition duration-200"
                  onClick={() => handleButtonClick(file.id)}
                >
                  اختيار ملف
                </button>
              </div>
              {errors[file.id] && <p className="text-red-500 text-xs mt-1">{errors[file.id]}</p>}
            </div>
          ))}
        </div>
        <div className="flex gap-6 flex-col sm:flex-row">
          <button type="submit" className="bg-teal-900 text-white px-4 py-2 rounded w-full sm:w-40 hover:bg-teal-800 transition duration-200">حفظ</button>
          <button type="button" onClick={onCancel} className="bg-gray-100 text-gray-800 border-2 border-teal-800 px-4 py-2 rounded w-full sm:w-40 hover:bg-gray-200 transition duration-200">إلغاء</button>
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