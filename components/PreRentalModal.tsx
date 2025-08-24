import { useState, useEffect, useCallback } from 'react';
import { X, ChevronDown, CheckCircle } from 'lucide-react';
import debounce from 'lodash/debounce';
import { useRouter } from 'next/router';

interface Client {
  id: number;
  fullname: string;
  phonenumber: string;
  nationalId: string;
  city: string;
}

interface PreRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClient: (client: Client) => void;
  onNewClient: () => void;
}

const PreRentalModal = ({ isOpen, onClose, onSelectClient, onNewClient }: PreRentalModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const router = useRouter();

  // دالة debounced لجلب البيانات
  const fetchClients = useCallback(
    debounce(async (query: string) => {
      if (!query) {
        setFilteredClients([]);
        setNoResults(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`/api/getallclients?fullname=${encodeURIComponent(query)}`);
        const data = await response.json();
        setClients(data.data);
        setFilteredClients(data.data);
        setNoResults(data.data.length === 0);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setNoResults(true);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (searchTerm) {
      fetchClients(searchTerm);
      setShowSuggestions(true);
    } else {
      setFilteredClients([]);
      setShowSuggestions(false);
      setNoResults(false);
    }
  }, [searchTerm, fetchClients]);
const[is,setId]=useState("")
  // التعامل مع اختيار العميل
  const handleClientSelect = (client: Client) => {
    setSearchTerm(client.fullname); // تعبئة حقل البحث بالاسم الكامل
    setShowSuggestions(false); // إخفاء قائمة الاقتراحات فورًا
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50 py-25">
      <div className="bg-gray-100 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative">
        <X
          className="absolute top-4 left-4 text-2xl cursor-pointer text-primary-dark"
          onClick={onClose}
        />
        <h3 className="text-lg font-semibold mb-4">تحقق من العميل</h3>
        <h4 className="text-md mb-4">هل العميل موجود مسبقا؟</h4>

        <div className="relative mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم العميل"
            className="w-full p-2 border border-gray-300 rounded-md text-right"
          />
          {isLoading && (
            <div className="absolute top-2 left-2">
              <span className="text-gray-500">جاري التحميل...</span>
            </div>
          )}
          {showSuggestions && filteredClients.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto">
              {filteredClients.map((client) => (
                <li
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-right"
                >
                  {client.fullname} ({client.phonenumber})
                </li>
              ))}
            </ul>
          )}
          {noResults && !isLoading && (
            <div className="text-red-500 text-right mt-2">
              العميل غير موجود، يرجى إضافته كعميل جديد.
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => {
              const selectedClient = clients.find((client) => client.fullname === searchTerm);
              if (selectedClient) {
                // onSelectClient(selectedClient);
                router.push(`/admin/rentalform?clientId=${selectedClient.id}`)
              }
            }}
            disabled={!searchTerm || filteredClients.length === 0 || noResults}
            className="bg-teal-800 text-white px-4 py-2 rounded-md disabled:bg-gray-400"
          >
            متابعة
          </button>
          <button
            onClick={() => router.push("/admin/clients")}
            className="bg-gray-500 text-white px-4 py-2 rounded-md"
          >
            عميل جديد
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreRentalModal;