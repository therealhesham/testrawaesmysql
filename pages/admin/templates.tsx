import { useState } from 'react';
import Head from 'next/head';
import Layout from 'example/containers/Layout';
import { Plus, FileText, Upload, ChevronLeft, Type, Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight, AlignJustify, Image, Link } from 'lucide-react';
import { ChevronRightIcon, DocumentTextIcon } from '@heroicons/react/outline';
import Style from "styles/Home.module.css";

// import { DocumentTextIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showAddTemplateModal = () => setIsModalOpen(true);
  const hideAddTemplateModal = () => setIsModalOpen(false);

  return (
    <Layout>
      <Head>
        <title>ادارة القوالب</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <div dir="rtl" className={`min-h-screen bg-gray-100 flex justify-center items-start max-w-7xl mx-auto p-4 ${Style["tajawal-medium"]}`}>
        <main className="w-full flex flex-col gap-6">
          <section className="flex justify-between items-center">
            <h1 className="text-3xl font-normal text-black">ادارة القوالب</h1>
            <button
              onClick={showAddTemplateModal}
              className="flex items-center gap-2 bg-teal-800 text-white px-3 py-1.5 rounded-md text-sm hover:bg-teal-900"
            >
              <Plus className="w-5 h-5" />
              <span>اضافة قالب</span>
            </button>
          </section>
          <section className="flex gap-8 flex-1 max-[1200px]:flex-col-reverse">
            <div className="flex-1 bg-gray-100 border border-gray-300 rounded-lg p-6 flex flex-col gap-6">
              <div className="flex gap-4">
                <button className="border border-teal-800 text-gray-800 px-4 py-1 rounded text-sm hover:bg-gray-200">تعديل</button>
                <button className="flex items-center gap-1 bg-teal-800 text-white px-4 py-1 rounded text-sm hover:bg-teal-900">
                  <FileText className="w-4 h-4" />
                  <span>PDF</span>
                </button>
              </div>
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-8 flex flex-col gap-8 flex-1">
                <div className="border border-gray-300 rounded-lg p-4 text-gray-500 text-base bg-gray-50 text-right">
                  ادخل العنوان
                </div>
                <div className="text-right text-xl text-black leading-loose">
                  <p>السلام عليكم ورحمة الله وبركاته،</p>
                  <p>السيد/ <span className="text-base text-gray-500">[اسم المستلم]</span> المحترم،</p>
                  <p>
                    نود إعلامكم بأنه تم اليوم <span className="text-base text-gray-500">[تاريخ الاستلام]</span> تسليم العاملة{' '}
                    <span className="text-base text-gray-500">[اسم العاملة]</span> رقم الهوية{' '}
                    <span className="text-base text-gray-500">[هوية العاملة]</span>، للعمل لديكم وفقًا لشروط العقد المبرم بين الطرفين.
                  </p>
                  <p>يرجى التأكد من استلام جميع الوثائق والمتعلقات الخاصة بالعاملـة، والتوقيع على استلامها.</p>
                  <p>وتفضلوا بقبول فائق الاحترام والتقدير.</p>
                  <p>قسم شؤون الموظفين</p>
                  <p>شركة روائس للاستقدام</p>
                </div>
                <div className="flex justify-between gap-5 mt-auto">
                  <div className="flex-1 text-right text-base text-black">
                    <span>التاريخ:</span>
                    <hr className="border-gray-300 mt-1.5" />
                  </div>
                  <div className="flex-1 text-right text-base text-black">
                    <span>التوقيع:</span>
                    <hr className="border-gray-300 mt-1.5" />
                  </div>
                </div>
                <div className="border-dashed border-gray-300 rounded-lg p-5 flex flex-col items-center gap-2 text-gray-500 text-sm bg-gray-50">
                  <Upload className="w-6 h-6" />
                  <span>اضغط هنا لرفع الشعار</span>
                </div>
              </div>
            </div>
            <aside className="w-56 max-[1200px]:w-full bg-gray-100 border border-gray-300 rounded-lg p-6">
              <h2 className="text-xl font-normal text-gray-500 text-right mb-8">انواع القوالب</h2>
              <ul className="flex flex-col gap-8">
                <li className="bg-teal-800 text-white rounded-md">
                  <a href="#template-delivery" className="flex items-center justify-end gap-2 p-2 text-base">
                    <span>تسليم عاملة</span>
                    <DocumentTextIcon className="w-6 h-6" />
                  </a>
                </li>
                <li>
                  <a href="#template-receipt" className="flex items-center justify-end gap-2 p-2 text-base text-gray-800">
                    <span>استلام عاملة</span>
                    <DocumentTextIcon className="w-6 h-6" />
                  </a>
                </li>
                <li>
                  <a href="#template-transfer" className="flex items-center justify-end gap-2 p-2 text-base text-gray-800">
                    <span>نقل كفالة</span>
                    <DocumentTextIcon className="w-6 h-6" />
                  </a>
                </li>
                <li>
                  <a href="#template-start-work" className="flex items-center justify-end gap-2 p-2 text-base text-gray-800">
                    <span>مباشرة عمل</span>
                    <DocumentTextIcon className="w-6 h-6" />
                  </a>
                </li>
                <li>
                  <a href="#template-leave" className="flex items-center justify-end gap-2 p-2 text-base text-gray-800">
                    <span>اجازة</span>
                    <DocumentTextIcon className="w-6 h-6" />
                  </a>
                </li>
                <li>
                  <a href="#template-complaint" className="flex items-center justify-end gap-2 p-2 text-base text-gray-800">
                    <span>شكوى</span>
                    <DocumentTextIcon className="w-6 h-6" />
                  </a>
                </li>
              </ul>
            </aside>
          </section>
        </main>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-gray-100 rounded-lg w-11/12 max-w-[967px] max-h-[80vh] overflow-y-auto p-5 relative">
              <span
                onClick={hideAddTemplateModal}
                className="absolute top-2 right-5 text-2xl cursor-pointer text-gray-800"
              >
                &times;
              </span>
              <section className="w-full">
                <div className="bg-gray-100 p-10 rounded-lg">
                  <h2 className="text-3xl font-normal text-black text-right mb-6">اضافة قالب</h2>
                  <form>
                    <div className="flex flex-col gap-2 mb-6">
                      <label htmlFor="template-title" className="text-base text-gray-800 text-right">
                        العنوان
                      </label>
                      <input
                        type="text"
                        id="template-title"
                        className="bg-gray-50 border border-gray-300 rounded-md p-2.5 text-sm text-gray-800 placeholder-gray-500 w-full"
                        placeholder="ادخل عنوان القالب"
                      />
                    </div>
                    <div className="bg-gray-50 border border-gray-300 rounded-md shadow-sm">
                      <div className="flex flex-wrap items-center p-2 border-b border-gray-400">
                        <div className="flex gap-2 px-2 border-l border-gray-400">
                          <button type="button" className="p-1.5">
                            <Type className="w-5 h-5" />
                          </button>
                          <button type="button" className="p-1.5">
                            <Bold className="w-5 h-5" />
                          </button>
                          <button type="button" className="p-1.5">
                            <Italic className="w-5 h-5" />
                          </button>
                          <button type="button" className="p-1.5">
                            <Underline className="w-5 h-5" />
                          </button>
                          <button type="button" className="p-1.5">
                            <List className="w-5 h-5" />
                          </button>
                          <button type="button" className="p-1.5">
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex gap-2 px-2 border-l border-gray-400">
                          <button type="button" className="p-1.5">
                            <AlignLeft className="w-5 h-5" />
                          </button>
                          <button type="button" className="p-1.5">
                            <AlignCenter className="w-5 h-5" />
                          </button>
                          <button type="button" className="p-1.5">
                            <AlignRight className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex gap-2 px-2 border-l border-gray-400">
                          <button type="button" className="p-1.5">
                            <AlignJustify className="w-5 h-5" />
                          </button>
                          <button type="button" className="p-1.5">
                            <Image className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex gap-2 px-2">
                          <button type="button" className="p-1.5">
                            <Link className="w-5 h-5" />
                          </button>
                          <button type="button" className="p-1.5">
                            <ChevronRightIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="p-6 min-h-[225px]">
                        <textarea
                          className="w-full h-full border-none bg-transparent resize-none text-gray-500 text-base leading-relaxed focus:outline-none"
                          placeholder="ادخل محتوى القالب هنا .........."
                        ></textarea>
                      </div>
                    </div>
                    <div className="flex justify-center gap-4 mt-10 max-[768px]:flex-col">
                      <button
                        type="button"
                        onClick={hideAddTemplateModal}
                        className="border border-teal-800 text-gray-800 px-10 py-1.5 rounded text-base min-w-[116px] hover:bg-gray-200"
                      >
                        الغاء
                      </button>
                      <button
                        type="submit"
                        className="bg-teal-800 text-white px-10 py-1.5 rounded text-base min-w-[116px] hover:bg-teal-900"
                      >
                        اضافة
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}