'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AddProfessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProfession?: { id: number; name: string } | null;
}

const AddProfessionModal = ({ isOpen, onClose, onSuccess, editingProfession }: AddProfessionModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
  });
  const [errors, setErrors] = useState<any>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Update form when editing profession changes
  useEffect(() => {
    if (editingProfession) {
      setFormData({ name: editingProfession.name });
    } else {
      setFormData({ name: '' });
    }
    setErrors({});
    setError('');
  }, [editingProfession]);

  const validateForm = () => {
    const newErrors: any = {};
    const nameRegex = /^[a-zA-Z\s\u0600-\u06FF]+$/; // Arabic and English letters only

    if (!formData.name.trim()) {
      newErrors.name = 'اسم المهنة مطلوب';
    } else if (!nameRegex.test(formData.name.trim())) {
      newErrors.name = 'اسم المهنة يجب أن يحتوي على حروف عربية أو إنجليزية فقط';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'اسم المهنة يجب أن يكون حرفين على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for the field when user starts typing
    setErrors((prev: any) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = '/api/professions';
      const method = editingProfession ? 'PUT' : 'POST';
      const body = editingProfession
        ? { id: editingProfession.id, name: formData.name.trim() }
        : { name: formData.name.trim() };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (editingProfession ? 'فشل في تعديل المهنة' : 'فشل في إضافة المهنة'));
      }

      // Reset form and close modal
      setFormData({ name: '' });
      setErrors({});
      onClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" dir="rtl">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {editingProfession ? 'تعديل المهنة' : 'إضافة مهنة جديدة'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              اسم المهنة
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="أدخل اسم المهنة"
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-teal-800 text-white rounded-md text-sm font-medium hover:bg-teal-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'جاري الحفظ...' : editingProfession ? 'تحديث المهنة' : 'حفظ المهنة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProfessionModal;
