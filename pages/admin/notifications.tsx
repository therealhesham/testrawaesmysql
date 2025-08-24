import { ArrowLeftOutlined, FieldTimeOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import Style from "../../styles/Home.module.css";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ar";
import Layout from "example/containers/Layout";

dayjs.extend(relativeTime);
dayjs.locale("ar");

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [tab, setTab] = useState("unread");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ all: 0, read: 0, unread: 0 });

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?tab=${tab}&page=${page}&limit=5`);
      if (!response.ok) throw new Error("Failed to fetch notifications");

      const { data, totalPages, counts } = await response.json();
      setNotifications(data);
      setTotalPages(totalPages);
      setCounts(counts);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // إعادة الصفحة للأولى عند تغيير التبويب
  useEffect(() => {
    setPage(1);
  }, [tab]);

  // جلب البيانات عند تغيير الصفحة أو التبويب
  useEffect(() => {
    fetchNotifications();
  }, [tab, page]);

  // تحديث حي عبر Socket.IO
  useEffect(() => {
    const socket = io();
    socket.on("newNotification", () => {
      fetchNotifications();
    });
    return () => socket.disconnect();
  }, []);

  // تقسيم الإشعارات زمنياً
  const today = dayjs().startOf("day");
  const yesterday = dayjs().subtract(1, "day").startOf("day");
  const todayNotifications = notifications.filter((n: any) => dayjs(n.createdAt).isSame(today, "day"));
  const yesterdayNotifications = notifications.filter((n: any) => dayjs(n.createdAt).isSame(yesterday, "day"));
  const previousNotifications = notifications.filter((n: any) => dayjs(n.createdAt).isBefore(yesterday, "day"));

  const renderNotificationSection = (title: string, list: any[]) => (
    <section className="bg-gradient-to-br mt-4 from-white to-gray-50 border border-gray-100 rounded-2xl p-6 shadow-lg">
      <header className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-gray-800">{title}</h3>
      </header>
      <div className="flex flex-col gap-4">
        {list.length === 0 ? (
          <p className="text-gray-500">لا توجد إشعارات</p>
        ) : (
          list.map((n: any) => (
            <div
              key={n.id}
              className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-gray-50"
            >
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-gray-900">{n.message}</p>
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  منذ {dayjs(n.createdAt).fromNow()} <FieldTimeOutlined />
                </p>
              </div>
              <button className="bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100">
                <ArrowLeftOutlined className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );

  const renderPagination = () => (
    <div className="flex gap-2 mt-6">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => setPage(p)}
          className={`px-3 py-1 rounded-lg border ${
            page === p ? "bg-teal-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="p-4">
        {/* Tabs */}
      <h4 className={`text-lg  mb-2 ${Style["tajawal-bold"]}`}>الإشعارات</h4>
        <nav className={`flex gap-6 border-b pb-3 mb-6 ${Style["tajawal-medium"]}`}>
          <a onClick={() => setTab("all")}
             className={`cursor-pointer px-3 py-2 rounded-lg ${tab === "all" ? "bg-teal-50 text-teal-700" : ""}`}>
            الكل{" "}
            <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">
              {counts.all}
            </span>
          </a>
          <a onClick={() => setTab("read")}
             className={`cursor-pointer px-3 py-2 rounded-lg ${tab === "read" ? "bg-teal-50 text-teal-700" : ""}`}>
            مقروء{" "}
            <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">
              {counts.read}
            </span>
          </a>
          <a onClick={() => setTab("unread")}
             className={`cursor-pointer px-3 py-2 rounded-lg ${tab === "unread" ? "bg-teal-50 text-teal-700" : ""}`}>
            غير مقروء{" "}
            <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">
              {counts.unread}
            </span>
          </a>
        </nav>

        {/* Sections */}
        {renderNotificationSection("اليوم", todayNotifications)}
        {renderNotificationSection("أمس", yesterdayNotifications)}
        {renderNotificationSection("السابق", previousNotifications)}

        {/* Pagination */}
        {renderPagination()}
      </div>
    </Layout>
  );
}
