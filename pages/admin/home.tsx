//@ts-ignore
//@ts-nocheck
import React from "react";
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
import { useState, useRef } from "react";
import { useRouter } from "next/router";
import { ArrowLeftOutlined, FieldTimeOutlined } from "@ant-design/icons";
import { PlusIcon, ArrowLeftIcon } from "@heroicons/react/solid";
import Style from "/styles/Home.module.css";
import AlertModal from "../../components/AlertModal";
// prisma
import AddTaskModal from "../../components/AddTaskModal";
import TaskCompletionModal from "../../components/TaskCompletionModal";
import prisma from "lib/prisma";

// --- Helper Functions (Moved outside component for reusability on server) ---
const calculateRemainingDays = (eventDate) => {
  const today = new Date();
  const event = new Date(eventDate);
  const timeDifference = event - today;
  const remainingDays = Math.ceil(timeDifference / (1000 * 3600 * 24));
  return remainingDays > 0 ? remainingDays : "Expired";
};

const getCurrentMonthYear = () => {
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const today = new Date();
  const month = months[today.getMonth()];
  const year = today.getFullYear();
  return `${month} ${year}`;
};

function getDate(date) {
  if (!date) return null;
  const currentDate = new Date(date);
  const formatted = currentDate.getDate() + '/' + (currentDate.getMonth() + 1) + '/' + currentDate.getFullYear();
  return formatted;
}

