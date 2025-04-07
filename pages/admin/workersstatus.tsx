import { BookFilled } from "@ant-design/icons";
import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import * as React from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import jwt from "jsonwebtoken";
import { jwtDecode } from "jwt-decode";
import { ChevronLeftIcon } from "@heroicons/react/solid"; // استيراد أيقونة الرجوع

import {
  Button,
  Modal,
  Box,
  TextField,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";
import Style from "styles/Home.module.css";
import { FaHouseUser } from "react-icons/fa";

export default function Table() {
  const [employeeType, setEmployeeType] = useState("");
  const [workers, setWorkers] = useState([]);

  const [details, setdetails] = useState("");

  const [reason, setReason] = useState("");

  const [employee, setEmployee] = useState("");

  const [deliveryDate, setDeliveyDate] = useState("");
  const [houseentrydate, sethouseentrydate] = useState("");
  const [error, setError] = useState("");
  const [errormodaopen, setIserrorModalOpen] = useState(false);
  const [errormessage, seterrormessage] = useState("");

  const [expandedRow, setExpandedRow] = useState(null);
  const [filters, setFilters] = useState({
    Name: "",
    age: "",
    Passportnumber: "",
    id: "",
  });

  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [openAddModal, setOpenAddModal] = useState(false);
  const [newHomeMaid, setNewHomeMaid] = useState({});
  const [newExternalHomemaid, setExternalHomemaid] = useState({
    Nationalitycopy: "",
    Name: "",
    Religion: "",
    Passportnumber: "",
    clientphonenumbe: "",
    houseentrydate: "",
    deliveryDate: "",
    details: "",
    reason: "",
    employee: "",
    ExperienceYears: "",
    maritalstatus: "",
    Experience: "",
    dateofbirth: "",
    age: 0,
    phone: "",
    bookingstatus: "",
    ages: "",
    officeName: "",
    experienceType: "",
    PassportStart: "",
    PassportEnd: "",
    OldPeopleCare: "",
    ArabicLanguageLeveL: "",
    EnglishLanguageLevel: "",
    Salary: "",
    LaundryLeveL: "",
    IroningLevel: "",
    CleaningLeveL: "",
    CookingLeveL: "",
    SewingLeveL: "",
    BabySitterLevel: "",
    Education: "",
  });
  const [searchQuery, setSearchQuery] = useState(""); // حالة لمربع البحث

  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);
  const [ID, setID] = useState("");

  function getDate(date) {
    const currentDate = new Date(date);
    const form = currentDate.toISOString().split("T")[0];
    return form;
  }

  const fetchData = async () => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        Name: filters.Name,
        // age: filters.age,
        // id: filters.id,
        Passportnumber: filters.Passportnumber,
        page: String(pageRef.current),
        sortKey: sortConfig.key || "",
        sortDirection: sortConfig.direction,
      });

      const response = await fetch(`/api/weekly-status?${queryParams}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "get",
      });

      const res = await response.json();
      if (res && res.length > 0) {
        setWorkers((prevData) => [...prevData, ...res]);
        pageRef.current += 1;
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const [status, setStatus] = useState("");
  const [dateStatus, setDateStatus] = useState("");
  const [openStatusModal, setOpenStatusModal] = useState(false);
  const handleBack = () => {
    router.back(); // العودة إلى الصفحة السابقة
  };

  const handleCloseStatusModal = () => {
    setOpenStatusModal(false);
  };
  const updateHousingStatus = async (homeMaidId) => {
    const response = await fetch("/api/confirmhousing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ homeMaidId }),
    });
    const data = await response.json();
    if (response.ok) {
      console.log("Success:", data.message);
    } else {
      console.log("Error:", data.error);
    }
  };

  const handleRowClick = (id) => {
    setExpandedRow((prevRow) => (prevRow === id ? null : id));
  };

  const loadMoreRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading || !hasMore) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            fetchData();
          }
        },
        { threshold: 1.0 }
      );
      if (node) observer.observe(node);
      return () => observer.disconnect();
    },
    [loading, hasMore]
  );

  const handleEmployeeChange = (e) => {
    setEmployeeType(e.target.value);
  };
  const [date, setDate] = useState("");
  useEffect(() => {
    fetchData();
  }, [date]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    column: string
  ) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setData([]);
    pageRef.current = 1;
    setHasMore(true);
    fetchData();
  };

  const handleOpenAddModal = () => {
    setOpenAddModal(true);
  };

  const handleCloseAddModal = () => {
    setOpenAddModal(false);
    setNewHomeMaid({
      officeID: "",
      Nationalitycopy: "",
      Name: "",
      Religion: "",
      Passportnumber: "",
      clientphonenumber: "",
      ExperienceYears: "",
      maritalstatus: "",
      Experience: "",
      dateofbirth: "",
      age: "",
      phone: "",
      bookingstatus: "",
      ages: "",
      officeName: "",
      experienceType: "",
      PassportStart: "",
      PassportEnd: "",
      OldPeopleCare: false,
      ArabicLanguageLeveL: "",
      EnglishLanguageLevel: "",
      Salary: "",
      LaundryLeveL: "",
      IroningLevel: "",
      CleaningLeveL: "",
      CookingLeveL: "",
      SewingLeveL: "",
      BabySitterLevel: "",
      Education: "",
    });
    setEmployeeType(""); // إعادة تعيين نوع العاملة
    setSearchQuery(""); // إعادة تعيين مربع البحث
  };

  const handleNewHomeMaidChange = (e) => {
    const { name, value, type, checked } = e.target;
    setExternalHomemaid((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // const [employee, setEmployee] = useState("");
  const [isPasportVerified, setIsPassportVerified] = useState(false);
  // دالة البحث عن العاملة الداخلية

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <button
          onClick={handleBack}
          className="flex items-center px-4 py-2  bg-gray-500 text-white rounded hover:bg-gray-600 mb-4"
        >
          <ChevronLeftIcon className="w-5 h-5 mr-2" /> {/* أيقونة الرجوع */}
          رجوع
        </button>

        <div className="flex justify-between items-center mb-4">
          <h1
            className={`text-left font-medium text-2xl ${Style["almarai-bold"]}`}
          >
            حالات العاملات
          </h1>
          <div></div>
        </div>

        {/* Filter Section */}
        <div className="flex justify-between mb-4">
          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.Name}
              onChange={(e) => handleFilterChange(e, "Name")}
              placeholder="بحث باسم العاملة"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.Passportnumber}
              onChange={(e) => handleFilterChange(e, "Passportnumber")}
              placeholder="بحث برقم الجواز"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex-1 px-1">
            <button
              className={
                "text-[#EFF7F9] bg-[#3D4C73] text-lg py-2 px-4 rounded-md transition-all duration-300"
              }
              onClick={() => {
                isFetchingRef.current = false;
                setHasMore(true);
                setFilters({ age: "", id: "", Passportnumber: "", Name: "" });
                setWorkers([]);
                pageRef.current = 1;
                fetchData();
              }}
            >
              <h1 className={Style["almarai-bold"]}>اعادة ضبط</h1>
            </button>
          </div>
          <div className="flex-1 px-1">
            <button
              className={
                "text-[#EFF7F9] bg-[#3D4C73] text-lg py-2 px-4 rounded-md transition-all duration-300"
              }
              onClick={() => {
                isFetchingRef.current = false;
                setHasMore(true);
                setWorkers([]);
                pageRef.current = 1;
                fetchData();
              }}
            >
              <h1 className={Style["almarai-bold"]}>بحث</h1>
            </button>
          </div>
        </div>

        {/* Table */}
        <table
          style={{
            backgroundColor: "white",
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr className="bg-yellow-400 text-white">
              <th
                className="bg-yellow-400 text-white"
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left", // محاذاة النص
                }}
              >
                اسم العاملة
              </th>
              <th
                className="bg-yellow-400 text-white"
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left", // محاذاة النص
                }}
              >
                رقم الجواز
              </th>
              <th
                className="bg-yellow-400 text-white"
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left", // محاذاة النص
                }}
              >
                الحالة
              </th>
              <th
                className="bg-yellow-400 text-white"
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left", // محاذاة النص
                }}
              >
                الموظف
              </th>

              <th
                className="bg-yellow-400 text-white"
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left", // محاذاة النص
                }}
              >
                التاريخ
              </th>
            </tr>
          </thead>
          <tbody>
            {workers.map((worker) => (
              <tr key={worker.id}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {worker?.HomeMaid?.Name}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {worker?.HomeMaid?.Passportnumber}
                </td>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                  }}
                >
                  {worker?.status}
                </td>

                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {worker?.employee}
                </td>

                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {getDate(worker?.date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center mt-6">
            {loading && (
              <div className="flex justify-center items-center">
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-purple-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4V1m0 22v-3m8-6h3m-22 0H4m16.243-7.757l2.121-2.121m-16.97 0L5.757 5.757M12 9v3m0 0v3m0-3h3m-3 0H9"
                  />
                </svg>
                Loading...
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
