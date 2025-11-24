import { useState, useEffect, useCallback, useMemo } from 'react';
import { CalendarIcon, SearchIcon, XIcon } from '@heroicons/react/outline';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css";
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // لإضافة الجداول في PDF
import * as XLSX from 'xlsx';
import { useRouter } from 'next/router';
import Modal from 'components/modal';
import { jwtDecode } from 'jwt-decode';
// Custom debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Skeleton component
const SkeletonRow = ({ colCount }) => (
  <div className="grid grid-cols-[1.5fr_repeat(var(--col-count),1fr)] bg-[#f7f8fa] border-t border-[#e0e0e0] animate-pulse">
    <div className="p-[17px_10px] pr-[31px]">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
    </div>
    {Array(colCount).fill(0).map((_, i) => (
      <div key={i} className="p-[17px_10px] flex items-center justify-center">
        <div className="h-4 bg-gray-300 rounded w-8"></div>
      </div>
    ))}
  </div>
);

export default function Subsistence() {
const [userName, setUserName] = useState('');
useEffect(()=>{

const token = localStorage.getItem('token');
const decoded = jwtDecode(token);
// const time = decoded.exp;
setUserName(decoded.username);
// console.log(decoded);  
},[])



  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDate, setDeleteDate] = useState('');
  const [isAddCashModalOpen, setIsAddCashModalOpen] = useState(false);
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '', title: 'خطأ' });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [search] = useDebounce(searchQuery, 500);
  const [workers, setWorkers] = useState([]);
  const [dailyTotals, setDailyTotals] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  // Generate date range for table headers
  const getDateRange = useCallback((start, end) => {
    const dates = [];
    const current = new Date(start);
    const endDateObj = new Date(end);
    while (current <= endDateObj) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, []);

  // Memoized dates
  const dates = useMemo(() => {
    if (!startDate || !endDate) return [];
    return getDateRange(startDate, endDate);
  }, [startDate, endDate, getDateRange]);

  // Validate date range
  const daysDiff = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
  }, [startDate, endDate]);

  // Fetch data from API
  const fetchData = useCallback(async (currentPage = 1) => {
    if (!startDate || !endDate || loading || daysDiff > 30) return;
    
    setIsFetching(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        search,
        page: currentPage.toString(),
        limit: '50'
      });

      const response = await fetch(`/api/checkedtable?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setWorkers(data.workers || []);
        setDailyTotals(data.dailyTotals || {});
        setPage(currentPage);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      } else {
        setError(data.message || 'حدث خطأ أثناء جلب البيانات');
        setWorkers([]);
      }
    } catch (err) {
      setError('فشل في الاتصال بالخادم');
      setWorkers([]);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [startDate, endDate, search, loading, daysDiff]);

  // Debounced fetch effect
  useEffect(() => {
    if (!startDate || !endDate) return;
    
    const timer = setTimeout(() => {
      setPage(1);
      fetchData(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [startDate, endDate, search, fetchData]);

  // Handle delete action
  const handleDelete = async (e) => {
    e.preventDefault();
    if (!deleteDate) {
      setErrorModal({ isOpen: true, message: 'يرجى اختيار تاريخ', title: 'تنبيه' });
      return;
    }
    try {
      const response = await fetch(`/api/checkedtable?date=${deleteDate}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        setErrorModal({ isOpen: true, message: data.message, title: 'نجح' });
        setIsModalOpen(false);
        setDeleteDate('');
        fetchData(page);
      } else {
        setErrorModal({ isOpen: true, message: data.message || 'حدث خطأ أثناء الحذف', title: 'خطأ' });
      }
    } catch (err) {
      setErrorModal({ isOpen: true, message: 'فشل في الاتصال بالخادم', title: 'خطأ' });
    }
  };

  // Set default date range
  useEffect(() => {
    const today = new Date();
    const defaultEnd = today.toISOString().split('T')[0];
    const defaultStart = new Date(today.setDate(today.getDate() - 6)).toISOString().split('T')[0];
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
  }, []);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && !isFetching) {
      fetchData(newPage);
    }
  };

  // Reset function
  const handleReset = () => {
    setSearchQuery('');
    const today = new Date();
    const defaultEnd = today.toISOString().split('T')[0];
    const defaultStart = new Date(today.setDate(today.getDate() - 6)).toISOString().split('T')[0];
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setPage(1);
  };
