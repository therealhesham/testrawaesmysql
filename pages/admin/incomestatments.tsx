import Head from 'next/head';
import { useState, useEffect } from 'react';
import axios from 'axios';
import type { ChangeEvent } from 'react';
import Layout from 'example/containers/Layout';

interface MainCategory {
  id: number;
  name: string;
  mathProcess: string;
  subs: SubCategory[];
}

interface SubCategory {
  id: number;
  name: string;
  mainCategory_id: number;
}

interface IncomeStatementItem {
  id: number;
  date: string;
  subCategory: {
    id: number;
    name: string;
    mainCategory: {
      id: number;
      name: string;
      mathProcess: string;
    };
  };
  amount: number;
  notes: string | null;
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
  const [incomeStatements, setIncomeStatements] = useState<IncomeStatementItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

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

  const fetchIncomeStatements = async () => {
    setLoadingData(true);
    try {
      const res = await axios.get('/api/income-statements');
      setIncomeStatements(res.data.items || []);
      setDataError(null);
    } catch (err) {
      console.error('Failed to fetch income statements:', err);
      setDataError('تعذر جلب السجلات');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchIncomeStatements();
  }, []);

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
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(Number(amount));
  };

  const calculateMonthlyData = () => {
    const monthlyData: Record<string, Record<string, number>> = {}; // { monthYear: { mainCategoryName: amount, ... } }
    const monthlySubCategoryData: Record<string, Record<string, number>> = {}; // { monthYear: { subCategoryName: amount, ... } }

    // Get last 6 months of current year for UI display (in order)
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-based month
    const months: string[] = [];
    
    // Get last 6 months in chronological order
    for (let i = 5; i >= 0; i--) {
      const monthIndex = currentMonth - i;
      if (monthIndex > 0) {
        months.push(`${currentYear}-${monthIndex.toString().padStart(2, '0')}`);
      } else {
        // Previous year month
        const prevYear = currentYear - 1;
        const prevMonth = 12 + monthIndex;
        months.push(`${prevYear}-${prevMonth.toString().padStart(2, '0')}`);
      }
    }

    incomeStatements.forEach(item => {
      const itemDate = new Date(item.date);
      const monthYear = `${itemDate.getFullYear()}-${(itemDate.getMonth() + 1).toString().padStart(2, '0')}`;

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {};
      }
      if (!monthlySubCategoryData[monthYear]) {
        monthlySubCategoryData[monthYear] = {};
      }

      const mainCatName = item.subCategory?.mainCategory?.name || 'غير مصنف';
      const subCatName = item.subCategory?.name || 'غير مصنف';
      const amount = Number(item.amount);

      monthlyData[monthYear][mainCatName] = (monthlyData[monthYear][mainCatName] || 0) + amount;
      monthlySubCategoryData[monthYear][subCatName] = (monthlySubCategoryData[monthYear][subCatName] || 0) + amount;
    });

    const tableData: Record<string, Record<string, number>> = {}; // { categoryName: { monthYear: amount, total: amount, average: amount } }

    mainCategories.forEach(mainCat => {
      tableData[mainCat.name] = {};
      mainCat.subs.forEach(subCat => {
        tableData[subCat.name] = {};
      });
    });

    // Initialize totals and averages
    Object.keys(tableData).forEach(cat => {
      tableData[cat].total = 0;
      tableData[cat].count = 0; // To calculate average
      months.forEach(month => {
        tableData[cat][month] = 0;
      });
    });

    // Populate data dynamically based on mathProcess from database
    incomeStatements.forEach(item => {
      const itemDate = new Date(item.date);
      const monthYear = `${itemDate.getFullYear()}-${(itemDate.getMonth() + 1).toString().padStart(2, '0')}`;
      const mainCatName = item.subCategory?.mainCategory?.name || 'غير مصنف';
      const subCatName = item.subCategory?.name || 'غير مصنف';
      const amount = Number(item.amount);
      const mathProcess = item.subCategory?.mainCategory?.mathProcess || 'add';

      // Apply math process based on database mathProcess
      const processedAmount = mathProcess === 'add' ? amount : -amount;

      if (tableData[mainCatName]) {
        tableData[mainCatName][monthYear] = (tableData[mainCatName][monthYear] || 0) + processedAmount;
        tableData[mainCatName].total += processedAmount;
        tableData[mainCatName].count += 1;
      }
      if (tableData[subCatName]) {
        tableData[subCatName][monthYear] = (tableData[subCatName][monthYear] || 0) + processedAmount;
        tableData[subCatName].total += processedAmount;
        tableData[subCatName].count += 1;
      }
    });

    // Calculate averages
    Object.keys(tableData).forEach(cat => {
      tableData[cat].average = tableData[cat].count > 0 ? tableData[cat].total / tableData[cat].count : 0;
    });

    return { months, tableData };
  };

  const { months, tableData } = calculateMonthlyData();

  const getCategoryRow = (categoryName: string, isBold = false) => {
    // Find category dynamically from database
    const category = mainCategories.find(cat => cat.name === categoryName);
    if (!category) return null;
    
    const data = tableData[categoryName] || {};
    const rowClass = isBold ? 'font-bold' : '';
    return (
      <tr key={categoryName} className={`bg-white hover:bg-[#1A4D4F]/10 ${rowClass}`}>
        <td className="p-3 text-right text-base font-medium">{formatCurrency(data.average || 0)}</td>
        <td className="p-3 text-right text-base font-medium">{formatCurrency(data.total || 0)}</td>
        {months.map((month, i) => (
          <td key={i} className="p-3 text-right text-base font-medium">{formatCurrency(data[month] || 0)}</td>
        ))}
        <td className="text-right font-medium pr-4">{categoryName}</td>
      </tr>
    );
  };

  const getSubCategoryRows = (mainCategoryName: string) => {
    const mainCat = mainCategories.find(cat => cat.name === mainCategoryName);
    if (!mainCat || !mainCat.subs.length) return null;

    return (
      <tr className="bg-[#F7F8FA]" key={`${mainCategoryName}-subs`}>
        <td colSpan={8} className="p-5">
          <div className="px-[21px]">
            <div className="flex flex-col gap-6">
              {mainCat.subs.map((subCat, index) => {
                const data = tableData[subCat.name] || {};
                return (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex gap-[116px] items-center">
                      {months.map((month, i) => (
                        <span key={i} className="text-[16px] font-normal text-[#1F2937] min-w-[60px] text-right">{formatCurrency(data[month] || 0)}</span>
                      ))}
                    </div>
                    <div className="flex items-center">
                      <span className="text-[14px] font-normal text-[#1F2937] text-right">{subCat.name}</span>
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-between items-center">
                <div className="flex gap-[116px] items-center">
                  {months.map((month, i) => (
                    <span key={i} className="text-[16px] font-bold text-[#1F2937] min-w-[60px] text-right">{formatCurrency(mainCat.subs.reduce((sum, sub) => sum + (tableData[sub.name]?.[month] || 0), 0))}</span>
                  ))}
                </div>
                <div className="flex items-center">
                  <span className="text-[14px] font-bold text-[#1F2937] text-right">الاجمالي</span>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  // Handle export button clicks
  const handleExport = async (type: string) => {
    try {
      const response = await axios.get(`/api/income-statements/export?format=${type}`);
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
    // Reset logic can be added here
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

  // Handle user dropdown
  const handleUserDropdown = () => {
    alert('قائمة المستخدم');
  };

  // Handle notification icon
  const handleNotification = () => {
    alert('عرض الإشعارات');
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
        {/* Header */}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8" dir='ltr'>
          <div className="flex justify-between items-center mb-10 " >
            <button
              className="bg-[#1A4D4F] text-white rounded-md px-4 py-2 flex items-center gap-2 text-sm hover:bg-[#164044]"
              onClick={() => setOpenAddModal(true)}
            >
              <span>اضافة سجل</span>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M4 1v6M1 4h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <h2 className="text-3xl text-black">قائمة الدخل</h2>
          </div>

          {/* Add Amount Form */}
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
                    fetchIncomeStatements(); // Refresh list after adding
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


          {/* Financial Table */}
          <div className="bg-[#F2F3F5] border border-[#E0E0E0] rounded-md p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-4 gap-4">
              <div className="flex flex-col md:flex-row items-end gap-4 w-full md:w-auto">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-800 mb-2">من</label>
                    <div
                      className="bg-[#F7F8FA] border border-[#E0E0E0] rounded-md px-2 py-2 flex items-center gap-2 w-full md:w-52 h-[34px] cursor-pointer"
                      onClick={handleDateInput}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="3" y="4" width="10" height="9" rx="2" stroke="#6B7280" />
                        <path d="M6 2v4M10 2v4M3 8h10" stroke="#6B7280" strokeWidth="1" />
                      </svg>
                      <span className="text-[#6B7280] text-xs">من</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-800 mb-2">الى</label>
                    <div
                      className="bg-[#F7F8FA] border border-[#E0E0E0] rounded-md px-2 py-2 flex items-center gap-2 w-full md:w-52 h-[34px] cursor-pointer"
                      onClick={handleDateInput}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="3" y="4" width="10" height="9" rx="2" stroke="#6B7280" />
                        <path d="M6 2v4M10 2v4M3 8h10" stroke="#6B7280" strokeWidth="1" />
                      </svg>
                      <span className="text-[#6B7280] text-xs">الى</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div
                    className="bg-[#F7F8FA] border border-[#E0E0E0] rounded-md px-2 py-2 flex items-center justify-between w-full md:w-48 h-[33px] cursor-pointer"
                    onClick={handleDropdown}
                  >
                    <span className="text-[#6B7280] text-xs">كل الاعمدة</span>
                    <svg width="5" height="8" viewBox="0 0 5 8" fill="none">
                      <path d="M1 1l3 3-3 3" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <button
                  className="bg-[#1A4D4F] text-white rounded-md px-3 py-2 text-xs hover:bg-[#164044] h-[29px]"
                  onClick={handleReset}
                >
                  اعادة ضبط
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-[#1A4D4F] text-white rounded-sm px-2 py-1 flex items-center gap-1 text-[10px] hover:bg-[#164044] h-[21px]"
                  onClick={() => handleExport('Excel')}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="2" y="2" width="8" height="8" rx="1" fill="white" />
                    <path d="M4 4l4 4M8 4l-4 4" stroke="#1A4D4F" strokeWidth="1" />
                  </svg>
                  <span>Excel</span>
                </button>
                <button
                  className="bg-[#1A4D4F] text-white rounded-sm px-2 py-1 flex items-center gap-1 text-[10px] hover:bg-[#164044] h-[21px]"
                  onClick={() => handleExport('PDF')}
                >
                  <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
                    <path d="M8 1H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4L8 1z" stroke="white" fill="white" />
                    <path d="M8 1v3h3" stroke="#1A4D4F" strokeWidth="1" />
                  </svg>
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full bg-white border-collapse">
                <thead>
                  <tr>
                    <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal border-b border-[#E0E0E0]">المتوسط الشهري</th>
                    <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal border-b border-[#E0E0E0]">الاجمالي</th>
                    {months.map((month, index) => (
                      <th key={index} className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal border-b border-[#E0E0E0]">
                        {new Date(month).toLocaleDateString('ar-SA', { month: 'numeric' })}
                      </th>
                    ))}
                    <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal border-b border-[#E0E0E0]">البيان</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Revenue Section */}
                  <tr className="bg-[#1A4D4F]/5 hover:bg-[#1A4D4F]/10">
                    <td className="p-3 text-right text-base font-medium">35</td>
                    <td className="p-3 text-right text-base font-medium">100</td>
                    {months.map((month, i) => (
                      <td key={i} className="p-3 text-right text-base font-medium">
                        {i < 5 ? [14, 20, 16, 25, 30][i] : 0}
                      </td>
                    ))}
                    <td className="text-right font-medium pr-4">عدد العقود</td>
                  </tr>
                  {getCategoryRow('الايرادات', true)}

                  {/* Direct Expenses Section */}
                  <tr className="bg-white">
                    <td colSpan={8} className="text-center font-medium text-sm text-gray-800 p-4">المصاريف المباشرة على العقد</td>
                  </tr>
                  {getSubCategoryRows('المصروفات المباشرة على العقد')}
                  {getCategoryRow('مجمل الربح', true)}

                  {/* Operational Expenses Section */}
                  <tr className="bg-white">
                    <td colSpan={8} className="text-center font-medium text-sm text-gray-800 p-4">اجمالي المصاريف التشغيلية</td>
                  </tr>
                  {getSubCategoryRows('المصروفات التشغيلية')}
                  {getCategoryRow('اجمالي المصاريف التشغيلة', true)}

                  {/* Other Operational Expenses Section */}
                  <tr className="bg-white">
                    <td colSpan={8} className="text-center font-medium text-sm text-gray-800 p-4">مصاريف اخرى التشغيلية</td>
                  </tr>
                  {getSubCategoryRows('المصروفات الاخرى التشغيلية')}
                  {getCategoryRow('صافي الربح قبل الزكاة', true)}
                  {getCategoryRow('صافي الربح بعد الزكاة', true)}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
</Layout>
      <style jsx>{`
        body {
          font-family: 'Tajawal', sans-serif;
        }

        /* Scrollbar Styling */
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

        /* Responsive Adjustments */
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
