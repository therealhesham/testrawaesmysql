import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import Style from "styles/Home.module.css";
import Layout from 'example/containers/Layout';
import { Search, X } from 'lucide-react';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import Select from 'react-select';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import axios, { AxiosError } from 'axios';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { useRouter } from 'next/router';

interface CustomJwtPayload extends JwtPayload {
  username?: string;
  id?: string;
}

interface LogUser {
  username: string;
  email?: string;
}

interface SystemLog {
  id: string | number;
  action: string;
  pageRoute:string;
  actionType?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: LogUser;
}

export default function SystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');
const router = useRouter();  
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode<CustomJwtPayload>(token);
        setUserName(decoded.username || 'مستخدم');
      }
    } catch (err) {
      console.error('Error decoding token:', err);
      setUserName('مستخدم');
    }
  }, []);

  // Fetch logs from API
  const fetchLogs = async (page = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/systemlogs', {
        params: {
          searchTerm: searchTerm || undefined,
          action: actionFilter || undefined,
          page,
          pageSize: pageSize.toString(),
        },
      });
      const logsData = response.data.logs || [];
      setLogs(logsData);
      setTotalCount(response.data.totalCount || 0);
      setCurrentPage(page);
    } catch (err) {
      const error = err as AxiosError;
      console.error('Error fetching logs:', error.response?.data || error.message);
      setError('حدث خطأ أثناء تحميل السجلات. يرجى المحاولة مرة أخرى.');
      setLogs([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format date correctly (DD/MM/YYYY)
  const formatDate = (dateString: string | Date): string => {
    if (!dateString) return 'غير متوفر';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'غير متوفر';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  // Fetch data for export with current filters
  const fetchFilteredLogs = async () => {
    try {
      // Use a reasonable limit to avoid memory issues
      // If data is too large, we'll fetch in batches
      const maxRecords = 5000; // Reduced from 10000 to avoid memory issues
      
      const response = await axios.get('/api/systemlogs', {
        params: {
          pageSize: maxRecords.toString(),
          searchTerm: searchTerm || undefined,
          action: actionFilter || undefined,
        },
        timeout: 60000, // 60 seconds timeout
      });
      
      const logs = response.data.logs || [];
      
      // If we hit the limit and there's more data, warn the user
      if (logs.length >= maxRecords && response.data.totalCount > maxRecords) {
        console.warn(`تم تصدير ${maxRecords} سجل من أصل ${response.data.totalCount}. قد تحتاج إلى استخدام الفلاتر لتقليل البيانات.`);
      }
      
      return logs;
    } catch (err) {
      const error = err as AxiosError;
      console.error('Error fetching logs for export:', error.response?.data || error.message);
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        setError('انتهت مهلة الاتصال. البيانات كثيرة جداً. يرجى استخدام الفلاتر لتقليل البيانات.');
      } else if (error.response?.status === 500) {
        setError('حدث خطأ في الخادم. قد تكون البيانات كثيرة جداً. يرجى المحاولة مع فلاتر أكثر تحديداً.');
      } else {
        setError('حدث خطأ أثناء تصدير البيانات. يرجى المحاولة مرة أخرى.');
      }
      
      throw error; // Re-throw to let the calling function handle it
    }
  };
  


  // Helper function to convert ArrayBuffer to base64 (works in browser)
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Export to PDF
  const exportToPDF = async () => {
    try {
      setIsLoading(true);
      setError('');
      const dataToExport = await fetchFilteredLogs();
      
      if (!dataToExport || dataToExport.length === 0) {
        setError('لا توجد بيانات للتصدير.');
        setIsLoading(false);
        return;
      }

      const doc = new jsPDF({ orientation: 'landscape' });
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // تحميل شعار
      const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
      if (!logo.ok) throw new Error('Failed to fetch logo');
      const logoBuffer = await logo.arrayBuffer();
      const logoBase64 = arrayBufferToBase64(logoBuffer);

      // تحميل خط أميري
      const fontResponse = await fetch('/fonts/Amiri-Regular.ttf');
      if (!fontResponse.ok) throw new Error('Failed to fetch font');
      const fontBuffer = await fontResponse.arrayBuffer();
      const fontBase64 = arrayBufferToBase64(fontBuffer);

      doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
      doc.setFont('Amiri', 'normal');

      doc.setLanguage('ar');
      doc.setFontSize(12);

      const headers = [['اسم المستخدم', 'وقت الإنشاء', 'تاريخ الإنشاء', 'الإجراء', 'رقم السجل']];
      const body = dataToExport.map((row: SystemLog) => [
        row.user?.username || 'غير متوفر',
        row.createdAt ? new Date(row.createdAt).toLocaleTimeString('en-US', { 
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }) : 'غير متوفر',
        formatDate(row.createdAt),
        row.action || 'غير متوفر',
        row.id || 'غير متوفر',
      ]);

      doc.autoTable({
        head: headers,
        body: body,
        styles: {
          font: 'Amiri',
          halign: 'right',
          fontSize: 10,
          cellPadding: 2,
          textColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [0, 105, 92],
          textColor: [255, 255, 255],
          halign: 'center',
        },
        margin: { top: 42, right: 10, left: 10 },
        didDrawPage: () => {
          const pageHeight = doc.internal.pageSize.height;
          const pageWidth = doc.internal.pageSize.width;

          // إضافة اللوجو
          doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

          // العنوان
          if (doc.getCurrentPageInfo().pageNumber === 1) {
            doc.setFontSize(12);
            doc.setFont('Amiri', 'normal');
            doc.text('سجل النظام', pageWidth / 2, 20, { align: 'right' });
          }

          // الفوتر
          doc.setFontSize(10);
          doc.setFont('Amiri', 'normal');
          doc.text(userName, 10, pageHeight - 10, { align: 'left' });

          const pageNumber = `صفحة ${doc.getCurrentPageInfo().pageNumber}`;
          doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });

          const dateText = `التاريخ: ${new Date().toLocaleDateString('ar-EG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })} الساعة: ${new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })}`;
          doc.text(dateText, pageWidth - 10, pageHeight - 10, { align: 'right' });
        },
        didParseCell: (hookData: any) => {
          hookData.cell.styles.halign = 'right';
        },
      });

      doc.save(`سجل_النظام_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.pdf`);
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      if (error.message?.includes('timeout') || error.message?.includes('ECONNABORTED')) {
        setError('انتهت مهلة الاتصال. البيانات كثيرة جداً. يرجى استخدام الفلاتر لتقليل البيانات.');
      } else if (error.message?.includes('Failed to fetch')) {
        setError('فشل تحميل الملفات المطلوبة (الشعار أو الخط). يرجى التحقق من الاتصال بالإنترنت.');
      } else {
        setError('حدث خطأ أثناء تصدير PDF. يرجى المحاولة مرة أخرى أو تقليل كمية البيانات باستخدام الفلاتر.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    try {
      setIsLoading(true);
      setError('');
      const dataToExport = await fetchFilteredLogs();
      
      if (!dataToExport || dataToExport.length === 0) {
        setError('لا توجد بيانات للتصدير.');
        setIsLoading(false);
        return;
      }

      const worksheetData = dataToExport.map((row: SystemLog) => ({
        'رقم السجل': row.id || 'غير متوفر',
        'الإجراء': row.action || 'غير متوفر',
        'تاريخ الإنشاء': formatDate(row.createdAt),
        'وقت الإنشاء': row.createdAt ? new Date(row.createdAt).toLocaleTimeString('ar-EG', { 
          hour: '2-digit',
          minute: '2-digit'
        }) : 'غير متوفر',
        'اسم المستخدم': row.user?.username || 'غير متوفر',
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData, {
        header: ['رقم السجل', 'الإجراء', 'تاريخ الإنشاء', 'وقت الإنشاء', 'اسم المستخدم'],
      });
      
      // تحسين عرض الأعمدة
      const colWidths = [
        { wch: 15 }, // رقم السجل
        { wch: 30 }, // الإجراء
        { wch: 20 }, // تاريخ الإنشاء
        { wch: 15 }, // وقت الإنشاء
        { wch: 20 }, // اسم المستخدم
      ];
      worksheet['!cols'] = colWidths;
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل النظام');
      XLSX.writeFile(workbook, `سجل_النظام_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.xlsx`, { compression: true });
    } catch (error: any) {
      console.error('Error exporting Excel:', error);
      if (error.message?.includes('timeout') || error.message?.includes('ECONNABORTED')) {
        setError('انتهت مهلة الاتصال. البيانات كثيرة جداً. يرجى استخدام الفلاتر لتقليل البيانات.');
      } else if (error.message?.includes('QuotaExceededError') || error.message?.includes('out of memory')) {
        setError('البيانات كثيرة جداً وتتجاوز سعة الذاكرة. يرجى استخدام الفلاتر لتقليل البيانات.');
      } else {
        setError('حدث خطأ أثناء تصدير Excel. يرجى المحاولة مرة أخرى أو تقليل كمية البيانات باستخدام الفلاتر.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, actionFilter, pageSize]);

  // Fetch logs when page changes
  useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage]);

  // Action filter options
  const actionOptions = [
    { value: '', label: 'كل الإجراءات' },
    { value: 'view', label: 'عرض' },
    { value: 'create', label: 'إنشاء' },
    { value: 'update', label: 'تحديث' },
    { value: 'delete', label: 'حذف' },
  ];

  // Page size options
  const pageSizeOptions = [
    { value: 10, label: '10 صفوف' },
    { value: 25, label: '25 صف' },
    { value: 50, label: '50 صف' },
    { value: 100, label: '100 صف' },
  ];

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle action filter change
  const handleActionFilterChange = (selectedOption: any) => {
    setActionFilter(selectedOption ? selectedOption.value : '');
  };

  // Handle page size change
  const handlePageSizeChange = (selectedOption: any) => {
    setPageSize(selectedOption.value);
    setCurrentPage(1);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setActionFilter('');
    setCurrentPage(1);
  };

  // Pagination logic
  const totalPages = Math.ceil(totalCount / pageSize);
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Function to extract path after /admin
  const getPathAfterAdmin = (url: string): string => {
    if (!url) return '';
    
    // Extract path from full URL if it's a complete URL
    let path = url;
    try {
      const urlObj = new URL(url);
      path = urlObj.pathname;
    } catch {
      // If it's not a full URL, use it as is
      path = url;
    }
    
    // Find /admin in the path and extract what comes after it
    const adminIndex = path.indexOf('/admin');
    if (adminIndex !== -1) {
      const afterAdmin = path.substring(adminIndex + '/admin'.length);
      return afterAdmin || '';
    }
    
    // If /admin not found, return the original path
    return path.startsWith('/') ? path : `/${path}`;
  };

  const renderPagination = () => {
    if (totalCount === 0) return null;

    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // First page
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-3 py-2 border border-gray-300 rounded bg-gray-50 hover:bg-gray-100 text-md"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="dots1" className="px-2 py-2">
            ...
          </span>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 border rounded text-md transition-colors ${
            i === currentPage
              ? 'border-teal-800 bg-teal-900 text-white'
              : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="dots2" className="px-2 py-2">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-2 border border-gray-300 rounded bg-gray-50 hover:bg-gray-100 text-md"
        >
          {totalPages}
        </button>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
        <span className="text-base text-gray-600">
          عرض {startRecord}-{endRecord} من {totalCount} سجل
        </span>
        <nav className="flex gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 border border-gray-300 rounded bg-gray-50 text-md transition-colors ${
              currentPage === 1 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-100 cursor-pointer'
            }`}
          >
            السابق
          </button>
          {pages}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 border border-gray-300 rounded bg-gray-50 text-md transition-colors ${
              currentPage === totalPages 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-100 cursor-pointer'
            }`}
          >
            التالي
          </button>
        </nav>
      </div>
    );
  };

  return (
    <Layout>
      <Head>
        <title>سجل النظام</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className={`text-gray-800 ${Style['tajawal-regular']}`} dir="rtl">
        <div className="p-6 min-h-screen">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-normal">سجل النظام</h1>
          </div>
          <div className="bg-white border border-gray-300 rounded p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center border-none rounded bg-gray-50 p-2 h-10">
                  <input
                    type="text"
                    placeholder="بحث في الإجراء أو اسم المستخدم..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="bg-transparent border-none w-56 text-right outline-none"
                  />
                  <Search className="text-gray-500" size={20} />
                </div>
                <Select
                  options={actionOptions}
                  onChange={handleActionFilterChange}
                  value={actionOptions.find(opt => opt.value === actionFilter)}
                  placeholder="كل الإجراءات"
                  className="w-40 text-right"
                  isClearable
                  styles={{
                    control: (base) => ({
                      ...base,
                      backgroundColor: '#F9FAFB',
                      borderColor: '#D1D5DB',
                      textAlign: 'right',
                      minHeight: '40px',
                    }),
                    menu: (base) => ({
                      ...base,
                      textAlign: 'right',
                    }),
                  }}
                />
                <Select
                  options={pageSizeOptions}
                  onChange={handlePageSizeChange}
                  value={pageSizeOptions.find(opt => opt.value === pageSize)}
                  className="w-32 text-right"
                  styles={{
                    control: (base) => ({
                      ...base,
                      backgroundColor: '#F9FAFB',
                      borderColor: '#D1D5DB',
                      textAlign: 'right',
                      minHeight: '40px',
                    }),
                    menu: (base) => ({
                      ...base,
                      textAlign: 'right',
                    }),
                  }}
                />
                <button
                  className="bg-gray-600 text-white px-4 h-10 rounded hover:bg-gray-700 transition duration-200 flex items-center gap-2"
                  onClick={handleResetFilters}
                >
                  <X size={16} />
                  <span>إعادة ضبط</span>
                </button>
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  className="flex items-center gap-2 bg-teal-900 text-white px-4 h-10 rounded text-md hover:bg-teal-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={exportToPDF}
                  disabled={isLoading || logs.length === 0}
                >
                  <FilePdfOutlined />
                  <span>تصدير PDF</span>
                </button>
                <button
                  className="flex items-center gap-2 bg-teal-900 text-white px-4 h-10 rounded text-md hover:bg-teal-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={exportToExcel}
                  disabled={isLoading || logs.length === 0}
                >
                  <FileExcelOutlined />
                  <span>تصدير Excel</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto" dir="rtl">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-900"></div>
                  <p className="mt-2 text-gray-600">جارٍ التحميل...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">لا توجد سجلات متاحة</p>
                  {(searchTerm || actionFilter) && (
                    <p className="text-sm mt-2">جرب تعديل معايير البحث</p>
                  )}
                </div>
              ) : (
                <table className="w-full text-right text-md border-collapse">
                  <thead className="bg-teal-900 text-white">
                    <tr>
                      <th className="p-4 border">رقم السجل</th>
                      <th className="p-4 border">الإجراء</th>
                      <th className="p-4 border">تاريخ الإنشاء</th>

                      <th className="p-4 border">وقت الإنشاء</th>
                      <th className="p-4 border">صفحة</th>
                      <th className="p-4 border">اسم المستخدم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr 
                        key={log.id || index} 
                        className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}
                      >
                        <td className="p-4 border">{log.id || 'غير متوفر'}</td>
                        <td className="p-4 border">
                          <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-teal-100 text-teal-800">
                            {log.action || 'غير متوفر'}
                          </span>
                        </td>
                        <td className="p-4 border">
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleDateString('ar-EG', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                              })
                            : 'غير متوفر'}
                        </td>
                        <td className="p-4 border">
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleTimeString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'غير متوفر'}
                        </td>
                        <td className="p-4 border font-semibold cursor-pointer"  onClick={()=>router.push(log.pageRoute)}>{getPathAfterAdmin(log.pageRoute) || log.pageRoute}</td>

                        <td className="p-4 border font-semibold">{log.user?.username || 'غير متوفر'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {renderPagination()}
          </div>
        </div>
      </div>
    </Layout>
  );
}

// export async function getServerSideProps({ req }) {
//   try {
//     const cookieHeader = req.headers.cookie;
//     let cookies = {};
//     if (cookieHeader) {
//       cookieHeader.split(';').forEach((cookie) => {
//         const [key, value] = cookie.trim().split('=');
//         cookies[key] = decodeURIComponent(value);
//       });
//     }

//     if (!cookies.authToken) {
//       return {
//         redirect: { destination: '/admin/login', permanent: false },
//       };
//     }

//     const token = jwtDecode(cookies.authToken);
//     const findUser = await prisma.user.findUnique({
//       where: { id: token.id },
//       include: { role: true },
//     });

//     if (
//       !findUser ||
//       !findUser.role?.permissions?.['إدارة السجلات']?.['عرض']
//     ) {
//       return {
//         redirect: { destination: '/admin/home', permanent: false },
//       };
//     }

//     return { props: {} };
//   } catch (err) {
//     console.error('Authorization error:', err);
//     return {
//       redirect: { destination: '/admin/home', permanent: false },
//     };
//   }
// }