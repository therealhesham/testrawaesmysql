import Layout from "example/containers/Layout";
import Link from "next/link";
import {
  FaPlus,
  FaRegUser,
  FaListAlt,
  FaTasks,
  FaUserTie,
  FaHome,
  FaArchive,
  FaPlane,
} from "react-icons/fa"; // Import icons from react-icons
import { useState, useEffect } from "react";

// Helper function to calculate remaining days
const calculateRemainingDays = (eventDate) => {
  const today = new Date();
  const event = new Date(eventDate);
  const timeDifference = event - today;
  const remainingDays = Math.ceil(timeDifference / (1000 * 3600 * 24));
  return remainingDays > 0 ? remainingDays : "Expired";
};

export default function Home() {
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

  const [events, setEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

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

  useEffect(() => {
    fetchEvents();
  }, []);

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

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

  const getEventsForDay = (day) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      const eventMonth = eventDate.getMonth();
      const eventDay = eventDate.getDate();
      return eventMonth === currentMonth && eventDay === day;
    });
  };

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

  const handleDayClick = (day) => {
    if (day) {
      console.log(`Clicked on: ${day}/${currentMonth + 1}/${currentYear}`);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        <h1 className="text-3xl font-bold mb-8 text-center">قسم الاستقدام</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 p-8">
          {/* Box 1 */}
          <Link href="/admin/addneworderbyadmin">
            <a className="relative bg-white p-6 rounded-lg shadow-lg transition-all">
              <div className="text-xl font-semibold flex flex-col justify-center items-center">
                <FaPlus className="mb-2 text-3xl" />
                اضافة طلب
              </div>
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                3
              </span>
              {/* Floating Plus Button on the middle of the right edge */}
              <button className="absolute top-1/2 right-[-20px] transform translate-y-[-50%] bg-purple-500 text-white p-3 rounded-full shadow-lg flex items-center justify-center">
                <FaPlus className="text-xl" />
              </button>
            </a>
          </Link>

          {/* Box 2 */}
          <Link href="/admin/form">
            <a className="relative bg-white p-6 rounded-lg shadow-lg transition-all">
              <div className="text-xl font-semibold flex flex-col justify-center items-center">
                <FaRegUser className="mb-2 text-3xl" />
                اضافة عاملة
              </div>
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                3
              </span>
              {/* Floating Plus Button on the middle of the right edge */}
              <button className="absolute top-1/2 right-[-20px] transform translate-y-[-50%] bg-purple-500 text-white p-3 rounded-full shadow-lg flex items-center justify-center">
                <FaPlus className="text-xl" />
              </button>
            </a>
          </Link>

          {/* Box 3 */}
          <Link href="/admin/currentorders">
            <a className="relative bg-white p-6 rounded-lg shadow-lg transition-all">
              <div className="text-xl font-semibold flex flex-col justify-center items-center">
                <FaListAlt className="mb-2 text-3xl" />
                الطلبات الحالية
              </div>
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                3
              </span>
              {/* Floating Plus Button on the middle of the right edge */}
              <button className="absolute top-1/2 right-[-20px] transform translate-y-[-50%] bg-purple-500 text-white p-3 rounded-full shadow-lg flex items-center justify-center">
                <FaPlus className="text-xl" />
              </button>
            </a>
          </Link>

          {/* Box 4 */}
          <Link href="/admin/neworders">
            <a className="relative bg-white p-6 rounded-lg shadow-lg transition-all">
              <div className="text-xl font-semibold flex flex-col justify-center items-center">
                <FaTasks className="mb-2 text-3xl" />
                الطلبات الجديدة
              </div>
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                5
              </span>
              {/* Floating Plus Button on the middle of the right edge */}
              <button className="absolute top-1/2 right-[-20px] transform translate-y-[-50%] bg-purple-500 text-white p-3 rounded-full shadow-lg flex items-center justify-center">
                <FaPlus className="text-xl" />
              </button>
            </a>
          </Link>

          {/* Box 5 */}
          <Link href="/arrival-list">
            <a className="relative bg-white p-6 rounded-lg shadow-lg transition-all">
              <div className="text-xl font-semibold flex flex-col justify-center items-center">
                <FaPlane className="mb-2 text-3xl" />
                قائمة الوصول
              </div>
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                3
              </span>
              {/* Floating Plus Button on the middle of the right edge */}
              <button className="absolute top-1/2 right-[-20px] transform translate-y-[-50%] bg-purple-500 text-white p-3 rounded-full shadow-lg flex items-center justify-center">
                <FaPlus className="text-xl" />
              </button>
            </a>
          </Link>

          {/* Box 6 */}
          <Link href="/page3">
            <a className="relative bg-white p-6 rounded-lg shadow-lg transition-all">
              <div className="text-xl font-semibold flex flex-col justify-center items-center">
                <FaUserTie className="mb-2 text-3xl" />
                الطلبات المنتهية
              </div>
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                2
              </span>
              {/* Floating Plus Button on the middle of the right edge */}
              <button className="absolute top-1/2 right-[-20px] transform translate-y-[-50%] bg-purple-500 text-white p-3 rounded-full shadow-lg flex items-center justify-center">
                <FaPlus className="text-xl" />
              </button>
            </a>
          </Link>

          {/* Box 7 */}
          <Link href="/page3">
            <a className="relative bg-white p-6 rounded-lg shadow-lg transition-all">
              <div className="text-xl font-semibold flex flex-col justify-center items-center">
                <FaArchive className="mb-2 text-3xl" />
                الطلبات المرفوضة
              </div>
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                2
              </span>
              {/* Floating Plus Button on the middle of the right edge */}
              <button className="absolute top-1/2 right-[-20px] transform translate-y-[-50%] bg-purple-500 text-white p-3 rounded-full shadow-lg flex items-center justify-center">
                <FaPlus className="text-xl" />
              </button>
            </a>
          </Link>
        </div>

        <div className="flex justify-center items-center mt-10">
          <FaPlane className="text-4xl text-purple-500 mr-2" />
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
