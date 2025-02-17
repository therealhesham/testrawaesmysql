//@ts-nocheck

import { useContext, useEffect } from "react";
import SidebarContext, { SidebarProvider } from "context/SidebarContext";
import Sidebar from "example/components/Sidebar/sidebar";
import Header from "example/components/Header";
import Main from "./Main";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";

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
