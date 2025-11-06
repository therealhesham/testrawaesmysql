import React, { useState, useEffect } from 'react';
import Layout from "example/containers/Layout";
import Head from "next/head";
import jwt from "jsonwebtoken";
import Style from "styles/Home.module.css"
import { PlusIcon } from '@heroicons/react/outline';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { jwtDecode } from 'jwt-decode';
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

  // خريطة لتحويل أسماء الحقول الإنجليزية إلى أسماء عربية
  const fieldNames: { [key: string]: string } = {
    'officeLinkInfo': 'الربط مع إدارة المكاتب',
    'externalOfficeInfo': 'المكتب الخارجي',
    'externalOfficeApproval': 'موافقة المكتب الخارجي',
    'medicalCheck': 'الفحص الطبي',
    'foreignLaborApproval': 'موافقة وزارة العمل الأجنبية',
    'agencyPayment': 'دفع الوكالة',
    'saudiEmbassyApproval': 'موافقة السفارة السعودية',
    'visaIssuance': 'إصدار التأشيرة',
    'travelPermit': 'تصريح السفر',
    'destinations': 'الوجهات',
    'receipt': 'الاستلام',
    'ticketUpload': 'رفع المستندات'
  };
interface FinancialRecordForm {
  orderId: string;
  orderNumber: string;
  officeId: string;
  clientName: string;
  clientId: string;
  nationality: string;
  orderDate: string;
  transferNumber: string;
  transferDate: string;
  revenue: string;
  expenses: string;
  net: string;
}

interface Order {
  id: number;
  clientName: string;
  clientId: number;
  phoneNumber: string;
  maidName: string;
  maidNationality: string;
  maidId: number;
  bookingStatus: string;
  profileStatus: string;
  createdAt: string;
}

interface Office {
  id: string;
  office: string;
}

interface Client {
  id: string;
  ClientName: string;
}

