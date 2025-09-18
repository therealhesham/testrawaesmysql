import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from 'example/containers/Layout';
import Style from 'styles/Home.module.css';

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
  const [filters, setFilters] = useState({
    client: '',
    date: '',
    search: ''
  });

  useEffect(() => {
    fetchSettlementData();
  }, [filters]);

  const fetchSettlementData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.client) queryParams.append('client', filters.client);
      if (filters.date) queryParams.append('date', filters.date);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/settlement?${queryParams}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching settlement data:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen bg-gray-50 ${Style['tajawal-regular']}`} dir="rtl">
        {/* Page Content */}
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-normal text-black text-right">تسوية مالية</h2>
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
                <label className="text-sm text-gray-500 text-right">التاريخ</label>
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
                <label className="text-sm text-gray-500 text-right">العميل</label>
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
                <label className="text-sm text-gray-500 text-right">بحث</label>
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

          {/* Results Section */}
          <section className="bg-gray-50 border border-gray-300 rounded-lg shadow-sm">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr>
                    <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">#</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">العميل</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">رقم العقد</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">قيمة العقد</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">المدفوع</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">المصروف</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">الصافي</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">تاريخ آخر تحديث</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.settlements.map((settlement, index) => (
                    <tr key={settlement.id} className="hover:bg-gray-50">
                      <td className="p-4 text-center text-sm border-b border-gray-300 bg-gray-100">
                        #{index + 1}
                      </td>
                      <td className="p-4 text-center text-sm border-b border-gray-300 bg-gray-100">
                        {settlement.clientName}
                      </td>
                      <td className="p-4 text-center text-sm border-b border-gray-300 bg-gray-100">
                        {settlement.contractNumber}
                      </td>
                      <td className="p-4 text-center text-sm border-b border-gray-300 bg-gray-100">
                        {settlement.contractValue.toLocaleString()}
                      </td>
                      <td className="p-4 text-center text-sm border-b border-gray-300 bg-gray-100">
                        {settlement.totalPaid.toLocaleString()}
                      </td>
                      <td className="p-4 text-center text-sm border-b border-gray-300 bg-gray-100">
                        {settlement.totalExpenses.toLocaleString()}
                      </td>
                      <td className="p-4 text-center text-sm border-b border-gray-300 bg-gray-100">
                        {settlement.netAmount.toLocaleString()}
                      </td>
                      <td className="p-4 text-center text-sm border-b border-gray-300 bg-gray-100">
                        {settlement.lastUpdated}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="p-4 text-right text-sm border-b border-gray-300 bg-gray-200 font-bold text-black">
                      الإجمالي
                    </td>
                    <td className="p-4 text-center text-sm border-b border-gray-300 bg-gray-200 font-bold">
                      {data?.summary.totalContractValue.toLocaleString() || '0'}
                    </td>
                    <td className="p-4 text-center text-sm border-b border-gray-300 bg-gray-200 font-bold">
                      {data?.summary.totalPaid.toLocaleString() || '0'}
                    </td>
                    <td className="p-4 text-center text-sm border-b border-gray-300 bg-gray-200 font-bold">
                      {data?.summary.totalExpenses.toLocaleString() || '0'}
                    </td>
                    <td className="p-4 text-center text-sm border-b border-gray-300 bg-gray-200 font-bold">
                      {data?.summary.totalNet.toLocaleString() || '0'}
                    </td>
                    <td className="p-4 text-center text-sm border-b border-gray-300 bg-gray-200 font-bold">
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
