// AddAdminModal.tsx

import { useState } from "react";
import { Dialog } from "@headlessui/react"; // For modal functionality
import { XIcon } from "@heroicons/react/outline"; // Close icon

const AddAdminModal = ({
  isOpen,
  closeModal,
  handleUpload,
  image,
  addAdmin,
}) => {
  // State for the form fields
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    phonenumber: "",
    role: "قسم الاستقدام", // Default role
    idnumber: "",
  });

  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // For previewing the selected image

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image" && files.length > 0) {
      const file = files[0];
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
      setImagePreview(URL.createObjectURL(file)); // Set the image preview
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.phonenumber) {
      setError("Please fill in all required fields.");
      return;
    }

    const adminData = {
      username: formData.username,
      password: formData.password,
      phonenumber: formData.phonenumber,
      role: formData.role,
      idnumber: formData.idnumber,
    };

    // Pass admin data and image URL to parent component
    addAdmin(adminData);

    // Reset form data and close the modal
    setFormData({
      username: "",
      password: "",
      phonenumber: "",
      role: "قسم الاستقدام",
      idnumber: "",
    });
    setImagePreview(null); // Reset image preview
    closeModal();
  };

  return (
    <Dialog open={isOpen} onClose={closeModal}>
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <Dialog.Overlay className="fixed inset-0 bg-gray-500 opacity-75" />

        <div className="relative bg-white rounded-lg w-96 p-6 shadow-lg z-10">
          <button
            onClick={closeModal}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            aria-label="Close Modal"
          >
            <XIcon className="h-6 w-6" />
          </button>

          <h2 className="text-2xl font-semibold mb-4">Add New Admin</h2>
          {error && <div className="text-red-600 mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div className="mb-4">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Phone Number */}
            <div className="mb-4">
              <label
                htmlFor="phonenumber"
                className="block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>
              <input
                type="text"
                id="phonenumber"
                name="phonenumber"
                value={formData.phonenumber}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Role */}
            <div className="mb-4">
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700"
              >
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="قسم الاستقدام">قسم الاستقدام</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Moderator">Moderator</option>
                <option value="Editor">Editor</option>
              </select>
            </div>

            {/* ID Number (Optional) */}
            <div className="mb-4">
              <label
                htmlFor="idnumber"
                className="block text-sm font-medium text-gray-700"
              >
                ID Number (Optional)
              </label>
              <input
                type="text"
                id="idnumber"
                name="idnumber"
                value={formData.idnumber}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Profile Image Upload */}
            <div className="mb-4">
              <label
                htmlFor="image"
                className="block text-sm font-medium text-gray-700"
              >
                Profile Image
              </label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleUpload}
                className="mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {image && (
                <div className="mt-2">
                  <img
                    src={image}
                    alt="Profile Preview"
                    className="w-24 h-24 object-cover rounded-full"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
              >
                Add Admin
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
};

export default AddAdminModal;
