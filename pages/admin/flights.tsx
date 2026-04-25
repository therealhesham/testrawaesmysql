import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Layout from 'example/containers/Layout';
import Style from 'styles/Home.module.css';
import { ArrowRight, Trash2 } from 'lucide-react';

interface FlightRow {
  id: number;
  order_id: number;
  reference_id: string | null;
  airlines: string | null;
  flight_number: string | null;
  departure_date: string | null;
  departure_time: string | null;
  arrival_date: string | null;
  arrival_time: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;
  ticketFile: string | null;
  createdAt: string | null;
  order: {
    id: number;
    bookingstatus: string | null;
    clientName: string | null;
  } | null;
}

export default function FlightsPage() {
  const [rows, setRows] = useState<FlightRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; rowId: number | null }>({
    open: false,
    rowId: null,
  });

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tickets-details', { credentials: 'include' });
      const json = (await res.json()) as { data?: FlightRow[]; error?: string };
      if (!res.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : 'فشل تحميل البيانات');
      }
      setRows(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRows();
  }, []);

  const executeDeleteRow = async (rowId: number) => {
    setDeleteConfirm({ open: false, rowId: null });
    setDeletingId(rowId);
    setError(null);
    try {
      const res = await fetch(`/api/tickets-details/${rowId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : 'فشل الحذف');
      }
      setRows((prev) => prev.filter((r) => r.id !== rowId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ أثناء الحذف');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout>
      <Head>
        <title>الرحلات — تذاكر مستخرجة</title>
      </Head>
      <div className={`min-h-screen ${Style['tajawal-regular']}`} dir="rtl">
        <main className="max-w-[1600px] mx-auto px-5 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/admin/currentorderstest" title="العودة">
              <span className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                <ArrowRight className="w-6 h-6 text-teal-800" />
              </span>
            </Link>
            <h1 className="text-3xl font-bold text-teal-800">الرحلات (بيانات التذاكر)</h1>
          </div>
          <p className="text-gray-600 text-right mb-6">
            جدول بجميع السجلات المستخرجة من نموذج <code className="text-sm bg-gray-100 px-1 rounded">tickets_details</code>
            . اضغط رقم الطلب للانتقال إلى صفحة التتبع.
          </p>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-900" />
              <span className="mr-3 text-teal-900">جاري التحميل...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 text-right border border-red-200 bg-red-50 rounded-lg p-4">{error}</div>
          ) : rows.length === 0 ? (
            <p className="text-gray-600 text-right bg-gray-50 border border-gray-200 rounded-lg p-6">لا توجد سجلات بعد.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
              <table className="min-w-full text-sm text-right">
                <thead className="bg-teal-900 text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-2 font-semibold whitespace-nowrap">الطلب</th>
                    <th className="px-2 py-2 font-semibold whitespace-nowrap">العميل</th>
                    <th className="px-2 py-2 font-semibold whitespace-nowrap">مرجع الحجز</th>
                    <th className="px-2 py-2 font-semibold whitespace-nowrap">الخطوط</th>
                    <th className="px-2 py-2 font-semibold whitespace-nowrap">رقم الرحلة</th>
                    <th className="px-2 py-2 font-semibold whitespace-nowrap">مغادرة</th>
                    <th className="px-2 py-2 font-semibold whitespace-nowrap">وقت</th>
                    <th className="px-2 py-2 font-semibold whitespace-nowrap">وصول</th>
                    <th className="px-2 py-2 font-semibold whitespace-nowrap">وقت</th>
                    <th className="px-2 py-2 font-semibold whitespace-nowrap">من</th>
                    <th className="px-2 py-2 font-semibold whitespace-nowrap">إلى</th>
                    <th className="px-2 py-2 font-semibold whitespace-nowrap">ملف</th>
                    <th className="px-2 py-2 font-semibold whitespace-nowrap">تاريخ السجل</th>
                    <th className="px-2 py-2 font-semibold whitespace-nowrap w-16">حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-gray-200 hover:bg-teal-50/50">
                      <td className="px-2 py-2 whitespace-nowrap">
                        <Link href={`/admin/track_order/${row.order_id}`}>
                          <span className="font-semibold text-teal-800 hover:underline cursor-pointer">
                            #{row.order_id}
                          </span>
                        </Link>
                      </td>
                      <td className="px-2 py-2 max-w-[140px] truncate" title={row.order?.clientName ?? ''}>
                        {row.order?.clientName ?? '—'}
                      </td>
                      <td className="px-2 py-2 font-mono text-xs">{row.reference_id ?? '—'}</td>
                      <td className="px-2 py-2">{row.airlines ?? '—'}</td>
                      <td className="px-2 py-2">{row.flight_number ?? '—'}</td>
                      <td className="px-2 py-2 whitespace-nowrap">{row.departure_date ?? '—'}</td>
                      <td className="px-2 py-2 whitespace-nowrap">{row.departure_time ?? '—'}</td>
                      <td className="px-2 py-2 whitespace-nowrap">{row.arrival_date ?? '—'}</td>
                      <td className="px-2 py-2 whitespace-nowrap">{row.arrival_time ?? '—'}</td>
                      <td className="px-2 py-2 font-mono text-xs">{row.departure_airport ?? '—'}</td>
                      <td className="px-2 py-2 font-mono text-xs">{row.arrival_airport ?? '—'}</td>
                      <td className="px-2 py-2">
                        {row.ticketFile ? (
                          <a
                            href={row.ticketFile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-800 hover:underline"
                          >
                            عرض
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-600">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleString('ar-SA', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          title="حذف السجل"
                          disabled={deletingId === row.id}
                          className="inline-flex items-center justify-center p-1.5 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50"
                          onClick={() => setDeleteConfirm({ open: true, rowId: row.id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {deleteConfirm.open && deleteConfirm.rowId != null && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-ticket-title"
            onClick={() => setDeleteConfirm({ open: false, rowId: null })}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-l from-teal-900 to-teal-800 px-6 py-4">
                <h3 id="delete-ticket-title" className="text-lg font-bold text-white text-right">
                  تأكيد الحذف
                </h3>
              </div>
              <div className="px-6 py-5">
                <p className="text-gray-700 text-right leading-relaxed">
                  هل أنت متأكد من حذف سجل التذكرة من قاعدة البيانات؟
                </p>
                <p className="text-sm text-gray-500 mt-2 text-right">لا يمكن التراجع عن هذا الإجراء.</p>
              </div>
              <div className="flex justify-end gap-3 px-6 pb-5 pt-0 border-t border-gray-100 bg-gray-50/80">
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-white transition-colors"
                  onClick={() => setDeleteConfirm({ open: false, rowId: null })}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={deletingId === deleteConfirm.rowId}
                  onClick={() => void executeDeleteRow(deleteConfirm.rowId)}
                >
                  {deletingId === deleteConfirm.rowId ? 'جاري الحذف...' : 'حذف نهائي'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
