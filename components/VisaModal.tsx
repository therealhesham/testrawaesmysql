import React, { useState, useRef, useEffect, useMemo } from 'react';

export interface VisaData {
  id: number;
  visaNumber: string;
  gender: string;
  profession: string;
  visaFile: string;
  nationality: string;
  createdAt: string;
}

export interface VisaModalNotification {
  message: string;
  type: 'success' | 'error';
}

export interface ProfessionOption {
  id: number;
  name: string;
  gender?: string | null;
}

interface VisaModalProps {
  isHidden: boolean;
  setIsHidden: (isHidden: boolean) => void;
  visaInfo: VisaData;
  setVisaInfo: (visaInfo: VisaData) => void;
  fetchVisas: () => void;
  setNotification: (notification: VisaModalNotification | null) => void;
  clientId: string;
  isEditMode?: boolean;
  visaId?: number;
  nationalities: Array<{ value: string; label: string }>;
  professions: ProfessionOption[];
}

const VisaModal = React.memo(
  ({
    isHidden,
    setIsHidden,
    visaInfo,
    setVisaInfo,
    fetchVisas,
    setNotification,
    clientId,
    isEditMode = false,
    nationalities,
    professions,
  }: VisaModalProps) => {
    const visaNumberRef = useRef<HTMLInputElement>(null);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [uploading, setUploading] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState<string>('');

    // قائمة المهن المصفاة حسب الجنس (مطابق للجنس أو بدون جنس = للجميع)
    const filteredProfessions = useMemo(() => {
      if (!visaInfo.gender || !professions.length) return professions;
      return professions.filter(
        (p) => p.gender == null || p.gender === '' || p.gender === visaInfo.gender
      );
    }, [visaInfo.gender, professions]);

    // إعادة تعيين المهنة إذا لم تكن ضمن القائمة بعد تغيير الجنس
    useEffect(() => {
      if (visaInfo.profession && visaInfo.gender && filteredProfessions.length > 0) {
        const available = filteredProfessions.some((p) => p.name === visaInfo.profession);
        if (!available) {
          setVisaInfo({ ...visaInfo, profession: '' });
        }
      }
    }, [visaInfo.gender, filteredProfessions]);

    useEffect(() => {
      if (!isHidden && visaNumberRef.current) {
        visaNumberRef.current.focus();
      }
      if (isHidden) {
        setUploadedFileName('');
      }
    }, [isHidden]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setVisaInfo({ ...visaInfo, [e.target.name]: e.target.value });
      setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    };

    const validateForm = () => {
      const newErrors: { [key: string]: string } = {};

      if (!visaInfo.visaNumber) {
        newErrors.visaNumber = 'رقم التأشيرة مطلوب';
      } else if (!/^\d+$/.test(visaInfo.visaNumber)) {
        newErrors.visaNumber = 'رقم التأشيرة يجب أن يحتوي على أرقام فقط';
      } else if (!/^190\d{7}$/.test(visaInfo.visaNumber)) {
        newErrors.visaNumber = 'رقم التأشيرة يجب أن يبدأ بـ 190 ويكون 10 أرقام فقط';
      }

      if (!visaInfo.gender) {
        newErrors.gender = 'الجنس مطلوب';
      }

      if (!visaInfo.nationality) {
        newErrors.nationality = 'الجنسية مطلوبة';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const saveVisaData = async () => {
      if (!validateForm()) {
        setNotification({ message: 'يرجى تصحيح الأخطاء في النموذج', type: 'error' });
        return;
      }

      try {
        const response = await fetch(`/api/visadata${isEditMode ? `` : ''}`, {
          method: isEditMode ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...visaInfo,
            clientID: clientId,
          }),
        });

        if (response.ok) {
          setNotification({
            message: isEditMode ? 'تم تحديث التأشيرة بنجاح' : 'تم إضافة التأشيرة بنجاح',
            type: 'success',
          });
          setIsHidden(true);
          fetchVisas();
          setVisaInfo({
            id: 0,
            visaNumber: '',
            gender: '',
            profession: '',
            visaFile: '',
            nationality: '',
            createdAt: '',
          });
          setErrors({});
        } else {
          throw new Error(isEditMode ? 'فشل في تحديث التأشيرة' : 'فشل في إضافة التأشيرة');
        }
      } catch (error) {
        console.error(error);
        setNotification({
          message: isEditMode ? 'فشل في تحديث التأشيرة' : 'فشل في إضافة التأشيرة',
          type: 'error',
        });
      }
    };

    return (
      <div
        className={`fixed inset-0 bg-gray-800 bg-opacity-50 z-50 flex items-center justify-center transition-opacity duration-300 ${
          isHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
          <h2 className="text-xl font-semibold text-teal-800 mb-4 text-center">
            {isEditMode ? 'تعديل تأشيرة' : 'إضافة تأشيرة'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                رقم التأشيرة <span className="text-red-500">*</span>
              </label>
              <input
                ref={visaNumberRef}
                type="text"
                name="visaNumber"
                value={visaInfo.visaNumber}
                placeholder="أدخل رقم التأشيرة (يبدأ بـ 190)"
                onChange={handleInputChange}
                maxLength={10}
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.visaNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.visaNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.visaNumber}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                الجنس <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={visaInfo.gender}
                onChange={handleInputChange}
                className={`w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.gender ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">اختر الجنس</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">المهنة</label>
              <select
                name="profession"
                value={visaInfo.profession}
                onChange={handleInputChange}
                className={`w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.profession ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">اختر المهنة</option>
                {filteredProfessions.map((prof) => (
                  <option key={prof.id} value={prof.name}>
                    {prof.name}
                  </option>
                ))}
              </select>
              {errors.profession && (
                <p className="text-red-500 text-sm mt-1">{errors.profession}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                الجنسية <span className="text-red-500">*</span>
              </label>
              <select
                name="nationality"
                value={visaInfo.nationality}
                onChange={handleInputChange}
                className={`w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.nationality ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">اختر الجنسية</option>
                {nationalities.map((nat) => (
                  <option key={nat.value} value={nat.value}>
                    {nat.label}
                  </option>
                ))}
              </select>
              {errors.nationality && (
                <p className="text-red-500 text-sm mt-1">{errors.nationality}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">الملف</label>
              <input
                type="file"
                accept="application/pdf,image/*"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setUploading(true);
                  setUploadedFileName('');
                  try {
                    const res = await fetch(`/api/upload-presigned-url/visaFile`);
                    if (!res.ok) throw new Error('فشل في الحصول على رابط الرفع');

                    const { url, filePath } = await res.json();

                    const uploadRes = await fetch(url, {
                      method: 'PUT',
                      body: file,
                      headers: {
                        'Content-Type': file.type || 'application/octet-stream',
                        'x-amz-acl': 'public-read',
                      },
                    });

                    if (!uploadRes.ok) throw new Error('فشل في رفع الملف');

                    setVisaInfo({ ...visaInfo, visaFile: filePath });
                    setUploadedFileName(file.name);
                    setNotification({ message: 'تم رفع الملف بنجاح', type: 'success' });

                    e.target.value = '';
                  } catch (error: any) {
                    console.error('Error uploading file:', error);
                    setUploadedFileName('');
                    setNotification({
                      message: error.message || 'فشل في رفع الملف',
                      type: 'error',
                    });
                  } finally {
                    setUploading(false);
                  }
                }}
                className="w-full border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {uploading && (
                <p className="text-sm text-teal-600 mt-1 flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  جاري رفع الملف...
                </p>
              )}
              {!uploading && uploadedFileName && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800 flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    تم رفع الملف بنجاح: <span className="font-semibold">{uploadedFileName}</span>
                  </p>
                  {visaInfo.visaFile && (
                    <a
                      href={visaInfo.visaFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-teal-600 hover:underline mt-1 block"
                    >
                      عرض الملف
                    </a>
                  )}
                </div>
              )}
              {!uploading && visaInfo.visaFile && !uploadedFileName && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800 flex items-center gap-2">
                    <span className="text-blue-600">ℹ</span>
                    يوجد ملف مرفوع مسبقاً
                  </p>
                  <a
                    href={visaInfo.visaFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-teal-600 hover:underline mt-1 block"
                  >
                    عرض الملف
                  </a>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsHidden(true)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
              >
                إغلاق
              </button>
              <button
                onClick={saveVisaData}
                className="px-4 py-2 bg-teal-800 text-white rounded-md hover:bg-teal-900 transition"
              >
                {isEditMode ? 'حفظ التعديلات' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

VisaModal.displayName = 'VisaModal';
export default VisaModal;
