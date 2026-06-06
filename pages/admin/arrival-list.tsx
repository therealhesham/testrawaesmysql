//@ts-nocheck
//@ts-ignore

import Layout from 'example/containers/Layout';
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { SearchIcon } from '@heroicons/react/outline';
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Style from 'styles/Home.module.css';
import Select from 'react-select';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';
import { X, Search, FileText, Check, AlertCircle, Calendar, Clock, RefreshCw } from 'lucide-react';
import { saudiCities } from 'components/SaudiCityAutocomplete';
import { worldCities } from 'components/CityAutocomplete';
interface TableRow {
  workerId: string;
  orderId: string;
  workerName: string;
  clientName: string;
  clientPhone: string;
  clientId: string;
  nationality: string;
  passport: string;
  from: string;
  to: string;
  status: string;
  arrivalDate: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
}

const formatDateToYMD = (val: unknown): string => {
  if (!val || String(val).trim() === '' || String(val).toLowerCase() === 'null' || String(val).toLowerCase() === 'n/a') return '';
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  const dmY = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/.exec(s);
  if (dmY) {
    const d = dmY[1].padStart(2, '0');
    const m = dmY[2].padStart(2, '0');
    const y = dmY[3];
    return `${y}-${m}-${d}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return s;
};

const iataToCityAr: Record<string, string> = {
  // Saudi Arabia
  'RUH': 'الرياض',
  'JED': 'جدة',
  'MED': 'المدينة المنورة',
  'DMM': 'الدمام',
  'AHB': 'أبها',
  'ELQ': 'القصيم',
  'TUI': 'طريف',
  'TAB': 'تبوك',
  'HIL': 'حائل',
  'GJI': 'جازان',
  'HOF': 'الهفوف',
  'EAM': 'نجران',
  'YNB': 'ينبع',
  'AQI': 'القيصومة',
  'RAE': 'عرعر',
  'AJF': 'الجوف',
  'BHH': 'الباحة',
  'ULH': 'العلا',
  'SHW': 'شرورة',
  'WAE': 'وادي الدواسر',
  'DWD': 'الدوادمي',
  'URY': 'القريات',
  'EJH': 'الوجه',
  'RAH': 'رفحاء',
  'NUM': 'نيوم',

  // Gulf Countries
  'DOH': 'الدوحة',
  'DXB': 'دبي',
  'DWC': 'دبي',
  'SHJ': 'الشارقة',
  'AUH': 'أبوظبي',
  'BAH': 'المنامة',
  'KWI': 'الكويت',
  'MCT': 'مسقط',
  'SLL': 'صلالة',

  // Arab & Levant
  'CAI': 'القاهرة',
  'HBE': 'الإسكندرية',
  'ALY': 'الإسكندرية',
  'LXR': 'الأقصر',
  'HRG': 'الغردقة',
  'SSH': 'شرم الشيخ',
  'AMM': 'عمان',
  'BEY': 'بيروت',
  'DAM': 'دمشق',
  'BGW': 'بغداد',
  'KBL': 'كابول',
  'SNA': 'صنعاء',
  'ADE': 'عدن',
  'KRT': 'الخرطوم',
  'TUN': 'تونس',
  'ALG': 'الجزائر',
  'CMN': 'الدار البيضاء',
  'RBA': 'الرباط',

  // East Africa / Labor Countries
  'ADD': 'أديس أبابا',
  'NBO': 'نيروبي',
  'MBA': 'مومباسا',
  'DAR': 'دار السلام',
  'EBB': 'كمبالا', // Entebbe/Kampala
  'ASM': 'أسمرة',
  'HGA': 'هرجيسا',
  'MGQ': 'مقديشو',

  // South / Southeast Asia / Labor Countries
  'DAC': 'دكا',
  'CGP': 'تشيتاجونج',
  'MNL': 'مانيلا',
  'CRK': 'كلارك',
  'CEB': 'سيبو',
  'CMB': 'كولومبو',
  'CGK': 'جاكرتا',
  'SUB': 'سورابايا',
  'KUL': 'كوالالمبور',
  'BKK': 'بانكوك',
  'DMK': 'بانكوك',
  'DEL': 'نيودلهي',
  'BOM': 'مومباي',
  'CCJ': 'كاليكوت',
  'COK': 'كوتشي',
  'MAA': 'تشيناي',
  'HYD': 'حيدر أباد',
  'BLR': 'بنغالور',
  'TRV': 'تريفاندروم',
  'ISB': 'إسلام آباد',
  'LHE': 'لاهور',
  'KHI': 'كراتشي',
  'PEW': 'بيشاور',
  'MUX': 'مولتان',
  'KTM': 'كاتماندو',
};

function resolveIataCity(code: string | null | undefined): string {
  if (!code) return '';
  const clean = code.trim().toUpperCase();
  
  if (iataToCityAr[clean]) {
    return iataToCityAr[clean];
  }
  
  for (const [iata, cityAr] of Object.entries(iataToCityAr)) {
    if (clean.includes(iata) || clean.includes(cityAr.toUpperCase())) {
      return cityAr;
    }
  }

  const engToArCities: Record<string, string> = {
    'ADDIS ABABA': 'أديس أبابا',
    'DOHA': 'الدوحة',
    'RIYADH': 'الرياض',
    'JEDDAH': 'جدة',
    'MADINAH': 'المدينة المنورة',
    'MEDINA': 'المدينة المنورة',
    'DAMMAM': 'الدمام',
    'CAIRO': 'القاهرة',
    'DUBAI': 'دبي',
    'MANILA': 'مانيلا',
    'DHAKA': 'دكا',
    'COLOMBO': 'كولومبو',
    'JAKARTA': 'جاكرتا',
    'NATIVE': 'الرياض',
  };

  for (const [eng, ar] of Object.entries(engToArCities)) {
    if (clean.includes(eng)) {
      return ar;
    }
  }

  return code;
}

function convert12hTo24h(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  const cleanStr = timeStr.trim().toUpperCase();
  
  // Detect PM if string contains 'PM' or 'م'
  const isPm = cleanStr.includes('PM') || cleanStr.includes('م');
  const isAm = cleanStr.includes('AM') || cleanStr.includes('ص');
  
  // Extract hours and minutes
  const match = /(\d{1,2}):(\d{2})/.exec(cleanStr);
  if (!match) return cleanStr;
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  
  if (isPm && hours < 12) hours += 12;
  if (isAm && hours === 12) hours = 0;
  
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

interface ApiResponse {
  data: {
    Order: {
      HomeMaid: {
        Name: string;
        Passportnumber: string;
        id: number;
        office: {
          Country: string;
        };
        age: number | null;
      };
      ClientName: string | null;
      id: number;
    };
    OrderId: number;
    HomemaidName: string;
    KingdomentryDate: string;
    KingdomentryTime: string;
    DeliveryDate: string;
    arrivalSaudiAirport: string;
    deparatureCityCountry: string;
    deparatureCityCountryDate: string;
    deparatureCityCountryTime: string;
    id: number;
  }[];
  totalPages: number;
}

const isToday = (dateVal: any): boolean => {
  if (!dateVal) return false;
  let dateString = "";
  if (typeof dateVal === 'string') {
    dateString = dateVal.split('T')[0];
  } else if (dateVal instanceof Date) {
    const y = dateVal.getFullYear();
    const m = String(dateVal.getMonth() + 1).padStart(2, '0');
    const day = String(dateVal.getDate()).padStart(2, '0');
    dateString = `${y}-${m}-${day}`;
  } else {
    const parsed = new Date(dateVal);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      dateString = `${y}-${m}-${day}`;
    }
  }
  if (!dateString) return false;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return dateString === `${y}-${m}-${d}`;
};

const getArrivalStatus = (dateVal: any, timeStr: string | null | undefined): string => {
  if (!dateVal) return 'لم تصل';
  let dateString = "";
  if (typeof dateVal === 'string') {
    dateString = dateVal.split('T')[0];
  } else if (dateVal instanceof Date) {
    const y = dateVal.getFullYear();
    const m = String(dateVal.getMonth() + 1).padStart(2, '0');
    const day = String(dateVal.getDate()).padStart(2, '0');
    dateString = `${y}-${m}-${day}`;
  } else {
    const parsed = new Date(dateVal);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      dateString = `${y}-${m}-${day}`;
    }
  }
  if (!dateString) return 'لم تصل';
  let hour = 0;
  let minute = 0;
  if (timeStr) {
    const cleanTime = convert12hTo24h(timeStr);
    const match = /(\d{1,2}):(\d{2})/.exec(cleanTime);
    if (match) {
      hour = parseInt(match[1], 10);
      minute = parseInt(match[2], 10);
    }
  }
  const [year, month, day] = dateString.split('-').map(Number);
  const arrivalDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (arrivalDate <= new Date()) {
    return 'وصلت';
  }
  if (isToday(dateVal)) {
    return 'ستصل اليوم';
  }
  return 'لم تصل';
};

const transformData = (data: any[]): TableRow[] => {
  return data.map((item) => ({
    workerId: String(item.Order?.HomeMaid?.id || 'غير محدد'),
    orderId: String(item.OrderId || 'غير محدد'),
    workerName: item.HomemaidName || item.Order?.HomeMaid?.Name || 'غير محدد',
    clientName: item.Order?.client?.fullname || 'غير متوفر',
    clientPhone: item.Order?.clientphonenumber || item.SponsorPhoneNumber || '',
    clientId: String(item.Order?.client?.id || ''),
    nationality: item.Order?.HomeMaid?.office?.Country || 'غير محدد',
    passport: item.Order?.HomeMaid?.Passportnumber || 'غير محدد',
    from: item.deparatureCityCountry || 'غير محدد',
    to: item.arrivalSaudiAirport || 'غير محدد',
    status: getArrivalStatus(item.KingdomentryDate, item.KingdomentryTime),
    arrivalDate: item.KingdomentryDate
      ? item.KingdomentryDate.split('T')[0]
      : 'غير محدد',
    departureDate: item.deparatureCityCountryDate
      ? item.deparatureCityCountryDate.split('T')[0]
      : 'غير محدد',
    departureTime: item.deparatureCityCountryTime || '',
    arrivalTime: item.KingdomentryTime || '',
  }));
};
const fetchData = async (
  page = 1,
  filters: {
    search: string;
    age: string;
    ArrivalCity: string;
    startDate: string;
    endDate: string;
  },
  setData: (data: TableRow[]) => void,
  setTotalPages: (pages: number) => void,
  setLoading: (loading: boolean) => void,
  isFetchingRef: React.MutableRefObject<boolean>,
  setStats: (stats: { total: number; arrived: number; pending: number }) => void
) => {
  if (isFetchingRef.current) return;
  isFetchingRef.current = true;
  setLoading(true);

  try {
    const queryParams = new URLSearchParams({
      search: filters.search,
      age: filters.age,
      ArrivalCity: filters.ArrivalCity,
      startDate: filters.startDate,
      endDate: filters.endDate,
      page: String(page),
      perPage: '10',
      ...(filters.fromCity && { fromCity: filters.fromCity }),
      ...(filters.toCity && { toCity: filters.toCity }),
      ...(filters.nationality && { nationality: filters.nationality }),
    });

    const response = await fetch(`/api/arrivals?${queryParams}`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });

    if (!response.ok) throw new Error('فشل جلب البيانات');
    const { data: res, totalPages: pages, totalCount, arrivedCount, pendingCount } = await response.json();
    if (res && res.length > 0) {
      const transformedData = transformData(res);
      setData(transformedData);
      setTotalPages(pages || 1);
      setStats({
        total: totalCount || 0,
        arrived: arrivedCount || 0,
        pending: pendingCount || 0,
      });
    } else {
      setData([]);
      setTotalPages(1);
      setStats({ total: 0, arrived: 0, pending: 0 });
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    setData([]);
    setTotalPages(1);
    setStats({ total: 0, arrived: 0, pending: 0 });
  } finally {
    setLoading(false);
    isFetchingRef.current = false;
  }
};




const fetchCities = async (setCities: (cities: string[]) => void) => {
  try {
    const response = await fetch('/api/arrivals?perPage=1000', {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });
    if (!response.ok) throw new Error('فشل جلب المدن');
    const { data }: ApiResponse = await response.json();
    const cities = Array.from(new Set(data.map((item) => item.arrivalSaudiAirport).filter((city): city is string => !!city && city.trim() !== '')));
    setCities(['كل المدن', ...cities]);
  } catch (error) {
    console.error('Error fetching cities:', error);
    setCities(['كل المدن']);
  }
};
const ColumnSelector = ({
  visibleColumns,
  setVisibleColumns,
}: {
  visibleColumns: string[];
  setVisibleColumns: (columns: string[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const columns = [
    { key: 'orderId', label: 'رقم الطلب' },
    { key: 'workerName', label: 'اسم العاملة' },
    { key: 'clientName', label: 'اسم العميل' },
    { key: 'nationality', label: 'الجنسية' },
    { key: 'passport', label: 'رقم الجواز' },
    { key: 'from', label: 'من' },
    { key: 'to', label: 'إلى' },
    { key: 'status', label: 'حالة الوصول' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = (columnKey: string) => {
    if (visibleColumns.includes(columnKey)) {
      setVisibleColumns(visibleColumns.filter((col) => col !== columnKey));
    } else {
      setVisibleColumns([...visibleColumns, columnKey]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-xl shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-all font-medium text-sm h-11"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
        <span>تحديد الأعمدة</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 border-b border-gray-50 mb-1">الأعمدة النشطة</div>
          {columns.map((column) => (
            <label key={column.key} className="flex items-center gap-3 px-4 py-2 hover:bg-teal-50/40 cursor-pointer transition-colors text-sm text-gray-700 font-medium">
              <input
                type="checkbox"
                checked={visibleColumns.includes(column.key)}
                onChange={() => toggleColumn(column.key)}
                className="rounded text-teal-800 focus:ring-teal-700 h-4.5 w-4.5 border-gray-300"
              />
              <span>{column.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const Controls = ({
  setFilters,
  visibleColumns,
  setVisibleColumns,
  data,
  exportToExcel,
  exportToPDF
}: {
  setFilters: (filters: any) => void;
  visibleColumns: string[];
  setVisibleColumns: (columns: string[]) => void;
  data: TableRow[];
  exportToExcel: () => void;
  exportToPDF: () => void;
}) => {
  const [cities, setCities] = useState<string[]>(['كل المدن']);
  const [selectedCity, setSelectedCity] = useState('كل المدن');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchCities(setCities);
  }, []);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setFilters((prev: any) => ({
      ...prev,
      ArrivalCity: city === 'كل المدن' ? '' : city,
    }));
  };

  const handleStartDateChange = (dateStr: string) => {
    setStartDate(dateStr);
    setFilters((prev: any) => ({
      ...prev,
      startDate: dateStr,
    }));
  };

  const handleEndDateChange = (dateStr: string) => {
    setEndDate(dateStr);
    setFilters((prev: any) => ({
      ...prev,
      endDate: dateStr,
    }));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-8">
      {/* فلاتر البحث والتصنيف والتصدير موزعة بجمال على كامل السطر */}
      <div className="flex flex-wrap items-center gap-2.5 justify-start w-full">
        
        {/* حقل البحث المتمدد لاستغلال المساحة */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex-grow flex-1 min-w-[200px] focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-700/10 transition-all shadow-sm">
          <SearchIcon className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="بحث باسم الكفيل، الجواز أو الطلب..."
            onChange={(e) =>
              setFilters((prev: any) => ({ ...prev, search: e.target.value }))
            }
            className="bg-transparent border-none outline-none text-xs text-gray-800 placeholder-gray-400 w-full font-medium"
          />
        </div>

        {/* اختيار المدينة */}
        <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 w-full md:w-36 focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-700/10 transition-all shadow-sm">
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-gray-700 w-full cursor-pointer font-medium"
            style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', backgroundImage: 'none' }}
          >
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <div className="absolute left-3 pointer-events-none text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>

        {/* اختيار التاريخ من */}
        <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2.5 w-full md:w-36 focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-700/10 transition-all shadow-sm">
          <span className="text-xs text-gray-400 font-bold whitespace-nowrap">من:</span>
          <input
            type={startDate ? "date" : "text"}
            placeholder="سنة / شهر / يوم"
            onFocus={(e) => (e.target.type = 'date')}
            onBlur={(e) => {
              if (!e.target.value) e.target.type = 'text';
            }}
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs text-gray-700 w-full cursor-pointer font-medium p-0"
          />
        </div>

        {/* اختيار التاريخ إلى */}
        <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2.5 w-full md:w-36 focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-700/10 transition-all shadow-sm">
          <span className="text-xs text-gray-400 font-bold whitespace-nowrap">إلى:</span>
          <input
            type={endDate ? "date" : "text"}
            placeholder="سنة / شهر / يوم"
            onFocus={(e) => (e.target.type = 'date')}
            onBlur={(e) => {
              if (!e.target.value) e.target.type = 'text';
            }}
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs text-gray-700 w-full cursor-pointer font-medium p-0"
          />
        </div>

        {/* زر إعادة الضبط كأيقونة فقط بجانب التاريخ */}
        <button
          className="flex items-center justify-center bg-gray-50 hover:bg-gray-150 active:bg-gray-200 text-gray-600 w-11 h-11 rounded-xl transition-all border border-gray-200 shadow-sm"
          title="إعادة تعيين الفلاتر"
          onClick={() => {
            setFilters({
              search: '',
              age: '',
              ArrivalCity: '',
              startDate: '',
              endDate: '',
              fromCity: '',
              toCity: '',
              nationality: '',
            });
            setSelectedCity('كل المدن');
            setStartDate('');
            setEndDate('');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>

        <ColumnSelector visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns} />

        {/* أزرار التصدير الأنيقة والمتباعدة بجمال */}
        <button
          className="flex items-center gap-1 bg-teal-900 text-white px-3 py-2 rounded-xl disabled:opacity-50 text-xs font-semibold h-11 hover:bg-teal-950 transition-colors shadow-sm"
          onClick={exportToExcel}
        >
          <FileExcelOutlined className="w-3.5 h-3.5" />
          <span>Excel</span>
        </button>
        <button
          className="flex items-center gap-1 bg-teal-900 text-white px-3 py-2 rounded-xl disabled:opacity-50 text-xs font-semibold h-11 hover:bg-teal-950 transition-colors shadow-sm"
          onClick={exportToPDF}
        >
          <FilePdfOutlined className="w-3 h-3" />
          <span>PDF</span>
        </button>
      </div>
    </div>
  );
};

const Table = ({ 
  data, 
  visibleColumns,
  filters,
  setFilters,
  setPage
}: { 
  data: TableRow[]; 
  visibleColumns: string[];
  filters: any;
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  setPage: (page: number) => void;
}) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isNatDropdownOpen, setIsNatDropdownOpen] = useState(false);
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number } | null>(null);
  const [fromCoords, setFromCoords] = useState<{ top: number; left: number } | null>(null);
  const [toCoords, setToCoords] = useState<{ top: number; left: number } | null>(null);
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  const [nationalities, setNationalities] = useState<any[]>([]);

  const natDropdownRef = useRef<HTMLTableHeaderCellElement>(null);
  const fromDropdownRef = useRef<HTMLTableHeaderCellElement>(null);
  const toDropdownRef = useRef<HTMLTableHeaderCellElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const fetchNationalities = async () => {
      try {
        const response = await fetch('/api/nationalities');
        const resData = await response.json();
        setNationalities(resData.nationalities || []);
      } catch (error) {
        console.error('Error fetching nationalities:', error);
      }
    };
    fetchNationalities();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        natDropdownRef.current && 
        !natDropdownRef.current.contains(event.target as Node) &&
        !target.closest("#nationality-filter-dropdown")
      ) {
        setIsNatDropdownOpen(false);
      }
      if (
        fromDropdownRef.current &&
        !fromDropdownRef.current.contains(event.target as Node) &&
        !target.closest("#from-filter-dropdown")
      ) {
        setIsFromDropdownOpen(false);
        setFromSearch("");
      }
      if (
        toDropdownRef.current &&
        !toDropdownRef.current.contains(event.target as Node) &&
        !target.closest("#to-filter-dropdown")
      ) {
        setIsToDropdownOpen(false);
        setToSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDropdownToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isNatDropdownOpen) {
      setIsNatDropdownOpen(false);
    } else {
      const trigger = e.currentTarget;
      const container = document.getElementById("arrival-table-container");
      if (container) {
        let el: HTMLElement | null = trigger;
        let left = 0;
        let top = 0;
        while (el && el !== container) {
          left += el.offsetLeft;
          top += el.offsetTop;
          el = el.offsetParent as HTMLElement | null;
        }
        left = left + trigger.offsetWidth - 208;
        top = top + trigger.offsetHeight + 8;
        setDropdownCoords({ top, left });
      }
      setIsNatDropdownOpen(true);
    }
  };

  const handleFromDropdownToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isFromDropdownOpen) {
      setIsFromDropdownOpen(false);
      setFromSearch("");
    } else {
      const trigger = e.currentTarget;
      const container = document.getElementById("arrival-table-container");
      if (container) {
        let el: HTMLElement | null = trigger;
        let left = 0;
        let top = 0;
        while (el && el !== container) {
          left += el.offsetLeft;
          top += el.offsetTop;
          el = el.offsetParent as HTMLElement | null;
        }
        left = left + trigger.offsetWidth - 208;
        top = top + trigger.offsetHeight + 8;
        setFromCoords({ top, left });
      }
      setIsFromDropdownOpen(true);
    }
  };

  const handleToDropdownToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isToDropdownOpen) {
      setIsToDropdownOpen(false);
      setToSearch("");
    } else {
      const trigger = e.currentTarget;
      const container = document.getElementById("arrival-table-container");
      if (container) {
        let el: HTMLElement | null = trigger;
        let left = 0;
        let top = 0;
        while (el && el !== container) {
          left += el.offsetLeft;
          top += el.offsetTop;
          el = el.offsetParent as HTMLElement | null;
        }
        left = left + trigger.offsetWidth - 208;
        top = top + trigger.offsetHeight + 8;
        setToCoords({ top, left });
      }
      setIsToDropdownOpen(true);
    }
  };

  const columns = [
    { key: 'orderId', label: 'رقم الطلب' },
    { key: 'workerName', label: 'اسم العاملة' },
    { key: 'clientName', label: 'اسم العميل' },
    { key: 'nationality', label: 'الجنسية' },
    { key: 'passport', label: 'رقم الجواز' },
    { key: 'from', label: 'من' },
    { key: 'to', label: 'إلى' },
    { key: 'status', label: 'حالة الوصول' },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="overflow-x-auto relative min-h-[450px]" id="arrival-table-container">
        <table className="w-full border-collapse min-w-[1000px] text-right">
          <thead>
            <tr className="bg-teal-900 text-white text-sm font-medium">
              {columns
                .filter((col) => visibleColumns.includes(col.key))
                .map((col) => {
                  if (col.key === 'nationality') {
                    return (
                      <th key={col.key} className="py-4 px-5 text-right font-medium tracking-wide relative" ref={natDropdownRef}>
                        <div className="flex items-center gap-1.5 justify-start">
                          <span>الجنسية</span>
                          <button
                            onClick={handleDropdownToggle}
                            className={`p-1 rounded hover:bg-teal-800 transition-colors flex items-center justify-center ${filters.nationality ? 'text-amber-400 font-bold' : 'text-teal-200 hover:text-white'}`}
                            title="تصفية حسب الجنسية"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18m-2 0v2.286a2 2 0 0 1-.586 1.414l-5.828 5.828a2 2 0 0 0-.586 1.414v4.556a1 1 0 0 1-1.447.894l-2-1a1 1 0 0 1-.553-.894v-3.556a2 2 0 0 0-.586-1.414L3.586 8.2a2 2 0 0 1-.586-1.414V4.5z" />
                            </svg>
                          </button>
                        </div>
                      </th>
                    );
                  }
                  if (col.key === 'from') {
                    return (
                      <th key={col.key} className="py-4 px-5 text-right font-medium tracking-wide relative" ref={fromDropdownRef}>
                        <div className="flex items-center gap-1.5 justify-start">
                          <span>من</span>
                          <button
                            onClick={handleFromDropdownToggle}
                            className={`p-1 rounded hover:bg-teal-800 transition-colors flex items-center justify-center ${filters.fromCity ? 'text-amber-400 font-bold' : 'text-teal-200 hover:text-white'}`}
                            title="تصفية حسب مدينة المغادرة"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18m-2 0v2.286a2 2 0 0 1-.586 1.414l-5.828 5.828a2 2 0 0 0-.586 1.414v4.556a1 1 0 0 1-1.447.894l-2-1a1 1 0 0 1-.553-.894v-3.556a2 2 0 0 0-.586-1.414L3.586 8.2a2 2 0 0 1-.586-1.414V4.5z" />
                            </svg>
                          </button>
                        </div>
                      </th>
                    );
                  }
                  if (col.key === 'to') {
                    return (
                      <th key={col.key} className="py-4 px-5 text-right font-medium tracking-wide relative" ref={toDropdownRef}>
                        <div className="flex items-center gap-1.5 justify-start">
                          <span>إلى</span>
                          <button
                            onClick={handleToDropdownToggle}
                            className={`p-1 rounded hover:bg-teal-800 transition-colors flex items-center justify-center ${filters.toCity ? 'text-amber-400 font-bold' : 'text-teal-200 hover:text-white'}`}
                            title="تصفية حسب وجهة الوصول"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18m-2 0v2.286a2 2 0 0 1-.586 1.414l-5.828 5.828a2 2 0 0 0-.586 1.414v4.556a1 1 0 0 1-1.447.894l-2-1a1 1 0 0 1-.553-.894v-3.556a2 2 0 0 0-.586-1.414L3.586 8.2a2 2 0 0 1-.586-1.414V4.5z" />
                            </svg>
                          </button>
                        </div>
                      </th>
                    );
                  }
                  return (
                    <th
                      key={col.key}
                      className={`py-4 px-5 text-right font-medium tracking-wide ${
                        col.key === 'from' || col.key === 'to' ? 'min-w-[150px]' : ''
                      }`}
                    >
                      {col.label}
                    </th>
                  );
                })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-teal-50/20 transition-colors duration-150">
                {visibleColumns.includes('orderId') && (
                  <td className="py-4 px-5 text-sm font-semibold text-teal-900 cursor-pointer hover:underline" onClick={() => router.push(`/admin/track_order/${row.orderId}`)}>
                    {row.orderId}
                  </td>
                )}
                {visibleColumns.includes('workerName') && (
                  <td className="py-4 px-5 text-sm font-semibold text-teal-900 cursor-pointer hover:underline" onClick={() => router.push(`/admin/homemaidinfo?id=${row.workerId}`)}>
                    {row.workerName}
                  </td>
                )}
                {visibleColumns.includes('clientName') && (
                  <td className="py-4 px-5 text-right vertical-align-top">
                    <span 
                      className="text-sm font-semibold text-teal-900 cursor-pointer hover:underline block" 
                      onClick={() => router.push(`/admin/clientdetails?id=${row.clientId || ''}`)}
                    >
                      {row.clientName}
                    </span>
                    {row.clientPhone && (
                      <span className="text-[11px] font-mono text-gray-500 block mt-1">
                        {row.clientPhone}
                      </span>
                    )}
                  </td>
                )}
                {visibleColumns.includes('nationality') && (
                  <td className="py-4 px-5 text-sm text-gray-600">{row.nationality}</td>
                )}
                {visibleColumns.includes('passport') && (
                  <td className="py-4 px-5 text-sm font-mono text-gray-600">{row.passport}</td>
                )}
                {visibleColumns.includes('from') && (
                  <td className="py-4 px-5 text-right vertical-align-top min-w-[150px]">
                    <div className="text-sm font-bold text-teal-950 whitespace-nowrap">{row.from}</div>
                    <div className="text-sm font-semibold text-gray-500 font-mono mt-1 whitespace-nowrap">{row.departureDate}</div>
                    {row.departureTime && (
                      <div className="text-sm text-gray-400 font-medium font-mono mt-0.5 whitespace-nowrap">{row.departureTime}</div>
                    )}
                  </td>
                )}
                {visibleColumns.includes('to') && (
                  <td className="py-4 px-5 text-right vertical-align-top min-w-[150px]">
                    <div className="text-sm font-bold text-teal-950 whitespace-nowrap">{row.to}</div>
                    <div className="text-sm font-semibold text-gray-500 font-mono mt-1 whitespace-nowrap">{row.arrivalDate}</div>
                    {row.arrivalTime && (
                      <div className="text-sm text-gray-400 font-medium font-mono mt-0.5 whitespace-nowrap">{row.arrivalTime}</div>
                    )}
                  </td>
                )}
                {visibleColumns.includes('status') && (
                  <td className="py-4 px-5">
                    {row.status === 'وصلت' ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}>
                        <span className="animate-pulse" style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          display: 'inline-block'
                        }}></span>
                        وصلت
                      </span>
                    ) : row.status === 'ستصل اليوم' ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        whiteSpace: 'nowrap'
                      }}>
                        <span className="animate-pulse" style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#3b82f6',
                          display: 'inline-block'
                        }}></span>
                        ستصل اليوم
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: '#fffbeb',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        whiteSpace: 'nowrap'
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#f59e0b',
                          display: 'inline-block'
                        }}></span>
                        لم تصل
                      </span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {isMounted && isNatDropdownOpen && dropdownCoords && (
          <div 
            id="nationality-filter-dropdown"
            dir="rtl"
            style={{ 
              position: 'absolute', 
              top: `${dropdownCoords.top}px`, 
              left: `${dropdownCoords.left}px`,
              width: '208px',
              zIndex: 9999
            }}
            className="bg-white border border-gray-150 rounded-2xl shadow-xl py-2.5 text-right animate-in fade-in slide-in-from-top-2 duration-200 text-gray-700 font-medium tracking-normal"
          >
            <div className="px-4 py-2 text-xs font-semibold text-teal-800 bg-teal-50/30 border-b border-gray-100 mb-1.5 flex justify-between items-center">
              <span>تصفية حسب الجنسية</span>
              <span className="text-[10px] text-gray-400 font-normal">اختر دولة</span>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <button
                onClick={() => { setFilters(prev => ({ ...prev, nationality: "" })); setIsNatDropdownOpen(false); setPage(1); }}
                className={`w-full text-right px-4 py-2 hover:bg-teal-50/50 text-sm font-medium transition-colors duration-150 flex items-center justify-between ${!filters.nationality ? 'text-teal-900 font-bold bg-teal-50/30' : 'text-gray-600'}`}
              >
                <span>كل الجنسيات</span>
                {!filters.nationality && <span className="w-1.5 h-1.5 rounded-full bg-teal-700"></span>}
              </button>
              {nationalities?.map((nat) => (
                <button
                  key={nat.id}
                  onClick={() => { setFilters(prev => ({ ...prev, nationality: nat.Country })); setIsNatDropdownOpen(false); setPage(1); }}
                  className={`w-full text-right px-4 py-2 hover:bg-teal-50/50 text-sm font-medium transition-colors duration-150 flex items-center justify-between ${filters.nationality === nat.Country ? 'text-teal-900 font-bold bg-teal-50/30' : 'text-gray-600'}`}
                >
                  <span>{nat.Country}</span>
                  {filters.nationality === nat.Country && <span className="w-1.5 h-1.5 rounded-full bg-teal-700"></span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {isMounted && isFromDropdownOpen && fromCoords && (
          <div 
            id="from-filter-dropdown"
            dir="rtl"
            style={{ 
              position: 'absolute', 
              top: `${fromCoords.top}px`, 
              left: `${fromCoords.left}px`,
              width: '208px',
              zIndex: 9999
            }}
            className="bg-white border border-gray-150 rounded-2xl shadow-xl py-2 text-right animate-in fade-in slide-in-from-top-2 duration-200 text-gray-700 font-medium tracking-normal"
          >
            <div className="px-3 py-1.5 border-b border-gray-100 mb-1">
              <input
                type="text"
                placeholder="بحث عن مدينة..."
                value={fromSearch}
                onChange={(e) => setFromSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700/10 font-medium"
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              <button
                onClick={() => { setFilters(prev => ({ ...prev, fromCity: "" })); setFromSearch(""); setIsFromDropdownOpen(false); setPage(1); }}
                className={`w-full text-right px-4 py-2 hover:bg-teal-50/50 text-sm font-medium transition-colors duration-150 flex items-center justify-between ${!filters.fromCity ? 'text-teal-900 font-bold bg-teal-50/30' : 'text-gray-600'}`}
              >
                <span>كل المدن</span>
                {!filters.fromCity && <span className="w-1.5 h-1.5 rounded-full bg-teal-700"></span>}
              </button>
              {worldCities
                ?.filter(city => city.value.includes(fromSearch) || city.label.toLowerCase().includes(fromSearch.toLowerCase()))
                ?.map((city, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setFilters(prev => ({ ...prev, fromCity: city.value })); setFromSearch(""); setIsFromDropdownOpen(false); setPage(1); }}
                    className={`w-full text-right px-4 py-2 hover:bg-teal-50/50 text-sm font-medium transition-colors duration-150 flex items-center justify-between ${filters.fromCity === city.value ? 'text-teal-900 font-bold bg-teal-50/30' : 'text-gray-600'}`}
                  >
                    <span>{city.value}</span>
                    {filters.fromCity === city.value && <span className="w-1.5 h-1.5 rounded-full bg-teal-700"></span>}
                  </button>
                ))}
            </div>
          </div>
        )}

        {isMounted && isToDropdownOpen && toCoords && (
          <div 
            id="to-filter-dropdown"
            dir="rtl"
            style={{ 
              position: 'absolute', 
              top: `${toCoords.top}px`, 
              left: `${toCoords.left}px`,
              width: '208px',
              zIndex: 9999
            }}
            className="bg-white border border-gray-150 rounded-2xl shadow-xl py-2 text-right animate-in fade-in slide-in-from-top-2 duration-200 text-gray-700 font-medium tracking-normal"
          >
            <div className="px-3 py-1.5 border-b border-gray-100 mb-1">
              <input
                type="text"
                placeholder="بحث عن مدينة..."
                value={toSearch}
                onChange={(e) => setToSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700/10 font-medium"
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              <button
                onClick={() => { setFilters(prev => ({ ...prev, toCity: "" })); setToSearch(""); setIsToDropdownOpen(false); setPage(1); }}
                className={`w-full text-right px-4 py-2 hover:bg-teal-50/50 text-sm font-medium transition-colors duration-150 flex items-center justify-between ${!filters.toCity ? 'text-teal-900 font-bold bg-teal-50/30' : 'text-gray-600'}`}
              >
                <span>كل المدن</span>
                {!filters.toCity && <span className="w-1.5 h-1.5 rounded-full bg-teal-700"></span>}
              </button>
              {saudiCities
                ?.filter(city => city.value.includes(toSearch) || city.label.toLowerCase().includes(toSearch.toLowerCase()))
                ?.map((city, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setFilters(prev => ({ ...prev, toCity: city.value })); setToSearch(""); setIsToDropdownOpen(false); setPage(1); }}
                    className={`w-full text-right px-4 py-2 hover:bg-teal-50/50 text-sm font-medium transition-colors duration-150 flex items-center justify-between ${filters.toCity === city.value ? 'text-teal-900 font-bold bg-teal-50/30' : 'text-gray-600'}`}
                  >
                    <span>{city.value}</span>
                    {filters.toCity === city.value && <span className="w-1.5 h-1.5 rounded-full bg-teal-700"></span>}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Pagination = ({
  currentPage,
  totalPages,
  setPage,
}: {
  currentPage: number;
  totalPages: number;
  setPage: (page: number) => void;
}) => (
  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
    <p className="text-sm font-medium text-gray-500">
      عرض <span className="text-gray-800">{(currentPage - 1) * 10 + 1}</span> إلى <span className="text-gray-800">{Math.min(currentPage * 10, totalPages * 10)}</span> من <span className="text-gray-850 font-bold">{totalPages * 10}</span> نتيجة
    </p>
    <nav className="flex items-center gap-1">
      <button
        className={`px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all ${
          currentPage === 1 ? 'opacity-40 cursor-not-allowed' : ''
        }`}
        onClick={(e) => {
          e.preventDefault();
          if (currentPage > 1) setPage(currentPage - 1);
        }}
        disabled={currentPage === 1}
      >
        السابق
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          className={`w-9 h-9 flex items-center justify-center text-sm rounded-xl font-semibold border transition-all ${
            page === currentPage
              ? 'bg-teal-900 text-white border-teal-900 shadow-sm'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
          onClick={(e) => {
            e.preventDefault();
            setPage(page);
          }}
        >
          {page}
        </button>
      ))}
      <button
        className={`px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all ${
          currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : ''
        }`}
        onClick={(e) => {
          e.preventDefault();
          if (currentPage < totalPages) setPage(currentPage + 1);
        }}
        disabled={currentPage === totalPages}
      >
        التالي
      </button>
    </nav>
  </div>
);