// Alert Modal Component
const AlertModal = ({ isOpen, onClose, title, message, type = 'info' }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="text-center">
          {getIcon()}
          <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-white rounded-md ${getButtonColor()} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${type === 'success' ? 'green' : type === 'error' ? 'red' : type === 'warning' ? 'yellow' : 'blue'}-500`}
          >
            موافق
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal Component
const AddRecordModal = ({ isOpen, onClose, onAdd, offices, clients }: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (record: FinancialRecordForm) => void;
  offices: Office[];
  clients: Client[];
}) => {
  const [formData, setFormData] = useState<FinancialRecordForm>({
    orderId: '',
    orderNumber: '',
    officeId: '',
    clientName: '',
    clientId: '',
    nationality: '',
    orderDate: '',
    transferNumber: '',
    transferDate: '',
    revenue: '',
    expenses: '',
    net: ''
  });

  const [orderSearch, setOrderSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setSearchResults([]);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({
      orderId: '',
      orderNumber: '',
      officeId: '',
      clientName: '',
      clientId: '',
      nationality: '',
      orderDate: '',
      transferNumber: '',
      transferDate: '',
      revenue: '',
      expenses: '',
      net: ''
    });
    setOrderSearch('');
    setSearchResults([]);
    setSelectedOrder(null);
    onClose();
  };

  const searchOrders = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/orders/search?search=${encodeURIComponent(searchTerm)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.orders || []);
      } else {
        console.error('Error searching orders');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching orders:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOrderSearch = (value: string) => {
    setOrderSearch(value);
    if (value.trim()) {
      searchOrders(value);
    } else {
      setSearchResults([]);
      setSelectedOrder(null);
    }
  };

  const selectOrder = (order: Order) => {
    setSelectedOrder(order);
    setFormData(prev => ({
      ...prev,
      orderId: order.id.toString(),
      orderNumber: order.id.toString(),
      clientName: order.clientName,
      clientId: order.clientId.toString(),
      nationality: order.maidNationality
    }));
    setSearchResults([]);
    setOrderSearch('');
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
          {/* Order Search */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">البحث عن الطلب</label>
            <div className="relative search-container">
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => handleOrderSearch(e.target.value)}
                placeholder="ابحث برقم الطلب أو اسم العميل"
                className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
              />
              {isSearching && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                </div>
              )}
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => selectOrder(order)}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                    >
                      <div className="font-medium text-sm">طلب #{order.id}</div>
                      <div className="text-xs text-gray-600">العميل: {order.clientName}</div>
                      <div className="text-xs text-gray-600">الجنسية: {order.maidNationality}</div>
                      <div className="text-xs text-gray-500">الهاتف: {order.phoneNumber}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Order Display */}
          {selectedOrder && (
            <div className="col-span-1 md:col-span-2 bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium text-green-800">الطلب المحدد:</div>
                  <div className="text-sm text-green-700">#{selectedOrder.id} - {selectedOrder.clientName}</div>
                  <div className="text-xs text-green-600">الجنسية: {selectedOrder.maidNationality}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(null);
                    setFormData(prev => ({
                      ...prev,
                      orderId: '',
                      orderNumber: '',
                      clientName: '',
                      clientId: '',
                      nationality: ''
                    }));
                  }}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اسم المكتب</label>
            <select
              name="officeId"
              value={formData.officeId}
              onChange={handleInputChange}
              className="w-full  border border-gray-300 rounded-md bg-gray-50"
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
              className={`w-full p-3 border border-gray-300 rounded-md ${selectedOrder ? 'bg-gray-100' : 'bg-gray-50'}`}
              readOnly={!!selectedOrder}
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
              className={`w-full p-3 border border-gray-300 rounded-md ${selectedOrder ? 'bg-gray-100' : 'bg-gray-50'}`}
              readOnly={!!selectedOrder}
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
  const [userName, setUserName] = useState('');
  
  // Alert Modal state
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info'
  });

  const itemsPerPage = 10;

  // Helper function to show alert modal
  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      type
    });
  };

  // Calculate financial summary
  const totalRevenue = records.reduce((sum, record) => sum + record.revenue, 0);
  const totalExpenses = records.reduce((sum, record) => sum + record.expenses, 0);
  const totalNet = totalRevenue - totalExpenses;

  // Set userName from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token) as any;
        setUserName(decoded.username || user?.username || '');
      } catch (error) {
        setUserName(user?.username || '');
      }
    } else {
      setUserName(user?.username || '');
    }
  }, [user]);

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
        showAlert('خطأ في تحميل البيانات', errorData.message || 'حدث خطأ غير متوقع', 'error');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setRecords([]);
      setTotalPages(0);
      showAlert('خطأ في الاتصال', 'خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.', 'error');
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
        showAlert('حقول مطلوبة', 'يرجى ملء جميع الحقول المطلوبة', 'warning');
        return;
      }

      // Validate dates
      if (!newRecord.orderDate || !newRecord.transferDate) {
        showAlert('تواريخ مطلوبة', 'يرجى تحديد تاريخ الطلب وتاريخ الحوالة', 'warning');
        return;
      }

      // Validate numeric fields
      const revenue = parseFloat(newRecord.revenue) || 0;
      const expenses = parseFloat(newRecord.expenses) || 0;
      const netAmount = parseFloat(newRecord.net) || 0;

      if (revenue < 0 || expenses < 0 || netAmount < 0) {
        showAlert('قيم غير صحيحة', 'القيم المالية يجب أن تكون أكبر من أو تساوي الصفر', 'warning');
        return;
      }

      const response = await fetch('/api/financial-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Relations
          clientId: newRecord.clientId ? parseInt(newRecord.clientId) : null,
          orderId: newRecord.orderId ? parseInt(newRecord.orderId) : null,
          officeId: newRecord.officeId ? parseInt(newRecord.officeId) : null,
          
          // Display fields
          clientName: newRecord.clientName.trim(),
          officeName: offices.find(o => o.id === newRecord.officeId)?.office || 'غير محدد',
          orderNumber: newRecord.orderNumber?.trim() || null,
          nationality: newRecord.nationality.trim(),
          
          // Dates and financial data
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
        showAlert('تم بنجاح', 'تم إضافة السجل بنجاح', 'success');
      } else {
        const error = await response.json();
        showAlert('خطأ في الإضافة', error.message || 'حدث خطأ غير متوقع', 'error');
      }
    } catch (error) {
      console.error('Error adding record:', error);
      showAlert('خطأ في الاتصال', 'حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.', 'error');
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

  // Fetch all data for export
  const fetchFilteredDataExporting = async () => {
    const query = new URLSearchParams({
      limit: "1000",
      page: "1",
      ...(searchTerm && { search: searchTerm }),
      ...(transferDateFilter && { transferDate: transferDateFilter }),
      ...(orderDateFilter && { orderDate: orderDateFilter }),
    }).toString();
    const res = await fetch(`/api/financial-records?${query}`);
    
    if (!res.ok) throw new Error("Failed to fetch data");
    const data = await res.json();
    return data.records || [];
  };

  const handleExportExcel = async () => {
    try {
      let dataToExport = await fetchFilteredDataExporting();

      if (dataToExport.length === 0) {
        showAlert('لا توجد بيانات', 'لا توجد بيانات للتصدير', 'warning');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('تقرير المالي المساند', { properties: { defaultColWidth: 20 } });

      worksheet.columns = [
        { header: 'رقم الطلب', key: 'id', width: 15 },
        { header: 'العميل', key: 'clientName', width: 20 },
        { header: 'المكتب الخارجي', key: 'officeName', width: 20 },
        { header: 'الجنسية', key: 'nationality', width: 15 },
        { header: 'تاريخ الطلب', key: 'orderDate', width: 15 },
        { header: 'رقم الحوالة', key: 'transferNumber', width: 15 },
        { header: 'تاريخ الحوالة', key: 'transferDate', width: 15 },
        { header: 'الايرادات', key: 'revenue', width: 15 },
        { header: 'المصروفات', key: 'expenses', width: 15 },
        { header: 'الصافي', key: 'net', width: 15 },
        { header: 'حالة الطلب', key: 'status', width: 15 },
      ];

      worksheet.getRow(1).font = { name: 'Amiri', size: 12 };
      worksheet.getRow(1).alignment = { horizontal: 'right' };

      dataToExport.forEach((record: any) => {
        worksheet.addRow({
          id: record.id || 'غير متوفر',
          clientName: record.clientName || 'غير متوفر',
          officeName: record.officeName || 'غير متوفر',
          nationality: record.nationality || 'غير متوفر',
          orderDate: record.orderDate || 'غير متوفر',
          transferNumber: record.transferNumber || 'غير متوفر',
          transferDate: record.transferDate || 'غير متوفر',
          revenue: record.revenue || 0,
          expenses: record.expenses || 0,
          net: record.net || 0,
          status: record.status || 'غير متوفر',
        }).alignment = { horizontal: 'right' };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'musanad_financial_report.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      showAlert('خطأ في التصدير', 'حدث خطأ في تصدير البيانات', 'error');
    }
  };

  const handleExportPDF = async () => {
    try {
      let dataToExport = await fetchFilteredDataExporting();

      if (dataToExport.length === 0) {
        showAlert('لا توجد بيانات', 'لا توجد بيانات للتصدير', 'warning');
        return;
      }

      const doc = new jsPDF({ orientation: 'landscape' });
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // 🔷 تحميل شعار مرة واحدة (لكن نستخدمه في كل صفحة)
      const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
      const logoBuffer = await logo.arrayBuffer();
      const logoBytes = new Uint8Array(logoBuffer);
      const logoBase64 = Buffer.from(logoBytes).toString('base64');

      try {
        const response = await fetch('/fonts/Amiri-Regular.ttf');
        if (!response.ok) throw new Error('Failed to fetch font');
        const fontBuffer = await response.arrayBuffer();
        const fontBytes = new Uint8Array(fontBuffer);
        const fontBase64 = Buffer.from(fontBytes).toString('base64');

        doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
        doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
        doc.setFont('Amiri', 'normal');
      } catch (error) {
        console.error('Error loading Amiri font:', error);
        showAlert('خطأ في تحميل الخط العربي', 'حدث خطأ في تحميل الخط', 'error');
        return;
      }

      doc.setLanguage('ar');
      doc.setFontSize(12);

      const tableColumn = [
        'حالة الطلب',
        'الصافي',
        'المصروفات',
        'الايرادات',
        'تاريخ الحوالة',
        'رقم الحوالة',
        'تاريخ الطلب',
        'الجنسية',
        'المكتب الخارجي',
        'العميل',
        'رقم الطلب',
      ];

      const tableRows = dataToExport.map((row: any) => [
        row.status || 'غير متوفر',
        (row.net || 0).toLocaleString(),
        (row.expenses || 0).toLocaleString(),
        (row.revenue || 0).toLocaleString(),
        row.transferDate || 'غير متوفر',
        row.transferNumber || 'غير متوفر',
        row.orderDate || 'غير متوفر',
        row.nationality || 'غير متوفر',
        row.officeName || 'غير متوفر',
        row.clientName || 'غير متوفر',
        row.id || 'غير متوفر',
      ]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        styles: {
          font: 'Amiri',
          halign: 'right',
          fontSize: 10,
          cellPadding: 2,
          textColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [26, 77, 79],
          textColor: [255, 255, 255],
          halign: 'right',
        },
        margin: { top: 39, right: 10, left: 10 },
        didDrawPage: (data: any) => {
          const pageHeight = doc.internal.pageSize.height;
          const pageWidth = doc.internal.pageSize.width;

          // 🔷 إضافة اللوجو أعلى الصفحة (في كل صفحة)
          doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

          // 🔹 كتابة العنوان في أول صفحة فقط
          if (doc.getCurrentPageInfo().pageNumber === 1) {
            doc.setFontSize(12);
            doc.setFont('Amiri', 'normal');
            doc.text('تقرير المالي المساند', pageWidth / 2, 20, { align: 'right' });
          }

          // 🔸 الفوتر
          doc.setFontSize(10);
          doc.setFont('Amiri', 'normal');

          doc.text(userName, 10, pageHeight - 10, { align: 'left' });

          const pageNumber = `صفحة ${doc.getCurrentPageInfo().pageNumber}`;
          doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });

          const dateText =
            "التاريخ: " +
            new Date().toLocaleDateString('ar-EG', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }) +
            "  الساعة: " +
            new Date().toLocaleTimeString('ar-EG', {
              hour: '2-digit',
              minute: '2-digit',
            });
          doc.text(dateText, pageWidth - 10, pageHeight - 10, { align: 'right' });
        },
        didParseCell: (data: any) => {
          data.cell.styles.halign = 'right';
        },
      });

      doc.save('musanad_financial_report.pdf');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showAlert('خطأ في التصدير', 'حدث خطأ في تصدير البيانات', 'error');
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
                    <div className="text-md md:text-md text-gray-800 flex-1 text-center min-w-[100px]"> {fieldNames[record.status] || record.status}</div>
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

          {/* Modals */}
          <AddRecordModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onAdd={handleAddRecord}
            offices={offices}
            clients={clients}
          />
          
          <AlertModal
            isOpen={alertModal.isOpen}
            onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
            title={alertModal.title}
            message={alertModal.message}
            type={alertModal.type}
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
