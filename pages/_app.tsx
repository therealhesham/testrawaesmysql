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
import QuickClientRegistrationModal from "../components/QuickClientRegistrationModal";
import ChangelogModal from "../components/ChangelogModal";
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
  const isLoginPage = router.pathname.includes('/login');

  useEffect(() => {
    if (isLoginPage) return;
    // Background prefetch for Daftra accounts & cost centers to ensure instant load on accounting pages
    const prefetchDaftra = async () => {
      try {
        const [accRes, ccRes] = await Promise.all([
          fetch('/api/daftra/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }),
          fetch('/api/daftra/cost-centers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }),
        ]);
        if (accRes.ok) {
          const accData = await accRes.json();
          if (accData?.data) {
            localStorage.setItem('daftra_accounts_cache', JSON.stringify(accData.data));
          }
        }
        if (ccRes.ok) {
          const ccData = await ccRes.json();
          if (ccData?.data) {
            localStorage.setItem('daftra_cost_centers_cache', JSON.stringify(ccData.data));
          }
        }
      } catch (e) {
        // silent fail in background
      }
    };
    // Run prefetch shortly after initial load
    const timer = setTimeout(prefetchDaftra, 1000);
    return () => clearTimeout(timer);
  }, [isLoginPage]);

  return (
    <GlobalToastProvider>
      {!isLoginPage && <DeliveryNotificationWrapper />}
      <SidebarProvider>
          <Component {...pageProps} />
          {/* </Windmill> */}
      </SidebarProvider>
      {!isLoginPage && (
        <>
          <QuickClientRegistrationModal />
          <ChangelogModal />
        </>
      )}
    </GlobalToastProvider>
  );
}
export default MyApp;
