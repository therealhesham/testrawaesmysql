import { useState, useEffect } from "react";
import Head from "next/head";
import Layout from "example/containers/Layout";
import { PencilIcon, TrashIcon } from "@heroicons/react/solid"; // Import Heroicons

export default function EmailAdmin() {
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editEmail, setEditEmail] = useState(null);

  useEffect(() => {
    fetchEmails();
  }, []);

  useEffect(() => {
    if (searchUser.trim() === "") {
      setUserSuggestions([]);
      return;
    }
    fetchUsers();
  }, [searchUser]);

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/addEmails");
      if (!response.ok) throw new Error("Failed to fetch emails");
      const data = await response.json();
      setEmails(data);
    } catch (err) {
      setError(err.message || "Failed to fetch emails");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/addEmails?searchUser=${encodeURIComponent(searchUser)}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUserSuggestions(data);
    } catch (err) {
      setError(err.message || "Failed to fetch users");
    }
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAddEmail = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!validateEmail(newEmail)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/addEmails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newEmail,
          department,
          userId: selectedUser ? selectedUser.id : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add email");
      }

      const data = await response.json();
      setEmails([data, ...emails]);
      setNewEmail("");
      setDepartment("");
      setSearchUser("");
      setSelectedUser(null);
      setUserSuggestions([]);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEmail = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!validateEmail(editEmail.email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/addEmails", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editEmail.id,
          email: editEmail.email,
          department: editEmail.department,
          userId: editEmail.userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update email");
      }

      const updatedEmail = await response.json();
      setEmails(emails.map((email) => (email.id === updatedEmail.id ? updatedEmail : email)));
      setEditEmail(null);
      setSearchUser("");
      setSelectedUser(null);
      setUserSuggestions([]);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEmail = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذا البريد الإلكتروني؟")) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/addEmails?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete email");
      setEmails(emails.filter((email) => email.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchUser(user.username);
    setUserSuggestions([]);
    if (editEmail) {
      setEditEmail({ ...editEmail, userId: user.id });
    }
  };

  const startEditing = (email) => {
    setEditEmail({
      id: email.id,
      email: email.email,
      department: email.department || "",
      userId: email.User?.id || null,
    });
    setSearchUser(email.User?.username || "");
    setSelectedUser(email.User ? { id: email.User.id, username: email.User.username } : null);
  };

  return (
    <Layout>
      <div className="min-h-screen">
        <Head>
          <title>Email Management</title>
          <meta name="description" content="Admin panel for managing email subscriptions" />
        </Head>

        <main className="container mx-auto p-6">
          <h1 className="text-4xl font-extrabold mb-8 text-indigo-900 tracking-tight">
            إدارة بريد الاستقدام
          </h1>

          {/* Add Email Form */}
          <div className="bg-white p-8 rounded-xl shadow-2xl mb-8 transform transition-all hover:shadow-3xl">
            <h2 className="text-2xl font-semibold mb-6 text-indigo-800">إضافة بريد إلكتروني جديد</h2>
            <form onSubmit={handleAddEmail} className="flex flex-col gap-4">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="أدخل البريد الإلكتروني"
                className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                disabled={isLoading}
              />
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                disabled={isLoading}
              >
                <option value="">اختر القسم</option>
                <option value="الموارد البشرية">الموارد البشرية</option>
                <option value="الاستقدام">الاستقدام</option>
              </select>
              <div className="relative">
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => {
                    setSearchUser(e.target.value);
                    setSelectedUser(null);
                  }}
                  placeholder="ابحث عن اسم المستخدم"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  disabled={isLoading}
                />
                {userSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {userSuggestions.map((user) => (
                      <li
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className="px-4 py-2 hover:bg-indigo-100 cursor-pointer transition"
                      >
                        {user.username}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="submit"
                className={`bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition transform hover:scale-105 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isLoading}
              >
                {isLoading ? "جارٍ الإضافة..." : "إضافة البريد"}
              </button>
            </form>
            {error && <p className="text-red-500 mt-3 font-medium">{error}</p>}
          </div>

          {/* Edit Email Form (Modal) */}
          {editEmail && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
                <h2 className="text-2xl font-semibold mb-6 text-indigo-800">تعديل البريد الإلكتروني</h2>
                <form onSubmit={handleEditEmail} className="flex flex-col gap-4">
                  <input
                    type="email"
                    value={editEmail.email}
                    onChange={(e) => setEditEmail({ ...editEmail, email: e.target.value })}
                    placeholder="أدخل البريد الإلكتروني"
                    className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    disabled={isLoading}
                  />
                  <select
                    value={editEmail.department}
                    onChange={(e) => setEditEmail({ ...editEmail, department: e.target.value })}
                    className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    disabled={isLoading}
                  >
                    <option value="">اختر القسم</option>
                    <option value="الموارد البشرية">الموارد البشرية</option>
                    <option value="الاستقدام">الاستقدام</option>
                  </select>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchUser}
                      onChange={(e) => {
                        setSearchUser(e.target.value);
                        setSelectedUser(null);
                        setEditEmail({ ...editEmail, userId: null });
                      }}
                      placeholder="ابحث عن اسم المستخدم"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      disabled={isLoading}
                    />
                    {userSuggestions.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                        {userSuggestions.map((user) => (
                          <li
                            key={user.id}
                            onClick={() => handleSelectUser(user)}
                            className="px-4 py-2 hover:bg-indigo-100 cursor-pointer transition"
                          >
                            {user.username}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className={`bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition transform hover:scale-105 ${
                        isLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={isLoading}
                    >
                      {isLoading ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditEmail(null)}
                      className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-400 transition transform hover:scale-105"
                      disabled={isLoading}
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
                {error && <p className="text-red-500 mt-3 font-medium">{error}</p>}
              </div>
            </div>
          )}

          {/* Email List Table */}
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-indigo-600">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-medium text-white uppercase tracking-wider">
                    البريد الإلكتروني
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-white uppercase tracking-wider">
                    القسم
 {/* crows"> */}
 </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-white uppercase tracking-wider">
                      اسم المستخدم
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-white uppercase tracking-wider">
                      الإجراءات
                    </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      جارٍ التحميل...
                    </td>
                  </tr>
                ) : emails.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      لا توجد رسائل بريد إلكتروني مضافة بعد
                    </td>
                  </tr>
                ) : (
                  emails.map((email) => (
                    <tr key={email.id} className="hover:bg-indigo-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {email.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {email.department || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {email.User?.username || "-"}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {new Date(email.createdAt).toLocaleDateString()}
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm flex justify-center gap-2 ">
                        <button
                          onClick={() => startEditing(email)}
                          className="p-2 text-indigo-600 hover:text-indigo-800 text-center bg-indigo-100 hover:bg-indigo-200 rounded-full transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          disabled={isLoading}
                          aria-label="تعديل البريد الإلكتروني"
                          title="تعديل"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmail(email.id)}
                          className="p-2 text-red-600 hover:text-red-800 bg-red-100 text-center hover:bg-red-200 rounded-full transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500"
                          disabled={isLoading}
                          aria-label="حذف البريد الإلكتروني"
                          title="حذف"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </Layout>
  );
}