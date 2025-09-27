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
import ColumnSelector from '../../components/ColumnSelector';

// Bind modal to app element for accessibility
Modal.setAppElement("#__next");

export default function Table() {
  const [filters, setFilters] = useState({
    SponsorName: "",
    age: "",
    nationality: "",
  });
  const [activeTab, setActiveTab] = useState<'recruitment' | 'rental'>('recruitment');
  const [tabCounts, setTabCounts] = useState({ recruitment: 0, rental: 0 });
  function getDate(date: any) {
    const currentDate = new Date(date); // Original date
    // currentDate.setDate(currentDate.getDate() + 90); // Add 90 days
    const form = currentDate.toISOString().split("T")[0];
    console.log(currentDate);
    return form;
  }

  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    Name: true,
    phone: true,
    Country: true,
    maritalstatus: true,
    dateofbirth: true,
    Passportnumber: true,
    PassportStart: true,
    PassportEnd: true,
    office: true,
  });


  // Column definitions for the reusable component
  const columnDefinitions = [
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
  const [nationalities, setNationalities] = useState<any[]>([]);

  const fetchData = async (page = 1) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        age: filters.age,
        SponsorName: filters.SponsorName,
        nationality: filters.nationality,
        page: String(page),
        perPage: "10",
        contractType: activeTab, // Add contract type filter
      });

      const response = await fetch(`/api/fulllist?${queryParams}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "get",
      });

      const { data: res, totalPages: pages, recruitmentCount, rentalCount } = await response.json();
      if (res && res.length > 0) {
        setData(res);
        console.log("Data fetched successfully:", res);
        setTotalPages(pages || 1);
        // Update tab counts
        setTabCounts({
          recruitment: recruitmentCount || 0,
          rental: rentalCount || 0,
        });
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
      // Include contract type filter for export
      const queryParams = new URLSearchParams({
        page: "1",
        perPage: "10000", // Get all data for export - increased limit
        contractType: activeTab, // Filter by active tab
      });

      const response = await fetch(`/api/fulllist?${queryParams}`, {
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
  }, [currentPage, filters, activeTab]);

  // Fetch nationalities on component mount
  useEffect(() => {
    const fetchNationalities = async () => {
      try {
        const response = await fetch('/api/nationalities');
        const data = await response.json();
        if (data.success) {
          setNationalities(data.nationalities);
        }
      } catch (error) {
        console.error('Error fetching nationalities:', error);
      }
    };
    fetchNationalities();
  }, []);


  const handleFilterChange = (e: any, column: string) => {
    const value = e.target.value;
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
      SponsorName: "",
      nationality: "",
    });
    setCurrentPage(1);
    setData([]);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const toggleColumn = (column: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column as keyof typeof prev],
    }));
  };

  const handleSetVisibleColumns = (columns: { [key: string]: boolean }) => {
    setVisibleColumns(columns as any);
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

  const exportToPDF = async () => {
    try {
      setExportMessage('جاري تحميل جميع البيانات للتصدير...');
      setExportType('loading');
      setShowExportModal(true);
      
      const exportData = await fetchExportData();
      console.log('Export data for PDF:', exportData);
      const doc = new jsPDF();
      
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
      
      doc.setLanguage('ar');
      doc.setFontSize(12);
      const title = activeTab === 'recruitment' ? 'قائمة عاملات الاستقدام' : 'قائمة عاملات التأجير';
      doc.text(title, 200, 10, { align: 'right' });
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
      ];
      const tableRows = exportData.map(row => [
        row.id || 'غير متوفر',
        row.Name || 'غير متوفر',
        row.phone || 'غير متوفر',
        row?.office?.Country || 'غير متوفر',
        row.maritalstatus || 'غير متوفر',
        row.dateofbirth || 'غير متوفر',
        row.Passportnumber || 'غير متوفر',
        row.PassportStart ? getDate(row.PassportStart) : 'غير متوفر',
        row.PassportEnd ? getDate(row.PassportEnd) : 'غير متوفر',
        row?.office?.office || 'غير متوفر',
      ]);
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        styles: {
          font: 'Amiri',
          halign: 'right',
          fontSize: 10,
          cellPadding: 2,
          textColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [0, 105, 92],
          textColor: [255, 255, 255],
          halign: 'right',
        },
        margin: { top: 20, right: 10, left: 10 },
        didParseCell: (data: any) => {
          data.cell.styles.halign = 'right';
        },
      });
      const filename = activeTab === 'recruitment' ? 'recruitment_workers_list.pdf' : 'rental_workers_list.pdf';
      doc.save(filename);
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
      const worksheetTitle = activeTab === 'recruitment' ? 'قائمة عاملات الاستقدام' : 'قائمة عاملات التأجير';
      const worksheet = workbook.addWorksheet(worksheetTitle, { properties: { defaultColWidth: 20 } });
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
          age: row.dateofbirth || 'غير متوفر',
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
      const filename = activeTab === 'recruitment' ? 'recruitment_workers_list.xlsx' : 'rental_workers_list.xlsx';
      a.download = filename;
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
      <div className={`container mx-auto p-4 ${Style["almarai-regular"]} min-h-screen`}>
        <div className="space-y-4">
          <div className="shadow-lg rounded-lg border border-gray-200">
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

            {/* Tab Navigation */}
            <div className="flex gap-4 mb-6 border-b border-gray-300 px-4">
              <div className={`flex items-center gap-2 pb-3 cursor-pointer transition-all duration-200 ${activeTab === 'recruitment' ? 'border-b-2 border-teal-700' : ''}`} onClick={() => setActiveTab('recruitment')}>
                <span className={`text-sm w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
                  activeTab === 'recruitment' 
                    ? 'bg-teal-800 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {tabCounts.recruitment}
                </span>
                <span className={`text-base transition-colors duration-200 ${
                  activeTab === 'recruitment' 
                    ? 'text-teal-700 font-medium' 
                    : 'text-gray-500'
                }`}>
                  عاملات الاستقدام
                </span>
              </div>
              <div className={`flex items-center gap-2 pb-3 cursor-pointer transition-all duration-200 ${activeTab === 'rental' ? 'border-b-2 border-teal-700' : ''}`} onClick={() => setActiveTab('rental')}>
                <span className={`text-sm w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
                  activeTab === 'rental' 
                    ? 'bg-teal-800 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {tabCounts.rental}
                </span>
                <span className={`text-base transition-colors duration-200 ${
                  activeTab === 'rental' 
                    ? 'text-teal-700 font-medium' 
                    : 'text-gray-500'
                }`}>
                  عاملات التأجير
                </span>
              </div>
            </div>

            <div className="flex flex-col  p-4">
              <div className="flex flex-row flex-nowrap  items-center gap-3">
                <div className="relative  max-w-md">
                  <input
                    type="text"
                    value={filters.SponsorName}
                    onChange={(e) => handleFilterChange(e, "SponsorName")}
                    placeholder="بحث بالاسم"
                    className="p-2  border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <div className="relative w-[280px] max-w-md">
                  <select
                    value={filters.nationality}
                    onChange={(e) => handleFilterChange(e, "nationality")}
                    className="p-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">جميع الجنسيات</option>
                    {nationalities.map((nationality) => (
                      <option key={nationality.id} value={nationality.Country}>
                        {nationality.Country}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative z-50">
                  <ColumnSelector
                    visibleColumns={visibleColumns}
                    setVisibleColumns={handleSetVisibleColumns}
                    columns={columnDefinitions}
                    buttonText="الأعمدة"
                    buttonStyle="bg-white justify-between py-2 px-4 rounded-lg border border-gray-200 flex items-center gap-1 text-gray hover:bg-gray-50 transition-colors"
                  />
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

            <div className="overflow-x-auto border-t border-gray-200">
              <table className="min-w-full text-md text-left">
                <thead className="bg-teal-800 sticky top-0 z-10">
                  <tr className="text-white">
                    {visibleColumns.id && <th className="px-4 py-2 text-center">الرقم</th>}
                    {visibleColumns.Name && <th className="px-4 py-2 text-center">الاسم</th>}
                    {visibleColumns.phone && <th className="px-4 py-2 text-center">رقم الجوال</th>}
                    {visibleColumns.Country && <th className="px-4 py-2 text-center">الجنسية</th>}
                    {visibleColumns.maritalstatus && <th className="px-4 py-2 text-center">الحالة الاجتماعية</th>}
                    {visibleColumns.dateofbirth && <th className="px-4 py-2 text-center">العمر</th>}
                    {visibleColumns.Passportnumber && <th className="px-4 py-2 text-center">رقم جواز السفر</th>}
                    {visibleColumns.PassportStart && <th className="px-4 py-2 text-center">بداية الجواز</th>}
                    {visibleColumns.PassportEnd && <th className="px-4 py-2 text-center">نهاية الجواز</th>}
                    {visibleColumns.office && <th className="px-4 py-2 text-center">المكتب</th>}
                  </tr>
                </thead>
                <tbody className="bg-gray-50">
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={Object.values(visibleColumns).filter(Boolean).length}
                      className="px-4 py-2 text-center text-gray-500"
                    >
                      لا توجد نتائج
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      {visibleColumns.id && (
                        <td
                          onClick={() => router.push("./neworder/" + item.homemaidId)}
                          className="px-4 py-2 text-lg text-center text-teal-800 cursor-pointer hover:underline"
                        >
                          {item.id}
                        </td>
                      )}
                      {visibleColumns.Name && (
                        <td className="px-4 py-2 text-center text-gray-600">
                          {item.Name}
                        </td>
                      )}
                      {visibleColumns.phone && (
                        <td className="px-4 py-2 text-center text-gray-600">
                          {item.phone}
                        </td>
                      )}
                      {visibleColumns.Country && (
                        <td className="px-4 py-2 text-center text-gray-600">
                          {item?.office?.Country}
                        </td>
                      )}
                      {visibleColumns.maritalstatus && (
                        <td className="px-4 py-2 text-center text-gray-600">
                          {item.maritalstatus}
                        </td>
                      )}
                      {visibleColumns.dateofbirth && (
                        <td className="px-4 py-2 text-center text-gray-600">
                          {item.dateofbirth}
                        </td>
                      )}
                      {visibleColumns.Passportnumber && (
                        <td className="px-4 py-2 text-center text-gray-600">
                          {item.Passportnumber}
                        </td>
                      )}
                      {visibleColumns.PassportStart && (
                        <td className="px-4 py-2 text-center text-gray-600">
                          {item.PassportStart ? getDate(item.PassportStart) : ""}
                        </td>
                      )}
                      {visibleColumns.PassportEnd && (
                        <td className="px-4 py-2 text-center text-gray-600">
                          {item.PassportEnd ? getDate(item.PassportEnd) : ""}
                        </td>
                      )}
                      {visibleColumns.office && (
                        <td className="px-4 py-2 text-center text-gray-600">
                          {item?.office?.office}
                        </td>
                      )}
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-200 p-4 bg-gray-50">
              {totalPages > 1 && renderPagination()}
              {loading && (
                <div className="flex justify-center mt-4">
                  <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-t-transparent border-teal-800 rounded-full"></div>
                </div>
              )}
            </div>
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
                  <label className="text-md font-medium text-gray-700 mb-1">
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
                  <label className="text-md font-medium text-gray-700 mb-1">
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
                  <label className="text-md font-medium text-gray-700 mb-1">
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
                  <label className="text-md font-medium text-gray-700 mb-1">
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
                  <label className="text-md font-medium text-gray-700 mb-1">
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
                  <label className="text-md font-medium text-gray-700 mb-1">
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
                  <label className="text-md font-medium text-gray-700 mb-1">
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
                  <label className="text-md font-medium text-gray-700 mb-1">
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
                  <label className="text-md font-medium text-gray-700 mb-1">
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
                  <label className="text-md font-medium text-gray-700 mb-1">
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
                  <label className="text-md font-medium text-gray-700 mb-1">
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
                  <label className="text-md font-medium text-gray-700 mb-1">
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
                  <label className="text-md font-medium text-gray-700 mb-1">
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
                  <label className="text-md font-medium text-gray-700 mb-1">
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
                  <label className="text-md font-medium text-gray-700 mb-1">
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