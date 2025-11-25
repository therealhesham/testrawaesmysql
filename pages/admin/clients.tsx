
import AddClientModal from 'components/AddClientModal';
import AddNotesModal from 'components/AddNotesModal';
import Style from "styles/Home.module.css";
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, ChevronDown, Calendar, Filter, FileText, Eye, ChevronRight, ChevronUp, Edit2 } from 'lucide-react';
import { FileExcelOutlined } from '@ant-design/icons';
import { DocumentTextIcon, DownloadIcon } from '@heroicons/react/outline';
import Layout from 'example/containers/Layout';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { jwtDecode } from 'jwt-decode';
import prisma from 'lib/prisma';
import ColumnSelector from '../../components/ColumnSelector';
import { useRouter } from 'next/router';

interface Order {
  id: number;
  bookingstatus: string | null;
  createdAt: string | null;
  HomeMaid: { id: number; Name: string | null } | null;
}

interface Client {
  id: number;
  fullname: string | null;
  phonenumber: string | null;
  nationalId: string | null;
  city: string | null;
  createdat: string | null;
  orders: Order[];
  _count: { orders: number };
  notes: any[];
  notes_date: string | null;
}

interface Props {
  hasPermission: boolean;
}

interface Notification {
  message: string;
  type: 'success' | 'error';
}

const Customers = ({ hasPermission }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(!hasPermission);
  const [clients, setClients] = useState<Client[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [userName, setUserName] = useState('');
  useEffect(() => {
    const authToken = localStorage.getItem('token');
    const decoder = authToken ? jwtDecode(authToken) : null;
    setUserName(decoder?.username || '');
  }, [userName]);
  const [expandedClientId, setExpandedClientId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    fullname: '',
    phonenumber: '',
    city: 'all',
    date: '',
  });
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    fullname: true,
    phonenumber: true,
    nationalId: true,
    city: true,
    ordersCount: true,
    lastOrderDate: true,
    showOrders: true,
    remainingAmount: true,
    notes: true,
    view: true,
    edit: true
  });


