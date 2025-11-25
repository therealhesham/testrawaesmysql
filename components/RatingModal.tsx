import React, { useState, useEffect } from 'react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: { idOrder: string; isRated: boolean; reason: string }) => void;
  orderId?: number;
  initialData?: { isRated: boolean; reason: string };
}

export default function RatingModal({ isOpen, onClose, onSubmit, orderId, initialData }: RatingModalProps) {
  const [form, setForm] = useState({ idOrder: orderId?.toString() || '', isRated: false, reason: '' });

  useEffect(() => {
    if (orderId) {
      setForm(prev => ({ ...prev, idOrder: orderId.toString() }));
    }
    if (initialData) {
      setForm(prev => ({ ...prev, isRated: initialData.isRated, reason: initialData.reason || '' }));
    }
  }, [orderId, initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  const handleClose = () => {
    setForm({ idOrder: orderId?.toString() || '', isRated: false, reason: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md relative">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-red-600"
        >
          ✖
        </button>
        <h2 className="text-xl font-bold mb-4 text-right">تقييم الطلب</h2>
        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
  {!orderId && (
    <input
      type="number"
      placeholder="رقم الطلب"
      value={form.idOrder}
      onChange={(e) => setForm({ ...form, idOrder: e.target.value })}
      className="w-full px-3 py-2 border rounded text-right"
      required
    />
  )}
  {orderId && (
    <div className="text-right">
      <p className="text-sm text-gray-600 mb-2">رقم الطلب: <span className="font-bold">{orderId}</span></p>
    </div>
  )}

  <div className="text-right">
    <p className="mb-2 font-medium">هل تم التقييم؟</p>
    <div className="flex gap-4 justify-end">
      <label className="flex items-center gap-1 cursor-pointer">
        <input
          type="radio"
          name="isRated"
          value="true"
          checked={form.isRated === true}
          onChange={() => setForm({ ...form, isRated: true })}
          className="cursor-pointer"
        />
        <span>نعم</span>
      </label>
      <label className="flex items-center gap-1 cursor-pointer">
        <input
          type="radio"
          name="isRated"
          value="false"
          checked={form.isRated === false}
          onChange={() => setForm({ ...form, isRated: false })}
          className="cursor-pointer"
        />
        <span>لا</span>
      </label>
    </div>
  </div>

  <div className="text-right">
    <textarea
      placeholder="سبب التقييم (اختياري)"
      value={form.reason}
      onChange={(e) => setForm({ ...form, reason: e.target.value })}
      className="w-full px-3 py-2 border rounded text-right"
      rows={4}
    />
  </div>

  <div className="flex gap-2 justify-end">
    <button
      type="button"
      onClick={handleClose}
      className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
    >
      إلغاء
    </button>
    <button
      type="submit"
      className="bg-teal-900 text-white px-4 py-2 rounded hover:bg-teal-800"
    >
      حفظ
    </button>
  </div>
</form>

      </div>
    </div>
  );
}
