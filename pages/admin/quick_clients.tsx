import React, { useState, useEffect } from 'react';
import Layout from 'example/containers/Layout';
import { Search, Filter, Phone, Trash2, Edit } from 'lucide-react';
import { TableIcon } from '@heroicons/react/outline';
import Style from "styles/Home.module.css";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ToastContext } from 'components/GlobalToast';
import ExcelJS from 'exceljs';

interface QuickClient {
  id: number;
  phoneNumber: string;
  notes: string;
  clientName: string | null;
  source: string | null;
  createdAt: string;
}

const QuickClients = () => {
  const [clients, setClients] = useState<QuickClient[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = React.useContext(ToastContext);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quickclients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Extract unique sources and reasons for filters
  const uniqueSources = Array.from(new Set(clients.map(c => c.source).filter((s): s is string => Boolean(s))));
  
  // Extract main reasons from notes (e.g., getting the text before dash or specific keywords if any, but since notes are free text, we can use keywords or just show a text search)
  // The user requested filtering by reason (السبب المسجل). The reasons are predefined from the quick notes array:
  const predefinedReasons = [
    'غلطان بالرقم',
    'العميل يسأل عن عاملات بالشهر',
    'استفسار عن الأسعار',
    'العميل يستفسر عن التفاويض',
    'طلب خادمة جديدة',
    'العميل يستفسر عن عاملة من الجنسية',
    'شكوى / مشكلة'
  ];

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      (client.phoneNumber || '').includes(searchTerm) || 
      (client.clientName || '').includes(searchTerm) ||
      (client.notes || '').includes(searchTerm);
      
    const matchesSource = sourceFilter === 'all' || client.source === sourceFilter;
    
    // For reason filter, check if the note includes the selected reason
    const matchesReason = reasonFilter === 'all' || (client.notes || '').includes(reasonFilter);

    return matchesSearch && matchesSource && matchesReason;
  });

  const exportToExcel = async () => {
    if (!filteredClients || filteredClients.length === 0) {
      if (showToast) showToast('لا توجد بيانات لتصديرها', 'error');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('الاتصالات السريعة', {
        properties: { defaultColWidth: 20 },
        views: [{ rightToLeft: true }],
      });

      // الأعمدة
      worksheet.columns = [
        { header: 'م', key: 'index', width: 8 },
        { header: 'رقم الجوال', key: 'phoneNumber', width: 20 },
        { header: 'اسم العميل', key: 'clientName', width: 25 },
        { header: 'الاستفسار / الملاحظات', key: 'notes', width: 45 },
        { header: 'المصدر', key: 'source', width: 18 },
        { header: 'تاريخ الاتصال', key: 'callDate', width: 18 },
        { header: 'وقت الاتصال', key: 'callTime', width: 15 },
      ];

      // تنسيق الترويسة
      const headerRow = worksheet.getRow(1);
      headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A4D4F' },
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 28;

      filteredClients.forEach((client, idx) => {
        const clientDate = new Date(client.createdAt);
        const row = worksheet.addRow({
          index: idx + 1,
          phoneNumber: client.phoneNumber,
          clientName: client.clientName || 'غير مسجل',
          notes: client.notes,
          source: client.source || 'غير محدد',
          callDate: format(clientDate, 'yyyy/MM/dd'),
          callTime: format(clientDate, 'hh:mm a', { locale: ar }),
        });

        row.font = { name: 'Arial', size: 10 };
        row.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };

        const phoneCell = row.getCell('phoneNumber');
        phoneCell.alignment = { horizontal: 'center', vertical: 'middle' };

        const indexCell = row.getCell('index');
        indexCell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `الاتصالات_السريعة_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      if (showToast) showToast('تم تصدير ملف الإكسل بنجاح', 'success');
    } catch (error) {
      console.error('Excel export error:', error);
      if (showToast) showToast('حدث خطأ أثناء تصدير ملف الإكسل', 'error');
    }
  };

  return (
    <Layout>
      <div className={`p-6 ${Style["tajawal-regular"]}`} dir="rtl">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">العملاء المحتملين (الاتصالات السريعة)</h1>
            <p className="text-gray-500 mt-1">سجل العملاء الذين تم إدخالهم عبر نافذة الاتصال السريع</p>
          </div>
          <button 
            onClick={() => window.dispatchEvent(new Event('openQuickClientModal'))}
            className="bg-[#1A4D4F] hover:bg-[#164044] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Phone className="w-4 h-4" />
            إضافة اتصال جديد
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="البحث برقم الجوال، الاسم، أو الملاحظات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1A4D4F] focus:ring-1 focus:ring-[#1A4D4F]"
            />
          </div>
          
          <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto items-center">
            <div className="relative min-w-[180px]">
              <select 
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full pr-4 pl-10 py-2 border border-gray-200 rounded-lg focus:outline-none appearance-none bg-none bg-white text-gray-700 font-medium text-sm"
              >
                <option value="all">كل المصادر</option>
                {uniqueSources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>

            <div className="relative min-w-[180px]">
              <select 
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                className="w-full pr-4 pl-10 py-2 border border-gray-200 rounded-lg focus:outline-none appearance-none bg-none bg-white text-gray-700 font-medium text-sm"
              >
                <option value="all">كل الأسباب</option>
                {predefinedReasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>

            <button
              onClick={exportToExcel}
              disabled={loading || filteredClients.length === 0}
              className="flex items-center gap-1 px-3 py-2 rounded bg-teal-900 hover:bg-teal-800 text-white text-md font-tajawal shrink-0 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="تصدير إلى Excel"
            >
              <TableIcon className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-gray-700 font-bold text-sm">رقم الجوال</th>
                  <th className="px-6 py-4 text-gray-700 font-bold text-sm w-1/3">الاستفسار / الملاحظات</th>
                  <th className="px-6 py-4 text-gray-700 font-bold text-sm">اسم العميل</th>
                  <th className="px-6 py-4 text-gray-700 font-bold text-sm">المصدر</th>
                  <th className="px-6 py-4 text-gray-700 font-bold text-sm">تاريخ الاتصال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      جاري تحميل البيانات...
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      لا يوجد عملاء محتملين مسجلين
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-800" dir="ltr">{client.phoneNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-700 whitespace-pre-wrap">{client.notes}</div>
                      </td>
                      <td className="px-6 py-4">
                        {client.clientName ? (
                          <span className="text-gray-700 font-medium">{client.clientName}</span>
                        ) : (
                          <span className="text-gray-400 text-sm italic">غير مسجل</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {client.source ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                            {client.source}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-700">{format(new Date(client.createdAt), 'yyyy/MM/dd')}</span>
                          <span className="text-xs">{format(new Date(client.createdAt), 'hh:mm a', { locale: ar })}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QuickClients;
