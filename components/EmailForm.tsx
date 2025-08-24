import { useState, useEffect } from 'react';

export default function EmailForm({
  title,
  defaultEmail = '',
  defaultDepartment = '',
  defaultUsername = '',
  defaultUserId = null,
  emailId = null,
  onClose,
  onSuccess,
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [selectedDepartment, setSelectedDepartment] = useState(defaultDepartment || '');
  const [username, setUsername] = useState(defaultUsername);
  const [userId, setUserId] = useState(defaultUserId);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const departments = ['الموارد البشرية', 'الاستقدام'];

  // Fetch all users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users?searchUser=');
        const data = await response.json();
        if (response.ok) {
          setUsers(data);
        } else {
          console.error('Failed to fetch users:', data.message);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleSelectDepartment = (department) => {
    setSelectedDepartment(department);
    setShowDepartmentDropdown(false);
  };

  const handleSelectUser = (user) => {
    setUsername(user.username);
    setUserId(user.id);
    setShowUserDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const method = emailId ? 'PATCH' : 'POST';
    const url = '/api/addEmails';
    const body = emailId
      ? { id: emailId, email, department: selectedDepartment || null, userId }
      : { email, department: selectedDepartment || null, userId };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'حدث خطأ');
      }
    } catch (error) {
      setError('فشل في إرسال البيانات');
    }
  };

  return (
    <form
      className="bg-[#f2f3f5] border border-[#e0e0e0] rounded-md p-10 flex flex-col gap-10 max-w-[731px] w-full"
      onSubmit={handleSubmit}
    >
      <h2 className="text-2xl font-normal text-right text-black">{title}</h2>
      {error && (
        <div className="text-red-600 text-sm text-right">{error}</div>
      )}
      <div className="flex flex-col gap-4">
        <div className="flex gap-8 max-sm:flex-col">
          <div className="flex-1 flex flex-col items-end gap-2">
            <label className="text-xs text-[#1f2937]">البريد الإلكتروني</label>
            <input
              type="email"
              className="w-full bg-[#f7f8fa] border border-[#e0e0e0] rounded-md px-4 py-2 text-xs text-right text-[#1f2937]"
              placeholder="ادخل البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex-1 flex flex-col items-end gap-2 relative">
            <label className="text-xs text-[#1f2937]">القسم</label>
            <div
              className="w-full bg-[#f7f8fa] border border-[#e0e0e0] rounded-md px-4 py-2 flex justify-between items-center cursor-pointer"
              onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
            >
              <span
                className={`text-xs ${selectedDepartment ? 'text-[#1f2937]' : 'text-[#6b7280]'}`}
              >
                {selectedDepartment || 'اختر القسم'}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${showDepartmentDropdown ? 'rotate-270' : 'rotate-90'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            {showDepartmentDropdown && (
              <div className="absolute top-[calc(100%+9px)] right-0 w-full bg-[#f7f8fa] border border-[#e0e0e0] rounded-md p-4 flex flex-col gap-3.5 z-10">
                {departments.map((department) => (
                  <button
                    key={department}
                    className="text-sm text-[#1f2937] text-right hover:bg-[#e0e0e0] px-2 py-1 rounded"
                    onClick={() => handleSelectDepartment(department)}
                  >
                    {department}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 relative">
          <label className="text-xs text-[#1f2937]">اسم المستخدم</label>
          <div
            className="w-full bg-[#f7f8fa] border border-[#e0e0e0] rounded-md px-4 py-2 flex justify-between items-center cursor-pointer"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
          >
            <span
              className={`text-xs ${username ? 'text-[#1f2937]' : 'text-[#6b7280]'}`}
            >
              {username || 'اختر اسم المستخدم'}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${showUserDropdown ? 'rotate-270' : 'rotate-90'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
          {showUserDropdown && users.length > 0 && (
            <div className="absolute top-[calc(100%+9px)] right-0 w-full bg-[#f7f8fa] border border-[#e0e0e0] rounded-md p-4 flex flex-col gap-3.5 z-10 max-h-60 overflow-y-auto">
              {users.map((user) => (
                <button
                  key={user.id}
                  className="text-sm text-[#1f2937] text-right hover:bg-[#e0e0e0] px-2 py-1 rounded"
                  onClick={() => handleSelectUser(user)}
                >
                  {user.username}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-4 max-sm:flex-col max-sm:w-full">
        <button
          type="button"
          className="px-6 py-2 text-base text-[#1f2937] border border-[#1a4d4f] rounded-md bg-transparent max-sm:w-full"
          onClick={onClose}
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="px-6 py-2 text-base text-[#f7f8fa] bg-[#1a4d4f] rounded-md max-sm:w-full"
        >
          {title.includes('تعديل') ? 'حفظ التعديل' : 'حفظ'}
        </button>
      </div>
    </form>
  );
}