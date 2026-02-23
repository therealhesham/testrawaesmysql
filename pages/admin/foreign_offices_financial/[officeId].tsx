import Head from 'next/head';
import { useState, useEffect } from 'react';
import axios from 'axios';
import type { ChangeEvent } from 'react';
import Layout from 'example/containers/Layout';
import { useRouter } from 'next/router';
import Style from "styles/Home.module.css";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { jwtDecode } from 'jwt-decode';
import { FileExcelOutlined, FileOutlined, FilePdfOutlined } from '@ant-design/icons';

interface Office {
  id: number;
  office: string;
  Country: string;
  phoneNumber: string;
}

interface FinancialRecord {
  id: number;
  date: string;
  month: string;
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

interface SummaryData {
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  totalBalance: number;
}

export default function OfficeFinancialDetails() {
  const router = useRouter();
  const { officeId } = router.query;
  
  const [form, setForm] = useState({
    date: '',
    clientName: '',
    contractNumber: '',
    payment: '',
    description: '',
    credit: '',
    debit: '',
    balance: '',
  });
  const [editForm, setEditForm] = useState({
    id: 0,
    date: '',
    clientName: '',
    contractNumber: '',
    payment: '',
    description: '',
    credit: '',
    debit: '',
    balance: '',
    invoice: '',
  });

function getDate(date: string) {
  if (!date) return null;
  const currentDate = new Date(date);
  const formatted = currentDate.getDate() + '/' + (currentDate.getMonth() + 1) + '/' + currentDate.getFullYear();
  return formatted;
}

function getMonthName(month: number) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month];
}

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [office, setOffice] = useState<Office | null>(null);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData>({
    openingBalance: 0,
    totalDebit: 0,
    totalCredit: 0,
    totalBalance: 0,
  });
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    movementType: '',
    fromDate: '',
    toDate: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [userName, setUserName] = useState('');
  const [contractSuggestions, setContractSuggestions] = useState<string[]>([]);
  const [showContractSuggestions, setShowContractSuggestions] = useState(false);
  const [isSearchingContract, setIsSearchingContract] = useState(false);
  const [lastBalance, setLastBalance] = useState<number>(0);

  const fetchOfficeData = async () => {
    if (!officeId) return;
    
    try {
      const res = await axios.get(`/api/offices/${officeId}`);
      setOffice(res.data.item);
    } catch (error) {
      console.error('Failed to fetch office:', error);
    }
  };

  const fetchFinancialRecords = async () => {
    if (!officeId) return;
    
    setLoadingData(true);
    try {
      const params = new URLSearchParams({
        officeId: officeId as string,
        ...(filters.movementType && { movementType: filters.movementType }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
        ...(searchTerm && { search: searchTerm }),
      });

      const res = await axios.get(`/api/foreign-offices-financial?${params}`);
      setFinancialRecords(res.data.items || []);
      
      // Calculate summary data
      const records = res.data.items || [];
      const totalDebit = records.reduce((sum: number, record: FinancialRecord) => sum + Number(record.debit), 0);
      const totalCredit = records.reduce((sum: number, record: FinancialRecord) => sum + Number(record.credit), 0);
      const openingBalance = 0; // This could be calculated from previous records
      
      setSummaryData({
        openingBalance,
        totalDebit,
        totalCredit,
        totalBalance: openingBalance + totalDebit - totalCredit,
      });
      
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
      try {
        const decoded = jwtDecode(token) as any;
        setUserName(decoded.username || '');
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (officeId) {
      fetchOfficeData();
      fetchFinancialRecords();
    }
  }, [officeId, filters, searchTerm]);

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

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };
    
    // عند الكتابة في المدين امسح الدائن، وعند الكتابة في الدائن امسح المدين
    if (name === 'debit') updatedForm.credit = '';
    if (name === 'credit') updatedForm.debit = '';
    
    // حساب الرصيد تلقائياً عند تغيير المدين أو الدائن
    if (name === 'credit' || name === 'debit') {
      const newBalance = calculateBalance(
        name === 'credit' ? value : updatedForm.credit,
        name === 'debit' ? value : updatedForm.debit,
        lastBalance
      );
      updatedForm.balance = newBalance.toString();
    }
    
    setForm(updatedForm);
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
        setForm(prev => ({
          ...prev,
          clientName: response.data.client?.fullname || '',
          date: response.data.createdAt ? new Date(response.data.createdAt).toISOString().split('T')[0] : prev.date
        }));
      }
    } catch (error) {
      console.error('Contract not found:', error);
    }
  };

  const fetchContractDataForEdit = async (contractNumber: string) => {
    try {
      const response = await axios.get(`/api/contracts/${contractNumber}`);
      if (response.data) {
        setEditForm(prev => ({
          ...prev,
          clientName: response.data.client?.fullname || prev.clientName,
          date: response.data.createdAt ? new Date(response.data.createdAt).toISOString().split('T')[0] : prev.date
        }));
      }
    } catch (error) {
      console.error('Contract not found:', error);
    }
  };

  const handleContractNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, contractNumber: value }));
    
    if (value.trim()) {
      searchContracts(value);
    } else {
      setContractSuggestions([]);
      setShowContractSuggestions(false);
    }
  };

  const handleContractSuggestionClick = async (suggestion: string) => {
    setForm(prev => ({ ...prev, contractNumber: suggestion }));
    setShowContractSuggestions(false);
    await fetchContractData(suggestion);
  };

  const handleEditContractNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditForm(prev => ({ ...prev, contractNumber: value }));
    if (value.trim()) {
      searchContracts(value);
    } else {
      setContractSuggestions([]);
      setShowContractSuggestions(false);
    }
  };

  const handleEditContractSuggestionClick = async (suggestion: string) => {
    setEditForm(prev => ({ ...prev, contractNumber: suggestion }));
    setShowContractSuggestions(false);
    await fetchContractDataForEdit(suggestion);
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

  const handleEditChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedForm = { ...editForm, [name]: value };
    
    // عند الكتابة في المدين امسح الدائن، وعند الكتابة في الدائن امسح المدين
    if (name === 'debit') updatedForm.credit = '';
    if (name === 'credit') updatedForm.debit = '';
    
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

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (amount: number | string) => {
    return Number(amount).toLocaleString();
  };

  const handleInvoiceUpload = async (file: File): Promise<string> => {
    setUploadingInvoice(true);
    try {
      const id = officeId ? `${officeId}-${Date.now()}` : String(Date.now());
      const response = await fetch(`/api/upload-presigned-url/${id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('فشل في الحصول على رابط الرفع');
      }

      const { url, filePath } = await response.json();

      // رفع الملف إلى الرابط الموقّع (نفس أسلوب track_order - fetch و body: file لتفادي فساد الملف مع axios)
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

      setUploadingInvoice(false);
      return filePath;
    } catch (error) {
      setUploadingInvoice(false);
      throw error;
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.clientName || !officeId) return;
    
    try {
      let invoiceUrl = '';
      
      // Upload invoice if provided
      if (invoiceFile) {
        invoiceUrl = await handleInvoiceUpload(invoiceFile);
      }
      
      // حساب الرصيد النهائي
      const calculatedBalance = calculateBalance(
        form.credit || '0',
        form.debit || '0',
        lastBalance
      );
      
      await axios.post('/api/foreign-offices-financial', {
        date: form.date,
        clientName: form.clientName,
        contractNumber: form.contractNumber,
        payment: form.payment,
        description: form.description,
        credit: Number(form.credit) || 0,
        debit: Number(form.debit) || 0,
        balance: calculatedBalance,
        invoice: invoiceUrl,
        officeId: Number(officeId),
      });
      
      setForm({
        date: '',
        clientName: '',
        contractNumber: '',
        payment: '',
        description: '',
        credit: '',
        debit: '',
        balance: '',
      });
      setInvoiceFile(null);
      setLastBalance(0);
      setOpenAddModal(false);
      fetchFinancialRecords();
      alert('تمت الإضافة بنجاح');
    } catch (error) {
      console.error('Failed to add record:', error);
      alert('حدث خطأ أثناء الإضافة');
    }
  };

  const handleEditRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const calculatedBalance = calculateBalance(
        editForm.credit || '0',
        editForm.debit || '0',
        lastBalance
      );
      let invoiceUrl = editForm.invoice || '';
      if (invoiceFile) {
        invoiceUrl = await handleInvoiceUpload(invoiceFile);
      }
      await axios.put(`/api/foreign-offices-financial/${editForm.id}`, {
        date: editForm.date || undefined,
        clientName: editForm.clientName,
        contractNumber: editForm.contractNumber || undefined,
        payment: editForm.payment || undefined,
        description: editForm.description || undefined,
        credit: Number(editForm.credit) || 0,
        debit: Number(editForm.debit) || 0,
        balance: calculatedBalance,
        invoice: invoiceUrl || undefined,
      });
      setOpenEditModal(false);
      setLastBalance(0);
      setInvoiceFile(null);
      fetchFinancialRecords();
      alert('تم التعديل بنجاح');
    } catch (error) {
      console.error('Failed to edit record:', error);
      alert('حدث خطأ أثناء التعديل');
    }
  };

  const openEditModalHandler = async (record: FinancialRecord) => {
    const previousBalance = await fetchPreviousBalance(record.id, record.officeId);
    setLastBalance(previousBalance);
    const dateStr = record.date ? new Date(record.date).toISOString().slice(0, 10) : '';
    setEditForm({
      id: record.id,
      date: dateStr,
      clientName: record.clientName || '',
      contractNumber: record.contractNumber || '',
      payment: record.payment || '',
      description: record.description || '',
      credit: String(record.credit ?? 0),
      debit: String(record.debit ?? 0),
      balance: String(record.balance ?? 0),
      invoice: record.invoice || '',
    });
    setInvoiceFile(null);
    setOpenEditModal(true);
  };

  const handleSearch = () => {
    fetchFinancialRecords();
  };

  const handleReset = () => {
    setFilters({
      movementType: '',
      fromDate: '',
      toDate: '',
    });
    setSearchTerm('');
  };

  const fetchFilteredDataExporting = async () => {
    if (!officeId) return [];
    
    const params = new URLSearchParams({
      officeId: officeId as string,
      page: "1",
      limit: "1000",
      ...(filters.movementType && { movementType: filters.movementType }),
      ...(filters.fromDate && { fromDate: filters.fromDate }),
      ...(filters.toDate && { toDate: filters.toDate }),
      ...(searchTerm && { search: searchTerm }),
    });

    const res = await fetch(`/api/foreign-offices-financial?${params}`);
    if (!res.ok) throw new Error("Failed to fetch data");
    const data = await res.json();
    return data.items || [];
  };

  const exportToPDF = async () => {
    try {
      let dataToExport = await fetchFilteredDataExporting();
      
      const doc = new jsPDF({ orientation: 'landscape' });
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // تحميل الشعار
      const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
      const logoBuffer = await logo.arrayBuffer();
      const logoBytes = new Uint8Array(logoBuffer);
      const logoBase64 = Buffer.from(logoBytes).toString('base64');

      // تحميل الخط العربي
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

      const tableColumn = [
        'الرصيد',
        'مدين',
        'دائن',
        'البيان',
        'الدفعة',
        'رقم العقد',
        'اسم العميل',
        'الشهر',
        'التاريخ',
        '#',
      ];

      const tableRows = dataToExport.map((row: FinancialRecord, index: number) => [
        formatCurrency(row.balance),
        row.debit > 0 ? formatCurrency(row.debit) : '-',
        row.credit > 0 ? formatCurrency(row.credit) : '-',
        row.description || '-',
        row.payment || '-',
        row.contractNumber || '-',
        row.clientName || '-',
        new Date(row.date).toLocaleDateString('en-US', { month: 'long' }),
        new Date(row.date).toLocaleDateString('en-US'),
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

          // إضافة اللوجو أعلى الصفحة
          doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

          // كتابة العنوان في أول صفحة فقط
          if (doc.getCurrentPageInfo().pageNumber === 1) {
            doc.setFontSize(12);
            doc.setFont('Amiri', 'normal');
            doc.text(`كشف حساب ${office?.office || ''}`, pageWidth / 2, 20, { align: 'right' });
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

      doc.save(`financial_report_${office?.office || 'office'}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF');
    }
  };

  const exportToExcel = async () => {
    try {
      let dataToExport = await fetchFilteredDataExporting();
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`كشف حساب ${office?.office || ''}`, { 
        properties: { defaultColWidth: 20 } 
      });

      worksheet.columns = [
        { header: '#', key: 'index', width: 10 },
        { header: 'التاريخ', key: 'date', width: 15 },
        // { header: 'الشهر', key: 'month', width: 15 },
        { header: 'اسم العميل', key: 'clientName', width: 20 },
        { header: 'رقم العقد', key: 'contractNumber', width: 15 },
        { header: 'الدفعة', key: 'payment', width: 15 },
        { header: 'البيان', key: 'description', width: 20 },
        { header: 'دائن', key: 'credit', width: 15 },
        { header: 'مدين', key: 'debit', width: 15 },
        { header: 'الرصيد', key: 'balance', width: 15 },
      ];

      worksheet.getRow(1).font = { name: 'Amiri', size: 12 };
      worksheet.getRow(1).alignment = { horizontal: 'right' };

      dataToExport.forEach((row: FinancialRecord, index: number) => {
        const addedRow = worksheet.addRow({
          index: index + 1,
          date: getDate(row.date),
          // month: getMonthName(new Date(row.date).getMonth()),
          clientName: row.clientName || 'غير متوفر',
          contractNumber: row.contractNumber || '-',
          payment: row.payment || '-',
          description: row.description || '-',
          credit: row.credit > 0 ? row.credit : 0,
          debit: row.debit > 0 ? row.debit : 0,
          balance: row.balance,
        });
        addedRow.alignment = { horizontal: 'right' };
        
        // تنسيق الأرقام كعملة
        const creditCell = addedRow.getCell('credit');
        const debitCell = addedRow.getCell('debit');
        const balanceCell = addedRow.getCell('balance');
        
        if (row.credit > 0) {
          creditCell.numFmt = '#,##0.00';
        } else {
          creditCell.value = '-';
        }
        
        if (row.debit > 0) {
          debitCell.numFmt = '#,##0.00';
        } else {
          debitCell.value = '-';
        }
        
        balanceCell.numFmt = '#,##0.00';
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial_report_${office?.office || 'office'}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('حدث خطأ أثناء تصدير Excel');
    }
  };

  const handleExport = (type: string) => {
    if (type === 'PDF') {
      exportToPDF();
    } else if (type === 'Excel') {
      exportToExcel();
    }
  };

  const handleBackToMain = () => {
    router.push('/admin/foreign_offices_financial');
  };

  if (!office) {
    return (
      <div className="min-h-screen bg-[#F2F3F5] text-gray-900" dir="rtl">
        <Head>
          <title>تحميل...</title>
        </Head>
        <Layout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="text-xl text-gray-600">جاري التحميل...</div>
            </div>
          </div>
        </Layout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F3F5] text-gray-900" dir="rtl">
      <Head>
        <title>كشف حساب {office.office} - وصل للاستقدام</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <Layout>
        <div className={`flex flex-col min-h-screen ${Style["tajawal-regular"]}`}>
          <main className="flex-1 p-4 md:p-8" dir="ltr">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToMain}
                  className="bg-gray-500 text-white rounded-md px-4 py-2 flex items-center gap-2 text-sm hover:bg-gray-600"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M19 12H5M12 19l-7-7 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  العودة
                </button>
                <h2 className="text-3xl text-black">كشف حساب {office.office}</h2>
              </div>
              <button
                className="bg-[#1A4D4F] text-white rounded-md px-4 py-2 flex items-center gap-2 text-sm hover:bg-[#164044]"
                onClick={async () => {
                  if (officeId) {
                    await fetchLastBalance(Number(officeId));
                  }
                  setForm({
                    date: new Date().toISOString().split('T')[0],
                    clientName: '',
                    contractNumber: '',
                    payment: '',
                    description: '',
                    credit: '',
                    debit: '',
                    balance: '0',
                  });
                  setOpenAddModal(true);
                }}
              >
                <span>اضافة سجل</span>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M4 1v6M1 4h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Filters Section */}
            <section className="bg-[#F2F3F5] border border-[#E0E0E0] rounded-lg p-6 mb-4">
              <div className="flex flex-wrap gap-10 mb-6 justify-end">
                <div className="flex flex-col gap-2 min-w-[226px]">
                  <label className="text-xs text-gray-800">نوع الحركة</label>
                  <div className="relative">
                    <select
                      name="movementType"
                      value={filters.movementType}
                      onChange={handleFilterChange}
                      className="w-full p-2 bg-[#F7F8FA] border border-[#E0E0E0] rounded-md text-xs text-gray-600 appearance-none pr-8"
                    >
                      <option value="">اختر نوع الحركة</option>
                      <option value="debit">مدين</option>
                      <option value="credit">دائن</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 min-w-[226px]">
                  <label className="text-xs text-gray-800">الى</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="toDate"
                      value={filters.toDate}
                      onChange={handleFilterChange}
                      className="w-full p-2 bg-[#F7F8FA] border border-[#E0E0E0] rounded-md text-xs text-gray-600 pr-8"
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 min-w-[226px]">
                  <label className="text-xs text-gray-800">من</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="fromDate"
                      value={filters.fromDate}
                      onChange={handleFilterChange}
                      className="w-full p-2 bg-[#F7F8FA] border border-[#E0E0E0] rounded-md text-xs text-gray-600 pr-8"
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  className="bg-[#1A4D4F] text-white border-none rounded-md px-4 py-2 text-sm cursor-pointer hover:bg-[#164044]"
                  onClick={handleSearch}
                >
                  كشف حساب
                </button>
                <button
                  className="bg-gray-500 text-white border-none rounded-md px-4 py-2 text-sm cursor-pointer hover:bg-gray-600"
                  onClick={handleReset}
                >
                  إعادة ضبط
                </button>
              </div>
            </section>

            {/* Results Section */}
            <section className="bg-[#F2F3F5] border border-[#E0E0E0] rounded-lg shadow-sm">
              {/* Summary Cards */}
              <div className="flex flex-wrap gap-8 p-6 justify-center">
                <div className="bg-[#F7F8FA] rounded-lg p-5 text-center min-w-[237px] shadow-sm">
                  <div className="text-base text-gray-800 mb-2">الرصيد الافتتاحي</div>
                  <div className="text-base font-normal text-gray-800 leading-8">
                    {formatCurrency(summaryData.openingBalance)}
                  </div>
                </div>
                <div className="bg-[#F7F8FA] rounded-lg p-5 text-center min-w-[237px] shadow-sm">
                  <div className="text-base text-gray-800 mb-2">اجمالي المدين</div>
                  <div className="text-base font-normal text-gray-800 leading-8">
                    {formatCurrency(summaryData.totalDebit)}
                  </div>
                </div>
                <div className="bg-[#F7F8FA] rounded-lg p-5 text-center min-w-[237px] shadow-sm">
                  <div className="text-base text-gray-800 mb-2">اجمالي الدائن</div>
                  <div className="text-base font-normal text-gray-800 leading-8">
                    {formatCurrency(summaryData.totalCredit)}
                  </div>
                </div>
                <div className="bg-[#F7F8FA] rounded-lg p-5 text-center min-w-[237px] shadow-sm">
                  <div className="text-base text-gray-800 mb-2">الرصيد الاجمالي</div>
                  <div className="text-base font-normal text-gray-800 leading-8">
                    {formatCurrency(summaryData.totalBalance)}
                  </div>
                </div>
              </div>

              {/* Table Controls */}
              <div className="flex justify-between items-center px-4 pb-6">
                <div className="flex gap-2">
                  <button
                    className="bg-[#1A4D4F] text-white border-none rounded-sm px-3 py-1 flex items-center gap-1 text-md hover:bg-[#164044] "
                    onClick={() => handleExport('Excel')}
                  >
                    <FileExcelOutlined />
                    <span>Excel</span>
                  </button>
                  <button
                    className="bg-[#1A4D4F] text-white border-none rounded-sm px-3 py-1 flex items-center gap-1 text-md hover:bg-[#164044] "
                    onClick={() => handleExport('PDF')}
                  >
                    <FilePdfOutlined />
                    <span>PDF</span>
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    placeholder="بحث"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-[428px] p-2 bg-[#F7F8FA] border border-[#E0E0E0] rounded-md text-sm text-gray-600 pr-10"
                  />
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                    <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto" dir="rtl">
                <table className="w-full bg-white border-collapse">
                  <thead>
                    <tr>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">#</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">التاريخ</th>
                      {/* <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">الشهر</th> */}
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">اسم العميل</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">رقم العقد</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">الدفعة</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">البيان</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">دائن</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">مدين</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">الرصيد</th>
                      <th className='bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal'>المرفق</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">إجراءات</th>
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
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            #{index + 1}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {getDate(record.date)}
                          </td> 
                          {/* <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {getMonthName(new Date(record.date).getMonth())}
                          </td> */}
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.clientName}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.contractNumber || '-'}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.payment || '-'}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.description || '-'}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.credit > 0 ? formatCurrency(record.credit) : '-'}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.debit > 0 ? formatCurrency(record.debit) : '-'}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {formatCurrency(record.balance)}
                          </td>

