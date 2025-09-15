import Head from 'next/head';
import { useState, useEffect } from 'react';
import axios from 'axios';
import type { ChangeEvent } from 'react';
import Layout from 'example/containers/Layout';

export default function Home() {
  const mainCategories = [
    'الايرادات',
    'المصروفات المباشرة على العقد',
    'المصروفات التشغيلية',
  ];

  const subCategoriesByMain: Record<string, string[]> = {
    'الايرادات': [],
    'المصروفات المباشرة على العقد': [
      'عمولة مساند',
      'رسوم التفويض',
      'سداد المستحق للمكاتب الخارجية',
    ],
    'المصروفات التشغيلية': [],
  };

  const [form, setForm] = useState({
    date: '',
    mainCategory: '',
    subCategory: '',
    amount: '',
    notes: '',
  });
  const [openAddModal, setOpenAddModal] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    // Reset subcategory when main category changes
    setForm((prev) => ({ ...prev, subCategory: '' }));
  }, [form.mainCategory]);

  // Handle export button clicks
  const handleExport = (type: string) => {
    alert(`تصدير إلى ${type}`);
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

  // Format currency utility
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
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
        <main className="flex-1 p-4 md:p-8">
          <div className="flex justify-between items-center mb-10">
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
                    if (!form.date || !form.mainCategory || !form.amount) return;
                    await axios.post('/api/income-statements', {
                      date: form.date,
                      mainCategory: form.mainCategory,
                      subCategory: form.subCategory || null,
                      amount: Number(form.amount),
                      notes: form.notes || null,
                    });
                    setForm({ date: '', mainCategory: '', subCategory: '', amount: '', notes: '' });
                    setOpenAddModal(false);
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
                        name="mainCategory"
                        value={form.mainCategory}
                        onChange={handleChange}
                        className="p-[10px] border border-[#CCC] rounded-[6px] bg-white"
                      >
                        <option value="">اختر البند الرئيسي</option>
                        {mainCategories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="mb-2 font-bold text-[#333]">البند الفرعي</label>
                      <select
                        name="subCategory"
                        value={form.subCategory}
                        onChange={handleChange}
                        className="p-[10px] border border-[#CCC] rounded-[6px] bg-white disabled:opacity-60"
                        disabled={!form.mainCategory || subCategoriesByMain[form.mainCategory]?.length === 0}
                      >
                        <option value="">اختر البند الفرعي</option>
                        {(subCategoriesByMain[form.mainCategory] || []).map((c) => (
                          <option key={c} value={c}>{c}</option>
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

          {/* Existing Entries */}
          <div className="bg-white p-6 rounded-lg max-w-3xl mx-auto mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
            <h3 className="text-lg font-bold mb-4 text-gray-800">السجلات الحالية</h3>
            <IncomeStatementsList />
          </div>

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

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full bg-white border-collapse">
                <thead>
                  <tr>
                    {['المتوسط الشهري', 'الاجمالي', 'شهر 5', 'شهر 4', 'شهر 3', 'شهر 2', 'شهر 1', 'البيان'].map((header) => (
                      <th
                        key={header}
                        className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal border-b border-[#E0E0E0]"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-[#1A4D4F]/5 hover:bg-[#1A4D4F]/10">
                    <td className="p-3 text-center text-base font-medium">35</td>
                    <td className="p-3 text-center text-base font-medium">100</td>
                    <td className="p-3 text-center text-base font-medium">14</td>
                    <td className="p-3 text-center text-base font-medium">20</td>
                    <td className="p-3 text-center text-base font-medium">16</td>
                    <td className="p-3 text-center text-base font-medium">25</td>
                    <td className="p-3 text-center text-base font-medium">30</td>
                    <td className="text-right font-medium pr-4">عدد العقود</td>
                  </tr>
                  <tr className="bg-[#1A4D4F]/5 hover:bg-[#1A4D4F]/10">
                    <td className="p-3 text-center text-base font-medium">800.00</td>
                    <td className="p-3 text-center text-base font-medium">2000.00</td>
                    <td className="p-3 text-center text-base font-medium">298.00</td>
                    <td className="p-3 text-center text-base font-medium">248.00</td>
                    <td className="p-3 text-center text-base font-medium">240.00</td>
                    <td className="p-3 text-center text-base font-medium">240.00</td>
                    <td className="p-3 text-center text-base font-medium">220.00</td>
                    <td className="text-right font-medium pr-4">اجمالي الايرادات</td>
                  </tr>

                  <tr className="bg-white">
                    <td colSpan={8} className="text-center font-medium text-sm text-gray-800 p-4">المصاريف المباشرة على العقد</td>
                  </tr>

                  <tr className="bg-[#F7F8FA]">
                    <td colSpan={8} className="p-5">
                      <div className="px-[21px]">
                        <div className="flex flex-col gap-6">
                          {[
                            'عمولة مساند',
                            'رسوم التفويض',
                            'سداد المستحق للمكاتب الخارجية',
                            'عمولة قطاع التشغيل',
                            'تحويلات بنكيه',
                            'تنقل',
                            'تكاليف اخرى',
                            'عمولة المناديب',
                          ].map((label, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <div className="flex gap-[116px] items-center">
                                {['800.00','2000.00','298.00','248.00','240.00','240.00','120.00'].map((value, i) => (
                                  <span key={i} className="text-[16px] font-normal text-[#1F2937] min-w-[60px] text-center">{value}</span>
                                ))}
                              </div>
                              <div className="flex items-center">
                                <span className="text-[14px] font-normal text-[#1F2937] text-right">{label}</span>
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-between items-center">
                            <div className="flex gap-[116px] items-center">
                              {['23,000.00','23,000.00','30,000.00','23,000.00','23,000.00','23,000.00','1120.00'].map((value, i) => (
                                <span key={i} className="text-[16px] font-bold text-[#1F2937] min-w-[60px] text-center">{value}</span>
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

                  <tr className="bg-white hover:bg-[#1A4D4F]/10">
                    <td className="p-3 text-center text-base font-medium">800.00</td>
                    <td className="p-3 text-center text-base font-medium">2000.00</td>
                    <td className="p-3 text-center text-base font-medium">298.00</td>
                    <td className="p-3 text-center text-base font-medium">248.00</td>
                    <td className="p-3 text-center text-base font-medium">240.00</td>
                    <td className="p-3 text-center text-base font-medium">240.00</td>
                    <td className="p-3 text-center text-base font-medium">220.00</td>
                    <td className="text-center font-medium text-sm">مجمل الربح</td>
                  </tr>

                  <tr className="bg-white">
                    <td colSpan={8} className="text-center font-medium text-sm text-gray-800 p-4">اجمالي المصاريف التشغيلية</td>
                  </tr>

                  <tr className="bg-[#F7F8FA]">
                    <td colSpan={8} className="p-5">
                      <div className="px-[21px]">
                        <div className="flex flex-col gap-6">
                          {[
                            'اجور ومرتبات',
                            'اتصالات وجوالات',
                            'عمولات تحويلات بنكية',
                            'اعاشة الخادمات',
                            'الايجار',
                            'تامينات اجتماعية',
                          ].map((label, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <div className="flex gap-[116px] items-center">
                                {['800.00','2000.00','298.00','248.00','240.00','240.00','120.00'].map((value, i) => (
                                  <span key={i} className="text-[16px] font-normal text-[#1F2937] min-w-[60px] text-center">{value}</span>
                                ))}
                              </div>
                              <div className="flex items-center">
                                <span className="text-[14px] font-normal text-[#1F2937] text-right">{label}</span>
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-between items-center">
                            <div className="flex gap-[116px] items-center">
                              {['23,000.00','23,000.00','30,000.00','23,000.00','23,000.00','23,000.00','1120.00'].map((value, i) => (
                                <span key={i} className="text-[16px] font-bold text-[#1F2937] min-w-[60px] text-center">{value}</span>
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

                  <tr className="bg-white">
                    <td colSpan={8} className="text-center font-medium text-sm text-gray-800 p-4">مصاريف اخرى التشغيلية</td>
                  </tr>

                  <tr className="bg-[#F7F8FA]">
                    <td colSpan={8} className="p-5">
                      <div className="px-[21px]">
                        <div className="flex flex-col gap-6">
                          {[
                            'تامين غير مسترد',
                            'بنزين، ترجمة اوراق',
                            'مصاريف حكومية',
                            'عمولة تسويق',
                            'دعاية واعلان',
                            'تحميل جزء من مصروفات الادارة',
                          ].map((label, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <div className="flex gap-[116px] items-center">
                                {['800.00','2000.00','298.00','248.00','240.00','240.00','120.00'].map((value, i) => (
                                  <span key={i} className="text-[16px] font-normal text-[#1F2937] min-w-[60px] text-center">{value}</span>
                                ))}
                              </div>
                              <div className="flex items-center">
                                <span className="text-[14px] font-normal text-[#1F2937] text-right">{label}</span>
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-between items-center">
                            <div className="flex gap-[116px] items-center">
                              {['8,000.00','23,000.00','30,000.00','23,000.00','23,000.00','23,000.00','1120.00'].map((value, i) => (
                                <span key={i} className="text-[16px] font-bold text-[#1F2937] min-w-[60px] text-center">{value}</span>
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

                  <tr className="bg-white hover:bg-[#1A4D4F]/10">
                    <td className="p-3 text-center text-base font-medium">15,000.00</td>
                    <td className="p-3 text-center text-base font-medium">27,900.00</td>
                    <td className="p-3 text-center text-base font-medium">33,900.00</td>
                    <td className="p-3 text-center text-base font-medium">29,900.00</td>
                    <td className="p-3 text-center text-base font-medium">26,900.00</td>
                    <td className="p-3 text-center text-base font-medium">30,900.00</td>
                    <td className="p-3 text-center text-base font-medium">29,900.00</td>
                    <td className="text-center font-medium text-sm">اجمالي المصاريف التشغيلة</td>
                  </tr>
                  <tr className="bg-white hover:bg-[#1A4D4F]/10">
                    <td className="p-3 text-center text-base font-medium">12,000.00</td>
                    <td className="p-3 text-center text-base font-medium">23,900.00</td>
                    <td className="p-3 text-center text-base font-medium">23,900.00</td>
                    <td className="p-3 text-center text-base font-medium">23,900.00</td>
                    <td className="p-3 text-center text-base font-medium">23,900.00</td>
                    <td className="p-3 text-center text-base font-medium">23,900.00</td>
                    <td className="p-3 text-center text-base font-medium">23,900.00</td>
                    <td className="text-center font-medium text-sm">صافي الربح قبل الزكاة</td>
                  </tr>
                  <tr className="bg-[#1A4D4F]/5 hover:bg-[#1A4D4F]/10">
                    <td className="p-3 text-center text-base font-medium">10,000.00</td>
                    <td className="p-3 text-center text-base font-medium">21,900.00</td>
                    <td className="p-3 text-center text-base font-medium">21,900.00</td>
                    <td className="p-3 text-center text-base font-medium">21,900.00</td>
                    <td className="p-3 text-center text-base font-medium">21,900.00</td>
                    <td className="p-3 text-center text-base font-medium">21,900.00</td>
                    <td className="p-3 text-center text-base font-medium">21,900.00</td>
                    <td className="text-center font-medium text-sm">صافي الربح بعد الزكاة</td>
                  </tr>
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

function IncomeStatementsList() {
  const [items, setItems] = useState<Array<{ id: number; date: string; mainCategory: string; subCategory: string | null; amount: number; notes: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/income-statements');
      setItems(res.data.items || []);
      setError(null);
    } catch (err: any) {
      setError('تعذر جلب السجلات');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/income-statements/${id}`);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      alert('تعذر الحذف');
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  if (loading) return <div className="text-sm text-gray-600">جاري التحميل...</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!items.length) return <div className="text-sm text-gray-500">لا توجد سجلات</div>;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between border rounded p-2 text-sm">
          <div className="flex flex-col">
            <span className="font-medium">{item.mainCategory}{item.subCategory ? ` - ${item.subCategory}` : ''}</span>
            <span className="text-gray-600">{new Date(item.date).toLocaleDateString('ar-SA')} • {new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(Number(item.amount))}</span>
            {item.notes ? <span className="text-gray-500">{item.notes}</span> : null}
          </div>
          <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-700">حذف</button>
        </div>
      ))}
    </div>
  );
}