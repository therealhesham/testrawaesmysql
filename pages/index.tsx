//@ts-nocheck
//@ts-ignore
import { useContext, useState } from "react";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { Formik, Field, Form } from "formik";
import axios from "axios";
import { User } from "utils/usercontext";
import Cookies from "js-cookie";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState(null); // For handling errors
  const [loading, setLoading] = useState(false); // Loading state
  const userContext = useContext(User);

  // Handle form submission
  const handleSubmit = async (values) => {
    const { id, password } = values;
    setLoading(true); // Start loading when form is submitted

    try {
      const res = await axios.post("/api/login", { id, password });
      localStorage.setItem("token", res.data);
      if (res.status === 200) {
        router.push("/admin/personal_page");
      }
    } catch (err) {
      setError(err.response?.data?.message || "error");
    } finally {
      setLoading(false); // Stop loading once the request is complete
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center relative">
      {/* Loading Modal */}
      {loading && (
        <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center">
            <svg
              className="animate-spin h-8 w-8 text-teal-900"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 1 1 8 8 8 8 0 0 1-8-8z"
              ></path>
            </svg>
            <span className="ml-4 text-lg font-semibold text-teal-900">
              Logging in...
            </span>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        {/* Logo Section */}
        <div className="flex justify-center mb-6">
          <img
            src="/assets/img/rpng.png" // Correct image path
            alt="Logo"
            className="w-24 h-auto"
          />
        </div>

        {/* Formik Form */}
        <Formik
          initialValues={{ id: "", password: "" }}
          onSubmit={handleSubmit}
        >
          {() => (
            <Form>
              <div className="mb-4">
                <label
                  htmlFor="id"
                  className="block text-sm font-medium text-gray-700"
                >
                  ID
                </label>
                <Field
                  type="text"
                  id="id"
                  name="id"
                  className="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-900"
                  placeholder="Enter your id"
                />
              </div>
              <div className="mb-6">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <Field
                  type="password"
                  id="password"
                  name="password"
                  className="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-900"
                  placeholder="Enter your password"
                />
              </div>
              {error && (
                <div className="text-xs text-red-500 mb-4">{error}</div>
              )}
              {/* Display error */}
              <button
                type="submit"
                className="w-full py-3 bg-teal-900 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-teal-900"
              >
                Login
              </button>
            </Form>
          )}
        </Formik>

      </div>
    </div>
  );
}
