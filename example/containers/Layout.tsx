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

  //   useEffect(()=>{

  // try {

  //     const token = Cookies.get("token")
  //   const decoder = jwtDecode(token);
  //   // alert(decoder.admin)
  //       if(!decoder.admin)return router.replace("/admin/login");
  // // console.log(decoder.idnumber)
  //   } catch (error) {
  //     router.replace("/admin/login")
  //   }

  // },[])
  const [image, setImage] = React.useState<string | null>(null);
  useEffect(() => {
    if (!localStorage.getItem("token")) router.push("/admin/login");
    try {
      const token = localStorage.getItem("token");
      const info = jwtDecode(token);
      setImage(info.picture);
      // setInfo(info.username);
      // setRole(info.role.toLowerCase());
    } catch (error) {
      console.error("Error decoding token:", error);
      router.push("/admin/login");
    }
  }, []);
  return (
    // <SidebarProvider>
    <div dir="rtl"
      className={`flex h-screen w-screen  bg-gray-50 dark:bg-gray-900 
        `}
      // ${
      // isSidebarOpen && "overflow-scroll"
      // }`}
    >
      <Sidebar />

      {/* <Sidebar /> */}
      <div className="flex flex-col flex-1 w-full">
        <nav className="bg-white shadow-lg" dir="rtl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

                {/* Navigation Links */}
                {/* <div className="hidden sm:mr-6 sm:flex sm:items-center sm:space-x-8 sm:space-x-reverse">
                  <Link href="/admin/home">
                    <span className="border-transparent text-yellow-500 hover:border-yellow-600 hover:text-yellow-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      الرئيسية
                    </span>
                  </Link>
                  <Link href="/admin/housedarrivals">
                    <span className="border-transparent text-yellow-500 hover:border-yellow-600 hover:text-yellow-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      قسم التسكين
                    </span>
                  </Link>
                  <Link href="/admin/neworderstest">
                    <span className="border-transparent text-yellow-500 hover:border-yellow-600 hover:text-yellow-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      قسم الطلبات
                    </span>
                  </Link>
                </div> */}
              </div>

              {/* Right Section: Notification, Profile Picture, and Logout Button */}
              <div className="flex items-center space-x-4 space-x-reverse">
                {/* Notification Bell */}
                <NotificationDropdown />

                {/* Profile Picture or First Letter */}
                <div className="flex-shrink-0">
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={image ? image : "/images/favicon.ico"}
                    alt="الصورة الشخصية"
                  />
                </div>

                {/* Logout Button */}
                <button
                  className="bg-yellow-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  // onClick={() => {
        onClick={handleLogout}


                    // console.log("تسجيل الخروج");
                  // }}
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>
          </div>
        </nav>
        <div
          className="  flex justify-start "
          style={{ marginLeft: "20%" }}
        ></div>
        {/* <Header /> */}
        <Main>{children}</Main>
      </div>
    </div>
    // </SidebarProvider>
  );
}

export default Layout;
export async function getServerSideProps(context: NextPageContext) {
  const { req, res } = context;
  try {
    const isAuthenticated = req.cookies.authToken ? true : false;
    console.log(req.cookies.authToken);
    // jwtDecode(req.cookies.)
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
    // If authenticated, continue with rendering the page
    // console.log(user);
    return {
      props: { user }, // Empty object to pass props if needed
    };
  } catch (error) {
    console.log(error);
    return {
      redirect: {
        destination: "/admin/login", // Redirect URL
        permanent: false, // Set to true if you want a permanent redirect
      },
    };
  }
}
