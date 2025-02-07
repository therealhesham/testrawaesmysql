import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { NextPageContext } from "next";
import React, { useState, useMemo, useCallback, useEffect } from "react";
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
interface MenuItem {
  id: number;
  label: string;
  icon: React.ElementType;
  link: string;
}

const menuItems: MenuItem[] = [
  { id: 1, label: "الرئيسية", icon: HomeIcon, link: "/admin/home" },
  { id: 2, label: "المديرين", icon: ArticleIcon, link: "/admin/addadmin" },
  { id: 3, label: "التقارير", icon: ReportsIcon, link: "/admin/reports" },
  // { id: 4, label: "Manage Tutorials", icon: VideosIcon, link: "/tutorials" },
];

const Sidebar = (props) => {
  const [toggleCollapse, setToggleCollapse] = useState(false);
  const [isCollapsible, setIsCollapsible] = useState(false);
  const router = useRouter();

  // Memoize active menu item based on the current route
  const activeMenu = useMemo(
    () => menuItems.find((menu) => menu.link === router.pathname),
    [router.pathname]
  );

  const wrapperClasses = classNames(
    "bg-purple-700 p-4 h-screen px-4 pt-8 pb-4 bg-light flex justify-between flex-col",
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
        "flex items-center cursor-pointer hover:bg-light-lighter rounded w-full overflow-hidden whitespace-nowrap text-md font-medium text-text-light text-white flex items-center justify-center pl-1 gap-4",
        {
          "bg-light-lighter": activeMenu?.id === menu.id,
        }
      );
    },
    [activeMenu]
  );

  const handleLogout = async () => {
    try {
      // Make a POST request to the logout API route
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (response.status == 200) {
        // Redirect to the login page after successful logout
        router.push("/admin/login");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const onMouseOver = useCallback(() => {
    setIsCollapsible(!isCollapsible);
  }, [isCollapsible]);

  const handleSidebarToggle = useCallback(() => {
    const newToggleState = !toggleCollapse;
    setToggleCollapse(newToggleState);
    // Save the new state to localStorage
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newToggleState));
  }, [toggleCollapse]);
  const [image, setImage] = useState();
  const [info, setInfo] = useState();

  // On component mount, check localStorage for saved state
  useEffect(() => {
    if (!localStorage.getItem("token")) router.push("/admin/login");
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setToggleCollapse(JSON.parse(savedState));
    }
    try {
      const token = localStorage.getItem("token");
      const info = jwtDecode(token);
      setImage(info.picture);
      setInfo(info.username);
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
      <div className="flex flex-col">
        <div className="flex items-center justify-center relative">
          <div className="flex flex-col items-center justify-center pl-1 gap-4">
            <img
              src={image}
              alt="Profile"
              className="rounded-full w-24 h-24 object-cover" // Circular profile image
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
          {isCollapsible && (
            <button
              aria-label="Collapse Sidebar"
              className={collapseIconClasses}
              onClick={handleSidebarToggle}
            >
              <CollapsIcon />
            </button>
          )}
        </div>

        <div className="flex flex-col items-start mt-24">
          {menuItems.map(({ icon: Icon, ...menu }) => {
            const classes = getNavItemClasses(menu);
            return (
              <div key={menu.id} className={classes}>
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
              </div>
            );
          })}
        </div>
      </div>

      <div
        className={getNavItemClasses(
          {
            id: 0,
            label: "Logout",
            icon: LogoutIcon,
            link: "/",
          },
          "text-md font-medium text-text-light text-white flex items-center justify-center pl-1 gap-4"
        )}
        onClick={handleLogout}
      >
        <div style={{ width: "2.5rem" }}>
          <LogoutIcon fill="white" />
        </div>
        {!toggleCollapse && (
          <span className="text-md font-medium text-text-light text-white flex items-center justify-center pl-1 gap-4">
            Logout
          </span>
        )}
      </div>
    </div>
  );
};
export default Sidebar;

export async function getServerSideProps(context: NextPageContext) {
  const { req, res } = context;
  try {
    const isAuthenticated = req.cookies.authToken ? true : false;
    if (!isAuthenticated) {
      // Redirect the user to login page before rendering the component
      return {
        redirect: {
          destination: "/admin/login", // Redirect URL
          permanent: false, // Set to true if you want a permanent redirect
        },
      };
    }
    const user = jwt.verify(req.cookies.authToken, "rawaesecret");
    return {
      props: { user }, // Pass user data as props
    };
  } catch (error) {
    return {
      redirect: {
        destination: "/admin/login", // Redirect URL
        permanent: false, // Set to true if you want a permanent redirect
      },
    };
  }
}
