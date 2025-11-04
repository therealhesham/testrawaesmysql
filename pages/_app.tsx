//@ts-nocheck
import "../styles/globals.css";
import "tailwindcss/tailwind.css";
import { SessionProvider } from "next-auth/react";
import React, { useContext, useEffect, useState } from "react";
import { Windmill } from "@roketid/windmill-react-ui";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "react-query";
import { User } from "utils/usercontext";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/router";
import "@fortawesome/fontawesome-free/css/all.css";

import { SidebarProvider } from "utils/sidebarcontext";
import { GlobalToastProvider } from "../components/GlobalToast";
import { DeliveryNotificationWrapper } from "../components/DeliveryNotificationWrapper";
// import { SidebarProvider } from "context/SidebarContext";
function MyApp({ Component, pageProps }: AppProps) {
  const [user, setUser] = useState("ssssss");
  const router = useRouter();

  const usercontext = useContext(User);
  useEffect(() => {
    // Add a class to the body
    // document.body.classList.add("bg-gray-100");
    // document.body.classList.add("w-full");
    // Clean up (optional)
  }, []);

  useEffect(() => {
    // if (usercontext?.user == "ssssss") return router.push("/admin/login");
    // if (!localStorage.getItem("token")) router.push("/admin/login");
  }, [router.isReady]);
  // suppress useLayoutEffect warnings when running outside a browser
  if (!process.browser) React.useLayoutEffect = React.useEffect;
  // console.log(session)
  const queryClient = new QueryClient();
  useEffect(() => {}, []);
  // console.log(pageProps);
  
  const isLoginPage = typeof window !== "undefined" && window.location.pathname === "/login";

  return (
    <GlobalToastProvider>
      <DeliveryNotificationWrapper />
      <SidebarProvider>
          <Component {...pageProps} />
          {/* </Windmill> */}
      </SidebarProvider>
    </GlobalToastProvider>
  );
}
export default MyApp;
