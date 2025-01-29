import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "example/containers/Layout";
import Timeline from "office/components/TimeLine";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ClipboardCopyIcon } from "@heroicons/react/solid"; // Import the clipboard icon
import { GridLoader } from "react-spinners";
import Modal from "components/modal";
import Style from "styles/Home.module.css";

import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";

import SpinnerModal from "components/spinner";
import SuccessModal from "office/components/successcoponent";
import { Spinner } from "react-bootstrap";
import RejectBooking from "../reject-booking";
import ErrorModal from "office/components/errormodal";
import axios from "axios";
import { FaAddressBook, FaFileSignature } from "react-icons/fa";
import { BookOpenIcon } from "@heroicons/react/outline";
import { LinkedinFilled, LinkOutlined } from "@ant-design/icons";
import CancelBooking from "example/components/cancelbookingmodal";
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
    OrderStatus: [],
    arrivals: [],
    bookingstatus: "",
    client: { fullname: "" },
    HomeMaid: {},
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
    const f = await fetch(`/api/findorderprisma/${router.query.slug}`);
    const g = await f.json();
    console.log(g);
    if (g.HomemaidID == null)
      setFormData({
        ...g,
        HomeMaid: {
          Nationalitycopy: "",
          Name: "",
          Religion: "",
          officeID: "",

          Passportnumber: "",
          clientphonenumber: "",
          // Picture           Json?

          ExperienceYears: "",
          maritalstatus: "",
          Experience: "",
          dateofbirth: "",
          Nationality: "",
          age: "",
          // flag              Json?
          phone: "",
          bookingstatus: "",
          ages: "",
        },
      });
    setFormData(g);
    //  .then((e) => e.json())
    //  .then((e) => setFormData(e));
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
  const musanadRef = useRef();
  const kingdomEntryRef = useRef();
  const externalOfficeAprrovalRef = useRef();
  const musanadDateRef = useRef();

  const handleChangeReservationtoend = async (status) => {
    const submitter = await fetch("/api/endedorders", {
      method: "post",
      headers: {
        Accept: "application/json",

        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: router.query.slug,
        bookingstatus: status,
      }),
    });

    // alert(submitter.status);
    if (submitter.status == 200) {
      // alert(submitter.status);
      setDate(Date.now());
      setSubmitted(true);
    }
  };

  const handleChangeReservationSubmit = async (status) => {
    const submitter = await fetch("/api/changerservationstatus", {
      method: "post",
      headers: {
        Accept: "application/json",

        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: router.query.slug,
        bookingstatus: status,
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
      case "طلب مرفوض":
        return "bg-red-700 text-white";
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
    setDate(datenow);
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
    // alert(formData.client.phonenumber);

    setIsFormVisible(!isFormVisible); // Toggle the form visibility
  };

  const [cloudinaryImage, setCloudinaryImage] = useState<string | null>(null);
  // Handle the file upload to Cloudinary

  const [medicalCheckFileCloudinaryImage, setmedicalCheckFileCloudinaryImage] =
    useState<string | null>(null);
  const [ticketFileFileCloudinaryImage, setTicketFileCloudinaryImage] =
    useState<string | null>(null);
  const [receivingFileCloudinaryImage, setreceivingFileCloudinaryImage] =
    useState<string | null>(null);
  const [
    approvalPaymentFileCloudinaryImage,
    setapprovalPaymentCloudinaryImage,
  ] = useState<string | null>(null);

  const handleUploadmedicalcheckfile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    const file = e.target.files && e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "z8q1vykv"); // Cloudinary preset
      formData.append("cloud_name", "duo8svqci");
      formData.append("folder", "samples");

      try {
        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/duo8svqci/image/upload`,
          formData
        );

        setmedicalCheckFileCloudinaryImage(response.data.secure_url); // Update image URL
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleUploadticketFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    const file = e.target.files && e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "z8q1vykv"); // Cloudinary preset
      formData.append("cloud_name", "duo8svqci");
      formData.append("folder", "samples");

      try {
        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/duo8svqci/image/upload`,
          formData
        );

        setTicketFileCloudinaryImage(response.data.secure_url); // Update image URL
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleUploadreceivingFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    const file = e.target.files && e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "z8q1vykv"); // Cloudinary preset
      formData.append("cloud_name", "duo8svqci");
      formData.append("folder", "samples");

      try {
        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/duo8svqci/image/upload`,
          formData
        );

        setreceivingFileCloudinaryImage(response.data.secure_url); // Update image URL
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleUploadapprovalPayment = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    const file = e.target.files && e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "z8q1vykv"); // Cloudinary preset
      formData.append("cloud_name", "duo8svqci");
      formData.append("folder", "samples");

      try {
        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/duo8svqci/image/upload`,
          formData
        );

        setapprovalPaymentCloudinaryImage(response.data.secure_url); // Update image URL
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    const files = e.target.files;
    if (files) {
      const formData = new FormData();
      const uploadedUrls: string[] = []; // Store the uploaded file URLs

      for (let i = 0; i < files.length; i++) {
        formData.append("file", files[i]);
        formData.append("upload_preset", "z8q1vykv"); // Cloudinary preset
        formData.append("cloud_name", "duo8svqci");
        formData.append("folder", "samples");

        try {
          const response = await axios.post(
            `https://api.cloudinary.com/v1_1/duo8svqci/image/upload`,
            formData
          );
          uploadedUrls.push(response.data.secure_url); // Add the uploaded URL to the array
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      }
      setCloudinaryImages(uploadedUrls);
    }
  };
  const updatearrivallist = async () => {
    // const handleAccessFormSubmit = async (s) => {
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

    const submitter = await fetch("../../api/updatehomemaidarrivalprisma", {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        InternalmusanedContract,

        KingdomentryDate: new Date(KingdomentryDate).toISOString(),
        WorkDuration,
        Cost,
        Notes,
        ArrivalCity,
        MusanadDuration,
        ExternalDateLinking: new Date(ExternalDateLinking).toISOString(),
        ExternalOFficeApproval: new Date(ExternalOFficeApproval).toISOString(),
        AgencyDate: new Date(AgencyDate).toISOString(),
        EmbassySealing: new Date(EmbassySealing).toISOString(),
        BookinDate: new Date(BookinDate).toISOString(),
        GuaranteeDurationEnd: new Date(GuaranteeDurationEnd).toISOString(),
      }),
    });
    // max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-md
    // console.log(submitter);

    const res = await submitter.json();
    if (submitter.status == 200) {
      setModalSpinnerOpen(false);
      showSuccessModal();
    } else {
      setModalSpinnerOpen(false);

      showErrorModal();
    }
    // closeModal(); // Close the modal after submission
    // };
  };

  const handleAccessEntryDate = async (s) => {
    // setModalSpinnerOpen(true);
    // Adding to access list

    // e.preventDefault();

    const submitter = await fetch("/api/updatehomemaidarrivalprisma", {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        SponsorName: formData.ClientName,
        id: formData.arrivals[0].id,
        SponsorIdnumber: formData.ClientID,
        SponsorPhoneNumber: formData.client.phonenumber + "",
        PassportNumber: formData.Passportnumber,
        Orderid: formData.id,
        HomemaIdnumber: formData.HomeMaid.id,
        HomemaidName: formData.HomeMaid.Name,
        ExternalOFficeApproval: new Date(
          kingdomEntryRef.current.value
        ).toISOString(),
        bookingstatus: "وصول العاملة",
      }),
    });
    // max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-md
    // console.log(submitter);

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

  const handleAccessFormDateSubmitOfficeApproval = async (s) => {
    // setModalSpinnerOpen(true);
    // Adding to access list

    // e.preventDefault();

    const submitter = await fetch("/api/updatehomemaidarrivalprisma", {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        SponsorName: formData.ClientName,
        id: formData.arrivals[0].id,
        SponsorIdnumber: formData.ClientID,
        SponsorPhoneNumber: formData.client.phonenumber + "",
        PassportNumber: formData.Passportnumber,
        Orderid: formData.id,
        HomemaIdnumber: formData.HomeMaid.id,
        HomemaidName: formData.HomeMaid.Name,
        ExternalOFficeApproval: new Date(
          externalOfficeAprrovalRef.current.value
        ).toISOString(),
        bookingstatus: "موافقة المكتب الخارجي",
      }),
    });
    // max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-md
    // console.log(submitter);

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

  const handleAccessFormSubmit = async (s) => {
    // setModalSpinnerOpen(true);
    // Adding to access list

    console.log(s);
    // e.preventDefault();
    const {
      SponsorName,
      medicalCheckFile,
      ticketFile,
      receivingFile,
      approvalPayment,
      additionalfiles,

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
      bookingstatus,
      GuaranteeDurationEnd,
    } = s;

    const submitter = await fetch("/api/updatehomemaidarrivalprisma", {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        SponsorName: formData.ClientName,
        InternalmusanedContract,
        id: formData.arrivals[0].id,
        SponsorIdnumber: formData.ClientID,
        SponsorPhoneNumber: formData.client.phonenumber + "",
        PassportNumber: formData.Passportnumber,
        KingdomentryDate,
        DayDate,
        Orderid: formData.id,
        WorkDuration,
        Cost,
        HomemaIdnumber: formData.HomeMaid.id,
        HomemaidName: formData.HomeMaid.Name,
        Notes,
        bookingstatus,
        medicalCheckFile: medicalCheckFileCloudinaryImage,
        ticketFile: ticketFileFileCloudinaryImage,
        receivingFile: receivingFileCloudinaryImage,
        approvalPayment: approvalPaymentFileCloudinaryImage,
        additionalfiles: additionalfiles,

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
    // console.log(submitter);

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
    "التواصل",
    "اكمال الطلب",
    "موافقة المكتب الخارجي",
    "الربط",
    "وصول العاملة",
    "الاستلام",
    "المتابعة",

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
  const createArrivalListRecord = async () => {
    const fetcher = await fetch(`/api/arrivallistcreator`, {
      body: JSON.stringify({
        OrderId: formData.id,
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

  const changeTimelineDates = () => {};

  const getDate = (stage) => {
    if (stage) {
      const filter = formData?.OrderStatus.filter(
        (e) => e == formData.OrderStatus.createdAt
      );
      return filter;
    }
    return null;
  };
  const changeTimeline = async (state) => {
    // alert(state);

    // setModalSpinnerOpen(true);

    switch (state) {
      case "الربط":
        setIsEditing("الربط");
        musanadRef.current.focus();

        break;
      case "موافقة المكتب الخارجي":
        setIsEditing("موافقة المكتب الخارجي");
        externalOfficeAprrovalRef.current.focus();

        break;

      case "وصول العاملة":
        setIsEditing("وصول العاملة");
        kingdomEntryRef.current.focus();

        break;

      case "الاستلام":
        // setIsEditing("وصول العاملة");
        // kingdomEntryRef.current.focus();

        handleChangeReservationtoend("طلب منتهي");

        break;

      default:
        break;
    }

    // alert(fetcher.status);
    // console.log(updatekingdomentry.current);
  };

  const validationSchema = Yup.object({
    InternalmusanedContract: Yup.string().optional(),
    KingdomentryDate: Yup.date().optional(),
    WorkDuration: Yup.string().optional(),
    Cost: Yup.string().optional(),
    Notes: Yup.string().optional(),
    ArrivalCity: Yup.string().optional(),
    DateOfApplication: Yup.date().optional(),
    MusanadDuration: Yup.string().optional(),
    ExternalDateLinking: Yup.date().optional(),
    ExternalOFficeApproval: Yup.date().optional(),
    AgencyDate: Yup.date().optional(),
    EmbassySealing: Yup.date().optional(),
    GuaranteeDurationEnd: Yup.date().optional(),
  });
  const [cloudinaryImages, setCloudinaryImages] = useState<string[]>([]);
  // Handle the file upload to Cloudinary

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
      medicalCheckFile: medicalCheckFileCloudinaryImage,
      ticketFile: ticketFileFileCloudinaryImage,
      receivingFile: receivingFileCloudinaryImage,
      approvalPayment: approvalPaymentFileCloudinaryImage,
      additionalfiles: cloudinaryImages,
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      console.log(values);
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
  const [reason, setReason] = useState("");
  const [isModalRejectionOpen, setIsModalRejectionOpen] = useState(false);
  const OpenRejectionModal = () => setIsModalRejectionOpen(true); // Function to open the modal
  const handleCancelRejectionModal = () => setIsModalRejectionOpen(false); // Function to close the modal
  const handleReject = async () => {
    const submitter = await fetch("/api/rejectbookingprisma", {
      method: "post",
      headers: {
        Accept: "application/json",

        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: router.query.slug,
        ReasonOfRejection: reason,
      }),
    });

    // alert(submitter.status);
    if (submitter.status == 200) {
      // alert(submitter.status);
      setDate(Date.now());

      setIsModalRejectionOpen(false); // Close the modal after rejection
    }
  };
  const [value, setValue] = useState("");

  // Handle value change in input field
  const handleChangein = (e) => {
    setValue(e.target.value);
  };

  const [Canceelationreason, setCancellationReason] = useState("");
  const [isModalCancellationOpen, setIsModalCancellationOpen] = useState(false);
  const OpenCancellationModal = () => setIsModalCancellationOpen(true); // Function to open the modal
  const handleCancelationModal = () => setIsModalCancellationOpen(false); // Function to close the modal
  const handleCancel = async (id) => {
    alert(id);
    const submitter = await fetch("/api/cancelledorders", {
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
  };

  // Handle submit button click
  const handleSubmit = () => {
    setIsEditing(false); // Disable editing after submit
  };

  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditing, setIsEditing] = useState(""); // Track whether the input is focused (being edited)

  // Handle the input box focus and blur events
  const handleFocus = () => {
    setIsEditing(true);
  };
  const handleBlur = () => {
    setIsEditing(false);
  };
  const triggerError = () => {
    setErrorMessage("الطلب تم رفضه");
    setIsModalOpen(true);
  };

  const closeErrorModal = () => {
    setFormData({ bookingstatus: "" });
    setIsErrorModalOpen(false);
    // setErrorMessage("");
  };
  const toggleEditable = (index) => {};
  const [isModalBooksOpen, setIsModalBooksOpen] = useState(false);

  const openBooksModal = () => setIsModalBooksOpen(true); // Open modal
  const closeBooksModal = () => setIsModalBooksOpen(false); // Close modal
  return (
    <Layout>
      {/* min-h-screen */}
      {formData.bookingstatus == "طلب مرفوض" ? (
        <ErrorModal
          message={errorMessage}
          onClose={closeErrorModal}
          isErrorModalOpen={isErrorModalOpen}
        />
      ) : null}
      <SpinnerModal isOpen={isModalSpinnerOpen} onClose={closespinnerModal} />

      <div className=" py-8">
        {/* <div className="container mx-auto p-4">
          <button
            className="flex items-center space-x-2 bg-pink-400 text-white py-2 px-4 rounded-lg hover:bg-pink-600 transition duration-200"
            onClick={() => openBooksModal()}
          >
            <FaFileSignature className="h-6 w-6" />
            <span>ملفات الطلب</span>
          </button>
        </div> */}
        {isModalBooksOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            {/* Modal Content */}
            <div className="bg-white w-full sm:w-96 p-6 rounded-lg shadow-lg">
              {/* Modal Header */}
              <CancelBooking
                bookingstatus="عقد ملغي"
                date={formData.createdAt}
                phone={formData.clientphonenumber}
                reason={Canceelationreason}
                name={formData.ClientName}
                id={formData.id}
                setReason={setCancellationReason} // Passing setReason if needed
                OpenCancellation={OpenCancellationModal}
                handleCancelModal={handleCancelationModal}
                handleCancel={handleCancel}
                isModalCancellationOpen={isModalCancellationOpen}
              />
              {/* Modal Body */}
              <div className="mb-6 text-gray-600">
                <div className="col-span-3">
                  <label
                    htmlFor="medicalCheckFile"
                    className="block font-semibold text-sm"
                  >
                    رفع ملف الفحص الطبي
                  </label>
                  <div className="flex flex-col items-start bg-gray-100 rounded-md">
                    {/* Hidden file input */}
                    <input
                      id="medicalCheckFile"
                      name="medicalCheckFile"
                      type="file"
                      className="hidden"
                      onChange={handleUploadmedicalcheckfile}
                    />
                    {/* Custom file upload button */}
                    <label
                      htmlFor="medicalCheckFile"
                      className="px-6 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
                    >
                      اختار الملف
                    </label>

                    {/* Display uploaded image or file status */}
                    {medicalCheckFileCloudinaryImage && (
                      <div className="mt-2 text-gray-600">
                        <span>File Uploaded: </span>
                        <a
                          href={medicalCheckFileCloudinaryImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-300 hover:underline"
                        >
                          عرض الملف
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-3">
                  <label
                    htmlFor="ticketFile"
                    className="block font-semibold text-sm"
                  >
                    رفع ملف التذكرة
                  </label>
                  <div className="flex flex-col bg-gray-100 items-start">
                    {/* Hidden file input */}
                    <input
                      id="ticketFile"
                      name="ticketFile"
                      type="file"
                      className="hidden"
                      onChange={handleUploadticketFile}
                    />
                    {/* Custom file upload button */}
                    <label
                      htmlFor="ticketFile"
                      className="px-6 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
                    >
                      اختار الملف
                    </label>

                    {/* Display uploaded image or file status */}
                    {ticketFileFileCloudinaryImage && (
                      <div className="mt-2 text-gray-600">
                        <span>File Uploaded: </span>
                        <a
                          href={ticketFileFileCloudinaryImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-500 hover:underline"
                        >
                          عرض الملف
                        </a>
                      </div>
                    )}
                  </div>

                  {formik.errors.ticketFile && formik.touched.ticketFile && (
                    <div className="text-red-600 text-sm mt-1">
                      {formik.errors.ticketFile}
                    </div>
                  )}
                </div>

                <div className="col-span-3">
                  <label
                    htmlFor="receivingFile"
                    className="block font-semibold text-sm"
                  >
                    رفع ملف الاستلام
                  </label>
                  <div className="flex flex-col items-start">
                    {/* Hidden file input */}
                    <input
                      id="receivingFile"
                      name="receivingFile"
                      type="file"
                      className="hidden"
                      onChange={handleUploadreceivingFile}
                    />
                    {/* Custom file upload button */}
                    <label
                      htmlFor="receivingFile"
                      className="px-6 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
                    >
                      اختار الملف
                    </label>

                    {/* Display uploaded image or file status */}
                    {receivingFileCloudinaryImage && (
                      <div className="mt-2 text-gray-600">
                        <span>File Uploaded: </span>
                        <a
                          href={receivingFileCloudinaryImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-500 hover:underline"
                        >
                          عرض الملف
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-3">
                  <label
                    htmlFor="approvalPayment"
                    className="block font-semibold text-sm"
                  >
                    رفع اثبات الدفع
                  </label>
                  <div className="flex flex-col items-start bg-gray-100 ">
                    {/* Hidden file input */}
                    <input
                      id="approvalPayment"
                      name="approvalPayment"
                      type="file"
                      className="hidden"
                      onChange={handleUploadapprovalPayment}
                    />
                    {/* Custom file upload button */}
                    <label
                      htmlFor="approvalPayment"
                      className="px-6 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
                    >
                      اختار الملف
                    </label>

                    {/* Display uploaded image or file status */}
                    {approvalPaymentFileCloudinaryImage && (
                      <div className="mt-2 text-gray-600 ">
                        <span>File Uploaded: </span>
                        <a
                          href={approvalPaymentFileCloudinaryImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-500 hover:underline"
                        >
                          عرض الملف
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom File Upload Field */}
                <div>
                  <label
                    htmlFor="additionalfiles"
                    className="block font-semibold text-sm"
                  >
                    ملفات اخرى
                  </label>
                  <div className="flex flex-col items-start">
                    {/* Hidden file input with multiple attribute */}
                    <input
                      id="additionalfiles"
                      name="additionalfiles"
                      type="file"
                      className="hidden"
                      multiple
                      onChange={handleUpload}
                    />
                    {/* Custom file upload button */}
                    <label
                      htmlFor="additionalfiles"
                      className="px-6 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
                    >
                      Choose Files
                    </label>

                    {/* Display uploaded images or file statuses */}
                    {cloudinaryImages.length > 0 && (
                      <div className="mt-2 text-gray-600">
                        <span>Uploaded Files:</span>
                        <ul>
                          {cloudinaryImages.map((image, index) => (
                            <li key={index} className="mt-1">
                              <a
                                href={image}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-500 hover:underline"
                              >
                                File {index + 1}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={closeBooksModal}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => alert("Confirmed!")}
                  className="bg-orange-400 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          message={modalMessage}
          type={modalType}
          onClose={closeSuccessfulModal}
        />
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8">
            Details:
            {formData.ClientName ? formData.ClientName : ""}
          </h1>
          {/* Timeline Component with Clickable Stages */}
          <Timeline
            currentstatus={formData.bookingstatus}
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
            <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
              <h2 className="text-2xl font-semibold mb-4">
                Client Information
              </h2>
              <div className="space-y-4">
                <p>
                  <strong>Name:</strong> {formData.ClientName}
                </p>
                <div className="flex items-center space-x-2">
                  <p className="flex-1">
                    <strong>Email:</strong> {formData.client.email}
                  </p>
                  <a
                    href={`mailto:${formData.client.email}`}
                    className="text-white bg-blue-500 px-4 py-2 rounded-lg"
                  >
                    Message
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <p className="flex-1">
                    <strong>Phone:</strong> {formData.client.phonenumber}
                  </p>
                  <a
                    href={`https://wa.me/${formData.client.phonenumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white bg-green-500 px-4 py-2 rounded-lg"
                  >
                    WhatsApp
                  </a>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <strong className="w-32">Order ID:</strong>
                  </div>

                  <div className="flex justify-between items-center">
                    <strong className="w-32">Name:</strong>
                    <span>{formData.HomeMaid.Name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <VerticalTimeline
              animate={true}
              lineColor="PURPLE"
              layout="1-column-left"
            >
              <VerticalTimelineElement
                className="vertical-timeline-element--work"
                date={formData.createdAt}
                iconStyle={{
                  background: "RGB(255, 182, 193)",
                  color: "#fff",
                }}
              >
                <h1
                  style={{ justifyContent: "center", display: "flex" }}
                  className={Style["almarai-bold"]}
                >
                  التقديم
                </h1>
                <p>تم استلام الطلب</p>
              </VerticalTimelineElement>

              <VerticalTimelineElement
                className="vertical-timeline-element--work"
                iconStyle={{
                  background: "RGB(255, 182, 193)",
                  color: "#fff",
                }}
                contentArrowStyle={{
                  borderRight: "7px solid  rgb(255, 229, 180)",
                }}
                // date="2011 - present"
                iconStyle={{
                  background: "RGB(255, 94, 77)",
                  color: "#fff",
                }}
              >
                {/* formData.bookingStatus === "الربط" */}
                {stages.indexOf(formData.bookingstatus) >=
                  stages.indexOf("موافقة المكتب الخارجي") &&
                isEditing !== "موافقة المكتب الخارجي" ? (
                  <>
                    <h1
                      style={{ justifyContent: "center", display: "flex" }}
                      className={Style["almarai-bold"]}
                    >
                      موافقة المكتب الخارجي
                    </h1>
                    {/* <p>{getDate("موافقة")}</p> */}
                    <button
                      className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => setIsEditing("موافقة المكتب الخارجي")}
                    >
                      تعديل
                    </button>
                  </>
                ) : (
                  <div className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md">
                    <div className="mb-4">
                      <label
                        for="input"
                        className="block text-sm font-medium text-gray-700"
                      >
                        موافقة المكتب الخارجي
                      </label>
                      <input
                        ref={externalOfficeAprrovalRef}
                        type="date"
                        id="input"
                        name="input"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter something..."
                      />
                    </div>

                    <div className="flex flex-row justify-center space-x-4">
                      <button
                        onClick={() => setIsEditing("")}
                        className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        الغاء التعديل
                      </button>

                      <button
                        type="submit"
                        onClick={() =>
                          handleAccessFormDateSubmitOfficeApproval({
                            ExternalOFficeApproval:
                              externalOfficeAprrovalRef.current.value,
                            bookingstatus: "موافقة المكتب الخارجي",
                          })
                        }
                        className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        تأكيد
                      </button>
                    </div>
                  </div>
                )}
              </VerticalTimelineElement>

              <VerticalTimelineElement
                className="vertical-timeline-element--work"
                iconStyle={{
                  background: "RGB(255, 182, 193)",
                  color: "#fff",
                }}
                contentArrowStyle={{
                  borderRight: "7px solid  rgb(255, 229, 180)",
                }}
                // date="2011 - present"
              >
                {(stages.indexOf(formData.bookingstatus) >=
                  stages.indexOf("الربط")) &
                (isEditing !== "الربط مع مساند") ? (
                  <>
                    <h1
                      style={{ justifyContent: "center", display: "flex" }}
                      className={Style["almarai-bold"]}
                    >
                      الربط
                    </h1>
                    <p>تم الربط مع مساند </p>

                    <button
                      className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => setIsEditing("الربط مع مساند")}
                    >
                      تعديل
                    </button>
                  </>
                ) : (
                  // <div className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md">
                  <>
                    <div className="mb-4">
                      <label
                        for="input"
                        className="block text-sm font-medium text-gray-700"
                      >
                        عقد مساند
                      </label>

                      <input
                        ref={musanadRef}
                        type="text"
                        id="input"
                        name="input"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter something..."
                      />

                      <label
                        for="input"
                        className="block text-sm font-medium text-gray-700"
                      >
                        المدة في مساند
                      </label>

                      <input
                        ref={musanadDateRef}
                        type="date"
                        id="input"
                        name="input"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-row justify-center space-x-4">
                      <button
                        onClick={() => setIsEditing("")}
                        className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        الغاء التعديل
                      </button>

                      <button
                        type="submit"
                        onClick={() =>
                          handleAccessFormSubmit({
                            bookingstatus: "الربط",
                            InternalmusanedContract: musanadRef.current.value,
                            MusanadDuration: musanadDateRef.current.value,
                          })
                        }
                        className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        تأكيد
                      </button>
                    </div>
                  </>
                  // </div>
                )}
              </VerticalTimelineElement>
              <VerticalTimelineElement
                className="vertical-timeline-element--work"
                // date={form.createdAt}
                iconStyle={{
                  background: "rgb(128, 25, 243)",
                  color: "#ffc0cb",
                }}
                //  icon={}
              >
                {/* formData.bookingStatus === "الربط" */}
                {(stages.indexOf(formData.bookingstatus) >=
                  stages.indexOf("وصول العاملة")) &
                (isEditing !== "وصول العاملة") ? (
                  <>
                    <h1
                      style={{ justifyContent: "center", display: "flex" }}
                      className={Style["almarai-bold"]}
                    >
                      تاريخ دخول المملكة
                    </h1>
                    {/* <p>{getDate("وصول العاملة")}</p> */}
                    <button
                      className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => setIsEditing("وصول العاملة")}
                    >
                      تعديل
                    </button>
                  </>
                ) : (
                  <div className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md">
                    <div className="mb-4">
                      <label
                        for="input"
                        className="block text-sm font-medium text-gray-700"
                      >
                        تاريخ دخول المملكة
                      </label>
                      <input
                        ref={kingdomEntryRef}
                        type="date"
                        id="input"
                        name="input"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <button
                        // type="submit"
                        onClick={() => handleAccessEntryDate()}
                        className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        تأكيد
                      </button>
                    </div>
                  </div>
                )}
              </VerticalTimelineElement>
            </VerticalTimeline>
            <table className="min-w-full table-auto border-collapse bg-white shadow-md rounded-md">
              <thead>
                <tr className="bg-purple-600 text-white">
                  <th className="p-3 text-left text-sm font-medium">
                    اسم الكفيل
                  </th>
                  <th className="p-3 text-left text-sm font-medium">
                    تاريخ التختيم
                  </th>
                  <th className="p-3 text-left text-sm font-medium">
                    الربط مع الوكالة
                  </th>
                  <th className="p-3 text-left text-sm font-medium">
                    انتهاء الضمان
                  </th>

                  {/* <th className="p-3 text-left text-sm font-medium">Role</th> */}
                </tr>
              </thead>
              <tbody>
                {formData.arrivals.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-3 text-center text-sm text-gray-500"
                    >
                      No results found
                    </td>
                  </tr>
                ) : (
                  formData.arrivals.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3 text-lg text-gray-700">
                        {item.SponsorName}
                      </td>
                      <td className="p-3 text-lg text-gray-700">
                        {item.EmbassySealing
                          ? new Date(item.EmbassySealing).toLocaleDateString()
                          : null}
                      </td>
                      <td className="p-3 text-lg text-gray-700">
                        {item.AgencyDate
                          ? new Date(item.AgencyDate).toLocaleDateString()
                          : null}
                      </td>
                      <td className="p-3 text-lg text-gray-700">
                        {item.GuaranteeDurationEnd
                          ? new Date(
                              item.GuaranteeDurationEnd
                            ).toLocaleDateString()
                          : null}
                      </td>

                      {/* <td className="p-3 text-sm text-gray-600">{item.role}</td> */}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
            {/* Button to toggle the form */}
            <button
              onClick={toggleFormVisibility}
              className="mb-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
            >
              {isFormVisible ? "الغاء عملية التحديث" : "تحديث بيانات الوصول "}
            </button>
            {isFormVisible && (
              <form onSubmit={formik.handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
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

                  <div className="col-span-3">
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

          <div className="grid grid-cols-1 lg:grid-cols-1 mt-7 gap-6">
            <div className="bg-white w-full  p-6 rounded-lg shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  صندوق رفع الملفات
                </h2>
                <button
                  onClick={closeBooksModal}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="h-6 w-6"
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

              {/* Modal Body */}
              <div className="mb-6 text-gray-600">
                <div className="col-span-3">
                  <label
                    htmlFor="medicalCheckFile"
                    className="block font-semibold text-sm"
                  >
                    رفع ملف الفحص الطبي
                  </label>
                  <div className="flex flex-col items-start bg-gray-100 rounded-md">
                    {/* Hidden file input */}
                    <input
                      id="medicalCheckFile"
                      name="medicalCheckFile"
                      type="file"
                      className="hidden"
                      onChange={handleUploadmedicalcheckfile}
                    />
                    {/* Custom file upload button */}
                    <label
                      htmlFor="medicalCheckFile"
                      className="px-6 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
                    >
                      اختار الملف
                    </label>

                    {/* Display uploaded image or file status */}
                    {medicalCheckFileCloudinaryImage && (
                      <div className="mt-2 text-gray-600">
                        <span>File Uploaded: </span>
                        <a
                          href={medicalCheckFileCloudinaryImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-300 hover:underline"
                        >
                          عرض الملف
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-3">
                  <label
                    htmlFor="ticketFile"
                    className="block font-semibold text-sm"
                  >
                    رفع ملف التذكرة
                  </label>
                  <div className="flex flex-col bg-gray-100 items-start">
                    {/* Hidden file input */}
                    <input
                      id="ticketFile"
                      name="ticketFile"
                      type="file"
                      className="hidden"
                      onChange={handleUploadticketFile}
                    />
                    {/* Custom file upload button */}
                    <label
                      htmlFor="ticketFile"
                      className="px-6 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
                    >
                      اختار الملف
                    </label>

                    {/* Display uploaded image or file status */}
                    {ticketFileFileCloudinaryImage && (
                      <div className="mt-2 text-gray-600">
                        <span>File Uploaded: </span>
                        <a
                          href={ticketFileFileCloudinaryImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-500 hover:underline"
                        >
                          عرض الملف
                        </a>
                      </div>
                    )}
                  </div>

                  {formik.errors.ticketFile && formik.touched.ticketFile && (
                    <div className="text-red-600 text-sm mt-1">
                      {formik.errors.ticketFile}
                    </div>
                  )}
                </div>

                <div className="col-span-3">
                  <label
                    htmlFor="receivingFile"
                    className="block font-semibold text-sm"
                  >
                    رفع ملف الاستلام
                  </label>
                  <div className="flex flex-col items-start">
                    {/* Hidden file input */}
                    <input
                      id="receivingFile"
                      name="receivingFile"
                      type="file"
                      className="hidden"
                      onChange={handleUploadreceivingFile}
                    />
                    {/* Custom file upload button */}
                    <label
                      htmlFor="receivingFile"
                      className="px-6 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
                    >
                      اختار الملف
                    </label>

                    {/* Display uploaded image or file status */}
                    {receivingFileCloudinaryImage && (
                      <div className="mt-2 text-gray-600">
                        <span>File Uploaded: </span>
                        <a
                          href={receivingFileCloudinaryImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-500 hover:underline"
                        >
                          عرض الملف
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-3">
                  <label
                    htmlFor="approvalPayment"
                    className="block font-semibold text-sm"
                  >
                    رفع اثبات الدفع
                  </label>
                  <div className="flex flex-col items-start bg-gray-100 ">
                    {/* Hidden file input */}
                    <input
                      id="approvalPayment"
                      name="approvalPayment"
                      type="file"
                      className="hidden"
                      onChange={handleUploadapprovalPayment}
                    />
                    {/* Custom file upload button */}
                    <label
                      htmlFor="approvalPayment"
                      className="px-6 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
                    >
                      اختار الملف
                    </label>

                    {/* Display uploaded image or file status */}
                    {approvalPaymentFileCloudinaryImage && (
                      <div className="mt-2 text-gray-600 ">
                        <span>File Uploaded: </span>
                        <a
                          href={approvalPaymentFileCloudinaryImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-500 hover:underline"
                        >
                          عرض الملف
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom File Upload Field */}
                <div>
                  <label
                    htmlFor="additionalfiles"
                    className="block font-semibold text-sm"
                  >
                    ملفات اخرى
                  </label>
                  <div className="flex flex-col items-start">
                    {/* Hidden file input with multiple attribute */}
                    <input
                      id="additionalfiles"
                      name="additionalfiles"
                      type="file"
                      className="hidden"
                      multiple
                      onChange={handleUpload}
                    />
                    {/* Custom file upload button */}
                    <label
                      htmlFor="additionalfiles"
                      className="px-6 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
                    >
                      Choose Files
                    </label>

                    {/* Display uploaded images or file statuses */}
                    {cloudinaryImages.length > 0 && (
                      <div className="mt-2 text-gray-600">
                        <span>Uploaded Files:</span>
                        <ul>
                          {cloudinaryImages.map((image, index) => (
                            <li key={index} className="mt-1">
                              <a
                                href={image}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-500 hover:underline"
                              >
                                File {index + 1}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              {/* Modal Footer */}
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={closeBooksModal}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() =>
                    handleAccessFormSubmit({
                      medicalCheckFile: medicalCheckFileCloudinaryImage,
                      ticketFile: ticketFileFileCloudinaryImage,
                      receivingFile: receivingFileCloudinaryImage,
                      approvalPayment: approvalPaymentFileCloudinaryImage,
                      additionalfiles: cloudinaryImages,
                    })
                  }
                  className="bg-orange-400 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SlugPage;
