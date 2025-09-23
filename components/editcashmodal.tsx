import { set } from "mongoose";
import { useState, useEffect } from "react";
import AlertModal from "./AlertModal";

export default function EditCashModal({ isOpen, onClose, cashData, onSave }) {
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: ''
  });

  useEffect(() => {

    if (cashData) {
      setAmount(cashData.amount || "");
      setTransactionType(cashData.transaction_type || "");
      setMonth(cashData.Month || "");
    setYear(cashData.Year || "");
    }
  }, [cashData]);

  const handleSubmit = async () => {
    const res = await fetch("/api/addcash", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: cashData.id,
        amount,
        // transaction_type: transactionType,
        Month: month,
        Year: year,
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      onSave(updated);
      onClose();
      setAlertModal({
        isOpen: true,
        type: 'success',
        title: 'تم التحديث بنجاح',
        message: 'تم تحديث البيانات بنجاح'
      });
    } else {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'خطأ في التحديث',
        message: 'حصل خطأ أثناء التحديث'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md">
        <h2 className="text-xl mb-4 font-semibold">تعديل الكاش</h2>
        <label className="block mb-2">القيمة</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-4"
        />

        {/* <label className="block mb-2">نوع العملية</label>
        <select
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-4"
        >
          <option value="">-- اختر --</option>
          <option value="إيراد">إيراد</option>
          <option value="مصاريف">مصاريف</option>
        </select> */}

        <label className="block mb-2">الشهر</label>
        <input
          type="text"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-4"
        />



        <label className="block mb-2">السنة</label>
        <input
          type="text"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-4"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            حفظ
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          >
            إلغاء
          </button>
        </div>
      </div>
      
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        autoClose={alertModal.type === 'success'}
        autoCloseDelay={3000}
      />
    </div>
  );
}
