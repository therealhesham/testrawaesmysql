import Layout from 'example/containers/Layout';
import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowRight, Search, FileText, Check, AlertCircle } from 'lucide-react';
import Style from 'styles/Home.module.css';

interface Worker {
  orderId: number;
  workerName: string;
  passport: string;
  nationality: string;
  clientName: string;
  clientPhone: string;
  clientNationalId: string;
  from: string;
  to: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
}

export default function AddBulkArrival() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Form Fields for Destinations (same as order details Destinations form)
  const [formData, setFormData] = useState({
    departureCity: '',
    arrivalCity: '',
    departureDate: '',
    departureTime: '',
    arrivalDate: '',
    arrivalTime: '',
  });

  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [progressMsg, setProgressMsg] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bulk-arrival-search?search=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) throw new Error('فشل جلب العاملات');
      const data = await res.json();
      setWorkers(data.data || []);
      setSelectedIds([]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ غير متوقع أثناء البحث');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(workers.map((w) => w.orderId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectWorker = (orderId: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, orderId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== orderId));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTicketFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      setError('يرجى اختيار عاملة واحدة على الأقل من الجدول لإجراء التحديث الجماعي');
      return;
    }

    if (!formData.departureCity.trim() || !formData.arrivalCity.trim()) {
      setError('مدينة المغادرة ومدينة الوصول حقول مطلوبة');
      return;
    }

    if (!formData.departureDate || !formData.arrivalDate) {
      setError('يجب تحديد تاريخ المغادرة وتاريخ الوصول لإتمام إضافة الوصول');
      return;
    }

    const departureDateTime = new Date(`${formData.departureDate}T${formData.departureTime || '00:00'}`);
    const arrivalDateTime = new Date(`${formData.arrivalDate}T${formData.arrivalTime || '00:00'}`);

    if (arrivalDateTime < departureDateTime) {
      setError('تاريخ ووقت الوصول لا يمكن أن يسبق تاريخ ووقت المغادرة');
      return;
    }

    setUpdating(true);
    setError(null);
    setProgressMsg('');

    try {
      let uploadedFilePath: string | null = null;

      // 1. Upload ticket file if provided (using the first order ID as a helper to generate presigned url, then shared)
      if (ticketFile) {
        setProgressMsg('جاري رفع ملف التذكرة...');
        const firstId = selectedIds[0];
        const presignedRes = await fetch(`/api/upload-presigned-url/${firstId}`);
        if (!presignedRes.ok) throw new Error('فشل الحصول على رابط رفع الملف');
        const { url, filePath } = await presignedRes.json();
        
        const uploadRes = await fetch(url, {
          method: 'PUT',
          body: ticketFile,
          headers: {
            'Content-Type': ticketFile.type || 'application/pdf',
            'x-amz-acl': 'public-read',
          },
        });
        if (!uploadRes.ok) throw new Error('فشل رفع ملف التذكرة للسيرفر');
        uploadedFilePath = filePath;
      }

      // 2. Perform bulk update order by order
      for (let i = 0; i < selectedIds.length; i++) {
        const orderId = selectedIds[i];
        setProgressMsg(`جاري تحديث العقد ${i + 1} من ${selectedIds.length}...`);

        const updatedData: Record<string, string> = {
          'مدينة المغادرة': formData.departureCity,
          'مدينة الوصول': formData.arrivalCity,
          'تاريخ ووقت المغادرة_date': formData.departureDate,
          'تاريخ ووقت المغادرة_time': formData.departureTime,
          'تاريخ ووقت الوصول_date': formData.arrivalDate,
          'تاريخ ووقت الوصول_time': formData.arrivalTime,
          'تاريخ ووقت المغادرة': `${formData.departureDate} ${formData.departureTime || '00:00'}`.trim(),
          'تاريخ ووقت الوصول': `${formData.arrivalDate} ${formData.arrivalTime || '00:00'}`.trim(),
        };

        if (uploadedFilePath) {
          updatedData.ticketFile = uploadedFilePath;
        }

        // Call the exact same PATCH endpoint used in track_order
        const res = await fetch(`/api/track_order/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section: 'destinations', updatedData }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(`خطأ في تحديث العقد رقم ${orderId}: ${errData.error || 'فشل الحفظ'}`);
        }
      }

      setAlertMsg('تم تحديث بيانات الوصول الجماعي بنجاح لجميع العاملات المحددة!');
      setWorkers([]);
      setSelectedIds([]);
      setFormData({
        departureCity: '',
        arrivalCity: '',
        departureDate: '',
        departureTime: '',
        arrivalDate: '',
        arrivalTime: '',
      });
      setTicketFile(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء إجراء التحديث الجماعي');
    } finally {
      setUpdating(false);
      setProgressMsg('');
    }
  };

  return (
    <Layout>
      <div className={`font-tajawal w-full text-gray-800 min-h-screen ${Style['tajawal-regular']}`} dir="rtl">
        <Head>
          <title>إضافة وصول جماعي</title>
        </Head>
        
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          {/* Header Row */}
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4 border-b border-gray-100 pb-5">
            <div>
              <h1 className="text-3xl font-extrabold text-teal-950">إضافة وصول جماعي</h1>
              <p className="text-sm text-gray-500 mt-1.5 font-medium">تحديث بيانات الرحلة والوصول لعدة عاملات قادمات في نفس الرحلة بضغطة واحدة</p>
            </div>
            <button
              onClick={() => router.push('/admin/arrival-list')}
              className="flex items-center gap-2 bg-gray-50 text-gray-700 hover:bg-gray-100 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold shadow-sm transition-all"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة لقائمة الوصول</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold shadow-sm animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {alertMsg && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold shadow-sm animate-in fade-in duration-200">
              <Check className="w-5 h-5 flex-shrink-0 bg-emerald-100 rounded-full p-0.5 text-emerald-800" />
              <span>{alertMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Right: Workers Search & Selection Table (Span 2) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-900 flex items-center justify-center text-xs font-black">1</span>
                  <span>البحث واختيار العاملات</span>
                </h3>
                
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex gap-2.5 mb-6">
                  <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-grow focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-700/10 transition-all shadow-sm">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="بحث باسم العاملة، الجواز، العميل، الهاتف، أو رقم الطلب..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400 w-full font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-teal-900 text-white px-6 rounded-xl hover:bg-teal-950 font-semibold text-sm h-12 shadow-sm transition-colors disabled:opacity-50"
                  >
                    {loading ? 'جاري البحث...' : 'بحث'}
                  </button>
                </form>

                {/* Workers Selection Table */}
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="w-full border-collapse text-right text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                        <th className="py-3.5 px-4 w-12 text-center">
                          <input
                            type="checkbox"
                            className="rounded text-teal-800 focus:ring-teal-700 h-4.5 w-4.5 border-gray-300 cursor-pointer"
                            checked={workers.length > 0 && selectedIds.length === workers.length}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                          />
                        </th>
                        <th className="py-3.5 px-4">العاملة والجنسية</th>
                        <th className="py-3.5 px-4">رقم الجواز</th>
                        <th className="py-3.5 px-4">العميل والجوال</th>
                        <th className="py-3.5 px-4">الرحلة الحالية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {workers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400 font-medium bg-gray-50/20">
                            ابحث عن العاملات لتحديدهن وإضافتهن للرحلة جماعياً.
                          </td>
                        </tr>
                      ) : (
                        workers.map((worker) => (
                          <tr
                            key={worker.orderId}
                            className={`hover:bg-teal-50/10 transition-colors ${
                              selectedIds.includes(worker.orderId) ? 'bg-teal-50/20' : ''
                            }`}
                          >
                            <td className="py-4 px-4 text-center">
                              <input
                                type="checkbox"
                                className="rounded text-teal-800 focus:ring-teal-700 h-4.5 w-4.5 border-gray-300 cursor-pointer"
                                checked={selectedIds.includes(worker.orderId)}
                                onChange={(e) => handleSelectWorker(worker.orderId, e.target.checked)}
                              />
                            </td>
                            <td className="py-4 px-4 font-bold text-teal-950">
                              <div>{worker.workerName}</div>
                              <span className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">
                                {worker.nationality}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-mono text-gray-500 font-semibold">{worker.passport}</td>
                            <td className="py-4 px-4">
                              <div className="font-semibold text-gray-800">{worker.clientName}</div>
                              <div className="text-xs text-gray-400 font-mono mt-0.5">{worker.clientPhone}</div>
                            </td>
                            <td className="py-4 px-4">
                              {worker.from && worker.to ? (
                                <div className="text-xs font-semibold text-gray-600">
                                  <span>{worker.from} ← {worker.to}</span>
                                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">{worker.arrivalDate}</div>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic font-medium">غير محدد</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {workers.length > 0 && (
                  <div className="text-xs text-gray-500 font-bold mt-3 text-right">
                    تم تحديد <span className="text-teal-900">{selectedIds.length}</span> عاملة من أصل <span className="text-gray-800">{workers.length}</span> عاملة معروضة.
                  </div>
                )}
              </div>
            </div>

            {/* Left: Shared Destination Form (Span 1) */}
            <div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-5 sticky top-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2.5 border-b border-gray-50 pb-3">
                  <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-900 flex items-center justify-center text-xs font-black">2</span>
                  <span>بيانات الرحلة المشتركة</span>
                </h3>

                {/* Departure City */}
                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-bold text-gray-500">مدينة المغادرة</label>
                  <input
                    type="text"
                    placeholder="مثل: دكا"
                    value={formData.departureCity}
                    onChange={(e) => setFormData({ ...formData, departureCity: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-800 focus:bg-white focus:border-teal-700 outline-none transition-all shadow-sm"
                  />
                </div>

                {/* Arrival City */}
                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-bold text-gray-500">مدينة الوصول (مطار الوصول السعودي)</label>
                  <input
                    type="text"
                    placeholder="مثل: المدينة المنورة"
                    value={formData.arrivalCity}
                    onChange={(e) => setFormData({ ...formData, arrivalCity: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-800 focus:bg-white focus:border-teal-700 outline-none transition-all shadow-sm"
                  />
                </div>

                {/* Departure Date & Time */}
                <div className="grid grid-cols-2 gap-3 text-right">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500">تاريخ المغادرة</label>
                    <input
                      type="date"
                      value={formData.departureDate}
                      onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-800 focus:bg-white focus:border-teal-700 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500">وقت المغادرة</label>
                    <input
                      type="time"
                      value={formData.departureTime}
                      onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-800 focus:bg-white focus:border-teal-700 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Arrival Date & Time */}
                <div className="grid grid-cols-2 gap-3 text-right">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500">تاريخ الوصول</label>
                    <input
                      type="date"
                      value={formData.arrivalDate}
                      onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-800 focus:bg-white focus:border-teal-700 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500">وقت الوصول</label>
                    <input
                      type="time"
                      value={formData.arrivalTime}
                      onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-800 focus:bg-white focus:border-teal-700 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Ticket File Upload */}
                <div className="space-y-2 text-right">
                  <label className="block text-xs font-bold text-gray-500">تحميل ملف التذكرة (PDF)</label>
                  <div className="relative border border-dashed border-gray-200 hover:border-teal-700 rounded-xl bg-gray-50/50 p-4 transition-colors flex flex-col items-center justify-center cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <FileText className="w-7 h-7 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-700 font-bold truncate max-w-xs text-center">
                      {ticketFile ? ticketFile.name : 'تصفح ملف التذكرة'}
                    </span>
                  </div>
                </div>

                {/* Submit Action Block */}
                <div className="pt-4 border-t border-gray-50">
                  <button
                    onClick={handleSubmit}
                    disabled={updating}
                    className="w-full bg-teal-900 text-white py-3 rounded-xl hover:bg-teal-950 font-bold text-sm shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>{updating ? 'جاري التحديث...' : 'حفظ وتحديث الوصول الجماعي'}</span>
                  </button>
                  
                  {updating && progressMsg && (
                    <div className="mt-3 text-center text-xs text-teal-800 font-bold bg-teal-50 border border-teal-100 p-2 rounded-lg animate-pulse">
                      {progressMsg}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
