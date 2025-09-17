import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

export default function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [error, setError] = useState('');
  const [extractedData, setExtractedData] = useState<{
    jsonResponse: Record<string, string>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [showImageSelection, setShowImageSelection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [homemaids, setHomemaids] = useState<any[]>([]);
  const [listError, setListError] = useState('');

  const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];

  useEffect(() => {
    fetchHomemaids();
  }, []);

  const fetchHomemaids = async () => {
    try {
      setListError('');
      const res = await fetch('/api/automaticnewhomemaids');
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'فشل في جلب السجلات');
      }
      const data = await res.json();
      setHomemaids(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setListError(e.message || 'فشل في جلب السجلات');
    }
  };

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

  // Normalize and map Gemini fields to the API expected schema (Prisma)
  const normalizeBoolean = (value: any) => {
    if (typeof value === 'boolean') return value;
    if (value == null) return undefined;
    const v = String(value).trim().toLowerCase();
    if (["yes", "y", "true", "1", "نعم"].includes(v)) return true;
    if (["no", "n", "false", "0", "لا"].includes(v)) return false;
    return undefined;
  };

  const mapEntitiesToApiBody = (entities: Record<string, any>) => {
    const pick = (a: any, b: any) => (a !== undefined && a !== null && a !== '' ? a : b);
    const toInt = (val: any) => {
      const n = parseInt(val as string, 10);
      return Number.isFinite(n) ? n : undefined;
    };
    const toYesNo = (val: any) => {
      const b = normalizeBoolean(val);
      return b === undefined ? undefined : (b ? 'Yes' : 'No');
    };

    return {
      // API expects these exact keys based on the POST handler
      Name: pick(entities.Name, entities.full_name),
      Age: pick(toInt(entities.Age), toInt(entities.age)),
      Nationality: pick(entities.Nationality, entities.nationality),
      BirthDate: pick(entities.BirthDate, entities.birthDate),
      BabySitting: pick(toYesNo(entities.BabySitting), toYesNo(entities.babySitting)),
      Cleaning: pick(toYesNo(entities.Cleaning), toYesNo(entities.cleaning)),
      Cooking: pick(toYesNo(entities.Cooking), toYesNo(entities.cooking)),
      Contract_duration: pick(entities.Contract_duration, entities.contractDuration),
      height: pick(entities.height, entities.Height),
      laundry: pick(toYesNo(entities.laundry), toYesNo(entities.Laundry)),
      MaritalStatus: pick(entities.MaritalStatus, entities.marital_status),
      OfficeName: pick(entities.OfficeName, entities.office_name),
      PassportEndDate: pick(entities.PassportEndDate, entities.passport_expiration),
      PassportNumber: pick(entities.PassportNumber, entities.passport_number),
      PassportStartDate: pick(entities.PassportStartDate, entities.passport_issue_date),
      Religion: pick(entities.Religion, entities.religion),
      salary: pick(entities.salary, entities.Salary),
      stitiching: pick(toYesNo(entities.stitiching), toYesNo(entities.stitching)),
      Weight: pick(entities.Weight, entities.weight),
      profileImage: null, // Will be set later from uploaded images
      fullImage: null, // Will be set later from uploaded images
    };
  };

  const handleUpload = async () => {
    if (!file) {
      setError('يرجى اختيار ملف أولاً');
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
console.log(entities)
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

      // Step 2: Send structured data to homemaids API (mapped to API schema)
      try {
        const payload = mapEntitiesToApiBody(entities as Record<string, any>);
        const uploadRes = await fetch("/api/automaticnewhomemaids", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!uploadRes.ok) {
          const errorText = await uploadRes.text();
          throw new Error(`فشل إرسال البيانات: ${errorText}`);
        }

        setFile(null);
        setFileUploaded(false);
        if (fileInputRef.current) fileInputRef.current.value = '';

        alert('تم رفع الملف واستخراج البيانات وإرسالها بنجاح!');
        fetchHomemaids();
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

  const handleImageSelection = (imageUrl: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedImages(prev => [...prev, imageUrl]);
    } else {
      setSelectedImages(prev => prev.filter(url => url !== imageUrl));
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
      setShowImageSelection(false);
    } catch (error: any) {
      console.error('Error uploading images:', error);
      setError('فشل في رفع الصور المختارة');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!extractedData) {
      setError('لا توجد بيانات مستخرجة للحفظ');
      return;
    }

    if (uploadedImageUrls.length === 0) {
      setError('يرجى رفع الصور المختارة أولاً');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const payload: any = mapEntitiesToApiBody(extractedData.jsonResponse as Record<string, any>);
      
      // Add image URLs to the payload
      payload.profileImage = uploadedImageUrls[0] || null;
      payload.fullImage = uploadedImageUrls[1] || uploadedImageUrls[0] || null;

      const uploadRes = await fetch("/api/automaticnewhomemaids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(`فشل إرسال البيانات: ${errorText}`);
      }

      // Reset form
      setFile(null);
      setFileUploaded(false);
      setExtractedData(null);
      setExtractedImages([]);
      setSelectedImages([]);
      setUploadedImageUrls([]);
      setShowImageSelection(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

      alert('تم رفع الملف واستخراج البيانات وحفظها بنجاح!');
      fetchHomemaids();
    } catch (error: any) {
      console.error('Error saving data:', error);
      setError(`فشل في حفظ البيانات: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // removed processor status helpers and UI

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
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 max-w-5xl w-full">
        <h1 className="text-3xl font-normal text-black text-center mb-6">رفع المستندات</h1>

        {/* تم حذف سكشن التحكم في المعالج */}

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
                disabled={isLoading}
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
              disabled={isLoading || !fileUploaded}
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
                  </>
                )}
              </div>
            </div>
          )}

          {showImageSelection && extractedImages.length > 0 && (
            <div className="mt-6">
              <h2 className="text-2xl font-normal text-black mb-4">اختيار الصور</h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600 mb-4">
                  تم استخراج {extractedImages.length} صورة من الملف. يرجى اختيار الصور التي تريد رفعها:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                  {extractedImages.map((imageUrl, index) => (
                    <div key={index} className="relative">
                      <label className="cursor-pointer">
                        <input
                          type="checkbox"
                          className="absolute top-2 right-2 z-10"
                          checked={selectedImages.includes(imageUrl)}
                          onChange={(e) => handleImageSelection(imageUrl, e.target.checked)}
                        />
                        <img
                          src={imageUrl}
                          alt={`Extracted image ${index + 1}`}
                          className="w-full h-32 object-cover rounded border-2 border-gray-300 hover:border-teal-500"
                        />
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    تم اختيار {selectedImages.length} صورة
                  </span>
                  <button
                    type="button"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                    onClick={uploadSelectedImages}
                    disabled={selectedImages.length === 0 || isUploadingImages}
                  >
                    {isUploadingImages ? 'جاري الرفع...' : 'رفع الصور المختارة'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {uploadedImageUrls.length > 0 && extractedData && (
            <div className="mt-6">
              <h2 className="text-2xl font-normal text-black mb-4">تأكيد الحفظ</h2>
              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-sm text-green-700 mb-4">
                  تم رفع {uploadedImageUrls.length} صورة بنجاح. يمكنك الآن حفظ البيانات.
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                    onClick={handleConfirmSave}
                    disabled={isLoading}
                  >
                    {isLoading ? 'جاري الحفظ...' : 'تأكيد الحفظ'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-normal text-black">السجلات الأخيرة</h2>
              <button
                type="button"
                className="text-sm text-teal-800 hover:underline"
                onClick={fetchHomemaids}
                disabled={isLoading}
              >
                تحديث
              </button>
            </div>
            {listError && <p className="text-red-500 text-xs mb-2">{listError}</p>}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السن</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الجنسية</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الميلاد</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المهارات</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الصور</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الإنشاء</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {homemaids.map((h) => (
                    <tr key={h.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-right">{h.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">{h.age}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">{h.nationality}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">{h.birthDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {h.babySitting && 'Babysitting, '}
                        {h.cleaning && 'Cleaning, '}
                        {h.cooking && 'Cooking, '}
                        {h.laundry && 'Laundry, '}
                        {h.stitching && 'Stitching'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex gap-2">
                          {h.profileImage && (
                            <a
                              href={h.profileImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs"
                            >
                              صورة شخصية
                            </a>
                          )}
                          {h.fullImage && (
                            <a
                              href={h.fullImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs"
                            >
                              صورة كاملة
                            </a>
                          )}
                          {!h.profileImage && !h.fullImage && (
                            <span className="text-gray-400 text-xs">لا توجد صور</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        {h.createdAt ? new Date(h.createdAt).toLocaleDateString('ar-SA') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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