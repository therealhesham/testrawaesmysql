import AddClientModal from 'components/AddClientModal';
import Style from "styles/Home.module.css";
import { useState, useEffect, useRef } from 'react';
import { Plus, Search, ChevronDown, Calendar, Filter, FileText, Eye, ChevronRight, ChevronUp } from 'lucide-react';
import { FileExcelOutlined } from '@ant-design/icons';
import { DocumentTextIcon } from '@heroicons/react/outline';
import Layout from 'example/containers/Layout';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { jwtDecode } from 'jwt-decode';
import prisma from 'lib/prisma';

interface Order {
  id: number;
  bookingstatus: string | null;
  createdat: string | null;
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
}

interface Props {
  hasPermission: boolean; // إضافة خاصية hasPermission
}

const Customers = ({ hasPermission }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(!hasPermission); // مودال الصلاحية
  const [clients, setClients] = useState<Client[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedClientId, setExpandedClientId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    fullname: '',
    phonenumber: '',
    city: 'all',
    date: '',
  });
  const [loading, setLoading] = useState(false);
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const columnDropdownRef = useRef<HTMLDivElement>(null);
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
    view: true
  });

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
    if (!hasPermission) return; // لا تجلب البيانات إذا لم يكن لديه صلاحية
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

  // إضافة مستمع للنقر خارج القائمة المنسدلة
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target as Node)) {
        setIsColumnDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const toggleColumn = (columnKey: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const selectAllColumns = () => {
    setVisibleColumns({
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
      view: true
    });
  };

  const deselectAllColumns = () => {
    setVisibleColumns({
      id: false,
      fullname: false,
      phonenumber: false,
      nationalId: false,
      city: false,
      ordersCount: false,
      lastOrderDate: false,
      showOrders: false,
      remainingAmount: false,
      notes: false,
      view: false
    });
  };

  const columnLabels = {
    id: 'الرقم',
    fullname: 'الاسم',
    phonenumber: 'رقم الجوال',
    nationalId: 'الهوية',
    city: 'المدينة',
    ordersCount: 'عدد الطلبات',
    lastOrderDate: 'تاريخ آخر طلب',
    showOrders: 'عرض الطلبات',
    remainingAmount: 'المبلغ المتبقي',
    notes: 'ملاحظات',
    view: 'عرض'
  };

  // دالة تصدير PDF
  const exportToPDF = async () => {
    const doc = new jsPDF();
    
    try {
      // تحميل خط Amiri بشكل صحيح
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
      // استخدام الخط الافتراضي في حالة فشل تحميل Amiri
      doc.setFont('helvetica', 'normal');
    }

    doc.setLanguage('ar');
    doc.setFontSize(16);
    doc.text("قائمة العملاء", 200, 10, { align: 'center' });

    // إنشاء أعمدة الجدول بناء على الأعمدة المرئية
    const tableColumn: string[] = [];
    const columnKeys: string[] = [];
    
    if (visibleColumns.id) { tableColumn.push("الرقم"); columnKeys.push("id"); }
    if (visibleColumns.fullname) { tableColumn.push("الاسم"); columnKeys.push("fullname"); }
    if (visibleColumns.phonenumber) { tableColumn.push("رقم الجوال"); columnKeys.push("phonenumber"); }
    if (visibleColumns.nationalId) { tableColumn.push("الهوية"); columnKeys.push("nationalId"); }
    if (visibleColumns.city) { tableColumn.push("المدينة"); columnKeys.push("city"); }
    if (visibleColumns.ordersCount) { tableColumn.push("عدد الطلبات"); columnKeys.push("ordersCount"); }
    if (visibleColumns.lastOrderDate) { tableColumn.push("تاريخ آخر طلب"); columnKeys.push("lastOrderDate"); }
    if (visibleColumns.remainingAmount) { tableColumn.push("المبلغ المتبقي"); columnKeys.push("remainingAmount"); }

    const tableRows: any[] = [];

    clients.forEach((client) => {
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
            clientData.push(client.city || '-');
            break;
          case "ordersCount":
            clientData.push(client._count.orders.toString());
            break;
          case "lastOrderDate":
              clientData.push(client.orders[0]?.createdat ? new Date(client.orders[0]?.createdat).toLocaleDateString() : '-');
            break;
          case "remainingAmount":
            clientData.push('-');
            break;
          default:
            clientData.push('-');
        }
      });
      
      tableRows.push(clientData);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      styles: { font: 'Amiri', halign: 'right', fontSize: 10 },
      headStyles: { fillColor: [0, 105, 92], textColor: [255, 255, 255] },
      margin: { top: 30 },
      didDrawPage: () => {
        doc.setFontSize(10);
        doc.text(`صفحة ${doc.getCurrentPageInfo().pageNumber}`, 10, doc.internal.pageSize.height - 10);
      },
    });

    doc.save('clients.pdf');
  };

  // دالة تصدير Excel
  const exportToExcel = () => {
    const worksheetData = clients.map((client) => {
      const clientData: any = {};
      
      if (visibleColumns.id) clientData['الرقم'] = client.id;
      if (visibleColumns.fullname) clientData['الاسم'] = client.fullname || '-';
      if (visibleColumns.phonenumber) clientData['رقم الجوال'] = client.phonenumber || '-';
      if (visibleColumns.nationalId) clientData['الهوية'] = client.nationalId || '-';
      if (visibleColumns.city) clientData['المدينة'] = client.city || '-';
      if (visibleColumns.ordersCount) clientData['عدد الطلبات'] = client._count.orders;
      if (visibleColumns.lastOrderDate) {
        clientData['تاريخ آخر طلب'] = client.orders[0]?.createdat
          ? new Date(client.orders[0]?.createdat).toLocaleDateString()
          : '-';
      }
      if (visibleColumns.remainingAmount) clientData['المبلغ المتبقي'] = '-';
      
      return clientData;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');
    XLSX.writeFile(workbook, 'clients.xlsx');
  };

  return (
    <Layout>
      <div className={`max-w-6xl mx-auto bg-primary-light min-h-screen ${Style["tajawal-regular"]}`}>
        <div className="flex flex-col">
          <main className="flex-grow p-6 sm:p-8 overflow-y-auto">
            {/* مودال عدم الصلاحية */}
            {isPermissionModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                  <h2 className="text-xl font-semibold text-text-dark mb-4">غير مصرح</h2>
                  <p className="text-text-muted mb-6">ليس لديك صلاحية لعرض هذه الصفحة.</p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => (window.location.href = '/admin/home')}
                      className="bg-teal-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-800/90"
                    >
                      العودة إلى الرئيسية
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* باقي المكون كما هو إذا كان لديه صلاحية */}
            {hasPermission && (
              <>
                <section className="flex justify-between items-center mb-6">
                  <h1 className="text-3xl font-normal text-text-dark">قائمة العملاء</h1>
                  <button
                    className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-800/90"
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
                        className="w-full bg-background-light border border-border-color rounded-md py-2 pr-10 pl-4 text-sm text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-dark"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                    </div>
                    <div className="flex items-center bg-background-light border border-border-color rounded-md text-sm text-text-muted cursor-pointer">
                      <select
                        value={filters.city}
                        onChange={(e) => handleFilterChange('city', e.target.value)}
                        className="bg-transparent w-full text-sm text-text-muted focus:outline-none border-none"
                      >
                        <option value="all">كل المدن</option>
                        {cities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center bg-background-light border border-border-color rounded-md text-sm text-text-muted cursor-pointer">
                      <input
                        type="date"
                        value={filters.date}
                        onChange={(e) => handleFilterChange('date', e.target.value)}
                        className="bg-transparent w-full text-sm text-text-muted focus:outline-none border-none"
                      />
                      <Calendar className="mr-2 w-4 h-4" />
                    </div>
                    <div className="relative" ref={columnDropdownRef}>
                      <button
                        onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                        className="flex items-center bg-background-light border border-border-color rounded-md px-3 py-2 text-sm text-text-muted hover:bg-gray-50"
                      >
                        <span>تحديد الاعمدة</span>
                        <Filter className="mr-2 w-4 h-4" />
                        <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isColumnDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isColumnDropdownOpen && (
                        <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-border-color rounded-md shadow-lg z-10 max-h-80 overflow-y-auto">
                          <div className="p-3 border-b border-border-color">
                            <div className="flex gap-2">
                              <button
                                onClick={selectAllColumns}
                                className="flex-1 px-2 py-1 text-xs bg-teal-800 text-white rounded hover:bg-teal-700"
                              >
                                تحديد الكل
                              </button>
                              <button
                                onClick={deselectAllColumns}
                                className="flex-1 px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                              >
                                إلغاء الكل
                              </button>
                            </div>
                          </div>
                          <div className="p-2">
                            {Object.entries(columnLabels).map(([key, label]) => (
                              <label key={key} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                checked={visibleColumns[key as keyof typeof visibleColumns]}
                                onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                                  className="w-4 h-4 text-teal-800 border-gray-300 rounded focus:ring-teal-500"
                                />
                                <span className="text-sm text-text-dark">{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleResetFilters}
                      className="bg-teal-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-800/90"
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

                <section className="bg-text-light border border-border-color rounded-md overflow-hidden">
                  <div className="grid gap-5 bg-teal-800 text-white text-sm font-medium p-4" style={{
                    gridTemplateColumns: `${Object.entries(visibleColumns).filter(([_, visible]) => visible).map(() => '1fr').join(' ')}`
                  }}>
                    {visibleColumns.id && <div>الرقم</div>}
                    {visibleColumns.fullname && <div>الاسم</div>}
                    {visibleColumns.phonenumber && <div>رقم الجوال</div>}
                    {visibleColumns.nationalId && <div>الهوية</div>}
                    {visibleColumns.city && <div>المدينة</div>}
                    {visibleColumns.ordersCount && <div>عدد الطلبات</div>}
                    {visibleColumns.lastOrderDate && <div>تاريخ آخر طلب</div>}
                    {visibleColumns.showOrders && <div>عرض الطلبات</div>}
                    {visibleColumns.remainingAmount && <div>المبلغ المتبقي</div>}
                    {visibleColumns.notes && <div>ملاحظات</div>}
                    {visibleColumns.view && <div>عرض</div>}
                  </div>
                  <div className="divide-y divide-border-color">
                    {loading ? (
                      <div className="p-4 text-center text-text-dark">جاري التحميل...</div>
                    ) : clients.length === 0 ? (
                      <div className="p-4 text-center text-text-dark">لا توجد بيانات</div>
                    ) : (
                      clients.map((client) => (
                        <div key={client.id}>
                          <div className="grid gap-5 bg-background-light text-text-dark text-md p-4" style={{
                            gridTemplateColumns: `${Object.entries(visibleColumns).filter(([_, visible]) => visible).map(() => '1fr').join(' ')}`
                          }}>
                            {visibleColumns.id && <div>#{client.id}</div>}
                            {visibleColumns.fullname && <div>{client.fullname}</div>}
                            {visibleColumns.phonenumber && <div>{client.phonenumber}</div>}
                            {visibleColumns.nationalId && <div>{client.nationalId}</div>}
                            {visibleColumns.city && <div>{client.city}</div>}
                            {visibleColumns.ordersCount && <div>{client._count.orders}</div>}
                            {visibleColumns.lastOrderDate && (
                              <div>
                                {client.orders[0]?.createdat
                                  ? new Date(client.orders[0]?.createdat).toLocaleDateString()
                                  : '-'}
                              </div>
                            )}
                            {visibleColumns.showOrders && (
                              <div>
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
                              </div>
                            )}
                            {visibleColumns.remainingAmount && <div>-</div>}
                            {visibleColumns.notes && (
                              <div>
                                <a href="#" className="flex items-center gap-1 text-primary-dark text-md hover:underline">
                                  <DocumentTextIcon className="w-4 h-4" />
                                  <span>إضافة ملاحظة</span>
                                </a>
                              </div>
                            )}
                            {visibleColumns.view && (
                              <div>
                                <button className="bg-transparent border border-border-color rounded p-1 hover:bg-teal-800/10">
                                  <Eye className="w-4 h-4 rotate-90" />
                                </button>
                              </div>
                            )}
                          </div>
                          {expandedClientId === client.id && (
                            <div className="bg-background-light p-4">
                              <div className="border border-border-color rounded-md overflow-hidden">
                                <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 bg-teal-800 text-white text-sm font-medium p-4">
                                  <div>رقم الطلب</div>
                                  <div>اسم العامل</div>
                                  <div>حالة الحجز</div>
                                  <div>تاريخ الإنشاء</div>
                                </div>
                                {client.orders.length === 0 ? (
                                  <div className="p-4 text-center text-text-dark">لا توجد طلبات</div>
                                ) : (
                                  client.orders.map((order) => (
                                    <div
                                      key={order.id}
                                      className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 bg-background-light text-text-dark text-md p-4"
                                    >
                                      <div>#{order.id}</div>
                                      <div>{order.HomeMaid?.Name || '-'}</div>
                                      <div>{order.bookingstatus || '-'}</div>
                                      <div>
                                        {order.createdat
                                          ? new Date(order.createdat).toLocaleDateString()
                                          : '-'}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
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
        <AddClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </Layout>
  );
};

export default Customers;


export async function getServerSideProps({ req }: any) {
  try {
    // 🔹 Extract cookies
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie: string) => {
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
    const token = jwtDecode(cookies.authToken) as any;

    // 🔹 Fetch user & role with Prisma
    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });

    // 🔹 Check permission
    const hasPermission = findUser && findUser.role?.permissions && 
      (findUser.role.permissions as any)["إدارة العملاء"]?.["عرض"];

    return {
      props: { hasPermission: !!hasPermission }, // إرجاع حالة الصلاحية
    };
  } catch (err) {
    console.error("Authorization error:", err);
    return {
      props: { hasPermission: false }, // في حالة الخطأ، اعتبر أنه لا توجد صلاحية
    };
  }
}