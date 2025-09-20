import React, { useState } from 'react';
import Head from 'next/head';

// Helper component for SVG icons to keep the main component clean
const Icon = ({ path, className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d={path} />
  </svg>
);

const TaxReportPage = () => {
  const [activeTab, setActiveTab] = useState('vat');

  // Data for the summary cards
  const summaryData = [
    { title: 'المبيعات الخاضعة للضريبة', value: '20,000.00' },
    { title: 'المبيعات الخاضعة للصفر', value: '10,000.00' },
    { title: 'التعديلات', value: '1200.00' },
    { title: 'قيمة الضريبة', value: '11200.00' },
  ];
  
  // Data for the main table, structured for easy rendering
  const tableData = {
    sales: {
      title: 'المبيعات',
      rows: [
        { description: 'ضريبة المبيعات الخاضعة للنسبة الاساسية (15%)', amount: '10,566.00', adjustment: '8,000', vat: '1,361.00' },
        { description: 'المبيعات لصالح المواطنين(خدمات صحية خاصة،التعليم الاهلي الخاص، المسكن الاول)', amount: '-', adjustment: '-', vat: '-' },
        { description: 'المبيعات الداخلية الخاضعة لنسبة صفر بالمائة', amount: '-', adjustment: '-', vat: '-' },
        { description: 'الصادرات الخاضعة لنسبة صفر بالمائة', amount: '-', adjustment: '-', vat: '-' },
        { description: 'المبيعات الملغاة', amount: '700', adjustment: '200', vat: '1,000' },
      ],
      total: { amount: '10,566.00', adjustment: '8,000', vat: '1,361.00' }
    },
    purchases: {
      title: 'المشتريات',
      rows: [
        { description: 'المشتريات الداخلية الخاضعة للنسبة الاساسية(15%)', amount: '-', adjustment: '-', vat: '-' },
        { description: 'التوريدات الخاضعة للضريبة القيمة المضافة المسددة للجمارك', amount: '-', adjustment: '-', vat: '-' },
        { description: 'عمليات الاستيراد الخاضعة لضريبة القيمة المضافة والمستحقة للضريبة وفقا لالية الاحتساب العكسي', amount: '-', adjustment: '-', vat: '-' },
        { description: 'المشتريات الخاضعة لنسبة صفر بالمائة', amount: '-', adjustment: '-', vat: '-' },
        { description: 'المبيعات المعفاة', amount: '-', adjustment: '-', vat: '-' },
      ],
      total: { amount: '-', adjustment: '-', vat: '-' }
    },
    vat: {
      title: 'الضريبة المضافة',
      rows: [
        { description: 'ضريبة القيمة المضافة الاجمالية للفترة الضريبية المستحقة', amount: '-', adjustment: '-', vat: '-' },
        { description: 'تصحيحات الفترة السابقة (حوالي +-5000 ريال)', amount: '-', adjustment: '-', vat: '-' },
        { description: 'ضريبة القيمة المضافة التي تم ترحيلها من الفترة \ الفترات السابقة', amount: '-', adjustment: '-', vat: '-' },
      ],
      total: { description: 'ضريبة القيمة المضافة المستحقة (المطلوب اصلاحها)', amount: '-', adjustment: '-', vat: '-' }
    }
  };


  return (
    <>
      <Head>
        <title>الاقرار الضريبي - الرئيسية</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Main content container */}
      <main dir="rtl" className="bg-[#F2F3F5] p-8 font-['Tajawal'] text-[#1A4D4F]">
        <div className="max-w-6xl mx-auto">
          <header className="mb-11">
            <h1 className="text-3xl text-black font-normal">الاقرار الضريبي</h1>
          </header>

          <div className="bg-white border border-gray-200 rounded-md p-5">
            
            {/* ## Summary Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-5 justify-items-center">
              {summaryData.map((card, index) => (
                <div key={index} className="bg-[#F7F8FA] rounded-xl shadow-md p-5 w-full max-w-xs h-[100px] flex flex-col justify-center items-center text-center">
                  <h3 className="text-base text-gray-800 mb-2 leading-tight">{card.title}</h3>
                  <p className="text-lg text-gray-800 font-normal">{card.value}</p>
                </div>
              ))}
            </section>

            {/* ## Tab Navigation */}
            <nav className="flex justify-center items-end gap-9 mb-5 border-b border-gray-200 pb-4">
              <button onClick={() => setActiveTab('vat')} className={`flex items-center gap-2 py-1 px-2 text-sm ${activeTab === 'vat' ? 'border-b-2 border-gray-800 text-gray-800' : 'text-gray-500'}`}>
                <span>3</span><span>الضريبة المضافة</span>
              </button>
              <button onClick={() => setActiveTab('sales')} className={`flex items-center gap-2 py-1 px-2 text-sm ${activeTab === 'sales' ? 'border-b-2 border-gray-800 text-gray-800' : 'text-gray-500'}`}>
                <span>6</span><span>المبيعات</span>
              </button>
              <button onClick={() => setActiveTab('purchases')} className={`flex items-center gap-2 py-1 px-2 text-sm ${activeTab === 'purchases' ? 'border-b-2 border-gray-800 text-gray-800' : 'text-gray-500'}`}>
                <span>6</span><span>المشتريات</span>
              </button>
            </nav>
            
            {/* ## Filters & Actions Section */}
            <section className="mb-5 px-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                {/* Search & Date Filters */}
                <div className="flex flex-wrap items-end gap-4 flex-grow">
                  <div className="flex-grow">
                    <label className="text-xs text-gray-800 block mb-2">بحث</label>
                    <div className="relative">
                      <input type="text" placeholder="بحث" className="bg-[#F7F8FA] border border-gray-200 rounded-md w-full h-9 p-2 pr-10 text-sm" />
                       <span className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
                         <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-4 h-4" />
                       </span>
                    </div>
                  </div>
                   <div className="flex-grow">
                    <label className="text-xs text-gray-800 block mb-2">من</label>
                    <input type="date" className="bg-[#F7F8FA] border border-gray-200 rounded-md w-full h-9 p-2 text-sm text-gray-500" />
                  </div>
                  <div className="flex-grow">
                    <label className="text-xs text-gray-800 block mb-2">الى</label>
                    <input type="date" className="bg-[#F7F8FA] border border-gray-200 rounded-md w-full h-9 p-2 text-sm text-gray-500" />
                  </div>
                </div>
                {/* Reset & Column Filter */}
                <div className="flex items-end gap-4">
                   <select className="bg-[#F7F8FA] border border-gray-200 rounded-md h-9 p-2 text-sm text-gray-500 w-48">
                     <option>كل الاعمدة</option>
                   </select>
                   <button className="bg-[#1A4D4F] text-white rounded-md text-xs px-3 h-8">اعادة ضبط</button>
                </div>
              </div>
               {/* Export Buttons */}
              <div className="flex gap-2 mt-5">
                <button className="bg-[#1A4D4F] text-white rounded-sm text-[10px] px-2.5 py-1 flex items-center gap-1 h-6">
                  <Icon path="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625a1.875 1.875 0 00-1.875 1.875v17.25a1.875 1.875 0 001.875 1.875h12.75a1.875 1.875 0 001.875-1.875V10.5" className="w-3 h-3"/>
                  <span>PDF</span>
                </button>
                 <button className="bg-[#1A4D4F] text-white rounded-sm text-[10px] px-2.5 py-1 flex items-center gap-1 h-6">
                   <Icon path="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625a1.875 1.875 0 00-1.875 1.875v17.25a1.875 1.875 0 001.875 1.875h12.75a1.875 1.875 0 001.875-1.875V10.5" className="w-3 h-3"/>
                  <span>Excel</span>
                </button>
              </div>
            </section>
            
            {/* ## Tax Declaration Table */}
            <section className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse text-base text-gray-800">
                <thead className="bg-[#1A4D4F] text-white">
                  <tr>
                    <th className="font-normal p-4 text-center w-1/4">التفاصيل</th>
                    <th className="font-normal p-4 text-center w-1/4">المبلغ<br/>(بالريال)</th>
                    <th className="font-normal p-4 text-center w-1/4">مبلغ التعديل<br/>(بالريال)</th>
                    <th className="font-normal p-4 text-center w-1/4">مبلغ ضريبة القيمة المضافة<br/>(بالريال)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(tableData).map((section, sectionIndex) => (
                    <React.Fragment key={sectionIndex}>
                      {/* Section Rows */}
                      {section.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="bg-[#F7F8FA] border border-gray-200">
                          {rowIndex === 0 && (
                            <td 
                              rowSpan={section.rows.length + 1} 
                              className="bg-[#1A4D4F] text-white text-2xl font-normal p-4 border-l border-gray-200 align-middle text-center"
                              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                            >
                              {section.title}
                            </td>
                          )}
                          <td className="p-4 text-center text-sm leading-tight">{row.description}</td>
                          <td className="p-4 text-center">{row.amount}</td>
                          <td className="p-4 text-center">{row.adjustment}</td>
                          <td className="p-4 text-center">{row.vat}</td>
                        </tr>
                      ))}
                       {/* Section Total Row */}
                      <tr className="bg-teal-50/50 border border-gray-200 font-bold">
                        <td className="p-3 text-center">
                          {section.total.description || 'الاجمالي'}
                        </td>
                        <td className="p-3 text-center">{section.total.amount}</td>
                        <td className="p-3 text-center">{section.total.adjustment}</td>
                        <td className="p-3 text-center">{section.total.vat}</td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </div>
      </main>
    </>
  );
};

export default TaxReportPage;