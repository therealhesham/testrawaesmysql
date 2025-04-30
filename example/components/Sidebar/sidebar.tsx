import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ArticleIcon,
  CollapsIcon,
  HomeIcon,
  LogoIcon,
  LogoutIcon,
  UsersIcon,
  VideosIcon,
} from "../../../components/icons";
import ReportsIcon from "components/icons/reports";
import { jwtDecode } from "jwt-decode";
import { useSidebar } from "utils/sidebarcontext";
import NotificationDropdown from "components/notifications";
import { FaCog, FaChevronDown, FaLaptopHouse, FaHotel, FaFirstOrder, FaFirstOrderAlt } from "react-icons/fa";
import { MenuAlt1Icon } from "@heroicons/react/solid";

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
      // { id: 23, label: "طلبات مكتملة", link: "/admin/orders/completed" },
    ],
  },
  {
    id: 4,
    label: "التسكين",
    icon: FaHotel ,
    subItems: [
      { id: 21, label: "قائمة التسكين", link: "/admin/housedarrivals" },
      { id: 22, label: "الاعاشات", link: "/admin/checkedtable" },
      // { id: 23, label: "طلبات مكتملة", link: "/admin/orders/completed" },
    ],
  },{
    id: 3,
    label: "الإعدادات",
    icon: FaCog,

    link:"/admin/settings"
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

  // Memoize active menu item based on the current route
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
    "bg-teal-600 p-4 h-screen px-4 pt-8 pb-4 bg-light flex justify-between flex-col",
    {
      "w-80": !toggleCollapse,
      "w-20": toggleCollapse,
    }
  );

  const collapseIconClasses = classNames(
    "p-4 rounded bg-light-lighter absolute right-0",
    {
      "rotate-180": toggleCollapse,
    }
  );

  const getNavItemClasses = useCallback(
    (menu: MenuItem) => {
      return classNames(
        "flex items-center px-5 cursor-pointer hover:bg-light-lighter rounded w-full overflow-hidden whitespace-nowrap text-md font-medium text-text-light text-white flex items-center justify-center pl-1 gap-4",
        {
          "bg-light-lighter": activeMenu?.id === menu.id,
        }
      );
    },
    [activeMenu]
  );

  const getSubNavItemClasses = useCallback(
    (subItem: SubMenuItem) => {
      return classNames(
        "flex items-center cursor-pointer hover:bg-light-lighter rounded w-full overflow-hidden whitespace-nowrap text-sm font-medium text-text-light text-white py-2 justify-center",
        {
          "bg-light-lighter": router.pathname === subItem.link,
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
      style={{
        transition: "width 300ms cubic-bezier(0.2, 0, 0, 1) 0s",
        minWidth: toggleCollapse ? "5rem" : "20rem",
        maxWidth: "20rem",
      }}
    >
      <div className="flex flex-col">
        <div className="flex items-center justify-center relative">
          <div className="flex flex-col items-center justify-center pl-1 gap-4">
            <img
                    src={image ? image : "/images/favicon.ico"}

              // src={image}
              alt="Profile"
              className="rounded-full w-24 h-24 object-cover"
            />
            <span
              className={classNames(
                "mt-2 text-lg font-medium text-white text-text",
                {
                  hidden: toggleCollapse,
                }
              )}
            >
              Welcome {info}
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

        <div className="flex flex-col items-start mt-24">
          {menuItems.map(({ icon: Icon, subItems, ...menu }) => {
            const classes = getNavItemClasses(menu);
            return (
              <div key={menu.id}>
                <div className={classes} onClick={() => toggleSubMenu(menu.id)}>
                  {menu.link ? (
                    <Link href={menu.link}>
                      <a className="flex py-4 px-3 items-center justify-center w-full h-full">
                        <div style={{ width: "2.5rem", color: "white" }}>
                          <Icon />
                        </div>
                        {!toggleCollapse && (
                          <span className="text-md font-medium text-text-light text-white">
                            {menu.label}
                          </span>
                        )}
                      </a>
                    </Link>
                  ) : (
                    <div className="flex py-4 px-3 items-center justify-center w-full h-full">
                      <div style={{ width: "2.5rem", color: "white" }}>
                        <Icon />
                      </div>
                      {!toggleCollapse && (
                        <span className="text-md font-medium text-text-light text-white">
                          {menu.label}
                        </span>
                      )}
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
                  <div className="w-full flex justify-center" style={{flexWrap:"wrap"}}>
                    {subItems.map((subItem) => (
                      <div
                        key={subItem.id}
                        className={getSubNavItemClasses(subItem)}
                      >
                        <Link href={subItem.link}>
                          <a className="flex items-center   justify-center w-full h-full">
                            <span className="text-sm font-medium text-text-light text-white">
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
        {/* <Link href="/admin/settings">
          <a className="flex py-4 px-3 items-center justify-center w-full h-full">
            <div style={{ width: "2.5rem", color: "white" }}>
              <FaCog />
            </div>
            {!toggleCollapse && (
              <span className="text-md font-medium text-text-light text-white">
                الإعدادات
              </span>
            )}
          </a>
        </Link> */}

        {role === "admin" && (
          <Link href="/admin/addadmin">
            <a className="flex py-4 px-3 items-center justify-center w-full h-full">
              <div style={{ width: "2.5rem", color: "white" }}>
                <ArticleIcon fill="white" />
              </div>
              {!toggleCollapse && (
                <span className="text-md font-medium text-text-light text-white">
                  المديرين
                </span>
              )}
            </a>
          </Link>
        )}
      </div>
      <div
        className={getNavItemClasses({
          id: 0,
          label: "Logout",
          icon: LogoutIcon,
          link: "/",
        })}
        onClick={handleLogout}
      >
        <div style={{ width: "2.5rem" }}>
          <LogoutIcon fill="white" />
        </div>
        {!toggleCollapse && (
          <span className="text-md font-medium text-text-light text-white">
            Logout
          </span>
        )}
      </div>
    </div>
  );
};

export default Sidebar;