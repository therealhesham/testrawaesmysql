import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Layout from 'example/containers/Layout';
import AutomaticPreview from '../../components/AutomaticPreview';
import { useToast } from '../../components/GlobalToast';

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

// Helper functions for height and weight validation and conversion
const detectHeightUnit = (value: string): 'cm' | 'feet' | 'unknown' => {
  const normalized = String(value).toLowerCase().trim();
  // Check for feet indicators
  if (normalized.includes('ft') || normalized.includes('feet') || normalized.includes("'") || normalized.includes('foot')) {
    return 'feet';
  }
  // Check for cm indicators
  if (normalized.includes('cm') || normalized.includes('centimeter')) {
    return 'cm';
  }
  // If it's a number, check if it's likely feet (typically 4-7 feet) or cm (typically 140-200)
  const numValue = parseFloat(normalized.replace(/[^0-9.]/g, ''));
  if (!isNaN(numValue)) {
    if (numValue >= 4 && numValue <= 7.5) {
      return 'feet';
    }
    if (numValue >= 140 && numValue <= 200) {
      return 'cm';
    }
  }
  return 'unknown';
};

const detectWeightUnit = (value: string): 'kg' | 'pounds' | 'unknown' => {
  const normalized = String(value).toLowerCase().trim();
  // Check for pounds indicators
  if (normalized.includes('lb') || normalized.includes('lbs') || normalized.includes('pound') || normalized.includes('pounds')) {
    return 'pounds';
  }
  // Check for kg indicators
  if (normalized.includes('kg') || normalized.includes('kilogram') || normalized.includes('kilo')) {
    return 'kg';
  }
  // If it's a number, check if it's likely pounds (typically 80-300) or kg (typically 30-150)
  const numValue = parseFloat(normalized.replace(/[^0-9.]/g, ''));
  if (!isNaN(numValue)) {
    if (numValue >= 80 && numValue <= 300) {
      return 'pounds';
    }
    if (numValue >= 30 && numValue <= 150) {
      return 'kg';
    }
  }
  return 'unknown';
};

const convertFeetToCm = (value: string): number => {
  const normalized = String(value).toLowerCase().trim();
  // Extract numbers (could be "5'6" or "5.5" or "5 6")
  const numbers = normalized.match(/[\d.]+/g) || [];
  if (numbers.length === 0) return 0;
  
  let feet = 0;
  let inches = 0;
  
  const firstNum = numbers[0] ? parseFloat(numbers[0]) : 0;
  const secondNum = numbers[1] ? parseFloat(numbers[1]) : 0;
  
  if (normalized.includes("'") || normalized.includes('ft')) {
    // Format like "5'6" or "5ft 6in"
    feet = firstNum || 0;
    inches = numbers.length > 1 ? secondNum : 0;
  } else if (numbers.length === 1) {
    // Single number, assume it's feet with decimal
    const num = firstNum;
    feet = Math.floor(num);
    inches = (num - feet) * 12;
  } else {
    feet = firstNum || 0;
    inches = secondNum || 0;
  }
  
  // Convert to cm: 1 foot = 30.48 cm, 1 inch = 2.54 cm
  return Math.round(feet * 30.48 + inches * 2.54);
};

const convertPoundsToKg = (value: string): number => {
  const normalized = String(value).toLowerCase().trim();
  const numValue = parseFloat(normalized.replace(/[^0-9.]/g, ''));
  if (isNaN(numValue)) return 0;
  // 1 pound = 0.453592 kg
  return Math.round(numValue * 0.453592);
};

const validateHeight = (value: string): { isValid: boolean; isFeet?: boolean } => {
  const numValue = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  if (isNaN(numValue)) return { isValid: false };
  
  const unit = detectHeightUnit(value);
  let heightInCm = numValue;
  
  if (unit === 'feet') {
    heightInCm = convertFeetToCm(value);
    return { isValid: heightInCm >= 140 && heightInCm <= 175, isFeet: true };
  }
  
  // Assume cm if unknown
  return { isValid: heightInCm >= 140 && heightInCm <= 175 };
};

const validateWeight = (value: string): { isValid: boolean; isPounds?: boolean } => {
  const numValue = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  if (isNaN(numValue)) return { isValid: false };
  
  const unit = detectWeightUnit(value);
  let weightInKg = numValue;
  
  if (unit === 'pounds') {
    weightInKg = convertPoundsToKg(value);
    return { isValid: weightInKg >= 50 && weightInKg <= 120, isPounds: true };
  }
  
  // Assume kg if unknown
  return { isValid: weightInKg >= 50 && weightInKg <= 120 };
};

// قوائم الخيارات الموحدة
const skillLevels = [
  "Expert - ممتاز",
  "Advanced - جيد جداً",
  "Intermediate - جيد",
  "Beginner - مبتدأ",
  "Non - لا تجيد"
];

const maritalStatusOptions = [
  "Single - عازبة",
  "Married - متزوجة",
  "Divorced - مطلقة"
];

const religionOptions = [
  "Islam - الإسلام",
  "Non-Muslim - غير مسلم"
];

const experienceOptions = [
  "Novice | مدربة بدون خبرة",
  "Intermediate | مدربة بخبرة متوسطة",
  "Well-experienced | خبرة جيدة",
  "Expert | خبرة ممتازة"
];

const educationOptions = [
  "Diploma - دبلوم",
  "High school - ثانوي",
  "Illiterate - غير متعلم",
  "Literate - القراءة والكتابة",
  "Primary school - ابتدائي",
  "University level - جامعي"
];

// دالة للتحقق من وجود القيمة في قائمة الخيارات
const isValueInOptions = (value: string, options: string[]): boolean => {
  if (!value || typeof value !== 'string') return false;
  const normalizedValue = value.trim();
  return options.some(option => option.trim() === normalizedValue);
};

