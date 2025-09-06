import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { FaUser, FaGraduationCap, FaBriefcase, FaTools, FaDollarSign, FaFileAlt } from 'react-icons/fa';
import { Calendar } from 'lucide-react';
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css"
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';

const AddWorkerForm = () => {
  const [offices, setOffices] = useState<Array<{ office: string }>>([]);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setErrors((prev) => ({ ...prev, [fileId]: 'لم يتم اختيار ملف' }));
      setFileUploaded((prev) => ({ ...prev, [fileId]: false }));
      return;
    }

    const file = files[0];
    const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];
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
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setErrors((prev) => ({ ...prev, [fileId]: error.message || 'حدث خطأ أثناء رفع الملف' }));
      setFileUploaded((prev) => ({ ...prev, [fileId]: false }));
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
    ];

    requiredFields.forEach((field) => {
      if (!formData[field.id]) {
        newErrors[field.id] = `${field.label} مطلوب`;
      }
    });

    if (formData.name && !/^[a-zA-Z\s\u0600-\u06FF]{2,}$/.test(formData.name)) {
      newErrors.name = 'الاسم يجب أن يحتوي على حروف فقط وأكثر من حرفين';
    }

    if (formData.mobile && !/^\d{7,15}$/.test(formData.mobile)) {
      newErrors.mobile = 'رقم الجوال يجب أن يحتوي على 7-15 رقمًا';
    }

    if (formData.passport && !/^[a-zA-Z0-9]{6,20}$/.test(formData.passport)) {
      newErrors.passport = 'رقم جواز السفر يجب أن يكون بين 6-20 حرفًا ورقمًا';
    }

    if (formData.age) {
      const ageDate = new Date(formData.age);
      const age = today.getFullYear() - ageDate.getFullYear();
      if (age < 18 || age > 100) {
        newErrors.age = 'العمر يجب أن يكون بين 18 و100 سنة';
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

    const skillsSelected = Object.values(formData.skills).some((value) => value !== '');
    if (!skillsSelected) {
      newErrors.skills = 'يجب اختيار مستوى لمهارة واحدة على الأقل';
    }

    const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (fileInputRefs.travelTicket.current?.files?.[0]) {
      if (!allowedFileTypes.includes(fileInputRefs.travelTicket.current.files[0].type)) {
        newErrors.travelTicket = 'تذكرة السفر يجب أن تكون PDF أو صورة (JPEG/PNG)';
      }
    }
    if (fileInputRefs.passportcopy.current?.files?.[0]) {
      if (!allowedFileTypes.includes(fileInputRefs.passportcopy.current.files[0].type)) {
        newErrors.passportcopy = 'جواز السفر يجب أن يكون PDF أو صورة (JPEG/PNG)';
      }
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
      alert('يرجى تصحيح الأخطاء في النموذج قبل الإرسال');
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'skills') {
          Object.entries(formData.skills).forEach(([skillKey, skillValue]) => {
            formDataToSend.append(`skills[${skillKey}]`, skillValue);
          });
        } else {
          formDataToSend.append(key, value);
        }
      });

      if (fileInputRefs.travelTicket.current?.files?.[0]) {
        formDataToSend.append('travelTicket', fileInputRefs.travelTicket.current.files[0]);
      }
      if (fileInputRefs.passportcopy.current?.files?.[0]) {
        formDataToSend.append('passportcopy', fileInputRefs.passportcopy.current.files[0]);
      }

      const response = await fetch('/api/newhomemaids', {
        method: 'POST',
        body: JSON.stringify(formData),headers:{"Content-Type":"application/json"}
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
      alert('تم إضافة العاملة بنجاح!');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('حدث خطأ أثناء إرسال البيانات. حاول مرة أخرى.');
    }
  };

  useEffect(() => {
    fetchOffices();
  }, []);

  return (
    <Layout>
      <div className={`min-h-screen ${Style["tajawal-regular"]}`}>
        <Head>
          <title>إضافة عاملة</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        <main className="p-7 max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-normal text-black">إضافة عاملة</h1>
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
                      className={`border ${errors.nationality ? 'border-red-500' : 'border-gray-300'} rounded-md  text-sm bg-gray-50 text-right`}
                    />
                    {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality}</p>}
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="maritalStatus" className="text-gray-500 text-sm mb-1">الحالة الاجتماعية</label>
                    <select
                      id="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleChange}
                      className={`border ${errors.maritalStatus ? 'border-red-500' : 'border-gray-300'} rounded-md  text-sm bg-gray-50 text-right`}
                    >
                      <option value="" disabled>اختر الحالة</option>
                      <option value="single">عزباء</option>
                      <option value="married">متزوجة</option>
                      <option value="divorced">مطلقة</option>
                    </select>
                    {errors.maritalStatus && <p className="text-red-500 text-xs mt-1">{errors.maritalStatus}</p>}
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="age" className="text-gray-500 text-sm mb-1">العمر</label>
                    <input
                      type="date"
                      id="age"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="أدخل العمر"
                      className={`border ${errors.age ? 'border-red-500' : 'border-gray-300'} rounded-md  text-sm bg-gray-50 text-right`}
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
                      className={`border ${errors.passport ? 'border-red-500' : 'border-gray-300'} rounded-md  text-sm bg-gray-50 text-right`}
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
                      className={`border ${errors.mobile ? 'border-red-500' : 'border-gray-300'} rounded-md  text-sm bg-gray-50 text-right`}
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
                        className={`border ${errors.passportStart ? 'border-red-500' : 'border-gray-300'} rounded-md  text-sm bg-gray-50 text-right w-full`}
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
                        className={`border ${errors.passportEnd ? 'border-red-500' : 'border-gray-300'} rounded-md  text-sm bg-gray-50 text-right w-full`}
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
                      className={`border ${errors.educationLevel ? 'border-red-500' : 'border-gray-300'} rounded-md  text-sm bg-gray-50 text-right`}
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
                      className={`border ${errors.arabicLevel ? 'border-red-500' : 'border-gray-300'} rounded-md  text-sm bg-gray-50 text-right`}
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
                      className={`border ${errors.englishLevel ? 'border-red-500' : 'border-gray-300'} rounded-md  text-sm bg-gray-50 text-right`}
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
                      className={`border ${errors.experienceField ? 'border-red-500' : 'border-gray-300'} rounded-md  text-sm bg-gray-50 text-right`}
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
                      className={`border ${errors.experienceYears ? 'border-red-500' : 'border-gray-300'} rounded-md  text-sm bg-gray-50 text-right`}
                    />
                    {errors.experienceYears && <p className="text-red-500 text-xs mt-1">{errors.experienceYears}</p>}
                  </div>
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-2xl font-normal text-center text-black mb-6">المهارات</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { id: 'washing', label: 'الغسيل' },
                    { id: 'ironing', label: 'الكوي' },
                    { id: 'cleaning', label: 'التنظيف' },
                    { id: 'cooking', label: 'الطبخ' },
                    { id: 'sewing', label: 'الخياطة' },
                    { id: 'childcare', label: 'العناية بالأطفال' },
                    { id: 'elderlycare', label: 'رعاية كبار السن' },
                  ].map((skill) => (
                    <div key={skill.id} className="flex flex-col">
                      <label htmlFor={`skill-${skill.id}`} className="text-gray-500 text-sm mb-1">{skill.label}</label>
                      <select
                        id={`skill-${skill.id}`}
                        value={formData.skills[skill.id as keyof typeof formData.skills]}
                        onChange={(e) => handleSkillChange(skill.id, e.target.value)}
                        className={`border ${errors[`skill-${skill.id}`] ? 'border-red-500' : 'border-gray-300'} rounded-md  text-sm bg-gray-50 text-right`}
                      >
                        <option value="" disabled>اختر المستوى</option>
                        <option value="trained_no_experience">مدربة بدون خبرة</option>
                        <option value="good">جيد</option>
                        <option value="very_good">جيد جدا</option>
                        <option value="excellent">ممتاز</option>
                      </select>
                      {errors[`skill-${skill.id}`] && <p className="text-red-500 text-xs mt-1">{errors[`skill-${skill.id}`]}</p>}
                    </div>
                  ))}
                  {errors.skills && <p className="text-red-500 text-xs mt-1 col-span-full">{errors.skills}</p>}
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
                      className={`border ${errors.officeName ? 'border-red-500' : 'border-gray-300'} rounded-md  text-sm bg-gray-50 text-right`}
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
                      <div className="flex items-center border border-gray-300 rounded-md p-2">
                        <input
                          type="file"
                          id={file.id}
                          ref={fileInputRefs[file.id as keyof typeof fileInputRefs]}
                          className="hidden"
                          onChange={(e) => handleFileChange(e, file.id)}
                        />
                        {fileUploaded[file.id] ? (
                          <a
                            href={formData[file.id as keyof typeof formData]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-right text-teal-800 underline hover:text-teal-600"
                          >
                            ملف مرفق
                          </a>
                        ) : (
                          <span className="flex-1 text-right text-gray-500">ارفاق ملف</span>
                        )}
                        <button
                          type="button"
                          className="bg-teal-800 text-white px-4 py-2 rounded-md"
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
                  }}
                >
                  إعادة ضبط
                </button>
                <button
                  type="button"
                  className="bg-teal-800 text-white text-sm px-4 py-2 rounded-md"
                  onClick={handleSubmit}
                >
                  إضافة العاملة
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default AddWorkerForm;



export async function getServerSideProps ({ req }) {
  try {
    console.log("sss")
    // 🔹 Extract cookies
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    // 🔹 Check for authToken
    if (!cookies.authToken) {
      return {
        redirect: { destination: "/auth/login", permanent: false },
      };
    }

    // 🔹 Decode JWT
    const token = jwtDecode(cookies.authToken);

    // 🔹 Fetch user & role with Prisma
    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });
console.log(findUser.role?.permissions?.["إدارة العاملات"])
    if (
      !findUser ||
      !findUser.role?.permissions?.["إدارة العاملات"]?.["إضافة"]
    ) {
      return {
        redirect: { destination: "/admin/home", permanent: false }, // or show 403
      };
    }

    return { props: {} };
  } catch (err) {
    console.error("Authorization error:", err);
    return {
      redirect: { destination: "/admin/home", permanent: false },
    };
  }
};