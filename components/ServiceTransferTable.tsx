// ServiceTransferTable.tsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { FileExcelOutlined } from '@ant-design/icons';
import {
  Plus,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Eye,
  Edit,
  Repeat,
  CheckCircle,
  Clock,
  X,
  Layers,
  UserCheck,
  Calendar,
  Filter,
  Check,
  ArrowRight,
  UserX,
  AlertTriangle,
  Trash2,
  Info,
} from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import { formatSaudiCity } from 'lib/cityHelper';
import FailTrialModal from './FailTrialModal';

interface Transfer {
  id: number;
  HomeMaidId?: number;
  NewClientId?: number;
  OldClientId?: number;
  HomeMaid: { id?: number; Name: string; Passportnumber: string; Nationalitycopy?: string; Nationality?: string };
  NewClient: { id?: number; fullname: string; city?: string; phonenumber?: string; alternativePhone?: string; nationalId?: string; dateofbirth?: string };
  OldClient: { id?: number; fullname: string; city?: string; phonenumber?: string; nationalId?: string; alternativePhone?: string };
  transferStage?: string;
  ExperimentRate?: string;
  ExperimentDuration?: string;
  ExperimentStart?: string;
  ExperimentEnd?: string;
  TransferingDate?: string;
  ContractDate?: string;
  createdAt?: string;
  Cost?: number | string | null;
  Paid?: number | string | null;
  remainingCost?: number | string | null;
  dailyCost?: number | string | null;
  TransferOperationNumber?: string | null;
  promissoryNoteFile?: string | null;
  paymentReceiptFile?: string | null;
  salaryCertificateFile?: string | null;
  nationalAddressFile?: string | null;
  file?: string | null;
  Notes?: string | null;
  NationalID?: string | null;
  EntryDate?: string | null;
}

