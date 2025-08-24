import { DocumentDownloadIcon as DocumentDownload, DocumentTextIcon as DocumentText } from '@heroicons/react/outline';
import Layout from 'example/containers/Layout';
import { X } from 'lucide-react';
import { Calendar, Search } from 'lucide-react';
import { useState } from 'react';
import Style from "styles/Home.module.css"
// import { Search, Calendar, DocumentText, DocumentDownload, X } from 'react-heroicons/outline';
// Search
// Calendar
// DocumentTextIcon
// X
// DocumentDownloadIcon
const Modal = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 ${Style["tajawal-bold"]}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-[731px] w-full relative flex flex-col gap-10">
        <button onClick={onClose} className="absolute top-4 left-4 text-xl text-gray-800">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-normal text-black text-right">
          {type === 'add' ? 'إضافة محضر' : 'عرض المحضر'}
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-8 max-md:flex-col">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm text-gray-800">اسم العاملة</label>
              <div className="bg-gray-100 border border-gray-200 rounded-md p-3 flex items-center justify-start text-xs">
                MST RUMA AKTHER
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm text-gray-800">سبب الجلسة</label>
              <div className="bg-gray-100 border border-gray-200 rounded-md p-3 flex items-center justify-end text-sm">
                مطالبة رواتب
              </div>
            </div>
          </div>
          <div className="flex flex-row gap-8 max-md:flex-col">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm text-gray-800">وقت الجلسة</label>
              <div className="bg-gray-100 border border-gray-200 rounded-md p-3 flex items-center justify-end text-sm">
                3:40 PM
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm text-gray-800">تاريخ الجلسة</label>
              <div className="bg-gray-100 border border-gray-200 rounded-md p-3 flex items-center justify-end text-sm">
                4/7/2025
              </div>
            </div>
          </div>
          <div className="flex flex-row gap-8">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm text-gray-800">المحضر</label>
              <div className={`bg-gray-100 border border-gray-200 rounded-md p-3 min-h-[60px] flex items-start text-sm ${type === 'add' ? 'text-gray-500' : ''}`}>
                {type === 'add' ? 'ادخال المحضر هنا' : 'تحديد موعد جلسة المتابعة بتاريخ 20/08/2025.'}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-4 max-md:flex-col">
          <button onClick={onClose} className="w-[116px] h-[33px] max-md:w-full border border-teal-800 text-gray-800 rounded text-base font-inter">
            إلغاء
          </button>
          <button className="w-[116px] h-[33px] max-md:w-full bg-teal-800 border border-teal-800 text-gray-100 rounded text-base font-inter">
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [modalType, setModalType] = useState(null);

  const openModal = (type) => setModalType(type);
  const closeModal = () => setModalType(null);

  const tableData = [
    { id: 190, reason: 'مطالبة رواتب', name: 'MST RUMA AKTHER', date: '4/7/2025', time: '3:40 PM', report: 'لا يوجد', action: 'تسجيل' },
    { id: 190, reason: 'مطالبة رواتب', name: 'MST RUMA AKTHER', date: '4/7/2025', time: '3:40 PM', report: 'يوجد', action: 'عرض' },
    { id: 190, reason: 'مطالبة رواتب', name: 'MST RUMA AKTHER', date: '4/7/2025', time: '3:40 PM', report: 'لا يوجد', action: 'تسجيل' },
    { id: 190, reason: 'مطالبة رواتب', name: 'MST RUMA AKTHER', date: '4/7/2025', time: '3:40 PM', report: 'يوجد', action: 'عرض' },
    { id: 190, reason: 'مطالبة رواتب', name: 'MST RUMA AKTHER', date: '4/7/2025', time: '3:40 PM', report: 'لا يوجد', action: 'تسجيل' },
    { id: 190, reason: 'مطالبة رواتب', name: 'MST RUMA AKTHER', date: '4/7/2025', time: '3:40 PM', report: 'يوجد', action: 'عرض' },
    { id: 190, reason: 'مطالبة رواتب', name: 'MST RUMA AKTHER', date: '4/7/2025', time: '3:40 PM', report: 'لا يوجد', action: 'تسجيل' },
    { id: 190, reason: 'مطالبة رواتب', name: 'MST RUMA AKTHER', date: '4/7/2025', time: '3:40 PM', report: 'يوجد', action: 'عرض' },
  ];

  return (
    <Layout>    <main className={`p-6 max-w-[1440px] mx-auto ${Style["tajawal-regular"]}`}>
      <h1 className="text-3xl font-normal text-black mb-8">الجلسات</h1>
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center border border-gray-200 rounded bg-gray-100 p-2">
              <input type="text" placeholder="بحث" className="border-none bg-transparent p-2 outline-none text-sm" />
              <button>
                <Search className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-2 border border-gray-200 rounded bg-gray-100 p-2 text-gray-500 text-xs">
              <span>اختر تاريخ</span>
              <Calendar className="w-6 h-6" />
            </div>
            <button className="bg-teal-800 text-white border-none rounded-lg px-4 py-2 text-xs">
              إعادة ضبط
            </button>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 bg-teal-800 text-white border-none rounded px-2 py-1 text-[10px]">
              <DocumentText className="w-5 h-5" />
              <span>PDF</span>
            </button>
            <button className="flex items-center gap-1 bg-teal-800 text-white border-none rounded px-2 py-1 text-[10px]">
              <DocumentDownload className="w-5 h-5" />
              <span>Excel</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[0.5fr_1.5fr_1.5fr_1.2fr_1fr_1fr_1fr] gap-4 p-4 bg-teal-800 text-white text-base rounded-t-lg">
              <div>#</div>
              <div>سبب الجلسة</div>
              <div>اسم العاملة</div>
              <div>تاريخ الجلسة</div>
              <div>وقت الجلسة</div>
              <div>المحضر</div>
              <div>الإجراءات</div>
            </div>
            <div>
              {tableData.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[0.5fr_1.5fr_1.5fr_1.2fr_1fr_1fr_1fr] gap-4 p-4 bg-gray-100 border-t border-gray-200 text-sm"
                >
                  <div className="td" data-label="#">{row.id}</div>
                  <div className="td" data-label="سبب الجلسة">{row.reason}</div>
                  <div className="td" data-label="اسم العاملة">{row.name}</div>
                  <div className="td" data-label="تاريخ الجلسة">{row.date}</div>
                  <div className="td" data-label="وقت الجلسة">{row.time}</div>
                  <div className="td" data-label="المحضر">{row.report}</div>
                  <div
                    className="td cursor-pointer text-teal-800 underline"
                    data-label="الإجراءات"
                    onClick={() => openModal(row.action === 'تسجيل' ? 'add' : 'view')}
                  >
                    {row.action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <footer className="flex justify-between items-center pt-5 text-base flex-wrap gap-4">
          <div>عرض 1- 8 من 25 نتيجة</div>
          <nav className="flex items-center gap-1">
            <a href="#" className="px-2 py-1 border border-gray-200 rounded text-xs bg-gray-100 hover:bg-gray-200">التالي</a>
            <a href="#" className="px-2 py-1 border border-gray-200 rounded text-xs bg-gray-100 hover:bg-gray-200">3</a>
            <a href="#" className="px-2 py-1 border border-gray-200 rounded text-xs bg-gray-100 hover:bg-gray-200">2</a>
            <a href="#" className="px-2 py-1 border border-teal-800 rounded text-xs bg-teal-800 text-white">1</a>
            <a href="#" className="px-2 py-1 border border-gray-200 rounded text-xs bg-gray-100 hover:bg-gray-200">السابق</a>
          </nav>
        </footer>
      </div>
      <Modal isOpen={modalType === 'add'} onClose={closeModal} type="add" />
      <Modal isOpen={modalType === 'view'} onClose={closeModal} type="view" />
    </main>
</Layout>

  );

}