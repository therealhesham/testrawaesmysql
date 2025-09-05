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
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [exportedData, setExportedData] = useState([]);

  // Fetch logs from API
  const fetchLogs = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/systemlogs', {
        params: {
          searchTerm: searchTerm || '',
          action: actionFilter || '',
          page,
        },
      });
      setLogs(response.data.logs);
      setTotalCount(response.data.totalCount); // Adjust based on API response if pagination is implemented
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching logs:', error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data for export
  const fetchExportLogs = async () => {
    try {
      const response = await axios.get('/api/systemlogs', {});
      setExportedData(response.data);
    } catch (error) {
      console.error('Error fetching logs for export:', error.response?.data || error.message);
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont('Amiri');
    doc.setFontSize(12);
    doc.text('سجل النظام', 200, 10, { align: 'right' });

    const tableColumn = ['رقم السجل', 'الإجراء', 'تاريخ الإنشاء', 'تاريخ التحديث', 'اسم المستخدم'];
    const tableRows = exportedData.map(row => [
      row.id,
      row.action || 'غير متوفر',
      row.createdAt ? new Date(row.createdAt).toLocaleString() : 'غير متوفر',
      row.updatedAt ? new Date(row.updatedAt).toLocaleString() : 'غير متوفر',
      row.user?.username || 'غير متوفر',
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      styles: { font: 'Amiri', halign: 'right' },
      headStyles: { fillColor: [0, 105, 92] },
      margin: { top: 20 },
    });

    doc.save('system_logs.pdf');
  };

  // Export to Excel
  const exportToExcel = () => {
    const worksheetData = exportedData.map(row => ({
      'رقم السجل': row.id,
      'الإجراء': row.action || 'غير متوفر',
      'تاريخ الإنشاء': row.createdAt ? new Date(row.createdAt).toLocaleString() : 'غير متوفر',
      'تاريخ التحديث': row.updatedAt ? new Date(row.updatedAt).toLocaleString() : 'غير متوفر',
      'اسم المستخدم': row.user?.username || 'غير متوفر',
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل النظام');
    XLSX.writeFile(workbook, 'system_logs.xlsx');
  };

  // Fetch logs on mount and when filters or page change
  useEffect(() => {
    fetchLogs(currentPage);
    fetchExportLogs();
  }, [currentPage, searchTerm, actionFilter]);

  // Action filter options (you can expand this based on possible actions)
  const actionOptions = [
    { value: '', label: 'كل الإجراءات' },
    // Add more actions as needed, e.g.:
    // { value: 'LOGIN', label: 'تسجيل الدخول' },
    // { value: 'ORDER_CREATE', label: 'إنشاء طلب' },
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
      <div className={`text-gray-800 ${Style['tajawal-regular']}`}>
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
                    className="bg-transparent border-none w-48"
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
            <div className="overflow-x-auto" dir="ltr">
              {isLoading ? (
                <div className="text-center">جارٍ التحميل...</div>
              ) : (
                <table className="w-full text-right text-sm">
                  <thead className="bg-teal-900 text-white">
                    <tr>
                      <th className="p-4 pl-6">رقم السجل</th>
                      <th className="p-4">الإجراء</th>
                      <th className="p-4">تاريخ الإنشاء</th>
                      <th className="p-4">تاريخ التحديث</th>
                      <th className="p-4">اسم المستخدم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr key={index} className="bg-gray-50">
                        <td className="p-4 pl-6">{log.id}</td>
                        <td className="p-4">{log.action || 'غير متوفر'}</td>
                        <td className="p-4">
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleString()
                            : 'غير متوفر'}
                        </td>
                        <td className="p-4">
                          {log.updatedAt
                            ? new Date(log.updatedAt).toLocaleString()
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
//     // Extract cookies
//     const cookieHeader = req.headers.cookie;
//     let cookies = {};
//     if (cookieHeader) {
//       cookieHeader.split(';').forEach((cookie) => {
//         const [key, value] = cookie.trim().split('=');
//         cookies[key] = decodeURIComponent(value);
//       });
//     }

//     // Check for authToken
//     if (!cookies.authToken) {
//       return {
//         redirect: { destination: '/admin/login', permanent: false },
//       };
//     }

//     // Decode JWT
//     const token = jwtDecode(cookies.authToken);

//     // Fetch user & role with Prisma
//     const findUser = await prisma.user.findUnique({
//       where: { id: token.id },
//       include: { role: true },
//     });

//     // Check permissions (assuming similar permission structure)
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