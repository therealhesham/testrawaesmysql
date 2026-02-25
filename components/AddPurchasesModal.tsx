import React, { useState, useEffect } from 'react';
import AddSupplierModal from './AddSupplierModal';

interface AddPurchasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PurchaseDetailOption {
  id: number;
  name: string;
  displayOrder: number;
}

interface SupplierOption {
  id: number;
  name: string;
  displayOrder: number;
}

const CogIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M12 15a3 3 0 100-6 3 3 0 000 6z" />
  </svg>
);

export default function AddPurchasesModal({ isOpen, onClose, onSuccess }: AddPurchasesModalProps) {
  const [formData, setFormData] = useState({
    supplierId: '',
    supplierName: '', // للعرض أو عند اختيار "أخرى"
    date: new Date().toISOString().split('T')[0],
    purchaseDetailId: '',
    status: 'مدفوعة',
    invoiceNumber: '',
    supplyType: '',
    purchasesBeforeTax: '',
    taxRate: '0.15',
    taxValue: '',
    purchasesIncludingTax: '',
    attachment: null as File | null,
  });

  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetailOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newDetailName, setNewDetailName] = useState('');
  const [addingDetail, setAddingDetail] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const fetchPurchaseDetails = async () => {
    try {
      const res = await fetch('/api/tax-purchases-details');
      const data = await res.json();
      if (data.success && Array.isArray(data.details)) setPurchaseDetails(data.details);
    } catch (e) {
      console.error('Error fetching purchase details:', e);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/tax-suppliers');
      const data = await res.json();
      if (data.success && Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
    } catch (e) {
      console.error('Error fetching suppliers:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPurchaseDetails();
      fetchSuppliers();
    }
  }, [isOpen]);

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
    
    // Validate required fields: إما اختيار مورد من القائمة أو إدخال اسم يدوياً
    const supplierNameToSend = formData.supplierId
      ? (suppliers.find(s => String(s.id) === formData.supplierId)?.name ?? formData.supplierName)
      : formData.supplierName;
    if (!supplierNameToSend?.trim()) {
      setError('يرجى اختيار المورد أو إدخال اسم المورد');
      return;
    }
    if (!formData.purchasesBeforeTax) {
      setError('يرجى إدخال قيمة المشتريات قبل الضريبة');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('/api/tax-purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplierId: formData.supplierId || null,
          supplierName: supplierNameToSend,
          date: formData.date,
          purchaseDetailId: formData.purchaseDetailId || null,
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
        throw new Error(data.message || 'فشل في إضافة المشتريات');
      }

      setFormData({
        supplierId: '',
        supplierName: '',
        date: new Date().toISOString().split('T')[0],
        purchaseDetailId: '',
        status: 'مدفوعة',
        invoiceNumber: '',
        supplyType: '',
        purchasesBeforeTax: '',
        taxRate: '0.15',
        taxValue: '',
        purchasesIncludingTax: '',
        attachment: null,
      });
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      setError(error.message || 'حدث خطأ أثناء إضافة المشتريات');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>

        <h2 className="text-2xl font-normal text-gray-800 mb-6 text-center">تسجيل مشتريات</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* العمود الأيمن */}
            <div className="space-y-4">
              {/* التفاصيل */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">التفاصيل</label>
                <div className="flex gap-1 items-center">
                  <select
                    name="purchaseDetailId"
                    value={formData.purchaseDetailId}
                    onChange={handleInputChange}
                    className="flex-1 bg-white border border-gray-300 rounded-md  text-sm"
                  >
                    <option value="">اختر التفاصيل (اختياري)</option>
                    {purchaseDetails.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => { setDetailsError(''); setNewDetailName(''); setShowDetailsModal(true); }}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 text-gray-600"
                    title="إدارة التفاصيل"
                  >
                    <CogIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* اسم المورد */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">اسم المورد</label>
                <div className="flex gap-1 items-center">
                  <select
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const s = suppliers.find(x => String(x.id) === id);
                      setFormData(prev => ({ ...prev, supplierId: id, supplierName: s?.name ?? '' }));
                    }}
                    className="flex-1 bg-white border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">اختر المورد</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowSupplierModal(true)}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 text-gray-600"
                    title="إضافة مورد"
                  >
                    <CogIcon className="w-5 h-5" />
                  </button>
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
                    className="bg-green-700 hover:bg-green-800 text-white text-sm px-4 py-2 rounded-md cursor-pointer"
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
                  className="w-full bg-white border border-gray-300 rounded-md text-sm"
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
              className="bg-white border-2 border-green-700 text-green-700 rounded-md px-6 py-2 text-sm hover:bg-gray-50"
            >
              الغاء
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-green-700 hover:bg-green-800 text-white rounded-md px-6 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'جاري الإضافة...' : 'اضافة'}
            </button>
          </div>
        </form>
      </div>

      {/* مودال إدارة التفاصيل (إضافة تفصيل جديد) */}
      {showDetailsModal && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[60] rounded-lg" dir="rtl">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-medium text-gray-800 mb-4">إدارة تفاصيل المشتريات</h3>
            <p className="text-sm text-gray-500 mb-3">أضف تفصيلاً جديداً ليظهر في قائمة التفاصيل عند تسجيل المشتريات.</p>
            {detailsError && (
              <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">{detailsError}</div>
            )}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newDetailName}
                onChange={(e) => setNewDetailName(e.target.value)}
                placeholder="اسم التفصيل (مثل: رسوم حكومية، خدمات)"
                className="flex-1 border border-gray-300 rounded-md p-2 text-sm"
              />
              <button
                type="button"
                disabled={addingDetail || !newDetailName.trim()}
                onClick={async () => {
                  setDetailsError('');
                  setAddingDetail(true);
                  try {
                    const res = await fetch('/api/tax-purchases-details', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: newDetailName.trim() }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'فشل الإضافة');
                    await fetchPurchaseDetails();
                    setFormData(prev => ({ ...prev, purchaseDetailId: String(data.detail.id) }));
                    setNewDetailName('');
                    setShowDetailsModal(false);
                  } catch (e: any) {
                    setDetailsError(e.message || 'حدث خطأ');
                  } finally {
                    setAddingDetail(false);
                  }
                }}
                className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm"
              >
                {addingDetail ? 'جاري...' : 'إضافة'}
              </button>
            </div>
            {purchaseDetails.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs text-gray-500 mb-2">التفاصيل الحالية:</p>
                <ul className="text-sm text-gray-700 space-y-1 max-h-32 overflow-y-auto">
                  {purchaseDetails.map((d) => (
                    <li key={d.id}>{d.name}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => { setShowDetailsModal(false); setDetailsError(''); setNewDetailName(''); }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      <AddSupplierModal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        onSuccess={() => {
          fetchSuppliers();
        }}
      />
    </div>
  );
}

