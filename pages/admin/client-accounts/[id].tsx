import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from 'example/containers/Layout';
import { ArrowRightIcon, MoonIcon, SunIcon, OfficeBuildingIcon, DocumentTextIcon, PlusCircleIcon, SearchIcon, ViewGridIcon, DotsHorizontalIcon, ArrowUpIcon, ReceiptTaxIcon, CreditCardIcon, RefreshIcon, CalendarIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/outline';
import Style from "styles/Home.module.css";
import { jwtDecode } from 'jwt-decode';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { SettingFilled } from '@ant-design/icons';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ClientAccountEntry {
  isEditable: boolean;
  id: number;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  entryType: string;
}

interface ClientAccountStatement {
  id: number;
  contractNumber: string;
  officeName: string;
  totalRevenue: number;
  totalExpenses: number;
  netAmount: number;
  masandTransferAmount?: number;
  contractStatus: string;
  notes: string;
  createdAt: string;
  client: {
    id: number;
    fullname: string;
    phonenumber: string;
    nationalId: string;
    city: string;
    address: string;
    createdAt: string;
  };
  order?: {
    id: number;
    ClientName: string;
    PhoneNumber: string;
    createdAt: string;
    bookingstatus: string;
    profileStatus: string;
    typeOfContract: string;
    Total?: number | null;
    HomeMaid?: {
      id: number;
      Name: string;
      Nationality: any;
      Experience: string;
      officeName: string;
      office?: {
        id: number;
        office: string;
        Country: string;
        phoneNumber: string;
      };
    };
    arrivals?: {
      id: number;
      KingdomentryDate: string;
      GuaranteeDurationEnd: string;
    }[];
  };
  entries: ClientAccountEntry[];
  totals: {
    totalDebit: number;
    totalCredit: number;
    netAmount: number;
  };
}

// Sortable Row Component
const SortableRow = ({ entry, index, formatCurrency, getDate, openEditModal }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'move',
    zIndex: isDragging ? 9999 : 'auto',
    position: isDragging ? 'relative' as 'relative' : undefined, // Ensure proper positioning
    backgroundColor: isDragging ? '#f0f9ff' : undefined, // Light blue background when dragging
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
    >
        <td className="px-6 py-4 text-md font-medium">#{index + 1}</td>
        <td className="px-6 py-4 text-md">{getDate(entry.date)}</td>
        <td className="px-6 py-4 text-md">{entry.description}</td>
        <td className="px-6 py-4 text-md font-mono">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
        <td className="px-6 py-4 text-md font-mono">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
        <td className="px-6 py-4 text-md font-bold text-primary">{formatCurrency(entry.balance)}</td>
        <td className="px-6 py-4 text-md">
            
            {
              entry?.isEditable !== false ? (
                // Prevent drag on button click by stopping propagation on the button itself if needed, 
                // but since the whole row is draggable handle, we should probably make only a specific handle draggable OR
                // ensure button clicks work. With {...listeners} on TR, the whole row is a handle.
                // Usually button clicks still work unless we prevent default.
                <button 
                onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking button
                onClick={() => openEditModal(entry)}
                className="text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer"
            >
                <SettingFilled className="w-4 h-4 bg-transparent text-primary" />
                اجراءات
            </button>
                ) : 
                <button 
                disabled
                className="text-primary hover:underline font-medium flex items-center gap-1 opacity-50 cursor-not-allowed"
            >
                {/* <SettingFilled className="w-4 h-4 bg-transparent text-primary" /> */}
                {/* اجراءات */}
            </button>
            }
        </td>
    </tr>
  );
};

const ClientStatementPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [statement, setStatement] = useState<ClientAccountStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ClientAccountEntry | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
  };

  const closeMessage = () => {
    setMessage(null);
  };

  function getDate(date: any) {
    if (!date) return null;
    const currentDate = new Date(date);
    const formatted = currentDate.getDate() + '/' + (currentDate.getMonth() + 1) + '/' + currentDate.getFullYear();
    return formatted;
  }
  
  // Filter states
  const [selectedEntryType, setSelectedEntryType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for add/edit
  const [formData, setFormData] = useState({
    date: '',
    description: '',
    debit: '',
    credit: '',
    balance: '',
    entryType: ''
  });

  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchStatement = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(selectedEntryType !== 'all' && { entryType: selectedEntryType }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        ...(searchTerm && { search: searchTerm }),
      });
      const response = await fetch(`/api/client-accounts/${id}?${params}`);
      const data = await response.json();
      setStatement(data);
    } catch (error) {
      console.error('Error fetching client statement:', error);
      showMessage('error', 'فشل في جلب كشف الحساب');
    } finally {
      setLoading(false);
    }
  };
  
    const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts to prevent accidental drags on clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && statement) {
      setStatement((prev: any) => {
        const oldIndex = prev.entries.findIndex((item: any) => item.id === active.id);
        const newIndex = prev.entries.findIndex((item: any) => item.id === over?.id);
        
        const newEntries = arrayMove(prev.entries, oldIndex, newIndex);
        
        // Return new state with updated entries
        return {
          ...prev,
          entries: newEntries
        };
      });

      // We need to get the new order IDs to send to API
      // We can't rely on 'statement' state here because setState is async
      // So we calculate it again or use a functional update and side effect.
      // Better to calculate new order locally for API call.
       const oldIndex = statement.entries.findIndex((item) => item.id === active.id);
       const newIndex = statement.entries.findIndex((item) => item.id === over?.id);
       const newEntries = arrayMove(statement.entries, oldIndex, newIndex);
       const orderedIds = newEntries.map(e => e.id);

       try {
         await fetch('/api/client-accounts/reorder-entries', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ orderedIds }),
         });
         // showMessage('success', 'تم حفظ الترتيب'); // Optional: show message or just fail silently/log error
       } catch (error) {
         console.error('Failed to save order:', error);
         showMessage('error', 'فشل حفظ الترتيب');
       }
    }
  };

  useEffect(() => {
    if (id) {
      fetchStatement();
    }
  }, [id, selectedEntryType, fromDate, toDate]);

  useEffect(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    const timeout = setTimeout(() => {
      if (id) {
        fetchStatement();
      }
    }, 300);
    setDebounceTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    const user = localStorage.getItem('token');
    if (user) {
      const decoded: any = jwtDecode(user);
      setUserId(Number(decoded?.id));
    } else {
      setUserId(null);
    }
  }, []);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const debit = Number(formData.debit) || 0;
    const credit = Number(formData.credit) || 0;

    if (debit > 0 && credit > 0) {
      showMessage('error', 'لا يمكن إدخال مبلغ في المدين والدائن معاً. يرجى إدخال مبلغ في حقل واحد فقط.');
      return;
    }

    try {
      const response = await fetch('/api/client-accounts/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statementId: id,
          date: formData.date,
          userId: userId,
          description: formData.description,
          debit: Number(formData.debit) || 0,
          credit: Number(formData.credit) || 0,
          entryType: formData.entryType
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({
          date: '',
          description: '',
          debit: '',
          credit: '',
          balance: '',
          entryType: ''
        });
        fetchStatement();
        showMessage('success', 'تم إضافة السجل بنجاح');
      } else {
        const data = await response.json();
        showMessage('error', data.message || 'فشل في إضافة السجل');
      }
    } catch (error) {
      console.error('Error adding entry:', error);
      showMessage('error', 'حدث خطأ أثناء إضافة السجل');
    }
  };

  const handleEditEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    const debit = Number(formData.debit) || 0;
    const credit = Number(formData.credit) || 0;

    if (debit > 0 && credit > 0) {
      showMessage('error', 'لا يمكن إدخال مبلغ في المدين والدائن معاً. يرجى إدخال مبلغ في حقل واحد فقط.');
      return;
    }

    try {
      const response = await fetch(`/api/client-accounts/entries/${editingEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formData.date,
          description: formData.description,
          debit: Number(formData.debit) || 0,
          credit: Number(formData.credit) || 0,
          entryType: formData.entryType
        }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingEntry(null);
        setFormData({
          date: '',
          description: '',
          debit: '',
          credit: '',
          balance: '',
          entryType: ''
        });
        fetchStatement();
        showMessage('success', 'تم تعديل السجل بنجاح');
      } else {
        const data = await response.json();
        showMessage('error', data.message || 'فشل في تعديل السجل');
      }
    } catch (error) {
      console.error('Error editing entry:', error);
      showMessage('error', 'حدث خطأ أثناء تعديل السجل');
    }
  };

  const openEditModal = (entry: ClientAccountEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: new Date(entry.date).toISOString().split('T')[0],
      description: entry.description,
      debit: entry.debit.toString(),
      credit: entry.credit.toString(),
      balance: entry.balance.toString(),
      entryType: entry.entryType || ''
    });
    setShowEditModal(true);
  };

 const fieldNames: { [key: string]: string } = {
  'officeLinkInfo': 'الربط مع إدارة المكاتب',
   'travel_permit_issued':'تم إصدار تصريح السفر',

   'foreign_labor_approved':'تمت الموافقة من وزارة العمل الأجنبية',
    'externalOfficeInfo': 'المكتب الخارجي',
    'externalOfficeApproval': 'موافقة المكتب الخارجي',
    'medicalCheck': 'الفحص الطبي',
    'foreignLaborApproval': 'موافقة وزارة العمل الأجنبية',
    'agencyPayment': 'دفع الوكالة',
    'saudiEmbassyApproval': 'موافقة السفارة السعودية',
    'visaIssuance': 'إصدار التأشيرة',
    'travelPermit': 'تصريح السفر',
    'destinations': 'الوجهات',
    'receipt': 'الاستلام',
    'pending_external_office': 'في انتظار المكتب الخارجي',
    'ticketUpload': 'رفع المستندات'  };

  const translateContractStatus = (status: string) => {
    return fieldNames[status] || status;
  };

  const hasMoreThan3Decimals = (n: number) => {
    const rounded = Math.round(n * 1000) / 1000;
    return Math.abs(n - rounded) > 1e-10;
  };

  const formatCurrency = (amount: number) => {
    const rounded = Math.round(amount * 1000) / 1000;
    if (hasMoreThan3Decimals(amount)) {
      return `${rounded} (تقريبي)`;
    }
    return rounded;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  /** تاريخ انتهاء الضمان = 90 يوم من تاريخ وصول العاملة في الطلب */
  const getWarrantyEndDate = (kingdomEntryDate: string | undefined): string | null => {
    if (!kingdomEntryDate) return null;
    const arrival = new Date(kingdomEntryDate);
    const end = new Date(arrival);
    end.setDate(end.getDate() + 90);
    return end.toISOString().split('T')[0];
  };

  /** حساب الأيام المتبقية على انتهاء الضمان */
  const getRemainingDays = (endDateString: string | null | undefined): number | null => {
    if (!endDateString) return null;
    const end = new Date(endDateString);
    const now = new Date();
    
    // Reset hours to compare only dates
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const exportToPDF = async () => {
    if (!statement) return;
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    try {
      const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
      const logoBuffer = await logo.arrayBuffer();
      const logoBytes = new Uint8Array(logoBuffer);
      const logoBase64 = Buffer.from(logoBytes).toString('base64');
      
      const response = await fetch('/fonts/Amiri-Regular.ttf');
      if (!response.ok) throw new Error('Failed to fetch font');
      const fontBuffer = await response.arrayBuffer();
      const fontBytes = new Uint8Array(fontBuffer);
      const fontBase64 = Buffer.from(fontBytes).toString('base64');

      doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
      doc.setFont('Amiri', 'normal');
    } catch (error) {
      console.error('Error loading assets:', error);
      doc.setFont('helvetica', 'normal');
    }

    doc.setLanguage('ar');
    doc.setFontSize(16);

    const tableColumn = ["#", "التاريخ", "البيان", "مدين", "دائن", "الرصيد"];
    const tableRows: any[] = [];

    statement.entries.forEach((entry, index) => {
      const rowData = [
        (index + 1).toString(),
        getDate(entry.date),
        entry.description,
        entry.debit > 0 ? formatCurrency(entry.debit) : 'ـــ',
        entry.credit > 0 ? formatCurrency(entry.credit) : 'ـــ',
        formatCurrency(entry.balance)
      ];
      tableRows.push(rowData);
    });

    // Add total row
    const totalRow = [
       "",
       "",
       "الاجمالي",
       formatCurrency(statement.totals.totalDebit),
       formatCurrency(statement.totals.totalCredit),
       formatCurrency(statement.totals.netAmount)
    ];
    tableRows.push(totalRow);
    
    const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
    const logoBuffer = await logo.arrayBuffer();
    const logoBytes = new Uint8Array(logoBuffer);
    const logoBase64 = Buffer.from(logoBytes).toString('base64');

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      styles: { font: 'Amiri', halign: 'right', fontSize: 10 },
      headStyles: { fillColor: [26, 77, 79], textColor: [255, 255, 255] },
      margin: { top: 60, right: 10, left: 10 },
      didDrawPage: (data: any) => {
         const pageWidth = doc.internal.pageSize.width;
         const pageHeight = doc.internal.pageSize.height;
        
         // Header Info
         doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);
         doc.setFontSize(14);
         doc.text(`كشف حساب العميل: ${statement.client?.fullname || ''}`, pageWidth / 2, 20, { align: 'center' });
         doc.setFontSize(10);
         doc.text(`تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}`, 10, 20, { align: 'left' });
         
          // Client Info Section just below header
          if (doc.getCurrentPageInfo().pageNumber === 1) {
             doc.text(`رقم الهوية: ${statement.client?.nationalId || '-'}`, pageWidth - 20, 45, { align: 'right' });
             doc.text(`رقم الجوال: ${statement.client?.phonenumber || '-'}`, pageWidth - 80, 45, { align: 'right' });
          }

         // Footer
         const pageNumber = `صفحة ${doc.getCurrentPageInfo().pageNumber}`;
         doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });
         doc.text("الضمان 90 يوم من تاريخ الوصول", 20, pageHeight - 10, { align: 'left' });
      }
    });

    doc.save(`كشف_حساب_${statement.client?.fullname || 'عميل'}.pdf`);
  };

  const exportToExcel = () => {
    if (!statement) return;
    
    const worksheetData = statement.entries.map((entry, index) => ({
      '#': index + 1,
      'التاريخ': getDate(entry.date),
      'البيان': entry.description,
      'مدين': entry.debit > 0 ? formatCurrency(entry.debit) : 'ـــ',
      'دائن': entry.credit > 0 ? formatCurrency(entry.credit) : 'ـــ',
      'الرصيد': formatCurrency(entry.balance)
    }));

    // Add totals
    worksheetData.push({
      '#': '',
      'التاريخ': '',
      'البيان': 'الاجمالي',
      'مدين': formatCurrency(statement.totals.totalDebit),
      'دائن': formatCurrency(statement.totals.totalCredit),
      'الرصيد': formatCurrency(statement.totals.netAmount)
    } as any);

    // Add warranty note
    worksheetData.push({
      '#': '',
      'التاريخ': '',
      'البيان': 'الضمان 90 يوم من تاريخ الوصول',
      'مدين': '',
      'دائن': '',
      'الرصيد': ''
    } as any);

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    
    // Adjust column widths
    worksheet['!cols'] = [
      { wch: 5 }, { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'كشف الحساب');
    XLSX.writeFile(workbook, `كشف_حساب_${statement.client?.fullname || 'عميل'}.xlsx`);
  };


  if (loading) {
    return (
      <Layout>
        <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-[#0D5C63] rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium tracking-wide">جاري التحميل...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!statement) {
    return (
      <Layout>
        <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-gray-500">لم يتم العثور على كشف الحساب</div>
        </div>
      </Layout>
    );
  }

 // دالة ترجمة حالة الطلب من الإنجليزية إلى العربية
  const translateBookingStatus = (status: string) => {
    const statusTranslations: { [key: string]: string } = {
      'pending': 'قيد الانتظار',
      'office_link_approved': 'موافقة الربط مع إدارة المكاتب',
      'pending_office_link': 'في انتظار الربط مع إدارة المكاتب',
      'external_office_approved': 'موافقة المكتب الخارجي',
      'pending_external_office': 'في انتظار المكتب الخارجي',
      'medical_check_passed': 'تم اجتياز الفحص الطبي',
      'pending_medical_check': 'في انتظار الفحص الطبي',
      'foreign_labor_approved': 'موافقة وزارة العمل الأجنبية',
      'pending_foreign_labor': 'في انتظار وزارة العمل الأجنبية',
      'agency_paid': 'تم دفع الوكالة',
      'pending_agency_payment': 'في انتظار دفع الوكالة',
      'embassy_approved': 'موافقة السفارة السعودية',
      'pending_embassy': 'في انتظار السفارة السعودية',
      'visa_issued': 'تم إصدار التأشيرة',
      'pending_visa': 'في انتظار إصدار التأشيرة',
      'travel_permit_issued': 'تم إصدار تصريح السفر',
      'pending_travel_permit': 'في انتظار تصريح السفر',
      'received': 'تم الاستلام',
      'pending_receipt': 'في انتظار الاستلام',
      'cancelled': 'ملغي',
      'rejected': 'مرفوض',
      'delivered': 'تم التسليم',
      'new_order': 'طلب جديد',
      'new_orders': 'طلبات جديدة'
    };

    return statusTranslations[status] || status;
  };


  return (
    <Layout>
    <div className={`bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-200 ${Style["tajawal-regular"]} ${isDarkMode ? 'dark' : ''}`} dir="rtl">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <ArrowRightIcon className="w-6 h-6 text-slate-900 dark:text-white transform rotate-180" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {statement.client?.fullname}
                        </h1>
                        <span className="text-slate-500 dark:text-slate-400 text-md">ID: {statement.client?.nationalId}</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Office Info Card */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <OfficeBuildingIcon className="w-6 h-6 text-primary" />
                        <h2 className="text-lg font-bold">معلومات المكتب</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 text-md">
                        <div className="space-y-1">
                            <p className="text-slate-400 dark:text-slate-500">الدولة</p>
                            <p className="font-medium">{statement.order?.HomeMaid?.office?.Country || 'غير محدد'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-400 dark:text-slate-500">اسم المكتب</p>
                            <p className="font-medium">{statement.order?.HomeMaid?.office?.office || statement.officeName || 'غير محدد'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-400 dark:text-slate-500">اسم العاملة</p>
                            <p className="font-medium cursor-pointer" onClick={() => router.push(`/admin/homemaidinfo?id=${statement.order?.HomeMaid?.id}`)}>{statement.order?.HomeMaid?.Name || 'غير محدد'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-400 dark:text-slate-500">رقم هاتف المكتب</p>
                            <p className="font-medium text-slate-400 italic">{statement.order?.HomeMaid?.office?.phoneNumber || 'غير محدد'}</p>
                        </div>
                    </div>
                </div>

                {/* Order Info Card */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <DocumentTextIcon className="w-6 h-6 text-primary" />
                        <h2 className="text-lg font-bold">معلومات الطلب</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 text-md">
                        <div className="space-y-1">
                            <p className="text-slate-400 dark:text-slate-500">تاريخ الطلب</p>
                            <p className="font-medium">
                                {statement.order ? getDate(statement.order.createdAt) : getDate(statement.client?.createdAt)}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-400 dark:text-slate-500">حالة العقد</p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-md font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                {translateBookingStatus(statement.order?.bookingstatus || '')}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-400 dark:text-slate-500">تاريخ الوصول</p>
                            <p className="font-medium text-slate-400 italic">
                                {statement.order?.arrivals?.[0]?.KingdomentryDate ? getDate(statement.order.arrivals[0].KingdomentryDate) : 'غير محدد'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            {(() => {
                                const endDate = statement.order?.arrivals?.[0]?.GuaranteeDurationEnd 
                                    || getWarrantyEndDate(statement.order?.arrivals?.[0]?.KingdomentryDate);
                                const remainingDays = getRemainingDays(endDate);
                                return (
                                    <>
                                        <p className="text-slate-400 dark:text-slate-500">
                                            تاريخ انتهاء الضمان
                                            {remainingDays !== null && (
                                                <span className={`font-bold ${remainingDays >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {' '}{remainingDays >= 0 ? `(متبقي ${remainingDays} يوم)` : `(انتهى منذ ${Math.abs(remainingDays)} يوم)`}
                                                </span>
                                            )}
                                        </p>
                                        <p className="font-medium text-slate-400 italic">
                                            {endDate ? getDate(endDate) : 'غير محدد'}
                                        </p>
                                    </>
                                );
                            })()}
                        </div>
                        <div className="space-y-1 col-span-2 mt-2 pt-2 border-t border-slate-50 dark:border-slate-700/50">
                            <p className="text-slate-400 dark:text-slate-500">المبلغ المطلوب</p>
                            <p className="text-xl font-bold text-primary">
                                {statement.order?.Total != null ? formatCurrency(statement.order.Total) : 'ـــ'} <span className="text-md font-normal text-slate-500">ر.س</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-md font-medium text-slate-600 dark:text-slate-400">من تاريخ</label>
                        <input 
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-md focus:ring-primary focus:border-primary p-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-md font-medium text-slate-600 dark:text-slate-400">إلى تاريخ</label>
                        <input 
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-md focus:ring-primary focus:border-primary p-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-md font-medium text-slate-600 dark:text-slate-400">نوع الحركة</label>
                        <select 
                            value={selectedEntryType}
                            onChange={(e) => setSelectedEntryType(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-md focus:ring-primary focus:border-primary "
                        >
                            <option value="all">اختر نوع الحركة</option>
                            <option value="expense">مصروف</option>
                            <option value="payment">دفعة</option>
                        </select>
                    </div>
                    <button 
                        onClick={() => fetchStatement()}
                        className="bg-primary text-white py-2 px-6 rounded-lg font-medium hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                        <ReceiptTaxIcon className="w-5 h-5 bg-transparent text-white" />
                        كشف حساب
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="bg-primary text-white py-2 px-4 rounded-lg text-md font-medium flex items-center gap-1 hover:bg-opacity-90 transition-all shadow-sm"
                        >
                            <PlusCircleIcon className="w-5 h-5 bg-transparent text-white" />
                            إضافة سجل
                        </button>
                    </div>
                    <div className="flex items-center gap-3 flex-grow md:flex-grow-0">
                        <div className="relative flex-grow md:w-64">
                            <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input 
                                type="text"
                                placeholder="بحث..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-md focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <div className="flex gap-1 border-r border-slate-200 dark:border-slate-700 pr-3">
                            <button 
                                onClick={exportToPDF}
                                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-all" 
                                title="Export PDF"
                            >
                                <DocumentTextIcon className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={exportToExcel}
                                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-all" 
                                title="Export Excel"
                            >
                                <ViewGridIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-[#0D5C63] text-white">
                            <tr>
                                <th className="px-6 py-4 text-md font-semibold first:rounded-tr-lg">#</th>
                                <th className="px-6 py-4 text-md font-semibold">التاريخ</th>
                                <th className="px-6 py-4 text-md font-semibold">البيان</th>
                                <th className="px-6 py-4 text-md font-semibold">مدين</th>
                                <th className="px-6 py-4 text-md font-semibold">دائن</th>
                                <th className="px-6 py-4 text-md font-semibold">الرصيد</th>
                                <th className="px-6 py-4 text-md font-semibold last:rounded-tl-lg">اجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                             {statement?.entries?.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">لا توجد بيانات</td>
                                </tr>
                            ) : (
                                <DndContext 
                                  sensors={sensors}
                                  collisionDetection={closestCenter}
                                  onDragEnd={handleDragEnd}
                                >
                                  <SortableContext 
                                    items={statement?.entries?.map(e => e.id) || []}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    {statement?.entries?.map((entry, index) => (
                                        <SortableRow 
                                          key={entry.id}
                                          entry={entry}
                                          index={index}
                                          formatCurrency={formatCurrency}
                                          getDate={getDate}
                                          openEditModal={openEditModal}
                                        />
                                    ))}
                                  </SortableContext>
                                </DndContext>
                            )}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-slate-800/50 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                            <tr>
                                <td className="px-6 py-4 text-md text-left" colSpan={3}>الإجمالي</td>
                                <td className="px-6 py-4 text-md font-mono">{formatCurrency(statement?.totals?.totalDebit || 0)}</td>
                                <td className="px-6 py-4 text-md font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(statement?.totals?.totalCredit || 0)}</td>
                                <td className="px-6 py-4 text-md font-mono text-primary">{formatCurrency(statement?.totals?.netAmount || 0)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <button 
                className="fixed bottom-8 left-8 bg-primary text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform focus:outline-none z-50" 
                onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
            >
                <ArrowUpIcon className="w-6 h-6 bg-transparent text-white" />
            </button>
        </main>

        <footer className="text-center py-8 text-slate-400 dark:text-slate-600 text-md">
            
        </footer>
        
        {/* Add Entry Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg w-[600px] max-w-[90%] shadow-lg">
              <h2 className="text-xl text-center mb-6 text-teal-700">إضافة سجل</h2>
              <form onSubmit={handleAddEntry} className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-md font-medium text-gray-700 mb-1">التاريخ</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="p-2 border border-gray-300 rounded text-md bg-gray-50"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-md font-medium text-gray-700 mb-1">رصيد المدين</label>
                  <input
                    type="number"
                    placeholder="ادخل رصيد المدين"
                    value={formData.debit}
                    onChange={(e) => setFormData({ ...formData, debit: e.target.value })}
                    className="p-2 border border-gray-300 rounded text-md bg-gray-50"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-md font-medium text-gray-700 mb-1">رصيد الدائن</label>
                  <input
                    type="number"
                    placeholder="ادخل رصيد الدائن"
                    value={formData.credit}
                    onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
                    className="p-2 border border-gray-300 rounded text-md bg-gray-50"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-md font-medium text-gray-700 mb-1">البيان</label>
                  <input
                    type="text"
                    placeholder="ادخل البيان"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="p-2 border border-gray-300 rounded text-md bg-gray-50"
                    required
                  />
                </div>
                <div className="col-span-2 flex justify-center gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded text-md"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-teal-800 text-white rounded text-md"
                  >
                    إضافة
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Entry Modal */}
        {showEditModal && editingEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg w-[600px] max-w-[90%] shadow-lg">
              <h2 className="text-xl text-center mb-6 text-teal-700">تعديل</h2>
              <form onSubmit={handleEditEntry} className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-md font-medium text-gray-700 mb-1">رصيد المدين</label>
                  <input
                    type="number"
                    value={formData.debit}
                    onChange={(e) => setFormData({ ...formData, debit: e.target.value })}
                    className="p-2 border border-gray-300 rounded text-md bg-gray-50"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-md font-medium text-gray-700 mb-1">رصيد الدائن</label>
                  <input
                    type="number"
                    value={formData.credit}
                    onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
                    className="p-2 border border-gray-300 rounded text-md bg-gray-50"
                  />
                </div>
                <div className="col-span-2 flex flex-col">
                  <label className="text-md font-medium text-gray-700 mb-1">البيان</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="p-2 border border-gray-300 rounded text-md bg-gray-50"
                    required
                  />
                </div>
                <div className="col-span-2 flex justify-center gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded text-md"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-teal-800 text-white rounded text-md"
                  >
                    حفظ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Message Modal */}
        {message && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] animate-fade-in">
            <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-[400px] max-w-[90%] transform transition-all scale-100 ${
               message.type === 'success' ? 'border-t-4 border-emerald-500' : 'border-t-4 border-red-500'
            }`}>
              <div className="flex flex-col items-center text-center gap-4">
                {message.type === 'success' ? (
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full">
                    <CheckCircleIcon className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                  </div>
                ) : (
                   <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                    <ExclamationCircleIcon className="w-12 h-12 text-red-600 dark:text-red-400" />
                   </div>
                )}
                
                <h3 className={`text-xl font-bold ${message.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                  {message.type === 'success' ? 'تمت العملية بنجاح' : 'تنبيه'}
                </h3>
                
                <p className="text-slate-600 dark:text-slate-300 font-medium">
                  {message.text}
                </p>

                <button 
                  onClick={closeMessage}
                  className={`mt-2 px-6 py-2 rounded-lg text-white font-medium transition-colors w-full ${
                    message.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  حسناً
                </button>
              </div>
            </div>
          </div>
        )}

    </div>
    </Layout>
  );
};

export default ClientStatementPage;
