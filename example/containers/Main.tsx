/* @ts-ignore */

import React, { useEffect, useState } from "react";
import RoundIcon from "example/components/RoundIcon";
import { TwitterIcon } from "icons";
import {
  Avatar,
  Badge,
  Input,
  Dropdown,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  DropdownItem,
  WindmillContext,
} from "@roketid/windmill-react-ui";
import {
  TwitchOutlined,
  TwitterOutlined,
  FacebookFilled,
} from "@ant-design/icons";
interface IMain {
  children: React.ReactNode;
}

function Main({ children }: IMain) {
  const [showScrollButton, setShowScrollButton] = useState(false);
// useState

useEffect(() => {
  const mainElement = document.querySelector('main');
  const handleScroll = () => {
    const scrollPosition = mainElement ? mainElement.scrollTop : window.pageYOffset;
    console.log('Scroll position:', scrollPosition); // للتصحيح
    if (scrollPosition > 300) {
      setShowScrollButton(true);
    } else {
      setShowScrollButton(false);
    }
  };

  if (mainElement) {
    mainElement.addEventListener('scroll', handleScroll);
    return () => mainElement.removeEventListener('scroll', handleScroll);
  } else {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }
}, []);

const scrollToTop = () => {
  const mainElement = document.querySelector('main');
  if (mainElement) {
    mainElement.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  } else {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
};
  return (
    <main className="h-full overflow-y-auto scrollbar-hide">
      {/* <input></input> */}

      <div className="container grid px-6 mx-auto">{children}</div>
   <div dir="rtl">
<button
  className={`fixed bottom-8  flex flex-start left-8  z-[9999] bg-teal-800 text-white p-3 rounded-full shadow-lg transition-opacity duration-300 opacity-100 ${
    showScrollButton ? 'opacity-100' : 'opacity-0 '
  }`}
  onClick={() => scrollToTop()}
  aria-label="العودة لأعلى الصفحة"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
  </svg>
  </button>         
  </div>
      <footer className="rounded-xl bg-inherit-100">
        <div className="container m-auto space-y-8 px-6 py-16 text-gray-600 md:px-12 lg:px-20">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-8">
            <img
              width="100"
              height="42"
              src="https://res.cloudinary.com/duo8svqci/image/upload/v1716302380/dkqowbgajxgcy8auxskm.svg"
              alt="rawaeslogo"
              className="w-32"
            />
            <div className="flex gap-6">
              <a
                href="#"
                target="blank"
                aria-label="github"
                className="hover:text-cyan-600"
              >
                <link
                  rel="shortcut icon"
                  href="https://res.cloudinary.com/duo8svqci/image/upload/v1716302380/dkqowbgajxgcy8auxskm.svg"
                />
              </a>
              {/* <a href="#" target="blank" aria-label="twitter" className="hover:text-cyan-600"> */}
              {/* <h1> */}
              {/* <RoundIcon icon={}/> */}
              {/* <TwitterIcon/> */}
              <TwitterOutlined />

              {/* </h1> */}
              {/* </a> */}
              <FacebookFilled />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {/* <div>
        <h6 className="text-lg font-medium text-cyan-900">Company</h6>
        <ul className="mt-4 list-inside space-y-4">
          <li>
            <a href="#" className="transition hover:text-cyan-600">About</a>
          </li>
          <li>
            <a href="#" className="transition hover:text-cyan-600">Customers</a>
          </li>
          <li>

            <a href="#" className="transition hover:text-cyan-600">Enterprise</a>
          </li>
          <li>
            <a href="#" className="transition hover:text-cyan-600">Partners</a>
          </li>
          <li>
            <a href="#" className="transition hover:text-cyan-600">Jobs</a>
          </li>
        </ul>
      </div> */}
            <div>
              {/* <h6 className="text-lg font-medium text-cyan-900">Products</h6> */}
              <ul className="mt-4 list-inside space-y-4">
                <li>
                  {/* <a href="#" className="transition hover:text-cyan-600">About</a> */}
                </li>
                <li>
                  {/* <a href="#" className="transition hover:text-cyan-600">Jobs</a> */}
                </li>
              </ul>
            </div>
            {/* <div>
        <h6 className="text-lg font-medium text-cyan-900">Developers</h6>
        <ul className="mt-4 list-inside space-y-4">
          <li>
            <a href="#" className="transition hover:text-cyan-600">About</a>
          </li>
          <li>
            <a href="#" className="transition hover:text-cyan-600">Customers</a>
          </li>
          <li>
            <a href="#" className="transition hover:text-cyan-600">Enterprise</a>
          </li>
          <li>
            <a href="#" className="transition hover:text-cyan-600">Partners</a>
          </li>
          <li>
            <a href="#" className="transition hover:text-cyan-600">Jobs</a>
          </li>
        </ul>
      </div> */}
            {/* <div>
        <h6 className="text-lg font-medium text-cyan-900">Ressources</h6>
        <ul className="mt-4 list-inside space-y-4">
          <li>
            <a href="#" className="transition hover:text-cyan-600">About</a>
          </li>
          <li>
            <a href="#" className="transition hover:text-cyan-600">Customers</a>
          </li>
          <li>
            <a href="#" className="transition hover:text-cyan-600">Enterprise</a>
          </li>
          <li>
            <a href="#" className="transition hover:text-cyan-600">Partners</a>
          </li>
          <li>
            <a href="#" className="transition hover:text-cyan-600">Jobs</a>
          </li>
        </ul>
      </div> */}
          </div>


       
        </div>
      </footer>
    </main>
  );
}

export default Main;