const Modal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-gray-100 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">هل ترغب بتأكيد وصول العاملة؟</h2>
        <label className="block text-right text-sm font-medium text-gray-800 mb-2">
          إضافة ملاحظات إن وجدت
        </label>
        <textarea
          className="w-full min-h-[70px] p-3 border border-gray-300 rounded-lg bg-gray-50 text-right focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-teal-900/20 mb-6"
          placeholder="إضافة ملاحظة"
        ></textarea>
        <div className="flex justify-center gap-6">
          <button
            className="border border-gray-800 text-gray-800 rounded-md px-6 py-2 text-base hover:bg-teal-900 hover:text-white"
            onClick={onClose}
          >
            إلغاء
          </button>
          <button className="bg-teal-900 text-white rounded-md px-6 py-2 text-base hover:bg-teal-900">
            نعم
          </button>
        </div>
      </div>
    </div>
  );
};

const PermissionModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-[1000]">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center relative">
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
        <p className="text-red-600">غير مصرح لك بعرض هذه الصفحة</p>
        <button
          className="bg-teal-900 text-white px-4 py-2 rounded mt-4 hover:bg-teal-800 transition duration-200"
          onClick={onClose}
        >
          موافق
        </button>
      </div>
    </div>
  );
};

const BulkArrivalModal = ({ isOpen, onClose, onRefresh }: { isOpen: boolean; onClose: () => void; onRefresh: () => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<any[]>([]);
  const selectedIds = selectedWorkers.map((w) => w.orderId);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    departureCity: '',
    arrivalCity: '',
    departureDate: '',
    departureTime: '',
    arrivalDate: '',
    arrivalTime: '',
    deliveryOfficer: '',
  });

  const [users, setUsers] = useState<Array<{id: number, username: string}>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await fetch('/api/usersfortask');
        if (response.ok) {
          const userData = await response.json();
          setUsers(userData);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const userOptions = users.map(user => ({
    value: user.id.toString(),
    label: user.username
  }));

  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [progressMsg, setProgressMsg] = useState('');

  const departureDateRef = useRef<HTMLInputElement>(null);
  const arrivalDateRef = useRef<HTMLInputElement>(null);
  const departureTimeRef = useRef<HTMLInputElement>(null);
  const arrivalTimeRef = useRef<HTMLInputElement>(null);

  const [showResults, setShowResults] = useState(false);

  const [clickedOrders, setClickedOrders] = useState<Record<string, boolean>>({});
  const [refreshingOrders, setRefreshingOrders] = useState<Record<string, boolean>>({});
  const [successOrders, setSuccessOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setAlertMsg(null);
      setSelectedWorkers([]);
      setWorkers([]);
      setSearchTerm('');
      setClickedOrders({});
      setRefreshingOrders({});
      setSuccessOrders({});
      setFormData({
        departureCity: '',
        arrivalCity: '',
        departureDate: '',
        departureTime: '',
        arrivalDate: '',
        arrivalTime: '',
        deliveryOfficer: '',
      });
      setTicketFile(null);
    }
  }, [isOpen]);

  const handleRefreshWorker = async (orderId: string) => {
    setRefreshingOrders((prev) => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch(`/api/bulk-arrival-search?search=${orderId}`);
      if (!res.ok) throw new Error('فشل تحديث حالة الطلب');
      const data = await res.json();
      const updatedWorker = data.data?.find((w: any) => String(w.orderId) === String(orderId));
      if (updatedWorker) {
        setSelectedWorkers((prev) =>
          prev.map((w) => (String(w.orderId) === String(orderId) ? updatedWorker : w))
        );
        setSuccessOrders((prev) => ({ ...prev, [orderId]: true }));
        setTimeout(() => {
          setSuccessOrders((prev) => ({ ...prev, [orderId]: false }));
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshingOrders((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bulk-arrival-search?search=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) throw new Error('فشل جلب العاملات');
      const data = await res.json();
      setWorkers(data.data || []);
      setShowResults(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ غير متوقع أثناء البحث');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedWorkers((prev) => {
        const next = [...prev];
        workers.forEach((w) => {
          if (!next.some((x) => x.orderId === w.orderId)) {
            next.push(w);
          }
        });
        return next;
      });
    } else {
      const visibleIds = workers.map((w) => w.orderId);
      setSelectedWorkers((prev) => prev.filter((w) => !visibleIds.includes(w.orderId)));
    }
  };

  const handleSelectWorker = (worker: any, checked: boolean) => {
    if (checked) {
      setSelectedWorkers((prev) => {
        if (prev.some((w) => w.orderId === worker.orderId)) return prev;
        return [...prev, worker];
      });
    } else {
      setSelectedWorkers((prev) => prev.filter((w) => w.orderId !== worker.orderId));
    }
  };

  const [extracting, setExtracting] = useState(false);

  const runTicketDataExtraction = async (file: File) => {
    setExtracting(true);
    setError(null);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file, file.name);

      const res = await fetch('https://aidoc.rawaes.com/api/extractdatafromtickets', {
        method: 'POST',
        body: formDataUpload,
      });

      let json: Record<string, any> = {};
      try {
        json = await res.json();
      } catch {
        /* ignore */
      }

      if (!res.ok) {
        const msg = json.error || json.providerError || 'فشل استخراج بيانات التذكرة';
        throw new Error(msg);
      }

      const details = json.tickets_details;
      if (!details || typeof details !== 'object') {
        throw new Error('لم يتم العثور على تفاصيل تذكرة صالحة في الملف');
      }

      setFormData((prev) => ({
        ...prev,
        departureCity: details.departure_airport ? resolveIataCity(String(details.departure_airport)) : prev.departureCity,
        arrivalCity: details.arrival_airport ? resolveIataCity(String(details.arrival_airport)) : prev.arrivalCity,
        departureDate: details.departure_date ? formatDateToYMD(details.departure_date) : prev.departureDate,
        departureTime: details.departure_time ? convert12hTo24h(String(details.departure_time)) : prev.departureTime,
        arrivalDate: details.arrival_date ? formatDateToYMD(details.arrival_date) : prev.arrivalDate,
        arrivalTime: details.arrival_time ? convert12hTo24h(String(details.arrival_time)) : prev.arrivalTime,
      }));

      setAlertMsg('تم استخراج بيانات التذكرة وتعبئتها بنجاح عن طريق الذكاء الاصطناعي!');
      setTimeout(() => setAlertMsg(null), 3000);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'حدث خطأ أثناء استخراج بيانات التذكرة عبر الذكاء الاصطناعي');
    } finally {
      setExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setTicketFile(file);
      void runTicketDataExtraction(file);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      setError('يرجى اختيار عاملة واحدة على الأقل من الجدول لإجراء التحديث الجماعي');
      return;
    }

    // Validate if all selected workers are ready for destinations
    const unreadyWorkers = selectedWorkers.filter(w => !w.isReadyForDestinations);
    if (unreadyWorkers.length > 0) {
      const names = unreadyWorkers.map(w => w.workerName).join('، ');
      setError(`خطأ: العاملات التاليات لم يصلن لمرحلة إدخال الوجهات بعد (يجب إصدار تصريح السفر أولاً): [${names}]. يرجى إزالتهن من القائمة المحددة أو تحديث خطهن الزمني لإتمام العملية.`);
      return;
    }

    // Validate if any selected worker already has a current flight
    const workersWithFlight = selectedWorkers.filter(w => w.from || w.to);
    if (workersWithFlight.length > 0) {
      const names = workersWithFlight.map(w => w.workerName).join('، ');
      setError(`خطأ: العاملات التاليات لديهن رحلة مسجلة حالياً بالفعل: [${names}]. يرجى إزالتهن من القائمة أولاً لتفادي تعارض البيانات.`);
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
          'deliveryOfficer': formData.deliveryOfficer,
        };

        if (uploadedFilePath) {
          updatedData.ticketFile = uploadedFilePath;
        }

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
      setSelectedWorkers([]);
      setFormData({
        departureCity: '',
        arrivalCity: '',
        departureDate: '',
        departureTime: '',
        arrivalDate: '',
        arrivalTime: '',
      });
      setTicketFile(null);
      
      setTimeout(() => {
        setAlertMsg(null);
        onRefresh();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء إجراء التحديث الجماعي');
    } finally {
      setUpdating(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .force-english-nums {
            font-family: Arial, Helvetica, sans-serif !important;
            font-feature-settings: "lnum" 1, "locl" 0 !important;
            font-variant-numeric: lining-nums !important;
            -webkit-locale: "en-US" !important;
            direction: ltr !important;
            text-align: right !important;
          }
          .force-english-nums::-webkit-datetime-edit,
          .force-english-nums::-webkit-datetime-edit-fields-wrapper,
          .force-english-nums::-webkit-datetime-edit-text,
          .force-english-nums::-webkit-datetime-edit-minute,
          .force-english-nums::-webkit-datetime-edit-hour,
          .force-english-nums::-webkit-datetime-edit-ampm,
          .force-english-nums::-webkit-datetime-edit-day-field,
          .force-english-nums::-webkit-datetime-edit-month-field,
          .force-english-nums::-webkit-datetime-edit-year-field {
            -webkit-locale: "en-US" !important;
            font-family: Arial, Helvetica, sans-serif !important;
            font-feature-settings: "lnum" 1, "locl" 0 !important;
            font-variant-numeric: lining-nums !important;
            direction: ltr !important;
          }
        `}</style>
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-black text-teal-950">إضافة وصول جماعي</h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">تحديث بيانات الرحلة والوصول لعدة عاملات قادمات في نفس الرحلة بضغطة واحدة</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Feedback Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold shadow-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {alertMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold shadow-sm">
              <Check className="w-5 h-5 flex-shrink-0 bg-emerald-100 rounded-full p-0.5 text-emerald-800" />
              <span>{alertMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Right: Search & Selection */}
            <div className="lg:col-span-2 space-y-5">
              <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/20">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-5.5 h-5.5 rounded-full bg-teal-50 text-teal-900 flex items-center justify-center text-xs font-black">١</span>
                  <span>البحث واختيار العاملات للوصول الجماعي</span>
                </h3>

                <div className="relative mb-6">
                  <form onSubmit={handleSearch} className="flex gap-2.5">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-grow focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-700/10 transition-all shadow-sm">
                      <Search className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="ابحث باسم العاملة، رقم الجواز، العميل، الهاتف، أو رقم الطلب..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          if (showResults) setShowResults(false);
                        }}
                        className="bg-transparent border-none outline-none text-xs text-gray-800 placeholder-gray-400 w-full font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-teal-900 text-white px-5 rounded-xl hover:bg-teal-950 font-bold text-xs h-10 shadow-sm transition-colors disabled:opacity-50"
                    >
                      {loading ? 'جاري البحث...' : 'بحث'}
                    </button>
                  </form>

                  {/* Floating Autocomplete Dropdown Search Results */}
                  {showResults && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-[100] max-h-[250px] overflow-y-auto divide-y divide-gray-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      {workers.length === 0 ? (
                        <div className="p-5 text-center text-gray-400 font-bold text-xs">
                          لا توجد نتائج مطابقة لبحثك. يرجى التأكد من كتابة الاسم أو رقم جواز السفر بشكل صحيح.
                        </div>
                      ) : (
                        workers.map((worker) => {
                          const isAlreadyAdded = selectedWorkers.some((w) => w.orderId === worker.orderId);
                          return (
                            <div
                              key={worker.orderId}
                              onClick={() => {
                                if (!isAlreadyAdded) {
                                  handleSelectWorker(worker, true);
                                }
                                setShowResults(false);
                              }}
                              className={`p-3.5 flex justify-between items-center cursor-pointer transition-colors text-right text-xs ${
                                isAlreadyAdded ? 'bg-teal-50/10 opacity-70 cursor-not-allowed' : 'hover:bg-teal-50/30'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="font-extrabold text-teal-950 flex items-center gap-1.5 flex-wrap">
                                  <span>{worker.workerName}</span>
                                  {!worker.isReadyForDestinations && (
                                    <span className="text-[9px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded font-extrabold whitespace-nowrap">
                                      لم تصل لمرحلة الوجهات
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-500 font-bold">
                                  <span>رقم الجواز: {worker.passport}</span>
                                  <span className="mx-2 text-gray-200">|</span>
                                  <span>الجنسية: {worker.nationality}</span>
                                </div>
                                <div className="text-[10px] text-gray-400 font-medium">
                                  <span>العميل: {worker.clientName}</span>
                                  <span className="mx-1.5">({worker.clientPhone})</span>
                                </div>
                              </div>
                              <div className="flex-shrink-0 mr-3">
                                {isAlreadyAdded ? (
                                  <span className="text-[10px] text-teal-800 font-bold bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-lg">مضافة بالفعل</span>
                                ) : (
                                  <span className="text-[10px] text-white font-black bg-teal-900 px-3 py-1.5 rounded-lg hover:bg-teal-950 transition-colors shadow-sm">إضافة للقائمة +</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Table: Displaying Chosen Workers ONLY */}
                <div className="text-right mb-2">
                  <span className="text-[11px] font-black text-teal-950 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100/50">
                    العاملات المختارة حالياً للرحلة ({selectedWorkers.length})
                  </span>
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded-xl bg-white max-h-[350px] overflow-y-auto mt-3">
                  <table className="w-full border-collapse text-right text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold sticky top-0 z-10">
                        <th className="py-3 px-4 text-center border-l border-gray-200">رقم الطلب</th>
                        <th className="py-3 px-4">العاملة والجنسية</th>
                        <th className="py-3 px-4">رقم الجواز</th>
                        <th className="py-3 px-4">العميل والجوال</th>
                        <th className="py-3 px-4">الرحلة الحالية</th>
                        <th className="py-3 px-4 w-16 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {selectedWorkers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-400 font-semibold">
                            لا توجد عاملات مضافة حالياً. ابحث عن العاملات في شريط البحث بالأعلى ثم اضغط "إضافة للقائمة" للبدء.
                          </td>
                        </tr>
                      ) : (
                        selectedWorkers.map((worker, index) => (
                          <tr key={worker.orderId} className="hover:bg-teal-50/10 transition-colors">
                            <td className="py-3 px-4 text-center border-l border-gray-100">
                              <div className="flex flex-col items-center justify-center gap-1.5">
                                <a
                                  href={`/admin/track_order/${worker.orderId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => {
                                    setClickedOrders((prev) => ({ ...prev, [worker.orderId]: true }));
                                  }}
                                  className="font-mono font-black text-teal-900 hover:text-teal-700 underline transition-colors"
                                  title="انقر لفتح الطلب وتعديل الخط الزمني في تبويب جديد"
                                >
                                  {worker.orderId}
                                </a>
                                {clickedOrders[worker.orderId] && (
                                  successOrders[worker.orderId] ? (
                                    <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[9px] font-extrabold animate-pulse">
                                      <Check className="w-2.5 h-2.5 text-emerald-650" />
                                      <span>تم التحديث!</span>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleRefreshWorker(worker.orderId)}
                                      disabled={refreshingOrders[worker.orderId]}
                                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-extrabold transition-all border ${
                                        refreshingOrders[worker.orderId]
                                          ? 'bg-teal-50 text-teal-800 border-teal-200 cursor-not-allowed'
                                          : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 hover:scale-105 active:scale-95'
                                      }`}
                                      title="تحديث حالة هذا الطلب من السيرفر"
                                    >
                                      <RefreshCw
                                        className="w-2.5 h-2.5"
                                        style={{
                                          animation: refreshingOrders[worker.orderId]
                                            ? 'spin 1s linear infinite'
                                            : 'none',
                                        }}
                                      />
                                      <span>{refreshingOrders[worker.orderId] ? 'جاري التحديث...' : 'تحديث الحالة'}</span>
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-bold text-teal-950">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{worker.workerName}</span>
                                {!worker.isReadyForDestinations && (
                                  <span className="text-[9px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded font-extrabold whitespace-nowrap">
                                    لم تصل لمرحلة الوجهات
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">
                                {worker.nationality}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-gray-500 font-semibold">{worker.passport}</td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-gray-800">{worker.clientName}</div>
                              <div className="text-[10px] text-gray-400 font-mono mt-0.5">{worker.clientPhone}</div>
                            </td>
                            <td className="py-3 px-4">
                              {worker.from && worker.to ? (
                                <div className="text-[10px] font-semibold text-gray-600">
                                  <span>{worker.from} ← {worker.to}</span>
                                  <div className="text-[9px] text-gray-400 font-mono mt-0.5">{worker.arrivalDate}</div>
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-400 italic font-medium">غير محدد</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleSelectWorker(worker, false)}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                                title="إزالة العاملة"
                              >
                                <X className="w-4 h-4 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Left: Destination Form */}
            <div className="space-y-4 border border-gray-100 rounded-2xl p-5 bg-gray-50/20">
              <h3 className="text-base font-extrabold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100">
                <span className="w-5.5 h-5.5 rounded-full bg-teal-50 text-teal-900 flex items-center justify-center text-xs font-black">٢</span>
                <span>بيانات الرحلة المشتركة</span>
              </h3>

              <div className="space-y-1.5 text-right">
                <label className="block text-sm font-extrabold text-gray-500">مدينة المغادرة</label>
                <input
                  type="text"
                  placeholder="مثل: دكا"
                  value={formData.departureCity}
                  onChange={(e) => setFormData({ ...formData, departureCity: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-800 focus:border-teal-700 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="block text-sm font-extrabold text-gray-500">مدينة الوصول</label>
                <input
                  type="text"
                  placeholder="مثل: المدينة المنورة"
                  value={formData.arrivalCity}
                  onChange={(e) => setFormData({ ...formData, arrivalCity: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-800 focus:border-teal-700 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-right">
                <div className="space-y-1.5">
                  <label className="block text-sm font-extrabold text-gray-500">تاريخ المغادرة</label>
                  <div className="relative w-full flex items-center bg-white border border-gray-200 rounded-xl focus-within:border-teal-700 transition-all">
                    <input
                      type="text"
                      placeholder="YYYY-MM-DD"
                      dir="ltr"
                      value={formData.departureDate}
                      onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                      className="w-full bg-transparent border-none outline-none py-2.5 text-sm font-bold text-gray-800 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => departureDateRef.current?.showPicker()}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-teal-950 transition-colors"
                    >
                      <Calendar className="w-5 h-5" />
                    </button>
                    <input
                      type="date"
                      ref={departureDateRef}
                      value={formData.departureDate}
                      onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                      className="absolute invisible w-0 h-0"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-extrabold text-gray-500">وقت المغادرة</label>
                  <div className="relative w-full flex items-center bg-white border border-gray-200 rounded-xl focus-within:border-teal-700 transition-all">
                    <input
                      type="text"
                      placeholder="HH:MM"
                      dir="ltr"
                      value={formData.departureTime}
                      onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                      className="w-full bg-transparent border-none outline-none py-2.5 text-sm font-bold text-gray-800 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => departureTimeRef.current?.showPicker()}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-teal-950 transition-colors"
                    >
                      <Clock className="w-5 h-5" />
                    </button>
                    <input
                      type="time"
                      ref={departureTimeRef}
                      value={formData.departureTime}
                      onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                      className="absolute invisible w-0 h-0"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-right">
                <div className="space-y-1.5">
                  <label className="block text-sm font-extrabold text-gray-500">تاريخ الوصول</label>
                  <div className="relative w-full flex items-center bg-white border border-gray-200 rounded-xl focus-within:border-teal-700 transition-all">
                    <input
                      type="text"
                      placeholder="YYYY-MM-DD"
                      dir="ltr"
                      value={formData.arrivalDate}
                      onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                      className="w-full bg-transparent border-none outline-none py-2.5 text-sm font-bold text-gray-800 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => arrivalDateRef.current?.showPicker()}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-teal-950 transition-colors"
                    >
                      <Calendar className="w-5 h-5" />
                    </button>
                    <input
                      type="date"
                      ref={arrivalDateRef}
                      value={formData.arrivalDate}
                      onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                      className="absolute invisible w-0 h-0"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-extrabold text-gray-500">وقت الوصول</label>
                  <div className="relative w-full flex items-center bg-white border border-gray-200 rounded-xl focus-within:border-teal-700 transition-all">
                    <input
                      type="text"
                      placeholder="HH:MM"
                      dir="ltr"
                      value={formData.arrivalTime}
                      onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                      className="w-full bg-transparent border-none outline-none py-2.5 text-sm font-bold text-gray-800 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => arrivalTimeRef.current?.showPicker()}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-teal-950 transition-colors"
                    >
                      <Clock className="w-5 h-5" />
                    </button>
                    <input
                      type="time"
                      ref={arrivalTimeRef}
                      value={formData.arrivalTime}
                      onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                      className="absolute invisible w-0 h-0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-right">
                <label className="block text-sm font-extrabold text-gray-500">تحميل ملف التذكرة (PDF)</label>
                <div className="relative border border-dashed border-gray-200 hover:border-teal-700 rounded-xl bg-white p-3 transition-colors flex flex-col items-center justify-center cursor-pointer">
                  <input type="file" accept=".pdf" disabled={extracting} onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  <FileText className={`w-5 h-5 text-gray-400 mb-0.5 ${extracting ? 'animate-bounce text-teal-800' : ''}`} />
                  <span className="text-xs text-gray-700 font-bold truncate max-w-[180px] text-center">
                    {extracting ? 'جاري استخراج البيانات بالذكاء الاصطناعي...' : ticketFile ? ticketFile.name : 'تصفح ملف التذكرة'}
                  </span>
                </div>
              </div>

              {/* Delivery Officer */}
              <div className="space-y-1.5 text-right">
                <label className="block text-sm font-extrabold text-gray-500">مسؤول التوصيل</label>
                <Select
                  classNamePrefix="rs"
                  inputId="delivery-officer"
                  isRtl={true}
                  value={userOptions.find((opt) => opt.value === formData.deliveryOfficer) || null}
                  onChange={(selected: any) => {
                    setFormData({ ...formData, deliveryOfficer: selected ? selected.value : '' });
                  }}
                  options={userOptions}
                  placeholder="اختر مسؤول التوصيل..."
                  isClearable
                  isSearchable={true}
                  menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                  noOptionsMessage={() => 'لا توجد نتائج'}
                  loadingMessage={() => 'جاري البحث...'}
                  isLoading={loadingUsers}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      borderRadius: '0.75rem',
                      borderColor: state.isFocused ? '#0f766e' : '#e5e7eb',
                      backgroundColor: '#fff',
                      padding: '2px',
                      boxShadow: 'none',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937',
                      minHeight: '44px',
                      '&:hover': {
                        borderColor: '#0f766e',
                      }
                    }),
                    menu: (base) => ({
                      ...base,
                      borderRadius: '0.75rem',
                      overflow: 'hidden',
                      zIndex: 9999,
                    }),
                    menuPortal: (base) => ({
                      ...base,
                      zIndex: 9999,
                    })
                  }}
                  menuShouldScrollIntoView={false}
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={updating}
                  className="w-full bg-teal-900 text-white py-2.5 rounded-xl hover:bg-teal-950 font-bold text-xs shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span>{updating ? 'جاري التحديث...' : 'حفظ وتحديث الوصول الجماعي'}</span>
                </button>

                {updating && progressMsg && (
                  <div className="mt-2 text-center text-[10px] text-teal-800 font-bold bg-teal-50 border border-teal-100 p-2 rounded-lg animate-pulse">
                    {progressMsg}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

const StatsOverview = ({ stats }: { stats: { total: number; arrived: number; pending: number } }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 text-right">
      
      {/* إجمالي الرحلات */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
        <div>
          <p className="text-xs font-bold text-gray-400 mb-1 tracking-wide">إجمالي الرحلات في النطاق الحالي</p>
          <h3 className="text-3xl font-extrabold text-teal-950 font-mono leading-none">{stats.total}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-800 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
        </div>
      </div>
      
      {/* وصلت */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
        <div>
          <p className="text-xs font-bold text-gray-400 mb-1 tracking-wide">العاملات اللواتي وصلن</p>
          <h3 className="text-3xl font-extrabold text-emerald-700 font-mono leading-none">{stats.arrived}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
      </div>

      {/* لم تصل */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
        <div>
          <p className="text-xs font-bold text-gray-400 mb-1 tracking-wide">الرحلات القادمة (لم تصل بعد)</p>
          <h3 className="text-3xl font-extrabold text-amber-600 font-mono leading-none">{stats.pending}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
      </div>
      
    </div>
  );
};

export default function Home({ hasPermission, canAdd, canEdit }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkArrivalModalOpen, setIsBulkArrivalModalOpen] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(!hasPermission);
  const [data, setData] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, arrived: 0, pending: 0 });
  const [filters, setFilters] = useState({
    search: '',
    age: '',
    ArrivalCity: '',
    startDate: '',
    endDate: '',
    fromCity: '',
    toCity: '',
    nationality: '',
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'orderId',
    'workerName',
    'clientName',
    'nationality',
    'passport',
    'from',
    'to',
    'status',
  ]);
  useEffect(() => {
    const arrivals = async () => {
      try {
        const response = await fetch('/api/Export/arrivals');
        if (!response.ok) throw new Error('فشل جلب بيانات التصدير');
        const jsonify = await response.json();
        const transformedData = transformData(jsonify.data);
        setExportedData(transformedData);
      } catch (error) {
        console.error('Error fetching arrivals:', error);
        setExportedData([]);
      }
    };
    arrivals();
  }, []);

  const [exportedData, setExportedData] = useState<TableRow[]>([]);
  const isFetchingRef = useRef(false);
  const router = useRouter();































  useEffect(() => {
    if (hasPermission) {
      fetchData(currentPage, filters, setData, setTotalPages, setLoading, isFetchingRef, setStats);
    }
  }, [currentPage, filters, hasPermission]);

  const closePermissionModal = () => {
    setShowPermissionModal(false);
    router.push('/admin/home');
  };

  const [userName, setUserName] = useState('');
useEffect(() => {
  const token = localStorage.getItem('token');
  const decoded = jwtDecode(token);
  const userName = decoded.username;
  setUserName(userName);
}, []);


const fetchFilteredDataExporting = async () => {
  const query = new URLSearchParams({
    perPage: '1000',
    ...(filters.search && { search: filters.search }),
    ...(filters.age && { age: filters.age }),
    ...(filters.ArrivalCity && { ArrivalCity: filters.ArrivalCity }),
    ...(filters.startDate && { startDate: filters.startDate }),
    ...(filters.endDate && { endDate: filters.endDate }),
    ...(filters.fromCity && { fromCity: filters.fromCity }),
    ...(filters.toCity && { toCity: filters.toCity }),
    ...(filters.nationality && { nationality: filters.nationality }),
  }).toString();

  const res = await fetch(`/api/arrivals?${query}`);
  if (!res.ok) throw new Error('فشل جلب البيانات');
  const data = await res.json();
  const transformData = (data: any[]): TableRow[] => {
    const currentDate = new Date(); // التاريخ الحالي
    return data.map((item) => ({
      workerId: String(item.Order?.HomeMaid?.id || 'غير محدد'),
      orderId: String(item.OrderId || 'غير محدد'),
      workerName: item.HomemaidName || item.Order?.HomeMaid?.Name || 'غير محدد',
      clientName: item.Order?.client?.fullname || 'غير متوفر',
      clientPhone: item.Order?.clientphonenumber || item.SponsorPhoneNumber || '',
      clientId: String(item.Order?.client?.id || ''),
      nationality: item.Order?.HomeMaid?.office?.Country || 'غير محدد',
      passport: item.Order?.HomeMaid?.Passportnumber || 'غير محدد',
      from: item.deparatureCityCountry || 'غير محدد',
      to: item.arrivalSaudiAirport || 'غير محدد',
      status: item.KingdomentryDate && new Date(item.KingdomentryDate) <= currentDate ? 'وصلت' : 'لم تصل',
      arrivalDate: item.KingdomentryDate
        ? item.KingdomentryDate.split('T')[0]
        : 'غير محدد',
      departureDate: item.deparatureCityCountryDate
        ? item.deparatureCityCountryDate.split('T')[0]
        : 'غير محدد',
      departureTime: item.deparatureCityCountryTime || '',
      arrivalTime: item.KingdomentryTime || '',
    }));
  };
    const transformed = transformData(data.data); 

  setExportedData(transformed);
  return transformed;

};

const exportToPDF = async() => {
  let dataToExport = exportedData;
  if (filters.search || filters.age || filters.ArrivalCity || filters.startDate || filters.endDate) {
    // console.log('fetching filtered data');
    dataToExport = await fetchFilteredDataExporting();
  }


  const doc = new jsPDF({ orientation: 'landscape' });
      const pageWidth = doc.internal.pageSize.width;

const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
    const logoBuffer = await logo.arrayBuffer();
    const logoBytes = new Uint8Array(logoBuffer);
    const logoBase64 = Buffer.from(logoBytes).toString('base64');
    doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25); // تغيير مكان الشعار ليصبح في اليسار
  // 🗺️ خريطة الأعمدة بالعربي
  const columnMap = {
    workerId: 'رقم العاملة',
    orderId: 'رقم الطلب',
    workerName: 'اسم العاملة',
    clientName: 'اسم العميل',
    nationality: 'الجنسية',
    passport: 'رقم الجواز',
    from: 'من',
    to: 'إلى',
    status: 'حالة الوصول',
    arrivalDate: 'تاريخ الوصول',
  };

  // 🔤 الخط العربي
  doc.addFont('/fonts/Amiri-Regular.ttf', 'Amiri', 'normal');
  doc.setFont('Amiri');
  doc.setFontSize(16);

  // 🏷️ العنوان
  doc.text('قائمة الوصول', 150, 20, { align: 'right' });

  // 📊 الأعمدة والصفوف (معكوسة)
  const tableColumns = [...visibleColumns.map((col) => columnMap[col])].reverse(); // ✅ عكس الأعمدة
  const tableRows = dataToExport.map((row) =>
    [...visibleColumns.map((col) => row[col] || '')].reverse() // ✅ عكس البيانات أيضًا
  );

  // 📋 إنشاء الجدول بخيارات العرض المتقدمة
  (doc as any).autoTable({
    head: [tableColumns],
    body: tableRows,
    styles: {
      font: 'Amiri',
      halign: 'center',
      fontSize: 10,
      overflow: 'hidden', // ✅ النص الطويل يظهر بنقط (...)
      cellWidth: 'auto',
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [26, 77, 79],
      textColor: [255, 255, 255],
      halign: 'center',
      overflow: 'hidden',
    },
    columnStyles: {
      // ✅ نفس الإعدادات على كل الأعمدة
      0: { cellWidth: 'auto', overflow: 'hidden' },
      1: { cellWidth: 'auto', overflow: 'hidden' },
      2: { cellWidth: 'auto', overflow: 'hidden' },
      3: { cellWidth: 'auto', overflow: 'hidden' },
      4: { cellWidth: 'auto', overflow: 'hidden' },
      5: { cellWidth: 'auto', overflow: 'hidden' },
      6: { cellWidth: 'auto', overflow: 'hidden' },
      7: { cellWidth: 'auto', overflow: 'hidden' },
      8: { cellWidth: 'auto', overflow: 'hidden' },
      9: { cellWidth: 'auto', overflow: 'hidden' },
    },
      margin: { top: 40, right: 10, left: 10 },
    // margin: { top: 30, right: 10, left: 10 },
    direction: 'rtl', // ✅ مهم جدًا علشان الجدول يبقى عربي بالكامل
    didParseCell: (data) => {
      data.cell.styles.halign = 'center';
    },
    
   didDrawPage: (data) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  doc.setFontSize(10);
  doc.setFont('Amiri');

  // 👈 الاسم (على اليسار)
  doc.text(userName, 10, pageHeight - 10, { align: 'left' });

  // 👉 التاريخ (على اليمين)
  const dateText = "التاريخ: " + new Date().toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) + "  الساعة: " + new Date().toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(dateText, pageWidth - 10, pageHeight - 10, { align: 'right' });

  // 🔢 رقم الصفحة (في المنتصف)
  const pageNumber = `صفحة ${doc.internal.getNumberOfPages()}`;
  doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });
},

  });
  doc.setFontSize(8);
  // 💾 حفظ الملف
  doc.save('قائمة_الوصول.pdf');
};


const exportToExcel = async () => {
    let dataToExport = exportedData;
    if (filters.search || filters.age || filters.ArrivalCity || filters.startDate || filters.endDate) {
      dataToExport = await fetchFilteredDataExporting();
    }
    const columnMap: { [key: string]: string } = {
      workerId: 'رقم العاملة',
      orderId: 'رقم الطلب',
      workerName: 'اسم العاملة',
      clientName: 'اسم العميل',
      nationality: 'الجنسية',
      passport: 'رقم الجواز',
      from: 'من',
      to: 'إلى',
      status: 'حالة الوصول',
      arrivalDate: 'تاريخ الوصول',
    };

    const filteredData = dataToExport.map((row) =>
      visibleColumns.reduce((obj, col) => {
        obj[columnMap[col]] = row[col as keyof TableRow];
        return obj;
      }, {} as Record<string, string>)
    );

    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Arrivals');
    XLSX.writeFile(workbook, 'arrivals.xlsx');
  };

  return (
    <Layout>
      <div className={`font-tajawal w-full text-gray-800 min-h-screen ${Style['tajawal-regular']}`} dir="rtl">
        <Head>
          <title>قائمة الوصول</title>
          
        </Head>
        <div className="max-w-7xl mx-auto">
          <main className="p-6 md:p-8">
            {hasPermission ? (
              <>
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                  <h1 className="text-3xl font-bold text-gray-900 text-right">قائمة الوصول</h1>
                  {canAdd && (
                    <button
                      onClick={() => setIsBulkArrivalModalOpen(true)}
                      className="flex items-center gap-1.5 bg-teal-900 text-white px-4 py-2.5 rounded-xl hover:bg-teal-950 transition-colors duration-200 text-sm font-semibold shadow-sm"
                    >
                      <span>+ إضافة وصول جماعي</span>
                    </button>
                  )}
                </div>
                <StatsOverview stats={stats} />
                <Controls
                  setFilters={setFilters}
                  visibleColumns={visibleColumns}
                  setVisibleColumns={setVisibleColumns}
                  data={data}
                  exportToExcel={exportToExcel}
                  exportToPDF={exportToPDF}
                />

                {loading ? (
                  <div className="text-center">جاري التحميل...</div>
                ) : data.length === 0 ? (
                  <div className="text-center">لا توجد بيانات متاحة</div>
                ) : (
                  <>
                    <Table 
                      data={data} 
                      visibleColumns={visibleColumns} 
                      filters={filters} 
                      setFilters={setFilters} 
                      setPage={setCurrentPage} 
                    />
                    <Pagination currentPage={currentPage} totalPages={totalPages} setPage={setCurrentPage} />
                  </>
                )}
              </>
            ) : (
              <div>
                <h1 className="text-3xl font-normal text-black mb-6 text-right">الصفحة الرئيسية</h1>
                <p className="text-gray-600 mt-4">مرحبًا بك في لوحة التحكم. يرجى اختيار إجراء من القائمة.</p>
              </div>
            )}
          </main>
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
          <PermissionModal isOpen={showPermissionModal} onClose={closePermissionModal} />
          <BulkArrivalModal
            isOpen={isBulkArrivalModalOpen}
            onClose={() => setIsBulkArrivalModalOpen(false)}
            onRefresh={() => fetchData(currentPage, filters, setData, setTotalPages, setLoading, isFetchingRef, setStats)}
          />
        </div>
      </div>
    </Layout>
  );
}


export async function getServerSideProps({ req }) {
  try {
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    if (!cookies.authToken) {
      return {
        redirect: { destination: "/admin/login", permanent: false },
      };
    }

    const token = jwtDecode(cookies.authToken);
    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });

    const hasPermission = findUser && findUser.role?.permissions?.["إدارة الوصول و المغادرة"]?.["عرض"];

    const permissions = findUser?.role?.permissions as Record<string, any> || {};
    const canAdd = permissions["إدارة الوصول و المغادرة"]?.["إضافة"] === true;
    const canEdit = permissions["إدارة الوصول و المغادرة"]?.["تعديل"] === true;

    return {
      props: {
        hasPermission: !!hasPermission,
        canAdd,
        canEdit,
      },
    };
  } catch (err) {
    console.error("Authorization error:", err);
    return {
      props: {
        hasPermission: false,
      },
    };
  }
}