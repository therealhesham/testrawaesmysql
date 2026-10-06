import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import axios from 'axios';
import {
  UserX,
  X,
  Check,
  ChevronDown,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { ToastContext } from 'components/GlobalToast';

export interface FailTrialModalProps {
  transfer?: any;
  workerName?: string;
  clientName?: string;
  transferId?: number | null;
  housedWorkerId?: number | null;
  initialReturnDate?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const FAIL_TRIAL_REASONS = [
  'عدم التوافق مع متطلبات العميل',
  'رفض العمل من قبل العاملة',
  'أسباب وظروف عائلية لدى العميل',
  'مشاكل أو أسباب صحية',
  'طلب العودة لبلدها',
  'أسباب أخرى',
];

const toEnDigits = (str: string | number | null | undefined): string => {
  return String(str ?? '')
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48));
};

const ModalDateField: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
}> = ({ label, value, onChange, required = true }) => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const formattedVal = value ? value.split('T')[0] : '';

  return (
    <div>
      <label className="block text-gray-600 font-medium mb-1 text-[11px]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative flex items-center">
        <input
          type="text"
          value={formattedVal}
          placeholder="YYYY-MM-DD"
          dir="ltr"
          required={required}
          onChange={(e) => {
            const v = toEnDigits(e.target.value);
            onChange(v);
          }}
          style={{
            fontFamily: 'Segoe UI, Arial, sans-serif',
            direction: 'ltr',
            textAlign: 'right',
          }}
          className="w-full h-9 bg-white border border-gray-200 rounded-xl pr-3 pl-8 text-xs font-bold text-gray-800 force-en-num focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
        <button
          type="button"
          onClick={() => {
            if (dateInputRef.current) {
              if (typeof dateInputRef.current.showPicker === 'function') {
                dateInputRef.current.showPicker();
              } else {
                dateInputRef.current.focus();
              }
            }
          }}
          className="absolute left-2 p-1 text-gray-400 hover:text-teal-700 transition-colors cursor-pointer"
          title="اختر التاريخ من التقويم"
        >
          <Calendar className="w-4 h-4" />
        </button>
        <input
          ref={dateInputRef}
          type="date"
          tabIndex={-1}
          value={formattedVal}
          onChange={(e) => onChange(toEnDigits(e.target.value))}
          className="sr-only"
        />
      </div>
    </div>
  );
};