<td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">

{record.invoice && (
  <a href={record.invoice} target="_blank" rel="noopener noreferrer">
       <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#1A4D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <polyline points="14,2 14,8 20,8" stroke="#1A4D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="16" y1="13" x2="8" y2="13" stroke="#1A4D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="16" y1="17" x2="8" y2="17" stroke="#1A4D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <polyline points="10,9 9,9 8,9" stroke="#1A4D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
  </a>
)}
                          </td>

                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            <div className="flex gap-2 justify-center">
                              <button
                                className="bg-transparent border-none cursor-pointer p-1 rounded-md hover:bg-[#1A4D4F]/10"
                                onClick={() => openEditModalHandler(record)}
                                title="تعديل"
                              >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                  <path d="M14 3l4 4-8 8H6v-4l8-8z" stroke="#1A4D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
            </section>
          </main>
        </div>

        {/* Add Record Modal */}
        {openAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => {
              setOpenAddModal(false);
              setLastBalance(0);
              setForm({
                date: '',
                clientName: '',
                contractNumber: '',
                payment: '',
                description: '',
                credit: '',
                debit: '',
                balance: '',
              });
              setInvoiceFile(null);
            }} />
            <div className="relative bg-white p-8 rounded-lg w-full max-w-[850px] mx-auto shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-center text-2xl text-gray-800">إضافة سجل</h2>
                <button
                  aria-label="close"
                  onClick={() => {
                    setOpenAddModal(false);
                    setLastBalance(0);
                    setForm({
                      date: '',
                      clientName: '',
                      contractNumber: '',
                      payment: '',
                      description: '',
                      credit: '',
                      debit: '',
                      balance: '',
                    });
                    setInvoiceFile(null);
                  }}
                  className="text-[#1A4D4F] hover:text-[#164044] text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleAddRecord}>
                {/* Contract Search */}
                <div className="flex flex-col mb-6">
                  <label className="mb-2 font-bold text-gray-800">رقم العقد</label>
                  <div className="relative contract-search-container">
                    <input
                      type="text"
                      name="contractNumber"
                      value={form.contractNumber}
                      onChange={handleContractNumberChange}
                      onBlur={handleContractInputBlur}
                      onFocus={() => form.contractNumber.length >= 1 && setShowContractSuggestions(true)}
                      placeholder="ابحث برقم العقد"
                      className="w-full p-2 border border-gray-300 rounded-md bg-white pr-10"
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
                            <div className="font-medium text-sm">
                              <span className="text-gray-700">رقم العقد: {suggestion}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">تاريخ الطلب</label>
                    <input
                      name="date"
                      value={form.date}
                      onChange={handleChange}
                      type="date"
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">العميل</label>
                    <input
                      type="text"
                      name="clientName"
                      value={form.clientName}
                      onChange={handleChange}
                      placeholder="اسم العميل"
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">البيان</label>
                    <input
                      type="text"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="ادخل البيان"
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">الدفعه</label>
                    <input
                      type="text"
                      name="payment"
                      value={form.payment}
                      onChange={handleChange}
                      placeholder="ادخل بيان الدفعه"
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">رصيد الدائن</label>
                    <input
                      type="number"
                      name="credit"
                      value={form.credit}
                      onChange={handleChange}
                      placeholder="ادخل رصيد الدائن"
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">رصيد المدين</label>
                    <input
                      type="number"
                      name="debit"
                      value={form.debit}
                      onChange={handleChange}
                      placeholder="ادخل رصيد المدين"
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">الفاتورة</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                    {uploadingInvoice && (
                      <div className="text-sm text-blue-600 mt-1">جاري رفع الملف...</div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">الرصيد (محسوب تلقائياً)</label>
                    <input
                      type="number"
                      name="balance"
                      value={form.balance}
                      disabled
                      className="p-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      الرصيد السابق: <span className="font-semibold">{lastBalance.toLocaleString()}</span>
                      {(form.debit || form.credit) && (
                        <span className="mr-2">
                          {form.debit && ` + ${parseFloat(form.debit).toLocaleString()} (مدين)`}
                          {form.credit && ` - ${parseFloat(form.credit).toLocaleString()} (دائن)`}
                          {` = ${parseFloat(form.balance || '0').toLocaleString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-center space-y-3 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                  <button
                    type="submit"
                    className="inline-flex justify-center items-center px-6 py-2 rounded-md text-sm font-bold text-white bg-[#1A4D4F] hover:bg-[#164044]"
                  >
                    إضافة
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center items-center px-6 py-2 rounded-md text-sm font-bold text-[#1A4D4F] border-2 border-[#1A4D4F] hover:bg-[#1A4D4F] hover:text-white"
                    onClick={() => {
                      setOpenAddModal(false);
                      setLastBalance(0);
                      setForm({
                        date: '',
                        clientName: '',
                        contractNumber: '',
                        payment: '',
                        description: '',
                        credit: '',
                        debit: '',
                        balance: '',
                      });
                      setInvoiceFile(null);
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Record Modal - نفس نافذة الإضافة */}
        {openEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => {
              setOpenEditModal(false);
              setLastBalance(0);
              setInvoiceFile(null);
            }} />
            <div className="relative bg-white p-8 rounded-lg w-full max-w-[850px] mx-auto shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-center text-2xl text-gray-800">تعديل سجل</h2>
                <button
                  aria-label="close"
                  onClick={() => {
                    setOpenEditModal(false);
                    setLastBalance(0);
                    setInvoiceFile(null);
                  }}
                  className="text-[#1A4D4F] hover:text-[#164044] text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleEditRecord}>
                {/* Contract Search - نفس الإضافة */}
                <div className="flex flex-col mb-6">
                  <label className="mb-2 font-bold text-gray-800">رقم العقد</label>
                  <div className="relative contract-search-container">
                    <input
                      type="text"
                      name="contractNumber"
                      value={editForm.contractNumber}
                      onChange={handleEditContractNumberChange}
                      onBlur={handleContractInputBlur}
                      onFocus={() => editForm.contractNumber.length >= 1 && setShowContractSuggestions(true)}
                      placeholder="ابحث برقم العقد"
                      className="w-full p-2 border border-gray-300 rounded-md bg-white pr-10"
                    />
                    {isSearchingContract && (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1A4D4F]"></div>
                      </div>
                    )}
                    {showContractSuggestions && contractSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {contractSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            onClick={() => handleEditContractSuggestionClick(suggestion)}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                          >
                            <div className="font-medium text-sm">
                              <span className="text-gray-700">رقم العقد: {suggestion}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">تاريخ الطلب</label>
                    <input
                      name="date"
                      value={editForm.date}
                      onChange={handleEditChange}
                      type="date"
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">العميل</label>
                    <input
                      type="text"
                      name="clientName"
                      value={editForm.clientName}
                      onChange={handleEditChange}
                      placeholder="اسم العميل"
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">البيان</label>
                    <input
                      type="text"
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                      placeholder="ادخل البيان"
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">الدفعه</label>
                    <input
                      type="text"
                      name="payment"
                      value={editForm.payment}
                      onChange={handleEditChange}
                      placeholder="ادخل بيان الدفعه"
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">رصيد الدائن</label>
                    <input
                      type="number"
                      name="credit"
                      value={editForm.credit}
                      onChange={handleEditChange}
                      placeholder="ادخل رصيد الدائن"
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">رصيد المدين</label>
                    <input
                      type="number"
                      name="debit"
                      value={editForm.debit}
                      onChange={handleEditChange}
                      placeholder="ادخل رصيد المدين"
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">الفاتورة</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                    {editForm.invoice && !invoiceFile && (
                      <a href={editForm.invoice} target="_blank" rel="noopener noreferrer" className="text-sm text-[#1A4D4F] hover:underline mt-1">الفاتورة الحالية</a>
                    )}
                    {uploadingInvoice && (
                      <div className="text-sm text-blue-600 mt-1">جاري رفع الملف...</div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">الرصيد (محسوب تلقائياً)</label>
                    <input
                      type="number"
                      name="balance"
                      value={editForm.balance}
                      disabled
                      className="p-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      الرصيد السابق: <span className="font-semibold">{lastBalance.toLocaleString()}</span>
                      {(editForm.debit || editForm.credit) && (
                        <span className="mr-2">
                          {editForm.debit && ` + ${parseFloat(editForm.debit).toLocaleString()} (مدين)`}
                          {editForm.credit && ` - ${parseFloat(editForm.credit).toLocaleString()} (دائن)`}
                          {` = ${parseFloat(editForm.balance || '0').toLocaleString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-3 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                  <button
                    type="submit"
                    className="inline-flex justify-center items-center px-6 py-2 rounded-md text-sm font-bold text-white bg-[#1A4D4F] hover:bg-[#164044]"
                  >
                    حفظ
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center items-center px-6 py-2 rounded-md text-sm font-bold text-[#1A4D4F] border-2 border-[#1A4D4F] hover:bg-[#1A4D4F] hover:text-white"
                    onClick={() => {
                      setOpenEditModal(false);
                      setLastBalance(0);
                      setInvoiceFile(null);
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Layout>
    </div>
  );
}