// --- Tab Components (Remain unchanged) ---
const NewOrdersTab = ({ orders, count, onItemClick }) => (
  <div className="info-card-body flex flex-col gap-4">
    {orders.slice(0, 3).map((order) => (
      <div key={order.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 cursor-pointer" onClick={() => onItemClick(order.id)}>
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">الطلب رقم #{order.id}</p>
          <p className="item-subtitle text-xs text-gray-600">العميل: {order.client.fullname}</p>
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

const CurrentOrdersTab = ({ orders, count, onItemClick }) => (
  <div className="info-card-body flex flex-col gap-4">
    {orders.slice(0, 3).map((order) => (
      <div key={order.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 cursor-pointer" onClick={() => onItemClick(`/admin/track_order/${order.id}`)}>
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

const EndedOrdersTab = ({ orders, count, onItemClick }) => (
  <div className="info-card-body flex flex-col gap-4">
    {orders.slice(0, 3).map((order) => (
      <div key={order.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 cursor-pointer" onClick={() => onItemClick(`/admin/track_order/${order.id}`)}>
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

const CancelledOrdersTab = ({ rejectedOrders, count, onItemClick }) => (
  <div className="info-card-body flex flex-col gap-4">
    {rejectedOrders?.slice(0, 3).map((order) => (
      <div key={order.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 cursor-pointer" onClick={() => onItemClick(`/admin/track_order/${order.id}`)}>
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">طلب ملغي #{order.id}</p>
          <p className="item-subtitle text-xs text-gray-600">سبب الإلغاء: {order?.ReasonOfRejection ?? "غير محدد"}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ الإلغاء: {order?.updatedAt} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

const InternalArrivalsTab = ({ arrivals, count, onItemClick }) => (
  <div className="info-card-body flex flex-col gap-4">
    {arrivals.slice(0, 3).map((arrival) => (
      <div key={arrival.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 cursor-pointer" onClick={() => onItemClick('/admin/arrival-list')}>
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">الوصول رقم #{arrival.id}</p>
          <p className="item-subtitle text-xs text-gray-600">من: {arrival.deparatureCityCountry}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ الوصول: {getDate(arrival.KingdomentryDate)} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

const InternalDeparturesTab = ({ departures, count, onItemClick }) => (
  <div className="info-card-body flex flex-col gap-4">
    {departures.slice(0, 3).map((departure) => (
      <div key={departure.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 cursor-pointer" onClick={() => onItemClick('/admin/deparatures')}>
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">مغادرة داخلية #{departure.id}</p>
          <p className="item-subtitle text-xs text-gray-600">العاملة: {departure.Order.HomeMaid.Name ?? "غير محدد"}</p>
          <p className="item-subtitle text-xs text-gray-600">إلى: {departure.finaldestination ?? "غير محدد"}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ المغادرة: {departure.createdAt ? getDate(departure.createdAt) : null} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

const ExternalDeparturesTab = ({ departures, count, onItemClick }) => (
  <div className="info-card-body flex flex-col gap-4">
    {departures.slice(0, 3).map((departure) => (
      <div key={departure.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 cursor-pointer" onClick={() => onItemClick('/admin/deparaturesfromsaudi')}>
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">مغادرة خارجية #{departure.id}</p>
          <p className="item-subtitle text-xs text-gray-600">إلى: {departure.externalArrivalCity ?? "غير محدد"}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ المغادرة: {departure.externalArrivalCityDate ? getDate(departure.externalArrivalCityDate) : null} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

const HousingTab = ({ housing, count, onItemClick }) => (
  <div className="info-card-body flex flex-col gap-4">
    {housing.slice(0, 3).map((item) => (
      <div key={item.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 cursor-pointer" onClick={() => onItemClick('/admin/housedarrivals')}>
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">تسكين #{item.id}</p>
          <p className="item-subtitle text-xs text-gray-600">العاملة: {item.Order.Name}</p>
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

const CheckedTableTab = ({ housing, count, onItemClick }) => (
  <div className="info-card-body flex flex-col gap-4">
    {housing.slice(0, 3).map((item) => (
      <div key={item.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 cursor-pointer" onClick={() => onItemClick('/admin/checkedtable')}>
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

const SessionsTab = ({ sessions, count, onItemClick }) => (
  <div className="info-card-body flex flex-col gap-4">
    {sessions.slice(0, 3).map((session) => (
      <div key={session.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 cursor-pointer" onClick={() => onItemClick('/admin/sessions')}>
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

const WorkersTab = ({ workers, count, onItemClick }) => (
  <div className="info-card-body flex flex-col gap-4">
    {workers.slice(0, 3).map((worker) => (
      <div  key={worker.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 cursor-pointer" onClick={() => onItemClick('/admin/homemaidinfo?id=' + worker.id)}>
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">عاملة #{worker.id}</p>
          <p className="item-subtitle text-xs text-gray-600">الاسم: {worker.Name}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            تاريخ التسجيل: {worker.createdAt ? getDate(worker.createdAt) : ""} <FieldTimeOutlined />
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

const BookedListTab = ({ booked, count, onItemClick }) => (
  <div className="info-card-body flex flex-col gap-4">
    {booked.slice(0, 3).map((worker) => (
      <div key={worker.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 cursor-pointer" onClick={() => onItemClick('/admin/homemaidinfo?id=' + worker.id)}>
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

const AvailableListTab = ({ available, count, onItemClick }) => (
  <div className="info-card-body flex flex-col gap-4">
    {available.slice(0, 3).map((worker) => (
      <div key={worker.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 cursor-pointer" onClick={() => onItemClick('/admin/homemaidinfo?id=' + worker.id)}>
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

const RelationsTab = ({ relations, count, onItemClick }) => (
  <div className="info-card-body flex flex-col gap-4">
    {relations.slice(0, 3).map((relation) => (
      <div key={relation.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 cursor-pointer" onClick={() => onItemClick('/admin/clientdetails?id=' + relation.id)}>
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">عميل #{relation.id}</p>
          <p className="item-subtitle text-xs text-gray-600">الاسم: {relation.fullname}</p>
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

const SponsorshipTransfersTab = ({ transfers, count, onItemClick }) => (
  <div className="info-card-body flex flex-col gap-4">
    {transfers.slice(0, 3).map((transfer) => (
      <div key={transfer.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 cursor-pointer" onClick={() => onItemClick('/admin/transfersponsorship')}>
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

const ForeignOfficesTab = ({ offices, count, onItemClick }) => (
  <div className="info-card-body flex flex-col gap-4">
    {offices.slice(0, 3).map((office) => (
      <div key={office.id} className="info-list-item flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 cursor-pointer" onClick={() => onItemClick('/admin/homemaidoffices?office=' + office.office)}>
        <div className="item-details flex flex-col gap-2">
          <p className="item-title text-sm font-semibold text-gray-900">مكتب خارجي #{office.id}</p>
          <p className="item-subtitle text-xs text-gray-600">الاسم: {office.office ?? "غير محدد"}</p>
          <p className="item-meta text-xs text-gray-500 flex items-center gap-2">
            {/* تاريخ التسجيل: {office.createdAt} <FieldTimeOutlined /> */}
          </p>
        </div>
        <button className="item-arrow-btn bg-teal-50 text-teal-600 rounded-full p-2 hover:bg-teal-100 transition-colors duration-200">
          <ArrowLeftOutlined className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

// --- Main Home Component ---
export default function Home({
  // Data fetched on server
  rejectedOrdersCount,
  newOrders,
  rejectedOrders,
  currentOrders,
  endedOrders,
  cancelledOrders,
  internalArrivals,
  internalDeparatures,
  externalDeparatures,
  fullList,
  bookedList,
  availableList,
  housed,
  sessions,
  relations,
  transferSponsorships,
  foreignOffices,
  events,
  transferSponsorshipsLength,
  // Counts fetched on server
  newOrdersLength,
  housedCount,
  currentOrdersLength,
  finished,
  cancelledorders,
  arrivalsLength,
  deparaturesLength,
  externaldeparaturesLength,
  homeMaidsLength,
  officesCount,
  sessionsLength,
  clientsCount,
}) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthYear());
  const [currentWeek, setCurrentWeek] = useState(0); // Week offset from start of month
  
  // Client-side state for user and authentication
  const [user, setUser] = useState(null);
  const [userforbutton, setUserforbutton] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Navigation handler for item clicks
  const handleItemClick = (path) => {
    router.push(path);
  };
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
  
  // Calculate current week dates
  const getCurrentWeekDates = () => {
    const startDate = currentWeek * 7 - firstDayOffset + 1;
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = startDate + i;
      if (date >= 1 && date <= daysInMonth) {
        weekDates.push(date);
      } else {
        weekDates.push(null);
      }
    }
    return weekDates;
  };
  
  const currentWeekDates = getCurrentWeekDates();
  const totalWeeks = Math.ceil((daysInMonth + firstDayOffset) / 7);
  
  // Auto-scroll to current week on component mount
  React.useEffect(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonthIndex = today.getMonth();
    const currentYear = today.getFullYear();
    
    if (currentMonthIndex === monthIndex && currentYear === year) {
      const weekOfCurrentDay = Math.floor((currentDay + firstDayOffset - 1) / 7);
      setCurrentWeek(weekOfCurrentDay);
    }
  }, [monthIndex, year, firstDayOffset]);

  // State for tasks modal (client-side only)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', taskDeadline: '' });
  const [clientTasks, setClientTasks] = useState([]);
  const [randomNamesFound, setRandomNamesFound] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  
  // Client-side authentication and user fetching
  React.useEffect(() => {
    const authenticateAndFetchUser = async () => {
      try {
        // Fetch user info from API (which reads HttpOnly cookie server-side)
        const response = await fetch('/api/auth/me');
        
        if (!response.ok) {
          // If unauthorized, redirect to login
          if (response.status === 401) {
            router.push('/admin/login');
            return;
          }
          throw new Error('Failed to fetch user');
        }
        
        const data = await response.json();
        
        if (data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
          
          // Set userforbutton based on role from token
          setUserforbutton(data.user.role === 1);
        } else {
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/admin/login');
      }
    };
    
    authenticateAndFetchUser();
  }, [router]);
  
  // State for task details modal
  const [taskDetailsModal, setTaskDetailsModal] = useState({
    isOpen: false,
    task: null
  });
  
  // State for more tasks modal
  const [moreTasksModal, setMoreTasksModal] = useState({
    isOpen: false,
    tasks: [],
    title: ''
  });

  // State for task completion modal
  const [taskCompletionModal, setTaskCompletionModal] = useState({
    isOpen: false,
    task: null
  });
  
  // State for alert modal
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: ''
  });

  // State for order action modal (accept/reject)
  const [orderActionModal, setOrderActionModal] = useState({
    isOpen: false,
    orderId: null as number | null,
    action: null as 'accept' | 'reject' | null,
  });

  // State for rejection reason
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch tasks client-side when user is authenticated
  React.useEffect(() => {
    const fetchTasks = async () => {
      if (!user || !user.id) {
        setIsLoadingTasks(false);
        return;
      }
      
      try {
        setIsLoadingTasks(true);
        console.log('Fetching tasks for user:', user.id);
        const response = await fetch(`/api/tasks/${user.id}`);
        
        if (response.ok) {
          const tasksData = await response.json();
          console.log('Tasks fetched:', tasksData);
          console.log('Tasks type:', typeof tasksData, 'Is array:', Array.isArray(tasksData));
          
          if (tasksData && Array.isArray(tasksData)) {
            console.log('Setting clientTasks with', tasksData.length, 'tasks');
            setClientTasks(tasksData);
            
            // Debug: Log first few tasks to see their structure
            if (tasksData.length > 0) {
              console.log('Sample task structure:', tasksData[0]);
              console.log('Task deadline type:', typeof tasksData[0]?.taskDeadline);
              console.log('Task deadline value:', tasksData[0]?.taskDeadline);
              
              // Check if taskDeadline is a valid date
              const sampleTask = tasksData[0];
              if (sampleTask.taskDeadline) {
                const deadlineDate = new Date(sampleTask.taskDeadline);
                console.log('Parsed deadline date:', deadlineDate);
                console.log('Is valid date:', !isNaN(deadlineDate.getTime()));
                console.log('Date month:', deadlineDate.getMonth());
                console.log('Date day:', deadlineDate.getDate());
                console.log('Date year:', deadlineDate.getFullYear());
              }
            }
          } else {
            console.log('No tasks found or tasks is not an array');
            setClientTasks([]);
          }
        } else {
          console.error('Failed to fetch tasks:', response.status, response.statusText);
          setClientTasks([]);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setClientTasks([]);
      } finally {
        setIsLoadingTasks(false);
      }
    };
    
    fetchTasks();
  }, [user]);

  // Function to remove HTML tags from text
  const stripHtmlTags = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

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
    setCurrentWeek(0); // Reset to first week when changing month
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
    setCurrentWeek(0); // Reset to first week when changing month
  };

  const getNextWeek = () => {
    if (currentWeek < totalWeeks - 1) {
      setCurrentWeek(currentWeek + 1);
    }
  };

  const getPrevWeek = () => {
    if (currentWeek > 0) {
      setCurrentWeek(currentWeek - 1);
    }
  };

  // Client-side state for tab navigation
  const [ordersSectionState, setOrdersSectionState] = useState("newOrders");
  const [arrivalsSectionState, setArrivalsSectionState] = useState("internalArrivals");
  const [housingSectionState, setHousingSectionState] = useState("housing");
  const [workersSectionState, setWorkersSectionState] = useState("workers");
  const [relationsSectionState, setRelationsSectionState] = useState("relations");
  const [tasksSectionState, setTasksSectionState] = useState("myTasks");

  const sectionRef = useRef(null);
  const scrollToSection = () => {
    sectionRef.current.scrollIntoView({ behavior: "smooth" });
  };

  // Calendar and Task functions (client-side interactions)
  const getEventsForDay = (day) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      const eventMonth = eventDate.getMonth();
      const eventDay = eventDate.getDate();
      return eventMonth === monthIndex && eventDay === day;
    });
  };

  const getTasksForDay = (day) => {
    if (!clientTasks || clientTasks.length === 0) {
      return [];
    }
    
    const filteredTasks = clientTasks.filter((task) => {
      // Check if task has a valid deadline
      if (!task.taskDeadline) {
        return false;
      }
      
      try {
        const taskDate = new Date(task.taskDeadline);
        
        // Check if date is valid
        if (isNaN(taskDate.getTime())) {
          return false;
        }
        
        const taskMonth = taskDate.getMonth();
        const taskDay = taskDate.getDate();
        const taskYear = taskDate.getFullYear();
        
        // Match: same month, day, and year, and task is not completed
        return taskMonth === monthIndex && taskDay === day && taskYear === year && !task.isCompleted;
      } catch (error) {
        console.error('Error parsing task deadline:', task.taskDeadline, error);
        return false;
      }
    });
    
    return filteredTasks;
  };

  // Get arrivals for a specific day
  const getArrivalsForDay = (day) => {
    return internalArrivals.filter((arrival) => {
      if (!arrival.createdAt) return false;
      const arrivalDate = new Date(arrival.createdAt);
      const arrivalMonth = arrivalDate.getMonth();
      const arrivalDay = arrivalDate.getDate();
      return arrivalMonth === monthIndex && arrivalDay === day;
    });
  };

  // Get departures for a specific day
  const getDeparturesForDay = (day) => {
    return internalDeparatures.filter((departure) => {
      if (!departure.createdAt) return false;
      const departureDate = new Date(departure.createdAt);
      const departureMonth = departureDate.getMonth();
      const departureDay = departureDate.getDate();
      return departureMonth === monthIndex && departureDay === day;
    });
  };

  // Get housing events for a specific day
  const getHousingForDay = (day) => {
    return housed.filter((housing) => {
      if (!housing.houseentrydate) return false;
      const housingDate = new Date(housing.houseentrydate);
      const housingMonth = housingDate.getMonth();
      const housingDay = housingDate.getDate();
      return housingMonth === monthIndex && housingDay === day;
    });
  };

  // Get sessions for a specific day
  const getSessionsForDay = (day) => {
    return sessions.filter((session) => {
      if (!session.createdAt) return false;
      const sessionDate = new Date(session.createdAt);
      const sessionMonth = sessionDate.getMonth();
      const sessionDay = sessionDate.getDate();
      return sessionMonth === monthIndex && sessionDay === day;
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
      const arrivalsForDay = getArrivalsForDay(day);
      const departuresForDay = getDeparturesForDay(day);
      const housingForDay = getHousingForDay(day);
      const sessionsForDay = getSessionsForDay(day);
      const eventsForDay = getEventsForDay(day);
      
      let message = `أحداث ${day}/${monthIndex + 1}/${year}:\n\n`;
      
      if (tasksForDay.length > 0) {
        message += `المهام (${tasksForDay.length}):\n`;
        tasksForDay.forEach(task => {
          message += `• ${stripHtmlTags(task.Title)} - ${stripHtmlTags(task.description)}\n`;
        });
        message += '\n';
      }
      
      if (arrivalsForDay.length > 0) {
        message += `الوصول (${arrivalsForDay.length}):\n`;
        arrivalsForDay.forEach(arrival => {
          message += `• وصول #${arrival.id} من ${arrival.ArrivalCity || 'غير محدد'}\n`;
        });
        message += '\n';
      }
      
      if (departuresForDay.length > 0) {
        message += `المغادرة (${departuresForDay.length}):\n`;
        departuresForDay.forEach(departure => {
          message += `• مغادرة #${departure.id} إلى ${departure.finaldestination || 'غير محدد'}\n`;
        });
        message += '\n';
      }
      
      if (housingForDay.length > 0) {
        message += `التسكين (${housingForDay.length}):\n`;
        housingForDay.forEach(housing => {
          message += `• تسكين #${housing.id} للعميل ${housing.Order?.Name || 'غير محدد'}\n`;
        });
        message += '\n';
      }
      
      if (sessionsForDay.length > 0) {
        message += `الجلسات (${sessionsForDay.length}):\n`;
        sessionsForDay.forEach(session => {
          message += `• جلسة #${session.id} - ${session.reason || 'غير محدد'}\n`;
        });
        message += '\n';
      }
      
      if (eventsForDay.length > 0) {
        message += `الأحداث (${eventsForDay.length}):\n`;
        eventsForDay.forEach(event => {
          message += `• ${event.title}\n`;
        });
        message += '\n';
      }
      
      if (tasksForDay.length === 0 && arrivalsForDay.length === 0 && 
          departuresForDay.length === 0 && housingForDay.length === 0 && 
          sessionsForDay.length === 0 && eventsForDay.length === 0) {
        message = `لا توجد أحداث في ${day}/${monthIndex + 1}/${year}`;
      }
      
      setAlertModal({
        isOpen: true,
        type: 'info',
        title: 'أحداث اليوم',
        message: message
      });
    }
  };

  // Function to handle adding a new task (client-side API call)
  const handleAddTask = async (taskData) => {
    if (taskData.title && taskData.description && taskData.deadline) {
      if (!user?.id) {
        setAlertModal({
          isOpen: true,
          type: 'error',
          title: 'خطأ',
          message: 'يجب تسجيل الدخول أولاً'
        });
        return;
      }
      try {
        console.log('Creating task for user:', user.id);
        const response = await fetch(`/api/tasks/add-with-random-search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            description: taskData.description,
            title: taskData.title,
            taskDeadline: taskData.deadline,
            assignee: taskData.assignee,
            priority: taskData.priority,
            isActive: taskData.isActive,
            isRepeating: taskData.isRepeating,
            repeatType: taskData.repeatType,
            repeatInterval: taskData.repeatInterval,
            repeatStartDate: taskData.repeatStartDate,
            repeatEndDate: taskData.repeatEndDate,
            repeatEndType: taskData.repeatEndType,
            repeatCount: taskData.repeatCount,
            repeatDays: taskData.repeatDays,
            repeatTime: taskData.repeatTime,
          }),
        });
        const data = await response.json();
        if (response.status === 201) {
          // Only add to client tasks if the task was assigned to current user
          if (data.task.userId === user.id) {
            setClientTasks(prevTasks => [...prevTasks, data.task]);
          }
          setAlertModal({
            isOpen: true,
            type: 'success',
            title: 'تم إضافة المهمة بنجاح',
            message: data.message || 'تم إضافة المهمة الجديدة بنجاح'
          });
        } else {
          setAlertModal({
            isOpen: true,
            type: 'error',
            title: 'خطأ في إضافة المهمة',
            message: data.error
          });
          console.error("Error creating task:", data.error);
        }
      } catch (error) {
        setAlertModal({
          isOpen: true,
          type: 'error',
          title: 'خطأ في إضافة المهمة',
          message: error.toString()
        });
        console.error("Error creating task:", error);
      }
    }
  };

  // Function to handle task completion update
  const handleTaskUpdate = async (taskId: number, isCompleted: boolean, completionDate?: string, completionNotes?: string) => {
    try {
      const response = await fetch('/api/tasks/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          isCompleted,
          completionDate,
          completionNotes
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the task in clientTasks state
        setClientTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId 
              ? { ...task, isCompleted, completionDate, completionNotes }
              : task
          )
        );

        setAlertModal({
          isOpen: true,
          type: 'success',
          title: 'تم تحديث المهمة بنجاح',
          message: isCompleted 
            ? 'تم اعتماد المهمة كمكتملة نهائياً' 
            : completionDate 
              ? 'تم تحديث تاريخ الانتهاء' 
              : 'تم تحديث حالة المهمة'
        });
      } else {
        setAlertModal({
          isOpen: true,
          type: 'error',
          title: 'خطأ في تحديث المهمة',
          message: data.error || 'حدث خطأ أثناء تحديث المهمة'
        });
      }
    } catch (error) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'خطأ في تحديث المهمة',
        message: error.toString()
      });
      console.error('Error updating task:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  // Function to open task details modal
  const handleTaskClick = (task) => {
    setTaskDetailsModal({
      isOpen: true,
      task: task
    });
  };

  // Function to open more tasks modal
  const handleMoreTasksClick = (tasks, title) => {
    setMoreTasksModal({
      isOpen: true,
      tasks: tasks,
      title: title
    });
  };

  // Function to open task completion modal
  const handleTaskCompletionClick = (task) => {
    setTaskCompletionModal({
      isOpen: true,
      task: task
    });
  };

  // Function to handle order click (open accept/reject modal)
  const handleOrderItemClick = (orderId: number) => {
    setOrderActionModal({
      isOpen: true,
      orderId: orderId,
      action: null,
    });
  };

  // Function to confirm accept order
  const confirmAcceptOrder = async () => {
    if (!orderActionModal.orderId) return;

    try {
      const response = await fetch('/api/confirmrequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(orderActionModal.orderId) }),
      });

      if (response.ok) {
        setAlertModal({
          isOpen: true,
          type: 'success',
          title: 'تم القبول بنجاح',
          message: 'تم قبول الطلب بنجاح'
        });
        setOrderActionModal({ isOpen: false, orderId: null, action: null });
        
        // Refresh page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error('Failed to accept order');
      }
    } catch (error) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'خطأ',
        message: 'حدث خطأ أثناء قبول الطلب'
      });
      console.error('Error accepting order:', error);
    }
  };

  // Function to confirm reject order
  const confirmRejectOrder = async () => {
    if (!orderActionModal.orderId) return;

    if (!rejectionReason.trim()) {
      setAlertModal({
        isOpen: true,
        type: 'warning',
        title: 'تنبيه',
        message: 'يرجى كتابة سبب الرفض'
      });
      return;
    }

    try {
      const response = await fetch('/api/rejectbookingprisma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: orderActionModal.orderId.toString(),
          ReasonOfRejection: rejectionReason 
        }),
      });

      if (response.ok) {
        setAlertModal({
          isOpen: true,
          type: 'success',
          title: 'تم الرفض بنجاح',
          message: 'تم رفض الطلب بنجاح'
        });
        setOrderActionModal({ isOpen: false, orderId: null, action: null });
        setRejectionReason('');
        
        // Refresh page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error('Failed to reject order');
      }
    } catch (error) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        title: 'خطأ',
        message: 'حدث خطأ أثناء رفض الطلب'
      });
      console.error('Error rejecting order:', error);
    }
  };

  // Show loading state while authenticating or fetching user
  if (!isAuthenticated || !user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50" ref={sectionRef}>
        <Head>
          <title>الصفحة الرئيسية</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4 mx-auto">
          {/* New Calendar Card */}
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
            
            {/* Week Navigation */}
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={getPrevWeek} 
                disabled={currentWeek === 0}
                className={`text-teal-600 hover:text-teal-800 ${currentWeek === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <span className="text-sm text-gray-600">
                الأسبوع {currentWeek + 1} من {totalWeeks}
                {(() => {
                  const today = new Date();
                  const currentDay = today.getDate();
                  const currentMonthIndex = today.getMonth();
                  const currentYear = today.getFullYear();
                  
                  if (currentMonthIndex === monthIndex && currentYear === year) {
                    const weekOfCurrentDay = Math.floor((currentDay + firstDayOffset - 1) / 7);
                    if (weekOfCurrentDay === currentWeek) {
                      return <span className="text-teal-600 font-semibold"> (الأسبوع الحالي)</span>;
                    }
                  }
                  return null;
                })()}
              </span>
              <button 
                onClick={getNextWeek} 
                disabled={currentWeek === totalWeeks - 1}
                className={`text-teal-600 hover:text-teal-800 ${currentWeek === totalWeeks - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            
            {/* Weekly Calendar Layout - Compact */}
            <div className="space-y-1">
              {currentWeekDates.map((date, index) => {
                if (date === null) {
                  return (
                    <div key={`empty-${index}`} className="flex items-center p-1.5 border-b border-gray-100 gap-2 opacity-50">
                      <div className="flex flex-col items-center text-xs text-center w-12">
                        <span className="font-normal text-xs">-</span>
                        <span className="font-light text-xs">-</span>
                      </div>
                      <div className="flex gap-1 flex-wrap pr-2 border-r border-gray-100 min-h-5 flex-1">
                        <span className="text-xs text-gray-400">-</span>
                      </div>
                    </div>
                  );
                }

                const hasTasks = getTasksForDay(date).length > 0;
                const hasEvents = getEventsForDay(date).length > 0;
                const hasArrivals = getArrivalsForDay(date).length > 0;
                const hasDepartures = getDeparturesForDay(date).length > 0;
                const hasHousing = getHousingForDay(date).length > 0;
                const hasSessions = getSessionsForDay(date).length > 0;
                
                const tasksForDay = getTasksForDay(date);
                
                // Debug logging for calendar rendering
                if (date === 1) { // Log only for first day of month to avoid spam
                  console.log('Calendar debug - Date:', date, 'Month:', monthIndex, 'Year:', year);
                  console.log('ClientTasks length:', clientTasks.length);
                  console.log('HasTasks for day', date, ':', hasTasks);
                  console.log('TasksForDay length:', tasksForDay.length);
                }
                const eventsForDay = getEventsForDay(date);
                const arrivalsForDay = getArrivalsForDay(date);
                const departuresForDay = getDeparturesForDay(date);
                const housingForDay = getHousingForDay(date);
                const sessionsForDay = getSessionsForDay(date);
                
                const today = new Date();
                const isToday =
                  date === today.getDate() &&
                  monthIndex === today.getMonth() &&
                  year === today.getFullYear();
                
                // Get day name
                const dayDate = new Date(year, monthIndex, date);
                const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                const dayName = dayNames[dayDate.getDay()];
                
                return (
                  <div 
                    key={date} 
                    className={`flex items-center p-1.5  border-b border-gray-100 gap-2 ${
                      isToday ? 'bg-teal-50' : ''
                    }`}
                    onClick={() => handleDayClick(date)}
                  >
                    <div className="flex flex-col items-center text-xs  text-center w-12">
                      <span className="font-normal text-xs">{dayName}</span>
                      <span className={`font-light text-xs ${isToday ? 'text-teal-800 font-semibold' : ''}`}>
                        {date}
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap pr-2 border-r border-gray-100 min-h-[50px] flex-1">
                      {/* Tasks */}
                      {hasTasks && tasksForDay.map((task, taskIndex) => (
                        <div 
                          key={`task-${taskIndex}`}
                          className="text-md font-light px-1 py-0.5 rounded bg-red-100 text-red-600 cursor-pointer hover:bg-red-200"
                          title={`مهمة: ${stripHtmlTags(task.Title)} - ${stripHtmlTags(task.description)}${task.assignedBy && task.assignedBy !== user?.id ? ` (أسندها: ${task.assignedByUser?.username || `المستخدم #${task.assignedBy}`})` : ''}`}
                        >
                          {stripHtmlTags(task.Title).length > 8 ? stripHtmlTags(task.Title).substring(0, 8) + '...' : stripHtmlTags(task.Title)}
                        </div>
                      ))}
                      
                      {/* Arrivals */}
                      {hasArrivals && arrivalsForDay.map((arrival, arrivalIndex) => (
                        <div 
                          key={`arrival-${arrivalIndex}`}
                          className="text-xs font-light px-1 py-0.5 rounded bg-blue-100 text-blue-600 cursor-pointer hover:bg-blue-200"
                          title={`وصول: من ${arrival.ArrivalCity || 'غير محدد'}`}
                        >
                          وصول #{arrival.id}
                        </div>
                      ))}
                      
                      {/* Departures */}
                      {hasDepartures && departuresForDay.map((departure, departureIndex) => (
                        <div 
                          key={`departure-${departureIndex}`}
                          className="text-xs font-light px-1 py-0.5 rounded bg-orange-100 text-orange-600 cursor-pointer hover:bg-orange-200"
                          title={`مغادرة: إلى ${departure.finaldestination || 'غير محدد'}`}
                        >
                          مغادرة #{departure.id}
                        </div>
                      ))}
                      
                      {/* Housing */}
                      {hasHousing && housingForDay.map((housing, housingIndex) => (
                        <div 
                          key={`housing-${housingIndex}`}
                          className="text-xs font-light px-1 py-0.5 rounded bg-green-100 text-green-600 cursor-pointer hover:bg-green-200"
                          title={`تسكين: ${housing.Order?.Name || 'غير محدد'}`}
                        >
                          تسكين #{housing.id}
                        </div>
                      ))}
                      
                      {/* Sessions */}
                      {hasSessions && sessionsForDay.map((session, sessionIndex) => (
                        <div 
                          key={`session-${sessionIndex}`}
                          className="text-xs font-light px-1 py-0.5 rounded bg-purple-100 text-purple-600 cursor-pointer hover:bg-purple-200"
                          title={`جلسة: ${session.reason || 'غير محدد'}`}
                        >
                          جلسة #{session.id}
                        </div>
                      ))}
                      
                      {/* Events */}
                      {hasEvents && eventsForDay.map((event, eventIndex) => (
                        <div 
                          key={`event-${eventIndex}`}
                          className="text-xs font-light px-1 py-0.5 rounded bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-200"
                          title={event.title}
                        >
                          {event.title.length > 8 ? event.title.substring(0, 8) + '...' : event.title}
                        </div>
                      ))}
                      
                      {/* Show message if no events */}
                      {!hasTasks && !hasEvents && !hasArrivals && !hasDepartures && !hasHousing && !hasSessions && (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* <div className="mt-2 pt-2 border-t border-gray-100">
              <h4 className="text-xs font-medium text-gray-700 mb-1">مفتاح الألوان:</h4>
              <div className="grid grid-cols-3 gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>مهام</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>وصول</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>مغادرة</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>تسكين</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>جلسات</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span>أحداث</span>
                </div>
              </div>
            </div> */}
          </div>
          {/* Tasks Widget */}
          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition duration-300 md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className={`${Style["tajawal-medium"]} text-2xl font-semibold text-gray-800`}>المهام اليومية</h2>
              {userforbutton && ( 
              <button
                onClick={() => setIsModalOpen(true)}
                className={`bg-teal-800 text-white flex flex-row items-center px-4 py-2 rounded-lg ${Style["tajawal-medium"]}`}
              >
                <span className="flex flex-row items-center gap-2">
                  <PlusIcon height={16} width={16} />
                  إضافة مهمة
                </span>
              </button>
              )}
            </div>
            
            {/* Tasks Tabs */}
            <div className="mb-4">
              <nav className="flex gap-4 border-b border-gray-100 pb-3">
                <button
                  onClick={() => setTasksSectionState("myTasks")}
                  className={`text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${tasksSectionState === "myTasks" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  مهامي <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{clientTasks.filter(task => !task.isCompleted && task.userId === user?.id).length}</span>
                </button>
                <button
                  onClick={() => setTasksSectionState("sentTasks")}
                  className={`text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${tasksSectionState === "sentTasks" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  مهام مرسلة <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{clientTasks.filter(task => task.assignedBy === user?.id && !task.isCompleted).length}</span>
                </button>
                <button
                  onClick={() => setTasksSectionState("completedTasks")}
                  className={`text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${tasksSectionState === "completedTasks" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  مهام مكتملة <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{clientTasks.filter(task => task.isCompleted && (task.userId === user?.id || task.assignedBy === user?.id)).length}</span>
                </button>
              </nav>
            </div>

            {/* My Tasks Tab */}
            {tasksSectionState === "myTasks" && (
              <ul className={`${Style["tajawal-medium"]} space-y-4`}>
                {isLoadingTasks ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                    <span className="text-sm text-gray-500 mt-2 block">جاري تحميل المهام...</span>
                  </div>
                ) : (
                  <>
                    {clientTasks.filter(task => !task.isCompleted && task.userId === user?.id).slice(0, 3).map((task, index) => (
                  <li 
                    key={index} 
                    className="border px-3 rounded-md py-2 border-gray-200 pb-4 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-lg font-medium text-gray-900">{stripHtmlTags(task.Title)}</p>
                          {task.priority && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              task.priority === 'عالية الأهمية' ? 'bg-red-100 text-red-600' :
                              task.priority === 'متوسط الأهمية' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {task.priority}
                            </span>
                          )}
                          {task.isRepeating && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                              متكررة
                            </span>
                          )}
                        </div>
                        
                        {/* Show who assigned the task prominently */}
                        {task.assignedBy && task.assignedBy !== user.id ? (
                          <div className="flex items-center gap-1 mb-2">
                            <span className="text-sm font-medium text-blue-700">مُسندة من:</span>
                            <span className="text-sm font-semibold text-blue-800 bg-blue-50 px-2 py-1 rounded">
                              {task.assignedByUser?.username || `المستخدم #${task.assignedBy}`}
                            </span>
                          </div>
                        ) : task.assignedBy === user.id ? (
                          <div className="flex items-center gap-1 mb-2">
                            <span className="text-sm font-medium text-green-700">مهمة ذاتية:</span>
                            <span className="text-sm font-semibold text-green-800 bg-green-50 px-2 py-1 rounded">
                              أنشأتها لنفسك
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mb-2">
                            <span className="text-sm font-medium text-gray-700">مُسندة من:</span>
                            <span className="text-sm font-semibold text-gray-800 bg-gray-50 px-2 py-1 rounded">
                              غير محدد
                            </span>
                          </div>
                        )}
                        
                        <p className="text-sm text-gray-600">{stripHtmlTags(task.description)}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>الموعد: {getDate(task.taskDeadline)}</span>
                          {task.repeatTime && (
                            <span>الوقت: {task.repeatTime}</span>
                          )}
                        </div>
                        {task.completionDate && (
                          <p className="text-xs text-orange-600 mt-1">
                            تاريخ الانتهاء من جانبي: {getDate(task.completionDate)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-sm ${task.completionDate ? 'text-orange-600' : 'text-gray-600'}`}>
                          {task.completionDate ? 'انتهيت من المهمة' : 'لم أنته بعد'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskCompletionClick(task);
                          }}
                          className="px-3 py-1 text-xs bg-teal-600 text-white hover:bg-teal-700 rounded-lg transition-colors"
                        >
                          {task.completionDate ? 'تعديل تاريخ الانتهاء' : 'تحديد انتهيت'}
                        </button>
                      </div>
                    </div>
                  </li>
                    ))}
                    {clientTasks.filter(task => !task.isCompleted && task.userId === user?.id).length > 3 && (
                      <div className="text-center py-2">
                        <button 
                          onClick={() => handleMoreTasksClick(
                            clientTasks.filter(task => !task.isCompleted && task.userId === user?.id), 
                            'مهامي'
                          )}
                          className="text-sm text-teal-600 hover:text-teal-800 font-medium"
                        >
                          عرض المزيد ({clientTasks.filter(task => !task.isCompleted && task.userId === user?.id).length - 3} مهمة إضافية)
                        </button>
                      </div>
                    )}
                    {clientTasks.filter(task => !task.isCompleted && task.userId === user?.id).length === 0 && (
                      <div className="text-center py-8">
                        <span className="text-sm text-gray-500">لا توجد مهام</span>
                      </div>
                    )}
                  </>
                )}
              </ul>
            )}

            {/* Sent Tasks Tab */}
            {tasksSectionState === "sentTasks" && (
              <ul className={`${Style["tajawal-medium"]} space-y-4`}>
                {isLoadingTasks ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                    <span className="text-sm text-gray-500 mt-2 block">جاري تحميل المهام...</span>
                  </div>
                ) : (
                  <>
                    {clientTasks.filter(task => task.assignedBy === user?.id && !task.isCompleted).slice(0, 3).map((task, index) => (
                  <li 
                    key={index} 
                    className="border px-3 rounded-md py-2 border-gray-200 pb-4 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-lg font-medium text-gray-900">{stripHtmlTags(task.Title)}</p>
                          {task.priority && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              task.priority === 'عالية الأهمية' ? 'bg-red-100 text-red-600' :
                              task.priority === 'متوسط الأهمية' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {task.priority}
                            </span>
                          )}
                          {task.isRepeating && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                              متكررة
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{stripHtmlTags(task.description)}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>الموعد: {getDate(task.taskDeadline)}</span>
                          {task.repeatTime && (
                            <span>الوقت: {task.repeatTime}</span>
                          )}
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          مُرسلة إلى: {task.user?.username || `المستخدم #${task.userId}`}
                        </p>
                        {task.completionDate && (
                          <p className="text-xs text-blue-600 mt-1">
                            انتهى من جانبه في: {getDate(task.completionDate)}
                          </p>
                        )}
                        {task.completionNotes && (
                          <p className="text-xs text-gray-600 mt-1">
                            ملاحظات: {task.completionNotes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-sm ${
                          task.completionDate 
                            ? 'text-blue-600' 
                            : 'text-gray-600'
                        }`}>
                          {task.completionDate ? 'انتهى من جانبه' : 'لم ينته بعد'}
                        </span>
                        {task.completionDate ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskUpdate(task.id, true, task.completionDate, task.completionNotes);
                            }}
                            className="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                          >
                            اعتماد كمكتمل
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskCompletionClick(task);
                            }}
                            className="px-3 py-1 text-xs bg-teal-100 text-teal-700 hover:bg-teal-200 rounded-lg transition-colors"
                          >
                            عرض التفاصيل
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                    ))}
                    {clientTasks.filter(task => task.assignedBy === user?.id && !task.isCompleted).length > 3 && (
                      <div className="text-center py-2">
                        <button 
                          onClick={() => handleMoreTasksClick(
                            clientTasks.filter(task => task.assignedBy === user?.id && !task.isCompleted), 
                            'المهام المرسلة'
                          )}
                          className="text-sm text-teal-600 hover:text-teal-800 font-medium"
                        >
                          عرض المزيد ({clientTasks.filter(task => task.assignedBy === user?.id && !task.isCompleted).length - 3} مهمة إضافية)
                        </button>
                      </div>
                    )}
                    {clientTasks.filter(task => task.assignedBy === user?.id && !task.isCompleted).length === 0 && (
                      <div className="text-center py-8">
                        <span className="text-sm text-gray-500">لا توجد مهام مرسلة</span>
                      </div>
                    )}
                  </>
                )}
              </ul>
            )}

            {/* Completed Tasks Tab */}
            {tasksSectionState === "completedTasks" && (
              <ul className={`${Style["tajawal-medium"]} space-y-4`}>
                {isLoadingTasks ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                    <span className="text-sm text-gray-500 mt-2 block">جاري تحميل المهام...</span>
                  </div>
                ) : (
                  <>
                    {clientTasks.filter(task => task.isCompleted && (task.userId === user?.id || task.assignedBy === user?.id)).slice(0, 3).map((task, index) => (
                  <li 
                    key={index} 
                    className="border px-3 rounded-md py-2 border-gray-200 pb-4 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-lg font-medium text-gray-900">{stripHtmlTags(task.Title)}</p>
                          {task.priority && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              task.priority === 'عالية الأهمية' ? 'bg-red-100 text-red-600' :
                              task.priority === 'متوسط الأهمية' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {task.priority}
                            </span>
                          )}
                          {task.isRepeating && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                              متكررة
                            </span>
                          )}
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">
                            مكتملة
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{stripHtmlTags(task.description)}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>الموعد: {getDate(task.taskDeadline)}</span>
                          {task.repeatTime && (
                            <span>الوقت: {task.repeatTime}</span>
                          )}
                        </div>
                        {task.assignedBy === user.id ? (
                          <p className="text-xs text-green-600 mt-1">
                            مُرسلة إلى: {task.user?.username || `المستخدم #${task.userId}`}
                          </p>
                        ) : (
                          <p className="text-xs text-blue-600 mt-1">
                            مُسندة من: {task.assignedByUser?.username || `المستخدم #${task.assignedBy}`}
                          </p>
                        )}
                        {task.completionDate && (
                          <p className="text-xs text-green-600 mt-1">
                            تاريخ الانتهاء: {getDate(task.completionDate)}
                          </p>
                        )}
                        {task.completionNotes && (
                          <p className="text-xs text-gray-600 mt-1">
                            ملاحظات: {task.completionNotes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-sm text-green-600 font-medium">مكتملة</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskClick(task);
                          }}
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          عرض التفاصيل
                        </button>
                      </div>
                    </div>
                  </li>
                    ))}
                    {clientTasks.filter(task => task.isCompleted && (task.userId === user?.id || task.assignedBy === user?.id)).length > 3 && (
                      <div className="text-center py-2">
                        <button 
                          onClick={() => handleMoreTasksClick(
                            clientTasks.filter(task => task.isCompleted && (task.userId === user?.id || task.assignedBy === user?.id)), 
                            'المهام المكتملة'
                          )}
                          className="text-sm text-teal-600 hover:text-teal-800 font-medium"
                        >
                          عرض المزيد ({clientTasks.filter(task => task.isCompleted && (task.userId === user?.id || task.assignedBy === user?.id)).length - 3} مهمة إضافية)
                        </button>
                      </div>
                    )}
                    {clientTasks.filter(task => task.isCompleted && (task.userId === user?.id || task.assignedBy === user?.id)).length === 0 && (
                      <div className="text-center py-8">
                        <span className="text-sm text-gray-500">لا توجد مهام مكتملة</span>
                      </div>
                    )}
                  </>
                )}
              </ul>
            )}
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
                  الطلبات المرفوضة  <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{rejectedOrdersCount}</span>
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
                  ? router.push("/admin/rejectedorders")
                  : null;
              }}
              className="view-all-btn cursor-pointer bg-teal-800 text-white text-sm font-medium px-5 py-2 rounded-lg shadow-sm hover:shadow-md hover:from-teal-700 hover:to-teal-900 transition-all duration-300"
            >
              عرض الكل
            </a>
          </header>
          {ordersSectionState === "newOrders" && <NewOrdersTab orders={newOrders} count={newOrdersLength} onItemClick={handleOrderItemClick} />}
          {ordersSectionState === "currentOrders" && <CurrentOrdersTab orders={currentOrders} count={currentOrdersLength} onItemClick={handleItemClick} />}
          {ordersSectionState === "endedOrders" && <EndedOrdersTab orders={endedOrders} count={finished} onItemClick={handleItemClick} />}
          {ordersSectionState === "cancelledOrders" && <CancelledOrdersTab rejectedOrders={rejectedOrders} count={rejectedOrdersCount} onItemClick={handleItemClick} />}
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
          {arrivalsSectionState === "internalArrivals" && <InternalArrivalsTab arrivals={internalArrivals} count={arrivalsLength} onItemClick={handleItemClick} />}
          {arrivalsSectionState === "internalDeparatures" && <InternalDeparturesTab departures={internalDeparatures} count={deparaturesLength} onItemClick={handleItemClick} />}
          {arrivalsSectionState === "externalDeparatures" && <ExternalDeparturesTab departures={externalDeparatures} count={externaldeparaturesLength} onItemClick={handleItemClick} />}
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
                  التسكين <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{housedCount}</span>
                </a>
                <a
                  onClick={() => setHousingSectionState("checkedTable")}
                  className={`tab-item cursor-pointer text-sm font-medium text-gray-600 hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${housingSectionState === "checkedTable" ? "text-teal-700 bg-teal-50" : ""}`}
                >
                  الاعاشة <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{housedCount}</span>
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
          {housingSectionState === "housing" && <HousingTab housing={housed} count={housed.length} onItemClick={handleItemClick} />}
          {housingSectionState === "checkedTable" && <CheckedTableTab housing={housed} count={housed.length} onItemClick={handleItemClick} />}
          {housingSectionState === "sessions" && <SessionsTab sessions={sessions} count={sessionsLength} onItemClick={handleItemClick} />}
        </section>

        {/* Workers Section */}
        <section id="homemaids" className={`${Style["tajawal-medium"]} info-card card bg-gradient-to-br mt-2 from-white to-gray-50 border border-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
          <header className="info-card-header flex justify-between items-center mb-6">
            <div className="info-card-title-tabs flex flex-col gap-6">
              <h3 className="info-card-title text-2xl font-semibold text-gray-800 tracking-tight">العاملات</h3>
              <nav className="info-card-tabs flex gap-6 border-b border-gray-100 pb-3">
                <a
                  onClick={() => setWorkersSectionState("workers")}
                  className={`tab-item text-sm font-medium text-gray-600 hover:text-teal-600 flex cursor-pointer items-center gap-2 py-2 px-3 cursor-pointer rounded-lg transition-colors duration-200 ${workersSectionState === "workers" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  العاملات <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{homeMaidsLength}</span>
                </a>
                <a
                  onClick={() => setWorkersSectionState("bookedlist")}
                  className={`tab-item text-sm font-medium text-gray-600 hover:text-teal-600 cursor-pointer flex items-center cursor-pointer gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${workersSectionState === "bookedlist" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  العاملات المحجوزة <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{bookedList.length}</span>
                </a>
                <a
                  onClick={() => setWorkersSectionState("availablelist")}
                  className={`tab-item text-sm font-medium text-gray-600 hover:text-teal-600 cursor-pointer flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${workersSectionState === "availablelist" ? "bg-teal-50 text-teal-700" : ""}`}
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
          {workersSectionState === "workers" && <WorkersTab workers={fullList} count={homeMaidsLength} onItemClick={handleItemClick} />}
          {workersSectionState === "bookedlist" && <BookedListTab booked={bookedList} count={bookedList.length} onItemClick={handleItemClick} />}
          {workersSectionState === "availablelist" && <AvailableListTab available={availableList} count={availableList.length} onItemClick={handleItemClick} />}
        </section>

        {/* Public Relations Section */}
        <section id="public-relations" className={`${Style["tajawal-medium"]} info-card card bg-gradient-to-br mt-2 from-white to-gray-50 border border-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
          <header className="info-card-header flex justify-between items-center mb-6">
            <div className="info-card-title-tabs flex flex-col gap-6">
              <h3 className="info-card-title text-2xl font-semibold text-gray-800 tracking-tight">إدارة العلاقات</h3>
              <nav className="info-card-tabs flex gap-6 border-b border-gray-100 pb-3">
                <a
                  onClick={() => setRelationsSectionState("relations")}
                  className={`tab-item text-sm font-medium text-gray-600 cursor-pointer hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${relationsSectionState === "relations" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  قائمة العملاء <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{clientsCount}</span>
                </a>
                <a
                  onClick={() => setRelationsSectionState("sponsorship-transfers")}
                  className={`tab-item text-sm font-medium text-gray-600 cursor-pointer hover:text-teal-600 flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${relationsSectionState === "sponsorship-transfers" ? "bg-teal-50 text-teal-700" : ""}`}
                >
                  معاملات نقل الكفالة <span className="bg-teal-100 text-teal-600 text-xs font-semibold px-2 py-0.5 rounded-full">{transferSponsorshipsLength}</span>
                </a>
                <a
                  onClick={() => setRelationsSectionState("foreign-offices")}
                  className={`tab-item text-sm font-medium text-gray-600 hover:text-teal-600 cursor-pointer flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 ${relationsSectionState === "foreign-offices" ? "bg-teal-50 text-teal-700" : ""}`}
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
          {relationsSectionState === "relations" && <RelationsTab relations={relations} count={clientsCount} onItemClick={handleItemClick} />}
          {relationsSectionState === "sponsorship-transfers" && <SponsorshipTransfersTab transfers={transferSponsorships} count={transferSponsorshipsLength} onItemClick={handleItemClick} />}
          {relationsSectionState === "foreign-offices" && <ForeignOfficesTab offices={foreignOffices} count={officesCount} onItemClick={handleItemClick} />}
        </section>

        {/* Task Modal */}
        <AddTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddTask}
        />

        {/* Task Details Modal */}
        {taskDetailsModal.isOpen && taskDetailsModal.task && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">تفاصيل المهمة</h3>
                <button
                  onClick={() => setTaskDetailsModal({ isOpen: false, task: null })}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">عنوان المهمة</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{stripHtmlTags(taskDetailsModal.task.Title)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">الوصف</label>
                  <p className="mt-1 text-gray-600">{stripHtmlTags(taskDetailsModal.task.description)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">الموعد النهائي</label>
                  <p className="mt-1 text-gray-600">{getDate(taskDetailsModal.task.taskDeadline)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">الحالة</label>
                  <p className={`mt-1 inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    taskDetailsModal.task.isCompleted 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {taskDetailsModal.task.isCompleted ? 'مكتمل' : 'غير مكتمل'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">تاريخ الإنشاء</label>
                  <p className="mt-1 text-gray-600">{getDate(taskDetailsModal.task.createdAt)}</p>
                </div>
                {taskDetailsModal.task.assignedBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">مُسندة من</label>
                    <p className="mt-1 text-blue-600 font-medium">المستخدم #{taskDetailsModal.task.assignedBy}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setTaskDetailsModal({ isOpen: false, task: null })}
                  className="bg-teal-800 text-white px-4 py-2 rounded-md hover:bg-teal-900"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* More Tasks Modal */}
        {moreTasksModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">{moreTasksModal.title}</h3>
                <button
                  onClick={() => setMoreTasksModal({ isOpen: false, tasks: [], title: '' })}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                {moreTasksModal.tasks.map((task, index) => (
                  <div 
                    key={index} 
                    className="border px-4 py-3 rounded-lg border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setMoreTasksModal({ isOpen: false, tasks: [], title: '' });
                      handleTaskClick(task);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-lg font-medium text-gray-900">{stripHtmlTags(task.Title)}</p>
                          {task.priority && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              task.priority === 'عالية الأهمية' ? 'bg-red-100 text-red-600' :
                              task.priority === 'متوسط الأهمية' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {task.priority}
                            </span>
                          )}
                          {task.isRepeating && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                              متكررة
                            </span>
                          )}
                        </div>
                        
                        {/* Show who assigned the task prominently for My Tasks */}
                        {moreTasksModal.title === 'مهامي' && (
                          task.assignedBy && task.assignedBy !== user.id ? (
                            <div className="flex items-center gap-1 mb-2">
                              <span className="text-sm font-medium text-blue-700">مُسندة من:</span>
                              <span className="text-sm font-semibold text-blue-800 bg-blue-50 px-2 py-1 rounded">
                                {task.assignedByUser?.username || `المستخدم #${task.assignedBy}`}
                              </span>
                            </div>
                          ) : task.assignedBy === user.id ? (
                            <div className="flex items-center gap-1 mb-2">
                              <span className="text-sm font-medium text-green-700">مهمة ذاتية:</span>
                              <span className="text-sm font-semibold text-green-800 bg-green-50 px-2 py-1 rounded">
                                أنشأتها لنفسك
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 mb-2">
                              <span className="text-sm font-medium text-gray-700">مُسندة من:</span>
                              <span className="text-sm font-semibold text-gray-800 bg-gray-50 px-2 py-1 rounded">
                                غير محدد
                              </span>
                            </div>
                          )
                        )}
                        
                        <p className="text-sm text-gray-600">{stripHtmlTags(task.description)}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>الموعد: {getDate(task.taskDeadline)}</span>
                          {task.repeatTime && (
                            <span>الوقت: {task.repeatTime}</span>
                          )}
                        </div>
                        {task.assignedBy && task.assignedBy !== user.id && (
                          <p className="text-xs text-blue-600 mt-1">
                            مُسندة من: {task.assignedByUser?.username || `المستخدم #${task.assignedBy}`}
                          </p>
                        )}
                        {task.userId && task.userId !== user.id && (
                          <p className="text-xs text-green-600 mt-1">
                            مُرسلة إلى: {task.user?.username || `المستخدم #${task.userId}`}
                          </p>
                        )}
                      </div>
                      <span className={`text-sm ${task.isCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
                        {task.isCompleted ? 'مكتمل' : 'غير مكتمل'}
                      </span>
                    </div>
                  </div>
                ))}
                {moreTasksModal.tasks.length === 0 && (
                  <div className="text-center py-8">
                    <span className="text-sm text-gray-500">لا توجد مهام</span>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setMoreTasksModal({ isOpen: false, tasks: [], title: '' })}
                  className="bg-teal-800 text-white px-4 py-2 rounded-md hover:bg-teal-900"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alert Modal */}
        <AlertModal
          isOpen={alertModal.isOpen}
          onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
          type={alertModal.type}
          title={alertModal.title}
          message={alertModal.message}
          autoClose={alertModal.type === 'success'}
          autoCloseDelay={3000}
        />

        {/* Task Completion Modal */}
        <TaskCompletionModal
          isOpen={taskCompletionModal.isOpen}
          onClose={() => setTaskCompletionModal({ isOpen: false, task: null })}
          task={taskCompletionModal.task}
          onTaskUpdate={handleTaskUpdate}
          currentUser={user}
        />

        {/* Order Action Modal (Accept/Reject) */}
        {orderActionModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  إجراء على الطلب #{orderActionModal.orderId}
                </h3>
                <button
                  onClick={() => {
                    setOrderActionModal({ isOpen: false, orderId: null, action: null });
                    setRejectionReason('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {orderActionModal.action === null ? (
                // Initial selection: Accept or Reject
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">اختر الإجراء المناسب للطلب:</p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setOrderActionModal({ ...orderActionModal, action: 'accept' })}
                      className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200 text-base font-medium"
                    >
                      قبول الطلب
                    </button>
                    <button
                      onClick={() => setOrderActionModal({ ...orderActionModal, action: 'reject' })}
                      className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition duration-200 text-base font-medium"
                    >
                      رفض الطلب
                    </button>
                    <button
                      onClick={() => router.push(`/admin/track_order/${orderActionModal.orderId}`)}
                      className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-200 text-base font-medium"
                    >
                      عرض تفاصيل الطلب
                    </button>
                  </div>
                </div>
              ) : orderActionModal.action === 'accept' ? (
                // Confirm Accept
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">هل أنت متأكد من قبول هذا الطلب؟</p>
                  <div className="flex justify-between gap-3">
                    <button
                      onClick={() => setOrderActionModal({ ...orderActionModal, action: null })}
                      className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-200"
                    >
                      رجوع
                    </button>
                    <button
                      onClick={confirmAcceptOrder}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
                    >
                      نعم، قبول
                    </button>
                  </div>
                </div>
              ) : (
                // Reject with reason
                <div className="space-y-4">
                  <p className="text-gray-600 mb-2">يرجى كتابة سبب رفض الطلب:</p>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="اكتب السبب هنا..."
                    className="w-full p-3 border border-gray-300 rounded-lg text-right resize-none"
                    rows={4}
                  />
                  <div className="flex justify-between gap-3">
                    <button
                      onClick={() => {
                        setOrderActionModal({ ...orderActionModal, action: null });
                        setRejectionReason('');
                      }}
                      className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-200"
                    >
                      رجوع
                    </button>
                    <button
                      onClick={confirmRejectOrder}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200"
                    >
                      تأكيد الرفض
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// --- Static Site Generation with ISR ---
export async function getStaticProps(context) {
  try {
    // Helper function to fetch data from API
    const fetchDataFromApi = async (url) => {
      try {
        const response = await fetch(url, {
          headers: { Accept: "application/json", "Content-Type": "application/json" },
        });
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error(`Error fetching from ${url}:`, error);
        return null; // or return a default value/structure
      }
    };

    // 1. Fetch initial counts
    let counts = {
      deparatures: 0,
      arrivals: 0,
      rejectedOrders: 0,
      workers: 0,
      transferSponsorships: 0,
      neworderCount: 0,
      finished: 0,
      cancelledorders: 0,
      offices: 0,
    };
    try {
      const countsResponse = await fetchDataFromApi(`https:/wasl.rawaes.com/api/datalength`);
      if (countsResponse) {
        counts = countsResponse;
      }
    } catch (error) {
      console.error("Error fetching initial counts:", error);
    }

    const countDeparaturesfromsaudi = await prisma.arrivallist.count({
      where: {
        externaldeparatureDate: { not: null },
      },
    });
    // 2. Fetch all detailed data (excluding user-specific data like tasks)
    const [
      newOrdersRes,
      currentOrdersRes,
      endedOrdersRes,
      cancelledOrdersRes,
      arrivalsRes,
      internalDeparaturesRes,
      externalDeparaturesRes,
      housedRes,
      sessionsRes,
      relationsRes,
      transferSponsorshipsRes,
      fullListRes,
      bookedListRes,
      availableListRes,
      foreignOfficesRes,
      rejectedOrdersRes,
    ] = await Promise.all([
      fetchDataFromApi(`https:/wasl.rawaes.com/api/neworderlistprisma/1`),
      fetchDataFromApi(`https:/wasl.rawaes.com/api/homeinitialdata/currentordersprisma`),
      fetchDataFromApi(`https:/wasl.rawaes.com/api/endedorders/`),
      fetchDataFromApi(`https:/wasl.rawaes.com/api/homeinitialdata/cancelledorders`),
      fetchDataFromApi(`https:/wasl.rawaes.com/api/homeinitialdata/arrivals`),
      fetchDataFromApi(`https:/wasl.rawaes.com/api/deparatures`),
      fetchDataFromApi(`https:/wasl.rawaes.com/api/homeinitialdata/deparaturefromsaudi`),
      fetchDataFromApi(`https:/wasl.rawaes.com/api/homeinitialdata/housed`),
      fetchDataFromApi(`https:/wasl.rawaes.com/api/sessions`),
      fetchDataFromApi(`https:/wasl.rawaes.com/api/homeinitialdata/clients`),
      fetchDataFromApi(`https:/wasl.rawaes.com/api/transfersponsorships`),
      fetchDataFromApi(`https:/wasl.rawaes.com/api/homemaidprisma?page=1`),
      fetchDataFromApi(`https:/wasl.rawaes.com/api/bookedlist?page=1`),
      fetchDataFromApi(`https:/wasl.rawaes.com/api/availablelist?page=1`),
      fetchDataFromApi(`https:/wasl.rawaes.com/api/homeinitialdata/externaloffices`),
      fetchDataFromApi(`https:/wasl.rawaes.com/api/rejectedorderslist?searchTerm=&age=&Country=&page=1`),
      // Tasks are now fetched client-side for user-specific data
    ]);

    // Mock events data (as in original)
    const events = [
      { title: "Arrival: Person 1", date: "2025-01-01" },
      { title: "Arrival: Person 10", date: "2025-01-01" },
      { title: "Arrival: Person 11", date: "2025-01-01" },
      { title: "Arrival: Person 12", date: "2025-01-01" },
      { title: "Arrival: Person 2", date: "2025-02-10" },
      { title: "Arrival: Person 3", date: "2025-03-15" },
      { title: "Arrival: Person 4", date: "2025-12-25" },
      { title: "Arrival: Person 5", date: "2025-11-30" },
    ];
    // Process and structure the data for props
 
 
  
      const housedCount = await prisma.housedworker.count({
        where: {
          deparatureHousingDate: null,
        },
    });
    console.log(newOrdersRes);
    const propsData = {
      housedCount: housedCount,
      // Data (user, userforbutton, and tasks are now fetched client-side)
      newOrders: newOrdersRes?.data || [],
      currentOrders: currentOrdersRes?.data || [],
      endedOrders: endedOrdersRes?.homemaids || [],
      cancelledOrders: cancelledOrdersRes?.data || [],
      internalArrivals: arrivalsRes?.data || [],
      internalDeparatures: internalDeparaturesRes?.data || [],
      externalDeparatures: externalDeparaturesRes?.data || [],
      housed: housedRes?.housed || [],
      sessions: sessionsRes?.sessions || [],
      relations: relationsRes?.data || [],
      transferSponsorships: transferSponsorshipsRes || [],
      fullList: fullListRes?.data || [],
      bookedList: bookedListRes?.data || [],
      availableList: availableListRes?.data || [],
      foreignOffices: foreignOfficesRes?.data || [],
      events,
      rejectedOrdersCount: rejectedOrdersRes?.totalCount || 0,
      rejectedOrders: rejectedOrdersRes.homemaids || [],
      // Counts (using fetched data or falling back to initial counts)
      newOrdersLength: counts.neworderCount,
      currentOrdersLength: currentOrdersRes?.totalCount || 0,
      finished: endedOrdersRes?.homemaids?.length || counts.finished,
      cancelledorders: cancelledOrdersRes?.data?.length || counts.cancelledorders,
      arrivalsLength: arrivalsRes?.arrivalsCount || 0,
      deparaturesLength: internalDeparaturesRes?.data?.length || counts.deparatures,
      externaldeparaturesLength: countDeparaturesfromsaudi || 0,
      homeMaidsLength: fullListRes?.totalRecords || counts.workers,
      officesCount: foreignOfficesRes?.dataCount || 0,
      transferSponsorshipsLength: 0,
      sessionsLength: sessionsRes?.totalResults || 0,
      clientsCount: relationsRes?.dataCount || 0,
    };

    return {
      props: propsData,
      // Revalidate every 60 seconds (ISR - Incremental Static Regeneration)
      revalidate: 60,
    };
  } catch (error) {
    console.log("Error in getStaticProps:", error);
    // For SSG, return empty props on error instead of redirecting
    return {
      props: {
        rejectedOrdersCount: 0,
        newOrders: [],
        currentOrders: [],
        endedOrders: [],
        cancelledOrders: [],
        rejectedOrders: [],
        internalArrivals: [],
        internalDeparatures: [],
        externalDeparatures: [],
        housed: [],
        sessions: [],
        relations: [],
        transferSponsorships: [],
        fullList: [],
        bookedList: [],
        availableList: [],
        foreignOffices: [],
        events: [],
        newOrdersLength: 0,
        housedCount: 0,
        currentOrdersLength: 0,
        finished: 0,
        cancelledorders: 0,
        arrivalsLength: 0,
        deparaturesLength: 0,
        externaldeparaturesLength: 0,
        homeMaidsLength: 0,
        officesCount: 0,
        transferSponsorshipsLength: 0,
        sessionsLength: 0,
        clientsCount: 0,
      },
      revalidate: 60,
    };
  }
}