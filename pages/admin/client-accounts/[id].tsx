import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from 'example/containers/Layout';
import { PlusIcon } from '@heroicons/react/outline';
import Style from "styles/Home.module.css";
interface ClientAccountEntry {
  id: number;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  entryType: string;
}

interface ClientAccountStatement {
  id: number;
  contractNumber: string;
  officeName: string;
  totalRevenue: number;
  totalExpenses: number;
  netAmount: number;
  contractStatus: string;
  notes: string;
  createdAt: string;
  client: {
    id: number;
    fullname: string;
    phonenumber: string;
    nationalId: string;
    city: string;
    address: string;
    createdAt: string;
  };
  entries: ClientAccountEntry[];
  totals: {
    totalDebit: number;
    totalCredit: number;
    netAmount: number;
  };
}

const ClientStatementPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [statement, setStatement] = useState<ClientAccountStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ClientAccountEntry | null>(null);
  
  // Filter states
  const [selectedEntryType, setSelectedEntryType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for add/edit
  const [formData, setFormData] = useState({
    date: '',
    description: '',
    debit: '',
    credit: '',
    balance: '',
    entryType: ''
  });

  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchStatement = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(selectedEntryType !== 'all' && { entryType: selectedEntryType }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        ...(searchTerm && { search: searchTerm }),
      });
      const response = await fetch(`/api/client-accounts/${id}?${params}`);
      const data = await response.json();
      setStatement(data);
    } catch (error) {
      console.error('Error fetching client statement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStatement();
    }
  }, [id, selectedEntryType, fromDate, toDate]);

  useEffect(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    const timeout = setTimeout(() => {
      if (id) {
        fetchStatement();
      }
    }, 300);
    setDebounceTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/client-accounts/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statementId: id,
          ...formData,
          debit: Number(formData.debit),
          credit: Number(formData.credit),
          balance: Number(formData.balance)
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({
          date: '',
          description: '',
          debit: '',
          credit: '',
          balance: '',
          entryType: ''
        });
        fetchStatement();
      }
    } catch (error) {
      console.error('Error adding entry:', error);
    }
  };

  const handleEditEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    try {
      const response = await fetch(`/api/client-accounts/entries/${editingEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          debit: Number(formData.debit),
          credit: Number(formData.credit),
          balance: Number(formData.balance)
        }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingEntry(null);
        setFormData({
          date: '',
          description: '',
          debit: '',
          credit: '',
          balance: '',
          entryType: ''
        });
        fetchStatement();
      }
    } catch (error) {
      console.error('Error editing entry:', error);
    }
  };

  const openEditModal = (entry: ClientAccountEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: new Date(entry.date).toISOString().split('T')[0],
      description: entry.description,
      debit: entry.debit.toString(),
      credit: entry.credit.toString(),
      balance: entry.balance.toString(),
      entryType: entry.entryType || ''
    });
    setShowEditModal(true);
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
        <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-gray-500">جاري التحميل...</div>
        </div>
      </Layout>
    );
  }

  if (!statement) {
    return (
      <Layout>
        <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-gray-500">لم يتم العثور على كشف الحساب</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`${Style["tajawal-regular"]} min-h-screen p-6 bg-gray-50`} dir="rtl">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-teal-800 text-white px-3 py-1 rounded text-md"
          >
            <span>اضافة سجل</span>
            <PlusIcon className="w-4 h-4" />
          </button>
          <h1 className="text-3xl font-normal text-black">
            {statement.client?.fullname} - {statement.client?.nationalId}
          </h1>
        </div>

        {/* Client Info Cards */}
        <div className="flex gap-3 mb-6">
          <div className="bg-gray-100 border border-gray-300 rounded p-6 flex-1">
            <h3 className="text-2xl font-medium text-gray-700 mb-6 text-right">معلومات الطلب</h3>
            <div className="grid grid-cols-2 gap-4 gap-y-10">
              <div className="flex flex-col gap-4 items-end">
                <span className="text-base font-medium text-gray-700">تاريخ الطلب:</span>
                <span className="text-base font-normal text-gray-700">
                  {formatDate(statement.client?.createdAt)}
                </span>
              </div>
              <div className="flex flex-col gap-4 items-end">
                <span className="text-base font-medium text-gray-700">حالة العقد:</span>
                <span className="text-base font-normal text-gray-700">{statement.contractStatus}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 border border-gray-300 rounded p-6 flex-1">
            <h3 className="text-2xl font-medium text-gray-700 mb-6 text-right">معلومات المكتب</h3>
            <div className="grid grid-cols-1 gap-4 gap-y-10">
              <div className="flex flex-col gap-4 items-end">
                <span className="text-base font-medium text-gray-700">اسم المكتب:</span>
                <span className="text-base font-normal text-gray-700">{statement.officeName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Statement Filter */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex flex-col">
              <label className="text-md text-gray-700 mb-2">نوع الحركة</label>
              <select
                value={selectedEntryType}
                onChange={(e) => setSelectedEntryType(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded  text-md text-gray-600 "
              >
                <option value="all">اختر نوع الحركة</option>
                <option value="income">ايراد</option>
                <option value="expense">مصروف</option>
                <option value="payment">دفعة</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-md text-gray-700 mb-2">الى</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded  text-md text-gray-600 "
              />
            </div>

            <div className="flex flex-col">
              <label className="text-md text-gray-700 mb-2">من</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded text-md text-gray-600 "
              />
            </div>
          </div>
          <button
            onClick={() => fetchStatement()}
            className="bg-teal-800 text-white  rounded text-md h-74 min-w-[123px]"
          >
            كشف حساب
          </button>
        </div>

        {/* Statement Table */}
        <div className="bg-white">
          <div className="flex items-center gap-2 mb-4 px-4">
            <button className="bg-teal-800 text-white px-3 py-1 rounded text-md  w-16">
              Excel
            </button>
            <button className="bg-teal-800 text-white px-3 py-1 rounded text-md  w-14">
              PDF
            </button>
            <div className="flex-1 max-w-64">
              <input
                type="text"
                placeholder="بحث"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-md text-gray-600"
              />
            </div>
          </div>

          {/* Statement Table */}
          <div className="bg-gray-100 border border-gray-300 rounded overflow-hidden">
            {/* Table Header */}
            <div className="bg-teal-800 text-white flex items-center p-4 gap-9">
              <div className="flex-1 text-center text-md font-normal">#</div>
              <div className="flex-1 text-center text-md font-normal">التاريخ</div>
              <div className="flex-1 text-center text-md font-normal">البيان</div>
              <div className="flex-1 text-center text-md font-normal">مدين</div>
              <div className="flex-1 text-center text-md font-normal">دائن</div>
              <div className="flex-1 text-center text-md font-normal">الرصيد</div>
              <div className="flex-1 text-center text-md font-normal">اجراءات</div>
            </div>

            {/* Table Rows */}
            {statement?.entries?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">لا توجد بيانات</div>
            ) : (
              statement?.entries?.map((entry, index) => (
                <div key={entry.id} className="flex items-center p-4 gap-9 border-b border-gray-300 bg-gray-50 hover:bg-gray-100">
                  <div className="flex-1 text-center text-md text-gray-700">#{index + 1}</div>
                  <div className="flex-1 text-center text-md text-gray-700">
                    {formatDate(entry.date)}
                  </div>
                  <div className="flex-1 text-center text-md text-gray-700">
                    {entry.description}
                  </div>
                  <div className="flex-1 text-center text-md text-gray-700">
                    {entry.debit > 0 ? formatCurrency(entry.debit) : 'ـــ'}
                  </div>
                  <div className="flex-1 text-center text-md text-gray-700">
                    {entry.credit > 0 ? formatCurrency(entry.credit) : 'ـــ'}
                  </div>
                  <div className="flex-1 text-center text-md text-gray-700">
                    {formatCurrency(entry.balance)}
                  </div>
                  <div className="flex-1 text-center">
                    <button
                      onClick={() => openEditModal(entry)}
                      className="bg-teal-800 text-white px-3 py-1 rounded text-md"
                    >
                      اجراءات
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Table Footer */}
            <div className="bg-gray-50 flex items-center p-4 gap-9 border-t border-gray-700">
              <div className="text-base font-normal text-gray-700 mr-auto">الاجمالي</div>
              <div className="flex-1 text-center text-md text-gray-700">
                {formatCurrency(statement?.totals?.totalDebit || 0)}
              </div>
              <div className="flex-1 text-center text-md text-gray-700">
                {formatCurrency(statement?.totals?.totalCredit || 0)}
              </div>
              <div className="flex-1 text-center text-md text-gray-700">
                {formatCurrency(statement?.totals?.netAmount || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Add Entry Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg w-[600px] max-w-[90%] shadow-lg">
              <h2 className="text-xl text-center mb-6 text-teal-700">إضافة سجل</h2>
              <form onSubmit={handleAddEntry} className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-md font-medium text-gray-700 mb-1">التاريخ</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="p-2 border border-gray-300 rounded text-md bg-gray-50"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-md font-medium text-gray-700 mb-1">رصيد المدين</label>
                  <input
                    type="number"
                    placeholder="ادخل رصيد المدين"
                    value={formData.debit}
                    onChange={(e) => setFormData({ ...formData, debit: e.target.value })}
                    className="p-2 border border-gray-300 rounded text-md bg-gray-50"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-md font-medium text-gray-700 mb-1">رصيد الدائن</label>
                  <input
                    type="number"
                    placeholder="ادخل رصيد الدائن"
                    value={formData.credit}
                    onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
                    className="p-2 border border-gray-300 rounded text-md bg-gray-50"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-md font-medium text-gray-700 mb-1">البيان</label>
                  <input
                    type="text"
                    placeholder="ادخل البيان"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="p-2 border border-gray-300 rounded text-md bg-gray-50"
                    required
                  />
                </div>
                <div className="col-span-2 flex justify-center gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded text-md"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-teal-800 text-white rounded text-md"
                  >
                    إضافة
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Entry Modal */}
        {showEditModal && editingEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg w-[600px] max-w-[90%] shadow-lg">
              <h2 className="text-xl text-center mb-6 text-teal-700">تعديل</h2>
              <form onSubmit={handleEditEntry} className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-md font-medium text-gray-700 mb-1">رصيد المدين</label>
                  <input
                    type="number"
                    value={formData.debit}
                    onChange={(e) => setFormData({ ...formData, debit: e.target.value })}
                    className="p-2 border border-gray-300 rounded text-md bg-gray-50"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-md font-medium text-gray-700 mb-1">رصيد الدائن</label>
                  <input
                    type="number"
                    value={formData.credit}
                    onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
                    className="p-2 border border-gray-300 rounded text-md bg-gray-50"
                  />
                </div>
                <div className="col-span-2 flex flex-col">
                  <label className="text-md font-medium text-gray-700 mb-1">البيان</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="p-2 border border-gray-300 rounded text-md bg-gray-50"
                    required
                  />
                </div>
                <div className="col-span-2 flex justify-center gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded text-md"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-teal-800 text-white rounded text-md"
                  >
                    حفظ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClientStatementPage;

