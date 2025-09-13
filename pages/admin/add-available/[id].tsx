import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import { CashIcon, CreditCardIcon, CurrencyDollarIcon } from '@heroicons/react/outline';
import axios from 'axios';
import Style from "styles/Home.module.css";
import Layout from 'example/containers/Layout';
import { ArrowDown, Plus, Search, X } from 'lucide-react';
import Head from 'next/head';
import { useEffect, useState, useRef } from 'react';
import Select from 'react-select';
import { MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/router';

export default function AddAvailablePage() {
  const router = useRouter();
  const { id } = router.query;

  // State for form fields - ONLY what we can populate from API response
  const [formData, setFormData] = useState({
    clientID: '',           // Will be populated if client.id exists
    HomemaidId: '',         // Will be populated if homemaid.id exists
    ClientName: '',
    PhoneNumber: '',
    Nationalitycopy: '',
    Religion: '',           // Not in API → leave empty
    PaymentMethod: 'كاش',
    Total: 0,
    Paid: 0,
    age: 0,                 // Not in API → default 0
    ExperienceYears: 0,     // Not in API → default 0
    notes: '',
    orderDocument: '',
    contract: '',
    applicationDate: '',    // ← New field from API
    applicationTime: '',    // ← New field from API
  });

  const [clients, setClients] = useState([]); // For select dropdown
  const [homemaids, setHomemaids] = useState([]); // For select dropdown
  const [fileUploaded, setFileUploaded] = useState({ orderDocument: false, contract: false });
  const [progress, setProgress] = useState([]);
  const [errors, setErrors] = useState({});
  const fileInputRefs = { orderDocument: useRef(null), contract: useRef(null) };
  const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];

  // Fetch order data on mount
  useEffect(() => {
    if (!id) return;

    axios.get(`/api/trackeditedorder/${id}`).then(res => {
      const data = res.data;

      // Extract clientInfo, homemaidInfo, and applicationInfo from the response
      const clientInfo = data.client || {};
      const homemaidInfo = data.HomeMaid || {};
      const applicationInfo = data.arrivals && data.arrivals.length > 0 ? data.arrivals[0] : {};

      // Set initial form data based on API response
      setFormData({
        clientID: clientInfo.id || '',              // If ID exists, use it
        HomemaidId: homemaidInfo.id || '',          // If ID exists, use it
        ClientName: clientInfo.fullname || '',
        PhoneNumber: clientInfo.phonenumber || '',
        Nationalitycopy: homemaidInfo.Nationalitycopy || homemaidInfo.nationality || applicationInfo.office || '',
        Religion: '',                               // Not provided → leave empty
        PaymentMethod: data.paymentMethod || 'كاش',
        Total: data.total || 0,
        Paid: data.paid || 0,
        age: 0,                                     // Not in API → default
        ExperienceYears: 0,                         // Not in API → default
        notes: data.notes || '',
        orderDocument: data.orderDocument || '',
        contract: data.contract || '',
        applicationDate: applicationInfo.DateOfApplication ? new Date(applicationInfo.DateOfApplication).toISOString().split('T')[0] : '',
        applicationTime: applicationInfo.DateOfApplication ? new Date(applicationInfo.DateOfApplication).toTimeString().split(' ')[0] : '',
      });

      // Update file upload status
      setFileUploaded({
        orderDocument: !!data.orderDocument,
        contract: !!data.contract,
      });

      // Progress bar
      const progressSteps = [
        { label: 'طلب جديد', completed: data.bookingStatus === 'new_order' },
        { label: 'الفحص الطبي', completed: applicationInfo.medicalCheckFile === 'passed' || false },
        { label: 'موافقة السفارة', completed: applicationInfo.EmbassySealing ? true : false },
        { label: 'إصدار التأشيرة', completed: !!applicationInfo.visaNumber },
        { label: 'إصدار تصريح السفر', completed: applicationInfo.travelPermit === 'issued' },
        { label: 'استلام الوثائق', completed: !!applicationInfo.DeliveryDate },
      ];
      setProgress(progressSteps);

    }).catch(err => {
      console.error('Error fetching order:', err);
    });

    // Fetch options for selects
    fetchClients();
    fetchHomemaids();
  }, [id]);

  const fetchClients = async () => {
    try {
      const response = await axios.get("/api/autocomplete/clients");
      setClients(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchHomemaids = async () => {
    try {
      const response = await axios.get("/api/autocomplete/homemaids");
      setHomemaids(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching homemaids:', error);
    }
  };

  const clientOptions = clients.map(client => ({
    value: client.id,
    label: client.fullname,
  }));

  const homemaidOptions = homemaids.map(homemaid => ({
    value: homemaid.id,
    label: homemaid.Name,
  }));

  const handleClientSelect = (selectedOption) => {
    if (selectedOption) {
      const selectedClient = clients.find(c => c.id === selectedOption.value);
      setFormData(prev => ({
        ...prev,
        clientID: selectedOption.value,
        ClientName: selectedClient?.fullname || '',
        PhoneNumber: selectedClient?.phonenumber || '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        clientID: '',
        ClientName: '',
        PhoneNumber: '',
      }));
    }
  };

  const handleHomemaidSelect = (selectedOption) => {
    if (selectedOption) {
      const selectedHomemaid = homemaids.find(h => h.id === selectedOption.value);
      setFormData(prev => ({
        ...prev,
        HomemaidId: selectedOption.value,
        Nationalitycopy: selectedHomemaid?.office?.Country || selectedHomemaid?.nationality || '',
        Religion: selectedHomemaid?.religion || '', // Now we can populate if available
        age: selectedHomemaid?.age || 0,
        ExperienceYears: selectedHomemaid?.experienceYears || 0,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        HomemaidId: '',
        Nationalitycopy: '',
        Religion: '',
        age: 0,
        ExperienceYears: 0,
      }));
    }
  };

  const handleFileChange = async (e, fileId) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setFileUploaded(prev => ({ ...prev, [fileId]: false }));
      return;
    }
    const file = files[0];
    if (!allowedFileTypes.includes(file.type)) {
      setFileUploaded(prev => ({ ...prev, [fileId]: false }));
      return;
    }
    try {
      const res = await fetch(`/api/upload-presigned-url/${fileId}`);
      if (!res.ok) throw new Error('فشل في الحصول على رابط الرفع');
      const { url, filePath } = await res.json();
      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type, 'x-amz-acl': 'public-read' },
      });
      if (!uploadRes.ok) throw new Error('فشل في رفع الملف');
      setFormData(prev => ({ ...prev, [fileId]: filePath }));
      setFileUploaded(prev => ({ ...prev, [fileId]: true }));
      fileInputRefs[fileId].current.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientID) newErrors.clientID = 'اختيار العميل مطلوب';
    if (!formData.HomemaidId) newErrors.HomemaidId = 'اختيار العاملة مطلوب';
    if (!formData.PaymentMethod) newErrors.PaymentMethod = 'طريقة الدفع مطلوبة';
    if (!formData.Total || formData.Total <= 0) newErrors.Total = 'المبلغ الكامل مطلوب ويجب أن يكون أكبر من صفر';
    if (!formData.Paid || formData.Paid < 0) newErrors.Paid = 'المبلغ المدفوع يجب أن يكون غير سالب';
    if (formData.Paid > formData.Total) newErrors.Paid = 'المبلغ المدفوع لا يمكن أن يتجاوز المبلغ الكلي';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await axios.put(`/api/submitneworderbyspecs`, { 
        ...formData, 
        orderId: id,
        // Include any other non-form data if needed
        applicationDate: formData.applicationDate,
        applicationTime: formData.applicationTime,
      });
      router.push('/admin/neworders');
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const ProgressBar = () => (
    <div className="mb-8">
      <h2 className="text-base font-normal mb-4">حالة الطلب</h2>
      <div className="flex justify-between items-center">
        {progress.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.completed ? 'bg-teal-900 text-white' : 'bg-gray-300 text-gray-600'}`}>
              {step.completed ? '✓' : index + 1}
            </div>
            <span className="text-sm mt-2">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Layout>
      <Head>
        <title>تعديل الطلب - قائمة العاملات المتاحة</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className={`text-gray-800 ${Style["tajawal-regular"]}`}>
        <div className="p-6 bg-gray-100 min-h-screen">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-normal text-right">تعديل الطلب - قائمة العاملات المتاحة</h1>
            <button onClick={() => router.push('/admin/requests')} className="p-2 text-gray-600 hover:text-gray-800">
              <X className="w-6 h-6" />
            </button>
          </div>

          <ProgressBar />

          <form onSubmit={onSubmit} className="bg-white border border-gray-300 p-10 rounded">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">

       <div className="flex flex-col gap-2">
                <label className="text-base">اسم العميل</label>
                <input
                  value={formData.ClientName}
                  readOnly
                  className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
                />
              </div>

              {/* رقم العميل */}
              <div className="flex flex-col gap-2">
                <label className="text-base">رقم العميل</label>
                <input
                  value={formData.PhoneNumber}
                  readOnly
                  className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
                />
              </div>

              {/* مدينة العميل (إضافة جديدة) */}
              <div className="flex flex-col gap-2">
                <label className="text-base">مدينة العميل</label>
                <input
                  type="text"
                  placeholder="مدينة العميل"
                  className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
                  disabled
                />
              </div>

              {/* اسم العاملة */}
              <div className="flex flex-col gap-2">
                <label className="text-base">اسم العاملة</label>
                <Select
                  options={homemaidOptions}
                  onChange={handleHomemaidSelect}
                  placeholder="اختر عاملة"
                  className="text-right"
                  value={homemaidOptions.find(option => option.value === formData.HomemaidId) || null}
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
                {errors.HomemaidId && <p className="text-red-500 text-xs mt-1">{errors.HomemaidId}</p>}
              </div>

              {/* رقم العاملة */}
              <div className="flex flex-col gap-2">
                <label className="text-base">رقم العاملة</label>
                <input
                  value={formData.HomemaidId}
                  readOnly
                  className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
                />
              </div>

              {/* جنسية العاملة */}
              <div className="flex flex-col gap-2">
                <label className="text-base">جنسية العاملة</label>
                <input
                  value={formData.Nationalitycopy}
                  readOnly
                  className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
                />
              </div>

              {/* ديانة العاملة */}
              <div className="flex flex-col gap-2">
                <label className="text-base">ديانة العاملة</label>
                <input
                  value={formData.Religion}
                  readOnly
                  className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
                />
              </div>

              {/* العمر */}
              <div className="flex flex-col gap-2">
                <label className="text-base">العمر</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                  className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
                />
                {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
              </div>

              {/* سنوات الخبرة */}
              <div className="flex flex-col gap-2">
                <label className="text-base">سنوات الخبرة</label>
                <input
                  type="number"
                  value={formData.ExperienceYears}
                  onChange={(e) => setFormData(prev => ({ ...prev, ExperienceYears: parseInt(e.target.value) || 0 }))}
                  className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
                />
                {errors.ExperienceYears && <p className="text-red-500 text-xs mt-1">{errors.ExperienceYears}</p>}
              </div>

              {/* ملاحظات إضافية */}
              <div className="flex flex-col gap-2">
                <label className="text-base">ملاحظات إضافية</label>
                <input
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="ادخل أي ملاحظات أو بيانات أخرى ..."
                  className="border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
                />
              </div>

            </div>

            {/* طريقة الدفع */}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, PaymentMethod: e.target.value }))}
                      className="hidden"
                    />
                    <span className={`text-xl ${formData.PaymentMethod === option ? 'text-teal-900' : 'text-teal-800'}`}>
                      {option}
                    </span>
                    {icon}
                  </label>
                ))}
              </div>
              {errors.PaymentMethod && <p className="text-red-500 text-xs mt-2">{errors.PaymentMethod}</p>}
            </div>

            {/* المبالغ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              <div className="flex flex-col gap-2">
                <label className="text-base">المبلغ كامل</label>
                <input
                  type="number"
                  value={formData.Total}
                  onChange={(e) => setFormData(prev => ({ ...prev, Total: parseFloat(e.target.value) || 0 }))}
                  className={`bg-gray-50 border ${errors.Total ? 'border-red-500' : 'border-gray-300'} rounded p-3 text-base text-gray-500 text-right`}
                />
                {errors.Total && <p className="text-red-500 text-xs mt-1">{errors.Total}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-base">المبلغ المدفوع</label>
                <input
                  type="number"
                  value={formData.Paid}
                  onChange={(e) => setFormData(prev => ({ ...prev, Paid: parseFloat(e.target.value) || 0 }))}
                  className={`bg-gray-50 border ${errors.Paid ? 'border-red-500' : 'border-gray-300'} rounded p-3 text-base text-gray-500 text-right`}
                />
                {errors.Paid && <p className="text-red-500 text-xs mt-1">{errors.Paid}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-base">المبلغ المتبقي</label>
                <input
                  value={`${(formData.Total - formData.Paid || 0).toFixed(2)} SR`}
                  readOnly
                  className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
                />
              </div>
            </div>

            {/* رفع الملفات */}
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
                        <a href={formData[file.id]} target="_blank" rel="noopener noreferrer" className="text-teal-800 hover:underline">
                          فتح الملف
                        </a>
                      ) : (
                        'إرفاق ملف'
                      )}
                    </span>
                    <input
                      type="file"
                      id={file.id}
                      ref={fileInputRefs[file.id]}
                      className="hidden"
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={(e) => handleFileChange(e, file.id)}
                    />
                    <button
                      type="button"
                      className="bg-teal-900 text-white px-3 py-1 rounded text-sm hover:bg-teal-800 transition duration-200"
                      onClick={() => fileInputRefs[file.id].current?.click()}
                    >
                      اختيار ملف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* أزرار الحفظ والإلغاء */}
            <div className="flex gap-6 flex-col sm:flex-row">
              <button type="submit" className="bg-teal-900 text-white px-4 py-2 rounded w-full sm:w-40 hover:bg-teal-800 transition duration-200">حفظ</button>
              <button type="button" onClick={() => router.push('/admin/requests')} className="bg-gray-100 text-gray-800 border-2 border-teal-800 px-4 py-2 rounded w-full sm:w-40 hover:bg-gray-200 transition duration-200">إلغاء</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}