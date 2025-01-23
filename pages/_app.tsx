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
import { ToastContainer } from "react-toastify";

function MyApp({ Component, pageProps }: AppProps) {
  const [user, setUser] = useState({});

  const router = useRouter();
  // suppress useLayoutEffect warnings when running outside a browser
  if (!process.browser) React.useLayoutEffect = React.useEffect;
  // console.log(session)
  const queryClient = new QueryClient();
  useEffect(() => {}, []);

  return (
    //@ts-ignore
    <SessionProvider session={pageProps.session}>
      {/* <Windmill usePreferences={true}> */}
      <Component {...pageProps} />
      {/* </Windmill> */}
    </SessionProvider>
  );
}
export default MyApp;
