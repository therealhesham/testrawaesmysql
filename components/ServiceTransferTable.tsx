import { useState, useEffect } from 'react';
import { FileExcelOutlined } from '@ant-design/icons';
import { Plus, FileText, Search, ChevronDown } from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Transfer {
  id: number;
  HomeMaid: { Name: string; Passportnumber: string; Nationalitycopy: string };
  NewClient: { fullname: string };
  OldClient: { fullname: string };
  transferStage?:string,
  ExperimentRate?: string;
  TransferingDate?: string;
}

export default function ServiceTransferTable({
  onAddTransaction,
  onEditTransaction,
}: {
  onAddTransaction: () => void;
  onEditTransaction: (id: number) => void;
}) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [data,setData]=useState<any[]>([])
  const exportedData = async ()=>{
const data = await fetch('/api/Export/transfersponserships');
const res = await data.json();
setData(res.homemaids)

}
useEffect(()=>{exportedData()},[])
  useEffect(() => {
    fetchTransfers();
  }, [statusFilter, stageFilter]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/transferSponsorShips');
      let data = response.data;

      // تطبيق الفلاتر
      if (statusFilter) {
        data = data.filter((transfer: Transfer) => transfer.ExperimentRate === statusFilter);
      }
      if (stageFilter) {
        data = data.filter((transfer: Transfer) => transfer.TransferingDate === stageFilter);
      }

      setTransfers(data);
      setLoading(false);
    } catch (err) {
      setError('فشل تحميل البيانات');
      setLoading(false);
    }
  };

  // Export to Excel using xlsx (similar logic to neworders)
  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    const worksheetData = data.map((row: any, index: number) => ({
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

  // Export to PDF using jsPDF + autotable (matching neworders styling)
  const exportToPDF = async () => {
    if (!data || data.length === 0) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    const doc = new jsPDF('landscape');

    // Try to load Amiri font (used across project for Arabic)
    try {
      const response = await fetch('/fonts/Amiri-Regular.ttf');
      if (response.ok) {
        const fontBuffer = await response.arrayBuffer();
        const fontBytes = new Uint8Array(fontBuffer);
        // Buffer may be available in the environment as in other files
        const fontBase64 = typeof Buffer !== 'undefined'
          ? Buffer.from(fontBytes).toString('base64')
          : btoa(String.fromCharCode(...fontBytes));
        doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
        doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
        doc.setFont('Amiri');
      }
    } catch (err) {
      // ignore font loading error and continue with default font
      console.error('Error loading Amiri font for PDF export', err);
    }

    const tableColumn = [
      '#',
      'اسم العاملة',
      'رقم الجواز',
      'العميل الحالي',
      'العميل الجديد',
      'حالة الطلب',
      'المرحلة الحالية',
      'تاريخ النقل',
    ];

    const tableRows = data.map((row: any, index: number) => [
      row.id ?? index + 1,
      row.HomeMaid?.Name || '-',
      row.HomeMaid?.Passportnumber || '-',
      row.OldClient?.fullname || '-',
      row.NewClient?.fullname || '-',
      row.ExperimentRate || 'غير محدد',
      row.transferStage || '-',
      row.TransferingDate || '-',
    ]);

    // @ts-ignore - types for autoTable come from jspdf-autotable
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      styles: { halign: 'right', font: doc.getFont().fontName || undefined },
      headStyles: { fillColor: [0, 105, 92], textColor: [255, 255, 255] },
      margin: { top: 20, right: 10, left: 10 },
      didDrawPage: (dataArg: any) => {
        const page = doc.getCurrentPageInfo().pageNumber;
        doc.text(`صفحة ${page}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10);
      },
    });

    doc.save('service_transfers.pdf');
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setStageFilter('');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-normal text-black">معاملات نقل الخدمات</h1>
        <button
          onClick={onAddTransaction}
          className="flex items-center gap-1 bg-teal-900 text-white text-md px-3 py-1.5 rounded-md hover:bg-teal-800"
        >
          <Plus className="w-4 h-4" />
          <span>اضافة معاملة</span>
        </button>
      </div>

      {/* Filters & Export */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        
        <div className="flex flex-wrap gap-2">
          <form className="flex items-center bg-gray-50 border border-gray-300 rounded-md ">
            <input
              type="search"
              placeholder="بحث"
              className="bg-transparent border-none text-md text-gray-500"
              onChange={(e) => {/* إضافة منطق البحث لاحقًا */}}
            />
            <Search className="w-4 h-4" />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-md text-md text-gray-500"
          >
            <option value="">حالة الطلب</option>
            <option value="جيد">جيد</option>
            <option value="متوسط">متوسط</option>
            <option value="ضعيف">ضعيف</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-md text-md text-gray-500"
          >
            <option value="">المرحلة الحالية</option>
            <option value="2025-08-17">انشاء الطلب</option>
            <option value="2025-08-18">انشاء العقد</option>
            <option value="2025-08-19">فترة التجربة</option>
            <option value="2025-08-20">تقييم التجربة</option>
            <option value="2025-08-21">نقل الخدمات</option>
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
                <div >{row.HomeMaid.Name}</div>
                <div >{row.HomeMaid.Passportnumber}</div>
                <div>{row.OldClient.fullname}</div>
                <div>{row.NewClient.fullname}</div>
                <div>{row.ExperimentRate || 'غير محدد'}</div>
                <div>{row.transferStage}</div>
                <div>غير محدد</div>
                <div>
                  <button
                    onClick={() => onEditTransaction(row.id)}
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
      <div className="flex justify-between items-center">
        <p className="text-base text-black">عرض {transfers.length} نتيجة</p>
        <nav className="flex gap-1">
          {/* إضافة منطق الـ pagination لاحقًا */}
          <a href="#" className="flex items-center justify-center min-w-[18px] h-[18px] px-2 border border-teal-900 rounded-sm text-md text-white bg-teal-900">1</a>
          <a href="#" className="flex items-center justify-center min-w-[18px] h-[18px] px-2 border border-gray-300 rounded-sm text-md text-gray-800 bg-gray-50">السابق</a>
        </nav>
      </div>
    </div>
  );
}