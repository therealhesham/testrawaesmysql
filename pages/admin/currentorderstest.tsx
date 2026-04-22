import { useEffect, useState, useCallback, useRef } from 'react'; // أضف useCallback
import { useRouter } from 'next/router';
import { DocumentDownloadIcon, TableIcon } from '@heroicons/react/outline';
import { Search, ChevronDown, X, Columns } from 'lucide-react';
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css";
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import Head from 'next/head';
import ContractElapsedBadge, { formatElapsedSinceContractDate } from 'components/ContractElapsedBadge';

/** تاريخ العقد (من أول سجل وصول) بصيغة YYYY-MM-DD للعرض والعداد */
function contractDateIsoFromBooking(booking: any): string | null {
  const raw = booking?.arrivals?.[0]?.DateOfApplication ?? booking?.arrivals?.DateOfApplication;
  if (raw == null || raw === '') return null;
  const d = typeof raw === 'string' ? new Date(raw) : raw instanceof Date ? raw : new Date(String(raw));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

const ORDER_TABLE_COLUMNS_STORAGE = 'currentorderstest_table_columns_v1';

type OrderTableColKey =
  | 'orderId'
  | 'clientName'
  | 'clientPhone'
  | 'nationalId'
  | 'maidId'
  | 'maidName'
  | 'country'
  | 'passport'
  | 'musanedContract'
  | 'elapsedContract'
  | 'externalOffice'
  | 'status';

const ORDER_TABLE_COLUMNS: { key: OrderTableColKey; label: string; locked?: boolean }[] = [
  { key: 'orderId', label: 'رقم الطلب', locked: true },
  { key: 'clientName', label: 'اسم العميل' },
  { key: 'clientPhone', label: 'جوال العميل' },
  { key: 'nationalId', label: 'هوية العميل' },
  { key: 'maidId', label: 'رقم العاملة' },
  { key: 'maidName', label: 'اسم العاملة' },
  { key: 'country', label: 'الجنسية' },
  { key: 'passport', label: 'رقم جواز السفر' },
  { key: 'musanedContract', label: 'رقم عقد مساند' },
  { key: 'elapsedContract', label: 'مضى منذ تاريخ العقد' },
  { key: 'externalOffice', label: 'اسم المكتب الخارجي' },
  { key: 'status', label: 'حالة الطلب' },
];

const defaultOrderColumnVisibility = (): Record<OrderTableColKey, boolean> =>
  Object.fromEntries(ORDER_TABLE_COLUMNS.map((c) => [c.key, true])) as Record<OrderTableColKey, boolean>;

function mergeStoredColumnVisibility(raw: unknown): Record<OrderTableColKey, boolean> {
  const base = defaultOrderColumnVisibility();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, boolean>;
  for (const col of ORDER_TABLE_COLUMNS) {
    if (typeof o[col.key] === 'boolean') base[col.key] = o[col.key];
    if (col.locked) base[col.key] = true;
  }
  return base;
}

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
    'موافقة الربط مع إدارة المكاتب',
    'في انتظار الربط مع إدارة المكاتب',
    'موافقة المكتب الخارجي',
    'في انتظار المكتب الخارجي',
    'تم اجتياز الفحص الطبي',
    'في انتظار الفحص الطبي',
    'موافقة وزارة العمل الأجنبية',
    'في انتظار وزارة العمل الأجنبية',
    'تم دفع الوكالة',
    'في انتظار دفع الوكالة',
    'موافقة السفارة السعودية',
    'في انتظار السفارة السعودية',
    'تم إصدار التأشيرة',
    'في انتظار إصدار التأشيرة',
    'تم إصدار تصريح السفر',
    'في انتظار تصريح السفر',
    'تم الاستلام',
    'في انتظار الاستلام',
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
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientSuggestions, setClientSuggestions] = useState<any[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [orderColumnVisibility, setOrderColumnVisibility] =
    useState<Record<OrderTableColKey, boolean>>(defaultOrderColumnVisibility);
  const [orderColumnsMenuOpen, setOrderColumnsMenuOpen] = useState(false);
  const orderColumnsMenuRef = useRef<HTMLDivElement>(null);
  const skipNextOrderColumnSave = useRef(true);

  // دالة ترجمة حالة الطلب من الإنجليزية إلى العربية
  const translateBookingStatus = (status: string) => {
    const statusTranslations: { [key: string]: string } = {
      'pending': 'قيد الانتظار',
      'office_link_approved': 'موافقة الربط مع إدارة المكاتب',
      'pending_office_link': 'في انتظار الربط مع إدارة المكاتب',
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
      'موافقة الربط مع إدارة المكاتب': 'office_link_approved',
      'في انتظار الربط مع إدارة المكاتب': 'pending_office_link',
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
  const decoder = authToken ? jwtDecode(authToken) as any : null;
  setUserName(decoder?.username || '');
}, [userName]);
  // Auto search functions for clients
  const searchClients = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setClientSuggestions([]);
      setShowClientSuggestions(false);
      return;
    }
    
    // Search in the existing clients data
    const filteredClients = clients.filter((client: any) => 
      client.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phonenumber?.includes(searchTerm)
    );
    
    setClientSuggestions(filteredClients.slice(0, 10)); // Limit to 10 results
    setShowClientSuggestions(true);
  };

  // Handle client search input change
  const handleClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setClientSearchTerm(value);
    
    if (value.trim()) {
      searchClients(value);
    } else {
      setClientSuggestions([]);
      setShowClientSuggestions(false);
    }
  };

  // Handle client suggestion click
  const handleClientSuggestionClick = (client: any) => {
    setSelectedClient(client);
    setClientSearchTerm(client.fullname);
    setShowClientSuggestions(false);
  };

  // Handle input blur for suggestions
  const handleClientInputBlur = () => {
    setTimeout(() => {
      setShowClientSuggestions(false);
    }, 200);
  };

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/autocomplete/clients');
        const data = await response.json();
        if (data.data) {
          setClients(data.data);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };
    fetchClients();
  }, []);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.client-search-container')) {
        setShowClientSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ORDER_TABLE_COLUMNS_STORAGE);
      if (raw) setOrderColumnVisibility(mergeStoredColumnVisibility(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
    skipNextOrderColumnSave.current = true;
  }, []);

  useEffect(() => {
    if (skipNextOrderColumnSave.current) {
      skipNextOrderColumnSave.current = false;
      return;
    }
    try {
      localStorage.setItem(ORDER_TABLE_COLUMNS_STORAGE, JSON.stringify(orderColumnVisibility));
    } catch {
      /* ignore */
    }
  }, [orderColumnVisibility]);

  useEffect(() => {
    if (!orderColumnsMenuOpen) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t || !orderColumnsMenuRef.current) return;
      if (!orderColumnsMenuRef.current.contains(t)) setOrderColumnsMenuOpen(false);
    };
    // مرحلة الفقاعة: يُنفَّذ بعد النقر داخل القائمة (مع stopPropagation على القائمة) فلا تُغلق بالخطأ
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [orderColumnsMenuOpen]);

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
    page: "1",
    perPage: "50000",
    ...(searchTerm && { searchTerm }),
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
      'مضى منذ تاريخ العقد',
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
      ? dataToExport.map((row) => {
          const elapsed = formatElapsedSinceContractDate(contractDateIsoFromBooking(row));
          const elapsedCell = elapsed ? `مضى ${elapsed}` : '—';
          return [
            truncateToTwoWords(translateBookingStatus(row.bookingstatus) || 'غير متوفر'),
            truncateToTwoWords(row.HomeMaid?.office?.office || 'غير متوفر'),
            truncateToTwoWords(row.arrivals?.[0]?.InternalmusanedContract || row.arrivals?.InternalmusanedContract || 'غير متوفر'),
            elapsedCell,
            truncateToTwoWords(row.HomeMaid?.Passportnumber || 'غير متوفر'),
            truncateToTwoWords(row.HomeMaid?.office?.Country || 'غير متوفر'),
            truncateToTwoWords(row.HomeMaid?.Name || 'غير متوفر'),
            truncateToTwoWords(String(row.HomeMaid?.id || 'غير متوفر')),
            truncateToTwoWords(row.client?.nationalId || 'غير متوفر'),
            truncateToTwoWords(row.client?.phonenumber || 'غير متوفر'),
            truncateToTwoWords(row.client?.fullname || 'غير متوفر'),
            truncateToTwoWords(String(row.id || 'غير متوفر')),
          ];
        })
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
      columnStyles: Object.fromEntries(
        Array.from({ length: 12 }, (_, i) => [i, { cellWidth: 'auto' as const, overflow: 'hidden' as const }])
      ),
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
      { header: 'مضى منذ تاريخ العقد', key: 'elapsedSinceContract', width: 28 },
      { header: 'اسم المكتب الخارجي', key: 'office', width: 15 },
      { header: 'حالة الطلب', key: 'status', width: 10 }
    ];

    Array.isArray(dataToExport) &&
      dataToExport.forEach((row) => {
        const elapsed = formatElapsedSinceContractDate(contractDateIsoFromBooking(row));
        worksheet
          .addRow({
            id: row.id || 'غير متوفر',
            clientName: row.client?.fullname || 'غير متوفر',
            clientPhone: row.client?.phonenumber || 'غير متوفر',
            clientNationalId: row.client?.nationalId || 'غير متوفر',
            maidId: row.HomeMaid?.id || 'غير متوفر',
            maidName: row.HomeMaid?.Name || 'غير متوفر',
            nationality: row.HomeMaid?.office?.Country || 'غير متوفر',
            passport: row.HomeMaid?.Passportnumber || 'غير متوفر',
            contract: row.arrivals?.[0]?.InternalmusanedContract || row.arrivals?.InternalmusanedContract || 'غير متوفر',
            elapsedSinceContract: elapsed ? `مضى ${elapsed}` : '—',
            office: row.HomeMaid?.office?.office || 'غير متوفر',
            status: translateBookingStatus(row.bookingstatus) || 'غير متوفر',
          })
          .alignment = { horizontal: 'right' };
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
    setActivePopup(null);
    setSelectedClient(null);
    setClientSearchTerm('');
    setClientSuggestions([]);
    setShowClientSuggestions(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setActivePopup(null);
    setSelectedClient(null);
    setClientSearchTerm('');
    setClientSuggestions([]);
    setShowClientSuggestions(false);
    // Optionally refetch data if a new rental order might affect the list
    fetchData(currentPage);
  };

  const openPopup = (popupId: string) => setActivePopup(popupId);
  const closePopup = () => {
    setActivePopup(null);
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

  const visibleOrderTableColumns = ORDER_TABLE_COLUMNS.filter((c) => orderColumnVisibility[c.key]);
  const visibleOrderColumnCount = Math.max(visibleOrderTableColumns.length, 1);

  const toggleOrderTableColumn = (key: OrderTableColKey) => {
    const def = ORDER_TABLE_COLUMNS.find((c) => c.key === key);
    if (def?.locked) return;
    setOrderColumnVisibility((prev) => {
      if (!prev[key]) return { ...prev, [key]: true };
      const next = { ...prev, [key]: false };
      const visible = ORDER_TABLE_COLUMNS.filter((c) => next[c.key]).length;
      if (visible < 1) return prev;
      return next;
    });
  };

  const resetOrderTableColumns = () => {
    setOrderColumnVisibility(defaultOrderColumnVisibility());
    skipNextOrderColumnSave.current = false;
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
              <div className="mb-6 flex flex-col gap-3">
                <div className="flex w-full flex-row flex-nowrap items-center gap-3">
                  <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-3 overflow-x-auto py-1 [scrollbar-width:thin]">
                    <div className="flex shrink-0 items-center bg-gray-50 border border-gray-300 rounded gap-4">
                      <input
                        type="text"
                        placeholder="بحث"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="min-w-[120px] border-none bg-transparent text-md text-gray-500 text-right"
                      />
                      <Search className="w-4 h-4 shrink-0 text-gray-500" />
                    </div>
                    <div className="relative shrink-0">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="flex max-w-[min(100vw-8rem,14rem)] items-center bg-gray-50 border border-gray-300 rounded gap-10 text-md text-gray-500 cursor-pointer text-right"
                      >
                        <option value="">حالة الطلب</option>
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex shrink-0 flex-nowrap items-center gap-3">
                      <div className="relative">
                        <select
                          value={nationality}
                          onChange={(e) => setNationality(e.target.value)}
                          className="flex max-w-[min(100vw-8rem,12rem)] items-center bg-gray-50 border border-gray-300 rounded gap-10 text-md text-gray-500 cursor-pointer appearance-none text-right"
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
                          className="flex max-w-[min(100vw-8rem,12rem)] items-center bg-gray-50 border border-gray-300 rounded gap-10 text-md text-gray-500 cursor-pointer appearance-none text-right"
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
                  </div>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="shrink-0 bg-teal-900 text-white border-none rounded px-4 py-2 text-md font-tajawal cursor-pointer"
                  >
                    إعادة ضبط
                  </button>
                </div>
                <div className="flex w-full justify-end">
                  <div
                    className="relative"
                    ref={orderColumnsMenuRef}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOrderColumnsMenuOpen((o) => !o);
                      }}
                      className="flex items-center gap-1.5 bg-white border border-gray-300 text-teal-900 rounded px-3 py-2 text-md font-tajawal hover:bg-gray-50"
                      aria-expanded={orderColumnsMenuOpen}
                      aria-haspopup="true"
                    >
                      <Columns className="w-4 h-4 shrink-0" aria-hidden />
                      أعمدة الجدول
                      <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${orderColumnsMenuOpen ? 'rotate-180' : ''}`} aria-hidden />
                    </button>
                    {orderColumnsMenuOpen && (
                      <div
                        className="absolute right-0 top-full z-[100] mt-1 min-w-[260px] max-h-[70vh] overflow-y-auto rounded-md border border-gray-200 bg-white py-2 shadow-lg"
                        dir="rtl"
                        role="menu"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-3 pb-2 border-b border-gray-100 flex justify-between items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">إظهار الأعمدة</span>
                          <button
                            type="button"
                            className="text-xs text-teal-800 hover:underline shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              resetOrderTableColumns();
                            }}
                          >
                            إظهار الكل
                          </button>
                        </div>
                        <ul className="py-1">
                          {ORDER_TABLE_COLUMNS.map((col) => (
                            <li key={col.key} className="px-3 py-1.5 hover:bg-gray-50">
                              <label
                                className="flex items-center gap-2 cursor-pointer text-sm text-gray-800"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-teal-900 focus:ring-teal-800"
                                  checked={orderColumnVisibility[col.key]}
                                  disabled={!!col.locked}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleOrderTableColumn(col.key);
                                  }}
                                />
                                <span className="flex-1 text-right">{col.label}</span>
                                {col.locked && (
                                  <span className="text-[10px] text-gray-400 shrink-0">ثابت</span>
                                )}
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
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
                        {visibleOrderTableColumns.map((col) => (
                          <th
                            key={col.key}
                            className="text-white text-md font-normal p-4 text-right whitespace-nowrap"
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.length > 0 ? (
                        data.map((booking) => {
                          const contractIso = contractDateIsoFromBooking(booking);
                          return (
                            <tr key={booking.id} className="bg-gray-50 border-b border-gray-300 last:border-b-0">
                              {visibleOrderTableColumns.map((col) => {
                                switch (col.key) {
                                  case 'orderId':
                                    return (
                                      <td
                                        key={col.key}
                                        className="p-4 text-md text-gray-800 text-right cursor-pointer"
                                        onClick={() => handleOrderClick(booking.id)}
                                      >
                                        #{booking.id}
                                      </td>
                                    );
                                  case 'clientName':
                                    return (
                                      <td key={col.key} className="p-4 text-md text-gray-800 text-right">
                                        {booking.client?.fullname || 'غير متوفر'}
                                      </td>
                                    );
                                  case 'clientPhone':
                                    return (
                                      <td key={col.key} className="p-4 text-md text-gray-800 text-right">
                                        {booking.client?.phonenumber || 'غير متوفر'}
                                      </td>
                                    );
                                  case 'nationalId':
                                    return (
                                      <td key={col.key} className="p-4 text-md text-gray-800 text-right">
                                        {booking.client?.nationalId || 'غير متوفر'}
                                      </td>
                                    );
                                  case 'maidId':
                                    return (
                                      <td key={col.key} className="p-4 text-md text-gray-800 text-right">
                                        {booking.HomeMaid?.id || 'غير متوفر'}
                                      </td>
                                    );
                                  case 'maidName':
                                    return (
                                      <td key={col.key} className="p-4 text-md text-gray-800 text-right">
                                        {booking.HomeMaid?.Name || 'غير متوفر'}
                                      </td>
                                    );
                                  case 'country':
                                    return (
                                      <td key={col.key} className="p-4 text-md text-gray-800 text-right">
                                        {booking.HomeMaid?.office?.Country || 'غير متوفر'}
                                      </td>
                                    );
                                  case 'passport':
                                    return (
                                      <td key={col.key} className="p-4 text-md text-gray-800 text-right">
                                        {booking.HomeMaid?.Passportnumber || 'غير متوفر'}
                                      </td>
                                    );
                                  case 'musanedContract':
                                    return (
                                      <td key={col.key} className="p-4 text-md text-gray-800 text-right">
                                        {booking.arrivals[0]?.InternalmusanedContract || 'غير متوفر'}
                                      </td>
                                    );
                                  case 'elapsedContract':
                                    return (
                                      <td key={col.key} className="p-4 text-md text-gray-700 text-right">
                                        {contractIso ? (
                                          <ContractElapsedBadge contractDate={contractIso} />
                                        ) : (
                                          <span className="text-gray-500">—</span>
                                        )}
                                      </td>
                                    );
                                  case 'externalOffice':
                                    return (
                                      <td key={col.key} className="p-4 text-md text-gray-800 text-right">
                                        {booking.HomeMaid?.office?.office || 'غير متوفر'}
                                      </td>
                                    );
                                  case 'status':
                                    return (
                                      <td key={col.key} className="p-4 text-md text-gray-800 text-right">
                                        {translateBookingStatus(booking.bookingstatus) || 'غير متوفر'}
                                      </td>
                                    );
                                  default:
                                    return null;
                                }
                              })}
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={visibleOrderColumnCount} className="p-8 text-center text-gray-500">
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
          {!activePopup ? (
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md text-center relative p-6">
              <button
                className="absolute top-2 left-2 text-gray-600 hover:text-gray-800"
                onClick={handleCloseModal}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col gap-3 w-full">
                <p className="text-base font-medium">تحقق من العميل</p>
                <p className="text-sm text-gray-600">هل العميل موجود مسبقاً؟</p>

                <div className="relative client-search-container">
                  <input
                    type="text"
                    autoFocus
                    value={clientSearchTerm}
                    onChange={handleClientSearchChange}
                    onBlur={handleClientInputBlur}
                    placeholder="ابحث عن العميل بالاسم أو رقم الهاتف"
                    className="w-full p-3 border border-gray-300 rounded-md text-right bg-gray-50"
                  />
                  
                  {/* Client Search Results Dropdown */}
                  {showClientSuggestions && clientSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {clientSuggestions.map((client, index) => (
                        <div
                          key={index}
                          onClick={() => handleClientSuggestionClick(client)}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                        >
                          <div className="font-medium text-md">{client.fullname}</div>
                          <div className="text-sm text-gray-500">{client.phonenumber} - {client.city || ''}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-row gap-2">
                  <button 
                    onClick={() => router.push("/admin/clients")} 
                    className="bg-teal-900 text-white px-4 py-2 rounded w-full hover:bg-teal-800 transition duration-200"
                  >
                    عميل جديد
                  </button>
                  <button
                    className="bg-teal-900 text-white px-4 py-2 rounded w-full hover:bg-teal-800 transition duration-200"
                    onClick={() => {
                      router.push(`/admin/rentalform?clientId=${selectedClient?.id}`);
                    }}
                    disabled={!selectedClient}
                  >
                    متابعة طلب تأجير
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 p-8 rounded-xl shadow-2xl w-120 text-center transform transition-all duration-300 ease-in-out relative">
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                onClick={() => {
                  closePopup();
                  setSelectedClient(null);
                  setClientSearchTerm('');
                }}
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold mb-4 text-teal-900">اختيار نوع الطلب</h2>
              <p className="text-gray-600 mb-6">هل تريد اختيار من العاملات المتاحات أو حسب المواصفات؟</p>
              {selectedClient && (
                <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">العميل المختار:</p>
                  <p className="font-medium">{selectedClient.fullname}</p>
                  <p className="text-sm text-gray-500">{selectedClient.phonenumber} - {selectedClient.city || ''}</p>
                </div>
              )}
              <div className="flex justify-center gap-4">
                <button
                  className="bg-gray-100 text-gray-800 border-2 border-teal-800 px-6 py-3 rounded-lg hover:bg-gray-200 transition duration-200 text-base font-medium"
                  onClick={() => {
                    closePopup();
                    handleCloseModal();
                    const clientData = selectedClient ? `&clientId=${selectedClient.id}&clientName=${encodeURIComponent(selectedClient.fullname)}&clientPhone=${selectedClient.phonenumber}&clientCity=${selectedClient.city || ''}&contractType=rental` : '&contractType=rental';
                    router.push(`/admin/order-form?type=add-specs${clientData}`);
                  }}
                >
                  حسب المواصفات
                </button>
                <button
                  className="bg-teal-900 text-white px-6 py-3 rounded-lg hover:bg-teal-800 transition duration-200 text-base font-medium"
                  onClick={() => {
                    closePopup();
                    handleCloseModal();
                    const clientData = selectedClient ? `&clientId=${selectedClient.id}&clientName=${encodeURIComponent(selectedClient.fullname)}&clientPhone=${selectedClient.phonenumber}&clientCity=${selectedClient.city || ''}&contractType=rental` : '&contractType=rental';
                    router.push(`/admin/order-form?type=add-available${clientData}`);
                  }}
                >
                  قائمة العاملات المتاحة
                </button>
              </div>
            </div>
          )}
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

/** Next.js يتطلب JSON فقط في getStaticProps — تحويل حقول Date من Prisma إلى نصوص */
function serializeOrdersForStaticProps(orders: any[]) {
  return orders.map((order) => ({
    ...order,
    arrivals: Array.isArray(order.arrivals)
      ? order.arrivals.map((a: any) => ({
          ...a,
          DateOfApplication:
            a?.DateOfApplication == null
              ? null
              : typeof a.DateOfApplication === 'string'
                ? a.DateOfApplication
                : new Date(a.DateOfApplication as Date).toISOString(),
        }))
      : order.arrivals,
  }));
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
        arrivals: { select: { InternalmusanedContract: true, DateOfApplication: true } },
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
        arrivals: { select: { InternalmusanedContract: true, DateOfApplication: true } },
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
        recruitmentData: serializeOrdersForStaticProps(recruitmentOrders),
        rentalData: serializeOrdersForStaticProps(rentalOrders),
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