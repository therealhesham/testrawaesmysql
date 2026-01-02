import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
interface Visa {
  id: number;
  visaNumber: string;
  gender: string;
  nationality: string;
  profession: string;
  createdAt: string;
}

interface VisaSelectorProps {
  value: string;
  onChange: (value: string) => void;
  clientID: number;
  placeholder?: string;
  className?: string;
  error?: string;
}

const VisaSelector: React.FC<VisaSelectorProps> = ({
  value,
  onChange,
  clientID,
  placeholder = "ابحث عن رقم التأشيرة",
  className = "",
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value && value !== 'N/A' ? value : '');
  const [visas, setVisas] = useState<Visa[]>([]);
  const [filteredVisas, setFilteredVisas] = useState<Visa[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOtherModal, setShowOtherModal] = useState(false);
  const [otherVisaNumber, setOtherVisaNumber] = useState('');
  const [selectedVisa, setSelectedVisa] = useState<Visa | null>(null);
  const [visaError, setVisaError] = useState<string>('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sanitizeVisaCandidate = (raw: string, previous: string) => {
    let digits = raw.replace(/\D/g, '');
    if (digits === '') return '';

    // Enforce max length (10 digits)
    if (digits.length > 10) digits = digits.slice(0, 10);

    // Allow free typing - validation will happen on submit
    return digits;
  };

  // Keep input in sync with external value (e.g., when opening edit mode)
  useEffect(() => {
    setSearchTerm(value && value !== 'N/A' ? value : '');
  }, [value]);

  // Fetch visas when component mounts or clientID changes
  useEffect(() => {
    if (clientID) {
      fetchVisas();
    }
  }, [clientID]);

  // Filter visas based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredVisas(visas);
    } else {
      const filtered = visas.filter(visa =>
        visa.visaNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVisas(filtered);
    }
  }, [searchTerm, visas]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchVisas = async () => {
    if (!clientID) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/visa/search?clientID=${clientID}`);
      const result = await response.json();
      
      if (response.ok) {
        setVisas(result.data || []);
        setFilteredVisas(result.data || []);
      } else {
        console.error('Error fetching visas:', result.error);
        setVisas([]);
        setFilteredVisas([]);
      }
    } catch (error) {
      console.error('Error fetching visas:', error);
      setVisas([]);
      setFilteredVisas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = sanitizeVisaCandidate(e.target.value, searchTerm);
    setSearchTerm(next);
    onChange(next);
    setIsOpen(true);
  };

  const handleVisaSelect = (visa: Visa) => {
    setSelectedVisa(visa);
    const normalized = sanitizeVisaCandidate(visa.visaNumber, '');
    setSearchTerm(normalized);
    onChange(normalized);
    setIsOpen(false);
  };

  const handleOtherOption = () => {
    setShowOtherModal(true);
    setIsOpen(false);
    setVisaError('');
    setOtherVisaNumber('');
  };
  const addNewVisa = async () => {
    try {
      const response = await axios.post(`/api/visadata`, {
        visaNumber: otherVisaNumber,
        clientID: Number(clientID),
        gender: '',
        profession: '',
        nationality: '',
        visaFile: ''
      });
      console.log("response", response);
      if (response.status === 200) {
        await fetchVisas();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error adding visa:", error);
      return false;
    }
  };

  const handleOtherSubmit = async () => {
    // Validate visa number
    if (!otherVisaNumber.trim()) {
      setVisaError('يرجى إدخال رقم التأشيرة');
      return;
    }
    
    if (otherVisaNumber.length !== 10) {
      setVisaError('رقم التأشيرة يجب أن يكون 10 أرقام');
      return;
    }
    
    if (!otherVisaNumber.startsWith('190')) {
      setVisaError('رقم التأشيرة يجب أن يبدأ بـ 190');
      return;
    }

    setVisaError('');
    const success = await addNewVisa();
    
    if (success) {
      setSearchTerm(otherVisaNumber);
      onChange(otherVisaNumber);
      setShowOtherModal(false);
      setOtherVisaNumber('');
    } else {
      setVisaError('فشل في إضافة التأشيرة. حاول مرة أخرى.');
    }
  };

  const handleOtherCancel = () => {
    setShowOtherModal(false);
    setOtherVisaNumber('');
    setVisaError('');
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (searchTerm === '' && visas.length === 0) {
      fetchVisas();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-800 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        dir="rtl"
        inputMode="numeric"
        pattern="190\\d{7}"
        maxLength={10}
      />
      
      {error && (
        <p className="text-red-500 text-sm mt-1 text-right">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-500">
              جاري التحميل...
            </div>
          ) : filteredVisas.length > 0 ? (
            <>
              {filteredVisas.map((visa) => (
                <div
                  key={visa.id}
                  className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                  onClick={() => handleVisaSelect(visa)}
                >
                  <div className="font-medium text-gray-900">{visa.visaNumber}</div>
                  <div className="text-sm text-gray-600">
                    {visa.nationality} - {visa.gender} - {visa.profession}
                  </div>
                </div>
              ))}
              <div
                className="p-3 hover:bg-gray-100 cursor-pointer text-teal-600 font-medium border-t border-gray-200"
                onClick={handleOtherOption}
              >
                + إضافة رقم تأشيرة أخرى
              </div>
            </>
          ) : (
            <div className="p-3 text-center text-gray-500">
              <div className="mb-2">لم يتم العثور على تأشيرات</div>
              <div
                className="text-teal-600 font-medium cursor-pointer"
                onClick={handleOtherOption}
              >
                + إضافة رقم تأشيرة جديدة
              </div>
            </div>
          )}
        </div>
      )}

      {/* Other Visa Modal */}
      {showOtherModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              إضافة رقم تأشيرة جديد
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم التأشيرة
                </label>
                <input
                  type="text"
                  value={otherVisaNumber}
                  onChange={(e) => {
                    setOtherVisaNumber((prev) => sanitizeVisaCandidate(e.target.value, prev));
                    setVisaError('');
                  }}
                  placeholder="أدخل رقم التأشيرة (مثال: 1901234567)"
                  className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-800 ${
                    visaError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  dir="rtl"
                  autoFocus
                  inputMode="numeric"
                  maxLength={10}
                />
                {visaError && (
                  <p className="text-red-500 text-sm mt-1 text-right">{visaError}</p>
                )}
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleOtherCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleOtherSubmit}
                  disabled={!otherVisaNumber.trim()}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  إضافة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisaSelector;
