import { DocumentDownloadIcon as DocumentDownload, DocumentTextIcon as DocumentText } from '@heroicons/react/outline';
import Layout from 'example/containers/Layout';
import { X, Calendar, Search, Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Style from "styles/Home.module.css";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { jwtDecode } from 'jwt-decode';

const Modal = ({ isOpen, onClose, type, session, onSave }) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    reason: session?.reason || '',
    idnumber: session?.idnumber || '',
    date: session?.date ? new Date(session.date).toISOString().split('T')[0] : '',
    time: session?.time || '',
    result: session?.result || '',
  });

  const [workerSearchTerm, setWorkerSearchTerm] = useState('');
  const [workerSuggestions, setWorkerSuggestions] = useState<any[]>([]);
  const [isSearchingWorker, setIsSearchingWorker] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Reset form when modal opens/closes or session changes
  useEffect(() => {
    if (isOpen) {
      if (type === 'new') {
        setFormData({
          reason: '',
          idnumber: '',
          date: '',
          time: '',
          result: '',
        });
        setSelectedWorker(null);
        setWorkerSearchTerm('');
        setWorkerSuggestions([]);
      } else if (session) {
        setFormData({
          reason: session.reason || '',
          idnumber: session.idnumber || '',
          date: session.date ? new Date(session.date).toISOString().split('T')[0] : '',
          time: session.time || '',
          result: session.result || '',
        });
        if (session.user) {
          setSelectedWorker({ id: session.idnumber, Name: session.user.Name });
          setWorkerSearchTerm(session.user.Name || '');
        }
      }
    }
  }, [isOpen, type, session]);

  // Search workers
  const searchWorkers = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setWorkerSuggestions([]);
      return;
    }
    setIsSearchingWorker(true);
    try {
      const isId = searchTerm.match(/^\d+$/);
      let response;
      if (isId) {
        response = await fetch(`/api/getallhomemaids?id=${searchTerm}`);
      } else {
        response = await fetch(`/api/homemaids/suggestions?q=${encodeURIComponent(searchTerm)}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        let suggestions = [];
        
        if (isId) {
          if (data.data && data.data.length > 0) {
            suggestions = data.data.map((homemaid: any) => ({
              id: homemaid.id,
              Name: homemaid.Name,
              Country: homemaid.office?.Country || '',
            }));
          }
        } else {
          suggestions = data.suggestions || [];
        }
        
        setWorkerSuggestions(suggestions);
      } else {
        setWorkerSuggestions([]);
      }
    } catch (error) {
      console.error('Error searching workers:', error);
      setWorkerSuggestions([]);
    } finally {
      setIsSearchingWorker(false);
    }
  };

  const handleWorkerSearchChange = (e) => {
    const value = e.target.value;
    setWorkerSearchTerm(value);
    
    if (value.trim()) {
      searchWorkers(value);
    } else {
      setWorkerSuggestions([]);
      setSelectedWorker(null);
      setFormData((prev) => ({ ...prev, idnumber: '' }));
    }
  };

  const handleWorkerSuggestionClick = (worker: any) => {
    setSelectedWorker(worker);
    setWorkerSearchTerm(worker.Name);
    setWorkerSuggestions([]);
    setFormData((prev) => ({ ...prev, idnumber: worker.id.toString() }));
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setWorkerSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = async () => {
    if (type === 'new' && !formData.idnumber) {
      alert('يرجى اختيار عاملة أولاً');
      return;
    }
    if (!formData.reason) {
      alert('يرجى إدخال سبب الجلسة');
      return;
    }
    if (!formData.date) {
      alert('يرجى إدخال تاريخ الجلسة');
      return;
    }
    
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          idnumber: parseInt(formData.idnumber),
        }),
      });
      if (response.ok) {
        onSave();
        onClose();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'فشل في حفظ الجلسة');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      alert('حدث خطأ أثناء حفظ الجلسة');
    }
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 ${Style["tajawal-bold"]}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-[731px] w-full relative flex flex-col gap-10">
        <button onClick={onClose} className="absolute top-4 left-4 text-xl text-gray-800">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-normal text-black text-right">
          {type === 'new' ? 'إضافة جلسة جديدة' : type === 'add' ? 'إضافة محضر' : 'عرض/تعديل المحضر'}
        </h2>
        <div className="flex flex-col gap-4">
          {type === 'new' ? (
            <div className="flex-1 flex flex-col gap-2" ref={searchContainerRef}>
              <label className="text-md text-gray-800">البحث عن العاملة</label>
              <div className="relative">
                <input
                  type="text"
                  value={workerSearchTerm}
                  onChange={handleWorkerSearchChange}
                  placeholder="ابحث برقم العاملة أو الاسم"
                  className="bg-gray-100 border border-gray-200 rounded-md p-3 w-full text-md"
                />
                {isSearchingWorker && (
                  <div className="absolute left-3 top-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                  </div>
                )}
                {workerSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {workerSuggestions.map((worker) => (
                      <div
                        key={worker.id}
                        onClick={() => handleWorkerSuggestionClick(worker)}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                      >
                        <div className="font-medium text-md">عاملة #{worker.id}</div>
                        <div className="text-md text-gray-600">الاسم: {worker.Name}</div>
                        {worker.Country && (
                          <div className="text-md text-gray-500">الجنسية: {worker.Country}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedWorker && (
                <div className="bg-teal-50 border border-teal-200 rounded-md p-2 text-md text-teal-800">
                  تم اختيار: {selectedWorker.Name} (رقم: {selectedWorker.id})
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-row gap-8 max-md:flex-col">
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-md text-gray-800">اسم العاملة</label>
                <div className="bg-gray-100 border border-gray-200 rounded-md p-3 flex items-center justify-start text-md">
                  {session?.user?.Name || 'غير متوفر'}
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-md text-gray-800">سبب الجلسة</label>
                <input
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  className="bg-gray-100 border border-gray-200 rounded-md p-3 text-md"
                />
              </div>
            </div>
          )}
          {type === 'new' && (
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-md text-gray-800">سبب الجلسة</label>
              <input
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                className="bg-gray-100 border border-gray-200 rounded-md p-3 text-md"
                placeholder="أدخل سبب الجلسة"
              />
            </div>
          )}
          <div className="flex flex-row gap-8 max-md:flex-col">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-md text-gray-800">وقت الجلسة</label>
              <input
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                className="bg-gray-100 border border-gray-200 rounded-md p-3 text-md"
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-md text-gray-800">تاريخ الجلسة</label>
              <input
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                className="bg-gray-100 border border-gray-200 rounded-md p-3 text-md"
              />
            </div>
          </div>
          <div className="flex flex-row gap-8">
              <div className="flex-1 flex flex-col gap-2">
              <label className="text-md text-gray-800">المحضر</label>
              <textarea
                name="result"
                value={formData.result}
                onChange={handleInputChange}
                className={`bg-gray-100 border border-gray-200 rounded-md p-3 min-h-[60px] text-md ${type === 'add' ? 'text-gray-500' : ''}`}
                placeholder={type === 'new' ? 'أدخل المحضر (اختياري)' : ''}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-4 max-md:flex-col">
          <button onClick={onClose} className="w-[116px] h-[33px] max-md:w-full border border-teal-800 text-gray-800 rounded text-base font-inter">
            إلغاء
          </button>
          <button onClick={handleSave} className="w-[116px] h-[33px] max-md:w-full bg-teal-800 border border-teal-800 text-gray-100 rounded text-base font-inter">
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [modalType, setModalType] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const pageSize = 10;

  const fetchSessions = async () => {
    try {
      const query = new URLSearchParams({ page: page.toString(), reason: search, ...(dateFilter && { date: dateFilter }) }).toString();
      const response = await fetch(`/api/sessions?${query}`);
      const data = await response.json();
      if (response.ok) {
        setSessions(data.sessions || []);
        setTotalResults(data.totalResults || 0);
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [page, search, dateFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, dateFilter]);

  const openModal = (type, session = null) => {
    setModalType(type);
    setSelectedSession(session);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedSession(null);
  };

  const handleSave = () => {
    fetchSessions();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'غير متوفر';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
  };

  const [userName, setUserName] = useState('');
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const decoded = jwtDecode(token);
    setUserName(decoded.username);
  }, []);

  // const exportToPDF = async () => {
  
  
  //   let dataToExport = exportedData;
    
  // const doc = new jsPDF({orientation: 'landscape'});
  // const pageWidth = doc.internal.pageSize.width;
  // const pageHeight = doc.internal.pageSize.height;
  // if (formData.searchTerm || ageFilter || nationalityFilter) {
  //   dataToExport = await fetchFilteredDataExporting();
  // }

  // // 🔷 تحميل شعار مرة واحدة (لكن نستخدمه في كل صفحة)
  // const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
  // const logoBuffer = await logo.arrayBuffer();
  // const logoBytes = new Uint8Array(logoBuffer);
  // const logoBase64 = Buffer.from(logoBytes).toString('base64');
  
  //   try {
  //     const response = await fetch('/fonts/Amiri-Regular.ttf');
  //     if (!response.ok) throw new Error('Failed to fetch font');
  //     const fontBuffer = await response.arrayBuffer();
  //     const fontBytes = new Uint8Array(fontBuffer);
  //     const fontBase64 = Buffer.from(fontBytes).toString('base64');
  //     doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
  //     doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
  //     doc.setFont('Amiri', 'normal');
  //   } catch (error) {
  //     console.error('Error loading Amiri font:', error);
  //     setModalMessage('خطأ في تحميل الخط العربي');
  //     setShowErrorModal(true);
  //     return;
  //   }
  //   doc.setLanguage('ar');
  //   doc.setFontSize(12);
  //   const tableColumn = [
  //     'العمر',
  //     'جواز السفر',
  //     'الجنسية',
  //     'اسم العاملة',
  //     'رقم العاملة',
  //     'هوية العميل',
  //     'رقم العميل',
  //     'اسم العميل',
  //     'رقم الطلب',
  //   ];
  //   const tableRows = exportedData.map((row: any) => [
  //     row.HomeMaid?.age || calculateAge(row.HomeMaid?.dateofbirth),
  //     row.Passportnumber || 'غير متوفر',
  //     row.HomeMaid?.office?.Country || 'غير متوفر',
  //     row.HomeMaid?.Name || 'غير متوفر',
  //     row.HomeMaid?.id || 'غير متوفر',
  //     row.client?.nationalId || 'غير متوفر',
  //     row.client?.phonenumber || 'غير متوفر',
  //     row.client?.fullname || 'غير متوفر',
  //     row.id || 'غير متوفر',
  //   ]);
  //   doc.autoTable({
  //     head: [tableColumn],
  //     body: tableRows,
  //     styles: {
  //       font: 'Amiri',
  //       halign: 'right',
  //       fontSize: 10,
  //       cellPadding: 2,
  //       textColor: [0, 0, 0],
  //     },
  //     headStyles: {
  //       fillColor: [26, 77, 79],
  //       textColor: [255, 255, 255],
  //       halign: 'right',
  //     },
  //     margin: { top: 39, right: 10, left: 10 },


  //      didDrawPage: (data: any) => {
  //     const pageHeight = doc.internal.pageSize.height;
  //     const pageWidth = doc.internal.pageSize.width;

  //     // 🔷 إضافة اللوجو أعلى الصفحة (في كل صفحة)
  //     doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

  //     // 🔹 كتابة العنوان في أول صفحة فقط (اختياري)
  //     if (doc.getCurrentPageInfo().pageNumber === 1) {
  //       doc.setFontSize(12);
  //       doc.setFont('Amiri', 'normal');
  //       doc.text('الطلبات الجديدة', pageWidth / 2, 20, { align: 'right' });
  //     }

  //     // 🔸 الفوتر
  //     doc.setFontSize(10);
  //     doc.setFont('Amiri', 'normal');

  //     doc.text(userName, 10, pageHeight - 10, { align: 'left' });

  //     const pageNumber = `صفحة ${doc.getCurrentPageInfo().pageNumber}`;
  //     doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });

  //     const dateText =
  //       "التاريخ: " +
  //       new Date().toLocaleDateString('ar-EG', {
  //         day: 'numeric',
  //         month: 'short',
  //         year: 'numeric',
  //       }) +
  //       "  الساعة: " +
  //       new Date().toLocaleTimeString('ar-EG', {
  //         hour: '2-digit',
  //         minute: '2-digit',
  //       });
  //     doc.text(dateText, pageWidth - 10, pageHeight - 10, { align: 'right' });
  //   },

  //     didParseCell: (data: any) => {
  //       data.cell.styles.halign = 'right';
  //     },
  //   });
  //   doc.save('new_orders.pdf');
  // };

const fetchFilteredSessions = async () => {
    try {
      const query = new URLSearchParams({ page: page.toString(), reason: search, ...(dateFilter && { date: dateFilter }) }).toString();
      const response = await fetch(`/api/sessions?${query}`);
      const data = await response.json();
      if (response.ok) {
      return data.sessions;
        // setTotalResults(data.totalResults || 0);
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const exportToPDF = async () => {
    let dataToExport = await fetchFilteredSessions();
    const doc = new jsPDF({orientation: 'landscape'});
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // 🔷 تحميل شعار مرة واحدة (لكن نستخدمه في كل صفحة)
    const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
    const logoBuffer = await logo.arrayBuffer();
    const logoBytes = new Uint8Array(logoBuffer);
    const logoBase64 = Buffer.from(logoBytes).toString('base64');

    // 🔷 تحميل خط أميري
    try {
      const response = await fetch('/fonts/Amiri-Regular.ttf');
      if (!response.ok) throw new Error('Failed to fetch font');
      const fontBuffer = await response.arrayBuffer();
      const fontBytes = new Uint8Array(fontBuffer);
      const fontBase64 = Buffer.from(fontBytes).toString('base64');
      doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
      doc.setFont('Amiri', 'normal');
    } catch (error) {
      console.error('Error loading Amiri font:', error);
      return;
    }

    doc.setLanguage('ar');
    doc.setFontSize(12);

    const tableColumn = ['المحضر', 'وقت الجلسة', 'تاريخ الجلسة', 'اسم العاملة', 'سبب الجلسة', '#'];
    const tableRows = dataToExport.map(row => [
      row.result || 'لا يوجد',
      formatTime(row.time),
      formatDate(row.date),
      row.user?.Name || 'غير متوفر',
      row.reason || 'غير متوفر',
      row.id,
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

        // 🔷 إضافة اللوجو أعلى الصفحة (في كل صفحة)
        doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

        // 🔹 كتابة العنوان في أول صفحة فقط (اختياري)
        if (doc.getCurrentPageInfo().pageNumber === 1) {
          doc.setFontSize(12);
          doc.setFont('Amiri', 'normal');
          doc.text('الجلسات', pageWidth / 2, 20, { align: 'right' });
        }

        // 🔸 الفوتر
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

    doc.save('sessions.pdf');
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(sessions.map(row => ({
      '#': row.id,
      'سبب الجلسة': row.reason || 'غير متوفر',
      'اسم العاملة': row.user?.Name || 'غير متوفر',
      'تاريخ الجلسة': formatDate(row.date),
      'وقت الجلسة': formatTime(row.time),
      'المحضر': row.result || 'لا يوجد'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sessions');
    XLSX.writeFile(wb, 'sessions.xlsx');
  };

  const hasPreviousPage = page > 1;
  const hasNextPage = page * pageSize < totalResults;

  return (
    <Layout>
      <main className={`p-6 min-w-[1340px] mx-auto ${Style["tajawal-regular"]}`}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-normal text-black text-right">الجلسات</h1>

          <button
            onClick={() => openModal('new')}
            className="flex items-center gap-2 bg-teal-800 text-white border-none rounded-lg px-4 py-2 text-md hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            إضافة جلسة
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center border border-gray-200 rounded bg-gray-100 p-2">
                <input
                  type="text"
                  placeholder="بحث"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-none bg-transparent p-2 outline-none text-md"
                />
                <button>
                  <Search className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              <div className="flex items-center gap-2 border border-gray-200 rounded bg-gray-100 p-2 text-gray-500 text-md">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="border-none bg-transparent outline-none"
                />
                <Calendar className="w-6 h-6" />
              </div>
              <button
                onClick={() => { setSearch(''); setDateFilter(''); }}
                className="bg-teal-800 text-white border-none rounded-lg px-4 py-2 text-md"
              >
                إعادة ضبط
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={exportToPDF} className="flex items-center gap-1 bg-teal-800 text-white border-none rounded px-2 py-1 text-md">
                <DocumentText className="w-5 h-5" />
                <span>PDF</span>
              </button>
              <button onClick={exportToExcel} className="flex items-center gap-1 bg-teal-800 text-white border-none rounded px-2 py-1 text-md">
                <DocumentDownload className="w-5 h-5" />
                <span>Excel</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[0.5fr_1.5fr_1.5fr_1.2fr_1fr_1fr_1fr] gap-4 p-4 bg-teal-800 text-white text-base rounded-t-lg">
                <div>#</div>
                <div>سبب الجلسة</div>
                <div>اسم العاملة</div>
                <div>تاريخ الجلسة</div>
                <div>وقت الجلسة</div>
                <div>المحضر</div>
                <div>الإجراءات</div>
              </div>
              <div>
                {sessions.length > 0 ? (
                  sessions.map((row) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-[0.5fr_1.5fr_1.5fr_1.2fr_1fr_1fr_1fr] gap-4 p-4 bg-gray-100 border-t border-gray-200 text-md"
                    >
                      <div className="td" data-label="#">{row.id}</div>
                      <div className="td" data-label="سبب الجلسة">{row.reason || 'غير متوفر'}</div>
                      <div className="td" data-label="اسم العاملة">{row.user?.Name || 'غير متوفر'}</div>
                      <div className="td" data-label="تاريخ الجلسة">{formatDate(row.date)}</div>
                      <div className="td" data-label="وقت الجلسة">{formatTime(row.time)}</div>
                      <div className="td" data-label="المحضر">{row.result?.slice(0,5)+"...." || 'لا يوجد'}</div>
                      <div
                        className="td cursor-pointer text-teal-800 underline"
                        data-label="الإجراءات"
                        onClick={() => openModal(row.result ? 'view' : 'add', row)}
                      >
                        {row.result ? 'عرض' : 'تسجيل'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">لا توجد جلسات</div>
                )}
              </div>
            </div>
          </div>
          <footer className="flex justify-between items-center pt-5 text-base flex-wrap gap-4">
            <div>عرض {(page - 1) * pageSize + 1}- {Math.min(page * pageSize, totalResults)} من {totalResults} نتيجة</div>
            <nav className="flex items-center gap-1">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (hasPreviousPage) setPage((prev) => prev - 1);
                }}
                className={`px-2 py-1 border border-gray-200 rounded text-md bg-gray-100 hover:bg-gray-200 ${!hasPreviousPage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                السابق
              </a>
              <a
                href="#"
                className="px-2 py-1 border border-teal-800 rounded text-md bg-teal-800 text-white"
              >
                {page}
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (hasNextPage) setPage((prev) => prev + 1);
                }}
                className={`px-2 py-1 border border-gray-200 rounded text-md bg-gray-100 hover:bg-gray-200 ${!hasNextPage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                التالي
              </a>
            </nav>
          </footer>
        </div>
        <Modal
          isOpen={modalType !== null}
          onClose={closeModal}
          type={modalType}
          session={selectedSession}
          onSave={handleSave}
        />
      </main>
    </Layout>
  );
}