import { DocumentDownloadIcon as DocumentDownload, DocumentTextIcon as DocumentText } from '@heroicons/react/outline';
import Layout from 'example/containers/Layout';
import { X, Calendar, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import Style from "styles/Home.module.css";

const Modal = ({ isOpen, onClose, type, session, onSave }) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    reason: session?.reason || '',
    idnumber: session?.idnumber || '',
    date: session?.date ? new Date(session.date).toLocaleDateString('en-GB') : '',
    time: session?.time || '',
    result: session?.result || '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (type === 'add') {
      try {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          onSave(); // Trigger data refresh
          onClose();
        } else {
          console.error('Failed to save session');
        }
      } catch (error) {
        console.error('Error saving session:', error);
      }
    }
  };

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
                {session?.user?.Name || 'غير متوفر'}
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm text-gray-800">سبب الجلسة</label>
              <input
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                disabled={type === 'view'}
                className="bg-gray-100 border border-gray-200 rounded-md p-3 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-row gap-8 max-md:flex-col">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm text-gray-800">وقت الجلسة</label>
              <input
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                disabled={type === 'view'}
                className="bg-gray-100 border border-gray-200 rounded-md p-3 text-sm"
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm text-gray-800">تاريخ الجلسة</label>
              <input
                name="date"
                type="date"
                value={formData.date} // Convert DD/MM/YYYY to YYYY-MM-DD
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                disabled={type === 'view'}
                className="bg-gray-100 border border-gray-200 rounded-md p-3 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-row gap-8">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm text-gray-800">المحضر</label>
              <textarea
                name="result"
                value={formData.result || (type === 'add' ? 'ادخال المحضر هنا' : 'غير متوفر')}
                onChange={handleInputChange}
                disabled={type === 'view'}
                className={`bg-gray-100 border border-gray-200 rounded-md p-3 min-h-[60px] text-sm ${type === 'add' ? 'text-gray-500' : ''}`}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-4 max-md:flex-col">
          <button onClick={onClose} className="w-[116px] h-[33px] max-md:w-full border border-teal-800 text-gray-800 rounded text-base font-inter">
            إلغاء
          </button>
          {type === 'add' && (
            <button onClick={handleSave} className="w-[116px] h-[33px] max-md:w-full bg-teal-800 border border-teal-800 text-gray-100 rounded text-base font-inter">
              حفظ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [modalType, setModalType] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchSessions = async () => {
    try {
      const query = new URLSearchParams({ page: page.toString(), reason: search, ...(dateFilter && { date: dateFilter }) }).toString();
      const response = await fetch(`/api/sessions?${query}`);
      const data = await response.json();
      if (response.ok) {
        setSessions(data.session || []);
        setTotalResults(data.session?.length || 0); // Adjust based on actual total count from backend
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [page, search, dateFilter]);

  const openModal = (type, session) => {
    setModalType(type);
    setSelectedSession(session);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedSession(null);
  };

  const handleSave = () => {
    fetchSessions(); // Refresh data after saving
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
  };

  return (
    <Layout>
      <main className={`p-6 max-w-[1440px] mx-auto ${Style["tajawal-regular"]}`}>
        <h1 className="text-3xl font-normal text-black mb-8">الجلسات</h1>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center border border-gray-200 rounded bg-gray-100 p-2">
                <input
                  type="text"
                  placeholder="بحث"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-none bg-transparent p-2 outline-none text-sm"
                />
                <button>
                  <Search className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              <div className="flex items-center gap-2 border border-gray-200 rounded bg-gray-100 p-2 text-gray-500 text-xs">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="border-none bg-transparent outline-none"
                />
                <Calendar className="w-6 h-6" />
              </div>
              <button
                onClick={() => { setSearch(''); setDateFilter(''); }}
                className="bg-teal-800 text-white border-none rounded-lg px-4 py-2 text-xs"
              >
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
                {sessions.length > 0 ? (
                  sessions.map((row) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-[0.5fr_1.5fr_1.5fr_1.2fr_1fr_1fr_1fr] gap-4 p-4 bg-gray-100 border-t border-gray-200 text-sm"
                    >
                      <div className="td" data-label="#">{row.id}</div>
                      <div className="td" data-label="سبب الجلسة">{row.reason || 'غير متوفر'}</div>
                      <div className="td" data-label="اسم العاملة">{row.user?.Name || 'غير متوفر'}</div>
                      <div className="td" data-label="تاريخ الجلسة">{formatDate(row.date)}</div>
                      <div className="td" data-label="وقت الجلسة">{formatTime(row.time)}</div>
                      <div className="td" data-label="المحضر">{row.result || 'لا يوجد'}</div>
                      <div
                        className="td cursor-pointer text-teal-800 underline"
                        data-label="الإجراءات"
                        onClick={() => openModal(row.result ? 'view' : 'add', row)}
                      >
                        {row.result ? 'عرض' : 'تسجيل'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">لا توجد جلسات</div>
                )}
              </div>
            </div>
          </div>
          <footer className="flex justify-between items-center pt-5 text-base flex-wrap gap-4">
            <div>عرض {(page - 1) * 10 + 1}- {Math.min(page * 10, totalResults)} من {totalResults} نتيجة</div>
            <nav className="flex items-center gap-1">
              <a
                href="#"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="px-2 py-1 border border-gray-200 rounded text-xs bg-gray-100 hover:bg-gray-200"
              >
                السابق
              </a>
              <a
                href="#"
                className="px-2 py-1 border border-teal-800 rounded text-xs bg-teal-800 text-white"
              >
                {page}
              </a>
              <a
                href="#"
                onClick={() => setPage((prev) => prev + 1)}
                className="px-2 py-1 border border-gray-200 rounded text-xs bg-gray-100 hover:bg-gray-200"
              >
                التالي
              </a>
            </nav>
          </footer>
        </div>
        <Modal
          isOpen={modalType !== null}
          onClose={closeModal}
          type={modalType}
          session={selectedSession}
          onSave={handleSave}
        />
      </main>
    </Layout>
  );
}