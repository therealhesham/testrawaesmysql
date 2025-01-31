import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "example/containers/Layout";

interface Admin {
  id: number;
  username: string;
  role: string;
  pictureurl: string;
  phonenumber: string;
}

export default function AdminPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [newAdmin, setNewAdmin] = useState({
    username: "",
    password: "",
    pictureurl: "",
    idnumber: "",
    role: "",
    phonenumber: "",
  });

  const [image, setImage] = useState(""); // State to hold image URL from Cloudinary
  const [uploadStatus, setUploadStatus] = useState<string>(""); // State for upload status

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
        setUploadStatus("Image uploaded successfully!"); // Success message
      } catch (error) {
        console.error("Image upload error:", error);
        setUploadStatus("Error uploading image. Please try again."); // Error message
      }
    }
  };

  // Fetch all admins when the page loads
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const res = await axios.get("/api/addadmin"); // Your GET endpoint to fetch admins
        setAdmins(res.data);
      } catch (error) {
        console.error("Error fetching admins", error);
      }
    };
    fetchAdmins();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAdmin((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission to add a new admin
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/addadmin", newAdmin); // Your POST endpoint to create an admin
      setAdmins((prevAdmins) => [...prevAdmins, res.data]);
      setNewAdmin({
        username: "",
        password: "",
        pictureurl: image,
        idnumber: "",
        role: "viewer",
        phonenumber: "",
      });
    } catch (error) {
      console.error("Error adding admin", error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Manage Admins</h1>

        {/* Admin List */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Admins</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left">ID</th>
                  <th className="p-4 text-left">Username</th>
                  <th className="p-4 text-left">Role</th>
                  <th className="p-4 text-left">Phone Number</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b">
                    <td className="p-4">{admin.id}</td>
                    <td className="p-4">{admin.username}</td>
                    <td className="p-4">{admin.role}</td>
                    <td className="p-4">{admin.phonenumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add New Admin Form */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Add New Admin</h2>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <input
              type="text"
              name="username"
              value={newAdmin.username}
              onChange={handleInputChange}
              placeholder="Username"
              className="w-full p-2 border border-gray-300 rounded"
            />
            <input
              type="password"
              name="password"
              value={newAdmin.password}
              onChange={handleInputChange}
              placeholder="Password"
              className="w-full p-2 border border-gray-300 rounded"
            />

            <input
              type="number"
              name="idnumber"
              value={newAdmin.idnumber}
              onChange={handleInputChange}
              placeholder="ID Number"
              className="w-full p-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              name="role"
              value={newAdmin.role}
              onChange={handleInputChange}
              placeholder="Role"
              className="w-full p-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              name="phonenumber"
              value={newAdmin.phonenumber}
              onChange={handleInputChange}
              placeholder="Phone Number"
              className="w-full p-2 border border-gray-300 rounded"
            />

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

            <button
              type="submit"
              className="w-full p-2 bg-blue-500 text-white rounded"
            >
              Add Admin
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
