import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";
import * as XLSX from "xlsx";
import debounce from "lodash.debounce";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import FormWithTimeline from "./addneworderbyadmin";
import TimeLinedForm from "example/components/stepsform";
import Modal from "components/modal";
import RejectBooking from "./reject-booking";
import Style from "styles/Home.module.css";
import { FaCalendar, FaFileExcel, FaFilePdf, FaSearch } from "react-icons/fa";
import { ArrowCircleDownIcon, ArrowCircleLeftIcon } from "@heroicons/react/outline";
import { CheckCircleOutlined, EditOutlined, CloseCircleOutlined } from "@ant-design/icons";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [date, setDate] = useState("");
  const showSuccessModal = () => {
    setModalMessage("تم تسجيل البيانات بنجاح");
    setModalType("success");
    setIsModalOpen(true);
  };
  const showErrorModal = () => {
    setModalMessage("خطا في تسجيل البيانات.");
    setModalType("error");
    setIsModalOpen(true);
  };
  const closeSuccessfulModal = () => {
    setIsModalOpen(false);
  };
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [phone, setPhone] = useState("");
  const [searchParam, setSearchParam] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [query, setQuery] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState({
    Name: "",
    Passportnumber: "",
    Picture: [{ url: "" }],
  });
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [ClientPhone, setClientPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [openRowId, setOpenRowId] = useState(null);

  const validationSchemaStep1 = Yup.object({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email address").required("Email is required"),
    phone: Yup.string().required("Phone number is required"),
  });
  const validationSchemaStep2 = Yup.object({
    city: Yup.string().required("City is required"),
  });
  const validationSchemaStep3 = Yup.object({
    query: Yup.string(),
  });

  const debouncedSearch = debounce(async (query, page) => {
  try {
    if (query.length < 1) return reset();
    const response = await axios.get(`/api/currentorders/${page}`);
    setData(response.data.data);
    setTotalPages(response.data.totalPages || 1);
    setLoading(false);
  } catch (error) {
    console.error("Error in search:", error);
    setLoading(false);
  }
}, 500);

  const search = (query) => {
    setSearchParam(query);
    setPage(1);
    debouncedSearch(query);
  };

  const fetchData = async (page) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/currentorders/` + page, { method: "get" });
      const res = await response.json();
      setData(res.data);
      setTotalPages(res.totalPages || 1);
      setLoading(false);
    } catch (error) {
      console.error("Error in fetch:", error);
      setLoading(false);
    }
  };

  const reset = () => {
    setData([]);
    setLoading(true);
    setPage(1);
    setTotalPages(1);
  };

  const fetchdata = async (id) => {
    const fetchData = await fetch("/api/findcvprisma/" + id, { cache: "default" });
    const parser = await fetchData.json();
    setFilteredSuggestions(parser);
  };

  const handleChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    if (value.length > 0) {
      fetchdata(value);
    } else {
      setFilteredSuggestions({});
    }
  };
useEffect(() => {
  if (searchParam) {
    debouncedSearch(searchParam, page);
  } else {
    fetchData(page);
  }
}, [page, searchParam]);
  const confirm = async (HomemaidName, id, date, SponsorName, PassportNumber) => {
    const submitter = await fetch("/api/confirmrequest", {
      method: "post",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ id, SponsorName, PassportNumber, HomemaidName }),
    });
    if (submitter.status === 200) {
      setDate(Date.now());
      setIsModalRejectionOpen(false);
      router.push("/admin/neworder/" + id);
    }
  };

  const router = useRouter();

  const handleUpdate = (id) => {
    setOpenRowId(openRowId === id ? null : id);
  };

  const handleAddNewReservation = () => {
    setModalOpen(true);
  };

  const initialvalues = {
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    query: "",
  };

  const exportToExcel = async () => {
    try {
      const response = await fetch(`/api/neworderlistprisma/` + page, { method: "get" });
      const res = await response.json();
      const filteredData = res.data.map((row) => ({
        "اسم العميل": row.ClientName,
        الدين: row.Religion,
        الخبرة: row.ExperienceYears,
        "جوال العميل": row.clientphonenumber,
        "حالة الحجز": row.bookingstatus,
        "رقم العاملة": row.HomemaidId,
      }));
      const ws = XLSX.utils.json_to_sheet(filteredData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "حجوزات جديدة");
      XLSX.writeFile(wb, "حجوزات جديدة.xlsx");
    } catch (error) {
      console.error("Error in export:", error);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentStep(1);
  };

  const [homemaidId, setHomeMaidId] = useState(0);
  const [homemaidName, setHomeMaidName] = useState("");
  const [reason, setReason] = useState("");
  const [isModalRejectionOpen, setIsModalRejectionOpen] = useState(false);
  const [rejectionmodalNo, setrejectionmodalNo] = useState("");

  const OpenRejectionModal = (id) => {
    setrejectionmodalNo(id);
    setIsModalRejectionOpen(true);
  };

  const handleCancelRejectionModal = () => {
    setrejectionmodalNo("");
    setIsModalRejectionOpen(false);
  };

  const handleReject = async (id) => {
    const submitter = await fetch("/api/rejectbookingprisma", {
      method: "post",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ id, ReasonOfRejection: reason }),
    });
    if (submitter.status === 200) {
      setDate(Date.now());
      setrejectionmodalNo("");
      setData([]);
      setPage(1);
      setIsModalRejectionOpen(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`mx-1 px-3 py-1 rounded-md ${
            page === i ? "bg-teal-700 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex justify-center items-center mt-4">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="mx-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50"
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className="mx-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="space-y-4">
          <div className="overflow-x-auto shadow-lg rounded-lg border border-white-200">
            <div className="flex items-center justify-between p-4">
              <p className={`text-2xl font-bold text-cool-gray-700 ${Style["almarai-bold"]}`}>
                الطلبات الحالية
              </p>
            </div>

<div className="flex flex-col gap-4">
  <div className="flex flex-row flex-nowrap justify-between items-center">
    <div className="flex flex-row flex-nowrap gap-2">
      <div className="relative w-[280px] max-w-md">
        <input
          type="text"
          value={searchParam}
          onChange={(e) => search(e.target.value)}
          placeholder="بحث"
          className="p-2 pl-10 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>
      <div className="relative w-[280px] max-w-md">
        {!searchParam && (
          <span className="absolute right-8 top-2.5 text-gray-400 pointer-events-none text-sm">
            اختر تاريخ البحث
          </span>
        )}
        <input
          type="date"
          value={searchParam}
          onChange={(e) => search(e.target.value)}
          className="p-2 pl-8 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <ArrowCircleLeftIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>
      <div className="relative w-[280px] max-w-md">
        {!searchParam && (
          <span className="absolute right-8 top-2.5 text-gray-400 pointer-events-none text-sm">
            اختر تاريخ البحث
          </span>
        )}
        <input
          type="date"
          value={searchParam}
          onChange={(e) => search(e.target.value)}
          className="p-2 pl-8 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <ArrowCircleLeftIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>
    </div>
    <button className="bg-teal-700 my-2 py-1 px-3 rounded-lg">
      <span className="text-white">إعادة ضبط</span>
    </button>
  </div>
  <div className="flex flex-row gap-2 justify-end">
    <button
      onClick={exportToExcel}
      className="bg-teal-700 my-2 py-1 px-3 rounded-lg flex items-center gap-1 hover:bg-teal-700"
      title="تصدير إلى Excel"
    >
      <FaFileExcel className="text-white" />
      <span className="text-white">Excel</span>
    </button>
    <button
      onClick={() => alert("سيتم إضافة وظيفة تصدير PDF لاحقًا")} // استبدل هذا بوظيفة تصدير PDF إذا كانت متوفرة
      className="bg-teal-700 my-2 py-1 px-3 rounded-lg flex items-center gap-1 hover:bg-teal-700"
      title="تصدير إلى PDF"
    >
      <FaFilePdf className="text-white" />
      <span className="text-white">PDF</span>
    </button>
  </div>
</div>
            <table className="min-w-full text-sm text-left">
              <thead className="bg-teal-700">
                <tr className="text-white bg-teal-700">
                  <th className="px-4 py-2 text-center">رقم الطلب</th>
                  <th className="px-4 py-2 text-center">اسم العميل</th>
                  <th className="px-4 py-2 text-center">رقم العميل</th>
                  <th className="px-4 py-2 text-center">هوية العميل</th>
                  <th className="px-4 py-2 text-center">رقم العاملة</th>
                  <th className="px-4 py-2 text-center">اسم العاملة</th>
                  <th className="px-4 text-center py-2">الجنسية</th>
                  <th className="px-4 text-center py-2">جواز السفر</th>
                  <th className="px-4 text-center py-2">العمر</th>
                  <th className="px-4 text-center py-2">عرض</th>
                  <th className="px-4 text-center py-2">الاجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {data.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr className="border-b">
                      <td className="px-4 py-2 text-lg text-center">{row.id}</td>
                      <td className="px-4 py-2 text-center">{row.ClientName}</td>
                      <td className="px-4 py-2 text-center">{row.clientphonenumber}</td>
                      <td className="px-4 py-2 text-center">{row.nationalId}</td>
                      <td
                        onClick={() => router.push("/admin/cvdetails/" + row.HomemaidId)}
                        className="px-3 py-2 cursor-pointer text-center decoration-black"
                      >
                        {row.HomemaidId}
                      </td>
                      <td className="px-4 text-center py-2">{row?.HomeMaid?.Name}</td>
                      <td className="px-4 text-center py-2">{row?.HomeMaid?.Nationality}</td>
                      <td className="px-4 text-center py-2">{row?.HomeMaid?.Passportnumber}</td>
                      <td className="px-4 text-center py-2">{row.age}</td>
                      <td className="px-4 text-center flex justify-around py-2">
                        <ArrowCircleDownIcon
                          className="w-5 h-5 text-teal-700 cursor-pointer"
                          onClick={() => handleUpdate(row.id)}
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex justify-center space-x-2">
                          <EditOutlined className="w-5 h-5  cursor-pointer" onClick={() => router.push("/admin/neworder/" + row.id)} />
                          <CheckCircleOutlined
                            className="w-5 h-5 cursor-pointer text-green-600"
                            onClick={() =>
                              confirm(
                                row?.HomeMaid?.Name,
                                row.id,
                                Date.now(),
                                row.ClientName,
                                row.HomeMaid.Passportnumber
                              )
                            }
                          />
                          <CloseCircleOutlined
                            className="w-5 h-5 cursor-pointer text-red-600"
                            onClick={() => OpenRejectionModal(row.id)}
                          />
                        </div>
                      </td>
                    </tr>
                    {openRowId === row.id && (
                      <tr>
                        <td colSpan={11} className="p-4 bg-gray-50">
                          <table className="min-w-full text-sm text-left border border-gray-200">
                            <thead className="bg-gray-300 text-white">
                              <tr>
                                <th className="px-4 py-2 text-center">العملية</th>
                                <th className="px-4 py-2 text-center">التاريخ</th>
                                <th className="px-4 py-2 text-center">المستخدم</th>
                                <th className="px-4 py-2 text-center">الوصف</th>
                                <th className="px-4 py-2 text-center">السبب</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="px-4 py-2 text-center">{row.Religion || "غير متوفر"}</td>
                                <td className="px-4 py-2 text-center">{row.ExperienceYears || "غير متوفر"}</td>
                                <td className="px-4 py-2 text-center">{row.bookingstatus || "غير متوفر"}</td>
                                <td className="px-4 py-2 text-center">{row.bookingstatus || "غير متوفر"}</td>
                                <td className="px-4 py-2 text-center">{row.bookingstatus || "غير متوفر"}</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {loading ? (
            <div className="text-center">
              <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-t-transparent border-gray-800 rounded-full"></div>
            </div>
          ) : (
            renderPagination()
          )}
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="flex w-full max-w-4xl bg-white shadow-lg rounded-lg">
            <div className="w-1/3 border-r border-gray-200">
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
                  setCity(values.city);
                  setHomeMaidId(filteredSuggestions.id);
                  setHomeMaidName(filteredSuggestions.Name);
                  if (currentStep === 4) {
                    const submit = async () => {
                      const fetchData = await fetch("/api/submitneworderprisma/", {
                        body: JSON.stringify({
                          ...values,
                          ClientName: values.name,
                          NationalityCopy: filteredSuggestions.Nationalitycopy,
                          HomemaidId: filteredSuggestions.id,
                          Name: filteredSuggestions.Name,
                          age: filteredSuggestions.age,
                          clientphonenumber: values.phone,
                          PhoneNumber: filteredSuggestions.phone,
                          Passportnumber: filteredSuggestions.Passportnumber,
                          maritalstatus: filteredSuggestions.maritalstatus,
                          Nationality: filteredSuggestions.Nationalitycopy,
                          Religion: filteredSuggestions.Religion,
                          ExperienceYears: filteredSuggestions.ExperienceYears,
                        }),
                        method: "post",
                        headers: { Accept: "application/json", "Content-Type": "application/json" },
                      });
                      if (fetchData.status === 200) {
                        showSuccessModal();
                        setModalOpen(false);
                        reset();
                      } else {
                        showErrorModal();
                      }
                    };
                    submit();
                  } else {
                    setCurrentStep((prevStep) => prevStep + 1);
                  }
                }}
              >
                {({ setFieldValue }) => (
                  <Form>
                    {currentStep === 1 && (
                      <div>
                        <h2 className="text-2xl font-semibold mb-4">Personal Information</h2>
                        <div className="mb-4">
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Client Name
                          </label>
                          <Field
                            id="name"
                            name="name"
                            type="text"
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                            placeholder="Enter your name"
                          />
                          <ErrorMessage name="name" component="div" className="text-red-500 text-sm" />
                        </div>
                        <div className="mb-4">
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <Field
                            id="email"
                            name="email"
                            type="email"
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                            placeholder="Enter your email"
                          />
                          <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
                        </div>
                        <div className="mb-4">
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone Number
                          </label>
                          <Field
                            id="phone"
                            name="phone"
                            type="tel"
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                            placeholder="Client Phone Number"
                          />
                          <ErrorMessage name="phone" component="div" className="text-red-500 text-sm" />
                        </div>
                      </div>
                    )}
                    {currentStep === 2 && (
                      <div>
                        <h2 className="text-2xl font-semibold mb-4">Address Information</h2>
                        <div className="mb-4">
                          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                            City
                          </label>
                          <Field
                            id="city"
                            name="city"
                            type="text"
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                            placeholder="Enter your city"
                          />
                          <ErrorMessage name="city" component="div" className="text-red-500 text-sm" />
                        </div>
                      </div>
                    )}
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
                          placeholder="Search "
                          className="px-4 py-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <ErrorMessage name="query" component="div" className="text-red-500 text-sm" />
                        <div>
                          <div className="max-w-sm w-full bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl transform transition-all duration-300 ease-in-out hover:scale-105">
                            <div className="p-6">
                              <h2 className="text-2xl font-semibold text-gray-800 mb-4">{filteredSuggestions.Name}</h2>
                              <h2 className="text-gray-600 text-sm mb-6">Passport Number: {filteredSuggestions.Passportnumber}</h2>
                              <button
                                onClick={() => {
                                  setFieldValue("query", filteredSuggestions.Name);
                                  setQuery(filteredSuggestions.Name);
                                }}
                                className="bg-teal-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-teal-700 hover:shadow-lg focus:outline-none transition-all duration-200 ease-in-out"
                              >
                                Confirm
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {currentStep === 4 && (
                      <div>
                        <h2 className="text-2xl font-semibold mb-4">مراجعة الطلب</h2>
                        <div className="flex flex-nowrap text-nowrap">
                          <p className="font-bold">Full Name: </p>
                          <span>&nbsp;{fullName}</span>
                        </div>
                        <div className="flex flex-nowrap text-nowrap">
                          <p className="font-bold">Client Phone: </p>
                          <span>&nbsp;{ClientPhone}</span>
                        </div>
                        <div className="flex flex-nowrap text-nowrap">
                          <p className="font-bold">Email Address: </p>
                          <span>&nbsp;{email}</span>
                        </div>
                        <div className="flex flex-nowrap text-nowrap">
                          <p className="font-bold">Address: </p>
                          <span>&nbsp;{address}</span>
                        </div>
                        <div className="flex flex-nowrap text-nowrap">
                          <p className="font-bold">City: </p>
                          <span>&nbsp;{city}</span>
                        </div>
                        <div className="flex flex-nowrap text-nowrap">
                          <p className="font-bold">Name: </p>
                          <span>&nbsp;{filteredSuggestions.Name}</span>
                        </div>
                        <div className="flex flex-nowrap text-nowrap">
                          <p className="font-bold">Passport Number: </p>
                          <span>&nbsp;{filteredSuggestions.Passportnumber}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between mt-8">
                      <button
                        type="button"
                        onClick={() => setCurrentStep((prev) => prev - 1)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md"
                      >
                        Previous
                      </button>
                      <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-md">
                        {currentStep === 4 ? "Submit" : "Next"}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
            <Modal isOpen={isModalOpen} message={modalMessage} type={modalType} onClose={closeSuccessfulModal} />
          </div>
        </div>
      )}
      {isModalRejectionOpen && (
        <RejectBooking
          isOpen={isModalRejectionOpen}
          onClose={handleCancelRejectionModal}
          onReject={() => handleReject(rejectionmodalNo)}
          reason={reason}
          setReason={setReason}
        />
      )}
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const { req } = context;
  try {
    const isAuthenticated = req.cookies.authToken ? true : false;
    if (!isAuthenticated) {
      return {
        redirect: { destination: "/admin/login", permanent: false },
      };
    }
    const user = jwt.verify(req.cookies.authToken, "rawaesecret");
    return { props: { user } };
  } catch (error) {
    return {
      redirect: { destination: "/admin/login", permanent: false },
    };
  }
}