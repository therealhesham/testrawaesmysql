import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface TaxSummary {
  taxableSales: number;
  zeroRateSales: number;
  adjustments: number;
  taxValue: number;
  salesCount: number;
  purchasesCount: number;
  vatCount: number;
}

interface TaxRecord {
  id: number;
  category: string;
  description: string;
  amount: number;
  adjustment: number;
  total: number;
  taxRate?: number;
}

interface TaxDeclaration {
  id: number;
  period: string;
  year: number;
  month: number;
  status: string;
  taxableSales: number;
  zeroRateSales: number;
  adjustments: number;
  taxValue: number;
  salesRecords: TaxRecord[];
  purchaseRecords: TaxRecord[];
  vatRecords: TaxRecord[];
}

const TaxationPage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'purchases' | 'sales' | 'vat'>('vat');
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [declaration, setDeclaration] = useState<TaxDeclaration | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchTaxData();
  }, []);

  const fetchTaxData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tax/summary');
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
        setDeclaration(data.declaration);
      }
    } catch (error) {
      console.error('Error fetching tax data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        format,
        ...(dateFrom && { year: new Date(dateFrom).getFullYear().toString() }),
        ...(dateFrom && { month: (new Date(dateFrom).getMonth() + 1).toString() }),
      });

      const response = await fetch(`/api/tax/export?${params}`);
      if (response.ok) {
        if (format === 'excel') {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `tax-declaration-${new Date().getFullYear()}-${new Date().getMonth() + 1}.xlsx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          const data = await response.json();
          console.log('PDF data:', data);
          // Here you would implement PDF generation using jsPDF or similar
        }
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ar-SA').format(num);
  };

  const getCurrentRecords = () => {
    if (!declaration) return [];
    
    switch (activeTab) {
      case 'sales':
        return declaration.salesRecords;
      case 'purchases':
        return declaration.purchaseRecords;
      case 'vat':
        return declaration.vatRecords;
      default:
        return [];
    }
  };

  const getTabCount = () => {
    if (!declaration) return { purchases: 0, sales: 0, vat: 0 };
    
    return {
      purchases: declaration.purchaseRecords.length,
      sales: declaration.salesRecords.length,
      vat: declaration.vatRecords.length,
    };
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'sales':
        return 'المبيعات';
      case 'purchases':
        return 'المشتريات';
      case 'vat':
        return 'الضريبة المضافة';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-normal text-black mb-2">الاقرار الضريبي</h1>
        </div>

        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 max-w-6xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-5 justify-center">
            <div className="bg-gray-50 rounded-lg p-5 h-25 shadow-sm flex items-center justify-center">
              <div className="text-center">
                <div className="text-base text-gray-800 mb-2">المبيعات الخاضعة للضريبة</div>
                <div className="text-lg text-gray-800 font-normal">
                  {summary ? formatNumber(summary.taxableSales) : '0.00'}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-5 h-25 shadow-sm flex items-center justify-center">
              <div className="text-center">
                <div className="text-base text-gray-800 mb-2">المبيعات الخاضعة للصفر</div>
                <div className="text-lg text-gray-800 font-normal">
                  {summary ? formatNumber(summary.zeroRateSales) : '0.00'}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-5 h-25 shadow-sm flex items-center justify-center">
              <div className="text-center">
                <div className="text-base text-gray-800 mb-2">التعديلات</div>
                <div className="text-lg text-gray-800 font-normal">
                  {summary ? formatNumber(summary.adjustments) : '0.00'}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-5 h-25 shadow-sm flex items-center justify-center">
              <div className="text-center">
                <div className="text-base text-gray-800 mb-2">قيمة الضريبة</div>
                <div className="text-lg text-gray-800 font-normal">
                  {summary ? formatNumber(summary.taxValue) : '0.00'}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-9 mb-5 items-end justify-center border-b border-gray-300 pb-4">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex items-center gap-2 px-2 py-1 ${
                activeTab === 'purchases' ? 'border-b border-gray-800' : ''
              }`}
            >
              <span className="text-sm text-gray-600">{getTabCount().purchases}</span>
              <span className={`text-sm ${activeTab === 'purchases' ? 'text-gray-800' : 'text-gray-600'}`}>
                المشتريات
              </span>
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex items-center gap-2 px-2 py-1 ${
                activeTab === 'sales' ? 'border-b border-gray-800' : ''
              }`}
            >
              <span className="text-sm text-gray-600">{getTabCount().sales}</span>
              <span className={`text-sm ${activeTab === 'sales' ? 'text-gray-800' : 'text-gray-600'}`}>
                المبيعات
              </span>
            </button>
            <button
              onClick={() => setActiveTab('vat')}
              className={`flex items-center gap-2 px-2 py-1 ${
                activeTab === 'vat' ? 'border-b border-gray-800' : ''
              }`}
            >
              <span className="text-sm text-gray-600">{getTabCount().vat}</span>
              <span className={`text-sm ${activeTab === 'vat' ? 'text-gray-800' : 'text-gray-600'}`}>
                الضريبة المضافة
              </span>
            </button>
          </div>

          {/* Filters Section */}
          <div className="flex justify-end items-end gap-4 mb-5 px-4">
            <div className="flex items-center gap-4">
              <button className="bg-teal-800 text-white border-none rounded px-3 py-2 text-xs h-7">
                اعادة ضبط
              </button>
              <div className="bg-gray-50 border border-gray-300 rounded px-2 py-2 flex items-center gap-12 w-46 h-8">
                <svg className="w-1 h-2" viewBox="0 0 5 8" fill="none">
                  <path d="M1 1L4 4L1 7" stroke="#6B7280" strokeWidth="1"/>
                </svg>
                <span className="text-xs text-gray-600">كل الاعمدة</span>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-800">الى</label>
                <div className="bg-gray-50 border border-gray-300 rounded px-2 py-2 flex items-center justify-between w-51 h-8">
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="3" width="12" height="10" rx="1" stroke="#6B7280" strokeWidth="1"/>
                    <path d="M6 1v4M10 1v4M2 7h12" stroke="#6B7280" strokeWidth="1"/>
                  </svg>
                  <span className="text-xs text-gray-600">الى</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-800">من</label>
                <div className="bg-gray-50 border border-gray-300 rounded px-2 py-2 flex items-center justify-between w-51 h-8">
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="3" width="12" height="10" rx="1" stroke="#6B7280" strokeWidth="1"/>
                    <path d="M6 1v4M10 1v4M2 7h12" stroke="#6B7280" strokeWidth="1"/>
                  </svg>
                  <span className="text-xs text-gray-600">من</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-800">بحث</label>
              <div className="bg-gray-50 border border-gray-300 rounded px-4 py-2 flex items-center gap-9 w-66 h-8">
                <svg className="w-3 h-3" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="#6B7280" strokeWidth="1"/>
                  <path d="m10 10 3 3" stroke="#6B7280" strokeWidth="1"/>
                </svg>
                <span className="text-sm text-gray-600">بحث</span>
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-1 mb-5 px-4">
            <button
              onClick={() => handleExport('excel')}
              className="bg-teal-800 text-white border-none rounded px-2 py-1 flex items-center gap-1 h-5 w-16"
            >
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1"/>
                <path d="M4 3h4M4 5h4M4 7h2" stroke="currentColor" strokeWidth="1"/>
              </svg>
              <span className="text-xs">Excel</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="bg-teal-800 text-white border-none rounded px-2 py-1 flex items-center gap-1 h-5 w-14"
            >
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1"/>
                <path d="M4 3h4M4 5h4M4 7h2" stroke="currentColor" strokeWidth="1"/>
              </svg>
              <span className="text-xs">PDF</span>
            </button>
          </div>

          {/* Tax Table */}
          <div className="flex gap-5">
            {/* Table Headers */}
            <div className="bg-teal-800 flex gap-14 px-6 py-3 w-full h-16 items-center mb-5">
              <div className="text-gray-50 text-base text-center w-45 leading-tight">
                مبلغ ضريبة القيمة المضافة<br />(بالريال)
              </div>
              <div className="text-gray-50 text-base text-center w-21 leading-tight">
                مبلغ التعديل<br />(بالريال)
              </div>
              <div className="text-gray-50 text-base text-center w-14 leading-tight">
                المبلغ<br />(بالريال)
              </div>
            </div>

            {/* Left Data Section */}
            <div className="w-125 flex flex-col">
              {getCurrentRecords().map((record, index) => (
                <div
                  key={record.id}
                  className={`bg-gray-50 border border-gray-300 h-14 flex items-center px-5 ${
                    index === getCurrentRecords().length - 1 ? 'bg-teal-50 h-11' : ''
                  }`}
                >
                  <div className="w-2 h-2 bg-gray-600 rounded-full ml-9"></div>
                  <div className="flex flex-1 justify-between items-center">
                    <span className="w-14 text-base text-gray-800 text-center">
                      {formatNumber(record.amount)}
                    </span>
                    <span className="w-11 text-base text-gray-800 text-center">
                      {formatNumber(record.adjustment)}
                    </span>
                    <span className="w-17 text-base text-gray-800 text-center">
                      {formatNumber(record.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex-1">
              <div className="bg-teal-800 text-gray-50 text-2xl writing-mode-vertical text-orientation-mixed w-13 h-full flex items-center justify-center border-l border-gray-300">
                {getTabTitle()}
              </div>
              <div className="w-132 flex flex-col">
                {getCurrentRecords().map((record, index) => (
                  <div
                    key={record.id}
                    className={`bg-gray-50 border border-gray-300 h-14 flex items-center justify-between px-3 relative ${
                      index === getCurrentRecords().length - 1 ? 'bg-teal-50 h-11 justify-center' : ''
                    }`}
                  >
                    <span className="text-base text-gray-800 text-center leading-tight max-w-100">
                      {record.description}
                    </span>
                    <div className="w-2 h-2 bg-gray-600 rounded-full absolute left-3 top-1/2 transform -translate-y-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxationPage;
