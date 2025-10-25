import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaFilePdf, FaPrint, FaSave } from "react-icons/fa";

function HomeMaidInfo() {
  const router = useRouter();
  const { id } = router.query;

  // دالة لتنسيق التاريخ
  const getDate = (date: any) => {
    if (!date) return "غير متوفر";
    const currentDate = new Date(date);
    return `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
  };
const translateExperience = (field: string) => {
  switch (field) {
    case "trained_no_Experience":
      return "مدرب بدون خبرة";
  case "good":
    return "جيد";
  case "very_good":
    return "جيد جدا";
  case "excellent":
    return "ممتاز";

case "beginner":
  return "مبتدئ";
case "intermediate":
  return "متوسط";
case "advanced":
  return "متقدم";
case "expert":
  return "خبير";
  }
}
  
  
// حالة البيانات مع إصلاح أسماء الحقول
  const [formData, setFormData] = useState({
    Name: "",
    Religion: "",
    Nationalitycopy: "",
    maritalstatus: "",
    // childrenCount: "",
    dateofbirth: "",
    Passportnumber: "",
    phone: "",
    Education: "",
    ArabicLanguageLeveL: "",
    EnglishLanguageLevel: "",
    Experience: "",
    ExperienceYears: "",
    washingLevel: "",
    ironingLevel: "",
    cleaningLevel: "",
    cookingLevel: "",
    sewingLevel: "",
    childcareLevel: "",
    elderlycareLevel: "",
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

  // معالجة التغييرات في الحقول
  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
const handleChangeDate = (e: any) => {
  setFormData({ ...formData, dateofbirth: e.target.value });
};

  // تصدير PDF
  const handleExportPDF = () => {
    router.push(`/admin/homemaidinfo?id=${id}`);
  };

  // طباعة الصفحة
  const handlePrint = () => {
    window.print();
  };

  // حفظ البيانات
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/hommeaidfind?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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

  // جلب العملاء
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

  // فحص وجود طلب مرتبط بالعاملة
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

  // جلب البيانات
  useEffect(() => {
    if (id) {
      const fetchPersonalInfo = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/hommeaidfind?id=${id}`);
          if (!response.ok) throw new Error("فشل في جلب البيانات");
          const data = await response.json();
          setFormData({
            Name: data.Name || "",
            Religion: data.Religion || "",
            Nationalitycopy: data.Nationalitycopy || "",
            maritalstatus: data.maritalstatus || "",
            // childrenCount: data.childrenCount || "",
            dateofbirth: new Date(data.dateofbirth).toLocaleDateString('ar-EG') || "",
            Passportnumber: data.Passportnumber || "",
            phone: data.phone || "",
            Education: data.Education || "",
            ArabicLanguageLeveL: data.ArabicLanguageLeveL || "",
            EnglishLanguageLevel: data.EnglishLanguageLevel || "",
            Experience: data.Experience || "",
            washingLevel: data.washingLevel || "",
            ExperienceYears: data.ExperienceYears || "",
            ironingLevel: data.ironingLevel || "",
            cleaningLevel: data.cleaningLevel || "",
            cookingLevel: data.cookingLevel || "",
            sewingLevel: data.sewingLevel || "",
            childcareLevel: data.childcareLevel || "",
            elderlycareLevel: data.elderlycareLevel || "",
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
    }
  }, [id]);
const [officesnames, setOfficesnames] = useState([]);

