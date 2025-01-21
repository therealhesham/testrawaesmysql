//@ts-nocheck
import "../styles/globals.css";
import "tailwindcss/tailwind.css";

import React, { useContext, useEffect, useState } from "react";
import { Windmill } from "@roketid/windmill-react-ui";
import type { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "react-query";
import { User } from "utils/usercontext";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/router";
import { ToastContainer } from "react-toastify";
function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const [user, setUser] = useState({});

  const router = useRouter();
  // suppress useLayoutEffect warnings when running outside a browser
  if (!process.browser) React.useLayoutEffect = React.useEffect;
  // console.log(session)
  const queryClient = new QueryClient();
  useEffect(() => {
    try {
      // console.log(router.pathname)
      if (router.pathname == "/newcv") return;
      if (router.pathname == "/newcv/[slug]") return;
      if (router.pathname == "/client/filter/[country]") return;
      if (router.pathname == "/client/filter") return;
      if (router.pathname == "/admin/homemaidlist") return;

      if (router.pathname == "/client") return;
      if (router.pathname == "/client/book/[slug]") return;
      if (router.pathname == "/client/cvdetails") return;
      if (router.pathname == "/client/cvdetails/[slug]") return;
      const token = Cookies.get("token");
      // console.log(token)
      const decoder = jwtDecode(token);

      setUser(decoder);
      if (router.pathname == "/admin/login") router.replace("/admin");
      if (router.pathname == "/client/login") router.replace("/client");
    } catch (error) {
      if (router.pathname == "/admin/login") return;
      // router.replace("/client/login")
    }
  }, []);

  return (
    //@ts-ignore
    <User.Provider value={user}>
      <Windmill usePreferences={true}>
        <Component {...pageProps} />
      </Windmill>
    </User.Provider>
  );
}
export default MyApp;
