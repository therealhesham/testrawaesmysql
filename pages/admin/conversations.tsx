import { useState } from 'react';

const MessageItem = ({ title, office, time }) => (
  <article className="flex justify-between items-center p-4 border border-[#1a4d4f] rounded-md bg-[#1a4d4f05] shadow-sm">
    <div className="flex flex-col gap-2 items-start">
      <h2 className="text-sm font-bold text-[#1f2937]">{title}</h2>
      <p className="text-sm text-[#6b7280]">{office}</p>
      <div className="flex items-center gap-1 text-xs text-[#6b7280]">
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{time}</span>
      </div>
    </div>
    <a href="#" className="px-8 py-1 text-sm text-[#030901] border border-[#1a4d4f] rounded-md hover:bg-[#1a4d4f] hover:text-white transition-colors">
      عرض
    </a>
  </article>
);

const MessageForm = ({ title, borderColor }) => (
  <div className={`bg-[#f2f3f5] border ${borderColor ? `border-[${borderColor}]` : 'border-[#e0e0e0]'} rounded-md p-10 flex flex-col gap-10`}>
    <h2 className="text-2xl font-normal text-right text-black">{title}</h2>
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-end gap-2">
        <label className="text-xs text-[#1f2937]">المكتب</label>
        <div className="w-full bg-[#f7f8fa] border border-[#e0e0e0] rounded-md px-4 py-2 flex justify-between items-center cursor-pointer">
          <span className="text-xs text-[#6b7280]">اختر المكتب</span>
          <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <label className="text-xs text-[#1f2937]">العنوان</label>
        <input type="text" className="w-full bg-[#f7f8fa] border border-[#e0e0e0] rounded-md px-4 py-2 text-xs text-right text-[#6b7280]" placeholder="ادخل عنوان الرسالة" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <label className="text-xs text-[#1f2937]">الرسالة</label>
        <textarea className="w-full bg-[#f7f8fa] border border-[#e0e0e0] rounded-md px-4 py-4 text-xs text-right text-[#6b7280] resize-y h-28" placeholder="ادخل تفاصيل الرسالة" />
      </div>
    </div>
    <div className="flex justify-center gap-4">
      <button className="px-4 py-2 text-base text-[#1f2937] border border-[#1a4d4f] rounded-md bg-transparent">الغاء</button>
      <button className="px-4 py-2 text-base text-[#f7f8fa] bg-[#1a4d4f] rounded-md">ارسال</button>
    </div>
  </div>
);

const MessageDetails = () => (
  <div className="bg-[#f2f3f5] border border-[#e0e0e0] rounded-md p-10 flex flex-col gap-10">
    <h2 className="text-2xl font-normal text-right text-black">تفاصيل الرسالة</h2>
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-end gap-2">
        <label className="text-xs text-[#1f2937]">المكتب</label>
        <div className="w-full bg-[#f2f3f5] border border-[#e0e0e0] rounded-md px-4 py-3 text-xs text-[#1f2937]">المكتب الاول</div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <label className="text-xs text-[#1f2937]">العنوان</label>
        <div className="w-full bg-[#f2f3f5] border border-[#e0e0e0] rounded-md px-4 py-3 text-xs text-[#1f2937]">استفسار حول موعد وصول العاملة</div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <label className="text-xs text-[#1f2937]">الرسالة</label>
        <div className="w-full bg-[#f2f3f5] border border-[#e0e0e0] rounded-md px-4 py-3 text-xs text-[#1f2937] min-h-28 leading-5">
          نرجو تزويدنا بموعد وصول العاملة ماريا جوزيف رقم جواز P12345678، حيث تم الانتهاء من جميع إجراءات النقل والدفع بتاريخ 05/08/2025.
          يرجى التأكيد على موعد الوصول أو تزويدنا بأي مستجدات.
        </div>
      </div>
    </div>
    <div className="flex justify-center">
      <button className="px-4 py-2 text-base text-[#f7f8fa] bg-[#1a4d4f] rounded-md">اغلاق</button>
    </div>
  </div>
);

