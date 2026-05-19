import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Layout from 'example/containers/Layout';
import { Plus, FileText, Upload, Calendar, ChevronLeft, ChevronRight, Search, Edit, Trash2, Layout as LayoutIcon, X, Printer, RefreshCw } from 'lucide-react';
import { DocumentTextIcon } from '@heroicons/react/outline';
import { jsPDF } from 'jspdf';
import Style from 'styles/Home.module.css';
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';

// Dynamically import ReactQuill with SSR disabled
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
});
import 'react-quill/dist/quill.snow.css';

interface Template {
  id: number;
  title: string;
  content: string;
  type: string;
  dynamicFields?: string[];
  defaultValues?: { [key: string]: string };
}

interface Notification {
  message: string;
  type: 'success' | 'error';
}

// Custom Date Picker Component
const CustomDatePicker: React.FC<{
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = "اختر التاريخ" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const days = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    }
  }, [value]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const handleDateSelect = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const newDate = new Date(year, month, day);
    setSelectedDate(newDate);
    
    // Format date as YYYY-MM-DD without timezone issues
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(formattedDate);
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return cellDate.toDateString() === today.toDateString();
  };

  const isSelected = (day: number | null) => {
    if (!day || !selectedDate) return false;
    const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return cellDate.toDateString() === selectedDate.toDateString();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-50 border border-gray-300 rounded-md p-2.5 text-sm text-gray-800 placeholder-gray-500 text-right focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 hover:border-gray-400"
      >
        <div className="flex items-center justify-between">
          <span>{value ? formatDate(value) : placeholder}</span>
          <Calendar className="w-5 h-5 text-teal-600" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold">
                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 bg-gray-50">
            {days.map(day => (
              <div key={day} className="p-2 text-center text-xs font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 p-2">
            {getDaysInMonth(currentMonth).map((day, index) => (
              <button
                key={index}
                type="button"
                onClick={() => day && handleDateSelect(day)}
                disabled={!day}
                className={`
                  p-2 text-sm rounded-lg transition-all duration-200
                  ${!day ? 'invisible' : ''}
                  ${isToday(day) ? 'bg-teal-100 text-teal-700 font-semibold' : ''}
                  ${isSelected(day) ? 'bg-teal-500 text-white font-semibold' : ''}
                  ${!isSelected(day) && !isToday(day) ? 'hover:bg-gray-100 text-gray-700' : ''}
                  ${day && !isSelected(day) && !isToday(day) ? 'hover:scale-105' : ''}
                `}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-3 border-t border-gray-200">
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>اليوم: {new Date().toLocaleDateString('ar-SA')}</span>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setSelectedDate(today);
                  const year = today.getFullYear();
                  const month = today.getMonth();
                  const day = today.getDate();
                  const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  onChange(formattedDate);
                  setIsOpen(false);
                }}
                className="px-3 py-1 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
              >
                اليوم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [editorContent, setEditorContent] = useState('');
  const [dynamicFieldValues, setDynamicFieldValues] = useState<{ [key: string]: string }>({});
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [watermarkImage, setWatermarkImage] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [dateValue, setDateValue] = useState('');
  const [signatureValue, setSignatureValue] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Helper functions for dates
  const getHijriDate = () => {
    try {
      const today = new Date();
      const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      });
      const parts = formatter.formatToParts(today);
      const d = parts.find(p => p.type === 'day')?.value;
      const m = parts.find(p => p.type === 'month')?.value;
      const y = parts.find(p => p.type === 'year')?.value;
      
      const fixDigits = (s: string | undefined) => s ? s.replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))) : '';
      // Return Year/Month/Day so that in RTL context, Day appears on the right
      return `${fixDigits(y)}/${fixDigits(m)}/${fixDigits(d)}`;
    } catch (e) {
      return "1447/11/26"; // Hard fallback in Y/M/D
    }
  };

  const getGregorianDate = () => {
    const today = new Date();
    const d = today.getDate();
    const m = today.getMonth() + 1;
    const y = today.getFullYear();
    // Return Year/Month/Day for RTL visual consistency
    return `${y}/${m}/${d}`;
  };

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: selectedTemplate?.title || 'Document',
  });


  // Order search states
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderSearchResults, setOrderSearchResults] = useState<any[]>([]);
  const [isSearchingOrders, setIsSearchingOrders] = useState(false);

  const searchOrders = async (query: string) => {
    if (query.length < 3) {
      setOrderSearchResults([]);
      return;
    }
    setIsSearchingOrders(true);
    try {
      const response = await fetch(`/api/templates/search-orders?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setOrderSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching orders:', error);
    } finally {
      setIsSearchingOrders(false);
    }
  };

  const handleOrderSelectData = (orderData: any) => {
    setDynamicFieldValues((prev) => {
      const newValues = { ...prev, ...orderData };
      
      // Also map fields to numbered versions (e.g. employer_name -> employer_name1, employer_name2...)
      Object.keys(orderData).forEach(key => {
        const value = orderData[key];
        if (selectedTemplate?.dynamicFields) {
          selectedTemplate.dynamicFields.forEach(field => {
            // If the template field starts with the key and followed by a number
            // OR if it's a direct match, populate it.
            if (field === key || (field.startsWith(key) && field.match(new RegExp(`^${key}\\d+$`)))) {
              newValues[field] = value;
            }
          });
        }
      });
      
      // Auto-calculate refund amount if all required fields are present
      const costVal = newValues['contract_amount'] || newValues['amount'];
      const arrivalVal = newValues['arrival_date'];
      const receiveVal = newValues['receive_date'] || newValues['handover_date'] || newValues['date'];
      if (costVal && arrivalVal && receiveVal) {
        const totalCost = parseFloat(costVal);
        const arrivalDate = new Date(arrivalVal);
        const receiveDate = new Date(receiveVal);
        if (!isNaN(totalCost) && !isNaN(arrivalDate.getTime()) && !isNaN(receiveDate.getTime())) {
          const diffTime = receiveDate.getTime() - arrivalDate.getTime();
          const daysSinceArrival = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
          const remainingDays = Math.max(0, 730 - daysSinceArrival);
          newValues['refund_amount'] = ((totalCost / 730) * remainingDays).toFixed(2);
        }
      }

      return newValues;
    });
    setOrderSearchResults([]);
    setOrderSearchQuery('');
    showNotification('تم استيراد بيانات العقد بنجاح', 'success');
  };

  // Function to extract dynamic fields from content
  const extractDynamicFields = (content: string): string[] => {
    const regex = /\{([a-zA-Z0-9_]+)\}/g;
    const matches = content.match(regex) || [];
    return matches.map((field) => field.replace(/[\{\}]/g, ''));
  };

  // Show notification modal
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Load system logo automatically
  useEffect(() => {
    const loadSystemLogo = async () => {
      try {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            setLogoImage(dataURL);
          }
        };
        img.onerror = () => {
          console.error('Failed to load system logo');
        };
        img.src = '/images/homelogo.png';
      } catch (error) {
        console.error('Error loading system logo:', error);
      }
    };
    loadSystemLogo();
  }, []);

  // Load favicon and convert to grayscale watermark with transparency
  useEffect(() => {
    const loadWatermark = async () => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Draw the image
            ctx.drawImage(img, 0, 0);
            
            // Convert to grayscale and apply transparency
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
              // Calculate grayscale value using luminance formula
              const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
              data[i] = gray;     // Red
              data[i + 1] = gray; // Green
              data[i + 2] = gray; // Blue
              // Apply transparency (reduce alpha to 10% for watermark effect)
              data[i + 3] = data[i + 3] * 0.1;
            }
            
            ctx.putImageData(imageData, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            setWatermarkImage(dataURL);
          }
        };
        img.onerror = () => {
          console.error('Failed to load favicon for watermark');
        };
        img.src = '/favicon.ico';
      } catch (error) {
        console.error('Error loading watermark:', error);
      }
    };
    loadWatermark();
  }, []);

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/templates');
        const data = await res.json();
        const templatesWithFields = data.map((template: Template) => {
          const fields = extractDynamicFields(template.content);
          return {
            ...template,
            dynamicFields: fields,
          };
        });
        setTemplates(templatesWithFields);
        if (templatesWithFields.length > 0) {
          const firstTemplate = templatesWithFields[0];
          setSelectedTemplate(firstTemplate);
          setEditorContent(firstTemplate.content);
          
          // Re-extract fields and auto-calculate dates for the first template
          const freshFields = extractDynamicFields(firstTemplate.content);
          const initialValues: { [key: string]: string } = {};
          freshFields.forEach(f => initialValues[f] = '');
          
          // Auto-calculate dates if present
          if (freshFields.includes('hijri_date')) {
            initialValues['hijri_date'] = getHijriDate();
          }
          if (freshFields.includes('daily_penalty_amount') && !initialValues['daily_penalty_amount']) {
            initialValues['daily_penalty_amount'] = '50';
          }
          
          const gregorianFields = ['gregorian_date', 'handover_date', 'visa_date', 'start_date', 'end_date', 'date'];
          gregorianFields.forEach(field => {
            if (freshFields.includes(field)) {
              initialValues[field] = getGregorianDate();
              
              // Auto-calculate day if this is a handover_date
              if (field === 'handover_date' && freshFields.includes('handover_day')) {
                initialValues['handover_day'] = new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(new Date());
              }
            }
          });
          
          setDynamicFieldValues(initialValues);
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
        const dummyTemplate = {
          id: 1,
          title: 'قالب اختبار',
          content: '<p>مرحبًا {name}، التاريخ: {date}</p>',
          type: 'custom',
          dynamicFields: ['name', 'date'],
        };
        setTemplates([dummyTemplate]);
        setSelectedTemplate(dummyTemplate);
        setEditorContent(dummyTemplate.content);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const showAddTemplateModal = () => {
    setIsEditMode(false);
    setEditorContent('');
    setIsModalOpen(true);
  };

  const showEditTemplateModal = () => {
    setIsEditMode(true);
    setEditorContent(selectedTemplate?.content || '');
    setIsModalOpen(true);
  };

  const hideAddTemplateModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditorContent('');
    setDynamicFieldValues({});
  };

  const showPdfModal = () => {
    setIsPdfModalOpen(true);
  };

  const hidePdfModal = () => {
    setIsPdfModalOpen(false);
    setDateValue('');
    setSignatureValue('');
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setEditorContent(template.content);
    setOrderSearchQuery('');
    setOrderSearchResults([]);
    
    // Extract fields fresh from content to avoid stale fields from DB
    const freshFields = extractDynamicFields(template.content);
    const newValues: { [key: string]: string } = {};
    freshFields.forEach((field) => {
      newValues[field] = dynamicFieldValues[field] || '';
    });

    // Auto-calculate dates if they are present in freshFields
    if (freshFields.includes('hijri_date')) {
      const currentVal = newValues['hijri_date'];
      // If missing or looks like Gregorian (year > 2000), update it to actual Hijri
      if (!currentVal || parseInt(currentVal.split('/').pop() || '0') > 2000) {
        newValues['hijri_date'] = getHijriDate();
      }
    }
    if (freshFields.includes('daily_penalty_amount') && !newValues['daily_penalty_amount']) {
      newValues['daily_penalty_amount'] = '50';
    }
    
    // Auto-populate other date fields with Gregorian Day/Month/Year
    const gregorianFields = ['gregorian_date', 'handover_date', 'visa_date', 'start_date', 'end_date', 'date'];
    gregorianFields.forEach(field => {
      if (freshFields.includes(field) && !newValues[field]) {
        newValues[field] = getGregorianDate();
      }
      
      // Auto-calculate day if this is a handover_date and we have a value
      if (field === 'handover_date' && freshFields.includes('handover_day')) {
        const dateVal = newValues['handover_date'];
        if (dateVal) {
          try {
            const date = new Date(dateVal);
            if (!isNaN(date.getTime())) {
              newValues['handover_day'] = new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(date);
            }
          } catch (e) {}
        }
      }
    });

    setDynamicFieldValues(newValues);
    setDateValue('');
    setSignatureValue('');
  };

  const handleAddTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('template-title') as string;
    const content = editorContent;
    const type = 'custom';
    const dynamicFields = extractDynamicFields(content);

    if (!title || !content) {
      showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }

    try {
      const res = await fetch('/api/templates', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEditMode
            ? { id: selectedTemplate?.id, title, content, type, dynamicFields, defaultValues: dynamicFieldValues }
            : { title, content, type, dynamicFields, defaultValues: dynamicFieldValues }
        ),
      });
      if (res.ok) {
        const updatedTemplate = await res.json();
        if (isEditMode) {
          setTemplates((prev) =>
            prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
          );
          setSelectedTemplate(updatedTemplate);
        } else {
          setTemplates((prev) => [...prev, updatedTemplate]);
          setSelectedTemplate(updatedTemplate);
        }
        hideAddTemplateModal();
        setDynamicFieldValues({});
        showNotification(`تم ${isEditMode ? 'تحديث' : 'إضافة'} القالب بنجاح`, 'success');
      } else {
        showNotification(`فشل في ${isEditMode ? 'تحديث' : 'إضافة'} القالب`, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('حدث خطأ', 'error');
    }
  };

  const renderContentWithDynamicFields = (content: string) => {
    let renderedContent = content;
    for (const [field, value] of Object.entries(dynamicFieldValues)) {
      // Use a global regex to replace all occurrences of {field}
      const regex = new RegExp(`{${field}}`, 'g');
      renderedContent = renderedContent.replace(regex, value || `{${field}}`);
    }
    return renderedContent;
  };

  const handleSaveDefaults = async () => {
    if (!selectedTemplate) return;
    try {
      const res = await fetch('/api/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTemplate.id,
          title: selectedTemplate.title,
          content: selectedTemplate.content,
          type: selectedTemplate.type,
          dynamicFields: selectedTemplate.dynamicFields,
          defaultValues: dynamicFieldValues,
        }),
      });
      if (res.ok) {
        const updatedTemplate = await res.json();
        setTemplates((prev) =>
          prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
        );
        setSelectedTemplate(updatedTemplate);
        showNotification('تم حفظ القيم الافتراضية بنجاح', 'success');
      } else {
        showNotification('فشل في حفظ القيم الافتراضية', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('حدث خطأ في حفظ القيم الافتراضية', 'error');
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      const res = await fetch('/api/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(null);
        }
        showNotification('تم حذف القالب بنجاح', 'success');
      } else {
        const data = await res.json();
        showNotification(data.error || 'فشل في حذف القالب', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('حدث خطأ في حذف القالب', 'error');
    }
  };

  const handleDynamicFieldChange = (field: string, value: string) => {
    setDynamicFieldValues(prev => {
      const newValues = { ...prev, [field]: value };
      
      // Auto-sync numbered fields if the modified field ends in '1'
      const match = field.match(/^(.*?)1$/);
      if (match) {
        const baseName = match[1];
        // Find other fields with the same base name but different numbers
        Object.keys(prev).forEach(f => {
          const suffixMatch = f.match(new RegExp(`^${baseName}(\\d+)$`));
          if (suffixMatch && f !== field) {
            // Only sync if the target field is currently empty OR was identical to the old value
            if (!prev[f] || prev[f] === prev[field]) {
              newValues[f] = value;
            }
          }
        });
      }

      // Auto-calculate day of week for date fields (e.g., handover_date -> handover_day)
      if (field.includes('handover_date')) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            const dayName = new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(date);
            const dayField = field.replace('handover_date', 'handover_day');
            newValues[dayField] = dayName;
          }
        } catch (e) {
          console.error('Error calculating day:', e);
        }
      }

      // Auto-calculate refund amount if all required fields are present
      const costVal = newValues['contract_amount'] || newValues['amount'];
      const arrivalVal = newValues['arrival_date'];
      const receiveVal = newValues['receive_date'] || newValues['handover_date'] || newValues['date'];
      if (costVal && arrivalVal && receiveVal) {
        const totalCost = parseFloat(costVal);
        const arrivalDate = new Date(arrivalVal);
        const receiveDate = new Date(receiveVal);
        if (!isNaN(totalCost) && !isNaN(arrivalDate.getTime()) && !isNaN(receiveDate.getTime())) {
          const diffTime = receiveDate.getTime() - arrivalDate.getTime();
          const daysSinceArrival = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
          const remainingDays = Math.max(0, 730 - daysSinceArrival);
          newValues['refund_amount'] = ((totalCost / 730) * remainingDays).toFixed(2);
        }
      }

      return newValues;
    });
  };

  const handleSyncTemplates = async () => {
    if (!confirm('هل تريد تحديث كافة القوالب من النظام؟ سيقوم هذا بإضافة القوالب الناقصة وتحديث الموجودة حالياً بآخر التنسيقات.')) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/templates/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showNotification('تمت مزامنة القوالب بنجاح', 'success');
        // Reload templates
        const templatesRes = await fetch('/api/templates');
        const templatesData = await templatesRes.json();
        setTemplates(templatesData);
      } else {
        showNotification(data.error || 'فشل في المزامنة', 'error');
      }
    } catch (error) {
      console.error('Sync Error:', error);
      showNotification('حدث خطأ أثناء المزامنة', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportToPDF = async () => {
    if (!selectedTemplate || !printRef.current) return;
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = printRef.current;
      
      const opt = {
        margin: 0,
        filename: `${selectedTemplate.title}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          logging: false,
          onclone: (clonedDoc: Document) => {
            // Smart fix for "oklch" unsupported color error
            // Instead of deleting, we replace oklch with a safe fallback color
            try {
              const styleTags = clonedDoc.getElementsByTagName('style');
              for (let i = 0; i < styleTags.length; i++) {
                // Replace oklch(...) with the primary brand color #00334e
                styleTags[i].innerHTML = styleTags[i].innerHTML.replace(/oklch\([^)]+\)/g, '#00334e');
              }
              
              // Ensure the print area is clean and professional
              const style = clonedDoc.createElement('style');
              style.innerHTML = `
                .print-area {
                  padding: 0 !important;
                  margin: 0 !important;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              `;
              clonedDoc.head.appendChild(style);
            } catch (err) {
              console.error('Error restoring colors:', err);
            }
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Direct export from the preview element
      await html2pdf().set(opt).from(element).save();
      showNotification('تم تصدير ملف PDF بنجاح', 'success');
    } catch (error) {
      console.error('PDF Export Error:', error);
      showNotification('حدث خطأ أثناء تصدير PDF', 'error');
    }
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredTemplates = templates.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-teal-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-medium text-teal-900">جارٍ التحميل...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>إدارة القوالب</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 0; /* This removes the browser header/footer (URL, date, title) */
            }
            body {
              -webkit-print-color-adjust: exact;
              margin: 0;
            }
            /* Apply custom padding to the printable area so content isn't at the very edge */
            .print-area {
              padding: 0 !important;
            }
          }
        `}</style>
      </Head>
      <div className={`p-6 min-h-screen text-gray-800 ${Style["tajawal-regular"]}`} dir="rtl">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-normal">إدارة القوالب</h1>
            <button
              onClick={handleSyncTemplates}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-all text-xs font-medium ${
                isSyncing 
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'جاري المزامنة...' : 'مزامنة القوالب'}</span>
            </button>
          </div>
          <button
            onClick={showAddTemplateModal}
            className="flex items-center gap-2 bg-teal-900 text-white px-4 py-2 rounded hover:bg-teal-800 transition duration-200 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة قالب</span>
          </button>
        </div>

        {/* Main Content Container */}
        <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden min-h-[700px] flex flex-col md:flex-row">
          
          {/* Right Sidebar: Template Selection */}
          <aside className="w-full md:w-80 bg-gray-50 border-l border-gray-300 flex flex-col">
            <div className="p-4 border-b border-gray-300 bg-white">
              <div className="flex items-center bg-gray-50 border border-gray-300 rounded px-3 py-2">
                <Search className="w-4 h-4 text-gray-400 ml-2" />
                <input
                  type="text"
                  placeholder="بحث عن قالب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none w-full text-right text-sm focus:ring-0"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[600px] md:max-h-none">
              <div className="p-2 space-y-1">
                {filteredTemplates.length > 0 ? (
                  filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full flex items-center justify-between p-3 rounded-md transition-all duration-200 text-right ${
                        selectedTemplate?.id === template.id
                          ? 'bg-teal-900 text-white shadow-md'
                          : 'hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <LayoutIcon className={`w-5 h-5 flex-shrink-0 ${selectedTemplate?.id === template.id ? 'text-teal-200' : 'text-teal-600'}`} />
                        <span className="font-medium text-sm truncate">{template.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trash2 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                          className={`w-4 h-4 cursor-pointer hover:scale-110 transition-transform ${
                            selectedTemplate?.id === template.id ? 'text-teal-200 hover:text-red-300' : 'text-gray-400 hover:text-red-500'
                          }`} 
                        />
                        <ChevronLeft className={`w-4 h-4 ${selectedTemplate?.id === template.id ? 'text-teal-200' : 'text-gray-400'}`} />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    لا توجد قوالب تطابق البحث
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Left Main: Template Editor/Preview */}
          <main className="flex-1 p-6 flex flex-col bg-white overflow-y-auto">
            {selectedTemplate ? (
              <div className="flex flex-col h-full">
                {/* Action Bar */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                  <div className="flex gap-2">
                    <button
                      onClick={showEditTemplateModal}
                      className="flex items-center gap-2 border border-teal-800 text-teal-900 px-4 py-2 rounded text-sm hover:bg-teal-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span>تعديل القالب</span>
                    </button>
                    <button
                      onClick={handleExportToPDF}
                      className="flex items-center gap-2 bg-teal-900 text-white px-4 py-2 rounded text-sm hover:bg-teal-800 transition-colors shadow-sm"
                    >
                      <FilePdfOutlined />
                      <span>تصدير PDF</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-2 bg-white border border-teal-800 text-teal-900 px-4 py-2 rounded text-sm hover:bg-teal-50 transition-colors shadow-sm"
                    >
                      <Printer className="w-4 h-4" />
                      <span>طباعة مباشرة</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                      className="flex items-center gap-2 border border-red-600 text-red-600 px-4 py-2 rounded text-sm hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف القالب</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-800">{selectedTemplate.title}</h2>
                    <div className="bg-teal-100 text-teal-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {selectedTemplate.type}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Preview Section */}
                  <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-700">معاينة المستند</h3>
                      <label className="cursor-pointer group">
                        <div className="flex items-center gap-2 text-teal-700 hover:text-teal-900 text-sm font-medium transition-colors">
                          <Upload className="w-4 h-4" />
                          <span>تغيير الشعار</span>
                        </div>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                    
                    <div className="bg-gray-100 border border-gray-200 rounded-lg p-10 min-h-[800px] shadow-inner relative flex justify-center overflow-auto">
                      <div 
                        ref={printRef}
                        className="bg-white shadow-2xl min-h-[297mm] w-[210mm] border border-gray-100 print:shadow-none print:border-none print:m-0 print:w-full print-area"
                        style={{ fontFamily: "'Amiri', serif", boxSizing: 'border-box' }}
                      >
                        {/* Content Area */}
                        <div 
                          dangerouslySetInnerHTML={{ __html: renderContentWithDynamicFields(selectedTemplate.content) }} 
                          className="text-gray-800 leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Fields Section */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm sticky top-6">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-teal-900">تعبئة البيانات</h3>
                        <FileText className="w-5 h-5 text-teal-600" />
                      </div>
                      {/* Order Search Bar */}
                      <div className="mb-6 relative">
                        <label className="text-xs font-bold text-gray-500 mb-1 block">استيراد بيانات من عقد موجود</label>
                        <div className="flex items-center bg-white border border-teal-200 rounded-lg px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-teal-500 transition-all">
                          <Search className="w-4 h-4 text-teal-600 ml-2" />
                          <input
                            type="text"
                            placeholder="ابحث برقم العقد أو اسم العميل..."
                            value={orderSearchQuery}
                            onChange={(e) => {
                              setOrderSearchQuery(e.target.value);
                              searchOrders(e.target.value);
                            }}
                            className="bg-transparent border-none w-full text-right text-sm focus:ring-0 placeholder:text-gray-300"
                          />
                          {isSearchingOrders && (
                            <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                          )}
                        </div>

                        {/* Search Results Dropdown */}
                        {orderSearchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                            {orderSearchResults.map((result) => (
                              <button
                                key={result.id}
                                onClick={() => handleOrderSelectData(result.data)}
                                className="w-full text-right p-3 hover:bg-teal-50 border-b border-gray-100 last:border-0 transition-colors flex flex-col gap-1"
                              >
                                <span className="text-sm font-bold text-gray-800">{result.displayTitle}</span>
                                <span className="text-xs text-gray-500">انقر للاستيراد التلقائي</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                        قم بتعبئة القيم أدناه لتحديث المعاينة وتجهيز المستند للتصدير.
                      </p>

                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                        {Array.isArray(selectedTemplate?.dynamicFields) && selectedTemplate.dynamicFields.length > 0 ? (
                          selectedTemplate.dynamicFields.map((field) => (
                            <div key={field} className="flex flex-col gap-1.5">
                              <label htmlFor={`dynamic-${field}`} className="text-sm font-semibold text-gray-700">
                                {field}
                              </label>
                              <input
                                type="text"
                                id={`dynamic-${field}`}
                                value={dynamicFieldValues[field] || ''}
                                onChange={(e) =>
                                  handleDynamicFieldChange(field, e.target.value)
                                }
                                className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm"
                                placeholder={`أدخل ${field}...`}
                              />
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-400 italic text-sm">
                            لا توجد حقول ديناميكية في هذا القالب
                          </div>
                        )}
                      </div>

                      {selectedTemplate.dynamicFields && selectedTemplate.dynamicFields.length > 0 && (
                        <button
                          onClick={handleSaveDefaults}
                          className="w-full mt-8 bg-white border border-teal-800 text-teal-900 py-2.5 rounded-lg text-sm font-bold hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          <span>حفظ كقيم افتراضية</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4 opacity-60">
                <LayoutIcon className="w-20 h-20" />
                <p className="text-xl">يرجى اختيار قالب من القائمة الجانبية للعرض</p>
              </div>
            )}
          </main>
        </div>

        {/* Add/Edit Template Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[1000] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-2xl font-bold text-teal-900">
                  {isEditMode ? 'تعديل القالب' : 'إضافة قالب جديد'}
                </h2>
                <button
                  onClick={hideAddTemplateModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 bg-white">
                <form id="template-form" onSubmit={handleAddTemplate} className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="template-title" className="text-sm font-bold text-gray-700">
                      عنوان القالب
                    </label>
                    <input
                      type="text"
                      id="template-title"
                      name="template-title"
                      required
                      defaultValue={isEditMode ? selectedTemplate?.title : ''}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-teal-500 transition-all"
                      placeholder="مثال: عقد توظيف جديد، نموذج استلام..."
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-700 flex justify-between items-center">
                      <span>محتوى القالب</span>
                      <span className="text-xs font-normal text-gray-400">استخدم {'{field_name}'} لإضافة حقول متغيرة</span>
                    </label>
                    <div className="quill-wrapper border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                      <ReactQuill
                        theme="snow"
                        value={editorContent}
                        onChange={setEditorContent}
                        modules={{
                          toolbar: [
                            [{ header: [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ list: 'ordered' }, { list: 'bullet' }],
                            [{ align: ['center', 'right', 'justify'] }],
                            ['link', 'image'],
                            ['clean'],
                          ],
                        }}
                        style={{ direction: 'rtl' }}
                        className="h-[350px] bg-white"
                        placeholder="اكتب محتوى القالب هنا..."
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={hideAddTemplateModal}
                  className="px-8 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  form="template-form"
                  className="px-12 py-2.5 rounded-lg bg-teal-900 text-white font-bold hover:bg-teal-800 transition-colors shadow-md"
                >
                  {isEditMode ? 'حفظ التغييرات' : 'إضافة القالب'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF Options Modal */}
        {isPdfModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[1000] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-teal-900">تجهيز ملف PDF</h2>
                <button onClick={hidePdfModal} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8 space-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-700">تاريخ المستند</label>
                  <CustomDatePicker value={dateValue} onChange={setDateValue} placeholder="اختر تاريخ الصدور" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-700">التوقيع / الختم</label>
                  <input
                    type="text"
                    value={signatureValue}
                    onChange={(e) => setSignatureValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-teal-500 transition-all shadow-sm"
                    placeholder="اسم الموقع أو المسمى الوظيفي"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={hidePdfModal}
                    className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleExportToPDF}
                    className="flex-1 py-3 rounded-lg bg-teal-900 text-white font-bold hover:bg-teal-800 transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <FilePdfOutlined />
                    <span>تصدير الآن</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {notification && (
          <div className="fixed bottom-6 left-6 z-[2000] animate-in slide-in-from-left duration-300">
            <div className={`rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3 ${
              notification.type === 'success' ? 'bg-teal-900 border-l-4 border-teal-400' : 'bg-red-900 border-l-4 border-red-400'
            } text-white`}>
              {notification.type === 'success' ? <Plus className="w-5 h-5" /> : <X className="w-5 h-5" />}
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}