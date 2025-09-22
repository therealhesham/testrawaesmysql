import { CalendarFilled, FileExcelOutlined, FilePdfOutlined } from "@ant-design/icons";
import { ArrowSmDownIcon, PlusIcon } from "@heroicons/react/outline";
import axios from "axios";
import { ArrowDownLeft, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { FaToggleOn } from "react-icons/fa";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

interface DepartureData {
  OrderId?: string;
  HomemaidName?: string;
  SponsorName?: string;
  PassportNumber?: string;
  ArrivalCity?: string;
  finaldestination?: string;
  reason?: string;
  deparatureDate?: string;
  arrivalDate?: string;
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
}

export default function DepartureList({ onOpenModal }: DepartureListProps) {
  const [departures, setDepartures] = useState<DepartureData[]>([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [nationality, setNationality] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [nationalities, setNationalities] = useState<NationalityData[]>([{ id: "all", Country: "كل الجنسيات" }]);

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
  useEffect(() => {
    fetchDepartures(page, { searchTerm, nationality, selectedDate });
  
  }, [page, searchTerm, nationality, selectedDate]);

  useEffect(() => {
    fetchExportedData();
    const fetchOffices = async () => {
      try {
        const response = await axios.get("/api/offices");
        setNationalities(response.data.countriesfinder || [{ id: "all", Country: "كل الجنسيات" }]);
      } catch (error) {
        console.error("Error fetching offices:", error);
        setNationalities([{ id: "all", Country: "كل الجنسيات" }]);
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

  const exportToPDF = () => {
    if (!exportedData || exportedData.length === 0) {
      alert("لا توجد بيانات للتصدير");
      return;
    }
    
    const doc = new jsPDF();
    doc.setFont("Amiri", "normal");
    doc.text("قائمة المغادرة الداخلية", 10, 10, { align: "right" });

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

    const tableRows = exportedData?.map((row) => [
      row.arrivalDate ? new Date(row.arrivalDate).toLocaleDateString() : "-",
      row.deparatureDate ? new Date(row.deparatureDate).toLocaleDateString() : "-",
      row.reason || "-",
      row.finaldestination || "-",
      row.ArrivalCity || "-",
      row.PassportNumber || "-",
      row.Order?.HomeMaid?.office?.Country || "-",
      row.SponsorName || "-",
      row.HomemaidName || "-",
      row.OrderId || "-",
      row.Order?.HomeMaid?.id || "-",
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { font: "Amiri", halign: "right" },
      headStyles: { fillColor: [0, 105, 92] },
    });

    doc.save("قائمة_المغادرة.pdf");
  };

  const exportToExcel = () => {
    if (!exportedData || exportedData.length === 0) {
      alert("لا توجد بيانات للتصدير");
      return;
    }
    
    const worksheetData = exportedData?.map((row) => ({
      "رقم العاملة": row.Order?.HomeMaid?.id || "-",
      "رقم الطلب": row.OrderId || "-",
      "اسم العاملة": row.HomemaidName || "-",
      "اسم العميل": row.SponsorName || "-",
      "الجنسية": row.Order?.HomeMaid?.office?.Country || "-",
      "رقم الجواز": row.PassportNumber || "-",
      "من": row.ArrivalCity || "-",
      "الى": row.finaldestination || "-",
      "سبب المغادرة": row.reason || "-",
      "تاريخ المغادرة": row.deparatureDate
        ? new Date(row.deparatureDate).toLocaleDateString()
        : "-",
      "تاريخ الوصول": row.arrivalDate
        ? new Date(row.arrivalDate).toLocaleDateString()
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
        <h1 className="text-2xl font-semibold text-gray-800">قائمة المغادرة الداخلية</h1>
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 bg-teal-800 text-white text-md px-4 py-2 rounded-lg shadow hover:bg-teal-700 transition"
        >
          <span>تسجيل مغادرة</span>
          <PlusIcon className="h-4" />
        </button>
      </div>

      <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm space-y-6">
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
                className="bg-transparent border-none text-gray-600 text-md w-full"
              />
              <Search className="h-5 text-gray-600" />
            </form>

            <div className="relative bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-600 text-md cursor-pointer min-w-[150px] shadow-sm">
              <select
                value={nationality}
                onChange={(e) => handleNationalityChange(e.target.value)}
                className="bg-transparent border-none w-full"
              >
                {nationalities?.map((nat) => (
                  <option key={nat.id} value={nat.Country}>
                    {nat.Country}
                  </option>
                ))}
              </select>
              <ArrowSmDownIcon className="h-4 absolute right-3 top-1/2 transform -translate-y-1/2" />
            </div>

            <div className="flex items-center justify-between bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-600 text-md cursor-pointer min-w-[150px] shadow-sm">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-transparent border-none"
              />
              <CalendarFilled className="h-4" />
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
              className="flex items-center gap-2 bg-teal-800 text-white text-xs px-3 py-2 rounded-lg shadow hover:bg-teal-700 transition"
            >
              <FilePdfOutlined className="h-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-teal-800 text-white text-xs px-3 py-2 rounded-lg shadow hover:bg-teal-700 transition"
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
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="py-3 px-2 border-t border-gray-200">{row.Order?.HomeMaid?.id || "-"}</td>
                  <td className="py-3 px-2 border-t border-gray-200">{row.OrderId || "-"}</td>
                  <td className="py-3 px-2 border-t border-gray-200">{row.HomemaidName || "-"}</td>
                  <td className="py-3 px-2 border-t border-gray-200">{row.SponsorName || "-"}</td>
                  <td className="py-3 px-2 border-t border-gray-200">{row.Order?.HomeMaid?.office?.Country || "-"}</td>
                  <td className="py-3 px-2 border-t border-gray-200">{row.PassportNumber || "-"}</td>
                  <td className="py-3 px-2 border-t border-gray-200">{row.ArrivalCity || "-"}</td>
                  <td className="py-3 px-2 border-t border-gray-200">{row.finaldestination || "-"}</td>
                  <td
                    className="py-3 px-2 border-t border-gray-200"
                    // dangerouslySetInnerHTML={{ __html: row.reason || "-" }}
                  >
                    {row.reason || "-"}
                  </td>
                  <td className="py-3 px-2 border-t border-gray-200">
                    {row.deparatureDate ? new Date(row.deparatureDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="py-3 px-2 border-t border-gray-200">
                    {row.arrivalDate ? new Date(row.arrivalDate).toLocaleDateString() : "-"}
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
    </section>
  );
}