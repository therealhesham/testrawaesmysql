import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ArticleIcon,
  CollapsIcon,
  HomeIcon,
  LogoutIcon,
} from "../../../components/icons";
import { FaCog, FaChevronDown, FaHotel, FaFirstOrderAlt, FaPersonBooth, FaEnvelope } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import { useSidebar } from "utils/sidebarcontext";

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
    label: "الطلبات",
    icon: FaFirstOrderAlt,
    subItems: [
      { id: 21, label: "طلبات جديدة", link: "/admin/neworders" },
      { id: 22, label: "طلبات منتهية", link: "/admin/endedorders" },
    ],
  },
  {
    id: 4,
    label: "التسكين",
    icon: FaHotel,
    subItems: [
      { id: 21, label: "قائمة التسكين", link: "/admin/housedarrivals" },
      { id: 22, label: "الاعاشات", link: "/admin/checkedtable" },
    ],
  },
  {
    id: 8,
    label: "العاملات",
    icon: FaPersonBooth,
    subItems: [
      { id: 21, label: "قائمة العاملات", link: "/admin/fulllist" },
      { id: 22, label: "اضافة عاملة", link: "/admin/newhomemaid" },
    ],
  },
  {
    id: 3,
    label: "الإعدادات",
    icon: FaCog,
    link: "/admin/settings",
  },
];

const Sidebar = (props) => {
  const { toggleCollapse, setToggleCollapse } = useSidebar();
  const [isCollapsible, setIsCollapsible] = useState(false);
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
    "bg-gradient-to-b from-teal-700 to-teal-900 text-white h-screen flex flex-col shadow-2xl transition-all duration-300",
    {
      "w-64": !toggleCollapse,
      "w-16": toggleCollapse,
    }
  );

  const collapseIconClasses = classNames(
    "p-2 rounded-full bg-teal-800/50 hover:bg-teal-700 absolute left-2 top-2 transition-transform duration-200",
    {
      "rotate-180": toggleCollapse,
    }
  );

  const getNavItemClasses = useCallback(
    (menu: MenuItem) => {
      return classNames(
        "flex items-center px-4 py-3 mx-2 my-1 rounded-lg hover:bg-teal-700/50 transition-colors duration-200",
        {
          "bg-teal-600/50": activeMenu?.id === menu.id,
          "justify-center": toggleCollapse,
        }
      );
    },
    [activeMenu, toggleCollapse]
  );

  const getSubNavItemClasses = useCallback(
    (subItem: SubMenuItem) => {
      return classNames(
        "flex items-center px-8 py-2 mx-2 my-1 rounded-lg hover:bg-teal-700/30 transition-colors duration-200 text-sm",
        {
          "bg-teal-600/30": router.pathname === subItem.link,
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

  const onMouseOver = useCallback(() => {
    setIsCollapsible(!toggleCollapse);
  }, [toggleCollapse]);

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
      setImage(info.picture);
      setInfo(info.username);
      setRole(info.role.toLowerCase());
    } catch (error) {
      router.push("/admin/login");
    }
  }, []);

  return (
    <div
      className={wrapperClasses}
      onMouseEnter={onMouseOver}
      onMouseLeave={onMouseOver}
      style={{ transition: "width 300ms cubic-bezier(0.2, 0, 0, 1) 0s" }}
    >
      <div className="flex flex-col relative">
        {/* Header Section */}
        <div className="flex items-center justify-center relative p-4 border-b border-teal-600/30">
          {!toggleCollapse && (
            <div className="flex flex-col items-center gap-2">
              <img
                src={image || "/images/favicon.ico"}
                alt="Profile"
                className="rounded-full w-16 h-16 object-cover ring-2 ring-teal-500/50"
              />
              <span className="text-sm font-medium text-teal-100">
                مرحباً {info}
              </span>
            </div>
          )}
          {toggleCollapse && (
            <img
              src={image || "/images/favicon.ico"}
              alt="Profile"
              className="rounded-full w-10 h-10 object-cover ring-2 ring-teal-500/50"
            />
          )}
          <button
            aria-label="Collapse Sidebar"
            className={collapseIconClasses}
            onClick={handleSidebarToggle}
          >
            <CollapsIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col mt-6">
          {menuItems.map(({ icon: Icon, subItems, ...menu }) => {
            const classes = getNavItemClasses(menu);
            return (
              <div key={menu.id}>
                <div className={classes} onClick={() => subItems && toggleSubMenu(menu.id)}>
                  {menu.link ? (
                    <Link href={menu.link}>
                      <a className="flex items-center w-full h-full">
                        <Icon className="w-6 h-6" />
                        {!toggleCollapse && (
                          <span className="text-sm font-medium mr-4">{menu.label}</span>
                        )}
                      </a>
                    </Link>
                  ) : (
                    <div className="flex items-center w-full h-full">
                      <Icon className="w-6 h-6" />
                      {!toggleCollapse && (
                        <>
                          <span className="text-sm font-medium mr-4">{menu.label}</span>
                          {subItems && (
                            <FaChevronDown
                              className={classNames("ml-auto w-4 h-4", {
                                "rotate-180": openMenu === menu.id,
                              })}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Submenu Items */}
                {!toggleCollapse && subItems && openMenu === menu.id && (
                  <div className="mt-1">
                    {subItems.map((subItem) => (
                      <div key={subItem.id} className={getSubNavItemClasses(subItem)}>
                        <Link href={subItem.link}>
                          <a className="flex items-center w-full h-full">
                            <span className="text-sm">{subItem.label}</span>
                          </a>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Admin Links */}
          {role === "admin" && !toggleCollapse && (
            <div className="mt-4">
              <div className={getNavItemClasses({ id: 9, label: "المديرين", icon: ArticleIcon })}>
                <Link href="/admin/addadmin">
                  <a className="flex items-center w-full h-full">
                    <ArticleIcon className="w-6 h-6" />
                    <span className="text-sm font-medium mr-4">المديرين</span>
                  </a>
                </Link>
              </div>
              <div className={getNavItemClasses({ id: 10, label: "قائمة البريد", icon: FaEnvelope })}>
                <Link href="/admin/addemail">
                  <a className="flex items-center w-full h-full">
                    <FaEnvelope className="w-6 h-6" />
                    <span className="text-sm font-medium mr-4">قائمة البريد</span>
                  </a>
                </Link>
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="mt-auto p-4 border-t border-teal-600/30">
        <div
          className={getNavItemClasses({
            id: 0,
            label: "Logout",
            icon: LogoutIcon,
            link: "/",
          })}
          onClick={handleLogout}
        >
          <LogoutIcon className="w-6 h-6" />
          {!toggleCollapse && <span className="text-sm font-medium mr-4">Logout</span>}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;