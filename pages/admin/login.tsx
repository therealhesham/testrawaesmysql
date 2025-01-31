//@ts-nocheck
//@ts-ignore
import { useContext, useState } from "react";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { Formik, Field, Form } from "formik"; // Removed ErrorMessage and validationSchema imports
import axios from "axios";
import { User } from "utils/usercontext";
import Cookies from "js-cookie";
export default function Login() {
  const router = useRouter();
  const [error, setError] = useState(null); // For handling errors
  const userContext = useContext(User);
  // Handle form submission
  const handleSubmit = async (values) => {
    const { id, password } = values;
    // userContext.setUser("sss");
    // console.log(userContext.user);

    try {
      const res = await axios.post("/api/login", { id, password });
      localStorage.setItem("token", res.data);
      userContext.setUser(token);
      console.log(res.data);
      // if (res.status == 200) return router.push("/admin/home");

      // Redirect to the dashboard or home page
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
