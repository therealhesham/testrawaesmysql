import React, { useState, useEffect } from 'react';
import { Star, Bell, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: { idOrder: string; isRated: boolean; reason: string }) => void;
  orderId?: number;
  initialData?: { isRated: boolean; reason: string; stars?: number | null };
}

export default function RatingModal({ isOpen, onClose, onSubmit, orderId, initialData }: RatingModalProps) {
  const [form, setForm] = useState({ idOrder: orderId?.toString() || '', isRated: false, reason: '' });
  const [isReminderSent, setIsReminderSent] = useState(false);

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
    setIsReminderSent(false);
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
        <h2 className="text-2xl font-bold mb-6 text-center text-[#003749]">
          تقييم الطلب {orderId ? `#${orderId}` : ''}
        </h2>
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
  {initialData?.stars !== undefined && initialData.stars !== null && (
    <div className="flex justify-center my-6" title="تقييم العميل">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = starIndex <= initialData.stars!;
          return (
            <Star
              key={starIndex}
              className={`w-10 h-10 ${isFilled ? 'text-[#E5BC7E] fill-[#E5BC7E] drop-shadow' : 'text-gray-200 fill-gray-200'}`}
            />
          );
        })}
      </div>
    </div>
  )}

  {initialData?.isRated ? (
    <div className="text-right mt-4">
      <p className="mb-2 font-medium text-gray-700">تعليق العميل:</p>
      <div className="p-4 bg-gray-50 border border-gray-200 rounded text-gray-800 min-h-[80px]">
        {form.reason ? form.reason : <span className="text-gray-400 italic">لا يوجد تعليق إضافي</span>}
      </div>
      <div className="flex gap-2 justify-end mt-6">
        <button
          type="button"
          onClick={handleClose}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
        >
          إغلاق
        </button>
      </div>
    </div>
  ) : (
    <div className="text-center mt-6 min-h-[260px] flex flex-col justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {!isReminderSent ? (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="w-full"
          >
            <div className="bg-orange-50/80 border border-orange-100 rounded-2xl p-6 mb-6">
              <div className="w-16 h-16 bg-white shadow-sm border border-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-lg font-bold text-gray-800 mb-2">العميل لم يقيّم الطلب حتى الآن</p>
              <p className="text-sm text-gray-600">هل تود إرسال رسالة تذكير للعميل لتقييم الطلب عن طريق الموقع الخاص بالعملاء؟</p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={handleClose}
                className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => setIsReminderSent(true)}
                className="bg-[#003749] text-white px-6 py-2.5 rounded-xl hover:bg-[#002a38] transition-all font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Bell className="w-5 h-5" />
                إرسال تذكير
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-full flex flex-col items-center justify-center py-4"
          >
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">تم التجهيز بنجاح!</h3>
            <p className="text-gray-500 text-sm mb-8">سيتم إرسال التذكير للعميل قريباً (الميزة قيد التجربة).</p>
            <button
              type="button"
              onClick={handleClose}
              className="bg-gray-100 text-gray-700 px-8 py-2.5 rounded-xl hover:bg-gray-200 transition-colors font-bold"
            >
              حسناً، إغلاق
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )}
</form>

      </div>
    </div>
  );
}
