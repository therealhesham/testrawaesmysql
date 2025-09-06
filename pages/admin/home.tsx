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
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";
import { ArrowLeftOutlined, FieldTimeOutlined } from "@ant-design/icons";
import { PlusIcon, ArrowLeftIcon } from "@heroicons/react/solid";
import Style from "/styles/Home.module.css";

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

// مكونات الطلبات
const NewOrdersTab = ({ orders, count }) => (
  <div className="info-card-body flex flex-col gap-4">
    {orders.slice(0, 3).map((order) => (
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
);

const CurrentOrdersTab = ({ orders, count }) => (
  <div className="info-card-body flex flex-col gap-4">
    {orders.slice(0, 3).map((order) => (
      <div key={order.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">طلب تحت الإجراء #{order.id}</p>
          <p className="item-subtitle text-xs text-gray-600">الحالة: {order.status ?? "غير محدد"}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ البدء: {order.startDate ?? order.createdAt} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

const EndedOrdersTab = ({ orders, count }) => (
  <div className="info-card-body flex flex-col gap-4">
    {orders.slice(0, 3).map((order) => (
      <div key={order.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">طلب مكتمل #{order.id}</p>
          <p className="item-subtitle text-xs text-gray-600">العميل: {order.ClientName}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ الانتهاء: {order.endDate ?? order.createdAt} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

const CancelledOrdersTab = ({ orders, count }) => (
  <div className="info-card-body flex flex-col gap-4">
    {orders.slice(0, 3).map((order) => (
      <div key={order.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">طلب ملغي #{order.id}</p>
          <p className="item-subtitle text-xs text-gray-600">سبب الإلغاء: {order.cancelReason ?? "غير محدد"}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ الإلغاء: {order.cancelDate ?? order.createdAt} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

  function getDate(date) {
    const currentDate = new Date(date); // Original date
    // currentDate.setDate(currentDate.getDate() + 90); // Add 90 days
    const form = currentDate.toISOString().split("T")[0];
    console.log(currentDate);
    return form;
  }

// مكونات الوصول والمغادرة
const InternalArrivalsTab = ({ arrivals, count }) => (
  <div className="info-card-body flex flex-col gap-4">
    {arrivals.slice(0, 3).map((arrival) => (
      <div key={arrival.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">الوصول رقم #{arrival.id}</p>
          <p className="item-subtitle text-xs text-gray-600">من: {arrival.ArrivalCity}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ الوصول: {getDate(arrival.createdAt)} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

const InternalDeparturesTab = ({ departures, count }) => (
  <div className="info-card-body flex flex-col gap-4">
    {departures.slice(0, 3).map((departure) => (
      <div key={departure.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">مغادرة داخلية #{departure.id}</p>
         
          <p className="item-subtitle text-xs text-gray-600">العاملة: {departure.Order.HomeMaid.Name ?? "غير محدد"}</p>
         
          <p className="item-subtitle text-xs text-gray-600">إلى: {departure.finaldestination ?? "غير محدد"}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ المغادرة: {departure.createdAt?getDate(departure.createdAt):null} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

const ExternalDeparturesTab = ({ departures, count }) => (
  <div className="info-card-body flex flex-col gap-4">
    {departures.slice(0, 3).map((departure) => (
      <div key={departure.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">مغادرة خارجية #{departure.id}</p>
          <p className="item-subtitle text-xs text-gray-600">إلى: {departure.ArrivalOutSaudiCity ?? "غير محدد"}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ المغادرة: {departure.DeparatureFromSaudiDate?getDate(departure.DeparatureFromSaudiDate):null} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

// مكونات شؤون الإقامة
const HousingTab = ({ housing, count }) => (
  <div className="info-card-body flex flex-col gap-4">
    {housing.slice(0, 3).map((item) => (
      <div key={item.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">تسكين #{item.id}</p>
          <p className="item-subtitle text-xs text-gray-600">العميل: {item.Order.Name}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ التسكين: {getDate(item.houseentrydate)} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

const CheckedTableTab = ({ housing, count }) => (
  <div className="info-card-body flex flex-col gap-4">
    {housing.slice(0, 3).map((item) => (
      <div key={item.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">إعاشة #{item.id}</p>
          <p className="item-subtitle text-xs text-gray-600">حالة الإعاشة: {item.status ?? "غير محدد"}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ: {item.createdAt} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

const SessionsTab = ({ sessions, count }) => (
  <div className="info-card-body flex flex-col gap-4">
    {sessions.slice(0, 3).map((session) => (
      <div key={session.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">جلسة #{session.id}</p>
          <p className="item-subtitle text-xs text-gray-600">النوع: {session.reason ?? "غير محدد"}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ الجلسة: {session.createdAt} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

// مكونات العاملات
const WorkersTab = ({ workers, count }) => (
  <div className="info-card-body flex flex-col gap-4">
    {workers.slice(0, 3).map((worker) => (
      <div key={worker.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">عاملة #{worker.id}</p>
          <p className="item-subtitle text-xs text-gray-600">الاسم: {worker.Name}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ التسجيل: {worker.createdAt?getDate(worker.createdAt):""} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

const BookedListTab = ({ booked, count }) => (
  <div className="info-card-body flex flex-col gap-4">
    {booked.slice(0, 3).map((worker) => (
      <div key={worker.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">عاملة محجوزة #{worker.id}</p>
          <p className="item-subtitle text-xs text-gray-600">العميل: {worker.ClientName ?? "غير محدد"}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ الحجز: {worker.bookedDate ?? worker.createdAt} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

const AvailableListTab = ({ available, count }) => (
  <div className="info-card-body flex flex-col gap-4">
    {available.slice(0, 3).map((worker) => (
      <div key={worker.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">عاملة متاحة #{worker.id}</p>
          <p className="item-subtitle text-xs text-gray-600">الاسم: {worker.Name}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ التسجيل: {worker.createdAt} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

// مكونات إدارة العلاقات
const RelationsTab = ({ relations, count }) => (
  <div className="info-card-body flex flex-col gap-4">
    {relations.slice(0, 3).map((relation) => (
      <div key={relation.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">عميل #{relation.id}</p>
          <p className="item-subtitle text-xs text-gray-600">الاسم: {relation.ClientName}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ التسجيل: {relation.createdAt} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

const SponsorshipTransfersTab = ({ transfers, count }) => (
  <div className="info-card-body flex flex-col gap-4">
    {transfers.slice(0, 3).map((transfer) => (
      <div key={transfer.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">نقل كفالة #{transfer.id}</p>
          <p className="item-subtitle text-xs text-gray-600">العامل: {transfer.WorkerName ?? "غير محدد"}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ الطلب: {transfer.createdAt} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

const ForeignOfficesTab = ({ offices, count }) => (
  <div className="info-card-body flex flex-col gap-4">
    {offices.slice(0, 3).map((office) => (
      <div key={office.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50">
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">مكتب خارجي #{office.id}</p>
          <p className="item-subtitle text-xs text-gray-600">الاسم: {office.OfficeName ?? "غير محدد"}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ التسجيل: {office.createdAt} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

export default function Home({ user }) {
  const router = useRouter();
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

  const [events, setEvents] = useState([]);
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
  const [sessionsLength, setSessionsLength] = useState(0);
  const [clientsCount, setClientsCount] = useState(0);
  const [officesCount, setOfficesCount] = useState(0);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/datalength`, {
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        method: "get",
      });
      const res = await response.json();
      if (response.status === 200) {
        setDeparaturesLength(res.deparatures);
        setArrivalsLength(res.arrivals);
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

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks/${user.id}`, {
        method: "GET",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (response.status === 200) {
        setTasks(data);
      } else {
        console.error("Error fetching tasks:", data.error);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (newTask.title && newTask.description && newTask.taskDeadline) {
      try {
        const response = await fetch(`/api/tasks/${user.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  const [newOrders, setNewOrders] = useState([]);
  const [currentOrders, setCurrentOrders] = useState([]);
  const [endedOrders, setEndedOrders] = useState([]);
  const [cancelledOrders, setCancelledOrders] = useState([]);
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
  const [relations, setRelations] = useState([]);
  const [transferSponsorships, setTransferSponsorships] = useState([]);
  const [foreignOffices, setForeignOffices] = useState([]);
  const [ordersSectionState, setOrdersSectionState] = useState("newOrders");
  const [arrivalsSectionState, setArrivalsSectionState] = useState("internalArrivals");
  const [housingSectionState, setHousingSectionState] = useState("housing");
  const [workersSectionState, setWorkersSectionState] = useState("workers");
  const [relationsSectionState, setRelationsSectionState] = useState("relations");

  const fetchNewOrdersData = async () => {
    try {
      const response = await fetch(`/api/neworderlistprisma/1`, { method: "get" });
      const res = await response.json();
      setNewOrders(res.data);
      setNewOrdersLength(res.data.length);
    } catch (error) {
      console.error("Error fetching new orders:", error);
    }
  };

  const fetchCurrentOrdersData = async () => {
    try {
      const response = await fetch(`/api/homeinitialdata/currentordersprisma`, { method: "get" });
      const res = await response.json();
      setCurrentOrders(res.data);
      setCurrentOrdersLength(res.totalCount);
    } catch (error) {
      console.error("Error fetching current orders:", error);
    }
  };

  const fetchEndedOrdersData = async () => {
    try {
      const response = await fetch(`/api/endedorders/`, { method: "get" });
      const res = await response.json();
      setEndedOrders(res.homemaids);
      setFinished(res.homemaids.length);
    } catch (error) {
      console.error("Error fetching ended orders:", error);
    }
  };

  const fetchCancelledOrdersData = async () => {
    try {
      const response = await fetch(`/api/homeinitialdata/cancelledorders`, { method: "get" });
      const res = await response.json();
      setCancelledOrders(res.data);
      setCancelledorders(res.data.length);
    } catch (error) {
      console.error("Error fetching cancelled orders:", error);
    }
  };

  const fetchArrivalsData = async () => {
    try {
      const response = await fetch(`/api/arrivals`, { method: "get" });
      const res = await response.json();
      setArrivals(res.data);
      setInternalArrivals(res.data);
      setArrivalsLength(res.data.length);
    } catch (error) {
      console.error("Error fetching arrivals:", error);
    }
  };

  function getDate(date) {
    const currentDate = new Date(date); // Original date
    // currentDate.setDate(currentDate.getDate() + 90); // Add 90 days
    const form = currentDate.toISOString().split("T")[0];
    console.log(currentDate);
    return form;
  }

  const fetchInternalDeparaturesData = async () => {
    try {
      const response = await fetch(`/api/deparatures`, { method: "get" });
      const res = await response.json();
      setInternalDeparatures(res.data);
      setDeparaturesLength(res.data.length);
    } catch (error) {
      console.error("Error fetching internal departures:", error);
    }
  };

  const fetchExternalDeparaturesData = async () => {
    try {
      const response = await fetch(`/api/homeinitialdata/deparaturefromsaudi`, { method: "get" });
      const res = await response.json();
      setExternalDeparatures(res.data);
      seteExternalDeparaturesLength(res.data.length);
    } catch (error) {
      console.error("Error fetching external departures:", error);
    }
  };

  const fetchHoused = async () => {
    try {
      const response = await fetch(`/api/confirmhousinginformation`, { method: "get" });
      const res = await response.json();
      setHousingSection(res.housing);
      setHoused(res.housing);
    } catch (error) {
      console.error("Error fetching housed data:", error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/sessions`, { method: "get" });
      const res = await response.json();
      setSessions(res.sessions);
      setSessionsLength(res.totalResults);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const fetchRelations = async () => {
    try {
      const response = await fetch(`/api/homeinitialdata/clients`, { method: "get" });
      const res = await response.json();
      setRelations(res.data);
      setClientsCount(res.dataCount);
    } catch (error) {
      console.error("Error fetching relations:", error);
    }
  };

  const fetchTransferSponsorships = async () => {
    try {
      const response = await fetch(`/api/transfersponsorships`, { method: "get" });
      const res = await response.json();
      setTransferSponsorships(res);
      setTransferSponsorshipsLength(res.length);
    } catch (error) {
      console.error("Error fetching transfer sponsorships:", error);
    }
  };

  const fetchFullList = async () => {
    try {
      const response = await fetch(`/api/homemaidprisma?page=1`, { method: "get" });
      const res = await response.json();
      setFullList(res.data);
      setHomeMaidsLength(res.totalRecords  );
    } catch (error) {
      console.error("Error fetching full list:", error);
    }
  };

  const fetchBookedList = async () => {
    try {
      const response = await fetch(`/api/bookedlist?page=1`, { method: "get" });
      const res = await response.json();
      setBookedList(res.data);
    } catch (error) {
      console.error("Error fetching booked list:", error);
    }
  };

  const fetchAvailableList = async () => {
    try {
      const response = await fetch(`/api/availablelist?page=1`, { method: "get" });
      const res = await response.json();
      setAvailableList(res.data);
    } catch (error) {
      console.error("Error fetching available list:", error);
    }
  };

  const fetchForeignOffices = async () => {
    try {
      const response = await fetch(`/api/homeinitialdata/externaloffices`, { method: "get" });
      const res = await response.json();
      setForeignOffices(res.data);
      setOfficesCount(res.dataCount);
    } catch (error) {
      console.error("Error fetching foreign offices:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTasks();
    fetchEvents();
    fetchNewOrdersData();
    fetchCurrentOrdersData();
    fetchEndedOrdersData();
    fetchCancelledOrdersData();
    fetchArrivalsData();
    fetchInternalDeparaturesData();
    fetchExternalDeparaturesData();
    fetchHoused();
    fetchSessions();
    fetchRelations();
    fetchTransferSponsorships();
    fetchFullList();
    fetchBookedList();
    fetchAvailableList();
    fetchForeignOffices();
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

        {/* Requests Section */}
        <section id="requests" className="info-card card bg-gradient-to-br mt-2 from-white to-gray-50 border border-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <header className="info-card-header flex justify-between items-center mb-6">
            <div className={`info-card-title-tabs flex flex-col gap-6 ${Style["tajawal-medium"]}`}>
              <h3 className="info-card-title text-2xl font-semibold text-gray-800 tracking-tight">الطلبات</h3>
              <nav className="info-card-tabs flex gap-6 border-b border-gray-100 pb-3">
                <a
                  onClick={() => setOrdersSectionState("newOrders")}
                  className={`tab-item text-sm cursor-pointer font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${ordersSectionState === "newOrders" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  الطلبات الجديدة <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{newOrdersLength}</span>
                </a>
                <a
                  onClick={() => setOrdersSectionState("currentOrders")}
                  className={`tab-item text-sm cursor-pointer font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${ordersSectionState === "currentOrders" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  طلبات تحت الإجراء <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{currentOrdersLength}</span>
                </a>
                <a
                  onClick={() => setOrdersSectionState("endedOrders")}
                  className={`tab-item text-sm cursor-pointer font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${ordersSectionState === "endedOrders" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  الطلبات المكتملة <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{finished}</span>
                </a>
                <a
                  onClick={() => setOrdersSectionState("cancelledOrders")}
                  className={`tab-item text-sm cursor-pointer font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${ordersSectionState === "cancelledOrders" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  الطلبات الملغية <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{cancelledorders}</span>
                </a>
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
          {ordersSectionState === "newOrders" && <NewOrdersTab orders={newOrders} count={newOrdersLength} />}
          {ordersSectionState === "currentOrders" && <CurrentOrdersTab orders={currentOrders} count={currentOrdersLength} />}
          {ordersSectionState === "endedOrders" && <EndedOrdersTab orders={endedOrders} count={finished} />}
          {ordersSectionState === "cancelledOrders" && <CancelledOrdersTab orders={cancelledOrders} count={cancelledorders} />}
        </section>

        {/* Arrivals and Departures Section */}
        <section id="arrivals" className="info-card card bg-gradient-to-br mt-2 from-white to-gray-50 border border-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <header className="info-card-header flex justify-between items-center mb-6">
            <div className={`${Style["tajawal-medium"]} info-card-title-tabs flex flex-col gap-6`}>
              <h3 className={`${Style["tajawal-medium"]} info-card-title text-2xl font-semibold text-gray-800 tracking-tight`}>الوصول و المغادرة</h3>
              <nav className="info-card-tabs flex gap-6 border-b border-gray-100 pb-3">
                <a
                  onClick={() => setArrivalsSectionState("internalArrivals")}
                  className={`tab-item cursor-pointer text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${arrivalsSectionState === "internalArrivals" ? "text-teal-700 bg-teal-50" : ""}`}
                >
                  الوصول <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{arrivalsLength}</span>
                </a>
                <a
                  onClick={() => setArrivalsSectionState("internalDeparatures")}
                  className={`tab-item cursor-pointer text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${arrivalsSectionState === "internalDeparatures" ? "text-teal-700 bg-teal-50" : ""}`}
                >
                  مغادرة داخلية <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{deparaturesLength}</span>
                </a>
                <a
                  onClick={() => setArrivalsSectionState("externalDeparatures")}
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
          {arrivalsSectionState === "internalArrivals" && <InternalArrivalsTab arrivals={internalArrivals} count={arrivalsLength} />}
          {arrivalsSectionState === "internalDeparatures" && <InternalDeparturesTab departures={internalDeparatures} count={deparaturesLength} />}
          {arrivalsSectionState === "externalDeparatures" && <ExternalDeparturesTab departures={externalDeparatures} count={externaldeparaturesLength} />}
        </section>

        {/* Housing Section */}
        <section id="housing" className={`${Style["tajawal-medium"]} info-card card bg-gradient-to-br mt-2 from-white to-gray-50 border border-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
          <header className="info-card-header flex justify-between items-center mb-6">
            <div className={`info-card-title-tabs flex flex-col gap-6 ${Style["tajawal-medium"]}`}>
              <h3 className="info-card-title text-2xl font-semibold text-gray-800 tracking-tight">شئون الاقامة</h3>
              <nav className="info-card-tabs flex gap-6 border-b border-gray-100 pb-3">
                <a
                  onClick={() => setHousingSectionState("housing")}
                  className={`tab-item cursor-pointer text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${housingSectionState === "housing" ? "text-teal-700 bg-teal-50" : ""}`}
                >
                  التسكين <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{housed.length}</span>
                </a>
                <a
                  onClick={() => setHousingSectionState("checkedTable")}
                  className={`tab-item cursor-pointer text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${housingSectionState === "checkedTable" ? "text-teal-700 bg-teal-50" : ""}`}
                >
                  الاعاشة <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{housed.length}</span>
                </a>
                <a
                  onClick={() => setHousingSectionState("sessions")}
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
          {housingSectionState === "housing" && <HousingTab housing={housed} count={housed.length} />}
          {housingSectionState === "checkedTable" && <CheckedTableTab housing={housed} count={housed.length} />}
          {housingSectionState === "sessions" && <SessionsTab sessions={sessions} count={sessionsLength} />}
        </section>

        {/* Workers Section */}
        <section id="homemaids" className={`${Style["tajawal-medium"]} info-card card bg-gradient-to-br mt-2 from-white to-gray-50 border border-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
          <header className="info-card-header flex justify-between items-center mb-6">
            <div className="info-card-title-tabs flex flex-col gap-6">
              <h3 className="info-card-title text-2xl font-semibold text-gray-800 tracking-tight">العاملات</h3>
              <nav className="info-card-tabs flex gap-6 border-b border-gray-100 pb-3">
                <a
                  onClick={() => setWorkersSectionState("workers")}
                  className={`tab-item text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${workersSectionState === "workers" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  العاملات <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{homeMaidsLength}</span>
                </a>
                <a
                  onClick={() => setWorkersSectionState("bookedlist")}
                  className={`tab-item text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${workersSectionState === "bookedlist" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  العاملات المحجوزة <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{bookedList.length}</span>
                </a>
                <a
                  onClick={() => setWorkersSectionState("availablelist")}
                  className={`tab-item text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${workersSectionState === "availablelist" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  العاملات المتاحة <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{availableList.length}</span>
                </a>
              </nav>
            </div>
            <a
              onClick={() => {
                workersSectionState === "workers"
                  ? router.push("/admin/fulllist")
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
          {workersSectionState === "workers" && <WorkersTab workers={fullList} count={homeMaidsLength} />}
          {workersSectionState === "bookedlist" && <BookedListTab booked={bookedList} count={bookedList.length} />}
          {workersSectionState === "availablelist" && <AvailableListTab available={availableList} count={availableList.length} />}
        </section>

        {/* Public Relations Section */}
        <section id="public-relations" className={`${Style["tajawal-medium"]} info-card card bg-gradient-to-br mt-2 from-white to-gray-50 border border-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
          <header className="info-card-header flex justify-between items-center mb-6">
            <div className="info-card-title-tabs flex flex-col gap-6">
              <h3 className="info-card-title text-2xl font-semibold text-gray-800 tracking-tight">إدارة العلاقات</h3>
              <nav className="info-card-tabs flex gap-6 border-b border-gray-100 pb-3">
                <a
                  onClick={() => setRelationsSectionState("relations")}
                  className={`tab-item text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${relationsSectionState === "relations" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  قائمة العملاء <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{clientsCount}</span>
                </a>
                <a
                  onClick={() => setRelationsSectionState("sponsorship-transfers")}
                  className={`tab-item text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${relationsSectionState === "sponsorship-transfers" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  معاملات نقل الكفالة <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{transferSponsorshipsLength}</span>
                </a>
                <a
                  onClick={() => setRelationsSectionState("foreign-offices")}
                  className={`tab-item text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${relationsSectionState === "foreign-offices" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  المكاتب الخارجية <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{officesCount}</span>
                </a>
              </nav>
            </div>
            <a
              onClick={() => {
                relationsSectionState === "relations"
                  ? router.push("/admin/clients")
                  : relationsSectionState === "sponsorship-transfers"
                  ? router.push("/admin/transfersponsorship")
                  : relationsSectionState === "foreign-offices"
                  ? router.push("/admin/offices")
                  : null;
              }}
              className="view-all-btn cursor-pointer bg-teal-800 text-white text-sm font-medium px-5 py-2 rounded-lg shadow-sm hover:shadow-md hover:from-teal-700 hover:to-teal-900 transition-all duration-300"
            >
              عرض الكل
            </a>
          </header>
          {relationsSectionState === "relations" && <RelationsTab relations={relations} count={clientsCount} />}
          {relationsSectionState === "sponsorship-transfers" && <SponsorshipTransfersTab transfers={transferSponsorships} count={transferSponsorshipsLength} />}
          {relationsSectionState === "foreign-offices" && <ForeignOfficesTab offices={foreignOffices} count={officesCount} />}
        </section>

        {/* Task Modal */}
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
  const { req } = context;
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
    console.log("Error verifying token:", error);
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }
}