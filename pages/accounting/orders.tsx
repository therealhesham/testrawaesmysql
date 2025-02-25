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
import TimeLinedForm from "example/components/stepsform";
import Modal from "components/modal";
import SpinnerModal from "components/spinner";
import { DotLoader, GridLoader } from "react-spinners";
import Style from "styles/Home.module.css";
import prisma from "pages/api/globalprisma";
import { CurrencyDollarIcon } from "@heroicons/react/outline";
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

      const response = await fetch(
        `/api/currentordersprismaforaccounant?${queryParams}`,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          method: "get",
        }
      );

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
        <table className="w-full overflow-x-scroll border-collapse bg-white shadow-md rounded-md">
          <thead>
            <tr className="bg-yellow-400 text-white">
              <th className="p-3 text-center text-sm font-medium whitespace-nowrap">
                رقم مساند
              </th>

              <th className="p-3 text-center text-sm font-medium whitespace-nowrap">
                اسم العميل
              </th>
              <th className="p-3 text-center text-sm font-medium whitespace-nowrap">
                اسم العاملة
              </th>
              <th className="p-3 text-center text-sm font-medium whitespace-nowrap">
                جوال العميل
              </th>
              <th className="p-3 text-center text-sm font-medium whitespace-nowrap">
                رقم جواز السفر
              </th>

              <th className="p-3 text-center  w-12   text-sm font-medium whitespace-nowrap">
                المكتب
              </th>
              <th className="p-3 text-center text-sm font-medium whitespace-nowrap">
                الجنسية
              </th>

              <th className="p-3 text-center text-sm font-medium whitespace-nowrap">
                عرض فاتورة
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
                  <td className="p-3 text-center  text-md text-gray-600 font-semibold    whitespace-nowrap">
                    {item.arrivals[0]?.InternalmusanedContract || null}
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
                    {item.clientphonenumber}
                  </td>
                  <td className="p-3 text-center text-md text-gray-700 font-semibold    whitespace-nowrap">
                    {item.Passportnumber}
                  </td>

                  <td className="p-3 text-center text-md  text-gray-700  font-semibold    ">
                    {item.HomeMaid?.officeName
                      ? item.HomeMaid?.officeName
                      : null}
                  </td>

                  <td className="p-3 text-center text-md text-gray-700 font-semibold    ">
                    {item.Nationalitycopy}
                  </td>

                  <td className="p-3 text-center text-md text-gray-700 font-semibold    ">
                    <span>
                      <button
                        onClick={() =>
                          router.push(
                            "/accounting/invoicedetails?client=" +
                              item.clientID +
                              "&" +
                              "homemaidId=" +
                              item.id
                          )
                        }
                        className="py-2 px-4  text-white font-semibold rounded-md bg-orange-300 hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 col-span-3"
                      >
                        عرض
                      </button>
                    </span>
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
