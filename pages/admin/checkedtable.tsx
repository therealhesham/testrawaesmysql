import { useEffect, useState } from "react";
import Layout from "example/containers/Layout";

interface HousedWorker {
  Order: any;
  id: number;
  Name: string | null;
  houseentrydate: string | null;
  isActive: boolean | null;
  totalDailyCost: number;
}

export default function HousedWorkers() {
  const [workers, setWorkers] = useState<HousedWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  function getDate(date: string) {
    const currentDate = new Date(date);
    const form = currentDate.toISOString().split("T")[0];
    return form;
  }

  const fetchWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/checkedtable?page=${page}&pageSize=${pageSize}&search=${searchQuery}`
      );
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const result = await response.json();
      // Ensure result.data is an array; fallback to empty array if undefined
      setWorkers(Array.isArray(result.data) ? result.data : []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error("Error fetching workers:", error);
      setError("فشل في جلب البيانات. حاول مرة أخرى.");
      setWorkers([]); // Reset workers to empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [page, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page when search query changes
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">بيانات الاعاشة</h1>

        {/* Search Input */}
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
                            {worker.Name || "N/A"}
                          </a>
                        </td>
                        <td className="py-2 px-4 border-b">
                          {worker.houseentrydate
                            ? getDate(worker.houseentrydate)
                            : "N/A"}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {worker.isActive ? "في السكن" : "غادرت"}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {worker.totalDailyCost}
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

            {/* Pagination controls */}
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