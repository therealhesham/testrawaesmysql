import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { jwtDecode } from 'jwt-decode';
import { 
  SunIcon, 
  MoonIcon, 
  OfficeBuildingIcon, 
  UserIcon, 
  CalendarIcon, 
  SearchIcon, 
  CurrencyDollarIcon, 
  ReceiptTaxIcon, 
  CreditCardIcon, 
  DocumentTextIcon, 
  ViewGridIcon, 
  ChevronRightIcon, 
  ChevronLeftIcon,
  DotsHorizontalIcon,
  FilterIcon,
  RefreshIcon
} from '@heroicons/react/outline';

interface ClientAccountStatement {
  id: number;
  contractNumber: string;
  internalMusanedContract?: string; // InternalmusanedContract من arrivallist
  officeName: string;
  totalRevenue: number;
  totalExpenses: number;
  netAmount: number;
  commissionPercentage?: number;
  masandTransferAmount?: number;
  contractStatus: string;
  notes: string;
  attachment?: string;
  createdAt: string;
  client: {
    id: number;
    fullname: string;
    phonenumber: string;
    nationalId: string;
  };
  entries: any[];
  contractType: string;
}

interface Summary {
  totalRevenue: number;
  totalExpenses: number;
  netAmount: number;
}

interface Filters {
  foreignOffices: string[];
  clients: Array<{
    id: number;
    fullname: string;
  }>;
}

