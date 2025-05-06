import { Button, TextField, Typography } from "@mui/material";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Layout from "example/containers/Layout"; // Adjust the path as needed
import { ChevronLeftIcon } from "@heroicons/react/solid";
import { format, parseISO } from "date-fns";

// TypeScript interfaces
interface Worker {
  id: string;
  homeMaid_id: string;
  HomeMaid: { Name: string; Passportnumber: string };
  status: string;
  employee: string;
  date: string;
}

interface Filters {
  Name: string;
  Passportnumber: string;
}

// Date formatting function
const formatDate = (date: string): string => {
  try {
    return format(parseISO(date), "yyyy-MM-dd");
  } catch {
    return date;
  }
};

// Hook to fetch workers
const useFetchWorkers = (
  filters: Filters,
  pageRef: React.MutableRefObject<number>,
  setWorkers: React.Dispatch<React.SetStateAction<Worker[]>>,
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const isFetchingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current || !setHasMore) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        Name: filters.Name,
        Passportnumber: filters.Passportnumber,
        page: String(pageRef.current),
      });

      const response = await fetch(`/api/weekly-status?${queryParams}`, {
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("فشل في جلب البيانات");
      }

      const data: Worker[] = await response.json();
      if (data?.length > 0) {
        setWorkers((prev) => [...prev, ...data]);
        pageRef.current += 1;
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [filters, pageRef, setWorkers, setHasMore, setLoading, setError]);

  return fetchData;
};

// FilterSection component
const FilterSection: React.FC<{
  filters: Filters;
  onFilterChange: (e: React.ChangeEvent<HTMLInputElement>, column: keyof Filters) => void;
  onReset: () => void;
  onSearch: () => void;
}> = React.memo(({ filters, onFilterChange, onReset, onSearch }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
    <div className="flex gap-4">
      <button
        onClick={onReset}
        className="rounded-lg bg-gray-500 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:bg-gray-600 flex-1"
      >
        إعادة ضبط
      </button>
      <button
        onClick={onSearch}
        className="rounded-lg bg-blue-600 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700 flex-1"
      >
        بحث
      </button>
    </div>
  </div>
));

