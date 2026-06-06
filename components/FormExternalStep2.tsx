import { CheckIcon } from '@heroicons/react/outline';
import { useMemo, useState, useEffect } from 'react';
import Select from 'react-select';
import AlertModal from './AlertModal';
import CityAutocomplete from './CityAutocomplete';

const formatDateToYMD = (val: unknown): string => {
  if (!val || String(val).trim() === '' || String(val).toLowerCase() === 'null' || String(val).toLowerCase() === 'n/a') return '';
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  const dmY = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/.exec(s);
  if (dmY) {
    const d = dmY[1].padStart(2, '0');
    const m = dmY[2].padStart(2, '0');
    const y = dmY[3];
    return `${y}-${m}-${d}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return s;
};

const iataToCityAr: Record<string, string> = {
  'RUH': 'الرياض',
  'JED': 'جدة',
  'MED': 'المدينة المنورة',
  'DMM': 'الدمام',
  'AHB': 'أبها',
  'ELQ': 'القصيم',
  'TUI': 'طريف',
  'TAB': 'تبوك',
  'HIL': 'حائل',
  'GJI': 'جازان',
  'HOF': 'الهفوف',
  'EAM': 'نجران',
  'YNB': 'ينبع',
  'AQI': 'القيصومة',
  'RAE': 'عرعر',
  'AJF': 'الجوف',
  'BHH': 'الباحة',
  'ULH': 'العلا',
  'SHW': 'شرورة',
  'WAE': 'وادي الدواسر',
  'DWD': 'الدوادمي',
  'URY': 'القريات',
  'EJH': 'الوجه',
  'RAH': 'رفحاء',
  'NUM': 'نيوم',
  'DOH': 'الدوحة',
  'DXB': 'دبي',
  'DWC': 'دبي',
  'SHJ': 'الشارقة',
  'AUH': 'أبوظبي',
  'BAH': 'المنامة',
  'KWI': 'الكويت',
  'MCT': 'مسقط',
  'SLL': 'صلالة',
  'CAI': 'القاهرة',
  'HBE': 'الإسكندرية',
  'ALY': 'الإسكندرية',
  'LXR': 'الأقصر',
  'HRG': 'الغردقة',
  'SSH': 'شرم الشيخ',
  'AMM': 'عمان',
  'BEY': 'بيروت',
  'DAM': 'دمشق',
  'BGW': 'بغداد',
  'KBL': 'كابول',
  'SNA': 'صنعاء',
  'ADE': 'عدن',
  'KRT': 'الخرطوم',
  'TUN': 'تونس',
  'ALG': 'الجزائر',
  'CMN': 'الدار البيضاء',
  'RBA': 'الرباط',
  'ADD': 'أديس أبابا',
  'NBO': 'نيروبي',
  'MBA': 'مومباسا',
  'DAR': 'دار السلام',
  'EBB': 'كمبالا',
  'ASM': 'أسمرة',
  'HGA': 'هرجيسا',
  'MGQ': 'مقديشو',
  'DAC': 'دكا',
  'CGP': 'تشيتاجونج',
  'MNL': 'مانيلا',
  'CRK': 'كلارك',
  'CEB': 'سيبو',
  'CMB': 'كولومبو',
  'CGK': 'جاكرتا',
  'SUB': 'سورابايا',
  'KUL': 'كوالالمبور',
  'BKK': 'بانكوك',
  'DMK': 'بانكوك',
  'DEL': 'نيودلهي',
  'BOM': 'مومباي',
  'CCJ': 'كاليكوت',
  'COK': 'كوتشي',
  'MAA': 'تشيناي',
  'HYD': 'حيدر أباد',
  'BLR': 'بنغالور',
  'TRV': 'تريفاندروم',
  'ISB': 'إسلام آباد',
  'LHE': 'لاهور',
  'KHI': 'كراتشي',
  'PEW': 'بيشاور',
  'MUX': 'مولتان',
  'KTM': 'كاتماندو',
};

function resolveIataCity(code: string | null | undefined): string {
  if (!code) return '';
  const clean = code.trim().toUpperCase();
  
  if (iataToCityAr[clean]) {
    return iataToCityAr[clean];
  }
  
  for (const [iata, cityAr] of Object.entries(iataToCityAr)) {
    if (clean.includes(iata) || clean.includes(cityAr.toUpperCase())) {
      return cityAr;
    }
  }

  const engToArCities: Record<string, string> = {
    'ADDIS ABABA': 'أديس أبابا',
    'DOHA': 'الدوحة',
    'RIYADH': 'الرياض',
    'JEDDAH': 'جدة',
    'MADINAH': 'المدينة المنورة',
    'MEDINA': 'المدينة المنورة',
    'DAMMAM': 'الدمام',
    'CAIRO': 'القاهرة',
    'DUBAI': 'دبي',
    'MANILA': 'مانيلا',
    'DHAKA': 'دكا',
    'COLOMBO': 'كولومبو',
    'JAKARTA': 'جاكرتا',
    'NATIVE': 'الرياض',
  };

  for (const [eng, ar] of Object.entries(engToArCities)) {
    if (clean.includes(eng)) {
      return ar;
    }
  }

  return code;
}

function convert12hTo24h(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  const cleanStr = timeStr.trim().toUpperCase();
  
  const isPm = cleanStr.includes('PM') || cleanStr.includes('م');
  const isAm = cleanStr.includes('AM') || cleanStr.includes('ص');
  
  const match = /(\d{1,2}):(\d{2})/.exec(cleanStr);
  if (!match) return cleanStr;
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  
  if (isPm && hours < 12) hours += 12;
  if (isAm && hours === 12) hours = 0;
  
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

const arabicRegionMap: { [key: string]: string } = {
  'Riyadh': 'الرياض',
  'Al-Kharj': 'الخرج',
  'Ad Diriyah': 'الدرعية',
  'Al Majma\'ah': 'المجمعة',
  'Al Zulfi': 'الزلفي',
  'Ad Dawadimi': 'الدوادمي',
  'Wadi Ad Dawasir': 'وادي الدواسر',
  'Afif': 'عفيف',
  'Al Quway\'iyah': 'القويعية',
  'Shaqra': 'شقراء',
  'Hotat Bani Tamim': 'حوطة بني تميم',
  'Makkah': 'مكة المكرمة',
  'Jeddah': 'جدة',
  'Taif': 'الطائف',
  'Rabigh': 'رابغ',
  'Al Qunfudhah': 'القنفذة',
  'Al Lith': 'الليث',
  'Khulais': 'خليص',
  'Ranyah': 'رنية',
  'Turabah': 'تربة',
  'Madinah': 'المدينة المنورة',
  'Yanbu': 'ينبع',
  'Al Ula': 'العلا',
  'Badr': 'بدر',
  'Al Hinakiyah': 'الحناكية',
  'Mahd Al Dhahab': 'مهد الذهب',
  'Dammam': 'الدمام',
  'Al Khobar': 'الخبر',
  'Dhahran': 'الظهران',
  'Al Ahsa': 'الأحساء',
  'Al Hufuf': 'الهفوف',
  'Al Mubarraz': 'المبرز',
  'Jubail': 'الجبيل',
  'Hafr Al Batin': 'حفر الباطن',
  'Al Khafji': 'الخفجي',
  'Ras Tanura': 'رأس تنورة',
  'Qatif': 'القطيف',
  'Abqaiq': 'بقيق',
  'Nairiyah': 'النعيرية',
  'Qaryat Al Ulya': 'قرية العليا',
  'Buraydah': 'بريدة',
  'Unaizah': 'عنيزة',
  'Ar Rass': 'الرس',
  'Al Bukayriyah': 'البكيرية',
  'Al Badaye': 'البدائع',
  'Al Mithnab': 'المذنب',
  'Riyad Al Khabra': 'رياض الخبراء',
  'Abha': 'أبها',
  'Khamis Mushait': 'خميس مشيط',
  'Bisha': 'بيشة',
  'Mahayil': 'محايل عسير',
  'Al Namas': 'النماص',
  'Tanomah': 'تنومة',
  'Ahad Rafidah': 'أحد رفيدة',
  'Sarat Abidah': 'سراة عبيدة',
  'Balqarn': 'بلقرن',
  'Tabuk': 'تبوك',
  'Duba': 'ضباء',
  'Al Wajh': 'الوجه',
  'Umluj': 'أملج',
  'Tayma': 'تيماء',
  'Haqi': 'حقل',
  'Hail': 'حائل',
  'Baqa': 'بقعاء',
  'Al Ghazalah': 'الغزالة',
  'Arar': 'عرعر',
  'Rafha': 'رفحاء',
  'Turaif': 'طريف',
  'Jazan': 'جازان',
  'Sabya': 'صبيا',
  'Abu Arish': 'أبو عريش',
  'Samtah': 'صامطة',
  'Baish': 'بيش',
  'Ad Darb': 'الدرب',
  'Al Aridah': 'العارضة',
  'Fifa': 'فيفاء',
  'Najran': 'نجران',
  'Sharurah': 'شرورة',
  'Hubuna': 'حبونا',
  'Al Baha': 'الباحة',
  'Baljurashi': 'بلجرشي',
  'Al Mandq': 'المندق',
  'Al Makhwah': 'المخواة',
  'Qilwah': 'قلوة',
  'Sakaka': 'سكاكا',
  'Dumat Al Jandal': 'دومة الجندل',
  'Al Qurayyat': 'القريات',
  'Tabarjal': 'طبرجل'
};

const matchRegionKey = (cityName: string): string => {
  if (!cityName) return '';
  const cleanName = cityName.trim().toLowerCase();
  
  for (const key of Object.keys(arabicRegionMap)) {
    if (key.toLowerCase() === cleanName) {
      return key;
    }
  }
  
  for (const [key, value] of Object.entries(arabicRegionMap)) {
    if (value.trim() === cityName.trim() || value.toLowerCase().includes(cleanName) || cleanName.includes(value.toLowerCase())) {
      return key;
    }
  }
  
  return cityName;
};

interface FormStepExternal2Props {
  onPrevious: () => void;
  onClose: () => void;
  data: any;
}

export default function FormStepExternal2({ onPrevious, onClose, data }: FormStepExternal2Props) {
  const arabicRegionMap: { [key: string]: string } = {
     'Riyadh': 'الرياض',
    'Al-Kharj': 'الخرج',
    'Ad Diriyah': 'الدرعية',
    'Al Majma\'ah': 'المجمعة',
    'Al Zulfi': 'الزلفي',
    'Ad Dawadimi': 'الدوادمي',
    'Wadi Ad Dawasir': 'وادي الدواسر',
    'Afif': 'عفيف',
    'Al Quway\'iyah': 'القويعية',
    'Shaqra': 'شقراء',
    'Hotat Bani Tamim': 'حوطة بني تميم',

    'Makkah': 'مكة المكرمة',
    'Jeddah': 'جدة',
    'Taif': 'الطائف',
    'Rabigh': 'رابغ',
    'Al Qunfudhah': 'القنفذة',
    'Al Lith': 'الليث',
    'Khulais': 'خليص',
    'Ranyah': 'رنية',
    'Turabah': 'تربة',

    'Madinah': 'المدينة المنورة',
    'Yanbu': 'ينبع',
    'Al Ula': 'العلا',
    'Badr': 'بدر',
    'Al Hinakiyah': 'الحناكية',
    'Mahd Al Dhahab': 'مهد الذهب',

    'Dammam': 'الدمام',
    'Al Khobar': 'الخبر',
    'Dhahran': 'الظهران',
    'Al Ahsa': 'الأحساء',
    'Al Hufuf': 'الهفوف',
    'Al Mubarraz': 'المبرز',
    'Jubail': 'الجبيل',
    'Hafr Al Batin': 'حفر الباطن',
    'Al Khafji': 'الخفجي',
    'Ras Tanura': 'رأس تنورة',
    'Qatif': 'القطيف',
    'Abqaiq': 'بقيق',
    'Nairiyah': 'النعيرية',
    'Qaryat Al Ulya': 'قرية العليا',

    'Buraydah': 'بريدة',
    'Unaizah': 'عنيزة',
    'Ar Rass': 'الرس',
    'Al Bukayriyah': 'البكيرية',
    'Al Badaye': 'البدائع',
    'Al Mithnab': 'المذنب',
    'Riyad Al Khabra': 'رياض الخبراء',

    'Abha': 'أبها',
    'Khamis Mushait': 'خميس مشيط',
    'Bisha': 'بيشة',
    'Mahayil': 'محايل عسير',
    'Al Namas': 'النماص',
    'Tanomah': 'تنومة',
    'Ahad Rafidah': 'أحد رفيدة',
    'Sarat Abidah': 'سراة عبيدة',
    'Balqarn': 'بلقرن',

    'Tabuk': 'تبوك',
    'Duba': 'ضباء',
    'Al Wajh': 'الوجه',
    'Umluj': 'أملج',
    'Tayma': 'تيماء',
    'Haqi': 'حقل',

    'Hail': 'حائل',
    'Baqa': 'بقعاء',
    'Al Ghazalah': 'الغزالة',

    'Arar': 'عرعر',
    'Rafha': 'رفحاء',
    'Turaif': 'طريف',

    'Jazan': 'جازان',
    'Sabya': 'صبيا',
    'Abu Arish': 'أبو عريش',
    'Samtah': 'صامطة',
    'Baish': 'بيش',
    'Ad Darb': 'الدرب',
    'Al Aridah': 'العارضة',
    'Fifa': 'فيفاء',

    'Najran': 'نجران',
    'Sharurah': 'شرورة',
    'Hubuna': 'حبونا',

    'Al Baha': 'الباحة',
    'Baljurashi': 'بلجرشي',
    'Al Mandq': 'المندق',
    'Al Makhwah': 'المخواة',
    'Qilwah': 'قلوة',

    'Sakaka': 'سكاكا',
    'Dumat Al Jandal': 'دومة الجندل',
    'Al Qurayyat': 'القريات',
    'Tabarjal': 'طبرجل'
  };

  
  const convertToArabicRegion = (region: string) => {
    return arabicRegionMap[region] || region;
  };

  const saudiCityOptions = useMemo(
    () =>
      Object.keys(arabicRegionMap).map((region) => ({
        value: region,
        label: convertToArabicRegion(region),
      })),
    // arabicRegionMap ثابتة داخل هذا الكومبوننت
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const getCitySelectStyles = (hasError: boolean) => ({
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: '#f9fafb', // bg-gray-50
      border: hasError ? '1px solid #ef4444' : '1px solid #d1d5db', // red-500 / gray-300
      borderRadius: '0.25rem',
      minHeight: '40px',
      boxShadow: state.isFocused ? (hasError ? '0 0 0 1px #ef4444' : '0 0 0 1px #115e59') : 'none',
      '&:hover': {
        border: hasError ? '1px solid #ef4444' : '1px solid #9ca3af',
      },
      direction: 'rtl' as const,
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      padding: '0 12px',
    }),
    input: (provided: any) => ({
      ...provided,
      margin: 0,
      padding: 0,
    }),
    placeholder: (provided: any) => ({
      ...provided,
      textAlign: 'right' as const,
      direction: 'rtl' as const,
      color: '#6b7280', // text-gray-500
    }),
    singleValue: (provided: any) => ({
      ...provided,
      textAlign: 'right' as const,
      direction: 'rtl' as const,
      color: '#1f2937',
    }),
    menuPortal: (provided: any) => ({
      ...provided,
      zIndex: 9999,
    }),
    menu: (provided: any) => ({
      ...provided,
      textAlign: 'right' as const,
      direction: 'rtl' as const,
      zIndex: 9999,
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      textAlign: 'right' as const,
      direction: 'rtl' as const,
      backgroundColor: state.isSelected ? '#115e59' : state.isFocused ? '#f0fdfa' : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      '&:hover': {
        backgroundColor: state.isSelected ? '#115e59' : '#f0fdfa',
      },
    }),
  });

  const [formData, setFormData] = useState({
    externaldeparatureCity: '',
    externalReason: '',
    externalArrivalCity: '',
    externalArrivalCityDate: '',
    externalArrivalCityTime: '',
    externaldeparatureDate: '',
    externaldeparatureTime: '',
    notes: '',
    deliveryOfficer: ''
  });

  const [errors, setErrors] = useState({
    externaldeparatureCity: '',
    externalReason: '',
    externalArrivalCity: '',
    externalArrivalCityDate: '',
    externalArrivalCityTime: '',
    externaldeparatureDate: '',
    externaldeparatureTime: '',
    internalTicketFile: ''
  });

  const [uploadError, setUploadError] = useState('');
  const [fileUploaded, setFileUploaded] = useState(false);
  const [internalTicketFile, setInternalTicketFile] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [alertMessage, setAlertMessage] = useState('');
  const [users, setUsers] = useState<Array<{id: number, username: string}>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const userOptions = useMemo(
    () => users.map((user) => ({ value: user.username, label: user.username })),
    [users]
  );

  useEffect(() => {
    if (data) {
      setFormData({
        externaldeparatureCity: data.externaldeparatureCity || '',
        externalReason: data.externalReason || '',
        externalArrivalCity: data.externalArrivalCity || '',
        externalArrivalCityDate: data.externalArrivalCityDate ? data.externalArrivalCityDate.split('T')[0] : '',
        externalArrivalCityTime: data.externalArrivalCityTime || '',
        externaldeparatureDate: data.externaldeparatureDate ? data.externaldeparatureDate.split('T')[0] : '',
        externaldeparatureTime: data.externaldeparatureTime || '',
        notes: data.notes || '',
        deliveryOfficer: data.deliveryOfficer || ''
      });
      if (data.externalTicketFile) {
        setInternalTicketFile(data.externalTicketFile);
        setFileUploaded(true);
      }
    }
  }, [data]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await fetch('/api/usersfortask');
        if (response.ok) {
          const userData = await response.json();
          setUsers(userData);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Regular expressions for validation
  const cityRegex = /^[a-zA-Z\s\u0600-\u06FF]+$/; // Allows letters and Arabic characters, no numbers or special chars
  const reasonRegex = /^[a-zA-Z0-9\s\u0600-\u06FF.,-]+$/; // Allows letters, numbers, Arabic, and some punctuation
  const maxFileSize = 5 * 1024 * 1024; // 5MB max file size

  // File upload handler with enhanced validation
  const handleTicketFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setUploadError('لم يتم اختيار ملف');
      setErrors(prev => ({ ...prev, internalTicketFile: 'يجب رفع ملف التذكرة' }));
      setFileUploaded(false);
      setIsUploading(false);
      setFileName('');
      return;
    }

    const file = files[0];
    const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    // Validate file type
    if (!allowedFileTypes.includes(file.type)) {
      setUploadError('نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)');
      setErrors(prev => ({ ...prev, internalTicketFile: 'نوع الملف غير مدعوم' }));
      setFileUploaded(false);
      setIsUploading(false);
      setFileName('');
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setUploadError('حجم الملف كبير جدًا (الحد الأقصى 5 ميجابايت)');
      setErrors(prev => ({ ...prev, internalTicketFile: 'حجم الملف كبير جدًا' }));
      setFileUploaded(false);
      setIsUploading(false);
      setFileName('');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError('');
      setErrors(prev => ({ ...prev, internalTicketFile: '' }));
      setFileUploaded(false);
      setFileName('');
      
      const res = await fetch(`/api/upload-presigned-url/internalTicketFile`);
      if (!res.ok) {
        throw new Error('فشل في الحصول على رابط الرفع');
      }
      const { url, filePath } = await res.json();

      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'x-amz-acl': 'public-read',
          'Content-Type': file.type,
        },
      });

      const runTicketDataExtraction = async (fileToExtract: File) => {
        setExtracting(true);
        setUploadError('');
        try {
          const formDataUpload = new FormData();
          formDataUpload.append('image', fileToExtract, fileToExtract.name);

          const response = await fetch('https://aidoc.rawaes.com/api/extractdatafromtickets', {
            method: 'POST',
            body: formDataUpload,
          });

          let json: Record<string, any> = {};
          try {
            json = await response.json();
          } catch {
            /* ignore */
          }

          if (!response.ok) {
            const msg = json.error || json.providerError || 'فشل استخراج بيانات التذكرة';
            throw new Error(msg);
          }

          const details = json.tickets_details;
          if (!details || typeof details !== 'object') {
            throw new Error('لم يتم العثور على تفاصيل تذكرة صالحة في الملف');
          }

          setFormData((prev) => {
            const newDepartureCity = details.departure_airport 
              ? matchRegionKey(resolveIataCity(String(details.departure_airport))) 
              : prev.externaldeparatureCity;
            const newArrivalCity = details.arrival_airport 
              ? resolveIataCity(String(details.arrival_airport)) 
              : prev.externalArrivalCity;

            return {
              ...prev,
              externaldeparatureCity: newDepartureCity,
              externalArrivalCity: newArrivalCity,
              externaldeparatureDate: details.departure_date ? formatDateToYMD(details.departure_date) : prev.externaldeparatureDate,
              externaldeparatureTime: details.departure_time ? convert12hTo24h(String(details.departure_time)) : prev.externaldeparatureTime,
              externalArrivalCityDate: details.arrival_date ? formatDateToYMD(details.arrival_date) : prev.externalArrivalCityDate,
              externalArrivalCityTime: details.arrival_time ? convert12hTo24h(String(details.arrival_time)) : prev.externalArrivalCityTime,
            };
          });

          setAlertMessage('تم استخراج بيانات التذكرة وتعبئتها بنجاح عن طريق الذكاء الاصطناعي!');
          setAlertType('success');
          setShowAlert(true);
        } catch (e: any) {
          console.error(e);
          setUploadError(e.message || 'حدث خطأ أثناء استخراج بيانات التذكرة عبر الذكاء الاصطناعي');
        } finally {
          setExtracting(false);
        }
      };

      if (uploadRes.ok) {
        setInternalTicketFile(filePath);
        setFileUploaded(true);
        setFileName(file.name);
        setUploadError('');
        void runTicketDataExtraction(file);
      } else {
        throw new Error('فشل في رفع الملف');
      }
    } catch (error: any) {
      setUploadError(error.message || 'حدث خطأ أثناء رفع الملف');
      setErrors(prev => ({ ...prev, internalTicketFile: 'حدث خطأ أثناء رفع الملف' }));
      setFileUploaded(false);
      setFileName('');
    } finally {
      setIsUploading(false);
    }
  };

  // Enhanced form validation
  const validateForm = () => {
    const newErrors = {
      externaldeparatureCity: '',
      externalReason: '',
      externalArrivalCity: '',
      externalArrivalCityDate: '',
      externalArrivalCityTime: '',
      externaldeparatureDate: '',
      externaldeparatureTime: '',
      internalTicketFile: ''
    };
    let isValid = true;

    // Current date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    // Validate departure city
    if (!formData.externaldeparatureCity.trim()) {
      newErrors.externaldeparatureCity = 'وجهة المغادرة مطلوبة';
      isValid = false;
    } 

    // Validate reason
    if (!formData.externalReason.trim()) {
      newErrors.externalReason = 'سبب المغادرة مطلوب';
      isValid = false;
    } else if (!reasonRegex.test(formData.externalReason.trim())) {
      newErrors.externalReason = 'سبب المغادرة يحتوي على أحرف غير صالحة';
      isValid = false;
    } else if (formData.externalReason.trim().length < 5) {
      newErrors.externalReason = 'سبب المغادرة يجب أن يكون 5 أحرف على الأقل';
      isValid = false;
    }

    // Validate arrival city
    if (!formData.externalArrivalCity.trim()) {
      newErrors.externalArrivalCity = 'وجهة الوصول مطلوبة';
      isValid = false;
    }

    // Validate departure date
    if (!formData.externaldeparatureDate) {
      newErrors.externaldeparatureDate = 'تاريخ المغادرة مطلوب';
      isValid = false;
    } else {
      const departureDate = new Date(formData.externaldeparatureDate);
      if (isNaN(departureDate.getTime())) {
        newErrors.externaldeparatureDate = 'تاريخ المغادرة غير صالح';
        isValid = false;
      } else if (departureDate < today) {
        newErrors.externaldeparatureDate = 'تاريخ المغادرة لا يمكن أن يكون في الماضي';
        isValid = false;
      }
    }

    // Validate departure time
    if (!formData.externaldeparatureTime) {
      newErrors.externaldeparatureTime = 'وقت المغادرة مطلوب';
      isValid = false;
    }

    // Validate arrival date
    if (!formData.externalArrivalCityDate) {
      newErrors.externalArrivalCityDate = 'تاريخ الوصول مطلوب';
      isValid = false;
    } else {
      const arrivalDate = new Date(formData.externalArrivalCityDate);
      const departureDate = new Date(formData.externaldeparatureDate);
      if (isNaN(arrivalDate.getTime())) {
        newErrors.externalArrivalCityDate = 'تاريخ الوصول غير صالح';
        isValid = false;
      } else if (arrivalDate < departureDate) {
        newErrors.externalArrivalCityDate = 'تاريخ الوصول لا يمكن أن يكون قبل تاريخ المغادرة';
        isValid = false;
      }
    }

    // Validate arrival time
    if (!formData.externalArrivalCityTime) {
      newErrors.externalArrivalCityTime = 'وقت الوصول مطلوب';
      isValid = false;
    } else if (
      formData.externaldeparatureDate === formData.externalArrivalCityDate &&
      formData.externaldeparatureTime >= formData.externalArrivalCityTime
    ) {
      newErrors.externalArrivalCityTime = 'وقت الوصول يجب أن يكون بعد وقت المغادرة في نفس اليوم';
      isValid = false;
    }

    // Validate file upload
    if (!internalTicketFile) {
      newErrors.internalTicketFile = 'يجب رفع ملف التذكرة';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setAlertType('error');
      setAlertMessage('يرجى تصحيح الأخطاء في النموذج');
      setShowAlert(true);
      return;
    }

    try {
      const postData = await fetch('/api/updatehomemaidarrivalexternalprisma', {
        method: 'POST',
        body: JSON.stringify({
          Orderid: data?.Order?.id,
          id: data?.id,
          externalReason: formData.externalReason.trim(),
          externalTicketFile: internalTicketFile,
          notes: formData.notes.trim(),
          externaldeparatureDate: formData.externaldeparatureDate,
          externaldeparatureCity: formData.externaldeparatureCity.trim(),
          externaldeparatureTime: formData.externaldeparatureTime,
          externalArrivalCity: formData.externalArrivalCity.trim(),
          externalArrivalCityDate: formData.externalArrivalCityDate,
          externalArrivalCityTime: formData.externalArrivalCityTime,
          deliveryOfficer: formData.deliveryOfficer,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (postData.status === 200) {
        setAlertType('success');
        setAlertMessage('تم الحفظ بنجاح');
        setShowAlert(true);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setAlertType('error');
        setAlertMessage('حدث خطأ أثناء الحفظ');
        setShowAlert(true);
      }
    } catch (error) {
      setAlertType('error');
      setAlertMessage('حدث خطأ أثناء الحفظ');
      setShowAlert(true);
    }
  };

  return (
    <section id="form-step2">
      <h2 className="text-2xl font-normal text-black text-right mb-12">تسجيل مغادرة</h2>
      <div className="flex items-start justify-center mb-12 px-[20%]">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="w-6 h-6 rounded-full flex items-center justify-center border border-teal-800 bg-teal-800">
            <CheckIcon className="w-4 h-4 text-white" />
          </div>
          <span className="text-md text-black whitespace-nowrap">بيانات الطلب</span>
        </div>
        <div className="flex-1 h-px bg-gray-500 mt-3 mx-[-20px]"></div>
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="w-6 h-6 rounded-full flex items-center justify-center border border-teal-800 bg-teal-800 text-white text-md">2</div>
          <span className="text-md text-black whitespace-nowrap">بيانات المغادرة</span>
        </div>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* السطر الأول: سبب المغادرة وبجانبه ارفاق التذكرة */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="departure-reason" className="text-xs text-gray-500 text-right font-inter">سبب المغادرة</label>
            <input 
              type="text" 
              id="departure-reason" 
              className={`bg-gray-50 border ${errors.externalReason ? 'border-red-500' : 'border-gray-300'} rounded text-gray-800 text-md`} 
              value={formData.externalReason} 
              onChange={(e) => setFormData({ ...formData, externalReason: e.target.value })} 
              placeholder="سبب المغادرة" 
            />
            {errors.externalReason && <span className="text-red-500 text-xs text-right">{errors.externalReason}</span>}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="ticket-upload" className="text-xs text-gray-500 text-right font-inter">
              ارفاق التذكرة / مسؤول التوصيل
              {extracting && <span className="text-[10px] text-teal-800 font-tajawal mr-2 animate-pulse">(جاري قراءة البيانات بالذكاء الاصطناعي...)</span>}
            </label>
            <div className="flex gap-2">
              <div className={`flex items-center justify-between bg-gray-50 border ${errors.internalTicketFile ? 'border-red-500' : 'border-gray-300'} rounded p-1 pl-3 overflow-hidden w-[58%] max-w-full`}>
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden max-w-full">
                  {(isUploading || extracting) ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-teal-800 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-md text-gray-500 font-tajawal truncate block overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                        {extracting ? 'جاري استخراج البيانات...' : 'جاري الرفع...'}
                      </span>
                    </>
                  ) : fileUploaded && fileName && internalTicketFile ? (
                    <a 
                      href={internalTicketFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-md text-teal-800 font-tajawal hover:text-teal-900 hover:underline cursor-pointer transition-colors truncate block overflow-hidden text-ellipsis whitespace-nowrap max-w-full"
                    >
                      {fileName}
                    </a>
                  ) : (
                    <span className="text-md text-gray-500 font-tajawal">ارفاق ملف التذكرة</span>
                  )}
                </div>
                <label htmlFor="ticket-upload-btn" className={`bg-teal-800 text-white text-xs font-tajawal px-4 py-2 rounded cursor-pointer ${(isUploading || extracting) ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
                  {(isUploading || extracting) ? 'جاري العمل...' : 'اختيار ملف'}
                </label>
                <input
                  placeholder={fileUploaded ? 'تم رفع الملف بنجاح' : 'ارفاق ملف التذكرة'}
                  type="file"
                  id="ticket-upload-btn"
                  className="hidden"
                  onChange={handleTicketFileChange}
                  disabled={isUploading || extracting}
                />
              </div>
              <div className="w-[42%] text-right">
                <Select
                  classNamePrefix="rs"
                  inputId="delivery-officer"
                  isRtl={true}
                  value={userOptions.find((opt) => opt.value === formData.deliveryOfficer) || null}
                  onChange={(selected: any) => {
                    setFormData({ ...formData, deliveryOfficer: selected ? selected.value : '' });
                  }}
                  options={userOptions}
                  placeholder="مسؤول التوصيل"
                  isClearable
                  isSearchable={true}
                  styles={getCitySelectStyles(false)}
                  menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                  noOptionsMessage={() => 'لا توجد نتائج'}
                  loadingMessage={() => 'جاري البحث...'}
                  isLoading={loadingUsers}
                  components={{ IndicatorSeparator: null }}
                />
              </div>
            </div>
            {(errors.internalTicketFile || uploadError) && (
              <span className="text-red-500 text-xs text-right">{errors.internalTicketFile || uploadError}</span>
            )}
          </div>
        </div>

        {/* السطر الثاني: من وبجانبها تاريخ ووقت المغادرة */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="departure-from" className="text-xs text-gray-500 text-right font-inter">من</label>
            <Select
              classNamePrefix="rs"
              inputId="departure-from"
              isRtl={true}
              value={saudiCityOptions.find((opt) => opt.value === (formData.externaldeparatureCity || '')) || null}
              onChange={(selected: any) => {
                const value = selected ? selected.value : '';
                setFormData({ ...formData, externaldeparatureCity: value });
                setErrors((prev) => ({ ...prev, externaldeparatureCity: '' }));
              }}
              options={saudiCityOptions}
              placeholder="اختر المدينة"
              isClearable
              isSearchable
              styles={getCitySelectStyles(!!errors.externaldeparatureCity)}
              menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
              noOptionsMessage={() => 'لا توجد نتائج'}
              loadingMessage={() => 'جاري البحث...'}

            />
            {errors.externaldeparatureCity && <span className="text-red-500 text-xs text-right">{errors.externaldeparatureCity}</span>}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="departure-date" className="text-xs text-gray-500 text-right font-inter">تاريخ ووقت المغادرة</label>
            <div className="flex gap-2">
              <input 
                type="date" 
                id="departure-date" 
                className={`bg-gray-50 border ${errors.externaldeparatureDate ? 'border-red-500' : 'border-gray-300'} rounded text-gray-800 text-md w-[58%]`} 
                placeholder="ادخل تاريخ المغادرة"  
                value={formData.externaldeparatureDate} 
                onChange={(e) => setFormData({ ...formData, externaldeparatureDate: e.target.value })}
              />
              <input 
                type="time" 
                id="departure-time" 
                className={`bg-gray-50 border ${errors.externaldeparatureTime ? 'border-red-500' : 'border-gray-300'} rounded text-gray-800 text-md w-[42%]`} 
                value={formData.externaldeparatureTime} 
                onChange={(e) => setFormData({ ...formData, externaldeparatureTime: e.target.value })} 
              />
            </div>
            {(errors.externaldeparatureDate || errors.externaldeparatureTime) && (
              <span className="text-red-500 text-xs text-right">
                {errors.externaldeparatureDate || errors.externaldeparatureTime}
              </span>
            )}
          </div>
        </div>

        {/* السطر الثالث: الى وتاريخ ووقت الوصول */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="arrival-destination" className="text-xs text-gray-500 text-right font-inter">الى</label>
            <CityAutocomplete
              value={formData.externalArrivalCity}
              onChange={(value) => {
                setFormData({ ...formData, externalArrivalCity: value });
                setErrors((prev) => ({ ...prev, externalArrivalCity: '' }));
              }}
              placeholder="ابحث عن مدينة"
              className={`bg-gray-50 border ${errors.externalArrivalCity ? 'border-red-500' : 'border-gray-300'} rounded text-gray-800 text-md`}
              error={errors.externalArrivalCity}
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="arrival-date" className="text-xs text-gray-500 text-right font-inter">تاريخ ووقت الوصول</label>
            <div className="flex gap-2">
              <input 
                type="date" 
                id="arrival-date" 
                className={`bg-gray-50 border ${errors.externalArrivalCityDate ? 'border-red-500' : 'border-gray-300'} rounded text-gray-800 text-md w-[58%]`} 
                placeholder="ادخل تاريخ الوصول"  
                value={formData.externalArrivalCityDate} 
                onChange={(e) => setFormData({ ...formData, externalArrivalCityDate: e.target.value })}
              />
              <input 
                type="time" 
                id="arrival-time" 
                className={`bg-gray-50 border ${errors.externalArrivalCityTime ? 'border-red-500' : 'border-gray-300'} rounded text-gray-800 text-md w-[42%]`} 
                value={formData.externalArrivalCityTime} 
                onChange={(e) => setFormData({ ...formData, externalArrivalCityTime: e.target.value })} 
              />
            </div>
            {(errors.externalArrivalCityDate || errors.externalArrivalCityTime) && (
              <span className="text-red-500 text-xs text-right">
                {errors.externalArrivalCityDate || errors.externalArrivalCityTime}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="additional-notes" className="text-xs text-gray-500 text-right font-inter">ملاحظات اضافية</label>
          <textarea 
            id="additional-notes" 
            className="bg-gray-50 border border-gray-300 rounded text-gray-800 text-md min-h-[60px] resize-y" 
            placeholder="ملاحظات اضافية" 
            value={formData.notes} 
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          ></textarea>
        </div>
        <div className="flex justify-center mt-6 gap-10">
          <button
            type="button"
            onClick={onPrevious}
            className="w-28 py-2 bg-white text-gray-800 text-base border border-teal-800 rounded font-inter"
          >
            السابق
          </button>
          <button
            type="submit"
            className="w-28 py-2 bg-teal-800 text-white text-base rounded font-inter"
          >
            حفظ
          </button>
        </div>
      </form>
      
      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        type={alertType}
        title={alertType === 'success' ? 'نجح الحفظ' : 'خطأ في الحفظ'}
        message={alertMessage}
        autoClose={true}
        autoCloseDelay={3000}
      />
    </section>
  );
}