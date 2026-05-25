'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Styles from 'styles/Home.module.css';
import { GetServerSidePropsContext } from 'next';
import { jwtDecode } from 'jwt-decode';
import AddProfessionModal from '../../components/AddProfessionModal';
import prisma from 'lib/prisma';
import { getBookingQuotaWindow } from 'lib/bookingGenderQuota';
import Layout from 'example/containers/Layout';
import { GripVertical, Plus, Edit, Trash2, Save, X, CheckCircle, XCircle, Eye, EyeOff, Upload, MessageSquare, Pencil } from 'lucide-react';
import { FaStethoscope } from 'react-icons/fa';
interface UserData {
  id: string;
  jobTitle: string;
  name: string;
  phone: string;
  email: string;
  pictureurl: string;
}



interface ProfilePermissions {
  canManageTimeline: boolean;
  canManageProfessions: boolean;
  canManageOffices: boolean;
  canManageComplaints: boolean;
}

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

export default function Profile({ id, permissions }: { id: number, permissions: ProfilePermissions }) {
  const router = useRouter();
  const [formData, setFormData] = useState<UserData>({
    id: '',
    jobTitle: '',
    name: '',
    phone: '',
    email: '',
    pictureurl: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [hasPassword, setHasPassword] = useState<boolean>(true); // assume true until fetched

  const [fileName, setFileName] = useState('ارفاق ملف');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [originalFormData, setOriginalFormData] = useState<UserData>({
    id: '',
    jobTitle: '',
    name: '',
    phone: '',
    email: '',
    pictureurl: '',
  });
  
  // Set default active tab based on permissions
  const getDefaultTab = () => {
    return 'complaints'; // Default to complaints (الدعم الفني) for all users
  };
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  
  // Complaints state
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    title: '',
    description: '',
    screenshot: ''
  });
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [complaintStats, setComplaintStats] = useState<any>({});


  // Complaints functions
  const fetchComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const res = await fetch('/api/complaints?myComplaints=true');
      const data = await res.json();
      if (data.success) {
        setComplaints(data.complaints || []);
        setComplaintStats(data.stats || {});
      }
    } catch (e) {
      console.error('فشل جلب الدعم فني');
      setError('فشل في جلب الدعم فني');
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleOpenComplaintModal = () => {
    setComplaintForm({ title: '', description: '', screenshot: '' });
    setIsComplaintModalOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseComplaintModal = () => {
    setIsComplaintModalOpen(false);
    setComplaintForm({ title: '', description: '', screenshot: '' });
    setError(null);
    setSuccess(null);
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingScreenshot(true);
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('الملف ليس صورة صالحة');
      setUploadingScreenshot(false);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('حجم الصورة أكبر من 10 ميغابايت');
      setUploadingScreenshot(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];

      try {
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64, filename: file.name }),
        });

        const json = await res.json();

        if (res.ok && json.url) {
          setComplaintForm((prev) => ({ ...prev, screenshot: json.url }));
          setSuccess('تم رفع الصورة بنجاح!');
          setTimeout(() => setSuccess(null), 2000);
        } else {
          setError(json.error || 'فشل في رفع الصورة');
        }
      } catch (err) {
        setError('خطأ في الاتصال بالخادم');
      } finally {
        setUploadingScreenshot(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleSubmitComplaint = async () => {
    if (!complaintForm.title.trim() || !complaintForm.description.trim()) {
      setError('العنوان والوصف مطلوبان');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complaintForm),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشل في إرسال الشكوى');
      }

      setSuccess('تم إرسال الشكوى بنجاح! سيتم الرد عليك قريباً');
      await fetchComplaints();
      setTimeout(() => {
        handleCloseComplaintModal();
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'حدث خطأ أثناء إرسال الشكوى');
    } finally {
      setSaving(false);
    }
  };
  

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: 'قيد المعالجة', color: 'bg-blue-100 text-blue-800' },
      resolved: { label: 'تم الحل', color: 'bg-green-100 text-green-800' },
      closed: { label: 'مغلقة', color: 'bg-gray-100 text-gray-800' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  useEffect(() => {
    if (activeTab === 'complaints') {
      fetchComplaints();
    }
  }, [activeTab]);

  // جلب بيانات المستخدم
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${id}`);
        const data = await res.json();
        const userData = {
          id: data.id?.toString() || '',
          jobTitle: data.role?.name || '',
          name: data.username || '',
          phone: data.phonenumber || '',
          email: data.email || '',
          pictureurl: data.pictureurl || '',
        };
        setFormData(userData);
        setOriginalFormData(userData);
        setHasPassword(data.hasPassword === true);
      } catch (err) {
        console.error('فشل جلب بيانات المستخدم');
      }
    };
    fetchUser();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // رفع الصورة
  const uploadImageToBackend = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);
    setError(null);
    setSuccess(null);

    // التحقق من الصيغة والحجم
    if (!file.type.startsWith('image/')) {
      setError('الملف ليس صورة صالحة');
      setUploading(false);
      return;
    }
    if (file.size > 32 * 1024 * 1024) {
      setError('حجم الصورة أكبر من 32 ميغابايت');
      setUploading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];

      try {
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64, filename: file.name }),
        });

        const json = await res.json();

        if (res.ok && json.url) {
          setFormData((prev) => ({ ...prev, pictureurl: json.url }));
          setSuccess('تم رفع الصورة بنجاح!');
          setFileName('ارفاق ملف');
        } else {
          setError(json.error || 'فشل في رفع الصورة');
        }
      } catch (err) {
        setError('خطأ في الاتصال بالخادم');
      } finally {
        setUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  // تفعيل وضع التعديل
  const handleStartEdit = () => {
    setIsEditingProfile(true);
    setError(null);
    setSuccess(null);
  };

  // إلغاء التعديل
  const handleCancelEdit = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    setFormData(originalFormData);
    setIsEditingProfile(false);
    setFileName('ارفاق ملف');
    setError(null);
    setSuccess(null);
  };

// حفظ التعديلات
  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    // التحقق: إذا لديه كلمة مرور ويغيرها، يجب إدخال الحالية. إذا لا يملك كلمة مرور (تعيين أول مرة) لا حاجة للحالية.
    if (passwordData.newPassword) {
      if (hasPassword && !passwordData.currentPassword) {
        setError('يرجى إدخال كلمة المرور الحالية لتأكيد التغيير');
        return;
      }
      if (passwordData.newPassword.length < 4) {
        setError('كلمة المرور الجديدة يجب أن تكون 4 أحرف او أرقام على الأقل');
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmNewPassword) {
        setError('تأكيد كلمة المرور الجديدة غير مطابق');
        return;
      }
    }

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.name,
          phonenumber: formData.phone,
          email: formData.email,
          pictureurl: formData.pictureurl,
          ...(passwordData.newPassword ? {
              currentPassword: hasPassword ? passwordData.currentPassword : undefined,
              newPassword: passwordData.newPassword
          } : {})
        }),
      });

      const data = await res.json(); // قراءة الرد دائماً لمعرفة الخطأ

      if (res.ok) {
        setSuccess('تم حفظ التغييرات بنجاح');
        setOriginalFormData(formData);
        if (passwordData.newPassword) setHasPassword(true);
        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        setIsEditingProfile(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'فشل في الحفظ');
      }
    } catch (err) {
        setError('خطأ في الاتصال');
    }
  };



  return (
    <Layout>
    <div className={`${Styles['tajawal-regular']} min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/30 to-gray-50 p-8`} dir="rtl">
      <main className="max-w-6xl mx-auto">

        {/* رسائل النجاح أو الخطأ */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-r-4 border-red-500 text-red-800 rounded-lg shadow-sm flex items-center gap-3 animate-in slide-in-from-top">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border-r-4 border-green-500 text-green-800 rounded-lg shadow-sm flex items-center gap-3 animate-in slide-in-from-top">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}

        {/* بطاقة معلومات الحساب */}
        <div className="bg-white rounded-2xl p-10 shadow-lg mb-10 border border-teal-100 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-center mb-10">
            <div className="relative">
              <h2 className="text-center text-3xl font-bold text-teal-800">
                معلومات الحساب
              </h2>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-teal-600 rounded-full"></div>
            </div>
          </div>

          {/* الصف الأول */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                ID
              </label>
              <input
                type="text"
                value={formData.id}
                readOnly
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600 cursor-not-allowed transition-all"
              />
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                المسمى الوظيفي
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                readOnly
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600 cursor-not-allowed transition-all"
              />
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                الاسم
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditingProfile}
                className={`w-full px-4 py-3 border border-gray-200 rounded-lg text-sm transition-all ${
                  isEditingProfile 
                    ? 'bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-teal-300' 
                    : 'bg-gray-50 text-gray-600 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          {/* الصف الثاني */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                رقم الهاتف
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditingProfile}
                className={`w-full px-4 py-3 border border-gray-200 rounded-lg text-sm transition-all ${
                  isEditingProfile 
                    ? 'bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-teal-300' 
                    : 'bg-gray-50 text-gray-600 cursor-not-allowed'
                }`}
              />
            </div>
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                البريد الإلكتروني
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditingProfile}
                placeholder="example@email.com"
                className={`w-full px-4 py-3 border border-gray-200 rounded-lg text-sm transition-all ${
                  isEditingProfile 
                    ? 'bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-teal-300' 
                    : 'bg-gray-50 text-gray-600 cursor-not-allowed'
                }`}
              />
            </div>

            {/* رفع الصورة */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                صورة الملف الشخصي
              </label>
              <div className="flex items-center gap-4">
                {/* عرض الصورة إذا وُجدت */}
                {formData.pictureurl && (
                  <div className="flex-shrink-0">
                    <img
                      src={formData.pictureurl}
                      alt="الصورة الشخصية"
                      className="w-16 h-16 object-cover rounded-full border-2 border-teal-200 shadow-sm"
                    />
                  </div>
                )}

                <div className="flex-1">
                  {isEditingProfile ? (
                    <>
                      <label
                        htmlFor="file-upload"
                        className="block w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center text-sm text-gray-700 cursor-pointer hover:bg-teal-50 hover:border-teal-400 transition-all"
                      >
                        {uploading ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                            جاري الرفع...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <Plus size={16} />
                            {fileName === 'ارفاق ملف' ? 'اختيار صورة' : fileName}
                          </span>
                        )}
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={uploadImageToBackend}
                        className="hidden"
                        disabled={uploading}
                      />
                    </>
                  ) : (
                    <div className="w-full px-4 py-3 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 text-center text-sm text-gray-400">
                      <span className="flex items-center justify-center gap-2">
                        <Plus size={16} />
                        اختيار صورة
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* قسم تعيين/تغيير كلمة المرور - يظهر فقط عند التعديل */}
          {isEditingProfile && (
            <div className="mt-6 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                <h3 className="text-lg font-bold text-teal-800 mb-4">
                  {hasPassword ? 'تغيير كلمة المرور (اختياري)' : 'تعيين كلمة المرور (مطلوب لتسجيل الدخول بكلمة المرور)'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {hasPassword && (
                    <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                            كلمة المرور الحالية
                        </label>
                        <input
                            type="password"
                            placeholder="أدخل كلمة المرور الحالية"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                        />
                    </div>
                    )}
                    <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                            {hasPassword ? 'كلمة المرور الجديدة' : 'كلمة المرور'}
                        </label>
                        <input
                            type="password"
                            placeholder={hasPassword ? 'أدخل كلمة المرور الجديدة' : 'أدخل كلمة المرور (6 أحرف على الأقل)'}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                        />
                    </div>
                    <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                            تأكيد {hasPassword ? 'كلمة المرور الجديدة' : 'كلمة المرور'}
                        </label>
                        <input
                            type="password"
                            placeholder="أعد إدخال كلمة المرور"
                            value={passwordData.confirmNewPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                        />
                    </div>
                </div>
            </div>
          )}

          {/* أزرار التعديل والحفظ */}
          <div className="flex justify-center gap-4">
            {!isEditingProfile ? (
              <button
                onClick={handleStartEdit}
                className="group relative bg-teal-700 text-white px-16 py-4 rounded-xl text-base font-semibold hover:bg-teal-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-3"
              >
                <Edit size={20} />
                تعديل البيانات
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="group relative bg-gray-600 text-white px-12 py-4 rounded-xl text-base font-semibold hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-3"
                >
                  <X size={20} />
                  إلغاء
                </button>
                <button
                  onClick={handleSave}
                  className="group relative bg-teal-700 text-white px-12 py-4 rounded-xl text-base font-semibold hover:bg-teal-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-3"
                >
                  <Save size={20} />
                  حفظ التغييرات
                </button>
              </>
            )}
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 shadow-md border border-teal-100">
          <button 
            onClick={() => setActiveTab('complaints')}
            className={`flex-1 py-3 px-6 font-semibold text-sm rounded-lg transition-all duration-200 ${
              activeTab === 'complaints' 
                ? 'bg-teal-700 text-white shadow-md' 
                : 'text-gray-600 hover:text-teal-700 hover:bg-teal-50'
            }`}
          >
            الدعم فني
          </button>
          
          
          
          
        </div>
        {/* Complaints Tab */}
        {activeTab === 'complaints' && (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-teal-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-3xl font-bold text-teal-800 mb-2">دعم فني</h3>
                <p className="text-sm text-gray-600">يمكنك إرسال شكوى للدعم الفني وتتبع حالتها</p>
              </div>
              <button
                onClick={handleOpenComplaintModal}
                className="group bg-teal-700 text-white px-6 py-3 rounded-xl hover:bg-teal-800 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 text-sm font-semibold transform hover:-translate-y-0.5"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                إرسال شكوى جديدة
              </button>
            </div>

            {/* Statistics */}
            {complaintStats.total > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{complaintStats.total || 0}</div>
                  <div className="text-sm font-medium text-gray-600">إجمالي الدعم فني</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border border-yellow-200 hover:shadow-md transition-shadow">
                  <div className="text-3xl font-bold text-yellow-800 mb-1">{complaintStats.byStatus?.pending || 0}</div>
                  <div className="text-sm font-medium text-yellow-700">قيد الانتظار</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 hover:shadow-md transition-shadow">
                  <div className="text-3xl font-bold text-blue-800 mb-1">{complaintStats.byStatus?.in_progress || 0}</div>
                  <div className="text-sm font-medium text-blue-700">قيد المعالجة</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200 hover:shadow-md transition-shadow">
                  <div className="text-3xl font-bold text-green-800 mb-1">{complaintStats.byStatus?.resolved || 0}</div>
                  <div className="text-sm font-medium text-green-700">تم الحل</div>
                </div>
              </div>
            )}

            {loadingComplaints ? (
              <div className="flex flex-col justify-center items-center py-16">
                <div className="animate-spin rounded-full h-14 w-14 border-4 border-teal-200 border-t-teal-800 mb-4"></div>
                <p className="text-gray-600 text-sm">جاري التحميل...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg font-semibold mb-2">لا توجد دعم فني حتى الآن</p>
                <p className="text-gray-400 text-sm">يمكنك إرسال شكوى جديدة من الزر أعلاه</p>
              </div>
            ) : (
              <div className="space-y-5">
                {complaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-teal-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{complaint.title}</h4>
                          {getStatusBadge(complaint.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{complaint.description}</p>
                        {complaint.screenshot && (
                          <div className="mb-3">
                            <a
                              href={complaint.screenshot}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-teal-700 hover:text-teal-800 underline"
                            >
                              عرض الصورة المرفقة
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>تاريخ الإرسال: {new Date(complaint.createdAt).toLocaleDateString('ar-SA')}</span>
                          {complaint.resolvedAt && (
                            <span>تاريخ الحل: {new Date(complaint.resolvedAt).toLocaleDateString('ar-SA')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {complaint.assignedTo && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2">
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
                            <p className="text-xs text-gray-600">{complaint.assignedTo.role?.name}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {complaint.resolutionNotes && (
                      <div className="bg-green-50 rounded-lg p-4 border-r-4 border-green-500">
                        <p className="text-sm font-medium text-green-900 mb-1">ملاحظات الحل:</p>
                        <p className="text-sm text-green-800">{complaint.resolutionNotes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        </main>
    </div>
  </Layout>
  );
}

// getServerSideProps (يبقى كما هو)
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

    // Check specific permissions from the role's permissions JSON
    const rolePermissions = findUser?.role?.permissions as any;
    
    const permissions: ProfilePermissions = {
      canManageTimeline: !!rolePermissions?.["إدارة التايم لاين"]?.["تعديل"],
      canManageProfessions: !!rolePermissions?.["إدارة المهن"]?.["تعديل"],
      canManageOffices: !!rolePermissions?.["إدارة المكاتب الخارجية"]?.["تعديل"],
      canManageComplaints: !!rolePermissions?.["إدارة الدعم فني"]?.["حل"],
    };

    return { props: { id: Number(token.id), permissions } };
  } catch (err) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
}