import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css";
import { 
  SearchIcon,
  DownloadIcon, 
  RefreshIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  EyeIcon, 
  AdjustmentsIcon, 
  CollectionIcon, 
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  GlobeAltIcon,
  LightningBoltIcon,
  ZoomInIcon,
  ZoomOutIcon,
  ArrowsExpandIcon,
  SwitchHorizontalIcon,
  CheckIcon,
  DocumentDuplicateIcon,
  XIcon,
  FilterIcon,
  ChevronDownIcon
} from '@heroicons/react/outline';
import { ToastContext } from 'components/GlobalToast';

interface MaidCard {
  id: number;
  name: string;
  nationality: string;
  passportNumber: string;
  officeName: string;
  bookingStatus: string;
  isApproved: boolean;
  personalPhoto: string | null;
  fullPhoto: string | null;
  passportPhoto: string | null;
  originalPhotoUrl?: string | null;
  hasBackup?: boolean;
  aiEnhanceCount?: number;
  remainingAiQuota?: number;
  mainImage: string;
  isEnhanced?: boolean;
  isPersonalEnhanced?: boolean;
  isFullEnhanced?: boolean;
  isPassportEnhanced?: boolean;
  isMainImageEnhanced?: boolean;
  isEdited?: boolean;
  isPersonalEdited?: boolean;
  isFullEdited?: boolean;
  isPassportEdited?: boolean;
  isMainImageEdited?: boolean;
}

const OPENROUTER_MODELS = [
  { id: 'bytedance-seed/seedream-4.5', name: 'ByteDance: Seedream 4.5', price: '$0.04', tag: 'موصى به ⭐' },
  { id: 'black-forest-labs/flux.2-pro', name: 'Black Forest Labs: FLUX.2 Pro', price: '$0.03', tag: 'دقة عالية' },
];

