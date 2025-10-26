import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "example/containers/Layout";
import Style from "styles/Home.module.css";
import { FaSearch, FaRedo, FaFileExcel, FaFilePdf } from "react-icons/fa";
import { ArrowLeftIcon } from "@heroicons/react/outline";
import { PlusOutlined } from "@ant-design/icons";
import Modal from "react-modal";
import { jwtDecode } from "jwt-decode";
import prisma from "lib/prisma";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

// Bind modal to app element for accessibility
Modal.setAppElement("#__next");

export default function Table() {
  const [filters, setFilters] = useState({
    SponsorName: "",age: "",PassportNumber: "", OrderId: "",
  });

  const [visibleColumns, setVisibleColumns] = useState({
    OrderId: true,
    SponsorName: true,
    SponsorPhoneNumber: true,
    WorkerName: true,
    PassportNumber: true,
    DepartureDate: true,
    DepartureTime: true,
  });
function getDate(date) {
  if (!date) return null;
  const currentDate = new Date(date);
  const formatted = currentDate.getDate() + '/' + (currentDate.getMonth() + 1) + '/' + currentDate.getFullYear();
  return formatted;
}



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

const [exportedData, setExportedData] = useState([]);
  const fetchExportedData = async () => {
    const response = await fetch("/api/Export/bookedlist", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "get",
    });
    const data = await response.json();
    setExportedData(data.data);
  };
  useEffect(() => {
    fetchExportedData();
  }, []);

  const [userName, setUserName] = useState('');
useEffect(() => {
  const token = localStorage.getItem('token');
  const decoded = jwtDecode(token);
  const userName = decoded.username;
  setUserName(userName);
}, []);

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
      age: filters.age || "",
      PassportNumber: filters.PassportNumber || "",
      SponsorName: filters.SponsorName || "",
      OrderId: filters.OrderId || "",
      page: String(page),
      perPage: "10",
    });

    const response = await fetch(`/api/bookedlist?${queryParams}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "get",
    });

    const { data: res, totalPages: pages } = await response.json();
    console.log("Data:", res, "Total Pages:", pages);
    if (res && res.length > 0) {
      setData(res);
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


const fetchExportData =async()=>{

 const queryParams = new URLSearchParams({
      age: filters.age || "",
      PassportNumber: filters.PassportNumber || "",
      SponsorName: filters.SponsorName || "",
      OrderId: filters.OrderId || "",
      page: "1",
      perPage: "10000",
    });

    const response = await fetch(`/api/bookedlist?${queryParams}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "get",
    });
const data = await response.json();

