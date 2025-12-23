import { FileExcelOutlined, FilePdfOutlined, FilterOutlined } from '@ant-design/icons';
import Style from "styles/Home.module.css";
import Layout from 'example/containers/Layout';
import { Search, X, Eye, PlusCircle, Edit3, Trash2, Activity, Clock, ChevronLeft, ChevronRight, RefreshCw, Filter } from 'lucide-react';
import Head from 'next/head';
import { useEffect, useState, useCallback, useRef } from 'react';
import Select from 'react-select';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import axios, { AxiosError } from 'axios';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { useRouter } from 'next/router';

interface CustomJwtPayload extends JwtPayload {
  username?: string;
  id?: string;
}

interface LogUser {
  username: string;
  email?: string;
}

interface SystemLog {
  id: string | number;
  action: string;
  pageRoute: string;
  actionType?: string;
  details?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: LogUser;
}

interface ExportResponse {
  logs: SystemLog[];
  cursor: string | number | null;
  hasMore: boolean;
  batchSize: number;
}

interface Stats {
  total: number;
  today: number;
  views: number;
  creates: number;
  updates: number;
  deletes: number;
}

interface User {
  id: number;
  username: string;
}

// Action type configuration
const actionTypeConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ComponentType<any> }> = {
  view: { label: 'عرض', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', icon: Eye },
  create: { label: 'إنشاء', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', icon: PlusCircle },
  update: { label: 'تحديث', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200', icon: Edit3 },
  delete: { label: 'حذف', color: 'text-rose-700', bgColor: 'bg-rose-50 border-rose-200', icon: Trash2 },
};

export default function SystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, views: 0, creates: 0, updates: 0, deletes: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDateFrom, setDeleteDateFrom] = useState('');
  const [deleteDateTo, setDeleteDateTo] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const router = useRouter();
  const hasInitializedFromURL = useRef(false);

  // Fetch users for filter dropdown
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const response = await axios.get('/api/susers');
      setUsers(response.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode<CustomJwtPayload>(token);
        setUserName(decoded.username || 'مستخدم');
      }
    } catch (err) {
      console.error('Error decoding token:', err);
      setUserName('مستخدم');
    }
    fetchUsers();
  }, [fetchUsers]);

  // Sync URL params with state on mount and when router is ready (only once)
  useEffect(() => {
    if (!router.isReady || hasInitializedFromURL.current) return;

    const { searchTerm: urlSearchTerm, action, dateFrom: urlDateFrom, dateTo: urlDateTo, userId, page, pageSize: urlPageSize } = router.query;
    
    // Initialize from URL params
    if (urlSearchTerm) setSearchTerm(urlSearchTerm as string);
    if (action) setActionFilter(action as string);
    if (urlDateFrom) setDateFrom(urlDateFrom as string);
    if (urlDateTo) setDateTo(urlDateTo as string);
    if (userId) setSelectedUserId(parseInt(userId as string));
    if (page) setCurrentPage(parseInt(page as string));
    if (urlPageSize) setPageSize(parseInt(urlPageSize as string));
    
    hasInitializedFromURL.current = true;
  }, [router.isReady, router.query]); // Run when router becomes ready

  // Update URL params when filters change
  const updateURLParams = useCallback((filters: {
    searchTerm?: string;
    actionFilter?: string;
    dateFrom?: string;
    dateTo?: string;
    userId?: number | null;
    page?: number;
    pageSize?: number;
  }) => {
    const query: any = {};
    
    if (filters.searchTerm) query.searchTerm = filters.searchTerm;
    if (filters.actionFilter) query.action = filters.actionFilter;
    if (filters.dateFrom) query.dateFrom = filters.dateFrom;
    if (filters.dateTo) query.dateTo = filters.dateTo;
    if (filters.userId) query.userId = filters.userId.toString();
    if (filters.page && filters.page > 1) query.page = filters.page.toString();
    if (filters.pageSize && filters.pageSize !== 10) query.pageSize = filters.pageSize.toString();

    router.push({
      pathname: router.pathname,
      query,
    }, undefined, { shallow: true });
  }, [router]);

  // Fetch logs from API
  const fetchLogs = async (page = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/systemlogs', {
        params: {
          searchTerm: searchTerm || undefined,
          action: actionFilter || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          userId: selectedUserId || undefined,
          page,
          pageSize: pageSize.toString(),
        },
      });
      const logsData = response.data.logs || [];
      setLogs(logsData);
      setTotalCount(response.data.totalCount || 0);
      setCurrentPage(page);
      
      // Use stats from API (calculated on all data, not just current page)
      if (response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (err) {
      const error = err as AxiosError;
      console.error('Error fetching logs:', error.response?.data || error.message);
      setError('حدث خطأ أثناء تحميل السجلات. يرجى المحاولة مرة أخرى.');
      setLogs([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh logs
  const handleRefresh = () => {
    fetchLogs(currentPage);
  };

  // Delete logs by date range
  const handleDeleteLogs = async () => {
    if (!deleteDateFrom || !deleteDateTo) {
      setError('يجب تحديد تاريخ البداية وتاريخ النهاية');
      return;
    }

    const fromDate = new Date(deleteDateFrom);
    const toDate = new Date(deleteDateTo);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      setError('تواريخ غير صحيحة');
      return;
    }

    if (fromDate > toDate) {
      setError('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const response = await axios.delete('/api/systemlogs', {
        data: {
          dateFrom: deleteDateFrom,
          dateTo: deleteDateTo,
        },
      });

      if (response.data.success) {
        setShowDeleteModal(false);
        setDeleteDateFrom('');
        setDeleteDateTo('');
        // Refresh logs after deletion
        await fetchLogs(1);
        // Show success message
        setError('');
        alert(response.data.message || `تم حذف ${response.data.deletedCount} سجل بنجاح`);
      }
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage = (error.response?.data as any)?.error || 'حدث خطأ أثناء حذف السجلات';
      setError(errorMessage);
      console.error('Error deleting logs:', error.response?.data || error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper function to format date correctly (DD/MM/YYYY)
  const formatDate = (dateString: string | Date): string => {
    if (!dateString) return 'غير متوفر';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'غير متوفر';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  // Format relative time
  const formatRelativeTime = (dateString: string | Date): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return '';
  };

  // Fetch data in batches using streaming (memory efficient)
  const fetchLogsInBatches = async function* (batchSize: number = 1000) {
    let cursor: string | number | null = null;
    let hasMore = true;
    let totalFetched = 0;

    while (hasMore) {
      try {
        const response: { data: ExportResponse } = await axios.get<ExportResponse>('/api/systemlogs/export', {
          params: {
            batchSize: batchSize.toString(),
            searchTerm: searchTerm || undefined,
            action: actionFilter || undefined,
            userId: selectedUserId || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            cursor: cursor || undefined,
          },
          timeout: 60000,
        });

        const logs = response.data.logs || [];
        cursor = response.data.cursor;
        hasMore = response.data.hasMore;
        totalFetched += logs.length;

        if (logs.length > 0) {
          yield logs;
        }

        console.log(`تم جلب ${totalFetched} سجل...`);

        if (!hasMore) {
          break;
        }
      } catch (err) {
        const error = err as AxiosError;
        console.error('Error fetching logs batch:', error.response?.data || error.message);
        throw error;
      }
    }
  };

  // Helper function to convert ArrayBuffer to base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Helper function to split text into lines
  const splitTextIntoLines = (text: string, charsPerLine: number = 50): string => {
    if (!text || text.length <= charsPerLine) return text;
    
    const lines: string[] = [];
    let currentLine = '';
    
    for (let i = 0; i < text.length; i++) {
      currentLine += text[i];
      if (currentLine.length >= charsPerLine) {
        lines.push(currentLine);
        currentLine = '';
      }
    }
    
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    
    return lines.join('\n');
  };

  // Export to PDF with streaming
  const exportToPDF = async () => {
    try {
      setIsExporting(true);
      setError('');

      const doc = new jsPDF({ orientation: 'landscape' });

      const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
      if (!logo.ok) throw new Error('Failed to fetch logo');
      const logoBuffer = await logo.arrayBuffer();
      const logoBase64 = arrayBufferToBase64(logoBuffer);

      const fontResponse = await fetch('/fonts/Amiri-Regular.ttf');
      if (!fontResponse.ok) throw new Error('Failed to fetch font');
      const fontBuffer = await fontResponse.arrayBuffer();
      const fontBase64 = arrayBufferToBase64(fontBuffer);

      doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
      doc.setFont('Amiri', 'normal');
      doc.setLanguage('ar');
      doc.setFontSize(12);

      const headers = [['اسم المستخدم', 'وقت الإنشاء', 'تاريخ الإنشاء', 'الإجراء', 'رقم السجل']];
      let isFirstPage = true;
      let totalRows = 0;

      for await (const batch of fetchLogsInBatches(1000)) {
        const body = batch.map((row: SystemLog) => [
          row.user?.username || 'غير متوفر',
          row.createdAt ? new Date(row.createdAt).toLocaleTimeString('en-US', { 
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }) : 'غير متوفر',
          formatDate(row.createdAt),
          splitTextIntoLines(row.action || 'غير متوفر', 30),
          row.id || 'غير متوفر',
        ]);

        doc.autoTable({
          head: isFirstPage ? headers : undefined,
          body: body,
          startY: isFirstPage ? 42 : undefined,
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
            halign: 'center',
            cellPadding: 3,
          },
          columnStyles: {
            3: {
              cellWidth: 'auto',
              overflow: 'linebreak',
            },
          },
          margin: { top: isFirstPage ? 42 : 10, right: 10, left: 10 },
          didDrawPage: () => {
            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;

            doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

            if (doc.getCurrentPageInfo().pageNumber === 1) {
              doc.setFontSize(12);
              doc.setFont('Amiri', 'normal');
              doc.text('سجل النظام', pageWidth / 2, 20, { align: 'right' });
            }

            doc.setFontSize(10);
            doc.setFont('Amiri', 'normal');
            doc.text(userName, 10, pageHeight - 10, { align: 'left' });

            const pageNumber = `صفحة ${doc.getCurrentPageInfo().pageNumber}`;
            doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });

            const dateText = `التاريخ: ${new Date().toLocaleDateString('ar-EG', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })} الساعة: ${new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}`;
            doc.text(dateText, pageWidth - 10, pageHeight - 10, { align: 'right' });
          },
          didParseCell: (hookData: any) => {
            hookData.cell.styles.halign = 'right';
            if (hookData.section === 'head') {
              hookData.cell.styles.cellWidth = 'auto';
            }
          },
        });

        totalRows += batch.length;
        isFirstPage = false;
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      if (totalRows === 0) {
        setError('لا توجد بيانات للتصدير.');
        setIsExporting(false);
        return;
      }

      doc.save(`سجل_النظام_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.pdf`);
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      if (error.message?.includes('timeout') || error.message?.includes('ECONNABORTED')) {
        setError('انتهت مهلة الاتصال. البيانات كثيرة جداً. يرجى استخدام الفلاتر لتقليل البيانات.');
      } else if (error.message?.includes('Failed to fetch')) {
        setError('فشل تحميل الملفات المطلوبة (الشعار أو الخط). يرجى التحقق من الاتصال بالإنترنت.');
      } else {
        setError('حدث خطأ أثناء تصدير PDF. يرجى المحاولة مرة أخرى أو تقليل كمية البيانات باستخدام الفلاتر.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Excel with streaming
  const exportToExcel = async () => {
    try {
      setIsExporting(true);
      setError('');

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['رقم السجل', 'الإجراء', 'تاريخ الإنشاء', 'وقت الإنشاء', 'اسم المستخدم']
      ]);

      const colWidths = [
        { wch: 15 },
        { wch: 30 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
      ];
      worksheet['!cols'] = colWidths;

      let totalRows = 0;
      let currentRow = 1;

      for await (const batch of fetchLogsInBatches(1000)) {
        const batchData: any[][] = batch.map((row: SystemLog) => [
          row.id || 'غير متوفر',
          row.action || 'غير متوفر',
          formatDate(row.createdAt),
          row.createdAt ? new Date(row.createdAt).toLocaleTimeString('ar-EG', { 
            hour: '2-digit',
            minute: '2-digit'
          }) : 'غير متوفر',
          row.user?.username || 'غير متوفر',
        ]);

        XLSX.utils.sheet_add_aoa(worksheet, batchData, { origin: `A${currentRow + 1}` });
        currentRow += batch.length;
        totalRows += batch.length;
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      if (totalRows === 0) {
        setError('لا توجد بيانات للتصدير.');
        setIsExporting(false);
        return;
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل النظام');
      XLSX.writeFile(workbook, `سجل_النظام_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.xlsx`, { compression: true });
    } catch (error: any) {
      console.error('Error exporting Excel:', error);
      if (error.message?.includes('timeout') || error.message?.includes('ECONNABORTED')) {
        setError('انتهت مهلة الاتصال. البيانات كثيرة جداً. يرجى استخدام الفلاتر لتقليل البيانات.');
      } else if (error.message?.includes('QuotaExceededError') || error.message?.includes('out of memory')) {
        setError('البيانات كثيرة جداً وتتجاوز سعة الذاكرة. يرجى استخدام الفلاتر لتقليل البيانات.');
      } else {
        setError('حدث خطأ أثناء تصدير Excel. يرجى المحاولة مرة أخرى أو تقليل كمية البيانات باستخدام الفلاتر.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Debounce search term and fetch logs
  useEffect(() => {
    if (!router.isReady) return;
    const timer = setTimeout(() => {
      fetchLogs(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, actionFilter, dateFrom, dateTo, selectedUserId, pageSize, router.isReady]);

  // Fetch logs when page changes
  useEffect(() => {
    if (!router.isReady) return;
    fetchLogs(currentPage);
  }, [currentPage, router.isReady]);

  // Action filter options
  const actionOptions = [
    { value: '', label: 'كل الإجراءات' },
    { value: 'view', label: 'عرض' },
    { value: 'create', label: 'إنشاء' },
    { value: 'update', label: 'تحديث' },
    { value: 'delete', label: 'حذف' },
  ];

  // Page size options
  const pageSizeOptions = [
    { value: 10, label: '10 صفوف' },
    { value: 25, label: '25 صف' },
    { value: 50, label: '50 صف' },
    { value: 100, label: '100 صف' },
  ];

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    updateURLParams({ searchTerm: value, page: 1 });
  };

  // Handle page size change
  const handlePageSizeChange = (selectedOption: any) => {
    const newPageSize = selectedOption.value;
    setPageSize(newPageSize);
    setCurrentPage(1);
    updateURLParams({ pageSize: newPageSize, page: 1 });
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setActionFilter('');
    setDateFrom('');
    setDateTo('');
    setSelectedUserId(null);
    setCurrentPage(1);
    updateURLParams({ searchTerm: '', actionFilter: '', dateFrom: '', dateTo: '', userId: null, page: 1 });
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || actionFilter || dateFrom || dateTo || selectedUserId;

  // Pagination logic
  const totalPages = Math.ceil(totalCount / pageSize);
  const startRecord = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Function to extract path after /admin
  const getPathAfterAdmin = (url: string): string => {
    if (!url) return '';
    
    let path = url;
    try {
      const urlObj = new URL(url);
      path = urlObj.pathname;
    } catch {
      path = url;
    }
    
    const adminIndex = path.indexOf('/admin');
    if (adminIndex !== -1) {
      const afterAdmin = path.substring(adminIndex + '/admin'.length);
      return afterAdmin || '';
    }
    
    return path.startsWith('/') ? path : `/${path}`;
  };

  // Get action badge component
  const getActionBadge = (action: string, actionType?: string) => {
    const type = actionType || 'view';
    const config = actionTypeConfig[type] || actionTypeConfig.view;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${config.bgColor} ${config.color} transition-all duration-200 hover:shadow-sm`}>
        <Icon size={14} />
        <span>{action || 'غير متوفر'}</span>
      </span>
    );
  };

  // Select styles
  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: '#FAFAFA',
      borderColor: state.isFocused ? '#0D9488' : '#E5E7EB',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(13, 148, 136, 0.1)' : 'none',
      textAlign: 'right',
      minHeight: '42px',
      borderRadius: '10px',
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: '#0D9488',
      },
    }),
    menu: (base: any) => ({
      ...base,
      textAlign: 'right',
      borderRadius: '10px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
      border: '1px solid #E5E7EB',
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? '#0D9488' : state.isFocused ? '#F0FDFA' : 'white',
      color: state.isSelected ? 'white' : '#374151',
      cursor: 'pointer',
    }),
  };

  const renderPagination = () => {
    if (totalCount === 0) return null;

    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-sm font-medium transition-all duration-200 hover:border-teal-300"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="dots1" className="px-2 text-gray-400">
            •••
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`w-10 h-10 flex items-center justify-center border rounded-lg text-sm font-medium transition-all duration-200 ${
            i === currentPage
              ? 'border-teal-600 bg-teal-600 text-white shadow-lg shadow-teal-200'
              : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-teal-300'
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="dots2" className="px-2 text-gray-400">
            •••
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-sm font-medium transition-all duration-200 hover:border-teal-300"
        >
          {totalPages}
        </button>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 pt-4 border-t border-gray-100">
        <span className="text-sm text-gray-500">
          عرض <span className="font-semibold text-gray-700">{startRecord}</span> - <span className="font-semibold text-gray-700">{endRecord}</span> من <span className="font-semibold text-gray-700">{totalCount.toLocaleString()}</span> سجل
        </span>
        <nav className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg bg-white transition-all duration-200 ${
              currentPage === 1 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-50 hover:border-teal-300 cursor-pointer'
            }`}
          >
            <ChevronRight size={18} />
          </button>
          {pages}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg bg-white transition-all duration-200 ${
              currentPage === totalPages 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-50 hover:border-teal-300 cursor-pointer'
            }`}
          >
            <ChevronLeft size={18} />
          </button>
        </nav>
      </div>
    );
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-6 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      ))}
    </div>
  );

  return (
    <Layout>
      <Head>
        <title>سجل النظام</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className={`text-gray-800 ${Style['tajawal-regular']} min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30`} dir="rtl">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg shadow-teal-200">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                سجل النظام
              </h1>
              <p className="text-gray-500 mt-2 text-sm">متابعة وتتبع جميع الأنشطة والعمليات في النظام</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-teal-300 transition-all duration-200 shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              <span>تحديث</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {/* Total - Not clickable */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Activity className="w-5 h-5 text-slate-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">إجمالي السجلات</div>
            </div>

            {/* Today - Not clickable */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5 text-teal-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.today}</div>
              <div className="text-xs text-gray-500 mt-1">اليوم</div>
            </div>

            {/* View - Clickable Filter */}
            <button
              onClick={() => {
                const newFilter = actionFilter === 'view' ? '' : 'view';
                setActionFilter(newFilter);
                updateURLParams({ actionFilter: newFilter, page: 1 });
              }}
              className={`text-right rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer ${
                actionFilter === 'view'
                  ? 'bg-blue-500 border-2 border-blue-600 ring-4 ring-blue-200'
                  : 'bg-white border border-blue-100 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                  actionFilter === 'view' ? 'bg-white/20' : 'bg-gradient-to-br from-blue-100 to-blue-200'
                }`}>
                  <Eye className={`w-5 h-5 ${actionFilter === 'view' ? 'text-white' : 'text-blue-600'}`} />
                </div>
                {actionFilter === 'view' && (
                  <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full">فعّال</span>
                )}
              </div>
              <div className={`text-2xl font-bold ${actionFilter === 'view' ? 'text-white' : 'text-blue-700'}`}>{stats.views}</div>
              <div className={`text-xs mt-1 ${actionFilter === 'view' ? 'text-blue-100' : 'text-blue-600'}`}>عرض</div>
            </button>

            {/* Create - Clickable Filter */}
            <button
              onClick={() => {
                const newFilter = actionFilter === 'create' ? '' : 'create';
                setActionFilter(newFilter);
                updateURLParams({ actionFilter: newFilter, page: 1 });
              }}
              className={`text-right rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer ${
                actionFilter === 'create'
                  ? 'bg-teal-800 border-2  text-white '
                  : 'bg-white border border-emerald-100 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                  actionFilter === 'create' ? 'bg-white/20' : 'bg-gradient-to-br from-emerald-100 to-emerald-200'
                }`}>
                  <PlusCircle className={`w-5 h-5 ${actionFilter === 'create' ? 'text-white' : 'text-emerald-600'}`} />
                </div>
                {actionFilter === 'create' && (
                  <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full">فعّال</span>
                )}
              </div>
              <div className={`text-2xl font-bold ${actionFilter === 'create' ? 'text-white' : 'text-emerald-700'}`}>{stats.creates}</div>
              <div className={`text-xs mt-1 ${actionFilter === 'create' ? 'text-emerald-100' : 'text-emerald-600'}`}>إنشاء</div>
            </button>

            {/* Update - Clickable Filter */}
            <button
              onClick={() => {
                const newFilter = actionFilter === 'update' ? '' : 'update';
                setActionFilter(newFilter);
                updateURLParams({ actionFilter: newFilter, page: 1 });
              }}
              className={`text-right rounded-2xl p-5 shadow-sm hover:shadow-md  transition-all duration-300 group cursor-pointer ${
                actionFilter === 'update'
                  ? 'bg-teal-800 border-2  text-white ring-4 ring-amber-200'
                  : 'bg-white border border-teal-100 hover:border-teal-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                  actionFilter === 'update' ? 'bg-white/20' : 'bg-gradient-to-br from-teal-100 to-teal-200'
                }`}>
                  <Edit3 className={`w-5 h-5 ${actionFilter === 'update' ? 'text-white' : 'text-amber-600'}`} />
                </div>
                {actionFilter === 'update' && (
                  <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full">فعّال</span>
                )}
              </div>
              <div className={`text-2xl font-bold ${actionFilter === 'update' ? 'text-white' : 'text-amber-700'}`}>{stats.updates}</div>
              <div className={`text-xs mt-1 ${actionFilter === 'update' ? 'text-amber-100' : 'text-amber-600'}`}>تحديث</div>
            </button>

            {/* Delete - Clickable Filter */}
            <button
              onClick={() => {
                const newFilter = actionFilter === 'delete' ? '' : 'delete';
                setActionFilter(newFilter);
                updateURLParams({ actionFilter: newFilter, page: 1 });
              }}
              className={`text-right rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer ${
                actionFilter === 'delete'
                  ? 'bg-teal-800 border-2  text-white '
                  : 'bg-white border border-rose-100 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                  actionFilter === 'delete' ? 'bg-white/20' : 'bg-gradient-to-br from-rose-100 to-rose-200'
                }`}>
                  <Trash2 className={`w-5 h-5 ${actionFilter === 'delete' ? 'text-white' : 'text-rose-600'}`} />
                </div>
                {/* {actionFilter === 'delete' && (
                  <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full">فعّال</span>
                )} */}
              </div>
              <div className={`text-2xl font-bold ${actionFilter === 'delete' ? 'text-white' : 'text-rose-700'}`}>{stats.deletes}</div>
              <div className={`text-xs mt-1 ${actionFilter === 'delete' ? 'text-rose-100' : 'text-rose-600'}`}>حذف</div>
            </button>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Error Alert */}
            {error && (
              <div className="m-6 mb-0 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <X className="w-4 h-4 text-red-600" />
                </div>
                <span className="text-sm">{error}</span>
                <button onClick={() => setError('')} className="mr-auto text-red-500 hover:text-red-700">
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Filters Section */}
            <div className="p-6 border-b border-gray-100">
              {/* Search and Filters Row */}
              <div className="flex flex-col xl:flex-row gap-4 mb-4">
                {/* Search Input - Full Width on Mobile */}
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="بحث في الإجراء أو اسم المستخدم..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-xl text-right outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 transition-all duration-200 shadow-sm"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Search className="text-gray-500" size={16} />
                  </div>
                </div>

                {/* Filters Group */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Filter Modal Button */}
                  <button
                    onClick={() => setShowFilterModal(true)}
                    className={`h-11 px-4 bg-white border rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-medium ${
                      hasActiveFilters
                        ? 'border-teal-500 text-teal-600 bg-teal-50 hover:bg-teal-100'
                        : 'border-gray-200 text-gray-700 hover:border-teal-300 hover:bg-gray-50'
                    }`}
                  >
                    <Filter size={16} />
                    <span>بحث متقدم</span>
                    {hasActiveFilters && (
                      <span className="w-5 h-5 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs">
                        {[searchTerm, actionFilter, dateFrom, dateTo, selectedUserId].filter(Boolean).length}
                      </span>
                    )}
                  </button>

                  {/* Date From */}
                  <div className="relative">
                    <label className="absolute -top-2 right-3 bg-white px-1 text-[10px] text-gray-500 z-10">من تاريخ</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value);
                        updateURLParams({ dateFrom: e.target.value, page: 1 });
                      }}
                      className="h-11 w-40 px-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 transition-all duration-200 text-sm shadow-sm"
                    />
                  </div>

                  {/* Date To */}
                  <div className="relative">
                    <label className="absolute -top-2 right-3 bg-white px-1 text-[10px] text-gray-500 z-10">إلى تاريخ</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value);
                        updateURLParams({ dateTo: e.target.value, page: 1 });
                      }}
                      className="h-11 w-40 px-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 transition-all duration-200 text-sm shadow-sm"
                    />
                  </div>

                  {/* Page Size */}
                  <div className="w-32">
                    <Select
                      options={pageSizeOptions}
                      onChange={handlePageSizeChange}
                      value={pageSizeOptions.find(opt => opt.value === pageSize)}
                      styles={selectStyles}
                      isRtl
                    />
                  </div>

                  {/* Reset Button */}
                  {hasActiveFilters && (
                    <button
                      className="h-11 px-4 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                      onClick={handleResetFilters}
                    >
                      <X size={16} />
                      <span>مسح الفلاتر</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Export Buttons Row */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  {hasActiveFilters && (
                    <span className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg flex-wrap">
                      <FilterOutlined />
                      <span>الفلاتر نشطة:</span>
                      {actionFilter && (
                        <span className="bg-teal-100 px-2 py-0.5 rounded text-xs">
                          {actionOptions.find(opt => opt.value === actionFilter)?.label}
                        </span>
                      )}
                      {selectedUserId && (
                        <span className="bg-teal-100 px-2 py-0.5 rounded text-xs">
                          مستخدم: {users.find(u => u.id === selectedUserId)?.username || selectedUserId}
                        </span>
                      )}
                      {dateFrom && (
                        <span className="bg-teal-100 px-2 py-0.5 rounded text-xs">
                          من: {dateFrom}
                        </span>
                      )}
                      {dateTo && (
                        <span className="bg-teal-100 px-2 py-0.5 rounded text-xs">
                          إلى: {dateTo}
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="h-10 px-5 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all duration-200 flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setShowDeleteModal(true)}
                    disabled={isLoading || isDeleting}
                  >
                    <Trash2 size={16} />
                    <span>حذف السجلات</span>
                  </button>
                  <button
                    className="h-10 px-5 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all duration-200 flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={exportToPDF}
                    disabled={isLoading || isExporting || logs.length === 0}
                  >
                    <FilePdfOutlined />
                    <span>تصدير PDF</span>
                  </button>
                  <button
                    className="h-10 px-5 bg-white border border-emerald-200 text-emerald-600 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={exportToExcel}
                    disabled={isLoading || isExporting || logs.length === 0}
                  >
                    <FileExcelOutlined />
                    <span>تصدير Excel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {isLoading ? (
                <LoadingSkeleton />
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6">
                    <Activity className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد سجلات</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    {hasActiveFilters
                      ? 'لم يتم العثور على سجلات تطابق معايير البحث. جرب تعديل الفلاتر.'
                      : 'لم يتم تسجيل أي نشاط بعد.'}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={handleResetFilters}
                      className="mt-4 px-4 py-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                    >
                      مسح جميع الفلاتر
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-gradient-to-r from-teal-700 to-teal-800 text-white">
                      <th className="p-4 font-medium text-sm">رقم السجل</th>
                      <th className="p-4 font-medium text-sm">الإجراء</th>
                      <th className="p-4 font-medium text-sm">عنوان الصفحة</th>
                      <th className="p-4 font-medium text-sm">تاريخ الإنشاء</th>
                      <th className="p-4 font-medium text-sm">وقت الإنشاء</th>
                      <th className="p-4 font-medium text-sm">الصفحة</th>
                      <th className="p-4 font-medium text-sm">المستخدم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((log, index) => (
                      <tr 
                        key={log.id || index} 
                        className="hover:bg-teal-50/50 transition-colors duration-150 group"
                      >
                        <td className="p-4">
                          <span className="text-sm text-gray-500 font-mono">#{log.id || 'N/A'}</span>
                        </td>
                        <td className="p-4">
                          {getActionBadge(log.action, log.actionType)}
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
                            {log.details || 'غير متوفر'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-700">
                              {log.createdAt
                                ? new Date(log.createdAt).toLocaleDateString('ar-EG', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'غير متوفر'}
                            </span>
                            <span className="text-xs text-gray-400">{formatRelativeTime(log.createdAt)}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-600">
                            {log.createdAt
                              ? new Date(log.createdAt).toLocaleTimeString('ar-EG', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'غير متوفر'}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => router.push(log.pageRoute)}
                            className="text-sm text-teal-600 hover:text-teal-800 hover:underline transition-colors font-medium"
                          >
                            {getPathAfterAdmin(log.pageRoute) || log.pageRoute || 'غير متوفر'}
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                              {(log.user?.username || 'م').charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-700">{log.user?.username || 'غير متوفر'}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div className="px-6 pb-6">
              {renderPagination()}
            </div>
          </div>
        </div>
      </div>

      {/* Export Loading Overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
            <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
            <h3 className="text-lg font-semibold text-gray-900">جارٍ التصدير...</h3>
            <p className="text-sm text-gray-500 text-center">يرجى الانتظار بينما يتم تجهيز الملف</p>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowFilterModal(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Filter size={20} className="text-teal-600" />
                فلاتر البحث المتقدمة
              </h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Search Term */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البحث في الإجراء</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ابحث في نص الإجراء..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 bg-white border border-gray-200 rounded-xl text-right outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 transition-all duration-200"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Search className="text-gray-500" size={16} />
                  </div>
                </div>
              </div>

              {/* User Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اختر المستخدم</label>
                <Select
                  options={[
                    { value: null, label: 'جميع المستخدمين' },
                    ...users.map(user => ({ value: user.id, label: user.username }))
                  ]}
                  value={selectedUserId 
                    ? { value: selectedUserId, label: users.find(u => u.id === selectedUserId)?.username || `مستخدم #${selectedUserId}` }
                    : { value: null, label: 'جميع المستخدمين' }
                  }
                  onChange={(selected: any) => {
                    setSelectedUserId(selected?.value || null);
                  }}
                  isLoading={isLoadingUsers}
                  styles={selectStyles}
                  isRtl
                  isClearable
                  placeholder="اختر مستخدم..."
                />
              </div>

              {/* Action Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع الإجراء</label>
                <Select
                  options={actionOptions}
                  value={actionOptions.find(opt => opt.value === actionFilter) || actionOptions[0]}
                  onChange={(selected: any) => {
                    setActionFilter(selected?.value || '');
                  }}
                  styles={selectStyles}
                  isRtl
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full h-11 px-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 transition-all duration-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full h-11 px-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 transition-all duration-200 text-sm"
                  />
                </div>
              </div>

              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-teal-800 mb-2">الفلاتر النشطة:</p>
                  <div className="flex flex-wrap gap-2">
                    {searchTerm && (
                      <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-700 px-3 py-1 rounded-lg text-xs">
                        بحث: {searchTerm}
                        <button
                          onClick={() => setSearchTerm('')}
                          className="hover:text-teal-900"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}
                    {selectedUserId && (
                      <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-700 px-3 py-1 rounded-lg text-xs">
                        مستخدم: {users.find(u => u.id === selectedUserId)?.username || selectedUserId}
                        <button
                          onClick={() => setSelectedUserId(null)}
                          className="hover:text-teal-900"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}
                    {actionFilter && (
                      <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-700 px-3 py-1 rounded-lg text-xs">
                        {actionOptions.find(opt => opt.value === actionFilter)?.label}
                        <button
                          onClick={() => setActionFilter('')}
                          className="hover:text-teal-900"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}
                    {dateFrom && (
                      <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-700 px-3 py-1 rounded-lg text-xs">
                        من: {dateFrom}
                        <button
                          onClick={() => setDateFrom('')}
                          className="hover:text-teal-900"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}
                    {dateTo && (
                      <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-700 px-3 py-1 rounded-lg text-xs">
                        إلى: {dateTo}
                        <button
                          onClick={() => setDateTo('')}
                          className="hover:text-teal-900"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleResetFilters}
                className="flex-1 h-11 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium"
              >
                <X size={16} />
                <span>مسح الكل</span>
              </button>
              <button
                onClick={() => {
                  updateURLParams({ searchTerm, actionFilter, dateFrom, dateTo, userId: selectedUserId, page: 1 });
                  setShowFilterModal(false);
                }}
                className="flex-1 h-11 px-4 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Filter size={16} />
                <span>تطبيق الفلاتر</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => !isDeleting && setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">حذف السجلات</h3>
              <button
                onClick={() => !isDeleting && setShowDeleteModal(false)}
                disabled={isDeleting}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-1">تحذير: هذه العملية لا يمكن التراجع عنها</p>
                    <p className="text-xs text-red-600">سيتم حذف جميع السجلات في النطاق الزمني المحدد بشكل دائم</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
                  <input
                    type="date"
                    value={deleteDateFrom}
                    onChange={(e) => setDeleteDateFrom(e.target.value)}
                    disabled={isDeleting}
                    className="w-full h-11 px-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
                  <input
                    type="date"
                    value={deleteDateTo}
                    onChange={(e) => setDeleteDateTo(e.target.value)}
                    disabled={isDeleting}
                    className="w-full h-11 px-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteDateFrom('');
                  setDeleteDateTo('');
                  setError('');
                }}
                disabled={isDeleting}
                className="flex-1 h-11 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteLogs}
                disabled={isDeleting || !deleteDateFrom || !deleteDateTo}
                className="flex-1 h-11 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>تأكيد الحذف</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
