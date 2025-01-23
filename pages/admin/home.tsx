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

// Helper function to calculate remaining days
const calculateRemainingDays = (eventDate) => {
  const today = new Date();
  const event = new Date(eventDate);
  const timeDifference = event - today;
  const remainingDays = Math.ceil(timeDifference / (1000 * 3600 * 24));
  return remainingDays > 0 ? remainingDays : "Expired";
};

export default function Home() {
  const router = useRouter();

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
  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        {/* Centered Heading */}
        <h1 className="text-3xl font-bold mb-8 text-center">قسم الاستقدام</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 p-8">
          {/* Box 1 */}
          <Link href="/admin/neworders">
            <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
              <div className="text-xl font-semibold flex flex-col justify-center items-center">
                <FaTasks className="mb-2 text-3xl" /> {/* Add icon */}
                الطلبات الجديدة
              </div>
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                5
              </span>
            </a>
          </Link>
          {/* Box 3 */}
          <Link href="/admin/currentorders">
            <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
              <div className="text-xl font-semibold flex flex-col justify-center items-center">
                <FaListAlt className="mb-2 text-3xl" /> {/* Add icon */}
                الطلبات الحالية
              </div>
              {/* Notification Badge */}
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                3
              </span>
            </a>
          </Link>

          <Link href="/page3">
            <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
              <div className="text-xl font-semibold flex flex-col justify-center items-center">
                <FaUserTie className="mb-2 text-3xl" /> {/* Add icon */}
                الطلبات المنتهية
              </div>
              {/* Notification Badge */}
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                2
              </span>
            </a>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 mt-6 lg:grid-cols-3 gap-6 p-8">
          {/* Box 5 */}
          <Link href="/admin/rejectedorders">
            <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
              <div className="text-xl font-semibold flex flex-col justify-center items-center">
                <FaArchive className="mb-2 text-3xl" /> {/* Add icon */}
                الطلبات المرفوضة
              </div>
              {/* Notification Badge */}
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                2
              </span>
            </a>
          </Link>
          {/* Box 6 */}

          {/* Box 2 */}
          <Link href="/admin/form">
            <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
              <div className="text-xl font-semibold flex flex-col justify-center items-center">
                <FaRegUser className="mb-2 text-3xl" /> {/* Add icon */}
                اضافة عاملة
              </div>
              {/* Notification Badge */}
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                3
              </span>
            </a>
          </Link>

          {/* Box 4 */}

          <Link href="/admin/arrival-list">
            <a className="relative bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all">
              <div className="text-xl font-semibold flex flex-col justify-center items-center">
                <FaPlane className="mb-2 text-3xl" /> {/* Flight icon */}
                قائمة الوصول
              </div>
              {/* Notification Badge */}
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                3
              </span>
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
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                2
              </span>
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

        <div className="flex justify-center items-center mt-10">
          <FaPlane className="text-4xl text-purple-500 mr-2" />{" "}
          {/* Flight Icon */}
          <h2 className="text-2xl font-semibold text-gray-700">
            Arrival Calendar
          </h2>
        </div>

        <div className="mt-10">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => changeMonth("prev")}
              className="text-xl text-blue-500 hover:text-blue-700 rounded-full border-2 border-blue-500 px-4 py-2"
            >
              &lt; Prev
            </button>
            <h2 className="text-2xl font-semibold text-gray-700">
              {new Date(currentYear, currentMonth).toLocaleString("default", {
                month: "long",
              })}{" "}
              {currentYear}
            </h2>
            <button
              onClick={() => changeMonth("next")}
              className="text-xl text-blue-500 hover:text-blue-700 rounded-full border-2 border-blue-500 px-4 py-2"
            >
              Next &gt;
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (day, index) => (
                <div
                  key={index}
                  className="text-center font-semibold text-gray-800"
                >
                  {day}
                </div>
              )
            )}

            {generateCalendar().map((week, weekIndex) =>
              week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`relative border p-4 text-center cursor-pointer rounded-lg ${
                    day
                      ? `${monthColors[currentMonth]} hover:bg-gray-200`
                      : "bg-gray-200"
                  }`}
                  onClick={() => handleDayClick(day)}
                  style={{
                    height: "100px", // Fixed height for all calendar cells
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {day ? (
                    <>
                      <div className="font-semibold text-xl">{day}</div>
                      {getEventsForDay(day).length > 0 && (
                        <div className="mt-2 text-sm text-gray-800">
                          <div className="max-h-28 overflow-y-auto">
                            {getEventsForDay(day)
                              .slice(0, 5)
                              .map((event, index) => (
                                <div
                                  key={index}
                                  className={`mt-1 p-1 rounded text-white ${getEventColor(
                                    event.date
                                  )}`}
                                >
                                  {event.title}
                                </div>
                              ))}
                          </div>

                          {/* If there are more than 5 events, show a "View All" button */}
                          {getEventsForDay(day).length > 5 && (
                            <button
                              className="text-blue-500 mt-2 text-xs"
                              onClick={() =>
                                alert("View all events for this day")
                              }
                            >
                              View All ({getEventsForDay(day).length})
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
