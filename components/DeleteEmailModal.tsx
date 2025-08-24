export default function DeleteEmailModal({ email, emailId, onClose, onSuccess }) {
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/addEmails?id=${emailId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        console.error('Failed to delete email:', data.message);
      }
    } catch (error) {
      console.error('Error deleting email:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#232726] bg-opacity-50 flex items-start justify-center pt-10 z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-[520px] w-full text-center">
        <div className="text-xl font-normal text-[#1f2937] mb-5">
          حذف بريد إلكتروني
        </div>
        <div className="text-base text-[#1f2937] mb-8">
          هل أنت متأكد من حذف البريد الإلكتروني<br />
          <span className="text-[#1a4d4f] font-medium">{email}</span>؟
        </div>
        <div className="flex justify-center gap-5">
          <button
            className="px-6 py-2 text-base text-white bg-[#1a4d4f] rounded-md hover:bg-[#163e3f] transition-colors"
            onClick={handleDelete}
          >
            تأكيد الحذف
          </button>
          <button
            className="px-6 py-2 text-base text-[#1a4d4f] border border-[#1a4d4f] rounded-md bg-white hover:bg-[#f2f3f5] transition-colors"
            onClick={onClose}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}