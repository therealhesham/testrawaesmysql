import { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Layout from 'example/containers/Layout';
import { Plus, FileText, Upload } from 'lucide-react';
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

    // Add logo at top right if available
    if (logoImage) {
      try {
        const imgWidth = 40;
        const imgHeight = 30;
        const x = doc.internal.pageSize.width - imgWidth - 10;
        const y = 10;
        doc.addImage(logoImage, 'PNG', x, y, imgWidth, imgHeight);
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
        showNotification('خطأ في إضافة الشعار إلى PDF', 'error');
      }
    }

    // Add main content
    doc.setFontSize(12);
    doc.setLanguage('ar');
    const textLines = doc.splitTextToSize(pdfContent, 180);
    doc.text(textLines, 190, 50, { align: 'right' });

    // Add signature and date at the bottom
    const pageHeight = doc.internal.pageSize.height;
    const bottomMargin = 20; // Margin from the bottom
    const lineHeight = 10; // Space between signature and date
    doc.text(`التوقيع: ${signatureValue || '__________'}`, 190, pageHeight - bottomMargin - lineHeight, { align: 'right' });
    doc.text(`التاريخ: ${dateValue || '__________'}`, 190, pageHeight - bottomMargin, { align: 'right' });

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
                    <div className="w-48">
                      <label className="block cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center gap-2 text-gray-500 text-sm bg-gray-50 hover:bg-gray-100 transition-colors">
                          {logoImage ? (
                            <img
                              src={logoImage}
                              alt="Logo"
                              className="max-w-full max-h-20 object-contain"
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
                    className={selectedTemplate?.id === template.id ? 'bg-teal-800 text-white rounded-md' : ''}
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
                      <input
                        type="text"
                        id="pdf-date"
                        value={dateValue}
                        onChange={(e) => setDateValue(e.target.value)}
                        className="bg-gray-50 border border-gray-300 rounded-md p-2.5 text-sm text-gray-800 placeholder-gray-500 w-full"
                        placeholder="أدخل التاريخ"
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