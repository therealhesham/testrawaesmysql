import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import axios from 'axios';
import Style from "styles/Home.module.css";
import Layout from 'example/containers/Layout';
import { ArrowDown, Plus, Search, X } from 'lucide-react';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import Select from 'react-select';
import { MoreHorizontal } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';

export default function Dashboard({ hasPermission }) {
  const [activePopup, setActivePopup] = useState(null);
  const [newOrders, setNewOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [homemaids, setHomemaids] = useState([]);
  const [offices, setOffices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);
  const [formData, setFormData] = useState({
    searchTerm: '',
  });
  const [ageFilter, setAgeFilter] = useState("");
  const [nationalityFilter, setNationalityFilter] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(!hasPermission);
  const [menuPosition, setMenuPosition] = useState(null);
  const [detailsRow, setDetailsRow] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [exportedData, setExportedData] = useState([]);

  const router = useRouter();

  const handleOpenMenu = (e, rowIndex) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      x: rect.right - 160,
      y: rect.bottom + 5,
      row: rowIndex,
    });
  };

  const openPopup = (popupId) => setActivePopup(popupId);
  const closePopup = () => {
    setActivePopup(null);
    setMenuPosition(null);
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setModalMessage("");
  };

  const closePermissionModal = () => {
    setShowPermissionModal(false);
    router.push('/admin/home');
  };

  const confirmAccept = async (id) => {
    try {
      const confirmRequest = await axios.post('/api/confirmrequest', { id });
      if (confirmRequest.status === 200) {
        setModalMessage('تم قبول الطلب');
        setShowSuccessModal(true);
        newOrdersList();
      }
    } catch (error) {
      setModalMessage('حدث خطأ أثناء قبول الطلب');
      setShowErrorModal(true);
    }
    closePopup();
  };

  const confirmReject = async (id) => {
    try {
      const rejectRequest = await axios.post('/api/rejectbookingprisma', { id });
      if (rejectRequest.status === 200) {
        setModalMessage('تم رفض الطلب');
        setShowSuccessModal(true);
        router.push("/admin/rejectedorders");
      }
    } catch (error) {
      setModalMessage('حدث خطأ أثناء رفض الطلب');
      setShowErrorModal(true);
    }
    closePopup();
  };

  const handleOrderClick = (id) => {
    router.push(`/admin/track_order/${id}`);
  };

  const toggleDetails = (index) => {
    setDetailsRow(detailsRow === index ? null : index);
  };

  const calculateAge = (dateofbirth) => {
    if (!dateofbirth) return "غير متوفر";
    const birthDate = new Date(dateofbirth);
    const currentDate = new Date();
    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = currentDate.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const newExportOrdersList = async () => {
    setIsLoading(true);
    try {
      const fetchNewOrders = await axios.get("/api/Export/neworders");
      setExportedData(Array.isArray(fetchNewOrders.data.homemaids) ? fetchNewOrders.data.homemaids : []);
    } catch (error) {
      console.error("Error fetching new orders:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const newOrdersList = async (page = 1) => {
    setIsLoading(true);
    try {
      const fetchNewOrders = await axios.get("/api/newordersprismatest", {
        params: {
          searchTerm: formData.searchTerm || "",
          age: ageFilter,
          Country: nationalityFilter,
          page,
        },
      });
      setNewOrders(Array.isArray(fetchNewOrders.data.homemaids) ? fetchNewOrders.data.homemaids : []);
      setTotalCount(fetchNewOrders.data.totalCount || 0);
      setCurrentPage(fetchNewOrders.data.page || 1);
    } catch (error) {
      console.error("Error fetching new orders:", error.response?.data || error.message);
      setNewOrders([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get("/api/autocomplete/clients");
      setClients(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchHomemaids = async () => {
    try {
      const response = await axios.get("/api/autocomplete/homemaids");
      setHomemaids(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching homemaids:', error);
    }
  };

  const fetchOffices = async () => {
    try {
      const response = await axios.get("/api/offices");
      setOffices(Array.isArray(response.data.countriesfinder) ? response.data.countriesfinder : []);
    } catch (error) {
      console.error('Error fetching offices:', error);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, searchTerm: value }));
    setCurrentPage(1);
  };

  const handleAgeFilterChange = (selectedOption) => {
    setAgeFilter(selectedOption ? selectedOption.value : "");
    setCurrentPage(1);
  };

  const handleNationalityFilterChange = (selectedOption) => {
    setNationalityFilter(selectedOption ? selectedOption.value : "");
    setCurrentPage(1);
  };

  const exportToPDF = async () => {
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
      setModalMessage('خطأ في تحميل الخط العربي');
      setShowErrorModal(true);
      return;
    }
    doc.setLanguage('ar');
    doc.setFontSize(12);
    doc.text('الطلبات الجديدة', 200, 10, { align: 'right' });
    const tableColumn = [
      'رقم الطلب',
      'اسم العميل',
      'رقم العميل',
      'هوية العميل',
      'رقم العاملة',
      'اسم العاملة',
      'الجنسية',
      'جواز السفر',
      'العمر',
    ];
    const tableRows = exportedData.map(row => [
      row.id || 'غير متوفر',
      row.client?.fullname || 'غير متوفر',
      row.client?.phonenumber || 'غير متوفر',
      row.client?.nationalId || 'غير متوفر',
      row.HomeMaid?.id || 'غير متوفر',
      row.HomeMaid?.Name || 'غير متوفر',
      row.HomeMaid?.office?.Country || 'غير متوفر',
      row.Passportnumber || 'غير متوفر',
      row.HomeMaid?.age || calculateAge(row.HomeMaid?.dateofbirth),
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
      didParseCell: (data) => {
        data.cell.styles.halign = 'right';
      },
    });
    doc.save('new_orders.pdf');
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('الطلبات الجديدة', { properties: { defaultColWidth: 20 } });
    worksheet.columns = [
      { header: 'رقم الطلب', key: 'id', width: 15 },
      { header: 'اسم العميل', key: 'clientName', width: 20 },
      { header: 'رقم العميل', key: 'clientPhone', width: 15 },
      { header: 'هوية العميل', key: 'clientNationalId', width: 15 },
      { header: 'رقم العاملة', key: 'maidId', width: 15 },
      { header: 'اسم العاملة', key: 'maidName', width: 20 },
      { header: 'الجنسية', key: 'nationality', width: 15 },
      { header: 'جواز السفر', key: 'passport', width: 15 },
      { header: 'العمر', key: 'age', width: 10 },
    ];
    worksheet.getRow(1).font = { name: 'Amiri', size: 12 };
    worksheet.getRow(1).alignment = { horizontal: 'right' };
    exportedData.forEach(row => {
      worksheet.addRow({
        id: row.id || 'غير متوفر',
        clientName: row.client?.fullname || 'غير متوفر',
        clientPhone: row.client?.phonenumber || 'غير متوفر',
        clientNationalId: row.client?.nationalId || 'غير متوفر',
        maidId: row.HomeMaid?.id || 'غير متوفر',
        maidName: row.HomeMaid?.Name || 'غير متوفر',
        nationality: row.HomeMaid?.office?.Country || 'غير متوفر',
        passport: row.Passportnumber || 'غير متوفر',
        age: row.HomeMaid?.age || calculateAge(row.HomeMaid?.dateofbirth),
      }).alignment = { horizontal: 'right' };
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'new_orders.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchClients();
    fetchHomemaids();
    fetchOffices();
    newExportOrdersList();
  }, []);

  useEffect(() => {
    newOrdersList(currentPage);
  }, [currentPage, ageFilter, nationalityFilter, formData.searchTerm]);

  const clientOptions = clients.map(client => ({
    value: client.id,
    label: client.fullname,
  }));

  const ageOptions = [
    { value: "", label: "الكل" },
    { value: "20-30", label: "20-30 سنة" },
    { value: "31-40", label: "31-40 سنة" },
    { value: "41-50", label: "41-50 سنة" },
    { value: "51-60", label: "51-60 سنة" },
  ];

  const nationalityOptions = offices.map(office => ({
    value: office.Country,
    label: office.Country,
  }));

  const totalPages = Math.ceil(totalCount / pageSize);
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <a
          key={i}
          href="#"
          onClick={() => handlePageChange(i)}
          className={`px-2 py-1 border rounded text-sm ${
            i === currentPage
              ? 'border-teal-900 bg-teal-900 text-white'
              : 'border-gray-300 bg-gray-50'
          }`}
        >
          {i}
        </a>
      );
    }
    return (
      <div className="flex justify-between items-center mt-6">
        <span className="text-base">
          عرض {startRecord}-{endRecord} من {totalCount} نتيجة
        </span>
        <nav className="flex gap-1">
          <a
            href="#"
            onClick={() => handlePageChange(currentPage - 1)}
            className={`px-2 py-1 border border-gray-300 rounded bg-gray-50 text-sm ${
              currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            السابق
          </a>
          {pages}
          <a
            href="#"
            onClick={() => handlePageChange(currentPage + 1)}
            className={`px-2 py-1 border border-gray-300 rounded bg-gray-50 text-sm ${
              currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            التالي
          </a>
        </nav>
      </div>
    );
  };

  const renderRequests = () => (
    <div className="p-6 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-normal">الطلبات الجديدة</h1>
        <button
          className="flex items-center gap-2 bg-teal-900 text-white px-4 py-2 rounded hover:bg-teal-800 transition duration-200"
          onClick={() => openPopup('popup-product-check')}
        >
          <Plus />
          <span>إضافة طلب</span>
        </button>
      </div>
      <div className="bg-white border border-gray-300 rounded p-6">
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="flex flex-col sm:flex-row gap-4 h-8">
            <div className="flex items-center border-none rounded bg-gray-50 p-2">
              <input
                type="text"
                placeholder="بحث"
                value={formData.searchTerm || ""}
                onChange={handleSearchChange}
                className="bg-transparent border-none w-48 text-right"
              />
              <Search />
            </div>
            <div className="flex items-center border-none rounded bg-none">
              <Select
                options={ageOptions}
                onChange={handleAgeFilterChange}
                placeholder="كل الأعمار"
                className="w-40 text-right"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: '#F9FAFB',
                    borderColor: '#D1D5DB',
                    textAlign: 'right',
                    paddingRight: '0.5rem',
                  }),
                  menu: (base) => ({
                    ...base,
                    textAlign: 'right',
                  }),
                  singleValue: (base) => ({
                    ...base,
                    textAlign: 'right',
                  }),
                  placeholder: (base) => ({
                    ...base,
                    textAlign: 'right',
                  }),
                }}
              />
            </div>
            <div className="flex items-center border-none rounded">
              <Select
                options={nationalityOptions}
                onChange={handleNationalityFilterChange}
                placeholder="كل الجنسيات"
                className="w-40 text-right"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: '#F9FAFB',
                    borderColor: '#D1D5DB',
                    textAlign: 'right',
                    paddingRight: '0.5rem',
                  }),
                  menu: (base) => ({
                    ...base,
                    textAlign: 'right',
                  }),
                  singleValue: (base) => ({
                    ...base,
                    textAlign: 'right',
                  }),
                  placeholder: (base) => ({
                    ...base,
                    textAlign: 'right',
                  }),
                }}
              />
            </div>
            <button
              className="bg-teal-900 text-white px-2 rounded hover:bg-teal-800 transition duration-200"
              onClick={() => {
                setAgeFilter("");
                setNationalityFilter("");
                setFormData({ ...formData, searchTerm: "" });
                setCurrentPage(1);
              }}
            >
              إعادة ضبط
            </button>
          </div>
        </div>
        <div className="flex gap-4 justify-end mb-9">
          <button
            className="flex items-center gap-1 bg-teal-900 text-white px-3 py-1 rounded text-sm hover:bg-teal-800 transition duration-200"
            onClick={exportToPDF}
          >
            <FilePdfOutlined />
            <span>PDF</span>
          </button>
          <button
            className="flex items-center gap-1 bg-teal-900 text-white px-3 py-1 rounded text-sm hover:bg-teal-800 transition duration-200"
            onClick={exportToExcel}
          >
            <FileExcelOutlined />
            <span>Excel</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center">جارٍ التحميل...</div>
          ) : (
            <table className="w-full text-right text-sm" dir='ltr'>
              <thead className="bg-teal-900 text-white">
                <tr>
                  <th className="p-4 pr-6">الإجراءات</th>
                  <th className="p-4">عرض</th>
                  <th className="p-4">العمر</th>
                  <th className="p-4">جواز السفر</th>
                  <th className="p-4">الجنسية</th>
                  <th className="p-4">اسم العاملة</th>
                  <th className="p-4">رقم العاملة</th>
                  <th className="p-4">هوية العميل</th>
                  <th className="p-4">رقم العميل</th>
                  <th className="p-4">اسم العميل</th>
                  <th className="p-4 pl-6">رقم الطلب</th>
                </tr>
              </thead>
              <tbody>
                {newOrders.map((row, index) => (
                  <>
                    <tr key={index} className="bg-gray-50">
                      <td className="p-4 pr-6">
                        <button
                          className="p-1 cursor-pointer"
                          onClick={(e) => handleOpenMenu(e, index)}
                        >
                          <MoreHorizontal />
                        </button>
                        {menuPosition && menuPosition.row === index && (
                          <div
                            className="fixed w-40 bg-gray-100 border border-gray-200 rounded shadow-lg z-50"
                            style={{
                              top: typeof menuPosition.y === 'number' ? menuPosition.y : 0,
                              left: typeof menuPosition.x === 'number' ? menuPosition.x : 0,
                            }}
                          >
                            <button
                              className="block w-full text-right px-4 py-2 hover:bg-gray-100"
                              onClick={() => {
                                setSelectedOrderId(row?.id);
                                openPopup("popup-confirm-accept");
                                setMenuPosition(null);
                              }}
                            >
                              قبول الطلب
                            </button>
                            <button
                              className="block w-full text-right px-4 py-2 hover:bg-gray-100"
                              onClick={() => {
                                setSelectedOrderId(row?.id);
                                openPopup("popup-confirm-reject");
                                setMenuPosition(null);
                              }}
                            >
                              رفض الطلب
                            </button>
                            <button
                              className="block w-full text-right px-4 py-2 hover:bg-gray-100"
                              onClick={() => {
                                const editPage = row.isAvailable ? 'add-available' : 'add-specs';
                                router.push(`/admin/order-form?type=${editPage}&orderId=${row.id}`);
                                setMenuPosition(null);
                              }}
                            >
                              تعديل
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-4 cursor-pointer">
                        <ArrowDown onClick={() => toggleDetails(index)} />
                      </td>
                      <td className="p-4">{row.HomeMaid?.age || calculateAge(row.HomeMaid?.dateofbirth)}</td>
                      <td className="p-4">{row.Passportnumber || 'غير متوفر'}</td>
                      <td className="p-4">{row.HomeMaid?.office?.Country || 'غير متوفر'}</td>
                      <td className="p-4">{row.HomeMaid?.Name || 'غير متوفر'}</td>
                      <td className="p-4">{row.HomeMaid?.id || 'غير متوفر'}</td>
                      <td className="p-4">{row.client?.nationalId || 'غير متوفر'}</td>
                      <td className="p-4">{row.client?.phonenumber || 'غير متوفر'}</td>
                      <td className="p-4">{row.client?.fullname || 'غير متوفر'}</td>
                      <td className="p-4 pl-6 cursor-pointer" onClick={() => handleOrderClick(row.id)}>
                        #{row.id}
                      </td>
                    </tr>
                    {detailsRow === index && (
                      <tr className="bg-white">
                        <td colSpan="11" className="p-0">
                          <div className="p-4">
                            <div className="border border-gray-300 rounded">
                              <div className="grid grid-cols-5 bg-gray-100 font-bold text-base p-3 border-b border-gray-300">
                                <span>العملية</span>
                                <span>التاريخ</span>
                                <span>المستخدم</span>
                                <span>الوصف</span>
                                <span>السبب</span>
                              </div>
                              <div className="grid grid-cols-5 p-3 text-gray-500 text-sm items-center">
                                <span>{row.HomeMaid?.logs[0]?.status || "غير متوفر"}</span>
                                <span>{row.HomeMaid?.logs[0]?.createdAt ? new Date(row.HomeMaid.logs[0].createdAt).toLocaleString('ar-SA') : "غير متوفر"}</span>
                                <span>{row.HomeMaid?.logs[0]?.user?.username || "غير متوفر"}</span>
                                <span>{row.HomeMaid?.logs[0]?.Details || "غير متوفر"}</span>
                                <span>{row.HomeMaid?.logs[0]?.reason || "غير متوفر"}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {renderPagination()}
      </div>
    </div>
  );

  return (
    <Layout>
      <Head>
        <title>الطلبات الجديدة</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className={`text-gray-800 ${Style["tajawal-regular"]}`}>
        {activePopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[999] flex items-center justify-center">
            {activePopup === 'popup-confirm-accept' && (
              <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center relative">
                <button
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                  onClick={closePopup}
                >
                  <X className="w-5 h-5" />
                </button>
                <p>هل أنت متأكد من قبول الطلب؟</p>
                <div className="flex justify-between mt-4">
                  <button
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition duration-200"
                    onClick={closePopup}
                  >
                    إلغاء
                  </button>
                  <button
                    className="bg-teal-900 text-white px-4 py-2 rounded hover:bg-teal-800 transition duration-200"
                    onClick={() => confirmAccept(selectedOrderId)}
                  >
                    نعم
                  </button>
                </div>
              </div>
            )}
            {activePopup === 'popup-confirm-reject' && (
              <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center relative">
                <button
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                  onClick={closePopup}
                >
                  <X className="w-5 h-5" />
                </button>
                <p>هل أنت متأكد من رفض الطلب؟</p>
                <div className="flex justify-between mt-4">
                  <button
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition duration-200"
                    onClick={closePopup}
                  >
                    إلغاء
                  </button>
                  <button
                    className="bg-teal-900 text-white px-4 py-2 rounded hover:bg-teal-800 transition duration-200"
                    onClick={() => confirmReject(selectedOrderId)}
                  >
                    نعم
                  </button>
                </div>
              </div>
            )}
            {activePopup === 'popup-check-client' && (
              <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center relative">
                <button
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                  onClick={closePopup}
                >
                  <X className="w-5 h-5" />
                </button>
                <p className="text-base">تحقق من العميل</p>
                <p>هل العميل موجود مسبقاً؟</p>
                <Select
                  options={clientOptions}
                  onChange={() => {}}
                  placeholder="اختر عميل من القائمة"
                  className="w-full mt-2 mb-4 text-right"
                  styles={{
                    control: (base) => ({
                      ...base,
                      backgroundColor: '#F9FAFB',
                      borderColor: '#D1D5DB',
                      padding: '0.5rem',
                      textAlign: 'right',
                    }),
                    menu: (base) => ({
                      ...base,
                      textAlign: 'right',
                    }),
                    singleValue: (base) => ({
                      ...base,
                      textAlign: 'right',
                    }),
                    placeholder: (base) => ({
                      ...base,
                      textAlign: 'right',
                    }),
                  }}
                />
                <button className="bg-teal-900 text-white px-4 py-2 rounded w-full hover:bg-teal-800 transition duration-200">
                  عميل جديد
                </button>
              </div>
            )}
            {activePopup === 'popup-product-check' && (
              <div className="bg-white p-8 rounded-xl shadow-2xl w-96 text-center transform transition-all duration-300 ease-in-out relative">
                <button
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                  onClick={closePopup}
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold mb-4 text-teal-900">اختيار نوع الطلب</h2>
                <p className="text-gray-600 mb-6">هل تريد اختيار من العاملات المتاحات أو حسب المواصفات؟</p>
                <div className="flex justify-center gap-4">
                  <button
                    className="bg-gray-100 text-gray-800 border-2 border-teal-800 px-6 py-3 rounded-lg hover:bg-gray-200 transition duration-200 text-base font-medium"
                    onClick={() => {
                      closePopup();
                      router.push('/admin/order-form?type=add-specs');
                    }}
                  >
                    حسب المواصفات
                  </button>
                  <button
                    className="bg-teal-900 text-white px-6 py-3 rounded-lg hover:bg-teal-800 transition duration-200 text-base font-medium"
                    onClick={() => {
                      closePopup();
                      router.push('/admin/order-form?type=add-available');
                    }}
                  >
                    قائمة العاملات المتاحة
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {(showSuccessModal || showErrorModal || showPermissionModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center">
            {showPermissionModal ? (
              <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center relative">
                <button
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                  onClick={closePermissionModal}
                >
                  <X className="w-5 h-5" />
                </button>
                <p className="text-red-600">غير مصرح لك بعرض هذه الصفحة</p>
                <button
                  className="bg-teal-900 text-white px-4 py-2 rounded mt-4 hover:bg-teal-800 transition duration-200"
                  onClick={closePermissionModal}
                >
                  موافق
                </button>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center relative">
                <button
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                  onClick={closeModal}
                >
                  <X className="w-5 h-5" />
                </button>
                <p className={showSuccessModal ? "text-teal-900" : "text-red-600"}>{modalMessage}</p>
                <button
                  className="bg-teal-900 text-white px-4 py-2 rounded mt-4 hover:bg-teal-800 transition duration-200"
                  onClick={closeModal}
                >
                  موافق
                </button>
              </div>
            )}
          </div>
        )}
        {hasPermission ? renderRequests() : (
          <div className="p-6 min-h-screen">
            <h1 className="text-3xl font-normal"></h1>
            <p className="text-gray-600 mt-4">غير مصرح.</p>
          </div>
        )}
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

    const hasPermission = findUser && findUser.role?.permissions?.["إدارة الطلبات"]?.["عرض"];

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