import { useEffect, useState } from 'react';
import { DocumentDownloadIcon, TableIcon } from '@heroicons/react/outline';
import { Search, ChevronDown } from 'lucide-react';
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css"

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [contractType, setContractType] = useState('recruitment'); // Track contract type
  const pageSize = 10;

  async function fetchData(page = 1) {
    try {
      const res = await fetch(`/api/endedorders?page=${page}&typeOfContract=${contractType}`);
      const { homemaids, totalCount, totalPages } = await res.json();
      setData(homemaids);
      setTotalCount(totalCount);
      setTotalPages(totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setData([]);
      setTotalCount(0);
      setTotalPages(1);
    }
  }

  useEffect(() => {
    fetchData();
  }, [contractType]); // Re-fetch when contractType changes

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchData(page);
    }
  };

  // Generate pagination buttons dynamically
  const renderPagination = () => {
    const pages = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <a
          key={i}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handlePageChange(i);
          }}
          className={`px-2.5 py-1 border rounded text-xs ${
            i === currentPage
              ? 'border-teal-900 bg-teal-900 text-white'
              : 'border-gray-300 bg-gray-50 text-gray-800'
          }`}
        >
          {i}
        </a>
      );
    }

    return pages;
  };

  return (
    <Layout>
      <section id="dashboard" className={`flex flex-row mx-auto min-h-screen ${Style["tajawal-regular"]}`}>
        <div className="flex-1 flex flex-col w-full">
          <main className="p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-normal text-black mb-6 text-right">
              الطلبات المكتملة
            </h1>
            <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start border-b border-gray-300 mb-6 flex-col sm:flex-row gap-4">
                <div className="flex gap-10">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setContractType('recruitment');
                    }}
                    className={`text-sm text-gray-500 pb-4 relative flex items-center gap-1 font-bold ${
                      contractType === 'recruitment' ? 'border-b-2 border-black' : ''
                    }`}
                  >
                    طلبات الاستقدام <span className="text-xs align-super">{totalCount}</span>
                  </a>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setContractType('rental');
                    }}
                    className={`text-sm text-gray-500 pb-4 relative flex items-center gap-1 ${
                      contractType === 'rental' ? 'border-b-2 border-black' : ''
                    }`}
                  >
                    طلبات التأجير <span className="text-xs align-super">{totalCount}</span>
                  </a>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-900 text-white text-xs font-tajawal">
                    <DocumentDownloadIcon className="w-4 h-4" />
                    PDF
                  </button>
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-900 text-white text-xs font-tajawal">
                    <TableIcon className="w-4 h-4" />
                    Excel
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center mb-6 flex-col sm:flex-row gap-4">
                <div className="flex gap-4">
                  <div className="flex items-center bg-gray-50 border border-gray-300 rounded px-2.5 py-2 gap-4">
                    <input
                      type="text"
                      placeholder="بحث"
                      className="border-none bg-transparent outline-none text-right font-tajawal text-sm text-gray-500"
                    />
                    <Search className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex items-center bg-gray-50 border border-gray-300 rounded px-2.5 py-2 gap-10 text-sm text-gray-500 cursor-pointer">
                    <span>كل الجنسيات</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
                <button className="bg-teal-900 text-white border-none rounded px-4 py-2 text-sm font-tajawal cursor-pointer">
                  اعادة ضبط
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-teal-900">
                      {['#', 'اسم العميل', 'جوال العميل', 'هوية العميل', 'رقم العاملة', 'اسم العاملة', 'الجنسية', 'رقم جواز السفر', 'المتبقي من الضمان', 'مدة المعاملة', 'التقييم'].map((header) => (
                        <th key={header} className="text-white text-xs font-normal p-4 text-right">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((booking) => (
                      <tr key={booking.id} className="bg-gray-50 border-b border-gray-300 last:border-b-0">
                        <td className="p-4 text-xs text-gray-800 text-right">#{booking.id}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.ClientName || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.clientphonenumber || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.clientID || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.HomemaidId || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right whitespace-normal">{booking.Name || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.Nationality || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.Passportnumber || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.isContractEnded ? 'انتهت فترة الضمان' : 'مستمر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">غير متوفر</td>
                        <td className="p-4 text-xs text-right">
                          <span className={`inline-block px-3 py-1 rounded-lg ${booking.isContractEnded ? 'text-red-600' : 'text-teal-900'}`}>
                            {booking.isContractEnded ? 'لا' : 'نعم'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-6 flex-col sm:flex-row gap-4">
                <p className="text-base text-black">
                  عرض {(currentPage - 1) * pageSize + 1}- {Math.min(currentPage * pageSize, totalCount)} من {totalCount} نتيجة
                </p>
                <div className="flex items-center gap-1.5">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage - 1);
                    }}
                    className={`px-2.5 py-1 border rounded text-xs ${
                      currentPage === 1 ? 'border-gray-300 bg-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300 bg-gray-50 text-gray-800'
                    }`}
                  >
                    السابق
                  </a>
                  {renderPagination()}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage + 1);
                    }}
                    className={`px-2.5 py-1 border rounded text-xs ${
                      currentPage === totalPages ? 'border-gray-300 bg-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300 bg-gray-50 text-gray-800'
                    }`}
                  >
                    التالي
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      </section>
    </Layout>
  );
}