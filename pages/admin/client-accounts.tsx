import React, { useState, useEffect } from 'react';
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
  officeName: string;
  totalRevenue: number;
  totalExpenses: number;
  netAmount: number;
  contractStatus: string;
  notes: string;
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

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
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
            row.contractNumber || 'غير متوفر',
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
            contractNumber: row.contractNumber || 'غير متوفر',
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

  const filteredStatements = statements.filter(statement => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      statement.client.fullname?.toLowerCase().includes(searchLower) ||
      statement.contractNumber?.toLowerCase().includes(searchLower) ||
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
          <button
            onClick={handleGenerateReport}
            className="bg-teal-800 text-white rounded text-md  min-w-[123px]"
          >
            كشف حساب
          </button>
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

          {/* Export and Search */}
          <div className="flex items-center gap-2 mb-4 px-4">
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
            <div className="flex-1 max-w-64">
              <input
                type="text"
                placeholder="بحث"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded  text-md text-gray-600"
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-gray-100 border border-gray-300 rounded overflow-hidden">
            {/* Table Header */}
            <div className="bg-teal-800 text-white flex items-center p-4 gap-9">
              <div className="flex-1 text-center text-md font-normal">#</div>
              <div className="flex-1 text-center text-md font-normal">التاريخ</div>
              <div className="flex-1 text-center text-md font-normal">اسم العميل</div>
              <div className="flex-1 text-center text-md font-normal">رقم العقد</div>
              <div className="flex-1 text-center text-md font-normal">اسم المكتب</div>
              <div className="flex-1 text-center text-md font-normal">الايرادات</div>
              <div className="flex-1 text-center text-md font-normal">المصروفات</div>
              <div className="flex-1 text-center text-md font-normal">الصافي</div>
              <div className="flex-1 text-center text-md font-normal">حالة العقد</div>
              <div className="flex-1 text-center text-md font-normal">ملاحظات</div>
              <div className="flex-1 text-center text-md font-normal">تفاصيل</div>
              <div className="flex-1 text-center text-md font-normal">اجراءات</div>
            </div>

            {/* Table Rows */}
            {loading ? (
              <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
            ) : filteredStatements.length === 0 ? (
              <div className="p-8 text-center text-gray-500">لا توجد بيانات</div>
            ) : (
              filteredStatements.map((statement, index) => (
                <div key={statement.id}>
                  <div
                    className="flex items-center p-4 gap-9 border-b border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                    onClick={() => toggleRowExpansion(statement.id)}
                  >
                    <div className="flex-1 text-center text-md text-gray-700">#{index + 1}</div>
                    <div className="flex-1 text-center text-md text-gray-700">
                      {formatDate(statement.createdAt)}
                    </div>
                    <div className="flex-1 text-center text-md text-gray-700">
                      <button onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/clientdetails?id=${statement.client.id}`);
                      }} className="text-teal-800 hover:underline">
                        {statement.client.fullname}
                      </button>
                    </div>
                    <div className="flex-1 text-center text-md text-gray-700">
                      {statement.contractNumber}
                    </div>
                    <div className="flex-1 text-center text-md text-gray-700">
                      {statement.officeName}
                    </div>
                    <div className="flex-1 text-center text-md text-gray-700">
                      {formatCurrency(statement.totalRevenue)}
                    </div>
                    <div className="flex-1 text-center text-md text-gray-700">
                      {formatCurrency(statement.totalExpenses)}
                    </div>
                    <div className="flex-1 text-center text-md text-gray-700">
                      {formatCurrency(statement.netAmount)}
                    </div>
                    <div className="flex-1 text-center text-md text-gray-700">
                      {translateContractStatus(statement.contractStatus)}
                    </div>
                    <div className="flex-1 text-center text-md text-gray-700">
                      {statement.notes || '-'}
                    </div>
                    <div className="flex-1 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/client-accounts/${statement.id}`);
                        }}
                        className="bg-teal-800 text-white px-3 py-1 rounded text-md"
                      >
                        تفاصيل
                      </button>
                    </div>
                    <div className="flex-1 text-center">
                      <button className="bg-teal-800 text-white px-3 py-1 rounded text-md">
                        اجراءات
                      </button>
                    </div>
                  </div>

                  {/* Expandable Details Row */}
                  {expandedRows.has(statement.id) && (
                    <div className="bg-gray-100 border border-gray-300 p-4">
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center gap-4 px-2">
                          <div className="flex-1 text-center text-md text-gray-700">التاريخ</div>
                          <div className="flex-1 text-center text-md text-gray-700">البيان</div>
                          <div className="flex-1 text-center text-md text-gray-700">مدين</div>
                          <div className="flex-1 text-center text-md text-gray-700">دائن</div>
                          <div className="flex-1 text-center text-md text-gray-700">الرصيد</div>
                        </div>
                        {statement.entries.map((entry, idx) => {
                          let description = entry.description;
                          if (idx === 0) {
                            description = 'Recruitment fees payment from the client';
                          }
                          return (
                            <div key={idx} className="flex justify-between items-center gap-4 px-2">
                              <div className="flex-1 text-center text-md text-gray-500">{formatDate(entry.date)}</div>
                              <div className="flex-1 text-center text-md text-gray-500">{description}</div>
                              <div className="flex-1 text-center text-md text-gray-500">{formatCurrency(entry.debit)}</div>
                              <div className="flex-1 text-center text-md text-gray-500">{formatCurrency(entry.credit)}</div>
                              <div className="flex-1 text-center text-md text-gray-500">{formatCurrency(entry.balance)}</div>
                            </div>
                          );
                        })}
                        {statement.entries.length === 0 && <div className="text-center text-gray-500">لا توجد إدخالات</div>}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Table Footer */}
            <div className="bg-gray-50 flex items-center p-4 gap-9 border-t border-gray-700">
              <div className="text-base font-normal text-gray-700 mr-auto">الاجمالي</div>
              <div className="flex-1 text-center text-md text-gray-700">
                {formatCurrency(summary.totalRevenue)}
              </div>
              <div className="flex-1 text-center text-md text-gray-700">
                {formatCurrency(summary.totalExpenses)}
              </div>
              <div className="flex-1 text-center text-md text-gray-700">
                {formatCurrency(summary.netAmount)}
              </div>
            </div>
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
      </div>
    </Layout>
  );
};

export default ClientAccountsPage;
