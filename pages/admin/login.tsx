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
        router.push("/admin/home");
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
        <div className="absolute inset-0 bg-gray-500/50 flex justify-center items-center z-50 backdrop-blur-[2px]">
          <div className="bg-white p-6 rounded-xl shadow-xl flex items-center gap-4">
            <svg
              className="animate-spin h-10 w-10 text-teal-700 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-lg font-semibold text-teal-800">Logging in...</span>
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
          validate={(values) => {
            const errors = {};
            
            // Validate ID field
            if (!values.id) {
              errors.id = "ID is required";
            } else if (values.id.length < 3) {
              errors.id = "ID must be at least 3 characters";
            }
            
            // Validate Password field
            // if (!values.password) {
            //   errors.password = "Password is required";
            // } else if (values.password.length < 6) {
            //   errors.password = "Password must be at least 6 characters";
            // }
            
            return errors;
          }}
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
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
                  className={`mt-2 p-3 w-full border rounded-lg focus:ring-2 focus:ring-teal-900 ${
                    errors.id && touched.id
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter your id"
                />
                {errors.id && touched.id && (
                  <div className="text-xs text-red-500 mt-1">{errors.id}</div>
                )}
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
                  className={`mt-2 p-3 w-full border rounded-lg focus:ring-2 focus:ring-teal-900 ${
                    errors.password && touched.password
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter your password"
                />
                {errors.password && touched.password && (
                  <div className="text-xs text-red-500 mt-1">{errors.password}</div>
                )}
              </div>
              {error && (
                <div className="text-sm text-red-500 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}
              {/* Display error */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-teal-900 text-white font-semibold rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-900 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Logging in...</span>
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </Form>
          )}
        </Formik>

      </div>
    </div>
  );
}
