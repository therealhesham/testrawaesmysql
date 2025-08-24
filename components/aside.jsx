
export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-teal-800 text-white flex flex-col p-4">
      <div className="mb-8">
        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mb-4"></div>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
          <li>
            <a href="/" className="flex items-center p-2 hover:bg-teal-700 rounded-lg">
              <span className="text-lg">الرئيسية</span>
              <span className="ml-2">🏠</span>
            </a>
          </li>
          <li>
            <a href="/profile" className="flex items-center p-2 hover:bg-teal-700 rounded-lg">
              <span className="text-lg">الملف الشخصي</span>
              <span className="ml-2">📋</span>
            </a>
          </li>
          <li>
            <a href="/patients" className="flex items-center p-2 hover:bg-teal-700 rounded-lg">
              <span className="text-lg">المرضى</span>
              <span className="ml-2">😷</span>
            </a>
          </li>
          <li>
            <a href="/appointments" className="flex items-center p-2 hover:bg-teal-700 rounded-lg">
              <span className="text-lg">المواعيد</span>
              <span className="ml-2">📅</span>
            </a>
          </li>
          <li>
            <a href="/services" className="flex items-center p-2 hover:bg-teal-700 rounded-lg">
              <span className="text-lg">الخدمات</span>
              <span className="ml-2">📋</span>
            </a>
          </li>
          <li>
            <a href="/notifications" className="flex items-center p-2 hover:bg-teal-700 rounded-lg">
              <span className="text-lg">الإشعارات</span>
              <span className="ml-2">🔔</span>
            </a>
          </li>
          <li>
            <a href="/files" className="flex items-center p-2 hover:bg-teal-700 rounded-lg">
              <span className="text-lg">الملفات</span>
              <span className="ml-2">📁</span>
            </a>
          </li>
          <li>
            <a href="/messages" className="flex items-center p-2 hover:bg-teal-700 rounded-lg">
              <span className="text-lg">الرسائل</span>
              <span className="ml-2">📧</span>
            </a>
          </li>
          <li>
            <a href="/settings" className="flex items-center p-2 hover:bg-teal-700 rounded-lg">
              <span className="text-lg">الإعدادات</span>
              <span className="ml-2">⚙️</span>
            </a>
          </li>
        </ul>
      </nav>
      <div className="mt-auto">
        <button className="w-full bg-teal-700 hover:bg-teal-600 text-white py-2 rounded-lg">
          تفعيل الحساب
        </button>
      </div>
    </div>
  );
}