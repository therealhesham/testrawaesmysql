import { useEffect, useState } from 'react';
import { DocumentDownloadIcon, TableIcon } from '@heroicons/react/outline';
import { Search, ChevronDown, X } from 'lucide-react'; // Added X for close button
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css";
import axios from 'axios';
import PreRentalModal from 'components/PreRentalModal';
// import AddRentalRequest from './add_rental_request';
// import AddRentalRequestModal from './AddRentalRequestModal'; // Import the component for the modal content
// AddRentalRequest
export default function Dashboard() {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [contractType, setContractType] = useState('recruitment');
  const [recruitmentCount, setRecruitmentCount] = useState(0);
  const [rentalCount, setRentalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [nationality, setNationality] = useState('');
  const [office, setOffice] = useState('');
  const [status, setStatus] = useState('');
  const [offices, setOffices] = useState([]);
  const [nationalities, setNationalities] = useState([]);
  const [statuses] = useState([
    'تحت الإجراء',
    'قيد التنفيذ',
    // Add more statuses as needed
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility

  const pageSize = 10;

  // Fetch offices and unique nationalities
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const response = await axios.get("/api/offices");
        setOffices(response.data.officesFinder);
        setNationalities(response.data.countriesfinder);
      } catch (error) {
        console.error('Error fetching offices:', error);
      }
    };

    fetchOffices();
  }, []);

  // Fetch data with filters
  async function fetchData(page = 1) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        typeOfContract: contractType,
        ...(searchTerm && { searchTerm }),
        ...(nationality && { Nationalitycopy: nationality }),
        ...(office && { officeName: office }),
        ...(status && { bookingstatus: status }),
      });

      const res = await fetch(`/api/currentordersprisma?${queryParams.toString()}`);
      const { homemaids, totalCount, totalPages, recruitment, rental } = await res.json();
      setData(homemaids);
      setTotalCount(totalCount);
      setRecruitmentCount(recruitment);
      setRentalCount(rental);
      setTotalPages(totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setData([]);
      setTotalCount(0);
      setTotalPages(1);
    }
  }

  // Fetch data when filters or contract type change
  useEffect(() => {
    fetchData();
  }, [contractType, searchTerm, nationality, office, status]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchData(page);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setNationality('');
    setOffice('');
    setStatus('');
    setCurrentPage(1);
  };

  // Open and close modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Generate pagination buttons
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
              طلبات تحت الاجراء
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
                    طلبات الاستقدام <span className="text-xs align-super">{recruitmentCount}</span>
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
                    طلبات التأجير <span className="text-xs align-super">{rentalCount}</span>
                  </a>
                </div>
                <div className="flex gap-2">
                  {contractType === 'rental' && (
                    <button
                      onClick={handleOpenModal}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-900 text-white text-xs font-tajawal"
                    >
                      إضافة طلب تأجير
                    </button>
                  )}
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
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border-none bg-transparent outline-none text-right font-tajawal text-sm text-gray-500"
                    />
                    <Search className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="flex items-center bg-gray-50 border border-gray-300 rounded px-2.5 py-2 gap-10 text-sm text-gray-500 cursor-pointer appearance-none"
                    >
                      <option value="">حالة الطلب</option>
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <select
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="flex items-center bg-gray-50 border border-gray-300 rounded px-2.5 py-2 gap-10 text-sm text-gray-500 cursor-pointer appearance-none"
                    >
                      <option value="">كل الجنسيات</option>
                      {nationalities.map((nat) => (
                        <option key={nat?.Country} value={nat?.Country}>
                          {nat?.Country}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <select
                      value={office}
                      onChange={(e) => setOffice(e.target.value)}
                      className="flex items-center bg-gray-50 border border-gray-300 rounded px-2.5 py-2 gap-10 text-sm text-gray-500 cursor-pointer appearance-none"
                    >
                      <option value="">كل المكاتب</option>
                      {offices.map((off: any) => (
                        <option key={off.id} value={off.office}>
                          {off.office}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="bg-teal-900 text-white border-none rounded px-4 py-2 text-sm font-tajawal cursor-pointer"
                >
                  إعادة ضبط
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-teal-900">
                      {['رقم الطلب', 'اسم العميل', 'جوال العميل', 'هوية العميل', 'رقم العاملة', 'اسم العاملة', 'الجنسية', 'رقم جواز السفر', 'رقم عقد مساند', 'اسم المكتب الخارجي', 'حالة الطلب'].map((header) => (
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
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.client?.fullname || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.client?.phone || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking?.client?.nationalId || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.HomeMaid?.id || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.HomeMaid?.Name || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.HomeMaid?.office?.Country || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.HomeMaid?.Passportnumber || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.arrivals?.InternalmusanedContract || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.HomeMaid?.office?.office || 'غير متوفر'}</td>
                        <td className="p-4 text-xs text-gray-800 text-right">{booking.bookingstatus || 'غير متوفر'}</td>
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

      {/* Modal for adding rental request */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-right">إضافة طلب تأجير</h2>
            <PreRentalModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              onSelectClient={(client) => {
                // Handle client selection
                handleCloseModal();
              }}

            />
          </div>
        </div>
      )}
    </Layout>
  );
}