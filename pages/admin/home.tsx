//@ts-ignore
//@ts-nocheck
"use client";
import Layout from "example/containers/Layout";
import Link from "next/link";
import Head from "next/head";
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
  FaArrowCircleLeft,
} from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Style from "/styles/Home.module.css";
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";
import { HomeIcon } from "icons";
import NotificationDropdown from "components/notifications";
import Chat from "./chat";
import { ArrowLeftOutlined, FieldTimeOutlined, RightCircleFilled } from "@ant-design/icons";
import { ArrowCircleLeftIcon, ArrowLeftIcon } from "@heroicons/react/outline";
import { PlusIcon } from "@heroicons/react/solid";

// Helper function to calculate remaining days
const calculateRemainingDays = (eventDate) => {
  const today = new Date();
  const event = new Date(eventDate);
  const timeDifference = event - today;
  const remainingDays = Math.ceil(timeDifference / (1000 * 3600 * 24));
  return remainingDays > 0 ? remainingDays : "Expired";
};

// Helper function to get current month and year in Arabic
const getCurrentMonthYear = () => {
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const today = new Date();
  const month = months[today.getMonth()];
  const year = today.getFullYear();
  return `${month} ${year}`;
};

export default function Home({ user }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthYear());
  const days = ['س', 'م', 'ت', 'و', 'ث', 'ج', 'س'];
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  
  const getDaysInMonth = (monthIndex, year) => {
    return new Date(year, monthIndex + 1, 0).getDate();
  };
  
  const getFirstDayOffset = (monthIndex, year) => {
    const jsDay = new Date(year, monthIndex, 1).getDay();
    return (jsDay + 6) % 7;
  };
  
  const [monthName, yearStr] = currentMonth.split(' ');
  const monthIndex = months.indexOf(monthName);
  const year = parseInt(yearStr);
  const daysInMonth = getDaysInMonth(monthIndex, year);
  const firstDayOffset = getFirstDayOffset(monthIndex, year);
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', taskDeadline: '' });

  const getNextMonth = () => {
    let month = monthIndex;
    let currentYear = year;
    if (month === 11) {
      month = 0;
      currentYear += 1;
    } else {
      month += 1;
    }
    setCurrentMonth(`${months[month]} ${currentYear}`);
  };

  const getPrevMonth = () => {
    let month = monthIndex;
    let currentYear = year;
    if (month === 0) {
      month = 11;
      currentYear -= 1;
    } else {
      month -= 1;
    }
    setCurrentMonth(`${months[month]} ${currentYear}`);
  };

  const monthColors = [
    "bg-red-300", "bg-pink-300", "bg-pink-500", "bg-purple-300", "bg-teal-300",
    "bg-blue-300", "bg-green-300", "bg-yellow-300", "bg-orange-300", "bg-teal-300",
    "bg-blue-500", "bg-purple-500",
  ];

  const [events, setEvents] = useState([]);
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

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (!router) return;
    fetchEvents();
  }, [router]);

  const [currentOrdersLength, setCurrentOrdersLength] = useState(0);
  const [cancelledorders, setCancelledorders] = useState(0);
  const [deparaturesLength, setDeparaturesLength] = useState(0);
  const [externaldeparaturesLength, seteExternalDeparaturesLength] = useState(0);

  const [newOrdersLength, setNewOrdersLength] = useState(0);
  const [homeMaidsLength, setHomeMaidsLength] = useState(0);
  const [arrivalsLength, setArrivalsLength] = useState(0);
  const [rejectedOrdersLength, setRejectedOrdersLength] = useState(0);
  const [finished, setFinished] = useState(0);
  const [officesLength, setOfficesLengthLength] = useState(0);
  const [transferSponsorshipsLength, setTransferSponsorshipsLength] = useState(0);
const [cancelledOrderslist,setCancelledorderslist]=useState(0)

