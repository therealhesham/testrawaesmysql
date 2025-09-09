import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "example/containers/Layout";
import Style from "styles/Home.module.css";
import { FaSearch, FaRedo, FaFileExcel, FaFilePdf } from "react-icons/fa";
import { ArrowLeftIcon } from "@heroicons/react/outline";
import { PlusOutlined } from "@ant-design/icons";
import Modal from "react-modal";

// Bind modal to app element for accessibility
Modal.setAppElement("#__next");

export default function Table() {
  const [filters, setFilters] = useState({
    SponsorName: "",
    age: "",
    PassportNumber: "",
    OrderId: "",
  });
  function getDate(date) {
    const currentDate = new Date(date); // Original date
    // currentDate.setDate(currentDate.getDate() + 90); // Add 90 days
    const form = currentDate.toISOString().split("T")[0];
    console.log(currentDate);
    return form;
  }

  const [visibleColumns, setVisibleColumns] = useState({
    OrderId: true,
    SponsorName: true,
    SponsorPhoneNumber: true,
    WorkerName: true,
    PassportNumber: true,
    DepartureDate: true,
    DepartureTime: true,
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [isStep1ModalOpen, setIsStep1ModalOpen] = useState(false);
  const [isStep2ModalOpen, setIsStep2ModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    SponsorName: "",
    InternalmusanedContract: "",
    id: "",
    SponsorIdnumber: "",
    SponsorPhoneNumber: "",
    PassportNumber: "",
    KingdomentryDate: "",
    DayDate: "",
    profileStatus: "",
    KingdomentryTime: "",
    deparatureTime: "",
    visaNumber: "",
    finalDestinationTime: "",
    ExternalStatusByoffice: "",
    deparatureDate: "",
    finalDestinationDate: "",
    DeliveryDate: "",
    office: "",
    Orderid: "",
    WorkDuration: "",
    Cost: "",
    nationalidNumber: "",
    externalOfficeFile: null,
    finaldestination: "",
    externalOfficeStatus: "",
    HomemaIdnumber: "",
    HomemaidName: "",
    Notes: "",
    externalmusanadcontractfile: null,
    medicalCheckFile: null,
    ticketFile: null,
    receivingFile: null,
    approvalPayment: null,
    additionalfiles: [],
    externalmusanedContract: "",
    ArrivalCity: "",
    DeliveryFile: null,
    DateOfApplication: "",
    MusanadDuration: "",
    ExternalDateLinking: "",
    ExternalOFficeApproval: "",
    AgencyDate: "",
    EmbassySealing: "",
    BookinDate: "",
    GuaranteeDurationEnd: "",
  });

  function getDate(date) {
    if (!date) return null;
    const currentDate = new Date(date);
    return currentDate.toISOString().split("T")[0];
  }

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const isFetchingRef = useRef(false);

  const fetchData = async (page = 1) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        age: filters.age,
        PassportNumber: filters.PassportNumber,
        page: String(page),
        perPage: "10",
      });

      const response = await fetch(`/api/homemaidprisma?${queryParams}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "get",
      });

      const { data: res, totalPages: pages } = await response.json();
      if (res && res.length > 0) {
        setData(res);
        console.log("Data fetched successfully:", res);
        setTotalPages(pages || 1);
      } else {
        setData([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, filters]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFilterChange = (e, column) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
    setCurrentPage(1);
  };

  const router = useRouter();
  const handleUpdate = (id) => {
    router.push("./neworder/" + id);
  };

  const resetFilters = () => {
    isFetchingRef.current = false;
    setFilters({
      age: "",
      OrderId: "",
      PassportNumber: "",
      SponsorName: "",
    });
    setCurrentPage(1);
    setData([]);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const toggleColumn = (column) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`mx-1 px-3 py-1 rounded ${
            currentPage === i
              ? "bg-teal-800 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex justify-center mt-4 items-center">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="mx-1 px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="mx-1 px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  };

  const openStep1Modal = () => {
    setIsStep1ModalOpen(true);
    setFormData({
      SponsorName: "",
      InternalmusanedContract: "",
      id: "",
      SponsorIdnumber: "",
      SponsorPhoneNumber: "",
      PassportNumber: "",
      KingdomentryDate: "",
      DayDate: "",
      profileStatus: "",
      KingdomentryTime: "",
      deparatureTime: "",
      visaNumber: "",
      finalDestinationTime: "",
      ExternalStatusByoffice: "",
      deparatureDate: "",
      finalDestinationDate: "",
      DeliveryDate: "",
      office: "",
      Orderid: "",
      WorkDuration: "",
      Cost: "",
      nationalidNumber: "",
      externalOfficeFile: null,
      finaldestination: "",
      externalOfficeStatus: "",
      HomemaIdnumber: "",
      HomemaidName: "",
      Notes: "",
      externalmusanadcontractfile: null,
      medicalCheckFile: null,
      ticketFile: null,
      receivingFile: null,
      approvalPayment: null,
      additionalfiles: [],
      externalmusanedContract: "",
      ArrivalCity: "",
      DeliveryFile: null,
      DateOfApplication: "",
      MusanadDuration: "",
      ExternalDateLinking: "",
      ExternalOFficeApproval: "",
      AgencyDate: "",
      EmbassySealing: "",
      BookinDate: "",
      GuaranteeDurationEnd: "",
    });
  };

  const closeStep1Modal = () => setIsStep1ModalOpen(false);
  const openStep2Modal = () => {
    closeStep1Modal();
    setIsStep2ModalOpen(true);
  };
  const closeStep2Modal = () => setIsStep2ModalOpen(false);

  const handleStep1Submit = (e) => {
    e.preventDefault();
    openStep2Modal();
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "additionalfiles") {
        formData[key].forEach((file, index) => {
          data.append(`additionalfiles[${index}]`, file);
        });
      } else if (formData[key] instanceof File) {
        data.append(key, formData[key]);
      } else {
        data.append(key, formData[key]);
      }
    });

    try {
      const response = await fetch("/api/updatehomemaidarrivalprisma", {
        method: "POST",
        body: data,
      });

      if (response.ok) {
        alert("تم تسجيل المغادرة بنجاح");
        closeStep2Modal();
        fetchData(currentPage); // إعادة تحميل البيانات
      } else {
        alert("حدث خطأ أثناء تسجيل المغادرة");
      }
    } catch (error) {
      console.error("Error submitting departure:", error);
      alert("حدث خطأ أثناء تسجيل المغادرة");
    }
  };

  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleMultipleFilesChange = (e) => {
    const { name, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: Array.from(files),
    }));
  };

  // Modal styles with responsiveness and modern design
  const customModalStyles = {
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 1000,
      animation: "fadeIn 0.3s ease-in-out",
    },
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      transform: "translate(-50%, -50%)",
      width: "90%",
      maxWidth: "600px",
      maxHeight: "90vh",
      padding: "24px",
      borderRadius: "12px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
      backgroundColor: "#fff",
      overflowY: "auto",
      fontFamily: '"Almarai", sans-serif',
      animation: "slideIn 0.3s ease-in-out",
    },
  };

  return (
    <Layout>
      <div className={`container mx-auto p-4 ${Style["almarai-regular"]}`}>
        <div className="space-y-4">
          <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
            <div className="flex items-center justify-between p-4">
              <h1
                className={`text-2xl font-bold text-cool-gray-700 ${Style["almarai-bold"]}`}
              >
                قائمة العاملات
              </h1>
              <button
                onClick={()=>router.push("/admin/newhomemaids")}
                className="bg-teal-900 py-1 flex flex-row justify-around gap-1 px-2 rounded-md"
              >
                <PlusOutlined className="text-white" size={12} />
                <span className="text-white">اضافة عاملة</span>
              </button>
            </div>

            <div className="flex flex-col gap-4 p-4">
              <div className="flex flex-row flex-nowrap justify-between items-center gap-2">
                <div className="relative w-[280px] max-w-md">
                  <input
                    type="text"
                    value={filters.SponsorName}
                    onChange={(e) => handleFilterChange(e, "SponsorName")}
                    placeholder="بحث "
                    className="p-2 pl-10 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <div className="relative w-[280px] max-w-md">
                  <input
                    type="text"
                    value={filters.PassportNumber}
                    onChange={(e) => handleFilterChange(e, "PassportNumber")}
                    placeholder="بحث برقم الجواز"
                    className="p-2 pl-10 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <div className="relative w-[280px] max-w-md">
                  <input
                    type="text"
                    value={filters.OrderId}
                    onChange={(e) => handleFilterChange(e, "OrderId")}
                    placeholder="بحث برقم الطلب"
                    className="p-2 pl-10 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="bg-white justify-between py-2 px-4 rounded-lg border border-gray-200 flex items-center gap-1 text-gray"
                  >
                    <span className={`${Style["almarai-regular"]} text-gray-400`}>
                      الأعمدة
                    </span>
                    <ArrowLeftIcon className="w-4 h-4 text-gray-400" />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="p-2">
                        {Object.keys(visibleColumns).map((column) => (
                          <label
                            key={column}
                            className="flex items-center gap-2 py-1"
                          >
                            <input
                              type="checkbox"
                              checked={visibleColumns[column]}
                              onChange={() => toggleColumn(column)}
                              className="form-checkbox"
                            />
                            <span className="text-sm">
                              {column === "OrderId" && "رقم الطلب"}
                              {column === "SponsorName" && "اسم الكفيل"}
                              {column === "SponsorPhoneNumber" && "جوال العميل"}
                              {column === "WorkerName" && "اسم العاملة"}
                              {column === "PassportNumber" && "رقم جواز السفر"}
                              {column === "DepartureDate" && "تاريخ المغادرة"}
                              {column === "DepartureTime" && "وقت المغادرة"}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={resetFilters}
                  className="bg-teal-800 py-2 px-4 rounded-lg flex items-center gap-1 hover:bg-teal-900"
                >
                  <FaRedo className="text-white" />
                  <span className={`text-white ${Style["almarai-bold"]}`}>
                    إعادة ضبط
                  </span>
                </button>
              </div>
              <div className="flex flex-row gap-2 justify-end">
                <button
                  className="bg-teal-800 my-2 py-1 px-3 rounded-lg flex items-center gap-1 hover:bg-teal-900"
                  title="تصدير إلى Excel"
                >
                  <FaFileExcel className="text-white" />
                  <span className="text-white">Excel</span>
                </button>
                <button
                  onClick={() => alert("سيتم إضافة وظيفة تصدير PDF لاحقًا")}
                  className="bg-teal-800 my-2 py-1 px-3 rounded-lg flex items-center gap-1 hover:bg-teal-900"
                  title="تصدير إلى PDF"
                >
                  <FaFilePdf className="text-white" />
                  <span className="text-white">PDF</span>
                </button>
              </div>
            </div>

            <table className="min-w-full text-sm text-left">
              <thead className="bg-teal-800">
                <tr className="text-white">
                  <th className="px-4 py-2 text-center">الرقم</th>
                  <th className="px-4 py-2 text-center">الاسم</th>
                  <th className="px-4 py-2 text-center">رقم الجوال</th>
                  <th className="px-4 py-2 text-center">الجنسية</th>
                  <th className="px-4 py-2 text-center">الحالة الاجتماعية</th>
                  <th className="px-4 py-2 text-center">العمر</th>
                  <th className="px-4 py-2 text-center">رقم جواز السفر</th>
                  <th className="px-4 py-2 text-center">بداية الجواز</th>
                  <th className="px-4 py-2 text-center">نهاية الجواز</th>
                  <th className="px-4 py-2 text-center">المكتب</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        Object.values(visibleColumns).filter(Boolean).length
                      }
                      className="px-4 py-2 text-center text-gray-500"
                    >
                      لا توجد نتائج
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td
                        onClick={() => router.push("./neworder/" + item.homemaidId)}
                        className="px-4 py-2 text-lg text-center text-teal-800 cursor-pointer hover:underline"
                      >
                        {item.id}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600">
                        {item.Name}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600">
                        {item.phone}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600">
                        {item?.office?.Country}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600">
                        {item.maritalstatus}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600">
                        {item.dateofbirth}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600">
                        {item.Passportnumber}
                      </td>
                      <td className="px-4  py-2 text-center text-gray-600">
                        {item.PassportStart?getDate(item.PassportStart):""}
                      </td>
                                            <td className="px-4  py-2 text-center text-gray-600">
                        {item.PassportEnd?getDate(item.PassportEnd):""}
                      </td>
     <td className="px-4 py-2 text-center text-gray-600">
                        {item?.office?.office}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 && renderPagination()}
            {loading && (
              <div className="flex justify-center mt-4">
                <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-t-transparent border-teal-800 rounded-full"></div>
              </div>
            )}
          </div>
        </div>

        {/* Step 1 Modal */}
        <Modal
          isOpen={isStep1ModalOpen}
          onRequestClose={closeStep1Modal}
          style={customModalStyles}
          contentLabel="تسجيل مغادرة - الخطوة 1"
          shouldFocusAfterRender={true}
          shouldCloseOnOverlayClick={true}
        >
          <div className="relative">
            <button
              onClick={closeStep1Modal}
              className="absolute top-0 right-0 text-gray-500 hover:text-gray-700"
              aria-label="إغلاق"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className={`text-2xl font-bold text-teal-800 mb-6 ${Style["almarai-bold"]}`}>
              تسجيل مغادرة - الخطوة 1
            </h2>
            <form className="space-y-4" onSubmit={handleStep1Submit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             
                <div className="flex flex-col col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    رقم الطلب *
                  </label>
                  <input
                    type="text"
                    name="Orderid"
                    value={formData.Orderid}
                    onChange={handleFormChange}
                    placeholder="أدخل رقم الطلب"
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
             
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    اسم العميل *
                  </label>
                  <input
                    type="text"
                    name="SponsorName"
                    value={formData.SponsorName}
                    onChange={handleFormChange}
                    placeholder="أدخل اسم الكفيل"
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                     هوية العميل *
                  </label>
                  <input
                    type="text"
                    name="SponsorIdnumber"
                    value={formData.SponsorIdnumber}
                    onChange={handleFormChange}
                    placeholder=" هوية العميل"
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>


                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    مدينة العاملة *
                  </label>
                  <input
                    type="text"
                    name="HomemaidName"
                    value={formData.HomemaidName}
                    onChange={handleFormChange}
                    placeholder="مدينة العاملة"
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>



                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    اسم العاملة *
                  </label>
                  <input
                    type="text"
                    name="HomemaidName"
                    value={formData.HomemaidName}
                    onChange={handleFormChange}
                    placeholder="اسم العاملة"
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>



                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    رقم الجواز *
                  </label>
                  <input
                    type="text"
                    name="PassportNumber"
                    value={formData.PassportNumber}
                    onChange={handleFormChange}
                    placeholder="أدخل رقم الجواز"
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
             
             
             
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    جنسية العاملة *
                  </label>
                  <input
                    type="text"
                    name="nationality"
                    value={formData.Nationality}
                    onChange={handleFormChange}
                    placeholder="جنسية العاملة"
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
             
             
             
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    حالة الضمان 
                  </label>
     <input
                    type="text"
                    name="GuaranteedStatus"
                    value={formData.GuaranteeStatus}
                    onChange={handleFormChange}
                    placeholder="حالة الضمان"
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
             


             
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
              المدة المتبقية
                  </label>
                  <input
                    type="text"
                    name="GuaranteeDurationEnd"
                    value={formData.GuaranteeDurationEnd}
                    onChange={handleFormChange}
                    placeholder="المدة المتبقية"
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
             

              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeStep1Modal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-800 text-white rounded-md hover:bg-teal-900 transition-colors"
                >
                  التالي
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Step 2 Modal */}
        <Modal
          isOpen={isStep2ModalOpen}
          onRequestClose={closeStep2Modal}
          style={customModalStyles}
          contentLabel="تسجيل مغادرة - الخطوة 2"
          shouldFocusAfterRender={true}
          shouldCloseOnOverlayClick={true}
        >
          <div className="relative">
            <button
              onClick={closeStep2Modal}
              className="absolute top-0 right-0 text-gray-500 hover:text-gray-700"
              aria-label="إغلاق"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className={`text-2xl font-bold text-teal-800 mb-6 ${Style["almarai-bold"]}`}>
              تسجيل مغادرة - الخطوة 2
            </h2>
            <form className="space-y-4" onSubmit={handleStep2Submit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">






                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    سبب المغادرة
                  </label>
                  <input
                    type="text"
                    name="reason"
                    placeholder="سبب المغادرة"
                    value={formData.reason}
                    onChange={handleFormChange}
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>



                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    من
                  </label>
                  <input
                    type="text"
                    name="reason"
                    placeholder="وجهة المغادرة"
                    value={formData.ArrivalCity}
                    onChange={handleFormChange}
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>




                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    الى
                  </label>
                  <input
                    type="text"
                    name="reason"
                    placeholder="وجهة الوصول"
                    value={formData.finaldestination}
                    onChange={handleFormChange}
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>




                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    تاريخ المغادرة
                  </label>
                  <input
                  placeholder="ادخل تاريخ ووقت المغادرة"
                    type="datetime-local"
                    name="deparatureDate"
                    value={formData.deparatureDate}
                    onChange={handleFormChange}
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>


                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    تاريخ الوصول
                  </label>
                  <input
                  placeholder="ادخل تاريخ ووقت الوصول"
                    type="datetime-local"
                    name="deparatureDate"
                    value={formData.ArrivalDate}
                    onChange={handleFormChange}
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>


                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    ملف التذكرة
                  </label>
                  <input
                    type="file"
                    name="ticketFile"
                    onChange={handleFormChange}
                    accept=".pdf,.jpg,.png"
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    closeStep2Modal();
                    setIsStep1ModalOpen(true);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  رجوع
                </button>
                <button
                  type="button"
                  onClick={closeStep2Modal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-800 text-white rounded-md hover:bg-teal-900 transition-colors"
                >
                  إرسال
                </button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}