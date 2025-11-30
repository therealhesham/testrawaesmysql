'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from 'example/containers/Layout';
import { GetServerSidePropsContext } from 'next';
import { jwtDecode } from 'jwt-decode';
import prisma from 'lib/prisma';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import Style from "styles/Home.module.css";
import Head from 'next/head';

export default function CreateComplaint({ id }: { id: number }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      setError('الملف ليس صورة صالحة');
      return;
    }

    // التحقق من الحجم (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('حجم الصورة أكبر من 10 ميغابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setScreenshot(base64);
      setScreenshotPreview(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim() || !description.trim()) {
      setError('العنوان والوصف مطلوبان');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/complaints/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          screenshot: screenshot,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('تم إنشاء الشكوى بنجاح');
        setTimeout(() => {
          router.push('/admin/complaints');
        }, 1500);
      } else {
        setError(data.error || 'حدث خطأ أثناء إنشاء الشكوى');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الشكوى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>إنشاء شكوى جديدة</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <section className={`flex flex-row mx-auto min-h-screen w-full ${Style["tajawal-regular"]}`} dir="rtl">
        <div className="flex-1 flex flex-col w-full max-w-full">
          <main className="p-6 md:p-8 w-full max-w-full">
            <div className="mb-6 w-full">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>رجوع</span>
              </button>
              <h1 className="text-3xl md:text-4xl font-normal text-black mb-6 text-right">
                إنشاء شكوى جديدة
              </h1>
            </div>

            <div className="bg-white border border-gray-300 rounded-lg p-6 md:p-8 lg:p-10 shadow-sm w-full max-w-full">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-right">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-right">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-full" dir="rtl">
                <div className="w-full max-w-full">
                  <label htmlFor="title" className="block text-md font-medium text-gray-700 mb-2 text-right">
                    عنوان الشكوى <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full max-w-full px-4 py-3 border border-gray-300 rounded text-md text-gray-500 text-right bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-900 focus:border-transparent"
                    placeholder="أدخل عنوان الشكوى"
                    required
                  />
                </div>

                <div className="w-full max-w-full">
                  <label htmlFor="description" className="block text-md font-medium text-gray-700 mb-2 text-right">
                    وصف الشكوى <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={8}
                    className="w-full max-w-full px-4 py-3 border border-gray-300 rounded text-md text-gray-500 text-right bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-900 focus:border-transparent resize-y"
                    placeholder="أدخل وصفاً مفصلاً للشكوى"
                    required
                  />
                </div>

                <div className="w-full max-w-full">
                  <label className="block text-md font-medium text-gray-700 mb-2 text-right">
                    Screenshot (اختياري)
                  </label>
                  {!screenshotPreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 md:p-12 lg:p-16 text-center w-full max-w-full">
                      <input
                        type="file"
                        id="screenshot"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="screenshot"
                        className="cursor-pointer flex flex-col items-center gap-2 w-full"
                      >
                        <Upload className="w-10 h-10 text-gray-400" />
                        <span className="text-gray-600 text-md">اضغط لرفع screenshot</span>
                        <span className="text-sm text-gray-500">PNG, JPG, JPEG (حد أقصى 10MB)</span>
                      </label>
                    </div>
                  ) : (
                    <div className="relative w-full max-w-full">
                      <img
                        src={screenshotPreview}
                        alt="Screenshot preview"
                        className="w-full max-h-96 object-contain rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={removeScreenshot}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-teal-900 text-white px-6 py-3 rounded text-md font-tajawal hover:bg-teal-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>جاري الإنشاء...</span>
                      </>
                    ) : (
                      <span>إنشاء الشكوى</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 border border-gray-300 rounded text-md text-gray-800 hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </section>
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
    return { props: { id: Number(token.id) } };
  } catch (err) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
}

