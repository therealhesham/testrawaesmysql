'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from 'example/containers/Layout';
import { GetServerSidePropsContext } from 'next';
import { jwtDecode } from 'jwt-decode';
import prisma from 'lib/prisma';
import { Plus, Eye, Edit, CheckCircle, XCircle, Clock, Loader2, X } from 'lucide-react';

interface Complaint {
  id: number;
  title: string | null;
  description: string | null;
  screenshot: string | null;
  status: string;
  createdBy: {
    id: number;
    username: string;
    pictureurl: string | null;
  };
  assignedTo: {
    id: number;
    username: string;
    pictureurl: string | null;
  } | null;
  resolutionNotes: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function ComplaintsPage({ id, isITUser }: { id: number; isITUser: boolean }) {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await fetch('/api/complaints');
      const data = await response.json();
      if (response.ok) {
        setComplaints(data.complaints);
      } else {
        setError(data.error || 'حدث خطأ أثناء جلب الشكاوى');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء جلب الشكاوى');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'قيد الانتظار', icon: Clock },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'قيد المعالجة', icon: Loader2 },
      resolved: { bg: 'bg-green-100', text: 'text-green-800', label: 'تم الحل', icon: CheckCircle },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'مغلقة', icon: XCircle },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleUpdate = async () => {
    if (!selectedComplaint) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/complaints/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedComplaint.id,
          status: updateStatus,
          resolutionNotes: updateNotes,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        await fetchComplaints();
        setShowUpdateModal(false);
        setSelectedComplaint(null);
        setUpdateStatus('');
        setUpdateNotes('');
      } else {
        setError(data.error || 'حدث خطأ أثناء تحديث الشكوى');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحديث الشكوى');
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setUpdateStatus(complaint.status);
    setUpdateNotes(complaint.resolutionNotes || '');
    setShowUpdateModal(true);
  };

  const openDetailsModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-900 mx-auto mb-4"></div>
            <p className="text-teal-900 text-lg">جاري التحميل...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl md:text-4xl font-normal text-black">الشكاوى</h1>

              <button
                onClick={() => router.push('/admin/complaints/create')}
                className="inline-flex items-center gap-2 bg-teal-900 text-white px-4 py-2 rounded text-md font-tajawal"
              >
                <Plus className="w-5 h-5" />
                <span>إنشاء شكوى جديدة</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 max-w-3xl mx-auto p-4 bg-red-50 border border-red-200 rounded text-red-700 text-center">
              {error}
            </div>
          )}

          <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden max-w-6xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right">
                <thead>
                  <tr className="bg-teal-900">
                    <th className="px-6 py-4 text-right text-md font-normal text-white whitespace-nowrap">
                      العنوان
                    </th>
                    <th className="px-6 py-4 text-right text-md font-normal text-white whitespace-nowrap">
                      منشئ الشكوى
                    </th>
                    <th className="px-6 py-4 text-right text-md font-normal text-white whitespace-nowrap">
                      الحالة
                    </th>
                    <th className="px-6 py-4 text-right text-md font-normal text-white whitespace-nowrap">
                      تاريخ الإنشاء
                    </th>
                    {isITUser && (
                      <th className="px-6 py-4 text-right text-md font-normal text-white whitespace-nowrap">
                        المسؤول
                      </th>
                    )}
                    <th className="px-6 py-4 text-right text-md font-normal text-white whitespace-nowrap">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan={isITUser ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                        لا توجد شكاوى
                      </td>
                    </tr>
                  ) : (
                    complaints.map((complaint) => (
                      <tr key={complaint.id} className="bg-gray-50 border-b border-gray-300 last:border-b-0">
                        <td className="px-6 py-4">
                          <div className="text-md text-gray-800">{complaint.title || '-'}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs mt-1">
                            {complaint.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-md text-gray-800">
                          {complaint.createdBy.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(complaint.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-md text-gray-800">
                          {formatDate(complaint.createdAt)}
                        </td>
                        {isITUser && (
                          <td className="px-6 py-4 whitespace-nowrap text-md text-gray-800">
                            {complaint.assignedTo?.username || '-'}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-md font-medium">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openDetailsModal(complaint)}
                              className="text-teal-900 hover:text-teal-700 p-2 hover:bg-gray-100 rounded transition-colors"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {isITUser && (
                              <button
                                onClick={() => openUpdateModal(complaint)}
                                className="text-teal-900 hover:text-teal-700 p-2 hover:bg-gray-100 rounded transition-colors"
                                title="تحديث الحالة"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedComplaint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
              <div className="mb-4 pb-4 border-b border-gray-300 flex justify-between items-center">
                <h2 className="text-xl font-bold text-black">تفاصيل الشكوى</h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedComplaint(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">العنوان</label>
                    <p className="text-gray-900 text-lg">{selectedComplaint.title || '-'}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">الوصف</label>
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{selectedComplaint.description || '-'}</p>
                  </div>

                  {selectedComplaint.screenshot && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Screenshot</label>
                      <div className="flex justify-center">
                        <img
                          src={selectedComplaint.screenshot}
                          alt="Screenshot"
                          className="max-w-full h-auto rounded-lg border border-gray-300 shadow-md"
                        />
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">الحالة</label>
                    <div className="flex justify-start">
                      {getStatusBadge(selectedComplaint.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">منشئ الشكوى</label>
                      <p className="text-gray-900">{selectedComplaint.createdBy.username}</p>
                    </div>

                    {selectedComplaint.assignedTo && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">المسؤول</label>
                        <p className="text-gray-900">{selectedComplaint.assignedTo.username}</p>
                      </div>
                    )}
                  </div>

                  {selectedComplaint.resolutionNotes && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-300">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">ملاحظات الحل</label>
                      <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{selectedComplaint.resolutionNotes}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">تاريخ الإنشاء</label>
                      <p className="text-gray-900">{formatDate(selectedComplaint.createdAt)}</p>
                    </div>

                    {selectedComplaint.resolvedAt && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">تاريخ الحل</label>
                        <p className="text-gray-900">{formatDate(selectedComplaint.resolvedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Modal */}
        {showUpdateModal && selectedComplaint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded p-6 w-full max-w-2xl relative">
              <div className="mb-4 pb-4 border-b border-gray-300 flex justify-between items-center">
                <h2 className="text-xl font-bold text-black">تحديث الشكوى</h2>
                <button
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedComplaint(null);
                    setUpdateStatus('');
                    setUpdateNotes('');
                  }}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">الحالة</label>
                    <select
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-900 focus:border-teal-900 transition-all"
                    >
                      <option value="pending">قيد الانتظار</option>
                      <option value="in_progress">قيد المعالجة</option>
                      <option value="resolved">تم الحل</option>
                      <option value="closed">مغلقة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">ملاحظات الحل</label>
                    <textarea
                      value={updateNotes}
                      onChange={(e) => setUpdateNotes(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-900 focus:border-teal-900 transition-all resize-none"
                      placeholder="أدخل ملاحظات الحل..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleUpdate}
                      disabled={updating}
                      className="flex-1 bg-teal-900 text-white px-6 py-3 rounded hover:bg-teal-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors text-md font-tajawal"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>جاري التحديث...</span>
                        </>
                      ) : (
                        <span>تحديث</span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowUpdateModal(false);
                        setSelectedComplaint(null);
                        setUpdateStatus('');
                        setUpdateNotes('');
                      }}
                      className="px-6 py-3 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-md font-tajawal"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
    const user = await prisma.user.findUnique({
      where: { id: Number(token.id) },
      include: { role: true }
    });

    if (!user) {
      return { redirect: { destination: '/admin/login', permanent: false } };
    }

    const isITUser = user.role?.name?.toLowerCase().includes('it') ||
                     user.role?.name?.toLowerCase().includes('تقنية') ||
                     user.role?.name?.toLowerCase().includes('نظم');

    return { props: { id: Number(token.id), isITUser } };
  } catch (err) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
}

