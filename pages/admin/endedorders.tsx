import { useEffect, useState } from 'react';
import { DocumentDownloadIcon, TableIcon } from '@heroicons/react/outline';
import { Search, ChevronDown } from 'lucide-react';
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import prisma from 'pages/api/globalprisma';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/router';
import RatingModal from 'components/RatingModal';
import AlertModal from 'components/AlertModal';
import Head from 'next/head';

interface OrderRating {
  id: number;
  idOrder: number | null;
  isRated: boolean;
  reason: string | null;
}

interface OrderData {
  id: number;
  ClientName?: string | null;
  clientphonenumber?: string | null;
  clientID?: number | null;
  HomemaidId?: number | null;
  isContractEnded?: boolean | null;
  client?: {
    id: number;
    fullname?: string | null;
    phonenumber?: string | null;
  } | null;
  HomeMaid?: {
    id: number;
    Name?: string | null;
    Nationality?: string | null;
    Passportnumber?: string | null;
    office?: {
      Country?: string | null;
    } | null;
  } | null;
  ratings?: OrderRating[];
  arrivals?: { KingdomentryDate?: string | null; GuaranteeDurationEnd?: string | null; DateOfApplication?: string | null }[];
  createdAt?: string | null;
  DeliveryDetails?: { deliveryDate?: string | Date | null }[];
}

/** تاريخ انتهاء الضمان = 90 يوم من تاريخ وصول العاملة */
function getWarrantyEndDate(kingdomEntryDate: string | undefined): string | null {
  if (!kingdomEntryDate) return null;
  const arrival = new Date(kingdomEntryDate);
  const end = new Date(arrival);
  end.setDate(end.getDate() + 90);
  return end.toISOString().split('T')[0];
}

