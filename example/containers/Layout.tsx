//@ts-nocheck
import * as React from "react";
import { useContext, useEffect } from "react";
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
import { FaEnvelope, FaArrowRight, FaArrowLeft } from "react-icons/fa";

interface ILayout {
  children: React.ReactNode;
}

function Layout({ children }: ILayout) {
  const { isSidebarOpen } = useContext(SidebarContext);
  const router = useRouter();
  const user = {};
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
    try {
      const token = localStorage.getItem("token");
      const info = jwtDecode(token);
      setImage(info.picture);
    } catch (error) {
      console.error("Error decoding token:", error);
      router.push("/admin/login");
    }
  }, []);

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
      <div className="flex flex-col flex-1 w-full">
        <nav className="bg-white shadow-lg" dir="rtl">
          <div className="max-w-7xl mx-auto px-4 بیش از حد:6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <img
                  src="/images/coloredlogo.png"
                  className="h-10 w-10 object-contain"
                  alt="لوجو روائس"
                />
                <div className="flex-shrink-0">
                  <Link href="/admin/home">
                    <span className="text-2xl font-bold text-yellow-600">
                      روائس للإستقدام
                    </span>
                  </Link>
                </div>
                {/* Navigation Arrows */}
                
              </div>

              {/* Right Section: Notification, Profile Picture, and Logout Button */}
              <div className="flex items-center space-x-4 space-x-reverse">
                
                <NotificationDropdown />
                <div className="flex-shrink-0">
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={image ? image : "/images/favicon.ico"}
                    alt="الصورة الشخصية"
                  />
                </div>
                <button
                  className="bg-yellow-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  onClick={handleLogout}
                >
                  تسجيل الخروج
                </button>
             <div className="mr-4 flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={goBack}
                    className="text-yellow-600 hover:text-yellow-800 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    title="الرجوع"
                  >
                    <FaArrowRight className="h-5 w-5" />
                  </button>
                  <button
                    onClick={goForward}
                    className="text-yellow-600 hover:text-yellow-800 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    title="التقدم"
                  >
                    <FaArrowLeft className="h-5 w-5" />
                  </button>
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