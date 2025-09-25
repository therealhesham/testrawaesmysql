import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { DocumentDownloadIcon, TableIcon } from '@heroicons/react/outline';
import { Search, ChevronDown, X } from 'lucide-react';
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css";
import axios from 'axios';
import PreRentalModal from 'components/PreRentalModal';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';

interface DashboardProps {
  hasPermission: boolean;
  redirectTo?: string;
  initialData?: any[];
  initialCounts?: {
    totalCount: number;
    totalPages: number;
    recruitment: number;
    rental: number;
  };
  initialOffices?: any[];
  initialNationalities?: any[];
}

export default function Dashboard({ 
  hasPermission, 
  redirectTo, 
  initialData, 
  initialCounts, 
  initialOffices, 
  initialNationalities 
}: DashboardProps) {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [contractType, setContractType] = useState('recruitment');
  const [recruitmentCount, setRecruitmentCount] = useState(0);
  const [rentalCount, setRentalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [nationality, setNationality] = useState('');
  const [office, setOffice] = useState('');
  const [status, setStatus] = useState('');
  const [offices, setOffices] = useState([]);
  const [nationalities, setNationalities] = useState([]);
  const [statuses] = useState([
    'قيد الانتظار',
    'موافقة المكتب الخارجي',
    'تم اجتياز الفحص الطبي',
    'موافقة وزارة العمل الأجنبية',
    'تم دفع الوكالة',
    'موافقة السفارة السعودية',
    'تم إصدار التأشيرة',
    'تم إصدار تصريح السفر',
    'تم الاستلام',
    'ملغي',
    'مرفوض',
    'تم التسليم',
    'طلب جديد',
    'طلبات جديدة'
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(!hasPermission);

  // دالة ترجمة حالة الطلب من الإنجليزية إلى العربية
  const translateBookingStatus = (status: string) => {
    const statusTranslations: { [key: string]: string } = {
      'pending': 'قيد الانتظار',
      'external_office_approved': 'موافقة المكتب الخارجي',
      'pending_external_office': 'في انتظار المكتب الخارجي',
      'medical_check_passed': 'تم اجتياز الفحص الطبي',
      'pending_medical_check': 'في انتظار الفحص الطبي',
      'foreign_labor_approved': 'موافقة وزارة العمل الأجنبية',
      'pending_foreign_labor': 'في انتظار وزارة العمل الأجنبية',
      'agency_paid': 'تم دفع الوكالة',
      'pending_agency_payment': 'في انتظار دفع الوكالة',
      'embassy_approved': 'موافقة السفارة السعودية',
      'pending_embassy': 'في انتظار السفارة السعودية',
      'visa_issued': 'تم إصدار التأشيرة',
      'pending_visa': 'في انتظار إصدار التأشيرة',
      'travel_permit_issued': 'تم إصدار تصريح السفر',
      'pending_travel_permit': 'في انتظار تصريح السفر',
      'received': 'تم الاستلام',
      'pending_receipt': 'في انتظار الاستلام',
      'cancelled': 'ملغي',
      'rejected': 'مرفوض',
      'delivered': 'تم التسليم',
      'new_order': 'طلب جديد',
      'new_orders': 'طلبات جديدة'
    };
    
    return statusTranslations[status] || status;
  };

  // دالة ترجمة حالة الطلب من العربية إلى الإنجليزية (للبحث)
  const translateBookingStatusToEnglish = (arabicStatus: string) => {
    const reverseTranslations: { [key: string]: string } = {
      'قيد الانتظار': 'pending',
      'موافقة المكتب الخارجي': 'external_office_approved',
      'في انتظار المكتب الخارجي': 'pending_external_office',
      'تم اجتياز الفحص الطبي': 'medical_check_passed',
      'في انتظار الفحص الطبي': 'pending_medical_check',
      'موافقة وزارة العمل الأجنبية': 'foreign_labor_approved',
      'في انتظار وزارة العمل الأجنبية': 'pending_foreign_labor',
      'تم دفع الوكالة': 'agency_paid',
      'في انتظار دفع الوكالة': 'pending_agency_payment',
      'موافقة السفارة السعودية': 'embassy_approved',
      'في انتظار السفارة السعودية': 'pending_embassy',
      'تم إصدار التأشيرة': 'visa_issued',
      'في انتظار إصدار التأشيرة': 'pending_visa',
      'تم إصدار تصريح السفر': 'travel_permit_issued',
      'في انتظار تصريح السفر': 'pending_travel_permit',
      'تم الاستلام': 'received',
      'في انتظار الاستلام': 'pending_receipt',
      'ملغي': 'cancelled',
      'مرفوض': 'rejected',
      'تم التسليم': 'delivered',
      'طلب جديد': 'new_order',
      'طلبات جديدة': 'new_orders'
    };
    
    return reverseTranslations[arabicStatus] || arabicStatus;
  };

  const pageSize = 10;

  // Fetch offices and nationalities
  useEffect(() => {
    if (hasPermission) {
      const fetchOffices = async () => {
        try {
          const response = await axios.get("/api/offices");
          setOffices(response.data.officesFinder || []);
          setNationalities(response.data.countriesfinder || []);
        } catch (error) {
          console.error('Error fetching offices:', error);
        }
      };
      fetchOffices();
    }
  }, [hasPermission]);

  // Fetch data with filters
  async function fetchData(page = 1) {
    if (!hasPermission) return;
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        typeOfContract: contractType,
        ...(searchTerm && { searchTerm }),
        ...(nationality && { Nationalitycopy: nationality }),
        ...(office && { officeName: office }),
        ...(status && { bookingstatus: translateBookingStatusToEnglish(status) }),
      });

      const res = await fetch(`/api/currentordersprisma?${queryParams.toString()}`);
      const { homemaids, totalCount, totalPages, recruitment, rental } = await res.json();
      setData(Array.isArray(homemaids) ? homemaids : []);
      setTotalCount(totalCount || 0);
      setRecruitmentCount(recruitment || 0);
      setRentalCount(rental || 0);
      setTotalPages(totalPages || 1);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setData([]);
      setTotalCount(0);
      setTotalPages(1);
    }
  }

  // Fetch data when filters or contract type change
  useEffect(() => {
    if (hasPermission) {
      fetchData();
    }
  }, [contractType, searchTerm, nationality, office, status, hasPermission]);

  // Export to PDF
  const exportToPDF = async () => {
    const doc = new jsPDF();

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
    doc.text('طلبات تحت الإجراء', 200, 10, { align: 'right' });

    const tableColumn = [
      'رقم الطلب',
      'اسم العميل',
      'جوال العميل',
      'هوية العميل',
      'رقم العاملة',
      'اسم العاملة',
      'الجنسية',
      'رقم جواز السفر',
      'رقم عقد مساند',
      'اسم المكتب الخارجي',
      'حالة الطلب',
    ];
    const tableRows = Array.isArray(data)
      ? data.map(row => [
          row.id || 'غير متوفر',
          row.client?.fullname || 'غير متوفر',
          row.client?.phone || 'غير متوفر',
          row.client?.nationalId || 'غير متوفر',
          row.HomeMaid?.id || 'غير متوفر',
          row.HomeMaid?.Name || 'غير متوفر',
          row.HomeMaid?.office?.Country || 'غير متوفر',
          row.HomeMaid?.Passportnumber || 'غير متوفر',
          row.arrivals?.InternalmusanedContract || 'غير متوفر',
          row.HomeMaid?.office?.office || 'غير متوفر',
          translateBookingStatus(row.bookingstatus) || 'غير متوفر',
        ])
      : [];

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
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
        halign: 'right',
      },
      margin: { top: 20, right: 10, left: 10 },
      didParseCell: (data) => {
        data.cell.styles.halign = 'right';
      },
    });

    doc.save('current_orders.pdf');
  };

  // Export to Excel
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('طلبات تحت الإجراء', { properties: { defaultColWidth: 20 } });

    worksheet.columns = [
      { header: 'رقم الطلب', key: 'id', width: 15 },
      { header: 'اسم العميل', key: 'clientName', width: 20 },
      { header: 'جوال العميل', key: 'clientPhone', width: 15 },
      { header: 'هوية العميل', key: 'clientNationalId', width: 15 },
      { header: 'رقم العاملة', key: 'maidId', width: 15 },
      { header: 'اسم العاملة', key: 'maidName', width: 20 },
      { header: 'الجنسية', key: 'nationality', width: 15 },
      { header: 'رقم جواز السفر', key: 'passport', width: 15 },
      { header: 'رقم عقد مساند', key: 'contract', width: 15 },
      { header: 'اسم المكتب الخارجي', key: 'office', width: 20 },
      { header: 'حالة الطلب', key: 'status', width: 15 },
    ];

    worksheet.getRow(1).font = { name: 'Amiri', size: 12 };
    worksheet.getRow(1).alignment = { horizontal: 'right' };

    Array.isArray(data) &&
      data.forEach(row => {
        worksheet.addRow({
          id: row.id || 'غير متوفر',
          clientName: row.client?.fullname || 'غير متوفر',
          clientPhone: row.client?.phone || 'غير متوفر',
          clientNationalId: row.client?.nationalId || 'غير متوفر',
          maidId: row.HomeMaid?.id || 'غير متوفر',
          maidName: row.HomeMaid?.Name || 'غير متوفر',
          nationality: row.HomeMaid?.office?.Country || 'غير متوفر',
          passport: row.HomeMaid?.Passportnumber || 'غير متوفر',
          contract: row.arrivals?.InternalmusanedContract || 'غير متوفر',
          office: row.HomeMaid?.office?.office || 'غير متوفر',
          status: translateBookingStatus(row.bookingstatus) || 'غير متوفر',
        }).alignment = { horizontal: 'right' };
      });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'current_orders.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchData(page);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setNationality('');
    setOffice('');
    setStatus('');
    setCurrentPage(1);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handlePermissionModalClose = () => {
    setIsPermissionModalOpen(false);
    router.push(redirectTo || "/admin/home");
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
          className={`px-2.5 py-1 border rounded text-md ${
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

  const handleOrderClick = (id: any) => {
    router.push(`/admin/track_order/${id}`);
  };

  return (
    <Layout>
      <section id="dashboard" className={`flex flex-row mx-auto min-h-screen ${Style["tajawal-regular"]}`} dir="rtl">
        <div className="flex-1 flex flex-col w-full">
          <main className="p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-normal text-black mb-6 text-right">
              طلبات تحت الإجراء
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
                    className={`text-md text-gray-500 pb-4 relative flex items-center gap-1 font-bold ${
                      contractType === 'recruitment' ? 'border-b-2 border-black' : ''
                    }`}
                  >
                    طلبات الاستقدام <span className="text-md align-super">{recruitmentCount}</span>
                  </a>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setContractType('rental');
                    }}
                    className={`text-md text-gray-500 pb-4 relative flex items-center gap-1 ${
                      contractType === 'rental' ? 'border-b-2 border-black' : ''
                    }`}
                  >
                    طلبات التأجير <span className="text-md align-super">{rentalCount}</span>
                  </a>
                </div>
                <div className="flex gap-2">
                  {contractType === 'rental' && (
                    <button
                      onClick={handleOpenModal}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-900 text-white text-md font-tajawal"
                    >
                      إضافة طلب تأجير
                    </button>
                  )}
                  <button
                    onClick={exportToPDF}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-900 text-white text-md font-tajawal"
                  >
                    <DocumentDownloadIcon className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-900 text-white text-md font-tajawal"
                  >
                    <TableIcon className="w-4 h-4" />
                    Excel
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center mb-6 flex-col sm:flex-row gap-4">
                <div className="flex gap-4">
                  <div className="flex items-center bg-gray-50 border border-gray-300 rounded gap-4">
                    <input
                      type="text"
                      placeholder="بحث"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border-none bg-transparent text-md text-gray-500 text-right"
                    />
                    <Search className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="flex items-center bg-gray-50 border border-gray-300 rounded gap-10 text-md text-gray-500 cursor-pointer  text-right"
                    >
                      <option value="">حالة الطلب</option>
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <select
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="flex items-center bg-gray-50 border border-gray-300 rounded gap-10 text-md text-gray-500 cursor-pointer appearance-none text-right"
                    >
                      <option value="">كل الجنسيات</option>
                      {nationalities.map((nat) => (
                        <option key={nat?.Country} value={nat?.Country}>
                          {nat?.Country}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <select
                      value={office}
                      onChange={(e) => setOffice(e.target.value)}
                      className="flex items-center bg-gray-50 border border-gray-300 rounded gap-10 text-md text-gray-500 cursor-pointer appearance-none text-right"
                    >
                      <option value="">كل المكاتب</option>
                      {offices.map((off: any) => (
                        <option key={off.id} value={off.office}>
                          {off.office}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="bg-teal-900 text-white border-none rounded px-4 py-2 text-md font-tajawal cursor-pointer"
                >
                  إعادة ضبط
                </button>
              </div>
              <div className="overflow-x-auto" dir="rtl">
                <table className="w-full border-collapse min-w-[1000px] text-right">
                  <thead>
                    <tr className="bg-teal-900">
                      {[
                        'رقم الطلب',
                        'اسم العميل',
                        'جوال العميل',
                        'هوية العميل',
                        'رقم العاملة',
                        'اسم العاملة',
                        'الجنسية',
                        'رقم جواز السفر',
                        'رقم عقد مساند',
                        'اسم المكتب الخارجي',
                        'حالة الطلب',
                      ].map((header) => (
                        <th key={header} className="text-white text-md font-normal p-4 text-right">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((booking) => (
                      <tr key={booking.id} className="bg-gray-50 border-b border-gray-300 last:border-b-0">
                        <td className="p-4 text-md text-gray-800 text-right cursor-pointer" onClick={() => handleOrderClick(booking.id)}>
                          #{booking.id}
                        </td>
                        <td className="p-4 text-md text-gray-800 text-right">{booking.client?.fullname || 'غير متوفر'}</td>
                        <td className="p-4 text-md text-gray-800 text-right">{booking.client?.phone || 'غير متوفر'}</td>
                        <td className="p-4 text-md text-gray-800 text-right">{booking.client?.nationalId || 'غير متوفر'}</td>
                        <td className="p-4 text-md text-gray-800 text-right">{booking.HomeMaid?.id || 'غير متوفر'}</td>
                        <td className="p-4 text-md text-gray-800 text-right">{booking.HomeMaid?.Name || 'غير متوفر'}</td>
                        <td className="p-4 text-md text-gray-800 text-right">{booking.HomeMaid?.office?.Country || 'غير متوفر'}</td>
                        <td className="p-4 text-md text-gray-800 text-right">{booking.HomeMaid?.Passportnumber || 'غير متوفر'}</td>
                        <td className="p-4 text-md text-gray-800 text-right">{booking.arrivals?.InternalmusanedContract || 'غير متوفر'}</td>
                        <td className="p-4 text-md text-gray-800 text-right">{booking.HomeMaid?.office?.office || 'غير متوفر'}</td>
                        <td className="p-4 text-md text-gray-800 text-right">{translateBookingStatus(booking.bookingstatus) || 'غير متوفر'}</td>
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
                    className={`px-2.5 py-1 border rounded text-md ${
                      currentPage === 1 ? 'border-gray-300 bg-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300 bg-gray-50 text-gray-800'
                    }`}
                  >
                    السابق
                  </a>
                  {renderPagination()}
                  <a
                    // href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage + 1);
                    }}
                    className={`px-2.5 py-1 border rounded text-md ${
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-right">إضافة طلب تأجير</h2>
            <PreRentalModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              onSelectClient={(client) => {
                handleCloseModal();
              }}
            />
          </div>
        </div>
      )}

      {isPermissionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative" dir="rtl">
            <button
              onClick={handlePermissionModalClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-right">غير مصرح</h2>
            <p className="text-right mb-4">ليس لديك الصلاحيات اللازمة للوصول إلى هذه الصفحة.</p>
            <button
              onClick={handlePermissionModalClose}
              className="bg-teal-900 text-white rounded px-4 py-2 w-full font-tajawal"
            >
              الذهاب إلى صفحة تسجيل الدخول
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export async function getServerSideProps({ req }) {
  try {
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    if (!cookies.authToken) {
      return {
        props: { hasPermission: false, redirectTo: "/admin/login" },
      };
    }

    const token = jwtDecode(cookies.authToken);
    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });

    if (!findUser || !findUser.role?.permissions?.["إدارة الطلبات"]?.["عرض"]) {
      return {
        props: { hasPermission: false, redirectTo: "/admin/home" },
      };
    }

    return { props: { hasPermission: true } };
  } catch (err) {
    console.error("Authorization error:", err);
    return {
      props: { hasPermission: false, redirectTo: "/admin/home" },
    };
  }
}