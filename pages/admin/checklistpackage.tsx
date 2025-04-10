import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import prisma from "pages/api/globalprisma";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ChevronLeftIcon } from "@heroicons/react/solid"; // استيراد أيقونة الرجوع

export default function Checklist() {
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [guests, setGuests] = useState([]);
  const { register, handleSubmit, reset, setValue, getValues } = useForm();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(""); // State for the selected date

  // البحث في الـ API بناءً على الإدخال
  useEffect(() => {}, [router]);

  const onSubmit = async (data) => {
    try {
      // تأكد من إرسال التفاصيل التي أدخلها المستخدم إذا اختار "أخرى"
      mealOptions.forEach((meal) => {
        if (data[meal.id]?.option === "اخرى" && data[meal.id]?.otherDetails) {
          // إذا كان المستخدم قد أدخل نصًا في خانة "أخرى"
          data[meal.id].option = data[meal.id].otherDetails; // قم بتعيين القيمة التي أدخلها في خانة "أخرى"
        }
      });

      // إرسال البيانات إلى الـ API أو قاعدة البيانات
      const posting = await fetch("/api/checkinpackage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          checkDate: selectedDate, // Include the selected date in the data
        }),
      });
      if (posting.status == 200) {
        reset();

        router.push("/admin/checklisttable"); // إعادة التوجيه بعد الإرسال
      } else {
        alert("خطأ في الارسال");
      }
    } catch (error) {
      console.error("Error submitting check-in:", error);
    }
  };

  const mealOptions = [
    {
      id: "breakfast",
      label: "الإفطار",
      options: ["عادي", "لا يوجد", "اخرى"],
    },
    {
      id: "lunch",
      label: "الغداء",
      options: [
        "شاورما",
        "فاهيتا",
        "لا شيء",
        "برجر",
        "كنتاكي",
        "فطيرة",
        "بيتزا",
        "كبسة",
        "مندي",
        "مقلوبة",
        "الدجاج المقلي",
        "سمبوسة",
      ],
    },
    { id: "supper", label: "العشاء", options: ["عادي", "لا يوجد", "اخرى"] },
  ];

  const [extraMeal, setExtraMeal] = useState({
    breakfast: false,
    lunch: false,
    supper: false,
  });

  const handleMealChange = (mealId, value) => {
    if (value === "اخرى") {
      setExtraMeal((prev) => ({ ...prev, [mealId]: true }));
    } else {
      setExtraMeal((prev) => ({ ...prev, [mealId]: false }));
    }
  };
  const handleBack = () => {
    router.back(); // العودة إلى الصفحة السابقة
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12 w-full">
        <div className="relative py-3 sm:max-w-3xl sm:mx-auto w-full">
          <button
            onClick={handleBack}
            className="flex items-center px-4 py-2  bg-gray-500 text-white rounded hover:bg-gray-600 mb-4"
          >
            <ChevronLeftIcon className="w-5 h-5 mr-2" /> {/* أيقونة الرجوع */}
            رجوع
          </button>
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20 w-full">
            <h1 className="text-2xl font-bold mb-6 text-center">
              تسجيل في قائمة الاعاشة
            </h1>

            {/* اختيار تاريخ */}
            <div className="mb-6">
              <label className="font-medium">اختار التاريخ</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* قسم الوجبات - تم توسيعه */}
              <div className="space-y-4 w-full">
                <h3 className="font-semibold">حالة الوجبات</h3>
                {mealOptions.map((meal) => (
                  <div key={meal.id} className="space-y-2 w-full">
                    <label className="font-medium">{meal.label}</label>
                    <div className="flex flex-col space-y-2 w-full">
                      <select
                        {...register(`${meal.id}.option`)}
                        className="w-full p-2 border rounded-md"
                        onChange={(e) =>
                          handleMealChange(meal.id, e.target.value)
                        }
                      >
                        <option value="">اختر نوع الوجبة</option>
                        {meal.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {/* إضافة خانة إدخال عندما يتم اختيار "أخرى" */}
                      {extraMeal[meal.id] && (
                        <div className="mt-2">
                          <label className="font-medium">تفاصيل أخرى</label>
                          <input
                            {...register(`${meal.id}.otherDetails`)}
                            type="text"
                            className="w-full p-2 border rounded-md"
                            placeholder="أدخل تفاصيل أخرى"
                          />
                        </div>
                      )}
                      <div className="mt-2">
                        <label className="font-medium">تكلفة الوجبة</label>
                        <input
                          {...register(`${meal.id}.cost`)}
                          type="number"
                          className="w-full p-2 border rounded-md"
                          placeholder="أدخل التكلفة"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-semibold mb-2">الشكاوى</h3>
                <textarea
                  {...register("complaint")}
                  className="w-full p-2 border rounded-md"
                  placeholder="أدخل أي شكاوى..."
                  rows={4}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300"
              >
                إرسال
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
