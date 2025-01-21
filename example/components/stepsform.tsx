//@ts-nocheck
//@ts-ignore
import React, { useState } from "react";
import { Formik, Field, Form, ErrorMessage, useField } from "formik";
import * as Yup from "yup";
import Layout from "example/containers/Layout";
import { useRouter } from "next/router";

const TimeLinedForm = ({
  name,
  email,
  phone,
  address,
  city,
  query,
  setChildQuery,
}) => {
  const [step, setStep] = useState(1);
  const [Query, setQuery] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState({
    Name: "",
    Picture: [{ url: "" }],
  });
  const router = useRouter();
  const handleNextStep = () => {
    console.log(validationSchemaStep1);
    if (step < 4) setStep(step + 1);
  };
  const [picture, setPicture] = useState({});
  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const fetchdata = async (id) => {
    const fetchData = await fetch("/api/findcvprisma/" + id, {
      cache: "default",
    });
    const parser = await fetchData.json();
    console.log(parser);
    setFilteredSuggestions(parser);
  };
  const handleChange = (event) => {
    const value = query;
    setQuery(query);
    if (query > 0) {
      fetchdata(query);
    } else {
      setFilteredSuggestions({});
    }
  };

  const validationSchemaStep1 = Yup.object({
    name: Yup.string().required("Name is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    phone: Yup.string().required("Phone number is required"),
  });

  const validationSchemaStep2 = Yup.object({
    address: Yup.string().required("Address is required"),
    city: Yup.string().required("City is required"),
  });

  const validationSchemaStep3 = Yup.object({
    // Query: Yup.string().required("Please select a suggestion"),
  });

  return (
    <div className="flex justify-center items-center py-12">
      <div className="flex w-full max-w-4xl bg-white shadow-lg rounded-lg">
        {/* Left side: Timeline */}
        <div className="w-1/3 border-r border-gray-200">
          <div className="flex flex-col items-center py-8">
            <div className={`step ${step >= 1 ? "active" : ""}`}>
              <div className="step-number">1</div>
              <div className="step-title">Step 1</div>
            </div>
            <div className={`step ${step >= 2 ? "active" : ""}`}>
              <div className="step-number">2</div>
              <div className="step-title">Step 2</div>
            </div>
            <div className={`step ${step >= 3 ? "active" : ""}`}>
              <div className="step-number">3</div>
              <div className="step-title">Step 3</div>
            </div>
          </div>
        </div>

        {/* Right side: Form */}
        <div className="w-2/3 p-8">
          <Formik
            initialValues={{
              name,
              email,
              phone,
              address,
              city,
              query: Query,
            }}
            validationSchema={
              step === 1
                ? validationSchemaStep1
                : step === 2
                ? validationSchemaStep2
                : step === 3
                ? validationSchemaStep3
                : null
            }
            onSubmit={(values) => {
              if (step === 4) {
                console.log({
                  ...values,

                  HomemaidId: filteredSuggestions.id,
                  age: filteredSuggestions.age,
                  clientphonenumber: props.phone,
                  Name: filteredSuggestions.Name,
                  Passportnumber: filteredSuggestions.Passportnumber,
                  maritalstatus: filteredSuggestions.maritalstatus,
                  Nationality: filteredSuggestions.Nationality,
                  Religion: filteredSuggestions.Religion,
                  ExperienceYears: filteredSuggestions.ExperienceYears,
                });
                const submit = async () => {
                  const fetchData = await fetch("/api/submitneworderprisma/", {
                    body: JSON.stringify({
                      ...values,

                      ClientName: values.name,
                      HomemaidId: filteredSuggestions.id,

                      age: filteredSuggestions.age,
                      clientphonenumber: filteredSuggestions.PhoneNumber,
                      PhoneNumber: values.phone,
                      Passportnumber: filteredSuggestions.Passportnumber,
                      maritalstatus: filteredSuggestions.maritalstatus,
                      Nationality: filteredSuggestions.Nationality,
                      Religion: filteredSuggestions.Religion,
                      ExperienceYears: filteredSuggestions.ExperienceYears,
                    }),
                    method: "post",
                    headers: {
                      Accept: "application/json",
                      "Content-Type": "application/json",
                    },
                    cache: "default",
                  });

                  if (fetchData.status == 200) {
                    router.push("./home");
                  }
                };

                submit();
                // Handle form submission
                console.log(values);
                console.log("Form submitted with values: ", values);
              } else {
                handleNextStep();
              }
            }}
          >
            {({ setFieldValue }) => (
              <Form>
                {/* Step 1: Personal Information */}
                {step === 1 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">
                      Personal Information
                    </h2>
                    <div className="mb-4">
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Client Name
                      </label>
                      <Field
                        id="name"
                        name="name"
                        type="text"
                        // onChange={(e) => setName(e.target.value)}
                        className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                        placeholder="Enter your name"
                      />
                      <ErrorMessage
                        name="name"
                        component="div"
                        className="text-red-500 text-sm"
                      />
                    </div>
                    <div className="mb-4">
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email
                      </label>
                      <Field
                        id="email"
                        name="email"
                        type="email"
                        className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                        placeholder="Enter your email"
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="text-red-500 text-sm"
                      />
                    </div>
                    <div className="mb-4">
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Phone Number
                      </label>
                      <Field
                        id="phone"
                        name="phone"
                        type="tel"
                        className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                        placeholder="Client Phone Number"
                      />
                      <ErrorMessage
                        name="phone"
                        component="div"
                        className="text-red-500 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Address Information */}
                {step === 2 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">
                      Address Information
                    </h2>
                    <div className="mb-4">
                      <label
                        htmlFor="address"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Address
                      </label>
                      <Field
                        id="address"
                        name="address"
                        type="text"
                        className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                        placeholder="Enter your address"
                      />
                      <ErrorMessage
                        name="address"
                        component="div"
                        className="text-red-500 text-sm"
                      />
                    </div>
                    <div className="mb-4">
                      <label
                        htmlFor="city"
                        className="block text-sm font-medium text-gray-700"
                      >
                        City
                      </label>
                      <Field
                        id="city"
                        name="city"
                        type="text"
                        className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                        placeholder="Enter your city"
                      />
                      <ErrorMessage
                        name="city"
                        component="div"
                        className="text-red-500 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Query Search */}
                {step === 3 && (
                  <div className="relative w-72 mx-auto">
                    <Field
                      id="query"
                      name="query"
                      type="text"
                      value={query}
                      onChange={() => setQuery(query)}
                      placeholder="Search "
                      className="px-4 py-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <ErrorMessage
                      name="query"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                    <div>
                      <div className="max-w-sm w-full bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl transform transition-all duration-300 ease-in-out hover:scale-105">
                        {/* Image Section */}
                        {/* <img
                            src="https://via.placeholder.com/400x250"
                            alt="Info Card"
                            className="w-full h-48 object-cover"
                          /> */}

                        {/* Card Content */}
                        <div className="p-6">
                          {/* Title */}
                          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                            {filteredSuggestions.Name}
                          </h2>

                          {/* Description */}
                          <h2 className="text-gray-600 text-sm mb-6">
                            Passport Number :
                            {filteredSuggestions.Passportnumber}
                          </h2>

                          {/* Action Button */}
                          <button
                            onClick={() => {
                              setFieldValue("query", filteredSuggestions.Name);
                              setChildQuery(query);
                            }}
                            className="bg-teal-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-teal-600 hover:shadow-lg focus:outline-none transition-all duration-200 ease-in-out"
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Review & Submit */}
                {step === 4 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">
                      Review & Submit
                    </h2>
                    {/* Client Name : {validationSchemaStep1.json().fields.name.}
                      Client Phone : {validationSchemaStep1.json().fields.phone}
                      Email : {validationSchemaStep1.json().fields.email} */}
                    Full Name : {filteredSuggestions.Name}
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md"
                  >
                    Previous
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500  text-white rounded-md"
                  >
                    {step === 4 ? "Submit" : "Next"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default TimeLinedForm;
