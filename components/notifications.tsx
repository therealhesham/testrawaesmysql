"use client";

import { useState, useRef, useEffect } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
interface Notification {
  id: number;
  message: string;
  isRead: boolean;
}

export default function NotificationDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/notifications", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    fetchNotifications();
  }, []);

  // Handle notification click to show modal and mark as read
  const handleNotificationClick = async (id: number) => {
    const notification = notifications.find((n) => n.id === id);
    if (notification) {
      setSelectedNotification(notification);
      setIsModalOpen(true);
    }

    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );

      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isRead: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // Rollback optimistic update if request fails
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, isRead: false } : notif
        )
      );
    }
  };

  // Function to handle clicking on the number in the message
  const handleNumberClick = (number: string) => {
    router.push("/cvdetails/" + number);
    // alert(`تم الضغط على الرقم: ${number}`);
    // هنا ممكن تضيف أي إجراء تاني
  };

  // Function to replace the number in message with a clickable span
  const formatMessage = (message: string) => {
    return message.split(" ").map((word, index) => {
      // إذا كانت الكلمة رقم
      if (!isNaN(Number(word))) {
        return (
          <span
            key={index}
            className="text-blue-500 cursor-pointer"
            onClick={() => handleNumberClick(word)}
          >
            {word}
          </span>
        );
      }
      return <span key={index}>{word} </span>;
    });
  };

  return (
    <>
      <div ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-full left-0 hover:bg-gray-200 dark:hover:bg-gray-700 transition bg-orange-300"
        >
          <BellIcon className="h-6 w-6 text-white dark:text-gray-300" />
        </button>
        {notifications.length > 0 ? (
          <span className="absolute top-2 left-5     bg-[#FF0000] text-white text-xs font-bold px-2 py-1 rounded-full">
            {notifications.length > 0 ? notifications.length : 0}
          </span>
        ) : null}

        {open && (
          <div className="absolute  left-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-50 border border-gray-200 dark:border-gray-700">
            <div className="p-4 text-sm text-white dark:text-gray-100 border-b dark:border-gray-700 font-semibold bg-[dodgerblue]">
              Notifications
            </div>
            <ul className="max-h-60 overflow-y-auto">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id)}
                  className={`px-4 py-2  h-[60px] hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                    notification.isRead ? "opacity-50" : ""
                  }`}
                >
                  {formatMessage(notification.title)}
                </li>
              ))}
              {notifications.length === 0 && (
                <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  📧 لا يوجد إشعارات
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-white"
            >
              ✖
            </button>
            <h2 className="text-lg font-semibold mb-2  text-gray-800 dark:text-gray-100">
              اشعار
            </h2>

<div>
<h3>بواسطة</h3>
 <h5>{selectedNotification?.userId}</h5>

     </div>      
      <div
              className="text-gray-700 dark:text-gray-200"
              dangerouslySetInnerHTML={{ __html: selectedNotification.message }}
            ></div>
          </div>
        </div>
      )}
    </>
  );
}
