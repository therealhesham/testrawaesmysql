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
  function getDate(date) {
    const currentDate = new Date(date); // Original date
    // currentDate.setDate(currentDate.getDate() + 90); // Add 90 days
    const form = currentDate.toISOString().split("T")[0];
    console.log(currentDate);
    return form;
  }

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/checkedtable?page=${page}&pageSize=${pageSize}`
      );
      const result = await response.json();
      setWorkers(result.data);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Error fetching workers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [page]);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">بيانات الاعاشة</h1>

        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b text-left">ID</th>
                    <th className="py-2 px-4 border-b text-left">
                      اسم العاملة
                    </th>
                    <th className="py-2 px-4 border-b text-left">
                      تاريخ التسكين
                    </th>
                    <th className="py-2 px-4 border-b text-left">
                      حالة الاعاشة
                    </th>
                    <th className="py-2 px-4 border-b text-left">
                      اجمالي التكلفة
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workers.length > 0 &&
                    workers.map((worker) => (
                      <tr key={worker.id} className="hover:bg-gray-50">
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
                    ))}
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
