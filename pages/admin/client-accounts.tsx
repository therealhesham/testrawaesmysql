import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { jwtDecode } from 'jwt-decode';
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
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
      });

      const response = await fetch(`/api/client-accounts?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch client accounts');
      }

      if (!data?.pagination) {
        throw new Error('Invalid response format from server');
      }

      setStatements(data.statements);
      setSummary(data.summary);
      setFilters(data.filters);
      setTotalPages(data.pagination.pages);
      
      // Update tab counts
      setTabCounts(prev => ({
        ...prev,
        [activeTab]: data.pagination.total
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

  const handleGenerateReport = () => {
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

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
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
const [clients, setClients] = useState<{ id: number; fullname: string }[]>([]);
const [foreignOffices, setForeignOffices] = useState<{ office: string }[]>([]);
const [loadingOffices, setLoadingOffices] = useState(true);
const fetchClients = async () => {
  const response = await fetch('/api/clientsexport');
  const data = await response.json();
  setClients(data.data);
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
    // alert(status);
    // alert(fieldNames[status]);
    return fieldNames[status] || status;
  };

useEffect(() => {
  fetchClients();
  fetchForeignOffices();
}, []);
  const formatCurrency = (amount: number) => {
  return amount
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
      const pageHeight = doc.internal.pageSize.height;

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
      
      // Log export action
      try {
        await fetch('/api/accounting-logs/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exportType: 'client_accounts',
            reportType: 'كشف حساب العملاء',
            format: 'pdf',
            filters: { selectedOffice, selectedClient, fromDate, toDate, activeTab },
            recordCount: dataToExport.length
          })
        });
      } catch (error) {
        console.error('Error logging export:', error);
      }
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
      
      // Log export action
      try {
        await fetch('/api/accounting-logs/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exportType: 'client_accounts',
            reportType: 'كشف حساب العملاء',
            format: 'excel',
            filters: { selectedOffice, selectedClient, fromDate, toDate, activeTab },
            recordCount: dataToExport.length
          })
        });
      } catch (error) {
        console.error('Error logging export:', error);
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('حدث خطأ أثناء تصدير Excel');
    }
  };

  const filteredStatements = statements.filter(statement => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      statement.client.fullname?.toLowerCase().includes(searchLower) ||
      (statement.internalMusanedContract || statement.contractNumber)?.toLowerCase().includes(searchLower) ||
      statement.officeName?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Layout>
      <div className={`p-6 bg-gray-50 min-h-screen ${Style["tajawal-regular"]}`}>
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-normal text-black">كشف حساب العملاء</h1>
        </div>

        {/* Filter Section */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col">
              <label className="text-md text-gray-700 mb-2">المكتب الاجنبي  </label>
              <select
                value={selectedForeignOffice}
                onChange={(e) => setSelectedForeignOffice(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded  text-md text-gray-600 "
              >
                <option value="all">اختر المكتب الاجنبي</option>
                {loadingOffices ? (
                  <option disabled>جاري التحميل...</option>
                ) : (
                  foreignOffices.map((office, index) => (
                    <option key={index} value={office.office}>{office.office}</option>
                  ))
                )}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-md text-gray-700 mb-2">العميل</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded text-md text-gray-600 "
              >
                <option value="all">اختر العميل</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.fullname}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-md text-gray-700 mb-2">الى</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded text-md text-gray-600 "
              />
            </div>

            <div className="flex flex-col">
              <label className="text-md text-gray-700 mb-2">من</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded  text-md text-gray-600 "
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateReport}
              className="bg-teal-800 text-white rounded text-md  min-w-[123px]"
            >
              كشف حساب
            </button>
            <button
              onClick={handleResetFilters}
              className="bg-gray-500 text-white rounded text-md  min-w-[123px] hover:bg-gray-600 transition duration-200"
            >
              إعادة ضبط
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="bg-gray-50 rounded-lg p-5 text-center min-w-[237px] shadow-sm">
            <div className="text-base font-normal text-gray-700 mb-2">اجمالي الايرادات</div>
            <div className="text-base font-normal text-gray-700 leading-8">
              {formatCurrency(summary.totalRevenue)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-5 text-center min-w-[237px] shadow-sm">
            <div className="text-base font-normal text-gray-700 mb-2">اجمالي المصروفات</div>
            <div className="text-base font-normal text-gray-700 leading-8">
              {formatCurrency(summary.totalExpenses)}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-5 text-center min-w-[237px] shadow-sm">
            <div className="text-base font-normal text-gray-700 mb-2">اجمالي الصافي</div>
            <div className="text-base font-normal text-gray-700 leading-8">
              {formatCurrency(summary.netAmount)}
            </div>
          </div>
        </div>

        {/* Accounts Section */}
        <div className="bg-white">
          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8 border-b border-gray-300">
            <div className={`flex items-center gap-2 pb-3 cursor-pointer transition-all duration-200 ${activeTab === 'recruitment' ? 'border-b-2 border-teal-700' : ''}`} onClick={() => setActiveTab('recruitment')}>
              <span className={`text-sm w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
                activeTab === 'recruitment' 
                  ? 'bg-teal-800 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {tabCounts.recruitment}
              </span>
              <span className={`text-base transition-colors duration-200 ${
                activeTab === 'recruitment' 
                  ? 'text-teal-700 font-medium' 
                  : 'text-gray-500'
              }`}>
                عقود الاستقدام
              </span>
            </div>
            <div className={`flex items-center gap-2 pb-3 cursor-pointer transition-all duration-200 ${activeTab === 'rental' ? 'border-b-2 border-teal-700' : ''}`} onClick={() => setActiveTab('rental')}>
              <span className={`text-sm w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
                activeTab === 'rental' 
                  ? 'bg-teal-800 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {tabCounts.rental}
              </span>
              <span className={`text-base transition-colors duration-200 ${
                activeTab === 'rental' 
                  ? 'text-teal-700 font-medium' 
                  : 'text-gray-500'
              }`}>
                عقود التاجير
              </span>
            </div>
          </div>
            <div className="flex-1 max-w-64">
              <input
                type="text"
                placeholder="بحث"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded  text-md text-gray-600"
              />
            </div>

          {/* Export and Search */}
          <div className="flex items-center justify-end gap-2 mb-4 px-4">
            <button 
              onClick={exportToExcel}
              className="flex items-center gap-1 bg-teal-800 text-white rounded text-md px-3 py-1 hover:bg-teal-900 transition duration-200"
            >
              <FileExcelOutlined />
              <span>Excel</span>
            </button>
            <button 
              onClick={exportToPDF}
              className="flex items-center gap-1 bg-teal-800 text-white rounded text-md px-3 py-1 hover:bg-teal-900 transition duration-200"
            >
              <FilePdfOutlined />
              <span>PDF</span>
            </button>
          </div>

          {/* Data Table */}
          <div className="bg-gray-100 border border-gray-300 rounded overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-teal-800 text-white">
                  <th className="p-4 text-center text-md font-normal">#</th>
                  <th className="p-4 text-center text-md font-normal">التاريخ</th>
                  <th className="p-4 text-center text-md font-normal">اسم العميل</th>
                  <th className="p-4 text-center text-md font-normal">رقم العقد</th>
                  <th className="p-4 text-center text-md font-normal">اسم المكتب</th>
                  <th className="p-4 text-center text-md font-normal">الايرادات</th>
                  <th className="p-4 text-center text-md font-normal">المصروفات</th>
                  <th className="p-4 text-center text-md font-normal">الصافي</th>
                  <th className="p-4 text-center text-md font-normal">حالة العقد</th>
                  <th className="p-4 text-center text-md font-normal">ملاحظات</th>
                  <th className="p-4 text-center text-md font-normal">تفاصيل</th>
                  <th className="p-4 text-center text-md font-normal">اجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-gray-500">جاري التحميل...</td>
                  </tr>
                ) : filteredStatements.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-gray-500">لا توجد بيانات</td>
                  </tr>
                ) : (
                  filteredStatements.map((statement, index) => (
                    <React.Fragment key={statement.id}>
                      <tr
                        className="border-b border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                        onClick={() => toggleRowExpansion(statement.id)}
                      >
                        <td className="p-4 text-center text-md text-gray-700">#{index + 1}</td>
                        <td className="p-4 text-center text-md text-gray-700">
                          {formatDate(statement.createdAt)}
                        </td>
                        <td className="p-4 text-center text-md text-gray-700">
                          <button onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/clientdetails?id=${statement.client.id}`);
                          }} className="text-teal-800 hover:underline">
                            {statement.client.fullname}
                          </button>
                        </td>
                        <td className="p-4 text-center text-md text-gray-700">
                          {statement.internalMusanedContract || '-'}
                        </td>
                        <td className="p-4 text-center text-md text-gray-700">
                          {statement.officeName}
                        </td>
                        <td className="p-4 text-center text-md text-gray-700">
                          {formatCurrency(statement.totalRevenue)}
                        </td>
                        <td className="p-4 text-center text-md text-gray-700">
                          {formatCurrency(statement.totalExpenses)}
                        </td>
                        <td className="p-4 text-center text-md text-gray-700">
                          {formatCurrency(statement.netAmount)}
                        </td>
                        <td className="p-4 text-center text-md text-gray-700">
                          {translateContractStatus(statement.contractStatus)}
                        </td>
                        <td className="p-4 text-center text-md text-gray-700">
                          {statement.notes || '-'}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/client-accounts/${statement.id}`);
                            }}
                            className="bg-teal-800 text-white px-3 py-1 rounded text-md"
                          >
                            تفاصيل
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(statement);
                            }}
                            className="bg-teal-800 text-white px-3 py-1 rounded text-md hover:bg-teal-900 transition duration-200"
                          >
                            اجراءات
                          </button>
                        </td>
                      </tr>
                      {/* Expandable Details Row */}
                      {expandedRows.has(statement.id) && (
                        <tr>
                          <td colSpan={12} className="bg-gray-100 border-b border-gray-300 p-4">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr>
                                  <th className="p-2 text-center text-md text-gray-700">التاريخ</th>
                                  <th className="p-2 text-center text-md text-gray-700">البيان</th>
                                  <th className="p-2 text-center text-md text-gray-700">مدين</th>
                                  <th className="p-2 text-center text-md text-gray-700">دائن</th>
                                  <th className="p-2 text-center text-md text-gray-700">الرصيد</th>
                                </tr>
                              </thead>
                              <tbody>
                                {statement.entries.map((entry, idx) => {
                                  let description = entry.description;
                                  if (idx === 0) {
                                    description = 'Recruitment fees payment from the client';
                                  }
                                  return (
                                    <tr key={idx}>
                                      <td className="p-2 text-center text-md text-gray-500">{formatDate(entry.date)}</td>
                                      <td className="p-2 text-center text-md text-gray-500">{description}</td>
                                      <td className="p-2 text-center text-md text-gray-500">{formatCurrency(entry.debit)}</td>
                                      <td className="p-2 text-center text-md text-gray-500">{formatCurrency(entry.credit)}</td>
                                      <td className="p-2 text-center text-md text-gray-500">{formatCurrency(entry.balance)}</td>
                                    </tr>
                                  );
                                })}
                                {statement.entries.length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="text-center text-gray-500">لا توجد إدخالات</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-700">
                  <td className="p-4 text-base font-normal text-gray-700" colSpan={5}>الاجمالي</td>
                  <td className="p-4 text-center text-md text-gray-700">
                    {formatCurrency(summary.totalRevenue)}
                  </td>
                  <td className="p-4 text-center text-md text-gray-700">
                    {formatCurrency(summary.totalExpenses)}
                  </td>
                  <td className="p-4 text-center text-md text-gray-700">
                    {formatCurrency(summary.netAmount)}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
              >
                السابق
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded ${
                    page === currentPage
                      ? 'bg-teal-800 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-8">
              <h2 className="text-3xl text-center text-gray-900 mb-8">تعديل</h2>

              <div className="space-y-5">
                <div className="flex flex-col">
                  <label className="text-right text-gray-700 mb-2">اسم العميل</label>
                  <input
                    type="text"
                    value={editingStatement?.client.fullname || ''}
                    disabled
                    className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-right text-gray-600"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="flex flex-col">
                    <label className="text-right text-gray-700 mb-2">رقم العقد</label>
                    <input
                      type="text"
                      value={editForm.contractNumber}
                      onChange={(e) => setEditForm({ ...editForm, contractNumber: e.target.value })}
                      className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-right text-gray-600"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-right text-gray-700 mb-2">اسم المكتب</label>
                    <input
                      type="text"
                      value={editForm.officeName}
                      onChange={(e) => setEditForm({ ...editForm, officeName: e.target.value })}
                      className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-right text-gray-600"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="flex flex-col">
                    <label className="text-right text-gray-700 mb-2">صافي ربح مؤجل</label>
                    <input
                      disabled
                      type="number"
                      value={editForm.totalRevenue}
                      onChange={(e) => {
                        const totalRevenue = parseFloat(e.target.value) || 0;
                        setEditForm(prev => ({
                          ...prev,
                          totalRevenue,
                          netAmount: calculateNetAmount(totalRevenue, prev.totalExpenses, prev.commissionPercentage)
                        }));
                      }}
                      className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-right text-gray-600"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-right text-gray-700 mb-2">الربح الفعلي</label>
                    <input
                      type="text"
                      value={`${formatCurrency(editForm.netAmount - editForm.masandTransferAmount)}`}
                      disabled
                      className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-right text-gray-600"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="flex flex-col">
                    <label className="text-right text-gray-700 mb-2">المبلغ المحول من مساند</label>
                    <input
                      type="number"
                      value={editForm.masandTransferAmount}
                      onChange={(e) => {
                        const masandTransferAmount = parseFloat(e.target.value) || 0;
                        setEditForm(prev => ({
                          ...prev,
                          masandTransferAmount
                        }));
                      }}
                      className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-right text-gray-600"
                    />
                  </div>
                  {/* <div className="flex flex-col">
                    <label className="text-right text-gray-700 mb-2">الضريبة</label>
                    <input
                      type="text"
                      value="رسوم عمولة المكتب"
                      disabled
                      className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-right text-gray-600"
                    />
                  </div> */}
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="flex flex-col">
                    <label className="text-right text-gray-700 mb-2">العمولة (٪)</label>
                    <input
                      type="number"
                      value={editForm.commissionPercentage}
                      onChange={(e) => {
                        const commissionPercentage = parseFloat(e.target.value) || 0;
                        setEditForm(prev => ({
                          ...prev,
                          commissionPercentage,
                          netAmount: calculateNetAmount(prev.totalRevenue, prev.totalExpenses, commissionPercentage)
                        }));
                      }}
                      className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-right text-gray-600"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-right text-gray-700 mb-2">المرفقات</label>
                    <div className="flex gap-3">
                      <button 
                        type="button"
                        onClick={handleFileButtonClick}
                        disabled={isUploadingFile}
                        className="bg-teal-800 text-white rounded-lg px-4 min-w-[110px] hover:bg-teal-900 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploadingFile ? 'جاري الرفع...' : 'اختيار ملف'}
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="application/pdf,image/*"
                        disabled={isUploadingFile}
                      />
                      <input
                        type="text"
                        placeholder={isUploadingFile ? 'جاري رفع الملف...' : uploadedFilePath ? 'تم رفع الملف بنجاح' : 'ارفاق ملف'}
                        value={selectedFileName || (uploadedFilePath ? 'تم رفع الملف' : '')}
                        disabled
                        className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-3 text-right text-gray-600"
                      />
                    </div>
                    {uploadedFilePath && (
                      <div className="mt-2">
                        <a 
                          href={uploadedFilePath} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-teal-800 hover:underline text-sm"
                        >
                          عرض الملف المرفق
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  {/* <div className="flex flex-col">
                    <label className="text-right text-gray-700 mb-2">حالة العقد</label>
                    <input
                      type="text"
                      value={editForm.contractStatus}
                      onChange={(e) => setEditForm({ ...editForm, contractStatus: e.target.value })}
                      className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-right text-gray-600"
                    />
                  </div> */}
                  {/* <div className="flex flex-col">
                    <label className="text-right text-gray-700 mb-2">ملاحظات</label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      rows={3}
                      className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-right text-gray-600"
                    />
                  </div> */}
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={handleSaveEdit}
                  className="bg-teal-800 text-white rounded-lg px-10 py-2 text-lg hover:bg-teal-900 transition"
                >
                  حفظ
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="bg-gray-200 text-gray-700 rounded-lg px-10 py-2 text-lg hover:bg-gray-300 transition"
                >
                  الغاء
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
