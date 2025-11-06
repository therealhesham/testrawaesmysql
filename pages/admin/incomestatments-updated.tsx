import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { ChangeEvent } from 'react';
import Layout from 'example/containers/Layout';

interface MainCategory {
  id: number;
  name: string;
  mathProcess: string;
  subCategories: SubCategory[];
}

interface SubCategory {
  id: number;
  name: string;
  mainCategory_id: number;
  values: Record<string, number>; // { month: value }
  total: number;
}

interface FinancialData {
  months: string[]; // Last 6 months for UI
  allMonths: string[]; // Full year for export
  monthlyBreakdown: {
    revenues: number[];
    directExpenses: number[];
    operationalExpenses: number[];
    otherOperationalExpenses: number[];
    grossProfit: number[];
    netProfitBeforeZakat: number[];
    netProfitAfterZakat: number[];
  };
  totals: {
    revenues: number;
    directExpenses: number;
    operationalExpenses: number;
    otherOperationalExpenses: number;
    grossProfit: number;
    netProfitBeforeZakat: number;
    zakatAmount: number;
    netProfitAfterZakat: number;
  };
  averages: {
    revenues: number;
    directExpenses: number;
    operationalExpenses: number;
    otherOperationalExpenses: number;
    grossProfit: number;
    netProfitBeforeZakat: number;
    zakatAmount: number;
    netProfitAfterZakat: number;
  };
  mainCategories: MainCategory[]; // Processed data with values
  zakatRate: number;
  contracts: {
    byMonth: Record<string, { count: number; revenue: number }>;
    total: number;
    average: number;
    totalRevenue: number;
    averageRevenue: number;
  };
}

