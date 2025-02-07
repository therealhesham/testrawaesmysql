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
import jwt from "jsonwebtoken";
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
    arrivals: [
      {
        MusanadDuration: "",
        KingdomentryDate: "",
        ExternalOFficeApproval: "",
        EmbassySealing: "",
        finalDestinationDate: "",
      },
    ],
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
  const finalDestinationDateRef = useRef(null);
  const musanadRef = useRef();
  const ExternalStatusByofficeRef = useRef(null);
  const finalDestinationRef = useRef(null);
  const deliveryDateRef = useRef(null);
  const deparatureDateRef = useRef(null);
  const externalOfficeStatus = useRef();
  const kingdomEntryRef = useRef(null);
  const arrivalCityRef = useRef(null);
  const agencyDateRef = useRef(null);
  const checkRef = useRef(null);
  const arrivalDateRef = useRef(null);
  const embassySealingRef = useRef(null);
  const externalOfficeAprrovalRef = useRef(null);
  const musanadDateRef = useRef();
  const externalMusanadDateRef = useRef(null);
  const guaranteeref = useRef();
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
      setSubmitted(true);
      setDate(Date.now());
    }
  };

  const cancel = async () => {
    const submitter = await fetch("/api/cancelledorders", {
      method: "post",
      headers: {
        Accept: "application/json",

        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: router.query.slug,
      }),
    });

    // alert(submitter.status);
    if (submitter.status == 200) {
      // alert(submitter.status);
      router.push("/admin/cancelledcontracts");
      setDate(Date.now());
      setSubmitted(true);
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
  const [externalFileCloudinaryImage, setExternalFileCloudinaryImage] =
    useState<string | null>(null);
  const [medicalCheckFileCloudinaryImage, setmedicalCheckFileCloudinaryImage] =
    useState<string | null>(null);
  const [ticketFileFileCloudinaryImage, setTicketFileCloudinaryImage] =
    useState<string | null>(null);
  const [receivingFileCloudinaryImage, setreceivingFileCloudinaryImage] =
    useState<string | null>(null);

  const [externalOfficeFile, setExternalOfficeFile] = useState<string | null>(
    null
  );

  const handleUploadExternalOfficeFile = async (
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

        setExternalOfficeFile(response.data.secure_url); // Update image URL
      } catch (error) {
        console.error(error);
      }
    }
  };

  const [signatureFile, setSignatureFile] = useState<string | null>(null);
  const handleUploadSignatureFile = async (
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

        setSignatureFile(response.data.secure_url); // Update image URL
      } catch (error) {
        console.error(error);
      }
    }
  };

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

  const handleUploadexternalFile = async (
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

        setExternalFileCloudinaryImage(response.data.secure_url); // Update image URL
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
      setDate(Date.now());
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
        externalOfficeStatus: externalOfficeStatus.current.value,
        HomemaidName: formData.HomeMaid.Name,
        ExternalOFficeApproval: new Date(
          externalOfficeAprrovalRef.current.value
        ).toISOString(),
        bookingstatus: "الربط مع المكتب الخارجي",
      }),
    });
    // max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-md
    // console.log(submitter);

    const res = await submitter.json();
    if (submitter.status == 200) {
      setModalSpinnerOpen(false);

      showSuccessModal();
      setDate(Date.now());
    } else {
      setModalSpinnerOpen(false);

      showErrorModal();
    }
    // closeModal(); // Close the modal after submission
  };

  const handleAccessFormSubmit = async (s) => {
    // setModalSpinnerOpen(true);
    // Adding to access list
    if (isEditing) {
      s.bookingstatus = formData.bookingstatus;
      // setFormData((prev) => { ...prev, bookingstatus: "" });
    }
    console.log(s);
    // e.preventDefault();
    const {
      finalDestinationDate,
      deparatureDate,
      externalmusanadcontractfile,
      SponsorName,
      DeliveryDate,
      medicalCheckFile,
      ticketFile,
      receivingFile,
      approvalPayment,
      additionalfiles,
      externalOfficeStatus,
      InternalmusanedContract,
      SponsorIdnumber,
      ExternalStatusByoffice,
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
      finaldestination,
      DateOfApplication,
      DeliveryFile,
      MusanadDuration,
      ExternalDateLinking,
      ExternalOFficeApproval,
      externalmusanedContract,
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
        ExternalStatusByoffice,
        deparatureDate,
        finalDestinationDate,
        DeliveryDate,
        Orderid: formData.id,
        WorkDuration,
        Cost,
        externalOfficeFile: externalOfficeFile,
        finaldestination,
        externalOfficeStatus,
        HomemaIdnumber: formData.HomeMaid.id,
        HomemaidName: formData.HomeMaid.Name,
        Notes,
        externalmusanadcontractfile: externalFileCloudinaryImage,
        bookingstatus,
        medicalCheckFile: medicalCheckFileCloudinaryImage,
        ticketFile: ticketFileFileCloudinaryImage,
        receivingFile: receivingFileCloudinaryImage,
        approvalPayment: approvalPaymentFileCloudinaryImage,
        additionalfiles: additionalfiles,
        externalmusanedContract,
        ArrivalCity,
        DeliveryFile: signatureFile,
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
      setIsEditing("");
      showSuccessModal();
      setDate(Date.now());
    } else {
      setModalSpinnerOpen(false);

      showErrorModal();
    }
    // closeModal(); // Close the modal after submission
  };

  const handleExitClick = () => {
    router.push("/admin/currentorderstest");
  };

  const stages = [
    "الربط مع مساند",

    "الربط مع مساند الخارجي",
    "الربط مع المكتب الخارجي",

    "الفحص الطبي",
    "الربط مع الوكالة",
    "التختيم في السفارة",
    ,
    "حجز التذكرة",
    "الاستلام",

    // "المتابعة",
  ];

  const handleScroll = () => {
    // Scroll to the element with the id "myElement"
    const element = document.getElementById("medicalCheckFile");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" }); // Smooth scroll
    }
  };

  function convertUTCtoSaudiTime(utcDate) {
    // Create a new Date object from the UTC date string
    const date = new Date(utcDate);

    // Convert the date to Saudi Time (UTC +3)
    const saudiTime = new Date(date.getTime() + 3 * 60 * 60 * 1000); // 3 hours added

    return saudiTime;
  }

  // Example usage
  const utcDate = "2025-02-03T10:00:00Z"; // example UTC time
  const saudiTime = convertUTCtoSaudiTime(utcDate);
  console.log(saudiTime); // will output the converted Saudi time

  const [inputClass, setInputclass] = useState("hidden");
  const changeTimeline = async (state) => {
    // alert(state);

    // setModalSpinnerOpen(true);
    try {
      switch (state) {
        case "الربط مع مساند":
          setIsEditing("الربط مع مساند");
          musanadDateRef.current.focus();
          setIsEditing(null);
          break;

        case "الفحص الطبي":
          setIsEditing("الفحص الطبي");
          checkRef.current.focus();
          // router.locale("")
          // setInputclass("hidden");
          setIsEditing(null);

          // handleScroll();
          break;

        case "الربط مع الوكالة":
          setIsEditing("الربط مع الوكالة");
          agencyDateRef.current.focus();
          setIsEditing(null);

          break;

        case "الربط مع مساند الخارجي":
          setIsEditing("الربط مع مساند الخارجي");
          externalMusanadDateRef.current.focus();
          setIsEditing(null);

          break;

        case "الربط مع المكتب الخارجي":
          setIsEditing("الربط المكتب الخارجي");
          externalOfficeAprrovalRef.current.focus();
          setIsEditing(null);

          break;

        case "وصول العاملة":
          setIsEditing("وصول العاملة");
          kingdomEntryRef.current.focus();
          setIsEditing(null);

          break;
        case "التختيم في السفارة":
          setIsEditing("التختيم في السفارة");
          embassySealingRef.current.focus();
          setIsEditing(null);

          break;

        case "حجز التذكرة":
          setIsEditing("حجز التذكرة");
          arrivalDateRef.current.focus();
          setIsEditing(null);

          break;

        case "الاستلام":
          setIsEditing("الاستلام");
          deliveryDateRef.current.focus();

          // handleChangeReservationtoend("طلب منتهي");
          setIsEditing(null);

          break;

        default:
          break;
      }
    } catch (e) {
      console.log(e);
    }
    // alert(fetcher.status);
    // console.log(updatekingdomentry.current);
  };
  function AddgoDays(date) {
    const currentDate = new Date(date); // Original date
    currentDate.setDate(currentDate.getDate() + 90); // Add 90 days
    const form = currentDate.toISOString().split("T")[0];
    console.log(currentDate);
    return form;
  }

  function getDate(date) {
    const currentDate = new Date(date); // Original date
    // currentDate.setDate(currentDate.getDate() + 90); // Add 90 days
    const form = currentDate.toISOString().split("T")[0];
    console.log(currentDate);
    return form;
  }

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
  const [showAdditionalDestination, setShowAdditionalDestination] =
    useState(false); // State to toggle additional destination

  const handleToggleDestination = () => {
    setShowAdditionalDestination(!showAdditionalDestination); // Toggle the state when the button is clicked
  };
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
    const submitter = await fetch("/api/cancelledorders", {
      method: "post",
      headers: {
        Accept: "application/json",

        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        // ReasonOfRejection: reason,
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

  // State to store the number of days remaining
  const [daysRemaining, setDaysRemaining] = useState();

  // Target date (change this to your desired date)
  const targetDate = new Date(
    AddgoDays(formData.arrivals[0]?.MusanadDuration || null)
  );

  // Function to calculate the days remaining
  const calculateDaysRemaining = () => {
    const currentDate = new Date();
    const diffTime = targetDate - currentDate; // Difference in milliseconds
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
    setDaysRemaining(diffDays);
  };

  // Use effect to calculate the days on load
  useEffect(() => {
    if (!formData.arrivals[0].MusanadDuration) return;
    calculateDaysRemaining();
    const interval = setInterval(calculateDaysRemaining, 86400000); // Recalculate every 24 hours

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [formData.arrivals[0]?.MusanadDuration]);

  const [guaranteearrivaldaysRemaining, setguaranteearrivaldaysRemaining] =
    useState();

  // Target date (change this to your desired date)
  const guaranteetargetDate = new Date(
    AddgoDays(formData.arrivals[0]?.KingdomentryDate || null)
  );

  // Function to calculate the days remaining
  const calculateKingdomentryDateDaysRemaining = () => {
    const currentDate = new Date();
    const diffTime = guaranteetargetDate - currentDate; // Difference in milliseconds
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
    setguaranteearrivaldaysRemaining(diffDays);
  };

  // Use effect to calculate the days on load
  useEffect(() => {
    if (!formData.arrivals[0].MusanadDuration) return;
    calculateDaysRemaining();
    const interval = setInterval(calculateDaysRemaining, 86400000); // Recalculate every 24 hours

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [formData.arrivals[0]?.MusanadDuration]);

  useEffect(() => {
    if (!formData.arrivals[0].KingdomentryDate) return;
    calculateKingdomentryDateDaysRemaining();
    const interval = setInterval(
      calculateKingdomentryDateDaysRemaining,
      86400000
    ); // Recalculate every 24 hours

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [formData.arrivals[0]?.KingdomentryDate]);

  const toggleEditable = (index) => {};
  const [isModalBooksOpen, setIsModalBooksOpen] = useState(false);

  const openBooksModal = () => setIsModalBooksOpen(true); // Open modal
  const closeBooksModal = () => setIsModalBooksOpen(false); // Close modal
  return (
    <Layout>
      {/* <div className="flex items-center justify-center  bg-gray-100">
        {formData.arrivals[0].MusanadDuration && (
          <div className="text-center p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-3xl font-semibold mb-4">انتهاء مدة الضمان</h1>
            <div className="text-5xl font-bold text-blue-600">
              {daysRemaining !== null ? (
                <p>
                  {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
                </p>
              ) : (
                <p>Loading...</p>
              )}
            </div>
            <p className="mt-4 text-lg text-gray-500">
              Countdown to {targetDate.toLocaleDateString()}
            </p>
          </div>
        )}
      </div> */}
      {/* min-h-screen */}
      {formData.bookingstatus == "طلب مرفوض" ? (
        <ErrorModal
          message={errorMessage}
          onClose={closeErrorModal}
          isErrorModalOpen={isErrorModalOpen}
        />
      ) : null}
      <SpinnerModal isOpen={isModalSpinnerOpen} onClose={closespinnerModal} />
      <CancelBooking
        bookingstatus={formData.bookingstatus}
        date={formData.createdAt}
        phone={formData.clientphonenumber}
        reason={Canceelationreason}
        name={formData.ClientName}
        id={formData.id}
        setReason={setCancellationReason} // Passing setReason if needed
        OpenCancellation={OpenCancellationModal}
        handleCancelModal={handleCancelationModal}
        handleCancel={cancel}
        isModalCancellationOpen={isModalCancellationOpen}
      />
      <div className=" py-8">
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
            {formData.ClientName ? formData.ClientName : ""}: طلب
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

          <div
            className="grid grid-cols-1 lg:grid-cols-1 gap-6 bg-white p-6 rounded-lg shadow-lg mt-6"
            dir="rtl"
          >
            <h2
              className="text-2xl font-semibold mb-4 "
              style={{ display: "flex", justifyContent: "center" }}
            >
              معلومات الطلب
            </h2>
            <div className="  grid grid-cols-2 gap-0 justify-center">
              <strong className="grid-cols-1">الاسم</strong>
              <p className="grid-cols-2">{formData.ClientName}</p>
              {/* <div className="flex items-center space-x-2"> */}
              <strong className="grid-cols-1">البريد الالكتروني</strong>
              <p className="grid-cols-2">{formData.client.email}</p>
              {/* <a
                href={`mailto:${formData.client.email}`}
                className="text-white bg-blue-500 px-4 py-2 rounded-lg"
              >
                Message
              </a> */}
              {/* </div> */}
              {/* <div className="flex items-center space-x-2"> */}
              <strong className="grid-cols-1">جوال العميل</strong>
              <p className="flex-1 grid-cols-2">
                {formData.client.phonenumber}
              </p>
              {/* <a
                  href={`https://wa.me/${formData.client.phonenumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white bg-green-500 px-4 py-2 rounded-lg"
                >
                  WhatsApp
                </a> */}
              {/* </div> */}
              {/* <div className="space-y-2"> */}
              {/* <div className="flex justify-between items-center"> */}
              <strong className="w-32 grid-cols-1">رقم الطلب</strong>
              <p className="flex-1 grid-cols-2">{formData.id}</p>

              {/* </div> */}
              {/* </div> */}
              {/* <div className="flex justify-between items-center"> */}
              <strong className="w-32 grid-cols-1">اسم العاملة</strong>
              <span className="w-32 grid-cols-1">{formData.HomeMaid.Name}</span>

              {/* </div> */}
              {/* </div> */}
              {/* <div className="flex justify-between items-center"> */}
              <strong className="w-32 grid-cols-1">جواز السفر</strong>
              <span className="w-32 grid-cols-1">
                {formData.HomeMaid.Passportnumber}
              </span>
            </div>
          </div>

          <div className="p-8">
            <VerticalTimeline
              animate={false}
              lineColor="PURPLE"
              layout="1-column-left"
            >
              <VerticalTimelineElement
                className="vertical-timeline-element--work"
                // date={formData.createdAt}
                iconStyle={{
                  background: "RGB(255, 182, 193)",
                  color: "#fff",
                }}
              >
                <div className="flex flex-col">
                  <h1
                    style={{
                      justifyContent: "center",
                      display: "flex",
                      color: "rosybrown",
                    }}
                    className={Style["almarai-bold"]}
                  >
                    التقديم
                  </h1>
                  <p style={{ justifyContent: "center", display: "flex" }}>
                    تم استلام الطلب
                  </p>

                  <strong style={{ justifyContent: "center", display: "flex" }}>
                    {formData.createdAt
                      ? new Date(formData.createdAt).getDate() +
                        " / " +
                        (new Date(formData.createdAt).getMonth() + 1) +
                        " / " +
                        new Date(formData.createdAt).getFullYear()
                      : null}
                  </strong>

                  <strong style={{ justifyContent: "center", display: "flex" }}>
                    {new Date(formData.createdAt).toLocaleTimeString()}
                  </strong>
                </div>
              </VerticalTimelineElement>

              <VerticalTimelineElement
                className="vertical-timeline-element--work flex flex-col"
                iconStyle={{
                  background: "RGB(255, 182, 193)",
                  color: "#fff",
                }}
                contentArrowStyle={{
                  borderRight: "7px solid  rgb(255, 229, 180)",
                }}
                // date="2011 - present"
              >
                {stages.indexOf(formData.bookingstatus) >=
                  stages.indexOf("الربط مع مساند") &&
                isEditing !== "الربط مع مساند" ? (
                  <div className="flex flex-col justify-center">
                    <h1
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        color: "rosybrown",
                      }}
                      className={Style["almarai-bold"]}
                    >
                      الربط
                    </h1>
                    <strong
                      style={{ display: "flex", justifyContent: "center" }}
                    >
                      عقد مساند : &nbsp; &nbsp;
                      {formData.arrivals[0]?.InternalmusanedContract}
                    </strong>

                    <div className="grid grid-cols-3 gap-4 justify-center">
                      <strong
                        style={{
                          // display: "flex",
                          justifyContent: "center",
                          color: daysRemaining < 20 ? "red" : "black",
                        }}
                      >
                        متبقى على انتهاء الضمان &nbsp; {daysRemaining}
                      </strong>

                      <strong>
                        تاريخ انتهاء الضمان : &nbsp; &nbsp;
                        {AddgoDays(formData.arrivals[0].MusanadDuration)}
                      </strong>
                      <strong>
                        تاريخ الربط : &nbsp; &nbsp;
                        {formData.arrivals[0].MusanadDuration}
                      </strong>

                      <button
                        className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 col-span-3"
                        onClick={() => setIsEditing("الربط مع مساند")}
                      >
                        تعديل
                      </button>
                    </div>
                  </div>
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
                        تاريخ مساند
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
                            bookingstatus: "الربط مع مساند",
                            // GuaranteeDurationEnd: guaranteeref.current.value(),

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
                {stages.indexOf(formData.bookingstatus) >=
                  stages.indexOf("الربط مع مساند الخارجي") &&
                isEditing !== "الربط مع مساند الخارجي" ? (
                  <div className="flex flex-col justify-center">
                    <h1
                      style={{
                        justifyContent: "center",
                        display: "flex",
                        color: "rosybrown",
                      }}
                      className={Style["almarai-bold"]}
                    >
                      الربط مع مساند الخارجي
                    </h1>
                    <strong
                      style={{
                        justifyContent: "center",
                        display: "flex",
                      }}
                    >
                      تاريخ الربط : &nbsp;&nbsp;
                      {formData.arrivals[0].externalmusanedContract
                        ? // new Date(
                          getDate(formData.arrivals[0].externalmusanedContract)
                        : // ).toLocaleDateString()
                          null}
                    </strong>

                    {formData.arrivals[0]?.externalmusanadcontractfile && (
                      <div className="mt-2 text-gray-600">
                        <span
                          className={Style["almarai-bold"]}
                          style={{ justifyContent: "center", display: "flex" }}
                        >
                          ملف مساند الخارجي
                        </span>
                        <a
                          style={{ justifyContent: "center", display: "flex" }}
                          href={
                            formData.arrivals[0]?.externalmusanadcontractfile
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-300 hover:underline"
                        >
                          عرض الملف
                        </a>
                      </div>
                    )}

                    <button
                      className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => setIsEditing("الربط مع مساند الخارجي")}
                    >
                      تعديل
                    </button>
                  </div>
                ) : (
                  // <div className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md">
                  <>
                    <div className="mb-4">
                      <label
                        for="input"
                        className="block text-sm font-medium text-gray-700"
                      >
                        تاريخ مساند الخارجي
                      </label>

                      <input
                        ref={externalMusanadDateRef}
                        type="date"
                        id="input"
                        name="input"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <label
                        htmlFor="musanadexternalfile"
                        className="block font-semibold text-sm"
                      >
                        رفع ملف مساند الخارجي
                      </label>
                      <div className="flex flex-col items-start bg-gray-100 rounded-md">
                        {/* Hidden file input */}
                        <input
                          id="musanadexternalfile"
                          name="musanadexternalfile"
                          type="file"
                          // className="hidden"
                          onChange={handleUploadexternalFile}
                        />
                        {/* Custom file upload button */}
                        <label
                          htmlFor="musanadexternalfile"
                          className="px-6 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
                        >
                          اختار الملف
                        </label>

                        {/* Display uploaded image or file status */}
                        {externalFileCloudinaryImage && (
                          <div className="mt-2 text-gray-600">
                            <span>File Uploaded: </span>
                            <a
                              href={externalFileCloudinaryImage}
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
                    <div className="flex flex-row justify-center space-x-4">
                      {/* <div> */}
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
                            bookingstatus: "الربط مع مساند الخارجي",
                            externalmusanedContract:
                              externalMusanadDateRef.current.value,
                            externalmusanadcontractfile:
                              externalFileCloudinaryImage,
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
                  stages.indexOf("الربط مع المكتب الخارجي") &&
                isEditing !== "الربط مع المكتب الخارجي" ? (
                  <div className="flex flex-col">
                    <h1
                      style={{
                        justifyContent: "center",
                        display: "flex",
                        color: "rosybrown",
                      }}
                      className={Style["almarai-bold"]}
                    >
                      موافقة المكتب الخارجي
                    </h1>
                    <h1
                      style={{ justifyContent: "center", display: "flex" }}
                      className={Style["almarai-bold"]}
                    >
                      {formData.arrivals[0]?.ExternalOFficeApproval
                        ? getDate(formData.arrivals[0].ExternalOFficeApproval)
                        : null}
                    </h1>
                    <strong
                      style={{
                        justifyContent: "center",
                        display: "flex",
                        color: "rosybrown",
                      }}
                      className={Style["almarai-bold"]}
                    >
                      حالة الطلب طبقا للشركة
                    </strong>
                    <h1
                      style={{ justifyContent: "center", display: "flex" }}
                      className={Style["almarai-bold"]}
                    >
                      {formData.arrivals[0].externalOfficeStatus}
                    </h1>
                    {formData.arrivals[0].ExternalStatusByoffice ? (
                      <strong
                        style={{
                          justifyContent: "center",
                          display: "flex",
                          color: "rosybrown",
                        }}
                      >
                        حالة الطلب طبقا للمكتب الخارجي
                      </strong>
                    ) : (
                      ""
                    )}

                    {formData.arrivals[0].ExternalStatusByoffice !== "..." ? (
                      <h1
                        style={{ justifyContent: "center", display: "flex" }}
                        className={Style["almarai-bold"]}
                      >
                        {formData.arrivals[0].ExternalStatusByoffice}
                      </h1>
                    ) : (
                      ""
                    )}
                    {/* <p>{getDate("موافقة")}</p> */}

                    {formData.arrivals[0]?.externalOfficeFile && (
                      <div className="mt-2 text-gray-600">
                        <span
                          className={Style["almarai-bold"]}
                          style={{ justifyContent: "center", display: "flex" }}
                        >
                          ملف مساند الخارجي
                        </span>
                        <a
                          style={{ justifyContent: "center", display: "flex" }}
                          href={formData.arrivals[0]?.externalOfficeFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-300 hover:underline"
                        >
                          عرض الملف
                        </a>
                      </div>
                    )}

                    <button
                      className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => setIsEditing("الربط مع المكتب الخارجي")}
                    >
                      تعديل
                    </button>
                  </div>
                ) : (
                  <div>
                    <h1
                      style={{ justifyContent: "center", display: "flex" }}
                      className={Style["almarai-bold"]}
                    >
                      المكتب الخارجي
                    </h1>
                    <div className="mb-4">
                      <label
                        htmlFor="input"
                        className="block text-sm font-medium text-gray-700"
                      >
                        تاريخ موافقة المكتب الخارجي
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

                    {/* <div> */}
                    <label
                      htmlFor="externalOfficeStatus"
                      className="block text-sm font-semibold mb-2"
                    >
                      حالة الطلب
                    </label>
                    <select
                      name="externalOfficeStatus"
                      ref={externalOfficeStatus}
                      id="externalOfficeStatus"
                      // value={newAdmin.role}
                    >
                      <option value="...">...</option>
                      <option value="فحص طبي">فحص طبي</option>
                      <option value="خلو سوابق">خلو سوابق</option>
                      <option value="ارفاق للسفارة">ارفاق للسفارة</option>
                    </select>
                    {/* </div> */}

                    <label
                      htmlFor="ExternalStatusByoffice"
                      className="block text-sm font-semibold mb-2"
                    >
                      حالة الطلب طبقا للمكتب الخارجي
                    </label>
                    <select
                      name="ExternalStatusByoffice"
                      ref={ExternalStatusByofficeRef}
                      id="externalOfficeStatus"
                      // value={newAdmin.role}
                    >
                      <option value="...">...</option>

                      <option value="فحص طبي">فحص طبي</option>
                      <option value="خلو سوابق">خلو سوابق</option>
                      <option value="ارفاق للسفارة">ارفاق للسفارة</option>
                    </select>

                    <div className="col-span-3">
                      <label
                        htmlFor="externalFile"
                        className="block font-semibold text-sm"
                      >
                        رفع ملف
                      </label>
                      <div className="flex flex-col items-start bg-gray-100 rounded-md">
                        {/* Hidden file input */}
                        <input
                          id="externalFile"
                          name="externalFile"
                          type="file"
                          className="px-6 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
                          ref={checkRef}
                          // className={inputClass}
                          onChange={handleUploadExternalOfficeFile}
                        />
                        {/* Custom file upload button */}
                        {/* <label
                          htmlFor="medicalCheckFile"
                        >
                          اختار الملف
                        </label> */}

                        {/* Display uploaded image or file status */}
                        {externalOfficeFile && (
                          <div className="mt-2 text-gray-600">
                            <span>File Uploaded: </span>
                            <a
                              href={externalOfficeFile}
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
                            externalOfficeStatus:
                              externalOfficeStatus.current.value,
                            ExternalOFficeApproval:
                              externalOfficeAprrovalRef.current.value,
                            bookingstatus: "الربط مع المكتب الخارجي",
                            ExternalStatusByoffice:
                              ExternalStatusByofficeRef.current.value,
                            externalOfficeFile: externalOfficeFile,
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
                iconStyle={{
                  background: "RGB(255, 94, 77)",
                  color: "#fff",
                }}
              >
                {/* formData.bookingStatus === "الربط" */}
                {stages.indexOf(formData.bookingstatus) >=
                  stages.indexOf("الفحص الطبي") &&
                isEditing !== "الفحص الطبي" ? (
                  <div className="flex flex-col">
                    <h1
                      style={{
                        justifyContent: "center",
                        display: "flex",
                        color: "rosybrown",
                      }}
                      className={Style["almarai-bold"]}
                    >
                      الفحص الطبي
                    </h1>

                    <h1
                      style={{ justifyContent: "center", display: "flex" }}
                      className={Style["almarai-bold"]}
                    >
                      {/* {formData.arrivals[0].externalOfficeStatus} */}
                    </h1>

                    {formData.arrivals[0]?.medicalCheckFile ? (
                      <div className="mt-2 text-gray-600">
                        <span
                          className={Style["almarai-bold"]}
                          style={{ justifyContent: "center", display: "flex" }}
                        >
                          ملف الكشف الطبي
                        </span>
                        <a
                          style={{ justifyContent: "center", display: "flex" }}
                          href={formData.arrivals[0].medicalCheckFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-300 hover:underline"
                        >
                          عرض الملف
                        </a>
                      </div>
                    ) : null}

                    {/* <p>{getDate("موافقة")}</p> */}
                    <button
                      className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => setIsEditing("الفحص الطبي")}
                    >
                      تعديل
                    </button>
                  </div>
                ) : (
                  <div>
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
                          className="px-6 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
                          ref={checkRef}
                          // className={inputClass}
                          onChange={handleUploadmedicalcheckfile}
                        />
                        {/* Custom file upload button */}
                        {/* <label
                          htmlFor="medicalCheckFile"
                        >
                          اختار الملف
                        </label> */}

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
                            bookingstatus: "الفحص الطبي",
                            medicalCheckFile: medicalCheckFileCloudinaryImage,
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
                // date={form.createdAt}
                iconStyle={{
                  background: "rgb(128, 25, 243)",
                  color: "#ffc0cb",
                }}
                //  icon={}
              >
                {/* formData.bookingStatus === "الربط" */}
                {stages.indexOf(formData.bookingstatus) >=
                  stages.indexOf("الربط مع الوكالة") &&
                isEditing !== "الربط مع الوكالة" ? (
                  <div className="flex flex-col">
                    <h1
                      style={{
                        justifyContent: "center",
                        display: "flex",
                        color: "rosybrown",
                      }}
                      className={Style["almarai-bold"]}
                    >
                      تاريخ الربط مع الوكالة
                    </h1>
                    <strong
                      style={{
                        justifyContent: "center",
                        display: "flex",
                      }}
                    >
                      {formData.arrivals[0]?.AgencyDate
                        ? getDate(formData.arrivals[0].AgencyDate)
                        : null}
                    </strong>
                    {/* <p>{getDate("وصول العاملة")}</p> */}
                    <button
                      className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => setIsEditing("الربط مع الوكالة")}
                    >
                      تعديل
                    </button>
                  </div>
                ) : (
                  <div className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md">
                    <label
                      htmlFor="AgencyDate"
                      className="block font-semibold text-sm"
                    >
                      تاريخ الربط مع الوكالة
                    </label>
                    <input
                      ref={agencyDateRef}
                      id="AgencyDate"
                      name="AgencyDate"
                      type="date"
                      className="w-full border rounded-md px-4 py-2"
                    />

                    <div className="flex flex-row justify-center space-x-4">
                      <button
                        onClick={() => setIsEditing("")}
                        className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        الغاء التعديل
                      </button>

                      <button
                        // type="submit"
                        onClick={() =>
                          handleAccessFormSubmit({
                            bookingstatus: "الربط مع الوكالة",
                            AgencyDate: agencyDateRef.current.value,
                          })
                        }
                        className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        تأكيد
                      </button>
                    </div>
                  </div>

                  //                // </div>
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
                {stages.indexOf(formData.bookingstatus) >=
                  stages.indexOf("التختيم في السفارة") &&
                isEditing !== "التختيم في السفارة" ? (
                  <div className="flex flex-col">
                    <div>
                      <h1
                        style={{
                          justifyContent: "center",
                          display: "flex",
                          color: "rosybrown",
                        }}
                        className={Style["almarai-bold"]}
                      >
                        تاريخ التختيم في السفارة
                      </h1>
                    </div>
                    <div>
                      <strong
                        style={{ display: "flex", justifyContent: "center" }}
                      >
                        {formData.arrivals[0].EmbassySealing
                          ? getDate(formData.arrivals[0].EmbassySealing)
                          : null}
                      </strong>
                    </div>
                    {/* <p>{getDate("وصول العاملة")}</p> */}
                    <button
                      className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => setIsEditing("التختيم في السفارة")}
                    >
                      تعديل
                    </button>
                  </div>
                ) : (
                  <div className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md">
                    <label
                      htmlFor="embassysealing"
                      className="block font-semibold text-sm"
                    >
                      تاريخ التختيم في السفارة
                    </label>
                    <input
                      ref={embassySealingRef}
                      id="embassysealing"
                      name="embassysealing"
                      type="date"
                      className="w-full border rounded-md px-4 py-2"
                    />

                    <div className="flex flex-row justify-center space-x-4">
                      <button
                        onClick={() => setIsEditing("")}
                        className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        الغاء التعديل
                      </button>

                      <button
                        // type="submit"
                        onClick={() =>
                          handleAccessFormSubmit({
                            bookingstatus: "التختيم في السفارة",
                            EmbassySealing: embassySealingRef.current.value,
                          })
                        }
                        className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        تأكيد
                      </button>
                    </div>
                  </div>

                  //                // </div>
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
                {stages.indexOf(formData.bookingstatus) >=
                  stages.indexOf("حجز التذكرة") &&
                isEditing !== "حجز التذكرة" ? (
                  <div className="flex flex-col justify-center">
                    <h1
                      style={{
                        justifyContent: "center",
                        display: "flex",
                        color: "rosybrown",
                      }}
                      className={Style["almarai-bold"]}
                    >
                      حجز التذكرة
                    </h1>
                    <label
                      style={{ justifyContent: "center", display: "flex" }}
                      htmlFor="arrivaldate"
                      className={Style["almarai-bold"]}
                    >
                      تاريخ وصول العاملة
                    </label>
                    <h2
                      style={{
                        justifyContent: "center",
                        display: "flex",
                      }}
                    >
                      {formData.arrivals[0].KingdomentryDate
                        ? getDate(formData.arrivals[0].KingdomentryDate)
                        : null}
                    </h2>
                    <label
                      style={{
                        justifyContent: "center",
                        display: "flex",
                      }}
                      htmlFor="arrivaldate"
                      className={Style["almarai-bold"]}
                    >
                      مدينة وصول العاملة
                    </label>
                    <h2
                      style={{
                        justifyContent: "center",
                        display: "flex",
                      }}
                    >
                      {formData.arrivals[0].ArrivalCity}
                    </h2>

                    <strong
                      style={{ justifyContent: "center", display: "flex" }}
                      className={Style["almarai-bold"]}
                    >
                      تاريخ انتهاء الضمان
                    </strong>

                    <h1 style={{ justifyContent: "center", display: "flex" }}>
                      {" "}
                      {formData.arrivals[0].KingdomentryDate
                        ? AddgoDays(formData.arrivals[0].KingdomentryDate)
                        : null}
                    </h1>
                    <label
                      style={{
                        justifyContent: "center",
                        display: "flex",
                      }}
                      htmlFor="arrivaldate"
                      className={Style["almarai-bold"]}
                    >
                      وجهة العاملة
                    </label>
                    <h2
                      style={{
                        justifyContent: "center",
                        display: "flex",
                      }}
                    >
                      {formData.arrivals[0].finaldestination}
                    </h2>
                    {formData.arrivals[0].deparatureDate ? (
                      <label
                        style={{
                          justifyContent: "center",
                          display: "flex",
                        }}
                        // htmlFor=""
                        className={Style["almarai-bold"]}
                      >
                        تاريخ مغادرة العاملة
                      </label>
                    ) : null}
                    <h2
                      style={{
                        justifyContent: "center",
                        display: "flex",
                      }}
                    >
                      {formData.arrivals[0].deparatureDate
                        ? getDate(formData.arrivals[0].deparatureDate)
                        : null}
                    </h2>

                    {formData.arrivals[0].finalDestinationDate ? (
                      <label
                        style={{
                          justifyContent: "center",
                          display: "flex",
                        }}
                        // htmlFor=""
                        className={Style["almarai-bold"]}
                      >
                        تاريخ وصول العاملة الى الواجهة الاخرى
                      </label>
                    ) : null}
                    <h2
                      style={{
                        justifyContent: "center",
                        display: "flex",
                      }}
                      className={Style["almarai-bold"]}
                    >
                      {formData.arrivals[0].finalDestinationDate
                        ? getDate(formData.arrivals[0].finalDestinationDate)
                        : null}
                    </h2>

                    <label
                      style={{
                        justifyContent: "center",
                        display: "flex",
                        color:
                          guaranteearrivaldaysRemaining < 20 ? "red" : "black",
                      }}
                      // htmlFor=""
                      className={Style["almarai-bold"]}
                    >
                      متبقي على انتهاء الضمان
                    </label>
                    <h2
                      style={{
                        justifyContent: "center",
                        display: "flex",
                      }}
                    >
                      {guaranteearrivaldaysRemaining}
                    </h2>

                    {formData.arrivals[0]?.ticketFile ? (
                      <div className="mt-2 text-gray-600">
                        <span
                          className={Style["almarai-bold"]}
                          style={{ justifyContent: "center", display: "flex" }}
                        >
                          التذكرة
                        </span>
                        <a
                          style={{ justifyContent: "center", display: "flex" }}
                          href={formData.arrivals[0].ticketFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-300 hover:underline"
                        >
                          عرض الملف
                        </a>
                      </div>
                    ) : null}

                    {/* <p>{getDate("وصول العاملة")}</p> */}
                    <button
                      className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => setIsEditing("حجز التذكرة")}
                    >
                      تعديل
                    </button>
                  </div>
                ) : (
                  <div className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md">
                    <label
                      htmlFor="ArrivalCity"
                      className="block font-semibold text-sm"
                    >
                      مدينة وصول العاملة الاساسية
                    </label>
                    <input
                      ref={arrivalCityRef}
                      id="ArrivalCity"
                      name="ArrivalCity"
                      type="text"
                      className="w-full border rounded-md px-4 py-2"
                    />

                    <label
                      htmlFor="arrivaldate"
                      className="block font-semibold text-sm"
                    >
                      تاريخ وصول العاملة
                    </label>
                    <input
                      ref={arrivalDateRef}
                      id="arrivaldate"
                      name="arrivaldate"
                      type="date"
                      className="w-full border rounded-md px-4 py-2"
                    />

                    {/* Plus Button to add additional destination */}
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        type="button"
                        onClick={handleToggleDestination} // Toggle visibility on click
                        className="text-green-600 hover:text-green-800"
                      >
                        <span className="text-lg">+</span> إضافة وجهة أخرى
                      </button>
                    </div>

                    {/* Additional Destination input, conditionally rendered */}
                    {showAdditionalDestination && (
                      <div>
                        <label
                          htmlFor="finaldestination"
                          className="block font-semibold text-sm mt-4"
                        >
                          وجهة أخرى
                        </label>
                        <input
                          ref={finalDestinationRef}
                          id="finaldestination"
                          name="finaldestination"
                          type="text"
                          className="w-full border rounded-md px-4 py-2"
                        />
                      </div>
                    )}

                    <label
                      htmlFor="deparatureDate"
                      className="block font-semibold text-sm"
                    >
                      تاريخ المغادرة من المدينة الاساسية
                    </label>
                    <input
                      ref={deparatureDateRef}
                      id="deparatureDate"
                      name="deparatureDate"
                      type="date"
                      className="w-full border rounded-md px-4 py-2"
                    />

                    <label
                      htmlFor="finalDestinationDate"
                      className="block font-semibold text-sm"
                    >
                      تاريخ الوصول الى وجهة النهائية
                    </label>
                    <input
                      ref={finalDestinationDateRef}
                      id="finalDestinationDate"
                      name="finalDestinationDate"
                      type="date"
                      className="w-full border rounded-md px-4 py-2"
                    />

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

                      <div className="flex flex-row justify-center space-x-4">
                        <button
                          onClick={() => setIsEditing("")}
                          className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                          الغاء التعديل
                        </button>

                        <button
                          // type="submit"
                          onClick={() =>
                            handleAccessFormSubmit({
                              finalDestinationDate:
                                finalDestinationDateRef.current?.value,
                              bookingstatus: "حجز التذكرة",
                              deparatureDate: deparatureDateRef.current?.value
                                ? deparatureDateRef.current.value
                                : "",
                              finaldestination: finalDestinationRef.current
                                ?.value
                                ? finalDestinationRef.current.value
                                : "",
                              KingdomentryDate: arrivalDateRef.current?.value
                                ? arrivalDateRef.current.value
                                : "",
                              ArrivalCity: arrivalCityRef.current?.value
                                ? arrivalCityRef.current.value
                                : "",
                              ticketFile: ticketFileFileCloudinaryImage,
                            })
                          }
                          className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                          تأكيد
                        </button>
                      </div>
                    </div>
                  </div>
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
                {stages.indexOf(formData.bookingstatus) >=
                  stages.indexOf("الاستلام") && isEditing !== "الاستلام" ? (
                  <div className="flex flex-col">
                    <h1
                      style={{ justifyContent: "center", display: "flex" }}
                      className={Style["almarai-bold"]}
                    >
                      الاستلام
                    </h1>
                    <label
                      style={{ justifyContent: "center", display: "flex" }}
                      htmlFor="deliveryDate"
                      className="block font-semibold text-sm"
                    >
                      تاريخ الاستلام
                    </label>
                    <h2 style={{ justifyContent: "center", display: "flex" }}>
                      {formData.arrivals[0].DeliveryDate
                        ? getDate(formData.arrivals[0].DeliveryDate)
                        : null}
                    </h2>

                    {formData.arrivals[0]?.DeliveryFile ? (
                      <div
                        className="mt-2 mb text-gray-600"
                        style={{ justifyContent: "center", display: "flex" }}
                      >
                        <h3
                          style={{ justifyContent: "center", display: "flex" }}
                        >
                          ملف توقيع الاستلام{" "}
                        </h3>
                        <a
                          style={{ justifyContent: "center", display: "flex" }}
                          href={formData.arrivals[0].DeliveryFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-300 hover:underline"
                        >
                          عرض الملف
                        </a>
                      </div>
                    ) : null}
                    <button
                      className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => setIsEditing("الاستلام")}
                    >
                      تعديل
                    </button>
                  </div>
                ) : (
                  <div className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md">
                    <label
                      htmlFor="signatureFile"
                      className="block font-semibold text-sm"
                    >
                      {/* رفع ملف توقيع الاستلام */}
                    </label>
                    <div className="flex flex-col bg-gray-100 items-start">
                      {/* Hidden file input */}
                      <input
                        id="signatureFile"
                        name="signatureFile"
                        type="file"
                        className="hidden"
                        onChange={handleUploadSignatureFile}
                      />

                      <label
                        htmlFor="deliveryinput"
                        className="block text-sm font-medium text-gray-700"
                      >
                        تاريخ الاستلام
                      </label>
                      <input
                        ref={deliveryDateRef}
                        type="date"
                        id="deliveryinput"
                        name="deliveryinput"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />

                      <input
                        id="deliveryfile"
                        name="deliveryfile"
                        type="file"
                        className="hidden"
                        onChange={handleUploadSignatureFile}
                      />

                      {/* Custom file upload button */}
                      <label
                        htmlFor="deliveryfile"
                        className="px-6 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
                      >
                        اختار الملف
                      </label>

                      {/* Display uploaded image or file status */}
                      {signatureFile && (
                        <div className="mt-2 text-gray-600">
                          <span>File Uploaded: </span>
                          <a
                            href={signatureFile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-500 hover:underline"
                          >
                            عرض الملف
                          </a>
                        </div>
                      )}

                      <div>
                        <button
                          // type="submit"
                          onClick={() =>
                            handleAccessFormSubmit({
                              bookingstatus: "الاستلام",
                              DeliveryDate: deliveryDateRef.current.value,
                              // KingdomentryDate: arrivalDateRef.current.value,
                              DeliveryFile: signatureFile,
                              // ticketFile,
                            })
                          }
                          className="py-2 px-4 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                          تأكيد
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </VerticalTimelineElement>
            </VerticalTimeline>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
            {/* Button to toggle the form */}
            <button
              onClick={toggleFormVisibility}
              className="mb-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
            >
              {isFormVisible ? "الغاء الاضافة" : "اضافة ملاحظات"}
            </button>
            {isFormVisible && (
              <form onSubmit={formik.handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
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
