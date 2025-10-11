import { useMemo } from 'react';

interface WarrantyStatusProps {
  KingdomentryDate?: string; // تاريخ دخول المملكة (يمكن أن يكون undefined)
}

const WarrantyStatus: React.FC<WarrantyStatusProps> = ({ KingdomentryDate }) => {
  // حساب حالة الضمان باستخدام useMemo لتحسين الأداء
  const warrantyInfo = useMemo(() => {
    if (!KingdomentryDate) {
      return { status: 'غير متوفر', date: '' };
    }

    const entryDate = new Date(KingdomentryDate);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - entryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // تحويل الفرق إلى أيام

    const status = diffDays > 90 ? 'منتهي' : 'ساري';
    const formattedDate = entryDate.toLocaleDateString(); // تنسيق التاريخ بالتقويم الهجري أو حسب الحاجة

    return { status, date: formattedDate, remainingDays: diffDays  };
  }, [KingdomentryDate]);

  return (
    
<div className="flex-1 flex flex-row gap-2">

<div className="flex-1 flex flex-col gap-2">
      
      {/* حقل حالة الضمان */}
      <label htmlFor="warranty-status" className="text-xs text-gray-500 text-right font-inter">
        حالة الضمان
      </label>
      <input
        type="text"
        id="warranty-status"
        className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md"
        placeholder="حالة الضمان"
        value={`${warrantyInfo.status}${warrantyInfo.date ? ` - ${warrantyInfo.date}` : ''}`}
        readOnly
      />

<div className="flex-1 flex flex-col gap-2">

      {/* حقل المدة المتبقية */}
      <label htmlFor="remaining-period" className="text-xs text-gray-500 text-right font-inter">
        المدة المتبقية
      </label>
      <input
        type="text"
        id="remaining-period"
        className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md"
        placeholder="المدة المتبقية"
        value={warrantyInfo.remainingDays || 'غير متوفر'}
        readOnly
      />
      </div>
    </div>
    
    </div>
  );
};

export default WarrantyStatus;