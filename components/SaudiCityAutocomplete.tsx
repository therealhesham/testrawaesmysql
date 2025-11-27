import React, { useMemo } from 'react';
import Select from 'react-select';

// قائمة بمدن السعودية
const saudiCities = [
  { value: 'الرياض', label: 'الرياض (Riyadh)' },
  { value: 'جدة', label: 'جدة (Jeddah)' },
  { value: 'مكة المكرمة', label: 'مكة المكرمة (Makkah)' },
  { value: 'المدينة المنورة', label: 'المدينة المنورة (Madinah)' },
  { value: 'الدمام', label: 'الدمام (Dammam)' },
  { value: 'الخبر', label: 'الخبر (Al Khobar)' },
  { value: 'الطائف', label: 'الطائف (Taif)' },
  { value: 'بريدة', label: 'بريدة (Buraydah)' },
  { value: 'تبوك', label: 'تبوك (Tabuk)' },
  { value: 'خميس مشيط', label: 'خميس مشيط (Khamis Mushait)' },
  { value: 'حائل', label: 'حائل (Hail)' },
  { value: 'نجران', label: 'نجران (Najran)' },
  { value: 'جازان', label: 'جازان (Jazan)' },
  { value: 'أبها', label: 'أبها (Abha)' },
  { value: 'ينبع', label: 'ينبع (Yanbu)' },
  { value: 'سكاكا', label: 'سكاكا (Sakaka)' },
  { value: 'عرعر', label: 'عرعر (Arar)' },
  { value: 'الباحة', label: 'الباحة (Al Baha)' },
  { value: 'الخرج', label: 'الخرج (Al-Kharj)' },
  { value: 'الدرعية', label: 'الدرعية (Ad Diriyah)' },
  { value: 'المجمعة', label: 'المجمعة (Al Majma\'ah)' },
  { value: 'الزلفي', label: 'الزلفي (Al Zulfi)' },
  { value: 'الدوادمي', label: 'الدوادمي (Ad Dawadimi)' },
  { value: 'وادي الدواسر', label: 'وادي الدواسر (Wadi Ad Dawasir)' },
  { value: 'عفيف', label: 'عفيف (Afif)' },
  { value: 'القويعية', label: 'القويعية (Al Quway\'iyah)' },
  { value: 'شقراء', label: 'شقراء (Shaqra)' },
  { value: 'حوطة بني تميم', label: 'حوطة بني تميم (Hotat Bani Tamim)' },
  { value: 'رابغ', label: 'رابغ (Rabigh)' },
  { value: 'القنفذة', label: 'القنفذة (Al Qunfudhah)' },
  { value: 'الليث', label: 'الليث (Al Lith)' },
  { value: 'خليص', label: 'خليص (Khulais)' },
  { value: 'رنية', label: 'رنية (Ranyah)' },
  { value: 'تربة', label: 'تربة (Turabah)' },
  { value: 'الظهران', label: 'الظهران (Dhahran)' },
  { value: 'الأحساء', label: 'الأحساء (Al Ahsa)' },
  { value: 'الهفوف', label: 'الهفوف (Al Hufuf)' },
  { value: 'المبرز', label: 'المبرز (Al Mubarraz)' },
  { value: 'الجبيل', label: 'الجبيل (Jubail)' },
  { value: 'حفر الباطن', label: 'حفر الباطن (Hafr Al Batin)' },
  { value: 'الخفجي', label: 'الخفجي (Al Khafji)' },
  { value: 'رأس تنورة', label: 'رأس تنورة (Ras Tanura)' },
  { value: 'القطيف', label: 'القطيف (Qatif)' },
  { value: 'بقيق', label: 'بقيق (Abqaiq)' },
  { value: 'النعيرية', label: 'النعيرية (Nairiyah)' },
  { value: 'قرية العليا', label: 'قرية العليا (Qaryat Al Ulya)' },
  { value: 'عنيزة', label: 'عنيزة (Unaizah)' },
  { value: 'الرس', label: 'الرس (Ar Rass)' },
  { value: 'البكيرية', label: 'البكيرية (Al Bukayriyah)' },
  { value: 'البدائع', label: 'البدائع (Al Badaye)' },
  { value: 'المذنب', label: 'المذنب (Al Mithnab)' },
  { value: 'رياض الخبراء', label: 'رياض الخبراء (Riyad Al Khabra)' },
  { value: 'بيشة', label: 'بيشة (Bisha)' },
  { value: 'محايل عسير', label: 'محايل عسير (Mahayil)' },
  { value: 'النماص', label: 'النماص (Al Namas)' },
  { value: 'تنومة', label: 'تنومة (Tanomah)' },
  { value: 'أحد رفيدة', label: 'أحد رفيدة (Ahad Rafidah)' },
  { value: 'سراة عبيدة', label: 'سراة عبيدة (Sarat Abidah)' },
  { value: 'بلقرن', label: 'بلقرن (Balqarn)' },
  { value: 'ضباء', label: 'ضباء (Duba)' },
  { value: 'الوجه', label: 'الوجه (Al Wajh)' },
  { value: 'أملج', label: 'أملج (Umluj)' },
  { value: 'تيماء', label: 'تيماء (Tayma)' },
  { value: 'حقل', label: 'حقل (Haqi)' },
  { value: 'بقعاء', label: 'بقعاء (Baqa)' },
  { value: 'الغزالة', label: 'الغزالة (Al Ghazalah)' },
  { value: 'رفحاء', label: 'رفحاء (Rafha)' },
  { value: 'طريف', label: 'طريف (Turaif)' },
  { value: 'صبيا', label: 'صبيا (Sabya)' },
  { value: 'أبو عريش', label: 'أبو عريش (Abu Arish)' },
  { value: 'صامطة', label: 'صامطة (Samtah)' },
  { value: 'بيش', label: 'بيش (Baish)' },
  { value: 'الدرب', label: 'الدرب (Ad Darb)' },
  { value: 'العارضة', label: 'العارضة (Al Aridah)' },
  { value: 'فيفاء', label: 'فيفاء (Fifa)' },
  { value: 'شرورة', label: 'شرورة (Sharurah)' },
  { value: 'حبونا', label: 'حبونا (Hubuna)' },
  { value: 'بلجرشي', label: 'بلجرشي (Baljurashi)' },
  { value: 'المندق', label: 'المندق (Al Mandq)' },
  { value: 'المخواة', label: 'المخواة (Al Makhwah)' },
  { value: 'قلوة', label: 'قلوة (Qilwah)' },
  { value: 'دومة الجندل', label: 'دومة الجندل (Dumat Al Jandal)' },
  { value: 'القريات', label: 'القريات (Al Qurayyat)' },
  { value: 'طبرجل', label: 'طبرجل (Tabarjal)' },
  { value: 'العلا', label: 'العلا (Al Ula)' },
  { value: 'بدر', label: 'بدر (Badr)' },
  { value: 'الحناكية', label: 'الحناكية (Al Hinakiyah)' },
  { value: 'مهد الذهب', label: 'مهد الذهب (Mahd Al Dhahab)' },
];

