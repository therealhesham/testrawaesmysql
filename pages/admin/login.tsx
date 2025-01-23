//@ts-nocheck
//@ts-ignore
import { useState } from "react";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup"; // Import Yup for schema validation

// Validation Schema using Yup
const validationSchema = Yup.object({
  email: Yup.string().required("email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function Login() {
  const router = useRouter();

  // Handle form submission
  const handleSubmit = async (values) => {
    // e.preventDefault();
    console.log(values);
    const res = await signIn("credentials", {
      redirect: false,
      // redirect: false, // Prevent automatic redirect
      email: values.email,
      password: values.password,
    });
    console.log(res);

    if (res?.error) {
      alert("Error");
    } else {
      // router.push("/dashboard"); // Redirect to a protected page after successful login
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
        {/* 
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Login
        </h2> */}

        {/* Formik Form with Yup Validation */}
        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {() => (
            <Form>
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <Field
                  type="email"
                  id="email"
                  name="email"
                  className="mt-2 p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your Email"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-xs text-red-500 mt-1"
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
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-xs text-red-500 mt-1"
                />
              </div>

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
