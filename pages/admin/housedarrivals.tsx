import { BookFilled } from "@ant-design/icons";
import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import * as React from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import jwt from "jsonwebtoken";
import { jwtDecode } from "jwt-decode";
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
        age: filters.age,
        id: filters.id,
        Passportnumber: filters.Passportnumber,
        page: String(pageRef.current),
        sortKey: sortConfig.key || "",
        sortDirection: sortConfig.direction,
      });

      const response = await fetch(
        `/api/confirmhousinginformation?${queryParams}`,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          method: "get",
        }
      );

      const res = await response.json();
      if (res && res.housing.length > 0) {
        setData((prevData) => [...prevData, ...res.housing]);
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
  const [employeeName, setEmployeeName] = useState("");
  const postData = async (e) => {
    try {
      const decoded = jwtDecode(localStorage.getItem("token"));
      console.log(decoded);
      setEmployee(decoded.username);
    } catch (e) {
      router.push("/login");
    }
    e.preventDefault();
    if (reason.length < 1) return alert("يرجى ادخال سبب التسكين");
    const fetchData = await fetch("/api/confirmhousinginformation/", {
      body: JSON.stringify({
        // ...values,
        reason,
        employee,
        details: details,
        homeMaidId: newHomeMaid.id,
        houseentrydate: houseentrydate,
        deliveryDate,

        // fullname: name,
      }),
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    const data = await fetchData.json();

    if (fetchData.status == 200) {
      // onClose();
      // setDate();
      handleCloseAddModal();
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
      isFetchingRef.current = false;
      setHasMore(true);
      setData([]);
      pageRef.current = 1;
      // fetchData();
      // fetchData();
      // router.push("/admin/neworder/" + data.id);
    } else {
      // setIserrorModalOpen(true);
      // seterrormessage(data.message);
    }
  };

  const [status, setStatus] = useState("");
  const [dateStatus, setDateStatus] = useState("");
  const postUpdatedStatus = async () => {
    try {
      const decoded = jwtDecode(localStorage.getItem("token"));
      console.log(decoded);
      setEmployee(decoded.username);
    } catch (e) {
      router.push("/login");
    }
    const response = await fetch("/api/weekly-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        ID,
        date: dateStatus,
        employee: jwtDecode(localStorage.getItem("token")).username,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setOpenStatusModal(false);
      isFetchingRef.current = false;
      setHasMore(true);
      setFilters({ age: "", id: "", Passportnumber: "", Name: "" });
      setData([]);
      pageRef.current = 1;
      fetchData();

      // console.log("Success:", data.message);
    } else {
      // console.log("Error:", data.error);
    }
  };

  const [openStatusModal, setOpenStatusModal] = useState(false);

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
          const decoded = jwtDecode(localStorage.getItem("token"));
      console.log(decoded);
      setEmployee(decoded.username);


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

  const handleSaveNewHomeMaid = async () => {
    const decoded = jwtDecode(localStorage.getItem("token"));
    console.log(decoded);
    setExternalHomemaid({
      ...newExternalHomemaid,
      employee: decoded.username,
    });
    if (reason.length < 1) return alert("يرجى ادخال سبب التسكين");

    try {
      const response = await fetch("/api/addexternalhomemaid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newExternalHomemaid,
          employee: decoded.username,
        }),
      });
      if (response.ok) {
        handleCloseAddModal();
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
        isFetchingRef.current = false;
        setHasMore(true);
        setData([]);
        pageRef.current = 1;
        fetchData();
      } else {
        console.error("خطأ في إضافة العاملة:", await response.json());
      }
    } catch (error) {
      console.error("خطأ في الاتصال بالخادم:", error);
    }
  };

  const newSearchedHomeMaid =(e)=>{

    setNewHomeMaid(e);
        setIsPassportVerified(true);
setFindResults(false)
               }

