"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";

interface Notification {
  id: number;
  message: string;
  isRead: boolean;
  userId?: string;
  title?: string;
}

export default function NotificationDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/notifications", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (data.error) return router.push("/login");
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
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
      );

      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });

      if (!response.ok) throw new Error("Failed to mark notification as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, isRead: false } : notif))
      );
    }
  };

  // Handle clear all notifications
  const handleClearNotifications = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to clear notifications");

      setNotifications([]);
      setOpen(false);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  // Handle number click in message
  const handleNumberClick = (number: string) => {
    router.push(`/cvdetails/${number}`);
  };

  // Format message with clickable numbers
  const formatMessage = (message: string) => {
    return message.split(" ").map((word, index) => {
      if (!isNaN(Number(word))) {
        return (
          <span
            key={index}
            className="text-blue-600 font-medium cursor-pointer hover:underline"
            onClick={() => handleNumberClick(word)}
          >
            {word}{" "}
          </span>
        );
      }
      return <span key={index}>{word} </span>;
    });
  };

  return (
    <>
      <div ref={dropdownRef} className="relative">
        {/* Notification Button */}
        <button
          onClick={() => setOpen(!open)}
          className="relative p-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
              {notifications.length}
            </span>
          )}
        </button>

        {/* Dropdown Menu */}
        {open && (
          <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 border border-gray-200 dark:border-gray-800 transform transition-all duration-300 ease-in-out">
            <div className="p-4 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl flex justify-between items-center">
              <span>الإشعارات</span>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearNotifications}
                  className="text-xs text-white hover:text-gray-200 underline"
                >
                  مسح الكل
                </button>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <li
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                    className={`flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-200 ${
                      notification.isRead ? "opacity-60" : ""
                    }`}
                  >
                    <span className="text-gray-700 dark:text-gray-200 text-sm">
                      {formatMessage(notification?.title || notification.message)}
                    </span>
                  </li>
                ))
              ) : (
                <li className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                  📬 لا توجد إشعارات
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              تفاصيل
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  بواسطة
                </h3>
                <p className="text-gray-800 dark:text-gray-200">
                  {selectedNotification?.userId || "غير محدد"}
                </p>
              </div>
              <div className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">
                {formatMessage(selectedNotification.message)}
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-6 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </>
  );
}