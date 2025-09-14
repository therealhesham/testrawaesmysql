import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

const PROCESSOR_CONTROL_URL = 'https://aidoc.rawaes.com/processor-control';

export default function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [error, setError] = useState('');
  const [extractedData, setExtractedData] = useState<{
    jsonResponse: Record<string, string>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processorStatus, setProcessorStatus] = useState<'enabled' | 'disabled' | 'loading' | 'unknown'>('unknown');
  const [isControllingProcessor, setIsControllingProcessor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];

  // ✅ جلب حالة المعالج عند التحميل
  useEffect(() => {
    const fetchProcessorStatus = async () => {
      try {
        const res = await fetch('https://aidoc.rawaes.com/processor-control/status');
        if (!res.ok) throw new Error('فشل التحقق من حالة المعالج');
        const data = await res.json();
        setProcessorStatus(data.status === 'ENABLED' ? 'enabled' : 'disabled');
      } catch (error) {
        console.error('خطأ في جلب حالة المعالج:', error);
        setProcessorStatus('unknown');
      }
    };

    fetchProcessorStatus();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setError('لم يتم اختيار ملف');
      setFileUploaded(false);
      return;
    }

    if (!allowedFileTypes.includes(selectedFile.type)) {
      setError('نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)');
      setFileUploaded(false);
      return;
    }

    setFile(selectedFile);
    setError('');
    setFileUploaded(true);
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      setError('خطأ في تحديد حقل الملف');
    }
  };

  const controlProcessor = async (action: 'enable' | 'disable') => {
    if (isControllingProcessor) return;

    setIsControllingProcessor(true);
    setError('');

    try {
      const response = await fetch(PROCESSOR_CONTROL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`فشل في ${action === 'enable' ? 'تفعيل' : 'تعطيل'} المعالج: ${errorData}`);
      }

      const result = await response.json();
      setProcessorStatus(action === 'enable' ? 'enabled' : 'disabled');
      alert(`${action === 'enable' ? 'تم تفعيل' : 'تم تعطيل'} المعالج بنجاح!`);
      console.log('Processor control result:', result);
    } catch (error: any) {
      console.error('Error controlling processor:', error);
      setError(error.message || `حدث خطأ أثناء ${action === 'enable' ? 'تفعيل' : 'تعطيل'} المعالج`);
    } finally {
      setIsControllingProcessor(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('يرجى اختيار ملف أولاً');
      return;
    }

    if (processorStatus === 'disabled') {
      setError('المعالج معطل حالياً. يرجى تفعيله أولاً.');
      return;
    }

    setIsLoading(true);
    setError('');
    setExtractedData(null);

    try {
      // Step 1: Upload image to /api/gemini to extract structured data
      const formData = new FormData();
      formData.append('image', file); // تأكد من استخدام 'document' كما في الـ Backend

      const processRes = await fetch("https://aidoc.rawaes.com/api/gemini", {
        method: 'POST',
        body: formData,
      });

      if (!processRes.ok) {
        const errorData = await processRes.text();
        throw new Error(`فشل في معالجة الصورة: ${errorData}`);
      }

      const processResult = await processRes.json();
      let entities = processResult.jsonResponse;

      // Ensure entities is a flat object
      if (typeof entities !== 'object' || Array.isArray(entities) || !entities) {
        throw new Error('البيانات المستلمة ليست كائنًا صالحًا');
      }

      // Flatten any nested objects (though Backend ensures flat structure)
      entities = Object.entries(entities).reduce((acc, [key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return { ...acc, [key]: JSON.stringify(value) };
        }
        return { ...acc, [key]: String(value) };
      }, {});

      setExtractedData({ jsonResponse: entities });

      // Step 2: Send structured data to homemaids API
      try {
        const uploadRes = await fetch("/api/automaticnewhomemaids", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entities),
        });

        if (!uploadRes.ok) {
          const errorText = await uploadRes.text();
          throw new Error(`فشل إرسال البيانات: ${errorText}`);
        }

        setFile(null);
        setFileUploaded(false);
        if (fileInputRef.current) fileInputRef.current.value = '';

        alert('تم رفع الملف واستخراج البيانات وإرسالها بنجاح!');
      } catch (apiError: any) {
        console.error('Error sending data to homemaids API:', apiError);
        setError(
          `تم استخراج البيانات، لكن فشل إرسالها إلى نظام Homemaid: ${apiError.message}`
        );
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'حدث خطأ أثناء رفع الملف أو معالجة البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSave = () => {
    alert('تم تأكيد الحفظ شكليًا!');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4" dir="rtl">
      <Head>
        <title>رفع المستندات</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap"
        />
      </Head>
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 max-w-2xl w-full">
        <h1 className="text-3xl font-normal text-black text-center mb-6">رفع المستندات</h1>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h2 className="text-lg font-medium text-blue-800 mb-3">التحكم في معالج Document AI</h2>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* <div className={`px-3 py-1 rounded-md text-sm font-medium ${getProcessorStatusColor()}`}>
              حالة المعالج: {getProcessorStatusText()}
            </div> */}
            <div className="flex gap-2">
              <button
                type="button"
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() => controlProcessor('enable')}
                disabled={processorStatus === 'enabled' || isControllingProcessor}
              >
                {isControllingProcessor ? 'جاري التفعيل...' : 'تفعيل المعالج'}
              </button>
              <button
                type="button"
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() => controlProcessor('disable')}
                disabled={processorStatus === 'disabled' || isControllingProcessor}
              >
                {isControllingProcessor ? 'جاري التعطيل...' : 'تعطيل المعالج'}
              </button>
            </div>
          </div>
          {error && (
            <p className="text-red-500 text-xs mt-2 text-center">{error}</p>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex flex-col">
            <label htmlFor="document" className="text-gray-500 text-sm mb-1">
              المستند
            </label>
            <div className="file-upload-display border border-gray-300 rounded-md p-2 flex justify-between items-center">
              <span className="text-gray-500 text-sm pr-2">
                {fileUploaded && file ? file.name : 'إرفاق ملف'}
              </span>
              <input
                type="file"
                id="document"
                ref={fileInputRef}
                className="hidden"
                accept="application/pdf,image/jpeg,image/png"
                onChange={handleFileChange}
              />
              <button
                type="button"
                className="bg-teal-800 text-white px-3 py-1 rounded-md text-xs hover:bg-teal-900 disabled:opacity-50"
                onClick={handleButtonClick}
                disabled={isLoading || processorStatus === 'disabled'}
              >
                اختيار ملف
              </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="bg-teal-800 text-white text-sm px-4 py-2 rounded-md hover:bg-teal-900 disabled:opacity-50"
              onClick={handleUpload}
              disabled={isLoading || !fileUploaded || processorStatus === 'disabled'}
            >
              {isLoading ? 'جاري الرفع...' : 'رفع واستخراج البيانات'}
            </button>
          </div>

          {extractedData && (
            <div className="mt-6">
              <h2 className="text-2xl font-normal text-black mb-4">البيانات المستخرجة</h2>
              <div className="bg-gray-50 p-4 rounded-md text-sm text-right">
                {Object.keys(extractedData.jsonResponse).length > 0 && (
                  <>
                    <h3 className="font-medium mb-2">الحقول المستخرجة:</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="border border-gray-300 px-4 py-2">الحقل</th>
                            <th className="border border-gray-300 px-4 py-2">القيمة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(extractedData.jsonResponse).map(([key, value]) => (
                            <tr key={key} className="hover:bg-gray-100">
                              <td className="border border-gray-300 px-4 py-2">{key}</td>
                              <td className="border border-gray-300 px-4 py-2">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                        onClick={handleConfirmSave}
                      >
                        تأكيد الحفظ
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        body {
          font-family: 'Tajawal', sans-serif;
        }
        .min-h-screen {
          min-height: 100vh;
        }
        .file-upload-display {
          background-color: #f9fafb;
        }
        .file-upload-display:hover {
          background-color: #f1f5f9;
        }
        button:disabled {
          cursor: not-allowed;
        }
        table {
          direction: rtl;
        }
        th, td {
          text-align: right;
        }
      `}</style>
    </div>
  );
}