import { Button, TextField, Typography } from "@mui/material";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Layout from "example/containers/Layout";
import { ChevronLeftIcon } from "@heroicons/react/solid";

// واجهات TypeScript
interface Worker {
  id: string;
  HomeMaid: { Name: string; Passportnumber: string };
  status: string;
  employee: string;
  date: string;
}

interface WeekData {
  week: string;
  statuses: Worker[];
}

interface Filters {
  Name: string;
  Passportnumber: string;
}

interface SortConfig {
  key: string | null;
  direction: "asc" | "desc";
}

// Custom Hook لجلب البيانات
const useFetchWorkers = (
  filters: Filters,
  pageRef: React.MutableRefObject<number>,
  setWeeksData: React.Dispatch<React.SetStateAction<WeekData[]>>,
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const isFetchingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current || !setHasMore) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        Name: filters.Name,
        Passportnumber: filters.Passportnumber,
        page: String(pageRef.current),
        weeks: "4", // عدد الأسابيع
      });

      const response = await fetch(`/api/weekly-status?${queryParams}`, {
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        method: "GET",
      });

      const data = await response.json();
      if (data.weeks?.length > 0) {
        setWeeksData((prev) => [...prev, ...data.weeks]);
        pageRef.current += 1;
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [filters, pageRef, setWeeksData, setHasMore, setLoading]);

  return fetchData;
};

// تنسيق التاريخ
const formatDate = (date: string): string => {
  return new Date(date).toISOString().split("T")[0];
};

// مكون الفلاتر
const FilterSection: React.FC<{
  filters: Filters;
  onFilterChange: (e: React.ChangeEvent<HTMLInputElement>, column: keyof Filters) => void;
  onReset: () => void;
  onSearch: () => void;
}> = React.memo(({ filters, onFilterChange, onReset, onSearch }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
    <input
      type="text"
      value={filters.Name}
      onChange={(e) => onFilterChange(e, "Name")}
      placeholder="بحث باسم العاملة"
      className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-right shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <input
      type="text"
      value={filters.Passportnumber}
      onChange={(e) => onFilterChange(e, "Passportnumber")}
      placeholder="بحث برقم الجواز"
      className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-right shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    {/* dag */}
    <button
      onClick={onReset}
      className="rounded-lg bg-gray-500 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:bg-gray-600"
    >
      إعادة ضبط
    </button>
    <button
      onClick={onSearch}
      className="rounded-lg bg-blue-600 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700"
    >
      بحث
    </button>
  </div>
));

// مكون الجدول الأسبوعي
const WeeklyTable: React.FC<{
  weeksData: WeekData[];
  expandedRow: string | null;
  onRowClick: (id: string) => void;
}> = React.memo(({ weeksData, expandedRow, onRowClick }) => (
  <div className="space-y-8">
    {weeksData.map((week) => (
      <div key={week.week} className="overflow-hidden rounded-lg bg-white shadow-lg">
        <Typography variant="h6" className="bg-yellow-500 px-4 py-3 text-right font-semibold text-white">
          الأسبوع: {week.week}
        </Typography>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              {["اسم العاملة", "رقم الجواز", "الحالة", "الموظف", "التاريخ"].map((header) => (
                <th key={header} className="px-4 py-3 text-right font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {week.statuses.map((worker) => (
              <tr
                key={worker.id}
                onClick={() => onRowClick(worker.id)}
                className={`cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                  expandedRow === worker.id ? "bg-gray-100" : ""
                }`}
              >
                <td className="border-b border-gray-200 px-4 py-3 text-right">{worker.HomeMaid.Name}</td>
                <td className="border-b border-gray-200 px-4 py-3 text-right">{worker.HomeMaid.Passportnumber}</td>
                <td className="border-b border-gray-200 px-4 py-3 text-right">{worker.status}</td>
                <td className="border-b border-gray-200 px-4 py-3 text-right">{worker.employee}</td>
                <td className="border-b border-gray-200 px-4 py-3 text-right">{formatDate(worker.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ))}
  </div>
));

// المكون الرئيسي
const Table: React.FC = () => {
  const router = useRouter();
  const [weeksData, setWeeksData] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ Name: "", Passportnumber: "" });
  const pageRef = useRef(1);

  const fetchData = useFetchWorkers(filters, pageRef, setWeeksData, setHasMore, setLoading);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBack = () => router.back();

  const handleRowClick = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>, column: keyof Filters) => {
    setFilters((prev) => ({ ...prev, [column]: e.target.value }));
  };

  const handleResetFilters = () => {
    setFilters({ Name: "", Passportnumber: "" });
    setWeeksData([]);
    pageRef.current = 1;
    setHasMore(true);
    fetchData();
  };

  const handleSearch = () => {
    setWeeksData([]);
    pageRef.current = 1;
    setHasMore(true);
    fetchData();
  };

  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || loading || !hasMore) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) fetchData();
        },
        { threshold: 1.0 }
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [loading, hasMore, fetchData]
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center rounded-lg bg-gray-600 px-4 py-2 text-white shadow-md transition-all duration-300 hover:bg-gray-700"
          >
            <ChevronLeftIcon className="mr-2 h-5 w-5" />
            رجوع
          </button>
          <div className="flex gap-4">
            <Button
              variant="contained"
              className="rounded-lg bg-yellow-500 font-semibold text-white shadow-md transition-all duration-300 hover:bg-yellow-600"
              onClick={() => router.push("/admin/housedarrivals")}
            >
              جدول التسكين
            </Button>
            <Button
              variant="contained"
              className="rounded-lg bg-blue-600 font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700"
              onClick={() => router.push("/admin/checklisttable")}
            >
              بيانات الاعاشة
            </Button>
          </div>
        </div>

        <Typography variant="h4" className="mb-6 text-right font-bold text-gray-800">
          الحالات الأسبوعية للعاملات
        </Typography>

        {/* Filters */}
        <FilterSection
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          onSearch={handleSearch}
        />

        {/* Weekly Table */}
        <WeeklyTable weeksData={weeksData} expandedRow={expandedRow} onRowClick={handleRowClick} />

        {/* Loading Indicator */}
        {hasMore && (
          <div ref={loadMoreRef} className="mt-6 flex justify-center">
            {loading && (
              <div className="flex items-center gap-3">
                <svg
                  className="h-6 w-6 animate-spin text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                  />
                </svg>
                <span className="font-medium text-gray-600">جاري التحميل...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Table;