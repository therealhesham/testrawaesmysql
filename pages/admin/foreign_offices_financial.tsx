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

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ForeignOfficesFinancial() {
  const router = useRouter();
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    officeId: '',
    fromDate: '',
    toDate: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    contractNumber: '',
    clientName: '',
    description: '',
    payment: '',
    credit: '',
    debit: '',
    invoice: '',
    balance: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchFinancialRecords = async (page = 1) => {
    setLoadingData(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.officeId && { officeId: filters.officeId }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
        ...(searchTerm && { search: searchTerm }),
      });

      const res = await axios.get(`/api/foreign-offices-financial?${params}`);
      setFinancialRecords(res.data.items || []);
      setPagination(res.data.pagination || pagination);
      setDataError(null);
    } catch (err) {
      console.error('Failed to fetch financial records:', err);
      setDataError('تعذر جلب السجلات');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchFinancialRecords(1);
  }, [filters, searchTerm]);

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

  const handlePageChange = (newPage: number) => {
    fetchFinancialRecords(newPage);
  };

  const handleOfficeClick = (officeId: number) => {
    router.push(`/admin/foreign_offices_financial/${officeId}`);
  };

  const handleExport = (type: string) => {
    alert(`تصدير إلى ${type}`);
  };

  const handleSearch = () => {
    fetchFinancialRecords(1);
  };

  const handleAddRecord = async () => {
    try {
      const response = await axios.post('/api/foreign-offices-financial', {
        ...newRecord,
        officeId: filters.officeId || 1,
        credit: parseFloat(newRecord.credit) || 0,
        debit: parseFloat(newRecord.debit) || 0,
        balance: parseFloat(newRecord.balance) || 0,
      });
      
      if (response.status === 201) {
        setShowAddModal(false);
        setNewRecord({
          contractNumber: '',
          clientName: '',
          description: '',
          payment: '',
          credit: '',
          debit: '',
          invoice: '',
          balance: '',
          date: new Date().toISOString().split('T')[0]
        });
        fetchFinancialRecords(pagination.page);
        alert('تم إضافة السجل بنجاح');
      }
    } catch (error) {
      console.error('Error adding record:', error);
      alert('حدث خطأ أثناء إضافة السجل');
    }
  };

  const handleNewRecordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRecord(prev => ({ ...prev, [name]: value }));
  };

  const searchContract = async () => {
    if (!newRecord.contractNumber) return;
    
    try {
      const response = await axios.get(`/api/contracts/${newRecord.contractNumber}`);
      if (response.data) {
        setNewRecord(prev => ({
          ...prev,
          clientName: response.data.clientName || '',
          date: response.data.date || prev.date
        }));
      }
    } catch (error) {
      console.error('Contract not found:', error);
      alert('لم يتم العثور على العقد');
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F3F5] text-gray-900" dir="rtl">
      <Head>
        <title>كشف الحساب للمكاتب الخارجية - وصل للاستقدام</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <Layout>
        <div className={`flex flex-col min-h-screen ${Style["tajawal-regular"]}`}>
          <main className="flex-1 p-4 md:p-8" dir="ltr">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl text-black">كشف حساب للمكاتب الخارجية</h2>
              <button
                className="bg-[#1A4D4F] text-white border-none rounded-md px-4 py-2 flex items-center gap-2 text-sm cursor-pointer hover:bg-[#164044]"
                onClick={() => setShowAddModal(true)}
              >
                <span>إضافة سجل</span>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M4 1v6M1 4h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Filters Section */}
            <section className="bg-[#F2F3F5] border border-[#E0E0E0] rounded-lg p-6 mb-4">
              <div className="flex flex-wrap gap-10 mb-6 justify-end">
                <div className="flex flex-col gap-2 min-w-[226px]">
                  <label className="text-xs text-gray-800">المكتب</label>
                  <div className="relative">
                    <select
                      name="officeId"
                      value={filters.officeId}
                      onChange={handleFilterChange}
                      className="w-full p-2 bg-[#F7F8FA] border border-[#E0E0E0] rounded-md text-xs text-gray-600 appearance-none pr-8"
                    >
                      <option value="">جميع المكاتب</option>
                      <option value="1">مكتب فرصة كينيا</option>
                      <option value="2">مكتب ايرث باكستان</option>
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
              {/* Table Controls */}
              <div className="flex justify-between items-center px-4 py-6">
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
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">الدولة</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">اسم المكتب</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">اسم العميل</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">رقم العقد</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">البيان</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">مدين</th>
                      <th className="bg-[#1A4D4F] text-white p-4 text-center text-sm font-normal">دائن</th>
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
                            #{(pagination.page - 1) * pagination.limit + index + 1}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {new Date(record.date).toLocaleDateString('ar-SA')}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.office?.Country || '-'}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            <button
                              className="text-[#1A4D4F] hover:text-[#164044] hover:underline"
                              onClick={() => handleOfficeClick(record.officeId)}
                            >
                              {record.office?.office || '-'}
                            </button>
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.clientName}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.contractNumber || '-'}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.description || '-'}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.debit > 0 ? formatCurrency(record.debit) : '-'}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {record.credit > 0 ? formatCurrency(record.credit) : '-'}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            {formatCurrency(record.balance)}
                          </td>
                          <td className="p-4 text-center text-sm border-b border-[#E0E0E0] bg-[#F7F8FA]">
                            <div className="flex gap-2 justify-center">
                              <button
                                className="bg-transparent border-none cursor-pointer p-1 rounded-md hover:bg-[#1A4D4F]/10"
                                onClick={() => handleOfficeClick(record.officeId)}
                                title="عرض تفاصيل المكتب"
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#1A4D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  <circle cx="12" cy="12" r="3" stroke="#1A4D4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 p-6">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 bg-[#1A4D4F] text-white rounded-md text-sm disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-[#164044]"
                  >
                    السابق
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded-md text-sm ${
                            pagination.page === pageNum
                              ? 'bg-[#1A4D4F] text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-2 bg-[#1A4D4F] text-white rounded-md text-sm disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-[#164044]"
                  >
                    التالي
                  </button>
                </div>
              )}
            </section>
          </main>
        </div>
      </Layout>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">إضافة سجل</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); handleAddRecord(); }}>
              {/* Contract Search */}
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2 text-gray-700">رقم العقد</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="contractNumber"
                    value={newRecord.contractNumber}
                    onChange={handleNewRecordChange}
                    placeholder="ادخل رقم العقد"
                    className="flex-1 p-3 border border-gray-300 rounded-md bg-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={searchContract}
                    className="bg-[#1A4D4F] text-white px-4 py-2 rounded-md text-sm hover:bg-[#164044]"
                  >
                    بحث
                  </button>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">تاريخ الطلب</label>
                  <input
                    type="date"
                    name="date"
                    value={newRecord.date}
                    onChange={handleNewRecordChange}
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">العميل</label>
                  <input
                    type="text"
                    name="clientName"
                    value={newRecord.clientName}
                    onChange={handleNewRecordChange}
                    placeholder="اسم العميل"
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">البيان</label>
                  <input
                    type="text"
                    name="description"
                    value={newRecord.description}
                    onChange={handleNewRecordChange}
                    placeholder="ادخل البيان"
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">الدفعة</label>
                  <input
                    type="text"
                    name="payment"
                    value={newRecord.payment}
                    onChange={handleNewRecordChange}
                    placeholder="ادخل بيان الدفعة"
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">رصيد الدائن</label>
                  <input
                    type="number"
                    name="credit"
                    value={newRecord.credit}
                    onChange={handleNewRecordChange}
                    placeholder="ادخل رصيد الدائن"
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">رصيد المدين</label>
                  <input
                    type="number"
                    name="debit"
                    value={newRecord.debit}
                    onChange={handleNewRecordChange}
                    placeholder="ادخل رصيد المدين"
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">الفاتورة</label>
                  <button
                    type="button"
                    className="bg-[#1A4D4F] text-white px-4 py-2 rounded-md text-sm hover:bg-[#164044]"
                  >
                    اختيار ملف
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">الرصيد</label>
                  <input
                    type="number"
                    name="balance"
                    value={newRecord.balance}
                    onChange={handleNewRecordChange}
                    className="w-full p-3 border border-gray-300 rounded-md bg-white text-sm"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-center gap-4 mt-8">
                <button
                  type="submit"
                  className="bg-[#1A4D4F] text-white px-8 py-3 rounded-md font-bold hover:bg-[#164044]"
                >
                  إضافة
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-transparent text-[#1A4D4F] border-2 border-[#1A4D4F] px-8 py-3 rounded-md font-bold hover:bg-[#1A4D4F] hover:text-white"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}