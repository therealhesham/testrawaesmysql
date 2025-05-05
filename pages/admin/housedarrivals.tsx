import { BookFilled } from "@ant-design/icons";
import Head from "next/head";

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
import { set } from "mongoose";
import ErrorModal from "components/modalcomponent";

export default function Table() {
  const [openCashModal, setOpenCashModal] = useState(false);
  const [newCashRecord, setNewCashRecord] = useState({
    amount: "",
    transaction_type: "",
    Year: "",
    Month: "",
  });
  const [days, setDays] = useState(0);

  function calcualtinghousingdays(date){

const startDate = new Date(date);
    const currentDate = new Date();
    
    // حساب الفرق بالأيام
    const differenceInTime = currentDate.getTime()-startDate.getTime()  ;
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    return differenceInDays
  }
  const [cashError, setCashError] = useState("");
  const [employeeType, setEmployeeType] = useState("");
  const [deparatureDate, setDeparatureDate] = useState("");
  const [timeDeparature, setTimeDeparature] = useState("");
  const [deparatureFromSaudi, setDeparatureFromSaudi] = useState("");
  // Handler for updating the departure date
  const handleDateChange = (e) => {
    setDeparatureDate(e.target.value);
  };

  // Handler for updating the departure time
  const handleTimeChange = (e) => {
    setTimeDeparature(e.target.value);
  };

  const [details, setdetails] = useState("");
  const [deparatureReason, setDeparatueReason] = useState("");
  const [sessionReason, setSessionReason] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reason, setReason] = useState("");
  const [openSessionModal, setOpenSessionModal] = useState(false);

  const handleCloseSessionModal = () => {
    setOpenSessionModal(false);
  };

  const handleCloseDeparatureModal = () => {
    setDeparatueReason("");

    setOpenDeparatureModal(false);
  };
  const [openDeparatureModal, setOpenDeparatureModal] = useState(false);

  const [employee, setEmployee] = useState("");

  const [deliveryDate, setDeliveyDate] = useState("");
  const [houseentrydate, sethouseentrydate] = useState("");
  const [error, setError] = useState("");
  
  const [errormodalopen, setIserrorModalOpen] = useState(false);
  const [errormessage, seterrormessage] = useState("");
  const [loadingScreen, setLoadingScreen] = useState(false);

  const [expandedRow, setExpandedRow] = useState(null);
  const [filters, setFilters] = useState({
    Name: "",
    age: "",
    reason: "",
    Passportnumber: "",
    id: "",
  });
  const [openEditModal, setOpenEditModal] = useState(false);

  const handleCloseEditModal = () => {
    setDeliveyDate("");
    sethouseentrydate("");
    setNewHomeMaid({
      id: 0,
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
    setOpenEditModal(false);
  };
  const router = useRouter();
  const [openCheckInModal, setOpenCheckInModal] = useState(false);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkInError, setCheckInError] = useState("");
  const [data, setData] = useState([]);
  const handleOpenCheckInModal = () => {
    setOpenCheckInModal(true);
    setCheckInDate(""); // إعادة تعيين التاريخ
    setCheckInError(""); // إعادة تعيين الخطأ
  };

  const handleCloseCheckInModal = () => {
    setOpenCheckInModal(false);
    setCheckInDate("");
    setCheckInError("");
  };

  const handleCreateCheckIns = async () => {
    setLoadingScreen(true);
    try {
      const response = await fetch("/api/newday", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          CheckDate: checkInDate
            ? new Date(checkInDate).toISOString()
            : new Date().toISOString(),
        }),
      });

      const data = await response.json();
      if (response.status === 201) {
        setCheckInError(data.message);
        setShowConfirmModal(true); // نظهر الـ Confirmation Modal
      } else if (response.status === 200) {
        handleCloseCheckInModal();
        // إعادة تحميل البيانات إذا لزم الأمر
        isFetchingRef.current = false;
        setHasMore(true);
        setData([]);
        pageRef.current = 1;
        fetchData();
      } else {
        setCheckInError(data.message || "فشل في إنشاء سجلات الإعاشة");
      }
    } catch (error) {
      setCheckInError("خطأ في الاتصال بالخادم");
    } finally {
      setLoadingScreen(false);
    }
  };

  const handleContinue = async () => {
    try {
      const response = await fetch("/api/newdayforcing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          CheckDate: new Date(checkInDate).toISOString(),
        }),
      });
      const data = await response.json();
      if (response.status === 200) {
        setShowConfirmModal(false);
        setCheckInError("");
        handleCloseCheckInModal(); // نقفل كل حاجة لما ينجح
      } else {
        setCheckInError(data.message || "حدث خطأ أثناء المتابعة");
      }
    } catch (error) {
      setCheckInError("حدث خطأ أثناء الاتصال بالخادم");
    }
  };
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

  const [totalCount, setTotalCount] = useState(0); // New state for total count

  const [page,setPage]=useState(0)
  async function fetchData() {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    // setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        Name: filters.Name,
        age: filters.age,
        reason: filters.reason,
        id: filters.id,
        Passportnumber: filters.Passportnumber,
        page: String(pageRef.current),
        sortKey: sortConfig.key || "",
        sortDirection: sortConfig.direction,
      });
