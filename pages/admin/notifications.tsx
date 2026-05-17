import { ArrowLeftOutlined, FieldTimeOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import Style from "../../styles/Home.module.css";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ar";
import Layout from "example/containers/Layout";
import DOMPurify from "dompurify";
import TaskCompletionModal from "../../components/TaskCompletionModal";

const STATUS_TRANSLATIONS: { [key: string]: string } = {
  // حلات الطلب (bookingstatus)
  pending: "قيد الانتظار",
  office_link_approved: "موافقة الربط مع إدارة المكاتب",
  pending_office_link: "في انتظار الربط مع إدارة المكاتب",
  external_office_approved: "موافقة المكتب الخارجي",
  pending_external_office: "في انتظار المكتب الخارجي",
  medical_check_passed: "تم اجتياز الفحص الطبي",
  pending_medical_check: "في انتظار الفحص الطبي",
  foreign_labor_approved: "موافقة وزارة العمل الأجنبية",
  pending_foreign_labor: "في انتظار وزارة العمل الأجنبية",
  agency_paid: "تم دفع الوكالة",
  pending_agency_payment: "في انتظار دفع الوكالة",
  embassy_approved: "موافقة السفارة السعودية",
  pending_embassy: "في انتظار السفارة السعودية",
  visa_issued: "تم إصدار التأشيرة",
  pending_visa: "في انتظار إصدار التأشيرة",
  travel_permit_issued: "تم إصدار تصريح السفر",
  pending_travel_permit: "في انتظار تصريح السفر",
  received: "تم الاستلام",
  pending_receipt: "في انتظار الاستلام",
  cancelled: "ملغي",
  rejected: "مرفوض",
  delivered: "تم التسليم",
  new_order: "طلب جديد",
  new_orders: "طلبات جديدة",
  // مراحل التتبع (stage / field names)
  officeLinkInfo: "الربط مع إدارة المكاتب",
  externalOfficeInfo: "المكتب الخارجي",
  externalOfficeApproval: "موافقة المكتب الخارجي",
  medicalCheck: "الفحص الطبي",
  foreignLaborApproval: "موافقة وزارة العمل الأجنبية",
  agencyPayment: "دفع الوكالة",
  saudiEmbassyApproval: "موافقة السفارة السعودية",
  visaIssuance: "إصدار التأشيرة",
  travelPermit: "تصريح السفر",
  destinations: "الوجهات",
  receipt: "الاستلام",
  ticketUpload: "رفع المستندات",
};

const translateStatusInMessage = (message: string) => {
  if (!message) return "";

  let translated = message;

  Object.keys(STATUS_TRANSLATIONS).forEach((statusKey) => {
    const arabicText = STATUS_TRANSLATIONS[statusKey];
    const regex = new RegExp(statusKey, "gi");
    translated = translated.replace(regex, arabicText);
  });

  return translated;
};

dayjs.extend(relativeTime);
dayjs.locale("ar");

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [tab, setTab] = useState("unread");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ all: 0, read: 0, unread: 0 });
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);
  const [isCleanupDone, setIsCleanupDone] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsCleanupDone(localStorage.getItem("notifications_cleanup_done") === "true");
    }
  }, []);

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

  // جلب البيانات عند تغيير الصفحة أو التبويب
  useEffect(() => {
    setPage(1); // إعادة الصفحة للأولى عند تغيير التبويب
  }, [tab]);

  useEffect(() => {
    fetchNotifications();
  }, [tab, page]);

  // تحديث حي عبر Socket.IO
  useEffect(() => {
    const socket = io();
    socket.on("newNotification", () => {
      fetchNotifications();
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  // جلب معلومات المستخدم الحالي مع الصلاحيات
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          if (data?.user?.id) {
            setCurrentUser({ 
              id: data.user.id, 
              username: data.user.username,
              role: data.user.role 
            });
          }
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  const handleRunCleanup = async () => {
    if (!window.confirm("هل أنت متأكد من رغبتك في تشغيل صيانة قاعدة البيانات وتطهير الإشعارات المتضاربة؟")) {
      return;
    }
    
    setIsCleaning(true);
    setCleanupResult(null);
    
    try {
      const response = await fetch("/api/notifications/cleanup", {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCleanupResult(data.message || "تمت الصيانة بنجاح!");
        if (typeof window !== 'undefined') {
          localStorage.setItem("notifications_cleanup_done", "true");
        }
        setIsCleanupDone(true);
        fetchNotifications();
      } else {
        alert(data.error || "حدث خطأ أثناء الصيانة");
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
      alert("حدث خطأ في الاتصال بالخادم");
    } finally {
      setIsCleaning(false);
    }
  };

  // تسجيل الإشعار كمقروء عند النقر عليه
  const handleNotificationClick = async (notification: any) => {
    // إذا كان الإشعار مرتبط بمهمة، افتح modal المهمة
    if (notification.taskId && notification.task) {
      setSelectedTask(notification.task);
      setIsTaskModalOpen(true);
    }

    // تسجيل الإشعار كمقروء
    try {
      const response = await fetch(`/api/notifications/${notification.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });

      if (!response.ok) throw new Error("Failed to mark notification as read");

      // تحديث القائمة بعد تسجيل الإشعار كمقروء
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // تحديث المهمة
  const handleTaskUpdate = async (
    taskId: number,
    isCompleted: boolean,
    completionDate?: string,
    completionNotes?: string
  ) => {
    try {
      const response = await fetch("/api/tasks/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          isCompleted,
          completionDate,
          completionNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update task");
      }

      const updatedTask = await response.json();

      // تحديث الإشعارات بعد تحديث المهمة
      setNotifications((prev) =>
        prev.map((notif: any) =>
          notif.taskId === taskId
            ? {
                ...notif,
                task: notif.task ? { ...notif.task, ...updatedTask } : undefined,
              }
            : notif
        )
      );

      setIsTaskModalOpen(false);
      fetchNotifications(); // تحديث القائمة
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  };

  // الحصول على لون حسب الأولوية
  const getPriorityColor = (priority?: string) => {
    if (!priority) return "";
    if (priority === "عالية الأهمية" || priority === "high") {
      return "border-r-4 border-red-500 bg-red-50";
    } else if (priority === "متوسط الأهمية" || priority === "medium") {
      return "border-r-4 border-yellow-500 bg-yellow-50";
    } else {
      return "border-r-4 border-green-500 bg-green-50";
    }
  };

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
              onClick={() => handleNotificationClick(n)}
              className={`flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-gray-50 cursor-pointer transition-all ${
                n.taskId && n.task ? getPriorityColor(n.task.priority) : ""
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                {n.taskId && n.task && (
                  <span className="text-xl mt-1">📋</span>
                )}
                <div className="flex flex-col gap-2 flex-1">
                  <p
                    className="text-sm font-semibold text-gray-900"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        translateStatusInMessage(n.message || n.title || "")
                      ),
                    }}
                  ></p>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    منذ {dayjs(n.createdAt).fromNow()} <FieldTimeOutlined />
                  </p>
                </div>
              </div>
              <button className="bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 ml-2">
                <ArrowLeftOutlined className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null; // إخفاء الـ pagination إذا كان هناك صفحة واحدة أو أقل

    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 7; // عدد الصفحات المرئية
      
      if (totalPages <= maxVisible) {
        // إذا كان عدد الصفحات أقل من الحد الأقصى، اعرض جميع الصفحات
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // منطق معقد لعرض الصفحات مع ...
        if (page <= 4) {
          // إذا كانت الصفحة الحالية في البداية
          for (let i = 1; i <= 5; i++) pages.push(i);
          pages.push("...");
          pages.push(totalPages);
        } else if (page >= totalPages - 3) {
          // إذا كانت الصفحة الحالية في النهاية
          pages.push(1);
          pages.push("...");
          for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
        } else {
          // إذا كانت الصفحة الحالية في المنتصف
          pages.push(1);
          pages.push("...");
          for (let i = page - 1; i <= page + 1; i++) pages.push(i);
          pages.push("...");
          pages.push(totalPages);
        }
      }
      return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className={`px-3 py-2 rounded-lg border ${
            page === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          السابق
        </button>
        {pageNumbers.map((p, idx) => (
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p as number)}
              className={`px-3 py-2 rounded-lg border ${
                page === p
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
              }`}
            >
              {p}
            </button>
          )
        ))}
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className={`px-3 py-2 rounded-lg border ${
            page === totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          التالي
        </button>
      </div>
    );
  };

  return (
    <Layout>
      <div className="p-4">
        {cleanupResult && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex justify-between items-center animate-fade-in">
            <span className="text-sm font-semibold">✨ {cleanupResult}</span>
            <button onClick={() => setCleanupResult(null)} className="text-emerald-500 hover:text-emerald-700 font-bold text-lg">×</button>
          </div>
        )}

        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
          <h4 className={`text-lg mb-0 ${Style["tajawal-bold"]}`}>الإشعارات</h4>
          {currentUser && !isCleanupDone && (
            <button
              onClick={handleRunCleanup}
              disabled={isCleaning}
              style={{
                backgroundColor: isCleaning ? "#f59e0b" : "#d97706",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: isCleaning ? "not-allowed" : "pointer",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                if (!isCleaning) e.currentTarget.style.backgroundColor = "#b45309";
              }}
              onMouseLeave={(e) => {
                if (!isCleaning) e.currentTarget.style.backgroundColor = "#d97706";
              }}
            >
              {isCleaning ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" style={{ width: "16px", height: "16px" }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>جاري الصيانة...</span>
                </>
              ) : (
                <>
                  <span>🛠️</span>
                  <span>تنظيف وصيانة الإشعارات</span>
                </>
              )}
            </button>
          )}
        </div>
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

        {/* Task Completion Modal */}
        {isTaskModalOpen && selectedTask && (
          <TaskCompletionModal
            isOpen={isTaskModalOpen}
            onClose={() => {
              setIsTaskModalOpen(false);
              setSelectedTask(null);
            }}
            task={selectedTask}
            onTaskUpdate={handleTaskUpdate}
            currentUser={currentUser}
          />
        )}
      </div>
    </Layout>
  );
}
