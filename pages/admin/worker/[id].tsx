import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "example/containers/Layout";

interface CheckIn {
  id: number;
  CheckDate: string;
  DailyCost: number;
  notes?: string;
}

export default function WorkerCheckIns() {
  const router = useRouter();
  const { id } = router.query;
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCheckIns = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/worker/${id}`);
      const data = await res.json();
      setCheckIns(data);
    } catch (err) {
      console.error("Error fetching check-ins:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckIns();
  }, [id]);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">سجلات الاعاشة للعامل</h1>

        {loading ? (
          <p>جاري التحميل...</p>
        ) : (
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b">تاريخ الاعاشة</th>
                <th className="py-2 px-4 border-b">تكلفة يومية</th>
                <th className="py-2 px-4 border-b">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {checkIns.map((c) => (
                <tr key={c.id}>
                  <td className="py-2 px-4 border-b text-center">
                    {new Date(c.CheckDate).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 text-center border-b">
                    {c.DailyCost}
                  </td>
                  <td className="py-2 px-4 text-center border-b">
                    {c.notes || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
