//@ts-nocheck

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

  return (
    // <SidebarProvider>
    <div
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
                {/* Logo Section */}
                <div className="flex-shrink-0">
                  <Link href="/admin/home">
                    <span className="text-2xl font-bold text-yellow-600">
                      Rawaes
                    </span>
                  </Link>
                </div>

                {/* Navigation Links */}
                <div className="hidden sm:mr-6 sm:flex sm:items-center sm:space-x-8 sm:space-x-reverse">
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
                  <Link href="/admin/neworders">
                    <span className="border-transparent text-yellow-500 hover:border-yellow-600 hover:text-yellow-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                      قسم الطلبات
                    </span>
                  </Link>
                </div>
              </div>

              {/* Notification Bell */}
              <div className="flex items-center">
                <NotificationDropdown />
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
