// components/MultiStepForm.js
import Layout from "example/containers/Layout";
import { useState } from "react";
import * as Yup from "yup"; // Import Yup

// Yup validation schema for each step
const validationSchemas = [
  Yup.object().shape({
    name: Yup.string().required("Name is required").min(3, "Name is too short"),
    nationalitycopy: Yup.string().required("Nationality is required"),
    religion: Yup.string().required("Religion is required"),
  }),
  Yup.object().shape({
    passportnumber: Yup.string().required("Passport number is required"),
    clientphonenumber: Yup.string().required("Phone number is required"),
    experience: Yup.string().required("Experience is required"),
  }),
  Yup.object().shape({
    age: Yup.number()
      .required("Age is required")
      .positive("Age must be positive")
      .integer("Age must be an integer"),
    bookingstatus: Yup.string().required("Booking status is required"),
  }),
];

const MultiStepForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    nationalitycopy: "",
    religion: "",
    passportnumber: "",
    clientphonenumber: "",
    experience: "",
    age: "",
    bookingstatus: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = async () => {
    try {
      await validationSchemas[step - 1].validate(formData, {
        abortEarly: false,
      });
      setErrors({});
      return true;
    } catch (error) {
      const validationErrors = error.inner.reduce((acc, curr) => {
        acc[curr.path] = curr.message;
        return acc;
      }, {});
      setErrors(validationErrors);
      return false;
    }
  };

  const nextStep = async () => {
    const isValid = await validateForm();
    if (isValid) {
      setStep((prevStep) => prevStep + 1);
    }
  };

  const prevStep = () => {
    setStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      // await fetch("../e")
      // Handle form submission logic here, e.g., sending data to API or DB
      // Reset the form after successful submission
      setFormData({
        name: "",
        nationalitycopy: "",
        religion: "",
        passportnumber: "",
        clientphonenumber: "",
        experience: "",
        age: "",
        bookingstatus: "",
      });
      setStep(1);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 relative">
        {/* Background image with opacity overlay */}
        {/* <div className="absolute inset-0 bg-cover bg-center" /> */}
        <div className="absolute inset-0 bg-black opacity-50"></div>{" "}
        {/* Semi-transparent black overlay */}
        <div className="relative max-w-3xl w-full bg-white p-8 rounded-lg shadow-lg z-10">
          <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">
            Homemaid Registration Form
          </h2>
          {/* Step Indicator */}
          <div className="flex justify-between mb-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="w-1/3 text-center">
                <div className="text-sm font-semibold text-gray-600">
                  Step {item}
                </div>
                <div
                  className={`w-8 h-8 mx-auto ${
                    step === item
                      ? "bg-orange-500 text-white"
                      : "border-2 border-gray-300"
                  } rounded-full flex items-center justify-center`}
                >
                  {item}
                </div>
              </div>
            ))}
          </div>
          {/* Form Steps */}
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div
                style={{
                  backgroundImage:
                    "url('https://static.wixstatic.com/media/be5035_cacf6ab069084f12a559a37bdb5a33aa~mv2.png/v1/fill/w_1349,h_293,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/be5035_cacf6ab069084f12a559a37bdb5a33aa~mv2.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "repeat",
                }}
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 mt-2 border rounded-md"
                    placeholder="Enter your name"
                    required
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">{errors.name}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600">
                    Nationality
                  </label>
                  <input
                    type="text"
                    name="nationalitycopy"
                    value={formData.nationalitycopy}
                    onChange={handleChange}
                    className="w-full px-4 py-2 mt-2 border rounded-md"
                    placeholder="Enter your nationality"
                    required
                  />
                  {errors.nationalitycopy && (
                    <p className="text-red-500 text-sm">
                      {errors.nationalitycopy}
                    </p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600">
                    Religion
                  </label>
                  <input
                    type="text"
                    name="religion"
                    value={formData.religion}
                    onChange={handleChange}
                    className="w-full px-4 py-2 mt-2 border rounded-md"
                    placeholder="Enter your religion"
                    required
                  />
                  {errors.religion && (
                    <p className="text-red-500 text-sm">{errors.religion}</p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600">
                    Passport Number
                  </label>
                  <input
                    type="text"
                    name="passportnumber"
                    value={formData.passportnumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 mt-2 border rounded-md"
                    placeholder="Enter passport number"
                    required
                  />
                  {errors.passportnumber && (
                    <p className="text-red-500 text-sm">
                      {errors.passportnumber}
                    </p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="clientphonenumber"
                    value={formData.clientphonenumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 mt-2 border rounded-md"
                    placeholder="Enter your phone number"
                    required
                  />
                  {errors.clientphonenumber && (
                    <p className="text-red-500 text-sm">
                      {errors.clientphonenumber}
                    </p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600">
                    Experience
                  </label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full px-4 py-2 mt-2 border rounded-md"
                    placeholder="Describe your experience"
                    required
                  />
                  {errors.experience && (
                    <p className="text-red-500 text-sm">{errors.experience}</p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full px-4 py-2 mt-2 border rounded-md"
                    placeholder="Enter your age"
                    required
                  />
                  {errors.age && (
                    <p className="text-red-500 text-sm">{errors.age}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600">
                    Booking Status
                  </label>
                  <input
                    type="text"
                    name="bookingstatus"
                    value={formData.bookingstatus}
                    onChange={handleChange}
                    className="w-full px-4 py-2 mt-2 border rounded-md"
                    placeholder="Enter booking status"
                    required
                  />
                  {errors.bookingstatus && (
                    <p className="text-red-500 text-sm">
                      {errors.bookingstatus}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md"
                >
                  Previous
                </button>
              )}
              {step < 3 && (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-orange-500 text-white rounded-md"
                >
                  Next
                </button>
              )}
              {step === 3 && (
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-500 text-white rounded-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default MultiStepForm;
