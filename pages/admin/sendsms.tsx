import { useState, useEffect, useRef } from 'react';
import Layout from 'example/containers/Layout';
import Head from 'next/head';
import { Search, Send, Users, Check, AlertCircle, RefreshCw, MessageSquare, Plus, Trash2 } from 'lucide-react';

interface Employee {
  id: number;
  name: string;
  position: string | null;
  department: string | null;
  phoneNumber: string | null;
  email: string | null;
  isActive: boolean;
}

export default function SendSMSPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [departments, setDepartments] = useState<string[]>([]);
  
  // Selection state
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [customNumber, setCustomNumber] = useState('');
  
  // Message state
  const [message, setMessage] = useState('');
  const [templates] = useState([
    { title: 'تذكير بالعهدة النقدية', text: 'عزيزي الموظف، يرجى تصفية العهدة النقدية المسلمة إليك في أقرب وقت. شكراً لتعاونكم.' },
    { title: 'تنبيه وصول عاملة منزلية', text: 'تنبيه: نود إفادتكم بوجود عاملة جديدة قادمة اليوم يرجى الاستعداد للتجهيزات اللازمة.' },
    { title: 'اجتماع عمل طارئ', text: 'السلام عليكم، يرجى حضور اجتماع العمل الطارئ اليوم في تمام الساعة الواحدة ظهراً في قاعة الاجتماعات.' },
    { title: 'تهنئة رسمية للعملاء', text: 'عميلنا العزيز، يسعدنا في شركة رواس لخدمات الاستقدام تقديم أطيب التهاني لكم ونسعد بخدمتكم دائماً.' }
  ]);

  // Alert/Notification states
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch employees (users)
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users-for-sms');
      if (response.ok) {
        const empList = await response.json();
        setEmployees(empList);
        setFilteredEmployees(empList);
        
        // Extract unique departments
        const deptSet = new Set<string>();
        empList.forEach((emp: Employee) => {
          if (emp.department) deptSet.add(emp.department);
        });
        setDepartments(Array.from(deptSet));
      } else {
        showToast('error', 'فشل جلب قائمة المستخدمين');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('error', 'حدث خطأ أثناء تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filter employees when search or department changes
  useEffect(() => {
    let result = employees;
    
    if (search.trim() !== '') {
      const term = search.toLowerCase();
      result = result.filter(emp => 
        emp.name.toLowerCase().includes(term) ||
        (emp.phoneNumber && emp.phoneNumber.includes(term)) ||
        (emp.position && emp.position.toLowerCase().includes(term))
      );
    }
    
    if (departmentFilter !== 'all') {
      result = result.filter(emp => emp.department === departmentFilter);
    }
    
    setFilteredEmployees(result);
  }, [search, departmentFilter, employees]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Toggle single employee selection
  const handleSelectEmployee = (id: number) => {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(selectedEmployees.filter(empId => empId !== id));
    } else {
      setSelectedEmployees([...selectedEmployees, id]);
    }
  };

  // Toggle select all
  const handleSelectAll = () => {
    const visibleIds = filteredEmployees.map(emp => emp.id);
    const allVisibleSelected = visibleIds.every(id => selectedEmployees.includes(id));
    
    if (allVisibleSelected) {
      // Unselect all currently filtered visible employees
      setSelectedEmployees(selectedEmployees.filter(id => !visibleIds.includes(id)));
    } else {
      // Select all currently filtered visible employees
      const uniqueIds = Array.from(new Set([...selectedEmployees, ...visibleIds]));
      setSelectedEmployees(uniqueIds);
    }
  };

  // Send SMS
  const handleSendSMS = async () => {
    if (!message.trim()) {
      showToast('error', 'الرجاء كتابة نص الرسالة أولاً');
      return;
    }

    // Collect all recipient numbers
    const recipients: string[] = [];

    // Add selected employees phone numbers
    selectedEmployees.forEach(empId => {
      const emp = employees.find(e => e.id === empId);
      if (emp && emp.phoneNumber) {
        recipients.push(emp.phoneNumber);
      }
    });

    // Add custom phone number if provided
    if (customNumber.trim()) {
      recipients.push(customNumber.trim());
    }

    if (recipients.length === 0) {
      showToast('error', 'الرجاء اختيار موظف واحد على الأقل أو إدخال رقم هاتف');
      return;
    }

    setSending(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Send SMS to each recipient
      for (const number of recipients) {
        const response = await fetch('/api/sendsms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: number,
            message: message.trim()
          })
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      }

      if (failCount === 0) {
        showToast('success', `تم إرسال الرسالة بنجاح إلى ${successCount} مستلم 🎉`);
        setMessage('');
        setSelectedEmployees([]);
        setCustomNumber('');
      } else {
        showToast('success', `اكتمل الإرسال: تم إرسال ${successCount} بنجاح، وفشل ${failCount}`);
      }

    } catch (error) {
      console.error('Error sending SMS:', error);
      showToast('error', 'حدث خطأ في النظام أثناء محاولة الإرسال');
    } finally {
      setSending(false);
    }
  };

  // SMS character properties for Arabic logic
  const getSmsPartsCount = (text: string) => {
    if (!text) return { chars: 0, parts: 0 };
    const len = text.length;
    // Arabic SMS limit is 70 for 1 part, 67 per part for multi-part
    if (len <= 70) return { chars: len, parts: 1, limit: 70 };
    const parts = Math.ceil(len / 67);
    return { chars: len, parts, limit: parts * 67 };
  };

  const smsMetrics = getSmsPartsCount(message);

  return (
    <Layout>
      <Head>
        <title>إرسال رسائل SMS | لوحة التحكم</title>
      </Head>
      <div className="container mx-auto p-4 md:p-6" dir="rtl">
        
        {/* Toast Alert */}
        {toast && (
          <div className={`fixed top-4 left-4 right-4 md:left-auto md:w-96 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 transition-all duration-300 transform translate-y-0 animate-in slide-in-from-top-4 border ${
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {toast.type === 'success' ? <Check className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-teal-950 flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-teal-800" />
              <span>نظام التنبيهات والرسائل القصيرة (SMS)</span>
            </h1>
            <p className="text-gray-500 mt-1.5 text-sm font-medium">إرسال التنبيهات والرسائل الفورية للموظفين والعملاء عبر بوابة RawaesES</p>
          </div>
        </div>

        {/* Grid System */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Right Column: Write Message & Templates */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* SMS Form Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-lg font-bold text-teal-950 flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
                <Send className="w-5 h-5 text-teal-800" />
                <span>إنشاء رسالة جديدة</span>
              </h2>

              {/* Recipient Manual Input */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">أو إدخال رقم هاتف يدوي (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: 0555xxxxxx"
                  value={customNumber}
                  onChange={(e) => setCustomNumber(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 focus:outline-none transition-all placeholder-gray-400 font-mono text-left"
                />
              </div>

              {/* Message Input */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">مضمون نص الرسالة</label>
                <textarea
                  placeholder="اكتب نص الرسالة هنا..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:border-teal-700 focus:ring-2 focus:ring-teal-700/10 focus:outline-none transition-all placeholder-gray-400 resize-none leading-relaxed"
                />
              </div>

              {/* Character Metrics */}
              <div className="flex items-center justify-between bg-teal-50/40 border border-teal-100/50 rounded-xl px-4 py-2.5 mb-5 text-xs text-teal-900 font-semibold">
                <span>عدد الحروف: {smsMetrics.chars}</span>
                <span>الأجزاء: {smsMetrics.parts} رسالة</span>
                <span>الحد الأقصى: {smsMetrics.limit} حرف</span>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSendSMS}
                disabled={sending || (!message.trim() && !customNumber.trim())}
                className="w-full flex items-center justify-center gap-2 bg-teal-900 hover:bg-teal-950 active:bg-teal-950/90 text-white rounded-xl py-3 px-5 text-sm font-bold shadow-md shadow-teal-900/10 disabled:opacity-50 transition-all transition-colors h-12"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري الإرسال الآن...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 rotate-180" />
                    <span>إرسال الرسالة القصيرة</span>
                  </>
                )}
              </button>
            </div>

            {/* Templates Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h2 className="text-lg font-bold text-teal-950 flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
                <MessageSquare className="w-5 h-5 text-teal-800" />
                <span>قوالب رسائل جاهزة</span>
              </h2>
              <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
                {templates.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => setMessage(tpl.text)}
                    className="text-right p-3 rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50/20 active:bg-teal-50/40 transition-all text-xs font-semibold text-teal-950 flex flex-col gap-1"
                  >
                    <span className="font-bold text-teal-900 text-sm">{tpl.title}</span>
                    <span className="text-gray-500 font-medium leading-relaxed line-clamp-2">{tpl.text}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Left Column: Employee Selection List */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Filter and Search Panel */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Search Field */}
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-grow min-w-[200px] focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-700/10 transition-all">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ابحث باسم الموظف، المسمى، أو الهاتف..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs text-gray-800 placeholder-gray-400 w-full font-semibold"
                  />
                </div>

                {/* Department Dropdown */}
                <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-full sm:w-44 focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-700/10 transition-all">
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs text-gray-700 w-full cursor-pointer font-bold"
                    style={{ appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    <option value="all">كل الأقسام</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-3 pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>

                {/* Selected Counters */}
                <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-2 text-teal-900 text-xs font-bold whitespace-nowrap">
                  المحددون: {selectedEmployees.length} موظف
                </div>

              </div>
            </div>

            {/* Employees List Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-grow flex flex-col min-h-[400px]">
              
              {/* Select All Bar */}
              <div className="bg-teal-900 text-white px-5 py-3.5 flex items-center justify-between text-sm font-semibold select-none">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={filteredEmployees.length > 0 && filteredEmployees.every(emp => selectedEmployees.includes(emp.id))}
                    onChange={handleSelectAll}
                    className="rounded text-teal-800 focus:ring-teal-700 h-4.5 w-4.5 border-gray-300 cursor-pointer"
                  />
                  <span>تحديد جميع الموظفين المفلترين ({filteredEmployees.length})</span>
                </div>
                <Users className="w-4 h-4 text-teal-200" />
              </div>

              {/* List Content */}
              <div className="overflow-y-auto divide-y divide-gray-100 flex-grow max-h-[500px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
                    <RefreshCw className="w-8 h-8 animate-spin text-teal-800" />
                    <span className="text-sm font-bold">جاري تحميل قائمة الموظفين...</span>
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
                    <Users className="w-12 h-12 stroke-1" />
                    <span className="text-sm font-bold">لا يوجد موظفون يطابقون خيارات البحث</span>
                  </div>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isSelected = selectedEmployees.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => handleSelectEmployee(emp.id)}
                        className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-all ${
                          isSelected ? 'bg-teal-50/30' : 'hover:bg-gray-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded text-teal-800 focus:ring-teal-700 h-4.5 w-4.5 border-gray-300 pointer-events-none"
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-teal-950 text-sm">{emp.name}</span>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 font-semibold mt-0.5">
                              {emp.position && <span>{emp.position}</span>}
                              {emp.position && emp.department && <span>•</span>}
                              {emp.department && <span>قسم {emp.department}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Phone Number Display */}
                        {emp.phoneNumber ? (
                          <span className="text-xs font-bold text-gray-600 font-mono bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1 text-left select-all" dir="ltr">
                            {emp.phoneNumber}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-2 py-0.5">
                            بدون هاتف
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </Layout>
  );
}
