import Head from 'next/head';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit, Trash } from 'lucide-react';
import Style from "styles/Home.module.css"
import { FileExcelFilled, FilePdfFilled } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';
import Layout from 'example/containers/Layout';
const UserManagement = () => {
  // State for modals and visibility
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);

  // State for data
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // State for form inputs
  const [newUser, setNewUser] = useState({ username: '', phonenumber: '', idnumber: '', password: '', roleId: '' });

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users', {
        params: { search: searchTerm, role: roleFilter, page: currentPage, limit: 8 },
      });
      setUsers(response.data);
      setTotalPages(Math.ceil(response.headers['x-total-count'] / 8) || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const response = await axios.get('/api/roles');
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [searchTerm, roleFilter, currentPage]);

  // Handle user form submission
  const handleAddUser = async () => {
    try {
      await axios.post('/api/users', newUser);
      setIsAddUserModalOpen(false);
      setNewUser({ username: '', phonenumber: '', idnumber: '', password: '', roleId: '' });
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleEditUser = async () => {
    try {
      await axios.put(`/api/users/${selectedUser.id}`, newUser);
      setIsEditUserModalOpen(false);
      setNewUser({ username: '', phonenumber: '', idnumber: '', password: '', roleId: '' });
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error editing user:', error);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await axios.delete(`/api/users/${selectedUser.id}`);
      setIsDeleteUserModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Pagination controls
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Mock export functions
  const handleExportExcel = () => console.log('Export to Excel');
  const handleExportPDF = () => console.log('Export to PDF');

  return (
    <Layout>
    <div className={`min-h-screen bg-gray-100 font-tajawal p-8 dir-rtl ${Style["tajawal-regular"]}`}>
      <Head>
        <title>إدارة المستخدمين</title>
      </Head>
      {/* User Management Section */}
      <section className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-normal text-black">إدارة المستخدمين</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-700"
            >
              <span>إضافة مستخدم</span>
            </button>
            <Link href="/admin/permissions">
              <a className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-700">
                <span>إدارة الصلاحيات</span>
              </a>
            </Link>
          </div>
        </div>
        <div className="bg-gray-100 border border-gray-300 rounded-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-3">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-teal-800 text-white px-3 py-2 rounded-md text-xs hover:bg-teal-700"
              >
                <FileExcelFilled />
                Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-teal-800 text-white px-3 py-2 rounded-md text-xs hover:bg-teal-700"
              >
                <FilePdfFilled />
                PDF
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('');
                  setCurrentPage(1);
                }}
                className="bg-teal-800 text-white px-3 py-2 rounded-md text-xs hover:bg-teal-700"
              >
                إعادة ضبط
              </button>
              <div className="flex items-center gap-2 bg-gray-200 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent border-none text-right"
                >
                  <option value="">المسمى الوظيفي</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-gray-200 border border-gray-300 rounded-md px-3 py-2 text-sm">
                <input
                  type="text"
                  placeholder="بحث"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none text-right placeholder-gray-500"
                />
              </div>
            </div>
          </div>
          <div className="border border-gray-300 rounded-md overflow-hidden">
            <div className="grid grid-cols-[0.5fr_1.5fr_1fr_1.2fr_1fr_1fr_0.8fr] bg-teal-800 text-white text-sm h-12 items-center px-4">
              <div>#</div>
              <div>الاسم</div>
              <div>ID</div>
              <div>رقم الجوال</div>
              <div className="text-center">المسمى الوظيفي</div>
              <div className="text-center">تاريخ الإنشاء</div>
              <div className="text-center">الإجراءات</div>
            </div>
            <div className="flex flex-col">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-[0.5fr_1.5fr_1fr_1.2fr_1fr_1fr_0.8fr] bg-gray-200 h-12 items-center px-4 border-b border-gray-300 last:border-b-0 text-sm"
                >
                  <div>{user.id}</div>
                  <div>{user.username}</div>
                  <div>{user.idnumber}</div>
                  <div>{user.phonenumber}</div>
                  <div className="text-center text-xs">{user.role?.name || 'غير محدد'}</div>
                  <div className="text-center text-xs">
                    {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                  </div>
                  <div className="text-center flex justify-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setNewUser({
                          username: user.username,
                          phonenumber: user.phonenumber,
                          idnumber: user.idnumber,
                          password: user.password,
                          roleId: user.roleId || '',
                        });
                        setIsEditUserModalOpen(true);
                      }}
                      className="bg-transparent border-none cursor-pointer"
                    >
                      <Edit className="w-5 h-5 text-teal-800 hover:text-teal-600" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setIsDeleteUserModalOpen(true);
                      }}
                      className="bg-transparent border-none cursor-pointer"
                    >
                      <Trash className="w-5 h-5 text-red-600 hover:text-red-800" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center pt-12">
            <p className="text-base text-black">
              عرض {(currentPage - 1) * 8 + 1}-{Math.min(currentPage * 8, users.length)} من {users.length} نتيجة
            </p>
            <nav className="flex gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center justify-center min-w-[18px] h-[18px] px-2 border border-gray-300 bg-gray-200 rounded text-xs text-gray-800 disabled:opacity-50"
              >
                السابق
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`flex items-center justify-center min-w-[18px] h-[18px] px-2 border rounded text-xs ${
                    currentPage === i + 1
                      ? 'border-teal-800 bg-teal-800 text-white'
                      : 'border-gray-300 bg-gray-200 text-gray-800'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center min-w-[18px] h-[18px] px-2 border border-gray-300 bg-gray-200 rounded text-xs text-gray-800 disabled:opacity-50"
              >
                التالي
              </button>
            </nav>
          </div>
        </div>
      </section>
      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-200 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-normal mb-5 text-gray-800">إضافة مستخدم</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm mb-2">الاسم</label>
                <input
                  type="text"
                  placeholder="الاسم الكامل"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="p-2 border border-gray-300 rounded text-right"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm mb-2">ID</label>
                <input
                  type="text"
                  placeholder="رقم الهوية"
                  value={newUser.idnumber}
                  onChange={(e) => setNewUser({ ...newUser, idnumber: e.target.value })}
                  className="p-2 border border-gray-300 rounded text-right"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm mb-2">المسمى الوظيفي</label>
                <select
                  value={newUser.roleId}
                  onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
                  className="p-2 border border-gray-300 rounded text-right"
                >
                  <option value="">اختر الدور</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm mb-2">رقم الجوال</label>
                <input
                  type="text"
                  placeholder="رقم الجوال"
                  value={newUser.phonenumber}
                  onChange={(e) => setNewUser({ ...newUser, phonenumber: e.target.value })}
                  className="p-2 border border-gray-300 rounded text-right"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm mb-2">كلمة المرور</label>
                <input
                  type="password"
                  placeholder="كلمة المرور"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="p-2 border border-gray-300 rounded text-right"
                />
              </div>
            </div>
            <div className="flex justify-center gap-3 mt-5">
              <button
                onClick={handleAddUser}
                className="bg-teal-800 text-white px-5 py-2 rounded text-sm hover:bg-teal-700"
              >
                حفظ
              </button>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="bg-white text-teal-800 border border-teal-800 px-5 py-2 rounded text-sm hover:bg-gray-100"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit User Modal */}
      {isEditUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-200 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-normal mb-5 text-gray-800">تعديل بيانات مستخدم</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm mb-2">الاسم</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="p-2 border border-gray-300 rounded text-right"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm mb-2">ID</label>
                <input
                  type="text"
                  value={newUser.idnumber}
                  onChange={(e) => setNewUser({ ...newUser, idnumber: e.target.value })}
                  className="p-2 border border-gray-300 rounded text-right"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm mb-2">المسمى الوظيفي</label>
                <select
                  value={newUser.roleId}
                  onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
                  className="p-2 border border-gray-300 rounded text-right"
                >
                  <option value="">اختر الدور</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm mb-2">رقم الجوال</label>
                <input
                  type="text"
                  value={newUser.phonenumber}
                  onChange={(e) => setNewUser({ ...newUser, phonenumber: e.target.value })}
                  className="p-2 border border-gray-300 rounded text-right"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm mb-2">كلمة المرور</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="p-2 border border-gray-300 rounded text-right"
                />
              </div>
            </div>
            <div className="flex justify-center gap-3 mt-5">
              <button
                onClick={handleEditUser}
                className="bg-teal-800 text-white px-5 py-2 rounded text-sm hover:bg-teal-700"
              >
                حفظ
              </button>
              <button
                onClick={() => {
                  setIsEditUserModalOpen(false);
                  setSelectedUser(null);
                }}
                className="bg-white text-teal-800 border border-teal-800 px-5 py-2 rounded text-sm hover:bg-gray-100"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete User Confirmation Modal */}
      {isDeleteUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-200 rounded-lg p-6 w-full max-w-sm text-center">
            <p className="text-base mb-5">
              هل أنت متأكد أنك تريد حذف المستخدم "{selectedUser?.username}"؟
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleDeleteUser}
                className="bg-teal-800 text-white px-5 py-2 rounded text-sm hover:bg-teal-700"
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => {
                  setIsDeleteUserModalOpen(false);
                  setSelectedUser(null);
                }}
                className="bg-white text-teal-800 border border-teal-800 px-5 py-2 rounded text-sm hover:bg-gray-100"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
};

export default UserManagement;





export async function getServerSideProps ({ req }) {
  try {
    // 🔹 Extract cookies
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    // 🔹 Check for authToken
    if (!cookies.authToken) {
      return {
        redirect: { destination: "/admin/login", permanent: false },
      };
    }

    // 🔹 Decode JWT
    const token = jwtDecode(cookies.authToken);

    // 🔹 Fetch user & role with Prisma
    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });
    if (
      !findUser ||
      !findUser.role?.permissions?.["إدارة السمتخدمين"]?.["عرض"]
    ) {
      return {
        redirect: { destination: "/admin/home", permanent: false }, // or show 403
      };
    }

    return { props: {} };
  } catch (err) {
    console.error("Authorization error:", err);
    return {
      redirect: { destination: "/admin/home", permanent: false },
    };
  }
};