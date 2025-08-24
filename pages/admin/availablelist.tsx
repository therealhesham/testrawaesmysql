import Head from 'next/head';
import { useState, useEffect } from 'react';
import { CalendarIcon, ChevronDownIcon } from '@heroicons/react/outline';
import { FilePdfFilled, FileTextOutlined } from '@ant-design/icons';
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css";

interface Homemaid {
  id: number;
  Name: string;
  phone: string | null;
  Nationalitycopy: string;
  maritalstatus: string;
  Passportnumber: string;
  PassportStart: string | null;
  PassportEnd: string | null;
  Experience: string;
  ages: string;
  birthdate?: string | null;
}

interface ApiResponse {
  data: Homemaid[];
  totalPages: number;
}

export default function Home() {
  const [homemaids, setHomemaids] = useState<Homemaid[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    Name: '',
    Nationality: '',
    date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    Name: true,
    phone: true,
    Nationalitycopy: true,
    maritalstatus: true,
    Passportnumber: true,
    PassportStart: true,
    PassportEnd: true,
    Experience: true,
    availability: true,
  });
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  const fetchHomemaids = async (page: number, filters: { Name: string; Nationality: string; date: string }) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        ...(filters.Name && { Name: filters.Name }),
        ...(filters.Nationality && { Nationality: filters.Nationality }),
        ...(filters.date && { date: filters.date }),
      });
      const response = await fetch(`/api/availablelist?${queryParams}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data: ApiResponse = await response.json();
      setHomemaids(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching homemaids:', error);
      setError('خطأ في جلب البيانات');
      setHomemaids([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomemaids(currentPage, filters);
  }, [currentPage, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ Name: '', Nationality: '', date: '' });
    setCurrentPage(1);
  };

  const handleColumnToggle = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPaginationRange = () => {
    const maxPagesToShow = 5;
    const halfRange = Math.floor(maxPagesToShow / 2);
    let start = Math.max(1, currentPage - halfRange);
    let end = Math.min(totalPages, currentPage + halfRange);

    if (end - start < maxPagesToShow - 1) {
      if (start === 1) {
        end = Math.min(totalPages, start + maxPagesToShow - 1);
      } else if (end === totalPages) {
        start = Math.max(1, end - maxPagesToShow + 1);
      }
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const columnLabels = {
    id: '#',
    Name: 'الاسم',
    phone: 'رقم الجوال',
    Nationalitycopy: 'الجنسية',
    maritalstatus: 'الحالة الاجتماعية',
    Passportnumber: 'رقم الجواز',
    PassportStart: 'بداية الجواز',
    PassportEnd: 'نهاية الجواز',
    Experience: 'الخبرة',
    availability: 'مدة توفرها',
  };

  return (
    <Layout>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>قائمة العاملات المتاحات</title>
      </Head>
      <main className={`p-8 md:p-10 bg-gray-100 min-h-screen font-tajawal text-right text-gray-800 ${Style["tajawal-regular"]}`}>
        <h1 className="text-3xl font-normal text-black mb-6">قائمة العاملات المتاحات</h1>
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
          <div className="flex flex-col flex-wrap gap-5 mb-6">
            <div className="flex flex-row justify-end gap-4 w-full md:w-auto" dir="ltr">
              <button
                className="bg-teal-800 text-white rounded-md px-3 py-2 text-sm"
                onClick={handleResetFilters}
              >
                إعادة ضبط
              </button>
              <div className="relative">
                <button
                  className="flex items-center bg-gray-100 border h-16 border-gray-300 rounded-md px-2 py-2 min-w-[162px] justify-between text-gray-500 text-sm"
                  onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                >
                  <span>إخفاء/إظهار الأعمدة</span>
                  <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                </button>
                {isColumnDropdownOpen && (
                  <div className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-lg mt-1 w-[200px] p-4">
                    {Object.keys(visibleColumns).map((column) => (
                      <label key={column} className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                        <input
                          type="checkbox"
                          checked={visibleColumns[column as keyof typeof visibleColumns]}
                          onChange={() => handleColumnToggle(column as keyof typeof visibleColumns)}
                          className="w-4 h-4"
                        />
                        {columnLabels[column as keyof typeof columnLabels]}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center bg-gray-100 border border-gray-300 rounded-md px-2 py-2 min-w-[162px] justify-between text-gray-500 text-sm">
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                  className="bg-transparent border-none text-gray-500 w-full text-right"
                />
                <CalendarIcon className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center bg-gray-100 border border-gray-300 rounded-md px-2 py-2 min-w-[162px] justify-between text-gray-500 text-sm">
                <select
                  value={filters.Nationality}
                  onChange={(e) => handleFilterChange('Nationality', e.target.value)}
                  className="bg-transparent border-none text-gray-500 w-full text-right"
                >
                  <option value="">كل الجنسيات</option>
                  <option value="Kenya - كينيا">كينيا</option>
                  <option value="Uganda - أوغندا">أوغندا</option>
                </select>
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center bg-gray-100 border border-gray-300 rounded-md px-2 py-2 w-full md:w-[234px]">
                <input
                  type="text"
                  placeholder="بحث"
                  value={filters.Name}
                  onChange={(e) => handleFilterChange('Name', e.target.value)}
                  className="bg-transparent border-none text-gray-500 w-full text-right"
                />
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button className="flex gap-1 bg-teal-800 text-white rounded px-2 py-1">
                <FileTextOutlined className="w-4 h-4 text-white" />
                <span>Excel</span>
              </button>
              <button className="flex items-center gap-1 bg-teal-800 text-white rounded px-2 py-1">
                <FilePdfFilled className="w-4 h-4 text-white" />
                <span>PDF</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading && <div className="text-center text-gray-500 py-4">جاري التحميل...</div>}
            {error && <div className="text-center text-red-500 py-4">{error}</div>}
            {!loading && !error && homemaids.length === 0 && (
              <div className="text-center text-gray-500 py-4">لا توجد بيانات متاحة</div>
            )}
            {!loading && !error && homemaids.length > 0 && (
              <div
                className="grid text-right"
                style={{
                  gridTemplateColumns: `repeat(${
                    Object.values(visibleColumns).filter(Boolean).length
                  }, minmax(100px, 1fr))`,
                  minWidth: `${
                    Object.values(visibleColumns).filter(Boolean).length * 100
                  }px`,
                }}
              >
                {visibleColumns.id && (
                  <div className="bg-teal-800 text-white text-sm font-normal p-4 text-center">#</div>
                )}
                {visibleColumns.Name && (
                  <div className="bg-teal-800 text-white text-sm font-normal p-4 text-center">الاسم</div>
                )}
                {visibleColumns.phone && (
                  <div className="bg-teal-800 text-white text-sm font-normal p-4 text-center">رقم الجوال</div>
                )}
                {visibleColumns.Nationalitycopy && (
                  <div className="bg-teal-800 text-white text-sm font-normal p-4 text-center">الجنسية</div>
                )}
                {visibleColumns.maritalstatus && (
                  <div className="bg-teal-800 text-white text-sm font-normal p-4 text-center">الحالة الاجتماعية</div>
                )}
                {visibleColumns.Passportnumber && (
                  <div className="bg-teal-800 text-white text-sm font-normal p-4 text-center">رقم الجواز</div>
                )}
                {visibleColumns.PassportStart && (
                  <div className="bg-teal-800 text-white text-sm font-normal p-4 text-center">بداية الجواز</div>
                )}
                {visibleColumns.PassportEnd && (
                  <div className="bg-teal-800 text-white text-sm font-normal p-4 text-center">نهاية الجواز</div>
                )}
                {visibleColumns.Experience && (
                  <div className="bg-teal-800 text-white text-sm font-normal p-4 text-center">الخبرة</div>
                )}
                {visibleColumns.availability && (
                  <div className="bg-teal-800 text-white text-sm font-normal p-4 text-center">مدة توفرها</div>
                )}
                {homemaids.map((homemaid, index) => (
                  <div key={homemaid.id} className={`contents ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}>
                    {visibleColumns.id && (
                      <div className="p-4 border-b border-gray-300 text-sm  text-center">{homemaid.id}</div>
                    )}
                    {visibleColumns.Name && (
                      <div className="p-4 border-b border-gray-300 text-sm  text-center">{homemaid.Name}</div>
                    )}
                    {visibleColumns.phone && (
                      <div className="p-4 border-b border-gray-300 text-sm  text-center">{homemaid.phone || 'غير متوفر'}</div>
                    )}
                    {visibleColumns.Nationalitycopy && (
                      <div className="p-4 border-b border-gray-300 text-sm  text-center">
                        {homemaid.Nationalitycopy ? homemaid.Nationalitycopy.split(' - ')[1] || 'غير متوفر' : 'غير متوفر'}
                      </div>
                    )}
                    {visibleColumns.maritalstatus && (
                      <div className="p-4 border-b border-gray-300 text-sm  text-center">
                        {homemaid.maritalstatus ? homemaid.maritalstatus.split(' - ')[1] || 'غير متوفر' : 'غير متوفر'}
                      </div>
                    )}
                    {visibleColumns.Passportnumber && (
                      <div className="p-4 border-b border-gray-300 text-sm  text-center">{homemaid.Passportnumber}</div>
                    )}
                    {visibleColumns.PassportStart && (
                      <div className="p-4 border-b border-gray-300 text-sm  text-center">{homemaid.PassportStart || 'غير متوفر'}</div>
                    )}
                    {visibleColumns.PassportEnd && (
                      <div className="p-4 border-b border-gray-300 text-sm  text-center">{homemaid.PassportEnd || 'غير متوفر'}</div>
                    )}
                    {visibleColumns.Experience && (
                      <div className="p-4 border-b border-gray-300 text-sm  text-center">
                        {homemaid.Experience ? homemaid.Experience.split(' | ')[1] || 'غير متوفر' : 'غير متوفر'}
                      </div>
                    )}
                    {visibleColumns.availability && (
                      <div className="p-4 border-b border-gray-300 text-xs  text-center">متاحة الآن</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 gap-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || loading}
                className="border border-gray-300 bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded min-w-[20px] text-center disabled:opacity-50"
              >
                الأول
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="border border-gray-300 bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded min-w-[20px] text-center disabled:opacity-50"
              >
                السابق
              </button>
              {getPaginationRange().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  disabled={loading}
                  className={`border text-xs px-2 py-1 rounded min-w-[20px] text-center ${
                    currentPage === page ? 'border-teal-800 bg-teal-800 text-gray-100' : 'border-gray-300 bg-gray-100 text-gray-800'
                  } disabled:opacity-50`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="border border-gray-300 bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded min-w-[20px] text-center disabled:opacity-50"
              >
                التالي
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages || loading}
                className="border border-gray-300 bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded min-w-[20px] text-center disabled:opacity-50"
              >
                الأخير
              </button>
            </div>
            <div className="text-base text-black">
              عرض {(currentPage - 1) * 10 + 1}- {Math.min(currentPage * 10, homemaids.length + (currentPage - 1) * 10)} من {totalPages * 10} نتيجة
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}