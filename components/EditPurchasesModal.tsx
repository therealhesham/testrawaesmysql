import React, { useState, useEffect } from 'react';

interface EditPurchasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  purchaseRecord: any | null;
}

const Icon = ({ path, className = "w-6 h-6" }: { path: string; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d={path} />
  </svg>
);

export default function EditPurchasesModal({ isOpen, onClose, onSuccess, purchaseRecord }: EditPurchasesModalProps) {
  const [formData, setFormData] = useState({
    supplierName: '',
    date: new Date().toISOString().split('T')[0],
    status: 'مدفوعة',
    invoiceNumber: '',
    supplyType: '',
    purchasesBeforeTax: '',
    taxRate: '0.15',
    taxValue: '',
    purchasesIncludingTax: '',
    attachment: null as File | null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load purchase record data when modal opens
  useEffect(() => {
    if (isOpen && purchaseRecord) {
      setFormData({
        supplierName: purchaseRecord.supplierName || '',
        date: purchaseRecord.date ? new Date(purchaseRecord.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: purchaseRecord.status || 'مدفوعة',
        invoiceNumber: purchaseRecord.invoiceNumber || '',
        supplyType: purchaseRecord.supplyType || '',
        purchasesBeforeTax: purchaseRecord.purchasesBeforeTax?.toString() || '',
        taxRate: purchaseRecord.taxRate?.toString() || '0.15',
        taxValue: purchaseRecord.taxValue?.toString() || '',
        purchasesIncludingTax: purchaseRecord.purchasesIncludingTax?.toString() || '',
        attachment: null,
      });
    }
  }, [isOpen, purchaseRecord]);

  // Calculate tax value and total when purchasesBeforeTax or taxRate changes
  useEffect(() => {
    if (formData.purchasesBeforeTax && formData.taxRate) {
      const purchasesBeforeTaxNum = parseFloat(formData.purchasesBeforeTax) || 0;
      const taxRateNum = parseFloat(formData.taxRate) || 0;
      const taxValue = purchasesBeforeTaxNum * taxRateNum;
      const purchasesIncludingTax = purchasesBeforeTaxNum + taxValue;
      
      setFormData(prev => ({
        ...prev,
        taxValue: taxValue.toFixed(2),
        purchasesIncludingTax: purchasesIncludingTax.toFixed(2),
      }));
    }
  }, [formData.purchasesBeforeTax, formData.taxRate]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    if (!formData.supplierName) {
      setError('يرجى إدخال اسم المورد');
      return;
    }
    if (!formData.purchasesBeforeTax) {
      setError('يرجى إدخال قيمة المشتريات قبل الضريبة');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`/api/tax-purchases/${purchaseRecord?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplierName: formData.supplierName,
          date: formData.date,
          status: formData.status || 'مدفوعة',
          invoiceNumber: formData.invoiceNumber || null,
          supplyType: formData.supplyType || null,
          purchasesBeforeTax: formData.purchasesBeforeTax,
          taxRate: formData.taxRate,
          taxValue: formData.taxValue,
          purchasesIncludingTax: formData.purchasesIncludingTax,
          amount: formData.purchasesBeforeTax,
          total: formData.purchasesIncludingTax,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل في تعديل المشتريات');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      setError(error.message || 'حدث خطأ أثناء تعديل المشتريات');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !purchaseRecord) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>

        <h2 className="text-2xl font-normal text-gray-800 mb-6 text-center">تعديل مشتريات</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* العمود الأيمن */}
            <div className="space-y-4">
              {/* اسم المورد */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">اسم المورد</label>
                <input
                  type="text"
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleInputChange}
                  placeholder="ادخل اسم المورد"
                  className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm"
                  required
                />
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

              {/* المشتريات شاملة الضريبة */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">المشتريات شاملة الضريبة</label>
                <input
                  type="number"
                  name="purchasesIncludingTax"
                  value={formData.purchasesIncludingTax}
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

              {/* المشتريات قبل الضريبة */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">المشتريات قبل الضريبة</label>
                <input
                  type="number"
                  name="purchasesBeforeTax"
                  value={formData.purchasesBeforeTax}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="ادخل قيمة المشتريات قبل الضريبة"
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

              {/* الحالة */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">الحالة</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm"
                >
                  <option value="مدفوعة">مدفوعة</option>
                  <option value="غير مدفوعة">غير مدفوعة</option>
                  <option value="معلقة">معلقة</option>
                </select>
              </div>

              {/* رقم الفاتورة */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">رقم الفاتورة</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleInputChange}
                  placeholder="ادخل رقم الفاتورة"
                  className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm"
                />
              </div>

              {/* نوع التوريد */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">نوع التوريد</label>
                <input
                  type="text"
                  name="supplyType"
                  value={formData.supplyType}
                  onChange={handleInputChange}
                  placeholder="ادخل نوع التوريد (مثل: رسوم حكومية، خدمة)"
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

