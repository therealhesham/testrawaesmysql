import { useState } from 'react';
import axios from 'axios';

export default function MessageForm({ title, borderColor, offices, onClose }) {
  const [recipient, setRecipient] = useState('');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!recipient || !messageTitle || !messageBody) {
      setError('يرجى ملء جميع الحقول');
      return;
    }

    try {
      const response = await axios.post('/api/send-message', {
        recipient,
        message: { title: messageTitle, body: messageBody },
        sender: 'current_user', // استبدل بمعرف المستخدم الحالي
      });

      if (response.data.success) {
        setSuccess('تم إرسال الرسالة بنجاح');
        setRecipient('');
        setMessageTitle('');
        setMessageBody('');
        setTimeout(onClose, 2000);
      }
    } catch (err) {
      setError('فشل في إرسال الرسالة');
    }
  };

  return (
    <div className={`bg-[#f2f3f5] border ${borderColor ? `border-[${borderColor}]` : 'border-[#e0e0e0]'} rounded-md p-10 flex flex-col gap-10`}>
      <h2 className="text-2xl font-normal text-right text-black">{title}</h2>
      {error && <p className="text-red-500 text-right">{error}</p>}
      {success && <p className="text-green-500 text-right">{success}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col items-end gap-2">
          <label className="text-md text-[#1f2937]">المكتب</label>
          <select
            className="w-full bg-[#f7f8fa] border border-[#e0e0e0] rounded-md px-4 py-2 text-md text-right text-[#6b7280]"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          >
            <option value="">اختر المكتب</option>
            {offices.map((office) => (
              <option key={office.id} value={office.office}>
                {office.office} - {office.Country}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col items-end gap-2">
          <label className="text-md text-[#1f2937]">العنوان</label>
          <input
            type="text"
            className="w-full bg-[#f7f8fa] border border-[#e0e0e0] rounded-md px-4 py-2 text-md text-right text-[#6b7280]"
            placeholder="ادخل عنوان الرسالة"
            value={messageTitle}
            onChange={(e) => setMessageTitle(e.target.value)}
            maxLength={55} // حد أقصى للعنوان حسب السكيما
          />
        </div>
        <div className="flex flex-col items-end gap-2">
          <label className="text-md text-[#1f2937]">الرسالة</label>
          <textarea
            className="w-full bg-[#f7f8fa] border border-[#e0e0e0] rounded-md px-4 py-4 text-md text-right text-[#6b7280] resize-y h-28"
            placeholder="ادخل تفاصيل الرسالة"
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            maxLength={255} // حد أقصى للرسالة حسب السكيما
          />
        </div>
        <div className="flex justify-center gap-4">
          <button
            type="button"
            className="px-4 py-2 text-base text-[#1f2937] border border-[#1a4d4f] rounded-md bg-transparent"
            onClick={onClose}
          >
            الغاء
          </button>
          <button type="submit" className="px-4 py-2 text-base text-[#f7f8fa] bg-[#1a4d4f] rounded-md">
            ارسال
          </button>
        </div>
      </form>
    </div>
  );
}