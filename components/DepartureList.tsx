import { CalendarFilled, FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import { ArrowSmDownIcon, PlusIcon } from "@heroicons/react/outline";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { ArrowDownLeft, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { FaToggleOn } from "react-icons/fa";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import AlertModal from './AlertModal';
import { useRouter } from "next/router";

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
    'Tabarjal': 'طبرجل'
  };
export default function DepartureList({ onOpenModal, refreshTrigger }: DepartureListProps) {
  const [departures, setDepartures] = useState<DepartureData[]>([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [nationality, setNationality] = useState("الكل");
  const [selectedDate, setSelectedDate] = useState("");
  const [nationalities, setNationalities] = useState<NationalityData[]>([{ id: "all", Country: "كل الجنسيات" }]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning'>('success');
  const [alertMessage, setAlertMessage] = useState('');

  const fetchDepartures = async (pageNumber: number, filters: any = {}) => {
    try {
      const query = new URLSearchParams({
        page: pageNumber.toString(),
        perPage: perPage.toString(),
        ...(filters.searchTerm && { search: filters.searchTerm }),
        ...(filters.nationality && filters.nationality !== "الكل" && filters.nationality !== "كل الجنسيات" && {
          nationality: filters.nationality,
        }),
        ...(filters.selectedDate && { deparatureDate: new Date(filters.selectedDate).toISOString() }),
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
  useEffect(() => {
    fetchDepartures(page, { searchTerm, nationality, selectedDate });
  
  }, [page, searchTerm, nationality, selectedDate]);

  // Watch for refresh trigger
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchDepartures(page, { searchTerm, nationality, selectedDate });
      fetchExportedData();
    }
  }, [refreshTrigger]);

  useEffect(() => {
    fetchExportedData();
    const fetchOffices = async () => {
      try {
        const response = await axios.get("/api/nationalities");
        const fetchedNationalities = response.data.nationalities || [];
        setNationalities([{ id: "all", Country: "الكل" }, ...fetchedNationalities]);
      } catch (error) {
        console.error("Error fetching nationalities:", error);
        setNationalities([{ id: "all", Country: "الكل" }]);
      }
    };
    fetchOffices();
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

  const handleNationalityChange = (value: string) => {
    setNationality(value);
    setPage(1);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setPage(1);
  };

  const handleReset = () => {
    setSearchTerm("");
    setNationality("الكل");
    setSelectedDate("");
    setPage(1);
  };

const fetchFilteredDataExporting = async () => {
  const query = new URLSearchParams({
    perPage: "1000",
    ...(searchTerm && { search: searchTerm }),
    ...(nationality && nationality !== "الكل" && nationality !== "كل الجنسيات" && {
      nationality: nationality,
    }),
    ...(selectedDate && { deparatureDate: selectedDate }),
  }).toString();

  const res = await fetch(`/api/deparatures?${query}`);
  if (!res.ok) throw new Error("Failed to fetch data");
  const data = await res.json();

  // نحدّث الستيت لو حابب تظل البيانات في الواجهة
  setExportedData(data.data);
  // لكن الأهم: نرجعها علشان نستخدمها فورًا
  return data.data;
};
  
const exportToPDF = async () => {
  let dataToExport = exportedData;
  if (searchTerm || nationality || selectedDate) {
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
    "تاريخ الوصول",
    "تاريخ المغادرة",
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
    row.internalArrivalCityDate
      ? new Date(row.internalArrivalCityDate).toISOString().split('T')[0]//yyyy-mm-dd
      : "-",
    row.internaldeparatureDate
      ? new Date(row.internaldeparatureDate).toISOString().split('T')[0]//yyyy-mm-dd
      : "-",
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
    if (searchTerm || nationality || selectedDate) {
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
      "تاريخ المغادرة": row.internaldeparatureDate
        ? new Date(row.internaldeparatureDate).toISOString().split('T')[0]//yyyy-mm-dd
        : "-",
      "تاريخ الوصول": row.internalArrivalCityDate
        ? new Date(row.internalArrivalCityDate).toISOString().split('T')[0]//yyyy-mm-dd
        : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المغادرة");
    XLSX.writeFile(workbook, "قائمة_المغادرة.xlsx");
  };
const router = useRouter();
  return (
    <section id="departure-list" className="mb-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">قائمة المغادرة الداخلية</h1>
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 bg-teal-800 text-white text-md px-4 py-2 rounded-lg shadow hover:bg-teal-700 transition"
        >
          <span>تسجيل مغادرة</span>
          <PlusIcon className="h-4" />
        </button>
      </div>

      <div className="p-6 border border-gray-200 rounded-xl bg-gray-50 shadow-sm space-y-6 w-full">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <form
                className="flex items-center bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 w-60 shadow-sm"
                // onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="text"
                  placeholder="ابحث باسم العاملة أو العميل"
                  value={searchTerm}
                  onChange={handleSearch}
                  onBlur={handleSearchBlur}
                  onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                  className="bg-transparent border-none text-gray-600 text-md w-full"
                />
                <Search className="h-5 text-gray-600" />
              </form>
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 mt-1 max-h-60 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-right text-gray-700"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-600 text-md cursor-pointer min-w-[150px] shadow-sm">
              <select
                value={nationality}
                onChange={(e) => handleNationalityChange(e.target.value)}
                className="bg-transparent border-none w-full"
              >
                <option value="الكل">الكل</option>
                {nationalities?.filter(nat => nat.Country !== "الكل").map((nat) => (
                  <option key={nat.id} value={nat.Country}>
                    {nat.Country}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-600 text-md cursor-pointer min-w-[150px] shadow-sm">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-transparent border-none"
              />
            </div>

            <button
              onClick={handleReset}
              className="bg-teal-800 text-white text-md px-4 py-2 rounded-lg shadow hover:bg-teal-700 transition"
            >
              إعادة ضبط
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-teal-800 text-white text-md px-3 py-2 rounded-lg shadow hover:bg-teal-700 transition"
            >
              <FilePdfOutlined className="h-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-teal-800 text-white text-md px-3 py-2 rounded-lg shadow hover:bg-teal-700 transition"
            >
              <FileExcelOutlined className="h-4" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden w-full">
          <table className="w-full text-md text-center text-gray-700">
            <thead className="bg-teal-800 text-white font-medium">
              <tr>
                <th className="py-3 px-2">رقم العاملة</th>
                <th className="py-3 px-2">رقم الطلب</th>
                <th className="py-3 px-2">اسم العاملة</th>
                <th className="py-3 px-2">اسم العميل</th>
                <th className="py-3 px-2">الجنسية</th>
                <th className="py-3 px-2">رقم الجواز</th>
                <th className="py-3 px-2">من</th>
                <th className="py-3 px-2">الى</th>
                <th className="py-3 px-2">سبب المغادرة</th>
                <th className="py-3 px-2">تاريخ المغادرة</th>
                <th className="py-3 px-2">تاريخ الوصول</th>
              </tr>
            </thead>
            <tbody>
              {departures?.map((row, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-gray-50" : "bg-gray-50"}
                >

           
                  <td className="py-3 px-2 border-t cursor-pointer border-gray-200" onClick={() => router.push(`/admin/homemaidinfo?id=${row.Order?.HomeMaid?.id}`)}>{row.Order?.HomeMaid?.id || "-"}</td>
                  <td className="py-3 px-2 border-t border-gray-200 cursor-pointer" onClick={() => router.push(`/admin/track_order/${row.OrderId}`)}>{row.OrderId || "-"}</td>
                  <td className="py-3 px-2 border-t border-gray-200">{row.Order?.HomeMaid?.Name|| "-"}</td>
                  <td className="py-3 px-2 border-t border-gray-200">{row.Order?.client?.fullname || "-"}</td>
                  <td className="py-3 px-2 border-t border-gray-200">{row.Order?.HomeMaid?.office?.Country || "-"}</td>
                  <td className="py-3 px-2 border-t border-gray-200">{row.Order?.HomeMaid?.Passportnumber || "-"}</td>
                  <td className="py-3 px-2 border-t border-gray-200"> {arabicRegionMap[row.internaldeparatureCity] || "-"}</td>
                  <td className="py-3 px-2 border-t border-gray-200">{arabicRegionMap[row.internalArrivalCity] || "-"}</td>
                  <td
                    className="py-3 px-2 border-t border-gray-200"
                    // dangerouslySetInnerHTML={{ __html: row.reason || "-" }}
                  >
                    {row.internalReason || "-"}
                  </td>
                  <td className="py-3 px-2 border-t border-gray-200">
                    {row.internaldeparatureDate ? new Date(row.internaldeparatureDate).toISOString().split('T')[0] : "-"}
                  </td>
                  <td className="py-3 px-2 border-t border-gray-200">
                    {row.internalArrivalCityDate ? new Date(row.internalArrivalCityDate).toISOString().split('T')[0]: "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-4">
          <p className="text-md text-gray-600">
            عرض {(page - 1) * perPage + 1} -{" "}
            {Math.min(page * perPage, departures.length + (page - 1) * perPage)} من{" "}
            {perPage * totalPages} نتيجة
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
      
      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        type={alertType}
        title={alertType === 'warning' ? 'تحذير' : alertType === 'error' ? 'خطأ' : 'نجح'}
        message={alertMessage}
        autoClose={true}
        autoCloseDelay={3000}
      />
    </section>
  );
}