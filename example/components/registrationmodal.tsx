import { useRouter } from "next/router";
import ErrorModal from "office/components/errormodal";
import React, { useState, useRef } from "react";
import GenderQuotaConfirmModal from "components/GenderQuotaConfirmModal";
// import Loader from "./Loader/Loader";
// interface ModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   id:int,

// }

const RegistrationModal = ({ isOpen, onClose, id, filteredSuggestions }) => {
  // alert(id);

  const [name, setName] = useState(""); // المستخدم يدخل اسمه
  const [email, setEmail] = useState(""); // المستخدم يدخل بريده الإلكتروني
  const [phone, setPhone] = useState(""); // المستخدم يدخل هاتفه
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [errormodaopen, setIserrorModalOpen] = useState(false);
  const [errormessage, seterrormessage] = useState("");
  const genderQuotaBodyRef = useRef<Record<string, unknown> | null>(null);
  const [genderQuotaModal, setGenderQuotaModal] = useState({ open: false, message: "" });
  const [genderQuotaResolving, setGenderQuotaResolving] = useState(false);

  const closeGenderQuotaModal = () => {
    setGenderQuotaModal({ open: false, message: "" });
    genderQuotaBodyRef.current = null;
  };

  const confirmGenderQuotaRegistration = async () => {
    const body = genderQuotaBodyRef.current;
    if (!body) return;
    setGenderQuotaResolving(true);
    try {
      const fetchData = await fetch("/api/submitneworderprisma/", {
        body: JSON.stringify({ ...body, confirmGenderQuotaWarning: true }),
        method: "post",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      const data = await fetchData.json();
      if (fetchData.status == 200 && data?.requiresGenderQuotaConfirmation === true) {
        setIserrorModalOpen(true);
        seterrormessage("تعذر إتمام الطلب بعد التأكيد.");
        closeGenderQuotaModal();
        return;
      }
      if (fetchData.status == 200 && !data?.requiresGenderQuotaConfirmation && data?.id) {
        closeGenderQuotaModal();
        router.push("/admin/neworder/" + data.id);
      } else {
        setIserrorModalOpen(true);
        seterrormessage(data?.message || "حدث خطأ");
        closeGenderQuotaModal();
      }
    } catch {
      setIserrorModalOpen(true);
      seterrormessage("حدث خطأ");
      closeGenderQuotaModal();
    } finally {
      setGenderQuotaResolving(false);
    }
  };

  const postData = async (e) => {
    try {
    } catch (e) {}
    e.preventDefault();
    const buildBody = (withConfirm: boolean) => ({
      ClientName: name,
      email,
      clientphonenumber: phone,
      city,
      address,
      nationalId,
      NationalityCopy: filteredSuggestions.Nationalitycopy,
      HomemaidId: filteredSuggestions.id,
      Name: filteredSuggestions.Name,
      age: filteredSuggestions.age,
      PhoneNumber: filteredSuggestions.phone,
      Passportnumber: filteredSuggestions.Passportnumber,
      maritalstatus: filteredSuggestions.maritalstatus,
      Nationality: filteredSuggestions.Nationalitycopy,
      Religion: filteredSuggestions.Religion,
      ExperienceYears: filteredSuggestions.ExperienceYears,
      ...(withConfirm ? { confirmGenderQuotaWarning: true } : {}),
    });
    const firstBody = buildBody(false);
    const fetchData = await fetch("/api/submitneworderprisma/", {
      body: JSON.stringify(firstBody),
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    const data = await fetchData.json();

    if (fetchData.status == 200 && data?.requiresGenderQuotaConfirmation === true) {
      genderQuotaBodyRef.current = firstBody;
      setGenderQuotaModal({ open: true, message: String(data.message ?? "") });
      return;
    }

    if (fetchData.status == 200 && !data?.requiresGenderQuotaConfirmation && data?.id) {
      router.push("/admin/neworder/" + data.id);
    } else {
      setIserrorModalOpen(true);
      seterrormessage(data?.message || "حدث خطأ");
    }
  };

  if (!isOpen) return null;

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
        <h2 className="text-2xl font-semibold text-center mb-4">تسجيل</h2>
        <form>
          <div className="mb-4">
            <label className="block text-gray-700">الاسم</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="أدخل اسمك"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">رقم الهوية</label>
            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="أدخل الرقم الهوية"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">البريد الإلكتروني</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="أدخل بريدك الإلكتروني"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">رقم الجوال</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="أدخل رقم الجوال"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">المدينة</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              type="text"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="مدينة العميل"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">العنوان</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="العنوان"
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
      <GenderQuotaConfirmModal
        open={genderQuotaModal.open}
        message={genderQuotaModal.message}
        isSubmitting={genderQuotaResolving}
        onConfirm={confirmGenderQuotaRegistration}
        onCancel={closeGenderQuotaModal}
      />
    </div>
  );
};

export default RegistrationModal;
