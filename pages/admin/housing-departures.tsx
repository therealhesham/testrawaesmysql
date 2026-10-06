import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from 'example/containers/Layout';
import Style from 'styles/Home.module.css';
import prisma from 'lib/prisma';
import { jwtDecode } from 'jwt-decode';
import ExcelJS from 'exceljs';
import { formatSaudiCity } from 'lib/cityHelper';
import {
  Users,
  Building,
  UserCheck,
  UserX,
  Plane,
  FileText,
  Search,
  Download,
  Eye,
  Calendar,
  Clock,
  Phone,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  MapPin,
  ExternalLink,
  RotateCcw,
  Activity,
  CreditCard,
  Paperclip,
  ChevronDown,
  X
} from 'lucide-react';
import { FaHospital } from 'react-icons/fa';
import FailTrialModal from 'components/FailTrialModal';

interface HousedWorkerRow {
  id: number;
  homeMaid_id: number | null;
  externalHomedmaidId: number | null;
  location_id: number | null;
  houseentrydate: string | null;
  deparatureHousingDate: string | null;
  deparatureReason: string | null;
  deparatureAttachment?: string | null;
  notes_attachment?: string | null;
  Reason: string | null;
  Details: string | null;
  employee: string | null;
  transferSponsorshipData?: any;
  medicalDepartureData?: any;
  deportationData?: any;
  Order?: {
    id?: number;
    Name?: string;
    phone?: string | null;
    Nationalitycopy?: string | null;
    Passportnumber?: string | null;
    office?: {
      Country?: string | null;
      title?: string | null;
    } | null;
    NewOrder?: Array<{
      clientID?: number | null;
      ClientName?: string | null;
      typeOfContract?: string | null;
      PhoneNumber?: string | null;
      clientphonenumber?: string | null;
      nationalId?: string | null;
      arrivals?: Array<{
        KingdomentryDate?: string | null;
        KingdomentryTime?: string | null;
        GuaranteeDurationEnd?: string | null;
      }> | null;
      client?: {
        id?: number;
        fullname?: string | null;
        nationalId?: string | null;
        phonenumber?: string | null;
        city?: string | null;
      } | null;
    }>;
  };
  externalHomedmaid?: {
    id?: number;
    name: string | null;
    nationality: string | null;
    passportNumber: string | null;
    phone: string | null;
    image?: string | null;
    type?: string | null;
    Client?: {
      id?: number;
      fullname?: string | null;
      nationalId?: string | null;
      phonenumber?: string | null;
      city?: string | null;
    } | null;
  };
  HousedWorkerNotes?: Array<{
    id: number;
    notes: string;
    employee: string | null;
    createdAt: string;
  }>;
}

interface InHouseLocation {
  id: number;
  location: string;
}

type DepartureSection = 'temporary' | 'permanent';
type DepartureCategoryTab =
  | 'temp_all'
  | 'trial_transfer'
  | 'medical'
  | 'perm_all'
  | 'completed_transfer'
  | 'deportation'
  | 'external';

