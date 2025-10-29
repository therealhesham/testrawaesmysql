'use client';

import { useEffect, useState } from 'react';
import Styles from 'styles/Home.module.css';
import { GetServerSidePropsContext } from 'next';
import { jwtDecode } from 'jwt-decode';
import AddProfessionModal from '../../components/AddProfessionModal';
import prisma from 'lib/prisma';
import Layout from 'example/containers/Layout';
interface UserData {
  id: string;
  jobTitle: string;
  name: string;
  phone: string;
  pictureurl: string;
}

export default function Profile({ id, isAdmin }: { id: number, isAdmin: boolean  }) {
  const [formData, setFormData] = useState<UserData>({
    id: '',
    jobTitle: '',
    name: '',
    phone: '',
    pictureurl: '',
  });

  const [professions, setProfessions] = useState<any[]>([]);
  const [fileName, setFileName] = useState('ارفاق ملف');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('professions');

  // جلب المهن
  const fetchProfessions = async () => {
    try {
      const res = await fetch('/api/professions');
      const data = await res.json();
      setProfessions(data);
    } catch (err) {
      console.error('فشل جلب المهن');
    }
  };

  useEffect(() => {
    fetchProfessions();
  }, []);

  // جلب بيانات المستخدم
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${id}`);
        const data = await res.json();
        setFormData({
          id: data.id?.toString() || '',
          jobTitle: data.role?.name || '',
          name: data.username || '',
          phone: data.phonenumber || '',
          pictureurl: data.pictureurl || '',
        });
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

  // حفظ التعديلات
  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.name,
          // idnumber: formData.id,
          phonenumber: formData.phone,
          pictureurl: formData.pictureurl,
        }),
      });

      if (res.ok) {
        setSuccess('تم حفظ التغييرات بنجاح');
      } else {
        const data = await res.json();
        setError(data.error || 'فشل في الحفظ');
      }
    } catch (err) {
        setError('خطأ في الاتصال');
    }
  };

  return (
    <Layout>
    <div className={`${Styles['tajawal-regular']} min-h-screen bg-gray-100 p-8`} dir="rtl">
      <main className="max-w-5xl mx-auto">

        {/* رسائل النجاح أو الخطأ */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
            {success}
          </div>
        )}

        {/* بطاقة معلومات الحساب */}
        <div className="bg-white rounded-lg p-10 shadow-sm mb-8">
          <h2 className="text-center text-2xl font-semibold text-teal-700 mb-10">
            معلومات الحساب
          </h2>

          {/* الصف الأول */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <label className="block text-sm text-gray-700 mb-2">ID</label>
              <input
                type="text"
                value={formData.id}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">المسمى الوظيفي</label>
              <input
                type="text"
                value={formData.jobTitle}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">الاسم</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* الصف الثاني */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <label className="block text-sm text-gray-700 mb-2">رقم الهاتف</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {/* رفع الصورة */}
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-700 mb-2">صورة الملف الشخصي</label>
                
                {/* عرض الصورة إذا وُجدت */}
                {formData.pictureurl && (
                  <div className="mb-3">
                    <img
                      src={formData.pictureurl}
                      alt="الصورة الشخصية"
                      className="w-24 h-24 object-cover rounded-full border"
                    />
                  </div>
                )}

                <label
                  htmlFor="file-upload"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-center text-sm text-gray-700 cursor-pointer hover:bg-gray-100 transition"
                >
                  {uploading ? 'جاري الرفع...' : fileName}
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={uploadImageToBackend}
                  className="hidden"
                  disabled={uploading}
                />
              </div>

              <label
                htmlFor="file-upload"
                className="bg-teal-800 text-white px-8 py-2 rounded-md text-sm cursor-pointer hover:bg-teal-900 transition whitespace-nowrap"
              >
                اختيار ملف
              </label>
            </div>
          </div>

          {/* زر الحفظ */}
          <button
            onClick={handleSave}
            className="block mx-auto bg-teal-800 text-white px-12 py-3 rounded-md text-base font-medium hover:bg-teal-900 transition"
          >
            حفظ التغييرات
          </button>
        </div>
{isAdmin && (
  <>
        {/* Tabs */}
        <div className="flex gap-6 mb-5 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('professions')}
            className={`pb-3 px-6 font-medium text-sm transition ${
              activeTab === 'professions' 
                ? 'text-teal-700 border-b-2 border-teal-700' 
                : 'text-gray-600 hover:text-teal-700'
            }`}
          >
            إدارة المهن
          </button>
          <button 
            onClick={() => setActiveTab('statements')}
            className={`pb-3 px-6 font-medium text-sm transition ${
              activeTab === 'statements' 
                ? 'text-teal-700 border-b-2 border-teal-700' 
                : 'text-gray-600 hover:text-teal-700'
            }`}
          >
            إدارة البيان
          </button>
          <button 
            onClick={() => setActiveTab('offices')}
            className={`pb-3 px-6 font-medium text-sm transition ${
              activeTab === 'offices' 
                ? 'text-teal-700 border-b-2 border-teal-700' 
                : 'text-gray-600 hover:text-teal-700'
            }`}
          >
            إدارة المكاتب الخارجية
          </button>
        </div>
        </>
)}
        {isAdmin && (
          <>  
        {activeTab === 'professions' && (
          <>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mb-5 bg-teal-800 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-teal-900 transition"
            >
              + إضافة مهنة
            </button>

            {/* جدول المهن */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-teal-800 text-white">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-medium">إجراءات</th>
                    <th className="px-6 py-4 text-right text-sm font-medium">المهنة</th>
                    <th className="px-6 py-4 text-right text-sm font-medium">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {professions.map((prof) => (
                    <tr key={prof.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm">
                        <button className="text-gray-600 hover:text-teal-700 mx-1">تعديل</button>
                        <button className="text-red-600 hover:text-red-700 mx-1 text-lg">×</button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">{prof.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">#{prof.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        </>
        )}

        {isAdmin && (
          <>
         
         
        {activeTab === 'statements' && (
          <div className="bg-white rounded-lg p-8 shadow-sm">
          </div>
        )}
 </>
        )}

        {isAdmin && (
          <>

          {activeTab === 'offices' && (
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">إدارة المكاتب الخارجية</h3>
            
       

       
          </div>
        )}
        </>
        )}
        {/* Modal for adding professions */}
        <AddProfessionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            fetchProfessions();
            setSuccess('تم إضافة المهنة بنجاح');
            setTimeout(() => setSuccess(null), 3000);
          }}
        />
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
      let isAdmin = false;
const token = jwtDecode(cookies.authToken) as any;
      const detecIsAdmin = await prisma.user.findUnique({where:{id:Number(token.id)},include:{role:true}})
if(detecIsAdmin?.roleId ==1 ){
  isAdmin = true;
}
  if (!cookies.authToken) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }

  try {
    return { props: { id: Number(token.id), isAdmin } };
  } catch (err) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
}