/** حساب الأيام المتبقية على انتهاء الضمان (موجب = متبقي، سالب = انتهى منذ) */
function getRemainingDays(endDateString: string | null | undefined): number | null {
  if (!endDateString) return null;
  const end = new Date(endDateString);
  const now = new Date();
  end.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/** نص عرض المتبقي من الضمان - المصدر الوحيد: KingdomentryDate + 90 يوم */
function getWarrantyDisplayText(order: OrderData): string {
  const endDate = getWarrantyEndDate(order.arrivals?.[0]?.KingdomentryDate as string);
  const remainingDays = getRemainingDays(endDate);
  if (order.isContractEnded) return 'انتهت فترة الضمان';
  if (remainingDays === null) return 'غير محدد';
  if (remainingDays >= 0) return `متبقي ${remainingDays} يوم`;
  return `انتهى منذ ${Math.abs(remainingDays)} يوم`;
}

/** لون نص الضمان: أخضر للمتبقي، أحمر للمنتهي */
function getWarrantyColorClass(text: string): string {
  if (text.startsWith('متبقي')) return 'text-green-600';
  if (text.startsWith('انتهى') || text === 'انتهت فترة الضمان') return 'text-red-600';
  return 'text-gray-800';
}

/** مدة المعاملة: من تاريخ العقد (DateOfApplication) إلى تاريخ الاستلام (deliveryDate) - كما في track_order */
function getTransactionDuration(order: OrderData): string {
  const startDate = order.arrivals?.[0]?.DateOfApplication;  // تاريخ العقد
  const endDate = order.DeliveryDetails?.[0]?.deliveryDate;  // تاريخ الاستلام
  if (!startDate) return 'لم تنتهِ بعد';
  if (!endDate) return 'لم تنتهِ بعد';
  const start = new Date(startDate);
  const end = new Date(endDate as string);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'لم تنتهِ بعد';
  return `${diffDays} يوم`;
}

export default function Dashboard() {
  const [data, setData] = useState<OrderData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [contractType, setContractType] = useState('recruitment');
  const [recruitmentCount, setRecruitmentCount] = useState(0);
  const [rentalCount, setRentalCount] = useState(0);
  const [nationality, setNationality] = useState('');
  const [nationalities, setNationalities] = useState<{ id: number; Country: string }[]>([]);
  const [userName, setUserName] = useState('');
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrderRating, setSelectedOrderRating] = useState<{ isRated: boolean; reason: string } | null>(null);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });
  const pageSize = 10;
  const router = useRouter();

  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setAlertModal({
      isOpen: true,
      type,
      title,
      message,
    });
  };
  async function fetchData(page = 1, signal?: AbortSignal) {
    try {
      const url = new URL(`/api/endedorders`, window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('typeOfContract', contractType);
      if (nationality) {
        url.searchParams.set('Nationality', nationality);
      }
      const res = await fetch(url.toString(), { signal });
      if (signal?.aborted) return;
      const { homemaids, totalCount, totalPages } = await res.json();
      if (signal?.aborted) return;
      setData(homemaids);
      setTotalCount(totalCount);
      setTotalPages(totalPages);
      setCurrentPage(page);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error fetching bookings:', error);
      if (!signal?.aborted) {
        setData([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    }
  }

  async function fetchCounts(signal?: AbortSignal) {
    try {
      const [recruitmentRes, rentalRes] = await Promise.all([
        fetch(`/api/endedorders?page=1&typeOfContract=recruitment`, { signal }),
        fetch(`/api/endedorders?page=1&typeOfContract=rental`, { signal })
      ]);
      
      if (signal?.aborted) return;
      
      const recruitmentData = await recruitmentRes.json();
      const rentalData = await rentalRes.json();
      
      if (signal?.aborted) return;
      
      setRecruitmentCount(recruitmentData.totalCount || 0);
      setRentalCount(rentalData.totalCount || 0);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error fetching counts:', error);
    }
  }

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;
    
    fetchData(1, signal);
    fetchCounts(signal);
    
    return () => {
      abortController.abort();
    };
  }, [contractType, nationality]);

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    const decoder = authToken ? jwtDecode(authToken) as any : null;
    setUserName(decoder?.username || '');
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;
    
    const fetchNationalities = async () => {
      try {
        const response = await fetch('/api/nationalities', { signal });
        if (signal.aborted) return;
        const data = await response.json();
        if (signal.aborted) return;
        setNationalities(data.nationalities || []);
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error('Error fetching nationalities:', error);
      }
    };
    fetchNationalities();
    
    return () => {
      abortController.abort();
    };
  }, []);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      // Create a new abort controller for page change
      const abortController = new AbortController();
      fetchData(page, abortController.signal);
    }
  };

  const handleRatingClick = (orderId: number, existingRating?: { isRated: boolean; reason: string }) => {
    setSelectedOrderId(orderId);
    if (existingRating) {
      setSelectedOrderRating(existingRating);
    } else {
      setSelectedOrderRating(null);
    }
    setIsRatingModalOpen(true);
  };

  const handleRatingSubmit = async (form: { idOrder: string; isRated: boolean; reason: string }) => {
    try {
      const orderId = parseInt(form.idOrder);
      if (isNaN(orderId)) {
        showAlert('error', 'خطأ', 'رقم الطلب غير صحيح');
        return;
      }

      // Check if rating already exists for this order
      const existingRatingRes = await fetch(`/api/ratings`);
      const allRatings = await existingRatingRes.json();
      const existingRating = allRatings.find((r: any) => r.idOrder === orderId);

      let response;
      if (existingRating) {
        // Update existing rating
        response = await fetch(`/api/ratings/${existingRating.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idOrder: orderId,
            isRated: form.isRated,
            reason: form.reason,
          }),
        });
      } else {
        // Create new rating
        response = await fetch('/api/ratings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idOrder: orderId,
            isRated: form.isRated,
            reason: form.reason,
          }),
        });
      }

      if (response.ok) {
        showAlert('success', 'نجح', 'تم حفظ التقييم بنجاح');
        setIsRatingModalOpen(false);
        setSelectedOrderId(null);
        setSelectedOrderRating(null);
        // Refresh data to show updated rating
        fetchData(currentPage);
      } else {
        const error = await response.json();
        showAlert('error', 'خطأ', `خطأ في حفظ التقييم: ${error.error || 'حدث خطأ'}`);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      showAlert('error', 'خطأ', 'حدث خطأ في حفظ التقييم');
    }
  };

  const exportedData = async () => {
    const query = new URLSearchParams({
      perPage: "1000",
      ...(nationality && { Nationality: nationality }),
      ...(contractType && { typeOfContract: contractType }),
    }).toString();
    const res = await fetch(`/api/endedorders?${query}`);
    if (!res.ok) throw new Error("Failed to fetch data");
    const data = await res.json();
    return data.homemaids;
  };

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
    doc.text("الطلبات المكتملة", 400, 10, { align: 'right', maxWidth: 700 });

    const tableColumn = [
      'التقييم',
      'مدة المعاملة',
      'المتبقي من الضمان',
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
        row.ratings?.[0]?.isRated ? 'تم التقييم' : row.isContractEnded ? 'لا' : 'تقييم',
        getTransactionDuration(row),
        getWarrantyDisplayText(row),
        row.HomeMaid?.Passportnumber || 'غير متوفر',
        row.HomeMaid?.office?.Country || row.HomeMaid?.Nationality || 'غير متوفر',
        row.HomeMaid?.Name || 'غير متوفر',
        row.HomeMaid?.id || row.HomemaidId || 'غير متوفر',
        row.client?.id || row.clientID || 'غير متوفر',
        row.client?.phonenumber || row.clientphonenumber || 'غير متوفر',
        row.client?.fullname || row.ClientName || 'غير متوفر',
        row.id || 'غير متوفر',
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
      },
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
          doc.text('الطلبات المكتملة', pageWidth / 2, 20, { align: 'right' });
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

    doc.save('ended_orders.pdf');
  };

  // Export to Excel
  const exportToExcel = async () => {
    let dataToExport = await exportedData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('الطلبات المكتملة', { properties: { defaultColWidth: 20 } });

    worksheet.columns = [
      { header: 'رقم الطلب', key: 'id', width: 15 },
      { header: 'اسم العميل', key: 'clientName', width: 20 },
      { header: 'جوال العميل', key: 'clientPhone', width: 15 },
      { header: 'هوية العميل', key: 'clientNationalId', width: 15 },
      { header: 'رقم العاملة', key: 'maidId', width: 15 },
      { header: 'اسم العاملة', key: 'maidName', width: 20 },
      { header: 'الجنسية', key: 'nationality', width: 15 },
      { header: 'رقم جواز السفر', key: 'passport', width: 15 },
      { header: 'المتبقي من الضمان', key: 'warranty', width: 20 },
      { header: 'مدة المعاملة', key: 'duration', width: 15 },
      { header: 'التقييم', key: 'rating', width: 15 },
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
      { header: 'المتبقي من الضمان', key: 'warranty', width: 20 },
      { header: 'مدة المعاملة', key: 'duration', width: 15 },
      { header: 'التقييم', key: 'rating', width: 10 }
    ];

    Array.isArray(dataToExport) &&
      dataToExport.forEach(row => {
        worksheet.addRow({
          id: row.id || 'غير متوفر',
          clientName: row.client?.fullname || row.ClientName || 'غير متوفر',
          clientPhone: row.client?.phonenumber || row.clientphonenumber || 'غير متوفر',
          clientNationalId: row.client?.id || row.clientID || 'غير متوفر',
          maidId: row.HomeMaid?.id || row.HomemaidId || 'غير متوفر',
          maidName: row.HomeMaid?.Name || 'غير متوفر',
          nationality: row.HomeMaid?.office?.Country || row.HomeMaid?.Nationality || 'غير متوفر',
          passport: row.HomeMaid?.Passportnumber || 'غير متوفر',
          warranty: getWarrantyDisplayText(row),
          duration: getTransactionDuration(row),
          rating: row.ratings?.[0]?.isRated ? 'تم التقييم' : row.isContractEnded ? 'لا' : 'تقييم',
        }).alignment = { horizontal: 'right' };
      });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ended_orders.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
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
          className={`px-2.5 py-1 border rounded text-sm ${
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
      <Head>
        <title>الطلبات المكتملة</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <section id="dashboard" className={`flex flex-row mx-auto min-h-screen ${Style["tajawal-regular"]}`} dir="rtl">
        <div className="flex-1 flex flex-col w-full">
          <main className="p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-normal text-black mb-6 text-right">
              الطلبات المكتملة
            </h1>
            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md">
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
                    طلبات الاستقدام <span className="text-sm align-super">{recruitmentCount}</span>
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
                    طلبات التأجير <span className="text-sm align-super">{rentalCount}</span>
                  </a>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={exportToPDF}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-900 text-white text-sm font-tajawal"
                  >
                    <DocumentDownloadIcon className="w-4 h-4" />
                    PDF
                  </button>
                  <button 
                    onClick={exportToExcel}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-900 text-white text-sm font-tajawal"
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
                  <div className="relative flex items-center bg-gray-50 border border-gray-300 rounded px-2.5 py-2 gap-10 text-sm text-gray-500 cursor-pointer min-w-[150px]">
                    <select
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-right appearance-none cursor-pointer"
                    >
                      <option value="">كل الجنسيات</option>
                      {nationalities.map((nat) => (
                        <option key={nat.id} value={nat.Country}>
                          {nat.Country}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-500 pointer-events-none flex-shrink-0" />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setNationality('');
                    setCurrentPage(1);
                  }}
                  className="bg-teal-900 text-white border-none rounded px-4 py-2 text-sm font-tajawal cursor-pointer"
                >
                  اعادة ضبط
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-teal-900">
                      {['#', 'اسم العميل', 'جوال العميل', 'هوية العميل', 'رقم العاملة', 'اسم العاملة', 'الجنسية', 'رقم جواز السفر', 'المتبقي من الضمان', 'مدة المعاملة', 'التقييم'].map((header) => (
                        <th key={header} className="text-white text-sm font-normal p-4 text-right whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((booking) => {
                      const warrantyText = getWarrantyDisplayText(booking);
                      return (
                      <tr key={booking.id} className="bg-gray-50 border-b border-gray-300 last:border-b-0">
                        <td className="p-4 text-sm text-gray-800 text-right cursor-pointer" onClick={() => router.push(`/admin/track_order/${booking.id}`)}>#{booking.id}</td>
                        <td className="p-4 text-sm text-gray-800 text-right whitespace-nowrap">{booking.client?.fullname || 'غير متوفر'}</td>
                        <td className="p-4 text-sm text-gray-800 text-right">{booking.client?.phonenumber || 'غير متوفر'}</td>
                        <td className="p-4 text-sm text-gray-800 text-right">{booking.client?.id || 'غير متوفر'}</td>
                        <td className="p-4 text-sm text-gray-800 text-right">{booking.HomeMaid?.id || 'غير متوفر'}</td>
                        <td className="p-4 text-sm text-gray-800 text-right whitespace-nowrap">{booking.HomeMaid?.Name || 'غير متوفر'}</td>
                        <td className="p-4 text-sm text-gray-800 text-right">{booking.HomeMaid?.Nationality || 'غير متوفر'}</td>
                        <td className="p-4 text-sm text-gray-800 text-right">{booking.HomeMaid?.Passportnumber || 'غير متوفر'}</td>
                        <td className={`p-4 text-sm text-right whitespace-nowrap font-medium ${getWarrantyColorClass(warrantyText)}`}>{warrantyText}</td>
                        <td className="p-4 text-sm text-gray-800 text-right">{getTransactionDuration(booking)}</td>
                        <td className="p-4 text-sm text-right">
                          <button
                            onClick={() => {
                              const existingRating = booking.ratings?.[0];
                              handleRatingClick(booking.id, existingRating ? {
                                isRated: existingRating.isRated,
                                reason: existingRating.reason || ''
                              } : undefined);
                            }}
                            className={`inline-block px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                              booking.ratings?.[0]?.isRated 
                                ? 'bg-teal-900 text-white hover:bg-teal-800' 
                                : booking.isContractEnded 
                                  ? 'text-red-600 hover:bg-red-50' 
                                  : 'text-teal-900 hover:bg-teal-50'
                            }`}
                          >
                            {booking.ratings?.[0]?.isRated ? 'تم التقييم' : booking.isContractEnded ? 'لا' : 'تقييم'}
                          </button>
                        </td>
                      </tr>
                    );
                    })}
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
                    className={`px-2.5 py-1 border rounded text-sm ${
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
                    className={`px-2.5 py-1 border rounded text-sm ${
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
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => {
          setIsRatingModalOpen(false);
          setSelectedOrderId(null);
          setSelectedOrderRating(null);
        }}
        onSubmit={handleRatingSubmit}
        orderId={selectedOrderId || undefined}
        initialData={selectedOrderRating || undefined}
      />
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
      />
    </Layout>
  );
}


export async function getServerSideProps ({ req }: { req: any }) {
  try {
    console.log("sss")
    // 🔹 Extract cookies
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie: string) => {
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
    const token = jwtDecode(cookies.authToken) as any;

    // 🔹 Fetch user & role with Prisma
    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });
    
    const permissions = findUser?.role?.permissions as any;
    console.log(permissions?.["إدارة الطلبات"])
    if (
      !findUser ||
      !permissions?.["إدارة الطلبات"]?.["عرض"]
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