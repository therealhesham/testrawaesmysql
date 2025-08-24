import Layout from "example/containers/Layout";
import Head from "next/head";

export default function FormAr() {
  return (
    <>
      <Head>
        <title>طلب جديد حسب المواصفات</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
<Layout>
      <div dir="rtl" className="bg-gray-50 min-h-screen font-sans">
        <div className="max-w-4xl mx-auto p-6">
          <form className="bg-white shadow-lg rounded-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <h1 className="text-xl font-extrabold">طلب جديد حسب المواصفات</h1>
              <div className="flex gap-2 flex-wrap">
                <button type="button" className="bg-gray-50 text-gray-800 rounded-xl px-4 py-2 text-sm">
                  إلغاء
                </button>
                <button type="submit" className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm">
                  حفظ
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 bg-gray-50">
              {/* Fields */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-6 flex flex-col gap-2">
                  <label htmlFor="client_phone" className="font-bold text-sm">رقم العميل</label>
                  <input id="client_phone" name="client_phone" type="tel" placeholder="+966 55555555"
                    className="border border-gray-200 rounded-xl px-3 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200" />
                </div>
                <div className="col-span-12 md:col-span-6 flex flex-col gap-2">
                  <label htmlFor="client_name" className="font-bold text-sm">اسم العميل</label>
                  <input id="client_name" name="client_name" type="text" placeholder="ادخل اسم العميل"
                    className="border border-gray-200 rounded-xl px-3 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200" />
                </div>

                <div className="col-span-12 md:col-span-6 flex flex-col gap-2">
                  <label htmlFor="client_email" className="font-bold text-sm">ايميل العميل</label>
                  <input id="client_email" name="client_email" type="email" placeholder="example@gmail.com"
                    className="border border-gray-200 rounded-xl px-3 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200" />
                </div>
                <div className="col-span-12 md:col-span-6 flex flex-col gap-2">
                  <label htmlFor="client_city" className="font-bold text-sm">مدينة العميل</label>
                  <input id="client_city" name="client_city" type="text" placeholder="مدينة العميل"
                    className="border border-gray-200 rounded-xl px-3 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200" />
                </div>

                {/** Experience, Nationality, Religion */}
                <div className="col-span-12 md:col-span-4 flex flex-col gap-2">
                  <label htmlFor="experience_years" className="font-bold text-sm">سنوات الخبرة</label>
                  <select id="experience_years" name="experience_years"
                    className="border border-gray-200 rounded-xl px-3 py-2">
                    <option value="">اختر سنوات الخبرة</option>
                    <option>0-1 سنة</option>
                    <option>2-3 سنوات</option>
                    <option>4-5 سنوات</option>
                    <option>أكثر من 5 سنوات</option>
                  </select>
                </div>
                <div className="col-span-12 md:col-span-4 flex flex-col gap-2">
                  <label htmlFor="worker_nationality" className="font-bold text-sm">جنسية العاملة المطلوبة</label>
                  <select id="worker_nationality" name="worker_nationality"
                    className="border border-gray-200 rounded-xl px-3 py-2">
                    <option value="">اختر جنسية العاملة</option>
                    <option>الفلبين</option>
                    <option>إندونيسيا</option>
                    <option>كينيا</option>
                    <option>الهند</option>
                    <option>بنغلاديش</option>
                    <option>بلد آخر</option>
                  </select>
                </div>
                <div className="col-span-12 md:col-span-4 flex flex-col gap-2">
                  <label htmlFor="religion" className="font-bold text-sm">الديانة</label>
                  <select id="religion" name="religion"
                    className="border border-gray-200 rounded-xl px-3 py-2">
                    <option value="">اختر الديانة</option>
                    <option>مسلم</option>
                    <option>مسيحي</option>
                    <option>أخرى</option>
                  </select>
                </div>

                <div className="col-span-12 md:col-span-4 flex flex-col gap-2">
                  <label htmlFor="age" className="font-bold text-sm">العمر</label>
                  <select id="age" name="age"
                    className="border border-gray-200 rounded-xl px-3 py-2">
                    <option value="">اختر العمر</option>
                    <option>18-25</option>
                    <option>26-35</option>
                    <option>36-45</option>
                    <option>46+</option>
                  </select>
                </div>

                <div className="col-span-12 flex flex-col gap-2">
                  <label htmlFor="notes" className="font-bold text-sm">ملاحظات اضافية</label>
                  <textarea id="notes" name="notes" placeholder="ادخل اي ملاحظات او طلبات اخرى .........."
                    className="border border-gray-200 rounded-xl px-3 py-2 min-h-[120px] focus:border-blue-600 focus:ring-2 focus:ring-blue-200"></textarea>
                </div>
              </div>

              {/* Payment Method */}
              <div className="pt-4 border-t border-dashed border-gray-200 font-extrabold">طريقة الدفع المختارة</div>
              <div className="grid grid-cols-12 gap-4 mt-2">
                <div className="col-span-12 md:col-span-4">
                  <label className="text-xs text-gray-500">نوع الدفعات</label>
                  <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-xs">دفعتين</div>
                </div>
                <div className="col-span-12 md:col-span-4">
                  <label className="text-xs text-gray-500">طريقة السداد</label>
                  <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-xs">كاش</div>
                </div>
              </div>

              {/* Payments */}
              <div className="pt-4 border-t border-dashed border-gray-200 font-extrabold">المدفوعات</div>
              <div className="grid grid-cols-12 gap-4 mt-2">
                {[
                  { label: "المبلغ المتبقي", value: "10,000 SR" },
                  { label: "المبلغ المدفوع", value: "10,000 SR" },
                  { label: "المبلغ كامل", value: "20,000 SR" }
                ].map((item, idx) => (
                  <div key={idx} className="col-span-12 md:col-span-4">
                    <label className="font-bold text-sm">{item.label}</label>
                    <div className="flex justify-between items-center border border-gray-200 rounded-xl px-3 py-2 font-bold">
                      <span>{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-6 py-5 border-t bg-gray-50">
              <div className="flex items-center gap-3 flex-wrap">
                <strong>تحميل ملف العقد</strong>
                <input id="contract_file" name="contract_file" type="file"
                  className="border border-dashed border-gray-300 rounded-xl p-2" />
                <span className="text-xs text-gray-500">اختيار ملف</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button type="button" className="bg-gray-50 text-gray-800 rounded-xl px-4 py-2 text-sm">
                  إلغاء
                </button>
                <button type="submit" className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm">
                  حفظ
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      </Layout>
    </>
  );
}
