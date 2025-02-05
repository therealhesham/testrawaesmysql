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
  FaArchive,
  FaPlane,
  FaSuperpowers,
} from "react-icons/fa"; // Import icons from react-icons
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
// import {  } from "@ant-design/icons";
import jwt from "jsonwebtoken";
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

  const [currentOrdersLength, setCurrentOrdersLength] = useState(0);
  const [newOrdersLength, setNewOrdersLength] = useState(0);
  const [homeMaidsLength, setHomeMaidsLength] = useState(0);
  const [arrivalsLength, setArrivalsLength] = useState(0);
  const [rejectedOrdersLength, setRejectedOrdersLength] = useState(0);

  const [transferSponsorships, setTransferSponsorshipsLength] = useState(0);

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
        setArrivalsLength(res.arrivalsCount);
        setCurrentOrdersLength(res.currentorders);
        setRejectedOrdersLength(res.rejectedOrders);
        setHomeMaidsLength(res.workers);
        setTransferSponsorshipsLength(res.transferSponsorships);
        setNewOrdersLength(res.neworderCount);
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
  return (
    <Layout>
      <div className="min-h-screen ">
        {/* Centered Heading */}
        <h1 className="text-3xl font-bold mb-8 mt-8 text-center">
          قسم الاستقدام
        </h1>
        {user.role.toLowerCase() == "admin".toLowerCase() && (
          <div className="relative  p-6 m-6 border  rounded-xl shadow-md">
            <div className="absolute top-[-14px] right-4 bg-gray-50 px-4 text-lg font-bold    rounded-lg">
              الطلبـــات
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 p-8">
              {/* Box 1 */}
              <Link href="/admin/neworders">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaTasks className="mb-2 text-3xl" /> {/* Add icon */}
                    الطلبات الجديدة
                  </div>
                  {newOrdersLength > 0 ? (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
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
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
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
                  {/* { > 0 ? (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {currentOrdersLength > 0 ? currentOrdersLength : 0}
                </span>
              ) : null} */}
                </a>
              </Link>
            </div>
          </div>
        )}
        {(user.role.toLowerCase() == "admin".toLowerCase() ||
          user.role.toLowerCase() == "viewer".toLowerCase()) && (
          <div className="relative  p-6 m-6 border  rounded-xl shadow-md">
            <div className="absolute top-[-14px] right-4 bg-gray-50 px-4 text-lg font-bold    rounded-lg">
              الغاء و رفـض
            </div>
            <div className="mt-10">
              <div className="grid grid-cols-1 md:grid-cols-3 mt-6 lg:grid-cols-3 gap-6 p-8">
                {/* Box 5 */}
                <Link href="/admin/rejectedlist">
                  <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                    <div className="text-xl font-semibold flex flex-col justify-center items-center">
                      <FaArchive className="mb-2 text-3xl" /> {/* Add icon */}
                      الطلبات المرفوضة
                    </div>
                    {/* Notification Badge */}
                    {rejectedOrdersLength > 0 ? (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
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
                    {rejectedOrdersLength > 0 ? (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {rejectedOrdersLength > 0 ? rejectedOrdersLength : 0}
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
        <div className="relative  p-6 m-6 border  rounded-xl shadow-md">
          <div className="absolute top-[-14px] right-4 bg-gray-50 px-4 text-lg font-bold    rounded-lg">
            قواعد البيانات
          </div>
          <div className="mt-10">
            <div className="grid grid-cols-1 md:grid-cols-3 mt-6 lg:grid-cols-3 gap-6 p-8">
              {/* Box 5 */}
              {/* Box 6 */}

              {/* Box 4 */}

              <Link href="/admin/arrival-list">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaPlane className="mb-2 text-3xl" /> {/* Flight icon */}
                    قائمة الوصول
                  </div>
                  {/* Notification Badge */}
                  {arrivalsLength > 0 ? (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {arrivalsLength > 0 ? arrivalsLength : 0}
                    </span>
                  ) : null}
                </a>
              </Link>

              <Link href="/admin/deparatures">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaPlane className="mb-2 text-3xl" /> {/* Flight icon */}
                    قائمة المغادرة
                  </div>
                  {/* Notification Badge */}
                  {arrivalsLength > 0 ? (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {arrivalsLength > 0 ? arrivalsLength : 0}
                    </span>
                  ) : null}
                </a>
              </Link>

              {/* Box 5 */}

              <Link href="/admin/fulllist">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaHome className="mb-2 text-3xl" /> {/* Add icon */}
                    بيانات العاملات
                  </div>
                  {/* Notification Badge */}
                  {homeMaidsLength > 0 ? (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {homeMaidsLength > 0 ? homeMaidsLength : 0}
                    </span>
                  ) : null}
                </a>
              </Link>

              <Link href="/admin/transfersponsorship">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaHome className="mb-2 text-3xl" /> {/* Add icon */}
                    معاملات نقل الكفالة
                  </div>
                  {/* Notification Badge */}
                  {transferSponsorships > 0 ? (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {transferSponsorships > 0 ? transferSponsorships : 0}
                    </span>
                  ) : null}
                </a>
              </Link>

              <Link href="/admin/addadmin">
                <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
                  <div className="text-xl font-semibold flex flex-col justify-center items-center">
                    <FaPlus className="mb-2 text-3xl" /> {/* Add icon */}
                    اضافة مدير
                  </div>
                  {/* Notification Badge */}
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    2
                  </span>
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
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    2
                  </span>
                </a>
              </Link>
            </div>
          </div>
        </div>
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