return data.data

}
const exportToPDF = async () => {
 let exportData = []
  exportData =await fetchExportData();



  
  const doc = new jsPDF({ orientation: 'landscape' });
  const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
  const logoBuffer = await logo.arrayBuffer();
  const logoBytes = new Uint8Array(logoBuffer);
  const logoBase64 = Buffer.from(logoBytes).toString('base64');

  try {
    const response = await fetch('/fonts/Amiri-Regular.ttf');
    if (!response.ok) throw new Error('Failed to fetch font');
    const fontBuffer = await response.arrayBuffer();
    const fontBytes = new Uint8Array(fontBuffer);
    const fontBase64 = Buffer.from(fontBytes).toString('base64');

    doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.setFont('Amiri', 'normal');
  } catch (error) {
    console.error('Error loading Amiri font:', error);
    doc.setFont('helvetica', 'normal');
  }

  doc.setLanguage('ar');
  doc.setFontSize(18);

  // 🟢 توسيط الهيدر (العنوان)
  const pageWidth = doc.internal.pageSize.getWidth();
  const title = 'قائمة العاملات المحجوزة';
  const textWidth = doc.getTextWidth(title);
  const textX = (pageWidth - textWidth) / 2;
  doc.text(title, textX, 15);

  const tableColumn = [
    "المكتب",
    "نهاية الجواز",
    "بداية الجواز",
    "رقم جواز السفر",
    "اسم العميل",
    "الحالة الاجتماعية",
    "الجنسية",
    "رقم الجوال",
    "اسم العاملة",
    "رقم الطلب",
  ];

  const tableRows = exportData.map((row) => [
    row.HomeMaid?.office?.office || "-",
    getDate(row.HomeMaid?.PassportEnd) || "-",
    getDate(row.HomeMaid?.PassportStart) || "-",
    row.HomeMaid?.Passportnumber || "-",
    row?.client?.fullname || "-",
    row.HomeMaid?.maritalstatus || "-",
    row.HomeMaid?.office?.Country || "-",
    row.HomeMaid?.phone || "-",
    row.HomeMaid?.Name || "-",
    row.HomeMaid?.id || "-",
  ]);

  // 🟢 حساب عرض الجدول وتوسيطه
  const columnCount = tableColumn.length;
  const pageWidthInPoints = doc.internal.pageSize.getWidth(); // عرض الصفحة
  const margin = 10; // الهامش من الجانبين
  const tableWidth = pageWidthInPoints - 2 * margin; // عرض الجدول مع الهوامش
  const startX = (pageWidthInPoints - tableWidth) / 2; // نقطة البداية لتوسيط الجدول

  // 🟢 إعداد الجدول مع التوسيط
  (doc as any).autoTable({
    head: [tableColumn],
    body: tableRows,
    startX: startX, // توسيط الجدول أفقيًا
    tableWidth: tableWidth, // تحديد عرض الجدول
    margin: { top: 40, left: margin, right: margin }, // هامش علوي وجوانب
    styles: {
      font: 'Amiri',
      halign: 'center', // توسيط النص أفقيًا
      valign: 'middle', // توسيط النص عموديًا
      fontSize: 9,
      overflow: 'ellipsize',
      cellWidth: 'auto',
      cellPadding: 2, // إضافة حشوة داخلية للخلايا
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [26, 77, 79],
      textColor: [255, 255, 255],
      halign: 'center', // توسيط رأس الجدول أفقيًا
      valign: 'middle', // توسيط رأس الجدول عموديًا
      fontSize: 10,
    },
    columnStyles: {
      // يمكنك تخصيص أعمدة معينة إذا لزم الأمر
      0: { cellWidth: 'auto' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 'auto' },
      6: { cellWidth: 'auto' },
      7: { cellWidth: 'auto' },
      8: { cellWidth: 'auto' },
      9: { cellWidth: 'auto' },
    },




    didDrawPage: () => {
const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        doc.setFontSize(10);
        doc.setFont('Amiri', 'normal');

        // 👈 اسم المستخدم في اليسار
        doc.text(userName, 10, pageHeight - 10, { align: 'left' });

        // 🔢 رقم الصفحة في المنتصف
        const pageNumber = `صفحة ${doc.internal.getNumberOfPages()}`;
        doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });

 doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);


        // 👉 التاريخ والوقت في اليمين
        const dateText =
          "التاريخ: " +
          new Date().toLocaleDateString('ar-EG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }) +
          "  الساعة: " +
          new Date().toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
          });
        doc.text(dateText, pageWidth - 10, pageHeight - 10, { align: 'right' });    },
  });

  doc.save('قائمة_العاملات_المحجوزة.pdf');
};


  const exportToExcel =async () => {
 
    let exportdata = []
exportdata = await fetchExportData()
    const worksheetData = exportdata?.map((row) => ({
      "رقم العاملة": row.HomeMaid?.id || "-",
      "اسم العاملة": row.HomeMaid?.Name || "-",
      "جوال  العاملة" : row.HomeMaid?.phone || "-",
      "الجنسية": row.HomeMaid?.office?.Country || "-",
      "الحالة الاجتماعية": row.HomeMaid?.maritalstatus || "-",
      "اسم العميل": row?.client?.fullname || "-",
      "رقم الجواز": row.HomeMaid?.Passportnumber || "-",
      "بداية الجواز": getDate(row.HomeMaid?.PassportStart) || "-",
      "نهاية الجواز": getDate(row.HomeMaid?.PassportEnd) || "-",
      "المكتب": row.HomeMaid?.office?.office || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "العاملات_المحجوزة");
    XLSX.writeFile(workbook, "قائمة_العاملات_المحجوزة.xlsx");
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
                قائمة العاملات المحجوزة
              </h1>

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
                  onClick={exportToExcel}
                >
                  <FaFileExcel className="text-white" />
                  <span className="text-white">Excel</span>
                </button>
                <button
                  onClick={exportToPDF}
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
                  <th className="px-4 py-2 text-center">اسم العميل</th>
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
                        onClick={() => router.push("/admin/homemaidinfo?id=" + item.HomeMaid?.id)}
                        className="px-4 py-2 text-lg text-center text-teal-800 cursor-pointer hover:underline"
                      >
                        {item.HomeMaid?.id}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600">
                        {item?.HomeMaid?.Name}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600">
                        {item?.HomeMaid?.phone}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600">
                        {item?.HomeMaid?.office?.Country}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600">
                        {item?.HomeMaid?.maritalstatus}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600">
                        {item?.client?.fullname}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600">
                        {item?.HomeMaid?.Passportnumber}
                      </td>
                      <td className="px-4  py-2 text-center text-gray-600">
                        {getDate(item?.HomeMaid?.PassportStart)}
                      </td>
                      <td className="px-4  py-2 text-center text-gray-600">
                        {getDate(item?.HomeMaid?.PassportEnd)}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600">
                        {item?.HomeMaid?.office?.office}
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
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-800"
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
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-800"
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
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-800"
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
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-800"
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
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-800"
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
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-800"
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
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-800"
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
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-800"
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
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-800"
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
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-800"
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
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-800"
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
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-800"
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
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-800"
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
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-800"
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
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-800"
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

    const hasPermission = findUser && findUser.role?.permissions?.["إدارة العاملات"]?.["عرض"];

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