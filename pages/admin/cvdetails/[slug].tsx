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
} from "react-icons/fa"; // Importing icons
import RegistrationHousingModal from "example/components/registerhousingmodal";
const ResumePage = () => {
  const [filteredSuggestions, setFilteredSuggestions] = useState({
    Housed: [],
    Name: "",
    NewOrder: [],
    Picture: [{ url: "" }],
  });
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

    // alert(submitter.status);
    if (submitter.ok) {
      // alert(submitter.status);
      setDate(Date.now());
      // setSubmitted(true);
      // router.push("/admin/cvdetails/" + router.query.slug);
    }
  };
  // const [profileStatus, setProfileStatus] = useState("");
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
      // router.push("/admin/cvdetails/" + homeMaidId);
      // const url = ;
      setDate(Date.now());
      // window.open(url); // Open in new window
      console.log("Success:", data.message);
    } else {
      console.log("Error:", data.error);
    }
  };
  const handleBooking = () => {
    setIsModalOpen(true); // Open the modal when "حجز" is clicked
  };
  // alert(filteredSuggestions?.NewOrder[0]?.HomemaidId);
  const handleCloseModal = () => {
    setIsModalOpen(false); // Close the modal
  };
  const fetchdata = async (id) => {
    const fetchData = await fetch("/api/findcvprisma/" + id, {
      cache: "default",
    });
    const parser = await fetchData.json();
    setExisting(true);
    console.log(parser);
    setFilteredSuggestions(parser);
    fetchImageDate(parser.Name);
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
    sethomeMaidId(router.query.slug);
  }, [router.query.slug]);
  useEffect(() => {
    // if (!router.query.slug) return;
    fetchdata(router.query.slug);
    // sethomeMaidId(router.query.slug);
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
    console.log("Input Value:", inputValue); // Here you can process the input value
    // Add your logic to handle the submitted value
  };
  const ReRender = () => {
    setDate(Date.now());
  };
  // Book
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
          {/* Booking Button */}
          {/* <div className="relative flex flex-column">
            {filteredSuggestions?.NewOrder[0]?.HomemaidId && (
              <div className="absolute top-5 grid grid-cols-1 text-center left-5 bg-transparent text-purple-600  font-bold w-60 h-32 items-center justify-center  z-10">
                <span className="text-xl">تغيير حالة العاملة</span>
                <select
                  onChange={handleChangeProfile}
                  className="rounded-md"
                  // name="externalOfficeStatus"
                  // ref={externalOfficeStatus}
                  // id="externalOfficeStatus"
                >
                  <option value=""></option>

                  <option value="وصول العاملة">وصول العاملة</option>
                  <option value="مغادرة العاملة"> مغادرة العاملة</option>

                  <option value="تسكين">تسكين</option>
                  <option value="امتناع عن العمل">امتناع عن العمل</option>
                </select>
              </div>
            )}
          </div> */}
          {/* Header Section */}
          <div className="flex items-center mb-8 gap-5">
            {/* Profile Image */}
            <img
              src={image}
              alt="Profile"
              className="w-32 h-32 rounded-lg border-4 border-bg-[#3D4C73] mr-6"
            />
            {/* Profile Details */}
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
                >
                  {/* <FaEnvelope /> Email Icon */}
                </a>

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
                  <div
                    // style={{ display: "flex", flexDirection: "row" }}
                    className=" justify-between flex flex-row align-middle gap-2"
                  >
                    <button
                      onClick={() =>
                        updateHousingStatus(
                          filteredSuggestions?.id,
                          "بدأت العمل"
                        )
                      }
                      className={`                ${
                        filteredSuggestions?.NewOrder[0]?.profileStatus ==
                        "بدأت العمل"
                          ? " bg-gray-400 rounded-md p-2 text-white text-md"
                          : "bg-pink-500 rounded-md p-2 text-white text-md"
                      }  `}
                      disabled={
                        filteredSuggestions?.NewOrder[0]?.profileStatus ==
                        "بدأت العمل"
                          ? true
                          : false
                      }
                      // className="bg-yellow-500 rounded-md p-2 text-white text-md"
                    >
                      بدأت العمل
                    </button>
                    {/* 
                    <button
                      onClick={
                        () => setIsHousingModalOpen(true)
                        // updateHousingStatus(filteredSuggestions?.id, "تسكين")
                      }
                      className={`                ${
                        filteredSuggestions?.NewOrder[0]?.profileStatus ==
                        "تسكين"
                          ? " bg-gray-400 rounded-md p-2 text-white text-md"
                          : "bg-orange-400 rounded-md p-2 text-white text-md"
                      }  `}
                      disabled={
                        filteredSuggestions?.NewOrder[0]?.profileStatus ==
                        "تسكين"
                          ? true
                          : false
                      }
                      // className="bg-yellow-500 rounded-md p-2 text-white text-md"
                    >
                      تسكين
                    </button> */}
                    <button
                      onClick={handleOpenModalDeparature}
                      className={`                ${
                        filteredSuggestions?.NewOrder[0]?.profileStatus ==
                        "مغادرة"
                          ? " bg-gray-400 rounded-md p-2 text-white text-md"
                          : "bg-red-500 rounded-md p-2 text-white text-md"
                      }  `}
                    >
                      مغادرة
                    </button>
                    <button
                      className={`                ${
                        filteredSuggestions?.NewOrder[0]?.profileStatus ==
                        "امتناع عن العمل"
                          ? " bg-gray-400 rounded-md p-2 text-white text-md"
                          : "bg-purple-500 rounded-md p-2 text-white text-md"
                      }  `}
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

                {/* <div className="flex flex-row gap-2">
                 
                  {filteredSuggestions?.Housed[0] && (
                    <button
                      onClick={() => {
                        updateHousingStatus(Number(router.query.slug));
                      }}
                      className="bg-purple-500  text-white py-2 px-4 rounded-lg hover:bg-teal-700"
                    >
                      {"تسكين"}
                    </button>
                  )}
                </div>
              </div> */}
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
                  ? getDate(filteredSuggestions?.dateofbirth)
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
                {filteredSuggestions?.CookingLevel || "بيانات غير متاحة"}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                الغسيل
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.LaundryLevel || "بيانات غير متاحة"}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                التنظيف
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.CleaningLevel || "بيانات غير متاحة"}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                الخياطة
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.SewingLevel || "بيانات غير متاحة"}
              </h3>
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
