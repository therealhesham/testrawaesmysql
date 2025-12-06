import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { FaFilePdf, FaPrint, FaSave, FaUser, FaGraduationCap, FaBriefcase, FaTools, FaDollarSign, FaFileAlt, FaMagic } from "react-icons/fa";

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
  const [formData, setFormData] = useState({
    Name: "",
    Religion: "",
    Nationalitycopy: "",
    maritalstatus: "",
    
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
    logs: [] as any[],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExistingOrder, setHasExistingOrder] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // قوائم البيانات الخارجية
  const [nationalities, setNationalities] = useState<Array<{ id: number; Country: string }>>([]);
  const [officesnames, setOfficesnames] = useState<any[]>([]);
  
  // حالة الملفات
  const [fileNames, setFileNames] = useState<{ [key: string]: string }>({
    travelTicket: '',
    passportcopy: '',
  });

  const fileInputRefs = {
    travelTicket: useRef<HTMLInputElement>(null),
    passportcopy: useRef<HTMLInputElement>(null),
  };

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

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
  };

  const handleExportPDF = () => {
    router.push(`/admin/homemaidinfo?id=${id}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!formData.dateofbirth) {
        alert('يرجى إدخال تاريخ الميلاد');
        setSaving(false);
        return;
      }
      
      const dataToSend = {
        ...formData,
        childrenCount: formData.childrenCount ? Number(formData.childrenCount) : null,
        height: formData.height ? Number(formData.height) : null,
        weight: formData.weight ? Number(formData.weight) : null,
      };
      
      const response = await fetch(`/api/hommeaidfind?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) throw new Error('فشل في حفظ البيانات');
      
      setIsEditing(false);
      alert('تم حفظ البيانات بنجاح');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('حدث خطأ أثناء حفظ البيانات');
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
        setOfficesnames(data.items);
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

  const handleFileChange = async (e: any, fileId: any) => {};
  const handleButtonClick = (fileId: any) => {};

  // --- التأثير الرئيسي (Effect) لجلب بيانات العاملة ---
  useEffect(() => {
    if (id) {
      const fetchPersonalInfo = async () => {
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
            Nationalitycopy: data.Nationalitycopy || "",
            maritalstatus: data.maritalstatus || "",
            
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
            logs: data.logs || [],
          });
        } catch (error) {
          setError("حدث خطأ أثناء جلب البيانات");
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchPersonalInfo();
      checkExistingOrder();
      fetchClients();
      fetchofficesnames();
      fetchNationalities();
    }
  }, [id]);

  const handleBooking = async () => {
    if (!selectedClient) {
      alert('يرجى اختيار عميل');
      return;
    }
    try {
      const response = await fetch('/api/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: id, clientId: selectedClient }),
      });
      if (!response.ok) throw new Error('فشل في إنشاء الحجز');
      alert('تم حجز العاملة بنجاح');
      setShowBookingModal(false);
      setSelectedClient('');
      checkExistingOrder();
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('حدث خطأ أثناء إنشاء الحجز');
    }
  };

  return (
    <Layout>
      <div className="p-6 bg-gray-50 min-h-screen font-tajawal">
        {loading && <div className="text-center text-teal-800">جارٍ التحميل...</div>}
        {error && <div className="text-center text-red-500 mb-4">{error}</div>}

        <h1 className="text-3xl font-bold text-teal-800 mb-8 text-right">المعلومات الشخصية</h1>

        {/* الأزرار العلوية */}
        <div className="flex justify-end gap-4 mb-6">
          {!hasExistingOrder && (
            <button className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2 rounded-lg hover:bg-teal-800 transition" onClick={() => setShowBookingModal(true)}>
              حجز
            </button>
          )}
          <button className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition" onClick={handlePrint}>
            <FaPrint /> طباعة
          </button>

          {!isEditing ? (
            <button className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition" onClick={() => setIsEditing(true)}>
              تعديل
            </button>
          ) : (
            <div className="flex gap-2">
              <button className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition" onClick={handleSave} disabled={saving}>
                <FaSave /> {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition" 
                onClick={() => {
                   if (id) {
                     window.location.reload(); 
                   }
                   setIsEditing(false);
                }}
              >
                إلغاء
              </button>
            </div>
          )}
        </div>

        {/* 1. المعلومات الشخصية */}
        <section className="mb-8">
          <p className="text-xl font-semibold text-teal-800 mb-4 text-right">المعلومات الشخصية</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "الاسم", name: "Name", value: formData.Name ,type: "text"},
              { label: "الديانة", name: "Religion", value: formData.Religion ,type: "select", options: religionOptions},
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
                      className="w-full border border-gray-300 rounded-lg py-3 pr-3 pl-10 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
                    >
                      <option value="" disabled>اختر {field.label}</option>
                      {field.isNationality 
                        ? nationalities.map((nat) => <option key={nat.id} value={nat.Country}>{nat.Country}</option>)
                        : field.options?.map((option: string) => <option key={option} value={option}>{option}</option>)
                      }
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                ) : (
                  <input
                    type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                    name={field.name}
                    value={field.value || ""}
                    onChange={field.type === "date" ? handleChangeDate : handleChange}
                    readOnly={!isEditing}
                    className={`w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 ${isEditing ? "bg-white" : "bg-gray-100"}`}
                  />
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
                      className="w-full border border-gray-300 rounded-lg py-3 pr-3 pl-10 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
                    >
                      <option value="" disabled>اختر {field.label}</option>
                      {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                  </div>
                ) : (
                  <input
                    type="text"
                    name={field.name}
                    value={field.value || ""}
                    readOnly={!isEditing}
                    className={`w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none bg-gray-100`}
                  />
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
                    className="w-full border border-gray-300 rounded-lg py-3 pr-3 pl-10 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
                  >
                    <option value="">اختر الخبرة</option>
                    {experienceOptions.map((exp) => <option key={exp} value={exp}>{exp}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
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
                onChange={handleChange}
                readOnly={!isEditing}
                className={`w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 ${isEditing ? "bg-white" : "bg-gray-100"}`}
              />
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
                      className="w-full border border-gray-300 rounded-lg py-3 pr-3 pl-10 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
                    >
                      <option value="">اختر المستوى</option>
                      {skillLevels.map(level => <option key={level} value={level}>{level}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                  </div>
                ) : (
                  <input type="text" name={field.name} value={field.value || ""} readOnly className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none bg-gray-100" />
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
                    <select name={field.name} value={field.value || ""} onChange={handleChange} dir="ltr" style={{ backgroundImage: 'none', WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }} className="w-full border border-gray-300 rounded-lg py-3 pr-3 pl-10 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white">
                      <option value="">اختر المكتب</option>
                      {officesnames.map((office) => <option key={office.id} value={office.office}>{office.office}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                  </div>
                ) : field.label === "اسم المكتب" ? (
                    <input type="text" value={field.value || ""} readOnly className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none bg-gray-100" />
                ) : (
                  <input type="text" name={field.name} value={field.value || ""} onChange={handleChange} readOnly={!isEditing} className={`w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 ${isEditing ? "bg-white" : "bg-gray-100"}`} />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 6. سجل الأنشطة */}
        <section>
          <p className="text-xl font-semibold text-teal-800 mb-4 text-right">سجل الأنشطة</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white shadow-md rounded-lg">
              <thead>
                <tr className="bg-teal-800 text-white">
                  <th className="border border-gray-300 p-3 text-right">التاريخ</th>
                  <th className="border border-gray-300 p-3 text-right">الحالة</th>
                  <th className="border border-gray-300 p-3 text-right">التفاصيل</th>
                  <th className="border border-gray-300 p-3 text-right">السبب</th>
                </tr>
              </thead>
              <tbody>
                {formData.logs.length > 0 ? (
                  formData.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3 text-right">{getDate(log.createdAt)}</td>
                      <td className="border border-gray-300 p-3 text-right">{log.Status || "غير متوفر"}</td>
                      <td className="border border-gray-300 p-3 text-right">{log.Details || "غير متوفر"}</td>
                      <td className="border border-gray-300 p-3 text-right">{log.reason || "غير متوفر"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center p-4 text-gray-500">لا توجد سجلات متاحة</td>
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
      </div>
    </Layout>
  );
}

export default HomeMaidInfo;