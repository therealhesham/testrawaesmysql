import { useEffect, useState } from "react";
import Layout from "example/containers/Layout";

interface DailyCosts {
  [date: string]: number;
}

interface HousedWorker {
  id: number;
  Name: string | null;
  houseentrydate: string | null;
  isActive: boolean | null;
  dailyCosts: DailyCosts;
}

interface ApiResponse {
  startDate: string;
  endDate: string;
  workers: HousedWorker[];
  dailyTotals: { [date: string]: number };
}

export default function HousedWorkers() {
  const [workers, setWorkers] = useState<HousedWorker[]>([]);
  const [dailyTotals, setDailyTotals] = useState<{ [date: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

const getCurrentWeekStart = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 (الأحد) إلى 6 (السبت)
  // حساب عدد الأيام للرجوع للسبت اللي فات
  const diff = dayOfWeek === 0 ? 1 : dayOfWeek; // إذا الأحد، نرجع يوم واحد، غيره نرجع dayOfWeek
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - diff);
  saturday.setHours(0, 0, 0, 0); // نضبط الوقت على بداية اليوم
  return saturday.toISOString().split("T")[0]; // بيرجع YYYY-MM-DD
};
  const fetchWorkers = async (weekStart: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/checkedtable?startDate=${encodeURIComponent(weekStart)}&search=${encodeURIComponent(searchQuery.trim())}`
      );
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const result: ApiResponse = await response.json();
      setWorkers(Array.isArray(result.workers) ? result.workers : []);
      setDailyTotals(result.dailyTotals || {});
      setStartDate(result.startDate);
    } catch (error) {
      console.error("Error fetching workers:", error);
      setError("فشل في جلب البيانات. حاول مرة أخرى.");
      setWorkers([]);
      setDailyTotals({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const weekStart = getCurrentWeekStart();
    fetchWorkers(weekStart);
  }, [searchQuery]);

  const getWeekDays = (start: string) => {
    const days: { date: string; label: string }[] = [];
    const startDate = new Date(start);
    const dayNames = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push({
        date: date.toISOString().split("T")[0],
        label: `${dayNames[i]} ${date.toLocaleDateString("ar-EG", { day: "numeric", month: "numeric" })}`,
      });
    }
    return days;
  };

  const weekDays = startDate ? getWeekDays(startDate) : [];

  const handleWeekChange = (direction: "prev" | "next") => {
    const currentStart = new Date(startDate);
    const newStart = new Date(currentStart);
    newStart.setDate(currentStart.getDate() + (direction === "next" ? 7 : -7));
    const newStartDate = newStart.toISOString().split("T")[0];
    setStartDate(newStartDate);
    fetchWorkers(newStartDate);
  };

  const handleDelete = async () => {
    if (!selectedDate) {
      setDeleteError("يرجى اختيار تاريخ.");
      return;
    }
    setDeleteError(null);
    try {
      const response = await fetch(`/api/checkedtable?date=${selectedDate}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`فشل في الحذف: ${response.statusText}`);
      }
      setIsDeleteModalOpen(false);
      setSelectedDate("");
      fetchWorkers(startDate);
    } catch (error) {
      console.error("Error deleting records:", error);
      setDeleteError("فشل في حذف السجلات. حاول مرة أخرى.");
    }
  };

  const formatCost = (cost: number) => {
    return isNaN(cost) ? "0.00" : cost.toFixed(2);
  };

  // Function to determine cell background color based on date
  const getCellBackgroundClass = (date: string) => {
    const today = new Date().toISOString().split("T")[0];
    const cellDate = new Date(date);
    const todayDate = new Date(today);
    if (cellDate.toDateString() === todayDate.toDateString()) {
      return "bg-blue-100 group relative"; // Current day
    } else if (cellDate < todayDate) {
      return "bg-green-100"; // Past days
    } else {
      return "bg-gray-100"; // Future days
    }
  };

  return (
    <Layout>
      <div dir="rtl" className="container mx-auto p-6 bg-gray-50 min-h-screen font-sans">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-right">بيانات الإعاشة الأسبوعية</h1>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم..."
            className="w-full sm:w-1/3 p-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          />
          <div className="flex space-x-3 space-x-reverse">
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition duration-200"
            >
              حذف سجلات
            </button>
            <button
              onClick={() => handleWeekChange("prev")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow hover:bg-gray-300 transition duration-200"
            >
              الأسبوع السابق
            </button>
            <button
              onClick={() => handleWeekChange("next")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow hover:bg-gray-300 transition duration-200"
            >
              الأسبوع التالي
            </button>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-center mb-6 bg-red-100 p-3 rounded-lg">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto shadow-lg rounded-lg">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-blue-50 text-gray-700 text-right">
                  <th className="py-3 px-6 border-b font-semibold">اسم العاملة</th>
                  {weekDays.map((day) => (
                    <th key={day.date} className="py-3 px-6 border-b font-semibold">
                      {day.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workers.length > 0 ? (
                  workers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-gray-50 transition duration-150 text-right">
                      <td className="py-3 px-6 border-b">
                        <a
                          href={`/admin/worker/${worker.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {worker.Name || "غير متوفر"}
                        </a>
                      </td>
                      {weekDays.map((day) => (
                        <td
                          key={day.date}
                          className={`py-3 px-6 border-b text-center ${getCellBackgroundClass(day.date)}`}
                        >
                          {formatCost(worker.dailyCosts[day.date] || 0)}
                          {getCellBackgroundClass(day.date).includes("bg-blue-100") && (
                            <div className="absolute left-1/2 transform -translate-x-1/2 -top-10 hidden group-hover:block bg-gray-800 text-white text-sm rounded-lg p-2 shadow-lg">
                              سيتم توزيع الإعاشات في آخر اليوم أوتوماتيكيًا
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={weekDays.length + 1} className="py-4 px-6 text-center text-gray-500">
                      لا توجد بيانات لعرضها
                    </td>
                  </tr>
                )}
                <tr className="bg-blue-50 font-semibold text-right">
                  <td className="py-3 px-6 border-b">إجمالي اليوم</td>
                  {weekDays.map((day) => (
                    <td
                      key={day.date}
                      className={`py-3 px-6 border-b text-center ${getCellBackgroundClass(day.date)}`}
                    >
                      {formatCost(dailyTotals[day.date] || 0)}
                      {getCellBackgroundClass(day.date).includes("bg-blue-100") && (
                        <div className="absolute left-1/2 transform -translate-x-1/2 -top-10 hidden group-hover:block bg-gray-800 text-white text-sm rounded-lg p-2 shadow-lg">
                          سيتم توزيع الإعاشات في آخر اليوم أوتوماتيكيًا
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform scale-95 animate-scale-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-right">حذف سجلات الإعاشة</h2>
              <p className="mb-4 text-gray-600 text-right">اختر تاريخ السجلات المراد حذفها:</p>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 mb-4"
              />
              {deleteError && (
                <div className="text-red-600 mb-4 bg-red-100 p-2 rounded-lg text-right">{deleteError}</div>
              )}
              <div className="flex justify-end space-x-3 space-x-reverse">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedDate("");
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg shadow hover:bg-gray-300 transition duration-200"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition duration-200"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
      `}</style>
    </Layout>
  );
}