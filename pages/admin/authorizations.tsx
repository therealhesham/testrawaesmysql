import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit, Trash, CheckCircle } from 'lucide-react';
import Style from "styles/Home.module.css"
import { FileExcelFilled, FilePdfFilled } from '@ant-design/icons';

const UserManagement = () => {
  // State for modals and visibility
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [showPermissionsSection, setShowPermissionsSection] = useState(false); // New state for permissions section visibility

  // State for data
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // State for form inputs
  const [newUser, setNewUser] = useState({ username: '', phonenumber: '', idnumber: '', password: '', roleId: '' });
  const [newRole, setNewRole] = useState({ name: '', permissions: {} });

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

  // Handle role form submission
  const handleAddRole = async () => {
    try {
      await axios.post('/api/roles', newRole);
      setIsAddRoleModalOpen(false);
      setNewRole({ name: '', permissions: {} });
      fetchRoles();
    } catch (error) {
      console.error('Error adding role:', error);
    }
  };

  const handleEditRole = async () => {
    try {
      await axios.put(`/api/roles/${selectedRole.id}`, newRole);
      setIsEditRoleModalOpen(false);
      setNewRole({ name: '', permissions: {} });
      setSelectedRole(null);
      fetchRoles();
    } catch (error) {
      console.error('Error editing role:', error);
    }
  };

  // Handle permission checkbox changes
  const handlePermissionChange = (section, permission, checked) => {
    setNewRole((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [section]: {
          ...prev.permissions[section],
          [permission]: checked,
        },
      },
    }));
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

  // Permission sections and items
  const permissionSections = [
    'إدارة الطلبات',
    'إدارة العملاء',
    'إدارة العاملات',
    'شؤون الاقامة',
    'إدارة المحاسبة',
    'إدارة التقارير',
    'إدارة القوالب',
    'إدارة المستخدمين',
  ];
  const permissionItems = ['عرض', 'إضافة', 'تعديل', 'حذف'];

  return (
    <div className={`min-h-screen bg-gray-100 font-tajawal p-8 dir-rtl ${Style["tajawal-regular"]}`}>
      <Head>
        <title>إدارة المستخدمين</title>
        <meta charSet="UTF-8" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500&display=swap" rel="stylesheet" />
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
            <button
              onClick={() => setShowPermissionsSection(!showPermissionsSection)} // Toggle permissions section visibility
              className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-700"
            >
              <span>{showPermissionsSection ? 'إخفاء الصلاحيات' : 'إدارة الصلاحيات'}</span>
            </button>
          </div>
        </div>
        <div className="bg-gray-100 border border-gray-300 rounded-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-3">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-teal-800 text-white px-3 py-2 rounded-md text-xs hover:bg-teal-700"
              >
                <FileExcelFilled/>
                Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-teal-800 text-white px-3 py-2 rounded-md text-xs hover:bg-teal-700"
              >
                <FilePdfFilled/>
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
      {/* Permissions Management Section */}
      {showPermissionsSection && (
        <section className="max-w-7xl mx-auto mt-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-normal text-black">إدارة الصلاحيات</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setIsAddRoleModalOpen(true)}
                className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-700"
              >
                إضافة مسمى وظيفي
              </button>
            </div>
          </div>
          <div className="border border-gray-300 rounded-md bg-white p-6">
            <div className="flex justify-end gap-2 mb-6">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-teal-800 text-white px-3 py-2 rounded-md text-xs hover:bg-teal-700"
              >
                PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-teal-800 text-white px-3 py-2 rounded-md text-xs hover:bg-teal-700"
              >
                Excel
              </button>
            </div>
            <table className="w-full border-collapse text-right">
              <thead>
                <tr className="bg-gray-200 border-b border-gray-300">
                  <th className="p-4 text-xl font-normal text-black">القسم</th>
                  {roles.map((role) => (
                    <th key={role.id} className="p-4 text-xl font-normal text-black">
                      {role.name}
                      <button
                        onClick={() => {
                          setSelectedRole(role);
                          setNewRole({ name: role.name, permissions: role.permissions || {} });
                          setIsEditRoleModalOpen(true);
                        }}
                        className="mr-2 bg-transparent border-none cursor-pointer"
                      >
                        <Edit className="w-4 h-4 text-teal-800 hover:text-teal-600" />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissionSections.map((section) => (
                  <React.Fragment key={section}>
                    <tr className="bg-white border-y border-gray-300">
                      <td colSpan={roles.length + 1} className="p-5">
                        <div className="flex items-center gap-2 text-xl font-normal text-gray-800">
                          {section}
                        </div>
                      </td>
                    </tr>
                    {permissionItems.map((perm, idx) => (
                      <tr key={idx} className="bg-gray-200 border-b border-gray-300 last:border-b-0">
                        <td className="p-4 text-base text-black">{perm}</td>
                        {roles.map((role) => (
                          <td key={role.id} className="p-4 text-center">
                            {role.permissions?.[section]?.[perm] ? (
                              <CheckCircle className="w-5 h-5 text-teal-800" />
                            ) : null}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
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
      {/* Add Role Modal */}
      {isAddRoleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-200 rounded-lg p-8 max-w-4xl w-full">
            <h1 className="text-2xl font-normal text-black mb-8 text-right">إضافة مسمى وظيفي</h1>
            <div className="flex flex-col gap-8">
              <div className="flex flex-col items-end gap-2">
                <label htmlFor="job-title" className="text-sm text-gray-800">المسمى الوظيفي</label>
                <input
                  type="text"
                  id="job-title"
                  placeholder="ادخل المسمى الوظيفي"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="w-full bg-gray-200 border border-gray-300 rounded p-3 text-right text-sm"
                />
              </div>
              <div className="grid grid-cols-4 gap-8">
                {permissionSections.map((section) => (
                  <div key={section} className="border border-gray-300 rounded p-4 bg-gray-200 flex flex-col items-center gap-4">
                    <div className="bg-gray-200 border border-gray-300 rounded px-3 py-1 text-sm text-gray-800">
                      {section}
                    </div>
                    <div className="flex flex-col gap-4">
                      {permissionItems.map((perm) => (
                        <label key={perm} className="flex items-center gap-2 flex-row-reverse text-sm text-gray-800">
                          <span>{perm}</span>
                          <input
                            type="checkbox"
                            checked={newRole.permissions[section]?.[perm] || false}
                            onChange={(e) => handlePermissionChange(section, perm, e.target.checked)}
                            className="w-5 h-5"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4 pt-8 border-t border-gray-300">
                <button
                  onClick={handleAddRole}
                  className="bg-teal-800 text-white px-5 py-2 rounded text-base hover:bg-teal-700"
                >
                  حفظ
                </button>
                <button
                  onClick={() => setIsAddRoleModalOpen(false)}
                  className="bg-transparent text-gray-800 border border-teal-800 px-5 py-2 rounded text-base hover:bg-gray-100"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Role Modal */}
      {isEditRoleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-200 rounded-lg p-8 max-w-4xl w-full">
            <h1 className="text-2xl font-normal text-black mb-8 text-right">تعديل مسمى وظيفي</h1>
            <div className="flex flex-col gap-8">
              <div className="flex flex-col items-end gap-2">
                <label htmlFor="job-title" className="text-sm text-gray-800">المسمى الوظيفي</label>
                <input
                  type="text"
                  id="job-title"
                  placeholder="ادخل المسمى الوظيفي"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="w-full bg-gray-200 border border-gray-300 rounded p-3 text-right text-sm"
                />
              </div>
              <div className="grid grid-cols-4 gap-8">
                {permissionSections.map((section) => (
                  <div key={section} className="border border-gray-300 rounded p-4 bg-gray-200 flex flex-col items-center gap-4">
                    <div className="bg-gray-200 border border-gray-300 rounded px-3 py-1 text-sm text-gray-800">
                      {section}
                    </div>
                    <div className="flex flex-col gap-4">
                      {permissionItems.map((perm) => (
                        <label key={perm} className="flex items-center gap-2 flex-row-reverse text-sm text-gray-800">
                          <span>{perm}</span>
                          <input
                            type="checkbox"
                            checked={newRole.permissions[section]?.[perm] || false}
                            onChange={(e) => handlePermissionChange(section, perm, e.target.checked)}
                            className="w-5 h-5"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4 pt-8 border-t border-gray-300">
                <button
                  onClick={handleEditRole}
                  className="bg-teal-800 text-white px-5 py-2 rounded text-base hover:bg-teal-700"
                >
                  حفظ
                </button>
                <button
                  onClick={() => {
                    setIsEditRoleModalOpen(false);
                    setSelectedRole(null);
                  }}
                  className="bg-transparent text-gray-800 border border-teal-800 px-5 py-2 rounded text-base hover:bg-gray-100"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;