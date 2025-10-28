// ServiceTransferTable.tsx
import { useState, useEffect } from 'react';
import { FileExcelOutlined } from '@ant-design/icons';
import { Plus, FileText, Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
interface Transfer {
  id: number;
  HomeMaid: { Name: string; Passportnumber: string; Nationalitycopy: string };
  NewClient: { fullname: string; city?: string; phonenumber?: string };
  OldClient: { fullname: string; city?: string; phonenumber?: string };
  transferStage?: string;
  ExperimentRate?: string;
  TransferingDate?: string;
}

interface Pagination {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function ServiceTransferTable({
  onAddTransaction,
  onEditTransaction,
}: {
  onAddTransaction: () => void;
  onEditTransaction: (id: number) => void;
}) {
  const router = useRouter();
  const user = jwtDecode<any>(localStorage.getItem('token') || '');
  const userName = user.username || '';
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [allData, setAllData] = useState<Transfer[]>([]); // للتصدير
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  // جلب كل البيانات للتصدير (مرة واحدة)
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const response = await axios.get('/api/Export/transfersponserships');
        setAllData(response.data.homemaids || []);
      } catch (err) {
        console.error('فشل جلب بيانات التصدير');
      }
    };
    fetchAllData();
  }, []);

  // جلب البيانات مع Pagination + Filters
  useEffect(() => {
    fetchTransfers();
  }, [currentPage, statusFilter, stageFilter, searchTerm]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit,
      };
      if (statusFilter) params.statusFilter = statusFilter;
      if (stageFilter) params.stageFilter = stageFilter;
      if (searchTerm) params.searchTerm = searchTerm;
      const response = await axios.get('/api/transferSponsorShips', { params });
      setTransfers(response.data.transfers);
      setPagination(response.data.pagination);
      setLoading(false);
    } catch (err) {
      setError('فشل تحميل البيانات');
      setLoading(false);
    }
  };

  // تصدير Excel (من allData + تطبيق الفلاتر محليًا)
  const exportToExcel = () => {
    let dataToExport = allData;

    if (statusFilter) {
      dataToExport = dataToExport.filter((t) => t.ExperimentRate === statusFilter);
    }
    if (stageFilter) {
      dataToExport = dataToExport.filter((t) => t.TransferingDate === stageFilter);
    }

    if (dataToExport.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    const worksheetData = dataToExport.map((row: any, index: number) => ({
      '#': row.id ?? index + 1,
      'اسم العاملة': row.HomeMaid?.Name || '-',
      'رقم الجواز': row.HomeMaid?.Passportnumber || '-',
      'العميل الحالي': row.OldClient?.fullname || '-',
      'العميل الجديد': row.NewClient?.fullname || '-',
      'حالة الطلب': row.ExperimentRate || 'غير محدد',
      'المرحلة الحالية': row.transferStage || '-',
      'تاريخ النقل': row.TransferingDate || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'نقل_الخدمات');
    XLSX.writeFile(wb, 'service_transfers.xlsx');
  };

  // تصدير PDF (نفس المنطق)
  const exportToPDF = async () => {
    let dataToExport = allData;

    if (searchTerm) {
      dataToExport = dataToExport.filter((t) => t.HomeMaid?.Name === searchTerm || t.HomeMaid?.Passportnumber === searchTerm || t.OldClient?.fullname === searchTerm || t.NewClient?.fullname === searchTerm);
    }
    if (statusFilter) {
      dataToExport = dataToExport.filter((t) => t.ExperimentRate === statusFilter);
    }
    if (stageFilter) {
      dataToExport = dataToExport.filter((t) => t.TransferingDate === stageFilter);
    }

    if (dataToExport.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    const doc = new jsPDF({orientation: 'landscape'});
    const pageWidth = doc.internal.pageSize.width;
const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
  const logoBuffer = await logo.arrayBuffer();
  const logoBytes = new Uint8Array(logoBuffer);
  const logoBase64 = Buffer.from(logoBytes).toString('base64');
    try {
      const response = await fetch('/fonts/Amiri-Regular.ttf');
      if (response.ok) {
        const fontBuffer = await response.arrayBuffer();
        const fontBytes = new Uint8Array(fontBuffer);
        const fontBase64 = typeof Buffer !== 'undefined'
          ? Buffer.from(fontBytes).toString('base64')
          : btoa(String.fromCharCode(...fontBytes));
        doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
        doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
        doc.setFont('Amiri');
      }
    } catch (err) {
      console.error('Error loading Amiri font for PDF export', err);
    }

    const tableColumn = [
      '#', 'اسم العاملة', 'رقم الجواز', 'العميل الحالي',
      'العميل الجديد', 'حالة الطلب', 'المرحلة الحالية', 'تاريخ النقل',
    ];

    const tableRows = dataToExport.map((row: any, index: number) => [
      row.id ?? index + 1,
      row.HomeMaid?.Name || '-',
      row.HomeMaid?.Passportnumber || '-',
      row.OldClient?.fullname || '-',
      row.NewClient?.fullname || '-',
      row.ExperimentRate || 'غير محدد',
      row.transferStage || '-',
      row.TransferingDate || '-',
    ]);

    // @ts-ignore
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      styles: { halign: 'right', font: doc.getFont().fontName || undefined },
      headStyles: { fillColor: [26, 77, 79], textColor: [255, 255, 255] },
      margin: { top: 40, right: 10, left: 10 },
   
       didDrawPage: (data: any) => {
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;

      // 🔷 إضافة اللوجو أعلى الصفحة (في كل صفحة)
      doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

      // 🔹 كتابة العنوان في أول صفحة فقط (اختياري)
      if (doc.getCurrentPageInfo().pageNumber === 1) {
        doc.setFontSize(12);
        doc.setFont('Amiri', 'normal');
        doc.text('معاملات نقل الخدمات', pageWidth / 2, 20, { align: 'right' });
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

    doc.save('service_transfers.pdf');
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setStageFilter('');
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-normal text-black">معاملات نقل الخدمات</h1>
        <button
          onClick={() => router.push('/admin/AddTransactionForm')}
          className="flex items-center gap-1 bg-teal-900 text-white text-md px-3 py-1.5 rounded-md hover:bg-teal-800"
        >
          <Plus className="w-4 h-4" />
          <span>اضافة معاملة</span>
        </button>
      </div>

      {/* Filters & Export */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <form className="flex items-center bg-gray-50 border border-gray-300 rounded-md">
            <input
              type="search"
              placeholder="بحث"
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="bg-transparent border-none text-md text-gray-500 px-2"
            />
            <Search className="w-4 h-4 mx-2" />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="bg-gray-50 border border-gray-300 rounded-md text-md text-gray-500  py-1"
          >
            <option value="">حالة الطلب</option>
            <option value="جيد">جيد</option>
            <option value="متوسط">متوسط</option>
            <option value="ضعيف">ضعيف</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => { setStageFilter(e.target.value); setCurrentPage(1); }}
            className="bg-gray-50 border border-gray-300 rounded-md text-md text-gray-500  py-1"
          >
            <option value="">المرحلة الحالية</option>
            <option value="انشاء الطلب">انشاء الطلب</option>
            <option value="انشاء العقد">انشاء العقد</option>
            <option value="فترة التجربة">فترة التجربة</option>
            <option value="تقييم التجربة">تقييم التجربة</option>
            <option value="نقل الخدمات">نقل الخدمات</option>
          </select>

          <button
            onClick={handleResetFilters}
            className="bg-teal-900 text-white text-md px-3 py-1.5 rounded-md"
          >
            اعادة ضبط
          </button>
        </div>

        <div className="flex gap-2">
          <button onClick={exportToExcel} className="flex items-center gap-1 bg-teal-900 text-white text-md px-2.5 py-1 rounded-md">
            <FileExcelOutlined className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button onClick={exportToPDF} className="flex items-center gap-1 bg-teal-900 text-white text-md px-2.5 py-1 rounded-md">
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p>جاري التحميل...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="bg-gray-50 border border-gray-300 rounded-md overflow-hidden">
          <div className="grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr_1fr_1fr_70px] bg-teal-900 text-white text-md font-medium h-12 items-center px-5">
            <div>#</div>
            <div>اسم العاملة</div>
            <div>رقم الجواز</div>
            <div>العميل الحالي</div>
            <div>العميل الجديد</div>
            <div>حالة الطلب</div>
            <div>المرحلة الحالية</div>
            <div>الموظف</div>
            <div>تفاصيل</div>
          </div>

          <div className="flex flex-col">
            {transfers.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr_1fr_1fr_70px] h-12 items-center px-5 border-b border-gray-300 text-md text-gray-800 last:border-b-0"
              >
                <div>{row.id}</div>
                <div>{row.HomeMaid.Name}</div>
                <div>{row.HomeMaid.Passportnumber}</div>
                <div>{row.OldClient.fullname}</div>
                <div>{row.NewClient.fullname}</div>
                <div>{row.ExperimentRate || 'غير محدد'}</div>
                <div>{row.transferStage || '-'}</div>
                <div>غير محدد</div>
                <div>
                  <button
                    onClick={() => router.push(`/admin/AddTransactionForm?id=${row.id}`)}
                    className="text-teal-900 text-center"
                  >
                    عرض
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="flex justify-between items-center mt-4">
          <p className="text-base text-black">
            عرض {transfers.length} من {pagination.total} نتيجة
          </p>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={!pagination.hasPrev}
              className={`p-1 rounded ${pagination.hasPrev ? 'text-teal-900' : 'text-gray-400'}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`min-w-[32px] h-8 px-2 rounded text-sm font-medium transition ${
                  page === currentPage
                    ? 'bg-teal-900 text-white'
                    : 'bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={!pagination.hasNext}
              className={`p-1 rounded ${pagination.hasNext ? 'text-teal-900' : 'text-gray-400'}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}