interface SaudiCityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

const SaudiCityAutocomplete: React.FC<SaudiCityAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'ابحث عن مدينة سعودية',
  className = '',
  error
}) => {
  const selectedOption = useMemo(() => {
    if (!value) return null;
    const found = saudiCities.find(city => city.value === value);
    // إذا لم تكن المدينة في القائمة، نعيدها كخيار مخصص
    if (!found && value.trim()) {
      return { value: value, label: value };
    }
    return found || null;
  }, [value]);

  const handleChange = (selectedOption: any) => {
    onChange(selectedOption ? selectedOption.value : '');
  };

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      border: error ? '1px solid #ef4444' : '1px solid #d1d5db',
      borderRadius: '0.375rem',
      padding: '0.25rem',
      textAlign: 'right' as const,
      '&:hover': {
        border: error ? '1px solid #ef4444' : '1px solid #9ca3af',
      },
      boxShadow: state.isFocused ? (error ? '0 0 0 1px #ef4444' : '0 0 0 1px #115e59') : 'none',
    }),
    menu: (provided: any) => ({
      ...provided,
      textAlign: 'right' as const,
      zIndex: 9999,
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      textAlign: 'right' as const,
      backgroundColor: state.isSelected
        ? '#115e59'
        : state.isFocused
        ? '#f0fdfa'
        : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      '&:hover': {
        backgroundColor: state.isSelected ? '#115e59' : '#f0fdfa',
      },
    }),
    singleValue: (provided: any) => ({
      ...provided,
      textAlign: 'right' as const,
      direction: 'rtl' as const,
    }),
    input: (provided: any) => ({
      ...provided,
      textAlign: 'right' as const,
      direction: 'rtl' as const,
    }),
    placeholder: (provided: any) => ({
      ...provided,
      textAlign: 'right' as const,
      direction: 'rtl' as const,
    }),
  };

  return (
    <div className="flex flex-col">
      <Select
        value={selectedOption}
        onChange={handleChange}
        options={saudiCities}
        placeholder={placeholder}
        isClearable
        isSearchable
        className={className}
        styles={customStyles}
        dir="rtl"
        noOptionsMessage={() => 'لا توجد نتائج'}
        loadingMessage={() => 'جاري البحث...'}
        filterOption={(option, inputValue) => {
          if (!inputValue) return true;
          const searchTerm = inputValue.toLowerCase();
          const label = option.label.toLowerCase();
          const value = option.value.toLowerCase();
          return label.includes(searchTerm) || value.includes(searchTerm);
        }}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1 text-right">{error}</p>
      )}
    </div>
  );
};

export default SaudiCityAutocomplete;

