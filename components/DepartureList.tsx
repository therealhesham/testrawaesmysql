import { CalendarFilled, FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import { ArrowSmDownIcon, PlusIcon } from "@heroicons/react/outline";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { ArrowDownLeft, Search, Edit2, Trash2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { FaToggleOn } from "react-icons/fa";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import AlertModal from './AlertModal';
import { useRouter } from "next/router";
import FormStep2 from './FormStep2';

import { createPortal } from "react-dom";
import { saudiCities } from "./SaudiCityAutocomplete";

interface DepartureData {
  OrderId?: string;
  HomemaidName?: string;
  SponsorName?: string;
  PassportNumber?: string;
  ArrivalCity?: string;
  finaldestination?: string;
  reason?: string;
  internalReason?:string,
  deparatureDate?: string;
  // الحقول الجديدة للمغادرة الداخلية
  internaldeparatureCity?: string;
  internaldeparatureDate?: string;
  internalArrivalCity?: string;
  internalArrivalCityDate?: string;
  Order?: {
    HomeMaid?: {
      id?: string;
      office?: {
        Country?: string;
      };
    };
  };
}

interface NationalityData {
  id: string;
  Country: string;
}

interface DepartureListProps {
  onOpenModal: () => void;
  refreshTrigger?: number; // Add refresh trigger prop
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}
const arabicRegionMap: { [key: string]: string } = {
    'Riyadh': 'الرياض',
    'Al-Kharj': 'الخرج',
    'Ad Diriyah': 'الدرعية',
    'Al Majma\'ah': 'المجمعة',
    'Al Zulfi': 'الزلفي',
    'Ad Dawadimi': 'الدوادمي',
    'Wadi Ad Dawasir': 'وادي الدواسر',
    'Afif': 'عفيف',
    'Al Quway\'iyah': 'القويعية',
    'Shaqra': 'شقراء',
    'Hotat Bani Tamim': 'حوطة بني تميم',

    'Makkah': 'مكة المكرمة',
    'Jeddah': 'جدة',
    'Taif': 'الطائف',
    'Rabigh': 'رابغ',
    'Al Qunfudhah': 'القنفذة',
    'Al Lith': 'الليث',
    'Khulais': 'خليص',
    'Ranyah': 'رنية',
    'Turabah': 'تربة',

    'Madinah': 'المدينة المنورة',
    'Yanbu': 'ينبع',
    'Al Ula': 'العلا',
    'Badr': 'بدر',
    'Al Hinakiyah': 'الحناكية',
    'Mahd Al Dhahab': 'مهد الذهب',

    'Dammam': 'الدمام',
    'Al Khobar': 'الخبر',
    'Dhahran': 'الظهران',
    'Al Ahsa': 'الأحساء',
    'Al Hufuf': 'الهفوف',
    'Al Mubarraz': 'المبرز',
    'Jubail': 'الجبيل',
    'Hafr Al Batin': 'حفر الباطن',
    'Al Khafji': 'الخفجي',
    'Ras Tanura': 'رأس تنورة',
    'Qatif': 'القطيف',
    'Abqaiq': 'بقيق',
    'Nairiyah': 'النعيرية',
    'Qaryat Al Ulya': 'قرية العليا',

    'Buraydah': 'بريدة',
    'Unaizah': 'عنيزة',
    'Ar Rass': 'الرس',
    'Al Bukayriyah': 'البكيرية',
    'Al Badaye': 'البدائع',
    'Al Mithnab': 'المذنب',
    'Riyad Al Khabra': 'رياض الخبراء',

    'Abha': 'أبها',
    'Khamis Mushait': 'خميس مشيط',
    'Bisha': 'بيشة',
    'Mahayil': 'محايل عسير',
    'Al Namas': 'النماص',
    'Tanomah': 'تنومة',
    'Ahad Rafidah': 'أحد رفيدة',
    'Sarat Abidah': 'سراة عبيدة',
    'Balqarn': 'بلقرن',

    'Tabuk': 'تبوك',
    'Duba': 'ضباء',
    'Al Wajh': 'الوجه',
    'Umluj': 'أملج',
    'Tayma': 'تيماء',
    'Haqi': 'حقل',

    'Hail': 'حائل',
    'Baqa': 'بقعاء',
    'Al Ghazalah': 'الغزالة',

    'Arar': 'عرعر',
    'Rafha': 'رفحاء',
    'Turaif': 'طريف',

    'Jazan': 'جازان',
    'Sabya': 'صبيا',
    'Abu Arish': 'أبو عريش',
    'Samtah': 'صامطة',
    'Baish': 'بيش',
    'Ad Darb': 'الدرب',
    'Al Aridah': 'العارضة',
    'Fifa': 'فيفاء',

    'Najran': 'نجران',
    'Sharurah': 'شرورة',
    'Hubuna': 'حبونا',

    'Al Baha': 'الباحة',
    'Baljurashi': 'بلجرشي',
    'Al Mandq': 'المندق',
    'Al Makhwah': 'المخواة',
    'Qilwah': 'قلوة',

    'Sakaka': 'سكاكا',
    'Dumat Al Jandal': 'دومة الجندل',
    'Al Qurayyat': 'القريات',
    'Tabarjal': 'طبرجل'
  };

const getWarrantyStatus = (entryDateVal: any, departureDateVal: any): { statusText: string; statusType: 'expired' | 'active' | 'unknown' } => {
  if (!entryDateVal) return { statusText: 'غير محدد', statusType: 'unknown' };
  
  const entryDate = new Date(entryDateVal);
  const departureDate = departureDateVal ? new Date(departureDateVal) : new Date();
  
  const diffTime = departureDate.getTime() - entryDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { statusText: `يبدأ الضمان بعد ${Math.abs(diffDays)} يوم`, statusType: 'unknown' };
  } else if (diffDays > 90) {
    const daysPast = diffDays - 90;
    return { statusText: `انتهى منذ ${daysPast} يوم`, statusType: 'expired' };
  } else {
    const daysLeft = 90 - diffDays;
    return { statusText: `متبقي ${daysLeft} يوم`, statusType: 'active' };
  }
};

const getDepartureStatus = (dateVal: any, timeStr: string | null | undefined): string => {
  if (!dateVal) return 'لم تغادر';
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
  if (!dateString) return 'لم تغادر';

  let hour = 0;
  let minute = 0;
  if (timeStr) {
    const cleanStr = timeStr.trim().toUpperCase();
    const isPm = cleanStr.includes('PM') || cleanStr.includes('م');
    const isAm = cleanStr.includes('AM') || cleanStr.includes('ص');
    const match = /(\d{1,2}):(\d{2})/.exec(cleanStr);
    if (match) {
      hour = parseInt(match[1], 10);
      minute = parseInt(match[2], 10);
      if (isPm && hour < 12) hour += 12;
      if (isAm && hour === 12) hour = 0;
    }
  }

  const [year, month, day] = dateString.split('-').map(Number);
  const departureDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  
  if (departureDate < new Date()) {
    return 'غادرت';
  }
  
  const today = new Date();
  const yToday = today.getFullYear();
  const mToday = String(today.getMonth() + 1).padStart(2, '0');
  const dToday = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yToday}-${mToday}-${dToday}`;

  if (dateString === todayStr) {
    return 'ستغادر اليوم';
  } else {
    return 'ستغادر قريبا';
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
    { key: 'to', label: 'إلى' },
    { key: 'from', label: 'من' },
    { key: 'reason', label: 'سبب المغادرة' },
    { key: 'warranty', label: 'حالة الضمان' },
    { key: 'departureStatus', label: 'حالة المغادرة' },
    { key: 'actions', label: 'الاجراءات' },
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
        onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
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

export default function DepartureList({ onOpenModal, refreshTrigger, canAdd = true, canEdit = true, canDelete = true }: DepartureListProps) {
  const [departures, setDepartures] = useState<DepartureData[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [nationality, setNationality] = useState("");
  const [nationalities, setNationalities] = useState<NationalityData[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'orderId',
    'workerName',
    'clientName',
    'nationality',
    'passport',
    'from',
    'to',
    'reason',
    'warranty',
    'departureStatus',
    'actions'
  ]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const [isNatDropdownOpen, setIsNatDropdownOpen] = useState(false);
  const natDropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);
  const [isToDropdownOpen, setIsToDropdownOpen] = useState(false);
  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);
  const [fromCoords, setFromCoords] = useState<{ top: number; left: number } | null>(null);
  const [toCoords, setToCoords] = useState<{ top: number; left: number } | null>(null);
  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");
  const [saudiCities, setSaudiCities] = useState<{label: string, value: string}[]>([]);
  const [worldCities, setWorldCities] = useState<{label: string, value: string}[]>([]);
  const [natTrigger, setNatTrigger] = useState<HTMLButtonElement | null>(null);
  const [fromTrigger, setFromTrigger] = useState<HTMLButtonElement | null>(null);
  const [toTrigger, setToTrigger] = useState<HTMLButtonElement | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);
  const [deleteModalNames, setDeleteModalNames] = useState<{client: string, maid: string} | null>(null);

  const handleDeleteClick = (row: any) => {
    setOrderToDelete(row.OrderId);
    setDeleteModalNames({
      client: row.Order?.client?.fullname || row.SponsorName || 'العميل',
      maid: row.Order?.HomeMaid?.Name || 'العاملة',
    });
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!orderToDelete) return;
    try {
      const res = await fetch("/api/deletedeparature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ OrderId: orderToDelete, type: "internal" }),
      });
      if (res.ok) {
        fetchDepartures(page, { searchTerm, nationality, startDate, endDate, fromCity, toCity });
      } else {
        const errorData = await res.json();
        alert(errorData.error || "حدث خطأ أثناء الحذف");
      }
    } catch (err) {
      console.error("Error deleting departure:", err);
      alert("حدث خطأ في الاتصال بالخادم");
    } finally {
      setIsDeleteModalOpen(false);
      setOrderToDelete(null);
    }
  };

  const openEditModal = async (orderId: string | number | undefined) => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/getdatafordeparatures?id=${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setEditingData(data);
        setIsEditModalOpen(true);
      } else {
        setAlertType('error');
        setAlertMessage('فشل في جلب بيانات الطلب');
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Error fetching data for edit:", error);
      setAlertType('error');
      setAlertMessage('فشل في جلب بيانات الطلب');
      setShowAlert(true);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        natDropdownRef.current && 
        !natDropdownRef.current.contains(event.target as Node) &&
        !target.closest("#nationality-filter-dropdown")
      ) {
        setIsNatDropdownOpen(false);
        setNatTrigger(null);
      }
      if (
        fromDropdownRef.current &&
        !fromDropdownRef.current.contains(event.target as Node) &&
        !target.closest("#from-filter-dropdown")
      ) {
        setIsFromDropdownOpen(false);
        setFromSearch("");
        setFromTrigger(null);
      }
      if (
        toDropdownRef.current &&
        !toDropdownRef.current.contains(event.target as Node) &&
        !target.closest("#to-filter-dropdown")
      ) {
        setIsToDropdownOpen(false);
        setToSearch("");
        setToTrigger(null);
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
      setNatTrigger(null);
    } else {
      const trigger = e.currentTarget;
      const container = document.getElementById("internal-table-container");
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
      setFromTrigger(null);
    } else {
      const trigger = e.currentTarget;
      const container = document.getElementById("internal-table-container");
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
      setToTrigger(null);
    } else {
      const trigger = e.currentTarget;
      const container = document.getElementById("internal-table-container");
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

  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning'>('success');
  const [alertMessage, setAlertMessage] = useState('');

  const fetchDepartures = async (pageNumber: number, filters: any = {}) => {
    try {
      const query = new URLSearchParams({
        page: pageNumber.toString(),
        perPage: perPage.toString(),
        ...(filters.searchTerm && { search: filters.searchTerm }),
        ...(filters.nationality && filters.nationality !== "كل الجنسيات" && filters.nationality !== "الكل" && {
          nationality: filters.nationality,
        }),
        ...(filters.fromCity && { fromCity: filters.fromCity }),
        ...(filters.toCity && { toCity: filters.toCity }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      }).toString();

      const res = await fetch(`/api/deparatures?${query}`);
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();
      setDepartures(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching departures:", error);
      setDepartures([]);
      setTotalPages(1);
    }
  };

  const fetchSearchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const res = await fetch(`/api/deparatures/suggestions?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };
  const [exportedData, setExportedData] = useState<DepartureData[]>([]);
  const fetchExportedData = async () => {
    try {
      const res = await fetch(`/api/Export/deparatures`);
      if (!res.ok) throw new Error("Failed to fetch exported data");
      const data = await res.json();
      setExportedData(data.data || []);
    } catch (error) {
      console.error("Error fetching exported data:", error);
      setExportedData([]);
    }
  };