const fetchofficesnames = async () => {
  try {
    const response = await fetch('/api/offices');
    if (response.ok) {
      const data = await response.json();
      console.log(data.items);
      setOfficesnames(data.items);
    }
  } catch (error) {
    console.error('Error fetching offices:', error);
  }
}
useEffect(() => {
  fetchofficesnames();
}, []);
  // حجز العاملة
  const handleBooking = async () => {
    if (!selectedClient) {
      alert('يرجى اختيار عميل');
      return;
    }

    try {
      const response = await fetch('/api/create-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workerId: id,
          clientId: selectedClient,
        }),
      });

      if (!response.ok) throw new Error('فشل في إنشاء الحجز');

      alert('تم حجز العاملة بنجاح');
      setShowBookingModal(false);
      setSelectedClient('');
      checkExistingOrder(); // تحديث حالة الطلب
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

        {/* الأزرار */}
        <div className="flex justify-end gap-4 mb-6">
          {!hasExistingOrder && (
            <button
              className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2 rounded-lg hover:bg-teal-800 transition"
              onClick={() => setShowBookingModal(true)}
            >
              حجز
            </button>
          )}
          <button
            className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
            onClick={handlePrint}
          >
            <FaPrint /> طباعة
          </button>
          {/* <button
            className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2 rounded-lg hover:bg-teal-800 transition"
            onClick={handleExportPDF}
          >
            <FaFilePdf /> PDF
          </button> */}
          {!isEditing ? (
            <button
              className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
              onClick={() => setIsEditing(true)}
            >
              تعديل
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                onClick={handleSave}
                disabled={saving}
              >
                <FaSave /> {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                onClick={() => setIsEditing(false)}
              >
                إلغاء
              </button>
            </div>
          )}
        </div>

        {/* المعلومات الشخصية */}
        <section className="mb-8">
          <p className="text-xl font-semibold text-teal-800 mb-4 text-right">المعلومات الشخصية</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "الاسم", name: "Name", value: formData.Name ,type: "text"},
              { label: "الديانة", name: "Religion", value: formData.Religion ,type: "text"},
              { label: "الجنسية", name: "Nationalitycopy", value: formData.Nationalitycopy ,type: "text"},
              { label: "الحالة الاجتماعية", name: "maritalstatus", value: formData.maritalstatus ,type: "text"},
              // { label: "عدد الأطفال", name: "childrenCount", value: formData.childrenCount },
       { label: "تاريخ الميلاد", name: "dateofbirth", value: formData.dateofbirth, type: isEditing ? "date" : "text"},

              { label: "رقم جواز السفر", name: "Passportnumber", value: formData.Passportnumber ,type: "text"},
              { label: "رقم الجوال", name: "phone", value: formData.phone },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-gray-700 text-right mb-1">{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={field.value || ""}
                  onChange={field.type === "date" ? handleChangeDate : handleChange}
                  readOnly={!isEditing}
                  className={`w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 ${
                    isEditing ? "bg-white" : "bg-gray-100"
                  }`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* التعليم */}
        <section className="mb-8">
          <p className="text-xl font-semibold text-teal-800 mb-4 text-right">التعليم</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "التعليم", name: "Education", value: formData.Education },
              { label: "اللغة العربية", name: "ArabicLanguageLeveL", value: formData.ArabicLanguageLeveL },
              { label: "اللغة الإنجليزية", name: "EnglishLanguageLevel", value: formData.EnglishLanguageLevel },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-gray-700 text-right mb-1">{field.label}</label>
                <input
                  type="text"
                  name={field.name}
                  value={field.value || ""}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 ${
                    isEditing ? "bg-white" : "bg-gray-100"
                  }`}
                />
              </div>
            ))}
          </div>
        </section>










  {/* التعليم */}
        <section className="mb-8">
          <p className="text-xl font-semibold text-teal-800 mb-4 text-right">الخبرة</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "الخبرة", name: "Experience", value: formData.Experience },
              { label: "سنوات الخبرة", name: "ExperienceYears", value: formData.ExperienceYears },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-gray-700 text-right mb-1">{field.label}</label>
                <input
                  type="text"
                  name={field.name}
                  value={field.value || ""}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 ${
                    isEditing ? "bg-white" : "bg-gray-100"
                  }`}
                />
              </div>
            ))}
          </div>
        </section>
















        {/* المهارات */}
        <section className="mb-8">
          <p className="text-xl font-semibold text-teal-800 mb-4 text-right">المهارات</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "الغسيل", name: "washing", value: formData.washingLevel },
              { label: "الكوي", name: "ironing", value: formData.ironingLevel },
              { label: "التنظيف", name: "cleaning", value: formData.cleaningLevel },
              { label: "الطبخ", name: "cooking", value: formData.cookingLevel },
              { label: "الخياطة", name: "sewing", value: formData.sewingLevel },
              { label: "العناية بالأطفال", name: "childcare", value: formData.childcareLevel },
              { label: "رعاية كبار السن", name: "elderlyCare", value: formData.elderlycareLevel },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-gray-700 text-right mb-1">{field.label}</label>
                <input
                  type="text"
                  name={field.name}
                  value={translateExperience(field.value) || ""}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 ${
                    isEditing ? "bg-white" : "bg-gray-100"
                  }`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* اسم المكتب والراتب */}
        <section className="mb-8">
          <p className="text-xl font-semibold text-teal-800 mb-4 text-right">اسم المكتب</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "اسم المكتب", name: "officeName", value: formData.officeName },
              { label: "الراتب", name: "salary", value: formData.salary },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-gray-700 text-right mb-1">{field.label}</label>
                
                {field.label === "اسم المكتب" && <select
                  name={field.name}
                  value={field.value || ""}
                  onChange={handleChange}
                  // readOnly={!isEditing}
                  className={`w-full border border-gray-300 rounded-lg  text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 ${
                    isEditing ? "bg-white" : "bg-gray-100"
                  }`}
                  
                >

                  {officesnames.map((office) => (
                    <option key={office.id} value={office.office}>
                      {office.office}
                    </option>
                  ))}
                </select>}
                {field.label === "الراتب" && <input
                  type="text"
                  name={field.name}
                  value={field.value || ""}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`w-full border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 ${
                    isEditing ? "bg-white" : "bg-gray-100"
                  }`}
                />}
              </div>

              
            ))}
          </div>
        </section>

        {/* سجل الأنشطة */}
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
                    <td colSpan={3} className="text-center p-4 text-gray-500">
                      لا توجد سجلات متاحة
                    </td>
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
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleBooking}
                  className="px-4 py-2 bg-teal-800 text-white rounded-lg hover:bg-teal-900 transition"
                >
                  تأكيد الحجز
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default HomeMaidInfo;