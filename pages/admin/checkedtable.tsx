import { useEffect, useState } from "react";
import Layout from "example/containers/Layout";

interface HousedWorker {
  id: number;
  employee: string | null;
  houseentrydate: string | null;
  isActive: boolean | null;
  totalDailyCost: number;
}

export default function HousedWorkers() {
  const [workers, setWorkers] = useState<HousedWorker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const response = await fetch("/api/checkedtable");
        const data = await response.json();
        setWorkers(data);
      } catch (error) {
        console.error("Error fetching workers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">بيانات الاعاشة</h1>

        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">ID</th>
                  <th className="py-2 px-4 border-b text-left">اسم العاملة</th>
                  <th className="py-2 px-4 border-b text-left">
                    تاريخ التسكين
                  </th>
                  <th className="py-2 px-4 border-b text-left">حالة الاعاشة</th>
                  <th className="py-2 px-4 border-b text-left">
                    Total Daily Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{worker.id}</td>
                    <td className="py-2 px-4 border-b">
                      {worker.employee || "N/A"}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {worker.houseentrydate
                        ? new Date(worker.houseentrydate).toLocaleDateString()
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
        )}
      </div>
    </Layout>
  );
}
