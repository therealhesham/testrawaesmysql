import { useRouter } from "next/router";
import ErrorModal from "office/components/errormodal";
import React, { useState } from "react";
// import Loader from "./Loader/Loader";
// interface ModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   id:int,

// }

const RegistrationHousingModal = ({
  isOpen,
  onClose,
  id,
  filteredSuggestions,
  setDate,
}) => {

  
  if (!isOpen) return null;
  // alert(id);
  const [details, setdetails] = useState("");
  
  const [reason, setReason] = useState("");

const [employee,setEmployee]=useState("")

  const [deliveryDate, setDeliveyDate] = useState("");
  const [houseentrydate, sethouseentrydate] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [errormodaopen, setIserrorModalOpen] = useState(false);
  const [errormessage, seterrormessage] = useState("");
  const postData = async (e) => {
    try {
    } catch (e) {}
    e.preventDefault();
    const fetchData = await fetch("/api/confirmhousinginformation/", {
      body: JSON.stringify({
        // ...values,
        reason,employee,
        details: details,
        homeMaidId: id,
        houseentrydate: houseentrydate,
        deliveryDate,

        // fullname: name,
      }),
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    const data = await fetchData.json();

    if (fetchData.status == 200) {
      onClose();
      setDate();
      // router.push("/admin/neworder/" + data.id);
    } else {
      setIserrorModalOpen(true);
      seterrormessage(data.message);
    }
  };

  return (
    <div
      className="fixed inset-0 w-full bg-gray-500 bg-opacity-50 flex justify-center items-center "
      onClick={onClose}
    >
      <ErrorModal
        isErrorModalOpen={errormodaopen}
        onClose={() => setIserrorModalOpen(false)}
        message={errormessage}
      />
      <div className="absolute top-4 right-10">
        <button onClick={onClose} className="text-gray-500 hover:text-black">
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
        className="bg-white p-8 rounded-lg shadow-lg w-96"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold text-center mb-4">تسكين</h2>
        <form>
          <div className="mb-4">
            <label className="block text-gray-700">تاريخ التسكين</label>
            <input
              type="date"
              value={houseentrydate}
              onChange={(e) => sethouseentrydate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              // placeholder="أدخل اسمك"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">تاريخ الاستلام</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveyDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              // placeholder="أدخل اسمك"
            />
          </div>



          <div className="mb-4">
            <label className="block text-gray-700">الموظف</label>
            <input
              type="text"
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              // placeholder="أدخل اسمك"
            />
          </div>


          <div className="mb-4">
            <label className="block text-gray-700">سبب التسكين</label>
            <select className="rounded-md" onChange={(e)=>setReason(e.target.value)}>

              <option value="">...</option>

              <option value="نقل كفالة">نقل كفالة</option>
              <option value="انتظار الترحيل">انتظار الترحيل</option>
              <option value="مشكلة مكتب العمل">مشكلة مكتب العمل</option>
              <option value="رفض العمل للسفر">رفض العمل للسفر</option>
              <option value="رفض العم لنقل الكفالة">رفض العمل لنقل الكفالة</option>



            </select>
          </div>


<div className="mb-4">

            <input

              type="text"
              value={details}
              onChange={(e) => setdetails(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="التفاصيل"
            />

  </div>
          <span>{error}</span>
          <div className="flex justify-center gap-4">
            <button
              onClick={postData}
              type="submit"
              className="bg-teal-500 text-white py-2 px-4 rounded-lg"
            >
              تسجيل
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-red-500 text-white py-2 px-4 rounded-lg"
            >
              إغلاق
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationHousingModal;
