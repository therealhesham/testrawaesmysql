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
    
    // إزالة الوقت من التواريخ للمقارنة الصحيحة
    entryDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    
    // حساب الفرق بالأيام (بدون Math.abs لنعرف إذا كان في الماضي أو المستقبل)
    const diffTime = currentDate.getTime() - entryDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let status: string;
    let remainingDays: number;
    
    // إذا كان تاريخ الدخول في المستقبل
    if (diffDays < 0) {
      status = 'لم يبدأ بعد';
      remainingDays = Math.abs(diffDays);
    } 
    // إذا كان تاريخ الدخول في الماضي
    else if (diffDays > 90) {
      status = 'منتهي';
      remainingDays = diffDays;
    } 
    // إذا كان الضمان ساري (أقل من أو يساوي 90 يوم)
    else {
      status = 'ساري';
      remainingDays = 90 - diffDays; // الأيام المتبقية من الضمان
    }
    
    const formattedDate = entryDate.toLocaleDateString('ar-SA');

    return { status, date: formattedDate, remainingDays };
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