export default function ImageUpscaleTest() {
  const { showToast } = React.useContext(ToastContext);

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedMaidInfo, setSelectedMaidInfo] = useState<MaidCard | null>(null);
  const [selectedPhotoType, setSelectedPhotoType] = useState<'personalPhoto' | 'fullPhoto' | 'passportPhoto'>('personalPhoto');

  // Maids Gallery State
  const [maids, setMaids] = useState<MaidCard[]>([]);
  const [loadingMaids, setLoadingMaids] = useState<boolean>(false);
  const [maidSearchTerm, setMaidSearchTerm] = useState<string>('');
  const [maidPage, setMaidPage] = useState<number>(1);
  const [totalMaids, setTotalMaids] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filters State (Default: not_enhanced to exclude already enhanced/edited maids)
  const [filterNationality, setFilterNationality] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'available' | 'approved_available' | 'not_approved'>('all');
  const [filterEnhanced, setFilterEnhanced] = useState<'all' | 'enhanced' | 'edited' | 'not_enhanced'>('not_enhanced');
  const [availableNationalities, setAvailableNationalities] = useState<{ name: string; count: number }[]>([]);

  // AI Engine
  const model = 'bytedance-seed/seedream-4.5';
  const [showReEnhanceConfirmModal, setShowReEnhanceConfirmModal] = useState<boolean>(false);

  // Restore Photo State
  const [showRestoreConfirmModal, setShowRestoreConfirmModal] = useState<boolean>(false);
  const [restoringPhoto, setRestoringPhoto] = useState<boolean>(false);

  // Processing & Saving state
  const [loading, setLoading] = useState<boolean>(false);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingToProfile, setSavingToProfile] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // View & Zoom Settings (Default 1x so no artificial zoom in preview)
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  // Image Editing Tools State (Rotate & Crop)
  const [showCropModal, setShowCropModal] = useState<boolean>(false);
  const [cropAspect, setCropAspect] = useState<'3:4' | '9:16' | '1:1' | 'free'>('3:4');
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropOffsetX, setCropOffsetX] = useState<number>(0);
  const [cropOffsetY, setCropOffsetY] = useState<number>(0);
  const [cropLoading, setCropLoading] = useState<boolean>(false);
  const [originalBackupUrl, setOriginalBackupUrl] = useState<string>('');
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cachedCropImgRef = useRef<HTMLImageElement | null>(null);

  // Helper to load image for canvas operations with CORS fallback
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (!src) return reject(new Error('رابط الصورة غير صالح'));

      const img = new Image();
      if (!src.startsWith('data:') && !src.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => resolve(img);
      img.onerror = () => {
        // Fallback without anonymous crossOrigin
        const fallback = new Image();
        fallback.onload = () => resolve(fallback);
        fallback.onerror = () => reject(new Error('تعذر تحميل الصورة'));
        fallback.src = src;
      };
      img.src = src;
    });
  }, []);

  // Calculate crop bounding box
  const getCropParams = useCallback((img: HTMLImageElement) => {
    let targetRatio = 3 / 4;
    if (cropAspect === '9:16') targetRatio = 9 / 16;
    if (cropAspect === '1:1') targetRatio = 1;
    if (cropAspect === 'free') targetRatio = (img.width || 3) / (img.height || 4);

    let baseW = img.width;
    let baseH = img.width / targetRatio;
    if (baseH > img.height) {
      baseH = img.height;
      baseW = img.height * targetRatio;
    }

    const cropW = Math.max(20, baseW / cropZoom);
    const cropH = Math.max(20, baseH / cropZoom);

    const maxPanX = Math.max(0, (img.width - cropW) / 2);
    const maxPanY = Math.max(0, (img.height - cropH) / 2);

    // cropOffsetX: -100 to +100
    // cropOffsetY: -100 (bottom) to +100 (top / head)
    const shiftX = (cropOffsetX / 100) * maxPanX;
    const shiftY = (-cropOffsetY / 100) * maxPanY;

    const centerX = img.width / 2 + shiftX;
    const centerY = img.height / 2 + shiftY;

    const startX = Math.max(0, Math.min(img.width - cropW, centerX - cropW / 2));
    const startY = Math.max(0, Math.min(img.height - cropH, centerY - cropH / 2));

    return { startX, startY, cropW, cropH };
  }, [cropAspect, cropZoom, cropOffsetX, cropOffsetY]);

  // Fast synchronous draw to canvas from memory cache
  const drawFromCache = useCallback((img: HTMLImageElement, canvasNode?: HTMLCanvasElement | null) => {
    const canvas = canvasNode || cropCanvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { startX, startY, cropW, cropH } = getCropParams(img);

    canvas.width = Math.round(cropW);
    canvas.height = Math.round(cropH);
    ctx.drawImage(img, startX, startY, cropW, cropH, 0, 0, canvas.width, canvas.height);
  }, [getCropParams]);

  // Load image into cache when modal opens or selectedImage changes
  useEffect(() => {
    if (!showCropModal || !selectedImage) {
      cachedCropImgRef.current = null;
      return;
    }

    let isCurrent = true;
    setCropLoading(true);

    loadImage(selectedImage)
      .then((img) => {
        if (!isCurrent) return;
        cachedCropImgRef.current = img;
        drawFromCache(img);
      })
      .catch((err) => {
        console.error('Error caching crop image:', err);
      })
      .finally(() => {
        if (isCurrent) setCropLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [showCropModal, selectedImage, loadImage]);

  // Instant real-time redraw on slider movement using cached image (no reload, no spinner!)
  useEffect(() => {
    if (showCropModal && cachedCropImgRef.current) {
      drawFromCache(cachedCropImgRef.current);
    }
  }, [showCropModal, cropAspect, cropZoom, cropOffsetX, cropOffsetY, drawFromCache]);

  // Fetch maids from API with full filter set
  const fetchMaids = useCallback(async (
    page = 1,
    search = maidSearchTerm,
    nat = filterNationality,
    stat = filterStatus,
    enh = filterEnhanced
  ) => {
    setLoadingMaids(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        perPage: '18',
        ...(search && { search }),
        ...(nat && nat !== 'all' && { nationality: nat }),
        ...(stat && stat !== 'all' && { status: stat }),
        ...(enh && enh !== 'all' && { enhanced: enh }),
      }).toString();

      const res = await fetch(`/api/maids-gallery?${query}`);
      if (res.ok) {
        const data = await res.json();
        setMaids(data.maids || []);
        setTotalMaids(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setMaidPage(data.currentPage || 1);
        if (data.nationalities && data.nationalities.length > 0) {
          setAvailableNationalities(data.nationalities);
        }

        // Auto select first maid if none selected
        if (!selectedImage && data.maids?.length > 0) {
          setSelectedImage(data.maids[0].mainImage);
          setSelectedMaidInfo(data.maids[0]);
          setSelectedPhotoType(data.maids[0].personalPhoto ? 'personalPhoto' : 'fullPhoto');
        }
      }
    } catch (err) {
      console.error('Error fetching maids:', err);
    } finally {
      setLoadingMaids(false);
    }
  }, [selectedImage, maidSearchTerm, filterNationality, filterStatus, filterEnhanced]);

  // Initial fetch
  useEffect(() => {
    fetchMaids(1, maidSearchTerm, filterNationality, filterStatus, filterEnhanced);
  }, [filterNationality, filterStatus, filterEnhanced]);

  // Debounced search for maids
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMaids(1, maidSearchTerm, filterNationality, filterStatus, filterEnhanced);
    }, 400);
    return () => clearTimeout(timer);
  }, [maidSearchTerm]);

  const handleSelectMaid = (maid: MaidCard, photoUrl?: string, type: 'personalPhoto' | 'fullPhoto' | 'passportPhoto' = 'personalPhoto') => {
    const chosenPhoto = photoUrl || maid.mainImage;
    setSelectedImage(chosenPhoto);
    setSelectedMaidInfo(maid);
    setSelectedPhotoType(type);
    setEnhancedImage(null);
    setIsSaved(false);
    setError(null);
  };

  const handleResetFilters = () => {
    setMaidSearchTerm('');
    setFilterNationality('all');
    setFilterStatus('all');
    setFilterEnhanced('not_enhanced');
    fetchMaids(1, '', 'all', 'all', 'not_enhanced');
  };

  const isAnyFilterActive = maidSearchTerm !== '' || filterNationality !== 'all' || filterStatus !== 'all' || filterEnhanced !== 'not_enhanced';

  const handleProcessImage = async () => {
    if (!selectedImage) {
      if (showToast) showToast('الرجاء اختيار عاملة من المعرض أولاً', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    setEnhancedImage(null);
    setIsSaved(false);

    try {
      const response = await fetch('/api/ai-upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage,
          maidId: selectedMaidInfo?.id,
          provider: 'openrouter',
          model,
          photoType: selectedPhotoType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشلت معالجة الصورة');
      }

      setEnhancedImage(data.enhancedImage);
      setElapsedTime(data.elapsedSeconds);

      // Decrement AI quota in state
      if (selectedMaidInfo) {
        setSelectedMaidInfo((prev) => {
          if (!prev) return null;
          const newCount = (prev.aiEnhanceCount || 0) + 1;
          return {
            ...prev,
            aiEnhanceCount: newCount,
            remainingAiQuota: Math.max(0, 2 - newCount),
          };
        });

        setMaids((prev) =>
          prev.map((m) => {
            if (m.id === selectedMaidInfo.id) {
              const newCount = (m.aiEnhanceCount || 0) + 1;
              return {
                ...m,
                aiEnhanceCount: newCount,
                remainingAiQuota: Math.max(0, 2 - newCount),
              };
            }
            return m;
          })
        );
      }

      if (showToast) showToast('تمت معالجة وتحسين الصورة بنجاح! ✨', 'success');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء معالجة الصورة');
      if (showToast) showToast(err.message || 'حدث خطأ أثناء المعالجة', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Replace photo in database and permanent cloud storage
  const handleReplaceWorkerPhoto = async () => {
    const imageToSave = enhancedImage || selectedImage;
    if (!selectedMaidInfo || !imageToSave) {
      if (showToast) showToast('الرجاء اختيار عاملة وتعديل أو تحسين صورتها أولاً', 'error');
      return;
    }

    setSavingToProfile(true);

    try {
      const res = await fetch('/api/maids/replace-worker-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maidId: selectedMaidInfo.id,
          photoType: selectedPhotoType,
          enhancedImage: imageToSave,
          originalImage: originalBackupUrl || selectedImage,
          isAiEnhanced: Boolean(enhancedImage),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'فشل استبدال الصورة');
      }

      const newUrl = data.newImageUrl;
      const wasAi = Boolean(enhancedImage);
      setIsSaved(true);
      setOriginalBackupUrl(''); // Reset backup as the edited photo is now saved permanently

      // Update current selected maid state
      setSelectedMaidInfo((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          mainImage: newUrl,
          ...(selectedPhotoType === 'personalPhoto' && { 
            personalPhoto: newUrl,
            isPersonalEnhanced: wasAi,
            isPersonalEdited: !wasAi,
          }),
          ...(selectedPhotoType === 'fullPhoto' && { 
            fullPhoto: newUrl,
            isFullEnhanced: wasAi,
            isFullEdited: !wasAi,
          }),
          ...(selectedPhotoType === 'passportPhoto' && { 
            passportPhoto: newUrl,
            isPassportEnhanced: wasAi,
            isPassportEdited: !wasAi,
          }),
          isEnhanced: wasAi,
          isEdited: !wasAi,
          isMainImageEnhanced: wasAi,
          isMainImageEdited: !wasAi,
        };
      });

      // Update maid in grid list
      setMaids((prev) =>
        prev.map((m) => {
          if (m.id === selectedMaidInfo.id) {
            return {
              ...m,
              mainImage: newUrl,
              ...(selectedPhotoType === 'personalPhoto' && { 
                personalPhoto: newUrl, 
                isPersonalEnhanced: wasAi,
                isPersonalEdited: !wasAi,
              }),
              ...(selectedPhotoType === 'fullPhoto' && { 
                fullPhoto: newUrl, 
                isFullEnhanced: wasAi,
                isFullEdited: !wasAi,
              }),
              ...(selectedPhotoType === 'passportPhoto' && { 
                passportPhoto: newUrl, 
                isPassportEnhanced: wasAi,
                isPassportEdited: !wasAi,
              }),
              isEnhanced: wasAi,
              isEdited: !wasAi,
              isMainImageEnhanced: wasAi,
              isMainImageEdited: !wasAi,
            };
          }
          return m;
        })
      );

      if (showToast) {
        showToast(
          enhancedImage
            ? 'تم استبدال وحفظ الصورة المحسنة في ملف العاملة بنجاح! 💾✨'
            : 'تم حفظ الصورة المعدلة بنجاح في ملف العاملة! 💾✂️',
          'success'
        );
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast(err.message || 'حدث خطأ أثناء حفظ واستبدال الصورة', 'error');
    } finally {
      setSavingToProfile(false);
    }
  };

  // Restore original unedited/unenhanced photo from database & cloud storage
  const handleRestoreOriginalPhoto = async () => {
    if (!selectedMaidInfo) return;
    setRestoringPhoto(true);
    try {
      const res = await fetch('/api/maids/restore-original-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maidId: selectedMaidInfo.id,
          photoType: selectedPhotoType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'فشلت استعادة الصورة الأصلية');
      }

      const restoredUrl = data.restoredUrl;
      setSelectedImage(restoredUrl);
      setEnhancedImage(null);
      setOriginalBackupUrl('');
      setIsSaved(false);
      setShowRestoreConfirmModal(false);

      // Update selectedMaidInfo
      setSelectedMaidInfo((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          mainImage: restoredUrl,
          ...(selectedPhotoType === 'personalPhoto' && { personalPhoto: restoredUrl }),
          ...(selectedPhotoType === 'fullPhoto' && { fullPhoto: restoredUrl }),
          ...(selectedPhotoType === 'passportPhoto' && { passportPhoto: restoredUrl }),
          isEnhanced: false,
          isEdited: false,
          isPersonalEnhanced: false,
          isPersonalEdited: false,
          isFullEnhanced: false,
          isFullEdited: false,
          isPassportEnhanced: false,
          isPassportEdited: false,
          isMainImageEnhanced: false,
          isMainImageEdited: false,
          hasBackup: false,
        };
      });

      // Update maid in grid
      setMaids((prev) =>
        prev.map((m) => {
          if (m.id === selectedMaidInfo.id) {
            return {
              ...m,
              mainImage: restoredUrl,
              ...(selectedPhotoType === 'personalPhoto' && { personalPhoto: restoredUrl }),
              ...(selectedPhotoType === 'fullPhoto' && { fullPhoto: restoredUrl }),
              ...(selectedPhotoType === 'passportPhoto' && { passportPhoto: restoredUrl }),
              isEnhanced: false,
              isEdited: false,
              isPersonalEnhanced: false,
              isPersonalEdited: false,
              isFullEnhanced: false,
              isFullEdited: false,
              isPassportEnhanced: false,
              isPassportEdited: false,
              isMainImageEnhanced: false,
              isMainImageEdited: false,
              hasBackup: false,
            };
          }
          return m;
        })
      );

      if (showToast) {
        showToast('تم استعادة الصورة الأصلية بنجاح وتوثيق العملية في سجل العمليات! ↺', 'success');
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) {
        showToast(err.message || 'حدث خطأ أثناء استعادة الصورة', 'error');
      }
    } finally {
      setRestoringPhoto(false);
    }
  };

  // Quick Rotate 90 Degrees Clockwise
  const handleRotate90 = async () => {
    if (!selectedImage) return;
    try {
      if (!originalBackupUrl) setOriginalBackupUrl(selectedImage);
      const img = await loadImage(selectedImage);
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const rotatedUrl = canvas.toDataURL('image/jpeg', 0.95);
      setSelectedImage(rotatedUrl);
      setEnhancedImage(null);
      if (showToast) showToast('تم تدوير الصورة 90° بنجاح 🔄', 'success');
    } catch (err) {
      console.error(err);
      if (showToast) showToast('تعذر تدوير الصورة', 'error');
    }
  };

  // Flip Horizontal (Mirror)
  const handleFlipHorizontal = async () => {
    if (!selectedImage) return;
    try {
      if (!originalBackupUrl) setOriginalBackupUrl(selectedImage);
      const img = await loadImage(selectedImage);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);

      const flippedUrl = canvas.toDataURL('image/jpeg', 0.95);
      setSelectedImage(flippedUrl);
      setEnhancedImage(null);
      if (showToast) showToast('تم قلب الصورة أفقياً ↔️', 'success');
    } catch (err) {
      console.error(err);
      if (showToast) showToast('تعذر قلب الصورة', 'error');
    }
  };

  // Revert / Reset to original unedited photo
  const handleResetToOriginal = () => {
    if (selectedMaidInfo) {
      const original = selectedPhotoType === 'personalPhoto' 
        ? selectedMaidInfo.personalPhoto 
        : selectedPhotoType === 'fullPhoto' 
        ? selectedMaidInfo.fullPhoto 
        : selectedMaidInfo.passportPhoto || selectedMaidInfo.mainImage;
      if (original) {
        setSelectedImage(original);
        setEnhancedImage(null);
        setOriginalBackupUrl('');
        if (showToast) showToast('تمت استعادة الصورة الأصلية ↺', 'info');
      }
    }
  };

  // Apply Crop based on chosen aspect ratio & framing
  const handleApplyCrop = async () => {
    if (!selectedImage) return;
    try {
      if (!originalBackupUrl) setOriginalBackupUrl(selectedImage);

      let croppedUrl = '';
      if (cropCanvasRef.current && cropCanvasRef.current.width > 0) {
        croppedUrl = cropCanvasRef.current.toDataURL('image/jpeg', 0.95);
      } else {
        const img = await loadImage(selectedImage);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const { startX, startY, cropW, cropH } = getCropParams(img);
        canvas.width = Math.round(cropW);
        canvas.height = Math.round(cropH);
        ctx.drawImage(img, startX, startY, cropW, cropH, 0, 0, canvas.width, canvas.height);
        croppedUrl = canvas.toDataURL('image/jpeg', 0.95);
      }

      setSelectedImage(croppedUrl);
      setEnhancedImage(null);
      setShowCropModal(false);
      if (showToast) showToast('تم قص وتأطير الصورة بنجاح ✂️', 'success');
    } catch (err) {
      console.error(err);
      if (showToast) showToast('حدث خطأ أثناء قص الصورة', 'error');
    }
  };

  return (
    <Layout>
      <div className={`px-3 md:px-4 py-2.5 w-full h-[calc(100vh-64px)] flex flex-col ${Style["tajawal-regular"]} overflow-hidden`} dir="rtl">
        
        {/* Full-width Title Header Spanning Across Both Sections */}
        <div className="mb-2 flex items-center justify-between bg-white px-4 py-2 rounded-xl shadow-xs border border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-teal-50 text-teal-900 rounded-lg text-sm">
              ✨
            </span>
            <h1 className="text-xs md:text-sm font-bold text-gray-800 leading-tight">
              تحسين واستبدال صور العاملات بالذكاء الاصطناعي
            </h1>
          </div>
        </div>

        {/* Main Content: 2-Column Responsive Layout without whole-page scroll */}
        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-3 items-stretch overflow-hidden">

          {/* Right Column: Maids Gallery (xl:col-span-7 2xl:col-span-7) */}
          <div className="xl:col-span-7 2xl:col-span-7 h-full flex flex-col bg-white p-3 md:p-3.5 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            
            {/* Gallery Header (Shrink-0) */}
            <div className="flex flex-col gap-2 pb-2.5 border-b border-gray-100 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-teal-50 text-teal-900 rounded-lg">
                    <UserGroupIcon className="w-4 h-4 text-teal-800" />
                  </div>
                  <h2 className="text-xs md:text-sm font-bold text-gray-800">
                    معرض صور العاملات في النظام
                  </h2>
                  <span className="text-[10px] bg-teal-50 text-teal-900 px-2 py-0.5 rounded-full font-bold border border-teal-200">
                    {totalMaids} عاملة
                  </span>
                  {isAnyFilterActive && (
                    <span className="text-[9px] bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded-full font-bold border border-amber-200">
                      فلترة نشطة
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Reset Filters */}
                  {isAnyFilterActive && (
                    <button
                      onClick={handleResetFilters}
                      className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-[10px] font-bold border border-red-200 flex items-center gap-1 transition-colors"
                      title="إلغاء جميع الفلاتر"
                    >
                      <XIcon className="w-3 h-3" />
                      <span>تفريغ</span>
                    </button>
                  )}

                  {/* Refresh Button */}
                  <button
                    onClick={() => fetchMaids(maidPage, maidSearchTerm, filterNationality, filterStatus, filterEnhanced)}
                    disabled={loadingMaids}
                    className="p-1 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 shrink-0 transition-colors shadow-xs"
                    title="تحديث القائمة"
                  >
                    <RefreshIcon className={`w-3.5 h-3.5 ${loadingMaids ? 'animate-spin text-teal-800' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative w-full">
                <SearchIcon className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم، رقم الجواز، الجنسية..."
                  value={maidSearchTerm}
                  onChange={(e) => setMaidSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-8 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-teal-800 bg-gray-50/50 focus:bg-white transition-all shadow-inner"
                />
                {maidSearchTerm && (
                  <button
                    onClick={() => setMaidSearchTerm('')}
                    className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Bar Controls (Shrink-0) */}
            <div className="bg-gray-50/90 p-2.5 rounded-xl border border-gray-200/80 my-2 text-xs flex flex-wrap items-center justify-between gap-2.5 shrink-0">
              
              {/* 1. Status Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-gray-700 font-bold flex items-center gap-1 text-xs shrink-0">
                  <FilterIcon className="w-3.5 h-3.5 text-teal-800" />
                  الحالة:
                </span>
                <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 shadow-xs flex-wrap gap-0.5">
                  {[
                    { id: 'all', label: 'الكل' },
                    { id: 'approved', label: 'المعتمدة', icon: <CheckIcon className="w-3.5 h-3.5 text-emerald-300 inline shrink-0" /> },
                    { id: 'available', label: 'المتاحة', icon: <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0"></span> },
                    { id: 'approved_available', label: '⭐ المعتمدة والمتاحة' },
                    { id: 'not_approved', label: 'غير معتمدة' },
                  ].map((item) => {
                    const isActive = filterStatus === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setFilterStatus(item.id as any)}
                        style={{
                          backgroundColor: isActive ? '#0D5C63' : '#ffffff',
                          color: isActive ? '#ffffff' : '#374151',
                        }}
                        className={`px-2.5 py-1 rounded-md font-bold text-xs transition-all flex items-center gap-1 cursor-pointer border ${
                          isActive ? 'border-teal-800 shadow-xs' : 'border-transparent hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* 2. Nationality Filter Dropdown */}
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-700 font-bold flex items-center gap-1 text-xs shrink-0">
                    <GlobeAltIcon className="w-3.5 h-3.5 text-teal-800" />
                    الجنسية:
                  </span>
                  <div className="relative inline-flex items-center">
                    <select
                      value={filterNationality}
                      onChange={(e) => setFilterNationality(e.target.value)}
                      style={{
                        backgroundImage: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none',
                      }}
                      className="bg-white text-gray-800 pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold focus:outline-none focus:border-teal-700 shadow-2xs cursor-pointer leading-normal select-none"
                    >
                      <option value="all">جميع الجنسيات</option>
                      {availableNationalities && availableNationalities.length > 0 ? (
                        availableNationalities.map((nat) => (
                          <option key={nat.name} value={nat.name}>
                            {nat.name} ({nat.count})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="إثيوبيا">إثيوبيا</option>
                          <option value="كينيا">كينيا</option>
                          <option value="بنغلاديش">بنغلاديش</option>
                          <option value="أوغندا">أوغندا</option>
                          <option value="الفلبين">الفلبين</option>
                          <option value="باكستان">باكستان</option>
                          <option value="بوروندي">بوروندي</option>
                        </>
                      )}
                    </select>
                    <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2 pointer-events-none" />
                  </div>
                </div>

                {/* 3. AI Enhancement / Edited Status Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-700 font-bold flex items-center gap-1 text-xs shrink-0">
                    <SparklesIcon className="w-3.5 h-3.5 text-teal-800" />
                    التحسين:
                  </span>
                  <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 shadow-xs gap-0.5">
                    {[
                      { id: 'not_enhanced', label: 'غير محسنة (الافتراضي)' },
                      { id: 'enhanced', label: '✨ المحسنة', icon: <SparklesIcon className="w-3.5 h-3.5 text-amber-300 inline shrink-0" /> },
                      { id: 'edited', label: '✂️ معدلة' },
                      { id: 'all', label: 'الكل' },
                    ].map((item) => {
                      const isActive = filterEnhanced === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setFilterEnhanced(item.id as any)}
                          style={{
                            backgroundColor: isActive ? '#0D5C63' : '#ffffff',
                            color: isActive ? '#ffffff' : '#374151',
                          }}
                          className={`px-2.5 py-1 rounded-md font-bold text-xs transition-all flex items-center gap-1 cursor-pointer border ${
                            isActive ? 'border-teal-800 shadow-xs' : 'border-transparent hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* Scrollable Maids Cards Area: 3 Columns for Full Portrait View */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 pl-1 py-1">
              {loadingMaids ? (
                <div className="h-full flex flex-col justify-center items-center gap-2 text-teal-900 font-medium py-16">
                  <RefreshIcon className="w-6 h-6 animate-spin text-teal-800" />
                  <span className="text-xs">جاري تحميل صور العاملات وتطبيق الفلاتر...</span>
                </div>
              ) : maids.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center text-gray-400 text-xs space-y-2 py-16">
                  <p>لم يتم العثور على عاملات مطابقة للفلاتر والبحث الحالي</p>
                  {isAnyFilterActive && (
                    <button
                      onClick={handleResetFilters}
                      className="px-3 py-1.5 bg-teal-900 text-white rounded-xl text-xs font-bold shadow hover:bg-teal-800 transition-colors inline-block"
                    >
                      إعادة ضبط جميع الفلاتر
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-3">
                  {maids.map((maid) => {
                    const isSelected = selectedMaidInfo?.id === maid.id;

                    return (
                      <div
                        key={maid.id}
                        onClick={() => handleSelectMaid(maid, maid.mainImage, maid.personalPhoto ? 'personalPhoto' : 'fullPhoto')}
                        className={`group cursor-pointer rounded-2xl border p-2 bg-white transition-all flex flex-col justify-between hover:shadow-lg relative ${
                          isSelected
                            ? 'border-teal-700 ring-2 ring-teal-700/40 shadow-md bg-teal-50/20'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* Portrait Image Container - Natural uncropped full portrait */}
                        <div className="relative h-48 w-full rounded-xl overflow-hidden bg-slate-900/10 shrink-0 flex items-center justify-center border border-gray-100 select-none">
                          <img
                            src={maid.mainImage}
                            alt={maid.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          
                          {/* AI Enhanced vs Edited Badges on Card */}
                          {maid.isMainImageEnhanced ? (
                            <div 
                              className="absolute top-1.5 left-1.5 z-20 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-lg flex items-center gap-0.5 border border-white/90 whitespace-nowrap"
                              style={{ backgroundColor: '#059669', color: '#ffffff' }}
                              title="تم تحسين وتوضيح هذه الصورة بالذكاء الاصطناعي بدقة عالية"
                            >
                              <SparklesIcon className="w-3 h-3 text-amber-300 shrink-0 animate-pulse" />
                              <span>✨ محسنة</span>
                            </div>
                          ) : maid.isMainImageEdited ? (
                            <div 
                              className="absolute top-1.5 left-1.5 z-20 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-lg flex items-center gap-0.5 border border-white/90 whitespace-nowrap"
                              style={{ backgroundColor: '#D97706', color: '#ffffff' }}
                              title="تم قص أو تدوير أو تعديل هذه الصورة يدوياً"
                            >
                              <span>✂️ معدلة</span>
                            </div>
                          ) : null}

                          {/* Approval Status Badge */}
                          {maid.isApproved && (
                            <div 
                              className="absolute bottom-1.5 right-1.5 z-20 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-0.5 border border-emerald-300/60"
                              style={{ backgroundColor: '#064e3b', color: '#ffffff' }}
                              title="عاملة معتمدة في النظام"
                            >
                              <CheckIcon className="w-2.5 h-2.5 text-emerald-300" />
                              <span>معتمدة</span>
                            </div>
                          )}

                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 bg-teal-900 text-white rounded-full p-0.5 shadow-md ring-2 ring-white z-20">
                              <CheckCircleIcon className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>

                        {/* Middle Info */}
                        <div className="text-right my-2 flex-1 flex flex-col justify-center">
                          <div className="flex items-center justify-between gap-1.5">
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="font-bold text-sm text-gray-900 truncate leading-snug select-text cursor-text flex items-center gap-1 group/name flex-1 min-w-0" 
                              title="اضغط للنسخ أو حدد النص"
                            >
                              <span className="truncate">{maid.name}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(maid.name);
                                  if (showToast) showToast('تم نسخ اسم العاملة بنجاح! 📋', 'success');
                                }}
                                className="opacity-0 group-hover/name:opacity-100 hover:opacity-100 p-0.5 text-gray-400 hover:text-teal-800 rounded transition-opacity shrink-0"
                                title="نسخ الاسم"
                              >
                                <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {maid.isMainImageEnhanced ? (
                              <span 
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0"
                                style={{ backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}
                              >
                                ✨ HD
                              </span>
                            ) : maid.isMainImageEdited ? (
                              <span 
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0"
                                style={{ backgroundColor: '#fffbeb', color: '#92400e', borderColor: '#fde68a' }}
                              >
                                ✂️ معدلة
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-gray-600 flex justify-between items-center mt-1 font-medium">
                            <span className="truncate">{maid.nationality || 'غير محدد'}</span>
                            <span 
                              onClick={(e) => e.stopPropagation()}
                              className="font-mono text-gray-400 text-xs shrink-0 select-text cursor-text hover:text-gray-700"
                              title="رقم الجواز (قابل للتحديد والنسخ)"
                            >
                              {maid.passportNumber || ''}
                            </span>
                          </div>
                        </div>

                        {/* Bottom Photo Options */}
                        <div className="pt-1.5 border-t border-gray-100 flex items-center justify-end gap-1.5 shrink-0">
                          {maid.personalPhoto && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectMaid(maid, maid.personalPhoto!, 'personalPhoto');
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                                isSelected && selectedPhotoType === 'personalPhoto'
                                  ? 'bg-teal-900 text-white font-bold shadow-xs'
                                  : maid.isPersonalEnhanced
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-bold'
                                  : maid.isPersonalEdited
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-bold'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium'
                              }`}
                            >
                              <span>شخصية</span>
                              {maid.isPersonalEnhanced ? (
                                <span className="text-amber-500 font-bold text-[10px]" title="صورة شخصية محسنة">✨</span>
                              ) : maid.isPersonalEdited ? (
                                <span className="text-amber-600 font-bold text-[10px]" title="صورة شخصية معدلة">✂️</span>
                              ) : null}
                            </button>
                          )}
                          {maid.fullPhoto && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectMaid(maid, maid.fullPhoto!, 'fullPhoto');
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                                isSelected && selectedPhotoType === 'fullPhoto'
                                  ? 'bg-teal-900 text-white font-bold shadow-xs'
                                  : maid.isFullEnhanced
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-bold'
                                  : maid.isFullEdited
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-bold'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium'
                              }`}
                            >
                              <span>كاملة</span>
                              {maid.isFullEnhanced ? (
                                <span className="text-amber-500 font-bold text-[10px]" title="صورة كاملة محسنة">✨</span>
                              ) : maid.isFullEdited ? (
                                <span className="text-amber-600 font-bold text-[10px]" title="صورة كاملة معدلة">✂️</span>
                              ) : null}
                            </button>
                          )}
                          {maid.passportPhoto && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectMaid(maid, maid.passportPhoto!, 'passportPhoto');
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                                isSelected && selectedPhotoType === 'passportPhoto'
                                  ? 'bg-teal-900 text-white font-bold shadow-xs'
                                  : maid.isPassportEnhanced
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-bold'
                                  : maid.isPassportEdited
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-bold'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium'
                              }`}
                            >
                              <span>الجواز</span>
                              {maid.isPassportEnhanced ? (
                                <span className="text-amber-500 font-bold text-[10px]" title="صورة جواز محسنة">✨</span>
                              ) : maid.isPassportEdited ? (
                                <span className="text-amber-600 font-bold text-[10px]" title="صورة جواز معدلة">✂️</span>
                              ) : null}
                            </button>
                          )}
                          {!maid.fullPhoto && !maid.passportPhoto && !maid.personalPhoto && (
                            <span className="text-[10px] text-gray-400">الصورة الرئيسية</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination Footer (Shrink-0) */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs shrink-0">
                <span className="text-gray-500 text-[10px]">
                  صفحة {maidPage} من {totalPages} (إجمالي {totalMaids} عاملة)
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => fetchMaids(maidPage - 1, maidSearchTerm, filterNationality, filterStatus, filterEnhanced)}
                    disabled={maidPage <= 1 || loadingMaids}
                    className="px-2.5 py-1 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 flex items-center gap-1 font-medium transition-colors text-[10px] shadow-xs"
                  >
                    <ChevronRightIcon className="w-3 h-3" />
                    السابق
                  </button>
                  <button
                    onClick={() => fetchMaids(maidPage + 1, maidSearchTerm, filterNationality, filterStatus, filterEnhanced)}
                    disabled={maidPage >= totalPages || loadingMaids}
                    className="px-2.5 py-1 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 flex items-center gap-1 font-medium transition-colors text-[10px] shadow-xs"
                  >
                    التالي
                    <ChevronLeftIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Left Column: AI Workstation & Live Comparison (xl:col-span-5 2xl:col-span-5) */}
          <div className="xl:col-span-5 2xl:col-span-5 h-full flex flex-col gap-2.5 overflow-hidden">
            
            {/* Top Control Panel: Maid Info & Action Button */}
            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="font-bold text-gray-800 text-xs md:text-sm flex items-center gap-1.5">
                  <SparklesIcon className="w-4 h-4 text-teal-800" />
                  مكان التعديل والتحسين
                </span>
              </div>

              {/* Selected Worker Info Card */}
              {selectedMaidInfo ? (
                <div className="p-2.5 bg-gradient-to-br from-teal-50/70 to-indigo-50/50 rounded-xl border border-teal-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-gray-500 text-[10px] block">العاملة:</span>
                    <div className="flex items-center gap-1 group/panelname">
                      <strong className="text-gray-900 font-bold text-xs truncate block select-text cursor-text" title="تحديد ونسخ الاسم">
                        {selectedMaidInfo.name}
                      </strong>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedMaidInfo.name);
                          if (showToast) showToast('تم نسخ اسم العاملة بنجاح! 📋', 'success');
                        }}
                        className="p-0.5 text-gray-400 hover:text-teal-800 rounded transition-colors shrink-0"
                        title="نسخ اسم العاملة"
                      >
                        <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-gray-500 text-[10px] block">الجنسية:</span>
                    <span className="font-medium text-gray-800 text-xs truncate block">{selectedMaidInfo.nationality || 'غير محدد'}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-gray-500 text-[10px] block">الاعتماد:</span>
                    <span className={`font-bold text-xs block ${selectedMaidInfo.isApproved ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {selectedMaidInfo.isApproved ? 'معتمدة ✓' : 'غير معتمدة'}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-gray-500 text-[10px] block">نوع الصورة:</span>
                    <span className="bg-teal-800 text-white text-[10px] px-2 py-0.5 rounded font-bold inline-block">
                      {selectedPhotoType === 'personalPhoto' ? 'الشخصية' : selectedPhotoType === 'fullPhoto' ? 'كاملة' : 'الجواز'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500 text-center">
                  👈 الرجاء اختيار عاملة من المعرض للبدء بالتحسين والمعاينة
                </div>
              )}

              {/* AI Enhancement Quota Indicator */}
              {selectedMaidInfo && (
                <div className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl border bg-gray-50 border-gray-200">
                  <span className="text-gray-700 font-bold flex items-center gap-1.5 text-xs">
                    <SparklesIcon className="w-3.5 h-3.5 text-teal-800" />
                    رصيد الذكاء الاصطناعي للعاملة:
                  </span>
                  <span 
                    className={`px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1 border ${
                      (selectedMaidInfo.remainingAiQuota ?? 2) === 2
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : (selectedMaidInfo.remainingAiQuota ?? 2) === 1
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-red-50 text-red-800 border-red-300'
                    }`}
                  >
                    {(selectedMaidInfo.remainingAiQuota ?? 2) === 0 ? (
                      <span>⛔ تم استنفاذ الرصيد (0/2)</span>
                    ) : (
                      <span>⚡ {(selectedMaidInfo.remainingAiQuota ?? 2)} من 2 متبقي</span>
                    )}
                  </span>
                </div>
              )}

              {/* Exhausted Quota Warning */}
              {selectedMaidInfo && (selectedMaidInfo.remainingAiQuota ?? 2) <= 0 && (
                <div 
                  className="p-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs border"
                  style={{ backgroundColor: '#fff1f2', borderColor: '#fecdd3', color: '#881337' }}
                >
                  <ExclamationCircleIcon className="w-4 h-4 text-red-600 shrink-0" />
                  <div className="leading-tight">
                    <span className="font-extrabold block text-red-950 text-xs">
                      ⛔ تم استنفاذ الحد الأقصى لتحسين الذكاء الاصطناعي (مرتان)
                    </span>
                    <span className="text-[11px] text-red-800 block mt-0.5">
                      يمكنك استخدام أدوات القص والتأطير والتدوير اليدوية في أي وقت مجاناً بدون قيود.
                    </span>
                  </div>
                </div>
              )}

              {/* Enhanced Photo Alert in Left Panel (Red Warning) */}
              {selectedImage && (selectedImage.toLowerCase().includes('enhanced') || selectedImage.toLowerCase().includes('homemaid-enhanced')) && (selectedMaidInfo?.remainingAiQuota ?? 2) > 0 && (
                <div 
                  className="p-2 rounded-xl text-xs flex items-center gap-2 shadow-xs border"
                  style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#7f1d1d' }}
                >
                  <ExclamationCircleIcon className="w-4 h-4 text-red-600 shrink-0 animate-pulse" />
                  <div className="leading-tight">
                    <span className="font-extrabold block text-red-900 text-[11px]">
                      ⚠️ تنبيه: هذه الصورة محسنة ومخزنة مسبقاً
                    </span>
                    <span className="text-[10px] text-red-800 block">
                      عند الضغط على زر التحسين، سيطلب منك النظام تأكيد رغبتك قبل إعادة التوليد.
                    </span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => {
                  const isAlreadyEnhanced = selectedImage && (
                    selectedImage.toLowerCase().includes('enhanced') || 
                    selectedImage.toLowerCase().includes('homemaid-enhanced')
                  );
                  if (isAlreadyEnhanced) {
                    setShowReEnhanceConfirmModal(true);
                  } else {
                    handleProcessImage();
                  }
                }}
                disabled={loading || !selectedImage || ((selectedMaidInfo?.remainingAiQuota ?? 2) <= 0)}
                className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all text-xs md:text-sm ${
                  ((selectedMaidInfo?.remainingAiQuota ?? 2) <= 0)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-300 shadow-none'
                    : 'bg-gradient-to-r from-teal-900 to-indigo-900 hover:from-teal-800 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white cursor-pointer active:scale-98'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshIcon className="w-4 h-4 animate-spin text-amber-300" />
                    <span>جاري توضيح وترميم الصورة عبر الذكاء الاصطناعي...</span>
                  </>
                ) : ((selectedMaidInfo?.remainingAiQuota ?? 2) <= 0) ? (
                  <>
                    <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
                    <span>⛔ تم استنفاذ رصيد الذكاء الاصطناعي (2/2)</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4 text-amber-300" />
                    <span>✨ بدء توضيح وتحسين الصورة الآن</span>
                  </>
                )}
              </button>

              {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-1.5">
                  <ExclamationCircleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="leading-tight">{error}</span>
                </div>
              )}
            </div>

            {/* Bottom Live Result & Comparison Panel (Side-by-Side Only) */}
            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 min-h-0 flex flex-col">
                {/* Preview Toolbar (Shrink-0) */}
                <div className="flex flex-wrap items-center justify-between pb-2 border-b border-gray-100 mb-2 gap-1 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <EyeIcon className="w-4 h-4 text-teal-800" />
                    <h2 className="font-bold text-gray-800 text-xs md:text-sm">معاينة ومقارنة النتيجة جنباً لجنب</h2>
                    {elapsedTime && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.2 rounded-full font-bold border border-emerald-200">
                        ⚡ {elapsedTime}
                      </span>
                    )}
                    {isSaved && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.2 rounded-full font-bold border border-emerald-300 flex items-center gap-0.5">
                        <CheckIcon className="w-3 h-3" />
                        تم الحفظ بالملف
                      </span>
                    )}
                  </div>

                  {/* Zoom Controls & Tools */}
                  {selectedImage && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {/* Photo Editing Tools (Rotate, Crop, Flip, Reset) */}
                      <div className="flex items-center gap-1 bg-amber-50/60 p-0.5 rounded-lg border border-amber-200">
                        {/* Rotate 90 deg */}
                        <button
                          onClick={handleRotate90}
                          className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-200 rounded text-amber-900 font-bold text-[10px] flex items-center gap-1 transition-colors shadow-2xs"
                          title="تدوير الصورة 90 درجة مع عقارب الساعة (لتحويل الصورة الأفقية إلى رأسية)"
                        >
                          <RefreshIcon className="w-3 h-3 text-amber-700" />
                          <span>تدوير 90°</span>
                        </button>

                        {/* Crop / Frame */}
                        <button
                          onClick={() => {
                            setCropZoom(1);
                            setCropOffsetX(0);
                            setCropOffsetY(0);
                            setShowCropModal(true);
                          }}
                          className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-200 rounded text-amber-900 font-bold text-[10px] flex items-center gap-1 transition-colors shadow-2xs"
                          title="قص وتأطير الصورة بأبعاد البورتريه"
                        >
                          <span>✂️ قص</span>
                        </button>

                        {/* Flip Horizontal */}
                        <button
                          onClick={handleFlipHorizontal}
                          className="p-1 bg-white hover:bg-amber-100 border border-amber-200 rounded text-amber-800 text-[10px] flex items-center transition-colors shadow-2xs"
                          title="قلب الصورة أفقياً (مرآة)"
                        >
                          <span>↔️</span>
                        </button>

                        {/* Revert / Reset (Local) */}
                        {originalBackupUrl && (
                          <button
                            onClick={handleResetToOriginal}
                            className="px-1.5 py-0.5 bg-white hover:bg-red-50 border border-red-200 rounded text-red-700 font-bold text-[10px] flex items-center gap-0.5 transition-colors shadow-2xs"
                            title="إلغاء التعديلات غير المحفوظة والعودة للصورة الحالية"
                          >
                            <span>↺ تراجع</span>
                          </button>
                        )}

                        {/* Restore Original from Server */}
                        {(selectedMaidInfo?.isEnhanced || selectedMaidInfo?.isEdited || selectedMaidInfo?.hasBackup || (selectedImage && (selectedImage.toLowerCase().includes('enhanced') || selectedImage.toLowerCase().includes('edited')))) && (
                          <button
                            onClick={() => setShowRestoreConfirmModal(true)}
                            className="px-2 py-0.5 bg-white hover:bg-rose-50 border border-rose-200 rounded text-rose-700 font-bold text-[10px] flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                            title="استعادة الصورة الأصلية السابقة للعاملة من السيرفر وإلغاء أي تحسين أو قص"
                          >
                            <RefreshIcon className="w-3 h-3 text-rose-600" />
                            <span>استعادة الأصل ↺</span>
                          </button>
                        )}
                      </div>

                      {/* Zoom Controls */}
                      <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                        <button
                          onClick={() => setZoomLevel(prev => Math.max(1, +(prev - 0.5).toFixed(1)))}
                          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-white rounded"
                          title="تصغير"
                        >
                          <ZoomOutIcon className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono text-[10px] font-bold px-1 text-gray-700 min-w-[28px] text-center">
                          {zoomLevel}x
                        </span>
                        <button
                          onClick={() => setZoomLevel(prev => Math.min(4, +(prev + 0.5).toFixed(1)))}
                          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-white rounded"
                          title="تكبير"
                        >
                          <ZoomInIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Fit Mode */}
                      <button
                        onClick={() => setFitMode(prev => prev === 'contain' ? 'cover' : 'contain')}
                        className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-gray-700 font-medium text-[10px]"
                        title="تبديل ملء الإطار / الحجم الكامل"
                      >
                        {fitMode === 'contain' ? 'تناسق 📐' : 'ملء 🔲'}
                      </button>

                      {/* Lightbox / Fullscreen */}
                      <button
                        onClick={() => setIsLightboxOpen(true)}
                        className="p-1 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-gray-700"
                        title="تكبير بملء الشاشة"
                      >
                        <ArrowsExpandIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Preview Image Stage */}
                <div className="flex-1 min-h-0 flex flex-col justify-center">
                  {!selectedImage ? (
                    <div className="py-12 text-center text-gray-400">
                      <UserGroupIcon className="w-12 h-12 mx-auto mb-2 opacity-30 text-teal-800" />
                      <p className="text-xs font-medium">الرجاء اختيار عاملة من المعرض للبدء بالمعاينة والتحسين</p>
                    </div>
                  ) : (
                    <div className="h-full w-full flex flex-col">
                      
                      {/* Mode: Side-by-Side View (Direct & Only Comparison Mode) */}
                      {enhancedImage ? (
                        <div className="h-full grid grid-cols-2 gap-2.5">
                          {/* Right Box: Original */}
                          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950 flex flex-col h-full shadow-inner">
                            <div className="p-1.5 bg-slate-900 text-slate-300 text-[10px] font-bold flex justify-between items-center border-b border-slate-800 shrink-0">
                              <span>الأصلية (قبل المعالجة)</span>
                              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">1x</span>
                            </div>
                            <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden p-2">
                              <img
                                src={selectedImage}
                                alt="Original"
                                style={{ transform: `scale(${zoomLevel})` }}
                                className={`max-w-full max-h-full ${fitMode === 'cover' ? 'w-full h-full object-cover' : 'object-contain'} transition-transform duration-100 rounded`}
                              />
                            </div>
                          </div>

                          {/* Left Box: Enhanced */}
                          <div className="rounded-xl border-2 border-teal-600 overflow-hidden bg-slate-950 flex flex-col h-full shadow-md">
                            <div className="p-1.5 bg-teal-950 text-teal-100 text-[10px] font-bold flex justify-between items-center border-b border-teal-800 shrink-0">
                              <span className="flex items-center gap-1">
                                <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
                                <span>✨ المحسنة بالذكاء الاصطناعي</span>
                              </span>
                              <span className="text-[9px] bg-teal-800 text-teal-200 px-1.5 py-0.2 rounded font-mono">HD</span>
                            </div>
                            <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden p-2">
                              <img
                                src={enhancedImage}
                                alt="Enhanced"
                                style={{ transform: `scale(${zoomLevel})` }}
                                className={`max-w-full max-h-full ${fitMode === 'cover' ? 'w-full h-full object-cover' : 'object-contain'} transition-transform duration-100 rounded`}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Pre-Processing State / Single Selected Original Viewer */
                        <div className="relative flex-1 min-h-0 w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center p-2">
                          {selectedImage ? (
                            <img
                              src={selectedImage}
                              alt="Selected Original"
                              style={{ transform: `scale(${zoomLevel})` }}
                              className={`max-w-full max-h-full ${fitMode === 'cover' ? 'w-full h-full object-cover' : 'object-contain'} transition-transform duration-100 rounded-lg shadow-lg`}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.opacity = '0.3';
                              }}
                            />
                          ) : (
                            <div className="text-gray-400 text-xs text-center p-4">
                              لا توجد صورة متوفرة لهذا النوع
                            </div>
                          )}
                          <span className="absolute top-2.5 right-2.5 bg-gray-900/90 text-white text-[10px] px-2.5 py-1 rounded-md font-bold backdrop-blur-sm shadow">
                            الصورة المختارة
                          </span>

                          {loading && (
                            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-2.5 z-20">
                              <RefreshIcon className="w-8 h-8 animate-spin text-indigo-400" />
                              <span className="text-xs font-bold text-white">
                                جاري معالجة وتوضيح الصورة بالذكاء الاصطناعي...
                              </span>
                              <span className="text-[10px] text-indigo-200">يستغرق حوالي 5 إلى 15 ثانية</span>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer (Shrink-0) - Replace Button on Right, Actions on Left */}
              {(enhancedImage || originalBackupUrl) && (
                <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2 shrink-0 mt-2">
                  {/* Right side in RTL: Replace Worker Photo Button */}
                  <div>
                    {selectedMaidInfo && (
                      <button
                        onClick={handleReplaceWorkerPhoto}
                        disabled={savingToProfile || isSaved}
                        style={{ backgroundColor: isSaved ? '#047857' : enhancedImage ? '#0D5C63' : '#B45309' }}
                        className="px-4 py-2 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm hover:opacity-95 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {savingToProfile ? (
                          <>
                            <RefreshIcon className="w-3.5 h-3.5 animate-spin text-white" />
                            <span className="text-white font-bold">جاري الحفظ...</span>
                          </>
                        ) : isSaved ? (
                          <>
                            <CheckIcon className="w-3.5 h-3.5 text-white" />
                            <span className="text-white font-bold">تم الحفظ بنجاح ✓</span>
                          </>
                        ) : enhancedImage ? (
                          <>
                            <DocumentDuplicateIcon className="w-3.5 h-3.5 text-amber-300" />
                            <span className="text-white font-bold">💾 استبدال بالصورة المحسنة</span>
                          </>
                        ) : (
                          <>
                            <DocumentDuplicateIcon className="w-3.5 h-3.5 text-amber-200" />
                            <span className="text-white font-bold">💾 حفظ واستبدال الصورة المعدلة</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Left side in RTL: Expand & Download Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsLightboxOpen(true)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
                    >
                      <ArrowsExpandIcon className="w-3.5 h-3.5" />
                      <span>تكبير</span>
                    </button>

                    <a
                      href={enhancedImage || selectedImage}
                      target="_blank"
                      rel="noreferrer"
                      download={`${enhancedImage ? 'enhanced' : 'edited'}_${selectedMaidInfo?.name || 'maid'}.png`}
                      className="px-3.5 py-2 bg-teal-900 hover:bg-teal-800 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow transition-all"
                    >
                      <DownloadIcon className="w-3.5 h-3.5" />
                      <span>تحميل</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Fullscreen Lightbox Modal */}
        {isLightboxOpen && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-800 text-white">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">معاينة وتكبير الصورة بملء الشاشة</span>
                {selectedMaidInfo && <span className="text-teal-400 text-xs">({selectedMaidInfo.name})</span>}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-lg">
                  <button onClick={() => setZoomLevel(prev => Math.max(1, +(prev - 0.5).toFixed(1)))} className="p-1 hover:bg-gray-700 rounded text-gray-300">
                    <ZoomOutIcon className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono px-2">{zoomLevel}x</span>
                  <button onClick={() => setZoomLevel(prev => Math.min(5, +(prev + 0.5).toFixed(1)))} className="p-1 hover:bg-gray-700 rounded text-gray-300">
                    <ZoomInIcon className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center overflow-auto p-4">
              <img
                src={enhancedImage || selectedImage}
                alt="Full preview"
                style={{ transform: `scale(${zoomLevel})` }}
                className="max-w-full max-h-[85vh] object-contain transition-transform duration-100"
              />
            </div>
          </div>
        )}

        {/* Confirmation Modal for Re-Enhancing already enhanced photo */}
        {showReEnhanceConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-gray-100 text-right" dir="rtl">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="p-2.5 bg-red-100 text-red-600 rounded-2xl shrink-0">
                  <ExclamationCircleIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">تأكيد إعادة تحسين الصورة</h3>
                  <p className="text-xs text-gray-500 mt-0.5">هذه الصورة محسنة ومخزنة مسبقاً في ملف العاملة</p>
                </div>
              </div>

              <div 
                className="p-4 rounded-xl text-xs space-y-2 border"
                style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#7f1d1d' }}
              >
                <div className="font-bold text-sm text-red-950 flex items-center gap-1.5">
                  <span>⚠️ هل أنت متأكد من رغبتك في إعادة التحسين؟</span>
                </div>
                <p className="text-xs text-red-800 leading-relaxed font-medium">
                  صورة العاملة <strong className="text-red-950">({selectedMaidInfo?.name})</strong> الحالية هي صورة محسنة بالذكاء الاصطناعي بالفعل. عند المتابعة سيتم إرسال طلب جديد للموديل وتوليد صورة محسنة جديدة.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setShowReEnhanceConfirmModal(false);
                    handleProcessImage();
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <SparklesIcon className="w-4 h-4 text-amber-300" />
                  <span>نعم، متابعة التحسين مجدداً</span>
                </button>
                <button
                  onClick={() => setShowReEnhanceConfirmModal(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Crop & Framing Modal */}
        {showCropModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-gray-100 flex flex-col gap-4 text-right" dir="rtl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-amber-100 text-amber-900 rounded-xl text-sm">✂️</span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">قص وتأطير الصورة (Crop & Framing)</h3>
                    <p className="text-[11px] text-gray-500">اختر نسبة الأبعاد وحرك المؤشرات لضبط الإطار المطلوب</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCropModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Ratio Selector Buttons */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 block">نسبة الأبعاد (Aspect Ratio):</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: '3:4', label: '3:4 بورتريه', desc: 'موصى به' },
                    { id: '9:16', label: '9:16 طولي', desc: 'رأسي كامل' },
                    { id: '1:1', label: '1:1 مربع', desc: 'متساوي' },
                    { id: 'free', label: 'حر / أصلي', desc: 'النسبة الحالية' },
                  ].map((aspect) => (
                    <button
                      key={aspect.id}
                      type="button"
                      onClick={() => setCropAspect(aspect.id as any)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        cropAspect === aspect.id
                          ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold shadow-2xs'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-xs">{aspect.label}</div>
                      <div className="text-[9px] text-gray-400 font-normal">{aspect.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Focus Presets */}
              <div className="flex items-center gap-1.5 bg-teal-50/70 p-1.5 rounded-xl border border-teal-200 text-xs">
                <span className="text-[10px] font-bold text-teal-900 shrink-0">🎯 تركيز سريع:</span>
                <div className="flex-1 grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCropAspect('3:4');
                      setCropZoom(2.2);
                      setCropOffsetY(75);
                      setCropOffsetX(0);
                    }}
                    className="px-2 py-1 bg-white hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-lg text-[10px] font-bold transition-all text-center shadow-2xs"
                  >
                    👤 الرأس والوجه
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCropAspect('3:4');
                      setCropZoom(1.4);
                      setCropOffsetY(35);
                      setCropOffsetX(0);
                    }}
                    className="px-2 py-1 bg-white hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-lg text-[10px] font-bold transition-all text-center shadow-2xs"
                  >
                    🥋 النصف العلوي
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCropZoom(1);
                      setCropOffsetY(0);
                      setCropOffsetX(0);
                    }}
                    className="px-2 py-1 bg-white hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-lg text-[10px] font-bold transition-all text-center shadow-2xs"
                  >
                    🧍 الصورة كاملة
                  </button>
                </div>
              </div>

              {/* Live Framing Preview Canvas (WYSIWYG - Exactly what will be saved) */}
              <div className="relative w-full h-56 bg-slate-950 rounded-xl overflow-hidden flex flex-col items-center justify-center border border-slate-800 p-2">
                <div className="relative max-h-full max-w-full flex items-center justify-center">
                  <canvas
                    ref={(node) => {
                      cropCanvasRef.current = node;
                      if (node && cachedCropImgRef.current) {
                        drawFromCache(cachedCropImgRef.current, node);
                      }
                    }}
                    className="max-h-52 max-w-full object-contain rounded shadow-2xl border border-teal-500/40"
                  />
                  {cropLoading && (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center rounded">
                      <RefreshIcon className="w-6 h-6 animate-spin text-teal-400" />
                    </div>
                  )}
                </div>
                <span className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm text-teal-300 text-[9px] px-2 py-0.5 rounded font-mono border border-teal-800/50">
                  معاينة مباشرة ودقيقة
                </span>
              </div>

              {/* Controls: Zoom and Pan */}
              <div className="space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
                {/* Zoom */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold text-gray-700 min-w-[100px]">🔍 التقريب (Zoom):</span>
                  <input
                    type="range"
                    min="1"
                    max="3.5"
                    step="0.05"
                    value={cropZoom}
                    onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-teal-700 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                  />
                  <span className="font-mono text-[11px] font-bold text-teal-900 min-w-[36px] text-left">
                    {cropZoom.toFixed(1)}x
                  </span>
                </div>

                {/* Pan Y (Vertical - Top/Head vs Bottom) */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold text-gray-700 min-w-[100px]">↕️ رأسي (أعلى/أسفل):</span>
                  <div className="flex-1 flex items-center gap-1.5">
                    <span className="text-[9px] text-gray-400">أسفل</span>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={cropOffsetY}
                      onChange={(e) => setCropOffsetY(parseFloat(e.target.value))}
                      className="flex-1 accent-teal-700 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                    />
                    <span className="text-[9px] text-teal-800 font-bold">أعلى (الرأس)</span>
                  </div>
                  <span className="font-mono text-[11px] text-gray-600 min-w-[36px] text-left">
                    {cropOffsetY > 0 ? `+${cropOffsetY}` : cropOffsetY}%
                  </span>
                </div>

                {/* Pan X (Horizontal) */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold text-gray-700 min-w-[100px]">↔️ أفقي (يمين/يسار):</span>
                  <div className="flex-1 flex items-center gap-1.5">
                    <span className="text-[9px] text-gray-400">يسار</span>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={cropOffsetX}
                      onChange={(e) => setCropOffsetX(parseFloat(e.target.value))}
                      className="flex-1 accent-teal-700 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                    />
                    <span className="text-[9px] text-gray-500 font-bold">يمين</span>
                  </div>
                  <span className="font-mono text-[11px] text-gray-600 min-w-[36px] text-left">
                    {cropOffsetX > 0 ? `+${cropOffsetX}` : cropOffsetX}%
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  className="flex-1 bg-teal-800 hover:bg-teal-900 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <span>✂️ تطبيق القص والتأطير</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCropZoom(1);
                    setCropOffsetX(0);
                    setCropOffsetY(0);
                  }}
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                  title="إعادة ضبط التقريب والإزاحة"
                >
                  إعادة ضبط
                </button>
                <button
                  type="button"
                  onClick={() => setShowCropModal(false)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Restore Original Photo Confirmation Modal */}
        {showRestoreConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border"
                  style={{ backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}
                >
                  <RefreshIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm md:text-base">استعادة الصورة الأصلية السابقة</h3>
                  <p className="text-xs text-gray-500">إلغاء أي تعديل أو تحسين والرجوع للصورة الأصلية المخزنة</p>
                </div>
              </div>

              <div 
                className="p-3.5 rounded-xl border text-xs leading-relaxed space-y-2"
                style={{ backgroundColor: '#fff1f2', borderColor: '#fecdd3', color: '#881337' }}
              >
                <div className="flex justify-between items-center border-b pb-1.5" style={{ borderColor: '#fda4af' }}>
                  <span className="font-bold text-sm">العاملة: {selectedMaidInfo?.name}</span>
                  <span className="font-mono text-xs opacity-75">#{selectedMaidInfo?.id}</span>
                </div>
                <p className="font-medium text-xs">
                  سيقوم النظام باسترجاع الصورة الأصلية الخام التي كانت موجودة قبل إجراء التعديل أو التحسين، وسيتم تحديث ملف العاملة فوراً وتوثيق هذه العملية بتفاصيلها في سجل العمليات.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowRestoreConfirmModal(false)}
                  disabled={restoringPhoto}
                  className="px-5 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer border border-gray-200"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleRestoreOriginalPhoto}
                  disabled={restoringPhoto}
                  style={{ backgroundColor: '#DC2626', color: '#ffffff' }}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer hover:opacity-90 active:scale-98 disabled:opacity-50"
                >
                  {restoringPhoto ? (
                    <>
                      <RefreshIcon className="w-4 h-4 animate-spin text-white" />
                      <span className="text-white">جاري الاسترجاع...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4 text-white" />
                      <span className="text-white font-bold">تأكيد استعادة الصورة الأصلية</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
