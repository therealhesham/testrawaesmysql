import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FaUser, FaGraduationCap, FaBriefcase, FaTools, FaDollarSign, FaFileAlt, FaMagic } from 'react-icons/fa';
import { Calendar } from 'lucide-react';
import Layout from 'example/containers/Layout';
import Style from 'styles/Home.module.css';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';
import jsPDF from 'jspdf';

interface Props {
  error?: string;
}

const AddWorkerForm: React.FC<Props> = ({ error }) => {
  const router = useRouter();
  const [offices, setOffices] = useState<Array<{ office: string }>>([]);
  const [fileNames, setFileNames] = useState<{ [key: string]: string }>({
  travelTicket: '',
  passportcopy: '',
});
  const [formData, setFormData] = useState({
    name: '',
    religion: '',
    nationality: '',
    maritalStatus: '',
    age: '',
    passport: '',
    mobile: '',
    passportStart: '',
    passportEnd: '',
    educationLevel: '',
    arabicLevel: '',
    englishLevel: '',
    experienceField: '',
    experienceYears: '',
    salary: '',
    officeName: '',
    cookingLevel: '',
    washingLevel: '',
    ironingLevel: '',
    cleaningLevel: '',
    sewingLevel: '',
    childcareLevel: '',
    elderlycareLevel: '',
    skills: {
      washing: '',
      ironing: '',
      cleaning: '',
      cooking: '',
      sewing: '',
      childcare: '',
      elderlycare: '',
    },
    travelTicket: '',
    passportcopy: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [fileUploaded, setFileUploaded] = useState<{ [key: string]: boolean }>({
    travelTicket: false,
    passportcopy: false,
  });
  const [showModal, setShowModal] = useState(!!error);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRefs = {
    travelTicket: useRef<HTMLInputElement>(null),
    passportcopy: useRef<HTMLInputElement>(null),
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: '' }));
  };

  const handleSkillChange = (skill: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: { ...prev.skills, [skill]: value },
    }));
    setErrors((prev) => ({ ...prev, [`skill-${skill}`]: '' }));
  };

  const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];

 const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileId: string) => {
  const files = e.target.files;
  if (!files || files.length === 0) {
    setErrors((prev) => ({ ...prev, [fileId]: 'لم يتم اختيار ملف' }));
    setFileUploaded((prev) => ({ ...prev, [fileId]: false }));
    setFileNames((prev) => ({ ...prev, [fileId]: '' }));
    return;
  }

  const file = files[0];
  if (!allowedFileTypes.includes(file.type)) {
    setErrors((prev) => ({ ...prev, [fileId]: 'نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)' }));
    setFileUploaded((prev) => ({ ...prev, [fileId]: false }));
    setFileNames((prev) => ({ ...prev, [fileId]: '' }));
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
    setFileNames((prev) => ({ ...prev, [fileId]: file.name })); // تخزين اسم الملف

    const ref = fileInputRefs[fileId as keyof typeof fileInputRefs];
    if (ref && ref.current) {
      ref.current.value = '';
    }
  } catch (error: any) {
    console.error('Error uploading file:', error);
    setErrors((prev) => ({ ...prev, [fileId]: error.message || 'حدث خطأ أثناء رفع الملف' }));
    setFileUploaded((prev) => ({ ...prev, [fileId]: false }));
    setFileNames((prev) => ({ ...prev, [fileId]: '' }));
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

  const generatePDF = async () => {
    const doc = new jsPDF();
    try {
          // تحميل خط Amiri بشكل صحيح
      const response = await fetch('/fonts/Amiri-Regular.ttf');
      if (!response.ok) throw new Error('Failed to fetch font');
      const fontBuffer = await response.arrayBuffer();
      const fontBytes = new Uint8Array(fontBuffer);
      const fontBase64 = Buffer.from(fontBytes).toString('base64');
      doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
      doc.setFont('Amiri', 'normal');
    } catch (error) {
      console.error('Error loading Amiri font:', error);
      setModalMessage('خطأ في تحميل الخط العربي');
      setShowErrorModal(true);
      return;
    }
    doc.setFontSize(12);
    
    doc.text('بيانات العاملة', 190, 10, { align: 'right' });
    doc.text(`الاسم: ${formData.name}`, 190, 20, { align: 'right' });
    doc.text(`الجنسية: ${formData.nationality}`, 190, 30, { align: 'right' });
    doc.text(`الديانة: ${formData.religion}`, 190, 40, { align: 'right' });
    doc.text(`الحالة الاجتماعية: ${formData.maritalStatus}`, 190, 50, { align: 'right' });
    doc.text(`تاريخ الميلاد: ${formData.age}`, 190, 60, { align: 'right' });
    doc.text(`رقم الجواز: ${formData.passport}`, 190, 70, { align: 'right' });
    doc.text(`رقم الجوال: ${formData.mobile}`, 190, 80, { align: 'right' });
    doc.text(`بداية الجواز: ${formData.passportStart}`, 190, 90, { align: 'right' });
    doc.text(`نهاية الجواز: ${formData.passportEnd}`, 190, 100, { align: 'right' });
    doc.text(`مستوى التعليم: ${formData.educationLevel}`, 190, 110, { align: 'right' });
    doc.text(`اللغة العربية: ${formData.arabicLevel}`, 190, 120, { align: 'right' });
    doc.text(`اللغة الإنجليزية: ${formData.englishLevel}`, 190, 130, { align: 'right' });
    doc.text(`الخبرة: ${formData.experienceField}`, 190, 140, { align: 'right' });
    doc.text(`سنوات الخبرة: ${formData.experienceYears}`, 190, 150, { align: 'right' });
    doc.text(`الراتب: ${formData.salary}`, 190, 160, { align: 'right' });
    doc.text(`اسم المكتب: ${formData.officeName}`, 190, 170, { align: 'right' });
    doc.text(`مهارات الطبخ: ${formData.cookingLevel}`, 190, 180, { align: 'right' });
    doc.text(`مهارات الغسيل: ${formData.washingLevel}`, 190, 190, { align: 'right' });
    doc.text(`مهارات الكوي: ${formData.ironingLevel}`, 190, 200, { align: 'right' });
    doc.text(`مهارات التنظيف: ${formData.cleaningLevel}`, 190, 210, { align: 'right' });
    doc.text(`مهارات الخياطة: ${formData.sewingLevel}`, 190, 220, { align: 'right' });
    doc.text(`مهارات العناية بالأطفال: ${formData.childcareLevel}`, 190, 230, { align: 'right' });
    doc.text(`مهارات رعاية كبار السن: ${formData.elderlycareLevel}`, 190, 240, { align: 'right' });

    doc.save('worker_details.pdf');
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const today = new Date();

    const requiredFields = [
      { id: 'name', label: 'الاسم' },
      { id: 'religion', label: 'الديانة' },
      { id: 'nationality', label: 'الجنسية' },
      { id: 'maritalStatus', label: 'الحالة الاجتماعية' },
      { id: 'age', label: 'العمر' },
      { id: 'passport', label: 'رقم جواز السفر' },
      { id: 'mobile', label: 'رقم الجوال' },
      { id: 'passportStart', label: 'بداية الجواز' },
      { id: 'passportEnd', label: 'نهاية الجواز' },
      { id: 'educationLevel', label: 'مستوى التعليم' },
      { id: 'officeName', label: 'اسم المكتب' },
      { id: 'salary', label: 'الراتب' },
      { id: 'cookingLevel', label: 'الطبخ' },
      { id: 'washingLevel', label: 'الغسيل' },
      { id: 'ironingLevel', label: 'الكوي' },
      { id: 'cleaningLevel', label: 'التنظيف' },
      { id: 'sewingLevel', label: 'الخياطة' },
      { id: 'childcareLevel', label: 'العناية بالأطفال' },
      { id: 'elderlycareLevel', label: 'رعاية كبار السن' },
    ];

    requiredFields.forEach((field) => {
      if (!formData[field.id]) {
        newErrors[field.id] = `${field.label} مطلوب`;
      }
    });

    if (formData.name && !/^[a-zA-Z\s\u0600-\u06FF]{2,}$/.test(formData.name)) {
      newErrors.name = 'الاسم يجب أن يحتوي على حروف فقط وأكثر من حرفين';
    }

    if (formData.nationality && !/^[a-zA-Z\s\u0600-\u06FF]+$/.test(formData.nationality)) {
      newErrors.nationality = 'الجنسية يجب أن تحتوي على حروف فقط';
    }

    if (formData.passport) {
      if (!/^[a-zA-Z0-9]{6,20}$/.test(formData.passport)) {
        newErrors.passport = 'رقم جواز السفر يجب أن يكون بين 6-20 حرفًا ورقمًا';
      } else if (!/[a-zA-Z]/.test(formData.passport) || !/[0-9]/.test(formData.passport)) {
        newErrors.passport = 'رقم جواز السفر يجب أن يحتوي على حروف وأرقام';
      }
    }

    if (formData.mobile && !/^\d{10,15}$/.test(formData.mobile)) {
      newErrors.mobile = 'رقم الجوال يجب أن يحتوي على 10-15 رقمًا';
    }

    if (formData.age) {
      const ageDate = new Date(formData.age);
      let age = today.getFullYear() - ageDate.getFullYear();
      const monthDiff = today.getMonth() - ageDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < ageDate.getDate())) {
        age--;
      }
      if (age < 16 || age > 100) {
        newErrors.age = 'العمر يجب أن يكون بين 16 و100 سنة';
      }
    }

    if (formData.passportStart && formData.passportEnd) {
      const startDate = new Date(formData.passportStart);
      const endDate = new Date(formData.passportEnd);
      if (startDate >= endDate) {
        newErrors.passportEnd = 'تاريخ نهاية الجواز يجب أن يكون بعد تاريخ البداية';
      }
      if (endDate < today) {
        newErrors.passportEnd = 'جواز السفر منتهي الصلاحية';
      }
    }

    if (formData.salary && (isNaN(Number(formData.salary)) || Number(formData.salary) <= 0)) {
      newErrors.salary = 'الراتب يجب أن يكون رقمًا إيجابيًا';
    }

    if (formData.experienceYears && (isNaN(Number(formData.experienceYears)) || Number(formData.experienceYears) < 0)) {
      newErrors.experienceYears = 'سنوات الخبرة يجب أن تكون رقمًا غير سالب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchOffices = async () => {
    try {
      const response = await fetch('/api/office_list');
      const data = await response.json();
      setOffices(data.finder || []);
    } catch (error) {
      console.error('Error fetching offices:', error);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setModalMessage('يرجى تصحيح الأخطاء في النموذج قبل الإرسال');
      setShowErrorModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/newhomemaids', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('API response:', result);
      setFormData({
        name: '',
        religion: '',
        nationality: '',
        maritalStatus: '',
        age: '',
        passport: '',
        mobile: '',
        passportStart: '',
        passportEnd: '',
        educationLevel: '',
        arabicLevel: '',
        englishLevel: '',
        experienceField: '',
        experienceYears: '',
        salary: '',
        officeName: '',
        cookingLevel: '',
        washingLevel: '',
        ironingLevel: '',
        cleaningLevel: '',
        sewingLevel: '',
        childcareLevel: '',
        elderlycareLevel: '',
        skills: {
          washing: '',
          ironing: '',
          cleaning: '',
          cooking: '',
          sewing: '',
          childcare: '',
          elderlycare: '',
        },
        travelTicket: '',
        passportcopy: '',
      });
      setFileUploaded({
        travelTicket: false,
        passportcopy: false,
      });
      if (fileInputRefs.travelTicket.current) fileInputRefs.travelTicket.current.value = '';
      if (fileInputRefs.passportcopy.current) fileInputRefs.passportcopy.current.value = '';
      setErrors({});
      setModalMessage('تم إضافة العاملة بنجاح!');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      setModalMessage('حدث خطأ أثناء إرسال البيانات. حاول مرة أخرى.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!error) {
      fetchOffices();
    }
  }, [error]);

  return (
    <Layout>
      <div className={`min-h-screen ${Style['tajawal-regular']}`}>
        <Head>
          <title>إضافة عاملة</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        {/* Loading Modal */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center">
              <svg
                className="animate-spin h-8 w-8 text-teal-800"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 1 1 8 8 8 8 0 0 1-8-8z"
                ></path>
              </svg>
              <span className="mr-4 text-lg font-semibold text-teal-800">
                جاري الإرسال...
              </span>
            </div>
          </div>
        )}

        {showModal && error && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-4">خطأ</h2>
              <p className="text-gray-700 mb-6">{error}</p>
              <button
                className="bg-teal-800 text-white px-4 py-2 rounded-md"
                onClick={() => (window.location.href = '/admin/home')}
              >
                العودة إلى الصفحة الرئيسية
              </button>
            </div>
          </div>
        )}
   
        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-green-600 mb-4">نجح!</h2>
              <p className="text-gray-700 mb-6">{modalMessage}</p>
              <button
                className="bg-teal-800 text-white px-4 py-2 rounded-md hover:bg-teal-900"
                onClick={() => setShowSuccessModal(false)}
              >
                موافق
              </button>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-red-600 mb-4">خطأ</h2>
              <p className="text-gray-700 mb-6">{modalMessage}</p>
              <button
                className="bg-teal-800 text-white px-4 py-2 rounded-md hover:bg-teal-900"
                onClick={() => setShowErrorModal(false)}
              >
                موافق
              </button>
            </div>
          </div>
        )}
        {!error && (
          <main className="p-7 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-normal text-black">إضافة عاملة</h1>
              <button
                type="button"
                onClick={() => router.push('/admin/pdf-processor')}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md"
              >
                <FaMagic className="w-5 h-5" />
                <span>إضافة عاملة بالذكاء الاصطناعي</span>
              </button>
            </div>
            <section className="mb-12">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                {[
                  { label: 'المعلومات الشخصية', icon: <FaUser /> },
                  { label: 'التعليم', icon: <FaGraduationCap /> },
                  { label: 'الخبرة', icon: <FaBriefcase /> },
                  { label: 'المهارات', icon: <FaTools /> },
                  { label: 'الراتب والمكتب', icon: <FaDollarSign /> },
                  { label: 'الملفات', icon: <FaFileAlt /> },
                ].map((step, index) => (
                  <div key={index} className="flex items-center w-full sm:w-auto mb-4 sm:mb-0">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-800 text-white text-lg font-semibold">
                        {index + 1}
                      </div>
                      <div className="mr-4 text-gray-700">
                        <p className="text-sm font-medium">{step.label}</p>
                      </div>
                    </div>
                    {index < 5 && (
                      <div className="hidden sm:block flex-1 h-1 bg-gray-300 mx-4"></div>
                    )}
                  </div>
                ))}
              </div>
            </section>
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
<div className="flex justify-end gap-4">
             <button
  type="button"
  className="bg-teal-800 text-white text-sm px-4 py-2 rounded-md"
  onClick={() => {
    setFormData({
      name: '',
      religion: '',
      nationality: '',
      maritalStatus: '',
      age: '',
      passport: '',
      mobile: '',
      passportStart: '',
      passportEnd: '',
      educationLevel: '',
      arabicLevel: '',
      englishLevel: '',
      experienceField: '',
      experienceYears: '',
      salary: '',
      officeName: '',
      cookingLevel: '',
      washingLevel: '',
      ironingLevel: '',
      cleaningLevel: '',
      sewingLevel: '',
      childcareLevel: '',
      elderlycareLevel: '',
      skills: {
        washing: '',
        ironing: '',
        cleaning: '',
        cooking: '',
        sewing: '',
        childcare: '',
        elderlycare: '',
      },
      travelTicket: '',
      passportcopy: '',
    });
    setFileUploaded({
      travelTicket: false,
      passportcopy: false,
    });
    setFileNames({
      travelTicket: '',
      passportcopy: '',
    });
    if (fileInputRefs.travelTicket.current) fileInputRefs.travelTicket.current.value = '';
    if (fileInputRefs.passportcopy.current) fileInputRefs.passportcopy.current.value = '';
    setErrors({});
  }}
>
  إعادة ضبط
</button>
                  <button
                    type="button"
                    className="bg-teal-800 text-white text-sm px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? 'جاري الإرسال...' : 'إضافة العاملة'}
                  </button>
                </div>     

              <form className="space-y-6" dir="rtl" onSubmit={(e) => e.preventDefault()}>
                <fieldset>
                  <legend className="text-2xl font-normal text-center text-black mb-6">المعلومات الشخصية</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col">
                      <label htmlFor="name" className="text-gray-500 text-sm mb-1">الاسم</label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="أدخل الاسم"
                        className={`border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 text-sm bg-gray-50 text-right`}
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="religion" className="text-gray-500 text-sm mb-1">الديانة</label>
                      <select
                        id="religion"
                        value={formData.religion}
                        onChange={handleChange}
                        className={`border ${errors.religion ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                      >
                        <option value="" disabled>اختر الديانة</option>
                        <option value="muslim">مسلمة</option>
                        <option value="christian">مسيحية</option>
                        <option value="other">أخرى</option>
                      </select>
                      {errors.religion && <p className="text-red-500 text-xs mt-1">{errors.religion}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="nationality" className="text-gray-500 text-sm mb-1">الجنسية</label>
                      <input
                        type="text"
                        id="nationality"
                        value={formData.nationality}
                        onChange={handleChange}
                        placeholder="أدخل الجنسية"
                        className={`border ${errors.nationality ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                      />
                      {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="maritalStatus" className="text-gray-500 text-sm mb-1">الحالة الاجتماعية</label>
                      <select
                        id="maritalStatus"
                        value={formData.maritalStatus}
                        onChange={handleChange}
                        className={`border ${errors.maritalStatus ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                      >
                        <option value="" disabled>اختر الحالة</option>
                        <option value="single">عزباء</option>
                        <option value="married">متزوجة</option>
                        <option value="divorced">مطلقة</option>
                      </select>
                      {errors.maritalStatus && <p className="text-red-500 text-xs mt-1">{errors.maritalStatus}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="age" className="text-gray-500 text-sm mb-1">تاريخ الميلاد</label>
                      <input
                        type="date"
                        id="age"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="أدخل العمر"
                        className={`border ${errors.age ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                      />
                      {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="passport" className="text-gray-500 text-sm mb-1">رقم جواز السفر</label>
                      <input
                        type="text"
                        id="passport"
                        value={formData.passport}
                        onChange={handleChange}
                        placeholder="أدخل رقم الجواز"
                        className={`border ${errors.passport ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                      />
                      {errors.passport && <p className="text-red-500 text-xs mt-1">{errors.passport}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="mobile" className="text-gray-500 text-sm mb-1">رقم الجوال</label>
                      <input
                        type="tel"
                        id="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="أدخل رقم الجوال"
                        className={`border ${errors.mobile ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                      />
                      {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="passportStart" className="text-gray-500 text-sm mb-1">بداية الجواز</label>
                      <div className="relative">
                        <input
                          type="date"
                          id="passportStart"
                          value={formData.passportStart}
                          onChange={handleChange}
                          className={`border ${errors.passportStart ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right w-full`}
                        />
                        <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      </div>
                      {errors.passportStart && <p className="text-red-500 text-xs mt-1">{errors.passportStart}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="passportEnd" className="text-gray-500 text-sm mb-1">نهاية الجواز</label>
                      <div className="relative">
                        <input
                          type="date"
                          id="passportEnd"
                          value={formData.passportEnd}
                          onChange={handleChange}
                          className={`border ${errors.passportEnd ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right w-full`}
                        />
                        <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      </div>
                      {errors.passportEnd && <p className="text-red-500 text-xs mt-1">{errors.passportEnd}</p>}
                    </div>
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-2xl font-normal text-center text-black mb-6">التعليم</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col">
                      <label htmlFor="educationLevel" className="text-gray-500 text-sm mb-1">مستوى التعليم</label>
                      <select
                        id="educationLevel"
                        value={formData.educationLevel}
                        onChange={handleChange}
                        className={`border ${errors.educationLevel ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                      >
                        <option value="" disabled>اختر مستوى التعليم</option>
                        <option value="secondary">ثانوي</option>
                        <option value="university">جامعي</option>
                        <option value="diploma">دبلوم</option>
                      </select>
                      {errors.educationLevel && <p className="text-red-500 text-xs mt-1">{errors.educationLevel}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="arabicLevel" className="text-gray-500 text-sm mb-1">اللغة العربية</label>
                      <select
                        id="arabicLevel"
                        value={formData.arabicLevel}
                        onChange={handleChange}
                        className={`border ${errors.arabicLevel ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                      >
                        <option value="" disabled>اختر المستوى</option>
                        <option value="beginner">مبتدئ</option>
                        <option value="intermediate">متوسط</option>
                        <option value="advanced">ممتاز</option>
                      </select>
                      {errors.arabicLevel && <p className="text-red-500 text-xs mt-1">{errors.arabicLevel}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="englishLevel" className="text-gray-500 text-sm mb-1">اللغة الإنجليزية</label>
                      <select
                        id="englishLevel"
                        value={formData.englishLevel}
                        onChange={handleChange}
                        className={`border ${errors.englishLevel ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                      >
                        <option value="" disabled>اختر المستوى</option>
                        <option value="beginner">مبتدئ</option>
                        <option value="intermediate">متوسط</option>
                        <option value="advanced">ممتاز</option>
                      </select>
                      {errors.englishLevel && <p className="text-red-500 text-xs mt-1">{errors.englishLevel}</p>}
                    </div>
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-2xl font-normal text-center text-black mb-6">الخبرة</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <label htmlFor="experienceField" className="text-gray-500 text-sm mb-1">الخبرة</label>
                      <input
                        type="text"
                        id="experienceField"
                        value={formData.experienceField}
                        onChange={handleChange}
                        placeholder="أدخل نوع الخبرة"
                        className={`border ${errors.experienceField ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                      />
                      {errors.experienceField && <p className="text-red-500 text-xs mt-1">{errors.experienceField}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="experienceYears" className="text-gray-500 text-sm mb-1">سنوات الخبرة</label>
                      <input
                        type="number"
                        id="experienceYears"
                        value={formData.experienceYears}
                        onChange={handleChange}
                        placeholder="أدخل عدد السنوات"
                        className={`border ${errors.experienceYears ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                      />
                      {errors.experienceYears && <p className="text-red-500 text-xs mt-1">{errors.experienceYears}</p>}
                    </div>
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-2xl font-normal text-center text-black mb-6">المهارات</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col">
                      <label htmlFor='cookingLevel' className="text-gray-500 text-sm mb-1">الطبخ</label>
                      <select
                        id='cookingLevel'
                        value={formData.cookingLevel}
                        onChange={handleChange}
                        className={`border ${errors['cookingLevel'] ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                      >
                        <option value="" disabled>اختر المستوى</option>
                        <option value="trained_no_experience">مدربة بدون خبرة</option>
                        <option value="good">جيد</option>
                        <option value="very_good">جيد جدا</option>
                        <option value="excellent">ممتاز</option>
                      </select>
                      {errors['cookingLevel'] && <p className="text-red-500 text-xs mt-1">{errors['cookingLevel']}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor='washingLevel' className="text-gray-500 text-sm mb-1">الغسيل</label>
                      <select
                        id='washingLevel'
                        value={formData.washingLevel}
                        onChange={handleChange}
                        className={`border ${errors['washingLevel'] ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                      >
                        <option value="" disabled>اختر المستوى</option>
                        <option value="trained_no_experience">مدربة بدون خبرة</option>
                        <option value="good">جيد</option>
                        <option value="very_good">جيد جدا</option>
                        <option value="excellent">ممتاز</option>
                      </select>
                      {errors['washingLevel'] && <p className="text-red-500 text-xs mt-1">{errors['washingLevel']}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor='ironingLevel' className="text-gray-500 text-sm mb-1">الكوي</label>
                      <select
                        id='ironingLevel'
                        value={formData.ironingLevel}
                        onChange={handleChange}
                        className={`border ${errors['ironingLevel'] ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                      >
                        <option value="" disabled>اختر المستوى</option>
                        <option value="trained_no_experience">مدربة بدون خبرة</option>
                        <option value="good">جيد</option>
                        <option value="very_good">جيد جدا</option>
                        <option value="excellent">ممتاز</option>
                      </select>
                      {errors['ironingLevel'] && <p className="text-red-500 text-xs mt-1">{errors['ironingLevel']}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor='cleaningLevel' className="text-gray-500 text-sm mb-1">التنظيف</label>
                      <select
                        id='cleaningLevel'
                        value={formData.cleaningLevel}
                        onChange={handleChange}
                        className={`border ${errors['cleaningLevel'] ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                      >
                        <option value="" disabled>اختر المستوى</option>
                        <option value="trained_no_experience">مدربة بدون خبرة</option>
                        <option value="good">جيد</option>
                        <option value="very_good">جيد جدا</option>
                        <option value="excellent">ممتاز</option>
                      </select>
                      {errors['cleaningLevel'] && <p className="text-red-500 text-xs mt-1">{errors['cleaningLevel']}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor='sewingLevel' className="text-gray-500 text-sm mb-1">الخياطة</label>
                      <select
                        id='sewingLevel'
                        value={formData.sewingLevel}
                        onChange={handleChange}
                        className={`border ${errors['sewingLevel'] ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                      >
                        <option value="" disabled>اختر المستوى</option>
                        <option value="trained_no_experience">مدربة بدون خبرة</option>
                        <option value="good">جيد</option>
                        <option value="very_good">جيد جدا</option>
                        <option value="excellent">ممتاز</option>
                      </select>
                      {errors['sewingLevel'] && <p className="text-red-500 text-xs mt-1">{errors['sewingLevel']}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor='elderlycareLevel' className="text-gray-500 text-sm mb-1">رعاية كبار السن</label>
                      <select
                        id='elderlycareLevel'
                        value={formData.elderlycareLevel}
                        onChange={handleChange}
                        className={`border ${errors['elderlycareLevel'] ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                      >
                        <option value="" disabled>اختر المستوى</option>
                        <option value="trained_no_experience">مدربة بدون خبرة</option>
                        <option value="good">جيد</option>
                        <option value="very_good">جيد جدا</option>
                        <option value="excellent">ممتاز</option>
                      </select>
                      {errors['elderlycareLevel'] && <p className="text-red-500 text-xs mt-1">{errors['elderlycareLevel']}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor='childcareLevel' className="text-gray-500 text-sm mb-1">العناية بالأطفال</label>
                      <select
                        id='childcareLevel'
                        value={formData.childcareLevel}
                        onChange={handleChange}
                        className={`border ${errors['childcareLevel'] ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                      >
                        <option value="" disabled>اختر المستوى</option>
                        <option value="trained_no_experience">مدربة بدون خبرة</option>
                        <option value="good">جيد</option>
                        <option value="very_good">جيد جدا</option>
                        <option value="excellent">ممتاز</option>
                      </select>
                      {errors['childcareLevel'] && <p className="text-red-500 text-xs mt-1">{errors['childcareLevel']}</p>}
                    </div>
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-2xl font-normal text-center text-black mb-6">الراتب والمكتب</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <label htmlFor="officeName" className="text-gray-500 text-sm mb-1">اسم المكتب</label>
                      <select
                        id="officeName"
                        value={formData.officeName}
                        onChange={handleChange}
                        className={`border ${errors.officeName ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                      >
                        <option value="" disabled>اختر المكتب</option>
                        {offices.map((e, index) => (
                          <option key={index} value={e.office}>
                            {e.office}
                          </option>
                        ))}
                      </select>
                      {errors.officeName && <p className="text-red-500 text-xs mt-1">{errors.officeName}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="salary" className="text-gray-500 text-sm mb-1">الراتب</label>
                      <input
                        type="number"
                        id="salary"
                        value={formData.salary}
                        onChange={handleChange}
                        placeholder="أدخل الراتب"
                        className={`border ${errors.salary ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 text-sm bg-gray-50 text-right`}
                      />
                      {errors.salary && <p className="text-red-500 text-xs mt-1">{errors.salary}</p>}
                    </div>
                  </div>
                </fieldset>
          <fieldset>
  <legend className="text-2xl font-normal text-center text-black mb-6">الملفات</legend>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {[
      { id: 'travelTicket', label: 'تذكرة السفر' },
      { id: 'passportcopy', label: 'جواز السفر' },
    ].map((file) => (
      <div key={file.id} className="flex flex-col">
        <label htmlFor={file.id} className="text-gray-500 text-sm mb-1">{file.label}</label>
        <div className="file-upload-display border border-gray-300 rounded-md p-2 flex justify-between items-center">
          <span className="text-gray-500 text-sm pr-2 truncate max-w-[200px]">
            {fileNames[file.id] ? (
              <span className="text-teal-800">{fileNames[file.id]}</span>
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
            className="bg-teal-800 text-white px-3 py-1 rounded-md text-xs hover:bg-teal-900 disabled:opacity-50"
            onClick={() => handleButtonClick(file.id)}
          >
            اختيار ملف
          </button>
        </div>
        {errors[file.id] && <p className="text-red-500 text-xs mt-1">{errors[file.id]}</p>}
      </div>
    ))}
  </div>
</fieldset>
                
              </form>
            </div>
          </main>
        )}
      </div>
    </Layout>
  );
};

export async function getServerSideProps({ req }) {
  try {
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(';').forEach((cookie) => {
        const [key, value] = cookie.trim().split('=');
        cookies[key] = decodeURIComponent(value);
      });
    }

    if (!cookies.authToken) {
      return {
        props: { error: 'لا يوجد رمز مصادقة. يرجى تسجيل الدخول.' },
      };
    }

    const token = jwtDecode(cookies.authToken);

    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });

    if (!findUser || !findUser.role?.permissions?.['إدارة العاملات']?.['إضافة']) {
      return {
        props: { error: 'غير مصرح لك بإضافة العاملات.' },
      };
    }

    return { props: {} };
  } catch (err) {
    console.error('Authorization error:', err);
    return {
      props: { error: 'حدث خطأ أثناء التحقق من الصلاحيات.' },
    };
  }
}

export default AddWorkerForm;