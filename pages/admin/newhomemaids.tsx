import React, { useState, useRef, useEffect } from 'react';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FaUser, FaGraduationCap, FaBriefcase, FaTools, FaDollarSign, FaFileAlt, FaMagic } from 'react-icons/fa';
import { Calendar } from 'lucide-react';
import Layout from 'example/containers/Layout';
import Style from 'styles/Home.module.css';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';
import jsPDF from 'jspdf';
import PhoneInput, { parsePhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface Props {
  error?: string;
}

const AddWorkerForm: React.FC<Props> = ({ error }) => {
  const router = useRouter();
  const [allOffices, setAllOffices] = useState<Array<{ office: string; Country?: string }>>([]);
  const [filteredOffices, setFilteredOffices] = useState<Array<{ office: string; Country?: string }>>([]);
  const [fileNames, setFileNames] = useState<{ [key: string]: string }>({
  Picture: '',
  FullPicture: '',
});

  const [formData, setFormData] = useState({
    name: '',
    religion: '',
    nationality: '',
    maritalStatus: '',
    age: '',
    passport: '',
    mobile: '',
    weight: '',
    height: '',
    children: '', 
    BabySitterLevel: '',
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
    Picture: '',
    FullPicture: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [fileUploaded, setFileUploaded] = useState<{ [key: string]: boolean }>({
    Picture: false,
    FullPicture: false,
  });
  const [showModal, setShowModal] = useState(!!error);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nationalities, setNationalities] = useState<Array<{ id: number; Country: string }>>([]);

  const fileInputRefs = {
    Picture: useRef<HTMLInputElement>(null),
    FullPicture: useRef<HTMLInputElement>(null),
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    // Filter to only allow letters (English and Arabic) and spaces for name field
    let filteredValue = value;
    if (id === 'name') {
      filteredValue = value.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '');
    }
    // Filter to only allow letters (English) and numbers for passport field - no symbols
    if (id === 'passport') {
      filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
    }
    
    // إذا تم تغيير الجنسية، قم بتصفية المكاتب وإعادة تعيين المكتب المختار إذا لزم الأمر
    if (id === 'nationality') {
      const filtered = allOffices.filter(office => {
        if (!value) return true; // إذا لم يتم اختيار جنسية، اعرض كل المكاتب
        const officeCountry = office.Country?.toLowerCase().trim() || '';
        const selectedNationality = value.toLowerCase().trim();
        return officeCountry === selectedNationality;
      });
      setFilteredOffices(filtered);
      
      // إذا كان المكتب المختار حالياً لا ينتمي للجنسية الجديدة، قم بإعادة تعيينه
      const currentOffice = allOffices.find(off => off.office === formData.officeName);
      if (value && currentOffice) {
        const officeCountry = currentOffice.Country?.toLowerCase().trim() || '';
        const selectedNationality = value.toLowerCase().trim();
        if (officeCountry !== selectedNationality) {
          setFormData((prev) => ({ ...prev, [id]: filteredValue, officeName: '' }));
        } else {
          setFormData((prev) => ({ ...prev, [id]: filteredValue }));
        }
      } else {
        setFormData((prev) => ({ ...prev, [id]: filteredValue }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [id]: filteredValue }));
    }
    setErrors((prev) => ({ ...prev, [id]: '' }));
  };

  const handlePhoneChange = (value: string | undefined) => {
    setFormData((prev) => ({ ...prev, mobile: value || '' }));
    setErrors((prev) => ({ ...prev, mobile: '' }));
  };

  const handleSkillChange = (skill: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: { ...prev.skills, [skill]: value },
    }));
    setErrors((prev) => ({ ...prev, [`skill-${skill}`]: '' }));
  };

  const allowedHomemaidImageTypes = ['image/jpeg'];

