import { useState, useEffect, useMemo } from 'react';

export default function FormStep1({ onNext, id, setId, data, getData }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const warrantyInfo = useMemo(() => {
    if (!data?.KingdomentryDate) {
      return { status: 'غير متوفر', date: '' };
    }

    const entryDate = new Date(data?.KingdomentryDate);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - entryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // تحويل الفرق إلى أيام

    const status = diffDays > 90 ? 'منتهي' : 'ساري';
    const formattedDate = entryDate.toLocaleDateString(); // تنسيق التاريخ بالتقويم الهجري أو حسب الحاجة

    return { status, date: formattedDate, remainingDays: diffDays  };
  }, [data?.KingdomentryDate]);


  const searchOrders = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/orders/suggestions?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      } else {
        console.error('Error searching orders');
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error searching orders:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setId(value);
    
    if (value.trim()) {
      searchOrders(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {


    setId(suggestion);
    setShowSuggestions(false);
    // Auto-fetch data when order is selected
    setTimeout(() => {
      getData(suggestion);
    }, 100);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Close search results when clicking outside - similar to housedarrivals
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <section id="form-step1">
      <h2 className="text-2xl font-normal text-black text-right mb-12">تسجيل مغادرة</h2>
      <div className="flex items-start justify-center mb-12 px-[20%]">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="w-6 h-6 rounded-full flex items-center justify-center border border-teal-800 bg-teal-800 text-white text-md">1</div>
          <span className="text-md text-black whitespace-nowrap">بيانات الطلب</span>
        </div>
        <div className="flex-1 h-px bg-gray-500 mt-3 mx-[-20px]"></div>
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="w-6 h-6 rounded-full flex items-center justify-center border border-teal-800 text-gray-800 text-md">2</div>
          <span className="text-md text-black whitespace-nowrap">بيانات المغادرة</span>
        </div>
      </div>
      <form className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 w-full">
          <label htmlFor="order-number" className="text-xs text-gray-500 text-right font-inter">البحث عن الطلب</label>
          <div className="relative search-container">
            <input 
              type="text" 
              id="order-number" 
              className="w-full p-3 border border-gray-300 rounded-md bg-gray-50" 
              onChange={handleIdChange}
              onBlur={handleInputBlur}
              onFocus={() => id.length >= 1 && setShowSuggestions(true)}
              value={id}
              placeholder="ابحث برقم الطلب أو اسم العميل أو اسم العاملة" 
            />
            {isSearching && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
              </div>
            )}
            
            {/* Search Results Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                  >
                    <div className="font-medium text-md">Order Number #{suggestion} - Name: {data?.Order?.HomeMaid?.Name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="customer-name" className="text-xs text-gray-500 text-right font-inter">اسم العميل</label>
            <input 
              type="text" 
              id="customer-name" 
              className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md" 
              placeholder="اسم العميل" 
              value={data?.Order?.client?.fullname || ""} 
              readOnly 
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="customer-id" className="text-xs text-gray-500 text-right font-inter">هوية العميل</label>
            <input 
              type="text" 
              id="customer-id" 
              className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md" 
              placeholder="هوية العميل" 
              value={data?.Order?.client?.nationalId || ""} 
              readOnly 
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="customer-city" className="text-xs text-gray-500 text-right font-inter">مدينة العميل</label>
            <input 
              type="text" 
              id="customer-city" 
              className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md" 
              placeholder="مدينة العميل" 
              value={data?.Order?.client?.city || ""} 
              readOnly 
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="worker-name" className="text-xs text-gray-500 text-right font-inter">اسم العاملة</label>
            <input 
              type="text" 
              id="worker-name" 
              className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md" 
              placeholder="اسم العاملة" 
              value={data?.Order?.HomeMaid?.Name || ""} 
              readOnly 
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="passport-number" className="text-xs text-gray-500 text-right font-inter">رقم الجواز</label>
            <input 
              type="text" 
              id="passport-number" 
              className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md" 
              placeholder="رقم الجواز"  
              value={data?.Order?.HomeMaid?.Passportnumber || ""} 
              readOnly 
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="nationality" className="text-xs text-gray-500 text-right font-inter">الجنسية</label>
            <input 
              type="text" 
              id="nationality" 
              className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md" 
              placeholder="جنسية العاملة" 
              value={data?.Order?.HomeMaid?.office.Country || ""} 
              readOnly 
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            
      {/* حقل حالة الضمان */}
      <label htmlFor="warranty-status" className="text-xs text-gray-500 text-right font-inter">
        حالة الضمان
      </label>
      <input
        type="text"
        id="warranty-status"
        className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md"
        placeholder="حالة الضمان"
        value={`${warrantyInfo.status}${warrantyInfo.date ? ` - ${warrantyInfo.date}` : ''}`}
        readOnly
      />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="remaining-period" className="text-xs text-gray-500 text-right font-inter">المدة المتبقية</label>
            <input 
              type="text" 
              id="remaining-period" 
              className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md" 
              placeholder="المدة المتبقية" 
              value={warrantyInfo.remainingDays || ""} 
              readOnly 
            />
          </div>
        </div>
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={onNext}
            className="w-28 py-2 bg-teal-800 text-white text-base rounded font-inter"
          >
            التالي
          </button>
        </div>
      </form>
    </section>
  );
}