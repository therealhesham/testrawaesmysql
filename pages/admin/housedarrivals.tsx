import Layout from 'example/containers/Layout';
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Style from 'styles/Home.module.css';
import { Plus, Search, FileText, RotateCcw, Settings, MoreVertical, MoreHorizontal, Pencil } from 'lucide-react';
import { DocumentTextIcon, PencilAltIcon } from '@heroicons/react/outline';
import { FaAddressBook, FaUserFriends } from 'react-icons/fa';

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
  Order?: {
    Name: string;
    phone: string;
    Nationalitycopy: string;
    Passportnumber: string;
  };
}

interface EditWorkerForm {
  location_id: number;
  Reason: string;
  Details: string;
  employee: string;
  Date: string;
  deliveryDate: string;
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
            className="flex gap-1 flex-row w-full text-right py-2 px-4 text-sm text-textDark hover:bg-gray-100"
          >
            <FaAddressBook/>
            تعديل
          </button>
          <button
            onClick={() => {
              onDeparture(id, name);
              setIsOpen(false);
            }}
            className=" w-full flex gap-1 flex-row text-right py-2 px-4 text-sm text-textDark hover:bg-gray-100"
          >
            <Pencil width={12} height={12}/>
            مغادرة
          </button>
          <button
            onClick={() => {
              onAddSession();
              setIsOpen(false);
            }}
            className=" w-full flex gap-1 flex-row text-right py-2 px-4 text-sm text-textDark hover:bg-gray-100"
          >
            <FaUserFriends/>
            اضافة جلسة
          </button>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const [modals, setModals] = useState({
    addResidence: false,
    editWorker: false,
    workerDeparture: false,
    newHousing: false,
    columnVisibility: false,
  });
  const [housedWorkers, setHousedWorkers] = useState<HousedWorker[]>([]);
  const [locations, setLocations] = useState<InHouseLocation[]>([]);
  const [homemaids, setHomemaids] = useState<Homemaid[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState({
    Name: '',
    Passportnumber: '',
    reason: '',
    id: '',
  });

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
    employee: '',
    details: '',
  });

  const [editWorkerForm, setEditWorkerForm] = useState<EditWorkerForm>({
    location_id: 0,
    Reason: '',
    Details: '',
    employee: '',
  });

  const [departureForm, setDepartureForm] = useState<DepartureForm>({
    deparatureHousingDate: '',
    deparatureReason: '',
    status: 'departed',
  });

  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [selectedWorkerName, setSelectedWorkerName] = useState<string>('');

  // Open/close modals
  const openModal = (modalName: string) => {
    setModals((prev) => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName: string) => {
    setModals((prev) => ({ ...prev, [modalName]: false }));
    setSelectedWorkerId(null); // Reset selected worker when closing modal
    setSelectedWorkerName('');
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
      alert('خطأ في جلب بيانات المواقع');
    }
  };

  // Fetch homemaids
  const fetchHomemaids = async () => {
    try {
      const response = await axios.get('/api/homemaids');
      setHomemaids(response.data);
    } catch (error) {
      alert('خطأ في جلب بيانات العاملات');
    }
  };

  // Fetch housed workers
  const fetchHousedWorkers = async () => {
    try {
      const response = await axios.get('/api/confirmhousinginformation', {
        params: {
          ...filters,
          page,
          sortKey,
          sortDirection,
        },
      });
      setHousedWorkers(response.data.housing);
      setTotalCount(response.data.totalCount);
    } catch (error) {
      alert('خطأ في جلب بيانات التسكين');
    }
  };

  // Update housed worker
  const updateHousedWorker = async (workerId: number, data: EditWorkerForm) => {
    try {
      
      await axios.put(`/api/confirmhousinginformation`, {...data,homeMaidId:workerId});
      alert('تم تحديث بيانات العاملة بنجاح');
      fetchHousedWorkers();
    } catch (error) {
      alert('حدث خطأ أثناء تحديث البيانات');
    }
  };

  // Record departure
  const recordDeparture = async (workerId: number, data: DepartureForm) => {
    try {
     
      await axios.put(`/api/housedworker${workerId}/departure`, data);
      alert('تم تسجيل مغادرة العاملة بنجاح');
      fetchHousedWorkers();
    } catch (error) {
      alert('حدث خطأ أثناء تسجيل المغادرة');
    }
  };

  // Handle edit worker modal opening
  const handleEditWorker = (id: number, name: string) => {
    const worker = housedWorkers.find((w) => w.id === id);
    if (worker) {
      setSelectedWorkerId(worker.Order.id);
      setSelectedWorkerName(name);
      setEditWorkerForm({
        location_id: worker.location_id,
        Reason: worker.Reason || '',
        Details: worker.Details || '',
        employee: worker.employee || '',
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
    try {
      const response = await axios.post('/api/confirmhousinginformation', {
        ...formData,
        homeMaidId: Number(formData.homeMaidId),
      });
      alert(response.data.message);
      closeModal('newHousing');
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
        employee: '',
        details: '',
      });
      fetchHousedWorkers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'خطأ في تسكين العاملة');
    }
  };

  // Handle filter input changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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

  // Calculate duration
  const calculateDuration = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchLocations();
    fetchHomemaids();
    fetchHousedWorkers();
  }, [page, sortKey, sortDirection, filters]);

  return (
    <Layout>
      <Head>
        <title>Dashboard Preview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <section className={`min-h-screen ${Style['tajawal-bold']}`}>
        <div className="mx-auto">
          <main className="p-8 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-normal text-black">التسكين</h1>
              <div className="flex gap-4">
                <button
                  onClick={() => openModal('addResidence')}
                  className="flex items-center gap-2 bg-teal-800 text-white text-sm py-2 px-4 rounded-md"
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
                  progress === 100 ? 'dangerDark' : progress > 50 ? 'warning' : 'success';
                return (
                  <div key={location.id} className="bg-cardBg border border-border rounded-md p-4 text-right">
                    <h3 className="text-sm font-normal mb-1">{location.location}</h3>
                    <p className="text-sm font-normal mb-4">{`${location.currentOccupancy || 0} \\ ${location.quantity}`}</p>
                    <div className="flex justify-between text-md mb-2">
                      <span>{status}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="bg-white border border-border rounded-sm h-3 overflow-hidden">
                      <div className={`h-full bg-${color}`} style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </section>
            <section className="border border-border rounded-lg shadow-card p-6 flex flex-col gap-5">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <nav className="flex gap-10">
                  <a
                    href="#"
                    className="text-sm text-textDark font-bold relative pb-3 after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-full after:h-0.5 after:bg-textDark"
                  >
                    عاملات تم تسكينهم <span className="text-[8px] align-super">{totalCount}</span>
                  </a>
                  <a href="#" className="text-sm text-textMuted pb-3">
                    قائمة عاملات غادرن التسكين <span className="text-[8px] align-super">0</span>
                  </a>
                </nav>
                <div>
                  <button
                    onClick={() => openModal('newHousing')}
                    className="flex items-center gap-2 bg-teal-800 text-white text-sm py-2 px-4 rounded-md"
                  >
                    <Plus className="w-5 h-5" />
                    تسكين عاملة
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="bg-cardBg border border-border rounded-md p-2 flex items-center gap-2">
                    <input
                      type="text"
                      name="Name"
                      placeholder="الاسم"
                      value={filters.Name}
                      onChange={handleFilterChange}
                      className="bg-transparent outline-none text-right w-24 text-sm border-none"
                    />
                    <Search className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="bg-cardBg border border-border rounded-md p-2 flex items-center gap-2">
                    <input
                      type="text"
                      name="Passportnumber"
                      placeholder="رقم الجواز"
                      value={filters.Passportnumber}
                      onChange={handleFilterChange}
                      className="bg-transparent outline-none text-right w-24 text-sm border-none"
                    />
                    <Search className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="bg-cardBg border border-border rounded-md p-2 flex items-center gap-2">
                    <input
                      type="text"
                      name="reason"
                      placeholder="سبب التسكين"
                      value={filters.reason}
                      onChange={handleFilterChange}
                      className="bg-transparent outline-none text-right w-24 text-sm border-none"
                    />
                    <Search className="w-5 h-5 text-gray-500" />
                  </div>
                  <button
                    onClick={() => openModal('columnVisibility')}
                    className="flex items-center gap-2 bg-gray-100 text-gray-500 text-sm py-4 px-4 rounded-md"
                  >
                    <Settings className="w-5 h-5" />
                    إعدادات الأعمدة
                  </button>
                  <button
                    onClick={() => setFilters({ Name: '', Passportnumber: '', reason: '', id: '' })}
                    className="bg-teal-800 text-white text-sm py-2 px-4 rounded-md"
                  >
                    <RotateCcw className="w-5 h-5 inline-block mr-2" />
                    اعادة ضبط
                  </button>
                </div>
                <div className="flex gap-2">
                  <a href="#" className="flex items-center gap-1 bg-teal-800 text-white text-xs py-1 px-3 rounded-sm">
                    Excel <DocumentTextIcon className="w-5 h-5" />
                  </a>
                  <a href="#" className="flex items-center gap-1 bg-teal-800 text-white text-xs py-1 px-3 rounded-sm">
                    PDF <FileText className="w-5 h-5" />
                  </a>
                </div>
              </div>
              <div className="flex flex-col">
                <div
                  className="bg-teal-800 text-white py-4 px-4 grid items-center text-right gap-2 text-sm"
                  style={{
                    gridTemplateColumns: [
                      columnVisibility.id && '1fr',
                      columnVisibility.Name && '1fr',
                      columnVisibility.phone && '1.5fr',
                      columnVisibility.Nationalitycopy && '1fr',
                      columnVisibility.Passportnumber && '1.5fr',
                      columnVisibility.location && '1.5fr',
                      columnVisibility.Reason && '1.5fr',
                      columnVisibility.houseentrydate && '1.5fr',
                      columnVisibility.deliveryDate && '1.5fr',
                      columnVisibility.duration && '1fr',
                      columnVisibility.employee && '1fr',
                      columnVisibility.actions && '1fr',
                    ]
                      .filter(Boolean)
                      .join(' '),
                  }}
                >
                  {columnVisibility.id && <span>#</span>}
                  {columnVisibility.Name && <button onClick={() => handleSort('Name')}>الاسم</button>}
                  {columnVisibility.phone && <button onClick={() => handleSort('phone')}>رقم الجوال</button>}
                  {columnVisibility.Nationalitycopy && (
                    <button onClick={() => handleSort('Nationalitycopy')}>الجنسية</button>
                  )}
                  {columnVisibility.Passportnumber && <span>رقم الجواز</span>}
                  {columnVisibility.location && <span>السكن</span>}
                  {columnVisibility.Reason && <button onClick={() => handleSort('Details')}>سبب التسكين</button>}
                  {columnVisibility.houseentrydate && <span>تاريخ التسكين</span>}
                  {columnVisibility.deliveryDate && <span>تاريخ التسليم</span>}
                  {columnVisibility.duration && <span>مدة السكن</span>}
                  {columnVisibility.employee && <span>الموظف</span>}
                  {columnVisibility.actions && <span>اجراءات</span>}
                </div>
                <div className="flex flex-col">
                  {housedWorkers.map((worker) => (
                    <div
                      key={worker.id}
                      className="bg-cardBg border-b border-border py-3 px-4 grid items-center text-right gap-2 text-sm last:border-b-0"
                      style={{
                        gridTemplateColumns: [
                          columnVisibility.id && '1fr',
                          columnVisibility.Name && '1fr',
                          columnVisibility.phone && '1.5fr',
                          columnVisibility.Nationalitycopy && '1fr',
                          columnVisibility.Passportnumber && '1.5fr',
                          columnVisibility.location && '1.5fr',
                          columnVisibility.Reason && '1.5fr',
                          columnVisibility.houseentrydate && '1.5fr',
                          columnVisibility.deliveryDate && '1.5fr',
                          columnVisibility.duration && '1fr',
                          columnVisibility.employee && '1fr',
                          columnVisibility.actions && '1fr',
                        ]
                          .filter(Boolean)
                          .join(' '),
                      }}
                    >
                      {columnVisibility.id && <span>{worker.id}</span>}
                      {columnVisibility.Name && (
                        <span className="text-[11px] leading-tight text-center">{worker.Order?.Name || ''}</span>
                      )}
                      {columnVisibility.phone && <span>{worker.Order?.phone || ''}</span>}
                      {columnVisibility.Nationalitycopy && <span>{worker.Order?.Nationalitycopy || ''}</span>}
                      {columnVisibility.Passportnumber && <span>{worker.Order?.Passportnumber || ''}</span>}
                      {columnVisibility.location && (
                        <span>{locations.find((loc) => loc.id === worker.location_id)?.location || 'غير محدد'}</span>
                      )}
                      {columnVisibility.Reason && <span>{worker.Reason}</span>}
                      {columnVisibility.houseentrydate && (
                        <span>{new Date(worker.houseentrydate).toLocaleDateString()}</span>
                      )}
                      {columnVisibility.deliveryDate && (
                        <span>
                          {worker.deparatureHousingDate ? new Date(worker.deparatureHousingDate).toLocaleDateString() : 'غير محدد'}
                        </span>
                      )}
                      {columnVisibility.duration && (
                        <span
                          className={calculateDuration(worker.houseentrydate) > 10 ? 'text-danger' : 'text-black'}
                        >
                          {calculateDuration(worker.houseentrydate)}
                        </span>
                      )}
                      {columnVisibility.employee && <span>{worker.employee}</span>}
                      {columnVisibility.actions && (
                        <div className="flex justify-center">
                          <ActionDropdown
                            id={worker.id}
                            name={worker.Order?.Name || ''}
                            onEdit={handleEditWorker}
                            onDeparture={handleWorkerDeparture}
                            onAddSession={() => openModal('newHousing')}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <footer className="flex justify-between items-center pt-4">
                <span className="text-base">
                  عرض {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} من {totalCount} نتيجة
                </span>
                <nav className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="border border-border bg-cardBg text-textDark py-1 px-2 rounded-sm text-sm disabled:opacity-50"
                  >
                    السابق
                  </button>
                  {Array.from({ length: Math.ceil(totalCount / pageSize) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`border ${
                        p === page ? 'border-primary bg-teal-800 text-white' : 'text-textDark'
                      } py-1 px-2 rounded-sm text-sm`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === Math.ceil(totalCount / pageSize)}
                    className="border border-border bg-cardBg text-textDark py-1 px-2 rounded-sm text-sm disabled:opacity-50"
                  >
                    التالي
                  </button>
                </nav>
              </footer>
            </section>
            {/* Add Residence Modal */}
            {modals.addResidence && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                onClick={() => closeModal('addResidence')}
              >
                <div
                  className="bg-gray-200 rounded-lg p-6 w-full max-w-lg shadow-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-5">
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
                        alert('تم إضافة السكن بنجاح');
                        closeModal('addResidence');
                        fetchLocations();
                      } catch (error) {
                        alert('خطأ في إضافة السكن');
                      }
                    }}
                  >
                    <div className="mb-4">
                      <label htmlFor="residence-name" className="block text-sm mb-2 text-textDark">
                        اسم السكن
                      </label>
                      <input
                        type="text"
                        id="residence-name"
                        placeholder="ادخل اسم السكن"
                        className="w-full p-2 border border-border rounded-md text-right text-sm text-textDark"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="residence-capacity" className="block text-sm mb-2 text-textDark">
                        السعة
                      </label>
                      <input
                        type="number"
                        id="residence-capacity"
                        placeholder="ادخل السعة"
                        className="w-full p-2 border border-border rounded-md text-right text-sm text-textDark"
                      />
                    </div>
                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => closeModal('addResidence')}
                        className="bg-textMuted text-white py-2 px-4 rounded-md text-sm"
                      >
                        الغاء
                      </button>
                      <button type="submit" className="bg-teal-800 text-white py-2 px-4 rounded-md text-sm">
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
                      <label className="block text-sm mb-2 text-textDark">اختر الأعمدة المرئية</label>
                      {Object.keys(columnVisibility).map((column) => (
                        <div key={column} className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            id={column}
                            checked={columnVisibility[column as keyof typeof columnVisibility]}
                            onChange={() => toggleColumnVisibility(column as keyof typeof columnVisibility)}
                            className="w-4 h-4"
                          />
                          <label htmlFor={column} className="text-sm text-textDark">
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
                        className="bg-textMuted text-white py-2 px-4 rounded-md text-sm"
                      >
                        الغاء
                      </button>
                      <button
                        type="button"
                        onClick={() => closeModal('columnVisibility')}
                        className="bg-teal-800 text-white py-2 px-4 rounded-md text-sm"
                      >
                        حفظ
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* Add Session Modal */}
            {modals.newHousing && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                onClick={() => closeModal('newHousing')}
              >
                <div
                  className="bg-gray-100 rounded-lg p-6 w-full max-w-lg shadow-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-textDark">تسكين عاملة</h2>
                    <button onClick={() => closeModal('newHousing')} className="text-textMuted text-2xl">
                      &times;
                    </button>
                  </div>
                  <form onSubmit={handlenewHousingSubmit} className="grid grid-cols-2 gap-2">
                    <div className="mb-4">
                      <label htmlFor="session-worker" className="block text-sm mb-2 text-textDark">
                        اسم العاملة
                      </label>
                      <select
                        id="session-worker"
                        value={formData.homeMaidId}
                        onChange={(e) => setFormData({ ...formData, homeMaidId: e.target.value })}
                        className="w-full p-2 border border-border rounded-md text-right text-sm text-textDark"
                      >
                        <option value="">اختر العاملة</option>
                        {homemaids.map((maid) => (
                          <option key={maid.id} value={maid.id}>
                            {maid.Name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="session-residence" className="block text-sm mb-2 text-textDark">
                        السكن
                      </label>
                      <select
                        id="session-residence"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full p-2 border border-border rounded-md text-right text-sm text-textDark"
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
                      <label htmlFor="session-start-date" className="block text-sm mb-2 text-textDark">
                        تاريخ التسكين
                      </label>
                      <input
                        type="date"
                        id="session-start-date"
                        value={formData.houseentrydate}
                        onChange={(e) => setFormData({ ...formData, houseentrydate: e.target.value })}
                        className="w-full p-2 border border-border rounded-md text-right text-sm text-textDark"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="session-reason" className="block text-sm mb-2 text-textDark">
                        سبب التسكين
                      </label>
                      <input
                        type="text"
                        id="session-reason"
                        placeholder="ادخل سبب التسكين"
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        className="w-full p-2 border border-border rounded-md text-right text-sm text-textDark"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="session-employee" className="block text-sm mb-2 text-textDark">
                        الموظف
                      </label>
                      <input
                        type="text"
                        id="session-employee"
                        placeholder="ادخل اسم الموظف"
                        value={formData.employee}
                        onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                        className="w-full p-2 border border-border rounded-md text-right text-sm text-textDark"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="session-details" className="block text-sm mb-2 text-textDark">
                        التفاصيل
                      </label>
                      <textarea
                        id="session-details"
                        placeholder="ادخل التفاصيل"
                        value={formData.details}
                        onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                        className="w-full p-2 border border-border rounded-md text-right text-sm text-textDark"
                        rows={4}
                      ></textarea>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="session-departure-city" className="block text-sm mb-2 text-textDark">
                        مدينة المغادرة
                      </label>
                      <input
                        type="text"
                        id="session-departure-city"
                        placeholder="ادخل مدينة المغادرة"
                        value={formData.deparatureCity}
                        onChange={(e) => setFormData({ ...formData, deparatureCity: e.target.value })}
                        className="w-full p-2 border border-border rounded-md text-right text-sm text-textDark"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="session-arrival-city" className="block text-sm mb-2 text-textDark">
                        مدينة الوصول
                      </label>
                      <input
                        type="text"
                        id="session-arrival-city"
                        placeholder="ادخل مدينة الوصول"
                        value={formData.arrivalCity}
                        onChange={(e) => setFormData({ ...formData, arrivalCity: e.target.value })}
                        className="w-full p-2 border border-border rounded-md text-right text-sm text-textDark"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="session-departure-date" className="block text-sm mb-2 text-textDark">
                        تاريخ المغادرة
                      </label>
                      <input
                        type="date"
                        id="session-departure-date"
                        value={formData.deparatureDate}
                        onChange={(e) => setFormData({ ...formData, deparatureDate: e.target.value })}
                        className="w-full p-2 border border-border rounded-md text-right text-sm text-textDark"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="session-departure-time" className="block text-sm mb-2 text-textDark">
                        وقت المغادرة
                      </label>
                      <input
                        type="time"
                        id="session-departure-time"
                        value={formData.DeparatureTime}
                        onChange={(e) => setFormData({ ...formData, DeparatureTime: e.target.value })}
                        className="w-full p-2 border border-border rounded-md text-right text-sm text-textDark"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="session-delivery-date" className="block text-sm mb-2 text-textDark">
                        تاريخ التسليم
                      </label>
                      <input
                        type="date"
                        id="session-delivery-date"
                        value={formData.deliveryDate}
                        onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                        className="w-full p-2 border border-border rounded-md text-right text-sm text-textDark"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="session-profile-status" className="block text-sm mb-2 text-textDark">
                        حالة الملف
                      </label>
                      <select
                        id="session-profile-status"
                        value={formData.profileStatus}
                        onChange={(e) => setFormData({ ...formData, profileStatus: e.target.value })}
                        className="w-full p-2 border border-border rounded-md text-right text-sm text-textDark"
                      >
                        <option value="">اختر الحالة</option>
                        <option value="بدأت العمل">بدأت العمل</option>
                        <option value="قيد الانتظار">قيد الانتظار</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => closeModal('newHousing')}
                        className="bg-textMuted text-white py-2 px-4 rounded-md text-sm"
                      >
                        الغاء
                      </button>
                      <button type="submit" className="bg-teal-800 text-white py-2 px-4 rounded-md text-sm">
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
                    <button onClick={() => closeModal('editWorker')} className=" text-2xl">
                      &times;
                    </button>
                  </div>
                  <form className='grid grid-cols-2 gap-4'
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (selectedWorkerId) {
                        await updateHousedWorker(selectedWorkerId, editWorkerForm);
                        closeModal('editWorker');
                      }
                    }}
                  >
                    <div className="mb-4">
                      <label className="block text-sm mb-2 text-textDark">اسم العاملة</label>
                      <input
                        type="text"
                        value={selectedWorkerName}
                        disabled
                        className="w-full p-2 rounded-md text-right text-sm text-textDark bg-gray-200"
                      />
                   
                    </div>




<div className="mb-4">

                        <label className="block text-sm mb-2 text-textDark">رقم العاملة</label>
                      <input
                        type="number"
                        value={selectedWorkerId}
                        disabled
                        className="w-full p-2 border border-border rounded-md text-right text-sm text-textDark bg-gray-200"
                      />
                    </div>




                                        <div className="mb-4">
                      <label className="block text-sm mb-2 text-textDark">السكن</label>
                      <select
                        value={editWorkerForm.location_id}
                        onChange={(e) =>
                          setEditWorkerForm({
                            ...editWorkerForm,
                            location_id: Number(e.target.value),
                          })
                        }
                        className="w-full p-2 bg-gray-200 rounded-md text-right text-sm text-textDark"
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
                      <label className="block text-sm mb-2 text-textDark">تاريخ التسكين</label>
                      <input
                        type="date"
                        value={editWorkerForm.Date}
                        onChange={(e) =>
                          setEditWorkerForm({
                            ...editWorkerForm,
                            Date: e.target.value,
                          })
                        }
                        className="w-full p-2 bg-gray-200 rounded-md text-right text-sm text-textDark"
                      />
                    </div>
                    

 <div className="mb-4">
                      <label className="block text-sm mb-2 text-textDark">تاريخ التسكين</label>
                      <input
                        type="text"
                        value={editWorkerForm.deliveryDate}
                        onChange={(e) =>
                          setEditWorkerForm({
                            ...editWorkerForm,
                            deliveryDate: e.target.value,
                          })
                        }
                        className="w-full p-2 bg-gray-200 rounded-md text-right text-sm text-textDark"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm mb-2 text-textDark">سبب التسكين</label>
                      <input
                        type="text"
                        value={editWorkerForm.Reason}
                        onChange={(e) =>
                          setEditWorkerForm({
                            ...editWorkerForm,
                            Reason: e.target.value,
                          })
                        }
                        className="w-full p-2 bg-gray-200 rounded-md text-right text-sm text-textDark"
                      />
                    </div>
                    <div className="mb-4 col-span-2">
                      <label className="block text-sm mb-2  text-textDark">التفاصيل</label>
                      <textarea
                        value={editWorkerForm.Details}
                        onChange={(e) =>
                          setEditWorkerForm({
                            ...editWorkerForm,
                            Details: e.target.value,
                          })
                        }
                        className="w-full p-2 bg-gray-200 rounded-md text-right text-sm text-textDark"
                        rows={4}
                      />
                    </div>
                    {/* <div className="mb-4">
                      <label className="block text-sm mb-2 text-textDark">الموظف المسؤول</label>
                      <input
                        type="text"
                        value={editWorkerForm.employee}
                        onChange={(e) =>
                          setEditWorkerForm({
                            ...editWorkerForm,
                            employee: e.target.value,
                          })
                        }
                        className="w-full p-2 bg-gray-200 rounded-md text-right text-sm text-textDark"
                      />
                    </div> */}
                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => closeModal('editWorker')}
                        className="bg-textMuted text-white py-2 px-4 rounded-md text-sm"
                      >
                        الغاء
                      </button>
                      <button type="submit" className="bg-teal-800 text-white py-2 px-4 rounded-md text-sm">
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
                className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 "
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
                  <form className='grid grid-cols-2 gap-5'
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (selectedWorkerId) {
                        await recordDeparture(selectedWorkerId, departureForm);
                        closeModal('workerDeparture');
                      }
                    }}
                  >
                    <div className="mb-4">
                      <label className="block text-sm mb-2 text-textDark">اسم العاملة</label>
                      <input
                        type="text"
                        value={selectedWorkerName}
                        disabled
                        className="w-full p-2 border border-border rounded-md text-right text-sm text-textDark bg-gray-100"
                      />
                    </div>


                                        <div className="mb-4">
                      <label className="block text-sm mb-2 text-textDark">رقم العاملة</label>
                      <input
                        type="number"
                        value={selectedWorkerId}
                        disabled
                        className="w-full p-2 border border-border rounded-md text-right text-sm text-textDark bg-gray-100"
                      />
                    </div>

                    
                                        <div className="mb-4">
                      <label className="block text-sm mb-2 text-textDark">سبب المغادرة</label>
                      <input
                        type="text"
                            onChange={(e) =>
                          setDepartureForm({
                            ...departureForm,
                            deparatureReason: e.target.value,
                          })
                        }
                        value={departureForm.deparatureReason}
                        className="w-full p-2 border border-border rounded-md text-right text-sm text-textDark bg-gray-100"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm mb-2 text-textDark">تاريخ المغادرة</label>
                      <input
                        type="date"
                        value={departureForm.deparatureHousingDate}
                        onChange={(e) =>
                          setDepartureForm({
                            ...departureForm,
                            deparatureHousingDate: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-border rounded-md text-right text-sm text-textDark"
                      />
                    </div>
  
                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => closeModal('workerDeparture')}
                        className="bg-textMuted text-white py-2 px-4 rounded-md text-sm"
                      >
                        الغاء
                      </button>
                      <button type="submit" className="bg-teal-800 text-white py-2 px-4 rounded-md text-sm">
                        تأكيد المغادرة
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>
      </section>
    </Layout>
  );
}