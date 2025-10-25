import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "example/containers/Layout";
import Style from "styles/Home.module.css";
import { FaSearch, FaRedo, FaFileExcel, FaFilePdf } from "react-icons/fa";
import { ArrowLeftIcon } from "@heroicons/react/outline";
import { PlusOutlined } from "@ant-design/icons";
import Modal from "react-modal";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { jwtDecode } from "jwt-decode";
// Bind modal to app element for accessibility
Modal.setAppElement("#__next");

export default function Table() {
  const [filters, setFilters] = useState({
    Name: "",
    age: "",
    PassportNumber: "",
  });
  function getDate(date: any) {
    const currentDate = new Date(date); // Original date
    // currentDate.setDate(currentDate.getDate() + 90); // Add 90 days
    const form = currentDate.toISOString().split("T")[0];
    console.log(currentDate);
    return form;
  }

  function calculateAge(birthDate: any) {
    if (!birthDate) return 'غير محدد';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  function formatBirthDate(birthDate: any) {
    if (!birthDate) return 'غير محدد';
    const birth = new Date(birthDate);
    return birth.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Column selector state
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'id',
    'Name',
    'phone',
    'Country',
    'maritalstatus',
    'dateofbirth',
    'Passportnumber',
    'PassportStart',
    'PassportEnd',
    'office',
  ]);


  const [isStep1ModalOpen, setIsStep1ModalOpen] = useState(false);
  const [isStep2ModalOpen, setIsStep2ModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    Name: "",
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
    Nationality: "",
    GuaranteeStatus: "",
    reason: "",
    ArrivalDate: "",
  });


  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const isFetchingRef = useRef(false);
  const [exportedData, setExportedData] = useState<any[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [exportType, setExportType] = useState("");

  const fetchData = async (page = 1) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        Name: filters.Name,
        SponsorName: filters.Name, // Also send as SponsorName for API compatibility
        age: filters.age,
        PassportNumber: filters.PassportNumber,
        page: String(page),
        perPage: "10",
      });
      
      console.log('Fetching data with filters:', filters);
      console.log('Query params:', queryParams.toString());

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

  const fetchExportData = async () => {
    try {
      // Remove all filters to get ALL data for export
      const queryParams = new URLSearchParams({
        page: "1",
        perPage: "10000", // Get all data for export - increased limit
      });

      const response = await fetch(`/api/homemaidprisma?${queryParams}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "get",
      });

      const { data: res } = await response.json();
      console.log('API response (ALL DATA):', res);
      const exportData = Array.isArray(res) ? res : [];
      console.log('Processed export data (ALL DATA):', exportData);
      setExportedData(exportData);
      return exportData;
    } catch (error) {
      console.error("Error fetching export data:", error);
      setExportedData([]);
      return [];
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, filters]);


  const handleFilterChange = (e: any, column: string) => {
    const value = e.target.value;
    console.log('Filter change:', column, value);
    setFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
    setCurrentPage(1);
  };

  const router = useRouter();
  const handleUpdate = (id: any) => {
    router.push("./neworder/" + id);
  };

  const resetFilters = () => {
    isFetchingRef.current = false;
    setFilters({
      age: "",
      PassportNumber: "",
      Name: "",
    });
    setCurrentPage(1);
    setData([]);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
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
      Name: "",
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
      Nationality: "",
      GuaranteeStatus: "",
      reason: "",
      ArrivalDate: "",
    });
  };

  const closeStep1Modal = () => setIsStep1ModalOpen(false);
  const openStep2Modal = () => {
    closeStep1Modal();
    setIsStep2ModalOpen(true);
  };
  const closeStep2Modal = () => setIsStep2ModalOpen(false);

  const handleStep1Submit = (e: any) => {
    e.preventDefault();
    openStep2Modal();
  };

  const handleStep2Submit = async (e: any) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      const value = (formData as any)[key];
      if (key === "additionalfiles") {
        if (Array.isArray(value)) {
          value.forEach((file, index) => {
            data.append(`additionalfiles[${index}]`, file);
          });
        }
      } else if (value instanceof File) {
        data.append(key, value);
      } else {
        data.append(key, String(value));
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

  const handleFormChange = (e: any) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleMultipleFilesChange = (e: any) => {
    const { name, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: Array.from(files),
    }));
  };

  // Column Selector Component
  const ColumnSelector = ({
    visibleColumns,
    setVisibleColumns,
  }: {
    visibleColumns: string[];
    setVisibleColumns: (columns: string[]) => void;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const columns = [
      { key: 'id', label: 'الرقم' },
      { key: 'Name', label: 'الاسم' },
      { key: 'phone', label: 'رقم الجوال' },
      { key: 'Country', label: 'الجنسية' },
      { key: 'maritalstatus', label: 'الحالة الاجتماعية' },
      { key: 'dateofbirth', label: 'العمر' },
      { key: 'Passportnumber', label: 'رقم جواز السفر' },
      { key: 'PassportStart', label: 'بداية الجواز' },
      { key: 'PassportEnd', label: 'نهاية الجواز' },
      { key: 'office', label: 'المكتب' },
    ];

    const toggleColumn = (columnKey: string) => {
      if (visibleColumns.includes(columnKey)) {
        setVisibleColumns(visibleColumns.filter((col) => col !== columnKey));
      } else {
        setVisibleColumns([...visibleColumns, columnKey]);
      }
    };

    return (
      <div className="relative">
        <button
          className="bg-gray-400 px-3 cursor-pointer py-2 h-10 items-center align-baseline text-white rounded-md flex items-center gap-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          اختر الأعمدة
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
            {columns.map((column) => (
              <label key={column.key} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(column.key)}
                  onChange={() => toggleColumn(column.key)}
                  className="form-checkbox h-4 w-4 text-teal-900"
                />
                {column.label}
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };
const [userName, setUserName] = useState('');
useEffect(() => {
  const token = localStorage.getItem('token');
  const decoded = jwtDecode(token);
  const userName = decoded.username;
  setUserName(userName);
}, []);
const exportToPDF = async () => {
  //image logo
    const doc = new jsPDF({ orientation: 'landscape' }); // 🔄 جعلها عرضية لو تحب
    const pageWidth = doc.internal.pageSize.width;
  const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
  const logoBuffer = await logo.arrayBuffer();
  const logoBytes = new Uint8Array(logoBuffer);
  const logoBase64 = Buffer.from(logoBytes).toString('base64');
  doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);
  try {
    setExportMessage('جاري تحميل جميع البيانات للتصدير...');
    setExportType('loading');
    setShowExportModal(true);

    const exportData = await fetchExportData();
    console.log('Export data for PDF:', exportData);

    // 🖋️ تحميل الخط العربي Amiri
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
      setExportMessage('خطأ في تحميل الخط العربي');
      setExportType('error');
      return;
    }

    // 🏷️ العنوان
    doc.setLanguage('ar');
    doc.setFontSize(16);
    doc.text('قائمة العاملات', 150, 20, { align: 'right' });

    // 📋 الأعمدة (معكوسة للاتجاه العربي)
    const tableColumn = [
      'الرقم',
      'الاسم',
      'رقم الجوال',
      'الجنسية',
      'الحالة الاجتماعية',
      'العمر',
      'رقم جواز السفر',
      'بداية الجواز',
      'نهاية الجواز',
      'المكتب',
    ].reverse(); // ✅ عكس ترتيب الأعمدة
//hidden id column
    // 📊 الصفوف (معكوسة بنفس الترتيب)
    const tableRows = exportData.map(row =>
      [
        row.id || 'غير متوفر',
        row.Name || 'غير متوفر',
        row.phone || 'غير متوفر',
        row?.office?.Country || 'غير متوفر',
        row.maritalstatus || 'غير متوفر',
        row.dateofbirth ? `${calculateAge(row.dateofbirth)} سنة` : 'غير متوفر',
        row.Passportnumber || 'غير متوفر',
        row.PassportStart ? getDate(row.PassportStart) : 'غير متوفر',
        row.PassportEnd ? getDate(row.PassportEnd) : 'غير متوفر',
        row?.office?.office || 'غير متوفر',
      ].reverse() // ✅ عكس القيم داخل كل صف
    );

    // 📄 الجدول مع إعداد الاتجاه والفوتر
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      styles: {
        font: 'Amiri',
        halign: 'center',
        fontSize: 10,
        cellPadding: 2,
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [26, 77, 79],
        textColor: [255, 255, 255],
        halign: 'center',
      },

      columnStyles: {
        0: { cellWidth: 'auto', overflow: 'hidden' },
        1: { cellWidth: 'auto', overflow: 'hidden ' },
        2: { cellWidth: 'auto', overflow: 'hidden' },
        3: { cellWidth: 'auto', overflow: 'hidden' },
        4: { cellWidth: 'auto', overflow: 'hidden' },
        5: { cellWidth: 'auto', overflow: 'hidden' },
        6: { cellWidth: 'auto', overflow: 'hidden' },
        7: { cellWidth: 'auto', overflow: 'hidden' },
        8: { cellWidth: 'auto', overflow: 'hidden' },
        9: { cellWidth: 'auto', overflow: 'hidden' },
        10: { cellWidth: 'auto', overflow: 'hidden' },
      },


      margin: { top: 45, right: 10, left: 10 },
      direction: 'rtl', // ✅ مهم جدًا لعرض الجدول من اليمين لليسار
      didParseCell: (data) => {
        data.cell.styles.halign = 'center';
      },

      // ⚙️ فوتر في كل صفحة
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
        doc.text(dateText, pageWidth - 10, pageHeight - 10, { align: 'right' });
      },
    });

    // 💾 حفظ الملف
    doc.save('قائمة_العاملات.pdf');

    setExportMessage(`تم تصدير ${exportData.length} سجل بنجاح إلى PDF`);
    setExportType('success');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    setExportMessage('حدث خطأ أثناء تصدير PDF');
    setExportType('error');
  }
};

  const exportToExcel = async () => {
    try {
      setExportMessage('جاري تحميل جميع البيانات للتصدير...');
      setExportType('loading');
      setShowExportModal(true);
      
      const exportData = await fetchExportData();
      console.log('Export data for Excel:', exportData);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('قائمة العاملات', { properties: { defaultColWidth: 20 } });
      worksheet.columns = [
        { header: 'الرقم', key: 'id', width: 15 },
        { header: 'الاسم', key: 'name', width: 20 },
        { header: 'رقم الجوال', key: 'phone', width: 15 },
        { header: 'الجنسية', key: 'nationality', width: 15 },
        { header: 'الحالة الاجتماعية', key: 'maritalStatus', width: 20 },
        { header: 'العمر', key: 'age', width: 10 },
        { header: 'رقم جواز السفر', key: 'passport', width: 15 },
        { header: 'بداية الجواز', key: 'passportStart', width: 15 },
        { header: 'نهاية الجواز', key: 'passportEnd', width: 15 },
        { header: 'المكتب', key: 'office', width: 15 },
      ];
      worksheet.getRow(1).font = { name: 'Amiri', size: 12 };
      worksheet.getRow(1).alignment = { horizontal: 'right' };
      exportData.forEach(row => {
        worksheet.addRow({
          id: row.id || 'غير متوفر',
          name: row.Name || 'غير متوفر',
          phone: row.phone || 'غير متوفر',
          nationality: row?.office?.Country || 'غير متوفر',
          maritalStatus: row.maritalstatus || 'غير متوفر',
          age: row.dateofbirth ? `${calculateAge(row.dateofbirth)} سنة` : 'غير متوفر',
          passport: row.Passportnumber || 'غير متوفر',
          passportStart: row.PassportStart ? getDate(row.PassportStart) : 'غير متوفر',
          passportEnd: row.PassportEnd ? getDate(row.PassportEnd) : 'غير متوفر',
          office: row?.office?.office || 'غير متوفر',
        }).alignment = { horizontal: 'right' };
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'homemaids_list.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      setExportMessage(`تم تصدير ${exportData.length} سجل بنجاح إلى Excel`);
      setExportType('success');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      setExportMessage('حدث خطأ أثناء تصدير Excel');
      setExportType('error');
    }
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

            <div className="flex flex-col  p-4">
              <div className="flex flex-row flex-nowrap  items-center gap-3">
                <div className="relative  max-w-md">
                  <input
                    type="text"
                    value={filters.Name}
                    onChange={(e) => handleFilterChange(e, "Name")}
                    placeholder="بحث "
                    className="p-2  border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <ColumnSelector visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns} />
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
                  onClick={exportToExcel}
                  className="bg-teal-800 my-2 py-1 px-3 rounded-lg flex items-center gap-1 hover:bg-teal-900"
                  title="تصدير إلى Excel"
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

            <table className="min-w-full text-md text-left min-h-96">
              <thead className="bg-teal-800">
                <tr className="text-white">
                  {visibleColumns.includes('id') && <th className="px-4 py-2 text-center">الرقم</th>}
                  {visibleColumns.includes('Name') && <th className="px-4 py-2 text-center">الاسم</th>}
                  {visibleColumns.includes('phone') && <th className="px-4 py-2 text-center">رقم الجوال</th>}
                  {visibleColumns.includes('Country') && <th className="px-4 py-2 text-center">الجنسية</th>}
                  {visibleColumns.includes('maritalstatus') && <th className="px-4 py-2 text-center">الحالة الاجتماعية</th>}
                  {visibleColumns.includes('dateofbirth') && <th className="px-4 py-2 text-center">العمر</th>}
                  {visibleColumns.includes('Passportnumber') && <th className="px-4 py-2 text-center">رقم جواز السفر</th>}
                  {visibleColumns.includes('PassportStart') && <th className="px-4 py-2 text-center">بداية الجواز</th>}
                  {visibleColumns.includes('PassportEnd') && <th className="px-4 py-2 text-center">نهاية الجواز</th>}
                  {visibleColumns.includes('office') && <th className="px-4 py-2 text-center">المكتب</th>}
                </tr>
              </thead>
              <tbody className="bg-gray-50">
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumns.length}
                      className="px-4 py-2 text-center text-gray-500"
                    >
                      لا توجد نتائج
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      {visibleColumns.includes('id') && (
                        <td
                          onClick={() => router.push("/admin/homemaidinfo?id=" + item.id)}
                          className="px-4 py-2 text-lg text-center text-teal-800 cursor-pointer hover:underline"
                        >
                          {item.id}
                        </td>
                      )}
                      {visibleColumns.includes('Name') && (
                        <td className="px-4 py-2 text-center text-gray-600">
                          {item.Name}
                        </td>
                      )}
                      {visibleColumns.includes('phone') && (
                        <td className="px-4 py-2 text-center text-gray-600">
                          {item.phone}
                        </td>
                      )}
                      {visibleColumns.includes('Country') && (
                        <td className="px-4 py-2 text-center text-gray-600">
                          {item?.office?.Country}
                        </td>
                      )}
                      {visibleColumns.includes('maritalstatus') && (
                        <td className="px-4 py-2 text-center text-gray-600">
                          {item.maritalstatus}
                        </td>
                      )}
                      {visibleColumns.includes('dateofbirth') && (
                        <td 
                          className="px-4 py-2 text-center text-gray-600 cursor-help" 
                          title={`تاريخ الميلاد: ${formatBirthDate(item.dateofbirth)}`}
                        >
                          {calculateAge(item.dateofbirth)} سنة
                        </td>
                      )}
                      {visibleColumns.includes('Passportnumber') && (
                        <td className="px-4 py-2 text-center text-gray-600">
                          {item.Passportnumber}
                        </td>
                      )}
                      {visibleColumns.includes('PassportStart') && (
                        <td className="px-4 py-2 text-center text-gray-600">
                          {item.PassportStart ? getDate(item.PassportStart) : ""}
                        </td>
                      )}
                      {visibleColumns.includes('PassportEnd') && (
                        <td className="px-4 py-2 text-center text-gray-600">
                          {item.PassportEnd ? getDate(item.PassportEnd) : ""}
                        </td>
                      )}
                      {visibleColumns.includes('office') && (
                        <td className="px-4 py-2 text-center text-gray-600">
                          {item?.office?.office}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 && renderPagination()}
            {loading && (
 <div className="flex justify-center mt-4 w-full h-16">               <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-t-transparent border-teal-800 rounded-full"></div>
              </div>
            )}
          </div>
        </div>

    

        {/* Export Modal */}
        <Modal
          isOpen={showExportModal}
          onRequestClose={() => setShowExportModal(false)}
          style={customModalStyles}
          contentLabel="حالة التصدير"
          shouldFocusAfterRender={true}
          shouldCloseOnOverlayClick={false}
        >
          <div className="relative text-center">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-0 right-0 text-gray-500 hover:text-gray-700"
              aria-label="إغلاق"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {exportType === 'loading' && (
              <div className="py-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-800 mx-auto mb-4"></div>
                <h2 className={`text-xl font-bold text-teal-800 mb-2 ${Style["almarai-bold"]}`}>
                  جاري التصدير...
                </h2>
                <p className={`text-gray-600 ${Style["almarai-regular"]}`}>
                  {exportMessage}
                </p>
              </div>
            )}

            {exportType === 'success' && (
              <div className="py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h2 className={`text-xl font-bold text-green-800 mb-2 ${Style["almarai-bold"]}`}>
                  تم التصدير بنجاح!
                </h2>
                <p className={`text-gray-600 mb-6 ${Style["almarai-regular"]}`}>
                  {exportMessage}
                </p>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="bg-teal-800 text-white px-6 py-2 rounded-lg hover:bg-teal-900 transition-colors"
                >
                  موافق
                </button>
              </div>
            )}

            {exportType === 'error' && (
              <div className="py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
                <h2 className={`text-xl font-bold text-red-800 mb-2 ${Style["almarai-bold"]}`}>
                  حدث خطأ!
                </h2>
                <p className={`text-gray-600 mb-6 ${Style["almarai-regular"]}`}>
                  {exportMessage}
                </p>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  موافق
                </button>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </Layout>
  );
}