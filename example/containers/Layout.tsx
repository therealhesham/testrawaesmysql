//@ts-nocheck
import * as React from "react";
import { useContext, useEffect, useState } from "react";
import SidebarContext, { SidebarProvider } from "context/SidebarContext";
import Style from "styles/Home.module.css";
import Link from "next/link";
import Sidebar from "example/components/Sidebar/sidebar";
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
    if (notificationDiv && !notificationDiv.contains(event.target as Node)) {
      setIsNotificationOpen(false);
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
  useEffect(() => {
    if (!localStorage.getItem("token")) router.push("/admin/login");
    const decoder = localStorage.getItem("token");
    const decoded = jwtDecode(decoder);
    if (isJwtExpired(decoder)) return router.push("/admin/login");
    try {
      const token = localStorage.getItem("token");
      const info = jwtDecode(token);
      setImage(info.picture);
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

  // Navigation functions for arrows
  const goBack = () => {
    window.history.back();
  };

  const goForward = () => {
    window.history.forward();
  };

  return (
    <div dir="rtl" className="flex h-screen w-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full h-full ">
        <nav className="bg-white shadow-lg py-2" dir="rtl ">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <img
                  src="/images/homelogo.png"
                  className="h-20 w-30 object-contain"
                  alt="لوجو روائس"
                />
                <div className="flex-shrink-0">
                  {/* <Link href="/admin/home">
                    <span className="text-2xl font-bold text-yellow-600">
                      روائس للإستقدام
                    </span>
                  </Link> */}
                </div>
              </div>

              <div className="flex items-center cursor-pointer space-x-4 ml-4 align-baseline  ">
                {/* أيقونة الجرس مع القائمة المنسدلة */}
                <div className="relative">
                  <div onClick={toggleNotificationDropdown}>
                    <BellIcon className="w-7 h-7 text-teal-700" />
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 text-sm ml-2 rounded-full"></span>
                  </div>
                  {/* القائمة المنسدلة */}
                  {isNotificationOpen && (
                    <div className="absolute top-10 left-0 w-64 bg-white shadow-lg rounded-lg z-10">
                      <ul className="py-2">
                        {notifications.map((n) => (
                          <li
                            key={n.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{n.message}</p>
                                <p className="text-xs text-gray-500">
                                  منذ {new Date(n.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                className="text-teal-600 hover:text-teal-800"
                                onClick={() => {
                  router.push(`/admin/notifications`); // هنا يمكنك تعديل الرابط حسب الحاجة
                                  // هنا يمكنك 
                                  // إضافة منطق لفتح الإشعار أو التعامل معه
                                  console.log("Notification clicked:", n);
                                }}
                              >
                                <ArrowRightIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </li>
                        ))}                      </ul>
                    </div>
                  )}
                </div>
<div>

<span className="text-red-500 text-sm">

  لديك {counts.unread} إشعارات جديدة  
</span>

</div>
                <div className="rounded-xl flex align-baseline justify-between w-14 border border-gray-200 h-8">
                  <FaSortDown />
                  <img src="/images/favicon.ico" />
                </div>
              </div>
            </div>
          </div>
        </nav>
        <div className="flex justify-start" style={{ marginLeft: "20%" }}></div>
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