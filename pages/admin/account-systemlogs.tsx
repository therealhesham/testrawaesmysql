import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import Style from "styles/Home.module.css";
import Layout from 'example/containers/Layout';
import { Search } from 'lucide-react';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import Select from 'react-select';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// دالة لترجمة نوع الإجراء إلى العربية
const translateActionType = (actionType: string): string => {
  const translations: { [key: string]: string } = {
    // المبيعات والمشتريات
    'add_sales': 'إضافة مبيعات',
    'update_sales': 'تعديل مبيعات',
    'delete_sales': 'حذف مبيعات',
    'add_purchases': 'إضافة مشتريات',
    'update_purchases': 'تعديل مشتريات',
    'delete_purchases': 'حذف مشتريات',
    
    // حسابات العملاء
    'create_client_account': 'إنشاء حساب عميل',
    'update_client_account': 'تعديل حساب عميل',
    'delete_client_account': 'حذف حساب عميل',
    'add_client_entry': 'إضافة قيد محاسبي',
    'update_client_entry': 'تعديل قيد محاسبي',
    'delete_client_entry': 'حذف قيد محاسبي',
    'entry': 'إضافة قيد محاسبي',
    
    // حسابات الموظفين
    'add_employee_cash': 'إضافة عهدة موظف',
    'update_employee_cash': 'تعديل عهدة موظف',
    'delete_employee_cash': 'حذف عهدة موظف',
    
    // التصدير
    'export_report': 'تصدير تقرير',
    
    // إجراءات عامة
    'view': 'عرض',
    'create': 'إنشاء',
    'update': 'تحديث',
    'delete': 'حذف',
    'payment': 'دفع',
    'refund': 'استرداد',
    'adjustment': 'تعديل',
  };
  
  return translations[actionType] || actionType;
};

