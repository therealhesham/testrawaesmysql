import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import prisma from "pages/api/globalprisma";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

export default function Checklist() {
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [guests, setGuests] = useState([]);
  const { register, handleSubmit, reset } = useForm();
  const router = useRouter();

  // البحث في الـ API بناءً على الإدخال
  useEffect(() => {
    if (!router) return;
    const fetchGuests = async () => {
      try {
        const res = await fetch(`/api/guests?search=${router.query.id}`);
        const data = await res.json();
        setGuests(data);
      } catch (error) {
        console.error("Error fetching guests:", error);
      }
    };
    fetchGuests();
  }, [router]);

  const onSubmit = async (data) => {
    try {
      await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          guestId: selectedGuest.id,
        }),
      });
      reset();

      router.push("/admin/checklisttable"); // إعادة التوجيه بعد الإرسال
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
    { id: "supper", label: "العشاء", options: ["عادي", "", "لا يوجد", "اخرى"] },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12 w-full">
        <div className="relative py-3 sm:max-w-3xl sm:mx-auto w-full">
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20 w-full">
            <h1 className="text-2xl font-bold mb-6 text-center">
              تسجيل في قائمة الاعاشة
            </h1>

            {/* اختيار الضيف مع البحث */}
            <div className="mb-6">
              <select
                className="w-full p-2 border rounded-md"
                onChange={(e) => {
                  const guest = guests.find(
                    (g) => g.id === parseInt(e.target.value)
                  );
                  setSelectedGuest(guest);
                }}
              >
                <option value="">اختر الضيف</option>
                {guests?.map((guest) => (
                  <option key={guest.id} value={guest.id}>
                    {guest.Order.HomeMaid?.Name}
                  </option>
                ))}
              </select>
            </div>

            {selectedGuest && (
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
                        >
                          <option value="">اختر نوع الوجبة</option>
                          {meal.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        {/* حقل التكلفة */}
                        <div className="mt-2">
                          <label className="font-medium">تكلفة الوجبة</label>
                          <input
                            {...register(`${meal.id}.cost`)}
                            type="number"
                            className="w-full p-2 border rounded-md"
                            placeholder="أدخل التكلفة"
                          />
                        </div>
                        {/* 
                        <textarea
                          {...register(`${meal.id}.notes`)}
                          className="w-full p-2 border rounded-md"
                          placeholder={`ملاحظات عن ${meal.label}...`}
                          rows={2}
                        /> */}
                      </div>
                    </div>
                  ))}
                </div>

                {/* <div>
                  <h3 className="font-semibold mb-2">تكاليف اضافية</h3>
                  <textarea
                    {...register("cost")}
                    className="w-full p-2 border rounded-md"
                    placeholder="التكلفة الإجمالية"
                    rows={2}
                  />
                </div> */}

                {/* قسم الشكاوى */}
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
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
