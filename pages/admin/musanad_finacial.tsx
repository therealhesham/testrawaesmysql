import React, { useState, useEffect } from 'react';
import Layout from "example/containers/Layout";
import Head from "next/head";
import jwt from "jsonwebtoken";
import Style from "Styles/Home.module.css"
import { PlusIcon } from '@heroicons/react/outline';
// Types
interface FinancialRecord {
  id: string;
  clientName: string;
  officeName: string;
  nationality: string;
  orderDate: string;
  transferNumber: string;
  transferDate: string;
  revenue: number;
  expenses: number;
  net: number;
  status: string;
}

interface FinancialRecordForm {
  orderNumber: string;
  officeId: string;
  clientName: string;
  nationality: string;
  orderDate: string;
  transferNumber: string;
  transferDate: string;
  revenue: string;
  expenses: string;
  net: string;
}

interface Office {
  id: string;
  office: string;
}

interface Client {
  id: string;
  ClientName: string;
}

// Modal Component
const AddRecordModal = ({ isOpen, onClose, onAdd, offices, clients }: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (record: FinancialRecordForm) => void;
  offices: Office[];
  clients: Client[];
}) => {
  const [formData, setFormData] = useState<FinancialRecordForm>({
    orderNumber: '',
    officeId: '',
    clientName: '',
    nationality: '',
    orderDate: '',
    transferNumber: '',
    transferDate: '',
    revenue: '',
    expenses: '',
    net: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({
      orderNumber: '',
      officeId: '',
      clientName: '',
      nationality: '',
      orderDate: '',
      transferNumber: '',
      transferDate: '',
      revenue: '',
      expenses: '',
      net: ''
    });
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Auto-calculate net amount when revenue or expenses change
      if (name === 'revenue' || name === 'expenses') {
        const revenue = parseFloat(name === 'revenue' ? value : prev.revenue) || 0;
        const expenses = parseFloat(name === 'expenses' ? value : prev.expenses) || 0;
        newData.net = (revenue - expenses).toString();
      }
      
      return newData;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-lg p-4 md:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">إضافة سجل</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">رقم الطلب</label>
            <div className="relative">
              <input
                type="text"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleInputChange}
                placeholder="ادخل رقم الطلب"
                className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 pr-20"
              />
              <button
                type="button"
                className="absolute right-1 top-1 bg-teal-800 text-white px-3 py-1 rounded text-sm"
              >
                بحث
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اسم المكتب</label>
            <select
              name="officeId"
              value={formData.officeId}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
            >
              <option value="">حدد المكتب</option>
              {offices.map(office => (
                <option key={office.id} value={office.id}>{office.office}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اسم العميل</label>
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleInputChange}
              placeholder="ادخل اسم العميل"
              className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الجنسية</label>
            <input
              type="text"
              name="nationality"
              value={formData.nationality}
              onChange={handleInputChange}
              placeholder="ادخل الجنسية"
              className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الطلب</label>
            <input
              type="date"
              name="orderDate"
              value={formData.orderDate}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">رقم الحوالة</label>
            <input
              type="text"
              name="transferNumber"
              value={formData.transferNumber}
              onChange={handleInputChange}
              placeholder="ادخل رقم الحوالة"
              className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الحوالة</label>
            <input
              type="date"
              name="transferDate"
              value={formData.transferDate}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الإيرادات</label>
            <input
              type="number"
              name="revenue"
              value={formData.revenue}
              onChange={handleInputChange}
              placeholder="ادخل قيمة الإيرادات"
              className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المصروفات</label>
            <input
              type="number"
              name="expenses"
              value={formData.expenses}
              onChange={handleInputChange}
              placeholder="ادخل قيمة المصروفات"
              className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الصافي</label>
            <input
              type="number"
              name="net"
              value={formData.net}
              onChange={handleInputChange}
              placeholder=""
              className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>

          <div className="col-span-1 md:col-span-2 flex justify-center gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-teal-800 text-white rounded-md hover:bg-teal-700"
            >
              إضافة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component
export default function MusanadFinancial({ user }: { user: any }) {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [transferDateFilter, setTransferDateFilter] = useState('');
  const [orderDateFilter, setOrderDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const itemsPerPage = 10;

  // Calculate financial summary
  const totalRevenue = records.reduce((sum, record) => sum + record.revenue, 0);
  const totalExpenses = records.reduce((sum, record) => sum + record.expenses, 0);
  const totalNet = totalRevenue - totalExpenses;

  // Fetch data
  useEffect(() => {
    fetchData();
    fetchOffices();
    fetchClients();
  }, [currentPage, searchTerm, transferDateFilter, orderDateFilter]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Build query parameters dynamically
      const params = new URLSearchParams();
      if (searchTerm?.trim()) params.append('search', searchTerm.trim());
      if (transferDateFilter) params.append('transferDate', transferDateFilter);
      if (orderDateFilter) params.append('orderDate', orderDateFilter);
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      const response = await fetch(`/api/financial-records?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Ensure fresh data
      });

      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch financial records:', errorData);
        setRecords([]);
        setTotalPages(0);
        // Show user-friendly error message
        alert(`خطأ في تحميل البيانات: ${errorData.message || 'حدث خطأ غير متوقع'}`);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setRecords([]);
      setTotalPages(0);
      alert('خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOffices = async () => {
    try {
      const response = await fetch('/api/Export/foreignoffices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setOffices(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch offices');
        setOffices([]);
      }
    } catch (error) {
      console.error('Error fetching offices:', error);
      setOffices([]);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/Export/clients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setClients(Array.isArray(data.clients) ? data.clients : []);
      } else {
        console.error('Failed to fetch clients');
        setClients([]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  };

  const handleAddRecord = async (newRecord: FinancialRecordForm) => {
    try {
      // Validate required fields
      if (!newRecord.clientName?.trim() || !newRecord.nationality?.trim() || !newRecord.transferNumber?.trim()) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
      }

      // Validate dates
      if (!newRecord.orderDate || !newRecord.transferDate) {
        alert('يرجى تحديد تاريخ الطلب وتاريخ الحوالة');
        return;
      }

      // Validate numeric fields
      const revenue = parseFloat(newRecord.revenue) || 0;
      const expenses = parseFloat(newRecord.expenses) || 0;
      const netAmount = parseFloat(newRecord.net) || 0;

      if (revenue < 0 || expenses < 0 || netAmount < 0) {
        alert('القيم المالية يجب أن تكون أكبر من أو تساوي الصفر');
        return;
      }

      const response = await fetch('/api/financial-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: newRecord.officeId ? parseInt(newRecord.officeId) : null,
          clientName: newRecord.clientName.trim(),
          officeId: newRecord.officeId ? parseInt(newRecord.officeId) : null,
          officeName: offices.find(o => o.id === newRecord.officeId)?.office || newRecord.clientName.trim(),
          orderNumber: newRecord.orderNumber?.trim() || null,
          nationality: newRecord.nationality.trim(),
          orderDate: newRecord.orderDate,
          transferDate: newRecord.transferDate,
          transferNumber: newRecord.transferNumber.trim(),
          revenue: revenue,
          expenses: expenses,
          netAmount: netAmount,
          status: 'مكتمل',
          createdBy: user?.username || 'غير محدد'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Refresh all data to ensure consistency
        await Promise.all([
          fetchData(),
          fetchOffices(),
          fetchClients()
        ]);
        alert('تم إضافة السجل بنجاح');
      } else {
        const error = await response.json();
        alert(`خطأ في إضافة السجل: ${error.message || 'حدث خطأ غير متوقع'}`);
      }
    } catch (error) {
      console.error('Error adding record:', error);
      alert('حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setTransferDateFilter('');
    setOrderDateFilter('');
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      // Search will be triggered by useEffect when searchTerm changes
    }, 500);
    
    setSearchTimeout(timeout);
  };

  const handleExportExcel = () => {
    if (records.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    try {
      // Create CSV content with proper encoding
      const headers = ['#', 'العميل', 'المكتب الخارجي', 'الجنسية', 'تاريخ الطلب', 'رقم الحوالة', 'تاريخ الحوالة', 'الايرادات', 'المصروفات', 'الصافي', 'حالة الطلب'];
      const csvContent = [
        headers.join(','),
        ...records.map((record, index) => [
          index + 1,
          `"${record.clientName}"`,
          `"${record.officeName}"`,
          `"${record.nationality}"`,
          record.orderDate,
          record.transferNumber,
          record.transferDate,
          record.revenue,
          record.expenses,
          record.net,
          `"${record.status}"`
        ].join(','))
      ].join('\n');

      // Create and download file with BOM for proper Arabic encoding
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `musanad_financial_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('حدث خطأ في تصدير البيانات');
    }
  };

  const handleExportPDF = () => {
    if (records.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const currentDate = new Date().toLocaleDateString('ar-SA');
        const tableContent = `
          <html dir="rtl">
            <head>
              <title>تقرير المالي المساند</title>
              <style>
                body { 
                  font-family: 'Arial', sans-serif; 
                  direction: rtl; 
                  margin: 20px;
                  font-size: 12px;
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                  border-bottom: 2px solid #1A4D4F;
                  padding-bottom: 10px;
                }
                .summary { 
                  margin-bottom: 20px; 
                  background-color: #f5f5f5;
                  padding: 15px;
                  border-radius: 5px;
                }
                .summary div { 
                  display: inline-block; 
                  margin: 0 20px; 
                  font-weight: bold;
                }
                table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin-top: 20px; 
                  font-size: 10px;
                }
                th, td { 
                  border: 1px solid #000; 
                  padding: 6px; 
                  text-align: center; 
                }
                th { 
                  background-color: #1A4D4F; 
                  color: white; 
                  font-weight: bold;
                }
                tr:nth-child(even) {
                  background-color: #f9f9f9;
                }
                .footer {
                  margin-top: 20px;
                  text-align: center;
                  font-size: 10px;
                  color: #666;
                }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>تقرير المالي المساند</h1>
                <p>تاريخ التقرير: ${currentDate}</p>
              </div>
              
              <div class="summary">
                <div>اجمالي الايرادات: ${totalRevenue.toLocaleString()} ريال</div>
                <div>اجمالي المصروفات: ${totalExpenses.toLocaleString()} ريال</div>
                <div>الصافي: ${totalNet.toLocaleString()} ريال</div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>العميل</th>
                    <th>المكتب الخارجي</th>
                    <th>الجنسية</th>
                    <th>تاريخ الطلب</th>
                    <th>رقم الحوالة</th>
                    <th>تاريخ الحوالة</th>
                    <th>الايرادات</th>
                    <th>المصروفات</th>
                    <th>الصافي</th>
                    <th>حالة الطلب</th>
                  </tr>
                </thead>
                <tbody>
                  ${records.map((record, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${record.clientName}</td>
                      <td>${record.officeName}</td>
                      <td>${record.nationality}</td>
                      <td>${record.orderDate}</td>
                      <td>${record.transferNumber}</td>
                      <td>${record.transferDate}</td>
                      <td>${record.revenue.toLocaleString()}</td>
                      <td>${record.expenses.toLocaleString()}</td>
                      <td>${record.net.toLocaleString()}</td>
                      <td>${record.status}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="footer">
                <p>تم إنشاء هذا التقرير تلقائياً من نظام إدارة المالية - ${currentDate}</p>
              </div>
            </body>
          </html>
        `;
        printWindow.document.write(tableContent);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('حدث خطأ في تصدير البيانات');
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 border rounded text-sm ${
            i === currentPage
              ? 'border-teal-800 bg-teal-800 text-white'
              : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex justify-between items-center mt-6">
        <span className="text-sm text-gray-600">
          عرض {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, records.length)} من {records.length} نتيجة
        </span>
        <nav className="flex gap-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            السابق
          </button>
          {pages}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            التالي
          </button>
        </nav>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>نظام إدارة مالية - وصل للاستقدام</title>
      </Head>
      
      <Layout>
        <div className={`${Style["tajawal-regular"]} min-h-screen bg-gray-50`} dir="rtl">

          {/* Content */}
          <div className="p-8">
            {/* Page Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-normal text-black flex justif-end">تقرير المالي المساند</h2>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 bg-teal-800 text-white px-3 py-2 rounded text-sm hover:bg-teal-700"
                >
                  <span className="text-md">اضافة سجل</span>
                  <PlusIcon className='w-4 h-4'/>
                </button>
         
              </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-8">
              <div className="bg-gray-50 rounded-lg p-5 text-center w-full bg-white shadow-md  sm:w-auto min-w-[200px] md:min-w-[237px] shadow-sm">
                <div className="text-base font-normal text-gray-800 mb-2">اجمالي الايرادات</div>
                <div className="text-base font-normal text-gray-800">{totalRevenue.toLocaleString()}</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-5 text-center w-full sm:w-auto bg-white shadow-md min-w-[200px] md:min-w-[237px] shadow-sm">
                <div className="text-base font-normal text-gray-800 mb-2">اجمالي المصروفات</div>
                <div className="text-base font-normal text-gray-800">{totalExpenses.toLocaleString()}</div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-5 text-center w-full sm:w-auto bg-white shadow-md min-w-[200px] md:min-w-[237px] shadow-sm">
                <div className="text-base font-normal text-gray-800 mb-2">الصافي</div>
                <div className="text-base font-normal text-gray-800">{totalNet.toLocaleString()}</div>
              </div>
            </div>



              <div className="flex flex-wrap items-end gap-4 mb-4">
                  <div className="flex flex-col gap-2">
                  <label className="text-md text-gray-800">بحث</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="بحث"
                    className="bg-gray-50 border border-gray-200 rounded px-4 py-2 w-full sm:w-64 text-sm text-gray-500"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-md text-gray-800">تاريخ الطلب</label>
                  <input
                    type="date"
                    value={orderDateFilter}
                    onChange={(e) => setOrderDateFilter(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded px-3 py-2 w-full sm:w-52 text-md text-gray-500"
                  />
                </div>
                
              
                <div className="flex flex-col gap-2">
                  <label className="text-md text-gray-800">تاريخ الحوالة</label>
                  <input
                    type="date"
                    value={transferDateFilter}
                    onChange={(e) => setTransferDateFilter(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded px-3 py-2 w-full sm:w-52 text-md text-gray-500"
                  />
                </div>
                
                              <div className="flex flex-col gap-2">
                
                  <svg className="w-1 h-2 text-gray-500" fill="currentColor" viewBox="0 0 10 20">
                    <path d="M5 2l5 3-5 3V2z"/>
                  </svg>
                  <span className="text-md text-gray-500">كل الاعمدة</span>
                </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={resetFilters}
                  className="bg-teal-800 text-white px-3 py-1 rounded text-sm hover:bg-teal-700"
                >
                  اعادة ضبط
                </button>
              </div>

             
            </div>
 <div className="flex gap-1 justify-end">
                <button 
                  onClick={handleExportExcel}
                  className="bg-teal-800 text-white px-2 py-1 rounded text-md w-16 hover:bg-teal-700"
                >
                  Excel
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="bg-teal-800 text-white px-2 py-1 rounded text-md w-14 hover:bg-teal-700"
                >
                  PDF
                </button>
              </div>
            {/* Data Table */}
            <div className="bg-gray-50 border border-gray-200 rounded overflow-hidden">
              {/* Table Header */}
              <div className="bg-teal-800 text-white flex items-center p-4 gap-2 md:gap-9 overflow-x-auto">
                <div className="text-md md:text-md font-normal flex-1 text-center min-w-[40px]">#</div>
                <div className="text-md md:text-md font-normal flex-1 text-center min-w-[120px]">العميل</div>
                <div className="text-md md:text-md font-normal flex-1 text-center min-w-[100px]">المكتب الخارجي</div>
                <div className="text-md md:text-md font-normal flex-1 text-center min-w-[80px]">الجنسية</div>
                <div className="text-md md:text-md font-normal flex-1 text-center min-w-[100px]">تاريخ الطلب</div>
                <div className="text-md md:text-md font-normal flex-1 text-center min-w-[100px]">رقم الحوالة</div>
                <div className="text-md md:text-md font-normal flex-1 text-center min-w-[100px]">تاريخ الحوالة</div>
                <div className="text-md md:text-md font-normal flex-1 text-center min-w-[100px]">الايرادات(مساند)</div>
                <div className="text-md md:text-md font-normal flex-1 text-center min-w-[150px]">المصروفات (التكاليف المباشرة + العمولة + الضريبة)</div>
                <div className="text-md md:text-md font-normal flex-1 text-center min-w-[80px]">الصافي</div>
                <div className="text-md md:text-md font-normal flex-1 text-center min-w-[100px]">حالة الطلب</div>
              </div>

              {/* Table Rows */}
              {loading ? (
                <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
              ) : records.length === 0 ? (
                <div className="p-8 text-center text-gray-500">لا توجد بيانات</div>
              ) : (
                records.map((record, index) => (
                  <div key={record.id} className="bg-gray-50 border-b border-gray-200 flex items-center p-4 gap-2 md:gap-9 hover:bg-gray-100 overflow-x-auto">
                    <div className="text-md md:text-md text-gray-800 flex-1 text-center min-w-[40px]">#{index + 1}</div>
                    <div className="text-md md:text-md text-gray-800 flex-1 text-center min-w-[120px]">{record.clientName}</div>
                    <div className="text-md md:text-md text-gray-800 flex-1 text-center min-w-[100px]">{record.officeName}</div>
                    <div className="text-md md:text-md text-gray-800 flex-1 text-center min-w-[80px]">{record.nationality}</div>
                    <div className="text-md md:text-md text-gray-800 flex-1 text-center min-w-[100px]">{record.orderDate}</div>
                    <div className="text-md md:text-md text-gray-800 flex-1 text-center min-w-[100px]">{record.transferNumber}</div>
                    <div className="text-md md:text-md text-gray-800 flex-1 text-center min-w-[100px]">{record.transferDate}</div>
                    <div className="text-md md:text-md text-gray-800 flex-1 text-center min-w-[100px]">{record.revenue.toLocaleString()}</div>
                    <div className="text-md md:text-md text-gray-800 flex-1 text-center min-w-[150px]">{record.expenses.toLocaleString()}</div>
                    <div className="text-md md:text-md text-gray-800 flex-1 text-center min-w-[80px]">{record.net.toLocaleString()}</div>
                    <div className="text-md md:text-md text-gray-800 flex-1 text-center min-w-[100px]">{record.status}</div>
                  </div>
                ))
              )}

              {/* Table Footer */}
              <div className="bg-gray-50 border-t border-gray-800 flex items-center p-4 gap-2 md:gap-9 overflow-x-auto">
                <div className="text-sm md:text-base font-normal text-gray-800 mr-auto">الاجمالي</div>
                <div className="text-md md:text-md text-gray-800 flex-1 text-center min-w-[100px]">{totalRevenue.toLocaleString()}</div>
                <div className="text-md md:text-md text-gray-800 flex-1 text-center min-w-[150px]">{totalExpenses.toLocaleString()}</div>
                <div className="text-md md:text-md text-gray-800 flex-1 text-center min-w-[80px]">{totalNet.toLocaleString()}</div>
              </div>
            </div>

            {/* Pagination */}
            {renderPagination()}
          </div>

          {/* Modal */}
          <AddRecordModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onAdd={handleAddRecord}
            offices={offices}
            clients={clients}
          />
        </div>
      </Layout>
    </>
  );
}

// Server-side data fetching with JWT token decoding
export async function getServerSideProps(context: any) {
  const { req } = context;

  try {
    const isAuthenticated = req.cookies.authToken ? true : false;
    if (!isAuthenticated) {
      return {
        redirect: {
          destination: "/admin/login",
          permanent: false,
        },
      };
    }

    const user = jwt.verify(req.cookies.authToken, "rawaesecret");

    return {
      props: {
        user,
      },
    };
  } catch (error) {
    console.log("Error in getServerSideProps:", error);
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }
}
