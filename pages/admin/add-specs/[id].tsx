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
import { jwtDecode } from 'jwt-decode';
import { useForm } from 'react-hook-form';

export default function TrackOrderPage() {
  const router = useRouter();
  const { id } = router.query;
  const { register, handleSubmit, setValue, formState: { errors }, watch, reset } = useForm({
    defaultValues: {
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
      bookingStatus: 'new_order',
      applicationDate: '',
      applicationTime: '',
    },
  });

  const [clients, setClients] = useState([]);
  const [fileUploaded, setFileUploaded] = useState({ orderDocument: false, contract: false });
  const [progress, setProgress] = useState([]);
  const fileInputRefs = { orderDocument: useRef(null), contract: useRef(null) };
  const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];

  // Fetch order data
  useEffect(() => {
    if (id) {
      axios.get(`/api/track_order/${id}`).then(res => {
        const data = res.data;
        // Clear previous values
        reset();
        // Set values based on data structure
        if (data.clientInfo) {
          // Note: clientInfo.id is not present in the provided JSON, so clientID remains empty
          // If you have a client ID, adjust accordingly
          setValue('ClientName', data.clientInfo.name || '');
          setValue('PhoneNumber', data.clientInfo.phone || '');
        }
        if (data.homemaidInfo) {
          setValue('Nationalitycopy', data.homemaidInfo.nationality || '');
          // Religion, age, experienceYears not in JSON, remain default
          setValue('Religion', data.homemaidInfo.religion || '');
          setValue('age', data.homemaidInfo.age || 0);
          setValue('ExperienceYears', data.homemaidInfo.experienceYears || 0);
          // Optionally set notes with homemaid details if needed
          const homemaidNotes = `اسم العاملة: ${data.homemaidInfo.name || ''}, جواز السفر: ${data.homemaidInfo.passportNumber || ''}, المكتب الخارجي: ${data.homemaidInfo.externalOffice || ''}`;
          setValue('notes', homemaidNotes);
        }
        if (data.applicationInfo) {
          setValue('applicationDate', data.applicationInfo.applicationDate || '');
          setValue('applicationTime', data.applicationInfo.applicationTime || '');
        }
        setValue('bookingStatus', data.bookingStatus || 'new_order');
        // Note: nationality top-level duplicates homemaidInfo.nationality, using the latter
        // Calculate progress based on API response
        const progressSteps = [
          { label: 'طلب جديد', completed: data.bookingStatus === 'new_order' },
          { label: 'الفحص الطبي', completed: data.medicalCheck?.passed || false },
          { label: 'موافقة السفارة', completed: data.saudiEmbassyApproval?.approved || false },
          { label: 'إصدار التأشيرة', completed: data.visaIssuance?.issued || false },
          { label: 'إصدار تصريح السفر', completed: data.travelPermit?.issued || false },
          { label: 'استلام الوثائق', completed: data.receipt?.received || false },
        ];
        setProgress(progressSteps);
      }).catch(err => {
        console.error('Error fetching order:', err);
      });
      fetchClients();
    }
  }, [id, setValue, reset]);

  const fetchClients = async () => {
    try {
      const response = await axios.get("/api/autocomplete/clients");
      setClients(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const clientOptions = clients.map(client => ({
    value: client.id,
    label: client.fullname,
  }));

  const handleFileChange = async (e, fileId) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setFileUploaded((prev) => ({ ...prev, [fileId]: false }));
      return;
    }
    const file = files[0];
    if (!allowedFileTypes.includes(file.type)) {
      setFileUploaded((prev) => ({ ...prev, [fileId]: false }));
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
      setValue(fileId, filePath);
      setFileUploaded((prev) => ({ ...prev, [fileId]: true }));
      fileInputRefs[fileId].current.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const onSubmit = async (data) => {
    try {
      await axios.put(`/api/submitneworderbyspecs`, {...data,orderId:id});
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
        <title>تتبع الطلب</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className={`text-gray-800 ${Style["tajawal-regular"]}`}>
        <div className="p-6 bg-gray-100 min-h-screen">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-normal text-right">تتبع الطلب</h1>
            <button onClick={() => router.push('/admin/requests')} className="p-2 text-gray-600 hover:text-gray-800">
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-300 p-10 rounded">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
              <div className="flex flex-col gap-2">
                <label className="text-base">اسم العميل</label>
                <input
                  {...register('ClientName')}
                  readOnly
                  className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
                />
                {errors.ClientName && <p className="text-red-500 text-xs mt-1">{errors.ClientName.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-base">رقم العميل</label>
                <input
                  {...register('PhoneNumber')}
                  readOnly
                  className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-base">تاريخ الطلب</label>
                <input
                  {...register('applicationDate')}
                  readOnly
                  className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-base">جنسية العاملة المطلوبة</label>
                <input
                  {...register('Nationalitycopy')}
                  readOnly
                  className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-base">الديانة</label>
                <input
                  {...register('Religion')}
                  className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-base">العمر</label>
                <input
                  type="number"
                  {...register('age')}
                  className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-base">سنوات الخبرة</label>
                <input
                  type="number"
                  {...register('ExperienceYears')}
                  className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-base">ملاحظات إضافية</label>
                <input
                  {...register('notes')}
                  placeholder="ادخل أي ملاحظات أو بيانات أخرى ..."
                  className="border border-gray-300 rounded p-3 text-base text-gray-500 text-right"
                />
              </div>
            </div>
            <div className="mb-10">
              <h2 className="text-base font-normal mb-2">طريقة الدفع المختارة</h2>
              <div className="flex flex-wrap gap-6 justify-center">
                {[
                  { option: 'كاش', icon: <CashIcon className={`w-6 h-6 ${watch('PaymentMethod') === 'كاش' ? 'text-teal-800' : 'text-gray-400'}`} /> },
                  { option: 'دفعتين', icon: <CreditCardIcon className={`w-6 h-6 ${watch('PaymentMethod') === 'دفعتين' ? 'text-teal-800' : 'text-gray-400'}`} /> },
                  { option: 'ثلاثة دفعات', icon: <CurrencyDollarIcon className={`w-6 h-6 ${watch('PaymentMethod') === 'ثلاثة دفعات' ? 'text-teal-800' : 'text-gray-400'}`} /> },
                ].map(({ option, icon }, index) => (
                  <label
                    key={index}
                    className={`flex items-center gap-3 p-3 border-2 rounded cursor-pointer w-60 ${
                      watch('PaymentMethod') === option ? 'border-teal-900 bg-teal-100' : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      {...register('PaymentMethod')}
                      value={option}
                      className="hidden"
                    />
                    <span className={`text-xl ${watch('PaymentMethod') === option ? 'text-teal-900' : 'text-teal-800'}`}>
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
                  {...register('Total', { required: 'المبلغ كامل مطلوب', min: { value: 0, message: 'يجب أن يكون المبلغ إيجابيًا' } })}
                  className={`bg-gray-50 border ${errors.Total ? 'border-red-500' : 'border-gray-300'} rounded p-3 text-base text-gray-500 text-right`}
                />
                {errors.Total && <p className="text-red-500 text-xs mt-1">{errors.Total.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-base">المبلغ المدفوع</label>
                <input
                  type="number"
                  {...register('Paid', { required: 'المبلغ المدفوع مطلوب', min: { value: 0, message: 'يجب أن يكون المبلغ غير سالب' } })}
                  className={`bg-gray-50 border ${errors.Paid ? 'border-red-500' : 'border-gray-300'} rounded p-3 text-base text-gray-500 text-right`}
                />
                {errors.Paid && <p className="text-red-500 text-xs mt-1">{errors.Paid.message}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-base">المبلغ المتبقي</label>
                <input
                  value={`${(watch('Total') - watch('Paid') || 0).toFixed(2)} SR`}
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
                        <a href={watch(file.id)} target="_blank" rel="noopener noreferrer" className="text-teal-800 hover:underline">
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
                      onClick={() => fileInputRefs[file.id].current.click()}
                    >
                      اختيار ملف
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-6 flex-col sm:flex-row">
              <button type="submit" className="bg-teal-900 text-white px-4 py-2 rounded w-full sm:w-40 hover:bg-teal-800 transition duration-200">حفظ</button>
              <button type="button" onClick={() => router.push('/admin/neworders')} className="bg-gray-100 text-gray-800 border-2 border-teal-800 px-4 py-2 rounded w-full sm:w-40 hover:bg-gray-200 transition duration-200">إلغاء</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}