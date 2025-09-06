import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import Layout from 'example/containers/Layout';
import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Style from "styles/Home.module.css"

const MainContent = () => {
  const [activeTab, setActiveTab] = useState('طلبات الاستقدام');
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    Passportnumber: '',
    clientphonenumber: '',
    HomemaidId: '',
    age: '',
    Nationalitycopy: '',
    ReasonOfRejection: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        ...filters,
      }).toString();

      const response = await fetch(`/api/cancelledorders?${queryParams}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      setData(result.data);
      setTotalResults(result.totalCount);
      setPageSize(result.pageSize || 10);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, filters, activeTab]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const handleResetFilters = () => {
    setFilters({
      Passportnumber: '',
      clientphonenumber: '',
      HomemaidId: '',
      age: '',
      Nationalitycopy: '',
      ReasonOfRejection: '',
    });
    setPage(1);
  };

  // Filter data based on active tab
  const filteredData = data.filter((item) =>
    activeTab === 'طلبات الاستقدام'
      ? item.typeOfContract === 'recruitment'
      : item.typeOfContract === 'rental'
  );

  return (
    <main className="p-9 flex-grow overflow-y-auto">
      <h1 className="text-3xl font-normal text-black mb-6 text-right">الطلبات الملغية</h1>
      <div className="bg-white border border-border rounded-lg shadow-md p-6">
        <div className="flex flex-col gap-5 mb-5">
          <div className="border-b border-border">
            <div className="flex gap-10">
              <a
                href="#"
                className={`pb-2 text-sm ${activeTab === 'طلبات الاستقدام' ? 'text-black font-bold border-b-2 border-primary' : 'text-gray-500'}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('طلبات الاستقدام');
                }}
              >
                طلبات الاستقدام<span className="mr-1 text-md">{data.filter((item) => item.typeOfContract === 'recruitment').length}</span>
              </a>
              <a
                href="#"
                className={`pb-2 text-sm ${activeTab === 'طلبات التاجير' ? 'text-black font-bold border-b-2 border-primary' : 'text-gray-500'}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('طلبات التاجير');
                }}
              >
                طلبات التاجير<span className="mr-1 text-md">{data.filter((item) => item.typeOfContract === 'rental').length}</span>
              </a>
            </div>
          </div>
          <div className="flex justify-between flex-col flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap" dir='ltr'>
              <button
                className="bg-teal-900 text-white text-md px-3 py-2 rounded-md"
                onClick={handleResetFilters}
              >
                اعادة ضبط
              </button>
              <div className="flex items-center justify-between bg-row-background border border-border rounded-md   gap-10 text-md text-gray-500">
                <input
                  type="text"
                  placeholder="الجنسية"
                  value={filters.Nationalitycopy}
                  onChange={(e) => handleFilterChange('Nationalitycopy', e.target.value)}
                  className="border-none bg-transparent outline-none w-[180px] text-sm text-gray-500"
                />
                <Image src="/images/I2207_32547_2194_30622_354_4917.svg" alt="arrow" width={16} height={16} />
              </div>
              <div className="flex items-center justify-between bg-row-background border border-border rounded-md  gap-10 text-md text-gray-500">
                <input
                  type="text"
                  placeholder="سبب الالغاء"
                  value={filters.ReasonOfRejection}
                  onChange={(e) => handleFilterChange('ReasonOfRejection', e.target.value)}
                  className="border-none bg-transparent outline-none w-[180px] text-sm text-gray-500"
                />
                <Image src="/images/I2207_32547_2194_30624.svg" alt="arrow" width={16} height={16} />
              </div>
              <div className="flex items-center bg-row-background border border-border rounded-md ">
                <input
                  type="text"
                  placeholder="بحث"
                  value={filters.clientphonenumber}
                  onChange={(e) => handleFilterChange('clientphonenumber', e.target.value)}
                  className="border-none bg-transparent outline-none w-[180px] text-sm text-gray-500"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="flex items-center gap-1 bg-teal-900 text-md text-white px-2.5 py-1 rounded">
                <FileExcelOutlined />
                Excel
              </button>
              <button className="flex items-center gap-1 bg-teal-900 text-md text-white px-2.5 py-1 rounded">
                <FilePdfOutlined />
                PDF
              </button>
            </div>
          </div>
        </div>
        {loading && <p className="text-center">جار التحميل...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse whitespace-nowrap">
              <thead className="bg-teal-900 text-white">
                <tr>
                  <th className="p-4 text-right font-normal text-sm">#</th>
                  <th className="p-4 text-right font-normal text-sm">اسم العميل</th>
                  <th className="p-4 text-right font-normal text-sm">جوال العميل</th>
                  <th className="p-4 text-right font-normal text-sm">هوية العميل</th>
                  <th className="p-4 text-right font-normal text-sm">رقم العاملة</th>
                  <th className="p-4 text-right font-normal text-sm">اسم العاملة</th>
                  <th className="p-4 text-right font-normal text-sm">الجنسية</th>
                  <th className="p-4 text-right font-normal text-sm">رقم جواز السفر</th>
                  <th className="p-4 text-right font-normal text-sm">سبب الالغاء</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => (
                  <tr key={index} className="bg-row-background border-b border-border last:border-b-0">
                    <td className="p-4 text-sm text-black text-right">{row.id}</td>
                    <td className="p-4 text-sm text-black text-right">{row.ClientName || 'غير متوفر'}</td>
                    <td className="p-4 text-sm text-black text-right">{row.clientphonenumber || 'غير متوفر'}</td>
                    <td className="p-4 text-sm text-black text-right">{row.clientID || 'غير متوفر'}</td>
                    <td className="p-4 text-sm text-black text-right">{row.HomemaidId || 'غير متوفر'}</td>
                    <td className="p-4 text-sm text-black text-right">{row.Name || 'غير متوفر'}</td>
                    <td className="p-4 text-sm text-black text-right">{row.Nationalitycopy || 'غير متوفر'}</td>
                    <td className="p-4 text-sm text-black text-right">{row.Passportnumber || 'غير متوفر'}</td>
                    <td className="p-4 text-sm text-black text-right">{row.ReasonOfRejection || 'غير متوفر'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-between items-center pt-6 flex-wrap gap-4">
          <span className="text-base text-black">
            عرض {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalResults)} من {totalResults} نتيجة
          </span>
          <nav className="flex items-center gap-1.5">
            <a
              href="#"
              className={`px-2 py-0.5 border border-border rounded bg-row-background text-black text-md ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                if (page > 1) setPage(page - 1);
              }}
            >
              السابق
            </a>
            {Array.from({ length: Math.ceil(totalResults / pageSize) }, (_, i) => i + 1).map((pageNum) => (
              <a
                key={pageNum}
                href="#"
                className={`px-2 py-0.5 border rounded text-md ${pageNum === page ? 'border-primary bg-teal-900 text-white' : 'border-border bg-row-background text-black'}`}
                onClick={(e) => {
                  e.preventDefault();
                  setPage(pageNum);
                }}
              >
                {pageNum}
              </a>
            ))}
            <a
              href="#"
              className={`px-2 py-0.5 border border-border rounded bg-row-background text-black text-md ${page === Math.ceil(totalResults / pageSize) ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                if (page < Math.ceil(totalResults / pageSize)) setPage(page + 1);
              }}
            >
              التالي
            </a>
          </nav>
        </div>
      </div>
    </main>
  );
};

export default function Home() {
  return (
    <Layout>
      <Head>
        <meta name="description" content="Rawaes Recruitment Dashboard" />
      </Head>
      <div className={`flex min-h-screen max-w-[1440px] mx-auto font-tajawal bg-background text-black dir-rtl ${Style["tajawal-regular"]}`}>
        <div className="flex flex-col flex-grow">
          <MainContent />
        </div>
      </div>
    </Layout>
  );
}