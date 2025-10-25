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
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize,setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [exportedData, setExportedData] = useState([]);
const [userName, setUserName] = useState('');
useEffect(() => {
  const token = localStorage.getItem('token');
  const decoded = jwtDecode(token);
  const userName = decoded.username;
  setUserName(userName);
}, []);

  // Fetch logs from API
  const fetchLogs = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/systemlogs', {
        params: {
          searchTerm: searchTerm || '',
          action: actionFilter || '',
          page,
          pageSize: pageSize.toString(),
        },
      });
      const logsData = Array.isArray(response.data) ? response.data : response.data.logs || [];
      setLogs(logsData);
      setTotalCount(Array.isArray(response.data) ? response.data.length : response.data.totalCount || logsData.length);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching logs:', error.response?.data || error.message);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data for export
  const fetchExportLogs = async () => {
    try {
      const response = await axios.get('/api/systemlogs', {
        params: {
          pageSize: "10000",
        },
      });
      const logsData = Array.isArray(response.data) ? response.data : response.data.logs || [];
      setExportedData(logsData);
    } catch (error) {
      console.error('Error fetching logs for export:', error.response?.data || error.message);
      setExportedData([]);
    }
  };
const fetchFilteredLogs = async () => {
  const res = await axios.get(`/api/systemlogs`, {
    params: {
      pageSize: "10000",
      searchTerm: searchTerm || '',
      action: actionFilter || '',
    },
  });
  if (res.status !== 200) throw new Error("Failed to fetch data");
  // const data = await res.json();
  
  // نحدّث الستيت لو حابب تظل البيانات في الواجهة
  setExportedData(res.data.logs);
  // لكن الأهم: نرجعها علشان نستخدمها فورًا
  return res.data.logs;
};
  


