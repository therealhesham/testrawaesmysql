import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Layout from 'example/containers/Layout';
import AutomaticPreview from '../../components/AutomaticPreview';

interface ExtractedData {
  jsonResponse: Record<string, string>;
}

interface ProcessingResult {
  extractedImages: string[];
  geminiData: ExtractedData;
  errors?: string[];
}

// Ensure all image URLs are HTTPS to avoid mixed-content issues when the app
// is served over HTTPS (e.g. https://wasl.rawaes.com)
const normalizeImageUrl = (url: string) => {
  if (typeof url !== 'string') return url;

  // Force HTTPS for any HTTP URLs returned by the extractor service
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }

  return url;
};

export default function PDFProcessor() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedProfileImage, setSelectedProfileImage] = useState<string>('');
  const [selectedFullImage, setSelectedFullImage] = useState<string>('');
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<'upload' | 'select-images' | 'upload-images' | 'extract-data' | 'save'>('upload');
  const [currentModel, setCurrentModel] = useState('gemini-2.5-flash');
  const [isRetryingWithPro, setIsRetryingWithPro] = useState(false);
  const [editingField, setEditingField] = useState<{ key: string; value: string } | null>(null);
  const [offices, setOffices] = useState<{ id: number; office: string | null }[]>([]);
  const [invalidOffice, setInvalidOffice] = useState<{ field: string; value: string } | null>(null);
  const [nationalities, setNationalities] = useState<{ id: number; Country: string | null }[]>([]);
  const [invalidNationality, setInvalidNationality] = useState<{ field: string; value: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const res = await fetch('/api/foreign-offices-financial/offices');
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (data && Array.isArray(data.offices)) {
          setOffices(data.offices);
        }
      } catch (e) {
        console.error('Error fetching offices list:', e);
      }
    };

    const fetchNationalities = async () => {
      try {
        const res = await fetch('/api/nationalities');
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (data && Array.isArray(data.nationalities)) {
          setNationalities(data.nationalities);
        }
      } catch (e) {
        console.error('Error fetching nationalities list:', e);
      }
    };

    fetchOffices();
    fetchNationalities();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setError('No file selected');
      setFile(null);
      return;
    }

    if (selectedFile.type !== 'application/pdf') {
      setError('Please select a PDF file');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError('');
    setProcessingResult(null);
    setSelectedImages([]);
    setSaveMessage('');
  };

  const handleFileUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const imageFormData = new FormData();
      imageFormData.append('file', file);

      const imageResponse = await fetch('https://extract.rawaes.com/extract-images', {
        method: 'POST',
        body: imageFormData,
      });

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json();
        throw new Error(errorData.detail || 'Failed to extract images from PDF');
      }

      const imageResult = await imageResponse.json();
      const extractedImages = (imageResult.image_urls || []).map(normalizeImageUrl);

      if (extractedImages.length === 0) {
        throw new Error('No images found in the PDF');
      }

      setProcessingResult({
        extractedImages,
        geminiData: { jsonResponse: {} },
        errors: [],
      });
      setCurrentStep('select-images');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageSelection = async () => {
    if (!selectedProfileImage) {
      setError('يرجى اختيار الصورة الشخصية على الأقل');
      return;
    }

    // الصورة الشخصية إلزامية، صورة الطول اختيارية
    const imagesToUpload = [selectedProfileImage];
    if (selectedFullImage) {
      imagesToUpload.push(selectedFullImage);
    }
    
    setSelectedImages(imagesToUpload);
    setIsUploadingImages(true);
    setError('');

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < imagesToUpload.length; i++) {
        const imageUrl = imagesToUpload[i];
        
        try {
          // Fetch the image from the extracted URL
          const imageResponse = await fetchWithTimeout(imageUrl);
          if (!imageResponse.ok) {
            console.error(`Failed to fetch image ${i}:`, imageResponse.status);
            continue;
          }

          const imageBlob = await imageResponse.blob();
          
          // Get presigned URL for Digital Ocean
          const presignedResponse = await fetchWithTimeout(`/api/upload-image-presigned-url/image-${Date.now()}-${i}`);
          if (!presignedResponse.ok) {
            console.error(`Failed to get presigned URL for image ${i}:`, presignedResponse.status);
            continue;
          }

          const { url, filePath } = await presignedResponse.json();

          // Upload to Digital Ocean
          const uploadResponse = await fetchWithTimeout(url, {
            method: 'PUT',
            body: imageBlob,
            headers: {
              'Content-Type': imageBlob.type || 'image/jpeg',
              'x-amz-acl': 'public-read',
            },
          });

          if (uploadResponse.ok) {
            uploadedUrls.push(filePath);
            console.log(`Successfully uploaded image ${i}:`, filePath);
          } else {
            console.error(`Failed to upload image ${i}:`, uploadResponse.status);
          }
        } catch (imageError) {
          console.error(`Error processing image ${i}:`, imageError);
          continue;
        }
      }

      if (uploadedUrls.length === 0) {
        throw new Error('فشل في رفع جميع الصور');
      }

      setUploadedImageUrls(uploadedUrls);
      setIsUploadingImages(false);
      // الانتقال التلقائي لمرحلة استخراج البيانات وبدء الاستخراج
      setCurrentStep('extract-data');
      // بدء استخراج البيانات تلقائياً بعد نجاح الرفع
      if (file) {
        await handleDataExtraction();
      }
    } catch (error: any) {
      console.error('Error uploading images:', error);
      setError(`فشل في رفع الصور المختارة: ${error.message}`);
      setIsUploadingImages(false);
    }
  };

  const uploadSelectedImages = async () => {
    if (selectedImages.length === 0) {
      setError('يرجى اختيار صورة واحدة على الأقل');
      return;
    }

    setIsUploadingImages(true);
    setError('');

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < selectedImages.length; i++) {
        const imageUrl = selectedImages[i];
        
        try {
          // Fetch the image from the extracted URL
          const imageResponse = await fetchWithTimeout(imageUrl);
          if (!imageResponse.ok) {
            console.error(`Failed to fetch image ${i}:`, imageResponse.status);
            continue;
          }

          const imageBlob = await imageResponse.blob();
          
          // Get presigned URL for Digital Ocean - استخدام API جديد
          const presignedResponse = await fetchWithTimeout(`/api/upload-image-presigned-url/image-${Date.now()}-${i}`);
          if (!presignedResponse.ok) {
            console.error(`Failed to get presigned URL for image ${i}:`, presignedResponse.status);
            continue;
          }

          const { url, filePath } = await presignedResponse.json();

          // Upload to Digital Ocean
          const uploadResponse = await fetchWithTimeout(url, {
            method: 'PUT',
            body: imageBlob,
            headers: {
              'Content-Type': imageBlob.type || 'image/jpeg',
              'x-amz-acl': 'public-read',
            },
          });

          if (uploadResponse.ok) {
            uploadedUrls.push(filePath);
            console.log(`Successfully uploaded image ${i}:`, filePath);
          } else {
            console.error(`Failed to upload image ${i}:`, uploadResponse.status);
          }
        } catch (imageError) {
          console.error(`Error processing image ${i}:`, imageError);
          continue;
        }
      }

      if (uploadedUrls.length === 0) {
        throw new Error('فشل في رفع جميع الصور');
      }

      setUploadedImageUrls(uploadedUrls);
      // الانتقال التلقائي لمرحلة استخراج البيانات
      setCurrentStep('extract-data');
    } catch (error: any) {
      console.error('Error uploading images:', error);
      setError(`فشل في رفع الصور المختارة: ${error.message}`);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleDataExtraction = async (modelName: string = 'gemini-2.5-flash') => {
    if (!file) {
      setError('No file available for data extraction');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const geminiFormData = new FormData();
      geminiFormData.append('image', file);
      geminiFormData.append('model', modelName);

      const geminiResponse = await fetch('https://aidoc.rawaes.com/api/gemini', {
        method: 'POST',
        body: geminiFormData,
      });

      if (!geminiResponse.ok) {
        throw new Error('Failed to extract data using Gemini');
      }

      const geminiResult = await geminiResponse.json();
      const geminiData = { jsonResponse: geminiResult.jsonResponse };

      // التحقق من أن office_name أو company_name موجودة في قائمة المكاتب
      const officeNames = offices.map(o => o.office?.toLowerCase().trim()).filter(Boolean);
      const extractedOfficeName = geminiData.jsonResponse.company_name || geminiData.jsonResponse.CompanyName || geminiData.jsonResponse.office_name || geminiData.jsonResponse.OfficeName;
      
      if (extractedOfficeName) {
        const normalizedExtracted = String(extractedOfficeName).toLowerCase().trim();
        const isValidOffice = officeNames.some(officeName => officeName === normalizedExtracted);
        
        if (!isValidOffice && offices.length > 0) {
          // المكتب غير موجود في القائمة
          const officeField = geminiData.jsonResponse.company_name || geminiData.jsonResponse.CompanyName ? 'company_name' : 'office_name';
          setInvalidOffice({ field: officeField, value: String(extractedOfficeName) });
        } else {
          setInvalidOffice(null);
        }
      } else {
        setInvalidOffice(null);
      }

      // التحقق من أن nationality موجودة في قائمة الجنسيات
      const nationalityNames = nationalities.map(n => n.Country?.toLowerCase().trim()).filter(Boolean);
      const extractedNationality = geminiData.jsonResponse.nationality || geminiData.jsonResponse.Nationality;
      
      if (extractedNationality) {
        const normalizedExtracted = String(extractedNationality).toLowerCase().trim();
        const isValidNationality = nationalityNames.some(nationalityName => nationalityName === normalizedExtracted);
        
        if (!isValidNationality && nationalities.length > 0) {
          // الجنسية غير موجودة في القائمة
          setInvalidNationality({ field: 'nationality', value: String(extractedNationality) });
        } else {
          setInvalidNationality(null);
        }
      } else {
        setInvalidNationality(null);
      }

      setProcessingResult((prev) =>
        prev
          ? { ...prev, geminiData }
          : { extractedImages: [], geminiData, errors: [] }
      );
      setCurrentModel(modelName);
      // الانتقال التلقائي لمرحلة حفظ البيانات
      setCurrentStep('save');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during data extraction');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProfileImageSelect = (imageUrl: string) => {
    setSelectedProfileImage(imageUrl);
  };

  const handleFullImageSelect = (imageUrl: string) => {
    setSelectedFullImage(imageUrl);
  };

  const handleProModelRetry = async () => {
    setIsRetryingWithPro(true);
    setError('');
    
    try {
      await handleDataExtraction('gemini-2.0-flash-exp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during pro model extraction');
    } finally {
      setIsRetryingWithPro(false);
    }
  };

  const handleOfficeSelection = (selectedOffice: string) => {
    if (!processingResult || !invalidOffice) return;
    
    const updatedData = { ...processingResult.geminiData.jsonResponse };
    
    // تحديث الحقل المناسب (office_name أو company_name)
    if (invalidOffice.field === 'office_name') {
      updatedData.office_name = selectedOffice;
      updatedData.OfficeName = selectedOffice;
    } else {
      updatedData.company_name = selectedOffice;
      updatedData.CompanyName = selectedOffice;
    }
    
    setProcessingResult({
      ...processingResult,
      geminiData: { jsonResponse: updatedData }
    });
    
    setInvalidOffice(null);
  };

  const handleNationalitySelection = (selectedNationality: string) => {
    if (!processingResult || !invalidNationality) return;
    
    const updatedData = { ...processingResult.geminiData.jsonResponse };
    
    // تحديث الحقل nationality
    updatedData.nationality = selectedNationality;
    updatedData.Nationality = selectedNationality;
    
    setProcessingResult({
      ...processingResult,
      geminiData: { jsonResponse: updatedData }
    });
    
    setInvalidNationality(null);
  };

  const startEditingField = (key: string, value: any) => {
    let baseVal = '';
    if (key === 'skills' || key === 'languages_spoken') {
      baseVal =
        typeof value === 'string'
          ? value
          : value !== null && value !== undefined
          ? JSON.stringify(value, null, 2)
          : '';
    } else {
      baseVal = value !== null && value !== undefined ? String(value) : '';
    }
    // إذا كان الحقل هو office_name وكان company_name موجوداً، استخدم company_name للتعديل
    const editKey = (key === 'office_name' || key === 'OfficeName') && processingResult?.geminiData?.jsonResponse?.company_name
      ? 'company_name'
      : key;
    setEditingField({ key: editKey, value: baseVal });
  };

  const cancelEditingField = () => {
    setEditingField(null);
  };

  const saveEditingField = () => {
    if (!editingField || !processingResult) return;

    const { key, value } = editingField;
    
    // التحقق من المكتب إذا كان الحقل المُعدل هو office_name أو company_name
    if ((key === 'office_name' || key === 'OfficeName' || key === 'company_name' || key === 'CompanyName') && value) {
      const officeNames = offices.map(o => o.office?.toLowerCase().trim()).filter(Boolean);
      const normalizedValue = String(value).toLowerCase().trim();
      const isValidOffice = officeNames.some(officeName => officeName === normalizedValue);
      
      if (!isValidOffice && offices.length > 0) {
        setError('المكتب المُدخل غير موجود في قائمة المكاتب. يرجى اختيار مكتب صحيح.');
        const officeField = (key === 'office_name' || key === 'OfficeName') ? 'office_name' : 'company_name';
        setInvalidOffice({ field: officeField, value: String(value) });
        setEditingField(null);
        return;
      } else {
        setInvalidOffice(null);
      }
    }

    // التحقق من الجنسية إذا كان الحقل المُعدل هو nationality
    if ((key === 'nationality' || key === 'Nationality') && value) {
      const nationalityNames = nationalities.map(n => n.Country?.toLowerCase().trim()).filter(Boolean);
      const normalizedValue = String(value).toLowerCase().trim();
      const isValidNationality = nationalityNames.some(nationalityName => nationalityName === normalizedValue);
      
      if (!isValidNationality && nationalities.length > 0) {
        setError('الجنسية المُدخلة غير موجودة في قائمة الجنسيات. يرجى اختيار جنسية صحيحة.');
        setInvalidNationality({ field: 'nationality', value: String(value) });
        setEditingField(null);
        return;
      } else {
        setInvalidNationality(null);
      }
    }
    
    setProcessingResult((prev) => {
      if (!prev) return prev;
      const updatedJson = { ...prev.geminiData.jsonResponse };
      
      // إذا تم تعديل office_name، قم بتحديث company_name أيضاً إذا كان موجوداً
      if (key === 'office_name' || key === 'OfficeName') {
        updatedJson[key] = value;
        updatedJson[key === 'office_name' ? 'OfficeName' : 'office_name'] = value;
        // إذا كان company_name موجوداً، قم بتحديثه أيضاً
        if (updatedJson.company_name || updatedJson.CompanyName) {
          updatedJson.company_name = value;
          updatedJson.CompanyName = value;
        }
      } else if (key === 'company_name' || key === 'CompanyName') {
        // إذا تم تعديل company_name، قم بتحديث office_name أيضاً
        updatedJson[key] = value;
        updatedJson[key === 'company_name' ? 'CompanyName' : 'company_name'] = value;
        updatedJson.office_name = value;
        updatedJson.OfficeName = value;
      } else if (key === 'nationality' || key === 'Nationality') {
        // إذا تم تعديل nationality، قم بتحديث Nationality أيضاً
        updatedJson[key] = value;
        updatedJson[key === 'nationality' ? 'Nationality' : 'nationality'] = value;
      } else {
        updatedJson[key] = value;
      }
      
      return {
        ...prev,
        geminiData: {
          ...prev.geminiData,
          jsonResponse: updatedJson,
        },
      };
    });
    setEditingField(null);
  };

  const handleSave = async () => {
    if (!processingResult) {
      setError('No data to save');
      return;
    }

    if (selectedImages.length === 0) {
      setError('Please select at least one image to save');
      return;
    }

    // التحقق من المكتب قبل الحفظ
    const officeNames = offices.map(o => o.office?.toLowerCase().trim()).filter(Boolean);
    const extractedOfficeName = processingResult.geminiData.jsonResponse.company_name || 
                                processingResult.geminiData.jsonResponse.CompanyName ||
                                processingResult.geminiData.jsonResponse.office_name || 
                                processingResult.geminiData.jsonResponse.OfficeName;
    
    if (extractedOfficeName && offices.length > 0) {
      const normalizedExtracted = String(extractedOfficeName).toLowerCase().trim();
      const isValidOffice = officeNames.some(officeName => officeName === normalizedExtracted);
      
      if (!isValidOffice) {
        setError('يجب اختيار مكتب صحيح من قائمة المكاتب قبل الحفظ');
        const officeField = processingResult.geminiData.jsonResponse.company_name || processingResult.geminiData.jsonResponse.CompanyName ? 'company_name' : 'office_name';
        setInvalidOffice({ field: officeField, value: String(extractedOfficeName) });
        return;
      }
    }

    // التحقق من الجنسية قبل الحفظ
    const nationalityNames = nationalities.map(n => n.Country?.toLowerCase().trim()).filter(Boolean);
    const extractedNationality = processingResult.geminiData.jsonResponse.nationality || 
                                  processingResult.geminiData.jsonResponse.Nationality;
    
    if (extractedNationality && nationalities.length > 0) {
      const normalizedExtracted = String(extractedNationality).toLowerCase().trim();
      const isValidNationality = nationalityNames.some(nationalityName => nationalityName === normalizedExtracted);
      
      if (!isValidNationality) {
        setError('يجب اختيار جنسية صحيحة من قائمة الجنسيات قبل الحفظ');
        setInvalidNationality({ field: 'nationality', value: String(extractedNationality) });
        return;
      }
    }

    setIsSaving(true);
    setError('');

    try {
      const sessionId = `pdf-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const response = await fetch('/api/save-pdf-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          selectedImages: uploadedImageUrls.length > 0 ? uploadedImageUrls : selectedImages,
          geminiData: processingResult.geminiData,
          originalFileName: file?.name || 'document.pdf',
          notes,
          processedBy: 'Admin User',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save data');
      }

        setSaveMessage('تم حفظ بيانات الموظف بنجاح!');
      setFile(null);
      setProcessingResult(null);
      setSelectedImages([]);
      setNotes('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setProcessingResult(null);
    setSelectedImages([]);
    setSelectedProfileImage('');
    setSelectedFullImage('');
    setUploadedImageUrls([]);
    setNotes('');
    setError('');
    setSaveMessage('');
    setCurrentStep('upload');
    setCurrentModel('gemini-2.5-flash');
    setIsRetryingWithPro(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Layout>
      <Head>
        <title>PDF Processor - Document Analysis</title>
        <meta name="description" content="Elegant PDF processing tool for extracting images and data with AI." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 font-sans">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-3xl">
            <div className="px-6 py-8 sm:p-10">
              <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-right">
                معالج المستندات PDF
              </h1>

              {/* Progress Steps */}
              <div className="mb-10">
                <div className="flex justify-between items-center">
                   {[
                     { step: 'upload', label: 'رفع الملف', completed: !!file },
                     { step: 'select-images', label: 'اختيار ورفع الصور', completed: uploadedImageUrls.length > 0 },
                     { step: 'extract-data', label: 'استخراج البيانات', completed: !!(processingResult && processingResult.geminiData && Object.keys(processingResult.geminiData.jsonResponse).length > 0) },
                     { step: 'save', label: 'حفظ البيانات', completed: !!saveMessage },
                   ].map(({ step, label, completed }, index) => (
                    <div
                      key={step}
                       className={`flex items-center transition-all duration-300 ${
                         currentStep === step
                           ? 'text-indigo-600'
                           : completed
                           ? 'text-green-600'
                           : 'text-gray-400'
                       }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg transition-all duration-300 ${
                          currentStep === step
                            ? 'bg-indigo-600 text-white'
                            : completed
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {completed ? '✓' : index + 1}
                      </div>
                      <span className="mr-3 text-sm font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 1: File Upload */}
              {currentStep === 'upload' && (
                <div className="mb-10">
                  <h2 className="text-xl font-semibold text-gray-900 mb-5 text-right">
                    الخطوة 1: رفع ملف PDF
                  </h2>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 bg-gray-50 hover:border-indigo-300 transition-all duration-300">
                    <div className="text-center">
                      <svg
                        className="mx-auto h-16 w-16 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="mt-4">
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer inline-block"
                        >
                          <span className="block text-base font-semibold text-gray-900">
                            رفع ملف PDF
                          </span>
                          <span className="block text-sm text-gray-500 mt-1">
                            اضغط للاختيار أو اسحب الملف هنا
                          </span>
                        </label>
                        <input
                          ref={fileInputRef}
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept=".pdf"
                          className="sr-only"
                          onChange={handleFileChange}
                          aria-label="Upload PDF file"
                        />
                      </div>
                      {file && (
                        <p className="mt-3 text-sm text-green-600 font-medium">
                          الملف المختار: {file.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {file && (
                    <div className="mt-6 text-right">
                      <button
                        onClick={handleFileUpload}
                        disabled={isProcessing}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        {isProcessing ? (
                          <>
                            <svg
                              className="animate-spin -mr-2 ml-3 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            جاري المعالجة...
                          </>
                        ) : (
                          'استخراج الصور من PDF'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Image Selection */}
              {currentStep === 'select-images' && processingResult && (
                <div className="mb-10">
                  <h2 className="text-xl font-semibold text-gray-900 mb-5 text-right">
                    الخطوة 2: اختيار ورفع الصور
                  </h2>
                  <p className="text-sm text-gray-600 mb-6 text-right">
                    تم استخراج {processingResult.extractedImages.length} صورة من الملف. يرجى اختيار الصورة الشخصية (إلزامي) والصورة بالطول (اختياري). سيتم رفع الصور تلقائياً إلى Digital Ocean بعد التأكيد:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Profile Image Selection */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 text-right">
                        الصورة الشخصية <span className="text-sm text-red-500 font-normal">(إلزامي)</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {processingResult.extractedImages.map((imageUrl, index) => (
                          <div
                            key={`profile-${index}`}
                            className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${
                              selectedProfileImage === imageUrl
                                ? 'border-indigo-500 ring-2 ring-indigo-200'
                                : 'border-gray-200 hover:border-indigo-300'
                            }`}
                            onClick={() => handleProfileImageSelect(imageUrl)}
                            role="button"
                            aria-label={`Select profile image ${index + 1}`}
                          >
                            <img
                              src={imageUrl}
                              alt={`صورة شخصية ${index + 1}`}
                              className="w-full h-40 object-cover"
                            />
                            <div className="absolute top-3 right-3">
                              {selectedProfileImage === imageUrl ? (
                                <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-5 h-5 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    aria-hidden="true"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-7 h-7 bg-white rounded-full border-2 border-gray-300"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Full Image Selection */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 text-right">
                        الصورة بالطول <span className="text-sm text-gray-500 font-normal">(اختياري)</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {processingResult.extractedImages.map((imageUrl, index) => (
                          <div
                            key={`full-${index}`}
                            className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${
                              selectedFullImage === imageUrl
                                ? 'border-indigo-500 ring-2 ring-indigo-200'
                                : 'border-gray-200 hover:border-indigo-300'
                            }`}
                            onClick={() => handleFullImageSelect(imageUrl)}
                            role="button"
                            aria-label={`Select full image ${index + 1}`}
                          >
                            <img
                              src={imageUrl}
                              alt={`صورة بالطول ${index + 1}`}
                              className="w-full h-40 object-cover"
                            />
                            <div className="absolute top-3 right-3">
                              {selectedFullImage === imageUrl ? (
                                <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-5 h-5 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    aria-hidden="true"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-7 h-7 bg-white rounded-full border-2 border-gray-300"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="mt-6 text-right">
                    <button
                      onClick={handleImageSelection}
                      disabled={!selectedProfileImage || isUploadingImages}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {isUploadingImages ? (
                        <>
                          <svg
                            className="animate-spin -mr-2 ml-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          جاري رفع الصور...
                        </>
                      ) : (
                        'تأكيد ورفع الصور'
                      )}
                    </button>
                    
                    <button
                      onClick={() => setCurrentStep('upload')}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 mr-3"
                    >
                      السابق: رفع ملف جديد
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Data Extraction */}
              {currentStep === 'extract-data' && (
                <div className="mb-10">
                  <h2 className="text-xl font-semibold text-gray-900 mb-5 text-right">
                    الخطوة 3: استخراج البيانات
                  </h2>
                  <p className="text-sm text-gray-600 mb-6 text-right">
                    تم رفع الصور بنجاح إلى Digital Ocean. اضغط على الزر أدناه لاستخراج البيانات من الملف باستخدام Gemini AI.
                  </p>

                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3 text-right">
                      الصور المختارة:
                    </h3>
                    <div className="flex space-x-6 justify-end">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">الصورة الشخصية</p>
                        <img
                          src={selectedProfileImage}
                          alt="الصورة الشخصية"
                          className="w-24 h-24 object-cover rounded-lg shadow-sm"
                        />
                      </div>
                      {selectedFullImage && (
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">الصورة بالطول</p>
                          <img
                            src={selectedFullImage}
                            alt="الصورة بالطول"
                            className="w-24 h-24 object-cover rounded-lg shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="mt-6 text-right">
                    <button
                      onClick={() => handleDataExtraction()}
                      disabled={isProcessing}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {isProcessing ? (
                        <>
                          <svg
                            className="animate-spin -mr-2 ml-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          جاري استخراج البيانات...
                        </>
                      ) : (
                        'استخراج البيانات باستخدام Gemini'
                      )}
                    </button>
                    
                    {processingResult && processingResult.geminiData && Object.keys(processingResult.geminiData.jsonResponse).length > 0 && (
                      <button
                        onClick={() => setCurrentStep('save')}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 mr-3"
                      >
                        التالي: حفظ البيانات
                      </button>
                    )}
                    
                    <button
                      onClick={() => setCurrentStep('select-images')}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
                    >
                      السابق: اختيار الصور
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Save Data */}
              {currentStep === 'save' && processingResult && processingResult.geminiData && processingResult.geminiData.jsonResponse && (
                <div className="mb-10">
                  <h2 className="text-xl font-semibold text-gray-900 mb-5 text-right">
                    الخطوة 4: حفظ البيانات
                  </h2>

                  {/* Model Information and Retry Button */}
                  <div className="mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                      <div className="flex justify-between items-center">
                        <div className="text-right">
                          <p className="text-sm font-medium text-blue-900">
                            النموذج المستخدم: {currentModel}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            تم استخراج البيانات بنجاح باستخدام {currentModel}
                          </p>
                        </div>
                        <button
                          onClick={handleProModelRetry}
                          disabled={isRetryingWithPro || currentModel === 'gemini-2.0-flash-exp'}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                          {isRetryingWithPro ? (
                            <>
                              <svg
                                className="animate-spin -mr-1 ml-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              جاري المحاولة...
                            </>
                          ) : currentModel === 'gemini-2.0-flash-exp' ? (
                            'تم استخدام النموذج الأحدث'
                          ) : (
                            'جرب بالنموذج الأحدث (Pro)'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Office Validation Warning */}
                  {invalidOffice && (
                    <div className="mb-6">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div className="mr-3 flex-1">
                            <h3 className="text-lg font-medium text-yellow-800 mb-2 text-right">
                              تحذير: المكتب غير موجود في القائمة
                            </h3>
                            <p className="text-sm text-yellow-700 mb-4 text-right">
                              المكتب المستخرج: <span className="font-semibold">{invalidOffice.value}</span> غير موجود في قاعدة البيانات. يرجى اختيار مكتب صحيح من القائمة أدناه.
                            </p>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-yellow-800 mb-2 text-right">
                                اختر المكتب الصحيح:
                              </label>
                              <select
                                onChange={(e) => handleOfficeSelection(e.target.value)}
                                className="w-full px-4 py-2 border border-yellow-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-right"
                                defaultValue=""
                              >
                                <option value="">-- اختر مكتب من القائمة --</option>
                                {offices.map((office) => (
                                  <option key={office.id} value={office.office || ''}>
                                    {office.office}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <button
                            onClick={() => setInvalidOffice(null)}
                            className="flex-shrink-0 text-yellow-600 hover:text-yellow-800"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nationality Validation Warning */}
                  {invalidNationality && (
                    <div className="mb-6">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div className="mr-3 flex-1">
                            <h3 className="text-lg font-medium text-yellow-800 mb-2 text-right">
                              تحذير: الجنسية غير موجودة في القائمة
                            </h3>
                            <p className="text-sm text-yellow-700 mb-4 text-right">
                              الجنسية المستخرجة: <span className="font-semibold">{invalidNationality.value}</span> غير موجودة في قاعدة البيانات. يرجى اختيار جنسية صحيحة من القائمة أدناه.
                            </p>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-yellow-800 mb-2 text-right">
                                اختر الجنسية الصحيحة:
                              </label>
                              <select
                                onChange={(e) => handleNationalitySelection(e.target.value)}
                                className="w-full px-4 py-2 border border-yellow-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-right"
                                defaultValue=""
                              >
                                <option value="">-- اختر جنسية من القائمة --</option>
                                {nationalities.map((nationality) => (
                                  <option key={nationality.id} value={nationality.Country || ''}>
                                    {nationality.Country}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <button
                            onClick={() => setInvalidNationality(null)}
                            className="flex-shrink-0 text-yellow-600 hover:text-yellow-800"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Extracted Data Display */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 text-right">
                      البيانات المستخرجة
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
                      {Object.keys(processingResult.geminiData.jsonResponse).length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-right border-collapse">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border border-gray-200 px-4 py-3 font-semibold text-gray-900">
                                  الحقل
                                </th>
                                <th className="border border-gray-200 px-4 py-3 font-semibold text-gray-900">
                                  القيمة
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(processingResult.geminiData.jsonResponse)
                                .filter(([key]) => key !== 'company_name' && key !== 'CompanyName') // إخفاء company_name من العرض
                                .map(([key, value]) => {
                                // إذا كان الحقل هو office_name، استخدم company_name إذا كان موجوداً
                                const displayKey = key === 'office_name' || key === 'OfficeName' 
                                  ? (processingResult.geminiData.jsonResponse.company_name || processingResult.geminiData.jsonResponse.CompanyName 
                                      ? 'office_name' 
                                      : key)
                                  : key;
                                
                                // استخدام company_name كقيمة إذا كان موجوداً
                                const displayValue = (key === 'office_name' || key === 'OfficeName') 
                                  ? (processingResult.geminiData.jsonResponse.company_name || processingResult.geminiData.jsonResponse.CompanyName || value)
                                  : value;
                                
                                // التحقق من التعديل - إذا كان office_name وكان company_name موجوداً، استخدم company_name
                                const editKey = (key === 'office_name' || key === 'OfficeName') && processingResult.geminiData.jsonResponse.company_name
                                  ? 'company_name'
                                  : key;
                                const isEditing = editingField?.key === editKey;

                                const renderValue = (val: any) => {
                                  if (key === 'skills' || key === 'languages_spoken') {
                                    try {
                                      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
                                      if (typeof parsed === 'object' && parsed !== null) {
                                        return (
                                          <div className="space-y-2">
                                            {Object.entries(parsed).map(([skillKey, skillValue]) => (
                                              <div
                                                key={skillKey}
                                                className="flex justify-between items-center bg-gray-50 p-2 rounded"
                                              >
                                                <span className="font-medium text-gray-800">{skillKey}:</span>
                                                <span className="text-gray-600">{String(skillValue)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        );
                                      }
                                    } catch {
                                      return String(val);
                                    }
                                  }
                                  return String(val);
                                };

                                return (
                                  <tr
                                    key={key}
                                    className="hover:bg-gray-50 transition-all duration-200"
                                  >
                                    <td className="border border-gray-200 px-4 py-3 font-medium text-gray-900">
                                      {displayKey}
                                    </td>
                                    <td className="border border-gray-200 px-4 py-3 text-gray-700">
                                      {isEditing ? (
                                        key === 'skills' || key === 'languages_spoken' ? (
                                          <div>
                                            <textarea
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                              rows={4}
                                              value={editingField?.value ?? ''}
                                              onChange={(e) =>
                                                setEditingField((prev) =>
                                                  prev ? { ...prev, value: e.target.value } : prev
                                                )
                                              }
                                            />
                                            <div className="mt-2 flex justify-end gap-2 text-xs">
                                              <button
                                                type="button"
                                                className="px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700"
                                                onClick={saveEditingField}
                                              >
                                                حفظ
                                              </button>
                                              <button
                                                type="button"
                                                className="px-3 py-1 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
                                                onClick={cancelEditingField}
                                              >
                                                إلغاء
                                              </button>
                                            </div>
                                          </div>
                                        ) : (key === 'office_name' || key === 'OfficeName' || key === 'company_name' || key === 'CompanyName') ? (
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="text"
                                                list="office-list"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={editingField?.value ?? ''}
                                                onChange={(e) =>
                                                  setEditingField((prev) =>
                                                    prev ? { ...prev, value: e.target.value } : prev
                                                  )
                                                }
                                                placeholder="اختر مكتباً أو اكتب للبحث"
                                              />
                                              <datalist id="office-list">
                                                {offices.map((o) => (
                                                  <option key={o.id} value={o.office || ''} />
                                                ))}
                                              </datalist>
                                            </div>
                                            <div className="mt-2 flex justify-end gap-2 text-xs">
                                              <button
                                                type="button"
                                                className="px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700"
                                                onClick={saveEditingField}
                                              >
                                                حفظ
                                              </button>
                                              <button
                                                type="button"
                                                className="px-3 py-1 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
                                                onClick={cancelEditingField}
                                              >
                                                إلغاء
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="text"
                                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                              value={editingField?.value ?? ''}
                                              onChange={(e) =>
                                                setEditingField((prev) =>
                                                  prev ? { ...prev, value: e.target.value } : prev
                                                )
                                              }
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  saveEditingField();
                                                }
                                              }}
                                            />
                                            <button
                                              type="button"
                                              className="px-3 py-1 rounded-md bg-green-600 text-white text-xs hover:bg-green-700"
                                              onClick={saveEditingField}
                                            >
                                              حفظ
                                            </button>
                                            <button
                                              type="button"
                                              className="px-2 py-1 rounded-md bg-gray-200 text-gray-800 text-xs hover:bg-gray-300"
                                              onClick={cancelEditingField}
                                            >
                                              إلغاء
                                            </button>
                                          </div>
                                        )
                                      ) : (
                                        <div className="flex items-center justify-between gap-2">
                                          <span>{renderValue(displayValue)}</span>
                                          <button
                                            type="button"
                                            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs"
                                            onClick={() => startEditingField(key, displayValue)}
                                          >
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              viewBox="0 0 20 20"
                                              fill="currentColor"
                                              className="w-4 h-4"
                                            >
                                              <path d="M15.414 2.586a2 2 0 00-2.828 0L4 11.172V14h2.828l8.586-8.586a2 2 0 000-2.828z" />
                                              <path d="M3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                                            </svg>
                                            تعديل
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm text-right">
                          لم يتم استخراج أي بيانات
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Preview Section */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 text-right">
                      معاينة البيانات
                    </h3>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <AutomaticPreview 
                        employee={{
                          id: 0,
                          name: processingResult.geminiData.jsonResponse.full_name || processingResult.geminiData.jsonResponse.Name,
                          age: processingResult.geminiData.jsonResponse.age || processingResult.geminiData.jsonResponse.Age,
                          religion: processingResult.geminiData.jsonResponse.religion || processingResult.geminiData.jsonResponse.Religion,
                          maritalStatus: processingResult.geminiData.jsonResponse.marital_status || processingResult.geminiData.jsonResponse.MaritalStatus,
                          birthDate: processingResult.geminiData.jsonResponse.date_of_birth || processingResult.geminiData.jsonResponse.BirthDate,
                          nationality: processingResult.geminiData.jsonResponse.nationality || processingResult.geminiData.jsonResponse.Nationality,
                          officeName: processingResult.geminiData.jsonResponse.office_name || processingResult.geminiData.jsonResponse.OfficeName,
                          passportNumber: processingResult.geminiData.jsonResponse.passport_number || processingResult.geminiData.jsonResponse.PassportNumber,
                          passportStartDate: processingResult.geminiData.jsonResponse.passport_issue_date || processingResult.geminiData.jsonResponse.PassportStartDate,
                          passportEndDate: processingResult.geminiData.jsonResponse.passport_expiration || processingResult.geminiData.jsonResponse.PassportEndDate,
                          contractDuration: processingResult.geminiData.jsonResponse.contract_duration || processingResult.geminiData.jsonResponse.Contract_duration,
                          weight: processingResult.geminiData.jsonResponse.weight || processingResult.geminiData.jsonResponse.Weight,
                          height: processingResult.geminiData.jsonResponse.height || processingResult.geminiData.jsonResponse.Height,
                          salary: processingResult.geminiData.jsonResponse.salary || processingResult.geminiData.jsonResponse.Salary,
                          profileImage: uploadedImageUrls[0] || selectedProfileImage,
                          fullImage: uploadedImageUrls[1] || selectedFullImage,
                          // Flattened skills - parse JSON string if needed
                          skill_washing: (() => {
                            try {
                              const skills = typeof processingResult.geminiData.jsonResponse.skills === 'string' 
                                ? JSON.parse(processingResult.geminiData.jsonResponse.skills) as any
                                : processingResult.geminiData.jsonResponse.skills as any;
                              return skills?.WASHING || skills?.washing || null;
                            } catch {
                              return null;
                            }
                          })(),
                          skill_cooking: (() => {
                            try {
                              const skills = typeof processingResult.geminiData.jsonResponse.skills === 'string' 
                                ? JSON.parse(processingResult.geminiData.jsonResponse.skills) as any
                                : processingResult.geminiData.jsonResponse.skills as any;
                              return skills?.COOKING || skills?.cooking || null;
                            } catch {
                              return null;
                            }
                          })(),
                          skill_babysetting: (() => {
                            try {
                              const skills = typeof processingResult.geminiData.jsonResponse.skills === 'string' 
                                ? JSON.parse(processingResult.geminiData.jsonResponse.skills) as any
                                : processingResult.geminiData.jsonResponse.skills as any;
                              return skills?.babysetting || skills?.BABYSITTING || null;
                            } catch {
                              return null;
                            }
                          })(),
                          skill_cleaning: (() => {
                            try {
                              const skills = typeof processingResult.geminiData.jsonResponse.skills === 'string' 
                                ? JSON.parse(processingResult.geminiData.jsonResponse.skills) as any
                                : processingResult.geminiData.jsonResponse.skills as any;
                              return skills?.CLEANING || skills?.cleaning || null;
                            } catch {
                              return null;
                            }
                          })(),
                          skill_laundry: (() => {
                            try {
                              const skills = typeof processingResult.geminiData.jsonResponse.skills === 'string' 
                                ? JSON.parse(processingResult.geminiData.jsonResponse.skills) as any
                                : processingResult.geminiData.jsonResponse.skills as any;
                              return skills?.LAUNDRY || skills?.laundry || null;
                            } catch {
                              return null;
                            }
                          })(),
                          // Flattened languages
                          lang_english: (() => {
                            try {
                              const languages = typeof processingResult.geminiData.jsonResponse.languages_spoken === 'string' 
                                ? JSON.parse(processingResult.geminiData.jsonResponse.languages_spoken) as any
                                : processingResult.geminiData.jsonResponse.languages_spoken as any;
                              return languages?.English || languages?.english || null;
                            } catch {
                              return null;
                            }
                          })(),
                          lang_arabic: (() => {
                            try {
                              const languages = typeof processingResult.geminiData.jsonResponse.languages_spoken === 'string' 
                                ? JSON.parse(processingResult.geminiData.jsonResponse.languages_spoken) as any
                                : processingResult.geminiData.jsonResponse.languages_spoken as any;
                              return languages?.Arabic || languages?.arabic || null;
                            } catch {
                              return null;
                            }
                          })(),
                        }}
                      />
                    </div>
                  </div>

                  {/* Selected Images Summary */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 text-right">
                      الصور المرفوعة إلى Digital Ocean
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-6 shadow-sm">
                      <div className="flex space-x-6 justify-end">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">الصورة الشخصية</p>
                          <img
                            src={uploadedImageUrls[0] || selectedProfileImage}
                            alt="الصورة الشخصية"
                            className="w-28 h-28 object-cover rounded-lg shadow-sm"
                          />
                          {uploadedImageUrls[0] && (
                            <p className="text-xs text-green-600 mt-1">✓ مرفوعة</p>
                          )}
                        </div>
                        {(uploadedImageUrls[1] || selectedFullImage) && (
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-2">الصورة بالطول</p>
                            <img
                              src={uploadedImageUrls[1] || selectedFullImage}
                              alt="الصورة بالطول"
                              className="w-28 h-28 object-cover rounded-lg shadow-sm"
                            />
                            {uploadedImageUrls[1] && (
                              <p className="text-xs text-green-600 mt-1">✓ مرفوعة</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="mb-6">
                    <label
                      htmlFor="notes"
                      className="block text-sm font-medium text-gray-700 mb-2 text-right"
                    >
                      ملاحظات إضافية (اختياري)
                    </label>
                    <textarea
                      id="notes"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                      placeholder="أضف أي ملاحظات إضافية..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      aria-label="Additional notes"
                    />
                  </div>

                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="flex space-x-4 justify-end">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {isSaving ? (
                        <>
                          <svg
                            className="animate-spin -mr-2 ml-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          جاري الحفظ...
                        </>
                      ) : (
                        'حفظ البيانات'
                      )}
                    </button>

                    <button
                      onClick={() => setCurrentStep('extract-data')}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
                    >
                      السابق: استخراج البيانات
                    </button>

                    <button
                      onClick={resetForm}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
                    >
                      إعادة البدء
                    </button>
                  </div>

                  {saveMessage && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-600">{saveMessage}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// إضافة timeout للـ fetch requests
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};