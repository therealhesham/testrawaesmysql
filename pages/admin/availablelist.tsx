import Head from 'next/head';
import { useState, useEffect } from 'react';
import { CalendarIcon, ChevronDownIcon } from '@heroicons/react/outline';
import { FilePdfFilled, FileTextOutlined } from '@ant-design/icons';
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css";
import { jwtDecode } from 'jwt-decode';
import prisma from 'lib/prisma';
import Modal from 'components/modal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useRouter } from 'next/router';

// Modal
interface Homemaid {
  id: number;
  Name: string;
  phone: string | null;
  Nationalitycopy: string;
  maritalstatus: string;
  Passportnumber: string;
  PassportStart: string | null;
  PassportEnd: string | null;
  Experience: string;
  ages: string;
  birthdate?: string | null;
}

interface ApiResponse {
  data: Homemaid[];
  totalPages: number;
}

export default function Home() {
const [userName, setUserName] = useState('');
const router =useRouter()

useEffect(() => {
  const token = localStorage.getItem('token');
  const decoded = jwtDecode(token);
  const userName = decoded.username;
  setUserName(userName);
}, []);
  


  function calculateAge(birthDate: any) {
    if (!birthDate) return 'غير محدد';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }


  // Modal styles with responsiveness and modern design
  const customModalStyles = {
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 1000,
      animation: "fadeIn 0.3s ease-in-out",
    },
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      transform: "translate(-50%, -50%)",
      width: "90%",
      maxWidth: "600px",
      maxHeight: "90vh",
      padding: "24px",
      borderRadius: "12px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
      backgroundColor: "#fff",
      overflowY: "auto",
      fontFamily: '"Almarai", sans-serif',
      animation: "slideIn 0.3s ease-in-out",
    },
  };






function getDate(date) {
  if (!date) return null;
  const currentDate = new Date(date);
  const formatted = currentDate.getFullYear()+'-' +(currentDate.getMonth() + 1) + '-'+ currentDate.getDate() ;
  return formatted;
}
  





 const [showExportModal, setShowExportModal] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [exportType, setExportType] = useState("");





const [homemaids, setHomemaids] = useState<Homemaid[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    Name: '',
    Nationality: '',
    date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    Name: true,
    phone: true,
    Nationalitycopy: true,
    maritalstatus: true,
    Passportnumber: true,
    PassportStart: true,
    PassportEnd: true,
    Experience: true,
    availability: true,
  });
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  const fetchHomemaids = async (page: number, filters: {  pageSize:string,Name: string; Nationality: string; date: string }) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSizeQ:"10",
        // ...(filters.pageSizeQ && {}),
        ...(filters.Name && { Name: filters.Name }),
        ...(filters.Nationality && { Nationality: filters.Nationality }),
        ...(filters.date && { date: filters.date }),
      });
      const response = await fetch(`/api/availablelist?${queryParams}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data: ApiResponse = await response.json();
      setHomemaids(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching homemaids:', error);
      setError('خطأ في جلب البيانات');
      setHomemaids([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomemaids(currentPage, filters);
  }, [currentPage, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ Name: '', Nationality: '', date: '' });
    setCurrentPage(1);
  };

  const handleColumnToggle = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPaginationRange = () => {
    const maxPagesToShow = 5;
    const halfRange = Math.floor(maxPagesToShow / 2);
    let start = Math.max(1, currentPage - halfRange);
    let end = Math.min(totalPages, currentPage + halfRange);

    if (end - start < maxPagesToShow - 1) {
      if (start === 1) {
        end = Math.min(totalPages, start + maxPagesToShow - 1);
      } else if (end === totalPages) {
        start = Math.max(1, end - maxPagesToShow + 1);
      }
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const columnLabels = {
    id: '#',
    Name: 'الاسم',
    phone: 'رقم الجوال',
    Nationalitycopy: 'الجنسية',
    maritalstatus: 'الحالة الاجتماعية',
    Passportnumber: 'رقم الجواز',
    PassportStart: 'بداية الجواز',
    PassportEnd: 'نهاية الجواز',
    Experience: 'الخبرة',
    availability: 'مدة توفرها',
  };


  const fetchHomemaidsForExporting = async (page: number, filters: {  pageSize:string,Name: string; Nationality: string; date: string }) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSizeQ:"10000",
        // ...(filters.pageSizeQ && {}),
        ...(filters.Name && { Name: filters.Name }),
        ...(filters.Nationality && { Nationality: filters.Nationality }),
        ...(filters.date && { date: filters.date }),
      });
      const response = await fetch(`/api/availablelist?${queryParams}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data: ApiResponse = await response.json();
      // setHomemaids(data.data || []);
      return data.data;
      // setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching homemaids:', error);
      setError('خطأ في جلب البيانات');
      setHomemaids([]);
    } finally {
      setLoading(false);
    }
  };
  


