//@ts-nocheck
//@ts-ignore

import Layout from 'example/containers/Layout';
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { SearchIcon } from '@heroicons/react/outline';
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Style from 'styles/Home.module.css';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';
import { X } from 'lucide-react';
interface TableRow {
  workerId: string;
  orderId: string;
  workerName: string;
  clientName: string;
  nationality: string;
  passport: string;
  from: string;
  to: string;
  status: string;
  arrivalDate: string;
}

interface ApiResponse {
  data: {
    Order: {
      HomeMaid: {
        Name: string;
        Passportnumber: string;
        id: number;
        office: {
          Country: string;
        };
        age: number | null;
      };
      ClientName: string | null;
      id: number;
    };
    OrderId: number;
    HomemaidName: string;
    KingdomentryDate: string;
    KingdomentryTime: string;
    DeliveryDate: string;
    arrivalSaudiAirport: string;
    deparatureCityCountry: string;
    deparatureCityCountryDate: string;
    deparatureCityCountryTime: string;
    id: number;
  }[];
  totalPages: number;
}

const transformData = (data: any[]): TableRow[] => {
  return data.map((item) => ({
    workerId: String(item.Order?.HomeMaid?.id || 'غير محدد'),
    orderId: String(item.OrderId || 'غير محدد'),
    workerName: item.HomemaidName || item.Order?.HomeMaid?.Name || 'غير محدد',
    clientName: item.Order?.ClientName || 'غير متوفر',
    nationality: item.Order?.HomeMaid?.office?.Country || 'غير محدد',
    passport: item.Order?.HomeMaid?.Passportnumber || 'غير محدد',
    from: item.deparatureCityCountry || 'غير محدد',
    to: item.arrivalSaudiAirport || 'غير محدد',
    status: item.DeliveryDate ? 'وصلت' : 'لم تصل',
    arrivalDate: item.KingdomentryDate
      ? new Date(item.KingdomentryDate).toLocaleString('ar-EG', {
          dateStyle: 'short',
          timeStyle: 'short',
        }).replace(',', '<br>')
      : 'غير محدد',
  }));
};

const fetchData = async (
  page = 1,
  filters: {
    search: string;
    age: string;
    ArrivalCity: string;
    KingdomentryDate: string;
  },
  setData: (data: TableRow[]) => void,
  setTotalPages: (pages: number) => void,
  setLoading: (loading: boolean) => void,
  isFetchingRef: React.MutableRefObject<boolean>
) => {
  if (isFetchingRef.current) return;
  isFetchingRef.current = true;
  setLoading(true);

  try {
    const queryParams = new URLSearchParams({
      search: filters.search,
      age: filters.age,
      ArrivalCity: filters.ArrivalCity,
      KingdomentryDate: filters.KingdomentryDate,
      page: String(page),
      perPage: '10',
    });

    const response = await fetch(`/api/arrivals?${queryParams}`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });

    if (!response.ok) throw new Error('فشل جلب البيانات');
    const { data: res, totalPages: pages }: ApiResponse = await response.json();
    if (res && res.length > 0) {
      const transformedData = transformData(res);
      setData(transformedData);
      setTotalPages(pages || 1);
    } else {
      setData([]);
      setTotalPages(1);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    setData([]);
    setTotalPages(1);
  } finally {
    setLoading(false);
    isFetchingRef.current = false;
  }
};

const fetchCities = async (setCities: (cities: string[]) => void) => {
  try {
    const response = await fetch('/api/arrivals?perPage=1000', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });
    if (!response.ok) throw new Error('فشل جلب المدن');
    const { data }: ApiResponse = await response.json();
    const cities = Array.from(new Set(data.map((item) => item.arrivalSaudiAirport).filter((city): city is string => !!city && city.trim() !== '')));
    setCities(['كل المدن', ...cities]);
  } catch (error) {
    console.error('Error fetching cities:', error);
    setCities(['كل المدن']);
  }
};