const EmailList = () => (
  <div className="bg-white border border-[#e0e0e0] rounded-lg shadow-sm overflow-hidden">
    <div className="p-5 flex justify-between items-center border-b border-[#e0e0e0]">
      <h1 className="text-3xl font-normal text-[#000000]">قائمة البريد الالكتروني</h1>
      <button className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-[#1a4d4f] rounded-md">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>اضافة بريد</span>
      </button>
    </div>
    <div className="p-5 flex justify-between items-center flex-wrap gap-4 border-b border-[#e0e0e0]">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-[#f7f8fa] border border-[#e0e0e0] rounded-md px-3 py-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="بحث" className="bg-transparent border-none outline-none text-sm text-[#6b7280]" />
        </div>
        <div className="flex items-center gap-2 bg-[#f7f8fa] border border-[#e0e0e0] rounded-md px-3 py-2 text-sm text-[#6b7280]">
          <span>القسم</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="flex items-center gap-2 bg-[#f7f8fa] border border-[#e0e0e0] rounded-md px-3 py-2 text-sm text-[#6b7280]">
          <span>كل الاعمدة</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <button className="px-4 py-2 text-sm text-white bg-[#1a4d4f] rounded-md">اعادة ضبط</button>
      </div>
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1 text-xs text-white bg-[#1a4d4f] rounded-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9l-7-7H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          PDF
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1 text-xs text-white bg-[#1a4d4f] rounded-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Excel
        </button>
      </div>
    </div>
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[100px_2fr_1.5fr_1.5fr_100px] min-w-[800px] bg-[#1a4d4f] text-white text-sm font-bold h-[51px] items-center px-5">
        <div className="text-center">#</div>
        <div className="text-right">البريد الالكتروني</div>
        <div className="text-right">القسم</div>
        <div className="text-right">اسم المستخدم</div>
        <div className="text-center">اجراءات</div>
      </div>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="grid grid-cols-[100px_2fr_1.5fr_1.5fr_100px] min-w-[800px] bg-[#f7f8fa] border-b border-[#e0e0e0] h-[51px] items-center px-5">
          <div className="text-center">#190</div>
          <div className="text-right">ahmed@gmail.com</div>
          <div className="text-right">الاستقدام</div>
          <div className="text-right">احمد الحربي</div>
          <div className="text-center">
            <svg className="w-5 h-5 mx-auto rotate-[-90deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </div>
        </div>
      ))}
    </div>
    <div className="p-5 flex justify-between items-center flex-wrap gap-4">
      <div className="flex items-center gap-1.5">
        <a href="#" className="px-2 py-0.5 min-w-5 h-4.5 flex items-center justify-center border border-[#e0e0e0] rounded-sm text-xs bg-[#f7f8fa]">التالي</a>
        <a href="#" className="px-2 py-0.5 min-w-5 h-4.5 flex items-center justify-center border border-[#e0e0e0] rounded-sm text-xs bg-[#f7f8fa]">3</a>
        <a href="#" className="px-2 py-0.5 min-w-5 h-4.5 flex items-center justify-center border border-[#e0e0e0] rounded-sm text-xs bg-[#f7f8fa]">2</a>
        <a href="#" className="px-2 py-0.5 min-w-5 h-4.5 flex items-center justify-center border border-[#1a4d4f] rounded-sm text-xs bg-[#1a4d4f] text-white">1</a>
        <a href="#" className="px-2 py-0.5 min-w-5 h-4.5 flex items-center justify-center border border-[#e0e0e0] rounded-sm text-xs bg-[#f7f8fa]">السابق</a>
      </div>
      <div className="text-base text-[#000000]">عرض 1- 8 من 25 نتيجة</div>
    </div>
  </div>
);

const EmailForm = ({ title, defaultEmail, defaultDepartment, defaultUsername }) => (
  <div className="bg-[#f2f3f5] border border-[#e0e0e0] rounded-md p-10 flex flex-col gap-10 max-w-[731px] w-full">
    <h2 className="text-2xl font-normal text-right text-black">{title}</h2>
    <div className="flex flex-col gap-4">
      <div className="flex gap-8 max-sm:flex-col">
        <div className="flex-1 flex flex-col items-end gap-2">
          <label className="text-xs text-[#1f2937]">البريد الالكتروني</label>
          <input type="text" className="w-full bg-[#f7f8fa] border border-[#e0e0e0] rounded-md px-4 py-2 text-xs text-right text-[#1f2937]" placeholder="ادخل البريد الالكتروني" defaultValue={defaultEmail || ''} />
        </div>
        <div className="flex-1 flex flex-col items-end gap-2 relative">
          <label className="text-xs text-[#1f2937]">القسم</label>
          <div className="w-full bg-[#f7f8fa] border border-[#e0e0e0] rounded-md px-4 py-2 flex justify-between items-center cursor-pointer">
            <span className={`text-xs ${defaultDepartment ? 'text-[#1f2937]' : 'text-[#6b7280]'}`}>{defaultDepartment || 'اختر القسم'}</span>
            <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="absolute top-[calc(100%+9px)] right-0 w-full bg-[#f7f8fa] border border-[#e0e0e0] rounded-md p-4 flex flex-col gap-3.5 z-10">
            <a href="#" className="text-sm text-[#1f2937] text-right">الموارد البشرية</a>
            <a href="#" className="text-sm text-[#1f2937] text-right">الاستقدام</a>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <label className="text-xs text-[#1f2937]">اسم المستخدم</label>
        <input type="text" className="w-full bg-[#f7f8fa] border border-[#e0e0e0] rounded-md px-4 py-2 text-xs text-right text-[#1f2937]" placeholder="ادخل اسم المستخدم" defaultValue={defaultUsername || ''} />
      </div>
    </div>
    <div className="flex gap-4 max-sm:flex-col max-sm:w-full">
      <button className="px-6 py-2 text-base text-[#1f2937] border border-[#1a4d4f] rounded-md bg-transparent max-sm:w-full">الغاء</button>
      <button className="px-6 py-2 text-base text-[#f7f8fa] bg-[#1a4d4f] rounded-md max-sm:w-full">{title.includes('تعديل') ? 'حفظ التعديل' : 'حفظ'}</button>
    </div>
  </div>
);

const DeleteEmailModal = () => (
  <div className="fixed inset-0 bg-[#232726] flex items-start justify-center pt-10 z-50">
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-[520px] w-full text-center">
      <div className="text-xl font-normal text-[#1f2937] mb-5">حذف بريد الكتروني</div>
      <div className="text-base text-[#1f2937] mb-8">
        هل أنت متأكد من حذف البريد الالكتروني<br />
        <span className="text-[#1a4d4f] font-medium">ahmed@gmail.com</span>؟
      </div>
      <div className="flex justify-center gap-5">
        <button className="px-6 py-2 text-base text-white bg-[#1a4d4f] rounded-md hover:bg-[#163e3f] transition-colors">تأكيد الحذف</button>
        <button className="px-6 py-2 text-base text-[#1a4d4f] border border-[#1a4d4f] rounded-md bg-white hover:bg-[#f2f3f5] transition-colors">الغاء</button>
      </div>
    </div>
  </div>
);

export default function Home() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <main className="max-w-7xl mx-auto p-6 flex flex-col gap-16 bg-[#f2f3f5] min-h-screen font-tajawal" dir="rtl">
      <section>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-normal text-[#000000]">سجل المراسلات</h1>
          <a href="#" className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-[#1a4d4f] rounded-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>ارسال رسالة</span>
          </a>
        </div>
        <div className="bg-white border border-[#e0e0e0] rounded-md p-6">
          <nav className="border-b border-[#e0e0e0] mb-6">
            <div className="flex gap-10">
              <a
                href="#"
                className={`pb-3 text-xs flex gap-1 items-baseline ${activeTab === 'all' ? 'text-[#1f2937] border-b-2 border-[#1f2937]' : 'text-[#6b7280]'}`}
                onClick={() => setActiveTab('all')}
              >
                الكل <span className={`text-[8px] ${activeTab === 'all' ? 'text-[#1f2937]' : 'text-[#6b7280]'}`}>12</span>
              </a>
              <a
                href="#"
                className={`pb-3 text-xs flex gap-1 items-baseline ${activeTab === 'inbox' ? 'text-[#1f2937] border-b-2 border-[#1f2937]' : 'text-[#6b7280]'}`}
                onClick={() => setActiveTab('inbox')}
              >
                الوارد <span className={`text-[8px] ${activeTab === 'inbox' ? 'text-[#1f2937]' : 'text-[#6b7280]'}`}>9</span>
              </a>
              <a
                href="#"
                className={`pb-3 text-xs flex gap-1 items-baseline ${activeTab === 'sent' ? 'text-[#1f2937] border-b-2 border-[#1f2937]' : 'text-[#6b7280]'}`}
                onClick={() => setActiveTab('sent')}
              >
                الصادر <span className={`text-[8px] ${activeTab === 'sent' ? 'text-[#1f2937]' : 'text-[#6b7280]'}`}>3</span>
              </a>
            </div>
          </nav>
          <div className="flex flex-col gap-4">
            {[...Array(6)].map((_, i) => (
              <MessageItem
                key={i}
                title="استفسار حول موعد وصول العاملة"
                office="المكتب: المكتب الاول"
                time="منذ ساعتين"
              />
            ))}
          </div>
          <nav className="flex justify-center gap-1.5 mt-8">
            <a href="#" className="px-2 py-0.5 min-w-5 h-4.5 flex items-center justify-center border border-[#e0e0e0] rounded-sm text-xs bg-[#f7f8fa]">التالي</a>
            <a href="#" className="px-2 py-0.5 min-w-5 h-4.5 flex items-center justify-center border border-[#e0e0e0] rounded-sm text-xs bg-[#f7f8fa]">3</a>
            <a href="#" className="px-2 py-0.5 min-w-5 h-4.5 flex items-center justify-center border border-[#e0e0e0] rounded-sm text-xs bg-[#f7f8fa]">2</a>
            <a href="#" className="px-2 py-0.5 min-w-5 h-4.5 flex items-center justify-center border border-[#1a4d4f] rounded-sm text-xs bg-[#1a4d4f] text-white">1</a>
            <a href="#" className="px-2 py-0.5 min-w-5 h-4.5 flex items-center justify-center border border-[#e0e0e0] rounded-sm text-xs bg-[#f7f8fa]">السابق</a>
          </nav>
        </div>
      </section>
      <section>
        <MessageForm title="اضافة رسالة" />
      </section>
      <section>
        <MessageForm title="ارسال رسالة" borderColor="#8a38f5" />
      </section>
      <section>
        <MessageDetails />
      </section>
      <section>
        <EmailList />
      </section>
      <section>
        <EmailForm title="اضافة بريد الكتروني" />
      </section>
      <section>
        <EmailForm title="تعديل بريد الكتروني" defaultEmail="ahmed@gmail.com" defaultDepartment="الاستقدام" defaultUsername="احمد الحربي" />
      </section>
      <section>
        {/* <DeleteEmailModal /> */}
      </section>6
    </main>
  );
}