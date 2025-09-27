import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaBars, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { BellIcon } from '@heroicons/react/solid';
import { jwtDecode } from 'jwt-decode';

const DesktopNavbar = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [counts, setCounts] = useState({ all: 0, read: 0, unread: 0 });
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        setUserName(decoded.username || '');
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }

    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications?tab=unread&limit=5`);
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const { data, counts } = await response.json();
        setNotifications(data);
        setCounts(counts);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const notificationDiv = document.querySelector('.notification-dropdown');
      const userDropdownDiv = document.querySelector('.user-dropdown');
      if (notificationDiv && !notificationDiv.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (userDropdownDiv && !userDropdownDiv.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleNotificationDropdown = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
      });
      if (response.status === 200) {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <nav className="hidden lg:block bg-white shadow-lg py-2" dir="rtl">
      <div className="w-full px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img
              src="/images/homelogo.png"
              className="h-20 w-30 object-contain"
              alt="لوجو روائس"
            />
          </div>

          <div className="flex items-center space-x-2">
            {/* Notification Bell */}
            <div className="relative">
              <div onClick={toggleNotificationDropdown}>
                <BellIcon className="w-7 h-7 text-teal-700 cursor-pointer" />
                {counts.unread > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </div>
              
              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div className="absolute top-10 left-0 w-64 bg-white shadow-lg rounded-lg z-10 notification-dropdown">
                  <ul className="py-2">
                    {notifications.map((n) => (
                      <li
                        onClick={() => {
                          router.push(`/admin/notifications`);
                          console.log('Notification clicked:', n);
                        }}
                        key={n.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-md font-semibold text-gray-900">{n.message}</p>
                            <p className="text-xs text-gray-500">
                              منذ {new Date(n.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div>
              <span className="text-red-500 text-md">
                لديك {counts.unread} إشعارات جديدة  
              </span>
            </div>
            
            {/* User Dropdown */}
            <div className="relative user-dropdown">
              <div 
                className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={toggleUserDropdown}
              >
                <span className="text-md font-medium text-teal-700">{userName}</span>
                <FaChevronDown className="text-gray-500" />
              </div>
              
              {/* User Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute top-10 left-0 w-48 bg-gray-100 shadow-lg rounded-lg z-10 border border-gray-200">
                  <div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-right px-4 py-2 text-md text-teal-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DesktopNavbar;
