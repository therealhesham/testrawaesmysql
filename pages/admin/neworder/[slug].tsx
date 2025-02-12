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
import {
  FaMapMarked,
  FaFileMedical,
  FaHandsHelping,
  FaLink,
  FaDoorOpen,
  FaAddressBook,
  FaArrowUp,
  FaFileSignature,
  FaUserCheck,
  FaClinicMedical,
  FaRegCheckCircle,
  FaSearchLocation,
  FaTicketAlt,
  FaPlaneArrival,
  FaSign,
  FaCheckCircle,
  FaBoxOpen,
  FaUpload,
} from "react-icons/fa";
import { BookOpenIcon } from "@heroicons/react/outline";
import {
  DeliveredProcedureOutlined,
  LinkedinFilled,
  LinkOutlined,
} from "@ant-design/icons";
import CancelBooking from "example/components/cancelbookingmodal";
import prisma from "pages/api/globalprisma";
import { set } from "mongoose";
// GridLoader
const SlugPage = (prop) => {
  const router = useRouter();

  const [offices, setOffices] = useState(prop.offices);
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
  const [dateDateTime, setDateTime] = useState("");
  const [time, setTime] = useState("");

  const handleDateChange = (e) => {
    setDateTime(e.target.value);
  };

  const handleTimeChange = (e) => {
    setTime(e.target.value);
  };

  const [formDataReservationChange, setFormDataReservationChange] = useState(
    {}
  );
  const finalDestinationDateRef = useRef(null);
  const finalDestinationTimeRef = useRef(null);
  const deparatureTimeRef = useRef(null);
  const deliverySectionRef = useRef();
  const musanadRef = useRef();
  const embassySealingSectionRef = useRef();
  const SponsorIdnumberRef = useRef();
  const officeRef = useRef();
  const arrivalTimeRef = useRef();
  const kingdomEntrySectionRef = useRef();
  const visaNumberRef = useRef();
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
        ReasonOfRejection: Canceelationreason,
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
  // const handleCopy = (text) => {
  //   navigator.clipboard.writeText(text).then(() => {
  //     setCopySuccess("Copied!");
  //     setTimeout(() => {
  //       setCopySuccess("");
  //     }, 2000); // Reset "Copied!" message after 2 seconds
  //   });
  // };

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
    setModalImageSpinnerOpen(true);

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
        setModalImageSpinnerOpen(false);
      } catch (error) {
        setModalImageSpinnerOpen(false);

        console.error(error);
      }
    }
  };

  const [signatureFile, setSignatureFile] = useState<string | null>(null);
  const handleUploadSignatureFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.preventDefault();
    setModalImageSpinnerOpen(true);

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
        setModalImageSpinnerOpen(false);
      } catch (error) {
        console.error(error);

        setModalImageSpinnerOpen(false);
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
    setModalImageSpinnerOpen(true);
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
        setModalImageSpinnerOpen(false);
      } catch (error) {
        setModalImageSpinnerOpen(false);
        console.error(error);
      }
    }
  };

  const handleUploadticketFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    const file = e.target.files && e.target.files[0];
    setModalImageSpinnerOpen(true);

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
        setModalImageSpinnerOpen(false);
      } catch (error) {
        console.error(error);
        setModalImageSpinnerOpen(false);
      }
    }
  };

  const handleUploadexternalFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    const file = e.target.files && e.target.files[0];
    setModalImageSpinnerOpen(true);

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
        setModalImageSpinnerOpen(false);
      } catch (error) {
        console.error(error);
        setModalImageSpinnerOpen(false);
      }
    }
  };

  const sectionLightRef = useRef(null);

  // Step 2: Create a state to track if the section is in view
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    // Step 3: Set up the IntersectionObserver
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Check if the section is in view
        setIsInView(entry.isIntersecting);
      },
      {
        threshold: 0.5, // Adjust the threshold (0.5 means 50% of the section needs to be in view)
      }
    );

    // Step 4: Observe the section element
    if (sectionLightRef.current) {
      observer.observe(sectionLightRef.current);
    }

    // Clean up the observer on component unmount
    return () => {
      if (sectionLightRef.current) {
        observer.unobserve(sectionLightRef.current);
      }
    };
  }, []);

  const handleUploadreceivingFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    const file = e.target.files && e.target.files[0];
    setModalImageSpinnerOpen(true);

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
        setModalImageSpinnerOpen(false);
      } catch (error) {
        console.error(error);
        setModalImageSpinnerOpen(false);
      }
    }
  };
  const handleUploadapprovalPayment = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    const file = e.target.files && e.target.files[0];
    setModalImageSpinnerOpen(true);

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
        setModalImageSpinnerOpen(false);
      } catch (error) {
        console.error(error);
        setModalImageSpinnerOpen(false);
      }
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    const files = e.target.files;
    setModalImageSpinnerOpen(true);

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
          setModalImageSpinnerOpen(false);
        } catch (error) {
          console.error("Error uploading file:", error);
          setModalImageSpinnerOpen(false);
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
        PassportNumber: formData?.Passportnumber,
        Orderid: formData.id,
        HomemaIdnumber: formData.HomeMaid.id,
        HomemaidName: formData.HomeMaid?.Name,
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
        PassportNumber: formData?.Passportnumber,
        Orderid: formData.id,
        HomemaIdnumber: formData.HomeMaid.id,
        externalOfficeStatus: externalOfficeStatus.current.value,
        HomemaidName: formData.HomeMaid?.Name,
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
    if (
      stages.indexOf(formData.bookingstatus) >= stages.indexOf(s.bookingstatus)
    ) {
      s.bookingstatus = formData.bookingstatus;
      // setFormData((prev) => { ...prev, bookingstatus: "" });
    }
    console.log(s);
    // e.preventDefault();
    const {
      KingdomentryTime,
      deparatureTime,
      nationalidNumber,
      finalDestinationDate,
      office,
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
      visaNumber,
      ExternalOFficeApproval,
      externalmusanedContract,
      AgencyDate,
      EmbassySealing,
      BookinDate,
      finalDestinationTime,
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
        PassportNumber: formData?.Passportnumber,
        KingdomentryDate,
        DayDate,
        KingdomentryTime,
        deparatureTime,
        // SponsorIdnumber,
        visaNumber,
        finalDestinationTime,
        ExternalStatusByoffice,
        deparatureDate,
        finalDestinationDate,
        DeliveryDate,
        office,
        Orderid: formData.id,
        WorkDuration,
        Cost,
        nationalidNumber,
        externalOfficeFile: externalOfficeFile,
        finaldestination,
        externalOfficeStatus,
        HomemaIdnumber: formData.HomeMaid.id,
        HomemaidName: formData.HomeMaid?.Name,
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
      scrollToSection();
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
  const [selectedOffice, setSelectedOffice] = useState("");
  const [newOfficeName, setNewOfficeName] = useState("");
  const handleNewOfficeChange = (e) => {
    setNewOfficeName(e.target.value);
    // officeRef.current.value = e.target.value;
  };
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
  const musanadDateSectionRef = useRef();
  const [inputClass, setInputclass] = useState("hidden");
  const [isAnimate, setISAnimate] = useState(true);
  const checkRefSectionRef = useRef();
  const agencyDateSectionRef = useRef();
  const externalOfficeAprrovalSectionRef = useRef();
  const externalMusanadSectionRef = useRef();
  const changeTimeline = async (state) => {
    try {
      switch (state) {
        case "الربط مع مساند":
          musanadDateSectionRef.current.scrollIntoView({ behavior: "smooth" });

          break;

        case "الفحص الطبي":
          checkRefSectionRef.current.scrollIntoView({
            behavior: "smooth",
            // block: "start",
          });
          break;

        case "الربط مع الوكالة":
          agencyDateSectionRef.current.scrollIntoView({ behavior: "smooth" });

          break;

        case "الربط مع مساند الخارجي":
          externalMusanadSectionRef.current.scrollIntoView({
            behavior: "smooth",
          });

          break;

        case "الربط مع المكتب الخارجي":
          externalOfficeAprrovalSectionRef.current.scrollIntoView({
            behavior: "smooth",
          });

          break;

        case "وصول العاملة":
          kingdomEntrySectionRef.current.scrollIntoView({ behavior: "smooth" });
          kingdomEntryRef.current.focus();
          setIsEditing(null);

          break;
        case "التختيم في السفارة":
          setISAnimate(false);
          embassySealingSectionRef.current.scrollIntoView({
            behavior: "smooth",
          });

          break;

        case "حجز التذكرة":
          kingdomEntrySectionRef.current.scrollIntoView({ behavior: "smooth" });

          break;

        case "الاستلام":
          deliverySectionRef.current.scrollIntoView({ behavior: "smooth" });

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

  const parseDate = (dateString) => {
    // Handle DD/MM/YYYY format manually
    const dateParts = dateString.split("/"); // Split by '/' for DD/MM/YYYY format

    if (dateParts.length === 3) {
      const [day, month, year] = dateParts;

      // Create a new Date object with YYYY-MM-DD format
      const formattedDate = new Date(
        `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      );

      // Return the date in ISO format (YYYY-MM-DD)
      return formattedDate.toISOString().split("T")[0];
    }

    // If input isn't in DD/MM/YYYY, attempt to parse the date normally
    const parsedDate = new Date(dateString);

    if (!isNaN(parsedDate)) {
      return parsedDate.toISOString().split("T")[0]; // Convert to YYYY-MM-DD format
    }

    return null; // Invalid date
  };

  const convertDateFormat = (dateStr) => {
    const dateParts = dateStr.split("-"); // Split into [YYYY, MM, DD]
    const year = dateParts[0];
    const month = parseInt(dateParts[1], 10); // Remove leading zero
    const day = parseInt(dateParts[2], 10); // Remove leading zero

    // Return in DD/MM/YYYY format
    return `${day}/${month}/${year}`;
  };

  const handlePaste = (e) => {
    e.preventDefault(); // Prevent default paste behavior

    const pastedData = e.clipboardData.getData("Text");

    // If the date is in YYYY-MM-DD format, convert it to DD/MM/YYYY
    if (pastedData.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return (e.target.value = convertDateFormat(pastedData));
    }

    // Try to parse the pasted data into a valid date format
    const parsedDate = parseDate(pastedData);

    if (parsedDate) {
      e.target.value = parsedDate; // Set the value if valid date
    } else {
      alert("Invalid date format. Please use DD/MM/YYYY or YYYY-MM-DD.");
    }
  };

  const handleCopy = (e) => {
    const copiedData = e.target.value; // Get the value that is being copied
    // alert(copiedData)
    // Check if the copied data is in DD/MM/YYYY format and convert it to YYYY-MM-DD
    // if (copiedData.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    e.preventDefault(); // Prevent default copy behavior

    const formattedDate = convertToDateISO(copiedData); // Convert DD/MM/YYYY to YYYY-MM-DD format
    // alert(formattedDate)
    // Use the Clipboard API to set the formatted date for copying
    e.clipboardData.setData("Text", formattedDate);
    // }
  };

  // Helper function to convert DD/MM/YYYY to YYYY-MM-DD
  const convertToDateISO = (date) => {
    const [day, month, year] = date.split("-");
    return `${year}/${month}/${day}`; // Return in YYYY-MM-DD format
  };

  const handleExternalPasteMusanadDate = (e) => {
    // Prevent default paste behavior
    e.preventDefault();

    // Get the pasted data from the clipboard
    const pastedData = e.clipboardData.getData("Text");

    // Try to parse the pasted data into a valid date format
    const parsedDate = parseDate(pastedData);

    if (parsedDate) {
      // If the date is valid, update the input value directly using the ref
      externalMusanadDateRef.current.value = parsedDate;
    } else {
      // Handle invalid date format
      alert("Invalid date format. Please use DD/MM/YYYY or YYYY-MM-DD.");
    }
  };

  const handlePasteExternalOfficeapproval = (e) => {
    // Prevent default paste behavior
    e.preventDefault();

    // Get the pasted data from the clipboard
    const pastedData = e.clipboardData.getData("Text");

    // Try to parse the pasted data into a valid date format
    const parsedDate = parseDate(pastedData);

    if (parsedDate) {
      // If the date is valid, update the input value directly using the ref
      externalOfficeAprrovalRef.current.value = parsedDate;
    } else {
      // Handle invalid date format
      alert("Invalid date format. Please use DD/MM/YYYY or YYYY-MM-DD.");
    }
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
  const [showAdditionalDestination, setShowAdditionalDestination] =
    useState(false); // State to toggle additional destination

  const handleToggleDestination = () => {
    setShowAdditionalDestination(!showAdditionalDestination); // Toggle the state when the button is clicked
  };
  // alert(formData?.Passportnumber);
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
  const [isModalImageSpinnerOpen, setModalImageSpinnerOpen] = useState(false);
  const openImageSpinnerModal = () => {
    setModalImageSpinnerOpen(true);
  };
  const closespinnerImageModal = () => {
    setModalImageSpinnerOpen(false);
  };
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
  const sectionRef = useRef(null);
  const scrollToSection = () => {
    sectionRef.current.scrollIntoView({ behavior: "smooth" });
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
    if (!formData.arrivals[0]?.MusanadDuration) return;
    calculateDaysRemaining();
    const interval = setInterval(calculateDaysRemaining, 86400000); // Recalculate every 24 hours

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [formData.arrivals[0]?.MusanadDuration]);

  const [guaranteearrivaldaysRemaining, setguaranteearrivaldaysRemaining] =
    useState();
  const [officeName, setOfficeName] = useState("");

  const handleOfficeChange = (e) => {
    setOfficeName(e.target.value);
  };

  const handleAddNewOffice = () => {
    // Only add the office if it's not already in the list
    if (officeName && !offices.some((office) => office.office === officeName)) {
      setOffices([...offices, { office: officeName }]);
      setOfficeName(""); // Clear the input field after adding
    }
  };

  // Filter offices based on user input for autocomplete
  const filteredOffices = offices.filter((office) =>
    office.office.toLowerCase().includes(officeName.toLowerCase())
  );

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
    if (!formData.arrivals[0]?.MusanadDuration) return;
    calculateDaysRemaining();
    const interval = setInterval(calculateDaysRemaining, 86400000); // Recalculate every 24 hours

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [formData.arrivals[0]?.MusanadDuration]);

  useEffect(() => {
    if (!formData.arrivals[0]?.KingdomentryDate) return;
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
      <SpinnerModal
        isOpen={isModalImageSpinnerOpen}
        onClose={closespinnerImageModal}
      />
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
                      className="px-6 py-2 bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
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
                      className="px-6 py-2 bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
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
                      className="px-6 py-2 bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
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
                      className="px-6 py-2 bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
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
        <div className="w-full mx-auto px-4" ref={sectionRef}>
          <h1 className="text-3xl font-bold text-center mb-8">
            طلب :{formData.ClientName ? formData.ClientName : ""}
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
            <div className="grid grid-cols-2 gap-0 justify-start">
              <div className="flex justify-between items-center bg-gray-100 ">
                <strong className="w-32 font-extrabold">الاسم</strong>
                <p className="flex-1 text-right overflow-hidden text-ellipsis">
                  {formData.ClientName}
                </p>
              </div>

              <div className="flex justify-between items-center bg-gray-100">
                <strong className="w-32 font-extrabold">
                  البريد الالكتروني
                </strong>
                <p className="flex-1 text-right overflow-hidden text-ellipsis">
                  {formData.client.email}
                </p>
              </div>

              <div className="flex justify-between items-center bg-gray-300">
                <strong className="w-32 font-extrabold">جوال العميل</strong>
                <p className="flex-1 text-right overflow-hidden text-ellipsis">
                  {formData.client.phonenumber}
                </p>
              </div>

              <div className="flex justify-between items-center bg-gray-300">
                <strong className="w-32 font-extrabold">رقم الطلب</strong>
                <p className="flex-1 text-right overflow-hidden text-ellipsis">
                  {formData.id}
                </p>
              </div>

              <div className="flex justify-between items-center bg-gray-100">
                <strong className="w-32 font-extrabold">اسم العاملة</strong>
                <span className="flex-1 text-right overflow-hidden text-ellipsis">
                  {formData.HomeMaid?.Name}
                </span>
              </div>

              <div className="flex justify-between items-center bg-gray-100">
                <strong className="w-32 font-extrabold">جواز السفر</strong>
                <span className="flex-1 text-right overflow-hidden text-ellipsis">
                  {formData.HomeMaid?.Passportnumber}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8">
            <VerticalTimeline
              animate={true}
              lineColor="#30B8A6"
              layout="1-column-left"
            >
              <VerticalTimelineElement
                className="vertical-timeline-element--work"
                // date={formData.createdAt}
                iconStyle={{
                  background: "#D1E1E6",
                  color: "orange",
                }}
                icon={<FaUserCheck />}
              >
                <div ref={sectionLightRef} className="flex flex-col">
                  <h1
                    style={{
                      justifyContent: "flex-start",
                      display: "flex",
                      color: "brown",
                    }}
                    className={Style["almarai-bold"]}
                  >
                    التقديم
                  </h1>

                  <div className="grid grid-cols-2 justify-center">
                    <div className="flex justify-center items-center flex-col">
                      <strong
                        style={{
                          justifyContent: "center",
                          display: "flex",
                          color: "rosybrown",
                        }}
                        className={Style["almarai-bold"]}
                      >
                        وقت استلام الطلب
                      </strong>
                      <h1
                        className={Style["almarai-bold"]}
                        style={{ justifyContent: "center", display: "flex" }}
                      >
                        {new Date(formData.createdAt).toLocaleTimeString()}
                      </h1>
                    </div>

                    <div className="flex justify-center items-center flex-col">
                      <strong
                        style={{
                          justifyContent: "center",
                          display: "flex",
                          color: "rosybrown",
                        }}
                        className={Style["almarai-bold"]}
                      >
                        تاريخ استلام الطلب
                      </strong>
                      <h1
                        className={Style["almarai-bold"]}
                        style={{ justifyContent: "center", display: "flex" }}
                      >
                        {formData.createdAt
                          ? new Date(formData.createdAt).getDate() +
                            " / " +
                            (new Date(formData.createdAt).getMonth() + 1) +
                            " / " +
                            new Date(formData.createdAt).getFullYear()
                          : null}
                      </h1>
                    </div>
                  </div>
                </div>
              </VerticalTimelineElement>

              <VerticalTimelineElement
                className="vertical-timeline-element--work flex flex-col"
                iconStyle={{
                  backgroundColor: `#D1E1E6`,
                  color: "teal",
                }}
                contentArrowStyle={{
                  borderRight: "7px solid  rgb(255, 229, 180)",
                }}
                icon={<FaLink />}
                // date="2011 - present"
              >
                {stages.indexOf(formData.bookingstatus) >=
                  stages.indexOf("الربط مع مساند") &&
                isEditing !== "الربط مع مساند" ? (
                  <div
                    ref={musanadDateSectionRef}
                    className="flex flex-col justify-center"
                  >
                    <h1
                      style={{
                        justifyContent: "flex-start",
                        display: "flex",
                        color: "brown",
                      }}
                      className={Style["almarai-bold"]}
                    >
                      الربط مع مساند
                    </h1>
                    <strong
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        color: "rosybrown",
                      }}
                    >
                      عقد مساند
                    </strong>
                    <h1
                      style={{ display: "flex", justifyContent: "center" }}
                      className={Style["almarai-bold"]}
                    >
                      {formData.arrivals[0]?.InternalmusanedContract}
                    </h1>

                    <div className="grid grid-cols-2 gap-4 justify-center">
                      <div className="flex justify-center items-center flex-col">
                        <strong
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            color: "rosybrown",
                          }}
                        >
                          رقم الهوية
                        </strong>
                        <h1
                          className={Style["almarai-bold"]}
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            color: "black",
                          }}
                        >
                          {formData.arrivals[0]?.nationalidNumber}
                        </h1>
                      </div>

                      <div className="flex justify-center items-center flex-col">
                        <strong
                          style={{
                            display: "flex",
                            color: "rosybrown",
                            justifyContent: "center",
                          }}
                        >
                          رقم التأشيرة
                        </strong>
                        <h1
                          className={Style["almarai-bold"]}
                          style={{
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          {formData.arrivals[0]?.visaNumber}
                        </h1>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 justify-center">
                      <div className="flex justify-center items-center flex-col">
                        <strong
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            color: "rosybrown",
                          }}
                        >
                          متبقى على انتهاء الضمان
                        </strong>
                        <h1
                          className={Style["almarai-bold"]}
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            color: daysRemaining < 20 ? "red" : "black",
                          }}
                        >
                          {daysRemaining}
                        </h1>
                      </div>

                      <div className="flex justify-center items-center flex-col">
                        <strong
                          style={{
                            display: "flex",
                            color: "rosybrown",
                            justifyContent: "center",
                          }}
                        >
                          تاريخ انتهاء الضمان
                        </strong>
                        <h1
                          className={Style["almarai-bold"]}
                          style={{
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          {AddgoDays(formData.arrivals[0]?.MusanadDuration)}
                        </h1>
                      </div>

                      <div className="flex justify-center items-center flex-col">
                        <strong
                          style={{
                            color: "rosybrown",
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          تاريخ الربط
                        </strong>

                        <h1
                          className={Style["almarai-bold"]}
                          style={{
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          {formData.arrivals[0]?.MusanadDuration}
                        </h1>
                      </div>
                      <button
                        // style={{ backgroundColor: "#ECC383" }}
                        className="py-2 px-4  text-white font-semibold rounded-md bg-orange-300 hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 col-span-3"
                        onClick={() => setIsEditing("الربط مع مساند")}
                      >
                        تعديل
                      </button>
                    </div>
                  </div>
                ) : (
                  // <div className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md">
                  <>
                    <div className="mb-4" ref={musanadDateSectionRef}>
                      <label
                        for="input"
                        className="block text-sm font-medium text-gray-700"
                      >
                        هوية العميل
                      </label>

                      <input
                        ref={SponsorIdnumberRef}
                        type="text"
                        id="input"
                        name="input"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ادخل هوية العميل"
                      />

                      <label
                        for="input"
                        className="block text-sm font-medium text-gray-700"
                      >
                        رقم التأشيرة
                      </label>

                      <input
                        ref={visaNumberRef}
                        type="text"
                        id="input"
                        name="input"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ادخل رقم التأشيرة"
                      />

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
                        placeholder="ادخال رقم مساند"
                      />

                      <label
                        for="input"
                        className="block text-sm font-medium text-gray-700"
                      >
                        تاريخ مساند
                      </label>
                      <input
                        onCopy={handleCopy}
                        onPaste={handlePaste}
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
                        className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        الغاء التعديل
                      </button>

                      <button
                        type="submit"
                        onClick={() =>
                          handleAccessFormSubmit({
                            bookingstatus: "الربط مع مساند",
                            // GuaranteeDurationEnd: guaranteeref.current.value(),

                            nationalidNumber: SponsorIdnumberRef.current.value,
                            visaNumber: visaNumberRef.current.value,
                            InternalmusanedContract: musanadRef.current.value,
                            MusanadDuration: musanadDateRef.current.value,
                          })
                        }
                        className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
                  background: "#66757E",
                  color: "white",
                }}
                contentArrowStyle={{
                  borderRight: "7px solid  rgb(255, 229, 180)",
                }}
                icon={<FaHandsHelping />}
                // date="2011 - present"
              >
                {stages.indexOf(formData.bookingstatus) >=
                  stages.indexOf("الربط مع مساند الخارجي") &&
                isEditing !== "الربط مع مساند الخارجي" ? (
                  <div
                    className="flex flex-col justify-center"
                    ref={externalMusanadSectionRef}
                  >
                    <h1
                      style={{
                        justifyContent: "flex-start",
                        display: "flex",
                        color: "brown",
                      }}
                      className={Style["almarai-bold"]}
                    >
                      الربط مع مساند الخارجي
                    </h1>

                    <strong
                      style={{
                        color: "rosybrown",
                        justifyContent: "center",
                        display: "flex",
                      }}
                    >
                      تاريخ الربط
                    </strong>
                    <h1
                      className="mt-1"
                      className={Style["almarai-bold"]}
                      style={{
                        justifyContent: "center",
                        display: "flex",
                      }}
                    >
                      {formData.arrivals[0].externalmusanedContract
                        ? // new Date(
                          getDate(formData.arrivals[0].externalmusanedContract)
                        : // ).toLocaleDateString()
                          null}
                    </h1>

                    {formData.arrivals[0]?.externalmusanadcontractfile && (
                      <div className="mt-2 text-gray-600">
                        <span
                          className={Style["almarai-bold"]}
                          style={{
                            justifyContent: "center",
                            display: "flex",
                            color: "rosybrown",
                          }}
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
                      className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => setIsEditing("الربط مع مساند الخارجي")}
                    >
                      تعديل
                    </button>
                  </div>
                ) : (
                  // <div className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md">
                  <>
                    <div className="mb-4" ref={externalMusanadSectionRef}>
                      <label
                        for="input"
                        className="block text-sm font-medium text-gray-700"
                      >
                        تاريخ مساند الخارجي
                      </label>

                      <input
                        onCopy={handleCopy}
                        onPaste={handlePaste}
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
                          className="hidden"
                          onChange={handleUploadexternalFile}
                        />
                        {/* Custom file upload button */}
                        <label
                          htmlFor="musanadexternalfile"
                          className="px-6 py-2 bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
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
                        className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
                        className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        تأكيد
                      </button>
                    </div>
                  </>
                  // </div>
                )}
              </VerticalTimelineElement>

              <VerticalTimelineElement
                // title="الربط مع المكتب الخارجي"
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
                  color: "#teal",
                }}
                icon={<FaDoorOpen />}
              >
                {/* formData.bookingStatus === "الربط" */}
                {stages.indexOf(formData.bookingstatus) >=
                  stages.indexOf("الربط مع المكتب الخارجي") &&
                isEditing !== "الربط مع المكتب الخارجي" ? (
                  <div
                    className="flex flex-col"
                    ref={externalOfficeAprrovalSectionRef}
                  >
                    <h1
                      style={{
                        justifyContent: "flex-start",
                        display: "flex",
                        color: "brown",
                      }}
                      className={Style["almarai-bold"]}
                    >
                      الربط و المتابعة مع المكتب الخارجي
                    </h1>

                    <h1
                      style={{
                        justifyContent: "center",
                        display: "flex",
                        color: "rosybrown",
                      }}
                      className={Style["almarai-bold"]}
                    >
                      تاريخ الربط
                    </h1>

                    <h1
                      style={{ justifyContent: "center", display: "flex" }}
                      className={Style["almarai-bold"]}
                    >
                      {formData.arrivals[0]?.ExternalOFficeApproval
                        ? getDate(formData.arrivals[0].ExternalOFficeApproval)
                        : null}
                    </h1>

                    <h1
                      style={{
                        justifyContent: "center",
                        display: "flex",
                        color: "rosybrown",
                      }}
                      className={Style["almarai-bold"]}
                    >
                      اسم المكتب الخارجي
                    </h1>

                    <h1
                      style={{ justifyContent: "center", display: "flex" }}
                      className={Style["almarai-bold"]}
                    >
                      {formData.arrivals[0]?.office
                        ? formData.arrivals[0]?.office
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
                    {formData.arrivals[0].externalOfficeStatus ? (
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
                          style={{
                            justifyContent: "center",
                            display: "flex",
                            color: "rosybrown",
                          }}
                        >
                          ملف المكتب الخارجي
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
                      className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => setIsEditing("الربط مع المكتب الخارجي")}
                    >
                      تعديل
                    </button>
                  </div>
                ) : (
                  <div ref={externalOfficeAprrovalSectionRef}>
                    <h1
                      style={{ justifyContent: "center", display: "flex" }}
                      className={Style["almarai-bold"]}
                    >
                      المكتب الخارجي
                    </h1>
                    <div className="mb-4">
                      <label
                        htmlFor="externalOfficeStatus"
                        className="block text-sm font-medium text-gray-700"
                      >
                        اسم المكتب الخارجي
                      </label>
                      <input
                        autoComplete="off"
                        type="text"
                        id="externalOfficeStatus"
                        value={officeName}
                        onChange={handleOfficeChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ابدأ بالكتابة لاختيار أو إضافة مكتب"
                      />

                      {/* Show filtered office suggestions */}
                      {officeName && (
                        <ul className="mt-2 border border-gray-300 rounded-md bg-white shadow-md max-h-40 overflow-auto">
                          {filteredOffices.length > 0
                            ? filteredOffices
                                .filter(
                                  (office) => office.office !== officeName
                                ) // Filter out selected office
                                .map((office, index) => (
                                  <li
                                    key={index}
                                    className="px-3 py-2 cursor-pointer hover:bg-gray-200"
                                    onClick={() => setOfficeName(office.office)} // Set selected office
                                  >
                                    {office.office}
                                  </li>
                                ))
                            : // (
                              //   <li
                              //     className="px-3 py-2 cursor-pointer hover:bg-gray-200"
                              //     onClick={() => (filteredOffices = [])} // Handle adding new office when clicked
                              //   >
                              //     {officeName}
                              //   </li>
                              // )
                              null}
                        </ul>
                      )}
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor="input"
                        className="block text-sm font-medium text-gray-700"
                      >
                        تاريخ موافقة المكتب الخارجي
                      </label>
                      <input
                        onCopy={handleCopy}
                        onPaste={handlePaste}
                        ref={externalOfficeAprrovalRef}
                        type="date"
                        id="input"
                        name="input"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter something..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 justify-items-center">
                      <div className="flex flex-col items-center">
                        <label
                          htmlFor="externalOfficeStatus"
                          className="block text-sm font-semibold mb-2"
                        >
                          حالة الطلب للعميل
                        </label>
                        <select
                          className="rounded-md"
                          name="externalOfficeStatus"
                          ref={externalOfficeStatus}
                          id="externalOfficeStatus"
                        >
                          <option value="فحص طبي"></option>
                          <option value="خلو سوابق">خلو سوابق</option>
                          <option value="موافقة مكتب العمل في دولة الاستقدام">
                            موافقة مكتب العمل في دولة الاستقدام
                          </option>
                          <option value="تفويض">تفويض</option>
                          <option value="داخل السفارة">داخل السفارة</option>
                          <option value="تم التفييز">تم التفييز</option>
                          <option value="استلام الجواز في السفارة">
                            استلام الجواز في السفارة
                          </option>
                          <option value="تصريح السفر">تصريح السفر</option>
                          <option value="الحجز">الحجز</option>
                          <option value="موعد الوصول">موعد الوصول</option>
                        </select>
                      </div>

                      <div className="flex flex-col items-center">
                        <label
                          htmlFor="ExternalStatusByoffice"
                          className="block text-sm font-semibold mb-2"
                        >
                          حالة الطلب طبقا للمكتب الخارجي
                        </label>
                        <select
                          className="rounded-md"
                          name="ExternalStatusByoffice"
                          ref={ExternalStatusByofficeRef}
                          id="externalOfficeStatus"
                        >
                          <option value="فحص طبي"></option>
                          <option value="خلو سوابق">خلو سوابق</option>
                          <option value="موافقة مكتب العمل في دولة الاستقدام">
                            موافقة مكتب العمل في دولة الاستقدام
                          </option>
                          <option value="تفويض">تفويض</option>
                          <option value="داخل السفارة">داخل السفارة</option>
                          <option value="تم التفييز">تم التفييز</option>
                          <option value="استلام الجواز في السفارة">
                            استلام الجواز في السفارة
                          </option>
                          <option value="تصريح السفر">تصريح السفر</option>
                          <option value="الحجز">الحجز</option>
                          <option value="موعد الوصول">موعد الوصول</option>
                        </select>
                      </div>
                    </div>

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
                          className="px-6 py-2 hidden bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
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

                        <label
                          htmlFor="externalFile"
                          className="px-6 py-2 bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
                        >
                          اختار الملف
                        </label>

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
                        className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        الغاء التعديل
                      </button>

                      <button
                        type="submit"
                        onClick={() =>
                          handleAccessFormSubmit({
                            office: officeName,

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
                        className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        تأكيد
                      </button>
                    </div>
                  </div>
                )}
              </VerticalTimelineElement>

              <VerticalTimelineElement
                className="vertical-timeline-element--work"
                contentArrowStyle={{
                  borderRight: "7px solid  rgb(255, 229, 180)",
                }}
                // date="2011 - present"
                iconStyle={{
                  background: "white",
                  // color: "#fff",
                }}
                icon={<FaRegCheckCircle />}
              >
                {/* formData.bookingStatus === "الربط" */}
                {stages.indexOf(formData.bookingstatus) >=
                  stages.indexOf("الفحص الطبي") &&
                isEditing !== "الفحص الطبي" ? (
                  <div className="flex flex-col" ref={checkRefSectionRef}>
                    <h1
                      style={{
                        justifyContent: "flex-start",
                        display: "flex",
                        color: "brown",
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
                      className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => setIsEditing("الفحص الطبي")}
                    >
                      تعديل
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="col-span-3" ref={checkRefSectionRef}>
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
                          className="px-6 py-2 bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
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
                        className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
                        className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
                  background: "teal",
                  color: "#99AAB2",
                }}
                icon={<FaMapMarked />}
              >
                {/* formData.bookingStatus === "الربط" */}
                {stages.indexOf(formData.bookingstatus) >=
                  stages.indexOf("الربط مع الوكالة") &&
                isEditing !== "الربط مع الوكالة" ? (
                  <div className="flex flex-col" ref={agencyDateSectionRef}>
                    <h1
                      style={{
                        justifyContent: "flex-start",
                        display: "flex",
                        color: "brown",
                      }}
                      className={Style["almarai-bold"]}
                    >
                      الربط مع الوكالـة
                    </h1>
                    <h1
                      style={{
                        justifyContent: "center",
                        display: "flex",
                        color: "rosybrown",
                      }}
                      className={Style["almarai-bold"]}
                    >
                      تاريخ الربط
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
                      className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => setIsEditing("الربط مع الوكالة")}
                    >
                      تعديل
                    </button>
                  </div>
                ) : (
                  <div
                    className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md"
                    ref={agencyDateSectionRef}
                  >
                    <label
                      htmlFor="AgencyDate"
                      className="block font-semibold text-sm"
                    >
                      تاريخ الربط مع الوكالة
                    </label>
                    <input
                      onCopy={handleCopy}
                      onPaste={handlePaste}
                      ref={agencyDateRef}
                      id="AgencyDate"
                      name="AgencyDate"
                      type="date"
                      className="w-full border rounded-md px-4 py-2"
                    />

                    <div className="flex flex-row justify-center space-x-4">
                      <button
                        onClick={() => setIsEditing("")}
                        className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
                        className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
                  background: "teal",
                  color: "#ffc0cb",
                }}
                icon={<FaSearchLocation />}
              >
                {/* formData.bookingStatus === "الربط" */}
                {stages.indexOf(formData.bookingstatus) >=
                  stages.indexOf("التختيم في السفارة") &&
                isEditing !== "التختيم في السفارة" ? (
                  <div className="flex flex-col" ref={embassySealingSectionRef}>
                    <div>
                      <h1
                        style={{
                          justifyContent: "flex-start",
                          display: "flex",
                          color: "brown",
                        }}
                        className={Style["almarai-bold"]}
                      >
                        التختيم في السفارة
                      </h1>
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
                      className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => setIsEditing("التختيم في السفارة")}
                    >
                      تعديل
                    </button>
                  </div>
                ) : (
                  <div
                    className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md"
                    ref={embassySealingSectionRef}
                  >
                    <label
                      htmlFor="embassysealing"
                      className="block font-semibold text-sm"
                    >
                      تاريخ التختيم في السفارة
                    </label>
                    <input
                      onCopy={handleCopy}
                      onPaste={handlePaste}
                      ref={embassySealingRef}
                      id="embassysealing"
                      name="embassysealing"
                      type="date"
                      className="w-full border rounded-md px-4 py-2"
                    />

                    <div className="flex flex-row justify-center space-x-4">
                      <button
                        onClick={() => setIsEditing("")}
                        className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
                        className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
                  background: "#7F8F98",
                  color: "wheat",
                }}
                icon={<FaPlaneArrival />}
              >
                {/* formData.bookingStatus === "الربط" */}
                {stages.indexOf(formData.bookingstatus) >=
                  stages.indexOf("حجز التذكرة") &&
                isEditing !== "حجز التذكرة" ? (
                  <div
                    className="flex flex-col justify-center"
                    ref={kingdomEntrySectionRef}
                  >
                    <h1
                      style={{
                        justifyContent: "flex-start",
                        display: "flex",
                        color: "brown",
                      }}
                      className={Style["almarai-bold"]}
                    >
                      حجز التذكرة و وصول العاملة
                    </h1>

                    <div className="grid grid-cols-3 justify-center items-center mt-1">
                      <div className="flex justify-center items-center flex-col">
                        <label
                          htmlFor="time"
                          style={{
                            color: "rosybrown",
                          }}
                          className={Style["almarai-bold"]}
                        >
                          توقيت الوصول
                        </label>
                        <strong>
                          {formData.arrivals[0]?.KingdomentryTime
                            ? formData.arrivals[0]?.KingdomentryTime
                            : null}
                        </strong>
                      </div>

                      <div className="flex justify-center items-center flex-col">
                        <label
                          style={{
                            color: "rosybrown",
                          }}
                          htmlFor="arrivaldate"
                          className={Style["almarai-bold"]}
                        >
                          تاريخ الوصول
                        </label>
                        <strong>
                          {formData.arrivals[0]?.KingdomentryDate
                            ? getDate(formData.arrivals[0]?.KingdomentryDate)
                            : null}
                        </strong>
                      </div>

                      <div className="flex justify-center items-center flex-col">
                        <label
                          style={{
                            justifyContent: "center",
                            color: "rosybrown",

                            display: "flex",
                          }}
                          htmlFor="arrivaldate"
                          className={Style["almarai-bold"]}
                        >
                          مدينة وصول العاملة
                        </label>
                        <h2
                          className={Style["almarai-bold"]}
                          style={{
                            justifyContent: "center",
                            display: "flex",
                          }}
                        >
                          {formData.arrivals[0]?.ArrivalCity}
                        </h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 justify-center items-center mt-2">
                      {formData.arrivals[0]?.deparatureDate && (
                        <div className="flex justify-center items-center flex-col">
                          <label
                            htmlFor="time"
                            style={{
                              color: "rosybrown",
                            }}
                            className={Style["almarai-bold"]}
                          >
                            موعد المغادرة
                          </label>
                          <strong>
                            {formData.arrivals[0]?.deparatureTime
                              ? formData.arrivals[0]?.deparatureTime
                              : null}
                          </strong>
                        </div>
                      )}

                      {formData.arrivals[0]?.deparatureDate && (
                        <div className="flex justify-center items-center flex-col">
                          <label
                            style={{
                              color: "rosybrown",
                            }}
                            htmlFor="arrivaldate"
                            className={Style["almarai-bold"]}
                          >
                            تاريخ المغادرة
                          </label>
                          <strong>
                            {formData.arrivals[0]?.deparatureDate
                              ? getDate(formData.arrivals[0]?.deparatureDate)
                              : null}
                          </strong>
                        </div>
                      )}

                      <div className="flex justify-center items-center flex-col">
                        {formData.arrivals[0].finaldestination ? (
                          <label
                            style={{
                              justifyContent: "center",
                              color: "rosybrown",

                              display: "flex",
                            }}
                            htmlFor="arrivaldate"
                            className={Style["almarai-bold"]}
                          >
                            وجهة العاملة الآخرى
                          </label>
                        ) : null}
                        <h2
                          className={Style["almarai-bold"]}
                          style={{
                            justifyContent: "center",
                            display: "flex",
                          }}
                        >
                          {formData.arrivals[0].finaldestination}
                        </h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 justify-center items-center mt-2">
                      <div className="flex justify-center items-center flex-col">
                        {formData.arrivals[0].finalDestinationDate ? (
                          <label
                            style={{
                              justifyContent: "center",
                              color: "rosybrown",

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
                      </div>
                      <div className="flex justify-center items-center flex-col">
                        {formData.arrivals[0].finalDestinationTime ? (
                          <label
                            style={{
                              justifyContent: "center",
                              color: "rosybrown",

                              display: "flex",
                            }}
                            // htmlFor=""
                            className={Style["almarai-bold"]}
                          >
                            توقيت وصول العاملة الى الوجهة الاخرى
                          </label>
                        ) : null}
                        <h2
                          style={{
                            justifyContent: "center",
                            display: "flex",
                          }}
                          className={Style["almarai-bold"]}
                        >
                          {formData.arrivals[0].finalDestinationTime
                            ? formData.arrivals[0].finalDestinationTime
                            : null}
                        </h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 justify-center items-center mt-2">
                      <div className="flex justify-center items-center flex-col">
                        <strong
                          style={{
                            justifyContent: "center",

                            color: "rosybrown",
                            display: "flex",
                          }}
                          className={Style["almarai-bold"]}
                        >
                          تاريخ انتهاء الضمان
                        </strong>
                        <h1
                          className={Style["almarai-bold"]}
                          style={{ justifyContent: "center", display: "flex" }}
                        >
                          {" "}
                          {formData.arrivals[0]?.KingdomentryDate
                            ? AddgoDays(formData.arrivals[0]?.KingdomentryDate)
                            : null}
                        </h1>
                      </div>
                      <div className="flex justify-center items-center flex-col">
                        <label
                          style={{
                            justifyContent: "center",
                            color: "rosybrown",

                            display: "flex",
                          }}
                          htmlFor="arrivaldate"
                          className={Style["almarai-bold"]}
                        >
                          متبقي على انتهاء الضمان
                        </label>
                        <h2
                          className={Style["almarai-bold"]}
                          style={{
                            justifyContent: "center",
                            display: "flex",
                          }}
                        >
                          {guaranteearrivaldaysRemaining}
                        </h2>
                      </div>
                    </div>

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
                      className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => setIsEditing("حجز التذكرة")}
                    >
                      تعديل
                    </button>
                  </div>
                ) : (
                  <div
                    ref={kingdomEntrySectionRef}
                    className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md"
                  >
                    <label
                      htmlFor="ArrivalCity"
                      className="block font-semibold text-sm"
                    >
                      مدينة وصول العاملة الاساسية
                    </label>
                    <input
                      onCopy={handleCopy}
                      onPaste={handlePaste}
                      ref={arrivalCityRef}
                      id="ArrivalCity"
                      name="ArrivalCity"
                      type="text"
                      className="w-full border rounded-md px-4 py-2"
                    />
                    <div className="grid grid-cols-2 mt-2">
                      <div className="mb-4">
                        <label
                          style={{ display: "flex", justifyContent: "center" }}
                          htmlFor="date"
                          className="block text-sm font-medium text-gray-700"
                        >
                          تاريخ الوصول
                        </label>
                        <input
                          onCopy={handleCopy}
                          onPaste={handlePaste}
                          ref={arrivalDateRef}
                          id="arrivaldate"
                          name="arrivaldate"
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
                          توقيت الوصول
                        </label>
                        <input
                          type="time"
                          id="time"
                          ref={arrivalTimeRef}
                          // value={time}
                          // onChange={handleTimeChange}
                          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* <button
                      type="submit"
                      className="w-full mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      Submit
                    </button> */}
                    {/* <input
                      onCopy={handleCopy}
                      onPaste={handlePaste}
                      ref={arrivalDateRef}
                      id="arrivaldate"
                      name="arrivaldate"
                      type="date"
                      className="w-full border rounded-md px-4 py-2"
                    /> */}

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
                    <div className="grid grid-cols-2 mt-1">
                      {showAdditionalDestination && (
                        <div>
                          <label
                            style={{
                              display: "flex",
                              justifyContent: "center",
                            }}
                            htmlFor="deparatureDate"
                            className="block font-semibold text-sm"
                          >
                            تاريخ المغادرة
                          </label>
                          <input
                            onCopy={handleCopy}
                            onPaste={handlePaste}
                            ref={deparatureDateRef}
                            id="deparatureDate"
                            name="deparatureDate"
                            type="date"
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}

                      {showAdditionalDestination && (
                        <div>
                          <label
                            style={{
                              display: "flex",
                              justifyContent: "center",
                            }}
                            htmlFor="deparatureDate"
                            className="block font-semibold text-sm"
                          >
                            توقيت المغادرة
                          </label>
                          <input
                            type="time"
                            id="time"
                            ref={deparatureTimeRef}
                            // value={time}
                            // onChange={handleTimeChange}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                    {showAdditionalDestination && (
                      <div className="grid grid-cols-2 mt-1">
                        <div>
                          <label
                            style={{
                              display: "flex",
                              justifyContent: "center",
                            }}
                            htmlFor="finalDestinationDate"
                            className="block font-semibold text-sm text-ellipsis whitespace-nowrap"
                          >
                            تاريخ الوصول
                          </label>
                          <input
                            ref={finalDestinationDateRef}
                            id="finalDestinationDate"
                            name="finalDestinationDate"
                            type="date"
                            className="w-full border rounded-md px-4 py-2 "
                          />
                        </div>

                        {showAdditionalDestination && (
                          <div>
                            <label
                              style={{
                                display: "flex",
                                justifyContent: "center",
                              }}
                              htmlFor="finalDestinationTime"
                              className="block font-semibold text-sm whitespace-nowrap text-ellipsis"
                            >
                              توقيت الوصول
                            </label>
                            <input
                              type="time"
                              id="finalDestinationTime"
                              ref={finalDestinationTimeRef}
                              // value={time}
                              // onChange={handleTimeChange}
                              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    )}
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
                        className="px-6 py-2 bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
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
                          className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                          الغاء التعديل
                        </button>

                        <button
                          // type="submit"
                          onClick={() =>
                            handleAccessFormSubmit({
                              finalDestinationTime:
                                finalDestinationTimeRef.current?.value,
                              deparatureTime: deparatureTimeRef.current?.value,
                              KingdomentryTime: arrivalTimeRef.current?.value,
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
                          className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
                  // display: "flex",
                  // justifyContent: "center",
                  background: "#8D6C49",
                  color: "wheat",
                }}
                icon={<FaCheckCircle />}
              >
                {/* formData.bookingStatus === "الربط" */}
                {stages.indexOf(formData.bookingstatus) >=
                  stages.indexOf("الاستلام") && isEditing !== "الاستلام" ? (
                  <div className="flex flex-col" ref={deliverySectionRef}>
                    <h1
                      style={{
                        justifyContent: "flex-start",
                        display: "flex",
                        color: "brown",
                      }}
                      className={Style["almarai-bold"]}
                    >
                      الاستلام و التـوقيع
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
                      className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      onClick={() => setIsEditing("الاستلام")}
                    >
                      تعديل
                    </button>
                  </div>
                ) : (
                  <div
                    className="max-w-sm mx-auto p-6 bg-white rounded-lg shadow-md"
                    ref={deliverySectionRef}
                  >
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
                        onCopy={handleCopy}
                        onPaste={handlePaste}
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
                        className="px-6 py-2 bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
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
                          className="py-2 px-4 bg-orange-300 text-white font-semibold rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
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
                  // display: "flex",
                  // justifyContent: "center",
                  background: "#8D6C49",
                  color: "wheat",
                }}
                icon={<FaBoxOpen />}
              >
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
              </VerticalTimelineElement>

              <VerticalTimelineElement
                className="vertical-timeline-element--work"
                // date={form.createdAt}
                iconStyle={{
                  // display: "flex",
                  // justifyContent: "center",
                  background: "#000080",
                  color: "wheat",
                }}
                icon={<FaUpload />}
              >
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
                            className="px-6 py-2 bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
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
                            className="px-6 py-2 bg-teal-600 text-white rounded-lg cursor-pointer hover:bg-green-900"
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
              </VerticalTimelineElement>
            </VerticalTimeline>
          </div>
          <div>
            {/* Floating button */}
            <button
              onClick={scrollToSection}
              style={{
                position: "fixed",
                bottom: "2%", // Position vertically in the center
                right: "1%", // Position horizontally in the center (you can adjust this to move horizontally)
                transform: "translate(-50%, -50%)", // Offset to truly center the button
                backgroundColor: "transparent", // Make the background transparent
                color: "blue", // Make the icon color blue (you can change this to any color)
                border: "2px solid blue", // Add a border to make it more visible (adjust the thickness as needed)
                borderRadius: "10px", // Make the button slightly rounded
                padding: "10px 25px", // Make the button narrow
                fontSize: "20px",
                cursor: "pointer",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", // Keep the shadow to make it appear floating
                transition: "all 0.3s ease", // Smooth transition for hover effect
              }}
              onMouseEnter={(e) => {
                // Change color when hovering
                e.target.style.backgroundColor = "rgba(0, 0, 255, 0.1)"; // Light blue background on hover
                e.target.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.3)"; // Slightly darker shadow on hover
              }}
              onMouseLeave={(e) => {
                // Reset the button style when not hovering
                e.target.style.backgroundColor = "transparent";
                e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)"; // Reset the shadow
              }}
            >
              <FaArrowUp size={13} />
            </button>
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
