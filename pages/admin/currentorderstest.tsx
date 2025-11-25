import { useEffect, useState, useCallback } from 'react'; // أضف useCallback
import { useRouter } from 'next/router';
import { DocumentDownloadIcon, TableIcon } from '@heroicons/react/outline';
import { Search, ChevronDown, X } from 'lucide-react';
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css";
import PreRentalModal from 'components/PreRentalModal';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import Head from 'next/head';

interface DashboardProps {
  hasPermission: boolean;
  redirectTo?: string;
  recruitmentData: any[]; // Recruitment orders data for initial page
  rentalData: any[]; // Rental orders data for initial page
  initialCounts: {
    totalCount: number; // Total count for the default contract type (recruitment)
    totalPages: number; // Total pages for the default contract type (recruitment)
    recruitment: number; // Total recruitment count
    rental: number; // Total rental count
  };
  initialOffices: any[];
  initialNationalities: any[];
  lastUpdated: string;
}

export default function Dashboard({
  hasPermission: initialHasPermission,
  redirectTo,
  recruitmentData,
  rentalData,
  initialCounts,
  initialOffices,
  initialNationalities,
  lastUpdated
}: DashboardProps) {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(initialHasPermission);

  const [userName, setUserName] = useState('');
  // Initial data based on the default contract type ("recruitment")
  const [data, setData] = useState(recruitmentData || []);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(initialCounts?.recruitment || 0); // Start with recruitment total
  const [totalPages, setTotalPages] = useState(Math.ceil((initialCounts?.recruitment || 0) / 10)); // Calculate initial total pages based on recruitment count

  const [contractType, setContractType] = useState('recruitment');
  const [recruitmentCount, setRecruitmentCount] = useState(initialCounts?.recruitment || 0);
  const [rentalCount, setRentalCount] = useState(initialCounts?.rental || 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [nationality, setNationality] = useState('');
  const [office, setOffice] = useState('');
  const [status, setStatus] = useState('');
  const [offices, setOffices] = useState(initialOffices || []);
  const [nationalities, setNationalities] = useState(initialNationalities || []);
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
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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

  // Fetch data with filters
  const fetchData = useCallback(async (page = 1) => {
    if (!hasPermission) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
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
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

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
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, contractType, searchTerm, nationality, office, status]); // Dependencies for useCallback
useEffect(() => {
  const authToken = localStorage.getItem('token');
  const decoder = authToken ? jwtDecode(authToken) : null;
  setUserName(decoder?.username || '');
}, [userName]);
  useEffect(() => {
    const checkAuthAndPermissions = async () => {
      if (typeof window !== 'undefined') {
        setIsCheckingAuth(true);
        
        const authToken = localStorage.getItem('token');
        const decoder = authToken ? jwtDecode(authToken) : null;

        if (!decoder) {
          setHasPermission(false);
          setIsPermissionModalOpen(true);
          setIsCheckingAuth(false);
          router.push("/admin/login"); // Redirect to login if no token or invalid
          return;
        }

        try {
          const response = await fetch('/api/verify-permissions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          });

          if (!response.ok) {
            console.error("Permission API error:", response.status, response.statusText);
            setHasPermission(false);
            setIsPermissionModalOpen(true);
            setIsCheckingAuth(false);
            return;
          }

          const result = await response.json();

          if (result.hasPermission) {
            setHasPermission(true);
            setIsPermissionModalOpen(false);
          } else {
            setHasPermission(false);
            setIsPermissionModalOpen(true);
          }
        } catch (error) {
          console.error('Authentication error:', error);
          setHasPermission(false);
          setIsPermissionModalOpen(true);
        } finally {
          setIsCheckingAuth(false);
        }
      }
    };

    checkAuthAndPermissions();
  }, []); // Run only once on mount

  // Effect to refetch data when contract type or filters change
  useEffect(() => {
    if (hasPermission && !isCheckingAuth) {
      // Reset page to 1 when filters or contract type change
      setCurrentPage(1);
      fetchData(1);
    }
  }, [contractType, searchTerm, nationality, office, status, hasPermission, isCheckingAuth, fetchData]);

const exportedData = async ()=>{

  const query = new URLSearchParams({
    perPage: "1000",
    ...(searchTerm && { search: searchTerm }),
    ...(nationality && { Nationalitycopy: nationality }),
    ...(office && { officeName: office }),
    ...(contractType && {typeOfContract:contractType}),
    ...(status && { bookingstatus: translateBookingStatusToEnglish(status) }),
  }).toString();
  const res = await fetch(`/api/currentordersprisma?${query}`);
  if (!res.ok) throw new Error("Failed to fetch data");
  const data = await res.json();
  // return contr data.data;
  if(contractType === 'recruitment'){
    return data.homemaids;
  } else if(contractType === 'rental') {
    return data.homemaids;
  } else {
    return data.homemaids;
  }
}
  // Export to PDF
  const exportToPDF = async () => {
    let dataToExport = await exportedData();
    const doc = new jsPDF({ orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
  // 🔷 تحميل شعار مرة واحدة (لكن نستخدمه في كل صفحة)
  const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
  const logoBuffer = await logo.arrayBuffer();
  const logoBytes = new Uint8Array(logoBuffer);
  const logoBase64 = Buffer.from(logoBytes).toString('base64');
  
    try {
      doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);
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
    doc.setFontSize(16);
    doc.text("طلبات تحت الإجراء", 400, 10, { align: 'right', maxWidth: 700 });

    // دالة لتقصير النص إلى كلمتين فقط
    const truncateToTwoWords = (text: string): string => {
      if (!text || text === 'غير متوفر') return text;
      const words = text.trim().split(/\s+/);
      if (words.length <= 2) return text;
      return words.slice(0, 2).join(' ');
    };

    const tableColumn = [
      'حالة الطلب',
      'اسم المكتب الخارجي',
      'رقم عقد مساند',
      'رقم جواز السفر',
      'الجنسية',
      'اسم العاملة',
      'رقم العاملة',
      'هوية العميل',
      'جوال العميل',
      'اسم العميل',
      'رقم الطلب',
    ];
    const tableRows = Array.isArray(dataToExport)
      ? dataToExport.map(row => [
        truncateToTwoWords(translateBookingStatus(row.bookingstatus) || 'غير متوفر'),
        truncateToTwoWords(row.HomeMaid?.office?.office || 'غير متوفر'),
        truncateToTwoWords(row.arrivals?.InternalmusanedContract || 'غير متوفر'),
        truncateToTwoWords(row.HomeMaid?.Passportnumber || 'غير متوفر'),
        truncateToTwoWords(row.HomeMaid?.office?.Country || 'غير متوفر'),
        truncateToTwoWords(row.HomeMaid?.Name || 'غير متوفر'),
        truncateToTwoWords(String(row.HomeMaid?.id || 'غير متوفر')),
        truncateToTwoWords(row.client?.nationalId || 'غير متوفر'),
        truncateToTwoWords(row.client?.phonenumber || 'غير متوفر'),
        truncateToTwoWords(row.client?.fullname || 'غير متوفر'),
        truncateToTwoWords(String(row.id || 'غير متوفر')),
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
        fillColor: [26, 77, 79],
        textColor: [255, 255, 255],
        overflow:'hidden',
        halign: 'right',
      },
      columnStyles: {
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
11: { cellWidth: 'auto', overflow: 'hidden' },

      }
      ,
      margin: { top: 40, right: 10, left: 10 },
 
    didDrawPage: (data: any) => {
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;

      // 🔷 إضافة اللوجو أعلى الصفحة (في كل صفحة)
      doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

      // 🔹 كتابة العنوان في أول صفحة فقط (اختياري)
      if (doc.getCurrentPageInfo().pageNumber === 1) {
        doc.setFontSize(12);
        doc.setFont('Amiri', 'normal');
        doc.text('طلبات تحت الإجراء', pageWidth / 2, 20, { align: 'right' });
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
      didParseCell: (data: any) => {
        data.cell.styles.halign = 'right';
      },
    });
 

    doc.save('current_orders.pdf');
  };

  // Export to Excel
  const exportToExcel = async () => {
    let dataToExport = await exportedData();
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
    worksheet.columns = [
      { header: 'رقم الطلب', key: 'id', width: 10 },
      { header: 'اسم العميل', key: 'clientName', width: 20 },
      { header: 'جوال العميل', key: 'clientPhone', width: 15 },
      { header: 'هوية العميل', key: 'clientNationalId', width: 15 },
      { header: 'رقم العاملة', key: 'maidId', width: 15 },
      { header: 'اسم العاملة', key: 'maidName', width: 20 },
      { header: 'الجنسية', key: 'nationality', width: 15 },
      { header: 'رقم جواز السفر', key: 'passport', width: 15 },
      { header: 'رقم عقد مساند', key: 'contract', width: 20 },
      { header: 'اسم المكتب الخارجي', key: 'office', width: 15 },
      { header: 'حالة الطلب', key: 'status', width: 10 }
    ];

    Array.isArray(dataToExport) &&
      dataToExport.forEach(row => {
        worksheet.addRow({
          id: row.id || 'غير متوفر',
          clientName: row.client?.fullname || 'غير متوفر',
          clientPhone: row.client?.phonenumber || 'غير متوفر',
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
      setCurrentPage(page);
      fetchData(page);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setNationality('');
    setOffice('');
    setStatus('');
    setCurrentPage(1); // Reset to first page
    // fetchData(1); // Fetch data with reset filters for page 1
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Optionally refetch data if a new rental order might affect the list
    fetchData(currentPage);
  };

  const handlePermissionModalClose = () => {
    setIsPermissionModalOpen(false);
    const authToken = localStorage.getItem('token'); // Check localStorage for token
    if (!authToken) {
      router.push("/admin/login");
    } else {
      router.push("/admin/home"); // Or a dashboard where they have access
    }
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

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <Layout>
        <section className={`flex flex-row mx-auto min-h-screen ${Style["tajawal-regular"]}`} dir="rtl">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-900 mx-auto mb-4"></div>
              <p className="text-teal-900 text-lg">جاري التحقق من الصلاحيات...</p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }
  return (
    <Layout>
<Head>
  <title>طلبات تحت الإجراء</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</Head>
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
                    // href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setContractType('recruitment');
                      setCurrentPage(1); // Reset page when changing contract type
                    }}
                    className={`text-md text-gray-500 pb-4 relative flex items-center gap-1 cursor-pointer ${
                      contractType === 'recruitment' ? 'border-b-2 border-black font-bold' : ''
                    }`}
                  >
                    طلبات الاستقدام <span className="text-md align-super">{recruitmentCount}</span>
                  </a>
                  <a
                    // href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setContractType('rental');
                      setCurrentPage(1); // Reset page when changing contract type
                    }}
                    className={`text-md text-gray-500 pb-4 relative flex items-center gap-1 cursor-pointer ${
                      contractType === 'rental' ? 'border-b-2 border-black font-bold' : ''
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
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-900"></div>
                    <span className="mr-2 text-teal-900">جاري التحميل...</span>
                  </div>
                ) : (
                  <table className="w-full border-collapse min-w-[1000px] text-right">
                    <thead>
                      <tr className="bg-teal-900 ">
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
                          <th key={header} className="text-white text-md font-normal p-4 text-right  whitespace-nowrap
">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.length > 0 ? (
                        data.map((booking) => (
                          <tr key={booking.id} className="bg-gray-50 border-b border-gray-300 last:border-b-0">
                            <td className="p-4 text-md text-gray-800 text-right cursor-pointer" onClick={() => handleOrderClick(booking.id)}>
                              #{booking.id}
                            </td>
                            <td className="p-4 text-md text-gray-800 text-right">{booking.client?.fullname || 'غير متوفر'}</td>
                            <td className="p-4 text-md text-gray-800 text-right">{booking.client?.phonenumber || 'غير متوفر'}</td>
                            <td className="p-4 text-md text-gray-800 text-right">{booking.client?.nationalId || 'غير متوفر'}</td>
                            <td className="p-4 text-md text-gray-800 text-right">{booking.HomeMaid?.id || 'غير متوفر'}</td>
                            <td className="p-4 text-md text-gray-800 text-right">{booking.HomeMaid?.Name || 'غير متوفر'}</td>
                            <td className="p-4 text-md text-gray-800 text-right">{booking.HomeMaid?.office?.Country || 'غير متوفر'}</td>
                            <td className="p-4 text-md text-gray-800 text-right">{booking.HomeMaid?.Passportnumber || 'غير متوفر'}</td>
                            <td className="p-4 text-md text-gray-800 text-right">{booking.arrivals[0]?.InternalmusanedContract || 'غير متوفر'}</td>
                            <td className="p-4 text-md text-gray-800 text-right">{booking.HomeMaid?.office?.office || 'غير متوفر'}</td>
                            <td className="p-4 text-md text-gray-800 text-right">{translateBookingStatus(booking.bookingstatus) || 'غير متوفر'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={11} className="p-8 text-center text-gray-500">
                            لا توجد بيانات متاحة
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
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
                      currentPage === 1 || isLoading ? 'border-gray-300 bg-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300 bg-gray-50 text-gray-800'
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
                      currentPage === totalPages || isLoading ? 'border-gray-300 bg-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300 bg-gray-50 text-gray-800'
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
              onNewClient={() => {
                // Handle new client creation if needed
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
              العودة للصفحة الرئيسية
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

// Keep getStaticProps for initial load, fetching only the first page
export async function getStaticProps() {
  const pageSize = 10; // Define page size for getStaticProps

  try {
    const currentTime = new Date().toISOString();

    // Fetch initial recruitment orders (first page)
    const recruitmentOrders = await prisma.neworder.findMany({
      orderBy: { id: "desc" },
      select: {
        id: true,
        bookingstatus: true,
        typeOfContract: true,
        arrivals: { select: { InternalmusanedContract: true } },
        client: {
          select: {
            fullname: true,
            phonenumber: true,
            nationalId: true,
            id: true,
          }
        },
        HomeMaid: {
          select: {
            Name: true,
            Passportnumber: true,
            id: true,
            office: { select: { office: true, Country: true } }
          }
        },
      },
      where: {
        typeOfContract: "recruitment",
        NOT: {
          OR: [
            {
              bookingstatus: {
                in: ["new_order", "new_orders", "delivered", "cancelled", "rejected"],
              },
            },
            // استبعاد الطلبات التي لديها ملف استلام
            {
              DeliveryDetails: {
                some: {
                  deliveryFile: {
                    not: null,
                  },
                },
              },
            },
          ],
        },
      },
      take: pageSize, // Take only for the first page
    });

    // Fetch initial rental orders (first page)
    const rentalOrders = await prisma.neworder.findMany({
      orderBy: { id: "desc" },
      select: {
        id: true,
        bookingstatus: true,
        typeOfContract: true,
        arrivals: { select: { InternalmusanedContract: true } },
        client: {
          select: {
            fullname: true,
            phonenumber: true,
            nationalId: true,
            id: true,
          }
        },
        HomeMaid: {
          select: {
            Name: true,
            Passportnumber: true,
            id: true,
            office: { select: { office: true, Country: true } }
          }
        },
      },
      where: {
        typeOfContract: "rental",
        NOT: {
          OR: [
            {
              bookingstatus: {
                in: ["new_order", "new_orders", "delivered", "cancelled", "rejected"],
              },
            },
            // استبعاد الطلبات التي لديها ملف استلام
            {
              DeliveryDetails: {
                some: {
                  deliveryFile: {
                    not: null,
                  },
                },
              },
            },
          ],
        },
      },
      take: pageSize, // Take only for the first page
    });

    // Fetch offices and nationalities
    const offices = await prisma.offices.findMany({
      select: {
        id: true,
        office: true,
        Country: true,
        phoneNumber: true,
      },
      orderBy: { office: 'asc' }
    });

    // Get unique nationalities from offices
    const countries = offices.map(office => office.Country).filter(Boolean);
    const uniqueCountriesSet = new Set(countries);
    const uniqueCountries = Array.from(uniqueCountriesSet).map(country => ({
      Country: country
    }));

    // Count *all* orders by type (for total counts, not just first page)
    const recruitmentCount = await prisma.neworder.count({
      where: {
        typeOfContract: "recruitment",
        NOT: {
          OR: [
            {
              bookingstatus: {
                in: ["new_order", "new_orders", "delivered", "cancelled", "rejected"],
              },
            },
            // استبعاد الطلبات التي لديها ملف استلام
            {
              DeliveryDetails: {
                some: {
                  deliveryFile: {
                    not: null,
                  },
                },
              },
            },
          ],
        },
      },
    });

    const rentalCount = await prisma.neworder.count({
      where: {
        typeOfContract: "rental",
        NOT: {
          OR: [
            {
              bookingstatus: {
                in: ["new_order", "new_orders", "delivered", "cancelled", "rejected"],
              },
            },
            // استبعاد الطلبات التي لديها ملف استلام
            {
              DeliveryDetails: {
                some: {
                  deliveryFile: {
                    not: null,
                  },
                },
              },
            },
          ],
        },
      },
    });

    // The initial totalCount and totalPages should reflect the default view (recruitment)
    const initialTotalCount = recruitmentCount;
    const initialTotalPages = Math.ceil(initialTotalCount / pageSize);

    return {
      props: {
        hasPermission: true,
        recruitmentData: recruitmentOrders,
        rentalData: rentalOrders,
        initialCounts: {
          totalCount: initialTotalCount,
          totalPages: initialTotalPages,
          recruitment: recruitmentCount,
          rental: rentalCount,
        },
        initialOffices: offices,
        initialNationalities: uniqueCountries,
        lastUpdated: currentTime,
      },
      revalidate: 30, // Revalidate every 30 seconds
    };
  } catch (err) {
    console.error("ISR data fetching error:", err);
    return {
      props: {
        hasPermission: false,
        redirectTo: "/admin/home",
        recruitmentData: [],
        rentalData: [],
        initialCounts: { totalCount: 0, totalPages: 1, recruitment: 0, rental: 0 },
        initialOffices: [],
        initialNationalities: [],
        lastUpdated: new Date().toISOString(),
      },
      revalidate: 30,
    };
  }
}