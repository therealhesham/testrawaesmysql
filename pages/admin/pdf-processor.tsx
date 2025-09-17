import { useState, useRef } from 'react';
import Head from 'next/head';

interface ExtractedData {
  jsonResponse: Record<string, string>;
}

interface ProcessingResult {
  extractedImages: string[];
  geminiData: ExtractedData;
  errors?: string[];
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const extractedImages = imageResult.image_urls || [];

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

  const handleImageSelection = () => {
    if (!selectedProfileImage || !selectedFullImage) {
      setError('Please select both profile image and full image');
      return;
    }

    setSelectedImages([selectedProfileImage, selectedFullImage]);
    setCurrentStep('upload-images');
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

      for (const imageUrl of selectedImages) {
        // Fetch the image from the extracted URL
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) continue;

        const imageBlob = await imageResponse.blob();
        
        // Get presigned URL for Digital Ocean
        const presignedResponse = await fetch(`/api/upload-presigned-url/image-${Date.now()}`);
        if (!presignedResponse.ok) continue;

        const { url, filePath } = await presignedResponse.json();

        // Upload to Digital Ocean
        const uploadResponse = await fetch(url, {
          method: 'PUT',
          body: imageBlob,
          headers: {
            'Content-Type': imageBlob.type,
            'x-amz-acl': 'public-read',
          },
        });

        if (uploadResponse.ok) {
          uploadedUrls.push(filePath);
        }
      }

      setUploadedImageUrls(uploadedUrls);
      setCurrentStep('extract-data');
    } catch (error: any) {
      console.error('Error uploading images:', error);
      setError('فشل في رفع الصور المختارة');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleDataExtraction = async () => {
    if (!file) {
      setError('No file available for data extraction');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const geminiFormData = new FormData();
      geminiFormData.append('image', file);

      const geminiResponse = await fetch('https://aidoc.rawaes.com/api/gemini', {
        method: 'POST',
        body: geminiFormData,
      });

      if (!geminiResponse.ok) {
        throw new Error('Failed to extract data using Gemini');
      }

      const geminiResult = await geminiResponse.json();
      const geminiData = { jsonResponse: geminiResult.jsonResponse };

      setProcessingResult((prev) =>
        prev
          ? { ...prev, geminiData }
          : { extractedImages: [], geminiData, errors: [] }
      );
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

  const handleSave = async () => {
    if (!processingResult) {
      setError('No data to save');
      return;
    }

    if (selectedImages.length === 0) {
      setError('Please select at least one image to save');
      return;
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
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
                     { step: 'upload', label: 'رفع الملف' },
                     { step: 'select-images', label: 'اختيار الصور' },
                     { step: 'upload-images', label: 'رفع الصور' },
                     { step: 'extract-data', label: 'استخراج البيانات' },
                     { step: 'save', label: 'حفظ البيانات' },
                   ].map(({ step, label }, index) => (
                    <div
                      key={step}
                       className={`flex items-center transition-all duration-300 ${
                         currentStep === step
                           ? 'text-indigo-600'
                           : ['select-images', 'upload-images', 'extract-data', 'save'].includes(currentStep) &&
                             ['upload', 'select-images', 'upload-images', 'extract-data'].includes(step)
                           ? 'text-green-600'
                           : 'text-gray-400'
                       }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg transition-all duration-300 ${
                          currentStep === step
                            ? 'bg-indigo-600 text-white'
                            : ['select-images', 'upload-images', 'extract-data', 'save'].includes(currentStep) &&
                              ['upload', 'select-images', 'upload-images', 'extract-data'].includes(step)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {index + 1}
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
                    الخطوة 2: اختيار الصور
                  </h2>
                  <p className="text-sm text-gray-600 mb-6 text-right">
                    تم استخراج {processingResult.extractedImages.length} صورة من الملف. يرجى اختيار صورتين:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Profile Image Selection */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 text-right">
                        الصورة الشخصية
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
                        الصورة بالطول
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
                      disabled={!selectedProfileImage || !selectedFullImage}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      المتابعة لاستخراج البيانات
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Upload Images to Digital Ocean */}
              {currentStep === 'upload-images' && (
                <div className="mb-10">
                  <h2 className="text-xl font-semibold text-gray-900 mb-5 text-right">
                    الخطوة 3: رفع الصور إلى Digital Ocean
                  </h2>
                  <p className="text-sm text-gray-600 mb-6 text-right">
                    تم اختيار الصور بنجاح. اضغط على الزر أدناه لرفع الصور إلى Digital Ocean.
                  </p>
                  
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3 text-right">
                      الصور المختارة للرفع:
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
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">الصورة بالطول</p>
                        <img
                          src={selectedFullImage}
                          alt="الصورة بالطول"
                          className="w-24 h-24 object-cover rounded-lg shadow-sm"
                        />
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
                      onClick={uploadSelectedImages}
                      disabled={isUploadingImages}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
                        'رفع الصور إلى Digital Ocean'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Data Extraction */}
              {currentStep === 'extract-data' && (
                <div className="mb-10">
                  <h2 className="text-xl font-semibold text-gray-900 mb-5 text-right">
                    الخطوة 4: استخراج البيانات
                  </h2>
                  <p className="text-sm text-gray-600 mb-6 text-right">
                    تم اختيار الصور بنجاح. اضغط على الزر أدناه لاستخراج البيانات من الملف باستخدام Gemini AI.
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
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">الصورة بالطول</p>
                        <img
                          src={selectedFullImage}
                          alt="الصورة بالطول"
                          className="w-24 h-24 object-cover rounded-lg shadow-sm"
                        />
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
                      onClick={handleDataExtraction}
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
                  </div>
                </div>
              )}

              {/* Step 5: Save Data */}
              {currentStep === 'save' && processingResult && processingResult.geminiData && processingResult.geminiData.jsonResponse && (
                <div className="mb-10">
                  <h2 className="text-xl font-semibold text-gray-900 mb-5 text-right">
                    الخطوة 5: حفظ البيانات
                  </h2>

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
                              {Object.entries(processingResult.geminiData.jsonResponse).map(([key, value]) => (
                                <tr
                                  key={key}
                                  className="hover:bg-gray-50 transition-all duration-200"
                                >
                                  <td className="border border-gray-200 px-4 py-3 font-medium text-gray-900">
                                    {key}
                                  </td>
                                  <td className="border border-gray-200 px-4 py-3 text-gray-700">
                                    {String(value)}
                                  </td>
                                </tr>
                              ))}
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
    </>
  );
}