import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from 'example/containers/Layout';
import Style from 'styles/Home.module.css';
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import Head from 'next/head';
import { jwtDecode } from 'jwt-decode';

interface SettlementData {
  id: number;
  clientName: string;
  contractNumber: string;
  contractValue: number;
  totalPaid: number;
  totalExpenses: number;
  netAmount: number;
  lastUpdated: string;
}

interface SettlementSummary {
  totalContracts: number;
  totalContractValue: number;
  totalPaid: number;
  totalExpenses: number;
  totalNet: number;
}

interface SettlementResponse {
  settlements: SettlementData[];
  summary: SettlementSummary;
}

export default function Settlement() {
  const router = useRouter();
  const [data, setData] = useState<SettlementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recruitment');
  const [tabCounts, setTabCounts] = useState({ recruitment: 0, rental: 0 });
  const [filters, setFilters] = useState({
    client: '',
    date: '',
    search: ''
  });
  const [userName, setUserName] = useState('');

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
    fetchSettlementData();
  }, [filters, activeTab]);

  useEffect(() => {
    fetchTabCounts();
  }, []);

  const fetchSettlementData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.client) queryParams.append('client', filters.client);
      if (filters.date) queryParams.append('date', filters.date);
      if (filters.search) queryParams.append('search', filters.search);
      if (activeTab) queryParams.append('contractType', activeTab);

      const response = await fetch(`/api/settlement?${queryParams}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching settlement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTabCounts = async () => {
    try {
      const [recruitmentResponse, rentalResponse] = await Promise.all([
        fetch(`/api/settlement?contractType=recruitment&limit=1`),
        fetch(`/api/settlement?contractType=rental&limit=1`)
      ]);
      
      const [recruitmentData, rentalData] = await Promise.all([
        recruitmentResponse.json(),
        rentalResponse.json()
      ]);
      
      setTabCounts({
        recruitment: recruitmentData.settlements?.length || 0,
        rental: rentalData.settlements?.length || 0
      });
    } catch (error) {
      console.error('Error fetching tab counts:', error);
    }
  };

  const handleSearch = () => {
    fetchSettlementData();
  };

  const handleReset = () => {
    setFilters({
      client: '',
      date: '',
      search: ''
    });
  };

  // Fetch filtered data for export
  const fetchFilteredDataExporting = async () => {
    const query = new URLSearchParams({
      perPage: "1000",
      ...(filters.client && { client: filters.client }),
      ...(filters.date && { date: filters.date }),
      ...(filters.search && { search: filters.search }),
      ...(activeTab && { contractType: activeTab }),
    }).toString();
    const res = await fetch(`/api/settlement?${query}`);
    
    if (!res.ok) throw new Error("Failed to fetch data");
    const data = await res.json();
    return data.settlements || [];
  };

  // Export to PDF
  const exportToPDF = async () => {
    let dataToExport = data?.settlements || [];
    
    if (filters.client || filters.date || filters.search) {
      dataToExport = await fetchFilteredDataExporting();
    }

    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // 🔷 تحميل شعار مرة واحدة (لكن نستخدمه في كل صفحة)
    const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
    const logoBuffer = await logo.arrayBuffer();
    const logoBytes = new Uint8Array(logoBuffer);
    const logoBase64 = Buffer.from(logoBytes).toString('base64');
    
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
      'تاريخ آخر تحديث',
      'الصافي',
      'المصروف',
      'المدفوع',
      'قيمة العقد',
      'رقم العقد',
      'العميل',
    ];

    const tableRows = dataToExport.map((row: SettlementData) => [
      row.lastUpdated || 'غير متوفر',
      row.netAmount?.toLocaleString() || '0',
      row.totalExpenses?.toLocaleString() || '0',
      row.totalPaid?.toLocaleString() || '0',
      row.contractValue?.toLocaleString() || '0',
      row.contractNumber || 'غير متوفر',
      row.clientName || 'غير متوفر',
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

        // 🔷 إضافة اللوجو أعلى الصفحة (في كل صفحة)
        doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

        // 🔹 كتابة العنوان في أول صفحة فقط (اختياري)
        if (doc.getCurrentPageInfo().pageNumber === 1) {
          doc.setFontSize(12);
          doc.setFont('Amiri', 'normal');
          doc.text('تسوية مالية', pageWidth / 2, 20, { align: 'right' });
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

    doc.save('settlement.pdf');
    
    // Log export action
    try {
      await fetch('/api/accounting-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportType: 'settlement',
          reportType: 'التسوية المالية',
          format: 'pdf',
          filters: { client: filters.client, date: filters.date, search: filters.search, contractType: activeTab },
          recordCount: dataToExport.length
        })
      });
    } catch (error) {
      console.error('Error logging export:', error);
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    let dataToExport = data?.settlements || [];
    
    if (filters.client || filters.date || filters.search) {
      dataToExport = await fetchFilteredDataExporting();
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('تسوية مالية', { properties: { defaultColWidth: 20 } });
    
    worksheet.columns = [
      { header: 'العميل', key: 'clientName', width: 20 },
      { header: 'رقم العقد', key: 'contractNumber', width: 15 },
      { header: 'قيمة العقد', key: 'contractValue', width: 15 },
      { header: 'المدفوع', key: 'totalPaid', width: 15 },
      { header: 'المصروف', key: 'totalExpenses', width: 15 },
      { header: 'الصافي', key: 'netAmount', width: 15 },
      { header: 'تاريخ آخر تحديث', key: 'lastUpdated', width: 15 },
    ];

    worksheet.getRow(1).font = { name: 'Amiri', size: 12 };
    worksheet.getRow(1).alignment = { horizontal: 'right' };

    dataToExport.forEach((row: SettlementData) => {
      worksheet.addRow({
        clientName: row.clientName || 'غير متوفر',
        contractNumber: row.contractNumber || 'غير متوفر',
        contractValue: row.contractValue || 0,
        totalPaid: row.totalPaid || 0,
        totalExpenses: row.totalExpenses || 0,
        netAmount: row.netAmount || 0,
        lastUpdated: row.lastUpdated || 'غير متوفر',
      }).alignment = { horizontal: 'right' };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settlement.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
    
    // Log export action
    try {
      await fetch('/api/accounting-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportType: 'settlement',
          reportType: 'التسوية المالية',
          format: 'excel',
          filters: { client: filters.client, date: filters.date, search: filters.search, contractType: activeTab },
          recordCount: dataToExport.length
        })
      });
    } catch (error) {
      console.error('Error logging export:', error);
    }
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <Layout>
      <Head>
        <title>تسوية مالية</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className={`min-h-screen bg-gray-50 ${Style['tajawal-regular']}`} dir="rtl">
        {/* Page Content */}
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-normal text-black text-right">تسوية مالية</h2>
            <div className="flex gap-4">
              <button
                className="flex items-center gap-1 bg-teal-900 text-white px-3 py-1 rounded text-sm hover:bg-teal-800 transition duration-200"
                onClick={exportToPDF}
              >
                <FilePdfOutlined />
                <span>PDF</span>
              </button>
              <button
                className="flex items-center gap-1 bg-teal-900 text-white px-3 py-1 rounded text-sm hover:bg-teal-800 transition duration-200"
                onClick={exportToExcel}
              >
                <FileExcelOutlined />
                <span>Excel</span>
              </button>
            </div>
          </div>
          
          {/* Summary Cards */}
          <section className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-4">
            <div className="flex gap-8 p-6 justify-center">
              <div className="bg-gray-100 rounded-lg p-5 text-center min-w-60 shadow-sm">
                <div className="text-base text-gray-700 mb-2">قيمة العقود الكلية</div>
                <div className="text-base font-normal text-gray-700 leading-8">
                  {data?.summary.totalContractValue.toLocaleString() || '0'}
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-5 text-center min-w-60 shadow-sm">
                <div className="text-base text-gray-700 mb-2">إجمالي المدفوعات</div>
                <div className="text-base font-normal text-gray-700 leading-8">
                  {data?.summary.totalPaid.toLocaleString() || '0'}
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-5 text-center min-w-60 shadow-sm">
                <div className="text-base text-gray-700 mb-2">إجمالي المصروفات</div>
                <div className="text-base font-normal text-gray-700 leading-8">
                  {data?.summary.totalExpenses.toLocaleString() || '0'}
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-5 text-center min-w-60 shadow-sm">
                <div className="text-base text-gray-700 mb-2">إجمالي الصافي</div>
                <div className="text-base font-normal text-gray-700 leading-8">
                  {data?.summary.totalNet.toLocaleString() || '0'}
                </div>
              </div>
            </div>
          </section>

          {/* Filters Section */}
          <section className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-4">
            <div className="flex gap-8 mb-6 justify-end">
              <button 
                onClick={handleReset}
                className="bg-teal-800 text-white border-none rounded px-8 py-3 text-base font-medium h-11"
              >
                إعادة ضبط
              </button>
              
              <div className="flex flex-col gap-2 min-w-56">
                <label className="text-md text-gray-500 text-right">التاريخ</label>
                <div className="relative">
                  <input 
                    type="date" 
                    className="w-full bg-gray-100 border border-gray-300 rounded px-4 py-2 text-base text-gray-500 text-right h-11"
                    value={filters.date}
                    onChange={(e) => setFilters({...filters, date: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2 min-w-56">
                <label className="text-md text-gray-500 text-right">العميل</label>
                <div className="relative">
                  <select 
                    className="w-full bg-gray-100 border border-gray-300 rounded px-4 py-2 text-base text-gray-500 text-right appearance-none h-11"
                    value={filters.client}
                    onChange={(e) => setFilters({...filters, client: e.target.value})}
                  >
                    <option value="">اختر العميل</option>
                    {data?.settlements.map(settlement => (
                      <option key={settlement.id} value={settlement.clientName}>
                        {settlement.clientName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 min-w-56">
                <label className="text-md text-gray-500 text-right">بحث</label>
                <div className="relative">
                  <input 
                    type="text" 
                    className="w-full bg-gray-100 border border-gray-300 rounded px-4 py-2 text-base text-gray-500 text-right pr-11 h-11"
                    placeholder="بحث"
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                  />
                  <svg 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
              </div>
            </div>
          </section>

          {/* Tab Navigation */}
          <section className="bg-white mb-4">
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
          </section>

          {/* Results Section */}
          <section className="bg-gray-50 border border-gray-300 rounded-lg shadow-sm">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr>
                    <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">#</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">العميل</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">رقم العقد</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">قيمة العقد</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">المدفوع</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">المصروف</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">الصافي</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">تاريخ آخر تحديث</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.settlements.map((settlement, index) => (
                    <tr key={settlement.id} className="hover:bg-gray-50">
                      <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">
                        #{index + 1}
                      </td>
                      <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">
                        {settlement.clientName}
                      </td>
                      <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">
                        <button
                          onClick={() => router.push(`/admin/settlement/${settlement.id}`)}
                          className="text-teal-800 hover:text-teal-600 underline"
                        >
                          {settlement.contractNumber}
                        </button>
                      </td>
                      <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">
                        {settlement.contractValue.toLocaleString()}
                      </td>
                      <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">
                        {settlement.totalPaid.toLocaleString()}
                      </td>
                      <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">
                        {settlement.totalExpenses.toLocaleString()}
                      </td>
                      <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">
                        {settlement.netAmount.toLocaleString()}
                      </td>
                      <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">
                        {settlement.lastUpdated}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="p-4 text-right text-md border-b border-gray-300 bg-gray-200 font-bold text-black">
                      الإجمالي
                    </td>
                    <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-200 font-bold">
                      {data?.summary.totalContractValue.toLocaleString() || '0'}
                    </td>
                    <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-200 font-bold">
                      {data?.summary.totalPaid.toLocaleString() || '0'}
                    </td>
                    <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-200 font-bold">
                      {data?.summary.totalExpenses.toLocaleString() || '0'}
                    </td>
                    <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-200 font-bold">
                      {data?.summary.totalNet.toLocaleString() || '0'}
                    </td>
                    <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-200 font-bold">
                      -
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
