import { CheckIcon } from '@heroicons/react/outline';
import { Calendar } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import Select from 'react-select';
import AlertModal from './AlertModal';

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

const levenshteinDistance = (s1: string, s2: string): number => {
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;
  const matrix = [];
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[s2.length][s1.length];
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

  // Fuzzy matching for slight typos in English or Arabic
  let bestMatch = '';
  let minDistance = Infinity;
  // Allow 1 typo for every 4 characters (e.g., length 6 allows 1 typo, length 8 allows 2 typos)
  // Max typos allowed is 3 to prevent completely wrong matches
  const maxAllowedDistance = Math.min(3, Math.max(1, Math.floor(cleanName.length / 4)));

  for (const [key, value] of Object.entries(arabicRegionMap)) {
    const distEng = levenshteinDistance(cleanName, key.toLowerCase());
    const distAr = levenshteinDistance(cleanName, value.toLowerCase());
    const dist = Math.min(distEng, distAr);
    
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = key;
    }
  }
  
  if (minDistance <= maxAllowedDistance && minDistance > 0) {
    return bestMatch;
  }
  
  return '';
};

interface FormStep2Props {
  onPrevious: () => void;
  onClose: () => void;
  data: any;
  onSuccess?: () => void;
}

export default function FormStep2({ onPrevious, onClose, data, onSuccess }: FormStep2Props) {
  const [formData, setFormData] = useState({
    ArrivalCity: '',
    finaldestination: '',
    internalReason: '',
    deparatureTime: '',
    finalDestinationDate: '',
    finalDestinationTime: '',
    deparatureDate: '',
    notes: '',
    deliveryOfficer: ''
  });

  const [errors, setErrors] = useState({
    ArrivalCity: '',
    finaldestination: '',
    internalReason: '',
    deparatureDate: '',
    finalDestinationDate: '',
    internalTicketFile: ''
  });

  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [alertMessage, setAlertMessage] = useState('');
  
  const [internalTicketFile, setInternalTicketFile] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileUploaded, setFileUploaded] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const ticketFileInputRef = useRef<HTMLInputElement>(null);
  const [users, setUsers] = useState<Array<{id: number, username: string}>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({
        ArrivalCity: data.internaldeparatureCity || '',
        finaldestination: data.internalArrivalCity || '',
        internalReason: data.internalReason || '',
        deparatureTime: data.internaldeparatureTime || '',
        finalDestinationDate: data.internalArrivalCityDate ? data.internalArrivalCityDate.split('T')[0] : '',
        finalDestinationTime: data.internalArrivalCityTime || '',
        deparatureDate: data.internaldeparatureDate ? data.internaldeparatureDate.split('T')[0] : '',
        notes: data.notes || '',
        deliveryOfficer: data.deliveryOfficer || ''
      });
      if (data.internalTicketFile) {
        setInternalTicketFile(data.internalTicketFile);
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

  const validateFields = (currentFormData: typeof formData, fieldName?: string) => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      // City validation - المدينتين لا يمكن أن تكونا نفس المدينة
      if (fieldName === 'ArrivalCity' || fieldName === 'finaldestination' || !fieldName) {
        if (currentFormData.ArrivalCity && currentFormData.finaldestination && 
            currentFormData.ArrivalCity === currentFormData.finaldestination) {
          newErrors.finaldestination = 'مدينة الوصول يجب أن تكون مختلفة عن مدينة المغادرة';
        } else if (currentFormData.ArrivalCity !== currentFormData.finaldestination) {
          // Clear error if cities are different
          if (newErrors.finaldestination === 'مدينة الوصول يجب أن تكون مختلفة عن مدينة المغادرة') {
            newErrors.finaldestination = '';
          }
        }
      }

      // Date validation - التواريخ لا يمكن أن تكون من الماضي
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if ((fieldName === 'deparatureDate' || !fieldName) && currentFormData.deparatureDate) {
        const depDate = new Date(currentFormData.deparatureDate);
        depDate.setHours(0, 0, 0, 0);
        if (depDate < today) {
          newErrors.deparatureDate = 'تاريخ المغادرة لا يمكن أن يكون من الماضي';
        } else if (newErrors.deparatureDate === 'تاريخ المغادرة لا يمكن أن يكون من الماضي') {
          newErrors.deparatureDate = '';
        }
      }

      if ((fieldName === 'finalDestinationDate' || !fieldName) && currentFormData.finalDestinationDate) {
        const arrDate = new Date(currentFormData.finalDestinationDate);
        arrDate.setHours(0, 0, 0, 0);
        if (arrDate < today) {
          newErrors.finalDestinationDate = 'تاريخ الوصول لا يمكن أن يكون من الماضي';
        } else if (newErrors.finalDestinationDate === 'تاريخ الوصول لا يمكن أن يكون من الماضي') {
          // Check if there's another validation error first
          const depDate = currentFormData.deparatureDate ? new Date(currentFormData.deparatureDate) : null;
          if (depDate && arrDate >= depDate) {
            newErrors.finalDestinationDate = '';
          } else if (!depDate) {
            newErrors.finalDestinationDate = '';
          }
        }
      }

      // Date validation - تاريخ الوصول يجب أن يكون بعد تاريخ المغادرة
      if ((fieldName === 'deparatureDate' || fieldName === 'finalDestinationDate' || !fieldName) 
          && currentFormData.deparatureDate && currentFormData.finalDestinationDate) {
        const depDate = new Date(currentFormData.deparatureDate);
        const arrDate = new Date(currentFormData.finalDestinationDate);
        if (depDate > arrDate) {
          newErrors.finalDestinationDate = 'تاريخ الوصول يجب أن يكون بعد تاريخ المغادرة';
        } else if (newErrors.finalDestinationDate === 'تاريخ الوصول يجب أن يكون بعد تاريخ المغادرة') {
          // Check if date is not in the past
          const todayOnly = new Date();
          todayOnly.setHours(0, 0, 0, 0);
          arrDate.setHours(0, 0, 0, 0);
          if (arrDate >= todayOnly && arrDate >= depDate) {
            newErrors.finalDestinationDate = '';
          }
        }
      }

      return newErrors;
    });
  };

  const validateForm = () => {
    const newErrors = {
      ArrivalCity: '',
      finaldestination: '',
      internalReason: '',
      deparatureDate: '',
      finalDestinationDate: '',
      internalTicketFile: ''
    };
    let isValid = true;

    // Required field validations
    if (!formData.ArrivalCity.trim()) {
      newErrors.ArrivalCity = 'مدينة المغادرة مطلوبة';
      isValid = false;
    } else if (!arabicRegionMap[formData.ArrivalCity]) {
      newErrors.ArrivalCity = 'يجب اختيار مدينة من القائمة';
      isValid = false;
    }

    if (!formData.finaldestination.trim()) {
      newErrors.finaldestination = 'مدينة الوصول مطلوبة';
      isValid = false;
    } else if (!arabicRegionMap[formData.finaldestination]) {
      newErrors.finaldestination = 'يجب اختيار مدينة من القائمة';
      isValid = false;
    }
    if (!formData.internalReason.trim()) {
      newErrors.internalReason = 'سبب المغادرة مطلوب';
      isValid = false;
    }
    if (!formData.deparatureDate) {
      newErrors.deparatureDate = 'تاريخ المغادرة مطلوب';
      isValid = false;
    }
    if (!formData.finalDestinationDate) {
      newErrors.finalDestinationDate = 'تاريخ الوصول مطلوب';
      isValid = false;
    }
    // if (!internalTicketFile) {
    //   newErrors.internalTicketFile = 'ملف التذكرة مطلوب';
    //   isValid = false;
    // }

    // City validation - المدينتين لا يمكن أن تكونا نفس المدينة
    if (formData.ArrivalCity && formData.finaldestination && formData.ArrivalCity === formData.finaldestination) {
      newErrors.finaldestination = 'مدينة الوصول يجب أن تكون مختلفة عن مدينة المغادرة';
      isValid = false;
    }

    // Date validation - التواريخ لا يمكن أن تكون من الماضي
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    
    if (formData.deparatureDate) {
      const depDate = new Date(formData.deparatureDate);
      depDate.setHours(0, 0, 0, 0);
      if (depDate < today) {
        newErrors.deparatureDate = 'تاريخ المغادرة لا يمكن أن يكون من الماضي';
        isValid = false;
      }
    }

    if (formData.finalDestinationDate) {
      const arrDate = new Date(formData.finalDestinationDate);
      arrDate.setHours(0, 0, 0, 0);
      if (arrDate < today) {
        newErrors.finalDestinationDate = 'تاريخ الوصول لا يمكن أن يكون من الماضي';
        isValid = false;
      }
    }

    // Date validation - تاريخ الوصول يجب أن يكون بعد تاريخ المغادرة
    if (formData.deparatureDate && formData.finalDestinationDate) {
      const depDate = new Date(formData.deparatureDate);
      const arrDate = new Date(formData.finalDestinationDate);
      if (depDate > arrDate) {
        newErrors.finalDestinationDate = 'تاريخ الوصول يجب أن يكون بعد تاريخ المغادرة';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };
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

  const cityOptions = useMemo(
    () =>
      Object.keys(arabicRegionMap).map((region) => ({
        value: region,
        label: convertToArabicRegion(region),
      })),
    // arabicRegionMap ثابتة داخل هذا الكومبوننت، نثبّت الـ options لتقليل إعادة الحساب
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const userOptions = useMemo(
    () => users.map((user) => ({ value: user.username, label: user.username })),
    [users]
  );

  const getCitySelectStyles = (hasError: boolean) => ({
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: '#f9fafb', // bg-gray-50
      border: hasError ? '1px solid #ef4444' : '1px solid #d1d5db', // red-500 / gray-300
      borderRadius: '0.25rem',
      minHeight: '44px',
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
  const handleTicketFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setUploadError('لم يتم اختيار ملف');
      setFileUploaded(false);
      setFileName('');
      setErrors({ ...errors, internalTicketFile: 'لم يتم اختيار ملف' });
      return;
    }

    const file = files[0];
    const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    
    if (!allowedFileTypes.includes(file.type)) {
      setUploadError('نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)');
      setFileUploaded(false);
      setFileName('');
      setErrors({ ...errors, internalTicketFile: 'نوع الملف غير مدعوم' });
      return;
    }

    try {
      setUploadError('');
      setFileName(file.name); // عرض اسم الملف فوراً
      setIsUploading(true); // بدء حالة التحميل
      
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

          let isForeignArrival = false;
          if (details.arrival_airport) {
            const resolvedArrival = resolveIataCity(String(details.arrival_airport));
            const matchedArrival = matchRegionKey(resolvedArrival);
            // If it resolves to something but doesn't match an internal Saudi region
            if (resolvedArrival && !matchedArrival) {
                isForeignArrival = true;
            }
          }

          setFormData((prev) => {
            const newDepartureCity = details.departure_airport 
              ? matchRegionKey(resolveIataCity(String(details.departure_airport))) || prev.ArrivalCity
              : prev.ArrivalCity;
            const newArrivalCity = details.arrival_airport 
              ? matchRegionKey(resolveIataCity(String(details.arrival_airport))) || prev.finaldestination
              : prev.finaldestination;

            return {
              ...prev,
              ArrivalCity: newDepartureCity,
              finaldestination: newArrivalCity,
              deparatureDate: details.departure_date ? formatDateToYMD(details.departure_date) : prev.deparatureDate,
              deparatureTime: details.departure_time ? convert12hTo24h(String(details.departure_time)) : prev.deparatureTime,
              finalDestinationDate: details.arrival_date ? formatDateToYMD(details.arrival_date) : prev.finalDestinationDate,
              finalDestinationTime: details.arrival_time ? convert12hTo24h(String(details.arrival_time)) : prev.finalDestinationTime,
            };
          });

          if (isForeignArrival) {
            setAlertMessage('مدينة الوصول مدينة غير سعودية يرجى تسجيل المغادرة في المغادرة الخارجية');
            setAlertType('error');
          } else {
            setAlertMessage('تم استخراج بيانات التذكرة وتعبئتها بنجاح عن طريق الذكاء الاصطناعي!');
            setAlertType('success');
          }
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
        setUploadError('');
        setErrors({ ...errors, internalTicketFile: '' });
        void runTicketDataExtraction(file);
      } else {
        throw new Error('فشل في رفع الملف');
      }
    } catch (error: any) {
      setUploadError(error.message || 'حدث خطأ أثناء رفع الملف');
      setFileUploaded(false);
      setFileName('');
      setErrors({ ...errors, internalTicketFile: error.message || 'حدث خطأ أثناء رفع الملف' });
    } finally {
      setIsUploading(false); // إنهاء حالة التحميل
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setAlertType('error');
      if (!formData.ArrivalCity || !arabicRegionMap[formData.ArrivalCity] || !formData.finaldestination || !arabicRegionMap[formData.finaldestination]) {
        setAlertMessage('تأكد ان مدينة المغادرة والوصول مدن سعودية');
      } else {
        setAlertMessage('يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
      }
      setShowAlert(true);
      return;
    }

    try {
      const postData = await fetch('/api/updatehomemaidarrivalprisma', {
        method: 'POST',
        body: JSON.stringify({
          Orderid: data?.Order?.id,
          id: data?.id,
          ArrivalCity: formData.ArrivalCity,
          internalReason: formData.internalReason,
          notes: formData.notes,
          deparatureTime: formData.deparatureTime,
          internaldeparatureCity: formData.ArrivalCity,
          internaldeparatureDate: formData.deparatureDate,
          internaldeparatureTime: formData.deparatureTime,
          internalArrivalCity: formData.finaldestination,
          internalArrivalCityDate: formData.finalDestinationDate,
          internalArrivalCityTime: formData.finalDestinationTime,
          internalTicketFile: internalTicketFile,
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
          if (onSuccess) {
            onSuccess();
          }
          onClose();
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
              className={`bg-gray-50 border ${errors.internalReason ? 'border-red-500' : 'border-gray-300'} rounded p-3 text-gray-800 text-md`} 
              value={formData.internalReason} 
              onChange={(e) => setFormData({ ...formData, internalReason: e.target.value })} 
              placeholder="سبب المغادرة" 
            />
            {errors.internalReason && (
              <span className="text-red-500 text-xs text-right">{errors.internalReason}</span>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="ticket-upload" className="text-xs text-gray-500 text-right font-inter">
              ارفاق التذكرة / مسؤول التوصيل
              {extracting && <span className="text-[10px] text-teal-800 font-tajawal mr-2 animate-pulse">(جاري قراءة البيانات بالذكاء الاصطناعي...)</span>}
            </label>
            <div className="flex gap-2">
              <div className={`flex items-center justify-between bg-gray-50 border ${errors.internalTicketFile ? 'border-red-500' : 'border-gray-300'} rounded p-1 pl-3 overflow-hidden w-[58%] max-w-full`}>
                <span className="text-md text-gray-500 font-tajawal flex items-center gap-2 flex-1 min-w-0 overflow-hidden max-w-full">
                  {(isUploading || extracting) && (
                    <svg className="animate-spin h-5 w-5 text-teal-800 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span className="truncate block overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                    {extracting ? 'جاري استخراج البيانات...' : (fileName ? fileName : 'ارفاق ملف التذكرة')}
                  </span>
                </span>
                <label 
                  htmlFor="ticket-upload-btn" 
                  className={`bg-teal-800 text-white text-xs font-tajawal px-4 py-2 rounded ${(isUploading || extracting) ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'} flex-shrink-0 ml-2`}
                >
                  {(isUploading || extracting) ? 'جاري العمل...' : (fileUploaded ? 'تغيير الملف' : 'اختيار ملف')}
                </label>
                <input 
                  type="file" 
                  id="ticket-upload-btn" 
                  className="hidden" 
                  ref={ticketFileInputRef}
                  onChange={handleTicketFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
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
            {errors.internalTicketFile && (
              <span className="text-red-500 text-xs text-right">{errors.internalTicketFile}</span>
            )}
            {uploadError && (
              <span className="text-red-500 text-xs text-right">{uploadError}</span>
            )}
            {fileUploaded && internalTicketFile && (
              <div className="mt-2 text-right">
                <a 
                  href={internalTicketFile} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 text-xs hover:underline"
                >
                  عرض الملف المرفوع
                </a>
              </div>
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
              value={cityOptions.find((opt) => opt.value === (formData.ArrivalCity || '')) || null}
              onChange={(selected: any) => {
                const value = selected ? selected.value : '';
                const newFormData = { ...formData, ArrivalCity: value };
                setFormData(newFormData);
                validateFields(newFormData, 'ArrivalCity');
              }}
              options={cityOptions}
              placeholder="اختر المدينة"
              isClearable
              isSearchable
              styles={getCitySelectStyles(!!errors.ArrivalCity)}
              menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
              noOptionsMessage={() => 'لا توجد نتائج'}
              loadingMessage={() => 'جاري البحث...'}
            />
            {errors.ArrivalCity && (
              <span className="text-red-500 text-xs text-right">{errors.ArrivalCity}</span>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="departure-date" className="text-xs text-gray-500 text-right font-inter">تاريخ ووقت المغادرة</label>
            <div className="flex gap-2">
              <input 
                type="date" 
                id="departure-date" 
                className={`bg-gray-50 border ${errors.deparatureDate ? 'border-red-500' : 'border-gray-300'} rounded p-3 text-gray-800 text-md w-[58%]`} 
                value={formData.deparatureDate} 
                onChange={(e) => {
                  const newFormData = { ...formData, deparatureDate: e.target.value };
                  setFormData(newFormData);
                  validateFields(newFormData, 'deparatureDate');
                }}
              />
              <input 
                type="time" 
                id="departure-time" 
                className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md w-[42%]" 
                value={formData.deparatureTime} 
                onChange={(e) => setFormData({ ...formData, deparatureTime: e.target.value })}
              />
            </div>
            {errors.deparatureDate && (
              <span className="text-red-500 text-xs text-right">{errors.deparatureDate}</span>
            )}
          </div>
        </div>

        {/* السطر الثالث: الى وتاريخ ووقت الوصول */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="arrival-destination" className="text-xs text-gray-500 text-right font-inter">الى</label>
            <Select
              classNamePrefix="rs"
              inputId="arrival-destination"
              isRtl={true}
              value={cityOptions.find((opt) => opt.value === (formData.finaldestination || '')) || null}
              onChange={(selected: any) => {
                const value = selected ? selected.value : '';
                const newFormData = { ...formData, finaldestination: value };
                setFormData(newFormData);
                validateFields(newFormData, 'finaldestination');
              }}
              options={cityOptions}
              placeholder="اختر المدينة"
              isClearable
              isSearchable
              styles={getCitySelectStyles(!!errors.finaldestination)}
              menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
              noOptionsMessage={() => 'لا توجد نتائج'}
              loadingMessage={() => 'جاري البحث...'}
            />
            {errors.finaldestination && (
              <span className="text-red-500 text-xs text-right">{errors.finaldestination}</span>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="arrival-date" className="text-xs text-gray-500 text-right font-inter">تاريخ ووقت الوصول</label>
            <div className="flex gap-2">
              <input 
                type="date" 
                id="arrival-date" 
                className={`bg-gray-50 border ${errors.finalDestinationDate ? 'border-red-500' : 'border-gray-300'} rounded p-3 text-gray-800 text-md w-[58%]`} 
                value={formData.finalDestinationDate} 
                onChange={(e) => {
                  const newFormData = { ...formData, finalDestinationDate: e.target.value };
                  setFormData(newFormData);
                  validateFields(newFormData, 'finalDestinationDate');
                }}
              />
              <input 
                type="time" 
                id="arrival-time" 
                className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md w-[42%]" 
                value={formData.finalDestinationTime} 
                onChange={(e) => setFormData({ ...formData, finalDestinationTime: e.target.value })}
              />
            </div>
            {errors.finalDestinationDate && (
              <span className="text-red-500 text-xs text-right">{errors.finalDestinationDate}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="additional-notes" className="text-xs text-gray-500 text-right font-inter">ملاحظات اضافية</label>
          <textarea 
            id="additional-notes" 
            className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md min-h-[60px] resize-y" 
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