import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ArticleIcon,
  CollapsIcon,
  HomeIcon,
  LogoIcon,
  LogoutIcon,
  UsersIcon,
  VideosIcon,
} from "../../../components/icons";
import ReportsIcon from "components/icons/reports";
import { jwtDecode } from "jwt-decode";
import { useSidebar } from "utils/sidebarcontext";
import NotificationDropdown from "components/notifications";
import { FaCog, FaChevronDown, FaLaptopHouse, FaHotel, FaFirstOrder, FaFirstOrderAlt, FaPersonBooth, FaAddressBook, FaEnvelope } from "react-icons/fa";
import { MenuAlt1Icon } from "@heroicons/react/solid";

interface MenuItem {
  id: number;
  label: string;
  icon: React.ElementType;
  link?: string;
  subItems?: SubMenuItem[];
}

interface SubMenuItem {
  id: number;
  label: string;
  link: string;
}

const menuItems: MenuItem[] = [
  { id: 1, label: "الرئيسية", icon: HomeIcon, link: "/admin/home" },
  {
    id: 2,
    label: "الطلبات",
    icon: FaFirstOrderAlt,
    subItems: [
      { id: 21, label: "طلبات جديدة", link: "/admin/neworders" },
      { id: 22, label: "طلبات منتهية", link: "/admin/endedorders" },
      // { id: 23, label: "طلبات مكتملة", link: "/admin/orders/completed" },
    ],
  },
  {
    id: 4,
    label: "التسكين",
    icon: FaHotel ,
    subItems: [
      { id: 21, label: "قائمة التسكين", link: "/admin/housedarrivals" },
      { id: 22, label: "الاعاشات", link: "/admin/checkedtable" },
      // { id: 23, label: "طلبات مكتملة", link: "/admin/orders/completed" },
    ],
  },
  {
    id: 8,
    label: "العاملات",
    icon: FaPersonBooth ,
    subItems: [
      { id: 21, label: "قائمة العاملات", link: "/admin/fulllist" },
      { id: 22, label: "اضافة عاملة", link: "/admin/newhomemaid" },
      // { id: 23, label: "طلبات مكتملة", link: "/admin/orders/completed" },
    ],
  },{
    id: 3,
    label: "الإعدادات",
    icon: FaCog,

    link:"/admin/settings"
  }
];

