import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css";
import AlertModal from '../../../components/AlertModal';
import { PencilAltIcon, DocumentDownloadIcon, TableIcon } from '@heroicons/react/outline';
import { TrashIcon } from '@heroicons/react/solid';
import { FaExclamationTriangle } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
interface EmployeeDetail {
  id: number;
  name: string;
  position?: string;
  department?: string;
  totalDebit: number;
  totalCredit: number;
  totalBalance: number;
  transactions: EmployeeTransaction[];
  settlements?: {
    totalDetailsDebit: number;
    totalDetailsCredit: number;
    totalCashReceived: number;
    totalCashExpenses: number;
  };
}

interface EmployeeTransaction {
  id: number;
  date: string;
  month: string;
  mainAccount: string;
  subAccount: string;
  client: string;
  debit: number;
  credit: number;
  balance: number;
  description: string;
  attachment: string;
  type?: 'detail' | 'cash';
}

const allowedAttachmentTypes = ['application/pdf', 'image/jpeg', 'image/png'];

const isPlaceholderAttachment = (a: string | undefined) => !a || a === 'عرض';

const transactionTypeLabel = (t?: EmployeeTransaction['type']) =>
  t === 'detail' ? 'تفاصيل' : t === 'cash' ? 'عهدة نقدية' : '';

const truncateForPdf = (text: string, maxLen = 48): string => {
  if (!text || text === 'غير متوفر') return text || '';
  const s = text.trim();
  return s.length <= maxLen ? s : `${s.slice(0, maxLen)}…`;
};

