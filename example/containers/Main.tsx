/* @ts-ignore */

import React, { useEffect, useState } from "react";
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
      <footer className="mt-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-12 md:px-12 lg:px-20">
          <div className="flex flex-col space-y-8" dir="ltr">
            <div className="flex flex-col items-end space-y-4">
              <img
                width="120"
                height="50"
                src="https://res.cloudinary.com/duo8svqci/image/upload/v1716302380/dkqowbgajxgcy8auxskm.svg"
                alt="rawaeslogo"
                className="w-36 h-auto transition-transform hover:scale-105"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 text-right max-w-md">
                نظام إدارة متكامل لتقديم أفضل الخدمات
              </p>
            </div>

            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>

            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                &copy; {new Date().getFullYear()} جميع الحقوق محفوظة
              </span>
              <span className="flex items-center gap-2 font-medium text-teal-600 dark:text-teal-400">
               
                الإصدار {process.env.NEXT_PUBLIC_VERSION || '0.1.0'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default Main;