export default function FailTrialModal({
  transfer,
  workerName,
  clientName,
  transferId,
  housedWorkerId,
  initialReturnDate,
  onClose,
  onSuccess,
}: FailTrialModalProps) {
  const effectiveWorkerName =
    workerName ||
    transfer?.HomeMaid?.Name ||
    transfer?.homeMaid?.Name ||
    transfer?.maid?.Name ||
    transfer?.Order?.Name ||
    transfer?.order?.Name ||
    transfer?.externalHomedmaid?.name ||
    transfer?.workerName ||
    transfer?.HomeMaidName ||
    '-';

  const effectiveClientName =
    clientName ||
    transfer?.NewClient?.fullname ||
    transfer?.newClient?.fullname ||
    transfer?.transferSponsorshipData?.newSponsorName ||
    transfer?.transferSponsorshipData?.clientName ||
    transfer?.Client?.fullname ||
    transfer?.client?.fullname ||
    transfer?.newSponsorName ||
    transfer?.clientName ||
    '-';

  const effectiveClientId =
    transfer?.NewClientId ||
    transfer?.NewClient?.id ||
    transfer?.newClient?.id ||
    transfer?.ClientId ||
    transfer?.Client?.id ||
    transfer?.client?.id ||
    transfer?.transferSponsorshipData?.newSponsorId ||
    null;

  const effectiveTransferId =
    transferId ||
    transfer?.id ||
    transfer?.transferSponsorshipData?.id ||
    null;

  const effectiveHousedWorkerId =
    housedWorkerId ||
    (transfer?.homeMaid_id ? transfer?.id : null) ||
    null;

  // استخراج تاريخ البدء
  const initialStartDate = useMemo(() => {
    const rawStart =
      transfer?.ExperimentStart ||
      transfer?.trialStartDate ||
      transfer?.transferSponsorshipData?.trialStartDate ||
      transfer?.deparatureHousingDate ||
      transfer?.EntryDate ||
      null;
    if (rawStart) {
      try {
        return new Date(rawStart).toISOString().split('T')[0];
      } catch (e) {
        // ignore
      }
    }
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  }, [transfer]);

  const [failReason, setFailReason] = useState('عدم التوافق مع متطلبات العميل');
  const [customReason, setCustomReason] = useState('');
  const [trialStartDate, setTrialStartDate] = useState(initialStartDate);
  const [returnDate, setReturnDate] = useState(
    initialReturnDate || new Date().toISOString().split('T')[0]
  );

  // حساب عدد الأيام تلقائياً بناء على تاريخ البدء والإرجاع
  const calculatedDays = useMemo(() => {
    if (!trialStartDate || !returnDate) return 1;
    const sParts = String(trialStartDate).split('-').map(Number);
    const rParts = String(returnDate).split('-').map(Number);
    if (sParts.length === 3 && rParts.length === 3) {
      const start = new Date(sParts[0], sParts[1] - 1, sParts[2]);
      const end = new Date(rParts[0], rParts[1] - 1, rParts[2]);
      const diffTime = end.getTime() - start.getTime();
      const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 1;
    }
    const start = new Date(trialStartDate);
    const end = new Date(returnDate);
    const diffTime = end.getTime() - start.getTime();
    const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 1;
  }, [trialStartDate, returnDate]);

  // الأجرة اليومية الافتراضية
  const initialDailyRate = useMemo(() => {
    const val =
      transfer?.dailyCost ||
      transfer?.transferSponsorshipData?.dailyCost ||
      50;
    return Number(val) || 50;
  }, [transfer]);

  const [dailyCost, setDailyCost] = useState<number | string>(initialDailyRate);

  // المبلغ المدفوع مسبقاً (عربون التجربة)
  const initialPaidAmount = useMemo(() => {
    const val =
      transfer?.Paid ||
      transfer?.transferSponsorshipData?.paidAmount ||
      transfer?.paidAmount ||
      0;
    return Number(val) || 0;
  }, [transfer]);

  const [paidAmount, setPaidAmount] = useState<number | string>(initialPaidAmount);

  // خيار تحصيل المبلغ في حال لم يدفع شيئاً
  const [isCollectedNow, setIsCollectedNow] = useState(false);

  // الحسابات المحاسبية التلقائية
  const cleanDailyCost = toEnDigits(dailyCost);
  const cleanPaid = toEnDigits(paidAmount);

  const numDays = calculatedDays;
  const numDailyCost = Math.max(0, parseFloat(cleanDailyCost) || 0);
  const numPaid = Math.max(0, parseFloat(cleanPaid) || 0);

  // إجمالي تكلفة التجربة = عدد الأيام × الأجرة اليومية
  const totalTrialCost = numDays * numDailyCost;

  // هل العميل دفع دفعة مسبقاً؟
  const hasUpfrontPayment = numPaid > 0;
  const remainingForClient = Math.max(0, numPaid - totalTrialCost);
  const remainingOnClient = Math.max(0, totalTrialCost - numPaid);

  const { showToast } = useContext(ToastContext);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const finalReason =
      failReason === 'أسباب أخرى' ? customReason.trim() || 'أسباب أخرى' : failReason;

    try {
      await axios.post('/api/transferSponsorShips', {
        action: 'fail_trial_return_housing',
        transferId: effectiveTransferId,
        housedWorkerId: effectiveHousedWorkerId,
        clientId: effectiveClientId,
        clientName: effectiveClientName,
        workerName: effectiveWorkerName,
        failReason: finalReason,
        trialStartDate: toEnDigits(trialStartDate),
        returnDate: toEnDigits(returnDate),
        trialDays: numDays,
        dailyCost: numDailyCost,
        totalTrialCost,
        paidAmount: numPaid,
        isCollectedNow,
        notes,
      });

      if (showToast) {
        showToast('تم توثيق إرجاع العاملة وتحديث الحساب بنجاح', 'success');
      }
      onSuccess();
    } catch (err: any) {
      console.error('Error failing trial:', err);
      setErrorMsg(err.response?.data?.error || 'حدث خطأ أثناء حفظ الإرجاع وتسجيل كشف الحساب');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fail-trial-modal fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-lg p-5 sm:p-6 flex flex-col gap-4 text-right animate-in zoom-in-95 duration-200 my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس المودال */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-red-50 text-red-800 rounded-xl">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                إنهاء التجربة وإرجاع العاملة للسكن
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                حساب تكلفة التجربة والتسجيل التلقائي في كشف حساب العميل
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* بطاقة العاملة والعميل */}
        <div className="bg-red-50/70 border border-red-200/80 rounded-2xl p-3.5 text-xs text-gray-800 flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">العاملة:</span>
            <span className="font-bold text-red-950 text-sm">{effectiveWorkerName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">العميل المجرّب:</span>
            <span className="font-semibold text-gray-800">{effectiveClientName}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
          {/* سبب فشل التجربة */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              سبب فشل التجربة / عدم التوافق <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
                className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl pr-3.5 pl-10 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-600 appearance-none bg-none cursor-pointer text-right"
              >
                {FAIL_TRIAL_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {failReason === 'أسباب أخرى' && (
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                تحديد السبب بالتفصيل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="اكتب سبب الفشل بالتفصيل..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-600"
              />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* حساب تكلفة التجربة تلقائياً */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 text-gray-700">
              <div className="flex items-center gap-1.5 font-bold">
                <Calculator className="w-4 h-4 text-teal-600" />
                <span>حساب تكلفة فترة التجربة</span>
              </div>
              <div className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200 flex items-center gap-1">
                <span>إجمالي التكلفة:</span>
                <span
                  className="font-bold text-teal-950"
                  dir="ltr"
                  style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}
                >
                  {totalTrialCost.toLocaleString('en-US')}
                </span>
                <span>ر.س</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <ModalDateField
                label="تاريخ بدء التجربة"
                value={trialStartDate}
                onChange={setTrialStartDate}
                required
              />

              <ModalDateField
                label="تاريخ الإرجاع للسكن"
                value={returnDate}
                onChange={setReturnDate}
                required
              />

              <div>
                <label className="block text-gray-600 font-medium mb-1 text-[11px]">
                  أيام التجربة
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    dir="ltr"
                    value={calculatedDays}
                    style={{
                      fontFamily: 'Segoe UI, Arial, sans-serif',
                      direction: 'ltr',
                      textAlign: 'right',
                    }}
                    className="w-full h-9 bg-gray-100/90 border border-gray-200 rounded-xl pr-3 pl-8 text-xs font-bold text-teal-950 cursor-not-allowed select-none focus:outline-none"
                  />
                  <span className="absolute left-2 text-[10px] text-gray-400 pointer-events-none">
                    يوم
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-gray-600 font-medium mb-1 text-[11px]">
                  الأجرة اليومية (ر.س/يوم)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  required
                  value={dailyCost}
                  onChange={(e) => {
                    const val = toEnDigits(e.target.value).replace(/[^0-9.]/g, '');
                    setDailyCost(val);
                  }}
                  style={{
                    fontFamily: 'Segoe UI, Arial, sans-serif',
                    direction: 'ltr',
                    textAlign: 'right',
                  }}
                  className="w-full h-9 bg-white border border-gray-200 rounded-xl px-3 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-medium mb-1 text-[11px]">
                  الدفعة المدفوعة عند بدء التجربة
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    dir="ltr"
                    value={`${numPaid.toLocaleString('en-US')} SAR`}
                    style={{
                      fontFamily: 'Segoe UI, Arial, sans-serif',
                      direction: 'ltr',
                      textAlign: 'right',
                    }}
                    className="w-full h-9 bg-gray-100/90 border border-gray-200 rounded-xl px-3 text-xs font-bold text-gray-700 cursor-not-allowed select-none focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* بطاقة كشف حساب العميل والخصم التلقائي */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {hasUpfrontPayment ? (
              /* حالة 1: العميل دفع دفعة مسبقاً ويتم الخصم منها وتسجيلها في كشف حسابه */
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col gap-1.5 text-emerald-950">
                <div className="flex items-center justify-between font-bold text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      توجد دفعة مسبقة (
                      <span
                        className="font-bold"
                        dir="ltr"
                        style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}
                      >
                        {numPaid.toLocaleString('en-US')}
                      </span>{' '}
                      ر.س)
                    </span>
                  </div>
                  {remainingForClient > 0 ? (
                    <span className="bg-emerald-700 text-white px-3 py-1 rounded-xl text-xs font-black shadow-sm flex items-center gap-1">
                      <span>المتبقي لإرجاعه للعميل:</span>
                      <span
                        dir="ltr"
                        style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}
                      >
                        {remainingForClient.toLocaleString('en-US')}
                      </span>
                      <span>ر.س</span>
                    </span>
                  ) : remainingOnClient > 0 ? (
                    <span className="bg-amber-700 text-white px-3 py-1 rounded-xl text-xs font-black shadow-sm flex items-center gap-1">
                      <span>المتبقي على العميل:</span>
                      <span
                        dir="ltr"
                        style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}
                      >
                        {remainingOnClient.toLocaleString('en-US')}
                      </span>
                      <span>ر.س</span>
                    </span>
                  ) : (
                    <span className="bg-blue-700 text-white px-3 py-1 rounded-xl text-xs font-black shadow-sm">
                      مسدد بالكامل (متعادل)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-emerald-800">
                  ✓ سيتم خصم تكلفة التجربة (
                  <span
                    className="font-bold"
                    dir="ltr"
                    style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}
                  >
                    {totalTrialCost.toLocaleString('en-US')}
                  </span>{' '}
                  ر.س) من دفعة العميل وتسجيل الحركات تلقائياً في كشف حسابه.
                </p>
              </div>
            ) : (
              /* حالة 2: العميل لم يدفع شيئاً عند بدء التجربة */
              <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3 flex flex-col gap-2.5 text-amber-950">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-red-100 text-red-600 rounded-lg shrink-0 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-amber-950">
                      تنبيه: العميل لم يدفع أي دفعة عند بدء التجربة (المستحق:{' '}
                      <span
                        className="font-bold text-red-700"
                        dir="ltr"
                        style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}
                      >
                        {totalTrialCost.toLocaleString('en-US')}
                      </span>{' '}
                      ر.س)
                    </div>
                    <div className="text-[11px] text-amber-800 mt-0.5">
                      حدد ما إذا تم استلام المبلغ من العميل الآن ليتم ضبط حسابه:
                    </div>
                  </div>
                </div>

                {/* خيار تحصيل المبلغ الآن */}
                <label className="flex items-center gap-2.5 bg-white p-2.5 rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-50/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={isCollectedNow}
                    onChange={(e) => setIsCollectedNow(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-gray-900">
                      تم أخذ وتحصيل المبلغ (
                      <span
                        className="font-bold"
                        dir="ltr"
                        style={{ fontFamily: 'Segoe UI, Arial, sans-serif' }}
                      >
                        {totalTrialCost.toLocaleString('en-US')}
                      </span>{' '}
                      ر.س) من العميل الآن
                    </span>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {isCollectedNow
                        ? '✓ سيضاف استحقاق وسداد المبلغ في كشف حساب العميل ليصبح حسابه مسدداً (0 ر.س).'
                        : '⚠️ في حال عدم التحديد، سيتم تسجيل المبلغ في كشف حسابه كمديونية مستحقة عليه (مديون لنا).'}
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* ملاحظات */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">ملاحظات وتقرير التجربة</label>
            <textarea
              rows={2}
              placeholder="اكتب أي ملاحظات أو تفاصيل حول فترة التجربة..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-600 resize-none"
            />
          </div>

          {/* أزرار الإجراء */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>
                {submitting ? 'جاري الحفظ وكشف الحساب...' : 'تأكيد فشل التجربة وإرجاع للسكن'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
