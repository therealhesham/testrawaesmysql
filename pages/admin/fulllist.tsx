import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "example/containers/Layout";
import Style from "styles/Home.module.css";
import { FaSearch, FaRedo, FaFileExcel, FaFilePdf, FaArrowUp, FaArrowDown, FaGripVertical, FaSort, FaSortUp, FaSortDown, FaTh, FaThList, FaFilter } from "react-icons/fa";
import { ArrowLeftIcon } from "@heroicons/react/outline";
import { PlusOutlined } from "@ant-design/icons";
import { Trash2 } from "lucide-react";
import Modal from "react-modal";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { jwtDecode } from "jwt-decode";
import prisma from "lib/prisma";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// Bind modal to app element for accessibility
Modal.setAppElement("#__next");

interface FullListProps {
  hasDeletePermission: boolean;
  initialCounts: {
    totalCount: number;
    totalPages: number;
    recruitment: number;
    rental: number;
  };
  recruitmentData: any[];
  rentalData: any[];
  uniqueCountries: string[];
}

export function formatMaritalStatus(status?: string | null) {
  if (!status) return 'غير متوفر';
  if (status.includes('مطلقة') || status.toLowerCase().includes('divorced')) return 'مطلقة';
  if (status.includes('متزوجة') || status.toLowerCase().includes('married')) return 'متزوجة';
  if (status.includes('عازبة') || status.toLowerCase().includes('single')) return 'عازبة';
  if (status.includes('أرملة') || status.toLowerCase().includes('widowed')) return 'أرملة';
  if (status.includes('-')) {
    const parts = status.split('-');
    return parts[parts.length - 1].trim();
  }
  return status;
}

