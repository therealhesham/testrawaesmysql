import { CalendarFilled, FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import { ArrowSmDownIcon, PlusIcon } from "@heroicons/react/outline";
import axios from "axios";
import { ArrowDownLeft, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { FaToggleOn } from "react-icons/fa";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { debounce } from "lodash";
import AlertModal from './AlertModal';

interface DepartureExternalListProps {
  onOpenModal: () => void;
}

export default function DepartureExternalList({ onOpenModal }: DepartureExternalListProps) {
  const [departures, setDepartures] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [nationality, setNationality] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [nationalities, setNationalities] = useState<any[]>(["كل الجنسيات"]);

  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning'>('success');
  const [alertMessage, setAlertMessage] = useState('');


  
  const fetchDepartures = async (pageNumber: number, filters: any = {}) => {
    try {
      const query = new URLSearchParams({
        page: pageNumber.toString(),
        perPage: perPage.toString(),
        ...(filters.searchTerm && { search: filters.searchTerm }),
        ...(filters.nationality && filters.nationality !== "كل الجنسيات" && {
          nationality: filters.nationality,
        }),
        ...(filters.selectedDate && { deparatureDate: filters.selectedDate }),
      }).toString();

      const res = await fetch(`/api/deparaturefromsaudi?${query}`);
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();
      setDepartures(data.data);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching departures:", error);
    }
  };
  const [exportedData, setExportedData] = useState<any[]>([]);
  const fetchExportedData = async () => {
    try {
      const res = await fetch(`/api/Export/deparaturesfromsaudi`);
      if (!res.ok) throw new Error("Failed to fetch exported data");
      const data = await res.json();
      setExportedData(data.data);
    } catch (error) {
      console.error("Error fetching exported data:", error);
    }
  };
  useEffect(() => {
    fetchDepartures(page, { searchTerm, nationality, selectedDate });
  
  }, [page, searchTerm, nationality, selectedDate]);

  useEffect(() => {
    fetchExportedData();
    const fetchOffices = async () => {
      try {
        const response = await axios.get("/api/offices");
        setNationalities(response.data.countriesfinder);
      } catch (error) {
        console.error("Error fetching offices:", error);
      }
    };
    fetchOffices();
  }, []);

  const handleSearch =(e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  }

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
    setNationality("");
    setSelectedDate("");
    setPage(1);
  };

  const exportToPDF = async () => {
    if (!exportedData || exportedData.length === 0) {
      setAlertType('warning');
      setAlertMessage('لا توجد بيانات للتصدير');
      setShowAlert(true);
      return;
    }

    const doc = new jsPDF();
    
    try {
      // تحميل خط Amiri بشكل صحيح
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
      // استخدام الخط الافتراضي في حالة فشل تحميل Amiri
      doc.setFont('helvetica', 'normal');
    }

    doc.setLanguage('ar');
    doc.setFontSize(16);
    doc.text('قائمة المغادرة الخارجية', 200, 10, { align: 'center' });

    const tableColumn = [
      "رقم العاملة",
      "رقم الطلب", 
      "اسم العاملة",
      "اسم العميل",
      "الجنسية",
      "رقم الجواز",
      "سبب المغادرة",
      "جهة الوصول",
      "تاريخ المغادرة",
    ];

    const tableRows = exportedData.map((row) => [
      row.Order?.HomeMaid?.id || "-",
      row.OrderId || "-",
      row.HomemaidName || "-",
      row.SponsorName || "-",
      row.Order?.HomeMaid?.office?.Country || "-",
      row.PassportNumber || "-",
      row.externalReason || "-",
      row.externalArrivalCity || "-",
      row.externaldeparatureDate ? new Date(row.externaldeparatureDate).toLocaleDateString() : "-",
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      styles: { font: 'Amiri', halign: 'right', fontSize: 10 },
      headStyles: { fillColor: [0, 105, 92], textColor: [255, 255, 255] },
      margin: { top: 30 },
      didDrawPage: () => {
        doc.setFontSize(10);
        doc.text(`صفحة ${doc.getCurrentPageInfo().pageNumber}`, 10, doc.internal.pageSize.height - 10);
      },
    });

    doc.save('قائمة_المغادرة_الخارجية.pdf');
  };

  const exportToExcel = () => {
    const worksheetData = exportedData.map((row) => ({
      "رقم العاملة": row.Order?.HomeMaid?.id || "-",
      "رقم الطلب": row.OrderId || "-",
      "اسم العاملة": row.HomemaidName || "-",
      "اسم العميل": row.SponsorName || "-",
      "الجنسية": row.Order?.HomeMaid?.office?.Country || "-",
      "رقم الجواز": row.PassportNumber || "-",
      "من": row.externaldeparatureCity || "-",
      "الى": row.externalArrivalCity || "-",
      "سبب المغادرة": row.externalReason || "-",
      "تاريخ المغادرة": row.externaldeparatureDate
        ? new Date(row.externaldeparatureDate).toLocaleDateString()
        : "-",
      "تاريخ الوصول": row.externalArrivalCityDate
        ? new Date(row.externalArrivalCityDate).toLocaleDateString()
        : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المغادرة");
    XLSX.writeFile(workbook, "قائمة_المغادرة.xlsx");
  };

  return (
    <section id="departure-list" className="mb-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">قائمة المغادرة الخارجية</h1>
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 bg-teal-800 text-white text-md px-4 py-2 rounded-lg shadow hover:bg-teal-700 transition"
        >
          <span>تسجيل مغادرة</span>
          <PlusIcon className="h-4" />
        </button>
      </div>

      <div className="p-6 border border-gray-200 rounded-xl bg-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <form
              className="flex items-center bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 w-60 shadow-sm"
              // onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="text"
                placeholder="ابحث باسم العاملة أو العميل"
                value={searchTerm}
                onChange={handleSearch}
                className="bg-transparent border-none text-gray-600 text-md "
              />
              <Search className="h-5 text-gray-600" />
            </form>

            <div className="relative bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-600 text-md cursor-pointer min-w-[150px] shadow-sm">
              <select
                value={nationality}
                onChange={(e) => handleNationalityChange(e.target.value)}
                className="bg-transparent border-none w-full"
              >
                <option value="كل الجنسيات">كل الجنسيات</option>
                {nationalities?.map((nat) => (
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

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-md text-center text-gray-700">
            <thead className="bg-teal-800 text-white font-medium">
              <tr>
                <th className="py-3 px-2">رقم العاملة</th>
                <th className="py-3 px-2">رقم الطلب</th>
                <th className="py-3 px-2">اسم العاملة</th>
                <th className="py-3 px-2">اسم العميل</th>
                <th className="py-3 px-2">الجنسية</th>
                <th className="py-3 px-2">رقم الجواز</th>
                {/* <th className="py-3 px-2">من</th> */}
                <th className="py-3 px-2">سبب المغادرة</th>
                <th className="py-3 px-2">وجهة المغادرة </th>
                <th className="py-3 px-2">تاريخ المغادرة</th>
                <th className="py-3 px-2">حالة العقد</th>
              </tr>
            </thead>
            <tbody>
              {departures.map((row, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-gray-100" : "bg-gray-100"}
                >
                  <td className="py-3 px-2 border-t border-gray-200">{row.Order?.HomeMaid?.id || "-"}</td>
                  <td className="py-3 px-2 border-t border-gray-200">{row.OrderId || "-"}</td>
                  <td className="py-3 px-2 border-t border-gray-200">{row.HomemaidName || "-"}</td>
                  <td className="py-3 px-2 border-t border-gray-200">{row.SponsorName || "-"}</td>
                  <td className="py-3 px-2 border-t border-gray-200">{row.Order?.HomeMaid?.office?.Country || "-"}</td>
                  <td className="py-3 px-2 border-t border-gray-200">{row.PassportNumber || "-"}</td>
                  {/* <td className="py-3 px-2 border-t border-gray-200">{row.ArrivalCity || "-"}</td> */}
                  <td
                    className="py-3 px-2 border-t border-gray-200"
                    // dangerouslySetInnerHTML={{ __html: row.reason || "-" }}
                  >
                    {row.reason || "-"}
                  </td>
                  <td className="py-3 px-2 border-t border-gray-200">{row.externalArrivalCity || "-"}</td>

                  <td className="py-3 px-2 border-t border-gray-200">
                    {row.externaldeparatureDate ? new Date(row.externaldeparatureDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="py-3 px-2 border-t border-gray-200">
                    {row.Order?.isContractEnded === "منتهي" ? "منتهي" : "مفعل"}
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