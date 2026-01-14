import Head from 'next/head';
import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Edit, Trash } from 'lucide-react';
import Style from 'styles/Home.module.css';
import { FileExcelFilled, FilePdfFilled } from '@ant-design/icons';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';
import Layout from 'example/containers/Layout';
import * as XLSX from 'xlsx';

import jsPDF from 'jspdf';
// import jsPDF from 'jspdf';
import 'jspdf-autotable';

import html2canvas from 'html2canvas';

const UserManagement = ({ currentUserRole }: { currentUserRole: string }) => {
  // State for modals and visibility
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success'); // 'success' or 'error'

const [userName, setUserName] = useState('');
useEffect(() => {
  const token = localStorage.getItem('token');
  // if (!token) return;
  if (!token) return;
    const decoded = jwtDecode(token);
  const userName = decoded.username;
  setUserName(userName);
}, []);

  // State for data
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // State for form inputs
  const [newUser, setNewUser] = useState({ username: '', phonenumber: '', idnumber: '', password: '', email: '', roleId: '', pictureurl: '' });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Ref for the table
  const tableRef = useRef(null);

  // Function to show notification modal
  const showNotification = (message, type = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setIsNotificationModalOpen(true);
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users', {
        params: { search: searchTerm, role: roleFilter, page: currentPage, limit: 8 },
      });
      setUsers(response.data.data);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalUsers(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('حدث خطأ أثناء جلب المستخدمين. يرجى المحاولة مرة أخرى.', 'error');
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const response = await axios.get('/api/roles');
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      showNotification('حدث خطأ أثناء جلب الأدوار. يرجى المحاولة مرة أخرى.', 'error');
    }
  };



















  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [searchTerm, roleFilter, currentPage]);

  // فلترة الأدوار المتاحة - إخفاء دور owner إذا المستخدم الحالي ليس owner
  const getAvailableRoles = () => {
    if (currentUserRole === 'owner') {
      return roles; // الـ owner يرى كل الأدوار
    }
    // غير الـ owner لا يستطيع اختيار دور owner
    return roles.filter((role) => role.name?.toLowerCase() !== 'owner');
  };

  // التحقق من إمكانية تعديل/حذف المستخدم - owner فقط يقدر يعدل على owner
  const canEditUser = (user: any) => {
    const isCurrentUserOwner = currentUserRole === 'owner';
    const isTargetUserOwner = user.role?.name?.toLowerCase() === 'owner';
    
    // إذا كان المستخدم المستهدف owner، فقط owner يقدر يعدله
    if (isTargetUserOwner && !isCurrentUserOwner) {
      return false;
    }
    return true;
  };

  // Handle user form submission
  const handleAddUser = async () => {
    try {
const waiter =       await axios.post('/api/users', newUser);
      
if (waiter.data.type === "phoneNumber"){
  showNotification(waiter.data.error, 'error');
  return;
}
setIsAddUserModalOpen(false);
      setNewUser({ username: '', phonenumber: '', idnumber: '', password: '', email: '', roleId: '', pictureurl: '' });
      fetchUsers();
      showNotification('تمت إضافة المستخدم بنجاح.');
    } catch (error) {
      console.error('Error adding user:', error);
      showNotification('حدث خطأ أثناء إضافة المستخدم. يرجى المحاولة مرة أخرى.', 'error');
    }
  };

  const handleEditUser = async () => {
    try {
      await axios.put(`/api/users/${selectedUser.id}`, newUser);
      setIsEditUserModalOpen(false);
      setNewUser({ username: '', phonenumber: '', idnumber: '', password: '', email: '', roleId: '', pictureurl: '' });
      setSelectedUser(null);
      fetchUsers();
      showNotification('تم تعديل المستخدم بنجاح.');
    } catch (error) {
      console.error('Error editing user:', error);
      showNotification('حدث خطأ أثناء تعديل المستخدم. يرجى المحاولة مرة أخرى.', 'error');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await axios.delete(`/api/users/${selectedUser.id}`);
      setIsDeleteUserModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
      showNotification('تم حذف المستخدم بنجاح.');
    } catch (error) {
      console.error('Error deleting user:', error);
      showNotification('حدث خطأ أثناء حذف المستخدم. يرجى المحاولة مرة أخرى.', 'error');
    }
  };

  // Pagination controls
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      showNotification('يرجى اختيار صورة فقط', 'error');
      return;
    }

    // التحقق من حجم الملف (أقل من 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('حجم الصورة يجب أن يكون أقل من 5 ميجابايت', 'error');
      return;
    }

    setUploadingImage(true);

    try {
      // تحويل الصورة إلى Base64 للرفع
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = (reader.result as string).split(',')[1]; // إزالة البادئة data:image/...;base64,
          
          // رفع الصورة إلى Digital Ocean Spaces
          const response = await fetch('/api/upload-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: base64String,
              filename: file.name,
              contentType: file.type,
            }),
          });

          if (!response.ok) {
            throw new Error('فشل رفع الصورة');
          }

          const data = await response.json();
          
          // حفظ رابط الصورة من Digital Ocean
          setNewUser({ ...newUser, pictureurl: data.url });
          showNotification('تم رفع الصورة بنجاح', 'success');
          setUploadingImage(false);
        } catch (uploadError) {
          console.error('Error uploading to Digital Ocean:', uploadError);
          showNotification('حدث خطأ أثناء رفع الصورة', 'error');
          setUploadingImage(false);
        }
      };
      reader.onerror = () => {
        showNotification('حدث خطأ أثناء قراءة الصورة', 'error');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      showNotification('حدث خطأ أثناء رفع الصورة', 'error');
      setUploadingImage(false);
    }
  };