export default function FullList({ recruitmentData, rentalData, initialCounts, hasDeletePermission, uniqueCountries }: FullListProps) {
  const [filters, setFilters] = useState({
    Name: "",
    age: "",
    PassportNumber: "",
    phone: "",
    Country: "",
    office: "",
    maritalstatus: "",
  });
  const [isReservedFilter, setIsReservedFilter] = useState<'all' | 'reserved' | 'available'>('all');
  const [isReservedFilterModalOpen, setIsReservedFilterModalOpen] = useState(false);
  const [isApprovedFilter, setIsApprovedFilter] = useState<'all' | 'approved' | 'not_approved'>('all');
  const [isApprovedFilterModalOpen, setIsApprovedFilterModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>("displayOrder");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [contractType, setContractType] = useState('recruitment');
  const [recruitmentCount, setRecruitmentCount] = useState(initialCounts?.recruitment || 0);
  const [rentalCount, setRentalCount] = useState(initialCounts?.rental || 0);
  function getDate(date: any) {
    const currentDate = new Date(date); // Original date
    // currentDate.setDate(currentDate.getDate() + 90); // Add 90 days
    const form = currentDate.toISOString().split("T")[0];
    console.log(currentDate);
    return form;
  }

  function calculateAge(birthDate: any) {
    if (!birthDate) return 'غير محدد';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  function formatBirthDate(birthDate: any) {
    if (!birthDate) return 'غير محدد';
    const birth = new Date(birthDate);
    return birth.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Column selector state
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'id',
    'Name',
    'phone',
    'Country',
    'maritalstatus',
    'dateofbirth',
    'Passportnumber',
    'PassportStart',
    'PassportEnd',
    'isReserved',
    'displayOrder',
  ]);


  const [isStep1ModalOpen, setIsStep1ModalOpen] = useState(false);
  const [isStep2ModalOpen, setIsStep2ModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    Name: "",
    InternalmusanedContract: "",
    id: "",
    SponsorIdnumber: "",
    SponsorPhoneNumber: "",
    PassportNumber: "",
    KingdomentryDate: "",
    DayDate: "",
    profileStatus: "",
    KingdomentryTime: "",
    deparatureTime: "",
    visaNumber: "",
    finalDestinationTime: "",
    ExternalStatusByoffice: "",
    deparatureDate: "",
    finalDestinationDate: "",
    DeliveryDate: "",
    office: "",
    Orderid: "",
    WorkDuration: "",
    Cost: "",
    nationalidNumber: "",
    externalOfficeFile: null,
    finaldestination: "",
    externalOfficeStatus: "",
    HomemaIdnumber: "",
    HomemaidName: "",
    Notes: "",
    externalmusanadcontractfile: null,
    medicalCheckFile: null,
    ticketFile: null,
    receivingFile: null,
    approvalPayment: null,
    additionalfiles: [],
    externalmusanedContract: "",
    ArrivalCity: "",
    DeliveryFile: null,
    DateOfApplication: "",
    MusanadDuration: "",
    ExternalDateLinking: "",
    ExternalOFficeApproval: "",
    AgencyDate: "",
    EmbassySealing: "",
    BookinDate: "",
    GuaranteeDurationEnd: "",
    Nationality: "",
    GuaranteeStatus: "",
    reason: "",
    ArrivalDate: "",
  });


  const [data, setData] = useState<any[]>(contractType === 'recruitment' ? recruitmentData : rentalData);
  const [loading, setLoading] = useState(false);
  const [switchingType, setSwitchingType] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialCounts?.totalPages || 1);
  const isFetchingRef = useRef(false);
  const isInitialMount = useRef(true);
  const previousContractTypeRef = useRef(contractType);
  const [exportedData, setExportedData] = useState<any[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [exportType, setExportType] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [homemaidToDelete, setHomemaidToDelete] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDisplayOrderTooltip, setShowDisplayOrderTooltip] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const [tempFilterValue, setTempFilterValue] = useState("");

  const openFilterModal = (column: string) => {
    setActiveFilterColumn(column);
    setTempFilterValue((filters as any)[column] || "");
  };

  const getColumnLabel = (col: string) => {
    switch (col) {
      case 'Name': return 'الاسم';
      case 'PassportNumber': return 'رقم الجواز';
      case 'phone': return 'رقم الجوال';
      case 'Country': return 'الجنسية';
      case 'office': return 'المكتب';
      case 'maritalstatus': return 'الحالة الاجتماعية';
      case 'age': return 'العمر';
      default: return col;
    }
  };

  const applyColumnFilter = () => {
    if (activeFilterColumn) {
      setFilters(prev => ({
        ...prev,
        [activeFilterColumn]: tempFilterValue
      }));
      setCurrentPage(1);
    }
    setActiveFilterColumn(null);
  };

  const clearColumnFilter = (column: string) => {
    setFilters(prev => ({
      ...prev,
      [column]: ""
    }));
    setCurrentPage(1);
  };

  const renderFilterableHeader = (sortField: string, filterField: string | null, label: string, isSortable: boolean = true) => {
    const isActive = filterField ? !!(filters as any)[filterField] : false;
    return (
      <th className="px-2 py-3 text-center select-none whitespace-nowrap group transition-colors align-top min-w-[120px]">
        <div className="flex flex-col items-center justify-start gap-1">
          <div className="flex items-center justify-center gap-1.5">
            {isSortable ? (
              <span className="cursor-pointer font-semibold flex items-center gap-1 transition-colors hover:text-teal-200" onClick={() => handleSort(sortField)}>
                {label} <SortIcon field={sortField} />
              </span>
            ) : (
              <span className="font-semibold flex items-center gap-1">
                {label}
              </span>
            )}
            {filterField && (
              <button
                 onClick={(e) => { e.stopPropagation(); openFilterModal(filterField); }}
                 className={`p-1.5 rounded-full hover:bg-teal-600 transition-all focus:outline-none ${isActive ? 'text-teal-100 bg-teal-600' : 'text-teal-400/50 hover:text-teal-200'}`}
                 title={`فلترة ${label}`}
              >
                <FaFilter size={12} />
              </button>
            )}
          </div>
          {isActive && filterField && (
            <div className="flex items-center justify-between gap-1.5 bg-teal-900/40 px-2 py-0.5 rounded-full text-teal-50 max-w-[120px] mt-1 border border-teal-600/30 w-full shadow-inner">
              <span className="text-xs truncate font-medium flex-1 text-center" title={(filters as any)[filterField]}>
                {(filters as any)[filterField]}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); clearColumnFilter(filterField); }} 
                className="text-teal-200 hover:text-white hover:bg-red-500 rounded-full w-4 h-4 flex items-center justify-center shrink-0 transition-colors"
                title="مسح الفلتر"
              >
                &times;
              </button>
            </div>
          )}
        </div>
      </th>
    );
  };

  // Sort data function
  const sortData = (dataToSort: any[], sortField: string, order: "asc" | "desc") => {
    const sorted = [...dataToSort].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      // Handle nested fields
      if (sortField === 'Country' || sortField === 'office') {
        aValue = a?.office?.[sortField === 'Country' ? 'Country' : 'office'] || '';
        bValue = b?.office?.[sortField === 'Country' ? 'Country' : 'office'] || '';
      } else {
        aValue = a[sortField] || '';
        bValue = b[sortField] || '';
      }

      // Handle different data types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle boolean values (isReserved, isApproved)
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        const numA = aValue ? 1 : 0;
        const numB = bValue ? 1 : 0;
        return order === 'asc' ? numA - numB : numB - numA;
      }

      // String comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (order === 'asc') {
        return aStr.localeCompare(bStr, 'ar');
      } else {
        return bStr.localeCompare(aStr, 'ar');
      }
    });

    return sorted;
  };

  const fetchData = async (page = 1, customContractType?: string, isTypeSwitching = false, customReservedFilter?: 'all' | 'reserved' | 'available') => {
    // Allow fetch if switching types (force new request)
    if (isFetchingRef.current && !isTypeSwitching) return;
    isFetchingRef.current = true;
    setLoading(true);
    if (isTypeSwitching) {
      setSwitchingType(true);
    }

    try {
      // Use custom contract type if provided, otherwise use state
      // Always prefer customContractType when provided to avoid stale state
      const typeToUse = customContractType !== undefined ? customContractType : contractType;
      
      const queryParams = new URLSearchParams({
        Name: filters.Name,
        SponsorName: filters.Name, // Also send as SponsorName for API compatibility
        age: filters.age,
        PassportNumber: filters.PassportNumber,
        phone: filters.phone,
        Country: filters.Country,
        office: filters.office,
        maritalstatus: filters.maritalstatus,
        contractType: typeToUse,
        page: String(page),
        perPage: viewMode === 'table' ? '10' : '8',
        sortBy: sortBy,
        sortOrder: sortOrder,
      });
      const reservedFilterToUse = customReservedFilter !== undefined ? customReservedFilter : isReservedFilter;
      if (reservedFilterToUse !== 'all') {
        queryParams.set('isReservedFilter', reservedFilterToUse);
      }
      if (isApprovedFilter !== 'all') {
        queryParams.set('isApprovedFilter', isApprovedFilter);
      }
      
      console.log('Fetching data with contractType:', typeToUse);
      console.log('Fetching data with filters:', filters);
      console.log('Query params:', queryParams.toString());

      const response = await fetch(`/api/homemaidprisma?${queryParams}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "get",
      });

      const { data: res, totalPages: pages, totalCount, recruitment, rental } = await response.json();
      console.log("API Response - contractType used:", typeToUse);
      console.log("API Response - data count:", res?.length || 0);
      console.log("API Response - full data:", res);
      
      // Always update counts regardless of data length
      if (recruitment !== undefined) setRecruitmentCount(recruitment);
      if (rental !== undefined) setRentalCount(rental);
      
      if (res && res.length > 0) {
        // Handle sorting for virtual columns that the backend cannot sort (isApproved only, isReserved uses filtering now)
        let sortedData = res;
        if (sortBy === 'isApproved') {
          sortedData = sortData(res, sortBy, sortOrder as 'asc' | 'desc');
        }
        
        // Don't sort on client side anymore for other columns, data comes sorted from server
        setData(sortedData);
        console.log("Data fetched successfully for type:", typeToUse, "Count:", res.length);
        setTotalPages(pages || 1);
      } else {
        console.log("No data returned for contractType:", typeToUse);
        setData([]);
        setTotalPages(pages || 1);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setSwitchingType(false);
      isFetchingRef.current = false;
    }
  };

  const fetchExportData = async () => {
    try {
      // Remove all filters to get ALL data for export
      const queryParams = new URLSearchParams({
        page: "1",
        perPage: "10000", // Get all data for export - increased limit
        contractType: contractType,
      });

      const response = await fetch(`/api/homemaidprisma?${queryParams}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "get",
      });

      const { data: res } = await response.json();
      console.log('API response (ALL DATA):', res);
      const exportData = Array.isArray(res) ? res : [];
      console.log('Processed export data (ALL DATA):', exportData);
      setExportedData(exportData);
      return exportData;
    } catch (error) {
      console.error("Error fetching export data:", error);
      setExportedData([]);
      return [];
    }
  };

  // Handle sort click
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field with default order
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Sort icon component
  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) {
      return <FaSort className="inline-block ml-1 text-gray-300" />;
    }
    return sortOrder === 'asc' 
      ? <FaSortUp className="inline-block ml-1" />
      : <FaSortDown className="inline-block ml-1" />;
  };

  // Fetch data when page, filters, or contractType changes
  useEffect(() => {
    // Skip fetch on initial mount - will be handled after URL params are read
    if (isInitialMount.current) {
      return;
    }
    
    // Check if contractType changed
    const isContractTypeChanged = previousContractTypeRef.current !== contractType;
    if (isContractTypeChanged) {
      previousContractTypeRef.current = contractType;
      // Clear data immediately when switching types to show loading state
      setData([]);
      // Reset fetching flag to allow new request
      isFetchingRef.current = false;
    }
    
    // Pass contractType explicitly to ensure correct value is used
    fetchData(currentPage, contractType, isContractTypeChanged);
  }, [currentPage, filters, contractType, sortBy, sortOrder, isReservedFilter]);


  const handleFilterChange = (e: any, column: string) => {
    const value = e.target.value;
    console.log('Filter change:', column, value);
    setFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
    setCurrentPage(1);
  };

  const router = useRouter();

  // قراءة رقم الصفحة والفلاتر و معاملات الترتيب من URL عند التحميل الأول فقط
  useEffect(() => {
    if (router.isReady && isInitialMount.current) {
      
      // قراءة نوع العقد من URL أولاً
      const typeFromUrl = router.query.type as string;
      const finalType = (typeFromUrl === 'recruitment' || typeFromUrl === 'rental') ? typeFromUrl : 'recruitment';
      setContractType(finalType);
      
      const pageFromUrl = router.query.page ? parseInt(router.query.page as string) : 1;
      if (pageFromUrl >= 1) {
        setCurrentPage(pageFromUrl);
      }
      
      // قراءة الفلاتر من URL
      const urlFilters = {
        Name: router.query.Name ? decodeURIComponent(router.query.Name as string) : '',
        age: router.query.age ? decodeURIComponent(router.query.age as string) : '',
        PassportNumber: router.query.PassportNumber ? decodeURIComponent(router.query.PassportNumber as string) : '',
        phone: router.query.phone ? decodeURIComponent(router.query.phone as string) : '',
        Country: router.query.Country ? decodeURIComponent(router.query.Country as string) : '',
        office: router.query.office ? decodeURIComponent(router.query.office as string) : '',
        maritalstatus: router.query.maritalstatus ? decodeURIComponent(router.query.maritalstatus as string) : '',
      };
      
      setFilters(urlFilters);
      
      // قراءة فلتر حالة الحجز من URL
      const reservedFromUrl = router.query.isReservedFilter as string;
      const finalReservedFilter = (reservedFromUrl === 'reserved' || reservedFromUrl === 'available') ? reservedFromUrl : 'all';
      setIsReservedFilter(finalReservedFilter);

      const approvedFromUrl = router.query.isApprovedFilter as string;
      const finalApprovedFilter = (approvedFromUrl === 'approved' || approvedFromUrl === 'not_approved') ? approvedFromUrl : 'all';
      setIsApprovedFilter(finalApprovedFilter);
      
      // قراءة معاملات الترتيب من URL
      if (router.query.sortBy) {
        setSortBy(router.query.sortBy as string);
      }
      if (router.query.sortOrder && (router.query.sortOrder === 'asc' || router.query.sortOrder === 'desc')) {
        setSortOrder(router.query.sortOrder as 'asc' | 'desc');
      }
      
      // Mark as no longer initial mount
      isInitialMount.current = false;
      
      // Fetch data with the contract type and reservation filter from URL
      fetchData(pageFromUrl, finalType, false, finalReservedFilter);
    }
  }, [router.isReady, router.query]);

  // تحديث URL عند تغيير الصفحة أو الفلاتر أو معاملات الترتيب أو نوع العقد
  useEffect(() => {
    if (!router.isReady || isInitialMount.current) return;
    
    const queryParams = new URLSearchParams();
    // إضافة رقم الصفحة دائماً للـ URL
    queryParams.set('page', currentPage.toString());
    // إضافة نوع العقد دائماً للـ URL
    queryParams.set('type', contractType);
    if (filters.Name) {
      queryParams.set('Name', filters.Name);
    }
    if (filters.age) {
      queryParams.set('age', filters.age);
    }
    if (filters.PassportNumber) {
      queryParams.set('PassportNumber', filters.PassportNumber);
    }
    if (filters.phone) {
      queryParams.set('phone', filters.phone);
    }
    if (filters.Country) {
      queryParams.set('Country', filters.Country);
    }
    if (filters.office) {
      queryParams.set('office', filters.office);
    }
    if (filters.maritalstatus) {
      queryParams.set('maritalstatus', filters.maritalstatus);
    }
    if (isReservedFilter !== 'all') {
      queryParams.set('isReservedFilter', isReservedFilter);
    }
    if (isApprovedFilter !== 'all') {
      queryParams.set('isApprovedFilter', isApprovedFilter);
    }
    // إضافة معاملات الترتيب
    if (sortBy) {
      queryParams.set('sortBy', sortBy);
    }
    if (sortOrder) {
      queryParams.set('sortOrder', sortOrder);
    }

    const newUrl = queryParams.toString() 
      ? `${router.pathname}?${queryParams.toString()}`
      : router.pathname;

    // تحديث URL فقط إذا كان مختلفاً لتجنب التكرار
    if (router.asPath !== newUrl) {
      router.replace(newUrl, undefined, { shallow: true });
    }
  }, [currentPage, filters, sortBy, sortOrder, contractType, isReservedFilter, router.isReady, router.pathname, router.asPath]);

  const handleUpdate = (id: any) => {
    router.push("./neworder/" + id);
  };

  const resetFilters = () => {
    isFetchingRef.current = false;
    setFilters({
      age: "",
      PassportNumber: "",
      Name: "",
      phone: "",
      Country: "",
      office: "",
      maritalstatus: "",
    });
    setIsReservedFilter('all');
    setIsApprovedFilter('all');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };


  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`mx-1 px-3 py-1 rounded ${
            currentPage === i
              ? "bg-teal-800 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex justify-center mt-4 items-center">
        {/* First Page Button */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="mx-1 px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 hover:bg-gray-300"
          title="الصفحة الأولى"
        >
          الأولى
        </button>
        
        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="mx-1 px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 hover:bg-gray-300"
        >
          السابق
        </button>
        
        {/* Page Numbers */}
        {pages}
        
        {/* Next Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="mx-1 px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 hover:bg-gray-300"
        >
          التالي
        </button>
        
        {/* Last Page Button */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="mx-1 px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50 hover:bg-gray-300"
          title="الصفحة الأخيرة"
        >
          الأخيرة
        </button>
      </div>
    );
  };

  const openStep1Modal = () => {
    setIsStep1ModalOpen(true);
    setFormData({
      Name: "",
      InternalmusanedContract: "",
      id: "",
      SponsorIdnumber: "",
      SponsorPhoneNumber: "",
      PassportNumber: "",
      KingdomentryDate: "",
      DayDate: "",
      profileStatus: "",
      KingdomentryTime: "",
      deparatureTime: "",
      visaNumber: "",
      finalDestinationTime: "",
      ExternalStatusByoffice: "",
      deparatureDate: "",
      finalDestinationDate: "",
      DeliveryDate: "",
      office: "",
      Orderid: "",
      WorkDuration: "",
      Cost: "",
      nationalidNumber: "",
      externalOfficeFile: null,
      finaldestination: "",
      externalOfficeStatus: "",
      HomemaIdnumber: "",
      HomemaidName: "",
      Notes: "",
      externalmusanadcontractfile: null,
      medicalCheckFile: null,
      ticketFile: null,
      receivingFile: null,
      approvalPayment: null,
      additionalfiles: [],
      externalmusanedContract: "",
      ArrivalCity: "",
      DeliveryFile: null,
      DateOfApplication: "",
      MusanadDuration: "",
      ExternalDateLinking: "",
      ExternalOFficeApproval: "",
      AgencyDate: "",
      EmbassySealing: "",
      BookinDate: "",
      GuaranteeDurationEnd: "",
      Nationality: "",
      GuaranteeStatus: "",
      reason: "",
      ArrivalDate: "",
    });
  };

  const closeStep1Modal = () => setIsStep1ModalOpen(false);
  const openStep2Modal = () => {
    closeStep1Modal();
    setIsStep2ModalOpen(true);
  };
  const closeStep2Modal = () => setIsStep2ModalOpen(false);

  const handleStep1Submit = (e: any) => {
    e.preventDefault();
    openStep2Modal();
  };

  const handleStep2Submit = async (e: any) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      const value = (formData as any)[key];
      if (key === "additionalfiles") {
        if (Array.isArray(value)) {
          value.forEach((file, index) => {
            data.append(`additionalfiles[${index}]`, file);
          });
        }
      } else if (value instanceof File) {
        data.append(key, value);
      } else {
        data.append(key, String(value));
      }
    });

    try {
      const response = await fetch("/api/updatehomemaidarrivalprisma", {
        method: "POST",
        body: data,
      });

      if (response.ok) {
        alert("تم تسجيل المغادرة بنجاح");
        closeStep2Modal();
        fetchData(currentPage); // إعادة تحميل البيانات
      } else {
        alert("حدث خطأ أثناء تسجيل المغادرة");
      }
    } catch (error) {
      console.error("Error submitting departure:", error);
      alert("حدث خطأ أثناء تسجيل المغادرة");
    }
  };

  const handleFormChange = (e: any) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleMultipleFilesChange = (e: any) => {
    const { name, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: Array.from(files),
    }));
  };

  // Grid Card Component
  const GridCard = ({ item }: { item: any }) => {
    // Extract picture URL
    const pictureUrl = item.Picture || (typeof item.Picture === 'object' && item.Picture?.url) || null;
    
    return (
      <div 
        className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 p-5 border-2 border-gray-200 cursor-pointer h-full flex flex-col"
        onClick={() => router.push("/admin/homemaidinfo?id=" + item.id)}
      >
        {/* Profile Picture */}
        <div className="flex justify-center mb-4">
          {pictureUrl ? (
            <img 
              src={pictureUrl} 
              alt={item.Name || 'صورة العاملة'}
              className="w-32 h-32 rounded-full object-cover border-4 border-teal-300 shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/img.jpeg';
              }}
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-teal-300 flex items-center justify-center shadow-lg">
              <span className="text-gray-400 text-5xl">👤</span>
            </div>
          )}
        </div>
        
        <div className="text-center mb-3">
          <h3 className="text-lg font-bold text-teal-800 mb-1">{item.Name || 'غير محدد'}</h3>
          <p className="text-sm text-gray-600 mb-2">#{item.id}</p>
          {item.isApproved ? (
            <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">✓ معتمدة</span>
          ) : (
            <span className="inline-block bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">✗ غير معتمدة</span>
          )}
        </div>
        
        <div className="space-y-2 text-sm flex-grow">
          {visibleColumns.includes('phone') && item.phone && (
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="text-gray-600 font-medium">📱 رقم الجوال:</span>
              <span className="text-gray-800 font-semibold" dir="ltr">{item.phone}</span>
            </div>
          )}
          
          {visibleColumns.includes('Country') && item?.office?.Country && (
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="text-gray-600 font-medium">🌍 الجنسية:</span>
              <span className="text-gray-800 font-semibold">{item.office.Country}</span>
            </div>
          )}
          
          {visibleColumns.includes('maritalstatus') && item.maritalstatus && (
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="text-gray-600 font-medium">💍 الحالة:</span>
              <span className="text-gray-800 font-semibold">{formatMaritalStatus(item.maritalstatus)}</span>
            </div>
          )}
          
          {visibleColumns.includes('dateofbirth') && item.dateofbirth && (
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded" title={`تاريخ الميلاد: ${formatBirthDate(item.dateofbirth)}`}>
              <span className="text-gray-600 font-medium">🎂 العمر:</span>
              <span className="text-gray-800 font-semibold">
                {calculateAge(item.dateofbirth)} سنة
              </span>
            </div>
          )}
          
          {visibleColumns.includes('Passportnumber') && item.Passportnumber && (
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded" title={item.Passportnumber}>
              <span className="text-gray-600 font-medium">📄 الجواز:</span>
              <span className="text-gray-800 font-semibold truncate max-w-[120px]">{item.Passportnumber}</span>
            </div>
          )}
          
          {visibleColumns.includes('PassportStart') && item.PassportStart && (
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="text-gray-600 font-medium">📅 بداية الجواز:</span>
              <span className="text-gray-800 font-semibold">{getDate(item.PassportStart)}</span>
            </div>
          )}
          
          {visibleColumns.includes('PassportEnd') && item.PassportEnd && (
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="text-gray-600 font-medium">📅 نهاية الجواز:</span>
              <span className="text-gray-800 font-semibold">{getDate(item.PassportEnd)}</span>
            </div>
          )}
          
          {visibleColumns.includes('office') && item?.office?.office && (
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded" title={item.office.office}>
              <span className="text-gray-600 font-medium">🏢 المكتب:</span>
              <span className="text-gray-800 font-semibold truncate max-w-[120px]">{item.office.office}</span>
            </div>
          )}
          
          {visibleColumns.includes('isReserved') && (
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="text-gray-600 font-medium">حالة الحجز:</span>
              <span className={`text-sm font-semibold px-2 py-1 rounded-full ${item.isReserved ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                {item.isReserved ? 'عاملة محجوزة' : 'عاملة متاحة'}
              </span>
            </div>
          )}
          
          {visibleColumns.includes('displayOrder') && (
            <div className="flex items-center justify-between pt-2 border-t-2 border-gray-300 mt-2">
              <span className="text-gray-600 font-medium">ترتيب العرض:</span>
              <input
                type="number"
                min="0"
                defaultValue={item.displayOrder || 0}
                onClick={(e) => e.stopPropagation()}
                onBlur={(e) => {
                  const newValue = e.target.value;
                  if (newValue !== String(item.displayOrder || 0)) {
                    handleDisplayOrderChange(item.id, newValue);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="w-20 px-2 py-1 text-center border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                title="اضغط Enter لحفظ التغييرات"
              />
            </div>
          )}
        </div>
        
        {hasDeletePermission && (
          <div className="mt-4 pt-3 border-t-2 border-gray-300 flex justify-center">
            <button 
              className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-colors font-medium"
              onClick={(e) => {
                e.stopPropagation();
                openDeleteModal(item.id);
              }}
              title="حذف"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // Sortable Row Component
  const SortableRow = ({ item }: { item: any }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <tr
        ref={setNodeRef}
        style={style}
        className={`border-b hover:bg-gray-50 ${isDragging ? 'bg-gray-100' : ''}`}
      >
        {/* <td className="px-4 py-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
              title="اسحب لإعادة الترتيب"
            >
              <FaGripVertical />
            </button>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleMoveUp(item.id)}
                className="text-teal-800 hover:text-teal-900 disabled:opacity-30"
                disabled={data.indexOf(item) === 0}
                title="تحريك للأعلى"
              >
                <FaArrowUp size={12} />
              </button>
              <button
                onClick={() => handleMoveDown(item.id)}
                className="text-teal-800 hover:text-teal-900 disabled:opacity-30"
                disabled={data.indexOf(item) === data.length - 1}
                title="تحريك للأسفل"
              >
                <FaArrowDown size={12} />
              </button>
            </div>
          </div>
        </td> */}
        {visibleColumns.includes('id') && (
          <td
            onClick={() => router.push("/admin/homemaidinfo?id=" + item.id)}
            className="px-1 py-2 text-lg text-center text-teal-800 cursor-pointer hover:underline"
          >
            {item.id}
          </td>
        )}
        {visibleColumns.includes('Name') && (
          <td className="px-1 py-2 text-center text-gray-600 whitespace-nowrap">
            {item.Name}
          </td>
        )}
        {visibleColumns.includes('phone') && (
          <td className="px-1 py-2 text-center text-gray-600" dir="ltr">
            {item.phone}
          </td>
        )}
        {visibleColumns.includes('Country') && (
          <td className="px-1 py-2 text-center text-gray-600">
            {item?.office?.Country}
          </td>
        )}
        {visibleColumns.includes('maritalstatus') && (
          <td className="px-1 py-2 text-center text-gray-600">
            {formatMaritalStatus(item.maritalstatus)}
          </td>
        )}
        {visibleColumns.includes('dateofbirth') && (
          <td 
            className="px-1 py-2 text-center text-gray-600 cursor-help" 
            title={`تاريخ الميلاد: ${formatBirthDate(item.dateofbirth)}`}
          >
            {calculateAge(item.dateofbirth)} سنة
          </td>
        )}
        {visibleColumns.includes('Passportnumber') && (
          <td className="px-1 py-2 text-center text-gray-600">
            {item.Passportnumber}
          </td>
        )}
        {visibleColumns.includes('PassportStart') && (
          <td className="px-1 py-2 text-center text-gray-600">
            {item.PassportStart ? getDate(item.PassportStart) : ""}
          </td>
        )}
        {visibleColumns.includes('PassportEnd') && (
          <td className="px-1 py-2 text-center text-gray-600">
            {item.PassportEnd ? getDate(item.PassportEnd) : ""}
          </td>
        )}
        {visibleColumns.includes('office') && (
          <td className="px-1 py-2 text-center text-gray-600">
            {item?.office?.office}
          </td>
        )}
        
        {visibleColumns.includes('isReserved') && (
          <td className="px-1 py-2 text-center">
            {item.isReserved ? (
              <span className="text-orange-600 font-semibold" title="عاملة محجوزة (طلب تحت الإجراء أو استلام)">محجوزة</span>
            ) : (
              <span className="text-green-600 font-semibold" title="عاملة متاحة (لا يوجد طلبات نشطة)">متاحة</span>
            )}
          </td>
        )}
        
        {/* {visibleColumns.includes('isApproved') && ( */}
          <td className="px-1 py-2 text-center">
            {item.isApproved ? (
              <span className="text-green-600 font-semibold">تم الاعتماد</span>
            ) : (
              <span className="text-red-600 font-semibold">لم يتم الاعتماد</span>
            )}
          </td>
        {/* // )} */}
        {visibleColumns.includes('displayOrder') && (
          <td className="px-1 py-2 text-center">
            <input
              type="number"
              min="0"
              defaultValue={item.displayOrder || 0}
              onBlur={(e) => {
                const newValue = e.target.value;
                if (newValue !== String(item.displayOrder || 0)) {
                  handleDisplayOrderChange(item.id, newValue);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
              title="اضغط Enter لحفظ التغييرات"
            />
          </td>
        )}
        {hasDeletePermission && visibleColumns.includes('actions') && (
          <td className="px-1 py-2 text-center">
            <button 
              className="bg-transparent border border-red-500 text-red-500 rounded p-1 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                openDeleteModal(item.id);
              }}
              title="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </td>
        )}
      </tr>
    );
  };

  // Column Selector Component
  const ColumnSelector = ({
    visibleColumns,
    setVisibleColumns,
  }: {
    visibleColumns: string[];
    setVisibleColumns: (columns: string[]) => void;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const columns = [
      { key: 'id', label: 'الرقم' },
      { key: 'Name', label: 'الاسم' },
      { key: 'phone', label: 'رقم الجوال' },
      { key: 'Country', label: 'الجنسية' },
      { key: 'maritalstatus', label: 'الحالة الاجتماعية' },
      { key: 'dateofbirth', label: 'العمر' },
      { key: 'Passportnumber', label: 'رقم جواز السفر' },
      { key: 'PassportStart', label: 'بداية الجواز' },
      { key: 'PassportEnd', label: 'نهاية الجواز' },
      { key: 'office', label: 'المكتب' },
      { key: 'isReserved', label: 'حالة الحجز' },
      { key: 'displayOrder', label: 'ترتيب العرض' },
      ...(hasDeletePermission ? [{ key: 'actions', label: 'حذف' }] : []),
    ];

    const toggleColumn = (columnKey: string) => {
      if (visibleColumns.includes(columnKey)) {
        setVisibleColumns(visibleColumns.filter((col) => col !== columnKey));
      } else {
        setVisibleColumns([...visibleColumns, columnKey]);
      }
    };

    return (
      <div className="relative">
        <button
          className="bg-gray-400 px-3 cursor-pointer py-2 h-10 items-center align-baseline text-white rounded-md flex items-center gap-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          اختر الأعمدة
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
            {columns.map((column) => (
              <label key={column.key} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(column.key)}
                  onChange={() => toggleColumn(column.key)}
                  className="form-checkbox h-4 w-4 text-teal-900"
                />
                {column.label}
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };
const [userName, setUserName] = useState('');
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    const decoded: any = jwtDecode(token);
    const userName = decoded.username;
    setUserName(userName);
  }
}, []);

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = data.findIndex((item) => item.id === active.id);
      const newIndex = data.findIndex((item) => item.id === over.id);

      const newData = arrayMove(data, oldIndex, newIndex);
      setData(newData);

      // Update display order in backend
      try {
        await updateDisplayOrder(active.id as number, newIndex);
      } catch (error) {
        console.error('Error updating display order:', error);
        // Revert on error
        fetchData(currentPage);
      }
    }
  };

  // Handle move up
  const handleMoveUp = async (id: number) => {
    const index = data.findIndex((item) => item.id === id);
    if (index > 0) {
      const newData = arrayMove(data, index, index - 1);
      setData(newData);
      
      try {
        await updateDisplayOrder(id, index - 1);
      } catch (error) {
        console.error('Error updating display order:', error);
        fetchData(currentPage);
      }
    }
  };

  // Handle move down
  const handleMoveDown = async (id: number) => {
    const index = data.findIndex((item) => item.id === id);
    if (index < data.length - 1) {
      const newData = arrayMove(data, index, index + 1);
      setData(newData);
      
      try {
        await updateDisplayOrder(id, index + 1);
      } catch (error) {
        console.error('Error updating display order:', error);
        fetchData(currentPage);
      }
    }
  };

  // Update display order API call
  const updateDisplayOrder = async (id: number, newOrder: number) => {
    const response = await fetch('/api/update-display-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, newOrder }),
    });

    if (!response.ok) {
      throw new Error('Failed to update display order');
    }
  };

  // Handle manual display order change
  const handleDisplayOrderChange = async (id: number, newOrder: string) => {
    const orderValue = parseInt(newOrder);
    if (isNaN(orderValue) || orderValue < 0) {
      alert('الرجاء إدخال رقم صحيح');
      return;
    }

    try {
      await updateDisplayOrder(id, orderValue);
      // Update local state
      setData(data.map(item => 
        item.id === id ? { ...item, displayOrder: orderValue } : item
      ));
      // Refresh data to get updated order
      fetchData(currentPage);
    } catch (error) {
      console.error('Error updating display order:', error);
      alert('حدث خطأ أثناء تحديث ترتيب العرض');
    }
  };

  // Handle hover for display order tooltip
  const handleDisplayOrderHoverEnter = () => {
    hoverTimerRef.current = setTimeout(() => {
      setShowDisplayOrderTooltip(true);
    }, 2000); 
  };

  const handleDisplayOrderHoverLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setShowDisplayOrderTooltip(false);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const openDeleteModal = (homemaidId: number) => {
    setHomemaidToDelete(homemaidId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteHomemaid = async () => {
    if (!homemaidToDelete) return;
    
    try {
      const response = await fetch(`/api/homemaidprisma/${homemaidToDelete}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotification({ message: 'تم حذف العاملة بنجاح', type: 'success' });
        fetchData(currentPage);
        setIsDeleteModalOpen(false);
        setHomemaidToDelete(null);
        setTimeout(() => setNotification(null), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في حذف العاملة');
      }
    } catch (error) {
      console.error('Error deleting homemaid:', error);
      setNotification({ message: error instanceof Error ? error.message : 'فشل في حذف العاملة', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };
const exportToPDF = async () => {
  //image logo
    const doc = new jsPDF({ orientation: 'landscape' }); // 🔄 جعلها عرضية لو تحب
    const pageWidth = doc.internal.pageSize.width;
  const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
  const logoBuffer = await logo.arrayBuffer();
  const logoBytes = new Uint8Array(logoBuffer);
  const logoBase64 = Buffer.from(logoBytes).toString('base64');
  // doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);
  try {
    setExportMessage('جاري تحميل جميع البيانات للتصدير...');
    setExportType('loading');
    setShowExportModal(true);

    const exportData = await fetchExportData();
    console.log('Export data for PDF:', exportData);

    // 🖋️ تحميل الخط العربي Amiri
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
      setExportMessage('خطأ في تحميل الخط العربي');
      setExportType('error');
      return;
    }

    // 🏷️ العنوان
    doc.setLanguage('ar');
    doc.setFontSize(16);
    doc.text('قائمة العاملات', 150, 20, { align: 'right' });

    // 📋 الأعمدة (معكوسة للاتجاه العربي)
    const tableColumn = [
      'الرقم',
      'الاسم',
      'رقم الجوال',
      'الجنسية',
      'الحالة الاجتماعية',
      'العمر',
      'رقم جواز السفر',
      'بداية الجواز',
      'نهاية الجواز',
      // 'المكتب',
      'حالة الحجز',
    ].reverse(); // ✅ عكس ترتيب الأعمدة
//hidden id column
    // 📊 الصفوف (معكوسة بنفس الترتيب)
    const tableRows = exportData.map(row =>
      [
        row.id || 'غير متوفر',
        row.Name || 'غير متوفر',
        row.phone || 'غير متوفر',
        row?.office?.Country || 'غير متوفر',
        formatMaritalStatus(row.maritalstatus),
        row.dateofbirth ? `${calculateAge(row.dateofbirth)} سنة` : 'غير متوفر',
        row.Passportnumber || 'غير متوفر',
        row.PassportStart ? getDate(row.PassportStart) : 'غير متوفر',
        row.PassportEnd ? getDate(row.PassportEnd) : 'غير متوفر',
        // row?.office?.office || 'غير متوفر',
        row.isReserved ? 'عاملة محجوزة' : 'عاملة متاحة',
      ].reverse() // ✅ عكس القيم داخل كل صف
    );

    // 📄 الجدول مع إعداد الاتجاه والفوتر
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      styles: {
        font: 'Amiri',
        halign: 'center',
        fontSize: 10,
        cellPadding: 2,
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [26, 77, 79],
        textColor: [255, 255, 255],
        halign: 'center',
        overflow:"hidden"
      },

      columnStyles: {
        0: { cellWidth: 'auto', overflow: 'hidden' },
        1: { cellWidth: 'auto', overflow: 'hidden ' },
        2: { cellWidth: 'auto', overflow: 'hidden' },
        3: { cellWidth: 'auto', overflow: 'hidden' },
        4: { cellWidth: 'auto', overflow: 'hidden' },
        5: { cellWidth: 'auto', overflow: 'hidden' },
        6: { cellWidth: 'auto', overflow: 'hidden' },
        7: { cellWidth: 'auto', overflow: 'hidden' },
        8: { cellWidth: 'auto', overflow: 'hidden' },
        9: { cellWidth: 'auto', overflow: 'hidden' },
        10: { cellWidth: 'auto', overflow: 'hidden' },
      },


      margin: { top: 45, right: 10, left: 10 },
      direction: 'rtl', // ✅ مهم جدًا لعرض الجدول من اليمين لليسار
      didParseCell: (data: any) => {
        data.cell.styles.halign = 'center';
      },

      // ⚙️ فوتر في كل صفحة
      didDrawPage: (data: any) => {
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        doc.setFontSize(10);
        doc.setFont('Amiri', 'normal');

        // 👈 اسم المستخدم في اليسار
        doc.text(userName, 10, pageHeight - 10, { align: 'left' });

        // 🔢 رقم الصفحة في المنتصف
        const pageNumber = `صفحة ${(doc as any).internal.getNumberOfPages()}`;
        doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });

 doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);


        // 👉 التاريخ والوقت في اليمين
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
    });

    // 💾 حفظ الملف
    doc.save('قائمة_العاملات.pdf');

    setExportMessage(`تم تصدير ${exportData.length} سجل بنجاح إلى PDF`);
    setExportType('success');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    setExportMessage('حدث خطأ أثناء تصدير PDF');
    setExportType('error');
  }
};

  const exportToExcel = async () => {
    try {
      setExportMessage('جاري تحميل جميع البيانات للتصدير...');
      setExportType('loading');
      setShowExportModal(true);
      
      const exportData = await fetchExportData();
      console.log('Export data for Excel:', exportData);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('قائمة العاملات', { properties: { defaultColWidth: 20 } });
      worksheet.columns = [
        { header: 'الرقم', key: 'id', width: 15 },
        { header: 'الاسم', key: 'name', width: 20 },
        { header: 'رقم الجوال', key: 'phone', width: 15 },
        { header: 'الجنسية', key: 'nationality', width: 15 },
        { header: 'الحالة الاجتماعية', key: 'maritalStatus', width: 20 },
        { header: 'العمر', key: 'age', width: 10 },
        { header: 'رقم جواز السفر', key: 'passport', width: 15 },
        { header: 'بداية الجواز', key: 'passportStart', width: 15 },
        { header: 'نهاية الجواز', key: 'passportEnd', width: 15 },
        { header: 'المكتب', key: 'office', width: 15 },
        { header: 'حالة الحجز', key: 'isReserved', width: 15 },
      ];
      worksheet.getRow(1).font = { name: 'Amiri', size: 12 };
      worksheet.getRow(1).alignment = { horizontal: 'right' };
      exportData.forEach(row => {
        worksheet.addRow({
          id: row.id || 'غير متوفر',
          name: row.Name || 'غير متوفر',
          phone: row.phone || 'غير متوفر',
          nationality: row?.office?.Country || 'غير متوفر',
          maritalStatus: formatMaritalStatus(row.maritalstatus),
          age: row.dateofbirth ? `${calculateAge(row.dateofbirth)} سنة` : 'غير متوفر',
          passport: row.Passportnumber || 'غير متوفر',
          passportStart: row.PassportStart ? getDate(row.PassportStart) : 'غير متوفر',
          passportEnd: row.PassportEnd ? getDate(row.PassportEnd) : 'غير متوفر',
          office: row?.office?.office || 'غير متوفر',
          isReserved: row.isReserved ? 'عاملة محجوزة' : 'عاملة متاحة',
        }).alignment = { horizontal: 'right' };
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'homemaids_list.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      setExportMessage(`تم تصدير ${exportData.length} سجل بنجاح إلى Excel`);
      setExportType('success');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      setExportMessage('حدث خطأ أثناء تصدير Excel');
      setExportType('error');
    }
  };

  // Modal styles with responsiveness and modern design
  const customModalStyles = {
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 1000,
      animation: "fadeIn 0.3s ease-in-out",
    },
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      transform: "translate(-50%, -50%)",
      width: "90%",
      maxWidth: "600px",
      maxHeight: "90vh",
      padding: "24px",
      borderRadius: "12px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
      backgroundColor: "#fff",
      overflowY: "auto",
      fontFamily: '"Almarai", sans-serif',
      animation: "slideIn 0.3s ease-in-out",
    },
  };

  return (
    <Layout>
      <div className={` mx-1 p-4 ${Style["almarai-regular"]}`}>
        {notification && (
          <div className={`fixed top-4 right-4 p-4 rounded-md text-white z-50 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {notification.message}
          </div>
        )}
        <div className="space-y-4">
          <div className="overflow-x-auto overflow-y-visible">
            <div className="flex items-center justify-between p-4 flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <h1
                  className={`text-2xl font-bold text-cool-gray-700 ${Style["almarai-bold"]}`}
                >
                  قائمة العاملات
                </h1>
                <div className="flex gap-10 mt-4 border-b border-gray-300 relative">
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      if (!switchingType && contractType !== 'recruitment') {
                        setContractType('recruitment');
                        setCurrentPage(1);
                      }
                    }}
                    className={`text-md text-gray-500 pb-4 relative flex items-center gap-2 cursor-pointer ${
                      contractType === 'recruitment' ? 'border-b-2 border-black font-bold' : ''
                    } ${switchingType ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    عاملات الاستقدام 
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold text-white bg-teal-600 rounded-full">
                      {recruitmentCount}
                    </span>
                  </a>
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      if (!switchingType && contractType !== 'rental') {
                        setContractType('rental');
                        setCurrentPage(1);
                      }
                    }}
                    className={`text-md text-gray-500 pb-4 relative flex items-center gap-2 cursor-pointer ${
                      contractType === 'rental' ? 'border-b-2 border-black font-bold' : ''
                    } ${switchingType ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    عاملات التأجير 
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold text-white bg-teal-600 rounded-full">
                      {rentalCount}
                    </span>
                  </a>
                  {/* {switchingType && (
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-teal-800"></div>
                    </div>
                  )} */}
                </div>
              </div>
              <button
                onClick={()=>router.push(contractType === 'recruitment' ? "/admin/newhomemaids" : "/admin/newhomemaidsrental")}
                className="bg-teal-900 py-1 flex flex-row justify-around gap-1 px-2 rounded-md"
              >
                <PlusOutlined className="text-white" size={12} />
                <span className="text-white">اضافة عاملة</span>
              </button>
            </div>

            <div className="flex flex-col p-4">
              <div className="flex flex-row flex-nowrap items-center gap-3">
                <div className="relative max-w-md">
                  <input
                    type="text"
                    value={filters.Name}
                    onChange={(e) => handleFilterChange(e, "Name")}
                    placeholder="بحث بالاسم أو رقم الجواز..."
                    className="p-2 pl-10 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <div className="relative w-[280px] max-w-md">
                  <input
                    type="text"
                    value={filters.PassportNumber}
                    onChange={(e) => handleFilterChange(e, "PassportNumber")}
                    placeholder="بحث برقم الجواز"
                    className="p-2 pl-10 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <ColumnSelector visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns} />
                <button
                  onClick={resetFilters}
                  className="bg-teal-800 py-2 px-4 rounded-lg flex items-center gap-1 hover:bg-teal-900 shrink-0"
                >
                  <FaRedo className="text-white" />
                  <span className={`text-white ${Style["almarai-bold"]}`}>
                    إعادة ضبط
                  </span>
                </button>
              </div>
              <div className="flex flex-row gap-2 justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`my-2 py-1 px-3 rounded-lg flex items-center gap-1 transition-colors ${
                      viewMode === 'table' 
                        ? 'bg-teal-800 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    title="عرض الجدول"
                  >
                    <FaThList className="text-current" />
                    <span>جدول</span>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`my-2 py-1 px-3 rounded-lg flex items-center gap-1 transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-teal-800 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    title="عرض الشبكة"
                  >
                    <FaTh className="text-current" />
                    <span>شبكة</span>
                  </button>
                </div>
                <div className="flex flex-row gap-2">
                  <button
                    onClick={exportToExcel}
                    className="bg-teal-800 my-2 py-1 px-3 rounded-lg flex items-center gap-1 hover:bg-teal-900"
                    title="تصدير إلى Excel"
                  >
                    <FaFileExcel className="text-white" />
                    <span className="text-white">Excel</span>
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="bg-teal-800 my-2 py-1 px-3 rounded-lg flex items-center gap-1 hover:bg-teal-900"
                    title="تصدير إلى PDF"
                  >
                    <FaFilePdf className="text-white" />
                    <span className="text-white">PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            > */}
              <div className="relative">
                {(switchingType || loading) && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-teal-800"></div>
                      <p className="text-teal-800 font-semibold">جاري تحميل البيانات...</p>
                    </div>
                  </div>
                )}
              
              {viewMode === 'table' ? (
              <table className="min-w-full text-md text-left min-h-96">
                <thead className="bg-teal-800 overflow-visible">
                  <tr className="text-white">
                    {/* <th className="px-4 py-2 text-center whitespace-nowrap">الترتيب</th> */}
                    {visibleColumns.includes('id') && renderFilterableHeader('id', null, 'الرقم')}
                    {visibleColumns.includes('Name') && renderFilterableHeader('Name', null, 'الاسم')}
                    {visibleColumns.includes('phone') && renderFilterableHeader('phone', null, 'رقم الجوال')}
                    {visibleColumns.includes('Country') && renderFilterableHeader('Country', 'Country', 'الجنسية')}
                    {visibleColumns.includes('maritalstatus') && renderFilterableHeader('maritalstatus', null, 'الحالة الاجتماعية')}
                    {visibleColumns.includes('dateofbirth') && renderFilterableHeader('dateofbirth', 'age', 'العمر')}
                    {visibleColumns.includes('Passportnumber') && renderFilterableHeader('Passportnumber', null, 'رقم جواز السفر')}
                    {visibleColumns.includes('PassportStart') && renderFilterableHeader('PassportStart', null, 'بداية الجواز')}
                    {visibleColumns.includes('PassportEnd') && renderFilterableHeader('PassportEnd', null, 'نهاية الجواز')}
                    {visibleColumns.includes('office') && renderFilterableHeader('office', null, 'المكتب')}
                    
                    {visibleColumns.includes('isReserved') && (
                      <th 
                        className="px-2 py-3 text-center select-none whitespace-nowrap group transition-colors align-top min-w-[120px]"
                      >
                        <div className="flex flex-col items-center justify-start gap-1">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-semibold cursor-default transition-colors group-hover:text-teal-200">
                              حالة الحجز
                            </span>
                            <button
                               onClick={(e) => { e.stopPropagation(); setIsReservedFilterModalOpen(true); }}
                               className={`p-1.5 rounded-full hover:bg-teal-600 transition-all focus:outline-none ${isReservedFilter !== 'all' ? 'text-teal-100 bg-teal-600' : 'text-teal-400/50 hover:text-teal-200'}`}
                               title="فلترة حالة الحجز"
                            >
                              <FaFilter size={12} />
                            </button>
                          </div>
                          {isReservedFilter !== 'all' && (
                            <div className="flex items-center justify-between gap-1.5 bg-teal-900/40 px-2 py-0.5 rounded-full text-teal-50 max-w-[120px] mt-1 border border-teal-600/30 w-full shadow-inner">
                              <span className="text-xs truncate font-medium flex-1 text-center">
                                {isReservedFilter === 'reserved' ? 'محجوز' : 'متاح'}
                              </span>
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setIsReservedFilter('all'); 
                                  setCurrentPage(1);
                                }} 
                                className="text-teal-200 hover:text-white hover:bg-red-500 rounded-full w-4 h-4 flex items-center justify-center shrink-0 transition-colors"
                                title="مسح الفلتر"
                              >
                                &times;
                              </button>
                            </div>
                          )}
                        </div>
                      </th>
                    )}
                    {/* {visibleColumns.includes('isApproved') && ( */}
                      <th 
                        className="px-2 py-3 text-center select-none whitespace-nowrap group transition-colors align-top min-w-[120px]"
                      >
                        <div className="flex flex-col items-center justify-start gap-1">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="cursor-pointer font-semibold flex items-center gap-1 transition-colors hover:text-teal-200" onClick={() => handleSort('isApproved')}>
                              الاعتماد <SortIcon field="isApproved" />
                            </span>
                            <button
                               onClick={(e) => { e.stopPropagation(); setIsApprovedFilterModalOpen(true); }}
                               className={`p-1.5 rounded-full hover:bg-teal-600 transition-all focus:outline-none ${isApprovedFilter !== 'all' ? 'text-teal-100 bg-teal-600' : 'text-teal-400/50 hover:text-teal-200'}`}
                               title="فلترة الاعتماد"
                            >
                              <FaFilter size={12} />
                            </button>
                          </div>
                          {isApprovedFilter !== 'all' && (
                            <div className="flex items-center justify-between gap-1.5 bg-teal-900/40 px-2 py-0.5 rounded-full text-teal-50 max-w-[120px] mt-1 border border-teal-600/30 w-full shadow-inner">
                              <span className="text-xs truncate font-medium flex-1 text-center">
                                {isApprovedFilter === 'approved' ? 'معتمد' : 'غير معتمد'}
                              </span>
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setIsApprovedFilter('all'); 
                                  setCurrentPage(1);
                                }} 
                                className="text-teal-200 hover:text-white hover:bg-red-500 rounded-full w-4 h-4 flex items-center justify-center shrink-0 transition-colors"
                                title="مسح الفلتر"
                              >
                                &times;
                              </button>
                            </div>
                          )}
                        </div>
                      </th>
                    {/* )} */}
                    {visibleColumns.includes('displayOrder') && (
                      <th 
                        className="px-2 py-3 text-center cursor-pointer select-none whitespace-nowrap relative min-w-[120px] align-top text-white transition-colors hover:text-teal-200 tracking-wide"
                        onClick={() => handleSort('displayOrder')}
                        onMouseEnter={handleDisplayOrderHoverEnter}
                        onMouseLeave={handleDisplayOrderHoverLeave}
                      >
                        <div className="flex flex-col items-center justify-start gap-1">
                          <span className="font-semibold flex items-center gap-1">
                            ترتيب العرض <SortIcon field="displayOrder" />
                          </span>
                        </div>
                        {showDisplayOrderTooltip && (
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-72 bg-gray-900 text-white text-sm rounded-lg p-4 shadow-xl pointer-events-none z-50">
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full">
                              <div className="border-4 border-transparent border-b-gray-900"></div>
                            </div>
                            <p className="text-right leading-relaxed mb-2">
                              <strong className="text-teal-300">ترتيب العرض:</strong>
                            </p>
                            <p className="text-right leading-relaxed text-gray-100">
                              يحدد الترتيب الذي تظهر به العاملة في القائمة. يمكنك تعديل الرقم مباشرة في الحقل. كلما كان الرقم أصغر، كلما ظهرت العاملة في أعلى القائمة.
                            </p>
                          </div>
                        )}
                      </th>
                    )}
                    {hasDeletePermission && visibleColumns.includes('actions') && (
                      <th className="px-2 py-3 text-center whitespace-nowrap align-top font-semibold">حذف</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-gray-50">
                  {data.length === 0 ? (
                    <tr>
                      <td
                        colSpan={visibleColumns.length + 1}
                        className="px-1 py-2 text-center text-gray-500"
                      >
                        لا توجد نتائج
                      </td>
                    </tr>
                  ) : (
                    <SortableContext
                      items={data.map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {data.map((item) => (
                        <SortableRow key={item.id} item={item} />
                      ))}
                    </SortableContext>
                  )}
                </tbody>
              </table>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-h-96">
                  {data.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500 py-8">
                      لا توجد نتائج
                    </div>
                  ) : (
                    data.map((item) => (
                      <GridCard key={item.id} item={item} />
                    ))
                  )}
                </div>
              )}
              </div>
            {/* </DndContext> */}

            {totalPages > 1 && renderPagination()}
          </div>
        </div>

    

        {/* Export Modal */}
        <Modal
          isOpen={showExportModal}
          onRequestClose={() => setShowExportModal(false)}
          style={customModalStyles}
          contentLabel="حالة التصدير"
          shouldFocusAfterRender={true}
          shouldCloseOnOverlayClick={false}
        >
          <div className="relative text-center">
            <button
              onClick={() => setShowExportModal(false)}
              className="absolute top-0 right-0 text-gray-500 hover:text-gray-700"
              aria-label="إغلاق"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {exportType === 'loading' && (
              <div className="py-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-800 mx-auto mb-4"></div>
                <h2 className={`text-xl font-bold text-teal-800 mb-2 ${Style["almarai-bold"]}`}>
                  جاري التصدير...
                </h2>
                <p className={`text-gray-600 ${Style["almarai-regular"]}`}>
                  {exportMessage}
                </p>
              </div>
            )}

            {exportType === 'success' && (
              <div className="py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h2 className={`text-xl font-bold text-green-800 mb-2 ${Style["almarai-bold"]}`}>
                  تم التصدير بنجاح!
                </h2>
                <p className={`text-gray-600 mb-6 ${Style["almarai-regular"]}`}>
                  {exportMessage}
                </p>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="bg-teal-800 text-white px-6 py-2 rounded-lg hover:bg-teal-900 transition-colors"
                >
                  موافق
                </button>
              </div>
            )}

            {exportType === 'error' && (
              <div className="py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
                <h2 className={`text-xl font-bold text-red-800 mb-2 ${Style["almarai-bold"]}`}>
                  حدث خطأ!
                </h2>
                <p className={`text-gray-600 mb-6 ${Style["almarai-regular"]}`}>
                  {exportMessage}
                </p>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  موافق
                </button>
              </div>
            )}
          </div>
        </Modal>

        {/* Dynamic Column Filter Modal */}
        <Modal
          isOpen={activeFilterColumn !== null}
          onRequestClose={() => setActiveFilterColumn(null)}
          style={customModalStyles}
          contentLabel="فلترة العمود"
          shouldFocusAfterRender={true}
        >
          {activeFilterColumn && (
            <div className="relative">
              <h2 className={`text-xl font-bold text-teal-800 mb-4 ${Style["almarai-bold"]}`}>
                البحث في: {getColumnLabel(activeFilterColumn)}
              </h2>
              <div className="space-y-4">
                {activeFilterColumn === 'Country' ? (
                  <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                      tempFilterValue === '' ? 'bg-teal-50 border-2 border-teal-500' : 'border-2 border-slate-100'
                    }`}>
                      <input
                        type="radio"
                        name="countryFilter"
                        value=""
                        checked={tempFilterValue === ''}
                        onChange={(e) => setTempFilterValue(e.target.value)}
                        className="w-4 h-4 text-teal-800"
                      />
                      <span className="text-gray-800 font-medium">الكل - عرض جميع الجنسيات</span>
                    </label>
                    {uniqueCountries.map((country: string) => (
                      <label key={country} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                        tempFilterValue === country ? 'bg-teal-50 border-2 border-teal-500' : 'border-2 border-slate-100'
                      }`}>
                        <input
                          type="radio"
                          name="countryFilter"
                          value={country}
                          checked={tempFilterValue === country}
                          onChange={(e) => setTempFilterValue(e.target.value)}
                          className="w-4 h-4 text-teal-800"
                        />
                        <span className="text-gray-800 font-medium">{country}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type={activeFilterColumn === 'age' ? 'number' : 'text'}
                    value={tempFilterValue}
                    onChange={(e) => setTempFilterValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        applyColumnFilter();
                      }
                    }}
                    autoFocus
                    placeholder={`أدخل ${getColumnLabel(activeFilterColumn)} للبحث...`}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                  />
                )}
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={applyColumnFilter}
                    className="flex-1 bg-teal-800 text-white py-2.5 px-4 rounded-lg hover:bg-teal-900 transition-colors font-medium flex justify-center items-center gap-2"
                  >
                    <FaSearch className="w-4 h-4" />
                    تطبيق الفلتر
                  </button>
                  <button
                    onClick={() => setActiveFilterColumn(null)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* حالة الحجز Filter Modal */}
        <Modal
          isOpen={isReservedFilterModalOpen}
          onRequestClose={() => setIsReservedFilterModalOpen(false)}
          style={customModalStyles}
          contentLabel="فلترة حسب حالة الحجز"
          shouldFocusAfterRender={true}
        >
          <div className="relative">
            <h2 className={`text-xl font-bold text-teal-800 mb-4 ${Style["almarai-bold"]}`}>
              فلترة حسب حالة الحجز
            </h2>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                isReservedFilter === 'all' ? 'bg-teal-50 border-2 border-teal-500' : 'border-2 border-transparent'
              }`}>
                <input
                  type="radio"
                  name="isReservedFilter"
                  value="all"
                  checked={isReservedFilter === 'all'}
                  onChange={() => {
                    setIsReservedFilter('all');
                    setCurrentPage(1);
                    setIsReservedFilterModalOpen(false);
                  }}
                  className="w-4 h-4 text-teal-800"
                />
                <span className="text-gray-800 font-medium">الكل - عرض الجميع</span>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                isReservedFilter === 'reserved' ? 'bg-orange-50 border-2 border-orange-500' : 'border-2 border-transparent'
              }`}>
                <input
                  type="radio"
                  name="isReservedFilter"
                  value="reserved"
                  checked={isReservedFilter === 'reserved'}
                  onChange={() => {
                    setIsReservedFilter('reserved');
                    setCurrentPage(1);
                    setIsReservedFilterModalOpen(false);
                  }}
                  className="w-4 h-4 text-orange-600"
                />
                <span className="text-orange-700 font-medium">محجوز - عاملات محجوزات</span>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                isReservedFilter === 'available' ? 'bg-green-50 border-2 border-green-500' : 'border-2 border-transparent'
              }`}>
                <input
                  type="radio"
                  name="isReservedFilter"
                  value="available"
                  checked={isReservedFilter === 'available'}
                  onChange={() => {
                    setIsReservedFilter('available');
                    setCurrentPage(1);
                    setIsReservedFilterModalOpen(false);
                  }}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-green-700 font-medium">متاحة - عاملات متاحات</span>
              </label>
            </div>
            <button
              onClick={() => setIsReservedFilterModalOpen(false)}
              className="mt-4 w-full bg-teal-800 text-white py-2 px-4 rounded-lg hover:bg-teal-900 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </Modal>

        {/* حالة الاعتماد Filter Modal */}
        <Modal
          isOpen={isApprovedFilterModalOpen}
          onRequestClose={() => setIsApprovedFilterModalOpen(false)}
          style={customModalStyles}
          contentLabel="فلترة حسب حالة الاعتماد"
          shouldFocusAfterRender={true}
        >
          <div className="relative">
            <h2 className={`text-xl font-bold text-teal-800 mb-4 ${Style["almarai-bold"]}`}>
              فلترة حسب حالة الاعتماد
            </h2>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                isApprovedFilter === 'all' ? 'bg-teal-50 border-2 border-teal-500' : 'border-2 border-transparent'
              }`}>
                <input
                  type="radio"
                  name="isApprovedFilter"
                  value="all"
                  checked={isApprovedFilter === 'all'}
                  onChange={() => {
                    setIsApprovedFilter('all');
                    setCurrentPage(1);
                    setIsApprovedFilterModalOpen(false);
                  }}
                  className="w-4 h-4 text-teal-800"
                />
                <span className="text-gray-800 font-medium">الكل - عرض الجميع</span>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                isApprovedFilter === 'approved' ? 'bg-green-50 border-2 border-green-500' : 'border-2 border-transparent'
              }`}>
                <input
                  type="radio"
                  name="isApprovedFilter"
                  value="approved"
                  checked={isApprovedFilter === 'approved'}
                  onChange={() => {
                    setIsApprovedFilter('approved');
                    setCurrentPage(1);
                    setIsApprovedFilterModalOpen(false);
                  }}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-green-700 font-medium">مُعتمد - تم اعتمادهم</span>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                isApprovedFilter === 'not_approved' ? 'bg-red-50 border-2 border-red-500' : 'border-2 border-transparent'
              }`}>
                <input
                  type="radio"
                  name="isApprovedFilter"
                  value="not_approved"
                  checked={isApprovedFilter === 'not_approved'}
                  onChange={() => {
                    setIsApprovedFilter('not_approved');
                    setCurrentPage(1);
                    setIsApprovedFilterModalOpen(false);
                  }}
                  className="w-4 h-4 text-red-600"
                />
                <span className="text-red-700 font-medium">غير معتمد - بانتظار الاعتماد</span>
              </label>
            </div>
            <button
              onClick={() => setIsApprovedFilterModalOpen(false)}
              className="mt-4 w-full bg-teal-800 text-white py-2 px-4 rounded-lg hover:bg-teal-900 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h2 className="text-xl font-semibold text-text-dark mb-4">تأكيد الحذف</h2>
              <p className="text-text-muted mb-6">هل أنت متأكد من حذف هذه العاملة؟ لا يمكن التراجع عن هذا الإجراء.</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setHomemaidToDelete(null);
                  }}
                  className="bg-gray-200 text-text-dark px-4 py-2 rounded-md text-md font-medium hover:bg-gray-300"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteHomemaid}
                  className="bg-red-500 text-white px-4 py-2 rounded-md text-md font-medium hover:bg-red-600"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req }: any) {
  const pageSize = 10;
  
  try {
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie: string) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    if (!cookies.authToken) {
      return {
        redirect: { destination: "/admin/login", permanent: false },
      };
    }

    const token = jwtDecode(cookies.authToken) as any;

    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });

    const hasDeletePermission = findUser && findUser.role?.permissions && 
      (findUser.role.permissions as any)["إدارة العاملات"]?.["حذف"];

    // Fetch initial recruitment homemaids (first page)
    const recruitmentHomemaids = await prisma.homemaid.findMany({
      where: {
        contractType: 'recruitment',
      },
      include: {
        office: {
          select: {
            office: true,
            Country: true,
          },
        },
      },
      orderBy: { displayOrder: "desc" },
      take: pageSize,
    });

    // Fetch initial rental homemaids (first page)
    const rentalHomemaids = await prisma.homemaid.findMany({
      where: {
        contractType: 'rental',
      },
      include: {
        office: {
          select: {
            office: true,
            Country: true,
          },
        },
      },
      orderBy: { displayOrder: "desc" },
      take: pageSize,
    });

    // Format the data
    const formatHomemaid = (homemaid: any) => {
      // Extract Picture URL from JSON field
      let pictureUrl = null;
      if (homemaid.Picture) {
        if (typeof homemaid.Picture === 'object' && homemaid.Picture !== null && 'url' in homemaid.Picture) {
          pictureUrl = (homemaid.Picture as any).url;
        } else if (typeof homemaid.Picture === 'string') {
          pictureUrl = homemaid.Picture;
        }
      }
      
      return {
        id: homemaid.id,
        Name: homemaid.Name || "",
        homemaidId: homemaid.id,
        phone: homemaid.phone || "",
        maritalstatus: homemaid.maritalstatus || "",
        dateofbirth: homemaid.dateofbirth ? homemaid.dateofbirth.toISOString() : null,
        Passportnumber: homemaid.Passportnumber || "",
        PassportStart: homemaid.PassportStart ? homemaid.PassportStart.toISOString() : null,
        PassportEnd: homemaid.PassportEnd ? homemaid.PassportEnd.toISOString() : null,
        displayOrder: homemaid.displayOrder || 0,
        isApproved: homemaid.isApproved || false,
        Picture: pictureUrl,
        office: homemaid.office
          ? {
              office: homemaid.office.office || "",
              Country: homemaid.office.Country || "",
            }
          : { office: "", Country: "" },
      };
    };

    const formattedRecruitmentData = recruitmentHomemaids.map(formatHomemaid);
    const formattedRentalData = rentalHomemaids.map(formatHomemaid);

    // Count total records by contract type
    const recruitmentCount = await prisma.homemaid.count({
      where: {
        contractType: 'recruitment',
      },
    });

    const rentalCount = await prisma.homemaid.count({
      where: {
        contractType: 'rental',
      },
    });

    // Initial totalCount and totalPages for default view (recruitment)
    const initialTotalCount = recruitmentCount;
    const initialTotalPages = Math.ceil(initialTotalCount / pageSize);

    // Fetch unique countries from offices
    const uniqueCountriesData = await prisma.offices.findMany({
      select: { Country: true },
      distinct: ['Country'],
      where: { AND: [{ Country: { not: null } }, { Country: { not: '' } }] }
    });
    const uniqueCountries = uniqueCountriesData.map(o => o.Country).filter(Boolean);

    return {
      props: { 
        hasDeletePermission: !!hasDeletePermission,
        initialCounts: {
          totalCount: initialTotalCount,
          totalPages: initialTotalPages,
          recruitment: recruitmentCount,
          rental: rentalCount,
        },
        recruitmentData: formattedRecruitmentData,
        rentalData: formattedRentalData,
        uniqueCountries: uniqueCountries,
      },
    };
  } catch (err) {
    console.error("Authorization error:", err);
    return {
      props: { 
        hasDeletePermission: false,
        initialCounts: {
          totalCount: 0,
          totalPages: 1,
          recruitment: 0,
          rental: 0,
        },
        recruitmentData: [],
        rentalData: [],
        uniqueCountries: [],
      },
    };
  }
}