import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import axios from 'axios';
import debounce from 'lodash/debounce';

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

  useEffect(() => {
    fetchHomemaids();
    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId]);

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
        ContractDate: data.TransferingDate ? new Date(data.ContractDate).toISOString().split('T')[0] : '',
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

  const searchClients = debounce(async (query: string, type: 'old' | 'new') => {
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
  }, 300);

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
  const determineStage = (formData: typeof formData) => {
    const stages = [
      'انشاء الطلب',
      'انشاء العقد',
      'فترة التجربة',
      'تقييم التجربة',
      'نقل الخدمات',
    ];

    // Check fields for each stage to determine the furthest completed stage
    if (
      formData.NationalID &&
      formData.TransferOperationNumber &&
      formData.TransferingDate
    ) {
      return stages[4]; // نقل الخدمات
    } else if (formData.ExperimentRate && formData.Notes) {
      return stages[3]; // تقييم التجربة
    } else if (
      formData.ExperimentDuration &&
      formData.ExperimentStart &&
      formData.ExperimentEnd
    ) {
      return stages[2]; // فترة التجربة
    } else if (
      formData.ContractDate &&
      formData.WorkDuration &&
      formData.Cost &&
      formData.Paid
    ) {
      return stages[1]; // انشاء العقد
    } else if (
      formData.HomeMaidId &&
      formData.OldClientId &&
      formData.NewClientId
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
        stage: currentStage, // Set the stage dynamically
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
    <div className="max-w-7xl mx-auto p-8 bg-gray-100 min-h-screen font-['Tajawal'] text-gray-800" dir="rtl">
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
                  {type === 'select' ? (
                    <div className="bg-gray-50 border border-gray-300 rounded-md p-2 text-base text-gray-500 text-right">
                      <select
                        name={name}
                        value={formData[name as keyof typeof formData]}
                        onChange={handleInputChange}
                        className="bg-transparent outline-none border-none w-full text-right"
                      >
                        <option value="">اختر {label}</option>
                        {homemaidOptions?.map((homemaid) => (
                          <option key={homemaid.id} value={homemaid.id.toString()}>
                            {homemaid.Name} (ID: {homemaid.id})
                          </option>
                        ))}
                      </select>
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
                      {type === 'date' && <img src="/page/e203ec96-19a6-4894-aea2-c39c45a6f9b2/images/I1836_21630_1836_20381.svg" alt="calendar icon" className="w-5 h-5" />}
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
                  {name === 'OldClientName' && showOldClientDropdown && oldClientSuggestions.length > 0 && (
                    <div className="absolute top-full mt-2 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                      {oldClientSuggestions.map((client) => (
                        <div
                          key={client.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => selectClient(client, 'old')}
                        >
                          {client.fullname} ({client.phonenumber})
                        </div>
                      ))}
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
                  {name === 'NewClientName' && showNewClientDropdown && (
                    <div className="absolute top-full mt-2 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                      {newClientSuggestions.length > 0 ? (
                        newClientSuggestions.map((client) => (
                          <div
                            key={client.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => selectClient(client, 'new')}
                          >
                            {client.fullname} ({client.phonenumber})
                          </div>
                        ))
                      ) : formData.NewClientName ? (
                        <div
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={createNewClient}
                        >
                          إضافة عميل جديد: {formData.NewClientName}
                        </div>
                      ) : null}
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
                    {type === 'date' && <img src="/page/e203ec96-19a6-4894-aea2-c39c45a6f9b2/images/I1836_21630_1840_22989.svg" alt="calendar icon" className="w-5 h-5" />}
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
                  {type === 'date' && <img src={type === 'date' && name === 'ExperimentStart' ? '/page/e203ec96-19a6-4894-aea2-c39c45a6f9b2/images/I1836_21630_1836_20575.svg' : '/page/e203ec96-19a6-4894-aea2-c39c45a6f9b2/images/I1836_21630_1836_20565.svg'} alt="calendar icon" className="w-5 h-5" />}
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
                    {type === 'date' && <img src="/page/e203ec96-19a6-4894-aea2-c39c45a6f9b2/images/I1836_21630_1836_21353.svg" alt="calendar icon" className="w-5 h-5" />}
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