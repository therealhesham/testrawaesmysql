import { useEffect, useState } from "react";
import Layout from "example/containers/Layout";

interface HousedWorker {
  id: number;
  Name: string | null;
  houseentrydate: string | null;
  isActive: boolean | null;
  totalDailyCost: number | string;
  CheckDate?: string | null;
}

export default function HousedWorkers() {
  const [workers, setWorkers] = useState<HousedWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [checkDateFilter, setCheckDateFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);
  const [distributeDate, setDistributeDate] = useState<string>("");
  const [distributeError, setDistributeError] = useState<string | null>(null);
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false); // New state for filter modal
  const [tempFilterDate, setTempFilterDate] = useState<string>(""); // Temporary date for modal

  function getDate(date: string | null) {
    if (!date) return "N/A";
    const currentDate = new Date(date);
    return currentDate.toISOString().split("T")[0];
  }

  const fetchWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/checkedtable?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(searchQuery.trim())}&checkDate=${encodeURIComponent(checkDateFilter)}`
      );
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const result = await response.json();
      setWorkers(Array.isArray(result.data) ? result.data : []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error("Error fetching workers:", error);
      setError("فشل في جلب البيانات. حاول مرة أخرى.");
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [page, searchQuery, checkDateFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleApplyDateFilter = () => {
    setCheckDateFilter(tempFilterDate);
    setIsDateFilterModalOpen(false);
    setTempFilterDate("");
    setPage(1);
  };

  const formatCost = (cost: number | string) => {
    const num = typeof cost === "string" ? parseFloat(cost) : cost;
    return isNaN(num) ? "0.00" : num.toFixed(2);
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
      setIsModalOpen(false);
      setSelectedDate("");
      fetchWorkers();
    } catch (error) {
      console.error("Error deleting records:", error);
      setDeleteError("فشل في حذف السجلات. حاول مرة أخرى.");
    }
  };

  const handleDistribute = async () => {
    if (!distributeDate) {
      setDistributeError("يرجى اختيار تاريخ.");
      return;
    }
    setDistributeError(null);
    try {
      const adjustedDate = new Date(distributeDate);
      adjustedDate.setHours(adjustedDate.getHours() + 3);
      const response = await fetch("/api/distrbuitecashmanually", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date: adjustedDate }),
      });
      if (!response.ok) {
        throw new Error(`فشل في توزيع الإعاشات: ${response.statusText}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "فشل في توزيع الإعاشات.");
      }
      setIsDistributeModalOpen(false);
      setDistributeDate("");
      fetchWorkers();
    } catch (error) {
      console.error("Error distributing check-ins:", error);
      setDistributeError("فشل في توزيع الإعاشات. حاول مرة أخرى.");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">بيانات الإعاشة</h1>

        <div className="flex justify-between mb-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="ابحث بالاسم..."
              className="w-1/3 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsDateFilterModalOpen(true)}
              className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
            >
بحث بتاريخ الاعاشة            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              حذف سجلات
            </button>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-center mb-4">{error}</div>
        )}

        {loading ? (
          <div className="text-center">جاري التحميل...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100 text-center">
                    <th className="py-2 px-4 border-b text-center">ID</th>
                    <th className="py-2 px-4 border-b text-center">اسم العاملة</th>
                    <th className="py-2 px-4 border-b text-center">تاريخ التسكين</th>
                    <th className="py-2 px-4 border-b text-center">تاريخ الإعاشة</th>
                    <th className="py-2 px-4 border-b text-center">حالة الإعاشة</th>
                    <th className="py-2 px-4 border-b text-center">إجمالي التكلفة</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.length > 0 ? (
                    workers.map((worker) => (
                      <tr key={worker.id} className="hover:bg-gray-50 text-center">
                        <td className="py-2 px-4 border-b">{worker.id}</td>
                        <td className="py-2 px-4 border-b text-blue-600 underline cursor-pointer">
                          <a href={`/admin/worker/${worker.id}`}>
                            {worker.Name || "غير متوفر"}
                          </a>
                        </td>
                        <td className="py-2 px-4 border-b">
                          {getDate(worker.houseentrydate)}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {getDate(worker.CheckDate)}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {worker.isActive ? "في السكن" : "غادرت"}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {formatCost(worker.totalDailyCost)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-2 px-4 text-center">
                        لا توجد بيانات لعرضها
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center mt-4 space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                السابق
              </button>
              <span className="px-4 py-2">
                الصفحة {page} من {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          </>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">حذف سجلات الإعاشة</h2>
              <p className="mb-4">اختر تاريخ السجلات المراد حذفها:</p>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {deleteError && (
                <div className="text-red-500 mb-4">{deleteError}</div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedDate("");
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        )}

        {isDateFilterModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">فلتر بالتاريخ</h2>
              <p className="mb-4">اختر تاريخ الإعاشة:</p>
              <input
                type="date"
                value={tempFilterDate}
                onChange={(e) => setTempFilterDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsDateFilterModalOpen(false);
                    setTempFilterDate("");
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleApplyDateFilter}
                  className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
                >
                  تأكيد
                </button>
              </div>
            </div>
          </div>
        )}

        {isDistributeModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">توزيع الإعاشات</h2>
              <p className="mb-4">اختر تاريخ الإعاشة:</p>
              <label className="block mb-2 font-semibold">تاريخ الإعاشة</label>
              <input
                type="date"
                value={distributeDate}
                onChange={(e) => setDistributeDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {distributeError && (
                <div className="text-red-500 mb-4">{distributeError}</div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsDistributeModalOpen(false);
                    setDistributeDate("");
                    setDistributeError(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDistribute}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  تأكيد
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}