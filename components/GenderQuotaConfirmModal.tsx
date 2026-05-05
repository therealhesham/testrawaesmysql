import { X } from "lucide-react";

export type GenderQuotaConfirmModalProps = {
  open: boolean;
  message: string;
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * تنبيه أنماط الحجز حسب الجنس — بديل عن alert المتصفح.
 */
export default function GenderQuotaConfirmModal({
  open,
  message,
  isSubmitting = false,
  onConfirm,
  onCancel,
}: GenderQuotaConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
      dir="rtl"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-amber-100 overflow-hidden"
        role="dialog"
        aria-labelledby="gender-quota-modal-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 bg-gradient-to-l from-amber-50 to-white px-5 py-4 border-b border-amber-100/80">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="shrink-0 rounded-full p-1.5 text-gray-500 hover:bg-amber-100/70 hover:text-gray-900 transition disabled:opacity-40"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-right flex-1 min-w-0">
            <h2 id="gender-quota-modal-title" className="text-amber-950 font-bold text-lg tracking-tight">
              تنبيه نسب الحجز
            </h2>
            <p className="text-amber-900/75 text-xs mt-1.5 leading-snug">
              قد يتجاوز هذا الحجز الحد المسموح للنسبة في فترة الاحتساب الحالية
            </p>
          </div>
          <div
            className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-800 text-lg font-bold shadow-inner"
            aria-hidden
          >
            !
          </div>
        </div>

        <div className="px-5 py-4 max-h-[min(45vh,320px)] overflow-y-auto border-b border-gray-100">
          <p className="text-right text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>

        <p className="px-5 pt-3 text-right text-xs text-gray-500">هل تريد المتابعة وإتمام الطلب رغم هذا التنبيه؟</p>

        <div className="flex flex-col-reverse sm:flex-row-reverse gap-2.5 px-5 pb-5 pt-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-teal-900 px-4 py-3 text-white font-semibold text-sm hover:bg-teal-800 disabled:opacity-55 transition flex items-center justify-center gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : null}
            متابعة الحجز
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-800 font-semibold text-sm hover:bg-gray-50 disabled:opacity-50 transition"
          >
            تراجع
          </button>
        </div>
      </div>
    </div>
  );
}
