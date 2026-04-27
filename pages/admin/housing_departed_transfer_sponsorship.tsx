import Layout from 'example/containers/Layout';
import Head from 'next/head';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import Style from 'styles/Home.module.css';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import prisma from 'pages/api/globalprisma';
import { jwtDecode } from 'jwt-decode';

/** سبب المغادرة عند تسجيل المغادرة — نفس القيم المحتملة في نموذج المغادرة */
const DEPARTURE_REASON_TRANSFER = 'نقل كفالة';

interface HousedWorkerRow {
  id: number;
  homeMaid_id: number | null;
  location_id: number | null;
  houseentrydate: string | null;
  deparatureHousingDate: string | null;
  deparatureReason: string | null;
  Reason: string | null;
  Details: string | null;
  employee: string | null;
  Order?: {
    id?: number;
    Name?: string;
    phone?: string | null;
    Nationalitycopy?: string | null;
    Passportnumber?: string | null;
    NewOrder?: Array<{
      ClientName?: string | null;
      client?: { fullname?: string | null } | null;
      arrivals?: Array<{ KingdomentryDate?: string }>;
    }>;
  };
  externalHomedmaid?: {
    name: string | null;
    nationality: string | null;
    passportNumber: string | null;
    phone: string | null;
    Client?: { fullname?: string | null } | null;
  };
}

interface InHouseLocation {
  id: number;
  location: string;
}

function getHousingClientName(worker: HousedWorkerRow): string {
  if (worker.externalHomedmaid) {
    return worker.externalHomedmaid.Client?.fullname?.trim() || '';
  }
  const latestOrder = worker.Order?.NewOrder?.[0];
  if (!latestOrder) return '';
  return (
    latestOrder.client?.fullname?.trim() ||
    latestOrder.ClientName?.trim() ||
    ''
  );
}

function formatDate(d: string | null | undefined): string {
  if (!d) return 'غير محدد';
  try {
    return new Date(d).toLocaleDateString('ar-SA');
  } catch {
    return 'غير محدد';
  }
}

function stayDaysFromDeparture(houseentrydate: string | null, departed: string | null): string {
  if (!houseentrydate || !departed) return 'غير محدد';
  const start = new Date(houseentrydate).getTime();
  const end = new Date(departed).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 'غير محدد';
  return String(Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)));
}

