import React, { useState } from 'react';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddSupplierModal({ isOpen, onClose, onSuccess }: AddSupplierModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('اسم المورد مطلوب');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/tax-suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل الإضافة');
      setName('');
      onSuccess?.();
      onClose();
    } catch (e: any) {
      setError(e.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" dir="rtl">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-medium text-gray-800 mb-4">إضافة مورد</h3>
        {error && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">اسم المورد</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ادخل اسم المورد"
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { onClose(); setError(''); setName(''); }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm">
              إلغاء
            </button>
            <button type="submit" disabled={loading || !name.trim()} className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm">
              {loading ? 'جاري الإضافة...' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