const exportToPDF = async () => {
  //image logo
    
  // let exportedData =
  const doc = new jsPDF({ orientation: 'landscape' }); // 🔄 جعلها عرضية لو تحب
    const pageWidth = doc.internal.pageSize.width;
  const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
  const logoBuffer = await logo.arrayBuffer();
  const logoBytes = new Uint8Array(logoBuffer);
  const logoBase64 = Buffer.from(logoBytes).toString('base64');
  // doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);
  try {
    setExportMessage('جاري تحميل جميع البيانات للتصدير...');
    setExportType('loading');
    setShowExportModal(true);

    const exportData =  await fetchHomemaidsForExporting(1,filters);
    console.log('Export data for PDF:', exportData);

    // 🖋️ تحميل الخط العربي Amiri
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
      setExportMessage('خطأ في تحميل الخط العربي');
      setExportType('error');
      return;
    }

    // 🏷️ العنوان
    doc.setLanguage('ar');
    doc.setFontSize(16);
    doc.text('قائمة العاملات', 150, 20, { align: 'right' });

    // 📋 الأعمدة (معكوسة للاتجاه العربي)
    const tableColumn = [
      'الرقم',
      'الاسم',
      'رقم الجوال',
      'الجنسية',
      'الحالة الاجتماعية',
      'العمر',
      'رقم جواز السفر',
      'بداية الجواز',
      'نهاية الجواز',
      'المكتب',
    ].reverse(); // ✅ عكس ترتيب الأعمدة
//hidden id column


    // 📊 الصفوف (معكوسة بنفس الترتيب)
    const tableRows = exportData.map(row =>
      [
        row.id || 'غير متوفر',
        row.Name || 'غير متوفر',
        row.phone || 'غير متوفر',
        row?.office?.Country || 'غير متوفر',
        row.maritalstatus || 'غير متوفر',
        row.dateofbirth ? `${calculateAge(row.dateofbirth)} سنة` : 'غير متوفر',
        row.Passportnumber || 'غير متوفر',
        row.PassportStart ? getDate(row.PassportStart) : 'غير متوفر',
        row.PassportEnd ? getDate(row.PassportEnd) : 'غير متوفر',
        row?.office?.office || 'غير متوفر',
      ].reverse() // ✅ عكس القيم داخل كل صف
    );

    // 📄 الجدول مع إعداد الاتجاه والفوتر
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      styles: {
        font: 'Amiri',
        halign: 'center',
        fontSize: 10,
        cellPadding: 2,
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [26, 77, 79],
        textColor: [255, 255, 255],
        halign: 'center',
        overflow:"hidden"
      },

      columnStyles: {
        0: { cellWidth: 'auto', overflow: 'hidden' },
        1: { cellWidth: 'auto', overflow: 'hidden ' },
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


      margin: { top: 45, right: 10, left: 10 },
      direction: 'rtl', // ✅ مهم جدًا لعرض الجدول من اليمين لليسار
      didParseCell: (data) => {
        data.cell.styles.halign = 'center';
      },

      // ⚙️ فوتر في كل صفحة
      didDrawPage: () => {
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        doc.setFontSize(10);
        doc.setFont('Amiri', 'normal');

        // 👈 اسم المستخدم في اليسار
        doc.text(userName, 10, pageHeight - 10, { align: 'left' });

        // 🔢 رقم الصفحة في المنتصف
        const pageNumber = `صفحة ${doc.internal.getNumberOfPages()}`;
        doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });

 doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);


        // 👉 التاريخ والوقت في اليمين
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
    });

    // 💾 حفظ الملف
    doc.save('قائمة_العاملات.pdf');

    setExportMessage(`تم تصدير ${exportData.length} سجل بنجاح إلى PDF`);
    setExportType('success');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    setExportMessage('حدث خطأ أثناء تصدير PDF');
    setExportType('error');
  }
};

  const exportToExcel = async () => {
    try {
      setExportMessage('جاري تحميل جميع البيانات للتصدير...');
      setExportType('loading');
      setShowExportModal(true);
      
      const exportData = await fetchExportData();
      console.log('Export data for Excel:', exportData);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('قائمة العاملات', { properties: { defaultColWidth: 20 } });
      worksheet.columns = [
        { header: 'الرقم', key: 'id', width: 15 },
        { header: 'الاسم', key: 'name', width: 20 },
        { header: 'رقم الجوال', key: 'phone', width: 15 },
        { header: 'الجنسية', key: 'nationality', width: 15 },
        { header: 'الحالة الاجتماعية', key: 'maritalStatus', width: 20 },
        { header: 'العمر', key: 'age', width: 10 },
        { header: 'رقم جواز السفر', key: 'passport', width: 15 },
        { header: 'بداية الجواز', key: 'passportStart', width: 15 },
        { header: 'نهاية الجواز', key: 'passportEnd', width: 15 },
        { header: 'المكتب', key: 'office', width: 15 },
      ];
      worksheet.getRow(1).font = { name: 'Amiri', size: 12 };
      worksheet.getRow(1).alignment = { horizontal: 'right' };
      exportData.forEach(row => {
        worksheet.addRow({
          id: row.id || 'غير متوفر',
          name: row.Name || 'غير متوفر',
          phone: row.phone || 'غير متوفر',
          nationality: row?.office?.Country || 'غير متوفر',
          maritalStatus: row.maritalstatus || 'غير متوفر',
          age: row.dateofbirth ? `${calculateAge(row.dateofbirth)} سنة` : 'غير متوفر',
          passport: row.Passportnumber || 'غير متوفر',
          passportStart: row.PassportStart ? getDate(row.PassportStart) : 'غير متوفر',
          passportEnd: row.PassportEnd ? getDate(row.PassportEnd) : 'غير متوفر',
          office: row?.office?.office || 'غير متوفر',
        }).alignment = { horizontal: 'right' };
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'homemaids_list.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      setExportMessage(`تم تصدير ${exportData.length} سجل بنجاح إلى Excel`);
      setExportType('success');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      setExportMessage('حدث خطأ أثناء تصدير Excel');
      setExportType('error');
    }
  };











  







  
  return (
    <Layout>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>قائمة العاملات المتاحات</title>
      </Head>
      <main className={`p-8 md:p-10 bg-gray-100 min-h-screen font-tajawal text-right text-gray-800 ${Style["tajawal-regular"]}`}>
        <h1 className="text-3xl font-normal text-black mb-6">قائمة العاملات المتاحات</h1>
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
          <div className="flex flex-col flex-wrap gap-5 mb-6">
            <div className="flex flex-row justify-end gap-4 w-full md:w-auto" dir="ltr">
              <button
                className="bg-teal-800 text-white rounded-md px-3 py-2 text-md"
                onClick={handleResetFilters}
              >
                إعادة ضبط
              </button>
              <div className="relative">
                <button
                  className="flex items-center bg-gray-100 border h-16 border-gray-300 rounded-md px-2 py-2 min-w-[162px] justify-between text-gray-500 text-md"
                  onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                >
                  <span>إخفاء/إظهار الأعمدة</span>
                  {/* <ChevronDownIcon className="w-4 h-4 text-gray-500" /> */}
                </button>
                {isColumnDropdownOpen && (
                  <div className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-lg mt-1 w-[200px] p-4">
                    {Object.keys(visibleColumns).map((column) => (
                      <label key={column} className="flex items-center gap-2 text-md text-gray-700 mb-2">
                        <input
                          type="checkbox"
                          checked={visibleColumns[column as keyof typeof visibleColumns]}
                          onChange={() => handleColumnToggle(column as keyof typeof visibleColumns)}
                          className="w-4 h-4"
                        />
                        {columnLabels[column as keyof typeof columnLabels]}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center bg-gray-100 border border-gray-300 rounded-md px-2 py-2 min-w-[162px] justify-between text-gray-500 text-md">
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                  className="bg-transparent border-none text-gray-500 w-full text-right"
                />
                <CalendarIcon className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center bg-gray-100 border border-gray-300 rounded-md px-2 py-2 min-w-[162px] justify-between text-gray-500 text-md">
                <select
                  value={filters.Nationality}
                  onChange={(e) => handleFilterChange('Nationality', e.target.value)}
                  className="bg-transparent border-none text-gray-500 w-full text-right"
                >
                  <option value="">كل الجنسيات</option>
                  <option value="Kenya - كينيا">كينيا</option>
                  <option value="Uganda - أوغندا">أوغندا</option>
                </select>
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center bg-gray-100 border border-gray-300 rounded-md px-2 py-2 w-full md:w-[234px]">
                <input
                  type="text"
                  placeholder="بحث"
                  value={filters.Name}
                  onChange={(e) => handleFilterChange('Name', e.target.value)}
                  className="bg-transparent border-none text-gray-500 w-full text-right"
                />
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button className="flex gap-1 bg-teal-800 text-white rounded px-2 py-1">
                <FileTextOutlined className="w-4 h-4 text-white" />
                <span>Excel</span>
              </button>
              <button onClick={exportToPDF} className="flex items-center gap-1 bg-teal-800 text-white rounded px-2 py-1">
                <FilePdfFilled className="w-4 h-4 text-white" />
                <span>PDF</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading && <div className="text-center text-gray-500 py-4">جاري التحميل...</div>}
            {error && <div className="text-center text-red-500 py-4">{error}</div>}
            {!loading && !error && homemaids.length === 0 && (
              <div className="text-center text-gray-500 py-4">لا توجد بيانات متاحة</div>
            )}
            {!loading && !error && homemaids.length > 0 && (
              <div
                className="grid text-right"
                style={{
                  gridTemplateColumns: `repeat(${
                    Object.values(visibleColumns).filter(Boolean).length
                  }, minmax(100px, 1fr))`,
                  minWidth: `${
                    Object.values(visibleColumns).filter(Boolean).length * 100
                  }px`,
                }}
              >
                {visibleColumns.id && (
                  <div className="bg-teal-800 text-white text-md font-normal p-4 text-center">#</div>
                )}
                {visibleColumns.Name && (
                  <div className="bg-teal-800 text-white text-md font-normal p-4 text-center">الاسم</div>
                )}
                {visibleColumns.phone && (
                  <div className="bg-teal-800 text-white text-md font-normal p-4 text-center">رقم الجوال</div>
                )}
                {visibleColumns.Nationalitycopy && (
                  <div className="bg-teal-800 text-white text-md font-normal p-4 text-center">الجنسية</div>
                )}
                {visibleColumns.maritalstatus && (
                  <div className="bg-teal-800 text-white text-md font-normal p-4 text-center">الحالة الاجتماعية</div>
                )}
                {visibleColumns.Passportnumber && (
                  <div className="bg-teal-800 text-white text-md font-normal p-4 text-center">رقم الجواز</div>
                )}
                {visibleColumns.PassportStart && (
                  <div className="bg-teal-800 text-white text-md font-normal p-4 text-center">بداية الجواز</div>
                )}
                {visibleColumns.PassportEnd && (
                  <div className="bg-teal-800 text-white text-md font-normal p-4 text-center">نهاية الجواز</div>
                )}
                {visibleColumns.Experience && (
                  <div className="bg-teal-800 text-white text-md font-normal p-4 text-center">الخبرة</div>
                )}
                {visibleColumns.availability && (
                  <div className="bg-teal-800 text-white text-md font-normal p-4 text-center">مدة توفرها</div>
                )}
                {homemaids.map((homemaid, index) => (
                  <div key={homemaid.id} className={`contents ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}>
                    {visibleColumns.id && (
                      <div className="p-4 border-b border-gray-300 text-md  text-center cursor-pointer" onClick={()=>router.push("/admin/homemaidinfo?id="+homemaid.id)} >{homemaid.id}</div>
                    )}
                    {visibleColumns.Name && (
                      <div className="p-4 border-b border-gray-300 text-md  text-center">{homemaid.Name}</div>
                    )}
                    {visibleColumns.phone && (
                      <div className="p-4 border-b border-gray-300 text-md  text-center">{homemaid.phone || 'غير متوفر'}</div>
                    )}
                    {visibleColumns.Nationalitycopy && (
                      <div className="p-4 border-b border-gray-300 text-md  text-center">
                        {homemaid.Nationalitycopy ? homemaid.Nationalitycopy.split(' - ')[1] || 'غير متوفر' : 'غير متوفر'}
                      </div>
                    )}
                    {visibleColumns.maritalstatus && (
                      <div className="p-4 border-b border-gray-300 text-md  text-center">
                        {homemaid.maritalstatus ? homemaid.maritalstatus.split(' - ')[1] || 'غير متوفر' : 'غير متوفر'}
                      </div>
                    )}
                    {visibleColumns.Passportnumber && (
                      <div className="p-4 border-b border-gray-300 text-md  text-center">{homemaid.Passportnumber}</div>
                    )}
                    {visibleColumns.PassportStart && (
                      <div className="p-4 border-b border-gray-300 text-md  text-center">{getDate(homemaid.PassportStart) || 'غير متوفر'}</div>
                    )}
                    {visibleColumns.PassportEnd && (
                      <div className="p-4 border-b border-gray-300 text-md  text-center">{getDate(homemaid.PassportEnd) || 'غير متوفر'}</div>
                    )}
                    {visibleColumns.Experience && (
                      <div className="p-4 border-b border-gray-300 text-md  text-center">
                        {homemaid.Experience ? homemaid.Experience.split(' | ')[1] || 'غير متوفر' : 'غير متوفر'}
                      </div>
                    )}
                    {visibleColumns.availability && (
                      <div className="p-4 border-b border-gray-300 text-md  text-center">متاحة الآن</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
 
 
 
  {/* Export Modal */}
        <Modal
          isOpen={showExportModal}
          onRequestClose={() => setShowExportModal(false)}
          style={customModalStyles}
          contentLabel="حالة التصدير"
          shouldFocusAfterRender={true}
          shouldCloseOnOverlayClick={false}
        >
          <div className="relative text-center">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-0 right-0 text-gray-500 hover:text-gray-700"
              aria-label="إغلاق"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {exportType === 'loading' && (
              <div className="py-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-800 mx-auto mb-4"></div>
                <h2 className={`text-xl font-bold text-teal-800 mb-2 ${Style["almarai-bold"]}`}>
                  جاري التصدير...
                </h2>
                <p className={`text-gray-600 ${Style["almarai-regular"]}`}>
                  {exportMessage}
                </p>
              </div>
            )}

            {exportType === 'success' && (
              <div className="py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h2 className={`text-xl font-bold text-green-800 mb-2 ${Style["almarai-bold"]}`}>
                  تم التصدير بنجاح!
                </h2>
                <p className={`text-gray-600 mb-6 ${Style["almarai-regular"]}`}>
                  {exportMessage}
                </p>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="bg-teal-800 text-white px-6 py-2 rounded-lg hover:bg-teal-900 transition-colors"
                >
                  موافق
                </button>
              </div>
            )}

            {exportType === 'error' && (
              <div className="py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
                <h2 className={`text-xl font-bold text-red-800 mb-2 ${Style["almarai-bold"]}`}>
                  حدث خطأ!
                </h2>
                <p className={`text-gray-600 mb-6 ${Style["almarai-regular"]}`}>
                  {exportMessage}
                </p>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  موافق
                </button>
              </div>
            )}
          </div>
        </Modal>
 
 
 
 
 
 
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 gap-4">
 
 
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || loading}
                className="border border-gray-300 bg-gray-100 text-gray-800 text-md px-3 py-1 rounded min-w-[20px] text-center disabled:opacity-50"
              >
                الأول
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="border border-gray-300 bg-gray-100 text-gray-800 text-md px-3 py-1 rounded min-w-[20px] text-center disabled:opacity-50"
              >
                السابق
              </button>
              {getPaginationRange().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  disabled={loading}
                  className={`border text-md px-2 py-1 rounded min-w-[20px] text-center ${
                    currentPage === page ? 'border-teal-800 bg-teal-800 text-gray-100' : 'border-gray-300 bg-gray-100 text-gray-800'
                  } disabled:opacity-50`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="border border-gray-300 bg-gray-100 text-gray-800 text-md px-3 py-1 rounded min-w-[20px] text-center disabled:opacity-50"
              >
                التالي
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages || loading}
                className="border border-gray-300 bg-gray-100 text-gray-800 text-md px-3 py-1 rounded min-w-[20px] text-center disabled:opacity-50"
              >
                الأخير
              </button>
            </div>
            <div className="text-base text-black">
              عرض {(currentPage - 1) * 10 + 1}- {Math.min(currentPage * 10, homemaids.length + (currentPage - 1) * 10)} من {totalPages * 10} نتيجة
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}


export async function getServerSideProps({ req }) {
  try {
    const cookieHeader = req.headers.cookie;
    let cookies = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    if (!cookies.authToken) {
      return {
        redirect: { destination: "/admin/login", permanent: false },
      };
    }

    const token = jwtDecode(cookies.authToken);
    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });

    const hasPermission = findUser && findUser.role?.permissions?.["إدارة الطلبات"]?.["عرض"];

    return {
      props: {
        hasPermission: !!hasPermission,
      },
    };
  } catch (err) {
    console.error("Authorization error:", err);
    return {
      props: {
        hasPermission: false,
      },
    };
  }
}