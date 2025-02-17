//@ts-nocheck
//@ts-ignore
// pages/resume.tsx
import RegistrationModal from "example/components/registrationmodal";
import Layout from "example/containers/Layout";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
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

  function getDate(date) {
    const currentDate = new Date(date);
    const form = currentDate.toISOString().split("T")[0];
    return form;
  }

  // Book
  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-12 px-6" dir="rtl">
        <div style={{ left: "90%" }} className=" top-5"></div>

        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          {/* Booking Button */}
          <div className="relative">
            {filteredSuggestions?.Housed[0]?.isHoused && (
              <div className="absolute top-5 left-5 bg-transparent text-purple-600 text-center font-bold w-32 h-32 flex items-center justify-center rounded-full border-4 border-purple-600 z-10">
                <span className="text-xl">تم التسكين</span>
              </div>
            )}
          </div>
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
                {filteredSuggestions?.Education || "Not Available"}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                سنوات الخبرة
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.ExperienceYears || "Not Available"}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                درجة الخبرة
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.experienceType || "Not Available"}
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
                {filteredSuggestions?.EnglishLanguageLevel || "Not Available"}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                اللغة العربية
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.ArabicLanguageLevel || "Not Available"}
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
                {filteredSuggestions?.OldPeopleCare || "Not Available"}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                الطبخ
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.CookingLevel || "Not Available"}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                الغسيل
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.LaundryLevel || "Not Available"}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                التنظيف
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.CleaningLevel || "Not Available"}
              </h3>
              <h3 className="text-xl font-semibold col-span-1 text-gray-800">
                الخياطة
              </h3>
              <h3 className="col-span-4 col-start-3">
                {filteredSuggestions?.SewingLevel || "Not Available"}
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
    </Layout>
  );
};

export default ResumePage;
