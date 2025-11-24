import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Layout from 'example/containers/Layout';
import { Plus, FileText, Upload, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { DocumentTextIcon } from '@heroicons/react/outline';
import { jsPDF } from 'jspdf';
import Style from 'styles/Home.module.css';

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

  // Function to extract dynamic fields from content
  const extractDynamicFields = (content: string): string[] => {
    const regex = /\{([^}]+)\}/g;
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
        const templatesWithFields = data.map((template: Template) => ({
          ...template,
          dynamicFields: extractDynamicFields(template.content),
        }));
        setTemplates(templatesWithFields);
        if (templatesWithFields.length > 0) {
          setSelectedTemplate(templatesWithFields[0]);
          setEditorContent(templatesWithFields[0].content);
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
    setDynamicFieldValues(template.defaultValues || {});
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
      renderedContent = renderedContent.replace(`{${field}}`, value || `{${field}}`);
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

  const handleExportToPDF = async () => {
    if (!selectedTemplate) return;
    let pdfContent = selectedTemplate.content;
    selectedTemplate.dynamicFields?.forEach((field) => {
      pdfContent = pdfContent.replace(`{${field}}`, dynamicFieldValues[field] || '');
    });

    const div = document.createElement('div');
    div.innerHTML = pdfContent;
    pdfContent = div.textContent || div.innerText || '';

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
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
      showNotification('خطأ في تحميل الخط العربي', 'error');
      return;
    }

    // Define margins for border (like Word document)
    const margin = 15; // 15mm margin on all sides
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);

    // Draw border rectangle (like Word document)
    doc.setDrawColor(0, 0, 0); // Black color
    doc.setLineWidth(0.5); // Thin line
    doc.rect(margin, margin, contentWidth, contentHeight);

    // Add watermark (favicon in grayscale) in the center of the page
    // The watermark already has transparency applied in the canvas
    if (watermarkImage) {
      try {
        const watermarkSize = 80; // Size of watermark in mm
        const watermarkX = (pageWidth - watermarkSize) / 2;
        const watermarkY = (pageHeight - watermarkSize) / 2;
        
        doc.addImage(watermarkImage, 'PNG', watermarkX, watermarkY, watermarkSize, watermarkSize);
      } catch (error) {
        console.error('Error adding watermark to PDF:', error);
      }
    }

    // Add logo at top right if available
    if (logoImage) {
      try {
        const imgWidth = 60;
        const imgHeight = 26;
        const x = pageWidth - imgWidth - margin - 5;
        const y = margin + 5;
        doc.addImage(logoImage, 'PNG', x, y, imgWidth, imgHeight);
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
        showNotification('خطأ في إضافة الشعار إلى PDF', 'error');
      }
    }

    // Add main content (inside border)
    // Increased spacing from logo to prevent overlap
    doc.setFontSize(12);
    doc.setLanguage('ar');
    const textLines = doc.splitTextToSize(pdfContent, contentWidth - 10);
    const startY = logoImage ? margin + 60 : margin + 20;
    doc.text(textLines, pageWidth - margin - 5, startY, { align: 'right' });

    // Add signature and date at the bottom (inside border) - aligned from right
    const bottomMargin = margin + 20; // Margin from the bottom
    const lineHeight = 10; // Space between signature and date
    const rightX = pageWidth - margin - 5; // Same X position from right for both labels to ensure alignment
    // Use consistent formatting for alignment from right
    doc.text(`التوقيع: ${signatureValue || '__________'}`, rightX, pageHeight - bottomMargin - lineHeight, { align: 'right' });
    doc.text(`التاريخ: ${dateValue || '__________'}`, rightX, pageHeight - bottomMargin, { align: 'right' });

    doc.save(`${selectedTemplate.title}.pdf`);
    hidePdfModal();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <p>جارٍ التحميل...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>إدارة القوالب</title>
      </Head>
      <div
        dir="rtl"
        className={`min-h-screen flex justify-center items-start max-w-full mx-auto pt-2 ${Style['tajawal-medium']}`}
      >
        <div className="w-full flex flex-col gap-6 mx-auto">
          <section className="flex justify-between items-center">
            <h1 className="text-3xl font-normal text-black">إدارة القوالب</h1>
            <button
              onClick={showAddTemplateModal}
              className="flex items-center gap-2 bg-teal-800 text-white px-3 py-1.5 rounded-md text-sm hover:bg-teal-900"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة قالب</span>
            </button>
          </section>
          <section className="flex gap-8 w-[900px] mx-auto">
            <div className="flex-1 bg-gray-100 w-[900px] border border-gray-300 rounded-lg p-6 flex flex-col gap-6">
              {selectedTemplate ? (
                <>
                  <div className="flex gap-4">
                    <button
                      onClick={showEditTemplateModal}
                      className="border border-teal-800 text-gray-800 px-4 py-1 rounded text-sm hover:bg-gray-200"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={showPdfModal}
                      className="flex items-center gap-1 bg-teal-800 text-white px-4 py-1 rounded text-sm hover:bg-teal-900"
                    >
                      <FileText className="w-4 h-4" />
                      <span>PDF</span>
                    </button>
                  </div>

                  {/* Logo upload section */}
                  <div className="flex justify-end">
                    <div className="w-64">
                      <label className="block cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center gap-2 text-gray-500 text-sm bg-gray-50 hover:bg-gray-100 transition-colors">
                          {logoImage ? (
                            <img
                              src={logoImage}
                              alt="Logo"
                              className="max-w-full max-h-32 object-contain"
                            />
                          ) : (
                            <>
                              <Upload className="w-5 h-5" />
                              <span className="text-xs">رفع الشعار</span>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Content preview */}
                  <div
                    className="bg-white border border-gray-300 rounded-lg p-8 flex flex-col gap-8 flex-1 min-h-[400px]"
                    dangerouslySetInnerHTML={{ __html: renderContentWithDynamicFields(selectedTemplate.content) }}
                  />

                  {/* Dynamic fields */}
                  {Array.isArray(selectedTemplate?.dynamicFields) && selectedTemplate.dynamicFields.length > 0 && (
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mt-4">
                      <h3 className="text-lg font-normal text-gray-800 text-right mb-4">الحقول</h3>
                      {selectedTemplate.dynamicFields.map((field) => (
                        <div key={field} className="flex flex-col gap-2 mb-4">
                          <label htmlFor={`dynamic-${field}`} className="text-base text-gray-800 text-right">
                            {field}
                          </label>
                          <input
                            type="text"
                            id={`dynamic-${field}`}
                            value={dynamicFieldValues[field] || ''}
                            onChange={(e) =>
                              setDynamicFieldValues({ ...dynamicFieldValues, [field]: e.target.value })
                            }
                            className="bg-gray-50 border border-gray-300 rounded-md p-2.5 text-sm text-gray-800 placeholder-gray-500 w-full"
                            placeholder={`أدخل قيمة لـ ${field}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  لا يوجد قالب محدد
                </div>
              )}
            </div>
            <aside className="w-56 bg-gray-100 border border-gray-300 rounded-lg p-6">
              <h2 className="text-xl font-normal text-gray-500 text-right mb-8">أنواع القوالب</h2>
              <ul className="flex flex-col gap-8">
                {templates?.map((template) => (
                  <li
                    key={template.id}
                    className={selectedTemplate?.id === template.id 
                      ? 'bg-teal-800 text-white rounded-md border-2 border-teal-600 shadow-lg transition-all duration-200' 
                      : 'border-2 border-transparent hover:border-gray-300 rounded-md transition-all duration-200'}
                  >
                    <a
                      href={`#template-${template.type}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleTemplateSelect(template);
                      }}
                      className="flex items-center justify-end gap-2 p-2 text-base"
                    >
                      <span>{template.title}</span>
                      <DocumentTextIcon className="w-6 h-6" />
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          </section>
        </div>
        {/* Add/Edit Template Modal */}
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
                  <h2 className="text-3xl font-normal text-black text-right mb-6">
                    {isEditMode ? 'تعديل القالب' : 'إضافة قالب'}
                  </h2>
                  <form onSubmit={handleAddTemplate}>
                    <div className="flex flex-col gap-2 mb-6">
                      <label htmlFor="template-title" className="text-base text-gray-800 text-right">
                        العنوان
                      </label>
                      <input
                        type="text"
                        id="template-title"
                        name="template-title"
                        required
                        defaultValue={isEditMode ? selectedTemplate?.title : ''}
                        className="bg-gray-50 border border-gray-300 rounded-md p-2.5 text-sm text-gray-800 placeholder-gray-500 w-full"
                        placeholder="ادخل عنوان القالب"
                      />
                    </div>
                    <div className="quill-wrapper bg-gray-50 border border-gray-300 rounded-md overflow-hidden">
                      <ReactQuill
                        theme="snow"
                        value={editorContent}
                        onChange={setEditorContent}
                        modules={{
                          toolbar: [
                            [{ header: [1, 2, 3, 4, 5] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
                            [{ align: ['center', 'right', 'justify'] }],
                            ['link', 'image'],
                            ['clean'],
                          ],
                        }}
                        style={{ direction: 'ltr', alignContent: 'left' }}
                        preserveWhitespace={true}
                        className="h-[400px] text-gray-800 text-base leading-relaxed"
                        placeholder="اكتب هنا محتوى القالب..."
                      />
                    </div>
                    <div className="flex justify-center gap-4 mt-10 max-[768px]:flex-col">
                      <button
                        type="button"
                        onClick={hideAddTemplateModal}
                        className="border border-teal-800 text-gray-800 px-10 py-1.5 rounded text-base min-w-[116px] hover:bg-gray-200"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="bg-teal-800 text-white px-10 py-1.5 rounded text-base min-w-[116px] hover:bg-teal-900"
                      >
                        {isEditMode ? 'حفظ التعديلات' : 'إضافة'}
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            </div>
          </div>
        )}
        {/* PDF Confirmation Modal */}
        {isPdfModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-gray-100 rounded-lg w-11/12 max-w-[500px] p-5 relative">
              <span
                onClick={hidePdfModal}
                className="absolute top-2 right-5 text-2xl cursor-pointer text-gray-800"
              >
                &times;
              </span>
              <section className="w-full">
                <div className="bg-gray-100 p-6 rounded-lg">
                  <h2 className="text-2xl font-normal text-black text-right mb-6">
                    إدخال التاريخ والتوقيع
                  </h2>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="pdf-date" className="text-base text-gray-800 text-right">
                        التاريخ
                      </label>
                      <CustomDatePicker
                        value={dateValue}
                        onChange={setDateValue}
                        placeholder="اختر التاريخ"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="pdf-signature" className="text-base text-gray-800 text-right">
                        التوقيع
                      </label>
                      <input
                        type="text"
                        id="pdf-signature"
                        value={signatureValue}
                        onChange={(e) => setSignatureValue(e.target.value)}
                        className="bg-gray-50 border border-gray-300 rounded-md p-2.5 text-sm text-gray-800 placeholder-gray-500 w-full"
                        placeholder="أدخل التوقيع"
                      />
                    </div>
                    <div className="flex justify-center gap-4 mt-6">
                      <button
                        type="button"
                        onClick={hidePdfModal}
                        className="border border-teal-800 text-gray-800 px-10 py-1.5 rounded text-base min-w-[116px] hover:bg-gray-200"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={handleExportToPDF}
                        className="bg-teal-800 text-white px-10 py-1.5 rounded text-base min-w-[116px] hover:bg-teal-900"
                      >
                        تأكيد وتصدير
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
        {/* Notification Modal */}
        {notification && (
          <div className="fixed top-4 right-4 z-50">
            <div
              className={`rounded-lg p-4 shadow-lg ${
                notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
              } text-white text-sm`}
            >
              <p>{notification.message}</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}