const ColumnSelector = ({
  visibleColumns,
  setVisibleColumns,
}: {
  visibleColumns: string[];
  setVisibleColumns: (columns: string[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const columns = [
    { key: 'workerId', label: 'رقم العاملة' },
    { key: 'orderId', label: 'رقم الطلب' },
    { key: 'workerName', label: 'اسم العاملة' },
    { key: 'clientName', label: 'اسم العميل' },
    { key: 'nationality', label: 'الجنسية' },
    { key: 'passport', label: 'رقم الجواز' },
    { key: 'from', label: 'من' },
    { key: 'to', label: 'إلى' },
    { key: 'status', label: 'حالة الوصول' },
    { key: 'arrivalDate', label: 'تاريخ الوصول' },
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
        className="bg-gray-400 px-3 py-2 h-16 items-center align-baseline text-white rounded-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        اختر الأعمدة
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
          {columns.map((column) => (
            <label key={column.key} className="flex items-center gap-2 px-4 py-2 text-sm">
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

const Controls = ({
  setFilters,
  visibleColumns,
  setVisibleColumns,
  data,
}: {
  setFilters: (filters: any) => void;
  visibleColumns: string[];
  setVisibleColumns: (columns: string[]) => void;
  data: TableRow[];
}) => {
  const [cities, setCities] = useState<string[]>(['كل المدن']);
  const [selectedCity, setSelectedCity] = useState('كل المدن');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [exportedData, setExportedData] = useState<TableRow[]>([]);

  useEffect(() => {
    fetchCities(setCities);
  }, []);

  useEffect(() => {
    const arrivals = async () => {
      try {
        const response = await fetch('/api/Export/arrivals');
        if (!response.ok) throw new Error('فشل جلب بيانات التصدير');
        const jsonify = await response.json();
        const transformedData = transformData(jsonify.data);
        setExportedData(transformedData);
      } catch (error) {
        console.error('Error fetching arrivals:', error);
        setExportedData([]);
      }
    };
    arrivals();
  }, []);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setFilters((prev: any) => ({
      ...prev,
      ArrivalCity: city === 'كل المدن' ? '' : city,
    }));
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setFilters((prev: any) => ({
      ...prev,
      KingdomentryDate: date ? date.toISOString().split('T')[0] : '',
    }));
  };

  const exportToExcel = () => {
    const columnMap: { [key: string]: string } = {
      workerId: 'رقم العاملة',
      orderId: 'رقم الطلب',
      workerName: 'اسم العاملة',
      clientName: 'اسم العميل',
      nationality: 'الجنسية',
      passport: 'رقم الجواز',
      from: 'من',
      to: 'إلى',
      status: 'حالة الوصول',
      arrivalDate: 'تاريخ الوصول',
    };

    const filteredData = exportedData.map((row) =>
      visibleColumns.reduce((obj, col) => {
        obj[columnMap[col]] = row[col as keyof TableRow];
        return obj;
      }, {} as Record<string, string>)
    );

    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Arrivals');
    XLSX.writeFile(workbook, 'arrivals.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const columnMap: { [key: string]: string } = {
      workerId: 'رقم العاملة',
      orderId: 'رقم الطلب',
      workerName: 'اسم العاملة',
      clientName: 'اسم العميل',
      nationality: 'الجنسية',
      passport: 'رقم الجواز',
      from: 'من',
      to: 'إلى',
      status: 'حالة الوصول',
      arrivalDate: 'تاريخ الوصول',
    };

    doc.addFont('/fonts/Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.setFont('Amiri');
    doc.setFontSize(16);
    doc.text('قائمة الوصول', 200, 10, { align: 'center' });

    const tableColumns = visibleColumns.map((col) => columnMap[col]);
    const tableRows = exportedData.map((row) =>
      visibleColumns.map((col) => row[col as keyof TableRow] || '')
    );

    (doc as any).autoTable({
      head: [tableColumns],
      body: tableRows,
      styles: { font: 'Amiri', halign: 'right', fontSize: 10 },
      headStyles: { fillColor: [0, 105, 92], textColor: [255, 255, 255] },
      margin: { top: 30 },
      didDrawPage: () => {
        doc.setFontSize(10);
        doc.text(`صفحة ${doc.getCurrentPageInfo().pageNumber}`, 10, doc.internal.pageSize.height - 10);
      },
    });

    doc.save('arrivals.pdf');
  };

  return (
    <div className="flex flex-col justify-between mb-6 gap-4">
      <div className="flex flex-wrap justify-start gap-4">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-500">
          <SearchIcon className="w-4 h-4" />
          <input
            type="text"
            placeholder="بحث"
            onChange={(e) =>
              setFilters((prev: any) => ({ ...prev, search: e.target.value }))
            }
            className="bg-transparent border-none"
          />
        </div>
        <div className="relative flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-500 text-md">
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="bg-transparent border-none appearance-none w-full pr-8"
          >
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-500 text-md">
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="yyyy-MM-dd"
            placeholderText="اختر تاريخ"
            className="bg-transparent border-none text-right"
          />
        </div>
        <ColumnSelector visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns} />
        <button
          className="bg-teal-900 text-white px-3 py-2 rounded-md"
          onClick={() => {
            setFilters({
              search: '',
              age: '',
              ArrivalCity: '',
              KingdomentryDate: '',
            });
            setSelectedCity('كل المدن');
            setSelectedDate(null);
          }}
        >
          إعادة ضبط
        </button>
      </div>
      <div className="flex gap-3 justify-end">
        <button
          className="flex items-center gap-1 bg-teal-900 text-white px-3 py-1 rounded-md disabled:opacity-50"
          onClick={exportToExcel}
          disabled={exportedData.length === 0}
        >
          <FileExcelOutlined className="w-4 h-4" />
          <span>Excel</span>
        </button>
        <button
          className="flex items-center gap-1 bg-teal-900 text-white px-3 py-1 rounded-md disabled:opacity-50"
          onClick={exportToPDF}
          disabled={exportedData.length === 0}
        >
          <FilePdfOutlined className="w-4 h-4" />
          <span>PDF</span>
        </button>
      </div>
    </div>
  );
};

const Table = ({ data, visibleColumns }: { data: TableRow[]; visibleColumns: string[] }) => {
  const columns = [
    { key: 'workerId', label: 'رقم العاملة' },
    { key: 'orderId', label: 'رقم الطلب' },
    { key: 'workerName', label: 'اسم العاملة' },
    { key: 'clientName', label: 'اسم العميل' },
    { key: 'nationality', label: 'الجنسية' },
    { key: 'passport', label: 'رقم الجواز' },
    { key: 'from', label: 'من' },
    { key: 'to', label: 'إلى' },
    { key: 'status', label: 'حالة الوصول' },
    { key: 'arrivalDate', label: 'تاريخ الوصول' },
  ];

  return (
    <div className="border border-gray-300 rounded-md overflow-x-auto bg-white">
      <table className="w-full border-collapse min-w-[1000px]">
        <thead className="bg-teal-900 text-white text-sm">
          <tr>
            {columns
              .filter((col) => visibleColumns.includes(col.key))
              .map((col) => (
                <th key={col.key} className="p-4 text-right first:pr-6 last:pl-6 last:text-center">
                  {col.label}
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="bg-gray-50 border-b border-gray-300 last:border-b-0">
              {visibleColumns.includes('workerId') && (
                <td className="p-4 text-right pr-6">{row.workerId}</td>
              )}
              {visibleColumns.includes('orderId') && (
                <td className="p-4 text-right">{row.orderId}</td>
              )}
              {visibleColumns.includes('workerName') && (
                <td className="p-4 text-right">{row.workerName}</td>
              )}
              {visibleColumns.includes('clientName') && (
                <td className="p-4 text-right">{row.clientName}</td>
              )}
              {visibleColumns.includes('nationality') && (
                <td className="p-4 text-right">{row.nationality}</td>
              )}
              {visibleColumns.includes('passport') && (
                <td className="p-4 text-right">{row.passport}</td>
              )}
              {visibleColumns.includes('from') && (
                <td className="p-4 text-right">{row.from}</td>
              )}
              {visibleColumns.includes('to') && (
                <td className="p-4 text-right">{row.to}</td>
              )}
              {visibleColumns.includes('status') && (
                <td className="p-4 text-right">
                  <span className="text-black">{row.status}</span>
                </td>
              )}
              {visibleColumns.includes('arrivalDate') && (
                <td className="p-4 text-center" dangerouslySetInnerHTML={{ __html: row.arrivalDate }} />
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Pagination = ({
  currentPage,
  totalPages,
  setPage,
}: {
  currentPage: number;
  totalPages: number;
  setPage: (page: number) => void;
}) => (
  <div className="flex flex-col md:flex-row justify-between items-center mt-6 px-5">
    <p className="text-base text-black">
      عرض {(currentPage - 1) * 10 + 1} - {Math.min(currentPage * 10, totalPages * 10)} من{' '}
      {totalPages * 10} نتيجة
    </p>
    <nav className="flex items-center gap-1">
      <a
        href="#"
        className={`px-3 py-1 text-md rounded-sm border border-gray-300 bg-gray-50 text-gray-800 ${
          currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={(e) => {
          e.preventDefault();
          if (currentPage > 1) setPage(currentPage - 1);
        }}
      >
        السابق
      </a>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <a
          key={page}
          href="#"
          className={`px-2 py-1 text-md rounded-sm border border-gray-300 bg-gray-50 text-white ${
            page === currentPage ? 'bg-teal-900 text-gray-50 border-teal-900' : ''
          }`}
          onClick={(e) => {
            e.preventDefault();
            setPage(page);
          }}
        >
          {page}
        </a>
      ))}
      <a
        href="#"
        className={`px-3 py-1 text-md rounded-sm border border-gray-300 bg-gray-50 text-gray-800 ${
          currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={(e) => {
          e.preventDefault();
          if (currentPage < totalPages) setPage(currentPage + 1);
        }}
      >
        التالي
      </a>
    </nav>
  </div>
);

const Modal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-gray-100 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">هل ترغب بتأكيد وصول العاملة؟</h2>
        <label className="block text-right text-sm font-medium text-gray-800 mb-2">
          إضافة ملاحظات إن وجدت
        </label>
        <textarea
          className="w-full min-h-[70px] p-3 border border-gray-300 rounded-lg bg-gray-50 text-right focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-teal-900/20 mb-6"
          placeholder="إضافة ملاحظة"
        ></textarea>
        <div className="flex justify-center gap-6">
          <button
            className="border border-gray-800 text-gray-800 rounded-md px-6 py-2 text-base hover:bg-teal-900 hover:text-white"
            onClick={onClose}
          >
            إلغاء
          </button>
          <button className="bg-teal-900 text-white rounded-md px-6 py-2 text-base hover:bg-teal-900">
            نعم
          </button>
        </div>
      </div>
    </div>
  );
};

const PermissionModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-[1000]">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center relative">
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
        <p className="text-red-600">غير مصرح لك بعرض هذه الصفحة</p>
        <button
          className="bg-teal-900 text-white px-4 py-2 rounded mt-4 hover:bg-teal-800 transition duration-200"
          onClick={onClose}
        >
          موافق
        </button>
      </div>
    </div>
  );
};

export default function Home({ hasPermission }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(!hasPermission);
  const [data, setData] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    age: '',
    ArrivalCity: '',
    KingdomentryDate: '',
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'workerId',
    'orderId',
    'workerName',
    'clientName',
    'nationality',
    'passport',
    'from',
    'to',
    'status',
    'arrivalDate',
  ]);
  const isFetchingRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (hasPermission) {
      fetchData(currentPage, filters, setData, setTotalPages, setLoading, isFetchingRef);
    }
  }, [currentPage, filters, hasPermission]);

  const closePermissionModal = () => {
    setShowPermissionModal(false);
    router.push('/admin/home');
  };

  return (
    <Layout>
      <div className={`font-tajawal  text-gray-800 min-h-screen ${Style['tajawal-regular']}`} dir="rtl">
        <Head>
          <title>قائمة الوصول</title>
          
        </Head>
        <div className="max-w-7xl mx-auto">
          <main className="p-6 md:p-8">
            {hasPermission ? (
              <>
                <h1 className="text-3xl font-normal text-black mb-6 text-right">قائمة الوصول</h1>
                <Controls
                  setFilters={setFilters}
                  visibleColumns={visibleColumns}
                  setVisibleColumns={setVisibleColumns}
                  data={data}
                />
                {loading ? (
                  <div className="text-center">جاري التحميل...</div>
                ) : data.length === 0 ? (
                  <div className="text-center">لا توجد بيانات متاحة</div>
                ) : (
                  <>
                    <Table data={data} visibleColumns={visibleColumns} />
                    <Pagination currentPage={currentPage} totalPages={totalPages} setPage={setCurrentPage} />
                  </>
                )}
              </>
            ) : (
              <div>
                <h1 className="text-3xl font-normal text-black mb-6 text-right">الصفحة الرئيسية</h1>
                <p className="text-gray-600 mt-4">مرحبًا بك في لوحة التحكم. يرجى اختيار إجراء من القائمة.</p>
              </div>
            )}
          </main>
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
          <PermissionModal isOpen={showPermissionModal} onClose={closePermissionModal} />
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req }) {
  try {
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
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

    const hasPermission = findUser && findUser.role?.permissions?.["إدارة الوصول و المغادرة"]?.["عرض"];

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