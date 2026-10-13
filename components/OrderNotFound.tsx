import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  FileSearch, 
  ArrowRight, 
  Search, 
  RotateCw, 
  Home, 
  ListOrdered, 
  AlertCircle
} from 'lucide-react';

interface OrderNotFoundProps {
  orderId?: string | number | string[];
  errorMessage?: string | null;
  onRetry?: () => void;
}

export default function OrderNotFound({ orderId, errorMessage, onRetry }: OrderNotFoundProps) {
  const router = useRouter();
  const [searchInputState, setSearchInputState] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = searchInputState.trim();
    if (cleanId) {
      router.push(`/admin/track_order/${cleanId}`);
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      setIsRetrying(true);
      onRetry();
      setTimeout(() => setIsRetrying(false), 1000);
    } else {
      router.reload();
    }
  };

  const displayId = Array.isArray(orderId) ? orderId[0] : orderId;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-8 font-tajawal" dir="rtl">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden text-right">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-l from-teal-900 via-teal-800 to-emerald-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-20 -translate-y-20 blur-2xl pointer-events-none"></div>
          <div className="relative z-10 flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <FileSearch className="w-8 h-8 text-teal-200" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-teal-100 text-xs font-semibold mb-2 backdrop-blur-sm">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>تعذر العثور على السجل</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                الطلب {displayId ? <span className="text-amber-300">#{displayId}</span> : ''} غير موجود
              </h1>
              <p className="mt-2 text-sm text-teal-100/90 leading-relaxed">
                لم نتمكن من الوصول لبيانات هذا الطلب في قاعدة البيانات الحالية.
              </p>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Quick Search for Another Order */}
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">
              الانتقال المباشر إلى رقم طلب آخر:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchInputState}
                  onChange={(e) => setSearchInputState(e.target.value)}
                  placeholder="أدخل رقم الطلب هنا (مثال: 315)..."
                  className="w-full pl-4 pr-10 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all text-right"
                />
                <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <button
                type="submit"
                disabled={!searchInputState.trim()}
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 disabled:bg-gray-300 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                <span>بحث</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </form>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-3 items-center justify-between">
            {/* في أقصى اليمين: لوحة التحكم الرئيسية */}
            <button
              type="button"
              onClick={() => router.push('/admin/home')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-gray-950 text-xs md:text-sm font-bold rounded-xl bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer border border-gray-200/80 shadow-xs"
            >
              <Home className="w-4 h-4 text-teal-800" />
              <span>لوحة التحكم الرئيسية</span>
            </button>

            {/* في الزاوية اليسرى: الطلبات الحالية وإعادة المحاولة */}
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => router.push('/admin/currentorders')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer border border-teal-200/70"
              >
                <ListOrdered className="w-4 h-4 text-teal-700" />
                <span>الطلبات الحالية</span>
              </button>

              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer border border-gray-200"
              >
                <RotateCw className={`w-4 h-4 ${isRetrying ? 'animate-spin text-teal-700' : ''}`} />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
