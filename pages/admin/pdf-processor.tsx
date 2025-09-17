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
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
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
      // Step 1: Extract images from PDF
      const imageFormData = new FormData();
      imageFormData.append('pdf', file);

      const imageResponse = await fetch('https://extract.rawaes.com/extract-images', {
        method: 'POST',
        body: imageFormData,
      });

      let extractedImages: string[] = [];
      if (imageResponse.ok) {
        const imageResult = await imageResponse.json();
        extractedImages = imageResult.image_urls || [];
      }

      // Step 2: Extract data using Gemini
      const geminiFormData = new FormData();
      geminiFormData.append('image', file); // Using 'image' as per your existing code

      const geminiResponse = await fetch('https://aidoc.rawaes.com/api/gemini', {
        method: 'POST',
        body: geminiFormData,
      });

      let geminiData: ExtractedData | null = null;
      if (geminiResponse.ok) {
        const geminiResult = await geminiResponse.json();
        geminiData = { jsonResponse: geminiResult.jsonResponse };
      }

      const result: ProcessingResult = {
        extractedImages,
        geminiData: geminiData || { jsonResponse: {} },
        errors: []
      };

      if (!imageResponse.ok) {
        result.errors?.push('Failed to extract images from PDF');
      }
      if (!geminiResponse.ok) {
        result.errors?.push('Failed to extract data using Gemini');
      }

      setProcessingResult(result);
      
      // Auto-select all images initially
      setSelectedImages(extractedImages);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageSelection = (imageUrl: string) => {
    setSelectedImages(prev => {
      if (prev.includes(imageUrl)) {
        return prev.filter(url => url !== imageUrl);
      } else {
        return [...prev, imageUrl];
      }
    });
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
    setNotes('');
    setError('');
    setSaveMessage('');
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
              <h1 className="text-2xl font-bold text-gray-900 mb-6">PDF Document Processor</h1>
              
              {/* File Upload Section */}
              <div className="mb-8">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload a PDF file
                        </span>
                        <span className="mt-1 block text-sm text-gray-500">
                          Click to select or drag and drop
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
                        Selected: {file.name}
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
                          Processing...
                        </>
                      ) : (
                        'Process PDF'
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Processing Results */}
              {processingResult && (
                <div className="space-y-6">
                  {/* Extracted Images */}
                  {processingResult.extractedImages && processingResult.extractedImages.length > 0 && (
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 mb-4">Extracted Images</h2>
                      <p className="text-sm text-gray-600 mb-4">
                        Select the images you want to save ({selectedImages.length} selected)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {processingResult.extractedImages.map((imageUrl, index) => (
                          <div
                            key={index}
                            className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                              selectedImages.includes(imageUrl)
                                ? 'border-blue-500 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleImageSelection(imageUrl)}
                          >
                            <img
                              src={imageUrl}
                              alt={`Extracted image ${index + 1}`}
                              className="w-full h-48 object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              {selectedImages.includes(imageUrl) ? (
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
                  )}

                  {/* Gemini Data */}
                  {processingResult.geminiData && processingResult.geminiData.jsonResponse && (
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 mb-4">Extracted Data</h2>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {Object.keys(processingResult.geminiData.jsonResponse).length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-gray-200">
                                  <th className="border border-gray-300 px-4 py-2 font-medium">Field</th>
                                  <th className="border border-gray-300 px-4 py-2 font-medium">Value</th>
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
                          <p className="text-gray-500 text-sm">No data extracted</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {processingResult.errors && processingResult.errors.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <h3 className="text-sm font-medium text-yellow-800">Processing Warnings:</h3>
                      <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                        {processingResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Save Section */}
                  <div className="border-t pt-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Save Data</h2>
                    
                    <div className="mb-4">
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        id="notes"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Add any additional notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={handleSave}
                        disabled={isSaving || selectedImages.length === 0}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          `Save Data (${selectedImages.length} images)`
                        )}
                      </button>
                      
                      <button
                        onClick={resetForm}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Reset
                      </button>
                    </div>

                    {saveMessage && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-600">{saveMessage}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