export default function HousingDeparturesPage({
  user,
  canCreateTransfer = true,
  canEditTransfer = true,
  canViewTransfer = true,
}: {
  user?: string;
  canCreateTransfer?: boolean;
  canEditTransfer?: boolean;
  canViewTransfer?: boolean;
}) {
  const router = useRouter();

  // State for data
  const [workers, setWorkers] = useState<HousedWorkerRow[]>([]);
  const [locations, setLocations] = useState<InHouseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeSection, setActiveSection] = useState<DepartureSection>('temporary');
  const [activeCategory, setActiveCategory] = useState<DepartureCategoryTab>('temp_all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedContractType, setSelectedContractType] = useState<string>('');
  const [selectedNationality, setSelectedNationality] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [followUpStatus, setFollowUpStatus] = useState<string>('all'); // 'all' | 'overdue' | 'active'
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [offices, setOffices] = useState<Array<{ id: number; office: string; Country?: string | null }>>([]);
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Counts for tabs
  const [counts, setCounts] = useState({
    all: 0,
    tempTotal: 0,
    permTotal: 0,
    trial_transfer: 0,
    medical: 0,
    completed_transfer: 0,
    deportation: 0,
    external: 0,
  });

  // Modals state
  const [selectedDetailWorker, setSelectedDetailWorker] = useState<HousedWorkerRow | null>(null);
  const [failTrialWorker, setFailTrialWorker] = useState<HousedWorkerRow | null>(null);
  const [rehousingWorker, setRehousingWorker] = useState<HousedWorkerRow | null>(null);
  const [rehousingForm, setRehousingForm] = useState({
    houseentrydate: new Date().toISOString().split('T')[0],
    Reason: '',
    location: '',
  });
  const [isSubmittingRehousing, setIsSubmittingRehousing] = useState(false);

  // Finalize Transfer Modal state
  const [finalizeTransferWorker, setFinalizeTransferWorker] = useState<HousedWorkerRow | null>(null);
  const [finalizeTransferForm, setFinalizeTransferForm] = useState({
    completionDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [isSubmittingFinalizeTransfer, setIsSubmittingFinalizeTransfer] = useState(false);

  // Notes Modal state
  const [notesWorker, setNotesWorker] = useState<HousedWorkerRow | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Toast Notification state
  const [toastNotification, setToastNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToastNotification({ show: true, message, type });
    setTimeout(() => {
      setToastNotification((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  // Fetch Locations
  const fetchLocations = useCallback(async () => {
    try {
      const res = await axios.get('/api/inhouselocation');
      setLocations(res.data || []);
    } catch {
      setLocations([]);
    }
  }, []);

  // Fetch Offices
  const fetchOffices = useCallback(async () => {
    try {
      const res = await axios.get('/api/offices');
      if (res.data?.items) {
        setOffices(res.data.items);
      } else if (res.data?.finder) {
        setOffices(res.data.finder);
      }
    } catch {
      try {
        const res2 = await axios.get('/api/office_list');
        if (res2.data?.finder) setOffices(res2.data.finder);
      } catch {
        setOffices([]);
      }
    }
  }, []);

  // Fetch Departed Workers
  const fetchDepartedWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('pageSize', String(pageSize));
      params.append('section', activeSection);
      params.append('departureCategory', activeCategory);
      if (searchQuery.trim()) {
        params.append('Name', searchQuery.trim());
      }
      if (selectedLocation) {
        params.append('location', selectedLocation);
      }
      if (selectedContractType) {
        params.append('contractType', selectedContractType);
      }
      if (selectedNationality) {
        params.append('nationality', selectedNationality);
      }
      if (fromDate) {
        params.append('fromDate', fromDate);
      }
      if (toDate) {
        params.append('toDate', toDate);
      }
      if (activeSection === 'temporary' && followUpStatus && followUpStatus !== 'all') {
        params.append('followUpStatus', followUpStatus);
      }
      if (activeSection === 'permanent' && selectedOffice) {
        params.append('foreignOffice', selectedOffice);
      }
      if (sortKey) {
        params.append('sortKey', sortKey);
        params.append('sortDirection', sortDirection);
      }

      const res = await axios.get(`/api/housingdeparature?${params.toString()}`);
      setWorkers(res.data?.housing || []);
      setTotalCount(res.data?.totalCount || 0);
      setTotalPages(res.data?.totalPages || 1);
      if (res.data?.counts) {
        setCounts(res.data.counts);
      }
    } catch (err: any) {
      console.error('Error fetching departed workers:', err);
      showNotification('حدث خطأ أثناء جلب بيانات المغادرات', 'error');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    activeSection,
    activeCategory,
    searchQuery,
    selectedLocation,
    selectedContractType,
    selectedNationality,
    fromDate,
    toDate,
    followUpStatus,
    selectedOffice,
    sortKey,
    sortDirection,
  ]);

  useEffect(() => {
    fetchLocations();
    fetchOffices();
  }, [fetchLocations, fetchOffices]);

  useEffect(() => {
    fetchDepartedWorkers();
  }, [fetchDepartedWorkers]);

  // Handle Section Switch
  const handleSectionSwitch = (sec: DepartureSection) => {
    setActiveSection(sec);
    setActiveCategory(sec === 'temporary' ? 'temp_all' : 'perm_all');
    setPage(1);
  };

  // Handle Category Tab Change
  const handleCategoryTabChange = (tab: DepartureCategoryTab) => {
    setActiveCategory(tab);
    setPage(1);
  };

  // Helper to extract Worker Name
  const getWorkerName = (worker: HousedWorkerRow) => {
    return worker.externalHomedmaid?.name || worker.Order?.Name || 'عاملة غير محددة';
  };

  // Helper to extract Passport Number
  const getPassportNumber = (worker: HousedWorkerRow) => {
    return worker.externalHomedmaid?.passportNumber || worker.Order?.Passportnumber || 'غير متوفر';
  };

  // Helper to extract Nationality
  const getNationality = (worker: HousedWorkerRow) => {
    return worker.externalHomedmaid?.nationality || worker.Order?.Nationalitycopy || worker.Order?.office?.Country || 'غير محدد';
  };

  // Helper to extract Old Sponsor Name
  const getOldSponsorName = (worker: HousedWorkerRow) => {
    if (worker.externalHomedmaid?.Client?.fullname) {
      return worker.externalHomedmaid.Client.fullname;
    }
    const order = worker.Order?.NewOrder?.[0];
    return order?.client?.fullname || order?.ClientName || 'غير متوفر';
  };

  // Helper to extract Old Sponsor Phone
  const getOldSponsorPhone = (worker: HousedWorkerRow) => {
    if (worker.externalHomedmaid?.Client?.phonenumber) {
      return worker.externalHomedmaid.Client.phonenumber;
    }
    const order = worker.Order?.NewOrder?.[0];
    return order?.client?.phonenumber || order?.PhoneNumber || order?.clientphonenumber || 'غير متوفر';
  };

  // Helper to format dates
  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return '—';
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    } catch {
      return '—';
    }
  };

  // Helper for Duration in Housing
  const getHousingStayDuration = (entryDate: string | null, departureDate: string | null) => {
    if (!entryDate || !departureDate) return '—';
    try {
      const start = new Date(entryDate).getTime();
      const end = new Date(departureDate).getTime();
      if (isNaN(start) || isNaN(end)) return '—';
      const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? `${days} يوم` : 'يوم واحد';
    } catch {
      return '—';
    }
  };

  // توجيه لصفحة إضافة معاملة نقل الكفالة مع تمرير كامل بيانات العاملة والكفيل والتجربة
  const handleSuccessTrial = (worker: HousedWorkerRow) => {
    if (!canCreateTransfer) {
      showNotification('عذراً، ليس لديك صلاحية «إنشاء» معاملات نقل الكفالة لإتمام هذه المعاملة', 'error');
      return;
    }

    const tsd = worker.transferSponsorshipData || {};
    const order = worker.Order?.NewOrder?.[0];
    const oldClient = worker.externalHomedmaid?.Client || order?.client;

    const workerName = worker.externalHomedmaid?.name || worker.Order?.Name || '';
    const nationality = worker.externalHomedmaid?.nationality || worker.Order?.Nationalitycopy || worker.Order?.office?.Country || '';
    const passportNumber = worker.externalHomedmaid?.passportNumber || worker.Order?.Passportnumber || '';
    const entryDate = order?.arrivals?.[0]?.KingdomentryDate
      ? new Date(order.arrivals[0].KingdomentryDate).toISOString().split('T')[0]
      : worker.houseentrydate
      ? new Date(worker.houseentrydate).toISOString().split('T')[0]
      : '';
    const residencyNumber = (worker.externalHomedmaid as any)?.nationalId || (worker.externalHomedmaid as any)?.residencyNumber || (worker.Order as any)?.NationalId || '';

    const oldClientName = oldClient?.fullname || order?.ClientName || '';
    const oldClientPhone = oldClient?.phonenumber || order?.PhoneNumber || order?.clientphonenumber || '';
    const oldClientNationalId = oldClient?.nationalId || order?.nationalId || (oldClient?.id ? String(oldClient.id) : '');
    const oldClientCity = formatSaudiCity(oldClient?.city || (oldClient as any)?.city || '');

    const payload = {
      housedWorkerId: worker.id,
      homeMaidId: worker.homeMaid_id || worker.externalHomedmaidId || undefined,
      maidName: workerName,
      nationality: nationality,
      passportNumber: passportNumber,
      residencyNumber: residencyNumber,
      entryDate: entryDate,
      oldClientId: oldClientNationalId || (oldClient?.id ? String(oldClient.id) : ''),
      oldClientName: oldClientName,
      oldClientPhone: oldClientPhone,
      oldClientCity: oldClientCity,
      trialClientName: tsd.newSponsorName || '',
      newClientName: tsd.newSponsorName || '',
      newClientPhone: tsd.newSponsorPhone || '',
      newClientAltPhone: tsd.newSponsorAltPhone || '',
      newClientId: tsd.newSponsorId || '',
      newClientNationalId: tsd.newSponsorId || tsd.newSponsorNationalId || '',
      newSponsorId: tsd.newSponsorId || '',
      newSponsorNationalId: tsd.newSponsorId || '',
      newClientCity: formatSaudiCity(tsd.newSponsorCity || ''),
      newClientDateOfBirth: tsd.newSponsorDateOfBirth || '',
      experimentDuration: tsd.trialPeriodDays ? `${tsd.trialPeriodDays} أيام` : '',
      experimentStart: tsd.trialStartDate || (worker.deparatureHousingDate ? new Date(worker.deparatureHousingDate).toISOString().split('T')[0] : ''),
      experimentEnd: tsd.trialEndDate || '',
      dailyCost: tsd.dailyCost || '',
      cost: tsd.totalCost || '',
      estimatedCost: tsd.totalCost || '',
      paidAmount: tsd.paidAmount || '0',
      remainingAmount: tsd.remainingAmount || (
        tsd.totalCost && tsd.paidAmount
          ? String(Math.max(0, Number(tsd.totalCost) - Number(tsd.paidAmount)))
          : ''
      ),
      salaryCertificateFile: tsd.salaryCertificateFile || '',
      nationalAddressFile: tsd.nationalAddressFile || '',
      paymentReceiptFile: tsd.paymentReceiptFile || '',
      contractDate: tsd.trialStartDate || (worker.deparatureHousingDate ? new Date(worker.deparatureHousingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      trialNotes: tsd.notes || '',
      notes: tsd.notes || '',
      trialResult: 'ناجحة',
      sourceAction: 'complete_housing_transfer',
    };

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('housingTransferWizardDraft', JSON.stringify(payload));
    }
    router.push('/admin/AddTransactionForm');
  };

  // Helper to calculate trial period status
  const getTrialPeriodStatus = (worker: HousedWorkerRow) => {
    const tsd = worker.transferSponsorshipData;
    if (!tsd) return null;

    const startDateStr = tsd.trialStartDate || worker.deparatureHousingDate;
    const days = parseInt(tsd.trialPeriodDays, 10) || 0;
    const endDateStr = tsd.trialEndDate;

    if (!startDateStr) return null;

    // تجريد التواريخ من الوقت لمقارنة الأيام التقويمية بدقة تامة
    const startDay = new Date(startDateStr);
    startDay.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let endDay: Date;
    if (days > 0) {
      endDay = new Date(startDay);
      endDay.setDate(endDay.getDate() + days);
    } else if (endDateStr) {
      endDay = new Date(endDateStr);
      endDay.setHours(0, 0, 0, 0);
    } else {
      return null;
    }

    // حساب الفارق الصافي بالأيام بين اليوم وتاريخ الانتهاء
    const diffMs = endDay.getTime() - today.getTime();
    const remainingDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    return {
      startDateFormatted: formatDate(startDateStr),
      endDateFormatted: formatDate(endDay.toISOString()),
      totalDays: days,
      remainingDays: Math.max(0, remainingDays),
      isExpired: remainingDays < 0,
      isToday: remainingDays === 0,
    };
  };

  // Helper to calculate medical return status
  const getMedicalReturnStatus = (worker: HousedWorkerRow) => {
    const med = worker.medicalDepartureData;
    if (!med) return null;

    const returnDateStr = med.expectedReturnDate;
    if (!returnDateStr) return null;

    const returnDay = new Date(returnDateStr);
    returnDay.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = returnDay.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    return {
      returnDateFormatted: returnDateStr.replace(/-/g, '/'),
      isOverdue: diffDays < 0,
      isToday: diffDays === 0,
      daysOverdue: Math.abs(diffDays),
      remainingDays: Math.max(0, diffDays),
    };
  };

  // Finalize Transfer Submit
  const handleFinalizeTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalizeTransferWorker) return;

    setIsSubmittingFinalizeTransfer(true);
    try {
      await axios.put('/api/housingdeparature', {
        action: 'complete_transfer_sponsorship',
        homeMaid: finalizeTransferWorker.id,
        completionDate: finalizeTransferForm.completionDate,
        notes: finalizeTransferForm.notes.trim(),
      });
      showNotification('تم إتمام نقل الكفالة بنجاح ونقل العاملة إلى قسم المغادرات الدائمة');
      setFinalizeTransferWorker(null);
      fetchDepartedWorkers();
    } catch (err: any) {
      console.error('Finalize transfer failed:', err);
      showNotification(err.response?.data?.error || 'حدث خطأ أثناء إتمام نقل الكفالة', 'error');
    } finally {
      setIsSubmittingFinalizeTransfer(false);
    }
  };

  // Re-housing Submit
  const handleRehousingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rehousingWorker) return;

    if (!rehousingForm.houseentrydate) {
      showNotification('يرجى تحديد تاريخ إعادة التسكين', 'error');
      return;
    }

    setIsSubmittingRehousing(true);
    try {
      const payload: any = {
        housedWorkerId: rehousingWorker.id,
        houseentrydate: rehousingForm.houseentrydate,
        Reason: rehousingForm.Reason.trim() || 'إعادة تسكين بعد مغادرة السكن',
      };
      if (rehousingForm.location) {
        payload.location_id = Number(rehousingForm.location);
      }

      await axios.post('/api/rehousing', payload);
      showNotification('تمت إعادة تسكين العاملة بنجاح');
      setRehousingWorker(null);
      fetchDepartedWorkers();
    } catch (err: any) {
      console.error('Rehousing failed:', err);
      showNotification(err.response?.data?.error || 'حدث خطأ أثناء إعادة التسكين', 'error');
    } finally {
      setIsSubmittingRehousing(false);
    }
  };

  // Add Note Submit
  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesWorker || !newNoteText.trim()) return;

    setIsAddingNote(true);
    try {
      await axios.post('/api/housing/add-note', {
        housedWorkerId: notesWorker.id,
        notes: newNoteText.trim(),
      });
      showNotification('تمت إضافة الملاحظة بنجاح');
      setNewNoteText('');
      setNotesWorker((prev) =>
        prev
          ? {
              ...prev,
              HousedWorkerNotes: [
                {
                  id: Date.now(),
                  notes: newNoteText.trim(),
                  employee: 'أنت',
                  createdAt: new Date().toISOString(),
                },
                ...(prev.HousedWorkerNotes || []),
              ],
            }
          : prev
      );
      fetchDepartedWorkers();
    } catch (err: any) {
      console.error('Error adding note:', err);
      showNotification(err.response?.data?.error || 'فشل في حفظ الملاحظة', 'error');
    } finally {
      setIsAddingNote(false);
    }
  };

  // Export to Excel
  const handleExportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheetName = activeSection === 'temporary' ? 'المغادرات المؤقتة' : 'المغادرات الدائمة';
      const worksheet = workbook.addWorksheet(sheetName, {
        properties: { defaultColWidth: 20 },
      });

      worksheet.columns = [
        { header: 'اسم العاملة', key: 'name', width: 22 },
        { header: 'رقم الجواز', key: 'passport', width: 16 },
        { header: 'الجنسية', key: 'nationality', width: 16 },
        { header: 'نوع المغادرة', key: 'departureType', width: 22 },
        { header: 'تاريخ المغادرة', key: 'departureDate', width: 16 },
        { header: 'مدة الإقامة بالسكن', key: 'stayDuration', width: 16 },
        { header: 'السكن السابق', key: 'location', width: 18 },
        { header: 'الكفيل القديم', key: 'oldSponsor', width: 22 },
        { header: 'الكفيل الجديد', key: 'newSponsor', width: 22 },
        { header: 'مدة التجربة', key: 'trialDays', width: 14 },
        { header: 'المبلغ المتفق عليه', key: 'totalCost', width: 16 },
        { header: 'المبلغ المدفوع', key: 'paidAmount', width: 16 },
        { header: 'تفاصيل وملاحظات', key: 'notes', width: 30 },
      ];

      worksheet.getRow(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0D5C63' },
      };
      worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

      workers.forEach((w) => {
        const tsd = w.transferSponsorshipData;
        const locName = locations.find((l) => l.id === w.location_id)?.location || 'غير محدد';

        worksheet.addRow({
          name: getWorkerName(w),
          passport: getPassportNumber(w),
          nationality: getNationality(w),
          departureType: w.deparatureReason || 'مغادرة السكن',
          departureDate: formatDate(w.deparatureHousingDate),
          stayDuration: getHousingStayDuration(w.houseentrydate, w.deparatureHousingDate),
          location: locName,
          oldSponsor: getOldSponsorName(w),
          newSponsor: tsd?.newSponsorName || '—',
          trialDays: tsd?.trialPeriodDays ? `${tsd.trialPeriodDays} أيام` : '—',
          totalCost: tsd?.totalCost ? `${tsd.totalCost} ر.س` : '—',
          paidAmount: tsd?.paidAmount ? `${tsd.paidAmount} ر.س` : '—',
          notes: w.Details || tsd?.notes || '—',
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      showNotification('تم تصدير ملف الإكسل بنجاح');
    } catch (err) {
      console.error('Export excel error:', err);
      showNotification('فشل تصدير ملف الإكسل', 'error');
    }
  };

  return (
    <Layout>
      <Head>
        <title>العاملات المغادرات من السكن | نظام الإقامة والتسكين</title>
      </Head>

      {/* Floating Auto-Dismiss Toast Notification */}
      {toastNotification.show && (
        <div
          dir="rtl"
          className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
        >
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md transition-all ${
              toastNotification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-emerald-900/10'
                : 'bg-red-50 border-red-200 text-red-900 shadow-red-900/10'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                toastNotification.type === 'success'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {toastNotification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <span className="text-xs sm:text-sm font-bold">{toastNotification.message}</span>
            <button
              type="button"
              onClick={() => setToastNotification((prev) => ({ ...prev, show: false }))}
              className={`p-1 rounded-lg transition-colors mr-2 cursor-pointer ${
                toastNotification.type === 'success'
                  ? 'text-emerald-700/60 hover:text-emerald-900 hover:bg-emerald-100'
                  : 'text-red-700/60 hover:text-red-900 hover:bg-red-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <section className={`min-h-screen bg-gray-50/50 pb-12 ${Style?.['tajawal-regular'] || ''}`} dir="rtl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-5">
          
          {/* Top Page Header */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
                <FileText className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  العاملات اللاتي غادرن السكن
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  متابعة المغادرات المؤقتة (المستشفى وتجارب نقل الكفالة) وسجل المغادرات الدائمة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
              <button
                type="button"
                onClick={handleExportToExcel}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-teal-50 text-teal-800 text-xs font-bold rounded-xl transition-all border border-teal-300 shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4 text-teal-700" />
                <span>تصدير Excel</span>
              </button>
            </div>
          </div>

          {/* Primary Section Switcher (مغادرة مؤقتة vs مغادرة دائمة) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Temporary Departures Card */}
            <button
              type="button"
              onClick={() => handleSectionSwitch('temporary')}
              className={`p-4 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer select-none ${
                activeSection === 'temporary'
                  ? 'bg-gradient-to-l from-teal-900 to-teal-800 text-white border-teal-900 shadow-md ring-2 ring-teal-700/50'
                  : 'bg-white hover:bg-teal-50/40 text-gray-800 border-gray-200 shadow-sm hover:border-teal-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    activeSection === 'temporary'
                      ? 'bg-white/15 text-teal-200 border border-white/20'
                      : 'bg-teal-50 text-teal-700 border border-teal-200'
                  }`}
                >
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">المغادرة المؤقتة</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        activeSection === 'temporary'
                          ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      قيد المتابعة الحية
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      activeSection === 'temporary' ? 'text-teal-100/80' : 'text-gray-500'
                    }`}
                  >
                    حالات المستشفى وتجارب نقل الكفالة النشطة
                  </p>
                </div>
              </div>
              <div className="text-left shrink-0">
                <span
                  className={`text-lg font-mono font-bold block ${
                    activeSection === 'temporary' ? 'text-white' : 'text-teal-900'
                  }`}
                >
                  {counts.tempTotal}
                </span>
                <span
                  className={`text-[10px] ${
                    activeSection === 'temporary' ? 'text-teal-200' : 'text-gray-400'
                  }`}
                >
                  حالة نشطة
                </span>
              </div>
            </button>

            {/* Permanent Departures Card */}
            <button
              type="button"
              onClick={() => handleSectionSwitch('permanent')}
              className={`p-4 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer select-none ${
                activeSection === 'permanent'
                  ? 'bg-gradient-to-l from-teal-900 to-teal-800 text-white border-teal-900 shadow-md ring-2 ring-teal-700/50'
                  : 'bg-white hover:bg-teal-50/40 text-gray-800 border-gray-200 shadow-sm hover:border-teal-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    activeSection === 'permanent'
                      ? 'bg-white/15 text-teal-200 border border-white/20'
                      : 'bg-teal-50 text-teal-700 border border-teal-200'
                  }`}
                >
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">المغادرة الدائمة</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        activeSection === 'permanent'
                          ? 'bg-teal-700/40 text-teal-100 border border-teal-400/30'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      السجل والأرشيف
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      activeSection === 'permanent' ? 'text-teal-100/80' : 'text-gray-500'
                    }`}
                  >
                    الترحيل، العاملات الخارجيات، ونقل الكفالة المكتمل
                  </p>
                </div>
              </div>
              <div className="text-left shrink-0">
                <span
                  className={`text-lg font-mono font-bold block ${
                    activeSection === 'permanent' ? 'text-white' : 'text-teal-900'
                  }`}
                >
                  {counts.permTotal}
                </span>
                <span
                  className={`text-[10px] ${
                    activeSection === 'permanent' ? 'text-teal-200' : 'text-gray-400'
                  }`}
                >
                  سجل دائم
                </span>
              </div>
            </button>
          </div>

          {/* Table Container with Section Sub-Tabs */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Sub-Category Tabs Bar - Responsive Grid (Zero Horizontal Scroll) */}
            <div className="p-2 border-b border-gray-200 bg-gray-50/70">
              {activeSection === 'temporary' ? (
                /* Temporary Sub-tabs */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 w-full">
                  {[
                    { id: 'temp_all', label: 'جميع المغادرات المؤقتة', count: counts.tempTotal, icon: Activity },
                    { id: 'trial_transfer', label: 'تجارب نقل الكفالة', count: counts.trial_transfer, icon: UserCheck },
                    { id: 'medical', label: 'مغادرات مرضية / مستشفى', count: counts.medical, icon: FaHospital },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeCategory === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleCategoryTabChange(tab.id as DepartureCategoryTab)}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all w-full cursor-pointer select-none text-center ${
                          isActive
                            ? 'bg-teal-900 text-white shadow-sm ring-1 ring-teal-800'
                            : 'bg-white hover:bg-teal-50/60 text-gray-700 border border-gray-200/80 shadow-sm hover:border-teal-200'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-200' : 'text-teal-700'}`} />
                        <span className="truncate">{tab.label}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                            isActive
                              ? 'bg-teal-800 text-white'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Permanent Sub-tabs */
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full">
                  {[
                    { id: 'perm_all', label: 'جميع المغادرات الدائمة', count: counts.permTotal, icon: Building },
                    { id: 'completed_transfer', label: 'تم نقل الكفالة (مكتمل)', count: counts.completed_transfer, icon: CheckCircle2 },
                    { id: 'deportation', label: 'العاملات المرحلات', count: counts.deportation, icon: Plane },
                    { id: 'external', label: 'عاملات خارجيات', count: counts.external, icon: Users },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeCategory === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleCategoryTabChange(tab.id as DepartureCategoryTab)}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all w-full cursor-pointer select-none text-center ${
                          isActive
                            ? 'bg-teal-900 text-white shadow-sm ring-1 ring-teal-800'
                            : 'bg-white hover:bg-teal-50/60 text-gray-700 border border-gray-200/80 shadow-sm hover:border-teal-200'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-teal-200' : 'text-teal-700'}`} />
                        <span className="truncate">{tab.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                            isActive
                              ? 'bg-teal-800 text-white'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filter Controls Bar */}
            <div className="p-4 bg-white border-b border-gray-200 space-y-3">
              {/* Row 1: Search, Nationality, Location, Contract Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                {/* Search Bar (4 cols) */}
                <div className="sm:col-span-2 lg:col-span-4 relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="بحث باسم العاملة، الجواز، الجوال، الكفيل..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-10 pr-9 pl-3 text-xs bg-gray-50/70 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none transition-all"
                  />
                </div>

                {/* Nationality Filter (3 cols) */}
                <div className="sm:col-span-1 lg:col-span-3 relative">
                  <select
                    value={selectedNationality}
                    onChange={(e) => {
                      setSelectedNationality(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-10 pr-3 pl-8 text-xs bg-gray-50/70 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none text-gray-700 font-bold appearance-none bg-none cursor-pointer"
                  >
                    <option value="">جميع الجنسيات</option>
                    <option value="إثيوبيا">إثيوبيا (Ethiopia)</option>
                    <option value="الفلبين">الفلبين (Philippines)</option>
                    <option value="كينيا">كينيا (Kenya)</option>
                    <option value="أوغندا">أوغندا (Uganda)</option>
                    <option value="بنغلاديش">بنغلاديش (Bangladesh)</option>
                    <option value="سيرلانكا">سيرلانكا (Sri Lanka)</option>
                    <option value="الهند">الهند (India)</option>
                    <option value="مدغشقر">مدغشقر (Madagascar)</option>
                    <option value="بوروندي">بوروندي (Burundi)</option>
                    <option value="إندونيسيا">إندونيسيا (Indonesia)</option>
                  </select>
                  <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-gray-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {/* Location Filter (3 cols) */}
                <div className="sm:col-span-1 lg:col-span-3 relative">
                  <select
                    value={selectedLocation}
                    onChange={(e) => {
                      setSelectedLocation(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-10 pr-3 pl-8 text-xs bg-gray-50/70 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none text-gray-700 font-bold appearance-none bg-none cursor-pointer"
                  >
                    <option value="">جميع مباني وسكن العاملات</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.location}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-gray-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {/* Contract Type Filter (2 cols) */}
                <div className="sm:col-span-1 lg:col-span-2 relative">
                  <select
                    value={selectedContractType}
                    onChange={(e) => {
                      setSelectedContractType(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-10 pr-3 pl-8 text-xs bg-gray-50/70 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none text-gray-700 font-bold appearance-none bg-none cursor-pointer"
                  >
                    <option value="">جميع أنواع العقود</option>
                    <option value="recruitment">استقدام</option>
                    <option value="rental">تأجير</option>
                  </select>
                  <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-gray-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Row 2: Date Filters, Contextual Section Filters (Follow-up vs Office), Page Size & Reset */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-2 border-t border-gray-100 items-center">
                {/* From Date Filter (3 cols) */}
                <div className="sm:col-span-1 lg:col-span-3 flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 font-medium shrink-0">من تاريخ:</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-9 px-2 text-xs bg-gray-50/70 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none text-gray-700 font-medium"
                  />
                </div>

                {/* To Date Filter (3 cols) */}
                <div className="sm:col-span-1 lg:col-span-3 flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 font-medium shrink-0">إلى تاريخ:</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-9 px-2 text-xs bg-gray-50/70 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none text-gray-700 font-medium"
                  />
                </div>

                {/* Section Specific Filter (3 cols) */}
                {activeSection === 'temporary' ? (
                  /* Follow-up Status filter for temporary departures */
                  <div className="sm:col-span-1 lg:col-span-3 relative">
                    <select
                      value={followUpStatus}
                      onChange={(e) => {
                        setFollowUpStatus(e.target.value);
                        setPage(1);
                      }}
                      className="w-full h-9 pr-3 pl-8 text-xs bg-amber-50/60 border border-amber-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none text-amber-900 font-bold appearance-none bg-none cursor-pointer"
                    >
                      <option value="all">جميع حالات المتابعة الحية</option>
                      <option value="overdue">⚠️ المتأخرات عن العودة فقط (تجاوزن المدة)</option>
                      <option value="active">⏳ سارية ضمن المدة المحددة</option>
                    </select>
                    <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-amber-700">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                ) : (
                  /* Foreign Office filter for permanent departures */
                  <div className="sm:col-span-1 lg:col-span-3 relative">
                    <select
                      value={selectedOffice}
                      onChange={(e) => {
                        setSelectedOffice(e.target.value);
                        setPage(1);
                      }}
                      className="w-full h-9 pr-3 pl-8 text-xs bg-gray-50/70 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none text-gray-700 font-bold appearance-none bg-none cursor-pointer"
                    >
                      <option value="">جميع المكاتب الخارجية</option>
                      {offices.map((off) => (
                        <option key={off.id} value={off.id}>
                          {off.office} {off.Country ? `(${off.Country})` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-gray-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                )}

                {/* Page Size & Reset Filter (3 cols) */}
                <div className="sm:col-span-1 lg:col-span-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-gray-500">عرض:</span>
                    <div className="relative">
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setPage(1);
                        }}
                        className="h-9 pr-2.5 pl-7 text-xs bg-gray-50/70 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none text-gray-700 font-bold appearance-none bg-none cursor-pointer"
                      >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                      </select>
                      <div className="absolute inset-y-0 left-1.5 flex items-center pointer-events-none text-gray-400">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {Boolean(
                    searchQuery ||
                    selectedNationality ||
                    selectedLocation ||
                    selectedContractType ||
                    fromDate ||
                    toDate ||
                    (activeSection === 'temporary' && followUpStatus !== 'all') ||
                    (activeSection === 'permanent' && selectedOffice)
                  ) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedNationality('');
                        setSelectedLocation('');
                        setSelectedContractType('');
                        setFromDate('');
                        setToDate('');
                        setFollowUpStatus('all');
                        setSelectedOffice('');
                        setPage(1);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 font-bold transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>إلغاء الفلاتر</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Main Table Container (Zero Horizontal Scroll) */}
            <div className="w-full overflow-hidden">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr
                    className="text-white font-bold border-b text-[11px] bg-teal-900/95 border-teal-950/20"
                  >
                    <th className="py-2.5 px-2 text-center w-8 shrink-0">#</th>
                    <th className="py-2.5 px-2">العاملة والجنسية</th>
                    <th className="py-2.5 px-2">الكفيل الحالي (القديم)</th>
                    {activeCategory === 'trial_transfer' ? (
                      <>
                        <th className="py-2.5 px-2">الكفيل الجديد</th>
                        <th className="py-2.5 px-1 text-center">فترة التجربة</th>
                        <th className="py-2.5 px-1 text-center">البيانات المالية</th>
                        <th className="py-2.5 px-2">تاريخ المغادرة والسكن</th>
                      </>
                    ) : activeCategory === 'medical' ? (
                      <>
                        <th className="py-2.5 px-2">المستشفى / المركز</th>
                        <th className="py-2.5 px-2">التشخيص الطبي والحالة</th>
                        <th className="py-2.5 px-2">تاريخ المغادرة والسكن</th>
                        <th className="py-2.5 px-2 text-center">تاريخ العودة والمدة</th>
                        <th className="py-2.5 px-1 text-center">التقرير</th>
                      </>
                    ) : activeCategory === 'temp_all' ? (
                      <>
                        <th className="py-2.5 px-2">نوع ووجهة المغادرة</th>
                        <th className="py-2.5 px-2">تاريخ المغادرة والسكن</th>
                        <th className="py-2.5 px-2 text-center">تاريخ العودة والمدة</th>
                        <th className="py-2.5 px-1 text-center">السكن والمرفقات</th>
                      </>
                    ) : (
                      <>
                        <th className="py-2.5 px-2">مسار وسبب المغادرة</th>
                        <th className="py-2.5 px-2">تاريخ المغادرة والسكن</th>
                        <th className="py-2.5 px-1 text-center">السكن السابق</th>
                        <th className="py-2.5 px-1 text-center">المرفقات</th>
                      </>
                    )}
                    <th className="py-2.5 px-2 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-3 border-teal-700 border-t-transparent"></div>
                          <span className="text-xs font-bold text-teal-800">جاري تحميل سجلات المغادرات...</span>
                        </div>
                      </td>
                    </tr>
                  ) : workers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                            <FileText className="w-7 h-7" />
                          </div>
                          <p className="text-sm font-bold text-gray-700">لا توجد سجلات مطابقة للبحث أو الفلتر في هذا القسم</p>
                          <p className="text-xs text-gray-400">يمكنك تعديل خيارات البحث أو اختيار تبويب آخر</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    workers.map((worker, idx) => {
                      const workerName = getWorkerName(worker);
                      const passport = getPassportNumber(worker);
                      const nationality = getNationality(worker);
                      const oldSponsor = getOldSponsorName(worker);
                      const oldSponsorPhone = getOldSponsorPhone(worker);
                      const isExternal = Boolean(worker.externalHomedmaidId || worker.externalHomedmaid);
                      const locName =
                        (worker as any).location?.location ||
                        locations.find((l) => l.id === worker.location_id)?.location ||
                        (typeof (worker as any).location === 'string' ? (worker as any).location : '') ||
                        'غير محدد';
                      const tsd = worker.transferSponsorshipData;
                      const trialStatus = getTrialPeriodStatus(worker);
                      const medStatus = getMedicalReturnStatus(worker);

                      // Determine badge style for departure reason
                      const reasonText = worker.deparatureReason || 'مغادرة السكن';
                      const isCompletedTransfer = reasonText.includes('تم نقل الكفالة');
                      const isTrial = !isCompletedTransfer && Boolean(tsd);
                      const isMed = !isCompletedTransfer && !worker.deportationData && Boolean(worker.medicalDepartureData);
                      const isDeport = Boolean(worker.deportationData) || reasonText.includes('ترحيل') || reasonText.includes('خارجية');
                      const isExpiredTrial = isTrial && Boolean(trialStatus?.isExpired) && activeSection === 'temporary';
                      const isOverdueMed = isMed && Boolean(medStatus?.isOverdue) && activeSection === 'temporary';
                      const isOverdue = isExpiredTrial || isOverdueMed;

                      return (
                        <tr
                          key={worker.id}
                          className={`transition-colors ${
                            isOverdue
                              ? 'bg-red-50/40 hover:bg-red-50/70 border-r-4 border-r-red-600'
                              : isTrial
                              ? 'bg-emerald-50/25 hover:bg-emerald-50/50 border-r-4 border-r-emerald-600'
                              : isMed
                              ? 'bg-rose-50/25 hover:bg-rose-50/50 border-r-4 border-r-rose-600'
                              : isCompletedTransfer
                              ? 'bg-teal-50/25 hover:bg-teal-50/50 border-r-4 border-r-teal-600'
                              : 'hover:bg-gray-50/60 border-r-4 border-r-transparent'
                          }`}
                        >
                          {/* Row Number */}
                          <td className="py-2.5 px-2 text-center text-gray-400 font-mono w-8">
                            {(page - 1) * pageSize + idx + 1}
                          </td>

                          {/* Worker Details */}
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2">
                              <div className="relative shrink-0">
                                {worker.externalHomedmaid?.image ? (
                                  <img
                                    src={worker.externalHomedmaid.image}
                                    alt={workerName}
                                    className="w-8 h-8 rounded-lg object-cover border border-gray-200"
                                  />
                                ) : (
                                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs ${
                                    isExpiredTrial
                                      ? 'bg-red-100 text-red-700 border-red-300'
                                      : 'bg-teal-100/70 border-teal-200 text-teal-800'
                                  }`}>
                                    <Users className="w-4 h-4" />
                                  </div>
                                )}
                                {isExternal && (
                                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-teal-700 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                                    خ
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-gray-900 block truncate text-xs" title={workerName}>
                                    {workerName}
                                  </span>
                                  {isExpiredTrial && (
                                    <span
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-red-100 text-red-700 border border-red-300 animate-pulse shrink-0 shadow-sm"
                                      title="انتهت فترة التجربة ولم تعد للسكن أو يُتم نقل كفالتها"
                                    >
                                      <AlertCircle className="w-2.5 h-2.5 text-red-600 shrink-0" />
                                      <span>انتهت التجربة</span>
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                                  <span>{passport}</span>
                                  <span>•</span>
                                  <span className="font-sans text-teal-800 font-medium">{nationality}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Old Sponsor */}
                          <td className="py-2.5 px-2">
                            <div className="space-y-0.5 min-w-0">
                              <span className="font-bold text-gray-800 block truncate text-xs" title={oldSponsor}>
                                {oldSponsor}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono block truncate" dir="ltr">
                                {oldSponsorPhone}
                              </span>
                            </div>
                          </td>

                          {/* Columns based on Category */}
                          {activeCategory === 'trial_transfer' ? (
                            <>
                              {/* New Sponsor */}
                              <td className="py-2.5 px-2">
                                {tsd?.newSponsorName ? (
                                  <div className="space-y-0.5 min-w-0">
                                    <span className="font-bold text-teal-900 block truncate text-xs" title={tsd.newSponsorName}>
                                      {tsd.newSponsorName}
                                    </span>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono" dir="ltr">
                                      <span className="truncate">{tsd.newSponsorPhone || '—'}</span>
                                      {tsd.newSponsorCity && (
                                        <span className="font-sans text-gray-600 shrink-0">({tsd.newSponsorCity})</span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>

                              {/* Trial Period & Countdown */}
                              <td className="py-2.5 px-1 text-center">
                                {trialStatus ? (
                                  <div className="inline-flex flex-col items-center gap-0.5">
                                    <span className="font-bold text-[11px] text-gray-800">
                                      {trialStatus.totalDays} أيام
                                    </span>
                                    {trialStatus.isExpired ? (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-red-100 text-red-700 border border-red-200">
                                        انتهت التجربة
                                      </span>
                                    ) : trialStatus.isToday ? (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                        اليوم!
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        باقي {trialStatus.remainingDays} يوم
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>

                              {/* Financial Details */}
                              <td className="py-2.5 px-1 text-center font-mono">
                                {tsd?.totalCost ? (
                                  <div className="space-y-0.5">
                                    <div className="text-[11px] font-bold text-gray-900">
                                      {Number(tsd.totalCost).toLocaleString('en-US')} ر.س
                                    </div>
                                    <div className="text-[9px] text-emerald-700 font-semibold">
                                      مدفوع: {Number(tsd.paidAmount || 0).toLocaleString('en-US')}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>

                              {/* Dates & Stay */}
                              <td className="py-2.5 px-2 font-mono">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1 text-gray-900 font-bold text-[11px]">
                                    <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span>{formatDate(worker.deparatureHousingDate)}</span>
                                  </div>
                                  <div className="text-[9px] text-gray-500 flex items-center gap-1 font-sans">
                                    <span>السكن:</span>
                                    <span className="font-bold text-teal-800">
                                      {getHousingStayDuration(worker.houseentrydate, worker.deparatureHousingDate)}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            </>
                          ) : activeCategory === 'medical' ? (
                            <>
                              {/* المستشفى / المركز الطبي */}
                              <td className="py-2.5 px-2">
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <FaHospital className="w-3 h-3 text-rose-700 shrink-0" />
                                    <strong className="text-gray-900 font-bold block truncate text-xs" title={worker.medicalDepartureData?.hospitalName}>
                                      {worker.medicalDepartureData?.hospitalName || 'غير محدد'}
                                    </strong>
                                  </div>
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[9px] font-bold">
                                    متابعة طبية
                                  </span>
                                </div>
                              </td>

                              {/* التشخيص الطبي والحالة */}
                              <td className="py-2.5 px-2">
                                <div className="space-y-0.5 min-w-0">
                                  <span className="text-gray-900 font-bold block text-xs truncate" title={worker.medicalDepartureData?.diagnosis}>
                                    {worker.medicalDepartureData?.diagnosis || '—'}
                                  </span>
                                  {worker.medicalDepartureData?.notes && (
                                    <p className="text-[10px] text-gray-500 truncate" title={worker.medicalDepartureData.notes}>
                                      {worker.medicalDepartureData.notes}
                                    </p>
                                  )}
                                </div>
                              </td>

                              {/* تاريخ المغادرة من السكن */}
                              <td className="py-2.5 px-2 font-mono">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1 text-gray-900 font-bold text-[11px]">
                                    <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span>{formatDate(worker.deparatureHousingDate)}</span>
                                  </div>
                                  <div className="text-[9px] text-gray-500 flex items-center gap-1 font-sans">
                                    <span>السكن:</span>
                                    <span className="font-bold text-teal-800">
                                      {getHousingStayDuration(worker.houseentrydate, worker.deparatureHousingDate)}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* تاريخ العودة والمدة */}
                              <td className="py-2.5 px-2 font-mono text-center">
                                <div className="space-y-0.5">
                                  <div className={`flex items-center justify-center gap-1 font-bold text-[11px] ${
                                    medStatus?.isOverdue ? 'text-red-700 font-extrabold' : 'text-gray-900'
                                  }`}>
                                    <Calendar className={`w-3 h-3 shrink-0 ${medStatus?.isOverdue ? 'text-red-600' : 'text-rose-500'}`} />
                                    <span>
                                      {medStatus?.returnDateFormatted || (worker.medicalDepartureData?.expectedReturnDate
                                        ? worker.medicalDepartureData.expectedReturnDate.replace(/-/g, '/')
                                        : '—')}
                                    </span>
                                  </div>
                                  <div className="text-[9px] font-sans flex items-center justify-center gap-1">
                                    {medStatus?.isOverdue ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-red-100 text-red-700 border border-red-200">
                                        <Clock className="w-2.5 h-2.5 text-red-600" />
                                        {medStatus.daysOverdue === 1
                                          ? 'متأخرة يوم واحد'
                                          : medStatus.daysOverdue === 2
                                          ? 'متأخرة يومين'
                                          : `متأخرة ${medStatus.daysOverdue} أيام`}
                                      </span>
                                    ) : medStatus?.isToday ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                        <Clock className="w-2.5 h-2.5 text-amber-700" />
                                        موعد العودة اليوم
                                      </span>
                                    ) : (
                                      <div className="text-gray-500 flex items-center justify-center gap-1">
                                        <span>المدة:</span>
                                        <span className="font-bold text-rose-800">
                                          {worker.medicalDepartureData?.expectedStayDays
                                            ? `${worker.medicalDepartureData.expectedStayDays} يوم`
                                            : 'غير محددة'}
                                        </span>
                                        {medStatus && medStatus.remainingDays > 0 && (
                                          <span className="text-emerald-700 font-bold mr-1">
                                            (متبقي {medStatus.remainingDays} يوم)
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* التقرير الطبي والمرفقات */}
                              <td className="py-2.5 px-1 text-center">
                                <div className="flex items-center justify-center gap-1 flex-wrap">
                                  {worker.medicalDepartureData?.medicalReportFile && (
                                    <a
                                      href={worker.medicalDepartureData.medicalReportFile}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-[10px] transition-colors shadow-sm"
                                      title="معاينة التقرير الطبي"
                                    >
                                      <FileText className="w-3 h-3 text-rose-700" />
                                      <span>التقرير</span>
                                    </a>
                                  )}
                                  {worker.deparatureAttachment && (
                                    <a
                                      href={worker.deparatureAttachment}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold text-[10px] transition-colors shadow-sm"
                                      title="مرفق إضافي"
                                    >
                                      <Paperclip className="w-3 h-3 text-gray-600" />
                                      <span>مرفق</span>
                                    </a>
                                  )}
                                  {!worker.medicalDepartureData?.medicalReportFile && !worker.deparatureAttachment && (
                                    <span className="text-gray-400 text-[10px]">بدون مرفق</span>
                                  )}
                                </div>
                              </td>
                            </>
                          ) : activeCategory === 'temp_all' ? (
                            <>
                              {/* نوع ووجهة المغادرة */}
                              <td className="py-2.5 px-2">
                                <div className="space-y-0.5 min-w-0">
                                  {isTrial ? (
                                    <>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">
                                        <UserCheck className="w-3 h-3 text-emerald-700" />
                                        <span>تجربة نقل كفالة</span>
                                      </span>
                                      <p className="text-[10px] text-gray-700 font-bold truncate" title={tsd?.newSponsorName}>
                                        {tsd?.newSponsorName ? `الجديد: ${tsd.newSponsorName}` : '—'}
                                      </p>
                                    </>
                                  ) : isMed ? (
                                    <>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-sm">
                                        <FaHospital className="w-3 h-3 text-rose-700" />
                                        <span>متابعة طبية</span>
                                      </span>
                                      <p className="text-[10px] text-gray-700 font-bold truncate" title={worker.medicalDepartureData?.hospitalName}>
                                        {worker.medicalDepartureData?.hospitalName || 'مستشفى'}
                                      </p>
                                    </>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 truncate">
                                      <span>{reasonText}</span>
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* تاريخ المغادرة من السكن */}
                              <td className="py-2.5 px-2 font-mono">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1 text-gray-900 font-bold text-[11px]">
                                    <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span>{formatDate(worker.deparatureHousingDate)}</span>
                                  </div>
                                  <div className="text-[9px] text-gray-500 flex items-center gap-1 font-sans">
                                    <span>السكن:</span>
                                    <span className="font-bold text-teal-800">
                                      {getHousingStayDuration(worker.houseentrydate, worker.deparatureHousingDate)}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* تاريخ العودة / الانتهاء والمدة */}
                              <td className="py-2.5 px-2 font-mono text-center">
                                {isTrial ? (
                                  <div className="space-y-0.5">
                                    <div className="flex items-center justify-center gap-1 text-gray-900 font-bold text-[11px]">
                                      <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>
                                        {trialStatus?.endDateFormatted || (tsd?.trialEndDate ? tsd.trialEndDate.replace(/-/g, '/') : '—')}
                                      </span>
                                    </div>
                                    <div className="text-[9px] font-sans">
                                      {trialStatus?.isExpired ? (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-red-100 text-red-700 border border-red-200">
                                          انتهت التجربة
                                        </span>
                                      ) : trialStatus?.isToday ? (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                          تنتهي اليوم
                                        </span>
                                      ) : (
                                        <span className="text-emerald-800 font-bold">متبقي {trialStatus?.remainingDays} يوم</span>
                                      )}
                                    </div>
                                  </div>
                                ) : isMed ? (
                                  <div className="space-y-0.5">
                                    <div className={`flex items-center justify-center gap-1 font-bold text-[11px] ${
                                      medStatus?.isOverdue ? 'text-red-700 font-extrabold' : 'text-gray-900'
                                    }`}>
                                      <Calendar className={`w-3 h-3 shrink-0 ${medStatus?.isOverdue ? 'text-red-600' : 'text-rose-500'}`} />
                                      <span>
                                        {medStatus?.returnDateFormatted || (worker.medicalDepartureData?.expectedReturnDate
                                          ? worker.medicalDepartureData.expectedReturnDate.replace(/-/g, '/')
                                          : '—')}
                                      </span>
                                    </div>
                                    <div className="text-[9px] font-sans flex items-center justify-center gap-1">
                                      {medStatus?.isOverdue ? (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-red-100 text-red-700 border border-red-200">
                                          <Clock className="w-2.5 h-2.5 text-red-600" />
                                          {medStatus.daysOverdue === 1
                                            ? 'متأخرة يوم واحد'
                                            : medStatus.daysOverdue === 2
                                            ? 'متأخرة يومين'
                                            : `متأخرة ${medStatus.daysOverdue} أيام`}
                                        </span>
                                      ) : medStatus?.isToday ? (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                          <Clock className="w-2.5 h-2.5 text-amber-700" />
                                          موعد العودة اليوم
                                        </span>
                                      ) : (
                                        <div className="text-gray-500 flex items-center justify-center gap-1">
                                          <span>المدة:</span>
                                          <span className="font-bold text-rose-800">
                                            {worker.medicalDepartureData?.expectedStayDays
                                              ? `${worker.medicalDepartureData.expectedStayDays} يوم`
                                              : 'غير محددة'}
                                          </span>
                                          {medStatus && medStatus.remainingDays > 0 && (
                                            <span className="text-emerald-700 font-bold mr-1">
                                              (متبقي {medStatus.remainingDays} يوم)
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">—</span>
                                )}
                              </td>

                              {/* السكن والمرفقات */}
                              <td className="py-2.5 px-1 text-center">
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-bold text-[10px] truncate max-w-[90px]">
                                    <Building className="w-2.5 h-2.5 text-gray-500 shrink-0" />
                                    <span className="truncate">{locName}</span>
                                  </span>
                                  <div className="flex items-center justify-center gap-1 flex-wrap">
                                    {tsd?.paymentReceiptFile && (
                                      <a
                                        href={tsd.paymentReceiptFile}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="إيصال السداد"
                                        className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                                      >
                                        <DollarSign className="w-3 h-3" />
                                      </a>
                                    )}
                                    {worker.medicalDepartureData?.medicalReportFile && (
                                      <a
                                        href={worker.medicalDepartureData.medicalReportFile}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="التقرير الطبي"
                                        className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                                      >
                                        <FaHospital className="w-3 h-3" />
                                      </a>
                                    )}
                                    {worker.deparatureAttachment && (
                                      <a
                                        href={worker.deparatureAttachment}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="مرفق إضافي"
                                        className="p-1 rounded bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors"
                                      >
                                        <Paperclip className="w-3 h-3 text-gray-600" />
                                      </a>
                                    )}
                                    {!tsd?.paymentReceiptFile && !worker.medicalDepartureData?.medicalReportFile && !worker.deparatureAttachment && (
                                      <span className="text-gray-400 text-[9px]">بدون مرفق</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              {/* Departure Reason Badge & Specific Notes */}
                              <td className="py-2.5 px-2">
                                <div className="space-y-0.5 min-w-0">
                                  {isTrial ? (
                                    <div className="space-y-0.5">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">
                                        <UserCheck className="w-3 h-3 text-emerald-700" />
                                        <span>تجربة نقل كفالة</span>
                                      </span>
                                      {trialStatus && (
                                        <div className="text-[9px] font-bold text-emerald-800 flex items-center gap-1">
                                          <Clock className="w-2.5 h-2.5 text-emerald-600" />
                                          <span>
                                            {trialStatus.isExpired
                                              ? 'انتهت التجربة'
                                              : `متبقي ${trialStatus.remainingDays} يوم`}
                                          </span>
                                        </div>
                                      )}
                                      {worker.transferSponsorshipData?.notes && (
                                        <p className="text-[9px] text-emerald-700 font-medium truncate" title={worker.transferSponsorshipData.notes}>
                                          {worker.transferSponsorshipData.notes}
                                        </p>
                                      )}
                                    </div>
                                  ) : isMed ? (
                                    <div className="space-y-0.5">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-sm">
                                        <FaHospital className="w-3 h-3 text-rose-700" />
                                        <span>متابعة طبية</span>
                                      </span>
                                      {worker.medicalDepartureData?.expectedStayDays && (
                                        <div className="text-[9px] font-bold text-rose-800 flex items-center gap-1">
                                          <Clock className="w-2.5 h-2.5 text-rose-600" />
                                          <span>المدة: {worker.medicalDepartureData.expectedStayDays} يوم</span>
                                        </div>
                                      )}
                                      {(worker.medicalDepartureData?.diagnosis || worker.medicalDepartureData?.notes) && (
                                        <p className="text-[9px] text-rose-700 font-medium truncate" title={worker.medicalDepartureData?.notes || worker.medicalDepartureData?.diagnosis}>
                                          {worker.medicalDepartureData?.diagnosis ? `التشخيص: ${worker.medicalDepartureData.diagnosis}` : worker.medicalDepartureData?.notes}
                                        </p>
                                      )}
                                    </div>
                                  ) : isCompletedTransfer ? (
                                    <div className="space-y-0.5">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 shadow-sm">
                                        <CheckCircle2 className="w-3 h-3 text-teal-700" />
                                        <span>تم نقل الكفالة</span>
                                      </span>
                                    </div>
                                  ) : isDeport ? (
                                    <div className="space-y-0.5">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 truncate">
                                        <Plane className="w-2.5 h-2.5 text-sky-700 shrink-0" />
                                        <span className="truncate">{reasonText}</span>
                                      </span>
                                      {(worker.deportationData?.notes || (worker.deportationData?.externalReason && worker.deportationData.externalReason !== reasonText)) && (
                                        <p className="text-[9px] text-sky-700 font-medium truncate" title={worker.deportationData?.notes || worker.deportationData?.externalReason}>
                                          {worker.deportationData?.notes || worker.deportationData?.externalReason}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-0.5">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 truncate">
                                        <span className="truncate">{reasonText}</span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Dates & Stay */}
                              <td className="py-2.5 px-2 font-mono">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1 text-gray-900 font-bold text-[11px]">
                                    <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span>{formatDate(worker.deparatureHousingDate)}</span>
                                  </div>
                                  <div className="text-[9px] text-gray-500 flex items-center gap-1 font-sans">
                                    <span>السكن:</span>
                                    <span className="font-bold text-teal-800">
                                      {getHousingStayDuration(worker.houseentrydate, worker.deparatureHousingDate)}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Location */}
                              <td className="py-2.5 px-1 text-center">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-bold text-[10px] truncate max-w-[90px]">
                                  <Building className="w-2.5 h-2.5 text-gray-500 shrink-0" />
                                  <span className="truncate">{locName}</span>
                                </span>
                              </td>

                              {/* Attachments quick preview */}
                              <td className="py-2.5 px-1 text-center">
                                <div className="flex items-center justify-center gap-1 flex-wrap">
                                  {/* Payment Receipt */}
                                  {tsd?.paymentReceiptFile && (
                                    <a
                                      href={tsd.paymentReceiptFile}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="إيصال السداد"
                                      className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                                    >
                                      <DollarSign className="w-3 h-3" />
                                    </a>
                                  )}
                                  {/* Salary Certificate */}
                                  {tsd?.salaryCertificateFile && (
                                    <a
                                      href={tsd.salaryCertificateFile}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="تعريف الراتب"
                                      className="p-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-colors"
                                    >
                                      <FileText className="w-3 h-3" />
                                    </a>
                                  )}
                                  {/* National Address */}
                                  {tsd?.nationalAddressFile && (
                                    <a
                                      href={tsd.nationalAddressFile}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="العنوان الوطني"
                                      className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                                    >
                                      <MapPin className="w-3 h-3" />
                                    </a>
                                  )}
                                  {/* Flight Ticket */}
                                  {worker.deportationData?.externalTicketFile && (
                                    <a
                                      href={worker.deportationData.externalTicketFile}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="تذكرة السفر"
                                      className="p-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors"
                                    >
                                      <Plane className="w-3 h-3" />
                                    </a>
                                  )}
                                  {/* Medical Report */}
                                  {worker.medicalDepartureData?.medicalReportFile && (
                                    <a
                                      href={worker.medicalDepartureData.medicalReportFile}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="التقرير الطبي"
                                      className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                                    >
                                      <FaHospital className="w-3 h-3" />
                                    </a>
                                  )}
                                  {/* External Photo */}
                                  {worker.deportationData?.departurePhoto && (
                                    <a
                                      href={worker.deportationData.departurePhoto}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="صورة المغادرة"
                                      className="p-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-colors"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </a>
                                  )}
                                  {!tsd?.paymentReceiptFile && !tsd?.salaryCertificateFile && !tsd?.nationalAddressFile && !worker.deportationData?.externalTicketFile && !worker.medicalDepartureData?.medicalReportFile && !worker.deportationData?.departurePhoto && (
                                    <span className="text-gray-400 text-[10px]">—</span>
                                  )}
                                </div>
                              </td>
                            </>
                          )}

                          {/* Actions */}
                          <td className="py-2.5 px-2 text-left">
                            <div className="flex items-center justify-end gap-1" dir="rtl">
                              {/* For active trial transfers in temporary section: Show (نجاح التجربة) & (فشل التجربة) */}
                              {isTrial && activeSection === 'temporary' ? (
                                <>
                                  {/* نجاح التجربة والتحويل لمعاملة نقل الكفالة */}
                                  <button
                                    type="button"
                                    onClick={() => handleSuccessTrial(worker)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] shadow-sm transition-colors cursor-pointer shrink-0"
                                    title="نجاح التجربة والانتقال لإضافة معاملة نقل الكفالة وإتمام الإجراءات"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>نجاح التجربة</span>
                                  </button>

                                  {/* فشل التجربة */}
                                  <button
                                    type="button"
                                    onClick={() => setFailTrialWorker(worker)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[11px] shadow-sm transition-colors cursor-pointer shrink-0"
                                    title="فشل التجربة واستعادة العاملة للسكن"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 text-rose-700" />
                                    <span>فشل التجربة</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  {/* Re-housing Button for non-trial temporary departures */}
                                  {activeSection === 'temporary' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRehousingWorker(worker);
                                        setRehousingForm({
                                          houseentrydate: new Date().toISOString().split('T')[0],
                                          Reason: `إعادة تسكين بعد ${worker.deparatureReason || 'مغادرة السكن'}`,
                                          location: worker.location_id ? String(worker.location_id) : '',
                                        });
                                      }}
                                      className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer shrink-0"
                                      title="إعادة تسكين العاملة بالسكن"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}

                              {/* View Details Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedDetailWorker(worker)}
                                className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors cursor-pointer shrink-0"
                                title="عرض التفاصيل الكاملة والمرفقات"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Notes Button */}
                              <button
                                type="button"
                                onClick={() => setNotesWorker(worker)}
                                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors cursor-pointer shrink-0"
                                title="سجل الملاحظات"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-3 bg-gray-50/50">
                <div className="text-xs text-gray-500">
                  عرض صفحة <span className="font-bold text-gray-900 font-mono">{page}</span> من{' '}
                  <span className="font-bold text-gray-900 font-mono">{totalPages}</span> (إجمالي{' '}
                  <span className="font-bold text-teal-800 font-mono">{totalCount}</span> سجل)
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = page;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold font-mono transition-all ${
                          page === pageNum
                            ? 'bg-teal-700 text-white shadow-sm'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 👁️ Modal: Full Departure Details View */}
      {/* ============================================================== */}
      {selectedDetailWorker && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto"
          onClick={() => setSelectedDetailWorker(null)}
          dir="rtl"
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-l from-teal-900 via-teal-800 to-teal-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <FileText className="w-5 h-5 text-teal-200" />
                </div>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <span>تفاصيل المغادرة الكاملة</span>
                    <span className="text-xs bg-teal-700 text-teal-100 px-2 py-0.5 rounded-md font-mono">
                      #{selectedDetailWorker.id}
                    </span>
                  </h2>
                  <p className="text-xs text-teal-200/80 mt-0.5">
                    العاملة: {getWorkerName(selectedDetailWorker)} ({getPassportNumber(selectedDetailWorker)})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailWorker(null)}
                className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
              {/* Section 1: Basic Worker & Old Sponsor Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Worker Card */}
                <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-teal-900 font-bold text-xs border-b border-teal-200 pb-1.5">
                    <Users className="w-4 h-4 text-teal-700" />
                    <span>بيانات العاملة</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-500 block">اسم العاملة:</span>
                      <strong className="text-gray-900">{getWorkerName(selectedDetailWorker)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">رقم الجواز:</span>
                      <span className="font-mono text-gray-800">{getPassportNumber(selectedDetailWorker)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">الجنسية:</span>
                      <span className="text-gray-800">{getNationality(selectedDetailWorker)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">تاريخ التسكين:</span>
                      <span className="font-mono text-gray-800">{formatDate(selectedDetailWorker.houseentrydate)}</span>
                    </div>
                  </div>
                </div>

                {/* Old Sponsor Card */}
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-xs border-b border-blue-200 pb-1.5">
                    <Building className="w-4 h-4 text-blue-700" />
                    <span>بيانات الكفيل القديم (الحالي)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-500 block">اسم الكفيل:</span>
                      <strong className="text-gray-900">{getOldSponsorName(selectedDetailWorker)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">رقم الجوال:</span>
                      <span className="font-mono text-gray-800" dir="ltr">{getOldSponsorPhone(selectedDetailWorker)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">تاريخ المغادرة:</span>
                      <span className="font-mono text-teal-800 font-bold">{formatDate(selectedDetailWorker.deparatureHousingDate)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">مدة الإقامة بالسكن:</span>
                      <span className="font-bold text-gray-900">{getHousingStayDuration(selectedDetailWorker.houseentrydate, selectedDetailWorker.deparatureHousingDate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Specific Path Details */}
              {/* Path A: Trial Transfer */}
              {selectedDetailWorker.transferSponsorshipData && (
                <div className="border border-teal-200 bg-white rounded-xl p-4 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                    <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                      <UserCheck className="w-4 h-4 text-teal-700" />
                      <span>تفاصيل تجربة نقل الكفالة والكفيل الجديد</span>
                    </div>
                    <span className="text-[11px] bg-teal-100 text-teal-900 font-bold px-2 py-0.5 rounded">
                      في المرحلة التجريبية
                    </span>
                  </div>

                  {/* New Sponsor Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div>
                      <span className="text-[10px] text-gray-500 block">اسم الكفيل الجديد:</span>
                      <strong className="text-gray-900">{selectedDetailWorker.transferSponsorshipData.newSponsorName || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">رقم الجوال الأساسي:</span>
                      <span className="font-mono text-gray-800" dir="ltr">{selectedDetailWorker.transferSponsorshipData.newSponsorPhone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">الهوية الوطنية:</span>
                      <span className="font-mono text-gray-800" dir="ltr">{selectedDetailWorker.transferSponsorshipData.newSponsorId || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">المدينة:</span>
                      <span className="text-gray-800">{selectedDetailWorker.transferSponsorshipData.newSponsorCity || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">مدة التجربة:</span>
                      <span className="font-bold text-teal-800">{selectedDetailWorker.transferSponsorshipData.trialPeriodDays || '—'} أيام</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">تاريخ انتهاء التجربة:</span>
                      <span className="font-mono text-teal-800 font-bold">{formatDate(selectedDetailWorker.transferSponsorshipData.trialEndDate)}</span>
                    </div>
                  </div>

                  {/* Financial Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-teal-50/50 rounded-lg border border-teal-200 text-xs font-mono text-center">
                    <div>
                      <span className="text-[10px] text-gray-500 block font-sans">المبلغ المتفق عليه</span>
                      <span className="text-sm font-bold text-gray-900">
                        {selectedDetailWorker.transferSponsorshipData.totalCost
                          ? `${Number(selectedDetailWorker.transferSponsorshipData.totalCost).toLocaleString('en-US')} ر.س`
                          : '0.00 ر.س'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block font-sans">المبلغ المدفوع</span>
                      <span className="text-sm font-bold text-teal-700">
                        {selectedDetailWorker.transferSponsorshipData.paidAmount
                          ? `${Number(selectedDetailWorker.transferSponsorshipData.paidAmount).toLocaleString('en-US')} ر.س`
                          : '0.00 ر.س'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block font-sans">المبلغ المتبقي</span>
                      <span className="text-sm font-bold text-gray-700">
                        {selectedDetailWorker.transferSponsorshipData.remainingAmount
                          ? `${Number(selectedDetailWorker.transferSponsorshipData.remainingAmount).toLocaleString('en-US')} ر.س`
                          : '0.00 ر.س'}
                      </span>
                    </div>
                  </div>

                  {/* Attachments Section */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-gray-700 block">المرفقات والوثائق:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Salary Certificate */}
                      {selectedDetailWorker.transferSponsorshipData.salaryCertificateFile ? (
                        <a
                          href={selectedDetailWorker.transferSponsorshipData.salaryCertificateFile}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-teal-50 border border-gray-200 rounded-lg text-xs text-teal-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-teal-700" />
                            <span className="font-bold">تعريف الراتب</span>
                          </div>
                          <Eye className="w-3.5 h-3.5 text-teal-600" />
                        </a>
                      ) : (
                        <div className="p-2.5 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400 text-center">
                          تعريف الراتب غير مرفق
                        </div>
                      )}

                      {/* National Address */}
                      {selectedDetailWorker.transferSponsorshipData.nationalAddressFile ? (
                        <a
                          href={selectedDetailWorker.transferSponsorshipData.nationalAddressFile}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-teal-50 border border-gray-200 rounded-lg text-xs text-teal-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-teal-700" />
                            <span className="font-bold">العنوان الوطني</span>
                          </div>
                          <Eye className="w-3.5 h-3.5 text-teal-600" />
                        </a>
                      ) : (
                        <div className="p-2.5 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400 text-center">
                          العنوان الوطني غير مرفق
                        </div>
                      )}

                      {/* Payment Receipt */}
                      {selectedDetailWorker.transferSponsorshipData.paymentReceiptFile ? (
                        <a
                          href={selectedDetailWorker.transferSponsorshipData.paymentReceiptFile}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-emerald-50 border border-gray-200 rounded-lg text-xs text-emerald-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-700" />
                            <span className="font-bold">إيصال السداد</span>
                          </div>
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        </a>
                      ) : (
                        <div className="p-2.5 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400 text-center">
                          إيصال السداد غير مرفق
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Path B: Deportation */}
              {selectedDetailWorker.deportationData && (
                <div className="border border-sky-200 bg-white rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 text-sky-900 font-bold text-xs border-b border-sky-100 pb-2">
                    <Plane className="w-4 h-4 text-sky-700" />
                    <span>بيانات الترحيل والمغادرة الخارجية</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-sky-50/50 p-3 rounded-lg border border-sky-200">
                    <div>
                      <span className="text-[10px] text-gray-500 block">سبب الترحيل:</span>
                      <strong className="text-gray-900">{selectedDetailWorker.deportationData.externalReason || 'ترحيل'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">مسؤول التوصيل للمطار:</span>
                      <span className="text-gray-800">{selectedDetailWorker.deportationData.deliveryOfficer || 'غير محدد'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">مدينة المغادرة:</span>
                      <span className="text-gray-800">{selectedDetailWorker.deportationData.externaldeparatureCity || 'غير محدد'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">مدينة / وجهة الوصول:</span>
                      <span className="text-gray-800">{selectedDetailWorker.deportationData.externalArrivalCity || 'غير محدد'}</span>
                    </div>
                  </div>

                  {/* Flight Ticket Attachment */}
                  {selectedDetailWorker.deportationData.externalTicketFile && (
                    <div className="pt-1">
                      <a
                        href={selectedDetailWorker.deportationData.externalTicketFile}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-bold text-sky-800 transition-colors"
                      >
                        <Plane className="w-4 h-4 text-sky-700" />
                        <span>معاينة تذكرة السفر المرفقة</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Path C: Medical */}
              {selectedDetailWorker.medicalDepartureData && (
                <div className="border border-rose-200 bg-white rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs border-b border-rose-100 pb-2">
                    <FaHospital className="w-4 h-4 text-rose-700" />
                    <span>بيانات المغادرة المرضية والفحص الطبي</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-rose-50/50 p-3 rounded-lg border border-rose-200">
                    <div>
                      <span className="text-[10px] text-gray-500 block">المستشفى / المركز الطبي:</span>
                      <strong className="text-gray-900">{selectedDetailWorker.medicalDepartureData.hospitalName || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">التشخيص الطبي:</span>
                      <span className="text-gray-800">{selectedDetailWorker.medicalDepartureData.diagnosis || '—'}</span>
                    </div>
                    {selectedDetailWorker.medicalDepartureData.expectedStayDays && (
                      <div>
                        <span className="text-[10px] text-gray-500 block">المدة المتوقعة للبقاء:</span>
                        <span className="text-gray-900 font-bold">{selectedDetailWorker.medicalDepartureData.expectedStayDays} يوم</span>
                      </div>
                    )}
                    {selectedDetailWorker.medicalDepartureData.expectedReturnDate && (() => {
                      const returnDay = new Date(selectedDetailWorker.medicalDepartureData.expectedReturnDate);
                      returnDay.setHours(0, 0, 0, 0);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const diffDays = Math.round((returnDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      const isOverdue = diffDays < 0;
                      const isToday = diffDays === 0;

                      return (
                        <div className={isOverdue ? 'col-span-2 bg-red-50 p-2.5 rounded-lg border border-red-200' : ''}>
                          <span className="text-[10px] text-gray-500 block">تاريخ العودة المتوقع:</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`font-mono font-bold ${isOverdue ? 'text-red-700 text-sm' : 'text-gray-900'}`} dir="ltr">
                              {selectedDetailWorker.medicalDepartureData.expectedReturnDate.replace(/-/g, '/')}
                            </span>
                            {isOverdue && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-red-600" />
                                {diffDays === -1
                                  ? 'متأخرة عن العودة منذ يوم واحد'
                                  : diffDays === -2
                                  ? 'متأخرة عن العودة منذ يومين'
                                  : `متأخرة عن العودة منذ ${Math.abs(diffDays)} أيام`}
                              </span>
                            )}
                            {isToday && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-700" />
                                موعد العودة اليوم
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Medical Report Attachment */}
                  {selectedDetailWorker.medicalDepartureData.medicalReportFile && (
                    <div className="pt-1">
                      <a
                        href={selectedDetailWorker.medicalDepartureData.medicalReportFile}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold text-rose-800 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-rose-700" />
                        <span>معاينة التقرير الطبي المرفق</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between gap-2 shrink-0">
              {activeSection === 'temporary' && selectedDetailWorker.transferSponsorshipData && (
                <button
                  type="button"
                  onClick={() => {
                    const w = selectedDetailWorker;
                    setSelectedDetailWorker(null);
                    handleSuccessTrial(w);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-900 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>تأكيد نجاح التجربة وإتمام نقل الكفالة</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedDetailWorker(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer mr-auto"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 🌟 Modal: Finalize Transfer Sponsorship (إتمام نقل الكفالة) */}
      {/* ============================================================== */}
      {finalizeTransferWorker && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          onClick={() => setFinalizeTransferWorker(null)}
          dir="rtl"
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-teal-900 bg-gradient-to-l from-teal-900 via-teal-800 to-teal-900 text-white px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-teal-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold">نجاح التجربة وإتمام نقل الكفالة</h3>
                  <p className="text-xs text-teal-200/90">{getWorkerName(finalizeTransferWorker)}</p>
                </div>
              </div>
              <button
                onClick={() => setFinalizeTransferWorker(null)}
                className="text-white/70 hover:text-white text-2xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Summary & Form */}
            <form onSubmit={handleFinalizeTransferSubmit} className="p-5 space-y-4">
              <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-3 space-y-1.5 text-xs text-teal-950">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">الكفيل الجديد:</span>
                  <span className="font-bold">{finalizeTransferWorker.transferSponsorshipData?.newSponsorName || 'غير محدد'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">الجوال:</span>
                  <span className="font-mono font-bold" dir="ltr">{finalizeTransferWorker.transferSponsorshipData?.newSponsorPhone || '—'}</span>
                </div>
                <div className="flex items-center justify-between border-t border-emerald-200/60 pt-1.5 mt-1.5">
                  <span className="text-gray-500">حالة الإجراء:</span>
                  <span className="font-bold text-teal-800">سيتم نقل العاملة إلى سجل المغادرات الدائمة</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">
                  تاريخ إتمام نقل الكفالة <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={finalizeTransferForm.completionDate}
                  onChange={(e) => setFinalizeTransferForm({ ...finalizeTransferForm, completionDate: e.target.value })}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">
                  ملاحظات إتمام النقل (اختياري)
                </label>
                <textarea
                  rows={2}
                  placeholder="أدخل أي ملاحظات إضافية حول اكتمال فترة التجربة واستلام المستحقات..."
                  value={finalizeTransferForm.notes}
                  onChange={(e) => setFinalizeTransferForm({ ...finalizeTransferForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setFinalizeTransferWorker(null)}
                  disabled={isSubmittingFinalizeTransfer}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFinalizeTransfer}
                  className="px-5 py-2 bg-teal-900 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingFinalizeTransfer ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                      <span>جاري التأكيد...</span>
                    </>
                  ) : (
                    <span>تأكيد نجاح التجربة وإتمام النقل</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 🛑 Modal: توثيق فشل التجربة وإرجاع العاملة للسكن (نفس موديول نقل الكفالة) */}
      {/* ============================================================== */}
      {failTrialWorker && (
        <FailTrialModal
          transfer={failTrialWorker}
          workerName={getWorkerName(failTrialWorker)}
          clientName={failTrialWorker.transferSponsorshipData?.newSponsorName || getOldSponsorName(failTrialWorker)}
          transferId={failTrialWorker.transferSponsorshipData?.id || null}
          housedWorkerId={failTrialWorker.id}
          onClose={() => setFailTrialWorker(null)}
          onSuccess={() => {
            setFailTrialWorker(null);
            fetchDepartedWorkers();
          }}
        />
      )}

      {/* ============================================================== */}
      {/* 🔄 Modal: Re-Housing (إعادة التسكين بالسكن للحالات الأخرى) */}
      {/* ============================================================== */}
      {rehousingWorker && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          onClick={() => setRehousingWorker(null)}
          dir="rtl"
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-teal-900 bg-gradient-to-l from-teal-900 via-teal-800 to-teal-900 text-white px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-5 h-5 text-teal-200" />
                <div>
                  <h3 className="text-base font-bold">إعادة تسكين العاملة بالسكن</h3>
                  <p className="text-xs text-teal-200/90">{getWorkerName(rehousingWorker)}</p>
                </div>
              </div>
              <button
                onClick={() => setRehousingWorker(null)}
                className="text-white/70 hover:text-white text-2xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRehousingSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">
                  تاريخ إعادة التسكين <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={rehousingForm.houseentrydate}
                  onChange={(e) => setRehousingForm({ ...rehousingForm, houseentrydate: e.target.value })}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">
                  مبنى / غرفة السكن
                </label>
                <select
                  value={rehousingForm.location}
                  onChange={(e) => setRehousingForm({ ...rehousingForm, location: e.target.value })}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                >
                  <option value="">تحديد السكن (اختياري)</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.location}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">
                  سبب إعادة التسكين
                </label>
                <input
                  type="text"
                  placeholder="مثال: انتهاء التجربة، عودة من التجربة، إلخ..."
                  value={rehousingForm.Reason}
                  onChange={(e) => setRehousingForm({ ...rehousingForm, Reason: e.target.value })}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setRehousingWorker(null)}
                  disabled={isSubmittingRehousing}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRehousing}
                  className="px-5 py-2 bg-teal-900 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingRehousing ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                      <span>جاري الحفظ...</span>
                    </>
                  ) : rehousingWorker.transferSponsorshipData ? (
                    <span>تأكيد استعادة العاملة للسكن</span>
                  ) : (
                    <span>تأكيد إعادة التسكين</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 📝 Modal: Notes & History */}
      {/* ============================================================== */}
      {notesWorker && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          onClick={() => setNotesWorker(null)}
          dir="rtl"
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-l from-teal-900 to-teal-800 text-white px-5 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-200" />
                <div>
                  <h3 className="text-base font-bold">سجل وملاحظات العاملة</h3>
                  <p className="text-xs text-teal-100">{getWorkerName(notesWorker)}</p>
                </div>
              </div>
              <button
                onClick={() => setNotesWorker(null)}
                className="text-white/70 hover:text-white text-2xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
              {notesWorker.HousedWorkerNotes && notesWorker.HousedWorkerNotes.length > 0 ? (
                notesWorker.HousedWorkerNotes.map((n) => (
                  <div key={n.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 border-b border-gray-100 pb-1">
                      <span className="font-bold text-teal-800">{n.employee || 'موظف'}</span>
                      <span className="font-mono">{formatDate(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-800 whitespace-pre-wrap">{n.notes}</p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  لا توجد ملاحظات مسجلة مسبقاً
                </div>
              )}
            </div>

            {/* Add Note Input */}
            <form onSubmit={handleAddNoteSubmit} className="p-4 bg-white border-t border-gray-200 space-y-2">
              <textarea
                rows={2}
                placeholder="أدخل ملاحظة جديدة للعاملة..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-teal-600 outline-none resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={!newNoteText.trim() || isAddingNote}
                  className="px-4 py-2 bg-teal-900 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isAddingNote ? 'جاري الحفظ...' : 'إضافة الملاحظة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export async function getServerSideProps({ req }: { req: any }) {
  try {
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie: any) => {
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
    if (!findUser) {
      return {
        redirect: { destination: "/admin/home", permanent: false },
      };
    }
    let rolePermissions = findUser?.role?.permissions as any;
    if (typeof rolePermissions === 'string') {
      try {
        rolePermissions = JSON.parse(rolePermissions);
      } catch {
        rolePermissions = {};
      }
    }

    const canCreateTransfer = rolePermissions?.['معاملات نقل الكفالة']?.['إنشاء'] === true || rolePermissions?.['معاملات نقل الكفالة']?.['انشاء'] === true;
    const canEditTransfer = rolePermissions?.['معاملات نقل الكفالة']?.['تعديل'] === true;
    const canViewTransfer = rolePermissions?.['معاملات نقل الكفالة']?.['عرض'] === true;

    return {
      props: {
        user: token.username || null,
        canCreateTransfer,
        canEditTransfer,
        canViewTransfer,
      },
    };
  } catch (err) {
    console.error("Authorization error:", err);
    return {
      redirect: { destination: "/admin/home", permanent: false },
    };
  }
}
