import { useState, useEffect } from 'react';
import { FileExcelOutlined } from '@ant-design/icons';
import { Plus, FileText, Search, ChevronDown } from 'lucide-react';
import axios from 'axios';

interface Transfer {
  id: number;
  HomeMaid: { Name: string; Passportnumber: string; Nationalitycopy: string };
  NewClient: { fullname: string };
  OldClient: { fullname: string };
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
          className="flex items-center gap-1 bg-teal-900 text-white text-xs px-3 py-1.5 rounded-md hover:bg-teal-800"
        >
          <Plus className="w-4 h-4" />
          <span>اضافة معاملة</span>
        </button>
      </div>

      {/* Filters & Export */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex gap-2">
          <button className="flex items-center gap-1 bg-teal-900 text-white text-xs px-2.5 py-1 rounded-md">
            <FileExcelOutlined className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button className="flex items-center gap-1 bg-teal-900 text-white text-xs px-2.5 py-1 rounded-md">
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <form className="flex items-center bg-gray-50 border border-gray-300 rounded-md px-2.5 py-2">
            <input
              type="search"
              placeholder="بحث"
              className="bg-transparent outline-none text-sm text-gray-500"
              onChange={(e) => {/* إضافة منطق البحث لاحقًا */}}
            />
            <Search className="w-4 h-4" />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-md px-2 py-2 text-xs text-gray-500"
          >
            <option value="">حالة الطلب</option>
            <option value="جيد">جيد</option>
            <option value="متوسط">متوسط</option>
            <option value="ضعيف">ضعيف</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-md px-2 py-2 text-xs text-gray-500"
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
            className="bg-teal-900 text-white text-xs px-3 py-1.5 rounded-md"
          >
            اعادة ضبط
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
          <div className="grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr_1fr_1fr_70px] bg-teal-900 text-white text-sm font-medium h-12 items-center px-5">
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
                className="grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr_1fr_1fr_70px] h-12 items-center px-5 border-b border-gray-300 text-xs text-gray-800 last:border-b-0"
              >
                <div>{row.id}</div>
                <div className="text-[11px]">{row.HomeMaid.Name}</div>
                <div className="text-[11px]">{row.HomeMaid.Passportnumber}</div>
                <div>{row.OldClient.fullname}</div>
                <div>{row.NewClient.fullname}</div>
                <div>{row.ExperimentRate || 'غير محدد'}</div>
                <div>{row.TransferingDate || 'غير محدد'}</div>
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
          <a href="#" className="flex items-center justify-center min-w-[18px] h-[18px] px-2 border border-teal-900 rounded-sm text-xs text-white bg-teal-900">1</a>
          <a href="#" className="flex items-center justify-center min-w-[18px] h-[18px] px-2 border border-gray-300 rounded-sm text-xs text-gray-800 bg-gray-50">السابق</a>
        </nav>
      </div>
    </div>
  );
}