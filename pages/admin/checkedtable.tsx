import { useState, useEffect } from 'react';
import { CalendarIcon, SearchIcon } from '@heroicons/react/outline';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css"
export default function Subsistence() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDate, setDeleteDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [workers, setWorkers] = useState([]);
  const [dailyTotals, setDailyTotals] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate date range for table headers
  const getDateRange = (start, end) => {
    const dates = [];
    const current = new Date(start);
    const endDate = new Date(end);
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  // Fetch data from API
  const fetchData = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/checkedtable?startDate=${startDate}&endDate=${endDate}&search=${search}`);
      const data = await response.json();
      if (response.ok) {
        setWorkers(data.workers || []);
        setDailyTotals(data.dailyTotals || {});
      } else {
        setError(data.message || 'حدث خطأ أثناء جلب البيانات');
      }
    } catch (err) {
      setError('فشل في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete action
  const handleDelete = async (e) => {
    e.preventDefault();
    if (!deleteDate) {
      alert('يرجى اختيار تاريخ');
      return;
    }
    try {
      const response = await fetch(`/api/checkedtable?date=${deleteDate}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setIsModalOpen(false);
        setDeleteDate('');
        fetchData(); // Refresh data after deletion
      } else {
        alert(data.message || 'حدث خطأ أثناء الحذف');
      }
    } catch (err) {
      alert('فشل في الاتصال بالخادم');
    }
  };

  // Set default date range and fetch data
  useEffect(() => {
    const today = new Date();
    const defaultEnd = today.toISOString().split('T')[0];
    const defaultStart = new Date(today.setDate(today.getDate() - 6)).toISOString().split('T')[0];
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
  }, []);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, search]);

  const dates = startDate && endDate ? getDateRange(startDate, endDate) : [];

  return (
    <Layout>
    <div className={`min-h-screen bg-[#f2f3f5] font-tajawal text-[#1f2937] flex justify-center p-[33px] sm:p-[31px] ${Style["tajawal-regular"]}`}>
      {/* Modal Overlay */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[999]"
          onClick={() => setIsModalOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="w-full max-w-[1440px]">
        {error && <div className="text-[#ba0e0e] text-center mb-6 text-base">{error}</div>}
        {loading && <div className="text-center mb-6 text-base">جارٍ التحميل...</div>}
        <section>
          <h1 className="text-[32px] font-normal text-black text-right mb-[26px]">
            الاعاشة
          </h1>
          <div className="bg-white border border-[#e0e0e0] rounded-[5px] p-[22px]">
            {/* Controls Bar */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-[26px]">
              <div className="flex flex-wrap flex-row-reverse gap-4">
                <button
                  className="bg-[#1a4d4f] text-white px-3 py-[7.5px] rounded-[5px] text-[12px] hover:bg-[#14595b]"
                  onClick={() => setIsModalOpen(true)}
                >
                  حذف سجلات
                </button>
                <button
                  className="bg-[#1a4d4f] text-white px-3 py-[7.5px] rounded-[5px] text-[12px] hover:bg-[#14595b]"
                  onClick={() => {
                    setSearch('');
                    setStartDate(new Date(new Date().setDate(new Date().getDate() - 6)).toISOString().split('T')[0]);
                    setEndDate(new Date().toISOString().split('T')[0]);
                  }}
                >
                  اعادة ضبط
                </button>
                <div className="flex items-center gap-1 bg-[#f7f8fa] border border-[#e0e0e0] rounded-[5px] px-[10px] py-[8px] text-[12px] text-[#6b7280]">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent border-none w-[100px]"
                  />
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1 bg-[#f7f8fa] border border-[#e0e0e0] rounded-[5px] px-[10px] py-[8px] text-[12px] text-[#6b7280]">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent border-none w-[100px]"
                  />
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between w-[234px] bg-[#f7f8fa] border border-[#e0e0e0] rounded-[5px] px-[10px] py-[8px] text-[12px] text-[#6b7280]">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="بحث"
                    className="bg-transparent border-none w-full"
                  />
                  <SearchIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-[14px] text-[14px] text-[#1a4d4f]">
                  <button>
                    <ChevronRight className="w-[17px] h-[34px] transform rotate-180" />
                  </button>
                  <span>{`من ${startDate} الى ${endDate}`}</span>
                  <button>
                    <ChevronLeft className="w-[17px] h-[34px]" />
                  </button>
                </div>
                <div className="flex gap-[6px]">
                  <button className="flex items-center gap-1 bg-[#1a4d4f] text-white px-[10px] py-[5px] rounded-[3px] text-md hover:bg-[#14595b]">
                    PDF
                  </button>
                  <button className="flex items-center gap-1 bg-[#1a4d4f] text-white px-[10px] py-[5px] rounded-[3px] text-md hover:bg-[#14595b]">
                    Excel
                  </button>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="border border-[#e0e0e0] rounded-[5px] overflow-x-auto">
              <div className="grid grid-cols-[1.5fr_repeat(7,1fr)] bg-[#1a4d4f] text-[#f7f8fa] text-[14px]">
                <div className="p-[17px_10px] pr-[31px] text-right text-[15px] font-medium">
                  اسم العاملة
                </div>
                {dates.map((date, i) => (
                  <div key={i} className="p-[17px_10px] text-center leading-tight">
                    {new Date(date).toLocaleDateString('ar-EG', { weekday: 'long' })}
                    <br />
                    {date}
                  </div>
                ))}
              </div>
              <div>
                {workers.map((worker, index) => (
                  <div
                    key={worker.id}
                    className="grid grid-cols-[1.5fr_repeat(7,1fr)] bg-[#f7f8fa] border-t border-[#e0e0e0] text-[14px]"
                  >
                    <div className="p-[17px_10px] pr-[31px] text-right text-[16px] font-medium">
                      {worker.Name}
                    </div>
                    {dates.map((date, i) => (
                      <div key={i} className="p-[17px_10px] text-center">
                        {worker.dailyCosts[date] ? worker.dailyCosts[date].toFixed(2) : '0.00'}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-[26px] px-[5px]">
              <nav className="flex gap-[5px]">
                <a
                  href="#"
                  className="border border-[#e0e0e0] rounded-[2px] min-w-[18px] h-[18px] flex items-center justify-center px-2 text-md text-[#1f2937] bg-[#f7f8fa] hover:bg-gray-200"
                >
                  التالي
                </a>
                <a
                  href="#"
                  className="border border-[#e0e0e0] rounded-[2px] min-w-[18px] h-[18px] flex items-center justify-center px-2 text-[12px] text-[#1f2937] bg-[#f7f8fa] hover:bg-gray-200"
                >
                  3
                </a>
                <a
                  href="#"
                  className="border border-[#e0e0e0] rounded-[2px] min-w-[18px] h-[18px] flex items-center justify-center px-2 text-[12px] text-[#1f2937] bg-[#f7f8fa] hover:bg-gray-200"
                >
                  2
                </a>
                <a
                  href="#"
                  className="border border-[#1a4d4f] rounded-[2px] min-w-[18px] h-[18px] flex items-center justify-center px-2 text-[12px] text-[#f7f8fa] bg-[#1a4d4f]"
                >
                  1
                </a>
                <a
                  href="#"
                  className="border border-[#e0e0e0] rounded-[2px] min-w-[18px] h-[18px] flex items-center justify-center px-2 text-md text-[#1f2937] bg-[#f7f8fa] hover:bg-gray-200"
                >
                  السابق
                </a>
              </nav>
              <span className="text-[16px] text-black mt-4 sm:mt-0">
                عرض 1- 8 من {workers.length} نتيجة
              </span>
            </div>
          </div>
        </section>

        {/* Delete Modal */}
        <section
          className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#f2f3f5] border border-[#e0e0e0] rounded-[5px] p-[40px_48px] flex flex-col gap-[40px] z-[1000] w-full max-w-[731px] ${isModalOpen ? 'flex' : 'hidden'}`}
        >
          <h2 className="text-[24px] font-normal text-black text-right m-0">حذف سجلات</h2>
          <form onSubmit={handleDelete}>
            <div className="flex flex-col gap-[8px]">
              <label htmlFor="delete-date" className="text-[12px] text-[#1f2937] text-right">
                تاريخ الحذف
              </label>
              <div className="flex items-center justify-between bg-[#f7f8fa] border border-[#e0e0e0] rounded-[5px] px-[10px] py-[10px] h-[38px] text-[12px] text-[#6b7280]">
                <input
                  type="date"
                  id="delete-date"
                  value={deleteDate}
                  onChange={(e) => setDeleteDate(e.target.value)}
                  className="bg-transparent border-none w-[150px]"
                />
                <CalendarIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex gap-4 justify-start mt-[40px]">
              <button
                type="button"
                className="bg-transparent border border-[#1a4d4f] text-[#1f2937] px-0 py-[6px] rounded-[4px] text-[16px] font-inter w-[116px] h-[33px] flex items-center justify-center hover:bg-gray-100"
                onClick={() => setIsModalOpen(false)}
              >
                الغاء
              </button>
              <button
                type="submit"
                className="bg-[#1a4d4f] text-[#f7f8fa] px-0 py-[6px] rounded-[4px] text-[16px] font-inter w-[116px] h-[33px] flex items-center justify-center hover:bg-[#14595b]"
              >
                حذف
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
    </Layout>
  );
}