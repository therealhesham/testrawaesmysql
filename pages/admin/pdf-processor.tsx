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
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<'upload' | 'select-images' | 'extract-data' | 'save'>('upload');
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
    // Step 1: Extract images from PDF only
    const imageFormData = new FormData();
    imageFormData.append('file', file); // Changed 'pdf' to 'file'

    const imageResponse = await fetch('https://extract.rawaes.com/extract-images', {
      method: 'POST',
      body: imageFormData,
    });

    if (!imageResponse.ok) {
      const errorData = await imageResponse.json(); // Capture error details
      throw new Error(errorData.detail || 'Failed to extract images from PDF');
    }

    const imageResult = await imageResponse.json();
    const extractedImages = imageResult.image_urls || [];

    if (extractedImages.length === 0) {
      throw new Error('No images found in the PDF');
    }

    // Set the extracted images and move to selection step
    setProcessingResult({
      extractedImages,
      geminiData: { jsonResponse: {} },
      errors: []
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
    setCurrentStep('extract-data');
  };

  const handleDataExtraction = async () => {
    if (!file) {
      setError('No file available for data extraction');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Step 2: Extract data using Gemini
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

      // Update the processing result with Gemini data
      setProcessingResult(prev => prev ? {
        ...prev,
        geminiData
      } : {
        extractedImages: [],
        geminiData,
        errors: []
      });

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
      // Generate a unique session ID for this processing session
      const sessionId = `pdf-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const response = await fetch('/api/save-pdf-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          selectedImages,
          geminiData: processingResult.geminiData,
          originalFileName: file?.name || 'document.pdf',
          notes,
          processedBy: 'Admin User' // You can get this from auth context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save data');
      }

      const result = await response.json();
      setSaveMessage('Data saved successfully!');
      
      // Reset form
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
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">معالج المستندات PDF</h1>
              
              {/* Progress Steps */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div className={`flex items-center ${currentStep === 'upload' ? 'text-blue-600' : currentStep === 'select-images' || currentStep === 'extract-data' || currentStep === 'save' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'upload' ? 'bg-blue-600 text-white' : currentStep === 'select-images' || currentStep === 'extract-data' || currentStep === 'save' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                      1
                    </div>
                    <span className="ml-2 text-sm font-medium">رفع الملف</span>
                  </div>
                  
                  <div className={`flex items-center ${currentStep === 'select-images' ? 'text-blue-600' : currentStep === 'extract-data' || currentStep === 'save' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'select-images' ? 'bg-blue-600 text-white' : currentStep === 'extract-data' || currentStep === 'save' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                      2
                    </div>
                    <span className="ml-2 text-sm font-medium">اختيار الصور</span>
                  </div>
                  
                  <div className={`flex items-center ${currentStep === 'extract-data' ? 'text-blue-600' : currentStep === 'save' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'extract-data' ? 'bg-blue-600 text-white' : currentStep === 'save' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                      3
                    </div>
                    <span className="ml-2 text-sm font-medium">استخراج البيانات</span>
                  </div>
                  
                  <div className={`flex items-center ${currentStep === 'save' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'save' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                      4
                    </div>
                    <span className="ml-2 text-sm font-medium">حفظ البيانات</span>
                  </div>
                </div>
              </div>
              
              {/* Step 1: File Upload */}
              {currentStep === 'upload' && (
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">الخطوة 1: رفع ملف PDF</h2>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="mt-4">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            رفع ملف PDF
                          </span>
                          <span className="mt-1 block text-sm text-gray-500">
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
                        />
                      </div>
                      {file && (
                        <p className="mt-2 text-sm text-green-600">
                          الملف المختار: {file.name}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                  
                  {file && (
                    <div className="mt-4">
                      <button
                        onClick={handleFileUpload}
                        disabled={isProcessing}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">الخطوة 2: اختيار الصور</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    تم استخراج {processingResult.extractedImages.length} صورة من الملف. يرجى اختيار صورتين:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Profile Image Selection */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-4">الصورة الشخصية</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {processingResult.extractedImages.map((imageUrl, index) => (
                          <div
                            key={`profile-${index}`}
                            className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                              selectedProfileImage === imageUrl
                                ? 'border-blue-500 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleProfileImageSelect(imageUrl)}
                          >
                            <img
                              src={imageUrl}
                              alt={`صورة شخصية ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              {selectedProfileImage === imageUrl ? (
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-white rounded-full border-2 border-gray-300"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Full Image Selection */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-4">الصورة بالطول</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {processingResult.extractedImages.map((imageUrl, index) => (
                          <div
                            key={`full-${index}`}
                            className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                              selectedFullImage === imageUrl
                                ? 'border-blue-500 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleFullImageSelect(imageUrl)}
                          >
                            <img
                              src={imageUrl}
                              alt={`صورة بالطول ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              {selectedFullImage === imageUrl ? (
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-white rounded-full border-2 border-gray-300"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="mt-6">
                    <button
                      onClick={handleImageSelection}
                      disabled={!selectedProfileImage || !selectedFullImage}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      المتابعة لاستخراج البيانات
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Data Extraction */}
              {currentStep === 'extract-data' && (
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">الخطوة 3: استخراج البيانات</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    تم اختيار الصور بنجاح. اضغط على الزر أدناه لاستخراج البيانات من الملف باستخدام Gemini AI.
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="text-md font-medium text-gray-900 mb-2">الصور المختارة:</h3>
                    <div className="flex space-x-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">الصورة الشخصية</p>
                        <img src={selectedProfileImage} alt="الصورة الشخصية" className="w-20 h-20 object-cover rounded" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">الصورة بالطول</p>
                        <img src={selectedFullImage} alt="الصورة بالطول" className="w-20 h-20 object-cover rounded" />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="mt-6">
                    <button
                      onClick={handleDataExtraction}
                      disabled={isProcessing}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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

              {/* Step 4: Save Data */}
              {currentStep === 'save' && processingResult && processingResult.geminiData && processingResult.geminiData.jsonResponse && (
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">الخطوة 4: حفظ البيانات</h2>
                  
                  {/* Extracted Data Display */}
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-900 mb-4">البيانات المستخرجة</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {Object.keys(processingResult.geminiData.jsonResponse).length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-right border-collapse">
                            <thead>
                              <tr className="bg-gray-200">
                                <th className="border border-gray-300 px-4 py-2 font-medium">الحقل</th>
                                <th className="border border-gray-300 px-4 py-2 font-medium">القيمة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(processingResult.geminiData.jsonResponse).map(([key, value]) => (
                                <tr key={key} className="hover:bg-gray-100">
                                  <td className="border border-gray-300 px-4 py-2 font-medium">{key}</td>
                                  <td className="border border-gray-300 px-4 py-2">{String(value)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">لم يتم استخراج أي بيانات</p>
                      )}
                    </div>
                  </div>

                  {/* Selected Images Summary */}
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-900 mb-4">الصور المختارة</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex space-x-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">الصورة الشخصية</p>
                          <img src={selectedProfileImage} alt="الصورة الشخصية" className="w-24 h-24 object-cover rounded" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">الصورة بالطول</p>
                          <img src={selectedFullImage} alt="الصورة بالطول" className="w-24 h-24 object-cover rounded" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="mb-6">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      ملاحظات إضافية (اختياري)
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="أضف أي ملاحظات إضافية..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          جاري الحفظ...
                        </>
                      ) : (
                        'حفظ البيانات'
                      )}
                    </button>
                    
                    <button
                      onClick={resetForm}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      إعادة البدء
                    </button>
                  </div>

                  {saveMessage && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
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