const fetchFilteredLogs = async () => {
  const res = await axios.get(`/api/users`, {
    params: {
    },
  });
  if (res.status !== 200) throw new Error("Failed to fetch data");
  // const data = await res.json();
  
  // نحدّث الستيت لو حابب تظل البيانات في الواجهة
  setUsers(res.data.data);
  // لكن الأهم: نرجعها علشان نستخدمها فورًا
  return res.data.data;
};
  


// Export to PDF
const handleExportPDF = async () => {
  console.log('exporting PDF');
  let dataToExport = users;
  if (searchTerm || roleFilter) {
    dataToExport = await fetchFilteredLogs();
  }
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // 🔷 تحميل شعار مرة واحدة (لكن نستخدمه في كل صفحة)
  const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
  const logoBuffer = await logo.arrayBuffer();
  const logoBytes = new Uint8Array(logoBuffer);
  const logoBase64 = Buffer.from(logoBytes).toString('base64');

  // 🔷 تحميل خط أميري
  try {
    const response = await fetch('/fonts/Amiri-Regular.ttf');
    if (!response.ok) throw new Error('Failed to fetch font');
    const fontBuffer = await response.arrayBuffer();
    const fontBytes = new Uint8Array(fontBuffer);
    const fontBase64 = Buffer.from(fontBytes).toString('base64');

    doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.setFont('Amiri', 'normal');
  } catch (error) {
    console.error('Error loading Amiri font:', error);
    return;
  }
  doc.text(userName, 10, pageHeight - 10, { align: 'left' });
  doc.setLanguage('ar');
  doc.setFontSize(12);
  doc.text('إدارة المستخدمين', pageWidth / 2, 20, { align: 'right' });

  const headers = [['اسم المستخدم', 'رقم الهوية', 'رقم الجوال', 'المسمى الوظيفي', 'تاريخ الإنشاء']];
  const body = dataToExport?.map((row: any) => [
    row.username || 'غير متوفر',
    row.idnumber || 'غير متوفر',
    row.phonenumber || 'غير متوفر',
    row.role?.name || 'غير متوفر',
    row.createdAt ? new Date(row.createdAt).toISOString().split('T')[0] : 'غير متوفر',
  ]);

  doc.autoTable({
    head: headers,
    body: body,
    styles: {
      font: 'Amiri',
      halign: 'right',
      fontSize: 10,
      cellPadding: 2,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [26, 77, 79],
      textColor: [255, 255, 255],
      halign: 'center',
    },
    margin: { top: 42, right: 10, left: 10 },

    // ✅ هنا بنضيف اللوجو والبيانات في كل صفحة
    didDrawPage: (data) => {
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;

      // 🔷 إضافة اللوجو أعلى الصفحة (في كل صفحة)
      doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

      // 🔹 كتابة العنوان في أول صفحة فقط (اختياري)
      if (doc.getCurrentPageInfo().pageNumber === 1) {
        doc.setFontSize(12);
        doc.setFont('Amiri', 'normal');
        doc.text('إدارة المستخدمين', pageWidth / 2, 20, { align: 'right' });
      }

      // 🔸 الفوتر
      doc.setFontSize(10);
      doc.setFont('Amiri', 'normal');

      const pageNumber = `صفحة ${doc.getCurrentPageInfo().pageNumber}`;
      doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });

      const dateText =
        "التاريخ: " +
        new Date().toLocaleDateString('ar-EG', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) +
        "  الساعة: " +
        new Date().toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        });
      doc.text(dateText, pageWidth - 10, pageHeight - 10, { align: 'right' });
    },

    didParseCell: (data) => {
      data.cell.styles.halign = 'right';
    },
  });

  doc.save('users.pdf');
};





















  
  // Export to Excel
  const handleExportExcel = () => {
    try {
      const exportData = users.map((user) => ({
        ID: user.id,
        الاسم: user.username,
        'رقم الهوية': user.idnumber,
        'رقم الجوال': user.phonenumber,
        'المسمى الوظيفي': user.role?.name || 'غير محدد',
        'تاريخ الإنشاء': new Date(user.createdAt).toLocaleDateString('ar-SA'),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
      XLSX.writeFile(workbook, 'Users.xlsx');
      showNotification('تم تصدير الملف بصيغة Excel بنجاح.');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showNotification('حدث خطأ أثناء تصدير Excel. يرجى المحاولة مرة أخرى.', 'error');
    }
  };

  return (
    <Layout>
      <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-tajawal p-8 dir-rtl ${Style['tajawal-regular']}`}>
        <Head>
          <title>إدارة المستخدمين</title>
        </Head>
        <section className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">إدارة المستخدمين</h1>
              <p className="text-gray-600 text-sm">إدارة وتحكم في حسابات المستخدمين والصلاحيات</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-teal-700 to-teal-800 text-white px-6 py-3 rounded-lg text-sm font-medium hover:from-teal-800 hover:to-teal-900 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span>إضافة مستخدم</span>
              </button>
              <Link href="/admin/permissions">
                <a className="flex items-center gap-2 bg-white text-teal-800 border-2 border-teal-800 px-6 py-3 rounded-lg text-sm font-medium hover:bg-teal-50 transition-all duration-200 shadow-md hover:shadow-lg">
                  <span>إدارة الصلاحيات</span>
                </a>
              </Link>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-3">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <FileExcelFilled />
                  Excel
                </button>
                <button
                  onClick={() => handleExportPDF()}
                  className="flex items-center gap-2 bg-teal-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
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
                  className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all duration-200 border border-gray-300"
                >
                  إعادة ضبط
                </button>
                <div className="flex items-center gap-2 bg-white border-2 border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:border-teal-500 focus-within:border-teal-600 transition-all duration-200 shadow-sm">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-transparent border-none text-right outline-none cursor-pointer"
                  >
                    <option value="">المسمى الوظيفي</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 bg-white border-2 border-gray-300 rounded-lg px-4 py-2 text-sm hover:border-teal-500 focus-within:border-teal-600 transition-all duration-200 shadow-sm">
                  <input
                    type="text"
                    placeholder="بحث"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none text-right placeholder-gray-400 outline-none w-40"
                  />
                </div>
              </div>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm" ref={tableRef}>
              <div className="grid grid-cols-[0.5fr_2fr_1fr_1.2fr_1fr_1fr_0.8fr] bg-gradient-to-r from-teal-700 to-teal-800 text-white text-sm font-semibold h-14 items-center px-6">
                <div>#</div>
                <div>الاسم</div>
                <div>ID</div>
                <div>رقم الجوال</div>
                <div className="text-center">المسمى الوظيفي</div>
                <div className="text-center">تاريخ الإنشاء</div>
                <div className="text-center">الإجراءات</div>
              </div>
              <div className="flex flex-col">
                {users.map((user, index) => (
                  <div
                    key={user.id}
                    className={`grid grid-cols-[0.5fr_2fr_1fr_1.2fr_1fr_1fr_0.8fr] ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    } h-16 items-center px-6 border-b border-gray-200 last:border-b-0 text-sm hover:bg-teal-50 transition-colors duration-150`}
                  >
                    <div className="text-gray-600 font-medium">{user.id}</div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {user.pictureurl ? (
                          <img
                            src={user.pictureurl}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover border-2 border-teal-600 shadow-sm"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23047857"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white font-bold text-sm shadow-sm border-2 border-teal-600">
                            {user.username?.charAt(0)?.toUpperCase() || '؟'}
                          </div>
                        )}
                      </div>
                      <div className="text-gray-800 font-medium">{user.username}</div>
                    </div>
                    <div className="text-gray-700">{user.idnumber}</div>
                    <div className="text-gray-700">{user.phonenumber}</div>
                    <div className="text-center">
                      <span className="inline-block bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-xs font-medium">
                        {user.role?.name || 'غير محدد'}
                      </span>
                    </div>
                    <div className="text-center text-xs text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                    </div>
                    <div className="text-center flex justify-center gap-3">
                      {canEditUser(user) ? (
                        <>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setNewUser({
                                username: user.username,
                                phonenumber: user.phonenumber,
                                idnumber: user.idnumber,
                                password: '',
                                email: user.email || '',
                                roleId: user.roleId || '',
                                pictureurl: user.pictureurl || '',
                              });
                              setIsEditUserModalOpen(true);
                            }}
                            className="bg-transparent border-none cursor-pointer p-1.5 rounded-lg hover:bg-teal-100 transition-colors duration-150"
                            title="تعديل"
                          >
                            <Edit className="w-5 h-5 text-teal-700 hover:text-teal-900" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteUserModalOpen(true);
                            }}
                            className="bg-transparent border-none cursor-pointer p-1.5 rounded-lg hover:bg-red-100 transition-colors duration-150"
                            title="حذف"
                          >
                            <Trash className="w-5 h-5 text-red-600 hover:text-red-800" />
                          </button>
                        </>
                      ) : (
                        <span 
                          className="inline-block bg-gray-200 text-gray-500 px-3 py-1 rounded-full text-xs font-medium"
                          title="لا يمكنك تعديل أو حذف هذا المستخدم"
                        >
                          محمي
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 font-medium">
                {totalUsers > 0 ? (
                  <>عرض {(currentPage - 1) * 8 + 1}-{Math.min(currentPage * 8, totalUsers)} من {totalUsers} نتيجة</>
                ) : (
                  <>لا توجد نتائج</>
                )}
              </p>
              <nav className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center px-4 py-2 border-2 border-gray-300 bg-white rounded-lg text-sm text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-teal-600 transition-all duration-200"
                >
                  السابق
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`flex items-center justify-center min-w-[40px] h-[40px] px-3 border-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      currentPage === i + 1
                        ? 'border-teal-800 bg-teal-800 text-white shadow-md'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-teal-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center px-4 py-2 border-2 border-gray-300 bg-white rounded-lg text-sm text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-teal-600 transition-all duration-200"
                >
                  التالي
                </button>
              </nav>
            </div>
          </div>
        </section>
        {/* Add User Modal */}
        {isAddUserModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl transform transition-all max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b border-gray-200 pb-4">إضافة مستخدم جديد</h3>
              
              {/* صورة المستخدم */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  {uploadingImage ? (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-teal-600 shadow-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    </div>
                  ) : newUser.pictureurl ? (
                    <img
                      src={newUser.pictureurl}
                      alt="صورة المستخدم"
                      className="w-24 h-24 rounded-full object-cover border-4 border-teal-600 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white font-bold text-3xl shadow-lg border-4 border-teal-600">
                      {newUser.username?.charAt(0)?.toUpperCase() || (
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-center gap-3 w-full">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>رفع صورة</span>
                    </div>
                  </label>
                  
                  {newUser.pictureurl && (
                    <button
                      type="button"
                      onClick={() => setNewUser({ ...newUser, pictureurl: '' })}
                      className="text-red-600 text-sm hover:text-red-800 transition-colors duration-200 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>حذف الصورة</span>
                    </button>
                  )}
                  
                  <p className="text-xs text-gray-500 text-center">
                    الحد الأقصى: 5 ميجابايت | الصيغ المدعومة: JPG, PNG, GIF
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-2 text-gray-700">الاسم</label>
                  <input
                    type="text"
                    placeholder="الاسم الكامل"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="p-3 border-2 border-gray-300 rounded-lg text-right focus:border-teal-600 focus:outline-none transition-colors duration-200"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-2 text-gray-700">رقم الهوية</label>
                  <input
                    type="text"
                    placeholder="رقم الهوية"
                    value={newUser.idnumber}
                    onChange={(e) => setNewUser({ ...newUser, idnumber: e.target.value })}
                    className=" border-2 border-gray-300 rounded-lg text-right focus:border-teal-600 focus:outline-none transition-colors duration-200"
                  />
                </div>
                <div className="flex  flex-col">
                  <label className="text-sm  font-medium mb-2  text-gray-700">المسمى الوظيفي</label>
                  <select
                    value={newUser.roleId}
                    onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
                    className=" border-2 border-gray-300 rounded-lg text-right focus:border-teal-600 focus:outline-none transition-colors duration-200 cursor-pointer"
                  >
                    <option value="">اختر الدور</option>
                    {getAvailableRoles().map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-2 text-gray-700">رقم الجوال</label>
                  <input
                    type="text"
                    placeholder="رقم الجوال"
                    value={newUser.phonenumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      // السماح بـ + في البداية فقط والأرقام، بحد أقصى 15 رقم
                      if (value === '' || /^\+?\d{0,15}$/.test(value)) {
                        setNewUser({ ...newUser, phonenumber: value });
                      }
                    }}
                    maxLength={16}
                    className="p-3 border-2 border-gray-300 rounded-lg text-right focus:border-teal-600 focus:outline-none transition-colors duration-200"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-2 text-gray-700">البريد الإلكتروني</label>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="p-3 border-2 border-gray-300 rounded-lg text-right focus:border-teal-600 focus:outline-none transition-colors duration-200"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-2 text-gray-700">كلمة المرور</label>
                  <input
                    type="password"
                    placeholder="كلمة المرور"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="p-3 border-2 border-gray-300 rounded-lg text-right focus:border-teal-600 focus:outline-none transition-colors duration-200"
                  />
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleAddUser}
                  className="bg-gradient-to-r from-teal-700 to-teal-800 text-white px-8 py-3 rounded-lg text-sm font-medium hover:from-teal-800 hover:to-teal-900 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  حفظ
                </button>
                <button
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="bg-white text-gray-700 border-2 border-gray-300 px-8 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Edit User Modal */}
        {isEditUserModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl transform transition-all max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b border-gray-200 pb-4">تعديل بيانات مستخدم</h3>
              
              {/* صورة المستخدم */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  {uploadingImage ? (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-teal-600 shadow-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    </div>
                  ) : newUser.pictureurl ? (
                    <img
                      src={newUser.pictureurl}
                      alt="صورة المستخدم"
                      className="w-24 h-24 rounded-full object-cover border-4 border-teal-600 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white font-bold text-3xl shadow-lg border-4 border-teal-600">
                      {newUser.username?.charAt(0)?.toUpperCase() || (
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-center gap-3 w-full">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>رفع صورة</span>
                    </div>
                  </label>
                  
                  {newUser.pictureurl && (
                    <button
                      type="button"
                      onClick={() => setNewUser({ ...newUser, pictureurl: '' })}
                      className="text-red-600 text-sm hover:text-red-800 transition-colors duration-200 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>حذف الصورة</span>
                    </button>
                  )}
                  
                  <p className="text-xs text-gray-500 text-center">
                    الحد الأقصى: 5 ميجابايت | الصيغ المدعومة: JPG, PNG, GIF
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-2 text-gray-700">الاسم</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="p-3 border-2 border-gray-300 rounded-lg text-right focus:border-teal-600 focus:outline-none transition-colors duration-200"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-2 text-gray-700">رقم الهوية</label>
                  <input
                    type="text"
                    value={newUser.idnumber}
                    onChange={(e) => setNewUser({ ...newUser, idnumber: e.target.value })}
                    className="p-3 border-2 border-gray-300 rounded-lg text-right focus:border-teal-600 focus:outline-none transition-colors duration-200"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm  font-medium mb-2  text-gray-700">المسمى الوظيفي</label>
                  <select
                    value={newUser.roleId}
                    onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}
                    className="px-9 border-2 border-gray-300 rounded-lg text-right focus:border-teal-600 focus:outline-none transition-colors duration-200 cursor-pointer"
                  >
                    <option value="">اختر الدور</option>
                    {getAvailableRoles().map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-2 text-gray-700">رقم الجوال</label>
                  <input
                    type="text"
                    value={newUser.phonenumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      // السماح بـ + في البداية فقط والأرقام، بحد أقصى 15 رقم
                      if (value === '' || /^\+?\d{0,15}$/.test(value)) {
                        setNewUser({ ...newUser, phonenumber: value });
                      }
                    }}
                    maxLength={16}
                    className="p-3 border-2 border-gray-300 rounded-lg text-right focus:border-teal-600 focus:outline-none transition-colors duration-200"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-2 text-gray-700">البريد الإلكتروني</label>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="p-3 border-2 border-gray-300 rounded-lg text-right focus:border-teal-600 focus:outline-none transition-colors duration-200"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-2 text-gray-700">كلمة المرور (اختياري)</label>
                  <input
                    type="password"
                    placeholder="أدخل كلمة مرور جديدة (اختياري)"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="p-3 border-2 border-gray-300 rounded-lg text-right focus:border-teal-600 focus:outline-none transition-colors duration-200"
                  />
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleEditUser}
                  className="bg-gradient-to-r from-teal-700 to-teal-800 text-white px-8 py-3 rounded-lg text-sm font-medium hover:from-teal-800 hover:to-teal-900 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  حفظ
                </button>
                <button
                  onClick={() => {
                    setIsEditUserModalOpen(false);
                    setSelectedUser(null);
                    setNewUser({ username: '', phonenumber: '', idnumber: '', password: '', email: '', roleId: '', pictureurl: '' });
                  }}
                  className="bg-white text-gray-700 border-2 border-gray-300 px-8 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Delete User Confirmation Modal */}
        {isDeleteUserModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center transform transition-all">
              <div className="mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <Trash className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">تأكيد الحذف</h3>
                <p className="text-base text-gray-600">
                  هل أنت متأكد أنك تريد حذف المستخدم <span className="font-bold text-gray-800">"{selectedUser?.username}"</span>؟
                </p>
                <p className="text-sm text-gray-500 mt-2">لا يمكن التراجع عن هذا الإجراء</p>
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleDeleteUser}
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-lg text-sm font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  تأكيد الحذف
                </button>
                <button
                  onClick={() => {
                    setIsDeleteUserModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="bg-white text-gray-700 border-2 border-gray-300 px-8 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Notification Modal */}
        {isNotificationModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center transform transition-all">
              <div className="mb-6">
                <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${
                  notificationType === 'error' ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {notificationType === 'error' ? (
                    <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <p className={`text-lg font-medium ${notificationType === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                  {notificationMessage}
                </p>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => setIsNotificationModalOpen(false)}
                  className={`px-8 py-3 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg ${
                    notificationType === 'error' 
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                      : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                  }`}
                >
                  موافق
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

export async function getServerSideProps({ req }) {
  try {
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
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
    if (!findUser || !findUser.role?.permissions?.['إدارة المستخدمين']?.['إضافة']) {
      return {
        redirect: { destination: '/admin/home', permanent: false },
      };
    }

    return { props: { currentUserRole: findUser.role?.name?.toLowerCase() || '' } };
  } catch (err) {
    console.error('Authorization error:', err);
    return {
      redirect: { destination: '/admin/home', permanent: false },
    };
  }
};