const ClientAccountsPage = () => {
  const router = useRouter();
  const [statements, setStatements] = useState<ClientAccountStatement[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalRevenue: 0, totalExpenses: 0, netAmount: 0 });
  const [filters, setFilters] = useState<Filters>({ foreignOffices: [], clients: [] });
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState('recruitment');
  const [tabCounts, setTabCounts] = useState({ recruitment: 0, rental: 0 });
  const [userName, setUserName] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Filter states
  const [selectedOffice, setSelectedOffice] = useState('all');
  const [selectedForeignOffice, setSelectedForeignOffice] = useState('all');
  const [selectedClient, setSelectedClient] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStatement, setEditingStatement] = useState<ClientAccountStatement | null>(null);
  const [editForm, setEditForm] = useState({
    contractNumber: '',
    officeName: '',
    totalRevenue: 0,
    totalExpenses: 0,
    masandTransferAmount: 0,
    commissionPercentage: 0,
    netAmount: 0,
    contractStatus: '',
    notes: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string>('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Data fetching
  const [clients, setClients] = useState<{ id: number; fullname: string }[]>([]);
  const [foreignOffices, setForeignOffices] = useState<{ office: string }[]>([]);
  const [loadingOffices, setLoadingOffices] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(selectedOffice !== 'all' && { foreignOffice: selectedOffice }),
        ...(selectedForeignOffice !== 'all' && { foreignOffice: selectedForeignOffice }),
        ...(selectedClient !== 'all' && { client: selectedClient }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        ...(activeTab && { contractType: activeTab }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/client-accounts?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch client accounts');
      }

      if (!data?.pagination) {
        // Handle case where pagination might be missing if API changed, or just be safe
         console.warn('Invalid response format from server, missing pagination');
      }

      setStatements(data.statements || []);
      setSummary(data.summary || { totalRevenue: 0, totalExpenses: 0, netAmount: 0 });
      setFilters(data.filters || { foreignOffices: [], clients: [] });
      setTotalPages(data.pagination?.pages || 1);
      
      // Update tab counts
      setTabCounts(prev => ({
        ...prev,
        [activeTab]: data.pagination?.total || 0
      }));
    } catch (error) {
      console.error('Error fetching client accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch counts for both tabs on component mount
  const fetchTabCounts = async () => {
    try {
      const [recruitmentResponse, rentalResponse] = await Promise.all([
        fetch(`/api/client-accounts?contractType=recruitment&limit=1`),
        fetch(`/api/client-accounts?contractType=rental&limit=1`)
      ]);
      
      const [recruitmentData, rentalData] = await Promise.all([
        recruitmentResponse.json(),
        rentalResponse.json()
      ]);
      
      setTabCounts({
        recruitment: recruitmentData.pagination?.total || 0,
        rental: rentalData.pagination?.total || 0
      });
    } catch (error) {
      console.error('Error fetching tab counts:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, selectedOffice, selectedClient, fromDate, toDate, selectedForeignOffice, activeTab]);

  useEffect(() => {
    fetchTabCounts();
    fetchClients();
    fetchForeignOffices();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const decoded = jwtDecode(token) as any;
      setUserName(decoded.username || '');
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }, []);

  const fetchClients = async () => {
    try {
        const response = await fetch('/api/clientsexport');
        const data = await response.json();
        setClients(data.data || []);
    } catch (error) {
        console.error("Error fetching clients", error);
    }
  };
  
  const fetchForeignOffices = async()=>{
    try {
      setLoadingOffices(true);
      const response = await fetch("/api/Export/foreignoffices")
      const data = await response.json();
      setForeignOffices(data || []);
    } catch (error) {
      console.error('Error fetching foreign offices:', error);
      setForeignOffices([]);
    } finally {
      setLoadingOffices(false);
    }
  }

  const handleGenerateReport = () => {
    setCurrentPage(1);
    fetchData();
  };

  const handleResetFilters = () => {
    setSelectedOffice('all');
    setSelectedForeignOffice('all');
    setSelectedClient('all');
    setFromDate('');
    setToDate('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const calculateNetAmount = (revenue: number, expenses: number, commissionPercentage: number) => {
    const commissionValue = revenue * (commissionPercentage / 100);
    return revenue - expenses - commissionValue;
  };

  const handleEditClick = (statement: ClientAccountStatement) => {
    const totalRevenue = statement.totalRevenue || 0;
    const totalExpenses = statement.totalExpenses || 0;
    const masandTransferAmount = statement.masandTransferAmount || 0;
    const commissionPercentage = statement.commissionPercentage || 0;

    setEditingStatement(statement);
    setEditForm({
      contractNumber: statement.internalMusanedContract || statement.contractNumber,
      officeName: statement.officeName,
      totalRevenue,
      totalExpenses,
      masandTransferAmount,
      commissionPercentage,
      netAmount: calculateNetAmount(totalRevenue, totalExpenses, commissionPercentage),
      contractStatus: statement.contractStatus,
      notes: statement.notes || ''
    });
    // Reset file states
    setSelectedFileName('');
    setSelectedFile(null);
    setUploadedFilePath(statement.attachment || '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingStatement) return;
    try {
      const response = await fetch(`/api/client-accounts/${editingStatement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          attachment: uploadedFilePath || undefined
        })
      });

      if (!response.ok) throw new Error('Update failed');
      setIsEditModalOpen(false);
      setEditingStatement(null);
      setSelectedFileName('');
      setSelectedFile(null);
      setUploadedFilePath('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await fetchData();
      alert('تم التحديث بنجاح');
    } catch (error) {
      console.error('Error updating statement:', error);
      alert('حدث خطأ أثناء التحديث');
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingStatement(null);
    setSelectedFileName('');
    setSelectedFile(null);
    setUploadedFilePath('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setSelectedFileName(file.name);
    setIsUploadingFile(true);

    // Validate file type
    const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedFileTypes.includes(file.type)) {
      alert('نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)');
      setSelectedFileName('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsUploadingFile(false);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)');
      setSelectedFileName('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsUploadingFile(false);
      return;
    }

    try {
      // Get presigned URL
      const fileId = editingStatement?.id 
        ? `client-account-${editingStatement.id}-${Date.now()}` 
        : `client-account-${Date.now()}`;
      
      const res = await fetch(`/api/upload-presigned-url/${fileId}`);
      if (!res.ok) throw new Error('فشل في الحصول على رابط الرفع');
      
      const { url, filePath } = await res.json();

      // Upload to Digital Ocean
      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'x-amz-acl': 'public-read',
        },
      });

      if (!uploadRes.ok) throw new Error('فشل في رفع الملف');

      setUploadedFilePath(filePath);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert(error.message || 'حدث خطأ أثناء رفع الملف');
      setSelectedFileName('');
      setSelectedFile(null);
      setUploadedFilePath('');
    } finally {
      setIsUploadingFile(false);
    }
  };

   const fieldNames: { [key: string]: string } = {
    'officeLinkInfo': 'الربط مع إدارة المكاتب',
   'travel_permit_issued':'تم إصدار تصريح السفر',

   'foreign_labor_approved':'تمت الموافقة من وزارة العمل الأجنبية',
    'externalOfficeInfo': 'المكتب الخارجي',
    'externalOfficeApproval': 'موافقة المكتب الخارجي',
    'medicalCheck': 'الفحص الطبي',
    'foreignLaborApproval': 'موافقة وزارة العمل الأجنبية',
    'agencyPayment': 'دفع الوكالة',
    'saudiEmbassyApproval': 'موافقة السفارة السعودية',
    'visaIssuance': 'إصدار التأشيرة',
    'travelPermit': 'تصريح السفر',
    'destinations': 'الوجهات',
    'receipt': 'الاستلام',
    'pending_external_office': 'في انتظار المكتب الخارجي',
    'ticketUpload': 'رفع المستندات'
  };

  const translateContractStatus = (status: string) => {
    return fieldNames[status] || status;
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  function getDate(date: string) {
    if (!date) return null;
    const currentDate = new Date(date);
    const formatted = currentDate.getDate() + '/' + (currentDate.getMonth() + 1) + '/' + currentDate.getFullYear();
    return formatted;
  }
  
  const formatDate = (dateString: string) => {
    return getDate(dateString);
  };

  // Fetch data for export with all filters
  const fetchFilteredDataExporting = async () => {
    const query = new URLSearchParams({
      limit: "1000",
      page: "1",
      ...(selectedOffice !== 'all' && { foreignOffice: selectedOffice }),
      ...(selectedForeignOffice !== 'all' && { foreignOffice: selectedForeignOffice }),
      ...(selectedClient !== 'all' && { client: selectedClient }),
      ...(fromDate && { fromDate }),
      ...(toDate && { toDate }),
      ...(activeTab && { contractType: activeTab }),
    }).toString();
    const res = await fetch(`/api/client-accounts?${query}`);
    
    if (!res.ok) throw new Error("Failed to fetch data");
    const data = await res.json();
    return data.statements;
  };

  // Export to PDF
  const exportToPDF = async () => {
    try {
      let dataToExport = await fetchFilteredDataExporting();
      
      const doc = new jsPDF({ orientation: 'landscape' });
      const pageWidth = doc.internal.pageSize.width;

      // Load logo
      const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
      const logoBuffer = await logo.arrayBuffer();
      const logoBytes = new Uint8Array(logoBuffer);
      const logoBase64 = Buffer.from(logoBytes).toString('base64');

      // Load Arabic font
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
        'ملاحظات',
        'حالة العقد',
        'الصافي',
        'المصروفات',
        'الايرادات',
        'اسم المكتب',
        'رقم العقد',
        'اسم العميل',
        'التاريخ',
        'رقم',
      ];

      const tableRows = Array.isArray(dataToExport)
        ? dataToExport.map((row: any, index: number) => [
            row.notes || 'غير متوفر',
            row.contractStatus || 'غير متوفر',
            formatCurrency(row.netAmount || 0),
            formatCurrency(row.totalExpenses || 0),
            formatCurrency(row.totalRevenue || 0),
            row.officeName || 'غير متوفر',
            row.internalMusanedContract || 'غير متوفر',
            row.client?.fullname || 'غير متوفر',
            formatDate(row.createdAt),
            index + 1,
          ])
        : [];

      (doc as any).autoTable({
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
          halign: 'right',
        },
        margin: { top: 39, right: 10, left: 10 },
        didDrawPage: (data: any) => {
          const pageHeight = doc.internal.pageSize.height;
          const pageWidth = doc.internal.pageSize.width;

          // Add logo on every page
          doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

          // Add title on first page only
          if (doc.getCurrentPageInfo().pageNumber === 1) {
            doc.setFontSize(12);
            doc.setFont('Amiri', 'normal');
            doc.text('كشف حساب العملاء', pageWidth / 2, 20, { align: 'right' });
          }

          // Footer
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

      doc.save('client_accounts.pdf');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF');
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    try {
      let dataToExport = await fetchFilteredDataExporting();
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('كشف حساب العملاء', { properties: { defaultColWidth: 20 } });

      worksheet.columns = [
        { header: 'رقم', key: 'id', width: 10 },
        { header: 'التاريخ', key: 'date', width: 15 },
        { header: 'اسم العميل', key: 'clientName', width: 20 },
        { header: 'رقم العقد', key: 'contractNumber', width: 15 },
        { header: 'اسم المكتب', key: 'officeName', width: 20 },
        { header: 'الايرادات', key: 'totalRevenue', width: 15 },
        { header: 'المصروفات', key: 'totalExpenses', width: 15 },
        { header: 'الصافي', key: 'netAmount', width: 15 },
        { header: 'حالة العقد', key: 'contractStatus', width: 15 },
        { header: 'ملاحظات', key: 'notes', width: 30 },
      ];

      worksheet.getRow(1).font = { name: 'Amiri', size: 12 };
      worksheet.getRow(1).alignment = { horizontal: 'right' };

      if (Array.isArray(dataToExport)) {
        dataToExport.forEach((row: any, index: number) => {
          worksheet.addRow({
            id: index + 1,
            date: formatDate(row.createdAt),
            clientName: row.client?.fullname || 'غير متوفر',
            contractNumber: row.internalMusanedContract || 'غير متوفر',
            officeName: row.officeName || 'غير متوفر',
            totalRevenue: row.totalRevenue || 0,
            totalExpenses: row.totalExpenses || 0,
            netAmount: row.netAmount || 0,
            contractStatus: row.contractStatus || 'غير متوفر',
            notes: row.notes || 'غير متوفر',
          }).alignment = { horizontal: 'right' };
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'client_accounts.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('حدث خطأ أثناء تصدير Excel');
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <Layout>
      <div className={`bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 transition-colors duration-300 min-h-screen ${Style["tajawal-regular"]} ${isDarkMode ? 'dark' : ''}`} dir="rtl">
        {/* Dark Mode Toggle */}
        <div className="fixed bottom-6 left-6 z-50">
            <button 
                onClick={toggleDarkMode}
                className="p-3 rounded-full bg-gray-100 dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:scale-110 transition-transform"
            >
                {isDarkMode ? (
                    <SunIcon className="w-6 h-6 text-yellow-500" />
                ) : (
                    <MoonIcon className="w-6 h-6 text-slate-400" />
                )}
            </button>
        </div>

        <div className="max-w-[1440px] mx-auto px-4 py-8">
            <header className="mb-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">كشف حساب العملاء</h1>
            </header>

            {/* Filter Section */}
            <section className="bg-gray-100 dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">المكتب الأجنبي</label>
                        <div className="relative">
                            <select 
                                value={selectedForeignOffice}
                                onChange={(e) => setSelectedForeignOffice(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pr-10 pl-4 appearance-none focus:ring-primary focus:border-primary transition-all"
                            >
                                <option value="all">اختر المكتب الأجنبي</option>
                                {foreignOffices.map((office, index) => (
                                    <option key={index} value={office.office}>{office.office}</option>
                                ))}
                            </select>
                            <OfficeBuildingIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">العميل</label>
                        <div className="relative">
                            <select 
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pr-10 pl-4 appearance-none focus:ring-primary focus:border-primary transition-all"
                            >
                                <option value="all">اختر العميل</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>{client.fullname}</option>
                                ))}
                            </select>
                            <UserIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">من تاريخ</label>
                        <div className="relative">
                            <input 
                                type="date" 
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pr-10 pl-4 focus:ring-primary focus:border-primary transition-all"
                            />
                            <CalendarIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">إلى تاريخ</label>
                        <div className="relative">
                            <input 
                                type="date" 
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pr-10 pl-4 focus:ring-primary focus:border-primary transition-all"
                            />
                            <CalendarIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex gap-4 justify-end">
                    <button 
                        onClick={handleGenerateReport}
                        className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all"
                    >
                        <SearchIcon className="w-5 h-5" />
                        كشف حساب
                    </button>
                    <button 
                        onClick={handleResetFilters}
                        className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-8 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2"
                    >
                        <RefreshIcon className="w-5 h-5" />
                        إعادة ضبط
                    </button>
                </div>
            </section>

            {/* Summary Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-gray-100 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                            <CurrencyDollarIcon className="w-6 h-6 text-teal-600" />
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">اجمالي الايرادات</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(summary.totalRevenue)} <span className="text-sm font-normal text-slate-400 mr-1">ر.س</span>
                    </div>
                </div>
                <div className="bg-gray-100 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                            <ReceiptTaxIcon className="w-6 h-6 text-red-600" />
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">اجمالي المصروفات</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(summary.totalExpenses)} <span className="text-sm font-normal text-slate-400 mr-1">ر.س</span>
                    </div>
                </div>
                <div className="bg-gray-100 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-primary">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <CreditCardIcon className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">اجمالي الصافي</span>
                    </div>
                    <div className="text-3xl font-bold text-primary">
                        {formatCurrency(summary.netAmount)} <span className="text-sm font-normal text-slate-400 mr-1">ر.س</span>
                    </div>
                </div>
            </section>

            {/* Table Section */}
            <section className="bg-gray-100 dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="border-b border-slate-100 dark:border-slate-700 flex px-6">
                    <button 
                        onClick={() => setActiveTab('recruitment')}
                        className={`py-4 px-6 font-bold flex items-center gap-2 transition-colors ${activeTab === 'recruitment' ? 'border-b-2 border-primary text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        عقود الاستقدام
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'recruitment' ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                            {tabCounts.recruitment}
                        </span>
                    </button>
                    <button 
                         onClick={() => setActiveTab('rental')}
                         className={`py-4 px-6 font-bold flex items-center gap-2 transition-colors ${activeTab === 'rental' ? 'border-b-2 border-primary text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        عقود التاجير
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'rental' ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                            {tabCounts.rental}
                        </span>
                    </button>
                </div>

                <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-80">
                        <input 
                            className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg py-2 pr-10 pl-4 focus:ring-primary focus:border-primary" 
                            placeholder="بحث سريع..." 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <SearchIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button 
                            onClick={exportToPDF}
                            className="flex items-center gap-1 bg-teal-900 text-white px-3 py-1 rounded text-sm hover:bg-teal-800 transition duration-200"
                        >
                            <DocumentTextIcon className="w-5 h-5" />
                            تصدير PDF
                        </button>
                        <button 
                            onClick={exportToExcel}
                            className="flex items-center gap-1 bg-teal-900 text-white px-3 py-1 rounded text-sm hover:bg-teal-800 transition duration-200"
                        >
                            <ViewGridIcon className="w-5 h-5" />
                            تصدير Excel
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-primary text-white">
                                <th className="px-4 py-4 text-sm font-semibold">#</th>
                                <th className="px-4 py-4 text-sm font-semibold">التاريخ</th>
                                <th className="px-4 py-4 text-sm font-semibold">اسم العميل</th>
                                <th className="px-4 py-4 text-sm font-semibold">رقم العقد</th>
                                <th className="px-4 py-4 text-sm font-semibold">اسم المكتب</th>
                                <th className="px-4 py-4 text-sm font-semibold">الايرادات</th>
                                <th className="px-4 py-4 text-sm font-semibold">المصروفات</th>
                                <th className="px-4 py-4 text-sm font-semibold">الصافي</th>
                                <th className="px-4 py-4 text-sm font-semibold">حالة العقد</th>
                                <th className="px-4 py-4 text-sm font-semibold">ملاحظات</th>
                                <th className="px-4 py-4 text-sm font-semibold text-center">اجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                             {loading ? (
                                <tr>
                                    <td colSpan={11} className="p-8 text-center text-gray-500">جاري التحميل...</td>
                                </tr>
                             ) : statements.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="p-8 text-center text-gray-500">لا توجد بيانات</td>
                                </tr>
                             ) : (
                                statements.map((statement, index) => (
                                    <tr key={statement.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="px-4 py-5 text-sm font-medium text-slate-400">#{index + 1 + (currentPage - 1) * 10}</td>
                                        <td className="px-4 py-5 text-sm">{formatDate(statement.createdAt)}</td>
                                        <td className="px-4 py-5 text-sm font-bold text-slate-700 dark:text-slate-300">{statement.client?.fullname}</td>
                                        <td className="px-4 py-5 text-sm text-slate-400">{statement.internalMusanedContract || statement.contractNumber || '-'}</td>
                                        <td className="px-4 py-5 text-sm">{statement.officeName || 'غير متوفر'}</td>
                                        <td className="px-4 py-5 text-sm font-semibold text-teal-600">{formatCurrency(statement.totalRevenue)}</td>
                                        <td className="px-4 py-5 text-sm font-semibold text-red-500">{formatCurrency(statement.totalExpenses)}</td>
                                        <td className="px-4 py-5 text-sm font-semibold text-primary">{formatCurrency(statement.netAmount)}</td>
                                        <td className="px-4 py-5">
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${
                                                ['تم الترحيل', 'travel_permit_issued', 'foreign_labor_approved'].includes(statement.contractStatus) 
                                                ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300' 
                                                : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                                            }`}>
                                                {translateContractStatus(statement.contractStatus) || statement.contractStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-5 text-sm text-slate-500 max-w-xs leading-relaxed whitespace-pre-wrap" title={statement.notes}>
                                            {statement.notes}
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="flex gap-2 justify-center">
                                                <button 
                                                    onClick={() => router.push(`/admin/client-accounts/${statement.id}`)}
                                                    className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-md text-sm font-bold transition-all"
                                                >
                                                    تفاصيل
                                                </button>
                                                <button 
                                                    onClick={() => handleEditClick(statement)}
                                                    className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-md text-sm font-bold transition-all"
                                                >
                                                    تعديل
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
                <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center border-t border-slate-100 dark:border-slate-700">
                    <div className="text-sm text-slate-500">
                        عرض {(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, tabCounts[activeTab as keyof typeof tabCounts])} من أصل {tabCounts[activeTab as keyof typeof tabCounts]} عقد
                    </div>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            <ChevronRightIcon className="w-5 h-5" />
                        </button>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                             // Logic to show a window of pages around current page
                             let pageNum = currentPage;
                             if (totalPages <= 5) {
                                 pageNum = i + 1;
                             } else if (currentPage <= 3) {
                                 pageNum = i + 1;
                             } else if (currentPage >= totalPages - 2) {
                                 pageNum = totalPages - 4 + i;
                             } else {
                                 pageNum = currentPage - 2 + i;
                             }

                             return (
                                <button 
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-colors ${
                                        currentPage === pageNum 
                                        ? 'bg-primary text-white' 
                                        : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                             );
                        })}

                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </section>
        </div>


        {/* Edit Modal (Preserved Functionality) */}
        {isEditModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">تعديل كشف الحساب</h3>
                        <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-600">
                            <span className="text-2xl">&times;</span>
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">رقم العقد</label>
                                <input 
                                    type="text" 
                                    value={editForm.contractNumber}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                                    disabled
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم المكتب</label>
                                <input 
                                    type="text" 
                                    value={editForm.officeName}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                                    disabled
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">حالة العقد</label>
                                <input 
                                    type="text" 
                                    value={editForm.contractStatus}
                                    onChange={(e) => setEditForm({...editForm, contractStatus: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ملاحظات</label>
                                <input 
                                    type="text" 
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                                />
                            </div>
                        </div>

                         {/* Financials */}
                         <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-2">
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">البيانات المالية</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الايرادات</label>
                                    <input 
                                        type="number" 
                                        value={editForm.totalRevenue}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setEditForm({
                                                ...editForm, 
                                                totalRevenue: val,
                                                netAmount: calculateNetAmount(val, editForm.totalExpenses, editForm.commissionPercentage)
                                            });
                                        }}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المصروفات</label>
                                    <input 
                                        type="number" 
                                        value={editForm.totalExpenses}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setEditForm({
                                                ...editForm, 
                                                totalExpenses: val,
                                                netAmount: calculateNetAmount(editForm.totalRevenue, val, editForm.commissionPercentage)
                                            });
                                        }}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نسبة العمولة (%)</label>
                                    <input 
                                        type="number" 
                                        value={editForm.commissionPercentage}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setEditForm({
                                                ...editForm, 
                                                commissionPercentage: val,
                                                netAmount: calculateNetAmount(editForm.totalRevenue, editForm.totalExpenses, val)
                                            });
                                        }}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الصافي</label>
                                    <input 
                                        type="number" 
                                        value={editForm.netAmount}
                                        disabled
                                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-500"
                                    />
                                </div>
                            </div>
                         </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                        <button 
                            onClick={handleCancelEdit}
                            className="px-6 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            إلغاء
                        </button>
                        <button 
                            onClick={handleSaveEdit}
                            className="px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                        >
                            حفظ التغييرات
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </Layout>
  );
};

export default ClientAccountsPage;