export default function HousingDepartedTransferSponsorship({ user }: { user: string }) {
  const router = useRouter();
  const [workers, setWorkers] = useState<HousedWorkerRow[]>([]);
  const [locations, setLocations] = useState<InHouseLocation[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'recruitment' | 'rental'>('recruitment');
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(true);

  const pageSize = 10;

  const fetchLocations = useCallback(async () => {
    try {
      const res = await axios.get('/api/inhouselocation');
      setLocations(res.data || []);
    } catch {
      setLocations([]);
    }
  }, []);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/housingdeparature', {
        params: {
          page,
          contractType: activeTab,
          deparatureReason: DEPARTURE_REASON_TRANSFER,
        },
      });
      const list: HousedWorkerRow[] = res.data.housing || [];
      setWorkers(list);
      setTotalCount(typeof res.data.totalCount === 'number' ? res.data.totalCount : list.length);
    } catch {
      setWorkers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, activeTab]);

  const displayedWorkers = useMemo(() => {
    const q = searchName.trim().toLowerCase();
    const base = workers.filter((w) => w.Order?.Name || w.externalHomedmaid?.name);
    if (!q) return base;
    return base.filter((w) => {
      const name = (w.Order?.Name || w.externalHomedmaid?.name || '').toLowerCase();
      return name.includes(q);
    });
  }, [workers, searchName]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const locationLabel = (id: number | null) =>
    id ? locations.find((l) => l.id === id)?.location || 'غير محدد' : 'غير محدد';

  return (
    <Layout>
      <Head>
        <title>مغادرات السكن — سبب المغادرة نقل كفالة</title>
      </Head>
      <section className={Style.section}>
        <div className="container mx-auto px-4 py-6" dir="rtl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-gray-200 pb-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">عاملات غادرن السكن</h1>
              <p className="text-sm text-gray-600 mt-1">
                سبب المغادرة: <span className="font-medium text-teal-800">{DEPARTURE_REASON_TRANSFER}</span>
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link
                href="/admin/housedarrivals"
                className="text-sm px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                العودة إلى التسكين
              </Link>
            </div>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4 mb-4">
            <nav className="flex gap-8 border-b border-gray-200 pb-3 mb-4">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('recruitment');
                  setPage(1);
                }}
                className={`pb-2 text-base ${activeTab === 'recruitment' ? 'border-b-2 border-teal-700 text-teal-800 font-medium' : 'text-gray-500'}`}
              >
                استقدام
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('rental');
                  setPage(1);
                }}
                className={`pb-2 text-base ${activeTab === 'rental' ? 'border-b-2 border-teal-700 text-teal-800 font-medium' : 'text-gray-500'}`}
              >
                تأجير
              </button>
            </nav>

            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-gray-100 border border-gray-300 rounded-md flex items-center gap-2 px-2">
                <input
                  type="text"
                  placeholder="تصفية بالاسم (ضمن نتائج الصفحة الحالية)"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="bg-transparent outline-none text-right text-sm py-2 border-none min-w-[200px]"
                />
                <Search className="w-4 h-4 text-gray-500" />
              </div>
              {/* <span className="text-sm text-gray-500">المستخدم: {user}</span> */}
            </div>
          </div>

          <div className="overflow-x-auto bg-white border border-gray-300 rounded-lg shadow-sm">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-teal-800 text-white">
                  <th className="py-3 px-2 text-right">#</th>
                  <th className="py-3 px-2 text-right">الاسم</th>
                  <th className="py-3 px-2 text-right">اسم العميل</th>
                  <th className="py-3 px-2 text-right">الجوال</th>
                  <th className="py-3 px-2 text-right">الجنسية</th>
                  <th className="py-3 px-2 text-right">السكن</th>
                  <th className="py-3 px-2 text-right">سبب التسكين</th>
                  <th className="py-3 px-2 text-right">سبب المغادرة</th>
                  <th className="py-3 px-2 text-right">تاريخ التسكين</th>
                  <th className="py-3 px-2 text-right">تاريخ المغادرة</th>
                  <th className="py-3 px-2 text-right">أيام بالسكن</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-gray-500">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : displayedWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-gray-500">
                      لا توجد نتائج
                    </td>
                  </tr>
                ) : (
                  displayedWorkers.map((worker) => (
                      <tr key={worker.id} className="border-b border-gray-200 bg-gray-50 hover:bg-gray-100">
                        <td className="py-2 px-2 text-right">
                          {worker.Order?.id ? (
                            <button
                              type="button"
                              className="text-teal-800 underline"
                              onClick={() => router.push(`/admin/homemaidinfo?id=${worker.Order?.id}`)}
                            >
                              #{worker.id}
                            </button>
                          ) : (
                            <span>#{worker.id}</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {worker.Order?.Name || worker.externalHomedmaid?.name || '—'}
                        </td>
                        <td className="py-2 px-2 text-right">{getHousingClientName(worker) || '—'}</td>
                        <td className="py-2 px-2 text-right">
                          {worker.Order?.phone || worker.externalHomedmaid?.phone || '—'}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {worker.Order?.Nationalitycopy || worker.externalHomedmaid?.nationality || '—'}
                        </td>
                        <td className="py-2 px-2 text-right">{locationLabel(worker.location_id)}</td>
                        <td className="py-2 px-2 text-right">{worker.Reason || '—'}</td>
                        <td className="py-2 px-2 text-right">{worker.deparatureReason || '—'}</td>
                        <td className="py-2 px-2 text-right">{formatDate(worker.houseentrydate)}</td>
                        <td className="py-2 px-2 text-right">{formatDate(worker.deparatureHousingDate)}</td>
                        <td className="py-2 px-2 text-right">
                          {stayDaysFromDeparture(worker.houseentrydate, worker.deparatureHousingDate)}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && totalCount > pageSize && (
            <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
              >
                السابق
              </button>
              <span className="text-sm text-gray-600">
                صفحة {page} من {Math.ceil(totalCount / pageSize) || 1}
              </span>
              <button
                type="button"
                disabled={page >= Math.ceil(totalCount / pageSize)}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

export async function getServerSideProps({ req }: { req: { headers?: { cookie?: string } } }) {
  try {
    const cookieHeader = req.headers?.cookie;
    const cookies: Record<string, string> = {};
    if (cookieHeader) {
      cookieHeader.split(';').forEach((c) => {
        const [key, value] = c.trim().split('=');
        if (key) cookies[key] = decodeURIComponent(value || '');
      });
    }
    if (!cookies.authToken) {
      return { redirect: { destination: '/admin/login', permanent: false } };
    }
    const token = jwtDecode(cookies.authToken) as { id?: number };
    const findUser = await prisma.user.findUnique({
      where: { id: Number(token.id) },
      include: { role: true },
    });
    if (!findUser) {
      return { redirect: { destination: '/admin/home', permanent: false } };
    }
    return { props: { user: (token as { username?: string }).username || '' } };
  } catch {
    return { redirect: { destination: '/admin/home', permanent: false } };
  }
}
