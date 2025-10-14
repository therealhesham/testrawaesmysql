import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaFilePdf } from "react-icons/fa";

function HomeMaidInfo() {
  const router = useRouter();
  const { id } = router.query;

  // دالة لتنسيق التاريخ
  const getDate = (date) => {
    if (!date) return "غير متوفر";
    const currentDate = new Date(date);
    return `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
  };
const translateExperience = (field: string) => {
  switch (field) {
    case "trained_no_experience":
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
    name: "",
    religion: "",
    nationality: "",
    maritalStatus: "",
    childrenCount: "",
    dateOfBirth: "",
    passportNumber: "",
    phone: "",
    education: "",
    arabicLanguageLevel: "",
    englishLanguageLevel: "",
    experience: "",
    washingLevel: "",
    ironingLevel: "",
    cleaningLevel: "",
    cookingLevel: "",
    sewingLevel: "",
    childcareLevel: "",
    elderlycareLevel: "",
    officeName: "",
    salary: "",
    logs: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // معالجة التغييرات في الحقول
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // تصدير PDF
  const handleExportPDF = () => {
    router.push(`/admin/homemaidinfo?id=${id}`);
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
            name: data.Name || "",
            religion: data.Religion || "",
            nationality: data.office?.Country || "",
            maritalStatus: data.maritalStatus || "",
            childrenCount: data.childrenCount || "",
            dateOfBirth: data.dateofbirth || "",
            passportNumber: data.Passportnumber || "",
            phone: data.phone || "",
            education: data.Education || "",
            arabicLanguageLevel: data.ArabicLanguageLeveL || "",
            englishLanguageLevel: data.EnglishLanguageLevel || "",
            experience: data.Experience || "",
            washingLevel: data.washingLevel || "",
            experienceYears: data.ExperienceYears || "",
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
    }
  }, [id]);

  return (
    <Layout>
      <div className="p-6 bg-gray-50 min-h-screen font-tajawal">
        {loading && <div className="text-center text-teal-800">جارٍ التحميل...</div>}
        {error && <div className="text-center text-red-500 mb-4">{error}</div>}

        <h1 className="text-3xl font-bold text-teal-800 mb-8 text-right">المعلومات الشخصية</h1>

        {/* الأزرار */}
        <div className="flex justify-end gap-4 mb-6">
          <button
            className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2 rounded-lg hover:bg-teal-800 transition"
            onClick={() => router.push(`/admin/order-form?type=add-available&id=${id}`)}
          >
            حجز
          </button>
          <button
            className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2 rounded-lg hover:bg-teal-800 transition"
            onClick={handleExportPDF}
          >
            <FaFilePdf /> PDF
          </button>
        </div>

        {/* المعلومات الشخصية */}
        <section className="mb-8">
          <p className="text-xl font-semibold text-teal-800 mb-4 text-right">المعلومات الشخصية</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "الاسم", name: "name", value: formData.name },
              { label: "الديانة", name: "religion", value: formData.religion },
              { label: "الجنسية", name: "nationality", value: formData.nationality },
              { label: "الحالة الاجتماعية", name: "maritalStatus", value: formData.maritalStatus },
              { label: "عدد الأطفال", name: "childrenCount", value: formData.childrenCount },
              { label: "تاريخ الميلاد", name: "dateOfBirth", value: getDate(formData.dateOfBirth) },
              { label: "رقم جواز السفر", name: "passportNumber", value: formData.passportNumber },
              { label: "رقم الجوال", name: "phone", value: formData.phone },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-gray-700 text-right mb-1">{field.label}</label>
                <input
                  type="text"
                  name={field.name}
                  value={field.value || ""}
                  onChange={handleChange}
                  readOnly={field.name !== "nationality" && field.name !== "maritalStatus"} // تحديد الحقول القابلة للتعديل
                  className={`w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200 ${
                    field.name !== "nationality" && field.name !== "maritalStatus" ? "bg-gray-200 cursor-not-allowed" : ""
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
              { label: "التعليم", name: "education", value: formData.education },
              { label: "اللغة العربية", name: "arabicLanguageLevel", value: formData.arabicLanguageLevel },
              { label: "اللغة الإنجليزية", name: "englishLanguageLevel", value: formData.englishLanguageLevel },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-gray-700 text-right mb-1">{field.label}</label>
                <input
                  type="text"
                  name={field.name}
                  value={field.value || ""}
                  onChange={handleChange}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200"
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
              { label: "الخبرة", name: "experience", value: formData.experience },
              { label: "سنوات الخبرة", name: "experienceYears", value: formData.experienceYears },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-gray-700 text-right mb-1">{field.label}</label>
                <input
                  type="text"
                  name={field.name}
                  value={field.value || ""}
                  onChange={handleChange}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200"
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
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200"
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
                <input
                  type="text"
                  name={field.name}
                  value={field.value || ""}
                  onChange={handleChange}
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-700 text-right focus:outline-none focus:ring-2 focus:ring-teal-200"
                />
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
      </div>
    </Layout>
  );
}

export default HomeMaidInfo;