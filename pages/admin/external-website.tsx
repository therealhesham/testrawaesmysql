import React, { useState, useEffect } from "react";
import Layout from "example/containers/Layout";
import Head from "next/head";
import axios from "axios";
import { 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaEye, 
  FaEyeSlash, 
  FaImage, 
  FaUpload, 
  FaUndo, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaGlobe, 
  FaSpinner, 
  FaBorderAll, 
  FaTimes, 
  FaExternalLinkAlt, 
  FaSearch, 
  FaSlidersH,
  FaRulerCombined,
  FaCheck,
  FaHistory,
  FaFolderOpen,
  FaChartLine,
  FaUsers,
  FaClipboardList,
  FaAward,
  FaStar,
  FaTrophy,
  FaThumbsUp,
  FaShieldAlt,
  FaHeart,
  FaSave
} from "react-icons/fa";

interface ToastState {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => Promise<void> | void;
}

interface BannerHistoryItem {
  id: number;
  imageUrl: string;
  fileName?: string;
  createdAt: string;
}

interface StatItem {
  id: number;
  number: number;
  prefix: string;
  label: string;
  highlightWord: string;
  icon: string;
}

interface StatsSettings {
  showSection: boolean;
  sectionTitle: string;
  items: StatItem[];
}

const DEFAULT_STATS: StatsSettings = {
  showSection: true,
  sectionTitle: "إحصائياتنا",
  items: [
    {
      id: 1,
      number: 1000,
      prefix: "+",
      label: "عدد عملائنا السعداء",
      highlightWord: "عملائنا",
      icon: "users"
    },
    {
      id: 2,
      number: 1000,
      prefix: "+",
      label: "عدد العقود المنجزة",
      highlightWord: "العقود",
      icon: "contracts"
    },
    {
      id: 3,
      number: 600,
      prefix: "+",
      label: "عدد العاملات المتميزات المتاحات",
      highlightWord: "العاملات",
      icon: "badge"
    }
  ]
};

const AVAILABLE_ICONS = [
  { id: "users", label: "عملاء (Users)", icon: FaUsers },
  { id: "contracts", label: "عقود (Contracts)", icon: FaClipboardList },
  { id: "badge", label: "عامِلات / توثيق (Badge)", icon: FaAward },
  { id: "star", label: "تقييم / جودة (Star)", icon: FaStar },
  { id: "award", label: "تميز / إنجاز (Trophy)", icon: FaTrophy },
  { id: "thumbsup", label: "رضا وثقة (ThumbsUp)", icon: FaThumbsUp },
  { id: "shield", label: "ضمان وأمان (Shield)", icon: FaShieldAlt },
  { id: "heart", label: "وفاء ورعاية (Heart)", icon: FaHeart }
];