const [nameQuery,setNameQuery]=useState("")
const [results,setResults]=useState([])
const [findResults,setFindResults]=useState(false)
  // const [employee, setEmployee] = useState("");
  const [isPasportVerified, setIsPassportVerified] = useState(false);
  // دالة البحث عن العاملة الداخلية
  const handleSearch = async () => {
    try {
      setIsPassportVerified(false);
      const response = await fetch(
        `/api/searchhomemaid?Passportnumber=${searchQuery}&Name=${nameQuery}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const result = await response.json();
        console.log("نتيجة البحث:", result);

        // يمكنك هنا تحديث `newHomeMaid` بالبيانات المسترجعة إذا لزم الأمر
        setResults(result)
        setFindResults(true)
        // handleSaveNewHomeMaid(); // حفظ البيانات مباشرة بعد البحث
      } else {
        console.error("خطأ في البحث:", await response.json());
      }
    } catch (error) {
      console.error("خطأ في الاتصال بالخادم:", error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h1
            className={`text-left font-medium text-2xl ${Style["almarai-bold"]}`}
          >
            عاملات تم تسكينهم
          </h1>
          <div>
            {" "}
            <Button
              style={{ marginLeft: "10px" }}
              variant="contained"
              color="secondary"
              onClick={() => router.push("/admin/workersstatus")}
            >
              حالات العاملات
            </Button>
            <Button
              style={{ marginLeft: "10px" }}
              variant="contained"
              color="warning"
              onClick={handleOpenAddModal}
            >
              تسكين عاملة
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push("/admin/checklisttable")}
            >
              بيانات الاعاشة
            </Button>
          </div>
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
          {/* <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.id}
              onChange={(e) => handleFilterChange(e, "id")}
              placeholder="بحث برقم العاملة"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div> */}
          <div className="flex-1 px-1">
            <button
              className={
                "text-[#EFF7F9] bg-[#3D4C73] text-lg py-2 px-4 rounded-md transition-all duration-300"
              }
              onClick={() => {
                isFetchingRef.current = false;
                setHasMore(true);
                setFilters({ age: "", id: "", Passportnumber: "", Name: "" });
                setData([]);
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
                setData([]);
                pageRef.current = 1;
                fetchData();
              }}
            >
              <h1 className={Style["almarai-bold"]}>بحث</h1>
            </button>
          </div>
        </div>

        {/* Table */}
        <table className="min-w-full table-auto border-collapse bg-white shadow-md rounded-md">
          <thead>
            <tr className="bg-yellow-400 text-white">
              <th
                className="p-3 text-center text-sm font-medium cursor-pointer"
                onClick={() => requestSort("id")}
              >
                رقم الطلب{" "}
                {sortConfig.key === "id" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="p-3 text-center text-sm font-medium cursor-pointer"
                onClick={() => requestSort("Name")}
              >
                اسم العاملة{" "}
                {sortConfig.key === "Name" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="p-3 text-center text-sm font-medium cursor-pointer"
                onClick={() => requestSort("phone")}
              >
                جوال العاملة{" "}
                {sortConfig.key === "phone" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="p-3 text-center text-sm font-medium cursor-pointer"
                onClick={() => requestSort("Details")}
              >
                سبب التسكين{" "}
                {sortConfig.key === "Reason" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="p-3 text-center text-sm font-medium cursor-pointer"
                onClick={() => requestSort("Details")}
              >
                تاريخ التسكين{" "}
                {sortConfig.key === "houseentrydate" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="p-3 text-center text-sm font-medium cursor-pointer"
                onClick={() => requestSort("Nationalitycopy")}
              >
                الجنسية{" "}
                {sortConfig.key === "Nationalitycopy" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="p-3 text-center text-sm font-medium cursor-pointer"
                onClick={() => requestSort("Passportnumber")}
              >
                رقم جواز السفر{" "}
                {sortConfig.key === "Passportnumber" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="p-3 text-center text-sm font-medium cursor-pointer"
                onClick={() => requestSort("employee")}
              >
                الموظف{" "}
                {sortConfig.key === "employee" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="p-3 text-center text-sm font-medium cursor-pointer"
                onClick={() => requestSort("ClientName")}
              >
                اسم العميل{" "}
                {sortConfig.key === "ClientName" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="p-3 text-center text-sm font-medium cursor-pointer"
                onClick={() => requestSort("ClientName")}
              >
                حالة العاملة
              </th>
              <th
                className="p-3 text-center text-sm font-medium cursor-pointer"
                // onClick={() => requestSort("ClientName")}
              >
                تسجيل في الاعاشة{" "}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  className="p-3 text-center text-sm text-gray-500"
                >
                  No results found
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <React.Fragment key={item.id}>
                  <tr className="border-t">
                    <td>
                      <h1
                        className={`text-center cursor-pointer text-purple-700 mb-4 ${Style["almarai-bold"]}`}
                        onClick={() => {
                          const url = "/admin/neworder/" + item?.Order.id;
                          window.open(url, "_blank");
                        }}
                      >
                        {item?.Order.id ? item?.Order.id : "لا يوجد بيان"}
                      </h1>
                    </td>
                    <td
                      className={`text-center cursor-pointer text-purple-900 text-lg mb-4 ${Style["almarai-light"]}`}
                      onClick={() => {
                        const url =
                          "/admin/cvdetails/" + item?.Order.HomeMaid.id;
                        window.open(url, "_blank");
                      }}
                    >
                      <h1
                        className={`text-center mb-4 ${Style["almarai-bold"]}`}
                      >
                        {item?.Order.HomeMaid.Name
                          ? item?.Order.HomeMaid.Name
                          : "لا يوجد بيان"}
                      </h1>
                    </td>
                    <td
                      className={`text-center mb-4 ${Style["almarai-light"]}`}
                    >
                      <h1
                        className={`text-center mb-4 ${Style["almarai-bold"]}`}
                      >
                        {item?.Order.HomeMaid.phone
                          ? item?.Order.HomeMaid.phone
                          : "لا يوجد"}
                      </h1>
                    </td>
                    <td
                      className={`text-center mb-4 ${Style["almarai-light"]}`}
                      onClick={() => handleRowClick(item.id)}
                    >
                      <h1
                        className={`text-center mb-4 ${Style["almarai-bold"]}`}
                      >
                        {item?.Reason ? item?.Reason : "لا يوجد"}
                      </h1>
                    </td>
                    <td
                      className={`text-center mb-4 ${Style["almarai-light"]}`}
                      onClick={() => handleRowClick(item.id)}
                    >
                      <h1
                        className={`text-center mb-4 ${Style["almarai-bold"]}`}
                      >
                        {item?.houseentrydate
                          ? getDate(item?.houseentrydate)
                          : "لا يوجد"}
                      </h1>
                    </td>
                    <td className={`text-center mb-4`}>
                      <h1
                        className={`text-center mb-4 ${Style["almarai-bold"]}`}
                      >
                        {item?.Order.HomeMaid.Nationalitycopy
                          ? item?.Order.HomeMaid.Nationalitycopy
                          : "لا يوجد بيان"}
                      </h1>
                    </td>
                    <td className={`text-center mb-4`}>
                      <h1
                        className={`text-center mb-4 ${Style["almarai-bold"]}`}
                      >
                        {item?.Order.HomeMaid.Passportnumber
                          ? item?.Order.HomeMaid.Passportnumber
                          : "لا يوجد بيان"}
                      </h1>
                    </td>
                    <td className={`text-center mb-4`}>
                      <h1
                        className={`text-center mb-4 ${Style["almarai-bold"]}`}
                      >
                        {item?.employee ? item?.employee : "لا يوجد بيان"}
                      </h1>
                    </td>
                    <td className={`text-center mb-4`}>
                      <h1
                        className={`text-center mb-4 ${Style["almarai-bold"]}`}
                      >
                        {item?.Order.ClientName ? item?.Order.ClientName : null}
                      </h1>
                    </td>

                    <td className={`text-center mb-4`}>
                      <Button
                        onClick={() => {
                          setID(item?.Order.HomeMaid.id);
                          setOpenStatusModal(true);
                        }}
                        //تحديث حالة العاملة
                        variant="contained"
                        color="warning"
                      >
                        تعديل
                      </Button>
                    </td>

                    <td className={`text-center mb-4`}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() =>
                          router.push("/admin/checklist?id=" + item?.Order.id)
                        }
                      >
                        تسجيل
                      </Button>
                    </td>
                  </tr>
                  {expandedRow === item.id && (
                    <tr className="bg-gray-100">
                      <td colSpan="9" className="p-3 text-center">
                        <div>
                          <p>{item?.Details}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>

        <Modal open={openStatusModal} onClose={handleCloseStatusModal}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 600,
              maxHeight: "80vh",
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
              overflowY: "auto",
            }}
          >
            <h2 className={Style["almarai-bold"]}>تحديث حالة العاملة</h2>
            <TextField
              fullWidth
              // label="رقم جواز العاملة"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              margin="normal"
            />

            <TextField
              fullWidth
              type="date"
              label="تاريخ الحالة"
              // label="رقم جواز العاملة"
              value={dateStatus}
              onChange={(e) => setDateStatus(e.target.value)}
              margin="normal"
            />
            <button
              onClick={postUpdatedStatus}
              className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              تحديث
            </button>
          </Box>
        </Modal>

        {/* Modal لإضافة عاملة جديدة */}
        <Modal open={openAddModal} onClose={handleCloseAddModal}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 600,
              maxHeight: "80vh",
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
              overflowY: "auto",
            }}
          >
            <h2
              className={Style["almarai-bold"]}
              style={{ marginBottom: "4px" }}
            >
              تسكين عاملة
            </h2>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label">نوع العاملة</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={employeeType}
                label="نوع العاملة"
                onChange={handleEmployeeChange}
              >
                <MenuItem value="external">عاملة خارجية</MenuItem>
                <MenuItem value="internal">عاملة داخلية</MenuItem>
              </Select>
            </FormControl>

            {employeeType === "internal" ? (
              // عرض مربع البحث فقط إذا كانت العاملة داخلية
              <Box mt={2}>
                <TextField
                  fullWidth
                  label="اسم العاملة"
                  value={nameQuery}
                  onChange={(e) => setNameQuery(e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="رقم جواز العاملة"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  margin="normal"
                />
               
                {findResults&&
   <div id="dropdown" class=" left-0 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-md ">
      <ul>
        {results.map(e=>
        <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={()=>newSearchedHomeMaid(e)}>{e.Name}</li>)}
      </ul>
    </div>}

                <Box mt={2} display="flex" justifyContent="space-between">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSearch}
                  >
                    بحث
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCloseAddModal}
                  >
                    إلغاء
                  </Button>
                </Box>

                {isPasportVerified && (
                  <div>
                    <Typography>Order Id : {newHomeMaid.id}</Typography>
                    <Typography>اسم العاملة : {newHomeMaid.Name}</Typography>

                    <div className="mb-4">
                      <label className="block text-gray-700">
                        تاريخ التسكين
                      </label>
                      <input
                        type="date"
                        value={houseentrydate}
                        onChange={(e) => sethouseentrydate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        // placeholder="أدخل اسمك"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700">
                        تاريخ الاستلام
                      </label>
                      <input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveyDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        // placeholder="أدخل اسمك"
                      />
                    </div>

                    <div className="mb-4 hidden" >
                      <label className="block text-gray-700">الموظف</label>
                      <input
                        type="text"
                        value={employee}
                        onChange={(e) => setEmployee(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        // placeholder="أدخل اسمك"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700">سبب التسكين</label>
                      <select
                        required
                        className="rounded-md"
                        onChange={(e) => setReason(e.target.value)}
                      >
                        <option value="">...</option>

                        <option value="نقل كفالة">نقل كفالة</option>
                        <option value="انتظار الترحيل">انتظار الترحيل</option>
                        <option value="مشكلة مكتب العمل">
                          مشكلة مكتب العمل
                        </option>
                        <option value="رفض العمل للسفر">رفض العمل للسفر</option>
                        <option value="رفض العم لنقل الكفالة">
                          رفض العمل لنقل الكفالة
                        </option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <input
                        type="text"
                        value={details}
                        onChange={(e) => setdetails(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="التفاصيل"
                      />
                    </div>
                    <button
                      onClick={postData}
                      className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      تسجيل
                    </button>
                    {/* <button > تسجيل </button> */}
                    <span>{error}</span>
                  </div>
                )}
              </Box>
            ) : employeeType === "external" ? (
              // عرض النموذج الكامل إذا كانت العاملة خارجية
              <>
                <TextField
                  fullWidth
                  label="اسم العاملة"
                  name="Name"
                  value={newExternalHomemaid.Name}
                  onChange={handleNewHomeMaidChange}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="رقم الجواز"
                  name="Passportnumber"
                  value={newExternalHomemaid.Passportnumber}
                  onChange={handleNewHomeMaidChange}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="الجنسية"
                  name="Nationalitycopy"
                  value={newExternalHomemaid.Nationalitycopy}
                  onChange={handleNewHomeMaidChange}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="الديانة"
                  name="Religion"
                  value={newExternalHomemaid.Religion}
                  onChange={handleNewHomeMaidChange}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="رقم الهاتف"
                  name="phone"
                  value={newExternalHomemaid.phone}
                  onChange={handleNewHomeMaidChange}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="سنوات الخبرة"
                  name="ExperienceYears"
                  value={newExternalHomemaid.ExperienceYears}
                  onChange={handleNewHomeMaidChange}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="الحالة الاجتماعية"
                  name="maritalstatus"
                  value={newExternalHomemaid.maritalstatus}
                  onChange={handleNewHomeMaidChange}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="الخبرة"
                  name="Experience"
                  value={newExternalHomemaid.Experience}
                  onChange={handleNewHomeMaidChange}
                  margin="normal"
                />

                <label className="block text-gray-700 font-bold mb-1">
                  تاريخ الميلاد
                </label>

                <TextField
                  fullWidth
                  label="تاريخ الميلاد"
                  name="dateofbirth"
                  type="date"
                  value={newExternalHomemaid.dateofbirth}
                  onChange={handleNewHomeMaidChange}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="اسم المكتب"
                  name="officeName"
                  value={newHomeMaid.officeName}
                  onChange={handleNewHomeMaidChange}
                  margin="normal"
                />
                <label className="block text-gray-700 font-bold mb-1">
                  تاريخ بداية الجواز
                </label>

                <TextField
                  fullWidth
                  label="تاريخ بداية الجواز"
                  name="PassportStart"
                  type="date"
                  value={newExternalHomemaid.PassportStart}
                  onChange={handleNewHomeMaidChange}
                  margin="normal"
                />
                <label className="block text-gray-700 font-bold mb-1">
                  تاريخ نهاية الجواز
                </label>

                <TextField
                  fullWidth
                  label="تاريخ نهاية الجواز"
                  type="date"
                  name="PassportEnd"
                  value={newExternalHomemaid.PassportEnd}
                  onChange={handleNewHomeMaidChange}
                  margin="normal"
                />
                <TextField
                  style={{ display: "none" }}
                  fullWidth
                  label="اسم الموظف"
                  name="employee"
                  value={newExternalHomemaid.employee}
                  onChange={handleNewHomeMaidChange}
                  margin="normal"
                />
                <div className="mb-4">
                  <label className="block text-gray-700">سبب التسكين</label>
                  <select
                    name="reason"
                    className="rounded-md"
                    onChange={handleNewHomeMaidChange}
                  >
                    <option value="">...</option>

                    <option value="نقل كفالة">نقل كفالة</option>
                    <option value="انتظار الترحيل">انتظار الترحيل</option>
                    <option value="مشكلة مكتب العمل">مشكلة مكتب العمل</option>
                    <option value="رفض العمل للسفر">رفض العمل للسفر</option>
                    <option value="رفض العم لنقل الكفالة">
                      رفض العمل لنقل الكفالة
                    </option>
                  </select>
                </div>
                <TextField
                  fullWidth
                  label="ملاحظات"
                  name="details"
                  value={newExternalHomemaid.details}
                  onChange={handleNewHomeMaidChange}
                  margin="normal"
                />
                <label className="block text-gray-700 font-bold mb-1">
                  تاريخ التسكين
                </label>

                <TextField
                  fullWidth
                  type="date"
                  label="تاريخ التسكين"
                  name="houseentrydate"
                  value={newExternalHomemaid.houseentrydate}
                  onChange={handleNewHomeMaidChange}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  type="date"
                  label="تاريخ الاستلام"
                  name="deliveryDate"
                  value={newExternalHomemaid.deliveryDate}
                  onChange={handleNewHomeMaidChange}
                  margin="normal"
                />
                <div></div>
                <Box mt={2} display="flex" justifyContent="space-between">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveNewHomeMaid}
                  >
                    حفظ
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCloseAddModal}
                  >
                    إلغاء
                  </Button>
                </Box>
              </>
            ) : null}
          </Box>
        </Modal>

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
