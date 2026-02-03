import Layout from 'example/containers/Layout';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChartOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  LeftOutlined,
  RightOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

interface LogRow {
  id: number;
  Status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  Details: string | null;
  reason: string | null;
  userId: string | null;
  homemaidId: number | null;
  user: { username: string } | null;
}

interface Stats {
  total: number;
  topUsers: { userId: string; count: number }[];
  topDates: { date: string; count: number }[];
  topHours: { hour: number; count: number }[];
}

export default function Performance() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(20);
  const [statistics, setStatistics] = useState<Stats | null>(null);

  const fetchData = async (p = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/performance-ai-logs', {
        params: { page: p, pageSize },
      });
      setLogs(res.data.logs || []);
      setTotalCount(res.data.totalCount ?? 0);
      setTotalPages(res.data.totalPages ?? 1);
      setStatistics(res.data.statistics || null);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'حدث خطأ أثناء التحميل');
      setLogs([]);
      setStatistics(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12:00 ص';
    if (hour < 12) return `${hour}:00 ص`;
    if (hour === 12) return '12:00 م';
    return `${hour - 12}:00 م`;
  };

  return (
    <Layout>
      <Head>
        <title>أداء إضافة العمالة بالـ AI | لوحة التحكم</title>
      </Head>
      <div className="p-4 md:p-6" dir="rtl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b border-teal-200 pb-2">
          أداء إضافة عاملة جديدة بخاصية الـ AI
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* إحصائيات */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center">
                <BarChartOutlined className="!text-2xl text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">إجمالي الإضافات بالـ AI</p>
                <p className="text-2xl font-bold text-teal-800">{statistics.total}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <UserOutlined className="!text-xl text-indigo-600" />
                <span className="font-medium text-gray-800">أكثر المستخدمين رفعاً</span>
              </div>
              <ul className="space-y-2 max-h-32 overflow-y-auto">
                {statistics.topUsers.slice(0, 5).map((u, i) => (
                  <li key={u.userId} className="flex justify-between text-sm">
                    <span className="text-gray-700">{u.userId || 'غير محدد'}</span>
                    <span className="font-semibold text-teal-700">{u.count}</span>
                  </li>
                ))}
                {statistics.topUsers.length === 0 && (
                  <li className="text-gray-400 text-sm">لا توجد بيانات</li>
                )}
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <CalendarOutlined className="!text-xl text-amber-600" />
                <span className="font-medium text-gray-800">أكثر الأيام رفعاً</span>
              </div>
              <ul className="space-y-2 max-h-32 overflow-y-auto">
                {statistics.topDates.slice(0, 5).map((d) => (
                  <li key={d.date} className="flex justify-between text-sm">
                    <span className="text-gray-700">{new Date(d.date).toLocaleDateString('ar-EG')}</span>
                    <span className="font-semibold text-amber-700">{d.count}</span>
                  </li>
                ))}
                {statistics.topDates.length === 0 && (
                  <li className="text-gray-400 text-sm">لا توجد بيانات</li>
                )}
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <ClockCircleOutlined className="!text-xl text-emerald-600" />
                <span className="font-medium text-gray-800">أكثر الأوقات رفعاً</span>
              </div>
              <ul className="space-y-2 max-h-32 overflow-y-auto">
                {statistics.topHours.slice(0, 5).map((h) => (
                  <li key={h.hour} className="flex justify-between text-sm">
                    <span className="text-gray-700">{formatHour(h.hour)}</span>
                    <span className="font-semibold text-emerald-700">{h.count}</span>
                  </li>
                ))}
                {statistics.topHours.length === 0 && (
                  <li className="text-gray-400 text-sm">لا توجد بيانات</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* الجدول */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">سجلات إضافة عاملة جديدة بخاصية الـ AI</h2>
            <button
              type="button"
              onClick={() => fetchData(page)}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-50"
              title="تحديث"
            >
              <ReloadOutlined className={isLoading ? 'animate-spin' : ''} style={{ fontSize: 20 }} />
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-gray-500">جاري التحميل...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="bg-teal-800 text-white">
                      <th className="border border-gray-300 p-3">#</th>
                      <th className="border border-gray-300 p-3">التاريخ</th>
                      <th className="border border-gray-300 p-3">الحالة</th>
                      <th className="border border-gray-300 p-3">التفاصيل</th>
                      <th className="border border-gray-300 p-3">المستخدم (userId)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center p-8 text-gray-500">
                          لا توجد سجلات بهذه الحالة
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 p-3 text-gray-600">{log.id}</td>
                          <td className="border border-gray-200 p-3">{formatDate(log.createdAt)}</td>
                          <td className="border border-gray-200 p-3">{log.Status || '—'}</td>
                          <td className="border border-gray-200 p-3 max-w-xs truncate" title={log.Details || ''}>
                            {log.Details || '—'}
                          </td>
                          <td className="border border-gray-200 p-3 font-medium text-teal-700">
                            {log.userId || log.user?.username || 'غير محدد'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-gray-100">
                  <span className="text-sm text-gray-600">
                    عرض {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} من {totalCount}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RightOutlined style={{ fontSize: 18 }} />
                    </button>
                    <span className="text-sm font-medium">
                      {page} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LeftOutlined style={{ fontSize: 18 }} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
