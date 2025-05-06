import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "example/containers/Layout";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface CheckIn {
  id: number;
  CheckDate: string;
  DailyCost: number;
  workername?: string; // حقل جديد لاسم العاملة
  notes?: string;
}

export default function WorkerCheckIns() {
  const router = useRouter();
  const { id } = router.query;
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: "info" | "error"; message: string } | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof CheckIn;
    direction: "asc" | "desc";
  } | null>(null);

  const fetchCheckIns = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setAlert(null);
    try {
      const res = await fetch(`/api/worker/${id}`);
      if (!res.ok) throw new Error("فشل تحميل البيانات");
      const data = await res.json();
      console.log("API Data:", data); // للتحقق من البيانات
      setCheckIns(data);
      if (data.length === 0) {
        setAlert({ type: "info", message: "لا توجد سجلات للعرض" });
      }
    } catch (err) {
      console.error("Error fetching check-ins:", err);
      setError("حدث خطأ أثناء جلب البيانات. حاول مرة أخرى.");
      setAlert({ type: "error", message: "فشل جلب البيانات" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckIns();
  }, [id]);

  // Sorting function
  const sortData = (key: keyof CheckIn) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }

    const sorted = [...checkIns].sort((a, b) => {
      if (key === "CheckDate") {
        const dateA = new Date(a[key]).getTime();
        const dateB = new Date(b[key]).getTime();
        return direction === "asc" ? dateA - dateB : dateB - dateA;
      }
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setCheckIns(sorted);
    setSortConfig({ key, direction });
  };

  // Skeleton Loader Component
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="py-4 px-6 border-b">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </td>
      <td className="py-4 px-6 border-b">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </td>
      <td className="py-4 px-6 border-b">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </td>
    </tr>
  );

  // الحصول على اسم العاملة من أول سجل (إذا كان موجودًا)
  const workerName = checkIns.length > 0 && checkIns[0].workername ? checkIns[0].workername : "العاملة";

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 dir-rtl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            سجلات الإعاشة لـ {workerName}
          </h1>
          <button
            onClick={fetchCheckIns}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            aria-label="إعادة تحميل البيانات"
          >
            {loading ? "جاري التحميل..." : "تحديث"}
          </button>
        </div>

        {alert && (
          <div
            className={`mb-4 p-4 rounded-md ${
              alert.type === "error" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
            }`}
            role="alert"
          >
            {alert.message}
          </div>
        )}

        {error && (
          <div
            className="mb-4 p-4 bg-red-100 text-red-700 rounded-md"
            role="alert"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="overflow-x-auto">
            <table
              className="min-w-full bg-white border border-gray-200"
              aria-label="جاري تحميل سجلات الإعاشة"
            >
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-6 border-b text-right">تاريخ الإعاشة</th>
                  <th className="py-3 px-6 border-b text-right">تكلفة يومية</th>
                  <th className="py-3 px-6 border-b text-right">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : checkIns.length === 0 ? (
          <div
            className="text-center py-10 bg-gray-50 rounded-md"
            role="alert"
          >
            <p className="text-gray-500">لا توجد سجلات إعاشة متاحة لهذا العامل.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm"
              aria-label="سجلات الإعاشة"
            >
              <thead>
                <tr className="bg-gray-100">
                  <th
                    className="py-3 px-6 border-b text-right cursor-pointer hover:bg-gray-200"
                    onClick={() => sortData("CheckDate")}
                    aria-sort={
                      sortConfig?.key === "CheckDate"
                        ? sortConfig.direction
                        : "none"
                    }
                  >
                    تاريخ الإعاشة{" "}
                    {sortConfig?.key === "CheckDate" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="py-3 px-6 border-b text-right cursor-pointer hover:bg-gray-200"
                    onClick={() => sortData("DailyCost")}
                    aria-sort={
                      sortConfig?.key === "DailyCost"
                        ? sortConfig.direction
                        : "none"
                    }
                  >
                    تكلفة يومية{" "}
                    {sortConfig?.key === "DailyCost" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="py-3 px-6 border-b text-right">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {checkIns.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 border-b text-right">
                      {c.CheckDate.split("T")[0] 
                      // format(new Date(c.CheckDate), "dd/MM", { locale: ar })
                      
                      }
                    </td>
                    <td className="py-4 px-6 border-b text-right">
                      {c.DailyCost.toLocaleString("ar-SA", {
                        style: "currency",
                        currency: "SAR",
                      })}
                    </td>
                    <td className="py-4 px-6 border-b text-right">
                      {c.notes || "—"}
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