import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import axios from 'axios';
import Style from "styles/Home.module.css";
import Layout from 'example/containers/Layout';
import { Plus, Search, X, Edit2, Trash2 } from 'lucide-react';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';
import { getSuccessMessage, getErrorMessage } from 'utils/translations';

// Type definitions
interface EmailItem {
  id: number;
  email: string;
  department: string | null;
  createdAt: string;
  User?: {
    username: string;
  } | null;
}

interface InitialData {
  emails: EmailItem[];
}

interface DashboardProps {
  hasPermission: boolean;
  initialData: InitialData;
}

export default function EmailList({ hasPermission, initialData }: DashboardProps) {
  const [userName, setUserName] = useState('');
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const decoded = jwtDecode(token);
    setUserName(decoded.username);
  }, []);

  const [emails, setEmails] = useState<EmailItem[]>(initialData?.emails || []);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalMessage, setModalMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(!hasPermission);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [editFormData, setEditFormData] = useState({ email: '', department: '', userId: '' });
  const [addFormData, setAddFormData] = useState({ email: '', department: '', userId: '' });
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);

  const router = useRouter();

  // Client-side filtering
  const filterEmails = () => {
    let filtered = [...emails];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(email =>
        email.email?.toLowerCase().includes(term) ||
        email.department?.toLowerCase().includes(term) ||
        email.User?.username?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const getPaginatedEmails = () => {
    const filtered = filterEmails();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return {
      emails: filtered.slice(startIndex, endIndex),
      totalCount: filtered.length
    };
  };

  const { emails: paginatedEmails, totalCount } = getPaginatedEmails();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleEdit = (email: EmailItem) => {
    setSelectedEmail(email);
    setEditFormData({
      email: email.email || '',
      department: email.department || '',
      userId: ''
    });
    setShowEditModal(true);
  };

  const handleDelete = (email: EmailItem) => {
    setSelectedEmail(email);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedEmail) return;

    try {
      const response = await axios.delete(`/api/addEmails?id=${selectedEmail.id}`);
      if (response.status === 200) {
        setModalMessage(getSuccessMessage('emailDeleted') || 'تم حذف البريد الإلكتروني بنجاح');
        setShowSuccessModal(true);
        setShowDeleteModal(false);
        // Refresh data
        const res = await axios.get('/api/addEmails');
        if (res.status === 200) {
          setEmails(res.data);
        }
      }
    } catch (error) {
      setModalMessage(getErrorMessage('generalError') || 'حدث خطأ أثناء حذف البريد الإلكتروني');
      setShowErrorModal(true);
      setShowDeleteModal(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedEmail) return;

    try {
      const response = await axios.patch('/api/addEmails', {
        id: selectedEmail.id,
        email: editFormData.email,
        department: editFormData.department || null,
        userId: editFormData.userId || null
      });

      if (response.status === 200) {
        setModalMessage(getSuccessMessage('emailUpdated') || 'تم تحديث البريد الإلكتروني بنجاح');
        setShowSuccessModal(true);
        setShowEditModal(false);
        // Refresh data
        const res = await axios.get('/api/addEmails');
        if (res.status === 200) {
          setEmails(res.data);
        }
      }
    } catch (error: any) {
      setModalMessage(error.response?.data?.message || getErrorMessage('generalError') || 'حدث خطأ أثناء تحديث البريد الإلكتروني');
      setShowErrorModal(true);
    }
  };

  const handleAdd = async () => {
    try {
      const response = await axios.post('/api/addEmails', {
        email: addFormData.email,
        department: addFormData.department || null,
        userId: addFormData.userId || null
      });

      if (response.status === 201) {
        setModalMessage(getSuccessMessage('emailAdded') || 'تم إضافة البريد الإلكتروني بنجاح');
        setShowSuccessModal(true);
        setShowAddModal(false);
        setAddFormData({ email: '', department: '', userId: '' });
        // Refresh data
        const res = await axios.get('/api/addEmails');
        if (res.status === 200) {
          setEmails(res.data);
        }
      }
    } catch (error: any) {
      setModalMessage(error.response?.data?.message || getErrorMessage('generalError') || 'حدث خطأ أثناء إضافة البريد الإلكتروني');
      setShowErrorModal(true);
    }
  };

  const searchUsers = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setUserSuggestions([]);
      setShowUserSuggestions(false);
      return;
    }

    try {
      const response = await axios.get(`/api/addEmails?searchUser=${searchTerm}`);
      if (response.status === 200) {
        setUserSuggestions(response.data);
        setShowUserSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleUserSearchChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const value = e.target.value;
    if (isEdit) {
      setEditFormData({ ...editFormData, userId: value });
    } else {
      setAddFormData({ ...addFormData, userId: value });
    }
    
    if (value.trim()) {
      searchUsers(value);
    } else {
      setUserSuggestions([]);
      setShowUserSuggestions(false);
    }
  };

  const handleUserSuggestionClick = (user: any, isEdit: boolean = false) => {
    if (isEdit) {
      setEditFormData({ ...editFormData, userId: user.id.toString() });
    } else {
      setAddFormData({ ...addFormData, userId: user.id.toString() });
    }
    setShowUserSuggestions(false);
  };

  // Helper function to convert ArrayBuffer to base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Export to PDF
  const exportToPDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Load logo
    const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
    const logoBuffer = await logo.arrayBuffer();
    const logoBase64 = arrayBufferToBase64(logoBuffer);

    try {
      const response = await fetch('/fonts/Amiri-Regular.ttf');
      if (!response.ok) throw new Error('Failed to fetch font');
      const fontBuffer = await response.arrayBuffer();
      const fontBase64 = arrayBufferToBase64(fontBuffer);
      doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
      doc.setFont('Amiri', 'normal');
    } catch (error) {
      console.error('Error loading Amiri font:', error);
      setModalMessage('خطأ في تحميل الخط العربي');
      setShowErrorModal(true);
      return;
    }

    doc.setLanguage('ar');
    doc.setFontSize(12);

    const tableColumn = ['المستخدم', 'القسم', 'البريد الإلكتروني', 'رقم السجل'];
    const tableRows = emails.map((row: EmailItem) => [
      row.User?.username || 'غير متوفر',
      row.department || 'غير متوفر',
      row.email || 'غير متوفر',
      row.id.toString() || 'غير متوفر',
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
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
        halign: 'right',
      },
      margin: { top: 39, right: 10, left: 10 },

      didDrawPage: (data: any) => {
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

        if (doc.getCurrentPageInfo().pageNumber === 1) {
          doc.setFontSize(12);
          doc.setFont('Amiri', 'normal');
          doc.text('قائمة البريد الإلكتروني', pageWidth / 2, 20, { align: 'right' });
        }

        doc.setFontSize(10);
        doc.setFont('Amiri', 'normal');

        doc.text(userName, 10, pageHeight - 10, { align: 'left' });

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

      didParseCell: (data: any) => {
        data.cell.styles.halign = 'right';
      },
    });

    doc.save('email_list.pdf');
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('قائمة البريد الإلكتروني', { properties: { defaultColWidth: 20 } });
    
    worksheet.columns = [
      { header: 'رقم السجل', key: 'id', width: 15 },
      { header: 'البريد الإلكتروني', key: 'email', width: 30 },
      { header: 'القسم', key: 'department', width: 20 },
      { header: 'المستخدم', key: 'username', width: 20 },
      { header: 'تاريخ الإضافة', key: 'createdAt', width: 20 },
    ];

    worksheet.getRow(1).font = { name: 'Amiri', size: 12 };
    worksheet.getRow(1).alignment = { horizontal: 'right' };

    emails.forEach((row: EmailItem) => {
      worksheet.addRow({
        id: row.id || 'غير متوفر',
        email: row.email || 'غير متوفر',
        department: row.department || 'غير متوفر',
        username: row.User?.username || 'غير متوفر',
        createdAt: row.createdAt ? new Date(row.createdAt).toLocaleDateString('ar-EG') : 'غير متوفر',
      }).alignment = { horizontal: 'right' };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email_list.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Client-side authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/admin/login');
          return;
        }

        const response = await axios.post('/api/verify-permissions');

        if (!response.data.hasPermission) {
          setShowPermissionModal(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [router]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const startRecord = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <a
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-2 py-1 border rounded text-sm ${
            i === currentPage
              ? 'border-teal-900 bg-teal-900 text-white'
              : 'border-gray-300 bg-gray-50'
          }`}
        >
          {i}
        </a>
      );
    }
    return (
      <div className="flex justify-between items-center mt-6">
        <span className="text-base">
          عرض {startRecord}-{endRecord} من {totalCount} نتيجة
        </span>
        <nav className="flex gap-1">
          <a
            href="#"
            onClick={() => handlePageChange(currentPage - 1)}
            className={`px-2 py-1 border border-gray-300 rounded bg-gray-50 text-sm ${
              currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            السابق
          </a>
          {pages}
          <a
            href="#"
            onClick={() => handlePageChange(currentPage + 1)}
            className={`px-2 py-1 border border-gray-300 rounded bg-gray-50 text-sm ${
              currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            التالي
          </a>
        </nav>
      </div>
    );
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setModalMessage("");
  };

  const closePermissionModal = () => {
    setShowPermissionModal(false);
    router.push('/admin/home');
  };

  const renderEmailList = () => (
    <div className="p-6 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-normal">قائمة البريد الإلكتروني</h1>
        <button
          className="flex items-center gap-2 bg-teal-900 text-white px-4 py-2 rounded hover:bg-teal-800 transition duration-200"
          onClick={() => setShowAddModal(true)}
        >
          <Plus />
          <span>إضافة بريد إلكتروني</span>
        </button>
      </div>
      <div className="bg-white border border-gray-300 rounded p-6">
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="flex items-center border-none rounded bg-gray-50 p-2">
            <input
              type="text"
              placeholder="بحث"
              value={searchTerm}
              onChange={handleSearchChange}
              className="bg-transparent border-none w-48 text-right"
            />
            <Search />
          </div>
          <button
            className="bg-teal-900 text-white px-2 rounded hover:bg-teal-800 transition duration-200"
            onClick={() => {
              setSearchTerm("");
              setCurrentPage(1);
            }}
          >
            إعادة ضبط
          </button>
        </div>
        <div className="flex gap-4 justify-end mb-9">
          <button
            className="flex items-center gap-1 bg-teal-900 text-white px-3 py-1 rounded text-sm hover:bg-teal-800 transition duration-200"
            onClick={exportToPDF}
          >
            <FilePdfOutlined />
            <span>PDF</span>
          </button>
          <button
            className="flex items-center gap-1 bg-teal-900 text-white px-3 py-1 rounded text-sm hover:bg-teal-800 transition duration-200"
            onClick={exportToExcel}
          >
            <FileExcelOutlined />
            <span>Excel</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center">جارٍ التحميل...</div>
          ) : (
            <table className="w-full text-right text-sm" dir="rtl">
              <thead className="bg-teal-900 text-white">
                <tr>
                  <th className="p-4 text-center">الإجراءات</th>
                  <th className="p-4 text-center">المستخدم</th>
                  <th className="p-4 text-center">القسم</th>
                  <th className="p-4 text-center">البريد الإلكتروني</th>
                  <th className="p-4 text-center">رقم السجل</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmails.map((row) => (
                  <tr key={row.id} className="bg-gray-50 hover:bg-gray-100">
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          className="p-1 text-teal-900 hover:text-teal-700"
                          onClick={() => handleEdit(row)}
                          title="تعديل"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 text-red-600 hover:text-red-800"
                          onClick={() => handleDelete(row)}
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-center">{row.User?.username || 'غير متوفر'}</td>
                    <td className="p-4 text-center">{row.department || 'غير متوفر'}</td>
                    <td className="p-4 text-center">{row.email || 'غير متوفر'}</td>
                    <td className="p-4 text-center">#{row.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {renderPagination()}
      </div>
    </div>
  );

  return (
    <Layout>
      <Head>
        <title>قائمة البريد الإلكتروني</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className={`text-gray-800 ${Style["tajawal-regular"]}`}>
        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-center relative">
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                onClick={() => {
                  setShowAddModal(false);
                  setAddFormData({ email: '', department: '', userId: '' });
                }}
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold mb-4 text-teal-900">إضافة بريد إلكتروني</h2>
              <div className="flex flex-col gap-3 text-right">
                <div>
                  <label className="block mb-1 text-sm font-medium">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={addFormData.email}
                    onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md text-right"
                    placeholder="example@email.com"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">القسم</label>
                  <input
                    type="text"
                    value={addFormData.department}
                    onChange={(e) => setAddFormData({ ...addFormData, department: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md text-right"
                    placeholder="القسم (اختياري)"
                  />
                </div>
                <div className="relative">
                  <label className="block mb-1 text-sm font-medium">المستخدم (اختياري)</label>
                  <input
                    type="text"
                    value={addFormData.userId}
                    onChange={(e) => handleUserSearchChange(e, false)}
                    className="w-full p-3 border border-gray-300 rounded-md text-right"
                    placeholder="ابحث عن مستخدم"
                  />
                  {showUserSuggestions && userSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {userSuggestions.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleUserSuggestionClick(user, false)}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                        >
                          <div className="font-medium text-md">{user.username}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-4">
                  <button
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition duration-200"
                    onClick={() => {
                      setShowAddModal(false);
                      setAddFormData({ email: '', department: '', userId: '' });
                    }}
                  >
                    إلغاء
                  </button>
                  <button
                    className="bg-teal-900 text-white px-4 py-2 rounded hover:bg-teal-800 transition duration-200"
                    onClick={handleAdd}
                  >
                    إضافة
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedEmail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-center relative">
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEmail(null);
                }}
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold mb-4 text-teal-900">تعديل بريد إلكتروني</h2>
              <div className="flex flex-col gap-3 text-right">
                <div>
                  <label className="block mb-1 text-sm font-medium">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md text-right"
                    placeholder="example@email.com"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">القسم</label>
                  <input
                    type="text"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md text-right"
                    placeholder="القسم (اختياري)"
                  />
                </div>
                <div className="relative">
                  <label className="block mb-1 text-sm font-medium">المستخدم (اختياري)</label>
                  <input
                    type="text"
                    value={editFormData.userId}
                    onChange={(e) => handleUserSearchChange(e, true)}
                    className="w-full p-3 border border-gray-300 rounded-md text-right"
                    placeholder="ابحث عن مستخدم"
                  />
                  {showUserSuggestions && userSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {userSuggestions.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleUserSuggestionClick(user, true)}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                        >
                          <div className="font-medium text-md">{user.username}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-4">
                  <button
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition duration-200"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedEmail(null);
                    }}
                  >
                    إلغاء
                  </button>
                  <button
                    className="bg-teal-900 text-white px-4 py-2 rounded hover:bg-teal-800 transition duration-200"
                    onClick={handleUpdate}
                  >
                    حفظ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedEmail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center relative">
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedEmail(null);
                }}
              >
                <X className="w-5 h-5" />
              </button>
              <p className="mb-4">هل أنت متأكد من حذف البريد الإلكتروني {selectedEmail.email}؟</p>
              <div className="flex justify-between mt-4">
                <button
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition duration-200"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedEmail(null);
                  }}
                >
                  إلغاء
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition duration-200"
                  onClick={confirmDelete}
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        )}

        {(showSuccessModal || showErrorModal || showPermissionModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center">
            {showPermissionModal ? (
              <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center relative">
                <button
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                  onClick={closePermissionModal}
                >
                  <X className="w-5 h-5" />
                </button>
                <p className="text-red-600">غير مصرح لك بعرض هذه الصفحة</p>
                <button
                  className="bg-teal-900 text-white px-4 py-2 rounded mt-4 hover:bg-teal-800 transition duration-200"
                  onClick={closePermissionModal}
                >
                  موافق
                </button>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center relative">
                <button
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                  onClick={closeModal}
                >
                  <X className="w-5 h-5" />
                </button>
                <p className={showSuccessModal ? "text-teal-900" : "text-red-600"}>{modalMessage}</p>
                <button
                  className="bg-teal-900 text-white px-4 py-2 rounded mt-4 hover:bg-teal-800 transition duration-200"
                  onClick={closeModal}
                >
                  موافق
                </button>
              </div>
            )}
          </div>
        )}

        {hasPermission ? renderEmailList() : (
          <div className="p-6 min-h-screen">
            <h1 className="text-3xl font-normal"></h1>
            <p className="text-gray-600 mt-4">غير مصرح.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Helper function to serialize dates
const serializeDates = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serializeDates);
  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const key in obj) {
      serialized[key] = serializeDates(obj[key]);
    }
    return serialized;
  }
  return obj;
};

export async function getStaticProps() {
  try {
    const emails = await prisma.emaillist.findMany({
      select: {
        id: true,
        email: true,
        department: true,
        createdAt: true,
        User: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const serializedData = {
      emails: serializeDates(emails)
    };

    return {
      props: {
        hasPermission: true,
        initialData: serializedData
      },
      revalidate: 15,
    };
  } catch (err) {
    console.error("Static generation error:", err);
    return {
      props: {
        hasPermission: false,
        initialData: {
          emails: []
        }
      },
    };
  }
}