const Sidebar = (props) => {
  const { toggleCollapse, setToggleCollapse } = useSidebar();
  const [isCollapsible, setIsCollapsible] = useState(false);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const router = useRouter();
  const [image, setImage] = useState();
  const [info, setInfo] = useState();
  const [role, setRole] = useState();

  // Memoize active menu item based on the current route
  const activeMenu = useMemo(
    () =>
      menuItems.find(
        (menu) =>
          menu.link === router.pathname ||
          menu.subItems?.some((subItem) => subItem.link === router.pathname)
      ),
    [router.pathname]
  );

  const wrapperClasses = classNames(
    "bg-teal-600 p-4 h-screen px-4 pt-8 pb-4 bg-light flex justify-between flex-col",
    {
      "w-80": !toggleCollapse,
      "w-20": toggleCollapse,
    }
  );

  const collapseIconClasses = classNames(
    "p-4 rounded bg-light-lighter absolute right-0",
    {
      "rotate-180": toggleCollapse,
    }
  );

  const getNavItemClasses = useCallback(
    (menu: MenuItem) => {
      return classNames(
        "flex items-center px-5 cursor-pointer hover:bg-light-lighter rounded w-full overflow-hidden whitespace-nowrap text-md font-medium text-text-light text-white flex items-center justify-center pl-1 gap-4",
        {
          "bg-light-lighter": activeMenu?.id === menu.id,
        }
      );
    },
    [activeMenu]
  );

  const getSubNavItemClasses = useCallback(
    (subItem: SubMenuItem) => {
      return classNames(
        "flex items-center cursor-pointer hover:bg-light-lighter rounded w-full overflow-hidden whitespace-nowrap text-sm font-medium text-text-light text-white py-2 justify-center",
        {
          "bg-light-lighter": router.pathname === subItem.link,
        }
      );
    },
    [router.pathname]
  );

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

  const onMouseOver = useCallback(() => {
    setIsCollapsible(!toggleCollapse);
  }, [toggleCollapse]);

  const handleSidebarToggle = useCallback(() => {
    setToggleCollapse((prevState) => !prevState);
  }, [setToggleCollapse]);

  const toggleSubMenu = useCallback((menuId: number) => {
    setOpenMenu((prev) => (prev === menuId ? null : menuId));
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) router.push("/admin/login");
    try {
      const token = localStorage.getItem("token");
      const info = jwtDecode(token);
      setImage(info.picture);
      setInfo(info.username);
      setRole(info.role.toLowerCase());
    } catch (error) {
      router.push("/admin/login");
    }
  }, []);

  return (
    <div
      className={wrapperClasses}
      onMouseEnter={onMouseOver}
      onMouseLeave={onMouseOver}
      style={{
        transition: "width 300ms cubic-bezier(0.2, 0, 0, 1) 0s",
        minWidth: toggleCollapse ? "5rem" : "20rem",
        maxWidth: "20rem",
      }}
    >
<div className="flex flex-col relative">
  {/* العنوان والصورة والزرار */}
  <div className="flex items-center justify-center relative " dir="ltr">
    <div className="flex flex-col items-center justify-center pl-1 gap-4">
      <img
        src={image ? image : "/images/favicon.ico"}
        alt="Profile"
        className="rounded-full w-24 h-24 object-cover"
      />
      <span
        className={classNames(
          "mt-2 text-lg font-medium text-white text-text",
          {
            hidden: toggleCollapse,
          }
        )}
      >
        Welcome {info}
      </span>
    </div>

    {/* زرار الكولابس على الشمال */}
    <button
      aria-label="Collapse Sidebar"
      className={`${collapseIconClasses} absolute left-2 top-2`} // الزرار في الزاوية العليا اليسرى
      onClick={handleSidebarToggle}
    >
      <CollapsIcon />
    </button>
  </div>

  {/* عناصر القائمة */}
  <div className="flex flex-col mt-24 items-center mr-3">
    {menuItems.map(({ icon: Icon, subItems, ...menu }) => {
      const classes = getNavItemClasses(menu);
      return (
        <div key={menu.id}>
          <div className={classes} onClick={() => toggleSubMenu(menu.id)}>
            {menu.link ? (
              <Link href={menu.link}>
                <a className="flex py-4 px-3 items-center justify-center w-full h-full">
                  <div style={{ width: "2.5rem", color: "white" }}>
                    <Icon />
                  </div>
                  {!toggleCollapse && (
                    <span className="text-md font-medium text-text-light text-white">
                      {menu.label}
                    </span>
                  )}
                </a>
              </Link>
            ) : (
              <div className="flex py-4 px-3 items-center justify-center w-full h-full">
                <div style={{ width: "2.5rem", color: "white" }}>
                  <Icon />
                </div>
                {!toggleCollapse && (
                  <span className="text-md font-medium text-text-light text-white">
                    {menu.label}
                  </span>
                )}
                {!toggleCollapse && subItems && (
                  <FaChevronDown
                    className={classNames("ml-2", {
                      "rotate-180": openMenu === menu.id,
                    })}
                  />
                )}
              </div>
            )}
          </div>

          {/* عناصر السب منيو */}
          {!toggleCollapse && subItems && openMenu === menu.id && (
            <div className="w-full flex justify-center" style={{ flexWrap: "wrap" }}>
              {subItems.map((subItem) => (
                <div key={subItem.id} className={getSubNavItemClasses(subItem)}>
                  <Link href={subItem.link}>
                    <a className="flex items-center justify-center w-full h-full">
                      <span className="text-sm font-medium text-text-light text-white">
                        {subItem.label}
                      </span>
                    </a>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    })}
  </div>

  {/* رابط المديرين في حالة admin */}
  {role === "admin" && (
    <div className=
    
        "flex flex-col items-center px-5 cursor-pointer hover:bg-light-lighter rounded w-full overflow-hidden whitespace-nowrap text-md font-medium text-text-light text-white  justify-center pl-1 gap-4"
        ><Link href="/admin/addadmin">
            <a className="flex py-4 px-3 items-center justify-center w-full h-full">
              <div style={{ width: "2.5rem", color: "white" }}>
                <ArticleIcon fill="white" />
              </div>
              {!toggleCollapse && (
                <span className="text-md font-medium text-text-light text-white">
                  المديرين
                </span>
              )}
            </a>
          </Link><Link href="/admin/addemail">
              <a className="flex py-4 px-3 items-center justify-center w-full h-full">
                <div style={{ width: "2.5rem", color: "white" }}>
                  <FaEnvelope fill="white" />
                </div>
                {!toggleCollapse && (
                  <span className="text-md font-medium text-text-light text-white">
                    قائمة البريد
                  </span>
                )}
              </a>
            </Link></div>
  )}
</div>

      <div
        className={getNavItemClasses({
          id: 0,
          label: "Logout",
          icon: LogoutIcon,
          link: "/",
        })}
        onClick={handleLogout}
      >
        <div style={{ width: "2.5rem" }}>
          <LogoutIcon fill="white" />
        </div>
        {!toggleCollapse && (
          <span className="text-md font-medium text-text-light text-white">
            Logout
          </span>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

// import { useState } from 'react';
// import Link from 'next/link';
// import { FaBars, FaTimes, FaHome, FaUser, FaCog } from 'react-icons/fa';

// const Sidebar = () => {
//   const [isOpen, setIsOpen] = useState(false);

//   const toggleSidebar = () => {
//     setIsOpen(!isOpen);
//   };

//   return (
//     <div className="flex">
//       <div
//         className={`${
//           isOpen ? 'w-64' : 'w-16'
//         } bg-gray-800 text-white h-screen transition-all duration-300 ease-in-out flex flex-col`}
//       >
//         <div className="flex items-center justify-between p-4">
//           {isOpen && <h1 className="text-xl font-bold">Menu</h1>}
//           <button onClick={toggleSidebar} className="text-2xl focus:outline-none">
//             {isOpen ? <FaTimes /> : <FaBars />}
//           </button>
//         </div>
//         <nav className="flex-1">
//           <ul>
//             <li>
//               <Link href="/">
//                 <a className="flex items-center p-4 hover:bg-gray-700">
//                   <FaHome className="text-xl" />
//                   {isOpen && <span className="ml-4">Home</span>}
//                 </a>
//               </Link>
//             </li>
//             <li>
//               <Link href="/profile">
//                 <a className="flex items-center p-4 hover:bg-gray-700">
//                   <FaUser className="text-xl" />
//                   {isOpen && <span className="ml-4">Profile</span>}
//                 </a>
//               </Link>
//             </li>
//             <li>
//               <Link href="/settings">
//                 <a className="flex items-center p-4 hover:bg-gray-700">
//                   <FaCog className="text-xl" />
//                   {isOpen && <span className="ml-4">Settings</span>}
//                 </a>
//               </Link>
//             </li>
//           </ul>
//         </nav>
//       </div>
//       <div className="flex-1 p-4">
//         {/* Main content goes here */}
//       </div>
//     </div>
//   );
// };

// export default Sidebar;



// ده كود السايد بار الريسبونسيف
// import classNames from "classnames";
// import Link from "next/link";
// import { useRouter } from "next/router";
// import jwt from "jsonwebtoken";
// import { useEffect, useState, useCallback, useMemo } from "react";
// import {
//   ArticleIcon,
//   CollapsIcon,
//   HomeIcon,
//   LogoutIcon,
// } from "../../../components/icons";
// import { jwtDecode } from "jwt-decode";
// import { useSidebar } from "utils/sidebarcontext";
// import {
//   FaCog,
//   FaChevronDown,
//   FaHotel,
//   FaFirstOrderAlt,
//   FaPersonBooth,
//   FaBars,
// } from "react-icons/fa";

// interface MenuItem {
//   id: number;
//   label: string;
//   icon: React.ElementType;
//   link?: string;
//   subItems?: SubMenuItem[];
// }

// interface SubMenuItem {
//   id: number;
//   label: string;
//   link: string;
// }

// const menuItems: MenuItem[] = [
//   { id: 1, label: "الرئيسية", icon: HomeIcon, link: "/admin/home" },
//   {
//     id: 2,
//     label: "الطلبات",
//     icon: FaFirstOrderAlt,
//     subItems: [
//       { id: 21, label: "طلبات جديدة", link: "/admin/neworders" },
//       { id: 22, label: "طلبات منتهية", link: "/admin/endedorders" },
//     ],
//   },
//   {
//     id: 4,
//     label: "التسكين",
//     icon: FaHotel,
//     subItems: [
//       { id: 21, label: "قائمة التسكين", link: "/admin/housedarrivals" },
//       { id: 22, label: "الاعاشات", link: "/admin/checkedtable" },
//     ],
//   },
//   {
//     id: 8,
//     label: "العاملات",
//     icon: FaPersonBooth,
//     subItems: [
//       { id: 21, label: "قائمة العاملات", link: "/admin/fulllist" },
//       { id: 22, label: "اضافة عاملة", link: "/admin/newhomemaid" },
//     ],
//   },
//   {
//     id: 3,
//     label: "الإعدادات",
//     icon: FaCog,
//     link: "/admin/settings",
//   },
// ];

// const Sidebar = () => {
//   const { toggleCollapse, setToggleCollapse } = useSidebar();
//   const [isCollapsible, setIsCollapsible] = useState(false);
//   const [openMenu, setOpenMenu] = useState<number | null>(null);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const router = useRouter();
//   const [image, setImage] = useState();
//   const [info, setInfo] = useState();
//   const [role, setRole] = useState();

//   const activeMenu = useMemo(
//     () =>
//       menuItems.find(
//         (menu) =>
//           menu.link === router.pathname ||
//           menu.subItems?.some((subItem) => subItem.link === router.pathname)
//       ),
//     [router.pathname]
//   );

//   const wrapperClasses = classNames(
//     "bg-teal-600 px-4 pt-8 pb-4 flex justify-between flex-col transition-all duration-300",
//     {
//       "w-80": !toggleCollapse,
//       "w-20": toggleCollapse,
//       "hidden md:flex h-screen": !isMobileMenuOpen,
//     }
//   );

//   const bottomNavClasses = classNames(
//     "fixed bottom-0 left-0 right-0 bg-teal-600 text-white flex justify-around items-center py-2 md:hidden z-50"
//   );

//   const collapseIconClasses = classNames(
//     "p-4 rounded bg-light-lighter absolute left-2 top-2",
//     {
//       "rotate-180": toggleCollapse,
//     }
//   );

//   const getNavItemClasses = useCallback(
//     (menu: MenuItem) => {
//       return classNames(
//         "flex items-center px-5 cursor-pointer hover:bg-teal-700 rounded w-full overflow-hidden whitespace-nowrap text-md font-medium text-white",
//         {
//           "bg-teal-700": activeMenu?.id === menu.id,
//         }
//       );
//     },
//     [activeMenu]
//   );

//   const getSubNavItemClasses = useCallback(
//     (subItem: SubMenuItem) => {
//       return classNames(
//         "flex items-center cursor-pointer hover:bg-teal-700 rounded w-full overflow-hidden whitespace-nowrap text-base font-medium text-white py-2 pr-8",
//         {
//           "bg-teal-700": router.pathname === subItem.link,
//         }
//       );
//     },
//     [router.pathname]
//   );

//   const handleLogout = async () => {
//     try {
//       const response = await fetch("/api/logout", {
//         method: "POST",
//       });
//       if (response.status === 200) {
//         router.push("/admin/login");
//       } else {
//         console.error("Logout failed");
//       }
//     } catch (error) {
//       console.error("Error during logout:", error);
//     }
//   };

//   const onMouseOver = useCallback(() => {
//     setIsCollapsible(!toggleCollapse);
//   }, [toggleCollapse]);

//   const handleSidebarToggle = useCallback(() => {
//     setToggleCollapse((prevState) => !prevState);
//   }, [setToggleCollapse]);

//   const toggleSubMenu = useCallback((menuId: number) => {
//     setOpenMenu((prev) => (prev === menuId ? null : menuId));
//   }, []);

//   useEffect(() => {
//     if (!localStorage.getItem("token")) router.push("/admin/login");
//     try {
//       const token = localStorage.getItem("token");
//       const info = jwtDecode(token);
//       setImage(info.picture);
//       setInfo(info.username);
//       setRole(info.role.toLowerCase());
//     } catch (error) {
//       router.push("/admin/login");
//     }
//   }, [router]);

//   return (
//     <>
//       {/* Sidebar for Desktop */}
//       <div
//         className={wrapperClasses}
//         onMouseEnter={onMouseOver}
//         onMouseLeave={onMouseOver}
//         style={{
//           transition: "width 300ms cubic-bezier(0.2, 0, 0, 1) 0s",
//           minWidth: toggleCollapse ? "5rem" : "20rem",
//           maxWidth: "20rem",
//         }}
//       >
//         <div className="flex flex-col relative">
//           <div className="flex items-center justify-center relative" dir="ltr">
//             <div className="flex flex-col items-center justify-center pl-1 gap-4">
//               <img
//                 src={image ? image : "/images/favicon.ico"}
//                 alt="Profile"
//                 className="rounded-full w-24 h-24 object-cover"
//               />
//               <span
//                 className={classNames("mt-2 text-lg font-medium text-white", {
//                   hidden: toggleCollapse,
//                 })}
//               >
//                 Welcome {info}
//               </span>
//             </div>
//             <button
//               aria-label="Collapse Sidebar"
//               className={collapseIconClasses}
//               onClick={handleSidebarToggle}
//             >
//               <CollapsIcon />
//             </button>
//           </div>

//           <div className="flex flex-col mt-24 items-center mr-3">
//             {menuItems.map(({ icon: Icon, subItems, ...menu }) => {
//               const classes = getNavItemClasses(menu);
//               return (
//                 <div key={menu.id}>
//                   <div
//                     className={classes}
//                     onClick={() => subItems && toggleSubMenu(menu.id)}
//                   >
//                     {menu.link ? (
//                       <Link href={menu.link}>
//                         <a className="flex py-4 px-3 items-center justify-center w-full h-full">
//                           <div style={{ width: "2.5rem", color: "white" }}>
//                             <Icon />
//                           </div>
//                           {!toggleCollapse && (
//                             <span className="text-md font-medium text-white">
//                               {menu.label}
//                             </span>
//                           )}
//                         </a>
//                       </Link>
//                     ) : (
//                       <div className="flex py-4 px-3 items-center justify-center w-full h-full">
//                         <div style={{ width: "2.5rem", color: "white" }}>
//                           <Icon />
//                         </div>
//                         {!toggleCollapse && (
//                           <span className="text-md font-medium text-white">
//                             {menu.label}
//                           </span>
//                         )}
//                         {!toggleCollapse && subItems && (
//                           <FaChevronDown
//                             className={classNames("ml-2", {
//                               "rotate-180": openMenu === menu.id,
//                             })}
//                           />
//                         )}
//                       </div>
//                     )}
//                   </div>

//                   {!toggleCollapse && subItems && openMenu === menu.id && (
//                     <div className="w-11/12 mx-auto px-4 py-2 bg-teal-600 rounded-lg">
//                       {subItems.map((subItem) => (
//                         <div
//                           key={subItem.id}
//                           className={getSubNavItemClasses(subItem)}
//                         >
//                           <Link href={subItem.link}>
//                             <a className="flex items-center w-full h-full">
//                               <span className="text-base font-medium text-white">
//                                 {subItem.label}
//                               </span>
//                             </a>
//                           </Link>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>

//           {role === "admin" && (
//             <Link href="/admin/addadmin">
//               <a className="flex py-4 px-3 items-center justify-center w-full h-full">
//                 <div style={{ width: "2.5rem", color: "white" }}>
//                   <ArticleIcon fill="white" />
//                 </div>
//                 {!toggleCollapse && (
//                   <span className="text-md font-medium text-white">
//                     المديرين
//                   </span>
//                 )}
//               </a>
//             </Link>
//           )}
//         </div>

//         <div
//           className={getNavItemClasses({
//             id: 0,
//             label: "Logout",
//             icon: LogoutIcon,
//             link: "/",
//           })}
//           onClick={handleLogout}
//         >
//           <div style={{ width: "2.5rem" }}>
//             <LogoutIcon fill="white" />
//           </div>
//           {!toggleCollapse && (
//             <span className="text-md font-medium text-white">Logout</span>
//           )}
//         </div>
//       </div>

//       {/* Bottom Navigation for Mobile */}
//       <div className={bottomNavClasses}>
//         {menuItems.map(({ icon: Icon, link, label, subItems, id }) => (
//           <div key={id} className="relative group">
//             {link ? (
//               <Link href={link}>
//                 <a className="flex flex-col items-center justify-center p-2">
//                   <Icon size={24} />
//                   <span className="text-xs mt-1">{label}</span>
//                 </a>
//               </Link>
//             ) : (
//               <div
//                 className="flex flex-col items-center justify-center p-2 cursor-pointer"
//                 onClick={() => toggleSubMenu(id)}
//               >
//                 <Icon size={24} />
//                 <span className="text-xs mt-1">{label}</span>
//               </div>
//             )}
//             {subItems && openMenu === id && (
//               <div className="absolute bottom-16 left-0 right-0 bg-teal-600 text-white shadow-lg rounded-t-lg">
//                 {subItems.map((subItem) => (
//                   <Link key={subItem.id} href={subItem.link}>
//                     <a className="block px-4 py-2 text-base hover:bg-teal-700">
//                       {subItem.label}
//                     </a>
//                   </Link>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))}
//         <div
//           className="flex flex-col items-center justify-center p-2 cursor-pointer"
//           onClick={handleLogout}
//         >
//           <LogoutIcon size={24} />
//           <span className="text-xs mt-1">Logout</span>
//         </div>
//       </div>

//       <button
//         className="md:hidden fixed top-4 right-4 z-50 text-white bg-teal-600 p-2 rounded"
//         onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//       >
//         <FaBars size={24} />
//       </button>
//     </>
//   );
// };

// export default Sidebar;