const  fetchInitialCancelled = async()=>{
 try {
      // alert(user.id)
      const response = await fetch(`/api/homeinitialdata/cancelledorders`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (response.status === 200) {
        // console.log(data)
        setCancelledorderslist(data.data);
      } else {
        console.error("Error fetching tasks:", data.error);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }

}
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
      if (response.status === 200) {
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

  // Fetch tasks for the user
  const fetchTasks = async () => {
    try {
      // alert(user.id)
      const response = await fetch(`/api/tasks/${user.id}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (response.status === 200) {
        console.log(data)
        setTasks(data);
      } else {
        console.error("Error fetching tasks:", data.error);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // Handle task creation
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (newTask.title && newTask.description && newTask.taskDeadline) {
      try {
        const response = await fetch(`/api/tasks/${user.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: newTask.description,
            Title: newTask.title,
            taskDeadline: newTask.taskDeadline,
            isCompleted: false,
          }),
        });
        const data = await response.json();
        if (response.status === 201) {
          setTasks([...tasks, data]);
          setNewTask({ title: '', description: '', taskDeadline: '' });
          setIsModalOpen(false);
        } else {
          alert(data.error);
          console.error("Error creating task:", data.error);
        }
      } catch (error) {
        alert(error);
        console.error("Error creating task:", error);
      }
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    fetchData();
    fetchTasks();
    fetchInitialCancelled()
  }, []);

  const [orders, setOrders] = useState([]);
  const [newOrders, setNewOrders] = useState([]);
  const [currentOrders, setCurrentOrders] = useState([]);
  const [endedOrders, setEndedOrders] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [internalArrivals, setInternalArrivals] = useState([]);
  const [internalDeparatures, setInternalDeparatures] = useState([]);
  const [externalDeparatures, setExternalDeparatures] = useState([]);
  const [fullList, setFullList] = useState([]);
  const [bookedList, setBookedList] = useState([]);
  const [availableList, setAvailableList] = useState([]);
  const [housingSection, setHousingSection] = useState([]);
  const [housed, setHoused] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [ordersSectionState, setOrdersSectionState] = useState("newOrders");
  const [arrivalsSectionState, setArrivalsSectionState] = useState("internalArrivals");
  const [housingSectionState, setHousingSectionState] = useState("housing");
  const [workersSectionState, setWorkersSectionState] = useState("workers");
  const [relationsSectionState, setRelationsSectionState] = useState("relations");
  const [relationsSection, setRelationsSection] = useState([]);
  const [relations, setRelations] = useState([]);
  const [transferSponsorships, setTransferSponsorships] = useState([]);
  const [workersSection, setWorkersSection] = useState([]);
  const [offices, setOffices] = useState([]);

  const fetchNewOrdersData = async () => {
    try {
      const response = await fetch(`/api/neworderlistprisma/1`, { method: "get" });
      const res = await response.json();
      setOrdersSectionState("newOrders");
      setNewOrders(res.data.slice(0, 3));
      setOrders(res.data);
    } catch (error) {
      console.error("Error in fetch:", error);
    }
  };

  const fetchFullList = async () => {
    try {
      const response = await fetch(`/api/homemaidprisma?page=1`, { method: "get" });
      const res = await response.json();
      setWorkersSectionState("workers");
      setWorkersSection(res.data.slice(0, 3));
      setFullList(res.data.slice(0, 3));
    } catch (error) {
      console.log("error", error);
    }
  };

  const fetchBookedList = async () => {
    try {
      const response = await fetch(`/api/bookedlist?page=1`, { method: "get" });
      const res = await response.json();
      console.log(res)
      setBookedList(res.data.slice(0, 3));
    } catch (error) {
      console.log("error", error);
    }
  };

  const fetchCurrentOrdersData = async () => {
    try {
      const response = await fetch(`/api/currentordersprisma`, { method: "get" });
      const res = await response.json();
      setCurrentOrders(res.homemaids.slice(0, 3));
    } catch (error) {
      console.error("Error in fetch:", error);
    }
  };

  const fetchEndedOrdersData = async () => {
    try {
      const response = await fetch(`/api/endedorders/`, { method: "get" });
      const res = await response.json();
      setEndedOrders(res.homemaids.slice(0,3))
    } catch (error) {
      console.error("Error in fetch:", error);
    }
  };

  const fetchArrivalsData = async () => {
    try {
      const response = await fetch(`/api/arrivals`, { method: "get" });
      const res = await response.json();
      setArrivals(res.data.slice(0, 3));
      console.log(res.data);
      setInternalArrivals(res.data.slice(0, 3));
    } catch (error) {
      console.error("Error in fetch:", error);
    }
  };

  const fetchInternalDeparaturesData = async () => {
    try {
      const response = await fetch(`/api/deparatures`, { method: "get" });
      const res = await response.json();
      setInternalDeparatures(res.data);
    } catch (error) {
      console.error("Error in fetch:", error);
    }
  };

  const fetchExternalDeparaturesData = async () => {
    try {
      const response = await fetch(`/api/homeinitialdata/deparaturefromsaudi`, { method: "get" });
      const res = await response.json();
      setExternalDeparatures(res.data);
      seteExternalDeparaturesLength(res.deparaturesCount)
    
    } catch (error) {
      console.error("Error in fetch:", error);
    }
  };

  const fetchHoused = async () => {
    try {
      const response = await fetch(`/api/confirmhousinginformation`, { method: "get" });
      const res = await response.json();
      setHousingSection(res.housing.slice(0, 3));
      setHoused(res.housing.slice(0, 3));
    } catch (error) {
      console.error("Error in fetch:", error);
    }
  };
