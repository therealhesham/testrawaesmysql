

import classNames from "classnames";
import Link from "next/link";
import Style from "../../../styles/Home.module.css";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ArticleIcon,
  CollapsIcon,
  HomeIcon,
  LogoutIcon,
} from "../../../components/icons";
import { FaCog, FaChevronDown, FaHotel, FaFirstOrderAlt, FaPersonBooth, FaEnvelope, FaDailymotion, FaBuilding, FaEnvelopeOpen } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import { useSidebar } from "utils/sidebarcontext";
import { AlertOutlined, BellFilled, BellOutlined, DollarCircleFilled, FileWordOutlined, MessageOutlined, NotificationFilled, NotificationOutlined } from "@ant-design/icons";
import { CurrencyDollarIcon, DocumentAddIcon, DocumentIcon, DocumentTextIcon, TemplateIcon } from "@heroicons/react/outline";
import { PeopleIcon } from "icons";
import ReportsIcon from "components/icons/reports";

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
function Bell() {
  return( 
     <svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 24 24"
     fill="currentColor"
     className="w-6 h-6">
  <path d="M12 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 006 14h12a1 1 0 00.707-1.707L18 11.586V8a6 6 0 00-6-6z" />
  <path d="M10 18a2 2 0 104 0h-4z" />
</svg>

  )
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
      { id: 522, label: "المغادرة الخارجية", link: "/admin/deparaturesfromsaudi" },

    ],
  },
  { id: 6, label: "الاشعارات", icon: Bell, link: "/admin/notifications" },
  { id: 7, label: "التقارير", icon: ReportsIcon, link: "/admin/reports" },
  { id: 8, label: "القوالب", icon: TemplateIcon, link: "/admin/templates" },
  {
    id: 9,
    label: "ادارة المراسلات",
    icon: FaEnvelope,
    subItems: [
      { id: 91, label: "قائمة المراسلات", link: "/admin/messages_list" },
      { id: 92, label: "ارسال رسالة", link: "/admin/send_message_to_office" },
    ],
  },{
    id: 254,
    label: "ادارة المحاسبة",
    icon:CurrencyDollarIcon,
    subItems: [
      { id: 91, label: "كشف حساب المكاتب الخارجية", link: "/admin/foreign_offices_financial" },
      { id: 92, label: "كشف حساب العملاء", link: "/admin/client-accounts" },
      { id: 93, label: "كشف حساب الموظفين", link: "/admin/employee_cash" },

      { id: 92, label: "قائمة الدخل", link: "/admin/incomestatments-updated" },

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

const Sidebar = (props) => {
  const { toggleCollapse, setToggleCollapse } = useSidebar();
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const router = useRouter();
  const [image, setImage] = useState();
  const [info, setInfo] = useState();
  const [role, setRole] = useState();

  const activeMenu = useMemo(
    () =>
      menuItems.find(
        (menu) =>
          menu.link === router.pathname ||
          menu.subItems?.some((subItem) => subItem.link === router.pathname)
      ),
    [router.pathname]
  );

  const wrapperClasses = classNames(
    "bg-[#1a4d4f] text-white sticky top-0 h-[100vh] flex flex-col shadow-xl transition-width duration-500 ease-in-out font-inter overflow-y-hidden",
    {
      "w-72": !toggleCollapse,
      "w-20": toggleCollapse,
    }
  );

  const collapseIconClasses = classNames(
    "p-3 rounded-full bg-teal-900/70 hover:bg-teal-700/90 absolute left-3 top-3 transition-transform duration-300 ease-in-out",
    {
      "rotate-180": toggleCollapse,
    }
  );

  const getNavItemClasses = useCallback(
    (menu: MenuItem) => {
      return classNames(
        "flex items-center px-4 py-1 mx-3 my-1 rounded-xl hover:bg-teal-700/60 transition-all duration-300 ease-in-out cursor-pointer group",
        {
          "bg-teal-600/70 shadow-md": activeMenu?.id === menu.id,
          "justify-center": toggleCollapse,
        }
      );
    },
    [activeMenu, toggleCollapse]
  );

  const getSubNavItemClasses = useCallback(
    (subItem: SubMenuItem) => {
      return classNames(
        `flex ${Style["tajawal-regular"]} items-center px-8 py-2 mx-3 my-1 rounded-lg hover:bg-teal-700/40 transition-all duration-300 ease-in-out`,
        {
          "bg-teal-600/40": router.pathname === subItem.link,
        }
      );
    },
    [router.pathname]
  );

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      });
      if (response.status === 200) {
        router.push("/admin/login");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleSidebarToggle = useCallback(() => {
    setToggleCollapse((prevState) => !prevState);
  }, [setToggleCollapse]);

  const toggleSubMenu = useCallback((menuId: number) => {
    setOpenMenu((prev) => (prev === menuId ? null : menuId));
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) router.push("/admin/login");
    try {
      const token = localStorage.getItem("token");
      const info = jwtDecode(token);
      console.log("Decoded JWT:", info);
      // if (isJwtExpired(token)) return router.push("/admin/login");
      setImage(info.picture);
      setInfo(info.username);
      setRole(info.role);
    } catch (error) {
      console.error("Error decoding token:", error);  
      router.push("/admin/login");
    }
  }, []);

 return (
  <div className={wrapperClasses}>
    <div className="flex flex-col relative min-h-full">

      {/* Header Section */}
      <div className="flex items-center justify-center relative p-6 border-b border-teal-700/30">
        {!toggleCollapse ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={"/images/favicon.ico"}
              alt="Profile"
              className="rounded-full w-20 h-20 object-cover ring-2 ring-teal-400/50 transition-all duration-300"
            />
            <span className="text-base font-semibold text-teal-100">
              {/* مرحباً {info} */}
            </span>
          </div>
        ) : (
          <img
            src={image || "/images/favicon.ico"}
            alt="Profile"
            className="rounded-full w-12 h-12 object-cover ring-2 ring-teal-400/50"
          />
        )}
        
      </div>

      {/* Menu Items */}
      <nav className="flex flex-col mt-8 flex-grow overflow-y-auto pb-28">
        {menuItems.map(({ icon: Icon, subItems, ...menu }) => {
          const classes = getNavItemClasses(menu);
          const isOpen = openMenu === menu.id;

          return (
            <div key={menu.id}>
              <div
                className={classes}
                onClick={() => subItems && toggleSubMenu(menu.id)}
              >
                {menu.link ? (
                  <Link href={menu.link}>
                    <a className={`flex ${Style["tajawal-medium"]} items-center w-full h-full`}>
                      <Icon className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
                      {!toggleCollapse && (
                        <div className="flex items-center justify-between flex-1">
                          <span className={`text-md font-medium mr-4 ml-3 ${Style["tajawal-medium"]}`}>
                            {menu.label}
                          </span>
                          {subItems && (
                            <FaChevronDown
                              className={classNames(
                                "w-4 h-4 transition-transform duration-500 text-white mr-2",
                                {
                                  "rotate-180": isOpen,
                                }
                              )}
                            />
                          )}
                        </div>
                      )}
                    </a>
                  </Link>
                ) : (
                  <div className="flex items-center w-full h-full">
                    <Icon className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
                    {!toggleCollapse && (
                      <div className="flex items-center justify-between flex-1">
                        <span className={`text-md font-medium mr-4 ml-3 ${Style["tajawal-medium"]}`}>
                          {menu.label}
                        </span>
                        {subItems && (
                          <FaChevronDown
                            className={classNames(
                              "w-4 h-4 transition-transform duration-500 text-teal-200 mr-2",
                              {
                                "rotate-180": isOpen,
                              }
                            )}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submenu Items */}
              {!toggleCollapse && subItems && isOpen && (
                <div
                  className="overflow-hidden transition-all duration-500 ease-in-out"
                  style={{
                    maxHeight: isOpen ? `${subItems.length * 48}px` : "0px",
                  }}
                >
                  {subItems.map((subItem) => (
                    <div
                      key={subItem.id}
                      className={getSubNavItemClasses(subItem)}
                    >
                      <Link href={subItem.link}>
                        <a className="flex items-center w-full h-full">
                          <span className={`text-md font-semibold ${Style["tajawal-medium"]}`}>
                            {subItem.label}
                          </span>
                        </a>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* زر تسجيل الخروج مثبت */}
      <div className="absolute bottom-0 left-0 w-full p-6 border-t border-teal-800 bg-[#1a4d4f]">
        {!toggleCollapse && (
          <button
            className={`flex justify-center w-full h-full border rounded-md border-gray text-white py-3 ${Style["tajawal-regular"]}`}
            onClick={handleLogout}
          >
            تسجيل الخروج
          </button>
        )}
      </div>
    </div>
  </div>
);

};

export default Sidebar;