// setPage()
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
                setTotalCount(res.totalCount); // Set the total count from API response
        pageRef.current += 1;
      } else {
                setTotalCount(res.totalCount); // Set the total count from API response
        
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }
  const [employeeName, setEmployeeName] = useState("");
  const postData = async (e) => {
    setLoadingScreen(true);
    setLoading(true);
    try {
      const decoded = jwtDecode(localStorage.getItem("token"));
      console.log(decoded);
      setEmployee(decoded.username);
    } catch (e) {
      setLoading(false);

      router.push("/login");
    }
    e.preventDefault();
    if (reason.length < 1) {
      setLoadingScreen(false);
      
      setIserrorModalOpen(true)
      setErrorModalMessage("يرجى ادخال سبب التسكين")
      // return alert("");

    }
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
      handleCloseEditModal();
      setEmployeeType(""); // إعادة تعيين نوع العاملة
      setSearchQuery(""); // إعادة تعيين مربع البحث
      isFetchingRef.current = false;
      setHasMore(true);
      setData([]);
      setLoading(false);
      setLoadingScreen(false);

      pageRef.current = 1;
      // fetchData();
      // fetchData();
      // router.push("/admin/neworder/" + data.id);
    } else {

      setLoading(false);
      setLoadingScreen(false);
      setErrorModalMessage(data.error)
      setIsModalOpen(true)
      

      // setIserrorModalOpen(true);
      // seterrormessage(data.message);
    }
  };
  const [sessionDate, setSessionDate] = useState("");

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
    if (response.status == 201) {
      setOpenStatusModal(false);
      isFetchingRef.current = false;
      setHasMore(true);
      setFilters({ age: "", id: "", Passportnumber: "", Name: "" });
      setData([]);
      pageRef.current = 1;
      fetchData();

      // console.log("Success:", data.message);
    } else {
      setIsModalOpen(true)
      // setIserrorModalOpen(true)
      setErrorModalMessage(data.error)
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
 const [isModalOpen, setIsModalOpen] = useState(false);
const [errorModalMessage,setErrorModalMessage]=useState("")
  const handleEmployeeChange = (e) => {
    setEmployeeType(e.target.value);
  };
  const [date, setDate] = useState("");

  useEffect(() => {
    setLoading(true);
    try {
      const decoded = jwtDecode(localStorage.getItem("token"));
      console.log(decoded);
      setEmployee(decoded.username);
    } catch (e) {
      setLoading(false);
      router.push("/admin/login");
    }
    fetchData();
    // setLoading(false);
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
    setLoading(true);
    try {
      const decoded = jwtDecode(localStorage.getItem("token"));
      console.log(decoded);

      setEmployee(decoded.username);
      // if (reason.length < 1) return alert("يرجى ادخال سبب التسكين");
    } catch (error) {
      setLoading(false);

      router.push("/admin/login");
    }
    try {
      const response = await fetch("/api/addexternalhomemaid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newExternalHomemaid,
          employee,
        }),
      });
      if (response.status == 200) {
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
        setLoading(false);
      } else {
        setLoading(false);

        console.error("خطأ في إضافة العاملة:", await response.json());
      }
    } catch (error) {
      setLoading(false);

      console.error("خطأ في الاتصال بالخادم:", error);
    }
  };

  const newSearchedHomeMaid = (e) => {
    setNewHomeMaid(e);
    setIsPassportVerified(true);
    setFindResults(false);
  };

  const [nameQuery, setNameQuery] = useState("");
  const [idQuery, setIdQuery] = useState("");
  const [idSession, SetIDSession] = useState(0);

  const [results, setResults] = useState([]);
  const [findResults, setFindResults] = useState(false);
  // const [employee, setEmployee] = useState("");
  const [isPasportVerified, setIsPassportVerified] = useState(false);
  // دالة البحث عن العاملة الداخلية
  const handleSearch = async () => {
    // setLoading(true);
    try {
      setIsPassportVerified(false);
      const response = await fetch(
        `/api/searchhomemaid?Passportnumber=${searchQuery}&Name=${nameQuery}&id=${idQuery}`,
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
        setResults(result);
        setFindResults(true);
        setLoading(false);
        // handleSaveNewHomeMaid(); // حفظ البيانات مباشرة بعد البحث
      } else {
        console.error("خطأ في البحث:", await response.json());
        setLoading(false);
      }
    } catch (error) {
      console.error("خطأ في الاتصال بالخادم:", error);
      setLoading(false);
    }
  };

  // Submit handler function
  const handleSubmit = async () => {
    // Your submit logic here (e.g., sending data to API)
    const departureData = {
      departureDate: deparatureDate,
      departureTime: timeDeparature,
    };
    setLoadingScreen(true);
    const fetchDeparatureData = await fetch("/api/housingdeparature", {
      body: JSON.stringify({
        // ...values,
        employee,
        reason: deparatureReason,
        details: details,
        homeMaid: newHomeMaid.id,
        departureDate: new Date(deparatureDate).toISOString(),
        deparatureFromSaudi: deparatureFromSaudi
          ? new Date(deparatureFromSaudi).toISOString()
          : null,
        departureTime: timeDeparature,
        // fullname: name,
      }),
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    const data = await fetchDeparatureData.json();

    if (fetchDeparatureData.status == 201) {
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

      handleCloseEditModal();
      setEmployeeType(""); // إعادة تعيين نوع العاملة
      setSearchQuery(""); // إعادة تعيين مربع البحث
      isFetchingRef.current = false;
      setHasMore(true);
      setData([]);
      setLoading(false);
      setLoadingScreen(false);

      pageRef.current = 1;
      fetchData();
      // fetchData();
      // router.push("/admin/neworder/" + data.id);
    } else {
      setLoading(false);

      // setIserrorModalOpen(true);
      // seterrormessage(data.message);
      setLoadingScreen(false);
    }
    setLoadingScreen(false);

    console.log("Departure data submitted: ", departureData);

    // Close modal after submission (optional)
    handleCloseDeparatureModal();
  };
  const handleSessionSubmit = async () => {
    // Submit handler function
    setLoadingScreen(true);
    try {
      const fetchDeparatureData = await fetch("/api/sessions", {
        body: JSON.stringify({
          // ...values,
          reason: sessionReason,

          time: sessionTime,

          idnumber: idSession,
          date: new Date(sessionDate).toISOString(),
        }),
        method: "post",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      const data = await fetchDeparatureData.json();

      if (fetchDeparatureData.status == 201) {
        // onClose();
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
        setLoadingScreen(false);

        handleCloseEditModal();
        setEmployeeType(""); // إعادة تعيين نوع العاملة
        setSearchQuery(""); // إعادة تعيين مربع البحث
        isFetchingRef.current = false;
        setHasMore(true);
        setData([]);
        setLoading(false);
        setLoadingScreen(false);

        pageRef.current = 1;
        fetchData();
        // fetchData();
        // router.push("/admin/neworder/" + data.id);
      } else {
        setLoading(false);

        // setIserrorModalOpen(true);
        // seterrormessage(data.message);
        setLoadingScreen(false);
      }
      setLoadingScreen(false);

      // Close modal after submission (optional)
      handleCloseDeparatureModal();
    } catch (error) {
      setLoadingScreen(false);
    }
  };
  const handleOpenCashModal = () => {
    setOpenCashModal(true);
  };

  const handleCloseCashModal = () => {
    setOpenCashModal(false);
    setNewCashRecord({
      amount: "",
      transaction_type: "",
      Month: "",
    });
    setCashError("");
  };

  const handleCashRecordChange = (e) => {
    const { name, value } = e.target;
    setNewCashRecord((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveCashRecord = async () => {
    setLoadingScreen(true);
    try {
      const response = await fetch("/api/addcash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: newCashRecord.amount,
          transaction_type: newCashRecord.transaction_type,
          Month: newCashRecord.Month,
          Year: newCashRecord.Year.toString(),
        }),
      });

      const data = await response.json();

      if (response.status === 201) {
        handleCloseCashModal();
        setLoadingScreen(false);
        // إعادة تحميل البيانات إذا لزم الأمر
        isFetchingRef.current = false;
        setHasMore(true);
        setData([]);
        pageRef.current = 1;
        fetchData();
      } else {
        setCashError(data.error || "فشل في إضافة السجل النقدي");
        setLoadingScreen(false);
      }
    } catch (error) {
      setCashError("خطأ في الاتصال بالخادم");
      setLoadingScreen(false);
    }
  };
  return (
    <Layout>
      <div className="container mx-auto p-6">
        <Head>
          <title>عاملات في السكن </title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="flex justify-between items-center mb-4">
          {/* <div className="absolute top-20 left-10">
            <button
              // onClick={handleExitClick}
              className="text-gray-500 hover:text-black"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-8 w-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div> */}

          {loading && (
            <div className="absolute  inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg flex items-center">
                <svg
                  className="animate-spin h-8 w-8 text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 1 1 8 8 8 8 0 0 1-8-8z"
                  ></path>
                </svg>
                <span className="ml-4 text-lg font-semibold text-blue-500">
                  Loading...
                </span>
              </div>
            </div>
          )}

          <h1
            className={`text-left font-medium text-2xl ${Style["almarai-bold"]}`}
          >
            عاملات تم تسكينهم
          </h1>
          <div>
            {" "}
            {/* <Button
              style={{ marginLeft: "10px" }}
              variant="contained"
              color="secondary"
              onClick={() => router.push("/admin/checklistpackage")}
            >
              تسجيل الاعاشات - تفصيلي و وجبات
            </Button> */}
            {/* <Button
              style={{ marginLeft: "10px" }}
              variant="contained"
              color="info"
              onClick={handleOpenCheckInModal}
            >
              إنشاء تسجيلات الإعاشة
            </Button>
            <Button
              style={{ marginLeft: "10px" }}
              variant="contained"
              color="secondary"
              onClick={() => router.push("/admin/distributecash")}
            >
              توزيع النقد
            </Button> */}
            <Button
              style={{ marginLeft: "1px" }}
              variant="contained"
               className={` ${Style["almarai-bold"]}`}

              color="secondary"
              onClick={() => router.push("/admin/cashtable")}
            >
              سجلات النقد
            </Button>
            {/* <Button
              style={{ marginLeft: "1px" }}
              variant="contained"
               className={` ${Style["almarai-bold"]}`}

              color="success"
              onClick={handleOpenCashModal}
            >
              إدارة النقد
            </Button> */}
            <Button
              style={{ marginLeft: "1px" }}
               className={` ${Style["almarai-bold"]}`}

              variant="contained"
              color="secondary"
              onClick={() => router.push("/admin/workersstatus")}
            >
              حالات العاملات
            </Button>
            <Button
              style={{ marginLeft: "1px" }}
               className={` ${Style["almarai-bold"]}`}

              variant="contained"
              color="warning"
              onClick={handleOpenAddModal}
            >
              تسكين عاملة
            </Button>
            <Button
              style={{ marginLeft: "1px" }}
              variant="contained"
               className={` ${Style["almarai-bold"]}`}

              color="primary"
              onClick={() => router.push("/admin/checkedtable")}
            >
              بيانات الاعاشة
            </Button>
            <Button
              style={{ marginLeft: "1px" }}
              variant="contained"
               className={` ${Style["almarai-bold"]}`}

              color="error"
              onClick={() => router.push("/admin/departedhousedarrivals")}
            >
              عاملات غادرت التسكين
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

          <div className="flex-1 px-2">
            <select onChange={(e) => handleFilterChange(e, "reason")}>
              <option value="">اختر سبب التسكين</option>
              <option value="نقل كفالة">نقل كفالة</option>
              <option value="مشكلة مكتب العمل">مشكلة مكتب العمل</option>
              <option value="رفض العامل للسفر">رفض العامل للسفر</option>
              <option value="رفض العمل لنقل الكفالة">
                رفض العمل لنقل الكفالة
              </option>

              <option value="انتظار الترحيل">انتظار الترحيل</option>
            </select>
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
                #
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
                onClick={() => requestSort("Details")}
              >
                تاريخ التسليم{" "}
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
              {/* <th
                className="p-3 text-center text-sm font-medium cursor-pointer"
                onClick={() => requestSort("ClientName")}
              >
                اسم العميل{" "}
                {sortConfig.key === "ClientName" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th> */}
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
                عدد الايام في السكن
              </th>

              {/* <th
                className="p-3 text-center text-sm font-medium cursor-pointer"
                // onClick={() => requestSort("ClientName")}
              >
                تعديل في الاعاشة{" "}
              </th> */}
              <th
                className="p-3 text-center text-sm font-medium cursor-pointer"
                // onClick={() => requestSort("ClientName")}
              >
                تعديل بيانات التسكين{" "}
              </th>

              <th
                className="p-3 text-center text-sm font-medium cursor-pointer"
                // onClick={() => requestSort("ClientName")}
              >
                مغادرة السكن{" "}
              </th>
              <th
                className="p-3 text-center text-sm font-medium cursor-pointer"
                // onClick={() => requestSort("ClientName")}
              >
                اضافة جلسة
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
              data.map((item,index) => (
                <React.Fragment key={item.id}>
                  <tr className="border-t">
                    <td className="text-center">{(totalCount-index)}</td>

                    {/* <td>
                      <h1
                        className={`text-center cursor-pointer text-purple-700 mb-4 ${Style["almarai-bold"]}`}
                        onClick={() => {
                          const url = "/admin/neworder/" + item?.Order.id;
                          window.open(url, "_blank");
                        }}
                      >
                        {item?.Order.id ? item?.Order.id : "لا يوجد بيان"}
                      </h1>
                    </td> */}
                    <td
                      className={`text-center cursor-pointer text-purple-900 text-lg mb-4 ${Style["almarai-light"]}`}
                      onClick={() => {
                        const url = "/admin/cvdetails/" + item?.Order.id;
                        window.open(url, "_blank");
                      }}
                    >
                      <h1
                        className={`text-center mb-4 ${Style["almarai-bold"]}`}
                      >
                        {item?.Order.Name ? item?.Order.Name : "لا يوجد بيان"}
                      </h1>
                    </td>
                    <td
                      className={`text-center mb-4 ${Style["almarai-light"]}`}
                    >
                      <h1
                        className={`text-center mb-4 ${Style["almarai-bold"]}`}
                      >
                        {item?.Order.phone ? item?.Order.phone : "لا يوجد"}
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
                          : ""}
                      </h1>
                    </td>

                    <td
                      className={`text-center mb-4 ${Style["almarai-light"]}`}
                      onClick={() => handleRowClick(item.id)}
                    >
                      <h1
                        className={`text-center mb-4 ${Style["almarai-bold"]}`}
                      >
                        {item?.deliveryDate ? getDate(item?.deliveryDate) : ""}
                      </h1>
                    </td>

                    <td className={`text-center mb-4`}>
                      <h1
                        className={`text-center mb-4 ${Style["almarai-bold"]}`}
                      >
                        {item?.Order.Nationalitycopy
                          ? item?.Order.Nationalitycopy
                          : ""}
                      </h1>
                    </td>
                    <td className={`text-center mb-4`}>
                      <h1
                        className={`text-center mb-4 ${Style["almarai-bold"]}`}
                      >
                        {item?.Order.Passportnumber
                          ? item?.Order.Passportnumber
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
                    {/* <td className={`text-center mb-4`}>
                      <h1
                        className={`text-center mb-4 ${Style["almarai-bold"]}`}
                      >
                        {item?.Order.ClientName ? item?.Order.ClientName : null}
                      </h1>
                    </td> */}

                    <td className={`text-center mb-4`}>
                      <Button
                        onClick={() => {
                          setID(item?.Order.id);
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
                      <h1
                        className={`text-center mb-4 ${Style["almarai-bold"]}`}
                      >
                        {calcualtinghousingdays(item?.houseentrydate)   }
                      </h1>
                    </td>


                    {/* <td className={`text-center mb-4`}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() =>
                          router.push("/admin/checklist?id=" + item?.Order.id)
                        }
                      >
                        تعديل
                      </Button>
                    </td> */}
                    <td className={`text-center mb-4`}>
                      <Button
                        onClick={() => {
                          // setNewHomeMaid({...newHomeMaid,id:item?.Order.id,Name:item?.Order.Name})

                          setNewHomeMaid({
                            id: item?.Order.id,
                            Name: item?.Order.Name,
                          });
                          setOpenEditModal(true);
                        }}
                        //تحديث حالة العاملة
                        variant="contained"
                        color="secondary"
                      >
                        تعديل
                      </Button>
                    </td>
                    <td className={`text-center mb-4`}>
                      <Button
                        onClick={() => {
                          setNewHomeMaid({ id: item?.Order.id });
                          setOpenDeparatureModal(true);
                          // setNewHomeMaid({...newHomeMaid,id:item?.Order.id,Name:item?.Order.Name})
                        }}
                        //تحديث حالة العاملة
                        variant="contained"
                        color="error"
                      >
                        مغادرة
                      </Button>
                    </td>

                    <td className={`text-center mb-4`}>
                      <Button
                        onClick={() => {
                          SetIDSession(item?.Order.id);
                          setOpenSessionModal(true);
                        }}
                        //تحديث حالة العاملة
                        variant="contained"
                        color="success"
                      >
                        اضافة
                      </Button>
                    </td>
                  </tr>
                  {expandedRow === item.id && (
                    <tr className="bg-gray-100">
                      <td colSpan={9} className="p-3 text-center">
                        <div>
                          <p className={Style["almarai-bold"]}> <span style={{color:"green"}}>الحالة</span>  : {item?.Order. weeklyStatusId[item?.Order.weeklyStatusId.length-1]?.status} </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
        <Modal open={openCashModal} onClose={handleCloseCashModal}>
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
            <h2 className={Style["almarai-bold"]}>إضافة سجل نقدي</h2>

            <TextField
              fullWidth
              label="المبلغ"
              name="amount"
              type="number"
              value={newCashRecord.amount}
              onChange={handleCashRecordChange}
              margin="normal"
              required
            />
            {/* 
            <FormControl fullWidth margin="normal">
              <InputLabel>نوع العملية</InputLabel>
              <Select
                name="transaction_type"
                value={newCashRecord.transaction_type}
                onChange={handleCashRecordChange}
                required
              >
                <MenuItem value="income">إيراد</MenuItem>
                <MenuItem value="expense">مصروف</MenuItem>
              </Select>
            </FormControl> */}

            <FormControl fullWidth margin="normal">
              <InputLabel>الشهر</InputLabel>
              <Select
                name="Month"
                value={newCashRecord.Month}
                onChange={handleCashRecordChange}
                required
              >
                <MenuItem value="1">يناير</MenuItem>
                <MenuItem value="2">فبراير</MenuItem>
                <MenuItem value="3">مارس</MenuItem>
                <MenuItem value="4">أبريل</MenuItem>
                <MenuItem value="5">مايو</MenuItem>
                <MenuItem value="6">يونيو</MenuItem>
                <MenuItem value="7">يوليو</MenuItem>
                <MenuItem value="8">أغسطس</MenuItem>
                <MenuItem value="9">سبتمبر</MenuItem>
                <MenuItem value="10">أكتوبر</MenuItem>
                <MenuItem value="11">نوفمبر</MenuItem>
                <MenuItem value="12">ديسمبر</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>السنة</InputLabel>
              <Select
                name="Year"
                value={newCashRecord.Year}
                onChange={handleCashRecordChange}
                required
              >
                {[...Array(6)].map((_, index) => {
                  const year = new Date().getFullYear() - 3 + index;
                  return (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            {cashError && (
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                {cashError}
              </Typography>
            )}

            <Box mt={2} display="flex" justifyContent="space-between">
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveCashRecord}
              >
                حفظ
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleCloseCashModal}
              >
                إلغاء
              </Button>
            </Box>
          </Box>
        </Modal>
        <Modal open={openCheckInModal} onClose={handleCloseCheckInModal}>
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
            <h2 className={Style["almarai-bold"]}>إنشاء تسجيلات الإعاشة</h2>

            <TextField
              fullWidth
              label="تاريخ التسجيل"
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />

            {checkInError && !showConfirmModal && (
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                {checkInError}
              </Typography>
            )}

            <Box mt={2} display="flex" justifyContent="space-between">
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateCheckIns}
                disabled={!checkInDate}
              >
                إنشاء
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleCloseCheckInModal}
              >
                إلغاء
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Confirmation Modal لما يظهر الـ error بتاع الـ 201 */}
        <Modal
          open={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 3,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              تأكيد المتابعة
            </Typography>
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {checkInError}
            </Typography>
            <Box display="flex" justifyContent="space-between">
              <Button
                variant="contained"
                color="primary"
                onClick={handleContinue}
              >
                متابعة
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                إلغاء
              </Button>
            </Box>
          </Box>
        </Modal>
        <Modal open={openSessionModal} onClose={handleCloseSessionModal}>
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
            <h2 className="almarai-bold">اضافة جلسة</h2>

            <div className="mb-4">
              <label
                style={{ display: "flex", justifyContent: "center" }}
                htmlFor="date"
                className="block text-sm font-medium text-gray-700"
              >
                سبب الجلسة
              </label>
              <input
                onChange={(e) => setSessionReason(e.target.value)}
                value={sessionReason}
                id="deparaturedate"
                name="deparaturedate"
                type="text"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="mb-4">
              <label
                style={{ display: "flex", justifyContent: "center" }}
                htmlFor="date"
                className="block text-sm font-medium text-gray-700"
              >
                تاريخ الجلسة
              </label>
              <input
                onChange={(e) => setSessionDate(e.target.value)}
                value={sessionDate}
                id="deparaturedate"
                name="deparaturedate"
                type="date"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="mb-4">
              <label
                style={{ display: "flex", justifyContent: "center" }}
                htmlFor="date"
                className="block text-sm font-medium text-gray-700"
              >
                توقيت الجلسة
              </label>
              <input
                onChange={(e) => setSessionTime(e.target.value)}
                value={sessionTime}
                id="deparaturedate"
                name="deparaturedate"
                type="time"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleCloseSessionModal}
              className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              اغلاق
            </button>
            <button
              onClick={handleSessionSubmit}
              className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              تحديث
            </button>
          </Box>
        </Modal>
        <Modal open={openDeparatureModal} onClose={handleCloseDeparatureModal}>
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
            <h2 className="almarai-bold">مغادرة من السكن</h2>

            <div className="mb-4">
              <label
                style={{ display: "flex", justifyContent: "center" }}
                htmlFor="date"
                className="block text-sm font-medium text-gray-700"
              >
                تاريخ المغادرة
              </label>
              <input
                onChange={(e) => setDeparatureDate(e.target.value)}
                value={deparatureDate}
                id="deparaturedate"
                name="deparaturedate"
                type="date"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mb-4 w-full">
              <label
                style={{ display: "flex", justifyContent: "center" }}
                htmlFor="date"
                className="block text-sm font-medium text-gray-700"
              >
                سبب المغادرة
              </label>
              <select
                required
                className="rounded-md w-full"
                onChange={(e) => setDeparatueReason(e.target.value)}
              >
                <option value="">...</option>

                <option value="سافرت">سافرت</option>
                <option value="نقل كفالة">نقل كفالة</option>
                <option value="رجعت للكقيل">رجعت للكفيل</option>
                <option value="هربت">هربت</option>
                <option value="تم تسليمها لجهة حكومية">
                  تم تسليمها لجهة حكومية
                </option>
                <option value="تم تسليمها لجهة حكومية">المستشفى</option>
              </select>
            </div>

            {deparatureReason === "سافرت" && (
              <div>
                <div className="mb-4">
                  <label
                    style={{ display: "flex", justifyContent: "center" }}
                    htmlFor="date"
                    className="block text-sm font-medium text-gray-700"
                  >
                    تاريخ المغادرة
                  </label>
                  <input
                    onChange={(e) => setDeparatureFromSaudi(e.target.value)}
                    value={deparatureFromSaudi}
                    id="deparatureFromSaudi"
                    name="deparatureFromSaudi"
                    type="date"
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label
                    style={{ display: "flex", justifyContent: "center" }}
                    htmlFor="time"
                    className="block text-sm font-medium text-gray-700"
                  >
                    توقيت المغادرة
                  </label>
                  <input
                    type="time"
                    id="time"
                    value={timeDeparature}
                    onChange={handleTimeChange}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleCloseDeparatureModal}
              className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              اغلاق
            </button>

            <button
              onClick={handleSubmit}
              className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              تحديث
            </button>
          </Box>
        </Modal>
        <Modal open={openStatusModal} onClose={handleCloseStatusModal}>
          <Box 
            sx={{
              // zIndex:9,
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
            <h2 className={Style["almarai-bold"]}>تحديث/اضافة حالة العاملة</h2>
            <TextField
              fullWidth
              placeholder="حالة العاملة"
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
        <Modal open={openEditModal} onClose={handleCloseEditModal}>
          <div>
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
                تعديل بيانات
              </h2>

              <div>
                {/* <Typography>Ordex : {newHomeMaid.id}</Typography> */}
                <Typography>اسم العاملة : {newHomeMaid?.Name}</Typography>
                <Typography>رقم العاملة : {newHomeMaid?.id}</Typography>

                <div className="mb-4">
                  <label className="block text-gray-700">تاريخ التسكين</label>
                  <input
                    type="date"
                    value={houseentrydate}
                    onChange={(e) => sethouseentrydate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    // placeholder="أدخل اسمك"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700">تاريخ الاستلام</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveyDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    // placeholder="أدخل اسمك"
                  />
                </div>

                <div className="mb-4 hidden">
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
                    <option value="مشكلة مكتب العمل">مشكلة مكتب العمل</option>
                    <option value="رفض العمل للسفر">رفض العامل للسفر</option>
                    <option value="رفض العم لنقل الكفالة">
                      رفض العامل لنقل الكفالة
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
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCloseEditModal}
                >
                  إلغاء
                </Button>
                {/* <button > تسجيل </button> */}
                <span>{error}</span>
              </div>
            </Box>
          </div>
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
                  label="رقم العاملة"
                  value={idQuery}
                  onChange={(e) => setIdQuery(e.target.value)}
                  margin="normal"
                />

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

                {findResults && (
                  <div
                    id="dropdown"
                    className=" left-0 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-md "
                  >
                    <ul>
                      {results.map((e) => (
                        <li
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => newSearchedHomeMaid(e)}
                        >
                          {e.Name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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
                    {/* <Typography>Ordex : {newHomeMaid.id}</Typography> */}
                    <Typography>اسم العاملة : {newHomeMaid.Name}</Typography>
                    <Typography>رقم العاملة : {newHomeMaid.id}</Typography>

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

                    <div className="mb-4 hidden">
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
                        <option value="رفض العمل للسفر">
                          رفض العامل للسفر
                        </option>
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

                    <div></div>
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

           <ErrorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        errorMessage={errorModalMessage}
        title={"خطأ"}
      />
        {loadingScreen && (
          <Modal open={loadingScreen}>
            <Box>
              <div className="fixed inset-0  opacity-50 flex items-center justify-center bg-white z-1000">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            </Box>
          </Modal>
        )}
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