export default function EmployeeCashDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    client: '',
    movementType: '',
    fromDate: '',
    toDate: ''
  });

  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [alertMessage, setAlertMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<EmployeeTransaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fileAddRecordRef = useRef<HTMLInputElement>(null);
  const fileEditRecordRef = useRef<HTMLInputElement>(null);

  const [addAttachmentUrl, setAddAttachmentUrl] = useState('');
  const [addAttachmentFileName, setAddAttachmentFileName] = useState('');
  const [addAttachmentUploading, setAddAttachmentUploading] = useState(false);
  const [addAttachmentError, setAddAttachmentError] = useState('');

  const [editAttachmentUrl, setEditAttachmentUrl] = useState('');
  const [editAttachmentFileName, setEditAttachmentFileName] = useState('');
  const [editAttachmentUploading, setEditAttachmentUploading] = useState(false);
  const [editAttachmentError, setEditAttachmentError] = useState('');

  const [userName, setUserName] = useState('');

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    if (authToken) {
      try {
        const decoder: { username?: string } = jwtDecode(authToken);
        setUserName(decoder?.username || '');
      } catch {
        // ignore
      }
    }
  }, []);

  const uploadAttachmentToSpaces = async (file: File, keyHint: string): Promise<string> => {
    const qs = new URLSearchParams({ contentType: file.type });
    const res = await fetch(
      `/api/upload-presigned-url/${encodeURIComponent(keyHint)}?${qs.toString()}`
    );
    if (!res.ok) {
      throw new Error('فشل في الحصول على رابط الرفع');
    }
    const { url, filePath } = await res.json();

    const uploadRes = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'x-amz-acl': 'public-read',
      },
    });

    if (!uploadRes.ok) {
      throw new Error('فشل في رفع الملف');
    }
    return filePath as string;
  };

  const handleAddAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAddAttachmentFileName('');
      return;
    }

    setAddAttachmentFileName(file.name);
    setAddAttachmentError('');

    if (file.size > 100 * 1024 * 1024) {
      setAddAttachmentError('حجم الملف كبير جداً (الحد الأقصى 100 ميجابايت)');
      setAddAttachmentUrl('');
      if (fileAddRecordRef.current) fileAddRecordRef.current.value = '';
      return;
    }

    if (!allowedAttachmentTypes.includes(file.type)) {
      setAddAttachmentError('نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)');
      setAddAttachmentUrl('');
      if (fileAddRecordRef.current) fileAddRecordRef.current.value = '';
      return;
    }

    setAddAttachmentUploading(true);
    try {
      const keyHint = `employee-cash-detail-${id}-${Date.now()}`;
      const filePath = await uploadAttachmentToSpaces(file, keyHint);
      setAddAttachmentUrl(filePath);
      if (fileAddRecordRef.current) fileAddRecordRef.current.value = '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء رفع الملف';
      setAddAttachmentError(msg);
      setAddAttachmentUrl('');
      setAddAttachmentFileName('');
    } finally {
      setAddAttachmentUploading(false);
    }
  };

  const handleEditAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setEditAttachmentFileName(file.name);
    setEditAttachmentError('');

    if (file.size > 100 * 1024 * 1024) {
      setEditAttachmentError('حجم الملف كبير جداً (الحد الأقصى 100 ميجابايت)');
      if (fileEditRecordRef.current) fileEditRecordRef.current.value = '';
      return;
    }

    if (!allowedAttachmentTypes.includes(file.type)) {
      setEditAttachmentError('نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)');
      if (fileEditRecordRef.current) fileEditRecordRef.current.value = '';
      return;
    }

    setEditAttachmentUploading(true);
    try {
      const keyHint = `employee-cash-detail-edit-${id}-${Date.now()}`;
      const filePath = await uploadAttachmentToSpaces(file, keyHint);
      setEditAttachmentUrl(filePath);
      if (fileEditRecordRef.current) fileEditRecordRef.current.value = '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء رفع الملف';
      setEditAttachmentError(msg);
    } finally {
      setEditAttachmentUploading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEmployeeDetail();
    }
  }, [id, filters]);

  const fetchEmployeeDetail = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.client) queryParams.append('client', filters.client);
      if (filters.movementType) queryParams.append('movementType', filters.movementType);
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);

      const response = await fetch(`/api/employee-cash/${id}?${queryParams}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching employee detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = () => {
    setAddAttachmentUrl('');
    setAddAttachmentFileName('');
    setAddAttachmentError('');
    const modal = document.getElementById('add-record-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  };

  const handleSubmitAddRecord = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const response = await fetch(`/api/employee-cash/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionDate: formData.get('transactionDate'),
          client: formData.get('client'),
          mainAccount: formData.get('mainAccount'),
          subAccount: formData.get('subAccount'),
          debit: Number(formData.get('debit') || 0),
          credit: Number(formData.get('credit') || 0),
          description: (formData.get('description') as string) || '',
          attachment: addAttachmentUrl || ''
        }),
      });

      if (response.ok) {
        setAlertType('success');
        setAlertMessage('تم إضافة السجل بنجاح');
        setShowAlert(true);
        handleCloseAddModal();
        fetchEmployeeDetail();
      } else {
        const errorData = await response.json();
        setAlertType('error');
        setAlertMessage(`خطأ: ${errorData.error || 'حدث خطأ أثناء إضافة السجل'}`);
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error adding record:', error);
      setAlertType('error');
      setAlertMessage('حدث خطأ أثناء إضافة السجل');
      setShowAlert(true);
    }
  };

  const handleCloseAddModal = () => {
    setAddAttachmentUrl('');
    setAddAttachmentFileName('');
    setAddAttachmentError('');
    if (fileAddRecordRef.current) fileAddRecordRef.current.value = '';
    const modal = document.getElementById('add-record-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingTransaction(null);
    setEditAttachmentUrl('');
    setEditAttachmentFileName('');
    setEditAttachmentError('');
    if (fileEditRecordRef.current) fileEditRecordRef.current.value = '';
  };

  const handleSubmitEditRecord = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingTransaction) return;

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const response = await fetch(`/api/employee-cash/${editingTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionDate: formData.get('transactionDate'),
          client: formData.get('client'),
          mainAccount: formData.get('mainAccount'),
          subAccount: formData.get('subAccount'),
          debit: Number(formData.get('debit') || 0),
          credit: Number(formData.get('credit') || 0),
          description: (formData.get('description') as string) || '',
          attachment:
            editAttachmentUrl ||
            (isPlaceholderAttachment(editingTransaction.attachment)
              ? ''
              : editingTransaction.attachment)
        }),
      });

      if (response.ok) {
        setAlertType('success');
        setAlertMessage('تم تحديث السجل بنجاح');
        setShowAlert(true);
        handleCloseEditModal();
        fetchEmployeeDetail();
      } else {
        const errorData = await response.json();
        setAlertType('error');
        setAlertMessage(`خطأ: ${errorData.error || 'حدث خطأ أثناء تحديث السجل'}`);
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error updating record:', error);
      setAlertType('error');
      setAlertMessage('حدث خطأ أثناء تحديث السجل');
      setShowAlert(true);
    }
  };

  const parseDateForInput = (dateStr: string): string => {
    if (!dateStr) return '';
    // Convert date string (DD/MM/YYYY) to YYYY-MM-DD format
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    // If already in ISO format or other format, try to parse it
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      // ignore
    }
    return '';
  };

  const handleEditRecord = (transactionId: number) => {
    const transaction = data?.transactions.find(t => t.id === transactionId);
    if (transaction) {
      setEditingTransaction(transaction);
      setEditAttachmentUrl('');
      setEditAttachmentFileName('');
      setEditAttachmentError('');
      if (fileEditRecordRef.current) fileEditRecordRef.current.value = '';
      setShowEditModal(true);
    }
  };

  const handleDeleteRecord = (transactionId: number) => {
    setTransactionToDelete(transactionId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (transactionToDelete) {
      try {
        const response = await fetch(`/api/employee-cash/${transactionToDelete}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setAlertType('success');
          setAlertMessage('تم حذف السجل بنجاح');
          setShowAlert(true);
          setShowDeleteConfirm(false);
          setTransactionToDelete(null);
          fetchEmployeeDetail();
        } else {
          setAlertType('error');
          setAlertMessage('حدث خطأ أثناء حذف السجل');
          setShowAlert(true);
          setShowDeleteConfirm(false);
          setTransactionToDelete(null);
        }
      } catch (error) {
        console.error('Error deleting record:', error);
        setAlertType('error');
        setAlertMessage('حدث خطأ أثناء حذف السجل');
        setShowAlert(true);
        setShowDeleteConfirm(false);
        setTransactionToDelete(null);
      }
    }
  };

  const handleSearch = () => {
    fetchEmployeeDetail();
  };

  const exportedData = async (): Promise<EmployeeDetail | null> => {
    const employeeId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
    if (!employeeId) return null;

    const queryParams = new URLSearchParams();
    if (filters.client) queryParams.append('client', filters.client);
    if (filters.movementType) queryParams.append('movementType', filters.movementType);
    if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
    if (filters.toDate) queryParams.append('toDate', filters.toDate);

    const response = await fetch(`/api/employee-cash/${employeeId}?${queryParams}`);
    if (!response.ok) throw new Error('فشل جلب البيانات للتصدير');
    return response.json() as Promise<EmployeeDetail>;
  };

  const exportToPDF = async () => {
    try {
      const detail = await exportedData();
      if (!detail) {
        setAlertType('error');
        setAlertMessage('تعذر جلب بيانات التصدير');
        setShowAlert(true);
        return;
      }

      const rows = detail.transactions || [];

      const doc = new jsPDF({ orientation: 'landscape' });
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      const logo = await fetch(
        'https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png'
      );
      const logoBuffer = await logo.arrayBuffer();
      const logoBytes = new Uint8Array(logoBuffer);
      const logoBase64 = Buffer.from(logoBytes).toString('base64');

      try {
        doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);
        const fontRes = await fetch('/fonts/Amiri-Regular.ttf');
        if (!fontRes.ok) throw new Error('Failed to fetch font');
        const fontBuffer = await fontRes.arrayBuffer();
        const fontBase64 = Buffer.from(new Uint8Array(fontBuffer)).toString('base64');
        doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
        doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
        doc.setFont('Amiri', 'normal');
      } catch (e) {
        console.error('Error loading font/logo for PDF:', e);
        setAlertType('error');
        setAlertMessage('تعذر تحميل الخط أو الشعار للتصدير');
        setShowAlert(true);
        return;
      }

      const reportTitle = `كشف حساب — ${detail.name || 'موظف'}`;
      doc.setLanguage('ar');
      doc.setFontSize(16);
      // doc.text(reportTitle, pageWidth - 14, 14, { align: 'right', maxWidth: pageWidth - 50 });

      const tableColumn = [
        'البيان',
        'الرصيد',
        'دائن',
        'مدين',
        'العميل',
        'الحساب الفرعي',
        'الحساب الرئيسي',
        'النوع',
        'الشهر',
        'التاريخ',
        '#',
      ];

      const tableRows = rows.map((row, index) => [
        truncateForPdf(row.description || '—', 36),
        row.balance?.toLocaleString?.() ?? String(row.balance),
        row.credit?.toLocaleString?.() ?? String(row.credit),
        row.debit?.toLocaleString?.() ?? String(row.debit),
        truncateForPdf(row.client || '—', 24),
        truncateForPdf(row.subAccount || '—', 20),
        truncateForPdf(row.mainAccount || '—', 20),
        transactionTypeLabel(row.type),
        row.month || '—',
        row.date || '—',
        String(index + 1),
      ]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        styles: {
          font: 'Amiri',
          halign: 'right',
          fontSize: 9,
          cellPadding: 2,
          textColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [26, 77, 79],
          textColor: [255, 255, 255],
          overflow: 'hidden',
          halign: 'right',
        },
        columnStyles: Object.fromEntries(
          Array.from({ length: tableColumn.length }, (_, i) => [
            i,
            { cellWidth: 'auto' as const, overflow: 'linebreak' as const },
          ])
        ),
        margin: { top: 36, right: 10, left: 10 },
        didDrawPage: () => {
          doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);
          if (doc.getCurrentPageInfo().pageNumber === 1) {
            doc.setFontSize(11);
            doc.setFont('Amiri', 'normal');
            doc.text(reportTitle, pageWidth / 2, 22, { align: 'center' });
          }
          doc.setFontSize(9);
          doc.setFont('Amiri', 'normal');
          doc.text(userName, 10, pageHeight - 10, { align: 'left' });
          doc.text(`صفحة ${doc.getCurrentPageInfo().pageNumber}`, pageWidth / 2, pageHeight - 10, {
            align: 'center',
          });
          const dateText =
            'التاريخ: ' +
            new Date().toLocaleDateString('ar-EG', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }) +
            '  الساعة: ' +
            new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
          doc.text(dateText, pageWidth - 10, pageHeight - 10, { align: 'right' });
        },
        didParseCell: (hookData: { cell: { styles: { halign: string } } }) => {
          hookData.cell.styles.halign = 'right';
        },
      });

      const safeName = (detail.name || `employee_${id}`).replace(/[^\w\u0600-\u06FF-]/g, '_').slice(0, 40);
      doc.save(`employee_cash_${id}_${safeName}.pdf`);

      try {
        await fetch('/api/accounting-logs/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exportType: 'employee_cash_detail',
            reportType: `كشف حساب موظف — ${detail.name}`,
            format: 'pdf',
            filters: { id, ...filters },
            recordCount: rows.length,
          }),
        });
      } catch {
        // optional log
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setAlertType('error');
      setAlertMessage('حدث خطأ أثناء تصدير PDF');
      setShowAlert(true);
    }
  };

  const exportToExcel = async () => {
    try {
      const detail = await exportedData();
      if (!detail) {
        setAlertType('error');
        setAlertMessage('تعذر جلب بيانات التصدير');
        setShowAlert(true);
        return;
      }

      const rows = detail.transactions || [];

      const workbook = new ExcelJS.Workbook();
      const sheetName = 'كشف حساب';
      const worksheet = workbook.addWorksheet(sheetName, { properties: { defaultColWidth: 18 } });

      worksheet.columns = [
        { header: '#', key: 'index', width: 6 },
        { header: 'التاريخ', key: 'date', width: 14 },
        { header: 'الشهر', key: 'month', width: 14 },
        { header: 'النوع', key: 'type', width: 12 },
        { header: 'الحساب الرئيسي', key: 'mainAccount', width: 22 },
        { header: 'الحساب الفرعي', key: 'subAccount', width: 22 },
        { header: 'العميل', key: 'client', width: 20 },
        { header: 'مدين', key: 'debit', width: 12 },
        { header: 'دائن', key: 'credit', width: 12 },
        { header: 'الرصيد', key: 'balance', width: 12 },
        { header: 'البيان', key: 'description', width: 28 },
        { header: 'المرفق', key: 'attachment', width: 36 },
      ];

      worksheet.getRow(1).font = { name: 'Amiri', size: 11 };
      worksheet.getRow(1).alignment = { horizontal: 'right' };

      rows.forEach((row, index) => {
        const r = worksheet.addRow({
          index: index + 1,
          date: row.date || '—',
          month: row.month || '—',
          type: transactionTypeLabel(row.type),
          mainAccount: row.mainAccount || '—',
          subAccount: row.subAccount || '—',
          client: row.client || '—',
          debit: row.debit ?? 0,
          credit: row.credit ?? 0,
          balance: row.balance ?? 0,
          description: row.description || '—',
          attachment: isPlaceholderAttachment(row.attachment) ? '—' : row.attachment,
        });
        r.alignment = { horizontal: 'right' };
      });

      worksheet.addRow({});
      const totalRow = worksheet.addRow({
        index: '',
        date: '',
        month: '',
        type: '',
        mainAccount: '',
        subAccount: 'الإجمالي',
        client: '',
        debit: detail.totalDebit ?? 0,
        credit: detail.totalCredit ?? 0,
        balance: detail.totalBalance ?? 0,
        description: '',
        attachment: '',
      });
      totalRow.font = { bold: true };
      totalRow.alignment = { horizontal: 'right' };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (detail.name || `employee_${id}`).replace(/[^\w\u0600-\u06FF-]/g, '_').slice(0, 40);
      a.download = `employee_cash_${id}_${safeName}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      try {
        await fetch('/api/accounting-logs/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exportType: 'employee_cash_detail',
            reportType: `كشف حساب موظف — ${detail.name}`,
            format: 'xlsx',
            filters: { id, ...filters },
            recordCount: rows.length,
          }),
        });
      } catch {
        // optional log
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setAlertType('error');
      setAlertMessage('حدث خطأ أثناء تصدير Excel');
      setShowAlert(true);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-teal-800" />
            <div className="text-lg text-gray-700">جاري التحميل...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
    <div className={`min-h-screen bg-gray-50 ${Style["tajawal-regular"]}`} dir="rtl">
      {/* Page Content */}
      <div className="p-8">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <button
            onClick={handleAddRecord}
            className="bg-teal-800 text-white border-none rounded px-4 py-2 flex items-center gap-2 text-xs cursor-pointer hover:bg-teal-700"
          >
            <span>إضافة سجل</span>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M4 1v6M1 4h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <h2 className="text-3xl font-normal text-black text-right">كشف حساب {data?.name || 'الموظف'}</h2>
        </div>
        
        {/* Filters Section */}
        <section className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-4">
          <div className="flex gap-10 mb-6 justify-end">
            <div className="flex flex-col gap-2 min-w-56">
              <label className="text-xs text-gray-700 text-right">العميل</label>
              <div className="relative">
                <select
                  className="w-full bg-gray-100 border border-gray-300 rounded  text-xs text-gray-500 text-right "
                  value={filters.client}
                  onChange={(e) => setFilters({...filters, client: e.target.value})}
                >
                  <option value="">اختر العميل</option>
                </select>
                {/* <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none w-4 h-4" viewBox="0 0 17 17" fill="none">
                  <path d="M4 6l4.5 4.5L13 6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg> */}
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-56">
              <label className="text-xs text-gray-700 text-right">نوع الحركة</label>
              <div className="relative">
                <select
                  className="w-full bg-gray-100 border border-gray-300 rounded  text-xs text-gray-500 text-right appearance-none"
                  value={filters.movementType}
                  onChange={(e) => setFilters({...filters, movementType: e.target.value})}
                >
                  <option value="">اختر نوع الحركة</option>
                  <option value="debit">مدين</option>
                  <option value="credit">دائن</option>
                </select>

              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-56">
              <label className="text-xs text-gray-700 text-right">إلى</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full bg-gray-100 border border-gray-300 rounded px-4 py-2 text-xs text-gray-500 text-right"
                  value={filters.toDate}
                  onChange={(e) => setFilters({...filters, toDate: e.target.value})}
                />

              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-56">
              <label className="text-xs text-gray-700 text-right">من</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full bg-gray-100 border border-gray-300 rounded px-4 py-2 text-xs text-gray-500 text-right"
                  value={filters.fromDate}
                  onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
                />

              </div>
            </div>
          </div>

          <button
            onClick={handleSearch}
            className="bg-teal-800 text-white border-none rounded px-4 py-2 text-sm cursor-pointer"
          >
            كشف حساب
          </button>
        </section>

        {/* Results Section */}
        <section className="bg-gray-50 border border-gray-300 rounded-lg shadow-sm">
          {/* Summary Cards */}
          <div className="flex gap-8 p-6 justify-between">
            <div className="bg-gray-100 rounded-lg p-5 text-center flex-1 shadow-sm">
              <div className="text-base text-gray-700 mb-2">إجمالي المدين</div>
              <div className="text-base font-normal text-gray-700 leading-8">{data?.totalDebit.toLocaleString() || '0'}</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-5 text-center flex-1 shadow-sm">
              <div className="text-base text-gray-700 mb-2">إجمالي الدائن</div>
              <div className="text-base font-normal text-gray-700 leading-8">{data?.totalCredit.toLocaleString() || '0'}</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-5 text-center flex-1 shadow-sm">
              <div className="text-base text-gray-700 mb-2">إجمالي الرصيد</div>
              <div className="text-base font-normal text-gray-700 leading-8">{data?.totalBalance.toLocaleString() || '0'}</div>
            </div>
          </div>

          {/* Settlements Section */}
          {data?.settlements && (
            <div className="p-6 border-b border-gray-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-right">تفاصيل التسويات</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-blue-800 mb-3 text-right">من جدول التفاصيل</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">إجمالي المدين:</span>
                      <span className="text-sm font-medium">{data.settlements.totalDetailsDebit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">إجمالي الدائن:</span>
                      <span className="text-sm font-medium">{data.settlements.totalDetailsCredit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-green-800 mb-3 text-right">من جدول العهدة النقدية</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">إجمالي المستلم:</span>
                      <span className="text-sm font-medium">{data.settlements.totalCashReceived.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">إجمالي المصروف:</span>
                      <span className="text-sm font-medium">{data.settlements.totalCashExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* تصدير فوق الجدول — محاذاة لليسار (في RTL: justify-end) */}
          <div className="flex justify-end gap-2 px-6 py-3 border-b border-gray-200 bg-white flex-wrap">
            <button
              type="button"
              onClick={exportToPDF}
              className="flex items-center gap-1 px-3 py-2 rounded bg-teal-800 text-white text-xs cursor-pointer hover:bg-teal-700"
            >
              <DocumentDownloadIcon className="w-4 h-4" />
              PDF
            </button>
            <button
              type="button"
              onClick={exportToExcel}
              className="flex items-center gap-1 px-3 py-2 rounded bg-teal-800 text-white text-xs cursor-pointer hover:bg-teal-700"
            >
              <TableIcon className="w-4 h-4" />
              Excel
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">#</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">التاريخ</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">الشهر</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">النوع</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">الحساب الرئيسي</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">الحساب الفرعي</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">العميل</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">مدين</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">دائن</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">الرصيد</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">البيان</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">المرفق</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {data?.transactions.map((transaction, index) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="p-4 text-center text-sm bg-gray-100">{index + 1}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">{transaction.date}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">{transaction.month}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">
                      <span className={`px-2 py-1 rounded text-xs ${
                        transaction.type === 'detail' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {transaction.type === 'detail' ? 'تفاصيل' : 'عهدة نقدية'}
                      </span>
                    </td>
                    <td className="p-4 text-center text-sm bg-gray-100">{transaction.mainAccount}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">{transaction.subAccount}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">{transaction.client}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">{transaction.debit.toLocaleString()}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">{transaction.credit.toLocaleString()}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">{transaction.balance.toLocaleString()}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">{transaction.description}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">
                      <a href={transaction.attachment} target="_blank" rel="noopener noreferrer" className="text-teal-800 hover:underline">عرض</a>
                    </td>
                    <td className="p-4 text-center text-sm bg-gray-100">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditRecord(transaction.id)}
                          className="bg-none border-none cursor-pointer p-1 rounded hover:bg-teal-100"
                        >


<PencilAltIcon className='h-4 w-44'/>
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(transaction.id)}
                          className="bg-none border-none cursor-pointer p-1 rounded hover:bg-red-100"
                        >

<TrashIcon className='h-4 w-44'/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={7} className="p-4 text-right text-sm bg-gray-200 font-bold text-black">الإجمالي</td>
                  <td className="p-4 text-center text-sm bg-gray-200 font-bold">{data?.totalDebit.toLocaleString() || '0'}</td>
                  <td className="p-4 text-center text-sm bg-gray-200 font-bold">{data?.totalCredit.toLocaleString() || '0'}</td>
                  <td className="p-4 text-center text-sm bg-gray-200 font-bold">{data?.totalBalance.toLocaleString() || '0'}</td>
                  <td colSpan={3} className="bg-gray-200"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>

      {/* Add Record Modal */}
      <div
        id="add-record-modal"
        className="hidden fixed inset-0 bg-black bg-opacity-85 z-50 flex justify-center items-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCloseAddModal();
        }}
      >
        <div className="bg-gray-100 rounded-xl shadow-lg p-8 w-full max-w-4xl mx-auto relative" dir="rtl" onClick={(ev) => ev.stopPropagation()}>
          <h2 className="text-center text-xl mb-8 text-gray-700">إضافة سجل</h2>
          <form onSubmit={handleSubmitAddRecord} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col items-end">
                <label className="text-sm text-gray-500 mb-2">التاريخ</label>
                <input name="transactionDate" type="date" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" required />
              </div>

              <div className="flex flex-col items-end">
                <label className="text-sm text-gray-500 mb-2">العميل</label>
                <input name="client" type="text" placeholder="ادخل العميل" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" />
              </div>

              <div className="flex flex-col items-end">
                <label className="text-sm text-gray-500 mb-2">الحساب الرئيسي</label>
                <input name="mainAccount" type="text" placeholder="ادخل الحساب الرئيسي" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" />
              </div>

              <div className="flex flex-col items-end">
                <label className="text-sm text-gray-500 mb-2">الحساب الفرعي</label>
                <input name="subAccount" type="text" placeholder="ادخل الحساب الفرعي" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" />
              </div>

              <div className="flex flex-col items-end">
                <label className="text-sm text-gray-500 mb-2">رصيد المدين</label>
                <input name="debit" type="number" placeholder="ادخل رصيد المدين" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" min="0" step="any" />
              </div>

              <div className="flex flex-col items-end">
                <label className="text-sm text-gray-500 mb-2">رصيد الدائن</label>
                <input name="credit" type="number" placeholder="ادخل رصيد الدائن" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" min="0" step="any" />
              </div>

              <div className="flex flex-col items-end col-span-2">
                <label className="text-sm text-gray-500 mb-2">البيان</label>
                <input
                  name="description"
                  type="text"
                  placeholder="ادخل البيان"
                  className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right"
                />
              </div>
            </div>

            <div className="flex flex-col items-end">
              <label className="text-sm text-gray-500 mb-2">المرفقات</label>
              <div className="flex flex-col gap-2 w-full items-end">
                <div className="flex gap-3 w-full justify-start flex-row-reverse flex-wrap">
                  <input
                    ref={fileAddRecordRef}
                    type="file"
                    className="hidden"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={handleAddAttachmentChange}
                  />
                  <button
                    type="button"
                    disabled={addAttachmentUploading}
                    onClick={() => fileAddRecordRef.current?.click()}
                    className="bg-teal-800 text-white border-none rounded px-5 py-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addAttachmentUploading ? 'جاري الرفع...' : 'اختيار ملف'}
                  </button>
                  <span className="self-center text-sm text-gray-600">
                    {addAttachmentFileName || (addAttachmentUrl ? 'تم الرفع' : '')}
                  </span>
                </div>
                {addAttachmentError ? (
                  <p className="text-sm text-red-600 text-right">{addAttachmentError}</p>
                ) : null}
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-5">
              <button type="button" onClick={handleCloseAddModal} className="bg-white text-teal-800 border border-teal-800 rounded w-28 h-10 text-base">إلغاء</button>
              <button
                type="submit"
                disabled={addAttachmentUploading}
                className="bg-teal-800 text-white border-none rounded w-28 h-10 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إضافة
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Edit Record Modal */}
      {showEditModal && editingTransaction && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-85 z-50 flex justify-center items-center"
          onClick={handleCloseEditModal}
        >
          <div 
            className="bg-gray-100 rounded-xl shadow-lg p-8 w-full max-w-3xl mx-auto relative" 
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-center text-xl mb-8 text-gray-700">تعديل سجل</h2>
            <form onSubmit={handleSubmitEditRecord} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col items-end">
                  <label className="text-sm text-gray-500 mb-2">التاريخ</label>
                  <input 
                    name="transactionDate"
                    type="date" 
                    className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" 
                    defaultValue={parseDateForInput(editingTransaction.date)}
                    required
                  />
                </div>

                <div className="flex flex-col items-end">
                  <label className="text-sm text-gray-500 mb-2">العميل</label>
                  <input 
                    name="client"
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" 
                    defaultValue={editingTransaction.client}
                  />
                </div>

                <div className="flex flex-col items-end">
                  <label className="text-sm text-gray-500 mb-2">الحساب الرئيسي</label>
                  <input 
                    name="mainAccount"
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" 
                    defaultValue={editingTransaction.mainAccount}
                  />
                </div>

                <div className="flex flex-col items-end">
                  <label className="text-sm text-gray-500 mb-2">الحساب الفرعي</label>
                  <input 
                    name="subAccount"
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" 
                    defaultValue={editingTransaction.subAccount}
                  />
                </div>

                <div className="flex flex-col items-end">
                  <label className="text-sm text-gray-500 mb-2">رصيد المدين</label>
                  <input 
                    name="debit"
                    type="number" 
                    className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" 
                    min="0" 
                    step="any" 
                    defaultValue={editingTransaction.debit}
                  />
                </div>

                <div className="flex flex-col items-end">
                  <label className="text-sm text-gray-500 mb-2">رصيد الدائن</label>
                  <input 
                    name="credit"
                    type="number" 
                    className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" 
                    min="0" 
                    step="any" 
                    defaultValue={editingTransaction.credit}
                  />
                </div>

                <div className="flex flex-col items-end col-span-2">
                  <label className="text-sm text-gray-500 mb-2">البيان</label>
                  <input
                    name="description"
                    type="text"
                    placeholder="ادخل البيان"
                    className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right"
                    defaultValue={editingTransaction.description}
                  />
                </div>

                <div className="flex flex-col items-end col-span-2">
                  <label className="text-sm text-gray-500 mb-2">المرفقات</label>
                  <div className="flex flex-col gap-2 w-full items-end">
                    <div className="flex gap-3 w-full justify-start flex-row-reverse flex-wrap">
                      <input
                        ref={fileEditRecordRef}
                        type="file"
                        className="hidden"
                        accept="application/pdf,image/jpeg,image/png"
                        onChange={handleEditAttachmentChange}
                      />
                      <button
                        type="button"
                        disabled={editAttachmentUploading}
                        onClick={() => fileEditRecordRef.current?.click()}
                        className="bg-teal-800 text-white border-none rounded px-5 py-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {editAttachmentUploading ? 'جاري الرفع...' : 'اختيار ملف'}
                      </button>
                      <span className="self-center text-sm text-gray-600">
                        {editAttachmentFileName ||
                          (editAttachmentUrl
                            ? 'تم رفع مرفق جديد'
                            : isPlaceholderAttachment(editingTransaction.attachment)
                              ? ''
                              : 'مرفق حالي محفوظ')}
                      </span>
                    </div>
                    {editAttachmentError ? (
                      <p className="text-sm text-red-600 text-right">{editAttachmentError}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-5">
                <button type="button" onClick={handleCloseEditModal} className="bg-white text-teal-800 border border-teal-800 rounded w-28 h-10 text-base">إلغاء</button>
                <button
                  type="submit"
                  disabled={editAttachmentUploading}
                  className="bg-teal-800 text-white border-none rounded w-28 h-10 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowDeleteConfirm(false);
            setTransactionToDelete(null);
          }}
        >
          <div 
            className="bg-white border-2 border-yellow-200 rounded-lg shadow-lg max-w-md w-full mx-4 bg-yellow-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2 text-yellow-800">
                    تأكيد الحذف
                  </h3>
                  <p className="text-sm text-yellow-800 mb-4">
                    هل أنت متأكد من حذف هذا السجل؟
                  </p>
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setTransactionToDelete(null);
                      }}
                      className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        type={alertType}
        title={alertType === 'success' ? 'نجح الحفظ' : 'خطأ في الحفظ'}
        message={alertMessage}
        autoClose={true}
        autoCloseDelay={3000}
      />
    </div>
    </Layout>
  );
}
