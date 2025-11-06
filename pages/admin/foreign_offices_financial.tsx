import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import type { ChangeEvent } from 'react';
import Layout from 'example/containers/Layout';
import { useRouter } from 'next/router';
import Style from "styles/Home.module.css";
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { jwtDecode } from 'jwt-decode';

interface Office {
  id: number;
  office: string;
  Country: string;
  phoneNumber: string;
}

interface FinancialRecord {
  id: number;
  date: string;
  clientName: string;
  contractNumber: string;
  payment: string;
  description: string;
  credit: number;
  debit: number;
  balance: number;
  invoice?: string;
  officeId: number;
  office?: Office;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ForeignOfficesFinancial() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    officeId: '',
    fromDate: '',
    toDate: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    contractNumber: '',
    clientName: '',
    description: '',
    payment: '',
    credit: '',
    debit: '',
    invoice: '',
    balance: '0',
    date: new Date().toISOString().split('T')[0]
  });
  const [lastBalance, setLastBalance] = useState<number>(0);
  const [contractSuggestions, setContractSuggestions] = useState<string[]>([]);
  const [showContractSuggestions, setShowContractSuggestions] = useState(false);
  const [isSearchingContract, setIsSearchingContract] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRecord, setEditRecord] = useState<FinancialRecord | null>(null);
  const [editForm, setEditForm] = useState({
    clientName: '',
    contractNumber: '',
    description: '',
    payment: '',
    credit: '',
    debit: '',
    balance: '',
    date: '',
  });

  // Modal state for alerts
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<FinancialRecord | null>(null);

  // File upload state
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceFileName, setInvoiceFileName] = useState<string>('');
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const invoiceFileInputRef = useRef<HTMLInputElement>(null);

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const fetchFinancialRecords = async (page = 1) => {
    setLoadingData(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.officeId && { officeId: filters.officeId }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
        ...(searchTerm && { search: searchTerm }),
      });

      const res = await axios.get(`/api/foreign-offices-financial?${params}`);
      setFinancialRecords(res.data.items || []);
      setPagination(res.data.pagination || pagination);
      setDataError(null);
    } catch (err) {
      console.error('Failed to fetch financial records:', err);
      setDataError('تعذر جلب السجلات');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token) as any;
      setUserName(decoded.username || '');
    }
  }, []);

  useEffect(() => {
    fetchFinancialRecords(1);
  }, [filters, searchTerm]);

  // Close contract suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.contract-search-container')) {
        setShowContractSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (amount: number | string) => {
    return amount.toString()
  };

  const handlePageChange = (newPage: number) => {
    fetchFinancialRecords(newPage);
  };

  const handleOfficeClick = (officeId: number) => {
    router.push(`/admin/foreign_offices_financial/${officeId}`);
  };

  const fetchFilteredDataExporting = async () => {
    const query = new URLSearchParams({
      page: "1",
      limit: "1000",
      ...(filters.officeId && { officeId: filters.officeId }),
      ...(filters.fromDate && { fromDate: filters.fromDate }),
      ...(filters.toDate && { toDate: filters.toDate }),
      ...(searchTerm && { search: searchTerm }),
    }).toString();
    const res = await fetch(`/api/foreign-offices-financial?${query}`);
    
    if (!res.ok) throw new Error("Failed to fetch data");
    const data = await res.json();
    return data.items || [];
  };

  const exportToPDF = async () => {
    try {
      let dataToExport = financialRecords;
      
      if (filters.officeId || filters.fromDate || filters.toDate || searchTerm) {
        dataToExport = await fetchFilteredDataExporting();
      }

      const doc = new jsPDF({ orientation: 'landscape' });
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // تحميل الشعار
      const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
      const logoBuffer = await logo.arrayBuffer();
      const logoBytes = new Uint8Array(logoBuffer);
      let logoBase64 = '';
      for (let i = 0; i < logoBytes.length; i += 1024) {
        const chunk = logoBytes.slice(i, i + 1024);
        logoBase64 += String.fromCharCode.apply(null, Array.from(chunk));
      }
      logoBase64 = btoa(logoBase64);

      // تحميل خط أميري
      try {
        const response = await fetch('/fonts/Amiri-Regular.ttf');
        if (!response.ok) throw new Error('Failed to fetch font');
        const fontBuffer = await response.arrayBuffer();
        const fontBytes = new Uint8Array(fontBuffer);
        let fontBase64 = '';
        for (let i = 0; i < fontBytes.length; i += 1024) {
          const chunk = fontBytes.slice(i, i + 1024);
          fontBase64 += String.fromCharCode.apply(null, Array.from(chunk));
        }
        fontBase64 = btoa(fontBase64);
        doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
        doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
        doc.setFont('Amiri', 'normal');
      } catch (error) {
        console.error('Error loading Amiri font:', error);
        showAlert('خطأ في تحميل الخط العربي', 'error');
        return;
      }

      doc.setLanguage('ar');
      doc.setFontSize(12);

      const tableColumn = [
        'الرصيد',
        'دائن',
        'مدين',
        'البيان',
        'رقم العقد',
        'اسم العميل',
        'اسم المكتب',
        'الدولة',
        'التاريخ',
        '#',
      ];

      const tableRows = dataToExport.map((row: FinancialRecord, index: number) => [
        formatCurrency(row.balance),
        row.credit > 0 ? formatCurrency(row.credit) : '-',
        row.debit > 0 ? formatCurrency(row.debit) : '-',
        row.description || 'غير متوفر',
        row.contractNumber || 'غير متوفر',
        row.clientName || 'غير متوفر',
        row.office?.office || 'غير متوفر',
        row.office?.Country || 'غير متوفر',
        row.date ? new Date(row.date).toLocaleDateString('ar-EG') : 'غير متوفر',
        (index + 1).toString(),
      ]);

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
          halign: 'right',
        },
        margin: { top: 39, right: 10, left: 10 },

        didDrawPage: (data: any) => {
          const pageHeight = doc.internal.pageSize.height;
          const pageWidth = doc.internal.pageSize.width;

          // إضافة اللوجو أعلى الصفحة (في كل صفحة)
          doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

          // كتابة العنوان في أول صفحة فقط
          if (doc.getCurrentPageInfo().pageNumber === 1) {
            doc.setFontSize(12);
            doc.setFont('Amiri', 'normal');
            doc.text('كشف حساب للمكاتب الخارجية', pageWidth / 2, 20, { align: 'right' });
          }

          // الفوتر
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

      doc.save('foreign_offices_financial.pdf');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      showAlert('حدث خطأ أثناء تصدير PDF', 'error');
    }
  };

  const exportToExcel = async () => {
    try {
      let dataToExport = financialRecords;
      
      if (filters.officeId || filters.fromDate || filters.toDate || searchTerm) {
        dataToExport = await fetchFilteredDataExporting();
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('كشف حساب للمكاتب الخارجية', { properties: { defaultColWidth: 20 } });
      
      worksheet.columns = [
        { header: '#', key: 'index', width: 10 },
        { header: 'التاريخ', key: 'date', width: 15 },
        { header: 'الدولة', key: 'country', width: 15 },
        { header: 'اسم المكتب', key: 'office', width: 20 },
        { header: 'اسم العميل', key: 'clientName', width: 20 },
        { header: 'رقم العقد', key: 'contractNumber', width: 15 },
        { header: 'البيان', key: 'description', width: 20 },
        { header: 'مدين', key: 'debit', width: 15 },
        { header: 'دائن', key: 'credit', width: 15 },
        { header: 'الرصيد', key: 'balance', width: 15 },
      ];

      worksheet.getRow(1).font = { name: 'Amiri', size: 12 };
      worksheet.getRow(1).alignment = { horizontal: 'right' };

      dataToExport.forEach((row: FinancialRecord, index: number) => {
        worksheet.addRow({
          index: index + 1,
          date: row.date ? new Date(row.date).toLocaleDateString('ar-EG') : 'غير متوفر',
          country: row.office?.Country || 'غير متوفر',
          office: row.office?.office || 'غير متوفر',
          clientName: row.clientName || 'غير متوفر',
          contractNumber: row.contractNumber || 'غير متوفر',
          description: row.description || 'غير متوفر',
          debit: row.debit > 0 ? formatCurrency(row.debit) : '-',
          credit: row.credit > 0 ? formatCurrency(row.credit) : '-',
          balance: formatCurrency(row.balance),
        }).alignment = { horizontal: 'right' };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'foreign_offices_financial.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showAlert('حدث خطأ أثناء تصدير Excel', 'error');
    }
  };

  const handleExport = (type: string) => {
    if (type === 'PDF') {
      exportToPDF();
    } else if (type === 'Excel') {
      exportToExcel();
    }
  };

  const handleSearch = () => {
    fetchFinancialRecords(1);
  };

  const handleInvoiceFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedFileTypes.includes(file.type)) {
      showAlert('نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)', 'error');
      return;
    }

    setInvoiceFile(file);
    setInvoiceFileName(file.name);
    setUploadingInvoice(true);

    try {
      const res = await fetch(`/api/upload-presigned-url/invoice-${newRecord.contractNumber}`);
      if (!res.ok) throw new Error('فشل في الحصول على رابط الرفع');
      
      const { url, filePath } = await res.json();

      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          // 'Content-Type': file.type ,
          'x-amz-acl': 'public-read',
        },
      });

      if (!uploadRes.ok) throw new Error('فشل في رفع الملف');
      
      setNewRecord(prev => ({ ...prev, invoice: filePath }));
      setUploadingInvoice(false);
      showAlert('تم رفع الملف بنجاح', 'success');
      
      if (invoiceFileInputRef.current) {
        invoiceFileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading invoice:', error);
      setUploadingInvoice(false);
      setInvoiceFile(null);
      setInvoiceFileName('');
      showAlert(error.message || 'حدث خطأ أثناء رفع الملف', 'error');
    }
  };

  const handleInvoiceButtonClick = () => {
    if (invoiceFileInputRef.current) {
      invoiceFileInputRef.current.click();
    }
  };

  const handleAddRecord = async () => {
    try {
      const response = await axios.post('/api/foreign-offices-financial', {
        ...newRecord,
        officeId: filters.officeId || 1,
        credit: parseFloat(newRecord.credit) || 0,
        debit: parseFloat(newRecord.debit) || 0,
        balance: parseFloat(newRecord.balance) || 0,
      });
      
      if (response.status === 201) {
        setShowAddModal(false);
        setNewRecord({
          contractNumber: '',
          clientName: '',
          description: '',
          payment: '',
          credit: '',
          debit: '',
          invoice: '',
          balance: '0',
          date: new Date().toISOString().split('T')[0]
        });
        setInvoiceFile(null);
        setInvoiceFileName('');
        setLastBalance(0);
        fetchFinancialRecords(pagination.page);
        showAlert('تم إضافة السجل بنجاح', 'success');
      }
    } catch (error) {
      console.error('Error adding record:', error);
      showAlert('حدث خطأ أثناء إضافة السجل', 'error');
    }
  };

  const fetchLastBalance = async (officeId: number) => {
    try {
      const response = await axios.get(`/api/foreign-offices-financial?officeId=${officeId}&limit=1`);
      if (response.data.items && response.data.items.length > 0) {
        const lastRecord = response.data.items[0];
        setLastBalance(Number(lastRecord.balance) || 0);
        return Number(lastRecord.balance) || 0;
      }
      setLastBalance(0);
      return 0;
    } catch (error) {
      console.error('Error fetching last balance:', error);
      setLastBalance(0);
      return 0;
    }
  };

  const calculateBalance = (credit: string, debit: string, baseBalance: number) => {
    const creditNum = parseFloat(credit) || 0;
    const debitNum = parseFloat(debit) || 0;
    return baseBalance + debitNum - creditNum;
  };

  const handleNewRecordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedRecord = { ...newRecord, [name]: value };
    
    // حساب الرصيد تلقائياً عند تغيير المدين أو الدائن
    if (name === 'credit' || name === 'debit') {
      const newBalance = calculateBalance(
        name === 'credit' ? value : updatedRecord.credit,
        name === 'debit' ? value : updatedRecord.debit,
        lastBalance
      );
      updatedRecord.balance = newBalance.toString();
    }
    
    setNewRecord(updatedRecord);
  };

  const searchContracts = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setContractSuggestions([]);
      setShowContractSuggestions(false);
      return;
    }
    
    setIsSearchingContract(true);
    try {
      const response = await fetch(`/api/contracts/suggestions?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setContractSuggestions(data.suggestions || []);
        setShowContractSuggestions(true);
      } else {
        setContractSuggestions([]);
        setShowContractSuggestions(false);
      }
    } catch (error) {
      console.error('Error searching contracts:', error);
      setContractSuggestions([]);
      setShowContractSuggestions(false);
    } finally {
      setIsSearchingContract(false);
    }
  };

  const fetchContractData = async (contractNumber: string) => {
    try {
      const response = await axios.get(`/api/contracts/${contractNumber}`);
      if (response.data) {
        setNewRecord(prev => ({
          ...prev,
          clientName: response.data.client?.fullname || '',
          date: response.data.createdAt ? new Date(response.data.createdAt).toISOString().split('T')[0] : prev.date
        }));
      }
    } catch (error) {
      console.error('Contract not found:', error);
      showAlert('لم يتم العثور على العقد', 'error');
    }
  };

  const handleContractNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewRecord(prev => ({ ...prev, contractNumber: value }));
    
    if (value.trim()) {
      searchContracts(value);
    } else {
      setContractSuggestions([]);
      setShowContractSuggestions(false);
    }
  };

  const handleContractSuggestionClick = async (suggestion: string) => {
    setNewRecord(prev => ({ ...prev, contractNumber: suggestion }));
    setShowContractSuggestions(false);
    await fetchContractData(suggestion);
  };

  const handleContractInputBlur = () => {
    setTimeout(() => {
      setShowContractSuggestions(false);
    }, 200);
  };

  const fetchPreviousBalance = async (recordId: number, officeId: number) => {
    try {
      // جلب كل السجلات الخاصة بالمكتب ثم البحث عن السجل السابق
      const response = await axios.get(`/api/foreign-offices-financial?officeId=${officeId}&limit=1000`);
      if (response.data.items && response.data.items.length > 0) {
        const records = response.data.items;
        // إيجاد السجل الحالي
        const currentIndex = records.findIndex((r: FinancialRecord) => r.id === recordId);
        // إذا كان هناك سجل قبله، نأخذ رصيده
        if (currentIndex > 0) {
          return Number(records[currentIndex - 1].balance) || 0;
        }
        // إذا كان أول سجل، نحسب الرصيد السابق من قيمه (الرصيد - مدين + دائن)
        if (currentIndex === 0 && records[currentIndex]) {
          const currentRecord = records[currentIndex];
          return Number(currentRecord.balance) - Number(currentRecord.debit) + Number(currentRecord.credit);
        }
      }
      return 0;
    } catch (error) {
      console.error('Error fetching previous balance:', error);
      return 0;
    }
  };

  const handleEditClick = async (record: FinancialRecord) => {
    setEditRecord(record);
    
    // جلب الرصيد السابق
    const previousBalance = await fetchPreviousBalance(record.id, record.officeId);
    setLastBalance(previousBalance);
    
    setEditForm({
      clientName: record.clientName || '',
      contractNumber: record.contractNumber || '',
      description: record.description || '',
      payment: record.payment || '',
      credit: record.credit.toString(),
      debit: record.debit.toString(),
      balance: record.balance.toString(),
      date: record.date ? new Date(record.date).toISOString().split('T')[0] : '',
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedForm = { ...editForm, [name]: value };
    
    // حساب الرصيد تلقائياً عند تغيير المدين أو الدائن
    if (name === 'credit' || name === 'debit') {
      const newBalance = calculateBalance(
        name === 'credit' ? value : updatedForm.credit,
        name === 'debit' ? value : updatedForm.debit,
        lastBalance
      );
      updatedForm.balance = newBalance.toString();
    }
    
    setEditForm(updatedForm);
  };

  const handleUpdateRecord = async () => {
    if (!editRecord) return;
    
    try {
      const response = await axios.put(`/api/foreign-offices-financial/${editRecord.id}`, {
        clientName: editForm.clientName,
        contractNumber: editForm.contractNumber,
        description: editForm.description,
        payment: editForm.payment,
        credit: parseFloat(editForm.credit) || 0,
        debit: parseFloat(editForm.debit) || 0,
        balance: parseFloat(editForm.balance) || 0,
      });
      
      if (response.status === 200) {
        setShowEditModal(false);
        setEditRecord(null);
        fetchFinancialRecords(pagination.page);
        showAlert('تم تعديل السجل بنجاح', 'success');
      }
    } catch (error) {
      console.error('Error updating record:', error);
      showAlert('حدث خطأ أثناء تعديل السجل', 'error');
    }
  };

  const handleDeleteClick = (record: FinancialRecord) => {
    setRecordToDelete(record);
    setShowDeleteModal(true);
  };

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    
    try {
      const response = await axios.delete(`/api/foreign-offices-financial/${recordToDelete.id}`);
      
      if (response.status === 200) {
        setShowDeleteModal(false);
        setRecordToDelete(null);
        fetchFinancialRecords(pagination.page);
        showAlert('تم حذف السجل بنجاح', 'success');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      showAlert('حدث خطأ أثناء حذف السجل', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F3F5] text-gray-900" dir="rtl">
      <Head>
        <title>كشف الحساب للمكاتب الخارجية - وصل للاستقدام</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <Layout>
        <div className={`flex flex-col min-h-screen ${Style["tajawal-regular"]}`}>
          <main className="flex-1 p-4 md:p-8" dir="rtl">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl text-black">كشف حساب للمكاتب الخارجية</h2>
              <button
                className="bg-[#1A4D4F] text-white border-none rounded-md px-4 py-2 flex items-center gap-2 text-md cursor-pointer hover:bg-[#164044]"
                onClick={async () => {
                  const officeId = filters.officeId ? parseInt(filters.officeId) : 1;
                  await fetchLastBalance(officeId);
                  setShowAddModal(true);
                }}
              >
                <span>إضافة سجل</span>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M4 1v6M1 4h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Filters Section */}
            <section className="bg-[#F2F3F5] border border-[#E0E0E0] rounded-lg p-6 mb-4">
              <div className="flex flex-wrap gap-10 mb-6 justify-end">
                <div className="flex flex-col gap-2 min-w-[226px]">
                  <label className="text-md text-gray-800">المكتب</label>
                  <div className="relative">
                    <select
                      name="officeId"
                      value={filters.officeId}
                      onChange={handleFilterChange}
                      className="w-full p-2 bg-[#F7F8FA] border border-[#E0E0E0] rounded-md text-md text-gray-600 appearance-none pr-8"
                    >
                      <option value="">جميع المكاتب</option>
                      <option value="1">مكتب فرصة كينيا</option>
                      <option value="2">مكتب ايرث باكستان</option>
                    </select>
   
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 min-w-[226px]">
                  <label className="text-md text-gray-800">الى</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="toDate"
                      value={filters.toDate}
                      onChange={handleFilterChange}
                      className="w-full p-2 bg-[#F7F8FA] border border-[#E0E0E0] rounded-md text-md text-gray-600 pr-8"
                    />

                  </div>
                </div>
                
                <div className="flex flex-col gap-2 min-w-[226px]">
                  <label className="text-md text-gray-800">من</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="fromDate"
                      value={filters.fromDate}
                      onChange={handleFilterChange}
                      className="w-full p-2 bg-[#F7F8FA] border border-[#E0E0E0] rounded-md text-md text-gray-600 pr-8"
                    />

                  </div>
                </div>
              </div>
              
              <button
                className="bg-[#1A4D4F] text-white border-none rounded-md px-4 py-2 text-md cursor-pointer hover:bg-[#164044]"
                onClick={handleSearch}
              >
                كشف حساب
              </button>
            </section>

            {/* Results Section */}
            <section className="bg-[#F2F3F5] border border-[#E0E0E0] rounded-lg shadow-sm">
              {/* Table Controls */}
              <div className="flex justify-between items-center px-4 py-6">
               
                <div className="relative">
                  <input
                    type="text"
                    placeholder="بحث"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-[428px] p-2 bg-[#F7F8FA] border border-[#E0E0E0] rounded-md text-md text-gray-600 pr-10"
                  />
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                    <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                 <div className="flex gap-2">
                  <button
                    className="bg-[#1A4D4F] text-white border-none rounded-sm px-3  flex items-center gap-1 py-2 text-md hover:bg-[#164044] "
                    onClick={() => handleExport('Excel')}
                  >

<FileExcelOutlined />
                    Excel
                  </button>
                  <button
                    className="bg-[#1A4D4F] text-white border-none rounded-sm px-3  flex items-center gap-1 py-2 text-md hover:bg-[#164044] "
                    onClick={() => handleExport('PDF')}
                  >
                    <FilePdfOutlined  />
                    PDF
                  </button>
                </div>
                
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full bg-white border-collapse">
                  <thead>
                    <tr>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-md font-normal">#</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-md font-normal">التاريخ</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-md font-normal">الدولة</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-md font-normal">اسم المكتب</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-md font-normal">اسم العميل</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-md font-normal">رقم العقد</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-md font-normal">البيان</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-md font-normal">مدين</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-md font-normal">دائن</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-md font-normal">الرصيد</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-md font-normal">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingData ? (
                      <tr>
                        <td colSpan={11} className="p-8 text-center text-gray-500">
                          جاري التحميل...
                        </td>
                      </tr>
                    ) : dataError ? (
                      <tr>
                        <td colSpan={11} className="p-8 text-center text-red-500">
                          {dataError}
                        </td>
                      </tr>
                    ) : financialRecords.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-8 text-center text-gray-500">
                          لا توجد سجلات
                        </td>
                      </tr>
                    ) : (
                      financialRecords.map((record, index) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="p-4 text-center text-md border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            #{(pagination.page - 1) * pagination.limit + index + 1}
                          </td>
                          <td className="p-4 text-center text-md border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-center text-md border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.office?.Country || '-'}
                          </td>
                          <td className="p-4 text-center text-md border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            <button
                              className="text-[#1A4D4F] hover:text-[#164044] hover:underline"
                              onClick={() => handleOfficeClick(record.officeId)}
                            >
                              {record.office?.office || '-'}
                            </button>
                          </td>
                          <td className="p-4 text-center text-md border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.clientName}
                          </td>
                          <td className="p-4 text-center text-md border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.contractNumber || '-'}
                          </td>
                          <td className="p-4 text-center text-md border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.description || '-'}
                          </td>
                          <td className="p-4 text-center text-md border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.debit > 0 ? formatCurrency(record.debit) : '-'}
                          </td>
                          <td className="p-4 text-center text-md border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.credit > 0 ? formatCurrency(record.credit) : '-'}
                          </td>
                          <td className="p-4 text-center text-md border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {formatCurrency(record.balance)}
                          </td>
                          <td className="p-4 text-center text-md border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            <div className="flex gap-2 justify-center">
                              <button
                                className="bg-transparent border-none cursor-pointer p-1 rounded-md hover:bg-[#1A4D4F]/10"
                                onClick={() => handleEditClick(record)}
                                title="تعديل السجل"
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#1A4D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#1A4D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                              <button
                                className="bg-transparent border-none cursor-pointer p-1 rounded-md hover:bg-red-100"
                                onClick={() => handleDeleteClick(record)}
                                title="حذف السجل"
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d="M10 11v6M14 11v6" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 p-6">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 bg-[#1A4D4F] text-white rounded-md text-md disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-[#164044]"
                  >
                    السابق
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded-md text-md ${
                            pagination.page === pageNum
                              ? 'bg-[#1A4D4F] text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-2 bg-[#1A4D4F] text-white rounded-md text-md disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-[#164044]"
                  >
                    التالي
                  </button>
                </div>
              )}
            </section>
          </main>
        </div>
      </Layout>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">إضافة سجل</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); handleAddRecord(); }}>
              {/* Contract Search */}
              <div className="mb-6">
                <label className="block text-md font-bold mb-2 text-gray-700">رقم العقد</label>
                <div className="relative contract-search-container">
                  <input
                    type="text"
                    name="contractNumber"
                    value={newRecord.contractNumber}
                    onChange={handleContractNumberChange}
                    onBlur={handleContractInputBlur}
                    onFocus={() => newRecord.contractNumber.length >= 1 && setShowContractSuggestions(true)}
                    placeholder="ابحث برقم العقد"
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-md pr-10"
                  />
                  {isSearchingContract && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1A4D4F]"></div>
                    </div>
                  )}
                  
                  {/* Contract Suggestions Dropdown */}
                  {showContractSuggestions && contractSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {contractSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => handleContractSuggestionClick(suggestion)}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                        >
                          <div className="font-medium text-md">
                            <span className="text-gray-700">رقم العقد: {suggestion}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-md font-bold mb-2 text-gray-700">تاريخ الطلب</label>
                  <input
                    type="date"
                    name="date"
                    value={newRecord.date}
                    onChange={handleNewRecordChange}
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-md"
                  />
                </div>
                
                <div>
                  <label className="block text-md font-bold mb-2 text-gray-700">العميل</label>
                  <input
                    type="text"
                    name="clientName"
                    value={newRecord.clientName}
                    onChange={handleNewRecordChange}
                    placeholder="اسم العميل"
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-md"
                  />
                </div>

                <div>
                  <label className="block text-md font-bold mb-2 text-gray-700">البيان</label>
                  <input
                    type="text"
                    name="description"
                    value={newRecord.description}
                    onChange={handleNewRecordChange}
                    placeholder="ادخل البيان"
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-md"
                  />
                </div>
                
                <div>
                  <label className="block text-md font-bold mb-2 text-gray-700">الدفعة</label>
                  <input
                    type="text"
                    name="payment"
                    value={newRecord.payment}
                    onChange={handleNewRecordChange}
                    placeholder="ادخل بيان الدفعة"
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-md"
                  />
                </div>

                <div>
                  <label className="block text-md font-bold mb-2 text-gray-700">رصيد الدائن</label>
                  <input
                    type="number"
                    name="credit"
                    value={newRecord.credit}
                    onChange={handleNewRecordChange}
                    placeholder="ادخل رصيد الدائن"
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-md"
                  />
                </div>
                
                <div>
                  <label className="block text-md font-bold mb-2 text-gray-700">رصيد المدين</label>
                  <input
                    type="number"
                    name="debit"
                    value={newRecord.debit}
                    onChange={handleNewRecordChange}
                    placeholder="ادخل رصيد المدين"
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-md"
                  />
                </div>

                <div>
                  <label className="block text-md font-bold mb-2 text-gray-700">الفاتورة</label>
                  <input
                    type="file"
                    ref={invoiceFileInputRef}
                    onChange={handleInvoiceFileChange}
                    accept="application/pdf,image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={handleInvoiceButtonClick}
                    disabled={uploadingInvoice}
                    className="bg-[#1A4D4F] text-white px-4 py-2 rounded-md text-md hover:bg-[#164044] disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {uploadingInvoice ? 'جاري الرفع...' : 'اختيار ملف'}
                  </button>
                  {invoiceFileName && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="text-green-600">✓</span> {invoiceFileName}
                    </div>
                  )}
                  {newRecord.invoice && !invoiceFileName && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="text-green-600">✓</span> تم رفع الملف
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-md font-bold mb-2 text-gray-700">الرصيد (محسوب تلقائياً)</label>
                  <input
                    type="number"
                    name="balance"
                    value={newRecord.balance}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-md cursor-not-allowed"
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    الرصيد السابق: <span className="font-semibold">{lastBalance.toLocaleString()}</span>
                    {(newRecord.debit || newRecord.credit) && (
                      <span className="mr-2">
                        {newRecord.debit && ` + ${parseFloat(newRecord.debit).toLocaleString()} (مدين)`}
                        {newRecord.credit && ` - ${parseFloat(newRecord.credit).toLocaleString()} (دائن)`}
                        {` = ${parseFloat(newRecord.balance).toLocaleString()}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-center gap-4 mt-8">
                <button
                  type="submit"
                  className="bg-[#1A4D4F] text-white px-8 py-3 rounded-md font-bold hover:bg-[#164044]"
                >
                  إضافة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewRecord({
                      contractNumber: '',
                      clientName: '',
                      description: '',
                      payment: '',
                      credit: '',
                      debit: '',
                      invoice: '',
                      balance: '0',
                      date: new Date().toISOString().split('T')[0]
                    });
                    setInvoiceFile(null);
                    setInvoiceFileName('');
                    setLastBalance(0);
                  }}
                  className="bg-transparent text-[#1A4D4F] border-2 border-[#1A4D4F] px-8 py-3 rounded-md font-bold hover:bg-[#1A4D4F] hover:text-white"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {showEditModal && editRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">تعديل سجل</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateRecord(); }}>
              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-md font-bold mb-2 text-gray-700">التاريخ</label>
                  <input
                    type="date"
                    name="date"
                    value={editForm.date}
                    onChange={handleEditFormChange}
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-md"
                  />
                </div>
                
                <div>
                  <label className="block text-md font-bold mb-2 text-gray-700">العميل</label>
                  <input
                    type="text"
                    name="clientName"
                    value={editForm.clientName}
                    onChange={handleEditFormChange}
                    placeholder="اسم العميل"
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-md"
                  />
                </div>

                <div>
                  <label className="block text-md font-bold mb-2 text-gray-700">رقم العقد</label>
                  <input
                    type="text"
                    name="contractNumber"
                    value={editForm.contractNumber}
                    onChange={handleEditFormChange}
                    placeholder="رقم العقد"
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-md"
                  />
                </div>

                <div>
                  <label className="block text-md font-bold mb-2 text-gray-700">البيان</label>
                  <input
                    type="text"
                    name="description"
                    value={editForm.description}
                    onChange={handleEditFormChange}
                    placeholder="ادخل البيان"
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-md"
                  />
                </div>
                
                <div>
                  <label className="block text-md font-bold mb-2 text-gray-700">الدفعة</label>
                  <input
                    type="text"
                    name="payment"
                    value={editForm.payment}
                    onChange={handleEditFormChange}
                    placeholder="ادخل بيان الدفعة"
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-md"
                  />
                </div>

                <div>
                  <label className="block text-md font-bold mb-2 text-gray-700">رصيد الدائن</label>
                  <input
                    type="number"
                    name="credit"
                    value={editForm.credit}
                    onChange={handleEditFormChange}
                    placeholder="ادخل رصيد الدائن"
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-md"
                  />
                </div>
                
                <div>
                  <label className="block text-md font-bold mb-2 text-gray-700">رصيد المدين</label>
                  <input
                    type="number"
                    name="debit"
                    value={editForm.debit}
                    onChange={handleEditFormChange}
                    placeholder="ادخل رصيد المدين"
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-md"
                  />
                </div>
                
                <div>
                  <label className="block text-md font-bold mb-2 text-gray-700">الرصيد (محسوب تلقائياً)</label>
                  <input
                    type="number"
                    name="balance"
                    value={editForm.balance}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-md cursor-not-allowed"
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    الرصيد السابق: <span className="font-semibold">{lastBalance.toLocaleString()}</span>
                    {(editForm.debit || editForm.credit) && (
                      <span className="mr-2">
                        {editForm.debit && ` + ${parseFloat(editForm.debit).toLocaleString()} (مدين)`}
                        {editForm.credit && ` - ${parseFloat(editForm.credit).toLocaleString()} (دائن)`}
                        {` = ${parseFloat(editForm.balance).toLocaleString()}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-center gap-4 mt-8">
                <button
                  type="submit"
                  className="bg-[#1A4D4F] text-white px-8 py-3 rounded-md font-bold hover:bg-[#164044]"
                >
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditRecord(null);
                  }}
                  className="bg-transparent text-[#1A4D4F] border-2 border-[#1A4D4F] px-8 py-3 rounded-md font-bold hover:bg-[#1A4D4F] hover:text-white"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center">
              {/* Icon */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                alertType === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {alertType === 'success' ? (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              
              {/* Message */}
              <p className={`text-xl font-semibold text-center mb-6 ${
                alertType === 'success' ? 'text-gray-800' : 'text-gray-800'
              }`}>
                {alertMessage}
              </p>
              
              {/* Button */}
              <button
                onClick={() => setShowAlertModal(false)}
                className={`px-8 py-3 rounded-md font-bold text-white ${
                  alertType === 'success' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                حسناً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && recordToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center">
              {/* Warning Icon */}
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-100">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              {/* Message */}
              <p className="text-xl font-semibold text-center mb-2 text-gray-800">
                هل أنت متأكد من حذف هذا السجل؟
              </p>
              <p className="text-md text-center mb-6 text-gray-600">
                {recordToDelete.clientName && `العميل: ${recordToDelete.clientName}`}
                {recordToDelete.contractNumber && ` - العقد: ${recordToDelete.contractNumber}`}
              </p>
              
              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleDeleteRecord}
                  className="px-6 py-3 rounded-md font-bold text-white bg-red-600 hover:bg-red-700"
                >
                  حذف
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setRecordToDelete(null);
                  }}
                  className="px-6 py-3 rounded-md font-bold text-gray-700 bg-gray-200 hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}