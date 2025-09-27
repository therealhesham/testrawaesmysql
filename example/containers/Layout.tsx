//@ts-nocheck
import * as React from "react";
import { useContext, useEffect, useState } from "react";
import SidebarContext, { SidebarProvider } from "context/SidebarContext";
import Style from "styles/Home.module.css";
import Link from "next/link";
import Sidebar from "example/components/Sidebar/sidebar";
import MobileNavbar from "components/MobileNavbar";
import DesktopNavbar from "components/DesktopNavbar";
import Header from "example/components/Header";
import Main from "./Main";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";
import NotificationDropdown from "components/notifications";
import { FaEnvelope, FaArrowRight, FaArrowLeft, FaCartArrowDown, FaSortDown } from "react-icons/fa";
import { BellFilled, BellOutlined } from "@ant-design/icons";
import { ArrowCircleDownIcon, ArrowDownIcon, ArrowNarrowDownIcon, ArrowRightIcon } from "@heroicons/react/outline";
import { ArrowSmDownIcon, BellIcon } from "@heroicons/react/solid";

interface ILayout {
  children: React.ReactNode;
}

function Layout({ children }: ILayout) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false); // حالة للقائمة المنسدلة
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false); // حالة للقائمة المنسدلة للمستخدم
const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState({ all: 0, read: 0, unread: 0 });
  const { isSidebarOpen } = useContext(SidebarContext);
  const router = useRouter();
  const user = {};

  const handleSignOut = () => {
    console.log("Signing out...");
  };

const fetchNotifications = async  ()=>{
    try {
      const response = await fetch(`/api/notifications?tab=unread&limit=5`);
      if (!response.ok) throw new Error("Failed to fetch notifications");

      const { data, counts } = await response.json();
      setNotifications(data);
      setCounts(counts);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }

}
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const notificationDiv = document.querySelector(".notification-dropdown");
    const userDropdownDiv = document.querySelector(".user-dropdown");
    if (notificationDiv && !notificationDiv.contains(event.target as Node)) {
      setIsNotificationOpen(false);
    }
    if (userDropdownDiv && !userDropdownDiv.contains(event.target as Node)) {
      setIsUserDropdownOpen(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
  

function isJwtExpired(token) {
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload));
    
    if (!decoded.exp) return false; // no exp claim, assume not expired

    const now = Math.floor(Date.now() / 1000); // current time in seconds
    return decoded.exp < now;
  } catch (e) {
    console.error("Invalid JWT:", e);
    return true; // treat invalid token as expired
  }
}


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

  const [image, setImage] = React.useState<string | null>(null);
  const [userName, setUserName] = React.useState<string>("");
  useEffect(() => {
    try {

    if (!localStorage.getItem("token")) router.push("/admin/login");
    const decoder = localStorage.getItem("token");
    const decoded = jwtDecode(decoder);
    console.log("Decoded JWT:", isJwtExpired(decoder));
    if (isJwtExpired(decoder)) return router.push("/admin/login");
      const token = localStorage.getItem("token");
      const info = jwtDecode(token);
      setImage(info.picture);
      console.log(info);
      setUserName(info.username);
    } catch (error) {
      console.error("Error decoding token:", error);
      router.push("/admin/login");
    }
    fetchNotifications()
  }, []);

  // دالة لتبديل حالة القائمة المنسدلة
  const toggleNotificationDropdown = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  // دالة لتبديل حالة القائمة المنسدلة للمستخدم
  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  // Navigation functions for arrows
  const goBack = () => {
    window.history.back();
  };

  const goForward = () => {
    window.history.forward();
  };

  return (
    <div dir="rtl" className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${Style["tajawal-regular"]}`}>
      {/* Mobile Navbar */}
      <MobileNavbar />
      
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen w-screen">
        <Sidebar />
        <div className="flex flex-col flex-1 w-full h-full">
          <DesktopNavbar />
          <div className="flex justify-start" style={{ marginLeft: "20%" }}></div>
          <Main>{children}</Main>
        </div>
      </div>
      
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <Main>{children}</Main>
      </div>
    </div>
  );
}

export default Layout;

export async function getServerSideProps(context: NextPageContext) {
  const { req, res } = context;
  try {
    const isAuthenticated = req.cookies.authToken ? true : false;
    if (!isAuthenticated) {
      return {
        redirect: {
          destination: "/admin/login",
          permanent: false,
        },
      };
    }
    const user = jwt.verify(req.cookies.authToken, "rawaesecret");
    return {
      props: { user },
    };
  } catch (error) {
    console.log(error);
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }
}