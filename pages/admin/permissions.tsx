import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // For animations
import Style from 'styles/Home.module.css';
import { CheckCircleFilled, FileExcelFilled, FilePdfFilled } from '@ant-design/icons';
import Layout from 'example/containers/Layout';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';
import { useRouter } from 'next/router';
const PermissionsManagement = () => {
  // State for modals
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // To store the action to confirm
  const router = useRouter();
  // State for data
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [newRole, setNewRole] = useState({ name: '', permissions: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Permission sections and items
  const permissionSections = [
    'إدارة الطلبات',
    'إدارة العملاء',
    'إدارة العاملات',
    'شؤون الاقامة',
    'إدارة الوصول و المغادرة',
    'إدارة المحاسبة',
    'إدارة التقارير',
    'إدارة المستخدمين',
    'إدارة القوالب',
  ];
  const permissionItems = ['عرض', 'إضافة', 'تعديل', 'حذف'];

  // Fetch roles
  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/roles');
      setRoles(response.data);
    } catch (error) {
      setError('فشل في جلب الأدوار. حاول مرة أخرى.');
      console.error('Error fetching roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchRoles();
  }, []);

  // Handle role form submission
  const handleAddRole = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await axios.post('/api/roles', newRole);
      setIsAddRoleModalOpen(false);
      setNewRole({ name: '', permissions: {} });
      setIsConfirmModalOpen(false);
      fetchRoles();
    } catch (error) {
      setError('فشل في إضافة المسمى الوظيفي. حاول مرة أخرى.');
      console.error('Error adding role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRole = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await axios.put(`/api/roles/${selectedRole.id}`, newRole);
      setIsEditRoleModalOpen(false);
      setNewRole({ name: '', permissions: {} });
      setSelectedRole(null);
      setIsConfirmModalOpen(false);
      fetchRoles();
    } catch (error) {
      setError('فشل في تعديل المسمى الوظيفي. حاول مرة أخرى.');
      console.error('Error editing role:', error);
    } finally {
      setIsLoading(false);
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

  // Mock export functions
  const handleExportExcel = () => console.log('Export to Excel');
  const handleExportPDF = () => console.log('Export to PDF');

  // Handle confirmation
  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
  };

  return (
    <Layout>
      <div className={`min-h-screen bg-gray-100 font-tajawal p-8 dir-rtl ${Style["tajawal-regular"]}`}>
        <Head>
          <title>إدارة الصلاحيات</title>
        </Head>
        <section className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-normal text-black">إدارة الصلاحيات</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setIsAddRoleModalOpen(true)}
                className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2 rounded-md text-sm hover:bg-teal-700"
                disabled={isLoading}
              >
                إضافة مسمى وظيفي
              </button>
            </div>
          </div>
          <div className="border border-gray-300 rounded-md bg-white p-6">
            <div className="flex justify-end gap-2 mb-6">
              {/* <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-teal-800 text-white px-3 py-2 rounded-md text-xs hover:bg-teal-700"
                disabled={isLoading}
              >
                <FilePdfFilled />
                PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-teal-800 text-white px-3 py-2 rounded-md text-xs hover:bg-teal-700"
                disabled={isLoading}
              >
                <FileExcelFilled />
                Excel
              </button> */}
            </div>
            {error && (
              <div className="bg-red-100 text-red-800 p-3 rounded mb-4 text-center">
                {error}
              </div>
            )}
            <table className="w-full border-collapse text-center">
              <thead>
                <tr className="bg-gray-200 border-b border-gray-300">
                  <th className="p-4 text-xl font-normal text-black min-w-8">القسم</th>
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
                        disabled={isLoading}
                        aria-label={`تعديل دور ${role.name}`}
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
                      <td colSpan={roles.length + 1} className="p-5 text-center">
                        <div className="flex items-center gap-2 text-xl font-normal text-gray-800 text-center justify-center">
                          {section}
                        </div>
                      </td>
                    </tr>
                    {permissionItems.map((perm, idx) => (
                      <tr key={idx} className="bg-gray-200 border-gray-300">
                        <td className="p-4 text-black text-center min-w-8">{perm}</td>
                        {roles.map((role) => (
                          <td key={role.id} className="py-4 px-4 text-center">
                            {role?.permissions?.[section]?.[perm] ? (
                              <CheckCircleFilled className="text-teal-800" />
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

        {/* Add Role Modal */}
        <AnimatePresence>
          {isAddRoleModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              role="dialog"
              aria-labelledby="add-role-title"
              aria-modal="true"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-gray-200 rounded-lg p-8 max-w-4xl w-full relative"
              >
                <h1 id="add-role-title" className="text-2xl font-normal text-black mb-8 text-center">
                  إضافة مسمى وظيفي
                </h1>
                {error && (
                  <div className="bg-red-100 text-red-800 p-3 rounded mb-4 text-center">
                    {error}
                  </div>
                )}
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col items-end gap-2">
                    <label htmlFor="job-title" className="text-sm text-gray-800">
                      المسمى الوظيفي
                    </label>
                    <input
                      type="text"
                      id="job-title"
                      placeholder="ادخل المسمى الوظيفي"
                      value={newRole.name}
                      onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                      className="w-full bg-gray-200 border border-gray-300 rounded p-3 text-center text-sm"
                      disabled={isLoading}
                      aria-required="true"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-8">
                    {permissionSections.map((section) => (
                      <div
                        key={section}
                        className="border border-gray-300 rounded p-4 bg-gray-200 flex flex-col items-center gap-4"
                      >
                        <div className="bg-gray-200 border border-gray-300 rounded px-3 py-1 text-sm text-gray-800">
                          {section}
                        </div>
                        <div className="flex flex-col gap-4">
                          {permissionItems.map((perm) => (
                            <label
                              key={perm}
                              className="flex items-center gap-2 flex-row-reverse text-sm text-gray-800"
                            >
                              <span>{perm}</span>
                              <input
                                type="checkbox"
                                checked={newRole.permissions[section]?.[perm] || false}
                                onChange={(e) => handlePermissionChange(section, perm, e.target.checked)}
                                className="w-5 h-5"
                                disabled={isLoading}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center gap-4 pt-8 border-t border-gray-300">
                    <button
                      onClick={() => {
                        setConfirmAction(() => handleAddRole);
                        setIsConfirmModalOpen(true);
                      }}
                      className="bg-teal-800 text-white px-5 py-2 rounded text-base hover:bg-teal-700"
                      disabled={isLoading}
                    >
                      {isLoading ? 'جاري الحفظ...' : 'حفظ'}
                    </button>
                    <button
                      onClick={() => setIsAddRoleModalOpen(false)}
                      className="bg-transparent text-gray-800 border border-teal-800 px-5 py-2 rounded text-base hover:bg-gray-100"
                      disabled={isLoading}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Role Modal */}
        <AnimatePresence>
          {isEditRoleModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              role="dialog"
              aria-labelledby="edit-role-title"
              aria-modal="true"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-gray-200 rounded-lg p-8 max-w-4xl w-full relative"
              >
                <h1 id="edit-role-title" className="text-2xl font-normal text-black mb-8 text-center">
                  تعديل مسمى وظيفي
                </h1>
                {error && (
                  <div className="bg-red-100 text-red-800 p-3 rounded mb-4 text-center">
                    {error}
                  </div>
                )}
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col items-end gap-2">
                    <label htmlFor="job-title" className="text-sm text-gray-800">
                      المسمى الوظيفي
                    </label>
                    <input
                      type="text"
                      id="job-title"
                      placeholder="ادخل المسمى الوظيفي"
                      value={newRole.name}
                      onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                      className="w-full bg-gray-200 border border-gray-300 rounded p-3 text-center text-sm"
                      disabled={isLoading}
                      aria-required="true"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-8">
                    {permissionSections.map((section) => (
                      <div
                        key={section}
                        className="border border-gray-300 rounded p-4 bg-gray-200 flex flex-col items-center gap-4"
                      >
                        <div className="bg-gray-200 border border-gray-300 rounded px-3 py-1 text-sm text-gray-800">
                          {section}
                        </div>
                        <div className="flex flex-col gap-4">
                          {permissionItems.map((perm) => (
                            <label
                              key={perm}
                              className="flex items-center gap-2 flex-row-reverse text-sm text-gray-800"
                            >
                              <span>{perm}</span>
                              <input
                                type="checkbox"
                                checked={newRole.permissions[section]?.[perm] || false}
                                onChange={(e) => handlePermissionChange(section, perm, e.target.checked)}
                                className="w-5 h-5"
                                disabled={isLoading}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center gap-4 pt-8 border-t border-gray-300">
                    <button
                      onClick={() => {
                        setConfirmAction(() => handleEditRole);
                        setIsConfirmModalOpen(true);
                      }}
                      className="bg-teal-800 text-white px-5 py-2 rounded text-base hover:bg-teal-700"
                      disabled={isLoading}
                    >
                      {isLoading ? 'جاري الحفظ...' : 'حفظ'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditRoleModalOpen(false);
                        setSelectedRole(null);
                      }}
                      className="bg-transparent text-gray-800 border border-teal-800 px-5 py-2 rounded text-base hover:bg-gray-100"
                      disabled={isLoading}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {isConfirmModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              role="dialog"
              aria-labelledby="confirm-title"
              aria-modal="true"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-gray-200 rounded-lg p-8 max-w-md w-full"
              >
                <h1 id="confirm-title" className="text-xl font-normal text-black mb-4 text-center">
                  تأكيد العملية
                </h1>
                <p className="text-sm text-gray-800 mb-6 text-center">
                  هل أنت متأكد من حفظ التغييرات؟
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleConfirm}
                    className="bg-teal-800 text-white px-5 py-2 rounded text-base hover:bg-teal-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'جاري الحفظ...' : 'تأكيد'}
                  </button>
                  <button
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="bg-transparent text-gray-800 border border-teal-800 px-5 py-2 rounded text-base hover:bg-gray-100"
                    disabled={isLoading}
                  >
                    إلغاء
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default PermissionsManagement;

export async function getServerSideProps({ req }) {
  try {
    const cookieHeader = req.headers.cookie;
    let cookies = {};
    if (cookieHeader) {
      cookieHeader.split(';').forEach((cookie) => {
        const [key, value] = cookie.trim().split('=');
        cookies[key] = decodeURIComponent(value);
      });
    }

    if (!cookies.authToken) {
      return {
        redirect: { destination: '/admin/login', permanent: false },
      };
    }

    const token = jwtDecode(cookies.authToken);
    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });

    if (
      !findUser ||
      !findUser.role?.permissions?.['إدارة المستخدمين']?.['إضافة']
    ) {
      return {
        redirect: { destination: '/admin/home', permanent: false },
      };
    }

    return { props: {} };
  } catch (err) {
    console.error('Authorization error:', err);
    return {
      redirect: { destination: '/admin/home', permanent: false },
    };
  }
}
