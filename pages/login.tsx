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
              className="animate-spin h-10 w-10 text-blue-500 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-lg font-semibold text-blue-600">Logging in...</span>
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
                  className="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
              </div>
              {error && (
                <div className="text-xs text-red-500 mb-4">{error}</div>
              )}
              {/* Display error */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        <div className="mt-6 text-center">
          <a
            href="/forgot-password"
            className="text-sm text-blue-500 hover:underline"
          >
            Forgot Password?
          </a>
        </div>

        <div className="mt-4 text-center">
          <span className="text-sm text-gray-600">Don't have an account?</span>
          <a
            href="/admin/signup"
            className="text-sm text-blue-500 hover:underline"
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}
