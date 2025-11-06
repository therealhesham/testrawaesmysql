import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AddSalesModal from '../../components/AddSalesModal';
import AddPurchasesModal from '../../components/AddPurchasesModal';
import EditSalesModal from '../../components/EditSalesModal';
import EditPurchasesModal from '../../components/EditPurchasesModal';
import Layout from 'example/containers/Layout';
import { PencilAltIcon } from '@heroicons/react/solid';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasesLoading, setIsPurchasesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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

  // Load data on mount and when tab changes
  useEffect(() => {
    if (activeTab === 'sales') {
      fetchSalesData();
    } else if (activeTab === 'purchases') {
      fetchPurchasesData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dateFrom, dateTo]);

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

  // Data for the summary cards (default/VAT view)
  const defaultSummaryData = [
    { title: 'المبيعات الخاضعة للضريبة', value: '20,000.00' },
    { title: 'المبيعات الخاضعة للصفر', value: '10,000.00' },
    { title: 'التعديلات', value: '1200.00' },
    { title: 'قيمة الضريبة', value: '11200.00' },
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

  // Format date for display
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'numeric', year: 'numeric' });
  };

  // Format number with commas
  const formatNumber = (num: number | string | null | undefined) => {
    if (!num) return '0.00';
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    return numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  
  // Data for the main table, structured for easy rendering
  const tableData = {
    sales: {
      title: 'المبيعات',
      rows: [
        { description: 'ضريبة المبيعات الخاضعة للنسبة الاساسية (15%)', amount: '10,566.00', adjustment: '8,000', vat: '1,361.00' },
        { description: 'المبيعات لصالح المواطنين(خدمات صحية خاصة،التعليم الاهلي الخاص، المسكن الاول)', amount: '-', adjustment: '-', vat: '-' },
        { description: 'المبيعات الداخلية الخاضعة لنسبة صفر بالمائة', amount: '-', adjustment: '-', vat: '-' },
        { description: 'الصادرات الخاضعة لنسبة صفر بالمائة', amount: '-', adjustment: '-', vat: '-' },
        { description: 'المبيعات الملغاة', amount: '700', adjustment: '200', vat: '1,000' },
      ],
      total: { amount: '10,566.00', adjustment: '8,000', vat: '1,361.00' }
    },
    purchases: {
      title: 'المشتريات',
      rows: [
        { description: 'المشتريات الداخلية الخاضعة للنسبة الاساسية(15%)', amount: '-', adjustment: '-', vat: '-' },
        { description: 'التوريدات الخاضعة للضريبة القيمة المضافة المسددة للجمارك', amount: '-', adjustment: '-', vat: '-' },
        { description: 'عمليات الاستيراد الخاضعة لضريبة القيمة المضافة والمستحقة للضريبة وفقا لالية الاحتساب العكسي', amount: '-', adjustment: '-', vat: '-' },
        { description: 'المشتريات الخاضعة لنسبة صفر بالمائة', amount: '-', adjustment: '-', vat: '-' },
        { description: 'المبيعات المعفاة', amount: '-', adjustment: '-', vat: '-' },
      ],
      total: { amount: '-', adjustment: '-', vat: '-' }
    },
    vat: {
      title: 'الضريبة المضافة',
      rows: [
        { description: 'ضريبة القيمة المضافة الاجمالية للفترة الضريبية المستحقة', amount: '-', adjustment: '-', vat: '-' },
        { description: 'تصحيحات الفترة السابقة (حوالي +-5000 ريال)', amount: '-', adjustment: '-', vat: '-' },
        { description: 'ضريبة القيمة المضافة التي تم ترحيلها من الفترة \ الفترات السابقة', amount: '-', adjustment: '-', vat: '-' },
      ],
      total: { description: 'ضريبة القيمة المضافة المستحقة (المطلوب اصلاحها)', amount: '-', adjustment: '-', vat: '-' }
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
              <button onClick={() => setActiveTab('vat')} className={`flex items-center gap-2 py-1 px-2 text-sm ${activeTab === 'vat' ? 'border-b-2 border-gray-800 text-gray-800' : 'text-gray-500'}`}>
                <span>3</span><span>الضريبة المضافة</span>
              </button>
              <button onClick={() => setActiveTab('sales')} className={`flex items-center gap-2 py-1 px-2 text-sm ${activeTab === 'sales' ? 'border-b-2 border-gray-800 text-gray-800' : 'text-gray-500'}`}>
                <span>{salesData.length}</span><span>المبيعات</span>
              </button>
              <button onClick={() => setActiveTab('purchases')} className={`flex items-center gap-2 py-1 px-2 text-sm ${activeTab === 'purchases' ? 'border-b-2 border-gray-800 text-gray-800' : 'text-gray-500'}`}>
                <span>{purchasesData.length}</span><span>المشتريات</span>
              </button>
            </nav>
            
            {/* ## Filters & Actions Section */}
            <section className="mb-5 px-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
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
              </div>
               {/* Export Buttons */}
              {(activeTab === 'sales' || activeTab === 'purchases') && (
                <div className="flex gap-2 mt-5">
                  <button className="bg-[#1A4D4F] text-white rounded-sm text-[10px] px-2.5 py-1 flex items-center gap-1 h-6">
                    <Icon path="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625a1.875 1.875 0 00-1.875 1.875v17.25a1.875 1.875 0 001.875 1.875h12.75a1.875 1.875 0 001.875-1.875V10.5" className="w-3 h-3"/>
                    <span>Excel</span>
                  </button>
                  <button className="bg-[#1A4D4F] text-white rounded-sm text-[10px] px-2.5 py-1 flex items-center gap-1 h-6">
                     <Icon path="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625a1.875 1.875 0 00-1.875 1.875v17.25a1.875 1.875 0 001.875 1.875h12.75a1.875 1.875 0 001.875-1.875V10.5" className="w-3 h-3"/>
                    <span>PDF</span>
                  </button>
                </div>
              )}
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
            ) : (
              /* ## Tax Declaration Table - For VAT tab */
              <section className="overflow-x-auto">
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
                        {section.rows.map((row, rowIndex) => (
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
              </section>
            )}
          </div>
        </div>

        {/* Add Sales Modal */}
        <AddSalesModal
          isOpen={isAddSalesModalOpen}
          onClose={() => setIsAddSalesModalOpen(false)}
          onSuccess={() => {
            // Refresh sales data after adding new record
            fetchSalesData();
          }}
        />

        {/* Add Purchases Modal */}
        <AddPurchasesModal
          isOpen={isAddPurchasesModalOpen}
          onClose={() => setIsAddPurchasesModalOpen(false)}
          onSuccess={() => {
            // Refresh purchases data after adding new record
            fetchPurchasesData();
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
            // Refresh sales data after editing
            fetchSalesData();
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
            // Refresh purchases data after editing
            fetchPurchasesData();
          }}
          purchaseRecord={selectedPurchaseRecord}
        />
      </main>
    </Layout>
  );
};

export default TaxReportPage;