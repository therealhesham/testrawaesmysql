import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaBars, FaTimes, FaChevronDown, FaChevronUp, FaBug } from 'react-icons/fa';
import { BellIcon } from '@heroicons/react/solid';
import { jwtDecode } from 'jwt-decode';
import DOMPurify from 'dompurify';
import BugReportModal from './BugReportModal';

const DesktopNavbar = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [counts, setCounts] = useState({ all: 0, personal: 0, general: 0 });
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'general'>('all');
  const [userName, setUserName] = useState('');
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [bugScreenshot, setBugScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const router = useRouter();

  // Function to calculate time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diff < 60) return 'الآن';
    if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `قبل ${minutes} دقيقة${minutes > 1 ? '' : ''}`;
    }
    if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `قبل ${hours} ساعة${hours > 1 ? '' : ''}`;
    }
    const days = Math.floor(diff / 86400);
    return `قبل ${days} يوم${days > 1 ? '' : ''}`;
  };

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded: any = jwtDecode(token);
        setUserName(decoded.username || '');
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }, []);

  // ✅ دالة لتحديث الإشعارات بعد التغيير
  const refreshNotifications = useCallback(async () => {
    if (!userName) return;
    
    try {
      const response = await fetch(`/api/notifications?limit=100`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const { data, counts } = await response.json();
      
      // Filter notifications based on active tab
      let filteredData = data;
      if (activeTab === 'personal') {
        filteredData = data.filter((n: any) => n.userId === userName);
      } else if (activeTab === 'general') {
        filteredData = data.filter((n: any) => !n.userId || n.userId === null || n.userId === '');
      }
      
      setNotifications(filteredData.slice(0, 5));
      
      // ✅ حساب العدادات بناءً على حالة القراءة الفعلية
      const personalUnread = data.filter((n: any) => 
        n.userId === userName && !n.isRead
      ).length;
      
      const generalUnread = data.filter((n: any) => 
        (!n.userId || n.userId === null || n.userId === '') && 
        !(n.readByUsers && n.readByUsers.length > 0)
      ).length;
      
      const totalUnread = counts?.unread || (personalUnread + generalUnread);
      
      setCounts({ 
        all: totalUnread, // ✅ عدد غير المقروءة فقط
        personal: personalUnread,
        general: generalUnread
      });
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  }, [activeTab, userName]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

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

  const handleBugReportClick = async () => {
    if (typeof window === 'undefined') return;
    setIsCapturing(true);
    setBugScreenshot(null);
    try {
      // استخدام html-to-image بدلاً من html2canvas لأنه يدعم oklch
      const { toPng } = await import('html-to-image');
      const mainContent = document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
      
      const dataUrl = await toPng(mainContent as HTMLElement, {
        cacheBust: true,
        pixelRatio: 0.75,
        skipAutoScale: true,
        filter: (element) => {
          // تجاهل العناصر التي قد تسبب مشاكل
          return !element.classList?.contains('notification-dropdown') && 
                 !element.classList?.contains('user-dropdown');
        },
      });
      
      setBugScreenshot(dataUrl);
      requestAnimationFrame(() => {
        setIsBugModalOpen(true);
      });
    } catch (err: any) {
      console.error('Screenshot capture with html-to-image failed:', err);
      // محاولة بديلة باستخدام html2canvas كـ fallback
      try {
        const html2canvas = (await import('html2canvas')).default;
        const mainContent = document.querySelector('main') || document.body;
        const canvas = await html2canvas(mainContent as HTMLElement, {
          useCORS: true,
          allowTaint: true,
          scale: 0.5,
          logging: false,
          backgroundColor: '#ffffff',
        });
        const dataUrl = canvas.toDataURL('image/png');
        setBugScreenshot(dataUrl);
        requestAnimationFrame(() => {
          setIsBugModalOpen(true);
        });
      } catch (fallbackErr) {
        console.error('Fallback screenshot also failed:', fallbackErr);
        setBugScreenshot(null);
        setIsBugModalOpen(true);
      }
    } finally {
      setIsCapturing(false);
    }
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

  // ✅ دالة لتحديث إشعار كمقروء عند النقر عليه
  const handleNotificationClick = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      
      if (response.ok) {
        // تحديث الإشعارات والعدادات
        await refreshNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
      });
      if (response.ok) {
        await refreshNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <nav className="hidden lg:block bg-white shadow-lg py-2" dir="rtl">
      <div className="w-full px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <img
              src="/images/homelogo.png"
              className="h-20 w-30 object-contain"
              alt="لوجو روائس"
            />
            <button
              type="button"
              onClick={handleBugReportClick}
              disabled={isCapturing}
              title="تسجيل شكوى / بلاغ خطأ"
              className="p-2 rounded-lg text-teal-700 hover:bg-teal-50 hover:text-teal-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="تسجيل شكوى"
            >
              <FaBug className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Notification Bell */}
            <div className="relative">
              <div onClick={toggleNotificationDropdown}>
                <BellIcon className="w-7 h-7 text-teal-700 cursor-pointer" />
                {counts.all > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </div>
              
              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div className="absolute top-10 left-0 w-96 bg-white shadow-xl rounded-lg z-10 notification-dropdown" dir="rtl">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">الاشعارات</h3>
                      <button
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-teal-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginLeft: '-10px' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="mr-1">تعيين الكل كمقروء</span>
                      </button>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-gray-200">
                      <button
                        onClick={() => setActiveTab('all')}
                        className={`pb-2 px-2 text-sm font-medium relative ${
                          activeTab === 'all'
                            ? 'text-gray-900'
                            : 'text-gray-600 hover:text-gray-700'
                        }`}
                      >
                        الكل
                        <sup className="mr-1 text-xs font-normal">{counts.all}</sup>
                        {activeTab === 'all' && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></span>
                        )}
                      </button>
                      <button
                        onClick={() => setActiveTab('personal')}
                        className={`pb-2 px-2 text-sm font-medium relative ${
                          activeTab === 'personal'
                            ? 'text-gray-900'
                            : 'text-gray-600 hover:text-gray-700'
                        }`}
                      >
                        الخاصة بي
                        <sup className="mr-1 text-xs font-normal">{counts.personal}</sup>
                        {activeTab === 'personal' && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></span>
                        )}
                      </button>
                      <button
                        onClick={() => setActiveTab('general')}
                        className={`pb-2 px-2 text-sm font-medium relative ${
                          activeTab === 'general'
                            ? 'text-gray-900'
                            : 'text-gray-600 hover:text-gray-700'
                        }`}
                      >
                        العامة
                        <sup className="mr-1 text-xs font-normal">{counts.general}</sup>
                        {activeTab === 'general' && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      <ul className="py-2">
                        {notifications.map((n) => (
                          <li
                            onClick={async () => {
                              await handleNotificationClick(n.id);
                              router.push(`/admin/notifications`);
                              setIsNotificationOpen(false);
                            }}
                            key={n.id}
                            className="mx-4 my-2 px-3 py-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p 
                                  className="text-sm font-medium text-gray-900 mb-1" 
                                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(n.message || '') }}
                                ></p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {getTimeAgo(new Date(n.createdAt))}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-gray-500 text-sm">لا توجد إشعارات</p>
                      </div>
                    )}
                  </div>

                  {/* View All Button */}
                  <div className="px-4 py-3 border-t border-gray-200">
                    <button
                      onClick={() => {
                        router.push('/admin/notifications');
                        setIsNotificationOpen(false);
                      }}
                      className="w-full bg-teal-700 text-white py-2 px-4 rounded-lg hover:bg-teal-800 transition-colors text-sm font-medium"
                    >
                      عرض الكل
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <span className="text-red-500 text-md">
                {counts.all > 0 ? `لديك ${counts.all} إشعار${counts.all > 1 ? 'ات' : ''} غير مقروء${counts.all > 1 ? 'ة' : ''}` : 'لا توجد إشعارات غير مقروءة'}
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

      <BugReportModal
        isOpen={isBugModalOpen}
        onClose={() => {
          setIsBugModalOpen(false);
          setBugScreenshot(null);
        }}
        screenshotDataUrl={bugScreenshot}
        onSuccess={() => {
          setIsBugModalOpen(false);
          setBugScreenshot(null);
        }}
      />
    </nav>
  );
};

export default DesktopNavbar;
