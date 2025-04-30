//@ts-nocheck
//@ts-ignore
// pages/resume.tsx
import Modal from "example/components/deparaturemodal";
import RegistrationModal from "example/components/registrationmodal";
import Layout from "example/containers/Layout";
import Style from "styles/Home.module.css";

import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import {
  FaEnvelope,
  FaPhone,
  FaGraduationCap,
  FaBriefcase,
  FaLanguage,
  FaTools,
} from "react-icons/fa";
import RegistrationHousingModal from "example/components/registerhousingmodal";

const ResumePage = () => {
  const [filteredSuggestions, setFilteredSuggestions] = useState({
    Housed: [],
    Name: "",
    NewOrder: [],
    Picture: [{ url: "" }],
  });
  const [logs, setLogs] = useState([]); // State to store logs
  const [Existing, setExisting] = useState(false);
  const [image, setImage] = useState("");
  const [query, setQuery] = useState("");
  const [isHousingModalOpen, setIsHousingModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleChangeProfile = async (e) => {
    const submitter = await fetch("/api/changeprofile", {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: filteredSuggestions?.NewOrder[0]?.id,
        profileStatus: e.target.value,
      }),
    });

    if (submitter.ok) {
      setDate(Date.now());
    }
  };

  const updateHousingStatus = async (homeMaidId, profileStatus) => {
    const response = await fetch("/api/confirmhousing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        homeMaidId: filteredSuggestions.NewOrder[0].id,
        profileStatus,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      setDate(Date.now());
      console.log("Success:", data.message);
    } else {
      console.log("Error:", data.error);
    }
  };

  const handleBooking = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const fetchdata = async (id) => {
    const fetchData = await fetch("/api/findcvprisma/" + id, {
      cache: "default",
    });
    const parser = await fetchData.json();
    setExisting(true);
    setFilteredSuggestions(parser);
    fetchImageDate(parser.Name);
  };

  const fetchLogs = async (id) => {
    try {
      const response = await fetch(`/api/logs?id=${id}`, {
        method: "GET",
      });
      const data = await response.json();
      if (response.ok) {
        setLogs(data);
      } else {
        console.error("Error fetching logs:", data.error);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const [date, setDate] = useState(Date.now());
  const [homeMaidId, sethomeMaidId] = useState(0);

  const fetchImageDate = async (name) => {
    const fetchData = await fetch("/api/getimagefromprisma/" + name, {
      method: "get",
    });
    const parser = await fetchData.json();
    setImage(parser.result);
  };

  const openOrder = () => {
    router.push("/admin/neworder/" + filteredSuggestions?.NewOrder[0]?.id);
  };

  useEffect(() => {
    if (!router.query.slug) return;
    fetchdata(router.query.slug);
    fetchLogs(router.query.slug); // Fetch logs when slug changes
    sethomeMaidId(router.query.slug);
  }, [router.query.slug]);

  useEffect(() => {
    fetchdata(router.query.slug);
    fetchLogs(router.query.slug); // Refetch logs on date change
  }, [date]);

  function getDate(date) {
    const currentDate = new Date(date);
    const form = currentDate.toISOString().split("T")[0];
    return form;
  }

  const [isModalDeparatureOpen, setIsModalDeparatureOpen] = useState(false);

  const handleOpenModalDeparature = () => {
    setIsModalDeparatureOpen(true);
  };

  const handleCloseModalDeparature = () => {
    setIsModalDeparatureOpen(false);
  };

  const handleModalDeparatureSubmit = (inputValue) => {
    console.log("Input Value:", inputValue);
  };

  const ReRender = () => {
    setDate(Date.now());
  };

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-12 px-6" dir="rtl">
        <div style={{ left: "90%" }} className=" top-5"></div>
        <Modal
          reRender={ReRender}
          id={filteredSuggestions?.NewOrder[0]?.id}
          isOpen={isModalDeparatureOpen}
          onClose={handleCloseModalDeparature}
          onSubmit={handleModalDeparatureSubmit}
        />

        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          {/* Existing Header and Profile Section */}
          <div className="flex items-center mb-8 gap-5">
            <img
              src={
                image?.includes("irtable")
                  ? image
                  : filteredSuggestions?.Picture
              }
              alt="Profile"
              className="w-32 h-32 rounded-lg border-4 border-bg-[#3D4C73] mr-6"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {filteredSuggestions?.Name}
              </h1>
              <h1 className="text-sm text-gray-800">
                {filteredSuggestions?.officeName}
              </h1>
              <h1
                className={`text-lg flex flex-row gap-2  text-red-800 
                ${Style["almarai-bold"]}
                `}
              >
                <strong>
                  {filteredSuggestions?.NewOrder[0]?.profileStatus != null
                    ? "حالة العاملة"
                    : null}
                </strong>
                <strong>
                  {filteredSuggestions?.NewOrder[0]?.profileStatus != null
                    ? filteredSuggestions?.NewOrder[0]?.profileStatus
                    : null}
                </strong>
              </h1>

              <div className="flex space-x-4 mt-4">
                <a
                  href="mailto:email@example.com"
                  className="text-blue-500 hover:text-blue-700"
                ></a>

                {Existing && (
                  <button
                    onClick={
                      filteredSuggestions?.NewOrder[0]?.HomemaidId
                        ? openOrder
                        : handleBooking
                    }
                    className="bg-teal-500 text-white py-2 px-4 rounded-lg hover:bg-teal-700"
                  >
                    {filteredSuggestions?.NewOrder[0]?.HomemaidId
                      ? "عرض الطلب"
                      : "حجز"}
                  </button>
                )}

                {filteredSuggestions?.NewOrder[0]?.profileStatus ==
                  "وصول العاملة" ||
                filteredSuggestions?.NewOrder[0]?.profileStatus ? (
                  <div className=" justify-between flex flex-row align-middle gap-2">
                    <button
                      onClick={() =>
                        updateHousingStatus(
                          filteredSuggestions?.id,
                          "بدأت العمل"
                        )
                      }
                      className={`${
                        filteredSuggestions?.NewOrder[0]?.profileStatus ==
                        "بدأت العمل"
                          ? " bg-gray-400 rounded-md p-2 text-white text-md"
                          : "bg-pink-500 rounded-md p-2 text-white text-md"
                      }`}
                      disabled={
                        filteredSuggestions?.NewOrder[0]?.profileStatus ==
                        "بدأت العمل"
                          ? true
                          : false
                      }
                    >
                      بدأت العمل
                    </button>
                    <button
                      onClick={handleOpenModalDeparature}
                      className={`${
                        filteredSuggestions?.NewOrder[0]?.profileStatus ==
                        "مغادرة"
                          ? " bg-gray-400 rounded-md p-2 text-white text-md"
                          : "bg-red-500 rounded-md p-2 text-white text-md"
                      }`}
                    >
                      مغادرة
                    </button>
                    <button
                      className={`${
                        filteredSuggestions?.NewOrder[0]?.profileStatus ==
                        "امتناع عن العمل"
                          ? " bg-gray-400 rounded-md p-2 text-white text-md"
                          : "bg-purple-500 rounded-md p-2 text-white text-md"
                      }`}
                      onClick={() =>
                        updateHousingStatus(
                          filteredSuggestions?.id,
                          "امتناع عن العمل"
                        )
                      }
                    >
                      امتناع
                    </button>
                  </div>
                ) : (
                  ""
                )}
              </div>
            </div>
          </div>

          {/* Experience Section */}
          <div className="mb-8">
            <h2
              className="text-2xl font-semibold text-gray-800 mb-4 flex flex-row align-baseline items-center"
              style={{ color: "brown" }}
            >
              <FaBriefcase /> معلومات
            </h2>
            <div className="mb-4 grid grid-cols-6">
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                تاريخ الميلاد
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.dateofbirth
                  ? filteredSuggestions?.dateofbirth
                  : null}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                الجنسية
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.Nationalitycopy}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                رقم الجواز
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.Passportnumber}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                الحالة الاجتماعية
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.maritalstatus}
              </h3>
            </div>
          </div>

          {/* Qualifications Section */}
          <div className="mb-8">
            <h2
              className="text-2xl font-semibold text-gray-800 mb-4 flex flex-row align-baseline items-center"
              style={{ color: "brown" }}
            >
              <FaGraduationCap /> مؤهلات و خبرات
            </h2>
            <div className="mb-4 grid grid-cols-6">
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                التعليم
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.Education || "بيانات غير متاحة"}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                سنوات الخبرة
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.ExperienceYears || "بيانات غير متاحة"}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                درجة الخبرة
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.experienceType || "بيانات غير متاحة"}
              </h3>
            </div>
          </div>

          {/* Languages Section */}
          <div className="mb-8">
            <h2
              className="text-2xl font-semibold text-gray-800 mb-4 flex flex-row align-baseline items-center"
              style={{ color: "brown" }}
            >
              <FaLanguage /> اللغات
            </h2>
            <div className="mb-4 grid grid-cols-6">
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                اللغة الانجليزية
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.EnglishLanguageLevel ||
                  "بيانات غير متاحة"}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                اللغة العربية
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.ArabicLanguageLevel || "بيانات غير متاحة"}
              </h3>
            </div>
          </div>

          {/* Skills Section */}
          <div className="mb-8">
            <h2
              className="text-2xl font-semibold text-gray-800 mb-4 flex flex-row  items-center"
              style={{ color: "brown" }}
            >
              <FaTools /> المهارات
            </h2>
            <div className="mb-4 grid grid-cols-6">
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                رعاية كبار السن
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.OldPeopleCare || "بيانات غير متاحة"}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                الطبخ
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.CookingLeveL || "بيانات غير متاحة"}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                الغسيل
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.LaundryLeveL || "بيانات غير متاحة"}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                التنظيف
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.CleaningLeveL || "بيانات غير متاحة"}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                الخياطة
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.SewingLeveL || "بيانات غير متاحة"}
              </h3>
            </div>
          </div>

          {/* Logs Section */}
          <div className="mb-8">
            <h2
              className="text-2xl font-semibold text-gray-800 mb-4 flex flex-row align-baseline items-center"
              style={{ color: "brown" }}
            >
              <FaTools /> سجل الأنشطة
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b text-right">المعرف</th>
                    <th className="py-2 px-4 border-b text-right">الحالة</th>
                    <th className="py-2 px-4 border-b text-right">التاريخ</th>
                    <th className="py-2 px-4 border-b text-right">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b text-right">
                          {log.id}
                        </td>
                        <td className="py-2 px-4 border-b text-right">
                          {log.Status || "غير محدد"}
                        </td>
                        <td className="py-2 px-4 border-b text-right">
                          {getDate(log.createdAt)}
                        </td>
                        <td className="py-2 px-4 border-b text-right">
                          {log.notes || "لا توجد ملاحظات"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-2 px-4 border-b text-center text-gray-500"
                      >
                        لا توجد سجلات متاحة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Contact Section */}
          <div className="mb-8">
            <h2
              className="text-2xl font-semibold text-gray-800 mb-4 flex flex-row align-baseline items-center"
              style={{ color: "brown" }}
            >
              <FaPhone /> معلومات الاتصال
            </h2>
            <p className="text-gray-700">{filteredSuggestions.phone}</p>
          </div>
        </div>
      </div>
      <RegistrationModal
        id={homeMaidId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        filteredSuggestions={filteredSuggestions}
      />
      <RegistrationHousingModal
        setDate={() => setDate(Date.now())}
        id={filteredSuggestions?.NewOrder[0]?.id}
        isOpen={isHousingModalOpen}
        onClose={() => setIsHousingModalOpen(false)}
      />
    </Layout>
  );
};

export default ResumePage;
