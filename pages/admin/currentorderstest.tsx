import { BookFilled } from "@ant-design/icons";
import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback, useRef } from "react";
import jwt from "jsonwebtoken";
import { Button } from "@mui/material";
import axios from "axios";

import * as XLSX from "xlsx";
import { Formik, Field, Form, ErrorMessage, FormikValues } from "formik";
import * as Yup from "yup"; // Import Yup for validation
import FormWithTimeline from "./addneworderbyadmin";
import TimeLinedForm from "example/components/stepsform";
import Modal from "components/modal";
import RejectBooking from "./reject-booking";
import SpinnerModal from "components/spinner";
import { DotLoader, GridLoader } from "react-spinners";
import Style from "styles/Home.module.css";
import prisma from "pages/api/globalprisma";
export default function Table({ offices }) {
  // console.log(offices);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [date, setDate] = useState("");
  const showSuccessModal = () => {
    setModalMessage("تم تسجيل البيانات بنجاح");
    setModalType("success");
    setIsModalOpen(true);
  };
  // console.log(Yup.reach("name"));
  const showErrorModal = (res) => {
    setModalMessage(res);
    setModalType("error");
    setIsModalOpen(true);
  };

  const closeSuccessfulModal = () => {
    setIsModalOpen(false);
  };
  const [page, setPage] = useState(1);
  const loaderRef = useRef(null);
  const [phone, setPhone] = useState("");
  // const [address, setAddress] = useState("");
  // const [city, setCity] = useState("");
  const [spinned, setSpinned] = useState(false);
  const [pagesCount, setPagesCount] = useState(1);
  const [searchParam, setSearchParam] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  // const [email, setEmail] = useState("");

  const nationalities = [
    { id: 1, nationality: "فحص طبي" },
    { id: 2, nationality: "خلو سوابق" },

    { id: 3, nationality: "موافقة مكتب العمل في دولة الاستقدام" },
    { id: 4, nationality: "تفويض " },

    { id: 5, nationality: "داخل السفارة" },
    { id: 6, nationality: "تم التفييز" },
    { id: 7, nationality: "استلام الجواز في السفارة" },
    // ,{},{}
  ];

  //  <option value="فحص طبي"></option>
  //               <option value="خلو سوابق">خلو سوابق</option>
  //               <option value="موافقة مكتب العمل في دولة الاستقدام">
  //                 موافقة مكتب العمل في دولة الاستقدام
  //               </option>
  //               <option value="تفويض">تفويض</option>
  //               <option value="داخل السفارة">داخل السفارة</option>
  //               <option value="تم التفييز">تم التفييز</option>
  //               <option value="استلام الجواز في السفارة">
  //                 استلام الجواز في السفارة
  //               </option>
  //               <option value="تصريح السفر">تصريح السفر</option>
  //               <option value="الحجز">الحجز</option>
  //               <option value="موعد الوصول">موعد الوصول</option>

  const [phonenumber, setPhoneNumber] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState({
    Name: "",
    Passportnumber: "",
    Picture: [{ url: "" }],
  });
  const [picture, setPicture] = useState({});
  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const fetchdata = async (id) => {
    const fetchData = await fetch("/api/findcvprisma/" + id, {
      cache: "default",
    });
    const parser = await fetchData.json();
    console.log(parser);
    setFilteredSuggestions(parser);
  };
  const handleChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    if (value.length > 0) {
      fetchdata(event.target.value);
    } else {
      setFilteredSuggestions({});
    }
  };
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [ClientPhone, setClientPhone] = useState("");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  const validationSchemaStep1 = Yup.object({
    name: Yup.string().required("Name is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    phone: Yup.string().required("Phone number is required"),
  });

  const validationSchemaStep2 = Yup.object({
    city: Yup.string().required("City is required"),
  });

  const validationSchemaStep3 = Yup.object({
    query: Yup.string(),
  });

  const handleExitClick = () => {
    setModalOpen(false);
  };
  const [filters, setFilters] = useState({
    externalOfficeStatus: "",
    ClientName: "",
    externaloffice: "",
    age: "",
    InternalmusanedContract: "",
    clientphonenumber: "",
    Passportnumber: "",
    Nationality: "",
    HomemaidId: "",
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state
  const [hasMore, setHasMore] = useState(true); // To check if there is more data to load
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown visibility

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleFilterSelection = (value) => {
    handleFilterChange(value, "externalOfficeStatus");
  };

  const pageRef = useRef(1); // Use a ref to keep track of the current page number
  const isFetchingRef = useRef(false); // Ref to track whether data is being fetched
  const [exStatus, setexStatus] = useState("");
  // Fetch data with pagination
  const fetchData = async (value) => {
    if (isFetchingRef.current || !hasMore) return; // Prevent duplicate fetches if already loading
    isFetchingRef.current = true;
    setLoading(true);

    try {
      // Build the query string for filters
      const queryParams = new URLSearchParams({
        searchTerm: filters.ClientName,
        age: filters.age,
        office: filters.externaloffice,
        externalOfficeStatus: value ? value : exStatus,
        InternalmusanedContract: filters.InternalmusanedContract,
        clientphonenumber: filters.clientphonenumber,
        HomemaidId: filters.HomemaidId,
        Passportnumber: filters.Passportnumber,
        Nationalitycopy: filters.Nationality,
        page: String(pageRef.current),
      });

      const response = await fetch(`/api/currentordersprisma?${queryParams}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "get",
      });

      const res = await response.json();
      if (res && res.length > 0) {
        setData((prevData) => [...prevData, ...res]); // Append new data
        pageRef.current += 1; // Increment page using ref
      } else {
        setHasMore(false); // No more data to load
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Use a callback to call fetchData when the user reaches the bottom
  const loadMoreRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading || !hasMore) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            fetchData(); // Fetch next page of data
          }
        },
        { threshold: 1.0 }
      );

      if (node) observer.observe(node);

      return () => observer.disconnect();
    },
    [loading, hasMore]
  );

  // useEffect to fetch the first page of data on mount
  useEffect(() => {
    fetchData(""); // Fetch the first page of data
  }, []); // Only run once on mount

  // useEffect to fetch data when filters change
  // useEffect(() => {
  //   // Reset page and data on filter change
  //   pageRef.current = 1;
  //   setData([]);
  //   setHasMore(true);
  //   fetchData();
  // }, [filters]); // Only re-run when filters change
  const handleFilterChangeStatus = (value) => {
    // alert(value, column);
    // const v = value;

    toggleDropdown();

    // setTimeout(() => {
    isFetchingRef.current = false;
    setHasMore(true);
    setData([]);
    pageRef.current = 1;

    fetchData(value);
    // }, 500);
    // console.log(filters);
  };
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

  const router = useRouter();
  const handleUpdate = (id) => {
    router.push("./neworder/" + id);
  };
  const handleAddNewReservation = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentStep(1);
  };
  const [homemaidId, setHomeMaidId] = useState(0);
  const [homemaidName, setHomeMaidName] = useState("");

  const handleNextStep = () => {
    setCurrentStep((prevStep) => prevStep + 1);
  };
  const handleClicker = (id) => {
    const url = "/admin/cvdetails/" + id;
    window.open(url, "_blank");
  };
  const handlePreviousStep = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  const reset = () => {
    setData([]);
    setModalOpen(false);
    // setLoading(true);
    // setPage(1);

    pageRef.current = 1;
    setHasMore(true);
    isFetchingRef.current = false;
    fetchData();
  };

  const initialvalues = {
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    query: "",
  };
  return (
    <Layout>
      <div className="mx-auto p-6 ">
        <div className="flex items-center justify-end p-1">
          <div className="flex">
            <button
              onClick={handleAddNewReservation}
              className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-200"
            >
              <h1 className={Style["almarai-bold"]}>اضافة حجز جديد</h1>
            </button>
          </div>
        </div>

        <h1
          className={`text-left font-medium text-2xl mb-4 ${Style["almarai-bold"]}`}
        >
          الحجوزات الحالية
        </h1>

        {/* Filter Section */}
        <div className="flex justify-between mb-4">
          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.ClientName}
              onChange={(e) => handleFilterChange(e, "ClientName")}
              placeholder="بحث باسم العميل / العاملة"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.Passportnumber}
              onChange={(e) => handleFilterChange(e, "Passportnumber")}
              placeholder="بحث برقم جواز السفر"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <input
              type="text"
              value={filters.clientphonenumber}
              onChange={(e) => handleFilterChange(e, "clientphonenumber")}
              placeholder="بحث برقم الجوال "
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.InternalmusanedContract}
              onChange={(e) => handleFilterChange(e, "InternalmusanedContract")}
              placeholder="بحث برقم مساند"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex-1 px-2">
            {/* <label
              htmlFor="internalmusanedContract"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              اختر المكتب
            </label> */}
            <select
              id="externaloffice"
              name="externaloffice"
              value={filters.externaloffice}
              onChange={(e) => handleFilterChange(e, "externaloffice")}
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="">اختر المكتــب</option>
              {offices.map((e) => (
                <option key={e.id} value={e.office}>
                  {e.office}
                </option>
              ))}
              {/* Add more options as needed */}
            </select>
          </div>

          <div></div>
          <div className="flex-1 px-1">
            <button
              className={
                "text-[#EFF7F9]  bg-[#3D4C73]  text-lg py-2 px-4 rounded-md transition-all duration-300"
              }
              onClick={() => {
                setexStatus("");
                isFetchingRef.current = false;
                setHasMore(true);
                setFilters({
                  externalOfficeStatus: "",
                  InternalmusanedContract: "",
                  age: "",
                  ClientName: "",
                  HomemaidId: "",
                  externaloffice: "",
                  clientphonenumber: "",
                  Nationality: "",
                  Passportnumber: "",
                });
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
              className="text-[#EFF7F9] bg-[#3D4C73] text-lg py-2 px-4 rounded-md transition-all duration-300"
              onClick={() => {
                setexStatus("");
                isFetchingRef.current = false;
                setHasMore(true);
                setData([]);
                pageRef.current = 1;
                fetchData();
              }}
            >
              <h1 className={Style["almarai-bold"]}>بحـث</h1>
            </button>
          </div>
        </div>

        {/* Table */}
        <table className="w-full overflow-x-scroll  border-collapse bg-white shadow-md rounded-md">
          <thead>
            <tr className="bg-yellow-400 text-white">
              <th className="p-3 text-center text-sm font-medium whitespace-nowrap">
                تحديث
              </th>
              <th className="p-3 text-center text-sm font-medium whitespace-nowrap">
                اسم العميل
              </th>
              <th className="p-3 text-center text-sm font-medium whitespace-nowrap">
                اسم العاملة
              </th>
              <th className="p-3 text-center text-sm font-medium whitespace-nowrap">
                رقم عقد مساند
              </th>
              <th className="p-3 text-center text-sm font-medium whitespace-nowrap">
                جوال العميل
              </th>
              <th className="p-3 text-center text-sm font-medium whitespace-nowrap">
                رقم جواز السفر
              </th>
              <th
                style={{
                  // width: "220px",
                  display: "flex",
                  justifyContent: "center",
                }}
                className={`relative p-3 w-[250px] text-center  ${
                  exStatus ? "bg-[#3D4C73]" : null
                } text-sm font-medium whitespace-nowrap`}
              >
                {/* Column header with dropdown */}
                <button
                  style={{
                    padding: "3px",
                    display: "flex",
                    justifyContent: "center",
                  }}
                  onClick={toggleDropdown}
                  className="flex items-center justify-center space-x-1"
                >
                  <span>
                    {" "}
                    {exStatus ? (
                      <h1 className="bg-[#3D4C73] text-center"> {exStatus}</h1>
                    ) : (
                      <h1 className="text-center"> حالة طلب المكتب الخارجي</h1>
                    )}
                  </span>
                  <svg
                    className={`w-4 h-4 transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute mt-4 w-[320px] overflow-y-auto text-gray-800 bg-[#ECC383] shadow-lg rounded-md z-10">
                    <ul className="p-2 text-sm w-full ">
                      <li
                        className="cursor-pointer text-center  hover:bg-gray-100"
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            externalOfficeStatus: "",
                          }));
                          setexStatus("");
                          handleFilterChangeStatus("");
                        }}
                      >
                        الكل
                      </li>
                      {nationalities.map((n) => (
                        <li
                          key={n.id}
                          className="cursor-pointer p-2 text-gray-800 hover:bg-gray-100 border-black m-2 text-ellipsis"
                          onClick={() => {
                            setexStatus(n.nationality);
                            handleFilterChangeStatus(n.nationality);
                          }}
                        >
                          {n.nationality ===
                          "موافقة مكتب العمل في دولة الاستقدام"
                            ? "موافقة مكتب العمل"
                            : n.nationality}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </th>
              <th className="p-3 text-center  w-12   text-sm font-medium whitespace-nowrap">
                المكتب
              </th>
              <th className="p-3 text-center text-sm font-medium whitespace-nowrap">
                الجنسية
              </th>
              {/* <th className="p-3 text-center text-sm font-medium whitespace-nowrap">
                تحديث
              </th> */}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="p-3 text-center text-sm text-gray-500 whitespace-nowrap"
                >
                  No results found
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={item.id}
                  className={`border-t ${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  }`} // Alternating even/odd rows
                >
                  <td
                    onClick={() => router.push("/admin/neworder/" + item.id)}
                    className="p-3 text-center border  
                    hover:bg-gray-400
                    
                    cursor-pointer  text-md font-semibold    whitespace-nowrap"
                  >
                    <h1 className="text-purple-500"> {item.id}</h1>
                  </td>
                  <td className="p-3 text-center  text-md text-gray-600 font-semibold    whitespace-nowrap">
                    {item.ClientName}
                  </td>
                  <td
                    onClick={() =>
                      router.push("/admin/cvdetails/" + item.HomemaidId)
                    }
                    // onClick={() => handleClicker(item?.HomeMaid.id)}
                    className="p-3 text-center text-md cursor-pointer text-gray-700 font-semibold    whitespace-nowrap"
                  >
                    <h1 className="text-purple-500"> {item.Name}</h1>
                  </td>
                  <td className="p-3 text-center text-md text-gray-700 font-semibold    whitespace-nowrap">
                    {item.arrivals[0]?.InternalmusanedContract || null}
                  </td>
                  <td className="p-3 text-center text-md text-gray-700 font-semibold    whitespace-nowrap">
                    {item.clientphonenumber}
                  </td>
                  <td className="p-3 text-center text-md text-gray-700 font-semibold    whitespace-nowrap">
                    {item.Passportnumber}
                  </td>
                  <td className="p-3 text-center text-md items-center text-gray-700 w-12 font-semibold    ">
                    {/* <h1 className="flex flex-wrap text-center items-center"> */}
                    {/* {" "} */}
                    {item.arrivals[0]?.externalOfficeStatus || null}
                    {/* </h1> */}
                  </td>

                  <td className="p-3 text-center text-md  text-gray-700  font-semibold    ">
                    {item.HomeMaid?.officeName
                      ? item.HomeMaid?.officeName
                      : null}
                  </td>

                  <td className="p-3 text-center text-md text-gray-700 font-semibold    ">
                    {item.Nationalitycopy}
                  </td>
                  {/* <td className="p-3 text-center text-md text-gray-700 font-semibold    whitespace-nowrap">
                    <button
                      className="text-[#EFF7F9] bg-[#3D4C73] text-lg py-2 px-4 rounded-md transition-all duration-300"
                      onClick={() => handleUpdate(item.id)}
                    >
                      <h1 className={Style["almarai-bold"]}>تحديث</h1>
                    </button>
                  </td> */}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div
            ref={loadMoreRef} // Use IntersectionObserver to trigger load more
            className="flex justify-center mt-6"
          >
            {loading && (
              <div className="flex justify-center items-center">
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-yellow-600"
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
        {modalOpen && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
            {spinned ? (
              <GridLoader />
            ) : (
              <div className="flex w-full max-w-4xl bg-white shadow-lg rounded-lg">
                {/* Left side: Timeline */}

                <div className="w-1/3 border-r border-gray-200">
                  <div className=" top-4 right-10">
                    <button
                      onClick={handleExitClick}
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
                  </div>

                  <div className="flex flex-col items-center py-8">
                    <div className={`step ${currentStep >= 1 ? "active" : ""}`}>
                      <div className="step-number">1</div>
                      <div className="step-title">Step 1</div>
                    </div>
                    <div className={`step ${currentStep >= 2 ? "active" : ""}`}>
                      <div className="step-number">2</div>
                      <div className="step-title">Step 2</div>
                    </div>
                    <div className={`step ${currentStep >= 3 ? "active" : ""}`}>
                      <div className="step-number">3</div>
                      <div className="step-title">Step 3</div>
                    </div>
                  </div>
                </div>

                {/* Right side: Form */}
                <div className="w-2/3 p-8">
                  <Formik
                    initialValues={initialvalues}
                    validationSchema={
                      currentStep === 1
                        ? validationSchemaStep1
                        : currentStep === 2
                        ? validationSchemaStep2
                        : currentStep === 3
                        ? validationSchemaStep3
                        : null
                    }
                    onSubmit={(values) => {
                      setFullName(values.name);
                      setEmail(values.email);
                      setClientPhone(values.phone);
                      // setAddress(values.address);
                      setCity(values.city);
                      setHomeMaidId(filteredSuggestions.id);

                      setHomeMaidName(filteredSuggestions.Name);
                      console.log(filteredSuggestions);
                      if (currentStep === 4) {
                        const submit = async () => {
                          try {
                            setSpinned(true);
                            const fetchData = await fetch(
                              "/api/submitneworderprisma/",
                              {
                                body: JSON.stringify({
                                  ...values,
                                  ClientName: values.name,
                                  NationalityCopy:
                                    filteredSuggestions.Nationalitycopy,

                                  HomemaidId: filteredSuggestions.id,
                                  Name: filteredSuggestions.Name,
                                  age: filteredSuggestions.age,
                                  clientphonenumber: values.phone,
                                  PhoneNumber: filteredSuggestions.phone,
                                  Passportnumber:
                                    filteredSuggestions.Passportnumber,
                                  maritalstatus:
                                    filteredSuggestions.maritalstatus,
                                  Nationality:
                                    filteredSuggestions.Nationalitycopy,
                                  Religion: filteredSuggestions.Religion,
                                  ExperienceYears:
                                    filteredSuggestions.ExperienceYears,
                                }),
                                method: "post",
                                headers: {
                                  Accept: "application/json",
                                  "Content-Type": "application/json",
                                },
                              }
                            );

                            const data = await fetchData.json();
                            // alert(fetchData.status)
                            if (fetchData.status == 200) {
                              showSuccessModal();
                              setModalOpen(false);
                              setSpinned(false);
                              // setIsModalOpen(false);
                              // reset();
                              router.push("/admin/neworder/" + data.id);
                            } else {
                              setSpinned(false);
                              showErrorModal(data.message);
                            }
                          } catch (error) {
                            setSpinned(false);
                            showErrorModal(error.message);
                          }
                        };

                        // Modal
                        submit();
                        // Handle form submission
                        console.log(values);
                        console.log("Form submitted with values: ", values);
                      } else {
                        handleNextStep();
                      }
                    }}
                  >
                    {({ setFieldValue }) => (
                      <Form>
                        {/* Step 1: Personal Information */}
                        {currentStep === 1 && (
                          <div>
                            <h2 className="text-2xl font-semibold mb-4">
                              Personal Information
                            </h2>
                            <div className="mb-4">
                              <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700"
                              >
                                اسم العميل
                              </label>
                              <Field
                                id="name"
                                name="name"
                                type="text"
                                // onChange={(e) => setName(e.target.value)}
                                className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                                placeholder="ادخل اسم العميل"
                              />
                              <ErrorMessage
                                name="name"
                                component="div"
                                className="text-red-500 text-sm"
                              />
                            </div>
                            <div className="mb-4">
                              <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700"
                              >
                                البريد الالكتروني للعميل
                              </label>
                              <Field
                                id="email"
                                name="email"
                                type="email"
                                className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                                placeholder="ادخل البريد الالكتروني"
                              />
                              <ErrorMessage
                                name="email"
                                component="div"
                                className="text-red-500 text-sm"
                              />
                            </div>
                            <div className="mb-4">
                              <label
                                htmlFor="phone"
                                className="block text-sm font-medium text-gray-700"
                              >
                                جوال العميل
                              </label>
                              <Field
                                id="phone"
                                name="phone"
                                type="tel"
                                className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                                placeholder="ادخل جوال العميل"
                              />
                              <ErrorMessage
                                name="phone"
                                component="div"
                                className="text-red-500 text-sm"
                              />
                            </div>
                          </div>
                        )}

                        {/* Step 2: Address Information */}
                        {currentStep === 2 && (
                          <div>
                            <h2 className="text-2xl font-semibold mb-4">
                              العنوان
                            </h2>

                            <div className="mb-4">
                              <label
                                htmlFor="city"
                                className="block text-sm font-medium text-gray-700"
                              >
                                مدينة العميل
                              </label>
                              <Field
                                id="city"
                                name="city"
                                type="text"
                                className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                                placeholder="اسم المدينة"
                              />
                              <ErrorMessage
                                name="city"
                                component="div"
                                className="text-red-500 text-sm"
                              />
                            </div>
                          </div>
                        )}

                        {/* Step 3: Query Search */}
                        {currentStep === 3 && (
                          <div className="relative w-72 mx-auto">
                            <Field
                              id="query"
                              name="query"
                              type="text"
                              value={query}
                              onChange={(e) => {
                                setFieldValue("query", e.target.value);
                                handleChange(e);
                              }}
                              placeholder="البحث برقم العاملة"
                              className="px-4 py-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <ErrorMessage
                              name="query"
                              component="div"
                              className="text-red-500 text-sm"
                            />
                            <div>
                              <div className="max-w-sm w-full bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl transform transition-all duration-300 ease-in-out hover:scale-105">
                                {/* Image Section */}
                                {/* <img
                                   src="https://via.placeholder.com/400x250"
                                   alt="Info Card"
                                   className="w-full h-48 object-cover"
                                 /> */}

                                {/* Card Content */}
                                <div className="p-6">
                                  {/* Title */}
                                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                                    {filteredSuggestions.Name}
                                  </h2>

                                  {/* Description */}
                                  <h2 className="text-gray-600 text-sm mb-6">
                                    Passport Number :
                                    {filteredSuggestions.Passportnumber}
                                  </h2>

                                  {/* Action Button */}
                                  <button
                                    onClick={() => {
                                      setFieldValue(
                                        "query",
                                        filteredSuggestions.Name
                                      );
                                      setQuery(filteredSuggestions.Name);
                                    }}
                                    className="bg-teal-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-teal-600 hover:shadow-lg focus:outline-none transition-all duration-200 ease-in-out"
                                  >
                                    Confirm
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Step 4: Review & Submit */}
                        {currentStep === 4 && (
                          <div dir="rtl">
                            <h2
                              className="text-2xl font-semibold mb-4"
                              style={{
                                display: "flex",
                                justifyContent: "center",
                              }}
                            >
                              مراجعة الطلب
                            </h2>
                            {/* Client Name : {validationSchemaStep1.json().fields.name.}
                             Client Phone : {validationSchemaStep1.json().fields.phone}
                            
                            اسم العميل
                            Email : {validationSchemaStep1.json().fields.email} */}
                            {/* {fullName}{" "} */}
                            <div className="grid grid-cols-2 gap-4 justify-center">
                              <p className="font-bold col-span-1">اسم العميل</p>
                              <span>{fullName}</span>
                              {/* </div> */}

                              {/* <div className="flex flex-nowrap text-nowrap col-span-1"> */}
                              <p className="font-bold col-span-1">
                                جوال العميل{" "}
                              </p>
                              <span>{ClientPhone}</span>
                              {/* </div> */}
                              {/* <div className="flex flex-nowrap text-nowrap "> */}
                              <p className="font-bold col-span-1">
                                البريد الالكتروني للعميل
                              </p>
                              <span> {email}</span>
                              {/* </div> */}

                              {/* <div className="flex flex-nowrap text-nowrap"> */}
                              <p className="font-bold col-span-1">
                                مدينة العميل
                              </p>
                              <span> {city}</span>
                              {/* </div> */}

                              {/* <div className="flex flex-nowrap text-nowrap"> */}
                              <p className="font-bold col-span-1">
                                اسم العاملة
                              </p>
                              <span> {filteredSuggestions.Name}</span>
                              {/* </div> */}

                              {/* <div className="flex flex-nowrap text-nowrap"> */}
                              <p className="font-bold col-span-1">
                                جواز سفر العاملة
                              </p>
                              <span>{filteredSuggestions.Passportnumber}</span>
                              {/* </div> */}

                              {/* {ClientPhone} : جوال العميل */}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between mt-8">
                          <button
                            type="button"
                            onClick={handlePrevStep}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md"
                          >
                            Previous
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-orange-500  text-white rounded-md"
                          >
                            {currentStep === 4 ? "Submit" : "Next"}
                          </button>
                        </div>
                      </Form>
                    )}
                  </Formik>
                </div>
                <Modal
                  isOpen={isModalOpen}
                  message={modalMessage}
                  type={modalType}
                  onClose={closeSuccessfulModal}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context: NextPageContext) {
  const { req, res } = context;
  try {
    const isAuthenticated = req.cookies.authToken ? true : false;
    console.log(req.cookies.authToken);
    // jwtDecode(req.cookies.)
    if (!isAuthenticated) {
      // Redirect the user to login page before rendering the component
      return {
        redirect: {
          destination: "/admin/login", // Redirect URL
          permanent: false, // Set to true if you want a permanent redirect
        },
      };
    }
    const user = jwt.verify(req.cookies.authToken, "rawaesecret");
    console.log(user);
    const offices = await prisma.offices.findMany();
    // If authenticated, continue with rendering the page
    // const offices = new
    return {
      props: { user, offices }, // Empty object to pass props if needed
    };
  } catch (error) {
    console.log("error");
    return {
      redirect: {
        destination: "/admin/login", // Redirect URL
        permanent: false, // Set to true if you want a permanent redirect
      },
    };
  }
}
