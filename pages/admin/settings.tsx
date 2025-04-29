import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "example/containers/Layout";

import { jwtDecode } from "jwt-decode";
import axios from "axios";
export default function Settings() {
  const router = useRouter();
  const [uploadStatus, setUploadStatus] = useState<string>(""); // State for upload status
  const [image, setImage] = useState(""); // State to hold image URL from Cloudinary

  const [user, setUser] = useState({
    username: "",
    phonenumber: "",
    pictureurl: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files && e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "z8q1vykv"); // Cloudinary preset
      formData.append("cloud_name", "duo8svqci");
      formData.append("folder", "samples");

      try {
        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/duo8svqci/image/upload`,
          formData
        );
        setImage(response.data.secure_url); // Set the Cloudinary URL for the image
        setUser((prev) => ({ ...prev, pictureurl: response.data.secure_url })); // Update user state
        setUploadStatus("Image uploaded successfully!"); // Success message
      } catch (error) {
        console.error("Image upload error:", error);
        setUploadStatus("Error uploading image. Please try again."); // Error message
      }
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!localStorage.getItem("token")) router.push("/admin/login");
        const token = localStorage.getItem("token");
        const info = jwtDecode(token);

        const response = await fetch(`/api/users/${info?.username}`);
        if (!response.ok) {
          throw new Error("فشل في جلب بيانات المستخدم");
        }
        const data = await response.json();
        setUser({
          // id: data.id,
          phonenumber: data.phonenumber ? data.phonenumber : "",
          pictureurl: data.pictureurl ? data.pictureurl : "",
          username: data.username || "",
          // password: '',
          // role: data.role || '',
          // idnumber: data.idnumber || '',
        });
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        router.push("/admin/login");
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/users/${user.username}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      if (!response.ok) {
        throw new Error("فشل في تحديث البيانات");
      }

      setSuccess("تم تحديث البيانات بنجاح");
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        جاري التحميل...
      </div>
    );
  }

  return (
    <Layout>
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Head>
        <title>إعدادات المستخدم</title>
      </Head>
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">
          إعدادات المستخدم
        </h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              رقم الهاتف
            </label>
            <input
              type="text"
              name="phonenumber"
              value={user.phonenumber}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Upload Profile Picture
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadImage}
              className="w-full p-2 border border-gray-300 rounded"
            />
            {uploadStatus && (
              <p
                className={`mt-2 text-sm ${
                  uploadStatus.includes("Error")
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              >
                {uploadStatus}
              </p>
            )}
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-gray-700">
              كلمة المرور
            </label>
            <input
              type="password"
              name="password"
              value={user.password}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="أدخل كلمة مرور جديدة (اختياري)"
            />
          </div>
       */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition"
          >
            حفظ التغييرات
          </button>
        </form>
      </div>
    </div>
 </Layout>
  );

}