const arabicRegionMap: { [key: string]: string } = {
     'Riyadh': 'الرياض',
    'Al-Kharj': 'الخرج',
    'Ad Diriyah': 'الدرعية',
    'Al Majma\'ah': 'المجمعة',
    'Al Zulfi': 'الزلفي',
    'Ad Dawadimi': 'الدوادمي',
    'Wadi Ad Dawasir': 'وادي الدواسر',
    'Afif': 'عفيف',
    'Al Quway\'iyah': 'القويعية',
    'Shaqra': 'شقراء',
    'Hotat Bani Tamim': 'حوطة بني تميم',

    'Makkah': 'مكة المكرمة',
    'Jeddah': 'جدة',
    'Taif': 'الطائف',
    'Rabigh': 'رابغ',
    'Al Qunfudhah': 'القنفذة',
    'Al Lith': 'الليث',
    'Khulais': 'خليص',
    'Ranyah': 'رنية',
    'Turabah': 'تربة',

    'Madinah': 'المدينة المنورة',
    'Yanbu': 'ينبع',
    'Al Ula': 'العلا',
    'Badr': 'بدر',
    'Al Hinakiyah': 'الحناكية',
    'Mahd Al Dhahab': 'مهد الذهب',

    'Dammam': 'الدمام',
    'Al Khobar': 'الخبر',
    'Dhahran': 'الظهران',
    'Al Ahsa': 'الأحساء',
    'Al Hufuf': 'الهفوف',
    'Al Mubarraz': 'المبرز',
    'Jubail': 'الجبيل',
    'Hafr Al Batin': 'حفر الباطن',
    'Al Khafji': 'الخفجي',
    'Ras Tanura': 'رأس تنورة',
    'Qatif': 'القطيف',
    'Abqaiq': 'بقيق',
    'Nairiyah': 'النعيرية',
    'Qaryat Al Ulya': 'قرية العليا',

    'Buraydah': 'بريدة',
    'Unaizah': 'عنيزة',
    'Ar Rass': 'الرس',
    'Al Bukayriyah': 'البكيرية',
    'Al Badaye': 'البدائع',
    'Al Mithnab': 'المذنب',
    'Riyad Al Khabra': 'رياض الخبراء',

    'Abha': 'أبها',
    'Khamis Mushait': 'خميس مشيط',
    'Bisha': 'بيشة',
    'Mahayil': 'محايل عسير',
    'Al Namas': 'النماص',
    'Tanomah': 'تنومة',
    'Ahad Rafidah': 'أحد رفيدة',
    'Sarat Abidah': 'سراة عبيدة',
    'Balqarn': 'بلقرن',

    'Tabuk': 'تبوك',
    'Duba': 'ضباء',
    'Al Wajh': 'الوجه',
    'Umluj': 'أملج',
    'Tayma': 'تيماء',
    'Haqi': 'حقل',

    'Hail': 'حائل',
    'Baqa': 'بقعاء',
    'Al Ghazalah': 'الغزالة',

    'Arar': 'عرعر',
    'Rafha': 'رفحاء',
    'Turaif': 'طريف',

    'Jazan': 'جازان',
    'Sabya': 'صبيا',
    'Abu Arish': 'أبو عريش',
    'Samtah': 'صامطة',
    'Baish': 'بيش',
    'Ad Darb': 'الدرب',
    'Al Aridah': 'العارضة',
    'Fifa': 'فيفاء',

    'Najran': 'نجران',
    'Sharurah': 'شرورة',
    'Hubuna': 'حبونا',

    'Al Baha': 'الباحة',
    'Baljurashi': 'بلجرشي',
    'Al Mandq': 'المندق',
    'Al Makhwah': 'المخواة',
    'Qilwah': 'قلوة',

    'Sakaka': 'سكاكا',
    'Dumat Al Jandal': 'دومة الجندل',
    'Al Qurayyat': 'القريات',
    'Tabarjal': 'طبرجل'
  };


  const [expandedNotesId, setExpandedNotesId] = useState<number | null>(null);
  const router = useRouter();

  const columnDefinitions = [
    { key: 'id', label: 'الرقم' },
    { key: 'fullname', label: 'الاسم' },
    { key: 'phonenumber', label: 'رقم الجوال' },
    { key: 'nationalId', label: 'الهوية' },
    { key: 'city', label: 'المدينة' },
    { key: 'ordersCount', label: 'عدد الطلبات' },
    { key: 'lastOrderDate', label: 'تاريخ آخر طلب' },
    { key: 'showOrders', label: 'عرض الطلبات' },
    { key: 'remainingAmount', label: 'المبلغ المتبقي' },
    { key: 'notes', label: 'ملاحظات' },
    { key: 'view', label: 'عرض' },
    { key: 'edit', label: 'تعديل' }
  ];

  const fetchCities = async () => {
    try {
      const response = await fetch('/api/unique-cities');
      const { success, cities } = await response.json();
      if (success) {
        setCities(cities);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchClients = async (page: number = 1) => {
    if (!hasPermission) return;
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        ...(filters.fullname && { fullname: filters.fullname }),
        ...(filters.phonenumber && { phonenumber: filters.phonenumber }),
        ...(filters.city !== 'all' && { city: filters.city }),
        ...(filters.date && { date: filters.date }),
      }).toString();

      const response = await fetch(`/api/clients?${query}`);
      const { data, totalPages, totalClients } = await response.json();
      setClients(data);
      setTotalPages(totalPages);
      setTotalClients(totalClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission) {
      fetchClients(currentPage);
      fetchCities();
    }
  }, [currentPage, filters, hasPermission]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
    setExpandedClientId(null);
  };

  const handleResetFilters = () => {
    setFilters({ fullname: '', phonenumber: '', city: 'all', date: '' });
    setCurrentPage(1);
    setExpandedClientId(null);
  };

  const toggleOrders = (clientId: number) => {
    setExpandedClientId(expandedClientId === clientId ? null : clientId);
  };

  const handleAddNotes = (clientId: number, clientName: string) => {
    setSelectedClient({ id: clientId, name: clientName });
    setIsNotesModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  const handleEditClientSubmit = async (updatedClient: Client) => {
    try {
      const response = await fetch(`/api/clientinfo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedClient),
      });
      if (response.ok) {
        setNotification({ message: 'تم تحديث بيانات العميل بنجاح', type: 'success' });
        fetchClients(currentPage);
        setIsEditModalOpen(false);
        setSelectedClient(null);
        setTimeout(() => setNotification(null), 3000); // إخفاء الإشعار بعد 3 ثوانٍ
      } else {
        throw new Error('فشل في تحديث البيانات');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      setNotification({ message: 'فشل في تحديث بيانات العميل', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleNotesSuccess = () => {
    fetchClients(currentPage);
  };

  const translateBookingStatus = (status: string) => {
    const statusTranslations: { [key: string]: string } = {
      'pending': 'قيد الانتظار',
      'external_office_approved': 'موافقة المكتب الخارجي',
      'pending_external_office': 'في انتظار المكتب الخارجي',
      'medical_check_passed': 'تم اجتياز الفحص الطبي',
      'pending_medical_check': 'في انتظار الفحص الطبي',
      'foreign_labor_approved': 'موافقة وزارة العمل الأجنبية',
      'pending_foreign_labor': 'في انتظار وزارة العمل الأجنبية',
      'agency_paid': 'تم دفع الوكالة',
      'pending_agency_payment': 'في انتظار دفع الوكالة',
      'embassy_approved': 'موافقة السفارة السعودية',
      'pending_embassy': 'في انتظار السفارة السعودية',
      'visa_issued': 'تم إصدار التأشيرة',
      'pending_visa': 'في انتظار إصدار التأشيرة',
      'travel_permit_issued': 'تم إصدار تصريح السفر',
      'pending_travel_permit': 'في انتظار تصريح السفر',
      'received': 'تم الاستلام',
      'pending_receipt': 'في انتظار الاستلام',
      'cancelled': 'ملغي',
      'rejected': 'مرفوض',
      'delivered': 'تم التسليم',
      'new_order': 'طلب جديد',
      'new_orders': 'طلبات جديدة'
    };
    
    return statusTranslations[status] || status;
  };

  const [fullDataForExport, setFullDataForExport] = useState<any[]>([]);
  const fullDataForPDF = async () => {
    const daa = await fetch('/api/clientsexport');
    const data = await daa.json();
    setFullDataForExport(data.data);
  }

  useEffect(() => {
    fullDataForPDF();
  }, []);

  const exportedData = async () => {
    const query = new URLSearchParams({
      page: "1",
      pageSize: "10000000",
    }).toString();
    const response = await fetch(`/api/clients?${query}`);
    if (!response.ok) throw new Error("Failed to fetch data");
    const data = await response.json();
    return data.data;
  }

  const exportToPDF = async () => {
    let dataToExport = await exportedData();
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    try {
    
    const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
    const logoBuffer = await logo.arrayBuffer();
    const logoBytes = new Uint8Array(logoBuffer);
    const logoBase64 = Buffer.from(logoBytes).toString('base64');
    // doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);
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
    doc.setFontSize(16);
    // doc.text("قائمة العملاء", pageWidth / 2, 20, { align: 'right' });

    const tableColumn: string[] = [];
    const columnKeys: string[] = [];

    // if (visibleColumns.remainingAmount) { tableColumn.push("المبلغ المتبقي"); columnKeys.push("remainingAmount"); }
    if (visibleColumns.lastOrderDate) { tableColumn.push("تاريخ آخر طلب"); columnKeys.push("lastOrderDate"); }
    if (visibleColumns.ordersCount) { tableColumn.push("عدد الطلبات"); columnKeys.push("ordersCount"); }
    if (visibleColumns.city) { tableColumn.push("المدينة"); columnKeys.push("city"); }
    if (visibleColumns.nationalId) { tableColumn.push("الهوية"); columnKeys.push("nationalId"); }
    if (visibleColumns.phonenumber) { tableColumn.push("رقم الجوال"); columnKeys.push("phonenumber"); }
    if (visibleColumns.fullname) { tableColumn.push("الاسم"); columnKeys.push("fullname"); }
    if (visibleColumns.id) { tableColumn.push("الرقم"); columnKeys.push("id"); }

    const tableRows: any[] = [];

    dataToExport.forEach((client: any) => {
      const clientData: string[] = [];
      
      columnKeys.forEach((key) => {
        switch (key) {
          case "id":
            clientData.push(client.id.toString());
            break;
          case "fullname":
            clientData.push(client.fullname || '-');
            break;
          case "phonenumber":
            clientData.push(client.phonenumber || '-');
            break;
          case "nationalId":
            clientData.push(client.nationalId || '-');
            break;
          case "city":
            clientData.push(arabicRegionMap[client.city as keyof typeof arabicRegionMap] || '-');
            break;
          case "ordersCount":
            clientData.push(client._count.orders.toString());
            break;
          case "lastOrderDate":
            clientData.push(client.orders[0]?.createdAt ? new Date(client.orders[0]?.createdAt).toLocaleDateString() : '-');
            break;
          // case "remainingAmount":
          //   clientData.push('-');
          //   break;
          default:
            clientData.push('-');
        }
      });
      
      tableRows.push(clientData);
    });

        const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
    const logoBuffer = await logo.arrayBuffer();
    const logoBytes = new Uint8Array(logoBuffer);
    const logoBase64 = Buffer.from(logoBytes).toString('base64');

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      styles: { font: 'Amiri', halign: 'right', fontSize: 10 },
      headStyles: { fillColor: [26, 77, 79], textColor: [255, 255, 255] },
      bodyStyles: { minCellWidth: 20 },
      margin: { top: 40, right: 10, left: 10 },
          didDrawPage: (data: any) => {
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
        doc.text('قائمة العملاء', pageWidth / 2, 20, { align: 'right' });

      // 🔷 إضافة اللوجو أعلى الصفحة (في كل صفحة)
      doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

      // 🔹 كتابة العنوان في أول صفحة فقط (اختياري)
      if (doc.getCurrentPageInfo().pageNumber === 1) {
        doc.setFontSize(12);
        doc.setFont('Amiri', 'normal');
      }

      // 🔸 الفوتر
      doc.setFontSize(10);
      doc.setFont('Amiri', 'normal');

      doc.text(userName, 10, pageHeight - 10, { align: 'left' });

      const pageNumber = `صفحة ${doc.getCurrentPageInfo().pageNumber}`;
      doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });

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

    doc.save('بيانات عملاء الاستقدام.pdf');
  };

  const exportToExcel = async() => {
    let dataToExport = await exportedData();
    const worksheetData = dataToExport.map((client: any) => {
      const clientData: any = {};
      
      if (visibleColumns.id) clientData['الرقم'] = client.id;
      if (visibleColumns.fullname) clientData['الاسم'] = client.fullname || '-';
      if (visibleColumns.phonenumber) clientData['رقم الجوال'] = client.phonenumber || '-';
      if (visibleColumns.nationalId) clientData['الهوية'] = client.nationalId || '-';
      if (visibleColumns.city) clientData['المدينة'] = client.city || '-';
      if (visibleColumns.ordersCount) clientData['عدد الطلبات'] = client._count.orders;
      if (visibleColumns.lastOrderDate) {
        clientData['تاريخ آخر طلب'] = client.orders[0]?.createdAt
          ? new Date(client.orders[0]?.createdAt).toLocaleDateString()
          : '-';
      }
      // if (visibleColumns.remainingAmount) clientData['المبلغ المتبقي'] = '-';
      
      return clientData;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    worksheet['!cols'] = [
      { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
      { wch: 20 }, { wch: 15 }, { wch: 10 }
    ];
    XLSX.utils.sheet_add_aoa(worksheet, [['الرقم', 'الاسم', 'رقم الجوال', 'الهوية', 'المدينة', 'عدد الطلبات', 'تاريخ آخر طلب']], { origin: 'A1', direction: 'rtl' });
    XLSX.utils.book_append_sheet(workbook, worksheet, 'قائمة العملاء');
    XLSX.writeFile(workbook, 'قائمة العملاء.xlsx');
  };

  return (
    <Layout>
      <div className={`w-full mx-auto bg-primary-light min-h-screen ${Style["tajawal-regular"]}`}>
        <div className="flex flex-col">
          <main className="flex-grow p-6 sm:p-8 overflow-y-auto">
            {isPermissionModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                  <h2 className="text-xl font-semibold text-text-dark mb-4">غير مصرح</h2>
                  <p className="text-text-muted mb-6">ليس لديك صلاحية لعرض هذه الصفحة.</p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => (window.location.href = '/admin/home')}
                      className="bg-teal-800 text-white px-4 py-2 rounded-md text-md font-medium hover:bg-teal-800/90"
                    >
                      العودة إلى الرئيسية
                    </button>
                  </div>
                </div>
              </div>
            )}

            {notification && (
              <div className={`fixed top-4 right-4 p-4 rounded-md text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                {notification.message}
              </div>
            )}

            {hasPermission && (
              <>
                <section className="flex justify-between items-center mb-6">
                  <h1 className="text-3xl font-normal text-text-dark">قائمة العملاء</h1>
                  <button
                    className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2 rounded-md text-md font-medium hover:bg-teal-800/90"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <span>إضافة عميل</span>
                    <Plus className="w-5 h-5" />
                  </button>
                </section>

                <section className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-60">
                      <input
                        type="text"
                        placeholder="بحث"
                        value={filters.fullname}
                        onChange={(e) => handleFilterChange('fullname', e.target.value)}
                        className="w-full bg-background-light border border-border-color rounded-md py-2 pr-10 pl-4 text-md text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-dark"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                    </div>
                    <div className="flex items-center bg-background-light border border-border-color rounded-md text-md text-text-muted cursor-pointer">
                      <select
                        value={filters.city}
                        onChange={(e) => handleFilterChange('city', e.target.value)}
                        className="bg-transparent w-full text-md text-text-muted focus:outline-none border-none"
                      >
                        <option value="all">كل المدن</option>
                        <option value="Ar Riyāḍ">الرياض</option>
                        <option value="Makkah al Mukarramah">مكة المكرمة</option>
                        <option value="Al Madīnah al Munawwarah">المدينة المنورة</option>
                        <option value="Ash Sharqīyah">المنطقة الشرقية</option>
                        <option value="Asīr">عسير</option>
                        <option value="Tabūk">تبوك</option>
                        <option value="Al Ḩudūd ash Shamālīyah">الحدود الشمالية</option>
                        <option value="Jazan">جازان</option>
                        <option value="Najrān">نجران</option>
                        <option value="Al Bāḩah">الباحة</option>
                        <option value="Al Jawf">الجوف</option>
                        <option value="Al Qaşīm">القصيم</option>
                        <option value="Ḩa'il">حائل</option>
                      </select>
                    </div>
                    <div className="flex items-center bg-background-light border border-border-color rounded-md text-md text-text-muted cursor-pointer">
                      <input
                        type="date"
                        value={filters.date}
                        onChange={(e) => handleFilterChange('date', e.target.value)}
                        className="bg-transparent w-full text-md text-text-muted focus:outline-none border-none"
                      />
                    </div>
                    <ColumnSelector
                      visibleColumns={visibleColumns}
                      setVisibleColumns={setVisibleColumns}
                      columns={columnDefinitions}
                      buttonText="الأعمدة"
                      buttonStyle="bg-white justify-between py-2 px-4 rounded-lg border border-gray-200 flex items-center gap-1 text-gray hover:bg-gray-50 transition-colors"
                    />
                    <button
                      onClick={handleResetFilters}
                      className="bg-teal-800 text-white px-4 py-2 rounded-md text-md font-medium hover:bg-teal-800/90"
                    >
                      إعادة ضبط
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={exportToPDF}
                      className="flex items-center gap-1 bg-teal-800 text-white px-3 py-1 rounded-md text-md font-medium hover:bg-teal-800/90"
                    >
                      <FileText className="w-4 h-4" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={exportToExcel}
                      className="flex items-center gap-1 bg-teal-800 text-white px-3 py-1 rounded-md text-md font-medium hover:bg-teal-800/90"
                    >
                      <FileExcelOutlined className="w-4 h-4" />
                      <span>Excel</span>
                    </button>
                  </div>
                </section>

                <section className="bg-text-light rounded-md w-full">
                  <table className="w-full text-md font-medium">
                    <thead>
                      <tr className="bg-teal-800 text-white">
                        {visibleColumns.id && <th className="text-nowrap text-center p-4 w-[8%]">الرقم</th>}
                        {visibleColumns.fullname && <th className="text-nowrap text-center p-4 w-[15%]">الاسم</th>}
                        {visibleColumns.phonenumber && <th className="text-nowrap text-center p-4 w-[12%]">رقم الجوال</th>}
                        {visibleColumns.nationalId && <th className="text-nowrap text-center p-4 w-[12%]">الهوية</th>}
                        {visibleColumns.city && <th className="text-nowrap text-center p-4 w-[10%]">المدينة</th>}
                        {visibleColumns.ordersCount && <th className="text-nowrap text-center p-4 w-[10%]">عدد الطلبات</th>}
                        {visibleColumns.lastOrderDate && <th className="text-nowrap text-center p-4 w-[12%]">تاريخ آخر طلب</th>}
                        {visibleColumns.showOrders && <th className="text-nowrap text-center p-4 w-[8%]">عرض الطلبات</th>}
                        {visibleColumns.remainingAmount && <th className="text-nowrap text-center p-4 w-[10%]">المبلغ المتبقي</th>}
                        {visibleColumns.notes && <th className="text-nowrap text-center p-4 w-[10%]">ملاحظات</th>}
                        {visibleColumns.view && <th className="text-nowrap text-center p-4 w-[8%] min-w-[80px]">عرض</th>}
                        {visibleColumns.edit && <th className="text-nowrap text-center p-4 w-[8%] min-w-[80px]">تعديل</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                      {loading ? (
                        <tr>
                          <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="p-4 text-center text-text-dark">
                            جاري التحميل...
                          </td>
                        </tr>
                      ) : clients.length === 0 ? (
                        <tr>
                          <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="p-4 text-center text-text-dark">
                            لا توجد بيانات
                          </td>
                        </tr>
                      ) : (
                        clients.map((client) => (
                          <React.Fragment key={client.id}>
                            <tr className="bg-background-light text-text-dark text-md">
                              {visibleColumns.id && <td className="text-nowrap text-center p-4 cursor-pointer" onClick={() => router.push(`/admin/clientdetails?id=${client.id}`)}>#{client.id}</td>}
                              {visibleColumns.fullname && <td className="text-nowrap text-center p-4">{client.fullname}</td>}
                              {visibleColumns.phonenumber && <td className="text-nowrap text-center p-4">{client.phonenumber}</td>}
                              {visibleColumns.nationalId && <td className="text-nowrap text-center p-4">{client.nationalId}</td>}
                              {visibleColumns.city && <td className="text-nowrap text-center p-4">{arabicRegionMap[client.city as keyof typeof arabicRegionMap]}</td>}
                              {visibleColumns.ordersCount && <td className="text-nowrap text-center p-4">{client._count.orders}</td>}
                              {visibleColumns.lastOrderDate && (
                                <td className="text-nowrap text-center p-4">
                                  {client.orders[client.orders.length - 1]?.createdAt
                                    ? new Date(client.orders[client.orders.length - 1]?.createdAt).toLocaleDateString()
                                    : '-'}
                                </td>
                              )}
                              {visibleColumns.showOrders && (
                                <td className="text-nowrap text-center p-4">
                                  <button
                                    onClick={() => toggleOrders(client.id)}
                                    className="bg-transparent border border-border-color rounded p-1 hover:bg-teal-800/10"
                                  >
                                    {expandedClientId === client.id ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 rotate-90" />
                                    )}
                                  </button>
                                </td>
                              )}
                              {visibleColumns.remainingAmount && <td className="text-nowrap text-center p-4">-</td>}
                              {visibleColumns.notes && (
                                <td className="text-nowrap text-center p-4">
                                  <button 
                                    onClick={() => handleAddNotes(client.id, client.fullname || 'غير محدد')}
                                    className="flex items-center gap-1 text-primary-dark text-md hover:underline"
                                  >
                                    <DocumentTextIcon className="w-4 h-4" />
                                    <span>إضافة ملاحظة</span>
                                  </button>
                                </td>
                              )}
                              {visibleColumns.view && (
                                <td className="text-nowrap text-center p-4">
                                  <button 
                                    className="bg-transparent border border-border-color rounded p-1 hover:bg-teal-800/10" 
                                    onClick={() => {
                                      if(expandedNotesId === client.id){
                                        setExpandedNotesId(null);
                                      } else {
                                        setExpandedNotesId(client.id);
                                      }
                                    }}
                                  >
                                    <DownloadIcon className="w-4 h-4" />
                                  </button>
                                </td>
                              )}
                              {visibleColumns.edit && (
                                <td className="text-nowrap text-center p-4">
                                  <button 
                                    className="bg-transparent border border-border-color rounded p-1 hover:bg-teal-800/10"
                                    onClick={() => handleEditClient(client)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                            {expandedClientId === client.id && (
                              <tr>
                                <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="bg-background-light p-4">
                                  <table className="w-full border border-border-color rounded-md">
                                    <thead>
                                      <tr className="bg-teal-800 text-white text-md font-medium">
                                        <th className="text-nowrap text-center p-4">رقم الطلب</th>
                                        <th className="text-nowrap text-center p-4">اسم العامل</th>
                                        <th className="text-nowrap text-center p-4">حالة الحجز</th>
                                        <th className="text-nowrap text-center p-4">تاريخ الإنشاء</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {client.orders.length === 0 ? (
                                        <tr>
                                          <td colSpan={4} className="p-4 text-center text-text-dark">
                                            لا توجد طلبات
                                          </td>
                                        </tr>
                                      ) : (
                                        client.orders.map((order) => (
                                          <tr key={order.id} className="bg-background-light text-text-dark text-md">
                                            <td className="text-nowrap text-center cursor-pointer p-4" onClick={()=>router.push(`/admin/track_order/${order.id}`)}>#{order.id}</td>
                                            <td className="text-nowrap text-center p-4">{order.HomeMaid?.Name || '-'}</td>
                                            <td className="text-nowrap text-center p-4">{translateBookingStatus(order.bookingstatus) || '-'}</td>
                                            <td className="text-nowrap text-center p-4">
                                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            )}
                            {expandedNotesId === client.id && (
                              <tr>
                                <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="bg-background-light p-4">
                                  <table className="w-full border border-border-color rounded-md">
                                    <thead>
                                      <tr className="bg-teal-800 text-white text-md font-medium">
                                        <th className="text-nowrap text-center p-4">ملاحظات</th>
                                        <th className="text-nowrap text-center p-4">تاريخ الإنشاء</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {client.notes.length === 0 ? (
                                        <tr>
                                          <td colSpan={4} className="p-4 text-center text-text-dark">
                                            لا توجد ملاحظات
                                          </td>
                                        </tr>
                                      ) : (
                                        client.notes.map((n) => (
                                          <tr key={n.id} className="bg-background-light text-text-dark text-md">
                                            <td className="text-nowrap text-center p-4">{n.notes || '-'}</td>
                                            <td className="text-nowrap text-center p-4">
                                              {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '-'}
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </section>

                <footer className="flex flex-col sm:flex-row justify-between items-center p-5 mt-6">
                  <p className="text-base text-text-dark">
                    عرض {(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, totalClients)} من {totalClients} نتيجة
                  </p>
                  <nav className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 border border-border-color rounded text-md bg-background-light hover:bg-teal-800 hover:text-white disabled:opacity-50"
                    >
                      السابق
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => {
                          setCurrentPage(page);
                          setExpandedClientId(null);
                        }}
                        className={`px-2 py-1 border rounded text-md ${
                          currentPage === page
                            ? 'border-primary-dark bg-teal-800 text-white'
                            : 'border-border-color bg-background-light hover:bg-teal-800 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 border border-border-color rounded text-md bg-background-light hover:bg-teal-800 hover:text-white disabled:opacity-50"
                    >
                      التالي
                    </button>
                  </nav>
                </footer>
              </>
            )}
          </main>
        </div>
        <AddClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchClients}/>
        {selectedClient && (
          <AddNotesModal
            isOpen={isNotesModalOpen}
            onClose={() => {
              setIsNotesModalOpen(false);
              setSelectedClient(null);
            }}
            clientId={selectedClient.id}
            clientName={selectedClient.fullname || 'غير محدد'}
            onSuccess={handleNotesSuccess}
          />
        )}
        {selectedClient && (
          <EditClientModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedClient(null);
            }}
            client={selectedClient}
            onSubmit={handleEditClientSubmit}
            cities={cities}
            setNotification={setNotification}
          />
        )}
      </div>
    </Layout>
  );
};

const EditClientModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onSubmit: (client: Client) => void;
  cities: string[];
  setNotification: (notification: Notification | null) => void;
}> = ({ isOpen, onClose, client, onSubmit, cities, setNotification }) => {
  const [formData, setFormData] = useState<Client>(client);

  useEffect(() => {
    setFormData(client);
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-100 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-text-dark mb-4">تعديل بيانات العميل</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-dark">الاسم الكامل</label>
            <input
              type="text"
              name="fullname"
              value={formData.fullname || ''}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-border-color rounded-md py-2 px-4 text-md text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-dark"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-dark">رقم الجوال</label>
            <input
              type="text"
              name="phonenumber"
              value={formData.phonenumber || ''}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-border-color rounded-md py-2 px-4 text-md text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-dark"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-dark">رقم الهوية</label>
            <input
              type="text"
              name="nationalId"
              value={formData.nationalId || ''}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-border-color rounded-md py-2 px-4 text-md text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-dark"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-dark">المدينة</label>
            <select
              name="city"
              value={formData.city || ''}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-border-color rounded-md py-2  text-md text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-dark"
            >
              <option value="">اختر المدينة</option>
<option value = "Baha">الباحة</option>
<option value = "Jawf">الجوف</option>
<option value = "Qassim">القصيم</option>
<option value = "Hail">حائل</option>
<option value = "Jazan">جازان</option>
<option value = "Najran">نجران</option>
<option value = "Madinah">المدينة المنورة</option>
<option value = "Riyadh">الرياض</option>
<option value = "Al-Kharj">الخرج</option>
<option value = "Ad Diriyah">الدرعية</option>
<option value = "Al Majma'ah">المجمعة</option>
<option value = "Al Zulfi">الزلفي</option>
<option value = "Ad Dawadimi">الدوادمي</option>
<option value = "Wadi Ad Dawasir">وادي الدواسر</option>
<option value = "Afif">عفيف</option>
<option value = "Al Quway'iyah">القويعية</option>
<option value = "Shaqra">شقراء</option>
<option value = "Hotat Bani Tamim">حوطة بني تميم</option>
<option value = "Makkah">مكة المكرمة</option>
<option value = "Jeddah">جدة</option>
<option value = "Taif">الطائف</option>
<option value = "Rabigh">رابغ</option>
<option value = "Al Qunfudhah">القنفذة</option>
<option value = "Al Lith">الليث</option>
<option value = "Khulais">خليص</option>
<option value = "Ranyah">رنية</option>
<option value = "Turabah">تربة</option>
<option value = "Yanbu">ينبع</option>
<option value = "Al Ula">العلا</option>
<option value = "Badr">بدر</option>
<option value = "Al Hinakiyah">الحناكية</option>
<option value = "Mahd Al Dhahab">مهد الذهب</option>
<option value = "Dammam">الدمام</option>
<option value = "Al Khobar">الخبر</option>
<option value = "Dhahran">الظهران</option>
<option value = "Al Ahsa">الأحساء</option>
<option value = "Al Hufuf">الهفوف</option>
<option value = "Al Mubarraz">المبرز</option>
<option value = "Jubail">الجبيل</option>
<option value = "Hafr Al Batin">حفر الباطن</option>
<option value = "Al Khafji">الخفجي</option>
<option value = "Ras Tanura">رأس تنورة</option>
<option value = "Qatif">القطيف</option>
<option value = "Abqaiq">بقيق</option>
<option value = "Nairiyah">النعيرية</option>
<option value = "Qaryat Al Ulya">قرية العليا</option>
<option value = "Buraydah">بريدة</option>
<option value = "Unaizah">عنيزة</option>
<option value = "Ar Rass">الرس</option>
<option value = "Al Bukayriyah">البكيرية</option>
<option value = "Al Badaye">البدائع</option>
<option value = "Al Mithnab">المذنب</option>
<option value = "Riyad Al Khabra">رياض الخبراء</option>
<option value = "Abha">أبها</option>
<option value = "Khamis Mushait">خميس مشيط</option>
<option value = "Bisha">بيشة</option>
<option value = "Mahayil">محايل عسير</option>
<option value = "Al Namas">النماص</option>
<option value = "Tanomah">تنومة</option>
<option value = "Ahad Rafidah">أحد رفيدة</option>
<option value = "Sarat Abidah">سراة عبيدة</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-text-dark px-4 py-2 rounded-md text-md font-medium hover:bg-gray-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-teal-800 text-white px-4 py-2 rounded-md text-md font-medium hover:bg-teal-800/90"
            >
              حفظ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Customers;

export async function getServerSideProps({ req }: any) {
  try {
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie: string) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    if (!cookies.authToken) {
      return {
        redirect: { destination: "/admin/login", permanent: false },
      };
    }

    const token = jwtDecode(cookies.authToken) as any;

    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });

    const hasPermission = findUser && findUser.role?.permissions && 
      (findUser.role.permissions as any)["إدارة العملاء"]?.["عرض"];

    return {
      props: { hasPermission: !!hasPermission },
    };
  } catch (err) {
    console.error("Authorization error:", err);
    return {
      props: { hasPermission: false },
    };
  }
}
