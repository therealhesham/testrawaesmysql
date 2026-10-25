import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Head from 'next/head';
import axios from 'axios';
import {
  UserX,
  Plane,
  Building,
  RefreshCw,
  Search,
  Calendar,
  AlertTriangle,
  Clock,
  DollarSign,
  FileText,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Lock,
  Plus,
  Eye,
  Filter,
  X,
  ExternalLink,
  ChevronDown,
  UserCheck,
  ShieldAlert,
  ShieldOff,
  Edit3,
  Upload,
  Check,
  Bot,
  Loader2,
  Phone,
  CreditCard,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Archive,
  Trash2,
} from 'lucide-react';
import Layout from 'example/containers/Layout';
import { DateInputField, TimeInputField, toEnglishDigits } from 'components/admin/DateTimeInputs';
import { getCountryFlagUrl } from 'lib/flagHelper';

interface WorkerEscapeItem {
  id: number;
  escapeType: 'airport' | 'housing' | 'trial_transfer' | 'client';
  homeMaidId: number;
  orderId: number | null;
  clientId: number | null;
  housedWorkerId: number | null;
  transferId: number | null;
  escapeDate: string;
  escapeTime: string | null;
  arrivalDate: string | null;
  daysSinceArrival: number | null;
  isWithinWarranty: boolean;
  visaFeeRequired: boolean;
  visaFeeAmount: number;
  visaFeeStatus: string;
  reportFile: string | null;
  notes: string | null;
  workerWageAmount: number | null;
  trialDaysCount: number | null;
  status: string;
  createdById: number | null;
  createdAt: string;
  homeMaid?: {
    id: number;
    Name: string;
    Passportnumber: string;
    Nationalitycopy: string;
    officeName?: string | null;
    job: string;
    Picture: any;
  };
  client?: {
    id: number;
    fullname: string;
    phonenumber: string;
    nationalId: string;
  };
  order?: {
    id: number;
    ClientName: string;
    nationalId?: string | null;
    orderStage: string;
    bookingstatus: string;
  };
}

interface EscapeCandidate {
  homeMaidId: number;
  housedWorkerId?: number | null;
  orderId?: number | null;
  clientId?: number | null;
  transferId?: number | null;
  name: string;
  passport: string;
  nationality: string;
  isExternal?: boolean;
  arrivalDate?: string | null;
  deliveryDate?: string | null;
  receiptFile?: string | null;
  houseentrydate?: string | null;
  trialStartDate?: string | null;
  trialEndDate?: string | null;
  location?: string | null;
  clientName?: string | null;
  clientPhone?: string | null;
  clientNationalId?: string | null;
  categoryLabel?: string;
}

const ESCAPE_TYPE_CARDS = [
  {
    id: 'housing' as const,
    title: 'هروب من السكن',
    subtitle: 'العاملات المتواجدات بالسكن حالياً',
    icon: Building,
    countKey: 'housing' as const,
  },
  {
    id: 'client' as const,
    title: 'هروب من العميل',
    subtitle: 'المسلمات بسند استلام موثق',
    icon: UserCheck,
    countKey: 'client' as const,
  },
  {
    id: 'trial_transfer' as const,
    title: 'أثناء تجربة نقل كفالة',
    subtitle: 'لدى الكفيل التجريبي الجديد',
    icon: RefreshCw,
    countKey: 'trial_transfer' as const,
  },
  {
    id: 'airport' as const,
    title: 'هروب من صالة المطار',
    subtitle: 'قادمة عبر رحلات الوصول',
    icon: Plane,
    countKey: 'airport' as const,
  },
];

