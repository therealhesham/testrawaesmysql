import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit, CheckCircle } from 'lucide-react';
import Style from "styles/Home.module.css"
import { FileExcelFilled, FilePdfFilled } from '@ant-design/icons';

const PermissionsManagement = () => {
  // State for modals
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);

  // State for data
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [newRole, setNewRole] = useState({ name: '', permissions: {} });

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
  ];
  const permissionItems = ['عرض', 'إضافة', 'تعديل', 'حذف'];

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
    fetchRoles();
  }, []);

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

  // Mock export functions
  const handleExportExcel = () => console.log('Export to Excel');
  const handleExportPDF = () => console.log('Export to PDF');

  return (
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
              <FilePdfFilled />
              PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 bg-teal-800 text-white px-3 py-2 rounded-md text-xs hover:bg-teal-700"
            >
              <FileExcelFilled />
              Excel
            </button>
          </div>
          <table className="w-full border-collapse text-center">
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
                  <tr className="bg-white border-y border-gray-300 ">
                    <td colSpan={roles.length + 1} className="p-5 text-center">
                      <div className="flex items-center gap-2 text-xl font-normal text-gray-800 text-center justify-center">
                        {section}
                      </div>
                    </td>
                  </tr>
                  {permissionItems.map((perm, idx) => (
                    <tr key={idx} className="bg-gray-200 border-b border-gray-300 ">
                      <td className="p-4 text-base text-black text-center">{perm}</td>
                      {roles.map((role) => (
                        <td key={role.id} className="p-4 text-center">
                          {role?.permissions?.[section]?.[perm] ? (
                            <CheckCircle className="w-5 h-5 text-teal-800 self-center " />
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
      {isAddRoleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-200 rounded-lg p-8 max-w-4xl w-full">
            <h1 className="text-2xl font-normal text-black mb-8 text-center">إضافة مسمى وظيفي</h1>
            <div className="flex flex-col gap-8">
              <div className="flex flex-col items-end gap-2">
                <label htmlFor="job-title" className="text-sm text-gray-800">المسمى الوظيفي</label>
                <input
                  type="text"
                  id="job-title"
                  placeholder="ادخل المسمى الوظيفي"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="w-full bg-gray-200 border border-gray-300 rounded p-3 text-center text-sm"
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
            <h1 className="text-2xl font-normal text-black mb-8 text-center">تعديل مسمى وظيفي</h1>
            <div className="flex flex-col gap-8">
              <div className="flex flex-col items-end gap-2">
                <label htmlFor="job-title" className="text-sm text-gray-800">المسمى الوظيفي</label>
                <input
                  type="text"
                  id="job-title"
                  placeholder="ادخل المسمى الوظيفي"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="w-full bg-gray-200 border border-gray-300 rounded p-3 text-center text-sm"
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

export default PermissionsManagement;