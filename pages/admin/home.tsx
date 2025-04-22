//@ts-ignore
//@ts-nocheck
"use client";
import Layout from "example/containers/Layout";
import Link from "next/link";
import {
  FaPlus,
  FaAviato,
  FaRegUser,
  FaListAlt,
  FaTasks,
  FaUserTie,
  FaHome,
  FaList,
  FaArchive,
  FaPlane,
  FaSuperpowers,
  FaAddressBook,
  FaAlignJustify,
  FaPlaneDeparture,
  FaPlaneArrival,
  FaArrowUp,
} from "react-icons/fa"; // Import icons from react-icons
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Style from "/styles/Home.module.css";

import { useRouter } from "next/router";
// import {  } from "@ant-design/icons";
import jwt from "jsonwebtoken";
import { HomeIcon } from "icons";
import NotificationDropdown from "components/notifications";
// Helper function to calculate remaining days
const calculateRemainingDays = (eventDate) => {
  const today = new Date();
  const event = new Date(eventDate);
  const timeDifference = event - today;
  const remainingDays = Math.ceil(timeDifference / (1000 * 3600 * 24));
  return remainingDays > 0 ? remainingDays : "Expired";
};

export default function Home({ user }) {
  const router = useRouter();
  // useContext;
  const { data: session, status } = useSession();

  const monthColors = [
    "bg-red-300", // January
    "bg-pink-300", // February
    "bg-pink-500", // March
    "bg-purple-300", // April
    "bg-indigo-300", // May
    "bg-blue-300", // June
    "bg-green-300", // July
    "bg-yellow-300", // August
    "bg-orange-300", // September
    "bg-teal-300", // October
    "bg-blue-500", // November
    "bg-purple-500", // December
  ];

  // Sample events with their full date (year, month, and day)
  const [events, setEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Sample Event Data (including full date with year)
  const fetchEvents = async () => {
    const eventData = [
      { title: "Arrival: Person 1", date: "2025-01-01" },
      { title: "Arrival: Person 10", date: "2025-01-01" },
      { title: "Arrival: Person 11", date: "2025-01-01" },
      { title: "Arrival: Person 12", date: "2025-01-01" },

      { title: "Arrival: Person 2", date: "2025-02-10" },
      { title: "Arrival: Person 3", date: "2025-03-15" },
      { title: "Arrival: Person 4", date: "2025-12-25" },
      { title: "Arrival: Person 5", date: "2025-11-30" },
    ];
    setEvents(eventData);
  };
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    if (!router) return;
    // setIsClient(true);
    fetchEvents();
  }, [router]);
  // ;
  const [currentOrdersLength, setCurrentOrdersLength] = useState(0);

  const [cancelledorders, setCancelledorders] = useState(0);
  const [deparaturesLength, setDeparaturesLength] = useState(0);

  const [newOrdersLength, setNewOrdersLength] = useState(0);
  const [homeMaidsLength, setHomeMaidsLength] = useState(0);
  const [arrivalsLength, setArrivalsLength] = useState(0);
  const [rejectedOrdersLength, setRejectedOrdersLength] = useState(0);
  const [finished, setFinished] = useState(0);
  const [transferSponsorships, setTransferSponsorshipsLength] = useState(0);
  // const []
  const [officesLength, setOfficesLengthLength] = useState(0);

  transferSponsorships;
  const fetchData = async () => {
    try {
      const response = await fetch(`/api/datalength`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "get",
      });
      const res = await response.json();

      if (response.status == 200) {
        console.log(res);
        setDeparaturesLength(res.deparatures);
        setArrivalsLength(res.arrivals);
        setCurrentOrdersLength(res.currentorders);
        setRejectedOrdersLength(res.rejectedOrders);
        setHomeMaidsLength(res.workers);
        setTransferSponsorshipsLength(res.transferSponsorships);
        setNewOrdersLength(res.neworderCount);
        setFinished(res.finished);
        setCancelledorders(res.cancelledorders);
        setOfficesLengthLength(res.offices);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get the number of days in the current month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get the starting day of the week for the first day of the current month
  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate the calendar grid
  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

    let calendar = [];
    let day = 1;

    for (let i = 0; i < 6; i++) {
      let week = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDay) {
          week.push(null);
        } else if (day > daysInMonth) {
          break;
        } else {
          week.push(day);
          day++;
        }
      }
      calendar.push(week);
    }

    return calendar;
  };

  // Handle changing the month
  const changeMonth = (direction) => {
    if (direction === "next") {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    } else if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    }
  };

  // Find events for a specific day of the month, using month and day comparison
  const getEventsForDay = (day) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      const eventMonth = eventDate.getMonth();
      const eventDay = eventDate.getDate();

      return eventMonth === currentMonth && eventDay === day;
    });
  };

  // Determine the event color based on date (Past, Upcoming, Today)
  const getEventColor = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);

    if (event.toDateString() === today.toDateString()) {
      return "bg-green-300"; // Today's event
    } else if (event > today) {
      return "bg-blue-300"; // Upcoming event
    } else {
      return "bg-red-300"; // Past event
    }
  };

  // Function to handle day click event
  const handleDayClick = (day) => {
    if (day) {
      console.log(`Clicked on: ${day}/${currentMonth + 1}/${currentYear}`);
    }
  };

  // if (status === "loading") {
  //   return <div>Loading...</div>;
  // }
  // "sss"
  const sectionRef = useRef(null);
  const scrollToSection = () => {
    sectionRef.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 " ref={sectionRef}>
        <Head>
          <title>الصفحة الرئيسية</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {/* <div> */}
        {/* <NotificationDropdown /> */}
        {/* </div> */}
        {/* Centered Heading */}
        <h1
          className={`text-3xl font-bold mb-8 mt-8 bg-gray-50 text-center ${Style["almarai-bold"]}`}
        >
          قسم الاستقدام
        </h1>
        {user.role.toLowerCase() == "admin".toLowerCase() && (
          <div className="relative  p-6 m-6 border  rounded-xl shadow-md">
            <div className="absolute top-[-14px] right-4 bg-gray-50 px-4 text-lg font-bold    rounded-lg">
              الطلبـــات
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 p-8">
              {/* Box 1 */}
              <Link href="/admin/neworderstest">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaTasks className="mb-2 text-3xl" /> {/* Add icon */}
                    الطلبات الجديدة
                  </div>
                  {newOrdersLength > 0 ? (
                    <span className="absolute top-2 right-2     bg-[#8D6C49] text-white text-xs font-bold px-2 py-1 rounded-full">
                      {newOrdersLength > 0 ? newOrdersLength : 0}
                    </span>
                  ) : null}
                </a>
              </Link>
              {/* Box 3 */}
              <Link href="/admin/currentorderstest">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaListAlt className="mb-2 text-3xl" /> {/* Add icon */}
                    الطلبات الحالية
                  </div>
                  {/* Notification Badge */}
                  {currentOrdersLength > 0 ? (
                    <span className="absolute top-2 right-2     bg-[#8D6C49] text-white text-xs font-bold px-2 py-1 rounded-full">
                      {currentOrdersLength > 0 ? currentOrdersLength : 0}
                    </span>
                  ) : null}
                </a>
              </Link>

              <Link href="/admin/endedorders">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaUserTie className="mb-2 text-3xl" /> {/* Add icon */}
                    الطلبات المنتهية
                  </div>
                  {/* Notification Badge */}
                  {finished > 0 ? (
                    <span className="absolute top-2 right-2     bg-[#8D6C49] text-white text-xs font-bold px-2 py-1 rounded-full">
                      {finished > 0 ? finished : 0}
                    </span>
                  ) : null}
                </a>
              </Link>
            </div>
          </div>
        )}

        <div className="relative  p-6 m-6 border  rounded-xl shadow-md">
          <div className="absolute top-[-14px] right-4 bg-gray-50 px-4 text-lg font-bold    rounded-lg">
            الوصول و المغادرة
          </div>
          <div className="mt-10">
            <div className="grid grid-cols-2 md:grid-cols-2 mt-6 lg:grid-cols-2 gap-6 p-8">
              {/* Box 5 */}
              {/* Box 6 */}

              {/* Box 4 */}

              <Link href="/admin/arrival-list">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaPlaneArrival className="mb-2 text-3xl" />{" "}
                    {/* Flight icon */}
                    قائمة الوصول
                  </div>
                  {/* Notification Badge */}
                  {arrivalsLength > 0 ? (
                    <span className="absolute top-2 right-2     bg-[#8D6C49] text-white text-xs font-bold px-2 py-1 rounded-full">
                      {arrivalsLength > 0 ? arrivalsLength : 0}
                    </span>
                  ) : null}
                </a>
              </Link>

              <Link href="/admin/deparatures">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaPlaneDeparture className="mb-2 text-3xl" />{" "}
                    {/* Flight icon */}
                    قائمة المغادرة
                  </div>
                  {/* Notification Badge */}
                  {deparaturesLength > 0 ? (
                    <span className="absolute top-2 right-2     bg-[#8D6C49] text-white text-xs font-bold px-2 py-1 rounded-full">
                      {deparaturesLength > 0 ? deparaturesLength : 0}
                    </span>
                  ) : null}
                </a>
              </Link>

              <Link href="/admin/deparaturesfromsaudi">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaPlaneDeparture className="mb-2 text-3xl" />{" "}
                    {/* Flight icon */}
                    قائمة المغادرة من المملكة
                  </div>
                  {/* Notification Badge */}
                  {/* {deparaturesLength > 0 ? (
                    <span className="absolute top-2 right-2     bg-[#8D6C49] text-white text-xs font-bold px-2 py-1 rounded-full">
                      {deparaturesLength > 0 ? deparaturesLength : 0}
                    </span>
                  ) : null} */}
                </a>
              </Link>
              {/* Box 5 */}
            </div>
          </div>
        </div>

        <div className="relative  p-6 m-6 border  rounded-xl shadow-md">
          <div className="absolute top-[-14px] right-4 bg-gray-50 px-4 text-lg font-bold    rounded-lg">
            العاملات
          </div>
          <div className="mt-10">
            <div className="grid grid-cols-1 md:grid-cols-3 mt-6 lg:grid-cols-3 gap-6 p-8">
              {/* Box 5 */}
              {/* Box 6 */}
              {/* Box 4 */}
              {/* Box 5 */}
              <Link href="/admin/fulllist">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaList className="mb-2 text-3xl" /> {/* Add icon */}
                    بيانات العاملات
                  </div>
                  {/* Notification Badge */}
                  {homeMaidsLength > 0 ? (
                    <span className="absolute top-2 right-2     bg-[#8D6C49] text-white text-xs font-bold px-2 py-1 rounded-full">
                      {homeMaidsLength > 0 ? homeMaidsLength : 0}
                    </span>
                  ) : null}
                </a>
              </Link>
              <Link href="/admin/newhomemaid">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaList className="mb-2 text-3xl" /> {/* Add icon */}
                    اضافة عاملة
                  </div>
                  {/* Notification Badge */}
                  {homeMaidsLength > 0 ? (
                    <span className="absolute top-2 right-2     bg-[#8D6C49] text-white text-xs font-bold px-2 py-1 rounded-full">
                      {homeMaidsLength > 0 ? homeMaidsLength : 0}
                    </span>
                  ) : null}
                </a>
              </Link>
              <Link href="/admin/bookedlist">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaAddressBook className="mb-2 text-3xl" /> {/* Add icon */}
                    قائمة العاملات المحجوزة
                  </div>
                  {/* Notification Badge */}
                </a>
              </Link>

              <Link href="/admin/availablelist">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaAlignJustify className="mb-2 text-3xl" />{" "}
                    {/* Add icon */}
                    قائمة العاملات المتاحة
                  </div>
                  {/* Notification Badge */}
                </a>
              </Link>

              <Link href="/admin/housedarrivals">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaHome className="mb-2 text-3xl" /> {/* Add icon */}
                    قائمة التسكين
                  </div>
                  {/* Notification Badge */}
                </a>
              </Link>

              <Link href="/admin/checklisttable">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaHome className="mb-2 text-3xl" /> {/* Add icon */}
                    قائمة الاعاشة
                  </div>
                  {/* Notification Badge */}
                </a>
              </Link>
            </div>
          </div>
        </div>

        <div className="relative  p-6 m-6 border  rounded-xl shadow-md">
          <div className="absolute top-[-14px] right-4 bg-gray-50 px-4 text-lg font-bold    rounded-lg">
            قواعد البيانات
          </div>
          <div className="mt-10">
            <div className="grid grid-cols-1 md:grid-cols-3 mt-6 lg:grid-cols-3 gap-6 p-8">
              {/* Box 5 */}
              {/* Box 6 */}
              {/* Box 4 */}
              {/* Box 5 */}

              <Link href="/admin/transfersponsorship">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaHome className="mb-2 text-3xl" /> {/* Add icon */}
                    معاملات نقل الكفالة
                  </div>
                  {/* Notification Badge */}
                  {transferSponsorships > 0 ? (
                    <span className="absolute top-2 right-2     bg-[#8D6C49] text-white text-xs font-bold px-2 py-1 rounded-full">
                      {transferSponsorships > 0 ? transferSponsorships : 0}
                    </span>
                  ) : null}
                </a>
              </Link>
              <Link href="/admin/clients">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaPlus className="mb-2 text-3xl" /> {/* Add icon */}
                    قائمة العملاء
                  </div>
                  {/* Notification Badge */}
                </a>
              </Link>
              <Link href="/admin/sessions">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaPlus className="mb-2 text-3xl" /> {/* Add icon */}
                    الجلسات
                  </div>
                  {/* Notification Badge */}
                </a>
              </Link>
              {/* Box 7 */}
              <Link href="/admin/offices">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaHome className="mb-2 text-3xl" /> {/* Add icon */}
                    المكاتب الخارجية
                  </div>
                  {/* Notification Badge */}
                  {/* <span className="absolute top-2 right-2     bg-[#8D6C49] text-white text-xs font-bold px-2 py-1 rounded-full"> */}
                  {/* 2  */}

                  {officesLength > 0 ? (
                    <span className="absolute top-2 right-2     bg-[#8D6C49] text-white text-xs font-bold px-2 py-1 rounded-full">
                      {officesLength > 0 ? officesLength : 0}
                    </span>
                  ) : null}
                </a>
              </Link>
            </div>
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
        {(user.role.toLowerCase() == "admin".toLowerCase() ||
          user.role.toLowerCase() == "viewer".toLowerCase()) && (
          <div className="relative  p-6 m-6 border  rounded-xl shadow-md">
            <div className="absolute top-[-14px] right-4 bg-gray-50 px-4 text-lg font-bold    rounded-lg">
              الارشيف{" "}
            </div>
            <div className="mt-10">
              <div className="grid grid-cols-2 md:grid-cols-2 mt-6 lg:grid-cols-2 gap-6 p-8">
                {/* Box 5 */}
                <Link href="/admin/rejectedlist">
                  <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                    <div className="text-xl font-semibold flex flex-col justify-center items-center">
                      <FaArchive className="mb-2 text-3xl" /> {/* Add icon */}
                      الطلبات المرفوضة
                    </div>
                    {/* Notification Badge */}
                    {rejectedOrdersLength > 0 ? (
                      <span className="absolute top-2 right-2     bg-[#8D6C49] text-white text-xs font-bold px-2 py-1 rounded-full">
                        {rejectedOrdersLength > 0 ? rejectedOrdersLength : 0}
                      </span>
                    ) : null}
                  </a>
                </Link>

                <Link href="/admin/cancelledcontracts">
                  <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                    <div className="text-xl font-semibold flex flex-col justify-center items-center">
                      <FaArchive className="mb-2 text-3xl" /> {/* Add icon */}
                      الطلبات الملغية
                    </div>
                    {/* Notification Badge */}
                    {cancelledorders > 0 ? (
                      <span className="absolute top-2 right-2     bg-[#8D6C49] text-white text-xs font-bold px-2 py-1 rounded-full">
                        {cancelledorders > 0 ? cancelledorders : 0}
                      </span>
                    ) : null}
                  </a>
                </Link>

                {/* Box 5 */}

                {/* Box 7 */}
              </div>
            </div>
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
