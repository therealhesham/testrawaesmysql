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
import ReportsIcon from "components/icons/reports";
import { jwtDecode } from "jwt-decode";
import { useSidebar } from "utils/sidebarcontext";
import NotificationDropdown from "components/notifications";
import { FaCog, FaChevronDown, FaHotel, FaFirstOrderAlt, FaPersonBooth } from "react-icons/fa";

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
      { id: 41, label: "قائمة التسكين", link: "/admin/housedarrivals" },
      { id: 42, label: "الاعاشات", link: "/admin/checkedtable" },
    ],
  },
  {
    id: 8,
    label: "العاملات",
    icon: FaPersonBooth,
    subItems: [
      { id: 81, label: "قائمة العاملات", link: "/admin/fulllist" },
      { id: 82, label: "اضافة عاملة", link: "/admin/newhomemaid" },
    ],
  },
  {
    id: 3,
    label: "الإعدادات",
    icon: FaCog,
    link: "/admin/settings",
  },
];

const Sidebar = () => {
  const { toggleCollapse, setToggleCollapse } = useSidebar();
  const [isCollapsible, setIsCollapsible] = useState(false);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const router = useRouter();
  const [image, setImage] = useState<string | undefined>();
  const [info, setInfo] = useState<string | undefined>();
  const [role, setRole] = useState<string | undefined>();

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
    "bg-teal-600 h-screen px-4 pt-8 pb-4 flex justify-between flex-col",
    {
      "w-80": !toggleCollapse,
      "w-20": toggleCollapse,
    }
  );

  const collapseIconClasses = classNames(
    "p-4 rounded bg-teal-700 absolute left-2 top-2",
    {
      "rotate-180": toggleCollapse,
    }
  );

  const getNavItemClasses = useCallback(
    (menu: MenuItem) => {
      return classNames(
        "flex items-center px-5 py-3 cursor-pointer hover:bg-teal-500 rounded w-full overflow-hidden whitespace-nowrap text-md font-medium text-white",
        {
          "bg-teal-500": activeMenu?.id === menu.id,
        }
      );
    },
    [activeMenu]
  );

  const getSubNavItemClasses = useCallback(
    (subItem: SubMenuItem) => {
      return classNames(
        "flex items-center cursor-pointer hover:bg-teal-500 rounded w-full overflow-hidden whitespace-nowrap text-sm font-medium text-white py-2 justify-center",
        {
          "bg-teal-500": router.pathname === subItem.link,
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
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      const decoded = jwtDecode<{ picture: string; username: string; role: string }>(token);
      setImage(decoded.picture);
      setInfo(decoded.username);
      setRole(decoded.role.toLowerCase());
    } catch (error) {
      console.error("Error decoding token:", error);
      router.push("/admin/login");
    }
  }, [router]);

  return (
    <div
      className={wrapperClasses}
      onMouseEnter={onMouseOver}
      onMouseLeave={onMouseOver}
      style={{
        transition: "width 300ms cubic-bezier(0.2, 0, 0, 1) 0s",
        minWidth: toggleCollapse ? "5rem" : "20rem",
        maxWidth: "20rem",
      }}
    >
      <div className="flex flex-col relative">
        <div className="flex items-center justify-center relative" dir="ltr">
          <div className="flex flex-col items-center justify-center gap-4">
            <img
              src={image || "/images/favicon.ico"}
              alt="Profile"
              className="rounded-full w-24 h-24 object-cover"
            />
            <span
              className={classNames("mt-2 text-lg font-medium text-white", {
                hidden: toggleCollapse,
              })}
            >
              مرحبا {info}
            </span>
          </div>

          <button
            aria-label="Collapse Sidebar"
            className={collapseIconClasses}
            onClick={handleSidebarToggle}
          >
            <CollapsIcon />
          </button>
        </div>

        <div className="flex flex-col mt-12 items-center mr-3">
          {menuItems.map(({ icon: Icon, subItems, ...menu }) => {
            const classes = getNavItemClasses(menu);
            return (
              <div key={menu.id}>
                <div className={classes} onClick={() => toggleSubMenu(menu.id)}>
                  {menu.link ? (
                    <Link href={menu.link}>
                      <a className="flex items-center justify-between w-full h-full py-4 px-3">
                        <div className="flex items-center">
                          <div style={{ width: "2.5rem", color: "white" }}>
                            <Icon />
                          </div>
                          {!toggleCollapse && (
                            <span className="text-md font-medium text-white mr-2">
                              {menu.label}
                            </span>
                          )}
                        </div>
                      </a>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between w-full h-full py-4 px-3">
                      <div className="flex items-center">
                        <div style={{ width: "2.5rem", color: "white" }}>
                          <Icon />
                        </div>
                        {!toggleCollapse && (
                          <span className="text-md font-medium text-white mr-2">
                            {menu.label}
                          </span>
                        )}
                      </div>
                      {!toggleCollapse && subItems && (
                        <FaChevronDown
                          className={classNames("ml-2", {
                            "rotate-180": openMenu === menu.id,
                          })}
                        />
                      )}
                    </div>
                  )}
                </div>

                {!toggleCollapse && subItems && openMenu === menu.id && (
                  <div className="w-full flex justify-center flex-col items-center">
                    {subItems.map((subItem) => (
                      <div key={subItem.id} className={getSubNavItemClasses(subItem)}>
                        <Link href={subItem.link}>
                          <a className="flex items-center justify-center w-full h-full">
                            <span className="text-sm font-medium text-white">
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
        </div>

        {role === "admin" && (
          <Link href="/admin/addadmin">
                          <a className="flex items-center justify-center w-full h-full">

              <div className="flex items-center">
                <div style={{ width: "2.5rem", color: "white" }}>
                  <ArticleIcon fill="white" />
                </div>
                {!toggleCollapse && (
                  <span className="text-md font-medium text-white mr-2">
                    المديرين
                  </span>
                )}
              </div>
            </a>
          </Link>
        )}
      </div>

      <div
        className={getNavItemClasses({
          id: 0,
          label: "تسجيل الخروج",
          icon: LogoutIcon,
          link: "/",
        })}
        onClick={handleLogout}
      >
        <div className="flex items-center">
          <div style={{ width: "2.5rem" }}>
            <LogoutIcon fill="white" />
          </div>
          {!toggleCollapse && (
            <span className="text-md font-medium text-white mr-2">
              تسجيل الخروج
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;