const handleHomemaidImageChange = async (
  e: React.ChangeEvent<HTMLInputElement>,
  fieldId: 'Picture' | 'FullPicture',
  type: 'profile' | 'full'
) => {
  const files = e.target.files;
  if (!files || files.length === 0) {
    setErrors((prev) => ({ ...prev, [fieldId]: 'لم يتم اختيار صورة' }));
    setFileUploaded((prev) => ({ ...prev, [fieldId]: false }));
    setFileNames((prev) => ({ ...prev, [fieldId]: '' }));
    setFormData((prev) => ({ ...prev, [fieldId]: '' }));
    return;
  }

  const file = files[0];
  if (!allowedHomemaidImageTypes.includes(file.type)) {
    setErrors((prev) => ({ ...prev, [fieldId]: 'نوع الصورة غير مدعوم (JPEG فقط)' }));
    setFileUploaded((prev) => ({ ...prev, [fieldId]: false }));
    setFileNames((prev) => ({ ...prev, [fieldId]: '' }));
    setFormData((prev) => ({ ...prev, [fieldId]: '' }));
    return;
  }

  // عرض معاينة فورية للصورة قبل الرفع
  const previewUrl = URL.createObjectURL(file);
  setFormData((prev) => ({ ...prev, [fieldId]: previewUrl }));
  setFileNames((prev) => ({ ...prev, [fieldId]: file.name }));

  try {
    const res = await fetch(`/api/upload-homemaid-image?type=${type}`);
    if (!res.ok) {
      throw new Error('فشل في الحصول على رابط رفع الصورة');
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
      throw new Error('فشل في رفع الصورة');
    }

    // تحديث الرابط بعد الرفع الناجح
    URL.revokeObjectURL(previewUrl); // تنظيف الرابط المؤقت
    setFormData((prev) => ({ ...prev, [fieldId]: filePath }));
    setErrors((prev) => ({ ...prev, [fieldId]: '' }));
    setFileUploaded((prev) => ({ ...prev, [fieldId]: true }));

    const ref = fileInputRefs[fieldId];
    if (ref?.current) {
      ref.current.value = '';
    }
  } catch (error: any) {
    console.error('Error uploading homemaid image:', error);
    URL.revokeObjectURL(previewUrl); // تنظيف الرابط المؤقت في حالة الخطأ
    setErrors((prev) => ({ ...prev, [fieldId]: error.message || 'حدث خطأ أثناء رفع الصورة' }));
    setFileUploaded((prev) => ({ ...prev, [fieldId]: false }));
    setFileNames((prev) => ({ ...prev, [fieldId]: '' }));
    setFormData((prev) => ({ ...prev, [fieldId]: '' }));
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

    const requiredFields: Array<{ id: keyof typeof formData; label: string }> = [
      { id: 'name', label: 'الاسم' },
      { id: 'religion', label: 'الديانة' },
      { id: 'nationality', label: 'الجنسية' },
      { id: 'maritalStatus', label: 'الحالة الاجتماعية' },
      { id: 'age', label: 'العمر' },
      { id: 'passport', label: 'رقم جواز السفر' },

      { id: 'weight', label: 'الوزن' },
      { id: 'height', label: 'الطول' },
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
      { id: 'BabySitterLevel', label: 'العناية بالرضع' },
    ];

    requiredFields.forEach((field) => {
      if (!formData[field.id]) {
        newErrors[field.id] = `${field.label} مطلوب`;
      }
    });

    if (formData.name && !/^[a-zA-Z\s\u0600-\u06FF]{2,}$/.test(formData.name)) {
      newErrors.name = 'الاسم يجب أن يحتوي على حروف فقط وأكثر من حرفين';
    }

   // السماح بالحروف العربية والإنجليزية والمسافات والشرطة (-)
    if (formData.nationality && !/^[a-zA-Z\s\u0600-\u06FF-]+$/.test(formData.nationality)) {
      newErrors.nationality = 'الجنسية يجب أن تحتوي على حروف فقط';
    }

    if (formData.passport) {
      if (!/^[a-zA-Z0-9]{6,20}$/.test(formData.passport)) {
        newErrors.passport = 'رقم جواز السفر يجب أن يكون بين 6-20 حرفًا ورقمًا';
      } else if (!/[a-zA-Z]/.test(formData.passport)) {
        newErrors.passport = 'رقم جواز السفر يجب أن يحتوي على حرف واحد على الأقل';
      }
    }

    if (formData.mobile) {
      try {
        const phoneNumber = parsePhoneNumber(formData.mobile);
        if (phoneNumber && phoneNumber.nationalNumber) {
           const len = phoneNumber.nationalNumber.length;
           if (len < 9 || len > 10) {
              newErrors.mobile = 'رقم الجوال يجب أن يتكون من 9 أو 10 أرقام (بدون الكود)';
           } 
        } else {
             newErrors.mobile = 'رقم الجوال غير صحيح';
        }
      } catch (e) {
           newErrors.mobile = 'رقم الجوال غير صحيح';
      }
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
    // ✨ الإضافات الجديدة للتحقق:
    if (formData.weight && (isNaN(Number(formData.weight)) || Number(formData.weight) <= 0)) {
      newErrors.weight = 'الوزن يجب أن يكون رقمًا صحيحًا';
    }
    if (formData.height && (isNaN(Number(formData.height)) || Number(formData.height) <= 0)) {
      newErrors.height = 'الطول يجب أن يكون رقمًا صحيحًا';
    }
    if (formData.children && isNaN(Number(formData.children))) {
      newErrors.children = 'عدد الأطفال يجب أن يكون رقمًا';
    }

    // التحقق من أن صورة الوجه مطلوبة
    if (!formData.Picture || !fileUploaded.Picture) {
      newErrors.Picture = 'صورة الوجه إجبارية';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchOffices = async () => {
    try {
      const response = await fetch('/api/office_list');
      const data = await response.json();
      const officesList = data.finder || [];
      setAllOffices(officesList);
      setFilteredOffices(officesList); // في البداية، اعرض كل المكاتب
    } catch (error) {
      console.error('Error fetching offices:', error);
    }
  };
      // دالة جلب الجنسيات من الـ API
  const fetchNationalities = async () => {
    try {
      const res = await fetch('/api/nationalities');
      if (res.ok) {
        const data = await res.json();
        // التأكد من وجود المصفوفة في الاستجابة
        if (data && Array.isArray(data.nationalities)) {
          setNationalities(data.nationalities);
        }
      }
    } catch (error) {
      console.error('Error fetching nationalities:', error);
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
      const payload = {
        ...formData,
        weight: formData.weight ? parseInt(formData.weight) : null,
        height: formData.height ? parseInt(formData.height) : null,
        children: formData.children ? parseInt(formData.children) : null,
      };
      const response = await fetch('/api/newhomemaids', {
        method: 'POST',
        body: JSON.stringify(payload),
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
        weight: '',
         height: '',
         children: '',
         BabySitterLevel: '',
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
        Picture: '',
        FullPicture: '',
      });
      setFileUploaded({
        Picture: false,
        FullPicture: false,
      });
      if (fileInputRefs.Picture.current) fileInputRefs.Picture.current.value = '';
      if (fileInputRefs.FullPicture.current) fileInputRefs.FullPicture.current.value = '';
      setFileNames({
        Picture: '',
        FullPicture: '',
      });
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
      fetchNationalities();
    }
  }, [error]);

  // --- قوائم الخيارات الموحدة ---
  const skillLevels = [
    "Expert - ممتاز",
    "Advanced - جيد جداً",
    "Intermediate - جيد",
    "Beginner - مبتدأ",
    "Non - لا تجيد"
  ];

  const educationOptions = [
    "Diploma - دبلوم",
    "High school - ثانوي",
    "Illiterate - غير متعلم",
    "Literate - القراءة والكتابة",
    "Primary school - ابتدائي",
    "University level - جامعي"
  ];

  const experienceOptions = [
    "Novice | مدربة بدون خبرة",
    "Intermediate | مدربة بخبرة متوسطة",
    "Well-experienced | خبرة جيدة",
    "Expert | خبرة ممتازة"
  ];

  const maritalStatusOptions = [
    "Single - عازبة",
    "Married - متزوجة",
    "Divorced - مطلقة"
  ];

  const religionOptions = [
    "Islam - الإسلام",
    "Non-Muslim - غير مسلم"
  ];

  // --- دالة معالجة تغيير الخبرة (تلقائية السنوات) ---
  const handleExperienceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedExperience = e.target.value;
    let autoYears = "";

    switch (selectedExperience) {
      case "Novice | مدربة بدون خبرة":
        autoYears = "مدربة-Training";
        break;
      case "Intermediate | مدربة بخبرة متوسطة":
        autoYears = "1-2 Years - سنوات";
        break;
      case "Well-experienced | خبرة جيدة":
        autoYears = "3-4 Years - سنوات";
        break;
      case "Expert | خبرة ممتازة":
        autoYears = "5 and More - وأكثر";
        break;
      default:
        autoYears = "";
    }

    setFormData((prev) => ({
      ...prev,
      experienceField: selectedExperience, // تخزين مستوى الخبرة
      experienceYears: autoYears,          // تخزين السنوات تلقائياً
    }));
    setErrors((prev) => ({ ...prev, experienceField: '' }));
  };

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
      weight: '',
         height: '',
         children: '',
         BabySitterLevel: '',
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
      Picture: '',
      FullPicture: '',
    });
    setFileUploaded({
      Picture: false,
      FullPicture: false,
    });
    setFileNames({
      Picture: '',
      FullPicture: '',
    });
    if (fileInputRefs.Picture.current) fileInputRefs.Picture.current.value = '';
    if (fileInputRefs.FullPicture.current) fileInputRefs.FullPicture.current.value = '';
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
                {/* <div className="mb-4 p-3 bg-blue-50 border-r-4 border-blue-500 rounded">
                  <p className="text-sm text-gray-700">
                    <span className="text-red-500 font-semibold">*</span> الحقول المميزة بهذه العلامة إجبارية
                  </p>
                </div> */}
                <fieldset>
                  <legend className="text-2xl font-normal text-center text-black mb-6">المعلومات الشخصية</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col">
                      <label htmlFor="name" className="text-gray-500 text-sm mb-1">الاسم <span className="text-red-500">*</span></label>
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
                      <label htmlFor="religion" className="text-gray-500 text-sm mb-1">الديانة <span className="text-red-500">*</span></label>
                      <select
                        id="religion"
                        value={formData.religion}
                        onChange={handleChange}
                        className={`border ${errors.religion ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                        dir="ltr" // تنسيق اتجاه النص ليظهر الإنجليزي على اليسار والعربي على اليمين
                      >
                        <option value="" disabled>اختر الديانة</option>
                        {religionOptions.map(rel => (
                          <option key={rel} value={rel}>{rel}</option>
                        ))}
                      </select>
                      {errors.religion && <p className="text-red-500 text-xs mt-1">{errors.religion}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="nationality" className="text-gray-500 text-sm mb-1">الجنسية <span className="text-red-500">*</span></label>
                      <select
                        id="nationality"
                        value={formData.nationality}
                        onChange={handleChange}
                        className={`border ${errors.nationality ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                        dir="ltr" // لجعل النصوص (إنجليزي - عربي) تظهر بشكل مرتب
                      >
                        <option value="" disabled>اختر الجنسية</option>
                        {nationalities.map((nat) => (
                          <option key={nat.id} value={nat.Country}>
                            {nat.Country}
                          </option>
                        ))}
                      </select>
                      {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality}</p>}
                    </div>
                   <div className="flex flex-col">
                      <label htmlFor="maritalStatus" className="text-gray-500 text-sm mb-1">الحالة الاجتماعية <span className="text-red-500">*</span></label>
                      <select
                        id="maritalStatus"
                        value={formData.maritalStatus}
                        onChange={handleChange}
                        className={`border ${errors.maritalStatus ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                        dir="ltr"
                      >
                        <option value="" disabled>اختر الحالة</option>
                        {maritalStatusOptions.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      {errors.maritalStatus && <p className="text-red-500 text-xs mt-1">{errors.maritalStatus}</p>}
                    </div>

                    {/* ✨ الحقول الجديدة */}
                    <div className="flex flex-col">
                      <label htmlFor="children" className="text-gray-500 text-sm mb-1">عدد الأطفال</label>
                      <input type="number" id="children" value={formData.children} onChange={handleChange} placeholder="0" className={`border ${errors.children ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 text-sm bg-gray-50 text-right`} />
                      {errors.children && <p className="text-red-500 text-xs mt-1">{errors.children}</p>}
                    </div>

                    <div className="flex flex-col">
                      <label htmlFor="weight" className="text-gray-500 text-sm mb-1">الوزن (كجم) <span className="text-red-500">*</span></label>
                      <input type="number" id="weight" value={formData.weight} onChange={handleChange} placeholder="مثال: 60" className={`border ${errors.weight ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 text-sm bg-gray-50 text-right`} />
                      {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
                    </div>

                    <div className="flex flex-col">
                      <label htmlFor="height" className="text-gray-500 text-sm mb-1">الطول (سم) <span className="text-red-500">*</span></label>
                      <input type="number" id="height" value={formData.height} onChange={handleChange} placeholder="مثال: 160" className={`border ${errors.height ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 text-sm bg-gray-50 text-right`} />
                      {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height}</p>}
                    </div>
                    {/* ✨ نهاية الحقول الجديدة */}

                    <div className="flex flex-col">
                      <label htmlFor="age" className="text-gray-500 text-sm mb-1">تاريخ الميلاد <span className="text-red-500">*</span></label>
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
                      <label htmlFor="passport" className="text-gray-500 text-sm mb-1">رقم جواز السفر <span className="text-red-500">*</span></label>
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
                      <PhoneInput
                        international
                        defaultCountry="SA"
                        value={formData.mobile}
                        onChange={handlePhoneChange}
                        placeholder="أدخل رقم الجوال"
                        className={`phone-input-custom ${errors.mobile ? 'border-red-500' : ''}`}
                      />
                      {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="passportStart" className="text-gray-500 text-sm mb-1">بداية الجواز <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          type="date"
                          id="passportStart"
                          value={formData.passportStart}
                          onChange={handleChange}
                          className={`border ${errors.passportStart ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right w-full`}
                        />
                        {/* <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" /> */}
                      </div>
                      {errors.passportStart && <p className="text-red-500 text-xs mt-1">{errors.passportStart}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="passportEnd" className="text-gray-500 text-sm mb-1">نهاية الجواز <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          type="date"
                          id="passportEnd"
                          value={formData.passportEnd}
                          onChange={handleChange}
                          className={`border ${errors.passportEnd ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right w-full`}
                        />
                        {/* <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" /> */}
                      </div>
                      {errors.passportEnd && <p className="text-red-500 text-xs mt-1">{errors.passportEnd}</p>}
                    </div>
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-2xl font-normal text-center text-black mb-6">التعليم</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col">
                      <label htmlFor="educationLevel" className="text-gray-500 text-sm mb-1">مستوى التعليم <span className="text-red-500">*</span></label>
                      <select
                        id="educationLevel"
                        value={formData.educationLevel}
                        onChange={handleChange}
                        className={`border ${errors.educationLevel ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                        dir="ltr"
                      >
                        <option value="" disabled>اختر مستوى التعليم</option>
                        {educationOptions.map(edu => (
                          <option key={edu} value={edu}>{edu}</option>
                        ))}
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
                        dir="ltr"
                      >
                        <option value="" disabled>اختر المستوى</option>
                        {skillLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
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
                        dir="ltr"
                      >
                        <option value="" disabled>اختر المستوى</option>
                        {skillLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                      {errors.englishLevel && <p className="text-red-500 text-xs mt-1">{errors.englishLevel}</p>}
                    </div>
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-2xl font-normal text-center text-black mb-6">الخبرة</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <label htmlFor="experienceField" className="text-gray-500 text-sm mb-1">مستوى الخبرة</label>
                      <select
                        id="experienceField"
                        value={formData.experienceField}
                        onChange={handleExperienceChange} // استخدام الدالة الخاصة هنا
                        className={`border ${errors.experienceField ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                        dir="ltr"
                      >
                        <option value="" disabled>اختر الخبرة</option>
                        {experienceOptions.map(exp => (
                          <option key={exp} value={exp}>{exp}</option>
                        ))}
                      </select>
                      {errors.experienceField && <p className="text-red-500 text-xs mt-1">{errors.experienceField}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="experienceYears" className="text-gray-500 text-sm mb-1">سنوات الخبرة (تلقائي)</label>
                      <input
                        type="text" // تغيير النوع إلى نص لأن القيم أصبحت نصية (مثل: 1-2 Years)
                        id="experienceYears"
                        value={formData.experienceYears}
                        onChange={handleChange}
                        placeholder="يتم التعبئة تلقائياً"
                        className={`border ${errors.experienceYears ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-100 text-right`}
                        dir="ltr"
                      />
                      {errors.experienceYears && <p className="text-red-500 text-xs mt-1">{errors.experienceYears}</p>}
                    </div>
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-2xl font-normal text-center text-black mb-6">المهارات</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { id: 'cookingLevel', label: 'الطبخ', required: true },
                      { id: 'washingLevel', label: 'الغسيل', required: true },
                      { id: 'ironingLevel', label: 'الكوي', required: true },
                      { id: 'cleaningLevel', label: 'التنظيف', required: true },
                      { id: 'sewingLevel', label: 'الخياطة', required: true },
                      { id: 'elderlycareLevel', label: 'رعاية كبار السن', required: true },
                      { id: 'childcareLevel', label: 'العناية بالأطفال', required: true },
                      { id: 'BabySitterLevel', label: 'العناية بالرضع', required: true },
                    ].map((skill) => (
                      <div className="flex flex-col" key={skill.id}>
                        <label htmlFor={skill.id} className="text-gray-500 text-sm mb-1">{skill.label} {skill.required && <span className="text-red-500">*</span>}</label>
                        <select
                          id={skill.id}
                          value={formData[skill.id as keyof typeof formData] as string}
                          onChange={handleChange}
                          className={`border ${errors[skill.id] ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                          dir="ltr"
                        >
                          <option value="" disabled>اختر المستوى</option>
                          {skillLevels.map(level => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                        {errors[skill.id] && <p className="text-red-500 text-xs mt-1">{errors[skill.id]}</p>}
                      </div>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-2xl font-normal text-center text-black mb-6">الراتب والمكتب</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <label htmlFor="officeName" className="text-gray-500 text-sm mb-1">اسم المكتب <span className="text-red-500">*</span></label>
                      <select
                        id="officeName"
                        value={formData.officeName}
                        onChange={handleChange}
                        className={`border ${errors.officeName ? 'border-red-500' : 'border-gray-300'} rounded-md text-sm bg-gray-50 text-right`}
                        disabled={!formData.nationality}
                      >
                        <option value="" disabled>
                          {formData.nationality ? 'اختر المكتب' : 'يرجى اختيار الجنسية أولاً'}
                        </option>
                        {filteredOffices.map((e, index) => (
                          <option key={index} value={e.office}>
                            {e.office}
                          </option>
                        ))}
                      </select>
                      {errors.officeName && <p className="text-red-500 text-xs mt-1">{errors.officeName}</p>}
                      {formData.nationality && filteredOffices.length === 0 && (
                        <p className="text-yellow-600 text-xs mt-1">لا توجد مكاتب متاحة للجنسية المختارة</p>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="salary" className="text-gray-500 text-sm mb-1">الراتب <span className="text-red-500">*</span></label>
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
      { id: 'Picture', label: 'صورة الوجه', required: true },
      { id: 'FullPicture', label: 'صورة الطول', required: false },
    ].map((file) => (
      <div key={file.id} className="flex flex-col">
        <label htmlFor={file.id} className="text-gray-500 text-sm mb-1">
          {file.label}
          {file.required && <span className="text-red-500 mr-1">*</span>}
        </label>
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
            accept="image/jpeg"
            onChange={(e) => {
              if (file.id === 'Picture') return handleHomemaidImageChange(e, 'Picture', 'profile');
              return handleHomemaidImageChange(e, 'FullPicture', 'full');
            }}
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
        {file.id === 'Picture' && formData.Picture && (
          <div className="mt-3 flex justify-end">
            <div className="relative">
              <img
                src={formData.Picture}
                alt="صورة الوجه"
                className="w-40 h-40 object-cover rounded-lg border-2 border-teal-800 shadow-md"
              />
              <div className="absolute top-2 right-2 bg-teal-800 text-white text-xs px-2 py-1 rounded">
                معاينة
              </div>
            </div>
          </div>
        )}
        {file.id === 'FullPicture' && formData.FullPicture && (
          <div className="mt-3 flex justify-end">
            <div className="relative">
              <img
                src={formData.FullPicture}
                alt="صورة الطول"
                className="w-40 h-40 object-cover rounded-lg border-2 border-teal-800 shadow-md"
              />
              <div className="absolute top-2 right-2 bg-teal-800 text-white text-xs px-2 py-1 rounded">
                معاينة
              </div>
            </div>
          </div>
        )}
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

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  try {
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(';').forEach((cookie: string) => {
        const [key, value] = cookie.trim().split('=');
        cookies[key] = decodeURIComponent(value);
      });
    }

    if (!cookies.authToken) {
      return {
        props: { error: 'لا يوجد رمز مصادقة. يرجى تسجيل الدخول.' },
      };
    }

    const token = jwtDecode<{ id: number | string }>(cookies.authToken);
    const userId = typeof token.id === 'string' ? parseInt(token.id, 10) : token.id;
    if (!userId || Number.isNaN(userId as number)) {
      return { props: { error: 'رمز مصادقة غير صالح.' } };
    }

    const findUser = await prisma.user.findUnique({
      where: { id: userId as number },
      include: { role: true },
    });

    const canAdd = (findUser as any)?.role?.permissions?.['إدارة العاملات']?.['إضافة'];
    if (!findUser || !canAdd) {
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
};

export default AddWorkerForm;