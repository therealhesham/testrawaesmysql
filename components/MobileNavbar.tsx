import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaBars, FaTimes, FaChevronDown, FaChevronUp, FaCog, FaEnvelope, FaBuilding } from 'react-icons/fa';
  // HomeIcon, 
  // DocumentTextIcon, 
  // PeopleIcon, 
  // FaBuilding, 
  // FaEnvelope, 
  // FaCog,
  // CurrencyDollarIcon,
  // BellIcon
import { jwtDecode } from 'jwt-decode';
import { CurrencyDollarIcon, DocumentIcon, DocumentTextIcon, TemplateIcon } from '@heroicons/react/outline';
import { BellIcon, PeopleIcon } from 'icons';
import { HomeIcon } from './icons';
// HomeIcon
// FaCog
// FaEnvelope
// FaBuilding
// DocumentIcon
// PeopleIcon
// PeopleIcon

// BellIcon// CurrencyDollarIcon
interface MenuItem {
  id: number;
  label: string;
  icon: React.ElementType;
  link?: string;
  subItems?: SubMenuItem[];
}

interface SubMenuItem {
  id: number;
  label: string;
  link: string;
}

const menuItems: MenuItem[] = [
  { id: 1, label: "الرئيسية", icon: HomeIcon, link: "/admin/home" },
  {
    id: 2,
    label: "ادارة الطلبات",
    icon: DocumentTextIcon,
    subItems: [
      { id: 21, label: "طلبات جديدة", link: "/admin/neworders" },
      { id: 22, label: "الطلبات الحالية", link: "/admin/currentorderstest" },
    ],
  },
  { id: 3, label: "قائمة العملاء", icon: PeopleIcon, link: "/admin/clients" },
  {
    id: 4,
    label: "ادارة العاملات",
    icon: PeopleIcon,
    subItems: [
      { id: 41, label: "قائمة العاملات", link: "/admin/fulllist" },
      { id: 42, label: "العاملات المتاحات", link: "/admin/availablelist" },
      { id: 43, label: "العاملات المحجوزات", link: "/admin/bookedlist" },
    ],
  },
  {
    id: 5,
    label: "شئون الاقامة",
    icon: FaBuilding,
    subItems: [
      { id: 51, label: "التسكين", link: "/admin/housedarrivals" },
      { id: 52, label: "الاعاشات", link: "/admin/checkedtable" },
    ],
  },
  {
    id: 2002,
    label: "الوصول و المغادرة",
    icon: FaBuilding,
    subItems: [
      { id: 512, label: "الوصول", link: "/admin/arrival-list" },
      { id: 522, label: "المغادرة الداخلية", link: "/admin/deparatures" },
      { id: 523, label: "المغادرة الخارجية", link: "/admin/deparaturesfromsaudi" },
    ],
  },
  { id: 6, label: "الاشعارات", icon: BellIcon, link: "/admin/notifications" },
  { id: 7, label: "التقارير", icon: DocumentTextIcon, link: "/admin/reports" },
  { id: 8, label: "القوالب", icon: TemplateIcon, link: "/admin/templates" },
  {
    id: 9,
    label: "ادارة المراسلات",
    icon: FaEnvelope,
    subItems: [
      { id: 91, label: "قائمة المراسلات", link: "/admin/messages" },
    ],
  },
  {
    id: 254,
    label: "ادارة المحاسبة",
    icon: CurrencyDollarIcon,
    subItems: [
      { id: 91, label: "كشف حساب المكاتب الخارجية", link: "/admin/foreign_offices_financial" },
      { id: 92, label: "كشف حساب العملاء", link: "/admin/client-accounts" },
      { id: 93, label: "كشف حساب الموظفين", link: "/admin/employee_cash" },
      { id: 94, label: "التقرير المالي لمساند", link: "/admin/musanad_finacial" },
      { id: 95, label: "التسوية المالية", link: "/admin/settlement" },
      { id: 96, label: "قائمة الدخل", link: "/admin/incomestatments-updated" },
      { id: 97, label: "سجل النظام المحاسبي", link: "/admin/account-systemlogs" },
    ],
  },
  {
    id: 10,
    label: "الإعدادات",
    icon: FaCog,
    subItems: [
      { id: 91, label: "الملف الشخصي", link: "/admin/messages_list" },
      { id: 92, label: "ادارة المحاسبين", link: "/admin/send_message_to_office" },
      { id: 93, label: "سجل العمليات", link: "/admin/systemlogs" },
      { id: 94, label: "إدارة المستخدمين", link: "/admin/authorizations" },
    ],
  },
];

const MobileNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState<number | null>(null);
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        setUserName(decoded.username || '');
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleSubMenu = (menuId: number) => {
    setOpenSubMenu(openSubMenu === menuId ? null : menuId);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
      });
      if (response.status === 200) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const activeMenu = menuItems.find(
    (menu) =>
      menu.link === router.pathname ||
      menu.subItems?.some((subItem) => subItem.link === router.pathname)
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/images/homelogo.png"
              className="h-12 w-auto object-contain"
              alt="لوجو روائس"
            />
          </div>

          {/* Burger Menu Button */}
          <button
            onClick={toggleMenu}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
          >
            {isOpen ? (
              <FaTimes className="h-6 w-6" />
            ) : (
              <FaBars className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={toggleMenu}
          />
          
          {/* Sidebar */}
          <div className="relative flex-1 flex flex-col w-80 max-w-sm bg-[#1a4d4f] text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-teal-700/30">
              <div className="flex items-center gap-3">
                <img
                  src="/images/favicon.ico"
                  alt="Profile"
                  className="rounded-full w-10 h-10 object-cover ring-2 ring-teal-400/50"
                />
                <span className="text-sm font-semibold text-teal-100">
                  مرحباً {userName}
                </span>
              </div>
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-teal-700/50"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto py-4">
              {menuItems.map(({ icon: Icon, subItems, ...menu }) => {
                const isActive = activeMenu?.id === menu.id;
                const isSubMenuOpen = openSubMenu === menu.id;

                return (
                  <div key={menu.id} className="px-2">
                    {menu.link ? (
                      <Link href={menu.link}>
                        <a
                          className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-teal-600 text-white'
                              : 'text-gray-300 hover:bg-teal-700/50 hover:text-white'
                          }`}
                          onClick={toggleMenu}
                        >
                          <Icon className="w-5 h-5 ml-3" />
                          {menu.label}
                        </a>
                      </Link>
                    ) : (
                      <div>
                        <button
                          className={`flex items-center justify-between w-full px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-teal-600 text-white'
                              : 'text-gray-300 hover:bg-teal-700/50 hover:text-white'
                          }`}
                          onClick={() => toggleSubMenu(menu.id)}
                        >
                          <div className="flex items-center">
                            <Icon className="w-5 h-5 ml-3" />
                            {menu.label}
                          </div>
                          {subItems && (
                            isSubMenuOpen ? (
                              <FaChevronUp className="w-4 h-4" />
                            ) : (
                              <FaChevronDown className="w-4 h-4" />
                            )
                          )}
                        </button>

                        {/* Submenu */}
                        {subItems && isSubMenuOpen && (
                          <div className="mt-1 space-y-1 pr-8">
                            {subItems.map((subItem) => (
                              <Link key={subItem.id} href={subItem.link}>
                                <a
                                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                                    router.pathname === subItem.link
                                      ? 'bg-teal-500/50 text-white'
                                      : 'text-gray-400 hover:bg-teal-700/30 hover:text-white'
                                  }`}
                                  onClick={toggleMenu}
                                >
                                  {subItem.label}
                                </a>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-teal-700/30">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-3 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors"
              >
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavbar;
