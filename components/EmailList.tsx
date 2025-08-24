import { useState } from 'react';

export default function EmailList({ emails, onEdit, onDelete }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full max-w-7xl bg-white border border-[#e0e0e0] rounded-md shadow-sm table-fixed">
        <thead>
          <tr className="bg-[#f7f8fa] text-right text-[#1f2937] text-sm">
            <th className="px-6 py-4 font-medium w-1/3">البريد الإلكتروني</th>
            <th className="px-6 py-4 font-medium w-1/4">القسم</th>
            <th className="px-6 py-4 font-medium w-1/4">اسم المستخدم</th>
            <th className="px-6 py-4 font-medium w-1/6">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {emails.map((email) => (
            <tr key={email.id} className="border-t border-[#e0e0e0] text-right text-[#1f2937] text-sm">
              <td className="px-6 py-4">{email.email}</td>
              <td className="px-6 py-4">{email.department || 'غير محدد'}</td>
              <td className="px-6 py-4">{email.User?.username || 'غير مرتبط'}</td>
              <td className="px-6 py-4">
                <Menu email={email} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Menu({ email, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        className="p-2 text-[#1f2937]"
        onClick={() => setShowMenu(!showMenu)}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {showMenu && (
        <div className="absolute top-8 left-0 bg-white border border-[#e0e0e0] rounded-md shadow-lg p-2 z-10">
          <button
            className="block w-full text-right px-4 py-2 text-sm text-[#1f2937] hover:bg-[#f2f3f5]"
            onClick={() => {
              onEdit(email);
              setShowMenu(false);
            }}
          >
            تعديل
          </button>
          <button
            className="block w-full text-right px-4 py-2 text-sm text-[#1f2937] hover:bg-[#f2f3f5]"
            onClick={() => {
              onDelete(email);
              setShowMenu(false);
            }}
          >
            حذف
          </button>
        </div>
      )}
    </div>
  );
}