import React, { useState, useEffect } from 'react';

interface EditSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  salesRecord: any | null;
}

interface Client {
  id: number;
  fullname: string | null;
}

const Icon = ({ path, className = "w-6 h-6" }: { path: string; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d={path} />
  </svg>
);

export default function EditSalesModal({ isOpen, onClose, onSuccess, salesRecord }: EditSalesModalProps) {
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    salesBeforeTax: '',
    taxRate: '0.15',
    taxValue: '',
    salesIncludingTax: '',
    paymentMethod: '',
    attachment: null as File | null,
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);

  // Load sales record data when modal opens
  useEffect(() => {
    if (isOpen && salesRecord) {
      setFormData({
        customerId: salesRecord.customerId?.toString() || '',
        customerName: salesRecord.customer?.fullname || salesRecord.customerName || '',
        date: salesRecord.date ? new Date(salesRecord.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        salesBeforeTax: salesRecord.salesBeforeTax?.toString() || '',
        taxRate: salesRecord.taxRate?.toString() || '0.15',
        taxValue: salesRecord.taxValue?.toString() || '',
        salesIncludingTax: salesRecord.salesIncludingTax?.toString() || '',
        paymentMethod: salesRecord.paymentMethod || '',
        attachment: null,
      });
    }
  }, [isOpen, salesRecord]);

  // Fetch clients on mount
  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  // Filter clients based on search
  useEffect(() => {
    if (formData.customerName && showClientDropdown) {
      const filtered = clients.filter(client =>
        client.fullname?.toLowerCase().includes(formData.customerName.toLowerCase())
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [formData.customerName, clients, showClientDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowClientDropdown(false);
    };
    if (showClientDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showClientDropdown]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients?pageSize=1000');
      const data = await response.json();
      const clientsList = data.data || data.clients || data;
      if (Array.isArray(clientsList)) {
        setClients(clientsList);
        setFilteredClients(clientsList);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  // Calculate tax value and total when salesBeforeTax or taxRate changes
  useEffect(() => {
    if (formData.salesBeforeTax && formData.taxRate) {
      const salesBeforeTaxNum = parseFloat(formData.salesBeforeTax) || 0;
      const taxRateNum = parseFloat(formData.taxRate) || 0;
      const taxValue = salesBeforeTaxNum * taxRateNum;
      const salesIncludingTax = salesBeforeTaxNum + taxValue;
      
      setFormData(prev => ({
        ...prev,
        taxValue: taxValue.toFixed(2),
        salesIncludingTax: salesIncludingTax.toFixed(2),
      }));
    }
  }, [formData.salesBeforeTax, formData.taxRate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        attachment: e.target.files![0],
      }));
    }
  };

  const handleClientSelect = (client: Client) => {
    setFormData(prev => ({
      ...prev,
      customerId: client.id.toString(),
      customerName: client.fullname || '',
    }));
    setShowClientDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    if (!formData.customerId) {
      setError('يرجى اختيار العميل');
      return;
    }
    if (!formData.salesBeforeTax) {
      setError('يرجى إدخال قيمة المبيعات قبل الضريبة');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`/api/tax-sales/${salesRecord?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: formData.customerId,
          customerName: formData.customerName,
          date: formData.date,
          salesBeforeTax: formData.salesBeforeTax,
          taxRate: formData.taxRate,
          taxValue: formData.taxValue,
          salesIncludingTax: formData.salesIncludingTax,
          paymentMethod: formData.paymentMethod || null,
          amount: formData.salesBeforeTax,
          total: formData.salesIncludingTax,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل في تعديل المبيعات');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      setError(error.message || 'حدث خطأ أثناء تعديل المبيعات');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !salesRecord) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>

        <h2 className="text-2xl font-normal text-gray-800 mb-6 text-center">تعديل مبيعات</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* العمود الأيمن */}
            <div className="space-y-4">
              {/* اسم العميل */}
              <div className="relative">
                <label className="block text-sm text-gray-700 mb-2">اسم العميل</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, customerName: e.target.value }));
                      setShowClientDropdown(true);
                    }}
                    onFocus={(e) => {
                      e.stopPropagation();
                      setShowClientDropdown(true);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="اختر العميل"
                    className="w-full bg-white border border-gray-300 rounded-md p-2 pr-10 text-sm"
                  />
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                    <Icon path="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" className="w-4 h-4" />
                  </span>
                  {showClientDropdown && filteredClients.length > 0 && (
                    <div 
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {filteredClients.map((client) => (
                        <div
                          key={client.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClientSelect(client);
                          }}
                          className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                        >
                          {client.fullname}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* نسبة الضريبة */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">نسبة الضريبة</label>
                <div className="relative">
                  <input
                    type="number"
                    name="taxRate"
                    value={formData.taxRate}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    max="1"
                    className="w-full bg-white border border-gray-300 rounded-md p-2 pl-10 text-sm"
                  />
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
              </div>

              {/* قيمة المبيعات شاملة الضريبة */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">قيمة المبيعات شاملة الضريبة</label>
                <input
                  type="number"
                  name="salesIncludingTax"
                  value={formData.salesIncludingTax}
                  onChange={handleInputChange}
                  step="0.01"
                  readOnly
                  className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm"
                />
              </div>

              {/* المرفق */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">المرفق</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">ارفاق ملف</span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    id="attachment"
                  />
                  <label
                    htmlFor="attachment"
                    className="bg-teal-700 hover:bg-teal-800 text-white text-sm px-4 py-2 rounded-md cursor-pointer"
                  >
                    اختيار ملف
                  </label>
                  {formData.attachment && (
                    <span className="text-sm text-gray-600">{formData.attachment.name}</span>
                  )}
                </div>
              </div>
            </div>

            {/* العمود الأيسر */}
            <div className="space-y-4">
              {/* التاريخ */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">التاريخ</label>
                <div className="relative">
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    placeholder="اختر التاريخ"
                    className="w-full bg-white border border-gray-300 rounded-md p-2 pr-10 text-sm"
                  />
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                    <Icon path="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* قيمة المبيعات قبل الضريبة */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">قيمة المبيعات قبل الضريبة</label>
                <input
                  type="number"
                  name="salesBeforeTax"
                  value={formData.salesBeforeTax}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="ادخل قيمة المبيعات قبل الضريبة"
                  className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm"
                  required
                />
              </div>

              {/* قيمة الضريبة */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">قيمة الضريبة</label>
                <input
                  type="number"
                  name="taxValue"
                  value={formData.taxValue}
                  onChange={handleInputChange}
                  step="0.01"
                  readOnly
                  className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm"
                />
              </div>

              {/* طريقة الدفع */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">طريقة الدفع</label>
                <input
                  type="text"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  placeholder="ادخل طريقة الدفع"
                  className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* الأزرار */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="bg-white border-2 border-teal-700 text-teal-700 rounded-md px-6 py-2 text-sm hover:bg-gray-50"
            >
              الغاء
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-teal-700 hover:bg-teal-800 text-white rounded-md px-6 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'جاري التعديل...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

