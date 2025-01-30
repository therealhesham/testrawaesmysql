//@ts-nocheck
//@ts-ignore
import { useState } from "react";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { Formik, Field, Form } from "formik"; // Removed ErrorMessage and validationSchema imports
import axios from "axios";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState(null); // For handling errors

  // Handle form submission
  const handleSubmit = async (values) => {
    const { username, password } = values;
    try {
      const res = await axios.post("/api/login", { username, password });
      const { token } = res.data;

      // Store the JWT token in localStorage (or you can use cookies)
      localStorage.setItem("token", token);

      // Redirect to the dashboard or home page
      router.push("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        {/* Logo Section */}
        <div className="flex justify-center mb-6">
          <img
            src="/assets/img/rpng.png" // Correct image path
            alt="Logo"
            className="w-24 h-auto"
          />
        </div>

        {/* Formik Form without Validation */}
        <Formik
          initialValues={{ username: "", password: "" }}
          onSubmit={handleSubmit}
        >
          {() => (
            <Form>
              <div className="mb-4">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Username Address
                </label>
                <Field
                  type="text"
                  id="username"
                  name="username"
                  className="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your username"
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
              )}{" "}
              {/* Display error */}
              <button
                type="submit"
                className="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Login
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
