import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import axios from 'axios';
import Style from "styles/Home.module.css";
import Layout from 'example/containers/Layout';
import { ArrowDown, Plus, Search, X, ChevronUp, ChevronDown, User } from 'lucide-react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import Select from 'react-select';
import { MoreHorizontal } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';
import { getSuccessMessage, getErrorMessage } from 'utils/translations';

// Type definitions
interface MenuPosition {
  x: number;
  y: number;
  row: number;
}

interface InitialData {
  newOrders: any[];
  clients: any[];
  homemaids: any[];
  offices: any[];
  exportData: any[];
}

interface DashboardProps {
  hasPermission: boolean;
  initialData: InitialData;
}

export default function Dashboard({ hasPermission, initialData }: DashboardProps) {

  const [userName, setUserName] = useState('');
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const decoded = jwtDecode<{ username?: string }>(token);
    setUserName(decoded.username || '');
  }, []);
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [allOrders] = useState(initialData?.newOrders || []);
  const [clients] = useState(initialData?.clients || []);
  const [homemaids] = useState(initialData?.homemaids || []);
  const [offices] = useState(initialData?.offices || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [formData, setFormData] = useState({
    searchTerm: '',
  });
  const [ageFilter, setAgeFilter] = useState("");
  const [nationalityFilter, setNationalityFilter] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(!hasPermission);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [detailsRow, setDetailsRow] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [exportedData] = useState(initialData?.exportData || []);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sortedOrders, setSortedOrders] = useState(initialData?.newOrders || []);

  const router = useRouter();

  
const [hidden, setHidden] = useState(true);
const [selectedClient, setSelectedClient] = useState<any>(null);
const [clientSuggestions, setClientSuggestions] = useState<any[]>([]);
const [showClientSuggestions, setShowClientSuggestions] = useState(false);
const [clientSearchTerm, setClientSearchTerm] = useState('');

// Auto search functions for clients
const searchClients = (searchTerm: string) => {
  if (!searchTerm.trim()) {
    setClientSuggestions([]);
    setShowClientSuggestions(false);
    return;
  }
  
  // Search in the existing clients data
  const filteredClients = clients.filter((client: any) => 
    client.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phonenumber?.includes(searchTerm)
  );
  
  setClientSuggestions(filteredClients.slice(0, 10)); // Limit to 10 results
  setShowClientSuggestions(true);
};

// Handle client search input change
const handleClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setClientSearchTerm(value);
  
  if (value.trim()) {
    searchClients(value);
  } else {
    setClientSuggestions([]);
    setShowClientSuggestions(false);
  }
};

// Handle client suggestion click
const handleClientSuggestionClick = (client: any) => {
  setSelectedClient(client);
  setClientSearchTerm(client.fullname);
  setShowClientSuggestions(false);
};

// Handle input blur for suggestions
const handleClientInputBlur = () => {
  setTimeout(() => {
    setShowClientSuggestions(false);
  }, 200);
};

// City translation map
const cityTranslationMap: { [key: string]: string } = {
  'Baha': 'الباحة',
  'Jawf': 'الجوف',
  'Qassim': 'القصيم',
  'Hail': 'حائل',
  'Jazan': 'جازان',
  'Najran': 'نجران',
  'Madinah': 'المدينة المنورة',
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
  // Also include the arabic region map from clientdetails.tsx for backward compatibility
  'Ar Riyāḍ': 'الرياض',
  'Makkah al Mukarramah': 'مكة المكرمة',
  'Al Madīnah al Munawwarah': 'المدينة المنورة',
  'Ash Sharqīyah': 'المنطقة الشرقية',
  'Asīr': 'عسير',
  'Tabūk': 'تبوك',
  'Al Ḩudūd ash Shamālīyah': 'الحدود الشمالية',
  'Najrān': 'نجران',
  'Al Bāḩah': 'الباحة',
  'Al Jawf': 'الجوف',
  'Al Qaşīm': 'القصيم',
  'Ḩa\'il': 'حائل',
};

// Function to translate city name
const translateCity = (city: string | null | undefined): string => {
  if (!city) return 'غير متوفر';
  return cityTranslationMap[city] || city;
};

// Close search results when clicking outside
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.client-search-container')) {
      setShowClientSuggestions(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);

