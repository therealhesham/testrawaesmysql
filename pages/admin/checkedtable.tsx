import { useEffect, useState } from "react";
import Layout from "example/containers/Layout";

interface HousedWorker {
  id: number;
  Name: string | null;
  houseentrydate: string | null;
  isActive: boolean | null;
  totalDailyCost: number | string; // Allow string in case of unexpected type
}

export default function HousedWorkers() {
  const [workers, setWorkers] = useState<HousedWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        `/api/checkedtable?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(searchQuery.trim())}`
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
  }, [page, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  // Helper function to format totalDailyCost
  const formatCost = (cost: number | string) => {
    const num = typeof cost === "string" ? parseFloat(cost) : cost;
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">بيانات الاعاشة</h1>

        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="ابحث بالاسم..."
            className="w-50 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
                    <th className="py-2 px-4 border-b text-center">
                      اسم العاملة
                    </th>
                    <th className="py-2 px-4 border-b text-center">
                      تاريخ التسكين
                    </th>
                    <th className="py-2 px-4 border-b text-center">
                      تاريخ الاعاشة
                    </th>

                    <th className="py-2 px-4 border-b text-center">
                      حالة الاعاشة
                    </th>
                    <th className="py-2 px-4 border-b text-center">
                      اجمالي التكلفة
                    </th>
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
                      <td colSpan={5} className="py-2 px-4 text-center">
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
      </div>
    </Layout>
  );
}