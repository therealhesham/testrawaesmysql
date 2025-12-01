'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Styles from 'styles/Home.module.css';
import { GetServerSidePropsContext } from 'next';
import { jwtDecode } from 'jwt-decode';
import prisma from 'lib/prisma';
import Layout from 'example/containers/Layout';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  User, 
  Calendar,
  MessageSquare,
  Search,
  Filter,
  Eye,
  Edit,
  Save,
  X
} from 'lucide-react';

interface Complaint {
  id: number;
  title: string;
  description: string;
  screenshot: string | null;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
  createdBy: {
    id: number;
    username: string;
    pictureurl: string | null;
    phonenumber: string | null;
    role: {
      name: string;
    } | null;
  };
  assignedTo: {
    id: number;
    username: string;
    pictureurl: string | null;
    role: {
      name: string;
    } | null;
  } | null;
}

interface ComplaintsPageProps {
  userId: number;
  canManageComplaints: boolean;
}

export default function ComplaintsManagement({ userId, canManageComplaints }: ComplaintsPageProps) {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState<any>({});
  
  // Modal states
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '',
    resolutionNotes: '',
    assignedToId: userId
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, searchTerm, statusFilter]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/complaints');
      const data = await res.json();
      
      if (data.success) {
        setComplaints(data.complaints || []);
        setStats(data.stats || {});
      } else {
        setError('فشل في جلب الشكاوى');
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError('حدث خطأ أثناء جلب الشكاوى');
    } finally {
      setLoading(false);
    }
  };

  const filterComplaints = () => {
    let filtered = [...complaints];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        c.createdBy.username.toLowerCase().includes(term)
      );
    }

    setFilteredComplaints(filtered);
  };

  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsViewModalOpen(true);
  };

  const handleEditComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setEditForm({
      status: complaint.status,
      resolutionNotes: complaint.resolutionNotes || '',
      assignedToId: complaint.assignedTo?.id || userId
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint) return;

    if (editForm.status === 'resolved' && !editForm.resolutionNotes.trim()) {
      setError('يرجى إدخال ملاحظات الحل');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/complaints', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedComplaint.id,
          status: editForm.status,
          resolutionNotes: editForm.resolutionNotes,
          assignedToId: editForm.assignedToId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشل في تحديث الشكوى');
      }

      setSuccess('تم تحديث الشكوى بنجاح');
      await fetchComplaints();
      setIsEditModalOpen(false);
      setSelectedComplaint(null);
    } catch (error: any) {
      setError(error.message || 'حدث خطأ أثناء تحديث الشكوى');
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'in_progress':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'closed':
        return <XCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      in_progress: { label: 'قيد المعالجة', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      resolved: { label: 'تم الحل', color: 'bg-green-100 text-green-800 border-green-200' },
      closed: { label: 'مغلقة', color: 'bg-gray-100 text-gray-800 border-gray-200' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityColor = (createdAt: Date) => {
    const daysSince = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 7) return 'border-r-4 border-red-500';
    if (daysSince > 3) return 'border-r-4 border-orange-500';
    return 'border-r-4 border-blue-500';
  };

  if (!canManageComplaints) {
    return (
      <Layout>
        <div className={`${Styles['tajawal-regular']} min-h-screen p-8`} dir="rtl">
          <div className="max-w-2xl mx-auto text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">غير مصرح</h1>
            <p className="text-gray-600">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`${Styles['tajawal-regular']} min-h-screen p-8`} dir="rtl">
        <main className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الشكاوى</h1>
            <p className="text-gray-600">عرض ومتابعة جميع شكاوى المستخدمين</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
              <CheckCircle size={20} />
              {success}
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">إجمالي الشكاوى</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total || 0}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700 mb-1">قيد الانتظار</p>
                  <p className="text-3xl font-bold text-yellow-800">{stats.byStatus?.pending || 0}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 mb-1">قيد المعالجة</p>
                  <p className="text-3xl font-bold text-blue-800">{stats.byStatus?.in_progress || 0}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 mb-1">تم الحل</p>
                  <p className="text-3xl font-bold text-green-800">{stats.byStatus?.resolved || 0}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="البحث في الشكاوى..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="relative">
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="pending">قيد الانتظار</option>
                  <option value="in_progress">قيد المعالجة</option>
                  <option value="resolved">تم الحل</option>
                  <option value="closed">مغلقة</option>
                </select>
              </div>
            </div>
          </div>

          {/* Complaints List */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-900"></div>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center shadow-sm">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا توجد شكاوى</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className={`bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ${getPriorityColor(complaint.createdAt)}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(complaint.status)}
                        <h3 className="text-lg font-semibold text-gray-900">{complaint.title}</h3>
                        {getStatusBadge(complaint.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <User size={16} />
                          <span>{complaint.createdBy.username}</span>
                          {complaint.createdBy.role && (
                            <span className="text-xs text-gray-400">({complaint.createdBy.role.name})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>{new Date(complaint.createdAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mr-4">
                      <button
                        onClick={() => handleViewComplaint(complaint)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="عرض التفاصيل"
                      >
                        <Eye size={20} />
                      </button>
                      <button
                        onClick={() => handleEditComplaint(complaint)}
                        className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit size={20} />
                      </button>
                    </div>
                  </div>

                  {complaint.assignedTo && (
                    <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
                      {complaint.assignedTo.pictureurl ? (
                        <img
                          src={complaint.assignedTo.pictureurl}
                          alt={complaint.assignedTo.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-teal-800 flex items-center justify-center text-white text-sm">
                          {complaint.assignedTo.username.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">مُسند إلى: {complaint.assignedTo.username}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* View Modal */}
          {isViewModalOpen && selectedComplaint && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">تفاصيل الشكوى</h2>
                    <button
                      onClick={() => setIsViewModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">{selectedComplaint.title}</h3>
                      {getStatusBadge(selectedComplaint.status)}
                    </div>
                    <p className="text-gray-700 leading-relaxed">{selectedComplaint.description}</p>
                  </div>

                  {selectedComplaint.screenshot && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">الصورة المرفقة:</h4>
                      <img
                        src={selectedComplaint.screenshot}
                        alt="Screenshot"
                        className="w-full rounded-lg border"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">تم الإرسال بواسطة</p>
                      <div className="flex items-center gap-2">
                        {selectedComplaint.createdBy.pictureurl ? (
                          <img
                            src={selectedComplaint.createdBy.pictureurl}
                            alt={selectedComplaint.createdBy.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-teal-800 flex items-center justify-center text-white">
                            {selectedComplaint.createdBy.username.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{selectedComplaint.createdBy.username}</p>
                          <p className="text-xs text-gray-600">{selectedComplaint.createdBy.role?.name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">تاريخ الإرسال</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedComplaint.createdAt).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {selectedComplaint.assignedTo && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-700 mb-2">مُسند إلى:</p>
                      <div className="flex items-center gap-2">
                        {selectedComplaint.assignedTo.pictureurl ? (
                          <img
                            src={selectedComplaint.assignedTo.pictureurl}
                            alt={selectedComplaint.assignedTo.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-teal-800 flex items-center justify-center text-white">
                            {selectedComplaint.assignedTo.username.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{selectedComplaint.assignedTo.username}</p>
                          <p className="text-xs text-gray-600">{selectedComplaint.assignedTo.role?.name}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedComplaint.resolutionNotes && (
                    <div className="bg-green-50 rounded-lg p-4 border-r-4 border-green-500">
                      <p className="text-sm font-medium text-green-900 mb-2">ملاحظات الحل:</p>
                      <p className="text-green-800">{selectedComplaint.resolutionNotes}</p>
                      {selectedComplaint.resolvedAt && (
                        <p className="text-xs text-green-700 mt-2">
                          تم الحل في: {new Date(selectedComplaint.resolvedAt).toLocaleDateString('ar-SA')}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {isEditModalOpen && selectedComplaint && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">تعديل الشكوى</h2>
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedComplaint.title}</h3>
                    <p className="text-gray-600">{selectedComplaint.description}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الحالة <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="pending">قيد الانتظار</option>
                      <option value="in_progress">قيد المعالجة</option>
                      <option value="resolved">تم الحل</option>
                      <option value="closed">مغلقة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ملاحظات الحل {editForm.status === 'resolved' && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      value={editForm.resolutionNotes}
                      onChange={(e) => setEditForm({ ...editForm, resolutionNotes: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[120px]"
                      placeholder="اكتب ملاحظات الحل هنا..."
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleUpdateComplaint}
                    disabled={saving}
                    className="px-6 py-2 bg-teal-800 text-white rounded-lg hover:bg-teal-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        حفظ التغييرات
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { req } = context;
  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};

  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const [key, value] = cookie.trim().split('=');
      cookies[key] = decodeURIComponent(value);
    });
  }

  if (!cookies.authToken) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }

  try {
    const token = jwtDecode(cookies.authToken) as any;
    const findUser = await prisma.user.findUnique({
      where: { id: Number(token.id) },
      include: { role: true }
    });

    if (!findUser) {
      return { redirect: { destination: '/admin/login', permanent: false } };
    }

    const rolePermissions = findUser.role?.permissions as any;
    const canManageComplaints = !!rolePermissions?.["إدارة الشكاوى"]?.["حل"];

    return { 
      props: { 
        userId: Number(token.id),
        canManageComplaints
      } 
    };
  } catch (err) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
}
