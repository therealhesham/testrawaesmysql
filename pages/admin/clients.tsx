import AddClientModal from 'components/AddClientModal';
import Style from "styles/Home.module.css";
import { useState, useEffect } from 'react';
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

  // دالة تصدير PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont('Amiri');
    doc.setFontSize(12);
    doc.text("قائمة العملاء", 10, 10);

    const tableColumn = ["الرقم", "الاسم", "رقم الجوال", "الهوية", "المدينة", "عدد الطلبات", "تاريخ آخر طلب"];
    const tableRows: any[] = [];

    clients.forEach((client) => {
      const clientData = [
        client.id.toString(),
        client.fullname || '-',
        client.phonenumber || '-',
        client.nationalId || '-',
        client.city || '-',
        client._count.orders.toString(),
        client.orders[0]?.createdat ? new Date(client.orders[0].createdat).toLocaleDateString('ar-SA') : '-',
      ];
      tableRows.push(clientData);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      styles: { font: 'Amiri', halign: 'right', fontSize: 10 },
      headStyles: { fillColor: [0, 128, 128] },
      margin: { top: 20 },
    });

    doc.save('clients.pdf');
  };

  // دالة تصدير Excel
  const exportToExcel = () => {
    const worksheetData = clients.map((client) => ({
      الرقم: client.id,
      الاسم: client.fullname || '-',
      'رقم الجوال': client.phonenumber || '-',
      الهوية: client.nationalId || '-',
      المدينة: client.city || '-',
      'عدد الطلبات': client._count.orders,
      'تاريخ آخر طلب': client.orders[0]?.createdat
        ? new Date(client.orders[0].createdat).toLocaleDateString('ar-SA')
        : '-',
    }));

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
                        <option value="الرياض">الرياض</option>
                        <option value="جدة">جدة</option>
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
                    <div className="flex items-center bg-background-light border border-border-color rounded-md text-sm text-text-muted cursor-pointer">
                      <span>كل الاعمدة</span>
                      <Filter className="mr-2 w-4 h-4" />
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
                      className="flex items-center gap-1 bg-teal-800 text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-teal-800/90"
                    >
                      <FileText className="w-4 h-4" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={exportToExcel}
                      className="flex items-center gap-1 bg-teal-800 text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-teal-800/90"
                    >
                      <FileExcelOutlined className="w-4 h-4" />
                      <span>Excel</span>
                    </button>
                  </div>
                </section>

                <section className="bg-text-light border border-border-color rounded-md overflow-hidden">
                  <div className="grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_50px] gap-5 bg-teal-800 text-white text-sm font-medium p-4">
                    <div>الرقم</div>
                    <div>الاسم</div>
                    <div>رقم الجوال</div>
                    <div>الهوية</div>
                    <div>المدينة</div>
                    <div>عدد الطلبات</div>
                    <div>تاريخ آخر طلب</div>
                    <div>عرض الطلبات</div>
                    <div>المبلغ المتبقي</div>
                    <div>ملاحظات</div>
                    <div>عرض</div>
                  </div>
                  <div className="divide-y divide-border-color">
                    {loading ? (
                      <div className="p-4 text-center text-text-dark">جاري التحميل...</div>
                    ) : clients.length === 0 ? (
                      <div className="p-4 text-center text-text-dark">لا توجد بيانات</div>
                    ) : (
                      clients.map((client) => (
                        <div key={client.id}>
                          <div className="grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_50px] gap-5 bg-background-light text-text-dark text-xs p-4">
                            <div>#{client.id}</div>
                            <div>{client.fullname }</div>
                            <div>{client.phonenumber }</div>
                            <div>{client.nationalId }</div>
                            <div>{client.city }</div>
                            <div>{client._count.orders}</div>
                            <div>
                              {client.orders[0]?.createdat
                                ? new Date(client.orders[0].createdat).toLocaleDateString('ar-SA')
                                : '-'}
                            </div>
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
                            <div>-</div>
                            <div>
                              <a href="#" className="flex items-center gap-1 text-primary-dark text-xs hover:underline">
                                <DocumentTextIcon className="w-4 h-4" />
                                <span>إضافة ملاحظة</span>
                              </a>
                            </div>
                            <div>
                              <button className="bg-transparent border border-border-color rounded p-1 hover:bg-teal-800/10">
                                <Eye className="w-4 h-4 rotate-90" />
                              </button>
                            </div>
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
                                      className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 bg-background-light text-text-dark text-xs p-4"
                                    >
                                      <div>#{order.id}</div>
                                      <div>{order.HomeMaid?.Name || '-'}</div>
                                      <div>{order.bookingstatus || '-'}</div>
                                      <div>
                                        {order.createdat
                                          ? new Date(order.createdat).toLocaleDateString('ar-SA')
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
                      className="px-2 py-1 border border-border-color rounded text-xs bg-background-light hover:bg-teal-800 hover:text-white disabled:opacity-50"
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
                        className={`px-2 py-1 border rounded text-xs ${
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
                      className="px-2 py-1 border border-border-color rounded text-xs bg-background-light hover:bg-teal-800 hover:text-white disabled:opacity-50"
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


export async function getServerSideProps({ req }) {
  try {
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

    // 🔹 Check permission
    const hasPermission = findUser && findUser.role?.permissions?.["إدارة العملاء"]?.["عرض"];

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