const [userName, setUserName] = useState('');
useEffect(() => {
  const token = localStorage.getItem('token') || '';
  const decoded = jwtDecode(token);
  const userName = decoded.username || '';
  setUserName(userName || '');
}, []);
  const handleReset = () => {
    setSearchTerm("");
    setNationality("");
    setFromCity("");
    setToCity("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const fetchFilteredDataExporting = async () => {
    const query = new URLSearchParams({
      perPage: "1000",
      ...(searchTerm && { search: searchTerm }),
      ...(nationality && nationality !== "كل الجنسيات" && nationality !== "الكل" && {
        nationality: nationality,
      }),
      ...(fromCity && { fromCity }),
      ...(toCity && { toCity }),
      ...(startDate && { startDate: startDate }),
      ...(endDate && { endDate: endDate }),
    }).toString();

  const res = await fetch(`/api/deparatures?${query}`);
  if (!res.ok) throw new Error("Failed to fetch data");
  const data = await res.json();

  // نحدّث الستيت لو حابب تظل البيانات في الواجهة
  setExportedData(data.data);
  // لكن الأهم: نرجعها علشان نستخدمها فورًا
  return data.data;
};
  
  useEffect(() => {
    fetchDepartures(page, { searchTerm, nationality, fromCity, toCity, startDate, endDate });
  
  }, [page, searchTerm, nationality, fromCity, toCity, startDate, endDate]);

  // Watch for refresh trigger
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchDepartures(page, { searchTerm, nationality, fromCity, toCity, startDate, endDate });
      fetchExportedData();
    }
  }, [refreshTrigger]);

  useEffect(() => {
    fetchExportedData();
    const fetchNationalities = async () => {
      try {
        const response = await axios.get("/api/nationalities");
        setNationalities(response.data.nationalities || []);
      } catch (error) {
        console.error("Error fetching nationalities:", error);
      }
    };
    fetchNationalities();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setPage(1);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for suggestions
    const timeout = setTimeout(() => {
      fetchSearchSuggestions(value);
    }, 300);
    setSearchTimeout(timeout);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    setPage(1);
  };

  const handleSearchBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const exportToPDF = async () => {
  let dataToExport = exportedData;
  if (searchTerm || nationality || fromCity || toCity || startDate || endDate) {
    dataToExport = await fetchFilteredDataExporting();
  }

  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.width;
  try {
    const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
    const logoBuffer = await logo.arrayBuffer();
    const logoBytes = new Uint8Array(logoBuffer);
    const logoBase64 = Buffer.from(logoBytes).toString('base64');
    doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);
    // 🖋️ تحميل خط Amiri
    const response = await fetch('/fonts/Amiri-Regular.ttf');
    if (!response.ok) throw new Error('Failed to fetch font');
    const fontBuffer = await response.arrayBuffer();
    const fontBytes = new Uint8Array(fontBuffer);
    const fontBase64 = Buffer.from(fontBytes).toString('base64');

    doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.setFont('Amiri', 'normal');
  } catch (error) {
    console.error('Error loading Amiri font:', error);
    doc.setFont('helvetica', 'normal'); // fallback
  }

  // 🏷️ العنوان
  doc.setLanguage('ar');
  doc.setFontSize(16);
  
  doc.text('قائمة المغادرة الداخلية', 150, 20, { align: 'right' });

  // 📋 الأعمدة والصفوف
  const tableColumn = [
    "سبب المغادرة",
    "الى",
    "من",
    "رقم الجواز",
    "الجنسية",
    "اسم العميل",
    "اسم العاملة",
    "رقم الطلب",
    "رقم العاملة",
  ];

  const tableRows = dataToExport?.map((row) => [
    row.internalReason || "-",
    row.internalArrivalCity || "-",
    row.internaldeparatureCity || "-",
    row.Order?.HomeMaid?.Passportnumber || "-",
    row.Order?.HomeMaid?.office?.Country || "-",
    row.Order?.client?.fullname || "-",
    row.Order?.HomeMaid?.Name || "-",
    row.OrderId || "-",
    row.Order?.HomeMaid?.id || "-",
  ]);

  // 📄 الجدول مع الفوتر المخصص
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    styles: { font: 'Amiri', halign: 'right', fontSize: 10 },
    headStyles: { fillColor: [26, 77, 79], textColor: [255, 255, 255] },
    margin: { top: 45, right: 10, left: 10 },

    didDrawPage: () => {
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;

      doc.setFontSize(10);
      doc.setFont('Amiri', 'normal');

      // 👈 الاسم (يسار)
      doc.text(userName, 10, pageHeight - 10, { align: 'left' });

      // 🔢 رقم الصفحة (وسط)
      const pageNumber = `صفحة ${doc.getCurrentPageInfo().pageNumber}`;
      doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });

      // 👉 التاريخ (يمين)
      const dateText =
        "التاريخ: " +
        new Date().toLocaleDateString('ar-EG', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) +
        "  الساعة: " +
        new Date().toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        });
      doc.text(dateText, pageWidth - 10, pageHeight - 10, { align: 'right' });
    },
  });

  // 💾 حفظ الملف
  doc.save("قائمة_المغادرة.pdf");
};

  const exportToExcel = async () => {
    let dataToExport = exportedData;
    if (searchTerm || fromCity || toCity || startDate || endDate) {
      dataToExport = await fetchFilteredDataExporting();
    }
    if (!dataToExport || dataToExport.length === 0) {
      setAlertType('warning');
      setAlertMessage('لا توجد بيانات للتصدير');
      setShowAlert(true);
      return;
    }
    
    const worksheetData = dataToExport?.map((row) => ({
      "رقم العاملة": row.Order?.HomeMaid?.id || "-",
      "رقم الطلب": row.OrderId || "-",
      "اسم العاملة": row.Order?.HomeMaid?.Name || "-",
      "اسم العميل": row.Order?.client?.fullname || "-",
      "الجنسية": row.Order?.HomeMaid?.office?.Country || "-",
      "رقم الجواز": row.Order?.HomeMaid?.Passportnumber || "-",
      "من": row.internaldeparatureCity || "-",
      "الى": row.internalArrivalCity || "-",
      "سبب المغادرة": row.internalReason || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المغادرة");
    XLSX.writeFile(workbook, "قائمة_المغادرة.xlsx");
  };
const router = useRouter();

  // Calculate pagination display values
  const startIndex = (page - 1) * perPage + 1;
  const endIndex = (page - 1) * perPage + departures.length;
  const totalItems = page === totalPages 
    ? endIndex 
    : perPage * totalPages;

  return (
    <section id="departure-list" className="mb-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold text-gray-700">جدول المغادرة الداخلية</h2>
        {canAdd && (
          <button
            onClick={onOpenModal}
            className="flex items-center gap-2 bg-teal-800 text-white text-md px-4 py-2 rounded-lg shadow hover:bg-teal-700 transition"
          >
            <span>تسجيل مغادرة</span>
            <PlusIcon className="h-4" />
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-8">
        <div className="flex flex-wrap items-center gap-2.5 justify-start w-full">
          
          {/* حقل البحث المتمدد */}
          <div className="relative flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex-grow flex-1 min-w-[200px] focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-700/10 transition-all shadow-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث باسم الكفيل، الجواز أو الطلب..."
              value={searchTerm}
              onChange={handleSearch}
              onBlur={handleSearchBlur}
              onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
              className="bg-transparent border-none outline-none text-xs text-gray-800 placeholder-gray-400 w-full font-medium"
            />
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 mt-1.5 max-h-60 overflow-y-auto divide-y divide-gray-50">
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-3.5 py-2.5 hover:bg-teal-50/30 cursor-pointer text-right text-xs text-gray-700 font-medium transition-colors"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* اختيار التاريخ من */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2.5 w-full md:w-36 focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-700/10 transition-all shadow-sm">
            <span className="text-xs text-gray-400 font-bold whitespace-nowrap">من:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="bg-transparent border-none outline-none text-xs text-gray-700 w-full cursor-pointer font-medium"
            />
          </div>

          {/* اختيار التاريخ إلى */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2.5 w-full md:w-36 focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-700/10 transition-all shadow-sm">
            <span className="text-xs text-gray-400 font-bold whitespace-nowrap">إلى:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="bg-transparent border-none outline-none text-xs text-gray-700 w-full cursor-pointer font-medium"
            />
          </div>

          {/* زر إعادة الضبط كأيقونة */}
          <button
            className="flex items-center justify-center bg-gray-50 hover:bg-gray-150 active:bg-gray-200 text-gray-600 w-11 h-11 rounded-xl transition-all border border-gray-200 shadow-sm"
            title="إعادة تعيين الفلاتر"
            onClick={handleReset}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          <ColumnSelector visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns} />

          {/* أزرار التصدير */}
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

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto relative min-h-[450px]" id="internal-table-container">
          <table className="w-full border-collapse min-w-[1000px] text-right">
            <thead>
              <tr className="bg-teal-900 text-white text-sm font-medium">
                {visibleColumns.includes('orderId') && <th className="py-4 px-5 text-right font-medium tracking-wide">رقم الطلب</th>}
                {visibleColumns.includes('workerName') && <th className="py-4 px-5 text-right font-medium tracking-wide">اسم العاملة</th>}
                {visibleColumns.includes('clientName') && <th className="py-4 px-5 text-right font-medium tracking-wide">اسم العميل</th>}
                {visibleColumns.includes('nationality') && (
                  <th className="py-4 px-5 text-right font-medium tracking-wide relative" ref={natDropdownRef}>
                    <div className="flex items-center gap-1.5 justify-start">
                      <span>الجنسية</span>
                      <div className="relative inline-flex items-center">
                        <button
                          onClick={handleDropdownToggle}
                          className={`p-1 rounded hover:bg-teal-800 transition-colors flex items-center justify-center ${nationality ? 'text-amber-400 font-bold' : 'text-teal-200 hover:text-white'}`}
                          title="تصفية حسب الجنسية"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18m-2 0v2.286a2 2 0 0 1-.586 1.414l-5.828 5.828a2 2 0 0 0-.586 1.414v4.556a1 1 0 0 1-1.447.894l-2-1a1 1 0 0 1-.553-.894v-3.556a2 2 0 0 0-.586-1.414L3.586 8.2a2 2 0 0 1-.586-1.414V4.5z" />
                          </svg>
                        </button>

                      </div>
                    </div>
                  </th>
                )}
                {visibleColumns.includes('passport') && <th className="py-4 px-5 text-right font-medium tracking-wide">رقم الجواز</th>}
                {visibleColumns.includes('from') && (
                  <th className="py-4 px-5 text-right font-medium tracking-wide relative" ref={fromDropdownRef}>
                    <div className="flex items-center gap-1.5 justify-start">
                      <span>من</span>
                      <div className="relative inline-flex items-center">
                        <button
                          onClick={handleFromDropdownToggle}
                          className={`p-1 rounded hover:bg-teal-800 transition-colors flex items-center justify-center ${fromCity ? 'text-amber-400 font-bold' : 'text-teal-200 hover:text-white'}`}
                          title="تصفية حسب مدينة المغادرة"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18m-2 0v2.286a2 2 0 0 1-.586 1.414l-5.828 5.828a2 2 0 0 0-.586 1.414v4.556a1 1 0 0 1-1.447.894l-2-1a1 1 0 0 1-.553-.894v-3.556a2 2 0 0 0-.586-1.414L3.586 8.2a2 2 0 0 1-.586-1.414V4.5z" />
                          </svg>
                        </button>

                      </div>
                    </div>
                  </th>
                )}
                {visibleColumns.includes('to') && (
                  <th className="py-4 px-5 text-right font-medium tracking-wide relative" ref={toDropdownRef}>
                    <div className="flex items-center gap-1.5 justify-start">
                      <span>إلى</span>
                      <div className="relative inline-flex items-center">
                        <button
                          onClick={handleToDropdownToggle}
                          className={`p-1 rounded hover:bg-teal-800 transition-colors flex items-center justify-center ${toCity ? 'text-amber-400 font-bold' : 'text-teal-200 hover:text-white'}`}
                          title="تصفية حسب وجهة الوصول"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18m-2 0v2.286a2 2 0 0 1-.586 1.414l-5.828 5.828a2 2 0 0 0-.586 1.414v4.556a1 1 0 0 1-1.447.894l-2-1a1 1 0 0 1-.553-.894v-3.556a2 2 0 0 0-.586-1.414L3.586 8.2a2 2 0 0 1-.586-1.414V4.5z" />
                          </svg>
                        </button>

                      </div>
                    </div>
                  </th>
                )}
                {visibleColumns.includes('reason') && <th className="py-4 px-5 text-right font-medium tracking-wide">سبب المغادرة</th>}
                {visibleColumns.includes('warranty') && <th className="py-4 px-5 text-right font-medium tracking-wide">حالة الضمان</th>}
                {visibleColumns.includes('departureStatus') && <th className="py-4 px-5 text-right font-medium tracking-wide">حالة المغادرة</th>}
                {visibleColumns.includes('actions') && <th className="py-4 px-5 text-center font-medium tracking-wide w-24">الاجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {departures?.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-teal-50/20 transition-colors duration-150"
                >
                  {visibleColumns.includes('orderId') && (
                    <td className="py-4 px-5 text-sm font-semibold text-teal-900 cursor-pointer hover:underline" onClick={() => router.push(`/admin/track_order/${row.OrderId}`)}>
                      {row.OrderId || "-"}
                    </td>
                  )}
                  {visibleColumns.includes('workerName') && (
                    <td className="py-4 px-5 text-sm font-semibold text-teal-900 cursor-pointer hover:underline" onClick={() => router.push(`/admin/homemaidinfo?id=${row.Order?.HomeMaid?.id}`)}>
                      {row.Order?.HomeMaid?.Name || "-"}
                    </td>
                  )}

                  {visibleColumns.includes('clientName') && (
                    <td className="py-4 px-5 text-right vertical-align-top">
                      <span 
                        className="text-sm font-semibold text-teal-900 cursor-pointer hover:underline block" 
                        onClick={() => router.push(`/admin/clientdetails?id=${row.Order?.client?.id || ''}`)}
                      >
                        {row.Order?.client?.fullname || row.SponsorName || "-"}
                      </span>
                      {(row.Order?.client?.phonenumber || row.SponsorPhoneNumber) && (
                        <span className="text-[11px] font-mono text-gray-500 block mt-1">
                          {row.Order?.client?.phonenumber || row.SponsorPhoneNumber}
                        </span>
                      )}
                    </td>
                  )}
                  {visibleColumns.includes('nationality') && (
                    <td className="py-4 px-5 text-sm text-gray-600">{row.Order?.HomeMaid?.office?.Country || row.Order?.HomeMaid?.Nationalitycopy || "-"}</td>
                  )}
                  {visibleColumns.includes('passport') && (
                    <td className="py-4 px-5 text-sm font-mono text-gray-600">{row.Order?.HomeMaid?.Passportnumber || row.PassportNumber || "-"}</td>
                  )}
                  
                  {/* من */}
                  {visibleColumns.includes('from') && (
                    <td className="py-4 px-5 text-right vertical-align-top min-w-[150px]">
                      <div className="text-sm font-bold text-teal-950 whitespace-nowrap">
                        {arabicRegionMap[row.internaldeparatureCity] || row.internaldeparatureCity || "-"}
                      </div>
                      {row.internaldeparatureDate && (
                        <div className="text-sm font-semibold text-gray-500 font-mono mt-1 whitespace-nowrap">
                          {new Date(row.internaldeparatureDate).toISOString().split('T')[0]}
                        </div>
                      )}
                      {row.internaldeparatureTime && (
                        <div className="text-sm text-gray-400 font-medium font-mono mt-0.5 whitespace-nowrap">
                          {row.internaldeparatureTime}
                        </div>
                      )}
                    </td>
                  )}
                  
                  {/* إلى */}
                  {visibleColumns.includes('to') && (
                    <td className="py-4 px-5 text-right vertical-align-top min-w-[150px]">
                      <div className="text-sm font-bold text-teal-950 whitespace-nowrap">
                        {arabicRegionMap[row.internalArrivalCity] || row.internalArrivalCity || "-"}
                      </div>
                      {row.internalArrivalCityDate && (
                        <div className="text-sm font-semibold text-gray-500 font-mono mt-1 whitespace-nowrap">
                          {new Date(row.internalArrivalCityDate).toISOString().split('T')[0]}
                        </div>
                      )}
                      {row.internalArrivalCityTime && (
                        <div className="text-sm text-gray-400 font-medium font-mono mt-0.5 whitespace-nowrap">
                          {row.internalArrivalCityTime}
                        </div>
                      )}
                    </td>
                  )}
                  
                  {visibleColumns.includes('reason') && <td className="py-4 px-5 text-sm text-gray-600">{row.internalReason || "-"}</td>}

                  {visibleColumns.includes('warranty') && (
                    <td className="py-4 px-5 text-sm font-semibold">
                      {(() => {
                        const wStatus = getWarrantyStatus(row.KingdomentryDate, row.internaldeparatureDate);
                        if (wStatus.statusType === 'expired') {
                          return (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                              borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
                              backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca',
                              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', whiteSpace: 'nowrap'
                            }}>
                              <span className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }}></span>
                              {wStatus.statusText}
                            </span>
                          );
                        } else if (wStatus.statusType === 'active') {
                          return (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                              borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
                              backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0',
                              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', whiteSpace: 'nowrap'
                            }}>
                              <span className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                              {wStatus.statusText}
                            </span>
                          );
                        } else {
                          return (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                              borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
                              backgroundColor: '#f9fafb', color: '#4b5563', border: '1px solid #e5e7eb',
                              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', whiteSpace: 'nowrap'
                            }}>
                              <span className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#9ca3af', display: 'inline-block' }}></span>
                              {wStatus.statusText}
                            </span>
                          );
                        }
                      })()}
                    </td>
                  )}

                  {visibleColumns.includes('departureStatus') && (
                    <td className="py-4 px-5 text-sm font-semibold">
                      {(() => {
                        const status = getDepartureStatus(row.internaldeparatureDate, row.internaldeparatureTime);
                        if (status === 'غادرت') {
                          return (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                              borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
                              backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db',
                              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', whiteSpace: 'nowrap'
                            }}>
                              <span className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#6b7280', display: 'inline-block' }}></span>
                              {status}
                            </span>
                          );
                        } else if (status === 'ستغادر اليوم') {
                          return (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                              borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
                              backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a',
                              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', whiteSpace: 'nowrap'
                            }}>
                              <span className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }}></span>
                              {status}
                            </span>
                          );
                        } else {
                          return (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                              borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
                              backgroundColor: '#f0fdfa', color: '#0f766e', border: '1px solid #ccfbf1',
                              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', whiteSpace: 'nowrap'
                            }}>
                              <span className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#14b8a6', display: 'inline-block' }}></span>
                              {status}
                            </span>
                          );
                        }
                      })()}
                    </td>
                  )}
                  {visibleColumns.includes('actions') && (
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canEdit && (
                          <button
                            onClick={() => openEditModal(row.OrderId)}
                            className="text-slate-600 hover:text-teal-600 p-1.5 rounded transition-colors inline-flex items-center justify-center"
                            title="تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteClick(row)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded transition-colors inline-flex items-center justify-center"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
                  onClick={() => { setNationality(""); setIsNatDropdownOpen(false); setPage(1); }}
                  className={`w-full text-right px-4 py-2 hover:bg-teal-50/50 text-sm font-medium transition-colors duration-150 flex items-center justify-between ${!nationality ? 'text-teal-900 font-bold bg-teal-50/30' : 'text-gray-600'}`}
                >
                  <span>كل الجنسيات</span>
                  {!nationality && <span className="w-1.5 h-1.5 rounded-full bg-teal-700"></span>}
                </button>
                {nationalities?.map((nat) => (
                  <button
                    key={nat.id}
                    onClick={() => { setNationality(nat.Country); setIsNatDropdownOpen(false); setPage(1); }}
                    className={`w-full text-right px-4 py-2 hover:bg-teal-50/50 text-sm font-medium transition-colors duration-150 flex items-center justify-between ${nationality === nat.Country ? 'text-teal-900 font-bold bg-teal-50/30' : 'text-gray-600'}`}
                  >
                    <span>{nat.Country}</span>
                    {nationality === nat.Country && <span className="w-1.5 h-1.5 rounded-full bg-teal-700"></span>}
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
                  onClick={() => { setFromCity(""); setFromSearch(""); setIsFromDropdownOpen(false); setPage(1); }}
                  className={`w-full text-right px-4 py-2 hover:bg-teal-50/50 text-sm font-medium transition-colors duration-150 flex items-center justify-between ${!fromCity ? 'text-teal-900 font-bold bg-teal-50/30' : 'text-gray-600'}`}
                >
                  <span>كل المدن</span>
                  {!fromCity && <span className="w-1.5 h-1.5 rounded-full bg-teal-700"></span>}
                </button>
                {saudiCities
                  ?.filter(city => city.value.includes(fromSearch) || city.label.toLowerCase().includes(fromSearch.toLowerCase()))
                  ?.map((city, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setFromCity(city.value); setFromSearch(""); setIsFromDropdownOpen(false); setPage(1); }}
                      className={`w-full text-right px-4 py-2 hover:bg-teal-50/50 text-sm font-medium transition-colors duration-150 flex items-center justify-between ${fromCity === city.value ? 'text-teal-900 font-bold bg-teal-50/30' : 'text-gray-600'}`}
                    >
                      <span>{city.value}</span>
                      {fromCity === city.value && <span className="w-1.5 h-1.5 rounded-full bg-teal-700"></span>}
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
                  onClick={() => { setToCity(""); setToSearch(""); setIsToDropdownOpen(false); setPage(1); }}
                  className={`w-full text-right px-4 py-2 hover:bg-teal-50/50 text-sm font-medium transition-colors duration-150 flex items-center justify-between ${!toCity ? 'text-teal-900 font-bold bg-teal-50/30' : 'text-gray-600'}`}
                >
                  <span>كل المدن</span>
                  {!toCity && <span className="w-1.5 h-1.5 rounded-full bg-teal-700"></span>}
                </button>
                {saudiCities
                  ?.filter(city => city.value.includes(toSearch) || city.label.toLowerCase().includes(toSearch.toLowerCase()))
                  ?.map((city, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setToCity(city.value); setToSearch(""); setIsToDropdownOpen(false); setPage(1); }}
                      className={`w-full text-right px-4 py-2 hover:bg-teal-50/50 text-sm font-medium transition-colors duration-150 flex items-center justify-between ${toCity === city.value ? 'text-teal-900 font-bold bg-teal-50/30' : 'text-gray-600'}`}
                    >
                      <span>{city.value}</span>
                      {toCity === city.value && <span className="w-1.5 h-1.5 rounded-full bg-teal-700"></span>}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-4">
          <p className="text-md text-gray-600">
            عرض {startIndex} - {endIndex} من {totalItems} نتيجة
          </p>

          <nav className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 border border-gray-300 bg-gray-50 text-gray-700 text-md rounded-lg disabled:opacity-50 hover:bg-gray-100"
            >
              السابق
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1.5 rounded-lg text-md transition ${
                  page === i + 1
                    ? "bg-teal-800 text-white border border-teal-800"
                    : "bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-gray-300 bg-gray-50 text-gray-700 text-md rounded-lg disabled:opacity-50 hover:bg-gray-100"
            >
              التالي
            </button>
          </nav>
        </div>
      </div>
      
      {isEditModalOpen && editingData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" dir="rtl">
          <div className="relative bg-gray-100 p-9 border border-gray-300 rounded max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 left-4 text-gray-800 text-2xl font-bold hover:text-red-600 transition-colors z-10"
            >
              &times;
            </button>
            <FormStep2 
              onPrevious={() => setIsEditModalOpen(false)} 
              onClose={() => setIsEditModalOpen(false)} 
              data={editingData} 
              onSuccess={() => {
                setIsEditModalOpen(false);
                fetchDepartures(page, { searchTerm, nationality, fromCity, toCity, startDate, endDate });
              }} 
            />
          </div>
        </div>
      )}

      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        type={alertType}
        title={alertType === 'warning' ? 'تحذير' : alertType === 'error' ? 'خطأ' : 'نجح'}
        message={alertMessage}
        autoClose={true}
        autoCloseDelay={3000}
      />

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full" dir="rtl">
            <h2 className="text-xl font-semibold text-text-dark mb-4">تأكيد الحذف</h2>
            <p className="text-text-muted mb-6">
              هل أنت متأكد من مسح بيانات المغادرة الداخلية لـ <strong>{deleteModalNames?.maid}</strong> الخاصة بعميلكم <strong>{deleteModalNames?.client}</strong>؟
              <br />
              لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setOrderToDelete(null);
                  setDeleteModalNames(null);
                }}
                className="bg-gray-200 text-text-dark px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={executeDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}