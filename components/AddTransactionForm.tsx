import { useState, useEffect } from 'react';
import { Book, Check } from 'lucide-react';
import axios from 'axios';
// import debounce from 'lodash/debounce';
import { CalendarIcon } from '@heroicons/react/outline';
import Style from "../styles/Home.module.css"
interface Client {
  id: number;
  fullname: string;
  phonenumber: string;
  nationalId: string;
  city: string;
}

interface HomeMaid {
  id: number;
  Name: string;
  Nationalitycopy: string;
  Passportnumber: string;
}

interface AddTransactionFormProps {
  transactionId: number | null;
  onBack: () => void;
}

export default function AddTransactionForm({ transactionId, onBack }: AddTransactionFormProps) {
  const [formData, setFormData] = useState({
    HomeMaidId: '',
    HomeMaidName: '',
    Nationality: '',
    PassportNumber: '',
    ResidencyNumber: '',
    EntryDate: '',
    OldClientName: '',
    OldClientPhone: '',
    OldClientId: '',
    OldClientCity: '',
    NewClientName: '',
    NewClientPhone: '',
    NewClientId: '',
    NewClientCity: '',
    ContractDate: '',
    WorkDuration: '',
    Cost: '',
    Paid: '',
    Remaining: '',
    ExperimentDuration: '',
    ExperimentStart: '',
    ExperimentEnd: '',
    ExperimentRate: '',
    Notes: '',
    NationalID: '',
    TransferOperationNumber: '',
    TransferingDate: '',
    file: '',
    stage: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oldClientSuggestions, setOldClientSuggestions] = useState<Client[]>([]);
  const [newClientSuggestions, setNewClientSuggestions] = useState<Client[]>([]);
  const [homemaidOptions, setHomemaidOptions] = useState<HomeMaid[]>([]);
  const [showOldClientDropdown, setShowOldClientDropdown] = useState(false);
  const [showNewClientDropdown, setShowNewClientDropdown] = useState(false);
  
  // Auto search states for old client
  const [isSearchingOldClients, setIsSearchingOldClients] = useState(false);
  const [oldClientSearchTerm, setOldClientSearchTerm] = useState('');
  
  // Auto search states for new client
  const [isSearchingNewClients, setIsSearchingNewClients] = useState(false);
  const [newClientSearchTerm, setNewClientSearchTerm] = useState('');
  
  // Auto search states for homemaid
  const [homemaidSuggestions, setHomemaidSuggestions] = useState<HomeMaid[]>([]);
  const [showHomemaidDropdown, setShowHomemaidDropdown] = useState(false);
  const [isSearchingHomemaids, setIsSearchingHomemaids] = useState(false);
  const [homemaidSearchTerm, setHomemaidSearchTerm] = useState('');

  useEffect(() => {
    fetchHomemaids();
    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.old-client-search-container')) {
        setShowOldClientDropdown(false);
      }
      if (!target.closest('.new-client-search-container')) {
        setShowNewClientDropdown(false);
      }
      if (!target.closest('.homemaid-search-container')) {
        setShowHomemaidDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchHomemaids = async () => {
    try {
      const response = await axios.get(`/api/getallhomemaids`);
      const homemaids = response.data;
      setHomemaidOptions(homemaids.data || []);
    } catch (error) {
      setError('فشل تحميل قائمة العاملات');
    }
  };

  const selectHomemaid = (homemaidId: string) => {
    const selectedHomemaid = homemaidOptions?.find((homemaid) => homemaid.id.toString() === homemaidId);
    if (selectedHomemaid) {
      setFormData((prev) => ({
        ...prev,
        HomeMaidId: selectedHomemaid.id.toString(),
        HomeMaidName: selectedHomemaid.Name || '',
        Nationality: selectedHomemaid.Nationalitycopy || '',
        PassportNumber: selectedHomemaid.Passportnumber || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        HomeMaidId: '',
        HomeMaidName: '',
        Nationality: '',
        PassportNumber: '',
      }));
    }
  };

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/transferSponsorShips?id=${transactionId}`);
      const data = response.data;
      setFormData({
        HomeMaidId: data.HomeMaidId?.toString() || '',
        HomeMaidName: data.HomeMaid?.Name || '',
        Nationality: data.HomeMaid?.Nationalitycopy || '',
        PassportNumber: data.HomeMaid?.Passportnumber || '',
        ResidencyNumber: data.NationalID || '',
        EntryDate: data.KingdomentryDate ? new Date(data.KingdomentryDate).toISOString().split('T')[0] : '',
        OldClientName: data.OldClient?.fullname || '',
        OldClientPhone: data.OldClient?.phonenumber || '',
        OldClientId: data.OldClientId?.toString() || '',
        OldClientCity: data.OldClient?.city || '',
        NewClientName: data.NewClient?.fullname || '',
        NewClientPhone: data.NewClient?.phonenumber || '',
        NewClientId: data.NewClientId?.toString() || '',
        NewClientCity: data.NewClient?.city || '',
        ContractDate: data.ContractDate ? new Date(data.ContractDate).toISOString().split('T')[0] : '',
        WorkDuration: data.WorkDuration || '',
        Cost: data.Cost?.toString() || '',
        stage: data.transferStage || '',//
        Paid: data.Paid?.toString() || '',
        Remaining: ((data.Cost || 0) - (data.Paid || 0)).toString() || '',
        ExperimentDuration: data.ExperimentDuration || '',
        ExperimentStart: data.ExperimentStart ? new Date(data.ExperimentStart).toISOString().split('T')[0] : '',
        ExperimentEnd: data.ExperimentEnd ? new Date(data.ExperimentEnd).toISOString().split('T')[0] : '',
        ExperimentRate: data.ExperimentRate || '',
        Notes: data.Notes || '',
        NationalID: data.NationalID || '',
        TransferOperationNumber: data.TransferOperationNumber || '',
        TransferingDate: data.TransferingDate ? new Date(data.TransferingDate).toISOString().split('T')[0] : '',
        file: data.file || '',
      });
      setLoading(false);
    } catch (err) {
      setError('فشل تحميل بيانات المعاملة');
      setLoading(false);
    }
  };

  // Auto search functions for old clients
  const searchOldClients = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setOldClientSuggestions([]);
      setShowOldClientDropdown(false);
      return;
    }
    
    setIsSearchingOldClients(true);
    try {
      const response = await fetch(`/api/clients/suggestions?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setOldClientSuggestions(data.suggestions || []);
        setShowOldClientDropdown(true);
      } else {
        console.error('Error searching old clients');
        setOldClientSuggestions([]);
        setShowOldClientDropdown(false);
      }
    } catch (error) {
      console.error('Error searching old clients:', error);
      setOldClientSuggestions([]);
      setShowOldClientDropdown(false);
    } finally {
      setIsSearchingOldClients(false);
    }
  };

  // Auto search functions for new clients
  const searchNewClients = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setNewClientSuggestions([]);
      setShowNewClientDropdown(false);
      return;
    }
    
    setIsSearchingNewClients(true);
    try {
      const response = await fetch(`/api/clients/suggestions?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setNewClientSuggestions(data.suggestions || []);
        setShowNewClientDropdown(true);
      } else {
        console.error('Error searching new clients');
        setNewClientSuggestions([]);
        setShowNewClientDropdown(false);
      }
    } catch (error) {
      console.error('Error searching new clients:', error);
      setNewClientSuggestions([]);
      setShowNewClientDropdown(false);
    } finally {
      setIsSearchingNewClients(false);
    }
  };

  // Auto search functions for homemaids
  const searchHomemaids = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setHomemaidSuggestions([]);
      setShowHomemaidDropdown(false);
      return;
    }
    
    setIsSearchingHomemaids(true);
    try {
      const response = await fetch(`/api/homemaids/suggestions?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setHomemaidSuggestions(data.suggestions || []);
        setShowHomemaidDropdown(true);
      } else {
        console.error('Error searching homemaids');
        setHomemaidSuggestions([]);
        setShowHomemaidDropdown(false);
      }
    } catch (error) {
      console.error('Error searching homemaids:', error);
      setHomemaidSuggestions([]);
      setShowHomemaidDropdown(false);
    } finally {
      setIsSearchingHomemaids(false);
    }
  };

  // Legacy search function - keeping for backward compatibility
  const searchClients = async (query: string, type: 'old' | 'new') => {
    if (!query) {
      type === 'old' ? setOldClientSuggestions([]) : setNewClientSuggestions([]);
      type === 'old' ? setShowOldClientDropdown(false) : setShowNewClientDropdown(false);
      return;
    }
    try {
      const response = await axios.get(`/api/clientssearch?query=${encodeURIComponent(query)}`);
      const clients = response.data;
      type === 'old' ? setOldClientSuggestions(clients) : setNewClientSuggestions(clients);
      type === 'old' ? setShowOldClientDropdown(true) : setShowNewClientDropdown(true);
    } catch (err) {
      setError('فشل البحث عن العملاء');
    }
  };

  // Handle old client search input change
  const handleOldClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOldClientSearchTerm(value);
    setFormData((prev) => ({ ...prev, OldClientName: value }));
    
    if (value.trim()) {
      searchOldClients(value);
    } else {
      setOldClientSuggestions([]);
      setShowOldClientDropdown(false);
    }
  };

  // Handle new client search input change
  const handleNewClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewClientSearchTerm(value);
    setFormData((prev) => ({ ...prev, NewClientName: value }));
    
    if (value.trim()) {
      searchNewClients(value);
    } else {
      setNewClientSuggestions([]);
      setShowNewClientDropdown(false);
    }
  };

  // Handle old client suggestion click
  const handleOldClientSuggestionClick = (client: Client) => {
    setFormData((prev) => ({
      ...prev,
      OldClientName: client.fullname,
      OldClientPhone: client.phonenumber,
      OldClientId: client.id.toString(),
      OldClientCity: client.city,
    }));
    setOldClientSearchTerm(client.fullname);
    setShowOldClientDropdown(false);
  };

  // Handle new client suggestion click
  const handleNewClientSuggestionClick = (client: Client) => {
    setFormData((prev) => ({
      ...prev,
      NewClientName: client.fullname,
      NewClientPhone: client.phonenumber,
      NewClientId: client.id.toString(),
      NewClientCity: client.city,
    }));
    setNewClientSearchTerm(client.fullname);
    setShowNewClientDropdown(false);
  };

  // Handle input blur for suggestions
  const handleOldClientInputBlur = () => {
    setTimeout(() => {
      setShowOldClientDropdown(false);
    }, 200);
  };

  const handleNewClientInputBlur = () => {
    setTimeout(() => {
      setShowNewClientDropdown(false);
    }, 200);
  };

  // Handle homemaid search input change
  const handleHomemaidSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHomemaidSearchTerm(value);
    setFormData((prev) => ({ ...prev, HomeMaidName: value }));
    
    if (value.trim()) {
      searchHomemaids(value);
    } else {
      setHomemaidSuggestions([]);
      setShowHomemaidDropdown(false);
    }
  };

  // Handle homemaid suggestion click
  const handleHomemaidSuggestionClick = (homemaid: HomeMaid) => {
    setFormData((prev) => ({
      ...prev,
      HomeMaidId: homemaid.id.toString(),
      HomeMaidName: homemaid.Name,
      Nationality: homemaid.Nationalitycopy,
      PassportNumber: homemaid.Passportnumber,
    }));
    setHomemaidSearchTerm(homemaid.Name);
    setShowHomemaidDropdown(false);
  };

  // Handle homemaid input blur
  const handleHomemaidInputBlur = () => {
    setTimeout(() => {
      setShowHomemaidDropdown(false);
    }, 200);
  };

  const selectClient = (client: Client, type: 'old' | 'new') => {
    const prefix = type === 'old' ? 'Old' : 'New';
    const clientData = {
      [`${prefix}ClientName`]: client.fullname || '',
      [`${prefix}ClientPhone`]: client.phonenumber || '',
      [`${prefix}ClientId`]: client.id.toString() || '',
      [`${prefix}ClientCity`]: client.city || '',
    };
    setFormData((prev) => ({ ...prev, ...clientData }));
    type === 'old' ? setShowOldClientDropdown(false) : setShowNewClientDropdown(false);
    type === 'old' ? setOldClientSuggestions([]) : setNewClientSuggestions([]);
  };

  const createNewClient = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/clientssearch', {
        fullname: formData.NewClientName,
        phonenumber: formData.NewClientPhone,
        nationalId: formData.NewClientId,
        city: formData.NewClientCity,
      });
      const newClient = response.data;
      setFormData((prev) => ({
        ...prev,
        NewClientId: newClient.id.toString(),
        NewClientName: newClient.fullname,
        NewClientPhone: newClient.phonenumber,
        NewClientCity: newClient.city,
      }));
      setNewClientSuggestions([]);
      setShowNewClientDropdown(false);
      setLoading(false);
    } catch (err) {
      setError('فشل إنشاء عميل جديد');
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(name,value)
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (['OldClientName', 'OldClientPhone', 'OldClientId', 'OldClientCity'].includes(name)) {
      searchClients(value, 'old');
    } else if (['NewClientName', 'NewClientPhone', 'NewClientId', 'NewClientCity'].includes(name)) {
      searchClients(value, 'new');
    } else if (name === 'HomeMaidId') {
      selectHomemaid(value);
    }
  };

  // Function to determine the current stage based on form data
  const determineStage = (data: any) => {
    const stages = [
      'انشاء الطلب',
      'انشاء العقد',
      'فترة التجربة',
      'تقييم التجربة',
      'نقل الخدمات',
    ];

    // Check fields for each stage to determine the furthest completed stage
    if (
      data.NationalID &&
      data.TransferOperationNumber &&
      data.TransferingDate
    ) {
      return stages[4]; // نقل الخدمات
    } else if (data.ExperimentRate && data.Notes) {
      return stages[3]; // تقييم التجربة
    } else if (
      data.ExperimentDuration &&
      data.ExperimentStart &&
      data.ExperimentEnd
    ) {
      return stages[2]; // فترة التجربة
    } else if (
      data.ContractDate &&
      // data.WorkDuration &&
      data.Cost &&
      data.Paid
    ) {
      return stages[1]; // انشاء العقد
    } else if (
      data.HomeMaidId &&
      data.OldClientId &&
      data.NewClientId
    ) {
      return stages[0]; // انشاء الطلب
    }
    return stages[0]; // Default to first stage if no fields are filled
  };

  // Modified handleSubmit to dynamically set the stage
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const currentStage = determineStage(formData); // Determine the current stage
      const data = {
  HomeMaidId: formData.HomeMaidId ? parseInt(formData.HomeMaidId) : undefined,
  OldClientId: formData.OldClientId ? parseInt(formData.OldClientId) : undefined,
  NewClientId: formData.NewClientId ? parseInt(formData.NewClientId) : undefined,
  Cost: formData.Cost ? parseFloat(formData.Cost) : undefined,
  Paid: formData.Paid ? parseFloat(formData.Paid) : undefined,
  ExperimentStart: formData.ExperimentStart || undefined,
  ExperimentEnd: formData.ExperimentEnd || undefined,
  ExperimentRate: formData.ExperimentRate || undefined,
  Notes: formData.Notes || undefined,
  NationalID: formData.NationalID || undefined,
  TransferingDate: formData.TransferingDate || undefined,
  file: formData.file || undefined,
  transferStage: currentStage,
  ContractDate: formData.ContractDate || undefined, // إضافة ContractDate
};
      if (transactionId) {
        await axios.put(`/api/transferSponsorShips?id=${transactionId}`, data);
      } else {
        await axios.post('/api/transferSponsorShips', data);
      }
      setLoading(false);
      onBack();
    } catch (err) {
      setError('فشل حفظ المعاملة');
      setLoading(false);
    }
  };

  const steps = [
    { label: 'انشاء الطلب', icon: '/page/e203ec96-19a6-4894-aea2-c39c45a6f9b2/images/I1836_21630_1836_21549_1840_22767.svg' },
    { label: 'انشاء العقد', icon: '/page/e203ec96-19a6-4894-aea2-c39c45a6f9b2/images/I1836_21630_1836_21549_1836_22115.svg' },
    { label: 'فترة التجربة', icon: '/page/e203ec96-19a6-4894-aea2-c39c45a6f9b2/images/I1836_21630_1836_21549_1836_22255.svg' },
    { label: 'تقييم التجربة', icon: '/page/e203ec96-19a6-4894-aea2-c39c45a6f9b2/images/I1836_21630_1836_21549_1836_22519.svg' },
    { label: 'نقل الخدمات', icon: '/page/e203ec96-19a6-4894-aea2-c39c45a6f9b2/images/I1836_21630_1836_21549_1836_21541.svg' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-8  min-h-screen font-['Tajawal'] text-gray-800" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-normal text-black">
          {transactionId ? `معاملة #${transactionId}` : 'إضافة معاملة جديدة'}
        </h1>
        <button
          className="bg-teal-900 text-white text-sm px-6 py-2 rounded-md hover:bg-teal-800"
          onClick={onBack}
        >
          الغاء العقد
        </button>
      </div>
      {/* Stepper */}
      <div className="flex justify-between items-center flex-wrap gap-2 mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center gap-3 relative">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                formData.stage === step.label ? 'bg-teal-600' : 'bg-teal-900'
              }`}
            >
              <Check color="white" />
            </div>
            <p className="text-xs text-black m-0">{step.label}</p>
          </div>
        ))}
      </div>
      {/* Error and Loading States */}
      {error && <p className="text-red-500 text-center mb-6">{error}</p>}
      {loading && <p className="text-center mb-6">جاري التحميل...</p>}
      {/* Form Sections */}
      <div className="flex flex-col gap-6">
        {/* انشاء الطلب */}
        <section className="bg-gray-100 border border-gray-200 rounded-md p-8 flex flex-col gap-10">
          <h2 className="text-2xl font-normal text-black text-center m-0">انشاء الطلب</h2>
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-normal text-black text-right m-0">معلومات العاملة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { label: 'اختر العاملة', name: 'HomeMaidId', type: 'select' },
                { label: 'اسم العاملة', name: 'HomeMaidName', type: 'text', disabled: true },
                { label: 'الجنسية', name: 'Nationality', type: 'text', disabled: true },
                { label: 'رقم جواز السفر', name: 'PassportNumber', type: 'text', disabled: true },
                { label: 'رقم الاقامة', name: 'ResidencyNumber', type: 'text' },
                { label: 'تاريخ دخول المملكة', name: 'EntryDate', type: 'date' },
              ].map(({ label, name, type, disabled }) => (
                <div key={name} className="flex flex-col gap-2 relative">
                  <label className="text-base text-gray-800 text-right">{label}</label>
                  {name === 'HomeMaidId' ? (
                    <div className="relative homemaid-search-container">
                      <input
                        type="text"
                        value={homemaidSearchTerm}
                        onChange={handleHomemaidSearchChange}
                        onBlur={handleHomemaidInputBlur}
                        onFocus={() => homemaidSearchTerm.length >= 1 && setShowHomemaidDropdown(true)}
                        placeholder="ابحث عن العاملة بالاسم"
                        className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500 text-right w-full h-full"
                      />
                      {isSearchingHomemaids && (
                        <div className="absolute right-3 top-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                        </div>  
                      )}
                      
                      {/* Homemaid Search Results Dropdown */}
                      {showHomemaidDropdown && homemaidSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {homemaidSuggestions.map((homemaid, index) => (
                            <div
                              key={index}
                              onClick={() => handleHomemaidSuggestionClick(homemaid)}
                              className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                            >
                              <div className="font-medium text-md">{homemaid.Name}</div>
                              <div className="text-sm text-gray-500">{homemaid.Nationalitycopy} - {homemaid.Passportnumber}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500 ${type === 'date' ? 'flex justify-between items-center' : ''}`}>
                      <input
                        type={type}
                        name={name}
                        value={formData[name as keyof typeof formData]}
                        onChange={handleInputChange}
                        placeholder={`ادخل ${label}`}
                        className="bg-transparent outline-none border-none w-full text-right"
                        disabled={disabled}
                      />
                      {type === 'date' && 
                      <CalendarIcon className="w-5 h-5 text-gray-400" />  
                      }
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-normal text-black text-right m-0">معلومات العميل الحالي</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { label: 'اسم العميل الحالي', name: 'OldClientName', type: 'text' },
                { label: 'رقم الهاتف', name: 'OldClientPhone', type: 'text' },
                { label: 'رقم الهوية', name: 'OldClientId', type: 'number' },
                { label: 'المدينة', name: 'OldClientCity', type: 'text' },
              ].map(({ label, name, type }) => (
                <div key={name} className="flex flex-col gap-2 relative">
                  <label className="text-base text-gray-800 text-right">{label}</label>
                  {name === 'OldClientName' ? (
                    <div className="relative old-client-search-container">
                      <input
                        type="text"
                        value={oldClientSearchTerm}
                        onChange={handleOldClientSearchChange}
                        onBlur={handleOldClientInputBlur}
                        onFocus={() => oldClientSearchTerm.length >= 1 && setShowOldClientDropdown(true)}
                        placeholder="ابحث عن العميل الحالي بالاسم أو رقم الهاتف"
                        className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500 text-right w-full"
                      />
                      {isSearchingOldClients && (
                        <div className="absolute right-3 top-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                        </div>
                      )}
                      
                      {/* Old Client Search Results Dropdown */}
                      {showOldClientDropdown && oldClientSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {oldClientSuggestions.map((client, index) => (
                            <div
                              key={index}
                              onClick={() => handleOldClientSuggestionClick(client)}
                              className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                            >
                              <div className="font-medium text-md">{client.fullname}</div>
                              <div className="text-sm text-gray-500">{client.phonenumber} - {client.city}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500`}>
                      <input
                        type={type}
                        name={name}
                        value={formData[name as keyof typeof formData]}
                        onChange={handleInputChange}
                        placeholder={`ادخل ${label}`}
                        className="bg-transparent outline-none border-none w-full text-right"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-normal text-black text-right m-0">معلومات العميل الجديد</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { label: 'اسم العميل الجديد', name: 'NewClientName', type: 'text' },
                { label: 'رقم الهاتف', name: 'NewClientPhone', type: 'text' },
                { label: 'رقم الهوية', name: 'NewClientId', type: 'number' },
                { label: 'المدينة', name: 'NewClientCity', type: 'text' },
              ].map(({ label, name, type }) => (
                <div key={name} className="flex flex-col gap-2 relative">
                  <label className="text-base text-gray-800 text-right">{label}</label>
                  {name === 'NewClientName' ? (
                    <div className="relative new-client-search-container">
                      <input
                        type="text"
                        value={newClientSearchTerm}
                        onChange={handleNewClientSearchChange}
                        onBlur={handleNewClientInputBlur}
                        onFocus={() => newClientSearchTerm.length >= 1 && setShowNewClientDropdown(true)}
                        placeholder="ابحث عن العميل الجديد بالاسم أو رقم الهاتف"
                        className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500 text-right w-full"
                      />
                      {isSearchingNewClients && (
                        <div className="absolute right-3 top-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                        </div>
                      )}
                      
                      {/* New Client Search Results Dropdown */}
                      {showNewClientDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {newClientSuggestions.length > 0 ? (
                            newClientSuggestions.map((client, index) => (
                              <div
                                key={index}
                                onClick={() => handleNewClientSuggestionClick(client)}
                                className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                              >
                                <div className="font-medium text-md">{client.fullname}</div>
                                <div className="text-sm text-gray-500">{client.phonenumber} - {client.city}</div>
                              </div>
                            ))
                          ) : newClientSearchTerm ? (
                            <div
                              className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                              onClick={createNewClient}
                            >
                              إضافة عميل جديد: {newClientSearchTerm}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500`}>
                      <input
                        type={type}
                        name={name}
                        value={formData[name as keyof typeof formData]}
                        onChange={handleInputChange}
                        placeholder={`ادخل ${label}`}
                        className="bg-transparent outline-none border-none w-full text-right"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4 justify-start">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-teal-900 text-white text-sm px-6 py-2 rounded-md disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button
              onClick={onBack}
              className="border border-teal-900 text-gray-800 text-sm px-6 py-2 rounded-md"
            >
              تعديل
            </button>
          </div>
        </section>
        {/* انشاء العقد */}
        <section className="bg-gray-100 border border-gray-200 rounded-md p-8 flex flex-col gap-10">
          <h2 className="text-2xl font-normal text-black text-center m-0">انشاء العقد</h2>
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-normal text-black text-right m-0">تفاصيل المعاملة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { label: 'تاريخ اليوم', name: 'ContractDate', type: 'date' },
                { label: 'مدة العمل', name: 'WorkDuration', type: 'text' },
                { label: 'تكلفة المعاملة', name: 'Cost', type: 'number' },
                { label: 'المدفوع', name: 'Paid', type: 'number' },
                { label: 'المتبقي', name: 'Remaining', type: 'number', disabled: true },
              ].map(({ label, name, type, disabled }) => (
                <div key={name} className="flex flex-col gap-2">
                  <label className="text-base text-gray-800 text-right">{label}</label>
                  <div className={`bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500 ${type === 'date' ? 'flex justify-between items-center' : ''}`}>
                    <input
                      type={type}
                      name={name}
                      value={formData[name as keyof typeof formData]}
                      onChange={handleInputChange}
                      placeholder={`ادخل ${label}`}
                      className="bg-transparent outline-none border-none w-full text-right"
                      disabled={disabled}
                    />
                    {type === 'date' &&
                     <CalendarIcon className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4 justify-start">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-teal-900 text-white text-sm px-6 py-2 rounded-md disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button
              onClick={onBack}
              className="border border-teal-900 text-gray-800 text-sm px-6 py-2 rounded-md"
            >
              تعديل
            </button>
          </div>
        </section>
        {/* فترة التجربة */}
        <section className="bg-gray-100 border border-gray-200 rounded-md p-8 flex flex-col gap-10">
          <h2 className="text-2xl font-normal text-black text-center m-0">فترة التجربة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { label: 'مدة التجربة', name: 'ExperimentDuration', type: 'text' },
              { label: 'بداية التجربة', name: 'ExperimentStart', type: 'date' },
              { label: 'نهاية التجربة', name: 'ExperimentEnd', type: 'date' },
            ].map(({ label, name, type }) => (
              <div key={name} className="flex flex-col gap-2">
                <label className="text-base text-gray-800 text-right">{label}</label>
                <div className={`bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500 ${type === 'date' ? 'flex justify-between items-center' : ''}`}>
                  <input
                    type={type}
                    name={name}
                    value={formData[name as keyof typeof formData]}
                    onChange={handleInputChange}
                    placeholder={`ادخل ${label}`}
                    className="bg-transparent outline-none border-none w-full text-right"
                  />
                  {type === 'date' && 
                  <CalendarIcon className="w-5 h-5 text-gray-400" />}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 justify-start">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-teal-900 text-white text-sm px-6 py-2 rounded-md disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button
              onClick={onBack}
              className="border border-teal-900 text-gray-800 text-sm px-6 py-2 rounded-md"
            >
              تعديل
            </button>
          </div>
        </section>
        {/* تقييم التجربة */}
        <section className="bg-gray-100 border border-gray-200 rounded-md p-8 flex flex-col gap-10">
          <h2 className="text-2xl font-normal text-black text-center m-0">تقييم التجربة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { label: 'نتيجة التجربة', name: 'ExperimentRate', type: 'select', options: ['جيد', 'متوسط', 'ضعيف'] },
              { label: 'ملاحظات', name: 'Notes', type: 'text' },
            ].map(({ label, name, type, options }) => (
              <div key={name} className="flex flex-col gap-2">
                <label className="text-base text-gray-800 text-right">{label}</label>
                {type === 'select' ? (
                  <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500 text-right">
                    <select
                      name={name}
                      value={formData[name as keyof typeof formData]}
                      onChange={handleInputChange}
                      className="bg-transparent outline-none border-none w-full text-right"
                    >
                      <option value="">اختر {label}</option>
                      {options?.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500">
                    <input
                      type={type}
                      name={name}
                      value={formData[name as keyof typeof formData]}
                      onChange={handleInputChange}
                      placeholder={`ادخل ${label}`}
                      className="bg-transparent outline-none border-none w-full text-right"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-4 justify-start">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-teal-900 text-white text-sm px-6 py-2 rounded-md disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'تأكيد'}
            </button>
            <button
              onClick={onBack}
              className="bg-gray-100 border border-teal-900 text-gray-800 text-sm px-6 py-2 rounded-md"
            >
              الغاء التعديل
            </button>
          </div>
        </section>
        {/* نقل الخدمات */}
        <section className="bg-gray-100 border border-gray-200 rounded-md p-8 flex flex-col gap-10">
          <h2 className="text-2xl font-normal text-black text-center m-0">نقل الخدمات</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { label: 'رقم الاقامة', name: 'NationalID', type: 'text' },
              { label: 'رقم عملية نقل الكفالة', name: 'TransferOperationNumber', type: 'text' },
              { label: 'تاريخ تنفيذ النقل', name: 'TransferingDate', type: 'date' },
              { label: 'ملف', name: 'file', type: 'file' },
            ].map(({ label, name, type }) => (
              <div key={name} className="flex flex-col gap-2">
                <label className="text-base text-gray-800 text-right">{label}</label>
                {type === 'file' ? (
                  <div className="bg-gray-50 border border-gray-300 rounded-md p-2 flex justify-between items-center">
                    <span className="text-gray-500 text-sm">ارفاق ملف</span>
                    <button className="bg-teal-900 text-white text-xs px-3 py-1 rounded-md">اختيار ملف</button>
                  </div>
                ) : (
                  <div className={`bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500 ${type === 'date' ? 'flex justify-between items-center' : ''}`}>
                    <input
                      type={type}
                      name={name}
                      value={formData[name as keyof typeof formData]}
                      onChange={handleInputChange}
                      placeholder={`ادخل ${label}`}
                      className="bg-transparent outline-none border-none w-full text-right"
                    />
                    {type === 'date' &&
                     <CalendarIcon className="w-5 h-5 text-gray-400" />}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-4 justify-start">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-teal-900 text-white text-sm px-6 py-2 rounded-md disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'تأكيد'}
            </button>
            <button
              onClick={onBack}
              className="bg-gray-100 border border-teal-900 text-gray-800 text-sm px-6 py-2 rounded-md"
            >
              الغاء التعديل
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}