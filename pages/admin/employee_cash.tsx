import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from 'example/containers/Layout';
import Style from 'styles/Home.module.css';
interface Employee {
  id: number;
  name: string;
  totalReceived: number;
  totalExpenses: number;
  remainingBalance: number;
  transactions: Transaction[];
}

interface Transaction {
  id: number;
  date: string;
  employeeName: string;
  cashNumber: string;
  receivedAmount: number;
  expenseAmount: number;
  remainingBalance: number;
}

interface EmployeeCashData {
  employees: Employee[];
  summary: {
    totalEmployees: number;
    totalReceived: number;
    totalExpenses: number;
    totalRemaining: number;
  };
}

export default function EmployeeCash() {
  const router = useRouter();
  const [data, setData] = useState<EmployeeCashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    employee: '',
    fromDate: '',
    toDate: ''
  });

  useEffect(() => {
    fetchEmployeeCashData();
  }, [filters]);

  const fetchEmployeeCashData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.employee) queryParams.append('employee', filters.employee);
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);

      const response = await fetch(`/api/employee-cash?${queryParams}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching employee cash data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeClick = (employeeId: number) => {
    router.push(`/admin/employee_cash/${employeeId}`);
  };

  const handleAddCash = () => {
    // Open modal for adding cash
    const modal = document.getElementById('add-cash-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  };

  const handleSearch = () => {
    fetchEmployeeCashData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (<Layout>
<div className={`min-h-screen bg-gray-50 ${Style['tajawal-regular']}`} dir="rtl">
      {/* Page Content */}
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={handleAddCash}
            className="bg-teal-800 text-white border-none rounded px-4 py-2 flex items-center gap-2 text-md cursor-pointer hover:bg-teal-700"
          >
            <span>إضافة عهدة</span>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M4 1v6M1 4h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <h2 className="text-3xl font-normal text-black text-right">كشف حساب عهدة الموظفين</h2>
        </div>
        
        {/* Filters Section */}
        <section className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-4">
          <div className="flex gap-6 mb-6 justify-end">
            <div className="flex flex-col gap-2 min-w-56">
              <label className="text-md text-gray-700 text-right">الموظف</label>
              <div className="relative">
                <select 
                  className="w-full bg-gray-100 border border-gray-300 rounded px-4 py-2 text-md text-gray-500 text-right appearance-none"
                  value={filters.employee}
                  onChange={(e) => setFilters({...filters, employee: e.target.value})}
                >
                  <option value="">اختر الموظف</option>
                  {data?.employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
                <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none w-4 h-4" viewBox="0 0 17 17" fill="none">
                  <path d="M4 6l4.5 4.5L13 6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 min-w-56">
              <label className="text-md text-gray-700 text-right">إلى</label>
              <div className="relative">
                <input 
                  type="date" 
                  className="w-full bg-gray-100 border border-gray-300 rounded px-4 py-2 text-md text-gray-500 text-right"
                  value={filters.toDate}
                  onChange={(e) => setFilters({...filters, toDate: e.target.value})}
                />
                <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="3" width="12" height="11" rx="2" ry="2" stroke="#6B7280" strokeWidth="2"/>
                  <path d="M11 1v4M5 1v4M2 7h12" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 min-w-56">
              <label className="text-md text-gray-700 text-right">من</label>
              <div className="relative">
                <input 
                  type="date" 
                  className="w-full bg-gray-100 border border-gray-300 rounded px-4 py-2 text-md text-gray-500 text-right"
                  value={filters.fromDate}
                  onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
                />
                <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="3" width="12" height="11" rx="2" ry="2" stroke="#6B7280" strokeWidth="2"/>
                  <path d="M11 1v4M5 1v4M2 7h12" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleSearch}
            className="bg-teal-800 text-white border-none rounded px-4 py-2 text-md cursor-pointer"
          >
            كشف حساب
          </button>
        </section>

        {/* Results Section */}
        <section className="bg-gray-50 border border-gray-300 rounded-lg shadow-sm">
          {/* Summary Cards */}
          <div className="flex gap-8 p-6 justify-center">
            <div className="bg-gray-100 rounded-lg p-5 text-center min-w-60 shadow-sm">
              <div className="text-base text-gray-700 mb-2">إجمالي الموظفين</div>
              <div className="text-base font-normal text-gray-700 leading-8">{data?.summary.totalEmployees || 0}</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-5 text-center min-w-60 shadow-sm">
              <div className="text-base text-gray-700 mb-2">إجمالي المبالغ المستلمة</div>
              <div className="text-base font-normal text-gray-700 leading-8">{data?.summary.totalReceived.toLocaleString() || '0'}</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-5 text-center min-w-60 shadow-sm">
              <div className="text-base text-gray-700 mb-2">إجمالي المصروفات</div>
              <div className="text-base font-normal text-gray-700 leading-8">{data?.summary.totalExpenses.toLocaleString() || '0'}</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-5 text-center min-w-60 shadow-sm">
              <div className="text-base text-gray-700 mb-2">الأرصدة المتبقية</div>
              <div className="text-base font-normal text-gray-700 leading-8">{data?.summary.totalRemaining.toLocaleString() || '0'}</div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr>
                  <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">#</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">التاريخ</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">اسم الموظف</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">رقم العهدة</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">المبلغ المستلم</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">المصروف</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">الرصيد المتبقي</th>
                </tr>
              </thead>
              <tbody>
                {data?.employees.flatMap(emp => emp.transactions).map((transaction, index) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleEmployeeClick(transaction.id)}>
                    <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">#{index + 1}</td>
                    <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">{transaction.date}</td>
                    <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">{transaction.employeeName}</td>
                    <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">{transaction.cashNumber}</td>
                    <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">{transaction.receivedAmount.toLocaleString()}</td>
                    <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">{transaction.expenseAmount.toLocaleString()}</td>
                    <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">{transaction.remainingBalance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="p-4 text-right text-md border-b border-gray-300 bg-gray-200 font-bold text-black">الإجمالي</td>
                  <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-200 font-bold">{data?.summary.totalReceived.toLocaleString() || '0'}</td>
                  <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-200 font-bold">{data?.summary.totalExpenses.toLocaleString() || '0'}</td>
                  <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-200 font-bold">{data?.summary.totalRemaining.toLocaleString() || '0'}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>

      {/* Add Cash Modal */}
      <div id="add-cash-modal" className="hidden fixed inset-0 bg-black bg-opacity-85 z-50 flex justify-center items-center">
        <div className="bg-gray-100 rounded-xl shadow-lg p-8 w-full max-w-2xl mx-auto relative" dir="rtl">
          <h2 className="text-center text-xl mb-8 text-gray-700">إضافة عهدة</h2>
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col items-end">
                <label className="text-md text-gray-500 mb-2">التاريخ</label>
                <input type="date" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" />
              </div>
              
              <div className="flex flex-col items-end">
                <label className="text-md text-gray-500 mb-2">الموظف</label>
                <select className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right">
                  <option>اختر الموظف</option>
                  {data?.employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col items-end">
                <label className="text-md text-gray-500 mb-2">رقم العهدة</label>
                <input type="text" placeholder="ادخل رقم العهدة" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" />
              </div>
              
              <div className="flex flex-col items-end">
                <label className="text-md text-gray-500 mb-2">المبلغ المستلم</label>
                <input type="text" placeholder="ادخل المبلغ المستلم" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" />
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <label className="text-md text-gray-500 mb-2">المرفقات</label>
              <div className="flex gap-3 w-full justify-start flex-row-reverse">
                <input type="file" id="fileUpload" className="hidden" />
                <button type="button" onClick={() => document.getElementById('fileUpload')?.click()} className="bg-teal-800 text-white border-none rounded px-5 py-2 text-md cursor-pointer">اختيار ملف</button>
                <span id="fileName" className="self-center text-md text-gray-600"></span>
              </div>
            </div>
            
            <div className="flex justify-center gap-4 mt-5">
              <button type="button" className="bg-white text-teal-800 border border-teal-800 rounded w-28 h-10 text-base">إلغاء</button>
              <button type="submit" className="bg-teal-800 text-white border-none rounded w-28 h-10 text-base">إضافة</button>
            </div>
          </form>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.getElementById('fileUpload')?.addEventListener('change', function(){
            document.getElementById('fileName').textContent = this.files[0]?.name || '';
          });
          
          // Close modal when clicking outside
          document.getElementById('add-cash-modal')?.addEventListener('click', function(e) {
            if (e.target === this) {
              this.style.display = 'none';
            }
          });
        `
      }} />
    </div>
    
</Layout>
  );
}
