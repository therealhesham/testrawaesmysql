import { FileExcelFilled, FilePdfFilled, SearchOutlined, DownOutlined, ContactsOutlined, EyeOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { useState, useEffect, useCallback } from "react";
import debounce from "lodash/debounce";
import PreRentalModal from "./PreRentalModal"; // استيراد المودال

interface Order {
  id: number;
  ClientName: string;
  PhoneNumber: string;
  nationalId: string;
  HomemaidId: number;
  Name: string;
  Nationalitycopy: string;
  Passportnumber: string;
  profileStatus: string;
  officeName: string;
}

interface Office {
  office: string;
}

interface Client {
  id: number;
  fullname: string;
  phonenumber: string;
  nationalId: string;
  city: string;
}

export default function RequestsTable() {
  const ordersPerPage = 10; // Number of orders to display per page
  const [activeTab, setActiveTab] = useState("recruitment");
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [officeFilter, setOfficeFilter] = useState("");
  const [offices, setOffices] = useState<Office[]>([]);
  const [recruitmentCount, setRecruitmentCount] = useState(0);
  const [rentalCount, setRentalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // حالة المودال
  const router = useRouter();

  // دالة debounced لجلب البيانات
  const debouncedFetchOrders = useCallback(
    debounce(async (search: string, status: string, office: string, tab: string, page: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          type: tab,
          page: page.toString(),
          limit: ordersPerPage.toString(),
          search,
          status,
          office,
        });

        const response = await fetch(`/api/requests_in_progress?${params}`);
        const data = await response.json();

        setOrders(data.orders);
        setTotalPages(Math.ceil(data.total / ordersPerPage));
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    fetchCounts();
    officesList();
  }, [activeTab]);

  useEffect(() => {
    debouncedFetchOrders(searchTerm, statusFilter, officeFilter, activeTab, currentPage);
  }, [searchTerm, statusFilter, officeFilter, activeTab, currentPage, debouncedFetchOrders]);

  const officesList = async () => {
    try {
      const list = await fetch("/api/externalofficesprisma");
      const awaiter = await list.json();
      setOffices(awaiter);
    } catch (error) {
      console.error("Error fetching offices:", error);
    }
  };

  const fetchCounts = async () => {
    try {
      const [recruitmentRes, rentalRes] = await Promise.all([
        fetch("/api/requests_in_progress?type=recruitment&count=true"),
        fetch("/api/requests_in_progress?type=rental&count=true"),
      ]);
      const recruitmentData = await recruitmentRes.json();
      const rentalData = await rentalRes.json();
      setRecruitmentCount(recruitmentData.count);
      setRentalCount(rentalData.count);
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // دوال للتعامل مع المودال
  const handleSelectClient = (client: Client) => {
    console.log("Selected client:", client);
    setIsModalOpen(false);
    // هنا يمكنك توجيه المستخدم إلى صفحة تأجير مع بيانات العميل
    router.push(`/admin/rentalform?clientId=${client.id}`);
  };

  const handleNewClient = () => {
    setIsModalOpen(false);
    router.push("/admin/rentalform?newClient=true");
  };

  return (
    <div className="flex flex-col gap-6">
      <PreRentalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectClient={handleSelectClient}
        onNewClient={handleNewClient}
      />
      {/* Tabs */}
      <div className="flex gap-10 border-b border-gray-200">
        <button
          className={`pb-2 text-sm font-medium ${
            activeTab === "recruitment"
              ? "text-gray-900 border-b-2 border-gray-900 font-bold"
              : "text-gray-500"
          }`}
          onClick={() => {
            setActiveTab("recruitment");
            setCurrentPage(1);
          }}
        >
          طلبات الاستقدام <span className="text-xs align-super">{recruitmentCount}</span>
        </button>
        <button
          className={`pb-2 text-sm font-medium ${
            activeTab === "rental"
              ? "text-gray-900 border-b-2 border-gray-900 font-bold"
              : "text-gray-500"
          }`}
          onClick={() => {
            setActiveTab("rental");
            setCurrentPage(1);
          }}
        >
          طلبات التاجير <span className="text-xs align-super">{rentalCount}</span>
        </button>
      </div>

      {/* Filters */}
      <div>
        <div className="flex gap-4">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
            <input
              type="text"
              placeholder="بحث بالاسم"
              className="bg-transparent outline-none text-right text-sm text-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchOutlined className="w-5 h-5 text-gray-500" />
          </div>
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none"
            >
              <option value="">حالة الطلب</option>
            </select>
          </div>
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-500">
            <select
              value={officeFilter}
              onChange={(e) => setOfficeFilter(e.target.value)}
              className="bg-transparent outline-none border-none"
            >
              <option value="">كل المكاتب</option>
              {offices.map(office => (
                <option key={office.office} value={office.office}>{office.office}</option>
              ))}
            </select>
          </div>
          <button 
            className="bg-teal-800 text-white px-4 py-2 rounded-md text-sm"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("");
              setOfficeFilter("");
              setCurrentPage(1);
            }}
          >
            اعادة ضبط
          </button>
        </div>
        <div className="flex gap-2">
          {activeTab === "rental" && (
            <button
              onClick={() => setIsModalOpen(true)} // فتح المودال
              className="bg-teal-800 text-white px-4 py-2 rounded-md text-sm"
            >
              طلب تأجير
            </button>
          )}
          <div className="flex flex-row mr-auto">
            <button className="bg-teal-800 text-white px-4 py-2 rounded-md text-xs flex items-center gap-1">
              <FilePdfFilled />
              PDF
            </button>
            <button className="bg-teal-800 text-white px-4 py-2 rounded-md text-xs flex items-center gap-1">
              <FileExcelFilled />
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && <div className="text-center text-gray-500">جاري التحميل...</div>}

      {/* Table */}
      <div className="border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-right border-collapse">
          <thead className="bg-teal-800 text-white font-bold">
            <tr>
              <th className="px-4 py-3">رقم الطلب</th>
              <th className="px-4 py-3">اسم العميل</th>
              <th className="px-4 py-3">رقم العميل</th>
              <th className="px-4 py-3">هوية العميل</th>
              <th className="px-4 py-3">رقم العاملة</th>
              <th className="px-4 py-3">اسم العاملة</th>
              <th className="px-4 py-3">الجنسية</th>
              <th className="px-4 py-3">رقم جواز السفر</th>
              <th className="px-4 py-3">رقم عقد مساند التوثيق</th>
              <th className="px-4 py-3">رقم عقد </th>
              <th className="px-4 py-3">حالة الطلب</th>
              <th className="px-4 py-3">المكتب</th>
              <th className="px-4 py-3">تواصل</th>
              <th className="px-4 py-3">عرض</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map(order => (
              <tr key={order.id} className="bg-gray-50 border-b border-gray-200">
                <td className="px-4 py-3">#{order.id}</td>
                <td className="px-4 py-3">{order.ClientName}</td>
                <td className="px-4 py-3">{order.PhoneNumber}</td>
                <td className="px-4 py-3">{order.nationalId}</td>
                <td className="px-4 py-3">{order.HomemaidId}</td>
                <td className="px-4 py-3">{order.Name}</td>
                <td className="px-4 py-3">{order.Nationalitycopy}</td>
                <td className="px-4 py-3">{order.Passportnumber}</td>
                <td className="px-4 py-3">{order?.arrivals?.[0]?.externalmusanedContract}</td>
                <td className="px-4 py-3">{order.profileStatus}</td>
                <td className="px-4 py-3">{order.officeName}</td>
                <td className="px-4 py-3">{order.officeName}</td>
                <td className="px-4 py-3 text-center">
                  <button className="text-gray-500 hover:text-teal-800">
                    <ContactsOutlined className="w-5 h-5 mx-auto" />
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="text-gray-500 hover:text-teal-800">
                    <EyeOutlined className="w-5 h-5 mx-auto" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center pt-5">
        <span className="text-base text-gray-700">
          عرض {(currentPage - 1) * ordersPerPage + 1}- {Math.min(currentPage * ordersPerPage, activeTab === "recruitment" ? recruitmentCount : rentalCount)} من {activeTab === "recruitment" ? recruitmentCount : rentalCount} نتيجة
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className={`px-3 py-1 border border-gray-200 rounded-sm text-sm ${currentPage === 1 || loading ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-700'}`}
          >
            السابق
          </button>
          {[...Array(totalPages)]?.map((_, index) => (
            <button
              key={index + 1}
              onClick={() => handlePageChange(index + 1)}
              disabled={loading}
              className={`px-3 py-1 border rounded-sm text-sm ${
                currentPage === index + 1
                  ? 'border-teal-800 bg-teal-800 text-white'
                  : 'border-gray-200 bg-gray-50 text-gray-700'
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className={`px-3 py-1 border border-gray-200 rounded-sm text-sm ${currentPage === totalPages || loading ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-700'}`}
          >
            التالي
          </button>
        </div>
      </div>
    </div>
  );
}