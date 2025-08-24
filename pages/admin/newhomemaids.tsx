import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { FaUser, FaGraduationCap, FaBriefcase, FaTools, FaDollarSign, FaFileAlt } from 'react-icons/fa';
import { Calendar } from 'lucide-react';
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css"
const AddWorkerForm = () => {
  // Form state management
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
  });

  // File input refs
  const fileInputRefs = {
    travelTicket: useRef<HTMLInputElement>(null),
    passportFile: useRef<HTMLInputElement>(null),
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // Handle skill changes
  const handleSkillChange = (skill: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: { ...prev.skills, [skill]: value },
    }));
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileId: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log(`File selected for ${fileId}:`, files[0].name);
    }
  };

  // Trigger file input click
  const handleButtonClick = (fileId: string) => {
    fileInputRefs[fileId as keyof typeof fileInputRefs].current?.click();
  };

  // Fetch offices
  const [offices, setOffices] = useState<{ office: string }[]>([]);
  const fetchOffices = async () => {
    try {
      const response = await fetch('/api/office_list');
      const data = await response.json();
      setOffices(data.finder || []);
    } catch (error) {
      console.error('Error fetching offices:', error);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const formDataToSend = new FormData();

      // Append text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'skills') {
          // Append skills as individual fields
          Object.entries(formData.skills).forEach(([skillKey, skillValue]) => {
            formDataToSend.append(`skills[${skillKey}]`, skillValue);
          });
        } else {
          formDataToSend.append(key, value);
        }
      });

      // Append files
      if (fileInputRefs.travelTicket.current?.files?.[0]) {
        formDataToSend.append('travelTicket', fileInputRefs.travelTicket.current.files[0]);
      }
      if (fileInputRefs.passportFile.current?.files?.[0]) {
        formDataToSend.append('passportFile', fileInputRefs.passportFile.current.files[0]);
      }


      const response = await fetch('/api/newhomemaids', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('API response:', result);

      // Reset form after successful submission
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
      });

      // Reset file inputs
      if (fileInputRefs.travelTicket.current) fileInputRefs.travelTicket.current.value = '';
      if (fileInputRefs.passportFile.current) fileInputRefs.passportFile.current.value = '';

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
          {/* Stepper */}
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
              {/* Personal Information */}
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
                      className="border border-gray-300 rounded-md p-2 text-sm bg-gray-50 text-right"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="religion" className="text-gray-500 text-sm mb-1">الديانة</label>
                    <select
                      id="religion"
                      value={formData.religion}
                      onChange={handleChange}
                      className="border border-gray-300 rounded-md p-2 text-sm bg-gray-50 text-right"
                    >
                      <option value="" disabled>اختر الديانة</option>
                      <option value="muslim">مسلمة</option>
                      <option value="christian">مسيحية</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="nationality" className="text-gray-500 text-sm mb-1">الجنسية</label>
                    <input
                      type="text"
                      id="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                      placeholder="أدخل الجنسية"
                      className="border border-gray-300 rounded-md p-2 text-sm bg-gray-50 text-right"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="maritalStatus" className="text-gray-500 text-sm mb-1">الحالة الاجتماعية</label>
                    <select
                      id="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleChange}
                      className="border border-gray-300 rounded-md p-2 text-sm bg-gray-50 text-right"
                    >
                      <option value="" disabled>اختر الحالة</option>
                      <option value="single">عزباء</option>
                      <option value="married">متزوجة</option>
                      <option value="divorced">مطلقة</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="age" className="text-gray-500 text-sm mb-1">العمر</label>
                    <input
                      type="number"
                      id="age"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="أدخل العمر"
                      className="border border-gray-300 rounded-md p-2 text-sm bg-gray-50 text-right"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="passport" className="text-gray-500 text-sm mb-1">رقم جواز السفر</label>
                    <input
                      type="text"
                      id="passport"
                      value={formData.passport}
                      onChange={handleChange}
                      placeholder="أدخل رقم الجواز"
                      className="border border-gray-300 rounded-md p-2 text-sm bg-gray-50 text-right"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="mobile" className="text-gray-500 text-sm mb-1">رقم الجوال</label>
                    <input
                      type="tel"
                      id="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="أدخل رقم الجوال"
                      className="border border-gray-300 rounded-md p-2 text-sm bg-gray-50 text-right"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="passportStart" className="text-gray-500 text-sm mb-1">بداية الجواز</label>
                    <div className="relative">
                      <input
                        type="date"
                        id="passportStart"
                        value={formData.passportStart}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-md p-2 text-sm bg-gray-50 text-right w-full"
                      />
                      <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="passportEnd" className="text-gray-500 text-sm mb-1">نهاية الجواز</label>
                    <div className="relative">
                      <input
                        type="date"
                        id="passportEnd"
                        value={formData.passportEnd}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-md p-2 text-sm bg-gray-50 text-right w-full"
                      />
                      <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                </div>
              </fieldset>
              {/* Education */}
              <fieldset>
                <legend className="text-2xl font-normal text-center text-black mb-6">التعليم</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex flex-col">
                    <label htmlFor="educationLevel" className="text-gray-500 text-sm mb-1">مستوى التعليم</label>
                    <select
                      id="educationLevel"
                      value={formData.educationLevel}
                      onChange={handleChange}
                      className="border border-gray-300 rounded-md p-2 text-sm bg-gray-50 text-right"
                    >
                      <option value="" disabled>اختر مستوى التعليم</option>
                      <option value="secondary">ثانوي</option>
                      <option value="university">جامعي</option>
                      <option value="diploma">دبلوم</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="arabicLevel" className="text-gray-500 text-sm mb-1">اللغة العربية</label>
                    <select
                      id="arabicLevel"
                      value={formData.arabicLevel}
                      onChange={handleChange}
                      className="border border-gray-300 rounded-md p-2 text-sm bg-gray-50 text-right"
                    >
                      <option value="" disabled>اختر المستوى</option>
                      <option value="beginner">مبتدئ</option>
                      <option value="intermediate">متوسط</option>
                      <option value="advanced">ممتاز</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="englishLevel" className="text-gray-500 text-sm mb-1">اللغة الإنجليزية</label>
                    <select
                      id="englishLevel"
                      value={formData.englishLevel}
                      onChange={handleChange}
                      className="border border-gray-300 rounded-md p-2 text-sm bg-gray-50 text-right"
                    >
                      <option value="" disabled>اختر المستوى</option>
                      <option value="beginner">مبتدئ</option>
                      <option value="intermediate">متوسط</option>
                      <option value="advanced">ممتاز</option>
                    </select>
                  </div>
                </div>
              </fieldset>
              {/* Experience */}
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
                      className="border border-gray-300 rounded-md p-2 text-sm bg-gray-50 text-right"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="experienceYears" className="text-gray-500 text-sm mb-1">سنوات الخبرة</label>
                    <input
                      type="number"
                      id="experienceYears"
                      value={formData.experienceYears}
                      onChange={handleChange}
                      placeholder="أدخل عدد السنوات"
                      className="border border-gray-300 rounded-md p-2 text-sm bg-gray-50 text-right"
                    />
                  </div>
                </div>
              </fieldset>
              {/* Skills */}
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
                        className="border border-gray-300 rounded-md p-2 text-sm bg-gray-50 text-right"
                      >
                        <option value="" disabled>اختر المستوى</option>
                        <option value="trained_no_experience">مدربة بدون خبرة</option>
                        <option value="good">جيد</option>
                        <option value="very_good">جيد جدا</option>
                        <option value="excellent">ممتاز</option>
                      </select>
                    </div>
                  ))}
                </div>
              </fieldset>
              {/* Salary and Office */}
              <fieldset>
                <legend className="text-2xl font-normal text-center text-black mb-6">الراتب والمكتب</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <label htmlFor="officeName" className="text-gray-500 text-sm mb-1">اسم المكتب</label>
                    <select
                      id="officeName"
                      value={formData.officeName}
                      onChange={handleChange}
                      className="border border-gray-300 rounded-md p-2 text-sm bg-gray-50 text-right"
                    >
                      <option value="" disabled>اختر المكتب</option>
                      {offices.map((e, index) => (
                        <option key={index} value={e.office}>
                          {e.office}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="salary" className="text-gray-500 text-sm mb-1">الراتب</label>
                    <input
                      type="number"
                      id="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      placeholder="أدخل الراتب"
                      className="border border-gray-300 rounded-md p-2 text-sm bg-gray-50 text-right"
                    />
                  </div>
                </div>
              </fieldset>
              {/* Files */}
              <fieldset>
                <legend className="text-2xl font-normal text-center text-black mb-6">الملفات</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { id: 'travelTicket', label: 'تذكرة السفر' },
                    { id: 'passportFile', label: 'جواز السفر' },
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
                        <span className="text-gray-500 flex-1 text-right">ارفاق ملف</span>
                        <button
                          type="button"
                          className="bg-teal-800 text-white px-4 py-2 rounded-md"
                          onClick={() => handleButtonClick(file.id)}
                        >
                          اختيار ملف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>
              {/* Submit Buttons */}
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
                    });
                    if (fileInputRefs.travelTicket.current) fileInputRefs.travelTicket.current.value = '';
                    if (fileInputRefs.passportFile.current) fileInputRefs.passportFile.current.value = '';
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