import { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import axios from 'axios';
import { CalendarIcon } from '@heroicons/react/outline';
import Style from "../styles/Home.module.css";
import { useRouter } from 'next/router';
import Layout from 'example/containers/Layout';
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

export default function AddTransactionForm({ onBack }: AddTransactionFormProps) {
  const router = useRouter();
  const transactionId = router.query.id;
  const [formData, setFormData] = useState({
    HomeMaidId: '',
    HomeMaidName: '',
    Nationality: '',
    PassportNumber: '',
    ResidencyNumber: '',
    EntryDate: '',
    OldClientName: '',
    TransferOperationNumber:"",
    ExperimentDuration: '',
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
    ExperimentStart: '',
    ExperimentEnd: '',
    ExperimentRate: '',
    Notes: '',
    NationalID: '',
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
  const [isSearchingOldClients, setIsSearchingOldClients] = useState(false);
  const [oldClientSearchTerm, setOldClientSearchTerm] = useState('');
  const [isSearchingNewClients, setIsSearchingNewClients] = useState(false);
  const [newClientSearchTerm, setNewClientSearchTerm] = useState('');
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

  const fileInputRef = useRef<HTMLInputElement>(null);
const [selectedFileName, setSelectedFileName] = useState<string>('');

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) {
    setError('لم يتم اختيار ملف');
    return;
  }
console.log(files)
  const file = files[0];
  setSelectedFileName(file.name); // اعرض الاسم فورًا

  const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedFileTypes.includes(file.type)) {
    setError('نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)');
    setSelectedFileName('');
    return;
  }

  try {
    const res = await fetch(`/api/upload-image-presigned-url/transfer-${formData.HomeMaidId}`);
    if (!res.ok) throw new Error('فشل في الحصول على رابط الرفع');
    const { url, filePath } = await res.json();

    const uploadRes = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type, 'x-amz-acl': 'public-read' },
    });

    if (uploadRes.ok) {
      setFormData((prev) => ({ ...prev, file: filePath }));
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      throw new Error('فشل في رفع الملف');
    }
  } catch (error: any) {
    setError(error.message || 'حدث خطأ أثناء رفع الملف');
    setSelectedFileName('');
  }
};

  const selectHomemaid = (homemaidId: string) => {
    const selectedHomemaid = homemaidOptions?.find((homemaid) => homemaid.id.toString() === homemaidId);
    if (selectedHomemaid) {
      setFormData((prev) => ({
        ...prev,
        HomeMaidId: selectedHomemaid.id.toString() || '',
        HomeMaidName: selectedHomemaid.Name || '',
        Nationality: selectedHomemaid.Nationalitycopy || '',
        PassportNumber: selectedHomemaid.Passportnumber || '',
      }));
      setHomemaidSearchTerm(selectedHomemaid.Name || '');
    } else {
      setFormData((prev) => ({
        ...prev,
        HomeMaidId: '',
        HomeMaidName: '',
        Nationality: '',
        PassportNumber: '',
      }));
      setHomemaidSearchTerm('');
    }
  };

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/transferSponsorShips?id=${transactionId}`);
      const data = response.data;
      console.log(data)
      setFormData({
        HomeMaidId: data.HomeMaidId?.toString() || '',
        HomeMaidName: data.HomeMaid?.Name || '',
        Nationality: data.HomeMaid?.Nationalitycopy || '',
        PassportNumber: data.HomeMaid?.Passportnumber || '',
        ResidencyNumber: data.NationalID || '',
        EntryDate: data.EntryDate ? new Date(data.EntryDate).toISOString().split('T')[0] : '',
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
        stage: data.transferStage || '',
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
      setOldClientSearchTerm(data.OldClient?.fullname || '');
      setNewClientSearchTerm(data.NewClient?.fullname || '');
      setHomemaidSearchTerm(data.HomeMaid?.Name || '');
      setLoading(false);
    } catch (err) {
      setError('فشل تحميل بيانات المعاملة');
      setLoading(false);
    }
  };

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
        setOldClientSuggestions([]);
        setShowOldClientDropdown(false);
      }
    } catch (error) {
      setOldClientSuggestions([]);
      setShowOldClientDropdown(false);
    } finally {
      setIsSearchingOldClients(false);
    }
  };

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
        setNewClientSuggestions(data.suggestions || []);
        setShowNewClientDropdown(true);
      } else {
        setNewClientSuggestions([]);
        setShowNewClientDropdown(false);
      }
    } catch (error) {
      setNewClientSuggestions([]);
      setShowNewClientDropdown(false);
    } finally {
      setIsSearchingNewClients(false);
    }
  };

  const searchHomemaids = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setHomemaidSuggestions([]);
      setShowHomemaidDropdown(false);
      return;
    }
    setIsSearchingHomemaids(true);
    try {
      const response = await fetch(`/api/externals/suggestions?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setHomemaidSuggestions(data.suggestions || []);
        setShowHomemaidDropdown(true);
      } else {
        setHomemaidSuggestions([]);
        setShowHomemaidDropdown(false);
      }
    } catch (error) {
      setHomemaidSuggestions([]);
      setShowHomemaidDropdown(false);
    } finally {
      setIsSearchingHomemaids(false);
    }
  };

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

  const handleHomemaidInputBlur = () => {
    setTimeout(() => {
      setShowHomemaidDropdown(false);
    }, 200);
  };

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
      setNewClientSearchTerm(newClient.fullname);
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'Cost' || name === 'Paid'
        ? { Remaining: (parseFloat(formData.Cost || '0') - parseFloat(formData.Paid || '0')).toString() }
        : {}),
    }));
  };

  const determineStage = (data: any) => {
    const stages = [
      'انشاء الطلب',
      'انشاء العقد',
      'فترة التجربة',
      'تقييم التجربة',
      'نقل الخدمات',
    ];
    if (data.NationalID && data.TransferOperationNumber && data.TransferingDate) {
      return stages[4];
    } else if (data.ExperimentRate && data.Notes) {
      return stages[3];
    } else if (data.ExperimentDuration && data.ExperimentStart && data.ExperimentEnd) {
      return stages[2];
    } else if (data.ContractDate && data.Cost && data.Paid) {
      return stages[1];
    } else if (data.HomeMaidId && data.OldClientId && data.NewClientId) {
      return stages[0];
    }
    return stages[0];
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const currentStage = determineStage(formData);
      const data = {
        HomeMaidId: formData.HomeMaidId ? parseInt(formData.HomeMaidId) : undefined,
        OldClientId: formData.OldClientId ? parseInt(formData.OldClientId) : undefined,
        NewClientId: formData.NewClientId ? parseInt(formData.NewClientId) : undefined,
        Cost: formData.Cost ? parseFloat(formData.Cost) : undefined,
        Paid: formData.Paid ? parseFloat(formData.Paid) : undefined,
        ExperimentStart: formData.ExperimentStart || undefined,
        EntryDate: formData.EntryDate ? new Date(formData.EntryDate) : undefined,
        TransferOperationNumber: formData.TransferOperationNumber || undefined,
        ExperimentDuration: formData.ExperimentDuration || undefined,
        WorkDuration: formData.WorkDuration || undefined,
        KingdomEntryDate: formData.EntryDate || undefined,
        ExperimentEnd: formData.ExperimentEnd || undefined,
        ExperimentRate: formData.ExperimentRate || undefined,
        Notes: formData.Notes || undefined,
        NationalID: formData.NationalID || undefined,
        TransferingDate: formData.TransferingDate || undefined,
        file: formData.file || undefined,
        transferStage: currentStage,
        ContractDate: formData.ContractDate || undefined,
      };
      if (!data.HomeMaidId || !data.OldClientId || !data.NewClientId) {
        throw new Error('يرجى ملء جميع الحقول المطلوبة لإنشاء الطلب');
      }
      if (transactionId) {
        await axios.put(`/api/transferSponsorShips?id=${transactionId}`, data);
      } else {
        await axios.post('/api/transferSponsorShips', data);
      }
      setLoading(false);
      // onBack();
      fetchTransaction();
    } catch (err: any) {
      setError(err.message || 'فشل حفظ المعاملة');
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
    <Layout>

    <div className="w-full mx-auto p-8 min-h-screen font-['Tajawal'] text-gray-800" dir="rtl">
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
        {/* إنشاء الطلب */}
        <section className="bg-gray-100 border border-gray-200 rounded-md p-8 flex flex-col gap-10">
          <h2 className="text-2xl font-normal text-black text-center m-0">إنشاء الطلب</h2>
          {/* معلومات العاملة */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-normal text-black text-right m-0">معلومات العاملة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* اختر العاملة */}
              <div className="flex flex-col gap-2 relative homemaid-search-container">
                <label className="text-base text-gray-800 text-right">اختر العاملة</label>
                <input
                  type="text"
                  value={homemaidSearchTerm}
                  onChange={handleHomemaidSearchChange}
                  onBlur={handleHomemaidInputBlur}
                  onFocus={() => homemaidSearchTerm.length >= 1 && setShowHomemaidDropdown(true)}
                  placeholder="ابحث عن العاملة بالاسم"
                  className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500 text-right h-full w-full"
                />
                {isSearchingHomemaids && (
                  <div className="absolute right-3 top-9">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                  </div>
                )}
                {showHomemaidDropdown && homemaidSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {homemaidSuggestions.map((homemaid, index) => (
                      <div
                        key={index}
                        onClick={() => handleHomemaidSuggestionClick(homemaid)}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                      >
                        <div className="font-medium text-md">{homemaid.Name}</div>
                        <div className="text-sm text-gray-500">
                          {homemaid.Nationalitycopy} - {homemaid.Passportnumber}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* اسم العاملة */}
              {/* <div className="flex flex-col gap-2">
                <label className="text-base text-gray-800 text-right">اسم العاملة</label>
                <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500">
                  <input
                    type="text"
                    name="HomeMaidName"
                    value={formData.HomeMaidName}
                    onChange={handleInputChange}
                    placeholder="ادخل اسم العاملة"
                    className="bg-transparent outline-none border-none w-full text-right"
                    disabled
                  />
                </div>
              </div> */}
              {/* الجنسية */}
              <div className="flex flex-col gap-2">
                <label className="text-base text-gray-800 text-right">الجنسية</label>
                <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500">
                  <input
                    type="text"
                    name="Nationality"
                    value={formData.Nationality}
                    onChange={handleInputChange}
                    placeholder="ادخل الجنسية"
                    className="bg-transparent outline-none border-none w-full text-right"
                    disabled
                  />
                </div>
              </div>
              {/* رقم جواز السفر */}
              <div className="flex flex-col gap-2">
                <label className="text-base text-gray-800 text-right">رقم جواز السفر</label>
                <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500">
                  <input
                    type="text"
                    name="PassportNumber"
                    value={formData.PassportNumber}
                    onChange={handleInputChange}
                    placeholder="ادخل رقم جواز السفر"
                    className="bg-transparent outline-none border-none w-full text-right"
                    disabled
                  />
                </div>
              </div>
              {/* رقم الإقامة */}
              <div className="flex flex-col gap-2">
                <label className="text-base text-gray-800 text-right">رقم الإقامة</label>
                <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500">
                  <input
                    type="text"
                    name="ResidencyNumber"
                    value={formData.ResidencyNumber}
                    onChange={handleInputChange}
                    placeholder="ادخل رقم الإقامة"
                    className="bg-transparent outline-none border-none w-full text-right"
                  />
                </div>
              </div>
              {/* تاريخ دخول المملكة */}
              <div className="flex flex-col gap-2">
                <label className="text-base text-gray-800 text-right">تاريخ دخول المملكة</label>
                <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500 flex justify-between items-center">
               
                  <input
                    type="date"
                    name="EntryDate"
                    value={formData?.EntryDate}
                    onChange={(e) => setFormData({ ...formData, EntryDate: e.target.value })}
                    placeholder="ادخل تاريخ دخول المملكة"
                    className="bg-transparent outline-none border-none w-full text-right"
                  />
                  {/* <CalendarIcon className="w-5 h-5 text-gray-400" /> */}
                </div>
              </div>
            </div>
          </div>
          {/* معلومات العميل الحالي */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-normal text-black text-right m-0">معلومات العميل الحالي</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* اسم العميل الحالي */}
              <div className="flex flex-col gap-2 relative old-client-search-container">
                <label className="text-base text-gray-800 text-right">اسم العميل الحالي</label>
                <input
                  type="text"
                  value={oldClientSearchTerm}
                  onChange={handleOldClientSearchChange}
                  onBlur={handleOldClientInputBlur}
                  onFocus={() => oldClientSearchTerm.length >= 1 && setShowOldClientDropdown(true)}
                  placeholder="ابحث عن العميل الحالي بالاسم أو رقم الهاتف"
                  className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500 h-full text-right w-full"
                />
                {isSearchingOldClients && (
                  <div className="absolute right-3 top-9">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                  </div>
                )}
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
              {/* رقم الهاتف */}
              <div className="flex flex-col gap-2">
                <label className="text-base text-gray-800 text-right">رقم الهاتف</label>
                <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500">
                  <input
                    type="text"
                    name="OldClientPhone"
                    value={formData.OldClientPhone}
                    onChange={handleInputChange}
                    placeholder="ادخل رقم الهاتف"
                    className="bg-transparent outline-none border-none w-full text-right"
                  />
                </div>
              </div>
              {/* رقم الهوية */}
              <div className="flex flex-col gap-2">
                <label className="text-base text-gray-800 text-right">رقم الهوية</label>
                <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500">
                  <input
                    type="number"
                    name="OldClientId"
                    value={formData.OldClientId}
                    onChange={handleInputChange}
                    placeholder="ادخل رقم الهوية"
                    className="bg-transparent outline-none border-none w-full text-right"
                  />
                </div>
              </div>
              {/* المدينة */}
              <div className="flex flex-col gap-2">
                <label className="text-base text-gray-800 text-right">المدينة</label>
                <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500">
                  <input
                    type="text"
                    name="OldClientCity"
                    value={formData.OldClientCity}
                    onChange={handleInputChange}
                    placeholder="ادخل المدينة"
                    className="bg-transparent outline-none border-none w-full text-right"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* معلومات العميل الجديد */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-normal text-black text-right m-0">معلومات العميل الجديد</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* اسم العميل الجديد */}
              <div className="flex flex-col gap-2 relative new-client-search-container">
                <label className="text-base text-gray-800 text-right">اسم العميل الجديد</label>
                <input
                  type="text"
                  value={newClientSearchTerm}
                  onChange={handleNewClientSearchChange}
                  onBlur={handleNewClientInputBlur}
                  onFocus={() => newClientSearchTerm.length >= 1 && setShowNewClientDropdown(true)}
                  placeholder="ابحث عن العميل الجديد بالاسم أو رقم الهاتف"
                  className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500 h-full text-right w-full"
                />
                {isSearchingNewClients && (
                  <div className="absolute right-3 top-9">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                  </div>
                )}
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
              {/* رقم الهاتف */}
              <div className="flex flex-col gap-2">
                <label className="text-base text-gray-800 text-right">رقم الهاتف</label>
                <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500">
                  <input
                    type="text"
                    name="NewClientPhone"
                    value={formData.NewClientPhone}
                    onChange={handleInputChange}
                    placeholder="ادخل رقم الهاتف"
                    className="bg-transparent outline-none border-none w-full text-right"
                  />
                </div>
              </div>
              {/* رقم الهوية */}
              <div className="flex flex-col gap-2">
                <label className="text-base text-gray-800 text-right">رقم الهوية</label>
                <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500">
                  <input
                    type="number"
                    name="NewClientId"
                    value={formData.NewClientId}
                    onChange={handleInputChange}
                    placeholder="ادخل رقم الهوية"
                    className="bg-transparent outline-none border-none w-full text-right"
                  />
                </div>
              </div>
              {/* المدينة */}
              <div className="flex flex-col gap-2">
                <label className="text-base text-gray-800 text-right">المدينة</label>
                <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500">
                  <input
                    type="text"
                    name="NewClientCity"
                    value={formData.NewClientCity}
                    onChange={handleInputChange}
                    placeholder="ادخل المدينة"
                    className="bg-transparent outline-none border-none w-full text-right"
                  />
                </div>
              </div>
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
              onClick={fetchTransaction}
              className="border border-teal-900 text-gray-800 text-sm px-6 py-2 rounded-md"
            >
              تعديل
            </button>
          </div>
        </section>
        {/* إنشاء العقد */}
        <section className="bg-gray-100 border border-gray-200 rounded-md p-8 flex flex-col gap-10">
          <h2 className="text-2xl font-normal text-black text-center m-0">إنشاء العقد</h2>
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-normal text-black text-right m-0">تفاصيل المعاملة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* تاريخ اليوم */}
              <div className="flex flex-col gap-2">
                <label className="text-base text-gray-800 text-right">تاريخ اليوم</label>
                <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500 flex justify-between items-center">
                  <input
                    type="date"
                    name="ContractDate"
                    value={formData.ContractDate}
                    onChange={handleInputChange}
                    placeholder="ادخل تاريخ اليوم"
                    className="bg-transparent outline-none border-none w-full text-right"
                  />
                  {/* <CalendarIcon className="w-5 h-5 text-gray-400" /> */}
                </div>
              </div>
              {/* مدة العمل */}
              <div className="flex flex-col gap-2">
                <label className="text-base text-gray-800 text-right">مدة العمل</label>
                <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500">
                  <input
                    type="text"
                    name="WorkDuration"
                    value={formData.WorkDuration}
                    onChange={(e) => setFormData({ ...formData, WorkDuration: e.target.value })}
                    placeholder="ادخل مدة العمل"
                    className="bg-transparent outline-none border-none w-full text-right"
                  />
                </div>
              </div>
              {/* تكلفة المعاملة */}
              <div className="flex flex-col gap-2">
                <label className="text-base text-gray-800 text-right">تكلفة المعاملة</label>
                <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500">
                  <input
                    type="number"
                    name="Cost"
                    value={formData.Cost}
                    onChange={handleInputChange}
                    placeholder="ادخل تكلفة المعاملة"
                    className="bg-transparent outline-none border-none w-full text-right"
                  />
                </div>
              </div>
              {/* المدفوع */}
              <div className="flex flex-col gap-2">
                <label className="text-base text-gray-800 text-right">المدفوع</label>
                <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500">
                  <input
                    type="number"
                    name="Paid"
                    value={formData.Paid}
                    onChange={handleInputChange}
                    placeholder="ادخل المدفوع"
                    className="bg-transparent outline-none border-none w-full text-right"
                  />
                </div>
              </div>
              {/* المتبقي */}
              <div className="flex flex-col gap-2">
                <label className="text-base text-gray-800 text-right">المتبقي</label>
                <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500">
                  <input
                    type="number"
                    name="Remaining"
                    value={formData.Remaining}
                    placeholder="المتبقي"
                    className="bg-transparent outline-none border-none w-full text-right"
                    disabled
                  />
                </div>
              </div>
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
            {/* مدة التجربة */}
            <div className="flex flex-col gap-2">
              <label className="text-base text-gray-800 text-right">مدة التجربة</label>
              <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500">
                <input
                  type="text"
                    name="ExperimentDuration"
                  value={formData.ExperimentDuration}
                  onChange={handleInputChange}
                  placeholder="ادخل مدة التجربة"
                  className="bg-transparent outline-none border-none w-full text-right"
                />
              </div>
            </div>
            {/* بداية التجربة */} 
            <div className="flex flex-col gap-2">
              <label className="text-base text-gray-800 text-right">بداية التجربة</label>
              <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500 flex justify-between items-center">
                <input
                  type="date"
                  name="ExperimentStart"
                  value={formData.ExperimentStart}
                  onChange={handleInputChange}
                  placeholder="ادخل بداية التجربة"
                  className="bg-transparent outline-none border-none w-full text-right"
                />
                {/* <CalendarIcon className="w-5 h-5 text-gray-400" /> */}
              </div>
            </div>
            {/* نهاية التجربة */}
            <div className="flex flex-col gap-2">
              <label className="text-base text-gray-800 text-right">نهاية التجربة</label>
              <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500 flex justify-between items-center">
                <input
                  type="date"
                  name="ExperimentEnd"
                  value={formData.ExperimentEnd}
                  onChange={handleInputChange}
                  placeholder="ادخل نهاية التجربة"
                  className="bg-transparent outline-none border-none w-full text-right"
                />
                {/* <CalendarIcon className="w-5 h-5 text-gray-400" /> */}
              </div>
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
              onClick={fetchTransaction}
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
            {/* نتيجة التجربة */}
            <div className="flex flex-col gap-2">
              <label className="text-base text-gray-800 text-right">نتيجة التجربة</label>
              <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500 text-right">
                <select
                  name="ExperimentRate"
                  value={formData.ExperimentRate}
                  onChange={handleInputChange}
                  className="bg-transparent outline-none border-none w-full text-right"
                >
                  <option value="">اختر نتيجة التجربة</option>
                  <option value="جيد">جيد</option>
                  <option value="متوسط">متوسط</option>
                  <option value="ضعيف">ضعيف</option>
                </select>
              </div>
            </div>
            {/* ملاحظات */}
            <div className="flex flex-col gap-2">
              <label className="text-base text-gray-800 text-right">ملاحظات</label>
              <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500">
                <input
                  type="text"
                  name="Notes"
                  value={formData.Notes}
                  onChange={handleInputChange}
                  placeholder="ادخل ملاحظات"
                  className="bg-transparent outline-none border-none w-full text-right"
                />
              </div>
            </div>
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
            {/* رقم الإقامة */}
            <div className="flex flex-col gap-2">
              <label className="text-base text-gray-800 text-right">رقم الإقامة</label>
              <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500">
                <input
                  type="text"
                  name="NationalID"
                  value={formData.NationalID}
                  onChange={handleInputChange}
                  placeholder="ادخل رقم الإقامة"
                  className="bg-transparent outline-none border-none w-full text-right"
                />
              </div>
            </div>
            {/* رقم عملية نقل الكفالة */}
            <div className="flex flex-col gap-2">
              <label className="text-base text-gray-800 text-right">رقم عملية نقل الكفالة</label>
              <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500">
                <input
                  type="text"
                  name="TransferOperationNumber"
                  value={formData.TransferOperationNumber}
                  onChange={handleInputChange}
                  placeholder="ادخل رقم عملية نقل الكفالة"
                  className="bg-transparent outline-none border-none w-full text-right"
                />
              </div>
            </div>
            {/* تاريخ تنفيذ النقل */}
            <div className="flex flex-col gap-2">
              <label className="text-base text-gray-800 text-right">تاريخ تنفيذ النقل</label>
              <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500 flex justify-between items-center">
                <input
                  type="date"
                  name="TransferingDate"
                  value={formData.TransferingDate}
                  onChange={handleInputChange}
                  placeholder="ادخل تاريخ تنفيذ النقل"
                  className="bg-transparent outline-none border-none w-full text-right"
                />
                <CalendarIcon className="w-5 h-5 text-gray-400" />
              </div>
            </div>
         
<div className="flex flex-col gap-2">
  <label className="text-base text-gray-800 text-right">ملف</label>
  <div className="bg-gray-50 border border-gray-300 rounded-md p-2 flex justify-between items-center">
    <div className="flex flex-col items-end">
      <span className="text-gray-500 text-sm">
        {selectedFileName || (formData.file ? formData.file.split('/').pop() : 'ارفاق ملف')}
      </span>
      {formData.file && (
        <a href={formData.file} target="_blank" rel="noopener noreferrer" className="text-teal-600 text-xs">
          عرض الملف
        </a>
      )}
    </div>
    <label
      htmlFor="file-upload"
      className="bg-teal-900 hover:bg-teal-800 text-white text-sm px-6 py-2 rounded-md cursor-pointer transition-colors"
    >
      اختيار ملف
    </label>
    <input
      id="file-upload"
      type="file"
      name="file"
      onChange={handleFileChange}
      className="hidden"
      accept=".pdf,.jpg,.jpeg,.png"
      ref={fileInputRef}
    />
  </div>
</div>
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
    </Layout>
 
  );
}