interface Pagination {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TransferFinancialStatusInfo {
  code: 'paid_full_single' | 'two_installments_with_sanad' | 'two_installments_no_sanad' | 'unpaid' | 'no_statement';
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  tooltip: string;
  icon: string;
  total: number;
  paid: number;
  remaining: number;
  hasSanad: boolean;
  sanadUrl: string | null;
}

export function getTransferFinancialStatus(transfer: Transfer): TransferFinancialStatusInfo {
  const totalCost = Number(transfer?.Cost || 0);
  const totalPaid = Number(transfer?.Paid || 0);
  const remaining = Math.max(0, totalCost - totalPaid);

  const sanadUrl = transfer?.promissoryNoteFile || null;
  const hasSanad = Boolean(sanadUrl && sanadUrl.trim() !== '' && sanadUrl !== 'عرض' && sanadUrl !== 'غير متوفر');

  // الحالة 1: لا يوجد سجل مالي
  if (!transfer?.Cost && !transfer?.Paid && totalCost === 0 && totalPaid === 0) {
    return {
      code: 'no_statement',
      label: 'لا يوجد سجل مالي',
      shortLabel: 'بدون سجل مالي',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-700',
      badgeBorder: 'border-slate-300',
      tooltip: 'لم يتم تسجيل تكلفة أو مدفوعات لهذه المعاملة بعد.',
      icon: '📋',
      total: 0,
      paid: 0,
      remaining: 0,
      hasSanad,
      sanadUrl,
    };
  }

  // الحالة 2: مسدد بالكامل
  if (remaining <= 0 && (totalPaid > 0 || totalCost === 0)) {
    return {
      code: 'paid_full_single',
      label: 'مسدد بالكامل (دفعة واحدة)',
      shortLabel: 'مسدد بالكامل',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-800',
      badgeBorder: 'border-emerald-200',
      tooltip: 'تم سداد كامل قيمة المعاملة بنجاح، ولا توجد مبالغ متبقية.',
      icon: '🟢',
      total: totalCost,
      paid: totalPaid,
      remaining: 0,
      hasSanad,
      sanadUrl,
    };
  }

  // الحالة 3: معلق (لم يدفع أي مبلغ)
  if (totalPaid <= 0 && totalCost > 0) {
    return {
      code: 'unpaid',
      label: 'معلق (لم يُسدد أي مبلغ)',
      shortLabel: 'معلق (غير مسدد)',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-900',
      badgeBorder: 'border-rose-200',
      tooltip: 'مسجلة تكلفة للمعاملة ولكن لم يتم تسجيل أو استلام أي دفعة بعد.',
      icon: '🔴',
      total: totalCost,
      paid: 0,
      remaining: remaining,
      hasSanad,
      sanadUrl,
    };
  }

  // الحالة 4: دفع جزئي (متبقي مبالغ)
  if (hasSanad) {
    return {
      code: 'two_installments_with_sanad',
      label: 'متبقي مبالغ (مع سند لأمر)',
      shortLabel: 'متبقي (مع سند)',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-900',
      badgeBorder: 'border-amber-300',
      tooltip: `تم سداد جزء من المبلغ ومتبقي ${remaining.toLocaleString()} ر.س مع وجود سند لأمر موثق ومرفوع.`,
      icon: '🟠',
      total: totalCost,
      paid: totalPaid,
      remaining: remaining,
      hasSanad: true,
      sanadUrl,
    };
  } else {
    return {
      code: 'two_installments_no_sanad',
      label: 'متبقي مبالغ (بدون سند لأمر ⚠️)',
      shortLabel: 'متبقي (بدون سند ⚠️)',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-900',
      badgeBorder: 'border-purple-300',
      tooltip: `تم سداد جزء من المبلغ ومتبقي ${remaining.toLocaleString()} ر.س ولكن ملف السند لأمر غير مرفوع!`,
      icon: '🟣',
      total: totalCost,
      paid: totalPaid,
      remaining: remaining,
      hasSanad: false,
      sanadUrl: null,
    };
  }
}

export const FINANCIAL_STATUS_FILTER_OPTIONS = [
  {
    code: 'all',
    label: 'جميع الحالات المالية (عرض الكل)',
    shortLabel: 'الكل',
    icon: '✨',
    description: 'عرض كافة المعاملات دون أي تصفية',
  },
  {
    code: 'paid_full_single',
    label: 'مسدد بالكامل (دفعة واحدة)',
    shortLabel: 'مسدد بالكامل',
    icon: '🟢',
    description: 'تم سداد كامل المبلغ (متبقي: 0)',
  },
  {
    code: 'two_installments_with_sanad',
    label: 'متبقي مبالغ (مع سند لأمر)',
    shortLabel: 'متبقي (مع سند)',
    icon: '🟠',
    description: 'متبقي مبالغ مع وجود سند لأمر موثق',
  },
  {
    code: 'two_installments_no_sanad',
    label: 'متبقي مبالغ (بدون سند لأمر ⚠️)',
    shortLabel: 'متبقي (بدون سند ⚠️)',
    icon: '🟣',
    description: 'متبقي مبالغ وملف السند غير مرفوع',
  },
  {
    code: 'unpaid',
    label: 'معلق (لم يُسدد أي مبلغ)',
    shortLabel: 'معلق (غير مسدد)',
    icon: '🔴',
    description: 'يوجد تكلفة ولكن لم يدفع أي مبلغ',
  },
  {
    code: 'no_statement',
    label: 'لا يوجد سجل مالي',
    shortLabel: 'بدون سجل مالي',
    icon: '📋',
    description: 'لم يتم تسجيل تكلفة أو دفعات بعد',
  },
];

export default function ServiceTransferTable({
  onAddTransaction,
  onEditTransaction,
  permissions = { canView: true, canCreate: true, canEdit: true, canDelete: true },
}: {
  onAddTransaction?: () => void;
  onEditTransaction?: (id: number) => void;
  permissions?: {
    canView?: boolean;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
  };
}) {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const decoded = jwtDecode<any>(token);
      setUserName(decoded.username || '');
    } catch {
      // Ignore token decode errors
    }
  }, []);

  // Helper to read initial state from sessionStorage
  const getStoredState = () => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = sessionStorage.getItem('transfer_sponsorship_table_state');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore JSON error
    }
    return null;
  };

  // 1. حالة التبويب النشط: 'trials' (فترة التجربة) | 'completed' (تم نقل كفالتهم) | 'failed' (فشلت التجربة)
  const [activeTab, setActiveTab] = useState<'trials' | 'completed' | 'failed'>(() => {
    if (typeof window !== 'undefined') {
      const s = getStoredState();
      if (s?.activeTab === 'completed' || s?.activeTab === 'trials' || s?.activeTab === 'failed') return s.activeTab;
    }
    return 'trials';
  });
  const [tabCounts, setTabCounts] = useState<{ trials: number; completed: number; failed: number }>({
    trials: 0,
    completed: 0,
    failed: 0,
  });

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [allData, setAllData] = useState<Transfer[]>([]); // للتصدير
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nationalityFilter, setNationalityFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const s = getStoredState();
      if (typeof s?.nationalityFilter === 'string') return s.nationalityFilter;
    }
    return '';
  });
  const [cityFilter, setCityFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const s = getStoredState();
      if (typeof s?.cityFilter === 'string') return s.cityFilter;
    }
    return '';
  });
  const [dateFrom, setDateFrom] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const s = getStoredState();
      if (typeof s?.dateFrom === 'string') return s.dateFrom;
    }
    return '';
  });
  const [dateTo, setDateTo] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const s = getStoredState();
      if (typeof s?.dateTo === 'string') return s.dateTo;
    }
    return '';
  });
  const [financialStatusFilter, setFinancialStatusFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const s = getStoredState();
      if (typeof s?.financialStatusFilter === 'string') return s.financialStatusFilter;
    }
    return 'all';
  });
  const [financialFilterMenuOpen, setFinancialFilterMenuOpen] = useState(false);
  const financialFilterMenuRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const s = getStoredState();
      if (typeof s?.currentPage === 'number' && s.currentPage > 0) return s.currentPage;
    }
    return 1;
  });
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const s = getStoredState();
      if (typeof s?.searchTerm === 'string') return s.searchTerm;
    }
    return '';
  });

  // حالة نوافذ الإجراءات (نجاح التجربة / فشل التجربة / عرض التفاصيل / تأكيد الحذف)
  const [completeModalTransfer, setCompleteModalTransfer] = useState<Transfer | null>(null);
  const [failModalTransfer, setFailModalTransfer] = useState<Transfer | null>(null);
  const [viewModalTransfer, setViewModalTransfer] = useState<Transfer | null>(null);
  const [deleteModalTransfer, setDeleteModalTransfer] = useState<Transfer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // دالة حذف المعاملة
  const handleDeleteTransfer = async (id: number) => {
    setIsDeleting(true);
    try {
      await axios.delete(`/api/transferSponsorShips?id=${id}`);
      setDeleteModalTransfer(null);
      fetchTransfers();
      fetchAllData();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'حدث خطأ أثناء حذف المعاملة');
    } finally {
      setIsDeleting(false);
    }
  };

  // إغلاق قائمة فلتر الحالة المالية عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        financialFilterMenuRef.current &&
        !financialFilterMenuRef.current.contains(e.target as Node)
      ) {
        setFinancialFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // جلب كل البيانات للتصدير والإحصائيات
  useEffect(() => {
    fetchAllData();
  }, []);

  // حفظ الحالة الحالية في sessionStorage للحفاظ على التبويب والصفحة والفلاتر عند التنقل
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          'transfer_sponsorship_table_state',
          JSON.stringify({
            activeTab,
            currentPage,
            searchTerm,
            nationalityFilter,
            cityFilter,
            dateFrom,
            dateTo,
            financialStatusFilter,
          })
        );
      } catch {
        // Ignore storage error
      }
    }
  }, [
    activeTab,
    currentPage,
    searchTerm,
    nationalityFilter,
    cityFilter,
    dateFrom,
    dateTo,
    financialStatusFilter,
  ]);

  const fetchAllData = async () => {
    try {
      const response = await axios.get('/api/Export/transfersponserships');
      setAllData(response.data.homemaids || []);
    } catch (err) {
      console.error('فشل جلب بيانات التصدير');
    }
  };

  // استخراج قائمة الجنسيات والمدن المتوفرة ديناميكيًا من البيانات
  const availableNationalities = useMemo(() => {
    return Array.from(
      new Set(
        allData
          .map((t) => (t.HomeMaid?.Nationalitycopy || t.HomeMaid?.Nationality || '').toString().trim())
          .filter((n) => n.length > 0)
      )
    );
  }, [allData]);

  const availableCities = useMemo(() => {
    return Array.from(
      new Set(
        allData
          .flatMap((t) => [t.NewClient?.city, t.OldClient?.city])
          .map((c) => (c || '').toString().trim())
          .filter((c) => c.length > 0)
      )
    );
  }, [allData]);

  // حساب أعداد كل حالة مالية
  const financialStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allData.length,
      paid_full_single: 0,
      two_installments_with_sanad: 0,
      two_installments_no_sanad: 0,
      unpaid: 0,
      no_statement: 0,
    };
    allData.forEach((t) => {
      const st = getTransferFinancialStatus(t);
      if (counts[st.code] !== undefined) {
        counts[st.code]++;
      }
    });
    return counts;
  }, [allData]);

  // جلب البيانات مع Pagination + Filters + Tab
  useEffect(() => {
    fetchTransfers();
  }, [currentPage, activeTab, nationalityFilter, cityFilter, dateFrom, dateTo, searchTerm]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: currentPage,
        limit,
        tab: activeTab,
      };
      if (nationalityFilter) params.nationalityFilter = nationalityFilter;
      if (cityFilter) params.cityFilter = cityFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (searchTerm) params.searchTerm = searchTerm;

      const response = await axios.get('/api/transferSponsorShips', { params });
      setTransfers(response.data.transfers || []);
      setPagination(response.data.pagination);
      if (response.data.tabCounts) {
        setTabCounts(response.data.tabCounts);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('فشل تحميل بيانات معاملات نقل الخدمات');
      setLoading(false);
    }
  };

  // تصفية المعاملات المعروضة حسب الحالة المالية إذا تم تحديدها
  const displayedTransfers = useMemo(() => {
    if (financialStatusFilter === 'all') return transfers;
    return transfers.filter((t) => {
      const st = getTransferFinancialStatus(t);
      return st.code === financialStatusFilter;
    });
  }, [transfers, financialStatusFilter]);

  // تصدير Excel
  const exportToExcel = () => {
    let dataToExport = allData;

    if (activeTab === 'trials') {
      dataToExport = dataToExport.filter(
        (t) =>
          ['في المرحلة التجريبية', 'فترة التجربة', 'تقييم التجربة'].includes(t.transferStage || '') ||
          (t.ExperimentStart && !['تم نقل الكفالة', 'نقل الخدمات', 'فشلت التجربة'].includes(t.transferStage || ''))
      );
    } else if (activeTab === 'completed') {
      dataToExport = dataToExport.filter((t) =>
        ['تم نقل الكفالة', 'نقل الخدمات', 'انشاء العقد', 'انشاء الطلب'].includes(t.transferStage || '')
      );
    } else if (activeTab === 'failed') {
      dataToExport = dataToExport.filter((t) =>
        ['فشلت التجربة'].includes(t.transferStage || '')
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      dataToExport = dataToExport.filter(
        (t) =>
          t.HomeMaid?.Name?.toLowerCase().includes(term) ||
          t.HomeMaid?.Passportnumber?.toLowerCase().includes(term) ||
          t.OldClient?.fullname?.toLowerCase().includes(term) ||
          t.NewClient?.fullname?.toLowerCase().includes(term)
      );
    }
    if (nationalityFilter) {
      dataToExport = dataToExport.filter((t) => {
        const nat = (t.HomeMaid?.Nationalitycopy || t.HomeMaid?.Nationality || '').toString().toLowerCase();
        return nat.includes(nationalityFilter.toLowerCase());
      });
    }
    if (cityFilter) {
      dataToExport = dataToExport.filter((t) => {
        const c1 = (t.NewClient?.city || '').toString().toLowerCase();
        const c2 = (t.OldClient?.city || '').toString().toLowerCase();
        return c1.includes(cityFilter.toLowerCase()) || c2.includes(cityFilter.toLowerCase());
      });
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      dataToExport = dataToExport.filter((t) => {
        const d = t.createdAt || t.ContractDate || t.TransferingDate;
        return d ? new Date(d) >= from : false;
      });
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      dataToExport = dataToExport.filter((t) => {
        const d = t.createdAt || t.ContractDate || t.TransferingDate;
        return d ? new Date(d) <= to : false;
      });
    }
    if (financialStatusFilter !== 'all') {
      dataToExport = dataToExport.filter((t) => {
        const st = getTransferFinancialStatus(t);
        return st.code === financialStatusFilter;
      });
    }

    if (dataToExport.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    const worksheetData = dataToExport.map((row: any, index: number) => {
      const finStatus = getTransferFinancialStatus(row);
      return {
        '#': row.id ?? index + 1,
        'اسم العاملة': row.HomeMaid?.Name || '-',
        'رقم الجواز': row.HomeMaid?.Passportnumber || '-',
        'الجنسية': row.HomeMaid?.Nationalitycopy || row.HomeMaid?.Nationality || '-',
        'العميل الحالي (المتنازل)': row.OldClient?.fullname ? `${row.OldClient.fullname}${row.OldClient.city ? ` (${formatSaudiCity(row.OldClient.city)})` : ''}` : '-',
        'العميل الجديد (المستلم)': row.NewClient?.fullname ? `${row.NewClient.fullname}${row.NewClient.city ? ` (${formatSaudiCity(row.NewClient.city)})` : ''}` : '-',
        'حالة السجل المالي': finStatus.label,
        'إجمالي التكلفة': finStatus.total > 0 ? finStatus.total : 0,
        'المبلغ المسدد': finStatus.paid > 0 ? finStatus.paid : 0,
        'المبلغ المتبقي': finStatus.remaining > 0 ? finStatus.remaining : 0,
        'مدة التجربة': row.ExperimentDuration || '-',
        'تقييم التجربة': row.ExperimentRate || 'غير محدد',
        'المرحلة الحالية': row.transferStage || '-',
        'تاريخ المعاملة': row.TransferingDate || row.ContractDate || row.createdAt || '-',
      };
    });

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'نقل_الخدمات');
    XLSX.writeFile(wb, `service_transfers_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // تصدير PDF
  const exportToPDF = async () => {
    let dataToExport = allData;

    if (activeTab === 'trials') {
      dataToExport = dataToExport.filter(
        (t) =>
          ['في المرحلة التجريبية', 'فترة التجربة', 'تقييم التجربة'].includes(t.transferStage || '') ||
          (t.ExperimentStart && !['تم نقل الكفالة', 'نقل الخدمات', 'فشلت التجربة'].includes(t.transferStage || ''))
      );
    } else if (activeTab === 'completed') {
      dataToExport = dataToExport.filter((t) =>
        ['تم نقل الكفالة', 'نقل الخدمات', 'انشاء العقد', 'انشاء الطلب'].includes(t.transferStage || '')
      );
    } else if (activeTab === 'failed') {
      dataToExport = dataToExport.filter((t) =>
        ['فشلت التجربة'].includes(t.transferStage || '')
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      dataToExport = dataToExport.filter(
        (t) =>
          t.HomeMaid?.Name?.toLowerCase().includes(term) ||
          t.HomeMaid?.Passportnumber?.toLowerCase().includes(term) ||
          t.OldClient?.fullname?.toLowerCase().includes(term) ||
          t.NewClient?.fullname?.toLowerCase().includes(term)
      );
    }
    if (nationalityFilter) {
      dataToExport = dataToExport.filter((t) => {
        const nat = (t.HomeMaid?.Nationalitycopy || t.HomeMaid?.Nationality || '').toString().toLowerCase();
        return nat.includes(nationalityFilter.toLowerCase());
      });
    }
    if (cityFilter) {
      dataToExport = dataToExport.filter((t) => {
        const c1 = (t.NewClient?.city || '').toString().toLowerCase();
        const c2 = (t.OldClient?.city || '').toString().toLowerCase();
        return c1.includes(cityFilter.toLowerCase()) || c2.includes(cityFilter.toLowerCase());
      });
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      dataToExport = dataToExport.filter((t) => {
        const d = t.createdAt || t.ContractDate || t.TransferingDate;
        return d ? new Date(d) >= from : false;
      });
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      dataToExport = dataToExport.filter((t) => {
        const d = t.createdAt || t.ContractDate || t.TransferingDate;
        return d ? new Date(d) <= to : false;
      });
    }
    if (financialStatusFilter !== 'all') {
      dataToExport = dataToExport.filter((t) => {
        const st = getTransferFinancialStatus(t);
        return st.code === financialStatusFilter;
      });
    }

    if (dataToExport.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.width;

    let logoBase64 = '';
    try {
      const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
      const logoBuffer = await logo.arrayBuffer();
      const logoBytes = new Uint8Array(logoBuffer);
      logoBase64 = Buffer.from(logoBytes).toString('base64');
    } catch (e) {
      console.error('Logo fetch failed', e);
    }

    try {
      const response = await fetch('/fonts/Amiri-Regular.ttf');
      if (response.ok) {
        const fontBuffer = await response.arrayBuffer();
        const fontBytes = new Uint8Array(fontBuffer);
        const fontBase64 = Buffer.from(fontBytes).toString('base64');
        doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
        doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
        doc.setFont('Amiri');
      }
    } catch (err) {
      console.error('Error loading Amiri font for PDF export', err);
    }

    const tableColumn = [
      '#',
      'اسم العاملة',
      'رقم الجواز',
      'العميل الحالي',
      'العميل الجديد',
      'السجل المالي',
      'المرحلة',
      'التاريخ',
    ];

    const tableRows = dataToExport.map((row: any, index: number) => {
      const finStatus = getTransferFinancialStatus(row);
      return [
        row.id ?? index + 1,
        row.HomeMaid?.Name || '-',
        row.HomeMaid?.Passportnumber || '-',
        row.OldClient?.fullname || '-',
        row.NewClient?.fullname || '-',
        finStatus.label,
        row.transferStage || '-',
        row.TransferingDate || row.ContractDate || '-',
      ];
    });

    // @ts-ignore
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      styles: { halign: 'right', font: doc.getFont().fontName || undefined },
      headStyles: { fillColor: [26, 77, 79], textColor: [255, 255, 255] },
      margin: { top: 40, right: 10, left: 10 },
      didDrawPage: (data: any) => {
        const pageHeight = doc.internal.pageSize.height;
        const width = doc.internal.pageSize.width;

        if (logoBase64) {
          doc.addImage(logoBase64, 'PNG', width - 40, 10, 25, 25);
        }

        if (doc.getCurrentPageInfo().pageNumber === 1) {
          doc.setFontSize(14);
          doc.setFont('Amiri', 'normal');
          doc.text('تقرير معاملات نقل الخدمات (نقل الكفالة)', width / 2, 20, { align: 'center' });
        }

        doc.setFontSize(9);
        doc.setFont('Amiri', 'normal');
        doc.text(userName, 10, pageHeight - 10, { align: 'left' });

        const pageNumber = `صفحة ${doc.getCurrentPageInfo().pageNumber}`;
        doc.text(pageNumber, width / 2, pageHeight - 10, { align: 'center' });

        const dateText =
          'التاريخ: ' +
          new Date().toLocaleDateString('ar-EG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
        doc.text(dateText, width - 10, pageHeight - 10, { align: 'right' });
      },
    });

    doc.save(`service_transfers_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleResetFilters = () => {
    setNationalityFilter('');
    setCityFilter('');
    setDateFrom('');
    setDateTo('');
    setFinancialStatusFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          'transfer_sponsorship_table_state',
          JSON.stringify({
            activeTab,
            currentPage: 1,
            searchTerm: '',
            nationalityFilter: '',
            cityFilter: '',
            dateFrom: '',
            dateTo: '',
            financialStatusFilter: 'all',
          })
        );
      } catch {}
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // تنسيق شارة المرحلة
  const renderStageBadge = (stage?: string | null, rate?: string | null) => {
    if (stage === 'فشلت التجربة' || rate === 'فاشلة') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">
          <UserX className="w-3.5 h-3.5 text-red-600" />
          فشلت التجربة (تم الإرجاع)
        </span>
      );
    }
    if (stage === 'تم نقل الكفالة' || stage === 'نقل الخدمات') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-800 border border-green-200">
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          تم نقل الكفالة (مكتمل)
        </span>
      );
    }
    if (stage === 'فترة التجربة' || stage === 'في المرحلة التجريبية') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-800 border border-yellow-200">
          <Clock className="w-3.5 h-3.5 text-yellow-600" />
          قيد التجربة
        </span>
      );
    }
    if (stage === 'تقييم التجربة') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
          <UserCheck className="w-3.5 h-3.5 text-purple-600" />
          تقييم التجربة
        </span>
      );
    }
    if (stage === 'انشاء العقد') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          إنشاء العقد
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-800 border border-gray-200">
        {stage || 'قيد المعالجة'}
      </span>
    );
  };

  // توجيه لنموذج إضافة/إتمام معاملة نقل الكفالة الكامل (نفس نموذج سكن العاملات)
  const handleCompleteTransferRow = (transfer: Transfer) => {
    const maidName = transfer.HomeMaid?.Name || '';
    const nationality = transfer.HomeMaid?.Nationalitycopy || transfer.HomeMaid?.Nationality || '';
    const passportNumber = transfer.HomeMaid?.Passportnumber || '';
    const residencyNumber = transfer.NationalID || '';
    const entryDate = transfer.EntryDate ? new Date(transfer.EntryDate).toISOString().split('T')[0] : '';
    
    const oldClient = transfer.OldClient;
    const newClient = transfer.NewClient;

    const totalCost = transfer.Cost ? String(transfer.Cost) : '';
    const paid = transfer.Paid != null ? String(transfer.Paid) : '0';
    const remaining = totalCost ? String(Math.max(0, Number(totalCost) - Number(paid))) : (transfer.remainingCost != null ? String(transfer.remainingCost) : '0');

    const payload = {
      transactionId: transfer.id,
      homeMaidId: transfer.HomeMaidId || transfer.HomeMaid?.id,
      maidName: maidName,
      nationality: nationality,
      passportNumber: passportNumber,
      residencyNumber: residencyNumber,
      entryDate: entryDate,
      oldClientId: transfer.OldClientId || oldClient?.nationalId || (oldClient?.id ? String(oldClient.id) : ''),
      oldClientName: oldClient?.fullname || '',
      oldClientPhone: oldClient?.phonenumber || '',
      oldClientCity: formatSaudiCity(oldClient?.city || ''),
      trialClientName: newClient?.fullname || '',
      newClientName: newClient?.fullname || '',
      newClientPhone: newClient?.phonenumber || '',
      newClientAltPhone: newClient?.alternativePhone || '',
      newClientId: transfer.NewClientId || newClient?.id || '',
      newClientNationalId: newClient?.nationalId || '',
      newClientCity: formatSaudiCity(newClient?.city || ''),
      newClientDateOfBirth: newClient?.dateofbirth ? new Date(newClient.dateofbirth).toISOString().split('T')[0] : '',
      experimentDuration: transfer.ExperimentDuration || '',
      experimentStart: transfer.ExperimentStart ? new Date(transfer.ExperimentStart).toISOString().split('T')[0] : '',
      experimentEnd: transfer.ExperimentEnd ? new Date(transfer.ExperimentEnd).toISOString().split('T')[0] : '',
      dailyCost: transfer.dailyCost != null ? String(transfer.dailyCost) : '',
      cost: totalCost,
      estimatedCost: totalCost,
      paidAmount: paid,
      remainingAmount: remaining,
      salaryCertificateFile: transfer.salaryCertificateFile || '',
      nationalAddressFile: transfer.nationalAddressFile || '',
      paymentReceiptFile: transfer.paymentReceiptFile || '',
      promissoryNoteFile: transfer.promissoryNoteFile || '',
      contractDate: transfer.ContractDate ? new Date(transfer.ContractDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      trialNotes: transfer.Notes || '',
      notes: transfer.Notes || '',
      transferOperationNumber: transfer.TransferOperationNumber || '',
      trialResult: 'ناجحة',
      sourceAction: 'complete_housing_transfer',
    };

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('housingTransferWizardDraft', JSON.stringify(payload));
    }

    if (onAddTransaction) {
      onAddTransaction();
    } else {
      router.push('/admin/AddTransactionForm');
    }
  };

  const isAnyFilterActive = Boolean(
    searchTerm ||
    nationalityFilter ||
    cityFilter ||
    dateFrom ||
    dateTo ||
    financialStatusFilter !== 'all'
  );

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* 1. Page Header Card with Integrated Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-teal-50 text-teal-800 rounded-xl border border-teal-100 shadow-sm">
              <Repeat className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">معاملات نقل الخدمات</h1>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                إدارة فترات التجربة ومعاملات نقل الكفالة وتوثيق النتائج بسهولة
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200/90 text-amber-800 text-xs font-semibold px-3.5 py-2.5 rounded-xl shadow-2xs">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>تجربة نقل الكفالة تتم من خلال السكن</span>
            </div>

            <button
              type="button"
              disabled
              title="تجربة نقل الكفالة تتم من خلال السكن"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-500 text-sm font-semibold px-5 py-2.5 rounded-xl shadow-2xs cursor-not-allowed opacity-75 select-none border border-gray-300"
            >
              <Plus className="w-4 h-4 text-gray-400" />
              <span>{activeTab === 'trials' ? 'بدء تجربة نقل خدمات جديدة' : 'إضافة معاملة جديدة'}</span>
            </button>
          </div>
        </div>

        {/* Integrated Tab Navigation Bar */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-start">
          <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl w-full sm:w-max border border-gray-200">
            <button
              onClick={() => {
                setActiveTab('trials');
                setCurrentPage(1);
              }}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'trials'
                  ? 'bg-white text-yellow-900 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-4 h-4 text-yellow-600" />
              <span>فترة التجربة</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                  activeTab === 'trials' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {tabCounts.trials}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('completed');
                setCurrentPage(1);
              }}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-white text-green-900 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>تم نقل كفالتهم</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                  activeTab === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {tabCounts.completed}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('failed');
                setCurrentPage(1);
              }}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'failed'
                  ? 'bg-white text-rose-900 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserX className="w-4 h-4 text-rose-600" />
              <span>فشلت التجربة</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                  activeTab === 'failed' ? 'bg-rose-100 text-rose-800' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {tabCounts.failed}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Filters & Action Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-3">
        {/* Search & Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="بحث برقم المعاملة، العاملة، العميل..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 pr-10 pl-8 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all placeholder:text-gray-400"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 h-10 text-xs text-gray-700 hover:border-gray-300 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0 pointer-events-none" />
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 text-xs whitespace-nowrap">من:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xs text-gray-800 cursor-pointer p-0"
              />
            </div>
            <span className="text-gray-300 select-none">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 text-xs whitespace-nowrap">إلى:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xs text-gray-800 cursor-pointer p-0"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  setCurrentPage(1);
                }}
                className="text-gray-400 hover:text-gray-600 p-0.5 shrink-0 cursor-pointer"
                title="مسح التاريخ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Nationality Filter */}
          <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl h-10 w-44 hover:border-gray-300 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
            <select
              value={nationalityFilter}
              onChange={(e) => {
                setNationalityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-full bg-transparent bg-none border-0 outline-none focus:outline-none focus:ring-0 text-sm text-gray-700 cursor-pointer font-medium pr-3.5 pl-8 text-right appearance-none"
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                backgroundImage: 'none',
              }}
              dir="rtl"
            >
              <option value="">الجنسية: الكل</option>
              {availableNationalities.map((nat) => (
                <option key={nat} value={nat}>
                  {nat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* City Filter */}
          <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl h-10 w-40 hover:border-gray-300 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-full bg-transparent bg-none border-0 outline-none focus:outline-none focus:ring-0 text-sm text-gray-700 cursor-pointer font-medium pr-3.5 pl-8 text-right appearance-none"
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                backgroundImage: 'none',
              }}
              dir="rtl"
            >
              <option value="">المدينة: الكل</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {formatSaudiCity(city)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset Filters */}
          {isAnyFilterActive && (
            <button
              onClick={handleResetFilters}
              className="h-10 inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              title="إعادة ضبط الفلاتر"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة تعيين</span>
            </button>
          )}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 justify-end shrink-0">
          <button
            onClick={exportToExcel}
            className="h-10 inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-sm font-semibold px-3.5 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer whitespace-nowrap"
            title="تصدير إلى ملف Excel"
          >
            <FileExcelOutlined className="w-4 h-4 text-emerald-700" />
            <span>تصدير Excel</span>
          </button>
          <button
            onClick={exportToPDF}
            className="h-10 inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-sm font-semibold px-3.5 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer whitespace-nowrap"
            title="تصدير إلى ملف PDF"
          >
            <FileText className="w-4 h-4 text-rose-700" />
            <span>تصدير PDF</span>
          </button>
        </div>
      </div>

      {/* 5. Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-visible">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-teal-800 border-t-transparent"></div>
            <p className="text-sm font-medium text-gray-600">جاري تحميل البيانات...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-rose-600 font-semibold">{error}</p>
            <button
              onClick={fetchTransfers}
              className="mt-3 text-sm text-teal-800 underline font-medium hover:text-teal-900 cursor-pointer"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : displayedTransfers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="p-4 bg-gray-50 text-gray-400 rounded-full mb-3">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-800">
              {activeTab === 'trials'
                ? 'لا توجد معاملات في فترة التجربة حالياً'
                : activeTab === 'completed'
                ? 'لا توجد معاملات نقل كفالة مكتملة'
                : activeTab === 'failed'
                ? 'لا توجد معاملات تجربة فاشلة حالياً'
                : 'لا توجد معاملات مسجلة'}
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md">
              {isAnyFilterActive
                ? 'لم يتم العثور على نتائج مطابقة للفلاتر أو كلمة البحث الحالية.'
                : activeTab === 'trials'
                ? 'العاملات المغادرات من السكن لتجربة نقل الخدمات ستظهر هنا تلقائياً.'
                : activeTab === 'failed'
                ? 'المعاملات التي فشلت تجربتها وتم إرجاع العاملة للسكن ستظهر هنا.'
                : 'يمكنك إضافة أو نقل كفالة معاملة جديدة بكل سهولة.'}
            </p>
            {isAnyFilterActive && (
              <button
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center gap-1.5 bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 text-sm font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>مسح الفلاتر والبحث</span>
              </button>
            )}
          </div>
        ) : (
          <div className="w-full overflow-visible pb-10">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-teal-900 text-white text-center text-sm font-semibold">
                  <th className="p-3.5 border-b border-teal-950/20 text-center w-16">#</th>
                  <th className="p-3.5 border-b border-teal-950/20 text-center">العاملة</th>
                  <th className="p-3.5 border-b border-teal-950/20 text-center">الكفيل المتنازل</th>
                  <th className="p-3.5 border-b border-teal-950/20 text-center">
                    {activeTab === 'completed' ? 'الكفيل الجديد (المستلم)' : 'العميل المجرّب'}
                  </th>

                  {/* في تبويب التجربة أو فشلت التجربة: عرض مدة وتكلفة التجربة */}
                  {activeTab !== 'completed' && (
                    <>
                      <th className="p-3.5 border-b border-teal-950/20 text-center">تفاصيل التجربة</th>
                      <th className="p-3.5 border-b border-teal-950/20 text-center">تواريخ التجربة</th>
                    </>
                  )}

                  {/* في تبويب المكتملة: عرض السجل المالي */}
                  {activeTab === 'completed' && (
                    <th className="p-3.5 border-b border-teal-950/20 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-2 relative" ref={financialFilterMenuRef}>
                        <span className="font-semibold text-white">حالة السجل المالي</span>
                        <div className="relative inline-flex items-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFinancialFilterMenuOpen((prev) => !prev);
                            }}
                            className={`relative p-1.5 rounded-lg transition-all duration-200 border cursor-pointer select-none shadow-xs inline-flex items-center justify-center ${
                              financialStatusFilter !== 'all'
                                ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300/40 hover:bg-amber-300'
                                : 'bg-teal-800 text-teal-100 border-teal-700 hover:bg-teal-700 hover:text-white'
                            }`}
                            title={financialStatusFilter !== 'all' ? `مفلتر حسب الحالة المالية` : 'تصفية حسب حالة السجل المالي'}
                          >
                            <Filter className={`w-3.5 h-3.5 ${financialStatusFilter !== 'all' ? 'text-slate-950 fill-slate-950' : 'text-teal-200'}`} />
                            {financialStatusFilter !== 'all' && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border border-teal-900" />
                            )}
                          </button>

                          {financialFilterMenuOpen && (
                            <div
                              className="absolute right-0 top-full mt-2 z-[200] min-w-[300px] w-max max-w-sm rounded-2xl border border-gray-200 bg-white p-2.5 shadow-2xl text-right animate-in fade-in zoom-in-95 duration-150"
                              dir="rtl"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 px-1">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                                  <Filter className="w-3.5 h-3.5 text-teal-800" />
                                  <span>تصفية حالة السجل المالي</span>
                                </div>
                                {financialStatusFilter !== 'all' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFinancialStatusFilter('all');
                                      setFinancialFilterMenuOpen(false);
                                    }}
                                    className="text-[11px] text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                                  >
                                    <X className="w-3 h-3" />
                                    إلغاء الفلترة
                                  </button>
                                )}
                              </div>

                              <div className="space-y-1">
                                {FINANCIAL_STATUS_FILTER_OPTIONS.map((opt) => {
                                  const isSelected = financialStatusFilter === opt.code;
                                  const count = financialStatusCounts[opt.code] || 0;
                                  return (
                                    <button
                                      key={opt.code}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFinancialStatusFilter(opt.code);
                                        setFinancialFilterMenuOpen(false);
                                      }}
                                      className={`w-full flex items-center justify-between gap-2 p-2 rounded-xl text-right text-xs transition-all duration-150 cursor-pointer ${
                                        isSelected
                                          ? 'bg-teal-50 border border-teal-300 text-teal-950 font-semibold shadow-xs'
                                          : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className="text-sm leading-none shrink-0">{opt.icon}</span>
                                        <div className="flex flex-col min-w-0 text-right">
                                          <span className={`text-xs whitespace-nowrap ${isSelected ? 'font-bold text-teal-900' : 'text-gray-800'}`}>
                                            {opt.label}
                                          </span>
                                          <span className="text-[10px] text-gray-400 font-normal whitespace-nowrap">
                                            {opt.description}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                            count > 0
                                              ? isSelected
                                                ? 'bg-teal-700 text-white'
                                                : 'bg-gray-100 text-gray-700'
                                              : 'bg-gray-50 text-gray-400'
                                          }`}
                                        >
                                          {count}
                                        </span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-teal-700 shrink-0" />}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                  )}

                  <th className="p-3.5 border-b border-teal-950/20 text-center">
                    {activeTab === 'completed' ? 'المرحلة الحالية' : 'حالة التجربة'}
                  </th>

                  {activeTab === 'completed' && (
                    <th className="p-3.5 border-b border-teal-950/20 text-center">تاريخ المعاملة</th>
                  )}

                  <th className="p-3.5 border-b border-teal-950/20 text-center w-36">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedTransfers.map((row) => {
                  const maidId = row.HomeMaid?.id || row.HomeMaidId;
                  const oldClientId = row.OldClient?.id || row.OldClientId;
                  const newClientId = row.NewClient?.id || row.NewClientId;
                  const finStatus = getTransferFinancialStatus(row);
                  const isTrialRecord =
                    ['في المرحلة التجريبية', 'فترة التجربة', 'تقييم التجربة', 'فشلت التجربة'].includes(row.transferStage || '') ||
                    Boolean(row.ExperimentStart && !['تم نقل الكفالة', 'نقل الخدمات'].includes(row.transferStage || ''));
                  const isTrialFailed = row.transferStage === 'فشلت التجربة' || row.ExperimentRate === 'فاشلة';
                  const isTransferCompleted = row.transferStage === 'تم نقل الكفالة' || row.transferStage === 'نقل الخدمات';

                  return (
                    <tr key={row.id} className="hover:bg-teal-50/40 transition-colors text-center">
                      {/* ID */}
                      <td className="p-3.5 text-center">
                        <span
                          onClick={() => {
                            if (onEditTransaction) onEditTransaction(row.id);
                            else router.push(`/admin/AddTransactionForm?id=${row.id}`);
                          }}
                          className="font-bold text-teal-800 hover:text-teal-900 hover:underline cursor-pointer font-mono"
                          title="عرض وتعديل تفاصيل المعاملة"
                        >
                          #{row.id}
                        </span>
                      </td>

                      {/* Worker */}
                      <td className="p-3.5 text-center">
                        <div
                          onClick={() => {
                            if (maidId) router.push(`/admin/homemaidinfo?id=${maidId}`);
                          }}
                          className="font-semibold text-teal-900 hover:text-teal-700 hover:underline cursor-pointer inline-block transition-colors"
                          title="عرض بروفايل العاملة"
                        >
                          {row.HomeMaid?.Name || 'عاملة غير محددة'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1.5 flex-wrap" dir="rtl">
                          {row.HomeMaid?.Passportnumber && (
                            <span className="inline-flex items-center gap-1">
                              <span>جواز:</span>
                              <span dir="ltr" className="font-mono font-medium text-gray-700">
                                {row.HomeMaid.Passportnumber}
                              </span>
                            </span>
                          )}
                          {row.HomeMaid?.Passportnumber && (row.HomeMaid?.Nationality || row.HomeMaid?.Nationalitycopy) && (
                            <span className="text-gray-300">|</span>
                          )}
                          {(row.HomeMaid?.Nationality || row.HomeMaid?.Nationalitycopy) && (
                            <span>{row.HomeMaid.Nationality || row.HomeMaid.Nationalitycopy}</span>
                          )}
                        </div>
                      </td>

                      {/* Old Client */}
                      <td className="p-3.5 text-center">
                        {row.OldClient?.fullname ? (
                          <>
                            <div
                              onClick={() => {
                                if (oldClientId) router.push(`/admin/clientdetails?id=${oldClientId}`);
                              }}
                              className="font-medium text-teal-800 hover:text-teal-900 hover:underline cursor-pointer inline-block transition-colors"
                              title="عرض ملف العميل المتنازل"
                            >
                              {row.OldClient.fullname}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1.5 flex-wrap">
                              {row.OldClient.phonenumber && (
                                <span dir="ltr" className="font-mono text-gray-600">
                                  {row.OldClient.phonenumber}
                                </span>
                              )}
                              {row.OldClient.phonenumber && row.OldClient.city && (
                                <span className="text-gray-300">|</span>
                              )}
                              {row.OldClient.city && <span>{formatSaudiCity(row.OldClient.city)}</span>}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>

                      {/* New Client */}
                      <td className="p-3.5 text-center">
                        {row.NewClient?.fullname ? (
                          <>
                            <div
                              onClick={() => {
                                if (newClientId) router.push(`/admin/clientdetails?id=${newClientId}`);
                              }}
                              className="font-medium text-teal-800 hover:text-teal-900 hover:underline cursor-pointer inline-block transition-colors"
                              title="عرض ملف العميل المستلم"
                            >
                              {row.NewClient.fullname}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1.5 flex-wrap">
                              {row.NewClient.phonenumber && (
                                <span dir="ltr" className="font-mono text-gray-600">
                                  {row.NewClient.phonenumber}
                                </span>
                              )}
                              {row.NewClient.phonenumber && row.NewClient.city && (
                                <span className="text-gray-300">|</span>
                              )}
                              {row.NewClient.city && <span>{formatSaudiCity(row.NewClient.city)}</span>}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>

                      {/* في تبويب التجربة أو فشلت التجربة: تفاصيل مدة التجربة واليومية */}
                      {activeTab !== 'completed' && (
                        <>
                          <td className="p-3.5 text-center">
                            <div className="flex flex-col items-center gap-0.5 text-xs">
                              <span className="font-semibold text-gray-800">
                                {row.ExperimentDuration || 'غير محددة'}
                              </span>
                              {row.dailyCost ? (
                                <span className="text-teal-700 font-mono font-medium">
                                  اليومية: {Number(row.dailyCost).toLocaleString()} ر.س
                                </span>
                              ) : row.Cost ? (
                                <span className="text-gray-500 font-mono">
                                  التكلفة: {Number(row.Cost).toLocaleString()} ر.س
                                </span>
                              ) : null}
                            </div>
                          </td>

                          <td className="p-3.5 text-center text-xs font-mono text-gray-700" dir="ltr">
                            {(() => {
                              const rawStart = row.ExperimentStart || row.TransferingDate || row.createdAt;
                              if (!rawStart) return <span className="text-gray-400 font-sans">-</span>;

                              const startDate = new Date(rawStart);
                              const startStr = isNaN(startDate.getTime())
                                ? String(rawStart).split('T')[0]
                                : startDate.toISOString().split('T')[0];

                              let endStr = '';
                              if (row.ExperimentEnd) {
                                const endDate = new Date(row.ExperimentEnd);
                                if (!isNaN(endDate.getTime())) {
                                  endStr = endDate.toISOString().split('T')[0];
                                }
                              }

                              // إذا لم يكن هناك تاريخ نهاية مسجل في قاعدة البيانات، نحسبه تلقائياً بناءً على مدة التجربة (مثل 7 يوم)
                              if (!endStr && row.ExperimentDuration && !isNaN(startDate.getTime())) {
                                const daysMatch = String(row.ExperimentDuration).match(/\d+/);
                                if (daysMatch) {
                                  const days = parseInt(daysMatch[0], 10);
                                  if (days > 0) {
                                    const computedEnd = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
                                    endStr = computedEnd.toISOString().split('T')[0];
                                  }
                                }
                              }

                              return (
                                <div className="flex flex-col items-center gap-1 font-mono text-xs text-gray-800" dir="ltr">
                                  <span className="font-semibold text-gray-800">{startStr}</span>
                                  {endStr && (
                                    <div className="flex items-center gap-1 text-gray-600">
                                      <span className="font-semibold text-gray-800">{endStr}</span>
                                      <svg
                                        className="w-3.5 h-3.5 text-gray-400 shrink-0"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polyline points="9 10 4 15 9 20" />
                                        <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                        </>
                      )}

                      {/* في تبويب المكتملة: السجل المالي */}
                      {activeTab === 'completed' && (
                        <td className="p-3.5 text-center relative">
                          <div className="relative inline-block group text-center">
                            <div
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border cursor-help shadow-2xs transition-all duration-150 hover:shadow-xs ${finStatus.badgeBg} ${finStatus.badgeText} ${finStatus.badgeBorder}`}
                            >
                              <span className="text-sm leading-none">{finStatus.icon}</span>
                              <span className="whitespace-nowrap">{finStatus.label}</span>
                            </div>

                            {/* Tooltip */}
                            <div
                              className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 hidden group-hover:block z-50 w-64 p-3 bg-gray-900/95 text-white text-xs rounded-xl shadow-2xl backdrop-blur-sm transition-all pointer-events-none text-right border border-gray-700"
                              dir="rtl"
                            >
                              <p className="font-bold text-teal-300 mb-1.5 flex items-center gap-1">
                                <span>{finStatus.icon}</span>
                                <span>{finStatus.shortLabel}</span>
                              </p>
                              <p className="text-gray-200 text-[11px] leading-relaxed mb-2">
                                {finStatus.tooltip}
                              </p>
                              <div className="space-y-1 text-[11px] border-t border-gray-700/60 pt-1.5">
                                <div className="flex justify-between items-center text-gray-300">
                                  <span>الإجمالي:</span>
                                  <span className="font-semibold text-white font-mono">
                                    {finStatus.total > 0 ? `${finStatus.total.toLocaleString()} ر.س` : 'غير محدد'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-gray-300">
                                  <span>المسدد:</span>
                                  <span className="font-semibold text-emerald-400 font-mono">
                                    {finStatus.paid.toLocaleString()} ر.س
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-gray-300 border-t border-gray-700 pt-0.5">
                                  <span>المتبقي:</span>
                                  <span className={`font-bold font-mono ${finStatus.remaining > 0 ? 'text-rose-400' : 'text-gray-300'}`}>
                                    {finStatus.remaining.toLocaleString()} ر.س
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* المرحلة / حالة التجربة */}
                      <td className="p-3.5 text-center">
                        {renderStageBadge(row.transferStage, row.ExperimentRate)}
                      </td>

                      {/* تاريخ المعاملة (للتبويبات المكتملة) */}
                      {activeTab === 'completed' && (
                        <td className="p-3.5 text-center text-sm font-mono text-gray-700" dir="ltr">
                          {(() => {
                            const dateVal = row.TransferingDate || row.ContractDate || row.createdAt;
                            if (!dateVal) return '-';
                            const dateObj = new Date(dateVal);
                            if (isNaN(dateObj.getTime())) return String(dateVal);
                            const y = dateObj.getFullYear();
                            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                            const d = String(dateObj.getDate()).padStart(2, '0');
                            return `${y}/${m}/${d}`;
                          })()}
                        </td>
                      )}

                      {/* الإجراءات */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-3">
                          {/* إذا كانت التجربة قيد المعالجة / جارية: أزرار إتمام النقل أو إرجاع السكن */}
                          {isTrialRecord && !isTransferCompleted && !isTrialFailed && (
                            <>
                              {/* زر الصح: إتمام ونقل الكفالة (يتطلب صلاحية إنشاء نقل الكفالة) */}
                              {permissions?.canCreate !== false && (
                                <div className="relative group inline-flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => handleCompleteTransferRow(row)}
                                    className="p-1 text-green-600 hover:text-green-800 transition-transform duration-200 hover:scale-125 active:scale-95 cursor-pointer bg-transparent border-0"
                                    title="إتمام ونقل الكفالة"
                                  >
                                    <Check className="w-5 h-5 stroke-[2.5]" />
                                  </button>
                                  {/* Animated Tooltip */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30 transition-all duration-200">
                                    <span className="whitespace-nowrap px-2.5 py-1 bg-gray-900 text-white text-[11px] font-bold rounded-md shadow-lg">
                                      إتمام النقل
                                    </span>
                                    <span className="w-1.5 h-1.5 bg-gray-900 rotate-45 -mt-1" />
                                  </div>
                                </div>
                              )}

                              {/* زر الخطأ: فشل التجربة وإرجاع للسكن (يتطلب صلاحية تعديل) */}
                              {permissions?.canEdit !== false && (
                                <div className="relative group inline-flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => setFailModalTransfer(row)}
                                    className="p-1 text-red-600 hover:text-red-800 transition-transform duration-200 hover:scale-125 active:scale-95 cursor-pointer bg-transparent border-0"
                                    title="فشل وإرجاع للسكن"
                                  >
                                    <X className="w-5 h-5 stroke-[2.5]" />
                                  </button>
                                  {/* Animated Tooltip */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30 transition-all duration-200">
                                    <span className="whitespace-nowrap px-2.5 py-1 bg-gray-900 text-white text-[11px] font-bold rounded-md shadow-lg">
                                      فشل وإرجاع للسكن
                                    </span>
                                    <span className="w-1.5 h-1.5 bg-gray-900 rotate-45 -mt-1" />
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                          {/* زر العين: عرض تفاصيل المعاملة */}
                          <div className="relative group inline-flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setViewModalTransfer(row)}
                              className="p-1 text-gray-700 hover:text-teal-800 transition-transform duration-200 hover:scale-125 active:scale-95 cursor-pointer bg-transparent border-0"
                              title="عرض تفاصيل المعاملة"
                            >
                              <Eye className="w-5 h-5 stroke-[2]" />
                            </button>
                            {/* Animated Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30 transition-all duration-200">
                              <span className="whitespace-nowrap px-2.5 py-1 bg-gray-900 text-white text-[11px] font-bold rounded-md shadow-lg">
                                عرض التفاصيل
                              </span>
                              <span className="w-1.5 h-1.5 bg-gray-900 rotate-45 -mt-1" />
                            </div>
                          </div>

                          {/* زر التعديل: تعديل المعاملة (إذا لديه صلاحية التعديل) */}
                          {permissions?.canEdit !== false && (
                            <div className="relative group inline-flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onEditTransaction) onEditTransaction(row.id);
                                  else router.push(`/admin/AddTransactionForm?id=${row.id}`);
                                }}
                                className="p-1 text-teal-700 hover:text-teal-900 transition-transform duration-200 hover:scale-125 active:scale-95 cursor-pointer bg-transparent border-0"
                                title="تعديل المعاملة"
                              >
                                <Edit className="w-5 h-5 stroke-[2]" />
                              </button>
                              {/* Animated Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30 transition-all duration-200">
                                <span className="whitespace-nowrap px-2.5 py-1 bg-gray-900 text-white text-[11px] font-bold rounded-md shadow-lg">
                                  تعديل المعاملة
                                </span>
                                <span className="w-1.5 h-1.5 bg-gray-900 rotate-45 -mt-1" />
                              </div>
                            </div>
                          )}

                          {/* زر الحذف: حذف المعاملة (إذا لديه صلاحية الحذف) */}
                          {permissions?.canDelete === true && (
                            <div className="relative group inline-flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setDeleteModalTransfer(row)}
                                className="p-1 text-red-600 hover:text-red-800 transition-transform duration-200 hover:scale-125 active:scale-95 cursor-pointer bg-transparent border-0"
                                title="حذف المعاملة"
                              >
                                <Trash2 className="w-5 h-5 stroke-[2]" />
                              </button>
                              {/* Animated Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30 transition-all duration-200">
                                <span className="whitespace-nowrap px-2.5 py-1 bg-gray-900 text-white text-[11px] font-bold rounded-md shadow-lg">
                                  حذف المعاملة
                                </span>
                                <span className="w-1.5 h-1.5 bg-gray-900 rotate-45 -mt-1" />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Pagination Bar */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 bg-gray-50/60 border-t border-gray-100 text-sm">
            <p className="text-gray-600 text-xs sm:text-sm">
              عرض{' '}
              <span className="font-semibold text-gray-900 font-mono">
                {(currentPage - 1) * limit + 1}
              </span>{' '}
              إلى{' '}
              <span className="font-semibold text-gray-900 font-mono">
                {Math.min(currentPage * limit, pagination.total)}
              </span>{' '}
              من أصل{' '}
              <span className="font-semibold text-gray-900 font-mono">
                {pagination.total}
              </span>{' '}
              معاملة
            </p>

            <nav className="flex items-center gap-1.5" dir="ltr">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={!pagination.hasPrev}
                className={`p-1.5 rounded-lg border text-sm transition-all ${
                  pagination.hasPrev
                    ? 'bg-white border-gray-200 text-gray-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 cursor-pointer shadow-2xs'
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title="الصفحة السابقة"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (pagination.totalPages <= 7) return true;
                  return (
                    p === 1 ||
                    p === pagination.totalPages ||
                    Math.abs(p - currentPage) <= 1
                  );
                })
                .map((page, idx, arr) => {
                  const prevPage = arr[idx - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <div key={page} className="flex items-center gap-1.5">
                      {showEllipsis && (
                        <span className="text-gray-400 text-xs px-1">...</span>
                      )}
                      <button
                        onClick={() => goToPage(page)}
                        className={`min-w-[32px] h-8 px-2.5 rounded-lg text-xs font-bold transition-all ${
                          page === currentPage
                            ? 'bg-teal-800 text-white shadow-xs border border-teal-900'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 cursor-pointer'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  );
                })}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={!pagination.hasNext}
                className={`p-1.5 rounded-lg border text-sm transition-all ${
                  pagination.hasNext
                    ? 'bg-white border-gray-200 text-gray-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 cursor-pointer shadow-2xs'
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title="الصفحة التالية"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* 7. Modal: إتمام نقل الكفالة وتأكيد نجاح التجربة */}
      {completeModalTransfer && (
        <CompleteTransferModal
          transfer={completeModalTransfer}
          onClose={() => setCompleteModalTransfer(null)}
          onSuccess={() => {
            setCompleteModalTransfer(null);
            fetchTransfers();
            fetchAllData();
          }}
        />
      )}

      {/* 8. Modal: توثيق فشل التجربة وإرجاع العاملة للسكن */}
      {failModalTransfer && (
        <FailTrialModal
          transfer={failModalTransfer}
          onClose={() => setFailModalTransfer(null)}
          onSuccess={() => {
            setFailModalTransfer(null);
            fetchTransfers();
            fetchAllData();
          }}
        />
      )}

      {/* 9. Modal: عرض تفاصيل المعاملة */}
      {viewModalTransfer && (
        <ViewTransferDetailsModal
          transfer={viewModalTransfer}
          onClose={() => setViewModalTransfer(null)}
          canEdit={permissions?.canEdit !== false}
          onEdit={() => {
            const id = viewModalTransfer.id;
            setViewModalTransfer(null);
            if (onEditTransaction) onEditTransaction(id);
            else router.push(`/admin/AddTransactionForm?id=${id}`);
          }}
          renderStageBadge={renderStageBadge}
        />
      )}

      {/* 10. Modal: تأكيد حذف المعاملة */}
      {deleteModalTransfer && (
        <DeleteTransferModal
          transfer={deleteModalTransfer}
          onClose={() => setDeleteModalTransfer(null)}
          onConfirm={() => handleDeleteTransfer(deleteModalTransfer.id)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal Component: إتمام ونقل الكفالة
// ─────────────────────────────────────────────────────────────────────────────
function CompleteTransferModal({
  transfer,
  onClose,
  onSuccess,
}: {
  transfer: Transfer;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [completionDate, setCompletionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [contractDate, setContractDate] = useState(
    transfer.ContractDate
      ? new Date(transfer.ContractDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [transferOpNum, setTransferOpNum] = useState(
    transfer.TransferOperationNumber || ''
  );
  const [cost, setCost] = useState(transfer.Cost ? String(transfer.Cost) : '');
  const [paid, setPaid] = useState(transfer.Paid ? String(transfer.Paid) : '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const remaining = useMemo(() => {
    const c = parseFloat(cost || '0');
    const p = parseFloat(paid || '0');
    if (isNaN(c) || isNaN(p)) return 0;
    return Math.max(0, c - p);
  }, [cost, paid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      await axios.post('/api/transferSponsorShips', {
        action: 'complete_transfer',
        transferId: transfer.id,
        completionDate,
        contractDate,
        transferOpNum,
        cost: cost ? parseFloat(cost) : undefined,
        paid: paid ? parseFloat(paid) : undefined,
        remainingCost: remaining,
        notes,
      });

      alert(`✅ تم إتمام نقل كفالة العاملة (${transfer.HomeMaid?.Name || ''}) بنجاح وانتقالها إلى الكفيل الجديد!`);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'حدث خطأ أثناء حفظ ونقل الكفالة');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-lg p-6 flex flex-col gap-4 text-right animate-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-green-50 text-green-800 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">إتمام ونقل الكفالة رسمياً</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                تأكيد نجاح التجربة واستكمال بيانات نقل الكفالة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Worker Summary Banner */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-3.5 text-xs text-gray-800 flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">العاملة:</span>
            <span className="font-bold text-green-950 text-sm">{transfer.HomeMaid?.Name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">الكفيل المتنازل:</span>
            <span className="font-semibold text-gray-800">{transfer.OldClient?.fullname || '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">الكفيل الجديد (المستلم):</span>
            <span className="font-bold text-teal-900">{transfer.NewClient?.fullname || '-'}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">تاريخ إتمام النقل *</label>
              <input
                type="date"
                required
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">تاريخ العقد *</label>
              <input
                type="date"
                required
                value={contractDate}
                onChange={(e) => setContractDate(e.target.value)}
                className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">رقم عملية النقل في مساند / أبشر</label>
            <input
              type="text"
              placeholder="مثال: 987654321"
              value={transferOpNum}
              onChange={(e) => setTransferOpNum(e.target.value)}
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">إجمالي التكلفة (ر.س)</label>
              <input
                type="number"
                placeholder="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">المبلغ المسدد (ر.س)</label>
              <input
                type="number"
                placeholder="0"
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
                className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">المتبقي</label>
              <div className="w-full h-10 bg-gray-100 border border-gray-200 rounded-xl px-3 flex items-center font-mono font-bold text-xs text-gray-700">
                {remaining.toLocaleString()} ر.س
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">ملاحظات إضافية</label>
            <textarea
              rows={2}
              placeholder="أي تفاصيل أو ملاحظات حول إتمام المعاملة..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 mt-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'جاري الحفظ...' : 'تأكيد إتمام ونقل الكفالة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal Component: عرض تفاصيل المعاملة بالكامل (منفصل عن التعديل)
// ─────────────────────────────────────────────────────────────────────────────
function ViewTransferDetailsModal({
  transfer,
  onClose,
  onEdit,
  canEdit = true,
  renderStageBadge,
}: {
  transfer: Transfer;
  onClose: () => void;
  onEdit: () => void;
  canEdit?: boolean;
  renderStageBadge: (stage?: string | null, rate?: string | null) => React.ReactNode;
}) {
  const cost = Number(transfer.Cost || 0);
  const paid = Number(transfer.Paid || 0);
  const remaining = Math.max(0, cost - paid);
  const durationNum = parseFloat(String(transfer.ExperimentDuration || '').replace(/[^\d.]/g, '')) || 0;
  const dailyCostNum = parseFloat(String(transfer.dailyCost || '0')) || 0;
  const totalTrialCost = durationNum * dailyCostNum;
  const contractDateVal = transfer.TransferingDate || transfer.ContractDate || '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 sm:p-6 my-6 text-right animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-base shadow-inner">
              #{transfer.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  معاملة نقل كفالة #{transfer.id}
                </h3>
                {renderStageBadge(transfer.transferStage, transfer.ExperimentRate)}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                تاريخ التسجيل: {transfer.createdAt ? new Date(transfer.createdAt).toLocaleDateString('ar-SA') : '-'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content Matching AddTransactionForm Exactly */}
        <div className="overflow-y-auto pr-1 space-y-5 text-xs text-gray-700 flex-1">

          {/* 1. بطاقة معلومات العاملة */}
          <section className="bg-gray-50/70 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-gray-200/80">
              <div className="w-6 h-6 rounded-md bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h4 className="text-sm font-bold text-gray-900 m-0">معلومات العاملة</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">اسم العاملة</span>
                <span className="font-bold text-gray-900 text-xs">{transfer.HomeMaid?.Name || '-'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">الجنسية</span>
                <span className="font-semibold text-gray-800 text-xs">{transfer.HomeMaid?.Nationalitycopy || transfer.HomeMaid?.Nationality || '-'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">رقم جواز السفر</span>
                <span className="font-mono font-semibold text-gray-800 text-xs" dir="ltr">{transfer.HomeMaid?.Passportnumber || '-'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">رقم الإقامة</span>
                <span className="font-mono font-bold text-teal-900 text-xs" dir="ltr">{transfer.NationalID || '-'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">تاريخ دخول المملكة</span>
                <span className="font-mono font-semibold text-gray-800 text-xs" dir="ltr">
                  {transfer.EntryDate ? String(transfer.EntryDate).split('T')[0] : '-'}
                </span>
              </div>
            </div>
          </section>

          {/* 2. بطاقة معلومات الكفيل الحالي (المتنازل) */}
          <section className="bg-gray-50/70 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-gray-200/80">
              <div className="w-6 h-6 rounded-md bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h4 className="text-sm font-bold text-gray-900 m-0">معلومات الكفيل الحالي (المتنازل)</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">اسم الكفيل الحالي</span>
                <span className="font-bold text-gray-900 text-xs">{transfer.OldClient?.fullname || '-'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">رقم الهاتف</span>
                <span className="font-mono font-semibold text-gray-800 text-xs" dir="ltr">{transfer.OldClient?.phonenumber || '-'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">رقم الهوية</span>
                <span className="font-mono font-semibold text-gray-800 text-xs" dir="ltr">{transfer.OldClient?.nationalId || (transfer.OldClientId ? String(transfer.OldClientId) : '-')}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">المدينة</span>
                <span className="font-semibold text-gray-800 text-xs">{formatSaudiCity(transfer.OldClient?.city)}</span>
              </div>
            </div>
          </section>

          {/* 3. بطاقة معلومات الكفيل الجديد والمرفقات */}
          <section className="bg-gray-50/70 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-gray-200/80">
              <div className="w-6 h-6 rounded-md bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h4 className="text-sm font-bold text-gray-900 m-0">معلومات الكفيل الجديد والمرفقات</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">اسم الكفيل الجديد</span>
                <span className="font-bold text-gray-900 text-xs">{transfer.NewClient?.fullname || '-'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">رقم الجوال الأساسي</span>
                <span className="font-mono font-semibold text-gray-800 text-xs" dir="ltr">{transfer.NewClient?.phonenumber || '-'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">رقم جوال بديل / إضافي</span>
                <span className="font-mono font-semibold text-gray-800 text-xs" dir="ltr">{transfer.NewClient?.alternativePhone || '-'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">رقم الهوية الوطنية / الإقامة للكفيل</span>
                <span className="font-mono font-semibold text-gray-800 text-xs" dir="ltr">{transfer.NewClient?.nationalId || (transfer.NewClientId ? String(transfer.NewClientId) : '-')}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">مدينة الإقامة / السكن</span>
                <span className="font-semibold text-gray-800 text-xs">{formatSaudiCity(transfer.NewClient?.city)}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">تاريخ ميلاد الكفيل</span>
                <span className="font-mono font-semibold text-gray-800 text-xs" dir="ltr">
                  {transfer.NewClient?.dateofbirth ? String(transfer.NewClient.dateofbirth).split('T')[0] : '-'}
                </span>
              </div>
            </div>

            {/* مستندات الكفيل الجديد المرفوعة */}
            <div className="border-t border-gray-200/80 pt-3 mt-3">
              <span className="font-bold text-gray-800 block mb-2 text-xs">مستندات الكفيل الجديد المرفوعة:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. تعريف الراتب */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-800" />
                    <div>
                      <span className="font-bold text-gray-800 block text-xs">تعريف الراتب / الشهادة البنكية</span>
                      <span className="text-[10px] text-gray-400">{transfer.salaryCertificateFile ? 'تم الإرفاق' : 'غير مرفق'}</span>
                    </div>
                  </div>
                  {transfer.salaryCertificateFile && transfer.salaryCertificateFile.trim() !== '' && transfer.salaryCertificateFile !== 'عرض' && transfer.salaryCertificateFile !== 'غير متوفر' ? (
                    <a
                      href={transfer.salaryCertificateFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-lg text-xs transition-colors border border-teal-200 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      معاينة الملف
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs">غير مرفق</span>
                  )}
                </div>

                {/* 2. العنوان الوطني */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-800" />
                    <div>
                      <span className="font-bold text-gray-800 block text-xs">إثبات العنوان الوطني للكفيل</span>
                      <span className="text-[10px] text-gray-400">{transfer.nationalAddressFile ? 'تم الإرفاق' : 'غير مرفق'}</span>
                    </div>
                  </div>
                  {transfer.nationalAddressFile && transfer.nationalAddressFile.trim() !== '' && transfer.nationalAddressFile !== 'عرض' && transfer.nationalAddressFile !== 'غير متوفر' ? (
                    <a
                      href={transfer.nationalAddressFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-lg text-xs transition-colors border border-teal-200 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      معاينة الملف
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs">غير مرفق</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 4. بطاقة بيانات فترة التجربة */}
          <section className="bg-gray-50/70 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-gray-200/80">
              <div className="w-6 h-6 rounded-md bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-xs">
                4
              </div>
              <h4 className="text-sm font-bold text-gray-900 m-0">بيانات فترة التجربة</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">مدة التجربة (بالأيام)</span>
                <span className="font-bold text-gray-900 text-xs">{transfer.ExperimentDuration || '-'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">التكلفة اليومية (ر.س/يوم)</span>
                <span className="font-mono font-bold text-teal-900 text-xs">{transfer.dailyCost ? `${Number(transfer.dailyCost).toLocaleString()} ر.س` : '0 ر.س'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">إجمالي تكلفة التجربة</span>
                <span className="font-mono font-bold text-teal-900 text-xs">{totalTrialCost > 0 ? `${totalTrialCost.toLocaleString()} ر.س` : '0 ر.س'}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">تاريخ بداية التجربة</span>
                <span className="font-mono font-semibold text-gray-800 text-xs" dir="ltr">
                  {transfer.ExperimentStart ? String(transfer.ExperimentStart).split('T')[0] : '-'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-gray-400 block text-[11px] mb-0.5">تاريخ نهاية التجربة</span>
                <span className="font-mono font-semibold text-gray-800 text-xs" dir="ltr">
                  {transfer.ExperimentEnd ? String(transfer.ExperimentEnd).split('T')[0] : '-'}
                </span>
              </div>
            </div>

            {/* ملاحظات إضافية على التجربة */}
            {transfer.Notes && (
              <div className="bg-white border border-gray-200 rounded-lg p-2.5 mt-2">
                <span className="text-gray-400 block text-[11px] mb-0.5">ملاحظات إضافية على التجربة:</span>
                <p className="text-gray-800 text-xs whitespace-pre-wrap leading-relaxed m-0">{transfer.Notes}</p>
              </div>
            )}
          </section>

          {/* 5. بطاقة تفاصيل المعاملة، المالية ونقل الخدمات النهائي */}
          <section className="bg-gray-50/70 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-gray-200/80">
              <div className="w-6 h-6 rounded-md bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-xs">
                5
              </div>
              <h4 className="text-sm font-bold text-gray-900 m-0">تفاصيل المعاملة، المالية ونقل الخدمات النهائي</h4>
            </div>

            {/* البيانات المالية ومستحقات نقل الكفالة */}
            <div className="mb-4">
              <span className="font-bold text-gray-800 block mb-2 text-xs">البيانات المالية ومستحقات نقل الكفالة:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <span className="text-gray-400 block text-[11px] mb-1">إجمالي تكلفة نقل الكفالة (ر.س)</span>
                  <span className="font-mono font-bold text-gray-900 text-sm">{cost.toLocaleString()} ر.س</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <span className="text-gray-400 block text-[11px] mb-1">المبلغ المدفوع (ر.س)</span>
                  <span className="font-mono font-bold text-green-700 text-sm">{paid.toLocaleString()} ر.س</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <span className="text-gray-400 block text-[11px] mb-1">المتبقي (ر.س)</span>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={`font-mono font-bold text-sm ${remaining > 0 ? 'text-red-600' : 'text-green-700'}`}>
                      {remaining.toLocaleString()} ر.س
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${remaining === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {remaining === 0 ? 'مسدد بالكامل' : 'مستحق'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* المرفقات المالية */}
            <div className="border-t border-gray-200/80 pt-3 mb-4">
              <span className="font-bold text-gray-800 block mb-2 text-xs">المرفقات المالية المطلوبة:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* إيصال سداد الدفعة */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-800" />
                    <div>
                      <span className="font-bold text-gray-800 block text-xs">إيصال سداد دفعة نقل الكفالة</span>
                      <span className="text-[10px] text-gray-400">{transfer.paymentReceiptFile ? 'تم الإرفاق' : 'غير مرفق'}</span>
                    </div>
                  </div>
                  {transfer.paymentReceiptFile && transfer.paymentReceiptFile.trim() !== '' && transfer.paymentReceiptFile !== 'عرض' && transfer.paymentReceiptFile !== 'غير متوفر' ? (
                    <a
                      href={transfer.paymentReceiptFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-lg text-xs transition-colors border border-teal-200 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      معاينة
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs">غير مرفق</span>
                  )}
                </div>

                {/* سند لأمر بالمتبقي */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-800" />
                    <div>
                      <span className="font-bold text-gray-800 block text-xs">سند لأمر بالمتبقي</span>
                      <span className="text-[10px] text-gray-400">{transfer.promissoryNoteFile ? 'تم الإرفاق' : 'غير مرفق'}</span>
                    </div>
                  </div>
                  {transfer.promissoryNoteFile && transfer.promissoryNoteFile.trim() !== '' && transfer.promissoryNoteFile !== 'عرض' && transfer.promissoryNoteFile !== 'غير متوفر' ? (
                    <a
                      href={transfer.promissoryNoteFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-lg text-xs transition-colors border border-teal-200 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      معاينة
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs">غير مرفق</span>
                  )}
                </div>
              </div>
            </div>

            {/* بيانات العقد */}
            <div className="border-t border-gray-200/80 pt-3">
              <span className="font-bold text-gray-800 block mb-2 text-xs">بيانات العقد:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* رقم العقد */}
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-gray-400 block text-[11px] mb-0.5">رقم العقد</span>
                  <span className="font-mono font-bold text-gray-900 text-xs">{transfer.TransferOperationNumber || '-'}</span>
                </div>

                {/* تاريخ العقد (تاريخ واحد فقط) */}
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-gray-400 block text-[11px] mb-0.5">تاريخ العقد</span>
                  <span className="font-mono font-bold text-gray-900 text-xs" dir="ltr">
                    {contractDateVal ? String(contractDateVal).split('T')[0] : '-'}
                  </span>
                </div>

                {/* ملف العقد */}
                <div className="bg-white p-2.5 rounded-lg border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 block text-[11px] mb-0.5">ملف العقد</span>
                    <span className="font-bold text-gray-800 text-xs">
                      {transfer.file && transfer.file.trim() !== '' && transfer.file !== 'عرض' && transfer.file !== 'غير متوفر' ? 'ملف مرفق' : 'غير مرفق'}
                    </span>
                  </div>
                  {transfer.file && transfer.file.trim() !== '' && transfer.file !== 'عرض' && transfer.file !== 'غير متوفر' ? (
                    <a
                      href={transfer.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-lg text-xs transition-colors border border-teal-200 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      معاينة
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>تعديل هذه المعاملة</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal Component: تأكيد حذف معاملة نقل الكفالة
// ─────────────────────────────────────────────────────────────────────────────
function DeleteTransferModal({
  transfer,
  onClose,
  onConfirm,
  isDeleting,
}: {
  transfer: Transfer;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 text-right animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">تأكيد حذف المعاملة</h3>
            <p className="text-xs text-gray-500 mt-0.5">معاملة نقل كفالة #{transfer.id}</p>
          </div>
        </div>

        <p className="text-xs text-gray-700 leading-relaxed">
          هل أنت متأكد من رغبتك في حذف معاملة نقل الكفالة الخاصة بالعاملة{' '}
          <strong className="text-gray-900">{transfer.HomeMaid?.Name || `#${transfer.id}`}</strong>{' '}
          لصالح الكفيل{' '}
          <strong className="text-gray-900">{transfer.NewClient?.fullname || 'المحدد'}</strong>؟
          <br />
          <span className="text-red-600 font-semibold block mt-1.5">⚠️ لا يمكن التراجع عن هذا الإجراء بعد الحذف.</span>
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف نهائياً'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}