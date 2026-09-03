import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from 'example/containers/Layout';
import Select from 'react-select';
import { jwtDecode } from 'jwt-decode';

export default function AccountingReviewPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'posted'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  
  // Modern Toast State
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    show: false,
    message: '',
    type: 'success'
  });
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', duration = 4500) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, duration);
  };
  
  // Cost Centers and Accounts with Instant Local Storage Cache
  const [costCenters, setCostCenters] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('daftra_cost_centers_cache');
        return cached ? JSON.parse(cached) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [accounts, setAccounts] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('daftra_accounts_cache');
        return cached ? JSON.parse(cached) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [fetchingDaftraData, setFetchingDaftraData] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingJournal, setSubmittingJournal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  
  // Create Cost Center Modal State
  const [isCcModalOpen, setIsCcModalOpen] = useState(false);
  const [creatingCc, setCreatingCc] = useState(false);
  const [ccFormData, setCcFormData] = useState({
    name: '',
    code: '',
    parentId: '',
    isPrimary: false,
  });

  // Create Account Modal State
  const [isAccModalOpen, setIsAccModalOpen] = useState(false);
  const [creatingAcc, setCreatingAcc] = useState(false);
  const [accFormData, setAccFormData] = useState({
    name: '',
    code: '',
    parentId: '',
  });

  // Mark Manually Posted Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualTargetOrder, setManualTargetOrder] = useState<any>(null);
  const [manualJournalNumber, setManualJournalNumber] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  const [journalEntry, setJournalEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: '',
    currency: 'SAR ريال سعودي',
    clientDebit: 0,
    revenueCredit: 0,
    taxCredit: 0,
    lines: [] as any[]
  });

  const accountOptions = accounts
    .filter(acc => !acc.is_category && !acc.JournalAccount?.is_category)
    .map(acc => {
      const a = acc.JournalAccount || acc;
      return { value: a.id, label: `${a.name}${a.code ? ` - ${a.code}` : ''}` };
    });

  const parentAccountOptions = accounts
    .filter(acc => {
      const a = acc.JournalAccount || acc;
      const name = (a.name || '').trim();
      if (a.is_category || a.is_parent) return true;
      // Filter out sub-accounts with 5+ digit contract numbers
      if (/\d{5,}/.test(name)) return false;
      return true;
    })
    .map(acc => {
      const a = acc.JournalAccount || acc;
      return { value: a.id, label: `${a.name}${a.code ? ` - ${a.code}` : ''}` };
    });

  const costCenterOptions = costCenters.map(cc => {
    const c = cc.CostCenter || cc;
    return { value: c.id, label: c.name };
  });

  const parentCostCenterOptions = costCenters
    .filter(cc => {
      const c = cc.CostCenter || cc;
      const name = (c.name || '').trim();
      if (!name) return false;

      // 1. Exclude any item that contains a 5+ digit contract number (definitely a contract sub-center)
      if (/\d{5,}/.test(name)) {
        return false;
      }

      // 2. Check if parent_id or cost_center_id is set (> 0), which means it's a sub-center
      const parentId = c.cost_center_id || c.parent_id;
      if (parentId && Number(parentId) > 0) {
        return false;
      }

      // 3. If explicit is_primary is provided and is 0/false, exclude it
      if (c.is_primary !== undefined && c.is_primary !== null && c.is_primary !== '') {
        const isPrim = c.is_primary == 1 || c.is_primary === '1' || c.is_primary === true;
        if (!isPrim) return false;
      }

      return true;
    })
    .map(cc => {
      const c = cc.CostCenter || cc;
      return { value: c.id, label: c.name };
    });

  useEffect(() => {
    const checkAuthAndInit = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch('/api/auth/me', { headers });
        if (res.ok) {
          const data = await res.json();
          const permissions = data.user?.permissions || {};
          const isOwner = String(data.user?.role || '').toLowerCase() === 'owner' || String(data.user?.role || '') === 'مالك';
          const canView = isOwner || !!permissions?.['إدارة المحاسبة']?.['عرض صفحة المراجعة'] || !!permissions?.['إدارة المحاسبة']?.['عرض صفحة المراجعة '];

          if (!canView) {
            router.push('/admin/home');
            return;
          }

          setIsAuthorized(true);
          if (data.user?.id) setCurrentUserId(Number(data.user.id));
          if (data.user?.username) setCurrentUserName(data.user.username);

          fetchOrders();
          fetchDaftraData();
        } else {
          router.push('/admin/login');
        }
      } catch (err) {
        console.error('Auth error:', err);
        router.push('/admin/login');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthAndInit();
  }, [router]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/admin/orders-for-accounting');
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchDaftraData = async (force = false) => {
    setFetchingDaftraData(true);
    try {
      const [ccRes, accRes] = await Promise.all([
        axios.post('/api/daftra/cost-centers', { forceRefresh: force }),
        axios.post('/api/daftra/accounts', { forceRefresh: force })
      ]);
      
      if (ccRes.data && ccRes.data.data) {
        setCostCenters(ccRes.data.data);
        try {
          localStorage.setItem('daftra_cost_centers_cache', JSON.stringify(ccRes.data.data));
        } catch (e) {}
      }
      if (accRes.data && accRes.data.data) {
        setAccounts(accRes.data.data);
        try {
          localStorage.setItem('daftra_accounts_cache', JSON.stringify(accRes.data.data));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error fetching Daftra data:', err);
    } finally {
      setFetchingDaftraData(false);
    }
  };

  const findOfficeCostCenter = (officeName: string, centers: any[]) => {
    if (!officeName || !centers || centers.length === 0) return '';
    const lower = officeName.toLowerCase();
    let keyword = '';
    if (lower.includes('rpr') || lower.includes('فلبين')) keyword = 'rpr';
    else if (lower.includes('fidel') || lower.includes('فيدل')) keyword = 'فيدل';
    else if (lower.includes('makka') || lower.includes('مكة') || lower.includes('مكه')) keyword = 'مكة';
    else if (lower.includes('el barq') || lower.includes('el-barq') || lower.includes('البرق') || lower.includes('barq')) keyword = 'البرق';
    else if (lower.includes('fursah') || lower.includes('فرصة') || lower.includes('فرصه')) keyword = 'فرصه';
    else if (lower.includes('ham') || lower.includes('حام') || lower.includes('هام') || lower.includes('shandhany') || lower.includes('shandhani') || lower.includes('شاندهاي') || lower.includes('شاندهاني') || lower.includes('بنجلاديش') || lower.includes('بنجلادش')) keyword = 'حام';
    else if (lower.includes('ranala') || lower.includes('رانال') || lower.includes('رنال')) keyword = 'رنال';
    else if (lower.includes('top high') || lower.includes('توب هاي') || lower.includes('tophigh')) keyword = 'توب هاي';
    else if (lower.includes('strepa') || lower.includes('ستريبيا') || lower.includes('ستريبا')) keyword = 'ستريبا';
    else if (lower.includes('kora') || lower.includes('كورا')) keyword = 'كورا';
    else if (lower.includes('jidar') || lower.includes('جدار')) keyword = 'جدار';
    else if (lower.includes('injaz') || lower.includes('إنجاز') || lower.includes('انجاز')) keyword = 'انجاز';
    else if (lower.includes('minkara') || lower.includes('منكارا')) keyword = 'منكارا';
    else if (lower.includes('riasat') || lower.includes('رياسات')) keyword = 'رياسات';
    else if (lower.includes('bright') || lower.includes('برايت')) keyword = 'برايت';
    else if (lower.includes('adel') || lower.includes('عادل')) keyword = 'عادل';
    else if (lower.includes('best migrant') || lower.includes('بيست')) keyword = 'بيست';
    else if (lower.includes('earth') || lower.includes('ايرث')) keyword = 'ايرث';

    if (keyword) {
      const normKeyword = normalizeArabic(keyword);
      // Prioritize standard parent cost centers (parent_id is 0 or null, excludes 'رجالية' and 5+ digits)
      const match = centers.find((cc: any) => {
        const c = cc.CostCenter || cc;
        const cName = normalizeArabic(c.name || '');
        const parentId = c.cost_center_id || c.parent_id;
        const isParent = !parentId || Number(parentId) === 0;
        return isParent && cName.includes(normKeyword) && !cName.includes('رجالي') && !/\d{5,}/.test(c.name || '');
      }) || centers.find((cc: any) => {
        const c = cc.CostCenter || cc;
        const cName = normalizeArabic(c.name || '');
        const parentId = c.cost_center_id || c.parent_id;
        const isParent = !parentId || Number(parentId) === 0;
        return isParent && cName.includes(normKeyword) && !/\d{5,}/.test(c.name || '');
      }) || centers.find((cc: any) => {
        const c = cc.CostCenter || cc;
        const cName = normalizeArabic(c.name || '');
        return cName.includes(normKeyword) && !cName.includes('رجالي') && !/\d{5,}/.test(c.name || '');
      }) || centers.find((cc: any) => {
        const c = cc.CostCenter || cc;
        const cName = normalizeArabic(c.name || '');
        return cName.includes(normKeyword) && !/\d{5,}/.test(c.name || '');
      });
      if (match) {
        const c = match.CostCenter || match;
        return c.id;
      }
    }
    return '';
  };

  const openCreateCostCenterModal = (order?: any) => {
    const targetOrder = order || selectedOrder;
    if (!targetOrder) return;
    setSelectedOrder(targetOrder);

    const contractNumber = targetOrder.arrivals && targetOrder.arrivals.length > 0
      ? targetOrder.arrivals[0].InternalmusanedContract?.trim()
      : '';
    const clientName = targetOrder.ClientName?.trim() || '';
    
    // Auto generated standard name: اسم العميل و رقم عقده
    const defaultName = contractNumber ? `${clientName} ${contractNumber}`.trim() : clientName;
    
    // Calculate next sequential numeric code in Daftra (e.g. 988, 989)
    let nextNumericCode = '';
    if (costCenters && costCenters.length > 0) {
      let maxNum = 0;
      costCenters.forEach((cc: any) => {
        const c = cc.CostCenter || cc;
        const codeNum = parseInt(c.code, 10);
        if (!isNaN(codeNum) && codeNum > maxNum && codeNum < 1000000) {
          maxNum = codeNum;
        }
      });
      if (maxNum > 0) {
        nextNumericCode = String(maxNum + 1);
      }
    }

    const targetOffice = targetOrder.officeName || targetOrder.arrivals?.[0]?.office || targetOrder.office || '';
    const autoParentId = findOfficeCostCenter(targetOffice, costCenters);

    setCcFormData({
      name: defaultName,
      code: nextNumericCode,
      parentId: autoParentId,
      isPrimary: false,
    });

    setIsCcModalOpen(true);
  };

  const handleCreateCostCenter = async () => {
    if (!ccFormData.name) {
      showToast('يرجى إدخال اسم مركز التكلفة', 'warning');
      return;
    }

    setCreatingCc(true);
    try {
      const contractNumber = selectedOrder?.arrivals?.[0]?.InternalmusanedContract || '';
      const clientName = selectedOrder?.ClientName || selectedOrder?.client?.fullname || '';
      const clientId = selectedOrder?.client?.id || selectedOrder?.clientId || null;

      const res = await axios.post('/api/daftra/create-cost-center', {
        name: ccFormData.name,
        code: ccFormData.code,
        parentId: ccFormData.isPrimary ? 0 : ccFormData.parentId,
        isPrimary: ccFormData.isPrimary,
        clientId,
        userId: currentUserId,
        clientName,
        contractNumber,
      });

      const newId = res.data?.id || res.data?.data?.id || res.data?.CostCenter?.id || res.data?.data?.CostCenter?.id || (typeof res.data?.data === 'number' ? res.data.data : null);

      if (newId) {
        const newCostCenterObj = {
          id: newId,
          name: ccFormData.name,
          code: ccFormData.code,
          CostCenter: {
            id: newId,
            name: ccFormData.name,
            code: ccFormData.code,
          }
        };

        setCostCenters(prev => [...prev, newCostCenterObj]);

        // Auto-assign to current journal entry lines
        setJournalEntry(prev => ({
          ...prev,
          lines: prev.lines.map(l => ({ ...l, cost_center_id: newId }))
        }));

        setIsCcModalOpen(false);
        showToast(`تم إنشاء مركز التكلفة "${ccFormData.name}" بنجاح في دفترة وتم تعيينه في القيد`, 'success');
      } else {
        showToast('تم إرسال الطلب إلى دفترة بنجاح', 'info');
        setIsCcModalOpen(false);
        fetchDaftraData();
      }
    } catch (err: any) {
      console.error('Error creating cost center:', err);
      showToast('فشل إنشاء مركز التكلفة: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setCreatingCc(false);
    }
  };

  const openManualModal = (order: any) => {
    setManualTargetOrder(order);
    setManualJournalNumber('');
    setManualNotes('');
    setIsManualModalOpen(true);
  };

  const handleMarkManuallyPosted = async () => {
    if (!manualTargetOrder) return;
    setSubmittingManual(true);
    try {
      const contractNumber = manualTargetOrder.arrivals?.[0]?.InternalmusanedContract || '';
      const clientName = manualTargetOrder.ClientName || manualTargetOrder.client?.fullname || '';
      const res = await axios.post('/api/daftra/mark-manually-posted', {
        orderId: manualTargetOrder.id,
        daftraJournalNumber: manualJournalNumber,
        notes: manualNotes,
        userId: currentUserId,
        clientName,
        contractNumber
      });
      showToast(res.data.message || 'تم تعيين القيد كمرحل مسبقاً بنجاح!', 'success');
      setIsManualModalOpen(false);
      if (isModalOpen && selectedOrder?.id === manualTargetOrder.id) {
        setIsModalOpen(false);
      }
      fetchOrders();
    } catch (err: any) {
      console.error('Error marking as manually posted:', err);
      showToast(err.response?.data?.message || 'فشل في تحديث حالة القيد', 'error');
    } finally {
      setSubmittingManual(false);
    }
  };

  const translateBookingStatus = (status: string, booking?: any) => {
    const statusTranslations: Record<string, string> = {
      'pending': 'قيد الانتظار، بانتظار الربط',
      'office_link_approved': 'تم الربط مع إدارة المكاتب، بانتظار موافقة المكتب الخارجي',
      'pending_office_link': 'في انتظار الربط مع المكاتب',
      'external_office_approved': 'تمت موافقة المكتب الخارجي، بانتظار الفحص الطبي',
      'pending_external_office': 'في انتظار موافقة المكتب الخارجي',
      'pending_medical_check': 'تمت موافقة المكتب الخارجي، بانتظار الفحص الطبي',
      'medical_check_passed': 'تم الفحص الطبي، وفي انتظار موافقة مكتب العمل',
      'pending_foreign_labor': 'تم الفحص الطبي، وفي انتظار موافقة مكتب العمل',
      'foreign_labor_approved': 'تمت موافقة مكتب العمل، بانتظار دفع الوكالة',
      'pending_agency_payment': 'تمت موافقة مكتب العمل، بانتظار دفع الوكالة',
      'agency_paid': 'تم دفع الوكالة، بانتظار موافقة السفارة',
      'pending_embassy': 'تم دفع الوكالة، بانتظار موافقة السفارة',
      'embassy_approved': 'موافقة السفارة، بانتظار إصدار التأشيرة',
      'pending_visa': 'موافقة السفارة، بانتظار إصدار التأشيرة',
      'visa_issued': 'تم إصدار التأشيرة، بانتظار تصريح السفر',
      'pending_travel_permit': 'تم إصدار التأشيرة، بانتظار تصريح السفر',
      'travel_permit_issued': 'تم إصدار تصريح السفر، بانتظار تحديد الوجهات',
      'destinations_set': 'تم تحديد الوجهات، بانتظار وصول واستلام العاملة',
      'pending_receipt': 'تم تحديد الوجهات، بانتظار وصول واستلام العاملة',
      'received': 'تم وصول العاملة، بانتظار التسليم للعميل',
      'cancelled': 'ملغي',
      'rejected': 'مرفوض',
      'delivered': 'تم التسليم للعميل',
      'new_order': 'طلب جديد، بانتظار الربط',
      'new_orders': 'طلبات جديدة'
    };

    let translated = statusTranslations[status] || status;
    if (booking?.arrivals && booking.arrivals.length > 0) {
      const arr = booking.arrivals[0];
      if (arr.DateOfApplication) translated += ' (تطبيق)';
    }

    if (status === 'pending_external_office') {
      if (!booking?.arrivals?.[0]?.ExternalDateLinking) {
        translated = 'مازال الطلب، بانتظار الربط مع إدارة المكاتب';
      } else {
        translated = 'تم الربط مع إدارة المكاتب، بانتظار موافقة المكتب الخارجي';
      }
    }

    return translated;
  };

  const findClientParentAccount = (accountList: any[]) => {
    if (!accountList || accountList.length === 0) return '';
    
    // 1. Exact or starts with "عملاء دفعات مقدمة" / contains "دفعات مقدمة"
    const match = accountList.find((acc: any) => {
      const a = acc.JournalAccount || acc;
      const name = (a.name || '').trim();
      return name === 'عملاء دفعات مقدمة' || name === 'عملاء دفعات مقدمه' || name.startsWith('عملاء دفعات مقدمة') || name.startsWith('عملاء دفعات مقدمه') || name.includes('دفعات مقدمة');
    });
    if (match) return match.JournalAccount?.id || match.id;

    // 2. Code starts with 1104
    const codeMatch = accountList.find((acc: any) => {
      const a = acc.JournalAccount || acc;
      const code = String(a.code || '');
      const name = (a.name || '').trim();
      return code.startsWith('1104') && (a.is_category || a.is_parent || !/\d{5,}/.test(name));
    });
    if (codeMatch) return codeMatch.JournalAccount?.id || codeMatch.id;

    return '';
  };

  const openCreateAccountModal = (order?: any) => {
    const targetOrder = order || selectedOrder;
    if (!targetOrder) return;
    setSelectedOrder(targetOrder);

    const contractNumber = targetOrder.arrivals && targetOrder.arrivals.length > 0
      ? targetOrder.arrivals[0].InternalmusanedContract?.trim()
      : '';
    const clientName = targetOrder.ClientName?.trim() || '';
    
    // Auto generated standard name: اسم العميل و رقم عقده
    const defaultName = contractNumber ? `${clientName} ${contractNumber}`.trim() : clientName;

    // Calculate next sequential numeric code in Daftra starting with 1104...
    let nextNumericCode = '';
    if (accounts && accounts.length > 0) {
      let maxNum = 0;
      accounts.forEach((acc: any) => {
        const a = acc.JournalAccount || acc;
        const codeNum = parseInt(a.code, 10);
        if (!isNaN(codeNum) && String(a.code).startsWith('1104') && codeNum > maxNum) {
          maxNum = codeNum;
        }
      });
      if (maxNum > 0) {
        nextNumericCode = String(maxNum + 1);
      }
    }

    const autoParentId = findClientParentAccount(accounts);

    setAccFormData({
      name: defaultName,
      code: nextNumericCode,
      parentId: autoParentId,
    });

    setIsAccModalOpen(true);
  };

  const handleCreateAccount = async () => {
    if (!accFormData.name) {
      showToast('يرجى إدخال اسم الحساب', 'warning');
      return;
    }

    setCreatingAcc(true);
    try {
      const contractNumber = selectedOrder?.arrivals?.[0]?.InternalmusanedContract || '';
      const clientName = selectedOrder?.ClientName || selectedOrder?.client?.fullname || '';
      const clientId = selectedOrder?.client?.id || selectedOrder?.clientId || null;

      const res = await axios.post('/api/daftra/create-account', {
        name: accFormData.name,
        code: accFormData.code,
        parentId: accFormData.parentId,
        clientId,
        userId: currentUserId,
        clientName,
        contractNumber,
      });

      const newId = res.data?.id || res.data?.data?.id || res.data?.JournalAccount?.id || res.data?.data?.JournalAccount?.id || (typeof res.data?.data === 'number' ? res.data.data : null);

      if (newId) {
        const newAccountObj = {
          id: newId,
          name: accFormData.name,
          code: accFormData.code,
          JournalAccount: {
            id: newId,
            name: accFormData.name,
            code: accFormData.code,
          }
        };

        setAccounts(prev => [...prev, newAccountObj]);

        // Auto-assign to Line 1 (Client Line)
        setJournalEntry(prev => {
          const newLines = [...prev.lines];
          if (newLines.length > 0) {
            newLines[0] = { ...newLines[0], account_id: newId };
          }
          return { ...prev, lines: newLines };
        });

        setIsAccModalOpen(false);
        showToast(`تم إنشاء حساب العميل "${accFormData.name}" بنجاح في شجرة الحسابات وتم تعيينه في القيد`, 'success');
      } else {
        showToast('تم إرسال الطلب إلى دفترة بنجاح', 'info');
        setIsAccModalOpen(false);
        fetchDaftraData();
      }
    } catch (err: any) {
      console.error('Error creating account:', err);
      showToast('فشل إنشاء الحساب: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setCreatingAcc(false);
    }
  };

  const normalizeArabic = (text: string) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/[ة]/g, 'ه')
      .replace(/[ى]/g, 'ي')
      .replace(/[\s\-_]/g, '')
      .trim();
  };

  const getOfficeArabicKeyword = (officeName: string) => {
    if (!officeName) return '';
    const o = officeName.toLowerCase();
    if (o.includes('fidel') || o.includes('فيدل')) return 'فيدل';
    if (o.includes('jidar') || o.includes('جدار')) return 'جدار';
    if (o.includes('top high') || o.includes('توب هاي') || o.includes('tophigh') || o.includes('توب')) return 'توب هاي';
    if (o.includes('strepa') || o.includes('ستريبيا')) return 'ستريبيا';
    if (o.includes('job hunt') || o.includes('جوب هانت') || o.includes('jobhunt')) return 'جوب هانت';
    if (o.includes('kora') || o.includes('كورا')) return 'كورا';
    if (o.includes('ranala') || o.includes('رانال') || o.includes('رنال')) return 'رانال';
    if (o.includes('fursah') || o.includes('فرصة') || o.includes('فرصه')) return 'فرصه';
    if (o.includes('el barq') || o.includes('el-barq') || o.includes('البرق') || o.includes('barq')) return 'البرق';
    if (o.includes('shandhany') || o.includes('shandhani') || o.includes('شاندهاي') || o.includes('شاندهاني') || o.includes('ham') || o.includes('حام') || o.includes('هام')) return 'حام';
    if (o.includes('injaz') || o.includes('إنجاز') || o.includes('انجاز')) return 'انجاز';
    if (o.includes('makka') || o.includes('مكة') || o.includes('مكه')) return 'مكة';
    if (o.includes('minkara') || o.includes('منكارا')) return 'منكارا';
    if (o.includes('riasat') || o.includes('رياسات')) return 'رياسات';
    if (o.includes('rpr') || o.includes('ار بي ار')) return 'rpr';
    if (o.includes('bright') || o.includes('برايت')) return 'برايت';
    if (o.includes('adel') || o.includes('عادل')) return 'عادل';
    if (o.includes('best') || o.includes('بيست')) return 'بيست';
    if (o.includes('earth') || o.includes('ايرث')) return 'ايرث';
    return '';
  };

  const openReviewModal = (order: any) => {
    setSelectedOrder(order);
    
    const total = parseFloat(order.Total) || 0;
    const hasExplicitFields = order.AmountWithoutTax != null && order.TaxAmount != null;
    const revenue = hasExplicitFields 
      ? parseFloat(Number(order.AmountWithoutTax).toFixed(2)) 
      : parseFloat((total / 1.15).toFixed(2));
    const tax = hasExplicitFields 
      ? parseFloat(Number(order.TaxAmount).toFixed(2)) 
      : parseFloat((total - revenue).toFixed(2));

    // Try to auto-detect the cost center based on Office Contract Number or Client Name
    let matchedCostCenterId = '';
    const orderClientName = (order.ClientName || '').trim();
    const contractNumber = order.arrivals && order.arrivals.length > 0 
      ? (order.arrivals[0].InternalmusanedContract || '').trim() 
      : '';

    const normContract = contractNumber.replace(/\D/g, '');
    const normClient = normalizeArabic(orderClientName);

    if (costCenters && costCenters.length > 0) {
      const matched = costCenters.find((cc: any) => {
        const c = cc.CostCenter || cc;
        const name = (c.name || '').trim();
        const normName = normalizeArabic(name);
        const nameDigits = name.replace(/\D/g, '');

        // 1. Exact or substring match with contract digits (if contract has >= 5 digits)
        if (normContract && normContract.length >= 5 && nameDigits.includes(normContract)) {
          return true;
        }
        // 2. Full normalized client name match
        if (normClient && normClient.length >= 3 && normName.includes(normClient)) {
          return true;
        }
        // 3. All individual client words match
        const clientWords = orderClientName.split(/\s+/).filter((w: string) => w.length >= 3);
        if (clientWords.length > 0 && clientWords.every((w: string) => normName.includes(normalizeArabic(w)))) {
          return true;
        }
        return false;
      });
      if (matched) {
        const c = matched.CostCenter || matched;
        matchedCostCenterId = c.id;
      }
    }

    let matchedClientAccountId = '';
    let matchedTaxAccountId = '';
    let matchedRevenueAccountId = '';
    
    // Strictly search ONLY real posting accounts (exclude categories/journal_cat)
    const postingAccounts = accounts.filter((acc: any) => !acc.is_category && !acc.JournalAccount?.is_category);

    if (postingAccounts && postingAccounts.length > 0) {
      // 1. Strictly filter to Client sub-accounts (under عملاء دفعات مقدمة with code 1104... or 11...)
      const clientCandidateAccounts = postingAccounts.filter((acc: any) => {
        const a = acc.JournalAccount || acc;
        const code = String(a.code || '');
        return code.startsWith('1104') || code.startsWith('110');
      });

      const poolToSearch = clientCandidateAccounts.length > 0 ? clientCandidateAccounts : postingAccounts;

      const matchedClientAcc = poolToSearch.find((acc: any) => {
        const a = acc.JournalAccount || acc;
        const name = (a.name || '').trim();
        const normName = normalizeArabic(name);
        const nameDigits = name.replace(/\D/g, '');

        // 1. By contract number digits (e.g. 12210654654 in name)
        if (normContract && normContract.length >= 5 && nameDigits.includes(normContract)) {
          return true;
        }
        // 2. By client full name
        if (normClient && normClient.length >= 3 && normName.includes(normClient)) {
          return true;
        }
        // 3. By all client individual words
        const clientWords = orderClientName.split(/\s+/).filter((w: string) => w.length >= 3);
        if (clientWords.length > 0 && clientWords.every((w: string) => normName.includes(normalizeArabic(w)))) {
          return true;
        }
        return false;
      });

      if (matchedClientAcc) {
        const a = matchedClientAcc.JournalAccount || matchedClientAcc;
        matchedClientAccountId = a.id;
      }
      
      // Find tax account - ALWAYS prioritize "ضريبة المبيعات - 215001"
      const matchedTaxAcc = postingAccounts.find((acc: any) => {
        const a = acc.JournalAccount || acc;
        const name = (a.name || '').trim();
        const code = String(a.code || '');
        return code === '215001' || name.includes('ضريبة المبيعات');
      }) || postingAccounts.find((acc: any) => {
        const a = acc.JournalAccount || acc;
        const name = (a.name || '').trim();
        const code = String(a.code || '');
        const normName = normalizeArabic(name);
        return normName.includes('ضريبه') || code.startsWith('215');
      });
      if (matchedTaxAcc) {
        const a = matchedTaxAcc.JournalAccount || matchedTaxAcc;
        matchedTaxAccountId = a.id;
      }

      // Find revenue account based on Office Name using specific office keywords only
      const officeKw = getOfficeArabicKeyword(order.officeName);
      if (officeKw) {
        const normKw = normalizeArabic(officeKw);
        // Prioritize accounts that explicitly start with or contain "ايراد" and NEVER "مردود" or "مصروف"
        const matchedRevenueAcc = postingAccounts.find((acc: any) => {
          const a = acc.JournalAccount || acc;
          const name = (a.name || '').trim();
          const normName = normalizeArabic(name);
          if (normName.includes('مردود') || normName.includes('مصروف') || normName.includes('ضريب')) return false;
          return normName.startsWith('ايراد') && normName.includes(normKw);
        }) || postingAccounts.find((acc: any) => {
          const a = acc.JournalAccount || acc;
          const name = (a.name || '').trim();
          const normName = normalizeArabic(name);
          if (normName.includes('مردود') || normName.includes('مصروف') || normName.includes('ضريب')) return false;
          return normName.includes('ايراد') && normName.includes(normKw);
        });
        if (matchedRevenueAcc) {
          const a = matchedRevenueAcc.JournalAccount || matchedRevenueAcc;
          matchedRevenueAccountId = a.id;
        }
      }

      // Fallback revenue account (ايراد مبيعات / 41011 / 4101) - strictly exclude مردود
      if (!matchedRevenueAccountId) {
        const fallbackRev = postingAccounts.find((acc: any) => {
          const a = acc.JournalAccount || acc;
          const name = (a.name || '').trim();
          const normName = normalizeArabic(name);
          const code = String(a.code || '');
          if (normName.includes('مردود') || normName.includes('مصروف') || normName.includes('ضريب')) return false;
          return (normName.startsWith('ايراد') && normName.includes('مبيعات')) || code.startsWith('41011') || (normName.includes('ايراد') && (code.startsWith('4101') || code.startsWith('41')));
        });
        if (fallbackRev) {
          const a = fallbackRev.JournalAccount || fallbackRev;
          matchedRevenueAccountId = a.id;
        }
      }
    }

    const contractText = contractNumber ? ` رقم ${contractNumber}` : '';
    
    setJournalEntry({
      date: new Date().toISOString().split('T')[0],
      notes: `قيمة العقد للعميل ${order.ClientName || ''}${contractText}`,
      currency: 'SAR ريال سعودي',
      clientDebit: total,
      revenueCredit: revenue,
      taxCredit: tax,
      lines: [
        {
          id: 1,
          type: 'client',
          debit: total ? String(total) : '',
          credit: '0.00',
          account_id: matchedClientAccountId,
          cost_center_id: matchedCostCenterId,
          notes: `قيمة العقد للعميل ${order.ClientName}${contractText}`
        },
        {
          id: 2,
          type: 'revenue',
          debit: '0.00',
          credit: revenue ? String(revenue) : '',
          account_id: matchedRevenueAccountId,
          cost_center_id: matchedCostCenterId,
          notes: `إيراد العقد للعميل ${order.ClientName}${contractText}`
        },
        {
          id: 3,
          type: 'tax',
          debit: '0.00',
          credit: tax ? String(tax) : '',
          account_id: matchedTaxAccountId,
          cost_center_id: matchedCostCenterId,
          notes: `ضريبة القيمة المضافة لعقد ${order.ClientName}${contractText}`
        }
      ]
    });
    
    setIsModalOpen(true);
  };

  // Reactive auto-matching: If accounts/costCenters finish loading while the modal is open, auto-fill empty fields
  useEffect(() => {
    if (!isModalOpen || !selectedOrder || accounts.length === 0 && costCenters.length === 0) return;

    setJournalEntry((prev) => {
      if (!prev.lines || prev.lines.length === 0) return prev;

      const orderClientName = (selectedOrder.ClientName || '').trim();
      const contractNumber = selectedOrder.arrivals && selectedOrder.arrivals.length > 0 
        ? (selectedOrder.arrivals[0].InternalmusanedContract || '').trim() 
        : '';
      const normContract = contractNumber.replace(/\D/g, '');
      const normClient = normalizeArabic(orderClientName);

      // 1. Cost Center
      let matchedCostCenterId = '';
      if (costCenters && costCenters.length > 0) {
        const matched = costCenters.find((cc: any) => {
          const c = cc.CostCenter || cc;
          const name = (c.name || '').trim();
          const normName = normalizeArabic(name);
          const nameDigits = name.replace(/\D/g, '');
          if (normContract && normContract.length >= 5 && nameDigits.includes(normContract)) return true;
          if (normClient && normClient.length >= 3 && normName.includes(normClient)) return true;
          const clientWords = orderClientName.split(/\s+/).filter((w: string) => w.length >= 3);
          if (clientWords.length > 0 && clientWords.every((w: string) => normName.includes(normalizeArabic(w)))) return true;
          return false;
        });
        if (matched) {
          const c = matched.CostCenter || matched;
          matchedCostCenterId = c.id;
        }
      }

      // 2. Client Account & Revenue & Tax (Strictly postingAccounts)
      let matchedClientAccountId = '';
      let matchedTaxAccountId = '';
      let matchedRevenueAccountId = '';

      const postingAccounts = accounts.filter((acc: any) => !acc.is_category && !acc.JournalAccount?.is_category);

      if (postingAccounts && postingAccounts.length > 0) {
        const clientCandidateAccounts = postingAccounts.filter((acc: any) => {
          const a = acc.JournalAccount || acc;
          const code = String(a.code || '');
          return code.startsWith('1104') || code.startsWith('110');
        });
        const poolToSearch = clientCandidateAccounts.length > 0 ? clientCandidateAccounts : postingAccounts;

        const matchedClientAcc = poolToSearch.find((acc: any) => {
          const a = acc.JournalAccount || acc;
          const name = (a.name || '').trim();
          const normName = normalizeArabic(name);
          const nameDigits = name.replace(/\D/g, '');
          if (normContract && normContract.length >= 5 && nameDigits.includes(normContract)) return true;
          if (normClient && normClient.length >= 3 && normName.includes(normClient)) return true;
          const clientWords = orderClientName.split(/\s+/).filter((w: string) => w.length >= 3);
          if (clientWords.length > 0 && clientWords.every((w: string) => normName.includes(normalizeArabic(w)))) return true;
          return false;
        });
        if (matchedClientAcc) {
          const a = matchedClientAcc.JournalAccount || matchedClientAcc;
          matchedClientAccountId = a.id;
        }

        const matchedTaxAcc = postingAccounts.find((acc: any) => {
          const a = acc.JournalAccount || acc;
          const name = (a.name || '').trim();
          const code = String(a.code || '');
          return code === '215001' || name.includes('ضريبة المبيعات');
        }) || postingAccounts.find((acc: any) => {
          const a = acc.JournalAccount || acc;
          const name = (a.name || '').trim();
          const code = String(a.code || '');
          const normName = normalizeArabic(name);
          return normName.includes('ضريبه') || code.startsWith('215');
        });
        if (matchedTaxAcc) {
          const a = matchedTaxAcc.JournalAccount || matchedTaxAcc;
          matchedTaxAccountId = a.id;
        }

        const officeKw = getOfficeArabicKeyword(selectedOrder.officeName);
        if (officeKw) {
          const normKw = normalizeArabic(officeKw);
          // Prioritize accounts that explicitly start with or contain "ايراد" and NEVER "مردود" or "مصروف"
          const matchedRevenueAcc = postingAccounts.find((acc: any) => {
            const a = acc.JournalAccount || acc;
            const name = (a.name || '').trim();
            const normName = normalizeArabic(name);
            if (normName.includes('مردود') || normName.includes('مصروف') || normName.includes('ضريب')) return false;
            return normName.startsWith('ايراد') && normName.includes(normKw);
          }) || postingAccounts.find((acc: any) => {
            const a = acc.JournalAccount || acc;
            const name = (a.name || '').trim();
            const normName = normalizeArabic(name);
            if (normName.includes('مردود') || normName.includes('مصروف') || normName.includes('ضريب')) return false;
            return normName.includes('ايراد') && normName.includes(normKw);
          });
          if (matchedRevenueAcc) {
            const a = matchedRevenueAcc.JournalAccount || matchedRevenueAcc;
            matchedRevenueAccountId = a.id;
          }
        }

        if (!matchedRevenueAccountId) {
          const fallbackRev = postingAccounts.find((acc: any) => {
            const a = acc.JournalAccount || acc;
            const name = (a.name || '').trim();
            const normName = normalizeArabic(name);
            const code = String(a.code || '');
            if (normName.includes('مردود') || normName.includes('مصروف') || normName.includes('ضريب')) return false;
            return (normName.startsWith('ايراد') && normName.includes('مبيعات')) || code.startsWith('41011') || (normName.includes('ايراد') && (code.startsWith('4101') || code.startsWith('41')));
          });
          if (fallbackRev) {
            const a = fallbackRev.JournalAccount || fallbackRev;
            matchedRevenueAccountId = a.id;
          }
        }
      }

      let hasChanges = false;
      const updatedLines = prev.lines.map((line) => {
        let newLine = { ...line };
        // Auto-assign Cost Center if empty
        if (!newLine.cost_center_id && matchedCostCenterId) {
          newLine.cost_center_id = matchedCostCenterId;
          hasChanges = true;
        }
        // Auto-assign Accounts if empty
        if (!newLine.account_id) {
          if (newLine.type === 'client' && matchedClientAccountId) {
            newLine.account_id = matchedClientAccountId;
            hasChanges = true;
          } else if (newLine.type === 'revenue' && matchedRevenueAccountId) {
            newLine.account_id = matchedRevenueAccountId;
            hasChanges = true;
          } else if (newLine.type === 'tax' && matchedTaxAccountId) {
            newLine.account_id = matchedTaxAccountId;
            hasChanges = true;
          }
        }
        return newLine;
      });

      if (!hasChanges) return prev;
      return { ...prev, lines: updatedLines };
    });
  }, [accounts, costCenters, isModalOpen, selectedOrder]);

  const updateLine = (lineId: number, field: string, value: any) => {
    setJournalEntry(prev => ({
      ...prev,
      lines: prev.lines.map(line => line.id === lineId ? { ...line, [field]: value } : line)
    }));
  };

  const cleanAmountInput = (val: string) => {
    let cleaned = val.replace(/[,،]/g, '.');
    cleaned = cleaned.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  };

  const submitJournalEntry = async () => {
    if (!journalEntry.lines || journalEntry.lines.length === 0) {
      showToast('لا يوجد أسطر للقيد المحاسبي', 'warning');
      return;
    }

    const totalDebit = journalEntry.lines.reduce((sum, l) => sum + (parseFloat(String(l.debit)) || 0), 0);
    const totalCredit = journalEntry.lines.reduce((sum, l) => sum + (parseFloat(String(l.credit)) || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.05) {
      showToast(`تنبيه: القيد المحاسبي غير متزن! الفرق: ${(totalDebit - totalCredit).toFixed(2)} ر.س`, 'warning');
      return;
    }

    setSubmittingJournal(true);
    try {
      const contractNumber = selectedOrder?.arrivals?.[0]?.InternalmusanedContract || '';
      const clientName = selectedOrder?.ClientName || selectedOrder?.client?.fullname || '';
      const clientId = selectedOrder?.client?.id || selectedOrder?.clientId || null;

      const primaryCcId = journalEntry.lines.find(l => !!l.cost_center_id)?.cost_center_id;
      const costCenterObj = costCenters.find(c => String(c.id || c.CostCenter?.id) === String(primaryCcId));
      const costCenterName = costCenterObj ? (costCenterObj.CostCenter?.name || costCenterObj.name) : '';

      const clientAccObj = accounts.find(a => String(a.id || a.JournalAccount?.id) === String(journalEntry.lines[0]?.account_id));
      const clientAccountName = clientAccObj ? (clientAccObj.JournalAccount?.name || clientAccObj.name) : '';

      const revAccObj = accounts.find(a => String(a.id || a.JournalAccount?.id) === String(journalEntry.lines[1]?.account_id));
      const revenueAccountName = revAccObj ? (revAccObj.JournalAccount?.name || revAccObj.name) : '';

      const taxAccObj = accounts.find(a => String(a.id || a.JournalAccount?.id) === String(journalEntry.lines[2]?.account_id));
      const taxAccountName = taxAccObj ? (taxAccObj.JournalAccount?.name || taxAccObj.name) : '';

      const payload = {
        orderId: selectedOrder?.id,
        contractNumber,
        clientName,
        clientId,
        userId: currentUserId,
        date: journalEntry.date,
        notes: journalEntry.notes,
        costCenterName,
        clientAccountName,
        revenueAccountName,
        taxAccountName,
        totalAmount: totalDebit,
        revenueAmount: parseFloat(String(journalEntry.lines[1]?.credit)) || 0,
        taxAmount: parseFloat(String(journalEntry.lines[2]?.credit)) || 0,
        lines: journalEntry.lines.map((l) => ({
          ...l,
          debit: parseFloat(String(l.debit)) || 0,
          credit: parseFloat(String(l.credit)) || 0,
        }))
      };
      const res = await axios.post('/api/daftra/journal-entries', payload);
      showToast('تم ترحيل القيد إلى دفترة وتسجيله في سجل النظام المحاسبي بنجاح!', 'success');
      setIsModalOpen(false);
      fetchOrders();
    } catch (err: any) {
      console.error('Submit Error:', err);
      const daftraError = err.response?.data?.error || err.response?.data?.message;
      const errorMsg = daftraError?.message || (typeof daftraError === 'string' ? daftraError : JSON.stringify(daftraError)) || err.message;
      showToast('حدث خطأ أثناء الترحيل: ' + errorMsg, 'error');
    } finally {
      setSubmittingJournal(false);
    }
  };

  const pendingOrders = orders.filter(order => !order.isJournalPosted && order.AmountWithoutTax != null && order.TaxAmount != null);
  const postedOrders = orders.filter(order => !!order.isJournalPosted && order.AmountWithoutTax != null && order.TaxAmount != null);

  const currentList = activeTab === 'pending' ? pendingOrders : postedOrders;

  const filteredOrders = currentList.filter(order => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const idMatch = String(order.id).includes(term);
    const clientMatch = (order.ClientName || '').toLowerCase().includes(term);
    const officeMatch = (order.officeName || '').toLowerCase().includes(term);
    const daftraIdMatch = String(order.daftraJournalId || '').toLowerCase().includes(term);
    const contractMatch = order.arrivals?.some((a: any) => (a.InternalmusanedContract || '').includes(term));
    return idMatch || clientMatch || officeMatch || contractMatch || daftraIdMatch;
  });

  const totalGross = currentList.reduce((sum, o) => sum + (parseFloat(o.Total) || 0), 0);
  const totalTax = currentList.reduce((sum, o) => sum + (parseFloat(o.TaxAmount) || 0), 0);
  const totalNet = currentList.reduce((sum, o) => sum + (parseFloat(o.AmountWithoutTax) || 0), 0);

  if (checkingAuth) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-800"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-gray-900 font-sans" dir="rtl">
      <Head>
        <title>مراجعة وترحيل القيود المحاسبية</title>
      </Head>

      {/* Floating Modern Toast Notification (Top Right) */}
      {toast.show && (
        <div 
          className="fixed top-6 right-6 z-[999999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl transition-all duration-300 transform bg-white border border-gray-100 max-w-md w-[92%] sm:w-auto animate-in fade-in slide-in-from-top-2 slide-in-from-right-4"
          style={{
            boxShadow: '0 20px 30px -5px rgba(0, 0, 0, 0.18), 0 10px 15px -5px rgba(0, 0, 0, 0.08)',
            borderRight: toast.type === 'success' ? '5px solid #10B981' : toast.type === 'error' ? '5px solid #EF4444' : toast.type === 'warning' ? '5px solid #F59E0B' : '5px solid #1A4D4F'
          }}
          dir="rtl"
        >
          {toast.type === 'success' && (
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {toast.type === 'error' && (
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          {toast.type === 'warning' && (
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          )}
          {toast.type === 'info' && (
            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          
          <div className="flex-1 text-sm font-bold text-gray-800 leading-relaxed pr-1 pl-3">
            {toast.message}
          </div>

          <button 
            onClick={() => setToast(prev => ({ ...prev, show: false }))}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition shrink-0"
            title="إغلاق"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <Layout>
        <div className="flex flex-col min-h-screen">
          <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  مراجعة وترحيل القيود المحاسبية
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  مراجعة مبالغ العقود، الضرائب، وإنشاء مراكز التكلفة وحسابات العملاء وترحيلها إلى دفترة ERP
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => { fetchOrders(); fetchDaftraData(true); }}
                  disabled={fetchingDaftraData || loadingOrders}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white text-teal-800 border border-teal-200 hover:bg-teal-50/70 hover:border-teal-300 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <svg className={`w-4 h-4 text-teal-700 ${fetchingDaftraData ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{fetchingDaftraData ? 'جاري التحديث...' : 'تحديث البيانات'}</span>
                </button>
              </div>
            </div>

            {/* Quick Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border ${activeTab === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">{activeTab === 'pending' ? 'عقود بانتظار الترحيل' : 'عقود تم ترحيلها'}</p>
                  <p className="text-xl font-extrabold text-gray-900 mt-0.5">{currentList.length} عقد</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg border border-emerald-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">الإيراد قبل الضريبة</p>
                  <p className="text-xl font-extrabold text-emerald-800 mt-0.5">
                    {totalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-bold text-gray-400">ر.س</span>
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg border border-amber-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">ضريبة القيمة المضافة (15%)</p>
                  <p className="text-xl font-extrabold text-amber-800 mt-0.5">
                    {totalTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-bold text-gray-400">ر.س</span>
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-lg border border-indigo-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">إجمالي المبالغ كاملة</p>
                  <p className="text-xl font-extrabold text-indigo-900 mt-0.5">
                    {totalGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-bold text-gray-400">ر.س</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('pending')}
                className={`group relative flex items-center gap-2.5 px-5 py-3.5 text-sm font-bold transition-all border-b-2 -mb-px ${
                  activeTab === 'pending'
                    ? 'border-[#1A4D4F] text-[#1A4D4F]'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                <svg className={`w-4 h-4 ${activeTab === 'pending' ? 'text-[#1A4D4F]' : 'text-gray-400 group-hover:text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>العقود بانتظار الترحيل</span>
                <span className={`px-2 py-0.5 text-xs font-extrabold rounded-full transition ${
                  activeTab === 'pending'
                    ? 'bg-[#1A4D4F] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                }`}>
                  {pendingOrders.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('posted')}
                className={`group relative flex items-center gap-2.5 px-5 py-3.5 text-sm font-bold transition-all border-b-2 -mb-px ${
                  activeTab === 'posted'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                <svg className={`w-4 h-4 ${activeTab === 'posted' ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>القيود المرحلة لدفترة ERP</span>
                <span className={`px-2 py-0.5 text-xs font-extrabold rounded-full transition ${
                  activeTab === 'posted'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200'
                }`}>
                  {postedOrders.length}
                </span>
              </button>
            </div>

            {/* Tab Content: Orders Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Search & Filter Toolbar */}
              <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="بحث باسم العميل، رقم العقد، رقم القيد، المكتب..."
                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                  />
                  <div className="absolute right-3 top-2.5 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <span>عدد العقود المعروضة:</span>
                  <span className="font-bold text-gray-900 px-2 py-1 bg-white rounded-lg border border-gray-200 shadow-2xs">
                    {filteredOrders.length} من {currentList.length}
                  </span>
                </div>
              </div>

              {/* Orders Table */}
              {loadingOrders ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700"></div>
                  <span className="text-sm font-medium">جاري تحميل البيانات...</span>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="font-bold text-gray-700 mt-2">
                    {activeTab === 'pending' ? 'لا توجد عقود بانتظار الترحيل' : 'لا توجد قيود مرحلة حتى الآن'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {activeTab === 'pending' ? 'كافة العقود المتاحة تم ترحيلها أو لا توجد نتائج مطابقة لبحثك' : 'عند ترحيل أي قيد إلى دفترة سيظهر في هذا السجل تلقائياً'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 text-gray-700 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                        <th className="p-4 w-24">رقم العقد</th>
                        <th className="p-4">العميل</th>
                        {activeTab === 'posted' ? (
                          <>
                            <th className="p-4 text-center">رقم القيد بدفترة</th>
                            <th className="p-4 text-center">تاريخ الترحيل</th>
                          </>
                        ) : (
                          <th className="p-4">حالة الحجز</th>
                        )}
                        <th className="p-4 text-center">المبلغ بدون ضريبة</th>
                        <th className="p-4 text-center">قيمة الضريبة</th>
                        <th className="p-4 text-center">المبلغ الإجمالي</th>
                        <th className="p-4 text-center">ملف العقد</th>
                        <th className="p-4 text-center">الحالة / الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-teal-50/30 transition duration-150">
                          <td className="p-4 font-mono font-bold text-gray-900">
                            <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs">
                              #{order.arrivals?.[0]?.InternalmusanedContract?.trim() || order.id}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-gray-900">{order.ClientName || '-'}</div>
                            {order.officeName && (
                              <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block"></span>
                                <span>{order.officeName}</span>
                              </div>
                            )}
                          </td>
                          {activeTab === 'posted' ? (
                            <>
                              <td className="p-4 text-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  #{order.daftraJournalId || 'مرحل'}
                                </span>
                              </td>
                              <td className="p-4 text-center text-xs font-mono text-gray-600">
                                {order.journalPostedAt ? new Date(order.journalPostedAt).toLocaleDateString('ar-SA') : '-'}
                              </td>
                            </>
                          ) : (
                            <td className="p-4 text-right">
                              {(() => {
                                const statusText = translateBookingStatus(order.bookingstatus, order) || 'غير متوفر';
                                const statusParts = statusText.split('، ');
                                return (
                                  <div>
                                    {statusParts.map((part, index) => (
                                      <div
                                        key={index}
                                        className={
                                          index === 0 && statusParts.length > 1
                                            ? "text-[11px] text-gray-400 font-medium"
                                            : "text-xs font-bold text-teal-800 mt-0.5"
                                        }
                                      >
                                        {part}
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </td>
                          )}
                          <td className="p-4 text-center font-mono font-medium text-gray-700">
                            {order.AmountWithoutTax != null ? (
                              <span>{Number(order.AmountWithoutTax).toLocaleString()} <span className="text-[11px] text-gray-400 font-sans">ر.س</span></span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="p-4 text-center font-mono font-medium text-amber-700">
                            {order.TaxAmount != null ? (
                              <span>{Number(order.TaxAmount).toLocaleString()} <span className="text-[11px] text-gray-400 font-sans">ر.س</span></span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="p-4 text-center font-mono font-extrabold text-gray-900">
                            <span>{Number(order.Total).toLocaleString()} <span className="text-[11px] text-gray-400 font-sans">ر.س</span></span>
                          </td>
                          <td className="p-4 text-center">
                            {order.contract ? (
                              <button
                                onClick={() => {
                                  setPreviewFileUrl(order.contract);
                                  setPreviewFileName(`عقد العميل ${order.ClientName || order.id}`);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition shadow-2xs active:scale-95"
                              >
                                <svg className="w-3.5 h-3.5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>معاينة العقد</span>
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs font-medium">لا يوجد ملف</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {order.isJournalPosted ? (
                              <button
                                onClick={() => openReviewModal(order)}
                                className="inline-flex items-center justify-center gap-1.5 w-full max-w-[170px] mx-auto px-3.5 py-2 text-xs font-bold rounded-xl text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs active:scale-95"
                              >
                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>معاينة القيد المرحل</span>
                              </button>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1.5 w-full max-w-[170px] mx-auto">
                                <button
                                  onClick={() => openReviewModal(order)}
                                  className="inline-flex items-center justify-center gap-1.5 w-full px-3.5 py-2 text-xs font-bold rounded-xl text-white bg-[#1A4D4F] hover:bg-[#164044] transition shadow-sm active:scale-95"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                  </svg>
                                  <span>مراجعة القيد للترحيل</span>
                                </button>
                                <button
                                  onClick={() => openManualModal(order)}
                                  title="نقل إلى قائمة المرحلات بدون إرسال لدفترة (في حال تم ترحيله مسبقاً يدوياً)"
                                  className="inline-flex items-center justify-center gap-1.5 w-full px-3.5 py-2 text-xs font-bold rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition shadow-2xs active:scale-95"
                                >
                                  <svg className="w-3.5 h-3.5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>تم ترحيله مسبقاً</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </main>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto" dir="rtl">
            <div className="rounded-3xl bg-white shadow-2xl border border-gray-100 max-w-6xl w-[96vw] my-auto overflow-hidden flex flex-col transition-all">
              
              {/* Modal Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-gray-50 via-teal-50/20 to-white border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1A4D4F] text-white flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-900">
                        مراجعة وترحيل قيد العقد #{selectedOrder?.arrivals?.[0]?.InternalmusanedContract?.trim() || selectedOrder?.id}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                        دفترة ERP
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                      <span>العميل: <strong className="text-gray-800">{selectedOrder?.ClientName || '-'}</strong></span>
                      {selectedOrder?.arrivals?.[0]?.InternalmusanedContract && (
                        <span>• رقم عقد إدارة المكاتب: <strong className="text-gray-800 font-mono">{selectedOrder.arrivals[0].InternalmusanedContract}</strong></span>
                      )}
                      {selectedOrder?.officeName && (
                        <span>• المكتب: <strong className="text-gray-800">{selectedOrder.officeName}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedOrder?.contract && (
                    <button
                      onClick={() => {
                        setPreviewFileUrl(selectedOrder.contract);
                        setPreviewFileName(`عقد العميل ${selectedOrder.ClientName || selectedOrder.id}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition shadow-2xs active:scale-95"
                    >
                      <svg className="w-4 h-4 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>معاينة ملف العقد</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
                    title="إغلاق"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)] flex flex-col gap-5">
                
                {/* Notice if already posted */}
                {selectedOrder?.isJournalPosted && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 font-bold text-sm">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-emerald-800 text-base">تم ترحيل هذا القيد مسبقاً إلى دفترة ERP بنجاح</p>
                      <p className="text-xs text-emerald-600 font-normal mt-0.5">
                        رقم القيد بدفترة: <strong className="font-mono text-emerald-900">#{selectedOrder.daftraJournalId || '-'}</strong>
                        {selectedOrder.journalPostedAt && ` • تاريخ الترحيل: ${new Date(selectedOrder.journalPostedAt).toLocaleDateString('ar-SA')}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Top Section: Date, Currency & Description */}
                <div className="bg-gray-50/80 rounded-2xl p-4 sm:p-5 border border-gray-200 grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Right Column: Date & Currency */}
                  <div className="lg:col-span-5 flex flex-col gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        تاريخ القيد
                      </label>
                      <div className="relative">
                        <input 
                          type="date" 
                          value={journalEntry.date}
                          onChange={(e) => setJournalEntry({...journalEntry, date: e.target.value})}
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl bg-white text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition shadow-2xs" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        عملة القيد
                      </label>
                      <div className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl bg-gray-100/70 text-sm font-semibold text-gray-700 flex items-center justify-between">
                        <span>ريال سعودي (SAR)</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-white border border-gray-200 font-mono text-gray-500">SAR</span>
                      </div>
                    </div>
                  </div>

                  {/* Left Column: Description */}
                  <div className="lg:col-span-7 flex flex-col">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      الوصف العام للقيد
                    </label>
                    <textarea 
                      rows={3} 
                      value={journalEntry.notes}
                      onChange={(e) => setJournalEntry({...journalEntry, notes: e.target.value})}
                      placeholder="أدخل وصف أو ملاحظات القيد المحاسبي..."
                      className="w-full flex-1 p-3 border border-gray-300 rounded-xl bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition shadow-2xs resize-none" 
                    ></textarea>
                  </div>
                </div>

                {/* Journal Table */}
                <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-2xs bg-white">
                  <div className="overflow-x-visible">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-gray-50/90 text-gray-700 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                          <th className="p-3.5 w-[28%]">
                            <div className="flex items-center justify-between gap-2">
                              <span>اسم الحساب <span className="text-red-500">*</span></span>
                              {!journalEntry.lines[0]?.account_id && (
                                <button
                                  type="button"
                                  onClick={() => openCreateAccountModal()}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-teal-50 text-teal-800 border border-teal-300 hover:bg-teal-100 transition shadow-2xs"
                                >
                                  <span className="text-sm leading-none">+</span>
                                  <span>إنشاء حساب العميل</span>
                                </button>
                              )}
                            </div>
                          </th>
                          <th className="p-3.5 w-[24%]">الوصف والبيان</th>
                          <th className="p-3.5 w-[28%]">
                            <div className="flex items-center justify-between gap-2">
                              <span>مركز التكلفة</span>
                              {!journalEntry.lines.some((l: any) => !!l.cost_center_id) && (
                                <button
                                  type="button"
                                  onClick={() => openCreateCostCenterModal()}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-teal-50 text-teal-800 border border-teal-300 hover:bg-teal-100 transition shadow-2xs"
                                >
                                  <span className="text-sm leading-none">+</span>
                                  <span>إنشاء مركز التكلفة</span>
                                </button>
                              )}
                            </div>
                          </th>
                          <th className="p-3.5 w-[10%] text-center font-bold text-gray-800">
                            مدين <span className="text-red-500">*</span>
                          </th>
                          <th className="p-3.5 w-[10%] text-center font-bold text-gray-800">
                            دائن <span className="text-red-500">*</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {journalEntry.lines.map((line, index) => (
                          <tr key={line.id} className="hover:bg-gray-50/70 transition">
                            <td className="p-3 border-l border-gray-100">
                              <Select
                                isRtl={true}
                                isSearchable={true}
                                placeholder="-- اختر الحساب --"
                                options={accountOptions}
                                menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                                styles={{ 
                                  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                                  control: (base: any, state: any) => ({ 
                                    ...base, 
                                    minHeight: '38px', 
                                    backgroundColor: '#fff', 
                                    borderRadius: '10px',
                                    borderColor: state.isFocused ? '#1A4D4F' : '#E2E8F0',
                                    boxShadow: 'none',
                                    fontSize: '13px'
                                  }),
                                  input: (base: any) => ({ ...base, border: 'none !important', outline: 'none !important', boxShadow: 'none !important' })
                                }}
                                value={accountOptions.find(opt => String(opt.value) === String(line.account_id)) || null}
                                onChange={(selected: any) => updateLine(line.id, 'account_id', selected ? selected.value : '')}
                              />
                            </td>
                            <td className="p-3 border-l border-gray-100">
                              <input
                                type="text"
                                value={line.notes}
                                onChange={(e) => updateLine(line.id, 'notes', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 transition"
                                placeholder="الوصف والبيان"
                              />
                            </td>
                            <td className="p-3 border-l border-gray-100">
                              <Select
                                isRtl={true}
                                isSearchable={true}
                                placeholder="بدون مركز تكلفة"
                                isClearable={true}
                                options={costCenterOptions}
                                menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                                styles={{ 
                                  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                                  control: (base: any, state: any) => ({ 
                                    ...base, 
                                    minHeight: '38px', 
                                    backgroundColor: '#fff', 
                                    borderRadius: '10px',
                                    borderColor: state.isFocused ? '#1A4D4F' : '#E2E8F0',
                                    boxShadow: 'none',
                                    fontSize: '13px'
                                  }),
                                  input: (base: any) => ({ ...base, border: 'none !important', outline: 'none !important', boxShadow: 'none !important' })
                                }}
                                value={costCenterOptions.find(opt => String(opt.value) === String(line.cost_center_id)) || null}
                                onChange={(selected: any) => updateLine(line.id, 'cost_center_id', selected ? selected.value : '')}
                              />
                            </td>
                            <td className="p-3 border-l border-gray-100 text-center">
                              <input 
                                type="text" 
                                inputMode="decimal"
                                dir="ltr"
                                value={line.debit !== undefined && line.debit !== null ? String(line.debit) : ''} 
                                onChange={(e) => {
                                  const val = cleanAmountInput(e.target.value);
                                  updateLine(line.id, 'debit', val);
                                }}
                                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center font-mono font-bold text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 transition" 
                                placeholder="0.00"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input 
                                type="text" 
                                inputMode="decimal"
                                dir="ltr"
                                value={line.credit !== undefined && line.credit !== null ? String(line.credit) : ''} 
                                onChange={(e) => {
                                  const val = cleanAmountInput(e.target.value);
                                  updateLine(line.id, 'credit', val);
                                }}
                                className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-center font-mono font-bold text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 transition" 
                                placeholder="0.00"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      
                      {/* Footer Totals */}
                      {(() => {
                        const totalDebit = journalEntry.lines.reduce((sum, l) => sum + (parseFloat(String(l.debit)) || 0), 0);
                        const totalCredit = journalEntry.lines.reduce((sum, l) => sum + (parseFloat(String(l.credit)) || 0), 0);
                        const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

                        return (
                          <tfoot className="bg-gray-50/90 border-t-2 border-gray-200 font-bold">
                            <tr>
                              <td colSpan={3} className="p-3.5 text-left border-l border-gray-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-700 font-bold text-sm">إجمالي القيد المحاسبي:</span>
                                  <span 
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-2xs"
                                    style={isBalanced ? {
                                      backgroundColor: '#DCFCE7',
                                      color: '#15803D',
                                      border: '1.5px solid #86EFAC'
                                    } : {
                                      backgroundColor: '#FEE2E2',
                                      color: '#B91C1C',
                                      border: '1.5px solid #FCA5A5'
                                    }}
                                  >
                                    {isBalanced ? (
                                      <>
                                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>القيد متزن (0.00 ر.س)</span>
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span>يوجد فرق: {Math.abs(totalDebit - totalCredit).toFixed(2)} ر.س</span>
                                      </>
                                    )}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3.5 text-center font-mono text-base font-extrabold text-gray-900 border-l border-gray-200">
                                {totalDebit.toFixed(2)}
                              </td>
                              <td className="p-3.5 text-center font-mono text-base font-extrabold text-gray-900">
                                {totalCredit.toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        );
                      })()}
                    </table>
                  </div>
                </div>

              </div>

              {/* Modal Footer Action Bar */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-wrap gap-3">
                <div className="text-xs text-gray-500 font-medium">
                  يتم ترحيل القيد كقيد يومية معتمد ومربوط بمراكز التكلفة في دفترة.
                </div>
                
                <div className="flex items-center gap-3">
                  {!selectedOrder?.isJournalPosted && (
                    <button
                      type="button"
                      onClick={() => openManualModal(selectedOrder)}
                      className="px-3.5 py-2.5 border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95"
                    >
                      <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>تم ترحيله مسبقاً (يدوياً)</span>
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)} 
                    className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-100 transition"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="button"
                    disabled={submittingJournal || selectedOrder?.isJournalPosted}
                    onClick={submitJournalEntry} 
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-75 ${
                      selectedOrder?.isJournalPosted
                        ? 'bg-emerald-700 text-white cursor-not-allowed'
                        : 'bg-[#1A4D4F] hover:bg-[#164044] text-white hover:shadow-lg'
                    }`}
                  >
                    {submittingJournal ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>جاري ترحيل القيد لدفترة...</span>
                      </>
                    ) : selectedOrder?.isJournalPosted ? (
                      <>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>تم ترحيل هذا القيد مسبقاً لدفترة</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>اعتماد وترحيل إلى دفترة</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Inline Contract Preview Modal */}
        {previewFileUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm" dir="rtl">
            <div className="rounded-xl bg-white w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-teal-100 text-teal-800 rounded-md">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-800 text-base">{previewFileName || 'معاينة ملف العقد'}</h3>
                </div>
                
                <div className="flex items-center gap-3">
                  <a
                    href={previewFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-white border border-teal-300 rounded hover:bg-teal-50 transition shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    فتح في نافذة خارجية
                  </a>
                  <button
                    onClick={() => setPreviewFileUrl(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Document Frame / Viewer */}
              <div className="flex-1 bg-gray-100 p-2 overflow-hidden">
                <iframe
                  src={previewFileUrl}
                  className="w-full h-full rounded border border-gray-300 bg-white"
                  title="معاينة ملف العقد"
                />
              </div>
            </div>
          </div>
        )}

        {/* Create Cost Center Modal */}
        {isCcModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
            <div className="rounded-xl bg-white w-full max-w-lg shadow-2xl overflow-hidden border border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#1A4D4F] text-white rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">إنشاء مركز تكلفة في دفترة</h3>
                </div>
                <button
                  onClick={() => setIsCcModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    اسم مركز التكلفة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ccFormData.name}
                    onChange={(e) => setCcFormData({ ...ccFormData, name: e.target.value })}
                    placeholder="اسم العميل ورقم العقد"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">تمت صياغة الاسم تلقائياً بصيغة: اسم العميل ورقم عقده في مساند.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    كود مركز التكلفة (اختياري)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={ccFormData.code}
                    onChange={(e) => setCcFormData({ ...ccFormData, code: e.target.value.replace(/\D/g, '') })}
                    placeholder="تلقائي من دفترة (أرقام فقط)"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-left focus:border-teal-600 focus:ring-1 focus:ring-teal-600 font-mono"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">يُقترح الرقم التسلسلي التالي في دفترة تلقائياً (يقبل أرقام فقط).</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700">
                      المركز الرئيسي التابع له (المكتب)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-teal-800 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={ccFormData.isPrimary}
                        onChange={(e) => setCcFormData({ ...ccFormData, isPrimary: e.target.checked })}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span>إنشاء كمركز رئيسي جديد (بدون أب)</span>
                    </label>
                  </div>

                  {!ccFormData.isPrimary && (
                    <Select
                      isRtl={true}
                      isSearchable={true}
                      placeholder="-- اختر المركز الرئيسي (المكتب) --"
                      options={parentCostCenterOptions}
                      value={parentCostCenterOptions.find(opt => opt.value == ccFormData.parentId) || null}
                      onChange={(selected: any) => setCcFormData({ ...ccFormData, parentId: selected ? selected.value : '' })}
                      menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                      menuPosition="fixed"
                      styles={{
                        menuPortal: (base: any) => ({ ...base, zIndex: 999999 }),
                        control: (base: any, state: any) => ({
                          ...base,
                          minHeight: '42px',
                          borderRadius: '8px',
                          borderColor: state.isFocused ? '#1A4D4F' : '#d1d5db',
                          boxShadow: 'none',
                          '&:hover': { borderColor: '#1A4D4F' }
                        }),
                        input: (base: any) => ({
                          ...base,
                          border: 'none !important',
                          outline: 'none !important',
                          boxShadow: 'none !important',
                          '& input': {
                            border: 'none !important',
                            outline: 'none !important',
                            boxShadow: 'none !important',
                          }
                        })
                      }}
                    />
                  )}
                  <p className="text-[11px] text-gray-500 mt-1">
                    تم تحديد المركز الرئيسي تلقائياً وفقاً لمكتب الاستقدام الخاص بالعقد. يمكنك تغييره حسب الحاجة.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-5 py-3.5 bg-gray-50 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCcModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={creatingCc || !ccFormData.name}
                  onClick={handleCreateCostCenter}
                  className="px-5 py-2 bg-[#1A4D4F] text-white rounded-lg text-sm font-bold hover:bg-[#164044] transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {creatingCc ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>جاري الإنشاء في دفترة...</span>
                    </>
                  ) : (
                    <span>إنشاء في دفترة وتعيين في القيد</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Account Modal */}
        {isAccModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
            <div className="rounded-xl bg-white w-full max-w-lg shadow-2xl overflow-hidden border border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#1A4D4F] text-white rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">إنشاء حساب عميل في دفترة</h3>
                </div>
                <button
                  onClick={() => setIsAccModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    نوع الحساب
                  </label>
                  <div className="w-full p-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700 font-medium">
                    حساب فرعي (مدين)
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    اسم الحساب <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accFormData.name}
                    onChange={(e) => setAccFormData({ ...accFormData, name: e.target.value })}
                    placeholder="اسم العميل ورقم العقد"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">تمت صياغة الاسم تلقائياً بصيغة: اسم العميل ورقم عقده في مساند.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    كود الحساب (اختياري)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    value={accFormData.code}
                    onChange={(e) => setAccFormData({ ...accFormData, code: e.target.value.replace(/\D/g, '') })}
                    placeholder="تلقائي من دفترة (أرقام فقط)"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-left focus:border-teal-600 focus:ring-1 focus:ring-teal-600 font-mono"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">يُقترح الرقم التسلسلي التالي تحت عملاء دفعات مقدمة (يقبل أرقام فقط).</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    الحساب الرئيسي التابع له <span className="text-red-500">*</span>
                  </label>
                  <Select
                    isRtl={true}
                    isSearchable={true}
                    placeholder="-- اختر الحساب الرئيسي (مثل عملاء دفعات مقدمة) --"
                    options={parentAccountOptions}
                    value={parentAccountOptions.find(opt => opt.value == accFormData.parentId) || null}
                    onChange={(selected: any) => setAccFormData({ ...accFormData, parentId: selected ? selected.value : '' })}
                    menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                    menuPosition="fixed"
                    styles={{
                      menuPortal: (base: any) => ({ ...base, zIndex: 999999 }),
                      control: (base: any, state: any) => ({
                        ...base,
                        minHeight: '42px',
                        borderRadius: '8px',
                        borderColor: state.isFocused ? '#1A4D4F' : '#d1d5db',
                        boxShadow: 'none',
                        '&:hover': { borderColor: '#1A4D4F' }
                      }),
                      input: (base: any) => ({
                        ...base,
                        border: 'none !important',
                        outline: 'none !important',
                        boxShadow: 'none !important',
                        '& input': {
                          border: 'none !important',
                          outline: 'none !important',
                          boxShadow: 'none !important',
                        }
                      })
                    }}
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    تم تحديد الحساب الرئيسي تلقائياً على "عملاء دفعات مقدمة". يمكنك تغييره إذا لزم الأمر.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-5 py-3.5 bg-gray-50 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAccModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={creatingAcc || !accFormData.name}
                  onClick={handleCreateAccount}
                  className="px-5 py-2 bg-[#1A4D4F] text-white rounded-lg text-sm font-bold hover:bg-[#164044] transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {creatingAcc ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>جاري الإنشاء في دفترة...</span>
                    </>
                  ) : (
                    <span>إنشاء في دفترة وتعيين في القيد</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Mark Manually Posted Modal */}
        {isManualModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
            <div className="rounded-2xl bg-white w-full max-w-lg shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 via-teal-50/30 to-white border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1A4D4F] text-white flex items-center justify-center shadow-sm" style={{ backgroundColor: '#1A4D4F', color: '#ffffff' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">تعيين القيد كمرحل مسبقاً</h3>
                    <p className="text-xs text-gray-500 mt-0.5">نقل العقد لقائمة القيود المرحلة دون إعادة إرساله لدفترة</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Order Summary Box */}
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">اسم العميل:</span>
                    <strong className="text-gray-900 font-bold">{manualTargetOrder?.ClientName || '-'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">رقم العقد:</span>
                    <strong className="text-gray-900 font-mono font-bold">
                      {manualTargetOrder?.arrivals?.[0]?.InternalmusanedContract || `#${manualTargetOrder?.id}`}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">إجمالي المبلغ:</span>
                    <strong className="text-teal-900 font-bold font-mono">
                      {manualTargetOrder?.Total ? `${Number(manualTargetOrder.Total).toLocaleString()} ر.س` : '-'}
                    </strong>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    يُستخدم هذا الإجراء في حال تم إنشاء القيد المحاسبي مسبقاً داخل دفترة يدوياً، لتفادي تكرار القيد مع تحديث حالته في النظام.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    رقم القيد بدفترة (اختياري)
                  </label>
                  <input
                    type="text"
                    value={manualJournalNumber}
                    onChange={(e) => setManualJournalNumber(e.target.value)}
                    placeholder="مثال: 685 أو اتركه فارغاً ليُسجل 'مرحل يدوياً'"
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    ملاحظات أو بيان (اختياري)
                  </label>
                  <textarea
                    rows={2}
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="ملاحظات توضيحية حول التسجيل اليدوي..."
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={submittingManual}
                  onClick={handleMarkManuallyPosted}
                  style={{ backgroundColor: '#1A4D4F', color: '#ffffff' }}
                  className="px-5 py-2.5 bg-[#1A4D4F] text-white rounded-xl text-sm font-bold hover:bg-[#164044] transition disabled:opacity-50 flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
                >
                  {submittingManual ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span style={{ color: '#ffffff' }}>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span style={{ color: '#ffffff' }}>تأكيد النقل إلى القيود المرحلة</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </div>
  );
}