const [amount, setAmount] = useState('');
const [period, setPeriod] = useState('');

  const addCash = async () => {
    if (!amount || !period) {
      setErrorModal({ isOpen: true, message: 'يرجى إدخال المبلغ واختيار الفترة', title: 'تنبيه' });
      return;
    }
    
    try {
      // السنة الحالية تلقائياً
      const currentYear = new Date().getFullYear();
      
      // تحويل الفترة إلى شهر بناءً على اختيار المستخدم
      // إذا كان يومي أو أسبوعي، سنستخدم الشهر الحالي
      // إذا كان شهري، سنستخدم الشهر الحالي أيضاً (أو يمكن التعديل حسب الحاجة)
      const currentMonth = new Date().getMonth() + 1;
      
      const response = await fetch('/api/addcash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          Month: currentMonth,
          Year: currentYear.toString(),
          transaction_type: period, // استخدام الفترة كـ transaction_type
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setIsAddCashModalOpen(false);
        setAmount('');
        setPeriod('');
        fetchData(page);
      } else {
        setErrorModal({ isOpen: true, message: data.error || 'حدث خطأ أثناء إضافة المبلغ', title: 'خطأ' });
      }
    } catch (error) {
      console.error('Error adding cash:', error);
      setErrorModal({ isOpen: true, message: 'حدث خطأ أثناء إضافة المبلغ', title: 'خطأ' });
    }
  }
const exportToPDF = async () => {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.width;

  // 🖼️ إضافة اللوجو
  const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
  const logoBuffer = await logo.arrayBuffer();
  const logoBytes = new Uint8Array(logoBuffer);
  const logoBase64 = Buffer.from(logoBytes).toString('base64');
  doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

  // 🔤 تحميل الخط العربي
  try {
    const response = await fetch('/fonts/Amiri-Regular.ttf');
    if (!response.ok) throw new Error('Failed to fetch font');
    const fontBuffer = await response.arrayBuffer();
    const fontBytes = new Uint8Array(fontBuffer);
    const fontBase64 = Buffer.from(fontBytes).toString('base64');

    doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.setFont('Amiri', 'normal');
  } catch (error) {
    console.error('Error loading Amiri font:', error);
    return;
  }

  // 🏷️ العنوان والتاريخ
  doc.setFontSize(14);
  doc.text('تقرير الإعاشة', 150, 20, { align: 'right' });
  doc.setFontSize(8);
  doc.text(
    "التاريخ: " +
      new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }) +
      " الساعة: " +
      new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    70,
    30,
    { align: 'right' }
  );

  // 📅 الأعمدة والبيانات
  const tableHeaders = [
    ...dates.map(date =>
      new Date(date).toLocaleDateString('ar-EG', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    ),
    'اسم العاملة'
  ];

  const tableData =
    workers.length > 0
      ? workers.map((worker) => [
          ...dates.map(date =>
            worker.dailyCosts?.[date] ? parseFloat(worker.dailyCosts[date]).toFixed(2) : '0.00'
          ),
          worker.Name
        ])
      : [[...dates.map(() => '0.00'), 'لا توجد بيانات']];

  // 📊 الجدول
  doc.autoTable({
    head: [tableHeaders],
    body: tableData,
    styles: {
      font: 'Amiri',
      halign: 'center',
      fontSize: 10,
      overflow: 'hidden', // ✅ لو النص طويل يظهر بنقط (...)
      cellWidth: 'auto',
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [26, 77, 79],
      textColor: [255, 255, 255],
      halign: 'center',
      overflow: 'hidden', // ✅ نفس الكلام للهيدر
    },
    columnStyles: {
      // تطبّق نفس القاعدة على كل الأعمدة
      0: { cellWidth: 'auto', overflow: 'hidden' },
      1: { cellWidth: 'auto', overflow: 'hidden' },
      2: { cellWidth: 'auto', overflow: 'hidden' },
      3: { cellWidth: 'auto', overflow: 'hidden' },
      4: { cellWidth: 'auto', overflow: 'hidden' },
      5: { cellWidth: 'auto', overflow: 'hidden' },
      6: { cellWidth: 'auto', overflow: 'hidden' },
      7: { cellWidth: 'auto', overflow: 'hidden' },
      8: { cellWidth: 'auto', overflow: 'hidden' },
      9: { cellWidth: 'auto', overflow: 'hidden' },
      10: { cellWidth: 'auto', overflow: 'hidden' },
    },
    margin: { top: 40, right: 10, left: 10 },
    direction: 'rtl',
    didParseCell: (data) => {
      data.cell.styles.halign = 'center';
    },
  });

  // ✍️ التوقيع أو اسم المستخدم في آخر الصفحة
  doc.setFontSize(8);
  doc.text(userName, 10, doc.internal.pageSize.height - 10, { align: 'left' });

  // 💾 حفظ الملف
  doc.save('تقرير الاعاشة.pdf');
};

  // Export to Excel
