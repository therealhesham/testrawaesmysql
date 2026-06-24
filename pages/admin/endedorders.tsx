import { useEffect, useState } from 'react';
import { DocumentDownloadIcon, TableIcon } from '@heroicons/react/outline';
import { Search, ChevronDown, Phone, CreditCard, Book, Hash, Star, RefreshCw } from 'lucide-react';
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
  stars?: number | null;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingStatus, setRatingStatus] = useState('all');
  const [starsCount, setStarsCount] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [warrantyStatus, setWarrantyStatus] = useState('all');
  const [nationalities, setNationalities] = useState<{ id: number; Country: string }[]>([]);
  const [userName, setUserName] = useState('');
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrderRating, setSelectedOrderRating] = useState<{ isRated: boolean; reason: string; stars?: number | null } | null>(null);
  
  const [isWarrantyDropdownOpen, setIsWarrantyDropdownOpen] = useState(false);
  const [warrantyCoords, setWarrantyCoords] = useState<{ top: number; left: number } | null>(null);
  
  const [isRatingDropdownOpen, setIsRatingDropdownOpen] = useState(false);
  const [ratingCoords, setRatingCoords] = useState<{ top: number; left: number } | null>(null);
  
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => setIsMounted(true), []);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#warranty-filter-dropdown') && !target.closest('button[title="تصفية حسب الضمان"]')) {
        setIsWarrantyDropdownOpen(false);
      }
      if (!target.closest('#rating-filter-dropdown') && !target.closest('button[title="تصفية حسب التقييم"]')) {
        setIsRatingDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleWarrantyDropdownToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isWarrantyDropdownOpen) {
      setIsWarrantyDropdownOpen(false);
    } else {
      setIsRatingDropdownOpen(false);
      const trigger = e.currentTarget;
      const container = document.getElementById("table-container");
      if (container) {
        let el: HTMLElement | null = trigger;
        let left = 0;
        let top = 0;
        while (el && el !== container) {
          left += el.offsetLeft;
          top += el.offsetTop;
          el = el.offsetParent as HTMLElement | null;
        }
        left = Math.max(8, left + trigger.offsetWidth - 144);
        top = top + trigger.offsetHeight + 8;
        setWarrantyCoords({ top, left });
      }
      setIsWarrantyDropdownOpen(true);
    }
  };

  const handleRatingDropdownToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isRatingDropdownOpen) {
      setIsRatingDropdownOpen(false);
    } else {
      setIsWarrantyDropdownOpen(false);
      const trigger = e.currentTarget;
      const container = document.getElementById("table-container");
      if (container) {
        let el: HTMLElement | null = trigger;
        let left = 0;
        let top = 0;
        while (el && el !== container) {
          left += el.offsetLeft;
          top += el.offsetTop;
          el = el.offsetParent as HTMLElement | null;
        }
        left = Math.max(8, left + trigger.offsetWidth - 144);
        top = top + trigger.offsetHeight + 8;
        setRatingCoords({ top, left });
      }
      setIsRatingDropdownOpen(true);
    }
  };
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
      if (searchTerm) {
        url.searchParams.set('searchTerm', searchTerm);
      }
      if (ratingStatus !== 'all') url.searchParams.set('ratingStatus', ratingStatus);
      if (starsCount !== 'all') url.searchParams.set('starsCount', starsCount);
      if (fromDate) url.searchParams.set('fromDate', fromDate);
      if (toDate) url.searchParams.set('toDate', toDate);
      if (warrantyStatus !== 'all') url.searchParams.set('warrantyStatus', warrantyStatus);
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
      const buildUrl = (type: string) => {
        const url = new URL(`/api/endedorders`, window.location.origin);
        url.searchParams.set('page', '1');
        url.searchParams.set('typeOfContract', type);
        if (nationality) url.searchParams.set('Nationality', nationality);
        if (searchTerm) url.searchParams.set('searchTerm', searchTerm);
        if (ratingStatus !== 'all') url.searchParams.set('ratingStatus', ratingStatus);
        if (starsCount !== 'all') url.searchParams.set('starsCount', starsCount);
        if (fromDate) url.searchParams.set('fromDate', fromDate);
        if (toDate) url.searchParams.set('toDate', toDate);
        if (warrantyStatus !== 'all') url.searchParams.set('warrantyStatus', warrantyStatus);
        return url.toString();
      };

      const [recruitmentRes, rentalRes] = await Promise.all([
        fetch(buildUrl('recruitment'), { signal }),
        fetch(buildUrl('rental'), { signal })
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
  }, [contractType, nationality, searchTerm, ratingStatus, starsCount, fromDate, toDate, warrantyStatus]);

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

  const handleRatingClick = (orderId: number, existingRating?: { isRated: boolean; reason: string; stars?: number | null }) => {
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
      ...(searchTerm && { searchTerm }),
      ...(contractType && { typeOfContract: contractType }),
      ...(ratingStatus !== 'all' && { ratingStatus }),
      ...(starsCount !== 'all' && { starsCount }),
      ...(fromDate && { fromDate }),
      ...(toDate && { toDate }),
      ...(warrantyStatus !== 'all' && { warrantyStatus }),
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
      { header: 'حالة الضمان', key: 'warranty', width: 20 },
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
      { header: 'حالة الضمان', key: 'warranty', width: 20 },
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
                <div className="flex flex-wrap items-center gap-2.5 justify-start flex-grow">
                  
                  {/* Search */}
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex-grow min-w-[200px] max-w-[300px] focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-700/10 transition-all shadow-sm">
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="بحث"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs text-gray-800 placeholder-gray-400 w-full font-medium"
                    />
                  </div>

                  {/* Nationality */}
                  <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl w-full md:w-36 focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-700/10 transition-all shadow-sm">
                    <select
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs text-gray-700 w-full cursor-pointer font-medium py-2.5 pr-3 pl-8 text-right"
                      style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', backgroundImage: 'none' }}
                      dir="rtl"
                    >
                      <option value="">كل الجنسيات</option>
                      {nationalities.map((nat) => (
                        <option key={nat.id} value={nat.Country}>
                          {nat.Country}
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-3 pointer-events-none text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>

                  {/* Date From */}
                  <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2.5 w-full md:w-36 focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-700/10 transition-all shadow-sm">
                    <span className="text-xs text-gray-400 font-bold whitespace-nowrap">من:</span>
                    <input
                      type={fromDate ? "date" : "text"}
                      placeholder="سنة / شهر / يوم"
                      onFocus={(e) => (e.target.type = 'date')}
                      onBlur={(e) => {
                        if (!e.target.value) e.target.type = 'text';
                      }}
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs text-gray-700 w-full cursor-pointer font-medium p-0"
                    />
                  </div>

                  {/* Date To */}
                  <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2.5 w-full md:w-36 focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-700/10 transition-all shadow-sm">
                    <span className="text-xs text-gray-400 font-bold whitespace-nowrap">إلى:</span>
                    <input
                      type={toDate ? "date" : "text"}
                      placeholder="سنة / شهر / يوم"
                      onFocus={(e) => (e.target.type = 'date')}
                      onBlur={(e) => {
                        if (!e.target.value) e.target.type = 'text';
                      }}
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs text-gray-700 w-full cursor-pointer font-medium p-0"
                    />
                  </div>

                </div>
                <button 
                  onClick={() => {
                    setNationality('');
                    setSearchTerm('');
                    setRatingStatus('all');
                    setStarsCount('all');
                    setFromDate('');
                    setToDate('');
                    setWarrantyStatus('all');
                    setCurrentPage(1);
                  }}
                  title="إلغاء الفلتر"
                  className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl w-[42px] h-[42px] flex-shrink-0 hover:bg-gray-100 transition-colors shadow-sm cursor-pointer"
                >
                  <RefreshCw className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="overflow-x-auto relative min-h-[450px]" id="table-container">
                <table className="w-full border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-teal-900">
                      <th className="text-white text-sm font-medium p-4 whitespace-nowrap text-right">
                        رقم الطلب
                      </th>
                      <th className="text-white text-sm font-medium p-4 whitespace-nowrap text-right">
                        بيانات العميل
                      </th>
                      <th className="text-white text-sm font-medium p-4 whitespace-nowrap text-right">
                        بيانات العاملة
                      </th>
                      <th className="text-white text-sm font-medium p-4 whitespace-nowrap text-right relative">
                        <div className="flex items-center gap-1.5 justify-start">
                          <span>حالة الضمان</span>
                          <button
                            onClick={handleWarrantyDropdownToggle}
                            className={`p-1 rounded hover:bg-teal-800 transition-colors flex items-center justify-center ${warrantyStatus !== 'all' ? 'text-amber-400 font-bold' : 'text-teal-200 hover:text-white'}`}
                            title="تصفية حسب الضمان"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18m-2 0v2.286a2 2 0 0 1-.586 1.414l-5.828 5.828a2 2 0 0 0-.586 1.414v4.556a1 1 0 0 1-1.447.894l-2-1a1 1 0 0 1-.553-.894v-3.556a2 2 0 0 0-.586-1.414L3.586 8.2a2 2 0 0 1-.586-1.414V4.5z" />
                            </svg>
                          </button>
                        </div>
                      </th>
                      <th className="text-white text-sm font-medium p-4 whitespace-nowrap text-right">
                        مدة المعاملة
                      </th>
                      <th className="text-white text-sm font-medium p-4 whitespace-nowrap text-center relative">
                        <div className="flex items-center gap-1.5 justify-center">
                          <span>التقييم</span>
                          <button
                            onClick={handleRatingDropdownToggle}
                            className={`p-1 rounded hover:bg-teal-800 transition-colors flex items-center justify-center ${ratingStatus !== 'all' || starsCount !== 'all' ? 'text-amber-400 font-bold' : 'text-teal-200 hover:text-white'}`}
                            title="تصفية حسب التقييم"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18m-2 0v2.286a2 2 0 0 1-.586 1.414l-5.828 5.828a2 2 0 0 0-.586 1.414v4.556a1 1 0 0 1-1.447.894l-2-1a1 1 0 0 1-.553-.894v-3.556a2 2 0 0 0-.586-1.414L3.586 8.2a2 2 0 0 1-.586-1.414V4.5z" />
                            </svg>
                          </button>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((booking) => {
                      const warrantyText = getWarrantyDisplayText(booking);
                      return (
                      <tr key={booking.id} className="bg-gray-50 border-b border-gray-300 last:border-b-0">
                        <td className="p-4 text-md text-gray-800 text-right">
                          <span className="font-medium text-gray-600 hover:text-teal-700 cursor-pointer" onClick={() => router.push(`/admin/track_order/${booking.id}`)}>
                            #{booking.id}
                          </span>
                        </td>
                        <td className="p-4 text-md text-gray-800 text-right">
                          <div className="font-medium whitespace-nowrap">
                            <span className="cursor-pointer hover:text-teal-700 transition-colors hover:underline" onClick={() => booking.client?.id && router.push(`/admin/clientdetails?id=${booking.client.id}`)}>
                              {booking.client?.fullname || 'غير متوفر'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1 flex flex-nowrap gap-2 items-center whitespace-nowrap">
                            <span className="flex items-center gap-1" title="رقم الجوال"><Phone className="w-3.5 h-3.5 text-gray-400" />{booking.client?.phonenumber || 'غير متوفر'}</span>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-1" title="الهوية الوطنية"><CreditCard className="w-3.5 h-3.5 text-gray-400" />{booking.client?.nationalId || booking.client?.id || 'غير متوفر'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-md text-gray-800 text-right">
                          <div className="font-medium whitespace-nowrap flex items-center gap-2">
                            <span className="cursor-pointer hover:text-teal-700 transition-colors hover:underline" onClick={() => booking.HomeMaid?.id && router.push(`/admin/homemaidinfo?id=${booking.HomeMaid.id}`)}>
                              {booking.HomeMaid?.Name || 'غير متوفر'}
                            </span>
                            <span className="text-gray-400 font-normal text-sm flex items-center gap-0.5" title="رقم العاملة">
                              <Hash className="w-3 h-3" />{booking.HomeMaid?.id || 'غير متوفر'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1 flex flex-nowrap gap-2 items-center whitespace-nowrap">
                            <span>{booking.HomeMaid?.office?.Country || booking.HomeMaid?.Nationality || 'غير متوفر'}</span>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-1" title="رقم جواز السفر"><Book className="w-3.5 h-3.5 text-gray-400" />{booking.HomeMaid?.Passportnumber || 'غير متوفر'}</span>
                          </div>
                        </td>
                        <td className={`p-4 text-sm text-right whitespace-nowrap font-medium ${getWarrantyColorClass(warrantyText)}`}>{warrantyText}</td>
                        <td className="p-4 text-sm text-gray-800 text-right">{getTransactionDuration(booking)}</td>
                        <td className="p-4 text-sm text-center">
                          <div 
                            className="flex cursor-pointer gap-1 justify-center"
                            onClick={() => {
                              const existingRating = booking.ratings?.[0];
                              handleRatingClick(booking.id, existingRating ? {
                                isRated: existingRating.isRated,
                                reason: existingRating.reason || '',
                                stars: existingRating.stars
                              } : undefined);
                            }}
                            title="عرض تفاصيل التقييم"
                          >
                            {[1, 2, 3, 4, 5].map((starIndex) => {
                              const ratingStars = booking.ratings?.[0]?.stars || 0;
                              const isFilled = starIndex <= ratingStars;
                              return (
                                <Star
                                  key={starIndex}
                                  className={`w-5 h-5 transition-colors ${isFilled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                />
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
                
                {/* Popovers for Filters */}
                {isMounted && isWarrantyDropdownOpen && warrantyCoords && (
                  <div 
                    id="warranty-filter-dropdown"
                    dir="rtl"
                    style={{ 
                      position: 'absolute', 
                      top: `${warrantyCoords.top}px`, 
                      left: `${warrantyCoords.left}px`,
                      width: '144px',
                      zIndex: 9999
                    }}
                    className="bg-white border border-gray-150 rounded-2xl shadow-xl py-2 text-right animate-in fade-in slide-in-from-top-2 duration-200 text-gray-700 font-medium tracking-normal"
                  >
                    <div className="max-h-60 overflow-y-auto">
                      <div className="px-5 py-2 text-xs font-bold text-gray-400 border-b border-gray-50 mb-1">حالة الضمان</div>
                      <button
                        onClick={() => { setWarrantyStatus('all'); setIsWarrantyDropdownOpen(false); setCurrentPage(1); }}
                        className={`w-full text-right px-5 py-2.5 hover:bg-gray-50 text-sm font-medium transition-colors duration-150 ${warrantyStatus === 'all' ? 'text-teal-700 bg-gray-50/50' : 'text-gray-600'}`}
                      >
                        الكل
                      </button>
                      <button
                        onClick={() => { setWarrantyStatus('valid'); setIsWarrantyDropdownOpen(false); setCurrentPage(1); }}
                        className={`w-full text-right px-5 py-2.5 hover:bg-gray-50 text-sm font-medium transition-colors duration-150 ${warrantyStatus === 'valid' ? 'text-teal-700 bg-gray-50/50' : 'text-gray-600'}`}
                      >
                        ساري
                      </button>
                      <button
                        onClick={() => { setWarrantyStatus('expired'); setIsWarrantyDropdownOpen(false); setCurrentPage(1); }}
                        className={`w-full text-right px-5 py-2.5 hover:bg-gray-50 text-sm font-medium transition-colors duration-150 ${warrantyStatus === 'expired' ? 'text-teal-700 bg-gray-50/50' : 'text-gray-600'}`}
                      >
                        منتهي
                      </button>
                    </div>
                  </div>
                )}

                {isMounted && isRatingDropdownOpen && ratingCoords && (
                  <div 
                    id="rating-filter-dropdown"
                    dir="rtl"
                    style={{ 
                      position: 'absolute', 
                      top: `${ratingCoords.top}px`, 
                      left: `${ratingCoords.left}px`,
                      width: '144px',
                      zIndex: 9999
                    }}
                    className="bg-white border border-gray-150 rounded-2xl shadow-xl py-2 text-right animate-in fade-in slide-in-from-top-2 duration-200 text-gray-700 font-medium tracking-normal"
                  >
                    <div className="max-h-60 overflow-y-auto">
                      <div className="px-5 py-2 text-xs font-bold text-gray-400 border-b border-gray-50 mb-1">حالة التقييم</div>
                      <button
                        onClick={() => { setRatingStatus('all'); setStarsCount('all'); setIsRatingDropdownOpen(false); setCurrentPage(1); }}
                        className={`w-full text-right px-5 py-2.5 hover:bg-gray-50 text-sm font-medium transition-colors duration-150 ${ratingStatus === 'all' ? 'text-teal-700 bg-gray-50/50' : 'text-gray-600'}`}
                      >
                        الكل
                      </button>
                      <button
                        onClick={() => { setRatingStatus('rated'); }}
                        className={`w-full text-right px-5 py-2.5 hover:bg-gray-50 text-sm font-medium transition-colors duration-150 flex items-center justify-between ${ratingStatus === 'rated' ? 'text-teal-700 bg-gray-50/50' : 'text-gray-600'}`}
                      >
                        <span>مقيّم</span>
                        {ratingStatus === 'rated' && <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>
                      <button
                        onClick={() => { setRatingStatus('unrated'); setStarsCount('all'); setIsRatingDropdownOpen(false); setCurrentPage(1); }}
                        className={`w-full text-right px-5 py-2.5 hover:bg-gray-50 text-sm font-medium transition-colors duration-150 ${ratingStatus === 'unrated' ? 'text-teal-700 bg-gray-50/50' : 'text-gray-600'}`}
                      >
                        غير مقيّم
                      </button>

                      {ratingStatus === 'rated' && (
                        <>
                          <div className="px-5 py-2 text-xs font-bold text-gray-400 border-y border-gray-50 mt-1 mb-1">عدد النجوم</div>
                          <button
                            onClick={() => { setStarsCount('all'); setIsRatingDropdownOpen(false); setCurrentPage(1); }}
                            className={`w-full text-right px-5 py-2 hover:bg-gray-50 text-sm font-medium transition-colors duration-150 ${starsCount === 'all' ? 'text-teal-700 bg-gray-50/50' : 'text-gray-600'}`}
                          >
                            كل النجوم
                          </button>
                          {[5, 4, 3, 2, 1].map((stars) => (
                            <button
                              key={stars}
                              onClick={() => { setStarsCount(stars.toString()); setIsRatingDropdownOpen(false); setCurrentPage(1); }}
                              className={`w-full px-5 py-1.5 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-1 justify-start ${starsCount === stars.toString() ? 'bg-gray-50/50' : ''}`}
                            >
                              <div className="flex gap-0.5">
                                {[...Array(stars)].map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
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