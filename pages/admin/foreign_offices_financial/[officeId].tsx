import Head from 'next/head';
import { useState, useEffect } from 'react';
import axios from 'axios';
import type { ChangeEvent } from 'react';
import Layout from 'example/containers/Layout';
import { useRouter } from 'next/router';
import Style from "styles/Home.module.css";

interface Office {
  id: number;
  office: string;
  Country: string;
  phoneNumber: string;
}

interface FinancialRecord {
  id: number;
  date: string;
  month: string;
  clientName: string;
  contractNumber: string;
  payment: string;
  description: string;
  credit: number;
  debit: number;
  balance: number;
  invoice?: string;
  officeId: number;
  office?: Office;
}

interface SummaryData {
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  totalBalance: number;
}

export default function OfficeFinancialDetails() {
  const router = useRouter();
  const { officeId } = router.query;
  
  const [form, setForm] = useState({
    date: '',
    clientName: '',
    contractNumber: '',
    payment: '',
    description: '',
    credit: '',
    debit: '',
    balance: '',
  });
  const [editForm, setEditForm] = useState({
    id: 0,
    clientName: '',
    debit: '',
    credit: '',
    balance: '',
    description: '',
  });
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [office, setOffice] = useState<Office | null>(null);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData>({
    openingBalance: 0,
    totalDebit: 0,
    totalCredit: 0,
    totalBalance: 0,
  });
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    movementType: '',
    fromDate: '',
    toDate: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  const fetchOfficeData = async () => {
    if (!officeId) return;
    
    try {
      const res = await axios.get(`/api/offices/${officeId}`);
      setOffice(res.data.item);
    } catch (error) {
      console.error('Failed to fetch office:', error);
    }
  };

  const fetchFinancialRecords = async () => {
    if (!officeId) return;
    
    setLoadingData(true);
    try {
      const params = new URLSearchParams({
        officeId: officeId as string,
        ...(filters.movementType && { movementType: filters.movementType }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
        ...(searchTerm && { search: searchTerm }),
      });

      const res = await axios.get(`/api/foreign-offices-financial?${params}`);
      setFinancialRecords(res.data.items || []);
      
      // Calculate summary data
      const records = res.data.items || [];
      const totalDebit = records.reduce((sum: number, record: FinancialRecord) => sum + Number(record.debit), 0);
      const totalCredit = records.reduce((sum: number, record: FinancialRecord) => sum + Number(record.credit), 0);
      const openingBalance = 20000; // This could be calculated from previous records
      
      setSummaryData({
        openingBalance,
        totalDebit,
        totalCredit,
        totalBalance: openingBalance + totalDebit - totalCredit,
      });
      
      setDataError(null);
    } catch (err) {
      console.error('Failed to fetch financial records:', err);
      setDataError('تعذر جلب السجلات');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (officeId) {
      fetchOfficeData();
      fetchFinancialRecords();
    }
  }, [officeId, filters, searchTerm]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('ar-SA', { 
      style: 'currency', 
      currency: 'SAR',
      minimumFractionDigits: 2 
    }).format(Number(amount));
  };

  const handleInvoiceUpload = async (file: File): Promise<string> => {
    setUploadingInvoice(true);
    try {
      const response = await fetch(`/api/upload-presigned-url/${Date.now()}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to get presigned URL');
      }
      
      const { url, filePath } = await response.json();
      
      // Upload the file to the presigned URL
      await axios.put(url, file, {
        headers: {
          'Content-Type': file.type,
        },
      });
      
      setUploadingInvoice(false);
      return filePath;
    } catch (error) {
      setUploadingInvoice(false);
      throw error;
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.clientName || !officeId) return;
    
    try {
      let invoiceUrl = '';
      
      // Upload invoice if provided
      if (invoiceFile) {
        invoiceUrl = await handleInvoiceUpload(invoiceFile);
      }
      
      await axios.post('/api/foreign-offices-financial', {
        date: form.date,
        clientName: form.clientName,
        contractNumber: form.contractNumber,
        payment: form.payment,
        description: form.description,
        credit: Number(form.credit) || 0,
        debit: Number(form.debit) || 0,
        balance: Number(form.balance) || 0,
        invoice: invoiceUrl,
        officeId: Number(officeId),
      });
      
      setForm({
        date: '',
        clientName: '',
        contractNumber: '',
        payment: '',
        description: '',
        credit: '',
        debit: '',
        balance: '',
      });
      setInvoiceFile(null);
      setOpenAddModal(false);
      fetchFinancialRecords();
      alert('تمت الإضافة بنجاح');
    } catch (error) {
      console.error('Failed to add record:', error);
      alert('حدث خطأ أثناء الإضافة');
    }
  };

  const handleEditRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await axios.put(`/api/foreign-offices-financial/${editForm.id}`, {
        clientName: editForm.clientName,
        debit: Number(editForm.debit),
        credit: Number(editForm.credit),
        balance: Number(editForm.balance),
        description: editForm.description,
      });
      
      setOpenEditModal(false);
      fetchFinancialRecords();
      alert('تم التعديل بنجاح');
    } catch (error) {
      console.error('Failed to edit record:', error);
      alert('حدث خطأ أثناء التعديل');
    }
  };

  const openEditModalHandler = (record: FinancialRecord) => {
    setEditForm({
      id: record.id,
      clientName: record.clientName,
      debit: record.debit.toString(),
      credit: record.credit.toString(),
      balance: record.balance.toString(),
      description: record.description,
    });
    setOpenEditModal(true);
  };

  const handleSearch = () => {
    fetchFinancialRecords();
  };

  const handleExport = (type: string) => {
    alert(`تصدير إلى ${type}`);
  };

  const handleBackToMain = () => {
    router.push('/admin/foreign_offices_financial');
  };

  if (!office) {
    return (
      <div className="min-h-screen bg-[#F2F3F5] text-gray-900" dir="rtl">
        <Head>
          <title>تحميل...</title>
        </Head>
        <Layout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="text-xl text-gray-600">جاري التحميل...</div>
            </div>
          </div>
        </Layout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F3F5] text-gray-900" dir="rtl">
      <Head>
        <title>كشف حساب {office.office} - وصل للاستقدام</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <Layout>
        <div className={`flex flex-col min-h-screen ${Style["tajawal-regular"]}`}>
          <main className="flex-1 p-4 md:p-8" dir="ltr">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToMain}
                  className="bg-gray-500 text-white rounded-md px-4 py-2 flex items-center gap-2 text-sm hover:bg-gray-600"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M19 12H5M12 19l-7-7 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  العودة
                </button>
                <h2 className="text-3xl text-black">كشف حساب {office.office}</h2>
              </div>
              <button
                className="bg-[#1A4D4F] text-white rounded-md px-4 py-2 flex items-center gap-2 text-sm hover:bg-[#164044]"
                onClick={() => setOpenAddModal(true)}
              >
                <span>اضافة سجل</span>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M4 1v6M1 4h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Filters Section */}
            <section className="bg-[#F2F3F5] border border-[#E0E0E0] rounded-lg p-6 mb-4">
              <div className="flex flex-wrap gap-10 mb-6 justify-end">
                <div className="flex flex-col gap-2 min-w-[226px]">
                  <label className="text-xs text-gray-800">نوع الحركة</label>
                  <div className="relative">
                    <select
                      name="movementType"
                      value={filters.movementType}
                      onChange={handleFilterChange}
                      className="w-full p-2 bg-[#F7F8FA] border border-[#E0E0E0] rounded-md text-xs text-gray-600 appearance-none pr-8"
                    >
                      <option value="">اختر نوع الحركة</option>
                      <option value="debit">مدين</option>
                      <option value="credit">دائن</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 min-w-[226px]">
                  <label className="text-xs text-gray-800">الى</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="toDate"
                      value={filters.toDate}
                      onChange={handleFilterChange}
                      className="w-full p-2 bg-[#F7F8FA] border border-[#E0E0E0] rounded-md text-xs text-gray-600 pr-8"
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 min-w-[226px]">
                  <label className="text-xs text-gray-800">من</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="fromDate"
                      value={filters.fromDate}
                      onChange={handleFilterChange}
                      className="w-full p-2 bg-[#F7F8FA] border border-[#E0E0E0] rounded-md text-xs text-gray-600 pr-8"
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <button
                className="bg-[#1A4D4F] text-white border-none rounded-md px-4 py-2 text-sm cursor-pointer hover:bg-[#164044]"
                onClick={handleSearch}
              >
                كشف حساب
              </button>
            </section>

            {/* Results Section */}
            <section className="bg-[#F2F3F5] border border-[#E0E0E0] rounded-lg shadow-sm">
              {/* Summary Cards */}
              <div className="flex flex-wrap gap-8 p-6 justify-center">
                <div className="bg-[#F7F8FA] rounded-lg p-5 text-center min-w-[237px] shadow-sm">
                  <div className="text-base text-gray-800 mb-2">الرصيد الافتتاحي</div>
                  <div className="text-base font-normal text-gray-800 leading-8">
                    {formatCurrency(summaryData.openingBalance)}
                  </div>
                </div>
                <div className="bg-[#F7F8FA] rounded-lg p-5 text-center min-w-[237px] shadow-sm">
                  <div className="text-base text-gray-800 mb-2">اجمالي المدين</div>
                  <div className="text-base font-normal text-gray-800 leading-8">
                    {formatCurrency(summaryData.totalDebit)}
                  </div>
                </div>
                <div className="bg-[#F7F8FA] rounded-lg p-5 text-center min-w-[237px] shadow-sm">
                  <div className="text-base text-gray-800 mb-2">اجمالي الدائن</div>
                  <div className="text-base font-normal text-gray-800 leading-8">
                    {formatCurrency(summaryData.totalCredit)}
                  </div>
                </div>
                <div className="bg-[#F7F8FA] rounded-lg p-5 text-center min-w-[237px] shadow-sm">
                  <div className="text-base text-gray-800 mb-2">الرصيد الاجمالي</div>
                  <div className="text-base font-normal text-gray-800 leading-8">
                    {formatCurrency(summaryData.totalBalance)}
                  </div>
                </div>
              </div>

              {/* Table Controls */}
              <div className="flex justify-between items-center px-4 pb-6">
                <div className="flex gap-2">
                  <button
                    className="bg-[#1A4D4F] text-white border-none rounded-sm px-3 py-1 flex items-center gap-1 text-[10px] hover:bg-[#164044] h-[21px]"
                    onClick={() => handleExport('Excel')}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M8 1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4L8 1z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Excel
                  </button>
                  <button
                    className="bg-[#1A4D4F] text-white border-none rounded-sm px-3 py-1 flex items-center gap-1 text-[10px] hover:bg-[#164044] h-[21px]"
                    onClick={() => handleExport('PDF')}
                  >
                    <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
                      <path d="M8.5 1H2.5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4L8.5 1z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    PDF
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    placeholder="بحث"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-[428px] p-2 bg-[#F7F8FA] border border-[#E0E0E0] rounded-md text-sm text-gray-600 pr-10"
                  />
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                    <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full bg-white border-collapse">
                  <thead>
                    <tr>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">#</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">التاريخ</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">الشهر</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">اسم العميل</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">رقم العقد</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">الدفعة</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">البيان</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">دائن</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">مدين</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">الرصيد</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingData ? (
                      <tr>
                        <td colSpan={11} className="p-8 text-center text-gray-500">
                          جاري التحميل...
                        </td>
                      </tr>
                    ) : dataError ? (
                      <tr>
                        <td colSpan={11} className="p-8 text-center text-red-500">
                          {dataError}
                        </td>
                      </tr>
                    ) : financialRecords.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-8 text-center text-gray-500">
                          لا توجد سجلات
                        </td>
                      </tr>
                    ) : (
                      financialRecords.map((record, index) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            #{index + 1}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {new Date(record.date).toLocaleDateString('ar-SA')}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {new Date(record.date).toLocaleDateString('ar-SA', { month: 'long' })}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.clientName}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.contractNumber || '-'}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.payment || '-'}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.description || '-'}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.credit > 0 ? formatCurrency(record.credit) : '-'}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.debit > 0 ? formatCurrency(record.debit) : '-'}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {formatCurrency(record.balance)}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            <div className="flex gap-2 justify-center">
                              <button
                                className="bg-transparent border-none cursor-pointer p-1 rounded-md hover:bg-[#1A4D4F]/10"
                                onClick={() => openEditModalHandler(record)}
                                title="تعديل"
                              >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                  <path d="M14 3l4 4-8 8H6v-4l8-8z" stroke="#1A4D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                              {record.invoice && (
                                <a
                                  href={record.invoice}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-transparent border-none cursor-pointer p-1 rounded-md hover:bg-[#1A4D4F]/10"
                                  title="عرض الفاتورة"
                                >
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#1A4D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <polyline points="14,2 14,8 20,8" stroke="#1A4D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="16" y1="13" x2="8" y2="13" stroke="#1A4D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="16" y1="17" x2="8" y2="17" stroke="#1A4D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <polyline points="10,9 9,9 8,9" stroke="#1A4D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>

        {/* Add Record Modal */}
        {openAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setOpenAddModal(false)} />
            <div className="relative bg-white p-8 rounded-lg w-full max-w-[850px] mx-auto shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-center text-2xl text-gray-800">إضافة سجل</h2>
                <button
                  aria-label="close"
                  onClick={() => setOpenAddModal(false)}
                  className="text-[#1A4D4F] hover:text-[#164044] text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleAddRecord}>
                {/* Contract Search */}
                <div className="flex flex-col mb-6">
                  <label className="mb-2 font-bold text-gray-800">رقم العقد</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="contractNumber"
                      value={form.contractNumber}
                      onChange={handleChange}
                      placeholder="ادخل رقم العقد"
                      className="flex-1 p-2 border border-gray-300 rounded-md bg-white"
                    />
                    <button
                      type="button"
                      className="bg-[#1A4D4F] text-white px-4 py-2 rounded-md text-sm hover:bg-[#164044]"
                    >
                      بحث
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">تاريخ الطلب</label>
                    <input
                      name="date"
                      value={form.date}
                      onChange={handleChange}
                      type="date"
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">العميل</label>
                    <input
                      type="text"
                      name="clientName"
                      value={form.clientName}
                      onChange={handleChange}
                      placeholder="اسم العميل"
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">البيان</label>
                    <input
                      type="text"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="ادخل البيان"
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">الدفعه</label>
                    <input
                      type="text"
                      name="payment"
                      value={form.payment}
                      onChange={handleChange}
                      placeholder="ادخل بيان الدفعه"
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">رصيد الدائن</label>
                    <input
                      type="number"
                      name="credit"
                      value={form.credit}
                      onChange={handleChange}
                      placeholder="ادخل رصيد الدائن"
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">رصيد المدين</label>
                    <input
                      type="number"
                      name="debit"
                      value={form.debit}
                      onChange={handleChange}
                      placeholder="ادخل رصيد المدين"
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">الفاتورة</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                    {uploadingInvoice && (
                      <div className="text-sm text-blue-600 mt-1">جاري رفع الملف...</div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">الرصيد</label>
                    <input
                      type="number"
                      name="balance"
                      value={form.balance}
                      onChange={handleChange}
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                </div>
                
                <div className="text-center space-y-3 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                  <button
                    type="submit"
                    className="inline-flex justify-center items-center px-6 py-2 rounded-md text-sm font-bold text-white bg-[#1A4D4F] hover:bg-[#164044]"
                  >
                    إضافة
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center items-center px-6 py-2 rounded-md text-sm font-bold text-[#1A4D4F] border-2 border-[#1A4D4F] hover:bg-[#1A4D4F] hover:text-white"
                    onClick={() => setOpenAddModal(false)}
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Record Modal */}
        {openEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setOpenEditModal(false)} />
            <div className="relative bg-white p-8 rounded-lg w-full max-w-[700px] mx-auto shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-center text-2xl text-gray-800">تعديل</h2>
                <button
                  aria-label="close"
                  onClick={() => setOpenEditModal(false)}
                  className="text-[#1A4D4F] hover:text-[#164044] text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleEditRecord}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">اسم العميل</label>
                    <input
                      type="text"
                      name="clientName"
                      value={editForm.clientName}
                      onChange={handleEditChange}
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">رصيد المدين</label>
                    <input
                      type="number"
                      name="debit"
                      value={editForm.debit}
                      onChange={handleEditChange}
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">رصيد الدائن</label>
                    <input
                      type="number"
                      name="credit"
                      value={editForm.credit}
                      onChange={handleEditChange}
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 font-bold text-gray-800">الرصيد</label>
                    <input
                      type="number"
                      name="balance"
                      value={editForm.balance}
                      onChange={handleEditChange}
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div className="flex flex-col sm:col-span-2">
                    <label className="mb-2 font-bold text-gray-800">البيان</label>
                    <input
                      type="text"
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                      className="p-2 border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                </div>
                
                <div className="text-center space-y-3 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                  <button
                    type="submit"
                    className="inline-flex justify-center items-center px-6 py-2 rounded-md text-sm font-bold text-white bg-[#1A4D4F] hover:bg-[#164044]"
                  >
                    حفظ
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center items-center px-6 py-2 rounded-md text-sm font-bold text-[#1A4D4F] border-2 border-[#1A4D4F] hover:bg-[#1A4D4F] hover:text-white"
                    onClick={() => setOpenEditModal(false)}
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Layout>
    </div>
  );
}