const exportToExcel = () => {
  const wb = XLSX.utils.book_new();

  // Define column headers explicitly in the desired order (right to left)
  const headers = [
    'اسم العاملة', // Rightmost column
    ...[...dates]
      .reverse() // Reverse dates to start from the right
      .map(date =>
        new Date(date).toLocaleDateString('ar-EG', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      ),
  ];

  // Prepare table data with explicit column order
  const tableData = workers.length > 0
    ? workers.map(worker => {
        const row = {};
        // Set worker name as the first key (rightmost column)
        row['اسم العاملة'] = worker.Name;
        // Add dates in reverse order
        [...dates].reverse().forEach(date => {
          const formattedDate = new Date(date).toLocaleDateString('ar-EG', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          });
          row[formattedDate] = worker.dailyCosts?.[date]
            ? parseFloat(worker.dailyCosts[date]).toFixed(2)
            : '0.00';
        });
        return row;
      })
    : [
        {
          'اسم العاملة': 'لا توجد بيانات',
          ...[...dates]
            .reverse()
            .reduce((acc, date) => {
              const formattedDate = new Date(date).toLocaleDateString('ar-EG', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });
              return {
                ...acc,
                [formattedDate]: '0.00',
              };
            }, {}),
        },
      ];

  // Create worksheet with explicit header order
  const ws = XLSX.utils.json_to_sheet(tableData, { header: headers });

  // Set the worksheet to be right-to-left
  ws['!rtl'] = true;

  // Set column widths
  ws['!cols'] = headers.map((_, index) => ({
    wch: index === 0 ? 20 : 15, // Wider column for 'اسم العاملة', others narrower
  }));

  // Append the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'اعاشة');

  // Export the file
  XLSX.writeFile(wb, 'تقرير الاعاشة.xlsx');
};
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 3 }, (_, i) => currentYear - 1 + i),
    [currentYear]
  );
  return (
    <Layout>
      <div className={`min-h-screen font-tajawal text-[#1f2937] flex justify-center p-[33px] sm:p-[31px] ${Style["tajawal-regular"]}`}>
        {/* Modal Overlay */}
        {isModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[999]"
            onClick={() => setIsModalOpen(false)}
          />
        )}


        {/* Main Content */}
        <main className="w-full max-w-[1440px]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-[5px] mb-6 text-right">
              {error}
              {daysDiff > 30 && (
                <button
                  onClick={handleReset}
                  className="ml-2 text-red-700 underline hover:text-red-900"
                >
                  إعادة ضبط
                </button>
              )}
            </div>
          )}

          {loading && (
            <div className="text-center mb-6 text-base text-[#1a4d4f] font-medium">
              جارٍ التحميل...
            </div>
          )}

          <section>
            <h1 className="text-[32px] font-normal text-black text-right mb-[26px]">
              الاعاشة
            </h1>
            <div className=" border border-[#e0e0e0] rounded-[5px] p-[22px]">
              {/* Controls Bar */}
              <div className="flex flex-wrap justify-between items-center gap-4 mb-[26px]">
                <div className="flex flex-wrap flex-row-reverse gap-4">


 <button
                    className="bg-teal-900 text-white px-3 py-[7.5px] rounded-[5px] text-md hover:bg-[#14595b] transition-colors"
                    onClick={() => setIsAddCashModalOpen(true)}
                  >
                    اضافة مبلغ
                  </button>
                  
                  <button
                    className="bg-teal-900 text-white px-3 py-[7.5px] rounded-[5px] text-md hover:bg-[#14595b] transition-colors"
                    onClick={() => setIsModalOpen(true)}
                  >
                    حذف سجلات
                  </button>
                  <button
                    className="bg-teal-900 text-white px-3 py-[7.5px] rounded-[5px] text-md hover:bg-[#14595b] transition-colors"
                    onClick={handleReset}
                  >
                    إعادة ضبط
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-[14px] text-[#1f2937] font-medium whitespace-nowrap">إلى:</label>
                    <div className="flex items-center gap-1 bg-[#f7f8fa] border border-[#e0e0e0] rounded-[5px] px-[10px] py-[8px] text-md text-[#6b7280]">
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent border-none w-[100px] outline-none"
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-[14px] text-[#1f2937] font-medium whitespace-nowrap">من:</label>
                    <div className="flex items-center gap-1 bg-[#f7f8fa] border border-[#e0e0e0] rounded-[5px] px-[10px] py-[8px] text-md text-[#6b7280]">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent border-none outline-none"
                        max={endDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-[#f7f8fa] border border-[#e0e0e0] rounded-[5px] px-[10px] py-[8px] text-md text-[#6b7280]">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="بحث..."
                      className="bg-transparent border-none w-full outline-none"
                    />
                    <SearchIcon className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-[14px] text-[14px] text-[#1a4d4f]">
                    <button
                      disabled={isFetching}
                      className="p-1 disabled:opacity-50"
                    >
                      <ChevronRight className="w-[17px] h-[34px] transform rotate-180" />
                    </button>
                    <span>{daysDiff > 0 ? `${daysDiff + 1} أيام` : 'اختر التواريخ'}</span>
                    <button
                      disabled={isFetching}
                      className="p-1 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-[17px] h-[34px]" />
                    </button>
                  </div>
                  <div className="flex gap-[6px]">
                    <button 
                      onClick={exportToPDF}
                      className="flex items-center gap-1 bg-teal-900 text-white px-[10px] py-[5px] rounded-[3px] text-md hover:bg-[#14595b] transition-colors"
                    >
                      PDF
                    </button>
                    <button 
                      onClick={exportToExcel}
                      className="flex items-center gap-1 bg-teal-900 text-white px-[10px] py-[5px] rounded-[3px] text-md hover:bg-[#14595b] transition-colors"
                    >
                      Excel
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-[#e0e0e0] rounded-[5px] overflow-hidden">
                {/* Header */}
                <div 
                  className="grid" 
                  style={{ 
                    gridTemplateColumns: `1.5fr ${dates.map(() => '1fr').join(' ')}`,
                    '--col-count': dates.length
                  }}
                  css={{ '--col-count': dates.length }}
                >
                  <div className="p-[17px_10px] pr-[31px] text-right text-[15px] font-medium bg-teal-900 text-[#f7f8fa]">
                    اسم العاملة
                  </div>
                  {dates.map((date, i) => (
                    <div key={i} className="p-[17px_10px] text-center leading-tight bg-teal-900 text-[#f7f8fa] text-[13px]">
                      {new Date(date).toLocaleDateString('ar-EG', { 
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short' 
                      })}
                    </div>
                  ))}
                </div>

                {/* Loading Skeletons */}
                {loading && !workers.length && Array(10).fill(0).map((_, i) => (
                  <SkeletonRow key={`skeleton-${i}`} colCount={dates.length} />
                ))}

                {/* Data Rows */}
                <div className="max-h-[60vh] overflow-y-auto">
                  {workers.map((worker) => (
                    <div
                      key={worker.id}
                      className="grid" 
                      style={{ 
                        gridTemplateColumns: `1.5fr ${dates.map(() => '1fr').join(' ')}`
                      }}
                      css={{ '--col-count': dates.length }}
                    >
                      <div className="p-[17px_10px] pr-[31px] text-right text-[16px] cursor-pointer font-medium bg-[#f7f8fa] border-t border-[#e0e0e0] sticky left-0 z-10 bg-[#f7f8fa]" onClick={() => router.push(`/admin/homemaidinfo/?id=${worker.homemaid_id}`)}>
                        {worker.Name}
                      </div>
                      {dates.map((date, i) => (
                        <div key={i} className="p-[17px_10px] text-center border-t border-[#e0e0e0]">
                          {worker.dailyCosts?.[date] 
                            ? parseFloat(worker.dailyCosts[date]).toFixed(2)
                            : '0.00'
                          }
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-[26px] px-[5px] gap-4">
                  <nav className="flex gap-[5px] items-center">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={page === 1 || isFetching}
                      className="border border-[#e0e0e0] rounded-[2px] min-w-[40px] h-[30px] flex items-center justify-center px-2 text-md text-[#1f2937] bg-[#f7f8fa] hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      أول
                    </button>
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1 || isFetching}
                      className="border border-[#e0e0e0] rounded-[2px] min-w-[30px] h-[30px] flex items-center justify-center text-md text-[#1f2937] bg-[#f7f8fa] hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      التالي
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages, page - 2 + i));
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={isFetching}
                          className={`border rounded-[2px] min-w-[30px] h-[30px] flex items-center justify-center text-md transition-colors ${
                            page === pageNum
                              ? 'border-[#1a4d4f] text-[#f7f8fa] bg-teal-900'
                              : 'border-[#e0e0e0] text-[#1f2937] bg-[#f7f8fa] hover:bg-gray-200'
                          } disabled:opacity-50`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages || isFetching}
                      className="border border-[#e0e0e0] rounded-[2px] min-w-[30px] h-[30px] flex items-center justify-center text-md text-[#1f2937] bg-[#f7f8fa] hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      السابق
                    </button>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={page === totalPages || isFetching}
                      className="border border-[#e0e0e0] rounded-[2px] min-w-[40px] h-[30px] flex items-center justify-center px-2 text-md text-[#1f2937] bg-[#f7f8fa] hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      آخر
                    </button>
                  </nav>
                  
                  <div className="flex items-center gap-2 text-md text-gray-700">
                    <span>الصفحة {page} من {totalPages}</span>
                    <span>|</span>
                    <span>عرض {((page - 1) * 50) + 1}-{Math.min(page * 50, totalCount)} من {totalCount} نتيجة</span>
                  </div>
                </div>
              )}
            </div>
          </section>


{/* Add Amount Modal Overlay */}
{isAddCashModalOpen && (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 z-[999]"
    onClick={() => {
      setIsAddCashModalOpen(false);
      setAmount('');
      setPeriod('');
    }}
  />
)}

<section className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#f7f8fa] border border-[#e0e0e0] rounded-[5px] p-[40px_48px] flex flex-col gap-[40px] z-[1000] w-full max-w-[731px] shadow-2xl ${
              isAddCashModalOpen ? 'flex' : 'hidden'
            }`}>
    <div className='flex flex-col gap-[20px] relative'>
      <XIcon className="w-4 h-4 absolute top-0 left-0 cursor-pointer text-gray-600 hover:text-gray-800" onClick={() => {
        setIsAddCashModalOpen(false);
        setAmount('');
        setPeriod('');
      }} />

      <h2 className="text-[24px] font-normal text-black text-right m-0 mb-4">اضافة مبلغ</h2>

      <div className="flex flex-row-reverse gap-4 items-start">
        {/* Period Selection - Right Side */}
        <div className="flex flex-col gap-[8px] flex-1">
          <label htmlFor="period" className="text-[14px] text-[#1f2937] text-right font-medium">الفترة</label>
          <div className="relative">
            <select 
              id="period" 
              className="w-full bg-white border border-[#e0e0e0] rounded-[5px] px-[10px] py-[10px] pr-8 text-md text-[#6b7280] outline-none appearance-none cursor-pointer"
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="">اختر الفترة</option>
              <option value="daily">يومي</option>
              <option value="weekly">اسبوعي</option>
              <option value="monthly">شهري</option>
            </select>
            <ChevronLeft className="w-4 h-4 absolute left-[10px] top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>
        </div>

        {/* Amount Input - Left Side */}
        <div className="flex flex-col gap-[8px] flex-1">
          <label htmlFor="amount" className="text-[14px] text-[#1f2937] text-right font-medium">المبلغ</label>
          <input 
            type="number" 
            id="amount" 
            className="w-full bg-white border border-[#e0e0e0] rounded-[5px] px-[10px] py-[10px] text-md text-[#6b7280] outline-none placeholder:text-gray-400" 
            placeholder={period === 'daily' ? 'ادخل المبلغ اليومي' : period === 'weekly' ? 'ادخل المبلغ الاسبوعي' : period === 'monthly' ? 'ادخل المبلغ الشهري' : 'ادخل المبلغ'}
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-row-reverse gap-4 justify-end pt-4 border-t border-[#e0e0e0]">
        <button 
          onClick={addCash} 
          className="bg-teal-900 text-white px-6 py-2 rounded-[5px] text-[16px] font-medium hover:bg-[#14595b] transition-colors"
        >
          حفظ
        </button>
        <button 
          onClick={() => {
            setIsAddCashModalOpen(false);
            setAmount('');
            setPeriod('');
          }} 
          className="bg-transparent border border-teal-900 text-teal-900 px-6 py-2 rounded-[5px] text-[16px] font-medium hover:bg-gray-50 transition-colors"
        >
          الغاء
        </button>
      </div>
    </div>
</section>


          {/* Delete Modal */}
          <section
            className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-[#e0e0e0] rounded-[5px] p-[40px_48px] flex flex-col gap-[40px] z-[1000] w-full max-w-[731px] shadow-2xl ${
              isModalOpen ? 'flex' : 'hidden'
            }`}
          >
            <h2 className="text-[24px] font-normal text-black text-right m-0">حذف سجلات</h2>
            <form onSubmit={handleDelete} className="flex flex-col gap-6">
              <div className="flex flex-col gap-[8px]">
                <label htmlFor="delete-date" className="text-[14px] text-[#1f2937] text-right font-medium">
                  تاريخ الحذف
                </label>
                <div className="flex items-center justify-between bg-[#f7f8fa] border border-[#e0e0e0] rounded-[5px] px-[10px] py-[10px] text-md text-[#6b7280]">
                  <input
                    type="date"
                    id="delete-date"
                    value={deleteDate}
                    onChange={(e) => setDeleteDate(e.target.value)}
                    className="bg-transparent border-none w-[150px] outline-none"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <CalendarIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex gap-4 justify-end pt-4 border-t">
                <button
                  type="button"
                  className="bg-transparent border border-[#1a4d4f] text-[#1a4d4f] px-6 py-2 rounded-[4px] text-[16px] font-medium hover:bg-teal-900 hover:text-white transition-colors w-[140px]"
                  onClick={() => setIsModalOpen(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!deleteDate}
                  className="bg-teal-900 text-white px-6 py-2 rounded-[4px] text-[16px] font-medium hover:bg-[#14595b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-[140px]"
                >
                  حذف
                </button>
              </div>
            </form>
          </section>

          {/* Error Modal */}
          {errorModal.isOpen && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[1001]"
                onClick={() => setErrorModal({ ...errorModal, isOpen: false })}
              />
              <section className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-[#e0e0e0] rounded-[5px] p-[40px_48px] flex flex-col gap-[20px] z-[1002] w-full max-w-[500px] shadow-2xl">
                <div className="flex flex-col gap-4 relative">
                  <XIcon 
                    className="w-4 h-4 absolute top-0 left-0 cursor-pointer text-gray-600 hover:text-gray-800" 
                    onClick={() => setErrorModal({ ...errorModal, isOpen: false })} 
                  />
                  
                  <h2 className={`text-[24px] font-normal text-right m-0 ${
                    errorModal.title === 'نجح' ? 'text-green-600' : 
                    errorModal.title === 'تنبيه' ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {errorModal.title}
                  </h2>
                  
                  <p className="text-[16px] text-[#1f2937] text-right">
                    {errorModal.message}
                  </p>
                  
                  <div className="flex flex-row-reverse justify-end gap-4 pt-4 border-t border-[#e0e0e0]">
                    <button
                      onClick={() => setErrorModal({ ...errorModal, isOpen: false })}
                      className={`px-6 py-2 rounded-[5px] text-[16px] font-medium transition-colors w-[140px] ${
                        errorModal.title === 'نجح' 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : errorModal.title === 'تنبيه'
                          ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      موافق
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </Layout>
  );
}