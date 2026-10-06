import Layout from 'example/containers/Layout';
import Head from 'next/head';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Style from 'styles/Home.module.css';
import { Plus, Search, FileText, RotateCcw, Settings, MoreHorizontal, Trash2, UserPlus, Phone, Check, Calendar, Clock, ShieldCheck, Building, Globe, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Smartphone, CreditCard, Activity, Package, CheckCircle2, XCircle, Tag, ClipboardCheck, Plane, Edit3, Camera, Upload, UploadCloud, Eye, User, MapPin, UserCheck, LogOut, AlertCircle, Users, Home as HomeIcon, DollarSign, Filter } from 'lucide-react';
import { DocumentTextIcon } from '@heroicons/react/outline';
import { FaAddressBook, FaUserFriends, FaPassport, FaIdCard, FaHome, FaExchangeAlt, FaHeartbeat, FaHospital } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useRouter } from 'next/router';
// Interfaces
// import "";
import ExcelJS from 'exceljs';
import { FileTextFilled } from '@ant-design/icons';
import TransferTrialWizardModal from 'components/TransferTrialWizardModal';
import type { TransferWizardWorker } from 'components/TransferTrialWizardModal';
import { getCountryFlagUrl } from 'lib/flagHelper';
import { useSidebar } from 'utils/sidebarcontext';
import Select from 'react-select';
import CityAutocomplete from 'components/CityAutocomplete';
import { tafqeet } from 'lib/tafqeet';

interface HousedWorker {
  id: number;
  homeMaid_id: number | null;
  location_id: number;
  houseentrydate: string;
  deparatureHousingDate: string | null;
  deparatureReason: string | null;
  transferSponsorshipData?: TransferSponsorshipData | null;
  status: string;
  employee: string;
  Reason: string;
  actionTaken?: string | null;
  medicalReportFile?: string | null;
  Details: string;
  expectedStayDuration?: string | null;
  deliveryDate?: string | null;
  deparatureDate?: string | null;
  Duration?: string | number | null;
  isHasEntitlements?: boolean;
  entitlementsCost?: number;
  entitlementReason?: string;
  salaryReceived?: boolean;
  salaryRemainingAmount?: number | string | null;
  hasPhone?: boolean;
  phoneReason?: string | null;
  hasIqama?: boolean;
  iqamaReason?: string | null;
  hasPassport?: boolean;
  passportReason?: string | null;
  hasPersonalItems?: boolean;
  personalItemsDetails?: string | null;
  medicalCheckDone?: boolean;
  visaType?: string | null;
  kingdomentryDate?: string | null;
  isExternal?: boolean | null;
  deportationData?: any;
  medicalDepartureData?: any;
  HousedWorkerNotes?: {
    id: number;
    notes: string;
    createdAt: string;
    employee?: string | null;
  }[];
  Order?: {
    id?: number;
    Name: string;
    phone?: string | null;
    dateofbirth?: string | null;
    Nationalitycopy: string;
    Passportnumber: string;
    NewOrder?: Array<{
      id?: number;
      typeOfContract: string;
      ClientName?: string | null;
      PhoneNumber?: string | null;
      clientphonenumber?: string | null;
      nationalId?: string | null;
      createdAt?: string;
      clientID?: number | null;
      arrivals?: Array<{ KingdomentryDate?: string; KingdomentryTime?: string; GuaranteeDurationEnd?: string | null }>;
      client?: { id?: number; fullname?: string | null; nationalId?: string | null; phonenumber?: string | null; city?: string | null } | null;
    }>;
  };
  externalHomedmaid?: {
    id: number;
    name: string | null;
    image?: string | null;
    nationality: string | null;
    nationalitySource: string | null;
    passportNumber: string | null;
    phone: string | null;
    dateofbirth?: string | null;
    type?: string | null;
    clientId?: number | null;
    Client?: { id?: number; fullname?: string | null; nationalId?: string | null; phonenumber?: string | null; city?: string | null } | null;
  };
}
interface EditWorkerForm {
  location_id: number | null;
  Reason: string;
  actionTaken?: string;
  medicalReportFile?: string;
  Details: string;
  employee: string;
  Date: string;
  deliveryDate: string;
  isHasEntitlements: boolean;
  entitlementsCost?: string;
  entitlementReason?: string;
  salaryReceived?: boolean;
  salaryRemainingAmount?: string;
  hasPhone?: boolean;
  phoneReason?: string;
  hasIqama?: boolean;
  iqamaReason?: string;
  hasPassport?: boolean;
  passportReason?: string;
  hasPersonalItems?: boolean;
  personalItemsDetails?: string;
  medicalCheckDone?: boolean;
  visaType?: string;
  maidName: string;
  maidPhone: string;
  maidDateOfBirth: string;
  /** سجل تسكين بعاملة خارجية (بدون homeMaid_id) */
  isExternal: boolean;
  extNationality: string;
  expectedStayDuration?: string;
  maidImage?: string;
}
interface DepartureForm {
  deparatureHousingDate: string;
  deparatureReason: string;
  status: string;
  transferSponsorshipData?: TransferSponsorshipData | null;
}

interface TransferSponsorshipData {
  newSponsorName: string;
  newSponsorPhone: string;
  newSponsorId: string;
  newSponsorDateOfBirth: string;
  financialAbilityAttachment: string;
  bankCertificateAttachment: string;
  trialPeriodType: 'days' | 'month';
  trialPeriodDays: string;
  trialStartDate: string;
  trialEndDate: string;
  trialDailyCost: string;
  originalSponsorGuaranteeEndDate: string;
  medicalCheckValid: '' | 'yes' | 'no';
  sponsorHasViolations: '' | 'yes' | 'no';
  sponsorHasWorkers: '' | 'yes' | 'no';
  sponsorWorkerCount: string;
  amountPaid: '' | 'yes' | 'no';
  paidAmount: string;
}
interface InHouseLocation {
  id: number;
  location: string;
  quantity: number;
  currentOccupancy?: number;
  supervisor?: number;
  supervisorUser?: {
    id: number;
    Name: string;
  };
}
interface Homemaid {
  id: number;
  Name: string;
}
function getDate(date?: string | Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Riyadh',
  }).format(d);
}

function getSaudiGuaranteeInfo(entryDateRaw?: string | Date | null) {
  if (!entryDateRaw) return null;
  const entryDateObj = new Date(entryDateRaw);
  if (isNaN(entryDateObj.getTime())) return null;

  const guaranteeEndObj = new Date(entryDateObj);
  guaranteeEndObj.setDate(guaranteeEndObj.getDate() + 90);

  const now = new Date();
  const diffDays = Math.ceil((guaranteeEndObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = diffDays < 0;

  return {
    entryDate: getDate(entryDateObj),
    guaranteeEndDate: getDate(guaranteeEndObj),
    diffDays,
    remainingDays: diffDays,
    isExpired,
    text: diffDays >= 0 ? `متبقي ${diffDays} يوم` : `منذ ${Math.abs(diffDays)} يوم`,
    fullStatus: isExpired ? 'الضمان منتهي' : 'الضمان ساري'
  };
}

function getHousingClientInfo(worker: HousedWorker): { name: string; nationalId: string; phone: string; clientId: number | null } {
  if (worker.externalHomedmaid) {
    const c = worker.externalHomedmaid.Client;
    const sid = worker.externalHomedmaid.clientId ?? c?.id;
    return {
      name: c?.fullname?.trim() || '',
      nationalId: c?.nationalId?.trim() || '',
      phone: c?.phonenumber?.trim() || '',
      clientId: sid != null && !Number.isNaN(Number(sid)) ? Number(sid) : null,
    };
  }
  const latestOrder = worker.Order?.NewOrder?.[0];
  if (!latestOrder) {
    return { name: '', nationalId: '', phone: '', clientId: null };
  }
  const c = latestOrder.client;
  const sid = latestOrder.clientID ?? c?.id;
  return {
    name: c?.fullname?.trim() || latestOrder.ClientName?.trim() || '',
    nationalId: c?.nationalId?.trim() || latestOrder.nationalId?.trim() || '',
    phone: c?.phonenumber?.trim() || latestOrder.clientphonenumber?.trim() || latestOrder.PhoneNumber?.trim() || '',
    clientId: sid != null && !Number.isNaN(Number(sid)) ? Number(sid) : null,
  };
}

function getHousingClientName(worker: HousedWorker): string {
  return getHousingClientInfo(worker).name;
}

/** كفيل العاملة في النظام (لنقل الكفالة — العميل القديم) */
function getOldSponsorClientId(worker: HousedWorker): number | null {
  return getHousingClientInfo(worker).clientId;
}

/** مطابق لصفحة مغادرات نقل الكفالة — فلتر سبب المغادرة في الـ API */
const DEPARTURE_REASON_TRANSFER = 'نقل الكفالة';
const DEFAULT_DEPARTURE_REASONS = ['انتهاء الخدمة', 'نقل السكن', 'رفض العمل', 'مرض', DEPARTURE_REASON_TRANSFER];

const createEmptyTransferSponsorshipData = (originalSponsorGuaranteeEndDate = ''): TransferSponsorshipData => ({
  newSponsorName: '',
  newSponsorPhone: '',
  newSponsorId: '',
  newSponsorDateOfBirth: '',
  financialAbilityAttachment: '',
  bankCertificateAttachment: '',
  trialPeriodType: 'days',
  trialPeriodDays: '',
  trialStartDate: '',
  trialEndDate: '',
  trialDailyCost: '',
  originalSponsorGuaranteeEndDate,
  medicalCheckValid: '',
  sponsorHasViolations: '',
  sponsorHasWorkers: '',
  sponsorWorkerCount: '',
  amountPaid: '',
  paidAmount: '',
});

const calculateTrialEndDate = (startDate: string, periodType: 'days' | 'month', days: string) => {
  if (!startDate) return '';
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return '';

  if (periodType === 'month') {
    start.setMonth(start.getMonth() + 1);
  } else {
    const periodDays = Number(days);
    if (!periodDays || Number.isNaN(periodDays)) return '';
    start.setDate(start.getDate() + periodDays);
  }

  return start.toISOString().split('T')[0];
};

function stayDaysFromDeparture(houseentrydate: string | null, departed: string | null): string {
  if (!houseentrydate || !departed) return 'غير محدد';
  const start = new Date(houseentrydate).getTime();
  const end = new Date(departed).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 'غير محدد';
  return String(Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)));
}

type HousingStatusTab = 'housed' | 'departed' | 'departed_transfer';

export const HOUSING_REASON_FILTER_OPTIONS = [
  'رفض الكفيل للعاملة',
  'رفض العاملة للكفيل',
  'عدم استلام الكفيل للعاملة بعد الوصول',
  'استلام من إيواء الوزارة (سلسك -slesk)',
  'حالة مرضية',
  'حمل',
  'تغييب عن العمل (هروب )',
  'وصول بالخطأ للمكتب',
  'استضافة مؤقتة',
  'عاملة بدون بيانات / مجهولة الكفيل',
  'بانتظار تسليم لمكتب آخر',
  'أخرى',
];

export const ACTION_TAKEN_FILTER_OPTIONS = [
  { value: 'نقل كفالة', label: 'نقل كفالة' },
  { value: 'ترحيل', label: 'ترحيل' },
  { value: 'قيد الانتظار', label: 'قيد الانتظار' },
];

export const WARRANTY_STATUS_FILTER_OPTIONS = [
  { value: 'valid', label: 'تحت الضمان (ساري)' },
  { value: 'expired', label: 'منتهي الضمان' },
];

export const STAY_DURATION_SORT_OPTIONS = [
  { value: 'longest', label: 'الأطول إقامة بالسكن (تنازلي)' },
  { value: 'shortest', label: 'الأقصر إقامة / الأحدث (تصاعدي)' },
];

export const NATIONALITY_FILTER_OPTIONS = [
  'الفلبين',
  'إثيوبيا',
  'كينيا',
  'أوغندا',
  'بنغلاديش',
  'سيريلانكا',
  'بوروندي',
  'الهند',
  'إندونيسيا',
  'مدغشقر',
  'إريتريا',
];

/** قوائم الجنسية من /api/housing/unique-nationalities؛ عند اختيار «أخرى» يفتح مودال لكتابة الجنسية */
function NationalityFieldWithList({
  label,
  items,
  value,
  onChange,
  required,
}: {
  label: string;
  items: string[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const nTrim = value || '';
  const inList = items.length > 0 && nTrim !== '' && items.includes(nTrim);
  const [otherModalOpen, setOtherModalOpen] = useState(false);
  const [otherDraft, setOtherDraft] = useState('');
  const [pickingOther, setPickingOther] = useState(false);

  useEffect(() => {
    if (nTrim && inList) setPickingOther(false);
  }, [nTrim, inList, items.length]);

  const selectValue =
    items.length > 0
      ? nTrim && !inList
        ? '__other__'
        : pickingOther && !nTrim
          ? '__other__'
          : nTrim
      : nTrim;

  return (
    <div>
      <label className="block text-md text-gray-700 mb-2">
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </label>
      {items.length > 0 ? (
        <div>
          <select
            value={selectValue}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '__other__') {
                setOtherDraft(nTrim && !items.includes(nTrim) ? nTrim : '');
                setPickingOther(true);
                setOtherModalOpen(true);
              } else {
                setPickingOther(false);
                onChange(v);
              }
            }}
            className="w-full border border-gray-300 rounded-md text-right text-md bg-gray-50 p-2"
          >
            <option value="">{required ? 'اختر من القائمة' : '—'}</option>
            {items.map((nat) => (
              <option key={nat} value={nat}>
                {nat}
              </option>
            ))}
            <option value="__other__">أخرى</option>
          </select>
          {otherModalOpen && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
              dir="rtl"
              onClick={() => {
                setOtherModalOpen(false);
                setPickingOther(false);
              }}
            >
              <div
                className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-medium text-gray-800 mb-4">إدخال الجنسية</h3>
                <input
                  type="text"
                  value={otherDraft}
                  onChange={(e) => setOtherDraft(e.target.value)}
                  placeholder="اكتب الجنسية"
                  className="w-full border border-gray-300 rounded-md p-2 text-right text-md mb-4"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md text-md"
                    onClick={() => {
                      setOtherModalOpen(false);
                      setPickingOther(false);
                    }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-teal-800 text-white rounded-md text-md"
                    onClick={() => {
                      const t = otherDraft.trim();
                      if (required && !t) return;
                      onChange(t);
                      setOtherModalOpen(false);
                      setPickingOther(false);
                    }}
                  >
                    حفظ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <input
          type="text"
          value={nTrim}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ادخل النص"
          className="w-full border border-gray-300 rounded-md p-2 text-right text-md bg-gray-50"
        />
      )}
    </div>
  );
}

// ActionDropdown Component
const ActionDropdown: React.FC<{
  homemaid_id: number;
  id: number;
  name: string;
  onEdit: (id: number, name: string) => void;
  onDeparture: (id: number, name: string) => void;
  openModal: (modalName: string) => void;onAddSession: (id: number) => void;onAddNotes: (id: number) => void;
  onRehousing?: (id: number, name: string) => void;
  isDeparted?: boolean;
  showTransferWizard?: boolean;
  onTransferWizard?: () => void;
}> = ({ homemaid_id, id, name, onEdit, onDeparture, openModal, onAddSession, onAddNotes, onRehousing, isDeparted, showTransferWizard, onTransferWizard }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  }>({ left: 0, top: 0, maxHeight: 320 });

  useEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const gap = 8;
      const menuWidth = menuRef.current?.offsetWidth || 176;
      const menuHeight = menuRef.current?.offsetHeight || 220;
      const viewportPadding = 8;
      const spaceAbove = rect.top - viewportPadding;
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
      const openDown = spaceBelow >= menuHeight || spaceBelow >= spaceAbove;
      const left = Math.min(
        Math.max(viewportPadding, rect.left),
        window.innerWidth - menuWidth - viewportPadding
      );

      setMenuPos({
        left,
        top: openDown ? rect.bottom + gap : undefined,
        bottom: openDown ? undefined : window.innerHeight - rect.top + gap,
        maxHeight: Math.max(160, openDown ? spaceBelow - gap : spaceAbove - gap),
      });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = !!dropdownRef.current?.contains(target);
      const clickedMenu = !!menuRef.current?.contains(target);
      if (!clickedTrigger && !clickedMenu) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full hover:bg-gray-200"
      >
        <MoreHorizontal className="w-5 h-5 text-gray-500" />
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          style={{
            left: `${menuPos.left}px`,
            top: menuPos.top != null ? `${menuPos.top}px` : undefined,
            bottom: menuPos.bottom != null ? `${menuPos.bottom}px` : undefined,
            maxHeight: `${menuPos.maxHeight}px`,
          }}
          className="fixed min-w-[11rem] w-max max-w-[16rem] overflow-y-auto bg-white border border-border rounded-md shadow-lg z-[200]"
        >
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
          {!isDeparted && (
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
          )}
          {isDeparted && onRehousing && (
          <button
            onClick={() => {
              onRehousing(id, name);
              setIsOpen(false);
            }}
            className="w-full flex gap-1 flex-row text-right py-2 px-4 text-md text-red-600 hover:bg-red-50"
          >
            <FaAddressBook />
            اعادة تسكين
          </button>
          )}
          {showTransferWizard && homemaid_id > 0 && onTransferWizard && (
          <button
            onClick={() => {
              onTransferWizard();
              setIsOpen(false);
            }}
            className="w-full flex gap-1 flex-row text-right py-2 px-4 text-md text-teal-800 hover:bg-teal-50"
          >
            <FaUserFriends />
            نقل كفالة (معالج)
          </button>
          )}
          {homemaid_id > 0 && (
          <button
            onClick={() => {
              onAddSession(homemaid_id);
              setIsOpen(false);
            }}
            className="w-full flex gap-1 flex-row text-right py-2 px-4 text-md text-textDark hover:bg-gray-100"
          >
            <FaUserFriends />
            اضافة جلسة
          </button>
          )}


<button
            onClick={() => {

              onAddNotes(id);
              setIsOpen(false);
              // openModal('sessionModal');
            }}
            className="w-full flex gap-1 flex-row text-right py-2 px-4 text-md text-textDark hover:bg-gray-100"
          >
            <FileTextFilled className="w-5 h-5" />
            اضافة ملاحظات
          </button>



          
        </div>
      )}
    </div>
  );
};
// Reusable Clean Segmented Toggle Component (Consistent with App Design)
const SmartAuditToggle = ({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  icon?: any;
  value: any;
  onChange: (val: any) => void;
  options: { label: string; value: any }[];
  disabled?: boolean;
}) => {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1.5">{label}</label>
      <div className="inline-flex w-full bg-gray-100 p-1 rounded-xl border border-gray-200">
        {options.map((opt, idx) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all text-center cursor-pointer ${
                isSelected
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Simple Preset Chips Component
const PresetChips = ({
  chips,
  onSelect,
  disabled,
}: {
  chips: string[];
  onSelect: (val: string) => void;
  disabled?: boolean;
}) => (
  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
    <span className="text-[11px] text-gray-500 font-medium">اقتراحات:</span>
    {chips.map((chip, idx) => (
      <button
        key={idx}
        type="button"
        disabled={disabled}
        onClick={() => onSelect(chip)}
        className="text-[11px] font-medium bg-gray-100 hover:bg-teal-50 text-gray-700 hover:text-teal-800 border border-gray-300 hover:border-teal-300 rounded px-2 py-0.5 transition-colors cursor-pointer"
      >
        + {chip}
      </button>
    ))}
  </div>
);

export default function Home({ user }: { user: any }) {






const [userName, setUserName] = useState('');
useEffect(()=>{
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    try {
      const decoded = jwtDecode(token) as any;
      setUserName(decoded?.username || '');
    } catch (e) {
      console.error(e);
    }
  }
},[]);





  const router = useRouter();
  const { toggleCollapse } = useSidebar();
  const [modals, setModals] = useState({
    addResidence: false,
    editResidence: false,
    editWorker: false,
    workerDeparture: false,
    session: false,
    newHousing: false,
    columnVisibility: false,
    notesModal: false,
    notification: false,
    amountModal: false,
    workerTypeSelection: false,
    sessionModal:false,
    housingForm: false,
    internalWorkerModal: false,
    deleteLocationConfirm: false,
    deleteNoteConfirm: false,
    supervisorModal: false,
    rehousingModal: false,
    auditDetailsModal: false,
    quickNoteModal: false,
  });
  const [selectedAuditWorker, setSelectedAuditWorker] = useState<HousedWorker | null>(null);
  const [selectedLocationForSupervisor, setSelectedLocationForSupervisor] = useState<InHouseLocation | null>(null);
  const [supervisorSearchTerm, setSupervisorSearchTerm] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<{ id: number; name: string } | null>(null);
  const [housedWorkers, setHousedWorkers] = useState<HousedWorker[]>([]);
  const [departedWorkers, setDepartedWorkers] = useState<HousedWorker[]>([]);
  const [locations, setLocations] = useState<InHouseLocation[]>([]);
  const [homemaids, setHomemaids] = useState<Homemaid[]>([]);
  const [editingLocation, setEditingLocation] = useState<InHouseLocation | null>(null);
  const [openLocationDropdown, setOpenLocationDropdown] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [departedTotalCount, setDepartedTotalCount] = useState(0);
  const [tabCounts, setTabCounts] = useState({ recruitment: 0, rental: 0 });
  const [housingStatus, setHousingStatus] = useState<HousingStatusTab>('housed');
  
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
    actionTaken: '',
    warrantyStatus: '',
    nationality: '',
    stayDurationSort: '',
    id: '',
    location: '',
    houseentrydate: '',
  });
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [validationErrors, setValidationErrors] = useState({
    location: false,
    reason: false,
    actionTaken: false,
    medicalReportFile: false,
    details: false,
    internalLocation: false,
    internalReason: false,
    internalHousingDate: false,
  });
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    Name: true,
    clientName: true,
    location: true,
    kingdomentryDate: true,
    Reason: true,
    entitlements: true,
    notes: true,
    actions: true,
  });
  const pageSize = 10;
  const [workerType, setWorkerType] = useState<'داخلية' | 'خارجية'>('داخلية');
  const [housingStep, setHousingStep] = useState<1 | 2>(1);
useEffect(()=>{
  console.log(workerType);
},[workerType]);
  const getTodayDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    homeMaidId: '',
    profileStatus: '',
    deparatureCity: '',
    arrivalCity: '',
    deparatureDate: '',
    houseentrydate: getTodayDateString(),
    deliveryDate: '',
    notes: '',
    StartingDate: '',
    location: '',
    DeparatureTime: '',
    reason: '',
    actionTaken: '', // الإجراء المتخذ: ترحيل أو نقل كفالة
    medicalReportFile: '', // مرفق التقرير الطبي
    employee: user,
    details: '',
    isExternal: workerType,
    isHasEntitlements: false, // إضافة حقل المستحقات
    entitlementsCost: '', // قيمة المستحقات
    entitlementReason: '', // سبب المستحقات
    salaryReceived: true,
    salaryRemainingAmount: '',
    hasPhone: true,
    phoneReason: '',
    hasIqama: true,
    iqamaReason: '',
    hasPassport: true,
    passportReason: '',
    hasPersonalItems: false,
    personalItemsDetails: '',
    medicalCheckDone: false,
    visaType: 'مدفوعة',
  });
  const [editWorkerForm, setEditWorkerForm] = useState<EditWorkerForm>({
    location_id: 0,
    Reason: '',
    actionTaken: '',
    medicalReportFile: '',
    Details: '',
    employee: '',
    Date: '',
    deliveryDate: '',
    isHasEntitlements: false,
    entitlementsCost: '', // قيمة المستحقات
    entitlementReason: '',
    salaryReceived: true,
    salaryRemainingAmount: '',
    hasPhone: true,
    phoneReason: '',
    hasIqama: true,
    iqamaReason: '',
    hasPassport: true,
    passportReason: '',
    hasPersonalItems: false,
    personalItemsDetails: '',
    medicalCheckDone: false,
    visaType: 'مدفوعة',
    maidName: '',
    maidPhone: '',
    maidDateOfBirth: '',
    isExternal: false,
    extNationality: '',
  });
  const [editMaidProfileId, setEditMaidProfileId] = useState<number | null>(null);
  const [departureForm, setDepartureForm] = useState<DepartureForm>({
    deparatureHousingDate: '',
    deparatureReason: '',
    status: 'departed',
  });
  // Departure Modal Paths States
  const [activeDepartureType, setActiveDepartureType] = useState<'medical' | 'trial_transfer' | 'deportation'>('medical');
  const [departureHousingDate, setDepartureHousingDate] = useState<string>('');
  const [medicalDepartureForm, setMedicalDepartureForm] = useState({
    hospitalName: '',
    diagnosis: '',
    expectedStayDays: '',
    expectedReturnDate: '',
    medicalReportFile: '',
    notes: '',
  });
  const [trialTransferForm, setTrialTransferForm] = useState({
    trialStartDate: '',
    trialPeriodDays: '7',
    trialEndDate: '',
    dailyCost: '',
    newSponsorName: '',
    newSponsorId: '',
    newSponsorPhone: '',
    newSponsorAltPhone: '',
    newSponsorCity: 'الرياض',
    newSponsorDateOfBirth: '',
    salaryCertificateFile: '',
    salaryCertificateFileName: '',
    nationalAddressFile: '',
    nationalAddressFileName: '',
    paymentReceiptFile: '',
    paymentReceiptFileName: '',
    totalCost: '',
    paidAmount: '',
    remainingAmount: '',
    notes: '',
  });
  const [isUploadingSalaryCert, setIsUploadingSalaryCert] = useState(false);
  const [isUploadingNationalAddr, setIsUploadingNationalAddr] = useState(false);
  const [isUploadingPaymentReceipt, setIsUploadingPaymentReceipt] = useState(false);
  const [isUploadingMedicalDepartureFile, setIsUploadingMedicalDepartureFile] = useState(false);
  const [deportationForm, setDeportationForm] = useState({
    externaldeparatureCity: 'الرياض',
    externaldeparatureDate: '',
    externaldeparatureTime: '12:00',
    externalArrivalCity: '',
    externalArrivalCityDate: '',
    externalArrivalCityTime: '18:00',
    externalTicketFile: '',
    externalReason: 'انتهاء العقد',
    deliveryOfficer: '',
    notes: '',
  });
  const [isUploadingTicket, setIsUploadingTicket] = useState(false);
  const [isExtractingTicket, setIsExtractingTicket] = useState(false);
  const [ticketFileName, setTicketFileName] = useState('');
  const [ticketUploadError, setTicketUploadError] = useState('');
  const [deliveryOfficers, setDeliveryOfficers] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingDeliveryOfficers, setLoadingDeliveryOfficers] = useState(false);
  const [isSubmittingDeparture, setIsSubmittingDeparture] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [selectedWorkerName, setSelectedWorkerName] = useState<string>('');
  const [selectedDepartureWorker, setSelectedDepartureWorker] = useState<HousedWorker | null>(null);
  const [departureReasons, setDepartureReasons] = useState<string[]>(DEFAULT_DEPARTURE_REASONS);
  const [newDepartureReason, setNewDepartureReason] = useState('');
  
  // External worker departure dedicated state
  const [externalDeparturePhoto, setExternalDeparturePhoto] = useState<string>('');
  const [externalDepartureNotes, setExternalDepartureNotes] = useState<string>('');
  const [isUploadingExternalDeparturePhoto, setIsUploadingExternalDeparturePhoto] = useState<boolean>(false);
  const [externalDeparturePhotoError, setExternalDeparturePhotoError] = useState<string>('');
  const [externalDepartureNotesError, setExternalDepartureNotesError] = useState<string>('');
  const [isUploadingTransferAttachment, setIsUploadingTransferAttachment] = useState(false);
  const [workerSearchTerm, setWorkerSearchTerm] = useState('');
  const [workerSuggestions, setWorkerSuggestions] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [isSubmittingHousing, setIsSubmittingHousing] = useState(false);
  const [editStep, setEditStep] = useState<1 | 2>(1);
  const [selectedEditingWorker, setSelectedEditingWorker] = useState<HousedWorker | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isSubmittingLocation, setIsSubmittingLocation] = useState(false);
  const [isSubmittingEditLocation, setIsSubmittingEditLocation] = useState(false);
  const [isUploadingMedicalReport, setIsUploadingMedicalReport] = useState(false);
  
  // External worker search states
  const [externalWorkerSearchTerm, setExternalWorkerSearchTerm] = useState('');
  const [externalWorkerSuggestions, setExternalWorkerSuggestions] = useState<any[]>([]);
  const [selectedExternalWorker, setSelectedExternalWorker] = useState<any>(null);
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedReasons = window.localStorage.getItem('housingDepartureReasons');
    if (!storedReasons) return;
    try {
      const parsed = JSON.parse(storedReasons);
      if (Array.isArray(parsed)) {
        setDepartureReasons(Array.from(new Set([...DEFAULT_DEPARTURE_REASONS, ...parsed.filter((item) => typeof item === 'string')])));
      }
    } catch (error) {
      console.error('Failed to load departure reasons:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('housingDepartureReasons', JSON.stringify(departureReasons));
  }, [departureReasons]);

  // Internal worker modal form data
  const [externalHousingStep, setExternalHousingStep] = useState<1 | 2>(1);
  const [internalWorkerForm, setInternalWorkerForm] = useState({
    workerId: '',
    workerName: '',
    mobile: '',
    clientName: '',
    clientMobile: '',
    clientIdNumber: '',
    city: '',
    address: '',
    officeName: '',
    housing: '',
    housingDate: typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : '',
    expectedStayDuration: '',
    receiptDate: '',
    reason: 'وصول بالخطأ للمكتب',
    details: '',
    salaryReceived: 'unknown' as any,
    salaryRemainingAmount: '',
    entitlementReason: '',
    hasPhone: 'unknown' as any,
    phoneReason: '',
    hasIqama: 'unknown' as any,
    iqamaReason: '',
    hasPassport: 'unknown' as any,
    passportReason: '',
    hasPersonalItems: 'unknown' as any,
    personalItemsDetails: '',
    medicalCheckDone: 'unknown' as any,
    visaType: 'غير معروف',
  });
  // بيانات العاملة الخارجية الجديدة (تسجيل جديد في externalHomedmaid - تسكين خارجي طارئ/مؤقت)
  const [externalHomemaidForm, setExternalHomemaidForm] = useState({
    name: '',
    image: '',
    nationality: '',
    passportNumber: '',
    passportStartDate: '',
    passportEndDate: '',
    phone: '',
    type: 'recruitment' as 'recruitment' | 'rental',
    dateofbirth: '',
  });
  const [externalClientForm, setExternalClientForm] = useState({
    name: '',
    phone: '',
    city: '',
  });
  const [isUploadingExternalPhoto, setIsUploadingExternalPhoto] = useState(false);
  const [isSubmittingInternalWorker, setIsSubmittingInternalWorker] = useState(false);
  const [showExternalExtraDetails, setShowExternalExtraDetails] = useState(false);
  const [uniqueNationalities, setUniqueNationalities] = useState<string[]>([]);
  const [professionsList, setProfessionsList] = useState<Array<{ id: number; name: string }>>([]);
  const [notesForm, setNotesForm] = useState({
    notes: '',
  });
  const [selectedNotesWorker, setSelectedNotesWorker] = useState<HousedWorker | null>(null);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [quickNoteWorker, setQuickNoteWorker] = useState<HousedWorker | null>(null);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [isSubmittingQuickNote, setIsSubmittingQuickNote] = useState(false);

  const handleOpenQuickNote = (worker: HousedWorker) => {
    setQuickNoteWorker(worker);
    setQuickNoteText('');
    openModal('quickNoteModal');
  };

  const handleQuickNoteSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickNoteText.trim()) {
      showNotification('يرجى كتابة نص الملاحظة', 'error');
      return;
    }
    if (!quickNoteWorker) return;

    setIsSubmittingQuickNote(true);
    try {
      await axios.post('/api/addnotes', {
        notes: quickNoteText.trim(),
        homemaid_id: quickNoteWorker.id,
        employee: user,
      });
      showNotification('تم إضافة الملاحظة بنجاح');
      closeModal('quickNoteModal');
      setQuickNoteText('');
      setQuickNoteWorker(null);
      fetchWorkers();
    } catch (error: any) {
      showNotification(error.response?.data?.error || 'خطأ في إضافة الملاحظة', 'error');
    } finally {
      setIsSubmittingQuickNote(false);
    }
  };
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
  // Validate Step 1 of Housing Form
  const validateHousingStep1 = () => {
    if (!selectedWorker || !selectedWorker.id) {
      showNotification('يرجى البحث واختيار عاملة أولاً للمتابعة', 'error');
      return false;
    }
    if (!formData.location || formData.location === '') {
      setValidationErrors((prev) => ({ ...prev, location: true }));
      showNotification('يرجى اختيار السكن', 'error');
      return false;
    }
    if (!formData.reason || formData.reason === '') {
      setValidationErrors((prev) => ({ ...prev, reason: true }));
      showNotification('يرجى اختيار سبب التسكين', 'error');
      return false;
    }
    if (!formData.actionTaken || formData.actionTaken === '') {
      setValidationErrors((prev) => ({ ...prev, actionTaken: true }));
      showNotification('يرجى تحديد الإجراء المتخذ', 'error');
      return false;
    }
    if (
      (formData.reason === 'حالة مرضية' || formData.reason === 'حمل') &&
      (!formData.medicalReportFile || formData.medicalReportFile.trim() === '')
    ) {
      setValidationErrors((prev) => ({ ...prev, medicalReportFile: true }));
      showNotification('يرجى إرفاق ملف التقرير الطبي لحالة المرض أو الحمل', 'error');
      return false;
    }
    if (!formData.details || formData.details.trim() === '') {
      setValidationErrors((prev) => ({ ...prev, details: true }));
      showNotification('يجب إدخال تفاصيل الحالة بالضبط للعودة لها في أي وقت ومعرفة الحالة بدقة', 'error');
      return false;
    }
    return true;
  };

  // Validate Step 1 of Edit Worker Form
  const validateEditStep1 = () => {
    if (!editWorkerForm.maidName || editWorkerForm.maidName.trim() === '') {
      showNotification('يرجى إدخال اسم العاملة', 'error');
      return false;
    }
    if (editWorkerForm.isExternal && !editWorkerForm.extNationality?.trim()) {
      showNotification('يرجى اختيار أو إدخال الجنسية', 'error');
      return false;
    }
    if (!editWorkerForm.location_id || editWorkerForm.location_id === 0) {
      showNotification('يرجى اختيار السكن', 'error');
      return false;
    }
    if (!editWorkerForm.Reason || editWorkerForm.Reason.trim() === '') {
      showNotification('يرجى اختيار سبب التسكين', 'error');
      return false;
    }
    if (!editWorkerForm.isExternal && (!editWorkerForm.actionTaken || editWorkerForm.actionTaken.trim() === '')) {
      showNotification('يرجى تحديد الإجراء المتخذ', 'error');
      return false;
    }
    if (
      !editWorkerForm.isExternal &&
      (editWorkerForm.Reason === 'حالة مرضية' || editWorkerForm.Reason === 'حمل') &&
      (!editWorkerForm.medicalReportFile || editWorkerForm.medicalReportFile.trim() === '')
    ) {
      showNotification('يرجى إرفاق ملف التقرير الطبي لحالة المرض أو الحمل', 'error');
      return false;
    }
    if (!editWorkerForm.Details || editWorkerForm.Details.trim() === '') {
      showNotification('يجب إدخال تفاصيل الحالة بالضبط للعودة لها في أي وقت ومعرفة الحالة بدقة', 'error');
      return false;
    }
    return true;
  };

  // Open/close modals
  const openModal = (modalName: string) => {
    setModals((prev) => ({ ...prev, [modalName]: true }));
    if (modalName === 'housingForm') {
      const today = getTodayDateString();
      setHousingStep(1);
      setSelectedWorker(null);
      setWorkerSearchTerm('');
      setWorkerSuggestions([]);
      setFormData({
        homeMaidId: '',
        profileStatus: '',
        deparatureCity: '',
        arrivalCity: '',
        deparatureDate: '',
        houseentrydate: today,
        deliveryDate: '',
        notes: '',
        StartingDate: '',
        location: locations.length === 1 ? locations[0].id.toString() : '',
        DeparatureTime: '',
        reason: '',
        actionTaken: '',
        medicalReportFile: '',
        employee: user,
        details: '',
        isExternal: 'داخلية',
        isHasEntitlements: false,
        entitlementsCost: '',
        entitlementReason: '',
        salaryReceived: true,
        salaryRemainingAmount: '',
        hasPhone: true,
        phoneReason: '',
        hasIqama: true,
        iqamaReason: '',
        hasPassport: true,
        passportReason: '',
        hasPersonalItems: false,
        personalItemsDetails: '',
        medicalCheckDone: false,
        visaType: 'مدفوعة',
      });
      setValidationErrors((prev) => ({
        ...prev,
        location: false,
        reason: false,
        actionTaken: false,
        medicalReportFile: false,
        details: false,
      }));
    }
  };
  const closeModal = (modalName: string) => {
    setModals((prev) => ({ ...prev, [modalName]: false }));
    if (modalName !== 'notification') {
      setSelectedWorkerId(null);
      setSelectedWorkerName('');
    }
    if (modalName === 'sessionModal') {
      setSelectedWorkerId(null);
      setSelectedWorkerName('');
    }
    if (modalName === 'notesModal') {
      setNotesForm({
        notes: '',
      });
      setSelectedNotesWorker(null);
    }
    if (modalName === 'auditDetailsModal') {
      setSelectedAuditWorker(null);
    }
    if (modalName === 'editWorker') {
      setEditStep(1);
      setSelectedEditingWorker(null);
    }
    // Clear worker selection and form when closing housing form
    if (modalName === 'housingForm') {
      setHousingStep(1);
      setSelectedWorker(null);
      setWorkerSearchTerm('');
      setWorkerSuggestions([]);
      setFormData({
        homeMaidId: '',
        profileStatus: '',
        deparatureCity: '',
        arrivalCity: '',
        deparatureDate: '',
        houseentrydate: getTodayDateString(),
        deliveryDate: '',
        notes: '',
        StartingDate: '',
        location: locations.length === 1 ? locations[0].id.toString() : '',
        DeparatureTime: '',
        reason: '',
        actionTaken: '',
        medicalReportFile: '',
        employee: user,
        details: '',
        isExternal: 'داخلية',
        isHasEntitlements: false,
        entitlementsCost: '',
        entitlementReason: '',
        salaryReceived: true,
        salaryRemainingAmount: '',
        hasPhone: true,
        phoneReason: '',
        hasIqama: true,
        iqamaReason: '',
        hasPassport: true,
        passportReason: '',
        hasPersonalItems: false,
        personalItemsDetails: '',
        medicalCheckDone: false,
        visaType: 'مدفوعة',
      });
      setValidationErrors((prev) => ({
        ...prev,
        location: false,
        reason: false,
        actionTaken: false,
        medicalReportFile: false,
        details: false,
      }));
    }
    // Clear external homemaid form when closing internal worker modal
    if (modalName === 'internalWorkerModal') {
      setExternalHousingStep(1);
      setExternalHomemaidForm({
        name: '',
        image: '',
        nationality: '',
        passportNumber: '',
        passportStartDate: '',
        passportEndDate: '',
        phone: '',
        type: 'recruitment',
        dateofbirth: '',
      });
      setExternalClientForm({ name: '', phone: '', city: '' });
      setShowExternalExtraDetails(false);
      setInternalWorkerForm({
        workerId: '',
        workerName: '',
        mobile: '',
        clientName: '',
        clientMobile: '',
        clientIdNumber: '',
        city: '',
        address: '',
        officeName: '',
        housing: '',
        housingDate: typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : '',
        expectedStayDuration: '',
        receiptDate: '',
        reason: 'وصول بالخطأ للمكتب',
        details: '',
        salaryReceived: true,
        salaryRemainingAmount: '',
        entitlementReason: '',
        hasPhone: true,
        phoneReason: '',
        hasIqama: true,
        iqamaReason: '',
        hasPassport: true,
        passportReason: '',
        hasPersonalItems: false,
        personalItemsDetails: '',
        medicalCheckDone: false,
        visaType: 'مدفوعة',
      });
    }
    // Clear editing location when closing edit residence modal
    if (modalName === 'editResidence') {
      setEditingLocation(null);
    }
    if (modalName === 'editWorker') {
      setEditMaidProfileId(null);
    }
  };
  // Show auto-dismissing Toast notification
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setModals((prev) => ({ ...prev, notification: true }));

    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = setTimeout(() => {
      setModals((prev) => ({ ...prev, notification: false }));
    }, 3500);
  };

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Copy to clipboard helper
  const handleCopyToClipboard = (text: string, label: string, fieldKey: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!text) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopiedField(fieldKey);
          setToastMessage(`تم نسخ ${label}`);
          setTimeout(() => {
            setCopiedField((prev) => (prev === fieldKey ? null : prev));
          }, 2000);
          setTimeout(() => {
            setToastMessage((prev) => (prev === `تم نسخ ${label}` ? null : prev));
          }, 2500);
        })
        .catch(() => {
          setToastMessage(`تعذر نسخ ${label}`);
          setTimeout(() => setToastMessage(null), 2500);
        });
    }
  };
  // Toggle column visibility
  const toggleColumnVisibility = (column: keyof typeof columnVisibility) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  // Toggle row expansion
  const toggleRowExpansion = (workerId: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workerId)) {
        newSet.delete(workerId);
      } else {
        newSet.add(workerId);
      }
      return newSet;
    });
  };
  // Fetch locations
  const fetchLocations = async () => {
    try {
      const response = await axios.get('/api/inhouselocation');
      console.log('Locations data:', response.data);
      const locData = response.data || [];
      setLocations(locData);
      if (locData.length === 1) {
        setFormData((prev) => ({
          ...prev,
          location: prev.location || locData[0].id.toString(),
        }));
      }
    } catch (error) {
      showNotification('خطأ في جلب بيانات المواقع', 'error');
    }
  };

  useEffect(() => {
    if (locations.length === 1) {
      const singleLocId = locations[0].id.toString();
      if (!formData.location) {
        setFormData((prev) => ({
          ...prev,
          location: singleLocId,
        }));
      }
      setInternalWorkerForm((prev) => ({
        ...prev,
        housing: prev.housing || singleLocId,
      }));
    }
  }, [locations]);

  // Handle delete location
  const handleDeleteLocation = (location: InHouseLocation) => {
    setLocationToDelete({ id: location.id, name: location.location });
    openModal('deleteLocationConfirm');
  };

  const confirmDeleteLocation = async () => {
    if (!locationToDelete) return;

    try {
      await axios.delete(`/api/inhouselocation/${locationToDelete.id}`);
      showNotification('تم حذف السكن بنجاح');
      closeModal('deleteLocationConfirm');
      setLocationToDelete(null);
      fetchLocations();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'حدث خطأ أثناء حذف السكن';
      showNotification(errorMessage, 'error');
      closeModal('deleteLocationConfirm');
      setLocationToDelete(null);
    }
  };

  const handleSaveSupervisor = async (homemaidId: number) => {
    if (!selectedLocationForSupervisor) return;
    try {
      await axios.put('/api/inhouselocation', {
        id: selectedLocationForSupervisor.id,
        supervisor: homemaidId
      });
      showNotification('تم تعيين المشرفة بنجاح');
      closeModal('supervisorModal');
      setSelectedLocationForSupervisor(null);
      setSupervisorSearchTerm('');
      fetchLocations();
    } catch (error: any) {
      showNotification(error.response?.data?.error || 'خطأ في تعيين المشرفة', 'error');
    }
  };
  const handleRemoveSupervisor = async () => {
    if (!selectedLocationForSupervisor) return;
    try {
      await axios.put('/api/inhouselocation', {
        id: selectedLocationForSupervisor.id,
        supervisor: null
      });
      showNotification('تم حذف المشرفة بنجاح');
      closeModal('supervisorModal');
      setSelectedLocationForSupervisor(null);
      setSupervisorSearchTerm('');
      fetchLocations();
    } catch (error: any) {
      showNotification(error.response?.data?.error || 'خطأ في حذف المشرفة', 'error');
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
      const response = await fetch(`/api/housing/search-workers?search=${encodeURIComponent(searchTerm)}&limit=20&contractType=${contractType}`);
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
  const handleAddSession = (homemaid_id: number) => {
  setSelectedWorkerId(homemaid_id); // <-- نخزن الـ id
  openModal('sessionModal');     // <-- نفتح المودال
};  
  const handleOpenNotesModal = (worker: HousedWorker) => {
    setSelectedWorkerId(worker.id);
    setSelectedNotesWorker(worker);
    setNotesForm({ notes: '' });
    openModal('notesModal');
  };

  const handleAddNotes = (workerId: number) => {
    const worker = (housingStatus === 'housed' ? housedWorkers : departedWorkers).find(
      (w) => w.id === workerId || w.homeMaid_id === workerId
    );
    if (worker) {
      handleOpenNotesModal(worker);
    } else {
      setSelectedWorkerId(workerId);
      setSelectedNotesWorker(null);
      setNotesForm({ notes: '' });
      openModal('notesModal');
    }
  };

  const postnotes = async () => {
    if (!notesForm.notes.trim()) {
      showNotification('يرجى كتابة نص الملاحظة', 'error');
      return;
    }
    const targetId = selectedNotesWorker?.id || selectedWorkerId;
    if (!targetId) return;

    setIsSubmittingNote(true);
    try {
      const response = await axios.post('/api/addnotes', {
        notes: notesForm.notes.trim(),
        homemaid_id: targetId,
        employee: user,
      });
      showNotification('تم إضافة الملاحظة بنجاح');
      setNotesForm({ notes: '' });

      const newNote = response.data;
      if (newNote && selectedNotesWorker) {
        const updatedNotes = [newNote, ...(selectedNotesWorker.HousedWorkerNotes || [])];
        setSelectedNotesWorker({
          ...selectedNotesWorker,
          HousedWorkerNotes: updatedNotes,
        });
      }
      fetchWorkers();
    } catch (error) {
      showNotification('خطأ في إضافة الملاحظة', 'error');
    } finally {
      setIsSubmittingNote(false);
    }
  };


  // === Re-Housing State ===
  const [rehousingWorker, setRehousingWorker] = useState<any>(null);
  const [transferWizardWorker, setTransferWizardWorker] = useState<TransferWizardWorker | null>(null);
  const [rehousingForm, setRehousingForm] = useState({
    houseentrydate: '',
    Reason: '',
  });

  const handleOpenRehousing = (id: number, name: string) => {
    const worker = departedWorkers.find((w: any) => w.id === id);
    setRehousingWorker(worker || { id, Order: { Name: name }, externalHomedmaid: { name } });
    setRehousingForm({ houseentrydate: '', Reason: '' });
    openModal('rehousingModal');
  };

  const submitRehousing = async () => {
    if (!rehousingWorker || !rehousingForm.houseentrydate) {
      showNotification('يرجى ملء تاريخ التسكين', 'error');
      return;
    }
    try {
      // 1. Reset the worker housing (clear departure date, set new entry date + reason)
      await axios.put('/api/confirmhousinginformation', {
        homeMaidId: rehousingWorker.homeMaid_id,
        housedWorkerId: rehousingWorker.homeMaid_id ? undefined : rehousingWorker.id,
        houseentrydate: rehousingForm.houseentrydate,
        Reason: rehousingForm.Reason,
        employee: user,
        location_id: rehousingWorker.location_id,
        Details: rehousingWorker.Details,
        isHasEntitlements: rehousingWorker.isHasEntitlements,
        isRehousing: true,
      });

      // 2. Add a special red note with previous housing data
      const prevDate = rehousingWorker.houseentrydate
        ? new Date(rehousingWorker.houseentrydate).toLocaleDateString('ar-SA')
        : 'غير محدد';
      const prevReason = rehousingWorker.Reason || 'غير محدد';
      const prevDeparture = rehousingWorker.deparatureHousingDate
        ? new Date(rehousingWorker.deparatureHousingDate).toLocaleDateString('ar-SA')
        : 'غير محدد';
      const noteText = `[اعادة-تسكين] تاريخ التسكين السابق: ${prevDate} | سبب التسكين السابق: ${prevReason} | تاريخ المغادرة السابق: ${prevDeparture} | سبب اعادة التسكين: ${rehousingForm.Reason || 'غير محدد'}`;

      await axios.post('/api/addnotes', {
        notes: noteText,
        homemaid_id: rehousingWorker.id,
        employee: user,
      });

      showNotification('تم اعادة التسكين بنجاح');
      closeModal('rehousingModal');
      fetchWorkers();
    } catch (error) {
      showNotification('خطأ في اعادة التسكين', 'error');
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
  // Fetch counts from server-side API
const fetchCounts = async () => {
  try {
    console.log('Fetching counts for housingStatus:', housingStatus);
    const response = await axios.get('/api/housing/counts', {
      params: { status: housingStatus },
    });
    if (response.data.success) {
      setTabCounts({
        recruitment: response.data.counts.recruitment || 0,
        rental: response.data.counts.rental || 0,
      });
      console.log('Counts loaded:', response.data.counts);
    } else {
      console.error('Server returned error:', response.data.message);
      setTabCounts({ recruitment: 0, rental: 0 });
    }
  } catch (error) {
    console.error('Error fetching counts:', error);
    setTabCounts({ recruitment: 0, rental: 0 });
  }
};

const fetchWorkers = async () => {
  try {
    const contractType = activeTab; // recruitment or rental
    const status = housingStatus;
    console.log(`Fetching workers - contractType: ${contractType}, status: ${status}`);
    const isDepartedList = status === 'departed' || status === 'departed_transfer';
    let apiEndpoint = status === 'housed' ? '/api/confirmhousinginformation' : '/api/housingdeparature';
    const departureParams =
      status === 'departed_transfer' ? { deparatureReason: DEPARTURE_REASON_TRANSFER } : {};
    const response = await axios.get(apiEndpoint, {
      params: {
        ...filters,
        page,
        sortKey,
        sortDirection,
        contractType: contractType,
        ...departureParams,
      },
    });
    console.log('Workers response:', response.data);
    if (status === 'housed') {
      setHousedWorkers(response.data.housing);
      setTotalCount(response.data.totalCount);
    } else {
      setDepartedWorkers(response.data.housing);
      setDepartedTotalCount(response.data.totalCount);
    }
    // تحديث tabCounts للـ contractType الحالي
    setTabCounts((prev) => ({
      ...prev,
      [contractType]: response.data.totalCount,
    }));
    // جلب الكونت للـ contractType الآخر
    const otherContractType = contractType === 'recruitment' ? 'rental' : 'recruitment';
    const otherResponse = await axios.get(apiEndpoint, {
      params: {
        ...filters,
        page: 1,
        contractType: otherContractType,
        ...departureParams,
      },
    });
    setTabCounts((prev) => ({
      ...prev,
      [otherContractType]: otherResponse.data.totalCount,
    }));
  } catch (error) {
    console.error('Error fetching workers:', error);
    showNotification('خطأ في جلب بيانات العاملات', 'error');
  }
};
  // Fetch housed workers for exporting
// Fetch housed workers for exporting
const fetchHousedforExporting = async () => {
  try {
    const response = await axios.get('/api/Export/housedarrivals', {
      params: {
        contractType: activeTab, // إضافة contractType
        page: 1,
        pageSize: 10000 // لجلب كل البيانات
      },
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Export error:', error);
    showNotification('خطأ في جلب بيانات التسكين للتصدير', 'error');
    throw error;
  }
};
  // Fetch departed workers for exporting
// Fetch departed workers for exporting
const fetchDepartedHousedforExporting = async () => {
  try {
    const response = await axios.get('/api/Export/departedhoused', {
      params: {
        contractType: activeTab, // إضافة contractType
        page: 1,
        pageSize: 10000 // لجلب كل البيانات
      },
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Export error:', error);
    showNotification('خطأ في جلب بيانات العاملات اللي غادرن للتصدير', 'error');
    throw error;
  }
};
  // Update housed worker
  const updateHousedWorker = async (workerId: number, data: EditWorkerForm) => {
    try {
      const isSalaryReceived = Boolean(data.salaryReceived);
      const updateData: any = {
        homeMaidId: workerId,
        employee: data.employee,
        reason: data.Reason,
        actionTaken: data.actionTaken || null,
        medicalReportFile: data.medicalReportFile || null,
        details: data.Details, // تحويل Details إلى details
        houseentrydate: data.Date,
        deliveryDate: data.deliveryDate,
        isHasEntitlements: !isSalaryReceived,
        entitlementsCost: !isSalaryReceived && data.salaryRemainingAmount ? Number(data.salaryRemainingAmount) : null,
        entitlementReason: !isSalaryReceived ? (data.entitlementReason || null) : null,
        salaryReceived: isSalaryReceived,
        salaryRemainingAmount: !isSalaryReceived && data.salaryRemainingAmount ? Number(data.salaryRemainingAmount) : null,
        hasPhone: data.hasPhone,
        phoneReason: data.phoneReason,
        hasIqama: data.hasIqama,
        iqamaReason: data.iqamaReason,
        hasPassport: data.hasPassport,
        passportReason: data.passportReason,
        hasPersonalItems: data.hasPersonalItems,
        personalItemsDetails: data.personalItemsDetails,
        medicalCheckDone: data.medicalCheckDone,
        visaType: data.visaType,
        maidName: data.maidName,
        maidPhone: data.maidPhone,
        maidDateOfBirth: data.maidDateOfBirth || null,
      };
      
      // Only include location_id if it's valid
      if (data.location_id && data.location_id !== 0) {
        updateData.location_id = data.location_id;
      }
      if (data.isExternal) {
        updateData.nationality = data.extNationality?.trim() || null;
        updateData.expectedStayDuration = data.expectedStayDuration?.trim() || null;
        updateData.maidImage = data.maidImage?.trim() || null;
        updateData.image = data.maidImage?.trim() || null;
      }
      
      console.log('Sending update data:', updateData);
      
      await axios.put(`/api/confirmhousinginformation`, updateData);
      showNotification('تم تحديث بيانات العاملة بنجاح');
      fetchWorkers();
      fetchLocations();
    } catch (error) {
      console.error('Update error:', error);
      showNotification('حدث خطأ أثناء تحديث البيانات', 'error');
    }
  };
  const getOriginalSponsorGuaranteeEndDate = (worker?: HousedWorker | null) => {
    return worker?.Order?.NewOrder?.[0]?.arrivals?.[0]?.GuaranteeDurationEnd
      ? String(worker.Order.NewOrder[0].arrivals[0].GuaranteeDurationEnd).split('T')[0]
      : '';
  };

  const updateTransferSponsorshipData = (updates: Partial<TransferSponsorshipData>) => {
    setDepartureForm((prev) => {
      const current = prev.transferSponsorshipData || createEmptyTransferSponsorshipData(getOriginalSponsorGuaranteeEndDate(selectedDepartureWorker));
      const next = { ...current, ...updates };
      const shouldRecalculateTrialEnd =
        Object.prototype.hasOwnProperty.call(updates, 'trialStartDate') ||
        Object.prototype.hasOwnProperty.call(updates, 'trialPeriodType') ||
        Object.prototype.hasOwnProperty.call(updates, 'trialPeriodDays');

      return {
        ...prev,
        transferSponsorshipData: {
          ...next,
          trialEndDate: shouldRecalculateTrialEnd
            ? calculateTrialEndDate(next.trialStartDate, next.trialPeriodType, next.trialPeriodDays)
            : next.trialEndDate,
        },
      };
    });
  };

  const handleTransferAttachmentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'financialAbilityAttachment' | 'bankCertificateAttachment'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', 'z8q1vykv');
    uploadData.append('cloud_name', 'duo8svqci');
    uploadData.append('folder', 'samples');

    try {
      setIsUploadingTransferAttachment(true);
      const response = await axios.post('https://api.cloudinary.com/v1_1/duo8svqci/auto/upload', uploadData);
      updateTransferSponsorshipData({ [field]: response.data.secure_url } as Partial<TransferSponsorshipData>);
    } catch (error) {
      console.error('Transfer attachment upload failed:', error);
      showNotification('حدث خطأ أثناء رفع المرفق', 'error');
    } finally {
      setIsUploadingTransferAttachment(false);
    }
  };

  const handleMedicalReportUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'formData' | 'editWorkerForm' = 'formData'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showNotification('حجم الملف كبير جداً، الحد الأقصى 10 ميجابايت', 'error');
      return;
    }

    try {
      setIsUploadingMedicalReport(true);

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await axios.post('/api/housing/upload-medical-report', {
        file: base64,
        filename: file.name,
        contentType: file.type || 'application/pdf',
      });

      const fileUrl = response.data.url || response.data.filePath;

      if (target === 'formData') {
        setFormData((prev) => ({ ...prev, medicalReportFile: fileUrl }));
        setValidationErrors((prev) => ({ ...prev, medicalReportFile: false }));
      } else {
        setEditWorkerForm((prev) => ({ ...prev, medicalReportFile: fileUrl }));
      }
      showNotification('تم رفع ملف التقرير الطبي إلى DigitalOcean Spaces بنجاح');
    } catch (error: any) {
      console.error('Medical report upload failed:', error);
      const errMsg = error.response?.data?.error || error.message || 'حدث خطأ أثناء رفع ملف التقرير الطبي';
      showNotification(errMsg, 'error');
    } finally {
      setIsUploadingMedicalReport(false);
    }
  };

  // Record departure
  const recordDeparture = async (workerId: number, data: DepartureForm) => {
    try {
      const payload = {
        ...data,
        transferSponsorshipData:
          data.deparatureReason === DEPARTURE_REASON_TRANSFER ? data.transferSponsorshipData : null,
        homeMaid: workerId,
      };
      await axios.put(`/api/housingdeparature`, payload);
      showNotification('تم تسجيل مغادرة العاملة بنجاح');
      fetchWorkers();
      fetchLocations();
    } catch (error) {
      showNotification('حدث خطأ أثناء تسجيل المغادرة', 'error');
    }
  };
  // Handle export
// Handle export with better error handling
// const handleExport = async (format: 'xlsx' | 'pdf') => {
//   try {
//     console.log('Starting export:', { activeTab, housingStatus, format });
    
//     let data;
//     if (housingStatus === 'housed') {
//       data = await fetchHousedforExporting();
//     } else {
//       data = await fetchDepartedHousedforExporting();
//     }

//     // Check if data is valid
//     if (!data || data.size === 0) {
//       showNotification('لا توجد بيانات للتصدير', 'error');
//       return;
//     }

//     // Create filename with proper Arabic support
//     const statusText = housingStatus === 'housed' ? 'مسكونين' : 'مغادرين';
//     const contractText = activeTab === 'recruitment' ? 'استقدام' : 'تاجير';
//     const date = new Date().toISOString().split('T')[0];
//     const filename = `${contractText}_${statusText}_${format}_${date}.${format}`;

//     // Create download
//     const url = window.URL.createObjectURL(new Blob([data]));
//     const link = document.createElement('a');
//     link.href = url;
//     link.setAttribute('download', filename);
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     window.URL.revokeObjectURL(url);

//     showNotification(
//       `تم تصدير ${format === 'xlsx' ? 'Excel' : 'PDF'} بنجاح (${filename})`
//     );
//   } catch (error: any) {
//     console.error('Export failed:', error);
//     const errorMsg = error.response?.data?.message || 
//                     error.message || 
//                     `خطأ في تصدير الملف بصيغة ${format === 'xlsx' ? 'Excel' : 'PDF'}`;
//     showNotification(errorMsg, 'error');
//   }
// };
  // Handle edit worker modal opening
  const handleEditWorker = (id: number, name: string) => {
    const worker = (housingStatus === 'housed' ? housedWorkers : departedWorkers).find((w) => w.id === id);
    console.log('Edit worker clicked:', { id, name, worker, housingStatus });
    if (worker) {
      setSelectedEditingWorker(worker);
      setEditStep(1);
      // للعاملات الخارجية homeMaid_id يكون null، نستخدم housedworker id لاستدعاء التحديث
      setSelectedWorkerId(worker.homeMaid_id ?? worker.id);
      const order = worker.Order;
      const ext = worker.externalHomedmaid;
      const maidName = worker.homeMaid_id
        ? (order?.Name ?? '').trim() || name
        : (ext?.name ?? '').trim() || name;
      const maidPhone = worker.homeMaid_id
        ? (order?.phone ?? '').toString()
        : (ext?.phone ?? '').toString();
      const rawDob = worker.homeMaid_id ? order?.dateofbirth : ext?.dateofbirth;
      const maidDateOfBirth = rawDob ? String(rawDob).split('T')[0] : '';
      setEditMaidProfileId(worker.homeMaid_id ?? ext?.id ?? null);
      const isSalaryReceivedInitial =
        worker.salaryReceived !== undefined && worker.salaryReceived !== null
          ? Boolean(worker.salaryReceived)
          : (!worker.isHasEntitlements && (!worker.salaryRemainingAmount || Number(worker.salaryRemainingAmount) === 0));

      const formData: EditWorkerForm = {
        location_id: worker.location_id || null,
        Reason: worker.Reason || '',
        actionTaken: worker.actionTaken || '',
        medicalReportFile: worker.medicalReportFile || '',
        Details: worker.Details || '',
        employee: worker.employee || user,
        Date: worker.houseentrydate ? worker.houseentrydate.split('T')[0] : '',
        deliveryDate: worker.deparatureHousingDate ? worker.deparatureHousingDate.split('T')[0] : '',
        isHasEntitlements: !isSalaryReceivedInitial,
        entitlementsCost:
          !isSalaryReceivedInitial && (worker.salaryRemainingAmount || worker.entitlementsCost)
            ? String(worker.salaryRemainingAmount || worker.entitlementsCost)
            : '',
        entitlementReason: !isSalaryReceivedInitial ? (worker.entitlementReason || '') : '',
        salaryReceived: isSalaryReceivedInitial,
        salaryRemainingAmount:
          !isSalaryReceivedInitial && (worker.salaryRemainingAmount || worker.entitlementsCost)
            ? String(worker.salaryRemainingAmount || worker.entitlementsCost)
            : '',
        hasPhone: worker.hasPhone !== undefined ? worker.hasPhone : true,
        phoneReason: worker.phoneReason || '',
        hasIqama: worker.hasIqama !== undefined ? worker.hasIqama : true,
        iqamaReason: worker.iqamaReason || '',
        hasPassport: worker.hasPassport !== undefined ? worker.hasPassport : true,
        passportReason: worker.passportReason || '',
        hasPersonalItems: worker.hasPersonalItems !== undefined ? worker.hasPersonalItems : false,
        personalItemsDetails: worker.personalItemsDetails || '',
        medicalCheckDone: worker.medicalCheckDone !== undefined ? worker.medicalCheckDone : false,
        visaType: worker.visaType || 'مدفوعة',
        maidName,
        maidPhone,
        maidDateOfBirth,
        isExternal: !worker.homeMaid_id && !!ext,
        extNationality: (ext?.nationality || '').trim(),
        expectedStayDuration: worker.expectedStayDuration || '',
        maidImage: ext?.image || '',
      };
      console.log('Setting edit form data:', formData);
      setEditWorkerForm(formData);
      openModal('editWorker');
    }
  };
  // Saudi departure cities list
  const SAUDI_DEPARTURE_CITIES = [
    { value: 'الرياض', label: 'الرياض (RUH)' },
    { value: 'جدة', label: 'جدة (JED)' },
    { value: 'الدمام', label: 'الدمام (DMM)' },
    { value: 'المدينة المنورة', label: 'المدينة المنورة (MED)' },
    { value: 'القصيم', label: 'القصيم (ELQ)' },
    { value: 'أبها', label: 'أبها (AHB)' },
    { value: 'تبوك', label: 'تبوك (TAB)' },
    { value: 'جازان', label: 'جازان (GJI)' },
    { value: 'حائل', label: 'حائل (HIL)' },
    { value: 'الهفوف', label: 'الهفوف (HOF)' },
    { value: 'ينبع', label: 'ينبع (YNB)' },
    { value: 'الطائف', label: 'الطائف (TIF)' },
    { value: 'نجران', label: 'نجران (EAM)' },
  ];

  const DEPORTATION_REASON_OPTIONS = [
    'انتهاء العقد',
    'رفض العمل',
    'هروب سابق',
    'تقرير طبي نهائي / عدم اللياقة',
    'مخالفة أنظمة العمل',
    'بناءً على رغبة الكفيل',
    'أخرى',
  ];

  const iataToCityArMap: Record<string, string> = {
    'RUH': 'الرياض', 'JED': 'جدة', 'MED': 'المدينة المنورة', 'DMM': 'الدمام', 'AHB': 'أبها', 'ELQ': 'القصيم', 'TUI': 'طريف', 'TAB': 'تبوك', 'HIL': 'حائل', 'GJI': 'جازان', 'HOF': 'الهفوف', 'EAM': 'نجران', 'YNB': 'ينبع',
    'CAI': 'القاهرة', 'AMM': 'عمان', 'BEY': 'بيروت', 'DAM': 'دمشق', 'BGW': 'بغداد', 'KRT': 'الخرطوم', 'ADD': 'أديس أبابا', 'NBO': 'نيروبي', 'MBA': 'مومباسا', 'DAR': 'دار السلام', 'EBB': 'كمبالا', 'ASM': 'أسمرة', 'MGQ': 'مقديشو', 'DAC': 'دكا', 'CGP': 'تشيتاجونج', 'MNL': 'مانيلا', 'CRK': 'كلارك', 'CEB': 'سيبو', 'CMB': 'كولومبو', 'CGK': 'جاكرتا', 'SUB': 'سورابايا', 'KUL': 'كوالالمبور', 'BKK': 'بانكوك', 'DEL': 'نيودلهي', 'BOM': 'مومباي', 'CCJ': 'كاليكوت', 'COK': 'كوتشي', 'MAA': 'تشيناي', 'HYD': 'حيدر أباد', 'ISB': 'إسلام آباد', 'LHE': 'لاهور', 'KHI': 'كراتشي', 'KTM': 'كاتماندو', 'DXB': 'دبي', 'DOH': 'الدوحة', 'KWI': 'الكويت', 'BAH': 'المنامة', 'MCT': 'مسقط',
  };

  const resolveIataToCity = (code?: string | null): string => {
    if (!code) return '';
    const clean = code.trim().toUpperCase();
    return iataToCityArMap[clean] || clean;
  };

  const formatDateYMD = (val: unknown): string => {
    if (!val || String(val).trim() === '' || String(val).toLowerCase() === 'null' || String(val).toLowerCase() === 'n/a') return '';
    const s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
    const dmY = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/.exec(s);
    if (dmY) {
      const d = dmY[1].padStart(2, '0');
      const m = dmY[2].padStart(2, '0');
      const y = dmY[3];
      return `${y}-${m}-${d}`;
    }
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return s;
  };

  const convert12hTo24h = (time12h: string): string => {
    if (!time12h) return '';
    const clean = time12h.trim().toUpperCase();
    if (/^\d{1,2}:\d{2}$/.test(clean)) {
      const [h, m] = clean.split(':');
      return `${h.padStart(2, '0')}:${m}`;
    }
    const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/.exec(clean);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const modifier = match[3];
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
    return clean.substring(0, 5);
  };

  const saudiCities = [
    { value: 'الرياض', label: 'الرياض (Riyadh)' },
    { value: 'جدة', label: 'جدة (Jeddah)' },
    { value: 'الدمام', label: 'الدمام (Dammam)' },
    { value: 'المدينة المنورة', label: 'المدينة المنورة (Madinah)' },
    { value: 'مكة المكرمة', label: 'مكة المكرمة (Makkah)' },
    { value: 'القصيم', label: 'القصيم (Qassim)' },
    { value: 'أبها', label: 'أبها (Abha)' },
    { value: 'تبوك', label: 'تبوك (Tabuk)' },
    { value: 'جازان', label: 'جازان (Jazan)' },
    { value: 'حائل', label: 'حائل (Hail)' },
    { value: 'نجران', label: 'نجران (Najran)' },
    { value: 'الطائف', label: 'الطائف (Taif)' },
    { value: 'ينبع', label: 'ينبع (Yanbu)' },
    { value: 'الأحساء', label: 'الأحساء (Al-Ahsa)' },
    { value: 'الجوف', label: 'الجوف (Al-Jouf)' },
    { value: 'عرعر', label: 'عرعر (Arar)' },
    { value: 'الباحة', label: 'الباحة (Al-Baha)' },
    { value: 'الدوادمي', label: 'الدوادمي (Ad-Dawadimi)' },
    { value: 'وادي الدواسر', label: 'وادي الدواسر (Wadi Ad-Dawasir)' },
    { value: 'شرورة', label: 'شرورة (Sharurah)' },
    { value: 'بيشة', label: 'بيشة (Bisha)' },
    { value: 'رفحاء', label: 'رفحاء (Rafha)' },
    { value: 'طريف', label: 'طريف (Turaif)' },
    { value: 'القريات', label: 'القريات (Al-Qurayyat)' },
    { value: 'حفر الباطن', label: 'حفر الباطن (Hafr Al-Batin)' },
  ];

  const getSelectCityStyles = (hasError: boolean = false) => ({
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: '#F9FAFB',
      borderColor: hasError ? '#EF4444' : state.isFocused ? '#0D5C63' : '#D1D5DB',
      borderRadius: '0.75rem',
      padding: '2px',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(13, 92, 99, 0.2)' : 'none',
      '&:hover': {
        borderColor: hasError ? '#EF4444' : '#0D5C63',
      },
      textAlign: 'right' as const,
      direction: 'rtl' as const,
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 9999,
      textAlign: 'right' as const,
      direction: 'rtl' as const,
      borderRadius: '0.75rem',
      overflow: 'hidden',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    }),
    menuPortal: (provided: any) => ({ ...provided, zIndex: 9999 }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#0D5C63' : state.isFocused ? '#E6FFFA' : 'white',
      color: state.isSelected ? 'white' : '#1F2937',
      textAlign: 'right' as const,
      direction: 'rtl' as const,
      cursor: 'pointer',
      fontSize: '0.875rem',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#1F2937',
      textAlign: 'right' as const,
      direction: 'rtl' as const,
      fontSize: '0.875rem',
      fontWeight: '500',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#9CA3AF',
      textAlign: 'right' as const,
      direction: 'rtl' as const,
      fontSize: '0.875rem',
    }),
  });

  // Fetch delivery officers
  const fetchDeliveryOfficers = async () => {
    if (deliveryOfficers.length > 0) return;
    setLoadingDeliveryOfficers(true);
    try {
      const res = await fetch('/api/usersfortask');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDeliveryOfficers(data.map((u: any) => ({ value: u.username, label: u.username })));
        }
      }
    } catch (err) {
      console.error('Error fetching delivery officers:', err);
    } finally {
      setLoadingDeliveryOfficers(false);
    }
  };

  // Upload External Worker Departure Photo
  const handleExternalDeparturePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      showNotification('يرجى اختيار صورة صالحة (JPEG, PNG, WEBP)', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showNotification('حجم الصورة كبير جداً (الحد الأقصى 10 ميغابايت)', 'error');
      return;
    }

    try {
      setIsUploadingExternalDeparturePhoto(true);
      setExternalDeparturePhotoError('');

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await axios.post('/api/housing/upload-worker-photo', {
        file: base64,
        filename: file.name,
        contentType: file.type || 'image/jpeg',
      });

      if (response.data?.url || response.data?.filePath) {
        setExternalDeparturePhoto(response.data.url || response.data.filePath);
        setExternalDeparturePhotoError('');
        showNotification('تم رفع صورة المغادرة بنجاح');
      } else {
        throw new Error('لم يتم استلام رابط الصورة');
      }
    } catch (err: any) {
      console.error('Error uploading external departure photo:', err);
      const errMsg = err.response?.data?.error || err.message || 'فشل رفع صورة المغادرة';
      showNotification(errMsg, 'error');
      setExternalDeparturePhotoError(errMsg);
    } finally {
      setIsUploadingExternalDeparturePhoto(false);
    }
  };

  // Handle departure modal opening
  const handleWorkerDeparture = (id: number, name: string) => {
    const worker = housedWorkers.find((w) => w.id === id) || null;
    const todayStr = new Date().toISOString().split('T')[0];
    setSelectedWorkerId(id);
    setSelectedWorkerName(name);
    setSelectedDepartureWorker(worker);

    // Reset external worker departure fields
    setExternalDeparturePhoto('');
    setExternalDepartureNotes('');
    setExternalDeparturePhotoError('');
    setExternalDepartureNotesError('');

    // Smart default tab based on worker's actionTaken or reason
    let defaultType: 'medical' | 'trial_transfer' | 'deportation' | 'final_transfer' = 'deportation';
    if (worker?.actionTaken === 'ترحيل') {
      defaultType = 'deportation';
    } else if (worker?.Reason === 'حالة مرضية' || worker?.Reason === 'حمل') {
      defaultType = 'medical';
    } else if (worker?.actionTaken === 'نقل كفالة') {
      defaultType = 'trial_transfer';
    }

    setActiveDepartureType(defaultType);
    setDepartureHousingDate(todayStr);

    const initialReason = worker?.Reason || 'انتهاء العقد';

    setMedicalDepartureForm({
      hospitalName: '',
      diagnosis: '',
      expectedStayDays: '',
      expectedReturnDate: '',
      medicalReportFile: worker?.medicalReportFile || '',
      notes: '',
    });

    const calculateTrialEndDate = (startDateStr: string, daysStr: string) => {
      if (!startDateStr || !daysStr) return '';
      const days = parseInt(daysStr, 10);
      if (isNaN(days) || days <= 0) return '';
      const d = new Date(startDateStr);
      if (isNaN(d.getTime())) return '';
      d.setDate(d.getDate() + days);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    setTrialTransferForm({
      trialStartDate: todayStr,
      trialPeriodDays: '7',
      trialEndDate: calculateTrialEndDate(todayStr, '7'),
      dailyCost: '',
      newSponsorName: '',
      newSponsorId: '',
      newSponsorPhone: '',
      newSponsorAltPhone: '',
      newSponsorCity: 'الرياض',
      newSponsorDateOfBirth: '',
      salaryCertificateFile: '',
      salaryCertificateFileName: '',
      nationalAddressFile: '',
      nationalAddressFileName: '',
      paymentReceiptFile: '',
      paymentReceiptFileName: '',
      totalCost: '',
      paidAmount: '',
      remainingAmount: '',
      notes: '',
    });

    setDeportationForm({
      externaldeparatureCity: 'الرياض',
      externaldeparatureDate: todayStr,
      externaldeparatureTime: '12:00',
      externalArrivalCity: '',
      externalArrivalCityDate: todayStr,
      externalArrivalCityTime: '18:00',
      externalTicketFile: '',
      externalReason: initialReason,
      deliveryOfficer: '',
      notes: '',
    });

    setTicketFileName('');
    setTicketUploadError('');
    openModal('workerDeparture');
    fetchDeliveryOfficers();
  };

  // Upload Ticket File + OCR extraction
  const handleDeportationTicketUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setTicketUploadError('نوع الملف غير مدعوم (PDF، JPEG، PNG، WEBP فقط)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setTicketUploadError('حجم الملف كبير جداً (الحد الأقصى 10 ميغابايت)');
      return;
    }

    try {
      setIsUploadingTicket(true);
      setTicketUploadError('');
      setTicketFileName(file.name);

      let uploadedUrl = '';
      try {
        const presignRes = await fetch(`/api/upload-presigned-url/internalTicketFile`);
        if (presignRes.ok) {
          const { url, filePath } = await presignRes.json();
          const putRes = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: { 'x-amz-acl': 'public-read', 'Content-Type': file.type },
          });
          if (putRes.ok) {
            uploadedUrl = filePath;
          }
        }
      } catch {
        // fallback
      }

      if (!uploadedUrl) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const res = await axios.post('/api/housing/upload-worker-photo', {
          file: base64,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
        });
        uploadedUrl = res.data?.url || res.data?.filePath || '';
      }

      if (uploadedUrl) {
        setDeportationForm((prev) => ({ ...prev, externalTicketFile: uploadedUrl }));
      }

      // AI Extraction
      setIsExtractingTicket(true);
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('image', file, file.name);
        const response = await fetch('https://aidoc.rawaes.com/api/extractdatafromtickets', {
          method: 'POST',
          body: formDataUpload,
        });
        if (response.ok) {
          const json = await response.json();
          const details = json.tickets_details;
          if (details && typeof details === 'object') {
            const rawArrivalCity = details.arrival_airport ? resolveIataToCity(String(details.arrival_airport)) : '';
            const rawDepartureCity = details.departure_airport ? resolveIataToCity(String(details.departure_airport)) : '';
            const extractedDepDate = details.departure_date ? formatDateYMD(details.departure_date) : '';

            if (extractedDepDate) {
              setDepartureHousingDate(extractedDepDate);
            }

            setDeportationForm((prev) => ({
              ...prev,
              externaldeparatureCity: rawDepartureCity || prev.externaldeparatureCity,
              externalArrivalCity: rawArrivalCity || prev.externalArrivalCity,
              externaldeparatureDate: extractedDepDate || prev.externaldeparatureDate,
              externaldeparatureTime: details.departure_time ? convert12hTo24h(String(details.departure_time)) : prev.externaldeparatureTime,
              externalArrivalCityDate: details.arrival_date ? formatDateYMD(details.arrival_date) : prev.externalArrivalCityDate,
              externalArrivalCityTime: details.arrival_time ? convert12hTo24h(String(details.arrival_time)) : prev.externalArrivalCityTime,
            }));
            showNotification('تم استخراج وقراءة بيانات التذكرة بالذكاء الاصطناعي بنجاح!');
          }
        }
      } catch (aiErr) {
        console.warn('AI Extraction error:', aiErr);
      } finally {
        setIsExtractingTicket(false);
      }
    } catch (err: any) {
      console.error('Ticket upload error:', err);
      setTicketUploadError(err.message || 'حدث خطأ أثناء رفع التذكرة');
    } finally {
      setIsUploadingTicket(false);
    }
  };

  // دالة رفع الملفات مباشرة إلى DigitalOcean Spaces عبر Presigned URL
  const uploadFileDirectToSpaces = async (file: File, hintPrefix: string): Promise<string> => {
    const contentType = file.type || 'application/pdf';
    const presignRes = await fetch(
      `/api/upload-presigned-url/${encodeURIComponent(hintPrefix)}?contentType=${encodeURIComponent(contentType)}`
    );
    if (!presignRes.ok) {
      const errData = await presignRes.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || 'فشل في الحصول على تصريح رفع الملف');
    }
    const { url, filePath } = await presignRes.json();
    const putRes = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': contentType,
        'x-amz-acl': 'public-read',
      },
    });
    if (!putRes.ok) {
      throw new Error('فشل في رفع الملف مباشرة إلى السحابة');
    }
    return filePath;
  };

  // Upload Medical Report File
  const handleMedicalDepartureReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedicalDepartureFile(true);
    try {
      const filePath = await uploadFileDirectToSpaces(file, `medicalReport-${selectedWorkerId || Date.now()}`);
      if (filePath) {
        setMedicalDepartureForm((prev) => ({ ...prev, medicalReportFile: filePath }));
        showNotification('تم رفع التقرير الطبي بنجاح');
      }
    } catch (err: any) {
      console.error('Medical report upload error:', err);
      showNotification(err.message || 'فشل رفع التقرير الطبي', 'error');
    } finally {
      setIsUploadingMedicalDepartureFile(false);
    }
  };

  // Upload Salary Certificate / Bank Statement for Trial Transfer
  const handleSalaryCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingSalaryCert(true);
    try {
      const filePath = await uploadFileDirectToSpaces(file, `salaryCert-${selectedWorkerId || Date.now()}`);
      if (filePath) {
        setTrialTransferForm((prev) => ({ 
          ...prev, 
          salaryCertificateFile: filePath,
          salaryCertificateFileName: file.name,
        }));
        showNotification('تم رفع تعريف الراتب / الشهادة البنكية بنجاح');
      }
    } catch (err: any) {
      console.error('Salary cert upload error:', err);
      showNotification(err.message || 'فشل رفع الملف', 'error');
    } finally {
      setIsUploadingSalaryCert(false);
    }
  };

  // Upload National Address for Trial Transfer
  const handleNationalAddressUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingNationalAddr(true);
    try {
      const filePath = await uploadFileDirectToSpaces(file, `nationalAddress-${selectedWorkerId || Date.now()}`);
      if (filePath) {
        setTrialTransferForm((prev) => ({ 
          ...prev, 
          nationalAddressFile: filePath,
          nationalAddressFileName: file.name,
        }));
        showNotification('تم رفع العنوان الوطني بنجاح');
      }
    } catch (err: any) {
      console.error('National address upload error:', err);
      showNotification(err.message || 'فشل رفع الملف', 'error');
    } finally {
      setIsUploadingNationalAddr(false);
    }
  };

  // Upload Payment Receipt for Trial Transfer
  const handlePaymentReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPaymentReceipt(true);
    try {
      const filePath = await uploadFileDirectToSpaces(file, `paymentReceipt-${selectedWorkerId || Date.now()}`);
      if (filePath) {
        setTrialTransferForm((prev) => ({ 
          ...prev, 
          paymentReceiptFile: filePath,
          paymentReceiptFileName: file.name,
        }));
        showNotification('تم رفع إيصال الدفع / الحوالة بنجاح');
      }
    } catch (err: any) {
      console.error('Payment receipt upload error:', err);
      showNotification(err.message || 'فشل رفع الملف', 'error');
    } finally {
      setIsUploadingPaymentReceipt(false);
    }
  };

  const [deleteFileConfirm, setDeleteFileConfirm] = useState<{
    isOpen: boolean;
    fileUrl: string;
    fileName: string;
    onSuccessClear: () => void;
    isDeleting: boolean;
  }>({
    isOpen: false,
    fileUrl: '',
    fileName: '',
    onSuccessClear: () => {},
    isDeleting: false,
  });

  const confirmDeleteUploadedFile = async () => {
    if (!deleteFileConfirm.fileUrl) {
      deleteFileConfirm.onSuccessClear();
      setDeleteFileConfirm((prev) => ({ ...prev, isOpen: false }));
      return;
    }
    setDeleteFileConfirm((prev) => ({ ...prev, isDeleting: true }));
    try {
      await axios.post('/api/delete-file', { fileUrl: deleteFileConfirm.fileUrl });
      deleteFileConfirm.onSuccessClear();
      showNotification('تم حذف الملف بنجاح ');
    } catch (err: any) {
      console.error('Failed to delete file from DO Spaces:', err);
      deleteFileConfirm.onSuccessClear();
      showNotification('تم إلغاء الملف من النموذج');
    } finally {
      setDeleteFileConfirm({
        isOpen: false,
        fileUrl: '',
        fileName: '',
        onSuccessClear: () => {},
        isDeleting: false,
      });
    }
  };

  // Handle Departure Form Submit
  const handleDepartureSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedWorkerId) return;

    const isExternalWorker = Boolean(
      selectedDepartureWorker?.externalHomedmaid || 
      selectedDepartureWorker?.isExternal
    );

    if (activeDepartureType !== 'deportation') {
      const todayStr = new Date().toISOString().split('T')[0];
      if (departureHousingDate && departureHousingDate > todayStr) {
        showNotification('لا يمكن تسجيل مغادرة بتاريخ في المستقبل', 'error');
        return;
      }
    }

    // التحقق والمغادرة المخصصة للعاملة الخارجية
    if (isExternalWorker) {
      let hasError = false;
      if (!departureHousingDate) {
        showNotification('يرجى تحديد تاريخ المغادرة من السكن', 'error');
        hasError = true;
      }
      if (!externalDeparturePhoto || !externalDeparturePhoto.trim()) {
        setExternalDeparturePhotoError('صورة المغادرة مطلوبة بشكل إجباري');
        showNotification('يرجى إرفاق صورة المغادرة (إجباري للعاملة الخارجية)', 'error');
        hasError = true;
      }
      if (!externalDepartureNotes || !externalDepartureNotes.trim()) {
        setExternalDepartureNotesError('ملاحظات المغادرة مطلوبة بشكل إجباري');
        showNotification('يرجى إدخال ملاحظات المغادرة (إجباري للعاملة الخارجية)', 'error');
        hasError = true;
      }

      if (hasError) return;

      setIsSubmittingDeparture(true);
      try {
        const payload = {
          homeMaid: selectedWorkerId,
          deparatureType: 'external_departure',
          deparatureHousingDate: departureHousingDate,
          deparatureReason: 'مغادرة عاملة خارجية',
          externalDepartureData: {
            departurePhoto: externalDeparturePhoto.trim(),
            notes: externalDepartureNotes.trim(),
            departureReason: 'مغادرة عاملة خارجية',
          },
        };

        const res = await axios.put('/api/housingdeparature', payload);
        showNotification(res.data?.message || 'تم تسجيل مغادرة العاملة الخارجية بنجاح');
        closeModal('workerDeparture');
        fetchWorkers();
        fetchLocations();
      } catch (err: any) {
        console.error('Error submitting external departure:', err);
        showNotification(err.response?.data?.error || 'حدث خطأ أثناء حفظ المغادرة', 'error');
      } finally {
        setIsSubmittingDeparture(false);
      }
      return;
    }

    if (activeDepartureType === 'trial_transfer') {
      if (!departureHousingDate) {
        showNotification('يرجى تحديد تاريخ بدء فترة التجربة (تاريخ مغادرة السكن)', 'error');
        return;
      }
      if (!trialTransferForm.newSponsorName.trim()) {
        showNotification('يرجى إدخال اسم الكفيل الجديد', 'error');
        return;
      }
      if (!trialTransferForm.newSponsorPhone.trim()) {
        showNotification('يرجى إدخال رقم جوال الكفيل الجديد', 'error');
        return;
      }
    }

    if (activeDepartureType === 'medical') {
      if (!departureHousingDate) {
        showNotification('يرجى إدخال تاريخ المغادرة الفعلي من السكن', 'error');
        return;
      }
      if (!medicalDepartureForm.hospitalName.trim()) {
        showNotification('يرجى إدخال اسم المستشفى أو المركز الطبي', 'error');
        return;
      }
      if (!medicalDepartureForm.diagnosis.trim()) {
        showNotification('يرجى إدخال التشخيص أو الحالة الطبية', 'error');
        return;
      }
    }

    if (activeDepartureType === 'deportation') {
      if (!deportationForm.externaldeparatureDate) {
        showNotification('يرجى تحديد تاريخ المغادرة من المدينة (تاريخ الإقلاع)', 'error');
        return;
      }
      if (!deportationForm.externalReason.trim()) {
        showNotification('يرجى تحديد أو إدخال سبب الترحيل', 'error');
        return;
      }
      if (!deportationForm.externalTicketFile) {
        showNotification('يرجى إرفاق ملف تذكرة السفر', 'error');
        return;
      }
      if (!deportationForm.externaldeparatureCity.trim()) {
        showNotification('يرجى اختيار مدينة المغادرة', 'error');
        return;
      }
      if (!deportationForm.externalArrivalCity.trim()) {
        showNotification('يرجى تحديد مدينة/وجهة الوصول', 'error');
        return;
      }
      if (!deportationForm.deliveryOfficer.trim()) {
        showNotification('يرجى اختيار مسؤول التوصيل', 'error');
        return;
      }
    }

    setIsSubmittingDeparture(true);
    try {
      const finalHousingDepartureDate =
        activeDepartureType === 'deportation'
          ? (deportationForm.externaldeparatureDate || departureHousingDate)
          : departureHousingDate;

      const calcEndDate = (sDate: string, days: string) => {
        if (!sDate || !days) return '';
        const d = new Date(sDate);
        if (isNaN(d.getTime())) return '';
        d.setDate(d.getDate() + (parseInt(days, 10) || 0));
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };

      const payload = {
        homeMaid: selectedWorkerId,
        deparatureType: activeDepartureType,
        deparatureHousingDate: finalHousingDepartureDate,
        medicalDepartureData: activeDepartureType === 'medical' ? medicalDepartureForm : undefined,
        deportationData: activeDepartureType === 'deportation' ? deportationForm : undefined,
        transferSponsorshipData: activeDepartureType === 'trial_transfer' ? {
          trialStartDate: finalHousingDepartureDate,
          trialPeriodDays: trialTransferForm.trialPeriodDays,
          trialEndDate: calcEndDate(finalHousingDepartureDate, trialTransferForm.trialPeriodDays),
          dailyCost: trialTransferForm.dailyCost,
          newSponsorName: trialTransferForm.newSponsorName.trim(),
          newSponsorId: trialTransferForm.newSponsorId.trim(),
          newSponsorPhone: trialTransferForm.newSponsorPhone.trim(),
          newSponsorAltPhone: trialTransferForm.newSponsorAltPhone.trim(),
          newSponsorCity: trialTransferForm.newSponsorCity.trim(),
          newSponsorDateOfBirth: trialTransferForm.newSponsorDateOfBirth,
          salaryCertificateFile: trialTransferForm.salaryCertificateFile,
          nationalAddressFile: trialTransferForm.nationalAddressFile,
          paymentReceiptFile: trialTransferForm.paymentReceiptFile,
          totalCost: trialTransferForm.totalCost,
          paidAmount: trialTransferForm.paidAmount,
          remainingAmount: trialTransferForm.remainingAmount || (
            trialTransferForm.totalCost && trialTransferForm.paidAmount
              ? String(Math.max(0, Number(trialTransferForm.totalCost) - Number(trialTransferForm.paidAmount)))
              : ''
          ),
          notes: trialTransferForm.notes.trim(),
        } : undefined,
      };

      const res = await axios.put('/api/housingdeparature', payload);
      showNotification(res.data?.message || 'تم تسجيل المغادرة بنجاح');
      closeModal('workerDeparture');
      fetchWorkers();
      fetchLocations();
    } catch (err: any) {
      console.error('Error submitting departure:', err);
      showNotification(err.response?.data?.error || 'حدث خطأ أثناء حفظ المغادرة', 'error');
    } finally {
      setIsSubmittingDeparture(false);
    }
  };

const [sessionForm, setSessionForm] = useState({
  reason: '',
  date: '',
  time: '',
  result: '',
});
const handleSessionSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const response = await axios.post('/api/sessions', {
      reason: sessionForm.reason,
      date: sessionForm.date,
      time: sessionForm.time,
      result: sessionForm.result,
      idnumber: selectedWorkerId,
    });
    showNotification(response.data.message || 'تم إضافة الجلسة بنجاح');
    setSessionForm({
      reason: '',
      date: '',
      time: '',
      result: '',
    });
    closeModal('sessionModal');
  } catch (error: any) {
    showNotification(error.response?.data?.error || 'خطأ في جلسة العاملة', 'error');
  }
};  
  // Handle form submission for newHousing
  const handlenewHousingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   
    // Prevent double submission
    if (isSubmittingHousing) {
      return;
    }

    // Validate that a worker is selected
    if (!selectedWorker || !selectedWorker.id) {
      showNotification('يرجى اختيار عاملة أولاً', 'error');
      return;
    }

    // Validate housing selection
    if (!formData.location || formData.location === '') {
      setValidationErrors(prev => ({ ...prev, location: true }));
      showNotification('يرجى اختيار السكن', 'error');
      return;
    }

    // Validate housing reason
    if (!formData.reason || formData.reason === '') {
      setValidationErrors(prev => ({ ...prev, reason: true }));
      showNotification('يرجى اختيار سبب التسكين', 'error');
      return;
    }

    // Validate action taken (الإجراء المتخذ إجباري)
    if (!formData.actionTaken || formData.actionTaken === '') {
      setValidationErrors(prev => ({ ...prev, actionTaken: true }));
      showNotification('يرجى تحديد الإجراء المتخذ', 'error');
      return;
    }

    // Validate medical report file if reason is pregnancy or illness
    if (
      (formData.reason === 'حالة مرضية' || formData.reason === 'حمل') &&
      (!formData.medicalReportFile || formData.medicalReportFile.trim() === '')
    ) {
      setValidationErrors((prev) => ({ ...prev, medicalReportFile: true }));
      showNotification('يرجى إرفاق ملف التقرير الطبي لحالة المرض أو الحمل', 'error');
      return;
    }

    // Validate details (التفاصيل والملاحظات إجباري)
    if (!formData.details || formData.details.trim() === '') {
      setValidationErrors((prev) => ({ ...prev, details: true }));
      showNotification('يجب إدخال تفاصيل الحالة بالضبط للعودة لها في أي وقت ومعرفة الحالة بدقة', 'error');
      return;
    }
   
    setIsSubmittingHousing(true);
    try {
      const response = await axios.post('/api/confirmhousinginformation', {
        ...formData,
        homeMaidId: Number(selectedWorker.id),
        entitlementsCost: formData.entitlementsCost,
        entitlementReason: formData.entitlementReason || '',
      });
      showNotification(response.data.message);
      closeModal('housingForm');
      setValidationErrors({
        location: false,
        reason: false,
        actionTaken: false,
        medicalReportFile: false,
        details: false,
        internalLocation: false,
        internalReason: false,
        internalHousingDate: false,
      });
      setFormData({
        homeMaidId: '',
        profileStatus: '',
        deparatureCity: '',
        arrivalCity: '',
        deparatureDate: '',
        houseentrydate: getTodayDateString(),
        deliveryDate: '',
        notes: '',
        StartingDate: '',
        location: locations.length === 1 ? locations[0].id.toString() : '',
        DeparatureTime: '',
        reason: '',
        actionTaken: '',
        medicalReportFile: '',
        employee: user,
        details: '',
        isExternal: workerType,
        isHasEntitlements: false,
        entitlementsCost: '',
        entitlementReason: '',
        salaryReceived: true,
        salaryRemainingAmount: '',
        hasPhone: true,
        phoneReason: '',
        hasIqama: true,
        iqamaReason: '',
        hasPassport: true,
        passportReason: '',
        hasPersonalItems: false,
        personalItemsDetails: '',
        medicalCheckDone: false,
        visaType: 'مدفوعة',
      });
      // Clear selected worker and search term
      setSelectedWorker(null);
      setWorkerSearchTerm('');
      fetchWorkers();
      fetchLocations();
    } catch (error: any) {
      showNotification(error.response?.data?.error || 'خطأ في تسكين العاملة', 'error');
    } finally {
      setIsSubmittingHousing(false);
    }
  };
  // Handle filter input changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'stayDurationSort') {
      setFilters((prev) => ({ ...prev, stayDurationSort: value }));
      if (value === 'longest') {
        setSortKey('houseentrydate');
        setSortDirection('asc');
      } else if (value === 'shortest') {
        setSortKey('houseentrydate');
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setFilters((prev) => ({ ...prev, [name]: value }));
    }
    setPage(1); // Reset to first page on filter change
  };

  const resetAllFilters = () => {
    setFilters({
      Name: '',
      Passportnumber: '',
      reason: '',
      actionTaken: '',
      warrantyStatus: '',
      nationality: '',
      stayDurationSort: '',
      id: '',
      location: '',
      houseentrydate: '',
    });
    setSortKey(null);
    setSortDirection('asc');
    setPage(1);
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
  const handleHousingStatusChange = (status: HousingStatusTab) => {
    setHousingStatus(status);
    setPage(1); // Reset to first page when switching status
  };

  // Handle direct worker type selection (داخلية / خارجية)
  const handleSelectWorkerType = (type: 'داخلية' | 'خارجية') => {
    setWorkerType(type);
    closeModal('workerTypeSelection');
    if (type === 'داخلية') {
      setHousingStep(1);
      openModal('housingForm');
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      const defaultHousing = locations.length === 1 ? String(locations[0].id) : '';
      setExternalHousingStep(1);
      setInternalWorkerForm({
        workerId: '',
        workerName: '',
        mobile: '',
        clientName: '',
        clientMobile: '',
        clientIdNumber: '',
        city: '',
        address: '',
        officeName: '',
        housing: defaultHousing,
        housingDate: todayStr,
        expectedStayDuration: '',
        receiptDate: '',
        reason: 'وصول بالخطأ للمكتب',
        details: '',
        salaryReceived: 'unknown',
        salaryRemainingAmount: '',
        entitlementReason: '',
        hasPhone: 'unknown',
        phoneReason: '',
        hasIqama: 'unknown',
        iqamaReason: '',
        hasPassport: 'unknown',
        passportReason: '',
        hasPersonalItems: 'unknown',
        personalItemsDetails: '',
        medicalCheckDone: 'unknown',
        visaType: 'غير معروف',
      });
      setExternalHomemaidForm({
        name: '',
        image: '',
        nationality: '',
        passportNumber: '',
        passportStartDate: '',
        passportEndDate: '',
        phone: '',
        type: 'recruitment',
        dateofbirth: '',
      });
      setExternalClientForm({
        name: '',
        phone: '',
        city: '',
      });
      setShowExternalExtraDetails(false);
      openModal('internalWorkerModal');
    }
  };
  // جلب الجنسيات الفريدة من قاعدة البيانات عند تحميل الصفحة
  useEffect(() => {
    fetch('/api/housing/unique-nationalities')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.nationalities && Array.isArray(data.nationalities)) {
          setUniqueNationalities(data.nationalities);
        }
      })
      .catch((err) => console.error('Error loading nationalities from DB:', err));
  }, []);

  // الاسم حروف فقط (عربي وإنجليزي ومسافات)
  const NAME_LETTERS_ONLY = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z\s]*$/;
  const handleExternalNameChange = (val: string) => {
    if (NAME_LETTERS_ONLY.test(val)) setExternalHomemaidForm((p) => ({ ...p, name: val }));
  };
  // رقم الجواز: لا يقبل حروف عربي (أرقام وحروف إنجليزي و - / فقط)
  const PASSPORT_NO_ARABIC = /^[0-9a-zA-Z\-\/]*$/;
  const handleExternalPassportChange = (val: string) => {
    if (PASSPORT_NO_ARABIC.test(val)) setExternalHomemaidForm((p) => ({ ...p, passportNumber: val }));
  };
  // رقم الجوال: أرقام و + فقط (لا يقبل حروف)
  const PHONE_NUMBERS_PLUS = /^[0-9+]*$/;
  const handleExternalPhoneChange = (val: string) => {
    if (PHONE_NUMBERS_PLUS.test(val)) setExternalHomemaidForm((p) => ({ ...p, phone: val }));
  };
  const handleExternalClientPhoneChange = (val: string) => {
    if (PHONE_NUMBERS_PLUS.test(val)) setExternalClientForm((p) => ({ ...p, phone: val }));
  };

  // رفع صورة العاملة الخارجية
  const handleExternalPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showNotification('حجم الصورة كبير جداً، الحد الأقصى 15 ميجابايت', 'error');
      return;
    }

    try {
      setIsUploadingExternalPhoto(true);

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await axios.post('/api/housing/upload-worker-photo', {
        file: base64,
        filename: file.name,
        contentType: file.type || 'image/jpeg',
      });

      const fileUrl = response.data.url || response.data.filePath;
      setExternalHomemaidForm((prev) => ({ ...prev, image: fileUrl }));
      showNotification('تم رفع صورة العاملة بنجاح');
    } catch (error: any) {
      console.error('External worker photo upload failed:', error);
      const errMsg = error.response?.data?.error || error.message || 'حدث خطأ أثناء رفع صورة العاملة';
      showNotification(errMsg, 'error');
    } finally {
      setIsUploadingExternalPhoto(false);
    }
  };

  // Validate Step 1 of External Worker Housing
  const validateExternalHousingStep1 = () => {
    if (!externalHomemaidForm.name || !externalHomemaidForm.name.trim()) {
      showNotification('يرجى إدخال اسم العاملة', 'error');
      return false;
    }
    if (!NAME_LETTERS_ONLY.test(externalHomemaidForm.name.trim())) {
      showNotification('اسم العاملة يجب أن يحتوي على حروف فقط', 'error');
      return false;
    }
    if (!externalHomemaidForm.image || !externalHomemaidForm.image.trim()) {
      showNotification('يرجى رفع صورة العاملة (إجباري)', 'error');
      return false;
    }
    if (!internalWorkerForm.housing || internalWorkerForm.housing === '') {
      setValidationErrors((prev) => ({ ...prev, internalLocation: true }));
      showNotification('يرجى اختيار السكن', 'error');
      return false;
    }
    if (!internalWorkerForm.housingDate || internalWorkerForm.housingDate === '') {
      setValidationErrors((prev) => ({ ...prev, internalHousingDate: true }));
      showNotification('يرجى اختيار تاريخ التسكين', 'error');
      return false;
    }
    if (!internalWorkerForm.expectedStayDuration || !internalWorkerForm.expectedStayDuration.trim()) {
      showNotification('يرجى تحديد مدة البقاء المتوقعة', 'error');
      return false;
    }
    if (!internalWorkerForm.reason || internalWorkerForm.reason === '') {
      setValidationErrors((prev) => ({ ...prev, internalReason: true }));
      showNotification('يرجى اختيار سبب التسكين', 'error');
      return false;
    }
    if (!internalWorkerForm.details || !internalWorkerForm.details.trim()) {
      showNotification('يرجى كتابة تفاصيل التسكين', 'error');
      return false;
    }
    if (externalHomemaidForm.phone && externalHomemaidForm.phone.trim()) {
      if (!PHONE_NUMBERS_PLUS.test(externalHomemaidForm.phone.trim())) {
        showNotification('رقم جوال العاملة يقبل أرقام و + فقط', 'error');
        return false;
      }
    }
    if (externalClientForm.phone && externalClientForm.phone.trim()) {
      if (!PHONE_NUMBERS_PLUS.test(externalClientForm.phone.trim())) {
        showNotification('رقم جوال العميل يقبل أرقام و + فقط', 'error');
        return false;
      }
    }
    return true;
  };

  // Handle internal worker form submission (تسكين خارجي - تسجيل عاملة جديدة في externalHomedmaid)
  const handleInternalWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateExternalHousingStep1()) {
      setExternalHousingStep(1);
      return;
    }

    setIsSubmittingInternalWorker(true);
    try {
      const formData = {
        name: externalHomemaidForm.name.trim(),
        image: externalHomemaidForm.image.trim(),
        nationality: externalHomemaidForm.nationality.trim() || undefined,
        passportNumber: externalHomemaidForm.passportNumber.trim() || undefined,
        passportStartDate: externalHomemaidForm.passportStartDate || undefined,
        passportEndDate: externalHomemaidForm.passportEndDate || undefined,
        phone: externalHomemaidForm.phone.trim() || undefined,
        type: externalHomemaidForm.type,
        dateofbirth: externalHomemaidForm.dateofbirth || undefined,
        clientName: externalClientForm.name.trim() || undefined,
        clientPhone: externalClientForm.phone.trim() || undefined,
        clientCity: externalClientForm.city.trim() || undefined,
        location: internalWorkerForm.housing,
        houseentrydate: internalWorkerForm.housingDate,
        expectedStayDuration: internalWorkerForm.expectedStayDuration.trim(),
        deliveryDate: internalWorkerForm.receiptDate || undefined,
        reason: internalWorkerForm.reason,
        details: internalWorkerForm.details.trim(),
        employee: user,
        salaryReceived: internalWorkerForm.salaryReceived,
        salaryRemainingAmount: internalWorkerForm.salaryRemainingAmount || undefined,
        entitlementReason: internalWorkerForm.entitlementReason || undefined,
        isHasEntitlements: !internalWorkerForm.salaryReceived,
        hasPhone: internalWorkerForm.hasPhone,
        phoneReason: internalWorkerForm.phoneReason || undefined,
        hasIqama: internalWorkerForm.hasIqama,
        iqamaReason: internalWorkerForm.iqamaReason || undefined,
        hasPassport: internalWorkerForm.hasPassport,
        passportReason: internalWorkerForm.passportReason || undefined,
        hasPersonalItems: internalWorkerForm.hasPersonalItems,
        personalItemsDetails: internalWorkerForm.personalItemsDetails || undefined,
        medicalCheckDone: internalWorkerForm.medicalCheckDone,
        visaType: internalWorkerForm.visaType,
      };

      const response = await axios.post('/api/housing/add-external-housed-worker', formData);
      showNotification(response.data.message || 'تم تسكين العاملة الخارجية بنجاح');
      closeModal('internalWorkerModal');
      setValidationErrors({
        location: false,
        reason: false,
        actionTaken: false,
        medicalReportFile: false,
        details: false,
        internalLocation: false,
        internalReason: false,
        internalHousingDate: false,
      });
      fetchWorkers();
      fetchLocations();
    } catch (error: any) {
      showNotification(error.response?.data?.error || 'خطأ في تسكين العاملة الخارجية', 'error');
    } finally {
      setIsSubmittingInternalWorker(false);
    }
  };
  // Handle worker search input - with debounce after stopping typing
  const handleWorkerSearch = (value: string) => {
    setWorkerSearchTerm(value);
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    if (!value.trim()) {
      setWorkerSuggestions([]);
      setSelectedWorker(null);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    searchDebounceTimer.current = setTimeout(() => {
      searchWorkers(value);
    }, 500);
  };
  // Handle worker selection from suggestions
  const handleWorkerSelection = (worker: any) => {
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    setSelectedWorker(worker);
    setWorkerSearchTerm(worker.name || worker.Name || '');
    setWorkerSuggestions([]);
    
    // Auto-fill client data if available (for rental/internal workers)
    if (worker.clientData && workerType === 'داخلية') {
      setInternalWorkerForm(prev => ({
        ...prev,
        clientName: worker.clientData.clientName || '',
        clientMobile: worker.clientData.clientMobile || '',
        clientIdNumber: worker.clientData.clientIdNumber || '',
        city: worker.clientData.city || '',
        address: worker.clientData.address || '',
      }));
    }
  };
  
  // Handle external worker search input - with debounce
  const handleExternalWorkerSearch = (value: string) => {
    setExternalWorkerSearchTerm(value);
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    if (!value.trim()) {
      setExternalWorkerSuggestions([]);
      setSelectedExternalWorker(null);
      setIsSearchingExternal(false);
      return;
    }
    setIsSearchingExternal(true);
    searchDebounceTimer.current = setTimeout(() => {
      searchExternalWorkers(value);
    }, 500);
  };
  
  // Handle external worker selection from suggestions
  const handleExternalWorkerSelection = (worker: any) => {
    setSelectedExternalWorker(worker);
    setExternalWorkerSearchTerm(worker.name || worker.Name || '');
    setExternalWorkerSuggestions([]);
    
    // Auto-fill form with worker data AND client data from transferSponsorShips
    setInternalWorkerForm(prev => ({
      ...prev,
      workerId: worker.id.toString(),
      workerName: worker.name,
      mobile: worker.phone,
      // Fill client data from API response (clientData from transferSponsorShips NewClient)
      clientName: worker.clientData?.clientName || '',
      clientMobile: worker.clientData?.clientMobile || '',
      clientIdNumber: worker.clientData?.clientIdNumber || '',
      city: worker.clientData?.city || '',
      address: worker.clientData?.address || '',
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
  // Fetch initial data and counts on component mount
  useEffect(() => {
    console.log('Initial useEffect triggered');
    fetchLocations();
    fetchHomemaids();
    fetchCounts();
    fetchWorkers();
  }, []); // Only run once on mount
const [isExporting, setIsExporting] = useState(false);
const [exportHousedWorkers, setExportHousedWorkers] = useState<any[]>([]);
async function fetchData() {
    const response = await axios.get(`/api/confirmhousinginformation?contractType=${activeTab}&format=${format}&size=10000`);
    const data = response.data;
    console.log('Export data:', data);
    setExportHousedWorkers(data.housing);

}
//حل مشكلة اختيار الاعمدة
useEffect(() => {

fetchData();

},[]);

function getSaudiDateString(dateInput: string | Date): string {
  const d = new Date(dateInput);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}



function getSaudiGuaranteeInfo(kingdomEntryDate?: string | Date | null) {
  if (!kingdomEntryDate) return null;
  const d = new Date(kingdomEntryDate);
  if (isNaN(d.getTime())) return null;

  const saudiEntryStr = getSaudiDateString(d);
  const [eYear, eMonth, eDay] = saudiEntryStr.split('-').map(Number);
  const entryUtc = Date.UTC(eYear, eMonth - 1, eDay);
  const guaranteeEndUtc = entryUtc + 90 * 24 * 60 * 60 * 1000;

  const nowSaudiStr = getSaudiDateString(new Date());
  const [nYear, nMonth, nDay] = nowSaudiStr.split('-').map(Number);
  const nowUtc = Date.UTC(nYear, nMonth - 1, nDay);

  const diffDays = Math.round((guaranteeEndUtc - nowUtc) / (24 * 60 * 60 * 1000));
  const endDateFormatted = getDate(new Date(guaranteeEndUtc));

  return {
    entryDate: getDate(d),
    guaranteeEndDate: endDateFormatted,
    remainingDays: diffDays,
    diffDays,
    isExpired: diffDays < 0,
    text: diffDays >= 0 ? `متبقي ${diffDays} يوم` : `منذ ${Math.abs(diffDays)} يوم`,
    fullStatus: diffDays >= 0 ? 'الضمان ساري' : 'الضمان منتهي',
  };
}
const exportToPDF = async () => {
  setIsExporting(true);
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.width;

  // 🖼️ إضافة الشعار
  const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
  const logoBuffer = await logo.arrayBuffer();
  const logoBytes = new Uint8Array(logoBuffer);
  const logoBase64 = Buffer.from(logoBytes).toString('base64');
  doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

  // 🖋️ تحميل الخط العربي
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
    return;
  }

  // 🏷️ العنوان
  doc.setFontSize(16);
  doc.text('عاملات في السكن', 150, 20, { align: 'right' });

  // ⏰ التاريخ أعلى الصفحة
  doc.setFontSize(8);
  // 📋 الأعمدة والصفوف
  const tableColumn = [
    'ملاحظات',
    'لديها مستحقات',
    'الموظف',
    'مدة السكن',
    'تاريخ التسكين',
    'سبب التسكين',
    'السكن',
    'رقم الجوال',
    'بيانات العميل',
    'بيانات العاملة',
  ];

  const tableRows = Array.isArray(exportHousedWorkers)
    ? exportHousedWorkers.map((row) => [
        row?.Details ?? 'غير متوفر',
        row.isHasEntitlements ?? 'غير متوفر',
        row?.employee ?? 'غير متوفر',
        row?.Duration ?? 'غير متوفر',
        housingStatus === 'housed'
          ? getDate(row.houseentrydate)
          : getDate(row.deparatureDate) ?? 'غير متوفر',
        housingStatus === 'housed'
          ? row.Reason
          : row.deparatureReason ?? 'غير متوفر',
        locations.find((loc) => loc.id === row.location_id)?.location ?? 'غير متوفر',
        row.Order?.phone ?? 'غير متوفر',
        getHousingClientName(row as HousedWorker) || 'غير متوفر',
        `${row.Order?.Name ?? row.externalHomedmaid?.name ?? 'غير متوفر'}\n(${row.Order?.Passportnumber ?? row.externalHomedmaid?.passportNumber ?? 'غير متوفر'})\n[${row.Order?.Nationalitycopy ?? row.externalHomedmaid?.nationality ?? 'غير متوفر'}]`,
      ])
    : [];

  // 🧾 الجدول
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    styles: {
      font: 'Amiri',
      halign: 'right',
      fontSize: 10,
      cellPadding: 2,
      textColor: [0, 0, 0],
      overflow: 'hidden',
    },
    headStyles: {
      fillColor: [26, 77, 79],
      textColor: [255, 255, 255],
      halign: 'right',
      overflow: 'hidden',
    },
    columnStyles: {
      0: { cellWidth: 'auto', overflow: 'hidden' },
      1: { cellWidth: 'auto', overflow: 'hidden' },
      2: { cellWidth: 'auto', overflow: 'hidden' },
      3: { cellWidth: 'auto', overflow: 'hidden' },
      4: { cellWidth: 'auto', overflow: 'hidden' },
      5: { cellWidth: 'auto', overflow: 'hidden' },
      6: { cellWidth: 'auto', overflow: 'hidden' },
      7: { cellWidth: 'auto', overflow: 'hidden' },
      8: { cellWidth: 'auto', overflow: 'hidden' },
      9: { cellWidth: 'auto', overflow: 'hidden' },
      10: { cellWidth: 'auto', overflow: 'hidden' },
      11: { cellWidth: 'auto', overflow: 'hidden' },
    },
    margin: { top: 40, right: 10, left: 10 },
    didParseCell: (data: any) => {
      data.cell.styles.halign = 'center';
    },

    // ⚙️ هنا نضيف الفوتر في كل صفحة
    didDrawPage: () => {
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;

      doc.setFontSize(10);
      doc.setFont('Amiri', 'normal');

      // 👈 الاسم (يسار)
      doc.text(userName, 10, pageHeight - 10, { align: 'left' });

      // 🔢 رقم الصفحة (وسط)
      const pageNumber = `صفحة ${(doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : (doc as any).internal?.pages?.length || 1}`;
      doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });

      // 👉 التاريخ (يمين)
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
  doc.save('عاملات في السكن.pdf');
  setIsExporting(false);
};

  // Export to Excel
  const exportToExcel = async () => {
    setIsExporting(true);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('عاملات في السكن', { properties: { defaultColWidth: 20 } });

    worksheet.columns = [
      { header: 'اسم العاملة', key: 'name', width: 15 },
      { header: 'بيانات العميل', key: 'clientName', width: 18 },
      { header: 'رقم الجوال', key: 'phone', width: 15 },
      { header: 'الجنسية', key: 'nationality', width: 15 },
      { header: 'رقم الجواز', key: 'Passportnumber', width: 15 },
      { header: 'السكن', key: 'location', width: 15 },
      { header: 'سبب التسكين', key: 'Reason', width: 15 },
      { header: 'تاريخ التسكين', key: 'houseentrydate', width: 15 },
      { header: 'مدة السكن', key: 'Duration', width: 15 },
      { header: 'الموظف', key: 'employee', width: 15 },
      { header: 'لديها مستحقات', key: 'isHasEntitlements', width: 15 },
      { header: 'ملاحظات', key: 'Details', width: 15 },
    ];

    worksheet.getRow(1).font = { name: 'Amiri', size: 12 };
    worksheet.getRow(1).alignment = { horizontal: 'right' };
   
    Array.isArray(exportHousedWorkers) &&
      exportHousedWorkers.forEach((row: any) => {
        worksheet.addRow({
          name: row.Order?.Name || row.externalHomedmaid?.name || 'غير متوفر',
          clientName: getHousingClientName(row as HousedWorker) || 'غير متوفر',
          phone: row.Order?.phone || 'غير متوفر',
          nationality: row.Order?.office?.Country || 'غير متوفر',
          Passportnumber: row.Order?. Passportnumber || 'غير متوفر',
          Housing: locations.find((loc) => loc.id === row.location_id)?.location || 'غير متوفر',
          Reason: housingStatus === 'housed' ? row.Reason : row.deparatureReason || 'غير متوفر',
          Date: housingStatus === 'housed' ? getDate(row.houseentrydate) : getDate(row.deparatureDate) || 'غير متوفر',
          Duration: calculateDuration(row.houseentrydate) || 'غير متوفر',
          Employee: row.employee || 'غير متوفر',
          HasEntitlements: row.isHasEntitlements || 'غير متوفر',
          Notes: row.Details || 'غير متوفر',
        }).alignment = { horizontal: 'right' };
      });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'عاملات في السكن.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  const [entitlementsCost, setEntitlementsCost] = useState<string | number>(0);
  const [entitlementReason, setEntitlementReason] = useState('');
const handleEntitlementsSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const workerId = selectedWorker?.id || selectedWorkerId;
    if (!workerId) {
      showNotification('يرجى اختيار عاملة أولاً', 'error');
      return;
    }
    const response = await axios.post('/api/entitlemnthousedarrivalspage', { id: workerId, entitlementsCost: Number(entitlementsCost), entitlementReason });
    showNotification('تم تسجيل المستحقات بنجاح');
    closeModal('amountModal');
    fetchWorkers(); // Refresh the data
  } catch (error: any) {
    showNotification(error.response?.data?.error || 'خطأ في تسجيل المستحقات', 'error');
    closeModal('amountModal');
  }
};

const handleDeleteNote = (noteId: number) => {
  setNoteToDelete(noteId);
  openModal('deleteNoteConfirm');
};

const confirmDeleteNote = async () => {
  if (!noteToDelete) return;

  try {
    await axios.delete(`/api/deletehousenote?id=${noteToDelete}`);
    showNotification('تم حذف الملاحظة بنجاح');
    if (selectedNotesWorker) {
      setSelectedNotesWorker((prev: any) =>
        prev
          ? {
              ...prev,
              HousedWorkerNotes: (prev.HousedWorkerNotes || []).filter((n: any) => n.id !== noteToDelete),
            }
          : prev
      );
    }
    closeModal('deleteNoteConfirm');
    setNoteToDelete(null);
    fetchWorkers();
  } catch (error: any) {
    showNotification(error.response?.data?.error || 'خطأ في حذف الملاحظة', 'error');
    closeModal('deleteNoteConfirm');
  }
};
  // Fetch data when filters or tabs change
  useEffect(() => {
    console.log('useEffect triggered with:', { page, sortKey, sortDirection, filters, activeTab, housingStatus });
    fetchWorkers();
    fetchCounts();
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
  
  // Close location dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside any location dropdown
      if (!target.closest('[data-location-dropdown]')) {
        setOpenLocationDropdown(null);
      }
    };
    if (openLocationDropdown !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openLocationDropdown]);
  return (
    <Layout>
      <Head>
        <title>Dashboard Preview</title>
        {/* <meta name="viewport" content="width=device-width, initial-scale=1.0" /> */}
      </Head>
      <section className={`min-h-screen ${Style['tajawal-regular']}`}>
        <div className="w-full">
          <main className="py-4 px-1 sm:px-2 flex flex-col gap-5 w-full">
            {/* ------------------------------------------------------------- */}
            {/* هيدر الصفحة الرئيسي */}
            {/* ------------------------------------------------------------- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-gray-200/70">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
                    <HomeIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">إدارة التسكين</h1>
                    <p className="text-xs text-gray-500 mt-0.5">متابعة الطاقة الاستيعابية للسكن والعاملات المقيمات</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 self-end sm:self-center">
                <button
                  onClick={() => openModal('addResidence')}
                  className="flex items-center gap-2 bg-teal-800 hover:bg-teal-900 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  إضافة سكن جديد
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* بطاقات مساكن الإيواء ومؤشرات الإشغال */}
            {/* ------------------------------------------------------------- */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {locations && locations.length > 0 ? locations.map((location) => {
                const totalCap = location.quantity || 1;
                const occ = location.currentOccupancy || 0;
                const progress = (occ / totalCap) * 100;
                const isFull = progress >= 100;
                const isPartial = progress > 50 && progress < 100;
                const statusText = isFull ? 'السكن ممتلئ' : isPartial ? 'السكن ممتلئ جزئياً' : 'السكن متاح';
                
                const progressHexColor = isFull ? '#dc2626' : isPartial ? '#d97706' : '#16a34a';
                const badgeBg = isFull ? '#fef2f2' : isPartial ? '#fffbeb' : '#f0fdf4';
                const badgeText = isFull ? '#b91c1c' : isPartial ? '#b45309' : '#15803d';
                const badgeBorder = isFull ? '#fecaca' : isPartial ? '#fde68a' : '#bbf7d0';

                return (
                  <div key={location.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 text-right relative flex flex-col justify-between gap-3 group">
                    <div>
                      {/* رأس بطاقة السكن */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-sm shrink-0">
                            <Building className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 truncate">{location.location}</h3>
                            {location.supervisorUser ? (
                              <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                                <User className="w-3 h-3 text-teal-700 shrink-0" />
                                مشرفة: <strong className="text-gray-700 truncate">{location.supervisorUser.Name}</strong>
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedLocationForSupervisor(location);
                                  openModal('supervisorModal');
                                }}
                                className="text-[11px] text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                              >
                                <UserPlus className="w-3 h-3" />
                                تعيين مشرفة
                              </button>
                            )}
                          </div>
                        </div>

                        {/* أزرار الإجراءات */}
                        <div className="flex items-center gap-1 shrink-0" data-location-dropdown>
                          <button
                            onClick={() => {
                              setSelectedLocationForSupervisor(location);
                              openModal('supervisorModal');
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                            title="تعديل المشرفة"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>

                          <div className="relative">
                            <button
                              onClick={() => {
                                setOpenLocationDropdown(openLocationDropdown === location.id ? null : location.id);
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                              title="خيارات السكن"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {openLocationDropdown === location.id && (
                              <div className="absolute left-0 mt-1 w-32 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden py-1" data-location-dropdown>
                                <button
                                  onClick={() => {
                                    setEditingLocation(location);
                                    openModal('editResidence');
                                    setOpenLocationDropdown(null);
                                  }}
                                  className="w-full text-right py-2 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  تعديل السكن
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteLocation(location);
                                    setOpenLocationDropdown(null);
                                  }}
                                  className="w-full text-right py-2 px-3 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  حذف السكن
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* أرقام الإشغال والنسبة */}
                      <div className="flex items-baseline justify-between mt-3 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl font-extrabold text-gray-900 tracking-tight" dir="ltr">{occ} / {location.quantity}</span>
                          <span className="text-[11px] text-gray-500 font-medium">عاملة</span>
                        </div>
                        <span 
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                          style={{ backgroundColor: badgeBg, color: badgeText, borderColor: badgeBorder }}
                        >
                          {statusText}
                        </span>
                      </div>
                    </div>

                    {/* شريط نسبة الإشغال */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
                        <span>نسبة الإشغال</span>
                        <span dir="ltr">{progress < 0.01 ? progress.toFixed(0) : Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(100, Math.max(0, progress))}%`,
                            backgroundColor: progressHexColor
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-full bg-white border border-gray-200 rounded-2xl py-8 text-center">
                  <p className="text-gray-500 text-sm">لا توجد بيانات سكن متاحة</p>
                </div>
              )}
            </section>

            {/* ------------------------------------------------------------- */}
            {/* قسم إدارة العاملات والجدول */}
            {/* ------------------------------------------------------------- */}
            <section className="bg-white border border-gray-200 rounded-2xl shadow-xs p-4 sm:p-5 flex flex-col gap-4 w-full">
              {/* شريط التبويبات الرئيسي وزر تسكين عاملة */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-gray-100 pb-3">
                <nav className="flex items-center gap-4">
                  <button
                    type="button"
                    className={`flex items-center gap-2.5 pb-2 px-1 cursor-pointer transition-all border-b-2 font-bold text-sm ${
                      activeTab === 'recruitment' 
                        ? 'border-teal-800 text-teal-900' 
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                    onClick={() => handleTabChange('recruitment')}
                  >
                    <span>عاملات الاستقدام</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold transition-all ${
                      activeTab === 'recruitment' 
                        ? 'bg-teal-800 text-white shadow-xs' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tabCounts.recruitment || 0}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`flex items-center gap-2.5 pb-2 px-1 cursor-pointer transition-all border-b-2 font-bold text-sm ${
                      activeTab === 'rental' 
                        ? 'border-teal-800 text-teal-900' 
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                    onClick={() => handleTabChange('rental')}
                  >
                    <span>عاملات التأجير</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold transition-all ${
                      activeTab === 'rental' 
                        ? 'bg-teal-800 text-white shadow-xs' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tabCounts.rental || 0}
                    </span>
                  </button>
                </nav>

                {/* زر تسكين عاملة */}
                <button
                  onClick={() => openModal('workerTypeSelection')}
                  className="flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-900 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold py-2 px-4 rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  تسكين عاملة
                </button>
              </div>

              {/* شريط البحث وتصدير البيانات والخيارات */}
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 flex-wrap flex-1">
                  <div className="bg-gray-50 border border-gray-300 focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-100 rounded-xl flex items-center gap-2 px-3 py-2 transition-all flex-1 min-w-[240px] max-w-md">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      name="Name"
                      placeholder="بحث بالاسم، رقم الجواز، هوية أو جوال العميل..."
                      value={filters.Name}
                      onChange={handleFilterChange}
                      className="bg-transparent border-0 outline-none ring-0 focus:ring-0 focus:outline-none focus:border-0 shadow-none text-right text-xs sm:text-sm w-full text-gray-900 placeholder-gray-400"
                      style={{ outline: 'none', boxShadow: 'none', border: 'none' }}
                    />
                  </div>
                  <button
                    onClick={() => openModal('columnVisibility')}
                    className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm font-medium py-2 px-3.5 rounded-xl hover:bg-gray-50 shadow-xs transition-all cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    الأعمدة
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs sm:text-sm font-medium py-2 px-3.5 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    تصدير Excel
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs sm:text-sm font-medium py-2 px-3.5 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <FileTextFilled className="w-4 h-4" />
                    تصدير PDF
                  </button>
                </div>
              </div>

              {/* شريط الفلاتر المتقدمة المضافة */}
              {(() => {
                const activeFilterCount = [
                  filters.reason,
                  filters.actionTaken,
                  filters.warrantyStatus,
                  filters.nationality,
                  filters.stayDurationSort,
                  filters.location,
                ].filter(Boolean).length;

                return (
                  <div className="bg-white border border-gray-200/90 rounded-2xl p-3 sm:p-3.5 shadow-xs flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800">
                        <Filter className="w-4 h-4 text-teal-800" />
                        <span>تصفية وفرز السجلات</span>
                        {activeFilterCount > 0 && (
                          <span className="bg-teal-800 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                            {activeFilterCount} نشط
                          </span>
                        )}
                      </div>
                      {activeFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={resetAllFilters}
                          className="flex items-center gap-1.5 text-xs text-rose-700 hover:text-rose-800 font-semibold px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>إعادة ضبط الفلاتر</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                      {/* 1. فلتر سبب التسكين */}
                      <div className="relative">
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">سبب التسكين</label>
                        <div className="relative">
                          <select
                            name="reason"
                            value={filters.reason}
                            onChange={handleFilterChange}
                            style={{ backgroundImage: 'none' }}
                            className={`w-full appearance-none bg-gray-50 border rounded-xl py-2 pr-3 pl-8 text-right text-xs font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 outline-none transition-all cursor-pointer ${
                              filters.reason ? 'border-teal-700 bg-teal-50/40 font-bold text-teal-900' : 'border-gray-200'
                            }`}
                          >
                            <option value="">جميع أسباب التسكين</option>
                            {HOUSING_REASON_FILTER_OPTIONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>

                      {/* 2. فلتر الإجراء المتخذ */}
                      <div className="relative">
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">الإجراء المتخذ</label>
                        <div className="relative">
                          <select
                            name="actionTaken"
                            value={filters.actionTaken}
                            onChange={handleFilterChange}
                            style={{ backgroundImage: 'none' }}
                            className={`w-full appearance-none bg-gray-50 border rounded-xl py-2 pr-3 pl-8 text-right text-xs font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 outline-none transition-all cursor-pointer ${
                              filters.actionTaken ? 'border-teal-700 bg-teal-50/40 font-bold text-teal-900' : 'border-gray-200'
                            }`}
                          >
                            <option value="">جميع الإجراءات</option>
                            {ACTION_TAKEN_FILTER_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>

                      {/* 3. فلتر حالة الضمان */}
                      <div className="relative">
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">حالة الضمان</label>
                        <div className="relative">
                          <select
                            name="warrantyStatus"
                            value={filters.warrantyStatus}
                            onChange={handleFilterChange}
                            style={{ backgroundImage: 'none' }}
                            className={`w-full appearance-none bg-gray-50 border rounded-xl py-2 pr-3 pl-8 text-right text-xs font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 outline-none transition-all cursor-pointer ${
                              filters.warrantyStatus ? 'border-teal-700 bg-teal-50/40 font-bold text-teal-900' : 'border-gray-200'
                            }`}
                          >
                            <option value="">كل حالات الضمان</option>
                            {WARRANTY_STATUS_FILTER_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>

                      {/* 4. فرز مدة الإقامة في السكن */}
                      <div className="relative">
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">مدة الإقامة في السكن</label>
                        <div className="relative">
                          <select
                            name="stayDurationSort"
                            value={filters.stayDurationSort}
                            onChange={handleFilterChange}
                            style={{ backgroundImage: 'none' }}
                            className={`w-full appearance-none bg-gray-50 border rounded-xl py-2 pr-3 pl-8 text-right text-xs font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 outline-none transition-all cursor-pointer ${
                              filters.stayDurationSort ? 'border-teal-700 bg-teal-50/40 font-bold text-teal-900' : 'border-gray-200'
                            }`}
                          >
                            <option value="">الترتيب الافتراضي</option>
                            {STAY_DURATION_SORT_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>

                      {/* 5. فلتر الجنسية (معتمد على الجنسيات في قاعدة البيانات) */}
                      <div className="relative">
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">الجنسية</label>
                        <div className="relative">
                          <select
                            name="nationality"
                            value={filters.nationality}
                            onChange={handleFilterChange}
                            style={{ backgroundImage: 'none' }}
                            className={`w-full appearance-none bg-gray-50 border rounded-xl py-2 pr-3 pl-8 text-right text-xs font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 outline-none transition-all cursor-pointer ${
                              filters.nationality ? 'border-teal-700 bg-teal-50/40 font-bold text-teal-900' : 'border-gray-200'
                            }`}
                          >
                            <option value="">جميع الجنسيات</option>
                            {uniqueNationalities.map((nat) => (
                              <option key={nat} value={nat}>
                                {nat}
                              </option>
                            ))}
                          </select>
                          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Scheduled Departures Alert Banner */}
              {housingStatus === 'housed' && (() => {
                const scheduledList = housedWorkers.filter(
                  (w: any) =>
                    w.actionTaken === 'ترحيل' &&
                    w.deportationData?.externaldeparatureTime
                );
                if (scheduledList.length === 0) return null;

                return (
                  <div className="bg-gradient-to-l from-rose-50 via-amber-50/60 to-rose-50 border border-rose-200 rounded-xl p-3 shadow-xs mb-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 mb-2 text-rose-950 font-bold text-xs sm:text-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
                      <Plane className="w-4 h-4 text-rose-600" />
                      <span>تنبيه مغادرات ورحلات مجدولة ({scheduledList.length} عاملة):</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {scheduledList.map((sw: any) => {
                        const sName =
                          sw.Order?.Name ||
                          sw.externalHomedmaid?.name ||
                          `عاملة #${sw.id}`;
                        const depData = sw.deportationData;
                        const depTime = depData?.externaldeparatureTime || '';
                        const depDate = depData?.externaldeparatureDate
                          ? String(depData.externaldeparatureDate).split('T')[0]
                          : '';
                        const officer = depData?.deliveryOfficer || '';
                        const dest = depData?.externalArrivalCity || '';

                        return (
                          <div
                            key={sw.id}
                            className="bg-white/95 border border-rose-200 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs shadow-2xs"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-gray-900 truncate">
                                {sName}
                              </span>
                              <span className="text-[11px] text-gray-600 truncate">
                                {dest ? `الوجهة: ${dest}` : 'ترحيل خارجي'}
                                {officer ? ` | مسؤول التوصيل: ${officer}` : ''}
                              </span>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-rose-900 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
                                <Clock className="w-3 h-3 text-rose-700" />
                                <span dir="ltr">{depTime}</span>
                              </span>
                              {depDate && (
                                <span className="text-[10px] text-gray-500 mt-0.5">
                                  {depDate}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-teal-800 text-white">
                      {columnVisibility.id && <th className="py-2 px-2 text-right text-md border-b no-wrap text-nowrap border-teal-700 w-12">#</th>}
                      {columnVisibility.Name && <th className="py-2 px-2 text-right text-md border-b no-wrap text-nowrap border-teal-700">بيانات العاملة</th>}
                      {columnVisibility.clientName && <th className="py-2 px-2 text-right text-md border-b no-wrap text-nowrap border-teal-700">بيانات العميل</th>}
                      {columnVisibility.location && <th className="py-2 px-2 text-right text-md border-b no-wrap text-nowrap border-teal-700">{housingStatus === 'housed' ? 'بيانات السكن والمدة' : 'السكن وتاريخ المغادرة'}</th>}
                      {columnVisibility.kingdomentryDate && <th className="py-2 px-2 text-right text-md border-b no-wrap text-nowrap border-teal-700">دخول المملكة</th>}
                      {columnVisibility.Reason &&
                        (housingStatus === 'departed_transfer' ? (
                          <>
                            <th className="py-2 px-2 text-right text-md border-b no-wrap text-nowrap border-teal-700">سبب التسكين / الإجراء</th>
                            <th className="py-2 px-2 text-right text-md border-b no-wrap text-nowrap border-teal-700">سبب المغادرة</th>
                          </>
                        ) : (
                          <th className="py-2 px-2 text-right text-md border-b no-wrap text-nowrap border-teal-700">
                            {housingStatus === 'housed' ? 'سبب التسكين / الإجراء' : 'سبب المغادرة'}
                          </th>
                        ))}
                      {columnVisibility.entitlements && <th className="py-2 px-2 text-center text-md border-b no-wrap text-nowrap border-teal-700">المحضر والمستحقات</th>}
                      {columnVisibility.notes && <th className="py-2 px-2 text-right text-md border-b no-wrap text-nowrap border-teal-700">ملاحظات</th>}
                      {columnVisibility.actions && <th className="py-2 px-2 text-right text-md border-b no-wrap text-nowrap border-teal-700">اجراءات</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {console.log('Rendering workers:', activeTab, housingStatus, (housingStatus === 'housed' ? housedWorkers : departedWorkers).length)}
                    {(housingStatus === 'housed' ? housedWorkers : departedWorkers)
                      .filter((worker) => worker.Order?.Name || worker.externalHomedmaid?.name)
                      .length > 0 ? (
                      (housingStatus === 'housed' ? housedWorkers : departedWorkers)
                        .filter((worker) => worker.Order?.Name || worker.externalHomedmaid?.name)
                        .map((worker, index) => {
                          const total = housingStatus === 'housed' ? totalCount : departedTotalCount;
                          const rowSequenceNumber = total ? total - ((page - 1) * pageSize + index) : index + 1;
                          return (
                          <React.Fragment key={worker.id}>
                          <tr
                            className="bg-gray-50 text-nowrap border-b border-gray-300 hover:bg-gray-100 transition-colors"
                          >
                            {columnVisibility.id && (
                              <td className="py-2 px-2 text-right text-md w-12 text-gray-700 font-medium">
                                {worker.Order ? (
                                  <span className="cursor-pointer hover:text-teal-700 transition-colors" onClick={() => router.push(`/admin/homemaidinfo?id=${worker.Order?.id}`)}>#{rowSequenceNumber}</span>
                                ) : (
                                  <span>#{rowSequenceNumber}</span>
                                )}
                              </td>
                            )}
                          {columnVisibility.Name && (() => {
                            const nationality = worker.externalHomedmaid
                              ? (worker.externalHomedmaid.nationality || '').trim()
                              : worker.Order?.Nationalitycopy || '';
                            const flagUrl = getCountryFlagUrl(nationality);
                            const passport = worker.Order?.Passportnumber || worker.externalHomedmaid?.passportNumber || '';
                            const phone = worker.Order?.phone || worker.externalHomedmaid?.phone || '';
                            const profileId = worker.Order?.id || worker.homeMaid_id;
                            const workerPhoto = worker.externalHomedmaid?.image;
                            const isExt = Boolean(worker.externalHomedmaid);

                            return (
                              <td className="py-2 px-2 text-right text-md leading-tight">
                                <div className="font-bold text-teal-900 flex items-center justify-start gap-2">
                                  {workerPhoto ? (
                                    <div className="relative group shrink-0">
                                      <img
                                        src={workerPhoto}
                                        alt={worker.externalHomedmaid?.name || ''}
                                        className="w-8 h-8 rounded-full object-cover border border-amber-400 shadow-2xs cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(workerPhoto, '_blank');
                                        }}
                                        title="انقر لعرض الصورة بالحجم الكامل"
                                        loading="lazy"
                                      />
                                    </div>
                                  ) : flagUrl ? (
                                    <img
                                      src={flagUrl}
                                      alt={nationality}
                                      title={nationality}
                                      className="w-5 h-3.5 object-cover rounded-xs shadow-xs inline-block border border-gray-200 shrink-0"
                                      loading="lazy"
                                    />
                                  ) : null}
                                  {profileId ? (
                                    <span
                                      className="cursor-pointer hover:text-teal-700 hover:underline transition-colors"
                                      onClick={() => router.push(`/admin/homemaidinfo?id=${profileId}`)}
                                      title="انقر لفتح الملف الشخصي للعاملة"
                                    >
                                      {worker.Order?.Name || worker.externalHomedmaid?.name || ''}
                                    </span>
                                  ) : (
                                    <span
                                      className="cursor-help text-gray-800"
                                      title="عاملة خارجية"
                                    >
                                      {worker.Order?.Name || worker.externalHomedmaid?.name || ''}
                                    </span>
                                  )}
                                  {isExt && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                                      {worker.expectedStayDuration ? `مؤقت: ${worker.expectedStayDuration}` : 'خارجي'}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1.5 flex gap-3 justify-start items-center">
                                  {passport && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleCopyToClipboard(passport, 'رقم الجواز', `passport-${worker.id}`, e)}
                                      className="flex items-center gap-1 text-gray-600 hover:text-teal-700 transition-colors cursor-pointer border-0 bg-transparent p-0 m-0 focus:outline-none focus:ring-0 outline-none"
                                      title="انقر لنسخ رقم الجواز"
                                    >
                                      {copiedField === `passport-${worker.id}` ? (
                                        <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                      ) : (
                                        <FaPassport className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                      )}
                                      <span className={copiedField === `passport-${worker.id}` ? 'text-green-600 font-medium' : ''}>
                                        {passport}
                                      </span>
                                    </button>
                                  )}
                                  {passport && phone && <span className="text-gray-300 select-none">|</span>}
                                  {phone && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleCopyToClipboard(phone, 'رقم الجوال', `phone-${worker.id}`, e)}
                                      className="flex items-center gap-1 text-gray-600 hover:text-teal-700 transition-colors cursor-pointer border-0 bg-transparent p-0 m-0 focus:outline-none focus:ring-0 outline-none"
                                      title="انقر لنسخ رقم الجوال"
                                      dir="ltr"
                                    >
                                      {copiedField === `phone-${worker.id}` ? (
                                        <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                      ) : (
                                        <Phone className="w-3 h-3 text-teal-700 shrink-0" />
                                      )}
                                      <span className={`font-medium ${copiedField === `phone-${worker.id}` ? 'text-green-600' : ''}`}>
                                        {phone}
                                      </span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          })()}
                          {columnVisibility.clientName && (() => {
                            const clientInfo = getHousingClientInfo(worker);
                            return (
                              <td className="py-2 px-2 text-right text-md leading-tight">
                                <div className="font-bold text-teal-900 flex items-center justify-start gap-2">
                                  {clientInfo.clientId ? (
                                    <span
                                      className="cursor-pointer hover:text-teal-700 hover:underline transition-colors"
                                      onClick={() => router.push(`/admin/clientdetails?id=${clientInfo.clientId}`)}
                                      title="انقر لفتح ملف العميل"
                                    >
                                      {clientInfo.name || '—'}
                                    </span>
                                  ) : (
                                    <span className="text-gray-800">
                                      {clientInfo.name || '—'}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1.5 flex gap-3 justify-start items-center">
                                  {clientInfo.nationalId && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleCopyToClipboard(clientInfo.nationalId, 'رقم الهوية', `client-national-${worker.id}`, e)}
                                      className="flex items-center gap-1 text-gray-600 hover:text-teal-700 transition-colors cursor-pointer border-0 bg-transparent p-0 m-0 focus:outline-none focus:ring-0 outline-none"
                                      title="انقر لنسخ رقم الهوية"
                                    >
                                      {copiedField === `client-national-${worker.id}` ? (
                                        <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                      ) : (
                                        <FaIdCard className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                      )}
                                      <span className={copiedField === `client-national-${worker.id}` ? 'text-green-600 font-medium' : ''}>
                                        {clientInfo.nationalId}
                                      </span>
                                    </button>
                                  )}
                                  {clientInfo.nationalId && clientInfo.phone && <span className="text-gray-300 select-none">|</span>}
                                  {clientInfo.phone && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleCopyToClipboard(clientInfo.phone, 'رقم جوال العميل', `client-phone-${worker.id}`, e)}
                                      className="flex items-center gap-1 text-gray-600 hover:text-teal-700 transition-colors cursor-pointer border-0 bg-transparent p-0 m-0 focus:outline-none focus:ring-0 outline-none"
                                      title="انقر لنسخ رقم الجوال"
                                      dir="ltr"
                                    >
                                      {copiedField === `client-phone-${worker.id}` ? (
                                        <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                      ) : (
                                        <Phone className="w-3 h-3 text-teal-700 shrink-0" />
                                      )}
                                      <span className={`font-medium ${copiedField === `client-phone-${worker.id}` ? 'text-green-600' : ''}`}>
                                        {clientInfo.phone}
                                      </span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          })()}

                          {columnVisibility.location && (() => {
                            const locationName = locations.find((loc) => loc.id === worker.location_id)?.location || 'غير محدد';
                            const dateValue = housingStatus === 'housed' ? worker.houseentrydate : worker.deparatureHousingDate;
                            const formattedDate = getDate(dateValue) || 'غير محدد';
                            const dateTitle = housingStatus === 'housed' ? 'تاريخ دخول السكن' : 'تاريخ مغادرة السكن';

                            const stayDays =
                              housingStatus === 'departed_transfer'
                                ? stayDaysFromDeparture(worker.houseentrydate, worker.deparatureHousingDate)
                                : calculateDuration(worker.houseentrydate);
                            const stayNum = Number(stayDays);
                            const warnLong = housingStatus === 'departed_transfer' ? stayNum > 10 : worker.houseentrydate && Number(calculateDuration(worker.houseentrydate)) > 10;
                            const isCalculated = stayDays !== 'غير محدد' && !isNaN(stayNum);

                            return (
                              <td className="py-2 px-2 text-right text-md leading-tight">
                                {/* السطر العلوي: التاريخ */}
                                <div 
                                  className="font-bold text-teal-900 flex items-center justify-start gap-1.5 text-sm"
                                  title={dateTitle}
                                >
                                  <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                  <span>{formattedDate}</span>
                                </div>

                                {/* السطر السفلي: مكان السكن + شارة مدة السكن */}
                                <div className="text-xs text-gray-500 mt-1 flex items-center justify-start gap-2 flex-wrap">
                                  <div 
                                    className="flex items-center gap-1 text-gray-600 font-medium"
                                    title="مكان السكن"
                                  >
                                    <FaHome className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <span>{locationName}</span>
                                  </div>

                                  {isCalculated && (
                                    <span
                                      style={{
                                        backgroundColor: stayNum > 30 ? '#fef2f2' : stayNum > 15 ? '#fffbeb' : '#f0fdf4',
                                        color: stayNum > 30 ? '#dc2626' : stayNum > 15 ? '#d97706' : '#16a34a',
                                        borderColor: stayNum > 30 ? '#fecaca' : stayNum > 15 ? '#fde68a' : '#bbf7d0',
                                      }}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-bold border shadow-2xs"
                                      title={`مدة البقاء في السكن: ${stayDays} يوم (${stayNum > 30 ? 'تجاوزت الحد الطبيعي 30 يوم' : 'ضمن الحد الطبيعي'})`}
                                    >
                                      <Clock className="w-3 h-3 shrink-0" />
                                      <span>{stayDays} يوم</span>
                                    </span>
                                  )}
                                  {worker.expectedStayDuration && (
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                                      title={`مدة البقاء المتوقعة: ${worker.expectedStayDuration}`}
                                    >
                                      <span>المتوقع: {worker.expectedStayDuration}</span>
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })()}
                          {columnVisibility.kingdomentryDate && (() => {
                            const entryRaw = worker.Order?.NewOrder?.[0]?.arrivals?.[0]?.KingdomentryDate;
                            const guarantee = getSaudiGuaranteeInfo(entryRaw);
                            if (!guarantee) {
                              return <td className="py-2 px-2 text-right text-md text-gray-400">—</td>;
                            }
                            return (
                              <td className="py-2 px-2 text-right text-md leading-tight">
                                <div 
                                  className="font-bold text-teal-900 flex items-center justify-start gap-1.5 text-sm"
                                  title={`تاريخ دخول المملكة: ${guarantee.entryDate}`}
                                >
                                  <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                  <span>{guarantee.entryDate}</span>
                                </div>
                                <div 
                                  className="text-xs mt-1 flex items-center justify-start gap-1"
                                  title={`نهاية فترة الضمان (90 يوم): ${guarantee.guaranteeEndDate} | ${guarantee.fullStatus}`}
                                >
                                  <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${guarantee.isExpired ? 'text-red-500' : 'text-emerald-600'}`} />
                                  <span
                                    className={`font-medium ${
                                      guarantee.isExpired ? 'text-red-600' : 'text-emerald-700'
                                    }`}
                                  >
                                    {guarantee.text}
                                  </span>
                                </div>
                              </td>
                            );
                          })()}
                        
                          {columnVisibility.Reason &&
                            (housingStatus === 'departed_transfer' ? (
                              <>
                                <td className="py-2 px-2 text-right text-md">
                                  <div className="flex flex-col gap-1 items-start">
                                    <span className="font-semibold text-gray-900">{worker.Reason || '—'}</span>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {worker.actionTaken && (() => {
                                        const depData = (worker as any).deportationData;
                                        const depTime = depData?.externaldeparatureTime || '';
                                        let depDateFormatted = '';
                                        if (depData?.externaldeparatureDate) {
                                          try {
                                            const rawDate = new Date(depData.externaldeparatureDate);
                                            if (!isNaN(rawDate.getTime())) {
                                              const y = rawDate.getFullYear();
                                              const m = String(rawDate.getMonth() + 1).padStart(2, '0');
                                              const d = String(rawDate.getDate()).padStart(2, '0');
                                              depDateFormatted = `${y}/${m}/${d}`;
                                            } else {
                                              depDateFormatted = String(depData.externaldeparatureDate).split('T')[0];
                                            }
                                          } catch {
                                            depDateFormatted = String(depData.externaldeparatureDate).split('T')[0];
                                          }
                                        }
                                        const officer = depData?.deliveryOfficer || '';
                                        const isDeportation = worker.actionTaken === 'ترحيل';

                                        return (
                                          <span
                                            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-md border shadow-2xs ${
                                              isDeportation
                                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                                : 'bg-amber-50 text-amber-800 border-amber-200'
                                            }`}
                                            title={
                                              isDeportation && (depTime || depDateFormatted)
                                                ? `موعد المغادرة: ${depDateFormatted ? `${depDateFormatted} ` : ''}${depTime}${officer ? ` | مسؤول التوصيل: ${officer}` : ''}`
                                                : undefined
                                            }
                                          >
                                            {isDeportation ? (
                                              <Plane className="w-3 h-3 text-rose-600 shrink-0" />
                                            ) : (
                                              <FaExchangeAlt className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                            )}
                                            <span>{worker.actionTaken}</span>
                                            {isDeportation && (depTime || depDateFormatted) && (
                                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-rose-200/90 text-rose-950 px-1.5 py-0.5 rounded mr-1">
                                                <Clock className="w-2.5 h-2.5 text-rose-700 shrink-0" />
                                                <span dir="ltr" className="flex items-center gap-1">
                                                  {depDateFormatted && <span>{depDateFormatted}</span>}
                                                  {depDateFormatted && depTime && <span className="opacity-60">-</span>}
                                                  {depTime && <span>{depTime}</span>}
                                                </span>
                                              </span>
                                            )}
                                          </span>
                                        );
                                      })()}
                                      {worker.medicalReportFile ? (
                                        <a
                                          href={worker.medicalReportFile}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 transition-colors shadow-xs"
                                          title="عرض ملف التقرير الطبي المرفق"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <FileText className="w-3 h-3 text-red-700 shrink-0" />
                                          <span>التقرير الطبي</span>
                                        </a>
                                      ) : (worker.Reason === 'حالة مرضية' || worker.Reason === 'حمل') ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditWorker(worker.id, worker.Order?.Name || worker.externalHomedmaid?.name || '');
                                          }}
                                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-dashed border-rose-300 transition-colors cursor-pointer shadow-2xs"
                                          title="إرفاق تقرير طبي"
                                        >
                                          <FileText className="w-3 h-3 text-rose-600 shrink-0" />
                                          <span>+ إرفاق تقرير</span>
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2 px-2 text-right text-md">{worker.deparatureReason || '—'}</td>
                              </>
                            ) : (
                              <td className="py-2 px-2 text-right text-md">
                                {housingStatus === 'housed' ? (
                                  <div className="flex flex-col gap-1 items-start">
                                    <span className="font-semibold text-gray-900">{worker.Reason || '—'}</span>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {worker.actionTaken && (() => {
                                        const depData = (worker as any).deportationData;
                                        const depTime = depData?.externaldeparatureTime || '';
                                        let depDateFormatted = '';
                                        if (depData?.externaldeparatureDate) {
                                          try {
                                            const rawDate = new Date(depData.externaldeparatureDate);
                                            if (!isNaN(rawDate.getTime())) {
                                              const y = rawDate.getFullYear();
                                              const m = String(rawDate.getMonth() + 1).padStart(2, '0');
                                              const d = String(rawDate.getDate()).padStart(2, '0');
                                              depDateFormatted = `${y}/${m}/${d}`;
                                            } else {
                                              depDateFormatted = String(depData.externaldeparatureDate).split('T')[0];
                                            }
                                          } catch {
                                            depDateFormatted = String(depData.externaldeparatureDate).split('T')[0];
                                          }
                                        }
                                        const officer = depData?.deliveryOfficer || '';
                                        const isDeportation = worker.actionTaken === 'ترحيل';

                                        return (
                                          <span
                                            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-md border shadow-2xs ${
                                              isDeportation
                                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                                : 'bg-amber-50 text-amber-800 border-amber-200'
                                            }`}
                                            title={
                                              isDeportation && (depTime || depDateFormatted)
                                                ? `موعد المغادرة: ${depDateFormatted ? `${depDateFormatted} ` : ''}${depTime}${officer ? ` | مسؤول التوصيل: ${officer}` : ''}`
                                                : undefined
                                            }
                                          >
                                            {isDeportation ? (
                                              <Plane className="w-3 h-3 text-rose-600 shrink-0" />
                                            ) : (
                                              <FaExchangeAlt className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                            )}
                                            <span>{worker.actionTaken}</span>
                                            {isDeportation && (depTime || depDateFormatted) && (
                                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-rose-200/90 text-rose-950 px-1.5 py-0.5 rounded mr-1">
                                                <Clock className="w-2.5 h-2.5 text-rose-700 shrink-0" />
                                                <span dir="ltr" className="flex items-center gap-1">
                                                  {depDateFormatted && <span>{depDateFormatted}</span>}
                                                  {depDateFormatted && depTime && <span className="opacity-60">-</span>}
                                                  {depTime && <span>{depTime}</span>}
                                                </span>
                                              </span>
                                            )}
                                          </span>
                                        );
                                      })()}
                                      {worker.medicalReportFile ? (
                                        <a
                                          href={worker.medicalReportFile}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 transition-colors shadow-xs"
                                          title="عرض ملف التقرير الطبي المرفق"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <FileText className="w-3 h-3 text-red-700 shrink-0" />
                                          <span>التقرير الطبي</span>
                                        </a>
                                      ) : (worker.Reason === 'حالة مرضية' || worker.Reason === 'حمل') ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditWorker(worker.id, worker.Order?.Name || worker.externalHomedmaid?.name || '');
                                          }}
                                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-dashed border-rose-300 transition-colors cursor-pointer shadow-2xs"
                                          title="إرفاق تقرير طبي"
                                        >
                                          <FileText className="w-3 h-3 text-rose-600 shrink-0" />
                                          <span>+ إرفاق تقرير</span>
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                ) : (
                                  worker.deparatureReason || '—'
                                )}
                              </td>
                            ))}

                          {columnVisibility.entitlements && (() => {
                            // 1. الرواتب
                            const isSalaryKnown = worker.salaryReceived !== null && worker.salaryReceived !== undefined && (worker.salaryReceived as any) !== 'unknown';
                            const isSalaryOk = isSalaryKnown && (worker.salaryReceived === true || (!worker.isHasEntitlements && (!worker.salaryRemainingAmount || Number(worker.salaryRemainingAmount) === 0)));
                            const salaryAmount = worker.salaryRemainingAmount || worker.entitlementsCost || null;
                            const salaryTooltip = !isSalaryKnown
                              ? 'الرواتب: غير معروف'
                              : isSalaryOk
                                ? 'الرواتب: مستلمة بالكامل من الكفيل'
                                : `الرواتب: غير مستلمة بالكامل (متبقي: ${salaryAmount ? `${salaryAmount} ر.س` : 'مبلغ غير محدد'}${worker.entitlementReason ? ` - ${worker.entitlementReason}` : ''})`;

                            // 2. الجوال
                            const isPhoneKnown = worker.hasPhone !== null && worker.hasPhone !== undefined && (worker.hasPhone as any) !== 'unknown';
                            const hasPhone = worker.hasPhone === true;
                            const phoneTooltip = !isPhoneKnown
                              ? 'الجوال: غير معروف'
                              : hasPhone
                                ? 'الجوال: متوفر بحوزة العاملة'
                                : `الجوال: غير متوفر بحوزتها${worker.phoneReason ? ` (السبب: ${worker.phoneReason})` : ''}`;

                            // 3. الإقامة
                            const isIqamaKnown = worker.hasIqama !== null && worker.hasIqama !== undefined && (worker.hasIqama as any) !== 'unknown';
                            const hasIqama = worker.hasIqama === true;
                            const iqamaTooltip = !isIqamaKnown
                              ? 'الإقامة: غير معروف'
                              : hasIqama
                                ? 'الإقامة: متوفرة بحوزة العاملة'
                                : `الإقامة: غير متوفرة بحوزتها${worker.iqamaReason ? ` (السبب: ${worker.iqamaReason})` : ''}`;

                            // 4. جواز السفر
                            const isPassportKnown = worker.hasPassport !== null && worker.hasPassport !== undefined && (worker.hasPassport as any) !== 'unknown';
                            const hasPassport = worker.hasPassport === true;
                            const passportTooltip = !isPassportKnown
                              ? 'جواز السفر: غير معروف'
                              : hasPassport
                                ? 'جواز السفر: متوفر بحوزة العاملة'
                                : `جواز السفر: غير متوفر بحوزتها${worker.passportReason ? ` (السبب: ${worker.passportReason})` : ''}`;

                            // 5. الأغراض الشخصية
                            const isPersonalItemsKnown = worker.hasPersonalItems !== null && worker.hasPersonalItems !== undefined && (worker.hasPersonalItems as any) !== 'unknown';
                            const hasPersonalItems = worker.hasPersonalItems === true;
                            const personalItemsTooltip = !isPersonalItemsKnown
                              ? 'الأمتعة الشخصية: غير معروف'
                              : hasPersonalItems
                                ? `الأمتعة الشخصية: متوفرة مع العاملة${worker.personalItemsDetails ? ` (${worker.personalItemsDetails})` : ''}`
                                : 'الأمتعة الشخصية: لا توجد أمتعة مسجلة';

                            // 6. الفحص الطبي للإقامة
                            const isMedicalKnown = worker.medicalCheckDone !== null && worker.medicalCheckDone !== undefined && (worker.medicalCheckDone as any) !== 'unknown';
                            const medicalCheckDone = worker.medicalCheckDone === true;
                            const medicalCheckTooltip = !isMedicalKnown
                              ? 'الفحص الطبي للإقامة: غير معروف'
                              : medicalCheckDone
                                ? 'الفحص الطبي للإقامة: تم إجراء الفحص بنجاح'
                                : 'الفحص الطبي للإقامة: لم يتم الفحص بعد';

                            // 7. نوع التأشيرة
                            const isVisaKnown = Boolean(worker.visaType && worker.visaType !== 'غير معروف' && (worker.visaType as any) !== 'unknown');
                            const visaType = worker.visaType || 'غير معروف';
                            const visaTypeTooltip = `نوع التأشيرة: ${visaType}`;

                            return (
                              <td className="py-2 px-2 text-center text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAuditWorker(worker);
                                    openModal('auditDetailsModal');
                                  }}
                                  className="inline-flex flex-col gap-1.5 p-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer group"
                                  title="انقر لعرض محضر الاستلام وتفاصيل الأسئلة الـ 7 بالكامل"
                                >
                                  {/* الصف الأول: 4 أيقونات (الرواتب، الجوال، الإقامة، الجواز) */}
                                  <div className="flex items-center gap-1.5 justify-center">
                                    {/* 1. الرواتب */}
                                    <span
                                      style={{
                                        backgroundColor: !isSalaryKnown ? '#f3f4f6' : isSalaryOk ? '#f0fdf4' : '#fef2f2',
                                        borderColor: !isSalaryKnown ? '#d1d5db' : isSalaryOk ? '#bbf7d0' : '#fecaca',
                                        color: !isSalaryKnown ? '#6b7280' : isSalaryOk ? '#15803d' : '#dc2626',
                                      }}
                                      className="w-6 h-6 rounded-md flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105"
                                      title={salaryTooltip}
                                    >
                                      <CreditCard className="w-3.5 h-3.5" style={{ color: !isSalaryKnown ? '#6b7280' : isSalaryOk ? '#15803d' : '#dc2626' }} />
                                    </span>

                                    {/* 2. الجوال */}
                                    <span
                                      style={{
                                        backgroundColor: !isPhoneKnown ? '#f3f4f6' : hasPhone ? '#f0fdf4' : '#fef2f2',
                                        borderColor: !isPhoneKnown ? '#d1d5db' : hasPhone ? '#bbf7d0' : '#fecaca',
                                        color: !isPhoneKnown ? '#6b7280' : hasPhone ? '#15803d' : '#dc2626',
                                      }}
                                      className="w-6 h-6 rounded-md flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105"
                                      title={phoneTooltip}
                                    >
                                      <Smartphone className="w-3.5 h-3.5" style={{ color: !isPhoneKnown ? '#6b7280' : hasPhone ? '#15803d' : '#dc2626' }} />
                                    </span>

                                    {/* 3. الإقامة */}
                                    <span
                                      style={{
                                        backgroundColor: !isIqamaKnown ? '#f3f4f6' : hasIqama ? '#f0fdf4' : '#fef2f2',
                                        borderColor: !isIqamaKnown ? '#d1d5db' : hasIqama ? '#bbf7d0' : '#fecaca',
                                        color: !isIqamaKnown ? '#6b7280' : hasIqama ? '#15803d' : '#dc2626',
                                      }}
                                      className="w-6 h-6 rounded-md flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105"
                                      title={iqamaTooltip}
                                    >
                                      <FaIdCard className="w-3.5 h-3.5" style={{ color: !isIqamaKnown ? '#6b7280' : hasIqama ? '#15803d' : '#dc2626' }} />
                                    </span>

                                    {/* 4. جواز السفر */}
                                    <span
                                      style={{
                                        backgroundColor: !isPassportKnown ? '#f3f4f6' : hasPassport ? '#f0fdf4' : '#fef2f2',
                                        borderColor: !isPassportKnown ? '#d1d5db' : hasPassport ? '#bbf7d0' : '#fecaca',
                                        color: !isPassportKnown ? '#6b7280' : hasPassport ? '#15803d' : '#dc2626',
                                      }}
                                      className="w-6 h-6 rounded-md flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105"
                                      title={passportTooltip}
                                    >
                                      <FaPassport className="w-3.5 h-3.5" style={{ color: !isPassportKnown ? '#6b7280' : hasPassport ? '#15803d' : '#dc2626' }} />
                                    </span>
                                  </div>

                                  {/* الصف الثاني: 3 أيقونات (الأمتعة، الفحص الطبي، نوع التأشيرة) */}
                                  <div className="flex items-center gap-1.5 justify-center">
                                    {/* 5. الأمتعة */}
                                    <span
                                      style={{
                                        backgroundColor: !isPersonalItemsKnown ? '#f3f4f6' : hasPersonalItems ? '#f0fdf4' : '#fef2f2',
                                        borderColor: !isPersonalItemsKnown ? '#d1d5db' : hasPersonalItems ? '#bbf7d0' : '#fecaca',
                                        color: !isPersonalItemsKnown ? '#6b7280' : hasPersonalItems ? '#15803d' : '#dc2626',
                                      }}
                                      className="w-6 h-6 rounded-md flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105"
                                      title={personalItemsTooltip}
                                    >
                                      <Package className="w-3.5 h-3.5" style={{ color: !isPersonalItemsKnown ? '#6b7280' : hasPersonalItems ? '#15803d' : '#dc2626' }} />
                                    </span>

                                    {/* 6. الفحص الطبي */}
                                    <span
                                      style={{
                                        backgroundColor: !isMedicalKnown ? '#f3f4f6' : medicalCheckDone ? '#f0fdf4' : '#fef2f2',
                                        borderColor: !isMedicalKnown ? '#d1d5db' : medicalCheckDone ? '#bbf7d0' : '#fecaca',
                                        color: !isMedicalKnown ? '#6b7280' : medicalCheckDone ? '#15803d' : '#dc2626',
                                      }}
                                      className="w-6 h-6 rounded-md flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105"
                                      title={medicalCheckTooltip}
                                    >
                                      <Activity className="w-3.5 h-3.5" style={{ color: !isMedicalKnown ? '#6b7280' : medicalCheckDone ? '#15803d' : '#dc2626' }} />
                                    </span>

                                    {/* 7. نوع التأشيرة */}
                                    <span
                                      style={{
                                        backgroundColor: !isVisaKnown ? '#f3f4f6' : visaType === 'مدفوعة' ? '#f0fdf4' : '#eff6ff',
                                        borderColor: !isVisaKnown ? '#d1d5db' : visaType === 'مدفوعة' ? '#bbf7d0' : '#bfdbfe',
                                        color: !isVisaKnown ? '#6b7280' : visaType === 'مدفوعة' ? '#15803d' : '#2563eb',
                                      }}
                                      className="w-6 h-6 rounded-md flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105"
                                      title={visaTypeTooltip}
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5" style={{ color: !isVisaKnown ? '#6b7280' : visaType === 'مدفوعة' ? '#15803d' : '#2563eb' }} />
                                    </span>
                                  </div>
                                </button>
                              </td>
                            );
                          })()}
                          {columnVisibility.notes && (() => {
                            const notesList = worker.HousedWorkerNotes || [];
                            const sortedNotes = [...notesList].sort((a: any, b: any) => {
                              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                              return timeB - timeA;
                            });
                            const latestManualNote = sortedNotes[0];
                            const hasInitialHousingInfo = Boolean(worker.Reason || worker.Details);
                            const hasNotesOrHousing = latestManualNote || hasInitialHousingInfo;
                            const totalNotesCount = sortedNotes.length + (hasInitialHousingInfo ? 1 : 0);
                            const showInitialAsLatest = !latestManualNote && hasInitialHousingInfo;
                            const isSidebarOpen = !toggleCollapse;

                            const noteDate = showInitialAsLatest
                              ? (worker.houseentrydate ? getDate(worker.houseentrydate) : '')
                              : (latestManualNote?.createdAt ? getDate(latestManualNote.createdAt) : '');
                            const noteAuthor = showInitialAsLatest
                              ? worker.employee
                              : latestManualNote?.employee;

                            return (
                              <td className={`py-2 px-1 text-right text-xs transition-all duration-200 ${
                                isSidebarOpen ? 'min-w-[120px] max-w-[155px]' : 'min-w-[190px] max-w-[260px]'
                              }`}>
                                {hasNotesOrHousing ? (
                                  <div 
                                    onClick={() => handleOpenNotesModal(worker)}
                                    className={`group cursor-pointer rounded-xl bg-gray-50 hover:bg-teal-50/80 border border-gray-200 hover:border-teal-300 transition-all text-right shadow-xs ${
                                      isSidebarOpen ? 'p-1.5' : 'p-2'
                                    }`}
                                    title="اضغط لعرض سجل الملاحظات بالكامل"
                                  >
                                    {/* Header: Note Count Badge + Quick Add Note Button */}
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-100/70 px-1.5 py-0.5 rounded-md shrink-0">
                                        <FileText className="w-3 h-3 text-teal-700" />
                                        <span>{totalNotesCount} {totalNotesCount === 1 ? 'ملاحظة' : 'ملاحظات'}</span>
                                      </span>

                                      {/* زر إضافة ملاحظة سريع دون الدخول لسجل الملاحظات */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenQuickNote(worker);
                                        }}
                                        className="w-5 h-5 rounded-md flex items-center justify-center text-teal-700 hover:text-white bg-teal-50 hover:bg-teal-700 border border-teal-200 hover:border-teal-700 transition-colors shadow-2xs cursor-pointer"
                                        title="إضافة ملاحظة سريعة"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* Middle: Note Text Snippet */}
                                    {showInitialAsLatest ? (
                                      <p className="text-gray-800 text-xs truncate leading-snug font-medium group-hover:text-teal-950">
                                        <span className="text-teal-700 font-bold">[تسكين] </span>
                                        {worker.Reason ? `سبب التسكين: ${worker.Reason}` : ''}
                                        {worker.Details ? ` - ${worker.Details}` : ''}
                                      </p>
                                    ) : (
                                      <p className="text-gray-800 text-xs truncate leading-snug font-medium group-hover:text-teal-950">
                                        {latestManualNote.notes?.startsWith('[اعادة-تسكين]') ? (
                                          <span className="text-red-600 font-bold">[إعادة تسكين] </span>
                                        ) : latestManualNote.notes?.startsWith('[ملاحظة التسكين]') ? (
                                          <span className="text-teal-700 font-bold">[تسكين] </span>
                                        ) : null}
                                        {latestManualNote.notes?.replace('[اعادة-تسكين] ', '').replace('[ملاحظة التسكين] ', '')}
                                      </p>
                                    )}

                                    {/* Footer: Date & Author (نزل التاريخ لتحت) */}
                                    <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1 pt-1 border-t border-gray-100 gap-1">
                                      {noteAuthor ? (
                                        <span className="truncate">بواسطة: {noteAuthor}</span>
                                      ) : (
                                        <span></span>
                                      )}
                                      {noteDate && (
                                        <span className="text-gray-400 font-mono shrink-0">{noteDate}</span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenQuickNote(worker)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:text-white bg-teal-50/70 hover:bg-teal-700 border border-dashed border-teal-300 hover:border-teal-700 rounded-xl transition-all cursor-pointer shadow-2xs"
                                    title="إضافة ملاحظة سريعة"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>إضافة ملاحظة</span>
                                  </button>
                                )}
                              </td>
                            );
                          })()}
                          {columnVisibility.actions && <td className="py-2 px-2 text-center">
                            <ActionDropdown homemaid_id={worker.homeMaid_id ?? 0}
                              onAddSession={handleAddSession}
                              onAddNotes={handleAddNotes}
                              id={worker.id}
                              name={worker.Order?.Name || worker.externalHomedmaid?.name || ''}
                              onEdit={handleEditWorker}
                              onDeparture={handleWorkerDeparture}
                              openModal={openModal}
                              isDeparted={housingStatus === 'departed' || housingStatus === 'departed_transfer'}
                              onRehousing={handleOpenRehousing}
                              showTransferWizard={housingStatus === 'departed_transfer'}
                              onTransferWizard={() =>
                                setTransferWizardWorker({
                                  id: worker.id,
                                  homeMaid_id: worker.homeMaid_id,
                                  maidDisplayName: worker.Order?.Name || worker.externalHomedmaid?.name || '',
                                  oldClientId: getOldSponsorClientId(worker),
                                  oldClientName: getHousingClientName(worker),
                                })
                              }
                            />
                          </td>}
                        </tr>
                        {expandedRows.has(worker.id) && (
                          <tr>
                            <td colSpan={Object.values(columnVisibility).filter(Boolean).length + (housingStatus === 'departed_transfer' && columnVisibility.Reason ? 1 : 0)} className="p-0">
                              <div className="bg-gray-50 border-r-4 border-teal-500 p-5 flex flex-col gap-5">
                                {(() => {
                                  // دمج بيانات التسكين والملاحظات وترتيبها تنازلياً حسب التاريخ
                                  const housingItem = worker.houseentrydate
                                    ? { type: 'housing' as const, date: worker.houseentrydate, worker }
                                    : null;
                                  const noteItems = (worker.HousedWorkerNotes || []).map((note: any) => ({
                                    type: 'note' as const,
                                    date: note.createdAt || '',
                                    note,
                                  }));
                                  const mergedItems = [housingItem, ...noteItems]
                                    .filter(Boolean)
                                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

                                  return mergedItems.length > 0 ? (
                                    <div className="flex flex-col gap-3">
                                      {mergedItems.map((item: any, idx: number) =>
                                        item.type === 'housing' ? (
                                          <div key={`housing-${worker.id}`} className="rounded-lg border border-teal-200 bg-teal-50/50 p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                              <span className="w-2 h-2 bg-teal-500 rounded-full inline-block"></span>
                                              <h4 className="text-sm font-bold text-teal-700">بيانات التسكين</h4>
                                              <span className="text-xs text-teal-600">
                                                {new Date(item.date).toLocaleDateString('ar-SA')}
                                              </span>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                              <div className="bg-white rounded-lg border border-gray-200 p-3">
                                                <p className="text-xs text-gray-400 mb-1">تاريخ التسكين</p>
                                                <p className="text-sm font-medium text-gray-800">
                                                  {item.worker.houseentrydate ? new Date(item.worker.houseentrydate).toLocaleDateString('ar-SA') : 'غير محدد'}
                                                </p>
                                              </div>
                                              <div className="bg-white rounded-lg border border-gray-200 p-3">
                                                <p className="text-xs text-gray-400 mb-1">الموظف المسؤول</p>
                                                <p className="text-sm font-medium text-gray-800">{item.worker.employee || 'غير محدد'}</p>
                                              </div>
                                              <div className="bg-white rounded-lg border border-gray-200 p-3">
                                                <p className="text-xs text-gray-400 mb-1">سبب التسكين</p>
                                                <p className="text-sm font-medium text-gray-800">{item.worker.Reason || 'غير محدد'}</p>
                                              </div>
                                              {item.worker.Details && (
                                                <div className="bg-white rounded-lg border border-gray-200 p-3 sm:col-span-1">
                                                  <p className="text-xs text-gray-400 mb-1">تفاصيل سبب التسكين</p>
                                                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{item.worker.Details}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <div
                                            key={item.note.id}
                                            className={`rounded-lg border p-4 flex justify-between items-start gap-4 ${
                                              item.note.notes?.startsWith('[اعادة-تسكين]')
                                                ? 'bg-red-50 border-red-300 shadow-sm shadow-red-100'
                                                : 'bg-white border-gray-200'
                                            }`}
                                          >
                                            <div className="flex-1">
                                              {item.note.notes?.startsWith('[اعادة-تسكين]') && (
                                                <div className="flex items-center gap-2 mb-2">
                                                  <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">🔄 اعادة تسكين</span>
                                                </div>
                                              )}
                                              <div className={`flex items-center gap-3 mb-2 text-xs ${
                                                item.note.notes?.startsWith('[اعادة-تسكين]') ? 'text-red-400' : 'text-gray-500'
                                              }`}>
                                                <span className={`font-semibold ${
                                                  item.note.notes?.startsWith('[اعادة-تسكين]') ? 'text-red-600' : 'text-teal-700'
                                                }`}>
                                                  {item.note.createdAt ? new Date(item.note.createdAt).toLocaleDateString('ar-SA') : ''}
                                                </span>
                                                {item.note.employee && (
                                                  <>
                                                    <span className={item.note.notes?.startsWith('[اعادة-تسكين]') ? 'text-red-200' : 'text-gray-300'}>|</span>
                                                    <span>بواسطة: <span className={`font-medium ${
                                                      item.note.notes?.startsWith('[اعادة-تسكين]') ? 'text-red-700' : 'text-gray-700'
                                                    }`}>{item.note.employee}</span></span>
                                                  </>
                                                )}
                                              </div>
                                              <p className={`text-sm leading-relaxed ${
                                                item.note.notes?.startsWith('[اعادة-تسكين]') ? 'text-red-800' : 'text-gray-800'
                                              }`}>
                                                {item.note.notes?.startsWith('[اعادة-تسكين]')
                                                  ? item.note.notes.replace('[اعادة-تسكين] ', '')
                                                  : item.note.notes}
                                              </p>
                                            </div>
                                            <button
                                              onClick={() => handleDeleteNote(item.note.id)}
                                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors flex-shrink-0"
                                              title="حذف الملاحظة"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {worker.houseentrydate && (
                                        <div>
                                          <h4 className="text-sm font-bold text-teal-700 mb-3 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-teal-500 rounded-full inline-block"></span>
                                            بيانات التسكين
                                          </h4>
                                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div className="bg-white rounded-lg border border-gray-200 p-3">
                                              <p className="text-xs text-gray-400 mb-1">تاريخ التسكين</p>
                                              <p className="text-sm font-medium text-gray-800">
                                                {new Date(worker.houseentrydate).toLocaleDateString('ar-SA')}
                                              </p>
                                            </div>
                                            <div className="bg-white rounded-lg border border-gray-200 p-3">
                                              <p className="text-xs text-gray-400 mb-1">الموظف المسؤول</p>
                                              <p className="text-sm font-medium text-gray-800">{worker.employee || 'غير محدد'}</p>
                                            </div>
                                            <div className="bg-white rounded-lg border border-gray-200 p-3">
                                              <p className="text-xs text-gray-400 mb-1">سبب التسكين</p>
                                              <p className="text-sm font-medium text-gray-800">{worker.Reason || 'غير محدد'}</p>
                                            </div>
                                            {worker.Details && (
                                              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:col-span-1">
                                                <p className="text-xs text-gray-400 mb-1">تفاصيل سبب التسكين</p>
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{worker.Details}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      <p className="text-sm text-gray-400 italic bg-white border border-dashed border-gray-300 rounded-lg p-3 text-center">
                                        لا توجد ملاحظات مضافة
                                      </p>
                                    </div>
                                  );
                                })()}
                              </div>
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={Object.values(columnVisibility).filter(Boolean).length + (housingStatus === 'departed_transfer' && columnVisibility.Reason ? 1 : 0)} className="py-8 text-center text-gray-500">
                          لا توجد بيانات متاحة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                      
                      // Prevent double submission
                      if (isSubmittingLocation) {
                        return;
                      }
                      
                      // Validate capacity (must be at least 1)
                      const capacity = Number((e.target as any)['residence-capacity'].value);
                      if (!capacity || capacity < 1) {
                        showNotification('يجب أن تكون السعة 1 أو أكثر', 'error');
                        return;
                      }
                      
                      setIsSubmittingLocation(true);
                      try {
                        await axios.post('/api/inhouselocation', {
                          location: (e.target as any)['residence-name'].value,
                          quantity: capacity,
                        });
                        showNotification('تم إضافة السكن بنجاح');
                        closeModal('addResidence');
                        fetchLocations();
                        // Reset form
                        (e.target as any)['residence-name'].value = '';
                        (e.target as any)['residence-capacity'].value = '';
                      } catch (error) {
                        showNotification('خطأ في إضافة السكن', 'error');
                      } finally {
                        setIsSubmittingLocation(false);
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
                        disabled={isSubmittingLocation}
                        className="w-full border border-border rounded-md bg-gray-50 text-right text-md text-textDark disabled:opacity-50 disabled:cursor-not-allowed"
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
                        // min="1"
                        disabled={isSubmittingLocation}
                        className="w-full border border-border rounded-md bg-gray-50 text-right text-md text-textDark disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    </div>
                    <div className="flex justify-end gap-4 col-span-2">
                      <button
                        type="button"
                        onClick={() => closeModal('addResidence')}
                        disabled={isSubmittingLocation}
                        className="bg-teal-800 text-white py-2 px-4 rounded-md text-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        الغاء
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSubmittingLocation}
                        className="bg-teal-800 text-white py-2 px-4 rounded-md text-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
                      >
                        {isSubmittingLocation ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            <span>جاري الحفظ...</span>
                          </>
                        ) : (
                          'حفظ'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* Edit Residence Modal */}
            {modals.editResidence && editingLocation && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex justify-center   items-center z-50 "
                onClick={() => closeModal('editResidence')}
              >
                <div
                  className="bg-gray-200 rounded-lg p-6 justify-between    shadow-card  w-[600px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-5  ">
                    <h2 className="text-xl font-bold text-textDark">تعديل سكن</h2>
                    <button onClick={() => closeModal('editResidence')} className="text-textMuted text-2xl">
                      &times;
                    </button>
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      
                      // Prevent double submission
                      if (isSubmittingEditLocation) {
                        return;
                      }
                      
                      // Validate capacity (must be at least 1)
                      const capacity = Number((e.target as any)['edit-residence-capacity'].value);
                      if (!capacity || capacity < 1) {
                        showNotification('يجب أن تكون السعة 1 أو أكثر', 'error');
                        return;
                      }
                      
                      setIsSubmittingEditLocation(true);
                      try {
                        await axios.put(`/api/inhouselocation/${editingLocation.id}`, {
                          location: (e.target as any)['edit-residence-name'].value,
                          quantity: capacity,
                        });
                        showNotification('تم تعديل السكن بنجاح');
                        closeModal('editResidence');
                        fetchLocations();
                      } catch (error) {
                        showNotification('خطأ في تعديل السكن', 'error');
                      } finally {
                        setIsSubmittingEditLocation(false);
                      }
                    }}
                    
                  >
                    <div className="grid grid-cols-2 gap-2 " >
                    <div className="mb-4 ">
                      <label htmlFor="edit-residence-name" className="block text-md mb-2 text-textDark">
                        اسم السكن
                      </label>
                      <input
                        type="text"
                        id="edit-residence-name"
                        defaultValue={editingLocation.location}
                        placeholder="ادخل اسم السكن"
                        disabled={isSubmittingEditLocation}
                        className="w-full border border-border rounded-md bg-gray-50 text-right text-md text-textDark disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="edit-residence-capacity" className="block text-md mb-2 text-textDark">
                        السعة
                      </label>
                      <input
                        type="number"
                        id="edit-residence-capacity"
                        defaultValue={editingLocation.quantity}
                        placeholder="ادخل السعة"
                        min="1"
                        disabled={isSubmittingEditLocation}
                        className="w-full border border-border rounded-md bg-gray-50 text-right text-md text-textDark disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    </div>
                    <div className="flex justify-end gap-4 col-span-2">
                      <button
                        type="button"
                        onClick={() => closeModal('editResidence')}
                        disabled={isSubmittingEditLocation}
                        className="bg-teal-800 text-white py-2 px-4 rounded-md text-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        الغاء
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSubmittingEditLocation}
                        className="bg-teal-800 text-white py-2 px-4 rounded-md text-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
                      >
                        {isSubmittingEditLocation ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            <span>جاري الحفظ...</span>
                          </>
                        ) : (
                          'حفظ'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* Notes History & Entry Modal */}
            {modals.notesModal && (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 overflow-y-auto"
                onClick={() => closeModal('notesModal')}
                dir="rtl"
              >
                <div
                  className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="bg-gradient-to-l from-teal-900 via-teal-800 to-teal-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                        <FileText className="w-5 h-5 text-teal-200" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                          <span>سجل وملاحظات العاملة</span>
                          {selectedNotesWorker && (
                            <span className="text-xs bg-teal-700 text-teal-100 px-2 py-0.5 rounded-md font-mono">
                              #{selectedNotesWorker.id} - {selectedNotesWorker.Order?.Name || selectedNotesWorker.externalHomedmaid?.name || ''}
                            </span>
                          )}
                        </h2>
                        <p className="text-xs text-teal-200/80 mt-0.5">
                          عرض سجل الملاحظات السابقة وإضافة ملاحظة جديدة
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => closeModal('notesModal')}
                      className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors"
                      title="إغلاق"
                    >
                      <span className="text-2xl leading-none">&times;</span>
                    </button>
                  </div>

                  {/* Body: Previous Notes Feed (Scrollable) + Add Note Section */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
                    
                    {/* ملاحظة وبيانات التسكين الأساسية */}
                    {(selectedNotesWorker?.Reason || selectedNotesWorker?.Details || selectedNotesWorker?.houseentrydate) && (
                      <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-4 text-right shadow-xs">
                        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-teal-200/60 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold bg-teal-800 text-white px-2.5 py-0.5 rounded-full">
                              ملاحظة وبيانات التسكين الأساسية
                            </span>
                            {selectedNotesWorker.houseentrydate && (
                              <span className="text-xs font-semibold text-teal-900">
                                {new Date(selectedNotesWorker.houseentrydate).toLocaleDateString('ar-SA')}
                              </span>
                            )}
                          </div>
                          {selectedNotesWorker.employee && (
                            <span className="text-xs text-teal-800">
                              الموظف: <span className="font-bold">{selectedNotesWorker.employee}</span>
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 text-xs sm:text-sm">
                          {selectedNotesWorker.Reason && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-700 shrink-0">سبب التسكين:</span>
                              <span className="font-semibold text-teal-950 bg-white px-2.5 py-1 rounded-lg border border-teal-100">
                                {selectedNotesWorker.Reason}
                              </span>
                              {selectedNotesWorker.actionTaken && (() => {
                                const depData = (selectedNotesWorker as any).deportationData;
                                const depTime = depData?.externaldeparatureTime || '';
                                let depDateFormatted = '';
                                if (depData?.externaldeparatureDate) {
                                  try {
                                    const rawDate = new Date(depData.externaldeparatureDate);
                                    if (!isNaN(rawDate.getTime())) {
                                      const y = rawDate.getFullYear();
                                      const m = String(rawDate.getMonth() + 1).padStart(2, '0');
                                      const d = String(rawDate.getDate()).padStart(2, '0');
                                      depDateFormatted = `${y}/${m}/${d}`;
                                    } else {
                                      depDateFormatted = String(depData.externaldeparatureDate).split('T')[0];
                                    }
                                  } catch {
                                    depDateFormatted = String(depData.externaldeparatureDate).split('T')[0];
                                  }
                                }
                                const isDeportation = selectedNotesWorker.actionTaken === 'ترحيل';

                                return (
                                  <span
                                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-md font-semibold border ${
                                      isDeportation
                                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                    }`}
                                  >
                                    {isDeportation ? (
                                      <Plane className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                    ) : (
                                      <FaExchangeAlt className="w-3 h-3 text-amber-600 shrink-0" />
                                    )}
                                    <span>الإجراء: {selectedNotesWorker.actionTaken}</span>
                                    {isDeportation && (depTime || depDateFormatted) && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-rose-200/90 text-rose-950 px-1.5 py-0.5 rounded mr-1">
                                        <Clock className="w-2.5 h-2.5 text-rose-700 shrink-0" />
                                        <span dir="ltr" className="flex items-center gap-1">
                                          {depDateFormatted && <span>{depDateFormatted}</span>}
                                          {depDateFormatted && depTime && <span className="opacity-60">-</span>}
                                          {depTime && <span>{depTime}</span>}
                                        </span>
                                      </span>
                                    )}
                                  </span>
                                );
                              })()}
                              {selectedNotesWorker.medicalReportFile ? (
                                <a
                                  href={selectedNotesWorker.medicalReportFile}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md font-semibold bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 transition-colors"
                                  title="عرض ملف التقرير الطبي المرفق"
                                >
                                  <FileText className="w-3.5 h-3.5 text-red-700 shrink-0" />
                                  <span>التقرير الطبي المرفق</span>
                                </a>
                              ) : (selectedNotesWorker.Reason === 'حالة مرضية' || selectedNotesWorker.Reason === 'حمل') ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    closeModal('notesModal');
                                    handleEditWorker(selectedNotesWorker.id, selectedNotesWorker.Order?.Name || selectedNotesWorker.externalHomedmaid?.name || '');
                                  }}
                                  className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-dashed border-rose-300 transition-colors cursor-pointer"
                                  title="إرفاق تقرير طبي"
                                >
                                  <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  <span>+ إرفاق تقرير طبي</span>
                                </button>
                              ) : null}
                            </div>
                          )}

                          {selectedNotesWorker.Details && (
                            <div className="bg-white p-3 rounded-lg border border-teal-100 text-gray-800 leading-relaxed whitespace-pre-wrap">
                              <span className="font-bold text-teal-900 block text-xs mb-1">تفاصيل وملاحظات التسكين:</span>
                              {selectedNotesWorker.Details}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Previous Notes Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-teal-700" />
                          <span>الملاحظات المسجلة ({selectedNotesWorker?.HousedWorkerNotes?.length || 0})</span>
                        </h3>
                      </div>

                      {selectedNotesWorker?.HousedWorkerNotes && selectedNotesWorker.HousedWorkerNotes.length > 0 ? (
                        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                          {[...selectedNotesWorker.HousedWorkerNotes]
                            .sort((a, b) => {
                              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                              return timeB - timeA;
                            })
                            .map((note) => {
                              const isRehousing = note.notes?.startsWith('[اعادة-تسكين]');
                              return (
                                <div
                                  key={note.id}
                                  className={`p-3.5 rounded-xl border text-right transition-all flex items-start justify-between gap-3 ${
                                    isRehousing
                                      ? 'bg-red-50/80 border-red-200 shadow-xs'
                                      : 'bg-white border-gray-200 shadow-xs'
                                  }`}
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                      {isRehousing && (
                                        <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full">
                                          إعادة تسكين
                                        </span>
                                      )}
                                      {note.notes?.startsWith('[مغادرة عاملة خارجية]') && (
                                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                                          مغادرة عاملة خارجية
                                        </span>
                                      )}
                                      <span className="text-[11px] font-semibold text-teal-800">
                                        {note.createdAt ? getDate(note.createdAt) : ''}
                                      </span>
                                      {note.employee && (
                                        <span className="text-[11px] text-gray-500">
                                          | بواسطة: <span className="font-medium text-gray-700">{note.employee}</span>
                                        </span>
                                      )}
                                    </div>
                                    {(() => {
                                      const rawText = note.notes || '';
                                      const isExtDep = rawText.startsWith('[مغادرة عاملة خارجية]');
                                      let cleanText = isRehousing ? rawText.replace('[اعادة-تسكين] ', '') : rawText;
                                      let photoUrl = '';
                                      if (isExtDep && cleanText.includes('[صورة المغادرة]: ')) {
                                        const parts = cleanText.split('[صورة المغادرة]: ');
                                        cleanText = parts[0].replace('[مغادرة عاملة خارجية]', '').trim();
                                        photoUrl = parts[1]?.trim() || '';
                                      } else if (isExtDep) {
                                        cleanText = cleanText.replace('[مغادرة عاملة خارجية]', '').trim();
                                      }

                                      return (
                                        <div className="space-y-2">
                                          <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                                            isRehousing ? 'text-red-900 font-medium' : 'text-gray-800'
                                          }`}>
                                            {cleanText || rawText}
                                          </p>
                                          {photoUrl && (
                                            <div className="pt-1">
                                              <a
                                                href={photoUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors group"
                                              >
                                                <Camera className="w-4 h-4 text-amber-700" />
                                                <span>عرض صورة المغادرة المرفقة</span>
                                                <img
                                                  src={photoUrl}
                                                  alt="صورة المغادرة"
                                                  className="w-7 h-7 rounded-md object-cover border border-amber-300 ml-1"
                                                />
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer"
                                    title="حذف الملاحظة"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-4 text-center text-xs text-gray-400">
                          لا توجد ملاحظات مسجلة لهذه العاملة حتى الآن.
                        </div>
                      )}
                    </div>

                    {/* Add New Note Section */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                      <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-teal-700" />
                          <span>إضافة ملاحظة جديدة</span>
                        </span>
                      </label>

                      <textarea
                        rows={3}
                        placeholder="اكتب الملاحظة هنا بدقة لتكون مرجعاً للجميع..."
                        value={notesForm.notes}
                        onChange={(e) => setNotesForm({ ...notesForm, notes: e.target.value })}
                        disabled={isSubmittingNote}
                        className="w-full bg-gray-50 focus:bg-white border border-gray-300 focus:border-teal-600 rounded-xl p-3 text-right text-xs sm:text-sm text-gray-900 outline-none transition-all resize-none"
                      />

                      {/* Preset Template Chips */}
                      <div className="mt-2">
                        <PresetChips
                          chips={[
                            'تم التواصل مع الكفيل ووعد بالسداد والحل',
                            'العاملة ترفض العودة للكفيل وتطلب نقل كفالة',
                            'تم تسليم العاملة رواتبها ومستحقاتها كاملة',
                            'العاملة بصحة جيدة وجاهزة لإجراءات التنازل',
                            'تم استلام ونقل الحقائب والمتعلقات الشخصية',
                            'العاملة تشكو من وعكة صحية وتمت متابعتها',
                          ]}
                          onSelect={(chip) =>
                            setNotesForm((prev) => ({
                              ...prev,
                              notes: prev.notes ? `${prev.notes} - ${chip}` : chip,
                            }))
                          }
                          disabled={isSubmittingNote}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end items-center gap-3 p-4 bg-gray-50 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => closeModal('notesModal')}
                      disabled={isSubmittingNote}
                      className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={postnotes}
                      disabled={!notesForm.notes.trim() || isSubmittingNote}
                      className="bg-teal-800 hover:bg-teal-700 text-white rounded-xl px-6 py-2 text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmittingNote ? (
                        <>
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                          <span>جاري الحفظ...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>حفظ الملاحظة</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}


            {/* Quick Note Modal - إضافة ملاحظة سريعة */}
            {modals.quickNoteModal && quickNoteWorker && (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-in fade-in duration-200"
                onClick={() => closeModal('quickNoteModal')}
              >
                <div
                  className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                  dir="rtl"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-l from-teal-900 via-teal-800 to-teal-900 text-white px-5 py-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                        <FileText className="w-4 h-4 text-teal-200" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <span>إضافة ملاحظة سريعة</span>
                          <span className="text-xs bg-teal-700 text-teal-100 px-2 py-0.5 rounded-md font-mono">
                            #{quickNoteWorker.id}
                          </span>
                        </h3>
                        <p className="text-[11px] text-teal-200/90">
                          {quickNoteWorker.Order?.Name || quickNoteWorker.externalHomedmaid?.name || 'العاملة'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => closeModal('quickNoteModal')}
                      className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors text-xl leading-none"
                    >
                      &times;
                    </button>
                  </div>

                  {/* Body */}
                  <form onSubmit={handleQuickNoteSubmit} className="p-5 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        نص الملاحظة <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        autoFocus
                        rows={3}
                        placeholder="اكتب الملاحظة هنا..."
                        value={quickNoteText}
                        onChange={(e) => setQuickNoteText(e.target.value)}
                        disabled={isSubmittingQuickNote}
                        className="w-full bg-gray-50 focus:bg-white border border-gray-300 focus:border-teal-600 rounded-xl p-3 text-right text-xs sm:text-sm text-gray-900 outline-none transition-all resize-none"
                      />
                    </div>

                    {/* Preset Quick Chips */}
                    <div>
                      <span className="text-[11px] font-semibold text-gray-500 mb-1 block">اقتراحات سريعة:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'تم التواصل مع الكفيل وإبلاغه بالتفاصيل',
                          'العاملة ترغب بنقل الكفالة',
                          'بانتظار استكمال الإجراءات النظامية',
                          'تم تسليم كامل المستحقات والرواتب',
                          'تم تحديد موعد لمراجعة الجوازات',
                        ].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setQuickNoteText((prev) => prev ? `${prev} - ${chip}` : chip)}
                            className="text-[11px] bg-gray-100 hover:bg-teal-50 hover:text-teal-800 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => closeModal('quickNoteModal')}
                        disabled={isSubmittingQuickNote}
                        className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingQuickNote || !quickNoteText.trim()}
                        className="bg-teal-800 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl px-5 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        {isSubmittingQuickNote ? (
                          <span>جاري الحفظ...</span>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>حفظ الملاحظة</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Column Visibility Modal */}
            {modals.columnVisibility && (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 transition-all"
                onClick={() => closeModal('columnVisibility')}
              >
                <div
                  className="bg-white rounded-2xl p-6 sm:p-7 w-full max-w-md shadow-2xl border border-gray-100 text-right transform transition-all"
                  onClick={(e) => e.stopPropagation()}
                  dir="rtl"
                >
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">إعدادات عرض الأعمدة</h2>
                        <p className="text-xs text-gray-500">اختر الأعمدة التي ترغب بظهورها في الجدول</p>
                      </div>
                    </div>
                    <button
                      onClick={() => closeModal('columnVisibility')}
                      className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-colors text-xl leading-none cursor-pointer"
                      title="إغلاق"
                    >
                      &times;
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-100 text-xs">
                    <span className="font-semibold text-gray-700">الأعمدة المتاحة ({Object.values(columnVisibility).filter(Boolean).length} مفعل)</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setColumnVisibility({
                            id: true,
                            Name: true,
                            clientName: true,
                            location: true,
                            kingdomentryDate: true,
                            Reason: true,
                            entitlements: true,
                            notes: true,
                            actions: true,
                          });
                        }}
                        className="text-teal-800 hover:underline font-semibold cursor-pointer"
                      >
                        تحديد الكل
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          setColumnVisibility({
                            id: false,
                            Name: true,
                            clientName: false,
                            location: false,
                            kingdomentryDate: false,
                            Reason: false,
                            entitlements: false,
                            notes: false,
                            actions: false,
                          });
                        }}
                        className="text-gray-500 hover:underline cursor-pointer"
                      >
                        إلغاء التحديد
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 pl-1">
                    {[
                      { key: 'id', label: '# (الرقم التسلسلي)', desc: 'تسلسل السجل' },
                      { key: 'Name', label: 'بيانات العاملة', desc: 'الاسم، الصورة، الجنسية، الجواز، والجوال' },
                      { key: 'clientName', label: 'بيانات العميل', desc: 'اسم الكفيل، رقم الهوية، والجوال' },
                      { key: 'location', label: housingStatus === 'housed' ? 'بيانات السكن والمدة' : 'السكن وتاريخ المغادرة', desc: 'اسم السكن وتاريخ الدخول/المغادرة' },
                      { key: 'kingdomentryDate', label: 'دخول المملكة والضمان', desc: 'تاريخ الوصول وحساب الـ 90 يوماً' },
                      { key: 'Reason', label: housingStatus === 'housed' ? 'سبب التسكين / الإجراء' : 'سبب المغادرة', desc: 'السبب المسجل والإجراء المتخذ' },
                      { key: 'entitlements', label: 'المحضر والمستحقات', desc: 'حالة الاستلام والمقتنيات والرواتب' },
                      { key: 'notes', label: 'الملاحظات', desc: 'الملاحظات الإدارية المسجلة' },
                      { key: 'actions', label: 'الإجراءات والعمليات', desc: 'أزرار التعديل، المغادرة، والجلسات' },
                    ].map((col) => {
                      const isChecked = columnVisibility[col.key as keyof typeof columnVisibility];
                      return (
                        <label
                          key={col.key}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                            isChecked
                              ? 'bg-teal-50/50 border-teal-200 text-teal-950 font-bold'
                              : 'bg-gray-50/70 border-gray-200 text-gray-700 hover:bg-gray-100 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleColumnVisibility(col.key as keyof typeof columnVisibility)}
                              className="w-4 h-4 rounded text-teal-800 focus:ring-teal-700 cursor-pointer accent-teal-800"
                            />
                            <div>
                              <span className="text-xs sm:text-sm block">{col.label}</span>
                              <span className="text-[10px] text-gray-500 font-normal">{col.desc}</span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex justify-end gap-2.5 pt-4 mt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => closeModal('columnVisibility')}
                      className="w-full bg-teal-800 hover:bg-teal-900 active:scale-[0.98] text-white py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
                    >
                      إغلاق وحفظ
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Worker Type Selection Modal */}
            {modals.workerTypeSelection && (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 transition-all"
                onClick={() => closeModal('workerTypeSelection')}
              >
                <div
                  className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl w-full max-w-xl border border-gray-100 text-right transform transition-all"
                  onClick={(e) => e.stopPropagation()}
                  dir="rtl"
                >
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">تسكين عاملة جديدة</h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">اختر نوع العاملة للانتقال لخطوة التسكين مباشرة</p>
                    </div>
                    <button
                      onClick={() => closeModal('workerTypeSelection')}
                      className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors text-2xl leading-none"
                      title="إغلاق"
                    >
                      &times;
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
                    {/* خيار: عاملة داخلية */}
                    <button
                      type="button"
                      onClick={() => handleSelectWorkerType('داخلية')}
                      className="group flex flex-col justify-between p-5 rounded-xl border-2 border-gray-200 hover:border-teal-700 bg-white hover:bg-teal-50/40 text-right transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer focus:outline-none"
                    >
                      <div>
                        <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mb-4 group-hover:bg-teal-800 group-hover:text-white transition-colors duration-200">
                          <Building className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-900 mb-1.5 flex items-center justify-between">
                          <span>عاملة داخلية</span>
                          <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md font-medium">مكتب روائس</span>
                        </h3>
                        <p className="text-xs text-gray-500 group-hover:text-gray-700 leading-relaxed">
                          عاملة تابعة لمكتب روائس ولديها ملف وبيانات مسجلة في النظام.
                        </p>
                      </div>
                      <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-teal-700 group-hover:text-teal-900">
                        <span>متابعة التسكين الداخلي</span>
                        <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                      </div>
                    </button>

                    {/* خيار: عاملة خارجية */}
                    <button
                      type="button"
                      onClick={() => handleSelectWorkerType('خارجية')}
                      className="group flex flex-col justify-between p-5 rounded-xl border-2 border-gray-200 hover:border-amber-600 bg-white hover:bg-amber-50/40 text-right transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer focus:outline-none"
                    >
                      <div>
                        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4 group-hover:bg-amber-700 group-hover:text-white transition-colors duration-200">
                          <Globe className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-900 mb-1.5 flex items-center justify-between">
                          <span>عاملة خارجية</span>
                          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-medium">خارجية</span>
                        </h3>
                        <p className="text-xs text-gray-500 group-hover:text-gray-700 leading-relaxed">
                          عاملة غير تابعة للمكتب أبداً (تسجيل بيانات جديدة وتسكين مباشر).
                        </p>
                      </div>
                      <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-amber-700 group-hover:text-amber-900">
                        <span>متابعة التسكين الخارجي</span>
                        <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Housing Form Modal - Redesigned 2-Step Wizard */}
            {modals.housingForm && (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-3 sm:p-4 overflow-y-auto"
                onClick={() => closeModal('housingForm')}
                dir="rtl"
              >
                <div
                  className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="bg-gradient-to-l from-teal-900 via-teal-800 to-teal-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                        <Building className="w-5 h-5 text-teal-200" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          <span>تسكين عاملة</span>
                          <span className="text-xs bg-teal-700/80 text-teal-100 px-2.5 py-0.5 rounded-full border border-teal-500/30">
                            {workerType === 'داخلية' ? 'عاملة داخلية (مكتب روائس)' : 'عاملة خارجية'}
                          </span>
                        </h2>
                        <p className="text-xs text-teal-200/80 mt-0.5">
                          {housingStep === 1
                            ? 'الخطوة 1: البحث عن العاملة وتأكيد بيانات التسكين والعميل'
                            : 'الخطوة 2: محضر استلام ومقتنيات العاملة وحالتها عند التسكين'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => closeModal('housingForm')}
                      className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors"
                      title="إغلاق"
                    >
                      <span className="text-2xl leading-none">&times;</span>
                    </button>
                  </div>

                  {/* Step Indicator Header */}
                  <div className="bg-teal-900/5 border-b border-gray-200 px-5 sm:px-6 py-2.5 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setHousingStep(1)}
                      className={`flex-1 flex items-center gap-2.5 p-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-right cursor-pointer ${
                        housingStep === 1
                          ? 'bg-teal-800 text-white shadow-xs'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                        housingStep === 1 ? 'bg-white text-teal-800 font-bold' : 'bg-teal-100 text-teal-800'
                      }`}>
                        1
                      </span>
                      <div className="truncate">
                        <div className="leading-tight">الخطوة الأولى</div>
                        <div className={`text-[10px] font-normal ${housingStep === 1 ? 'text-teal-100' : 'text-gray-500'}`}>
                          بيانات العاملة والتسكين
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (validateHousingStep1()) {
                          setHousingStep(2);
                        }
                      }}
                      className={`flex-1 flex items-center gap-2.5 p-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-right cursor-pointer ${
                        housingStep === 2
                          ? 'bg-teal-800 text-white shadow-xs'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                        housingStep === 2 ? 'bg-white text-teal-800 font-bold' : 'bg-gray-200 text-gray-700'
                      }`}>
                        2
                      </span>
                      <div className="truncate">
                        <div className="leading-tight">الخطوة الثانية</div>
                        <div className={`text-[10px] font-normal ${housingStep === 2 ? 'text-teal-100' : 'text-gray-500'}`}>
                          محضر الاستلام والمقتنيات
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Body (Scrollable) */}
                  <form onSubmit={handlenewHousingSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-gray-50/50">
                    {housingStep === 1 ? (
                      <>
                        {/* القسم 1: البحث عن العاملة */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                              <Search className="w-4 h-4 text-teal-700" />
                              <span>البحث واختيار العاملة</span>
                              <span className="text-red-500">*</span>
                            </label>
                            {selectedWorker && (
                              <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                تم اختيار: #{selectedWorker.id} - {selectedWorker.name}
                              </span>
                            )}
                          </div>

                          <div className="relative search-container">
                            <input
                              type="text"
                              value={workerSearchTerm}
                              onChange={(e) => handleWorkerSearch(e.target.value)}
                              placeholder="ابحث برقم العاملة، الاسم، رقم الجواز أو اسم العميل، جواله، هويته..."
                              disabled={isSubmittingHousing}
                              className="w-full p-3.5 pl-11 text-right border border-gray-300 rounded-xl bg-gray-50/60 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            {isSearching && (
                              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-600 border-t-transparent"></div>
                              </div>
                            )}

                            {/* Search Results Dropdown */}
                            {workerSuggestions.length > 0 && !isSubmittingHousing && (
                              <div className="absolute z-20 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-gray-100">
                                {workerSuggestions.map((worker, idx) => (
                                  <div
                                    key={worker.id}
                                    onClick={() => handleWorkerSelection(worker)}
                                    className="p-3.5 hover:bg-teal-50/70 cursor-pointer transition-colors text-right group"
                                  >
                                    <div className="flex justify-between items-center mb-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-teal-900 group-hover:text-teal-700 text-sm">
                                          عاملة #{worker.id} - {worker.name}
                                        </span>
                                        {idx === 0 && workerSuggestions.length > 1 && (
                                          <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-semibold">
                                            الأحدث
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        {worker.latestOrderId && (
                                          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-medium">
                                            طلب #{worker.latestOrderId} ({worker.latestContractType === 'rental' ? 'تأجير' : 'استقدام'})
                                          </span>
                                        )}
                                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                          {worker.nationality || 'غير محدد'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-1">
                                      <div>
                                        <span className="text-gray-400">رقم الجواز: </span>
                                        <span className="font-mono">{worker.passportNumber || 'لا يوجد'}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400">الجوال: </span>
                                        <span className="font-mono" dir="ltr">{worker.phone || 'لا يوجد'}</span>
                                      </div>
                                    </div>
                                    {worker.clientData && (worker.clientData.clientName || worker.clientData.clientMobile || worker.clientData.clientIdNumber) && (
                                      <div className="mt-1.5 pt-1.5 border-t border-gray-100 text-xs text-gray-700 bg-gray-50/80 p-2 rounded-lg flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                          <span className="font-semibold text-teal-900">العميل: {worker.clientData.clientName || 'غير مسجل'}</span>
                                          {worker.clientData.clientMobile && <span className="text-gray-600 font-mono" dir="ltr">({worker.clientData.clientMobile})</span>}
                                          {worker.clientData.clientIdNumber && <span className="text-gray-500">هوية: {worker.clientData.clientIdNumber}</span>}
                                        </div>
                                        {worker.totalOrdersCount > 1 && (
                                          <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                            {worker.totalOrdersCount} طلبات مسجلة
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {!selectedWorker && (
                            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                              <span>⚠️ يرجى البحث واختيار العاملة لعرض وتأكيد كافة بياناتها تلقائياً.</span>
                            </p>
                          )}
                        </div>

                        {/* القسم 2: معلومات العاملة الأساسية */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
                            <FaUserFriends className="w-4 h-4 text-teal-700" />
                            <h3 className="text-sm font-bold text-gray-900">معلومات العاملة الأساسية</h3>
                            {selectedWorker && (
                              <span className="mr-auto text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md font-mono font-semibold">
                                رقم العاملة: #{selectedWorker.id}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">اسم العاملة</label>
                              <input
                                type="text"
                                value={selectedWorker?.name || ''}
                                readOnly
                                placeholder="اسم العاملة"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-right text-sm text-gray-800 font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">الجنسية</label>
                              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                                {selectedWorker?.nationality && getCountryFlagUrl(selectedWorker.nationality) && (
                                  <img
                                    src={getCountryFlagUrl(selectedWorker.nationality) || ''}
                                    alt=""
                                    className="w-5 h-3.5 object-cover rounded-xs border border-gray-300 shrink-0"
                                  />
                                )}
                                <input
                                  type="text"
                                  value={selectedWorker?.nationality || ''}
                                  readOnly
                                  placeholder="الجنسية"
                                  className="w-full bg-transparent border-none text-right text-sm text-gray-800 font-medium p-0 focus:outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">رقم الجواز</label>
                              <input
                                type="text"
                                value={selectedWorker?.passportNumber || ''}
                                readOnly
                                placeholder="رقم الجواز"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-right text-sm text-gray-800 font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">رقم جوال العاملة</label>
                              <input
                                type="text"
                                value={selectedWorker?.phone || ''}
                                readOnly
                                placeholder="رقم الجوال"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-right text-sm text-gray-800 font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">العمر / الميلاد</label>
                              <input
                                type="text"
                                value={selectedWorker?.age ? `${selectedWorker.age} سنة` : (selectedWorker?.dateofbirth ? getDate(selectedWorker.dateofbirth) : '')}
                                readOnly
                                placeholder="العمر"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-right text-sm text-gray-800 font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">المكتب الخارجي</label>
                              <input
                                type="text"
                                value={selectedWorker?.office || ''}
                                readOnly
                                placeholder="المكتب"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-right text-sm text-gray-800 font-medium"
                              />
                            </div>
                          </div>
                        </div>

                        {/* القسم 3: معلومات العميل */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
                            <FaAddressBook className="w-4 h-4 text-blue-700" />
                            <h3 className="text-sm font-bold text-gray-900">معلومات العميل</h3>
                            {selectedWorker?.clientData?.clientId && (
                              <span className="mr-auto text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md font-semibold">
                                رقم العميل: #{selectedWorker.clientData.clientId}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">اسم العميل</label>
                              <input
                                type="text"
                                value={selectedWorker?.clientData?.clientName || ''}
                                readOnly
                                placeholder="اسم العميل"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-right text-sm text-gray-800 font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">رقم جوال العميل</label>
                              <input
                                type="text"
                                value={selectedWorker?.clientData?.clientMobile || ''}
                                readOnly
                                placeholder="رقم الجوال"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-right text-sm text-gray-800 font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">رقم الهوية الوطنية</label>
                              <input
                                type="text"
                                value={selectedWorker?.clientData?.clientIdNumber || ''}
                                readOnly
                                placeholder="رقم الهوية"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-right text-sm text-gray-800 font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">المدينة</label>
                              <input
                                type="text"
                                value={selectedWorker?.clientData?.city || ''}
                                readOnly
                                placeholder="المدينة"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-right text-sm text-gray-800 font-medium"
                              />
                            </div>
                          </div>
                        </div>

                        {/* القسم 4: حالة العقد والوصول والضمان */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            <h3 className="text-sm font-bold text-gray-900">حالة العقد وبيانات الوصول والضمان</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">نوع العقد</label>
                              <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-right text-sm font-semibold flex items-center justify-between">
                                <span>
                                  {selectedWorker
                                    ? (selectedWorker.latestContractType === 'rental'
                                        ? 'عقد تأجير'
                                        : (selectedWorker.latestContractType === 'recruitment' ? 'عقد استقدام' : 'استقدام'))
                                    : 'غير محدد'}
                                </span>
                                {selectedWorker?.latestOrderId && (
                                  <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-mono">
                                    طلب #{selectedWorker.latestOrderId}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">تاريخ دخول المملكة</label>
                              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium text-gray-800">
                                <Calendar className="w-4 h-4 text-teal-700 shrink-0" />
                                <span>{selectedWorker?.arrivalDate ? getDate(selectedWorker.arrivalDate) : 'غير مسجل'}</span>
                              </div>
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-xs font-semibold text-gray-500 mb-1">فترة الضمان (90 يوم)</label>
                              {(() => {
                                const guarantee = selectedWorker?.arrivalDate ? getSaudiGuaranteeInfo(selectedWorker.arrivalDate) : null;
                                if (!guarantee) {
                                  return (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-400">
                                      لا يوجد تاريخ وصول مسجل لحساب الضمان
                                    </div>
                                  );
                                }
                                return (
                                  <div className={`flex items-center justify-between border rounded-lg p-2.5 text-xs font-semibold ${
                                    guarantee.isExpired
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  }`}>
                                    <div className="flex items-center gap-1.5">
                                      <ShieldCheck className={`w-4 h-4 ${guarantee.isExpired ? 'text-red-600' : 'text-emerald-600'}`} />
                                      <span>انتهاء الضمان: {guarantee.guaranteeEndDate}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                                      guarantee.isExpired ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {guarantee.fullStatus} ({guarantee.text})
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* القسم 5: بيانات تسكين العاملة */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
                            <FaHome className="w-4 h-4 text-teal-800" />
                            <h3 className="text-sm font-bold text-gray-900">بيانات التسكين في السكن</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                مكان السكن <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <select
                                  value={formData.location}
                                  onChange={(e) => {
                                    setFormData({ ...formData, location: e.target.value });
                                    setValidationErrors((prev) => ({ ...prev, location: false }));
                                  }}
                                  disabled={isSubmittingHousing}
                                  style={{ backgroundImage: 'none' }}
                                  className={`w-full appearance-none bg-none bg-white border rounded-xl p-3 pr-4 pl-10 text-right text-sm focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                    validationErrors.location ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                                  }`}
                                >
                                  <option value="">-- اختر السكن --</option>
                                  {locations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>
                                      {loc.location} ({loc.currentOccupancy || 0} / {loc.quantity})
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                  <ChevronDown className="w-4 h-4" />
                                </div>
                              </div>
                              {validationErrors.location && (
                                <p className="text-xs text-red-500 mt-1">يرجى اختيار السكن</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                تاريخ التسكين <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                value={formData.houseentrydate}
                                onChange={(e) => setFormData({ ...formData, houseentrydate: e.target.value })}
                                disabled={isSubmittingHousing}
                                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-right text-sm focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                سبب التسكين <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <select
                                  value={formData.reason}
                                  onChange={(e) => {
                                    const selectedReason = e.target.value;
                                    let autoAction = '';
                                    if (selectedReason === 'حالة مرضية' || selectedReason === 'حمل') {
                                      autoAction = 'ترحيل';
                                    } else if (selectedReason) {
                                      autoAction = 'نقل كفالة';
                                    }
                                    setFormData({ ...formData, reason: selectedReason, actionTaken: autoAction });
                                    setValidationErrors((prev) => ({ ...prev, reason: false, actionTaken: false }));
                                  }}
                                  disabled={isSubmittingHousing}
                                  style={{ backgroundImage: 'none' }}
                                  className={`w-full appearance-none bg-none bg-white border rounded-xl p-3 pr-4 pl-10 text-right text-sm focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                    validationErrors.reason ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                                  }`}
                                >
                                  <option value="">-- اختر سبب التسكين --</option>
                                  <option value="رفض الكفيل للعاملة">رفض الكفيل للعاملة</option>
                                  <option value="رفض العاملة للكفيل">رفض العاملة للكفيل</option>
                                  <option value="استلام من إيواء الوزارة (سلسك -slesk)">استلام من إيواء الوزارة (سلسك -slesk)</option>
                                  <option value="حالة مرضية">حالة مرضية</option>
                                  <option value="حمل">حمل</option>
                                  <option value="تغييب عن العمل (هروب )">تغييب عن العمل (هروب )</option>
                                  <option value="عدم استلام الكفيل للعاملة بعد الوصول">عدم استلام الكفيل للعاملة بعد الوصول</option>
                                </select>
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                  <ChevronDown className="w-4 h-4" />
                                </div>
                              </div>
                              {validationErrors.reason && (
                                <p className="text-xs text-red-500 mt-1">يرجى اختيار سبب التسكين</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                الإجراء المتخذ <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <select
                                  value={formData.actionTaken}
                                  onChange={(e) => {
                                    setFormData({ ...formData, actionTaken: e.target.value });
                                    setValidationErrors((prev) => ({ ...prev, actionTaken: false }));
                                  }}
                                  disabled={isSubmittingHousing}
                                  style={{ backgroundImage: 'none' }}
                                  className={`w-full appearance-none bg-none bg-white border rounded-xl p-3 pr-4 pl-10 text-right text-sm focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                    validationErrors.actionTaken ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                                  }`}
                                >
                                  <option value="">-- اختر الإجراء المتخذ --</option>
                                  <option value="نقل كفالة">نقل كفالة</option>
                                  <option value="ترحيل">ترحيل</option>
                                </select>
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                  <ChevronDown className="w-4 h-4" />
                                </div>
                              </div>
                              {validationErrors.actionTaken && (
                                <p className="text-xs text-red-500 mt-1">يرجى تحديد الإجراء المتخذ</p>
                              )}
                            </div>

                            {/* قسم التقرير الطبي الإجباري لحالات المرض أو الحمل */}
                            {(formData.reason === 'حالة مرضية' || formData.reason === 'حمل') && (
                              <div className="sm:col-span-2 bg-red-50/60 border border-red-200 rounded-xl p-4 transition-all animate-in fade-in duration-200">
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-sm font-bold text-red-900 flex items-center gap-1.5">
                                    <FileText className="w-4 h-4 text-red-600" />
                                    <span>مرفق التقرير الطبي ({formData.reason})</span>
                                    <span className="text-red-600 font-bold">*</span>
                                  </label>
                                  {formData.medicalReportFile && (
                                    <a
                                      href={formData.medicalReportFile}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs bg-red-100 hover:bg-red-200 text-red-800 font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors"
                                    >
                                      <Check className="w-3.5 h-3.5 text-green-600" />
                                      <span>عرض الملف المرفق</span>
                                    </a>
                                  )}
                                </div>
                                <p className="text-xs text-red-700/80 mb-3">
                                  يجب إرفاق التقرير الطبي المعتمد لإثبات حالة {formData.reason} (يقبل PDF أو صور).
                                </p>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="file"
                                    id="medical-report-file"
                                    accept=".pdf,image/*"
                                    onChange={(e) => handleMedicalReportUpload(e, 'formData')}
                                    disabled={isUploadingMedicalReport || isSubmittingHousing}
                                    className={`w-full bg-white border text-sm rounded-lg p-2 file:mr-0 file:ml-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-red-700 file:text-white hover:file:bg-red-800 cursor-pointer disabled:opacity-50 ${
                                      validationErrors.medicalReportFile ? 'border-red-500 ring-1 ring-red-500' : 'border-red-300'
                                    }`}
                                  />
                                  {isUploadingMedicalReport && (
                                    <div className="flex items-center gap-1.5 text-xs text-red-700 shrink-0">
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-700 border-t-transparent"></div>
                                      <span>جاري الرفع...</span>
                                    </div>
                                  )}
                                </div>
                                {validationErrors.medicalReportFile && (
                                  <p className="text-xs text-red-600 font-medium mt-1.5">
                                    ⚠️ ملف التقرير الطبي إجباري ولا يمكن المتابعة بدونه.
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="sm:col-span-2">
                              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                التفاصيل والملاحظات <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                placeholder="يجب إدخال تفاصيل الحالة بالضبط للعودة لها في أي وقت ومعرفة الحالة بدقة..."
                                value={formData.details}
                                onChange={(e) => {
                                  setFormData({ ...formData, details: e.target.value });
                                  setValidationErrors((prev) => ({ ...prev, details: false }));
                                }}
                                disabled={isSubmittingHousing}
                                rows={3}
                                className={`w-full bg-white border rounded-xl p-3 text-right text-sm focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                  validationErrors.details ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                                }`}
                              />
                              {validationErrors.details && (
                                <p className="text-xs text-red-500 mt-1">يجب إدخال تفاصيل الحالة بالضبط للعودة لها في أي وقت ومعرفة الحالة بدقة</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Step 1 Footer */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => closeModal('housingForm')}
                            disabled={isSubmittingHousing}
                            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (validateHousingStep1()) {
                                setHousingStep(2);
                              }
                            }}
                            className="bg-teal-800 hover:bg-teal-700 text-white rounded-xl px-7 py-2.5 text-sm font-bold flex items-center justify-center gap-2 shadow-teal-800/20 shadow-sm hover:shadow-md transition-all cursor-pointer"
                          >
                            <span>التالي: محضر الاستلام والمقتنيات</span>
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Step 2: محضر الاستلام والمقتنيات */}
                        {/* ملخص العاملة والسكن */}
                        <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-teal-900">عاملة #{selectedWorker?.id} - {selectedWorker?.name}</span>
                            <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-medium">
                              {selectedWorker?.nationality || 'غير محدد'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-teal-900 font-medium">
                            <span>السكن: {locations.find(l => l.id.toString() === formData.location)?.location || 'محدد'}</span>
                            <span>السبب: {formData.reason}</span>
                            <span>الإجراء: {formData.actionTaken}</span>
                          </div>
                        </div>

                        {/* شبكة أسئلة المحضر */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
                          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                            <ClipboardCheck className="w-5 h-5 text-teal-800" />
                            <div>
                              <h3 className="text-base font-bold text-gray-900">محضر استلام ومقتنيات العاملة وحالتها عند التسكين</h3>
                              <p className="text-xs text-gray-500">توثيق المستحقات، الوثائق، المقتنيات، والحالة الطبية والنظامية</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* 1. الرواتب */}
                            <div className="sm:col-span-2">
                              <SmartAuditToggle
                                label="هل تم استلام كامل الرواتب من الكفيل؟"
                                value={formData.salaryReceived}
                                onChange={(val) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    salaryReceived: val,
                                    isHasEntitlements: !val,
                                    salaryRemainingAmount: val ? '' : prev.salaryRemainingAmount,
                                    entitlementsCost: val ? '' : prev.entitlementsCost,
                                    entitlementReason: val ? '' : prev.entitlementReason,
                                  }))
                                }
                                options={[
                                  { label: 'نعم (مستلمة بالكامل)', value: true },
                                  { label: 'لا (يوجد متبقي)', value: false },
                                ]}
                                disabled={isSubmittingHousing}
                              />
                              {!formData.salaryReceived && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                  <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                      المبلغ المتبقي / المستحق (ر.س) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="number"
                                      placeholder="أدخل المبلغ (مثال: 1500)"
                                      value={formData.salaryRemainingAmount}
                                      onChange={(e) => setFormData({ ...formData, salaryRemainingAmount: e.target.value })}
                                      disabled={isSubmittingHousing}
                                      min="0"
                                      step="0.01"
                                      className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-sm font-bold text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                    />
                                    <PresetChips
                                      chips={['1500', '3000', '4500', '750']}
                                      onSelect={(val) => setFormData((prev) => ({ ...prev, salaryRemainingAmount: val }))}
                                      disabled={isSubmittingHousing}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                      ملاحظات / تفاصيل الرواتب
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="مثال: رواتب آخر شهرين مستحقة"
                                      value={formData.entitlementReason}
                                      onChange={(e) => setFormData({ ...formData, entitlementReason: e.target.value })}
                                      disabled={isSubmittingHousing}
                                      className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-sm text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                    />
                                    <PresetChips
                                      chips={['رواتب آخر شهرين', 'رواتب 3 أشهر', 'متبقي نصف شهر', 'مستحقات نهاية خدمة']}
                                      onSelect={(val) => setFormData((prev) => ({ ...prev, entitlementReason: val }))}
                                      disabled={isSubmittingHousing}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 2. الجوال */}
                            <div>
                              <SmartAuditToggle
                                label="هل يوجد جوال بحوزة العاملة؟"
                                value={formData.hasPhone}
                                onChange={(val) => setFormData((prev) => ({ ...prev, hasPhone: val, phoneReason: val ? '' : prev.phoneReason }))}
                                options={[
                                  { label: 'نعم', value: true },
                                  { label: 'لا', value: false },
                                ]}
                                disabled={isSubmittingHousing}
                              />
                              {!formData.hasPhone && (
                                <div className="mt-1.5">
                                  <input
                                    type="text"
                                    placeholder="سبب عدم وجود الجوال..."
                                    value={formData.phoneReason}
                                    onChange={(e) => setFormData({ ...formData, phoneReason: e.target.value })}
                                    disabled={isSubmittingHousing}
                                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-xs text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                  <PresetChips
                                    chips={['مصادر من الكفيل', 'لا تمتلك جوال', 'مفقود', 'تالف']}
                                    onSelect={(val) => setFormData((prev) => ({ ...prev, phoneReason: val }))}
                                    disabled={isSubmittingHousing}
                                  />
                                </div>
                              )}
                            </div>

                            {/* 3. الإقامة */}
                            <div>
                              <SmartAuditToggle
                                label="هل الإقامة بحوزة العاملة؟"
                                value={formData.hasIqama}
                                onChange={(val) => setFormData((prev) => ({ ...prev, hasIqama: val, iqamaReason: val ? '' : prev.iqamaReason }))}
                                options={[
                                  { label: 'نعم', value: true },
                                  { label: 'لا', value: false },
                                ]}
                                disabled={isSubmittingHousing}
                              />
                              {!formData.hasIqama && (
                                <div className="mt-1.5">
                                  <input
                                    type="text"
                                    placeholder="سبب عدم وجود الإقامة..."
                                    value={formData.iqamaReason}
                                    onChange={(e) => setFormData({ ...formData, iqamaReason: e.target.value })}
                                    disabled={isSubmittingHousing}
                                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-xs text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                  <PresetChips
                                    chips={['مع الكفيل', 'لم تصدر بعد', 'منتهية', 'مفقودة']}
                                    onSelect={(val) => setFormData((prev) => ({ ...prev, iqamaReason: val }))}
                                    disabled={isSubmittingHousing}
                                  />
                                </div>
                              )}
                            </div>

                            {/* 4. الجواز */}
                            <div>
                              <SmartAuditToggle
                                label="هل جواز السفر بحوزة العاملة؟"
                                value={formData.hasPassport}
                                onChange={(val) => setFormData((prev) => ({ ...prev, hasPassport: val, passportReason: val ? '' : prev.passportReason }))}
                                options={[
                                  { label: 'نعم', value: true },
                                  { label: 'لا', value: false },
                                ]}
                                disabled={isSubmittingHousing}
                              />
                              {!formData.hasPassport && (
                                <div className="mt-1.5">
                                  <input
                                    type="text"
                                    placeholder="سبب عدم وجود الجواز..."
                                    value={formData.passportReason}
                                    onChange={(e) => setFormData({ ...formData, passportReason: e.target.value })}
                                    disabled={isSubmittingHousing}
                                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-xs text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                  <PresetChips
                                    chips={['مع الكفيل', 'مفقود', 'بالسفارة', 'منتهي']}
                                    onSelect={(val) => setFormData((prev) => ({ ...prev, passportReason: val }))}
                                    disabled={isSubmittingHousing}
                                  />
                                </div>
                              )}
                            </div>

                            {/* 5. الأغراض الشخصية */}
                            <div>
                              <SmartAuditToggle
                                label="هل لديها أغراض / حقائب شخصية؟"
                                value={formData.hasPersonalItems}
                                onChange={(val) => setFormData((prev) => ({ ...prev, hasPersonalItems: val, personalItemsDetails: val ? prev.personalItemsDetails : '' }))}
                                options={[
                                  { label: 'نعم (يوجد)', value: true },
                                  { label: 'لا', value: false },
                                ]}
                                disabled={isSubmittingHousing}
                              />
                              {formData.hasPersonalItems && (
                                <div className="mt-1.5">
                                  <input
                                    type="text"
                                    placeholder="تفاصيل الأمتعة والحقائب المستلمة..."
                                    value={formData.personalItemsDetails}
                                    onChange={(e) => setFormData({ ...formData, personalItemsDetails: e.target.value })}
                                    disabled={isSubmittingHousing}
                                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-xs text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                  <PresetChips
                                    chips={['حقيبة ملابس كبيرة', 'حقيبتين + أمتعة شخصية', 'حقيبة يد فقط', 'أمتعة متعددة']}
                                    onSelect={(val) => setFormData((prev) => ({ ...prev, personalItemsDetails: val }))}
                                    disabled={isSubmittingHousing}
                                  />
                                </div>
                              )}
                            </div>

                            {/* 6. الفحص الطبي للإقامة */}
                            <div>
                              <SmartAuditToggle
                                label="الفحص الطبي للإقامة"
                                value={formData.medicalCheckDone}
                                onChange={(val) => setFormData((prev) => ({ ...prev, medicalCheckDone: val }))}
                                options={[
                                  { label: 'تم الفحص', value: true },
                                  { label: 'لم يتم', value: false },
                                ]}
                                disabled={isSubmittingHousing}
                              />
                            </div>

                            {/* 7. نوع التأشيرة */}
                            <div>
                              <SmartAuditToggle
                                label="نوع التأشيرة"
                                value={formData.visaType}
                                onChange={(val) => setFormData((prev) => ({ ...prev, visaType: val }))}
                                options={[
                                  { label: 'مدفوعة', value: 'مدفوعة' },
                                  { label: 'تأهيل شامل', value: 'تأهيل شامل' },
                                ]}
                                disabled={isSubmittingHousing}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Step 2 Footer */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => setHousingStep(1)}
                            disabled={isSubmittingHousing}
                            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl px-6 py-2.5 text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <span>السابق: بيانات التسكين</span>
                          </button>
                          <button
                            type="submit"
                            disabled={!selectedWorker || !selectedWorker.id || isSubmittingHousing}
                            className={`rounded-xl px-8 py-2.5 text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                              !selectedWorker || !selectedWorker.id || isSubmittingHousing
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                : 'bg-teal-800 hover:bg-teal-700 text-white shadow-teal-800/20 hover:shadow-md'
                            }`}
                          >
                            {isSubmittingHousing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>جاري حفظ التسكين...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                <span>تأكيد وحفظ التسكين</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </form>
                </div>
              </div>
            )}
            {/* Edit Worker Modal - Redesigned 2-Step Wizard */}
            {modals.editWorker && (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-3 sm:p-4 overflow-y-auto"
                onClick={() => closeModal('editWorker')}
                dir="rtl"
              >
                <div
                  className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="bg-gradient-to-l from-teal-900 via-teal-800 to-teal-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                        <Edit3 className="w-5 h-5 text-teal-200" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          <span>تعديل بيانات التسكين</span>
                          <span className="text-xs bg-teal-700/80 text-teal-100 px-2.5 py-0.5 rounded-full border border-teal-500/30">
                            {editWorkerForm.isExternal ? 'عاملة خارجية' : 'عاملة داخلية (مكتب روائس)'}
                          </span>
                        </h2>
                        <p className="text-xs text-teal-200/80 mt-0.5">
                          {editStep === 1
                            ? 'الخطوة 1: تعديل بيانات العاملة والتسكين والعميل'
                            : 'الخطوة 2: محضر استلام ومقتنيات العاملة وحالتها عند التسكين'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => closeModal('editWorker')}
                      className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors cursor-pointer"
                      title="إغلاق"
                    >
                      <span className="text-2xl leading-none">&times;</span>
                    </button>
                  </div>

                  {/* Step Indicator Header */}
                  {!editWorkerForm.isExternal && (
                    <div className="bg-teal-900/5 border-b border-gray-200 px-5 sm:px-6 py-2.5 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditStep(1)}
                        className={`flex-1 flex items-center gap-2.5 p-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-right cursor-pointer ${
                          editStep === 1
                            ? 'bg-teal-800 text-white shadow-xs'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                            editStep === 1 ? 'bg-white text-teal-800 font-bold' : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          1
                        </span>
                        <div className="truncate">
                          <div className="leading-tight">الخطوة الأولى</div>
                          <div
                            className={`text-[10px] font-normal ${
                              editStep === 1 ? 'text-teal-100' : 'text-gray-500'
                            }`}
                          >
                            بيانات العاملة والتسكين
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (validateEditStep1()) {
                            setEditStep(2);
                          }
                        }}
                        className={`flex-1 flex items-center gap-2.5 p-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-right cursor-pointer ${
                          editStep === 2
                            ? 'bg-teal-800 text-white shadow-xs'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                            editStep === 2 ? 'bg-white text-teal-800 font-bold' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          2
                        </span>
                        <div className="truncate">
                          <div className="leading-tight">الخطوة الثانية</div>
                          <div
                            className={`text-[10px] font-normal ${
                              editStep === 2 ? 'text-teal-100' : 'text-gray-500'
                            }`}
                          >
                            محضر الاستلام والمقتنيات
                          </div>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Body (Scrollable) */}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!validateEditStep1()) {
                        setEditStep(1);
                        return;
                      }
                      if (selectedWorkerId) {
                        try {
                          setIsSubmittingEdit(true);
                          await updateHousedWorker(selectedWorkerId, editWorkerForm);
                          closeModal('editWorker');
                        } finally {
                          setIsSubmittingEdit(false);
                        }
                      }
                    }}
                    className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-gray-50/50"
                  >
                    {editStep === 1 ? (
                      <>
                        {/* القسم 1: معلومات العاملة الأساسية */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
                            <FaUserFriends className="w-4 h-4 text-teal-700" />
                            <h3 className="text-sm font-bold text-gray-900">معلومات العاملة الأساسية</h3>
                            {editMaidProfileId && (
                              <span className="mr-auto text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md font-mono font-semibold">
                                رقم السجل: #{editMaidProfileId}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                اسم العاملة <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={editWorkerForm.maidName}
                                onChange={(e) =>
                                  setEditWorkerForm({ ...editWorkerForm, maidName: e.target.value })
                                }
                                placeholder="اسم العاملة"
                                className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-right text-sm text-gray-800 font-medium focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all"
                              />
                            </div>

                            {editWorkerForm.isExternal ? (
                              <div>
                                <NationalityFieldWithList
                                  label="الجنسية"
                                  items={uniqueNationalities}
                                  value={editWorkerForm.extNationality}
                                  onChange={(v) =>
                                    setEditWorkerForm({ ...editWorkerForm, extNationality: v })
                                  }
                                  required
                                />
                              </div>
                            ) : (
                              <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">الجنسية</label>
                                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                                  {selectedEditingWorker?.Order?.Nationalitycopy &&
                                    getCountryFlagUrl(selectedEditingWorker.Order.Nationalitycopy) && (
                                      <img
                                        src={
                                          getCountryFlagUrl(selectedEditingWorker.Order.Nationalitycopy) || ''
                                        }
                                        alt=""
                                        className="w-5 h-3.5 object-cover rounded-xs border border-gray-300 shrink-0"
                                      />
                                    )}
                                  <input
                                    type="text"
                                    value={selectedEditingWorker?.Order?.Nationalitycopy || ''}
                                    readOnly
                                    placeholder="الجنسية"
                                    className="w-full bg-transparent border-none text-right text-sm text-gray-800 font-medium p-0 focus:outline-none"
                                  />
                                </div>
                              </div>
                            )}

                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">رقم الجواز</label>
                              <input
                                type="text"
                                value={
                                  selectedEditingWorker?.Order?.Passportnumber ||
                                  selectedEditingWorker?.externalHomedmaid?.passportNumber ||
                                  ''
                                }
                                readOnly
                                placeholder="رقم الجواز"
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-right text-sm text-gray-800 font-medium"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">رقم جوال العاملة</label>
                              <input
                                type="text"
                                inputMode="tel"
                                value={editWorkerForm.maidPhone}
                                onChange={(e) =>
                                  setEditWorkerForm({ ...editWorkerForm, maidPhone: e.target.value })
                                }
                                placeholder="رقم الجوال"
                                className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-right text-sm text-gray-800 font-medium focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">تاريخ الميلاد</label>
                              <input
                                type="date"
                                value={editWorkerForm.maidDateOfBirth}
                                onChange={(e) =>
                                  setEditWorkerForm({
                                    ...editWorkerForm,
                                    maidDateOfBirth: e.target.value,
                                  })
                                }
                                className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-right text-sm text-gray-800 font-medium focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all"
                              />
                            </div>

                            {editWorkerForm.isExternal && (
                              <div className="sm:col-span-3 bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  {editWorkerForm.maidImage ? (
                                    <img
                                      src={editWorkerForm.maidImage}
                                      alt="صورة العاملة"
                                      className="w-14 h-14 rounded-xl object-cover border border-amber-300 shadow-xs cursor-pointer"
                                      onClick={() => window.open(editWorkerForm.maidImage, '_blank')}
                                    />
                                  ) : (
                                    <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs border border-dashed border-amber-300">
                                      بدون صورة
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-xs font-bold text-amber-900">صورة العاملة الخارجية</p>
                                    <p className="text-[11px] text-amber-700">يمكنك تحديث صورة العاملة المرفقة</p>
                                  </div>
                                </div>
                                <div>
                                  <label className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5">
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>{editWorkerForm.maidImage ? 'تغيير الصورة' : 'رفع صورة'}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      disabled={isUploadingExternalPhoto}
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                          setIsUploadingExternalPhoto(true);
                                          const base64 = await new Promise<string>((resolve, reject) => {
                                            const reader = new FileReader();
                                            reader.onload = () => resolve(reader.result as string);
                                            reader.onerror = reject;
                                            reader.readAsDataURL(file);
                                          });
                                          const response = await axios.post('/api/housing/upload-worker-photo', {
                                            file: base64,
                                            filename: file.name,
                                            contentType: file.type || 'image/jpeg',
                                          });
                                          const fileUrl = response.data.url || response.data.filePath;
                                          setEditWorkerForm((prev) => ({ ...prev, maidImage: fileUrl }));
                                          showNotification('تم رفع الصورة بنجاح');
                                        } catch (err: any) {
                                          showNotification(err.response?.data?.error || 'فشل رفع الصورة', 'error');
                                        } finally {
                                          setIsUploadingExternalPhoto(false);
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                            )}

                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">رقم سجل العاملة</label>
                              <input
                                type="text"
                                value={editMaidProfileId ? `#${editMaidProfileId}` : 'غير متوفر'}
                                readOnly
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-right text-sm text-gray-800 font-medium"
                              />
                            </div>
                          </div>
                        </div>

                        {/* القسم 2: معلومات العميل (إن وجدت) */}
                        {(() => {
                          const clientName =
                            selectedEditingWorker?.Order?.NewOrder?.[0]?.client?.fullname ||
                            selectedEditingWorker?.Order?.NewOrder?.[0]?.ClientName ||
                            selectedEditingWorker?.externalHomedmaid?.Client?.fullname ||
                            '';
                          const clientPhone =
                            selectedEditingWorker?.Order?.NewOrder?.[0]?.client?.phonenumber ||
                            selectedEditingWorker?.Order?.NewOrder?.[0]?.clientphonenumber ||
                            selectedEditingWorker?.Order?.NewOrder?.[0]?.PhoneNumber ||
                            selectedEditingWorker?.externalHomedmaid?.Client?.phonenumber ||
                            '';
                          const clientIdNumber =
                            selectedEditingWorker?.Order?.NewOrder?.[0]?.client?.nationalId ||
                            selectedEditingWorker?.Order?.NewOrder?.[0]?.nationalId ||
                            selectedEditingWorker?.externalHomedmaid?.Client?.nationalId ||
                            '';
                          const clientCity =
                            selectedEditingWorker?.Order?.NewOrder?.[0]?.client?.city ||
                            selectedEditingWorker?.externalHomedmaid?.Client?.city ||
                            '';
                          const clientId =
                            selectedEditingWorker?.Order?.NewOrder?.[0]?.clientID ||
                            selectedEditingWorker?.externalHomedmaid?.clientId;

                          if (!clientName && !clientPhone && !clientIdNumber && !clientCity) return null;

                          return (
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
                                <FaAddressBook className="w-4 h-4 text-blue-700" />
                                <h3 className="text-sm font-bold text-gray-900">معلومات العميل</h3>
                                {clientId && (
                                  <span className="mr-auto text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md font-semibold">
                                    رقم العميل: #{clientId}
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 mb-1">اسم العميل</label>
                                  <input
                                    type="text"
                                    value={clientName}
                                    readOnly
                                    placeholder="اسم العميل"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-right text-sm text-gray-800 font-medium"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 mb-1">رقم جوال العميل</label>
                                  <input
                                    type="text"
                                    value={clientPhone}
                                    readOnly
                                    placeholder="رقم الجوال"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-right text-sm text-gray-800 font-medium"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 mb-1">رقم الهوية الوطنية</label>
                                  <input
                                    type="text"
                                    value={clientIdNumber}
                                    readOnly
                                    placeholder="رقم الهوية"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-right text-sm text-gray-800 font-medium"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 mb-1">المدينة</label>
                                  <input
                                    type="text"
                                    value={clientCity}
                                    readOnly
                                    placeholder="المدينة"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-right text-sm text-gray-800 font-medium"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* القسم 3: حالة العقد والوصول والضمان */}
                        {(() => {
                          const arrival = selectedEditingWorker?.Order?.NewOrder?.[0]?.arrivals?.[0];
                          const arrivalDate = arrival?.KingdomentryDate;
                          const contractType =
                            selectedEditingWorker?.Order?.NewOrder?.[0]?.typeOfContract ||
                            selectedEditingWorker?.externalHomedmaid?.type ||
                            'recruitment';

                          return (
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
                                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                                <h3 className="text-sm font-bold text-gray-900">حالة العقد وبيانات الوصول والضمان</h3>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 mb-1">نوع العقد</label>
                                  <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-right text-sm font-semibold">
                                    {contractType === 'rental' ? 'عقد تأجير' : 'عقد استقدام'}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-gray-500 mb-1">تاريخ الوصول</label>
                                  <input
                                    type="text"
                                    value={arrivalDate ? getDate(arrivalDate) : 'غير مسجل'}
                                    readOnly
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-right text-sm text-gray-800 font-medium"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-xs font-semibold text-gray-500 mb-1">حالة الضمان (90 يوم)</label>
                                  {(() => {
                                    const guarantee = arrivalDate ? getSaudiGuaranteeInfo(arrivalDate) : null;
                                    if (!guarantee) {
                                      return (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-400">
                                          لا يوجد تاريخ وصول مسجل لحساب الضمان
                                        </div>
                                      );
                                    }
                                    return (
                                      <div
                                        className={`flex items-center justify-between border rounded-lg p-2.5 text-xs font-semibold ${
                                          guarantee.isExpired
                                            ? 'bg-red-50 text-red-700 border-red-200'
                                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5">
                                          <ShieldCheck
                                            className={`w-4 h-4 ${
                                              guarantee.isExpired ? 'text-red-600' : 'text-emerald-600'
                                            }`}
                                          />
                                          <span>انتهاء الضمان: {guarantee.guaranteeEndDate}</span>
                                        </div>
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[11px] ${
                                            guarantee.isExpired
                                              ? 'bg-red-100 text-red-800'
                                              : 'bg-emerald-100 text-emerald-800'
                                          }`}
                                        >
                                          {guarantee.fullStatus} ({guarantee.text})
                                        </span>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* القسم 4: بيانات التسكين في السكن */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
                            <FaHome className="w-4 h-4 text-teal-800" />
                            <h3 className="text-sm font-bold text-gray-900">بيانات التسكين في السكن</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                مكان السكن <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <select
                                  value={editWorkerForm.location_id || ''}
                                  onChange={(e) =>
                                    setEditWorkerForm({
                                      ...editWorkerForm,
                                      location_id: e.target.value ? Number(e.target.value) : null,
                                    })
                                  }
                                  disabled={isSubmittingEdit}
                                  style={{ backgroundImage: 'none' }}
                                  className="w-full appearance-none bg-none bg-white border border-gray-300 rounded-xl p-3 pr-4 pl-10 text-right text-sm focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <option value="">-- اختر السكن --</option>
                                  {locations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>
                                      {loc.location} ({loc.currentOccupancy || 0} / {loc.quantity})
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                  <ChevronDown className="w-4 h-4" />
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                تاريخ التسكين <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                value={editWorkerForm.Date}
                                onChange={(e) =>
                                  setEditWorkerForm({ ...editWorkerForm, Date: e.target.value })
                                }
                                disabled={isSubmittingEdit}
                                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-right text-sm focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                تاريخ التسليم
                              </label>
                              <input
                                type="date"
                                value={editWorkerForm.deliveryDate}
                                onChange={(e) =>
                                  setEditWorkerForm({ ...editWorkerForm, deliveryDate: e.target.value })
                                }
                                disabled={isSubmittingEdit}
                                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-right text-sm focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                سبب التسكين <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <select
                                  value={editWorkerForm.Reason || ''}
                                  onChange={(e) => {
                                    const selectedReason = e.target.value;
                                    let autoAction = editWorkerForm.actionTaken;
                                    if (selectedReason === 'حالة مرضية' || selectedReason === 'حمل') {
                                      autoAction = 'ترحيل';
                                    } else if (selectedReason) {
                                      autoAction = 'نقل كفالة';
                                    }
                                    setEditWorkerForm({
                                      ...editWorkerForm,
                                      Reason: selectedReason,
                                      actionTaken: autoAction,
                                    });
                                  }}
                                  disabled={isSubmittingEdit}
                                  style={{ backgroundImage: 'none' }}
                                  className="w-full appearance-none bg-none bg-white border border-gray-300 rounded-xl p-3 pr-4 pl-10 text-right text-sm focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <option value="">-- اختر سبب التسكين --</option>
                                  {editWorkerForm.isExternal ? (
                                    <>
                                      <option value="وصول بالخطأ للمكتب">وصول بالخطأ للمكتب</option>
                                      <option value="استضافة مؤقتة">استضافة مؤقتة</option>
                                      <option value="عاملة بدون بيانات / مجهولة الكفيل">عاملة بدون بيانات / مجهولة الكفيل</option>
                                      <option value="بانتظار تسليم لمكتب آخر">بانتظار تسليم لمكتب آخر</option>
                                      <option value="أخرى">أخرى</option>
                                    </>
                                  ) : (
                                    <>
                                      <option value="رفض الكفيل للعاملة">رفض الكفيل للعاملة</option>
                                      <option value="رفض العاملة للكفيل">رفض العاملة للكفيل</option>
                                      <option value="استلام من إيواء الوزارة (سلسك -slesk)">
                                        استلام من إيواء الوزارة (سلسك -slesk)
                                      </option>
                                      <option value="حالة مرضية">حالة مرضية</option>
                                      <option value="حمل">حمل</option>
                                      <option value="تغييب عن العمل (هروب )">تغييب عن العمل (هروب )</option>
                                      <option value="عدم استلام الكفيل للعاملة بعد الوصول">
                                        عدم استلام الكفيل للعاملة بعد الوصول
                                      </option>
                                    </>
                                  )}
                                  {editWorkerForm.Reason &&
                                    ![
                                      'رفض الكفيل للعاملة',
                                      'رفض العاملة للكفيل',
                                      'استلام من إيواء الوزارة (سلسك -slesk)',
                                      'حالة مرضية',
                                      'حمل',
                                      'تغييب عن العمل (هروب )',
                                      'عدم استلام الكفيل للعاملة بعد الوصول',
                                      'وصول بالخطأ للمكتب',
                                      'استضافة مؤقتة',
                                      'عاملة بدون بيانات / مجهولة الكفيل',
                                      'بانتظار تسليم لمكتب آخر',
                                      'أخرى',
                                    ].includes(editWorkerForm.Reason) && (
                                      <option value={editWorkerForm.Reason}>{editWorkerForm.Reason}</option>
                                    )}
                                </select>
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                  <ChevronDown className="w-4 h-4" />
                                </div>
                              </div>
                            </div>

                            {/* مدة البقاء المتوقعة بالسكن للعاملات الخارجية */}
                            {editWorkerForm.isExternal && (
                              <div className="sm:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                  مدة البقاء المتوقعة بالسكن <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder="مثال: 3 أيام، أسبوع، حتى نقل الكفالة..."
                                  value={editWorkerForm.expectedStayDuration || ''}
                                  onChange={(e) =>
                                    setEditWorkerForm({ ...editWorkerForm, expectedStayDuration: e.target.value })
                                  }
                                  disabled={isSubmittingEdit}
                                  className="w-full bg-white border border-gray-300 rounded-xl p-3 text-right text-sm focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all disabled:opacity-50"
                                />
                                <PresetChips
                                  chips={['3 أيام', 'أسبوع', '10 أيام', 'أسبوعين', 'شهر']}
                                  onSelect={(val) =>
                                    setEditWorkerForm((prev) => ({ ...prev, expectedStayDuration: val }))
                                  }
                                  disabled={isSubmittingEdit}
                                />
                              </div>
                            )}

                            {!editWorkerForm.isExternal && (
                              <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                  الإجراء المتخذ <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <select
                                    value={editWorkerForm.actionTaken || ''}
                                    onChange={(e) =>
                                      setEditWorkerForm({ ...editWorkerForm, actionTaken: e.target.value })
                                    }
                                    disabled={isSubmittingEdit}
                                    style={{ backgroundImage: 'none' }}
                                    className="w-full appearance-none bg-none bg-white border border-gray-300 rounded-xl p-3 pr-4 pl-10 text-right text-sm focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <option value="">-- اختر الإجراء المتخذ --</option>
                                    <option value="نقل كفالة">نقل كفالة</option>
                                    <option value="ترحيل">ترحيل</option>
                                  </select>
                                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <ChevronDown className="w-4 h-4" />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* قسم التقرير الطبي الإجباري لحالات المرض أو الحمل */}
                            {!editWorkerForm.isExternal && (editWorkerForm.Reason === 'حالة مرضية' || editWorkerForm.Reason === 'حمل') && (
                              <div className="sm:col-span-2 bg-red-50/60 border border-red-200 rounded-xl p-4 transition-all animate-in fade-in duration-200">
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-sm font-bold text-red-900 flex items-center gap-1.5">
                                    <FileText className="w-4 h-4 text-red-600" />
                                    <span>مرفق التقرير الطبي ({editWorkerForm.Reason})</span>
                                    <span className="text-red-600 font-bold">*</span>
                                  </label>
                                  {editWorkerForm.medicalReportFile && (
                                    <a
                                      href={editWorkerForm.medicalReportFile}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs bg-red-100 hover:bg-red-200 text-red-800 font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors"
                                    >
                                      <Check className="w-3.5 h-3.5 text-green-600" />
                                      <span>عرض الملف المرفق</span>
                                    </a>
                                  )}
                                </div>
                                <p className="text-xs text-red-700/80 mb-3">
                                  يجب إرفاق التقرير الطبي المعتمد لإثبات حالة {editWorkerForm.Reason} (يقبل PDF أو صور).
                                </p>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={(e) => handleMedicalReportUpload(e, 'editWorkerForm')}
                                    disabled={isUploadingMedicalReport || isSubmittingEdit}
                                    className="w-full bg-white border border-red-300 text-sm rounded-lg p-2 file:mr-0 file:ml-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-red-700 file:text-white hover:file:bg-red-800 cursor-pointer disabled:opacity-50"
                                  />
                                  {isUploadingMedicalReport && (
                                    <div className="flex items-center gap-1.5 text-xs text-red-700 shrink-0 font-bold">
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-700 border-t-transparent"></div>
                                      <span>جاري الرفع...</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="sm:col-span-2">
                              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                التفاصيل والملاحظات <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                placeholder="يجب إدخال تفاصيل الحالة بالضبط للعودة لها في أي وقت ومعرفة الحالة بدقة..."
                                value={editWorkerForm.Details}
                                onChange={(e) =>
                                  setEditWorkerForm({ ...editWorkerForm, Details: e.target.value })
                                }
                                disabled={isSubmittingEdit}
                                rows={3}
                                className="w-full bg-white border border-gray-300 rounded-xl p-3 text-right text-sm focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Step 1 Footer */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => closeModal('editWorker')}
                            disabled={isSubmittingEdit}
                            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            إلغاء
                          </button>
                          {editWorkerForm.isExternal ? (
                            <button
                              type="submit"
                              disabled={isSubmittingEdit}
                              className="bg-teal-800 hover:bg-teal-700 text-white rounded-xl px-8 py-2.5 text-sm font-bold flex items-center justify-center gap-2 shadow-teal-800/20 shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isSubmittingEdit ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                  <span>جاري الحفظ...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4" />
                                  <span>تأكيد وحفظ التعديلات</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (validateEditStep1()) {
                                  setEditStep(2);
                                }
                              }}
                              className="bg-teal-800 hover:bg-teal-700 text-white rounded-xl px-7 py-2.5 text-sm font-bold flex items-center justify-center gap-2 shadow-teal-800/20 shadow-sm hover:shadow-md transition-all cursor-pointer"
                            >
                              <span>التالي: محضر الاستلام والمقتنيات</span>
                              <ArrowLeft className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Step 2: محضر الاستلام والمقتنيات */}
                        {/* ملخص العاملة والسكن */}
                        <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-teal-900">
                              عاملة {editMaidProfileId ? `#${editMaidProfileId}` : ''} - {editWorkerForm.maidName}
                            </span>
                            <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-medium">
                              {editWorkerForm.isExternal
                                ? editWorkerForm.extNationality || 'خارجية'
                                : selectedEditingWorker?.Order?.Nationalitycopy || 'غير محدد'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-teal-900 font-medium">
                            <span>
                              السكن:{' '}
                              {locations.find((l) => l.id === editWorkerForm.location_id)?.location || 'محدد'}
                            </span>
                            <span>السبب: {editWorkerForm.Reason}</span>
                            <span>الإجراء: {editWorkerForm.actionTaken}</span>
                          </div>
                        </div>

                        {/* شبكة أسئلة المحضر */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
                          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                            <ClipboardCheck className="w-5 h-5 text-teal-800" />
                            <div>
                              <h3 className="text-base font-bold text-gray-900">
                                محضر استلام ومقتنيات العاملة وحالتها عند التسكين
                              </h3>
                              <p className="text-xs text-gray-500">
                                توثيق وتعديل المستحقات، الوثائق، المقتنيات، والحالة الطبية والنظامية
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* 1. الرواتب */}
                            <div className="sm:col-span-2">
                              <SmartAuditToggle
                                label="هل تم استلام كامل الرواتب من الكفيل؟"
                                value={editWorkerForm.salaryReceived}
                                onChange={(val) =>
                                  setEditWorkerForm((prev) => ({
                                    ...prev,
                                    salaryReceived: val,
                                    isHasEntitlements: !val,
                                    salaryRemainingAmount: val ? '' : prev.salaryRemainingAmount,
                                    entitlementsCost: val ? '' : prev.entitlementsCost,
                                    entitlementReason: val ? '' : prev.entitlementReason,
                                  }))
                                }
                                options={[
                                  { label: 'نعم (مستلمة بالكامل)', value: true },
                                  { label: 'لا (يوجد متبقي)', value: false },
                                ]}
                                disabled={isSubmittingEdit}
                              />
                              {!editWorkerForm.salaryReceived && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                  <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                      المبلغ المتبقي / المستحق (ر.س) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="number"
                                      placeholder="أدخل المبلغ (مثال: 1500)"
                                      value={editWorkerForm.salaryRemainingAmount}
                                      onChange={(e) =>
                                        setEditWorkerForm({
                                          ...editWorkerForm,
                                          salaryRemainingAmount: e.target.value,
                                        })
                                      }
                                      disabled={isSubmittingEdit}
                                      min="0"
                                      step="0.01"
                                      className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-sm font-bold text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                    />
                                    <PresetChips
                                      chips={['1500', '3000', '4500', '750']}
                                      onSelect={(val) =>
                                        setEditWorkerForm((prev) => ({
                                          ...prev,
                                          salaryRemainingAmount: val,
                                        }))
                                      }
                                      disabled={isSubmittingEdit}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                      ملاحظات / تفاصيل الرواتب
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="مثال: رواتب آخر شهرين مستحقة"
                                      value={editWorkerForm.entitlementReason}
                                      onChange={(e) =>
                                        setEditWorkerForm({
                                          ...editWorkerForm,
                                          entitlementReason: e.target.value,
                                        })
                                      }
                                      disabled={isSubmittingEdit}
                                      className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-sm text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                    />
                                    <PresetChips
                                      chips={[
                                        'رواتب آخر شهرين',
                                        'رواتب 3 أشهر',
                                        'متبقي نصف شهر',
                                        'مستحقات نهاية خدمة',
                                      ]}
                                      onSelect={(val) =>
                                        setEditWorkerForm((prev) => ({
                                          ...prev,
                                          entitlementReason: val,
                                        }))
                                      }
                                      disabled={isSubmittingEdit}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 2. الجوال */}
                            <div>
                              <SmartAuditToggle
                                label="هل يوجد جوال بحوزة العاملة؟"
                                value={editWorkerForm.hasPhone}
                                onChange={(val) =>
                                  setEditWorkerForm((prev) => ({
                                    ...prev,
                                    hasPhone: val,
                                    phoneReason: val ? '' : prev.phoneReason,
                                  }))
                                }
                                options={[
                                  { label: 'نعم', value: true },
                                  { label: 'لا', value: false },
                                ]}
                                disabled={isSubmittingEdit}
                              />
                              {!editWorkerForm.hasPhone && (
                                <div className="mt-1.5">
                                  <input
                                    type="text"
                                    placeholder="سبب عدم وجود الجوال..."
                                    value={editWorkerForm.phoneReason}
                                    onChange={(e) =>
                                      setEditWorkerForm({
                                        ...editWorkerForm,
                                        phoneReason: e.target.value,
                                      })
                                    }
                                    disabled={isSubmittingEdit}
                                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-xs text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                  <PresetChips
                                    chips={['مصادر من الكفيل', 'لا تمتلك جوال', 'مفقود', 'تالف']}
                                    onSelect={(val) =>
                                      setEditWorkerForm((prev) => ({ ...prev, phoneReason: val }))
                                    }
                                    disabled={isSubmittingEdit}
                                  />
                                </div>
                              )}
                            </div>

                            {/* 3. الإقامة */}
                            <div>
                              <SmartAuditToggle
                                label="هل الإقامة بحوزة العاملة؟"
                                value={editWorkerForm.hasIqama}
                                onChange={(val) =>
                                  setEditWorkerForm((prev) => ({
                                    ...prev,
                                    hasIqama: val,
                                    iqamaReason: val ? '' : prev.iqamaReason,
                                  }))
                                }
                                options={[
                                  { label: 'نعم', value: true },
                                  { label: 'لا', value: false },
                                ]}
                                disabled={isSubmittingEdit}
                              />
                              {!editWorkerForm.hasIqama && (
                                <div className="mt-1.5">
                                  <input
                                    type="text"
                                    placeholder="سبب عدم وجود الإقامة..."
                                    value={editWorkerForm.iqamaReason}
                                    onChange={(e) =>
                                      setEditWorkerForm({
                                        ...editWorkerForm,
                                        iqamaReason: e.target.value,
                                      })
                                    }
                                    disabled={isSubmittingEdit}
                                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-xs text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                  <PresetChips
                                    chips={['مع الكفيل', 'لم تصدر بعد', 'منتهية', 'مفقودة']}
                                    onSelect={(val) =>
                                      setEditWorkerForm((prev) => ({ ...prev, iqamaReason: val }))
                                    }
                                    disabled={isSubmittingEdit}
                                  />
                                </div>
                              )}
                            </div>

                            {/* 4. الجواز */}
                            <div>
                              <SmartAuditToggle
                                label="هل جواز السفر بحوزة العاملة؟"
                                value={editWorkerForm.hasPassport}
                                onChange={(val) =>
                                  setEditWorkerForm((prev) => ({
                                    ...prev,
                                    hasPassport: val,
                                    passportReason: val ? '' : prev.passportReason,
                                  }))
                                }
                                options={[
                                  { label: 'نعم', value: true },
                                  { label: 'لا', value: false },
                                ]}
                                disabled={isSubmittingEdit}
                              />
                              {!editWorkerForm.hasPassport && (
                                <div className="mt-1.5">
                                  <input
                                    type="text"
                                    placeholder="سبب عدم وجود الجواز..."
                                    value={editWorkerForm.passportReason}
                                    onChange={(e) =>
                                      setEditWorkerForm({
                                        ...editWorkerForm,
                                        passportReason: e.target.value,
                                      })
                                    }
                                    disabled={isSubmittingEdit}
                                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-xs text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                  <PresetChips
                                    chips={['مع الكفيل', 'مفقود', 'بالسفارة', 'منتهي']}
                                    onSelect={(val) =>
                                      setEditWorkerForm((prev) => ({ ...prev, passportReason: val }))
                                    }
                                    disabled={isSubmittingEdit}
                                  />
                                </div>
                              )}
                            </div>

                            {/* 5. الأغراض الشخصية */}
                            <div>
                              <SmartAuditToggle
                                label="هل لديها أغراض / حقائب شخصية؟"
                                value={editWorkerForm.hasPersonalItems}
                                onChange={(val) =>
                                  setEditWorkerForm((prev) => ({
                                    ...prev,
                                    hasPersonalItems: val,
                                    personalItemsDetails: val ? prev.personalItemsDetails : '',
                                  }))
                                }
                                options={[
                                  { label: 'نعم (يوجد)', value: true },
                                  { label: 'لا', value: false },
                                ]}
                                disabled={isSubmittingEdit}
                              />
                              {editWorkerForm.hasPersonalItems && (
                                <div className="mt-1.5">
                                  <input
                                    type="text"
                                    placeholder="تفاصيل الأمتعة والحقائب المستلمة..."
                                    value={editWorkerForm.personalItemsDetails}
                                    onChange={(e) =>
                                      setEditWorkerForm({
                                        ...editWorkerForm,
                                        personalItemsDetails: e.target.value,
                                      })
                                    }
                                    disabled={isSubmittingEdit}
                                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-xs text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                  <PresetChips
                                    chips={[
                                      'حقيبة ملابس كبيرة',
                                      'حقيبتين + أمتعة شخصية',
                                      'حقيبة يد فقط',
                                      'أمتعة متعددة',
                                    ]}
                                    onSelect={(val) =>
                                      setEditWorkerForm((prev) => ({
                                        ...prev,
                                        personalItemsDetails: val,
                                      }))
                                    }
                                    disabled={isSubmittingEdit}
                                  />
                                </div>
                              )}
                            </div>

                            {/* 6. الفحص الطبي للإقامة */}
                            <div>
                              <SmartAuditToggle
                                label="الفحص الطبي للإقامة"
                                value={editWorkerForm.medicalCheckDone}
                                onChange={(val) =>
                                  setEditWorkerForm((prev) => ({
                                    ...prev,
                                    medicalCheckDone: val,
                                  }))
                                }
                                options={[
                                  { label: 'تم الفحص', value: true },
                                  { label: 'لم يتم', value: false },
                                ]}
                                disabled={isSubmittingEdit}
                              />
                            </div>

                            {/* 7. نوع التأشيرة */}
                            <div>
                              <SmartAuditToggle
                                label="نوع التأشيرة"
                                value={editWorkerForm.visaType}
                                onChange={(val) =>
                                  setEditWorkerForm((prev) => ({
                                    ...prev,
                                    visaType: val,
                                  }))
                                }
                                options={[
                                  { label: 'مدفوعة', value: 'مدفوعة' },
                                  { label: 'تأهيل شامل', value: 'تأهيل شامل' },
                                ]}
                                disabled={isSubmittingEdit}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Step 2 Footer */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => setEditStep(1)}
                            disabled={isSubmittingEdit}
                            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl px-6 py-2.5 text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <span>السابق: بيانات التسكين</span>
                          </button>
                          <button
                            type="submit"
                            disabled={!selectedWorkerId || isSubmittingEdit}
                            className={`rounded-xl px-8 py-2.5 text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                              !selectedWorkerId || isSubmittingEdit
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                : 'bg-teal-800 hover:bg-teal-700 text-white shadow-teal-800/20 hover:shadow-md'
                            }`}
                          >
                            {isSubmittingEdit ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>جاري حفظ التعديل...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                <span>تأكيد وحفظ التعديلات</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </form>
                </div>
              </div>
            )}
            {/* Worker Departure Modal */}
            {modals.workerDeparture && (() => {
              const isExternalWorker = Boolean(
                selectedDepartureWorker?.externalHomedmaid || 
                selectedDepartureWorker?.isExternal
              );

              return (
                <div
                  className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 overflow-y-auto"
                  onClick={() => closeModal('workerDeparture')}
                  dir="rtl"
                >
                  <div
                    className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Modal Header */}
                    <div className="px-5 py-3 flex justify-between items-center shrink-0 text-white bg-teal-900" style={{ backgroundColor: '#0D5C63' }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                          <LogOut className="w-4 h-4 text-teal-200" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold">
                              {isExternalWorker ? 'تسجيل مغادرة عاملة خارجية من السكن' : 'تسجيل مغادرة من السكن'}
                            </h2>
                            {isExternalWorker && (
                              <span className="text-[10px] font-bold bg-yellow-400 text-teal-950 px-2 py-0.5 rounded-full shadow-2xs">
                                عاملة خارجية
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-teal-200">
                            العاملة: {selectedWorkerName} {selectedWorkerId ? `(#${selectedWorkerId})` : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => closeModal('workerDeparture')}
                        className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg text-lg leading-none transition-colors cursor-pointer"
                      >
                        &times;
                      </button>
                    </div>

                    {/* Modal Body & Form */}
                    <form onSubmit={handleDepartureSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">
                      {isExternalWorker ? (
                        /* ============================================================== */
                        /* 🏢 مسار مغادرة مخصصة للعاملة الخارجية (فقط مغادرة مع صورة وملاحظات إجبارية) */
                        /* ============================================================== */
                        <div className="space-y-3">
                          {/* بطاقة معلومات العاملة الخارجية */}
                          <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-2.5 px-3.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                {selectedDepartureWorker?.externalHomedmaid?.image ? (
                                  <img
                                    src={selectedDepartureWorker.externalHomedmaid.image}
                                    alt={selectedDepartureWorker.externalHomedmaid.name || ''}
                                    className="w-10 h-10 rounded-lg object-cover border border-teal-400 shadow-xs"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-teal-100 border border-teal-300 flex items-center justify-center text-teal-800">
                                    <User className="w-5 h-5" />
                                  </div>
                                )}
                                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-teal-700 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs">
                                  خ
                                </span>
                              </div>
                              <div className="space-y-0.5 text-right">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-gray-900 text-sm">
                                    {selectedDepartureWorker?.externalHomedmaid?.name || selectedWorkerName}
                                  </span>
                                  {selectedDepartureWorker?.externalHomedmaid?.nationality && (
                                    <span className="text-[11px] font-semibold bg-white text-gray-700 px-1.5 py-0.2 rounded border border-gray-200">
                                      {selectedDepartureWorker.externalHomedmaid.nationality}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-gray-600 flex-wrap">
                                  {selectedDepartureWorker?.externalHomedmaid?.passportNumber && (
                                    <span>جواز: <strong className="font-mono text-gray-800">{selectedDepartureWorker.externalHomedmaid.passportNumber}</strong></span>
                                  )}
                                  {selectedDepartureWorker?.externalHomedmaid?.Client?.fullname && (
                                    <span>العميل: <strong className="text-gray-800">{selectedDepartureWorker.externalHomedmaid.Client.fullname}</strong></span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right text-xs shrink-0">
                              <span className="font-bold text-teal-900 bg-teal-100/90 px-2 py-0.5 rounded-md border border-teal-300 text-[11px]">
                                {locations.find((loc) => loc.id === selectedDepartureWorker?.location_id)?.location || 'غير محدد'}
                              </span>
                            </div>
                          </div>

                          {/* الحقل 1: تاريخ المغادرة من السكن مع حسبة مدة الإقامة الديناميكية */}
                          {(() => {
                            const entryDateRaw = selectedDepartureWorker?.houseentrydate || (selectedDepartureWorker as any)?.housingDate || (selectedDepartureWorker as any)?.createdAt;
                            let stayDaysText = '';
                            let stayDaysCount: number | null = null;
                            let entryDateFormatted = '';

                            if (entryDateRaw) {
                              try {
                                const entry = new Date(entryDateRaw);
                                if (!isNaN(entry.getTime())) {
                                  const y = entry.getFullYear();
                                  const m = String(entry.getMonth() + 1).padStart(2, '0');
                                  const d = String(entry.getDate()).padStart(2, '0');
                                  entryDateFormatted = `${y}/${m}/${d}`;

                                  if (departureHousingDate) {
                                    const dep = new Date(departureHousingDate);
                                    if (!isNaN(dep.getTime())) {
                                      const entryStart = new Date(entry.getFullYear(), entry.getMonth(), entry.getDate()).getTime();
                                      const depStart = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate()).getTime();
                                      const diffCalendarDays = Math.round((depStart - entryStart) / (1000 * 60 * 60 * 24));
                                      
                                      if (diffCalendarDays < 0) {
                                        stayDaysText = 'تاريخ المغادرة يسبق تاريخ التسكين';
                                        stayDaysCount = -1;
                                      } else {
                                        // احتساب مدة البقاء شاملة أيام الإقامة (مطابق للجدول الرئيسي)
                                        const totalDays = diffCalendarDays + 1;
                                        stayDaysCount = totalDays;
                                        if (totalDays === 1) {
                                          stayDaysText = 'يوم واحد';
                                        } else if (totalDays === 2) {
                                          stayDaysText = 'يومان';
                                        } else if (totalDays >= 3 && totalDays <= 10) {
                                          stayDaysText = `${totalDays} أيام`;
                                        } else {
                                          stayDaysText = `${totalDays} يوم`;
                                        }
                                      }
                                    }
                                  }
                                }
                              } catch (e) {
                                console.error('Error calculating stay days:', e);
                              }
                            }

                            return (
                              <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-2.5 space-y-2">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-teal-700 shrink-0" />
                                    <label className="text-xs font-bold text-teal-950">
                                      تاريخ المغادرة من السكن <span className="text-red-500">*</span>
                                    </label>
                                  </div>
                                  <input
                                    type="date"
                                    dir="ltr"
                                    required
                                    max={new Date().toISOString().split('T')[0]}
                                    value={departureHousingDate}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const todayStr = new Date().toISOString().split('T')[0];
                                      if (val > todayStr) {
                                        showNotification('لا يمكن اختيار تاريخ في المستقبل لتسجيل المغادرة', 'error');
                                        return;
                                      }
                                      setDepartureHousingDate(val);
                                    }}
                                    className="bg-white border border-teal-300 rounded-lg px-2.5 py-1 text-xs text-gray-900 font-mono font-bold focus:ring-2 focus:ring-teal-600 outline-none w-full sm:w-auto text-center cursor-pointer"
                                    style={{ fontVariantNumeric: 'lining-nums' }}
                                  />
                                </div>

                                {/* شريط حسبة مدة البقاء في السكن */}
                                <div className="pt-2 border-t border-teal-200/60 flex items-center justify-between gap-2 flex-wrap text-xs">
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                    <Clock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                    <span>تاريخ التسكين: <strong className="font-mono text-gray-800">{entryDateFormatted || 'غير محدد'}</strong></span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-600">مدة البقاء بالسكن:</span>
                                    {stayDaysText ? (
                                      <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-md text-xs shadow-2xs ${
                                        stayDaysCount != null && stayDaysCount < 0 
                                          ? 'bg-red-100 text-red-800 border border-red-300' 
                                          : 'bg-teal-800 text-white'
                                      }`}>
                                        {stayDaysText}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 font-medium">—</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* الحقل 2: صورة المغادرة */}
                          <div className={`border rounded-xl p-3 transition-all ${
                            externalDeparturePhotoError 
                              ? 'border-red-400 bg-red-50/40' 
                              : externalDeparturePhoto 
                                ? 'border-emerald-300 bg-emerald-50/30' 
                                : 'border-dashed border-gray-300 bg-gray-50/60 hover:bg-gray-50'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <Camera className="w-4 h-4 text-teal-700" />
                                <label className="text-xs font-bold text-gray-900">
                                  صورة المغادرة / إثبات الخروج <span className="text-red-500">*</span>
                                </label>
                              </div>
                              {externalDeparturePhoto && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  <Check className="w-3 h-3" />
                                  تم الإرفاق
                                </span>
                              )}
                            </div>

                            {externalDeparturePhoto ? (
                              <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-gray-200">
                                <div className="relative group shrink-0">
                                  <img
                                    src={externalDeparturePhoto}
                                    alt="صورة المغادرة"
                                    className="w-16 h-16 rounded-lg object-cover border border-emerald-400 shadow-2xs"
                                  />
                                  <a
                                    href={externalDeparturePhoto}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center text-white text-[10px] font-bold transition-opacity"
                                  >
                                    تكبير
                                  </a>
                                </div>
                                <div className="space-y-1 text-right flex-1">
                                  <div className="text-xs font-bold text-emerald-900">تم رفع وحفظ صورة المغادرة</div>
                                  <div className="flex items-center gap-2 pt-0.5">
                                    <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded cursor-pointer transition-colors">
                                      <Upload className="w-3 h-3" />
                                      <span>استبدال</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        disabled={isUploadingExternalDeparturePhoto}
                                        onChange={handleExternalDeparturePhotoUpload}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setExternalDeparturePhoto('');
                                        setExternalDeparturePhotoError('صورة المغادرة مطلوبة بشكل إجباري');
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold rounded transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>حذف</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <label className="flex items-center justify-center gap-2.5 py-3 px-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50/20 transition-all group">
                                {isUploadingExternalDeparturePhoto ? (
                                  <div className="flex items-center gap-2 text-teal-800 py-1">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-700 border-t-transparent"></div>
                                    <span className="text-xs font-bold">جاري رفع الصورة...</span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                      <Upload className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-teal-950 group-hover:text-teal-800">
                                      انقر هنا لرفع أو التقاط صورة المغادرة (JPG, PNG)
                                    </span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={isUploadingExternalDeparturePhoto}
                                  onChange={handleExternalDeparturePhotoUpload}
                                />
                              </label>
                            )}

                            {externalDeparturePhotoError && (
                              <div className="flex items-center gap-1 text-[11px] text-red-600 font-bold mt-1.5">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{externalDeparturePhotoError}</span>
                              </div>
                            )}
                          </div>

                          {/* الحقل 3: ملاحظات المغادرة */}
                          <div className={`border rounded-xl p-3 transition-all ${
                            externalDepartureNotesError 
                              ? 'border-red-400 bg-red-50/40' 
                              : 'border-gray-200 bg-white'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <Edit3 className="w-3.5 h-3.5 text-teal-700" />
                                <label className="text-xs font-bold text-gray-900">
                                  ملاحظات وتفاصيل المغادرة <span className="text-red-500">*</span>
                                </label>
                              </div>
                              <span className="text-[10px] text-gray-400">يرجى توضيح كافة التفاصيل</span>
                            </div>
                            <textarea
                              rows={2}
                              required
                              placeholder="اكتب ملاحظات وتفاصيل المغادرة (السبب، من استلم العاملة، تسليم المقتنيات، إلخ)..."
                              value={externalDepartureNotes}
                              onChange={(e) => {
                                setExternalDepartureNotes(e.target.value);
                                if (e.target.value.trim()) {
                                  setExternalDepartureNotesError('');
                                }
                              }}
                              className={`w-full bg-gray-50/50 border rounded-lg p-2 text-right text-xs outline-none transition-all ${
                                externalDepartureNotesError 
                                  ? 'border-red-300 focus:ring-2 focus:ring-red-400 bg-white' 
                                  : 'border-gray-300 focus:ring-2 focus:ring-teal-600 focus:bg-white'
                              }`}
                            />
                            {externalDepartureNotesError && (
                              <div className="flex items-center gap-1 text-[11px] text-red-600 font-bold mt-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{externalDepartureNotesError}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* ============================================================== */
                        /* 🏢 مسارات المغادرة للعاملات الداخليات (الخيارات الأربعة) */
                        /* ============================================================== */
                        <>
                    {/* 3 Options Grid Selector */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">نوع ومسار المغادرة (اختر المسار المناسب):</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Option 1: Medical */}
                        <button
                          type="button"
                          onClick={() => setActiveDepartureType('medical')}
                          className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                            activeDepartureType === 'medical'
                              ? 'border-2 border-red-500 bg-red-50 text-red-900 shadow-sm'
                              : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              activeDepartureType === 'medical' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              <FaHeartbeat className="w-4 h-4" />
                            </div>
                            {activeDepartureType === 'medical' && (
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold">مغادرة مرضية</h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">مستشفى / تشخيص وتقارير</p>
                          </div>
                        </button>

                        {/* Option 2: Trial Transfer */}
                        <button
                          type="button"
                          onClick={() => setActiveDepartureType('trial_transfer')}
                          className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                            activeDepartureType === 'trial_transfer'
                              ? 'border-2 border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                              : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              activeDepartureType === 'trial_transfer' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              <FaExchangeAlt className="w-4 h-4" />
                            </div>
                            {activeDepartureType === 'trial_transfer' && (
                              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold">تجربة نقل خدمات</h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">فترة تجربة لكفيل جديد</p>
                          </div>
                        </button>

                        {/* Option 3: Deportation */}
                        <button
                          type="button"
                          onClick={() => setActiveDepartureType('deportation')}
                          className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                            activeDepartureType === 'deportation'
                              ? 'border-2 border-teal-600 bg-teal-50 text-teal-900 shadow-sm'
                              : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              activeDepartureType === 'deportation' ? 'bg-teal-700 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              <Plane className="w-4 h-4" />
                            </div>
                            {activeDepartureType === 'deportation' && (
                              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold">ترحيل العاملة</h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">مغادرة خارجية للبلاد</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Path 1: Medical Details */}
                    {activeDepartureType === 'medical' && (
                      <div className="border border-teal-200 bg-white rounded-xl p-4 space-y-3 shadow-sm">
                        <div className="flex items-center gap-2 text-teal-800 font-bold text-xs border-b border-gray-100 pb-2">
                          <FaHospital className="w-4 h-4 text-teal-700" />
                          <span>بيانات المغادرة المرضية والفحص الطبي</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              تاريخ المغادرة الفعلي من السكن <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="date"
                                required
                                max={new Date().toISOString().split('T')[0]}
                                value={departureHousingDate}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const todayStr = new Date().toISOString().split('T')[0];
                                  if (val > todayStr) {
                                    showNotification('لا يمكن اختيار تاريخ في المستقبل لتسجيل المغادرة', 'error');
                                    return;
                                  }
                                  setDepartureHousingDate(val);
                                  if (medicalDepartureForm.expectedStayDays && val) {
                                    const d = new Date(val);
                                    if (!isNaN(d.getTime())) {
                                      d.setDate(d.getDate() + (parseInt(medicalDepartureForm.expectedStayDays, 10) || 0));
                                      setMedicalDepartureForm((prev) => ({
                                        ...prev,
                                        expectedReturnDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
                                      }));
                                    }
                                  }
                                }}
                                onClick={(e) => {
                                  try {
                                    (e.target as HTMLInputElement).showPicker?.();
                                  } catch {}
                                }}
                                className="w-full h-10 bg-white border border-gray-300 rounded-lg px-3 text-center text-xs font-bold text-gray-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none cursor-pointer transition-all"
                                style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', fontVariantNumeric: 'lining-nums' }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              اسم المستشفى / المركز الطبي <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="أدخل اسم المستشفى أو المجمع الطبي"
                              value={medicalDepartureForm.hospitalName}
                              onChange={(e) => setMedicalDepartureForm({ ...medicalDepartureForm, hospitalName: e.target.value })}
                              className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-xs focus:ring-2 focus:ring-teal-600 outline-none"
                            />
                          </div>

                          {/* المدة المتوقعة للبقاء في المستشفى بالأيام */}
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              المدة المتوقعة لبقاء العاملة في المستشفى (بالأيام)
                            </label>
                            <div className="relative flex items-center bg-white border border-gray-300 rounded-lg h-9 overflow-hidden focus-within:ring-2 focus-within:ring-teal-600 focus-within:border-teal-600">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                dir="ltr"
                                placeholder="عدد الأيام..."
                                value={medicalDepartureForm.expectedStayDays}
                                onChange={(e) => {
                                  const raw = e.target.value
                                    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
                                    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
                                    .replace(/\D/g, '');
                                  let returnDate = '';
                                  const daysNum = parseInt(raw, 10);
                                  if (!isNaN(daysNum) && daysNum > 0 && departureHousingDate) {
                                    const d = new Date(departureHousingDate);
                                    if (!isNaN(d.getTime())) {
                                      d.setDate(d.getDate() + daysNum);
                                      returnDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                    }
                                  }
                                  setMedicalDepartureForm((prev) => ({
                                    ...prev,
                                    expectedStayDays: raw,
                                    expectedReturnDate: returnDate,
                                  }));
                                }}
                                className="flex-1 min-w-0 h-full bg-transparent border-none px-2 text-center text-xs font-bold text-gray-900 outline-none focus:ring-0"
                                style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', fontVariantNumeric: 'lining-nums' }}
                              />
                              {/* أزرار سريعة 1، 2، 3، 5، 7 */}
                              <div className="flex items-stretch h-full border-r border-gray-300 shrink-0 bg-gray-50/80" dir="ltr">
                                {['1', '2', '3', '5', '7'].map((dVal, idx) => {
                                  const isActive = medicalDepartureForm.expectedStayDays === dVal;
                                  return (
                                    <button
                                      key={dVal}
                                      type="button"
                                      onClick={() => {
                                        let returnDate = '';
                                        const daysNum = parseInt(dVal, 10);
                                        if (!isNaN(daysNum) && daysNum > 0 && departureHousingDate) {
                                          const d = new Date(departureHousingDate);
                                          if (!isNaN(d.getTime())) {
                                            d.setDate(d.getDate() + daysNum);
                                            returnDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                          }
                                        }
                                        setMedicalDepartureForm((prev) => ({
                                          ...prev,
                                          expectedStayDays: dVal,
                                          expectedReturnDate: returnDate,
                                        }));
                                      }}
                                      className={`h-full px-2 shrink-0 flex items-center justify-center text-center text-[11px] font-bold transition-all cursor-pointer select-none ${
                                        idx > 0 ? 'border-l border-gray-300' : ''
                                      } ${
                                        isActive
                                          ? 'bg-teal-700 text-white font-extrabold shadow-inner'
                                          : 'text-teal-800 hover:bg-teal-100/80 hover:text-teal-900'
                                      }`}
                                      style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', fontVariantNumeric: 'lining-nums' }}
                                      title={`تحديد ${dVal} ${dVal === '1' ? 'يوم' : 'أيام'}`}
                                    >
                                      <span>{dVal}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* تاريخ العودة المتوقع */}
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              تاريخ العودة المتوقع (تلقائي / مخصص)
                            </label>
                            <div className="relative">
                              <input
                                type="date"
                                value={medicalDepartureForm.expectedReturnDate}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMedicalDepartureForm((prev) => ({
                                    ...prev,
                                    expectedReturnDate: val,
                                  }));
                                }}
                                onClick={(e) => {
                                  try {
                                    (e.target as HTMLInputElement).showPicker?.();
                                  } catch {}
                                }}
                                className="w-full h-10 bg-white border border-gray-300 rounded-lg px-3 text-center text-xs font-bold text-gray-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none cursor-pointer transition-all"
                                style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', fontVariantNumeric: 'lining-nums' }}
                              />
                            </div>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              التشخيص الطبي / الحالة <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="مثال: آلام في الظهر، فحص دوري، كسر، إلخ"
                              value={medicalDepartureForm.diagnosis}
                              onChange={(e) => setMedicalDepartureForm({ ...medicalDepartureForm, diagnosis: e.target.value })}
                              className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-xs focus:ring-2 focus:ring-teal-600 outline-none"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              مرفق التقرير الطبي (اختياري)
                            </label>
                            <div className="flex items-center gap-3">
                              <input
                                type="file"
                                accept=".pdf,image/*"
                                onChange={handleMedicalDepartureReportUpload}
                                disabled={isUploadingMedicalDepartureFile}
                                className="w-full bg-white border border-gray-300 text-xs rounded-lg p-1.5 file:mr-0 file:ml-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-700 file:text-white hover:file:bg-teal-800 cursor-pointer disabled:opacity-50"
                              />
                              {isUploadingMedicalDepartureFile && (
                                <div className="flex items-center gap-1.5 text-xs text-teal-700 shrink-0 font-bold">
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-700 border-t-transparent"></div>
                                  <span>جاري الرفع...</span>
                                </div>
                              )}
                            </div>
                            {medicalDepartureForm.medicalReportFile && (
                              <div className="mt-2">
                                <a
                                  href={medicalDepartureForm.medicalReportFile}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-teal-800 hover:text-teal-900 font-semibold bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md"
                                >
                                  <Check className="w-3.5 h-3.5 text-teal-600" />
                                  <span>عرض التقرير الطبي المرفق</span>
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات إضافية</label>
                            <textarea
                              rows={2}
                              placeholder="أدخل أي تفاصيل أو توصيات طبية أخرى..."
                              value={medicalDepartureForm.notes}
                              onChange={(e) => setMedicalDepartureForm({ ...medicalDepartureForm, notes: e.target.value })}
                              className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-xs focus:ring-2 focus:ring-teal-600 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Path 2: Trial Transfer (5 Comprehensive Sections) */}
                    {activeDepartureType === 'trial_transfer' && (() => {
                      // بيانات الكفيل القديم والعاملة
                      const workerName = selectedDepartureWorker?.externalHomedmaid?.name || selectedDepartureWorker?.Order?.Name || selectedWorkerName || 'غير محدد';
                      const passportNumber = selectedDepartureWorker?.externalHomedmaid?.passportNumber || selectedDepartureWorker?.Order?.Passportnumber || 'غير متوفر';
                      const nationality = selectedDepartureWorker?.externalHomedmaid?.nationality || selectedDepartureWorker?.Order?.Nationalitycopy || (selectedDepartureWorker?.Order as any)?.office?.country || 'غير محدد';
                      const profession = (selectedDepartureWorker?.externalHomedmaid as any)?.profession || (selectedDepartureWorker?.Order as any)?.Profession || 'عاملة منزلية';
                      
                      let entryDateStr = 'غير محدد';
                      if (selectedDepartureWorker?.houseentrydate) {
                        try {
                          const ed = new Date(selectedDepartureWorker.houseentrydate);
                          if (!isNaN(ed.getTime())) {
                            entryDateStr = `${ed.getFullYear()}/${String(ed.getMonth() + 1).padStart(2, '0')}/${String(ed.getDate()).padStart(2, '0')}`;
                          }
                        } catch {}
                      }

                      // استخراج بيانات الوصول من الطلب (حيث arrivals مصفوفة)
                      const arrivalsRaw = selectedDepartureWorker?.Order?.NewOrder?.[0]?.arrivals || (selectedDepartureWorker?.Order as any)?.arrivals || (selectedDepartureWorker as any)?.arrivals;
                      const arrivalObj = Array.isArray(arrivalsRaw) ? arrivalsRaw[0] : arrivalsRaw;

                      // احتساب تاريخ الوصول وحالة الضمان (90 يوم)
                      const rawArrivalDate = 
                        arrivalObj?.KingdomentryDate ||
                        arrivalObj?.arrivalDate ||
                        (selectedDepartureWorker?.Order as any)?.ArrivalDate ||
                        (selectedDepartureWorker?.externalHomedmaid as any)?.arrivalDate ||
                        selectedDepartureWorker?.houseentrydate;

                      let arrivalDateFormatted = 'غير محدد';
                      let guaranteeStatus: {
                        hasDate: boolean;
                        isUnderWarranty: boolean;
                        daysRemaining: number;
                        daysPassed: number;
                        endDateStr: string;
                        endDateObj: Date | null;
                      } = {
                        hasDate: false,
                        isUnderWarranty: false,
                        daysRemaining: 0,
                        daysPassed: 0,
                        endDateStr: '',
                        endDateObj: null,
                      };

                      if (rawArrivalDate) {
                        try {
                          const arrD = new Date(rawArrivalDate);
                          if (!isNaN(arrD.getTime())) {
                            arrivalDateFormatted = `${arrD.getFullYear()}/${String(arrD.getMonth() + 1).padStart(2, '0')}/${String(arrD.getDate()).padStart(2, '0')}`;
                            
                            const guarEnd = new Date(arrD);
                            guarEnd.setDate(guarEnd.getDate() + 90);
                            guarEnd.setHours(0, 0, 0, 0);
                            
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const arrDayOnly = new Date(arrD);
                            arrDayOnly.setHours(0, 0, 0, 0);
                            
                            const passedDays = Math.floor((today.getTime() - arrDayOnly.getTime()) / (1000 * 60 * 60 * 24));
                            const remainingDays = 90 - passedDays;
                            
                            guaranteeStatus = {
                              hasDate: true,
                              isUnderWarranty: remainingDays >= 0,
                              daysRemaining: Math.max(0, remainingDays),
                              daysPassed: passedDays,
                              endDateStr: `${guarEnd.getFullYear()}/${String(guarEnd.getMonth() + 1).padStart(2, '0')}/${String(guarEnd.getDate()).padStart(2, '0')}`,
                              endDateObj: guarEnd,
                            };
                          }
                        } catch {}
                      }

                      const oldClientName = selectedDepartureWorker?.externalHomedmaid?.Client?.fullname || selectedDepartureWorker?.Order?.NewOrder?.[0]?.client?.fullname || selectedDepartureWorker?.Order?.NewOrder?.[0]?.ClientName || 'غير محدد';
                      const oldClientNationalId = selectedDepartureWorker?.externalHomedmaid?.Client?.nationalId || selectedDepartureWorker?.Order?.NewOrder?.[0]?.client?.nationalId || selectedDepartureWorker?.Order?.NewOrder?.[0]?.nationalId || 'غير متوفر';
                      const oldClientPhone = selectedDepartureWorker?.externalHomedmaid?.Client?.phonenumber || selectedDepartureWorker?.Order?.NewOrder?.[0]?.client?.phonenumber || selectedDepartureWorker?.Order?.NewOrder?.[0]?.PhoneNumber || selectedDepartureWorker?.Order?.NewOrder?.[0]?.clientphonenumber || 'غير متوفر';
                      const oldOfficeContractNumber = 
                        arrivalObj?.InternalmusanedContract ||
                        arrivalObj?.externalmusanedContract ||
                        arrivalObj?.musanedContract ||
                        (selectedDepartureWorker?.Order?.NewOrder?.[0] as any)?.officeMusanedContract ||
                        (selectedDepartureWorker?.Order?.NewOrder?.[0] as any)?.musanedContract ||
                        (selectedDepartureWorker?.Order as any)?.InternalmusanedContract ||
                        (selectedDepartureWorker?.Order as any)?.externalmusanedContract ||
                        (selectedDepartureWorker?.Order as any)?.musanedContract ||
                        (selectedDepartureWorker?.externalHomedmaid as any)?.contractNumber ||
                        (selectedDepartureWorker?.externalHomedmaid as any)?.musanadNumber ||
                        (selectedDepartureWorker?.externalHomedmaid as any)?.InternalmusanedContract ||
                        (selectedDepartureWorker?.Order?.NewOrder?.[0]?.id ? `#${selectedDepartureWorker.Order.NewOrder[0].id}` : ((selectedDepartureWorker as any)?.externalHomedmaidId || selectedDepartureWorker?.externalHomedmaid?.id ? `عاملة خارجية #${(selectedDepartureWorker as any)?.externalHomedmaidId || selectedDepartureWorker?.externalHomedmaid?.id}` : 'غير متوفر'));

                      const oldOrderNumber = selectedDepartureWorker?.Order?.NewOrder?.[0]?.id ? `#${selectedDepartureWorker.Order.NewOrder[0].id}` : ((selectedDepartureWorker as any)?.externalHomedmaidId || selectedDepartureWorker?.externalHomedmaid?.id ? `عاملة خارجية #${(selectedDepartureWorker as any)?.externalHomedmaidId || selectedDepartureWorker?.externalHomedmaid?.id}` : 'غير متوفر');

                      const currentTrialStartDate = departureHousingDate || trialTransferForm.trialStartDate || new Date().toISOString().split('T')[0];
                      const currentDays = parseInt(trialTransferForm.trialPeriodDays, 10) || 0;
                      
                      let calculatedEndDateFormatted = '';
                      let trialEndDateObj: Date | null = null;
                      if (currentTrialStartDate && currentDays > 0) {
                        const d = new Date(currentTrialStartDate);
                        if (!isNaN(d.getTime())) {
                          d.setDate(d.getDate() + currentDays);
                          d.setHours(0, 0, 0, 0);
                          trialEndDateObj = d;
                          calculatedEndDateFormatted = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
                        }
                      }

                      const isWarrantyExpiringDuringTrial = Boolean(
                        guaranteeStatus.hasDate &&
                        guaranteeStatus.isUnderWarranty &&
                        guaranteeStatus.endDateObj &&
                        trialEndDateObj &&
                        trialEndDateObj.getTime() >= guaranteeStatus.endDateObj.getTime()
                      );

                      let daysPastWarranty = 0;
                      if (isWarrantyExpiringDuringTrial && trialEndDateObj && guaranteeStatus.endDateObj) {
                        daysPastWarranty = Math.floor((trialEndDateObj.getTime() - guaranteeStatus.endDateObj.getTime()) / (1000 * 60 * 60 * 24));
                      }

                      const totalCostNum = parseFloat(trialTransferForm.totalCost) || 0;
                      const paidAmountNum = parseFloat(trialTransferForm.paidAmount) || 0;
                      const remainingAmountCalc = Math.max(0, totalCostNum - paidAmountNum);
                      const dailyCostNum = parseFloat(trialTransferForm.dailyCost) || 0;
                      const calculatedTotalTrialCost = dailyCostNum * currentDays;

                      return (
                        <div className="space-y-4">
                          {/* ------------------------------------------------------------- */}
                          {/* القسم 1 & 2: بيانات العاملة والكفيل القديم (Side by Side Cards) */}
                          {/* ------------------------------------------------------------- */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* بطاقة بيانات العاملة */}
                            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 space-y-2">
                              <div className="flex items-center gap-1.5 text-teal-800 font-bold text-xs border-b border-teal-200 pb-1.5">
                                <User className="w-3.5 h-3.5 text-teal-700" />
                                <span>القسم الأول: بيانات العاملة</span>
                              </div>
                              <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs">
                                <div>
                                  <span className="text-gray-500 block text-[10px]">اسم العاملة:</span>
                                  <strong className="text-gray-900 truncate block text-right">{workerName}</strong>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[10px]">رقم الجواز:</span>
                                  <strong className="text-gray-900 font-mono block text-right">
                                    <span dir="ltr">{passportNumber}</span>
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[10px]">الجنسية / المهنة:</span>
                                  <span className="text-gray-800 font-medium block truncate text-right">{nationality} - {profession}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[10px]">تاريخ التسكين:</span>
                                  <span className="text-teal-800 font-mono font-bold block text-right">
                                    <span dir="ltr">{entryDateStr}</span>
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[10px]">تاريخ الوصول:</span>
                                  <span className="text-gray-800 font-mono font-bold block text-right">
                                    <span dir="ltr">{arrivalDateFormatted}</span>
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[10px]">حالة الضمان (90 يوم):</span>
                                  <div className="flex justify-start mt-0.5">
                                    {guaranteeStatus.hasDate ? (
                                      guaranteeStatus.isUnderWarranty ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded shadow-xs" title={`ينتهي الضمان في: ${guaranteeStatus.endDateStr}`}>
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                          <span>تحت الضمان (متبقي {guaranteeStatus.daysRemaining} يوم)</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-100 border border-red-300 px-1.5 py-0.5 rounded shadow-xs" title={`انتهى الضمان في: ${guaranteeStatus.endDateStr}`}>
                                          <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                          <span>منتهي الضمان (منذ {guaranteeStatus.daysPassed - 90} يوم)</span>
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-gray-400 font-bold block text-[11px]">غير محدد</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* بطاقة بيانات الكفيل القديم */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                              <div className="flex items-center gap-1.5 text-blue-800 font-bold text-xs border-b border-blue-200 pb-1.5">
                                <Users className="w-3.5 h-3.5 text-blue-700" />
                                <span>القسم الثاني: بيانات الكفيل القديم (الحالي)</span>
                              </div>
                              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                                <div>
                                  <span className="text-gray-500 block text-[10px]">اسم الكفيل:</span>
                                  <strong className="text-gray-900 truncate block text-right">{oldClientName}</strong>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[10px]">الهوية الوطنية:</span>
                                  <strong className="text-gray-900 font-mono block text-right">
                                    <span dir="ltr">{oldClientNationalId}</span>
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[10px]">رقم الجوال:</span>
                                  <span className="text-gray-800 font-mono font-medium block text-right">
                                    <span dir="ltr">{oldClientPhone}</span>
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[10px]">رقم عقد إدارة المكاتب:</span>
                                  <span className="text-gray-900 font-mono font-bold block text-right">
                                    <span dir="ltr">{oldOfficeContractNumber}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ------------------------------------------------------------- */}
                          {/* القسم 3: بيانات الكفيل الجديد والمرفقات */}
                          {/* ------------------------------------------------------------- */}
                          <div className="border border-teal-200 bg-white rounded-xl p-4 space-y-3 shadow-sm">
                            <div className="flex items-center gap-2 text-teal-800 font-bold text-xs border-b border-gray-100 pb-2">
                              <UserCheck className="w-4 h-4 text-teal-700" />
                              <span>القسم الثالث: بيانات الكفيل الجديد والمرفقات</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {/* اسم الكفيل الجديد */}
                              <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                  اسم الكفيل الجديد <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="الاسم الرباعي للكفيل..."
                                  value={trialTransferForm.newSponsorName}
                                  onChange={(e) => setTrialTransferForm({ ...trialTransferForm, newSponsorName: e.target.value })}
                                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                                />
                              </div>

                              {/* رقم الهوية الوطنية */}
                              <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                  رقم الهوية الوطنية / الإقامة
                                </label>
                                <input
                                  type="text"
                                  dir="ltr"
                                  inputMode="numeric"
                                  maxLength={10}
                                  placeholder="1xxxxxxxxx"
                                  value={trialTransferForm.newSponsorId}
                                  onChange={(e) => {
                                    const val = e.target.value
                                      .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
                                      .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
                                      .replace(/\D/g, '');
                                    setTrialTransferForm({ ...trialTransferForm, newSponsorId: val });
                                  }}
                                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-center text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-600 outline-none"
                                  style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', fontVariantNumeric: 'lining-nums' }}
                                />
                              </div>

                              {/* رقم الجوال الرئيسي */}
                              <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                  رقم الجوال الأساسي <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="tel"
                                  dir="ltr"
                                  inputMode="numeric"
                                  maxLength={10}
                                  required
                                  placeholder="05xxxxxxxx"
                                  value={trialTransferForm.newSponsorPhone}
                                  onChange={(e) => {
                                    const val = e.target.value
                                      .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
                                      .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
                                      .replace(/\D/g, '')
                                      .slice(0, 10);
                                    setTrialTransferForm({ ...trialTransferForm, newSponsorPhone: val });
                                  }}
                                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-center text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-600 outline-none"
                                  style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', fontVariantNumeric: 'lining-nums' }}
                                />
                              </div>

                              {/* رقم جوال بديل */}
                              <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                  رقم جوال بديل / إضافي
                                </label>
                                <input
                                  type="tel"
                                  dir="ltr"
                                  inputMode="numeric"
                                  maxLength={10}
                                  placeholder="05xxxxxxxx (اختياري)"
                                  value={trialTransferForm.newSponsorAltPhone}
                                  onChange={(e) => {
                                    const val = e.target.value
                                      .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
                                      .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
                                      .replace(/\D/g, '')
                                      .slice(0, 10);
                                    setTrialTransferForm({ ...trialTransferForm, newSponsorAltPhone: val });
                                  }}
                                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-center text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-600 outline-none"
                                  style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', fontVariantNumeric: 'lining-nums' }}
                                />
                              </div>

                              {/* مدينة الإقامة */}
                              <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                  مدينة الإقامة / السكن
                                </label>
                                <Select
                                  options={[
                                    'الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 
                                    'الخبر', 'الجبيل', 'الخرج', 'القصيم', 'أبها', 'تبوك', 
                                    'جازان', 'حائل', 'نجران', 'الطائف', 'ينبع', 'الأحساء', 
                                    'الجوف', 'عرعر', 'الباحة', 'الدوادمي', 'وادي الدواسر', 
                                    'شرورة', 'بيشة', 'رفحاء', 'طريف', 'القريات', 'حفر الباطن'
                                  ].map((c) => ({ value: c, label: c }))}
                                  placeholder="اختر مدينة الإقامة..."
                                  menuPlacement="bottom"
                                  maxMenuHeight={180}
                                  value={
                                    trialTransferForm.newSponsorCity
                                      ? { value: trialTransferForm.newSponsorCity, label: trialTransferForm.newSponsorCity }
                                      : null
                                  }
                                  onChange={(selectedOption: any) =>
                                    setTrialTransferForm({
                                      ...trialTransferForm,
                                      newSponsorCity: selectedOption ? selectedOption.value : '',
                                    })
                                  }
                                  styles={{
                                    control: (base: any, state: any) => ({
                                      ...base,
                                      minHeight: '38px',
                                      height: '38px',
                                      backgroundColor: '#FFFFFF',
                                      borderColor: state.isFocused ? '#0D5C63' : '#D1D5DB',
                                      borderRadius: '0.5rem',
                                      boxShadow: state.isFocused ? '0 0 0 2px rgba(13, 92, 99, 0.2)' : 'none',
                                      '&:hover': {
                                        borderColor: '#0D5C63',
                                      },
                                      fontSize: '0.75rem',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                      direction: 'rtl',
                                    }),
                                    valueContainer: (base: any) => ({
                                      ...base,
                                      padding: '0 10px',
                                      height: '38px',
                                      display: 'flex',
                                      alignItems: 'center',
                                    }),
                                    singleValue: (base: any) => ({
                                      ...base,
                                      fontSize: '0.75rem',
                                      fontWeight: '700',
                                      color: '#111827',
                                      margin: 0,
                                      textAlign: 'right',
                                    }),
                                    placeholder: (base: any) => ({
                                      ...base,
                                      fontSize: '0.75rem',
                                      fontWeight: '700',
                                      color: '#9CA3AF',
                                      margin: 0,
                                      textAlign: 'right',
                                    }),
                                    indicatorsContainer: (base: any) => ({
                                      ...base,
                                      height: '38px',
                                    }),
                                    indicatorSeparator: () => ({
                                      display: 'none',
                                    }),
                                    dropdownIndicator: (base: any) => ({
                                      ...base,
                                      padding: '4px 8px',
                                      color: '#9CA3AF',
                                      '&:hover': {
                                        color: '#0D5C63',
                                      },
                                    }),
                                    menu: (base: any) => ({
                                      ...base,
                                      zIndex: 9999,
                                      borderRadius: '0.5rem',
                                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                                      border: '1px solid #E5E7EB',
                                      backgroundColor: '#FFFFFF',
                                      marginTop: '4px',
                                      direction: 'rtl',
                                      textAlign: 'right',
                                    }),
                                    menuList: (base: any) => ({
                                      ...base,
                                      maxHeight: '180px',
                                      padding: '4px',
                                    }),
                                    option: (base: any, state: any) => ({
                                      ...base,
                                      fontSize: '0.75rem',
                                      fontWeight: '700',
                                      padding: '6px 12px',
                                      borderRadius: '0.375rem',
                                      backgroundColor: state.isSelected ? '#0D5C63' : state.isFocused ? '#F0FDFA' : 'transparent',
                                      color: state.isSelected ? '#FFFFFF' : state.isFocused ? '#0D5C63' : '#1F2937',
                                      cursor: 'pointer',
                                      textAlign: 'right',
                                    }),
                                  }}
                                  isSearchable
                                  noOptionsMessage={() => 'لا توجد مدينة مطابقة'}
                                />
                              </div>

                              {/* تاريخ الميلاد */}
                              <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                  تاريخ الميلاد للكفيل
                                </label>
                                <div 
                                  className="w-full h-[38px] bg-white border border-gray-300 rounded-lg px-3 flex items-center justify-center gap-2 text-xs font-bold text-gray-900 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100 transition-all cursor-pointer relative select-none"
                                  style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', fontVariantNumeric: 'lining-nums' }}
                                  onClick={(e) => {
                                    const input = e.currentTarget.querySelector('input[type="date"]');
                                    if (input) {
                                      try { (input as any).showPicker?.(); } catch {}
                                    }
                                  }}
                                >
                                  <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0 pointer-events-none" />
                                  <span dir="ltr" className="tracking-wide pointer-events-none">
                                    {trialTransferForm.newSponsorDateOfBirth ? trialTransferForm.newSponsorDateOfBirth.replace(/-/g, '/') : 'YYYY/MM/DD'}
                                  </span>
                                  <input
                                    type="date"
                                    value={trialTransferForm.newSponsorDateOfBirth}
                                    onChange={(e) => setTrialTransferForm({ ...trialTransferForm, newSponsorDateOfBirth: e.target.value })}
                                    onClick={(e) => {
                                      try {
                                        (e.target as any).showPicker?.();
                                      } catch {}
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    style={{ zIndex: 10 }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* المرفقات: تعريف الراتب + العنوان الوطني */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                              {/* مرفق تعريف الراتب */}
                              <div className="space-y-1 flex flex-col">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                    <FileText className="w-3.5 h-3.5 text-teal-700" />
                                    <span>تعريف الراتب / الشهادة البنكية</span>
                                  </label>
                                  {trialTransferForm.salaryCertificateFile && (
                                    <span className="text-[10px] text-teal-700 font-bold bg-teal-100 px-1.5 py-0.5 rounded">تم الإرفاق</span>
                                  )}
                                </div>

                                <input
                                  type="file"
                                  id="trial-salary-cert-upload"
                                  accept=".pdf,image/*"
                                  disabled={isUploadingSalaryCert}
                                  onChange={handleSalaryCertUpload}
                                  className="hidden"
                                />

                                <label
                                  htmlFor="trial-salary-cert-upload"
                                  className={`min-h-[58px] bg-white border-2 border-dashed rounded-lg px-2.5 py-2 flex items-center justify-center text-center cursor-pointer transition-all ${
                                    trialTransferForm.salaryCertificateFile 
                                      ? 'border-teal-400 bg-teal-50/30 hover:bg-teal-50/60' 
                                      : 'border-teal-300 hover:border-teal-500 hover:bg-teal-50/40'
                                  } ${isUploadingSalaryCert ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                  {isUploadingSalaryCert ? (
                                    <div className="flex items-center gap-1.5 text-xs text-teal-700 font-bold">
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-700 border-t-transparent"></div>
                                      <span>جاري الرفع...</span>
                                    </div>
                                  ) : trialTransferForm.salaryCertificateFile ? (
                                    <div className="flex items-center justify-between w-full px-1 gap-1">
                                      <div className="flex items-center gap-1.5 text-teal-800 text-xs font-bold min-w-0">
                                        <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                                        <span 
                                          className="text-[11px] font-bold text-teal-900 truncate max-w-[120px] sm:max-w-[150px] inline-block" 
                                          dir="ltr"
                                          title={trialTransferForm.salaryCertificateFileName || trialTransferForm.salaryCertificateFile.split('/').pop() || 'الملف المرفق'}
                                        >
                                          {trialTransferForm.salaryCertificateFileName || trialTransferForm.salaryCertificateFile.split('/').pop() || 'الملف المرفق'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <a
                                          href={trialTransferForm.salaryCertificateFile}
                                          target="_blank"
                                          rel="noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="p-1 rounded text-teal-700 hover:text-teal-900 hover:bg-teal-100 transition-colors"
                                          title="معاينة الملف"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </a>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setDeleteFileConfirm({
                                              isOpen: true,
                                              fileUrl: trialTransferForm.salaryCertificateFile,
                                              fileName: trialTransferForm.salaryCertificateFileName || trialTransferForm.salaryCertificateFile.split('/').pop() || 'تعريف الراتب',
                                              onSuccessClear: () => setTrialTransferForm((prev) => ({ ...prev, salaryCertificateFile: '', salaryCertificateFileName: '' })),
                                              isDeleting: false,
                                            });
                                          }}
                                          className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                          title="حذف الملف"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-teal-800">
                                      <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 shrink-0">
                                        <UploadCloud className="w-4 h-4" />
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[11px] font-bold block text-teal-900 leading-tight">اضغط لرفع تعريف الراتب</span>
                                        <span className="text-[9px] text-gray-500 block leading-tight">PDF أو صورة المستند</span>
                                      </div>
                                    </div>
                                  )}
                                </label>
                              </div>

                              {/* مرفق العنوان الوطني */}
                              <div className="space-y-1 flex flex-col">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                    <HomeIcon className="w-3.5 h-3.5 text-teal-700" />
                                    <span>العنوان الوطني للكفيل</span>
                                  </label>
                                  {trialTransferForm.nationalAddressFile && (
                                    <span className="text-[10px] text-teal-700 font-bold bg-teal-100 px-1.5 py-0.5 rounded">تم الإرفاق</span>
                                  )}
                                </div>

                                <input
                                  type="file"
                                  id="trial-national-address-upload"
                                  accept=".pdf,image/*"
                                  disabled={isUploadingNationalAddr}
                                  onChange={handleNationalAddressUpload}
                                  className="hidden"
                                />

                                <label
                                  htmlFor="trial-national-address-upload"
                                  className={`min-h-[58px] bg-white border-2 border-dashed rounded-lg px-2.5 py-2 flex items-center justify-center text-center cursor-pointer transition-all ${
                                    trialTransferForm.nationalAddressFile 
                                      ? 'border-teal-400 bg-teal-50/30 hover:bg-teal-50/60' 
                                      : 'border-teal-300 hover:border-teal-500 hover:bg-teal-50/40'
                                  } ${isUploadingNationalAddr ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                  {isUploadingNationalAddr ? (
                                    <div className="flex items-center gap-1.5 text-xs text-teal-700 font-bold">
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-700 border-t-transparent"></div>
                                      <span>جاري الرفع...</span>
                                    </div>
                                  ) : trialTransferForm.nationalAddressFile ? (
                                    <div className="flex items-center justify-between w-full px-1 gap-1">
                                      <div className="flex items-center gap-1.5 text-teal-800 text-xs font-bold min-w-0">
                                        <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                                        <span 
                                          className="text-[11px] font-bold text-teal-900 truncate max-w-[120px] sm:max-w-[150px] inline-block" 
                                          dir="ltr"
                                          title={trialTransferForm.nationalAddressFileName || trialTransferForm.nationalAddressFile.split('/').pop() || 'الملف المرفق'}
                                        >
                                          {trialTransferForm.nationalAddressFileName || trialTransferForm.nationalAddressFile.split('/').pop() || 'الملف المرفق'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <a
                                          href={trialTransferForm.nationalAddressFile}
                                          target="_blank"
                                          rel="noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="p-1 rounded text-teal-700 hover:text-teal-900 hover:bg-teal-100 transition-colors"
                                          title="معاينة الملف"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </a>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setDeleteFileConfirm({
                                              isOpen: true,
                                              fileUrl: trialTransferForm.nationalAddressFile,
                                              fileName: trialTransferForm.nationalAddressFileName || trialTransferForm.nationalAddressFile.split('/').pop() || 'العنوان الوطني',
                                              onSuccessClear: () => setTrialTransferForm((prev) => ({ ...prev, nationalAddressFile: '', nationalAddressFileName: '' })),
                                              isDeleting: false,
                                            });
                                          }}
                                          className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                          title="حذف الملف"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-teal-800">
                                      <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 shrink-0">
                                        <UploadCloud className="w-4 h-4" />
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[11px] font-bold block text-teal-900 leading-tight">اضغط لرفع العنوان الوطني</span>
                                        <span className="text-[9px] text-gray-500 block leading-tight">PDF أو صورة العنوان</span>
                                      </div>
                                    </div>
                                  )}
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* ------------------------------------------------------------- */}
                          {/* القسم 4: تفاصيل فترة التجربة واحتساب المدة */}
                          {/* ------------------------------------------------------------- */}
                          <div className="border border-teal-200 bg-white rounded-xl p-4 space-y-3 shadow-sm">
                            <div className="flex items-center gap-2 text-teal-800 font-bold text-xs border-b border-gray-100 pb-2">
                              <Clock className="w-4 h-4 text-teal-700" />
                              <span>القسم الرابع: تفاصيل فترة التجربة واحتساب المدة</span>
                            </div>

                            {/* شريط المخطط الزمني الكامل بتصميم موحد تماماً مع أرقام إنجليزية */}
                            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
                              {/* عناوين الحقول الثلاثة */}
                              <div className="grid grid-cols-3 gap-3 text-center">
                                <label className="block text-xs font-bold text-gray-700">
                                  تاريخ بدء التجربة (مغادرة السكن) <span className="text-red-500">*</span>
                                </label>
                                <label className="block text-xs font-bold text-gray-700">
                                  مدة التجربة (بالأيام) <span className="text-red-500">*</span>
                                </label>
                                <label className="block text-xs font-bold text-gray-700">
                                  تاريخ انتهاء التجربة (تلقائي)
                                </label>
                              </div>

                              {/* صف الحقول الثلاثة والأسهم بمحاذاة أفقية متطابقة تماماً */}
                              <div className="flex items-center gap-2 md:gap-3">
                                {/* 1. تاريخ بدء التجربة (اليمين) */}
                                <div className="flex-1">
                                  <div 
                                    className="w-full h-10 bg-white border border-gray-300 rounded-lg px-3 flex items-center justify-center gap-2 text-xs font-bold text-gray-900 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100 transition-all cursor-pointer relative select-none"
                                    style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', fontVariantNumeric: 'lining-nums' }}
                                    onClick={(e) => {
                                      const input = e.currentTarget.querySelector('input[type="date"]');
                                      if (input) {
                                        try { (input as any).showPicker?.(); } catch {}
                                      }
                                    }}
                                  >
                                    <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0 pointer-events-none" />
                                    <span dir="ltr" className="tracking-wide pointer-events-none">
                                      {departureHousingDate ? departureHousingDate.replace(/-/g, '/') : 'YYYY/MM/DD'}
                                    </span>
                                    <input
                                      type="date"
                                      required
                                      max={new Date().toISOString().split('T')[0]}
                                      value={departureHousingDate}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const todayStr = new Date().toISOString().split('T')[0];
                                        if (val > todayStr) {
                                          showNotification('لا يمكن اختيار تاريخ في المستقبل لتسجيل المغادرة', 'error');
                                          return;
                                        }
                                        setDepartureHousingDate(val);
                                        const calcEnd = (sDate: string, days: string) => {
                                          if (!sDate || !days) return '';
                                          const d = new Date(sDate);
                                          if (isNaN(d.getTime())) return '';
                                          d.setDate(d.getDate() + (parseInt(days, 10) || 0));
                                          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                        };
                                        setTrialTransferForm((prev) => ({ 
                                          ...prev, 
                                          trialStartDate: val,
                                          trialEndDate: calcEnd(val, prev.trialPeriodDays),
                                        }));
                                      }}
                                      onClick={(e) => {
                                        try {
                                          (e.target as any).showPicker?.();
                                        } catch {}
                                      }}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                      style={{ zIndex: 10 }}
                                    />
                                  </div>
                                </div>

                                {/* سهم الربط الأول */}
                                <div className="text-gray-400 shrink-0 flex items-center justify-center">
                                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                                </div>

                                {/* 2. مدة التجربة بالأيام (الوسط) */}
                                <div className="flex-1 relative flex items-center bg-white border border-gray-300 rounded-lg h-10 overflow-hidden focus-within:ring-2 focus-within:ring-teal-600 focus-within:border-teal-600">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    lang="en-US"
                                    dir="ltr"
                                    required
                                    placeholder="0"
                                    value={trialTransferForm.trialPeriodDays}
                                    onChange={(e) => {
                                      const normalized = e.target.value
                                        .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
                                        .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
                                        .replace(/\D/g, '');
                                      const calcEnd = (sDate: string, days: string) => {
                                        if (!sDate || !days) return '';
                                        const d = new Date(sDate);
                                        if (isNaN(d.getTime())) return '';
                                        d.setDate(d.getDate() + (parseInt(days, 10) || 0));
                                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                      };
                                      setTrialTransferForm((prev) => ({
                                        ...prev,
                                        trialPeriodDays: normalized,
                                        trialEndDate: calcEnd(departureHousingDate || prev.trialStartDate, normalized),
                                      }));
                                    }}
                                    className="flex-1 min-w-0 h-full bg-transparent border-none px-2 text-center text-xs font-bold text-gray-900 outline-none focus:ring-0"
                                    style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', fontVariantNumeric: 'lining-nums' }}
                                  />

                                  {/* أزرار الخيارات السريعة 10 و 7 على الجهة اليسرى بتطابق وتماثل تام */}
                                  <div className="flex items-stretch h-full border-r border-gray-300 shrink-0 bg-gray-50/80" dir="ltr">
                                    {['10', '7'].map((daysVal, idx) => {
                                      const isActive = trialTransferForm.trialPeriodDays === daysVal;

                                      return (
                                        <button
                                          key={daysVal}
                                          type="button"
                                          onClick={() => {
                                            const calcEnd = (sDate: string, days: string) => {
                                              if (!sDate || !days) return '';
                                              const d = new Date(sDate);
                                              if (isNaN(d.getTime())) return '';
                                              d.setDate(d.getDate() + (parseInt(days, 10) || 0));
                                              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                            };
                                            setTrialTransferForm((prev) => ({
                                              ...prev,
                                              trialPeriodDays: daysVal,
                                              trialEndDate: calcEnd(departureHousingDate || prev.trialStartDate, daysVal),
                                            }));
                                          }}
                                          className={`h-full w-10 shrink-0 flex items-center justify-center text-center text-xs font-bold transition-all cursor-pointer select-none ${
                                            idx > 0 ? 'border-l border-gray-300' : ''
                                          } ${
                                            isActive
                                              ? 'bg-teal-700 text-white font-extrabold shadow-inner'
                                              : 'text-teal-800 hover:bg-teal-100/80 hover:text-teal-900'
                                          }`}
                                          style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', fontVariantNumeric: 'lining-nums' }}
                                          title={`تحديد ${daysVal} أيام`}
                                        >
                                          <span className="inline-block tracking-tight">{daysVal}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* سهم الربط الثاني */}
                                <div className="text-gray-400 shrink-0 flex items-center justify-center">
                                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                                </div>

                                {/* 3. تاريخ انتهاء التجربة (اليسار) */}
                                <div className="flex-1">
                                  <div 
                                    className="w-full h-10 bg-white border border-gray-300 rounded-lg px-3 flex items-center justify-center gap-2 text-xs font-bold text-gray-900"
                                    style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', fontVariantNumeric: 'lining-nums' }}
                                  >
                                    <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                    <span dir="ltr" className="tracking-wide">{calculatedEndDateFormatted || 'YYYY/MM/DD'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* تنبيه خروج العاملة من فترة الضمان أثناء التجربة */}
                            {isWarrantyExpiringDuringTrial && (
                              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5 text-amber-900 shadow-xs animate-fadeIn">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div className="space-y-1 text-xs text-right w-full">
                                  <div className="font-bold text-amber-950 flex items-center justify-between flex-wrap gap-1.5">
                                    <span className="flex items-center gap-1.5">
                                      <span>تنبيه خروج من فترة الضمان (90 يوم)</span>
                                    </span>
                                    <span className="bg-amber-200/90 text-amber-950 text-[10px] px-2 py-0.5 rounded font-bold">
                                      متبقي بالضمان حالياً: {guaranteeStatus.daysRemaining} يوم
                                    </span>
                                  </div>
                                  <p className="text-amber-900 leading-relaxed text-[11px]">
                                    {daysPastWarranty > 0 ? (
                                      <>
                                        ضمان العاملة ساري حالياً ولكنه <strong>سينتهي بتاريخ <span className="font-mono text-amber-950 underline decoration-amber-400 decoration-2 font-bold" dir="ltr">{guaranteeStatus.endDateStr}</span></strong>، أي قبل موعد انتهاء فترة التجربة بـ <strong>{daysPastWarranty} {daysPastWarranty === 1 ? 'يوم' : daysPastWarranty === 2 ? 'يومين' : daysPastWarranty <= 10 ? 'أيام' : 'يوماً'}</strong> (تاريخ نهاية التجربة المحدد: <span className="font-mono font-bold text-amber-950" dir="ltr">{calculatedEndDateFormatted}</span>).
                                      </>
                                    ) : (
                                      <>
                                        ضمان العاملة ساري حالياً <strong>وسينتهي بالتزامن مع تاريخ نهاية فترة التجربة</strong> في <span className="font-mono font-bold text-amber-950 underline decoration-amber-400 decoration-2" dir="ltr">{guaranteeStatus.endDateStr}</span>.
                                      </>
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* التكلفة اليومية وإجمالي فترة التجربة المحتسب تلقائياً */}
                            <div className="border border-gray-200 rounded-lg p-2.5 bg-gray-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                              <div className="space-y-0.5">
                                <label className="block text-xs font-bold text-gray-800">
                                  احتساب تكلفة فترة التجربة
                                </label>
                                <p className="text-[11px] text-gray-500">
                                  تحديد التكلفة اليومية واحتساب الإجمالي تلقائياً
                                </p>
                              </div>

                              {/* حقل التكلفة اليومية + حقل الإجمالي المحتسب تلقائياً */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full md:w-auto shrink-0">
                                {/* التكلفة اليومية */}
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-bold text-gray-700 text-right sm:text-center">
                                    التكلفة اليومية (ر.س/يوم)
                                  </label>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    dir="ltr"
                                    placeholder="0.00"
                                    value={trialTransferForm.dailyCost}
                                    onChange={(e) => {
                                      const normalized = e.target.value
                                        .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
                                        .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
                                        .replace(/[^0-9.]/g, '');
                                      setTrialTransferForm({ ...trialTransferForm, dailyCost: normalized });
                                    }}
                                    className="w-full sm:w-36 h-10 bg-white border border-gray-300 rounded-lg px-3 text-center text-xs font-bold text-gray-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none"
                                    style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', fontVariantNumeric: 'lining-nums' }}
                                  />
                                </div>

                                {/* إجمالي فترة التجربة تلقائي */}
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-bold text-gray-700 text-right sm:text-center">
                                    إجمالي التجربة (تلقائي)
                                  </label>
                                  <div 
                                    className="w-full sm:w-44 h-10 bg-white border border-gray-300 rounded-lg px-3 flex items-center justify-center gap-1.5 text-xs font-bold text-teal-900"
                                    style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', fontVariantNumeric: 'lining-nums' }}
                                  >
                                    <span dir="ltr" className="font-mono text-sm tracking-wide">
                                      {calculatedTotalTrialCost > 0 
                                        ? calculatedTotalTrialCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                                        : '0.00'}
                                    </span>
                                    <span className="text-xs font-bold text-teal-700">ر.س</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ------------------------------------------------------------- */}
                          {/* القسم 5: البيانات المالية والمرفقات */}
                          {/* ------------------------------------------------------------- */}
                          <div className="border border-teal-200 bg-white rounded-xl p-4 space-y-3.5 shadow-sm">
                            <div className="flex items-center gap-2 text-teal-800 font-bold text-xs border-b border-gray-100 pb-2">
                              <DollarSign className="w-4 h-4 text-teal-700" />
                              <span>القسم الخامس: البيانات المالية وسند الدفع</span>
                            </div>

                            {/* السطر الأول: الحقول المالية الثلاثة جنباً إلى جنب */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {/* 1. المبلغ المتفق عليه */}
                              <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-700">
                                  المبلغ المتفق عليه لنقل الكفالة (ر.س)
                                </label>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  dir="ltr"
                                  placeholder="0.00"
                                  value={trialTransferForm.totalCost}
                                  onChange={(e) => {
                                    const val = e.target.value
                                      .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
                                      .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
                                      .replace(/[^0-9.]/g, '');
                                    const tot = parseFloat(val) || 0;
                                    const currentPaid = parseFloat(trialTransferForm.paidAmount) || 0;

                                    let adjustedPaid = trialTransferForm.paidAmount;
                                    if (tot <= 0) {
                                      adjustedPaid = '';
                                    } else if (currentPaid > tot) {
                                      adjustedPaid = String(tot);
                                    }

                                    const finalPaid = parseFloat(adjustedPaid) || 0;
                                    setTrialTransferForm((prev) => ({
                                      ...prev,
                                      totalCost: val,
                                      paidAmount: adjustedPaid,
                                      remainingAmount: String(Math.max(0, tot - finalPaid)),
                                    }));
                                  }}
                                  className="w-full h-10 bg-white border border-gray-300 rounded-lg px-3 text-center text-xs font-bold text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', fontVariantNumeric: 'lining-nums' }}
                                />
                                {parseFloat(trialTransferForm.totalCost) > 0 && (
                                  <div className="text-[11px] text-teal-950 font-bold bg-teal-50 border border-teal-200 rounded-lg p-1.5 flex items-start gap-1.5 shadow-2xs">
                                    <span className="text-teal-700 shrink-0 text-xs">✍️</span>
                                    <span className="leading-tight text-right flex-1">{tafqeet(trialTransferForm.totalCost)}</span>
                                  </div>
                                )}
                              </div>

                              {/* 2. المبلغ المدفوع مع خيارات النسبة السريعة على الجهة الأخرى بفواصل عمودية */}
                              <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-700">
                                  المبلغ المدفوع (ر.س)
                                </label>
                                <div className="relative flex items-center bg-white border border-gray-300 rounded-lg h-10 overflow-hidden focus-within:ring-2 focus-within:ring-teal-600 focus-within:border-teal-600">
                                  {/* حقل إدخال المبلغ المدفوع */}
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    dir="ltr"
                                    placeholder="0.00"
                                    value={trialTransferForm.paidAmount}
                                    onChange={(e) => {
                                      const val = e.target.value
                                        .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
                                        .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
                                        .replace(/[^0-9.]/g, '');
                                      const tot = parseFloat(trialTransferForm.totalCost) || 0;
                                      let enteredPaid = parseFloat(val) || 0;
                                      let finalPaidStr = val;

                                      if (tot <= 0) {
                                        finalPaidStr = '';
                                        enteredPaid = 0;
                                      } else if (enteredPaid > tot) {
                                        finalPaidStr = String(tot);
                                        enteredPaid = tot;
                                      }

                                      setTrialTransferForm((prev) => ({
                                        ...prev,
                                        paidAmount: finalPaidStr,
                                        remainingAmount: String(Math.max(0, tot - enteredPaid)),
                                      }));
                                    }}
                                    className="flex-1 min-w-0 h-full bg-transparent border-none px-2 text-center text-xs font-bold text-teal-800 outline-none focus:ring-0"
                                    style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', fontVariantNumeric: 'lining-nums' }}
                                  />

                                  {/* أزرار النسب السريعة 25% و 50% بحجم ثابت وظاهر بدون أي اقتصاص */}
                                  <div className="flex items-stretch h-full border-r border-gray-300 shrink-0 bg-gray-50/80" dir="ltr">
                                    {[50, 25].map((pct, idx) => {
                                      const tot = parseFloat(trialTransferForm.totalCost) || 0;
                                      const targetVal = tot > 0 ? Math.round((tot * pct) / 100 * 100) / 100 : null;
                                      const currentVal = parseFloat(trialTransferForm.paidAmount);
                                      const isActive = targetVal !== null && currentVal === targetVal;

                                      return (
                                        <button
                                          key={pct}
                                          type="button"
                                          disabled={tot <= 0}
                                          onClick={() => {
                                            const totCost = parseFloat(trialTransferForm.totalCost) || 0;
                                            if (totCost <= 0) return;
                                            const calcPaid = Math.round((totCost * pct) / 100 * 100) / 100;
                                            const paidStr = calcPaid > 0 ? String(calcPaid) : '0';
                                            setTrialTransferForm((prev) => ({
                                              ...prev,
                                              paidAmount: paidStr,
                                              remainingAmount: String(Math.max(0, totCost - calcPaid)),
                                            }));
                                          }}
                                          className={`h-full w-11 shrink-0 flex items-center justify-center text-center text-xs font-bold transition-all select-none ${
                                            idx > 0 ? 'border-l border-gray-300' : ''
                                          } ${
                                            isActive
                                              ? 'bg-teal-700 text-white font-extrabold shadow-inner'
                                              : tot <= 0
                                                ? 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-60'
                                                : 'text-teal-800 hover:bg-teal-100/80 hover:text-teal-900 cursor-pointer'
                                          }`}
                                          style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', fontVariantNumeric: 'lining-nums' }}
                                          title={tot > 0 ? `احتساب ${pct}% (${((tot * pct) / 100).toLocaleString('en-US')} ر.س)` : 'يرجى تحديد المبلغ المتفق عليه أولاً'}
                                        >
                                          <span className="inline-block tracking-tight">%{pct}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                {parseFloat(trialTransferForm.paidAmount) > 0 && (
                                  <div className="text-[11px] text-teal-950 font-bold bg-teal-50 border border-teal-200 rounded-lg p-1.5 flex items-start gap-1.5 shadow-2xs">
                                    <span className="text-teal-700 shrink-0 text-xs">✍️</span>
                                    <span className="leading-tight text-right flex-1">{tafqeet(trialTransferForm.paidAmount)}</span>
                                  </div>
                                )}
                              </div>

                              {/* 3. المبلغ المتبقي (تلقائي) */}
                              <div className="space-y-1">
                                <label className="block text-xs font-bold text-gray-700">
                                  المبلغ المتبقي (تلقائي)
                                </label>
                                <div 
                                  className="w-full h-10 bg-white border border-gray-300 rounded-lg px-3 flex items-center justify-center gap-1.5 text-xs font-bold text-gray-900"
                                  style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', fontVariantNumeric: 'lining-nums' }}
                                >
                                  <span dir="ltr" className="font-mono text-sm tracking-wide">
                                    {remainingAmountCalc > 0 
                                      ? remainingAmountCalc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                                      : '0.00'}
                                  </span>
                                  <span className="text-xs font-bold text-teal-700">ر.س</span>
                                </div>
                                {remainingAmountCalc > 0 && (
                                  <div className="text-[11px] text-amber-950 font-bold bg-amber-50 border border-amber-200 rounded-lg p-1.5 flex items-start gap-1.5 shadow-2xs">
                                    <span className="text-amber-700 shrink-0 text-xs">✍️</span>
                                    <span className="leading-tight text-right flex-1">{tafqeet(remainingAmountCalc)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* السطر الثاني: إيصال السداد (عمود واحد) والملاحظات (عمودين) */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                              {/* مرفق إيصال الدفع - سحابة رفع أنيقة (عمود واحد) */}
                              <div className="sm:col-span-1 space-y-1 flex flex-col">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                    <span>إيصال السداد / الحوالة</span>
                                  </label>
                                  {trialTransferForm.paymentReceiptFile && (
                                    <span className="text-[10px] text-teal-700 font-bold bg-teal-100 px-1.5 py-0.5 rounded">تم الإرفاق</span>
                                  )}
                                </div>

                                <input
                                  type="file"
                                  id="trial-payment-receipt-upload"
                                  accept=".pdf,image/*"
                                  disabled={isUploadingPaymentReceipt}
                                  onChange={handlePaymentReceiptUpload}
                                  className="hidden"
                                />

                                <label
                                  htmlFor="trial-payment-receipt-upload"
                                  className={`flex-1 min-h-[58px] bg-white border-2 border-dashed rounded-lg px-2.5 py-2 flex items-center justify-center text-center cursor-pointer transition-all ${
                                    trialTransferForm.paymentReceiptFile 
                                      ? 'border-teal-400 bg-teal-50/30 hover:bg-teal-50/60' 
                                      : 'border-teal-300 hover:border-teal-500 hover:bg-teal-50/40'
                                  } ${isUploadingPaymentReceipt ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                  {isUploadingPaymentReceipt ? (
                                    <div className="flex items-center gap-1.5 text-xs text-teal-700 font-bold">
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-700 border-t-transparent"></div>
                                      <span>جاري الرفع...</span>
                                    </div>
                                  ) : trialTransferForm.paymentReceiptFile ? (
                                    <div className="flex items-center justify-between w-full px-1 gap-1">
                                      <div className="flex items-center gap-1.5 text-teal-800 text-xs font-bold min-w-0">
                                        <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                                        <span 
                                          className="text-[11px] font-bold text-teal-900 truncate max-w-[120px] sm:max-w-[150px] inline-block" 
                                          dir="ltr"
                                          title={trialTransferForm.paymentReceiptFileName || trialTransferForm.paymentReceiptFile.split('/').pop() || 'الملف المرفق'}
                                        >
                                          {trialTransferForm.paymentReceiptFileName || trialTransferForm.paymentReceiptFile.split('/').pop() || 'الملف المرفق'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <a
                                          href={trialTransferForm.paymentReceiptFile}
                                          target="_blank"
                                          rel="noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="p-1 rounded text-teal-700 hover:text-teal-900 hover:bg-teal-100 transition-colors"
                                          title="معاينة الملف"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </a>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setDeleteFileConfirm({
                                              isOpen: true,
                                              fileUrl: trialTransferForm.paymentReceiptFile,
                                              fileName: trialTransferForm.paymentReceiptFileName || trialTransferForm.paymentReceiptFile.split('/').pop() || 'إيصال السداد',
                                              onSuccessClear: () => setTrialTransferForm((prev) => ({ ...prev, paymentReceiptFile: '', paymentReceiptFileName: '' })),
                                              isDeleting: false,
                                            });
                                          }}
                                          className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                          title="حذف الملف"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-teal-800">
                                      <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 shrink-0">
                                        <UploadCloud className="w-4 h-4" />
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[11px] font-bold block text-teal-900 leading-tight">اضغط لرفع الإيصال</span>
                                        <span className="text-[9px] text-gray-500 block leading-tight">PDF أو صورة الحوالة</span>
                                      </div>
                                    </div>
                                  )}
                                </label>
                              </div>

                              {/* ملاحظات التجربة الإضافية - تأخذ عمودين (2/3) */}
                              <div className="sm:col-span-2 space-y-1 flex flex-col">
                                <label className="block text-xs font-bold text-gray-700">ملاحظات إضافية على الاتفاق والتجربة</label>
                                <textarea
                                  placeholder="أدخل أي بنود أو شروط خاصة متفق عليها بين الطرفين..."
                                  value={trialTransferForm.notes}
                                  onChange={(e) => setTrialTransferForm({ ...trialTransferForm, notes: e.target.value })}
                                  className="w-full flex-1 min-h-[58px] bg-white border border-gray-300 rounded-lg p-2 text-right text-xs focus:ring-2 focus:ring-teal-600 outline-none resize-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Path 3: Deportation (Exact External Departure Module) */}
                    {activeDepartureType === 'deportation' && (
                      <div className="border border-teal-200 bg-teal-50/20 rounded-xl p-5 space-y-5 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                          <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                            <Plane className="w-4 h-4 text-teal-700" />
                            <span>بيانات المغادرة الخارجية وترحيل العاملة</span>
                          </div>
                          <span className="text-[11px] bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded">
                            ربط فوري بالمغادرة الخارجية
                          </span>
                        </div>

                        {/* Top: AI Ticket Upload */}
                        <div className="bg-white border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-xl p-4 text-center transition-colors">
                          <input
                            type="file"
                            id="deportation-ticket-file"
                            accept=".pdf,image/jpeg,image/png,image/webp"
                            onChange={handleDeportationTicketUpload}
                            disabled={isUploadingTicket || isExtractingTicket}
                            className="hidden"
                          />
                          <label htmlFor="deportation-ticket-file" className="cursor-pointer block">
                            <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-2">
                              <Upload className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-teal-900 block">
                              {ticketFileName ? `الملف المحدد: ${ticketFileName}` : 'اضغط هنا لرفع تذكرة السفر (PDF أو صور)'}
                            </span>
                            <span className="text-xs text-gray-500 block mt-1">
                              يتم قراءة واستخراج بيانات الرحلة والمطار تلقائياً بواسطة الذكاء الاصطناعي (AI OCR)
                            </span>
                          </label>

                          {(isUploadingTicket || isExtractingTicket) && (
                            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-teal-700 font-semibold">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-700 border-t-transparent"></div>
                              <span>{isExtractingTicket ? 'جاري استخراج البيانات بالذكاء الاصطناعي...' : 'جاري رفع التذكرة...'}</span>
                            </div>
                          )}

                          {ticketUploadError && (
                            <p className="text-xs text-red-600 font-medium mt-2">{ticketUploadError}</p>
                          )}

                          {deportationForm.externalTicketFile && !isUploadingTicket && !isExtractingTicket && (
                            <div className="mt-3 flex items-center justify-center gap-2">
                              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                تم إرفاق التذكرة بنجاح
                              </span>
                              <a
                                href={deportationForm.externalTicketFile}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-teal-700 underline font-semibold"
                              >
                                معاينة الملف
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Fields Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Reason */}
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              سبب الترحيل <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                              <div className="relative w-1/3 shrink-0">
                                <select
                                  value={
                                    ['حالة مرضية', 'حمل', 'رفض عمل', 'عدم لياقة طبية', 'انتهاء العقد', 'هروب'].includes(deportationForm.externalReason)
                                      ? deportationForm.externalReason
                                      : 'other'
                                  }
                                  onChange={(e) => {
                                    if (e.target.value !== 'other') {
                                      setDeportationForm({ ...deportationForm, externalReason: e.target.value });
                                    } else {
                                      setDeportationForm({ ...deportationForm, externalReason: '' });
                                    }
                                  }}
                                  style={{ backgroundImage: 'none' }}
                                  className="w-full appearance-none bg-white border border-gray-300 rounded-lg py-2.5 pr-3 pl-8 text-right text-sm focus:ring-2 focus:ring-teal-600 outline-none cursor-pointer"
                                >
                                  <option value="حالة مرضية">حالة مرضية</option>
                                  <option value="حمل">حمل</option>
                                  <option value="رفض عمل">رفض عمل</option>
                                  <option value="عدم لياقة طبية">عدم لياقة طبية</option>
                                  <option value="انتهاء العقد">انتهاء العقد</option>
                                  <option value="هروب">هروب</option>
                                  <option value="other">أخرى (تحديد)</option>
                                </select>
                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                  <ChevronDown className="w-4 h-4" />
                                </div>
                              </div>
                              <input
                                type="text"
                                required
                                placeholder="سبب الترحيل بالتفصيل..."
                                value={deportationForm.externalReason}
                                onChange={(e) => setDeportationForm({ ...deportationForm, externalReason: e.target.value })}
                                className="flex-1 bg-white border border-gray-300 rounded-lg p-2.5 text-right text-sm focus:ring-2 focus:ring-teal-600 outline-none"
                              />
                            </div>
                          </div>

                          {/* Delivery Officer */}
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              مسؤول التوصيل للمطار <span className="text-red-500">*</span>
                            </label>
                            <Select
                              options={deliveryOfficers}
                              isLoading={loadingDeliveryOfficers}
                              placeholder="اختر مسؤول التوصيل..."
                              noOptionsMessage={() => 'لا يوجد موظفين'}
                              value={
                                deliveryOfficers.find((o) => o.value === deportationForm.deliveryOfficer) ||
                                (deportationForm.deliveryOfficer
                                  ? { value: deportationForm.deliveryOfficer, label: deportationForm.deliveryOfficer }
                                  : null)
                              }
                              onChange={(selectedOption: any) =>
                                setDeportationForm({
                                  ...deportationForm,
                                  deliveryOfficer: selectedOption ? selectedOption.value : '',
                                })
                              }
                              styles={getSelectCityStyles()}
                            />
                          </div>

                          {/* Saudi Departure City */}
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              مدينة المغادرة (المملكة) <span className="text-red-500">*</span>
                            </label>
                            <Select
                              options={saudiCities}
                              placeholder="اختر مدينة المغادرة..."
                              value={
                                saudiCities.find((c) => c.value === deportationForm.externaldeparatureCity) ||
                                (deportationForm.externaldeparatureCity
                                  ? { value: deportationForm.externaldeparatureCity, label: deportationForm.externaldeparatureCity }
                                  : null)
                              }
                              onChange={(selectedOption: any) =>
                                setDeportationForm({
                                  ...deportationForm,
                                  externaldeparatureCity: selectedOption ? selectedOption.value : '',
                                })
                              }
                              styles={getSelectCityStyles()}
                            />
                          </div>

                          {/* Foreign Arrival City Autocomplete */}
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              مدينة الوصول (الوجهة الخارجية) <span className="text-red-500">*</span>
                            </label>
                            <CityAutocomplete
                              value={deportationForm.externalArrivalCity}
                              onChange={(city) =>
                                setDeportationForm({ ...deportationForm, externalArrivalCity: city })
                              }
                              placeholder="اكتب اسم مدينة الوصول الخارجية..."
                            />
                          </div>

                          {/* Departure Date & Time (City Departure) */}
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              تاريخ ووقت المغادرة من المدينة (الإقلاع) <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="date"
                                required
                                value={deportationForm.externaldeparatureDate}
                                onChange={(e) => {
                                  setDeportationForm({ ...deportationForm, externaldeparatureDate: e.target.value });
                                  setDepartureHousingDate(e.target.value);
                                }}
                                className="bg-white border border-gray-300 rounded-lg p-2 text-right text-xs focus:ring-2 focus:ring-teal-600 outline-none font-medium"
                              />
                              <input
                                type="time"
                                value={deportationForm.externaldeparatureTime}
                                onChange={(e) => setDeportationForm({ ...deportationForm, externaldeparatureTime: e.target.value })}
                                className="bg-white border border-gray-300 rounded-lg p-2 text-right text-xs focus:ring-2 focus:ring-teal-600 outline-none"
                              />
                            </div>
                          </div>

                          {/* Arrival Date & Time */}
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">تاريخ ووقت الوصول</label>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="date"
                                value={deportationForm.externalArrivalCityDate}
                                onChange={(e) => setDeportationForm({ ...deportationForm, externalArrivalCityDate: e.target.value })}
                                className="bg-white border border-gray-300 rounded-lg p-2 text-right text-xs focus:ring-2 focus:ring-teal-600 outline-none"
                              />
                              <input
                                type="time"
                                value={deportationForm.externalArrivalCityTime}
                                onChange={(e) => setDeportationForm({ ...deportationForm, externalArrivalCityTime: e.target.value })}
                                className="bg-white border border-gray-300 rounded-lg p-2 text-right text-xs focus:ring-2 focus:ring-teal-600 outline-none"
                              />
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات الترحيل</label>
                            <textarea
                              rows={2}
                              placeholder="أدخل أي ملاحظات خاصة بالتوصيل أو الترحيل..."
                              value={deportationForm.notes}
                              onChange={(e) => setDeportationForm({ ...deportationForm, notes: e.target.value })}
                              className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-right text-sm focus:ring-2 focus:ring-teal-600 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}


                    </>
                  )}

                      {/* Modal Footer */}
                    <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => closeModal('workerDeparture')}
                        disabled={isSubmittingDeparture}
                        className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        إلغاء
                      </button>
                        <button
                          type="submit"
                          disabled={isSubmittingDeparture || isUploadingExternalDeparturePhoto}
                          style={{ backgroundColor: '#0D5C63' }}
                          className="text-white hover:bg-teal-700 rounded-xl px-5 py-2 text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingDeparture ? (
                            <>
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                              <span>جاري حفظ المغادرة...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>{isExternalWorker ? 'تأكيد تسجيل مغادرة العاملة الخارجية' : 'تأكيد تسجيل المغادرة'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              );
            })()}

{/* id         Int       @id @default(autoincrement())
  reason     String    @db.VarChar(191)
  date       DateTime?   
  result     String?   
  idnumber   Int      
  createdAt  DateTime? @default(now())
  updatedAt  DateTime? @updatedAt
  time       String?
  user       homemaid? @relation(fields: [idnumber], references: [id])  */}

            {/* Re-Housing Modal */}
            {modals.rehousingModal && rehousingWorker && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                onClick={() => closeModal('rehousingModal')}
              >
                <div
                  className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">اعادة تسكين</h2>
                      <p className="text-sm text-gray-500 mt-1">{rehousingWorker.Order?.Name || rehousingWorker.externalHomedmaid?.name}</p>
                    </div>
                    <button onClick={() => closeModal('rehousingModal')} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 text-sm">
                    <p className="font-semibold text-red-700 mb-2">بيانات التسكين السابق:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-red-600">
                      <div><span className="text-gray-500">تاريخ التسكين: </span>{rehousingWorker.houseentrydate ? new Date(rehousingWorker.houseentrydate).toLocaleDateString('ar-SA') : 'غير محدد'}</div>
                      <div><span className="text-gray-500">سبب التسكين: </span>{rehousingWorker.Reason || 'غير محدد'}</div>
                      <div><span className="text-gray-500">تاريخ المغادرة: </span>{rehousingWorker.deparatureHousingDate ? new Date(rehousingWorker.deparatureHousingDate).toLocaleDateString('ar-SA') : 'غير محدد'}</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ اعادة التسكين <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={rehousingForm.houseentrydate}
                        onChange={(e) => setRehousingForm({ ...rehousingForm, houseentrydate: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-right text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">سبب اعادة التسكين</label>
                      <input
                        type="text"
                        value={rehousingForm.Reason}
                        onChange={(e) => setRehousingForm({ ...rehousingForm, Reason: e.target.value })}
                        placeholder="مثال: نقل كفالة، عودة طوعية..."
                        className="w-full p-2 border border-gray-300 rounded-lg text-right text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400 outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-3 mt-2">
                      <button onClick={() => closeModal('rehousingModal')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-5 rounded-lg text-sm transition-colors">الغاء</button>
                      <button
                        onClick={submitRehousing}
                        disabled={!rehousingForm.houseentrydate}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-2 px-5 rounded-lg text-sm font-medium transition-colors"
                      >
                        تأكيد اعادة التسكين
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* session modal */}
            {modals.sessionModal && (<div>
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                onClick={() => closeModal('sessionModal')}
              >
                <div
                  className="bg-gray-200 rounded-lg p-6 w-full max-w-lg shadow-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-xl font-bold text-textDark">جلسة</h2>
                  <form onSubmit={handleSessionSubmit} className="space-y-4">
                    <div className="mb-4">
                      <label className="block text-md mb-2 text-textDark">سبب الجلسة</label>
                      <input
                        type="text"
                        value={sessionForm.reason}
                        onChange={(e) => setSessionForm({ ...sessionForm, reason: e.target.value })}
                        className="w-full p-2 border border-border rounded-md text-right text-md text-textDark bg-gray-100"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-md mb-2 text-textDark">تاريخ الجلسة</label>
                      <input
                        type="date"
                        value={sessionForm.date}
                        onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                        className="w-full p-2 border border-border rounded-md text-right text-md text-textDark bg-gray-100"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-md mb-2 text-textDark">وقت الجلسة</label>
                      <input
                        type="time"
                        value={sessionForm.time}
                        onChange={(e) => setSessionForm({ ...sessionForm, time: e.target.value })}
                        className="w-full p-2 border border-border rounded-md text-right text-md text-textDark bg-gray-100"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-md mb-2 text-textDark">المحضر</label>
                      <textarea
                        value={sessionForm.result}
                        onChange={(e) => setSessionForm({ ...sessionForm, result: e.target.value })}
                        className="w-full p-2 border border-border rounded-md text-right text-md text-textDark bg-gray-100"
                      />
                    </div>
                    <div className="flex justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => closeModal('sessionModal')}
                        className="bg-gray-500 text-white py-2 px-4 rounded-md text-md"
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
                  <form className="space-y-6" onSubmit={handleEntitlementsSubmit}>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-md text-gray-600 mb-2">المبلغ المستحق</label>
                        <input
                          type="number"
                          value={entitlementsCost.toString()}
                          onChange={(e) => setEntitlementsCost(e.target.value === '' ? 0 : e.target.value)}
                          disabled={!selectedWorker && !selectedWorkerId}
                          className="w-full bg-gray-100 border border-gray-300 rounded-md p-3 text-right text-base disabled:bg-gray-200 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-md text-gray-600 mb-2">تفاصيل</label>
                        <input
                          type="text"
                          placeholder="سبب المبلغ المستحق"
                          className="w-full bg-gray-100 border border-gray-300 rounded-md p-3 text-right text-base disabled:bg-gray-200 disabled:cursor-not-allowed"
                          value={entitlementReason}
                          onChange={(e) => setEntitlementReason(e.target.value)}
                          disabled={!selectedWorker && !selectedWorkerId}
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
            {/* Audit Details Modal - محضر الاستلام والمقتنيات والأسئلة الـ 7 */}
            {modals.auditDetailsModal && selectedAuditWorker && (() => {
              const worker = selectedAuditWorker;
              const workerName = worker.Order?.Name || worker.externalHomedmaid?.name || 'العاملة';
              const workerPassport = worker.Order?.Passportnumber || worker.externalHomedmaid?.passportNumber || '';
              const workerNationality = worker.Order?.Nationalitycopy || worker.externalHomedmaid?.nationality || '';

              const isSalaryKnown = worker.salaryReceived !== null && worker.salaryReceived !== undefined && (worker.salaryReceived as any) !== 'unknown';
              const isSalaryOk = isSalaryKnown && (worker.salaryReceived === true || (!worker.isHasEntitlements && (!worker.salaryRemainingAmount || Number(worker.salaryRemainingAmount) === 0)));
              const salaryAmount = worker.salaryRemainingAmount || worker.entitlementsCost || null;

              const isPhoneKnown = worker.hasPhone !== null && worker.hasPhone !== undefined && (worker.hasPhone as any) !== 'unknown';
              const hasPhone = worker.hasPhone === true;

              const isIqamaKnown = worker.hasIqama !== null && worker.hasIqama !== undefined && (worker.hasIqama as any) !== 'unknown';
              const hasIqama = worker.hasIqama === true;

              const isPassportKnown = worker.hasPassport !== null && worker.hasPassport !== undefined && (worker.hasPassport as any) !== 'unknown';
              const hasPassport = worker.hasPassport === true;

              const isPersonalItemsKnown = worker.hasPersonalItems !== null && worker.hasPersonalItems !== undefined && (worker.hasPersonalItems as any) !== 'unknown';
              const hasPersonalItems = worker.hasPersonalItems === true;

              const isMedicalKnown = worker.medicalCheckDone !== null && worker.medicalCheckDone !== undefined && (worker.medicalCheckDone as any) !== 'unknown';
              const medicalCheckDone = worker.medicalCheckDone === true;

              const isVisaKnown = Boolean(worker.visaType && worker.visaType !== 'غير معروف' && (worker.visaType as any) !== 'unknown');
              const visaType = worker.visaType || 'غير معروف';

              return (
                <div
                  className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-in fade-in duration-200"
                  onClick={() => closeModal('auditDetailsModal')}
                >
                  <div
                    className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                  >
                    {/* Modal Header */}
                    <div className="bg-gradient-to-l from-teal-900 via-teal-800 to-teal-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                          <ClipboardCheck className="w-5 h-5 text-teal-200" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold flex items-center gap-2">
                            <span>محضر استلام ومقتنيات العاملة وحالتها</span>
                            <span className="text-xs bg-teal-700 text-teal-100 px-2.5 py-0.5 rounded-md font-mono">
                              #{worker.id}
                            </span>
                          </h2>
                          <p className="text-xs text-teal-200/90 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white">{workerName}</span>
                            {workerPassport && <span>| جواز: {workerPassport}</span>}
                            {workerNationality && <span>| الجنسية: {workerNationality}</span>}
                            {worker.houseentrydate && <span>| تاريخ التسكين: {getDate(worker.houseentrydate)}</span>}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => closeModal('auditDetailsModal')}
                        className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors text-2xl leading-none"
                        title="إغلاق"
                      >
                        &times;
                      </button>
                    </div>

                    {/* Modal Body: The 7 Questions Cards */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50/50">
                      
                      {/* 1. الرواتب والمستحقات */}
                      <div className={`p-4 rounded-xl border text-right transition-all ${
                        !isSalaryKnown
                          ? 'bg-gray-50 border-gray-200'
                          : isSalaryOk
                            ? 'bg-white border-gray-200 shadow-2xs'
                            : 'bg-rose-50/70 border-rose-200 shadow-xs'
                      }`}>
                        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              !isSalaryKnown ? 'bg-gray-200 text-gray-700' : isSalaryOk ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">1. استلام الرواتب كاملة من الكفيل</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                            !isSalaryKnown
                              ? 'bg-gray-100 text-gray-700 border-gray-300'
                              : isSalaryOk
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {!isSalaryKnown ? (
                              <span>غير معروف</span>
                            ) : isSalaryOk ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>نعم (مستلمة بالكامل)</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>لا (يوجد متبقي مستحقات)</span>
                              </>
                            )}
                          </span>
                        </div>
                        {isSalaryKnown && !isSalaryOk && (
                          <div className="mt-2.5 pt-2.5 border-t border-rose-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="bg-white p-2.5 rounded-lg border border-rose-200">
                              <span className="text-gray-500 block mb-0.5">المبلغ المتبقي / المستحق:</span>
                              <span className="font-bold text-rose-700 text-sm">{salaryAmount ? `${salaryAmount} ر.س` : 'غير محدد'}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-rose-200">
                              <span className="text-gray-500 block mb-0.5">تفاصيل وملاحظات المستحقات:</span>
                              <span className="font-medium text-gray-800">{worker.entitlementReason || 'لا توجد تفاصيل إضافية'}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2. الجوال */}
                      <div className={`p-4 rounded-xl border text-right transition-all ${
                        !isPhoneKnown
                          ? 'bg-gray-50 border-gray-200'
                          : hasPhone
                            ? 'bg-white border-gray-200 shadow-2xs'
                            : 'bg-rose-50/70 border-rose-200 shadow-xs'
                      }`}>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              !isPhoneKnown ? 'bg-gray-200 text-gray-700' : hasPhone ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              <Smartphone className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">2. وجود الجوال بحوزة العاملة</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                            !isPhoneKnown
                              ? 'bg-gray-100 text-gray-700 border-gray-300'
                              : hasPhone
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {!isPhoneKnown ? (
                              <span>غير معروف</span>
                            ) : hasPhone ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>نعم (بحوزتها)</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>لا (ليس بحوزتها)</span>
                              </>
                            )}
                          </span>
                        </div>
                        {isPhoneKnown && !hasPhone && worker.phoneReason && (
                          <div className="mt-2.5 pt-2 border-t border-rose-200/80 text-xs bg-white p-2.5 rounded-lg border border-rose-200">
                            <span className="text-gray-500 block mb-0.5">السبب:</span>
                            <span className="font-medium text-rose-900">{worker.phoneReason}</span>
                          </div>
                        )}
                      </div>

                      {/* 3. الإقامة */}
                      <div className={`p-4 rounded-xl border text-right transition-all ${
                        !isIqamaKnown
                          ? 'bg-gray-50 border-gray-200'
                          : hasIqama
                            ? 'bg-white border-gray-200 shadow-2xs'
                            : 'bg-rose-50/70 border-rose-200 shadow-xs'
                      }`}>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              !isIqamaKnown ? 'bg-gray-200 text-gray-700' : hasIqama ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              <FaIdCard className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">3. الإقامة بحوزة العاملة</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                            !isIqamaKnown
                              ? 'bg-gray-100 text-gray-700 border-gray-300'
                              : hasIqama
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {!isIqamaKnown ? (
                              <span>غير معروف</span>
                            ) : hasIqama ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>نعم (بحوزتها)</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>لا (ليست بحوزتها)</span>
                              </>
                            )}
                          </span>
                        </div>
                        {isIqamaKnown && !hasIqama && worker.iqamaReason && (
                          <div className="mt-2.5 pt-2 border-t border-rose-200/80 text-xs bg-white p-2.5 rounded-lg border border-rose-200">
                            <span className="text-gray-500 block mb-0.5">السبب:</span>
                            <span className="font-medium text-rose-900">{worker.iqamaReason}</span>
                          </div>
                        )}
                      </div>

                      {/* 4. جواز السفر */}
                      <div className={`p-4 rounded-xl border text-right transition-all ${
                        !isPassportKnown
                          ? 'bg-gray-50 border-gray-200'
                          : hasPassport
                            ? 'bg-white border-gray-200 shadow-2xs'
                            : 'bg-rose-50/70 border-rose-200 shadow-xs'
                      }`}>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              !isPassportKnown ? 'bg-gray-200 text-gray-700' : hasPassport ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              <FaPassport className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">4. جواز السفر بحوزة العاملة</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                            !isPassportKnown
                              ? 'bg-gray-100 text-gray-700 border-gray-300'
                              : hasPassport
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {!isPassportKnown ? (
                              <span>غير معروف</span>
                            ) : hasPassport ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>نعم (بحوزتها)</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>لا (ليس بحوزتها)</span>
                              </>
                            )}
                          </span>
                        </div>
                        {isPassportKnown && !hasPassport && worker.passportReason && (
                          <div className="mt-2.5 pt-2 border-t border-rose-200/80 text-xs bg-white p-2.5 rounded-lg border border-rose-200">
                            <span className="text-gray-500 block mb-0.5">السبب:</span>
                            <span className="font-medium text-rose-900">{worker.passportReason}</span>
                          </div>
                        )}
                      </div>

                      {/* 5. الأمتعة والمقتنيات الشخصية */}
                      <div className="p-4 rounded-xl border border-gray-200 bg-white text-right shadow-2xs transition-all">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              !isPersonalItemsKnown ? 'bg-gray-200 text-gray-700' : hasPersonalItems ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <Package className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">5. أغراض وحقائب شخصية</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                            !isPersonalItemsKnown
                              ? 'bg-gray-100 text-gray-700 border-gray-300'
                              : hasPersonalItems
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-gray-100 text-gray-600 border-gray-300'
                          }`}>
                            {!isPersonalItemsKnown ? (
                              <span>غير معروف</span>
                            ) : hasPersonalItems ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>نعم (يوجد أمتعة)</span>
                              </>
                            ) : (
                              <span>لا توجد أمتعة</span>
                            )}
                          </span>
                        </div>
                        {isPersonalItemsKnown && hasPersonalItems && worker.personalItemsDetails && (
                          <div className="mt-2.5 pt-2 border-t border-gray-100 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                            <span className="text-gray-500 block mb-0.5">تفاصيل الأمتعة:</span>
                            <span className="font-medium text-gray-800">{worker.personalItemsDetails}</span>
                          </div>
                        )}
                      </div>

                      {/* 6. الفحص الطبي للإقامة */}
                      <div className="p-4 rounded-xl border border-gray-200 bg-white text-right shadow-2xs transition-all">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              !isMedicalKnown ? 'bg-gray-200 text-gray-700' : medicalCheckDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              <Activity className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">6. الفحص الطبي للإقامة</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                            !isMedicalKnown
                              ? 'bg-gray-100 text-gray-700 border-gray-300'
                              : medicalCheckDone
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}>
                            {!isMedicalKnown ? (
                              <span>غير معروف</span>
                            ) : medicalCheckDone ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>تم الفحص</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>لم يتم الفحص بعد</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* 7. نوع التأشيرة */}
                      <div className="p-4 rounded-xl border border-gray-200 bg-white text-right shadow-2xs transition-all">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              !isVisaKnown ? 'bg-gray-200 text-gray-700' : 'bg-teal-100 text-teal-800'
                            }`}>
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">7. نوع التأشيرة المسجلة</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${
                            !isVisaKnown
                              ? 'bg-gray-100 text-gray-700 border-gray-300'
                              : visaType === 'تأهيل شامل'
                                ? 'bg-purple-50 text-purple-700 border-purple-300'
                                : 'bg-teal-50 text-teal-700 border-teal-300'
                          }`}>
                            <span>{visaType}</span>
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center gap-3">
                      <button
                        type="button"
                        onClick={() => closeModal('auditDetailsModal')}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      >
                        إغلاق
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          closeModal('auditDetailsModal');
                          handleEditWorker(worker.id, workerName);
                        }}
                        className="bg-teal-800 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-xs"
                      >
                        <Settings className="w-4 h-4" />
                        <span>تعديل المحضر والبيانات</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
            {/* Internal / External Worker Modal - Redesigned Single Step */}
            {modals.internalWorkerModal && (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-3 sm:p-4 overflow-y-auto"
                onClick={() => closeModal('internalWorkerModal')}
                dir="rtl"
              >
                <div
                  className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="bg-gradient-to-l from-teal-900 via-teal-800 to-teal-900 bg-teal-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-800 flex items-center justify-center border border-teal-700">
                        <Globe className="w-5 h-5 text-teal-200" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          <span>تسكين عاملة خارجية</span>
                          <span className="text-xs bg-white text-teal-900 font-extrabold px-3 py-0.5 rounded-full shadow-sm">
                            حالة طارئة / استضافة مؤقتة
                          </span>
                        </h2>
                        <p className="text-xs text-teal-200 mt-0.5">
                          {externalHousingStep === 1
                            ? 'الخطوة 1: تسجيل بيانات العاملة، السكن، والمدة المتوقعة'
                            : 'الخطوة 2: محضر استلام ومقتنيات العاملة وحالتها عند التسكين'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => closeModal('internalWorkerModal')}
                      className="text-teal-200 hover:text-white hover:bg-teal-800 p-2 rounded-xl transition-colors"
                      title="إغلاق"
                    >
                      <span className="text-2xl leading-none">&times;</span>
                    </button>
                  </div>

                  {/* Step Indicator Header */}
                  <div className="bg-teal-900/5 border-b border-gray-200 px-5 sm:px-6 py-2.5 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setExternalHousingStep(1)}
                      className={`flex-1 flex items-center gap-2.5 p-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-right cursor-pointer ${
                        externalHousingStep === 1
                          ? 'bg-teal-800 text-white shadow-xs'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                        externalHousingStep === 1 ? 'bg-white text-teal-800 font-bold' : 'bg-teal-100 text-teal-800'
                      }`}>
                        1
                      </span>
                      <div className="truncate">
                        <div className="leading-tight">الخطوة الأولى</div>
                        <div className={`text-[10px] font-normal ${externalHousingStep === 1 ? 'text-teal-100' : 'text-gray-500'}`}>
                          بيانات العاملة والتسكين
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (validateExternalHousingStep1()) {
                          setExternalHousingStep(2);
                        }
                      }}
                      className={`flex-1 flex items-center gap-2.5 p-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-right cursor-pointer ${
                        externalHousingStep === 2
                          ? 'bg-teal-800 text-white shadow-xs'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                        externalHousingStep === 2 ? 'bg-white text-teal-800 font-bold' : 'bg-gray-200 text-gray-700'
                      }`}>
                        2
                      </span>
                      <div className="truncate">
                        <div className="leading-tight">الخطوة الثانية</div>
                        <div className={`text-[10px] font-normal ${externalHousingStep === 2 ? 'text-teal-100' : 'text-gray-500'}`}>
                          محضر الاستلام والمقتنيات
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Modal Form Body */}
                  <form onSubmit={handleInternalWorkerSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-gray-50">
                    {externalHousingStep === 1 ? (
                      <>
                        {/* القسم 1: صورة واسم العاملة (إجباري) */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
                            <User className="w-4 h-4 text-teal-800" />
                            <h3 className="text-sm font-bold text-gray-900">بيانات العاملة الأساسية</h3>
                            <span className="text-xs text-red-500 font-semibold">(مطلوبان للتسكين)</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                            {/* مربع رفع الصورة */}
                            <div className="sm:col-span-4 flex flex-col items-center">
                              <label className="block text-xs font-bold text-gray-700 mb-2 text-center">
                                صورة العاملة <span className="text-red-500">*</span>
                              </label>
                              <div className="relative w-full max-w-[200px] aspect-square rounded-2xl border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/30 flex flex-col items-center justify-center p-3 text-center transition-all group overflow-hidden shadow-sm">
                                {externalHomemaidForm.image ? (
                                  <div className="relative w-full h-full">
                                    <img
                                      src={externalHomemaidForm.image}
                                      alt="صورة العاملة"
                                      className="w-full h-full object-cover rounded-xl shadow-sm"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl">
                                      <label
                                        htmlFor="externalWorkerPhotoInput"
                                        className="p-2 bg-white/90 hover:bg-white text-gray-800 rounded-lg cursor-pointer transition-colors shadow-xs"
                                        title="تغيير الصورة"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => setExternalHomemaidForm((prev) => ({ ...prev, image: '' }))}
                                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-xs"
                                        title="حذف الصورة"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <label
                                    htmlFor="externalWorkerPhotoInput"
                                    className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                                  >
                                    {isUploadingExternalPhoto ? (
                                      <div className="flex flex-col items-center gap-2 text-teal-800">
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-700 border-t-transparent"></div>
                                        <span className="text-xs font-bold">جاري الرفع...</span>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                                          <Camera className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-bold text-teal-900 group-hover:text-teal-800">
                                          انقر لرفع صورة العاملة
                                        </span>
                                        <span className="text-[10px] text-gray-500 mt-1">
                                          JPG, PNG, WEBP
                                        </span>
                                      </>
                                    )}
                                  </label>
                                )}
                                <input
                                  id="externalWorkerPhotoInput"
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={isUploadingExternalPhoto || isSubmittingInternalWorker}
                                  onChange={handleExternalPhotoUpload}
                                />
                              </div>
                              {!externalHomemaidForm.image && (
                                <span className="text-[11px] text-teal-800 font-medium mt-1.5">
                                  الصورة إجبارية للتعرف على العاملة
                                </span>
                              )}
                            </div>

                            {/* حقل اسم العاملة */}
                            <div className="sm:col-span-8 space-y-4">
                              <div>
                                <label className="block text-sm font-bold text-gray-800 mb-1.5">
                                  اسم العاملة الكامل <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={externalHomemaidForm.name}
                                  onChange={(e) => handleExternalNameChange(e.target.value)}
                                  placeholder="أدخل اسم العاملة (حروف فقط)"
                                  disabled={isSubmittingInternalWorker}
                                  className="w-full bg-white border border-gray-300 rounded-xl p-3 text-right text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  يقبل حروف اللغة العربية والإنجليزية فقط
                                </p>
                              </div>

                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-950 leading-relaxed">
                                <span className="font-bold">تنبيه: </span>
                                التسكين الخارجي مخصص فقط للعاملات غير التابعات للمكتب بحالات نادرة وطارئة. الاسم والصورة هما المعرّفان الأساسيان للعاملة.
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* القسم 2: بيانات التسكين والمدة المتوقعة (إجباري) */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                            <Building className="w-4 h-4 text-teal-800" />
                            <h3 className="text-sm font-bold text-gray-900">بيانات التسكين والمدة المتوقعة</h3>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {/* السكن */}
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                السكن المطلوب <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <select
                                  value={internalWorkerForm.housing}
                                  onChange={(e) => {
                                    setInternalWorkerForm({ ...internalWorkerForm, housing: e.target.value });
                                    setValidationErrors((prev) => ({ ...prev, internalLocation: false }));
                                  }}
                                  disabled={isSubmittingInternalWorker}
                                  style={{ backgroundImage: 'none' }}
                                  className={`w-full appearance-none bg-white border rounded-xl p-2.5 pr-3 pl-8 text-right text-sm font-medium focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all ${
                                    validationErrors.internalLocation ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                                  }`}
                                >
                                  <option value="">-- اختر السكن --</option>
                                  {locations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>
                                      {loc.location} (السعة: {loc.quantity})
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                  <ChevronDown className="w-4 h-4" />
                                </div>
                              </div>
                            </div>

                            {/* تاريخ التسكين */}
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                تاريخ التسكين <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                value={internalWorkerForm.housingDate}
                                onChange={(e) => {
                                  setInternalWorkerForm({ ...internalWorkerForm, housingDate: e.target.value });
                                  setValidationErrors((prev) => ({ ...prev, internalHousingDate: false }));
                                }}
                                disabled={isSubmittingInternalWorker}
                                className={`w-full bg-white border rounded-xl p-2.5 text-right text-sm font-medium focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all ${
                                  validationErrors.internalHousingDate ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                                }`}
                              />
                            </div>

                            {/* تاريخ الاستلام الفعلي / المغادرة */}
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                تاريخ الاستلام / المغادرة المتوقع
                              </label>
                              <input
                                type="date"
                                value={internalWorkerForm.receiptDate}
                                onChange={(e) => setInternalWorkerForm({ ...internalWorkerForm, receiptDate: e.target.value })}
                                disabled={isSubmittingInternalWorker}
                                className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-right text-sm font-medium focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all"
                              />
                            </div>

                            {/* مدة البقاء المتوقعة (إجباري) */}
                            <div className="sm:col-span-2 md:col-span-3 bg-teal-50 border border-teal-200 rounded-xl p-3.5">
                              <label className="block text-xs font-bold text-teal-950 mb-1.5">
                                مدة البقاء المتوقعة في السكن <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={internalWorkerForm.expectedStayDuration}
                                onChange={(e) => setInternalWorkerForm({ ...internalWorkerForm, expectedStayDuration: e.target.value })}
                                placeholder="مثال: يومان، 3 أيام، أسبوع، أو حدد المدة بدقة..."
                                disabled={isSubmittingInternalWorker}
                                className="w-full bg-white border border-teal-300 rounded-lg p-2 text-right text-sm font-bold text-gray-900 focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all"
                              />
                              <div className="mt-2">
                                <PresetChips
                                  chips={['يوم واحد', 'يومان', '3 أيام', '5 أيام', 'أسبوع', '10 أيام']}
                                  onSelect={(val) => setInternalWorkerForm((prev) => ({ ...prev, expectedStayDuration: val }))}
                                  disabled={isSubmittingInternalWorker}
                                />
                              </div>
                            </div>

                            {/* سبب التسكين */}
                            <div className="sm:col-span-2 md:col-span-1">
                              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                سبب التسكين <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <select
                                  value={internalWorkerForm.reason}
                                  onChange={(e) => {
                                    setInternalWorkerForm({ ...internalWorkerForm, reason: e.target.value });
                                    setValidationErrors((prev) => ({ ...prev, internalReason: false }));
                                  }}
                                  disabled={isSubmittingInternalWorker}
                                  style={{ backgroundImage: 'none' }}
                                  className={`w-full appearance-none bg-white border rounded-xl p-2.5 pr-3 pl-8 text-right text-sm font-medium focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all ${
                                    validationErrors.internalReason ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                                  }`}
                                >
                                  <option value="وصول بالخطأ للمكتب">وصول بالخطأ للمكتب</option>
                                  <option value="استضافة مؤقتة">استضافة مؤقتة</option>
                                  <option value="عاملة بدون بيانات / مجهولة الكفيل">عاملة بدون بيانات / مجهولة الكفيل</option>
                                  <option value="بانتظار تسليم لمكتب آخر">بانتظار تسليم لمكتب آخر</option>
                                  <option value="عدم استلام الكفيل العاملة">عدم استلام الكفيل العاملة</option>
                                  <option value="الكفيل في منطقة اخرى">الكفيل في منطقة اخرى</option>
                                  <option value="أخرى">أخرى</option>
                                </select>
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                  <ChevronDown className="w-4 h-4" />
                                </div>
                              </div>
                            </div>

                            {/* التفاصيل */}
                            <div className="sm:col-span-2 md:col-span-2">
                              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                تفاصيل الحالة وسبب التواجد <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                value={internalWorkerForm.details}
                                onChange={(e) => setInternalWorkerForm({ ...internalWorkerForm, details: e.target.value })}
                                placeholder="اكتب تفاصيل تواجد العاملة وخطة تسليمها أو التواصل مع الجهة المعنية..."
                                rows={2}
                                disabled={isSubmittingInternalWorker}
                                className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-right text-sm text-gray-900 focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* زر إظهار/إخفاء الحقول الإضافية الاختيارية */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setShowExternalExtraDetails(!showExternalExtraDetails)}
                            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200/80 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Plus className={`w-4 h-4 transition-transform duration-200 ${showExternalExtraDetails ? 'rotate-45 text-red-600' : 'text-teal-700'}`} />
                              <span>بيانات إضافية للعاملة والكفيل (اختيارية — في حال توفرها)</span>
                            </div>
                            <span className="text-[11px] font-normal text-gray-500">
                              {showExternalExtraDetails ? 'إخفاء الحقول الإضافية' : 'إظهار الجواز، الجوال، الكفيل...'}
                            </span>
                          </button>
                        </div>

                        {/* الأقسام الاختيارية (تظهر عند النقر أو تظل جاهزة) */}
                        {showExternalExtraDetails && (
                          <div className="space-y-4 animate-in fade-in duration-200">
                            {/* القسم 3: بيانات إضافية للعاملة (اختيارية) */}
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
                              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                                <FaPassport className="w-4 h-4 text-teal-700" />
                                <h3 className="text-sm font-bold text-gray-900">بيانات العاملة الإضافية (اختياري)</h3>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-xs font-bold text-gray-700 mb-1.5">رقم الجواز</label>
                                  <input
                                    type="text"
                                    value={externalHomemaidForm.passportNumber}
                                    onChange={(e) => handleExternalPassportChange(e.target.value)}
                                    placeholder="رقم الجواز"
                                    disabled={isSubmittingInternalWorker}
                                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-right text-sm text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-gray-700 mb-1.5">رقم جوال العاملة</label>
                                  <input
                                    type="text"
                                    value={externalHomemaidForm.phone}
                                    onChange={(e) => handleExternalPhoneChange(e.target.value)}
                                    placeholder="أرقام و + فقط"
                                    dir="ltr"
                                    disabled={isSubmittingInternalWorker}
                                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-left text-sm text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                </div>

                                <div>
                                  <NationalityFieldWithList
                                    label="الجنسية"
                                    items={uniqueNationalities}
                                    value={externalHomemaidForm.nationality}
                                    onChange={(v) =>
                                      setExternalHomemaidForm({ ...externalHomemaidForm, nationality: v })
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-gray-700 mb-1.5">تاريخ الميلاد</label>
                                  <input
                                    type="date"
                                    value={externalHomemaidForm.dateofbirth}
                                    onChange={(e) => setExternalHomemaidForm({ ...externalHomemaidForm, dateofbirth: e.target.value })}
                                    disabled={isSubmittingInternalWorker}
                                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-right text-sm text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-gray-700 mb-1.5">تاريخ بداية الجواز</label>
                                  <input
                                    type="date"
                                    value={externalHomemaidForm.passportStartDate}
                                    onChange={(e) => setExternalHomemaidForm({ ...externalHomemaidForm, passportStartDate: e.target.value })}
                                    disabled={isSubmittingInternalWorker}
                                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-right text-sm text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-gray-700 mb-1.5">تاريخ نهاية الجواز</label>
                                  <input
                                    type="date"
                                    value={externalHomemaidForm.passportEndDate}
                                    onChange={(e) => setExternalHomemaidForm({ ...externalHomemaidForm, passportEndDate: e.target.value })}
                                    disabled={isSubmittingInternalWorker}
                                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-right text-sm text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* القسم 4: بيانات الكفيل / الجهة المسؤولة (اختيارية) */}
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
                              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                                <FaAddressBook className="w-4 h-4 text-blue-700" />
                                <h3 className="text-sm font-bold text-gray-900">بيانات الكفيل أو الجهة المسؤولة (اختياري)</h3>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-xs font-bold text-gray-700 mb-1.5">اسم الكفيل / الجهة</label>
                                  <input
                                    type="text"
                                    value={externalClientForm.name}
                                    onChange={(e) => setExternalClientForm({ ...externalClientForm, name: e.target.value })}
                                    placeholder="اسم الكفيل أو المكتب الآخر"
                                    disabled={isSubmittingInternalWorker}
                                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-right text-sm text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-gray-700 mb-1.5">رقم جوال التواصل</label>
                                  <input
                                    type="text"
                                    value={externalClientForm.phone}
                                    onChange={(e) => handleExternalClientPhoneChange(e.target.value)}
                                    placeholder="أرقام و + فقط"
                                    dir="ltr"
                                    disabled={isSubmittingInternalWorker}
                                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-left text-sm text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-gray-700 mb-1.5">المدينة / المنطقة</label>
                                  <input
                                    type="text"
                                    value={externalClientForm.city}
                                    onChange={(e) => setExternalClientForm({ ...externalClientForm, city: e.target.value })}
                                    placeholder="مثال: الرياض"
                                    disabled={isSubmittingInternalWorker}
                                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-right text-sm text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Step 1 Footer */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => closeModal('internalWorkerModal')}
                            disabled={isSubmittingInternalWorker}
                            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (validateExternalHousingStep1()) {
                                setExternalHousingStep(2);
                              }
                            }}
                            className="bg-teal-800 hover:bg-teal-700 text-white rounded-xl px-7 py-2.5 text-sm font-bold flex items-center justify-center gap-2 shadow-teal-800/20 shadow-sm hover:shadow-md transition-all cursor-pointer"
                          >
                            <span>التالي: محضر الاستلام والمقتنيات</span>
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Step 2: محضر الاستلام والمقتنيات للعاملة الخارجية */}
                        {/* ملخص العاملة والسكن */}
                        <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-teal-900">عاملة خارجية: {externalHomemaidForm.name}</span>
                            <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-medium">
                              {externalHomemaidForm.nationality || 'غير محدد'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-teal-900 font-medium">
                            <span>السكن: {locations.find((l) => l.id.toString() === internalWorkerForm.housing)?.location || 'محدد'}</span>
                            <span>السبب: {internalWorkerForm.reason}</span>
                            <span>المدة المتوقعة: {internalWorkerForm.expectedStayDuration}</span>
                          </div>
                        </div>

                        {/* شبكة أسئلة المحضر */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
                          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                            <ClipboardCheck className="w-5 h-5 text-teal-800" />
                            <div>
                              <h3 className="text-base font-bold text-gray-900">محضر استلام ومقتنيات العاملة وحالتها عند التسكين</h3>
                              <p className="text-xs text-gray-500">يرجى توثيق المستحقات، الوثائق، المقتنيات، والحالة بدقة</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* 1. الرواتب */}
                            <div className="sm:col-span-2">
                              <SmartAuditToggle
                                label="هل تم استلام كامل الرواتب من الكفيل؟"
                                value={internalWorkerForm.salaryReceived}
                                onChange={(val) =>
                                  setInternalWorkerForm((prev) => ({
                                    ...prev,
                                    salaryReceived: val,
                                    salaryRemainingAmount: val === false ? prev.salaryRemainingAmount : '',
                                    entitlementReason: val === false ? prev.entitlementReason : '',
                                  }))
                                }
                                options={[
                                  { label: 'نعم (مستلمة بالكامل)', value: true },
                                  { label: 'لا (يوجد متبقي)', value: false },
                                  { label: 'غير معروف', value: 'unknown' },
                                ]}
                                disabled={isSubmittingInternalWorker}
                              />
                              {internalWorkerForm.salaryReceived === false && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                  <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                      المبلغ المتبقي / المستحق (ر.س) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="number"
                                      placeholder="أدخل المبلغ (مثال: 1500)"
                                      value={internalWorkerForm.salaryRemainingAmount}
                                      onChange={(e) =>
                                        setInternalWorkerForm({ ...internalWorkerForm, salaryRemainingAmount: e.target.value })
                                      }
                                      disabled={isSubmittingInternalWorker}
                                      min="0"
                                      step="0.01"
                                      className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-sm font-bold text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                    />
                                    <PresetChips
                                      chips={['1500', '3000', '4500', '750']}
                                      onSelect={(val) =>
                                        setInternalWorkerForm((prev) => ({ ...prev, salaryRemainingAmount: val }))
                                      }
                                      disabled={isSubmittingInternalWorker}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                      ملاحظات / تفاصيل الرواتب
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="مثال: رواتب آخر شهرين مستحقة"
                                      value={internalWorkerForm.entitlementReason}
                                      onChange={(e) =>
                                        setInternalWorkerForm({ ...internalWorkerForm, entitlementReason: e.target.value })
                                      }
                                      disabled={isSubmittingInternalWorker}
                                      className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-sm text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                    />
                                    <PresetChips
                                      chips={['رواتب آخر شهرين', 'رواتب 3 أشهر', 'متبقي نصف شهر', 'مستحقات نهاية خدمة']}
                                      onSelect={(val) =>
                                        setInternalWorkerForm((prev) => ({ ...prev, entitlementReason: val }))
                                      }
                                      disabled={isSubmittingInternalWorker}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 2. الجوال */}
                            <div>
                              <SmartAuditToggle
                                label="هل يوجد جوال بحوزة العاملة؟"
                                value={internalWorkerForm.hasPhone}
                                onChange={(val) =>
                                  setInternalWorkerForm((prev) => ({
                                    ...prev,
                                    hasPhone: val,
                                    phoneReason: val === false ? prev.phoneReason : '',
                                  }))
                                }
                                options={[
                                  { label: 'نعم', value: true },
                                  { label: 'لا', value: false },
                                  { label: 'غير معروف', value: 'unknown' },
                                ]}
                                disabled={isSubmittingInternalWorker}
                              />
                              {internalWorkerForm.hasPhone === false && (
                                <div className="mt-1.5">
                                  <input
                                    type="text"
                                    placeholder="سبب عدم وجود الجوال..."
                                    value={internalWorkerForm.phoneReason}
                                    onChange={(e) =>
                                      setInternalWorkerForm({ ...internalWorkerForm, phoneReason: e.target.value })
                                    }
                                    disabled={isSubmittingInternalWorker}
                                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-xs text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                  <PresetChips
                                    chips={['مصادر من الكفيل', 'لا تمتلك جوال', 'مفقود', 'تالف']}
                                    onSelect={(val) =>
                                      setInternalWorkerForm((prev) => ({ ...prev, phoneReason: val }))
                                    }
                                    disabled={isSubmittingInternalWorker}
                                  />
                                </div>
                              )}
                            </div>

                            {/* 3. الإقامة */}
                            <div>
                              <SmartAuditToggle
                                label="هل الإقامة بحوزة العاملة؟"
                                value={internalWorkerForm.hasIqama}
                                onChange={(val) =>
                                  setInternalWorkerForm((prev) => ({
                                    ...prev,
                                    hasIqama: val,
                                    iqamaReason: val === false ? prev.iqamaReason : '',
                                  }))
                                }
                                options={[
                                  { label: 'نعم', value: true },
                                  { label: 'لا', value: false },
                                  { label: 'غير معروف', value: 'unknown' },
                                ]}
                                disabled={isSubmittingInternalWorker}
                              />
                              {internalWorkerForm.hasIqama === false && (
                                <div className="mt-1.5">
                                  <input
                                    type="text"
                                    placeholder="سبب عدم وجود الإقامة..."
                                    value={internalWorkerForm.iqamaReason}
                                    onChange={(e) =>
                                      setInternalWorkerForm({ ...internalWorkerForm, iqamaReason: e.target.value })
                                    }
                                    disabled={isSubmittingInternalWorker}
                                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-xs text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                  <PresetChips
                                    chips={['مع الكفيل', 'لم تصدر بعد', 'منتهية', 'مفقودة']}
                                    onSelect={(val) =>
                                      setInternalWorkerForm((prev) => ({ ...prev, iqamaReason: val }))
                                    }
                                    disabled={isSubmittingInternalWorker}
                                  />
                                </div>
                              )}
                            </div>

                            {/* 4. الجواز */}
                            <div>
                              <SmartAuditToggle
                                label="هل جواز السفر بحوزة العاملة؟"
                                value={internalWorkerForm.hasPassport}
                                onChange={(val) =>
                                  setInternalWorkerForm((prev) => ({
                                    ...prev,
                                    hasPassport: val,
                                    passportReason: val === false ? prev.passportReason : '',
                                  }))
                                }
                                options={[
                                  { label: 'نعم', value: true },
                                  { label: 'لا', value: false },
                                  { label: 'غير معروف', value: 'unknown' },
                                ]}
                                disabled={isSubmittingInternalWorker}
                              />
                              {internalWorkerForm.hasPassport === false && (
                                <div className="mt-1.5">
                                  <input
                                    type="text"
                                    placeholder="سبب عدم وجود الجواز..."
                                    value={internalWorkerForm.passportReason}
                                    onChange={(e) =>
                                      setInternalWorkerForm({ ...internalWorkerForm, passportReason: e.target.value })
                                    }
                                    disabled={isSubmittingInternalWorker}
                                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-xs text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                  <PresetChips
                                    chips={['مع الكفيل', 'مفقود', 'بالسفارة', 'منتهي']}
                                    onSelect={(val) =>
                                      setInternalWorkerForm((prev) => ({ ...prev, passportReason: val }))
                                    }
                                    disabled={isSubmittingInternalWorker}
                                  />
                                </div>
                              )}
                            </div>

                            {/* 5. الأغراض الشخصية */}
                            <div>
                              <SmartAuditToggle
                                label="هل لديها أغراض / حقائب شخصية؟"
                                value={internalWorkerForm.hasPersonalItems}
                                onChange={(val) =>
                                  setInternalWorkerForm((prev) => ({
                                    ...prev,
                                    hasPersonalItems: val,
                                    personalItemsDetails: val === true ? prev.personalItemsDetails : '',
                                  }))
                                }
                                options={[
                                  { label: 'نعم (يوجد)', value: true },
                                  { label: 'لا', value: false },
                                  { label: 'غير معروف', value: 'unknown' },
                                ]}
                                disabled={isSubmittingInternalWorker}
                              />
                              {internalWorkerForm.hasPersonalItems === true && (
                                <div className="mt-1.5">
                                  <input
                                    type="text"
                                    placeholder="تفاصيل الأمتعة والحقائب المستلمة..."
                                    value={internalWorkerForm.personalItemsDetails}
                                    onChange={(e) =>
                                      setInternalWorkerForm({ ...internalWorkerForm, personalItemsDetails: e.target.value })
                                    }
                                    disabled={isSubmittingInternalWorker}
                                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-right text-xs text-gray-900 focus:ring-2 focus:ring-teal-600 outline-none"
                                  />
                                  <PresetChips
                                    chips={['حقيبة ملابس كبيرة', 'حقيبتين + أمتعة شخصية', 'حقيبة يد فقط', 'أمتعة متعددة']}
                                    onSelect={(val) =>
                                      setInternalWorkerForm((prev) => ({ ...prev, personalItemsDetails: val }))
                                    }
                                    disabled={isSubmittingInternalWorker}
                                  />
                                </div>
                              )}
                            </div>

                            {/* 6. الفحص الطبي للإقامة */}
                            <div>
                              <SmartAuditToggle
                                label="الفحص الطبي للإقامة"
                                value={internalWorkerForm.medicalCheckDone}
                                onChange={(val) =>
                                  setInternalWorkerForm((prev) => ({ ...prev, medicalCheckDone: val }))
                                }
                                options={[
                                  { label: 'تم الفحص', value: true },
                                  { label: 'لم يتم', value: false },
                                  { label: 'غير معروف', value: 'unknown' },
                                ]}
                                disabled={isSubmittingInternalWorker}
                              />
                            </div>

                            {/* 7. نوع التأشيرة */}
                            <div>
                              <SmartAuditToggle
                                label="نوع التأشيرة"
                                value={internalWorkerForm.visaType}
                                onChange={(val) =>
                                  setInternalWorkerForm((prev) => ({ ...prev, visaType: val }))
                                }
                                options={[
                                  { label: 'مدفوعة', value: 'مدفوعة' },
                                  { label: 'تأهيل شامل', value: 'تأهيل شامل' },
                                  { label: 'غير معروف', value: 'غير معروف' },
                                ]}
                                disabled={isSubmittingInternalWorker}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Step 2 Footer */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => setExternalHousingStep(1)}
                            disabled={isSubmittingInternalWorker}
                            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
                          >
                            <ArrowRight className="w-4 h-4" />
                            <span>السابق: بيانات التسكين</span>
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingInternalWorker}
                            className="bg-teal-800 hover:bg-teal-900 text-white rounded-xl px-8 py-2.5 text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {isSubmittingInternalWorker ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>جاري حفظ التسكين...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                <span>تأكيد وحفظ التسكين والمحضر</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </form>
                </div>
              </div>
            )}
            {/* Delete Location Confirmation Modal */}
            {modals.deleteLocationConfirm && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                onClick={() => closeModal('deleteLocationConfirm')}
              >
                <div
                  className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-center items-center mb-6">
                    <div className="bg-red-100 rounded-full p-4">
                      <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 text-center mb-4">
                    تأكيد حذف السكن
                  </h2>
                  <p className="text-base text-gray-600 text-center mb-6">
                    هل أنت متأكد من رغبتك في حذف السكن <span className="font-semibold text-gray-900">{locationToDelete?.name}</span>؟
                    <br />
                    <span className="text-sm text-red-600 mt-2 block">هذا الإجراء لا يمكن التراجع عنه</span>
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        closeModal('deleteLocationConfirm');
                        setLocationToDelete(null);
                      }}
                      className="bg-white text-gray-700 border border-gray-300 rounded-md w-28 h-10 text-base hover:bg-gray-50"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={confirmDeleteLocation}
                      className="bg-red-600 text-white rounded-md w-28 h-10 text-base hover:bg-red-700"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Delete Note Confirmation Modal */}
            {modals.deleteNoteConfirm && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                onClick={() => closeModal('deleteNoteConfirm')}
              >
                <div
                  className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-center items-center mb-6">
                    <div className="bg-red-100 rounded-full p-4">
                      <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 text-center mb-4">
                    تأكيد حذف الملاحظة
                  </h2>
                  <p className="text-base text-gray-600 text-center mb-6">
                    هل أنت متأكد من رغبتك في حذف هذه الملاحظة؟
                    <br />
                    <span className="text-sm text-red-600 mt-2 block">هذا الإجراء لا يمكن التراجع عنه</span>
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        closeModal('deleteNoteConfirm');
                        setNoteToDelete(null);
                      }}
                      className="bg-white text-gray-700 border border-gray-300 rounded-md w-28 h-10 text-base hover:bg-gray-50"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={confirmDeleteNote}
                      className="bg-red-600 text-white rounded-md w-28 h-10 text-base hover:bg-red-700"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete File Confirmation Modal */}
            {deleteFileConfirm.isOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[999999] p-4"
                onClick={() => !deleteFileConfirm.isDeleting && setDeleteFileConfirm((prev) => ({ ...prev, isOpen: false }))}
              >
                <div
                  dir="rtl"
                  className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl border border-gray-100 transform transition-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3.5">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1.5">
                    تأكيد حذف الملف
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    هل أنت متأكد من رغبتك في حذف هذا الملف نهائياً ؟
                  </p>
                  {deleteFileConfirm.fileName && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 mb-5 text-center">
                      <span className="text-xs font-mono font-bold text-gray-800 break-all" dir="ltr">
                        {deleteFileConfirm.fileName}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      disabled={deleteFileConfirm.isDeleting}
                      onClick={() => setDeleteFileConfirm((prev) => ({ ...prev, isOpen: false }))}
                      className="flex-1 py-2 px-4 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      disabled={deleteFileConfirm.isDeleting}
                      onClick={confirmDeleteUploadedFile}
                      className="flex-1 py-2 px-4 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {deleteFileConfirm.isDeleting ? (
                        <>
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                          <span>جاري الحذف...</span>
                        </>
                      ) : (
                        <span>تأكيد الحذف</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Toast Notification في الزاوية العلوية يمين */}
            {modals.notification && notificationMessage && (
              <div
                dir="rtl"
                className="fixed top-5 right-5 z-[99999] max-w-sm w-full transition-all duration-300 transform"
                style={{
                  animation: 'fadeInDown 0.3s ease-out forwards',
                }}
              >
                <div
                  className={`flex items-center gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md ${
                    notificationType === 'error'
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : 'bg-green-50 border-green-200 text-green-900'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      notificationType === 'error'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {notificationType === 'error' ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-xs font-bold leading-snug">
                      {notificationMessage}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
                      setModals((prev) => ({ ...prev, notification: false }));
                    }}
                    className={`p-1 rounded-md transition-colors hover:bg-black/5 shrink-0 ${
                      notificationType === 'error' ? 'text-red-500' : 'text-green-600'
                    }`}
                    title="إغلاق"
                  >
                    <XCircle className="w-4 h-4 opacity-70 hover:opacity-100" />
                  </button>
                </div>
              </div>
            )}

            {/* Supervisor Selection Modal */}
            {modals.supervisorModal && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                onClick={() => closeModal('supervisorModal')}
              >
                <div
                  className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">
                    ادارة المشرفة للسكن: {selectedLocationForSupervisor?.location}
                  </h2>
                  
                  {/* Current Supervisor Section */}
                  {selectedLocationForSupervisor?.supervisorUser && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <div className="text-right">
                          <span className="text-gray-500 text-xs block mb-1">المشرفة الحالية</span>
                          <span className="font-semibold text-teal-800 text-lg block">{selectedLocationForSupervisor.supervisorUser.Name}</span>
                        </div>
                        <button 
                          onClick={handleRemoveSupervisor}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
                          title="حذف المشرفة"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mb-4 relative">
                    <label className="block text-right mb-2 text-sm font-medium text-gray-700">تغيير المشرفة</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="ابحث بالاسم..."
                        value={supervisorSearchTerm}
                        onChange={(e) => setSupervisorSearchTerm(e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-3 pr-10 text-right focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                      />
                      <Search className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" />
                    </div>
                    
                    {/* Results List - Only show if searching */}
                    {supervisorSearchTerm && (
                      <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md shadow-sm bg-white absolute w-full z-10">
                        {homemaids
                          .filter(maid => maid.Name && maid.Name.includes(supervisorSearchTerm))
                          .map((maid) => (
                            <div
                              key={maid.id}
                              className="p-3 border-b last:border-b-0 hover:bg-teal-50 cursor-pointer text-right transition-colors flex justify-between items-center group"
                              onClick={() => handleSaveSupervisor(maid.id)}
                            >
                              <span className="group-hover:text-teal-800">{maid.Name}</span>
                              {selectedLocationForSupervisor?.supervisor === maid.id && (
                                <span className="text-gray-400 text-xs bg-gray-100 px-2 py-1 rounded">مختارة حاليا</span>
                              )}
                            </div>
                          ))}
                        {homemaids.filter(maid => maid.Name && maid.Name.includes(supervisorSearchTerm)).length === 0 && (
                          <div className="p-4 text-center text-gray-500 text-sm">لا توجد نتائج مطابقة</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center mt-6">
                    <button
                      type="button"
                      onClick={() => closeModal('supervisorModal')}
                      className="bg-white text-gray-700 border border-gray-300 rounded-md px-6 py-2 text-sm hover:bg-gray-50 transition-colors"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </section>
      <TransferTrialWizardModal
        open={!!transferWizardWorker}
        worker={transferWizardWorker}
        onClose={() => setTransferWizardWorker(null)}
        onSuccess={() => { setTransferWizardWorker(null); fetchWorkers(); }}
      />
      {toastMessage && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 bg-teal-900 text-white text-sm py-2 px-4 rounded-full shadow-lg border border-teal-700 pointer-events-none transition-all duration-300"
          dir="rtl"
        >
          <Check className="w-4 h-4 text-green-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
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