// WorkersTable component
const WorkersTable: React.FC<{
  workers: Worker[];
  expandedRow: string | null;
  onRowClick: (id: string) => void;
}> = React.memo(({ workers, expandedRow, onRowClick }) => {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-lg">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-yellow-500 text-white">
            {["اسم العاملة", "رقم الجواز", "الحالة", "الموظف", "التاريخ"].map((header) => (
              <th key={header} className="px-4 py-3 text-right font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {workers.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                لا توجد عاملات مسكنات حاليًا
              </td>
            </tr>
          ) : (
            workers.map((worker) => (
              <tr
                key={worker.id}
                // onClick={() => onRowClick(worker.id)}
                className={`cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                  expandedRow === worker.id ? "bg-gray-100" : ""
                }`}
              >
                <td className="border-b border-gray-200 px-4 py-3 text-right">{worker.HomeMaid.Name}</td>
                <td className="border-b border-gray-200 px-4 py-3 text-right">
                  {worker.HomeMaid.Passportnumber}
                </td>
                <td className="border-b border-gray-200 px-4 py-3 text-right">
                  {worker.status === "غير محدد" ? (
                    <span className="text-gray-500">{worker.status}</span>
                  ) : (
                    worker.status
                  )}
                </td>
                <td className="border-b border-gray-200 px-4 py-3 text-right">{worker.employee}</td>
                <td className="border-b border-gray-200 px-4 py-3 text-right">{formatDate(worker.date)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});

// StatusModal component
const StatusModal: React.FC<{
  open: boolean;
  onClose: () => void;
  status: string;
  dateStatus: string;
  onStatusChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDateStatusChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
}> = React.memo(({ open, onClose, status, dateStatus, onStatusChange, onDateStatusChange, onSave }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <Typography variant="h6" className="mb-4 text-right font-bold">
          تحديث الحالة
        </Typography>
        <div className="grid grid-cols-1 gap-4">
          <TextField
            label="الحالة"
            value={status}
            onChange={onStatusChange}
            fullWidth
            className="text-right"
            required
            error={!status}
            helperText={!status ? "الحالة مطلوبة" : ""}
          />
          <TextField
            label="تاريخ الحالة"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={dateStatus}
            onChange={onDateStatusChange}
            fullWidth
            className="text-right"
          />
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <Button
            variant="contained"
            className="bg-blue-600 text-white"
            onClick={onClose}
          >
            إغلاق
          </Button>
          <Button
            variant="contained"
            className="bg-green-600 text-white"
            onClick={onSave}
            disabled={!status}
          >
            تحديث
          </Button>
        </div>
      </div>
    </div>
  );
});

// Main Table component
const Table: React.FC = () => {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    Name: "",
    Passportnumber: "",
  });
  const [status, setStatus] = useState("");
  const [dateStatus, setDateStatus] = useState("");
  const [openStatusModal, setOpenStatusModal] = useState(false);
  const [selectedHomeMaidId, setSelectedHomeMaidId] = useState<string | null>(null);
  const pageRef = useRef(1);

  const fetchData = useFetchWorkers(filters, pageRef, setWorkers, setHasMore, setLoading, setError);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBack = () => router.back();

  const handleRowClick = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id));
    const worker = workers.find((w) => w.id === id);
    if (worker) {
      setSelectedHomeMaidId(worker.homeMaid_id);
      setStatus(worker.status === "غير محدد" ? "" : worker.status);
      setDateStatus(worker.date ? formatDate(worker.date) : "");
      setOpenStatusModal(true);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>, column: keyof Filters) => {
    setFilters((prev) => ({ ...prev, [column]: e.target.value }));
  };

  const handleResetFilters = () => {
    setFilters({
      Name: "",
      Passportnumber: "",
    });
    setWorkers([]);
    pageRef.current = 1;
    setHasMore(true);
    fetchData();
  };

  const handleSearch = () => {
    setWorkers([]);
    pageRef.current = 1;
    setHasMore(true);
    fetchData();
  };

  const handleCloseStatusModal = () => {
    setOpenStatusModal(false);
    setStatus("");
    setDateStatus("");
    setSelectedHomeMaidId(null);
  };

  const handleSaveStatus = async () => {
    if (!selectedHomeMaidId || !status) {
      alert("يرجى اختيار حالة ومعرف العاملة");
      return;
    }

    try {
      const response = await fetch("/api/weekly-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ID: selectedHomeMaidId,
          status,
          date: dateStatus || new Date().toISOString(),
          employee: "admin",
        }),
      });

      if (response.ok) {
        handleCloseStatusModal();
        setWorkers([]);
        pageRef.current = 1;
        setHasMore(true);
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || "فشل تحديث الحالة");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("حدث خطأ أثناء تحديث الحالة");
    }
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
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center rounded-lg bg-gray-600 px-4 py-2 text-white shadow-md transition-all duration-300 hover:bg-gray-700"
          >
            <ChevronLeftIcon className="mr-2 h-5 w-5" />
            رجوع
          </button>
          <div className="flex gap-4">
            <button
        className="rounded-lg bg-blue-600 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700 flex-1"

              // className="rounded-lg bg-yellow-500 font-semibold text-white shadow-md transition-all duration-300 hover:bg-yellow-600"
              onClick={() => router.push("/admin/housedarrivals")}
            >
              جدول التسكين
            </button>
            {/* <Button
              variant="contained"
              className="rounded-lg bg-blue-600 font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700"
              onClick={() => router.push("/admin/checklisttable")}
            >
              بيانات الإعاشة
            </Button> */}
          </div>
        </div>

        <Typography variant="h4" className="mb-6 text-right font-bold text-gray-800">
          حالات العاملات الأسبوعية
        </Typography>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        <FilterSection
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          onSearch={handleSearch}
        />

        <WorkersTable workers={workers} expandedRow={expandedRow} onRowClick={handleRowClick} />

        <StatusModal
          open={openStatusModal}
          onClose={handleCloseStatusModal}
          status={status}
          dateStatus={dateStatus}
          onStatusChange={(e) => setStatus(e.target.value)}
          onDateStatusChange={(e) => setDateStatus(e.target.value)}
          onSave={handleSaveStatus}
        />

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