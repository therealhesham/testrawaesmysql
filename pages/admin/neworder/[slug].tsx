//@ts-nocheck
//@ts-ignore

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "example/containers/Layout";
import Timeline from "office/components/TimeLine";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ClipboardCopyIcon } from "@heroicons/react/solid"; // Import the clipboard icon
import { GridLoader } from "react-spinners";
import Modal from "components/modal";

import SpinnerModal from "components/spinner";
import SuccessModal from "office/components/successcoponent";
import { Spinner } from "react-bootstrap";
// GridLoader
const SlugPage = () => {
  const router = useRouter();

  const [datenow, setDate] = useState(Date.now());
  useEffect(() => {
    // alert(router)
    if (!router.isReady) return;
    Fetcher();
  }, [router.isReady, datenow]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const { slug } = router.query; // Get the dynamic slug value
  const [formData, setFormData] = useState({
    Client: [{ FullName: "" }],
    NewOrder: [{ bookingstatus: "" }],
  });
  const [submitted, setSubmitted] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility state
  const [accessFormData, setAccessFormData] = useState({
    accessName: "",
    accessReason: "",
  }); // Access List form data

  const [bookingstatus, setBookingStatus] = useState(formData.bookingstatus);
  const [copySuccess, setCopySuccess] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("success");

  const [clientInfoData, setClientInfoData] = useState({});
  async function Fetcher() {
    fetch(`/api/findorderprisma/${router.query.slug}`)
      .then((e) => e.json())
      .then((e) => setFormData(e));
    // const jsonfetcher = await fetcher.json();
    // setFormData(jsonfetcher);
    // // setClientInfoData(jsonfetcher.Client[0]);
    // console.log(jsonfetcher);
  }

  const [formDataReservationChange, setFormDataReservationChange] = useState(
    {}
  );
  const handlereservationChange = (e) => {
    const { name, value } = e.target;
    setFormDataReservationChange((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleChangeReservationSubmit = async (e) => {
    const submitter = await fetch("/api/changerservationstatus", {
      method: "post",
      headers: {
        Accept: "application/json",

        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: router.query.slug,
        bookingstatus: formDataReservationChange.bookingstatus,
      }),
    });

    // alert(submitter.status);
    if (submitter.status == 200) {
      // alert(submitter.status);
      setDate(Date.now());
      setSubmitted(true);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    setMessageSent(true);
  };

  const getReservationIndicatorStyles = () => {
    switch (formData.bookingstatus) {
      case "newreservation":
        return "bg-green-500 text-white";
      case "underrevision":
        return "bg-purple-500 text-black";
      case "medicalcheck":
        return "bg-blue-500 text-white";
      case "cancelledreservation":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const updatekingdomentry = useRef(null);
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess("Copied!");
      setTimeout(() => {
        setCopySuccess("");
      }, 2000); // Reset "Copied!" message after 2 seconds
    });
  };

  const handleToggleFormVisibility = () => {
    setIsFormVisible((prevState) => !prevState);
  };

  // Handle Modal visibility toggle
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

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

  const handleAccessFormChange = (e) => {
    const { name, value } = e.target;
    setAccessFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const toggleFormVisibility = () => {
    // alert(formData.clientphonenumber);
    // alert(formData.Client.phonenumber);

    setIsFormVisible(!isFormVisible); // Toggle the form visibility
  };

  const handleAccessFormSubmit = async (s) => {
    setModalSpinnerOpen(true);
    // Adding to access list
    // e.preventDefault();
    const {
      SponsorName,
      InternalmusanedContract,
      SponsorIdnumber,
      SponsorPhoneNumber,
      PassportNumber,
      KingdomentryDate,
      DayDate,
      WorkDuration,
      Cost,
      HomemaIdnumber,
      HomemaidName,
      Notes,
      ArrivalCity,
      DateOfApplication,
      MusanadDuration,
      ExternalDateLinking,
      ExternalOFficeApproval,
      AgencyDate,
      EmbassySealing,
      BookinDate,
      GuaranteeDurationEnd,
    } = s;

    const submitter = await fetch("../../api/addhomemaidarrivalprisma", {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        SponsorName: formData.Client[0].fullname,
        InternalmusanedContract,

        SponsorIdnumber: formData.Client[0].id,
        SponsorPhoneNumber: formData.id + "",
        PassportNumber: formData.Passportnumber,
        KingdomentryDate,
        DayDate,
        WorkDuration,
        Cost,
        HomemaIdnumber: formData.id,
        HomemaidName: formData.Name,
        Notes,
        ArrivalCity,
        DateOfApplication,
        MusanadDuration,
        ExternalDateLinking,
        ExternalOFficeApproval,
        AgencyDate,
        EmbassySealing,
        BookinDate,
        GuaranteeDurationEnd,
      }),
    });
    // max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-md
    console.log(submitter);
    const res = await submitter.json();
    if (submitter.status == 200) {
      setModalSpinnerOpen(false);
      showSuccessModal();
    } else {
      setModalSpinnerOpen(false);

      showErrorModal();
    }
    // closeModal(); // Close the modal after submission
  };

  const handleExitClick = () => {
    router.push("/admin/neworders");
  };

  // Added Cancelled stage and implemented the handleTimelineClick function
  const stages = [
    "التواصل مع العميل",
    "اكمال الطلب",
    "الربط",
    "المتابعة",
    "وصول العاملة",
    "الاستلام",
    "التقييم",
  ];

  // switch (stage) {
  //   case :

  //     break;

  //   default:
  //     break;
  // }

  const getExperienceIndicatorStyles = () => {
    if (formData.ExperienceYears >= 5) {
      return "bg-blue-100 text-blue-700";
    } else if (formData.ExperienceYears >= 2) {
      return "bg-teal-100 text-teal-700";
    } else {
      return "bg-gray-100 text-gray-700";
    }
  };
  // Handle Timeline Stage Click
  const handleTimelineClick = (stage) => {
    let newStatus = "";
    switch (stage) {
      case "حجز جديد":
        newStatus = "newreservation";
        break;
      case "فحص طبي":
        newStatus = "medicalcheck";
        break;
      case "Flight Booked":
        newStatus = "underrevision";
        break;
      case "Arrived":
        newStatus = "arrived";
        break;
      case "Cancelled":
        newStatus = "cancelledreservation";
        break;
      default:
        break;
    }

    // Update booking status
    setFormData((prevData) => ({
      ...prevData,
      bookingstatus: newStatus,
    }));
  };

  const changeTimeline = async (state) => {
    // alert(state);
    setModalSpinnerOpen(true);
    const fetcher = await fetch(`/api/updatetimeline`, {
      body: JSON.stringify({
        id: formData.NewOrder[0].id,
        bookingstatus: state,
      }),
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "default",
    });
    // alert(fetcher.status);
    const jsonfetcher = await fetcher.json();
    if (fetcher.status == 200) {
      // console.log(updatekingdomentry.current);
      setDate(Date.now());
      setModalSpinnerOpen(false);
      setIsFormVisible(true);
    } else {
      setModalSpinnerOpen(false);
    }
  };

  const validationSchema = Yup.object({
    InternalmusanedContract: Yup.string().required(
      "Internalmusaned contract is required"
    ),
    KingdomentryDate: Yup.date().required("Kingdom entry date is required"),
    WorkDuration: Yup.string().required("Work duration is required"),
    Cost: Yup.string().required("Cost is required"),
    Notes: Yup.string().required("Notes are required"),
    ArrivalCity: Yup.string().required("Arrival city is required"),
    DateOfApplication: Yup.date().required("Date of application is required"),
    MusanadDuration: Yup.string().required("Musanad duration is required"),
    ExternalDateLinking: Yup.date().required(
      "External date linking is required"
    ),
    ExternalOFficeApproval: Yup.date().required(
      "External office approval is required"
    ),
    AgencyDate: Yup.date().required("Agency date is required"),
    EmbassySealing: Yup.date().required("Embassy sealing is required"),
    BookinDate: Yup.date(Date.now()).required("Booking date is required"),
    GuaranteeDurationEnd: Yup.date().required(
      "Guarantee duration end is required"
    ),
  });
  // alert(formData.Passportnumber);
  const formik = useFormik({
    initialValues: {
      InternalmusanedContract: "",
      KingdomentryDate: "",
      WorkDuration: "",
      Cost: "",
      Notes: "",
      ArrivalCity: "",
      DateOfApplication: "",
      MusanadDuration: "",
      ExternalDateLinking: "",
      ExternalOFficeApproval: "",
      AgencyDate: "",
      EmbassySealing: "",
      BookinDate: "",
      GuaranteeDurationEnd: "",
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      // console.log(values);
      // console.log(values);
      handleAccessFormSubmit(values);
      // Send data to the server or handle form submission
    },
  });

  const [isModalSpinnerOpen, setModalSpinnerOpen] = useState(false);

  const openSpinnerModal = () => {
    setModalSpinnerOpen(true);
  };

  const closespinnerModal = () => {
    setModalSpinnerOpen(false);
  };
  return (
    <Layout>
      {/* min-h-screen */}
      <div className=" bg-gray-100 py-8">
        <SpinnerModal isOpen={isModalSpinnerOpen} onClose={closespinnerModal} />
        <Modal
          isOpen={isModalOpen}
          message={modalMessage}
          type={modalType}
          onClose={closeSuccessfulModal}
        />
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8">
            بيانات العميل{" "}
            {formData.Client[0].FullName ? formData?.Client[0].FullName : ""}
          </h1>

          {/* Timeline Component with Clickable Stages */}
          <Timeline
            currentstatus={formData.NewOrder[0].bookingstatus}
            stages={stages}
            changeTimeline={changeTimeline}
          />

          {/* Exit Button */}
          <div className="absolute top-4 right-10">
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

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {/* <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold mb-4">تعديل حالة الطلب</h2>
              <div
                className={`px-4 py-2 rounded-lg ${getReservationIndicatorStyles()} cursor-pointer`}
                onClick={handleToggleFormVisibility}
              >
                <strong>Booking Status:</strong> {formData.bookingstatus}
              </div>

              {isFormVisible && (
                <form
                  onSubmit={handleChangeReservationSubmit}
                  className="space-y-4 mt-4"
                >
                  <div className="text-center">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 focus:outline-none"
                    >
                      {submitted ? "Submitted" : "Submit"}
                    </button>
                  </div>
                </form>
              )}
            </div> */}
            {/* Client Info Section */}
            <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
              <h2 className="text-2xl font-semibold mb-4">
                Client Information
              </h2>
              <div className="space-y-4">
                <p>
                  <strong>Name:</strong> {formData.Client[0].fullname}
                </p>
                <div className="flex items-center space-x-2">
                  <p className="flex-1">
                    <strong>Email:</strong> {formData.Client[0].email}
                  </p>
                  <a
                    href={`mailto:${formData.Client[0].email}`}
                    className="text-white bg-blue-500 px-4 py-2 rounded-lg"
                  >
                    Message
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="flex-1">
                    <strong>Phone:</strong> {formData.Client[0].phonenumber}
                  </p>
                  <a
                    href={`https://wa.me/${formData.Client[0].phonenumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white bg-green-500 px-4 py-2 rounded-lg"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
            {/* Home Maid Information Section */}
            {/* Home Maid Information Section */}
            <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
              <h2 className="text-2xl font-semibold mb-4">
                Home Maid Information
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <strong className="w-32">Order ID:</strong>
                  <span>{slug}</span>
                  <button
                    onClick={() => handleCopy(slug)}
                    className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                    aria-label="Copy Order ID"
                  >
                    <ClipboardCopyIcon className="h-8 w-8" opacity="40%" />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <strong className="w-32">Name:</strong>
                  <span>{formData.Name}</span>
                  <button
                    onClick={() => handleCopy(formData.Name)}
                    className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                    aria-label="Copy Name"
                  >
                    <ClipboardCopyIcon className="h-8 w-8" opacity="40%" />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <strong className="w-32">Passport:</strong>
                  <span>{formData.Passportnumber}</span>
                  <button
                    onClick={() => handleCopy(formData.Passportnumber)}
                    className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                    aria-label="Copy Passport"
                  >
                    <ClipboardCopyIcon className="h-8 w-8" opacity="40%" />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <strong className="w-32">Age:</strong>
                  <span>{formData.age}</span>
                  <button
                    onClick={() => handleCopy(formData.ages)}
                    className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                    aria-label="Copy Age"
                  >
                    <ClipboardCopyIcon className="h-8 w-8" opacity="40%" />
                  </button>
                </div>

                {/* Dynamic Styles Based on Booking Status */}
                <div
                  className={`flex justify-between items-center px-4 py-2 rounded-lg ${getReservationIndicatorStyles()}`}
                >
                  <strong className="w-32">Booking Status:</strong>
                  <span>{formData.NewOrder[0].bookingstatus}</span>
                  <button
                    onClick={() =>
                      handleCopy(formData.NewOrder[0].bookingstatus)
                    }
                    className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                    aria-label="Copy Booking Status"
                  >
                    <ClipboardCopyIcon className="h-8 w-8" opacity="40%" />
                  </button>
                </div>

                {/* Dynamic Styles Based on Experience */}
                <div
                  className={`flex justify-between items-center px-4 py-2 rounded-lg ${getExperienceIndicatorStyles()}`}
                >
                  <strong className="w-32">Experience:</strong>
                  <span>{formData.NewOrder[0].ExperienceYears} years</span>
                  <button
                    onClick={() => handleCopy(formData.ExperienceYears)}
                    className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                    aria-label="Copy Experience"
                  >
                    <ClipboardCopyIcon className="h-8 w-8" opacity="40%" />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <strong className="w-32">Marital Status:</strong>
                  <span>{formData.maritalstatus}</span>
                  <button
                    onClick={() => handleCopy(formData.maritalstatus)}
                    className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                    aria-label="Copy Marital Status"
                  >
                    <ClipboardCopyIcon className="h-8 w-8" opacity="40%" />
                  </button>
                </div>

                {copySuccess && (
                  <div className="mt-2 text-green-500 text-sm">
                    {copySuccess}
                  </div>
                )}
              </div>
            </div>{" "}
          </div>

          {/* Modal Form */}

          <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
            {/* Button to toggle the form */}
            <button
              onClick={toggleFormVisibility}
              className="mb-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
            >
              {isFormVisible ? "الغاء عملية التحديث" : "تحديث بيانات الوصول "}
            </button>

            {/* Form: Conditionally rendered based on the isFormVisible state */}
            {isFormVisible && (
              <form onSubmit={formik.handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Internalmusaned Contract */}
                  <div>
                    <label
                      htmlFor="InternalmusanedContract"
                      className="block font-semibold text-sm"
                    >
                      Internalmusaned Contract
                    </label>
                    <input
                      id="InternalmusanedContract"
                      name="InternalmusanedContract"
                      type="text"
                      className="w-full border rounded-md px-4 py-2"
                      value={formik.values.InternalmusanedContract}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.InternalmusanedContract &&
                      formik.touched.InternalmusanedContract && (
                        <div className="text-red-600 text-sm">
                          {formik.errors.InternalmusanedContract}
                        </div>
                      )}
                  </div>
                  {/* Kingdom Entry Date */}
                  <div>
                    <label
                      htmlFor="KingdomentryDate"
                      className="block font-semibold text-sm"
                    >
                      Kingdom Entry Date
                    </label>
                    <input
                      id="KingdomentryDate"
                      name="KingdomentryDate"
                      type="date"
                      className="w-full border rounded-md px-4 py-2"
                      value={formik.values.KingdomentryDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.KingdomentryDate &&
                      formik.touched.KingdomentryDate && (
                        <div className="text-red-600 text-sm">
                          {formik.errors.KingdomentryDate}
                        </div>
                      )}
                  </div>
                  <div>
                    <label
                      htmlFor="DateOfApplication"
                      className="block font-semibold text-sm"
                    >
                      تاريخ تقديم الطلب
                    </label>
                    <input
                      id="DateOfApplication"
                      name="DateOfApplication"
                      type="date"
                      className="w-full border rounded-md px-4 py-2"
                      value={formik.values.DateOfApplication}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.DateOfApplication &&
                      formik.touched.DateOfApplication && (
                        <div className="text-red-600 text-sm">
                          {formik.errors.DateOfApplication}
                        </div>
                      )}
                  </div>
                  <div>
                    <label
                      htmlFor="ExternalDateLinking"
                      className="block font-semibold text-sm"
                    >
                      تاريخ الربط مع مساند
                    </label>
                    <input
                      id="ExternalDateLinking"
                      name="ExternalDateLinking"
                      type="date"
                      className="w-full border rounded-md px-4 py-2"
                      value={formik.values.ExternalDateLinking}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.ExternalDateLinking &&
                      formik.touched.ExternalDateLinking && (
                        <div className="text-red-600 text-sm">
                          {formik.errors.ExternalDateLinking}
                        </div>
                      )}
                  </div>
                  {/* Work Duration */}
                  <div>
                    <label
                      htmlFor="WorkDuration"
                      className="block font-semibold text-sm"
                    >
                      Work Duration
                    </label>
                    <input
                      id="WorkDuration"
                      name="WorkDuration"
                      type="text"
                      className="w-full border rounded-md px-4 py-2"
                      value={formik.values.WorkDuration}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.WorkDuration &&
                      formik.touched.WorkDuration && (
                        <div className="text-red-600 text-sm">
                          {formik.errors.WorkDuration}
                        </div>
                      )}
                  </div>
                  {/* Cost */}
                  <div>
                    <label
                      htmlFor="ExternalOFficeApproval"
                      className="block font-semibold text-sm"
                    >
                      موافقة المكتب الخارجي
                    </label>
                    <input
                      id="ExternalOFficeApproval"
                      name="ExternalOFficeApproval"
                      type="date"
                      className="w-full border rounded-md px-4 py-2"
                      value={formik.values.ExternalOFficeApproval}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.ExternalOFficeApproval &&
                      formik.touched.ExternalOFficeApproval && (
                        <div className="text-red-600 text-sm">
                          {formik.errors.ExternalOFficeApproval}
                        </div>
                      )}
                  </div>
                  <div>
                    <label
                      htmlFor="AgencyDate"
                      className="block font-semibold text-sm"
                    >
                      تاريخ الربط مع الوكالة
                    </label>
                    <input
                      id="AgencyDate"
                      name="AgencyDate"
                      type="date"
                      className="w-full border rounded-md px-4 py-2"
                      value={formik.values.AgencyDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.AgencyDate && formik.touched.AgencyDate && (
                      <div className="text-red-600 text-sm">
                        {formik.errors.AgencyDate}
                      </div>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="BookinDate"
                      className="block font-semibold text-sm"
                    >
                      تاريخ الحجز
                    </label>
                    <input
                      id="BookinDate"
                      name="BookinDate"
                      type="date"
                      className="w-full border rounded-md px-4 py-2"
                      value={formik.values.BookinDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.BookinDate && formik.touched.BookinDate && (
                      <div className="text-red-600 text-sm">
                        {formik.errors.BookinDate}
                      </div>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="GuaranteeDurationEnd"
                      className="block font-semibold text-sm"
                    >
                      تاريخ انتهاء مدة الضمان
                    </label>
                    <input
                      id="GuaranteeDurationEnd"
                      name="GuaranteeDurationEnd"
                      type="date"
                      className="w-full border rounded-md px-4 py-2"
                      value={formik.values.GuaranteeDurationEnd}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.GuaranteeDurationEnd &&
                      formik.touched.GuaranteeDurationEnd && (
                        <div className="text-red-600 text-sm">
                          {formik.errors.GuaranteeDurationEnd}
                        </div>
                      )}
                  </div>
                  <div>
                    <label
                      htmlFor="EmbassySealing"
                      className="block font-semibold text-sm"
                    >
                      تاريخ التختيم في السفارة
                    </label>
                    <input
                      id="EmbassySealing"
                      name="EmbassySealing"
                      type="date"
                      className="w-full border rounded-md px-4 py-2"
                      value={formik.values.EmbassySealing}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.EmbassySealing &&
                      formik.touched.EmbassySealing && (
                        <div className="text-red-600 text-sm">
                          {formik.errors.EmbassySealing}
                        </div>
                      )}
                  </div>

                  <div>
                    <label
                      htmlFor="MusanadDuration"
                      className="block font-semibold text-sm"
                    >
                      المدة في مساند
                    </label>
                    <input
                      id="MusanadDuration"
                      name="MusanadDuration"
                      type="text"
                      className="w-full border rounded-md px-4 py-2"
                      value={formik.values.MusanadDuration}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.MusanadDuration &&
                      formik.touched.MusanadDuration && (
                        <div className="text-red-600 text-sm">
                          {formik.errors.MusanadDuration}
                        </div>
                      )}
                  </div>
                  <div>
                    <label
                      htmlFor="Cost"
                      className="block font-semibold text-sm"
                    >
                      Cost
                    </label>
                    <input
                      id="Cost"
                      name="Cost"
                      type="text"
                      className="w-full border rounded-md px-4 py-2"
                      value={formik.values.Cost}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.Cost && formik.touched.Cost && (
                      <div className="text-red-600 text-sm">
                        {formik.errors.Cost}
                      </div>
                    )}
                  </div>
                  {/* Home Maid ID */}
                  {/* Home Maid Name */}
                  {/* Notes */}
                  <div>
                    <label
                      htmlFor="Notes"
                      className="block font-semibold text-sm"
                    >
                      Notes
                    </label>
                    <textarea
                      id="Notes"
                      name="Notes"
                      className="w-full border rounded-md px-4 py-2"
                      value={formik.values.Notes}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.Notes && formik.touched.Notes && (
                      <div className="text-red-600 text-sm">
                        {formik.errors.Notes}
                      </div>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="ArrivalCity"
                      className="block font-semibold text-sm"
                    >
                      مدينة الوصول
                    </label>
                    <input
                      id="ArrivalCity"
                      name="ArrivalCity"
                      type="text"
                      className="w-full border rounded-md px-4 py-2"
                      value={formik.values.ArrivalCity}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.errors.ArrivalCity &&
                      formik.touched.ArrivalCity && (
                        <div className="text-red-600 text-sm">
                          {formik.errors.ArrivalCity}
                        </div>
                      )}
                  </div>
                  {/* Submit Button */}
                  <div className="col-span-2 text-center mt-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-700"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SlugPage;
