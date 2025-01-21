//@ts-nocheck
//@ts-ignore

import { useState } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/outline";
import AddAdminModal from "components/AddAdminModal";
import Layout from "example/containers/Layout";
const AdminsPage = () => {
  const [admins, setAdmins] = useState([
    { id: 1, name: "", role: "مدير", authorized: true },
    { id: 2, name: "", role: "مستلم", authorized: true },
    { id: 3, name: "", role: "محرر", authorized: false },
    { id: 4, name: "", role: "مُستعرض", authorized: true },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility

  // Function to open the modal
  const handleAddAdmin = () => {
    setIsModalOpen(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Function to handle adding a new admin
  const addAdmin = (newAdmin) => {
    setAdmins((prev) => [
      ...prev,
      { ...newAdmin, id: admins.length + 1, authorized: true },
    ]);
    console.log("New admin added:", newAdmin);
  };

  // Function to handle edit
  const handleEditAdmin = (id) => {
    alert(`Edit admin with ID: ${id}`);
  };

  // Function to handle delete
  const handleDeleteAdmin = (id) => {
    setAdmins(admins.filter((admin) => admin.id !== id));
    alert(`Deleted admin with ID: ${id}`);
  };

  return (
    <Layout>
      <div className="min-h-screen  p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">
            Admins Management
          </h2>
          <button
            onClick={handleAddAdmin}
            className="px-6 py-2 bg-yellow-200 text-white rounded-lg hover:bg-yellow-500"
          >
            Add New Admin
          </button>
        </div>

        {/* Admin list/table here... */}
        <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Authorization
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-t">
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {admin.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {admin.role}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        admin.authorized
                          ? "bg-green-200 text-green-800"
                          : "bg-red-200 text-red-800"
                      }`}
                    >
                      {admin.authorized ? "Authorized" : "Not Authorized"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleEditAdmin(admin.id)}
                      className="text-blue-500 hover:text-blue-700 mr-2"
                      aria-label="Edit Admin"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="text-red-500 hover:text-red-700"
                      aria-label="Delete Admin"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Admin Modal */}
        <AddAdminModal
          isOpen={isModalOpen}
          closeModal={closeModal}
          addAdmin={addAdmin}
        />
      </div>
    </Layout>
  );
};

export default AdminsPage;
