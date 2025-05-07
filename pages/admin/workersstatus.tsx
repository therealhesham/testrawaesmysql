
import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import Layout from 'example/containers/Layout';

interface HousedWorker {
  id: number;
  homeMaid_id: number;
  Name: string;
  Nationalitycopy: string;
  employee: string;
  houseentrydate: string;
  status: string;
}

const Home = () => {
  const [workers, setWorkers] = useState<HousedWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusModal, setStatusModal] = useState<{ show: boolean; workerId: number | null }>({ show: false, workerId: null });
  const [newStatus, setNewStatus] = useState('');
  const [employeeName, setEmployeeName] = useState('');

  // Fetch workers from 
  const fetchWorkers = async () => {
      try {
        const response = await axios.get('/api/statuscheckerdetailed');
        setWorkers(response.data);
        setLoading(false);
      } catch (err) {
        setError('فشل في جلب بيانات العاملات');
        setLoading(false);
      }
    };
  useEffect(() => {
    
    fetchWorkers();
  }, []);

  // Handle status submission
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModal.workerId || !newStatus || !employeeName) return;

    try {
const result =       await axios.post('/api/weekly-status', {
        ID: statusModal.workerId,
        status: newStatus,
        employee: employeeName,
        date: new Date().toISOString(),
      });
      setStatusModal({ show: false, workerId: null });
      setNewStatus('');
      setEmployeeName('');
      // Refresh workers list
      // const response = await axios.get('/api/statuscheckerdetailed');
      // setWorkers(response.data);
      if(result.status == 201)  return fetchWorkers()

    } catch (err) {
      setError('فشل في إرسال الحالة');
    }
  };

  return (
    <Layout>
    <div className="min-h-screen">
      <Head>
        <title>إدارة حالة العاملات</title>
        <meta name="description" content="إدارة حالة العاملات الأسبوعية بطريقة أنيقة" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center font-arabic">
          إدارة الحالة الأسبوعية للعاملات
        </h1>

        {loading && <p className="text-center text-gray-600 font-arabic">جارٍ التحميل...</p>}
        {error && <p className="text-center text-red-500 font-arabic">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {workers.map((worker) => (
            <div
              key={worker.id}
              className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300 border-l-4 border-teal-500"
            >
              <h2 className="text-2xl font-semibold text-gray-800 font-arabic">{worker.Name}</h2>
              <p className="text-gray-600 font-arabic">الجنسية: {worker.Nationalitycopy}</p>
              <p className="text-gray-600 font-arabic">
                تاريخ الدخول: {new Date(worker.houseentrydate).toLocaleDateString('ar-EG')}
              </p>
              <p className="text-gray-600 font-arabic">الحالة الحالية: {worker.status || 'لا توجد حالة'}</p>
              <button
                onClick={() => setStatusModal({ show: true, workerId: worker.homeMaid_id })}
                className="mt-4 bg-gradient-to-r from-teal-600 to-teal-400 text-white px-4 py-2 rounded-md  font-bold transition-colors font-arabic"
              >
                تحديث الحالة
              </button>
            </div>
          ))}
        </div>

        {/* Status Update Modal */}
        {statusModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center transition-opacity duration-300">
            <div className="bg-white rounded-xl p-8 w-full max-w-lg shadow-2xl transform scale-100 transition-transform duration-300">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 font-arabic">تحديث حالة العاملة</h2>
              <form onSubmit={handleStatusSubmit}>
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2 font-arabic" htmlFor="status">
                    الحالة
                  </label>
                  <input
                    type="text"
                    id="status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-arabic"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2 font-arabic" htmlFor="employee">
                    اسم الموظف
                  </label>
                  <input
                    type="text"
                    id="employee"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-arabic"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setStatusModal({ show: false, workerId: null })}
                    className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 font-arabic"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 font-arabic"
                  >
                    إرسال
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @font-face {
          font-family: 'Arabic';
          src: url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
        }
        .font-arabic {
          font-family: 'Cairo', sans-serif;
        }
      `}</style>
    </div>
    </Layout>
  );
};

export default Home;
// import { Button, TextField, Typography } from "@mui/material";
// import { useRouter } from "next/router";
// import React, { useCallback, useEffect, useRef, useState } from "react";
// import Layout from "example/containers/Layout";
// import { ChevronLeftIcon } from "@heroicons/react/solid";

// // واجهات TypeScript
// interface Worker {
//   id: string;
//   HomeMaid: { Name: string; Passportnumber: string };
//   status: string;
//   employee: string;
//   date: string;
//   hasNoStatus: boolean; // حقل جديد
// }
// interface WeekData {
//   week: string;
//   statuses: Worker[];
// }

// interface Filters {
//   Name: string;
//   Passportnumber: string;
// }

// interface SortConfig {
//   key: string | null;
//   direction: "asc" | "desc";
// }

// // Custom Hook لجلب البيانات
// const useFetchWorkers = (
//   filters: Filters,
//   pageRef: React.MutableRefObject<number>,
//   setWeeksData: React.Dispatch<React.SetStateAction<WeekData[]>>,
//   setHasMore: React.Dispatch<React.SetStateAction<boolean>>,
//   setLoading: React.Dispatch<React.SetStateAction<boolean>>
// ) => {
//   const isFetchingRef = useRef(false);

//   const fetchData = useCallback(async () => {
//     if (isFetchingRef.current || !setHasMore) return;
//     isFetchingRef.current = true;
//     setLoading(true);

//     try {
//       const queryParams = new URLSearchParams({
//         Name: filters.Name,
//         Passportnumber: filters.Passportnumber,
//         page: String(pageRef.current),
//         weeks: "4", // عدد الأسابيع
//       });

//       const response = await fetch(`/api/weekly-status?${queryParams}`, {
//         headers: { Accept: "application/json", "Content-Type": "application/json" },
//         method: "GET",
//       });

//       const data = await response.json();
//       if (data.weeks?.length > 0) {
//         setWeeksData((prev) => [...prev, ...data.weeks]);
//         pageRef.current += 1;
//       } else {
//         setHasMore(false);
//       }
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     } finally {
//       setLoading(false);
//       isFetchingRef.current = false;
//     }
//   }, [filters, pageRef, setWeeksData, setHasMore, setLoading]);

//   return fetchData;
// };

// // تنسيق التاريخ
// const formatDate = (date: string): string => {
//   return new Date(date).toISOString().split("T")[0];
// };

// // مكون الفلاتر
// const FilterSection: React.FC<{
//   filters: Filters;
//   onFilterChange: (e: React.ChangeEvent<HTMLInputElement>, column: keyof Filters) => void;
//   onReset: () => void;
//   onSearch: () => void;
// }> = React.memo(({ filters, onFilterChange, onReset, onSearch }) => (
//   <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
//     <input
//       type="text"
//       value={filters.Name}
//       onChange={(e) => onFilterChange(e, "Name")}
//       placeholder="بحث باسم العاملة"
//       className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-right shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
//     />
//     <input
//       type="text"
//       value={filters.Passportnumber}
//       onChange={(e) => onFilterChange(e, "Passportnumber")}
//       placeholder="بحث برقم الجواز"
//       className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-right shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
//     />
//     {/* dag */}
//     <button
//       onClick={onReset}
//       className="rounded-lg bg-gray-500 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:bg-gray-600"
//     >
//       إعادة ضبط
//     </button>
//     <button
//       onClick={onSearch}
//       className="rounded-lg bg-blue-600 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700"
//     >
//       بحث
//     </button>
//   </div>
// ));

// // مكون الجدول الأسبوعي
// const WeeklyTable: React.FC<{
//   weeksData: WeekData[];
//   expandedRow: string | null;
//   onRowClick: (id: string) => void;
// }> = React.memo(({ weeksData, expandedRow, onRowClick }) => (
//   <div className="space-y-8">
//     {weeksData.map((week) => (
//       <div key={week.week} className="overflow-hidden rounded-lg bg-white shadow-lg">
//         <Typography
//           variant="h6"
//           className="bg-yellow-500 px-4 py-3 text-right font-semibold text-white"
//         >
//           الأسبوع: {week.week}
//         </Typography>
//         {week.statuses.length === 0 ? (
//           <div className="bg-gray-200 p-4 text-center">
//             <Typography variant="body1" className="text-gray-500">
//               لا توجد حالات متاحة لهذا الأسبوع
//             </Typography>
//           </div>
//         ) : (
//           <table className="w-full border-collapse">
//             <thead>
//               <tr className="bg-gray-100">
//                 {["اسم العاملة", "رقم الجواز", "الحالة", "الموظف", "التاريخ"].map(
//                   (header) => (
//                     <th key={header} className="px-4 py-3 text-right font-semibold">
//                       {header}
//                     </th>
//                   )
//                 )}
//               </tr>
//             </thead>
//           <tbody>
//   {week.statuses.map((worker) => (
//     <tr
//       key={worker.id}
//       onClick={() => onRowClick(worker.id)}
//       className={`cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
//         expandedRow === worker.id ? "bg-gray-100" : ""
//       } ${worker.hasNoStatus ? "bg-gray-400 text-white" : ""}`} // لون جاف للعاملات بدون حالة
//     >
//       <td className="border-b border-gray-200 px-4 py-3 text-right">
//         {worker.HomeMaid.Name}
//       </td>
//       <td className="border-b border-gray-200 px-4 py-3 text-right">
//         {worker.HomeMaid.Passportnumber}
//       </td>
//       <td className="border-b border-gray-200 px-4 py-3 text-right">
//         {worker.status}
//       </td>
//       <td className="border-b border-gray-200 px-4 py-3 text-right">
//         {worker.employee}
//       </td>
//       <td className="border-b border-gray-200 px-4 py-3 text-right">
//         {formatDate(worker.date)}
//       </td>
//     </tr>
//   ))}
// </tbody>
//           </table>
//         )}
//       </div>
//     ))}
//   </div>
// ));

// // المكون الرئيسي
// const Table: React.FC = () => {
//   const router = useRouter();
//   const [weeksData, setWeeksData] = useState<WeekData[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [hasMore, setHasMore] = useState(true);
//   const [expandedRow, setExpandedRow] = useState<string | null>(null);
//   const [filters, setFilters] = useState<Filters>({ Name: "", Passportnumber: "" });
//   const pageRef = useRef(1);

//   const fetchData = useFetchWorkers(filters, pageRef, setWeeksData, setHasMore, setLoading);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   const handleBack = () => router.back();

//   const handleRowClick = (id: string) => {
//     setExpandedRow((prev) => (prev === id ? null : id));
//   };

//   const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>, column: keyof Filters) => {
//     setFilters((prev) => ({ ...prev, [column]: e.target.value }));
//   };

//   const handleResetFilters = () => {
//     setFilters({ Name: "", Passportnumber: "" });
//     setWeeksData([]);
//     pageRef.current = 1;
//     setHasMore(true);
//     fetchData();
//   };

//   const handleSearch = () => {
//     setWeeksData([]);
//     pageRef.current = 1;
//     setHasMore(true);
//     fetchData();
//   };

//   const loadMoreRef = useCallback(
//     (node: HTMLDivElement | null) => {
//       if (!node || loading || !hasMore) return;
//       const observer = new IntersectionObserver(
//         (entries) => {
//           if (entries[0].isIntersecting) fetchData();
//         },
//         { threshold: 1.0 }
//       );
//       observer.observe(node);
//       return () => observer.disconnect();
//     },
//     [loading, hasMore, fetchData]
//   );

//   return (
//     <Layout>
//       <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
//         {/* Header */}
//         <div className="mb-6 flex items-center justify-between">
//           <button
//             onClick={handleBack}
//             className="flex items-center rounded-lg bg-gray-600 px-4 py-2 text-white shadow-md transition-all duration-300 hover:bg-gray-700"
//           >
//             <ChevronLeftIcon className="mr-2 h-5 w-5" />
//             رجوع
//           </button>
//           <div className="flex gap-4">
//             <Button
//               variant="contained"
//               className="rounded-lg bg-yellow-500 font-semibold text-white shadow-md transition-all duration-300 hover:bg-yellow-600"
//               onClick={() => router.push("/admin/housedarrivals")}
//             >
//               جدول التسكين
//             </Button>
//             <Button
//               variant="contained"
//               className="rounded-lg bg-blue-600 font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700"
//               onClick={() => router.push("/admin/checklisttable")}
//             >
//               بيانات الاعاشة
//             </Button>
//           </div>
//         </div>

//         <Typography variant="h4" className="mb-6 text-right font-bold text-gray-800">
//           الحالات الأسبوعية للعاملات
//         </Typography>

//         {/* Filters */}
//         <FilterSection
//           filters={filters}
//           onFilterChange={handleFilterChange}
//           onReset={handleResetFilters}
//           onSearch={handleSearch}
//         />

//         {/* Weekly Table */}
//         <WeeklyTable weeksData={weeksData} expandedRow={expandedRow} onRowClick={handleRowClick} />

//         {/* Loading Indicator */}
//         {hasMore && (
//           <div ref={loadMoreRef} className="mt-6 flex justify-center">
//             {loading && (
//               <div className="flex items-center gap-3">
//                 <svg
//                   className="h-6 w-6 animate-spin text-blue-600"
//                   xmlns="http://www.w3.org/2000/svg"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                 >
//                   <circle
//                     className="opacity-25"
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
//                   />
//                 </svg>
//                 <span className="font-medium text-gray-600">جاري التحميل...</span>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </Layout>
//   );
// };

// export default Table;