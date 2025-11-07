import React, { useState, useEffect } from 'react';
import Layout from 'example/containers/Layout';
import Style from 'styles/Home.module.css';

interface Employee {
  id: number;
  name: string;
  position: string | null;
  department: string | null;
  phoneNumber: string | null;
  email: string | null;
  nationalId: string | null;
  address: string | null;
  hireDate: string | null;
  salary: number | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    employeeCash: number;
    employeeCashDetails: number;
  };
}

interface EmployeeFormData {
  name: string;
  position: string;
  department: string;
  phoneNumber: string;
  email: string;
  nationalId: string;
  address: string;
  hireDate: string;
  salary: string;
  notes: string;
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [departments, setDepartments] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    position: '',
    department: '',
    phoneNumber: '',
    email: '',
    nationalId: '',
    address: '',
    hireDate: '',
    salary: '',
    notes: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, [searchTerm, departmentFilter, positionFilter, isActiveFilter]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (departmentFilter !== 'all') params.append('department', departmentFilter);
      if (positionFilter !== 'all') params.append('position', positionFilter);
      if (isActiveFilter !== 'all') params.append('isActive', isActiveFilter);

      const response = await fetch(`/api/employees?${params.toString()}`);
      const result = await response.json();
      
      if (result.employees) {
        setEmployees(result.employees);
        setDepartments(result.filters?.departments || []);
        setPositions(result.filters?.positions || []);
      }
  } catch (error) {
      console.error('Error fetching employees:', error);
      showNotification('حدث خطأ أثناء جلب الموظفين', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddEmployee = () => {
    setIsAddModalOpen(true);
    setFormData({
      name: '',
      position: '',
      department: '',
      phoneNumber: '',
      email: '',
      nationalId: '',
      address: '',
      hireDate: '',
      salary: '',
      notes: ''
    });
    setFormErrors({});
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      position: '',
      department: '',
      phoneNumber: '',
      email: '',
      nationalId: '',
      address: '',
      hireDate: '',
      salary: '',
      notes: ''
    });
    setFormErrors({});
  };

  const handleFormFieldChange = (field: keyof EmployeeFormData, value: string) => {
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'اسم الموظف مطلوب';
    }
    
    // Email validation if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'البريد الإلكتروني غير صحيح';
    }
    
    // Phone validation if provided
    if (formData.phoneNumber && !/^[0-9+\-\s()]+$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'رقم الهاتف غير صحيح';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const submitData = {
        name: formData.name.trim(),
        position: formData.position.trim() || null,
        department: formData.department.trim() || null,
        phoneNumber: formData.phoneNumber.trim() || null,
        email: formData.email.trim() || null,
        nationalId: formData.nationalId.trim() || null,
        address: formData.address.trim() || null,
        hireDate: formData.hireDate || null,
        salary: formData.salary ? Number(formData.salary) : null,
        notes: formData.notes.trim() || null
      };
      
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      if (response.ok) {
        handleCloseAddModal();
        fetchEmployees();
        showNotification('تم إضافة الموظف بنجاح', 'success');
      } else {
        const errorData = await response.json();
        showNotification(errorData.error || 'حدث خطأ أثناء إضافة الموظف', 'error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showNotification('حدث خطأ أثناء إضافة الموظف', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployee) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/employees?id=${selectedEmployee.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        handleCloseDeleteModal();
        fetchEmployees();
        showNotification('تم حذف الموظف بنجاح', 'success');
      } else {
        const errorData = await response.json();
        showNotification(errorData.error || 'حدث خطأ أثناء حذف الموظف', 'error');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      showNotification('حدث خطأ أثناء حذف الموظف', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return amount.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' });
  };

  if (loading) {
    return (
      <Layout>
        <div className={`min-h-screen bg-gray-50 ${Style['tajawal-regular']} flex justify-center items-center`} dir="rtl">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </Layout>
    );
  }

return (
    <Layout>
      <div className={`min-h-screen bg-gray-50 ${Style['tajawal-regular']}`} dir="rtl">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 left-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            {notification.message}
          </div>
        )}

        {/* Page Content */}
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <button 
              onClick={handleAddEmployee}
              className="bg-teal-800 text-white border-none rounded px-4 py-2 flex items-center gap-2 text-md cursor-pointer hover:bg-teal-700"
            >
              <span>إضافة موظف</span>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M4 1v6M1 4h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <h2 className="text-3xl font-normal text-black text-right">إدارة الموظفين</h2>
      </div>

          {/* Filters Section */}
          <section className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="flex flex-col gap-2">
                <label className="text-md text-gray-700 text-right">البحث</label>
                <input 
                  type="text" 
                  placeholder="ابحث بالاسم، الهاتف، البريد، أو الهوية..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-100 border border-gray-300 rounded px-4 py-2 text-md text-gray-500 text-right"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-md text-gray-700 text-right">القسم</label>
                <select 
                  className="w-full bg-gray-100 border border-gray-300 rounded  py-2 text-md text-gray-500 text-right"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="all">جميع الأقسام</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-md text-gray-700 text-right">المنصب</label>
                <select 
                  className="w-full bg-gray-100 border border-gray-300 rounded  py-2 text-md text-gray-500 text-right"
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                >
                  <option value="all">جميع المناصب</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-md text-gray-700 text-right">الحالة</label>
                <select 
                  className="w-full bg-gray-100 border border-gray-300 rounded  py-2 text-md text-gray-500 text-right"
                  value={isActiveFilter}
                  onChange={(e) => setIsActiveFilter(e.target.value)}
                >
                  <option value="all">الكل</option>
                  <option value="true">نشط</option>
                  <option value="false">غير نشط</option>
                </select>
              </div>
            </div>
          </section>

          {/* Table Section */}
          <section className="bg-gray-50 border border-gray-300 rounded-lg shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr>
                    <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">#</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">الاسم</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">المنصب</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">القسم</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">الهاتف</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">البريد الإلكتروني</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">الراتب</th>
                    <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">تاريخ التوظيف</th>
                    {/* <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">الحالة</th> */}
                    <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-md text-gray-500">
                        لا توجد موظفين
                      </td>
                    </tr>
                  ) : (
                    employees.map((employee, index) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">
                          {index + 1}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">
                          {employee.name}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">
                          {employee.position || '-'}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">
                          {employee.department || '-'}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">
                          {employee.phoneNumber || '-'}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">
                          {employee.email || '-'}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">
                          {formatCurrency(employee.salary)}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">
                          {formatDate(employee.hireDate)}
                        </td>
                        {/* <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            employee.isActive 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {employee.isActive ? 'نشط' : 'غير نشط'}
                          </span>
                        </td> */}
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">
                          <button
                            onClick={() => handleDeleteClick(employee)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                            disabled={employee._count.employeeCash > 0 || employee._count.employeeCashDetails > 0}
                            title={employee._count.employeeCash > 0 || employee._count.employeeCashDetails > 0 
                              ? 'لا يمكن حذف الموظف لأنه يحتوي على سجلات عهدة مرتبطة' 
                              : 'حذف الموظف'}
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Add Employee Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-85 z-50 flex justify-center items-center" onClick={handleCloseAddModal}>
            <div className="bg-gray-100 rounded-xl shadow-lg p-8 w-full max-w-3xl mx-auto relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-center text-xl mb-8 text-gray-700">إضافة موظف جديد</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col items-end">
                    <label className="text-md text-gray-500 mb-2">اسم الموظف <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="ادخل اسم الموظف" 
                      value={formData.name}
                      onChange={(e) => handleFormFieldChange('name', e.target.value)}
                      className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {formErrors.name && (
                      <span className="text-red-500 text-sm mt-1">{formErrors.name}</span>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <label className="text-md text-gray-500 mb-2">المنصب</label>
                    <input 
                      type="text" 
                      placeholder="ادخل المنصب" 
                      value={formData.position}
                      onChange={(e) => handleFormFieldChange('position', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right"
                    />
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <label className="text-md text-gray-500 mb-2">القسم</label>
                    <input 
                      type="text" 
                      placeholder="ادخل القسم" 
                      value={formData.department}
                      onChange={(e) => handleFormFieldChange('department', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right"
                    />
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <label className="text-md text-gray-500 mb-2">رقم الهاتف</label>
                    <input 
                      type="tel" 
                      placeholder="05xxxxxxxx" 
                      value={formData.phoneNumber}
                      onChange={(e) => handleFormFieldChange('phoneNumber', e.target.value)}
                      className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                        formErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.phoneNumber && (
                      <span className="text-red-500 text-sm mt-1">{formErrors.phoneNumber}</span>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <label className="text-md text-gray-500 mb-2">البريد الإلكتروني</label>
                    <input 
                      type="email" 
                      placeholder="example@email.com" 
                      value={formData.email}
                      onChange={(e) => handleFormFieldChange('email', e.target.value)}
                      className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                        formErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.email && (
                      <span className="text-red-500 text-sm mt-1">{formErrors.email}</span>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <label className="text-md text-gray-500 mb-2">الهوية الوطنية</label>
                    <input 
                      type="text" 
                      placeholder="ادخل الهوية الوطنية" 
                      value={formData.nationalId}
                      onChange={(e) => handleFormFieldChange('nationalId', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right"
                    />
                  </div>
                  
                  <div className="flex flex-col items-end col-span-2">
                    <label className="text-md text-gray-500 mb-2">العنوان</label>
                    <input 
                      type="text" 
                      placeholder="ادخل العنوان" 
                      value={formData.address}
                      onChange={(e) => handleFormFieldChange('address', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right"
                    />
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <label className="text-md text-gray-500 mb-2">تاريخ التوظيف</label>
                    <input 
                      type="date" 
                      value={formData.hireDate}
                      onChange={(e) => handleFormFieldChange('hireDate', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right"
                    />
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <label className="text-md text-gray-500 mb-2">الراتب</label>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={formData.salary}
                      onChange={(e) => handleFormFieldChange('salary', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="flex flex-col items-end col-span-2">
                    <label className="text-md text-gray-500 mb-2">ملاحظات</label>
                    <textarea 
                      placeholder="ادخل الملاحظات (اختياري)" 
                      value={formData.notes}
                      onChange={(e) => handleFormFieldChange('notes', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-center gap-4 mt-5">
                  <button 
                    type="button" 
                    onClick={handleCloseAddModal}
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

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-200 rounded-lg p-6 w-full max-w-sm text-center" dir="rtl">
              <p className="text-base mb-5">
                هل أنت متأكد أنك تريد حذف الموظف "{selectedEmployee.name}"؟
              </p>
              {(selectedEmployee._count.employeeCash > 0 || selectedEmployee._count.employeeCashDetails > 0) && (
                <p className="text-red-600 text-sm mb-5">
                  تحذير: هذا الموظف يحتوي على سجلات عهدة مرتبطة ولا يمكن حذفه
                </p>
              )}
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleConfirmDelete}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  disabled={isSubmitting || selectedEmployee._count.employeeCash > 0 || selectedEmployee._count.employeeCashDetails > 0}
                >
                  {isSubmitting ? 'جاري الحذف...' : 'تأكيد الحذف'}
                </button>
                <button
                  onClick={handleCloseDeleteModal}
                  className="bg-white text-teal-800 border border-teal-800 px-5 py-2 rounded text-sm hover:bg-gray-100"
                  disabled={isSubmitting}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