// Export to PDF
const exportToPDF = async () => {
  console.log('exporting PDF');
  let dataToExport = exportedData;
  if (searchTerm || actionFilter) {
    dataToExport = await fetchFilteredLogs();
  }
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // 🔷 تحميل شعار مرة واحدة (لكن نستخدمه في كل صفحة)
  const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
  const logoBuffer = await logo.arrayBuffer();
  const logoBytes = new Uint8Array(logoBuffer);
  const logoBase64 = Buffer.from(logoBytes).toString('base64');

  // 🔷 تحميل خط أميري
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

  doc.setLanguage('ar');
  doc.setFontSize(12);
  doc.text('سجل النظام', pageWidth / 2, 20, { align: 'right' });

  const headers = [['اسم المستخدم', 'تاريخ التحديث', 'تاريخ الإنشاء', 'الإجراء', 'رقم السجل']];
  const body = dataToExport?.map((row: any) => [
    row.user?.username || 'غير متوفر',
    row.updatedAt ? new Date(row.updatedAt).toISOString().split('T')[0] : 'غير متوفر',
    row.createdAt ? new Date(row.createdAt).toISOString().split('T')[0] : 'غير متوفر',
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

    // ✅ هنا بنضيف اللوجو والبيانات في كل صفحة
    didDrawPage: (data) => {
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;

      // 🔷 إضافة اللوجو أعلى الصفحة (في كل صفحة)
      doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

      // 🔹 كتابة العنوان في أول صفحة فقط (اختياري)
      if (doc.getCurrentPageInfo().pageNumber === 1) {
        doc.setFontSize(12);
        doc.setFont('Amiri', 'normal');
        doc.text('سجل النظام', pageWidth / 2, 20, { align: 'right' });
      }

      // 🔸 الفوتر
      doc.setFontSize(10);
      doc.setFont('Amiri', 'normal');

      doc.text(userName, 10, pageHeight - 10, { align: 'left' });

      const pageNumber = `صفحة ${doc.getCurrentPageInfo().pageNumber}`;
      doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });

      const dateText =
        "التاريخ: " +
        new Date().toLocaleDateString('ar-EG', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) +
        "  الساعة: " +
        new Date().toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        });
      doc.text(dateText, pageWidth - 10, pageHeight - 10, { align: 'right' });
    },

    didParseCell: (data) => {
      data.cell.styles.halign = 'right';
    },
  });

  doc.save('system_logs.pdf');
};

  // Export to Excel
  const exportToExcel = () => {
    const worksheetData = Array.isArray(exportedData)
      ? exportedData.map(row => ({
          'رقم السجل': row.id || 'غير متوفر',
          'الإجراء': row.action || 'غير متوفر',
          'تاريخ الإنشاء': row.createdAt ? new Date(row.createdAt).toISOString().split('T')[0] : 'غير متوفر',
          'تاريخ التحديث': row.updatedAt ? new Date(row.updatedAt).toISOString().split('T')[0] : 'غير متوفر',
          'اسم المستخدم': row.user?.username || 'غير متوفر',
        }))
      : [];

    const worksheet = XLSX.utils.json_to_sheet(worksheetData, {
      header: ['رقم السجل', 'الإجراء', 'تاريخ الإنشاء', 'تاريخ التحديث', 'اسم المستخدم'],
      rtl: true,
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل النظام');
    XLSX.writeFile(workbook, 'system_logs.xlsx', { compression: true });
  };

  // Fetch logs on mount and when filters or page change
  useEffect(() => {
    fetchLogs(currentPage);
    fetchExportLogs();
  }, [currentPage, searchTerm, actionFilter]);

  // Action filter options
  const actionOptions = [
    { value: '', label: 'كل الإجراءات' },
    { value: 'view', label: 'عرض' },
    { value: 'create', label: 'إنشاء' },
    { value: 'update', label: 'تحديث' },
    { value: 'delete', label: 'حذف' },
    // Add more actions as needed
  ];

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle action filter change
  const handleActionFilterChange = (selectedOption) => {
    setActionFilter(selectedOption ? selectedOption.value : '');
    setCurrentPage(1);
  };

  // Pagination logic
  const totalPages = Math.ceil(totalCount / pageSize);
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <a
          key={i}
          href="#"
          onClick={() => handlePageChange(i)}
          className={`px-2 py-1 border rounded text-sm ${
            i === currentPage
              ? 'border-teal-800 bg-teal-900 text-white'
              : 'border-gray-300 bg-gray-50'
          }`}
        >
          {i}
        </a>
      );
    }

    return (
      <div className="flex justify-between items-center mt-6">
        <span className="text-base">
          عرض {startRecord}-{endRecord} من {totalCount} نتيجة
        </span>
        <nav className="flex gap-1">
          <a
            href="#"
            onClick={() => handlePageChange(currentPage - 1)}
            className={`px-2 py-1 border border-gray-300 rounded bg-gray-50 text-sm ${
              currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            السابق
          </a>
          {pages}
          <a
            href="#"
            onClick={() => handlePageChange(currentPage + 1)}
            className={`px-2 py-1 border border-gray-300 rounded bg-gray-50 text-sm ${
              currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            التالي
          </a>
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
            <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
              <div className="flex flex-col sm:flex-row gap-4 h-8">
                <div className="flex items-center border-none rounded bg-gray-50 p-2">
                  <input
                    type="text"
                    placeholder="بحث"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="bg-transparent border-none w-48 text-right"
                  />
                  <Search />
                </div>
                <div className="flex items-center border-none rounded bg-none">
                  <Select
                    options={actionOptions}
                    onChange={handleActionFilterChange}
                    placeholder="كل الإجراءات"
                    className="w-40 text-right"
                    styles={{
                      control: (base) => ({
                        ...base,
                        backgroundColor: '#F9FAFB',
                        borderColor: '#D1D5DB',
                        textAlign: 'right',
                      }),
                      menu: (base) => ({
                        ...base,
                        textAlign: 'right',
                      }),
                    }}
                  />
                </div>
                <button
                  className="bg-teal-900 text-white px-2 rounded hover:bg-teal-800 transition duration-200"
                  onClick={() => {
                    setSearchTerm('');
                    setActionFilter('');
                    setCurrentPage(1);
                  }}
                >
                  إعادة ضبط
                </button>
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  className="flex items-center gap-1 bg-teal-900 text-white px-3 py-1 rounded text-sm hover:bg-teal-800 transition duration-200"
                  onClick={exportToPDF}
                >
                  <FilePdfOutlined />
                  <span>PDF</span>
                </button>
                <button
                  className="flex items-center gap-1 bg-teal-900 text-white px-3 py-1 rounded text-sm hover:bg-teal-800 transition duration-200"
                  onClick={exportToExcel}
                >
                  <FileExcelOutlined />
                  <span>Excel</span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto" dir="rtl">
              {isLoading ? (
                <div className="text-center">جارٍ التحميل...</div>
              ) : (
                <table className="w-full text-right text-sm">
                  <thead className="bg-teal-900 text-white">
                    <tr>
                      <th className="p-4">رقم السجل</th>
                      <th className="p-4">الإجراء</th>
                      <th className="p-4">تاريخ الإنشاء</th>
                      <th className="p-4">تاريخ التحديث</th>
                      <th className="p-4">اسم المستخدم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr key={index} className="bg-gray-50">
                        <td className="p-4">{log.id || 'غير متوفر'}</td>
                        <td className="p-4">{log.action || 'غير متوفر'}</td>
                        <td className="p-4">
                          {log.createdAt
                            ? new Date(log.createdAt).toISOString().split('T')[0]
                            : 'غير متوفر'}
                        </td>
                        <td className="p-4">
                          {log.updatedAt
                            ? new Date(log.updatedAt).toISOString().split('T')[0]
                            : 'غير متوفر'}
                        </td>
                        <td className="p-4">{log.user?.username || 'غير متوفر'}</td>
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