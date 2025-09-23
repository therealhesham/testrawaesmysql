import Layout from 'example/containers/Layout';
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Style from 'styles/Home.module.css';
import { Plus, Search, FileText, RotateCcw, Settings, MoreHorizontal } from 'lucide-react';
import { DocumentTextIcon } from '@heroicons/react/outline';
import { FaAddressBook, FaUserFriends } from 'react-icons/fa';
import prisma from 'pages/api/globalprisma';
import { jwtDecode } from 'jwt-decode';
// Interfaces
interface HousedWorker {
  id: number;
  homeMaid_id: number;
  location_id: number;
  houseentrydate: string;
  deparatureHousingDate: string | null;
  deparatureReason: string | null;
  status: string;
  employee: string;
  Reason: string;
  Details: string;
  isHasEntitlements?: boolean;
  Order?: {
    Name: string;
    phone: string;
    Nationalitycopy: string;
    Passportnumber: string;
    NewOrder?: Array<{
      typeOfContract: string;
    }>;
  };
}
interface EditWorkerForm {
  location_id: number;
  Reason: string;
  Details: string;
  employee: string;
  Date: string;
  deliveryDate: string;
  isHasEntitlements: boolean;
}
interface DepartureForm {
  deparatureHousingDate: string;
  deparatureReason: string;
  status: string;
}
interface InHouseLocation {
  id: number;
  location: string;
  quantity: number;
  currentOccupancy?: number;
}
interface Homemaid {
  id: number;
  Name: string;
}
// ActionDropdown Component
const ActionDropdown: React.FC<{
  id: number;
  name: string;
  onEdit: (id: number, name: string) => void;
  onDeparture: (id: number, name: string) => void;
  onAddSession: () => void;
}> = ({ id, name, onEdit, onDeparture, onAddSession }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full hover:bg-gray-200"
      >
        <MoreHorizontal className="w-5 h-5 text-gray-500" />
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-2 w-40 bg-white border border-border rounded-md shadow-lg z-10">
          <button
            onClick={() => {
              onEdit(id, name);
              setIsOpen(false);
            }}
            className="flex gap-1 flex-row w-full text-right py-2 px-4 text-md text-textDark hover:bg-gray-100"
          >
            <FaAddressBook />
            تعديل
          </button>
          <button
            onClick={() => {
              onDeparture(id, name);
              setIsOpen(false);
            }}
            className="w-full flex gap-1 flex-row text-right py-2 px-4 text-md text-textDark hover:bg-gray-100"
          >
            <FaAddressBook />
            مغادرة
          </button>
          <button
            onClick={() => {
              onAddSession();
              setIsOpen(false);
            }}
            className="w-full flex gap-1 flex-row text-right py-2 px-4 text-md text-textDark hover:bg-gray-100"
          >
            <FaUserFriends />
            اضافة جلسة
          </button>
        </div>
      )}
    </div>
  );
};
export default function Home({ user }: { user: any }) {
  const [modals, setModals] = useState({
    addResidence: false,
    editWorker: false,
    workerDeparture: false,
    newHousing: false,
    columnVisibility: false,
    notification: false,
    amountModal: false,
    workerTypeSelection: false,
    housingForm: false,
    internalWorkerModal: false,
  });
  const [housedWorkers, setHousedWorkers] = useState<HousedWorker[]>([]);
  const [departedWorkers, setDepartedWorkers] = useState<HousedWorker[]>([]);
  const [locations, setLocations] = useState<InHouseLocation[]>([]);
  const [homemaids, setHomemaids] = useState<Homemaid[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [departedTotalCount, setDepartedTotalCount] = useState(0);
  const [tabCounts, setTabCounts] = useState({ recruitment: 0, rental: 0 });
  const [housingStatus, setHousingStatus] = useState<'housed' | 'departed'>('housed');
  
  // Debug: Log tabCounts changes
  useEffect(() => {
    console.log('tabCounts updated:', tabCounts);
  }, [tabCounts]);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState<'recruitment' | 'rental'>('recruitment');
  const [filters, setFilters] = useState({
    Name: '',
    Passportnumber: '',
    reason: '',
    id: '',
  });
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    Name: true,
    phone: true,
    Nationalitycopy: true,
    Passportnumber: true,
    location: true,
    Reason: true,
    houseentrydate: true,
    deliveryDate: true,
    duration: true,
    employee: true,
    actions: true,
    deparatureReason: true,
  });
  const pageSize = 10;
  const [formData, setFormData] = useState({
    homeMaidId: '',
    profileStatus: '',
    deparatureCity: '',
    arrivalCity: '',
    deparatureDate: '',
    houseentrydate: '',
    deliveryDate: '',
    StartingDate: '',
    location: '',
    DeparatureTime: '',
    reason: '',
    employee: user,
    details: '',
    isHasEntitlements: true, // إضافة حقل المستحقات
  });
  const [editWorkerForm, setEditWorkerForm] = useState<EditWorkerForm>({
    location_id: 0,
    Reason: '',
    Details: '',
    employee: '',
    Date: '',
    deliveryDate: '',
    isHasEntitlements: true,
  });
  const [departureForm, setDepartureForm] = useState<DepartureForm>({
    deparatureHousingDate: '',
    deparatureReason: '',
    status: 'departed',
  });
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [selectedWorkerName, setSelectedWorkerName] = useState<string>('');
  const [workerType, setWorkerType] = useState<'داخلية' | 'خارجية'>('داخلية');
  const [workerSearchTerm, setWorkerSearchTerm] = useState('');
  const [workerSuggestions, setWorkerSuggestions] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // External worker search states
  const [externalWorkerSearchTerm, setExternalWorkerSearchTerm] = useState('');
  const [externalWorkerSuggestions, setExternalWorkerSuggestions] = useState<any[]>([]);
  const [selectedExternalWorker, setSelectedExternalWorker] = useState<any>(null);
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  // Internal worker modal form data
  const [internalWorkerForm, setInternalWorkerForm] = useState({
    workerId: '',
    workerName: '',
    mobile: '',
    clientName: '',
    clientMobile: '',
    city: '',
    address: '',
    officeName: '',
    housing: '',
    housingDate: '',
    receiptDate: '',
    reason: '',
    details: '',
  });
  // Helper function to get contract type in Arabic
  const getContractTypeInArabic = (typeOfContract: string) => {
    switch (typeOfContract) {
      case 'recruitment':
        return 'استقدام';
      case 'rental':
        return 'تأجير';
      default:
        return 'غير محدد';
    }
  };
  // Open/close modals
  const openModal = (modalName: string) => {
    setModals((prev) => ({ ...prev, [modalName]: true }));
  };
  const closeModal = (modalName: string) => {
    setModals((prev) => ({ ...prev, [modalName]: false }));
    if (modalName !== 'notification') {
      setSelectedWorkerId(null);
      setSelectedWorkerName('');
    }
    // Clear worker selection when closing housing form
    if (modalName === 'housingForm') {
      setSelectedWorker(null);
      setWorkerSearchTerm('');
    }
  };
  // Show notification modal
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    openModal('notification');
  };
  // Toggle column visibility
  const toggleColumnVisibility = (column: keyof typeof columnVisibility) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };
  // Fetch locations
  const fetchLocations = async () => {
    try {
      const response = await axios.get('/api/inhouselocation');
      setLocations(response.data);
    } catch (error) {
      showNotification('خطأ في جلب بيانات المواقع', 'error');
    }
  };
  // Fetch homemaids
  const fetchHomemaids = async () => {
    try {
      const response = await axios.get('/api/autocomplete/homemaids');
      setHomemaids(response.data.data);
    } catch (error) {
      showNotification('خطأ في جلب بيانات العاملات', 'error');
    }
  };
  // Search workers by ID - search in homemaid table
  const searchWorkers = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setWorkerSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      // Determine contract type based on worker type
      const contractType = workerType === 'داخلية' ? 'rental' : 'recruitment'; // Swapped as per request
      const response = await fetch(`/api/housing/search-workers?search=${encodeURIComponent(searchTerm)}&limit=10&contractType=${contractType}`);
      if (response.ok) {
        const data = await response.json();
        setWorkerSuggestions(data.homemaids || []);
      } else {
        console.error('Error searching workers');
        setWorkerSuggestions([]);
      }
    } catch (error) {
      console.error('Error searching workers:', error);
      setWorkerSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Search external workers - similar to musanad_finacial
  const searchExternalWorkers = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setExternalWorkerSuggestions([]);
      return;
    }
    setIsSearchingExternal(true);
    try {
      console.log('Searching for external workers with term:', searchTerm);
      const response = await fetch(`/api/housing/search-external-workers?search=${encodeURIComponent(searchTerm)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        console.log('External workers search response:', data);
        setExternalWorkerSuggestions(data.homemaids || []);
      } else {
        console.error('Error searching external workers:', response.status, response.statusText);
        setExternalWorkerSuggestions([]);
      }
    } catch (error) {
      console.error('Error searching external workers:', error);
      setExternalWorkerSuggestions([]);
    } finally {
      setIsSearchingExternal(false);
    }
  };
  // Fetch workers based on contract type and housing status
  const fetchWorkers = async () => {
    try {
      const contractType = activeTab; // recruitment or rental
      const status = housingStatus; // housed or departed
      
      console.log(`Fetching workers - contractType: ${contractType}, status: ${status}`);
      
      let apiEndpoint = '';
      if (status === 'housed') {
        apiEndpoint = '/api/confirmhousinginformation';
      } else {
        apiEndpoint = '/api/housingdeparature';
      }
      
      const response = await axios.get(apiEndpoint, {
        params: {
          ...filters,
          page,
          sortKey,
          sortDirection,
          contractType: contractType,
        },
      });
      
      console.log('Workers response:', response.data);
      console.log('Workers data:', response.data.housing);
      console.log('Total count from API:', response.data.totalCount);
      
      if (status === 'housed') {
        setHousedWorkers(response.data.housing);
        setTotalCount(response.data.totalCount);
      } else {
      setDepartedWorkers(response.data.housing);
      setDepartedTotalCount(response.data.totalCount);
      }
      
      setTabCounts(prev => ({ ...prev, [contractType]: response.data.totalCount }));
      console.log(`Updated tabCounts ${contractType}:`, response.data.totalCount);
    } catch (error) {
      console.error('Error fetching workers:', error);
      showNotification('خطأ في جلب بيانات العاملات', 'error');
    }
  };
  // Fetch housed workers for exporting
  const fetchHousedforExporting = async () => {
    try {
      const response = await axios.get('/api/Export/housedarrivals', {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      showNotification('خطأ في جلب بيانات التسكين للتصدير', 'error');
      throw error;
    }
  };
  // Fetch departed workers for exporting
  const fetchDepartedHousedforExporting = async () => {
    try {
      const response = await axios.get('/api/Export/departedhoused', {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      showNotification('خطأ في جلب بيانات العاملات اللي غادرن للتصدير', 'error');
      throw error;
    }
  };
  // Update housed worker
  const updateHousedWorker = async (workerId: number, data: EditWorkerForm) => {
    try {
      await axios.put(`/api/confirmhousinginformation`, { 
        ...data, 
        homeMaidId: workerId,
        isHasEntitlements: data.isHasEntitlements
      });
      showNotification('تم تحديث بيانات العاملة بنجاح');
      fetchWorkers();
    } catch (error) {
      showNotification('حدث خطأ أثناء تحديث البيانات', 'error');
    }
  };
  // Record departure
  const recordDeparture = async (workerId: number, data: DepartureForm) => {
    try {
      await axios.put(`/api/housingdeparature`,{...data,homeMaid:workerId});
      showNotification('تم تسجيل مغادرة العاملة بنجاح');
      fetchWorkers();
    } catch (error) {
      showNotification('حدث خطأ أثناء تسجيل المغادرة', 'error');
    }
  };
  // Handle export
  const handleExport = async (format: 'xlsx' | 'pdf') => {
    try {
      let data;
      if (housingStatus === 'housed') {
        data = await fetchHousedforExporting();
      } else {
        data = await fetchDepartedHousedforExporting();
      }
      // Create a URL for the file blob and trigger download
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `${activeTab}_${housingStatus}_${format}_${new Date().toISOString()}.${format}`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showNotification(
        `تم تصدير الملف بصيغة ${format === 'xlsx' ? 'Excel' : 'PDF'} بنجاح`
      );
    } catch (error) {
      showNotification(
        `خطأ في تصدير الملف بصيغة ${format === 'xlsx' ? 'Excel' : 'PDF'}`,
        'error'
      );
    }
  };
  // Handle edit worker modal opening
  const handleEditWorker = (id: number, name: string) => {
    const worker = (housingStatus === 'housed' ? housedWorkers : departedWorkers).find((w) => w.id === id);
    if (worker) {
      setSelectedWorkerId( worker.homeMaid_id);
      setSelectedWorkerName(name);
      setEditWorkerForm({
        location_id: worker.location_id,
        Reason: worker.Reason || '',
        Details: worker.Details || '',
        employee: worker.employee || '',
        Date: worker.houseentrydate || '',
        deliveryDate: worker.deparatureHousingDate || '',
        isHasEntitlements: worker.isHasEntitlements !== undefined ? worker.isHasEntitlements : true,
      });
      openModal('editWorker');
    }
  };
  // Handle departure modal opening
  const handleWorkerDeparture = (id: number, name: string) => {
    setSelectedWorkerId(id);
    setSelectedWorkerName(name);
    setDepartureForm({
      deparatureHousingDate: '',
      deparatureReason: '',
      status: 'departed',
    });
    openModal('workerDeparture');
  };
  // Handle form submission for newHousing
  const handlenewHousingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   
    // Validate that a worker is selected
    if (!selectedWorker || !selectedWorker.id) {
      showNotification('يرجى اختيار عاملة أولاً', 'error');
      return;
    }
   
    try {
      const response = await axios.post('/api/confirmhousinginformation', {
        ...formData,
        homeMaidId: Number(selectedWorker.id),
      });
      showNotification(response.data.message);
      closeModal('housingForm');
      setFormData({
        homeMaidId: '',
        profileStatus: '',
        deparatureCity: '',
        arrivalCity: '',
        deparatureDate: '',
        houseentrydate: '',
        deliveryDate: '',
        StartingDate: '',
        location: '',
        DeparatureTime: '',
        reason: '',
        employee: user,
        details: '',
        isHasEntitlements: true,
      });
      // Clear selected worker and search term
      setSelectedWorker(null);
      setWorkerSearchTerm('');
      fetchWorkers();
    } catch (error: any) {
      showNotification(error.response?.data?.error || 'خطأ في تسكين العاملة', 'error');
    }
  };
  // Handle filter input changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1); // Reset to first page on filter change
  };
  // Handle sorting
  const handleSort = (key: string) => {
    setSortKey(key);
    setSortDirection(sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc');
  };
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  // Handle tab change with page reset
  const handleTabChange = (tab: 'recruitment' | 'rental') => {
    setActiveTab(tab);
    setPage(1); // Reset to first page when switching tabs
  };
  
  // Handle housing status change
  const handleHousingStatusChange = (status: 'housed' | 'departed') => {
    setHousingStatus(status);
    setPage(1); // Reset to first page when switching status
  };

  // Handle worker type next button
  const handleWorkerTypeNext = () => {
    closeModal('workerTypeSelection');
    if (workerType === 'داخلية') {
      openModal('housingForm'); // Swapped as per request
    } else {
      openModal('internalWorkerModal'); // Swapped as per request
    }
  };
  // Handle internal worker form submission
  const handleInternalWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formData = selectedExternalWorker ? {
        ...internalWorkerForm,
        workerId: selectedExternalWorker.id.toString(),
        workerName: selectedExternalWorker.name,
        mobile: selectedExternalWorker.phone,
        workerType: 'خارجية',
        employee: user,
      } : {
        ...internalWorkerForm,
        workerType: 'خارجية',
        employee: user,
      };
      
      const response = await axios.post('/api/confirmhousinginformation', formData);
      showNotification(response.data.message);
      closeModal('internalWorkerModal');
      setInternalWorkerForm({
        workerId: '',
        workerName: '',
        mobile: '',
        clientName: '',
        clientMobile: '',
        city: '',
        address: '',
        officeName: '',
        housing: '',
        housingDate: '',
        receiptDate: '',
        reason: '',
        details: '',
      });
      // Clear search states
      setSelectedExternalWorker(null);
      setExternalWorkerSearchTerm('');
      setExternalWorkerSuggestions([]);
      fetchWorkers();
    } catch (error: any) {
      showNotification(error.response?.data?.error || 'خطأ في تسكين العاملة الخارجية', 'error');
    }
  };
  // Handle worker search input - similar to musanad_finacial
  const handleWorkerSearch = (value: string) => {
    setWorkerSearchTerm(value);
    if (value.trim()) {
      searchWorkers(value);
    } else {
      setWorkerSuggestions([]);
      setSelectedWorker(null);
    }
  };
  // Handle worker selection from suggestions
  const handleWorkerSelection = (worker: any) => {
    setSelectedWorker(worker);
    setWorkerSearchTerm(worker.name || worker.Name || '');
    setWorkerSuggestions([]);
  };
  
  // Handle external worker search input - similar to musanad_finacial
  const handleExternalWorkerSearch = (value: string) => {
    setExternalWorkerSearchTerm(value);
    if (value.trim()) {
      searchExternalWorkers(value);
    } else {
      setExternalWorkerSuggestions([]);
      setSelectedExternalWorker(null);
    }
  };
  
  // Handle external worker selection from suggestions
  const handleExternalWorkerSelection = (worker: any) => {
    setSelectedExternalWorker(worker);
    setExternalWorkerSearchTerm(worker.name || worker.Name || '');
    setExternalWorkerSuggestions([]);
    
    // Auto-fill form with worker data
    setInternalWorkerForm(prev => ({
      ...prev,
      workerId: worker.id.toString(),
      workerName: worker.name,
      mobile: worker.phone,
    }));
  };
  // Calculate duration
  const calculateDuration = (startDate: string) => {
    if (!startDate) return 'غير محدد';
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  // Fetch data on component mount
  useEffect(() => {
    console.log('useEffect triggered with:', { page, sortKey, sortDirection, filters, activeTab, housingStatus });
    fetchLocations();
    fetchHomemaids();
    fetchWorkers();
  }, [page, sortKey, sortDirection, filters, activeTab, housingStatus]);
  // Close search results when clicking outside - similar to musanad_finacial
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setWorkerSuggestions([]);
        setExternalWorkerSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <Layout>
      <Head>
        <title>Dashboard Preview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <section className={`min-h-screen ${Style['tajawal-regular']}`}>
        <div className="mx-auto">
          <main className="p-8 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-normal text-black">التسكين</h1>
              <div className="flex gap-4">
                <button
                  onClick={() => openModal('addResidence')}
                  className="flex items-center gap-2 bg-teal-800 text-white text-md py-2 px-4 rounded-md"
                >
                  <Plus className="w-5 h-5" />
                  اضافة سكن
                </button>
              </div>
            </div>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {locations.map((location) => {
                const progress = ((location.currentOccupancy || 0) / location.quantity) * 100;
                const status =
                  progress === 100
                    ? 'السكن ممتلى'
                    : progress > 50
                    ? 'السكن ممتلى جزئيا'
                    : 'السكن متاح';
                const color =
                  progress === 100 ? 'red-600' : progress > 50 ? 'yellow-500' : 'green-600';
                return (
                  <div key={location.id} className="bg-white border border-gray-300 rounded-md p-3 text-right">
                    <h3 className="text-md font-normal mb-1">{location.location}</h3>
                    <p className="text-md font-normal mb-4">{`${location.currentOccupancy || 0} \\ ${location.quantity}`}</p>
                    <div className="flex justify-between text-md mb-2">
                      <span>{status}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="bg-white border border-gray-300 rounded-sm h-3 overflow-hidden">
                      <div
                        className={`h-full ${
                          progress === 100 ? 'bg-red-600' :
                          progress > 50 ? 'bg-yellow-500' : 'bg-green-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </section>
            <section className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 flex flex-col gap-5">
              <div className="flex justify-between items-center border-b border-gray-300 pb-3">
  <div className="flex flex-row items-center gap-10">
  {/* هذه القائمة ستلتزم باليسار */}
  <nav className="flex gap-10">
    <div className={`flex items-center gap-2 pb-3 cursor-pointer transition-all duration-200 ${activeTab === 'recruitment' ? 'border-b-2 border-teal-700' : ''}`} onClick={() => handleTabChange('recruitment')}>
      <span className={`text-sm w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
        activeTab === 'recruitment' 
          ? 'bg-teal-800 text-white' 
          : 'bg-gray-200 text-gray-600'
      }`}>
{(() => {
  const count = tabCounts.recruitment || 0;
  console.log('Displaying recruitment count:', count, 'tabCounts.recruitment:', tabCounts.recruitment);
  return count;
})()}
      </span>
      <span className={`text-base transition-colors duration-200 ${
        activeTab === 'recruitment' 
          ? 'text-teal-700 font-medium' 
          : 'text-gray-500'
      }`}>
        عاملات الاستقدام
      </span>
    </div>
    <div className={`flex items-center gap-2 pb-3 cursor-pointer transition-all duration-200 ${activeTab === 'rental' ? 'border-b-2 border-teal-700' : ''}`} onClick={() => handleTabChange('rental')}>
      <span className={`text-sm w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
        activeTab === 'rental' 
          ? 'bg-teal-800 text-white' 
          : 'bg-gray-200 text-gray-600'
      }`}>
{(() => {
  const count = tabCounts.rental || 0;
  console.log('Displaying rental count:', count, 'tabCounts.rental:', tabCounts.rental);
  return count;
})()}
      </span>
      <span className={`text-base transition-colors duration-200 ${
        activeTab === 'rental' 
          ? 'text-teal-700 font-medium' 
          : 'text-gray-500'
      }`}>
        عاملات التاجير
      </span>
    </div>
  </nav>

  {/* هذا الزر سيتم دفعه إلى أقصى اليمين بسبب "ml-auto" */}
  <button
    onClick={() => openModal('workerTypeSelection')}
    className="flex items-center gap-2 bg-teal-800 text-white text-md py-2 px-4 rounded-md ml-auto"
  >
    <Plus className="w-5 h-5" />
    تسكين عاملة
  </button>
</div>
              </div>
              <div className="flex justify-end gap-4 mb-4">
                <button 
                  onClick={() => handleHousingStatusChange('housed')}
                  className={`px-3 py-2 text-md rounded-md ${
                    housingStatus === 'housed' 
                      ? 'bg-teal-800 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  عاملات تم تسكينهم
                </button>
                <button 
                  onClick={() => handleHousingStatusChange('departed')}
                  className={`px-3 py-2 text-md rounded-md ${
                    housingStatus === 'departed' 
                      ? 'bg-teal-800 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  عاملات غادرن السكن
                </button>
              </div>
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <div className="flex items-center gap-4 flex-wrap">
                  <button
                    onClick={() => setFilters({ Name: '', Passportnumber: '', reason: '', id: '' })}
                    className="bg-teal-800 text-white text-md py-2 px-4 rounded-md"
                  >
                    اعادة ضبط
                  </button>
                  <button
                    onClick={() => openModal('columnVisibility')}
                    className="flex items-center gap-2 bg-gray-100 text-gray-600 text-md py-2 px-4 rounded-md border border-gray-300"
                  >
                    <Settings className="w-5 h-5" />
                    كل الاعمدة
                  </button>
                  <button className="flex items-center gap-2 bg-gray-100 text-gray-600 text-md py-2 px-4 rounded-md border border-gray-300">
                    السكن
                  </button>
                  <button className="flex items-center gap-2 bg-gray-100 text-gray-600 text-md py-2 px-4 rounded-md border border-gray-300">
                    اختر تاريخ
                  </button>
                  <div className="bg-gray-100 border border-gray-300 rounded-md p-2 flex items-center gap-2">
                    <input
                      type="text"
                      name="Name"
                      placeholder="بحث"
                      value={filters.Name}
                      onChange={handleFilterChange}
                      className="bg-transparent outline-none text-right w-24 text-md border-none"
                    />
                    <Search className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="flex items-center gap-1 bg-teal-800 text-white text-md py-2 px-4 rounded-md"
                  >
                    <FileText className="w-5 h-5" />
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="flex items-center gap-1 bg-teal-800 text-white text-md py-2 px-4 rounded-md"
                  >
                    <DocumentTextIcon className="w-5 h-5" />
                    Excel
                  </button>
                </div>
              </div>
              <div className="flex flex-col">
                <div
                  className="bg-teal-800 text-white py-4 px-4 grid items-center text-right gap-4 text-md rounded-t-md"
                  style={{
                    gridTemplateColumns: '40px 1fr 1fr 0.8fr 1fr 0.8fr 1fr 1fr 1fr 0.6fr 0.7fr 1fr 0.7fr 0.7fr 0.8fr',
                  }}
                >
                  <span>#</span>
                  <span>الاسم</span>
                  <span>رقم الجوال</span>
                  <span>الجنسية</span>
                  <span>رقم الجواز</span>
                  <span>السكن</span>
                  <span>سبب التسكين</span>
                  <span>تاريخ التسكين</span>
                  <span>تاريخ التسليم</span>
                  <span>مدة السكن</span>
                  <span>الموظف</span>
                  <span>لديها مستحقات</span>
                  <span>ملاحظات</span>
                  <span>نوع العقد</span>
                  <span>اجراءات</span>
                </div>
                <div className="flex flex-col">
                  {console.log('Rendering workers:', activeTab, housingStatus, (housingStatus === 'housed' ? housedWorkers : departedWorkers).length)}
                  {(housingStatus === 'housed' ? housedWorkers : departedWorkers)
                    .filter((worker) => worker.Order?.Name)
                    .length > 0 ? (
                    (housingStatus === 'housed' ? housedWorkers : departedWorkers)
                      .filter((worker) => worker.Order?.Name)
                      .map((worker) => (
                      <div
                        key={worker.id}
                        className="bg-gray-50 border border-gray-300 py-4 px-4 grid items-center text-right gap-4 text-md last:border-b-0"
                        style={{
                          gridTemplateColumns: '40px 1fr 1fr 0.8fr 1fr 0.8fr 1fr 1fr 1fr 0.6fr 0.7fr 1fr 0.7fr 0.7fr 0.8fr',
                        }}
                      >
                        <span>#{worker.id}</span>
                        <span className="text-[11px] leading-tight text-center">{worker.Order?.Name || ''}</span>
                        <span>{worker.Order?.phone || ''}</span>
                        <span>{worker.Order?.Nationalitycopy || ''}</span>
                        <span>{worker.Order?.Passportnumber || ''}</span>
                        <span>{locations.find((loc) => loc.id === worker.location_id)?.location || 'غير محدد'}</span>
                        <span>{worker.Reason}</span>
                        <span>{worker.houseentrydate ? new Date(worker.houseentrydate).toLocaleDateString() : 'غير محدد'}</span>
                        <span>
                          {worker.deparatureHousingDate ? new Date(worker.deparatureHousingDate).toLocaleDateString() : 'غير محدد'}
                        </span>
                        <span
                          className={worker.houseentrydate && Number(calculateDuration(worker.houseentrydate)) > 10 ? 'text-red-600' : 'text-green-600'}
                        >
                          {calculateDuration(worker.houseentrydate)}
                        </span>
                        <span>{worker.employee}</span>
                        <button
                          onClick={() => openModal('amountModal')}
                          className="text-teal-800 hover:text-teal-600"
                        >
                          نعم
                        </button>
                        <span className="text-center">
                          {getContractTypeInArabic(worker.Order?.NewOrder?.[0]?.typeOfContract || '')}
                        </span>
                        <div className="flex justify-center">
                          <ActionDropdown
                            id={worker.id}
                            name={worker.Order?.Name || ''}
                            onEdit={handleEditWorker}
                            onDeparture={handleWorkerDeparture}
                            onAddSession={() => openModal('newHousing')}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-8 text-center text-gray-500">
                      لا توجد بيانات متاحة
                    </div>
                  )}
                </div>
              </div>
              <footer className="flex justify-between items-center pt-6">
                <span className="text-base">
                  عرض {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, housingStatus === 'housed' ? totalCount : departedTotalCount)} من {housingStatus === 'housed' ? totalCount : departedTotalCount} نتيجة
                </span>
                <nav className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === Math.ceil((housingStatus === 'housed' ? totalCount : departedTotalCount) / pageSize)}
                    className="border border-gray-300 bg-gray-100 text-gray-700 py-1 px-2 rounded-sm text-md disabled:opacity-50"
                  >
                    التالي
                  </button>
                  {Array.from({ length: Math.ceil((housingStatus === 'housed' ? totalCount : departedTotalCount) / pageSize) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`border ${
                        p === page ? 'border-teal-800 bg-teal-800 text-white' : 'border-gray-300 bg-gray-100 text-gray-700'
                      } py-1 px-2 rounded-sm text-md`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="border border-gray-300 bg-gray-100 text-gray-700 py-1 px-2 rounded-sm text-md disabled:opacity-50"
                  >
                    السابق
                  </button>
                </nav>
              </footer>
            </section>
            {/* Add Residence Modal */}
            {modals.addResidence && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex justify-center   items-center z-50 "
                onClick={() => closeModal('addResidence')}
              >
                <div
                  className="bg-gray-200 rounded-lg p-6 justify-between    shadow-card  w-[600px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-5  ">
                    <h2 className="text-xl font-bold text-textDark">اضافة سكن</h2>
                    <button onClick={() => closeModal('addResidence')} className="text-textMuted text-2xl">
                      &times;
                    </button>
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                        try {
                        await axios.post('/api/inhouselocation', {
                          location: (e.target as any)['residence-name'].value,
                          quantity: Number((e.target as any)['residence-capacity'].value),
                        });
                        showNotification('تم إضافة السكن بنجاح');
                        closeModal('addResidence');
                        fetchLocations();
                      } catch (error) {
                        showNotification('خطأ في إضافة السكن', 'error');
                      }
                    }}
                    
                  >
                    <div className="grid grid-cols-2 gap-2 " >
                    <div className="mb-4 ">
                      <label htmlFor="residence-name" className="block text-md mb-2 text-textDark">
                        اسم السكن
                      </label>
                      <input
                        type="text"
                        id="residence-name"
                        placeholder="ادخل اسم السكن"
                        className="w-full border border-border rounded-md bg-gray-50 text-right text-md text-textDark"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="residence-capacity" className="block text-md mb-2 text-textDark">
                        السعة
                      </label>
                      <input
                        type="number"
                        id="residence-capacity"
                        placeholder="ادخل السعة"
                        className="w-full border border-border rounded-md bg-gray-50 text-right text-md text-textDark"
                      />
                    </div>
                    </div>
                    <div className="flex justify-end gap-4 col-span-2">
                      <button
                        type="button"
                        onClick={() => closeModal('addResidence')}
                        className="bg-textMuted text-white py-2 px-4 rounded-md text-md"
                      >
                        الغاء
                      </button>
                      <button type="submit" className="bg-teal-800 text-white py-2 px-4 rounded-md text-md">
                        حفظ
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* Column Visibility Modal */}
            {modals.columnVisibility && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                onClick={() => closeModal('columnVisibility')}
              >
                <div
                  className="bg-gray-200 rounded-lg p-6 w-full max-w-lg shadow-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-textDark">إعدادات الأعمدة</h2>
                    <button onClick={() => closeModal('columnVisibility')} className="text-textMuted text-2xl">
                      &times;
                    </button>
                  </div>
                  <form>
                    <div className="mb-4">
                      <label className="block text-md mb-2 text-textDark">اختر الأعمدة المرئية</label>
                      {Object.keys(columnVisibility).map((column) => (
                        <div key={column} className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            id={column}
                            checked={columnVisibility[column as keyof typeof columnVisibility]}
                            onChange={() => toggleColumnVisibility(column as keyof typeof columnVisibility)}
                            className="w-4 h-4"
                          />
                          <label htmlFor={column} className="text-md text-textDark">
                            {
                              {
                                id: '#',
                                Name: 'الاسم',
                                phone: 'رقم الجوال',
                                Nationalitycopy: 'الجنسية',
                                Passportnumber: 'رقم الجواز',
                                location: 'السكن',
                                Reason: 'سبب التسكين',
                                houseentrydate: 'تاريخ التسكين',
                                deliveryDate: 'تاريخ التسليم',
                                duration: 'مدة السكن',
                                employee: 'الموظف',
                                deparatureReason: 'سبب المغادرة',
                                actions: 'اجراءات',
                              }[column]
                            }
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => closeModal('columnVisibility')}
                        className="bg-textMuted text-white py-2 px-4 rounded-md text-md"
                      >
                        الغاء
                      </button>
                      <button
                        type="button"
                        onClick={() => closeModal('columnVisibility')}
                        className="bg-teal-800 text-white py-2 px-4 rounded-md text-md"
                      >
                        حفظ
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* Worker Type Selection Modal */}
            {modals.workerTypeSelection && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                onClick={() => closeModal('workerTypeSelection')}
              >
                <div
                  className="bg-gray-200 rounded-lg p-10  shadow-card  w-[600px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-normal text-black">تسكين عاملة</h2>
                    <button onClick={() => closeModal('workerTypeSelection')} className="text-gray-400 text-2xl hover:text-gray-600">
                      &times;
                    </button>
                  </div>
                 
                  <div className="mb-8">
                    <h3 className="text-2xl font-normal text-gray-900 mb-8 text-center">اختر نوع العاملة</h3>
                    <div className="flex justify-center gap-10 mb-6">
                      <label className="flex items-center gap-2  w-[120px] cursor-pointer  border border-gray-300 rounded-md p-4 hover:bg-gray-50">
                        <input
                          type="radio"
                          name="workerType"
                          value="داخلية"
                          checked={workerType === 'داخلية'}
                          onChange={() => setWorkerType('داخلية')}
                          className="w-4 h-4"
                        />
                        <span className="text-lg">داخلية</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer  border border-gray-300 rounded-md p-4 hover:bg-gray-50">
                        <input
                          type="radio"
                          name="workerType"
                          value="خارجية"
                          checked={workerType === 'خارجية'}
                          onChange={() => setWorkerType('خارجية')}
                          className="w-4 h-4"
                        />
                        <span className="text-lg">خارجية</span>
                      </label>
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={handleWorkerTypeNext}
                        className="bg-teal-800 text-white py-2 px-6 rounded-md text-base hover:bg-teal-700"
                      >
                        التالي
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Housing Form Modal */}
            {modals.housingForm && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                onClick={() => closeModal('housingForm')}
              >
                <div
                  className="bg-gray-200 rounded-lg p-10 w-full max-w-4xl shadow-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-normal text-black">تسكين عاملة - {workerType}</h2>
                    <button onClick={() => closeModal('housingForm')} className="text-gray-400 text-2xl hover:text-gray-600">
                      &times;
                    </button>
                  </div>
                  <form onSubmit={handlenewHousingSubmit} className="space-y-4">
                    {/* Worker Search - similar to musanad_finacial */}
                    <div className="col-span-1 md:col-span-2 mb-4">
                      <label className="block text-md font-medium text-gray-700 mb-2">البحث عن العاملة</label>
                      <div className="relative search-container">
                        <input
                          type="text"
                          value={workerSearchTerm}
                          onChange={(e) => handleWorkerSearch(e.target.value)}
                          placeholder="ابحث برقم العاملة أو الاسم أو رقم الجواز"
                          className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
                        />
                        {isSearching && (
                          <div className="absolute right-3 top-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                          </div>
                        )}
                       
                        {/* Search Results Dropdown */}
                        {workerSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {workerSuggestions.map((worker) => (
                              <div
                                key={worker.id}
                                onClick={() => handleWorkerSelection(worker)}
                                className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                              >
                                <div className="font-medium text-md">عاملة #{worker.id}</div>
                                <div className="text-md text-gray-600">الاسم: {worker.name}</div>
                                <div className="text-md text-gray-600">الجنسية: {worker.nationality}</div>
                                <div className="text-md text-gray-500">رقم الجواز: {worker.passportNumber}</div>
                                <div className="text-md text-gray-500">العمر: {worker.age} سنة</div>
                                {worker.hasOrders && (
                                  <div className="text-md text-green-600 mt-1">
                                    ✓ لديها طلبات ({worker.orders?.length || 0}) - {worker.orders?.[0]?.typeOfContract === 'recruitment' ? 'استقدام' : 'تأجير'}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {!selectedWorker && (
                        <div className="text-md text-red-600 mt-1">
                          * يجب اختيار عاملة قبل المتابعة
                        </div>
                      )}
                    </div>
                    {/* Selected Worker Display */}
                    {selectedWorker && (
                      <div className="col-span-1 md:col-span-2 bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-md font-medium text-green-800">العاملة المحددة:</div>
                            <div className="text-md text-green-700">#{selectedWorker.id} - {selectedWorker.name}</div>
                            <div className="text-md text-green-600">الجنسية: {selectedWorker.nationality}</div>
                            <div className="text-md text-green-600">رقم الجواز: {selectedWorker.passportNumber}</div>
                            <div className="text-md text-green-600">العمر: {selectedWorker.age} سنة</div>
                            {selectedWorker.hasOrders && (
                              <div className="text-md text-green-600 font-medium">
                                ✓ لديها {selectedWorker.orders?.length || 0} طلب - {selectedWorker.orders?.[0]?.typeOfContract === 'recruitment' ? 'استقدام' : 'تأجير'}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWorker(null);
                              setWorkerSearchTerm('');
                            }}
                            className="text-green-600 hover:text-green-800 text-md"
                          >
                            إزالة
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Worker Info Row */}
                    <div className="grid grid-cols-2 gap-8 mb-4">
                      <div>
                        <label className="block text-md text-gray-700 mb-2">اسم العاملة</label>
                        <input
                          type="text"
                          value={selectedWorker?.name || ''}
                          disabled
                          className="w-full bg-gray-200 border border-gray-300 rounded-md p-2 text-right text-md"
                        />
                      </div>
                      <div>
                        <label className="block text-md text-gray-700 mb-2">الجنسية</label>
                        <input
                          type="text"
                          value={selectedWorker?.nationality || ''}
                          disabled
                          className="w-full bg-gray-200 border border-gray-300 rounded-md p-2 text-right text-md"
                        />
                      </div>
                    </div>
                    {/* Housing Info Row */}
                    <div className="grid grid-cols-2 gap-8 mb-4">
                      <div>
                        <label className="block text-md text-gray-700 mb-2">السكن</label>
                        <div className="relative">
                          <select
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-right text-md appearance-none pr-8"
                          >
                            <option value="">اختر السكن</option>
                            {locations.map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.location}
                              </option>
                            ))}
                          </select>
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-md text-gray-700 mb-2">تاريخ التسكين</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={formData.houseentrydate}
                            onChange={(e) => setFormData({ ...formData, houseentrydate: e.target.value })}
                            className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-right text-md pr-8"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Delivery and Reason Row */}
                    <div className="grid grid-cols-2 gap-8 mb-4">
                      <div>
                        <label className="block text-md text-gray-700 mb-2">تاريخ الاستلام</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={formData.deliveryDate}
                            onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                            className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-right text-md pr-8"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-md text-gray-700 mb-2">سبب التسكين</label>
                        <div className="relative">
                          <select
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-right text-md appearance-none pr-8"
                          >
                            <option value="">اختر سبب التسكين</option>
                            <option value="انتظار الترحيل">انتظار الترحيل</option>
                            <option value="نقل كفالة">نقل كفالة</option>
                            <option value="مشكلة مكتب العمل">مشكلة مكتب العمل</option>
                          </select>
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Details */}
                    <div className="mb-6">
                      <label className="block text-md text-gray-700 mb-2">التفاصيل</label>
                      <textarea
                        placeholder="التفاصيل"
                        value={formData.details}
                        onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                        className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-right text-md"
                        rows={3}
                      />
                    </div>
                    {/* Entitlements */}
                    <div className="mb-6">
                      <label className="block text-md text-gray-700 mb-2">هل لديها مستحقات؟</label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="isHasEntitlements"
                            value="true"
                            checked={formData.isHasEntitlements === true}
                            onChange={() => setFormData({ ...formData, isHasEntitlements: true })}
                            className="w-4 h-4 text-teal-600"
                          />
                          <span className="text-md text-gray-700">نعم</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="isHasEntitlements"
                            value="false"
                            checked={formData.isHasEntitlements === false}
                            onChange={() => setFormData({ ...formData, isHasEntitlements: false })}
                            className="w-4 h-4 text-teal-600"
                          />
                          <span className="text-md text-gray-700">لا</span>
                        </label>
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => closeModal('housingForm')}
                        className="bg-white text-teal-800 border border-teal-800 rounded-md w-28 h-8 text-base"
                      >
                        الغاء
                      </button>
                      <button
                        type="submit"
                        disabled={!selectedWorker || !selectedWorker.id}
                        className={`rounded-md w-28 h-8 text-base ${
                          !selectedWorker || !selectedWorker.id
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : 'bg-teal-800 text-white hover:bg-teal-700'
                        }`}
                      >
                        حفظ
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* Edit Worker Modal */}
            {modals.editWorker && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                onClick={() => closeModal('editWorker')}
              >
                <div
                  className="bg-gray-200 rounded-lg p-6 w-full max-w-lg shadow-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-textDark">تعديل بيانات التسكين</h2>
                    <button onClick={() => closeModal('editWorker')} className="text-textMuted text-2xl">
                      &times;
                    </button>
                  </div>
                  <form
                    className="grid grid-cols-2 gap-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (selectedWorkerId) {
                        await updateHousedWorker(selectedWorkerId, editWorkerForm);
                        closeModal('editWorker');
                      }
                    }}
                  >
                    <div className="mb-4">
                      <label className="block text-md mb-2 text-textDark">اسم العاملة</label>
                      <input
                        type="text"
                        value={selectedWorkerName}
                        disabled
                        className="w-full p-2 rounded-md text-right text-md text-textDark bg-gray-200"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-md mb-2 text-textDark">رقم العاملة</label>
                      <input
                        type="number"
                        value={selectedWorkerId || ''}
                        disabled
                        className="w-full p-2 border border-border rounded-md text-right text-md text-textDark bg-gray-200"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-md mb-2 text-textDark">السكن</label>
                      <select
                        value={editWorkerForm.location_id}
                        onChange={(e) =>
                          setEditWorkerForm({
                            ...editWorkerForm,
                            location_id: Number(e.target.value),
                          })
                        }
                        className="w-full p-2 bg-gray-200 rounded-md text-right text-md text-textDark"
                      >
                        <option value="">اختر السكن</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.location}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-md mb-2 text-textDark">تاريخ التسكين</label>
                      <input
                        type="date"
                        value={editWorkerForm.Date}
                        onChange={(e) =>
                          setEditWorkerForm({
                            ...editWorkerForm,
                            Date: e.target.value,
                          })
                        }
                        className="w-full p-2 bg-gray-200 rounded-md text-right text-md text-textDark"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-md mb-2 text-textDark">تاريخ التسليم</label>
                      <input
                        type="date"
                        value={editWorkerForm.deliveryDate}
                        onChange={(e) =>
                          setEditWorkerForm({
                            ...editWorkerForm,
                            deliveryDate: e.target.value,
                          })
                        }
                        className="w-full p-2 bg-gray-200 rounded-md text-right text-md text-textDark"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-md mb-2 text-textDark">سبب التسكين</label>
                      <input
                        type="text"
                        value={editWorkerForm.Reason}
                        onChange={(e) =>
                          setEditWorkerForm({
                            ...editWorkerForm,
                            Reason: e.target.value,
                          })
                        }
                        className="w-full p-2 bg-gray-200 rounded-md text-right text-md text-textDark"
                      />
                    </div>
                    <div className="mb-4 col-span-2">
                      <label className="block text-md mb-2 text-textDark">التفاصيل</label>
                      <textarea
                        value={editWorkerForm.Details}
                        onChange={(e) =>
                          setEditWorkerForm({
                            ...editWorkerForm,
                            Details: e.target.value,
                          })
                        }
                        className="w-full p-2 bg-gray-200 rounded-md text-right text-md text-textDark"
                        rows={4}
                      />
                    </div>
                    <div className="mb-4 col-span-2">
                      <label className="block text-md mb-2 text-textDark">هل لديها مستحقات؟</label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="editIsHasEntitlements"
                            value="true"
                            checked={editWorkerForm.isHasEntitlements === true}
                            onChange={() => setEditWorkerForm({ ...editWorkerForm, isHasEntitlements: true })}
                            className="w-4 h-4 text-teal-600"
                          />
                          <span className="text-md text-textDark">نعم</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="editIsHasEntitlements"
                            value="false"
                            checked={editWorkerForm.isHasEntitlements === false}
                            onChange={() => setEditWorkerForm({ ...editWorkerForm, isHasEntitlements: false })}
                            className="w-4 h-4 text-teal-600"
                          />
                          <span className="text-md text-textDark">لا</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => closeModal('editWorker')}
                        className="bg-textMuted text-white py-2 px-4 rounded-md text-md"
                      >
                        الغاء
                      </button>
                      <button type="submit" className="bg-teal-800 text-white py-2 px-4 rounded-md text-md">
                        حفظ
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* Worker Departure Modal */}
            {modals.workerDeparture && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                onClick={() => closeModal('workerDeparture')}
              >
                <div
                  className="bg-white rounded-lg p-6 w-full max-w-lg shadow-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-textDark">مغادرة عاملة</h2>
                    <button onClick={() => closeModal('workerDeparture')} className="text-textMuted text-2xl">
                      &times;
                    </button>
                  </div>
                  <form
                    className="grid grid-cols-2 gap-5"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (selectedWorkerId) {
                        await recordDeparture(selectedWorkerId, departureForm);
                        closeModal('workerDeparture');
                      }
                    }}
                  >
                    <div className="mb-4">
                      <label className="block text-md mb-2 text-textDark">اسم العاملة</label>
                      <input
                        type="text"
                        value={selectedWorkerName}
                        disabled
                        className="w-full p-2 border border-border rounded-md text-right text-md text-textDark bg-gray-100"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-md mb-2 text-textDark">رقم العاملة</label>
                      <input
                        type="number"
                        value={selectedWorkerId || ''}
                        disabled
                        className="w-full p-2 border border-border rounded-md text-right text-md text-textDark bg-gray-100"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-md mb-2 text-textDark">سبب المغادرة</label>
                      <input
                        type="text"
                        value={departureForm.deparatureReason}
                        onChange={(e) =>
                          setDepartureForm({
                            ...departureForm,
                            deparatureReason: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-border rounded-md text-right text-md text-textDark bg-gray-100"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-md mb-2 text-textDark">تاريخ المغادرة</label>
                      <input
                        type="date"
                        value={departureForm.deparatureHousingDate}
                        onChange={(e) =>
                          setDepartureForm({
                            ...departureForm,
                            deparatureHousingDate: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-border rounded-md text-right text-md text-textDark"
                      />
                    </div>
                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => closeModal('workerDeparture')}
                        className="bg-textMuted text-white py-2 px-4 rounded-md text-md"
                      >
                        الغاء
                      </button>
                      <button type="submit" className="bg-teal-800 text-white py-2 px-4 rounded-md text-md">
                        تأكيد المغادرة
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* Amount Modal */}
            {modals.amountModal && (
              <div
                className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-center z-50"
                onClick={() => closeModal('amountModal')}
              >
                <div
                  className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-normal text-gray-900">المبلغ المستحق</h2>
                    <button
                      onClick={() => closeModal('amountModal')}
                      className="text-gray-400 text-2xl hover:text-gray-600"
                    >
                      &times;
                    </button>
                  </div>
                  <form className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-md text-gray-600 mb-2">المبلغ المستحق</label>
                        <input
                          type="text"
                          value="2000 ريال"
                          className="w-full bg-gray-100 border border-gray-300 rounded-md p-3 text-right text-base"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-md text-gray-600 mb-2">تفاصيل</label>
                        <input
                          type="text"
                          placeholder="سبب المبلغ المستحق"
                          className="w-full bg-gray-100 border border-gray-300 rounded-md p-3 text-right text-base"
                        />
                      </div>
                    </div>
                    <div className="flex justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => closeModal('amountModal')}
                        className="bg-white text-teal-800 border border-teal-800 rounded-md w-28 h-10 text-base"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="bg-teal-800 text-white rounded-md w-28 h-10 text-base"
                      >
                        تعديل
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* Internal Worker Modal */}
            {modals.internalWorkerModal && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                onClick={() => closeModal('internalWorkerModal')}
              >
                <div
                  className="bg-gray-200 rounded-lg p-10 w-full max-w-4xl shadow-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-normal text-black">تسكين عاملة - {workerType}</h2>
                    <button onClick={() => closeModal('internalWorkerModal')} className="text-gray-400 text-2xl hover:text-gray-600">
                      &times;
                    </button>
                  </div>
                  <form onSubmit={handleInternalWorkerSubmit} className="space-y-4">
                    {/* Worker Search - similar to musanad_finacial */}
                    <div className="mb-4">
                      <label className="block text-md text-gray-700 mb-2">البحث عن العاملة</label>
                      <div className="relative search-container">
                        <input
                          type="text"
                          value={externalWorkerSearchTerm}
                          onChange={(e) => handleExternalWorkerSearch(e.target.value)}
                          placeholder="ابحث برقم العاملة أو الاسم أو رقم الجواز"
                          className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
                        />
                        {isSearchingExternal && (
                          <div className="absolute right-3 top-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                          </div>
                        )}
                       
                        {/* Search Results Dropdown */}
                        {externalWorkerSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {externalWorkerSuggestions.map((worker) => (
                              <div
                                key={worker.id}
                                onClick={() => handleExternalWorkerSelection(worker)}
                                className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                              >
                                <div className="font-medium text-md">عاملة #{worker.id}</div>
                                <div className="text-md text-gray-600">الاسم: {worker.name}</div>
                                <div className="text-md text-gray-600">الجنسية: {worker.nationality}</div>
                                <div className="text-md text-gray-500">رقم الجواز: {worker.passportNumber}</div>
                                <div className="text-md text-gray-500">العمر: {worker.age} سنة</div>
                                <div className="text-md text-blue-600 mt-1">
                                  ✓ عاملة متاحة للتسكين
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Selected Worker Display */}
                    {selectedExternalWorker && (
                      <div className="col-span-1 md:col-span-2 bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-md font-medium text-green-800">العاملة المحددة:</div>
                            <div className="text-md text-green-700">#{selectedExternalWorker.id} - {selectedExternalWorker.name}</div>
                            <div className="text-md text-green-600">الجنسية: {selectedExternalWorker.nationality}</div>
                            <div className="text-md text-green-600">رقم الجواز: {selectedExternalWorker.passportNumber}</div>
                            <div className="text-md text-green-600">العمر: {selectedExternalWorker.age} سنة</div>
                            <div className="text-md text-green-600 font-medium">
                              ✓ عاملة خارجية - متاحة للتسكين
                            </div>
                          </div>
                        <button
                          type="button"
                            onClick={() => {
                              setSelectedExternalWorker(null);
                              setExternalWorkerSearchTerm('');
                              setInternalWorkerForm(prev => ({
                                ...prev,
                                workerId: '',
                                workerName: '',
                                mobile: '',
                              }));
                            }}
                            className="text-green-600 hover:text-green-800 text-md"
                          >
                            إزالة
                        </button>
                      </div>
                    </div>
                    )}
                    {/* Worker Info Row */}
                    <div className="grid grid-cols-2 gap-8 mb-4">
                      <div>
                        <label className="block text-md text-gray-700 mb-2">اسم العاملة</label>
                        <input
                          type="text"
                          value={selectedExternalWorker ? selectedExternalWorker.name : internalWorkerForm.workerName}
                          onChange={(e) => setInternalWorkerForm({ ...internalWorkerForm, workerName: e.target.value })}
                          placeholder="ادخل اسم العاملة"
                          disabled={!!selectedExternalWorker}
                          className={`w-full border border-gray-300 rounded-md p-2 text-right text-md ${
                            selectedExternalWorker ? 'bg-gray-200' : 'bg-gray-100'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-md text-gray-700 mb-2">رقم الجوال</label>
                        <input
                          type="text"
                          value={selectedExternalWorker ? selectedExternalWorker.phone : internalWorkerForm.mobile}
                          onChange={(e) => setInternalWorkerForm({ ...internalWorkerForm, mobile: e.target.value })}
                          placeholder="ادخل رقم الجوال"
                          disabled={!!selectedExternalWorker}
                          className={`w-full border border-gray-300 rounded-md p-2 text-right text-md ${
                            selectedExternalWorker ? 'bg-gray-200' : 'bg-gray-100'
                          }`}
                        />
                      </div>
                    </div>
                    {/* Client Info Row */}
                    <div className="grid grid-cols-2 gap-8 mb-4">
                      <div>
                        <label className="block text-md text-gray-700 mb-2">اسم العميل</label>
                        <input
                          type="text"
                          value={internalWorkerForm.clientName}
                          onChange={(e) => setInternalWorkerForm({ ...internalWorkerForm, clientName: e.target.value })}
                          placeholder="اسم العميل"
                          className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-right text-md"
                        />
                      </div>
                      <div>
                        <label className="block text-md text-gray-700 mb-2">رقم الجوال</label>
                        <input
                          type="text"
                          value={internalWorkerForm.clientMobile}
                          onChange={(e) => setInternalWorkerForm({ ...internalWorkerForm, clientMobile: e.target.value })}
                          placeholder="ادخل رقم الجوال"
                          className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-right text-md"
                        />
                      </div>
                    </div>
                    {/* Location Info Row */}
                    <div className="grid grid-cols-2 gap-8 mb-4">
                      <div>
                        <label className="block text-md text-gray-700 mb-2">المدينة</label>
                        <input
                          type="text"
                          value={internalWorkerForm.city}
                          onChange={(e) => setInternalWorkerForm({ ...internalWorkerForm, city: e.target.value })}
                          placeholder="ادخل المدينة"
                          className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-right text-md"
                        />
                      </div>
                      <div>
                        <label className="block text-md text-gray-700 mb-2">العنوان</label>
                        <input
                          type="text"
                          value={internalWorkerForm.address}
                          onChange={(e) => setInternalWorkerForm({ ...internalWorkerForm, address: e.target.value })}
                          placeholder="ادخل العنوان"
                          className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-right text-md"
                        />
                      </div>
                    </div>
                    {/* Office and Housing Row */}
                    <div className="grid grid-cols-2 gap-8 mb-4">
                      <div>
                        <label className="block text-md text-gray-700 mb-2">اسم المكتب</label>
                        <input
                          type="text"
                          value={internalWorkerForm.officeName}
                          onChange={(e) => setInternalWorkerForm({ ...internalWorkerForm, officeName: e.target.value })}
                          placeholder="ادخل اسم المكتب"
                          className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-right text-md"
                        />
                      </div>
                      <div>
                        <label className="block text-md text-gray-700 mb-2">السكن</label>
                        <div className="relative">
                          <select
                            value={internalWorkerForm.housing}
                            onChange={(e) => setInternalWorkerForm({ ...internalWorkerForm, housing: e.target.value })}
                            className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-right text-md appearance-none pr-8"
                          >
                            <option value="">اختر السكن</option>
                            {locations.map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.location}
                              </option>
                            ))}
                          </select>
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Dates Row */}
                    <div className="grid grid-cols-2 gap-8 mb-4">
                      <div>
                        <label className="block text-md text-gray-700 mb-2">تاريخ التسكين</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={internalWorkerForm.housingDate}
                            onChange={(e) => setInternalWorkerForm({ ...internalWorkerForm, housingDate: e.target.value })}
                            className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-right text-md pr-8"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-md text-gray-700 mb-2">تاريخ الاستلام</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={internalWorkerForm.receiptDate}
                            onChange={(e) => setInternalWorkerForm({ ...internalWorkerForm, receiptDate: e.target.value })}
                            className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-right text-md pr-8"
                          />
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Reason and Details Row */}
                    <div className="grid grid-cols-2 gap-8 mb-4">
                      <div>
                        <label className="block text-md text-gray-700 mb-2">سبب التسكين</label>
                        <div className="relative">
                          <select
                            value={internalWorkerForm.reason}
                            onChange={(e) => setInternalWorkerForm({ ...internalWorkerForm, reason: e.target.value })}
                            className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-right text-md appearance-none pr-8"
                          >
                            <option value="">اختر سبب التسكين</option>
                            <option value="عدم استلام الكفيل العاملة">عدم استلام الكفيل العاملة</option>
                            <option value="الكفيل في منطقة اخرى">الكفيل في منطقة اخرى</option>
                            <option value="اخرى">اخرى</option>
                          </select>
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-md text-gray-700 mb-2">التفاصيل</label>
                        <textarea
                          value={internalWorkerForm.details}
                          onChange={(e) => setInternalWorkerForm({ ...internalWorkerForm, details: e.target.value })}
                          placeholder="التفاصيل"
                          className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-right text-md"
                          rows={3}
                        />
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => closeModal('internalWorkerModal')}
                        className="bg-white text-teal-800 border border-teal-800 rounded-md w-28 h-8 text-base"
                      >
                        الغاء
                      </button>
                      <button
                        type="submit"
                        className="bg-teal-800 text-white rounded-md w-28 h-8 text-base hover:bg-teal-700"
                      >
                        حفظ
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* Notification Modal */}
            {modals.notification && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                onClick={() => closeModal('notification')}
              >
                <div
                  className="bg-gray-200 rounded-lg p-6 w-full max-w-sm text-center shadow-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className={`text-base mb-5 ${notificationType === 'error' ? 'text-red-600' : 'text-teal-800'}`}>
                    {notificationMessage}
                  </p>
                  <div className="flex justify-center">
                    <button
                      onClick={() => closeModal('notification')}
                      className="bg-teal-800 text-white py-2 px-4 rounded-md text-md hover:bg-teal-700"
                    >
                      موافق
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </section>
    </Layout>
  );
}
export async function getServerSideProps({ req }: { req: any }) {
  try {
    // Extract cookies
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie: any) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }
    // Check for authToken
    if (!cookies.authToken) {
      return {
        redirect: { destination: "/admin/login", permanent: false },
      };
    }
    // Decode JWT
    const token = jwtDecode(cookies.authToken) as any;
    console.log(token);
    // Fetch user & role with Prisma
    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });
    if (
      !findUser
      // !(findUser.role?.permissions as any)?.["شؤون الاقامة"]?.["عرض"]
    ) {
      return {
        redirect: { destination: "/admin/home", permanent: false },
      };
    }
    return { props: { user: token.username } };
  } catch (err) {
    console.error("Authorization error:", err);
    return {
      redirect: { destination: "/admin/home", permanent: false },
    };
  }
};