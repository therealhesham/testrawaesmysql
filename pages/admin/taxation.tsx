import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AddSalesModal from '../../components/AddSalesModal';
import AddPurchasesModal from '../../components/AddPurchasesModal';
import EditSalesModal from '../../components/EditSalesModal';
import EditPurchasesModal from '../../components/EditPurchasesModal';
import AddSupplierModal from '../../components/AddSupplierModal';
import Layout from 'example/containers/Layout';
import { PencilAltIcon } from '@heroicons/react/solid';
import { DocumentDownloadIcon, TableIcon, CogIcon } from '@heroicons/react/outline';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { jwtDecode } from 'jwt-decode';

// Helper component for SVG icons to keep the main component clean
const Icon = ({ path, className = "w-6 h-6" }: { path: string; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d={path} />
  </svg>
);

const TaxReportPage = () => {
  const [activeTab, setActiveTab] = useState('vat');
  const [isAddSalesModalOpen, setIsAddSalesModalOpen] = useState(false);
  const [isAddPurchasesModalOpen, setIsAddPurchasesModalOpen] = useState(false);
  const [isEditSalesModalOpen, setIsEditSalesModalOpen] = useState(false);
  const [isEditPurchasesModalOpen, setIsEditPurchasesModalOpen] = useState(false);
  const [selectedSalesRecord, setSelectedSalesRecord] = useState<any | null>(null);
  const [selectedPurchaseRecord, setSelectedPurchaseRecord] = useState<any | null>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [purchasesData, setPurchasesData] = useState<any[]>([]);
  const [vatSummaryData, setVatSummaryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasesLoading, setIsPurchasesLoading] = useState(false);
  const [isVatLoading, setIsVatLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userName, setUserName] = useState('');
  const [counts, setCounts] = useState({ sales: 0, purchases: 0, vat: 3 });
  const [suppliers, setSuppliers] = useState<{ id: number; name: string; displayOrder: number; createdAt?: string }[]>([]);
  const [isSuppliersLoading, setIsSuppliersLoading] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);

  // Fetch sales data
  const fetchSalesData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);
      
      const response = await fetch(`/api/tax-sales?${params.toString()}`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.sales)) {
        setSalesData(data.sales);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch purchases data
  const fetchPurchasesData = async () => {
    setIsPurchasesLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);
      
      const response = await fetch(`/api/tax-purchases?${params.toString()}`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.purchases)) {
        setPurchasesData(data.purchases);
      }
    } catch (error) {
      console.error('Error fetching purchases data:', error);
    } finally {
      setIsPurchasesLoading(false);
    }
  };

  // Fetch VAT summary data
  const fetchVATSummary = async () => {
    setIsVatLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);
      
      const response = await fetch(`/api/tax/vat-summary?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        if (data.vat && data.vat.rows) {
          const salesVat = data.sales?.total?.vat || '0.00';
          const purchasesVat = data.purchases?.total?.vat || '0.00';
          
          data.vat.rows = [
            {
              description: 'ضريبة القيمة المضافة على المبيعات',
              amount: '-',
              adjustment: '-',
              vat: salesVat,
            },
            {
              description: 'ضريبة القيمة المضافة على المشتريات',
              amount: '-',
              adjustment: '-',
              vat: purchasesVat,
            },
            ...data.vat.rows
          ];
        }
        setVatSummaryData(data);
      }
    } catch (error) {
      console.error('Error fetching VAT summary:', error);
    } finally {
      setIsVatLoading(false);
    }
  };

  // Fetch counts for tabs
  const fetchCounts = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);
      
      const response = await fetch(`/api/tax/counts?${params.toString()}`);
      const data = await response.json();
      
      if (data.success && data.counts) {
        setCounts(data.counts);
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  // Fetch filtered data for export
  const fetchFilteredSalesDataExporting = async () => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('from', dateFrom);
    if (dateTo) params.append('to', dateTo);
    if (searchTerm) params.append('search', searchTerm);
    
    const response = await fetch(`/api/tax-sales?${params.toString()}`);
    const data = await response.json();
    
    if (data.success && Array.isArray(data.sales)) {
      return data.sales;
    }
    return [];
  };

  const fetchFilteredPurchasesDataExporting = async () => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('from', dateFrom);
    if (dateTo) params.append('to', dateTo);
    if (searchTerm) params.append('search', searchTerm);
    
    const response = await fetch(`/api/tax-purchases?${params.toString()}`);
    const data = await response.json();
    
    if (data.success && Array.isArray(data.purchases)) {
      return data.purchases;
    }
    return [];
  };

  // Fetch counts on mount and when date filters change
  useEffect(() => {
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  const fetchSuppliers = async () => {
    setIsSuppliersLoading(true);
    try {
      const res = await fetch('/api/tax-suppliers');
      const data = await res.json();
      if (data.success && Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
    } catch (e) {
      console.error('Error fetching suppliers:', e);
    } finally {
      setIsSuppliersLoading(false);
    }
  };

  // Load data on mount and when tab changes
  useEffect(() => {
    if (activeTab === 'sales') {
      fetchSalesData();
    } else if (activeTab === 'purchases') {
      fetchPurchasesData();
    } else if (activeTab === 'vat') {
      fetchVATSummary();
    } else if (activeTab === 'suppliers') {
      fetchSuppliers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dateFrom, dateTo]);

  // Get user name from token
  useEffect(() => {
    const authToken = localStorage.getItem('token');
    const decoder = authToken ? jwtDecode(authToken) : null;
    setUserName((decoder as any)?.username || '');
  }, []);

  // Calculate summary from sales data
  const calculateSalesSummary = () => {
    const filtered = salesData.filter(sale => {
      const matchesSearch = !searchTerm || 
        sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customer?.fullname?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    const totalSalesBeforeTax = filtered.reduce((sum, sale) => {
      return sum + parseFloat(sale.salesBeforeTax?.toString() || '0');
    }, 0);

    const totalTaxValue = filtered.reduce((sum, sale) => {
      return sum + parseFloat(sale.taxValue?.toString() || '0');
    }, 0);

    const totalSalesIncludingTax = filtered.reduce((sum, sale) => {
      return sum + parseFloat(sale.salesIncludingTax?.toString() || '0');
    }, 0);

    const avgTaxRate = filtered.length > 0 
      ? filtered.reduce((sum, sale) => sum + parseFloat(sale.taxRate?.toString() || '0'), 0) / filtered.length
      : 0;

    return {
      salesBeforeTax: totalSalesBeforeTax.toFixed(2),
      taxRate: avgTaxRate.toFixed(2),
      taxValue: totalTaxValue.toFixed(2),
      salesIncludingTax: totalSalesIncludingTax.toFixed(2),
    };
  };

  const salesSummary = calculateSalesSummary();

  // Sales summary cards data
  const salesSummaryData = [
    { title: 'المبيعات قبل الضريبة', value: salesSummary.salesBeforeTax },
    { title: 'نسبة الضريبة', value: salesSummary.taxRate },
    { title: 'قيمة الضريبة', value: salesSummary.taxValue },
    { title: 'المبيعات شاملة الضريبة', value: salesSummary.salesIncludingTax },
  ];

  // Calculate purchases summary
  const calculatePurchasesSummary = () => {
    const filtered = purchasesData.filter(purchase => {
      const matchesSearch = !searchTerm || 
        purchase.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    const totalPurchasesBeforeTax = filtered.reduce((sum, purchase) => {
      return sum + parseFloat(purchase.purchasesBeforeTax?.toString() || '0');
    }, 0);

    const totalTaxValue = filtered.reduce((sum, purchase) => {
      return sum + parseFloat(purchase.taxValue?.toString() || '0');
    }, 0);

    const totalPurchasesIncludingTax = filtered.reduce((sum, purchase) => {
      return sum + parseFloat(purchase.purchasesIncludingTax?.toString() || '0');
    }, 0);

    const avgTaxRate = filtered.length > 0 
      ? filtered.reduce((sum, purchase) => sum + parseFloat(purchase.taxRate?.toString() || '0'), 0) / filtered.length
      : 0;

    return {
      purchasesBeforeTax: totalPurchasesBeforeTax.toFixed(2),
      taxRate: avgTaxRate.toFixed(2),
      taxValue: totalTaxValue.toFixed(2),
      purchasesIncludingTax: totalPurchasesIncludingTax.toFixed(2),
    };
  };

  const purchasesSummary = calculatePurchasesSummary();

  // Purchases summary cards data
  const purchasesSummaryData = [
    { title: 'المشتريات شاملة الضريبة', value: purchasesSummary.purchasesIncludingTax },
    { title: 'قيمة الضريبة', value: purchasesSummary.taxValue },
    { title: 'نسبة الضريبة', value: purchasesSummary.taxRate },
    { title: 'المشتريات قبل الضريبة', value: purchasesSummary.purchasesBeforeTax },
  ];


  
function getDate(date: any) {
  if (!date) return null;
  const currentDate = new Date(date);
  const formatted = currentDate.getDate() + '/' + (currentDate.getMonth() + 1) + '/' + currentDate.getFullYear();
  return formatted;
}
  // Format date for display
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'numeric', year: 'numeric' });
  };

  // Format number with commas
  const formatNumber = (num: number | string | null | undefined) => {
    if (!num && num !== 0) return '0.00';
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numValue)) return '0.00';
    return numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Export Sales to PDF
  const exportSalesToPDF = async () => {
    let dataToExport = filteredSalesData;
    // If filters are applied, fetch filtered data from API
    if (dateFrom || dateTo || searchTerm) {
      dataToExport = await fetchFilteredSalesDataExporting();
    }
    
    // Calculate summary from exported data
    const exportSummary = {
      salesBeforeTax: dataToExport.reduce((sum, sale) => sum + parseFloat(sale.salesBeforeTax?.toString() || '0'), 0).toFixed(2),
      taxRate: dataToExport.length > 0 
        ? (dataToExport.reduce((sum, sale) => sum + parseFloat(sale.taxRate?.toString() || '0'), 0) / dataToExport.length).toFixed(2)
        : '0.00',
      taxValue: dataToExport.reduce((sum, sale) => sum + parseFloat(sale.taxValue?.toString() || '0'), 0).toFixed(2),
      salesIncludingTax: dataToExport.reduce((sum, sale) => sum + parseFloat(sale.salesIncludingTax?.toString() || '0'), 0).toFixed(2),
    };
    
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
    doc.setFontSize(16);
    doc.text('المبيعات', pageWidth / 2, 10, { align: 'right' });

    const tableColumn = [
      '#',
      'التاريخ',
      'اسم العميل',
      'المبيعات قبل الضريبة',
      'نسبة الضريبة',
      'قيمة الضريبة',
      'المبيعات شاملة الضريبة',
      'طريقة الدفع',
      'المرفقات',
      'الإجراءات',
    ];

    const tableRows = dataToExport.map((row, index) => [
      (index + 1).toString(),
      getDate(row.date),
      row.customer?.fullname || row.customerName || '-',
      formatNumber(row.salesBeforeTax),
      formatNumber(row.taxRate),
      formatNumber(row.taxValue),
      formatNumber(row.salesIncludingTax),
      row.paymentMethod || '-',
      row.attachment ? 'ملف PDF' : '-',
      '-',
    ]);

    // Add total row
    tableRows.push([
      '-',
      '-',
      'الاجمالي',
      formatNumber(exportSummary.salesBeforeTax),
      formatNumber(exportSummary.taxRate),
      formatNumber(exportSummary.taxValue),
      formatNumber(exportSummary.salesIncludingTax),
      '-',
      '-',
      '-',
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
      margin: { top: 40, right: 10, left: 10 },
      didDrawPage: (data: any) => {
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

        if (doc.getCurrentPageInfo().pageNumber === 1) {
          doc.setFontSize(12);
          doc.setFont('Amiri', 'normal');
          // doc.text('المبيعات', pageWidth / 2, 20, { align: 'right' });
        }

        doc.setFontSize(10);
        doc.setFont('Amiri', 'normal');

        doc.text(userName, 10, pageHeight - 10, { align: 'left' });

        const pageNumber = `صفحة ${doc.getCurrentPageInfo().pageNumber}`;
        doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });

        const dateText =
          'التاريخ: ' +
          new Date().toLocaleDateString('ar-EG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }) +
          '  الساعة: ' +
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

    doc.save('sales.pdf');
    
    // Log export action
    try {
      await fetch('/api/accounting-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportType: 'sales',
          reportType: 'الاقرارات الضريبية',
          format: 'pdf',
          filters: { dateFrom, dateTo, searchTerm },
          recordCount: dataToExport.length
        })
      });
    } catch (error) {
      console.error('Error logging export:', error);
    }
  };

  // Export Sales to Excel
  const exportSalesToExcel = async () => {
    let dataToExport = filteredSalesData;
    // If filters are applied, fetch filtered data from API
    if (dateFrom || dateTo || searchTerm) {
      dataToExport = await fetchFilteredSalesDataExporting();
    }
    
    // Calculate summary from exported data
    const exportSummary = {
      salesBeforeTax: dataToExport.reduce((sum, sale) => sum + parseFloat(sale.salesBeforeTax?.toString() || '0'), 0).toFixed(2),
      taxRate: dataToExport.length > 0 
        ? (dataToExport.reduce((sum, sale) => sum + parseFloat(sale.taxRate?.toString() || '0'), 0) / dataToExport.length).toFixed(2)
        : '0.00',
      taxValue: dataToExport.reduce((sum, sale) => sum + parseFloat(sale.taxValue?.toString() || '0'), 0).toFixed(2),
      salesIncludingTax: dataToExport.reduce((sum, sale) => sum + parseFloat(sale.salesIncludingTax?.toString() || '0'), 0).toFixed(2),
    };
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('المبيعات', { properties: { defaultColWidth: 20 } });

    worksheet.columns = [
      { header: '#', key: 'index', width: 10 },
      { header: 'التاريخ', key: 'date', width: 15 },
      { header: 'اسم العميل', key: 'customerName', width: 20 },
      { header: 'المبيعات قبل الضريبة', key: 'salesBeforeTax', width: 20 },
      { header: 'نسبة الضريبة', key: 'taxRate', width: 15 },
      { header: 'قيمة الضريبة', key: 'taxValue', width: 15 },
      { header: 'المبيعات شاملة الضريبة', key: 'salesIncludingTax', width: 20 },
      { header: 'طريقة الدفع', key: 'paymentMethod', width: 15 },
      { header: 'المرفقات', key: 'attachment', width: 15 },
    ];

    worksheet.getRow(1).font = { name: 'Amiri', size: 12 };
    worksheet.getRow(1).alignment = { horizontal: 'right' };

    dataToExport.forEach((row, index) => {
      worksheet.addRow({
        index: index + 1,
        date: getDate(row.date),
        customerName: row.customer?.fullname || row.customerName || 'غير متوفر',
        salesBeforeTax: formatNumber(row.salesBeforeTax),
        taxRate: formatNumber(row.taxRate),
        taxValue: formatNumber(row.taxValue),
        salesIncludingTax: formatNumber(row.salesIncludingTax),
        paymentMethod: row.paymentMethod || '-',
        attachment: row.attachment ? 'ملف PDF' : '-',
      }).alignment = { horizontal: 'right' };
    });

    // Add total row
    worksheet.addRow({
      index: '-',
      date: '-',
      customerName: 'الاجمالي',
      salesBeforeTax: formatNumber(exportSummary.salesBeforeTax),
      taxRate: formatNumber(exportSummary.taxRate),
      taxValue: formatNumber(exportSummary.taxValue),
      salesIncludingTax: formatNumber(exportSummary.salesIncludingTax),
      paymentMethod: '-',
      attachment: '-',
    }).alignment = { horizontal: 'right' };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export Purchases to PDF
  const exportPurchasesToPDF = async () => {
    let dataToExport = filteredPurchasesData;
    // If filters are applied, fetch filtered data from API
    if (dateFrom || dateTo || searchTerm) {
      dataToExport = await fetchFilteredPurchasesDataExporting();
    }
    
    // Calculate summary from exported data
    const exportSummary = {
      purchasesBeforeTax: dataToExport.reduce((sum, purchase) => sum + parseFloat(purchase.purchasesBeforeTax?.toString() || '0'), 0).toFixed(2),
      taxRate: dataToExport.length > 0 
        ? (dataToExport.reduce((sum, purchase) => sum + parseFloat(purchase.taxRate?.toString() || '0'), 0) / dataToExport.length).toFixed(2)
        : '0.00',
      taxValue: dataToExport.reduce((sum, purchase) => sum + parseFloat(purchase.taxValue?.toString() || '0'), 0).toFixed(2),
      purchasesIncludingTax: dataToExport.reduce((sum, purchase) => sum + parseFloat(purchase.purchasesIncludingTax?.toString() || '0'), 0).toFixed(2),
    };
    
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
    doc.setFontSize(16);
    doc.text('المشتريات', pageWidth / 2, 10, { align: 'right' });

    const tableColumn = [
      '#',
      'التاريخ',
      'الحالة',
      'رقم الفاتورة',
      'اسم المورد',
      'المشتريات قبل الضريبة',
      'نسبة الضريبة',
      'قيمة الضريبة',
      'المشتريات شاملة الضريبة',
      'نوع التوريد',
      'المرفقات',
      'الإجراءات',
    ];

    const tableRows = dataToExport.map((row, index) => [
      (index + 1).toString(),
      getDate(row.date),
      row.status || '-',
      row.invoiceNumber || '-',
      row.supplierName || '-',
      formatNumber(row.purchasesBeforeTax),
      formatNumber(row.taxRate),
      formatNumber(row.taxValue),
      formatNumber(row.purchasesIncludingTax),
      row.supplyType || '-',
      row.attachment ? 'ملف PDF' : '-',
      '-',
    ]);

    // Add total row
    tableRows.push([
      '-',
      '-',
      '-',
      '-',
      'الاجمالي',
      formatNumber(exportSummary.purchasesBeforeTax),
      formatNumber(exportSummary.taxRate),
      formatNumber(exportSummary.taxValue),
      formatNumber(exportSummary.purchasesIncludingTax),
      '-',
      '-',
      '-',
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
      margin: { top: 40, right: 10, left: 10 },
      didDrawPage: (data: any) => {
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

        if (doc.getCurrentPageInfo().pageNumber === 1) {
          doc.setFontSize(12);
          doc.setFont('Amiri', 'normal');
          // doc.text('المشتريات', pageWidth / 2, 20, { align: 'right' });
        }

        doc.setFontSize(10);
        doc.setFont('Amiri', 'normal');

        doc.text(userName, 10, pageHeight - 10, { align: 'left' });

        const pageNumber = `صفحة ${doc.getCurrentPageInfo().pageNumber}`;
        doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });

        const dateText =
          'التاريخ: ' +
          new Date().toLocaleDateString('ar-EG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }) +
          '  الساعة: ' +
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

    doc.save('purchases.pdf');
    
    // Log export action
    try {
      await fetch('/api/accounting-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportType: 'purchases',
          reportType: 'الاقرارات الضريبية',
          format: 'pdf',
          filters: { dateFrom, dateTo, searchTerm },
          recordCount: dataToExport.length
        })
      });
    } catch (error) {
      console.error('Error logging export:', error);
    }
  };

  // Export Purchases to Excel
  const exportPurchasesToExcel = async () => {
    let dataToExport = filteredPurchasesData;
    // If filters are applied, fetch filtered data from API
    if (dateFrom || dateTo || searchTerm) {
      dataToExport = await fetchFilteredPurchasesDataExporting();
    }
    
    // Calculate summary from exported data
    const exportSummary = {
      purchasesBeforeTax: dataToExport.reduce((sum, purchase) => sum + parseFloat(purchase.purchasesBeforeTax?.toString() || '0'), 0).toFixed(2),
      taxRate: dataToExport.length > 0 
        ? (dataToExport.reduce((sum, purchase) => sum + parseFloat(purchase.taxRate?.toString() || '0'), 0) / dataToExport.length).toFixed(2)
        : '0.00',
      taxValue: dataToExport.reduce((sum, purchase) => sum + parseFloat(purchase.taxValue?.toString() || '0'), 0).toFixed(2),
      purchasesIncludingTax: dataToExport.reduce((sum, purchase) => sum + parseFloat(purchase.purchasesIncludingTax?.toString() || '0'), 0).toFixed(2),
    };
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('المشتريات', { properties: { defaultColWidth: 20 } });

    worksheet.columns = [
      { header: '#', key: 'index', width: 10 },
      { header: 'التاريخ', key: 'date', width: 15 },
      { header: 'الحالة', key: 'status', width: 15 },
      { header: 'رقم الفاتورة', key: 'invoiceNumber', width: 15 },
      { header: 'اسم المورد', key: 'supplierName', width: 20 },
      { header: 'المشتريات قبل الضريبة', key: 'purchasesBeforeTax', width: 20 },
      { header: 'نسبة الضريبة', key: 'taxRate', width: 15 },
      { header: 'قيمة الضريبة', key: 'taxValue', width: 15 },
      { header: 'المشتريات شاملة الضريبة', key: 'purchasesIncludingTax', width: 20 },
      { header: 'نوع التوريد', key: 'supplyType', width: 15 },
      { header: 'المرفقات', key: 'attachment', width: 15 },
    ];

    worksheet.getRow(1).font = { name: 'Amiri', size: 12 };
    worksheet.getRow(1).alignment = { horizontal: 'right' };

    dataToExport.forEach((row, index) => {
      worksheet.addRow({
        index: index + 1,
        date: formatDate(row.date),
        status: row.status || 'غير محدد',
        invoiceNumber: row.invoiceNumber || '-',
        supplierName: row.supplierName || 'غير متوفر',
        purchasesBeforeTax: formatNumber(row.purchasesBeforeTax),
        taxRate: formatNumber(row.taxRate),
        taxValue: formatNumber(row.taxValue),
        purchasesIncludingTax: formatNumber(row.purchasesIncludingTax),
        supplyType: row.supplyType || '-',
        attachment: row.attachment ? 'ملف PDF' : '-',
      }).alignment = { horizontal: 'right' };
    });

    // Add total row
    worksheet.addRow({
      index: '-',
      date: '-',
      status: '-',
      invoiceNumber: '-',
      supplierName: 'الاجمالي',
      purchasesBeforeTax: formatNumber(exportSummary.purchasesBeforeTax),
      taxRate: formatNumber(exportSummary.taxRate),
      taxValue: formatNumber(exportSummary.taxValue),
      purchasesIncludingTax: formatNumber(exportSummary.purchasesIncludingTax),
      supplyType: '-',
      attachment: '-',
    }).alignment = { horizontal: 'right' };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'purchases.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
    
    // Log export action
    try {
      await fetch('/api/accounting-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportType: 'purchases',
          reportType: 'الاقرارات الضريبية',
          format: 'excel',
          filters: { dateFrom, dateTo, searchTerm },
          recordCount: dataToExport.length
        })
      });
    } catch (error) {
      console.error('Error logging export:', error);
    }
  };

  // Export VAT Summary to PDF
  const exportVATToPDF = async () => {
    if (!vatSummaryData) return;
    
    const doc = new jsPDF({ orientation: 'portrait' });
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
    doc.setFontSize(16);
    // doc.text('الاقرار الضريبي - الضريبة المضافة', pageWidth / 2, 20, { align: 'right' });

    const tableColumn = [
      'التفاصيل',
      'المبلغ (بالريال)',
      'مبلغ التعديل (بالريال)',
      'مبلغ ضريبة القيمة المضافة (بالريال)',
    ];

    const tableRows: any[] = [];
    
    // Sales section
    if (vatSummaryData.sales?.rows) {
      vatSummaryData.sales.rows.forEach((row: any) => {
        tableRows.push([
          `المبيعات - ${row.description}`,
          row.amount,
          row.adjustment,
          row.vat,
        ]);
      });
      if (vatSummaryData.sales.total) {
        tableRows.push([
          `المبيعات - ${vatSummaryData.sales.total.description || 'الاجمالي'}`,
          vatSummaryData.sales.total.amount,
          vatSummaryData.sales.total.adjustment,
          vatSummaryData.sales.total.vat,
        ]);
      }
    }

    // Purchases section
    if (vatSummaryData.purchases?.rows) {
      vatSummaryData.purchases.rows.forEach((row: any) => {
        tableRows.push([
          `المشتريات - ${row.description}`,
          row.amount,
          row.adjustment,
          row.vat,
        ]);
      });
      if (vatSummaryData.purchases.total) {
        tableRows.push([
          `المشتريات - ${vatSummaryData.purchases.total.description || 'الاجمالي'}`,
          vatSummaryData.purchases.total.amount,
          vatSummaryData.purchases.total.adjustment,
          vatSummaryData.purchases.total.vat,
        ]);
      }
    }

    // VAT section
    if (vatSummaryData.vat?.rows) {
      vatSummaryData.vat.rows.forEach((row: any) => {
        tableRows.push([
          `الضريبة المضافة - ${row.description}`,
          row.amount,
          row.adjustment,
          row.vat,
        ]);
      });
      if (vatSummaryData.vat.total) {
        tableRows.push([
          `الضريبة المضافة - ${vatSummaryData.vat.total.description || 'الاجمالي'}`,
          vatSummaryData.vat.total.amount,
          vatSummaryData.vat.total.adjustment,
          vatSummaryData.vat.total.vat,
        ]);
      }
    }

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
      margin: { top: 40, right: 10, left: 10 },
      didDrawPage: (data: any) => {
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

        if (doc.getCurrentPageInfo().pageNumber === 1) {
          doc.setFontSize(12);
          doc.setFont('Amiri', 'normal');
          doc.text('الاقرار الضريبي - الضريبة المضافة', pageWidth / 2, 20, { align: 'right' });
        }

        doc.setFontSize(10);
        doc.setFont('Amiri', 'normal');

        doc.text(userName, 10, pageHeight - 10, { align: 'left' });

        const pageNumber = `صفحة ${doc.getCurrentPageInfo().pageNumber}`;
        doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });

        const dateText =
          'التاريخ: ' +
          new Date().toLocaleDateString('ar-EG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }) +
          '  الساعة: ' +
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

    doc.save('vat_summary.pdf');
    
    // Log export action
    try {
      await fetch('/api/accounting-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportType: 'vat_summary',
          reportType: 'الاقرارات الضريبية',
          format: 'pdf',
          filters: { dateFrom, dateTo }
        })
      });
    } catch (error) {
      console.error('Error logging export:', error);
    }
  };

  // Export VAT Summary to Excel
  const exportVATToExcel = async () => {
    if (!vatSummaryData) return;
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('الضريبة المضافة', { properties: { defaultColWidth: 30 } });

    worksheet.columns = [
      { header: 'التفاصيل', key: 'description', width: 40 },
      { header: 'المبلغ (بالريال)', key: 'amount', width: 20 },
      { header: 'مبلغ التعديل (بالريال)', key: 'adjustment', width: 20 },
      { header: 'مبلغ ضريبة القيمة المضافة (بالريال)', key: 'vat', width: 25 },
    ];

    worksheet.getRow(1).font = { name: 'Amiri', size: 12, bold: true };
    worksheet.getRow(1).alignment = { horizontal: 'right' };

    // Sales section
    if (vatSummaryData.sales?.rows) {
      vatSummaryData.sales.rows.forEach((row: any) => {
        worksheet.addRow({
          description: `المبيعات - ${row.description}`,
          amount: formatNumber(row.amount),
          adjustment: formatNumber(row.adjustment),
          vat: formatNumber(row.vat),
        }).alignment = { horizontal: 'right' };
      });
      if (vatSummaryData.sales.total) {
        worksheet.addRow({
          description: `المبيعات - ${vatSummaryData.sales.total.description || 'الاجمالي'}`,
          amount: formatNumber(vatSummaryData.sales.total.amount),
          adjustment: formatNumber(vatSummaryData.sales.total.adjustment),
          vat: formatNumber(vatSummaryData.sales.total.vat),
        }).alignment = { horizontal: 'right' };
        worksheet.lastRow!.font = { bold: true };
      }
    }

    // Purchases section
    if (vatSummaryData.purchases?.rows) {
      vatSummaryData.purchases.rows.forEach((row: any) => {
        worksheet.addRow({
          description: `المشتريات - ${row.description}`,
          amount: formatNumber(row.amount),
          adjustment: formatNumber(row.adjustment),
          vat: formatNumber(row.vat),
        }).alignment = { horizontal: 'right' };
      });
      if (vatSummaryData.purchases.total) {
        worksheet.addRow({
          description: `المشتريات - ${vatSummaryData.purchases.total.description || 'الاجمالي'}`,
          amount: formatNumber(vatSummaryData.purchases.total.amount),
          adjustment: formatNumber(vatSummaryData.purchases.total.adjustment),
          vat: formatNumber(vatSummaryData.purchases.total.vat),
        }).alignment = { horizontal: 'right' };
        worksheet.lastRow!.font = { bold: true };
      }
    }

    // VAT section
    if (vatSummaryData.vat?.rows) {
      vatSummaryData.vat.rows.forEach((row: any) => {
        worksheet.addRow({
          description: `الضريبة المضافة - ${row.description}`,
          amount: formatNumber(row.amount),
          adjustment: formatNumber(row.adjustment),
          vat: formatNumber(row.vat),
        }).alignment = { horizontal: 'right' };
      });
      if (vatSummaryData.vat.total) {
        worksheet.addRow({
          description: `الضريبة المضافة - ${vatSummaryData.vat.total.description || 'الاجمالي'}`,
          amount: formatNumber(vatSummaryData.vat.total.amount),
          adjustment: formatNumber(vatSummaryData.vat.total.adjustment),
          vat: formatNumber(vatSummaryData.vat.total.vat),
        }).alignment = { horizontal: 'right' };
        worksheet.lastRow!.font = { bold: true };
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vat_summary.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
    
    // Log export action
    try {
      await fetch('/api/accounting-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportType: 'vat_summary',
          reportType: 'الاقرارات الضريبية',
          format: 'excel',
          filters: { dateFrom, dateTo }
        })
      });
    } catch (error) {
      console.error('Error logging export:', error);
    }
  };

  // Data for the summary cards (default/VAT view)
  const defaultSummaryData = vatSummaryData?.summary ? [
    { title: 'المبيعات الخاضعة للضريبة', value: formatNumber(vatSummaryData.summary.taxableSales) },
    { title: 'المبيعات الخاضعة للصفر', value: formatNumber(vatSummaryData.summary.zeroRateSales) },
    { title: 'التعديلات', value: formatNumber(vatSummaryData.summary.adjustments) },
    { title: 'قيمة الضريبة', value: formatNumber(vatSummaryData.summary.taxValue) },
  ] : [
    { title: 'المبيعات الخاضعة للضريبة', value: '0.00' },
    { title: 'المبيعات الخاضعة للصفر', value: '0.00' },
    { title: 'التعديلات', value: '0.00' },
    { title: 'قيمة الضريبة', value: '0.00' },
  ];

  // Filter sales data based on search
  const filteredSalesData = salesData.filter(sale => {
    const matchesSearch = !searchTerm || 
      sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer?.fullname?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Filter purchases data based on search
  const filteredPurchasesData = purchasesData.filter(purchase => {
    const matchesSearch = !searchTerm || 
      purchase.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  
  // Data for the main table, structured for easy rendering - now dynamic
  const tableData = vatSummaryData ? {
    sales: vatSummaryData.sales,
    purchases: vatSummaryData.purchases,
    vat: vatSummaryData.vat,
  } : {
    sales: {
      title: 'المبيعات',
      rows: [
        { description: 'المبيعات الخاضعة للنسبة الاساسية (15%)', amount: '0.00', adjustment: '0.00', vat: '0.00' },
        { description: 'المبيعات لصالح المواطنين(خدمات صحية خاصة،التعليم الاهلي الخاص، المسكن الاول)', amount: '-', adjustment: '-', vat: '-' },
        { description: 'المبيعات الداخلية الخاضعة لنسبة صفر بالمائة', amount: '0.00', adjustment: '0.00', vat: '0.00' },
        { description: 'الصادرات الخاضعة لنسبة صفر بالمائة', amount: '-', adjustment: '-', vat: '-' },
        { description: 'المبيعات الملغاة', amount: '0.00', adjustment: '0.00', vat: '0.00' },
      ],
      total: { amount: '0.00', adjustment: '0.00', vat: '0.00' }
    },
    purchases: {
      title: 'المشتريات',
      rows: [
        { description: 'المشتريات الداخلية الخاضعة للنسبة الاساسية(15%)', amount: '0.00', adjustment: '0.00', vat: '0.00' },
        { description: 'التوريدات الخاضعة للضريبة القيمة المضافة المسددة للجمارك', amount: '0.00', adjustment: '0.00', vat: '0.00' },
        { description: 'عمليات الاستيراد الخاضعة لضريبة القيمة المضافة والمستحقة للضريبة وفقا لالية الاحتساب العكسي', amount: '0.00', adjustment: '0.00', vat: '0.00' },
        { description: 'المشتريات الخاضعة لنسبة صفر بالمائة', amount: '0.00', adjustment: '0.00', vat: '0.00' },
        { description: 'المبيعات المعفاة', amount: '0.00', adjustment: '0.00', vat: '0.00' },
      ],
      total: { amount: '0.00', adjustment: '0.00', vat: '0.00' }
    },
    vat: {
      title: 'الضريبة المضافة',
      rows: [
        { description: 'ضريبة القيمة المضافة على المبيعات', amount: '-', adjustment: '-', vat: '0.00' },
        { description: 'ضريبة القيمة المضافة على المشتريات', amount: '-', adjustment: '-', vat: '0.00' },
        { description: 'ضريبة القيمة المضافة الاجمالية للفترة الضريبية المستحقة', amount: '0.00', adjustment: '0.00', vat: '0.00' },
        { description: 'تصحيحات الفترة السابقة (حوالي +-5000 ريال)', amount: '-', adjustment: '-', vat: '-' },
        { description: 'ضريبة القيمة المضافة التي تم ترحيلها من الفترة \ الفترات السابقة', amount: '-', adjustment: '-', vat: '-' },
      ],
      total: { description: 'ضريبة القيمة المضافة المستحقة (المطلوب اصلاحها)', amount: '0.00', adjustment: '0.00', vat: '0.00' }
    }
  };


  return (
    <Layout>
     
      {/* Main content container */}
      <main dir="rtl" className="bg-[#F2F3F5] p-8 font-['Tajawal'] text-[#1A4D4F]">
        <div className="max-w-6xl mx-auto">
          <header className="mb-11">
            <h1 className="text-3xl text-black font-normal">الاقرار الضريبي</h1>
          </header>

          <div className="bg-white border border-gray-200 rounded-md p-5">
            
            {/* ## Summary Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-5 justify-items-center">
              {(activeTab === 'sales' ? salesSummaryData : activeTab === 'purchases' ? purchasesSummaryData : defaultSummaryData).map((card, index) => (
                <div key={index} className="bg-[#F7F8FA] rounded-xl shadow-md p-5 w-full max-w-xs h-[100px] flex flex-col justify-center items-center text-center">
                  <h3 className="text-base text-gray-800 mb-2 leading-tight">{card.title}</h3>
                  <p className="text-lg text-gray-800 font-normal">{card.value}</p>
                </div>
              ))}
            </section>

            {/* ## Tab Navigation */}
            <nav className="flex justify-center items-end gap-9 mb-5 border-b border-gray-200 pb-4">
              <button onClick={() => setActiveTab('vat')} className={`flex items-center gap-2 py-1 px-2 text-sm ${activeTab === 'vat' ? 'border-b-2 border-gray-800 text-gray-800 font-bold' : 'text-gray-500'}`}>
                <span className="flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-gray-200 text-xs font-medium text-gray-700">{counts.vat}</span>
                <span>الضريبة المضافة</span>
              </button>
              <button onClick={() => setActiveTab('sales')} className={`flex items-center gap-2 py-1 px-2 text-sm ${activeTab === 'sales' ? 'border-b-2 border-gray-800 text-gray-800 font-bold' : 'text-gray-500'}`}>
                <span className="flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-gray-200 text-xs font-medium text-gray-700">{counts.sales || salesData.length}</span>
                <span>المبيعات</span>
              </button>
              <button onClick={() => setActiveTab('purchases')} className={`flex items-center gap-2 py-1 px-2 text-sm ${activeTab === 'purchases' ? 'border-b-2 border-gray-800 text-gray-800 font-bold' : 'text-gray-500'}`}>
                <span className="flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-gray-200 text-xs font-medium text-gray-700">{counts.purchases || purchasesData.length}</span>
                <span>المشتريات</span>
              </button>
              <button onClick={() => setActiveTab('suppliers')} className={`flex items-center gap-2 py-1 px-2 text-sm ${activeTab === 'suppliers' ? 'border-b-2 border-gray-800 text-gray-800 font-bold' : 'text-gray-500'}`}>
                <span className="flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-gray-200 text-xs font-medium text-gray-700">{suppliers.length}</span>
                <span>الموردين</span>
              </button>
            </nav>
            
            {/* ## Filters & Actions Section */}
            <section className="mb-5 px-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-wrap items-end gap-4 flex-grow">
                  {/* Search & Date Filters */}
                  <div className="flex flex-wrap items-end gap-4 flex-grow">
                    <div className="flex-grow">
                      <label className="text-xs text-gray-800 block mb-2">بحث</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="بحث" 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="bg-[#F7F8FA] border border-gray-200 rounded-md w-full h-9 p-2 pr-10 text-sm" 
                        />
                         {/* <span className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
                           <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-4 h-4" />
                         </span> */}
                      </div>
                    </div>
                     <div className="flex-grow">
                      <label className="text-xs text-gray-800 block mb-2">من</label>
                      <input 
                        type="date" 
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="bg-[#F7F8FA] border border-gray-200 rounded-md w-full h-9 p-2 text-sm text-gray-500" 
                      />
                    </div>
                    <div className="flex-grow">
                      <label className="text-xs text-gray-800 block mb-2">الى</label>
                      <input 
                        type="date" 
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="bg-[#F7F8FA] border border-gray-200 rounded-md w-full h-9 p-2 text-sm text-gray-500" 
                      />
                    </div>
                  </div>
                  {/* Reset & Column Filter */}
                  <div className="flex items-end gap-4">
                     <select className="bg-[#F7F8FA] border border-gray-200 rounded-md h-9  text-sm text-gray-500 w-48">
                       <option>كل الاعمدة</option>
                     </select>
                     <button 
                       onClick={() => {
                         setSearchTerm('');
                         setDateFrom('');
                         setDateTo('');
                       }}
                       className="bg-[#1A4D4F] text-white rounded-md text-xs px-3 h-8"
                     >
                       اعادة ضبط
                     </button>
                  </div>
                </div>
                {/* Add Sales/Purchases Button */}
                {activeTab === 'sales' && (
                  <button 
                    onClick={() => setIsAddSalesModalOpen(true)}
                    className="bg-teal-800 hover:bg-teal-700 text-white rounded-md text-sm px-4 py-2 flex items-center gap-2 h-9 transition-colors"
                  >
                    <Icon path="M12 4.5v15m7.5-7.5h-15" className="w-4 h-4" />
                    <span>اضافة مبيعات</span>
                  </button>
                )}
                {activeTab === 'purchases' && (
                  <button 
                    onClick={() => setIsAddPurchasesModalOpen(true)}
                    className="bg-teal-800 hover:bg-teal-700 text-white rounded-md text-sm px-4 py-2 flex items-center gap-2 h-9 transition-colors"
                  >
                    <Icon path="M12 4.5v15m7.5-7.5h-15" className="w-4 h-4" />
                    <span>اضافة مشتريات</span>
                  </button>
                )}
              </div>
               {/* Export Buttons */}
              <div className="flex gap-2 mt-5">
                {activeTab === 'sales' && (
                  <>
                    <button 
                      onClick={exportSalesToExcel}
                      className="bg-[#1A4D4F] text-white rounded-sm text-[10px] px-2.5 py-1 flex items-center gap-1 h-6 hover:bg-[#1a4d4fcc] transition-colors cursor-pointer"
                    >
                      <TableIcon className="w-3 h-3"/>
                      <span>Excel</span>
                    </button>
                    <button 
                      onClick={exportSalesToPDF}
                      className="bg-[#1A4D4F] text-white rounded-sm text-[10px] px-2.5 py-1 flex items-center gap-1 h-6 hover:bg-[#1a4d4fcc] transition-colors cursor-pointer"
                    >
                      <DocumentDownloadIcon className="w-3 h-3"/>
                      <span>PDF</span>
                    </button>
                  </>
                )}
                {activeTab === 'purchases' && (
                  <>
                    <button 
                      onClick={exportPurchasesToExcel}
                      className="bg-[#1A4D4F] text-white rounded-sm text-[10px] px-2.5 py-1 flex items-center gap-1 h-6 hover:bg-[#1a4d4fcc] transition-colors cursor-pointer"
                    >
                      <TableIcon className="w-3 h-3"/>
                      <span>Excel</span>
                    </button>
                    <button 
                      onClick={exportPurchasesToPDF}
                      className="bg-[#1A4D4F] text-white rounded-sm text-[10px] px-2.5 py-1 flex items-center gap-1 h-6 hover:bg-[#1a4d4fcc] transition-colors cursor-pointer"
                    >
                      <DocumentDownloadIcon className="w-3 h-3"/>
                      <span>PDF</span>
                    </button>
                  </>
                )}
                {activeTab === 'vat' && (
                  <>
                    <button 
                      onClick={exportVATToExcel}
                      className="bg-[#1A4D4F] text-white rounded-sm text-[10px] px-2.5 py-1 flex items-center gap-1 h-6 hover:bg-[#1a4d4fcc] transition-colors cursor-pointer"
                    >
                      <TableIcon className="w-3 h-3"/>
                      <span>Excel</span>
                    </button>
                    <button 
                      onClick={exportVATToPDF}
                      className="bg-[#1A4D4F] text-white rounded-sm text-[10px] px-2.5 py-1 flex items-center gap-1 h-6 hover:bg-[#1a4d4fcc] transition-colors cursor-pointer"
                    >
                      <DocumentDownloadIcon className="w-3 h-3"/>
                      <span>PDF</span>
                    </button>
                  </>
                )}
              </div>
            </section>
            
            {/* ## Sales Table - Only show for sales tab */}
            {activeTab === 'sales' ? (
              <section className="overflow-x-auto">
                <table className="w-full min-w-[1000px] border-collapse text-base text-gray-800">
                  <thead className="bg-[#1A4D4F] text-white">
                    <tr>
                      <th className="font-normal p-4 text-center">#</th>
                      <th className="font-normal p-4 text-center">التاريخ</th>
                      <th className="font-normal p-4 text-center">اسم العميل</th>
                      <th className="font-normal p-4 text-center">المبيعات قبل الضريبة</th>
                      <th className="font-normal p-4 text-center">نسبة الضريبة</th>
                      <th className="font-normal p-4 text-center">قيمة الضريبة</th>
                      <th className="font-normal p-4 text-center">المبيعات شاملة الضريبة</th>
                      <th className="font-normal p-4 text-center">طريقة الدفع</th>
                      <th className="font-normal p-4 text-center">المرفقات</th>
                      <th className="font-normal p-4 text-center">اجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-gray-500">
                          جاري التحميل...
                        </td>
                      </tr>
                    ) : filteredSalesData.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-gray-500">
                          لا توجد بيانات
                        </td>
                      </tr>
                    ) : (
                      <>
                        {filteredSalesData.map((row, index) => (
                          <tr key={row.id || index} className="bg-white border border-gray-200">
                            <td className="p-4 text-center">{index + 1}</td>
                            <td className="p-4 text-center">{formatDate(row.date)}</td>
                            <td className="p-4 text-center">{row.customer?.fullname || row.customerName || '-'}</td>
                            <td className="p-4 text-center">{formatNumber(row.salesBeforeTax)}</td>
                            <td className="p-4 text-center">{formatNumber(row.taxRate)}</td>
                            <td className="p-4 text-center">{formatNumber(row.taxValue)}</td>
                            <td className="p-4 text-center">{formatNumber(row.salesIncludingTax)}</td>
                            <td className="p-4 text-center">{row.paymentMethod || '-'}</td>
                            <td className="p-4 text-center">{row.attachment ? 'ملف PDF' : '-'}</td>
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => {
                                  setSelectedSalesRecord(row);
                                  setIsEditSalesModalOpen(true);
                                }}
                                className="text-gray-600 hover:text-gray-800"
                                title="تعديل"
                              >
<PencilAltIcon  className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {/* Total Row */}
                        <tr className="bg-gray-100 border border-gray-200 font-bold">
                          <td colSpan={3} className="p-4 text-center">الاجمالي</td>
                          <td className="p-4 text-center">{formatNumber(salesSummary.salesBeforeTax)}</td>
                          <td className="p-4 text-center">{formatNumber(salesSummary.taxRate)}</td>
                          <td className="p-4 text-center">{formatNumber(salesSummary.taxValue)}</td>
                          <td className="p-4 text-center">{formatNumber(salesSummary.salesIncludingTax)}</td>
                          <td colSpan={3} className="p-4 text-center">-</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </section>
            ) : activeTab === 'purchases' ? (
              /* ## Purchases Table */
              <section className="overflow-x-auto">
                <table className="w-full min-w-[1200px] border-collapse text-base text-gray-800">
                  <thead className="bg-[#1A4D4F] text-white">
                    <tr>
                      <th className="font-normal p-4 text-center">#</th>
                      <th className="font-normal p-4 text-center">التاريخ</th>
                      <th className="font-normal p-4 text-center">الحالة</th>
                      <th className="font-normal p-4 text-center">رقم الفاتورة</th>
                      <th className="font-normal p-4 text-center">اسم المورد</th>
                      <th className="font-normal p-4 text-center">المشتريات قبل الضريبة</th>
                      <th className="font-normal p-4 text-center">نسبة الضريبة</th>
                      <th className="font-normal p-4 text-center">قيمة الضريبة</th>
                      <th className="font-normal p-4 text-center">المشتريات شاملة الضريبة</th>
                      <th className="font-normal p-4 text-center">نوع التوريد</th>
                      <th className="font-normal p-4 text-center">المرفقات</th>
                      <th className="font-normal p-4 text-center">اجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isPurchasesLoading ? (
                      <tr>
                        <td colSpan={12} className="p-8 text-center text-gray-500">
                          جاري التحميل...
                        </td>
                      </tr>
                    ) : filteredPurchasesData.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="p-8 text-center text-gray-500">
                          لا توجد بيانات
                        </td>
                      </tr>
                    ) : (
                      <>
                        {filteredPurchasesData.map((row, index) => (
                          <tr key={row.id || index} className="bg-white border border-gray-200">
                            <td className="p-4 text-center">{index + 1}</td>
                            <td className="p-4 text-center">{formatDate(row.date)}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-1 rounded text-xs ${
                                row.status === 'مدفوعة' || row.status === 'paid' 
                                  ? 'bg-teal-100 text-teal-700' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {row.status || 'غير محدد'}
                              </span>
                            </td>
                            <td className="p-4 text-center">{row.invoiceNumber || '-'}</td>
                            <td className="p-4 text-center">{row.supplierName || '-'}</td>
                            <td className="p-4 text-center">{formatNumber(row.purchasesBeforeTax)}</td>
                            <td className="p-4 text-center">{formatNumber(row.taxRate)}</td>
                            <td className="p-4 text-center">{formatNumber(row.taxValue)}</td>
                            <td className="p-4 text-center">{formatNumber(row.purchasesIncludingTax)}</td>
                            <td className="p-4 text-center">{row.supplyType || '-'}</td>
                            <td className="p-4 text-center">{row.attachment ? 'ملف PDF' : '-'}</td>
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => {
                                  setSelectedPurchaseRecord(row);
                                  setIsEditPurchasesModalOpen(true);
                                }}
                                className="text-gray-600 hover:text-gray-800"
                                title="تعديل"
                              >
<PencilAltIcon  className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {/* Total Row */}
                        <tr className="bg-gray-100 border border-gray-200 font-bold">
                          <td colSpan={5} className="p-4 text-center">الاجمالي</td>
                          <td className="p-4 text-center">{formatNumber(purchasesSummary.purchasesBeforeTax)}</td>
                          <td className="p-4 text-center">{formatNumber(purchasesSummary.taxRate)}</td>
                          <td className="p-4 text-center">{formatNumber(purchasesSummary.taxValue)}</td>
                          <td className="p-4 text-center">{formatNumber(purchasesSummary.purchasesIncludingTax)}</td>
                          <td colSpan={3} className="p-4 text-center">-</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </section>
            ) : activeTab === 'suppliers' ? (
              /* ## جدول الموردين */
              <section className="overflow-x-auto px-4">
                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    onClick={() => setShowAddSupplierModal(true)}
                    className="bg-teal-800 hover:bg-teal-700 text-white rounded-md text-sm px-4 py-2 flex items-center gap-2"
                    title="إضافة مورد"
                  >
                    <CogIcon className="w-5 h-5" />
                    <span>إضافة مورد</span>
                  </button>
                </div>
                <table className="w-full min-w-[400px] border-collapse text-base text-gray-800">
                  <thead className="bg-[#1A4D4F] text-white">
                    <tr>
                      <th className="font-normal p-4 text-center">#</th>
                      <th className="font-normal p-4 text-center">اسم المورد</th>
                      <th className="font-normal p-4 text-center">الترتيب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isSuppliersLoading ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-gray-500">جاري التحميل...</td>
                      </tr>
                    ) : suppliers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-gray-500">لا يوجد موردين. استخدم زر &quot;إضافة مورد&quot; لإضافة أول مورد.</td>
                      </tr>
                    ) : (
                      suppliers.map((s, i) => (
                        <tr key={s.id} className="bg-white border border-gray-200">
                          <td className="p-4 text-center">{i + 1}</td>
                          <td className="p-4 text-center">{s.name}</td>
                          <td className="p-4 text-center">{s.displayOrder}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </section>
            ) : (
              /* ## Tax Declaration Table - For VAT tab */
              <section className="overflow-x-auto">
                {isVatLoading ? (
                  <div className="p-8 text-center text-gray-500">
                    جاري التحميل...
                  </div>
                ) : (
                  <table className="w-full min-w-[800px] border-collapse text-base text-gray-800">
                    <thead className="bg-[#1A4D4F] text-white">
                      <tr>
                        <th className="font-normal p-4 text-center w-1/4">التفاصيل</th>
                        
                        <th className="font-normal p-4 text-center w-1/4">التفاصيل</th>
                        <th className="font-normal p-4 text-center w-1/4">المبلغ<br/>(بالريال)</th>
                        <th className="font-normal p-4 text-center w-1/4">مبلغ التعديل<br/>(بالريال)</th>
                        <th className="font-normal p-4 text-center  w-full">مبلغ ضريبة القيمة المضافة<br/>(بالريال)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(tableData).map((section, sectionIndex) => (
                        <React.Fragment key={sectionIndex}>
                          {/* Section Rows */}
                          {section.rows.map((row: any, rowIndex: number) => (
                            <tr key={rowIndex} className="bg-[#F7F8FA] border border-gray-200">
                              {rowIndex === 0 && (
                                <td 
                                  rowSpan={section.rows.length + 1} 
                                  className="bg-[#1A4D4F] text-white text-2xl font-normal p-4 border-l border-gray-200 align-middle text-center"
                                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                                >
                                  {section.title}
                                </td>
                              )}
                              <td className="p-4 text-center text-sm leading-tight">{row.description}</td>
                              <td className="p-4 text-center">{row.amount}</td>
                              <td className="p-4 text-center">{row.adjustment}</td>
                              <td className="p-4 text-center">{row.vat}</td>
                            </tr>
                          ))}
                           {/* Section Total Row */}
                          <tr className="bg-teal-50/50 border border-gray-200 font-bold">
                            <td className="p-3 text-center">
                              {'description' in section.total ? section.total.description : 'الاجمالي'}
                            </td>
                            <td className="p-3 text-center">{section.total.amount}</td>
                            <td className="p-3 text-center">{section.total.adjustment}</td>
                            <td className="p-3 text-center">{section.total.vat}</td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            )}
          </div>
        </div>

        {/* Add Sales Modal */}
        <AddSalesModal
          isOpen={isAddSalesModalOpen}
          onClose={() => setIsAddSalesModalOpen(false)}
          onSuccess={() => {
            // Refresh sales data and VAT summary after adding new record
            fetchSalesData();
            fetchCounts();
            if (activeTab === 'vat') {
              fetchVATSummary();
            }
          }}
        />

        {/* Add Purchases Modal */}
        <AddPurchasesModal
          isOpen={isAddPurchasesModalOpen}
          onClose={() => setIsAddPurchasesModalOpen(false)}
          onSuccess={() => {
            // Refresh purchases data and VAT summary after adding new record
            fetchPurchasesData();
            fetchCounts();
            if (activeTab === 'vat') {
              fetchVATSummary();
            }
          }}
        />

        {/* Edit Sales Modal */}
        <EditSalesModal
          isOpen={isEditSalesModalOpen}
          onClose={() => {
            setIsEditSalesModalOpen(false);
            setSelectedSalesRecord(null);
          }}
          onSuccess={() => {
            // Refresh sales data and VAT summary after editing
            fetchSalesData();
            fetchCounts();
            if (activeTab === 'vat') {
              fetchVATSummary();
            }
          }}
          salesRecord={selectedSalesRecord}
        />

        {/* Edit Purchases Modal */}
        <EditPurchasesModal
          isOpen={isEditPurchasesModalOpen}
          onClose={() => {
            setIsEditPurchasesModalOpen(false);
            setSelectedPurchaseRecord(null);
          }}
          onSuccess={() => {
            fetchPurchasesData();
            fetchCounts();
            if (activeTab === 'vat') {
              fetchVATSummary();
            }
          }}
          purchaseRecord={selectedPurchaseRecord}
        />

        {/* Add Supplier Modal (جدول الموردين) */}
        <AddSupplierModal
          isOpen={showAddSupplierModal}
          onClose={() => setShowAddSupplierModal(false)}
          onSuccess={() => {
            fetchSuppliers();
          }}
        />
      </main>
    </Layout>
  );
};

export default TaxReportPage;