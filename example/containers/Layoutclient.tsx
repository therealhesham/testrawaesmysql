//@ts-nocheck

import { useContext, useEffect } from 'react'
import SidebarContext, { SidebarProvider } from 'context/SidebarContext'
import Sidebar from 'example/components/Sidebar'
import Header from 'example/components/Header'
import Main from './Main'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import { useRouter } from 'next/router'

interface ILayout{
  children: React.ReactNode
}

function Layout({ children }: ILayout) {
  const { isSidebarOpen } = useContext(SidebarContext)
const router = useRouter()
  useEffect(()=>{

       
try {

    const token = Cookies.get("token")
  const decoder = jwtDecode(token);
  // alert(decoder.admin)
      if(!decoder.admin)return router.replace("/admin/login");
// console.log(decoder.idnumber)
  } catch (error) {
    router.replace("/admin/login")
  }





},[])
  return <SidebarProvider>
    <div
      className={`flex h-screen bg-gray-50 dark:bg-gray-900 ${isSidebarOpen && 'overflow-hidden'}`}
      >
      <Sidebar />
      <div className="flex flex-col flex-1 w-full">
        <Header />
        <Main>
          {children}
        </Main>
      </div>
    </div>
  </SidebarProvider>
}

export default Layout