const [sessionsLength,setSessionsLength]=useState(0)
  const fetchSessions = async () => {
    
    try {
      const response = await fetch(`/api/sessions`, { method: "get" });
      const res = await response.json();
      setSessionsLength(res.totalResults)
      setSessions(res.sessions.slice(0, 3));
    } catch (error) {
      console.error("Error in fetch:", error);
    }
  };

  const fetchRelations = async () => {
    try {
      const response = await fetch(`/api/relations`, { method: "get" });
      const res = await response.json();
      setRelationsSection(res);
      setRelations(res);
    } catch (error) {
      console.error("Error in fetch:", error);
    }
  };

  const fetchTransferSponsorships = async () => {
    try {
      const response = await fetch(`/api/transfersponsorships`, { method: "get" });
      const res = await response.json();
      setTransferSponsorships(res);
    } catch (error) {
      console.error("Error in fetch:", error);
    }
  };

  const fetchOffices = async () => {
    try {
      const response = await fetch(`/api/offices`, { method: "get" });
      const res = await response.json();
      setOffices(res);
    } catch (error) {
      console.error("Error in fetch:", error);
    }
  };

  useEffect(() => {
    fetchNewOrdersData();
    fetchCurrentOrdersData();
    fetchEndedOrdersData();
    fetchArrivalsData();
    fetchInternalDeparaturesData();
    fetchExternalDeparaturesData();
    fetchHoused();
    fetchSessions();
    fetchRelations();
    fetchFullList();
    fetchBookedList();
    fetchTransferSponsorships();
    fetchOffices();
  }, []);

  const sectionRef = useRef(null);
  const scrollToSection = () => {
    sectionRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const getEventsForDay = (day) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      const eventMonth = eventDate.getMonth();
      const eventDay = eventDate.getDate();
      return eventMonth === monthIndex && eventDay === day;
    });
  };

  // Get tasks for a specific day
  const getTasksForDay = (day) => {
    return tasks.filter((task) => {
      const taskDate = new Date(task.taskDeadline);
      const taskMonth = taskDate.getMonth();
      const taskDay = taskDate.getDate();
      return taskMonth === monthIndex && taskDay === day;
    });
  };

  const getEventColor = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);
    if (event.toDateString() === today.toDateString()) {
      return "bg-green-300";
    } else if (event > today) {
      return "bg-blue-300";
    } else {
      return "bg-red-300";
    }
  };

  const handleDayClick = (day) => {
    if (day) {
      const tasksForDay = getTasksForDay(day);
      console.log(`Tasks for ${day}/${monthIndex + 1}/${year}:`, tasksForDay);
      if (tasksForDay.length > 0) {
        alert(`Tasks for ${day}/${monthIndex + 1}/${year}:\n${tasksForDay.map(t => t.Title).join('\n')}`);
      } else {
        alert(`No tasks for ${day}/${monthIndex + 1}/${year}`);
      }
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50" ref={sectionRef}>
        <Head>
          <title>الصفحة الرئيسية</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4 mx-auto">
          {/* Calendar Widget */}
          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition duration-300 md:col-span-1">
            <div className="flex justify-between items-center mb-4">
              <button onClick={getPrevMonth} className="text-teal-600 hover:text-teal-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <h2 className="text-2xl font-semibold text-gray-800">{currentMonth}</h2>
              <button onClick={getNextMonth} className="text-teal-600 hover:text-teal-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-gray-600">
              {days.map((day) => (
                <div key={day} className="font-medium">{day}</div>
              ))}
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`empty-start-${i}`} className="h-8"></div>
              ))}
              {dates.map((date) => {
                const hasTasks = getTasksForDay(date).length > 0;
                const tasksForDay = getTasksForDay(date);
                const today = new Date();
                const isToday =
                  date === today.getDate() &&
                  monthIndex === today.getMonth() &&
                  year === today.getFullYear();
                return (
                  <div
                    key={date}
                    onClick={() => handleDayClick(date)}
                    className={`group relative h-10 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-teal-800 text-white'
                        : hasTasks
                        ? 'bg-yellow-300 text-gray-800'
                        : 'hover:bg-teal-100'
                    } cursor-pointer`}
                  >
                    <span>{date}</span>
                    {hasTasks && (
                      <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg p-2 top-10 z-10 max-w-xs">
                        <p className="font-semibold">المهام ({tasksForDay.length}):</p>
                        <ul className="list-disc list-inside">
                          {tasksForDay.map((task, index) => (
                            <li key={index}>
                              {task.Title} - {new Date(task.taskDeadline).toLocaleDateString('ar-SA')}
                              <br />
                              <span className="text-gray-300">{task.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Tasks Widget */}
          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition duration-300 md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className={`${Style["tajawal-medium"]} text-2xl font-semibold text-gray-800`}>المهام اليومية</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className={`bg-teal-800 text-white flex flex-row items-center px-4 py-2 rounded-lg ${Style["tajawal-medium"]}`}
              >
                <span className="flex flex-row items-center gap-2">
                  <PlusIcon height={16} width={16} />
                  إضافة مهمة
                </span>
              </button>
            </div>
            <ul className={`${Style["tajawal-medium"]} space-y-4`}>
              {tasks.map((task, index) => (
                <li key={index} className="border px-3 rounded-md py-2 border-gray-200 pb-4 last:border-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-medium text-gray-900">{task.Title}</p>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      <p className="text-sm text-gray-500">
                        الموعد النهائي: {new Date(task.taskDeadline).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <span className="text-sm text-teal-600">{task.isCompleted ? 'مكتمل' : 'غير مكتمل'}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      
          <section id="requests" className="info-card card bg-gradient-to-br mt-2 from-white to-gray-50 border border-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <header className="info-card-header flex justify-between items-center mb-6">
              <div className={`info-card-title-tabs flex flex-col gap-6 ${Style["tajawal-medium"]}`}>
                <h3 className="info-card-title text-2xl font-semibold text-gray-800 tracking-tight">الطلبات</h3>
                <nav className="info-card-tabs flex gap-6 border-b border-gray-100 pb-3">
                  <a
                    onClick={() => {
                      setOrdersSectionState("newOrders");
                      setOrders(newOrders);
                    }}
                    className={`tab-item text-sm cursor-pointer font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${ordersSectionState === "newOrders" ? "bg-teal-50 text-teal-700" : ""}`}
                  >
                    الطلبات الجديدة <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{newOrdersLength}</span>
                  </a>
                  <a
                    onClick={() => {
                      setOrdersSectionState("currentOrders");
                      setOrders(currentOrders);
                    }}
                    className={`tab-item text-sm cursor-pointer font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${ordersSectionState === "currentOrders" ? "bg-teal-50 text-teal-700" : ""}`}
                  >
                    طلبات تحت الإجراء <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{currentOrdersLength}</span>
                  </a>
                  <a
                    onClick={() => {
                      setOrdersSectionState("endedOrders");
                      setOrders(endedOrders);
                    }}
                    className={`tab-item text-sm cursor-pointer font-medium text-gray-600 ${ordersSectionState === "endedOrders" ? "bg-teal-50 text-teal-700" : ""} hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200`}
                  >
                    الطلبات المكتملة <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{finished}</span>
                  </a>
                  <a
                    href="#"
                    className={`tab-item text-sm cursor-pointer font-medium text-gray-600 ${ordersSectionState === "cancelledOrders" ? "bg-teal-50 text-teal-700" : ""} hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200`}
                    onClick={() => {
                      setOrdersSectionState("cancelledOrdrs");
                      setOrders(cancelledOrderslist);
                    }}

                  >
                    الطلبات الملغية <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{cancelledorders}</span>
                  </a>
                  {/* <a
                    href="#"
                    className="tab-item text-sm cursor-pointer font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 hover:bg-teal-50"
                  >
                    الطلبات المرفوضة <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{rejectedOrdersLength}</span>
                  </a> */}
                </nav>
              </div>
              <a
                onClick={() => {
                  ordersSectionState === "newOrders"
                    ? router.push("/admin/neworders")
                    : ordersSectionState === "currentOrders"
                    ? router.push("/admin/currentorderstest")
                    : ordersSectionState === "endedOrders"
                    ? router.push("/admin/endedorders")
                    : ordersSectionState === "cancelledOrders"
                    ? router.push("/admin/cancelledorders")
                    : null;
                }}
                className="view-all-btn cursor-pointer bg-teal-800 text-white text-sm font-medium px-5 py-2 rounded-lg shadow-sm hover:shadow-md hover:from-teal-700 hover:to-teal-900 transition-all duration-300"
              >
                عرض الكل
              </a>
            </header>
            <div className="info-card-body flex flex-col gap-4">
              {orders.map((order) => (
                <div key={order.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
                  <div className="item-details flex flex-col gap-2">
                    <p className="item-title text-sm font-semibold text-gray-900">الطلب رقم #{order.id}</p>
                    <p className="item-subtitle text-xs text-gray-600">العميل: {order.ClientName}</p>
                    <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
                      منذ {order.createdAt} <FieldTimeOutlined />
                    </p>
                  </div>
                  <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
                    <ArrowLeftOutlined className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
      
        <section id="arrivals" className="info-card card bg-gradient-to-br mt-2 from-white to-gray-50 border border-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <header className="info-card-header flex justify-between items-center mb-6">
            <div className={`${Style["tajawal-medium"]} info-card-title-tabs flex flex-col gap-6`}>
              <h3 className={`${Style["tajawal-medium"]} info-card-title text-2xl font-semibold text-gray-800 tracking-tight`}>الوصول و المغادرة</h3>
              <nav className="info-card-tabs flex gap-6 border-b border-gray-100 pb-3">
                <a
                  onClick={() => {
                    setArrivalsSectionState("internalArrivals");
                    setArrivals(internalArrivals);
                  }}
                  className={`tab-item cursor-pointer text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${arrivalsSectionState === "internalArrivals" ? "text-teal-700 bg-teal-50" : ""}`}
                >
                  الوصول <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{arrivalsLength}</span>
                </a>
                <a
                  onClick={() => {
                    setArrivalsSectionState("internalDeparatures");
                    setArrivals(internalDeparatures);
                  }}
                  className={`tab-item cursor-pointer text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${arrivalsSectionState === "internalDeparatures" ? "text-teal-700 bg-teal-50" : ""}`}
                >
                  مغادرة داخلية <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{deparaturesLength}</span>
                </a>
                <a
                  onClick={() => {
                    setArrivalsSectionState("externalDeparatures");
                    setArrivals(externalDeparatures);
                  }}
                  className={`tab-item cursor-pointer text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${arrivalsSectionState === "externalDeparatures" ? "text-teal-700 bg-teal-50" : ""}`}
                >
                  مغادرة خارجية <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{externaldeparaturesLength}</span>
                </a>
              </nav>
            </div>
            <a
              onClick={() => {
                arrivalsSectionState === "internalArrivals"
                  ? router.push("/admin/arrival-list")
                  : arrivalsSectionState === "internalDeparatures"
                  ? router.push("/admin/deparatures")
                  : arrivalsSectionState === "externalDeparatures"
                  ? router.push("/admin/deparaturesfromsaudi")
                  : null;
              }}
              className="view-all-btn cursor-pointer bg-teal-800 text-white text-sm font-medium px-5 py-2 rounded-lg shadow-sm hover:shadow-md hover:from-teal-700 hover:to-teal-900 transition-all duration-300"
            >
              عرض الكل
            </a>
          </header>
          <div className="info-card-body flex flex-col gap-4">
            {arrivals.map((order) => (
              <div key={order.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
                <div className="item-details flex flex-col gap-2">
                  <p className="item-title text-sm font-semibold text-gray-900">الوصول رقم #{order.id}</p>
                  <p className="item-subtitle text-xs text-gray-600">من: {order.ArrivalCity}</p>
                  <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
                    منذ {order.createdAt} <FieldTimeOutlined />
                  </p>
                </div>
                <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
                  <ArrowLeftOutlined className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
        <section id="housing" className={`${Style["tajawal-medium"]} info-card card bg-gradient-to-br mt-2 from-white to-gray-50 border border-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
          <header className="info-card-header flex justify-between items-center mb-6">
            <div className={`info-card-title-tabs flex flex-col gap-6 ${Style["tajawal-medium"]}`}>
              <h3 className="info-card-title text-2xl font-semibold text-gray-800 tracking-tight">شئون الاقامة</h3>
              <nav className="info-card-tabs flex gap-6 border-b border-gray-100 pb-3">
                <a
                  onClick={() => {
                    setHousingSectionState("housing");
                    setHousingSection(housed);
                  }}
                  className={`tab-item cursor-pointer text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${housingSectionState === "housing" ? "text-teal-700 bg-teal-50" : ""}`}
                >
                  التسكين <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{housed.length}</span>
                </a>
                <a
                  onClick={() => {
                    setHousingSectionState("checkedTable");
                    setHousingSection(housed);
                  }}
                  className={`tab-item cursor-pointer text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${housingSectionState === "checkedTable" ? "text-teal-700 bg-teal-50" : ""}`}
                >
                  الاعاشة <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{housed.length}</span>
                </a>
                <a
                  onClick={() => {
                    setHousingSectionState("sessions");
                    setHousingSection(sessions);
                  }}
                  className={`tab-item cursor-pointer text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${housingSectionState === "sessions" ? "text-teal-700 bg-teal-50" : ""}`}
                >
                  الجلسات <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{sessionsLength}</span>
                </a>
              </nav>
            </div>
            <a
              onClick={() => {
                housingSectionState === "housing"
                  ? router.push("/admin/housedarrivals")
                  : housingSectionState === "checkedTable"
                  ? router.push("/admin/checkedtable")
                  : housingSectionState === "sessions"
                  ? router.push("/admin/sessions")
                  : null;
              }}
              className="view-all-btn cursor-pointer bg-teal-800 text-white text-sm font-medium px-5 py-2 rounded-lg shadow-sm hover:shadow-md hover:from-teal-700 hover:to-teal-900 transition-all duration-300"
            >
              عرض الكل
            </a>
          </header>
          <div className="info-card-body flex flex-col gap-4">
            {housingSection.map((order) => (
              <div key={order.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
                <div className="item-details flex flex-col gap-2">
                  <p className="item-title text-sm font-semibold text-gray-900">الطلب رقم #{order.id}</p>
                  <p className="item-subtitle text-xs text-gray-600">العميل: {order.ClientName}</p>
                  <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
                    <img src="/page/7477a300-42ff-4b3d-bf67-3c23ca8d5be7/images/I122_1559_61_2881.svg" alt="time-icon" className="w-4 h-4" /> منذ {order.createdAt}
                  </p>
                </div>
                <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
                  <img src="/page/7477a300-42ff-4b3d-bf67-3c23ca8d5be7/images/I122_1559_61_2873.svg" alt="arrow-icon" className="w-4 h-4 transform rotate-180" />
                </button>
              </div>
            ))}
          </div>
        </section>
        <section id="homemaids" className={`${Style["tajawal-medium"]} info-card card bg-gradient-to-br mt-2 from-white to-gray-50 border border-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
          <header className="info-card-header flex justify-between items-center mb-6">
            <div className="info-card-title-tabs flex flex-col gap-6">
              <h3 className="info-card-title text-2xl font-semibold text-gray-800 tracking-tight">العاملات</h3>
              <nav className="info-card-tabs flex gap-6 border-b border-gray-100 pb-3">
                <a
                  onClick={() => {
                    setWorkersSectionState("workers");
                    setWorkersSection(fullList);
                  }}
                  className={`tab-item text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${workersSectionState === "workers" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  العاملات <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{fullList.length}</span>
                </a>
                <a
                  onClick={() => {
                    setWorkersSectionState("bookedlist");
                    setWorkersSection(bookedList);
                  }}
                  className={`tab-item text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${workersSectionState === "bookedlist" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  العاملات المحجوزة <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{bookedList.length}</span>
                </a>
                <a
                  onClick={() => {
                    setWorkersSectionState("availablelist");
                    setWorkersSection(availableList);
                  }}
                  className={`tab-item text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${workersSectionState === "availablelist" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  العاملات المتاحة <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{availableList.length}</span>
                </a>
              </nav>
            </div>
            <a
              onClick={() => {
                workersSectionState === "workers"
                  ? router.push("/admin/fullist")
                  : workersSectionState === "bookedlist"
                  ? router.push("/admin/bookedlist")
                  : workersSectionState === "availablelist"
                  ? router.push("/admin/availablelist")
                  : null;
              }}
              className="view-all-btn cursor-pointer bg-teal-800 text-white text-sm font-medium px-5 py-2 rounded-lg shadow-sm hover:shadow-md hover:from-teal-700 hover:to-teal-900 transition-all duration-300"
            >
              عرض الكل
            </a>
          </header>
          <div className="info-card-body flex flex-col gap-4">
            {workersSection.map((order) => (
              <div key={order.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
                <div className="item-details flex flex-col gap-2">
                  <p className="item-title text-sm font-semibold text-gray-900">عاملة رقم #{order.id}</p>
                  <p className="item-subtitle text-xs text-gray-600">اسم العاملة: {order.Name}</p>
                  <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
                    منذ {order.createdAt} <FieldTimeOutlined />
                  </p>
                </div>
                <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
                  <ArrowLeftOutlined className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
        <section id="public-relations" className={`${Style["tajawal-medium"]} info-card card bg-gradient-to-br mt-2 from-white to-gray-50 border border-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
          <header className="info-card-header flex justify-between items-center mb-6">
            <div className="info-card-title-tabs flex flex-col gap-6">
              <h3 className="info-card-title text-2xl font-semibold text-gray-800 tracking-tight">إدارة العلاقات</h3>
              <nav className="info-card-tabs flex gap-6 border-b border-gray-100 pb-3">
                <a
                  onClick={() => {
                    setRelationsSectionState("relations");
                    setRelationsSection(relations);
                  }}
                  className={`tab-item text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${relationsSectionState === "relations" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  قائمة العلاقات <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{relations.length}</span>
                </a>
                <a
                  onClick={() => {
                    setRelationsSectionState("sponsorship-transfers");
                    setRelationsSection(transferSponsorships);
                  }}
                  className={`tab-item text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${relationsSectionState === "sponsorship-transfers" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  معاملات نقل الكفالة <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{transferSponsorships.length}</span>
                </a>
                <a
                  onClick={() => {
                    setRelationsSectionState("foreign-offices");
                    setRelationsSection(offices);
                  }}
                  className={`tab-item text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${relationsSectionState === "foreign-offices" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  المكاتب الخارجية <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{offices.length}</span>
                </a>
              </nav>
            </div>
            <a
              onClick={() => {
                relationsSectionState === "relations"
                  ? router.push("/admin/relations")
                  : relationsSectionState === "sponsorship-transfers"
                  ? router.push("/admin/transfersponsorship")
                  : relationsSectionState === "foreign-offices"
                  ? router.push("/admin/foreign-offices")
                  : null;
              }}
              className="view-all-btn cursor-pointer bg-teal-800 text-white text-sm font-medium px-5 py-2 rounded-lg shadow-sm hover:shadow-md hover:from-teal-700 hover:to-teal-900 transition-all duration-300"
            >
              عرض الكل
            </a>
          </header>
          <div className="info-card-body flex flex-col gap-4">
            {relationsSection.map((order) => (
              <div key={order.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
                <div className="item-details flex flex-col gap-2">
                  <p className="item-title text-sm font-semibold text-gray-900">الطلب رقم #{order.id}</p>
                  <p className="item-subtitle text-xs text-gray-600">العميل: {order.ClientName}</p>
                  <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
                    <img src="/page/7477a300-42ff-4b3d-bf67-3c23ca8d5be7/images/I122_1559_61_2881.svg" alt="time-icon" className="w-4 h-4" /> منذ {order.createdAt}
                  </p>
                </div>
                <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
                  <img src="/page/7477a300-42ff-4b3d-bf67-3c23ca8d5be7/images/I122_1559_61_2873.svg" alt="arrow-icon" className="w-4 h-4 transform rotate-180" />
                </button>
              </div>
            ))}
          </div>
        </section>
        {isModalOpen && (
          <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${Style["tajawal-medium"]}`}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">إضافة مهمة جديدة</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddTask}>
                <div className={`${Style["tajawal-medium"]} mb-4`}>
                  <label className="block text-sm font-medium text-gray-700">عنوان المهمة</label>
                  <input
                    type="text"
                    name="title"
                    value={newTask.title}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-teal-500 focus:border-teal-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">الوصف</label>
                  <textarea
                    name="description"
                    value={newTask.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-teal-500 focus:border-teal-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">الموعد النهائي</label>
                  <input
                    type="date"
                    name="taskDeadline"
                    value={newTask.taskDeadline}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-teal-500 focus:border-teal-500"
                    required
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-teal-800 text-white px-4 py-2 rounded-md hover:bg-teal-900"
                  >
                    إضافة
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const { req, res } = context;
  try {
    const isAuthenticated = req.cookies.authToken ? true : false;
    if (!isAuthenticated) {
      return {
        redirect: {
          destination: "/admin/login",
          permanent: false,
        },
      };
    }
    const user = jwt.verify(req.cookies.authToken, "rawaesecret");
    return {
      props: { user },
    };
  } catch (error) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }
}