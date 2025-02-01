//@ts-nocheck
//@ts-ignore

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";
import * as XLSX from "xlsx";
import debounce from "lodash.debounce";
import { Formik, Field, Form, ErrorMessage, FormikValues } from "formik";
import * as Yup from "yup"; // Import Yup for validation
import FormWithTimeline from "./addneworderbyadmin";
import TimeLinedForm from "example/components/stepsform";
import Modal from "components/modal";
import RejectBooking from "./reject-booking";
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
  // console.log(Yup.reach("name"));
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
  const loaderRef = useRef(null);
  const [phone, setPhone] = useState("");
  // const [address, setAddress] = useState("");
  // const [city, setCity] = useState("");

  const [pagesCount, setPagesCount] = useState(1);
  const [searchParam, setSearchParam] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  // const [email, setEmail] = useState("");
  const [phonenumber, setPhoneNumber] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState({
    Name: "",
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
    address: Yup.string().required("Address is required"),
    city: Yup.string().required("City is required"),
  });

  const validationSchemaStep3 = Yup.object({
    query: Yup.string(),
  });

  // Debounced search function
  const debouncedSearch = debounce(async (query) => {
    try {
      if (query.length < 1) return reset();
      const response = await axios.get(`/api/searchneworder/` + query);
      setPagesCount(1);
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error in search:", error);
    }
  }, 500);

  const search = (query) => {
    setSearchParam(query);
    debouncedSearch(query);
  };

  const fetchData = async (page) => {
    // alert(page);
    try {
      // if (1 > data.length > 0) return;
      setLoading(true);
      const response = await fetch(`/api/neworderlistprisma/` + page, {
        method: "get",
      });

      const res = await response.json();
      // setPagesCount(1);
      // console.log(res);
      // setData();
      console.log(res.data);
      // if(res.data.length <1 ) return setLoading
      setData((prevData) => [...prevData, ...res.data]); // Append new data
      if (res.data.length < 10) return setLoading(false);
    } catch (error) {
      console.error("Error in search:", error);
    }
  };

  const reset = () => {
    setData([]);
    setLoading(true);
    setPage(1);
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);
  const confirm = async (
    id,
    date,
    SponsorName,
    PassportNumber,
    HomemaidName
  ) => {
    const submitter = await fetch("/api/confirmrequest", {
      method: "post",
      headers: {
        Accept: "application/json",

        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        SponsorName,
        PassportNumber,
        HomemaidName,
        // createdAt: date,
      }),
    });

    // alert(submitter.status);
    if (submitter.status == 200) {
      // alert(submitter.status);
      setDate(Date.now());
      // alert("confirmed");

      setIsModalRejectionOpen(false); // Close the modal after rejection
      router.push("/admin/neworder/" + id);
    }
  };

  // useCallback
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && loading) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { threshold: 1.0 }
    );

    const currentLoaderRef = loaderRef.current;
    if (currentLoaderRef) {
      observer.observe(currentLoaderRef);
    }

    // Cleanup observer when component unmounts or loaderRef changes
    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef);
      }
    };
  }, [loading]);

  const handleEscKey = useCallback((e) => {
    if (e.key === "Escape") {
      closeModal(); // Close the modal
    }
  }, []); // This function doesn't depend on any external state, so [] is safe.

  useEffect(() => {
    // Add event listener on mount
    window.addEventListener("keydown", handleEscKey);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [handleEscKey]); // We depend on the stable `handleEscKey` function to avoid unnecessary re-renders.

  const router = useRouter();

  const handleUpdate = (id) => {
    router.push("./neworder/" + id);
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
  const [excelData, setExcelData] = useState([]);
  const exportToExcel = async () => {
    try {
      const response = await fetch(`/api/neworderlistprisma/`, {
        method: "get",
      });

      const res = await response.json();

      const filteredData = res.map((row) => ({
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
      console.error("Error in search:", error);
    }
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

  const handlePreviousStep = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  // Validation Schema for Formik using Yup
  const validationSchema = Yup.object({
    clientName: Yup.string().required("Client Name is required"),
    phoneNumber: Yup.string()
      .required("Phone Number is required")
      .matches(/^[0-9]{10}$/, "Phone Number must be 10 digits"),
    religion: Yup.string().required("Religion is required"),
  });
  const [reason, setReason] = useState("");
  const [isModalRejectionOpen, setIsModalRejectionOpen] = useState(false);
  const [rejectionmodalNo, setrejectionmodalNo] = useState("");
  const OpenRejectionModal = (id) => {
    setrejectionmodalNo(id);
    setIsModalRejectionOpen(true);
  }; // Function to open the modal
  const handleCancelRejectionModal = () => {
    setrejectionmodalNo("");
    setIsModalRejectionOpen(false); // Function to close the modal
  };
  const handleReject = async (id) => {
    alert(id);
    const submitter = await fetch("/api/rejectbookingprisma", {
      method: "post",
      headers: {
        Accept: "application/json",

        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        ReasonOfRejection: reason,
      }),
    });

    // alert(submitter.status);
    if (submitter.status == 200) {
      // alert(submitter.status);
      setDate(Date.now());
      setrejectionmodalNo("");
      setData([]);
      setPage(0);
      setIsModalRejectionOpen(false); // Close the modal after rejection
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="mb-4 flex justify-between items-center">
          <input
            type="text"
            value={searchParam}
            onChange={(e) => search(e.target.value)}
            placeholder="بحث"
            className="p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="space-y-4">
          <div className="overflow-x-auto shadow-lg rounded-lg border border-white-200">
            <div className="flex items-center justify-between p-4">
              <p className="text-2xl font-bold text-cool-gray-700">
                حجوزات جديدة
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleAddNewReservation}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-400"
                >
                  Add New Reservation
                </button>

                <button
                  onClick={exportToExcel}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                >
                  Export to Excel
                </button>
              </div>
            </div>

            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">م</th>
                  <th className="px-4 py-2">اسم العميل</th>
                  <th className="px-4 py-2">جوال العميل</th>
                  <th className="px-4 py-2">رقم الخادمة</th>
                  {/* <th className="px-4 py-2">ديانة العاملة</th> */}
                  <th className="px-4 py-2">الخبرة</th>
                  <th className="px-4 py-2">العمر</th>
                  <th className="px-4 py-2">موافق</th>
                  <th className="px-4 py-2">رفض</th>
                  {/* <th className="px-4 py-2"></th> */}
                </tr>
              </thead>
              <tbody className="bg-white">
                {data.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b hover:bg-gray-300 cursor-pointer"
                  >
                    <td className="px-4 py-2 text-lg">{row.id}</td>
                    <td className="px-4 py-2">{row.ClientName}</td>
                    <td className="px-4 py-2">{row.clientphonenumber}</td>
                    <td
                      onClick={() =>
                        router.push("/admin/cvdetails/" + HomemaidId)
                      }
                      className="px-3 py-2 cursor-pointer decoration-black"
                    >
                      {row.HomemaidId}
                    </td>
                    {/* <td className="px-4 py-2">{row.Religion}</td> */}
                    <td className="px-4 py-2">{row.ExperienceYears}</td>
                    <td className="px-4 py-2">{row.age}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() =>
                          confirm(
                            row.id,
                            row.createdAt,
                            row.ClientName,
                            row.PassportNumber,
                            row.Name
                          )
                        }
                        className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 active:bg-green-700 transition-all duration-200"
                      >
                        موافقة
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <div className="container mx-auto p-4">
                        {/* Trigger button to open modal */}
                        <button
                          onClick={() => OpenRejectionModal(row.id)} // This is now correctly passed as a prop
                          className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                        >
                          رفض الطلب
                        </button>

                        {/* Modal Section */}
                        {rejectionmodalNo == row.id && (
                          <div className="fixed inset-0  bg-opacity-75 flex justify-center items-center z-50">
                            <div className="bg-white rounded-lg shadow-lg p-6 space-y-6 w-96">
                              <h1 className="text-2xl font-semibold text-gray-800">
                                رفض طلب العميل
                              </h1>

                              {/* Booking Details Section */}
                              <div className="border-b pb-4">
                                <p className="text-gray-600">
                                  رقم الحجز: <strong>{row.id}</strong>
                                </p>
                                <p className="text-gray-600">
                                  اسم العميل: <strong>{row.ClientName}</strong>
                                </p>
                                <p className="text-gray-600">
                                  تاريخ الحجز: <strong>{row.createdAt}</strong>
                                </p>
                                <p className="text-gray-600">
                                  حالة الحجز:{" "}
                                  <span className="text-red-500">
                                    {row.bookingstatus}
                                  </span>
                                </p>
                              </div>

                              {/* Reason for rejection (Text Area instead of select) */}
                              <div>
                                <label
                                  htmlFor="reason"
                                  className="block text-gray-700 font-medium mb-2"
                                >
                                  سبب الرفض
                                </label>
                                <textarea
                                  id="reason"
                                  name="reason"
                                  value={reason}
                                  onChange={(e) => setReason(e.target.value)}
                                  placeholder="سبب الرفض..."
                                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  rows={4} // Adjust the number of rows as needed
                                />
                              </div>

                              {/* Buttons */}
                              <div className="flex justify-end gap-4">
                                <button
                                  onClick={handleCancelRejectionModal}
                                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                  اغلاق
                                </button>
                                <button
                                  onClick={() => handleReject(row.id)}
                                  disabled={!reason}
                                  className={`px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 ${
                                    reason
                                      ? "bg-red-500 hover:bg-red-600 focus:ring-red-500"
                                      : "bg-gray-400 cursor-not-allowed"
                                  }`}
                                >
                                  تأكيد
                                </button>
                              </div>

                              {/* Close modal when clicked outside */}
                              <div />
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div ref={loaderRef} className="text-center">
            {loading ? (
              <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-t-transparent border-gray-800 rounded-full"></div>
            ) : (
              <p className="text-gray-500">No more Data to load</p>
            )}
          </div>
        </div>
      </div>
      {/* Modal with Step Form */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="flex w-full max-w-4xl bg-white shadow-lg rounded-lg">
            {/* Left side: Timeline */}
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
                  console.log(values);

                  setFullName(values.name);
                  setEmail(values.email);
                  setClientPhone(values.phone);
                  setAddress(values.address);
                  setCity(values.city);
                  setHomeMaidId(filteredSuggestions.id);

                  setHomeMaidName(filteredSuggestions.Name);
                  console.log(filteredSuggestions);
                  if (currentStep === 4) {
                    console.log({
                      ...values,
                      email: values.email,

                      PhoneNumber: filteredSuggestions.phone
                        ? filteredSuggestions.phone
                        : "لا يوجد هاتف مسجل",
                      HomemaidId: filteredSuggestions.id,
                      age: filteredSuggestions.age,
                      clientphonenumber: values.phone,
                      Passportnumber: filteredSuggestions.Passportnumber,
                      maritalstatus: filteredSuggestions.maritalstatus,
                      NationalityCopy: filteredSuggestions.Nationality,
                      Religion: filteredSuggestions.Religion,
                      ExperienceYears: filteredSuggestions.ExperienceYears,
                    });
                    const submit = async () => {
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
                            Passportnumber: filteredSuggestions.Passportnumber,
                            maritalstatus: filteredSuggestions.maritalstatus,
                            Nationality: filteredSuggestions.Nationalitycopy,
                            Religion: filteredSuggestions.Religion,
                            ExperienceYears:
                              filteredSuggestions.ExperienceYears,
                          }),
                          method: "post",
                          headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                          },
                          cache: "default",
                        }
                      );

                      if (fetchData.status == 200) {
                        showSuccessModal();
                        reset();
                      } else {
                        showErrorModal();
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
                            Client Name
                          </label>
                          <Field
                            id="name"
                            name="name"
                            type="text"
                            // onChange={(e) => setName(e.target.value)}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                            placeholder="Enter your name"
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
                            Email
                          </label>
                          <Field
                            id="email"
                            name="email"
                            type="email"
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                            placeholder="Enter your email"
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
                            Phone Number
                          </label>
                          <Field
                            id="phone"
                            name="phone"
                            type="tel"
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                            placeholder="Client Phone Number"
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
                          Address Information
                        </h2>
                        <div className="mb-4">
                          <label
                            htmlFor="address"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Address
                          </label>
                          <Field
                            id="address"
                            name="address"
                            type="text"
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                            placeholder="Enter your address"
                          />
                          <ErrorMessage
                            name="address"
                            component="div"
                            className="text-red-500 text-sm"
                          />
                        </div>
                        <div className="mb-4">
                          <label
                            htmlFor="city"
                            className="block text-sm font-medium text-gray-700"
                          >
                            City
                          </label>
                          <Field
                            id="city"
                            name="city"
                            type="text"
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                            placeholder="Enter your city"
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
                          placeholder="Search "
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
                      <div>
                        <h2 className="text-2xl font-semibold mb-4">
                          مراجعة الطلب
                        </h2>
                        {/* Client Name : {validationSchemaStep1.json().fields.name.}
                             Client Phone : {validationSchemaStep1.json().fields.phone}
                            
                            اسم العميل
                            Email : {validationSchemaStep1.json().fields.email} */}
                        {/* {fullName}{" "} */}
                        <div className="flex flex-nowrap text-nowrap">
                          <p className="font-bold ">
                            Full Name &nbsp; &nbsp; :
                          </p>
                          <span>&nbsp;{fullName}</span>
                        </div>

                        <div className="flex flex-nowrap text-nowrap">
                          <p className="font-bold">Client Phone :</p>
                          <span>&nbsp;{ClientPhone}</span>
                        </div>
                        <div className="flex flex-nowrap text-nowrap">
                          <p className="font-bold"> Email Adress :</p>
                          <span>&nbsp; {email}</span>
                        </div>

                        <div className="flex flex-nowrap text-nowrap">
                          <p className="font-bold">
                            Address &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;:
                          </p>
                          <span>&nbsp; {address}</span>
                        </div>

                        <div className="flex flex-nowrap text-nowrap">
                          <p className="font-bold">
                            City &nbsp; &nbsp; &nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; :
                          </p>
                          <span>&nbsp; {city}</span>
                        </div>

                        {/* {ClientPhone} : جوال العميل */}
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
        </div>
      )}
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
    // If authenticated, continue with rendering the page
    return {
      props: { user }, // Empty object to pass props if needed
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
