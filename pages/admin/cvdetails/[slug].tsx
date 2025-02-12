//@ts-nocheck
//@ts-ignore
// pages/resume.tsx
import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
const ResumePage = () => {
  const [filteredSuggestions, setFilteredSuggestions] = useState({
    Name: "",
    Picture: [{ url: "" }],
  });
  const [image, setImage] = useState("");
  const [query, setQuery] = useState("");
  const router = useRouter();
  const fetchdata = async (id) => {
    const fetchData = await fetch("/api/findcvprisma/" + id, {
      cache: "default",
    });
    const parser = await fetchData.json();
    console.log(parser);
    setFilteredSuggestions(parser);
    fetchImageDate(filteredSuggestions.Name);
  };
  const fetchImageDate = async (name) => {
    const fetchData = await fetch("/api/getimagefromprisma/" + name, {
      // cache: "default",
      method: "get",
    });
    const parser = await fetchData.json();
    // console.log(parser);
    setImage(parser.result);
  };
  useEffect(() => {
    fetchdata(router.query.slug);
  }, [router.query.slug]);
  function getDate(date) {
    const currentDate = new Date(date); // Original date
    const form = currentDate.toISOString().split("T")[0];
    console.log(currentDate);
    return form;
  }
  return (
    <Layout>
      <div className="bg-gray-100 min-h-screen py-12 px-6" dir="rtl">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          {/* Header Section */}
          <div className="flex items-center mb-8 gap-5">
            {/* Profile Image */}
            <img
              src={image} // Replace with your profile image URL
              alt="Profile"
              className="w-32 h-32 rounded-lg border-4 border-bg-[#3D4C73] mr-6" // squared image on the left
            />
            {/* Profile Details */}
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {filteredSuggestions?.Name}
              </h1>

              <div className="flex space-x-4 mt-4">
                <a
                  href="mailto:email@example.com"
                  className="text-blue-500 hover:text-blue-700"
                >
                  {/* Email */}
                </a>
              </div>
            </div>
          </div>

          {/* Experience Section */}
          <div className="mb-8">
            <h2
              className="text-2xl font-semibold text-gray-800 mb-4"
              style={{ color: "brown" }}
            >
              معلومات
            </h2>
            <div>
              <div className="mb-4 grid grid-cols-5">
                <h3 className="text-xl font-semibold col-span-1 col-start-1 col-end-2 text-gray-800">
                  تاريخ الميلاد
                </h3>
                <h3 className="col-span-3">
                  {filteredSuggestions?.dateofbirth
                    ? getDate(filteredSuggestions?.dateofbirth)
                    : null}
                </h3>

                <h3 className="text-xl font-semibold col-span-1 col-start-1 col-end-2 text-gray-800">
                  الجنسية
                </h3>
                <h3 className="col-span-3">
                  {filteredSuggestions?.Nationalitycopy}
                </h3>
                <h3 className="text-xl font-semibold col-span-1 col-start-1 col-end-2 text-gray-800">
                  رقم الجواز
                </h3>

                <h3 className="col-span-3">
                  {filteredSuggestions?.Passportnumber}
                </h3>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800"></h3>
                <p className="text-gray-600"></p>
                <ul className="list-disc ml-6 text-gray-700 mt-2">
                  <li></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Education Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              التعليم
            </h2>
            <div>
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800"></h3>
                <p className="text-gray-600"></p>
                <p className="text-gray-700 mt-2"></p>
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="mb-4 grid grid-cols-5">
            <h3 className="text-xl font-semibold col-span-1 col-start-1 col-end-2 text-gray-800">
              سنوات الخبرة
            </h3>
            <h3 className="col-span-3">
              {filteredSuggestions?.ExperienceYears}
            </h3>
          </div>

          <div className="mb-4 grid grid-cols-5">
            <h3 className="text-xl font-semibold col-span-1 col-start-1 col-end-2 text-gray-800">
              الحالة الاجتماعية
            </h3>
            <h3 className="col-span-3">{filteredSuggestions?.maritalstatus}</h3>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              المهارات
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm">
                {filteredSuggestions.skills}
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              معلومات الاتصال
            </h2>
            <p className="text-gray-700">{filteredSuggestions.phone}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResumePage;
