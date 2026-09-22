import React, { useState, useEffect, useCallback } from 'react';
import Layout from 'example/containers/Layout';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  ShieldCheck, 
  Building, 
  Phone, 
  User, 
  CreditCard, 
  Tag, 
  Calendar, 
  RefreshCw, 
  Filter, 
  Copy, 
  Check, 
  Users
} from 'lucide-react';
import { FaStar } from 'react-icons/fa';
import { TableIcon } from '@heroicons/react/outline';
import Style from 'styles/Home.module.css';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ToastContext } from 'components/GlobalToast';
import ExcelJS from 'exceljs';

interface DiscountClient {
  id: number;
  full_name: string;
  phone: string;
  national_id: string;
  city_sector: string;
  registration_number: string;
  status: string;
  created_at: string;
  department: string;
}

interface FilterOptions {
  sectors: string[];
  departments: string[];
}

interface Stats {
  totalRegistrations: number;
  confirmedCount: number;
  sectorsCount: number;
  departmentsCount: number;
}

const DiscountClientsPage = () => {
  const { showToast } = React.useContext(ToastContext);

  // Verification states
  const [verifyQuery, setVerifyQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    performed: boolean;
    isEligible: boolean;
    message: string;
    client?: DiscountClient;
    allMatches?: DiscountClient[];
  } | null>(null);

  // Table & list states
  const [clients, setClients] = useState<DiscountClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Filters & search
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Stats & filter options
  const [stats, setStats] = useState<Stats>({
    totalRegistrations: 0,
    confirmedCount: 0,
    sectorsCount: 0,
    departmentsCount: 0,
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    sectors: [],
    departments: [],
  });

  // Fetch all discount clients
  const fetchDiscountClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (sectorFilter !== 'all') params.append('city_sector', sectorFilter);
      if (deptFilter !== 'all') params.append('department', deptFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('all', 'true'); // get full list for client-side search & fast interaction

      const res = await fetch(`/api/discount-clients?${params.toString()}`);
      if (!res.ok) throw new Error('فشل جلب البيانات');
      const data = await res.json();

      setClients(data.data || []);
      if (data.stats) {
        setStats(data.stats);
      }
      if (data.filterOptions) {
        setFilterOptions(data.filterOptions);
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast('حدث خطأ أثناء تحميل بيانات عملاء الخصومات', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sectorFilter, deptFilter, statusFilter, showToast]);

  useEffect(() => {
    fetchDiscountClients();
  }, [fetchDiscountClients]);

  // Handle instant verification check
  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!verifyQuery.trim()) {
      if (showToast) showToast('يرجى إدخال رقم الهوية، الجوال أو رقم التسجيل للتحقق', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/discount-clients/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: verifyQuery.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setVerifyResult({
          performed: true,
          isEligible: data.isEligible,
          message: data.message,
          client: data.client,
          allMatches: data.allMatches,
        });

        if (data.isEligible) {
          if (showToast) showToast('العميل مسجل ومؤهل للحصول على الخصم ✅', 'success');
        } else {
          if (showToast) showToast('العميل غير مسجل بقائمة الخصومات ❌', 'error');
        }
      } else {
        setVerifyResult({
          performed: true,
          isEligible: false,
          message: data.message || 'حدث خطأ أثناء التحقق',
        });
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setVerifyResult({
        performed: true,
        isEligible: false,
        message: 'تعذر الاتصال بخادم قاعدة البيانات',
      });
      if (showToast) showToast('تعذر الاتصال بخادم قاعدة البيانات', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  // Quick Copy Helper
  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    if (showToast) showToast(`تم نسخ: ${text}`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Export to Excel
  const exportToExcel = async () => {
    if (!clients || clients.length === 0) {
      if (showToast) showToast('لا توجد بيانات لتصديرها', 'error');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('عملاء الخصومات', {
        properties: { defaultColWidth: 22 },
        views: [{ rightToLeft: true }],
      });

      worksheet.columns = [
        { header: 'م', key: 'index', width: 8 },
        { header: 'الاسم الكامل', key: 'full_name', width: 25 },
        { header: 'رقم الجوال', key: 'phone', width: 18 },
        { header: 'رقم الهوية / الإثبات', key: 'national_id', width: 22 },
        { header: 'الجهة / القطاع', key: 'city_sector', width: 28 },
        { header: 'الإدارة / القسم', key: 'department', width: 25 },
        { header: 'رقم التسجيل (الكود)', key: 'registration_number', width: 18 },
        { header: 'الحالة', key: 'status', width: 15 },
        { header: 'تاريخ التسجيل', key: 'created_at', width: 22 },
      ];

      // Styling Header
      const headerRow = worksheet.getRow(1);
      headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A4D4F' },
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 28;

      clients.forEach((c, idx) => {
        const cDate = c.created_at ? new Date(c.created_at) : null;
        const formattedDate = cDate ? format(cDate, 'yyyy/MM/dd hh:mm a', { locale: ar }) : '-';

        const row = worksheet.addRow({
          index: idx + 1,
          full_name: c.full_name,
          phone: c.phone,
          national_id: c.national_id || '-',
          city_sector: c.city_sector || '-',
          department: c.department || '-',
          registration_number: c.registration_number,
          status: c.status === 'confirmed' ? 'مؤكد' : c.status,
          created_at: formattedDate,
        });

        row.font = { name: 'Arial', size: 10 };
        row.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };

        const centerCells = ['index', 'phone', 'registration_number', 'status', 'created_at'];
        centerCells.forEach((key) => {
          row.getCell(key).alignment = { horizontal: 'center', vertical: 'middle' };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `عملاء_الخصومات_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
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
      <div className={`p-4 md:p-6 space-y-6 ${Style['tajawal-regular']}`} dir="rtl">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-800 text-white rounded-xl shadow-md">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  عملاء الخصومات
                  <span className="text-xs bg-teal-100 text-teal-800 font-semibold px-2.5 py-0.5 rounded-full border border-teal-200">
                    التحقق من الأحقية
                  </span>
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  التحقق الفوري من أحقية العملاء للحصول على الخصومات وعرض المسجلين في المناسبات والعروض الخاصة
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDiscountClients()}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </button>
            <button
              onClick={exportToExcel}
              disabled={loading || clients.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TableIcon className="w-4 h-4" />
              تصدير Excel
            </button>
          </div>
        </div>

        {/* 🌟 1. Interactive Instant Verification Tool (أداة التحقق السريع) */}
        <div className="bg-gradient-to-br from-teal-900 via-[#1A4D4F] to-[#12383a] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <FaStar className="w-5 h-5 text-amber-300" />
              <h2 className="text-lg md:text-xl font-bold text-white">التحقق الفوري من أحقية الخصم</h2>
            </div>
            <p className="text-teal-100/90 text-sm mb-5 max-w-2xl leading-relaxed">
              أدخل رقم الهوية، أو رقم الجوال، أو رقم التسجيل (الكود) للتأكد المباشر من تسجيل العميل وأهليته للاستفادة من خصم المناسبات.
            </p>

            <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3 max-w-3xl">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="أدخل رقم الهوية، رقم الجوال (مثل 05xxxxxxxx)، أو الكود (مثل RC94-2942)..."
                  value={verifyQuery}
                  onChange={(e) => setVerifyQuery(e.target.value)}
                  className="w-full px-4 py-3.5 pr-11 bg-white/95 text-gray-900 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 font-medium text-sm md:text-base shadow-inner"
                />
                <Search className="w-5 h-5 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                type="submit"
                disabled={isVerifying || !verifyQuery.trim()}
                className="px-6 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg hover:shadow-teal-500/25 transition-all flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    تحقق الآن
                  </>
                )}
              </button>
            </form>

            {/* Verification Result Card */}
            {verifyResult && verifyResult.performed && (
              <div className="mt-6 transition-all duration-300">
                {verifyResult.isEligible && verifyResult.client ? (
                  <div className="bg-white text-gray-900 rounded-xl p-5 border-2 border-emerald-500 shadow-2xl">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-7 h-7" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xl font-bold text-gray-900">{verifyResult.client.full_name}</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ مؤهل للخصم (مسجل)
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">{verifyResult.message}</p>
                        </div>
                      </div>

                      <div className="bg-teal-50 border border-teal-200 rounded-lg p-2.5 px-4 flex items-center gap-3 self-stretch md:self-auto justify-between">
                        <div>
                          <span className="text-xs text-teal-700 block font-medium">رقم التسجيل / الكود</span>
                          <span className="text-base font-bold text-teal-900 font-mono" dir="ltr">
                            {verifyResult.client.registration_number}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(verifyResult.client!.registration_number, 'verify_reg')}
                          className="p-1.5 text-teal-700 hover:text-teal-900 hover:bg-teal-100 rounded-md transition-colors"
                          title="نسخ الكود"
                        >
                          {copiedField === 'verify_reg' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Client Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                          <Phone className="w-3.5 h-3.5 text-teal-600" />
                          رقم الجوال
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900 font-mono text-sm" dir="ltr">
                            {verifyResult.client.phone}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(verifyResult.client!.phone, 'verify_phone')}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title="نسخ رقم الجوال"
                          >
                            {copiedField === 'verify_phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                          <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                          رقم الهوية / الإثبات
                        </span>
                        <span className="font-semibold text-gray-900 block truncate">
                          {verifyResult.client.national_id || 'غير مسجل'}
                        </span>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                          <Building className="w-3.5 h-3.5 text-teal-600" />
                          الجهة / القطاع
                        </span>
                        <span className="font-semibold text-gray-900 block truncate">
                          {verifyResult.client.city_sector || '-'}
                        </span>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          الإدارة / تاريخ التسجيل
                        </span>
                        <span className="font-semibold text-gray-900 block truncate">
                          {verifyResult.client.department ? `${verifyResult.client.department} • ` : ''}
                          {verifyResult.client.created_at ? format(new Date(verifyResult.client.created_at), 'yyyy/MM/dd') : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 text-red-900 rounded-xl p-5 border-2 border-red-400 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-red-900 mb-1">غير مؤهل للخصم / غير مسجل</h3>
                      <p className="text-sm text-red-700 leading-relaxed">
                        لم يتم العثور على أي تسجيل مطابق لـ <span className="font-mono font-bold font-sans underline">{verifyQuery}</span> في قاعدة بيانات عملاء الخصومات.
                      </p>
                      <p className="text-xs text-red-500 mt-2">
                        يرجى التأكد من صحة رقم الجوال، أو رقم الهوية، أو كود التسجيل والمحاولة مرة أخرى.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 📊 2. Statistics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">إجمالي المسجلين</span>
              <span className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 block">
                {stats.totalRegistrations || clients.length}
              </span>
            </div>
            <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">التسجيلات المؤكدة</span>
              <span className="text-2xl md:text-3xl font-bold text-emerald-700 mt-1 block">
                {stats.confirmedCount || clients.filter((c) => c.status === 'confirmed').length}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">القطاعات والجهات</span>
              <span className="text-2xl md:text-3xl font-bold text-blue-700 mt-1 block">
                {stats.sectorsCount || filterOptions.sectors.length}
              </span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
              <Building className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">الإدارات والأقسام</span>
              <span className="text-2xl md:text-3xl font-bold text-purple-700 mt-1 block">
                {stats.departmentsCount || filterOptions.departments.length}
              </span>
            </div>
            <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
              <Tag className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 🔍 3. Filters & Search Section */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="البحث بالاسم، رقم الجوال، الهوية، رقم التسجيل، الجهة، أو القسم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  مسح
                </button>
              )}
            </div>

            {/* Filter: Sector */}
            <div className="relative min-w-[200px]">
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="w-full pr-8 pl-8 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 font-medium focus:outline-none focus:border-teal-700 appearance-none"
              >
                <option value="all">جميع القطاعات / الجهات</option>
                {filterOptions.sectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
              <Building className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
            </div>

            {/* Filter: Department */}
            <div className="relative min-w-[180px]">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full pr-8 pl-8 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 font-medium focus:outline-none focus:border-teal-700 appearance-none"
              >
                <option value="all">جميع الأقسام</option>
                {filterOptions.departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <Tag className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
            </div>

            {/* Filter: Status */}
            <div className="relative min-w-[150px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pr-8 pl-8 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 font-medium focus:outline-none focus:border-teal-700 appearance-none"
              >
                <option value="all">جميع الحالات</option>
                <option value="confirmed">مؤكد (confirmed)</option>
              </select>
              <ShieldCheck className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 📋 4. Main Data Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
            <span className="text-sm font-bold text-gray-700">
              قائمة العملاء المسجلين ({clients.length} عميل)
            </span>
            <span className="text-xs text-gray-500">
              قاعدة البيانات: <span className="font-mono font-semibold">job.national_day_registrations</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-100/80 border-b border-gray-200 text-gray-700 text-xs font-bold uppercase">
                <tr>
                  <th className="px-4 py-3.5 text-center w-12">#</th>
                  <th className="px-4 py-3.5">الاسم الكامل</th>
                  <th className="px-4 py-3.5">رقم الجوال</th>
                  <th className="px-4 py-3.5">رقم الهوية / الإثبات</th>
                  <th className="px-4 py-3.5">الجهة / القطاع</th>
                  <th className="px-4 py-3.5">الإدارة / القسم</th>
                  <th className="px-4 py-3.5 text-center">رقم التسجيل (الكود)</th>
                  <th className="px-4 py-3.5 text-center">الحالة</th>
                  <th className="px-4 py-3.5">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-teal-700" />
                        <span>جاري تحميل بيانات العملاء...</span>
                      </div>
                    </td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-gray-300" />
                        <span className="font-semibold text-gray-700">لا يوجد عملاء مطابقين للبحث</span>
                        <span className="text-xs text-gray-400">جرب تغيير معايير البحث أو الفلاتر</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  clients.map((client, idx) => (
                    <tr 
                      key={client.id} 
                      className="hover:bg-teal-50/40 transition-colors group cursor-pointer"
                      onClick={() => {
                        setVerifyQuery(client.registration_number || client.phone);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      title="انقر لملء أداة التحقق السريع بهذا العميل"
                    >
                      <td className="px-4 py-3.5 text-center text-xs font-mono text-gray-400">
                        {idx + 1}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900 group-hover:text-teal-900 transition-colors">
                          {client.full_name}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-gray-800" dir="ltr">
                          <span>{client.phone}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(client.phone, `phone_${client.id}`);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-teal-700 transition-opacity"
                            title="نسخ رقم الجوال"
                          >
                            {copiedField === `phone_${client.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-gray-700">
                        {client.national_id ? (
                          <span className="text-xs font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                            {client.national_id}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-100">
                          {client.city_sector || 'الهيئة الملكية'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-gray-600 text-xs">
                        {client.department || '-'}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-teal-50 text-teal-900 px-2.5 py-1 rounded border border-teal-200" dir="ltr">
                          <span>{client.registration_number}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(client.registration_number, `reg_${client.id}`);
                            }}
                            className="p-0.5 hover:text-teal-700 transition-colors"
                            title="نسخ الكود"
                          >
                            {copiedField === `reg_${client.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {client.status === 'confirmed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            مؤكد
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
                            {client.status || '-'}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        {client.created_at ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-700">
                              {format(new Date(client.created_at), 'yyyy/MM/dd')}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {format(new Date(client.created_at), 'hh:mm a', { locale: ar })}
                            </span>
                          </div>
                        ) : (
                          '-'
                        )}
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

export default DiscountClientsPage;
