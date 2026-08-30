import React, { useState, useEffect } from 'react';
import Layout from '../../example/containers/Layout';
import Head from 'next/head';
import Style from '../../styles/Home.module.css';
import * as XLSX from 'xlsx';
import { Upload, AlertCircle, CheckCircle, XCircle, Loader2, Check } from 'lucide-react';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';

interface MatchResult {
  missingInSystem: { contract: string; startDate: string | null }[];
  missingInMusaned: { contract: string; orderId: number; clientName: string; maidName: string; nationalId: string }[];
  matched: { 
    contract: string; 
    orderId: number; 
    clientName: string; 
    maidName: string; 
    nationalId: string;
    discrepancies?: { type: string; musanedValue: string; systemValue: string; message: string }[] 
  }[];
  summary: { totalMusaned: number; totalSystem: number, dateRangeStr?: string };
}

export default function ControlCenter() {
  const router = useRouter();
  
  // Protect the route
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          const permissions = data.user?.permissions || {};
          const canViewCC = !!permissions?.["مركز الرقابة"]?.["عرض"];
          if (!canViewCC) {
            router.push('/admin/home');
          }
        } else {
          router.push('/');
        }
      } catch (e) {
        router.push('/');
      }
    };
    checkAuth();
  }, [router]);
  const [activeTool, setActiveTool] = useState<'musaned' | null>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'missingInSystem' | 'missingInMusaned' | 'matched'>('missingInSystem');
  const [updatingField, setUpdatingField] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const handleUpdateDiscrepancy = async (orderId: number, type: string, newValue: string, itemIndex: number, discIndex: number) => {
    try {
      const updateKey = `${orderId}-${type}`;
      setUpdatingField(updateKey);
      
      let userId = 4;
      let username = 'النظام';
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const decoded: any = jwtDecode(token);
          if (decoded.id) userId = decoded.id;
          if (decoded.username) username = decoded.username;
        }
      } catch (e) {}

      const response = await fetch('/api/control-center/update-discrepancy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, type, newValue, userId, username })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل التحديث');
      }

      // Update local state to show success
      if (results) {
        const newResults = { ...results };
        const matchedItem = newResults.matched[itemIndex];
        
        if (matchedItem && matchedItem.discrepancies) {
          // Remove the discrepancy
          matchedItem.discrepancies.splice(discIndex, 1);
          
          // Update the system value locally for display
          if (type === 'nationalId') matchedItem.nationalId = newValue;
          if (type === 'nationality') matchedItem.maidName = matchedItem.maidName; // Just keeping structure, UI might not show it
        }
        
        setResults(newResults);
        showToast('success', 'تم تحديث النظام بنجاح بناءً على بيانات مساند');
      }
      
    } catch (err: any) {
      showToast('error', err.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setUpdatingField(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResults(null);
    }
  };

  const processFile = async () => {
    if (!file) {
      setError('يرجى اختيار ملف أولاً');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          let jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
          
          jsonData = jsonData.map(row => {
            if (Array.isArray(row) && row.length === 1 && typeof row[0] === 'string' && row[0].includes(',')) {
              return row[0].split(',').map(s => s.trim());
            }
            return row;
          });
          
          let contractColumnIndex = -1;
          let dateColumnIndex = -1;
          let nationalIdColumnIndex = -1;
          let nationalityColumnIndex = -1;
          let headerRowIndex = -1;

          for (let i = 0; i < Math.min(10, jsonData.length); i++) {
            const row = jsonData[i];
            if (Array.isArray(row)) {
              for (let j = 0; j < row.length; j++) {
                if (typeof row[j] === 'string') {
                  const cell = row[j].trim();
                  if (cell === 'رقم العقد') contractColumnIndex = j;
                  else if (cell === 'تاريخ بداية العقد' || cell.includes('تاريخ بداية')) dateColumnIndex = j;
                  else if (cell === 'هوية صاحب العمل' || cell.includes('هوية')) nationalIdColumnIndex = j;
                  else if (cell === 'الجنسية') nationalityColumnIndex = j;
                }
              }
              if (contractColumnIndex !== -1) {
                headerRowIndex = i;
                break;
              }
            }
          }

          if (contractColumnIndex === -1) {
            throw new Error('لم يتم العثور على عمود "رقم العقد" في الملف. يرجى التأكد من أن الملف صادر من مساند.');
          }

          const musanedContracts: any[] = [];
          let minDate: Date | null = null;
          let maxDate: Date | null = null;

          for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (Array.isArray(row) && row[contractColumnIndex]) {
              const contractStr = String(row[contractColumnIndex]).trim();
              if (contractStr) {
                let dateObj: Date | null = null;
                if (dateColumnIndex !== -1 && row[dateColumnIndex] !== undefined && row[dateColumnIndex] !== null) {
                  const cellValue = row[dateColumnIndex];
                  if (typeof cellValue === 'number') {
                    dateObj = new Date(Math.round((cellValue - 25569) * 86400 * 1000));
                  } else if (typeof cellValue === 'string' && cellValue.trim() !== '') {
                    dateObj = new Date(cellValue.trim());
                  }

                  if (dateObj && !isNaN(dateObj.getTime())) {
                    if (!minDate || dateObj < minDate) minDate = dateObj;
                    if (!maxDate || dateObj > maxDate) maxDate = dateObj;
                  }
                }

                musanedContracts.push({
                  contract: contractStr,
                  nationalId: nationalIdColumnIndex !== -1 && row[nationalIdColumnIndex] ? String(row[nationalIdColumnIndex]).trim() : null,
                  nationality: nationalityColumnIndex !== -1 && row[nationalityColumnIndex] ? String(row[nationalityColumnIndex]).trim() : null,
                  startDate: dateObj && !isNaN(dateObj.getTime()) ? dateObj.toISOString() : null,
                });
              }
            }
          }

          if (musanedContracts.length === 0) {
            throw new Error('لم يتم العثور على أي أرقام عقود في الملف المرفوع.');
          }
          
          let dateRange = null;
          if (minDate && maxDate) {
            dateRange = {
              startDate: minDate.toISOString(),
              endDate: maxDate.toISOString()
            };
          }

          const response = await fetch('/api/control-center/match-musaned', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ musanedContracts, dateRange }),
          });

          if (!response.ok) {
            throw new Error('حدث خطأ أثناء الاتصال بالخادم لمطابقة العقود.');
          }

          const resultData = await response.json();
          setResults(resultData);
          setLoading(false);
          
        } catch (err: any) {
          console.error(err);
          setError(err.message || 'حدث خطأ أثناء معالجة الملف.');
          setLoading(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء قراءة الملف.');
      setLoading(false);
    }
  };

  const renderToolsDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        onClick={() => setActiveTool('musaned')}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md hover:border-teal-300 transition-all group"
      >
        <div className="w-14 h-14 bg-teal-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
          <CheckCircle className="w-7 h-7 text-teal-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">مطابقة عقود مساند</h3>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
          قم برفع تقرير مساند لمطابقته مع العقود المسجلة في النظام واكتشاف الأخطاء أو العقود المفقودة.
        </p>
        <div className="flex items-center text-teal-600 font-semibold text-sm group-hover:text-teal-700">
          <span>فتح الأداة</span>
          <svg className="w-4 h-4 mr-1 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-xl border border-gray-200 border-dashed p-6 flex flex-col items-center justify-center text-center opacity-70">
        <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center mb-3">
          <span className="text-gray-400 text-2xl">+</span>
        </div>
        <h3 className="text-lg font-bold text-gray-400 mb-1">أداة جديدة قريباً</h3>
        <p className="text-gray-400 text-xs">سيتم إضافة المزيد من أدوات الرقابة هنا</p>
      </div>
    </div>
  );

  const renderMusanedTool = () => (
    <div className="animate-fade-in-up">
      <button 
        onClick={() => {
          setActiveTool(null);
          setFile(null);
          setResults(null);
          setError(null);
        }}
        className="mb-6 flex items-center gap-2 text-gray-500 hover:text-teal-700 transition-colors font-semibold"
      >
        <svg className="w-5 h-5 transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        العودة للأدوات
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">رفع ملف عقود مساند</h2>
          <p className="text-gray-500 mb-6 text-sm">
            قم برفع ملف Excel (CSV, XLSX) الصادر من نظام مساند لمطابقته مع العقود المسجلة في النظام.
          </p>
          
          <div className="flex flex-col items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-40 border-2 border-teal-300 border-dashed rounded-lg cursor-pointer bg-teal-50 hover:bg-teal-100 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-teal-600" />
                <p className="mb-2 text-sm text-teal-800 font-semibold">
                  {file ? file.name : 'اضغط لاختيار ملف أو اسحب الملف هنا'}
                </p>
                <p className="text-xs text-teal-600">CSV, XLS, XLSX</p>
              </div>
              <input
                id="dropzone-file"
                type="file"
                className="hidden"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2 text-right">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={processFile}
            disabled={!file || loading}
            className={`mt-6 px-8 py-3 rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2 w-full md:w-auto mx-auto
              ${!file || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-700 hover:bg-teal-800 hover:shadow-md'}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري المطابقة...
              </>
            ) : (
              <>بدء المطابقة</>
            )}
          </button>
        </div>
      </div>

      {toast && (
        <div className={`fixed top-4 left-4 right-4 md:right-4 md:left-auto md:w-96 z-[100] p-4 rounded-xl shadow-xl flex items-center gap-3 transition-all duration-300 transform translate-y-0 animate-in slide-in-from-top-4 border ${
          toast.type === 'success' ? 'bg-green-100 border-green-400 text-green-900' : 'bg-red-100 border-red-400 text-red-900'
        }`}>
          {toast.type === 'success' ? <Check className="w-5 h-5 text-green-700 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-700 shrink-0" />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      {results && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 p-4 md:p-6 flex flex-wrap gap-4 items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800">نتيجة المطابقة</h3>
              {results.summary.dateRangeStr && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <span>نطاق التقرير:</span>
                  <span className="font-semibold text-teal-700">{results.summary.dateRangeStr}</span>
                </p>
              )}
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex flex-col items-center">
                <span className="text-gray-500">إجمالي مساند</span>
                <span className="font-bold text-teal-700 text-xl">{results.summary.totalMusaned}</span>
              </div>
              <div className="w-px bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <span className="text-gray-500">إجمالي النظام</span>
                <span className="font-bold text-teal-700 text-xl">{results.summary.totalSystem}</span>
              </div>
            </div>
          </div>

          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('missingInSystem')}
              className={`flex-1 py-4 px-2 text-sm md:text-base font-semibold flex items-center justify-center gap-2 transition-colors border-b-2 ${
                activeTab === 'missingInSystem'
                  ? 'border-red-500 text-red-700 bg-red-50'
                  : 'border-transparent text-red-400 hover:text-red-600 hover:bg-red-50/50'
              }`}
            >
              <XCircle className="w-5 h-5" />
              غير مسجلة بالنظام
              <span className={`px-2 py-0.5 rounded-full text-xs shadow-sm border ${activeTab === 'missingInSystem' ? 'bg-white text-red-700 border-red-200' : 'bg-gray-50 text-gray-600'}`}>
                {results.missingInSystem.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('missingInMusaned')}
              className={`flex-1 py-4 px-2 text-sm md:text-base font-semibold flex items-center justify-center gap-2 transition-colors border-b-2 ${
                activeTab === 'missingInMusaned'
                  ? 'border-orange-500 text-orange-700 bg-orange-50'
                  : 'border-transparent text-orange-400 hover:text-orange-600 hover:bg-orange-50/50'
              }`}
            >
              <AlertCircle className="w-5 h-5" />
              غير موجودة بمساند
              <span className={`px-2 py-0.5 rounded-full text-xs shadow-sm border ${activeTab === 'missingInMusaned' ? 'bg-white text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-600'}`}>
                {results.missingInMusaned.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('matched')}
              className={`flex-1 py-4 px-2 text-sm md:text-base font-semibold flex items-center justify-center gap-2 transition-colors border-b-2 ${
                activeTab === 'matched'
                  ? 'border-green-500 text-green-700 bg-green-50'
                  : 'border-transparent text-green-500 hover:text-green-700 hover:bg-green-50/50'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              متطابقة
              <span className={`px-2 py-0.5 rounded-full text-xs shadow-sm border ${activeTab === 'matched' ? 'bg-white text-green-700 border-green-200' : 'bg-gray-50 text-gray-600'}`}>
                {results.matched.length}
              </span>
            </button>
          </div>

          <div className="p-0">
            {activeTab === 'missingInSystem' && (
              <div className="overflow-x-auto">
                {results.missingInSystem.length > 0 ? (
                  <table className="w-full text-sm text-right text-gray-700">
                    <thead className="text-xs text-red-800 uppercase bg-red-50 border-b border-red-100">
                      <tr>
                        <th className="px-6 py-4">رقم العقد في مساند</th>
                        <th className="px-6 py-4 text-center">تاريخ التعاقد</th>
                        <th className="px-6 py-4">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.missingInSystem.map((item, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4 font-bold font-sans text-lg">{item.contract}</td>
                          <td className="px-6 py-4 font-sans text-center" dir="ltr">{item.startDate ? item.startDate.split('T')[0] : 'غير متوفر'}</td>
                          <td className="px-6 py-4 text-red-600 font-semibold">مفقود في النظام</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p>لا توجد عقود مفقودة! جميع عقود مساند مسجلة في نظامك.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'missingInMusaned' && (
              <div className="overflow-x-auto">
                {results.missingInMusaned.length > 0 ? (
                  <table className="w-full text-sm text-right text-gray-700">
                    <thead className="text-xs text-orange-900 uppercase bg-orange-50 border-b border-orange-100">
                      <tr>
                        <th className="px-6 py-4">رقم العقد في النظام</th>
                        <th className="px-6 py-4">رقم الطلب (ID)</th>
                        <th className="px-6 py-4">اسم العميل</th>
                        <th className="px-6 py-4">رقم هوية العميل</th>
                        <th className="px-6 py-4">اسم العاملة</th>
                        <th className="px-6 py-4">إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.missingInMusaned.map((item, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4 font-bold font-sans text-lg">{item.contract}</td>
                          <td className="px-6 py-4">#{item.orderId}</td>
                          <td className="px-6 py-4">{item.clientName}</td>
                          <td className="px-6 py-4">{item.nationalId}</td>
                          <td className="px-6 py-4">{item.maidName}</td>
                          <td className="px-6 py-4">
                            <a href={`/admin/track_order/${item.orderId}`} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline">
                              عرض الطلب
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p>لا توجد عقود مسجلة في نظامك غير موجودة في مساند.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'matched' && (
              <div className="overflow-x-auto">
                {results.matched.length > 0 ? (
                  <table className="w-full text-sm text-right text-gray-700">
                    <thead className="text-xs text-green-900 uppercase bg-green-50 border-b border-green-100">
                      <tr>
                        <th className="px-6 py-4">رقم العقد</th>
                        <th className="px-6 py-4">رقم الطلب (ID)</th>
                        <th className="px-6 py-4">اسم العميل</th>
                        <th className="px-6 py-4">رقم هوية العميل</th>
                        <th className="px-6 py-4">تطابق البيانات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.matched.map((item, i) => (
                        <tr key={i} className={`border-b hover:bg-gray-50 ${item.discrepancies && item.discrepancies.length > 0 ? 'bg-orange-50' : ''}`}>
                          <td className="px-6 py-4 font-bold font-sans text-lg text-green-700">{item.contract}</td>
                          <td className="px-6 py-4">
                            <a href={`/admin/track_order/${item.orderId}`} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline">
                              #{item.orderId}
                            </a>
                          </td>
                          <td className="px-6 py-4">{item.clientName}</td>
                          <td className="px-6 py-4">{item.nationalId}</td>
                          <td className="px-6 py-4">
                            {item.discrepancies && item.discrepancies.length > 0 ? (
                              <div className="flex flex-col gap-1 items-start">
                                <span className="text-orange-600 font-bold flex items-center gap-1 text-xs mb-1">
                                  <AlertCircle className="w-4 h-4" /> يوجد اختلاف
                                </span>
                                {item.discrepancies.map((d, idx) => (
                                  <div key={idx} className="text-xs text-gray-700 bg-white p-2 rounded border border-orange-100 shadow-sm mt-1 inline-flex w-fit items-center gap-4">
                                    <div>
                                      <span className="font-semibold text-gray-900">{d.message}</span>
                                      <div className="mt-1 flex flex-col gap-0.5">
                                        <span className="text-orange-700 font-medium">مساند: {d.musanedValue}</span>
                                        <span className="text-teal-700 font-medium">النظام: {d.systemValue}</span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleUpdateDiscrepancy(item.orderId, d.type, d.musanedValue, i, idx)}
                                      disabled={updatingField === `${item.orderId}-${d.type}`}
                                      className="bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 border border-teal-200 shadow-sm"
                                    >
                                      {updatingField === `${item.orderId}-${d.type}` ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                      )}
                                      تحديث النظام
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-green-600 font-bold flex items-center gap-1 text-sm">
                                <CheckCircle className="w-4 h-4" /> متطابقة 100%
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p>لا توجد عقود متطابقة.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <Head>
        <title>مركز الرقابة | {activeTool ? 'أدوات الرقابة' : 'الرئيسية'}</title>
      </Head>
      <div className={`min-h-screen bg-gray-50 p-4 md:p-8 ${Style['tajawal-regular']}`} dir="rtl">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-teal-900 flex items-center gap-3">
              مركز الرقابة
              {activeTool && (
                <span className="text-sm bg-teal-100 text-teal-800 px-3 py-1 rounded-full font-normal shadow-sm">
                  {activeTool === 'musaned' ? 'مطابقة عقود مساند' : 'أداة رقابة'}
                </span>
              )}
            </h1>
          </div>

          {activeTool === null ? renderToolsDashboard() : null}
          {activeTool === 'musaned' ? renderMusanedTool() : null}

        </div>
      </div>
    </Layout>
  );
}
