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
    "bg-[#1a4d4f] text-white h-screen flex flex-col shadow-xl transition-all duration-500 ease-in-out font-inter",
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
        "flex items-center px-4 py-3 mx-3 my-1 rounded-xl hover:bg-teal-700/60 transition-all duration-300 ease-in-out cursor-pointer group",
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
        "flex items-center px-8 py-2 mx-3 my-1 rounded-lg hover:bg-teal-700/40 transition-all duration-300 ease-in-out text-sm font-semibold",
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
      style={{ transition: "width 500ms cubic-bezier(0.4, 0, 0.2, 1) 0s" }}
    >
      <div className="flex flex-col relative">
        {/* Header Section */}
        <div className="flex items-center justify-center relative p-6 border-b border-teal-700/30">
          {!toggleCollapse && (
            <div className="flex flex-col items-center gap-3">
              <img
                src={image || "/images/favicon.ico"}
                alt="Profile"
                className="rounded-full w-20 h-20 object-cover ring-2 ring-teal-400/50 transition-all duration-300"
              />
              <span className="text-base font-semibold text-teal-100">
                مرحباً {info}
              </span>
            </div>
          )}
          {toggleCollapse && (
            <img
              src={image || "/images/favicon.ico"}
              alt="Profile"
              className="rounded-full w-12 h-12 object-cover ring-2 ring-teal-400/50"
            />
          )}
          <button
            aria-label="Collapse Sidebar"
            className={collapseIconClasses}
            onClick={handleSidebarToggle}
          >
            <CollapsIcon className="w-6 h-6 text-teal-200" />
          </button>
        </div>

        {/* Menu Items */}
       <nav className="flex flex-col mt-8">
  {menuItems.map(({ icon: Icon, subItems, ...menu }) => {
    const classes = getNavItemClasses(menu);
    return (
      <div key={menu.id}>
        <div className={classes} onClick={() => subItems && toggleSubMenu(menu.id)}>
          {menu.link ? (
            <Link href={menu.link}>
              <a className="flex items-center w-full h-full">
                <Icon className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
                {!toggleCollapse && (
                  <span className="text-sm font-medium mr-4 ml-3">{menu.label}</span>
                )}
              </a>
            </Link>
          ) : (
            <div className="flex items-center  w-full h-full">
              <Icon className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
              {!toggleCollapse && (
                <div className="flex items-center flex-1">
                  <span className="text-sm font-medium mr-4 ml-3">{menu.label}</span>
                  {subItems && (
                    <FaChevronDown
                       className={classNames("w-4 h-4 transition-transform duration-300 hidden", {
                        "rotate-180": openMenu === menu.id,
                      })}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submenu Items */}
        {!toggleCollapse && subItems && openMenu === menu.id && (
          <div
            className="mt-2 overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              maxHeight: openMenu === menu.id ? `${subItems.length * 48}px` : "0px",
            }}
          >
            {subItems.map((subItem) => (
              <div key={subItem.id} className={getSubNavItemClasses(subItem)}>
                <Link href={subItem.link}>
                  <a className="flex items-center w-full h-full">
                    <span className="text-sm font-semibold">{subItem.label}</span>
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
    <div className="mt-6">
      <div className={getNavItemClasses({ id: 9, label: "المديرين", icon: ArticleIcon })}>
        <Link href="/admin/addadmin">
          <a className="flex items-center w-full cursor-pointer h-full">
            <ArticleIcon className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
            <span className="text-sm font-medium mr-4 ml-3">المديرين</span>
          </a>
        </Link>
      </div>
      <div className={getNavItemClasses({ id: 10, label: "قائمة البريد", icon: FaEnvelope })}>
        <Link href="/admin/addemail">
          <a className="flex items-center w-full h-full">
            <FaEnvelope className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
            <span className="text-sm font-medium mr-4 ml-3">قائمة البريد</span>
          </a>
        </Link>
      </div>
    </div>
  )}
</nav>
      </div>

      {/* Logout Button */}
      <div className="mt-auto p-6 border-t border-teal-700/30">
        <div
          className={getNavItemClasses({
            id: 0,
            label: "Logout",
            icon: LogoutIcon,
            link: "/",
          })}
          onClick={handleLogout}
        >
          <LogoutIcon className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
          {!toggleCollapse && <span className="text-sm font-medium mr-4 ml-3">Logout</span>}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;