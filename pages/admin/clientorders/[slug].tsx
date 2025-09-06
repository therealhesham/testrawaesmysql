import Layout from "example/containers/Layout";
import { jwtDecode } from "jwt-decode";
import prisma from "lib/prisma";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const ClientsTable = () => {
  const [data, setData] = useState([]);
  const [reports, setReports] = useState([]);
  const [clientInfo, setClientInfo] = useState(null); // New state for client info
  const [page, setPage] = useState(1);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [activeTab, setActiveTab] = useState("current");
  const router = useRouter();

  // Handle scroll for infinite loading
  const handleScroll = () => {
    const scrollPosition = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollPosition >= documentHeight - 100) {
      setIsAtBottom(true);
      setPage((prev) => prev + 1);
    } else {
      setIsAtBottom(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Fetch orders and client data
  const fetchData = async () => {
    if (!router.isReady) return;
    try {
      const response = await fetch(`/api/clientorders/${router.query.slug}?page=${page}`, {
        method: "GET",
      });
      const newData = await response.json();

      setData((prevData) => [...prevData, ...newData.orders]);
      setReports(newData.reports || []);
      setClientInfo(newData|| null); // Set client info if available
      console.log("Fetched orders:", newData.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, router.isReady]);

  const handleExitClick = () => {
    router.push("/admin/clients");
  };

  // Filter orders by status
  const currentOrders = data.filter((order) => order.bookingstatus !== "الاستلام" && order.bookingstatus !== "حجز جديد");
  const newOrders = data.filter((order) => order.bookingstatus === "حجز جديد");
  const completedOrders = data.filter((order) => order.bookingstatus === "الاستلام");

  const renderTable = (orders) => (
    <table className="min-w-full table-auto text-sm">
      <thead className="bg-gray-800 text-white">
        <tr>
          <th className="px-4 py-2">رقم الطلب</th>
          <th className="px-4 py-2">اسم العاملة</th>
          <th className="px-4 py-2">جوال العاملة</th>
          <th className="px-4 py-2">رقم الخادمة</th>
          <th className="px-4 py-2">الخبرة</th>
          <th className="px-4 py-2">العمر</th>
          <th className="px-4 py-2">رقم التأشيرة</th>
          <th className="px-4 py-2">موافق</th>
          <th className="px-4 py-2">رفض</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((row, index) => (
          <tr
            key={row.id}
            className={`${index % 2 === 0 ? "bg-gray-50" : "bg-gray-100"} hover:bg-gray-200 transition-colors duration-200`}
          >
            <td className="px-4 py-2 text-center text-lg">{row.id}</td>
            <td className="px-4 py-2 text-center">{row.Name}</td>
            <td className="px-4 text-center py-2">{row.PhoneNumber}</td>
            <td
              onClick={() => router.push(`/admin/cvdetails/${row.HomemaidId}`)}
              className="px-3 py-2 cursor-pointer text-center decoration-black"
            >
              {row.HomemaidId}
            </td>
            <td className="px-4 text-center py-2">{row?.ExperienceYears}</td>
            <td className="px-4 text-center py-2">{row?.age}</td>
            <td className="px-4 text-center py-2">{row?.arrivals[0]?.visaNumber}</td>
            <td className="px-4 text-center py-2">
              <button
                onClick={() => router.push(`/admin/neworder/${row?.id}`)}
                className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 active:bg-green-700 transition-all duration-200"
              >
                موافق
              </button>
            </td>
            <td className="px-4 text-center py-2">
              <button className="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600">
                رفض
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Render reports table
  const renderReports = () => (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">تقارير العميل</h2>
      <table className="min-w-full table-auto text-sm">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="px-4 py-2">رقم التقرير</th>
            <th className="px-4 py-2">رقم الطلب</th>
            <th className="px-4 py-2">نوع التقرير</th>
            <th className="px-4 py-2">الوصف</th>
            <th className="px-4 py-2">تاريخ الإنشاء</th>
            <th className="px-4 py-2">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report, index) => (
            <tr
              key={report.reportId}
              className={`${index % 2 === 0 ? "bg-gray-50" : "bg-gray-100"} hover:bg-gray-200 transition-colors duration-200`}
            >
              <td className="px-4 py-2 text-center">{report.reportId}</td>
              <td className="px-4 py-2 text-center">{report.orderId}</td>
              <td className="px-4 py-2 text-center">{report.reportType}</td>
              <td className="px-4 py-2 text-center">{report.description}</td>
              <td className="px-4 py-2 text-center">{new Date(report.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-2 text-center">{report.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Render client info card
  const renderClientInfo = () => (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">بيانات العميل</h2>
      {clientInfo ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600"><strong>الاسم:</strong> {clientInfo.fullname || "غير متوفر"}</p>
            <p className="text-sm text-gray-600"><strong>رقم الهاتف:</strong> {clientInfo.phonenumber || "غير متوفر"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600"><strong>البريد الإلكتروني:</strong> {clientInfo.email || "غير متوفر"}</p>
            <p className="text-sm text-gray-600"><strong>رقم العميل:</strong> {clientInfo.id || "غير متوفر"}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600">لا توجد بيانات للعميل</p>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="absolute top-4 right-10">
        <button
          onClick={handleExitClick}
          className="text-gray-500 hover:text-black"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-8 w-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="overflow-x-auto shadow-lg rounded-lg bg-white p-6">
        <h1 className="text-2xl font-semibold text-center mb-4">طلبات العميل</h1>

        {/* Client Info Card */}
        {renderClientInfo()}

        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 font-semibold ${activeTab === "current" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
            onClick={() => setActiveTab("current")}
          >
            الطلبات الحالية
          </button>
          <button
            className={`px-4 py-2 font-semibold ${activeTab === "new" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
            onClick={() => setActiveTab("new")}
          >
            الطلبات الجديدة
          </button>
          <button
            className={`px-4 py-2 font-semibold ${activeTab === "completed" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
            onClick={() => setActiveTab("completed")}
          >
            الطلبات المنتهية
          </button>
          <button
            className={`px-4 py-2 font-semibold ${activeTab === "reports" ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-500"}`}
            onClick={() => setActiveTab("reports")}
          >
            تقارير العميل
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "current" && renderTable(currentOrders)}
          {activeTab === "new" && renderTable(newOrders)}
          {activeTab ==="completed" && renderTable(completedOrders)}
          {activeTab === "reports" && renderReports()}
        </div>

        {isAtBottom && activeTab !== "reports" && (
          <div className="fixed bottom-0 left-0 w-full bg-green-500 text-white py-2 text-center">
            لا يوجد بيانات أخرى
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClientsTable;


export async function getServerSideProps({ req }) {
  try {
    const cookieHeader = req.headers.cookie;
    let cookies = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    if (!cookies.authToken) {
      return {
        redirect: { destination: "/admin/login", permanent: false },
      };
    }

    const token = jwtDecode(cookies.authToken);
    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });

    const hasPermission = findUser && findUser.role?.permissions?.["إدارة العملاء"]?.["عرض"];

    return {
      props: {
        hasPermission: !!hasPermission,
      },
    };
  } catch (err) {
    console.error("Authorization error:", err);
    return {
      props: {
        hasPermission: false,
      },
    };
  }
}