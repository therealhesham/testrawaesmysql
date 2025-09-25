import { useEffect, useState } from 'react';
import { DocumentDownloadIcon, TableIcon } from '@heroicons/react/outline';
import { Search, ChevronDown } from 'lucide-react';
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import prisma from 'pages/api/globalprisma';
import { jwtDecode } from 'jwt-decode';

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [contractType, setContractType] = useState('recruitment');
  const pageSize = 10;

  async function fetchData(page = 1) {
    try {
      const res = await fetch(`/api/endedorders?page=${page}&typeOfContract=${contractType}`);
      const { homemaids, totalCount, totalPages } = await res.json();
      setData(homemaids);
      setTotalCount(totalCount);
      setTotalPages(totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setData([]);
      setTotalCount(0);
      setTotalPages(1);
    }
  }

  useEffect(() => {
    fetchData();
  }, [contractType]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchData(page);
    }
  };

  const exportToPDF = async () => {
    const doc = new jsPDF();
    
    try {
      // تحميل خط Amiri بشكل صحيح
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
      // استخدام الخط الافتراضي في حالة فشل تحميل Amiri
      doc.setFont('helvetica', 'normal');
    }

    doc.setLanguage('ar');
    doc.setFontSize(16);
    doc.text(contractType === 'recruitment' ? 'طلبات الاستقدام' : 'طلبات التأجير', 200, 10, { align: 'center' });
    
    // Define table columns
    const columns = [
      '#', 'اسم العميل', 'جوال العميل', 'هوية العميل', 
      'رقم العاملة', 'اسم العاملة', 'الجنسية', 
      'رقم جواز السفر', 'المتبقي من الضمان', 
      'مدة المعاملة', 'التقييم'
    ];
    
    // Prepare table data
    const tableData = data.map(booking => [
      `#${booking.id}`,
      booking.ClientName || 'غير متوفر',
      booking.clientphonenumber || 'غير متوفر',
      booking.clientID || 'غير متوفر',
      booking.HomemaidId || 'غير متوفر',
      booking.Name || 'غير متوفر',
      booking.Nationality || 'غير متوفر',
      booking.Passportnumber || 'غير متوفر',
      booking.isContractEnded ? 'انتهت فترة الضمان' : 'مستمر',
      'غير متوفر',
      booking.isContractEnded ? 'لا' : 'نعم'
    ]);

    // Add table to PDF
    doc.autoTable({
      head: [columns],
      body: tableData,
      startY: 25,
      styles: {
        font: Style["tajawal-bold"],
        halign: 'right',
        fontSize: 10,
      },
      headStyles: {
        fillColor: [0, 105, 92], // Teal color
        textColor: [255, 255, 255],
      },
      margin: { right: 10, left: 10 },
      theme: 'grid',
    });

    // Save the PDF
    doc.save(`orders_${contractType}.pdf`);
  };

  const exportToExcel = () => {
    // Prepare data for Excel
    const worksheetData = data.map(booking => ({
      '#': booking.id,
      'اسم العميل': booking.ClientName || 'غير متوفر',
      'جوال العميل': booking.clientphonenumber || 'غير متوفر',
      'هوية العميل': booking.clientID || 'غير متوفر',
      'رقم العاملة': booking.HomemaidId || 'غير متوفر',
      'اسم العاملة': booking.Name || 'غير متوفر',
      'الجنسية': booking.Nationality || 'غير متوفر',
      'رقم جواز السفر': booking.Passportnumber || 'غير متوفر',
      'المتبقي من الضمان': booking.isContractEnded ? 'انتهت فترة الضمان' : 'مستمر',
      'مدة المعاملة': 'غير متوفر',
      'التقييم': booking.isContractEnded ? 'لا' : 'نعم'
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
      { wch: 20 }, { wch: 15 }, { wch: 10 }
    ];

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, contractType === 'recruitment' ? 'طلبات الاستقدام' : 'طلبات التأجير');

    // Export to Excel
    XLSX.writeFile(workbook, `orders_${contractType}.xlsx`);
  };

  const renderPagination = () => {
    const pages = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
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
          className={`px-2.5 py-1 border rounded text-xs ${
            i === currentPage
              ? 'border-teal-900 bg-teal-900 text-white'
              : 'border-gray-300 bg-gray-50 text-gray-800'
          }`}
        >
          {i}
        </a>
      );
    }

    return pages;
  };

  return (
    <Layout>
      <section id="dashboard" className={`flex flex-row mx-auto min-h-screen ${Style["tajawal-regular"]}`}>
        <div className="flex-1 flex flex-col w-full">
          <main className="p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-normal text-black mb-6 text-right">
              الطلبات المكتملة
            </h1>
            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start border-b border-gray-300 mb-6 flex-col sm:flex-row gap-4">
                <div className="flex gap-10">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setContractType('recruitment');
                    }}
                    className={`text-sm text-gray-500 pb-4 relative flex items-center gap-1 font-bold ${
                      contractType === 'recruitment' ? 'border-b-2 border-black' : ''
                    }`}
                  >
                    طلبات الاستقدام <span className="text-xs align-super">{totalCount}</span>
                  </a>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setContractType('rental');
                    }}
                    className={`text-sm text-gray-500 pb-4 relative flex items-center gap-1 ${
                      contractType === 'rental' ? 'border-b-2 border-black' : ''
                    }`}
                  >
                    طلبات التأجير <span className="text-xs align-super">{totalCount}</span>
                  </a>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={exportToPDF}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-900 text-white text-xs font-tajawal"
                  >
                    <DocumentDownloadIcon className="w-4 h-4" />
                    PDF
                  </button>
                  <button 
                    onClick={exportToExcel}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-900 text-white text-xs font-tajawal"
                  >
                    <TableIcon className="w-4 h-4" />
                    Excel
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center mb-6 flex-col sm:flex-row gap-4">
                <div className="flex gap-4">
                  <div className="flex items-center bg-gray-50 border border-gray-300 rounded px-2.5 py-2 gap-4">
                    <input
                      type="text"
                      placeholder="بحث"
                      className="border-none bg-transparent outline-none text-right font-tajawal text-sm text-gray-500"
                    />
                    <Search className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex items-center bg-gray-50 border border-gray-300 rounded px-2.5 py-2 gap-10 text-sm text-gray-500 cursor-pointer">
                    <span>كل الجنسيات</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
                <button className="bg-teal-900 text-white border-none rounded px-4 py-2 text-sm font-tajawal cursor-pointer">
                  اعادة ضبط
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-teal-900">
                      {['#', 'اسم العميل', 'جوال العميل', 'هوية العميل', 'رقم العاملة', 'اسم العاملة', 'الجنسية', 'رقم جواز السفر', 'المتبقي من الضمان', 'مدة المعاملة', 'التقييم'].map((header) => (
                        <th key={header} className="text-white text-xs font-normal p-4 text-right">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((booking) => (
                      <tr key={booking.id} className="bg-gray-50 border-b border-gray-300 last:border-b-0">
                        <td className="p-4 text-xs text-gray-800 text-right">#{booking.id}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.ClientName || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.clientphonenumber || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.clientID || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.HomemaidId || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right whitespace-normal">{booking.Name || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.Nationality || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.Passportnumber || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.isContractEnded ? 'انتهت فترة الضمان' : 'مستمر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">غير متوفر</td>
                        <td className="p-4 text-xs text-right">
                          <span className={`inline-block px-3 py-1 rounded-lg ${booking.isContractEnded ? 'text-red-600' : 'text-teal-900'}`}>
                            {booking.isContractEnded ? 'لا' : 'نعم'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-6 flex-col sm:flex-row gap-4">
                <p className="text-base text-black">
                  عرض {(currentPage - 1) * pageSize + 1}- {Math.min(currentPage * pageSize, totalCount)} من {totalCount} نتيجة
                </p>
                <div className="flex items-center gap-1.5">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage - 1);
                    }}
                    className={`px-2.5 py-1 border rounded text-xs ${
                      currentPage === 1 ? 'border-gray-300 bg-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300 bg-gray-50 text-gray-800'
                    }`}
                  >
                    السابق
                  </a>
                  {renderPagination()}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage + 1);
                    }}
                    className={`px-2.5 py-1 border rounded text-xs ${
                      currentPage === totalPages ? 'border-gray-300 bg-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300 bg-gray-50 text-gray-800'
                    }`}
                  >
                    التالي
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      </section>
    </Layout>
  );
}


export async function getServerSideProps ({ req }) {
  try {
    console.log("sss")
    // 🔹 Extract cookies
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    // 🔹 Check for authToken
    if (!cookies.authToken) {
      return {
        redirect: { destination: "/admin/login", permanent: false },
      };
    }

    // 🔹 Decode JWT
    const token = jwtDecode(cookies.authToken);

    // 🔹 Fetch user & role with Prisma
    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });
console.log(findUser.role?.permissions?.["إدارة الطلبات"])
    if (
      !findUser ||
      !findUser.role?.permissions?.["إدارة الطلبات"]?.["عرض"]
    ) {
      return {
        redirect: { destination: "/admin/home", permanent: false }, // or show 403
      };
    }

    return { props: {} };
  } catch (err) {
    console.error("Authorization error:", err);
    return {
      redirect: { destination: "/admin/home", permanent: false },
    };
  }
};