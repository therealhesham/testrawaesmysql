import { useCallback, useEffect, useRef, useState } from "react";
import Layout from "example/containers/Layout";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import SuccessModal from "office/components/successcoponent";
import Modal from "components/modal";
const TransferPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [data, setData] = useState([]);

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
  // Define Yup Validation Schema
  const validationSchema = Yup.object({
    client: Yup.string().optional("اسم العميل القديم مطلوب"),
    mobilenumber: Yup.string()
      .matches(/^\d+$/, "Mobile number must contain only digits")
      .optional("Mobile number is optional"),
    nationalidnumber: Yup.string().optional("National ID is optional"),
    passportnumber: Yup.string().optional("Passport number is optional"),
    homemaid: Yup.string().optional("Home maid name is optional"),
    nationality: Yup.string().optional("Nationality is optional"),
    kingdomentrydate: Yup.date().optional("Kingdom entry date is optional"),
    daydate: Yup.date().optional("Day date is optional"),
    workduration: Yup.number()
      .positive("Work duration must be a positive number")
      .optional("Work duration is optional"),
    newclientname: Yup.string().optional("New client name is optional"),
    newclientmobilenumber: Yup.string()
      .matches(/^\d+$/, "Mobile number must contain only digits")
      .optional("New client mobile number is optional"),
    newclientnationalidnumber: Yup.string().optional(
      "New client national ID is optional"
    ),
    newclientcity: Yup.string().optional("New client city is optional"),
    experimentstart: Yup.date().optional("Experiment start date is optional"),
    experimentend: Yup.date().optional("Experiment end date is optional"),
    dealcost: Yup.number()
      .positive("Deal cost must be a positive number")
      .optional("Deal cost is optional"),
    paid: Yup.number()
      .positive("Paid amount must be a positive number")
      .optional("Paid amount is optional"),
    restofpaid: Yup.number()
      .positive("Rest of paid amount must be a positive number")
      .optional("Rest of paid amount is optional"),
    experimentresult: Yup.string().optional("Experiment result is optional"),
    accomaditionnumber: Yup.string().optional(
      "Accommodation number is optional"
    ),
    marketeername: Yup.string().optional("Marketer name is optional"),
    notes: Yup.string().optional("Notes are required"),
  });

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const response = await fetch("../../api/transfers", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        showSuccessModal();
        resetForm(); // Reset form after successful submission
        setShowForm(!showForm);
      } else {
        showErrorModal();
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Something went wrong. Please try again later.");
    } finally {
      setSubmitting(false); // Stop the submit button from being disabled
    }
  };
  // useRef
  const [loading, setLoading] = useState(false); // Loading state
  const [hasMore, setHasMore] = useState(true); // To check if there is more data to load

  const pageRef = useRef(1); // Use a ref to keep track of the current page number
  const isFetchingRef = useRef(false); // Ref to track whether data is being fetched
  const [filters, setFilters] = useState({
    Name: "",
    age: "",
    Passport: "",
  });

  // Fetch data with pagination
  const fetchData = async () => {
    if (isFetchingRef.current || !hasMore) return; // Prevent duplicate fetches if already loading
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const response = await fetch(`/api/gettransfer/${pageRef.current}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "get",
      });
      const res = await response.json();
      console.log(pageRef.current);
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

      // Cleanup the observer when the component unmounts
      return () => observer.disconnect();
    },
    [loading, hasMore] // No need to track page here since it's managed by useRef
  );

  // Initialize fetching of the first page when the component mounts
  useEffect(() => {
    fetchData(); // Fetch the first page of data
  }, []); // Only run once on mount

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

  const transfers = [
    {
      id: 1,
      client: "Client A",
      mobilenumber: "123456789",
      nationalidnumber: "A1234567",
      passportnumber: "P1234567",
      homemaid: "Maid A",
      nationality: "Country A",
      kingdomentrydate: "2021-01-01",
      daydate: "2021-06-01",
      workduration: 12,
      newclientname: "New Client A",
      newclientmobilenumber: "987654321",
      newclientnationalidnumber: "B1234567",
      newclientcity: "City A",
      experimentstart: "2021-06-01",
      experimentend: "2022-06-01",
      dealcost: "5000",
      paid: "3000",
      restofpaid: "2000",
      experimentresult: "Success",
      accomaditionnumber: "Room 101",
      marketeername: "Marketer A",
      notes: "Notes here",
    },
    // Add more records as needed
  ];

  function isEnglish(text) {
    const englishRegex = /^[A-Za-z0-9\s.,!?;:'"-]*$/;
    return englishRegex.test(text);
  }

  function ConvertArabic(word) {
    switch (word) {
      case "client":
        return "العميل";
        break;

      case "mobilenumber":
        return "رقم الجوال";
        break;

      case "nationalidnumber":
        return "رقم الهوية";
        break;
      case "passportnumber":
        return "رقم جواز السفر";
        break;
      case "homemaid":
        return "رقم العاملة";
        break;

      case "nationality":
        return "الجنسية";
        break;

      case "kingdomentrydate":
        return "تاريخ دخول المملكة";
        break;

      case "daydate":
        return "تاريخ اليوم";
        break;
      case "workduration":
        return "مدة العمل";
        break;
      case "newclientname":
        return "اسم العميل الجديد";
        break;
      case "newclientmobilenumber":
        return "هاتف العميل الجديد";
        break;
      case "newclientnationalidnumber":
        return "هوية العميل الجديد";
        break;

      case "newclientcity":
        return "مدينة العميل الجديد";
        break;

      case "experimentstartDate":
        return "بداية التجربة";
        break;

      case "experimentendDate":
        return "نهاية التجربة";
        break;

      case "dealcost":
        return "تكلفة المعاملة";
        break;

      case "paid":
        return "المدفوع";
        break;

      case "restofpaid":
        return "المتبقى";
        break;

      case "experimentresult":
        return "نتيجة التجربة";
        break;

      case "accomaditionnumber":
        return "رقم الاقامة";
        break;

      case "marketeername":
        return "اسم المكتب";
        break;

      default:
        return word;
        break;
    }
  }

  // Manage selected columns visibility
  const [selectedColumns, setSelectedColumns] = useState({
    client: true,
    mobilenumber: true,
    nationalidnumber: true,
    passportnumber: true,
    homemaid: true,
    nationality: true,
    kingdomentrydate: false,
    daydate: false,
    workduration: false,
    newclientname: false,
    newclientmobilenumber: false,
    newclientnationalidnumber: false,
    newclientcity: false,
    experimentstartDate: false,
    experimentendDate: false,
    dealcost: false,
    paid: false,
    restofpaid: false,
    experimentresult: false,
    accomaditionnumber: false,
    marketeername: false,
    notes: false,
  });

  // Toggle column visibility
  const handleColumnToggle = (column) => {
    setSelectedColumns((prevState) => ({
      ...prevState,
      [column]: !prevState[column],
    }));
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold text-center mb-6">
          معـامـلات نقل الكفالة
        </h1>

        {/* Button to toggle form */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-4 px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-yellow-500"
        >
          {showForm ? "Hide Form" : "Add New Transfer"}
        </button>

        {/* Form */}
        {showForm ? (
          <div className="bg-white p-6 shadow-md rounded-md mb-6">
            <h2 className="text-xl font-semibold mb-4">نقل كفالة جديدة</h2>
            <Formik
              initialValues={{
                client: "",
                mobilenumber: "",
                nationalidnumber: "",
                passportnumber: "",
                homemaid: "",
                nationality: "",
                kingdomentrydate: "",
                daydate: "",
                workduration: "",
                newclientname: "",
                newclientmobilenumber: "",
                newclientnationalidnumber: "",
                newclientcity: "",
                experimentstartDate: "",
                experimentendDate: "",
                dealcost: "",
                paid: "",
                restofpaid: "",
                experimentresult: "",
                accomaditionnumber: "",
                marketeername: "",
                notes: "",
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({
                values,
                handleChange,
                handleBlur,
                touched,
                errors,
                isSubmitting,
              }) => (
                <Form className="space-y-4 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
                  {Object.keys(values).map((key) => (
                    <div key={key}>
                      <label className="block text-sm font-medium">
                        {ConvertArabic(key)} {/* Display Arabic labels */}
                      </label>
                      <Field
                        type={
                          key.toLowerCase().includes("date") ? "date" : "text"
                        }
                        name={key}
                        value={values[key]}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder={ConvertArabic(key)}
                      />
                      <ErrorMessage
                        name={key}
                        component="div"
                        className="text-red-500 text-xs"
                      />
                    </div>
                  ))}

                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting} // Disable button while submitting
                      className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-medium mb-2">
                Select Columns to Show
              </h2>
              <div className="space-x-4">
                {Object.keys(selectedColumns).map((column) => (
                  <label key={column} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedColumns[column]}
                      onChange={() => handleColumnToggle(column)}
                      className="form-checkbox"
                    />
                    <span className="ml-2">
                      {isEnglish(column)
                        ? ConvertArabic(column)
                        : column.replace(/([A-Z])/g, " $1").toUpperCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto bg-white shadow-md rounded-md">
              <table className="min-w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    {Object.keys(selectedColumns)
                      .filter((column) => selectedColumns[column])
                      .map((column) => (
                        <th
                          key={column}
                          className="px-4 py-2 text-sm font-medium"
                        >
                          {isEnglish(column)
                            ? ConvertArabic(column)
                            : column.replace(/([A-Z])/g, " $1").toUpperCase()}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((transfer) => (
                    <tr key={transfer.id} className="border-t">
                      {Object.keys(selectedColumns)
                        .filter((column) => selectedColumns[column])
                        .map((column) => (
                          <td key={column} className="px-4 py-2 text-sm">
                            <h1
                              style={{
                                display: "flex",
                                justifyContent: "center",
                              }}
                            >
                              {" "}
                              {transfer[column]
                                ? transfer[column]
                                : "لا يوجد بيان"}
                            </h1>
                          </td>
                        ))}
                    </tr>
                  ))}
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
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          message={modalMessage}
          type={modalType}
          onClose={closeSuccessfulModal}
        />
      </div>
    </Layout>
  );
};

export default TransferPage;
