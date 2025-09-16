import React, { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';

export default function HomeUnofficial() {
  const [activeTab, setActiveTab] = useState('new-orders');
  const [arrivalsTab, setArrivalsTab] = useState('arrivals');

  return (
    <>
      <Head>
        <title>وصل للاستقدام - الرئيسية</title>
        <meta name="description" content="لوحة تحكم وصل للاستقدام" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="flex max-w-7xl mx-auto min-h-screen bg-gray-50" dir="rtl">
        {/* Sidebar */}
        <aside className="w-80 bg-teal-800 text-white p-10 flex flex-col flex-shrink-0">
          <div className="flex justify-between items-center mb-10 px-6">
            <Image
              src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/06ad4fa2c6c4532b7876aba8a8fde28ed6be5b9c.png"
              alt="وصل للاستقدام logo"
              width={229}
              height={73}
              className="sidebar-logo"
            />
            <button className="bg-transparent border border-gray-300 rounded p-1.5 flex">
              <Image
                src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3049_63195.svg"
                alt="Toggle sidebar"
                width={20}
                height={20}
              />
            </button>
          </div>
          
          <nav className="flex-grow">
            <ul className="flex flex-col gap-6">
              <li>
                <a href="#home" className="flex items-center gap-4 p-2 px-5 rounded-lg bg-white bg-opacity-10 text-white hover:bg-opacity-20 transition-all">
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3068_157090.svg"
                    alt=""
                    width={24}
                    height={24}
                  />
                  <span className="text-xl">الرئيسية</span>
                </a>
              </li>
              <li>
                <a href="#order-management" className="flex items-center gap-4 p-2 px-5 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all">
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3068_157098.svg"
                    alt=""
                    width={24}
                    height={24}
                  />
                  <span className="text-xl">ادارة الطلبات</span>
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3068_157096.svg"
                    alt="arrow"
                    width={16}
                    height={16}
                    className="mr-auto rotate-180"
                  />
                </a>
              </li>
              <li>
                <a href="#customer-list" className="flex items-center gap-4 p-2 px-5 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all">
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3068_157113.svg"
                    alt=""
                    width={24}
                    height={24}
                  />
                  <span className="text-xl">قائمة العملاء</span>
                </a>
              </li>
              <li>
                <a href="#worker-management" className="flex items-center gap-4 p-2 px-5 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all">
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3068_157122.svg"
                    alt=""
                    width={24}
                    height={24}
                  />
                  <span className="text-xl">ادارة العاملات</span>
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3068_157120.svg"
                    alt="arrow"
                    width={16}
                    height={16}
                    className="mr-auto rotate-180"
                  />
                </a>
              </li>
              <li>
                <a href="#arrivals-departures" className="flex items-center gap-4 p-2 px-5 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all">
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3068_157136.svg"
                    alt=""
                    width={24}
                    height={24}
                  />
                  <span className="text-xl">الوصول والمغادرة</span>
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3068_157133.svg"
                    alt="arrow"
                    width={16}
                    height={16}
                    className="mr-auto rotate-180"
                  />
                </a>
              </li>
              <li>
                <a href="#residency-affairs" className="flex items-center gap-4 p-2 px-5 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all">
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3068_157144.svg"
                    alt=""
                    width={24}
                    height={24}
                  />
                  <span className="text-xl">شؤون الاقامة</span>
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3068_157142.svg"
                    alt="arrow"
                    width={16}
                    height={16}
                    className="mr-auto rotate-180"
                  />
                </a>
              </li>
              <li>
                <a href="#accounting" className="flex items-center gap-4 p-2 px-5 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all">
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3068_157160.svg"
                    alt=""
                    width={24}
                    height={24}
                  />
                  <span className="text-xl">ادارة المحاسبة</span>
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3068_157157.svg"
                    alt="arrow"
                    width={16}
                    height={16}
                    className="mr-auto rotate-180"
                  />
                </a>
              </li>
              <li>
                <a href="#notifications" className="flex items-center gap-4 p-2 px-5 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all">
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3068_157165.svg"
                    alt=""
                    width={24}
                    height={24}
                  />
                  <span className="text-xl">الاشعارات</span>
                </a>
              </li>
              <li>
                <a href="#reports" className="flex items-center gap-4 p-2 px-5 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all">
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3068_157171.svg"
                    alt=""
                    width={24}
                    height={24}
                  />
                  <span className="text-xl">التقارير</span>
                </a>
              </li>
              <li>
                <a href="#templates" className="flex items-center gap-4 p-2 px-5 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all">
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3068_157175.svg"
                    alt=""
                    width={24}
                    height={24}
                  />
                  <span className="text-xl">القوالب</span>
                </a>
              </li>
              <li>
                <a href="#correspondence" className="flex items-center gap-4 p-2 px-5 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all">
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3068_157186.svg"
                    alt=""
                    width={24}
                    height={24}
                  />
                  <span className="text-xl">ادارة المراسلات</span>
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3068_157184.svg"
                    alt="arrow"
                    width={16}
                    height={16}
                    className="mr-auto rotate-180"
                  />
                </a>
              </li>
              <li>
                <a href="#settings" className="flex items-center gap-4 p-2 px-5 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all">
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3068_157194.svg"
                    alt=""
                    width={24}
                    height={24}
                  />
                  <span className="text-xl">الاعدادات</span>
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_3068_164419_3068_157192.svg"
                    alt="arrow"
                    width={16}
                    height={16}
                    className="mr-auto rotate-180"
                  />
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Container */}
        <div className="flex-grow flex flex-col">
          {/* Header */}
          <header className="h-20 bg-gray-50 shadow-sm flex justify-between items-center px-8 flex-shrink-0">
            <h1 className="text-2xl font-normal text-teal-800">وصل للاستقدام</h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_133_1570_133_1566.svg"
                    alt="Notifications"
                    width={24}
                    height={24}
                    className="notification-bell"
                  />
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_133_1570_107_2297.svg"
                    alt="Notification count"
                    width={8}
                    height={9}
                    className="absolute top-0.5 -right-0.5 notification-dot"
                  />
                </div>
                <span className="text-xs text-red-600">لديك 5 اشعارات جديدة</span>
              </div>
              <div>
                <button className="flex items-center gap-2 bg-transparent border border-gray-300 rounded p-2 text-sm text-teal-800">
                  <span>احمد الحربي</span>
                  <Image
                    src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I39_620_30_2306_1966_54865.svg"
                    alt="dropdown arrow"
                    width={16}
                    height={16}
                    className="rotate-90"
                  />
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6 flex flex-col gap-6">
            {/* Daily Overview Section */}
            <section id="daily-overview" className="flex gap-6">
              {/* Daily Tasks Card */}
              <div className="flex-1.5 bg-gray-50 border border-gray-200 rounded-lg shadow-sm flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                  <h3 className="text-lg font-normal text-black">المهام اليومية</h3>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-teal-800 text-white text-xs">
                    <Image
                      src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I3734_38653_3214_44962_71_3264.svg"
                      alt="+"
                      width={16}
                      height={16}
                    />
                    اضافة مهمة
                  </button>
                </div>
                <div className="p-4 flex-grow">
                  <ul className="flex flex-col gap-2">
                    <li className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-normal text-gray-900 mb-1">تحديث حالة الطلب رقم #12345</h4>
                        <p className="text-xs text-gray-600">الطلب يحتاج تدقيق قبل الإرسال</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Image
                          src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I3734_38653_3214_44970.svg"
                          alt="clock"
                          width={12}
                          height={12}
                        />
                        <span>خلال ساعتين</span>
                      </div>
                    </li>
                    <li className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-normal text-gray-900 mb-1">تحديث حالة الطلب رقم #12345</h4>
                        <p className="text-xs text-gray-600">الطلب يحتاج تدقيق قبل الإرسال</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Image
                          src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I3734_38653_3214_44979.svg"
                          alt="clock"
                          width={12}
                          height={12}
                        />
                        <span>خلال ساعتين</span>
                      </div>
                    </li>
                    <li className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-normal text-gray-900 mb-1">تحديث حالة الطلب رقم #12345</h4>
                        <p className="text-xs text-gray-600">الطلب يحتاج تدقيق قبل الإرسال</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Image
                          src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I3734_38653_3214_44988.svg"
                          alt="clock"
                          width={12}
                          height={12}
                        />
                        <span>خلال ساعتين</span>
                      </div>
                    </li>
                    <li className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-normal text-gray-900 mb-1">تحديث حالة الطلب رقم #12345</h4>
                        <p className="text-xs text-gray-600">الطلب يحتاج تدقيق قبل الإرسال</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Image
                          src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I3734_38653_3233_52284.svg"
                          alt="clock"
                          width={12}
                          height={12}
                        />
                        <span>خلال ساعتين</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Calendar Card */}
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg shadow-sm flex flex-col">
                <div className="flex justify-between items-center p-4">
                  <button className="bg-transparent border-none">
                    <Image
                      src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I3734_38653_3233_52453.svg"
                      alt="Previous week"
                      width={20}
                      height={20}
                    />
                  </button>
                  <span className="text-sm">24-30 August</span>
                  <button className="bg-transparent border-none">
                    <Image
                      src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I3734_38653_3233_52456.svg"
                      alt="Next week"
                      width={20}
                      height={20}
                    />
                  </button>
                </div>
                <div className="p-4 flex-grow">
                  <div className="space-y-2">
                    <div className="flex items-center p-2.5 border-b border-gray-200 gap-2.5">
                      <div className="flex flex-col items-center text-xs text-center w-15">
                        <span className="font-normal">الاحد</span>
                        <span className="font-light">24 Aug</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap pr-4 border-r border-gray-200 min-h-7"></div>
                    </div>
                    <div className="flex items-center p-2.5 border-b border-gray-200 gap-2.5">
                      <div className="flex flex-col items-center text-xs text-center w-15">
                        <span className="font-normal">الاثنين</span>
                        <span className="font-light">25 Aug</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap pr-4 border-r border-gray-200 min-h-7">
                        <div className="text-xs font-light px-1.5 py-1 rounded bg-yellow-100 text-yellow-600">تحديث بيانات العاملة</div>
                        <div className="text-xs font-light px-1.5 py-1 rounded bg-red-100 text-red-600">تعديل بيانات العميل</div>
                      </div>
                    </div>
                    <div className="flex items-center p-2.5 border-b border-gray-200 gap-2.5">
                      <div className="flex flex-col items-center text-xs text-center w-15">
                        <span className="font-normal">الثلاثاء</span>
                        <span className="font-light">26 Aug</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap pr-4 border-r border-gray-200 min-h-7"></div>
                    </div>
                    <div className="flex items-center p-2.5 border-b border-gray-200 gap-2.5">
                      <div className="flex flex-col items-center text-xs text-center w-15">
                        <span className="font-normal">الاربعاء</span>
                        <span className="font-light">27 Aug</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap pr-4 border-r border-gray-200 min-h-7"></div>
                    </div>
                    <div className="flex items-center p-2.5 border-b border-gray-200 gap-2.5">
                      <div className="flex flex-col items-center text-xs text-center w-15">
                        <span className="font-normal">الخميس</span>
                        <span className="font-light">28 Aug</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap pr-4 border-r border-gray-200 min-h-7"></div>
                    </div>
                    <div className="flex items-center p-2.5 border-b border-gray-200 gap-2.5">
                      <div className="flex flex-col items-center text-xs text-center w-15">
                        <span className="font-normal">الجمعه</span>
                        <span className="font-light">29 Aug</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap pr-4 border-r border-gray-200 min-h-7">
                        <div className="text-xs font-light px-1.5 py-1 rounded bg-green-100 text-teal-800">مغادرة عاملة</div>
                        <div className="text-xs font-light px-1.5 py-1 rounded bg-yellow-100 text-yellow-600">تحديث بيانات العاملة</div>
                        <div className="text-xs font-light px-1.5 py-1 rounded bg-red-100 text-red-600">تعديل بيانات العميل</div>
                      </div>
                    </div>
                    <div className="flex items-center p-2.5 gap-2.5">
                      <div className="flex flex-col items-center text-xs text-center w-15">
                        <span className="font-normal">السبت</span>
                        <span className="font-light">30 Aug</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap pr-4 border-r border-gray-200 min-h-7"></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Orders Section */}
            <section id="orders" className="w-full">
              <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm flex flex-col">
                <div className="flex justify-between items-center p-4 gap-6">
                  <h3 className="text-lg font-normal text-black mr-auto">الطلبات</h3>
                  <div className="flex gap-10 border-b border-gray-200 flex-grow">
                    <button 
                      onClick={() => setActiveTab('new-orders')}
                      className={`pb-2 text-xs text-gray-600 hover:text-gray-900 flex flex-col items-center gap-1 relative ${
                        activeTab === 'new-orders' ? 'text-gray-900' : ''
                      }`}
                    >
                      <span>الطلبات الجديدة</span>
                      <span className="text-xs">12</span>
                      {activeTab === 'new-orders' && (
                        <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gray-900"></div>
                      )}
                    </button>
                    <button 
                      onClick={() => setActiveTab('in-progress')}
                      className={`pb-2 text-xs text-gray-600 hover:text-gray-900 flex flex-col items-center gap-1 relative ${
                        activeTab === 'in-progress' ? 'text-gray-900' : ''
                      }`}
                    >
                      <span>طلبات تحت الإجراء</span>
                      <span className="text-xs">12</span>
                      {activeTab === 'in-progress' && (
                        <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gray-900"></div>
                      )}
                    </button>
                    <button 
                      onClick={() => setActiveTab('completed')}
                      className={`pb-2 text-xs text-gray-600 hover:text-gray-900 flex flex-col items-center gap-1 relative ${
                        activeTab === 'completed' ? 'text-gray-900' : ''
                      }`}
                    >
                      <span>الطلبات المكتملة</span>
                      <span className="text-xs">12</span>
                      {activeTab === 'completed' && (
                        <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gray-900"></div>
                      )}
                    </button>
                    <button 
                      onClick={() => setActiveTab('rejected')}
                      className={`pb-2 text-xs text-gray-600 hover:text-gray-900 flex flex-col items-center gap-1 relative ${
                        activeTab === 'rejected' ? 'text-gray-900' : ''
                      }`}
                    >
                      <span>الطلبات المرفوضة</span>
                      <span className="text-xs">12</span>
                      {activeTab === 'rejected' && (
                        <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gray-900"></div>
                      )}
                    </button>
                  </div>
                  <button className="px-4 py-2 rounded bg-teal-800 text-white text-sm">عرض الكل</button>
                </div>
                <div className="p-4 flex-grow">
                  <ul className="flex flex-col">
                    <li className="flex justify-between items-center p-3 border-b border-gray-200">
                      <div className="flex flex-col gap-1">
                        <h4 className="text-xs font-normal text-gray-900">الطلب رقم #12345</h4>
                        <p className="text-xs text-gray-600">العميل: احمد الحربي</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Image
                            src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I3734_38653_61_2881.svg"
                            alt="clock"
                            width={12}
                            height={12}
                          />
                          <span>منذ ساعتين</span>
                        </div>
                      </div>
                      <button className="bg-transparent border-none">
                        <Image
                          src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I3734_38653_61_2873.svg"
                          alt="arrow"
                          width={16}
                          height={16}
                        />
                      </button>
                    </li>
                    <li className="flex justify-between items-center p-3 border-b border-gray-200">
                      <div className="flex flex-col gap-1">
                        <h4 className="text-xs font-normal text-gray-900">الطلب رقم #12345</h4>
                        <p className="text-xs text-gray-600">العميل: احمد الحربي</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Image
                            src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I3734_38653_61_2891.svg"
                            alt="clock"
                            width={12}
                            height={12}
                          />
                          <span>منذ ساعتين</span>
                        </div>
                      </div>
                      <button className="bg-transparent border-none">
                        <Image
                          src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I3734_38653_61_2883.svg"
                          alt="arrow"
                          width={16}
                          height={16}
                        />
                      </button>
                    </li>
                    <li className="flex justify-between items-center p-3">
                      <div className="flex flex-col gap-1">
                        <h4 className="text-xs font-normal text-gray-900">الطلب رقم #12345</h4>
                        <p className="text-xs text-gray-600">العميل: احمد الحربي</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Image
                            src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I3734_38653_61_2901.svg"
                            alt="clock"
                            width={12}
                            height={12}
                          />
                          <span>منذ ساعتين</span>
                        </div>
                      </div>
                      <button className="bg-transparent border-none">
                        <Image
                          src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I3734_38653_61_2893.svg"
                          alt="arrow"
                          width={16}
                          height={16}
                        />
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Arrivals and Departures Section */}
            <section id="arrivals-departures" className="w-full">
              <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm flex flex-col">
                <div className="flex justify-between items-center p-4 gap-6">
                  <h3 className="text-lg font-normal text-black mr-auto">الوصول والمغادرة</h3>
                  <div className="flex gap-10 border-b border-gray-200 flex-grow">
                    <button 
                      onClick={() => setArrivalsTab('arrivals')}
                      className={`pb-2 text-xs text-gray-600 hover:text-gray-900 flex flex-col items-center gap-1 relative ${
                        arrivalsTab === 'arrivals' ? 'text-gray-900' : ''
                      }`}
                    >
                      <span>الوصول</span>
                      <span className="text-xs">12</span>
                      {arrivalsTab === 'arrivals' && (
                        <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gray-900"></div>
                      )}
                    </button>
                    <button 
                      onClick={() => setArrivalsTab('internal-departures')}
                      className={`pb-2 text-xs text-gray-600 hover:text-gray-900 flex flex-col items-center gap-1 relative ${
                        arrivalsTab === 'internal-departures' ? 'text-gray-900' : ''
                      }`}
                    >
                      <span>المغادرة الداخلية</span>
                      <span className="text-xs">12</span>
                      {arrivalsTab === 'internal-departures' && (
                        <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gray-900"></div>
                      )}
                    </button>
                    <button 
                      onClick={() => setArrivalsTab('external-departures')}
                      className={`pb-2 text-xs text-gray-600 hover:text-gray-900 flex flex-col items-center gap-1 relative ${
                        arrivalsTab === 'external-departures' ? 'text-gray-900' : ''
                      }`}
                    >
                      <span>المغادرة الخارجية</span>
                      <span className="text-xs">12</span>
                      {arrivalsTab === 'external-departures' && (
                        <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gray-900"></div>
                      )}
                    </button>
                  </div>
                  <button className="px-4 py-2 rounded bg-teal-800 text-white text-sm">عرض الكل</button>
                </div>
                <div className="p-4 flex-grow">
                  <ul className="flex flex-col">
                    <li className="flex justify-between items-center p-3 border-b border-gray-200">
                      <div className="flex flex-col gap-1">
                        <h4 className="text-xs font-normal text-gray-900">طلب وصول رقم #12345</h4>
                        <p className="text-xs text-gray-600">العميل: احمد الحربي</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Image
                            src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I3734_38653_61_2981.svg"
                            alt="clock"
                            width={12}
                            height={12}
                          />
                          <span>منذ ساعتين</span>
                        </div>
                      </div>
                      <button className="bg-transparent border-none">
                        <Image
                          src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I3734_38653_61_2973.svg"
                          alt="arrow"
                          width={16}
                          height={16}
                        />
                      </button>
                    </li>
                    <li className="flex justify-between items-center p-3 border-b border-gray-200">
                      <div className="flex flex-col gap-1">
                        <h4 className="text-xs font-normal text-gray-900">طلب وصول رقم #12345</h4>
                        <p className="text-xs text-gray-600">العميل: احمد الحربي</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Image
                            src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I3734_38653_61_2991.svg"
                            alt="clock"
                            width={12}
                            height={12}
                          />
                          <span>منذ ساعتين</span>
                        </div>
                      </div>
                      <button className="bg-transparent border-none">
                        <Image
                          src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I3734_38653_61_2983.svg"
                          alt="arrow"
                          width={16}
                          height={16}
                        />
                      </button>
                    </li>
                    <li className="flex justify-between items-center p-3">
                      <div className="flex flex-col gap-1">
                        <h4 className="text-xs font-normal text-gray-900">طلب وصول رقم #12345</h4>
                        <p className="text-xs text-gray-600">العميل: احمد الحربي</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Image
                            src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I3734_38653_61_3001.svg"
                            alt="clock"
                            width={12}
                            height={12}
                          />
                          <span>منذ ساعتين</span>
                        </div>
                      </div>
                      <button className="bg-transparent border-none">
                        <Image
                          src="/page/45ec88cf-717c-4b15-b238-e28499a629bb/images/I3734_38653_61_2993.svg"
                          alt="arrow"
                          width={16}
                          height={16}
                        />
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