export default function AccountSystemLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [exportedData, setExportedData] = useState([]);
  const [userName, setUserName] = useState('');
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      const userName = decoded.username;
      setUserName(userName);
    }
  }, []);

  // Fetch logs from API
  const fetchLogs = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/account-systemlogs', {
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
      const response = await axios.get('/api/account-systemlogs', {
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
    const res = await axios.get(`/api/account-systemlogs`, {
      params: {
        pageSize: "10000",
        searchTerm: searchTerm || '',
        action: actionFilter || '',
      },
    });
    if (res.status !== 200) throw new Error("Failed to fetch data");
    
    setExportedData(res.data.logs);
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
    doc.text('سجل النظام المحاسبي', pageWidth / 2, 20, { align: 'right' });

    const headers = [['اسم العميل', 'المبلغ', 'الحالة', 'نوع الإجراء', 'ملاحظات', 'الإجراء', 'اسم المستخدم', 'تاريخ الإنشاء', 'رقم السجل']];
    const body = dataToExport?.map((row: any) => [
      row.actionClient?.fullname || 'غير متوفر',
      row.actionAmount ? parseFloat(row.actionAmount).toFixed(2) : 'غير متوفر',
      row.actionStatus || 'غير متوفر',
      translateActionType(row.actionType || ''),
      row.actionNotes || 'غير متوفر',
      row.action || 'غير متوفر',
      row.actionUser?.username || 'غير متوفر',
      row.createdAt ? new Date(row.createdAt).toISOString().split('T')[0] : 'غير متوفر',
      row.id || 'غير متوفر',
    ]);

    doc.autoTable({
      head: headers,
      body: body,
      styles: {
        font: 'Amiri',
        halign: 'right',
        fontSize: 9,
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
          doc.text('سجل النظام المحاسبي', pageWidth / 2, 20, { align: 'right' });
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

    doc.save('account_system_logs.pdf');
  };

  // Export to Excel
  const exportToExcel = () => {
    const worksheetData = Array.isArray(exportedData)
      ? exportedData.map(row => ({
          'رقم السجل': row.id || 'غير متوفر',
          'الإجراء': row.action || 'غير متوفر',
          'نوع الإجراء': translateActionType(row.actionType || ''),
          'ملاحظات': row.actionNotes || 'غير متوفر',
          'الحالة': row.actionStatus || 'غير متوفر',
          'المبلغ': row.actionAmount ? parseFloat(row.actionAmount).toFixed(2) : 'غير متوفر',
          'اسم العميل': row.actionClient?.fullname || 'غير متوفر',
          'اسم المستخدم': row.actionUser?.username || 'غير متوفر',
          'تاريخ الإنشاء': row.createdAt ? new Date(row.createdAt).toISOString().split('T')[0] : 'غير متوفر',
          'تاريخ التحديث': row.updatedAt ? new Date(row.updatedAt).toISOString().split('T')[0] : 'غير متوفر',
        }))
      : [];

    const worksheet = XLSX.utils.json_to_sheet(worksheetData, {
      header: ['رقم السجل', 'الإجراء', 'نوع الإجراء', 'ملاحظات', 'الحالة', 'المبلغ', 'اسم العميل', 'اسم المستخدم', 'تاريخ الإنشاء', 'تاريخ التحديث'],
      rtl: true,
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل النظام المحاسبي');
    XLSX.writeFile(workbook, 'account_system_logs.xlsx', { compression: true });
  };

  // Fetch logs on mount and when filters or page change
  useEffect(() => {
    fetchLogs(currentPage);
    fetchExportLogs();
  }, [currentPage, searchTerm, actionFilter]);

  // Action filter options
  const actionOptions = [
    { value: '', label: 'كل الإجراءات' },
    // المبيعات والمشتريات
    { value: 'add_sales', label: 'إضافة مبيعات' },
    { value: 'update_sales', label: 'تعديل مبيعات' },
    { value: 'add_purchases', label: 'إضافة مشتريات' },
    { value: 'update_purchases', label: 'تعديل مشتريات' },
    // حسابات العملاء
    { value: 'create_client_account', label: 'إنشاء حساب عميل' },
    { value: 'update_client_account', label: 'تعديل حساب عميل' },
    { value: 'delete_client_account', label: 'حذف حساب عميل' },
    { value: 'add_client_entry', label: 'إضافة قيد محاسبي' },
    { value: 'update_client_entry', label: 'تعديل قيد محاسبي' },
    { value: 'delete_client_entry', label: 'حذف قيد محاسبي' },
    // حسابات الموظفين
    { value: 'add_employee_cash', label: 'إضافة عهدة موظف' },
    { value: 'update_employee_cash', label: 'تعديل عهدة موظف' },
    { value: 'delete_employee_cash', label: 'حذف عهدة موظف' },
    // التصدير
    { value: 'export_report', label: 'تصدير تقرير' },
    // إجراءات عامة
    { value: 'view', label: 'عرض' },
    { value: 'create', label: 'إنشاء' },
    { value: 'update', label: 'تحديث' },
    { value: 'delete', label: 'حذف' },
    { value: 'payment', label: 'دفع' },
    { value: 'refund', label: 'استرداد' },
    { value: 'adjustment', label: 'تعديل' },
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
          onClick={(e) => {
            e.preventDefault();
            handlePageChange(i);
          }}
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
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(currentPage - 1);
            }}
            className={`px-2 py-1 border border-gray-300 rounded bg-gray-50 text-sm ${
              currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            السابق
          </a>
          {pages}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(currentPage + 1);
            }}
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
        <title>سجل النظام المحاسبي</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className={`text-gray-800 ${Style['tajawal-regular']}`} dir="rtl">
        <div className="p-6 min-h-screen">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-normal">سجل النظام المحاسبي</h1>
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
                      <th className="p-4">نوع الإجراء</th>
                      <th className="p-4">ملاحظات</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4">المبلغ</th>
                      <th className="p-4">اسم العميل</th>
                      <th className="p-4">اسم المستخدم</th>
                      <th className="p-4">تاريخ الإنشاء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-4 text-center">
                          لا توجد بيانات
                        </td>
                      </tr>
                    ) : (
                      logs.map((log, index) => (
                        <tr key={index} className="bg-gray-50">
                          <td className="p-4">{log.id || 'غير متوفر'}</td>
                          <td className="p-4">{log.action || 'غير متوفر'}</td>
                          <td className="p-4">{translateActionType(log.actionType || '')}</td>
                          <td className="p-4">{log.actionNotes || 'غير متوفر'}</td>
                          <td className="p-4">{log.actionStatus || 'غير متوفر'}</td>
                          <td className="p-4">
                            {log.actionAmount ? parseFloat(log.actionAmount).toFixed(2) : 'غير متوفر'}
                          </td>
                          <td className="p-4">{log.actionClient?.fullname || 'غير متوفر'}</td>
                          <td className="p-4">{log.actionUser?.username || 'غير متوفر'}</td>
                          <td className="p-4">
                            {log.createdAt
                              ? new Date(log.createdAt).toISOString().split('T')[0]
                              : 'غير متوفر'}
                          </td>
                        </tr>
                      ))
                    )}
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

