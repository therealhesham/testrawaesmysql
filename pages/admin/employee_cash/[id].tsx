import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css"
interface EmployeeDetail {
  id: number;
  name: string;
  position?: string;
  department?: string;
  totalDebit: number;
  totalCredit: number;
  totalBalance: number;
  transactions: EmployeeTransaction[];
  settlements?: {
    totalDetailsDebit: number;
    totalDetailsCredit: number;
    totalCashReceived: number;
    totalCashExpenses: number;
  };
}

interface EmployeeTransaction {
  id: number;
  date: string;
  month: string;
  mainAccount: string;
  subAccount: string;
  client: string;
  debit: number;
  credit: number;
  balance: number;
  description: string;
  attachment: string;
  type?: 'detail' | 'cash';
}

export default function EmployeeCashDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    client: '',
    movementType: '',
    fromDate: '',
    toDate: ''
  });

  useEffect(() => {
    if (id) {
      fetchEmployeeDetail();
    }
  }, [id, filters]);

  const fetchEmployeeDetail = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.client) queryParams.append('client', filters.client);
      if (filters.movementType) queryParams.append('movementType', filters.movementType);
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);

      const response = await fetch(`/api/employee-cash/${id}?${queryParams}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching employee detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = () => {
    const modal = document.getElementById('add-record-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  };

  const handleSubmitAddRecord = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const response = await fetch(`/api/employee-cash/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionDate: formData.get('transactionDate'),
          client: formData.get('client'),
          mainAccount: formData.get('mainAccount'),
          subAccount: formData.get('subAccount'),
          debit: Number(formData.get('debit') || 0),
          credit: Number(formData.get('credit') || 0),
          attachment: formData.get('attachment') || ''
        }),
      });

      if (response.ok) {
        alert('تم إضافة السجل بنجاح');
        handleCloseAddModal();
        fetchEmployeeDetail();
      } else {
        const errorData = await response.json();
        alert(`خطأ: ${errorData.error || 'حدث خطأ أثناء إضافة السجل'}`);
      }
    } catch (error) {
      console.error('Error adding record:', error);
      alert('حدث خطأ أثناء إضافة السجل');
    }
  };

  const handleCloseAddModal = () => {
    const modal = document.getElementById('add-record-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  };

  const handleEditRecord = (transactionId: number) => {
    const modal = document.getElementById('edit-modal-bg');
    if (modal) {
      modal.style.display = 'flex';
    }
  };

  const handleDeleteRecord = async (transactionId: number) => {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      try {
        const response = await fetch(`/api/employee-cash/${transactionId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('تم حذف السجل بنجاح');
          fetchEmployeeDetail();
        } else {
          alert('حدث خطأ أثناء حذف السجل');
        }
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('حدث خطأ أثناء حذف السجل');
      }
    }
  };

  const handleSearch = () => {
    fetchEmployeeDetail();
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
    <div className={`min-h-screen bg-gray-50 ${Style["tajawal-regular"]}`} dir="rtl">
      {/* Page Content */}
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleAddRecord}
            className="bg-teal-800 text-white border-none rounded px-4 py-2 flex items-center gap-2 text-xs cursor-pointer hover:bg-teal-700"
          >
            <span>إضافة سجل</span>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M4 1v6M1 4h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <h2 className="text-3xl font-normal text-black text-right">كشف حساب {data?.name || 'الموظف'}</h2>
        </div>
        
        {/* Filters Section */}
        <section className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-4">
          <div className="flex gap-10 mb-6 justify-end">
            <div className="flex flex-col gap-2 min-w-56">
              <label className="text-xs text-gray-700 text-right">العميل</label>
              <div className="relative">
                <select
                  className="w-full bg-gray-100 border border-gray-300 rounded  text-xs text-gray-500 text-right "
                  value={filters.client}
                  onChange={(e) => setFilters({...filters, client: e.target.value})}
                >
                  <option value="">اختر العميل</option>
                </select>
                {/* <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none w-4 h-4" viewBox="0 0 17 17" fill="none">
                  <path d="M4 6l4.5 4.5L13 6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg> */}
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-56">
              <label className="text-xs text-gray-700 text-right">نوع الحركة</label>
              <div className="relative">
                <select
                  className="w-full bg-gray-100 border border-gray-300 rounded  text-xs text-gray-500 text-right appearance-none"
                  value={filters.movementType}
                  onChange={(e) => setFilters({...filters, movementType: e.target.value})}
                >
                  <option value="">اختر نوع الحركة</option>
                  <option value="debit">مدين</option>
                  <option value="credit">دائن</option>
                </select>

              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-56">
              <label className="text-xs text-gray-700 text-right">إلى</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full bg-gray-100 border border-gray-300 rounded px-4 py-2 text-xs text-gray-500 text-right"
                  value={filters.toDate}
                  onChange={(e) => setFilters({...filters, toDate: e.target.value})}
                />

              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-56">
              <label className="text-xs text-gray-700 text-right">من</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full bg-gray-100 border border-gray-300 rounded px-4 py-2 text-xs text-gray-500 text-right"
                  value={filters.fromDate}
                  onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
                />

              </div>
            </div>
          </div>

          <button
            onClick={handleSearch}
            className="bg-teal-800 text-white border-none rounded px-4 py-2 text-sm cursor-pointer"
          >
            كشف حساب
          </button>
        </section>

        {/* Results Section */}
        <section className="bg-gray-50 border border-gray-300 rounded-lg shadow-sm">
          {/* Summary Cards */}
          <div className="flex gap-8 p-6 justify-between">
            <div className="bg-gray-100 rounded-lg p-5 text-center flex-1 shadow-sm">
              <div className="text-base text-gray-700 mb-2">إجمالي المدين</div>
              <div className="text-base font-normal text-gray-700 leading-8">{data?.totalDebit.toLocaleString() || '0'}</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-5 text-center flex-1 shadow-sm">
              <div className="text-base text-gray-700 mb-2">إجمالي الدائن</div>
              <div className="text-base font-normal text-gray-700 leading-8">{data?.totalCredit.toLocaleString() || '0'}</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-5 text-center flex-1 shadow-sm">
              <div className="text-base text-gray-700 mb-2">إجمالي الرصيد</div>
              <div className="text-base font-normal text-gray-700 leading-8">{data?.totalBalance.toLocaleString() || '0'}</div>
            </div>
          </div>

          {/* Settlements Section */}
          {data?.settlements && (
            <div className="p-6 border-b border-gray-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-right">تفاصيل التسويات</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-blue-800 mb-3 text-right">من جدول التفاصيل</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">إجمالي المدين:</span>
                      <span className="text-sm font-medium">{data.settlements.totalDetailsDebit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">إجمالي الدائن:</span>
                      <span className="text-sm font-medium">{data.settlements.totalDetailsCredit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-green-800 mb-3 text-right">من جدول العهدة النقدية</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">إجمالي المستلم:</span>
                      <span className="text-sm font-medium">{data.settlements.totalCashReceived.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">إجمالي المصروف:</span>
                      <span className="text-sm font-medium">{data.settlements.totalCashExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">#</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">التاريخ</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">الشهر</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">النوع</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">الحساب الرئيسي</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">الحساب الفرعي</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">العميل</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">مدين</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">دائن</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">الرصيد</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">البيان</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">المرفق</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-sm font-normal">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {data?.transactions.map((transaction, index) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="p-4 text-center text-sm bg-gray-100">{index + 1}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">{transaction.date}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">{transaction.month}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">
                      <span className={`px-2 py-1 rounded text-xs ${
                        transaction.type === 'detail' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {transaction.type === 'detail' ? 'تفاصيل' : 'عهدة نقدية'}
                      </span>
                    </td>
                    <td className="p-4 text-center text-sm bg-gray-100">{transaction.mainAccount}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">{transaction.subAccount}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">{transaction.client}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">{transaction.debit.toLocaleString()}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">{transaction.credit.toLocaleString()}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">{transaction.balance.toLocaleString()}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">{transaction.description}</td>
                    <td className="p-4 text-center text-sm bg-gray-100">
                      <a href="#" className="text-teal-800 hover:underline">{transaction.attachment}</a>
                    </td>
                    <td className="p-4 text-center text-sm bg-gray-100">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditRecord(transaction.id)}
                          className="bg-none border-none cursor-pointer p-1 rounded hover:bg-teal-100"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2 12.5V14h1.5l8.5-8.5-1.5-1.5L2 12.5z" fill="#1A4D4F"/>
                            <path d="M13.5 4.5l-2-2" stroke="#1A4D4F" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(transaction.id)}
                          className="bg-none border-none cursor-pointer p-1 rounded hover:bg-red-100"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 2h4v1H6V2zm1 0h2v1H7V2zm6 3H3v1h10V5zm-1 3v7c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1V8H4v7c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V8h-1z" fill="#DC2626"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={7} className="p-4 text-right text-sm bg-gray-200 font-bold text-black">الإجمالي</td>
                  <td className="p-4 text-center text-sm bg-gray-200 font-bold">{data?.totalDebit.toLocaleString() || '0'}</td>
                  <td className="p-4 text-center text-sm bg-gray-200 font-bold">{data?.totalCredit.toLocaleString() || '0'}</td>
                  <td className="p-4 text-center text-sm bg-gray-200 font-bold">{data?.totalBalance.toLocaleString() || '0'}</td>
                  <td colSpan={3} className="bg-gray-200"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>

      {/* Add Record Modal */}
      <div id="add-record-modal" className="hidden fixed inset-0 bg-black bg-opacity-85 z-50 flex justify-center items-center">
        <div className="bg-gray-100 rounded-xl shadow-lg p-8 w-full max-w-4xl mx-auto relative" dir="rtl">
          <h2 className="text-center text-xl mb-8 text-gray-700">إضافة سجل</h2>
          <form onSubmit={handleSubmitAddRecord} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col items-end">
                <label className="text-sm text-gray-500 mb-2">التاريخ</label>
                <input name="transactionDate" type="date" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" required />
              </div>

              <div className="flex flex-col items-end">
                <label className="text-sm text-gray-500 mb-2">العميل</label>
                <input name="client" type="text" placeholder="ادخل العميل" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" />
              </div>

              <div className="flex flex-col items-end">
                <label className="text-sm text-gray-500 mb-2">الحساب الرئيسي</label>
                <input name="mainAccount" type="text" placeholder="ادخل الحساب الرئيسي" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" />
              </div>

              <div className="flex flex-col items-end">
                <label className="text-sm text-gray-500 mb-2">الحساب الفرعي</label>
                <input name="subAccount" type="text" placeholder="ادخل الحساب الفرعي" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" />
              </div>

              <div className="flex flex-col items-end">
                <label className="text-sm text-gray-500 mb-2">رصيد المدين</label>
                <input name="debit" type="number" placeholder="ادخل رصيد المدين" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" min="0" step="0.01" />
              </div>

              <div className="flex flex-col items-end">
                <label className="text-sm text-gray-500 mb-2">رصيد الدائن</label>
                <input name="credit" type="number" placeholder="ادخل رصيد الدائن" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" min="0" step="0.01" />
              </div>
            </div>

            <div className="flex flex-col items-end">
              <label className="text-sm text-gray-500 mb-2">المرفقات</label>
              <div className="flex gap-3 w-full justify-start flex-row-reverse">
                <input name="attachment" type="file" id="fileAddRecord" className="hidden" />
                <button type="button" onClick={() => document.getElementById('fileAddRecord')?.click()} className="bg-teal-800 text-white border-none rounded px-5 py-2 text-sm cursor-pointer">اختيار ملف</button>
                <span id="fileNameAdd" className="self-center text-sm text-gray-600"></span>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-5">
              <button type="button" onClick={handleCloseAddModal} className="bg-white text-teal-800 border border-teal-800 rounded w-28 h-10 text-base">إلغاء</button>
              <button type="submit" className="bg-teal-800 text-white border-none rounded w-28 h-10 text-base">إضافة</button>
            </div>
          </form>
        </div>
      </div>

      {/* Edit Record Modal */}
      <div id="edit-modal-bg" className="hidden fixed inset-0 bg-black bg-opacity-85 z-50 flex justify-center items-center">
        <div className="bg-gray-100 rounded-xl shadow-lg p-8 w-full max-w-3xl mx-auto relative" dir="rtl">
          <h2 className="text-center text-xl mb-8 text-gray-700">تعديل سجل</h2>
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col items-end">
                <label className="text-sm text-gray-500 mb-2">التاريخ</label>
                <input type="date" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" />
              </div>

              <div className="flex flex-col items-end">
                <label className="text-sm text-gray-500 mb-2">العميل</label>
                <input type="text" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" />
              </div>

              <div className="flex flex-col items-end">
                <label className="text-sm text-gray-500 mb-2">الحساب الرئيسي</label>
                <input type="text" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" />
              </div>

              <div className="flex flex-col items-end">
                <label className="text-sm text-gray-500 mb-2">الحساب الفرعي</label>
                <input type="text" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" />
              </div>

              <div className="flex flex-col items-end">
                <label className="text-sm text-gray-500 mb-2">رصيد المدين</label>
                <input type="number" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" min="0" step="0.01" />
              </div>

              <div className="flex flex-col items-end">
                <label className="text-sm text-gray-500 mb-2">رصيد الدائن</label>
                <input type="number" className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right" min="0" step="0.01" />
              </div>

              <div className="flex flex-col items-end">
                <label className="text-sm text-gray-500 mb-2">المرفقات</label>
                <div className="flex items-center w-full bg-gray-50 border border-gray-300 rounded overflow-hidden">
                  <input type="text" id="fileNameEdit" readOnly className="flex-1 border-none bg-transparent px-3 py-2 text-sm text-right text-gray-600" />
                  <input type="file" id="fileEditRecord" className="hidden" />
                  <button type="button" onClick={() => document.getElementById('fileEditRecord')?.click()} className="bg-teal-800 text-white border-none px-4 py-2 text-sm cursor-pointer">إدخال</button>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-5">
              <button type="button" className="bg-white text-teal-800 border border-teal-800 rounded w-28 h-10 text-base">إلغاء</button>
              <button type="submit" className="bg-teal-800 text-white border-none rounded w-28 h-10 text-base">حفظ</button>
            </div>
          </form>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          document.getElementById('fileAddRecord')?.addEventListener('change', function(){
            document.getElementById('fileNameAdd').textContent = this.files[0]?.name || '';
          });

          document.getElementById('fileEditRecord')?.addEventListener('change', function(){
            document.getElementById('fileNameEdit').value = this.files[0]?.name || '';
          });

          // Close modals when clicking outside
          document.getElementById('add-record-modal')?.addEventListener('click', function(e) {
            if (e.target === this) {
              this.style.display = 'none';
            }
          });

          document.getElementById('edit-modal-bg')?.addEventListener('click', function(e) {
            if (e.target === this) {
              this.style.display = 'none';
            }
          });

          // Cancel buttons for modals
          document.querySelector('#add-record-modal button[type="button"]').onclick = function() {
            document.getElementById('add-record-modal').style.display = 'none';
          };

          document.querySelector('#edit-modal-bg button[type="button"]').onclick = function() {
            document.getElementById('edit-modal-bg').style.display = 'none';
          };
        `
      }} />
    </div>
    </Layout>
  );
}