function PrePopupmodal({ hidden, setHidden, setActivePopup }: { hidden: boolean; setHidden: (value: boolean) => void; setActivePopup: (value: string) => void }) {
  return (
    <div
      className={`  p-6 rounded-2xl shadow-lg fixed inset-0 flex items-center justify-center z-[3500] ${
        hidden ? 'hidden' : 'flex'
      }`}
    >
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md text-center relative p-6">
        <button
          className="absolute top-2 left-2 text-gray-600 hover:text-gray-800"
          onClick={() => {
            setHidden(true);
            setSelectedClient(null);
            setClientSearchTerm('');
            setClientSuggestions([]);
            setShowClientSuggestions(false);
          }}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col gap-3 w-full">
          <p className="text-base font-medium">تحقق من العميل</p>
          <p className="text-sm text-gray-600">هل العميل موجود مسبقاً؟</p>

          <div className="relative client-search-container">
            <input
              type="text"
autoFocus
              value={clientSearchTerm}
              onChange={handleClientSearchChange}
              onBlur={handleClientInputBlur}
              // onFocus={() => clientSearchTerm.length >= 1 && setShowClientSuggestions(true)}
              placeholder="ابحث عن العميل بالاسم أو رقم الهاتف"
              className="w-full p-3 border border-gray-300 rounded-md text-right bg-gray-50"
            />
            
            {/* Client Search Results Dropdown */}
            {showClientSuggestions && clientSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {clientSuggestions.map((client, index) => (
                  <div
                    key={index}
                    onClick={() => handleClientSuggestionClick(client)}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                  >
                    <div className="font-medium text-md">{client.fullname}</div>
                    <div className="text-sm text-gray-500">{client.phonenumber} - {translateCity(client.city)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-row gap-2">
            <button onClick={()=>router.push("/admin/clients")} className="bg-teal-900 text-white px-4 py-2 rounded w-full hover:bg-teal-800 transition duration-200">
              عميل جديد
            </button>
            <button
              className="bg-teal-900 text-white px-4 py-2 rounded w-full hover:bg-teal-800 transition duration-200"
              onClick={() => {
                setHidden(true);
                setActivePopup("popup-product-check");
              }}
              disabled={!selectedClient}
            >
              متابعة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

  // Sorting function
  const handleSort = (field: string) => {
    let newDirection: 'asc' | 'desc' = 'asc';
    if (sortField === field && sortDirection === 'asc') {
      newDirection = 'desc';
    }
    
    setSortField(field);
    setSortDirection(newDirection);
    
    const sorted = [...allOrders].sort((a, b) => {
      let aValue, bValue;
      
      switch (field) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'clientName':
          aValue = a.client?.fullname || '';
          bValue = b.client?.fullname || '';
          break;
        case 'clientPhone':
          aValue = a.client?.phonenumber || '';
          bValue = b.client?.phonenumber || '';
          break;
        case 'clientId':
          aValue = a.client?.nationalId || '';
          bValue = b.client?.nationalId || '';
          break;
        case 'maidId':
          aValue = a.HomeMaid?.id || '';
          bValue = b.HomeMaid?.id || '';
          break;
        case 'maidName':
          aValue = a.HomeMaid?.Name || '';
          bValue = b.HomeMaid?.Name || '';
          break;
        case 'nationality':
          aValue = a.HomeMaid?.office?.Country || '';
          bValue = b.HomeMaid?.office?.Country || '';
          break;
        case 'passport':
          aValue = a.Passportnumber || '';
          bValue = b.Passportnumber || '';
          break;
        case 'age':
          aValue = a.HomeMaid?.age || calculateAge(a.HomeMaid?.dateofbirth) || 0;
          bValue = b.HomeMaid?.age || calculateAge(b.HomeMaid?.dateofbirth) || 0;
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return newDirection === 'asc' 
          ? aValue.localeCompare(bValue, 'ar')
          : bValue.localeCompare(aValue, 'ar');
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return newDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
    
    setSortedOrders(sorted);
  };

  const handleOpenMenu = (e: React.MouseEvent, rowIndex: number) => {
    if (menuPosition && menuPosition.row === rowIndex) {
      setMenuPosition(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      x: rect.right - 160,
      y: rect.bottom + 5,
      row: rowIndex,
    });
  };

  const openPopup = (popupId: string) => {
    setActivePopup(popupId);
    setIsConfirming(false);
  };
  const closePopup = () => {
    setActivePopup(null);
    setMenuPosition(null);
    setIsConfirming(false);
    setSelectedOrderId(null);
    setSelectedClientId(null);
    setRejectionReason('');
  };

  const closeModal = () => {
    setShowSuccessModal(false);
    setShowErrorModal(false);
    setModalMessage("");
  };

  const closePermissionModal = () => {
    setShowPermissionModal(false);
    router.push('/admin/home');
  };

  const confirmAccept = async (id: string) => {
    setIsConfirming(true);
    try {
      const confirmRequest = await axios.post('/api/confirmrequest', { id });
      if (confirmRequest.status === 200) {
        setModalMessage(getSuccessMessage('orderAccepted'));
        setShowSuccessModal(true);
        closePopup();
        // Show loader for 15 seconds (revalidation duration)
        setIsRevalidating(true);
        setTimeout(() => {
          // Refresh data by reloading the page
          window.location.reload();
        }, 15000);
      }
    } catch (error) {
      setModalMessage(getErrorMessage('generalError'));
      setShowErrorModal(true);
      closePopup();
      setIsConfirming(false);
    }
  };

  const confirmReject = async (id: string, clientID: string, reason: string) => {
    if (!reason?.trim()) return;
    setIsConfirming(true);
    try {
      const rejectRequest = await axios.post('/api/rejectbookingprisma', {
        HomeMaidId: id,
        clientID: clientID,
        ReasonOfRejection: reason.trim(),
      });
      if (rejectRequest.status === 200) {
        setModalMessage(getSuccessMessage('orderRejected'));
        setShowSuccessModal(true);
        closePopup();
        // Show loader for 15 seconds (revalidation duration)
        setIsRevalidating(true);
        setTimeout(() => {
          router.push("/admin/rejectedorders");
        }, 15000);
      }
    } catch (error) {
      setModalMessage(getErrorMessage('generalError'));
      setShowErrorModal(true);
      closePopup();
      setIsConfirming(false);
    }
  };

  const handleOrderClick = (id: string) => {
    router.push(`/admin/track_order/${id}`);
  };

  const toggleDetails = (index: number) => {
    setDetailsRow(detailsRow === index ? null : index);
  };

  const calculateAge = (dateofbirth: string | Date) => {
    if (!dateofbirth) return "غير متوفر";
    const birthDate = new Date(dateofbirth);
    const currentDate = new Date();
    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = currentDate.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Client-side filtering logic
  const filterOrders = () => {
    let filtered = [...allOrders];

    // Search filter
    if (formData.searchTerm) {
      const searchTerm = formData.searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        (order.client?.fullname || '').toLowerCase().includes(searchTerm) ||
        (order.HomeMaid?.Name || '').toLowerCase().includes(searchTerm) ||
        (order.ClientName || '').toLowerCase().includes(searchTerm) ||
        (order.Name || '').toLowerCase().includes(searchTerm)
      );
    }

    // Age filter
    if (ageFilter) {
      filtered = filtered.filter(order => {
        const maid = order.HomeMaid;
        if (!maid?.dateofbirth) return false;
        
        const age = calculateAge(maid.dateofbirth);
        if (typeof age === 'number') {
          if (ageFilter.includes('-')) {
            const [minAge, maxAge] = ageFilter.split('-').map(Number);
            return age >= minAge && age <= maxAge;
          } else {
            const targetAge = parseInt(ageFilter);
            return Math.abs(age - targetAge) <= 2;
          }
        }
        return false;
      });
    }

    // Nationality filter
    if (nationalityFilter) {
      filtered = filtered.filter(order => 
        order.HomeMaid?.office?.Country === nationalityFilter
      );
    }

    return filtered;
  };

  const getPaginatedOrders = () => {
    const filtered = filterOrders();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return {
      orders: filtered.slice(startIndex, endIndex),
      totalCount: filtered.length
    };
  };

  // Get current filtered and paginated data
  const { orders: newOrders, totalCount } = getPaginatedOrders();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, searchTerm: value }));
    setCurrentPage(1);
  };

  const handleAgeFilterChange = (selectedOption: any) => {
    setAgeFilter(selectedOption ? selectedOption.value : "");
    setCurrentPage(1);
  };

  const handleNationalityFilterChange = (selectedOption: any) => {
    setNationalityFilter(selectedOption ? selectedOption.value : "");
    setCurrentPage(1);
  };

// Export to PDF
// const exportToPDF = async () => {
//   console.log('exporting PDF');
//   let dataToExport = exportedData;
//   if (searchTerm || actionFilter) {
//     dataToExport = await fetchFilteredLogs();
//   }
//   const doc = new jsPDF({ orientation: 'landscape' });
//   const pageWidth = doc.internal.pageSize.width;
//   const pageHeight = doc.internal.pageSize.height;

//   // 🔷 تحميل شعار مرة واحدة (لكن نستخدمه في كل صفحة)
//   const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
//   const logoBuffer = await logo.arrayBuffer();
//   const logoBytes = new Uint8Array(logoBuffer);
//   const logoBase64 = Buffer.from(logoBytes).toString('base64');

//   // 🔷 تحميل خط أميري
//   try {
//     const response = await fetch('/fonts/Amiri-Regular.ttf');
//     if (!response.ok) throw new Error('Failed to fetch font');
//     const fontBuffer = await response.arrayBuffer();
//     const fontBytes = new Uint8Array(fontBuffer);
//     const fontBase64 = Buffer.from(fontBytes).toString('base64');

//     doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
//     doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
//     doc.setFont('Amiri', 'normal');
//   } catch (error) {
//     console.error('Error loading Amiri font:', error);
//     return;
//   }

//   doc.setLanguage('ar');
//   doc.setFontSize(12);
//   doc.text('سجل النظام', pageWidth / 2, 20, { align: 'right' });

//   const headers = [['اسم المستخدم', 'تاريخ التحديث', 'تاريخ الإنشاء', 'الإجراء', 'رقم السجل']];
//   const body = dataToExport?.map((row: any) => [
//     row.user?.username || 'غير متوفر',
//     row.updatedAt ? new Date(row.updatedAt).toISOString().split('T')[0] : 'غير متوفر',
//     row.createdAt ? new Date(row.createdAt).toISOString().split('T')[0] : 'غير متوفر',
//     row.action || 'غير متوفر',
//     row.id || 'غير متوفر',
//   ]);

//   doc.autoTable({
//     head: headers,
//     body: body,
//     styles: {
//       font: 'Amiri',
//       halign: 'right',
//       fontSize: 10,
//       cellPadding: 2,
//       textColor: [0, 0, 0],
//     },
//     headStyles: {
//       fillColor: [0, 105, 92],
//       textColor: [255, 255, 255],
//       halign: 'center',
//     },
//     margin: { top: 42, right: 10, left: 10 },

//     // ✅ هنا بنضيف اللوجو والبيانات في كل صفحة
//     didDrawPage: (data) => {
//       const pageHeight = doc.internal.pageSize.height;
//       const pageWidth = doc.internal.pageSize.width;

//       // 🔷 إضافة اللوجو أعلى الصفحة (في كل صفحة)
//       doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

//       // 🔹 كتابة العنوان في أول صفحة فقط (اختياري)
//       if (doc.getCurrentPageInfo().pageNumber === 1) {
//         doc.setFontSize(12);
//         doc.setFont('Amiri', 'normal');
//         doc.text('سجل النظام', pageWidth / 2, 20, { align: 'right' });
//       }

//       // 🔸 الفوتر
//       doc.setFontSize(10);
//       doc.setFont('Amiri', 'normal');

//       doc.text(userName, 10, pageHeight - 10, { align: 'left' });

//       const pageNumber = `صفحة ${doc.getCurrentPageInfo().pageNumber}`;
//       doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });

//       const dateText =
//         "التاريخ: " +
//         new Date().toLocaleDateString('ar-EG', {
//           day: 'numeric',
//           month: 'short',
//           year: 'numeric',
//         }) +
//         "  الساعة: " +
//         new Date().toLocaleTimeString('ar-EG', {
//           hour: '2-digit',
//           minute: '2-digit',
//         });
//       doc.text(dateText, pageWidth - 10, pageHeight - 10, { align: 'right' });
//     },

//     didParseCell: (data) => {
//       data.cell.styles.halign = 'right';
//     },
//   });

//   doc.save('system_logs.pdf');
// };
  


const fetchFilteredDataExporting = async () => {
  const query = new URLSearchParams({
    perPage: "1000",
    ...(formData.searchTerm && { search: formData.searchTerm }),
    ...(ageFilter && { age: ageFilter }),
    ...(nationalityFilter && { nationality: nationalityFilter }),
  }).toString();
  const res = await fetch(`/api/neworders?${query}`);
  
  if (!res.ok) throw new Error("Failed to fetch data");
  const data = await res.json();
  return data.data;
};

  const exportToPDF = async () => {
  
  
    let dataToExport = exportedData;
    
  const doc = new jsPDF({orientation: 'landscape'});
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  if (formData.searchTerm || ageFilter || nationalityFilter) {
    dataToExport = await fetchFilteredDataExporting();
  }

  // 🔷 تحميل شعار مرة واحدة (لكن نستخدمه في كل صفحة)
  const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
  const logoBuffer = await logo.arrayBuffer();
  const logoBytes = new Uint8Array(logoBuffer);
  const logoBase64 = Buffer.from(logoBytes).toString('base64');
  
    try {
      const response = await fetch('/fonts/Amiri-Regular.ttf');
      if (!response.ok) throw new Error('Failed to fetch font');
      const fontBuffer = await response.arrayBuffer();
      const fontBytes = new Uint8Array(fontBuffer);
      const fontBase64 = Buffer.from(fontBytes).toString('base64');
      doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
      doc.setFont('Amiri', 'normal');
    } catch (error) {
      console.error('Error loading Amiri font:', error);
      setModalMessage('خطأ في تحميل الخط العربي');
      setShowErrorModal(true);
      return;
    }
    doc.setLanguage('ar');
    doc.setFontSize(12);
    const tableColumn = [
      'العمر',
      'جواز السفر',
      'الجنسية',
      'اسم العاملة',
      'رقم العاملة',
      'هوية العميل',
      'رقم العميل',
      'اسم العميل',
      'رقم الطلب',
    ];
    const tableRows = exportedData.map((row: any) => [
      row.HomeMaid?.age || calculateAge(row.HomeMaid?.dateofbirth),
      row.Passportnumber || 'غير متوفر',
      row.HomeMaid?.office?.Country || 'غير متوفر',
      row.HomeMaid?.Name || 'غير متوفر',
      row.HomeMaid?.id || 'غير متوفر',
      row.client?.nationalId || 'غير متوفر',
      row.client?.phonenumber || 'غير متوفر',
      row.client?.fullname || 'غير متوفر',
      row.id || 'غير متوفر',
    ]);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      styles: {
        font: 'Amiri',
        halign: 'right',
        fontSize: 10,
        cellPadding: 2,
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [26, 77, 79],
        textColor: [255, 255, 255],
        halign: 'right',
      },
      margin: { top: 39, right: 10, left: 10 },


       didDrawPage: (data: any) => {
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;

      // 🔷 إضافة اللوجو أعلى الصفحة (في كل صفحة)
      doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

      // 🔹 كتابة العنوان في أول صفحة فقط (اختياري)
      if (doc.getCurrentPageInfo().pageNumber === 1) {
        doc.setFontSize(12);
        doc.setFont('Amiri', 'normal');
        doc.text('الطلبات الجديدة', pageWidth / 2, 20, { align: 'right' });
      }

      // 🔸 الفوتر
      doc.setFontSize(10);
      doc.setFont('Amiri', 'normal');

      doc.text(userName, 10, pageHeight - 10, { align: 'left' });

      const pageNumber = `صفحة ${doc.getCurrentPageInfo().pageNumber}`;
      doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });

      const dateText =
        "التاريخ: " +
        new Date().toLocaleDateString('ar-EG', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) +
        "  الساعة: " +
        new Date().toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        });
      doc.text(dateText, pageWidth - 10, pageHeight - 10, { align: 'right' });
    },

      didParseCell: (data: any) => {
        data.cell.styles.halign = 'right';
      },
    });
    doc.save('new_orders.pdf');
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('الطلبات الجديدة', { properties: { defaultColWidth: 20 } });
    worksheet.columns = [
      { header: 'رقم الطلب', key: 'id', width: 15 },
      { header: 'اسم العميل', key: 'clientName', width: 20 },
      { header: 'رقم العميل', key: 'clientPhone', width: 15 },
      { header: 'هوية العميل', key: 'clientNationalId', width: 15 },
      { header: 'رقم العاملة', key: 'maidId', width: 15 },
      { header: 'اسم العاملة', key: 'maidName', width: 20 },
      { header: 'الجنسية', key: 'nationality', width: 15 },
      { header: 'جواز السفر', key: 'passport', width: 15 },
      { header: 'العمر', key: 'age', width: 10 },
    ];
    worksheet.getRow(1).font = { name: 'Amiri', size: 12 };
    worksheet.getRow(1).alignment = { horizontal: 'right' };
    exportedData.forEach((row: any) => {
      worksheet.addRow({
        id: row.id || 'غير متوفر',
        clientName: row.client?.fullname || 'غير متوفر',
        clientPhone: row.client?.phonenumber || 'غير متوفر',
        clientNationalId: row.client?.nationalId || 'غير متوفر',
        maidId: row.HomeMaid?.id || 'غير متوفر',
        maidName: row.HomeMaid?.Name || 'غير متوفر',
        nationality: row.HomeMaid?.office?.Country || 'غير متوفر',
        passport: row.Passportnumber || 'غير متوفر',
        age: row.HomeMaid?.age || calculateAge(row.HomeMaid?.dateofbirth),
      }).alignment = { horizontal: 'right' };
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'new_orders.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };
useEffect(() => {
  const filteredOrders = filterOrders();
  setSortedOrders(filteredOrders);
}, [formData.searchTerm, ageFilter, nationalityFilter, allOrders]);
  // Client-side authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/admin/login');
          return;
        }
        
        // Use verify-permissions API which checks token validity
        const response = await axios.post('/api/verify-permissions');
        
        if (!response.data.hasPermission) {
          setShowPermissionModal(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/admin/login');
      }
    };
    
    checkAuth();
  }, [router]);

  const clientOptions = clients.map((client: any) => ({
    value: client.id,
    label: client.fullname,
  }));

  const ageOptions = [
    { value: "", label: "الكل" },
    { value: "20-30", label: "20-30 سنة" },
    { value: "31-40", label: "31-40 سنة" },
    { value: "41-50", label: "41-50 سنة" },
    { value: "51-60", label: "51-60 سنة" },
  ];

  const nationalityOptions = offices.map((office: any) => ({
    value: office.Country,
    label: office.Country,
  }));

  const totalPages = Math.ceil(totalCount / pageSize);
  const startRecord = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      // alert(page);
      
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <a
          key={i}
          // href="#"
          onClick={() => handlePageChange(i)}
          className={`px-2 py-1 border rounded text-sm ${
            i === currentPage
              ? 'border-teal-900 bg-teal-900 text-white'
              : 'border-gray-300 bg-gray-50'
          }`}
        >
          {i}
        </a>
      );
    }
    return (
      <div className="flex justify-between items-center mt-6">
        <span className="text-base">
          عرض {startRecord}-{endRecord} من {totalCount} نتيجة
        </span>
        <nav className="flex gap-1">
          <a
            href="#"
            onClick={() => handlePageChange(currentPage - 1)}
            className={`px-2 py-1 border border-gray-300 rounded bg-gray-50 text-sm ${
              currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            السابق
          </a>
          {pages}
          <a
            href="#"
            onClick={() => handlePageChange(currentPage + 1)}
            className={`px-2 py-1 border border-gray-300 rounded bg-gray-50 text-sm ${
              currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            التالي
          </a>
        </nav>
      </div>
    );
  };

  const renderRequests = () => (
    <div className="p-6 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-normal">الطلبات الجديدة</h1>
        <button
          className="flex items-center gap-2 bg-teal-900 text-white px-4 py-2 rounded hover:bg-teal-800 transition duration-200"
          onClick={() => {
            setHidden(false);
          }}
          //  openPopup('popup-product-check')
        >
          <Plus />
          <span>إضافة طلب</span>
        </button>
      </div>
      <div className="bg-white border border-gray-300 rounded p-6">
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="flex flex-col sm:flex-row gap-4 h-8">
            <div className="flex items-center border-none rounded bg-gray-50 p-2">
              <input
                type="text"
                placeholder="بحث"
                value={formData.searchTerm || ""}
                onChange={handleSearchChange}
                className="bg-transparent border-none w-48 text-right"
              />
              <Search />
            </div>
            <div className="flex items-center border-none rounded bg-none">
              <Select
                options={ageOptions}
                onChange={handleAgeFilterChange}
                placeholder="كل الأعمار"
                className="w-40 text-right"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: '#F9FAFB',
                    borderColor: '#D1D5DB',
                    textAlign: 'right',
                    paddingRight: '0.5rem',
                  }),
                  menu: (base) => ({
                    ...base,
                    textAlign: 'right',
                  }),
                  singleValue: (base) => ({
                    ...base,
                    textAlign: 'right',
                  }),
                  placeholder: (base) => ({
                    ...base,
                    textAlign: 'right',
                  }),
                }}
              />
            </div>
            <div className="flex items-center border-none rounded">
              <Select
                options={nationalityOptions}
                onChange={handleNationalityFilterChange}
                placeholder="كل الجنسيات"
                className="w-40 text-right"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: '#F9FAFB',
                    borderColor: '#D1D5DB',
                    textAlign: 'right',
                    paddingRight: '0.5rem',
                  }),
                  menu: (base) => ({
                    ...base,
                    textAlign: 'right',
                  }),
                  singleValue: (base) => ({
                    ...base,
                    textAlign: 'right',
                  }),
                  placeholder: (base) => ({
                    ...base,
                    textAlign: 'right',
                  }),
                }}
              />
            </div>
            <button
              className="bg-teal-900 text-white px-2 rounded hover:bg-teal-800 transition duration-200"
              onClick={() => {
                setAgeFilter("");
                setNationalityFilter("");
                setFormData({ ...formData, searchTerm: "" });
                setCurrentPage(1);
              }}
            >
              إعادة ضبط
            </button>
          </div>
        </div>
        <div className="flex gap-4 justify-end mb-9">
          <button
            className="flex items-center gap-1 bg-teal-900 text-white px-3 py-1 rounded text-sm hover:bg-teal-800 transition duration-200"
            onClick={exportToPDF}
          >
            <FilePdfOutlined />
            <span>PDF</span>
          </button>
          <button
            className="flex items-center gap-1 bg-teal-900 text-white px-3 py-1 rounded text-sm hover:bg-teal-800 transition duration-200"
            onClick={exportToExcel}
          >
            <FileExcelOutlined />
            <span>Excel</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center">جارٍ التحميل...</div>
          ) : (
            <table className="w-full text-right text-sm" dir='ltr'>
              <thead className="bg-teal-900 text-white">
                <tr>
                  <th className="l pr-6 text-center">الإجراءات</th>
                  <th className="p-4 text-center">عرض</th>
                  <th className="p-4 cursor-pointer hover:bg-teal-800" onClick={() => handleSort('age')}>
                    <div className="flex items-center gap-1 text-center">
                      <span>العمر</span>
                      {sortField  && (
                        sortDirection  ? <span><ChevronUp className="w-4 h-4" />  <ChevronDown className="w-4 h-4" /></span> : <span><ChevronUp className="w-4 h-4" />  <ChevronDown className="w-4 h-4" /></span>  
                      )}
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-teal-800" onClick={() => handleSort('passport')}>
                    <div className="flex items-center gap-1 text-center">
                      <span>جواز السفر</span>
                      {sortField  && (
                        sortDirection  ? <span><ChevronUp className="w-4 h-4" />  <ChevronDown className="w-4 h-4" /></span> : <span><ChevronUp className="w-4 h-4" />  <ChevronDown className="w-4 h-4" /></span>  
                      )}
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-teal-800" onClick={() => handleSort('nationality')}>
                    <div className="flex items-center gap-1 text-center">
                        <span>الجنسية</span>
                      {sortField  && (
                        sortDirection  ? <span><ChevronUp className="w-4 h-4" />  <ChevronDown className="w-4 h-4" /></span> : <span><ChevronUp className="w-4 h-4" />  <ChevronDown className="w-4 h-4" /></span>  
                      )}
                    </div>
                  </th>






                  <th className="p-4 cursor-pointer hover:bg-teal-800 " onClick={() => handleSort('maidName')}>
                    <div className="flex items-center gap-1 text-center">
                        <span>اسم العاملة</span>
                      {sortField  && (
                        sortDirection  ? <span><ChevronUp className="w-4 h-4" />  <ChevronDown className="w-4 h-4" /></span> : <span><ChevronUp className="w-4 h-4" />  <ChevronDown className="w-4 h-4" /></span>  
                      )}
                    </div>
                  </th>






                  <th className="p-4 cursor-pointer hover:bg-teal-800" onClick={() => handleSort('maidId')}>
                    <div className="flex items-center gap-1 text-center">
                      <span>رقم العاملة</span>
                      {sortField  && (
                        sortDirection  ? <span><ChevronUp className="w-4 h-4" />  <ChevronDown className="w-4 h-4" /></span> : <span><ChevronUp className="w-4 h-4" />  <ChevronDown className="w-4 h-4" /></span>
                      )}
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-teal-800" onClick={() => handleSort('clientId')}>
                    <div className="flex items-center gap-1 text-center">
                      <span>هوية العميل</span>
                      {sortField  && (
                        sortDirection  ? <span><ChevronUp className="w-4 h-4" />  <ChevronDown className="w-4 h-4" /></span> : <span><ChevronUp className="w-4 h-4" />  <ChevronDown className="w-4 h-4" /></span>  
                      )}
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-teal-800" onClick={() => handleSort('clientPhone')}>
                    <div className="flex items-center gap-1 text-center">
                      <span>رقم العميل</span>
                      {sortField  && (
                        sortDirection  ? <span><ChevronUp className="w-4 h-4" />  <ChevronDown className="w-4 h-4" /></span> : <span><ChevronUp className="w-4 h-4" />  <ChevronDown className="w-4 h-4" /></span>
                      )}
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:bg-teal-800" onClick={() => handleSort('clientName')}>
                    <div className="flex items-center gap-1 text-center">
                      <span>اسم العميل</span>
                      {sortField  && (
                        sortDirection  ? <span><ChevronUp className="w-4 h-4" />  <ChevronDown className="w-4 h-4" /></span> : <span><ChevronUp className="w-4 h-4" />  <ChevronDown className="w-4 h-4" /></span>
                      )}
                    </div>
                  </th>
                  <th className="p-4 pl-6 cursor-pointer hover:bg-teal-800" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-1 text-center">
                      <span>رقم الطلب</span>
                      {sortField  && (
                        sortDirection  ? <span><ChevronUp className="w-4 h-4" />  <ChevronDown className="w-4 h-4" /></span> : <span><ChevronUp className="w-4 h-4" />  <ChevronDown className="w-4 h-4" /></span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>

<tbody>
  {newOrders.map((row, index) => (
    <>
      <tr key={index} className="bg-gray-50">
        <td className="p-4 pr-6">
          <button
            className="p-1 cursor-pointer"
            onClick={(e) => handleOpenMenu(e, index)}
          >
            <MoreHorizontal />
          </button>
          {menuPosition && menuPosition.row === index && (
            <div
              className="fixed w-40 bg-gray-100 border border-gray-200 rounded shadow-lg z-50 text-center"
              style={{
                top: menuPosition.y,
                left: menuPosition.x,
              }}
            >
              <button
                className="block w-full text-center px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  setSelectedOrderId(row?.id);
                  setSelectedClientId(null);
                  openPopup("popup-confirm-accept");
                  setMenuPosition(null);
                }}
              >
                قبول الطلب
              </button>
              <button
                className="block w-full text-center px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  setSelectedOrderId(row?.id);
                  setSelectedClientId(row?.clientID ? String(row.clientID) : null);
                  openPopup("popup-confirm-reject");
                  setMenuPosition(null);
                }}
              >
                رفض الطلب
              </button>
              <button
                className="block w-full text-center px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  const editPage = row.isAvailable ? 'add-available' : 'add-specs';
                  router.push(`/admin/order-form?type=${editPage}&orderId=${row.id}`);
                  setMenuPosition(null);
                }}
              >
                تعديل
              </button>
            </div>
          )}
        </td>
        <td className={`p-4 ${row.HomeMaid?.logs.length > 0 ? 'cursor-pointer' : ''}`}>
          <ChevronDown onClick={() =>  row.HomeMaid?.logs.length > 0 ? toggleDetails(index) : null}  color={row.HomeMaid?.logs.length > 0 ? 'black' : 'gray'} />
        </td>
        <td className="p-4 text-center">{row.HomeMaid?.age || calculateAge(row.HomeMaid?.dateofbirth)}</td>
        <td className="p-4 text-center">{row.Passportnumber || 'غير متوفر'}</td>
        <td className="p-4 text-center">{row.HomeMaid?.office?.Country || 'غير متوفر'}</td>
        <td className="p-4 text-center">{row.HomeMaid?.Name || 'غير متوفر'}</td>
        <td className="p-4 text-center">{row.HomeMaid?.id || 'غير متوفر'}</td>
        <td className="p-4 text-center">{row.client?.nationalId || 'غير متوفر'}</td>
        <td className="p-4 text-center">{row.client?.phonenumber || 'غير متوفر'}</td>
        <td className="p-4 text-center">{row.client?.fullname || 'غير متوفر'}</td>
        <td className="p-4 text-center cursor-pointer" onClick={() => handleOrderClick(row.id)}>
          #{row.id}
        </td>
      </tr>
      {detailsRow === index && (
        <tr className="bg-white">
          <td colSpan={11} className="p-0">
            <div className="p-4">
              <div className="border border-gray-300 rounded">
                <div className="grid grid-cols-5 bg-gray-100 font-bold text-base p-3 border-b border-gray-300 ">
                  <span>العملية</span>
                  <span>التاريخ</span>
                  <span>المستخدم</span>
                  <span>الوصف</span>
                  <span>السبب</span>
                </div>
                {row.HomeMaid?.logs.length > 0 && (
                  row.HomeMaid?.logs.map((log: any) => (
                    <div key={log.id || Math.random()} className="grid grid-cols-5 p-3 text-gray-500 text-sm items-center">
                      <span>{log.Status || "غير متوفر"}</span>
                      <span>{log.createdAt ? new Date(log.createdAt).toLocaleString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "غير متوفر"}</span>
                      <span>{log.user?.username || "غير متوفر"}</span>
                      <span>{log.Details || "غير متوفر"}</span>
                      <span>{log.reason || "غير متوفر"}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  ))}
</tbody>


            </table>
          )}
        </div>
        {renderPagination()}
      </div>
    </div>
  );

  return (
    <Layout>
      <Head>
        <title>الطلبات الجديدة</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <PrePopupmodal hidden={hidden} setHidden={setHidden} setActivePopup={setActivePopup} />
      <div className={`text-gray-800 ${Style["tajawal-regular"]}`}>
        {activePopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[999] flex items-center justify-center">
            {activePopup === 'popup-confirm-accept' && (
              <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center relative">
                <button
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                  onClick={closePopup}
                >
                  <X className="w-5 h-5" />
                </button>
                <p>هل أنت متأكد من قبول الطلب؟</p>
                <div className="flex justify-between mt-4">
                  <button
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition duration-200"
                    onClick={closePopup}
                  >
                    إلغاء
                  </button>
                   <button
                     className="bg-teal-900 text-white px-4 py-2 rounded hover:bg-teal-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                     onClick={() => selectedOrderId && confirmAccept(selectedOrderId)}
                     disabled={isConfirming}
                   >
                     {isConfirming ? 'جاري المعالجة...' : 'نعم'}
                   </button>
                </div>
              </div>
            )}
            {activePopup === 'popup-confirm-reject' && (
              <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center relative">
                <button
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                  onClick={closePopup}
                >
                  <X className="w-5 h-5" />
                </button>
                <p className="mb-3">هل أنت متأكد من رفض الطلب؟</p>
                <div className="mb-4 text-right">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    سبب الرفض <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="يرجى كتابة سبب رفض الطلب..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-right"
                    rows={3}
                    dir="rtl"
                  />
                </div>
                <div className="flex justify-between mt-4">
                  <button
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition duration-200"
                    onClick={closePopup}
                  >
                    إلغاء
                  </button>
                   <button
                     className="bg-teal-900 text-white px-4 py-2 rounded hover:bg-teal-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => selectedOrderId && selectedClientId && confirmReject(selectedOrderId, selectedClientId, rejectionReason)}
                     disabled={isConfirming || !rejectionReason.trim()}
                   >
                     {isConfirming ? 'جاري المعالجة...' : 'نعم'}
                   </button>
                </div>
              </div>
            )}
            {activePopup === 'popup-check-client' && (
              <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center relative">
                <button
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                  onClick={closePopup}
                >
                  <X className="w-5 h-5" />
                </button>
                <p className="text-base">تحقق من العميل</p>
                <p>هل العميل موجود مسبقاً؟</p>
                <Select
                  options={clientOptions}
                  onChange={() => {}}
                  placeholder="اختر عميل من القائمة"
                  className="w-full mt-2 mb-4 text-right"
                  styles={{
                    control: (base) => ({
                      ...base,
                      backgroundColor: '#F9FAFB',
                      borderColor: '#D1D5DB',
                      padding: '0.5rem',
                      textAlign: 'right',
                    }),
                    menu: (base) => ({
                      ...base,
                      textAlign: 'right',
                    }),
                    singleValue: (base) => ({
                      ...base,
                      textAlign: 'right',
                    }),
                    placeholder: (base) => ({
                      ...base,
                      textAlign: 'right',
                    }),
                  }}
                />
                <button className="bg-teal-900 text-white px-4 py-2 rounded w-full hover:bg-teal-800 transition duration-200">
                  عميل جديد
                </button>
              </div>
            )}
            {activePopup === 'popup-product-check' && (
              <div className="bg-gray-100 p-8 rounded-xl shadow-2xl w-120 text-center transform transition-all duration-300 ease-in-out relative">
                <button
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                  onClick={closePopup}
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold mb-4 text-teal-900">اختيار نوع الطلب</h2>
                <p className="text-gray-600 mb-6">هل تريد اختيار من العاملات المتاحات أو حسب المواصفات؟</p>
                {selectedClient && (
                  <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">العميل المختار:</p>
                    <p className="font-medium">{selectedClient.fullname}</p>
                    <p className="text-sm text-gray-500">{selectedClient.phonenumber} - {selectedClient.city}</p>
                  </div>
                )}
                <div className="flex justify-center gap-4">
                  <button
                    className="bg-gray-100 text-gray-800 border-2 border-teal-800 px-6 py-3 rounded-lg hover:bg-gray-200 transition duration-200 text-base font-medium"
                    onClick={() => {
                      closePopup();
                      const clientData = selectedClient ? `&clientId=${selectedClient.id}&clientName=${encodeURIComponent(selectedClient.fullname)}&clientPhone=${selectedClient.phonenumber}&clientCity=${selectedClient.city || ''}` : '';
                      router.push(`/admin/order-form?type=add-specs${clientData}`);
                    }}
                  >
                    حسب المواصفات
                  </button>
                  <button
                    className="bg-teal-900 text-white px-6 py-3 rounded-lg hover:bg-teal-800 transition duration-200 text-base font-medium"
                    onClick={() => {
                      closePopup();
                      const clientData = selectedClient ? `&clientId=${selectedClient.id}&clientName=${encodeURIComponent(selectedClient.fullname)}&clientPhone=${selectedClient.phonenumber}&clientCity=${selectedClient.city || ''}` : '';
                      router.push(`/admin/order-form?type=add-available${clientData}`);
                    }}
                  >
                    قائمة العاملات المتاحة
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {(showSuccessModal || showErrorModal || showPermissionModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center">
            {showPermissionModal ? (
              <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center relative">
                <button
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                  onClick={closePermissionModal}
                >
                  <X className="w-5 h-5" />
                </button>
                <p className="text-red-600">غير مصرح لك بعرض هذه الصفحة</p>
                <button
                  className="bg-teal-900 text-white px-4 py-2 rounded mt-4 hover:bg-teal-800 transition duration-200"
                  onClick={closePermissionModal}
                >
                  موافق
                </button>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-lg w-80 text-center relative">
                <button
                  className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                  onClick={closeModal}
                >
                  <X className="w-5 h-5" />
                </button>
                <p className={showSuccessModal ? "text-teal-900" : "text-red-600"}>{modalMessage}</p>
                <button
                  className="bg-teal-900 text-white px-4 py-2 rounded mt-4 hover:bg-teal-800 transition duration-200"
                  onClick={closeModal}
                >
                  موافق
                </button>
              </div>
            )}
          </div>
        )}
        {isRevalidating && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-[2000] flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-teal-900 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-lg font-medium text-teal-900">جاري إعادة التحقق من البيانات...</p>
                <p className="text-sm text-gray-600">يرجى الانتظار 15 ثانية</p>
              </div>
            </div>
          </div>
        )}
        {hasPermission ? renderRequests() : (
          <div className="p-6 min-h-screen">
            <h1 className="text-3xl font-normal"></h1>
            <p className="text-gray-600 mt-4">غير مصرح.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Helper function to serialize dates
const serializeDates = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serializeDates);
  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const key in obj) {
      serialized[key] = serializeDates(obj[key]);
    }
    return serialized;
  }
  return obj;
};

export const getServerSideProps: GetServerSideProps<DashboardProps> = async () => {
  try {
    // Fetch all the data needed for the page
    const [newOrders, clients, homemaids, offices, exportData] = await Promise.all([
      // Fetch new orders
      prisma.neworder.findMany({
        orderBy: { id: "desc" },
        include: {
          client: true,
          HomeMaid: {
            select: {
              dateofbirth: true,
              Name: true,
              Passportnumber: true,
              id: true,
              officeName: true,
              Nationalitycopy: true,
              office: {
                select: {
                  Country: true,
                },
              },
              logs: { include: { user: true } },
            },
          },
        },
        where: {
          bookingstatus: "new_order",
        },
      }),
      // Fetch clients
      prisma.client.findMany({
        orderBy: { id: "desc" },
      }),
      // Fetch homemaids
      prisma.homemaid.findMany({
        select: {
          Name: true,
          id: true,
          dateofbirth: true,
          Passportnumber: true,
          office: {
            select: {
              office: true,
              Country: true
            }
          }
        }
      }),
      // Fetch offices/nationalities
      prisma.offices.findMany({
        select: {
          Country: true,
        },
        orderBy: { Country: 'asc' }
      }),
      // Fetch export data (all new orders for export)
      prisma.neworder.findMany({
        orderBy: { id: "desc" },
        include: {
          client: true,
          HomeMaid: {
            select: {
              dateofbirth: true,
              Name: true,
              Passportnumber: true,
              id: true,
              officeName: true,
              Nationalitycopy: true,
              office: {
                select: {
                  Country: true,
                },
              },
              logs: { include: { user: true } },
            },
          },
        },
        where: {
          bookingstatus: "new_order",
        },
      })
    ]);

    // Process offices to get unique countries
    const uniqueCountries = Array.from(new Set(offices.map(office => office.Country).filter(Boolean)));
    const processedOffices = uniqueCountries.map((country, index) => ({
      id: index + 1,
      value: country,
      label: country,
      Country: country
    }));

    // Serialize all data to make it JSON serializable
    const serializedData = {
      newOrders: serializeDates(newOrders),
      clients: serializeDates(clients),
      homemaids: serializeDates(homemaids),
      offices: serializeDates(processedOffices),
      exportData: serializeDates(exportData)
    };

    return {
      props: {
        hasPermission: true, // Auth is handled client-side (token in localStorage)
        initialData: serializedData
      },
    };
  } catch (err) {
    console.error("SSR data fetch error:", err);
    return {
      props: {
        hasPermission: false,
        initialData: {
          newOrders: [],
          clients: [],
          homemaids: [],
          offices: [],
          exportData: []
        }
      },
    };
  }
};