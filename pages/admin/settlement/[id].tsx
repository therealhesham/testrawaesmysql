import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from 'example/containers/Layout';
import Style from 'styles/Home.module.css';

interface Payment {
  id: number;
  date: string;
  paymentNumber: string;
  description: string;
  amount: number;
}

interface Expense {
  id: number;
  date: string;
  type: string;
  description: string;
  amount: number;
  paymentMethod: string;
  beneficiary: string;
}

interface ContractInfo {
  id: number;
  contractNumber: string;
  clientName: string;
  startDate: string;
  endDate: string;
  contractValue: number;
  totalPaid: number;
  totalExpenses: number;
  netAmount: number;
}

interface SettlementData {
  contract: ContractInfo;
  payments: Payment[];
  expenses: Expense[];
  summary: {
    totalPayments: number;
    totalExpenses: number;
    netAmount: number;
  };
}

export default function SettlementDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'expenses'>('payments');
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    search: ''
  });

  useEffect(() => {
    if (id) {
      fetchSettlementData();
    }
  }, [id, filters]);

  const fetchSettlementData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/settlement/${id}?${queryParams}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching settlement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
      fromDate: '',
      toDate: '',
      search: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">لم يتم العثور على بيانات التسوية</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen bg-gray-50 ${Style['tajawal-regular']}`} dir="rtl">
        {/* Page Content */}
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-normal text-black text-right">
              عقد #{data.contract.contractNumber}
            </h2>
          </div>
          
          {/* Contract Info */}
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-6">
            <div className="flex justify-center items-center gap-10">
              <div className="flex flex-col items-center gap-2 min-w-50">
                <span className="text-xl font-medium text-gray-700">تاريخ نهاية العقد</span>
                <span className="text-xl font-normal text-gray-700">{formatDate(data.contract.endDate)}</span>
              </div>
              <div className="flex flex-col items-center gap-2 min-w-50">
                <span className="text-xl font-medium text-gray-700">تاريخ بداية العقد</span>
                <span className="text-xl font-normal text-gray-700">{formatDate(data.contract.startDate)}</span>
              </div>
              <div className="flex flex-col items-center gap-2 min-w-50">
                <span className="text-xl font-medium text-gray-700">العميل</span>
                <span className="text-xl font-normal text-gray-700">{data.contract.clientName}</span>
              </div>
            </div>
          </div>
          
          {/* Financial Summary */}
          <div className="flex gap-8 p-6 justify-center mb-6">
            <div className="bg-white  rounded-lg p-5 text-center min-w-60 shadow-sm">
              <div className="text-base text-gray-700 mb-2">قيمة العقد</div>
              <div className="text-base font-normal text-gray-700 leading-8">
                {formatCurrency(data.contract.contractValue)}
              </div>
            </div>
            <div className="bg-white  rounded-lg p-5 text-center min-w-60 shadow-sm">
              <div className="text-base text-gray-700 mb-2">المدفوع</div>
              <div className="text-base font-normal text-gray-700 leading-8">
                {formatCurrency(data.contract.totalPaid)}
              </div>
            </div>
            <div className="bg-white  rounded-lg p-5 text-center min-w-60 shadow-sm">
              <div className="text-base text-gray-700 mb-2">المصروف</div>
              <div className="text-base font-normal text-gray-700 leading-8">
                {formatCurrency(data.contract.totalExpenses)}
              </div>
            </div>
            <div className="bg-white  rounded-lg p-5 text-center min-w-60 shadow-sm">
              <div className="text-base text-gray-700 mb-2">الصافي</div>
              <div className="text-base font-normal text-gray-700 leading-8">
                {formatCurrency(data.contract.netAmount)}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8 border-b border-gray-300">
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-3 text-base font-normal border-b-2 transition-colors ${
                activeTab === 'payments'
                  ? 'text-teal-800 border-teal-800'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              <span className="mr-2">{data.payments.length}</span>
              المدفوعات
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-6 py-3 text-base font-normal border-b-2 transition-colors ${
                activeTab === 'expenses'
                  ? 'text-teal-800 border-teal-800'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              <span className="mr-2">{data.expenses.length}</span>
              المصروفات
            </button>
          </div>

          {/* Filters Section */}
          <section className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-4">
            <div className="flex gap-8 mb-6 justify-start"  >
             <div className="flex flex-col gap-2 min-w-56">
                  <label className="text-md text-gray-500 text-right">بحث</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full bg-white  border border-gray-300 rounded px-4 py-2 text-base text-gray-500 text-right pr-11 h-11"
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
                <div className="flex flex-col gap-2 min-w-56" >
                  <label className="text-md text-gray-500 text-right">من</label>
                  <input 
                    type="date" 
                    className="w-full bg-white  border border-gray-300 rounded px-4 py-2 text-base text-gray-500 text-right h-11"
                    value={filters.fromDate}
                    onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
                  />
                </div>
                

              <div className="flex gap-4">
                <div className="flex flex-col gap-2 min-w-56">
                  <label className="text-md text-gray-500 text-right">الى</label>
                  <input 
                    type="date" 
                    className="w-full bg-white  border border-gray-300 rounded px-4 py-2 text-base text-gray-500 text-right h-11"
                    value={filters.toDate}
                    onChange={(e) => setFilters({...filters, toDate: e.target.value})}
                  />
                </div>
              <button 
                onClick={handleReset}
                className="bg-teal-800 text-white border-none rounded px-8 py-3 text-base font-medium h-11"
              >
                إعادة ضبط
              </button>
                              
              
                
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2 mb-4">
              <button className="bg-teal-800 text-white px-3 py-1 rounded text-md w-16">
                Excel
              </button>
              <button className="bg-teal-800 text-white px-3 py-1 rounded text-md w-14">
                PDF
              </button>
            </div>
          </section>

          {/* Data Table */}
          <section className="bg-gray-50 border border-gray-300 rounded-lg shadow-sm">
            <div className="overflow-x-auto">
              {activeTab === 'payments' ? (
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">#</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">تاريخ العملية</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">رقم الدفعة</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">الوصف</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((payment, index) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          #{index + 1}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {formatDate(payment.date)}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {payment.paymentNumber}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {payment.description}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {formatCurrency(payment.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="p-4 text-right text-md border-b border-gray-300 bg-gray-200 font-bold text-black">
                        الإجمالي
                      </td>
                      <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-200 font-bold">
                        {formatCurrency(data.summary.totalPayments)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">#</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">التاريخ</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">النوع</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">الوصف</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">المبلغ</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">طريقة الدفع</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">المستفيد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expenses.map((expense, index) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          #{index + 1}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {formatDate(expense.date)}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {expense.type}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {expense.description}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {expense.paymentMethod}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {expense.beneficiary}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="p-4 text-right text-md border-b border-gray-300 bg-gray-200 font-bold text-black">
                        الإجمالي
                      </td>
                      <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-200 font-bold">
                        {formatCurrency(data.summary.totalExpenses)}
                      </td>
                      <td colSpan={2} className="p-4 text-center text-md border-b border-gray-300 bg-gray-200"></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
