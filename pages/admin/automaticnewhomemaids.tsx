import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

const API_URL = 'https://aidoc.rawaes.com/process-document';
const PROCESSOR_CONTROL_URL = 'https://aidoc.rawaes.com/processor-control';

export default function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [error, setError] = useState('');
  const [extractedData, setExtractedData] = useState<{
    text: string;
    entities: Record<string, string>;
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
      const formData = new FormData();
      formData.append('document', file);

      const res = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`فشل في استخراج البيانات: ${errorData}`);
      }

      const result = await res.json();
      console.log('Extracted entities:', result.entities); // ✅ للتحقق من الأسماء
      setExtractedData(result);

      try {
        const uploadRes = await fetch("/api/automaticnewhomemaids", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result.entities),
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
      setError(error.message || 'حدث خطأ أثناء رفع الملف أو استخراج البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const getProcessorStatusColor = () => {
    switch (processorStatus) {
      case 'enabled': return 'text-green-600 bg-green-100';
      case 'disabled': return 'text-red-600 bg-red-100';
      case 'loading': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProcessorStatusText = () => {
    switch (processorStatus) {
      case 'enabled': return 'مفعل';
      case 'disabled': return 'معطل';
      case 'loading': return 'جاري التحميل...';
      default: return 'غير معروف';
    }
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
            <div className={`px-3 py-1 rounded-md text-sm font-medium ${getProcessorStatusColor()}`}>
              حالة المعالج: {getProcessorStatusText()}
            </div>
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
                <h3 className="font-medium mb-2">النص الكلي:</h3>
                <p className="text-gray-600 mb-4 break-words">{extractedData.text}</p>
                {Object.keys(extractedData.entities).length > 0 && (
                  <>
                    <h3 className="font-medium mb-2">الحقول المستخرجة:</h3>
                    <ul className="list-disc pr-5">
                      {Object.entries(extractedData.entities).map(([key, value]) => (
                        <li key={key} className="mb-1">
                          <strong>{key}:</strong> {value}
                        </li>
                      ))}
                    </ul>
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
      `}</style>
    </div>
  );
}