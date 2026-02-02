import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { FaFilePdf, FaPrint, FaSave, FaUser, FaGraduationCap, FaBriefcase, FaTools, FaDollarSign, FaFileAlt, FaMagic, FaArrowRight, FaCog, FaCheck, FaEdit, FaTimes, FaExchangeAlt } from "react-icons/fa";
import AlertModal from "components/AlertModal";
import Head from "next/head";

function HomeMaidInfo() {
  const router = useRouter();
  const { id } = router.query;

  // --- دوال مساعدة للتاريخ ---
  
  // تنسيق للعرض في الجدول (DD/MM/YYYY)
  const getDate = (date: any) => {
    if (!date) return "غير متوفر";
    const currentDate = new Date(date);
    return `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
  };

  // تنسيق لمدخلات HTML (YYYY-MM-DD) ليظهر التاريخ داخل الحقل
  const formatToInputDate = (date: any) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // --- حالة البيانات (State) ---
  const [professions, setProfessions] = useState<Array<{ id: number; name: string }>>([]);
  const [formData, setFormData] = useState({
    Name: "",
    Religion: "",
    professionId: "",
    Nationalitycopy: "",
    maritalstatus: "",

    // ✅ الصور
    Picture: "",
    FullPicture: "",
    
    // الحقول الجديدة
    childrenCount: "", 
    weight: "",
    height: "",
    passportStartDate: "",
    passportEndDate: "",

    dateofbirth: "",
    Passportnumber: "",
    phone: "",
    Education: "",
    ArabicLanguageLeveL: "",
    EnglishLanguageLevel: "",
    Experience: "",
    ExperienceYears: "",
    
    // المهارات (تم حذف laundryLevel)
    washingLevel: "",
    ironingLevel: "",
    cleaningLevel: "",
    cookingLevel: "",
    sewingLevel: "",
    childcareLevel: "", // العناية بالأطفال
    babySitterLevel: "", // العناية بالرضع
    elderlycareLevel: "",
    // laundryLevel: "", // ❌ تم الحذف

    officeName: "",
    salary: "",
    contractType: "recruitment" as "recruitment" | "rental",
    notes: "",
    logs: [] as any[],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExistingOrder, setHasExistingOrder] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // حالة الـ modal للتنبيهات
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: ''
  });

  // قوائم البيانات الخارجية
  const [nationalities, setNationalities] = useState<Array<{ id: number; Country: string }>>([]);
  const [allOffices, setAllOffices] = useState<Array<{ id: number; office: string; Country?: string }>>([]);
  const [filteredOffices, setFilteredOffices] = useState<Array<{ id: number; office: string; Country?: string }>>([]);
  
  // حالة الملفات
  const [fileNames, setFileNames] = useState<{ [key: string]: string }>({
    travelTicket: '',
    passportcopy: '',
  });

  const fileInputRefs = {
    travelTicket: useRef<HTMLInputElement>(null),
    passportcopy: useRef<HTMLInputElement>(null),
  };

  // ✅ صور العاملة (رفع/تعديل)
  const [imageUploading, setImageUploading] = useState<{ Picture: boolean; FullPicture: boolean }>({
    Picture: false,
    FullPicture: false,
  });
  const [imageErrors, setImageErrors] = useState<{ Picture: string; FullPicture: string }>({
    Picture: "",
    FullPicture: "",
  });
  const [imageFileNames, setImageFileNames] = useState<{ Picture: string; FullPicture: string }>({
    Picture: "",
    FullPicture: "",
  });
  const imageInputRefs = {
    Picture: useRef<HTMLInputElement>(null),
    FullPicture: useRef<HTMLInputElement>(null),
  };

  // Crop interface state - simplified version
  const [cropModal, setCropModal] = useState<{
    isOpen: boolean;
    imageSrc: string;
    fieldId: "Picture" | "FullPicture" | null;
    uploadType: "profile" | "full" | null;
    file: File | null;
  }>({
    isOpen: false,
    imageSrc: "",
    fieldId: null,
    uploadType: null,
    file: null,
  });

  // Simple crop state - just store percentage values
  const [cropBox, setCropBox] = useState({ x: 15, y: 15, size: 70 }); // percentage based
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);

  // --- القوائم الثابتة الموحدة ---
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
    "Divorced - مطلقة",
    "Widowed - أرملة"
  ];

  const religionOptions = [
    "Islam - الإسلام",
    "Non-Muslim - غير مسلم"
  ];

  // --- دوال المعالجة (Handlers) ---
  const extractImageUrl = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
      const first = value?.[0];
      if (typeof first === "string") return first;
      if (first && typeof first === "object" && typeof first.url === "string") return first.url;
      return "";
    }
    if (typeof value === "object" && typeof value.url === "string") return value.url;
    return "";
  };

  const normalizeToWesternDigits = (value: string) => {
    if (!value) return "";
    // Arabic-Indic digits (٠-٩) + Eastern Arabic/Persian digits (۰-۹)
    const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
    const easternArabic = "۰۱۲۳۴۵۶۷۸۹";
    return value
      .replace(/[٠-٩]/g, (d) => String(arabicIndic.indexOf(d)))
      .replace(/[۰-۹]/g, (d) => String(easternArabic.indexOf(d)));
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    // Salary: numbers only (prevent any text)
    if (name === "salary") {
      const normalized = normalizeToWesternDigits(String(value));
      const digitsOnly = normalized.replace(/[^\d]/g, "");
      setFormData((prev) => ({ ...prev, salary: digitsOnly }));
      setErrors((prev) => ({ ...prev, [name]: '' }));
      return;
    }

    // Name: filter to only allow letters (English and Arabic) and spaces
    if (name === "Name") {
      const filteredValue = value.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '');
      setFormData((prev) => ({ ...prev, [name]: filteredValue }));
      setErrors((prev) => ({ ...prev, [name]: '' }));
      return;
    }

    // إذا تم تغيير الجنسية، قم بتصفية المكاتب وإعادة تعيين المكتب المختار إذا لزم الأمر
    if (name === "Nationalitycopy") {
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
          setFormData((prev) => ({ ...prev, [name]: value, officeName: '' }));
        } else {
          setFormData((prev) => ({ ...prev, [name]: value }));
        }
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
      setErrors((prev) => ({ ...prev, [name]: '' }));
      return;
    }

    setFormData({ ...formData, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleChangeDate = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleExperienceChange = (e: any) => {
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
        autoYears = formData.ExperienceYears || "";
    }

    setFormData((prev) => ({
      ...prev,
      Experience: selectedExperience,
      ExperienceYears: autoYears,
    }));
    setErrors((prev) => ({ ...prev, Experience: '', ExperienceYears: '' }));
  };

  const handleExportPDF = () => {
    router.push(`/admin/homemaidinfo?id=${id}`);
  };

  const handlePrint = () => {
    window.print();
  };

  // دالة التحقق من صحة البيانات (مستعارة من newhomemaids)
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const today = new Date();

    // الحقول المطلوبة
    const requiredFields: Array<{ name: keyof typeof formData; label: string }> = [
      { name: 'Name', label: 'الاسم' },
      { name: 'Religion', label: 'الديانة' },
      { name: 'Nationalitycopy', label: 'الجنسية' },
      { name: 'maritalstatus', label: 'الحالة الاجتماعية' },
      { name: 'dateofbirth', label: 'تاريخ الميلاد' },
      { name: 'Passportnumber', label: 'رقم جواز السفر' },
      { name: 'Passportnumber', label: 'رقم جواز السفر' },
      { name: 'weight', label: 'الوزن' },
      { name: 'height', label: 'الطول' },
      { name: 'passportStartDate', label: 'بداية الجواز' },
      { name: 'passportEndDate', label: 'نهاية الجواز' },
      { name: 'Education', label: 'مستوى التعليم' },
      { name: 'officeName', label: 'اسم المكتب' },
      { name: 'salary', label: 'الراتب' },
      { name: 'cookingLevel', label: 'الطبخ' },
      { name: 'washingLevel', label: 'الغسيل' },
      { name: 'ironingLevel', label: 'الكوي' },
      { name: 'cleaningLevel', label: 'التنظيف' },
      { name: 'sewingLevel', label: 'الخياطة' },
      { name: 'childcareLevel', label: 'العناية بالأطفال' },
      { name: 'elderlycareLevel', label: 'رعاية كبار السن' },
      { name: 'babySitterLevel', label: 'العناية بالرضع' },
    ];

    requiredFields.forEach((field) => {
      if (!formData[field.name] || String(formData[field.name]).trim() === '') {
        newErrors[field.name] = `${field.label} مطلوب`;
      }
    });

    // التحقق من الاسم
    if (formData.Name && !/^[a-zA-Z\s\u0600-\u06FF]{2,}$/.test(formData.Name)) {
      newErrors.Name = 'الاسم يجب أن يحتوي على حروف فقط وأكثر من حرفين';
    }

    // التحقق من الجنسية
    if (formData.Nationalitycopy && !/^[a-zA-Z\s\u0600-\u06FF-]+$/.test(formData.Nationalitycopy)) {
      newErrors.Nationalitycopy = 'الجنسية يجب أن تحتوي على حروف فقط';
    }

    // التحقق من جواز السفر
    if (formData.Passportnumber) {
      if (!/^[a-zA-Z0-9]{6,20}$/.test(formData.Passportnumber)) {
        newErrors.Passportnumber = 'رقم جواز السفر يجب أن يكون بين 6-20 حرفًا ورقمًا';
      } else if (!/[a-zA-Z]/.test(formData.Passportnumber)) {
        newErrors.Passportnumber = 'رقم جواز السفر يجب أن يحتوي على حرف واحد على الأقل';
      }
    }

    // التحقق من رقم الجوال
    if (formData.phone) {
      const cleanedPhone = formData.phone.replace(/\s/g, '');
      if (!/^\+\d{7,15}$/.test(cleanedPhone)) {
        newErrors.phone = 'رقم الجوال غير صحيح. يجب أن يحتوي على رمز الدولة والرقم';
      }
    }

    // التحقق من تاريخ الميلاد (العمر)
    if (formData.dateofbirth) {
      const ageDate = new Date(formData.dateofbirth);
      if (!isNaN(ageDate.getTime())) {
        let age = today.getFullYear() - ageDate.getFullYear();
        const monthDiff = today.getMonth() - ageDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < ageDate.getDate())) {
          age--;
        }
        if (age < 16 || age > 100) {
          newErrors.dateofbirth = 'العمر يجب أن يكون بين 16 و100 سنة';
        }
      }
    }

    // التحقق من تواريخ الجواز
    if (formData.passportStartDate && formData.passportEndDate) {
      const startDate = new Date(formData.passportStartDate);
      const endDate = new Date(formData.passportEndDate);
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        if (startDate >= endDate) {
          newErrors.passportEndDate = 'تاريخ نهاية الجواز يجب أن يكون بعد تاريخ البداية';
        }
        if (endDate < today) {
          newErrors.passportEndDate = 'جواز السفر منتهي الصلاحية';
        }
      }
    }

    // التحقق من الراتب
    if (formData.salary) {
      const sanitizedSalary = normalizeToWesternDigits(String(formData.salary)).replace(/[^\d]/g, "");
      if (isNaN(Number(sanitizedSalary)) || Number(sanitizedSalary) <= 0) {
        newErrors.salary = 'الراتب يجب أن يكون رقمًا إيجابيًا';
      }
    }

    // التحقق من الوزن
    if (formData.weight && (isNaN(Number(formData.weight)) || Number(formData.weight) <= 0)) {
      newErrors.weight = 'الوزن يجب أن يكون رقمًا صحيحًا';
    }

    // التحقق من الطول
    if (formData.height && (isNaN(Number(formData.height)) || Number(formData.height) <= 0)) {
      newErrors.height = 'الطول يجب أن يكون رقمًا صحيحًا';
    }

    // التحقق من عدد الأطفال
    if (formData.childrenCount && isNaN(Number(formData.childrenCount))) {
      newErrors.childrenCount = 'عدد الأطفال يجب أن يكون رقمًا';
    }

    // التحقق من أن صورة الوجه مطلوبة
    if (!formData.Picture || formData.Picture.trim() === '') {
      newErrors.Picture = 'صورة الوجه إجبارية';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    // التحقق من صحة البيانات قبل الحفظ
    if (!validateForm()) {
      setAlertModal({
        isOpen: true,
        type: 'warning',
        title: 'تحذير',
        message: 'يرجى تصحيح الأخطاء في النموذج قبل الحفظ'
      });
      return;
    }

    setSaving(true);
    try {
      // Ensure salary is numeric-only before saving (extra guard)
      const sanitizedSalary = normalizeToWesternDigits(String(formData.salary || "")).replace(/[^\d]/g, "");

      const dataToSend = {
        ...formData,
        salary: sanitizedSalary,
        childrenCount: formData.childrenCount ? Number(formData.childrenCount) : null,
        height: formData.height ? Number(formData.height) : null,
        weight: formData.weight ? Number(formData.weight) : null,
        // الصور: نرسل null لو فاضية علشان نقدر نمسحها
        Picture: formData.Picture ? formData.Picture : null,
        FullPicture: formData.FullPicture ? formData.FullPicture : null,
      };
      
      const response = await fetch(`/api/hommeaidfind?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) throw new Error('فشل في حفظ البيانات');
      
      // إعادة جلب البيانات لتحديث الـ logs
      await fetchPersonalInfo();
      
      setIsEditing(false);
      setErrors({});
      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'نجح',
        message: 'تم حفظ البيانات بنجاح'
      });
    } catch (error) {
      console.error('Error saving data:', error);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'خطأ',
        message: 'حدث خطأ أثناء حفظ البيانات'
      });
    } finally {
      setSaving(false);
    }
  };

  // --- دوال جلب البيانات ---

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data?.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const checkExistingOrder = async () => {
    try {
      const response = await fetch(`/api/check-existing-order?workerId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setHasExistingOrder(data.hasOrder);
      }
    } catch (error) {
      console.error('Error checking existing order:', error);
    }
  };

  const fetchofficesnames = async () => {
    try {
      const response = await fetch('/api/offices');
      if (response.ok) {
        const data = await response.json();
        setAllOffices(data.items);
        setFilteredOffices(data.items); // في البداية، اعرض كل المكاتب
      }
    } catch (error) {
      console.error('Error fetching offices:', error);
    }
  };

  const fetchNationalities = async () => {
    try {
      const res = await fetch('/api/nationalities');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.nationalities)) {
          setNationalities(data.nationalities);
        }
      }
    } catch (e) {
      console.error('Error fetching nationalities:', e);
    }
  };

  const fetchProfessions = async () => {
    try {
      const res = await fetch('/api/professions');
      if (res.ok) {
        const data = await res.json();
        setProfessions(data);
      }
    } catch (error) {
      console.error('Error fetching professions:', error);
    }
  };

  const handleFileChange = async (e: any, fileId: any) => {};
  const handleButtonClick = (fileId: any) => {};

  const allowedHomemaidImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

  const compressImageIfNeeded = (file: File, maxBytes: number): Promise<File> => {
    if (file.size <= maxBytes) return Promise.resolve(file);
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const maxDim = 2048;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const mime = "image/jpeg";
        let quality = 0.85;
        const tryBlob = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("toBlob failed"));
                return;
              }
              if (blob.size <= maxBytes || quality <= 0.2) {
                const name = file.name.replace(/\.[^.]+$/, ".jpg");
                resolve(new File([blob], name, { type: mime }));
                return;
              }
              quality -= 0.15;
              tryBlob();
            },
            mime,
            quality
          );
        };
        tryBlob();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };
      img.src = url;
    });
  };

  const handleHomemaidImageChange = async (
    e: ChangeEvent<HTMLInputElement>,
    fieldId: "Picture" | "FullPicture",
    type: "profile" | "full"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setImageErrors((prev) => ({ ...prev, [fieldId]: "لم يتم اختيار صورة" }));
      setImageFileNames((prev) => ({ ...prev, [fieldId]: "" }));
      setErrors((prev) => ({ ...prev, [fieldId]: "" }));
      return;
    }

    const file = files[0];
    if (!allowedHomemaidImageTypes.includes(file.type)) {
      setImageErrors((prev) => ({ ...prev, [fieldId]: "نوع الصورة غير مدعوم (JPEG, PNG, JPG, WEBP فقط)" }));
      setImageFileNames((prev) => ({ ...prev, [fieldId]: "" }));
      setErrors((prev) => ({ ...prev, [fieldId]: "" }));
      return;
    }

    // Open crop modal instead of uploading directly
    const previewUrl = URL.createObjectURL(file);
    setCropModal({
      isOpen: true,
      imageSrc: previewUrl,
      fieldId: fieldId,
      uploadType: type,
      file: file,
    });
    setImageFileNames((prev) => ({ ...prev, [fieldId]: file.name }));
    // Reset crop box to defaults
    setCropBox({ x: 15, y: 15, size: 70 });

    // Reset input
    const ref = imageInputRefs[fieldId];
    if (ref?.current) ref.current.value = "";
  };

  // Simple image load handler
  const handlePreviewImageLoad = () => {
    const img = previewImageRef.current;
    if (img) {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    }
  };

  // Crop and upload image using canvas - SIMPLE VERSION
  const handleCropAndUpload = async () => {
    if (!previewImageRef.current || !cropModal.fieldId || !cropModal.uploadType) return;

    try {
      setImageUploading((prev) => ({ ...prev, [cropModal.fieldId!]: true }));
      setImageErrors((prev) => ({ ...prev, [cropModal.fieldId!]: "" }));
      setErrors((prev) => ({ ...prev, [cropModal.fieldId!]: "" }));

      const img = previewImageRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error("فشل في إنشاء canvas");

      // Calculate crop coordinates from percentage values
      const cropX = (cropBox.x / 100) * naturalSize.width;
      const cropY = (cropBox.y / 100) * naturalSize.height;
      const cropW = (cropBox.size / 100) * naturalSize.width;
      const cropH = (cropBox.size / 100) * naturalSize.height;
      
      canvas.width = cropW;
      canvas.height = cropH;
      
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });
      
      if (!blob) throw new Error("فشل في تحويل الصورة");

      // Compress if needed
      let fileToUpload = new File([blob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' });
      try {
        fileToUpload = await compressImageIfNeeded(fileToUpload, MAX_IMAGE_SIZE_BYTES);
      } catch (compressErr) {
        console.warn("Compression failed, using original:", compressErr);
      }

      // Get upload URL
      const res = await fetch(`/api/upload-homemaid-image?type=${cropModal.uploadType}`);
      if (!res.ok) throw new Error("فشل في الحصول على رابط الرفع");
      const { url, filePath } = await res.json();

      // Upload cropped image
      const uploadRes = await fetch(url, {
        method: "PUT",
        body: fileToUpload,
        headers: {
          "Content-Type": fileToUpload.type,
          "x-amz-acl": "public-read",
        },
      });

      if (!uploadRes.ok) throw new Error("فشل في رفع الصورة");

      // Update form data
      URL.revokeObjectURL(cropModal.imageSrc);
      setFormData((prev) => ({ ...prev, [cropModal.fieldId!]: filePath }));
      setImageErrors((prev) => ({ ...prev, [cropModal.fieldId!]: "" }));
      setErrors((prev) => ({ ...prev, [cropModal.fieldId!]: "" }));

      // Close crop modal and reset
      setCropModal({ isOpen: false, imageSrc: "", fieldId: null, uploadType: null, file: null });
      setCropBox({ x: 15, y: 15, size: 70 });
      setNaturalSize({ width: 0, height: 0 });
    } catch (err: any) {
      console.error("Error cropping and uploading image:", err);
      setImageErrors((prev) => ({ ...prev, [cropModal.fieldId!]: err?.message || "حدث خطأ أثناء قص ورفع الصورة" }));
    } finally {
      setImageUploading((prev) => ({ ...prev, [cropModal.fieldId!]: false }));
    }
  };

  const handleCloseCropModal = () => {
    URL.revokeObjectURL(cropModal.imageSrc);
    setCropModal({ isOpen: false, imageSrc: "", fieldId: null, uploadType: null, file: null });
    setCropBox({ x: 15, y: 15, size: 70 });
    setNaturalSize({ width: 0, height: 0 });
    if (cropModal.fieldId) {
      setImageFileNames((prev) => ({ ...prev, [cropModal.fieldId!]: "" }));
    }
  };

  const handleImageButtonClick = (fieldId: "Picture" | "FullPicture") => {
    const ref = imageInputRefs[fieldId];
    if (ref?.current) ref.current.click();
  };

  // --- دالة جلب بيانات العاملة ---
  const fetchPersonalInfo = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/hommeaidfind?id=${id}`);
      if (!response.ok) throw new Error("فشل في جلب البيانات");
      const data = await response.json();
      
      const birthInput = formatToInputDate(data.dateofbirth);
      const passportStartInput = formatToInputDate(data.passportStartDate || data.PassportStart || data.PassportStartDate);
      const passportEndInput = formatToInputDate(data.passportEndDate || data.PassportEnd || data.PassportEndDate);
      
      setFormData({
        Name: data.Name || "",
        Religion: data.Religion || "",
        professionId: data.professionId || "",
        Nationalitycopy: data.Nationalitycopy || "",
        maritalstatus: data.maritalstatus || "",

        Picture: extractImageUrl(data.Picture) || "",
        FullPicture: extractImageUrl(data.FullPicture) || "",
        
        childrenCount: data.childrenCount || data.ChildrenCount || data.children || "", 
        height: data.height || data.Height || "", 
        weight: data.weight || data.Weight || "",
        
        dateofbirth: birthInput,
        Passportnumber: data.Passportnumber || "",
        passportStartDate: passportStartInput,
        passportEndDate: passportEndInput,
        phone: data.phone || "",

        Education: data.Education || "",
        ArabicLanguageLeveL: data.ArabicLanguageLeveL || data.arabicLanguageLeveL || "",
        EnglishLanguageLevel: data.EnglishLanguageLevel || data.englishLanguageLevel || "",

        Experience: data.Experience || "",
        ExperienceYears: data.ExperienceYears || "",

        // المهارات
        washingLevel: data.washingLevel || data.WashingLevel || "",
        ironingLevel: data.ironingLevel || data.IroningLevel || "",
        cleaningLevel: data.cleaningLevel || data.CleaningLevel || "",
        cookingLevel: data.cookingLevel || data.CookingLevel || "",
        sewingLevel: data.sewingLevel || data.SewingLevel || "",
        childcareLevel: data.childcareLevel || data.ChildcareLevel || "", 
        babySitterLevel: data.babySitterLevel || data.BabySitterLevel || "", 
        elderlycareLevel: data.elderlycareLevel || data.ElderlycareLevel || "",
        // laundryLevel تم حذفه من هنا

        officeName: data.office?.office || "",
        salary: data.Salary || "",
        contractType: data.contractType || "recruitment",
        notes: data.notes || "",
        logs: data.logs || [],
      });
      
      // تحديث حالة الاعتماد
      setIsApproved(data.isApproved || false);
    } catch (error) {
      setError("حدث خطأ أثناء جلب البيانات");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- التأثير الرئيسي (Effect) لجلب بيانات العاملة ---
  useEffect(() => {
    if (id) {
      fetchPersonalInfo();
      checkExistingOrder();
      fetchClients();
      fetchofficesnames();
      fetchNationalities();
      fetchProfessions();
    }
  }, [id]);

  // تصفية المكاتب بناءً على الجنسية المختارة
  useEffect(() => {
    if (formData.Nationalitycopy && allOffices.length > 0) {
      const filtered = allOffices.filter(office => {
        const officeCountry = office.Country?.toLowerCase().trim() || '';
        const selectedNationality = formData.Nationalitycopy.toLowerCase().trim();
        return officeCountry === selectedNationality;
      });
      setFilteredOffices(filtered);
    } else if (allOffices.length > 0 && !formData.Nationalitycopy) {
      // إذا لم يكن هناك جنسية محددة، اعرض كل المكاتب
      setFilteredOffices(allOffices);
    }
  }, [formData.Nationalitycopy, allOffices]);

  const handleApprove = async () => {
    try {
      const response = await fetch(`/api/hommeaidfind?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true }),
      });
      if (!response.ok) throw new Error('فشل في اعتماد العاملة');
      setIsApproved(true);
      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'نجح',
        message: 'تم اعتماد العاملة بنجاح'
      });
      // إعادة جلب البيانات لتحديث الـ logs
      await fetchPersonalInfo();
    } catch (error) {
      console.error('Error approving worker:', error);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'خطأ',
        message: 'حدث خطأ أثناء اعتماد العاملة'
      });
    }
  };

  const handleBooking = async () => {
    if (!selectedClient) {
      setAlertModal({
        isOpen: true,
        type: 'warning',
        title: 'تحذير',
        message: 'يرجى اختيار عميل'
      });
      return;
    }
    try {
      const response = await fetch('/api/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: id, clientId: selectedClient }),
      });
      if (!response.ok) throw new Error('فشل في إنشاء الحجز');
      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'نجح',
        message: 'تم حجز العاملة بنجاح'
      });
      setShowBookingModal(false);
      setSelectedClient('');
      checkExistingOrder();
    } catch (error) {
      console.error('Error creating booking:', error);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'خطأ',
        message: 'حدث خطأ أثناء إنشاء الحجز'
      });
    }
  };

  // تحويل نوع التعاقد
  const handleConvertContractType = async () => {
    setIsConverting(true);
    try {
      // alert(formData.contractType);
      const newContractType = formData.contractType === "recruitment" ? "rental" : "recruitment"  ;// if(formData.contractType === "recruitment") will become rental because recruitment means recruitment and not rental means rental
      ;// if("empty") will become rental because empty means recruitment and not empty means rental
      
      const response = await fetch(`/api/hommeaidfind?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractType: newContractType }),
      });
      
      if (!response.ok) throw new Error('فشل في تحويل نوع التعاقد');
      
      setFormData(prev => ({ ...prev, contractType: newContractType }));
      setShowConvertModal(false);
      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'نجح',
        message: `تم التحويل بنجاح إلى ${newContractType === "recruitment" ? "استقدام" : "تأجير"}`
      });
      
      // إعادة جلب البيانات لتحديث الـ logs
      await fetchPersonalInfo();
    } catch (error) {
      console.error('Error converting contract type:', error);
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'خطأ',
        message: 'حدث خطأ أثناء تحويل نوع التعاقد'
      });
    } finally {
      setIsConverting(false);
    }
  };

  // حساب العمر
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "";
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString();
  };

  // تحويل المستوى إلى نجوم
  const getStars = (level: string) => {
    const levelMap: { [key: string]: number } = {
      "Expert - ممتاز": 5,
      "Advanced - جيد جداً": 4,
      "Intermediate - جيد": 3,
      "Beginner - مبتدأ": 2,
      "Non - لا تجيد": 1,
    };
    const stars = levelMap[level] || 0;
    return { filled: stars, empty: 5 - stars };
  };

  return (
    <Layout>
      {/* Print Styles */}
      <Head>
        <style>{`
          /* Hide print CV on screen */
          .print-cv-container {
            display: none;
          }
          
          @media print {
            /* Hide everything except print CV */
            body * {
              visibility: hidden;
            }
            .print-cv-container {
              display: block !important;
              visibility: visible !important;
              position: absolute;
              left: 0;
              top: 0;
              width: 210mm;
              min-height: 297mm;
              margin: 0;
              padding: 0;
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-cv-container * {
              visibility: visible !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: A4;
              margin: 0;
            }
          }
        `}</style>
      </Head>

      {/* ===== Print-Only CV Layout ===== */}
      <div className="print-cv-container" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
        <div style={{ 
          width: '210mm', 
          minHeight: '297mm', 
          margin: '0 auto', 
          background: 'white',
          padding: '8mm 10mm'
        }}>
          {/* Header with Logo and Title */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '3px solid #0d4f4f',
            paddingBottom: '10px',
            marginBottom: '15px'
          }}>
            <div style={{ textAlign: 'right' }}>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#0d4f4f',
                margin: 0 
              }}>
                السيرة الذاتية
              </h1>
              <p style={{ fontSize: '14px', color: '#666', margin: '4px 0 0' }}>CURRICULUM VITAE</p>
            </div>
            <div style={{ textAlign: 'left' }}>
              <img src="/coloredlogo.png" alt="Logo" style={{ height: '50px' }} onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
          </div>

          {/* Main Content Grid */}
          <div style={{ display: 'flex', gap: '15px' }}>
            {/* Right Side - Photo and Basic Info */}
            <div style={{ width: '35%' }}>
              {/* Photo */}
              <div style={{ 
                width: '100%',
                aspectRatio: '3/4',
                border: '2px solid #0d4f4f',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '12px',
                background: '#f5f5f5'
              }}>
                {formData.Picture ? (
                  <img 
                    src={formData.Picture} 
                    alt="صورة العاملة" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => e.currentTarget.src = '/images/img.jpeg'}
                  />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#999',
                    fontSize: '12px'
                  }}>
                    لا توجد صورة
                  </div>
                )}
              </div>

              {/* Name */}
              <div style={{ 
                background: '#0d4f4f', 
                color: 'white', 
                padding: '8px 12px',
                borderRadius: '6px',
                textAlign: 'center',
                marginBottom: '10px'
              }}>
                <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{formData.Name || 'الاسم'}</p>
              </div>

              {/* Quick Info */}
              <div style={{ 
                background: '#f8f9fa', 
                borderRadius: '6px', 
                padding: '10px',
                fontSize: '11px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                  <span style={{ color: '#666' }}>العمر:</span>
                  <span style={{ fontWeight: 'bold' }}>{calculateAge(formData.dateofbirth)} سنة</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                  <span style={{ color: '#666' }}>الديانة:</span>
                  <span style={{ fontWeight: 'bold' }}>{formData.Religion?.split(' - ')[1] || formData.Religion || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                  <span style={{ color: '#666' }}>الجنسية:</span>
                  <span style={{ fontWeight: 'bold' }}>{formData.Nationalitycopy || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                  <span style={{ color: '#666' }}>الحالة:</span>
                  <span style={{ fontWeight: 'bold' }}>{formData.maritalstatus?.split(' - ')[1] || formData.maritalstatus || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                  <span style={{ color: '#666' }}>عدد الأطفال:</span>
                  <span style={{ fontWeight: 'bold' }}>{formData.childrenCount || '0'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                  <span style={{ color: '#666' }}>الطول:</span>
                  <span style={{ fontWeight: 'bold' }}>{formData.height ? `${formData.height} سم` : '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>الوزن:</span>
                  <span style={{ fontWeight: 'bold' }}>{formData.weight ? `${formData.weight} كجم` : '-'}</span>
                </div>
              </div>

              {/* Salary Box */}
              <div style={{ 
                background: '#0d4f4f', 
                color: 'white', 
                padding: '10px',
                borderRadius: '6px',
                textAlign: 'center',
                marginTop: '10px'
              }}>
                <p style={{ fontSize: '10px', margin: '0 0 4px', opacity: 0.8 }}>الراتب الشهري</p>
                <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{formData.salary || '-'} ريال</p>
              </div>
            </div>

            {/* Left Side - Details */}
            <div style={{ width: '65%' }}>
              {/* Personal Information */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ 
                  background: '#0d4f4f', 
                  color: 'white', 
                  padding: '6px 12px',
                  borderRadius: '4px 4px 0 0',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}>
                  المعلومات الشخصية | Personal Information
                </div>
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                  padding: '10px',
                  fontSize: '11px'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '4px 8px', color: '#666', width: '30%' }}>تاريخ الميلاد:</td>
                        <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{getDate(formData.dateofbirth)}</td>
                        <td style={{ padding: '4px 8px', color: '#666', width: '25%' }}>رقم الجواز:</td>
                        <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{formData.Passportnumber || '-'}</td>
                      </tr>
                      <tr style={{ background: '#f9f9f9' }}>
                        <td style={{ padding: '4px 8px', color: '#666' }}>بداية الجواز:</td>
                        <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{getDate(formData.passportStartDate)}</td>
                        <td style={{ padding: '4px 8px', color: '#666' }}>نهاية الجواز:</td>
                        <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{getDate(formData.passportEndDate)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 8px', color: '#666' }}>رقم الجوال:</td>
                        <td style={{ padding: '4px 8px', fontWeight: 'bold' }} colSpan={3}>{formData.phone || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Education & Languages */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ 
                  background: '#0d4f4f', 
                  color: 'white', 
                  padding: '6px 12px',
                  borderRadius: '4px 4px 0 0',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}>
                  التعليم واللغات | Education & Languages
                </div>
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                  padding: '10px',
                  fontSize: '11px'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '4px 8px', color: '#666', width: '25%' }}>التعليم:</td>
                        <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{formData.Education?.split(' - ')[1] || formData.Education || '-'}</td>
                      </tr>
                      <tr style={{ background: '#f9f9f9' }}>
                        <td style={{ padding: '4px 8px', color: '#666' }}>اللغة العربية:</td>
                        <td style={{ padding: '4px 8px' }}>
                          <span style={{ color: '#0d4f4f' }}>
                            {'★'.repeat(getStars(formData.ArabicLanguageLeveL).filled)}
                            {'☆'.repeat(getStars(formData.ArabicLanguageLeveL).empty)}
                          </span>
                          <span style={{ marginRight: '8px', fontSize: '10px', color: '#666' }}>
                            ({formData.ArabicLanguageLeveL?.split(' - ')[1] || formData.ArabicLanguageLeveL || '-'})
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 8px', color: '#666' }}>اللغة الإنجليزية:</td>
                        <td style={{ padding: '4px 8px' }}>
                          <span style={{ color: '#0d4f4f' }}>
                            {'★'.repeat(getStars(formData.EnglishLanguageLevel).filled)}
                            {'☆'.repeat(getStars(formData.EnglishLanguageLevel).empty)}
                          </span>
                          <span style={{ marginRight: '8px', fontSize: '10px', color: '#666' }}>
                            ({formData.EnglishLanguageLevel?.split(' - ')[1] || formData.EnglishLanguageLevel || '-'})
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Experience */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ 
                  background: '#0d4f4f', 
                  color: 'white', 
                  padding: '6px 12px',
                  borderRadius: '4px 4px 0 0',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}>
                  الخبرة | Experience
                </div>
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                  padding: '10px',
                  fontSize: '11px'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '4px 8px', color: '#666', width: '25%' }}>مستوى الخبرة:</td>
                        <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{formData.Experience?.split(' | ')[1] || formData.Experience || '-'}</td>
                      </tr>
                      <tr style={{ background: '#f9f9f9' }}>
                        <td style={{ padding: '4px 8px', color: '#666' }}>سنوات الخبرة:</td>
                        <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{formData.ExperienceYears || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Skills */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ 
                  background: '#0d4f4f', 
                  color: 'white', 
                  padding: '6px 12px',
                  borderRadius: '4px 4px 0 0',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}>
                  المهارات | Skills
                </div>
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                  padding: '10px',
                  fontSize: '11px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {[
                      { label: 'الطبخ', value: formData.cookingLevel, en: 'Cooking' },
                      { label: 'التنظيف', value: formData.cleaningLevel, en: 'Cleaning' },
                      { label: 'الغسيل', value: formData.washingLevel, en: 'Washing' },
                      { label: 'الكوي', value: formData.ironingLevel, en: 'Ironing' },
                      { label: 'الخياطة', value: formData.sewingLevel, en: 'Sewing' },
                      { label: 'رعاية الأطفال', value: formData.childcareLevel, en: 'Child Care' },
                      { label: 'رعاية الرضع', value: formData.babySitterLevel, en: 'Baby Sitting' },
                      { label: 'رعاية كبار السن', value: formData.elderlycareLevel, en: 'Elderly Care' },
                    ].map((skill, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '4px 8px',
                        background: idx % 2 === 0 ? '#f9f9f9' : 'white',
                        borderRadius: '3px'
                      }}>
                        <span style={{ color: '#666', fontSize: '10px' }}>{skill.label}</span>
                        <span style={{ color: '#0d4f4f', fontSize: '12px' }}>
                          {'★'.repeat(getStars(skill.value).filled)}
                          {'☆'.repeat(getStars(skill.value).empty)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Office Info */}
              <div style={{ 
                background: '#f0f7f7', 
                borderRadius: '6px', 
                padding: '10px',
                border: '1px solid #0d4f4f',
                fontSize: '11px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#666' }}>مكتب الاستقدام:</span>
                  <span style={{ fontWeight: 'bold', color: '#0d4f4f' }}>{formData.officeName || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            borderTop: '2px solid #0d4f4f',
            marginTop: '15px',
            paddingTop: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#666'
          }}>
            <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</span>
            <span>رقم الهوية: {id}</span>
          </div>
        </div>
      </div>

      {/* ===== Regular Web View (Hidden when printing) ===== */}
      <div className="p-6 bg-gray-50 min-h-screen font-tajawal relative no-print">
        {error && <div className="text-center text-red-500 mb-4">{error}</div>}
        
        {/* Spinner overlay عند الحفظ */}
        {saving && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-800"></div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6 justify-start" dir="rtl">

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            title="العودة للصفحة السابقة"
            aria-label="العودة للصفحة السابقة"
          >
            <FaArrowRight className="w-6 h-6 text-teal-800" />

                      <h1 className="text-3xl font-bold text-teal-800 text-right">المعلومات الشخصية</h1>
          </button>
        </div>

        {/* أيقونة الإعدادات مع القائمة المنسدلة */}
        <div className="flex justify-end mb-8 relative">
          {/* أزرار الحفظ والإلغاء عند التعديل */}
          {isEditing && (
            <div className="flex gap-2 ml-4">
              <button 
                className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition" 
                onClick={handleSave} 
                disabled={saving}
              >
                <FaSave /> حفظ
              </button>
              <button 
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition" 
                onClick={() => {
                   if (id) {
                     setErrors({});
                     fetchPersonalInfo();
                   }
                   setIsEditing(false);
                }}
              >
                <FaTimes /> إلغاء
              </button>
            </div>
          )}

          {/* أيقونة الإعدادات */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-3 bg-teal-800 text-white rounded-full hover:bg-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
              title="الإعدادات"
            >
              <FaCog className={`w-5 h-5 transition-transform duration-300 ${showSettingsMenu ? 'rotate-90' : ''}`} />
            </button>

            {/* القائمة المنسدلة */}
            {showSettingsMenu && (
              <>
                {/* خلفية شفافة لإغلاق القائمة عند النقر خارجها */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowSettingsMenu(false)}
                />
                
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden" dir="rtl">
                  {/* اعتماد أو حجز */}
                  {!hasExistingOrder && (
                    !isApproved ? (
                      <button
                        onClick={() => {
                          handleApprove();
                          setShowSettingsMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-800 transition-colors text-right"
                      >
                        <FaCheck className="w-4 h-4 text-teal-600" />
                        <span>اعتماد</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowBookingModal(true);
                          setShowSettingsMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-800 transition-colors text-right"
                      >
                        <FaCheck className="w-4 h-4 text-teal-600" />
                        <span>حجز</span>
                      </button>
                    )
                  )}

                  {/* طباعة */}
                  <button
                    onClick={() => {
                      handlePrint();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-800 transition-colors text-right border-t border-gray-100"
                  >
                    <FaPrint className="w-4 h-4 text-teal-600" />
                    <span>طباعة</span>
                  </button>

                  {/* تعديل */}
                  {!isEditing && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowSettingsMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-800 transition-colors text-right border-t border-gray-100"
                    >
                      <FaEdit className="w-4 h-4 text-teal-600" />
                      <span>تعديل</span>
                    </button>
                  )}

                  {/* تحويل */}
                  <button
                    onClick={() => {
                      setShowConvertModal(true);
                      setShowSettingsMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-800 transition-colors text-right border-t border-gray-100"
                  >
                    <FaExchangeAlt className="w-4 h-4 text-teal-600" />
                    <span>تحويل ({formData.contractType === "recruitment" ? "استقدام → تأجير" : "تأجير → استقدام"})</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ✅ الصور */}
        <section className="mb-8">
          <p className="text-xl font-semibold text-teal-800 mb-4 text-right">الصور</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: "Picture" as const, label: "الصورة الشخصية", uploadType: "profile" as const, required: true },
              { id: "FullPicture" as const, label: "صورة بالطول", uploadType: "full" as const, required: false },
            ].map((img) => {
              const url = (formData as any)[img.id] as string;
              const hasError = errors[img.id];
              return (
                <div key={img.id} className={`bg-white border ${hasError ? 'border-red-500' : 'border-gray-200'} rounded-lg p-4 shadow-sm`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-700 font-medium">
                      {img.label}
                      {img.required && isEditing && <span className="text-red-500 mr-1">*</span>}
                    </span>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-teal-800 hover:underline"
                      >
                        فتح
                      </a>
                    ) : null}
                  </div>

                  <div className="flex justify-end">
                    {url ? (
                      <img
                        src={url}
                        alt={img.label}
                        className="w-48 h-48 object-cover rounded-lg border border-gray-200 bg-gray-50"
                        onError={(e) => {
                          e.currentTarget.src = "/images/img.jpeg";
                        }}
                      />
                    ) : (
                      <div className="w-48 h-48 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-500 text-sm">
                        لا توجد صورة
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="mt-4">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        ref={imageInputRefs[img.id]}
                        className="hidden"
                        onChange={(e) => handleHomemaidImageChange(e, img.id, img.uploadType)}
                      />

                      <div className="flex justify-end gap-2">
                        {url ? (
                          <button
                            type="button"
                            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-200"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, [img.id]: "" }));
                              setImageFileNames((prev) => ({ ...prev, [img.id]: "" }));
                              setImageErrors((prev) => ({ ...prev, [img.id]: "" }));
                              setErrors((prev) => ({ ...prev, [img.id]: "" }));
                            }}
                          >
                            إزالة
                          </button>
                        ) : null}

                        <button
                          type="button"
                          className="px-3 py-2 text-sm bg-teal-800 text-white rounded-lg hover:bg-teal-900 disabled:opacity-60"
                          onClick={() => handleImageButtonClick(img.id)}
                          disabled={imageUploading[img.id]}
                        >
                          {imageUploading[img.id] ? "جاري الرفع..." : "تعديل الصورة"}
                        </button>
                      </div>

                      {imageFileNames[img.id] ? (
                        <div className="mt-2 text-right text-xs text-gray-600">
                          {imageFileNames[img.id]}
                        </div>
                      ) : null}

                      {imageErrors[img.id] ? (
                        <div className="mt-2 text-right text-xs text-red-600">
                          {imageErrors[img.id]}
                        </div>
                      ) : null}
                      {errors[img.id] && !imageErrors[img.id] ? (
                        <div className="mt-2 text-right text-xs text-red-600">
                          {errors[img.id]}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 1. المعلومات الشخصية */}
        <section className="mb-8">
          <p className="text-xl font-semibold text-teal-800 mb-4 text-right">المعلومات الشخصية</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "الاسم", name: "Name", value: formData.Name ,type: "text"},
              { label: "الديانة", name: "Religion", value: formData.Religion ,type: "select", options: religionOptions},
              { label: "المهنة", name: "professionId", value: formData.professionId, type: "select", isProfession: true },
              { label: "الجنسية", name: "Nationalitycopy", value: formData.Nationalitycopy ,type: "select", isNationality: true},
              { label: "الحالة الاجتماعية", name: "maritalstatus", value: formData.maritalstatus ,type: "select", options: maritalStatusOptions},
              
              { label: "عدد الأطفال", name: "childrenCount", value: formData.childrenCount, type: "number"},
              { label: "الطول (سم)", name: "height", value: formData.height, type: "number"},
              { label: "الوزن (كجم)", name: "weight", value: formData.weight, type: "number"},

              { label: "تاريخ الميلاد", name: "dateofbirth", value: formData.dateofbirth, type: isEditing ? "date" : "text"},
              { label: "رقم جواز السفر", name: "Passportnumber", value: formData.Passportnumber ,type: "text"},
              
              { label: "بداية الجواز", name: "passportStartDate", value: formData.passportStartDate, type: isEditing ? "date" : "text"},
              { label: "نهاية الجواز", name: "passportEndDate", value: formData.passportEndDate, type: isEditing ? "date" : "text"},

              { label: "رقم الجوال", name: "phone", value: formData.phone ,type: "text"},
            ].map((field: any) => (
              <div key={field.name}>
                <label className="block text-gray-700 text-right mb-1">{field.label}</label>
                
                {isEditing && field.type === "select" ? (
                  <div className="relative w-full">
                    <select
                      name={field.name}
                      value={field.value || ""}
                      onChange={handleChange}
                      dir="ltr"
                      style={{ backgroundImage: 'none', WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                      className={`w-full border ${errors[field.name] ? 'border-red-500' : 'border-gray-300'} rounded-lg py-3 pr-3 pl-10 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white`}
                    >
                      <option value="" disabled>اختر {field.label}</option>
                      {field.isNationality 
                        ? nationalities.map((nat) => <option key={nat.id} value={nat.Country}>{nat.Country}</option>)
                        : field.isProfession
                        ? professions.map((prof) => <option key={prof.id} value={prof.id}>{prof.name}</option>)
                        : field.options?.map((option: string) => <option key={option} value={option}>{option}</option>)
                      }
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                    {errors[field.name] && <p className="text-red-500 text-xs mt-1 text-right">{errors[field.name]}</p>}
                  </div>
                ) : (
                  <>
                    <input
                      type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                      name={field.name}
                      value={
                        field.isProfession
                          ? professions.find((p) => p.id === Number(field.value))?.name || ""
                          : field.value || ""
                      }
                      onChange={field.type === "date" ? handleChangeDate : handleChange}
                      readOnly={!isEditing}
                      dir={field.name === "phone" ? "ltr" : undefined}
                      className={`w-full border ${errors[field.name] ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 ${isEditing ? "bg-white" : "bg-gray-100"}`}
                    />
                    {errors[field.name] && <p className="text-red-500 text-xs mt-1 text-right">{errors[field.name]}</p>}
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 2. التعليم */}
        <section className="mb-8">
          <p className="text-xl font-semibold text-teal-800 mb-4 text-right">التعليم</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "التعليم", name: "Education", value: formData.Education, type: "select", options: educationOptions },
              { label: "اللغة العربية", name: "ArabicLanguageLeveL", value: formData.ArabicLanguageLeveL, type: "select", options: skillLevels },
              { label: "اللغة الإنجليزية", name: "EnglishLanguageLevel", value: formData.EnglishLanguageLevel, type: "select", options: skillLevels },
            ].map((field) => (
               <div key={field.name}>
                <label className="block text-gray-700 text-right mb-1">{field.label}</label>
                {isEditing && field.type === "select" ? (
                  <div className="relative w-full">
                    <select
                      name={field.name}
                      value={field.value || ""}
                      onChange={handleChange}
                      dir="ltr"
                      style={{ backgroundImage: 'none', WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                      className={`w-full border ${errors[field.name] ? 'border-red-500' : 'border-gray-300'} rounded-lg py-3 pr-3 pl-10 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white`}
                    >
                      <option value="" disabled>اختر {field.label}</option>
                      {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                    {errors[field.name] && <p className="text-red-500 text-xs mt-1 text-right">{errors[field.name]}</p>}
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      name={field.name}
                      value={field.value || ""}
                      readOnly={!isEditing}
                      className={`w-full border ${errors[field.name] ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 text-gray-700 text-right focus:outline-none bg-gray-100`}
                    />
                    {errors[field.name] && <p className="text-red-500 text-xs mt-1 text-right">{errors[field.name]}</p>}
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 3. الخبرة */}
        <section className="mb-8">
          <p className="text-xl font-semibold text-teal-800 mb-4 text-right">الخبرة</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-right mb-1">الخبرة</label>
              {isEditing ? (
                <div className="relative w-full">
                  <select
                    name="Experience"
                    value={formData.Experience || ""}
                    onChange={handleExperienceChange}
                    dir="ltr"
                    style={{ backgroundImage: 'none', WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                    className={`w-full border ${errors.Experience ? 'border-red-500' : 'border-gray-300'} rounded-lg py-3 pr-3 pl-10 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white`}
                  >
                    <option value="">اختر الخبرة</option>
                    {experienceOptions.map((exp) => <option key={exp} value={exp}>{exp}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                  {errors.Experience && <p className="text-red-500 text-xs mt-1 text-right">{errors.Experience}</p>}
                </div>
              ) : (
                <input type="text" value={formData.Experience || ""} readOnly className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none bg-gray-100" />
              )}
            </div>
            <div>
              <label className="block text-gray-700 text-right mb-1">سنوات الخبرة (تلقائي)</label>
              <input
                type="text"
                name="ExperienceYears"
                value={formData.ExperienceYears || ""}
                readOnly={true}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none bg-gray-100 cursor-not-allowed"
              />
              {errors.ExperienceYears && <p className="text-red-500 text-xs mt-1 text-right">{errors.ExperienceYears}</p>}
            </div>
          </div>
        </section>

        {/* 4. المهارات (بدون laundryLevel) */}
        <section className="mb-8">
          <p className="text-xl font-semibold text-teal-800 mb-4 text-right">المهارات</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "الغسيل", name: "washingLevel", value: formData.washingLevel },
              { label: "الكوي", name: "ironingLevel", value: formData.ironingLevel },
              { label: "التنظيف", name: "cleaningLevel", value: formData.cleaningLevel },
              { label: "الطبخ", name: "cookingLevel", value: formData.cookingLevel },
              { label: "الخياطة", name: "sewingLevel", value: formData.sewingLevel },
              { label: "العناية بالأطفال", name: "childcareLevel", value: formData.childcareLevel },
              { label: "العناية بالرضع", name: "babySitterLevel", value: formData.babySitterLevel },
              { label: "رعاية كبار السن", name: "elderlycareLevel", value: formData.elderlycareLevel },
              // { label: "الغسيل والكي", name: "laundryLevel", value: formData.laundryLevel }, // تم الحذف
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-gray-700 text-right mb-1">{field.label}</label>
                {isEditing ? (
                  <div className="relative w-full">
                    <select
                      name={field.name}
                      value={field.value || ""}
                      onChange={handleChange}
                      dir="ltr"
                      style={{ backgroundImage: 'none', WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                      className={`w-full border ${errors[field.name] ? 'border-red-500' : 'border-gray-300'} rounded-lg py-3 pr-3 pl-10 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white`}
                    >
                      <option value="">اختر المستوى</option>
                      {skillLevels.map(level => <option key={level} value={level}>{level}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                    {errors[field.name] && <p className="text-red-500 text-xs mt-1 text-right">{errors[field.name]}</p>}
                  </div>
                ) : (
                  <>
                    <input type="text" name={field.name} value={field.value || ""} readOnly className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none bg-gray-100" />
                    {errors[field.name] && <p className="text-red-500 text-xs mt-1 text-right">{errors[field.name]}</p>}
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 5. الراتب والمكتب */}
        <section className="mb-8">
          <p className="text-xl font-semibold text-teal-800 mb-4 text-right">اسم المكتب</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "اسم المكتب", name: "officeName", value: formData.officeName },
              { label: "الراتب", name: "salary", value: formData.salary },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-gray-700 text-right mb-1">{field.label}</label>
                {field.label === "اسم المكتب" && isEditing ? (
                  <div className="relative w-full">
                    <select 
                      name={field.name} 
                      value={field.value || ""} 
                      onChange={handleChange} 
                      dir="ltr" 
                      disabled={!formData.Nationalitycopy}
                      style={{ backgroundImage: 'none', WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }} 
                      className="w-full border border-gray-300 rounded-lg py-3 pr-3 pl-10 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled>
                        {formData.Nationalitycopy ? 'اختر المكتب' : 'يرجى اختيار الجنسية أولاً'}
                      </option>
                      {filteredOffices.map((office) => <option key={office.id} value={office.office}>{office.office}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                    {formData.Nationalitycopy && filteredOffices.length === 0 && (
                      <p className="text-yellow-600 text-xs mt-1 text-right">لا توجد مكاتب متاحة للجنسية المختارة</p>
                    )}
                  </div>
                ) : field.label === "اسم المكتب" ? (
                    <input type="text" value={field.value || ""} readOnly className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none bg-gray-100" />
                ) : (
                  <>
                    <input
                      type="text"
                      name={field.name}
                      value={field.value || ""}
                      onChange={handleChange}
                      readOnly={!isEditing}
                      inputMode={field.name === "salary" ? "numeric" : undefined}
                      pattern={field.name === "salary" ? "[0-9]*" : undefined}
                      className={`w-full border ${errors[field.name] ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 ${isEditing ? "bg-white" : "bg-gray-100"}`}
                    />
                    {errors[field.name] && <p className="text-red-500 text-xs mt-1 text-right">{errors[field.name]}</p>}
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 6. الملاحظات */}
        <section className="mb-8">
          <p className="text-xl font-semibold text-teal-800 mb-4 text-right">الملاحظات</p>
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={handleChange}
              readOnly={!isEditing}
              rows={6}
              placeholder="أضف ملاحظات هنا..."
              className={`w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 ${isEditing ? "bg-white" : "bg-gray-100"} resize-none`}
            />
            {errors.notes && <p className="text-red-500 text-xs mt-1 text-right">{errors.notes}</p>}
          </div>
        </section>

        {/* 7. سجل الأنشطة */}
        <section>
          <p className="text-xl font-semibold text-teal-800 mb-4 text-right">سجل الأنشطة</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white shadow-md rounded-lg">
              <thead>
                <tr className="bg-teal-800 text-white">
                  <th className="border border-gray-300 p-3 text-right">التاريخ</th>
                  <th className="border border-gray-300 p-3 text-right">الحالة</th>
                  <th className="border border-gray-300 p-3 text-right">التفاصيل</th>
                                    <th className="border border-gray-300 p-3 text-right">المستخدم</th>
                </tr>
              </thead>
              <tbody>
                {formData.logs.length > 0 ? (
                  formData.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3 text-right">{getDate(log.createdAt)}</td>
                      <td className="border border-gray-300 p-3 text-right">{log.Status || "غير متوفر"}</td>
                      <td className="border border-gray-300 p-3 text-right">{log.Details || "غير متوفر"}</td>
                      <td className="border border-gray-300 p-3 text-right">{log.userId || "غير متوفر"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center p-4 text-gray-500">لا توجد سجلات متاحة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* مودال الحجز */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
              <h3 className="text-xl font-bold text-teal-800 mb-4 text-right">حجز العاملة</h3>
              <div className="mb-4">
                <label className="block text-gray-700 text-right mb-2">اختر العميل</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg  text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200"
                >
                  <option value="">اختر عميل</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client?.fullname}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowBookingModal(false)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">إلغاء</button>
                <button onClick={handleBooking} className="px-4 py-2 bg-teal-800 text-white rounded-lg hover:bg-teal-900 transition">تأكيد الحجز</button>
              </div>
            </div>
          </div>
        )}

        {/* مودال تحويل نوع التعاقد */}
        {showConvertModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[450px] max-w-md mx-4" dir="rtl">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                  <FaExchangeAlt className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-teal-800">تحويل نوع التعاقد</h3>
                  <p className="text-sm text-gray-500">تغيير نوع التعاقد للعاملة</p>
                </div>
              </div>

              {/* Current Status */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">النوع الحالي:</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  formData.contractType === "recruitment" 
                    ? "bg-blue-100 text-blue-700" 
                    : "bg-orange-100 text-orange-700"
                }`}>
                  {formData.contractType === "recruitment" ? "استقدام" : "تأجير"}
                </div>
              </div>

              {/* Arrow and New Status */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className={`flex-1 text-center p-3 rounded-lg border-2 ${
                  formData.contractType === "recruitment" 
                    ? "border-blue-200 bg-blue-50" 
                    : "border-orange-200 bg-orange-50"
                }`}>
                  <p className="text-xs text-gray-500 mb-1">من</p>
                  <p className={`font-bold ${
                    formData.contractType === "recruitment" ? "text-blue-700" : "text-orange-700"
                  }`}>
                    {formData.contractType === "recruitment" ? "استقدام" : "تأجير"}
                  </p>
                </div>
                
                <FaArrowRight className="w-5 h-5 text-gray-400 transform rotate-180" />
                
                <div className={`flex-1 text-center p-3 rounded-lg border-2 ${
                  formData.contractType === "recruitment" 
                    ? "border-orange-200 bg-orange-50" 
                    : "border-blue-200 bg-blue-50"
                }`}>
                  <p className="text-xs text-gray-500 mb-1">إلى</p>
                  <p className={`font-bold ${
                    formData.contractType === "recruitment" ? "text-orange-700" : "text-blue-700"
                  }`}>
                    {formData.contractType === "recruitment" ? "تأجير" : "استقدام"}
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-yellow-800 text-center">
                  هل أنت متأكد من تحويل نوع التعاقد؟
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setShowConvertModal(false)} 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  disabled={isConverting}
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleConvertContractType} 
                  className="px-4 py-2 bg-teal-800 text-white rounded-lg hover:bg-teal-900 transition flex items-center gap-2"
                  disabled={isConverting}
                >
                  {isConverting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>جاري التحويل...</span>
                    </>
                  ) : (
                    <>
                      <FaExchangeAlt className="w-4 h-4" />
                      <span>تأكيد التحويل</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* مودال التنبيهات */}
        <AlertModal
          isOpen={alertModal.isOpen}
          onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
          type={alertModal.type}
          title={alertModal.title}
          message={alertModal.message}
        />
      </div>
      {/* Crop Modal - Simple Version with Sliders */}
      {cropModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-teal-800 text-white">
              <h2 className="text-xl font-bold">
                {cropModal.fieldId === "Picture" ? "✂️ قص الصورة الشخصية" : "✂️ قص صورة بالطول"}
              </h2>
              <button
                onClick={handleCloseCropModal}
                className="text-white hover:bg-teal-700 p-2 rounded-full transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Image Preview with Crop Box */}
            <div className="p-6 bg-gray-900 flex justify-center items-center min-h-[350px]">
              <div className="relative inline-block">
                {/* The image */}
                <img
                  ref={previewImageRef}
                  src={cropModal.imageSrc}
                  alt="صورة للقص"
                  onLoad={handlePreviewImageLoad}
                  className="max-w-full max-h-[300px] block"
                  style={{ display: naturalSize.width > 0 ? 'block' : 'none' }}
                />
                
                {/* Dark overlay */}
                {naturalSize.width > 0 && (
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-60 pointer-events-none"
                    style={{
                      clipPath: `polygon(
                        0% 0%, 0% 100%, 
                        ${cropBox.x}% 100%, 
                        ${cropBox.x}% ${cropBox.y}%, 
                        ${cropBox.x + cropBox.size}% ${cropBox.y}%, 
                        ${cropBox.x + cropBox.size}% ${cropBox.y + cropBox.size}%, 
                        ${cropBox.x}% ${cropBox.y + cropBox.size}%, 
                        ${cropBox.x}% 100%, 
                        100% 100%, 100% 0%
                      )`
                    }}
                  />
                )}
                
                {/* Crop box indicator */}
                {naturalSize.width > 0 && (
                  <div 
                    className="absolute border-4 border-white pointer-events-none"
                    style={{
                      left: `${cropBox.x}%`,
                      top: `${cropBox.y}%`,
                      width: `${cropBox.size}%`,
                      height: `${cropBox.size}%`,
                      boxShadow: '0 0 0 2px rgba(0,150,150,0.8), inset 0 0 20px rgba(255,255,255,0.1)'
                    }}
                  >
                    {/* Grid lines */}
                    <div className="absolute inset-0">
                      <div className="absolute top-1/3 left-0 right-0 border-t border-white border-dashed opacity-50"></div>
                      <div className="absolute top-2/3 left-0 right-0 border-t border-white border-dashed opacity-50"></div>
                      <div className="absolute left-1/3 top-0 bottom-0 border-r border-white border-dashed opacity-50"></div>
                      <div className="absolute left-2/3 top-0 bottom-0 border-r border-white border-dashed opacity-50"></div>
                    </div>
                  </div>
                )}
                
                {/* Loading state */}
                {naturalSize.width === 0 && (
                  <div className="flex flex-col items-center justify-center p-10 text-white">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-lg">جاري تحميل الصورة...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            {naturalSize.width > 0 && (
              <div className="p-6 bg-gray-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* X Position - ltr so horizontal slider drags correctly in RTL page */}
                  <div dir="ltr" className="text-right">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الموضع الأفقي: {cropBox.x}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={Math.max(0, 100 - cropBox.size)}
                      value={cropBox.x}
                      onChange={(e) => setCropBox(prev => ({ ...prev, x: Number(e.target.value) }))}
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>
                  
                  {/* Y Position */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الموضع الرأسي: {cropBox.y}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={Math.max(0, 100 - cropBox.size)}
                      value={cropBox.y}
                      onChange={(e) => setCropBox(prev => ({ ...prev, y: Number(e.target.value) }))}
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>
                  
                  {/* Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      حجم القص: {cropBox.size}%
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={cropBox.size}
                      onChange={(e) => {
                        const newSize = Number(e.target.value);
                        setCropBox(prev => ({
                          x: Math.min(prev.x, 100 - newSize),
                          y: Math.min(prev.y, 100 - newSize),
                          size: newSize
                        }));
                      }}
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>
                </div>
                
                {/* Quick presets */}
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setCropBox({ x: 0, y: 0, size: 100 })}
                    className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  >
                    كامل الصورة
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropBox({ x: 25, y: 25, size: 50 })}
                    className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  >
                    وسط 50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropBox({ x: 15, y: 15, size: 70 })}
                    className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  >
                    وسط 70%
                  </button>
                  <button
                    type="button"
                    onClick={() => setCropBox({ x: 0, y: 0, size: 50 })}
                    className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  >
                    أعلى يمين
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 p-4 border-t border-gray-200 bg-white">
              <button
                onClick={handleCloseCropModal}
                className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                إلغاء
              </button>
              <button
                onClick={handleCropAndUpload}
                disabled={imageUploading[cropModal.fieldId!] || naturalSize.width === 0}
                className="px-8 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
              >
                {imageUploading[cropModal.fieldId!] ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الرفع...
                  </>
                ) : (
                  <>
                    <FaCheck className="w-4 h-4" />
                    قص وحفظ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default HomeMaidInfo;