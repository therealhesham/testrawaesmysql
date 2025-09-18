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

// Form data interface matching the EmployeeCash model
export interface EmployeeCashFormData {
  employeeId: number | '';
  cashNumber: string;
  receivedAmount: number | '';
  expenseAmount: number | '';
  description: string;
  attachment: File | null;
  transactionDate: string;
}

// Employee interface for dropdown
export interface EmployeeOption {
  id: number;
  name: string;
  position?: string;
  department?: string;
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
  
  // Form state management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EmployeeCashFormData>({
    employeeId: '',
    cashNumber: '',
    receivedAmount: '',
    expenseAmount: '',
    description: '',
    attachment: null,
    transactionDate: new Date().toISOString().split('T')[0]
  });
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchEmployeeCashData();
    fetchEmployees();
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

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const result = await response.json();
      setEmployees(result.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleEmployeeClick = (employeeId: number) => {
    router.push(`/admin/employee_cash/${employeeId}`);
  };

  const handleAddCash = () => {
    setIsModalOpen(true);
    // Reset form data when opening modal
    setFormData({
      employeeId: '',
      cashNumber: '',
      receivedAmount: '',
      expenseAmount: '',
      description: '',
      attachment: null,
      transactionDate: new Date().toISOString().split('T')[0]
    });
    setFormErrors({});
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Reset form data when closing modal
    setFormData({
      employeeId: '',
      cashNumber: '',
      receivedAmount: '',
      expenseAmount: '',
      description: '',
      attachment: null,
      transactionDate: new Date().toISOString().split('T')[0]
    });
    setFormErrors({});
  };

  // Form field handlers with two-way binding
  const handleFormFieldChange = (field: keyof EmployeeCashFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const { [field]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleFormFieldChange('attachment', file);
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.employeeId) {
      errors.employeeId = 'الموظف مطلوب';
    }
    
    if (!formData.cashNumber.trim()) {
      errors.cashNumber = 'رقم العهدة مطلوب';
    }
    
    if (formData.receivedAmount === '' || formData.receivedAmount <= 0) {
      errors.receivedAmount = 'المبلغ المستلم مطلوب ويجب أن يكون أكبر من صفر';
    }
    
    if (formData.expenseAmount === '' || formData.expenseAmount < 0) {
      errors.expenseAmount = 'المصروف مطلوب ويجب أن يكون أكبر من أو يساوي صفر';
    }
    
    if (!formData.transactionDate) {
      errors.transactionDate = 'التاريخ مطلوب';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission
  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare form data for API
      const submitData = {
        employeeId: Number(formData.employeeId),
        cashNumber: formData.cashNumber,
        receivedAmount: Number(formData.receivedAmount),
        expenseAmount: Number(formData.expenseAmount),
        description: formData.description,
        attachment: formData.attachment?.name || ''
      };
      
      const response = await fetch('/api/employee-cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      if (response.ok) {
        // Success - close modal and refresh data
        handleCloseModal();
        fetchEmployeeCashData();
        alert('تم إضافة العهدة بنجاح');
      } else {
        const errorData = await response.json();
        alert(`خطأ: ${errorData.error || 'حدث خطأ أثناء إضافة العهدة'}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('حدث خطأ أثناء إضافة العهدة');
    } finally {
      setIsSubmitting(false);
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
                  className="w-full bg-gray-100 border border-gray-300 rounded  text-md text-gray-500 text-right appearance-none"
                  value={filters.employee}
                  onChange={(e) => setFilters({...filters, employee: e.target.value})}
                >
                  <option value="">اختر الموظف</option>
                  {data?.employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
                {/* <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none w-4 h-4" viewBox="0 0 17 17" fill="none">
                  <path d="M4 6l4.5 4.5L13 6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg> */}
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
                {/* <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="3" width="12" height="11" rx="2" ry="2" stroke="#6B7280" strokeWidth="2"/>
                  <path d="M11 1v4M5 1v4M2 7h12" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
                </svg> */}
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-85 z-50 flex justify-center items-center" onClick={handleCloseModal}>
          <div className="bg-gray-100 rounded-xl shadow-lg p-8 w-full max-w-2xl mx-auto relative" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-center text-xl mb-8 text-gray-700">إضافة عهدة</h2>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">التاريخ</label>
                  <input 
                    type="date" 
                    value={formData.transactionDate}
                    onChange={(e) => handleFormFieldChange('transactionDate', e.target.value)}
                    className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                      formErrors.transactionDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.transactionDate && (
                    <span className="text-red-500 text-sm mt-1">{formErrors.transactionDate}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">الموظف</label>
                  <select 
                    value={formData.employeeId}
                    onChange={(e) => handleFormFieldChange('employeeId', e.target.value)}
                    className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                      formErrors.employeeId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">اختر الموظف</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                  {formErrors.employeeId && (
                    <span className="text-red-500 text-sm mt-1">{formErrors.employeeId}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">رقم العهدة</label>
                  <input 
                    type="text" 
                    placeholder="ادخل رقم العهدة" 
                    value={formData.cashNumber}
                    onChange={(e) => handleFormFieldChange('cashNumber', e.target.value)}
                    className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                      formErrors.cashNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.cashNumber && (
                    <span className="text-red-500 text-sm mt-1">{formErrors.cashNumber}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">المبلغ المستلم</label>
                  <input 
                    type="number" 
                    placeholder="ادخل المبلغ المستلم" 
                    value={formData.receivedAmount}
                    onChange={(e) => handleFormFieldChange('receivedAmount', e.target.value ? Number(e.target.value) : '')}
                    className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                      formErrors.receivedAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="0"
                    step="0.01"
                  />
                  {formErrors.receivedAmount && (
                    <span className="text-red-500 text-sm mt-1">{formErrors.receivedAmount}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">المصروف</label>
                  <input 
                    type="number" 
                    placeholder="ادخل المصروف" 
                    value={formData.expenseAmount}
                    onChange={(e) => handleFormFieldChange('expenseAmount', e.target.value ? Number(e.target.value) : '')}
                    className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                      formErrors.expenseAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="0"
                    step="0.01"
                  />
                  {formErrors.expenseAmount && (
                    <span className="text-red-500 text-sm mt-1">{formErrors.expenseAmount}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">البيان</label>
                  <input 
                    type="text" 
                    placeholder="ادخل البيان" 
                    value={formData.description}
                    onChange={(e) => handleFormFieldChange('description', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right"
                  />
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <label className="text-md text-gray-500 mb-2">المرفقات</label>
                <div className="flex gap-3 w-full justify-start flex-row-reverse">
                  <input 
                    type="file" 
                    id="fileUpload" 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <button 
                    type="button" 
                    onClick={() => document.getElementById('fileUpload')?.click()} 
                    className="bg-teal-800 text-white border-none rounded px-5 py-2 text-md cursor-pointer"
                  >
                    اختيار ملف
                  </button>
                  <span className="self-center text-md text-gray-600">
                    {formData.attachment ? formData.attachment.name : 'لم يتم اختيار ملف'}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-center gap-4 mt-5">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="bg-white text-teal-800 border border-teal-800 rounded w-28 h-10 text-base"
                  disabled={isSubmitting}
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="bg-teal-800 text-white border-none rounded w-28 h-10 text-base disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'جاري الإضافة...' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    
</Layout>
  );
}
