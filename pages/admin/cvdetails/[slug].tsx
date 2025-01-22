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
    console.log(parser);
    // setFilteredSuggestions(parser);
  };
  useEffect(() => {
    fetchdata(router.query.slug);
  }, [router.query.slug]);

  return (
    <Layout>
      <div className="bg-gray-100 min-h-screen py-12 px-6">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          {/* Header Section */}
          <div className="flex flex-col items-center mb-8">
            <img
              src="/profile.jpg" // Replace with your profile image URL
              alt="Profile"
              className="w-32 h-32 rounded-full border-4 border-blue-500 mb-4"
            />
            <h1 className="text-3xl font-bold text-gray-800">
              {filteredSuggestions.Name}
            </h1>
            <p className="text-gray-600 text-lg">
              {filteredSuggestions.ExperienceYears}
            </p>
            <div className="flex space-x-4 mt-4">
              <a
                href="mailto:email@example.com"
                className="text-blue-500 hover:text-blue-700"
              >
                {/* Email */}
              </a>
            </div>
          </div>

          {/* Experience Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">info</h2>
            <div>
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Birth Date :{filteredSuggestions.dateofbirth}
                </h3>
                <h3 className="text-xl font-semibold text-gray-800">
                  Nationality :{filteredSuggestions.Nationalitycopy}
                </h3>
                <h3 className="text-xl font-semibold text-gray-800">
                  Passport Number :{filteredSuggestions.Passportnumber}
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
              Education
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
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Skills
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm"></div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Contact
            </h2>
            <p className="text-gray-700">{filteredSuggestions.phone}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResumePage;