export default function Home() {
  const [form, setForm] = useState({
    date: '',
    mainCategoryId: '',
    subCategoryId: '',
    amount: '',
    notes: '',
  });
  const [openAddModal, setOpenAddModal] = useState(false);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [zakatRate, setZakatRate] = useState(2.5);

  const fetchCategories = async () => {
    try {
      const mainRes = await axios.get('/api/categories/mainCategory');
      setMainCategories(mainRes.data.items || []);
    } catch (error) {
      console.error('Failed to fetch main categories:', error);
      setMainCategories([]);
    }
  };

  const fetchSubCategories = async (mainCategoryId?: string) => {
    try {
      const subRes = await axios.get(`/api/categories/subCategory${mainCategoryId ? `?mainCategoryId=${mainCategoryId}` : ''}`);
      setSubCategories(subRes.data.items || []);
    } catch (error) {
      console.error('Failed to fetch sub categories:', error);
      setSubCategories([]);
    }
  };

  const fetchFinancialData = async () => {
    setLoadingData(true);
    try {
      const res = await axios.get(`/api/income-statements/calculations?zakatRate=${zakatRate}`);
      setFinancialData(res.data.data);
      setDataError(null);
    } catch (err) {
      console.error('Failed to fetch financial data:', err);
      setDataError('تعذر جلب البيانات المالية');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchFinancialData();
  }, [zakatRate]);

  useEffect(() => {
    if (form.mainCategoryId) {
      fetchSubCategories(form.mainCategoryId);
    } else {
      setSubCategories([]);
    }
    setForm((prev) => ({ ...prev, subCategoryId: '' }));
  }, [form.mainCategoryId]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (amount: number | string) => {
    return Number(amount).toFixed(2);
  };


  const getFinancialMetricRow = (label: string, data: number[], total: number, average: number, isHighlighted = false) => {
    if (!financialData) return null;
    
    const rowClass = isHighlighted ? 'bg-[#1A4D4F]/5 hover:bg-[#1A4D4F]/10' : 'bg-white hover:bg-[#1A4D4F]/10';
    
    return (
      <tr key={label} className={rowClass}>
        <td className="p-3 text-right text-base font-medium">{formatCurrency(average)}</td>
        <td className="p-3 text-right text-base font-medium">{formatCurrency(total)}</td>
        {data.map((value, i) => (
          <td key={i} className="p-3 text-right text-base font-medium">{formatCurrency(value)}</td>
        ))}
        <td className="text-right font-medium pr-4">{label}</td>
      </tr>
    );
  };

  // Handle export button clicks
  const handleExport = async (type: string) => {
    try {
      const response = await axios.get(`/api/income-statements/export?format=${type}&zakatRate=${zakatRate}`);
      const exportData = response.data.data;
      
      if (type === 'excel') {
        // Process Excel export with full year data
        console.log('Excel export data:', exportData);
        alert(`تم تحضير البيانات للتصدير إلى Excel (${exportData.months.length} شهر)`);
      } else if (type === 'pdf') {
        // Process PDF export with full year data
        console.log('PDF export data:', exportData);
        alert(`تم تحضير البيانات للتصدير إلى PDF (${exportData.months.length} شهر)`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('حدث خطأ في التصدير');
    }
  };

  // Handle reset button
  const handleReset = () => {
    alert('تم إعادة ضبط المرشحات');
  };

  // Handle dropdown click
  const handleDropdown = () => {
    alert('فتح قائمة الخيارات');
  };

  // Handle date input click
  const handleDateInput = (e: React.MouseEvent<HTMLDivElement>) => {
    const span = e.currentTarget.querySelector('span');
    if (!span) return;
    const currentDate = new Intl.DateTimeFormat('ar-SA').format(new Date());
    span.textContent = currentDate;
  };

  return (
    <div className="min-h-screen bg-[#F2F3F5]  text-gray-900" dir="rtl">
      <Head>
        <title>قائمة الدخل - وصل للاستقدام</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          rel="stylesheet"
        />
      </Head>
      <Layout>
        <div className="flex flex-col min-h-screen">
          <main className="flex-1 p-4 md:p-8" dir='ltr'>
            <div className="flex justify-between items-center mb-10 " >
              <div className="flex items-center gap-4">
                <button
                  className="bg-[#1A4D4F] text-white rounded-md px-4 py-2 flex items-center gap-2 text-sm hover:bg-[#164044]"
                  onClick={() => setOpenAddModal(true)}
                >
                  <span>اضافة مبلغ</span>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M4 1v6M1 4h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                {/* <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">نسبة الزكاة:</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={zakatRate}
                    onChange={(e) => setZakatRate(Number(e.target.value))}
                    className="w-20 px-2 py-1 border rounded text-sm"
                  />
                  <span className="text-sm">%</span>
                </div> */}
              </div>
              <h2 className="text-3xl text-black">قائمة الدخل</h2>
            </div>

            {openAddModal ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/30" onClick={() => setOpenAddModal(false)} />
                <div className="relative bg-[#F8F9FA] p-8 rounded-[10px] w-full max-w-[700px] mx-auto shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-center mb-0 text-[22px] text-[#333]">إضافة مبلغ</h2>
                    <button aria-label="close" onClick={() => setOpenAddModal(false)} className="text-[#1A4D4F] hover:text-[#164044]">×</button>
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!form.date || !form.mainCategoryId || !form.subCategoryId || !form.amount) return;
                      await axios.post('/api/income-statements', {
                        date: form.date,
                        subCategory_id: Number(form.subCategoryId),
                        amount: Number(form.amount),
                        notes: form.notes || null,
                      });
                      setForm({ date: '', mainCategoryId: '', subCategoryId: '', amount: '', notes: '' });
                      setOpenAddModal(false);
                      fetchFinancialData(); // Refresh data after adding
                      alert('تمت الإضافة');
                    }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                      <div className="flex flex-col">
                        <label className="mb-2 font-bold text-[#333]">التاريخ</label>
                        <input
                          name="date"
                          value={form.date}
                          onChange={handleChange}
                          type="date"
                          className="p-[10px] border border-[#CCC] rounded-[6px] bg-white"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="mb-2 font-bold text-[#333]">البند الرئيسي</label>
                        <select
                          name="mainCategoryId"
                          value={form.mainCategoryId}
                          onChange={handleChange}
                          className="p-[10px] border border-[#CCC] rounded-[6px] bg-white"
                        >
                          <option value="">اختر البند الرئيسي</option>
                          {mainCategories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <label className="mb-2 font-bold text-[#333]">البند الفرعي</label>
                        <select
                          name="subCategoryId"
                          value={form.subCategoryId}
                          onChange={handleChange}
                          className="p-[10px] border border-[#CCC] rounded-[6px] bg-white disabled:opacity-60"
                          disabled={!form.mainCategoryId || subCategories.length === 0}
                        >
                          <option value="">اختر البند الفرعي</option>
                          {subCategories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <label className="mb-2 font-bold text-[#333]">المبلغ</label>
                        <input
                          type="number"
                          name="amount"
                          value={form.amount}
                          onChange={handleChange}
                          placeholder="أدخل المبلغ"
                          className="p-[10px] border border-[#CCC] rounded-[6px] bg-white"
                        />
                      </div>
                      <div className="flex flex-col sm:col-span-2">
                        <label className="mb-2 font-bold text-[#333]">ملاحظات</label>
                        <input
                          type="text"
                          name="notes"
                          value={form.notes}
                          onChange={handleChange}
                          placeholder="أدخل ملاحظة اختيارية"
                          className="p-[10px] border border-[#CCC] rounded-[6px] bg-white"
                        />
                      </div>
                    </div>
                    <div className="text-center space-y-3 sm:space-y-0 sm:space-x-4 sm:[direction:ltr] [direction:rtl]">
                      <button
                        type="submit"
                        className="inline-flex justify-center items-center px-6 py-2 rounded-[6px] text-[14px] font-bold text-white bg-[#1A4D4F] hover:bg-[#164044]"
                      >
                        إضافة
                      </button>
                      <button
                        type="button"
                        className="inline-flex justify-center items-center px-6 py-2 rounded-[6px] text-[14px] font-bold text-[#1A4D4F] border-2 border-[#1A4D4F] hover:bg-[#1A4D4F] hover:text-white"
                        onClick={() => setOpenAddModal(false)}
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}

            {loadingData ? (
              <div className="flex justify-center items-center p-8">
                <div className="text-lg">جاري تحميل البيانات...</div>
              </div>
            ) : dataError ? (
              <div className="flex justify-center items-center p-8">
                <div className="text-lg text-red-600">{dataError}</div>
              </div>
            ) : financialData ? (
              <div className="bg-[#F2F3F5] border border-[#E0E0E0] rounded-md p-4 md:p-8">
                <div className="overflow-x-auto">
                  <table className="w-full bg-white border-collapse">
                    <thead>
                      <tr>
                        <th className="bg-[#1A4D4F] text-white p-4 text-right text-sm font-normal border-b border-[#E0E0E0]">المتوسط الشهري</th>
                        <th className="bg-[#1A4D4F] text-white p-4 text-right text-sm font-normal border-b border-[#E0E0E0]">الاجمالي</th>
                        {financialData.months.map((month, index) => (
                          <th key={index} className="bg-[#1A4D4F] text-white p-4 text-right text-sm font-normal border-b border-[#E0E0E0]">
                            {month.split('-')[1]}
                          </th>
                        ))}
                        <th className="bg-[#1A4D4F] text-white p-4 text-right text-sm font-normal border-b border-[#E0E0E0]">البيان</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Contracts Count Section - Real Data */}
                      <tr className="bg-[#1A4D4F]/5 hover:bg-[#1A4D4F]/10">
                        <td className="p-3 text-right text-base font-medium">
                          {Math.round(financialData.contracts.average)}
                        </td>
                        <td className="p-3 text-right text-base font-medium">
                          {financialData.contracts.total}
                        </td>
                        {financialData.months.map((month, i) => (
                          <td key={i} className="p-3 text-right text-base font-medium">
                            {financialData.contracts.byMonth[month]?.count || 0}
                          </td>
                        ))}
                        <td className="text-right font-medium pr-4">عدد العقود</td>
                      </tr>
                      
                      {/* Contracts Revenue Section - Real Data */}
                      <tr className="bg-[#1A4D4F]/5 hover:bg-[#1A4D4F]/10">
                        <td className="p-3 text-right text-base font-medium">
                          {formatCurrency(financialData.contracts.averageRevenue)}
                        </td>
                        <td className="p-3 text-right text-base font-medium">
                          {formatCurrency(financialData.contracts.totalRevenue)}
                        </td>
                        {financialData.months.map((month, i) => (
                          <td key={i} className="p-3 text-right text-base font-medium">
                            {formatCurrency(financialData.contracts.byMonth[month]?.revenue || 0)}
                          </td>
                        ))}
                        <td className="text-right font-medium pr-4">إيرادات العقود</td>
                      </tr>
                      
                      {/* Dynamic Categories from Database - Following exact pseudo-code structure */}
                      {financialData.mainCategories && financialData.mainCategories.map(main => (
                        <React.Fragment key={main.id}>
                          {/* Main Category Row */}
                          <tr className="bg-[#1A4D4F]/5 hover:bg-[#1A4D4F]/10 bg-white">
                            <td className="p-3 text-right text-base font-medium bg-white">
                              {formatCurrency((main.subCategories || []).reduce((sum, sub) => sum + (sub.total || 0), 0) / (financialData.months?.length || 1))}
                            </td>
                            <td className="p-3 text-right text-base font-medium">
                              {formatCurrency((main.subCategories || []).reduce((sum, sub) => sum + (sub.total || 0), 0))}
                            </td>
                            {financialData.months?.map((month, i) => (
                              <td key={i} className="p-3 text-right text-base font-medium">
                                {formatCurrency((main.subCategories || []).reduce((sum, sub) => sum + ((sub.values && sub.values[month]) || 0), 0))}
                              </td>
                            ))}
                            <td className="text-right font-medium pr-4">{main.name}</td>
                          </tr>
                          
                          {/* Subcategory Rows */}
                          {main.subCategories && main.subCategories.map(sub => (
                            <tr key={sub.id} className="bg-[#F7F8FA] hover:bg-[#1A4D4F]/5">
                              <td className="p-3 text-right text-base font-medium">
                                {formatCurrency((sub.total || 0) / (financialData.months?.length || 1))}
                              </td>
                              <td className="p-3 text-right text-base font-medium">
                                {formatCurrency(sub.total || 0)}
                              </td>
                              {financialData.months?.map((month, i) => (
                                <td key={i} className="p-3 text-right text-base font-medium">
                                  {formatCurrency((sub.values && sub.values[month]) || 0)}
                                </td>
                              ))}
                              <td className="text-right font-medium pr-4 text-[#1F2937]">{sub.name}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                      
                      {/* Financial Metrics */}
                      {getFinancialMetricRow('مجمل الربح', financialData.monthlyBreakdown.grossProfit, financialData.totals.grossProfit, financialData.averages.grossProfit, true)}
                      {getFinancialMetricRow('اجمالي المصاريف التشغيلية', financialData.monthlyBreakdown.operationalExpenses, financialData.totals.operationalExpenses, financialData.averages.operationalExpenses, true)}
                      {getFinancialMetricRow('اجمالي المصاريف الاخرى التشغيلية', financialData.monthlyBreakdown.otherOperationalExpenses, financialData.totals.otherOperationalExpenses, financialData.averages.otherOperationalExpenses, true)}
                      {getFinancialMetricRow('صافي الربح قبل الزكاة', financialData.monthlyBreakdown.netProfitBeforeZakat, financialData.totals.netProfitBeforeZakat, financialData.averages.netProfitBeforeZakat, true)}
                      {getFinancialMetricRow('صافي الربح بعد الزكاة', financialData.monthlyBreakdown.netProfitAfterZakat, financialData.totals.netProfitAfterZakat, financialData.averages.netProfitAfterZakat, true)}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </main>
        </div>
      </Layout>
      <style jsx>{`
        body {
          font-family: 'Tajawal', sans-serif;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #F1F1F1;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb {
          background: #1A4D4F;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #164044;
        }
        @media (max-width: 768px) {
          .flex-col.md\\:flex-row {
            flex-direction: column;
          }
          .w-full.md\\:w-52 {
            width: 100%;
          }
          .w-full.md\\:w-48 {
            width: 100%;
          }
          .gap-\\[116px\\] {
            gap: 20px;
            flex-wrap: wrap;
          }
          .text-base {
            font-size: 14px;
          }
          .text-sm {
            font-size: 12px;
          }
          .p-4 {
            padding: 8px 12px;
          }
        }
      `}</style>
    </div>
  );
}
