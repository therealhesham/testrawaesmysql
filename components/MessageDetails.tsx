import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function MessageDetails({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="bg-[#f2f3f5] border border-[#e0e0e0] rounded-md p-10 flex flex-col gap-10">
      <h2 className="text-2xl font-normal text-right text-black">تفاصيل الرسالة</h2>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-end gap-2">
          <label className="text-md text-[#1f2937]">المكتب</label>
          <div className="w-full bg-[#f2f3f5] border border-[#e0e0e0] rounded-md px-4 py-3 text-md text-[#1f2937]">
            {message.officeName || 'غير محدد'}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <label className="text-md text-[#1f2937]">المرسل</label>
          <div className="w-full bg-[#f2f3f5] border border-[#e0e0e0] rounded-md px-4 py-3 text-md text-[#1f2937]">
            {message.sender || 'غير معروف'}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <label className="text-md text-[#1f2937]">العنوان</label>
          <div className="w-full bg-[#f2f3f5] border border-[#e0e0e0] rounded-md px-4 py-3 text-md text-[#1f2937]">
            {message.title || 'بدون عنوان'}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <label className="text-md text-[#1f2937]">الرسالة</label>
          <div className="w-full bg-[#f2f3f5] border border-[#e0e0e0] rounded-md px-4 py-3 text-md text-[#1f2937] min-h-28 leading-5">
            {message.message || 'لا توجد تفاصيل'}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <label className="text-md text-[#1f2937]">تاريخ الإرسال</label>
          <div className="w-full bg-[#f2f3f5] border border-[#e0e0e0] rounded-md px-4 py-3 text-md text-[#1f2937]">
            {format(new Date(message.createdAt), 'PPPP', { locale: ar })}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <label className="text-md text-[#1f2937]">الحالة</label>
          <div className="w-full bg-[#f2f3f5] border border-[#e0e0e0] rounded-md px-4 py-3 text-md text-[#1f2937]">
            {message.isRead ? 'مقروءة' : 'غير مقروءة'}
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <button
          className="px-4 py-2 text-base text-[#f7f8fa] bg-[#1a4d4f] rounded-md"
          onClick={onClose}
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}