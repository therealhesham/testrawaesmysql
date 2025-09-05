import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import { CashIcon, CreditCardIcon, CurrencyDollarIcon } from '@heroicons/react/outline';
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
import * as XLSX from 'xlsx';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';

export default function Dashboard() {
  const [activePopup, setActivePopup] = useState(null);
  const [view, setView] = useState('requests');
  const [detailsRow, setDetailsRow] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [newOrders, setNewOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [homemaids, setHomemaids] = useState([]);
  const [offices, setOffices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);
  const [formData, setFormData] = useState({
    clientID: '',
    HomemaidId: '',
    ClientName: '',
    PhoneNumber: '',
    Nationalitycopy: '',
    Religion: '',
    PaymentMethod: 'كاش',
    Total: 0,
    Installments: 0,
    Paid: 0,
    Remaining: 0,
    age: 0,
    ExperienceYears: 0,
    notes: '',
    searchTerm: '',
  });
  const [ageFilter, setAgeFilter] = useState("");
  const [nationalityFilter, setNationalityFilter] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
const [menuPosition, setMenuPosition] = useState(null);

const handleOpenMenu = (e, rowIndex) => {
  const rect = e.currentTarget.getBoundingClientRect();
  setMenuPosition({
    x: rect.right - 160, // عرض المنيو
    y: rect.bottom + 5,  // مسافة صغيرة تحت الزر
    row: rowIndex,
  });
};

  const openPopup = (popupId) => setActivePopup(popupId);
  const closePopup = () => setActivePopup(null);
  const closeModal = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setModalMessage("");
  };

  const confirmAccept = async (id) => {
    const confirmRequest = await axios.post('/api/confirmrequest', { id});
    if(confirmRequest.status === 200) {
      setModalMessage('تم قبول الطلب');
      
      setShowSuccessModal(true);
    }
    closePopup();
  };

  const confirmReject = () => {
    setModalMessage('تم رفض الطلب');
    setShowSuccessModal(true);
    closePopup();
  };

  const homemaidOptions = homemaids.map(homemaid => ({
    value: homemaid.id,
    label: homemaid.Name,
  }));

const router = useRouter();
  function handleOrderClick(id: any): void {
  router.push(`/admin/track_order/${id}`);
}


  const handleHomemaidSelect = (selectedOption) => {
    if (selectedOption) {
      const selectedHomemaid = homemaids.find(homemaid => homemaid.id === selectedOption.value);
      setFormData((prev) => ({
        ...prev,
        HomemaidId: selectedOption.value,
        Nationalitycopy: selectedHomemaid?.office?.Country || '',
        Religion: selectedHomemaid?.religion || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        HomemaidId: '',
        Nationalitycopy: '',
        Religion: '',
      }));
    }
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

  const [exportedData, setExportedData] = useState([]);

  const newExportOrdersList = async (page = 1) => {
    setIsLoading(true);
    try {
      const fetchNewOrders = await axios.get("/api/Export/neworders", {});
      setExportedData(fetchNewOrders.data.homemaids);
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
      setNewOrders(fetchNewOrders.data.homemaids);
      setTotalCount(fetchNewOrders.data.totalCount);
      setCurrentPage(fetchNewOrders.data.page);
    } catch (error) {
      console.error("Error fetching new orders:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get("/api/clients");
      setClients(response.data.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchHomemaids = async () => {
    try {
      const response = await axios.get("/api/autocomplete/homemaids");
      setHomemaids(response.data.data);
    } catch (error) {
      console.error('Error fetching homemaids:', error);
    }
  };

  const fetchOffices = async () => {
    try {
      const response = await axios.get("/api/offices");
      setOffices(response.data.countriesfinder);
    } catch (error) {
      console.error('Error fetching offices:', error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updatedFormData = { ...prev, [name]: value };
      if (name === 'Total' || name === 'Paid') {
        const total = parseFloat(updatedFormData.Total) || 0;
        const paid = parseFloat(updatedFormData.Paid) || 0;
        updatedFormData.Remaining = total - paid;
      }
      console.log(formData.PaymentMethod)
      return updatedFormData;
    });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, searchTerm: value }));
    setCurrentPage(1);
  };

  const handleClientSelect = (selectedOption) => {
    if (selectedOption) {
      const selectedClient = clients.find(client => client.id === selectedOption.value);
      setFormData((prev) => ({
        ...prev,
        clientID: selectedOption.value,
        ClientName: selectedClient?.fullname || '',
        PhoneNumber: selectedClient?.phonenumber || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        clientID: '',
        ClientName: '',
        PhoneNumber: '',
      }));
    }
  };

  const handleAgeFilterChange = (selectedOption) => {
    setAgeFilter(selectedOption ? selectedOption.value : "");
    setCurrentPage(1);
  };

  const handleNationalityFilterChange = (selectedOption) => {
    setNationalityFilter(selectedOption ? selectedOption.value : "");
    setCurrentPage(1);
  };


const handleSubmitSpecs = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/submitneworderbyspecs", formData);
      setModalMessage('تم إضافة الطلب بنجاح');
      setShowSuccessModal(true);
      setView('requests');
      newOrdersList();
    } catch (error) {
      setModalMessage('حدث خطأ أثناء إضافة الطلب');
      setShowErrorModal(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/submitneworderprisma", formData);
      setModalMessage('تم إضافة الطلب بنجاح');
      setShowSuccessModal(true);
      setView('requests');
      newOrdersList();
    } catch (error) {
      console.error('Error creating order:', error.response.data.message);
      setModalMessage( error.response.data.message);
      setShowErrorModal(true);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont("Amiri");
    doc.setFontSize(12);
    doc.text("الطلبات الجديدة", 200, 10, { align: 'right' });

    const tableColumn = [
      "رقم الطلب",
      "اسم العميل",
      "رقم العميل",
      "هوية العميل",
      "رقم العاملة",
      "اسم العاملة",
      "الجنسية",
      "جواز السفر",
      "العمر",
    ];
    const tableRows = exportedData.map(row => [
      row.id,
      row.client?.fullname || "غير متوفر",
      row.client?.phonenumber || "غير متوفر",
      row.client?.nationalId || "غير متوفر",
      row.HomeMaid?.id || "غير متوفر",
      row.HomeMaid?.Name || "غير متوفر",
      row.HomeMaid?.office?.Country || "غير متوفر",
      row.Passportnumber || "غير متوفر",
      row.HomeMaid?.age || calculateAge(row.HomeMaid?.dateofbirth),
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      styles: { font: "Amiri", halign: 'right' },
      headStyles: { fillColor: [0, 105, 92] },
      margin: { top: 20 },
    });

    doc.save("new_orders.pdf");
  };

  const exportToExcel = () => {
    const worksheetData = exportedData.map(row => ({
      "رقم الطلب": row.id,
      "اسم العميل": row.client?.fullname || "غير متوفر",
      "رقم العميل": row.client?.phonenumber || "غير متوفر",
      "هوية العميل": row.client?.nationalId || "غير متوفر",
      "رقم العاملة": row.HomeMaid?.id || "غير متوفر",
      "اسم العاملة": row.HomeMaid?.Name || "غير متوفر",
      "الجنسية": row.HomeMaid?.office?.Country || "غير متوفر",
      "جواز السفر": row.Passportnumber || "غير متوفر",
      "العمر": row.HomeMaid?.age || calculateAge(row.HomeMaid?.dateofbirth),
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الطلبات الجديدة");
    XLSX.writeFile(workbook, "new_orders.xlsx");
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
              ? 'border-teal-800 bg-teal-900 text-white'
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
          <span>اضافة طلب</span>
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
                className="bg-transparent border-none w-48"
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
                  }),
                  menu: (base) => ({
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
                className="text-right w-full"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: '#F9FAFB',
                    borderColor: '#D1D5DB',
                    textAlign: 'right',
                  }),
                  menu: (base) => ({
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
        <div className="overflow-x-auto" dir="ltr">
          {isLoading ? (
            <div className="text-center">جارٍ التحميل...</div>
          ) : (
            <table className="w-full text-right text-sm">
              <thead className="bg-teal-900 text-white">
                <tr>
                  <th className="p-4 pr-6">الاجراءات</th>
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
    className="fixed w-40 bg-teal-100 border border-gray-200 rounded shadow-lg z-50"
    style={{ 
      top: typeof menuPosition.y === 'number' ? menuPosition.y : 0, 
      left: typeof menuPosition.x === 'number' ? menuPosition.x : 0 
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
        openPopup("popup-confirm-reject");
        setMenuPosition(null);
      }}
    >
      رفض الطلب
    </button>
    <button
      className="block w-full text-right px-4 py-2 hover:bg-gray-100"
      onClick={() => {
        alert("تعديل الطلب");
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
                      <td className="p-4">{row.Passportnumber}</td>
                      <td className="p-4">{row.HomeMaid?.office?.Country}</td>
                      <td className="p-4">{row.HomeMaid?.Name}</td>
                      <td className="p-4">{row.HomeMaid?.id}</td>
                      <td className="p-4">{row.client?.nationalId}</td>
                      <td className="p-4">{row.client?.phonenumber}</td>
                      <td className="p-4">{row.client?.fullname}</td>
                      <td className="p-4 pl-6 cursor-pointer" onClick={() => handleOrderClick(row.id)}>{row.id}</td>
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
                                <span>{row.HomeMaid?.logs[0]?.createdAt || "غير متوفر"}</span>
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

  const renderAddAvailable = () => (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-normal text-right">طلب جديد حسب العاملات المتاحات</h1>
        <button
          className="p-2 text-gray-600 hover:text-gray-800"
          onClick={() => setView('requests')}
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-300 p-10 rounded">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          <div className="flex flex-col gap-2">
            <label className="text-base">اسم العميل</label>
            <Select
              options={clientOptions}
              onChange={handleClientSelect}
              placeholder="اختر عميل"
              className="text-right"
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
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">رقم العميل</label>
            <input
              type="text"
              name="PhoneNumber"
              value={formData.PhoneNumber}
              readOnly
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">مدينة العميل</label>
            <input
              type="text"
              placeholder="مدينة العميل"
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">اسم العاملة</label>
            <Select
              options={homemaidOptions}
              onChange={handleHomemaidSelect}
              placeholder="اختر عاملة"
              className="text-right"
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
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">رقم العاملة</label>
            <input
              type="text"
              value={formData.HomemaidId || ''}
              readOnly
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">جنسية العاملة</label>
            <input
              type="text"
              name="Nationalitycopy"
              value={formData.Nationalitycopy}
              readOnly
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">ديانة العاملة</label>
            <input
              type="text"
              name="Religion"
              value={formData.Religion}
              readOnly
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500"
            />
          </div>
        </div>
        <div className="mb-10">
          <h2 className="text-base font-normal mb-2">طريقة الدفع المختارة</h2>
          <div className="flex flex-wrap gap-6 justify-center">
            {[// عايز الاوبشن يتلون لما اختاره
              { option: 'كاش', icon: formData.PaymentMethod == "كاش" ? <CashIcon className="w-6 h-6 text-teal-800" /> : <CashIcon className="w-6 h-6 text-gray-400" /> },
              { option: 'دفعتين', icon: formData.PaymentMethod == "دفعتين" ? <CreditCardIcon className="w-6 h-6 text-teal-800" /> : <CreditCardIcon className="w-6 h-6 text-gray-400" /> },
              { option: 'ثلاثة دفعات', icon: formData.PaymentMethod == "ثلاثة دفعات" ? <CurrencyDollarIcon className="w-6 h-6 text-teal-800" /> : <CurrencyDollarIcon className="w-6 h-6 text-gray-400" /> },
            ].map(({ option, icon }, index) => (
              <label key={index} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded bg-gray-50 cursor-pointer w-60">
                <input
                  type="radio"
                  name="PaymentMethod"
                  value={option}
                  checked={formData.PaymentMethod === option}
                  onChange={handleFormChange}
                  className="hidden"
                />
                <span className="text-teal-800 text-xl">{option}</span>
                {icon}
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="flex flex-col gap-2">
            <label className="text-base">المبلغ كامل</label>
            <input
              type="number"
              name="Total"
              value={formData.Total}
              onChange={handleFormChange}
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">المبلغ المدفوع</label>
            <input
              type="number"
              name="Paid"
              value={formData.Paid}
              onChange={handleFormChange}
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">المبلغ المتبقي</label>
            <input
              type="text"
              value={`${formData.Remaining.toFixed(2)} SR`}
              readOnly
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500"
            />
          </div>
        </div>
        <div className="flex gap-6 flex-col sm:flex-row">
          <button type="submit" className="bg-teal-900 text-white px-4 py-2 rounded w-full sm:w-40 hover:bg-teal-800 transition duration-200">حفظ</button>
          <button type="button" onClick={() => setView('requests')} className="bg-gray-100 text-gray-800 border-2 border-teal-800 px-4 py-2 rounded w-full sm:w-40 hover:bg-gray-200 transition duration-200">الغاء</button>
        </div>
      </form>
    </div>
  );

  const renderAddSpecs = () => (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-normal text-right">طلب جديد حسب المواصفات</h1>
        <button
          className="p-2 text-gray-600 hover:text-gray-800"
          onClick={() => setView('requests')}
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <form onSubmit={handleSubmitSpecs} className="bg-white border border-gray-300 p-10 rounded">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          <div className="flex flex-col gap-2">
            <label className="text-base">اسم العميل</label>
            <Select
              options={clientOptions}
              onChange={handleClientSelect}
              placeholder="اختر عميل"
              className="text-right"
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
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">رقم العميل</label>
            <input
              type="text"
              name="PhoneNumber"
              value={formData.PhoneNumber}
              readOnly
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">مدينة العميل</label>
            <input
              type="text"
              placeholder="مدينة العميل"
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">العمر</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleFormChange}
              placeholder="اختر العمر"
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">سنوات الخبرة</label>
            <input
              type="number"
              name="ExperienceYears"
              value={formData.ExperienceYears}
              onChange={handleFormChange}
              placeholder="اختر سنوات الخبرة"
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">جنسية العاملة المطلوبة</label>
            <input
              type="text"
              name="Nationalitycopy"
              value={formData.Nationalitycopy}
              onChange={handleFormChange}
              placeholder="اختر جنسية العاملة المطلوبة"
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">الديانة</label>
            <input
              type="text"
              name="Religion"
              value={formData.Religion}
              onChange={handleFormChange}
              placeholder="اختر الديانة"
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">ملاحظات إضافية</label>
            <input
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              placeholder="ادخل أي ملاحظات أو بيانات أخرى ..."
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500"
            />
          </div>
        </div>
        <div className="mb-10">
          <h2 className="text-base font-normal mb-2">طريقة الدفع المختارة</h2>
          <div className="flex self-center justify-center gap-6">
            {[
              { option: 'كاش', icon: <CashIcon className="w-6 h-6 text-teal-800" /> },
              { option: 'دفعتين', icon: <CreditCardIcon className="w-6 h-6 text-teal-800" /> },
              { option: 'ثلاثة دفعات', icon: <CurrencyDollarIcon className="w-6 h-6 text-teal-800" /> },
            ].map(({ option, icon }, index) => (
              <label key={index} className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded bg-gray-50 cursor-pointer w-60">
                <input
                  type="radio"
                  name="PaymentMethod"
                  value={option}
                  checked={formData.PaymentMethod === option}
                  onChange={handleFormChange}
                  className="hidden"
                />
                <span className="text-teal-800 text-xl">{option}</span>
                {icon}
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          <div className="flex flex-col gap-2">
            <label className="text-base">المبلغ كامل</label>
            <input
              type="number"
              name="Total"
              value={formData.Total}
              onChange={handleFormChange}
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">المبلغ المدفوع</label>
            <input
              type="number"
              name="Paid"
              value={formData.Paid}
              onChange={handleFormChange}
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base">المبلغ المتبقي</label>
            <input
              type="text"
              value={`${formData.Remaining.toFixed(2)} SR`}
              readOnly
              className="bg-gray-50 border border-gray-300 rounded p-3 text-base text-gray-500"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 mb-8">
          <label className="text-base">تحميل ملف العقد</label>
          <div className="flex gap-3 items-center">
            <input
              type="file"
              className="bg-gray-50 border border-gray-300 rounded p-3 flex-1"
            />
            <button className="bg-teal-900 text-white px-4 py-2 rounded hover:bg-teal-800 transition duration-200">اختيار ملف</button>
          </div>
        </div>
        <div className="flex gap-6 flex-col sm:flex-row">
          <button type="submit" className="bg-teal-900 text-white px-4 py-2 rounded w-full sm:w-40 hover:bg-teal-800 transition duration-200">حفظ</button>
          <button type="button" onClick={() => setView('requests')} className="bg-gray-100 text-gray-800 border-2 border-teal-800 px-4 py-2 rounded w-full sm:w-40 hover:bg-gray-200 transition duration-200">الغاء</button>
        </div>
      </form>
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
                    الغاء
                  </button>
                  <button
                    className="bg-teal-900 text-white px-4 py-2 rounded hover:bg-teal-800 transition duration-200"
                    onClick={()=>confirmAccept(selectedOrderId)}
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
                    الغاء
                  </button>
                  <button
                    className="bg-teal-900 text-white px-4 py-2 rounded hover:bg-teal-800 transition duration-200"
                    onClick={confirmReject}
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
                  onChange={handleClientSelect}
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
                      setView('add-specs');
                    }}
                  >
                    حسب المواصفات
                  </button>
                  <button
                    className="bg-teal-900 text-white px-6 py-3 rounded-lg hover:bg-teal-800 transition duration-200 text-base font-medium"
                    onClick={() => {
                      closePopup();
                      setView('add-available');
                    }}
                  >
                    قائمة العاملات المتاحة
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {(showSuccessModal || showErrorModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center">
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
          </div>
        )}
        {view === 'requests' && renderRequests()}
        {view === 'add-available' && renderAddAvailable()}
        {view === 'add-specs' && renderAddSpecs()}
      </div>
    </Layout>
  );
}



export async function getServerSideProps ({ req }) {
  try {
    console.log("sss")
    // 🔹 Extract cookies
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    // 🔹 Check for authToken
    if (!cookies.authToken) {
      return {
        redirect: { destination: "/admin/login", permanent: false },
      };
    }

    // 🔹 Decode JWT
    const token = jwtDecode(cookies.authToken);

    // 🔹 Fetch user & role with Prisma
    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });
console.log(findUser.role?.permissions?.["إدارة الطلبات"])
    if (
      !findUser ||
      !findUser.role?.permissions?.["إدارة الطلبات"]?.["عرض"]
    ) {
      return {
        redirect: { destination: "/admin/home", permanent: false }, // or show 403
      };
    }

    return { props: {} };
  } catch (err) {
    console.error("Authorization error:", err);
    return {
      redirect: { destination: "/admin/home", permanent: false },
    };
  }
};