export default function EscapesDashboardPage() {
  const [escapes, setEscapes] = useState<WorkerEscapeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'airport' | 'housing' | 'trial_transfer' | 'client'>('all');
  const [warrantyFilter, setWarrantyFilter] = useState<'all' | 'true' | 'false' | 'over_2_years'>('all');
  const [nationalityFilter, setNationalityFilter] = useState('all');
  const [officeFilter, setOfficeFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [availableNationalities, setAvailableNationalities] = useState<string[]>([]);
  const [availableOffices, setAvailableOffices] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'recorded' | 'archive'>('recorded');
  const [archiveTab, setArchiveTab] = useState<'all' | 'returned_to_housing' | 'deported'>('all');
  const [escapeTypeFilter, setEscapeTypeFilter] = useState('all');

  const [counts, setCounts] = useState({
    total: 0,
    airport: 0,
    housing: 0,
    trial_transfer: 0,
    client: 0,
    within_warranty: 0,
    outside_warranty: 0,
    over_two_years: 0,
    archive: 0,
    returned: 0,
    deported: 0,
  });

  // Modal details
  const [selectedEscape, setSelectedEscape] = useState<WorkerEscapeItem | null>(null);

  // New Escape Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    escapeType: 'housing' as 'airport' | 'housing' | 'trial_transfer' | 'client',
    homeMaidId: '',
    housedWorkerId: null as number | null,
    orderId: null as number | null,
    clientId: null as number | null,
    transferId: null as number | null,
    escapeDate: new Date().toISOString().split('T')[0],
    escapeTime: new Date().toTimeString().substring(0, 5),
    reportFile: '',
    notes: '',
  });

  // Dynamic Candidates State
  const [candidates, setCandidates] = useState<EscapeCandidate[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [debouncedCandidateSearch, setDebouncedCandidateSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<EscapeCandidate | null>(null);
  const [isManualIdMode, setIsManualIdMode] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<{
    housing?: number;
    airport?: number;
    trial_transfer?: number;
    client?: number;
  }>({});

  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Action Modals State
  const [deportationTarget, setDeportationTarget] = useState<WorkerEscapeItem | null>(null);
  const [isDeportationModalOpen, setIsDeportationModalOpen] = useState(false);
  const [deportationForm, setDeportationForm] = useState({
    externaldeparatureCity: 'الرياض',
    externalArrivalCity: '',
    externaldeparatureDate: new Date().toISOString().split('T')[0],
    externaldeparatureTime: '12:00',
    externalArrivalCityDate: new Date().toISOString().split('T')[0],
    externalArrivalCityTime: '18:00',
    externalTicketFile: '',
    notes: '',
  });
  const [isUploadingTicket, setIsUploadingTicket] = useState(false);
  const [isExtractingTicket, setIsExtractingTicket] = useState(false);
  const [ticketFileName, setTicketFileName] = useState('');
  const [ticketUploadError, setTicketUploadError] = useState('');
  const [isSubmittingDeportation, setIsSubmittingDeportation] = useState(false);

  // Runaway Report File Upload State
  const [isUploadingReport, setIsUploadingReport] = useState(false);
  const [reportFileName, setReportFileName] = useState('');
  const [reportUploadError, setReportUploadError] = useState('');
  const [isAttachingInline, setIsAttachingInline] = useState(false);

  // Edit Escape Modal State
  const [editingEscape, setEditingEscape] = useState<WorkerEscapeItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    escapeType: 'housing',
    escapeDate: '',
    escapeTime: '',
    notes: '',
    reportFile: '',
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isUploadingEditReport, setIsUploadingEditReport] = useState(false);
  const [editReportError, setEditReportError] = useState('');

  // Return to Housing Modal State
  const [returnHousingTarget, setReturnHousingTarget] = useState<WorkerEscapeItem | null>(null);
  const [isReturnHousingModalOpen, setIsReturnHousingModalOpen] = useState(false);
  const [returnHousingForm, setReturnHousingForm] = useState({
    houseentrydate: new Date().toISOString().split('T')[0],
    location_id: '',
    reason: 'تغييب عن العمل (هروب )',
    customReason: '',
    actionTaken: 'ترحيل',
    notes: '',
  });
  const [isSubmittingReturnHousing, setIsSubmittingReturnHousing] = useState(false);

  // Auxiliary data
  const [inHouseLocations, setInHouseLocations] = useState<Array<{ id: number; location: string }>>([]);
  const [deliveryOfficersList, setDeliveryOfficersList] = useState<string[]>([]);
  // Toast Notification state (matching housing-departures & transferSponsorships)
  const [toastNotification, setToastNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastNotification({ show: true, message, type });
    setTimeout(() => {
      setToastNotification((prev) => ({ ...prev, show: false }));
    }, 4000);
  }, []);

  // Backward compatibility alias for any existing setActionToast calls
  const setActionToast = useCallback((toast: { message: string; type: 'success' | 'error' } | null) => {
    if (toast) {
      showNotification(toast.message, toast.type);
    } else {
      setToastNotification((prev) => ({ ...prev, show: false }));
    }
  }, [showNotification]);

  useEffect(() => {
    setMounted(true);

    // Fetch locations
    axios.get('/api/inhouselocation').then((res) => {
      if (Array.isArray(res.data)) {
        setInHouseLocations(res.data.map((l: any) => ({ id: l.id, location: l.location })));
      }
    }).catch(() => {});

    // Fetch employees for delivery officers
    axios.get('/api/employees').then((res) => {
      const list = res.data?.employees || res.data || [];
      if (Array.isArray(list)) {
        setDeliveryOfficersList(list.map((e: any) => e.name || e.fullname).filter(Boolean));
      }
    }).catch(() => {});
  }, []);

  // Lock body scroll when modal is open to avoid page jitter/scroll shifts
  useEffect(() => {
    if (isAddModalOpen || selectedEscape || isDeportationModalOpen || isReturnHousingModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isAddModalOpen, selectedEscape, isDeportationModalOpen, isReturnHousingModalOpen]);

  const fetchEscapes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter === 'archive') {
        if (archiveTab === 'all') {
          params.append('status', 'archive');
        } else {
          params.append('status', archiveTab);
        }
        if (escapeTypeFilter !== 'all') {
          params.append('escapeType', escapeTypeFilter);
        }
      } else {
        params.append('status', 'recorded');
        if (activeTab !== 'all') {
          params.append('escapeType', activeTab);
        }
      }
      if (warrantyFilter !== 'all') params.append('isWithinWarranty', warrantyFilter);
      if (nationalityFilter !== 'all') params.append('nationality', nationalityFilter);
      if (officeFilter !== 'all') params.append('officeName', officeFilter);
      if (dateRangeFilter !== 'all') params.append('dateRange', dateRangeFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('page', String(page));
      params.append('pageSize', String(pageSize));

      const res = await axios.get(`/api/escapes?${params.toString()}`);
      if (res.data?.success) {
        setEscapes(res.data.escapes || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalCount(res.data.pagination?.totalCount || 0);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
        if (Array.isArray(res.data.availableNationalities) && res.data.availableNationalities.length > 0) {
          setAvailableNationalities(res.data.availableNationalities);
        }
        if (Array.isArray(res.data.availableOffices) && res.data.availableOffices.length > 0) {
          setAvailableOffices(res.data.availableOffices);
        }
      }
    } catch (err) {
      console.error('Error fetching escapes:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, activeTab, archiveTab, escapeTypeFilter, warrantyFilter, nationalityFilter, officeFilter, dateRangeFilter, searchQuery, page, pageSize]);

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter === 'archive') {
        if (archiveTab === 'all') {
          params.append('status', 'archive');
        } else {
          params.append('status', archiveTab);
        }
        if (escapeTypeFilter !== 'all') {
          params.append('escapeType', escapeTypeFilter);
        }
      } else {
        params.append('status', 'recorded');
        if (activeTab !== 'all') {
          params.append('escapeType', activeTab);
        }
      }
      if (warrantyFilter !== 'all') params.append('isWithinWarranty', warrantyFilter);
      if (nationalityFilter !== 'all') params.append('nationality', nationalityFilter);
      if (officeFilter !== 'all') params.append('officeName', officeFilter);
      if (dateRangeFilter !== 'all') params.append('dateRange', dateRangeFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('page', '1');
      params.append('pageSize', '5000');

      const res = await axios.get(`/api/escapes?${params.toString()}`);
      const list: WorkerEscapeItem[] = res.data?.escapes || escapes;

      if (!list || list.length === 0) {
        setActionToast({ message: 'لا توجد بيانات متاحة للتصدير', type: 'error' });
        return;
      }

      const rows = list.map((item, idx) => ({
        '#': idx + 1,
        'رقم البلاغ': item.id,
        'اسم العاملة': item.homeMaid?.Name || item.homeMaidId || '—',
        'الجنسية': item.homeMaid?.Nationalitycopy || '—',
        'رقم الجواز': item.homeMaid?.Passportnumber || '—',
        'المكتب الخارجي': item.homeMaid?.officeName || '—',
        'اسم العميل': item.client?.fullname || item.clientId || '—',
        'رقم جوال العميل': item.client?.phonenumber || '—',
        'هوية العميل': item.client?.nationalId || '—',
        'رقم الطلب': item.orderId || '—',
        'نوع الهروب': getEscapeTypeLabel(item.escapeType).label,
        'تاريخ الهروب': formatDate(item.escapeDate),
        'وقت الهروب': item.escapeTime || '—',
        'تاريخ الوصول': formatDate(item.arrivalDate),
        'الأيام منذ دخول المملكة': item.arrivalDate ? Math.max(0, Math.round((Date.now() - new Date(item.arrivalDate).getTime()) / (1000 * 60 * 60 * 24))) : '—',
        'موقف الضمان': (item.arrivalDate && Math.round((Date.now() - new Date(item.arrivalDate).getTime()) / (1000 * 60 * 60 * 24)) <= 90) ? 'داخل الضمان (≤ 90 يوم)' : 'خارج الضمان (> 90 يوم)',
        'حالة الإيواء': isOverTwoYears(item.arrivalDate) ? 'سقوط مسؤولية الإيواء (> سنتين)' : 'ضمن مسؤولية الإيواء',
        'حالة البلاغ': item.status === 'recorded' ? 'مسجل' : item.status === 'deported' ? 'تم الترحيل' : item.status === 'returned_to_housing' ? 'أعيد للسكن' : item.status,
        'الملاحظات': item.notes || '—',
      }));

      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'بلاغات_الهروب');
      XLSX.writeFile(wb, `سجل_بلاغات_الهروب_${new Date().toISOString().split('T')[0]}.xlsx`);

      setActionToast({ message: `تم تصدير ${rows.length} سجل بنجاح إلى ملف Excel`, type: 'success' });
    } catch (err) {
      console.error('Error exporting Excel:', err);
      setActionToast({ message: 'حدث خطأ أثناء تصدير ملف Excel', type: 'error' });
    } finally {
      setIsExportingExcel(false);
    }
  };

  useEffect(() => {
    fetchEscapes();
  }, [fetchEscapes]);

  // Fetch candidates matching the chosen escape type
  const fetchCandidates = useCallback(async (type: string, query: string = '') => {
    setIsLoadingCandidates(true);
    try {
      const res = await axios.get(`/api/escapes/candidates?type=${type}&query=${encodeURIComponent(query)}`);
      if (res.data?.success) {
        setCandidates(res.data.candidates || []);
        if (res.data.categoryCounts) {
          setCategoryCounts(res.data.categoryCounts);
        }
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
    } finally {
      setIsLoadingCandidates(false);
    }
  }, []);

  // Debounce candidateSearch input (400ms delay to reduce server requests)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCandidateSearch(candidateSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [candidateSearch]);

  // Fetch candidates when modal opens, escapeType changes, or debounced search changes
  useEffect(() => {
    if (!isAddModalOpen || isManualIdMode) return;
    fetchCandidates(addForm.escapeType, debouncedCandidateSearch);
  }, [isAddModalOpen, addForm.escapeType, debouncedCandidateSearch, isManualIdMode, fetchCandidates]);

  // Reset search and candidate selection when modal opens or escapeType changes
  useEffect(() => {
    if (isAddModalOpen) {
      setSelectedCandidate(null);
      setCandidateSearch('');
      setDebouncedCandidateSearch('');
      setIsManualIdMode(false);
    }
  }, [isAddModalOpen, addForm.escapeType]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.homeMaidId || !addForm.escapeDate) {
      setAddError('يرجى تحديد أو اختيار العاملة وتاريخ الهروب');
      return;
    }

    setIsSubmittingAdd(true);
    setAddError('');
    try {
      await axios.post('/api/escapes', addForm);
      setIsAddModalOpen(false);
      setAddForm({
        escapeType: 'housing',
        homeMaidId: '',
        housedWorkerId: null,
        orderId: null,
        clientId: null,
        transferId: null,
        escapeDate: new Date().toISOString().split('T')[0],
        escapeTime: new Date().toTimeString().substring(0, 5),
        reportFile: '',
        notes: '',
      });
      setSelectedCandidate(null);
      showNotification('تم تسجيل بلاغ الهروب وتحديث حالة العاملة بنجاح 🎉', 'success');
      fetchEscapes();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'حدث خطأ أثناء حفظ بلاغ الهروب';
      setAddError(errMsg);
      showNotification(errMsg, 'error');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return '—';
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    } catch {
      return '—';
    }
  };

  const isOverTwoYears = (arrivalDate?: string | null) => {
    if (!arrivalDate) return false;
    try {
      const arr = new Date(arrivalDate);
      if (isNaN(arr.getTime())) return false;
      const diffDays = Math.round((Date.now() - arr.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 730;
    } catch {
      return false;
    }
  };

  const SAUDI_CITIES_LIST = [
    'الرياض', 'جدة', 'الدمام', 'المدينة المنورة', 'القصيم', 'أبها', 'تبوك', 'جازان', 'حائل', 'نجران', 'ينبع', 'الطائف', 'الهفوف'
  ];

  const IATA_TO_CITY_MAP: Record<string, string> = {
    'RUH': 'الرياض', 'JED': 'جدة', 'MED': 'المدينة المنورة', 'DMM': 'الدمام', 'AHB': 'أبها', 'ELQ': 'القصيم', 'TUI': 'طريف', 'TAB': 'تبوك', 'HIL': 'حائل', 'GJI': 'جازان', 'HOF': 'الهفوف', 'EAM': 'نجران', 'YNB': 'ينبع',
    'CAI': 'القاهرة', 'AMM': 'عمان', 'BEY': 'بيروت', 'DAM': 'دمشق', 'BGW': 'بغداد', 'KRT': 'الخرطوم', 'ADD': 'أديس أبابا', 'NBO': 'نيروبي', 'MBA': 'مومباسا', 'DAR': 'دار السلام', 'EBB': 'كمبالا', 'ASM': 'أسمرة', 'MGQ': 'مقديشو', 'DAC': 'دكا', 'CGP': 'تشيتاجونج', 'MNL': 'مانيلا', 'CRK': 'كلارك', 'CEB': 'سيبو', 'CMB': 'كولومبو', 'CGK': 'جاكرتا', 'SUB': 'سورابايا', 'KUL': 'كوالالمبور', 'BKK': 'بانكوك', 'DEL': 'نيودلهي', 'BOM': 'مومباي', 'CCJ': 'كاليكوت', 'COK': 'كوتشي', 'MAA': 'تشيناي', 'HYD': 'حيدر أباد', 'ISB': 'إسلام آباد', 'LHE': 'لاهور', 'KHI': 'كراتشي', 'KTM': 'كاتماندو', 'DXB': 'دبي', 'DOH': 'الدوحة', 'KWI': 'الكويت', 'BAH': 'المنامة', 'MCT': 'مسقط',
  };

  const formatDateYMD = (val: unknown): string => {
    if (!val || String(val).trim() === '' || String(val).toLowerCase() === 'null') return '';
    const s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
    const dmY = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/.exec(s);
    if (dmY) {
      const d = dmY[1].padStart(2, '0');
      const m = dmY[2].padStart(2, '0');
      const y = dmY[3];
      return `${y}-${m}-${d}`;
    }
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return s;
  };

  const convert12hTo24h = (time12h: string): string => {
    if (!time12h) return '';
    const clean = time12h.trim().toUpperCase();
    if (/^\d{1,2}:\d{2}$/.test(clean)) {
      const [h, m] = clean.split(':');
      return `${h.padStart(2, '0')}:${m}`;
    }
    const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/.exec(clean);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const modifier = match[3];
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
    return clean;
  };

  const openDeportationModal = (escape: WorkerEscapeItem) => {
    setDeportationTarget(escape);
    setTicketFileName('');
    setTicketUploadError('');
    let defaultArrival = '';
    const nat = escape.homeMaid?.Nationalitycopy || '';
    if (nat.includes('إثيوبيا') || nat.includes('اثيوبيا')) defaultArrival = 'أديس أبابا';
    else if (nat.includes('فلبين')) defaultArrival = 'مانيلا';
    else if (nat.includes('بنغلاديش') || nat.includes('بنغلادش')) defaultArrival = 'دكا';
    else if (nat.includes('كينيا')) defaultArrival = 'نيروبي';
    else if (nat.includes('أوغندا') || nat.includes('اوغندا')) defaultArrival = 'كمبالا';
    else if (nat.includes('سريلانكا')) defaultArrival = 'كولومبو';

    setDeportationForm({
      externaldeparatureCity: 'الرياض',
      externalArrivalCity: defaultArrival,
      externaldeparatureDate: new Date().toISOString().split('T')[0],
      externaldeparatureTime: '12:00',
      externalArrivalCityDate: new Date().toISOString().split('T')[0],
      externalArrivalCityTime: '18:00',
      externalTicketFile: '',
      notes: '',
    });
    setIsDeportationModalOpen(true);
  };

  const openReturnHousingModal = (escape: WorkerEscapeItem) => {
    setReturnHousingTarget(escape);
    setReturnHousingForm({
      houseentrydate: new Date().toISOString().split('T')[0],
      location_id: inHouseLocations[0] ? String(inHouseLocations[0].id) : '',
      reason: 'تغييب عن العمل (هروب )',
      customReason: '',
      actionTaken: 'ترحيل',
      notes: '',
    });
    setIsReturnHousingModalOpen(true);
  };

  const handleDeportationTicketUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setTicketUploadError('نوع الملف غير مدعوم (PDF، JPEG، PNG، WEBP فقط)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setTicketUploadError('حجم الملف كبير جداً (الحد الأقصى 10 ميغابايت)');
      return;
    }

    try {
      setIsUploadingTicket(true);
      setTicketUploadError('');
      setTicketFileName(file.name);

      let uploadedUrl = '';
      try {
        const presignRes = await fetch(`/api/upload-presigned-url/externalTicketFile?contentType=${encodeURIComponent(file.type)}`);
        if (presignRes.ok) {
          const { url, filePath } = await presignRes.json();
          const putRes = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: { 'x-amz-acl': 'public-read', 'Content-Type': file.type },
          });
          if (putRes.ok) {
            uploadedUrl = filePath;
          }
        }
      } catch {
        // Fallback below
      }

      if (!uploadedUrl) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const res = await axios.post('/api/housing/upload-worker-photo', {
          file: base64,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
        });
        uploadedUrl = res.data?.url || res.data?.filePath || '';
      }

      if (uploadedUrl) {
        setDeportationForm((prev) => ({ ...prev, externalTicketFile: uploadedUrl }));
      }

      // AI Extraction
      setIsExtractingTicket(true);
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('image', file, file.name);
        const response = await fetch('https://aidoc.rawaes.com/api/extractdatafromtickets', {
          method: 'POST',
          body: formDataUpload,
        });
        if (response.ok) {
          const json = await response.json();
          const details = json.tickets_details;
          if (details && typeof details === 'object') {
            const rawArrivalCity = details.arrival_airport ? (IATA_TO_CITY_MAP[String(details.arrival_airport).trim().toUpperCase()] || String(details.arrival_airport)) : '';
            const rawDepartureCity = details.departure_airport ? (IATA_TO_CITY_MAP[String(details.departure_airport).trim().toUpperCase()] || String(details.departure_airport)) : '';
            const extractedDepDate = details.departure_date ? formatDateYMD(details.departure_date) : '';
            const extractedArrDate = details.arrival_date ? formatDateYMD(details.arrival_date) : '';

            setDeportationForm((prev) => ({
              ...prev,
              externaldeparatureCity: rawDepartureCity || prev.externaldeparatureCity,
              externalArrivalCity: rawArrivalCity || prev.externalArrivalCity,
              externaldeparatureDate: extractedDepDate || prev.externaldeparatureDate,
              externaldeparatureTime: details.departure_time ? convert12hTo24h(String(details.departure_time)) : prev.externaldeparatureTime,
              externalArrivalCityDate: extractedArrDate || prev.externalArrivalCityDate,
              externalArrivalCityTime: details.arrival_time ? convert12hTo24h(String(details.arrival_time)) : prev.externalArrivalCityTime,
            }));
            setActionToast({ message: 'تم استخراج وقراءة بيانات التذكرة بالذكاء الاصطناعي بنجاح!', type: 'success' });
          }
        }
      } catch (aiErr) {
        console.warn('AI Extraction error:', aiErr);
      } finally {
        setIsExtractingTicket(false);
      }
    } catch (err: any) {
      console.error('Ticket upload error:', err);
      setTicketUploadError(err.message || 'حدث خطأ أثناء رفع التذكرة');
    } finally {
      setIsUploadingTicket(false);
    }
  };

  const handleReportFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingReport(true);
      setReportUploadError('');
      setReportFileName(file.name);

      let uploadedUrl = '';
      try {
        const presignRes = await fetch(`/api/upload-presigned-url/escapeReportFile?contentType=${encodeURIComponent(file.type)}`);
        if (presignRes.ok) {
          const { url, filePath } = await presignRes.json();
          const putRes = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: { 'x-amz-acl': 'public-read', 'Content-Type': file.type },
          });
          if (putRes.ok) {
            uploadedUrl = filePath;
          }
        }
      } catch {}

      if (!uploadedUrl) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const res = await axios.post('/api/housing/upload-worker-photo', {
          file: base64,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
        });
        uploadedUrl = res.data?.url || res.data?.filePath || '';
      }

      if (uploadedUrl) {
        setAddForm((prev) => ({ ...prev, reportFile: uploadedUrl }));
      }
    } catch (err: any) {
      setReportUploadError(err.message || 'فشل في رفع ملف بلاغ الهروب');
    } finally {
      setIsUploadingReport(false);
    }
  };

  const handleInlineAttachReport = async (e: React.ChangeEvent<HTMLInputElement>, escId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsAttachingInline(true);
      let uploadedUrl = '';
      try {
        const presignRes = await fetch(`/api/upload-presigned-url/escapeReportFile?contentType=${encodeURIComponent(file.type)}`);
        if (presignRes.ok) {
          const { url, filePath } = await presignRes.json();
          const putRes = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: { 'x-amz-acl': 'public-read', 'Content-Type': file.type },
          });
          if (putRes.ok) {
            uploadedUrl = filePath;
          }
        }
      } catch {}

      if (!uploadedUrl) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const res = await axios.post('/api/housing/upload-worker-photo', {
          file: base64,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
        });
        uploadedUrl = res.data?.url || res.data?.filePath || '';
      }

      if (!uploadedUrl) {
        throw new Error('فشل في رفع الملف');
      }

      // Call action endpoint to attach report file
      const token = localStorage.getItem('token');
      const actionRes = await axios.post(`/api/escapes/${escId}/action`, {
        actionType: 'attach_report_file',
        reportFile: uploadedUrl,
      }, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (actionRes.data?.success) {
        setEscapes((prev) =>
          prev.map((item) => (item.id === escId ? { ...item, reportFile: uploadedUrl } : item))
        );
        if (selectedEscape && selectedEscape.id === escId) {
          setSelectedEscape((prev) => (prev ? { ...prev, reportFile: uploadedUrl } : null));
        }
        showNotification('تم إرفاق ملف بلاغ الهروب بنجاح واعتباره كمرفق استلام للطلب 🎉', 'success');
      } else {
        showNotification(actionRes.data?.message || 'فشل في ربط الملف', 'error');
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || err.message || 'حدث خطأ أثناء رفع البلاغ', 'error');
    } finally {
      setIsAttachingInline(false);
      e.target.value = '';
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: WorkerEscapeItem) => {
    setEditingEscape(item);
    setEditForm({
      escapeType: item.escapeType || 'housing',
      escapeDate: item.escapeDate ? new Date(item.escapeDate).toISOString().split('T')[0] : '',
      escapeTime: item.escapeTime || '',
      notes: item.notes || '',
      reportFile: item.reportFile || '',
    });
    setEditReportError('');
    setIsEditModalOpen(true);
  };

  // Upload Report File inside Edit Modal
  const handleEditReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingEditReport(true);
      setEditReportError('');

      let uploadedUrl = '';
      try {
        const presignRes = await fetch(`/api/upload-presigned-url/escapeReportFile?contentType=${encodeURIComponent(file.type)}`);
        if (presignRes.ok) {
          const { url, filePath } = await presignRes.json();
          const putRes = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: { 'x-amz-acl': 'public-read', 'Content-Type': file.type },
          });
          if (putRes.ok) {
            uploadedUrl = filePath;
          }
        }
      } catch {}

      if (!uploadedUrl) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const res = await axios.post('/api/housing/upload-worker-photo', {
          file: base64,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
        });
        uploadedUrl = res.data?.url || res.data?.filePath || '';
      }

      if (uploadedUrl) {
        setEditForm((prev) => ({ ...prev, reportFile: uploadedUrl }));
      }
    } catch (err: any) {
      setEditReportError(err.message || 'فشل في رفع ملف بلاغ الهروب');
    } finally {
      setIsUploadingEditReport(false);
    }
  };

  // Save Edit Submit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEscape) return;

    if (!editForm.escapeDate) {
      showNotification('يرجى تحديد تاريخ الهروب', 'error');
      return;
    }

    try {
      setIsSubmittingEdit(true);
      const res = await axios.put(`/api/escapes/${editingEscape.id}`, {
        escapeType: editForm.escapeType,
        escapeDate: editForm.escapeDate,
        escapeTime: editForm.escapeTime || null,
        notes: editForm.notes || null,
        reportFile: editForm.reportFile || null,
      });

      if (res.data?.success) {
        showNotification('تم تحديث بيانات بلاغ الهروب بنجاح');
        setIsEditModalOpen(false);
        setEditingEscape(null);
        fetchEscapes();
      } else {
        showNotification(res.data?.message || 'فشل في تحديث بيانات البلاغ', 'error');
      }
    } catch (err: any) {
      console.error('Error updating escape:', err);
      showNotification(err.response?.data?.message || err.message || 'حدث خطأ أثناء تعديل البلاغ', 'error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeportationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deportationTarget) return;

    setIsSubmittingDeportation(true);
    try {
      const res = await axios.post(`/api/escapes/${deportationTarget.id}/action`, {
        actionType: 'deportation',
        deportationData: {
          deportationEntity: 'الشركة السعودية للخدمات اللوجستية (سلسك)',
          externalReason: 'هروب العاملة',
          externaldeparatureCity: deportationForm.externaldeparatureCity,
          externaldeparatureDate: deportationForm.externaldeparatureDate,
          externaldeparatureTime: deportationForm.externaldeparatureTime,
          externalArrivalCity: deportationForm.externalArrivalCity,
          externalArrivalCityDate: deportationForm.externalArrivalCityDate,
          externalArrivalCityTime: deportationForm.externalArrivalCityTime,
          externalTicketFile: deportationForm.externalTicketFile,
          deliveryOfficer: null,
          notes: deportationForm.notes,
        },
      });

      if (res.data?.success) {
        setIsDeportationModalOpen(false);
        setDeportationTarget(null);
        setSelectedEscape(null);
        setActionToast({ message: 'تم ترحيل العاملة بنجاح واستبعادها من قائمة الهاربات النشطة', type: 'success' });
        fetchEscapes();
      }
    } catch (err: any) {
      console.error('Error submitting deportation:', err);
      setActionToast({ message: err.response?.data?.message || 'حدث خطأ أثناء حفظ الترحيل', type: 'error' });
    } finally {
      setIsSubmittingDeportation(false);
    }
  };

  const handleReturnHousingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnHousingTarget) return;

    const finalReason = 'تغييب عن العمل (هروب )';

    setIsSubmittingReturnHousing(true);
    try {
      const res = await axios.post(`/api/escapes/${returnHousingTarget.id}/action`, {
        actionType: 'return_to_housing',
        returnHousingData: {
          houseentrydate: returnHousingForm.houseentrydate,
          location_id: returnHousingForm.location_id,
          reason: finalReason,
          actionTaken: returnHousingForm.actionTaken,
          notes: returnHousingForm.notes,
        },
      });

      if (res.data?.success) {
        setIsReturnHousingModalOpen(false);
        setReturnHousingTarget(null);
        setSelectedEscape(null);
        setActionToast({ message: 'تمت إعادة العاملة للسكن بنجاح وتحديث قيودها في إدارة السكن', type: 'success' });
        fetchEscapes();
      }
    } catch (err: any) {
      console.error('Error submitting return to housing:', err);
      setActionToast({ message: err.response?.data?.message || 'حدث خطأ أثناء إعادة التسكين', type: 'error' });
    } finally {
      setIsSubmittingReturnHousing(false);
    }
  };

  const getEscapeTypeLabel = (type: string) => {
    switch (type) {
      case 'airport':
        return { label: 'هروب من المطار', color: 'bg-teal-50 text-teal-800 border-teal-200', icon: Plane };
      case 'housing':
        return { label: 'هروب من السكن', color: 'bg-teal-50 text-teal-800 border-teal-200', icon: Building };
      case 'trial_transfer':
        return { label: 'هروب أثناء التجربة', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: RefreshCw };
      case 'client':
        return { label: 'هروب من العميل', color: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: UserX };
      default:
        return { label: 'هروب عام', color: 'bg-gray-50 text-gray-800 border-gray-200', icon: UserX };
    }
  };

  const hasActiveFilters =
    nationalityFilter !== 'all' ||
    officeFilter !== 'all' ||
    warrantyFilter !== 'all' ||
    dateRangeFilter !== 'all' ||
    (statusFilter === 'archive' && archiveTab !== 'all') ||
    (statusFilter === 'archive' && escapeTypeFilter !== 'all') ||
    searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setNationalityFilter('all');
    setOfficeFilter('all');
    setWarrantyFilter('all');
    setDateRangeFilter('all');
    setArchiveTab('all');
    setEscapeTypeFilter('all');
    setSearchQuery('');
    setPage(1);
  };

  return (
    <Layout>
      <Head>
        <title>إدارة بلاغات هروب العاملات | روائس</title>
      </Head>

      <div className="w-full px-2 sm:px-4 py-4 space-y-4" dir="rtl">
        {/* Page Header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl border border-teal-200 bg-teal-50 flex items-center justify-center text-teal-700 shrink-0">
              {statusFilter === 'recorded' ? (
                <UserX className="w-6 h-6 text-teal-700" />
              ) : (
                <Archive className="w-6 h-6 text-teal-700" />
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                {statusFilter === 'recorded' ? 'إدارة بلاغات هروب العاملات' : 'أرشيف بلاغات الهروب'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {statusFilter === 'recorded'
                  ? 'سجل مركزي موحد لمتابعة وتوثيق كافة حالات هروب العاملات النشطة وموقف الضمان وتاريخ الوصول.'
                  : 'أرشيف موحد لكافة البلاغات التي تمت معالجتها بترحيل مباشر عبر (سلسك) أو بإعادة قيد العاملة للسكن.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل بلاغ هروب جديد</span>
          </button>
        </div>

        {/* Master View Switcher: Active vs Archive (Above the Tabs Filter) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-1.5 sm:p-2 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => { setStatusFilter('recorded'); setPage(1); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                statusFilter === 'recorded'
                  ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <UserX className="w-4 h-4 shrink-0" />
              <span>البلاغات النشطة</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
                statusFilter === 'recorded' ? 'bg-white text-teal-900' : 'bg-gray-200 text-gray-700'
              }`} dir="ltr">
                {counts.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setStatusFilter('archive'); setPage(1); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                statusFilter === 'archive'
                  ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Archive className="w-4 h-4 shrink-0" />
              <span>أرشيف الهروب</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
                statusFilter === 'archive' ? 'bg-white text-teal-900' : 'bg-gray-200 text-gray-700'
              }`} dir="ltr">
                {counts.archive || 0}
              </span>
            </button>
          </div>
        </div>



        {/* Dynamic Category/Resolution Tabs for Active vs Archive */}
        {statusFilter === 'recorded' ? (
          /* Active Escapes: 5 Category Tabs */
          <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center text-xs font-bold">
              <button
                onClick={() => { setActiveTab('all'); setPage(1); }}
                className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-teal-50 hover:text-teal-800'
                }`}
              >
                <span>جميع الحالات النشطة</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  activeTab === 'all' ? 'bg-white text-teal-900 shadow-sm' : 'bg-gray-100 text-gray-700'
                }`} dir="ltr">{counts.total}</span>
              </button>

              <button
                onClick={() => { setActiveTab('airport'); setPage(1); }}
                className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'airport'
                    ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-teal-50 hover:text-teal-800'
                }`}
              >
                <Plane className="w-3.5 h-3.5" />
                <span>هروب من المطار</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  activeTab === 'airport' ? 'bg-white text-teal-900 shadow-sm' : 'bg-gray-100 text-gray-700'
                }`} dir="ltr">{counts.airport}</span>
              </button>

              <button
                onClick={() => { setActiveTab('housing'); setPage(1); }}
                className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'housing'
                    ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-teal-50 hover:text-teal-800'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>هروب من السكن</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  activeTab === 'housing' ? 'bg-white text-teal-900 shadow-sm' : 'bg-gray-100 text-gray-700'
                }`} dir="ltr">{counts.housing}</span>
              </button>

              <button
                onClick={() => { setActiveTab('trial_transfer'); setPage(1); }}
                className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'trial_transfer'
                    ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-teal-50 hover:text-teal-800'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>أثناء التجربة</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  activeTab === 'trial_transfer' ? 'bg-white text-teal-900 shadow-sm' : 'bg-gray-100 text-gray-700'
                }`} dir="ltr">{counts.trial_transfer}</span>
              </button>

              <button
                onClick={() => { setActiveTab('client'); setPage(1); }}
                className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'client'
                    ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-teal-50 hover:text-teal-800'
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                <span>من العميل</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  activeTab === 'client' ? 'bg-white text-teal-900 shadow-sm' : 'bg-gray-100 text-gray-700'
                }`} dir="ltr">{counts.client}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Archive: 3 Resolution Category Tabs */
          <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs sm:text-sm font-bold">
              <button
                onClick={() => { setArchiveTab('all'); setPage(1); }}
                className={`py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                  archiveTab === 'all'
                    ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-teal-50 hover:text-teal-800'
                }`}
              >
                <Archive className="w-4 h-4" />
                <span>جميع الحالات المؤرشفة</span>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold ${
                  archiveTab === 'all' ? 'bg-white text-teal-900 shadow-sm' : 'bg-gray-100 text-gray-700'
                }`} dir="ltr">{counts.archive}</span>
              </button>

              <button
                onClick={() => { setArchiveTab('returned_to_housing'); setPage(1); }}
                className={`py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                  archiveTab === 'returned_to_housing'
                    ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-teal-50 hover:text-teal-800'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>تمت الإعادة للسكن</span>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold ${
                  archiveTab === 'returned_to_housing' ? 'bg-white text-teal-900 shadow-sm' : 'bg-gray-100 text-gray-700'
                }`} dir="ltr">{counts.returned}</span>
              </button>

              <button
                onClick={() => { setArchiveTab('deported'); setPage(1); }}
                className={`py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                  archiveTab === 'deported'
                    ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-teal-50 hover:text-teal-800'
                }`}
              >
                <Plane className="w-4 h-4" />
                <span>تم الترحيل عبر (سلسك)</span>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold ${
                  archiveTab === 'deported' ? 'bg-white text-teal-900 shadow-sm' : 'bg-gray-100 text-gray-700'
                }`} dir="ltr">{counts.deported}</span>
              </button>
            </div>
          </div>
        )}

        {/* Search & Secondary Filters Toolbar */}
        <div className="flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
          <div className="relative w-full xl:w-80 shrink-0">
            <input
              type="text"
              placeholder="بحث بالاسم، رقم الهوية، رقم الجواز، الهاتف..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-600 transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 w-full xl:w-auto flex-wrap justify-end">
            {/* Escape Type Filter (Visible in Archive mode to filter by origin) */}
            {statusFilter === 'archive' && (
              <div className="relative">
                <select
                  value={escapeTypeFilter}
                  onChange={(e) => { setEscapeTypeFilter(e.target.value); setPage(1); }}
                  className={`h-9 pr-3 pl-7 text-xs font-semibold border rounded-xl outline-none focus:ring-2 focus:ring-teal-600 appearance-none bg-none cursor-pointer transition-all ${
                    escapeTypeFilter !== 'all'
                      ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <option value="all">نوع الهروب: الكل</option>
                  <option value="airport">هروب من المطار</option>
                  <option value="housing">هروب من السكن</option>
                  <option value="trial_transfer">هروب أثناء التجربة</option>
                  <option value="client">هروب من العميل</option>
                </select>
                <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-gray-400">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>
            )}
            {/* Nationality Filter */}
            <div className="relative">
              <select
                value={nationalityFilter}
                onChange={(e) => { setNationalityFilter(e.target.value); setPage(1); }}
                className={`h-9 pr-3 pl-7 text-xs font-semibold border rounded-xl outline-none focus:ring-2 focus:ring-teal-600 appearance-none bg-none cursor-pointer transition-all ${
                  nationalityFilter !== 'all'
                    ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <option value="all">الجنسية: الكل</option>
                {availableNationalities.map((nat) => (
                  <option key={nat} value={nat}>{nat}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-gray-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Foreign Office Filter */}
            <div className="relative">
              <select
                value={officeFilter}
                onChange={(e) => { setOfficeFilter(e.target.value); setPage(1); }}
                className={`h-9 pr-3 pl-7 text-xs font-semibold border rounded-xl outline-none focus:ring-2 focus:ring-teal-600 appearance-none bg-none cursor-pointer transition-all ${
                  officeFilter !== 'all'
                    ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <option value="all">المكتب الخارجي: الكل</option>
                {availableOffices.map((off) => (
                  <option key={off} value={off}>{off}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-gray-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Warranty & Sheltering Filter */}
            <div className="relative">
              <select
                value={warrantyFilter}
                onChange={(e) => { setWarrantyFilter(e.target.value as any); setPage(1); }}
                className={`h-9 pr-3 pl-7 text-xs font-semibold border rounded-xl outline-none focus:ring-2 focus:ring-teal-600 appearance-none bg-none cursor-pointer transition-all ${
                  warrantyFilter !== 'all'
                    ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <option value="all">موقف الضمان: الكل</option>
                <option value="true">داخل الضمان (≤ 90 يوم)</option>
                <option value="false">خارج الضمان (&gt; 90 يوم)</option>
                <option value="over_2_years">سقوط الإيواء (&gt; سنتين)</option>
              </select>
              <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-gray-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Escape Date Period Filter */}
            <div className="relative">
              <select
                value={dateRangeFilter}
                onChange={(e) => { setDateRangeFilter(e.target.value); setPage(1); }}
                className={`h-9 pr-3 pl-7 text-xs font-semibold border rounded-xl outline-none focus:ring-2 focus:ring-teal-600 appearance-none bg-none cursor-pointer transition-all ${
                  dateRangeFilter !== 'all'
                    ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <option value="all">فترة الهروب: الكل</option>
                <option value="today">اليوم</option>
                <option value="week">آخر 7 أيام (هذا الأسبوع)</option>
                <option value="month">آخر 30 يوم (هذا الشهر)</option>
                <option value="quarter">آخر 3 أشهر</option>
                <option value="year">خلال هذا العام</option>
              </select>
              <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-gray-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="h-9 px-3 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="إعادة تعيين كافة الفلاتر"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط</span>
              </button>
            )}


            {/* Export to Excel Button */}
            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="h-9 px-3.5 text-xs font-bold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-200 hover:border-teal-300 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
              title="تصدير السجلات الحالية إلى ملف Excel"
            >
              {isExportingExcel ? (
                <Loader2 className="w-3.5 h-3.5 text-teal-700 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-teal-700" />
              )}
              <span>تصدير Excel</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 min-w-[220px]">بيانات العاملة</th>
                  <th className="py-3 px-4 min-w-[200px]">بيانات العميل</th>
                  <th className="py-3 px-4 min-w-[200px]">بيانات الهروب</th>
                  <th className="py-3 px-4 min-w-[190px]">موقف الضمان</th>
                  <th className="py-3 px-4 text-center w-52 min-w-[210px]">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-7 w-7 border-2 border-teal-600 border-t-transparent"></div>
                        <span>جاري تحميل بيانات بلاغات الهروب...</span>
                      </div>
                    </td>
                  </tr>
                ) : escapes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        {statusFilter === 'recorded' ? (
                          <>
                            <UserCheck className="w-8 h-8 text-green-600" />
                            <span className="font-bold text-gray-700">لا توجد حالات هروب نشطة مسجلة في هذا القسم</span>
                            <span className="text-xs text-gray-400">جميع العاملات في مساراتهن المعتمدة</span>
                          </>
                        ) : (
                          <>
                            <Archive className="w-8 h-8 text-teal-600" />
                            <span className="font-bold text-gray-700">أرشيف الهروب فارغ في هذا القسم</span>
                            <span className="text-xs text-gray-400">لم يتم تسوية أي بلاغات هروب بعد في هذا التصنيف</span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  escapes.map((item, idx) => {
                    const typeBadge = getEscapeTypeLabel(item.escapeType);
                    const formattedEscapeDate = formatDate(item.escapeDate);
                    const formattedArrivalDate = formatDate(item.arrivalDate);

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-gray-500 text-center" dir="ltr">{item.id}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 items-start justify-center">
                            {/* Top: Name & Nationality Flag */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {item.homeMaidId ? (
                                <a
                                  href={`/admin/homemaidinfo?id=${item.homeMaidId}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-gray-950 hover:text-teal-700 hover:underline font-bold text-xs sm:text-sm cursor-pointer transition-colors"
                                  title="فتح الملف الشخصي للعاملة"
                                >
                                  {item.homeMaid?.Name || 'عاملة غير محددة'}
                                </a>
                              ) : (
                                <strong className="text-gray-900 font-bold text-xs sm:text-sm">
                                  {item.homeMaid?.Name || 'عاملة غير محددة'}
                                </strong>
                              )}

                              {(() => {
                                const flagUrl = getCountryFlagUrl(item.homeMaid?.Nationalitycopy);
                                const nationalityTitle = item.homeMaid?.Nationalitycopy || '';
                                return flagUrl ? (
                                  <img
                                    src={flagUrl}
                                    alt={nationalityTitle}
                                    title={nationalityTitle}
                                    className="w-5 h-3.5 object-cover rounded-xs border border-gray-200 inline-block shrink-0 shadow-2xs cursor-help"
                                  />
                                ) : nationalityTitle ? (
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    ({nationalityTitle})
                                  </span>
                                ) : null;
                              })()}
                            </div>

                            {/* Bottom: Passport & Office Name */}
                            <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                              {item.homeMaid?.Passportnumber && (
                                <span className="flex items-center gap-1 font-mono font-medium" dir="ltr">
                                  <FileText className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                  <span>{item.homeMaid.Passportnumber}</span>
                                </span>
                              )}

                              {item.homeMaid?.Passportnumber && item.homeMaid?.officeName && (
                                <span className="text-gray-300">|</span>
                              )}

                              {item.homeMaid?.officeName && (
                                <span className="flex items-center gap-1 text-gray-600 font-medium" title="المكتب الخارجي">
                                  <Building className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                  <span>{item.homeMaid.officeName}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 items-start justify-center">
                            {/* Top: Name & Order Number */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.clientId ? (
                                <a
                                  href={`/admin/clientdetails?id=${item.clientId}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-gray-950 hover:text-teal-700 hover:underline font-bold text-xs sm:text-sm cursor-pointer transition-colors"
                                  title="فتح ملف العميل"
                                >
                                  {item.client?.fullname || item.order?.ClientName || 'غير مسجل'}
                                </a>
                              ) : (
                                <strong className="text-gray-900 font-bold text-xs sm:text-sm">
                                  {item.client?.fullname || item.order?.ClientName || 'غير مسجل'}
                                </strong>
                              )}

                              {item.orderId && (
                                <a
                                  href={`/admin/track_order/${item.orderId}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-teal-700 hover:text-teal-900 hover:underline text-xs font-bold inline-flex items-center gap-0.5"
                                  title="تتبع الطلب"
                                >
                                  <span>طلب</span>
                                  <span className="font-mono" dir="ltr">#{item.orderId}</span>
                                </a>
                              )}
                            </div>

                            {/* Bottom: National ID & Phone */}
                            <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                              {(item.client?.nationalId || item.order?.nationalId) && (
                                <span className="flex items-center gap-1 font-mono font-medium" dir="ltr">
                                  <CreditCard className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                  <span>{item.client?.nationalId || item.order?.nationalId}</span>
                                </span>
                              )}

                              {(item.client?.nationalId || item.order?.nationalId) && item.client?.phonenumber && (
                                <span className="text-gray-300">|</span>
                              )}

                              {item.client?.phonenumber && (
                                <a
                                  href={`tel:${item.client.phonenumber}`}
                                  className="flex items-center gap-1 font-mono font-medium text-gray-600 hover:text-teal-700 transition-colors"
                                  dir="ltr"
                                  title="اتصال بالعميل"
                                >
                                  <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                  <span>{item.client.phonenumber}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {(() => {
                            let daysPassed: number | null = null;
                            if (item.escapeDate) {
                              const escDate = new Date(item.escapeDate);
                              if (!isNaN(escDate.getTime())) {
                                const escStart = new Date(escDate.getFullYear(), escDate.getMonth(), escDate.getDate()).getTime();
                                const now = new Date();
                                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                                daysPassed = Math.max(0, Math.round((todayStart - escStart) / (1000 * 60 * 60 * 24)));
                              }
                            }

                            const TypeIcon = typeBadge.icon || UserX;

                            return (
                              <div className="rounded-xl p-2.5 border border-gray-200 bg-gray-50/90 hover:border-gray-300 transition-all shadow-2xs w-[225px] min-h-[112px] flex flex-col justify-between space-y-2">
                                {/* Header Badge: Type & Source */}
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${typeBadge.color}`}>
                                    <TypeIcon className="w-3.5 h-3.5 shrink-0" />
                                    <span>{typeBadge.label}</span>
                                  </span>
                                </div>

                                {/* Metrics Section */}
                                <div className="border-t border-gray-200/80 pt-1.5 space-y-1 text-xs">
                                  <div className="flex items-center justify-between text-gray-600">
                                    <span className="text-gray-500 text-[11px]">تاريخ الهروب:</span>
                                    <span className="font-mono font-bold text-gray-800 text-[11px]" dir="ltr">
                                      {formattedEscapeDate}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-gray-600">
                                    <span className="text-gray-500 text-[11px]">وقت الهروب:</span>
                                    <span className="font-mono font-bold text-gray-800 text-[11px]" dir="ltr">
                                      {item.escapeTime || 'غير محدد'}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between pt-0.5">
                                    <div className="text-[11px] font-bold text-rose-900 flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-rose-600 shrink-0" />
                                      <span>
                                        {daysPassed == null ? (
                                          'تاريخ غير محدد'
                                        ) : daysPassed === 0 ? (
                                          'الهروب اليوم'
                                        ) : (
                                          <>
                                            مدة الهروب: <span className="font-mono text-rose-950 font-bold" dir="ltr">{daysPassed}</span> يوم
                                          </>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </td>
<td className="py-3 px-4">
                          {(() => {
                            const arrDate = item.arrivalDate ? new Date(item.arrivalDate) : null;
                            const isArrValid = arrDate && !isNaN(arrDate.getTime());
                            const passedDays = isArrValid
                              ? Math.max(0, Math.round((Date.now() - arrDate.getTime()) / (1000 * 60 * 60 * 24)))
                              : null;
                            const isOver = passedDays != null ? passedDays >= 730 : false;
                            const isWithinWarranty = passedDays != null ? passedDays <= 90 : false;
                            const remainingDays = passedDays != null ? 730 - passedDays : null;

                            const theme = isOver
                              ? {
                                  container: 'bg-rose-50/70 border-rose-200 hover:border-rose-300',
                                  badge: 'bg-rose-100 text-rose-800 border-rose-200',
                                  divider: 'border-rose-200/80',
                                }
                              : isWithinWarranty
                              ? {
                                  container: 'bg-teal-50/60 border-teal-200 hover:border-teal-300',
                                  badge: 'bg-teal-100 text-teal-900 border-teal-200',
                                  divider: 'border-teal-200/80',
                                }
                              : {
                                  container: 'bg-gray-50/90 border-gray-200 hover:border-gray-300',
                                  badge: 'bg-gray-100 text-gray-700 border-gray-200',
                                  divider: 'border-gray-200',
                                };

                            return (
                              <div className={`rounded-xl p-2.5 border transition-all shadow-2xs w-[225px] min-h-[112px] flex flex-col justify-between space-y-2 ${theme.container}`}>
                                {/* Header Badge */}
                                <div className="flex items-center justify-between gap-1.5">
                                  {isOver ? (
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${theme.badge}`}>
                                      <ShieldOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                      <span>تجاوزت سنتين (سقوط الإيواء)</span>
                                    </span>
                                  ) : isWithinWarranty ? (
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${theme.badge}`}>
                                      <ShieldAlert className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                      <span>داخل الضمان (≤ 90 يوم)</span>
                                    </span>
                                  ) : (
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${theme.badge}`}>
                                      <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                      <span>خارج الضمان (&gt; 90 يوم)</span>
                                    </span>
                                  )}
                                </div>

                                {/* Metrics Section */}
                                <div className={`border-t pt-1.5 space-y-1 text-xs ${theme.divider}`}>
                                  {formattedArrivalDate !== '-' && (
                                    <div className="flex items-center justify-between text-gray-600">
                                      <span className="text-gray-500 text-[11px]">دخول المملكة:</span>
                                      <span className="font-mono font-bold text-gray-800 text-[11px]" dir="ltr">
                                        {formattedArrivalDate}
                                      </span>
                                    </div>
                                  )}

                                  {passedDays != null && (
                                    <div className="flex items-center justify-between text-gray-600">
                                      <span className="text-gray-500 text-[11px]">المدة من الوصول:</span>
                                      <span className="font-bold text-gray-800 text-[11.5px] inline-flex items-center gap-1" dir="rtl">
                                        <span className="font-mono text-gray-900 font-bold" dir="ltr">{passedDays}</span>
                                        <span className="font-sans font-medium text-gray-600">يوم</span>
                                      </span>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between pt-0.5">
                                    {remainingDays != null && remainingDays <= 0 ? (
                                      <div className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                                        <ShieldOff className="w-3 h-3 text-rose-600 shrink-0" />
                                        <span>سقطت مسؤولية الإيواء</span>
                                      </div>
                                    ) : remainingDays != null ? (
                                      <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                                        <span>
                                          تبقى <span className="font-mono text-amber-950 font-bold" dir="ltr">{remainingDays}</span> يوم حتى سقوط المسؤولية
                                        </span>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </td>

                        <td className="py-3 px-4 text-center w-60 min-w-[220px]">
                          <div className="flex items-center justify-center gap-1.5 mx-auto">
                            {/* View Details */}
                            <button
                              onClick={() => setSelectedEscape(item)}
                              className="group flex items-center h-8 px-2 rounded-lg text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all duration-300 overflow-hidden cursor-pointer shadow-2xs"
                              title="عرض تفاصيل البلاغ"
                            >
                              <Eye className="w-4 h-4 text-gray-600 group-hover:text-gray-900 shrink-0 transition-colors" />
                              <span className="max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 group-hover:mr-1.5 whitespace-nowrap text-xs font-bold transition-all duration-300 ease-in-out">
                                تفاصيل
                              </span>
                            </button>

                            {/* Edit Escape */}
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="group flex items-center h-8 px-2 rounded-lg text-blue-700 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 transition-all duration-300 overflow-hidden cursor-pointer shadow-2xs"
                              title="تعديل بيانات البلاغ"
                            >
                              <Edit3 className="w-4 h-4 text-blue-600 group-hover:text-blue-900 shrink-0 transition-colors" />
                              <span className="max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 group-hover:mr-1.5 whitespace-nowrap text-xs font-bold transition-all duration-300 ease-in-out">
                                تعديل
                              </span>
                            </button>

                            {/* Escape Report File: Preview or Inline Upload */}
                            {item.reportFile ? (
                              <a
                                href={item.reportFile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center h-8 px-2 rounded-lg text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-200 hover:border-teal-300 transition-all duration-300 overflow-hidden cursor-pointer shadow-2xs"
                                title={item.escapeType === 'airport' ? 'عرض بلاغ الهروب (مرفق الاستلام للطلب)' : 'عرض بلاغ الهروب المرفق'}
                              >
                                <FileText className="w-4 h-4 text-teal-700 group-hover:text-teal-900 shrink-0 transition-colors" />
                                <span className="max-w-0 opacity-0 group-hover:max-w-[110px] group-hover:opacity-100 group-hover:mr-1.5 whitespace-nowrap text-xs font-bold transition-all duration-300 ease-in-out">
                                  بلاغ الهروب
                                </span>
                              </a>
                            ) : (
                              <label
                                className={`group flex items-center h-8 px-2 rounded-lg text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 transition-all duration-300 overflow-hidden cursor-pointer shadow-2xs ${
                                  isAttachingInline ? 'opacity-50 pointer-events-none' : ''
                                }`}
                                title={item.escapeType === 'airport' ? 'إرفاق بلاغ الهروب (يُعتمد كمرفق استلام للطلب لإغلاقه)' : 'إرفاق ملف بلاغ الهروب'}
                              >
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,image/jpeg,image/png,image/webp"
                                  onChange={(e) => handleInlineAttachReport(e, item.id)}
                                  disabled={isAttachingInline}
                                />
                                <Upload className="w-4 h-4 text-amber-700 group-hover:text-amber-900 shrink-0 transition-colors" />
                                <span className="max-w-0 opacity-0 group-hover:max-w-[110px] group-hover:opacity-100 group-hover:mr-1.5 whitespace-nowrap text-xs font-bold transition-all duration-300 ease-in-out">
                                  إرفاق البلاغ
                                </span>
                              </label>
                            )}

                            {item.status === 'recorded' ? (
                              <>
                                {/* Deportation */}
                                <button
                                  onClick={() => openDeportationModal(item)}
                                  className="group flex items-center h-8 px-2 rounded-lg text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all duration-300 overflow-hidden cursor-pointer shadow-2xs"
                                  title="ترحيل مباشر عبر سلسك"
                                >
                                  <Plane className="w-4 h-4 text-gray-600 group-hover:text-gray-900 shrink-0 transition-colors" />
                                  <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:mr-1.5 whitespace-nowrap text-xs font-bold transition-all duration-300 ease-in-out">
                                    ترحيل (سلسك)
                                  </span>
                                </button>

                                {/* Return to Housing */}
                                <button
                                  onClick={() => openReturnHousingModal(item)}
                                  className="group flex items-center h-8 px-2 rounded-lg text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all duration-300 overflow-hidden cursor-pointer shadow-2xs"
                                  title="إعادة قيد العاملة للسكن"
                                >
                                  <Building className="w-4 h-4 text-gray-600 group-hover:text-gray-900 shrink-0 transition-colors" />
                                  <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:mr-1.5 whitespace-nowrap text-xs font-bold transition-all duration-300 ease-in-out">
                                    إعادة للسكن
                                  </span>
                                </button>
                              </>
                            ) : item.status === 'returned_to_housing' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                                <Building className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>تمت الإعادة للسكن</span>
                              </span>
                            ) : item.status === 'deported' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs">
                                <Plane className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                <span>تم الترحيل (سلسك)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                {item.status}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Comprehensive Pagination & Footer Toolbar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 bg-gray-50/70 border-t border-gray-200 text-xs text-gray-700 select-none">
            {/* Record count info & Page size selector */}
            <div className="flex items-center gap-3 flex-wrap">
              {totalCount === 0 ? (
                <span className="text-gray-500 font-medium">لا توجد حالات مسجلة</span>
              ) : totalPages <= 1 ? (
                <span className="text-gray-700 font-medium">
                  إجمالي النتائج:{' '}
                  <span className="font-bold text-teal-800 font-mono text-sm" dir="ltr">
                    {totalCount}
                  </span>{' '}
                  {totalCount === 1 ? 'حالة' : totalCount === 2 ? 'حالتان' : totalCount <= 10 ? 'حالات' : 'حالة'}
                </span>
              ) : (
                <span className="text-gray-700 font-medium">
                  عرض{' '}
                  <span className="font-bold text-gray-900 font-mono" dir="ltr">
                    {(page - 1) * pageSize + 1}
                  </span>{' '}
                  -{' '}
                  <span className="font-bold text-gray-900 font-mono" dir="ltr">
                    {Math.min(page * pageSize, totalCount)}
                  </span>{' '}
                  من إجمالي{' '}
                  <span className="font-bold text-teal-800 font-mono text-sm" dir="ltr">
                    {totalCount}
                  </span>{' '}
                  حالة
                </span>
              )}

              <div className="flex items-center gap-2 border-r border-gray-200 pr-3 mr-1">
                <span className="text-gray-500">لكل صفحة:</span>
                <div className="relative inline-flex items-center">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="appearance-none bg-white border border-gray-300 rounded-lg pr-3 pl-7 py-1 text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer shadow-2xs hover:border-gray-400 transition-colors"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <div className="absolute left-2 inset-y-0 flex items-center pointer-events-none text-gray-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {totalPages > 1 && (
                <span className="text-gray-400 border-r border-gray-200 pr-3 mr-1">
                  صفحة <span className="font-bold font-mono text-gray-800" dir="ltr">{page}</span> من <span className="font-bold font-mono text-gray-800" dir="ltr">{totalPages}</span>
                </span>
              )}
            </div>

            {/* Pagination buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* First Page */}
              <button
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white text-gray-700 transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                title="الصفحة الأولى"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>

              {/* Previous Page */}
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5 flex items-center gap-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white text-gray-700 font-bold transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                title="الصفحة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="hidden sm:inline">السابق</span>
              </button>

              {/* Numeric Page Buttons */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (totalPages <= 7) return true;
                    return (
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - page) <= 1
                    );
                  })
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span className="px-1 text-gray-400 font-mono font-bold select-none">...</span>
                        )}
                        <button
                          onClick={() => setPage(p)}
                          className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            p === page
                              ? 'bg-teal-800 text-white border border-teal-900 shadow-2xs'
                              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              {/* Next Page */}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-2.5 flex items-center gap-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white text-gray-700 font-bold transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                title="الصفحة التالية"
              >
                <span className="hidden sm:inline">التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white text-gray-700 transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                title="الصفحة الأخيرة"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Quick Jump Input if > 3 pages */}
              {totalPages > 3 && (
                <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-1">
                  <span className="text-gray-500 text-[11px]">انتقال:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpPageInput}
                    onChange={(e) => setJumpPageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const target = parseInt(jumpPageInput, 10);
                        if (!isNaN(target) && target >= 1 && target <= totalPages) {
                          setPage(target);
                          setJumpPageInput('');
                        }
                      }
                    }}
                    placeholder="#"
                    className="w-12 h-8 px-1.5 text-center bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Details */}
        {mounted && selectedEscape && createPortal(
          <div
            dir="rtl"
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
            }}
            onClick={() => setSelectedEscape(null)}
          >
            <div className="bg-white rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl border border-gray-100 animate-in zoom-in-95 text-right" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                <div className="flex items-center gap-2">
                  <UserX className="w-5 h-5 text-teal-700" />
                  <h3 className="font-bold text-base text-gray-900">تفاصيل بلاغ الهروب #<span className="font-mono" dir="ltr">{selectedEscape.id}</span></h3>
                </div>
                <button onClick={() => setSelectedEscape(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer">&times;</button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="bg-gray-50 p-3 rounded-xl space-y-2 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">اسم العاملة:</span>
                    {selectedEscape.homeMaidId ? (
                      <a
                        href={`/admin/homemaidinfo?id=${selectedEscape.homeMaidId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-900 hover:text-teal-700 hover:underline font-bold"
                        title="فتح الملف الشخصي للعاملة"
                      >
                        {selectedEscape.homeMaid?.Name || 'غير محدد'}
                      </a>
                    ) : (
                      <strong className="text-gray-900 font-bold">{selectedEscape.homeMaid?.Name || 'غير محدد'}</strong>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">الجنسية:</span>
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const flagUrl = getCountryFlagUrl(selectedEscape.homeMaid?.Nationalitycopy);
                        return flagUrl ? (
                          <img
                            src={flagUrl}
                            alt=""
                            className="w-5 h-3.5 object-cover rounded-xs border border-gray-200 inline-block shadow-2xs"
                          />
                        ) : null;
                      })()}
                      <strong className="text-gray-800 text-xs">{selectedEscape.homeMaid?.Nationalitycopy || '—'}</strong>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">رقم الجواز:</span>
                    <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-gray-200">
                      <strong className="font-mono text-gray-800 tracking-wider font-bold" dir="ltr">
                        {selectedEscape.homeMaid?.Passportnumber || '—'}
                      </strong>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">العميل / الكفيل:</span>
                    {selectedEscape.clientId ? (
                      <a
                        href={`/admin/clientdetails?id=${selectedEscape.clientId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-900 hover:text-teal-700 hover:underline font-bold"
                        title="فتح صفحة العميل"
                      >
                        {selectedEscape.client?.fullname || selectedEscape.order?.ClientName || 'غير محدد'}
                      </a>
                    ) : (
                      <strong className="text-gray-900">{selectedEscape.client?.fullname || selectedEscape.order?.ClientName || 'غير محدد'}</strong>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    <span className="text-gray-500 block mb-0.5">تاريخ دخول المملكة</span>
                    <strong className="text-gray-800 font-mono font-bold" dir="ltr">
                      {formatDate(selectedEscape.arrivalDate)}
                    </strong>
                  </div>
                  <div className="bg-rose-50/60 p-2.5 rounded-lg border border-rose-200">
                    <span className="text-rose-900 block mb-0.5 font-bold">تاريخ ووقت الهروب</span>
                    <strong className="text-rose-950 font-mono font-bold block" dir="ltr">
                      {formatDate(selectedEscape.escapeDate)} {selectedEscape.escapeTime ? `(${selectedEscape.escapeTime})` : ''}
                    </strong>
                    {(() => {
                      if (!selectedEscape.escapeDate) return null;
                      const escDate = new Date(selectedEscape.escapeDate);
                      if (isNaN(escDate.getTime())) return null;
                      const escStart = new Date(escDate.getFullYear(), escDate.getMonth(), escDate.getDate()).getTime();
                      const now = new Date();
                      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                      const daysPassed = Math.max(0, Math.round((todayStart - escStart) / (1000 * 60 * 60 * 24)));
                      return (
                        <span className="text-[10.5px] text-rose-800 font-semibold block mt-0.5">
                          {daysPassed === 0 ? 'الهروب اليوم' : `مدة الهروب: ${daysPassed} يوم حتى اليوم`}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Warranty & Sheltering status card */}
                {(() => {
                  const arrDate = selectedEscape.arrivalDate ? new Date(selectedEscape.arrivalDate) : null;
                  const isArrValid = arrDate && !isNaN(arrDate.getTime());
                  const passedDays = isArrValid
                    ? Math.max(0, Math.round((Date.now() - arrDate.getTime()) / (1000 * 60 * 60 * 24)))
                    : null;
                  const isOver = passedDays != null ? passedDays >= 730 : false;
                  const isWithinWarranty = passedDays != null ? passedDays <= 90 : false;
                  const remainingDays = passedDays != null ? 730 - passedDays : null;

                  if (isOver) {
                    return (
                      <div className="p-3.5 rounded-xl border bg-rose-50 border-rose-200">
                        <div className="flex items-center gap-1.5 mb-1 font-bold">
                          <ShieldOff className="w-4 h-4 text-rose-600" />
                          <span className="text-rose-900">
                            موقف الإيواء: سقوط مسؤولية الإيواء (تجاوزت سنتين من الوصول)
                          </span>
                        </div>
                        <p className="text-xs text-rose-800 leading-relaxed">
                          مرور أكثر من سنتين (730 يوماً) من تاريخ دخول المملكة؛ وعليه يسقط التزام المكتب بإيواء العاملة في حال عودتها أو العثور عليها.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className={`p-3.5 rounded-xl border ${isWithinWarranty ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-1.5 mb-1 font-bold">
                        <ShieldAlert className={`w-4 h-4 ${isWithinWarranty ? 'text-teal-700' : 'text-gray-500'}`} />
                        <span className={isWithinWarranty ? 'text-teal-900' : 'text-gray-700'}>
                          موقف الضمان: {isWithinWarranty ? 'داخل فترة الضمان (≤ 90 يوماً من الوصول)' : 'خارج فترة الضمان (> 90 يوماً من الوصول)'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {selectedEscape.escapeType === 'airport'
                          ? 'سُجلت حالة الهروب في المطار عند وصول العاملة للمملكة.'
                          : selectedEscape.daysSinceArrival != null
                          ? `سُجلت حالة الهروب بعد مرور ${selectedEscape.daysSinceArrival} يوماً من تاريخ دخول المملكة.`
                          : 'حالة الهروب موثقة ومسجلة في النظام.'}
                      </p>
                      {remainingDays != null && (
                        remainingDays <= 0 ? (
                          <div className="mt-2 text-xs font-bold text-rose-800 bg-rose-100/70 p-2 rounded-lg border border-rose-200">
                            سقطت مسؤولية الإيواء عن المكتب (تجاوزت مدة السنتين المقررة).
                          </div>
                        ) : (
                          <div className="mt-2 text-xs font-bold text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>تبقى <span className="font-mono font-bold" dir="ltr">{remainingDays}</span> يوم حتى سقوط مسؤولية الإيواء (اكتمال سنتين)</span>
                          </div>
                        )
                      )}
                    </div>
                  );
                })()}

                {selectedEscape.notes && (
                  <div>
                    <span className="text-gray-500 font-bold block mb-1">الملاحظات:</span>
                    <p className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-gray-700 text-xs leading-relaxed whitespace-pre-wrap">
                      {selectedEscape.notes}
                    </p>
                  </div>
                )}

                {/* Escape Report / Delivery Receipt Section */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-bold flex items-center gap-1.5 text-xs">
                      <FileText className="w-4 h-4 text-teal-700" />
                      <span>ملف بلاغ الهروب {selectedEscape.escapeType === 'airport' ? '(مرفق استلام الطلب)' : ''}:</span>
                    </span>
                    {selectedEscape.escapeType === 'airport' && (
                      <span className="text-[10.5px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-300">
                        يُعامل كمرفق استلام للطلب
                      </span>
                    )}
                  </div>

                  {selectedEscape.reportFile ? (
                    <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-teal-200">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                        <span className="text-xs font-medium text-gray-700 truncate">
                          تم إرفاق بلاغ الهروب واعتماده بنجاح
                        </span>
                      </div>
                      <a
                        href={selectedEscape.reportFile}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-100 transition-colors shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>معاينة وتنزيل</span>
                      </a>
                    </div>
                  ) : (
                    <div className="bg-amber-50/50 p-3 rounded-lg border border-dashed border-amber-300 text-center space-y-2">
                      <p className="text-xs text-amber-900 leading-relaxed font-medium">
                        لم يتم إرفاق ملف بلاغ الهروب بعد.
                        {selectedEscape.escapeType === 'airport'
                          ? ' يرجى إرفاقه ليتم اعتماده كمرفق استلام للطلب لإغلاقه ونقله للمكتملة.'
                          : ''}
                      </p>
                      <label
                        className={`inline-flex items-center justify-center gap-2 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                          isAttachingInline ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,image/jpeg,image/png,image/webp"
                          onChange={(e) => handleInlineAttachReport(e, selectedEscape.id)}
                          disabled={isAttachingInline}
                        />
                        {isAttachingInline ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>جاري الرفع والربط بالطلب...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>رفع وإرفاق بلاغ الهروب الآن</span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>

                {/* Actions inside details modal */}
                {selectedEscape.status === 'recorded' ? (
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500 font-bold">اتخاذ إجراء على البلاغ:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const target = selectedEscape;
                          setSelectedEscape(null);
                          openDeportationModal(target);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                      >
                        <Plane className="w-4 h-4 text-teal-700" />
                        <span>ترحيل (سلسك)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const target = selectedEscape;
                          setSelectedEscape(null);
                          openReturnHousingModal(target);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                      >
                        <Building className="w-4 h-4 text-teal-700" />
                        <span>إعادة للسكن</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500 font-bold">حالة البلاغ في الأرشيف:</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-2xs ${
                      selectedEscape.status === 'returned_to_housing'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-sky-50 text-sky-800 border-sky-200'
                    }`}>
                      {selectedEscape.status === 'returned_to_housing' ? (
                        <>
                          <Building className="w-4 h-4 text-emerald-600" />
                          <span>تمت الإعادة للسكن (ملف مغلق)</span>
                        </>
                      ) : (
                        <>
                          <Plane className="w-4 h-4 text-sky-600" />
                          <span>تم الترحيل عبر سلسك (ملف مغلق)</span>
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Modal: New Escape Report */}
        {mounted && isAddModalOpen && createPortal(
          <div
            dir="rtl"
            className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 overflow-hidden"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
            }}
            onClick={() => setIsAddModalOpen(false)}
          >
            <div className="bg-white rounded-3xl w-full max-w-7xl 2xl:max-w-[1440px] p-5 sm:p-6 space-y-3.5 shadow-2xl border border-gray-100 text-right max-h-[95vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b pb-3 border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
                    <UserX className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900">تسجيل بلاغ هروب جديد</h3>
                    <p className="text-xs text-gray-500">اختر نوع الهروب وحدد العاملة مباشرة من كروت العاملات المتاحة</p>
                  </div>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer p-1">&times;</button>
              </div>

              {addError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs sm:text-sm flex items-center gap-2 shrink-0">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs sm:text-sm pr-0.5 pl-0.5">
                {/* 1. Escape Location / Type as Option Cards with Outer Count */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block font-bold text-gray-800 text-xs sm:text-sm">
                      نوع ومكان الهروب <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-gray-400 font-medium">
                      اختر المسار لتحديث قائمة العاملات تلقائياً
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {ESCAPE_TYPE_CARDS.map((opt) => {
                      const isSelected = addForm.escapeType === opt.id;
                      const count = categoryCounts[opt.countKey];
                      const IconComponent = opt.icon;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSelectedCandidate(null);
                            setCandidateSearch('');
                            setAddForm((prev) => ({
                              ...prev,
                              escapeType: opt.id,
                              homeMaidId: '',
                              housedWorkerId: null,
                              orderId: null,
                              clientId: null,
                              transferId: null,
                            }));
                          }}
                          className={`relative p-3 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 cursor-pointer text-xs group ${
                            isSelected
                              ? 'bg-gradient-to-br from-teal-50 via-teal-50/70 to-teal-100/40 border-teal-600 shadow-sm ring-2 ring-teal-600/30'
                              : 'bg-white hover:bg-teal-50/20 border-gray-200 hover:border-teal-300 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 w-full">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected
                                    ? 'bg-teal-700 text-white shadow-2xs'
                                    : 'bg-gray-100 text-gray-600 group-hover:bg-teal-100 group-hover:text-teal-800'
                                }`}
                              >
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div>
                                <span
                                  className={`font-bold block text-xs sm:text-sm ${
                                    isSelected ? 'text-teal-950 font-extrabold' : 'text-gray-900 group-hover:text-teal-900'
                                  }`}
                                >
                                  {opt.title}
                                </span>
                                <span className="text-[11px] text-gray-500 block leading-tight mt-0.5">
                                  {opt.subtitle}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Outer Count Badge on the Card */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-gray-100/80 w-full">
                            <span className="text-xs text-gray-400 font-medium">العاملات:</span>
                            <span
                              className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-lg font-bold transition-all ${
                                isSelected
                                  ? 'bg-teal-700 text-white shadow-2xs'
                                  : 'bg-gray-100 text-gray-700 group-hover:bg-teal-100 group-hover:text-teal-900'
                              }`}
                              dir="rtl"
                            >
                              <span className="font-mono">{count !== undefined ? count : '...'}</span>
                              <span>عاملة</span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Worker Selection: Dynamic Grid of Cards or Selected Card */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm">العاملة المعنية بالبلاغ <span className="text-red-500">*</span></span>
                      {!isManualIdMode && !selectedCandidate && (
                        <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200 min-w-[95px] text-center inline-flex items-center justify-center">
                          <span className="inline-flex items-center gap-1" dir="rtl">
                            <span className="font-mono">{candidates.length}</span>
                            <span>عاملة متاحة</span>
                          </span>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualIdMode(!isManualIdMode);
                        if (!isManualIdMode) setSelectedCandidate(null);
                      }}
                      className="text-xs text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
                    >
                      {isManualIdMode ? 'العودة للاختيار من كروت العاملات' : 'إدخال يدوي برقم ID'}
                    </button>
                  </div>

                  {isManualIdMode ? (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        required
                        placeholder="أدخل رقم العاملة (مثال: 104)"
                        value={addForm.homeMaidId}
                        onChange={(e) => {
                          const v = toEnglishDigits(e.target.value).replace(/[^0-9]/g, '');
                          setAddForm({ ...addForm, homeMaidId: v });
                        }}
                        className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-mono text-left outline-none focus:ring-2 focus:ring-teal-600 shadow-2xs"
                      />
                      <span className="text-xs text-gray-400 block">
                        سيقوم النظام تلقائياً بربط بيانات العقد وتاريخ الوصول بناءً على المعرف
                      </span>
                    </div>
                  ) : selectedCandidate ? (
                    /* Selected Candidate Preview Card across the modal width */
                    <div className="p-3.5 bg-gradient-to-r from-teal-50/80 via-white to-teal-50/40 border-2 border-teal-500 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {(() => {
                            const flagUrl = getCountryFlagUrl(selectedCandidate.nationality);
                            return flagUrl ? (
                              <img
                                src={flagUrl}
                                alt=""
                                className="w-5 h-3.5 object-cover rounded-xs border border-gray-200 inline-block shadow-2xs"
                              />
                            ) : null;
                          })()}
                          <span className="font-extrabold text-sm sm:text-base text-teal-950">{selectedCandidate.name}</span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-md font-bold ${
                              selectedCandidate.isExternal || selectedCandidate.nationality?.includes('عاملة خارجية')
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-teal-100 text-teal-900'
                            }`}
                          >
                            {selectedCandidate.nationality}
                          </span>
                          {selectedCandidate.categoryLabel && (
                            <span className="text-xs text-teal-800 font-bold bg-white px-2.5 py-0.5 rounded-md border border-teal-200 inline-flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                              <span>{selectedCandidate.categoryLabel}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-gray-400">جواز:</span>
                            <strong className="font-mono text-gray-900 font-bold tracking-wider" dir="ltr">
                              {selectedCandidate.passport}
                            </strong>
                          </span>
                          <span className="text-gray-300">|</span>
                          <span>معرف العاملة: <strong className="font-mono text-teal-700">#{selectedCandidate.homeMaidId}</strong></span>
                          {selectedCandidate.location && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span className="inline-flex items-center gap-1">
                                <Building className="w-3.5 h-3.5 text-teal-600" />
                                <span>الموقع: <strong>{selectedCandidate.location}</strong></span>
                              </span>
                            </>
                          )}
                          {selectedCandidate.clientName && selectedCandidate.clientName !== '—' && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span className="inline-flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                                <span>
                                  العميل: <strong>{selectedCandidate.clientName}</strong>
                                  {selectedCandidate.clientPhone && ` (${selectedCandidate.clientPhone})`}
                                  {selectedCandidate.clientNationalId && (
                                    <span className="text-teal-900 mr-1.5 font-mono font-bold bg-teal-100/70 px-1.5 py-0.5 rounded text-[11px] border border-teal-200">
                                      هوية: {selectedCandidate.clientNationalId}
                                    </span>
                                  )}
                                </span>
                              </span>
                            </>
                          )}
                          {(!selectedCandidate.clientName || selectedCandidate.clientName === '—') && selectedCandidate.clientNationalId && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span className="inline-flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                                <span>هوية العميل: <strong className="font-mono">{selectedCandidate.clientNationalId}</strong></span>
                              </span>
                            </>
                          )}
                          {selectedCandidate.receiptFile && (
                            <>
                              <span className="text-gray-300">|</span>
                              <a
                                href={selectedCandidate.receiptFile}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs"
                              >
                                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                                <span>عرض سند الاستلام</span>
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCandidate(null);
                          setAddForm((prev) => ({
                            ...prev,
                            homeMaidId: '',
                            housedWorkerId: null,
                            orderId: null,
                            clientId: null,
                            transferId: null,
                          }));
                        }}
                        className="shrink-0 flex items-center gap-1.5 text-xs text-teal-900 bg-white border border-teal-300 px-3.5 py-2 rounded-xl hover:bg-teal-50 font-bold cursor-pointer transition-all shadow-2xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-teal-700" />
                        <span>تغيير العاملة</span>
                      </button>
                    </div>
                  ) : (
                    /* Searchable Candidates in Multi-Column Grid - Height adjusted to fit 2 full rows cleanly */
                    <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50/70 space-y-2.5 h-[285px] flex flex-col relative overflow-hidden">
                      <div className="relative shrink-0">
                        <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3 pointer-events-none" />
                        <input
                          type="text"
                          value={candidateSearch}
                          onChange={(e) => setCandidateSearch(e.target.value)}
                          placeholder="ابحث برقم آيدي العاملة، الاسم، رقم الجواز، اسم العميل، جواله، أو رقم الهوية..."
                          className="w-full pr-10 pl-16 py-2 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-600 shadow-2xs"
                        />
                        <div className="absolute left-3 top-2.5 flex items-center gap-1.5">
                          {isLoadingCandidates && (
                            <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                          )}
                          {candidateSearch && (
                            <button
                              type="button"
                              onClick={() => setCandidateSearch('')}
                              className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div
                        className="flex-1 overflow-y-scroll pr-1 pl-0.5 relative"
                        style={{ scrollbarGutter: 'stable', scrollbarWidth: 'thin' }}
                      >
                        {isLoadingCandidates && candidates.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center gap-2.5 text-xs text-gray-500">
                            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                            <span className="font-bold text-gray-600">جاري البحث...</span>
                          </div>
                        ) : candidates.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center text-xs text-gray-500 bg-white border border-dashed border-gray-200 rounded-xl p-4">
                            <p className="font-bold text-gray-700 text-sm">لا توجد عاملات متطابقة في هذا القسم</p>
                            <p className="text-xs text-gray-400 mt-1">
                              يمكنك تغيير نوع الهروب أو استخدام زر "إدخال يدوي برقم ID" في الأعلى
                            </p>
                          </div>
                        ) : (
                          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 transition-opacity duration-150 ${isLoadingCandidates ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                            {candidates.map((cand, idx) => (
                              <div
                                key={`${cand.homeMaidId}-${cand.housedWorkerId || cand.orderId || idx}`}
                                onClick={() => {
                                  setSelectedCandidate(cand);
                                  setAddForm((prev) => ({
                                    ...prev,
                                    homeMaidId: String(cand.homeMaidId),
                                    housedWorkerId: cand.housedWorkerId || null,
                                    orderId: cand.orderId || null,
                                    clientId: cand.clientId || null,
                                    transferId: cand.transferId || null,
                                  }));
                                  setAddError('');
                                }}
                                className="p-2.5 bg-white border border-gray-200 hover:border-teal-500 hover:bg-teal-50/40 rounded-xl cursor-pointer transition-all flex flex-col justify-between gap-1.5 shadow-2xs hover:shadow-md group text-right"
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-1 mb-1">
                                    <span className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-teal-900 line-clamp-1">
                                      {cand.name}
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {(() => {
                                        const flagUrl = getCountryFlagUrl(cand.nationality);
                                        return flagUrl ? (
                                          <img
                                            src={flagUrl}
                                            alt=""
                                            className="w-4 h-3 object-cover rounded-xs border border-gray-200 inline-block shadow-2xs"
                                          />
                                        ) : null;
                                      })()}
                                      <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                          cand.isExternal || cand.nationality?.includes('عاملة خارجية')
                                            ? 'bg-amber-100 text-amber-900 border border-amber-300 group-hover:bg-amber-200'
                                            : 'bg-gray-100 text-gray-700 group-hover:bg-teal-100 group-hover:text-teal-900'
                                        }`}
                                      >
                                        {cand.nationality}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-[11px] text-gray-500 space-y-0.5">
                                    <div className="flex items-center justify-between text-gray-600">
                                      <span className="inline-flex items-center gap-1">
                                        <span className="text-gray-400">جواز:</span>
                                        <strong className="font-mono text-gray-900 font-bold" dir="ltr">{cand.passport}</strong>
                                      </span>
                                      <span className="font-mono text-teal-700 text-xs font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60" title="معرف العاملة">
                                        #{cand.homeMaidId}
                                      </span>
                                    </div>

                                    {cand.location && (
                                      <div className="flex items-center gap-1 text-[11px] text-gray-500 truncate">
                                        <Building className="w-3 h-3 text-teal-600 shrink-0" />
                                        <span className="truncate">{cand.location}</span>
                                      </div>
                                    )}

                                    {cand.clientName && cand.clientName !== '—' ? (
                                      <div className="flex items-center gap-1 text-[11px] text-gray-600 truncate">
                                        <UserCheck className="w-3 h-3 text-teal-600 shrink-0" />
                                        <span className="truncate">
                                          العميل: {cand.clientName}
                                          {cand.clientNationalId ? ` (${cand.clientNationalId})` : ''}
                                        </span>
                                      </div>
                                    ) : cand.clientNationalId ? (
                                      <div className="flex items-center gap-1 text-[11px] text-gray-600 truncate">
                                        <UserCheck className="w-3 h-3 text-teal-600 shrink-0" />
                                        <span className="truncate">هوية: {cand.clientNationalId}</span>
                                      </div>
                                    ) : null}

                                    {cand.receiptFile && (
                                      <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 w-fit">
                                        <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                                        <span>سند استلام موثق</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between">
                                  <span className="text-[10px] text-teal-700 font-medium">انقر للاختيار</span>
                                  <span className="text-xs px-3 py-0.5 bg-teal-50 group-hover:bg-teal-700 group-hover:text-white text-teal-800 rounded-lg font-bold border border-teal-200 transition-colors">
                                    اختيار
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Escape Date & Time in 2-Columns, Notes Underneath Full Width */}
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DateInputField
                      label="تاريخ الهروب"
                      required
                      value={addForm.escapeDate}
                      onChange={(val) => setAddForm({ ...addForm, escapeDate: val })}
                      accentColor="teal"
                    />
                    <TimeInputField
                      label="وقت الهروب"
                      value={addForm.escapeTime}
                      onChange={(val) => setAddForm({ ...addForm, escapeTime: val })}
                      accentColor="teal"
                    />
                  </div>

                  {/* File Upload for Escape Report */}
                  <div className={`p-3 rounded-xl border transition-all ${addForm.escapeType === 'airport' ? 'bg-amber-50/60 border-amber-300' : 'bg-gray-50/60 border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <FileText className={`w-4 h-4 ${addForm.escapeType === 'airport' ? 'text-amber-700' : 'text-gray-600'}`} />
                        <span className="font-bold text-xs sm:text-sm text-gray-800">
                          مرفق بلاغ الهروب (PDF / صورة)
                        </span>
                      </div>
                      {addForm.escapeType === 'airport' && (
                        <span className="text-[11px] text-amber-800 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-md font-bold">
                          يُعامل كمرفق استلام للطلب
                        </span>
                      )}
                    </div>

                    <input
                      type="file"
                      id="escape-report-file-add"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      onChange={handleReportFileUpload}
                      disabled={isUploadingReport || isSubmittingAdd}
                      className="hidden"
                    />

                    {addForm.reportFile ? (
                      <div className="flex items-center justify-between bg-white border border-teal-300 rounded-xl p-2.5 shadow-2xs">
                        <div className="flex items-center gap-2 text-xs text-teal-900 font-bold truncate">
                          <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                          <span className="truncate max-w-[280px]">{reportFileName || 'تم رفع ملف بلاغ الهروب بنجاح'}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={addForm.reportFile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-teal-700 hover:text-teal-900 font-bold underline"
                          >
                            معاينة
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setAddForm((prev) => ({ ...prev, reportFile: '' }));
                              setReportFileName('');
                            }}
                            className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="حذف المرفق"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="escape-report-file-add"
                        className="flex items-center justify-center gap-2 p-2.5 bg-white border-2 border-dashed border-gray-300 hover:border-teal-500 rounded-xl cursor-pointer text-xs font-bold text-gray-700 hover:text-teal-900 transition-all shadow-2xs"
                      >
                        {isUploadingReport ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
                            <span>جاري رفع ملف البلاغ...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-teal-700" />
                            <span>اضغط هنا لرفع ملف بلاغ الهروب</span>
                          </>
                        )}
                      </label>
                    )}

                    {reportUploadError && (
                      <div className="mt-1.5 text-xs text-rose-600 font-medium">
                        {reportUploadError}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 text-xs sm:text-sm mb-1">ملاحظات الواقعة</label>
                    <input
                      type="text"
                      placeholder="اكتب أي ملاحظات أو تفاصيل حول واقعة الهروب..."
                      value={addForm.notes}
                      onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                      className="w-full h-10 px-3.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-600 shadow-2xs"
                    />
                  </div>
                </div>

                {/* 4. Modal Footer Actions */}
                <div className="flex justify-end gap-2.5 pt-2.5 border-t border-gray-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAdd || (!addForm.homeMaidId && !selectedCandidate)}
                    className="px-7 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm disabled:opacity-50 cursor-pointer transition-all"
                  >
                    {isSubmittingAdd ? 'جاري الحفظ...' : 'حفظ البلاغ'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* Modal: Direct Deportation */}
        {mounted && isDeportationModalOpen && deportationTarget && createPortal(
          <div
            dir="rtl"
            className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
            }}
            onClick={() => {
              if (!isSubmittingDeportation && !isUploadingTicket && !isExtractingTicket) {
                setIsDeportationModalOpen(false);
              }
            }}
          >
            <div
              className="bg-white rounded-3xl w-full max-w-3xl p-5 sm:p-6 space-y-4 shadow-2xl border border-gray-100 text-right max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-3 border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
                    <Plane className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900">
                      إجراء ترحيل مباشر عبر الشركة السعودية للخدمات اللوجستية (سلسك)
                    </h3>
                    <p className="text-xs text-gray-500">
                      مخصص لحالات الترحيل والتسفير المباشر عبر (سلسك) فور شراء التذكرة دون عودة العاملة للمكتب
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeportationModalOpen(false)}
                  disabled={isSubmittingDeportation}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer p-1"
                >
                  &times;
                </button>
              </div>

              {/* Target Worker Summary Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  {(() => {
                    const flagUrl = getCountryFlagUrl(deportationTarget.homeMaid?.Nationalitycopy);
                    return flagUrl ? (
                      <img
                        src={flagUrl}
                        alt=""
                        className="w-5 h-3.5 object-cover rounded-xs border border-gray-200 inline-block shadow-2xs"
                      />
                    ) : null;
                  })()}
                  <span className="font-bold text-sm text-gray-900">
                    {deportationTarget.homeMaid?.Name || 'عاملة بدون اسم'}
                  </span>
                  <span className="text-xs text-gray-600 inline-flex items-center gap-1 font-medium bg-white px-2 py-0.5 rounded border border-gray-200">
                    <span className="text-gray-400">جواز:</span>
                    <strong className="font-mono text-gray-900 font-bold tracking-wider" dir="ltr">
                      {deportationTarget.homeMaid?.Passportnumber || '—'}
                    </strong>
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  <span>العميل: <strong className="text-gray-900">{deportationTarget.client?.fullname || deportationTarget.order?.ClientName || 'غير محدد'}</strong></span>
                </div>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleDeportationSubmit} className="space-y-4 overflow-y-auto pr-1 pl-0.5 flex-1 text-xs sm:text-sm">
                {/* 1. AI Ticket Upload Box */}
                <div className="bg-teal-50/20 border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-2xl p-4 text-center transition-all shadow-2xs">
                  <input
                    type="file"
                    id="deportation-ticket-file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    onChange={handleDeportationTicketUpload}
                    disabled={isUploadingTicket || isExtractingTicket || isSubmittingDeportation}
                    className="hidden"
                  />
                  <label htmlFor="deportation-ticket-file" className="cursor-pointer block">
                    <div className="w-11 h-11 rounded-2xl bg-teal-100/70 text-teal-800 flex items-center justify-center mx-auto mb-2 border border-teal-200 shadow-2xs group-hover:scale-105 transition-transform">
                      {isUploadingTicket || isExtractingTicket ? (
                        <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <Bot className="w-4 h-4 text-amber-600 animate-pulse" />
                      <span className="text-sm font-extrabold text-teal-950 block">
                        {ticketFileName ? `الملف المحدد: ${ticketFileName}` : 'اضغط هنا لرفع تذكرة السفر (PDF أو صور)'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 block">
                      يتم استخراج وقراءة بيانات الرحلة، المطار، وتواريخ المغادرة والوصول تلقائياً بواسطة الذكاء الاصطناعي (AI OCR)
                    </span>
                  </label>

                  {(isUploadingTicket || isExtractingTicket) && (
                    <div className="flex items-center justify-center gap-2 mt-3 text-xs text-teal-800 font-bold bg-teal-50 py-1.5 px-3 rounded-xl border border-teal-200 w-fit mx-auto">
                      <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
                      <span>{isExtractingTicket ? 'جاري قراءة واستخراج بيانات التذكرة بالذكاء الاصطناعي...' : 'جاري رفع ملف التذكرة...'}</span>
                    </div>
                  )}

                  {ticketUploadError && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 py-1 px-3 rounded-lg font-medium inline-block">
                      {ticketUploadError}
                    </div>
                  )}

                  {deportationForm.externalTicketFile && !isUploadingTicket && !isExtractingTicket && (
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <span className="text-xs text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs">
                        <Check className="w-4 h-4 text-emerald-600" />
                        تم إرفاق التذكرة بنجاح
                      </span>
                      <a
                        href={deportationForm.externalTicketFile}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-teal-700 hover:text-teal-900 underline font-bold px-2 py-1"
                      >
                        معاينة التذكرة المرفقة
                      </a>
                    </div>
                  )}
                </div>

                {/* Direct Deportation Guidance Alert (SALSC Exclusive) */}
                <div className="bg-red-50/70 border border-red-200 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-red-800 shadow-2xs">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <div className="leading-relaxed">
                    <strong>ترحيل مباشر عبر (سلسك):</strong> هذا الإجراء مخصص حصرياً للحالات التي يتم تسفيرها مباشرة من قِبل الشركة السعودية للخدمات اللوجستية (سلسك) فور توفير تذكرة السفر، دون الحاجة لمسؤول توصيل للمطار أو إعادتها للمكتب.
                  </div>
                </div>

                {/* 3. Departure & Arrival Cities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      مدينة المغادرة (المملكة) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={deportationForm.externaldeparatureCity}
                        onChange={(e) => setDeportationForm({ ...deportationForm, externaldeparatureCity: e.target.value })}
                        className="w-full appearance-none bg-white border border-gray-300 rounded-xl pr-3.5 pl-9 py-2.5 text-right text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-600 outline-none cursor-pointer shadow-2xs hover:border-gray-400 transition-colors"
                      >
                        {SAUDI_CITIES_LIST.map((city, idx) => (
                          <option key={idx} value={city}>{city}</option>
                        ))}
                      </select>
                      <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      مدينة الوصول (الوجهة الخارجية) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      list="foreign-cities-datalist"
                      placeholder="اكتب اسم مدينة الوصول الخارجية (مثال: أديس أبابا، مانيلا، دكا...)"
                      value={deportationForm.externalArrivalCity}
                      onChange={(e) => setDeportationForm({ ...deportationForm, externalArrivalCity: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-right text-xs sm:text-sm focus:ring-2 focus:ring-teal-600 outline-none shadow-2xs font-medium"
                    />
                    <datalist id="foreign-cities-datalist">
                      <option value="أديس أبابا" />
                      <option value="مانيلا" />
                      <option value="دكا" />
                      <option value="نيروبي" />
                      <option value="كمبالا" />
                      <option value="كولومبو" />
                      <option value="جاكرتا" />
                      <option value="القاهرة" />
                    </datalist>
                  </div>
                </div>

                {/* 4. Departure Date & Time + Arrival Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200">
                  <div className="space-y-1.5">
                    <span className="block text-xs font-bold text-gray-800">
                      تاريخ ووقت المغادرة (الإقلاع) <span className="text-red-500">*</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <DateInputField
                        value={deportationForm.externaldeparatureDate}
                        onChange={(val) => setDeportationForm({ ...deportationForm, externaldeparatureDate: val })}
                        required
                        accentColor="teal"
                      />
                      <TimeInputField
                        value={deportationForm.externaldeparatureTime}
                        onChange={(val) => setDeportationForm({ ...deportationForm, externaldeparatureTime: val })}
                        accentColor="teal"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-xs font-bold text-gray-800">
                      تاريخ ووقت الوصول (الخارجي)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <DateInputField
                        value={deportationForm.externalArrivalCityDate}
                        onChange={(val) => setDeportationForm({ ...deportationForm, externalArrivalCityDate: val })}
                        accentColor="teal"
                      />
                      <TimeInputField
                        value={deportationForm.externalArrivalCityTime}
                        onChange={(val) => setDeportationForm({ ...deportationForm, externalArrivalCityTime: val })}
                        accentColor="teal"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Notes */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    ملاحظات الترحيل والتسفير
                  </label>
                  <textarea
                    rows={2}
                    placeholder="أدخل أي تفاصيل أو ملاحظات خاصة بجهة الضبط أو التذكرة والتسفير المباشر..."
                    value={deportationForm.notes}
                    onChange={(e) => setDeportationForm({ ...deportationForm, notes: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-right text-xs sm:text-sm focus:ring-2 focus:ring-teal-600 outline-none shadow-2xs"
                  />
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsDeportationModalOpen(false)}
                    disabled={isSubmittingDeportation}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDeportation}
                    className="px-6 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm disabled:opacity-50 cursor-pointer transition-all flex items-center gap-2"
                  >
                    {isSubmittingDeportation ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري تسجيل الترحيل...</span>
                      </>
                    ) : (
                      <>
                        <Plane className="w-4 h-4" />
                        <span>تأكيد الترحيل عبر (سلسك)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* Modal: Return to Housing */}
        {mounted && isReturnHousingModalOpen && returnHousingTarget && createPortal(
          <div
            dir="rtl"
            className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
            }}
            onClick={() => {
              if (!isSubmittingReturnHousing) {
                setIsReturnHousingModalOpen(false);
              }
            }}
          >
            <div
              className="bg-white rounded-3xl w-full max-w-xl p-5 sm:p-6 space-y-4 shadow-2xl border border-gray-100 text-right max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-3 border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
                    <Building className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900">
                      إعادة العاملة إلى السكن
                    </h3>
                    <p className="text-xs text-gray-500">
                      تسجيل العاملة في السكن من جديد تحت إدارة الإيواء واستبعادها من بلاغات الهروب النشطة
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReturnHousingModalOpen(false)}
                  disabled={isSubmittingReturnHousing}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer p-1"
                >
                  &times;
                </button>
              </div>

              {/* Target Worker Info Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  {(() => {
                    const flagUrl = getCountryFlagUrl(returnHousingTarget.homeMaid?.Nationalitycopy);
                    return flagUrl ? (
                      <img
                        src={flagUrl}
                        alt=""
                        className="w-5 h-3.5 object-cover rounded-xs border border-gray-200 inline-block shadow-2xs"
                      />
                    ) : null;
                  })()}
                  <span className="font-bold text-sm text-gray-900">
                    {returnHousingTarget.homeMaid?.Name || 'عاملة بدون اسم'}
                  </span>
                  <span className="text-xs text-gray-600 inline-flex items-center gap-1 font-medium bg-white px-2 py-0.5 rounded border border-gray-200">
                    <span className="text-gray-400">جواز:</span>
                    <strong className="font-mono text-gray-900 font-bold tracking-wider" dir="ltr">
                      {returnHousingTarget.homeMaid?.Passportnumber || '—'}
                    </strong>
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  معرف العاملة: <strong className="font-mono text-emerald-700">#{returnHousingTarget.homeMaidId}</strong>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleReturnHousingSubmit} className="space-y-3.5 overflow-y-auto pr-1 pl-0.5 flex-1 text-xs sm:text-sm">
                {/* 1. Entry Date & Housing Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <DateInputField
                      label="تاريخ الدخول للسكن"
                      required
                      value={returnHousingForm.houseentrydate}
                      onChange={(val) => setReturnHousingForm({ ...returnHousingForm, houseentrydate: val })}
                      accentColor="teal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">
                      موقع ومبنى السكن <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={returnHousingForm.location_id}
                        onChange={(e) => setReturnHousingForm({ ...returnHousingForm, location_id: e.target.value })}
                        required
                        className="w-full appearance-none bg-white border border-gray-300 rounded-xl pr-3.5 pl-9 py-2.5 text-right text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-600 outline-none cursor-pointer shadow-2xs hover:border-gray-400 transition-colors"
                      >
                        <option value="">اختر مبنى السكن...</option>
                        {inHouseLocations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.location}
                          </option>
                        ))}
                      </select>
                      <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Reason for Return (Locked) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-800">
                      سبب التسكين المعتمد في النظام
                    </label>
                    <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-gray-400" />
                      غير قابل للتعديل
                    </span>
                  </div>
                  <div className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-right text-xs sm:text-sm font-semibold text-gray-700 shadow-2xs select-none">
                    تغييب عن العمل (هروب )
                  </div>
                </div>

                {/* 3. Initial Action in Housing */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    الإجراء المتخذ في السكن <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={returnHousingForm.actionTaken}
                      onChange={(e) => setReturnHousingForm({ ...returnHousingForm, actionTaken: e.target.value })}
                      className="w-full appearance-none bg-white border border-gray-300 rounded-xl pr-3.5 pl-9 py-2.5 text-right text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-600 outline-none cursor-pointer shadow-2xs hover:border-gray-400 transition-colors"
                    >
                      <option value="ترحيل">ترحيل</option>
                      <option value="نقل كفالة">نقل كفالة</option>
                    </select>
                    <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-gray-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* 4. Notes */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    ملاحظات إضافية
                  </label>
                  <textarea
                    rows={2}
                    placeholder="أي ملاحظات حول حالة العاملة عند عودتها أو التوصيات الخاصة بها..."
                    value={returnHousingForm.notes}
                    onChange={(e) => setReturnHousingForm({ ...returnHousingForm, notes: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-right text-xs sm:text-sm focus:ring-2 focus:ring-teal-600 outline-none shadow-2xs"
                  />
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsReturnHousingModalOpen(false)}
                    disabled={isSubmittingReturnHousing}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReturnHousing}
                    className="px-6 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm disabled:opacity-50 cursor-pointer transition-all flex items-center gap-2"
                  >
                    {isSubmittingReturnHousing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري حفظ القيد في السكن...</span>
                      </>
                    ) : (
                      <>
                        <Building className="w-4 h-4" />
                        <span>تأكيد الإعادة للسكن</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* Edit Escape Modal */}
        {mounted && isEditModalOpen && editingEscape && createPortal(
          <div
            dir="rtl"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isSubmittingEdit) {
                setIsEditModalOpen(false);
                setEditingEscape(null);
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="bg-gradient-to-l from-blue-900 to-teal-900 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Edit3 className="w-5 h-5 text-blue-200" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold">تعديل بيانات بلاغ الهروب</h3>
                    <p className="text-xs text-blue-100/80 font-mono mt-0.5">
                      العاملة: {editingEscape.homeMaid?.Name || editingEscape.homeMaidId} #{editingEscape.id}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isSubmittingEdit) {
                      setIsEditModalOpen(false);
                      setEditingEscape(null);
                    }
                  }}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                {/* نوع واقعة الهروب (ثابت - للقراءة فقط لضمان سلامة ومسارات الطلبات والسكن) */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] font-bold text-gray-500">نوع واقعة الهروب (ثابت):</span>
                    <span className="font-extrabold text-xs sm:text-sm text-gray-900 mt-0.5 inline-flex items-center gap-1.5">
                      {editingEscape.escapeType === 'airport'
                        ? '✈️ هروب من المطار'
                        : editingEscape.escapeType === 'housing'
                        ? '🏢 هروب من السكن'
                        : editingEscape.escapeType === 'trial_transfer'
                        ? '⏳ هروب أثناء تجربة نقل الكفالة'
                        : '👤 هروب من العميل'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Lock className="w-3 h-3 text-gray-500" />
                    غير قابل للتغيير
                  </span>
                </div>

                {/* تاريخ ووقت الهروب */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      تاريخ الهروب <span className="text-red-500">*</span>
                    </label>
                    <DateInputField
                      value={editForm.escapeDate}
                      onChange={(val) => setEditForm({ ...editForm, escapeDate: val })}
                      placeholder="تاريخ الهروب"
                      required
                      accentColor="teal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      وقت الهروب (اختياري)
                    </label>
                    <TimeInputField
                      value={editForm.escapeTime}
                      onChange={(val) => setEditForm({ ...editForm, escapeTime: val })}
                      placeholder="وقت الهروب"
                      accentColor="teal"
                    />
                  </div>
                </div>

                {/* مرفق بلاغ الهروب */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    ملف بلاغ الهروب المرفق
                  </label>
                  {editForm.reportFile ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50 border border-teal-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-teal-700 shrink-0" />
                        <a
                          href={editForm.reportFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-teal-900 hover:underline truncate"
                        >
                          معاينة ملف بلاغ الهروب المرفق
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, reportFile: '' })}
                        className="p-1 rounded-lg hover:bg-teal-100 text-rose-600 transition-colors cursor-pointer shrink-0"
                        title="حذف المرفق"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative border-2 border-dashed border-gray-300 hover:border-teal-500 rounded-xl p-3.5 text-center transition-colors bg-gray-50/50">
                      <input
                        type="file"
                        accept=".pdf,image/jpeg,image/png,image/webp"
                        onChange={handleEditReportUpload}
                        disabled={isUploadingEditReport}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                        {isUploadingEditReport ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                            <span className="font-bold text-teal-700">جاري رفع الملف...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-gray-400" />
                            <span className="font-bold text-gray-700">اضغط لرفع بلاغ الهروب (PDF أو صورة)</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {editReportError && (
                    <p className="text-[11px] text-red-600 font-bold mt-1">{editReportError}</p>
                  )}
                  {editForm.escapeType === 'airport' && (
                    <p className="text-[11px] text-teal-700 font-bold mt-1">
                      ℹ️ في حالة الهروب من المطار، يُعتمد هذا الملف كمرفق استلام للطلب لإغلاقه ونقله للمكتملة.
                    </p>
                  )}
                </div>

                {/* ملاحظات الهروب */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    ملاحظات وتفاصيل واقعة الهروب (اختياري)
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="أي ملاحظات أو تفاصيل إضافية..."
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingEscape(null);
                    }}
                    disabled={isSubmittingEdit}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit || isUploadingEditReport}
                    className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingEdit ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري الحفظ...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>حفظ التعديلات</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}


        {/* Toast Notification (matching housing-departures & transferSponsorships) */}
        {mounted && toastNotification.show && createPortal(
          <div
            dir="rtl"
            className="fixed top-5 right-5 z-[999999] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
          >
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md transition-all ${
                toastNotification.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-emerald-900/10'
                  : 'bg-red-50 border-red-200 text-red-900 shadow-red-900/10'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  toastNotification.type === 'success'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {toastNotification.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-bold">{toastNotification.message}</span>
              <button
                type="button"
                onClick={() => setToastNotification((prev) => ({ ...prev, show: false }))}
                className={`p-1 rounded-lg transition-colors mr-2 cursor-pointer ${
                  toastNotification.type === 'success'
                    ? 'text-emerald-700/60 hover:text-emerald-900 hover:bg-emerald-100'
                    : 'text-red-700/60 hover:text-red-900 hover:bg-red-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>,
          document.body
        )}

        <style jsx global>{`
          .en-date-field,
          .en-time-field,
          input[type="date"],
          input[type="time"] {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, Roboto, sans-serif !important;
            font-feature-settings: "lnum" 1, "tnum" 1, "locl" 0 !important;
            font-variant-numeric: lining-nums tabular-nums !important;
            -webkit-locale: "en-US" !important;
            direction: ltr !important;
          }

          .en-date-field::-webkit-datetime-edit,
          .en-date-field::-webkit-datetime-edit-fields-wrapper,
          .en-date-field::-webkit-datetime-edit-text,
          .en-date-field::-webkit-datetime-edit-minute,
          .en-date-field::-webkit-datetime-edit-hour,
          .en-date-field::-webkit-datetime-edit-ampm,
          .en-date-field::-webkit-datetime-edit-day-field,
          .en-date-field::-webkit-datetime-edit-month-field,
          .en-date-field::-webkit-datetime-edit-year-field,
          .en-time-field::-webkit-datetime-edit,
          .en-time-field::-webkit-datetime-edit-fields-wrapper,
          .en-time-field::-webkit-datetime-edit-text,
          .en-time-field::-webkit-datetime-edit-minute,
          .en-time-field::-webkit-datetime-edit-hour,
          .en-time-field::-webkit-datetime-edit-ampm {
            -webkit-locale: "en-US" !important;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, Roboto, sans-serif !important;
            font-feature-settings: "lnum" 1, "locl" 0 !important;
            font-variant-numeric: lining-nums tabular-nums !important;
            direction: ltr !important;
          }
        `}</style>
      </div>
    </Layout>
  );
}