export default function PDFProcessor() {
  const { showToast } = useToast();
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
  const [offices, setOffices] = useState<{ id: number; office: string | null; Country: string | null }[]>([]);
  const [filteredOffices, setFilteredOffices] = useState<{ id: number; office: string | null; Country: string | null }[]>([]);
  const [selectedNationality, setSelectedNationality] = useState<string | null>(null);
  const [invalidOffice, setInvalidOffice] = useState<{ field: string; value: string } | null>(null);
  const [nationalities, setNationalities] = useState<{ id: number; Country: string | null }[]>([]);
  const [invalidNationality, setInvalidNationality] = useState<{ field: string; value: string } | null>(null);
  const [officeNationalities, setOfficeNationalities] = useState<string[]>([]);
  const [selectedOfficeNationality, setSelectedOfficeNationality] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
 const [professions, setProfessions] = useState<{ id: number; name: string }[]>([]);

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
          // في البداية، عرض جميع المكاتب
          setFilteredOffices(data.offices);
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
    
   const fetchProfessions = async () => {
      console.log("🔵 Client: Starting fetch request..."); // تتبع 1
      
      try {
        const res = await fetch('/api/professions');
        console.log("🔵 Client: Response status:", res.status); // تتبع 2

        if (!res.ok) {
          console.error('Failed to fetch professions');
          return;
        }
        
        const data = await res.json();
        console.log("🔵 Client: Data received:", data); // تتبع 3: هذا أهم سطر لنعرف شكل البيانات

        // التحقق من نوع البيانات وتعيينها
        if (Array.isArray(data)) {
            console.log("✅ Data is Array, setting state...");
            setProfessions(data);
        } 
        else if (data && Array.isArray(data.professions)) {
            console.log("✅ Data is Object {professions: []}, setting state...");
            setProfessions(data.professions);
        } 
        else {
            console.error("⚠️ Data format is unknown:", data);
        }

      } catch (e) {
        console.error('Error fetching professions list:', e);
      }
    };

  
    fetchProfessions(); // استدعاء الدالة

    fetchOffices();
    fetchNationalities();
  }, []);

  // استخراج الجنسيات الفريدة من offices
  useEffect(() => {
    if (offices.length > 0) {
      const uniqueNationalities = Array.from(
        new Set(
          offices
            .map(office => office.Country)
            .filter((country): country is string => country !== null && country.trim() !== '')
        )
      ).sort();
      setOfficeNationalities(uniqueNationalities);
    }
  }, [offices]);

  // تصفية المكاتب بناءً على الجنسية المختارة
  useEffect(() => {
    if (selectedNationality) {
      const filtered = offices.filter(office => 
        office.Country?.toLowerCase().trim() === selectedNationality.toLowerCase().trim()
      );
      setFilteredOffices(filtered);
    } else {
      // إذا لم يتم اختيار جنسية، عرض جميع المكاتب
      setFilteredOffices(offices);
    }
  }, [selectedNationality, offices]);

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
      let cleanedJsonResponse = { ...geminiResult.jsonResponse };

      // تنظيف الحقول المكررة - الاحتفاظ بالقيمة الممتلئة
      const removeDuplicateFields = (data: Record<string, any>) => {
        const cleaned: Record<string, any> = {};
        const processedKeys = new Set<string>();
        
        // قائمة الحقول المترادفة (الحقول التي تعبر عن نفس الشيء)
        const synonymGroups = [
          ['name', 'full_name', 'Name', 'FullName'],
          ['nationality', 'Nationality', 'nationalitycopy', 'Nationalitycopy', 'nationality', 'Nationality', 'nationalitycopy', 'Nationalitycopy'],
          ['religion', 'Religion', 'religion', 'Religion', 'religion', 'Religion', 'religion', 'Religion'],
          ['marital_status', 'MaritalStatus', 'maritalStatus', 'maritalstatus'],
          ['date_of_birth', 'birthDate', 'BirthDate', 'age', 'dateofbirth', 'DateOfBirth', 'birth_date', 'Birth_Date'],
          ['passport_number', 'passport', 'PassportNumber', 'Passportnumber', 'passportNumber', 'passportnumber'],
          ['office_name', 'company_name', 'OfficeName', 'CompanyName'],
          ['passport_issue_date', 'passportStart', 'passportStartDate', 'PassportStartDate'],
          ['passport_expiration', 'passportEnd', 'passportEndDate', 'PassportEndDate'],
          ['mobile', 'phone', 'Mobile', 'Phone'],
          ['weight', 'Weight'],
          ['height', 'Height'],
          ['children_count', 'children', 'Children'],
          ['job_title', 'jobTitle', 'JobTitle', 'profession', 'Profession', 'job', 'Job'],
          ['salary', 'Salary'],
          ['educationLevel', 'education_level', 'EducationLevel', 'education', 'Education'],
          ['arabicLevel', 'arabic_level', 'ArabicLevel', 'ArabicLanguageLeveL'],
          ['englishLevel', 'english_level', 'EnglishLevel', 'EnglishLanguageLevel'],
          ['experienceField', 'experience_field', 'ExperienceField', 'experience', 'Experience'],
          ['experienceYears', 'experience_years', 'ExperienceYears', 'years_of_experience'],
        ];

        // معالجة كل مجموعة مترادفة
        synonymGroups.forEach(group => {
          const values: Array<{ key: string; value: any }> = [];
          const allValues: Array<{ key: string; value: any }> = [];
          
          // جمع جميع القيم من الحقول المترادفة
          group.forEach(key => {
            if (data.hasOwnProperty(key)) {
              const value = data[key];
              allValues.push({ key, value });
              
              const normalizedValue = value !== null && value !== undefined 
                ? String(value).trim().toLowerCase() 
                : '';
              
              // التحقق من أن القيمة ليست فارغة
              const isEmpty = !normalizedValue || 
                              normalizedValue === 'null' || 
                              normalizedValue === 'undefined' || 
                              normalizedValue === '';
              
              if (!isEmpty) {
                values.push({ key, value: data[key] });
              }
            }
          });

          // إذا كانت هناك قيم متعددة ممتلئة
          if (values.length > 0) {
            // التحقق من التطابق: إذا كانت جميع القيم متطابقة، احتفظ بأول حقل في المجموعة
            const firstValue = String(values[0].value).trim().toLowerCase();
            const allMatch = values.every(v => String(v.value).trim().toLowerCase() === firstValue);
            
            if (allMatch) {
              // إذا كانت جميع القيم متطابقة، احتفظ بأول حقل في المجموعة
              const firstKeyInGroup = group.find(key => 
                values.some(v => v.key === key)
              );
              if (firstKeyInGroup) {
                const matchedValue = values.find(v => v.key === firstKeyInGroup);
                if (matchedValue) {
                  cleaned[matchedValue.key] = matchedValue.value;
                }
              }
            } else {
              // إذا كانت القيم مختلفة، اختر الأفضل (الأطول أولاً، ثم حسب ترتيب المجموعة)
              values.sort((a, b) => {
                const aStr = String(a.value).trim();
                const bStr = String(b.value).trim();
                
                // الأطول أولاً
                if (bStr.length !== aStr.length) {
                  return bStr.length - aStr.length;
                }
                
                // ثم حسب ترتيب المجموعة (الأول في القائمة له أولوية أعلى)
                const aIndex = group.indexOf(a.key);
                const bIndex = group.indexOf(b.key);
                return aIndex - bIndex;
              });

              // الاحتفاظ بأفضل قيمة فقط
              const bestValue = values[0];
              cleaned[bestValue.key] = bestValue.value;
            }
            
            // إضافة المفاتيح الأخرى للمعالجة لتجنب إضافتها مرة أخرى
            group.forEach(key => processedKeys.add(key));
          } else if (allValues.length > 0) {
            // إذا كانت جميع القيم فارغة، احتفظ بأول حقل في المجموعة
            const firstKey = group.find(key => data.hasOwnProperty(key));
            if (firstKey) {
              cleaned[firstKey] = data[firstKey];
              group.forEach(key => processedKeys.add(key));
            }
          }
        });

        // إضافة الحقول الأخرى التي لم يتم معالجتها
        Object.keys(data).forEach(key => {
          if (!processedKeys.has(key)) {
            cleaned[key] = data[key];
          }
        });

        return cleaned;
      };

      cleanedJsonResponse = removeDuplicateFields(cleanedJsonResponse);
      
      // التحقق من القيم المستخرجة وحذف القيم غير الصحيحة
      // التحقق من religion
      const religionValue = cleanedJsonResponse.religion || cleanedJsonResponse.Religion;
      if (religionValue && !isValueInOptions(String(religionValue), religionOptions)) {
        delete cleanedJsonResponse.religion;
        delete cleanedJsonResponse.Religion;
      }
      
      // التحقق من maritalStatus
      const maritalStatusValue = cleanedJsonResponse.maritalStatus || cleanedJsonResponse.marital_status || cleanedJsonResponse.MaritalStatus || cleanedJsonResponse.maritalstatus;
      if (maritalStatusValue && !isValueInOptions(String(maritalStatusValue), maritalStatusOptions)) {
        delete cleanedJsonResponse.maritalStatus;
        delete cleanedJsonResponse.marital_status;
        delete cleanedJsonResponse.MaritalStatus;
        delete cleanedJsonResponse.maritalstatus;
      }
      
      // التحقق من educationLevel
      const educationLevelValue = cleanedJsonResponse.educationLevel || cleanedJsonResponse.education_level || cleanedJsonResponse.EducationLevel || cleanedJsonResponse.education || cleanedJsonResponse.Education;
      if (educationLevelValue && !isValueInOptions(String(educationLevelValue), educationOptions)) {
        delete cleanedJsonResponse.educationLevel;
        delete cleanedJsonResponse.education_level;
        delete cleanedJsonResponse.EducationLevel;
        delete cleanedJsonResponse.education;
        delete cleanedJsonResponse.Education;
      }
      
      // التحقق من skills object
      if (cleanedJsonResponse.skills) {
        try {
          const skills = typeof cleanedJsonResponse.skills === 'string' 
            ? JSON.parse(cleanedJsonResponse.skills) 
            : cleanedJsonResponse.skills;
          
          if (typeof skills === 'object' && skills !== null) {
            const validatedSkills: Record<string, any> = {};
            Object.entries(skills).forEach(([key, value]) => {
              if (value && isValueInOptions(String(value), skillLevels)) {
                validatedSkills[key] = value;
              }
            });
            
            if (Object.keys(validatedSkills).length > 0) {
              cleanedJsonResponse.skills = JSON.stringify(validatedSkills);
            } else {
              delete cleanedJsonResponse.skills;
            }
          }
        } catch {
          // إذا فشل التحليل، احذف الحقل
          delete cleanedJsonResponse.skills;
        }
      }
      
      // التحقق من languages_spoken object
      if (cleanedJsonResponse.languages_spoken) {
        try {
          const languages = typeof cleanedJsonResponse.languages_spoken === 'string' 
            ? JSON.parse(cleanedJsonResponse.languages_spoken) 
            : cleanedJsonResponse.languages_spoken;
          
          if (typeof languages === 'object' && languages !== null) {
            const validatedLanguages: Record<string, any> = {};
            Object.entries(languages).forEach(([key, value]) => {
              if (value && isValueInOptions(String(value), skillLevels)) {
                validatedLanguages[key] = value;
              }
            });
            
            if (Object.keys(validatedLanguages).length > 0) {
              cleanedJsonResponse.languages_spoken = JSON.stringify(validatedLanguages);
            } else {
              delete cleanedJsonResponse.languages_spoken;
            }
          }
        } catch {
          // إذا فشل التحليل، احذف الحقل
          delete cleanedJsonResponse.languages_spoken;
        }
      }
      
      const geminiData = { jsonResponse: cleanedJsonResponse };

      // أولاً: التحقق من الجنسية والتعرف عليها
      const nationalityNames = nationalities.map(n => n.Country?.toLowerCase().trim()).filter(Boolean);
      const extractedNationality = geminiData.jsonResponse.nationality || geminiData.jsonResponse.Nationality;
      
      if (extractedNationality) {
        const normalizedExtracted = String(extractedNationality).toLowerCase().trim();
        const matchedNationality = nationalities.find(n => 
          n.Country?.toLowerCase().trim() === normalizedExtracted
        );
        
        if (matchedNationality && matchedNationality.Country) {
          // تم التعرف على الجنسية - تصفية المكاتب بناءً عليها
          const nationalityCountry = matchedNationality.Country;
          setSelectedNationality(nationalityCountry);
          setInvalidNationality(null);
          
          // تصفية المكاتب للجنسية المختارة
          const filtered = offices.filter(office => 
            office.Country?.toLowerCase().trim() === nationalityCountry.toLowerCase().trim()
          );
          setFilteredOffices(filtered);
          
          // التحقق من أن المكتب المستخرج ينتمي للجنسية المختارة
          const extractedOfficeName = geminiData.jsonResponse.company_name || geminiData.jsonResponse.CompanyName || geminiData.jsonResponse.office_name || geminiData.jsonResponse.OfficeName;
          
          if (extractedOfficeName) {
            const normalizedOffice = String(extractedOfficeName).toLowerCase().trim();
            const matchedOffice = filtered.find(o => o.office?.toLowerCase().trim() === normalizedOffice);
            
            if (!matchedOffice && filtered.length > 0) {
              // المكتب غير موجود في قائمة مكاتب هذه الجنسية
              const officeField = geminiData.jsonResponse.company_name || geminiData.jsonResponse.CompanyName ? 'company_name' : 'office_name';
              setInvalidOffice({ field: officeField, value: String(extractedOfficeName) });
              // تعيين الجنسية في حقل اختيار الجنسية
              setSelectedOfficeNationality(nationalityCountry);
            } else if (!matchedOffice && filtered.length === 0) {
              // لا توجد مكاتب لهذه الجنسية
              const officeField = geminiData.jsonResponse.company_name || geminiData.jsonResponse.CompanyName ? 'company_name' : 'office_name';
              setInvalidOffice({ field: officeField, value: String(extractedOfficeName) });
              // تعيين الجنسية في حقل اختيار الجنسية
              setSelectedOfficeNationality(nationalityCountry);
            } else {
              setInvalidOffice(null);
            }
          } else {
            setInvalidOffice(null);
          }
        } else if (nationalities.length > 0) {
          // الجنسية غير موجودة في القائمة
          setInvalidNationality({ field: 'nationality', value: String(extractedNationality) });
          setSelectedNationality(null);
          setFilteredOffices(offices); // عرض جميع المكاتب
          setInvalidOffice(null);
        } else {
          setInvalidNationality(null);
          setSelectedNationality(null);
          setFilteredOffices(offices);
        }
      } else {
        // لم يتم استخراج جنسية
        setSelectedNationality(null);
        setFilteredOffices(offices);
        setInvalidNationality(null);
        
        // التحقق من المكتب بدون تصفية
        const extractedOfficeName = geminiData.jsonResponse.company_name || geminiData.jsonResponse.CompanyName || geminiData.jsonResponse.office_name || geminiData.jsonResponse.OfficeName;
        if (extractedOfficeName) {
          const officeNames = offices.map(o => o.office?.toLowerCase().trim()).filter(Boolean);
          const normalizedExtracted = String(extractedOfficeName).toLowerCase().trim();
          const isValidOffice = officeNames.some(officeName => officeName === normalizedExtracted);
          
          if (!isValidOffice && offices.length > 0) {
            const officeField = geminiData.jsonResponse.company_name || geminiData.jsonResponse.CompanyName ? 'company_name' : 'office_name';
            setInvalidOffice({ field: officeField, value: String(extractedOfficeName) });
          } else {
            setInvalidOffice(null);
          }
        } else {
          setInvalidOffice(null);
        }
      }

      // التحقق من المهنة وحذفها إذا لم تكن موجودة في القائمة
      const extractedProfession = geminiData.jsonResponse.job_title || 
                                   geminiData.jsonResponse.JobTitle || 
                                   geminiData.jsonResponse.profession || 
                                   geminiData.jsonResponse.Profession || 
                                   geminiData.jsonResponse.job || 
                                   geminiData.jsonResponse.Job;
      
      if (extractedProfession && professions.length > 0) {
        const normalizedExtracted = String(extractedProfession).toLowerCase().trim();
        const matchedProfession = professions.find(p => 
          p.name?.toLowerCase().trim() === normalizedExtracted
        );
        
        if (!matchedProfession) {
          // المهنة غير موجودة في القائمة - حذفها من البيانات
          delete geminiData.jsonResponse.job_title;
          delete geminiData.jsonResponse.JobTitle;
          delete geminiData.jsonResponse.profession;
          delete geminiData.jsonResponse.Profession;
          delete geminiData.jsonResponse.job;
          delete geminiData.jsonResponse.Job;
        }
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

  const handleOfficeNationalityChange = (nationality: string) => {
    setSelectedOfficeNationality(nationality);
    // تصفية المكاتب بناءً على الجنسية المختارة
    if (nationality) {
      const filtered = offices.filter(office => 
        office.Country?.toLowerCase().trim() === nationality.toLowerCase().trim()
      );
      setFilteredOffices(filtered);
    } else {
      setFilteredOffices(offices);
    }
  };

  const handleOfficeSelection = (selectedOffice: string) => {
    if (!processingResult || !invalidOffice) return;
    
    // التحقق من أن المكتب ينتمي للجنسية المختارة (إن وجدت)
    const currentNationality = selectedOfficeNationality || selectedNationality;
    if (currentNationality) {
      const selectedOfficeObj = offices.find(o => o.office?.toLowerCase().trim() === selectedOffice.toLowerCase().trim());
      if (selectedOfficeObj && selectedOfficeObj.Country?.toLowerCase().trim() !== currentNationality.toLowerCase().trim()) {
        setError('المكتب المختار لا ينتمي للجنسية المحددة. يرجى اختيار مكتب صحيح.');
        return;
      }
    }
    
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
    setSelectedOfficeNationality(null);
  };

  const handleNationalitySelection = (selectedNationality: string) => {
    if (!processingResult) return;
    
    const updatedData = { ...processingResult.geminiData.jsonResponse };
    
    // تحديث الحقل nationality
    updatedData.nationality = selectedNationality;
    updatedData.Nationality = selectedNationality;
    
    setProcessingResult({
      ...processingResult,
      geminiData: { jsonResponse: updatedData }
    });
    
    // تصفية المكاتب بناءً على الجنسية المختارة
    setSelectedNationality(selectedNationality);
    const filtered = offices.filter(office => 
      office.Country?.toLowerCase().trim() === selectedNationality.toLowerCase().trim()
    );
    setFilteredOffices(filtered);
    
    // التحقق من المكتب المستخرج - إذا كان موجوداً، التحقق من أنه ينتمي للجنسية الجديدة
    const extractedOfficeName = updatedData.company_name || updatedData.CompanyName || updatedData.office_name || updatedData.OfficeName;
    if (extractedOfficeName) {
      const normalizedOffice = String(extractedOfficeName).toLowerCase().trim();
      const matchedOffice = filtered.find(o => o.office?.toLowerCase().trim() === normalizedOffice);
      
      if (!matchedOffice && filtered.length > 0) {
        // المكتب لا ينتمي للجنسية المختارة
        const officeField = updatedData.company_name || updatedData.CompanyName ? 'company_name' : 'office_name';
        setInvalidOffice({ field: officeField, value: String(extractedOfficeName) });
        setSelectedOfficeNationality(selectedNationality);
      } else if (!matchedOffice && filtered.length === 0) {
        // لا توجد مكاتب لهذه الجنسية
        const officeField = updatedData.company_name || updatedData.CompanyName ? 'company_name' : 'office_name';
        setInvalidOffice({ field: officeField, value: String(extractedOfficeName) });
        setSelectedOfficeNationality(selectedNationality);
      } else {
        setInvalidOffice(null);
      }
    }
    
    setInvalidNationality(null);
  };

  const startEditingField = (key: string, value: any) => {
    // معالجة القيم الفارغة أو null أو undefined
    let baseVal = '';
    if (value !== null && value !== undefined) {
      const strVal = String(value);
      // إذا كانت القيمة 'null' أو 'undefined' أو فارغة، نتركها فارغة
      if (strVal !== 'null' && strVal !== 'undefined' && strVal.trim() !== '') {
        baseVal = strVal;
        
        // معالجة خاصة للحقول التي تحتوي على "Date" - تحويل إلى صيغة YYYY-MM-DD
        if (key.toLowerCase().includes('date') || key.toLowerCase().includes('birth') || 
            key.toLowerCase().includes('start') || key.toLowerCase().includes('end') || 
            key.toLowerCase().includes('expiration') || key.toLowerCase().includes('expiry')) {
          try {
            // محاولة تحويل التاريخ إلى صيغة YYYY-MM-DD
            const date = new Date(baseVal);
            if (!isNaN(date.getTime())) {
              // تحويل إلى صيغة YYYY-MM-DD
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              baseVal = `${year}-${month}-${day}`;
            } else if (baseVal.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // إذا كانت بالفعل في صيغة YYYY-MM-DD، اتركها كما هي
              baseVal = baseVal;
            }
          } catch (e) {
            // في حالة الخطأ، اترك القيمة كما هي
            console.warn('Error parsing date:', e);
          }
        }
      }
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

  const saveOfficeFieldDirectly = (fieldKey: string, value: string) => {
    if (!processingResult || !value) return;
    
    // التحقق من المكتب
    const normalizedValue = String(value).toLowerCase().trim();
    
    // إذا كانت هناك جنسية مختارة، تحقق من أن المكتب ينتمي لها
    if (selectedNationality) {
      const filtered = offices.filter(office => 
        office.Country?.toLowerCase().trim() === selectedNationality.toLowerCase().trim()
      );
      const matchedOffice = filtered.find(o => o.office?.toLowerCase().trim() === normalizedValue);
      
      if (!matchedOffice && filtered.length > 0) {
        setError('المكتب المُدخل لا ينتمي للجنسية المحددة. يرجى اختيار مكتب صحيح.');
        return;
      } else if (!matchedOffice && filtered.length === 0) {
        setError('لا توجد مكاتب للجنسية المحددة.');
        return;
      }
    } else {
      // لا توجد جنسية مختارة - التحقق من وجود المكتب في القائمة العامة
      const officeNames = offices.map(o => o.office?.toLowerCase().trim()).filter(Boolean);
      const isValidOffice = officeNames.some(officeName => officeName === normalizedValue);
      
      if (!isValidOffice && offices.length > 0) {
        setError('المكتب المُدخل غير موجود في قائمة المكاتب. يرجى اختيار مكتب صحيح.');
        return;
      }
    }
    
    // حفظ القيمة
    setProcessingResult((prev) => {
      if (!prev) return prev;
      const updatedJson = { ...prev.geminiData.jsonResponse };
      
      // تحديث جميع حقول المكتب
      if (fieldKey === 'office_name' || fieldKey === 'OfficeName') {
        updatedJson.office_name = value;
        updatedJson.OfficeName = value;
        if (updatedJson.company_name || updatedJson.CompanyName) {
          updatedJson.company_name = value;
          updatedJson.CompanyName = value;
        }
      } else if (fieldKey === 'company_name' || fieldKey === 'CompanyName') {
        updatedJson.company_name = value;
        updatedJson.CompanyName = value;
        updatedJson.office_name = value;
        updatedJson.OfficeName = value;
      }
      
      return {
        ...prev,
        geminiData: {
          ...prev.geminiData,
          jsonResponse: updatedJson,
        },
      };
    });
    setInvalidOffice(null);
  };

  // دالة معالجة تغيير الخبرة (تلقائية السنوات)
  const handleExperienceChange = (selectedExperience: string) => {
    if (!processingResult) return;
    
    let autoYears = "";
    
    switch (selectedExperience) {
      case "Novice | مدربة بدون خبرة":
        autoYears = "مدربة-Training";
        break;
      case "Intermediate | مدربة بخبرة متوسطة":
        autoYears = "1-2 Years - سنوات";
        break;
      case "Well-experienced | خبرة جيدة":
        autoYears = "3-4 Years - سنوات";
        break;
      case "Expert | خبرة ممتازة":
        autoYears = "5 and More - وأكثر";
        break;
      default:
        autoYears = "";
    }
    
    const updatedData = { ...processingResult.geminiData.jsonResponse };
    
    // تحديث experienceField
    updatedData.experienceField = selectedExperience;
    updatedData.experience_field = selectedExperience;
    updatedData.ExperienceField = selectedExperience;
    updatedData.experience = selectedExperience;
    updatedData.Experience = selectedExperience;
    
    // تحديث experienceYears تلقائياً
    if (autoYears) {
      updatedData.experienceYears = autoYears;
      updatedData.experience_years = autoYears;
      updatedData.ExperienceYears = autoYears;
      updatedData.years_of_experience = autoYears;
    }
    
    setProcessingResult({
      ...processingResult,
      geminiData: { jsonResponse: updatedData }
    });
    
    setEditingField(null);
  };

  const saveEditingField = () => {
    if (!editingField || !processingResult) return;

    const { key, value } = editingField;
    
    // التحقق من جواز السفر - يقبل أرقام وحروف فقط
    if ((key === 'passport_number' || key === 'passport' || key === 'PassportNumber' || key === 'Passportnumber' || key === 'passportNumber' || key === 'passportnumber') && value) {
      const passportValue = String(value).trim();
      // التحقق من أن القيمة تحتوي على أرقام وحروف فقط (لا رموز خاصة)
      if (!/^[a-zA-Z0-9]+$/.test(passportValue)) {
        setError('رقم جواز السفر يجب أن يحتوي على أرقام وحروف فقط (بدون رموز خاصة)');
        return;
      }
    }
    
    // التحقق من الراتب - يقبل أرقام فقط وليس أكثر من 5 خانات
    if ((key === 'salary' || key === 'Salary') && value) {
      const salaryValue = String(value).trim();
      // التحقق من أن القيمة أرقام فقط
      if (!/^\d+$/.test(salaryValue)) {
        setError('الراتب يجب أن يحتوي على أرقام فقط');
        return;
      }
      // التحقق من أن الراتب ليس أكثر من 5 خانات
      if (salaryValue.length > 5) {
        setError('الراتب يجب ألا يتجاوز 5 خانات');
        return;
      }
    }
    
    // التحقق من المهنة إذا كان الحقل المُعدل هو job_title أو profession
    if ((key === 'job_title' || key === 'profession' || key === 'job' || key === 'Job') && value) {
      const normalizedValue = String(value).toLowerCase().trim();
      const matchedProfession = professions.find(p => 
        p.name?.toLowerCase().trim() === normalizedValue
      );
      
      if (!matchedProfession && professions.length > 0) {
        setError('المهنة المُدخلة غير موجودة في قائمة المهن. يرجى اختيار مهنة صحيحة من القائمة.');
        setEditingField(null);
        return;
      }
    }

    // التحقق من الجنسية أولاً إذا كان الحقل المُعدل هو nationality
    if ((key === 'nationality' || key === 'Nationality') && value) {
      const nationalityNames = nationalities.map(n => n.Country?.toLowerCase().trim()).filter(Boolean);
      const normalizedValue = String(value).toLowerCase().trim();
      const matchedNationality = nationalities.find(n => 
        n.Country?.toLowerCase().trim() === normalizedValue
      );
      
      if (matchedNationality && matchedNationality.Country) {
        // تم التعرف على الجنسية - تصفية المكاتب بناءً عليها
        const nationalityCountry = matchedNationality.Country;
        setSelectedNationality(nationalityCountry);
        setInvalidNationality(null);
        
        // تصفية المكاتب للجنسية المختارة
        const filtered = offices.filter(office => 
          office.Country?.toLowerCase().trim() === nationalityCountry.toLowerCase().trim()
        );
        setFilteredOffices(filtered);
        
        // التحقق من المكتب الحالي - إذا كان موجوداً، التحقق من أنه ينتمي للجنسية الجديدة
        const currentOffice = processingResult.geminiData.jsonResponse.company_name || 
                             processingResult.geminiData.jsonResponse.CompanyName || 
                             processingResult.geminiData.jsonResponse.office_name || 
                             processingResult.geminiData.jsonResponse.OfficeName;
        if (currentOffice) {
          const normalizedOffice = String(currentOffice).toLowerCase().trim();
          const matchedOffice = filtered.find(o => o.office?.toLowerCase().trim() === normalizedOffice);
          
          if (!matchedOffice && filtered.length > 0) {
            // المكتب لا ينتمي للجنسية الجديدة
            const officeField = processingResult.geminiData.jsonResponse.company_name || processingResult.geminiData.jsonResponse.CompanyName ? 'company_name' : 'office_name';
            setInvalidOffice({ field: officeField, value: String(currentOffice) });
            setSelectedOfficeNationality(nationalityCountry);
          } else if (!matchedOffice && filtered.length === 0) {
            // لا توجد مكاتب لهذه الجنسية
            const officeField = processingResult.geminiData.jsonResponse.company_name || processingResult.geminiData.jsonResponse.CompanyName ? 'company_name' : 'office_name';
            setInvalidOffice({ field: officeField, value: String(currentOffice) });
            setSelectedOfficeNationality(nationalityCountry);
          } else {
            setInvalidOffice(null);
          }
        }
      } else if (nationalities.length > 0) {
        setError('الجنسية المُدخلة غير موجودة في قائمة الجنسيات. يرجى اختيار جنسية صحيحة.');
        setInvalidNationality({ field: 'nationality', value: String(value) });
        setEditingField(null);
        return;
      } else {
        setInvalidNationality(null);
      }
    }

    // التحقق من المكتب إذا كان الحقل المُعدل هو office_name أو company_name
    if ((key === 'office_name' || key === 'OfficeName' || key === 'company_name' || key === 'CompanyName') && value) {
      const normalizedValue = String(value).toLowerCase().trim();
      
      // إذا كانت هناك جنسية مختارة، تحقق من أن المكتب ينتمي لها
      if (selectedNationality) {
        const filtered = offices.filter(office => 
          office.Country?.toLowerCase().trim() === selectedNationality.toLowerCase().trim()
        );
        const matchedOffice = filtered.find(o => o.office?.toLowerCase().trim() === normalizedValue);
        
        if (!matchedOffice && filtered.length > 0) {
          setError('المكتب المُدخل لا ينتمي للجنسية المحددة. يرجى اختيار مكتب صحيح.');
          const officeField = (key === 'office_name' || key === 'OfficeName') ? 'office_name' : 'company_name';
          setInvalidOffice({ field: officeField, value: String(value) });
          setSelectedOfficeNationality(selectedNationality);
          setEditingField(null);
          return;
        } else if (!matchedOffice && filtered.length === 0) {
          setError('لا توجد مكاتب للجنسية المحددة.');
          const officeField = (key === 'office_name' || key === 'OfficeName') ? 'office_name' : 'company_name';
          setInvalidOffice({ field: officeField, value: String(value) });
          setSelectedOfficeNationality(selectedNationality);
          setEditingField(null);
          return;
        } else {
          setInvalidOffice(null);
        }
      } else {
        // لا توجد جنسية مختارة - التحقق من وجود المكتب في القائمة العامة
        const officeNames = offices.map(o => o.office?.toLowerCase().trim()).filter(Boolean);
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
      } else if (key === 'passport_number' || key === 'passport' || key === 'PassportNumber' || key === 'Passportnumber' || key === 'passportNumber' || key === 'passportnumber') {
        // إذا تم تعديل جواز السفر، قم بتحديث جميع الاختلافات
        updatedJson.passport = value;
        updatedJson.passport_number = value;
        updatedJson.PassportNumber = value;
        updatedJson.Passportnumber = value;
        updatedJson.passportNumber = value;
        updatedJson.passportnumber = value;
      } else if (key === 'date_of_birth' || key === 'birthDate' || key === 'BirthDate' || key === 'dateofbirth' || key === 'DateOfBirth' || key === 'birth_date' || key === 'Birth_Date' || key === 'age') {
        // إذا تم تعديل تاريخ الميلاد، قم بتحديث جميع الاختلافات
        updatedJson.date_of_birth = value;
        updatedJson.birthDate = value;
        updatedJson.BirthDate = value;
        updatedJson.dateofbirth = value;
        updatedJson.DateOfBirth = value;
        updatedJson.birth_date = value;
        updatedJson.Birth_Date = value;
        updatedJson.age = value;
      } else if (key === 'marital_status' || key === 'MaritalStatus' || key === 'maritalStatus' || key === 'maritalstatus') {
        // إذا تم تعديل الحالة الاجتماعية، قم بتحديث جميع الاختلافات
        updatedJson.marital_status = value;
        updatedJson.MaritalStatus = value;
        updatedJson.maritalStatus = value;
        updatedJson.maritalstatus = value;
      } else if (key.startsWith('skill_')) {
        // تحديث مهارة محددة داخل كائن skills
        const skillName = key.replace('skill_', '').toUpperCase();
        try {
          const currentSkills = typeof updatedJson.skills === 'string' 
            ? JSON.parse(updatedJson.skills) 
            : (updatedJson.skills || {});
          currentSkills[skillName] = value;
          updatedJson.skills = JSON.stringify(currentSkills);
        } catch {
          updatedJson.skills = JSON.stringify({ [skillName]: value });
        }
      } else if (key.startsWith('lang_')) {
        // تحديث لغة محددة داخل كائن languages_spoken
        const langName = key.replace('lang_', '');
        const capitalizedLangName = langName.charAt(0).toUpperCase() + langName.slice(1);
        try {
          const currentLanguages = typeof updatedJson.languages_spoken === 'string' 
            ? JSON.parse(updatedJson.languages_spoken) 
            : (updatedJson.languages_spoken || {});
          currentLanguages[capitalizedLangName] = value;
          updatedJson.languages_spoken = JSON.stringify(currentLanguages);
        } catch {
          updatedJson.languages_spoken = JSON.stringify({ [capitalizedLangName]: value });
        }
      } else if (key === 'job_title' || key === 'JobTitle' || key === 'jobTitle' || 
                 key === 'profession' || key === 'Profession' || 
                 key === 'job' || key === 'Job') {
        // إذا تم تعديل المهنة، قم بتحديث جميع الاختلافات
        updatedJson.job_title = value;
        updatedJson.JobTitle = value;
        updatedJson.jobTitle = value;
        updatedJson.profession = value;
        updatedJson.Profession = value;
        updatedJson.job = value;
        updatedJson.Job = value;
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
    // التحقق من وجود البيانات
    if (!processingResult || !processingResult.geminiData) {
      setError('No data to save');
      return;
    }

    if (selectedImages.length === 0) {
      setError('Please select at least one image to save');
      return;
    }

    // --- 1. التحقق من الجنسية ---
    // نستخدم Optional Chaining (?.) لتجنب الأخطاء إذا كانت jsonResponse غير موجودة
    const jsonResponse = processingResult.geminiData.jsonResponse || {};
    const extractedNationality = jsonResponse.nationality || jsonResponse.Nationality;
    
    let validNationality: string | null = null;
    if (extractedNationality && nationalities.length > 0) {
      const normalizedExtracted = String(extractedNationality).toLowerCase().trim();
      const matchedNationality = nationalities.find(n => 
        n.Country?.toLowerCase().trim() === normalizedExtracted
      );
      
      if (matchedNationality && matchedNationality.Country) {
        validNationality = matchedNationality.Country;
      } else {
        setError('يجب اختيار جنسية صحيحة من قائمة الجنسيات قبل الحفظ');
        setInvalidNationality({ field: 'nationality', value: String(extractedNationality) });
        return;
      }
    }

    // --- 2. التحقق من المكتب ---
    const extractedOfficeName = jsonResponse.company_name || 
                                jsonResponse.CompanyName ||
                                jsonResponse.office_name || 
                                jsonResponse.OfficeName;
    
    if (extractedOfficeName) {
      const normalizedExtracted = String(extractedOfficeName).toLowerCase().trim();
      
      if (validNationality) {
        const filtered = offices.filter(office => 
          office.Country?.toLowerCase().trim() === validNationality!.toLowerCase().trim()
        );
        const matchedOffice = filtered.find(o => o.office?.toLowerCase().trim() === normalizedExtracted);
        
        if (!matchedOffice) {
          setError('المكتب المختار لا ينتمي للجنسية المحددة أو غير موجود.');
          const officeField = jsonResponse.company_name ? 'company_name' : 'office_name';
          setInvalidOffice({ field: officeField, value: String(extractedOfficeName) });
          return;
        }
      } else {
        const officeNames = offices.map(o => o.office?.toLowerCase().trim()).filter(Boolean);
        const isValidOffice = officeNames.some(officeName => officeName === normalizedExtracted);
        
        if (!isValidOffice && offices.length > 0) {
          setError('يجب اختيار مكتب صحيح من قائمة المكاتب قبل الحفظ');
          const officeField = jsonResponse.company_name ? 'company_name' : 'office_name';
          setInvalidOffice({ field: officeField, value: String(extractedOfficeName) });
          return;
        }
      }
    }

    // --- 3. التحقق من المهنة ---
    const extractedProfession = jsonResponse.job_title || 
                                jsonResponse.JobTitle || 
                                jsonResponse.profession || 
                                jsonResponse.Profession || 
                                jsonResponse.job || 
                                jsonResponse.Job;
    
    if (extractedProfession && professions.length > 0) {
      const normalizedExtracted = String(extractedProfession).toLowerCase().trim();
      const matchedProfession = professions.find(p => 
        p.name?.toLowerCase().trim() === normalizedExtracted
      );
      
      if (!matchedProfession) {
        setError('المهنة المستخرجة غير موجودة في قائمة المهن. يرجى اختيار مهنة صحيحة من القائمة قبل الحفظ.');
        return;
      }
    } else if (!extractedProfession && professions.length > 0) {
      // المهنة فارغة - السماح بالحفظ (المهنة اختيارية)
    }

    // --- 4. التحقق من جميع الحقول المطلوبة (Required Fields) ---
    const checkRequiredField = (value: any, fieldName: string, displayName: string): string | null => {
      if (value === null || value === undefined || value === '' || 
          (typeof value === 'string' && value.trim() === '') ||
          value === 'null' || value === 'undefined') {
        return displayName;
      }
      return null;
    };

    // دالة مساعدة للبحث عن قيمة في عدة مفاتيح (تشمل البحث في skills و languages_spoken)
    const findFieldValue = (keys: string[], data: any): any => {
      // البحث في البيانات الأساسية
      for (const key of keys) {
        const value = data[key];
        if (value !== undefined && value !== null && value !== '' && 
            value !== 'null' && value !== 'undefined' &&
            (typeof value !== 'string' || value.trim() !== '')) {
          return value;
        }
      }
      
      // البحث في كائن skills إذا كان موجوداً
      if (data.skills) {
        let skillsObj = data.skills;
        if (typeof skillsObj === 'string') {
          try { skillsObj = JSON.parse(skillsObj); } catch { skillsObj = {}; }
        }
        if (typeof skillsObj === 'object' && skillsObj !== null) {
          for (const key of keys) {
            const value = skillsObj[key];
            if (value !== undefined && value !== null && value !== '' && 
                value !== 'null' && value !== 'undefined' &&
                (typeof value !== 'string' || value.trim() !== '')) {
              return value;
            }
          }
        }
      }
      
      // البحث في كائن languages_spoken إذا كان موجوداً (لللغات)
      if (data.languages_spoken) {
        let langsObj = data.languages_spoken;
        if (typeof langsObj === 'string') {
          try { langsObj = JSON.parse(langsObj); } catch { langsObj = {}; }
        }
        if (typeof langsObj === 'object' && langsObj !== null) {
          for (const key of keys) {
            const value = langsObj[key];
            if (value !== undefined && value !== null && value !== '' && 
                value !== 'null' && value !== 'undefined' &&
                (typeof value !== 'string' || value.trim() !== '')) {
              return value;
            }
          }
        }
      }
      
      return null;
    };

    const missingFields: string[] = [];

    // التحقق من البيانات الأساسية
    const name = findFieldValue(['Name', 'name', 'full_name', 'FullName'], jsonResponse);
    if (checkRequiredField(name, 'name', 'الاسم')) missingFields.push('الاسم');

    const age = findFieldValue(['Age', 'age'], jsonResponse);
    // if (checkRequiredField(age, 'age', 'العمر')) missingFields.push('العمر');
// const 
    const religion = findFieldValue(['Religion', 'religion'], jsonResponse);
    if (checkRequiredField(religion, 'religion', 'الدين')) missingFields.push('الدين');

    const maritalStatus = findFieldValue(['MaritalStatus', 'marital_status', 'maritalStatus', 'maritalstatus'], jsonResponse);
    if (checkRequiredField(maritalStatus, 'maritalstatus', 'الحالة الاجتماعية')) missingFields.push('الحالة الاجتماعية');

    const birthDate = findFieldValue(['BirthDate', 'birthDate', 'birth_date', 'date_of_birth', 'dateofbirth'], jsonResponse);
    if (checkRequiredField(birthDate, 'dateofbirth', 'تاريخ الميلاد')) missingFields.push('تاريخ الميلاد');

    // التحقق من الجنسية
    if (!validNationality) {
      missingFields.push('الجنسية');
    }

    // التحقق من المكتب
    if (!extractedOfficeName || extractedOfficeName === 'null' || extractedOfficeName === 'undefined' || 
        (typeof extractedOfficeName === 'string' && extractedOfficeName.trim() === '')) {
      missingFields.push('المكتب');
    }

    // التحقق من المهنة
    if (!extractedProfession || extractedProfession === 'null' || extractedProfession === 'undefined' || 
        (typeof extractedProfession === 'string' && extractedProfession.trim() === '')) {
      missingFields.push('المهنة');
    }

    // التحقق من بيانات الجواز
    const passportNumber = findFieldValue(['PassportNumber', 'passport_number', 'passportNumber', 'passport', 'Passport', 'PASSPORT_NUMBER', 'Passportnumber'], jsonResponse);
    if (checkRequiredField(passportNumber, 'Passportnumber', 'رقم الجواز')) missingFields.push('رقم الجواز');

    const passportStart = findFieldValue(['PassportStartDate', 'passportStartDate', 'PassportStart', 'passportStart', 'passport_issue_date', 'passport_issue', 'passport_start', 'issue_date', 'issueDate', 'IssueDate'], jsonResponse);
    if (checkRequiredField(passportStart, 'PassportStart', 'تاريخ إصدار الجواز')) missingFields.push('تاريخ إصدار الجواز');

    const passportEnd = findFieldValue(['PassportEndDate', 'passportEndDate', 'PassportEnd', 'passportEnd', 'passport_expiration', 'passport_expiry', 'passport_end', 'expiration_date', 'expirationDate', 'ExpirationDate', 'expiry_date', 'expiryDate', 'ExpiryDate'], jsonResponse);
    if (checkRequiredField(passportEnd, 'PassportEnd', 'تاريخ انتهاء الجواز')) missingFields.push('تاريخ انتهاء الجواز');

    // التحقق من التعليم والخبرة
    const education = findFieldValue(['Education', 'education', 'EducationLevel', 'educationLevel', 'education_level'], jsonResponse);
    if (checkRequiredField(education, 'Education', 'التعليم')) missingFields.push('التعليم');

    const experience = findFieldValue(['Experience', 'experience', 'ExperienceField', 'experienceField', 'experience_field'], jsonResponse);
    if (checkRequiredField(experience, 'Experience', 'الخبرة')) missingFields.push('الخبرة');

    const experienceYears = findFieldValue(['ExperienceYears', 'experienceYears', 'experience_years', 'years_of_experience'], jsonResponse);
    if (checkRequiredField(experienceYears, 'ExperienceYears', 'سنوات الخبرة')) missingFields.push('سنوات الخبرة');

    // التحقق من رقم الهاتف
    const phone = findFieldValue(['phone', 'Phone', 'mobile', 'Mobile', 'phoneNumber', 'phone_number'], jsonResponse);
    if (checkRequiredField(phone, 'phone', 'رقم الهاتف')) missingFields.push('رقم الهاتف');

    // التحقق من الراتب
    const salary = findFieldValue(['Salary', 'salary'], jsonResponse);
    if (checkRequiredField(salary, 'Salary', 'الراتب')) missingFields.push('الراتب');

    // التحقق من الطول والوزن
    const weight = findFieldValue(['Weight', 'weight'], jsonResponse);
    if (checkRequiredField(weight, 'weight', 'الوزن')) missingFields.push('الوزن');

    const height = findFieldValue(['Height', 'height'], jsonResponse);
    if (checkRequiredField(height, 'height', 'الطول')) missingFields.push('الطول');

    // التحقق من عدد الأطفال
    const children = findFieldValue(['children', 'Children', 'children_count', 'ChildrenCount', 'childrenCount', 'childrencount'], jsonResponse);
    if (checkRequiredField(children, 'children', 'عدد الأطفال')) missingFields.push('عدد الأطفال');

    // التحقق من اللغات
    const englishLevel = findFieldValue(['EnglishLanguageLevel', 'English', 'english', 'englishLevel', 'english_level'], jsonResponse);
    if (checkRequiredField(englishLevel, 'EnglishLanguageLevel', 'مستوى اللغة الإنجليزية')) missingFields.push('مستوى اللغة الإنجليزية');

    const arabicLevel = findFieldValue(['ArabicLanguageLeveL', 'ArabicLanguageLevel', 'Arabic', 'arabic', 'arabicLevel', 'arabic_level'], jsonResponse);
    if (checkRequiredField(arabicLevel, 'ArabicLanguageLeveL', 'مستوى اللغة العربية')) missingFields.push('مستوى اللغة العربية');

    // التحقق من المهارات
    const washingLevel = findFieldValue(['washingLevel', 'WashingLevel', 'WASHING', 'washing', 'Washing'], jsonResponse);
    if (checkRequiredField(washingLevel, 'washingLevel', 'مستوى الغسيل')) missingFields.push('مستوى الغسيل');

    const cookingLevel = findFieldValue(['cookingLevel', 'CookingLevel', 'COOKING', 'cooking', 'Cooking'], jsonResponse);
    if (checkRequiredField(cookingLevel, 'cookingLevel', 'مستوى الطبخ')) missingFields.push('مستوى الطبخ');

    const childcareLevel = findFieldValue(['childcareLevel', 'ChildcareLevel', 'babysitting', 'BABYSITTING', 'babysetting', 'BabySitter', 'childcare'], jsonResponse);
    if (checkRequiredField(childcareLevel, 'childcareLevel', 'مستوى رعاية الأطفال')) missingFields.push('مستوى رعاية الأطفال');

    const cleaningLevel = findFieldValue(['cleaningLevel', 'CleaningLevel', 'CLEANING', 'cleaning', 'Cleaning'], jsonResponse);
    if (checkRequiredField(cleaningLevel, 'cleaningLevel', 'مستوى التنظيف')) missingFields.push('مستوى التنظيف');

    const ironingLevel = findFieldValue(['ironingLevel', 'IroningLevel', 'IRONING', 'ironing', 'Ironing'], jsonResponse);
    if (checkRequiredField(ironingLevel, 'ironingLevel', 'مستوى الكي')) missingFields.push('مستوى الكي');

    const sewingLevel = findFieldValue(['sewingLevel', 'SewingLevel', 'SEWING', 'sewing', 'Sewing'], jsonResponse);
    if (checkRequiredField(sewingLevel, 'sewingLevel', 'مستوى الخياطة')) missingFields.push('مستوى الخياطة');

    const elderlycareLevel = findFieldValue(['elderlycareLevel', 'ElderlycareLevel', 'ELDERLYCARE', 'elderlycare', 'ElderlyCare', 'elderly_care'], jsonResponse);
    if (checkRequiredField(elderlycareLevel, 'elderlycareLevel', 'مستوى رعاية كبار السن')) missingFields.push('مستوى رعاية كبار السن');

    const babySitterLevel = findFieldValue(['BabySitterLevel', 'babySitterLevel', 'babysitterLevel', 'BABYSITTERLEVEL', 'baby_sitter_level', 'Baby_Sitter_Level'], jsonResponse);
    if (checkRequiredField(babySitterLevel, 'BabySitterLevel', 'مستوى رعاية الرضع')) missingFields.push('مستوى رعاية الرضع');

    // التحقق من الصور
    if (selectedImages.length === 0 && uploadedImageUrls.length === 0) {
      missingFields.push('الصور');
    }

    // إذا كانت هناك حقول مفقودة، إيقاف الحفظ وعرض رسالة خطأ
    if (missingFields.length > 0) {
      setError(`لا يمكن الحفظ! الحقول التالية مطلوبة ولكنها فارغة:\n${missingFields.join('\n')}`);
      showToast(`الحقول المطلوبة فارغة: ${missingFields.join('، ')}`, 'error');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const sessionId = `pdf-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // ✨✨ الإصلاح الجذري: دالة تحليل آمنة جداً ✨✨
      // هذه الدالة تضمن إرجاع كائن {} دائماً حتى لو كان الدخل null أو "null" أو undefined
      const safeParseJson = (field: any): Record<string, any> => {
        if (!field) return {}; // undefined, null, "", 0
        
        let parsed = field;
        if (typeof field === 'string') {
          try {
            parsed = JSON.parse(field);
          } catch {
            return {}; // إذا فشل التحليل نرجع كائن فارغ
          }
        }
        
        // أهم خطوة: التأكد أن النتيجة كائن حقيقي وليست null (لأن JSON.parse("null") تعطي null)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
        
        return {}; // في أي حالة أخرى نرجع كائن فارغ لتجنب انهيار التطبيق
      };

      const rawJson = jsonResponse; // تم التأكد منه في الأعلى
      const flattenedData: any = { ...rawJson };

      const skillsObj = safeParseJson(rawJson.skills);
      const langsObj = safeParseJson(rawJson.languages_spoken);

      console.log("🔍 Skills Parsed Safely:", skillsObj);

      // 1. توحيد المفاتيح (Normalization)
      const normalizedSkills: Record<string, string> = {};
      Object.keys(skillsObj).forEach(key => {
        if (key) normalizedSkills[key.toLowerCase().trim()] = String(skillsObj[key]);
      });

      const normalizedLangs: Record<string, string> = {};
      Object.keys(langsObj).forEach(key => {
        if (key) normalizedLangs[key.toLowerCase().trim()] = String(langsObj[key]);
      });

      // دالة البحث
      const getSkill = (keys: string[]) => {
        for (const key of keys) {
          if (normalizedSkills[key]) return normalizedSkills[key];
        }
        return "";
      };

      const getLang = (keys: string[]) => {
        for (const key of keys) {
          if (normalizedLangs[key]) return normalizedLangs[key];
        }
        return "";
      };

      // 2. تعبئة البيانات (الأولوية للمهارة المستخرجة من الكائن skills)
      // دالة مساعدة للحصول على المهارة من جميع الاختلافات الممكنة
      const getSkillValue = (skillKeys: string[], data: any): string => {
        // أولاً: البحث في كائن skills
        const fromSkills = getSkill(skillKeys);
        if (fromSkills) return fromSkills;
        
        // ثانياً: البحث في البيانات بجميع الاختلافات الممكنة
        for (const key of skillKeys) {
          const variations = [
            key,
            key.charAt(0).toUpperCase() + key.slice(1),
            key.toUpperCase(),
            key.toLowerCase(),
            key + 'Level',
            key.charAt(0).toUpperCase() + key.slice(1) + 'Level',
            key.toUpperCase() + 'LEVEL',
          ];
          
          for (const variation of variations) {
            if (data[variation] && data[variation] !== 'null' && data[variation] !== 'undefined' && String(data[variation]).trim() !== '') {
              return String(data[variation]);
            }
          }
        }
        
        return "";
      };

      // الغسيل
      const washing = getSkillValue(['washing', 'washinglevel'], flattenedData);
      if (washing) {
        flattenedData.washingLevel = washing;
        flattenedData.WashingLevel = washing;
      }

      // الطبخ
      const cooking = getSkillValue(['cooking', 'cookinglevel'], flattenedData);
      if (cooking) {
        flattenedData.cookingLevel = cooking;
        flattenedData.CookingLevel = cooking;
      }

      // التنظيف
      const cleaning = getSkillValue(['cleaning', 'cleaninglevel'], flattenedData);
      if (cleaning) {
        flattenedData.cleaningLevel = cleaning;
        flattenedData.CleaningLevel = cleaning;
      }

      // الكوي
      const ironing = getSkillValue(['ironing', 'ironinglevel'], flattenedData);
      if (ironing) {
        flattenedData.ironingLevel = ironing;
        flattenedData.IroningLevel = ironing;
      }

      // الخياطة
      const sewing = getSkillValue(['sewing', 'sewinglevel'], flattenedData);
      if (sewing) {
        flattenedData.sewingLevel = sewing;
        flattenedData.SewingLevel = sewing;
      }

      // رعاية الأطفال
      const childcare = getSkillValue(['babysitter', 'babysitting', 'childcare', 'child_care', 'childcarelevel'], flattenedData);
      if (childcare) {
        flattenedData.childcareLevel = childcare;
        flattenedData.ChildcareLevel = childcare;
      }

      // رعاية كبار السن
      const elderly = getSkillValue(['elderly_care', 'elderlycare', 'elderly', 'elderlycarelevel'], flattenedData);
      if (elderly) {
        flattenedData.elderlycareLevel = elderly;
        flattenedData.ElderlycareLevel = elderly;
      }


      // العناية بالرضع (BabySitterLevel) - البحث المباشر لأن الاسم يحتوي على S كبير في المنتصف
      let babySitter = getSkillValue(['babysitter', 'babysitterlevel'], flattenedData);
      // البحث المباشر عن BabySitterLevel بجميع الاختلافات
      if (!babySitter || babySitter === 'null' || babySitter === 'undefined') {
        const babySitterKeys = ['BabySitterLevel', 'babySitterLevel', 'babysitterLevel', 'BABYSITTERLEVEL', 'baby_sitter_level', 'Baby_Sitter_Level'];
        for (const key of babySitterKeys) {
          const value = flattenedData[key];
          if (value && value !== 'null' && value !== 'undefined' && String(value).trim() !== '') {
            babySitter = String(value);
            console.log(`🔍 Found BabySitterLevel as ${key}:`, babySitter);
            break;
          }
        }
      }
      if (babySitter && babySitter !== 'null' && babySitter !== 'undefined' && babySitter.trim() !== '') {
        flattenedData.babySitterLevel = babySitter;
        flattenedData.BabySitterLevel = babySitter;
        flattenedData.baby_sitter_level = babySitter;
        console.log("✅ BabySitterLevel saved:", babySitter);
      } else {
        console.log("⚠️ BabySitterLevel not found or is null");
      }

      // اللغات - دالة مساعدة للحصول على اللغة من جميع الاختلافات الممكنة
      const getLangValue = (langKeys: string[], data: any): string => {
        // أولاً: البحث في كائن languages_spoken
        const fromLangs = getLang(langKeys);
        if (fromLangs && fromLangs !== 'null' && fromLangs !== 'undefined') return fromLangs;
        
        // ثانياً: البحث في البيانات بجميع الاختلافات الممكنة
        const variations = [
          'EnglishLanguageLevel', 'englishLanguageLevel', 'englishLanguageLevel', 'englishlanguagelevel',
          'ArabicLanguageLeveL', 'arabicLanguageLevel', 'arabicLanguageLevel', 'arabiclanguagelevel',
          'ArabicLevel', 'arabicLevel', 'arabiclevel',
          'EnglishLevel', 'englishLevel', 'englishlevel',
        ];
        
        for (const variation of variations) {
          const value = data[variation];
          if (value && value !== 'null' && value !== 'undefined' && String(value).trim() !== '') {
            return String(value);
          }
        }
        
        return "";
      };

      const english = getLangValue(['english', 'englishlanguagelevel'], flattenedData);
      if (english) {
        flattenedData.EnglishLanguageLevel = english;
        flattenedData.englishLanguageLevel = english;
        flattenedData.EnglishLevel = english;
      }

      const arabic = getLangValue(['arabic', 'arabiclanguagelevel'], flattenedData);
      if (arabic) {
        flattenedData.ArabicLanguageLeveL = arabic;
        flattenedData.arabicLanguageLevel = arabic;
        flattenedData.ArabicLevel = arabic;
      }

      // 🔍 التأكد من إرسال بيانات الجواز بشكل صحيح
      // نسخ بيانات الجواز بجميع الاختلافات الممكنة
      if (flattenedData.passport || flattenedData.PassportNumber || flattenedData.passport_number || flattenedData.Passportnumber || flattenedData.passportNumber || flattenedData.passportnumber) {
        const passportValue = flattenedData.passport || flattenedData.PassportNumber || flattenedData.passport_number || flattenedData.Passportnumber || flattenedData.passportNumber || flattenedData.passportnumber;
        flattenedData.passport = passportValue;
        flattenedData.PassportNumber = passportValue;
        flattenedData.passport_number = passportValue;
        flattenedData.passportNumber = passportValue;
        flattenedData.Passportnumber = passportValue;
        flattenedData.passportnumber = passportValue;
      }

      if (flattenedData.passportStart || flattenedData.passportStartDate || flattenedData.passport_issue_date || flattenedData.PassportStartDate) {
        const passportStartValue = flattenedData.passportStart || flattenedData.passportStartDate || flattenedData.passport_issue_date || flattenedData.PassportStartDate;
        flattenedData.passportStart = passportStartValue;
        flattenedData.passportStartDate = passportStartValue;
        flattenedData.passport_issue_date = passportStartValue;
        flattenedData.PassportStartDate = passportStartValue;
        flattenedData.passport_start = passportStartValue;
      }

      if (flattenedData.passportEnd || flattenedData.passportEndDate || flattenedData.passport_expiration || flattenedData.PassportEndDate) {
        const passportEndValue = flattenedData.passportEnd || flattenedData.passportEndDate || flattenedData.passport_expiration || flattenedData.PassportEndDate;
        flattenedData.passportEnd = passportEndValue;
        flattenedData.passportEndDate = passportEndValue;
        flattenedData.passport_expiration = passportEndValue;
        flattenedData.PassportEndDate = passportEndValue;
        flattenedData.passport_end = passportEndValue;
        flattenedData.passport_expiry = passportEndValue;
      }

      // 🔍 التأكد من إرسال تاريخ الميلاد بشكل صحيح
      // نسخ تاريخ الميلاد بجميع الاختلافات الممكنة
      if (flattenedData.date_of_birth || flattenedData.birthDate || flattenedData.BirthDate || flattenedData.dateofbirth || flattenedData.DateOfBirth || flattenedData.birth_date || flattenedData.Birth_Date || flattenedData.age) {
        const birthDateValue = flattenedData.date_of_birth || flattenedData.birthDate || flattenedData.BirthDate || flattenedData.dateofbirth || flattenedData.DateOfBirth || flattenedData.birth_date || flattenedData.Birth_Date || flattenedData.age;
        flattenedData.date_of_birth = birthDateValue;
        flattenedData.birthDate = birthDateValue;
        flattenedData.BirthDate = birthDateValue;
        flattenedData.dateofbirth = birthDateValue;
        flattenedData.DateOfBirth = birthDateValue;
        flattenedData.birth_date = birthDateValue;
        flattenedData.Birth_Date = birthDateValue;
        flattenedData.age = birthDateValue;
      }

      // 🔍 التأكد من إرسال الحالة الاجتماعية بشكل صحيح
      // نسخ الحالة الاجتماعية بجميع الاختلافات الممكنة
      if (flattenedData.marital_status || flattenedData.MaritalStatus || flattenedData.maritalStatus || flattenedData.maritalstatus) {
        const maritalStatusValue = flattenedData.marital_status || flattenedData.MaritalStatus || flattenedData.maritalStatus || flattenedData.maritalstatus;
        flattenedData.marital_status = maritalStatusValue;
        flattenedData.MaritalStatus = maritalStatusValue;
        flattenedData.maritalStatus = maritalStatusValue;
        flattenedData.maritalstatus = maritalStatusValue;
      }

      // 🔍 تنظيف القيم 'null' و 'undefined' (كسلسلة نصية) قبل الإرسال
      Object.keys(flattenedData).forEach(key => {
        const value = flattenedData[key];
        if (value === 'null' || value === 'undefined' || (typeof value === 'string' && value.trim() === '')) {
          delete flattenedData[key];
        }
      });

      console.log("🚀 Data Sent to Server:", flattenedData);
      console.log("🔍 Passport Data Check:", {
        passport: flattenedData.passport || flattenedData.PassportNumber || flattenedData.passport_number || flattenedData.Passportnumber || flattenedData.passportNumber || flattenedData.passportnumber,
        passportStart: flattenedData.passportStart || flattenedData.passportStartDate || flattenedData.passport_issue_date,
        passportEnd: flattenedData.passportEnd || flattenedData.passportEndDate || flattenedData.passport_expiration,
      });
      console.log("🔍 BabySitterLevel Check:", {
        BabySitterLevel: flattenedData.BabySitterLevel,
        babySitterLevel: flattenedData.babySitterLevel,
        baby_sitter_level: flattenedData.baby_sitter_level,
      });

      const response = await fetch('/api/save-pdf-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          selectedImages: uploadedImageUrls.length > 0 ? uploadedImageUrls : selectedImages,
          geminiData: { jsonResponse: flattenedData },
          originalFileName: file?.name || 'document.pdf',
          notes,
          processedBy: 'Admin User',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save data');
      }

      const successMessage = 'تم حفظ بيانات الموظف بنجاح! ✓';
      setSaveMessage(successMessage);
      showToast(successMessage, 'success');

      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (err) {
      console.error("Save Error:", err);
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء الحفظ';
      setError(errorMessage);
      showToast(errorMessage, 'error');
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
                              المكتب المستخرج: <span className="font-semibold">{invalidOffice.value}</span> غير موجود في قاعدة البيانات. يرجى اختيار مكتب صحيح من القائمة أدناه في قسم "اختر المكتب".
                            </p>
                            {selectedNationality && (
                              <p className="text-sm text-blue-700 mb-2 text-right">
                                <span className="font-semibold">ملاحظة:</span> تم تصفية المكاتب بناءً على الجنسية المحددة: <span className="font-semibold">{selectedNationality}</span>
                              </p>
                            )}
                            {selectedNationality && filteredOffices.length === 0 && (
                              <p className="text-sm text-red-700 mb-2 text-right">
                                <span className="font-semibold">تحذير:</span> لا توجد مكاتب متاحة للجنسية المحددة ({selectedNationality})
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setInvalidOffice(null);
                              setSelectedOfficeNationality(null);
                            }}
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
                  {(invalidNationality || selectedNationality) && (
                    <div className="mb-6">
                      <div className={`border rounded-xl p-6 shadow-sm ${invalidNationality ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            {invalidNationality ? (
                              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            ) : (
                              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <div className="mr-3 flex-1">
                            {invalidNationality ? (
                              <>
                                <h3 className="text-lg font-medium text-yellow-800 mb-2 text-right">
                                  تحذير: الجنسية غير موجودة في القائمة
                                </h3>
                                <p className="text-sm text-yellow-700 mb-4 text-right">
                                  الجنسية المستخرجة: <span className="font-semibold">{invalidNationality.value}</span> غير موجودة في قاعدة البيانات. يرجى اختيار جنسية صحيحة من القائمة أدناه.
                                </p>
                              </>
                            ) : (
                              <h3 className="text-lg font-medium text-green-800 mb-2 text-right">
                                الجنسية المختارة: <span className="font-semibold">{selectedNationality}</span>
                              </h3>
                            )}
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-yellow-800 mb-2 text-right">
                                اختر الجنسية:
                              </label>
                              <select
                                dir="rtl"
                                onChange={(e) => handleNationalitySelection(e.target.value)}
                                value={selectedNationality || ''}
                                className="w-full  py-2 border border-yellow-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-right"
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
                          {invalidNationality && (
                            <button
                              onClick={() => setInvalidNationality(null)}
                              className="flex-shrink-0 text-yellow-600 hover:text-yellow-800"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Office Selection - يظهر فوق البيانات المستخرجة */}
                  <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 text-right">
                      اختر المكتب
                    </h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                        المكتب:
                      </label>
                      <select
                        dir="rtl"
                        onChange={(e) => {
                          if (e.target.value && processingResult) {
                            const updatedData = { ...processingResult.geminiData.jsonResponse };
                            updatedData.company_name = e.target.value;
                            updatedData.CompanyName = e.target.value;
                            updatedData.office_name = e.target.value;
                            updatedData.OfficeName = e.target.value;
                            setProcessingResult({
                              ...processingResult,
                              geminiData: { jsonResponse: updatedData }
                            });
                            setInvalidOffice(null);
                          }
                        }}
                        value={processingResult?.geminiData?.jsonResponse?.company_name || 
                               processingResult?.geminiData?.jsonResponse?.CompanyName || 
                               processingResult?.geminiData?.jsonResponse?.office_name || 
                               processingResult?.geminiData?.jsonResponse?.OfficeName || ''}
                        className="w-full  py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-right bg-white"
                      >
                        <option value="">-- اختر مكتب من القائمة --</option>
                        {filteredOffices.length > 0 ? (
                          filteredOffices.map((office) => (
                            <option key={office.id} value={office.office || ''}>
                              {office.office}
                            </option>
                          ))
                        ) : offices.length > 0 ? (
                          offices.map((office) => (
                            <option key={office.id} value={office.office || ''}>
                              {office.office}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>لا توجد مكاتب متاحة</option>
                        )}
                      </select>
                      {selectedNationality && (
                        <p className="text-xs text-gray-500 mt-2 text-right">
                          المكاتب المعروضة: {filteredOffices.length > 0 ? `مصفاة حسب الجنسية (${selectedNationality})` : 'جميع المكاتب'}
                        </p>
                      )}
                    </div>
                  </div>

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
                              {(() => {
                                // استخراج المهارات واللغات وتحويلها لحقول منفصلة
                                const allEntries = Object.entries(processingResult.geminiData.jsonResponse);
                                const expandedEntries: [string, any][] = [];
                                let experienceFieldEntry: [string, any] | null = null;
                                let experienceYearsEntry: [string, any] | null = null;

                                // مجموعات الحقول المرتبة
                                const personalInfo: [string, any][] = [];
                                const passportInfo: [string, any][] = [];
                                const educationInfo: [string, any][] = [];
                                const experienceInfo: [string, any][] = [];
                                const skillsInfo: [string, any][] = [];
                                const languagesInfo: [string, any][] = [];
                                const otherInfo: [string, any][] = [];
                                let jobFieldEntry: [string, any] | null = null;

                                allEntries.forEach(([key, value]) => {
                                  // تخطي جميع حقول المكتب من العرض (يتم اختيارها من السكشن المخصص)
                                  const normalizedKey = key.toLowerCase().trim();
                                  // جميع الاحتمالات الممكنة لأسماء حقول المكتب
                                  if (
                                    normalizedKey === 'company_name' || 
                                    normalizedKey === 'companyname' ||
                                    normalizedKey === 'company_name' ||
                                    normalizedKey === 'office_name' || 
                                    normalizedKey === 'officename' ||
                                    normalizedKey === 'office_name' ||
                                    normalizedKey === 'office' ||
                                    normalizedKey === 'company' ||
                                    // التحقق من جميع الاختلافات في الأحرف
                                    key === 'company_name' || 
                                    key === 'CompanyName' || 
                                    key === 'Company_Name' ||
                                    key === 'companyName' ||
                                    key === 'COMPANY_NAME' ||
                                    key === 'office_name' || 
                                    key === 'OfficeName' || 
                                    key === 'Office_Name' ||
                                    key === 'officeName' ||
                                    key === 'OFFICE_NAME' ||
                                    key === 'officename' ||
                                    key === 'OfficeName ' ||
                                    key === 'company_name ' ||
                                    key === 'office_name ' ||
                                    key === 'CompanyName '
                                  ) {
                                    return;
                                  }

                                  // تخطي جميع حقول الجنسية من العرض (يتم اختيارها من السكشن المخصص)
                                  if (
                                    normalizedKey === 'nationality' ||
                                    normalizedKey === 'nationalitycopy' ||
                                    key === 'nationality' ||
                                    key === 'Nationality' ||
                                    key === 'nationalitycopy' ||
                                    key === 'Nationalitycopy' ||
                                    key === 'NATIONALITY' ||
                                    key === 'Nationality ' ||
                                    key === 'nationality '
                                  ) {
                                    return;
                                  }

                                  // تخطي حقل نوع الخبرة (experienceType) من العرض
                                  if (
                                    normalizedKey === 'experiencetype' ||
                                    key === 'experienceType' ||
                                    key === 'experience_type' ||
                                    key === 'ExperienceType'
                                  ) {
                                    return;
                                  }

                                  // جمع حقل مستوى الخبرة (experienceField) - سنضيفه لاحقاً في الترتيب الصحيح
                                  if (
                                    key === 'experienceField' ||
                                    key === 'experience_field' || 
                                    key === 'ExperienceField' || 
                                    key === 'experience' || 
                                    key === 'Experience'
                                  ) {
                                    if (!experienceFieldEntry) {
                                      experienceFieldEntry = ['experienceField', value];
                                    }
                                    return;
                                  }

                                  // جمع حقل سنوات الخبرة (experienceYears) - سنضيفه لاحقاً في الترتيب الصحيح
                                  if (
                                    key === 'experienceYears' ||
                                    key === 'experience_years' || 
                                    key === 'ExperienceYears' || 
                                    key === 'years_of_experience'
                                  ) {
                                    if (!experienceYearsEntry) {
                                      experienceYearsEntry = ['experienceYears', value];
                                    }
                                    return;
                                  }

                                  // جمع حقل المهنة (job_title/profession/job) - سنضيفه لاحقاً في الترتيب الصحيح
                                  if (
                                    normalizedKey === 'job_title' ||
                                    normalizedKey === 'profession' ||
                                    normalizedKey === 'job' ||
                                    key === 'job_title' ||
                                    key === 'JobTitle' ||
                                    key === 'jobTitle' ||
                                    key === 'profession' ||
                                    key === 'Profession' ||
                                    key === 'job' ||
                                    key === 'Job'
                                  ) {
                                    // استخدام أول قيمة غير فارغة نجدها
                                    if (!jobFieldEntry) {
                                      jobFieldEntry = ['job_title', value];
                                    } else if (!jobFieldEntry[1] && value) {
                                      // إذا كان الحقل السابق فارغاً وهذه القيمة موجودة، استخدمها
                                      jobFieldEntry = ['job_title', value];
                                    }
                                    return;
                                  }

                                  // توسيع المهارات إلى حقول منفصلة
                                  if (key === 'skills') {
                                    try {
                                      const skills = typeof value === 'string' ? JSON.parse(value) : value;
                                      if (typeof skills === 'object' && skills !== null) {
                                        Object.entries(skills).forEach(([skillKey, skillValue]) => {
                                          skillsInfo.push([`skill_${skillKey.toLowerCase()}`, skillValue]);
                                        });
                                        return;
                                      }
                                    } catch {
                                      // إذا فشل التحليل، أضف كما هو
                                    }
                                  }

                                  // توسيع اللغات إلى حقول منفصلة
                                  if (key === 'languages_spoken') {
                                    try {
                                      const languages = typeof value === 'string' ? JSON.parse(value) : value;
                                      if (typeof languages === 'object' && languages !== null) {
                                        Object.entries(languages).forEach(([langKey, langValue]) => {
                                          languagesInfo.push([`lang_${langKey.toLowerCase()}`, langValue]);
                                        });
                                        return;
                                      }
                                    } catch {
                                      // إذا فشل التحليل، أضف كما هو
                                    }
                                  }

                                  // تصنيف الحقول حسب النوع
                                  // بيانات الجواز - تجميعها معاً
                                  if (
                                    normalizedKey === 'passport_number' ||
                                    normalizedKey === 'passport' ||
                                    normalizedKey === 'passportnumber' ||
                                    normalizedKey === 'passport_issue_date' ||
                                    normalizedKey === 'passportstartdate' ||
                                    normalizedKey === 'passport_start' ||
                                    normalizedKey === 'passportstart' ||
                                    normalizedKey === 'passport_expiration' ||
                                    normalizedKey === 'passportenddate' ||
                                    normalizedKey === 'passport_end' ||
                                    normalizedKey === 'passportend' ||
                                    normalizedKey === 'passport_expiry' ||
                                    key === 'passport_number' ||
                                    key === 'passport' ||
                                    key === 'PassportNumber' ||
                                    key === 'Passportnumber' ||
                                    key === 'passportNumber' ||
                                    key === 'passportnumber' ||
                                    key === 'passportStart' ||
                                    key === 'passportStartDate' ||
                                    key === 'passport_issue_date' ||
                                    key === 'PassportStartDate' ||
                                    key === 'passport_start' ||
                                    key === 'passportEnd' ||
                                    key === 'passportEndDate' ||
                                    key === 'passport_expiration' ||
                                    key === 'PassportEndDate' ||
                                    key === 'passport_end' ||
                                    key === 'passport_expiry'
                                  ) {
                                    passportInfo.push([key, value]);
                                    return;
                                  }

                                  // المهارات المباشرة (CookingLevel, WashingLevel, إلخ)
                                  if (
                                    normalizedKey.includes('cookinglevel') ||
                                    normalizedKey.includes('washinglevel') ||
                                    normalizedKey.includes('ironinglevel') ||
                                    normalizedKey.includes('cleaninglevel') ||
                                    normalizedKey.includes('sewinglevel') ||
                                    normalizedKey.includes('childcarelevel') ||
                                    normalizedKey.includes('elderlycarelevel') ||
                                    normalizedKey.includes('babysitterlevel') ||
                                    key.startsWith('skill_')
                                  ) {
                                    skillsInfo.push([key, value]);
                                    return;
                                  }

                                  // اللغات المباشرة
                                  if (
                                    normalizedKey.includes('arabiclevel') ||
                                    normalizedKey.includes('arabiclanguagelevel') ||
                                    normalizedKey.includes('englishlevel') ||
                                    normalizedKey.includes('englishlanguagelevel') ||
                                    key.startsWith('lang_')
                                  ) {
                                    languagesInfo.push([key, value]);
                                    return;
                                  }

                                  // التعليم
                                  if (
                                    normalizedKey.includes('education') ||
                                    normalizedKey.includes('arabiclevel') ||
                                    normalizedKey.includes('englishlevel')
                                  ) {
                                    educationInfo.push([key, value]);
                                    return;
                                  }

                                  // المعلومات الشخصية الأساسية
                                  if (
                                    normalizedKey === 'name' ||
                                    normalizedKey === 'full_name' ||
                                    normalizedKey === 'fullname' ||
                                    normalizedKey === 'age' ||
                                    normalizedKey === 'date_of_birth' ||
                                    normalizedKey === 'birthdate' ||
                                    normalizedKey === 'dateofbirth' ||
                                    normalizedKey === 'birth_date' ||
                                    normalizedKey === 'religion' ||
                                    normalizedKey === 'marital_status' ||
                                    normalizedKey === 'maritalstatus' ||
                                    normalizedKey === 'weight' ||
                                    normalizedKey === 'height' ||
                                    normalizedKey === 'children' ||
                                    normalizedKey === 'children_count' ||
                                    normalizedKey === 'mobile' ||
                                    normalizedKey === 'phone' ||
                                    normalizedKey === 'salary' ||
                                    normalizedKey === 'contract_duration' ||
                                    normalizedKey === 'contractduration' ||
                                    normalizedKey === 'birth_place'
                                  ) {
                                    personalInfo.push([key, value]);
                                    return;
                                  }

                                  // باقي الحقول
                                  otherInfo.push([key, value]);
                                });

                                // ترتيب بيانات الجواز: رقم، تاريخ الإصدار، تاريخ الانتهاء
                                passportInfo.sort((a, b) => {
                                  const [keyA] = a;
                                  const [keyB] = b;
                                  const normalizedA = keyA.toLowerCase();
                                  const normalizedB = keyB.toLowerCase();
                                  
                                  // رقم الجواز أولاً
                                  if (normalizedA.includes('passport_number') || normalizedA === 'passport' || normalizedA === 'passportnumber') return -1;
                                  if (normalizedB.includes('passport_number') || normalizedB === 'passport' || normalizedB === 'passportnumber') return 1;
                                  
                                  // تاريخ الإصدار ثانياً
                                  if (normalizedA.includes('start') || normalizedA.includes('issue')) return -1;
                                  if (normalizedB.includes('start') || normalizedB.includes('issue')) return 1;
                                  
                                  // تاريخ الانتهاء ثالثاً
                                  if (normalizedA.includes('end') || normalizedA.includes('expiration') || normalizedA.includes('expiry')) return -1;
                                  if (normalizedB.includes('end') || normalizedB.includes('expiration') || normalizedB.includes('expiry')) return 1;
                                  
                                  return 0;
                                });

                                // ترتيب المهارات أبجدياً
                                skillsInfo.sort((a, b) => {
                                  const [keyA] = a;
                                  const [keyB] = b;
                                  return keyA.localeCompare(keyB);
                                });

                                // إضافة experienceField و experienceYears بعد التعليم
                                if (experienceFieldEntry) {
                                  experienceInfo.push(experienceFieldEntry);
                                }
                                if (experienceYearsEntry) {
                                  experienceInfo.push(experienceYearsEntry);
                                }

                                // إضافة حقل المهنة (jobFieldEntry) في personalInfo
                                if (jobFieldEntry) {
                                  personalInfo.push(jobFieldEntry);
                                } else {
                                  // إذا لم يكن موجوداً في البيانات، أضفه كحقل فارغ
                                  personalInfo.push(['job_title', '']);
                                }

                                // تجميع جميع الحقول بالترتيب المطلوب
                                const orderedEntries: [string, any][] = [
                                  ...personalInfo,
                                  ...passportInfo,
                                  ...educationInfo,
                                  ...experienceInfo,
                                  ...skillsInfo,
                                  ...languagesInfo,
                                  ...otherInfo
                                ];

                                return orderedEntries;
                              })().map(([key, value]) => {
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

                                // تحليل المهارات واللغات وعرضها كحقول منفصلة
                                const parseSkillsOrLanguages = (val: any) => {
                                  try {
                                    return typeof val === 'string' ? JSON.parse(val) : val;
                                  } catch {
                                    return val;
                                  }
                                };

                                const renderValue = (val: any, fieldKey?: string) => {
                                  if (val === null || val === undefined) return '';
                                  const strVal = String(val);
                                  if (strVal === 'null' || strVal === 'undefined' || strVal.trim() === '') return '';
                                  
                                  // معالجة أرقام التليفون
                                  const normalizedKey = fieldKey?.toLowerCase() || '';
                                  const isPhoneField = normalizedKey === 'phone' || 
                                                      normalizedKey === 'mobile' || 
                                                      normalizedKey === 'phonenumber' ||
                                                      normalizedKey === 'phone_number';
                                  
                                  if (isPhoneField && strVal.trim()) {
                                    let phoneValue = strVal.trim();
                                    
                                    // إذا كانت علامة الزائد في النهاية، ننقلها إلى البداية
                                    if (phoneValue.endsWith('+') && !phoneValue.startsWith('+')) {
                                      phoneValue = '+' + phoneValue.slice(0, -1);
                                    }
                                    
                                    // إذا كان الرقم يبدأ بصفر ولم تكن علامة الزائد موجودة، نحول الصفر إلى زائد
                                    if (phoneValue.startsWith('0') && !phoneValue.startsWith('+')) {
                                      phoneValue = '+' + phoneValue.substring(1);
                                    }
                                    
                                    return phoneValue;
                                  }
                                  
                                  return strVal;
                                };

                                // تحسين عرض أسماء الحقول - ترجمة شاملة لجميع المفاتيح
                                const getDisplayLabel = (fieldKey: string) => {
                                  const labelMap: Record<string, string> = {
                                    // المعلومات الشخصية
                                    'name': 'الاسم',
                                    'full_name': 'الاسم',
                                    'Name': 'الاسم',
                                    'age': 'العمر',
                                    'Age': 'العمر',
                                    'FullName': 'الاسم',
                                    "birth_place":'مكان الميلاد',
                                    'religion': 'الديانة',
                                    'Religion': 'الديانة',
                                    
                                    'nationality': 'الجنسية',
                                    'Nationality': 'الجنسية',
                                    'nationalitycopy': 'الجنسية',
                                    'Nationalitycopy': 'الجنسية',
                                    'marital_status': 'الحالة الاجتماعية',
                                    'MaritalStatus': 'الحالة الاجتماعية',
                                    'maritalStatus': 'الحالة الاجتماعية',
                                    'maritalstatus': 'الحالة الاجتماعية',
                                    
                                    // 'age': 'تاريخ الميلاد',
                                    // 'Age': 'تاريخ الميلاد',
                                    'dateofbirth': 'تاريخ الميلاد',
                                    'BirthDate': 'تاريخ الميلاد',
                                    'birthDate': 'تاريخ الميلاد',
                                    
                                    'passport': 'رقم جواز السفر',
                                    'passport_number': 'رقم جواز السفر',
                                    'PassportNumber': 'رقم جواز السفر',
                                    'passportNumber': 'رقم جواز السفر',
                                    
                                    'mobile': 'رقم الجوال',
                                    'phone': 'رقم الجوال',
                                    'Mobile': 'رقم الجوال',
                                    'Phone': 'رقم الجوال',
                                    
                                    'weight': 'الوزن (كجم)',
                                    'Weight': 'الوزن (كجم)',
                                    
                                    'height': 'الطول (سم)',
                                    'Height': 'الطول (سم)',
                                    
                                    'children': 'عدد الأطفال',
                                    'Children': 'عدد الأطفال',
                                    
                                    'passportStart': 'بداية الجواز',
                                    'passport_start': 'بداية الجواز',
                                    'passport_issue_date': 'بداية الجواز',
                                    'PassportStartDate': 'بداية الجواز',
                                    'passportStartDate': 'بداية الجواز',
                                    
                                    'passportEnd': 'نهاية الجواز',
                                    'passport_end': 'نهاية الجواز',
                                    'passport_expiration': 'نهاية الجواز',
                                    'passport_expiry': 'نهاية الجواز',
                                    'PassportEndDate': 'نهاية الجواز',
                                    'passportEndDate': 'نهاية الجواز',
                                    
                                    // التعليم
                                    'educationLevel': 'مستوى التعليم',
                                    'education_level': 'مستوى التعليم',
                                    'EducationLevel': 'مستوى التعليم',
                                    'education': 'مستوى التعليم',
                                    'Education': 'مستوى التعليم',
                                    
                                    'arabicLevel': 'اللغة العربية',
                                    'arabic_level': 'اللغة العربية',
                                    'ArabicLevel': 'اللغة العربية',
                                    'ArabicLanguageLeveL': 'اللغة العربية',
                                    'arabicLanguageLevel': 'اللغة العربية',
                                    
                                    'englishLevel': 'اللغة الإنجليزية',
                                    'english_level': 'اللغة الإنجليزية',
                                    'EnglishLevel': 'اللغة الإنجليزية',
                                    'EnglishLanguageLevel': 'اللغة الإنجليزية',
                                    'englishLanguageLevel': 'اللغة الإنجليزية',
                                    
                                    // الخبرة
                                    'experienceField': 'مستوى الخبرة',
                                    'experience_field': 'مستوى الخبرة',
                                    'ExperienceField': 'مستوى الخبرة',
                                    'experience': 'مستوى الخبرة',
                                    'Experience': 'مستوى الخبرة',
                                    
                                    'experienceYears': 'سنوات الخبرة',
                                    'experience_years': 'سنوات الخبرة',
                                    'ExperienceYears': 'سنوات الخبرة',
                                    'years_of_experience': 'سنوات الخبرة',
                                    
                                    // الراتب والمكتب
                                    'salary': 'الراتب',
                                    'Salary': 'الراتب',
                                    
                                    'officeName': 'اسم المكتب',
                                    'office_name': 'اسم المكتب',
                                    'OfficeName': 'اسم المكتب',
                                    'company_name': 'اسم المكتب',
                                    'CompanyName': 'اسم المكتب',
                                    
                                    // المهارات
                                    'cookingLevel': 'مهارة: الطبخ',
                                    'cooking_level': 'مهارة: الطبخ',
                                    'CookingLevel': 'مهارة: الطبخ',
                                    
                                    'washingLevel': 'مهارة: الغسيل',
                                    'washing_level': 'مهارة: الغسيل',
                                    'WashingLevel': 'مهارة: الغسيل',
                                    
                                    'ironingLevel': 'مهارة: الكوي',
                                    'ironing_level': 'مهارة: الكوي',
                                    'IroningLevel': 'مهارة: الكوي',
                                    
                                    'cleaningLevel': 'مهارة: التنظيف',
                                    'cleaning_level': 'مهارة: التنظيف',
                                    'CleaningLevel': 'مهارة: التنظيف',
                                    
                                    'sewingLevel': 'مهارة: الخياطة',
                                    'sewing_level': 'مهارة: الخياطة',
                                    'SewingLevel': 'مهارة: الخياطة',
                                    
                                    'childcareLevel': 'مهارة: العناية بالأطفال',
                                    'childcare_level': 'مهارة: العناية بالأطفال',
                                    'ChildcareLevel': 'مهارة: العناية بالأطفال',
                                    'babysitter': 'مهارة: العناية بالأطفال',
                                    'Babysitter': 'مهارة: العناية بالأطفال',
                                    'babysitting': 'مهارة: العناية بالأطفال',
                                    'Babysitting': 'مهارة: العناية بالأطفال',
                                    
                                    'elderlycareLevel': 'مهارة: رعاية كبار السن',
                                    'elderlycare_level': 'مهارة: رعاية كبار السن',
                                    'ElderlycareLevel': 'مهارة: رعاية كبار السن',
                                    'elderly_care': 'مهارة: رعاية كبار السن',
                                    'ElderlyCare': 'مهارة: رعاية كبار السن',
                                    

                                    'BabySitterLevel': 'مهارة: العناية بالرضع',
                                    'baby_sitter_level': 'مهارة: العناية بالرضع',
                                    'children_count': 'عدد الأطفال',
                                    'ChildrenCount': 'عدد الأطفال',
                                    'childrenCount': 'عدد الأطفال',
                                    // المهارات من كائن skills
                                    'skill_washing': 'مهارة: الغسيل',
                                    'skill_cooking': 'مهارة: الطبخ',
                                    'skill_babysitting': 'مهارة: رعاية الأطفال',
                                    'skill_cleaning': 'مهارة: التنظيف',
                                    'skill_ironing': 'مهارة: الكوي',
                                    'skill_sewing': 'مهارة: الخياطة',
                                    'skill_childcare': 'مهارة: العناية بالأطفال',
                                    'skill_elderlycare': 'مهارة: رعاية كبار السن',
                                    // اللغات من كائن languages_spoken
                                    'lang_english': 'لغة: الإنجليزية',
                                    'lang_arabic': 'لغة: العربية',
                                    // 'englishLanguageLevel': 'لغة: الإنجليزية',
                                    // حقول إضافية
                                    'contract_duration': 'مدة العقد',
                                    'Contract_duration': 'مدة العقد',
                                    'ContractDuration': 'مدة العقد',
                                    'contractDuration': 'مدة العقد',
                                    
                                    'job_title': 'المهنة',
                                    'jobTitle': 'المهنة',
                                    'JobTitle': 'المهنة',
                                    'profession': 'المهنة',
                                    'Profession': 'المهنة',
                                    'job': 'المهنة',
                                    'Job': 'المهنة',
                                  };
                                  
                                  // البحث عن الترجمة (مع مراعاة الحالة)
                                  const normalizedKey = fieldKey.toLowerCase();
                                  for (const [key, label] of Object.entries(labelMap)) {
                                    if (key.toLowerCase() === normalizedKey) {
                                      return label;
                                    }
                                  }
                                  
                                  // إذا لم يتم العثور على ترجمة، إرجاع المفتاح كما هو
                                  return fieldKey;
                                };

                                const isEmpty = !displayValue || displayValue === 'null' || displayValue === 'undefined' || String(displayValue).trim() === '';
                                
                                return (
                                  <tr
                                    key={key}
                                    className={`hover:bg-gray-50 transition-all duration-200 group ${isEmpty ? 'bg-yellow-50' : ''}`}
                                  >
                                    <td className="border border-gray-200 px-4 py-3 font-medium text-gray-900">
                                      <span>{getDisplayLabel(displayKey)}</span>
                                    </td>
                                    <td className="border border-gray-200 px-4 py-3 text-gray-700">
  {isEditing ? (
    // ---------------------------------------------------------
    // 1. الحالة الأولى: تعديل المهنة (Job Title / Profession)
    // ---------------------------------------------------------
    (key === 'job_title' || key === 'profession' || key === 'job' || key === 'Job') ? (
      <div className="flex items-center gap-2">
        <div className="relative w-full">
          <select
            style={{ 
              backgroundImage: 'none', 
              WebkitAppearance: 'none', 
              MozAppearance: 'none', 
              appearance: 'none' 
            }}
            className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right bg-white"
            value={editingField?.value ?? ''}
            onChange={(e) =>
              setEditingField((prev) =>
                prev ? { ...prev, value: e.target.value } : prev
              )
            }
          >
            <option value="">اختر المهنة</option>
            {professions.map((prof) => (
              <option key={prof.id} value={prof.name}>
                {prof.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
        <button
          type="button"
          className="px-3 py-1 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 flex-shrink-0"
          onClick={saveEditingField}
        >
          حفظ
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded-md bg-gray-200 text-gray-800 text-xs hover:bg-gray-300 flex-shrink-0"
          onClick={cancelEditingField}
        >
          إلغاء
        </button>
      </div>
    ) :
    // ---------------------------------------------------------
    // 2. الحالة الثانية: تعديل الديانة (Religion)
    // ---------------------------------------------------------
    (key === 'religion' || key === 'Religion') ? (
      <div className="flex items-center gap-2">
        <div className="relative w-full">
          <select
            style={{ 
              backgroundImage: 'none', 
              WebkitAppearance: 'none', 
              MozAppearance: 'none', 
              appearance: 'none' 
            }}
            className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right bg-white"
            value={editingField?.value ?? ''}
            onChange={(e) =>
              setEditingField((prev) =>
                prev ? { ...prev, value: e.target.value } : prev
              )
            }
          >
            <option value="">اختر الديانة</option>
            {religionOptions.map((religion) => (
              <option key={religion} value={religion}>
                {religion}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
        <button
          type="button"
          className="px-3 py-1 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 flex-shrink-0"
          onClick={saveEditingField}
        >
          حفظ
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded-md bg-gray-200 text-gray-800 text-xs hover:bg-gray-300 flex-shrink-0"
          onClick={cancelEditingField}
        >
          إلغاء
        </button>
      </div>
    ) :
    // ---------------------------------------------------------
    // 3. الحالة الثالثة: الحالة الاجتماعية (Marital Status) ✨
    // ---------------------------------------------------------
    (key === 'marital_status' || key === 'MaritalStatus' || key === 'maritalStatus' || key === 'maritalstatus') ? (
      <div className="flex items-center gap-2">
        <div className="relative w-full">
          <select
            style={{ 
              backgroundImage: 'none', 
              WebkitAppearance: 'none', 
              MozAppearance: 'none', 
              appearance: 'none' 
            }}
            className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right bg-white"
            value={editingField?.value ?? ''}
            onChange={(e) =>
              setEditingField((prev) =>
                prev ? { ...prev, value: e.target.value } : prev
              )
            }
          >
            <option value="">اختر الحالة الاجتماعية</option>
            {maritalStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
        <button
          type="button"
          className="px-3 py-1 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 flex-shrink-0"
          onClick={saveEditingField}
        >
          حفظ
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded-md bg-gray-200 text-gray-800 text-xs hover:bg-gray-300 flex-shrink-0"
          onClick={cancelEditingField}
        >
          إلغاء
        </button>
      </div>
    ) :
    // ---------------------------------------------------------
    // 3.4. الحالة الرابعة: تعديل مستوى التعليم (Education Level) ✨
    // ---------------------------------------------------------
    (key === 'educationLevel' || key === 'education_level' || key === 'EducationLevel' || key === 'education' || key === 'Education') ? (
      <div className="flex items-center gap-2">
        <div className="relative w-full">
          <select
            style={{ 
              backgroundImage: 'none', 
              WebkitAppearance: 'none', 
              MozAppearance: 'none', 
              appearance: 'none' 
            }}
            className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right bg-white"
            value={editingField?.value ?? ''}
            onChange={(e) =>
              setEditingField((prev) =>
                prev ? { ...prev, value: e.target.value } : prev
              )
            }
          >
            <option value="">اختر مستوى التعليم</option>
            {educationOptions.map((edu) => (
              <option key={edu} value={edu}>
                {edu}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
        <button
          type="button"
          className="px-3 py-1 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 flex-shrink-0"
          onClick={saveEditingField}
        >
          حفظ
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded-md bg-gray-200 text-gray-800 text-xs hover:bg-gray-300 flex-shrink-0"
          onClick={cancelEditingField}
        >
          إلغاء
        </button>
      </div>
    ) :
    // ---------------------------------------------------------
    // 3.5. الحالة الخاصة: تعديل مستوى الخبرة (Experience Field)
    // ---------------------------------------------------------
    (key === 'experienceField' || key === 'experience_field' || key === 'ExperienceField' || key === 'experience' || key === 'Experience') ? (
      <div className="flex items-center gap-2">
        <div className="relative w-full">
          <select
            style={{ 
              backgroundImage: 'none', 
              WebkitAppearance: 'none', 
              MozAppearance: 'none', 
              appearance: 'none' 
            }}
            className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right bg-white"
            value={editingField?.value ?? ''}
            onChange={(e) => {
              setEditingField((prev) =>
                prev ? { ...prev, value: e.target.value } : prev
              );
            }}
          >
            <option value="">اختر مستوى الخبرة</option>
            {experienceOptions.map((exp) => (
              <option key={exp} value={exp}>
                {exp}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
        <button
          type="button"
          className="px-3 py-1 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 flex-shrink-0"
          onClick={() => {
            if (editingField?.value) {
              handleExperienceChange(editingField.value);
            }
          }}
        >
          حفظ
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded-md bg-gray-200 text-gray-800 text-xs hover:bg-gray-300 flex-shrink-0"
          onClick={cancelEditingField}
        >
          إلغاء
        </button>
      </div>
    ) :
    // ---------------------------------------------------------
    // 3.6. الحالة الخاصة: سنوات الخبرة (Read-only)
    // ---------------------------------------------------------
    (key === 'experienceYears' || key === 'experience_years' || key === 'ExperienceYears' || key === 'years_of_experience') ? (
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 text-right cursor-not-allowed"
          value={editingField?.value ?? ''}
          readOnly
          placeholder="يتم التعبئة تلقائياً"
        />
        <button
          type="button"
          className="px-2 py-1 rounded-md bg-gray-200 text-gray-800 text-xs hover:bg-gray-300 flex-shrink-0"
          onClick={cancelEditingField}
        >
          إلغاء
        </button>
      </div>
    ) :
    // ---------------------------------------------------------
    // 4. الحالة الرابعة: تعديل المهارات أو اللغات
    // ---------------------------------------------------------
    (key.startsWith('skill_') || key.startsWith('lang_')) ? (
      <div className="flex items-center gap-2">
        <div className="relative w-full">
          <select
            style={{ 
              backgroundImage: 'none', 
              WebkitAppearance: 'none', 
              MozAppearance: 'none', 
              appearance: 'none' 
            }}
            className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right bg-white"
            value={editingField?.value ?? ''}
            onChange={(e) =>
              setEditingField((prev) =>
                prev ? { ...prev, value: e.target.value } : prev
              )
            }
          >
            <option value="">اختر المستوى</option>
            {skillLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
        <button
          type="button"
          className="px-3 py-1 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 flex-shrink-0"
          onClick={saveEditingField}
        >
          حفظ
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded-md bg-gray-200 text-gray-800 text-xs hover:bg-gray-300 flex-shrink-0"
          onClick={cancelEditingField}
        >
          إلغاء
        </button>
      </div>
    ) :
    // ---------------------------------------------------------
    // 5.5. الحالة الخاصة: الحقول التي تحتوي على "Date" في الاسم
    // ---------------------------------------------------------
    (key.toLowerCase().includes('date') || key.toLowerCase().includes('birth') || key.toLowerCase().includes('start') || key.toLowerCase().includes('end') || key.toLowerCase().includes('expiration') || key.toLowerCase().includes('expiry')) ? (
      <div className="flex items-center gap-2">
        <input
          type="date"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
          value={editingField?.value ?? ''}
          onChange={(e) =>
            setEditingField((prev) =>
              prev ? { ...prev, value: e.target.value } : prev
            )
          }
        />
        <button
          type="button"
          className="px-3 py-1 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 flex-shrink-0"
          onClick={saveEditingField}
        >
          حفظ
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded-md bg-gray-200 text-gray-800 text-xs hover:bg-gray-300 flex-shrink-0"
          onClick={cancelEditingField}
        >
          إلغاء
        </button>
      </div>
    ) :
    // ---------------------------------------------------------
    // 5.6. الحالة الخاصة: حقل جواز السفر (أرقام وحروف فقط)
    // ---------------------------------------------------------
    (key === 'passport_number' || key === 'passport' || key === 'PassportNumber' || key === 'Passportnumber' || key === 'passportNumber' || key === 'passportnumber') ? (
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
          value={editingField?.value ?? ''}
          onChange={(e) => {
            // السماح بأرقام وحروف فقط (لا رموز خاصة)
            const filteredValue = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
            setEditingField((prev) =>
              prev ? { ...prev, value: filteredValue } : prev
            );
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              saveEditingField();
            }
          }}
          placeholder="أرقام وحروف فقط"
        />
        <button
          type="button"
          className="px-3 py-1 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 flex-shrink-0"
          onClick={saveEditingField}
        >
          حفظ
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded-md bg-gray-200 text-gray-800 text-xs hover:bg-gray-300 flex-shrink-0"
          onClick={cancelEditingField}
        >
          إلغاء
        </button>
      </div>
    ) :
    // ---------------------------------------------------------
    // 5.7. الحالة الخاصة: حقل الراتب (أرقام فقط، حد أقصى 5 خانات)
    // ---------------------------------------------------------
    (key === 'salary' || key === 'Salary') ? (
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
          value={editingField?.value ?? ''}
          onChange={(e) => {
            // السماح بأرقام فقط
            let filteredValue = e.target.value.replace(/[^0-9]/g, '');
            // حد أقصى 5 خانات
            if (filteredValue.length > 5) {
              filteredValue = filteredValue.slice(0, 5);
            }
            setEditingField((prev) =>
              prev ? { ...prev, value: filteredValue } : prev
            );
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              saveEditingField();
            }
          }}
          placeholder="أرقام فقط (حد أقصى 5)"
          maxLength={5}
        />
        <button
          type="button"
          className="px-3 py-1 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 flex-shrink-0"
          onClick={saveEditingField}
        >
          حفظ
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded-md bg-gray-200 text-gray-800 text-xs hover:bg-gray-300 flex-shrink-0"
          onClick={cancelEditingField}
        >
          إلغاء
        </button>
      </div>
    ) :
    // ---------------------------------------------------------
    // 5.8. الحالة الخاصة: حقول المهارات المباشرة (CookingLevel, WashingLevel, إلخ)
    // ---------------------------------------------------------
    (key === 'CookingLevel' || key === 'cookingLevel' || key === 'cooking_level' ||
     key === 'WashingLevel' || key === 'washingLevel' || key === 'washing_level' ||
     key === 'IroningLevel' || key === 'ironingLevel' || key === 'ironing_level' ||
     key === 'CleaningLevel' || key === 'cleaningLevel' || key === 'cleaning_level' ||
     key === 'SewingLevel' || key === 'sewingLevel' || key === 'sewing_level' ||
     key === 'ChildcareLevel' || key === 'childcareLevel' || key === 'childcare_level' ||
     key === 'ElderlycareLevel' || key === 'elderlycareLevel' || key === 'elderlycare_level' ||
     key === 'BabySitterLevel' || key === 'babySitterLevel' || key === 'baby_sitter_level') ? (
      <div className="flex items-center gap-2">
        <div className="relative w-full">
          <select
            style={{ 
              backgroundImage: 'none', 
              WebkitAppearance: 'none', 
              MozAppearance: 'none', 
              appearance: 'none' 
            }}
            className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right bg-white"
            value={editingField?.value ?? ''}
            onChange={(e) =>
              setEditingField((prev) =>
                prev ? { ...prev, value: e.target.value } : prev
              )
            }
          >
            <option value="">اختر المستوى</option>
            {skillLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
        <button
          type="button"
          className="px-3 py-1 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 flex-shrink-0"
          onClick={saveEditingField}
        >
          حفظ
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded-md bg-gray-200 text-gray-800 text-xs hover:bg-gray-300 flex-shrink-0"
          onClick={cancelEditingField}
        >
          إلغاء
        </button>
      </div>
    ) :
    // ---------------------------------------------------------
    // 5.9. الحالة الخاصة: حقول اللغات (ArabicLevel, EnglishLevel)
    // ---------------------------------------------------------
    (key === 'arabicLevel' || key === 'arabic_level' || key === 'ArabicLevel' || 
     key === 'ArabicLanguageLeveL' || key === 'arabicLanguageLevel' ||
     key === 'englishLevel' || key === 'english_level' || key === 'EnglishLevel' || 
     key === 'EnglishLanguageLevel' || key === 'englishLanguageLevel') ? (
      <div className="flex items-center gap-2">
        <div className="relative w-full">
          <select
            style={{ 
              backgroundImage: 'none', 
              WebkitAppearance: 'none', 
              MozAppearance: 'none', 
              appearance: 'none' 
            }}
            className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right bg-white"
            value={editingField?.value ?? ''}
            onChange={(e) =>
              setEditingField((prev) =>
                prev ? { ...prev, value: e.target.value } : prev
              )
            }
          >
            <option value="">اختر المستوى</option>
            {skillLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
        <button
          type="button"
          className="px-3 py-1 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 flex-shrink-0"
          onClick={saveEditingField}
        >
          حفظ
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded-md bg-gray-200 text-gray-800 text-xs hover:bg-gray-300 flex-shrink-0"
          onClick={cancelEditingField}
        >
          إلغاء
        </button>
      </div>
    ) :
    // ---------------------------------------------------------
    // 5. الحالة الخامسة: باقي الحقول (مربع نص عادي)
    // ---------------------------------------------------------
    (
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
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
          className="px-3 py-1 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 flex-shrink-0"
          onClick={saveEditingField}
        >
          حفظ
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded-md bg-gray-200 text-gray-800 text-xs hover:bg-gray-300 flex-shrink-0"
          onClick={cancelEditingField}
        >
          إلغاء
        </button>
      </div>
    )
  ) : (
    // ---------------------------------------------------------
    // وضع العرض (Display Mode)
    // ---------------------------------------------------------
    (() => {
      // التحقق من القيم المستخرجة للحقول التي يجب أن تكون قوائم اختيار
      let isValidValue = true;
      let shouldHideValue = false;
      
      // التحقق من religion
      if ((key === 'religion' || key === 'Religion') && displayValue) {
        isValidValue = isValueInOptions(String(displayValue), religionOptions);
        if (!isValidValue) {
          shouldHideValue = true;
        }
      }
      
      // التحقق من maritalStatus
      if ((key === 'maritalStatus' || key === 'marital_status' || key === 'MaritalStatus' || key === 'maritalstatus') && displayValue) {
        isValidValue = isValueInOptions(String(displayValue), maritalStatusOptions);
        if (!isValidValue) {
          shouldHideValue = true;
        }
      }
      
      // التحقق من educationLevel
      if ((key === 'educationLevel' || key === 'education_level' || key === 'EducationLevel' || key === 'education' || key === 'Education') && displayValue) {
        isValidValue = isValueInOptions(String(displayValue), educationOptions);
        if (!isValidValue) {
          shouldHideValue = true;
        }
      }
      
      // التحقق من skills (skill_*)
      if (key.startsWith('skill_') && displayValue) {
        isValidValue = isValueInOptions(String(displayValue), skillLevels);
        if (!isValidValue) {
          shouldHideValue = true;
        }
      }
      
      // التحقق من languages (lang_*)
      if (key.startsWith('lang_') && displayValue) {
        isValidValue = isValueInOptions(String(displayValue), skillLevels);
        if (!isValidValue) {
          shouldHideValue = true;
        }
      }
      
      // إذا كانت القيمة غير صحيحة، استبدل displayValue بقيمة فارغة للعرض
      const finalDisplayValue = shouldHideValue ? '' : displayValue;
      
      // التحقق من الطول والوزن وإظهار التحذيرات
      const isHeightField = (key === 'height' || key === 'Height');
      const isWeightField = (key === 'weight' || key === 'Weight');
      
      let heightWarning: { show: boolean; isFeet?: boolean; convertedValue?: number } = { show: false };
      let weightWarning: { show: boolean; isPounds?: boolean; convertedValue?: number } = { show: false };
      
      if (isHeightField && finalDisplayValue) {
        const unit = detectHeightUnit(String(finalDisplayValue));
        const heightValidation = validateHeight(String(finalDisplayValue));
        
        // إظهار التحذير إذا كانت القيمة بالقدم أو خارج النطاق
        if (unit === 'feet' || !heightValidation.isValid) {
          const convertedCm = unit === 'feet' ? convertFeetToCm(String(finalDisplayValue)) : undefined;
          heightWarning = {
            show: true,
            isFeet: unit === 'feet',
            convertedValue: convertedCm
          };
        }
      }
      
      if (isWeightField && finalDisplayValue) {
        const unit = detectWeightUnit(String(finalDisplayValue));
        const weightValidation = validateWeight(String(finalDisplayValue));
        
        // إظهار التحذير إذا كانت القيمة بالرطل أو خارج النطاق
        if (unit === 'pounds' || !weightValidation.isValid) {
          const convertedKg = unit === 'pounds' ? convertPoundsToKg(String(finalDisplayValue)) : undefined;
          weightWarning = {
            show: true,
            isPounds: unit === 'pounds',
            convertedValue: convertedKg
          };
        }
      }
      
      const handleHeightConversion = () => {
        if (heightWarning.convertedValue && processingResult) {
          const updatedData = { ...processingResult.geminiData.jsonResponse };
          updatedData.height = String(heightWarning.convertedValue);
          updatedData.Height = String(heightWarning.convertedValue);
          setProcessingResult({
            ...processingResult,
            geminiData: { jsonResponse: updatedData }
          });
        }
      };
      
      const handleWeightConversion = () => {
        if (weightWarning.convertedValue && processingResult) {
          const updatedData = { ...processingResult.geminiData.jsonResponse };
          updatedData.weight = String(weightWarning.convertedValue);
          updatedData.Weight = String(weightWarning.convertedValue);
          setProcessingResult({
            ...processingResult,
            geminiData: { jsonResponse: updatedData }
          });
        }
      };
      
      return (
        <div className="flex flex-col gap-2">
          {/* التحذيرات */}
          {heightWarning.show && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-right">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  {heightWarning.isFeet ? (
                    <p className="text-xs text-red-700">
                      ⚠️ القيمة مكتوبة بالقدم. القيمة المحولة: {heightWarning.convertedValue} سم
                    </p>
                  ) : (
                    <p className="text-xs text-red-700">
                      ⚠️ يرجى التحقق من قيمة الطول - قد تكون غير صحيحة
                    </p>
                  )}
                </div>
                {heightWarning.isFeet && heightWarning.convertedValue && (
                  <button
                    type="button"
                    onClick={handleHeightConversion}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex-shrink-0"
                  >
                    تحويل للسم
                  </button>
                )}
              </div>
            </div>
          )}
          
          {weightWarning.show && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-right">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  {weightWarning.isPounds ? (
                    <p className="text-xs text-red-700">
                      ⚠️ القيمة مكتوبة بالرطل. القيمة المحولة: {weightWarning.convertedValue} كجم
                    </p>
                  ) : (
                    <p className="text-xs text-red-700">
                      ⚠️ يرجى التحقق من قيمة الوزن - قد تكون غير صحيحة
                    </p>
                  )}
                </div>
                {weightWarning.isPounds && weightWarning.convertedValue && (
                  <button
                    type="button"
                    onClick={handleWeightConversion}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex-shrink-0"
                  >
                    تحويل للكجم
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* عرض القيمة */}
          {key === 'office_name' || key === 'OfficeName' || key === 'company_name' || key === 'CompanyName' ||
           displayKey === 'office_name' || displayKey === 'OfficeName' || displayKey === 'company_name' || displayKey === 'CompanyName' ||
           key.toLowerCase().includes('office') || key.toLowerCase().includes('company') ||
           displayKey?.toLowerCase().includes('office') || displayKey?.toLowerCase().includes('company') ? (
            <div className="flex items-center justify-between gap-2">
              <span className={(!finalDisplayValue || finalDisplayValue === 'null' || finalDisplayValue === 'undefined' || String(finalDisplayValue).trim() === '') ? 'text-gray-400 italic text-sm' : ''}>
                {(!finalDisplayValue || finalDisplayValue === 'null' || finalDisplayValue === 'undefined' || String(finalDisplayValue).trim() === '') ? '(فارغ - اضغط للتعديل لإضافة البيانات)' : renderValue(finalDisplayValue, key)}
              </span>
              <button
                type="button"
                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 text-xs font-medium transition-all duration-200 hover:scale-110"
                onClick={() => startEditingField(key, displayValue)}
                title={(!finalDisplayValue || finalDisplayValue === 'null' || finalDisplayValue === 'undefined' || String(finalDisplayValue).trim() === '') ? 'إضافة بيانات' : 'تعديل الحقل'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                <span className="hidden sm:inline">{(!finalDisplayValue || finalDisplayValue === 'null' || finalDisplayValue === 'undefined' || String(finalDisplayValue).trim() === '') ? 'إضافة' : 'تعديل'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className={(!finalDisplayValue || finalDisplayValue === 'null' || finalDisplayValue === 'undefined' || String(finalDisplayValue).trim() === '') ? 'text-gray-400 italic text-sm' : ''}>
                {(!finalDisplayValue || finalDisplayValue === 'null' || finalDisplayValue === 'undefined' || String(finalDisplayValue).trim() === '') ? '(فارغ - اضغط للتعديل لإضافة البيانات)' : renderValue(finalDisplayValue, key)}
              </span>
              {/* إخفاء زر التعديل لـ experienceYears لأنه read-only */}
              {!(key === 'experienceYears' || key === 'experience_years' || key === 'ExperienceYears' || key === 'years_of_experience') && (
                <button
                  type="button"
                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 text-xs font-medium transition-all duration-200 hover:scale-110"
                  onClick={() => startEditingField(key, displayValue)}
                  title={(!finalDisplayValue || finalDisplayValue === 'null' || finalDisplayValue === 'undefined' || String(finalDisplayValue).trim() === '') ? 'إضافة بيانات' : 'تعديل الحقل'}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  <span className="hidden sm:inline">{(!finalDisplayValue || finalDisplayValue === 'null' || finalDisplayValue === 'undefined' || String(finalDisplayValue).trim() === '') ? 'إضافة' : 'تعديل'}</span>
                </button>
              )}
              {/* عرض نص read-only لـ experienceYears */}
              {(key === 'experienceYears' || key === 'experience_years' || key === 'ExperienceYears' || key === 'years_of_experience') && (
                <span className="text-xs text-gray-500 italic">(يتم التعبئة تلقائياً)</span>
              )}
            </div>
          )}
        </div>
      );
    })()
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
                      {(() => {
                        // بناء كائن الموظف ديناميكياً من جميع البيانات في jsonResponse
                        const jsonResponse = processingResult.geminiData.jsonResponse;
                        const employeeData: any = {
                          id: 0,
                          profileImage: uploadedImageUrls[0] || selectedProfileImage,
                          fullImage: uploadedImageUrls[1] || selectedFullImage,
                        };

                        // معالجة جميع الحقول من jsonResponse
                        Object.entries(jsonResponse).forEach(([key, value]) => {
                          // تخطي company_name من التكرار (سيتم استخدامه لاحقاً)
                          if (key === 'company_name' || key === 'CompanyName') {
                            return;
                          }

                          // معالجة المهارات - توسيعها إلى حقول منفصلة
                          if (key === 'skills') {
                            try {
                              const skills = typeof value === 'string' ? JSON.parse(value as string) : value;
                              if (typeof skills === 'object' && skills !== null) {
                                Object.entries(skills).forEach(([skillKey, skillValue]) => {
                                  const skillField = `skill_${skillKey.toLowerCase()}`;
                                  employeeData[skillField] = skillValue || null;
                                });
                              }
                            } catch {
                              // إذا فشل التحليل، تجاهل
                            }
                            return;
                          }

                          // معالجة اللغات - توسيعها إلى حقول منفصلة
                          if (key === 'languages_spoken') {
                            try {
                              const languages = typeof value === 'string' ? JSON.parse(value as string) : value;
                              if (typeof languages === 'object' && languages !== null) {
                                Object.entries(languages).forEach(([langKey, langValue]) => {
                                  const langField = `lang_${langKey.toLowerCase()}`;
                                  employeeData[langField] = langValue || null;
                                });
                              }
                            } catch {
                              // إذا فشل التحليل، تجاهل
                            }
                            return;
                          }

                          // معالجة الحقول العادية - دعم أسماء متعددة للحقل نفسه
                          const normalizedKey = key.toLowerCase();
                          
                          // اسم
                          if (normalizedKey === 'full_name' || normalizedKey === 'name' || normalizedKey === 'fullname') {
                            if (!employeeData.name) {
                              employeeData.name = value || null;
                            }
                          }
                          // عمر
                          else if (normalizedKey === 'age') {
                            employeeData.age = value || null;
                          }
                          // ديانة
                          else if (normalizedKey === 'religion') {
                            employeeData.religion = value || null;
                          }
                          // الحالة الاجتماعية
                          else if (normalizedKey === 'marital_status' || normalizedKey === 'maritalstatus') {
                            employeeData.maritalStatus = value || null;
                          }
                          // تاريخ الميلاد
                          else if (normalizedKey === 'date_of_birth' || normalizedKey === 'birthdate' || normalizedKey === 'dateofbirth' || normalizedKey === 'birth_date') {
                            if (!employeeData.birthDate) {
                              employeeData.birthDate = value || null;
                            }
                          }
                          // الجنسية
                          else if (normalizedKey === 'nationality') {
                            employeeData.nationality = value || null;
                          }
                          // اسم المكتب
                          else if (normalizedKey === 'office_name' || normalizedKey === 'officename') {
                            // استخدام company_name إذا كان موجوداً، وإلا استخدم office_name
                            const officeValue = jsonResponse.company_name || jsonResponse.CompanyName || value;
                            employeeData.officeName = officeValue || null;
                          }
                          // رقم جواز السفر
                          else if (normalizedKey === 'passport_number' || normalizedKey === 'passportnumber' || normalizedKey === 'passport') {
                            employeeData.passportNumber = value || null;
                          }
                          // تاريخ إصدار الجواز
                          else if (normalizedKey === 'passport_issue_date' || normalizedKey === 'passportstartdate' || normalizedKey === 'passport_start' || normalizedKey === 'passportstart') {
                            employeeData.passportStartDate = value || null;
                          }
                          // تاريخ انتهاء الجواز
                          else if (normalizedKey === 'passport_expiration' || normalizedKey === 'passportenddate' || normalizedKey === 'passport_end' || normalizedKey === 'passportend' || normalizedKey === 'passport_expiry') {
                            employeeData.passportEndDate = value || null;
                          }
                          // مدة العقد
                          else if (normalizedKey === 'contract_duration' || normalizedKey === 'contractduration') {
                            employeeData.contractDuration = value || null;
                          }
                          // الوزن
                          else if (normalizedKey === 'weight') {
                            employeeData.weight = value || null;
                          }
                          // الطول
                          else if (normalizedKey === 'height') {
                            employeeData.height = value || null;
                          }
                          // الراتب
                          else if (normalizedKey === 'salary') {
                            employeeData.salary = value || null;
                          }
                          // إضافة أي حقول أخرى مباشرة (للحقول الإضافية التي قد تكون موجودة)
                          else {
                            // إضافة الحقل مباشرة إذا لم يكن موجوداً بالفعل
                            if (!employeeData[key]) {
                              employeeData[key] = value || null;
                            }
                          }
                        });

                        // التأكد من تعيين officeName من company_name إذا كان موجوداً ولم يتم تعيينه بعد
                        if (!employeeData.officeName && (jsonResponse.company_name || jsonResponse.CompanyName)) {
                          employeeData.officeName = jsonResponse.company_name || jsonResponse.CompanyName || null;
                        }

                        return (
                          <AutomaticPreview employee={employeeData} />
                        );
                      })()}
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
                    <div className="mt-4 p-6 bg-green-50 border-2 border-green-400 rounded-xl shadow-lg animate-fade-in">
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex-1 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-lg font-semibold text-green-800">{saveMessage}</p>
                          </div>
                          <p className="text-sm text-green-600 mt-2">سيتم إعادة تعيين النموذج تلقائياً...</p>
                        </div>
                      </div>
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