export default function ExternalWebsiteControl() {
  const [activeTab, setActiveTab] = useState<"banner" | "stats" | "cards">("banner");

  // --- Toast System ---
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- Confirmation Modal System ---
  const [confirmModal, setConfirmModal] = useState<ConfirmState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const openConfirm = (opts: Omit<ConfirmState, "isOpen">) => {
    setConfirmModal({ ...opts, isOpen: true });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // --- Banner State ---
  const [bannerUrl, setBannerUrl] = useState<string>("/banner.png");
  const [showBorder, setShowBorder] = useState<boolean>(true);
  const [bannerLoading, setBannerLoading] = useState<boolean>(true);
  const [bannerUploading, setBannerUploading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);

  // --- Banner History (Media Library) ---
  const [bannerHistory, setBannerHistory] = useState<BannerHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // --- Statistics State ---
  const [stats, setStats] = useState<StatsSettings>(DEFAULT_STATS);
  const [statsSaving, setStatsSaving] = useState<boolean>(false);

  // --- Cards State ---
  const [cards, setCards] = useState<any[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state for Cards
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardSaving, setCardSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    countryArabic: "",
    countryEnglish: "",
    flagUrl: "",
    price: "",
    oldPrice: "",
    sortOrder: 0,
    isActive: true
  });

  // Fetch Website Settings (Banner + Stats)
  const fetchSettings = async () => {
    setBannerLoading(true);
    try {
      const { data } = await axios.get("/api/website-settings");
      const url = data?.heroBannerUrl || "/banner.png";
      const border = data?.showBorder !== undefined ? data.showBorder : true;
      setBannerUrl(url);
      setShowBorder(border);
      setImgError(false);
      if (data?.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching website settings:", err);
      showToast("تعذر جلب إعدادات الموقع الحالية", "error");
    } finally {
      setBannerLoading(false);
    }
  };

  // Fetch Banner History
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await axios.get("/api/website-settings/history");
      setBannerHistory(data || []);
    } catch (err) {
      console.error("Error fetching banner history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch Nationality Cards
  const fetchCards = async () => {
    setCardsLoading(true);
    try {
      const { data } = await axios.get("/api/nationality-cards");
      setCards(data || []);
    } catch (err) {
      console.error(err);
      showToast("حدث خطأ أثناء جلب بطاقات الجنسيات", "error");
    } finally {
      setCardsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchHistory();
    fetchCards();
  }, []);

  useEffect(() => {
    setImgError(false);
  }, [bannerUrl]);

  // Save Banner Setting
  const handleSaveBanner = async (newUrl?: string, newBorder?: boolean) => {
    const targetUrl = newUrl !== undefined ? newUrl : bannerUrl;
    const targetBorder = newBorder !== undefined ? newBorder : showBorder;
    try {
      const { data } = await axios.post("/api/website-settings", {
        heroBannerUrl: targetUrl.trim() || "/banner.png",
        showBorder: targetBorder
      });
      const saved = data?.heroBannerUrl || targetUrl.trim() || "/banner.png";
      setBannerUrl(saved);
      setShowBorder(data?.showBorder !== undefined ? data.showBorder : targetBorder);
      setImgError(false);
      fetchHistory();
      showToast("تم تحديث البانر بنجاح وتطبيقه في الموقع!", "success");
    } catch (err: any) {
      console.error("Error saving banner:", err);
      showToast(err.response?.data?.error || "حدث خطأ أثناء حفظ الإعدادات", "error");
    }
  };

  // Save Stats Setting
  const handleSaveStats = async (newStats?: StatsSettings) => {
    const target = newStats || stats;
    setStatsSaving(true);
    try {
      await axios.post("/api/website-settings", {
        stats: target
      });
      setStats(target);
      showToast("تم حفظ وتحديث إحصائيات الموقع بنجاح!", "success");
    } catch (err: any) {
      console.error("Error saving stats:", err);
      showToast("حدث خطأ أثناء حفظ الإحصائيات", "error");
    } finally {
      setStatsSaving(false);
    }
  };

  // Reset Stats to Default
  const handleResetDefaultStats = () => {
    openConfirm({
      title: "استعادة الإحصائيات الافتراضية",
      message: "هل أنت متأكد من رغبتك في استعادة أرقام ونصوص وأيقونات الإحصائيات الافتراضية؟",
      confirmText: "نعم، استعادة",
      cancelText: "إلغاء",
      isDangerous: false,
      onConfirm: async () => {
        await handleSaveStats(DEFAULT_STATS);
      }
    });
  };

  // Select a previously uploaded banner from history
  const handleSelectHistoryImage = async (imgUrl: string) => {
    if (imgUrl === bannerUrl) return;
    await handleSaveBanner(imgUrl, showBorder);
  };

  // Delete an image from history
  const handleDeleteHistoryImage = (id: number) => {
    openConfirm({
      title: "حذف الصورة من السجل",
      message: "هل أنت متأكد من حذف هذه الصورة من سجل الصور السابقة؟",
      confirmText: "نعم، حذف من السجل",
      cancelText: "إلغاء",
      isDangerous: true,
      onConfirm: async () => {
        try {
          await axios.delete(`/api/website-settings/history?id=${id}`);
          setBannerHistory(prev => prev.filter(item => item.id !== id));
          showToast("تم حذف الصورة من السجل بنجاح", "info");
        } catch (err) {
          console.error(err);
          showToast("حدث خطأ أثناء حذف الصورة من السجل", "error");
        }
      }
    });
  };

  // Reset Banner to Default
  const handleResetDefaultBanner = () => {
    openConfirm({
      title: "استعادة الصورة الافتراضية",
      message: "هل أنت متأكد من رغبتك في استعادة صورة البانر الأصلية والإطار الافتراضي للموقع؟",
      confirmText: "نعم، استعادة",
      cancelText: "إلغاء",
      isDangerous: false,
      onConfirm: async () => {
        setShowBorder(true);
        setImgError(false);
        await handleSaveBanner("/banner.png", true);
      }
    });
  };

  // Process File Upload
  const handleUploadFile = async (file: File) => {
    setBannerUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Content = (reader.result as string).split(",")[1];
          const res = await axios.post("/api/upload-image", {
            file: base64Content,
            filename: file.name,
            contentType: file.type
          });

          if (res.data && res.data.url) {
            const uploadedUrl = res.data.url;
            setBannerUrl(uploadedUrl);
            setImgError(false);
            await handleSaveBanner(uploadedUrl, showBorder);
          } else {
            throw new Error(res.data?.error || "فشل في حفظ الصورة");
          }
        } catch (uploadErr: any) {
          console.error("Upload error:", uploadErr);
          showToast(uploadErr.response?.data?.error || "حدث خطأ أثناء رفع الصورة", "error");
        } finally {
          setBannerUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showToast("حدث خطأ أثناء قراءة ملف الصورة", "error");
      setBannerUploading(false);
    }
  };

  // Handle Input File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  // Handle Drag and Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        handleUploadFile(file);
      } else {
        showToast("يرجى اختيار ملف صورة صالح", "error");
      }
    }
  };

  // Update a single stat item field
  const handleUpdateStatItem = (index: number, field: keyof StatItem, value: any) => {
    setStats(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      return {
        ...prev,
        items: newItems
      };
    });
  };

  // --- Cards handlers ---
  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({
      countryArabic: "",
      countryEnglish: "",
      flagUrl: "",
      price: "",
      oldPrice: "",
      sortOrder: cards.length + 1,
      isActive: true
    });
    setShowCardModal(true);
  };

  const openEditModal = (card: any) => {
    setEditId(card.id);
    setFormData({
      countryArabic: card.countryArabic,
      countryEnglish: card.countryEnglish,
      flagUrl: card.flagUrl,
      price: card.price,
      oldPrice: card.oldPrice || "",
      sortOrder: card.sortOrder,
      isActive: card.isActive
    });
    setShowCardModal(true);
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardSaving(true);
    try {
      if (editId) {
        await axios.put(`/api/nationality-cards/${editId}`, formData);
        showToast("تم تحديث بطاقة الجنسية بنجاح!", "success");
      } else {
        await axios.post("/api/nationality-cards", formData);
        showToast("تمت إضافة بطاقة الجنسية بنجاح!", "success");
      }
      setShowCardModal(false);
      fetchCards();
    } catch (err) {
      console.error(err);
      showToast("حدث خطأ أثناء حفظ البطاقة", "error");
    } finally {
      setCardSaving(false);
    }
  };

  const handleCardDelete = (id: number, countryName: string) => {
    openConfirm({
      title: "تأكيد حذف البطاقة",
      message: `هل أنت متأكد من حذف بطاقة جنسية (${countryName})؟`,
      confirmText: "نعم، حذف",
      cancelText: "إلغاء",
      isDangerous: true,
      onConfirm: async () => {
        try {
          await axios.delete(`/api/nationality-cards/${id}`);
          showToast(`تم حذف بطاقة (${countryName}) بنجاح`, "info");
          fetchCards();
        } catch (err) {
          console.error(err);
          showToast("حدث خطأ أثناء حذف البطاقة", "error");
        }
      }
    });
  };
  
  const toggleCardStatus = async (card: any) => {
    try {
      const nextStatus = !card.isActive;
      await axios.put(`/api/nationality-cards/${card.id}`, { ...card, isActive: nextStatus });
      showToast(`تم ${nextStatus ? 'إظهار' : 'إخفاء'} بطاقة (${card.countryArabic}) بنجاح`, "info");
      fetchCards();
    } catch(err) {
      console.error(err);
      showToast("حدث خطأ أثناء تعديل حالة البطاقة", "error");
    }
  };

  const filteredCards = cards.filter(c => 
    (c.countryArabic && c.countryArabic.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.countryEnglish && c.countryEnglish.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeCardsCount = cards.filter(c => c.isActive).length;
  const inactiveCardsCount = cards.length - activeCardsCount;

  return (
    <Layout>
      <Head>
        <title>التحكم في الموقع الخارجي | لوحة وصل</title>
      </Head>
      
      {/* --- Floating Toast Container --- */}
      <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-2xl border text-sm font-bold transition-all duration-300 ${
              toast.type === "success"
                ? "bg-green-600 text-white border-green-500 shadow-green-900/30"
                : toast.type === "error"
                ? "bg-red-600 text-white border-red-500 shadow-red-900/30"
                : "bg-blue-600 text-white border-blue-500 shadow-blue-900/30"
            }`}
            dir="rtl"
          >
            <div className="flex items-center gap-3">
              {toast.type === "success" && <FaCheckCircle className="text-xl flex-shrink-0" />}
              {toast.type === "error" && <FaExclamationCircle className="text-xl flex-shrink-0" />}
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors ml-1 flex-shrink-0"
              title="إغلاق"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl" dir="rtl">
        {/* --- Top Header Banner --- */}
        <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl mb-8 border border-gray-800">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-blue-600 text-white rounded-xl shadow-lg">
                <FaGlobe className="text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-wide mb-1">التحكم في الموقع الخارجي</h1>
                <p className="text-gray-300 text-xs sm:text-sm">
                  إدارة صورة البانر، قسم الإحصائيات (إحصائياتنا)، وبطاقات الجنسيات والأسعار المعروضة في موقع العملاء
                </p>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-1.5 bg-gray-800 p-1.5 rounded-xl border border-gray-700 w-full lg:w-auto justify-center sm:justify-start flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab("banner")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
                  activeTab === "banner"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                <FaImage /> بانر الواجهة
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("stats")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
                  activeTab === "stats"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                <FaChartLine /> إحصائياتنا ({stats.items?.length || 3})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("cards")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
                  activeTab === "cards"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                <FaSlidersH /> بطاقات الجنسيات ({cards.length})
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* --- SECTION 1: HERO BANNER MANAGEMENT --- */}
        {/* ==================================================================== */}
        {activeTab === "banner" && (
          <div className="space-y-8">
            {/* Top Card: Upload & Live Preview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Section Header */}
              <div className="p-5 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/80">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2.5">
                    <FaImage className="text-blue-600" />
                    بانر الواجهة الرئيسية
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">
                    تغيير الصورة المعروضة في القسم الرئيسي من واجهة الموقع
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetDefaultBanner}
                  disabled={bannerLoading || bannerUploading}
                  className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 hover:text-red-700 bg-white hover:bg-red-50 border border-gray-300 hover:border-red-300 px-4 py-2 rounded-xl transition-all shadow-sm font-bold"
                >
                  <FaUndo className="text-xs" /> استعادة الصورة الافتراضية
                </button>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Controls (7 Cols) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Gold Border Switch */}
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl ${showBorder ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-600'}`}>
                          <FaBorderAll className="text-xl" />
                        </div>
                        <div>
                          <label 
                            htmlFor="borderToggle" 
                            className="block text-sm font-bold text-gray-900 cursor-pointer select-none"
                          >
                            الإطار الزخرفي حول الصورة
                          </label>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {showBorder 
                              ? 'الإطار الذهبي والظل مفعل حول الصورة' 
                              : 'تم إلغاء الإطار وتظهر الصورة بدون حدود'}
                          </p>
                        </div>
                      </div>

                      {/* Custom Switch Toggle */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showBorder}
                        onClick={() => {
                          const val = !showBorder;
                          setShowBorder(val);
                          handleSaveBanner(bannerUrl, val);
                        }}
                        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showBorder ? 'bg-yellow-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            showBorder ? 'translate-x-0' : '-translate-x-7'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Direct File Upload Zone */}
                  <div className="bg-gray-50 p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <label className="block text-sm font-bold text-gray-900 mb-1">
                      رفع صورة جديدة
                    </label>
                    <p className="text-xs text-gray-500 mb-4">
                      اختر صورة من جهازك وسيتم تطبيقها وحفظها في مكتبة الصور تلقائياً:
                    </p>

                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      className={`relative flex flex-col items-center justify-center p-8 sm:p-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
                        isDragOver
                          ? "border-blue-600 bg-blue-50/70 scale-[1.01]"
                          : bannerUploading
                          ? "border-blue-400 bg-blue-50 cursor-not-allowed"
                          : "border-blue-300 bg-white hover:bg-blue-50/30 hover:border-blue-500"
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={bannerUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />

                      {bannerUploading ? (
                        <div className="flex flex-col items-center gap-3 text-blue-700 py-4">
                          <FaSpinner className="animate-spin text-3xl" />
                          <span className="text-sm font-bold">جاري رفع وتحديث الصورة...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-gray-700 py-4">
                          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-sm">
                            <FaUpload className="text-2xl" />
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-bold text-gray-900 block mb-1">
                              اضغط هنا لاختيار صورة من جهازك أو اسحبها إلى هنا
                            </span>
                            <span className="text-xs text-gray-500">
                              يتم الحفظ والتطبيق تلقائياً بمجرد اختيار الصورة
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recommended Dimensions Box */}
                    <div className="mt-4 p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center gap-3">
                      <FaRulerCombined className="text-blue-600 text-lg flex-shrink-0" />
                      <div className="text-xs text-blue-900 leading-relaxed font-medium">
                        <strong>المقاس الموصى به للصورة:</strong> <span className="font-bold font-mono" dir="ltr">600 × 400 px</span> (نسبة أبعاد عرضية <span className="font-bold font-mono" dir="ltr">3:2</span>) بخلفية بيضاء أو شفافة.
                      </div>
                    </div>
                  </div>

                </div>

                {/* Live Preview (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <div className="w-full bg-gray-50 p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center">
                    
                    {/* Preview Card Header */}
                    <div className="w-full flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-gray-800">
                          معاينة مباشرة
                        </span>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                        showBorder 
                          ? 'text-yellow-800 bg-yellow-100 border-yellow-300' 
                          : 'text-gray-700 bg-gray-200 border-gray-300'
                      }`}>
                        {showBorder ? 'مع إطار' : 'بدون إطار'}
                      </span>
                    </div>

                    {/* Image Card Container */}
                    <div 
                      className={`relative w-full rounded-2xl overflow-hidden bg-white flex items-center justify-center p-3 transition-all duration-300 ${
                        showBorder ? 'shadow-xl' : 'shadow-sm border border-gray-200'
                      }`}
                      style={{ 
                        minHeight: '220px', 
                        border: showBorder ? '4px solid #ECC383' : undefined,
                        boxShadow: showBorder ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : undefined
                      }}
                    >
                      {bannerLoading ? (
                        <div className="flex flex-col items-center gap-2 text-gray-500 py-8">
                          <FaSpinner className="animate-spin text-2xl text-blue-600" />
                          <span className="text-xs font-bold">جاري جلب الصورة...</span>
                        </div>
                      ) : imgError ? (
                        <div className="flex flex-col items-center gap-2 text-red-500 py-8 text-center p-4">
                          <FaImage className="text-4xl text-gray-400" />
                          <span className="text-xs font-bold text-red-600">تعذر عرض الصورة</span>
                        </div>
                      ) : (
                        <img
                          src={bannerUrl || "/banner.png"}
                          alt="بانر روائس للاستقدام"
                          className="w-full h-auto max-h-56 object-contain rounded-xl"
                          onError={() => setImgError(true)}
                        />
                      )}
                    </div>

                    {/* Quick Link Button */}
                    <div className="w-full mt-4 border-t pt-4 border-gray-200">
                      <a
                        href="http://localhost:3001"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 py-2.5 px-4 rounded-xl transition-colors shadow-sm"
                      >
                        <FaExternalLinkAlt className="text-xs" />
                        <span>فتح موقع العملاء للمعاينة</span>
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* --- Media Library / Previously Uploaded Banners Gallery --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                    <FaHistory className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">سجل الصور السابقة (مكتبة الصور)</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      الصور التي تم رفعها سابقاً محفوظة هنا، يمكنك إعادة تعيين أي منها كبانر رئيسي بنقرة واحدة
                    </p>
                  </div>
                </div>

                <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-bold">
                  {bannerHistory.length} صور محفوظة
                </span>
              </div>

              {historyLoading ? (
                <div className="py-12 flex justify-center items-center gap-2 text-gray-500">
                  <FaSpinner className="animate-spin text-xl text-blue-600" />
                  <span className="text-xs font-bold">جاري تحميل سجل الصور...</span>
                </div>
              ) : bannerHistory.length === 0 ? (
                <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-6">
                  <FaFolderOpen className="text-4xl text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-700">لم يتم رفع أي صور إضافية بعد</p>
                  <p className="text-xs text-gray-400 mt-1">
                    كل صورة جديدة تقوم برفعها ستُحفظ تلقائياً في هذه المكتبة لتتمكن من استخدامها متى شئت.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {bannerHistory.map((item) => {
                    const isActive = item.imageUrl === bannerUrl;
                    return (
                      <div
                        key={item.id}
                        className={`group relative bg-gray-50 rounded-2xl p-3 border-2 transition-all duration-200 flex flex-col justify-between ${
                          isActive 
                            ? 'border-blue-600 shadow-md bg-blue-50/30' 
                            : 'border-gray-200 hover:border-gray-400 hover:shadow'
                        }`}
                      >
                        {/* Status Badge */}
                        <div className="flex items-center justify-between mb-2">
                          {isActive ? (
                            <span className="text-xs bg-blue-600 text-white font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                              <FaCheck className="text-[10px]" /> البانر النشط حالياً
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-500 font-medium">
                              صورة محفوظة
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteHistoryImage(item.id)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                            title="حذف من السجل"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>

                        {/* Thumbnail */}
                        <div className="w-full h-32 bg-white rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center p-2 mb-3">
                          <img
                            src={item.imageUrl}
                            alt="بانر محفوظ"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/banner.png";
                            }}
                          />
                        </div>

                        {/* Action Button */}
                        <button
                          type="button"
                          onClick={() => handleSelectHistoryImage(item.imageUrl)}
                          disabled={isActive}
                          className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                            isActive
                              ? 'bg-blue-100 text-blue-800 cursor-default'
                              : 'bg-white hover:bg-blue-600 hover:text-white text-gray-700 border border-gray-300 shadow-sm'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <FaCheckCircle className="text-blue-600" /> البانر الحالي للموقع
                            </>
                          ) : (
                            <>
                              <FaImage /> تفعيل كبانر رئيسي
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* --- SECTION 2: STATISTICS MANAGEMENT (إحصائياتنا) --- */}
        {/* ==================================================================== */}
        {activeTab === "stats" && (
          <div className="space-y-8">
            
            {/* Top Toolbar Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/80">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2.5">
                    <FaChartLine className="text-blue-600" />
                    التحكم في قسم إحصائياتنا
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">
                    تعديل الأرقام، الرموز، النصوص التوضيحية، والكلمات المميزة والأيقونات الظاهرة في الصفحة الرئيسية لموقع العملاء
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleResetDefaultStats}
                    disabled={statsSaving}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-700 hover:text-red-700 bg-white hover:bg-red-50 border border-gray-300 hover:border-red-300 px-4 py-2.5 rounded-xl transition-all shadow-sm font-bold"
                  >
                    <FaUndo className="text-xs" /> استعادة الافتراضي
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveStats()}
                    disabled={statsSaving}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg font-bold disabled:opacity-50"
                  >
                    {statsSaving ? <FaSpinner className="animate-spin text-sm" /> : <FaSave className="text-sm" />}
                    <span>حفظ التعديلات</span>
                  </button>
                </div>
              </div>

              {/* General Section Controls */}
              <div className="p-6 border-b border-gray-200 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* Visibility Toggle */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl ${stats.showSection ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                        <FaEye className="text-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 cursor-pointer select-none">
                          إظهار قسم الإحصائيات في الموقع
                        </label>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {stats.showSection ? 'القسم معروض حالياً للزوار في الصفحة الرئيسية' : 'القسم مخفي ولن يظهر في الصفحة الرئيسية'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={stats.showSection}
                      onClick={() => setStats(prev => ({ ...prev, showSection: !prev.showSection }))}
                      className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        stats.showSection ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          stats.showSection ? 'translate-x-0' : '-translate-x-7'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Section Title Input */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      عنوان القسم الرئيسي
                    </label>
                    <input
                      type="text"
                      value={stats.sectionTitle}
                      onChange={(e) => setStats(prev => ({ ...prev, sectionTitle: e.target.value }))}
                      placeholder="مثال: إحصائياتنا"
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-bold"
                    />
                  </div>

                </div>
              </div>

              {/* 3 Statistic Cards Editor */}
              <div className="p-6 md:p-8 bg-gray-50/50">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FaSlidersH className="text-blue-600" />
                  تعديل بطاقات الإحصائيات (3 بطاقات)
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {stats.items.map((item, idx) => (
                    <div 
                      key={item.id || idx}
                      className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4 hover:border-blue-300 transition-colors"
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between border-b pb-3">
                        <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                          البطاقة {idx + 1}
                        </span>
                        <span className="text-xs text-gray-400 font-mono" dir="ltr">
                          ID: #{item.id}
                        </span>
                      </div>

                      {/* Target Number & Prefix */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            الرقم / العدد
                          </label>
                          <input
                            type="number"
                            value={item.number}
                            onChange={(e) => handleUpdateStatItem(idx, "number", Number(e.target.value) || 0)}
                            className="w-full border border-gray-300 rounded-xl p-2 text-sm font-bold font-mono focus:ring-2 focus:ring-blue-500 outline-none text-left"
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            الرمز المرافق
                          </label>
                          <input
                            type="text"
                            value={item.prefix}
                            onChange={(e) => handleUpdateStatItem(idx, "prefix", e.target.value)}
                            placeholder="مثال: +"
                            className="w-full border border-gray-300 rounded-xl p-2 text-sm font-bold font-mono focus:ring-2 focus:ring-blue-500 outline-none text-center"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      {/* Full Label */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          النص التوضيحي للبطاقة
                        </label>
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => handleUpdateStatItem(idx, "label", e.target.value)}
                          placeholder="مثال: عدد عملائنا السعداء"
                          className="w-full border border-gray-300 rounded-xl p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                        />
                      </div>

                      {/* Highlight Word */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          الكلمة المميزة باللون الذهبي
                        </label>
                        <input
                          type="text"
                          value={item.highlightWord}
                          onChange={(e) => handleUpdateStatItem(idx, "highlightWord", e.target.value)}
                          placeholder="مثال: عملائنا"
                          className="w-full border border-yellow-300 bg-yellow-50/50 rounded-xl p-2 text-sm focus:ring-2 focus:ring-yellow-500 outline-none font-bold text-yellow-900"
                        />
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          تظهر هذه الكلمة باللون الذهبي المميز داخل النص
                        </span>
                      </div>

                      {/* Icon Selector */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                          اختيار الأيقونة
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {AVAILABLE_ICONS.map((ico) => {
                            const IcoComponent = ico.icon;
                            const isSelected = item.icon === ico.id;
                            return (
                              <button
                                key={ico.id}
                                type="button"
                                onClick={() => handleUpdateStatItem(idx, "icon", ico.id)}
                                className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all ${
                                  isSelected 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-300' 
                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
                                }`}
                                title={ico.label}
                              >
                                <IcoComponent className="text-base" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* --- LIVE PREVIEW FOR STATS --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 sm:p-8">
              <div className="flex items-center justify-between border-b pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">معاينة حية لقسم الإحصائيات (كما يظهر في الموقع)</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      تحديث فوري وتفاعلي يعكس الأرقام والأيقونات والنصوص المحددة أعلاه
                    </p>
                  </div>
                </div>

                <a
                  href="http://localhost:3001"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 py-2 px-3.5 rounded-xl transition-colors"
                >
                  <FaExternalLinkAlt className="text-[10px]" />
                  <span>فتح الموقع</span>
                </a>
              </div>

              {/* Preview Canvas */}
              <div className="bg-gradient-to-b from-gray-50 to-white rounded-3xl p-6 sm:p-10 border border-gray-200 text-center">
                <h4 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8" style={{ color: '#003749' }}>
                  {stats.sectionTitle || "إحصائياتنا"}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {stats.items.map((stat, idx) => {
                    const iconDef = AVAILABLE_ICONS.find(i => i.id === stat.icon) || AVAILABLE_ICONS[0];
                    const IconComp = iconDef.icon;
                    
                    // Highlight word rendering
                    const word = stat.highlightWord?.trim();
                    const fullText = stat.label || "";
                    let renderedHtml = fullText;
                    if (word && fullText.includes(word)) {
                      renderedHtml = fullText.replace(
                        new RegExp(`(${word})`, "g"),
                        `<span style="color: #ECC383; font-weight: bold;">$1</span>`
                      );
                    }

                    return (
                      <div
                        key={stat.id || idx}
                        className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-yellow-200 flex flex-col items-center justify-between min-h-[200px]"
                        style={{ borderColor: 'rgba(236, 195, 131, 0.4)' }}
                      >
                        {/* Target Number */}
                        <div className="text-4xl sm:text-5xl font-black mb-3" style={{ color: '#003749' }} dir="ltr">
                          {stat.prefix === "+" ? `+${stat.number}` : `${stat.number}${stat.prefix || ""}`}
                        </div>

                        {/* Icon & Label */}
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <IconComp className="text-xl flex-shrink-0" style={{ color: '#ECC383' }} />
                          <p 
                            className="text-sm sm:text-base font-semibold text-gray-800 leading-snug"
                            dangerouslySetInnerHTML={{ __html: renderedHtml }}
                          />
                        </div>

                        {/* Gold Underline Bar */}
                        <div 
                          className="w-16 h-1 rounded-full mt-2 mx-auto"
                          style={{ backgroundColor: '#ECC383' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==================================================================== */}
        {/* --- SECTION 3: NATIONALITY CARDS MANAGEMENT --- */}
        {/* ==================================================================== */}
        {activeTab === "cards" && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">بطاقات الجنسيات والأسعار</h2>
                <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                  البطاقات المعروضة في شبكة الجنسيات بالموقع مع الأسعار الحالية ونسب الخصومات
                </p>
              </div>

              <button 
                onClick={openAddModal}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-sm"
              >
                <FaPlus /> إضافة بطاقة جديدة
              </button>
            </div>

            {/* Search & Stats Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث عن دولة أو جنسية..."
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <FaSearch className="absolute right-3.5 top-3 text-gray-400 text-sm" />
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
                <span className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200">
                  الإجمالي: {cards.length}
                </span>
                <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-lg border border-green-200">
                  الظاهرة: {activeCardsCount}
                </span>
                <span className="bg-red-100 text-red-800 px-3 py-1.5 rounded-lg border border-red-200">
                  المخفية: {inactiveCardsCount}
                </span>
              </div>
            </div>

            {/* Cards Table */}
            {cardsLoading ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center gap-3">
                <FaSpinner className="animate-spin text-3xl text-blue-600" />
                <span className="text-gray-600 font-bold text-sm">جاري تحميل بطاقات الجنسيات...</span>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-right">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">الترتيب</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">العلم</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">الدولة (عربي)</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">الدولة (إنجليزي)</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">السعر</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">الحالة</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 font-medium">
                      {filteredCards.map((card) => (
                        <tr key={card.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 border border-gray-200">
                              {card.sortOrder}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs font-mono bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-300 text-gray-800 inline-block" dir="ltr">
                              {card.flagUrl}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {card.countryArabic}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono" dir="ltr">
                            {card.countryEnglish}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex flex-col">
                              {card.oldPrice && (
                                <span className="text-red-600 line-through text-xs font-mono">{card.oldPrice} ريال</span>
                              )}
                              <span className="font-bold text-green-700 font-mono text-sm">{card.price} ريال</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button 
                              type="button"
                              onClick={() => toggleCardStatus(card)}
                              className={`px-3 py-1 inline-flex items-center gap-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                                card.isActive 
                                  ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-800 border border-red-300 hover:bg-red-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${card.isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
                              {card.isActive ? 'ظاهر' : 'مخفي'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                type="button"
                                onClick={() => toggleCardStatus(card)} 
                                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                title={card.isActive ? "إخفاء" : "إظهار"}
                              >
                                {card.isActive ? <FaEyeSlash /> : <FaEye />}
                              </button>
                              <button 
                                type="button"
                                onClick={() => openEditModal(card)} 
                                className="p-2 rounded-lg text-blue-600 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                                title="تعديل"
                              >
                                <FaEdit />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleCardDelete(card.id, card.countryArabic)} 
                                className="p-2 rounded-lg text-red-600 hover:text-red-900 hover:bg-red-50 transition-colors"
                                title="حذف"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredCards.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-gray-400 font-medium">
                            {searchQuery ? "لا توجد نتائج مطابقة لبحثك." : "لا توجد أي بطاقات جنسيات مضافة حالياً."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- Confirmation Modal --- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="confirm-modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm transition-opacity" onClick={closeConfirm}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-right overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full p-6" dir="rtl">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl flex-shrink-0 ${confirmModal.isDangerous ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                  <FaExclamationCircle className="text-2xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900" id="confirm-modal-title">
                    {confirmModal.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    {confirmModal.message}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-row-reverse gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    closeConfirm();
                    await confirmModal.onConfirm();
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-white text-sm shadow transition-all ${
                    confirmModal.isDangerous 
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30' 
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                  }`}
                >
                  {confirmModal.confirmText || "نعم، تأكيد"}
                </button>
                <button
                  type="button"
                  onClick={closeConfirm}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 bg-white font-bold text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                >
                  {confirmModal.cancelText || "إلغاء"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Card Add/Edit Modal --- */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="card-modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowCardModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-right overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" dir="rtl">
              <form onSubmit={handleCardSubmit}>
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <h3 className="text-lg font-bold text-gray-900" id="card-modal-title">
                      {editId ? "تعديل بطاقة جنسية" : "إضافة بطاقة جنسية جديدة"}
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => setShowCardModal(false)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">الدولة بالعربي</label>
                      <input 
                        type="text" 
                        name="countryArabic" 
                        value={formData.countryArabic} 
                        onChange={handleCardChange} 
                        required 
                        placeholder="مثال: الفلبين"
                        className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">الدولة بالإنجليزي (مهم للروابط)</label>
                      <input 
                        type="text" 
                        name="countryEnglish" 
                        value={formData.countryEnglish} 
                        onChange={handleCardChange} 
                        required 
                        placeholder="مثال: Philippines"
                        className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-left" 
                        dir="ltr" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">مسار العلم (مثال: /philippines-flag.png)</label>
                      <input 
                        type="text" 
                        name="flagUrl" 
                        value={formData.flagUrl} 
                        onChange={handleCardChange} 
                        required 
                        className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-left font-mono" 
                        dir="ltr" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">السعر القديم (مشطوب)</label>
                        <input 
                          type="number" 
                          name="oldPrice" 
                          value={formData.oldPrice} 
                          onChange={handleCardChange} 
                          placeholder="اختياري"
                          className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-left font-mono" 
                          dir="ltr" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">السعر الحالي</label>
                        <input 
                          type="number" 
                          name="price" 
                          value={formData.price} 
                          onChange={handleCardChange} 
                          required 
                          placeholder="مثال: 13796"
                          className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-left font-mono font-bold" 
                          dir="ltr" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">الترتيب</label>
                      <input 
                        type="number" 
                        name="sortOrder" 
                        value={formData.sortOrder} 
                        onChange={handleCardChange} 
                        required 
                        className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-left font-mono" 
                        dir="ltr" 
                      />
                    </div>
                    <div className="flex items-center mt-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                      <input 
                        type="checkbox" 
                        name="isActive" 
                        id="isActive"
                        checked={formData.isActive} 
                        onChange={handleCardChange} 
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ml-3 cursor-pointer" 
                      />
                      <label htmlFor="isActive" className="text-sm font-bold text-gray-800 cursor-pointer">
                        تفعيل / إظهار البطاقة في الموقع الخارجي
                      </label>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3 border-t">
                  <button 
                    type="submit" 
                    disabled={cardSaving}
                    className="flex-1 inline-flex justify-center items-center py-2.5 px-4 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 shadow-md transition-all text-sm disabled:opacity-50"
                  >
                    {cardSaving ? <FaSpinner className="animate-spin" /> : (editId ? "تحديث البطاقة" : "حفظ البطاقة")}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowCardModal(false)} 
                    className="flex-1 inline-flex justify-center items-center py-2.5 px-4 rounded-xl border border-gray-300 bg-white font-bold text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
