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
  ssr: false, // Disable SSR for ReactQuill
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

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [editorContent, setEditorContent] = useState('');
  const [dynamicFieldValues, setDynamicFieldValues] = useState<{ [key: string]: string }>({});

  // Function to extract dynamic fields from content
  const extractDynamicFields = (content: string): string[] => {
    const regex = /\{([^}]+)\}/g;
    const matches = content.match(regex) || [];
    return matches.map((field) => field.replace(/[\{\}]/g, ''));
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
        // Fallback to a dummy template for testing
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

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setEditorContent(template.content);
    // Load default values if they exist, otherwise use empty values
    setDynamicFieldValues(template.defaultValues || {});
  };

  const handleAddTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('template-title') as string;
    const content = editorContent;
    const type = 'custom';
    const dynamicFields = extractDynamicFields(content);

    if (!title || !content) {
      alert('يرجى ملء جميع الحقول المطلوبة');
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
        e.currentTarget.reset();
        setDynamicFieldValues({});
      } else {
        alert(`فشل في ${isEditMode ? 'تحديث' : 'إضافة'} القالب`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('حدث خطأ');
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
          defaultValues: dynamicFieldValues
        }),
      });

      if (res.ok) {
        const updatedTemplate = await res.json();
        setTemplates((prev) =>
          prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
        );
        setSelectedTemplate(updatedTemplate);
        alert('تم حفظ القيم الافتراضية بنجاح');
      } else {
        alert('فشل في حفظ القيم الافتراضية');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('حدث خطأ في حفظ القيم الافتراضية');
    }
  };

  const handleExportToPDF = async () => {
    if (!selectedTemplate) return;

    // Clean content and replace dynamic fields
    let pdfContent = selectedTemplate.content;
    selectedTemplate.dynamicFields?.forEach((field) => {
      pdfContent = pdfContent.replace(`{${field}}`, dynamicFieldValues[field] || '');
    });

    // Remove HTML tags
    const div = document.createElement('div');
    div.innerHTML = pdfContent;
    pdfContent = div.textContent || div.innerText || '';

    // Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    try {
      // Fetch Amiri font
      const response = await fetch('/fonts/Amiri-Regular.ttf');
      if (!response.ok) throw new Error('Failed to fetch font');
      const fontBuffer = await response.arrayBuffer();
      const fontBytes = new Uint8Array(fontBuffer);
      const fontBase64 = Buffer.from(fontBytes).toString('base64');

      // Add Amiri font to jsPDF
      doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
      doc.setFont('Amiri', 'normal');
    } catch (error) {
      console.error('Error loading Amiri font:', error);
      alert('خطأ في تحميل الخط العربي');
      return;
    }

    // Set font size and RTL
    doc.setFontSize(12);
    doc.setLanguage('ar');

    // Split text to fit within page width
    const textLines = doc.splitTextToSize(pdfContent, 180);
    doc.text(textLines, 190, 10, { align: 'right' });

    // Save PDF
    doc.save(`${selectedTemplate.title}.pdf`);
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
        className={`min-h-screen flex justify-center items-start max-w-7xl mx-auto p-4 ${Style['tajawal-medium']}`}
      >
        <main className="w-full flex flex-col gap-6">
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

          <section className="flex gap-8 w-[900px]">
            {/* Template Content Area */}
            <div className="flex-1 bg-gray-100 border border-gray-300 rounded-lg p-6 flex flex-col gap-6">
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
                      onClick={handleExportToPDF}
                      className="flex items-center gap-1 bg-teal-800 text-white px-4 py-1 rounded text-sm hover:bg-teal-900"
                    >
                      <FileText className="w-4 h-4" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={handleSaveDefaults}
                      className="flex items-center gap-1 bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700"
                    >
                      <span>حفظ القيم الافتراضية</span>
                    </button>
                  </div>

                  <div
                    className="bg-gray-50 border border-gray-300 rounded-lg p-8 flex flex-col gap-8 flex-1"
                    dangerouslySetInnerHTML={{ __html: renderContentWithDynamicFields(selectedTemplate.content) }}
                  />

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

                  {/* Dynamic Fields Input */}
                  {selectedTemplate?.dynamicFields?.length > 0 && (
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mt-4">
                      <h3 className="text-lg font-normal text-gray-800 text-right mb-4">الحقول </h3>
                      {selectedTemplate?.dynamicFields?.map((field) => (
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

            {/* Template Sidebar */}
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
        </main>

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

                    <div className="bg-gray-50 border border-gray-300 rounded-md shadow-sm">
                      <ReactQuill
                        theme="snow"
                        value={editorContent}
                        onChange={setEditorContent}
                        modules={{
                          toolbar: [
                            [{ header: [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ list: 'ordered' }, { list: 'bullet' }],
                            [{ align: [] }],
                            ['link', 'image'],
                            ['clean'],
                          ],
                        }}
                        className="min-h-[225px] text-gray-500 text-base leading-relaxed"
                        placeholder="ادخل محتوى القالب هنا..."
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
      </div>
    </Layout>
  );
}