import React, { useState } from 'react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: { idOrder: string; isRated: boolean; reason: string }) => void;
}

export default function RatingModal({ isOpen, onClose, onSubmit }: RatingModalProps) {
  const [form, setForm] = useState({ idOrder: '', isRated: false, reason: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    setForm({ idOrder: '', isRated: false, reason: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-red-600"
        >
          ✖
        </button>
        <h2 className="text-xl font-bold mb-4">إضافة تقييم</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
  <input
    type="number"
    placeholder="رقم الطلب"
    value={form.idOrder}
    onChange={(e) => setForm({ ...form, idOrder: e.target.value })}
    className="w-full px-3 py-2 border rounded"
  />

  <div>
    <p className="mb-2 font-medium">هل تم التقييم؟</p>
    <div className="flex gap-4">
      <label className="flex items-center gap-1">
        <input
          type="radio"
          name="isRated"
          value="true"
          checked={form.isRated === true}
          onChange={() => setForm({ ...form, isRated: true })}
        />
        <span>نعم</span>
      </label>
      <label className="flex items-center gap-1">
        <input
          type="radio"
          name="isRated"
          value="false"
          checked={form.isRated === false}
          onChange={() => setForm({ ...form, isRated: false })}
        />
        <span>لا</span>
      </label>
    </div>
  </div>

  <textarea
    placeholder="سبب التقييم"
    value={form.reason}
    onChange={(e) => setForm({ ...form, reason: e.target.value })}
    className="w-full px-3 py-2 border rounded"
  />

  <button
    type="submit"
    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
  >
    حفظ
  </button>
</form>

      </div>
    </div>
  );
}
